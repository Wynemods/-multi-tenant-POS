import { useState, useEffect } from 'react'
import api from '../utils/api'
import { formatCurrency, formatDate } from '../utils/formatters'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/sales')
      setTransactions(res.data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
    setLoading(false)
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-gray-800">Transactions</h2>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No transactions found</td>
              </tr>
            ) : (
              transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{transaction.transaction_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(transaction.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{formatCurrency(transaction.total_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">{transaction.payment_method}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Transaction Details</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Transaction Number</p>
                <p className="font-semibold">{selectedTransaction.transaction_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">{formatDate(selectedTransaction.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-semibold capitalize">{selectedTransaction.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedTransaction.items?.map((item, index) => (
                    <div key={index} className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-4 border-t">
                <span>Total:</span>
                <span className="text-primary-600">{formatCurrency(selectedTransaction.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions

