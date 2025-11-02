# Invaders Paris 🛸

A web application to track and map Space Invaders in Paris. This project maintains a map showing validated invaders, those that cannot be flashed, and their addresses.

## Features

- Interactive map showing all Space Invaders locations in Paris
- Statistics dashboard with flash history and progress tracking
- Backend API for managing invader data
- Support for uploading flash videos (currently disabled)

## Quick Start with Docker (Recommended) 🐳

The easiest way to run the application is using Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd invaders-paris

# Start both frontend and backend services
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Manual Development Setup 🔧

If you prefer to run the services separately for development:

### Backend Setup

```bash
cd invaders-backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask server
python3 app.py
```

The backend will run on http://localhost:5000

### Frontend Setup

```bash
cd invaders-frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will run on http://localhost:3000 and will proxy API calls to the backend.

## Environment Variables

Create a `.env` file in the `invaders-backend` directory with:

```
RESTORE_INVADER_API=https://api.space-invaders.com/flashinvaders_v3_pas_trop_predictif/api/gallery?uid=
MY_UID=your_uid_here
```

## API Endpoints

The backend provides several API endpoints:

- `GET /api/invaders` - Get all invaders data
- `GET /api/flash_history` - Get flash history statistics
- `GET /api/stats` - Get overall statistics
- `POST /api/upload_flash` - Upload flash video (currently disabled)

## Project Structure

```
invaders-paris/
├── invaders-backend/          # Flask API server
│   ├── app.py                # Main Flask application
│   ├── data/                 # CSV data files
│   ├── static/               # Static assets (images)
│   ├── templates/            # HTML templates
│   ├── uploads/              # Uploaded files
│   └── Dockerfile            # Backend container config
├── invaders-frontend/         # React application
│   ├── src/                  # React source code
│   ├── public/               # Public assets
│   └── Dockerfile            # Frontend container config
└── docker-compose.yml         # Multi-service orchestration
```

## Contributing Invaders Data 📹

### Video Upload (Currently Disabled)

To contribute new flashed invaders:

1. Record a slow screen video (scroll with finger without releasing momentum)
2. Edit the video to keep only the part showing the invaders (allows proper detection of the last invaders)
3. Upload through the application interface (feature needs to be re-enabled in `app.py`)

## Development Notes

- The frontend is configured to proxy API requests to the backend during development
- Docker volumes are mounted for live code reloading during development
- The backend serves both API endpoints and static HTML templates
