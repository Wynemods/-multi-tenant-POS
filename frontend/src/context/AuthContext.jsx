import { createContext, useState, useContext, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shopId, setShopId] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedShopId = localStorage.getItem('shopId')
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      setShopId(storedShopId)
    }
    setLoading(false)
  }, [])

  const login = async (email, password, shopId, role) => {
    try {
      const response = await api.post('/auth/login', { email, password, shopId, role })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('shopId', shopId)
      
      setUser(user)
      setShopId(shopId)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return { success: true, data: response.data }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed'
      console.error('Registration error:', error)
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('shopId')
    setUser(null)
    setShopId(null)
  }

  const value = {
    user,
    shopId,
    login,
    register,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

