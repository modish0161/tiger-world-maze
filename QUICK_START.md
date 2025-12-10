# Tiger World Quick Start Guide

## 🚀 First Time Setup

### Backend Setup (Flask API)
1. Open a terminal in the `backend` folder
2. Activate the virtual environment:
   ```bash
   .\venv\Scripts\activate
   ```
3. Install dependencies (if not already done):
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup (React + TypeScript)
1. Open a terminal in the `frontend` folder
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

## 🎮 Running the Application

### Option 1: Quick Start (Windows)
Simply double-click `start-dev.bat` - this will open both servers automatically!

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\activate
python run.py
```
Backend runs at: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

## 📱 Access the Game

1. Open your browser and go to **http://localhost:5173**
2. Click "PLAY NOW" to start!
3. Select a level and enjoy the game!

## 🛠️ Development Tips

### Testing Backend API
You can test the API directly:
- Health Check: http://localhost:5000/api/health
- All Levels: http://localhost:5000/api/levels

### Hot Reload
Both servers support hot reload:
- Backend: Will restart automatically when you edit Python files
- Frontend: Will refresh automatically when you edit React files

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```
Output will be in `frontend/dist/`

**Backend:**
For production, use a proper WSGI server:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

## 🎯 Game Controls

- **Click/Tap**: Move your tiger emoji character
- **Goal**: Collect all food emojis and reach the golden square

## 📂 Important Files

- `backend/app/maze.py` - Maze generation and pathfinding algorithms
- `backend/app/game.py` - Game logic and scoring
- `backend/app/api.py` - API endpoints
- `frontend/src/components/GameBoard.tsx` - Main game component
- `frontend/src/components/HomeScreen.tsx` - Landing page

## ⚠️ Troubleshooting

**Backend won't start:**
- Make sure Python 3.10+ is installed
- Activate the virtual environment first
- Check if port 5000 is already in use

**Frontend won't start:**
- Make sure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again
- Check if port 5173 is already in use

**Game won't connect to backend:**
- Make sure both servers are running
- Check browser console for errors
- Verify backend is at http://localhost:5000

## 🎨 Customization

### Change Maze Size
Edit `backend/app/game.py` - modify the `get_level_config()` function

### Add New Food Emojis
Edit `backend/app/maze.py` - add to the `FOOD_EMOJIS` list

### Change Colors/Themes
Edit `frontend/src/index.css` - modify CSS variables in `:root`

## 🚀 Next Steps

1. Test the game on different browsers
2. Test on mobile devices (responsive design)
3. Add sound effects (optional)
4. Deploy to a web server
5. Create PWA icons for mobile installation

---

**Have fun building Tiger World! 🐯🎮**
