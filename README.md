# TrustVest - Secure Micro-Investment App

## 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **MongoDB** (Community Server running locally or Atlas URI)

## 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup Environment:
   - Ensure the `.env` file exists in the root (check `MONGO_URL` and `API_KEY`).
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## 3. Frontend Setup
1. Open a new terminal in the root folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173).

## Troubleshooting
- **Backend Offline?** Ensure MongoDB is running.
- **API Key Error?** Add your Google Gemini API key to `.env`.
