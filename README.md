# Clarity: AI-Powered Cognitive Load Triage Platform

Clarity is a modern, responsive full-stack web application designed to help users declutter their minds and overcome decision paralysis. It ingests unstructured, stream-of-consciousness brain dumps via text or voice recording, segments them into atomic items, analyzes and prioritizes them using an MCDA priority scoring system, and stores them in a local SQLite database.

---

## 🌟 Key Features

1.  **Empty Your Mind (Brain Dump)**
    *   Ingest raw thoughts through a stream-of-consciousness text field.
    *   Supports hands-free voice dictation using the native Web Speech API.
2.  **AI Triage Pipeline**
    *   Leverages Cloudflare Worker processing (`llama-3.3-70b-versatile` via Groq) to segment and classify thoughts.
    *   Classifies items into four core action columns:
        *   **Decide Now**: Active choices requiring near-term resolution.
        *   **Needs Info**: Actions blocked by a lack of details.
        *   **Tasks**: Actionable chores or todo items.
        *   **Let Go**: Anxieties or low-priority thoughts to dismiss.
3.  **Local Safety Guardrails**
    *   Performs local regex checks against distress keywords (e.g. self-harm, severe anxiety) to flag thoughts.
    *   Prevents distress thoughts from being classified as 'Let Go', keeping them visible for user safety.
4.  **Priority Matrix & MCDA Scoring**
    *   Thoughts are prioritized based on: `priority_score = urgency * stakes (impact) * reversibility`.
    *   Supports editing scores and moving thoughts across categories.
5.  **Focus Zone**
    *   Displays the single highest-priority unresolved decision.
    *   Prompts the user with an AI-generated clarifying question to ease decision paralysis.
6.  **Database Explorer**
    *   CRUD interfaces for direct table-level inspection of thoughts, brain dumps, and safety flags.
    *   Guarantees cascading deletions across SQLite relationships.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Tailwind CSS, React Router, Axios, Lucide Icons.
*   **Backend**: Node.js, Express, SQLite3 (Relational database with foreign key support).
*   **AI Integration**: Serverless Cloudflare Worker API.

---

## 📂 Project Directory Layout

```
f:\USAII/
├── backend/
│   ├── routes/
│   │   ├── dumps.js          # Brain dumps and thoughts CRUD
│   │   ├── safety.js         # Distress keyword intercepts CRUD
│   │   └── settings.js       # App configuration key-value store
│   ├── services/
│   │   └── triageService.js  # Worker API client & local safety sweep
│   ├── db.js                 # SQLite connection & Promise wrappers
│   ├── server.js             # Express application entrypoint
│   └── package.json          # Node dependencies
├── database/
│   ├── schema.sql            # Table definitions (users, thoughts, etc.)
│   └── usaii.db              # Active SQLite database file
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── apiService.js # Axios integration layer
    │   ├── components/
    │   │   └── Navbar.jsx    # Sticky navigation header & API monitor
    │   ├── pages/
    │   │   ├── Home.jsx           # Main stats & load index dashboard
    │   │   ├── BrainDumpPage.jsx  # Ingestion & speech text capture
    │   │   ├── TriagePage.jsx     # Column matrix board with inline edit
    │   │   ├── FocusPage.jsx      # High leverage focus question response
    │   │   ├── DbExplorer.jsx     # Direct SQLite table viewer & cascades
    │   │   └── SettingsPage.jsx   # Dictionary keys & safety intercepts
    │   ├── App.jsx           # React Router DOM mapping
    │   └── index.css         # Glassmorphism design and custom variables
    ├── tailwind.config.js    # Tailwind CSS layout configuration
    └── package.json          # Vite dependencies
```

---

## 🚀 Getting Started

### 1. Setup Environment Variables
Configure the backend server if you plan to override the API endpoints. Create `.env` files in both the `backend/` and `frontend/` folders:

*   **`backend/.env`**:
    ```env
    PORT=5000
    ```
*   **`frontend/.env`**:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```

### 2. Run the Express Backend
Install dependencies and spin up the Express server:
```bash
cd backend
npm install
npm start
```
*The backend API will run on `http://localhost:5000`.*

### 3. Run the Vite Frontend
Install packages and start the React dev server:
```bash
cd frontend
npm install
npm run dev
```
*The React web app will open at `http://localhost:5173`.*

---

## 🗄️ Database Design

The schema enforces strict foreign key checks and cascades:
*   **`users`**: User profile credentials.
*   **`brain_dumps`**: Log of raw text.
*   **`thoughts`**: Classified items with priority factors.
*   **`follow_up_questions`**: Questions and answers associated with a thought.
*   **`safety_flags`**: Tracks thoughts matching distress keywords.

---

## 🎥 Walkthrough Video & Artifacts
Walkthrough documentation and the video recording of the working application flow are saved in:
*   **Video Recording**: Saved inside `<appDataDir>\brain\cc17e692-7f51-43f7-b106-ae36ebfec74c\clarity_platform_video_1782025571744.webp`
*   **Walkthrough Guide**: [project_walkthrough.md](file:///C:/Users/swadesh%20narwariya/.gemini/antigravity/brain/cc17e692-7f51-43f7-b106-ae36ebfec74c/project_walkthrough.md)
*   **Database Design Document**: [database_design.md](file:///C:/Users/swadesh%20narwariya/.gemini/antigravity/brain/cc17e692-7f51-43f7-b106-ae36ebfec74c/database_design.md)
