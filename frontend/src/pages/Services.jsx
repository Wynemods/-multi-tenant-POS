import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

const Services = () => {
  const [services, setServices] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)
  const [editingService, setEditingService] = useState(null)
  const toast = useToast()
  const { user } = useAuth()
  const isReadOnly = user?.role === 'manager'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    is_active: true
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const res = await api.get('/services')
      setServices(res.data)
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Prepare data with proper types
      const submitData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        is_active: formData.is_active !== undefined ? formData.is_active : true
      }

      if (!submitData.name || !submitData.price || isNaN(submitData.price)) {
        toast.error('Name and valid price are required')
        return
      }

      if (editingService) {
        await api.put(`/services/${editingService.id}`, submitData)
      } else {
        await api.post('/services', submitData)
      }
      setShowModal(false)
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
        is_active: true
      })
      fetchServices()
      toast.success(editingService ? 'Service updated successfully!' : 'Service created successfully!')
    } catch (error) {
      console.error('Service error:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error saving service'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration_minutes: service.duration_minutes || '',
      is_active: service.is_active
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    setServiceToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!serviceToDelete) return
    try {
      await api.delete(`/services/${serviceToDelete}`)
      fetchServices()
      toast.success('Service deleted successfully!')
      setServiceToDelete(null)
    } catch (error) {
      toast.error('Error deleting service: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-gray-800">Services</h2>
        {!isReadOnly && (
          <button
            onClick={() => {
              setEditingService(null)
              setFormData({
                name: '',
                description: '',
                price: '',
                duration_minutes: '',
                is_active: true
              })
              setShowModal(true)
            }}
            className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
          >
            + Add Service
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{service.description || 'No description'}</p>
            <p className="text-accent-600 font-bold text-xl mb-4">{formatCurrency(service.price)}</p>
            {!isReadOnly && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            )}
            {isReadOnly && (
              <p className="text-xs text-gray-400 text-center">Read Only</p>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">{editingService ? 'Edit Service' : 'Add Service'}</h3>
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
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                />
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
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-accent-600 text-white py-2 rounded-lg hover:bg-accent-700"
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
          setServiceToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        danger={true}
      />
    </div>
  )
}

export default Services

