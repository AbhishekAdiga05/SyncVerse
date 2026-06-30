# Pairverse

> Collaborative code editor with real-time sync, AI code review, and collaborative whiteboarding.

Pairverse is a full-stack collaborative editing platform where multiple users edit the same Monaco editor simultaneously via CRDT-based conflict resolution. It integrates AI-assisted code review, a shared tldraw whiteboard, real-time chat, multi-language code execution, and persistent workspaces — all in a single-room workspace model.

---

## Features

### Real-Time Code Editor
Multiple users edit the same Monaco editor instance. All keystrokes are synced as Yjs CRDT operations — no locks, no conflicts, no central merge step. Each room gets its own isolated Yjs document namespace, so workspaces are automatically partitioned.

### AI Code Review (Explain · Refactor · Generate · Debug)
Select a code region in the editor and choose an AI action. The selected code (or full file) is sent to an OpenRouter LLM. Responses are rendered as read-only markdown — never auto-inserted into the shared document, preserving user intent and collaborative attribution.

### Collaborative Whiteboard (tldraw)
A full tldraw canvas backed by the same Yjs document. Toggle between the editor and the whiteboard — drawings sync in real time to all room participants. The toolbar is trimmed to essential diagramming tools (select, draw, text, shapes, connectors, eraser).

### Integrated Chat
Ephemeral, room-scoped chat via Socket.IO. Messages are held in memory (last 50 per room) — no database writes for chat traffic.

### Multi-Language Execution (Judge0) + Interactive Terminal
Run code server-side via the Judge0 CE API. Supports JavaScript, TypeScript, Python, C++, Java, Go, and Rust. Output (stdout, stderr, compile output) is displayed in an interactive terminal panel with editable input, command history (Up/Down arrows), and stdin support.

### Workspace Persistence
Document state (code + whiteboard content) is debounced (2 s) and saved to MongoDB. On reconnect, the full Yjs document is restored — including drawings and cursor positions. Workspace metadata (name, language) is persisted via REST.

### Authentication (Clerk)
Sign in with Google, GitHub, or email via Clerk. Routes are guarded with `<SignedIn>` / `<SignedOut>` wrappers. The auth widget never touches the backend — all session management is client-side.

---

## Architecture

```
client/                          server/
──────                           ──────
src/                             src/
├── app/                         ├── server.js           ← Express + Socket.IO entry
│   ├── App.jsx                  ├── config/db.js        ← MongoDB connection
│   ├── Landing.jsx              ├── models/
│   ├── Dashboard.jsx            │   └── Workspace.model.js
│   ├── Room.jsx                 ├── routes/
│   ├── components/              │   ├── workspace.routes.js
│   │   ├── AIReviewPanel.jsx    │   ├── execution.routes.js
│   │   ├── ChatPanelNew.jsx     │   └── ai.routes.js
│   │   ├── WhiteboardPanel.jsx  ├── controllers/
│   │   └── Terminal.jsx         │   ├── workspace.controller.js
│   └── hooks/                   │   ├── workspace.controller.js
│       └── useAi.js             │   ├── execution.controller.js
└── package.json                 │   └── ai.controller.js
                                 ├── services/
                                 │   ├── openrouter.service.js
                                 │   └── judge0.service.js
                                 └── sockets/
                                     ├── yjs.socket.js    ← Yjs doc persistence
                                     └── chat.socket.js   ← Ephemeral chat
```

### Synchronization Flow

```
User A types ──► Monaco ──► y-monaco binding ──► Yjs Doc
                                                    │
                          y-socket.io (Socket.IO transport)
                                                    │
User B sees ──► Monaco ──► y-monaco binding ──► Yjs Doc

Server: Yjs Doc is persisted to MongoDB via encodeStateAsUpdate
        (2 s debounce, immediate on last-user-leave)
```

### Key Technologies

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| CRDT Sync | Yjs + y-socket.io + y-monaco |
| Whiteboard | tldraw 5 |
| Backend | Node.js, Express 5 |
| WebSockets | Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | Clerk |
| AI Provider | OpenRouter |
| Code Execution | Judge0 CE Cloud API |
| Icons | Lucide React |
| Chat | Socket.IO (in-memory, ephemeral) |

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB instance (local or Atlas)
- Clerk account (for auth keys)
- OpenRouter API key (for AI features)

### 1. Clone and Install

```bash
git clone <repo-url>
cd pairverse

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables

**`server/.env`**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/pairverse
OPENROUTER_API_KEY=sk-or-v1-...
PORT=3000
```

**`client/.env.local`**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3000
```

### 3. Run (Development)

```bash
# Terminal 1 — server
cd server
npm run dev

# Terminal 2 — client
cd client
npm run dev
```

The client dev server runs on `http://localhost:5173`, the API on `http://localhost:3000`.

### 4. Run (Production)

```bash
# Build client
cd client
npm run build

# Copy build output to server
cp -r dist ../server/public

# Start server
cd ../server
npm start
```

Or use Docker:

```bash
docker build -t pairverse -f dockerfile .
docker run -p 3000:3000 --env-file server/.env pairverse
```

---

## Project Structure

```
├── client/                     ← React + Vite frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.jsx         ← Routes, auth guards
│   │   │   ├── Landing.jsx     ← Marketing page
│   │   │   ├── Dashboard.jsx   ← Room list, create/join
│   │   │   ├── Room.jsx        ← Editor, whiteboard, toolbar
│   │   │   ├── components/     ← AIReviewPanel, ChatPanelNew, WhiteboardPanel, Terminal, Toast
│   │   │   ├── hooks/useAi.js  ← AI fetch logic
│   │   │   ├── config.js       ← API_URL from env
│   │   │   └── SignInPage.jsx / SignUpPage.jsx / NotFound.jsx
│   │   └── main.jsx            ← Entry point (ClerkProvider)
│   └── package.json
├── server/                     ← Express + Socket.IO backend
│   ├── src/
│   │   ├── server.js           ← Entry point, middleware, routes
│   │   ├── config/db.js        ← Mongoose connection
│   │   ├── models/             ← Mongoose schemas
│   │   ├── routes/             ← REST endpoints
│   │   ├── controllers/        ← Request handlers
│   │   ├── services/           ← Judge0 + OpenRouter clients
│   │   └── sockets/            ← Yjs persistence + chat
│   └── package.json
├── dockerfile                  ← Multi-stage Docker build
└── .gitignore
```

---

## API Reference

### Workspaces
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workspaces/:ownerId` | List workspaces for user |
| `GET` | `/api/workspaces/by-room/:roomId` | Get single workspace |
| `POST` | `/api/workspaces` | Create workspace |
| `PATCH` | `/api/workspaces/:roomId` | Update name/language |
| `DELETE` | `/api/workspaces/:roomId` | Delete workspace |

### Code Execution
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/execution/run` | Execute code (Judge0) |

### AI
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai` | Explain, refactor, generate, or debug |

---



## License

MIT
