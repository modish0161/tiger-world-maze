# Tiger World Backend Deployment Files

## Quick Deployment to Render.com

1. Push your code to GitHub
2. Go to https://render.com and sign up
3. Create a new Web Service:
   - **Name**: tiger-world-api
   - **Environment**: Python 3
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT "app:create_app()"`

Your backend URL will be: `https://tiger-world-api.onrender.com`

## Environment Variables

Set these in your Render dashboard:
- `PYTHON_VERSION` = `3.10.0`

## Vercel Frontend Deployment

1. Import your GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set environment variables:
   - `VITE_API_URL` = `https://tiger-world-api.onrender.com/api`

## Local Testing

```bash
cd backend
.\venv\Scripts\activate
python run.py
```

Backend will run at http://localhost:5000
