import Modal from './Modal'

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="space-y-4">
        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        {message && <p className="text-gray-600">{message}</p>}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              danger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal

