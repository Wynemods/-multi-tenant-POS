import { useState, useEffect } from 'react'
import api from '../utils/api'
import { formatCurrency, formatDate } from '../utils/formatters'

const Reports = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/dashboard')
      setDashboardData(res.data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
    setLoading(false)
  }

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-gray-800">Reports & Analytics</h2>
        <div className="flex gap-4">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="px-4 py-2 border rounded-lg"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Today's Sales</p>
          <p className="text-3xl font-bold text-primary-600">{formatCurrency(dashboardData.today_sales || 0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
          <p className="text-3xl font-bold text-accent-600">{dashboardData.total_transactions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Low Stock Items</p>
          <p className="text-3xl font-bold text-red-600">{dashboardData.low_stock_count || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-1">Total Products</p>
          <p className="text-3xl font-bold text-green-600">{dashboardData.total_products || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {dashboardData.top_products?.slice(0, 5).map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.quantity_sold} sold</p>
                </div>
                <p className="font-semibold text-primary-600">{formatCurrency(product.total_revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {dashboardData.recent_transactions?.slice(0, 5).map((transaction, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{transaction.transaction_number}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(transaction.total_amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports

