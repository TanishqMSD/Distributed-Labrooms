import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Room from './pages/Room'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import LabRoom from './pages/LabRoom'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/labroom/:roomId" element={<LabRoom />} />
      </Routes>
    </Router>
  )
}

export default App
