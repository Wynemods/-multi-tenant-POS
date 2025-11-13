import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, authorize, setShopDb } from '../middleware/auth.js'
import { blockManagerWrites } from '../middleware/readOnly.js'
import { getEATDateTime } from '../utils/timezone.js'

const router = express.Router()

router.use(authenticate, setShopDb)

// Restock product (admin only, manager blocked)
router.post('/restock', authorize('admin', 'manager'), blockManagerWrites, (req, res) => {
  try {
    const { product_id, quantity } = req.body
    
    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' })
    }
    
    const product = req.db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(product_id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    
    const previousStock = product.stock_quantity
    const newStock = previousStock + quantity
    
    // Update stock
    req.db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newStock, product_id)
    
    // Log inventory change
    const logId = uuidv4()
    const logCreatedAt = getEATDateTime()
    req.db.prepare(`
      INSERT INTO inventory_logs (id, product_id, change_type, quantity_change, previous_stock, new_stock, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(logId, product_id, 'restock', quantity, previousStock, newStock, req.user.userId, logCreatedAt)
    
    res.json({ message: 'Stock updated successfully', newStock })
  } catch (error) {
    res.status(500).json({ message: 'Error updating stock' })
  }
})

// Get inventory logs
router.get('/logs', authorize('admin', 'manager'), (req, res) => {
  try {
    const logs = req.db.prepare(`
      SELECT il.*, p.name as product_name
      FROM inventory_logs il
      LEFT JOIN products p ON il.product_id = p.id
      ORDER BY il.created_at DESC
      LIMIT 100
    `).all()
    res.json(logs)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory logs' })
  }
})

export default router

