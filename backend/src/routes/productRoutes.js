import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, authorize, setShopDb } from '../middleware/auth.js'
import { blockManagerWrites } from '../middleware/readOnly.js'
import { getEATDateTime } from '../utils/timezone.js'

const router = express.Router()

// All routes require authentication and shop database
router.use(authenticate, setShopDb)

// Get all products
router.get('/', (req, res) => {
  try {
    const products = req.db.prepare('SELECT * FROM products ORDER BY name').all()
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' })
  }
})

// Get single product
router.get('/:id', (req, res) => {
  try {
    const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product' })
  }
})

// Create product (admin and cashier only, manager blocked)
router.post('/', authorize('admin', 'manager', 'cashier'), blockManagerWrites, (req, res) => {
  try {
    const { name, barcode, category, price, cost_price, stock_quantity, min_stock_level, unit } = req.body
    
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' })
    }
    
    if (min_stock_level === undefined || min_stock_level === null || min_stock_level === '') {
      return res.status(400).json({ message: 'Minimum stock level is required' })
    }
    
    const minStockNum = parseInt(min_stock_level)
    if (isNaN(minStockNum) || minStockNum < 0) {
      return res.status(400).json({ message: 'Minimum stock level must be a valid non-negative number' })
    }
    
    const id = uuidv4()
    const createdAt = getEATDateTime()
    const priceNum = parseFloat(price)
    const stockQuantityNum = parseInt(stock_quantity) || 0
    req.db.prepare(`
      INSERT INTO products (id, name, barcode, category, price, cost_price, stock_quantity, min_stock_level, unit, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, barcode || null, category || null, priceNum, cost_price || null, stockQuantityNum, minStockNum, unit || 'piece', createdAt, createdAt)
    
    const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(id)
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message })
  }
})

// Update product (admin and cashier only, manager blocked)
router.put('/:id', authorize('admin', 'manager', 'cashier'), blockManagerWrites, (req, res) => {
  try {
    const { name, barcode, category, price, cost_price, stock_quantity, min_stock_level, unit } = req.body
    
        const updatedAt = getEATDateTime()
        req.db.prepare(`
          UPDATE products 
          SET name = ?, barcode = ?, category = ?, price = ?, cost_price = ?, 
              stock_quantity = ?, min_stock_level = ?, unit = ?, updated_at = ?
          WHERE id = ?
        `).run(name, barcode || null, category || null, priceNum, cost_price || null, 
               stockQuantityNum, min_stock_level || 0, unit || 'piece', updatedAt, req.params.id)
    
    const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' })
  }
})

// Delete product (admin only)
router.delete('/:id', authorize('admin'), (req, res) => {
  try {
    req.db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' })
  }
})

// Get low stock products
router.get('/low-stock', (req, res) => {
  try {
    const products = req.db.prepare(`
      SELECT * FROM products 
      WHERE stock_quantity <= min_stock_level 
      ORDER BY stock_quantity ASC
    `).all()
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock products' })
  }
})

export default router

