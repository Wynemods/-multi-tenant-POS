import { useAuth } from '../context/AuthContext'

const Header = ({ user, onLogout }) => {
  const { shopId } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary-700">POS System</h1>
          <p className="text-sm text-gray-500">Shop ID: {shopId}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium text-gray-900">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

