<div align="center">

# ✨ SyncVerse

**A real-time collaborative code editor with CRDT sync, AI-powered review, and a shared whiteboard — all in one room.**

<br/>

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/Node.js-20-33993F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Yjs-CRDT-FF6B35?style=for-the-badge" alt="Yjs" />
<img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
<img src="https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />

<br/><br/>

**[Features](#-features)** · **[Architecture](#-architecture)** · **[Tech Stack](#-tech-stack)** · **[Getting Started](#-getting-started)** · **[API Reference](#-api-reference)** · **[Project Structure](#-project-structure)**

</div>

<br/>

---

## 🚀 Features

<table>
<tr>
<td width="50%" valign="top">

### 🖊️ Real-Time Editor
Monaco editor synced via **Yjs CRDT** — no locks, no conflicts, no central merge. Each room gets its own isolated document namespace.

### 🤖 AI Code Review
Select code → pick **Explain / Refactor / Generate / Debug** → an OpenRouter-backed LLM returns read-only markdown that's never auto-inserted into your code.

### 🎨 Collaborative Whiteboard
A full **tldraw** canvas backed by the same Yjs doc. Flip between editor and board — drawings sync in real time.

</td>
<td width="50%" valign="top">

### 💬 Integrated Chat
Ephemeral, room-scoped chat over Socket.IO. Last 50 messages in memory, rate-limited to 10 msgs / 5s.

### ⚙️ Multi-Language Execution
Run **JS · TS · Python · C++ · Java · Go · Rust** via Judge0 CE, with an interactive terminal for stdin and history.

### 💾 Workspace Persistence
2s debounced auto-save to MongoDB. Full CRDT state restored on reconnect — code, drawings, and cursors, all intact.

</td>
</tr>
</table>

> 🔐 **Auth** is handled by **Clerk** — Google, GitHub, and email sign-in, with server-side token validation via `@clerk/backend`.

---

## 🏗️ Architecture

### System Overview

```
┌───────────────────────── CLIENT · React + Vite ─────────────────────────┐
│   Monaco Editor   ·   tldraw Whiteboard   ·   Chat   ·   Terminal      │
│                              │                                         │
│                              ▼                                         │
│                    Yjs Document  (CRDT state)                          │
│                              │                                         │
│                     y-socket.io (WebSocket)                            │
└──────────────────────────────┬──────────────────────────────────────────┘
                                │  Socket.IO  +  REST
                                ▼
┌───────────────────────── SERVER · Express + Socket.IO ───────────────────┐
│  Helmet (CSP) · CORS · Rate Limiter · Clerk Auth                         │
│                              │                                         │
│  Routes:  /api/workspaces   /api/execution   /api/ai                    │
│                              │                                         │
│  Services:  openrouter.service.js   ·   judge0.service.js               │
│                              │                                         │
│  Socket Rooms:  yjs.socket.js (CRDT sync)  ·  chat.socket.js (chat)      │
│                              │                                         │
│                              ▼                                         │
│                MongoDB (Mongoose) — Workspace collection                 │
└──────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>🔄 How real-time sync works</b></summary>
<br/>

```
 User A types            Server              User B
     │                     │                    │
     ▼                     │                    │
 Yjs op generated          │                    │
     │── "update" ─────────►│                    │
     │                     │── broadcast ───────►│
     │                     │                    ▼
     │                     │           y-monaco applies op
     │                     │                    │
     │        (2s idle → debounced save)        ▼
     │                     │            User B sees the change
```

Every keystroke becomes a CRDT operation, broadcast instantly to the room and debounced to MongoDB every 2 seconds — edits never conflict, and nothing gets lost.

</details>

<details>
<summary><b>🤖 AI code review flow</b></summary>
<br/>

```
 Select code in Monaco → pick an action (Explain / Refactor / Generate / Debug)
        │
        ▼
 POST /api/ai → ai.controller validates → openrouter.service queries the LLM
        │
        ▼
 Read-only markdown rendered in the AI panel — your code is never touched automatically
```

</details>

---

## 🧰 Tech Stack

| Layer | Technology | Role |
|:---|:---|:---|
| **Frontend** | React 19 · Vite · Tailwind CSS 4 | UI framework, build tool, styling |
| **Editor** | Monaco Editor (`@monaco-editor/react`) | Code editing & syntax highlighting |
| **CRDT** | Yjs · y-socket.io · y-monaco | Conflict-free real-time sync |
| **Whiteboard** | tldraw 5 | Collaborative drawing canvas |
| **Backend** | Node.js · Express 5 | HTTP server & REST API |
| **WebSockets** | Socket.IO | Real-time bidirectional communication |
| **Database** | MongoDB · Mongoose | Workspace persistence |
| **Auth** | Clerk (`@clerk/clerk-react` + `@clerk/backend`) | Authentication & session validation |
| **AI** | OpenRouter | LLM-powered code review |
| **Execution** | Judge0 CE Cloud API | Multi-language code runner |
| **Security** | Helmet · express-rate-limit | HTTP headers & API rate limiting |
| **Icons** | Lucide React | Icon library |

---

## ⚡ Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Clerk account
- OpenRouter API key

### 1 · Install

```bash
git clone <repo-url> && cd syncverse
cd server && npm install
cd ../client && npm install
```

### 2 · Configure environment

**`server/.env`**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/syncverse
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

### 3 · Run in development

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

> Client → `http://localhost:5173`  ·  API → `http://localhost:3000`

### 4 · Run in production

```bash
cd client && npm run build
cp -r dist ../server/public
cd ../server && npm start
```

### 🐳 Docker

```bash
docker build -t syncverse -f Dockerfile .
docker run -p 3000:3000 --env-file server/.env syncverse
```

---

## 📡 API Reference

<details open>
<summary><b>Workspaces</b></summary>
<br/>

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/workspaces/:ownerId` | List workspaces for a user |
| `GET` | `/api/workspaces/by-room/:roomId` | Get a workspace by room ID |
| `POST` | `/api/workspaces` | Create a new workspace |
| `PATCH` | `/api/workspaces/:roomId` | Update name, language, or code |
| `DELETE` | `/api/workspaces/:roomId` | Delete a workspace |

</details>

<details>
<summary><b>Execution</b></summary>
<br/>

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/execution/run` | Execute code — body: `sourceCode`, `languageId`, `stdin` |

</details>

<details>
<summary><b>AI</b></summary>
<br/>

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/ai` | Run an AI action — body: `action` (`explain`\|`refactor`\|`generate`\|`debug`), `code`, `language`, `prompt`, `stderr` |

</details>

<details>
<summary><b>WebSocket Events</b></summary>
<br/>

| Namespace | Event | Description |
|:---|:---|:---|
| `yjs.socket.js` | `document-loaded` | Restores Yjs state from MongoDB when a room is joined |
| `yjs.socket.js` | `document-update` | Debounced (2s) save to MongoDB on every edit |
| `yjs.socket.js` | `document-destroy` | Immediate save when the last user leaves the room |
| `chat.socket.js` | `chat:join` | Stores identity on the socket, sends chat history |
| `chat.socket.js` | `chat:message` | Rate-limited (10/5s) broadcast to the room |

</details>

---

## 📁 Project Structure

```
syncverse/
├── client/
│   └── src/app/
│       ├── App.jsx, Landing.jsx, Dashboard.jsx, Room.jsx
│       ├── SignInPage.jsx, SignUpPage.jsx, NotFound.jsx
│       ├── config.js
│       ├── components/
│       │   ├── AIReviewPanel.jsx, ChatPanelNew.jsx, WhiteboardPanel.jsx
│       │   ├── Terminal.jsx, CommandPalette.jsx, ConnectionBanner.jsx
│       │   ├── ErrorBoundary.jsx, SidebarRail.jsx, Modal.jsx
│       │   └── ui/Modal.jsx
│       ├── hooks/useAi.js
│       └── styles/ (index.css, tailwind.css, theme.css, fonts.css)
│
├── server/
│   └── src/
│       ├── server.js, config/db.js
│       ├── models/Workspace.model.js
│       ├── routes/ (workspace.routes.js, execution.routes.js, ai.routes.js)
│       ├── controllers/ (workspace.controller.js, execution.controller.js, ai.controller.js)
│       ├── middleware/auth.js
│       ├── services/ (openrouter.service.js, judge0.service.js)
│       └── sockets/ (yjs.socket.js, chat.socket.js)
│
└── Dockerfile, .dockerignore, .gitignore
```

---

<div align="center">

### 📄 License

Released under the **MIT License**.

</div>
