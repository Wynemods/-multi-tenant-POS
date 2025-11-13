import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const Header = ({ user, onLogout }) => {
  const { shopId } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get role badge color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700'
      case 'manager':
        return 'bg-blue-100 text-blue-700'
      case 'cashier':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary-700">POS System</h1>
          <p className="text-sm text-gray-500">Shop ID: <span className="font-semibold text-primary-600">{shopId}</span></p>
        </div>
        
        {/* Profile Section */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full transition-all hover:opacity-80"
          >
            {/* Circular Profile Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-shadow">
              {getInitials(user?.name || user?.email)}
            </div>
            {/* Dropdown Arrow */}
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-200 ease-out opacity-100 translate-y-0">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-primary-500 to-accent-500 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                    {getInitials(user?.name || user?.email)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{user?.name || 'User'}</h3>
                    <p className="text-sm text-white/90">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Role:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getRoleColor(user?.role)}`}>
                      {user?.role || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Shop ID:</span>
                    <span className="text-sm font-semibold text-primary-600 font-mono">{shopId}</span>
                  </div>
                </div>

                <div className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    onLogout()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

