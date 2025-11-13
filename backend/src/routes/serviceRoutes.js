import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, authorize, setShopDb } from '../middleware/auth.js'
import { blockManagerWrites } from '../middleware/readOnly.js'
import { getEATDateTime } from '../utils/timezone.js'

const router = express.Router()

router.use(authenticate, setShopDb)

// Get all services
router.get('/', (req, res) => {
  try {
    const services = req.db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY name').all()
    res.json(services)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services' })
  }
})

// Get single service
router.get('/:id', (req, res) => {
  try {
    const service = req.db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)
    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }
    res.json(service)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service' })
  }
})

// Create service (admin and cashier only, manager blocked)
router.post('/', authorize('admin', 'manager', 'cashier'), blockManagerWrites, (req, res) => {
  try {
    const { name, description, price, duration_minutes, is_active } = req.body
    
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Name and price are required' })
    }
    
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' })
    }
    
    if (!req.db) {
      console.error('Database connection not available')
      return res.status(500).json({ message: 'Database connection error' })
    }
    
    const id = uuidv4()
    const duration = duration_minutes ? parseInt(duration_minutes) : null
    const active = is_active !== undefined ? (is_active ? 1 : 0) : 1
    const createdAt = getEATDateTime()
    
    req.db.prepare(`
      INSERT INTO services (id, name, description, price, duration_minutes, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || null, priceNum, duration, active, createdAt)
    
    const service = req.db.prepare('SELECT * FROM services WHERE id = ?').get(id)
    res.status(201).json(service)
  } catch (error) {
    console.error('Error creating service:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    res.status(500).json({ 
      message: 'Error creating service', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// Update service (admin and cashier only, manager blocked)
router.put('/:id', authorize('admin', 'manager', 'cashier'), blockManagerWrites, (req, res) => {
  try {
    const { name, description, price, duration_minutes, is_active } = req.body
    
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Name and price are required' })
    }
    
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' })
    }
    
    if (!req.db) {
      console.error('Database connection not available')
      return res.status(500).json({ message: 'Database connection error' })
    }
    
    const duration = duration_minutes ? parseInt(duration_minutes) : null
    const active = is_active !== undefined ? (is_active ? 1 : 0) : 1
    
    req.db.prepare(`
      UPDATE services 
      SET name = ?, description = ?, price = ?, duration_minutes = ?, is_active = ?
      WHERE id = ?
    `).run(name, description || null, priceNum, duration, active, req.params.id)
    
    const service = req.db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)
    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }
    res.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    res.status(500).json({ message: 'Error updating service', error: error.message })
  }
})

// Delete service (admin only)
router.delete('/:id', authorize('admin'), (req, res) => {
  try {
    req.db.prepare('UPDATE services SET is_active = 0 WHERE id = ?').run(req.params.id)
    res.json({ message: 'Service deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service' })
  }
})

export default router

