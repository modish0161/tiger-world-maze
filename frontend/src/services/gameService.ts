// API client for Tiger World backend
import axios from 'axios';
import type {
    CompleteGameRequest,
    GameState,
    LeaderboardEntry,
    LevelConfig,
    NewGameRequest,
    ProgressUpdate
} from '../types/game';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const gameService = {
  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await api.get('/health');
    return response.data;
  },

  // Create new game
  async createNewGame(level: number = 1): Promise<GameState> {
    const request: NewGameRequest = { level };
    const response = await api.post('/game/new', request);
    return response.data;
  },

  // Get game state
  async getGameState(gameId: string): Promise<GameState> {
    const response = await api.get(`/game/${gameId}`);
    return response.data;
  },

  // Update game progress
  async updateProgress(gameId: string, foodsCollected: number, timeElapsed: number): Promise<GameState> {
    const update: ProgressUpdate = {
      foods_collected: foodsCollected,
      time_elapsed: timeElapsed,
    };
    const response = await api.post(`/game/${gameId}/progress`, update);
    return response.data;
  },

  // Complete game
  async completeGame(gameId: string, playerName: string, timeElapsed: number): Promise<GameState> {
    const request: CompleteGameRequest = {
      player_name: playerName,
      time_elapsed: timeElapsed,
    };
    const response = await api.post(`/game/${gameId}/complete`, request);
    return response.data;
  },

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<{ leaderboard: LeaderboardEntry[]; count: number }> {
    const response = await api.get('/leaderboard', { params: { limit } });
    return response.data;
  },

  // Get level info
  async getLevelInfo(level: number): Promise<LevelConfig> {
    const response = await api.get(`/levels/${level}`);
    return response.data;
  },

  // Get all levels
  async getAllLevels(): Promise<{ levels: LevelConfig[] }> {
    const response = await api.get('/levels');
    return response.data;
  },
};

export default gameService;
