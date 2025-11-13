import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    shopId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'cashier'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.shopId || !formData.name || !formData.email || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const result = await register(formData)
    setLoading(false)

    if (result.success) {
      navigate('/login', { state: { message: 'Registration successful! Please login with your Shop ID and credentials.' } })
    } else {
      setError(result.error || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12">
      <div className="max-w-5xl w-full grid grid-cols-2 gap-8">
        {/* Left Side - Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-primary-700 mb-2">Register Account</h1>
            <p className="text-gray-600">Step 2: Create your user account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop ID * 
                <span className="text-primary-600 ml-1">(Get this from your shop owner)</span>
              </label>
              <input
                type="text"
                name="shopId"
                value={formData.shopId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your Shop ID (e.g., A3K7M)"
                maxLength="5"
              />
              <p className="text-xs text-gray-500 mt-1">The Shop ID links your account to the correct shop</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Register As *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="cashier">Cashier (Process Sales)</option>
                <option value="manager">Manager (View Only)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.role === 'manager' 
                  ? 'Manager can view reports and inventory but cannot make changes' 
                  : 'Cashier can process sales and view products/services'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Account'}
            </button>
          </form>

          <div className="mt-6 space-y-2">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600">
              Need to create a shop first?{' '}
              <Link to="/register-shop" className="text-primary-600 hover:text-primary-700 font-medium">
                Register Shop
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Instructions Guide */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-800 mb-4">How Registration Works</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Register Your Shop
                </h3>
                <p className="text-sm text-gray-600 ml-8">
                  Shop owners first register their shop. This creates a new shop database and generates a unique 5-character Shop ID (e.g., "A3K7M").
                </p>
                <Link 
                  to="/register-shop" 
                  className="ml-8 mt-2 inline-block text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  → Register Shop Now
                </Link>
              </div>

              <div className="border-l-4 border-accent-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="bg-accent-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Register User Account
                </h3>
                <p className="text-sm text-gray-600 ml-8">
                  Managers and Cashiers register their accounts using the Shop ID provided by the shop owner. Each user selects their role (Manager or Cashier).
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Login to Your Shop
                </h3>
                <p className="text-sm text-gray-600 ml-8">
                  Use your Shop ID, email, password, and selected role to login. The Shop ID determines which shop's data you access.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Important Notes:</h4>
            <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
              <li>Each shop has its own isolated database</li>
              <li>Shop ID is unique and links users to their shop</li>
              <li>Managers can view but cannot make changes</li>
              <li>Cashiers can process sales and transactions</li>
              <li>Only shop owners can create new shops</li>
            </ul>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Don't have a Shop ID?</h4>
            <p className="text-sm text-yellow-700 mb-2">
              You need to get your Shop ID from the shop owner. If you're the shop owner, register your shop first to get your Shop ID.
            </p>
            <Link 
              to="/register-shop" 
              className="text-sm text-yellow-800 hover:text-yellow-900 font-medium underline"
            >
              Register a new shop →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
