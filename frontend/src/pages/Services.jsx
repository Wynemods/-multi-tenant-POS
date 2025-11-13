import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useToast } from '../context/ToastContext'
import ConfirmModal from '../components/ConfirmModal'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { getServiceIcon, getServiceIconColor } from '../utils/serviceIcons'

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-gray-800">Services</h2>
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
            className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 text-sm font-medium"
          >
            + Add Service
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 border-b-2 border-gray-300">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200 w-16">Icon</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Service Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Description</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Price</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-200">Duration</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">
                  No services found. {!isReadOnly && 'Click "Add Service" to create your first service.'}
                </td>
              </tr>
            ) : (
              services.map((service, index) => (
                <tr key={service.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                    <div className={`flex items-center justify-center ${getServiceIconColor(service.name)}`}>
                      {getServiceIcon(service.name)}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-sm border-r border-gray-200">
                    {service.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-200 max-w-xs truncate" title={service.description || 'No description'}>
                    {service.description || <span className="text-gray-400 italic">No description</span>}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-accent-600 border-r border-gray-200">
                    {formatCurrency(service.price)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                    {service.duration_minutes ? `${service.duration_minutes} min` : '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {!isReadOnly && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
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

