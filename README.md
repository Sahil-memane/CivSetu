# CivSetu - Civic Engagement Platform

CivSetu is a bridge between citizens and municipal authorities, enabling real-time reporting and tracking of civic issues like potholes, garbage, and street lighting.

## 🚀 Features

### Citizen Dashboard (Frontend)

- **Dashboard UI**: Overview of reported issues and civic stats.
- **Issue Reporting**:
  - AI-powered priority detection (via Gemini).
  - Image & Voice uploads.
  - Categorization (Pothole, Garbage, Water, etc.).
- **Map View**: Interactive map showing issues across the city.
- **Authentication**: Secure login/signup via Firebase.

### Backend API

- **Process Management**: Handles submissions, file uploads, and AI analysis.
- **Database**: Firestore integration for real-time updates.
- **Intelligence**: Google Cloud Vision & Gemini API for analyzing issue severity.

## � Google Technology Stack

This project leverages the power of the Google Cloud ecosystem to deliver a smart and scalable solution.

- **Google Gemini (Generative AI)**

  - **Usage**: Analyzes images of reported issues (potholes, garbage, etc.) to automatically determine severity, category, and priority.
  - **Benefit**: Reduces manual verification time and prioritizes critical issues effectively.

- **Google Maps Platform** (Integration in Progress)

  - **Usage**: Provides an interactive map interface for citizens to visualize issues in their vicinity.
  - **Benefit**: Offers high-precision geolocation and a familiar user interface.

- **Firebase** (Google Cloud)

  - **Authentication**: Secure and seamless sign-in for users.
  - **Firestore**: Real-time NoSQL database for instant issue tracking and status updates.

- **Google Cloud Vision** (via Gemini Multimodal capabilities)
  - **Usage**: Understanding visual context in reported issue images.

## �🛠️ Technology Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Shadcn UI.
- **Backend**: Node.js, Express.js.
- **Services**: Firebase (Auth, Firestore), Google Generative AI (Gemini), Multer.

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v18+)
- Firebase Project (with Auth & Firestore enabled)
- Google Cloud Project (with Gemini API enabled)

### 1. Backend Setup

1.  Navigate to the backend directory:

    ```bash
    cd backend
    npm install
    ```

2.  **Environment Variables**: Create a `.env` file in `backend/`:

    ```env
    PORT=5000

    # Google Gemini API Key (for AI Analysis)
    GEMINI_API_KEY=your_gemini_api_key_here

    # Firebase Service Account (JSON string single line)
    # Get this from Firebase Console -> Project Settings -> Service Accounts
    FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
    ```

3.  Start the server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup

1.  Navigate to the frontend directory:

    ```bash
    cd frontend
    npm install
    ```

2.  **Environment Variables**: Create a `.env` file in `frontend/`:

    ```env
    # Firebase Client Config (Get from Firebase Console)
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

    # Google Maps API Key (Optional for now, required for Live Map)
    VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
    ```

    _(Note: Currently `src/lib/firebase.ts` might be hardcoded for dev. Update it to use `import.meta.env` keys above)._

3.  Start the development server:
    ```bash
    npm run dev
    ```

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description                           | Access  |
| :----- | :------- | :------------------------------------ | :------ |
| `GET`  | `/me`    | Get current user profile details      | Private |
| `POST` | `/sync`  | Sync frontend user data to backend DB | Private |

### Issues (`/api/issues`)

| Method | Endpoint  | Description                             | Access  |
| :----- | :-------- | :-------------------------------------- | :------ |
| `POST` | `/submit` | Submit a new issue (with files)         | Private |
| `GET`  | `/user`   | Get all issues reported by current user | Private |
| `GET`  | `/all`    | Get all issues (for Map View)           | Public  |

## 📁 Project Structure

```
CivSetu/
├── backend/
│   ├── config/         # Firebase & DB Config
│   ├── middleware/     # Auth & Upload Middleware
│   ├── routes/         # API Routes (auth, issues)
│   ├── services/       # AI & Business Logic
│   └── uploads/        # Local file storage (temp)
│
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── pages/      # Application Pages (Dashboard, Map, etc.)
    │   ├── lib/        # Utilities & Firebase client
    │   └── contexts/   # React Context (Auth)
```
