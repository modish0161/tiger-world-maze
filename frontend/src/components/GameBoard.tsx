import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import audioService from '../services/AudioService';
import gameService from '../services/gameService';
import scoreService from '../services/scoreService';
import type { Enemy, GameState } from '../types/game';
import './GameBoard.css';

const TIGER_EMOJI = '🐯';
const TRAIL_EMOJI = '🐾';
const SPEED = 3;

interface PlayerState {
  x: number;
  y: number;
  targetIndex: number;
  path: [number, number][];
  invincible: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const GHOST_EMOJI = '👻';
const GHOST_SPEED = 0.9; // Much slower than player (reduced from 1.2)
const PLAYER_LIVES = 3;



const GameBoard = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [foodsCollected, setFoodsCollected] = useState(0);
  const [startTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [gameStatus, setGameStatus] = useState<'active' | 'paused' | 'completed' | 'failed'>('active');
  const [lives, setLives] = useState(PLAYER_LIVES);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [cellSize, setCellSize] = useState(40);
  
  const animationFrameRef = useRef<number>();
  const mazeGridRef = useRef<string[][]>([]);
  const lastEnemyUpdateRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  // Calculate responsive cell size
  const updateCellSize = (rows: number, cols: number) => {
    const maxWidth = window.innerWidth - 32; // 16px padding
    const maxHeight = window.innerHeight - 200; // Space for HUD
    
    const sizeByWidth = Math.floor(maxWidth / cols);
    const sizeByHeight = Math.floor(maxHeight / rows);
    
    // Clamp size between 20px and 60px
    const newSize = Math.max(20, Math.min(60, Math.min(sizeByWidth, sizeByHeight)));
    setCellSize(newSize);
    return newSize;
  };

  // Initialize Ghosts
  const spawnGhosts = (grid: string[][], rows: number, cols: number, count: number, playerStart: [number, number], currentCellSize: number): Enemy[] => {
    const newEnemies: Enemy[] = [];
    const safeDistance = 8; // Minimum distance from player

    for (let i = 0; i < count; i++) {
      let ex, ey, dist;
      let attempts = 0;
      do {
        ex = Math.floor(Math.random() * cols);
        ey = Math.floor(Math.random() * rows);
        dist = Math.sqrt(Math.pow(ex - playerStart[0], 2) + Math.pow(ey - playerStart[1], 2));
        attempts++;
      } while ((grid[ey][ex] === '#' || dist < safeDistance) && attempts < 100);

      if (grid[ey][ex] !== '#') {
        newEnemies.push({
          id: `ghost-${i}`,
          x: ex * currentCellSize + currentCellSize / 2,
          y: ey * currentCellSize + currentCellSize / 2,
          type: 'ghost',
          speed: GHOST_SPEED + (parseInt(level || '1') * 0.1), // Faster on higher levels
          path: [],
          targetIndex: 0
        });
      }
    }
    return newEnemies;
  };

  // Particle System
  const createParticles = (x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const updateParticles = () => {
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.size *= 0.95;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  };

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (gameState) {
        const newSize = updateCellSize(gameState.rows, gameState.cols);
        
        // Update positions
        if (playerState) {
            const cellX = Math.floor(playerState.x / cellSize);
            const cellY = Math.floor(playerState.y / cellSize);
            setPlayerState(prev => prev ? {
                ...prev,
                x: cellX * newSize + newSize / 2,
                y: cellY * newSize + newSize / 2
            } : null);
        }
        
        setEnemies(prev => prev.map(e => {
            const cellX = Math.floor(e.x / cellSize);
            const cellY = Math.floor(e.y / cellSize);
            return {
                ...e,
                x: cellX * newSize + newSize / 2,
                y: cellY * newSize + newSize / 2
            };
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState, cellSize, playerState]);

  // Load game
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const game = await gameService.createNewGame(parseInt(level || '1'));
        setGameState(game);
        mazeGridRef.current = JSON.parse(JSON.stringify(game.maze_grid));
        
        const initialCellSize = updateCellSize(game.rows, game.cols);
        
        const startX = game.start[0] * initialCellSize + initialCellSize / 2;
        const startY = game.start[1] * initialCellSize + initialCellSize / 2;
        
        setPlayerState({
          x: startX,
          y: startY,
          targetIndex: 0,
          path: [[game.start[0], game.start[1]]],
          invincible: false
        });

        // Spawn ghosts based on level
        const ghostCount = Math.min(2 + Math.floor(game.level / 2), 10);
        setEnemies(spawnGhosts(game.maze_grid, game.rows, game.cols, ghostCount, game.start, initialCellSize));
        
        setLoading(false);
        setGameStatus('active');
        audioService.playBGM(); // Start ambient loop (might need interaction first)
      } catch (error) {
        console.error('Failed to load game:', error);
        setLoading(false);
      }
    };

    loadGame();
  }, [level]);

  // Update timer
  useEffect(() => {
    if (!loading && gameStatus === 'active') {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loading, gameStatus]);

  // BFS Pathfinding
  const findPath = (start: [number, number], end: [number, number], grid: string[][], rows: number, cols: number): [number, number][] | null => {
    const queue: { pos: [number, number], path: [number, number][] }[] = [];
    queue.push({ pos: start, path: [start] });
    const visited = new Set<string>();
    visited.add(`${start[0]},${start[1]}`);
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    // Optimization: Limit search depth for performance
    let iterations = 0;
    const MAX_ITERATIONS = 2000;

    while (queue.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      const { pos, path } = queue.shift()!;
      const [cx, cy] = pos;
      
      if (cx === end[0] && cy === end[1]) return path;
      
      // Sort directions to prefer moving towards target (A* heuristic-ish)
      directions.sort((a, b) => {
        const distA = Math.abs((cx + a[0]) - end[0]) + Math.abs((cy + a[1]) - end[1]);
        const distB = Math.abs((cx + b[0]) - end[0]) + Math.abs((cy + b[1]) - end[1]);
        return distA - distB;
      });

      for (const [dx, dy] of directions) {
        const nx = cx + dx;
        const ny = cy + dy;
        
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && 
            grid[ny][nx] !== '#' && !visited.has(`${nx},${ny}`)) {
          visited.add(`${nx},${ny}`);
          queue.push({ pos: [nx, ny], path: [...path, [nx, ny]] });
        }
      }
    }
    return null;
  };

  // Handle click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Resume audio context on user interaction
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
          gameState.cols
        );
        
        if (path) {
          const newPath = path.slice(1);
          if (newPath.length > 0) {
            setPlayerState({
              ...playerState,
              path: newPath,
              targetIndex: 0
            });
            audioService.playMove();
          }
        }
      }
    }
  };

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
        default:
          return;
      }

      const targetX = currentCellX + dx;
      const targetY = currentCellY + dy;

      if (targetX >= 0 && targetX < gameState.cols && targetY >= 0 && targetY < gameState.rows) {
        const cell = mazeGridRef.current[targetY][targetX];
        if (cell !== '#') {
          // Move one step
          setPlayerState(prev => prev ? {
            ...prev,
            path: [[targetX, targetY]],
            targetIndex: 0
          } : null);
          audioService.playMove();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, playerState, gameStatus, cellSize]);

  // Update Ghosts Logic
  const updateGhosts = () => {
    if (!playerState || !gameState) return;
    
    const now = Date.now();
    // Update pathfinding every 500ms to save performance
    if (now - lastEnemyUpdateRef.current > 500) {
      lastEnemyUpdateRef.current = now;
      
      const playerCellX = Math.floor(playerState.x / cellSize);
      const playerCellY = Math.floor(playerState.y / cellSize);

      setEnemies(prevEnemies => prevEnemies.map(enemy => {
        const enemyCellX = Math.floor(enemy.x / cellSize);
        const enemyCellY = Math.floor(enemy.y / cellSize);
        
        // Simple AI: If close enough, chase player. Otherwise random move.
        const dist = Math.abs(enemyCellX - playerCellX) + Math.abs(enemyCellY - playerCellY);
        
        let newPath = enemy.path;
        let newTargetIndex = enemy.targetIndex;

        if (dist < 10) { // Aggro range
          const path = findPath(
            [enemyCellX, enemyCellY],
            [playerCellX, playerCellY],
            mazeGridRef.current,
            gameState.rows,
            gameState.cols
          );
          if (path && path.length > 1) {
            newPath = path.slice(1);
            newTargetIndex = 0;
            audioService.playGhostAlert();
          }
        } else if (enemy.path.length === 0 || enemy.targetIndex >= enemy.path.length) {
            // Random wander
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            const validMoves = directions.filter(([dx, dy]) => {
                const nx = enemyCellX + dx;
                const ny = enemyCellY + dy;
                return nx >= 0 && nx < gameState.cols && ny >= 0 && ny < gameState.rows && mazeGridRef.current[ny][nx] !== '#';
            });
            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                newPath = [[enemyCellX + move[0], enemyCellY + move[1]]];
                newTargetIndex = 0;
            }
        }

        return { ...enemy, path: newPath, targetIndex: newTargetIndex };
      }));
    }

    // Move ghosts along path
    setEnemies(prevEnemies => prevEnemies.map(enemy => {
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
                    y: enemy.y + (dy / distance) * currentSpeed
                };
            }
        }
        return enemy;
    }));
  };

  // Check Collisions
  const checkCollisions = () => {
      if (!playerState || playerState.invincible) return;

      for (const enemy of enemies) {
          const dist = Math.sqrt(Math.pow(enemy.x - playerState.x, 2) + Math.pow(enemy.y - playerState.y, 2));
          if (dist < cellSize * 0.6) {
              // Hit!
              handlePlayerHit();
              break;
          }
      }
  };

  const handlePlayerHit = () => {
      if (lives > 1) {
          setLives(l => l - 1);
          setPlayerState(prev => prev ? { ...prev, invincible: true } : null);
          audioService.playDie();
          createParticles(playerState!.x, playerState!.y, '#ff0000', 20);
          
          // Reset position
          if (gameState) {
            const startX = gameState.start[0] * cellSize + cellSize / 2;
            const startY = gameState.start[1] * cellSize + cellSize / 2;
            setTimeout(() => {
                setPlayerState(prev => prev ? { 
                    ...prev, 
                    x: startX, 
                    y: startY, 
                    path: [], 
                    targetIndex: 0,
                    invincible: false 
                } : null);
            }, 1000);
          }
      } else {
          setLives(0);
          setGameStatus('failed');
          audioService.playDie();
      }
  };

  // Game loop
  useEffect(() => {
    if (!gameState || !playerState || !canvasRef.current || loading || gameStatus !== 'active') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw maze
      drawMaze(ctx, gameState, mazeGridRef.current);

      // Update Particles
      updateParticles();
      drawParticles(ctx);

      // Update and draw player
      if (playerState.path.length > 0 && playerState.targetIndex < playerState.path.length) {
        const [targetCellX, targetCellY] = playerState.path[playerState.targetIndex];
        const targetX = targetCellX * cellSize + cellSize / 2;
        const targetY = targetCellY * cellSize + cellSize / 2;

        const dx = targetX - playerState.x;
        const dy = targetY - playerState.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const currentSpeed = SPEED * (cellSize / 40);

        if (distance < currentSpeed) {
          // Reached target
          playerState.x = targetX;
          playerState.y = targetY;

          // Check if food here
          const cell = mazeGridRef.current[targetCellY][targetCellX];
          if (cell !== '#' && cell !== ' ' && cell !== TRAIL_EMOJI) {
            mazeGridRef.current[targetCellY][targetCellX] = TRAIL_EMOJI;
            setFoodsCollected(prev => prev + 1);
            audioService.playEat();
            createParticles(targetX, targetY, '#FF6B35', 10);
          }



          // Check if reached goal
          if (targetCellX === gameState.goal[0] && targetCellY === gameState.goal[1]) {
            if (foodsCollected >= gameState.total_foods - 1) {
              setGameStatus('completed');
              audioService.playWin();
              createParticles(targetX, targetY, '#00FF00', 50);
              
              // Submit Score
              const time = (Date.now() - startTime) / 1000;
              scoreService.submitScore(gameState.id, 'Player', time);
            }
          }

          playerState.targetIndex++;
        } else {
          // Move towards target
          playerState.x += (dx / distance) * currentSpeed;
          playerState.y += (dy / distance) * currentSpeed;
        }

        setPlayerState({ ...playerState });
      }

      // Update Ghosts
      updateGhosts();
      checkCollisions();

      // Draw Player with shadow
      ctx.globalAlpha = playerState.invincible ? 0.5 : 1;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.font = `${cellSize}px "Segoe UI Emoji"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(TIGER_EMOJI, playerState.x, playerState.y);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = 1;

      // Draw Ghosts
      enemies.forEach(enemy => {
          ctx.font = `${cellSize}px "Segoe UI Emoji"`;
          ctx.fillText(GHOST_EMOJI, enemy.x, enemy.y);
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, playerState, loading, foodsCollected, gameStatus, enemies, cellSize]);

  const drawMaze = (ctx: CanvasRenderingContext2D, game: GameState, grid: string[][]) => {
    for (let y = 0; y < game.rows; y++) {
      for (let x = 0; x < game.cols; x++) {
        const cell = grid[y][x];
        const cellX = x * cellSize;
        const cellY = y * cellSize;

        if (cell === '#') {
          // 3D Wall Effect
          
          // 1. Base/Side (Darker)
          ctx.fillStyle = '#0a0a0a'; // Dark black
          ctx.fillRect(cellX, cellY + 5, cellSize, cellSize);
          
          // 2. Top Face (Lighter)
          const gradient = ctx.createLinearGradient(cellX, cellY, cellX, cellY + cellSize);
          gradient.addColorStop(0, '#2a2a2a'); // Light top
          gradient.addColorStop(1, '#1a1a1a'); // Darker bottom
          ctx.fillStyle = gradient;
          ctx.fillRect(cellX, cellY, cellSize, cellSize - 5);
          
          // 3. Highlight edge
          ctx.fillStyle = '#3a3a3a';
          ctx.fillRect(cellX, cellY, cellSize, 2);
          
        } else {
          // Floor pattern (subtle)
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(cellX, cellY, cellSize, cellSize);
          }
          
          if (cell !== ' ') {
            if (cell === TRAIL_EMOJI) {
              // Trail emoji - subtle paw print
              ctx.globalAlpha = 0.4;
              ctx.font = `${cellSize * 0.5}px "Segoe UI Emoji"`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(cell, cellX + cellSize / 2, cellY + cellSize / 2);
              ctx.globalAlpha = 1;
            } else {
              // Food emoji with floating effect
              const floatOffset = Math.sin(Date.now() / 200) * 3;
              
              ctx.shadowColor = 'rgba(255, 107, 53, 0.4)';
              ctx.shadowBlur = 15;
              ctx.font = `${cellSize * 0.6}px "Segoe UI Emoji"`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(cell, cellX + cellSize / 2, cellY + cellSize / 2 + floatOffset);
              ctx.shadowBlur = 0;
            }
          }
        }

        // Highlight goal
        if (x === game.goal[0] && y === game.goal[1]) {
          // Pulsing glow
          const pulse = (Math.sin(Date.now() / 300) + 1) / 2; // 0 to 1
          
          ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.5})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);
          
          // Inner glow
          ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + pulse * 0.2})`;
          ctx.fillRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);
        }
      }
    }
  };

  const timeElapsed = ((currentTime - startTime) / 1000).toFixed(1);

  if (loading) {
    return (
      <div className="game-board-screen flex-center">
        <div className="loading"></div>
        <p>Generating maze...</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="game-board-screen flex-center">
        <p>Failed to load game</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="game-board-screen">
      {/* HUD */}
      <div className="game-hud">
        <div className="hud-item">
          <span className="emoji">⭐</span>
          <span>Level {gameState.level}</span>
        </div>
        <div className="hud-item">
          <span className="emoji">❤️</span>
          <span>{lives}</span>
        </div>
        <div className="hud-item">
          <span className="emoji">🍕</span>
          <span>{foodsCollected} / {gameState.total_foods}</span>
        </div>
        <div className="hud-item">
          <span className="emoji">⏱️</span>
          <span>{timeElapsed}s</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setGameStatus('paused')}>
            ⏸️ Pause
        </button>
      </div>

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
        <p><span className="emoji">👆</span> Click to move</p>
        <p><span className="emoji">👻</span> Avoid ghosts!</p>
      </div>

      {/* Pause Menu */}
      {gameStatus === 'paused' && (
          <div className="game-modal">
              <div className="modal-content card">
                  <h2>Paused</h2>
                  <div className="modal-buttons">
                      <button className="btn btn-primary" onClick={() => setGameStatus('active')}>Resume</button>
                      <button className="btn btn-secondary" onClick={() => navigate('/levels')}>Quit Level</button>
                  </div>
              </div>
          </div>
      )}

      {/* Game Over / Complete Modals */}
      {(gameStatus === 'completed' || gameStatus === 'failed') && (
        <div className="game-modal">
          <div className="modal-content card">
            <h2>{gameStatus === 'completed' ? '🎉 Level Complete! 🎉' : '💀 Game Over 💀'}</h2>
            <div className="modal-stats">
              <p>Time: {timeElapsed}s</p>
              <p>Foods: {foodsCollected}</p>
            </div>
            <div className="modal-buttons">
              {gameStatus === 'completed' ? (
                  <button className="btn btn-primary" onClick={() => navigate(`/game/${gameState.level + 1}`)}>Next Level ➡️</button>
              ) : (
                  <button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again 🔄</button>
              )}
              <button className="btn btn-secondary" onClick={() => navigate('/levels')}>Level Select</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
