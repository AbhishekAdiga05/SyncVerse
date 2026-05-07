import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./Home"
import Room from "./Room"
import "./App.css"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App