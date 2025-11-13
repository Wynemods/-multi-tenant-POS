import { useState } from 'react'
import Modal from './Modal'

const ShopIdModal = ({ isOpen, onClose, shopId }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shopId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registration Successful!">
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your Shop ID has been generated. Please save it for login.</p>
          
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 rounded-xl p-6 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop ID</label>
            <div className="flex items-center justify-center gap-3">
              <code className="text-3xl font-display font-bold text-primary-700 tracking-wider bg-white px-4 py-2 rounded-lg border-2 border-primary-300">
                {shopId}
              </code>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Important:</strong> Save this Shop ID. You'll need it along with your email and password to login.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Continue to Login
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ShopIdModal

