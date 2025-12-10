import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Score {
    id: number;
    player_name: string;
    score: number;
    level: number;
    timestamp: string;
}

const getLeaderboard = async (limit: number = 10): Promise<Score[]> => {
    try {
        const response = await axios.get(`${API_URL}/leaderboard?limit=${limit}`);
        return response.data.leaderboard;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};

const submitScore = async (gameId: string, playerName: string, timeElapsed: number): Promise<any> => {
    try {
        const response = await axios.post(`${API_URL}/game/${gameId}/complete`, {
            player_name: playerName,
            time_elapsed: timeElapsed
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting score:', error);
        throw error;
    }
};

export default {
    getLeaderboard,
    submitScore
};
