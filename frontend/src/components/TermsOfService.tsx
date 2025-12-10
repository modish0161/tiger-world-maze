import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css'; // Reuse legal page styles

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-content card">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: December 2024</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and playing Tiger World Maze ("Game"), you agree to be bound by these 
            Terms of Service ("Terms"). If you do not agree to these Terms, please do not 
            use the Game. The Game is operated by Indigo Pascal Ltd ("we", "us", or "our").
          </p>
        </section>

        <section>
          <h2>2. Game Description</h2>
          <p>
            Tiger World Maze is a free-to-play puzzle game where players navigate mazes, 
            collect items, and compete on leaderboards. The Game is provided as-is for 
            entertainment purposes.
          </p>
        </section>

        <section>
          <h2>3. User Conduct</h2>
          <p>When using the Game, you agree to:</p>
          <ul>
            <li>Use appropriate and family-friendly display names on leaderboards</li>
            <li>Not attempt to cheat, hack, or exploit the Game</li>
            <li>Not use automated tools or bots to play the Game</li>
            <li>Not submit false or misleading scores</li>
            <li>Respect other players and the gaming community</li>
          </ul>
          <p>
            We reserve the right to remove any leaderboard entries that violate these 
            guidelines without notice.
          </p>
        </section>

        <section>
          <h2>4. Intellectual Property</h2>
          <p>
            All content in the Game, including but not limited to graphics, gameplay 
            mechanics, audio, and code, is owned by Indigo Pascal Ltd and is protected 
            by intellectual property laws. You may not copy, modify, distribute, or 
            create derivative works without our written permission.
          </p>
        </section>

        <section>
          <h2>5. Game Availability</h2>
          <p>
            We strive to keep the Game available 24/7, but we do not guarantee 
            uninterrupted access. We may temporarily suspend the Game for maintenance, 
            updates, or other reasons without prior notice.
          </p>
        </section>

        <section>
          <h2>6. Disclaimer of Warranties</h2>
          <p>
            THE GAME IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY 
            KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE GAME WILL BE 
            ERROR-FREE, UNINTERRUPTED, OR FREE OF HARMFUL COMPONENTS.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, INDIGO PASCAL LTD SHALL NOT BE 
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
            DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE GAME.
          </p>
        </section>

        <section>
          <h2>8. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Game after 
            changes are posted constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2>9. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws 
            of England and Wales.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us:
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

export default TermsOfService;
