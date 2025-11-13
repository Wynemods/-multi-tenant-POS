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
  const toast = useToast()
  const { user } = useAuth()
  const isReadOnly = user?.role === 'manager'

  useEffect(() => {
    fetchProducts()
    fetchLowStock()
    if (user?.role === 'manager' || user?.role === 'admin') {
      fetchInventoryLogs()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } catch (error) {
      console.error('Error fetching products:', error)
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
      fetchProducts()
      fetchLowStock()
      if (user?.role === 'manager' || user?.role === 'admin') {
        fetchInventoryLogs()
      }
      toast.success('Stock updated successfully!')
    } catch (error) {
      toast.error('Error updating stock: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-gray-800">Inventory Management</h2>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Low Stock Alert</h3>
          <div className="space-y-2">
            {lowStockProducts.map(product => (
              <p key={product.id} className="text-sm text-yellow-700">
                {product.name} - Only {product.stock_quantity} left (Min: {product.min_stock_level})
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.stock_quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.min_stock_level || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.stock_quantity <= (product.min_stock_level || 0) ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Low Stock</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">In Stock</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!isReadOnly && (
                    <button
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowRestockModal(true)
                      }}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Restock
                    </button>
                  )}
                  {isReadOnly && (
                    <span className="text-gray-400 text-sm">Read Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(user?.role === 'manager' || user?.role === 'admin') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Inventory Activity Log</h3>
          <p className="text-sm text-gray-600 mb-4">View all stock changes including restocks, sales, and adjustments</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Previous Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No inventory activity yet</td>
                  </tr>
                ) : (
                  inventoryLogs.map(log => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{log.product_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.change_type === 'restock' ? 'bg-green-100 text-green-800' :
                          log.change_type === 'sale' ? 'bg-blue-100 text-blue-800' :
                          log.change_type === 'adjustment' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.change_type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap font-semibold ${
                        log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{log.previous_stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">{log.new_stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Restock Product</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-semibold">{selectedProduct?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Stock</p>
                <p className="font-semibold">{selectedProduct?.stock_quantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Add Quantity *</label>
                <input
                  type="number"
                  required
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRestock}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  Update Stock
                </button>
                <button
                  onClick={() => {
                    setShowRestockModal(false)
                    setSelectedProduct(null)
                    setRestockQuantity('')
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
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

