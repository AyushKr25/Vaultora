"""
Bank Management System - Flask Application Entry Point
"""
from dotenv import load_dotenv
load_dotenv()  # Load env BEFORE any imports

from app import create_app

app = create_app()

if __name__ == '__main__':
    # Disable reloader to avoid JWT secret key issues with child processes
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)

