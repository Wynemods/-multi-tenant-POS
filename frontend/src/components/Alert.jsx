import { useState, useEffect } from 'react'

const Alert = ({ type = 'success', message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`transform transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}>
      <div className={`${styles[type]} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md`}>
        <span className="text-xl font-bold">{icons[type]}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => onClose(), 300)
            }}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert

