🏡** Real Estate Market Analysis Dashboard**

This project is a full-stack web application designed to demonstrate proficiency in modern development (React/Tailwind CSS) and robust backend data processing (Django/Python/Pandas).
The application accepts natural language queries, analyzes structured real estate data (from an uploaded or preloaded Excel file), and presents the findings in an interactive dashboard.
🚀 Key Features
Feature Category
Implementation Detail
Focus
Data Source Flexibility
Accepts File Upload (via API) OR uses a preloaded Excel dataset. The system dynamically prioritizes the latest uploaded file.
Dynamic Data Handling
Advanced Query Parsing
The backend is capable of handling complex natural language queries, including:
Accuracy and Logic
    1. Single Analysis (e.g., "Analyze Wakad")
Filters by a single area and returns a dual-axis chart.


    2. Multi-Area Comparison (e.g., "Compare Aundh and Ambegaon Budruk")
Processes data for 2+ areas and generates a unified Comparison Chart.


    3. Time Filtering (e.g., "Show price growth over the last 3 years")
Parses and applies year constraints to the dataset for accurate historical trend analysis.


Comprehensive Data Output
The application returns a natural language summary, dynamic charts, and the complete filtered table data.
Completeness of Output
Frontend UI/UX
The application uses a clean, responsive interface built with React and Tailwind CSS, presenting a professional analytical dashboard.
UI/UX and Code Structure

Bonus Features
"Download Data" Option: Added buttons to download the visualization (Chart as PNG) and the raw results (Table as CSV).
Modern Styling: Utilizes Tailwind CSS for a high-quality, responsive design with Dark/Light mode toggle.
⚙️ Installation & Run Steps
A. Prerequisites
Python 3.8+ (with pip and venv)
Node.js (LTS) & npm
B. Project Structure
Ensure your structure includes a data folder at the project root:
project-root/
├── backend/
├── frontend/
└── data/
    └── dataset.xlsx  <-- REQUIRED DATA FILE


C. Backend Setup (Terminal 1 - Django)
# Navigate to the backend directory
cd backend

# Activate virtual environment
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the Django server
python manage.py runserver
# Backend runs on [http://127.0.0.1:8000](http://127.0.0.1:8000)


D. Frontend Setup (Terminal 2 - React)
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
# Frontend runs on http://localhost:3000/


🧰 API Endpoints
Your application primarily uses two POST endpoints for dynamic data retrieval and upload.
Method
Endpoint
Description
POST
/api/query/
Submits natural language query; returns analysis (summary, chart data, table).
POST
/api/upload/
Uploads and saves a new .xlsx or .csv dataset to the backend.

📹 Demo Verification
To fully verify the project's features, test the following complex queries in the application:
Basic Analysis: "Give me analysis of Wakad"
Time Filtering: "Show price growth for Akurdi over the last 3 years"
Multi-Area Comparison: "Compare Ambegaon Budruk and Aundh demand trends"
