import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterShop from './pages/RegisterShop'
import POS from './pages/POS'
import Products from './pages/Products'
import Services from './pages/Services'
import Transactions from './pages/Transactions'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-shop" element={<RegisterShop />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/pos" replace />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="services" element={<Services />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App

