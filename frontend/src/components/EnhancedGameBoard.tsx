import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import audioService from '../services/EnhancedAudioService';
import { useGameStore } from '../store/GameContext';
import {
    getLevelDefinition,
    GHOST_CONFIGS,
    GhostType,
    LEVEL_DEFINITIONS,
    THEME_CONFIGS,
    ThemeConfig,
} from '../types/extended';
import type { Enemy, GameState } from '../types/game';
import type { ActivePowerUp, PowerUp } from '../types/powerup';
import { POWER_UP_CONFIG } from '../types/powerup';
import {
    applyScreenShake,
    Confetti,
    createConfetti,
    createFloatingText,
    createLevelTransition,
    createParticles,
    createScreenShake,
    createTrail,
    drawConfetti,
    drawFloatingTexts,
    drawLevelTransition,
    drawParticles,
    drawPowerUpAura,
    drawTrails,
    FloatingText,
    getComboColor,
    getPulse,
    getRainbowColor,
    LevelTransition,
    Particle,
    ScreenShake,
    Trail,
    updateConfetti,
    updateFloatingTexts,
    updateLevelTransition,
    updateParticles,
    updateTrails,
} from '../utils/effects';
import { generatePowerUps } from '../utils/powerups';
import './GameBoard.css';
import LevelCompleteModal from './LevelCompleteModal';

const SPEED = 3;
const PLAYER_LIVES = 3;
// Combo window timing is handled by GameContext

interface PlayerState {
  x: number;
  y: number;
  targetIndex: number;
  path: [number, number][];
  invincible: boolean;
  invincibleUntil: number;
}

interface ExtendedEnemy extends Enemy {
  ghostType: GhostType;
  frozen: boolean;
  frozenUntil: number;
  patrolPath: [number, number][];
  patrolIndex: number;
}

const GameBoard = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    state: gameStore,
    dispatch,
    updateCombo,
    resetCombo: _resetCombo,
    getSelectedSkinEmoji,
    getSelectedSkinTrail,
  } = useGameStore();

  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [foodsCollected, setFoodsCollected] = useState(0);
  const [actualTotalFoods, setActualTotalFoods] = useState(0);
  const [startTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [gameStatus, setGameStatus] = useState<'active' | 'paused' | 'completed' | 'failed'>(
    'active',
  );
  const [lives, setLives] = useState(PLAYER_LIVES);
  const [enemies, setEnemies] = useState<ExtendedEnemy[]>([]);
  const [cellSize, setCellSize] = useState(40);
  const [score, setScore] = useState(0);
  const [damageTaken, setDamageTaken] = useState(false);
  const [usedPowerUps, setUsedPowerUps] = useState(false);

  // Power-ups
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);

  // Effects
  const [screenShake, setScreenShake] = useState<ScreenShake | null>(null);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [transition, setTransition] = useState<LevelTransition | null>(null);

  // Theme
  const [theme, setTheme] = useState<ThemeConfig>(THEME_CONFIGS.classic);

  // Refs
  const animationFrameRef = useRef<number>();
  const mazeGridRef = useRef<string[][]>([]);
  const lastEnemyUpdateRef = useRef<number>(0);
  const playerEmoji = getSelectedSkinEmoji();
  const trailColor = getSelectedSkinTrail();

  // Get level configuration
  const levelDef = getLevelDefinition(parseInt(level || '1'));

  // Calculate responsive cell size
  const updateCellSize = useCallback((rows: number, cols: number) => {
    const maxWidth = window.innerWidth - 32;
    const maxHeight = window.innerHeight - 200;

    const sizeByWidth = Math.floor(maxWidth / cols);
    const sizeByHeight = Math.floor(maxHeight / rows);

    const newSize = Math.max(20, Math.min(60, Math.min(sizeByWidth, sizeByHeight)));
    setCellSize(newSize);
    return newSize;
  }, []);

  // Spawn ghosts with different types
  const spawnGhosts = useCallback(
    (
      grid: string[][],
      rows: number,
      cols: number,
      ghostConfig: { count: number; types: GhostType[] },
      playerStart: [number, number],
      currentCellSize: number,
    ): ExtendedEnemy[] => {
      const newEnemies: ExtendedEnemy[] = [];
      const safeDistance = 8;
      const levelNum = parseInt(level || '1');

      for (let i = 0; i < ghostConfig.count; i++) {
        let ex, ey, dist;
        let attempts = 0;
        do {
          ex = Math.floor(Math.random() * cols);
          ey = Math.floor(Math.random() * rows);
          dist = Math.sqrt(Math.pow(ex - playerStart[0], 2) + Math.pow(ey - playerStart[1], 2));
          attempts++;
        } while ((grid[ey][ex] === '#' || dist < safeDistance) && attempts < 100);

        if (grid[ey][ex] !== '#') {
          const ghostType = ghostConfig.types[i % ghostConfig.types.length];
          const config = GHOST_CONFIGS[ghostType];

          newEnemies.push({
            id: `ghost-${i}`,
            x: ex * currentCellSize + currentCellSize / 2,
            y: ey * currentCellSize + currentCellSize / 2,
            type: 'ghost',
            speed: config.speed + levelNum * 0.05,
            path: [],
            targetIndex: 0,
            ghostType,
            frozen: false,
            frozenUntil: 0,
            patrolPath: [],
            patrolIndex: 0,
          });
        }
      }
      return newEnemies;
    },
    [level],
  );

  // Load game
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        setTransition(createLevelTransition('in'));

        const levelNum = parseInt(level || '1');
        const def = getLevelDefinition(levelNum);
        setTheme(THEME_CONFIGS[def.theme]);

        // Generate local maze (simplified for now)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/game/new`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: levelNum }),
          },
        );
        const game = await response.json();

        setGameState(game);
        mazeGridRef.current = JSON.parse(JSON.stringify(game.maze_grid));

        // Count actual food items in the maze (cells that are not walls '#' or empty ' ')
        let foodCount = 0;
        for (let y = 0; y < game.maze_grid.length; y++) {
          for (let x = 0; x < game.maze_grid[y].length; x++) {
            const cell = game.maze_grid[y][x];
            if (cell !== '#' && cell !== ' ') {
              foodCount++;
            }
          }
        }
        // Use the actual food count from the maze
        setActualTotalFoods(foodCount);

        const initialCellSize = updateCellSize(game.rows, game.cols);

        const startX = game.start[0] * initialCellSize + initialCellSize / 2;
        const startY = game.start[1] * initialCellSize + initialCellSize / 2;

        setPlayerState({
          x: startX,
          y: startY,
          targetIndex: 0,
          path: [[game.start[0], game.start[1]]],
          invincible: false,
          invincibleUntil: 0,
        });

        // Spawn ghosts based on level definition
        setEnemies(
          spawnGhosts(
            game.maze_grid,
            game.rows,
            game.cols,
            { count: def.ghostCount, types: def.ghostTypes },
            game.start,
            initialCellSize,
          ),
        );

        // Generate power-ups
        const generatedPowerUps = generatePowerUps(
          game.maze_grid,
          game.rows,
          game.cols,
          { x: game.start[0], y: game.start[1] },
          { x: game.goal[0], y: game.goal[1] },
        );
        setPowerUps(generatedPowerUps);

        setLoading(false);
        setGameStatus('active');
        audioService.playLevelStart();

        // Start transition out
        setTimeout(() => {
          setTransition(createLevelTransition('out'));
        }, 100);
      } catch (error) {
        console.error('Failed to load game:', error);
        setLoading(false);
      }
    };

    loadGame();
  }, [level, updateCellSize, spawnGhosts]);

  // Update timer
  useEffect(() => {
    if (!loading && gameStatus === 'active') {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading, gameStatus]);

  // Check for active power-ups expiration
  useEffect(() => {
    const now = Date.now();
    const stillActive = activePowerUps.filter((p) => p.endsAt > now);

    if (stillActive.length !== activePowerUps.length) {
      const expired = activePowerUps.filter((p) => p.endsAt <= now);
      expired.forEach((p) => {
        audioService.playPowerUpEnd();
        setFloatingTexts((prev) => [
          ...prev,
          createFloatingText(
            canvasRef.current?.width ? canvasRef.current.width / 2 : 300,
            100,
            `${POWER_UP_CONFIG[p.type].name} ended!`,
            '#FF6B6B',
            16,
          ),
        ]);
      });
      setActivePowerUps(stillActive);
    }
  }, [currentTime, activePowerUps]);

  // BFS Pathfinding - Optimized for larger mazes
  const findPath = useCallback(
    (
      start: [number, number],
      end: [number, number],
      grid: string[][],
      rows: number,
      cols: number,
    ): [number, number][] | null => {
      // Quick checks
      if (start[0] === end[0] && start[1] === end[1]) return [start];
      if (grid[end[1]]?.[end[0]] === '#') return null;

      // Use 2D array for visited + parent tracking (faster than Map/Set with strings)
      const visited: boolean[][] = Array.from({ length: rows }, () => 
        Array(cols).fill(false)
      );
      const parent: ([number, number] | null)[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(null)
      );
      
      visited[start[1]][start[0]] = true;
      
      // Simple queue using array (dequeue from front, enqueue to back)
      const queue: [number, number][] = [start];
      let head = 0;
      
      const directions: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

      // Limit iterations for performance on large mazes
      const maxIterations = Math.min(rows * cols, 800);
      let iterations = 0;

      while (head < queue.length && iterations < maxIterations) {
        iterations++;
        const [cx, cy] = queue[head++];

        if (cx === end[0] && cy === end[1]) {
          // Reconstruct path
          const path: [number, number][] = [];
          let current: [number, number] | null = [cx, cy];
          while (current) {
            path.unshift(current);
            current = parent[current[1]][current[0]];
          }
          return path;
        }

        for (const [dx, dy] of directions) {
          const nx = cx + dx;
          const ny = cy + dy;

          if (
            nx >= 0 && nx < cols &&
            ny >= 0 && ny < rows &&
            !visited[ny][nx] &&
            grid[ny][nx] !== '#'
          ) {
            visited[ny][nx] = true;
            parent[ny][nx] = [cx, cy];
            queue.push([nx, ny]);
          }
        }
      }
      return null;
    },
    [],
  );

  // Handle click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      audioService.resume();

      if (!gameState || !playerState || gameStatus !== 'active') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const cellX = Math.floor(clickX / cellSize);
      const cellY = Math.floor(clickY / cellSize);

      if (cellX >= 0 && cellX < gameState.cols && cellY >= 0 && cellY < gameState.rows) {
        const cell = mazeGridRef.current[cellY][cellX];
        if (cell !== '#') {
          const currentCellX = Math.floor(playerState.x / cellSize);
          const currentCellY = Math.floor(playerState.y / cellSize);

          const path = findPath(
            [currentCellX, currentCellY],
            [cellX, cellY],
            mazeGridRef.current,
            gameState.rows,
            gameState.cols,
          );

          if (path) {
            const newPath = path.slice(1);
            if (newPath.length > 0) {
              setPlayerState({
                ...playerState,
                path: newPath,
                targetIndex: 0,
              });
              audioService.playMove();
            }
          }
        }
      }
    },
    [gameState, playerState, gameStatus, cellSize, findPath],
  );

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState || !playerState || gameStatus !== 'active') return;

      const currentCellX = Math.floor(playerState.x / cellSize);
      const currentCellY = Math.floor(playerState.y / cellSize);

      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dy = -1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dy = 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dx = -1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dx = 1;
          break;
        case 'Escape':
          setGameStatus('paused');
          return;
        default:
          return;
      }

      const targetX = currentCellX + dx;
      const targetY = currentCellY + dy;

      if (targetX >= 0 && targetX < gameState.cols && targetY >= 0 && targetY < gameState.rows) {
        const cell = mazeGridRef.current[targetY][targetX];
        if (cell !== '#') {
          setPlayerState((prev) =>
            prev
              ? {
                  ...prev,
                  path: [[targetX, targetY]],
                  targetIndex: 0,
                }
              : null,
          );
          audioService.playMove();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, playerState, gameStatus, cellSize]);

  // Collect power-up
  const collectPowerUp = useCallback(
    (powerUp: PowerUp) => {
      setUsedPowerUps(true);
      audioService.playPowerUp();

      const config = POWER_UP_CONFIG[powerUp.type];
      setActivePowerUps((prev) => [
        ...prev,
        {
          type: powerUp.type,
          endsAt: Date.now() + config.duration,
        },
      ]);

      setPowerUps((prev) => prev.filter((p) => p.id !== powerUp.id));

      // Create effects
      setParticles((prev) => [
        ...prev,
        ...createParticles(
          powerUp.position.x * cellSize + cellSize / 2,
          powerUp.position.y * cellSize + cellSize / 2,
          '#FFD700',
          20,
          'star',
        ),
      ]);

      setFloatingTexts((prev) => [
        ...prev,
        createFloatingText(
          powerUp.position.x * cellSize + cellSize / 2,
          powerUp.position.y * cellSize,
          config.name,
          '#FFD700',
          18,
        ),
      ]);

      // Apply freeze effect
      if (powerUp.type === 'freeze') {
        audioService.playFreeze();
        setEnemies((prev) =>
          prev.map((e) => ({
            ...e,
            frozen: true,
            frozenUntil: Date.now() + config.duration,
          })),
        );
      }
    },
    [cellSize],
  );

  // Handle player hit
  const handlePlayerHit = useCallback(() => {
    setDamageTaken(true);

    if (lives > 1) {
      setLives((l) => l - 1);
      setPlayerState((prev) =>
        prev
          ? {
              ...prev,
              invincible: true,
              invincibleUntil: Date.now() + 2000,
            }
          : null,
      );

      audioService.playHitFeedback();
      setScreenShake(createScreenShake(15, 400));

      if (playerState) {
        setParticles((prev) => [
          ...prev,
          ...createParticles(playerState.x, playerState.y, '#FF0000', 20),
        ]);
      }

      // Reset position
      if (gameState) {
        const startX = gameState.start[0] * cellSize + cellSize / 2;
        const startY = gameState.start[1] * cellSize + cellSize / 2;
        setTimeout(() => {
          setPlayerState((prev) =>
            prev
              ? {
                  ...prev,
                  x: startX,
                  y: startY,
                  path: [],
                  targetIndex: 0,
                  invincible: false,
                  invincibleUntil: 0,
                }
              : null,
          );
        }, 1000);
      }
    } else {
      setLives(0);
      setGameStatus('failed');
      audioService.playDie();
    }
  }, [lives, playerState, gameState, cellSize]);

  // Check collisions
  const checkCollisions = useCallback(() => {
    if (!playerState) return;

    const now = Date.now();

    // Check invincibility
    if (playerState.invincible && playerState.invincibleUntil > now) return;
    if (activePowerUps.some((p) => p.type === 'invincible' && p.endsAt > now)) return;

    for (const enemy of enemies) {
      if (enemy.frozen && enemy.frozenUntil > now) continue;

      const dist = Math.sqrt(
        Math.pow(enemy.x - playerState.x, 2) + Math.pow(enemy.y - playerState.y, 2),
      );
      if (dist < cellSize * 0.6) {
        handlePlayerHit();
        break;
      }
    }
  }, [playerState, enemies, cellSize, activePowerUps, handlePlayerHit]);

  // Update ghost AI
  const updateGhosts = useCallback(() => {
    if (!playerState || !gameState) return;

    const now = Date.now();

    // Unfreeze ghosts
    setEnemies((prev) =>
      prev.map((e) => ({
        ...e,
        frozen: e.frozen && e.frozenUntil > now,
      })),
    );

    // Update pathfinding every 500ms
    if (now - lastEnemyUpdateRef.current > 500) {
      lastEnemyUpdateRef.current = now;

      const playerCellX = Math.floor(playerState.x / cellSize);
      const playerCellY = Math.floor(playerState.y / cellSize);

      setEnemies((prevEnemies) =>
        prevEnemies.map((enemy) => {
          if (enemy.frozen) return enemy;

          const enemyCellX = Math.floor(enemy.x / cellSize);
          const enemyCellY = Math.floor(enemy.y / cellSize);
          const config = GHOST_CONFIGS[enemy.ghostType];

          const dist = Math.abs(enemyCellX - playerCellX) + Math.abs(enemyCellY - playerCellY);

          let newPath = enemy.path;
          let newTargetIndex = enemy.targetIndex;

          // Different AI based on ghost type
          if (enemy.ghostType === 'chaser' && dist < config.aggroRange) {
            // Always chase
            const path = findPath(
              [enemyCellX, enemyCellY],
              [playerCellX, playerCellY],
              mazeGridRef.current,
              gameState.rows,
              gameState.cols,
            );
            if (path && path.length > 1) {
              newPath = path.slice(1);
              newTargetIndex = 0;
            }
          } else if (enemy.ghostType === 'smart' && dist < config.aggroRange) {
            // Predict player movement
            const predictX =
              playerCellX +
              (playerState.path[0]?.[0] ? playerState.path[0][0] - playerCellX : 0) * 2;
            const predictY =
              playerCellY +
              (playerState.path[0]?.[1] ? playerState.path[0][1] - playerCellY : 0) * 2;
            const targetX = Math.max(0, Math.min(gameState.cols - 1, predictX));
            const targetY = Math.max(0, Math.min(gameState.rows - 1, predictY));
            const path = findPath(
              [enemyCellX, enemyCellY],
              [targetX, targetY],
              mazeGridRef.current,
              gameState.rows,
              gameState.cols,
            );
            if (path && path.length > 1) {
              newPath = path.slice(1);
              newTargetIndex = 0;
            }
          } else if (enemy.ghostType === 'patrol') {
            // Patrol or chase if close
            if (dist < config.aggroRange) {
              const path = findPath(
                [enemyCellX, enemyCellY],
                [playerCellX, playerCellY],
                mazeGridRef.current,
                gameState.rows,
                gameState.cols,
              );
              if (path && path.length > 1) {
                newPath = path.slice(1);
                newTargetIndex = 0;
              }
            } else if (enemy.path.length === 0 || enemy.targetIndex >= enemy.path.length) {
              // Random patrol
              const directions = [
                [0, 3],
                [0, -3],
                [3, 0],
                [-3, 0],
              ];
              const move = directions[Math.floor(Math.random() * directions.length)];
              const targetX = Math.max(0, Math.min(gameState.cols - 1, enemyCellX + move[0]));
              const targetY = Math.max(0, Math.min(gameState.rows - 1, enemyCellY + move[1]));
              const path = findPath(
                [enemyCellX, enemyCellY],
                [targetX, targetY],
                mazeGridRef.current,
                gameState.rows,
                gameState.cols,
              );
              if (path && path.length > 1) {
                newPath = path.slice(1);
                newTargetIndex = 0;
              }
            }
          } else if (
            enemy.ghostType === 'random' ||
            enemy.path.length === 0 ||
            enemy.targetIndex >= enemy.path.length
          ) {
            // Random movement
            const directions = [
              [0, 1],
              [0, -1],
              [1, 0],
              [-1, 0],
            ];
            const validMoves = directions.filter(([dx, dy]) => {
              const nx = enemyCellX + dx;
              const ny = enemyCellY + dy;
              return (
                nx >= 0 &&
                nx < gameState.cols &&
                ny >= 0 &&
                ny < gameState.rows &&
                mazeGridRef.current[ny][nx] !== '#'
              );
            });
            if (validMoves.length > 0) {
              const move = validMoves[Math.floor(Math.random() * validMoves.length)];
              newPath = [[enemyCellX + move[0], enemyCellY + move[1]]];
              newTargetIndex = 0;
            }
          }

          return { ...enemy, path: newPath, targetIndex: newTargetIndex };
        }),
      );
    }

    // Move ghosts
    setEnemies((prevEnemies) =>
      prevEnemies.map((enemy) => {
        if (enemy.frozen) return enemy;

        if (enemy.path.length > 0 && enemy.targetIndex < enemy.path.length) {
          const [targetCellX, targetCellY] = enemy.path[enemy.targetIndex];
          const targetX = targetCellX * cellSize + cellSize / 2;
          const targetY = targetCellY * cellSize + cellSize / 2;

          const dx = targetX - enemy.x;
          const dy = targetY - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const currentSpeed = enemy.speed * (cellSize / 40);

          if (distance < currentSpeed) {
            return { ...enemy, x: targetX, y: targetY, targetIndex: enemy.targetIndex + 1 };
          } else {
            return {
              ...enemy,
              x: enemy.x + (dx / distance) * currentSpeed,
              y: enemy.y + (dy / distance) * currentSpeed,
            };
          }
        }
        return enemy;
      }),
    );
  }, [playerState, gameState, cellSize, findPath]);

  // Game loop
  useEffect(() => {
    if (!gameState || !playerState || !canvasRef.current || loading || gameStatus !== 'active')
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Clear and apply effects
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Screen shake
      if (screenShake) {
        const shaking = applyScreenShake(ctx, screenShake);
        if (!shaking) setScreenShake(null);
      }

      // Draw maze
      drawMaze(ctx, gameState, mazeGridRef.current, theme);

      // Draw power-ups
      powerUps.forEach((powerUp) => {
        const px = powerUp.position.x * cellSize + cellSize / 2;
        const py = powerUp.position.y * cellSize + cellSize / 2;
        const floatOffset = Math.sin(Date.now() / 200) * 3;

        // Glow effect
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 20;
        ctx.font = `${cellSize * 0.7}px "Segoe UI Emoji"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUp.emoji, px, py + floatOffset);
        ctx.shadowBlur = 0;
      });

      // Update and draw effects
      setParticles((prev) => updateParticles(prev));
      drawParticles(ctx, particles);

      setTrails((prev) => updateTrails(prev));
      drawTrails(ctx, trails);

      setConfetti((prev) => updateConfetti(prev));
      drawConfetti(ctx, confetti);

      setFloatingTexts((prev) => updateFloatingTexts(prev));
      drawFloatingTexts(ctx, floatingTexts);

      // Update player movement
      const speedMultiplier = activePowerUps.some(
        (p) => p.type === 'speed' && p.endsAt > Date.now(),
      )
        ? 2
        : 1;
      const currentSpeed = SPEED * (cellSize / 40) * speedMultiplier;

      if (playerState.path.length > 0 && playerState.targetIndex < playerState.path.length) {
        const [targetCellX, targetCellY] = playerState.path[playerState.targetIndex];
        const targetX = targetCellX * cellSize + cellSize / 2;
        const targetY = targetCellY * cellSize + cellSize / 2;

        const dx = targetX - playerState.x;
        const dy = targetY - playerState.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Add trail
        if (trailColor) {
          const color = trailColor === 'rainbow' ? getRainbowColor(Date.now()) : trailColor;
          setTrails((prev) => [
            ...prev,
            createTrail(playerState.x, playerState.y, color, cellSize * 0.3),
          ]);
        }

        if (distance < currentSpeed) {
          playerState.x = targetX;
          playerState.y = targetY;

          // Track food collected this step
          let foodCollectedThisStep = false;

          // Check food collection
          const cell = mazeGridRef.current[targetCellY][targetCellX];
          if (cell !== '#' && cell !== ' ') {
            mazeGridRef.current[targetCellY][targetCellX] = ' ';
            foodCollectedThisStep = true;

            // Combo system
            updateCombo();
            const comboMultiplier = gameStore.combo.multiplier;
            const scoreMultiplier = activePowerUps.some(
              (p) => p.type === 'multiplier' && p.endsAt > Date.now(),
            )
              ? 2
              : 1;
            const points = Math.floor(100 * comboMultiplier * scoreMultiplier);

            setScore((prev) => prev + points);
            setFoodsCollected((prev) => prev + 1);

            if (gameStore.combo.count > 1) {
              audioService.playCombo(gameStore.combo.count);
              setFloatingTexts((prev) => [
                ...prev,
                createFloatingText(
                  targetX,
                  targetY - 20,
                  `${gameStore.combo.count}x COMBO!`,
                  getComboColor(gameStore.combo.count),
                  16 + Math.min(gameStore.combo.count, 10),
                ),
              ]);
            } else {
              audioService.playCollectFeedback();
            }

            setFloatingTexts((prev) => [
              ...prev,
              createFloatingText(targetX + 20, targetY, `+${points}`, '#FFD700', 14),
            ]);

            setParticles((prev) => [
              ...prev,
              ...createParticles(targetX, targetY, '#FFD700', 10, 'sparkle'),
            ]);
          }

          // Check power-up collection
          const collidedPowerUp = powerUps.find(
            (p) => p.position.x === targetCellX && p.position.y === targetCellY,
          );
          if (collidedPowerUp) {
            collectPowerUp(collidedPowerUp);
          }

          // Check goal - level completes when reaching home!
          if (targetCellX === gameState.goal[0] && targetCellY === gameState.goal[1]) {
            // Level complete! Reaching the goal completes the level
            setGameStatus('completed');
            audioService.playWinFeedback();
            setConfetti(createConfetti(canvas.width / 2, canvas.height / 2, 100));

            const timeElapsed = (Date.now() - startTime) / 1000;
            const finalFoods = foodsCollected + (foodCollectedThisStep ? 1 : 0);

            dispatch({
              type: 'RECORD_GAME_COMPLETED',
              payload: {
                level: gameState.level,
                time: timeElapsed,
                score,
                foods: finalFoods,
                damageTaken,
                usedPowerUps,
              },
            });
          }

          playerState.targetIndex++;
        } else {
          playerState.x += (dx / distance) * currentSpeed;
          playerState.y += (dy / distance) * currentSpeed;
        }

        setPlayerState({ ...playerState });
      }

      // Update ghosts
      updateGhosts();
      checkCollisions();

      // Draw power-up auras
      activePowerUps.forEach((p) => {
        if (p.endsAt > Date.now()) {
          drawPowerUpAura(ctx, playerState.x, playerState.y, cellSize * 0.8, p.type);
        }
      });

      // Draw player
      const isInvincible =
        playerState.invincible ||
        activePowerUps.some((p) => p.type === 'invincible' && p.endsAt > Date.now());
      ctx.globalAlpha = isInvincible ? 0.5 + getPulse(4) * 0.5 : 1;
      ctx.shadowColor = isInvincible ? 'rgba(255, 215, 0, 0.8)' : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = isInvincible ? 20 : 10;
      ctx.shadowOffsetY = isInvincible ? 0 : 5;
      ctx.font = `${cellSize}px "Segoe UI Emoji"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(playerEmoji, playerState.x, playerState.y);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = 1;

      // Draw ghosts
      const now = Date.now();
      enemies.forEach((enemy) => {
        const config = GHOST_CONFIGS[enemy.ghostType];
        ctx.font = `${cellSize}px "Segoe UI Emoji"`;

        if (enemy.frozen && enemy.frozenUntil > now) {
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#88CCFF';
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, cellSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.fillText(config.emoji, enemy.x, enemy.y);
      });

      // Draw transition
      if (transition) {
        const updatedTransition = updateLevelTransition(transition);
        setTransition(updatedTransition.active ? updatedTransition : null);
        drawLevelTransition(ctx, updatedTransition, canvas.width, canvas.height);
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameState,
    playerState,
    loading,
    foodsCollected,
    gameStatus,
    enemies,
    cellSize,
    theme,
    powerUps,
    activePowerUps,
    screenShake,
    confetti,
    particles,
    floatingTexts,
    trails,
    transition,
    playerEmoji,
    trailColor,
    score,
    startTime,
    gameStore.combo,
    updateCombo,
    dispatch,
    collectPowerUp,
    updateGhosts,
    checkCollisions,
    damageTaken,
    usedPowerUps,
  ]);

  // Draw maze with theme
  const drawMaze = (
    ctx: CanvasRenderingContext2D,
    game: GameState,
    grid: string[][],
    currentTheme: ThemeConfig,
  ) => {
    for (let y = 0; y < game.rows; y++) {
      for (let x = 0; x < game.cols; x++) {
        const cell = grid[y][x];
        const cellX = x * cellSize;
        const cellY = y * cellSize;

        if (cell === '#') {
          // Wall with theme colors
          ctx.fillStyle = currentTheme.wallColor;
          ctx.fillRect(cellX, cellY + 5, cellSize, cellSize);

          const gradient = ctx.createLinearGradient(cellX, cellY, cellX, cellY + cellSize);
          gradient.addColorStop(0, currentTheme.wallGradient[0]);
          gradient.addColorStop(1, currentTheme.wallGradient[1]);
          ctx.fillStyle = gradient;
          ctx.fillRect(cellX, cellY, cellSize, cellSize - 5);

          ctx.fillStyle = currentTheme.wallGradient[0];
          ctx.fillRect(cellX, cellY, cellSize, 2);
        } else {
          // Floor
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = currentTheme.floorColor;
            ctx.fillRect(cellX, cellY, cellSize, cellSize);
          }

          // Food
          if (cell !== ' ') {
            const floatOffset = Math.sin(Date.now() / 200 + x + y) * 3;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
            ctx.shadowBlur = 15;
            ctx.font = `${cellSize * 0.6}px "Segoe UI Emoji"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell, cellX + cellSize / 2, cellY + cellSize / 2 + floatOffset);
            ctx.shadowBlur = 0;
          }
        }

        // Goal highlight
        if (x === game.goal[0] && y === game.goal[1]) {
          const pulse = getPulse(2);
          ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.5})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);
          ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + pulse * 0.2})`;
          ctx.fillRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);

          // Goal emoji
          ctx.font = `${cellSize * 0.7}px "Segoe UI Emoji"`;
          ctx.fillText(currentTheme.goalEmoji, cellX + cellSize / 2, cellY + cellSize / 2);
        }
      }
    }
  };

  const timeElapsed = ((currentTime - startTime) / 1000).toFixed(1);

  if (loading) {
    return (
      <div className="game-board-screen flex-center">
        <div className="loading"></div>
        <p>Generating {levelDef.description}...</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="game-board-screen flex-center">
        <p>Failed to load game</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="game-board-screen" style={{ backgroundColor: theme.backgroundColor }}>
      {/* HUD */}
      <div className="game-hud">
        <div className="hud-item">
          <span className="emoji">⭐</span>
          <span>Level {gameState.level}</span>
        </div>
        <div className="hud-item lives-display">
          {Array.from({ length: PLAYER_LIVES }).map((_, i) => (
            <span key={i} className={`heart ${i < lives ? 'active' : 'lost'}`}>
              {i < lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
        <div className="hud-item">
          <span className="emoji">🍕</span>
          <span>
            {foodsCollected} / {actualTotalFoods}
          </span>
        </div>
        <div className="hud-item">
          <span className="emoji">💰</span>
          <span>{score}</span>
        </div>
        <div className="hud-item">
          <span className="emoji">⏱️</span>
          <span>{timeElapsed}s</span>
        </div>
        {gameStore.combo.count > 1 && (
          <div
            className="hud-item combo-display"
            style={{ color: getComboColor(gameStore.combo.count) }}
          >
            <span className="emoji">🔥</span>
            <span>{gameStore.combo.count}x</span>
          </div>
        )}
        <button className="btn btn-secondary btn-sm" onClick={() => setGameStatus('paused')}>
          ⏸️
        </button>
      </div>

      {/* Active Power-ups */}
      {activePowerUps.length > 0 && (
        <div className="active-powerups">
          {activePowerUps.map((p, i) => {
            const config = POWER_UP_CONFIG[p.type];
            const remaining = Math.max(0, (p.endsAt - Date.now()) / 1000);
            return (
              <div key={i} className="powerup-indicator">
                <span className="powerup-emoji">{config.emoji}</span>
                <div className="powerup-timer">
                  <div
                    className="powerup-timer-bar"
                    style={{ width: `${(remaining / (config.duration / 1000)) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Game Canvas */}
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={gameState.cols * cellSize}
          height={gameState.rows * cellSize}
          onClick={handleCanvasClick}
          className="game-canvas"
        />
      </div>

      {/* Instructions */}
      <div className="game-instructions">
        <p>
          <span className="emoji">👆</span> Click/Tap to move
        </p>
        <p>
          <span className="emoji">⌨️</span> WASD or Arrow keys
        </p>
        <p>
          <span className="emoji">👻</span> Avoid ghosts!
        </p>
      </div>

      {/* Pause Menu */}
      {gameStatus === 'paused' && (
        <div className="game-modal">
          <div className="modal-content card">
            <h2>⏸️ Paused</h2>
            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={() => setGameStatus('active')}>
                ▶️ Resume
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                🔄 Restart
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/levels')}>
                📋 Level Select
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/')}>
                🏠 Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      {gameStatus === 'completed' && gameState && (
        <LevelCompleteModal
          level={gameState.level}
          score={score}
          time={(Date.now() - startTime) / 1000}
          foodsCollected={foodsCollected}
          totalFoods={actualTotalFoods}
          damageTaken={damageTaken}
          isGameComplete={gameState.level >= LEVEL_DEFINITIONS.length}
          onNextLevel={() => navigate(`/game/${gameState.level + 1}`)}
          onReplay={() => window.location.reload()}
          onHome={() => navigate('/')}
        />
      )}

      {/* Game Over Modal */}
      {gameStatus === 'failed' && gameState && (
        <div className="game-modal">
          <div className="modal-content card game-over-modal">
            <h2>💀 Game Over 💀</h2>
            <div className="modal-stats">
              <p>⏱️ Time: {timeElapsed}s</p>
              <p>
                🍕 Foods: {foodsCollected}/{actualTotalFoods}
              </p>
              <p>💰 Score: {score}</p>
            </div>
            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Try Again 🔄
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/levels')}>
                Level Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
