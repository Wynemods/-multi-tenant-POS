import { useState, useEffect } from 'react'
import api from '../utils/api'
import { formatCurrency, formatDate, formatDateOnly } from '../utils/formatters'

// Payment method icons helper
const getPaymentIcon = (method) => {
  const methodLower = method?.toLowerCase() || ''
  if (methodLower.includes('cash')) return '💵'
  if (methodLower.includes('card')) return '💳'
  if (methodLower.includes('mobile') || methodLower.includes('mpesa')) return '📱'
  return '💰'
}

// Payment method color helper
const getPaymentColor = (method) => {
  const methodLower = method?.toLowerCase() || ''
  if (methodLower.includes('cash')) return 'bg-green-100 text-green-800 border-green-200'
  if (methodLower.includes('card')) return 'bg-blue-100 text-blue-800 border-blue-200'
  if (methodLower.includes('mobile') || methodLower.includes('mpesa')) return 'bg-purple-100 text-purple-800 border-purple-200'
  return 'bg-gray-100 text-gray-800 border-gray-200'
}

const Reports = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(true)

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

  // Helper to get field value (handles both camelCase and snake_case)
  const getField = (obj, camelCase, snakeCase) => {
    return obj[camelCase] ?? obj[snakeCase] ?? null
  }

  // Calculate max revenue for chart scaling
  const maxRevenue = dashboardData?.daily_sales?.length > 0
    ? Math.max(...dashboardData.daily_sales.map(d => d.revenue || 0))
    : 1

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-800">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">Today</span>
          </div>
          <p className="text-sm font-medium text-primary-100 mb-1">Today's Sales</p>
          <p className="text-3xl font-bold">{formatCurrency(dashboardData.today_sales || 0)}</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">All Time</span>
          </div>
          <p className="text-sm font-medium text-green-100 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{formatCurrency(dashboardData.total_revenue || 0)}</p>
        </div>

        {/* Total Transactions */}
        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-sm font-medium text-accent-100 mb-1">Transactions</p>
          <p className="text-3xl font-bold">{dashboardData.total_transactions || 0}</p>
        </div>

        {/* Average Transaction */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">Average</span>
          </div>
          <p className="text-sm font-medium text-blue-100 mb-1">Avg Transaction</p>
          <p className="text-3xl font-bold">{formatCurrency(dashboardData.avg_transaction_value || 0)}</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span>⚠️</span>
              Low Stock Items
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              (dashboardData.low_stock_count || 0) > 0 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {dashboardData.low_stock_count || 0}
            </span>
          </div>
          <div className="h-20 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-800">{dashboardData.low_stock_count || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Products need restocking</p>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span>📦</span>
              Total Products
            </h3>
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-bold">
              {dashboardData.total_products || 0}
            </span>
          </div>
          <div className="h-20 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-800">{dashboardData.total_products || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Products in inventory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart - Last 7 Days */}
      {dashboardData.daily_sales && dashboardData.daily_sales.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <span>📊</span>
              Sales Trend (Last 7 Days)
            </h3>
            <p className="text-sm text-gray-500">Daily revenue and transaction count</p>
          </div>
          <div className="space-y-4">
            {dashboardData.daily_sales.map((day, index) => {
              const revenue = day.revenue || 0
              const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
              const date = new Date(day.date)
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const dayNumber = date.getDate()
              
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-gray-600">
                    <div>{dayName}</div>
                    <div className="text-xs text-gray-400">{dayNumber}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        >
                          <div className="h-full flex items-center justify-end pr-2">
                            <span className="text-xs font-bold text-white">
                              {formatCurrency(revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{day.transaction_count || 0} transactions</span>
                      <span className="font-semibold">{formatCurrency(revenue)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment Methods Breakdown */}
      {dashboardData.payment_methods && dashboardData.payment_methods.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <span>💳</span>
              Payment Methods
            </h3>
            <p className="text-sm text-gray-500">Breakdown by payment type</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.payment_methods.map((pm, index) => {
              const total = pm.total || 0
              const count = pm.count || 0
              const method = pm.method || 'Unknown'
              const totalAll = dashboardData.payment_methods.reduce((sum, p) => sum + (p.total || 0), 0)
              const percentage = totalAll > 0 ? ((total / totalAll) * 100).toFixed(1) : 0
              
              return (
                <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getPaymentIcon(method)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPaymentColor(method)}`}>
                        {method}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(total)}</p>
                      <p className="text-xs text-gray-500">{percentage}% of total</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">{count}</span> transactions
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Products & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <span>🏆</span>
              Top Selling Products
            </h3>
            <p className="text-sm text-gray-500">Best performing products by sales</p>
          </div>
          <div className="space-y-4">
            {dashboardData.top_products && dashboardData.top_products.length > 0 ? (
              dashboardData.top_products.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center font-bold text-primary-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {product.quantity_sold || 0} units sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">{formatCurrency(product.total_revenue || 0)}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">📦</span>
                <p>No product sales data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-1">
              <span>🕐</span>
              Recent Transactions
            </h3>
            <p className="text-sm text-gray-500">Latest sales activity</p>
          </div>
          <div className="space-y-3">
            {dashboardData.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
              dashboardData.recent_transactions.slice(0, 5).map((transaction, index) => {
                // Handle both camelCase and snake_case
                const transactionNumber = getField(transaction, 'transactionNumber', 'transaction_number') || 'N/A'
                const totalAmount = getField(transaction, 'totalAmount', 'total_amount') || 0
                const createdAt = getField(transaction, 'createdAt', 'created_at')
                const paymentMethod = getField(transaction, 'paymentMethod', 'payment_method') || 'Unknown'
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center">
                        <span className="text-lg">{getPaymentIcon(paymentMethod)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{transactionNumber}</p>
                        <p className="text-xs text-gray-500">
                          {createdAt ? formatDateOnly(createdAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getPaymentColor(paymentMethod)}`}>
                        {paymentMethod}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">💵</span>
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
