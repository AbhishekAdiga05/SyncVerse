# CollabX (Pairverse) — Complete Project Revision

> **Purpose:** This document is a comprehensive reconstruction guide and interview preparation artifact. It covers every feature, every architectural decision, every technical challenge, and the exact user flow for each capability in the CollabX collaborative coding platform.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Feature 1 — Authentication & Onboarding](#2-feature-1--authentication--onboarding)
3. [Feature 2 — Dashboard & Workspace Management](#3-feature-2--dashboard--workspace-management)
4. [Feature 3 — Real-Time Collaborative Editor](#4-feature-3--real-time-collaborative-editor)
5. [Feature 4 — Collaborative Whiteboard](#5-feature-4--collaborative-whiteboard)
6. [Feature 5 — Real-Time Chat](#6-feature-5--real-time-chat)
7. [Feature 6 — AI Code Review (Intent Mode)](#7-feature-6--ai-code-review-intent-mode)
8. [Feature 7 — Code Execution Workspace](#8-feature-7--code-execution-workspace)
9. [Feature 8 — Interactive Terminal](#9-feature-8--interactive-terminal)
10. [Architecture & Data Flow](#10-architecture--data-flow)
11. [Interview Questions & Answers](#11-interview-questions--answers)

---

## 1. Project Overview

**CollabX (Pairverse)** is a full-stack, browser-based collaborative development environment. It enables multiple developers to write code, draw diagrams, chat, run code, and get AI-powered code reviews — all in real-time.

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, Lucide React |
| Editor | Monaco Editor (VS Code core) |
| Real-time Sync | Yjs (CRDT) + y-socket.io + y-monaco |
| Whiteboard | tldraw v5 |
| Backend | Node.js, Express 5 |
| WebSockets | Socket.IO (chat + Yjs transport) |
| Database | MongoDB + Mongoose |
| Auth | Clerk |
| AI | OpenRouter (moonshotai/kimi-k2.7-code) |
| Code Execution | Judge0 CE Cloud |
| Styling | CSS + Tailwind (no UI framework) |

### Repository Structure

```
CollabX/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── app/               # Pages & components
│   │   │   ├── App.jsx        # Root router + Clerk guards
│   │   │   ├── Room.jsx       # Core editing room (orchestrates everything)
│   │   │   ├── Dashboard.jsx  # Workspace CRUD
│   │   │   ├── Landing.jsx    # Marketing page
│   │   │   ├── config.js      # API URL constant
│   │   │   └── components/
│   │   │       ├── ChatPanelNew.jsx
│   │   │       ├── WhiteboardPanel.jsx
│   │   │       ├── AIReviewPanel.jsx
│   │   │       ├── Terminal.jsx
│   │   │       └── Toast.jsx
│   │   ├── hooks/
│   │   │   └── useAi.js
│   │   └── styles/
│   │       ├── index.css
│   │       ├── App.css
│   │       ├── theme.css
│   │       ├── tailwind.css
│   │       └── fonts.css
│   ├── index.html
│   └── vite.config.js
├── server/                    # Express backend
│   └── src/
│       ├── server.js          # Entry point
│       ├── config/db.js       # MongoDB connection
│       ├── models/
│       │   └── Workspace.model.js
│       ├── controllers/
│       │   ├── workspace.controller.js
│       │   ├── execution.controller.js
│       │   └── ai.controller.js
│       ├── services/
│       │   ├── openrouter.service.js
│       │   └── judge0.service.js
│       ├── sockets/
│       │   ├── yjs.socket.js
│       │   └── chat.socket.js
│       └── routes/
│           ├── workspace.routes.js
│           ├── execution.routes.js
│           └── ai.routes.js
├── README.md
└── codeweave_learning_guide.md.resolved
```

---

## 2. Feature 1 — Authentication & Onboarding

### Technical Implementation

- **Library:** `@clerk/clerk-react` (Clerk)
- **Components:** `<ClerkProvider>`, `<SignedIn>`, `<SignedOut>`, `<SignIn>`, `<SignUp>`, `<UserButton>`
- **Pages:** `SignInPage.jsx`, `SignUpPage.jsx`, `Landing.jsx`

### User Flow

1. User lands at `/` → `Landing.jsx` renders with animated hero, feature cards, scroll-reveal effects, and call-to-action buttons
2. Clicking "Get Started" navigates to `/sign-in`
3. Clerk `<SignIn>` component handles OAuth (Google/GitHub) or email/password
4. After sign-in, Clerk redirects to `/dashboard` (configured in `main.jsx` via `afterSignInUrl`)
5. `<UserButton>` in Dashboard header shows user avatar with dropdown (manage account, sign out)
6. Clerk JWT session tokens are automatically managed; no server-side auth middleware needed

### Key Code

```jsx
// main.jsx — Clerk provider wrapping the app
<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
  signInUrl="/sign-in" signUpUrl="/sign-up"
  afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
  <App />
</ClerkProvider>

// App.jsx — Route guards
<Route path="/dashboard" element={
  <SignedIn><Dashboard /></SignedIn>
} />
<Route path="/room/:roomId" element={
  <SignedIn><Room /></SignedIn>
} />
```

### Interview Talking Points

- **Why Clerk instead of custom auth?** Speeds up development by 2-3 weeks; provides social OAuth, session management, user profiles out of the box; no password storage liability
- **Trade-off:** Vendor lock-in; Clerk downtime blocks all sign-ins; cannot customize login flows deeply
- **Route guards:** Use Clerk's `<SignedIn>` / `<SignedOut>` instead of manual redirects — declarative, re-renders instantly on auth state change

---

## 3. Feature 2 — Dashboard & Workspace Management

### Technical Implementation

- **Page:** `Dashboard.jsx`
- **API Routes:** `GET /api/workspaces/:ownerId`, `POST /api/workspaces`, `DELETE /api/workspaces/:roomId`, `PATCH /api/workspaces/:roomId`, `GET /api/workspaces/by-room/:roomId`
- **Modal Components:** `CreateRoomModal` (inline), `JoinRoomModal` (inline) — CSS-only, no modal library

### User Flow

1. Dashboard loads → fetches `GET /api/workspaces/{user.id}` → renders cards in grid
2. Each card shows: workspace name, language badge, last updated timestamp
3. **Create:** Click "New Workspace" → modal with name + language dropdown → POST → card appears
4. **Join:** Click "Join Workspace" → modal with room ID input → navigates to `/room/{roomId}`
5. **Delete:** Click trash icon → DELETE request → confirm toast → card removed
6. **Copy Link:** Click link icon → copies `/room/{roomId}` URL to clipboard
7. **Search:** Text input filters visible cards by name (client-side filter)
8. **Click card:** Navigates to `/room/{roomId}`

### Key Code

```jsx
// POST /api/workspaces — Create
const handleCreate = async () => {
  try {
    setCreating(true);
    await axios.post(`${API_URL}/api/workspaces`, {
      roomId, ownerId: user.id, name, language
    });
    toast.success("Workspace created!");
    // refresh list
  } catch (err) {
    toast.error(err.response?.data?.error || "Failed to create workspace");
  } finally {
    setCreating(false);  // Fixed: was stuck true on error
  }
};
```

### Database Schema

```js
// Workspace.model.js
{
  roomId: { type: String, required: true, unique: true },
  ownerId: { type: String },          // Clerk user ID
  name: { type: String, default: "Untitled Workspace" },
  language: { type: String, default: "javascript" },
  code: { type: String },              // Legacy plain text fallback
  ydocState: { type: Buffer },         // Full Yjs binary document state
  createdAt: Date,                      // via timestamps: true
  updatedAt: Date                       // via timestamps: true
}
```

### Interview Talking Points

- **Why `roomId` as string, not ObjectId?** Room ID is a UUID generated client-side (`uuidV4()`), used as the Yjs document namespace. Using a separate unique string avoids coupling the Yjs namespace to MongoDB's ObjectId.
- **Why inline modals instead of a library?** The app has only two simple modals; importing a modal library would add unnecessary bundle weight. CSS positioning with fixed overlays is sufficient.
- **Search implementation:** Simple client-side `.filter()` on name — no debouncing, no backend search. Works fine for < 50 workspaces. Would need ElasticSearch or MongoDB text indexes at scale.

---

## 4. Feature 3 — Real-Time Collaborative Editor

### Technical Implementation

- **File:** `Room.jsx`
- **Editor:** Monaco Editor via `@monaco-editor/react`
- **CRDT:** Yjs (`Y.Doc`, `Y.Text`)
- **Transport:** `y-socket.io` (`SocketIOProvider`)
- **Binding:** `y-monaco` (`MonacoBinding`)
- **Server:** `yjs.socket.js` (Yjs lifecycle via `y-socket.io/dist/server`)

### Yjs Data Flow

```
User types in Monaco
        ↓
MonacoBinding intercepts change
        ↓
Updates Y.Text inside Y.Doc
        ↓
SocketIOProvider propagates via y-socket.io
        ↓
Server receives and broadcasts to all other clients
        ↓
Other clients' SocketIOProvider receives update
        ↓
Their MonacoBinding applies change to their Monaco editor
```

### Key Code

```jsx
// Room.jsx — Yjs setup in handleMount
const ydoc = new Y.Doc();
const yText = ydoc.getText("monaco");

const provider = new SocketIOProvider(
  serverUrl, roomId, ydoc,
  { autoConnect: true }
);

const binding = new MonacoBinding(
  yText, editor.getModel(),
  new Set([editor]), provider.awareness
);

// Yjs socket events (yjs.socket.js)
// document-loaded: load from MongoDB, Y.applyUpdate(doc, ...)
// document-update: debounced save (2s), Y.encodeStateAsUpdate(doc)
// document-destroy: save on last user leave
```

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` | Save workspace to server |
| `Ctrl+Enter` | Run code via Judge0 |
| `` Ctrl+` `` | Toggle terminal |
| `?` | Toggle shortcuts help |
| `Escape` | Close active panel |

**Bug fixed:** Keyboard shortcuts used closure values from first render. Fixed by storing `handleSave` and `handleRunCode` in refs using `useRef` and `useCallbackWithRef` pattern.

### Language Support

- Monaco Editor language is set from workspace metadata
- Supported: JavaScript, Python, Java, C++, TypeScript, Go, Rust, HTML, CSS
- Language determines: syntax highlighting, code execution language ID (Judge0), AI analysis context

### Persistence Architecture

```
                    ┌──────────────────┐
                    │   Y.Doc (in-mem) │
                    │   ┌─────────┐   │
                    │   │ Y.Text  │   │
                    │   └─────────┘   │
                    │   ┌─────────┐   │
                    │   │ Y.Map   │   │ ← tldraw whiteboard
                    │   └─────────┘   │
                    └───────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         Y.encode       Y.encode      Y.encode
       StateAsUpdate  StateAsUpdate  StateAsUpdate
              │             │             │
              ▼             ▼             ▼
        MongoDB (doc)   MongoDB (doc)   MongoDB (doc)
        ydocState       ydocState       ydocState
        (Buffer)        (Buffer)        (Buffer)
```

**Why full-state binary persistence?** Originally only saved `yText.toString()` as the `code` field. This lost whiteboard data (stored in `ydoc.getMap("tldraw_v2")`), awareness metadata, and any future Yjs content. Saving `Y.encodeStateAsUpdate(doc)` as a MongoDB `Buffer` captures the entire Yjs document state. On load, `Y.applyUpdate(doc, ...)` restores everything.

**Backward compatibility:** If `ydocState` is null (pre-persistence workspaces), the server falls back to setting `yText.insert(0, workspace.code)`.

### Interview Talking Points

- **Why CRDT (Yjs) over OT (Operational Transform)?** CRDTs provide automatic conflict resolution without a central server. OT requires a server to order operations. Yjs uses a state vector-based protocol that handles network partitions gracefully.
- **Why y-socket.io instead of y-websocket?** y-websocket uses raw WebSocket, which complicates authentication, room management, and reconnection. Socket.IO provides rooms, namespaces, middleware, and reconnection out of the box. CollabX uses Socket.IO for both chat and Yjs transport.
- **Debounce strategy:** 2-second debounce prevents MongoDB write storms during rapid typing while ensuring persistence within a reasonable window. On document-destroy (last user leaves), save is immediate.
- **MonacoBinding vs custom sync:** y-monaco's MonacoBinding handles all edge cases: editor initialization, undo/redo stack merging, cursor awareness, and selection restoration. Reimplementing would be error-prone.
- **Stale closure bug:** The keyboard shortcut handler (`useEffect` with `addEventListener`) captured the initial closure of `handleSave`/`handleRunCode`. After React re-renders, these functions may change (e.g., `aiState` updates), but the event listener still calls the old version. Fix: store functions in refs, call `ref.current()` from the handler.

---

## 5. Feature 4 — Collaborative Whiteboard

### Technical Implementation

- **File:** `WhiteboardPanel.jsx`
- **Library:** `tldraw` v5
- **CRDT Sync:** `ydoc.getMap("tldraw_v2")`
- **Debounce:** 300ms debounce on snapshot sync
- **Tool Trimming:** 10 non-essential tools removed via `editor.deleteTool()`

### Architecture

```
tldraw editor (local)
    │
    │ editor.store.getSnapshot()  (on every change)
    ▼
scheduleSync()  ← 300ms debounce
    │
    ▼
yMap.set("snapshot", ...)  ← Y.Map (shared CRDT)
    │
    ▼
SocketIOProvider sends Yjs update
    │
    ▼
Other clients receive Yjs update
    │
    ▼
yMap.observe() fires
    │
    ▼
editor.store.loadSnapshot()  ← applies to their tldraw
```

### Echo Loop Prevention

```jsx
const applyingRef = useRef(false);

// When a remote Yjs update arrives
useEffect(() => {
  const observer = () => {
    applyingRef.current = true;        // Mark that we're applying remote
    const snapshot = yMap.get("snapshot");
    if (snapshot) editor.store.loadSnapshot(snapshot);
    applyingRef.current = false;       // Done applying
  };
  yMap.observe(observer);

  // When a local tldraw change happens
  const cleanup = editor.store.listen(() => {
    if (applyingRef.current) return;   // Skip if caused by remote update
    scheduleSync();                     // Sync local → remote
  });
}, []);
```

### Tool Customization

```jsx
// Removed tools (10)
["diamond", "triangle", "hexagon", "cloud", "star", "oval",
 "sticky-note", "frame", "highlight", "laser"].forEach(id => {
  editor.deleteTool(id);
});

// Hidden UI
<Tldraw
  components={{ HelpMenu: null, NavigationPanel: null }}
  ...
/>
```

**Why these 10 tools?** They are ornamental shapes (diamond, cloud, star, etc.) unnecessary for technical diagramming. The remaining 9 tools (select, hand, draw, text, rectangle, ellipse, arrow, line, eraser) cover all technical diagramming needs — flowcharts, architecture diagrams, wireframes, and annotations.

### User Flow

1. Click whiteboard toggle button in Room toolbar
2. Whiteboard panel slides in (split view with editor or full-width toggle)
3. Draw shapes, connect arrows, add text — all changes sync in real-time
4. Other users see changes appear with their awareness cursors
5. Whiteboard state is persisted in MongoDB via Yjs binary snapshot

### Interview Talking Points

- **Why Y.Map instead of Y.Array?** tldraw's store snapshot is a dictionary/object. Y.Map maps perfectly to this data structure. Y.Array would require converting to/from an array of key-value pairs.
- **Debounce time (300ms):** Whiteboard changes are less frequent than keystrokes. 300ms provides near-instant sync without overwhelming the network or triggering visual jank.
- **Echo loop prevention:** Without `applyingRef`, a remote update would trigger `store.loadSnapshot()`, which triggers `store.listen()`, which would `scheduleSync()` and push the exact same state back. This creates an infinite loop. The flag breaks the cycle.
- **Tool trimming rationale:** Reducing from 19 to 9 tools simplifies the UI, reduces cognitive load for technical users, and removes menu clutter. Purely cosmetic tools (highlight, laser) and decorative shapes add no value for architecture diagramming.

---

## 6. Feature 5 — Real-Time Chat

### Technical Implementation

- **File:** `ChatPanelNew.jsx`
- **Transport:** Socket.IO
- **Events:** `chat:join`, `chat:message`, `chat:history`
- **Storage:** In-memory ring buffer (last 50 messages per room)
- **Server:** `chat.socket.js`

### Architecture

```
Client A                  Server                  Client B
   │                         │                       │
   │── chat:join(roomId) ──►│                       │
   │◄── chat:history([...])─│                       │
   │                         │── chat:join(roomId)─►│
   │                         │◄── chat:history([])──│
   │── chat:message({...})─►│                       │
   │                         │── chat:message({...})│
   │                         │── chat:message({...})│
   │◄── chat:message({...})──│                       │
   │◄─────────────────────────────────────── chat:message({...})
```

### Data Structures

```js
// Message object (server-constructed)
{
  id: "uuid",                  // uuid v4
  username: "Alice",
  color: "#4A90D9",           // same as cursor color
  text: "Hello!",             // capped at 500 chars
  timestamp: 1717000000000    // Date.now()
}

// In-memory storage
const roomHistory = {};       // Shared across namespaces
roomHistory[roomId] = [       // Ring buffer, max 50
  { /* message */ }, ...
];
```

### User Flow

1. User enters Room → `ChatPanel` mounts with `socket`, `roomId`, `username`, `userColor`
2. Socket emits `chat:join` → server adds to room, sends last 50 messages
3. Existing messages render with color-coded avatars (initials), user names, timestamps
4. Type message in input → Enter or Send button → emits `chat:message`
5. Server constructs message object, adds to ring buffer, broadcasts to all room members
6. Messages appear in real-time for all users
7. Unread message count shown when chat panel is not focused

### Key Code

```jsx
const send = () => {
  if (!input.trim() || !socket) return;
  socket.emit("chat:message", {
    roomId,
    text: input.trim().slice(0, 500)
  });
  setInput("");
};

// Server handler
socket.on("chat:message", (data) => {
  const message = {
    id: uuidV4(),
    username: data.username,
    color: data.color,
    text: data.text,
    timestamp: Date.now()
  };
  if (!roomHistory[data.roomId]) roomHistory[data.roomId] = [];
  roomHistory[data.roomId].push(message);
  if (roomHistory[data.roomId].length > 50) roomHistory[data.roomId].shift();
  io.to(`chat:${data.roomId}`).emit("chat:message", message);
});
```

### Interview Talking Points

- **Why in-memory instead of MongoDB?** Chat messages are ephemeral — once seen, they rarely need to be re-read. In-memory storage provides zero-latency reads, no database load, and simpler architecture. The 50-message ring buffer is sufficient for ongoing conversations.
- **Trade-off:** Server restart loses all chat history. For a production collaboration tool, you'd want persistent chat with MongoDB and message pagination.
- **Character cap (500):** Prevents spam and oversized messages from clogging the WebSocket pipeline.
- **Client-constructed vs server-constructed messages:** Clients send `{ roomId, text }`. The server constructs the full message object with `id`, `username`, `color`, `timestamp`. This prevents client impersonation — users cannot forge who sent a message.
- **How `username` and `userColor` reach the server?** The server reads them from the `chat:join` event or from a shared awareness state. In CollabX, the ChatPanel passes `user.id` from Clerk and a randomly assigned `userColor` from Room.jsx.

---

## 7. Feature 6 — AI Code Review (Intent Mode)

### Technical Implementation

- **Client:** `AIReviewPanel.jsx` + `useAi.js` hook
- **Server:** `ai.controller.js` + `openrouter.service.js`
- **Model:** `moonshotai/kimi-k2.7-code` via OpenRouter
- **Actions:** `explain`, `refactor`, `generate`, `debug`
- **Rendering:** `react-markdown` + `react-syntax-highlighter`

### Intent Action Matrix

| Action | Requires Code | Requires Prompt | Requires stderr | Prompt Template |
|---|---|---|---|---|
| `explain` | ✅ | ❌ | ❌ | "You are a code tutor..." |
| `refactor` | ✅ | ❌ | ❌ | "You are a senior developer..." |
| `generate` | ❌ | ✅ | ❌ | "You are an expert developer..." |
| `debug` | ✅ | ❌ | ✅ | "You are a debugging expert..." |

### Prompt Engineering (openrouter.service.js)

Each action has a distinct system prompt designed to produce specific output formats:

```
explain:  "Explain what this code does and why it works that way.
           Use simple language and provide examples where helpful."

refactor: "Refactor this code for better readability and performance.
           Return the refactored code in a code block and include
           a 'What changed' section explaining your changes."

generate: "Generate code based on the following requirement..."

debug:    "Analyze the following error and code.
           Identify the root cause, provide the fix, and explain
           what went wrong. Include fixed code in a code block."
```

### User Flow

1. In Room, switch right tab to "AI" (from "Chat")
2. Select code in Monaco Editor (or full code is used if no selection)
3. Click one of four action buttons:
   - **Explain:** Get a natural language explanation of the selected code
   - **Refactor:** Get optimized code with diff-style "What changed" section
   - **Generate:** Type a natural language prompt in the textarea, click Generate
   - **Debug:** If code execution produced stderr, Debug button analyzes the error
4. AI response renders as Markdown with syntax-highlighted code blocks
5. Response includes copy button for each code block
6. Loading spinner shown during API call

### Key Code

```js
// useAi.js — the hook
const triggerAi = async ({ action, code, language, stderr }) => {
  setAiLoading(true);
  setAiError(null);
  setActiveAction(action);
  try {
    const { data } = await axios.post(`${API_URL}/api/ai`, {
      action, code, language, prompt: aiPrompt, stderr
    });
    setAiResponse(data.response);
  } catch (err) {
    setAiError(err.response?.data?.error || "AI request failed");
  } finally {
    setAiLoading(false);
  }
};

// OpenRouter API call
const response = await fetch(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
    }),
  }
);
```

### Interview Talking Points

- **Why OpenRouter instead of direct OpenAI/Gemini?** OpenRouter provides a unified API across 200+ models with a single API key. You can switch models (e.g., GPT-4 → Claude → Kimi) by changing the env var. No code changes needed. Also provides failover, load balancing, and cost tracking.
- **Why server-side AI?** API keys must never be exposed client-side. Server-side calls protect the key and allow request batching, caching, and prompt logging.
- **Prompt design pattern:** Each action gets a specialized system prompt. This is more effective than a single "do everything" prompt because intent-specific instructions produce more reliable, structured outputs.
- **Why react-markdown + react-syntax-highlighter?** Raw AI responses are markdown text. `react-markdown` renders it safely (no `dangerouslySetInnerHTML`). `react-syntax-highlighter` provides VS Code-quality code blocks with line numbers and copy buttons.
- **Fallback/error handling:** The `triggerAi` function manages three states: `response`, `loading`, `error`. All three are returned from the hook and rendered by `AIReviewPanel`. If the API fails (rate limit, timeout, invalid key), the error is shown inline.

---

## 8. Feature 7 — Code Execution Workspace

### Technical Implementation

- **Client:** `Room.jsx` (run button, terminal integration via `terminalRef`) + `Terminal.jsx` (interactive terminal UI)
- **Server:** `execution.controller.js` + `judge0.service.js`
- **API:** Judge0 CE Cloud (free tier)
- **Transport:** REST (POST → submission → poll result)
- **Encoding:** Base64 for source code, stdin, stdout, stderr, compile_output

### Execution Flow

```
User clicks Run (Ctrl+Enter)
        │
        ▼
Room.jsx gathers code + language
        │
        ▼
POST /api/execution/run { sourceCode, languageId, stdin? }
        │
        ▼
execution.controller.js validates input
        │
        ▼
judge0.service.js sends to Judge0:
  POST https://ce.judge0.com/submissions?base64_encoded=true&wait=true
        │
        ▼
Judge0 compiles and runs code in sandboxed Docker container
        │
        ▼
Judge0 returns result with stdout, stderr, exitCode, time, memory
        │
        ▼
Server decodes Base64 fields from Judge0 response
        │
        ▼
Room.jsx receives response → sets output state + pushes to terminal
        │
        ▼
Terminal renders stdout (white), stderr (red), with command history
```

### Judge0 Language IDs

| Language | ID |
|---|---|
| JavaScript (Node.js) | 63 |
| Python 3 | 71 |
| Java | 62 |
| C++ (GCC) | 54 |
| TypeScript | 74 |
| Go | 60 |
| Rust | 73 |
| HTML/CSS/JS | 68 |
| C | 50 |

### Key Code

```js
// judge0.service.js
const runCodeWithJudge0 = async ({ sourceCode, languageId, stdin }) => {
  const response = await fetch(
    `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: encodeBase64(sourceCode),
        language_id: languageId,
        stdin: encodeBase64(stdin || ""),
      }),
    }
  );
  const result = await response.json();
  return {
    stdout: decodeBase64(result.stdout),
    stderr: decodeBase64(result.stderr),
    compile_output: decodeBase64(result.compile_output),
    message: result.message,
    exit_code: result.exit_code,
    time: result.time,
    memory: result.memory,
  };
};

// Room.jsx — handle run (with terminal integration)
const handleRunCode = async (stdinInput = "") => {
  const sourceCode = editorRef.current?.getValue();
  if (!sourceCode) return;
  setIsRunning(true);
  setShowOutput(true);
  terminalRef.current?.pushStdin(`[${language.label}] Run program`);
  try {
    const res = await fetch(`${API_URL}/api/execution/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceCode, languageId: language.id, stdin: stdinInput }),
    });
    const data = await res.json();
    const r = data.result;
    const outputText = r.stdout || r.stderr || r.compile_output || "No output";
    setOutput(outputText);
    terminalRef.current?.pushOutput(outputText);
  } catch (err) {
    terminalRef.current?.pushError(`Error: ${err.message}`);
  }
  setIsRunning(false);
};
```

### User Flow

1. Write code in Monaco Editor
2. Press `Ctrl+Enter` or click "Run" button in toolbar
3. Terminal panel slides up showing `[Language] Run program` entry with "Running..." spinner
4. Server sends code to Judge0 CE (sandboxed Docker container)
5. Result returns with stdout (white), stderr (red), execution time, memory usage
6. Terminal panel appends the output as a new entry
7. User can type additional input in the terminal prompt and press Enter to provide stdin
8. Up/Down arrows navigate command history; Clear resets the terminal
9. If stderr exists, the "Debug" AI button becomes available to analyze the error

### Interview Talking Points

- **Why Judge0 instead of running code directly on the server?** Security. Judge0 runs code in isolated Docker containers with CPU/memory/network limits. Direct execution on the Express server would be a remote code execution vulnerability.
- **`wait=true` vs polling:** Judge0 supports `?wait=true` which blocks the HTTP response until execution completes (up to ~30s). Alternatively, you can poll `?base64_encoded=true` with a token. `wait=true` simplifies the client — no polling loop needed.
- **Base64 encoding:** Judge0 requires all text fields to be Base64-encoded to avoid JSON parsing issues with special characters. The service encodes before sending and decodes the response.
- **Free tier limits:** Judge0 CE Cloud free tier has rate limits (~50 requests/day). For production, you'd self-host Judge0 CE or use the enterprise tier.
- **Error states:** Three output states: `running`, `done`, `error`. The error state catches network failures, Judge0 downtime, and validation errors. Each state renders different UI in the output panel.

---

## 9. Feature 8 — Interactive Terminal

### Technical Implementation

- **File:** `Terminal.jsx` + `Room.jsx`
- **State:** `useImperativeHandle` (exposes `pushOutput`, `pushStdin`, `pushError`, `clear`, `focus`)
- **UI:** Terminal-themed panel with green `$` prompt, editable input, scrollable history
- **Integration:** Replaces the old read-only `<pre>` output panel
- **Shortcut:** `` Ctrl+` `` — toggle terminal (VS Code convention)

### Terminal Features

| Feature | How it works |
|---|---|
| **Editable input** | Text input at the bottom with `$` prompt; press Enter to submit |
| **stdin passthrough** | Typed input is sent as `stdin` to the next Judge0 execution |
| **Command history** | Up/Down arrows navigate previously entered commands |
| **Color-coded output** | Green for stdin/commands, red for stderr/errors, white for stdout |
| **Run integration** | Run button (Ctrl+Enter) pushes its output into the terminal |
| **State persistence** | Terminal stays in DOM with `hidden` class — history preserved when toggling |
| **Auto-scroll** | Scrolls to bottom automatically on new entries |
| **Clear** | Clears all history |

### Key Code

```jsx
// Terminal.jsx — exposed imperative methods
useImperativeHandle(ref, () => ({
  pushOutput(text) { ... },
  pushStdin(text) { ... },
  pushError(text) { ... },
  clear() { ... },
  focus() { ... }
}));

// Room.jsx — integration with handleRunCode
const handleRunCode = async (stdinInput = "") => {
  terminalRef.current?.pushStdin(`[${language.label}] Run program`);
  // ... fetch Judge0 ...
  terminalRef.current?.pushOutput(outputText);
};
```

### User Flow

1. Terminal panel slides up when user clicks Run or types in the terminal input
2. Run button pushes a `[Language] Run program` entry + stdout/stderr output
3. User can type directly in the terminal input and press Enter
4. Typed text is sent as stdin to the next code execution
5. Up/Down arrows navigate command history
6. Clear button resets the terminal; Close button (or `` Ctrl+` ``) hides it

### Keyboard Shortcuts (updated)

| Shortcut | Action |
|---|---|
| `Ctrl+S` | Save workspace |
| `Ctrl+Enter` | Run code |
| `` Ctrl+` `` | Toggle terminal |
| `?` | Shortcuts help |
| `Escape` | Close panels |

### Interview Talking Points

- **Why imperative refs instead of lifting state?** Terminal manages its own history internally. Using `useImperativeHandle` lets Room.jsx push output without managing terminal entries in its own state. This keeps concerns separated — Terminal owns history, Room.jsx only pushes new lines.
- **Why hide instead of unmount?** Unmounting the terminal on close would reset all history. Using CSS `hidden` (display: none) preserves the terminal's internal state (entries, history stack, scroll position) so re-opening feels seamless, matching VS Code's terminal behavior.
- **Why a single input line instead of a full shell?** Judge0 is a stateless REST API — there's no persistent shell process. Each "command" execution is a fresh POST. The terminal input acts as `stdin` to the next code run. A full pseudo-terminal (xterm.js + SSH/pseudo-tty) would require a persistent Docker container per room, which is overkill for an MVP.
- **How does the terminal differ from the old output panel?** The old panel was a read-only `<pre>` block showing only the latest output. The new terminal maintains a scrollable history of all commands and their outputs, supports keyboard-driven command history navigation, and allows typing stdin input.

---

## 10. Architecture & Data Flow

### Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                            │
│                                                                     │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Landing │  │Dashboard │  │  Room    │  │  Auth    │            │
│  │  Page   │  │  Page    │  │  Page    │  │(Clerk)  │            │
│  └─────────┘  └─────┬────┘  └─────┬────┘  └──────────┘            │
│                      │             │                               │
│                      │  REST API   │  WebSocket (Socket.IO)        │
│                      ▼             ▼                               │
└─────────────────────────────────────────────────────────────────────┘
                      │             │
                      ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Server (Express + Socket.IO)                │
│                                                                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  REST Routes   │  │  Yjs Sockets     │  │  Chat Sockets    │   │
│  │                │  │  (y-socket.io)   │  │  (socket.io)     │   │
│  │  /api/workspaces│  │                  │  │                  │   │
│  │  /api/execution │  │  document-loaded │  │  chat:join       │   │
│  │  /api/ai        │  │  document-update │  │  chat:message    │   │
│  └────────┬───────┘  │  document-destroy │  │  chat:history    │   │
│           │          └─────────┬────────┘  └────────┬─────────┘   │
│           ▼                    │                     │             │
│  ┌────────────────┐            │                     │             │
│  │  Controllers   │            │                     │             │
│  │  workspace     │            │                     │             │
│  │  execution     │            │                     │             │
│  │  ai            │            │                     │             │
│  └───────┬────────┘            │                     │             │
│          │                     │                     │             │
│          ▼                     │                     │             │
│  ┌────────────────┐            │                     │             │
│  │   Services     │            │                     │             │
│  │  openrouter    │            │                     │             │
│  │  judge0        │            │                     │             │
│  └───────┬────────┘            │                     │             │
│          │                     │                     │             │
│          ▼                     ▼                     ▼             │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                     MongoDB (Mongoose)                         ││
│  │                     Workspace collection                       ││
│  │  { roomId, ownerId, name, language, code, ydocState, timestamps}││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

External Services:
  ┌──────────┐    ┌───────────┐    ┌───────────┐
  │  Clerk   │    │ OpenRouter│    │  Judge0   │
  │  (Auth)  │    │  (AI API) │    │  (Exec)   │
  └──────────┘    └───────────┘    └───────────┘
```

### Component Communication

```
Room.jsx (orchestrator)
  │
  ├── Creates Y.Doc
  ├── Creates Socket.IO connections
  ├── Creates MonacoBinding
  │
  ├──► WhiteboardPanel
  │     Receives: ydoc (Y.Doc)
  │     Syncs: ydoc.getMap("tldraw_v2")
  │
  ├──► ChatPanel
  │     Receives: socket, roomId, username, userColor
  │     Events: chat:join, chat:message, chat:history
  │
  ├──► AIReviewPanel
  │     Receives: editorRef, language, stderr, aiState
  │     Calls: triggerAi from useAi hook
  │     API: POST /api/ai
  │
  └──► TerminalPanel
        Receives: ref, isRunning, onExecute, onClose
        Exposes: pushOutput, pushStdin, pushError, clear, focus
        Used by: Room.jsx pushes Judge0 output into terminal

Room.jsx state exposed to panels:
  - output (from code execution)
  - aiHook (from useAi)
  - language (from workspace metadata)
  - connected (WebSocket status)
  - terminalRef (imperative handle to push/output)
```

### State Management (no Redux/Zustand)

CollabX intentionally has **no global state management library**. State is managed through:

| Pattern | Used For |
|---|---|
| `useState` | UI state (tabs, modals, panels) |
| `useRef` | Editor instances, Yjs refs, cleanup refs |
| `Y.Doc` (shared CRDT) | All collaborative state (code, whiteboard, awareness) |
| `useAi` hook | AI request state (response, loading, error) |
| `Context` | Legacy toast system |
| `URL params` | `roomId`, auth redirects |

**Why no Redux?** Yjs IS the state management for collaborative data. Server state (workspace list) is fetched once per page load. UI state is local. Adding Redux would add complexity without benefit.

---

## 11. Interview Questions & Answers

### Architecture & Design

**Q: Why did you choose Yjs over other CRDT libraries?**

Yjs is the most mature CRDT library for JavaScript. It supports text, maps, arrays, and XML types via a pluggable module system. It integrates natively with Monaco (`y-monaco`), CodeMirror, ProseMirror, and has Socket.IO and WebSocket providers. The state vector-based sync protocol is bandwidth-efficient — only the missing operations are sent, not the full document. Alternative: Automerge is also good but lacks Monaco integration.

---

**Q: How does the Yjs awareness protocol work for cursor presence?**

Yjs Awareness is a separate protocol from document sync. Each client broadcasts a small JSON object (`{ user, color, cursor, selection }`) that is NOT part of the CRDT — it's ephemeral state. The `SocketIOProvider` sends awareness updates as separate messages. When a user disconnects, their awareness is automatically removed. MonacoBinding reads awareness and renders remote cursors/selections as colored underlines in the editor.

---

**Q: Explain the debounce strategy for persistence. Why not save every keystroke?**

Saving every keystroke would flood MongoDB with writes (potentially hundreds per second per user). The 2-second debounce coalesces rapid changes into a single write. If a user types continuously for 10 seconds, we write 5 times instead of ~500. On document-destroy (last user leaves), we save immediately with no debounce. This trades ~2s of potential data loss for a 100x reduction in database writes.

---

**Q: How would you scale this application to 10,000 concurrent users?**

1. **Horizontal scaling:** Deploy multiple Express instances behind a load balancer. Socket.IO supports Redis adapter for cross-instance message broadcasting.
2. **Yjs scaling:** Each room is a separate Yjs document namespace. Rooms don't share state, so they scale independently. MongoDB sharding by `roomId`.
3. **Judge0:** Self-host Judge0 CE with multiple worker nodes for parallel execution.
4. **Chat:** Replace in-memory ring buffer with Redis pub/sub + MongoDB for persistence.
5. **Static assets:** Serve via CDN (CloudFront, Cloudflare).
6. **Connection management:** Use Socket.IO's Redis adapter for sticky sessions or switch to `y-websocket` with horizontal scaling.

---

**Q: What's the difference between how code and whiteboard data is synced?**

Both use the same Y.Doc, but different data types:
- **Code:** `Y.Text` (ydoc.getText("monaco")) — optimized for character-by-character text editing with mergeable inserts/deletes
- **Whiteboard:** `Y.Map` (ydoc.getMap("tldraw_v2")) — stores the entire tldraw snapshot as a dictionary value

The key difference: Y.Text supports fine-grained undo/redo and per-character awareness. Y.Map replaces the entire value on each snapshot sync (though Yjs only transmits the changed key-value pairs under the hood).

---

**Q: How did you handle the "echo loop" problem with tldraw?**

The echo loop: local change → sync to Y.Map → Y.Map observer → loadSnapshot → store.listen fires → scheduleSync → sync to Y.Map → ... ad infinitum.

Fix: A `applyingRef` boolean flag. Before calling `store.loadSnapshot()` (in the Y.Map observer), set `applyingRef.current = true`. In the `store.listen` callback, check `if (applyingRef.current) return;`. This prevents local changes that originate from remote updates from being re-synced back.

---

**Q: Why is there no Redis or message queue in this architecture?**

This is a prototype/MVP. For a production system, you'd add:
- **Redis:** Socket.IO pub/sub for multi-instance broadcasting; session store; caching layer
- **Bull/RabbitMQ:** Queue Judge0 execution requests (especially for `wait=false` polling)
- **Kafka:** Event log for audit trails, analytics, replay

---

### Technical Challenges

**Q: What was the hardest bug you fixed?**

The stale closure bug in keyboard shortcuts. The `useEffect` registering `keydown` event listeners captured the initial closure of `handleSave` and `handleRunCode`. After re-renders (e.g., when language changes, or AI state updates), these functions change reference, but the event listener still calls the old versions. This caused Ctrl+S to save stale state and Ctrl+Enter to run code from the first render.

**Fix:** Store `handleSave` and `handleRunCode` in refs:
```jsx
const handleSaveRef = useRef(handleSave);
handleSaveRef.current = handleSave;  // Update on every render

// In the effect:
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    handleSaveRef.current();
  }
});
```

---

**Q: How did you resolve the MongoDB DNS issue?**

China's Great Firewall blocks direct access to MongoDB Atlas DNS. The fix was to force Google DNS in `config/db.js`:
```js
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
```
This bypasses local DNS resolution and routes through Google's DNS servers. Also added `serverSelectionTimeoutMS: 5000` for fast failure instead of the default 30-second timeout.

---

**Q: What was the Docker cgroup v2 issue?**

Older Judge0 versions expected cgroup v1 for container resource limits. Modern Linux distributions (Ubuntu 22.04+, Fedora) default to cgroup v2, causing Judge0 to fail silently. The fix (documented in Judge0 docs) was to add `"cgroup": "v2"` to the Judge0 configuration or use `--cgroup-parent` Docker flags.

---

**Q: How did you handle the `creating` state getting stuck?**

In `Dashboard.jsx`, the `handleCreate` function used `setCreating(true)` before the API call but only `setCreating(false)` in the `.then()` handler. If the API threw an error (network failure, server error), the `.catch()` block was missing `setCreating(false)`, leaving the modal button permanently disabled. Fixed by adding `setCreating(false)` in the `finally` block.

---

**Q: Why were 49 shadcn/ui component files deleted despite being installed?**

The project previously used shadcn/ui, but during refactoring, all imports were replaced with direct Radix usage or inline components. The 49 shadcn files in `client/src/app/components/ui/` were never imported anywhere — dead code. They added ~500KB to the bundle and misrepresented the actual dependency graph. Deleting them cleaned up the project and eliminated confusion.

---

### Performance & Optimization

**Q: How does Yjs handle large documents efficiently?**

Yjs uses:
- **State vectors:** Each client tracks which operations it has seen. When syncing, only missing operations are sent (delta compression).
- **Structural compression:** Deleted content is garbage-collected using a tombstone → compaction process.
- **Binary encoding:** The sync protocol uses a compact binary format, not JSON.
- **Incremental updates:** `Y.encodeStateAsUpdate()` encodes the full state, but `Y.encodeStateAsUpdateV2()` with state vectors sends deltas.

---

**Q: What's the bundle size impact of tldraw?**

tldraw v5 is ~500KB minified (canvas rendering, geometry engine, input handling, UI). This is loaded only when the user clicks the whiteboard toggle — not on initial page load. Code splitting (dynamic `import()`) could further defer loading. For comparison, the Monaco Editor is ~2MB, making tldraw the second-largest dependency.

---

**Q: How would you optimize the dashboard query?**

Current: `GET /api/workspaces/:ownerId` returns all workspaces sorted by `updatedAt`. For 50+ workspaces, you'd want:
- **Pagination:** `?page=1&limit=20` with `.skip().limit()`
- **Index:** Compound index on `{ ownerId: 1, updatedAt: -1 }` to avoid collection scans
- **Projection:** `select("roomId name language updatedAt")` to exclude the large `code` and `ydocState` fields from the list query

---

### Security

**Q: How do you prevent users from executing arbitrary code on your server?**

Code execution is sent to Judge0 CE, which runs in isolated Docker containers with:
- No network access (in production config)
- CPU/memory limits
- Timeout (default 5s)
- Read-only filesystem
- No access to the host machine

The Express server never calls `eval()`, `vm.runInContext()`, `child_process.exec()`, or any other code execution primitive.

---

**Q: How are API keys protected?**

API keys (OpenRouter, Judge0, MongoDB) are stored in `server/.env`, which is in `.gitignore` and never committed. The server reads them from `process.env`. Client-side code never sees or handles API keys. Clerk's publishable key (public, safe to expose) is the only key in `.env.local`.

---

**Q: Can a user inject malicious HTML through the chat?**

No. Chat messages are rendered as plain text. The message display uses `textContent` or React's JSX escaping (`{text}`), not `dangerouslySetInnerHTML`. If a user sends `<script>alert('xss')</script>`, it displays as literal text.

The AI response panel uses `react-markdown`, which by default does NOT render raw HTML tags — it strips them for security.

---

### Deployment & DevOps

**Q: Describe the Docker build process.**

Multi-stage Dockerfile:
1. **Stage 1 (frontend-builder):** `FROM node:20-alpine`, copy `client/`, `npm ci && npm run build` → produces `dist/` with Vite-built static assets
2. **Stage 2 (production):** `FROM node:20-alpine`, copy `server/`, `npm ci --production` (only production deps), copy `dist/` from stage 1 into `server/public/`, `CMD ["node", "src/server.js"]`

The single Docker image serves both API and static files, simplifying deployment to a single container.

---

**Q: What's the deployment architecture?**

Deployed to a single VPS (or container service like Railway/Render). The Express server:
- Serves static files from `public/` (the built React app)
- Handles API routes
- Handles Socket.IO connections
- Port 3000 behind a reverse proxy (nginx/Caddy) with SSL termination

For production at scale, you'd split into:
- Nginx/CDN for static assets
- Multiple API server instances behind a load balancer
- Redis for Socket.IO pub/sub
- MongoDB Atlas for database
- Self-hosted Judge0 workers

---

### Refactoring History & Evolution

**Q: Why was `gemini.service.js` renamed to `openrouter.service.js`?**

The project initially used Google Gemini API directly. After encountering rate limits, quota issues, and limited model choices, the team migrated to OpenRouter. OpenRouter provides:
- Access to 200+ models (GPT-4, Claude, Gemini, Llama, Kimi, etc.)
- Single API key and unified API format
- Fallback to alternative models on failure
- Cost tracking and spending limits
- No hard rate limits on paid tiers

The service was renamed to reflect that it's a generic AI gateway, not tied to any single provider.

---

**Q: What changed with Yjs persistence over time?**

**Phase 1:** Save only `yText.toString()` as `workspace.code`. Restore by `yText.insert(0, code)`. Whiteboard state lost on refresh.

**Phase 2:** Save `Y.encodeStateAsUpdate(doc)` as MongoDB Buffer. Restore by `Y.applyUpdate(doc, ...)`. Full state preserved, including whiteboard.

**Phase 3 (current):** Phase 2 + backward compatibility. If `ydocState` is null, fall back to `code` field. `timestamps: true` ensures `updatedAt` reflects actual saves.

---

**Q: Why were specific tldraw tools removed?**

The 10 removed tools fall into categories:
- **Decorative shapes** (diamond, triangle, hexagon, cloud, star, oval): Not useful for technical diagrams
- **Sticky note:** Unnecessary in a chat-enabled app
- **Frame:** Nested frame navigation adds complexity
- **Highlight/eraser:** Highlight is cosmetic; eraser is redundant with select+delete

The remaining 9 tools (select, hand, draw, text, rectangle, ellipse, arrow, line, eraser) cover all technical diagramming needs professionally.

---

## Appendix: Quick Reference

### Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `client/.env.local` | Clerk frontend key |
| `VITE_API_URL` | `client/.env.local` | Backend URL (default: `http://localhost:3000`) |
| `MONGO_URI` | `server/.env` | MongoDB connection string |
| `PORT` | `server/.env` | Server port (default: 3000) |
| `JUDGE0_API_URL` | `server/.env` | Judge0 API base URL |
| `OPENROUTER_API_KEY` | `server/.env` | OpenRouter API key |
| `OPENROUTER_MODEL` | `server/.env` | Model name (default: `moonshotai/kimi-k2.7-code`) |

### API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/workspaces/:ownerId` | List workspaces by user |
| GET | `/api/workspaces/by-room/:roomId` | Get workspace by room ID |
| POST | `/api/workspaces` | Create workspace |
| DELETE | `/api/workspaces/:roomId` | Delete workspace |
| PATCH | `/api/workspaces/:roomId` | Update workspace |
| POST | `/api/execution/run` | Run code via Judge0 |
| POST | `/api/ai` | AI code review |
| GET | `/health` | Health check |

### Socket.IO Events

**Chat:**
| Event | Direction | Purpose |
|---|---|---|
| `chat:join` | Client→Server | Join room, request history |
| `chat:history` | Server→Client | Previous 50 messages |
| `chat:message` | Bidirectional | Send/receive message |

**Yjs (via y-socket.io):**
| Event | Direction | Purpose |
|---|---|---|
| `document-loaded` | Server→Client | Load Yjs state from MongoDB |
| `document-update` | Client→Server | Propagate Yjs changes (debounced) |
| `document-destroy` | Client→Server | Save on disconnect |

### Common Commands

```bash
# Development
npm run dev              # Start server (nodemon)
cd client && npm run dev # Start Vite

# Build
cd client && npm run build                    # Build frontend
Copy-Item -Recurse client/dist/* server/public/   # Copy to server

# Docker
docker build -t collabx .
docker run -p 3000:3000 collabx

# Production
cd server && npm start  # NODE_ENV=production
```
