import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { SignedIn, SignedOut } from "@clerk/clerk-react"
import Landing from "./Landing"
import Dashboard from "./Dashboard"
import Room from "./Room"
import NotFound from "./NotFound"
import { ToastProvider } from "./components/Toast"
import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={
            <>
              <SignedIn><Dashboard /></SignedIn>
              <SignedOut><Navigate to="/" replace /></SignedOut>
            </>
          } />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
