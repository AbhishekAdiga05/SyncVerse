# Pairverse

> Collaborative code editor with real-time CRDT sync, AI code review, and collaborative whiteboarding.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20-33993F?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Yjs-CRDT-FF6B35?style=for-the-badge" alt="Yjs" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

---

## Features

| Feature | Description |
|---|---|
| **Real-Time Editor** | Monaco editor synced via Yjs CRDT — no locks, no conflicts, no central merge. Each room gets an isolated Yjs document namespace. |
| **AI Code Review** | Select code → choose Explain / Refactor / Generate / Debug → OpenRouter LLM returns read-only markdown (never auto-inserted). |
| **Collaborative Whiteboard** | Full tldraw canvas backed by the same Yjs doc. Toggle between editor and board — drawings sync in real time. |
| **Integrated Chat** | Ephemeral, room-scoped chat via Socket.IO. Last 50 messages in memory, rate-limited (10/5s), identity stored server-side. |
| **Multi-Language Execution** | Run JS/TS/Python/C++/Java/Go/Rust via Judge0 CE. Interactive terminal with stdin, command history, and stdout/stderr output. |
| **Workspace Persistence** | 2 s debounced auto-save to MongoDB. Full CRDT state restored on reconnect — code, drawings, and cursors. |
| **Auth (Clerk)** | Google, GitHub, email sign-in. Client-side session management; server validates tokens with `@clerk/backend`. |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React + Vite)                      │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Monaco   │  │  tldraw      │  │  Chat    │  │  Terminal     │  │
│  │  Editor   │  │  Whiteboard  │  │  Panel   │  │  Panel        │  │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └──────┬────────┘  │
│       │               │                │                │           │
│       └───────────────┴────────────────┴────────────────┘           │
│                              │                                      │
│                    ┌─────────▼─────────┐                            │
│                    │  Yjs Document      │                            │
│                    │  (CRDT State)      │                            │
│                    └─────────┬─────────┘                            │
│                              │                                      │
│                    ┌─────────▼─────────┐                            │
│                    │  y-socket.io       │                            │
│                    │  (WebSocket)       │                            │
│                    └─────────┬─────────┘                            │
│                              │                                      │
│                    ┌─────────▼─────────┐                            │
│                    │  CommandPalette   │                            │
│                    │  ConnectionBanner │                            │
│                    │  ErrorBoundary    │                            │
│                    └───────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
                              │ WebSocket (Socket.IO)
                              │ REST (HTTP)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVER (Express + Socket.IO)               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Middleware Layer                                              │  │
│  │  Helmet (CSP) │ CORS │ Rate Limiter │ Clerk Auth (requireAuth)│  │
│  └────────────────────────┬──────────────────────────────────────┘  │
│                           │                                        │
│  ┌────────────────────────▼──────────────────────────────────────┐  │
│  │  Route Handlers                                                │  │
│  │  /api/workspaces  │  /api/execution  │  /api/ai              │  │
│  └────────────────────────┬──────────────────────────────────────┘  │
│                           │                                        │
│  ┌────────────────────────▼──────────────────────────────────────┐  │
│  │  Services                                                      │  │
│  │  openrouter.service.js  │  judge0.service.js                  │  │
│  └────────────────────────┬──────────────────────────────────────┘  │
│                           │                                        │
│  ┌────────────────────────▼──────────────────────────────────────┐  │
│  │  Socket.IO Rooms                                             │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────────┐   │  │
│  │  │  yjs.socket.js  │  │  chat.socket.js                  │   │  │
│  │  │  • document-loaded│ │  • chat:join (identity stored)   │   │  │
│  │  │  • document-update│ │  • chat:message (rate-limited)   │   │  │
│  │  │  • document-destroy││  • chat:history (last 50)        │   │  │
│  │  │  • 2s debounce   │  │  • 10 msgs / 5s window          │   │  │
│  │  │  • immediate save│  │  • identity from socket.data     │   │  │
│  │  └────────┬─────────┘  └──────────────────────────────────┘   │  │
│  └───────────┼────────────────────────────────────────────────────┘  │
│              │                                                      │
│  ┌───────────▼────────────────────────────────────────────────────┐  │
│  │  MongoDB (Mongoose)                                           │  │
│  │  Workspace: { roomId, ownerId, name, language, code, ydocState }│  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Real-Time Editing

```
 User A                    Server                    User B
   │                         │                         │
   │  types "hello"          │                         │
   │       │                 │                         │
   │       ▼                 │                         │
   │  Monaco emits           │                         │
   │  y-monaco binding       │                         │
   │       │                 │                         │
   │       ▼                 │                         │
   │  Yjs Doc (local)        │                         │
   │  (operation generated)  │                         │
   │       │                 │                         │
   │       ▼                 │                         │
   │  y-socket.io emit       │                         │
   │  "update" to room       │                         │
   │       │                 │                         │
   │       ├─────────────────►│                         │
   │       │                 │  broadcast to room      │
   │       │                 │  (all participants)     │
   │       │                 │                         │
   │       │                 │  ┌────────────────────┐ │
   │       │                 │  │ debounce timer      │ │
   │       │                 │  │ (2 s idle)          │ │
   │       │                 │  │ → encodeStateAsUpdate│ │
   │       │                 │  │ → MongoDB save      │ │
   │       │                 │  └────────────────────┘ │
   │       │                 │                         │
   │       │◄─────────────────┤                         │
   │       │                 │  "update" broadcast     │
   │       ▼                 │                         │
   │  y-monaco applies       │                         │
   │  operation to Monaco    │                         │
   │       │                 │                         │
   │       ▼                 │                         │
   │  User A sees "hello"    │                         │
   │                         │                         │
   │       ───────────────────────────────────────────►│
   │                         │                         │
   │       ◄─────────────────┤                         │
   │       │                 │  "update" broadcast     │
   │       ▼                 │                         │
   │  y-monaco applies       │                         │
   │  operation to Monaco    │                         │
   │       │                 │                         │
   │       ▼                 │                         │
   │  User B sees "hello"    │                         │
```

### Data Flow: AI Code Review

```
 User selects code in Monaco
       │
       ▼
 ┌─────────────┐
 │ AIReviewPanel│
 │ (user picks  │
 │  action)     │
 └──────┬──────┘
        │ POST /api/ai
        ▼
 ┌─────────────┐     ┌──────────────────┐
 │ ai.controller│────►│ openrouter.service│
 │ (validates   │     │ (OpenRouter API)  │
 │  action,     │     │  → LLM request    │
 │  fields)     │     │  → returns markdown│
 └──────┬──────┘     └──────────────────┘
        │
        ▼
 ┌─────────────┐
 │  Response    │
 │  (read-only  │
 │  markdown,   │
 │  never auto- │
 │  inserted)   │
 └─────────────┘
```

### Data Flow: Workspace Persistence

```
  ┌─────────────────────────────────────────────────────────┐
  │                    MongoDB Workspace Schema              │
  ├─────────────────────────────────────────────────────────┤
  │  roomId      (String, unique)  — room identifier        │
  │  ownerId     (String)          — Clerk user.id          │
  │  name        (String)          — workspace display name  │
  │  language    (String)          — Monaco language ID      │
  │  code        (String)          — current editor content  │
  │  ydocState   (Buffer)          — full CRDT binary state  │
  │  createdAt   (Date)            — auto-generated          │
  │  updatedAt   (Date)            — auto-generated          │
  └─────────────────────────────────────────────────────────┘

  Save Triggers:
  ┌──────────────────────┐     ┌────────────────────────────┐
  │  2 s debounce        │     │  document-destroy event    │
  │  (on every keystroke)│     │  (last user leaves room)   │
  │                      │     │                            │
  │  Clears previous timer│    │  Clears pending timer      │
  │  Starts new 2 s timer│     │  encodeStateAsUpdate(doc)  │
  │  → encodeStateAsUpdate│    │  → findOneAndUpdate        │
  │  → MongoDB save      │     │  → MongoDB save            │
  └──────────────────────┘     └────────────────────────────┘
```

### Request Flow (API)

```
 Client (React)
   │
   ├─ GET  /api/workspaces/:ownerId  ──► workspace.controller.getWorkspacesByOwner
   │                                      └─► Workspace.find({ ownerId })
   │
   ├─ GET  /api/workspaces/by-room/:roomId  ──► workspace.controller.getWorkspaceByRoom
   │                                           └─► Workspace.findOne({ roomId })
   │
   ├─ POST /api/workspaces  ──► workspace.controller.createWorkspace
   │                           └─► Workspace.create({ roomId, ownerId, name, language })
   │
   ├─ PATCH /api/workspaces/:roomId  ──► workspace.controller.updateWorkspace
   │                                    └─► Workspace.findOneAndUpdate({ roomId }, updates)
   │
   ├─ DELETE /api/workspaces/:roomId  ──► workspace.controller.deleteWorkspace
   │                                     └─► Workspace.findOneAndDelete({ roomId })
   │
   ├─ POST /api/execution/run  ──► execution.controller.runCode
   │                              └─► judge0.service.runCodeWithJudge0()
   │                                 └─► Judge0 CE API → { stdout, stderr, compileOutput }
   │
   └─ POST /api/ai  ──► ai.controller.handleAiRequest
                       └─► openrouter.service.queryAi(action, { code, language, prompt, stderr })
                          └─► OpenRouter API → markdown response

 WebSocket (Socket.IO)
   ├─ yjs.socket.js
   │   ├─ "document-loaded"   → restore Yjs state from MongoDB
   │   ├─ "document-update"   → debounced save to MongoDB
   │   └─ "document-destroy"  → immediate save to MongoDB
   │
   └─ chat.socket.js
       ├─ "chat:join"     → store identity on socket.data, send history
       ├─ "chat:message"  → rate-limit check, broadcast to room
       └─ (no explicit leave cleanup — Socket.IO handles it)
```

---

## How It Works

### Room Lifecycle

```
  User creates/joins a room
         │
         ▼
  ┌──────────────┐     ┌──────────────────────────────────────┐
  │ Socket.IO     │────►│ Server creates/joins Yjs room         │
  │ joins roomId  │     │ "document-loaded" event fires         │
  └──────────────┘     └──────────────┬─────────────────────────┘
                                      │
                              ┌───────▼───────────────┐
                              │ MongoDB lookup          │
                              │ Workspace.findOne()     │
                              │ { roomId }              │
                              └───────┬───────────────┘
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                    ┌──────────┐ ┌──────────┐ ┌────────────────┐
                    │ ydocState│ │  ydocState│ │ No ydocState   │
                    │ exists?  │ │ exists?   │ │ (legacy)        │
                    └────┬─────┘ └────┬─────┘ └────────┬───────┘
                         │            │                 │
                    ┌────▼─────┐ ┌───▼──────┐   ┌────▼────────┐
                    │ Y.applyUpdate│ Y.applyUpdate│ Inject code  │
                    │ (full CRDT) │ (full CRDT) │ into "monaco" │
                    │ restore     │ restore     │ text only     │
                    └────┬─────┘ └───┬──────┘   └────┬────────┘
                         │            │                 │
                         └────────────┼─────────────────┘
                                      │
                                      ▼
                              ┌──────────────────┐
                              │ Room is live       │
                              │ • CRDT sync active │
                              │ • Chat enabled     │
                              │ • Auto-save running │
                              └──────────────────┘
```

### AI Code Review Flow

```
  User selects text in Monaco
         │
         ▼
  ┌─────────────────┐
  │ AIReviewPanel   │
  │ ┌─────────────┐ │
  │ │ Explain  ▾  │ │
  │ │ Refactor ▾  │ │
  │ │ Generate ▾  │ │
  │ │ Debug    ▾  │ │
  │ └─────────────┘ │
  └────────┬────────┘
           │ User clicks an action
           ▼
  ┌─────────────────┐
  │ Build request    │
  │ { action, code,  │
  │  language,       │
  │  prompt?, stderr?}│
  └────────┬────────┘
           │ POST /api/ai
           ▼
  ┌─────────────────┐     ┌──────────────────────┐
  │ ai.controller    │────►│ Validates action      │
  │                  │     │ Validates required    │
  │                  │     │   fields per action   │
  └────────┬─────────┘     └──────────┬───────────┘
           │                          │
           ▼                          ▼
  ┌─────────────────┐     ┌──────────────────────┐
  │ 200 OK           │     │ 400 Bad Request       │
  │ { result: "<md>" }│     │ { error message }     │
  └─────────────────┘     └──────────────────────┘
           │
           ▼
  ┌─────────────────┐
  │ Rendered as      │
  │ read-only markdown│
  │ (never inserted   │
  │  into shared doc) │
  └─────────────────┘
```

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS 4 | UI framework, build tool, styling |
| **Editor** | Monaco Editor (`@monaco-editor/react`) | Code editing with syntax highlighting |
| **CRDT** | Yjs + y-socket.io + y-monaco | Conflict-free real-time sync |
| **Whiteboard** | tldraw 5 | Collaborative drawing canvas |
| **Backend** | Node.js, Express 5 | HTTP server, REST API |
| **WebSockets** | Socket.IO | Real-time bidirectional communication |
| **Database** | MongoDB + Mongoose | Workspace persistence |
| **Auth** | Clerk (`@clerk/clerk-react` + `@clerk/backend`) | Authentication & session validation |
| **AI** | OpenRouter | LLM-powered code review |
| **Execution** | Judge0 CE Cloud API | Multi-language code runner |
| **Security** | Helmet, express-rate-limit | HTTP headers, API rate limiting |
| **Icons** | Lucide React | Icon library |

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Clerk account
- OpenRouter API key

### 1. Install

```bash
git clone <repo-url> && cd pairverse
cd server && npm install
cd ../client && npm install
```

### 2. Environment

**`server/.env`**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/pairverse
OPENROUTER_API_KEY=sk-or-v1-...
CLERK_SECRET_KEY=sk_test_...
PORT=3000
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**`client/.env.local`**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3000
```

### 3. Run (Dev)

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Client: `http://localhost:5173` · API: `http://localhost:3000`

### 4. Run (Production)

```bash
cd client && npm run build
cp -r dist ../server/public
cd ../server && npm start
```

### Docker

```bash
docker build -t pairverse -f Dockerfile .
docker run -p 3000:3000 --env-file server/.env pairverse
```

---

## API Reference

### Workspaces

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workspaces/:ownerId` | List workspaces for user |
| `GET` | `/api/workspaces/by-room/:roomId` | Get workspace by room ID |
| `POST` | `/api/workspaces` | Create workspace |
| `PATCH` | `/api/workspaces/:roomId` | Update name/language/code |
| `DELETE` | `/api/workspaces/:roomId` | Delete workspace |

### Execution

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/execution/run` | Execute code (`sourceCode`, `languageId`, `stdin`) |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai` | AI action (`action`: explain\|refactor\|generate\|debug, `code`, `language`, `prompt`, `stderr`) |

---

## Project Structure

```
├── client/
│   ├── src/app/
│   │   ├── App.jsx, Landing.jsx, Dashboard.jsx, Room.jsx
│   │   ├── SignInPage.jsx, SignUpPage.jsx, NotFound.jsx
│   │   ├── config.js
│   │   └── components/
│   │       ├── AIReviewPanel.jsx, ChatPanelNew.jsx, WhiteboardPanel.jsx
│   │       ├── Terminal.jsx, CommandPalette.jsx, ConnectionBanner.jsx
│   │       ├── ErrorBoundary.jsx, SidebarRail.jsx, Modal.jsx
│   │       └── ui/Modal.jsx
│   │   ├── hooks/useAi.js
│   │   └── styles/ (index.css, tailwind.css, theme.css, fonts.css)
│   ├── index.html, vite.config.js, package.json
├── server/
│   ├── src/
│   │   ├── server.js, config/db.js
│   │   ├── models/Workspace.model.js
│   │   ├── routes/ (workspace.routes.js, execution.routes.js, ai.routes.js)
│   │   ├── controllers/ (workspace.controller.js, execution.controller.js, ai.controller.js)
│   │   ├── middleware/auth.js
│   │   ├── services/ (openrouter.service.js, judge0.service.js)
│   │   └── sockets/ (yjs.socket.js, chat.socket.js)
│   ├── public/, package.json, .env, .env.example
├── Dockerfile, .dockerignore, .gitignore, README.md
```

---

## License

MIT

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| CRDT | Yjs + y-socket.io + y-monaco |
| Whiteboard | tldraw 5 |
| Backend | Node.js, Express 5 |
| WebSockets | Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | Clerk (`@clerk/clerk-react` + `@clerk/backend`) |
| AI | OpenRouter |
| Execution | Judge0 CE Cloud API |
| Security | Helmet, express-rate-limit |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Clerk account
- OpenRouter API key

### 1. Install

```bash
git clone <repo-url> && cd pairverse
cd server && npm install
cd ../client && npm install
```

### 2. Environment

**`server/.env`**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/pairverse
OPENROUTER_API_KEY=sk-or-v1-...
CLERK_SECRET_KEY=sk_test_...
PORT=3000
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

**`client/.env.local`**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3000
```

### 3. Run (Dev)

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Client: `http://localhost:5173` · API: `http://localhost:3000`

### 4. Run (Production)

```bash
cd client && npm run build
cp -r dist ../server/public
cd ../server && npm start
```

### Docker

```bash
docker build -t pairverse -f Dockerfile .
docker run -p 3000:3000 --env-file server/.env pairverse
```

---

## API Reference

### Workspaces

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workspaces/:ownerId` | List workspaces for user |
| `GET` | `/api/workspaces/by-room/:roomId` | Get workspace by room ID |
| `POST` | `/api/workspaces` | Create workspace |
| `PATCH` | `/api/workspaces/:roomId` | Update name/language/code |
| `DELETE` | `/api/workspaces/:roomId` | Delete workspace |

### Execution

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/execution/run` | Execute code (`sourceCode`, `languageId`, `stdin`) |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai` | AI action (`action`: explain\|refactor\|generate\|debug, `code`, `language`, `prompt`, `stderr`) |

---

## Project Structure

```
├── client/
│   ├── src/app/
│   │   ├── App.jsx, Landing.jsx, Dashboard.jsx, Room.jsx
│   │   ├── SignInPage.jsx, SignUpPage.jsx, NotFound.jsx
│   │   ├── config.js
│   │   └── components/
│   │       ├── AIReviewPanel.jsx, ChatPanelNew.jsx, WhiteboardPanel.jsx
│   │       ├── Terminal.jsx, CommandPalette.jsx, ConnectionBanner.jsx
│   │       ├── ErrorBoundary.jsx, SidebarRail.jsx, Modal.jsx
│   │       └── ui/Modal.jsx
│   │   ├── hooks/useAi.js
│   │   └── styles/ (index.css, tailwind.css, theme.css, fonts.css)
│   ├── index.html, vite.config.js, package.json
├── server/
│   ├── src/
│   │   ├── server.js, config/db.js
│   │   ├── models/Workspace.model.js
│   │   ├── routes/ (workspace.routes.js, execution.routes.js, ai.routes.js)
│   │   ├── controllers/ (workspace.controller.js, execution.controller.js, ai.controller.js)
│   │   ├── middleware/auth.js
│   │   ├── services/ (openrouter.service.js, judge0.service.js)
│   │   └── sockets/ (yjs.socket.js, chat.socket.js)
│   ├── public/, package.json, .env, .env.example
├── Dockerfile, .dockerignore, .gitignore, README.md
```

---

## License

MIT
