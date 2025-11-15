import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { getServiceIcon, getServiceIconColor } from '../utils/serviceIcons'

const POS = () => {
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { user } = useAuth()
  const isReadOnly = user?.role === 'manager'

  useEffect(() => {
    fetchProducts()
    fetchServices()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const res = await api.get('/services')
      setServices(res.data)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const addToCart = (item, type) => {
    // Check if it's a product and if stock is available
    if (type === 'product') {
      const stock = item.stockQuantity ?? item.stock_quantity ?? 0
      if (stock <= 0) {
        toast.error(`${item.name} is out of stock`)
        return
      }
      
      // Check if adding this item would exceed available stock
      const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id && cartItem.type === type)
      const currentQuantity = existingItemIndex > -1 ? cart[existingItemIndex].quantity : 0
      if (currentQuantity + 1 > stock) {
        toast.error(`Only ${stock} ${item.name} available in stock`)
        return
      }
    }
    
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id && cartItem.type === type)
    if (existingItemIndex > -1) {
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += 1
      setCart(updatedCart)
    } else {
      setCart([...cart, { ...item, type, quantity: 1 }])
    }
  }

  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }
    
    // Check stock if it's a product
    const cartItem = cart[index]
    if (cartItem.type === 'product') {
      const product = products.find(p => p.id === cartItem.id)
      const stock = product?.stockQuantity ?? product?.stock_quantity ?? 0
      if (product && quantity > stock) {
        toast.error(`Only ${stock} ${product.name} available in stock`)
        return
      }
    }
    
    const newCart = [...cart]
    newCart[index].quantity = quantity
    setCart(newCart)
  }

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setLoading(true)
    try {
      await api.post('/sales/checkout', {
        items: cart,
        paymentMethod,
        total: getTotal()
      })
      setCart([])
      toast.success('Transaction completed successfully!')
    } catch (error) {
      toast.error('Error processing transaction: ' + (error.response?.data?.message || error.message))
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-gray-800">Point of Sale</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Products</h3>
                <div className="grid grid-cols-4 gap-4">
                  {filteredProducts.map(product => {
                    // Handle both camelCase (from Prisma) and snake_case formats
                    const stock = product.stockQuantity ?? product.stock_quantity ?? 0
                    const minStock = product.minStockLevel ?? product.min_stock_level ?? 0
                    // Only show out of stock when stock is exactly 0 or negative
                    const isOutOfStock = stock <= 0
                    // Low stock: stock is above 0 but at or below minimum level
                    const isLowStock = stock > 0 && stock <= minStock
                    const isDisabled = isReadOnly || isOutOfStock
                    
                    return (
                      <button
                        key={product.id}
                        onClick={() => !isDisabled && addToCart(product, 'product')}
                        disabled={isDisabled}
                        className={`p-4 bg-white border-2 rounded-lg transition-all text-left ${
                          isOutOfStock
                            ? 'border-red-500 bg-red-50 opacity-75 cursor-not-allowed'
                            : isLowStock
                            ? 'border-red-400 bg-red-50 hover:border-red-500 hover:shadow-md'
                            : isReadOnly
                            ? 'border-gray-200 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-primary-500 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-primary-600 font-semibold mt-1">{formatCurrency(product.price)}</p>
                        <p className={`text-xs mt-1 font-medium ${
                          isOutOfStock
                            ? 'text-red-600'
                            : isLowStock
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                        }`}>
                          {isOutOfStock ? `Out of Stock (${stock})` : `Stock: ${stock}`}
                          {isLowStock && !isOutOfStock && ' ⚠️ Low'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Services</h3>
            <div className="grid grid-cols-2 gap-4">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => !isReadOnly && addToCart(service, 'service')}
                  disabled={isReadOnly}
                  className={`p-4 bg-white border border-gray-200 rounded-lg transition-all text-left flex items-center gap-3 ${
                    isReadOnly 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:border-accent-500 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className={`flex-shrink-0 ${getServiceIconColor(service.name)}`}>
                    {getServiceIcon(service.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{service.name}</p>
                    <p className="text-accent-600 font-semibold mt-1">{formatCurrency(service.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Cart</h3>
          
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                      >-</button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                      >+</button>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >×</button>
                    </div>
                    <p className="ml-4 font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary-600">{formatCurrency(getTotal())}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading || isReadOnly}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {isReadOnly ? 'Read Only - Cannot Process Sales' : loading ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default POS

