import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ClubSelect from './pages/ClubSelect'
import ClubManage from './pages/ClubManage'
import AdminPanel from './pages/AdminPanel'
import PublicView from './pages/PublicView'
import Rankings from './pages/Rankings'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/clubs"
              element={
                <ProtectedRoute>
                  <ClubSelect />
                </ProtectedRoute>
              }
            />
            <Route path="/club/:slug" element={<ClubManage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/public" element={<PublicView />} />
            <Route path="/rankings" element={<Rankings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
