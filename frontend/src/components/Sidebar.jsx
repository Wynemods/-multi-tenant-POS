import { Link } from 'react-router-dom'

const Sidebar = ({ currentPath, userRole }) => {
  const menuItems = [
    { path: '/pos', label: 'POS', icon: '🛒', roles: ['admin', 'manager', 'cashier'] },
    { path: '/products', label: 'Products', icon: '📦', roles: ['admin', 'manager', 'cashier'] },
    { path: '/services', label: 'Services', icon: '⚙️', roles: ['admin', 'manager', 'cashier'] },
    { path: '/transactions', label: 'Transactions', icon: '💰', roles: ['admin', 'manager', 'cashier'] },
    { path: '/inventory', label: 'Inventory', icon: '📊', roles: ['admin', 'manager'] },
    { path: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'manager'] },
    { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin'] },
  ]

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole))

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPath === item.path
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

