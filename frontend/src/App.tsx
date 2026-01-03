import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Achievements from './components/Achievements';
import EnhancedGameBoard from './components/EnhancedGameBoard';
import ErrorBoundary from './components/ErrorBoundary';
import HomeScreen from './components/HomeScreen';
import Leaderboard from './components/Leaderboard';
import LevelSelect from './components/LevelSelect';
import PrivacyPolicy from './components/PrivacyPolicy';
import Settings from './components/Settings';
import TermsOfService from './components/TermsOfService';
import Tutorial from './components/Tutorial';
import './index.css';
import { GameProvider } from './store/GameContext';

function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/levels" element={<LevelSelect />} />
            <Route path="/game/:level" element={<EnhancedGameBoard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
          </Routes>
        </Router>
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;
