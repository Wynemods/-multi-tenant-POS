import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatters'

const Inventory = () => {
  const [products, setProducts] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [inventoryLogs, setInventoryLogs] = useState([])
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [restockQuantity, setRestockQuantity] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { user } = useAuth()
  const isReadOnly = user?.role === 'manager'

  useEffect(() => {
    fetchAllData()
  }, [user])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchProducts(),
      fetchLowStock(),
      (user?.role === 'manager' || user?.role === 'admin') && fetchInventoryLogs()
    ])
    setLoading(false)
  }

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    }
  }

  const fetchLowStock = async () => {
    try {
      const res = await api.get('/products/low-stock')
      setLowStockProducts(res.data)
    } catch (error) {
      console.error('Error fetching low stock:', error)
    }
  }

  const fetchInventoryLogs = async () => {
    try {
      const res = await api.get('/inventory/logs')
      setInventoryLogs(res.data)
    } catch (error) {
      console.error('Error fetching inventory logs:', error)
      toast.error('Failed to load inventory logs')
    }
  }

  const handleRestock = async () => {
    if (!selectedProduct || !restockQuantity) return

    try {
      await api.post('/inventory/restock', {
        product_id: selectedProduct.id,
        quantity: parseInt(restockQuantity)
      })
      setShowRestockModal(false)
      setSelectedProduct(null)
      setRestockQuantity('')
      await fetchAllData()
      toast.success('Stock updated successfully!')
    } catch (error) {
      toast.error('Error updating stock: ' + (error.response?.data?.message || error.message))
    }
  }

  // Helper function to get log field value (handles both camelCase and snake_case)
  const getLogField = (log, camelCase, snakeCase) => {
    return log[camelCase] ?? log[snakeCase] ?? null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-800">Inventory Management</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage your product stock levels</p>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg border border-primary-200">
            <span className="text-primary-600">📦</span>
            <span className="text-sm font-medium text-primary-700">{products.length} Products</span>
          </div>
        )}
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                Low Stock Alert
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold">
                  {lowStockProducts.length} {lowStockProducts.length === 1 ? 'Item' : 'Items'}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStockProducts.map(product => {
                  const stock = product.stockQuantity ?? product.stock_quantity ?? 0
                  const minStock = product.minStockLevel ?? product.min_stock_level ?? 0
                  return (
                    <div key={product.id} className="bg-white rounded-md p-3 border border-yellow-200">
                      <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-semibold text-red-600">{stock}</span> left • Min: <span className="font-semibold">{minStock}</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span>📋</span>
            Product Stock Overview
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Min Level</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📦</span>
                      <p className="text-gray-500 font-medium">No products found</p>
                      <p className="text-sm text-gray-400">Add products to start managing inventory</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const stock = product.stockQuantity ?? product.stock_quantity ?? 0
                  const minStock = product.minStockLevel ?? product.min_stock_level ?? 0
                  const isOutOfStock = stock <= 0
                  const isLowStock = stock > 0 && stock <= minStock
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                            <span className="text-lg">📦</span>
                          </div>
                          <span className="font-semibold text-gray-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-gray-800">{stock}</span>
                        <span className="text-sm text-gray-500 ml-1">units</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">{minStock || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!isReadOnly ? (
                          <button
                            onClick={() => {
                              setSelectedProduct(product)
                              setShowRestockModal(true)
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                          >
                            Restock
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm italic">Read Only</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Activity Log Section */}
      {(user?.role === 'manager' || user?.role === 'admin') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span>📊</span>
                  Inventory Activity Log
                </h3>
                <p className="text-sm text-gray-600 mt-1">Complete history of all stock changes including restocks, sales, and adjustments</p>
              </div>
              <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">{inventoryLogs.length} {inventoryLogs.length === 1 ? 'Entry' : 'Entries'}</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Change Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity Change</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Previous Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">New Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📝</span>
                        <p className="text-gray-500 font-medium">No inventory activity yet</p>
                        <p className="text-sm text-gray-400">Activity will appear here when stock changes occur</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventoryLogs.map(log => {
                    // Handle both camelCase (from Prisma) and snake_case formats
                    const date = getLogField(log, 'createdAt', 'created_at')
                    const productName = log.product_name || log.product?.name || 'N/A'
                    const changeType = getLogField(log, 'changeType', 'change_type') || 'unknown'
                    const quantityChange = getLogField(log, 'quantityChange', 'quantity_change') ?? 0
                    const previousStock = getLogField(log, 'previousStock', 'previous_stock') ?? 0
                    const newStock = getLogField(log, 'newStock', 'new_stock') ?? 0

                    const getChangeTypeStyle = (type) => {
                      switch (type?.toLowerCase()) {
                        case 'restock':
                          return 'bg-green-100 text-green-800 border-green-200'
                        case 'sale':
                          return 'bg-blue-100 text-blue-800 border-blue-200'
                        case 'adjustment':
                          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        default:
                          return 'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    }

                    const getChangeTypeIcon = (type) => {
                      switch (type?.toLowerCase()) {
                        case 'restock':
                          return '⬆️'
                        case 'sale':
                          return '⬇️'
                        case 'adjustment':
                          return '🔄'
                        default:
                          return '📝'
                      }
                    }

                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            {date ? (
                              <div>
                                <div className="font-medium text-gray-900">{formatDate(date)}</div>
                                {date instanceof Date || (typeof date === 'string' && date.includes('T')) ? (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📦</span>
                            <span className="font-semibold text-gray-800">{productName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getChangeTypeStyle(changeType)}`}>
                            <span>{getChangeTypeIcon(changeType)}</span>
                            <span className="capitalize">{changeType}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 font-bold text-base ${
                            quantityChange > 0 ? 'text-green-600' : quantityChange < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {quantityChange > 0 ? '+' : ''}{quantityChange}
                            <span className="text-xs text-gray-500 font-normal ml-1">units</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-700 font-medium">{previousStock}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-800">{newStock}</span>
                            <span className="text-xs text-gray-500">units</span>
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📦</span>
                Restock Product
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Product Name</p>
                <p className="font-bold text-lg text-gray-800">{selectedProduct?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1 font-medium">Current Stock</p>
                  <p className="font-bold text-xl text-blue-700">
                    {selectedProduct?.stockQuantity ?? selectedProduct?.stock_quantity ?? 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-600 mb-1 font-medium">Min Level</p>
                  <p className="font-bold text-xl text-green-700">
                    {selectedProduct?.minStockLevel ?? selectedProduct?.min_stock_level ?? 0}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-lg font-medium"
                  min="1"
                  placeholder="Enter quantity"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRestock}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Update Stock
                </button>
                <button
                  onClick={() => {
                    setShowRestockModal(false)
                    setSelectedProduct(null)
                    setRestockQuantity('')
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory

