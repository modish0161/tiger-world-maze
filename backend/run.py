"""Run the Flask development server"""
from app import create_app

app = create_app()

if __name__ == '__main__':
    print("🐯 Starting Tiger World Backend API...")
    print("📍 Server running at http://localhost:5000")
    print("📚 API endpoints available at http://localhost:5000/api/")
    app.run(debug=True, host='0.0.0.0', port=5000)
