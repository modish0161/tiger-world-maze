import React, { createContext, useContext, useEffect, useReducer } from 'react';

// ============ Types ============

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  target?: number;
}

export interface PlayerSkin {
  id: string;
  name: string;
  emoji: string;
  unlocked: boolean;
  unlockCondition: string;
  trailColor?: string;
}

export interface DailyChallenge {
  id: string;
  date: string;
  type: 'speed' | 'no_damage' | 'collect_all' | 'time_limit';
  level: number;
  target: number;
  reward: number;
  completed: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticEnabled: boolean;
  showMinimap: boolean;
  showTutorial: boolean;
  fullscreen: boolean;
}

export interface PlayerProgress {
  highestLevel: number;
  completedLevels: number[]; // Array of completed level numbers
  totalScore: number;
  totalFoodsCollected: number;
  totalGamesPlayed: number;
  totalDeaths: number;
  totalTimePlayedMs: number;
  perfectRuns: number;
  fastestTimes: Record<number, number>; // level -> time in seconds
  starsEarned: Record<number, number>; // level -> stars (1-3)
  lastPlayed: number;
}

export interface ComboState {
  count: number;
  multiplier: number;
  lastCollectTime: number;
}

export interface GameStore {
  // Player data
  playerName: string;
  selectedSkin: string;
  coins: number;

  // Progress
  progress: PlayerProgress;

  // Collections
  achievements: Achievement[];
  skins: PlayerSkin[];

  // Daily
  dailyChallenge: DailyChallenge | null;
  lastDailyReset: string;

  // Settings
  settings: GameSettings;

  // Tutorial state
  tutorialCompleted: boolean;
  tutorialStep: number;

  // Combo system
  combo: ComboState;
}

// ============ Initial Data ============

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Complete your first level',
    icon: '🏆',
    unlocked: false,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete any level in under 30 seconds',
    icon: '⚡',
    unlocked: false,
  },
  {
    id: 'perfect_run',
    name: 'Perfect Run',
    description: 'Complete a level without taking damage',
    icon: '🌟',
    unlocked: false,
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Collect 100 total foods',
    icon: '🍕',
    unlocked: false,
    progress: 0,
    target: 100,
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Survive 10 ghost encounters',
    icon: '👻',
    unlocked: false,
    progress: 0,
    target: 10,
  },
  {
    id: 'power_user',
    name: 'Power User',
    description: 'Collect 20 power-ups',
    icon: '⭐',
    unlocked: false,
    progress: 0,
    target: 20,
  },
  {
    id: 'level_5',
    name: 'Getting Serious',
    description: 'Reach level 5',
    icon: '🎯',
    unlocked: false,
  },
  { id: 'level_10', name: 'Champion', description: 'Reach level 10', icon: '👑', unlocked: false },
  { id: 'level_20', name: 'Legend', description: 'Reach level 20', icon: '🌈', unlocked: false },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Achieve a 10x combo',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'marathon',
    name: 'Marathon Runner',
    description: 'Play for 30 minutes total',
    icon: '🏃',
    unlocked: false,
    progress: 0,
    target: 1800000,
  },
  {
    id: 'ghost_dodger',
    name: 'Ghost Dodger',
    description: 'Complete level 5+ without power-ups',
    icon: '💨',
    unlocked: false,
  },
];

const INITIAL_SKINS: PlayerSkin[] = [
  { id: 'default', name: 'Classic Tiger', emoji: '🐯', unlocked: true, unlockCondition: 'Default' },
  {
    id: 'golden',
    name: 'Golden Tiger',
    emoji: '🐯',
    unlocked: false,
    unlockCondition: 'Collect 500 coins',
    trailColor: '#FFD700',
  },
  {
    id: 'rainbow',
    name: 'Rainbow Tiger',
    emoji: '🐯',
    unlocked: false,
    unlockCondition: 'Complete 10 perfect runs',
    trailColor: 'rainbow',
  },
  {
    id: 'ghost_tiger',
    name: 'Ghost Tiger',
    emoji: '👻',
    unlocked: false,
    unlockCondition: 'Defeat 50 ghosts',
  },
  {
    id: 'alien',
    name: 'Alien',
    emoji: '👽',
    unlocked: false,
    unlockCondition: 'Complete space theme',
  },
  {
    id: 'robot',
    name: 'Robot',
    emoji: '🤖',
    unlocked: false,
    unlockCondition: 'Complete 20 levels',
  },
  {
    id: 'ninja',
    name: 'Ninja',
    emoji: '🥷',
    unlocked: false,
    unlockCondition: 'Speed run 5 levels',
  },
  {
    id: 'crown',
    name: 'King Tiger',
    emoji: '👑',
    unlocked: false,
    unlockCondition: 'Reach #1 on leaderboard',
  },
];

const INITIAL_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  hapticEnabled: true,
  showMinimap: true,
  showTutorial: true,
  fullscreen: false,
};

const INITIAL_PROGRESS: PlayerProgress = {
  highestLevel: 0,
  completedLevels: [],
  totalScore: 0,
  totalFoodsCollected: 0,
  totalGamesPlayed: 0,
  totalDeaths: 0,
  totalTimePlayedMs: 0,
  perfectRuns: 0,
  fastestTimes: {},
  starsEarned: {},
  lastPlayed: Date.now(),
};

const INITIAL_STATE: GameStore = {
  playerName: 'Player',
  selectedSkin: 'default',
  coins: 0,
  progress: INITIAL_PROGRESS,
  achievements: INITIAL_ACHIEVEMENTS,
  skins: INITIAL_SKINS,
  dailyChallenge: null,
  lastDailyReset: '',
  settings: INITIAL_SETTINGS,
  tutorialCompleted: false,
  tutorialStep: 0,
  combo: { count: 0, multiplier: 1, lastCollectTime: 0 },
};

// ============ Actions ============

type GameAction =
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'SET_SKIN'; payload: string }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<PlayerProgress> }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'UPDATE_ACHIEVEMENT_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'UNLOCK_SKIN'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'SET_TUTORIAL_STEP'; payload: number }
  | { type: 'UPDATE_COMBO'; payload: ComboState }
  | { type: 'RESET_COMBO' }
  | { type: 'SET_DAILY_CHALLENGE'; payload: DailyChallenge | null }
  | { type: 'COMPLETE_DAILY_CHALLENGE' }
  | { type: 'LOAD_STATE'; payload: GameStore }
  | {
      type: 'RECORD_GAME_COMPLETED';
      payload: {
        level: number;
        time: number;
        score: number;
        foods: number;
        damageTaken: boolean;
        usedPowerUps: boolean;
      };
    };

// ============ Reducer ============

function gameReducer(state: GameStore, action: GameAction): GameStore {
  switch (action.type) {
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };

    case 'SET_SKIN':
      return { ...state, selectedSkin: action.payload };

    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.payload };

    case 'UPDATE_PROGRESS':
      return { ...state, progress: { ...state.progress, ...action.payload } };

    case 'UNLOCK_ACHIEVEMENT': {
      const achievements = state.achievements.map((a) =>
        a.id === action.payload ? { ...a, unlocked: true, unlockedAt: Date.now() } : a,
      );
      return { ...state, achievements };
    }

    case 'UPDATE_ACHIEVEMENT_PROGRESS': {
      const achievements = state.achievements.map((a) =>
        a.id === action.payload.id ? { ...a, progress: action.payload.progress } : a,
      );
      return { ...state, achievements };
    }

    case 'UNLOCK_SKIN': {
      const skins = state.skins.map((s) =>
        s.id === action.payload ? { ...s, unlocked: true } : s,
      );
      return { ...state, skins };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'COMPLETE_TUTORIAL':
      return { ...state, tutorialCompleted: true };

    case 'SET_TUTORIAL_STEP':
      return { ...state, tutorialStep: action.payload };

    case 'UPDATE_COMBO':
      return { ...state, combo: action.payload };

    case 'RESET_COMBO':
      return { ...state, combo: { count: 0, multiplier: 1, lastCollectTime: 0 } };

    case 'SET_DAILY_CHALLENGE':
      return { ...state, dailyChallenge: action.payload };

    case 'COMPLETE_DAILY_CHALLENGE':
      if (!state.dailyChallenge) return state;
      return {
        ...state,
        dailyChallenge: { ...state.dailyChallenge, completed: true },
        coins: state.coins + (state.dailyChallenge.reward || 100),
      };

    case 'RECORD_GAME_COMPLETED': {
      const { level, time, score, foods, damageTaken, usedPowerUps } = action.payload;
      const newProgress = { ...state.progress };

      newProgress.totalGamesPlayed++;
      newProgress.totalScore += score;
      newProgress.totalFoodsCollected += foods;
      newProgress.totalTimePlayedMs += time * 1000;
      newProgress.lastPlayed = Date.now();

      // Track completed levels
      if (!newProgress.completedLevels.includes(level)) {
        newProgress.completedLevels = [...newProgress.completedLevels, level];
      }

      if (level > newProgress.highestLevel) {
        newProgress.highestLevel = level;
      }

      if (!damageTaken) {
        newProgress.perfectRuns++;
      }

      const currentFastest = newProgress.fastestTimes[level];
      if (!currentFastest || time < currentFastest) {
        newProgress.fastestTimes[level] = time;
      }

      // Calculate stars earned (1-3)
      // 3 stars: Perfect run (no damage) + fast time
      // 2 stars: No damage OR fast time
      // 1 star: Just completed
      let stars = 1;
      if (!damageTaken) stars++;
      if (time < 60) stars++; // Under 60 seconds
      const currentStars = newProgress.starsEarned[level] || 0;
      if (stars > currentStars) {
        newProgress.starsEarned = { ...newProgress.starsEarned, [level]: stars };
      }

      // Check achievements
      const newAchievements = [...state.achievements];

      // First win
      if (!state.achievements.find((a) => a.id === 'first_win')?.unlocked) {
        const idx = newAchievements.findIndex((a) => a.id === 'first_win');
        if (idx !== -1)
          newAchievements[idx] = {
            ...newAchievements[idx],
            unlocked: true,
            unlockedAt: Date.now(),
          };
      }

      // Speed demon
      if (time < 30 && !state.achievements.find((a) => a.id === 'speed_demon')?.unlocked) {
        const idx = newAchievements.findIndex((a) => a.id === 'speed_demon');
        if (idx !== -1)
          newAchievements[idx] = {
            ...newAchievements[idx],
            unlocked: true,
            unlockedAt: Date.now(),
          };
      }

      // Perfect run
      if (!damageTaken && !state.achievements.find((a) => a.id === 'perfect_run')?.unlocked) {
        const idx = newAchievements.findIndex((a) => a.id === 'perfect_run');
        if (idx !== -1)
          newAchievements[idx] = {
            ...newAchievements[idx],
            unlocked: true,
            unlockedAt: Date.now(),
          };
      }

      // Level achievements
      if (level >= 5 && !state.achievements.find((a) => a.id === 'level_5')?.unlocked) {
        const idx = newAchievements.findIndex((a) => a.id === 'level_5');
        if (idx !== -1)
          newAchievements[idx] = {
            ...newAchievements[idx],
            unlocked: true,
            unlockedAt: Date.now(),
          };
      }
      if (level >= 10 && !state.achievements.find((a) => a.id === 'level_10')?.unlocked) {
        const idx = newAchievements.findIndex((a) => a.id === 'level_10');
        if (idx !== -1)
          newAchievements[idx] = {
            ...newAchievements[idx],
            unlocked: true,
            unlockedAt: Date.now(),
          };
      }
      if (level >= 20 && !state.achievements.find((a) => a.id === 'level_20')?.unlocked) {
        const idx = newAchievements.findIndex((a) => a.id === 'level_20');
        if (idx !== -1)
          newAchievements[idx] = {
            ...newAchievements[idx],
            unlocked: true,
            unlockedAt: Date.now(),
          };
      }

      // Ghost dodger
      if (
        level >= 5 &&
        !damageTaken &&
        !usedPowerUps &&
        !state.achievements.find((a) => a.id === 'ghost_dodger')?.unlocked
      ) {
        const idx = newAchievements.findIndex((a) => a.id === 'ghost_dodger');
        if (idx !== -1)
          newAchievements[idx] = {
            ...newAchievements[idx],
            unlocked: true,
            unlockedAt: Date.now(),
          };
      }

      // Progress-based achievements
      const collectorIdx = newAchievements.findIndex((a) => a.id === 'collector');
      if (collectorIdx !== -1 && !newAchievements[collectorIdx].unlocked) {
        const newProg = (newAchievements[collectorIdx].progress || 0) + foods;
        newAchievements[collectorIdx] = { ...newAchievements[collectorIdx], progress: newProg };
        if (newProg >= (newAchievements[collectorIdx].target || 100)) {
          newAchievements[collectorIdx] = {
            ...newAchievements[collectorIdx],
            unlocked: true,
            unlockedAt: Date.now(),
          };
        }
      }

      return {
        ...state,
        progress: newProgress,
        achievements: newAchievements,
        coins: state.coins + Math.floor(score / 10),
      };
    }

    case 'LOAD_STATE':
      return { ...action.payload };

    default:
      return state;
  }
}

// ============ Context ============

interface GameContextType {
  state: GameStore;
  dispatch: React.Dispatch<GameAction>;
  // Helper functions
  unlockAchievement: (id: string) => void;
  updateCombo: () => void;
  resetCombo: () => void;
  getSelectedSkinEmoji: () => string;
  getSelectedSkinTrail: () => string | undefined;
  isAchievementUnlocked: (id: string) => boolean;
  isSkinUnlocked: (id: string) => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY = 'tiger-world-game-store';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const isFirstRender = React.useRef(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with initial state to handle new fields
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...INITIAL_STATE,
            ...parsed,
            achievements: INITIAL_ACHIEVEMENTS.map((a) => {
              const saved = parsed.achievements?.find((s: Achievement) => s.id === a.id);
              return saved ? { ...a, ...saved } : a;
            }),
            skins: INITIAL_SKINS.map((s) => {
              const saved = parsed.skins?.find((ps: PlayerSkin) => ps.id === s.id);
              return saved ? { ...s, unlocked: saved.unlocked } : s;
            }),
            settings: { ...INITIAL_SETTINGS, ...parsed.settings },
            progress: { ...INITIAL_PROGRESS, ...parsed.progress },
          },
        });
      } catch (e) {
        console.error('Failed to load game state:', e);
      }
    }
  }, []);

  // Save to localStorage on state change (skip first render to avoid overwriting before load)
  useEffect(() => {
    // Skip the first render - this prevents saving INITIAL_STATE before LOAD_STATE takes effect
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Generate daily challenge
  useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastDailyReset !== today) {
      const challengeTypes: DailyChallenge['type'][] = [
        'speed',
        'no_damage',
        'collect_all',
        'time_limit',
      ];
      const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
      const level = Math.min(state.progress.highestLevel + 1, 10) || 1;

      const targets: Record<string, number> = {
        speed: 60, // complete in 60 seconds
        no_damage: 1, // complete without damage
        collect_all: 1, // collect all foods
        time_limit: 120, // survive 120 seconds
      };

      dispatch({
        type: 'SET_DAILY_CHALLENGE',
        payload: {
          id: `daily-${today}`,
          date: today,
          type,
          level,
          target: targets[type],
          reward: 100 + level * 10,
          completed: false,
        },
      });
    }
  }, [state.lastDailyReset, state.progress.highestLevel]);

  // Helper functions
  const unlockAchievement = (id: string) => {
    if (!state.achievements.find((a) => a.id === id)?.unlocked) {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: id });
    }
  };

  const updateCombo = () => {
    const now = Date.now();
    const comboWindow = 1500; // 1.5 seconds to maintain combo

    if (now - state.combo.lastCollectTime < comboWindow) {
      const newCount = state.combo.count + 1;
      const newMultiplier = Math.min(1 + newCount * 0.1, 3); // Max 3x
      dispatch({
        type: 'UPDATE_COMBO',
        payload: { count: newCount, multiplier: newMultiplier, lastCollectTime: now },
      });

      // Check combo master achievement
      if (newCount >= 10) {
        unlockAchievement('combo_master');
      }
    } else {
      dispatch({
        type: 'UPDATE_COMBO',
        payload: { count: 1, multiplier: 1.1, lastCollectTime: now },
      });
    }
  };

  const resetCombo = () => {
    dispatch({ type: 'RESET_COMBO' });
  };

  const getSelectedSkinEmoji = (): string => {
    const skin = state.skins.find((s) => s.id === state.selectedSkin);
    return skin?.emoji || '🐯';
  };

  const getSelectedSkinTrail = (): string | undefined => {
    const skin = state.skins.find((s) => s.id === state.selectedSkin);
    return skin?.trailColor;
  };

  const isAchievementUnlocked = (id: string): boolean => {
    return state.achievements.find((a) => a.id === id)?.unlocked || false;
  };

  const isSkinUnlocked = (id: string): boolean => {
    return state.skins.find((s) => s.id === id)?.unlocked || false;
  };

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        unlockAchievement,
        updateCombo,
        resetCombo,
        getSelectedSkinEmoji,
        getSelectedSkinTrail,
        isAchievementUnlocked,
        isSkinUnlocked,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameStore must be used within a GameProvider');
  }
  return context;
}

export default GameContext;
