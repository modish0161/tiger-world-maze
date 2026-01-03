"""Tiger World Backend API"""
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # CORS - Allow frontend origins
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:4173",
        "https://tiger-world-maze.vercel.app",
        os.environ.get('FRONTEND_URL', '')
    ]
    # Use regex pattern for Vercel preview deployments
    CORS(app, origins=[o for o in allowed_origins if o], 
         resources={r"/api/*": {"origins": "*"}},
         supports_credentials=True)
    
    # Database Config - Use PostgreSQL in production, SQLite locally
    basedir = os.path.abspath(os.path.dirname(__file__))
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        # Render uses postgres://, SQLAlchemy needs postgresql://
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'tigerworld.db')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    with app.app_context():
        from . import models
        db.create_all()
    
    return app

