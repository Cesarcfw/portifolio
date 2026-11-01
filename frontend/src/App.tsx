import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { io } from 'socket.io-client'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Projects from './pages/Projects'
import About from './pages/About'
import Contact from './pages/Contact'
import Admin from './pages/Admin'

import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const socket = io(socketUrl)

function App() {
  useEffect(() => {
    const refresh = () => window.dispatchEvent(new Event('portfolio:refresh'))
    socket.on('refresh_data', refresh)
    return () => {
      socket.off('refresh_data', refresh)
    }
  }, [])

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <Navbar />
        <div className="pt-[72px]">
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/projetos" element={<Projects />} />
            <Route path="/sobre"    element={<About />} />
            <Route path="/contato"  element={<Contact />} />
            <Route path="/admin"    element={<Admin />} />
            <Route path="/admin/reset" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
