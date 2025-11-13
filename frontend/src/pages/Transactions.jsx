import { useState, useEffect } from 'react'
import api from '../utils/api'
import { formatCurrency, formatDate } from '../utils/formatters'

// Payment method icons
const getPaymentIcon = (method) => {
  const methodLower = method?.toLowerCase() || ''
  
  if (methodLower.includes('cash')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
  if (methodLower.includes('card')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  }
  if (methodLower.includes('mobile') || methodLower.includes('mpesa')) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-800">Transactions</h2>
          <p className="text-sm text-gray-500 mt-1">View all sales transactions and receipts</p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Transaction #</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Date & Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Total Amount</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Payment Method</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    <span className="text-sm">Loading transactions...</span>
                  </div>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium">No transactions found</p>
                    <p className="text-xs text-gray-400">Transactions will appear here after sales are processed</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => (
                <tr key={transaction.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                    <span className="font-mono font-semibold text-sm text-primary-600">{transaction.transaction_number}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                    {formatDate(transaction.created_at)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 border-r border-gray-200">
                    {formatCurrency(transaction.total_amount)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{getPaymentIcon(transaction.payment_method)}</span>
                      <span className="text-sm font-medium capitalize text-gray-700">{transaction.payment_method}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      transaction.status === 'completed' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : transaction.status === 'cancelled' 
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {transaction.status === 'completed' && (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium px-3 py-1 rounded hover:bg-primary-50 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTransaction(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Transaction Receipt</h3>
                  <p className="text-sm text-white/90 mt-1">Transaction #{selectedTransaction.transaction_number}</p>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Transaction Info */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date & Time</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedTransaction.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{getPaymentIcon(selectedTransaction.payment_method)}</span>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{selectedTransaction.payment_method}</p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Items Purchased</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 uppercase">
                      <div className="col-span-6">Item</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2 text-right">Subtotal</div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {selectedTransaction.items?.map((item, index) => (
                        <div key={index} className="px-4 py-3 grid grid-cols-12 gap-2 hover:bg-gray-50 transition-colors">
                          <div className="col-span-6">
                            <p className="font-medium text-sm text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{item.item_type || item.type}</p>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm text-gray-600">{formatCurrency(item.unit_price)}</span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-600">{formatCurrency(selectedTransaction.total_amount)}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center pt-2">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedTransaction.status === 'completed' 
                      ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                      : selectedTransaction.status === 'cancelled' 
                      ? 'bg-red-100 text-red-800 border-2 border-red-300'
                      : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                  }`}>
                    {selectedTransaction.status === 'completed' && (
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {selectedTransaction.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions

