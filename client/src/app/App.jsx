import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { SignedIn, SignedOut } from "@clerk/clerk-react"
import { Toaster } from "sonner"
import Landing from "./Landing"
import Dashboard from "./Dashboard"
import Room from "./Room"
import NotFound from "./NotFound"
import SignInPage from "./SignInPage"
import SignUpPage from "./SignUpPage"
import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-overlay)',
            color: 'var(--fg-default)',
            border: '1px solid var(--border-default)',
            fontSize: '13px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/dashboard" element={
          <>
            <SignedIn><Dashboard /></SignedIn>
            <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        } />
        <Route path="/room/:roomId" element={
          <>
            <SignedIn><Room /></SignedIn>
            <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
          </>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
