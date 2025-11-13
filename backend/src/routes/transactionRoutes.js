import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, setShopDb } from '../middleware/auth.js'
import { blockManagerWrites } from '../middleware/readOnly.js'
import { getEATDateTime } from '../utils/timezone.js'

const router = express.Router()

router.use(authenticate, setShopDb)

// Checkout - Create transaction (manager blocked)
router.post('/checkout', blockManagerWrites, (req, res) => {
  try {
    const { items, paymentMethod, total } = req.body
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }
    
    // Validate stock availability for products
    for (const item of items) {
      if (item.type === 'product') {
        const product = req.db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.id)
        if (!product) {
          return res.status(404).json({ message: `Product ${item.id} not found` })
        }
        if (product.stock_quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for product. Available: ${product.stock_quantity}, Requested: ${item.quantity}` 
          })
        }
        if (product.stock_quantity <= 0) {
          return res.status(400).json({ message: 'Product is out of stock' })
        }
      }
    }
    
    const transactionId = uuidv4()
    const transactionNumber = `TXN-${Date.now()}`
    const createdAt = getEATDateTime()
    
    // Create transaction
    req.db.prepare(`
      INSERT INTO transactions (id, transaction_number, user_id, total_amount, payment_method, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(transactionId, transactionNumber, req.user.userId, total, paymentMethod, 'completed', createdAt)
    
    // Create transaction items and update inventory
    const itemCreatedAt = getEATDateTime()
    const insertItem = req.db.prepare(`
      INSERT INTO transaction_items (id, transaction_id, item_type, item_id, quantity, unit_price, subtotal, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const inventoryLogCreatedAt = getEATDateTime()
    const insertInventoryLog = req.db.prepare(`
      INSERT INTO inventory_logs (id, product_id, transaction_id, change_type, quantity_change, previous_stock, new_stock, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    for (const item of items) {
      const itemId = uuidv4()
      insertItem.run(itemId, transactionId, item.type, item.id, item.quantity, item.price, item.price * item.quantity, itemCreatedAt)
      
      // Update stock if it's a product
      if (item.type === 'product') {
        const product = req.db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.id)
        if (product) {
          const previousStock = product.stock_quantity
          const newStock = Math.max(0, previousStock - item.quantity) // Prevent negative stock
          req.db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newStock, item.id)
          
          const logId = uuidv4()
          insertInventoryLog.run(logId, item.id, transactionId, 'sale', -item.quantity, previousStock, newStock, req.user.userId, inventoryLogCreatedAt)
        }
      }
    }
    
    const transaction = req.db.prepare(`
      SELECT t.*, 
             json_group_array(json_object('id', ti.id, 'name', 
               CASE WHEN ti.item_type = 'product' THEN p.name ELSE s.name END,
               'quantity', ti.quantity, 'unit_price', ti.unit_price, 'subtotal', ti.subtotal)) as items
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN products p ON ti.item_type = 'product' AND ti.item_id = p.id
      LEFT JOIN services s ON ti.item_type = 'service' AND ti.item_id = s.id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(transactionId)
    
    // Parse items JSON
    transaction.items = JSON.parse(transaction.items || '[]')
    
    res.status(201).json(transaction)
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ message: 'Error processing transaction', error: error.message })
  }
})

// Get all transactions
router.get('/', (req, res) => {
  try {
    const transactions = req.db.prepare(`
      SELECT * FROM transactions 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all()
    
    // Get items for each transaction
    for (const transaction of transactions) {
      const items = req.db.prepare(`
        SELECT ti.*, 
               CASE WHEN ti.item_type = 'product' THEN p.name ELSE s.name END as name
        FROM transaction_items ti
        LEFT JOIN products p ON ti.item_type = 'product' AND ti.item_id = p.id
        LEFT JOIN services s ON ti.item_type = 'service' AND ti.item_id = s.id
        WHERE ti.transaction_id = ?
      `).all(transaction.id)
      transaction.items = items
    }
    
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' })
  }
})

// Get single transaction
router.get('/:id', (req, res) => {
  try {
    const transaction = req.db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id)
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' })
    }
    
    const items = req.db.prepare(`
      SELECT ti.*, 
             CASE WHEN ti.item_type = 'product' THEN p.name ELSE s.name END as name
      FROM transaction_items ti
      LEFT JOIN products p ON ti.item_type = 'product' AND ti.item_id = p.id
      LEFT JOIN services s ON ti.item_type = 'service' AND ti.item_id = s.id
      WHERE ti.transaction_id = ?
    `).all(transaction.id)
    
    transaction.items = items
    res.json(transaction)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction' })
  }
})

export default router

