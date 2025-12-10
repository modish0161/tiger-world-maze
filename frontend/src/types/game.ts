// Type definitions for Tiger World game

export interface Position {
  x: number;
  y: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  type: 'ghost' | 'zombie';
  speed: number;
  path: [number, number][];
  targetIndex: number;
}

export interface GameState {
  id: string;
  level: number;
  rows: number;
  cols: number;
  maze_grid: string[][];
  start: [number, number];
  goal: [number, number];
  total_foods: number;
  foods_collected?: number;
  score?: number;
  status: 'active' | 'completed' | 'failed' | 'paused';
  lives?: number;
  enemies?: Enemy[];
}

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  level: number;
  time: number;
  foods_collected: number;
}

export interface LevelConfig {
  level: number;
  rows: number;
  cols: number;
  description: string;
}

export interface NewGameRequest {
  level: number;
}

export interface ProgressUpdate {
  foods_collected: number;
  time_elapsed: number;
}

export interface CompleteGameRequest {
  player_name: string;
  time_elapsed: number;
}
