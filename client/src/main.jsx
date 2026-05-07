import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file")
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    ) : (
      <div style={{ padding: '20px', color: 'white', backgroundColor: '#111', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>Missing Clerk Publishable Key</h2>
        <p>Please create a <b>.env.local</b> file in the `c:\CollabX\client` folder.</p>
        <p>Inside the file, paste your key like this:</p>
        <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code>
        <p>Then restart your frontend server.</p>
      </div>
    )}
  </StrictMode>,
)
