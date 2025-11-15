import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

const Products = () => {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const toast = useToast()
  const { user } = useAuth()
  const isReadOnly = user?.role === 'manager'
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    min_stock_level: '',
    unit: 'piece'
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
          // Prepare data with proper types
          const submitData = {
            name: formData.name,
            barcode: formData.barcode || null,
            category: formData.category || null,
            price: parseFloat(formData.price),
            cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
            stock_quantity: parseInt(formData.stock_quantity) || 0,
            min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : null,
            unit: formData.unit || 'piece'
          }

          if (!submitData.name || !submitData.price || isNaN(submitData.price)) {
            toast.error('Name and valid price are required')
            return
          }

          if (isNaN(submitData.stock_quantity) || submitData.stock_quantity < 0) {
            toast.error('Stock quantity must be a valid non-negative number')
            return
          }

          if (submitData.min_stock_level === null || submitData.min_stock_level === undefined || isNaN(submitData.min_stock_level) || submitData.min_stock_level < 0) {
            toast.error('Minimum stock level is required and must be a valid non-negative number')
            return
          }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, submitData)
      } else {
        await api.post('/products', submitData)
      }
      setShowModal(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        barcode: '',
        category: '',
        price: '',
        cost_price: '',
        stock_quantity: '',
        min_stock_level: '',
        unit: 'piece'
      })
      fetchProducts()
      toast.success(editingProduct ? 'Product updated successfully!' : 'Product created successfully!')
    } catch (error) {
      console.error('Product error:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error saving product'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      category: product.category || '',
      price: product.price,
      cost_price: product.costPrice ?? product.cost_price ?? '',
      stock_quantity: product.stockQuantity ?? product.stock_quantity ?? 0,
      min_stock_level: product.minStockLevel ?? product.min_stock_level ?? '',
      unit: product.unit || 'piece'
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    setProductToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return
    try {
      await api.delete(`/products/${productToDelete}`)
      fetchProducts()
      toast.success('Product deleted successfully!')
      setProductToDelete(null)
    } catch (error) {
      toast.error('Error deleting product: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-gray-800">Products</h2>
        {!isReadOnly && (
          <button
            onClick={() => {
              setEditingProduct(null)
              setFormData({
                name: '',
                barcode: '',
                category: '',
                price: '',
                cost_price: '',
                stock_quantity: '',
                min_stock_level: '',
                unit: 'piece'
              })
              setShowModal(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            + Add Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Category</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Price</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Stock</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm border-r border-gray-200">
                  No products found. {!isReadOnly && 'Click "Add Product" to create your first product.'}
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-sm border-r border-gray-200">{product.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600 text-sm border-r border-gray-200">{product.category || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-gray-200">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-gray-200">
                    {(() => {
                      // Handle both camelCase (from Prisma) and snake_case formats
                      const stock = product.stockQuantity ?? product.stock_quantity ?? 0
                      const minStock = product.minStockLevel ?? product.min_stock_level ?? 0
                      const isOutOfStock = stock <= 0
                      const isLowStock = stock > 0 && stock <= minStock
                      
                      if (isOutOfStock) {
                        return <span className="text-red-600 font-semibold text-xs">Out of Stock</span>
                      } else if (isLowStock) {
                        return <span className="text-yellow-600 font-semibold">{stock} (Low)</span>
                      } else {
                        return <span className="text-gray-700">{stock}</span>
                      }
                    })()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {!isReadOnly && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {isReadOnly && (
                      <span className="text-gray-400 text-xs">Read Only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Stock Level *</label>
                  <input
                    type="number"
                    required
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Alert when stock reaches this level"
                  />
                  <p className="text-xs text-gray-500 mt-1">Required - Product will show red alert in POS when stock reaches this level</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setProductToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        danger={true}
      />
    </div>
  )
}

export default Products

