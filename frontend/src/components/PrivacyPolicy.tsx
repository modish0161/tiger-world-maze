import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-content card">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: December 2024</p>

        <section>
          <h2>Introduction</h2>
          <p>
            Welcome to Tiger World Maze ("Game"), developed and operated by Indigo Pascal Ltd 
            ("we", "us", or "our"). This Privacy Policy explains how we collect, use, and 
            protect your information when you use our Game.
          </p>
        </section>

        <section>
          <h2>Information We Collect</h2>
          
          <h3>Information You Provide</h3>
          <ul>
            <li><strong>Player Name:</strong> When you submit a score to our leaderboard, you may optionally provide a display name.</li>
            <li><strong>Game Scores:</strong> Your high scores and level completions are stored to enable leaderboard functionality.</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <ul>
            <li><strong>Local Storage:</strong> We use your browser's local storage to save your game progress, settings preferences, and achievements.</li>
            <li><strong>Device Information:</strong> Basic device type information may be collected for game optimization purposes.</li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain the Game functionality</li>
            <li>To display leaderboards and enable score comparisons</li>
            <li>To save your game progress and preferences</li>
            <li>To improve and optimize the Game experience</li>
          </ul>
        </section>

        <section>
          <h2>Data Storage</h2>
          <p>
            Most game data is stored locally on your device using browser local storage. 
            Leaderboard scores are stored on our servers to enable score comparisons between players.
          </p>
        </section>

        <section>
          <h2>Data Sharing</h2>
          <p>
            We do not sell, trade, or share your personal information with third parties, 
            except as required by law or to protect our rights.
          </p>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>
            Tiger World Maze is designed to be family-friendly. We do not knowingly collect 
            personal information from children under 13. The only information collected 
            is optional display names for leaderboards.
          </p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Request deletion of your leaderboard entries</li>
            <li>Clear your local game data through your browser settings</li>
            <li>Contact us with any privacy-related questions</li>
          </ul>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of 
            any changes by posting the new Privacy Policy on this page and updating the 
            "Last Updated" date.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="contact-info">
            <li><strong>Email:</strong> <a href="mailto:games@indigopascal.com">games@indigopascal.com</a></li>
            <li><strong>Website:</strong> <a href="https://www.indigopascal.com" target="_blank" rel="noopener noreferrer">www.indigopascal.com</a></li>
            <li><strong>Company:</strong> Indigo Pascal Ltd (Company No. 15658950)</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
