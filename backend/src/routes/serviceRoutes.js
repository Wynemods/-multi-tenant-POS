import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, authorize, setShopDb } from '../middleware/auth.js'
import { blockManagerWrites } from '../middleware/readOnly.js'
import { getEATDateTime, getEATDateObject } from '../utils/timezone.js'

const router = express.Router()

router.use(authenticate, setShopDb)

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await req.prisma.service.findMany({
      where: {
        shopId: req.shopId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })
    res.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    res.status(500).json({ message: 'Error fetching services' })
  }
})

// Get single service
router.get('/:id', async (req, res) => {
  try {
    const service = await req.prisma.service.findFirst({
      where: {
        id: req.params.id,
        shopId: req.shopId
      }
    })
    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }
    res.json(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    res.status(500).json({ message: 'Error fetching service' })
  }
})

// Create service (admin and cashier only, manager blocked)
router.post('/', authorize('admin', 'manager', 'cashier'), blockManagerWrites, async (req, res) => {
  try {
    const { name, description, price, duration_minutes, is_active } = req.body
    
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Name and price are required' })
    }
    
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' })
    }
    
    const id = uuidv4()
    const duration = duration_minutes ? parseInt(duration_minutes) : null
    const active = is_active !== undefined ? is_active : true
    const createdAt = getEATDateObject() // Use EAT timezone
    
    const service = await req.prisma.service.create({
      data: {
        id: id,
        shopId: req.shopId,
        name: name,
        description: description || null,
        price: priceNum,
        durationMinutes: duration,
        isActive: active,
        createdAt: createdAt
      }
    })
    
    res.status(201).json(service)
  } catch (error) {
    console.error('Error creating service:', error)
    res.status(500).json({ 
      message: 'Error creating service', 
      error: error.message
    })
  }
})

// Update service (admin and cashier only, manager blocked)
router.put('/:id', authorize('admin', 'manager', 'cashier'), blockManagerWrites, async (req, res) => {
  try {
    const { name, description, price, duration_minutes, is_active } = req.body
    
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Name and price are required' })
    }
    
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' })
    }
    
    // Check if service exists and belongs to shop
    const existingService = await req.prisma.service.findFirst({
      where: {
        id: req.params.id,
        shopId: req.shopId
      }
    })
    
    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' })
    }
    
    const duration = duration_minutes ? parseInt(duration_minutes) : null
    const active = is_active !== undefined ? is_active : existingService.isActive
    
    const service = await req.prisma.service.update({
      where: { id: req.params.id },
      data: {
        name: name,
        description: description || null,
        price: priceNum,
        durationMinutes: duration,
        isActive: active
      }
    })
    
    res.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    res.status(500).json({ message: 'Error updating service', error: error.message })
  }
})

// Delete service (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    // Check if service exists and belongs to shop
    const service = await req.prisma.service.findFirst({
      where: {
        id: req.params.id,
        shopId: req.shopId
      }
    })
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }
    
    // Soft delete by setting isActive to false
    await req.prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: false }
    })
    
    res.json({ message: 'Service deleted' })
  } catch (error) {
    console.error('Error deleting service:', error)
    res.status(500).json({ message: 'Error deleting service' })
  }
})

export default router

