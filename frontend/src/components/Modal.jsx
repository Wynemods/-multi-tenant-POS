import { useEffect } from 'react'

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all ${className}`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-display font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal

