import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, authorize, setShopDb } from '../middleware/auth.js'
import { blockManagerWrites } from '../middleware/readOnly.js'
import { getEATDateTime, getEATDateObject } from '../utils/timezone.js'

const router = express.Router()

router.use(authenticate, setShopDb)

// Restock product (admin only, manager blocked)
router.post('/restock', authorize('admin', 'manager'), blockManagerWrites, async (req, res) => {
  try {
    const { product_id, quantity } = req.body
    
    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' })
    }
    
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' })
    }
    
    // Use transaction to ensure consistency
    const result = await req.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: product_id,
          shopId: req.shopId
        }
      })
      
      if (!product) {
        throw new Error('Product not found')
      }
      
      const previousStock = product.stockQuantity
      const newStock = previousStock + quantityNum
      
      // Update stock
      await tx.product.update({
        where: { id: product_id },
        data: { stockQuantity: newStock }
      })
      
      // Log inventory change
      const logId = uuidv4()
      const logCreatedAt = getEATDateObject() // Use EAT timezone
      await tx.inventoryLog.create({
        data: {
          id: logId,
          shopId: req.shopId,
          productId: product_id,
          changeType: 'restock',
          quantityChange: quantityNum,
          previousStock: previousStock,
          newStock: newStock,
          userId: req.user.userId,
          createdAt: logCreatedAt
        }
      })
      
      return { newStock }
    })
    
    res.json({ message: 'Stock updated successfully', newStock: result.newStock })
  } catch (error) {
    console.error('Error updating stock:', error)
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.status(500).json({ message: 'Error updating stock' })
  }
})

// Get inventory logs
router.get('/logs', authorize('admin', 'manager'), async (req, res) => {
  try {
    const logs = await req.prisma.inventoryLog.findMany({
      where: { shopId: req.shopId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    })
    
    // Format response to match expected structure
    const formattedLogs = logs.map(log => ({
      ...log,
      product_name: log.product?.name || null
    }))
    
    res.json(formattedLogs)
  } catch (error) {
    console.error('Error fetching inventory logs:', error)
    res.status(500).json({ message: 'Error fetching inventory logs' })
  }
})

export default router

