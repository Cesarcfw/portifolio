import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { io } from 'socket.io-client'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Projects from './pages/Projects'
import About from './pages/About'
import Contact from './pages/Contact'
import Admin from './pages/Admin'

import ResetPassword from './pages/ResetPassword'

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const socket = io(socketUrl)

function App() {
  useEffect(() => {
    socket.on('refresh_data', () => {
      window.location.reload()
    })
    return () => {
      socket.off('refresh_data')
    }
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div className="pt-16">
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/projetos" element={<Projects />} />
            <Route path="/sobre"    element={<About />} />
            <Route path="/contato"  element={<Contact />} />
            <Route path="/admin"    element={<Admin />} />
            <Route path="/admin/reset" element={<ResetPassword />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App