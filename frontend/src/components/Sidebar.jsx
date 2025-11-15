import { Link } from 'react-router-dom'

const Sidebar = ({ currentPath, userRole }) => {
  const menuItems = [
    { path: '/pos', label: 'POS', icon: '💳', roles: ['admin', 'manager', 'cashier'] },
    { path: '/products', label: 'Products', icon: '📦', roles: ['admin', 'manager', 'cashier'] },
    { path: '/services', label: 'Services', icon: '✨', roles: ['admin', 'manager', 'cashier'] },
    { path: '/transactions', label: 'Transactions', icon: '💵', roles: ['admin', 'manager', 'cashier'] },
    { path: '/inventory', label: 'Inventory', icon: '📋', roles: ['admin', 'manager'] },
    { path: '/reports', label: 'Reports', icon: '📊', roles: ['admin', 'manager'] },
    { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin'] },
  ]

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole))

  return (
    <aside className="w-56 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-sm min-h-screen sticky top-0">
      <nav className="p-3">
        <ul className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = currentPath === item.path
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                  }`}
                >
                  <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-primary-600'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

