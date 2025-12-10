# 🐯 Tiger World - Maze Adventure Game

A fun and addictive maze puzzle game where you navigate through dynamic mazes, collect delicious snacks, and master increasingly challenging levels!

## 🎮 Features

- **Dynamic Maze Generation**: Each level features a unique, randomly generated maze
- **Progressive Difficulty**: 10 challenging levels with increasing maze complexity
- **Smooth Gameplay**: Canvas-based rendering with 60 FPS animations
- **Leaderboard**: Compete with friends and track high scores
- **Premium UI/UX**: Beautiful glassmorphism design with smooth animations
- **Mobile-First**: Fully responsive and optimized for touch controls
- **PWA Support**: Install on mobile devices like a native app

## 🛠️ Tech Stack

### Backend
- **Python 3.10+**
- **Flask** - REST API server
- **Flask-CORS** - Cross-origin support

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Axios** - API client
- **Canvas API** - Game rendering

## 🚀 Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python run.py
```

Backend will run at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

Frontend will run at `http://localhost:5173`

## 🎯 How to Play

1. Click **PLAY NOW** from the home screen
2. Select your desired level
3. Click anywhere on the maze to move your tiger emoji character
4. Collect all the food emojis (🍗, 🍖, 🍔, 🥩, etc.)
5. Reach the golden square to complete the level
6. Beat your time and climb the leaderboard!

## 📱 Mobile Installation (PWA)

1. Open the game in Chrome (Android) or Safari (iOS)
2. Tap the menu button
3. Select "Add to Home Screen"
4. Enjoy the game like a native app!

## 🏗️ Project Structure

```
Tiger-World-App/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api.py          # REST API endpoints
│   │   ├── game.py         # Game logic & state
│   │   └── maze.py         # Maze generation & pathfinding
│   ├── venv/               # Python virtual environment
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   └── manifest.json   # PWA manifest
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🎨 Design Features

- **Glassmorphism** UI with backdrop blur effects
- **Vibrant Color Palette** with gold and brown themes
- **Smooth Animations** including floating particles and glowing buttons
- **Premium Typography** using Fredoka One and Nunito fonts
- **Responsive Design** optimized for all screen sizes

## 🔧 API Endpoints

- `GET /api/health` - Health check
- `POST /api/game/new` - Create new game
- `GET /api/game/:id` - Get game state
- `POST /api/game/:id/progress` - Update progress
- `POST /api/game/:id/complete` - Complete game
- `GET /api/leaderboard` - Get top scores
- `GET /api/levels` - Get all levels

## 📦 Building for Production

### Frontend
```bash
cd frontend
npm run build
```

### Backend
For production, use a WSGI server like Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

## 🎯 Future Enhancements

- [ ] Sound effects and music
- [ ] More game modes (time trial, endless)
- [ ] Achievements and badges
- [ ] Social features (share scores)
- [ ] Desktop app (Electron)
- [ ] Native mobile apps (React Native)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

**Made with 🐯 and ❤️**
