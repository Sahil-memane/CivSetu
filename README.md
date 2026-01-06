# 🌉 CivSetu - Civic Issue Management Platform

CivSetu is a modern bridging platform designed to connect citizens with municipal authorities, enabling efficient reporting, tracking, and resolution of civic issues. It empowers citizens to voice their concerns and provides authorities with the tools to manage and resolve them effectively.

## ✨ Features

### 👥 For Citizens

- **Effortless Reporting**: Report issues with location, detailed descriptions, categories, and priority levels.
- **Rich Media Proofs**: Attach images and voice notes to validate reports.
- **Real-time Tracking**: Monitor the status of reported issues (Pending, In Progress, Resolved).
- **Interactive Map**: View all reported issues on a Google Map interface with markers.
- **Transparency**: View detailed official response plans, including action plans, allocated staff, and resources.
- **Verification**: See "Resolution Verified" proofs (images, remarks) uploaded by authorities upon completion.
- **Community Engagement**: Upvote (Agree), downvote (Disagree), and comment on issues to highlight community impact.

### 🏛️ For Authorities (Admin)

- **Comprehensive Dashboard**: Get a real-time overview of total, pending, in-progress, and resolved issues.
- **Issue Management**: Filter, search, and sort issues by priority, status, or category.
- **Smart Priority AI**: **Gemini AI** integration automatically analyzes issue descriptions to assign priority levels (Low, Medium, High, Critical).
- **Resolution Workflow**:
  - **Plan Resolution**: Define action plans, allocate staff/resources, and upload planning documents.
  - **Resolve Issue**: Upload final proof of work (images) and concluding remarks to mark an issue as resolved.
  - **Reject Issue**: Reject invalid or duplicate reports with a reason and evidence.
- **Department Filtering**: Admins see issues relevant to their specific department (e.g., Sanitation, Roads, Water).
- **Analytics**: Visual insights into issue trends and resolution performance.

## 🛠️ Technology Stack

### Frontend

- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: Shadcn UI (Radix Primitives)
- **Icons**: Lucide React
- **Maps**: `@vis.gl/react-google-maps`
- **State Management**: React Context API
- **Animations**: Framer Motion

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Cloud Storage (Images, Voice Notes, Documents)
- **AI Integration**: Google Gemini AI (for Priority Detection)
- **Authentication**: Firebase Admin SDK

## 📂 Project Structure

```bash
CivSetu/
├── frontend/             # React Client Application
│   ├── src/
│   │   ├── components/   # Reusable UI components (ui/, issues/, common/)
│   │   ├── pages/        # Route pages (Home, ManageIssues, AdminDashboard, etc.)
│   │   ├── contexts/     # AuthContext, etc.
│   │   ├── lib/          # Utilities and Firebase config
│   │   └── ...
│   └── ...
├── backend/              # Node.js Express Server
│   ├── config/           # Firebase Admin Setup
│   ├── routes/           # API Routes (issueRoutes.js)
│   ├── services/         # Business Logic (geminiService.js)
│   ├── middleware/       # Auth and Upload Middleware
│   ├── scripts/          # Database migration/seed scripts
│   └── server.js         # Entry point
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase Project (Firestore, Auth, Storage enabled)
- Google Maps API Key
- Gemini AI API Key

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/CivSetu.git
    cd CivSetu
    ```

2.  **Setup Backend**

    ```bash
    cd backend
    npm install
    ```

    - Create a `.env` file in `backend/`:
      ```env
      PORT=5000
      GEMINI_API_KEY=your_gemini_key
      ```
    - Place your Firebase Admin SDK JSON as `serviceAccountKey.json` in `backend/`.

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```
    - Create a `.env` file in `frontend/`:
      ```env
      VITE_FIREBASE_API_KEY=...
      VITE_FIREBASE_AUTH_DOMAIN=...
      VITE_FIREBASE_PROJECT_ID=...
      VITE_FIREBASE_STORAGE_BUCKET=...
      VITE_FIREBASE_MESSAGING_SENDER_ID=...
      VITE_FIREBASE_APP_ID=...
      VITE_GOOGLE_MAPS_API_KEY=...
      ```

### Running the Application

1.  **Start Backend**

    ```bash
    cd backend
    npm run dev
    ```

2.  **Start Frontend**

    ```bash
    cd frontend
    npm run dev
    ```

3.  Access the app at `http://localhost:8080` (or the port Vite exposes).

## 🔌 API Endpoints

### Issues

- `GET /api/issues/all` - Fetch all issues (supports filtering).
- `POST /api/issues/report` - Report a new issue (Multipart Form Data).
- `PUT /api/issues/:id/status` - Update status / Add Planning details.
- `POST /api/issues/:id/resolve` - Mark issue as resolved with proofs.
- `POST /api/issues/:id/reject` - Reject an issue.
- `POST /api/issues/:id/engage` - Like/Dislike an issue.
- `POST /api/issues/:id/comment` - Add a comment.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements.

## 📄 License

This project is licensed under the MIT License.
