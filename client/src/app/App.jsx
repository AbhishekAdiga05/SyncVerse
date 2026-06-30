import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { SignedIn, SignedOut } from "@clerk/clerk-react"
import { Toaster } from "sonner"
import Landing from "./Landing"
import Dashboard from "./Dashboard"
import Room from "./Room"
import NotFound from "./NotFound"
import SignInPage from "./SignInPage"
import SignUpPage from "./SignUpPage"
import { ToastProvider } from "./components/Toast"
import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#161b22',
              color: '#e6edf3',
              border: '1px solid #30363d',
              fontSize: '13px',
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
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
