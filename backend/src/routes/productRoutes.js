import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, authorize, setShopDb } from '../middleware/auth.js'
import { blockManagerWrites } from '../middleware/readOnly.js'
import { getEATDateTime, getEATDateObject } from '../utils/timezone.js'

const router = express.Router()

// All routes require authentication and shop database
router.use(authenticate, setShopDb)

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await req.prisma.product.findMany({
      where: { shopId: req.shopId },
      orderBy: { name: 'asc' }
    })
    res.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ message: 'Error fetching products' })
  }
})

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await req.prisma.product.findFirst({
      where: {
        id: req.params.id,
        shopId: req.shopId
      }
    })
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ message: 'Error fetching product' })
  }
})

// Create product (admin and cashier only, manager blocked)
router.post('/', authorize('admin', 'manager', 'cashier'), blockManagerWrites, async (req, res) => {
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
    const createdAt = getEATDateObject() // Use EAT timezone
    const priceNum = parseFloat(price)
    const stockQuantityNum = parseInt(stock_quantity) || 0
    
    const product = await req.prisma.product.create({
      data: {
        id: id,
        shopId: req.shopId,
        name: name,
        barcode: barcode || null,
        category: category || null,
        price: priceNum,
        costPrice: cost_price ? parseFloat(cost_price) : null,
        stockQuantity: stockQuantityNum,
        minStockLevel: minStockNum,
        unit: unit || 'piece',
        createdAt: createdAt,
        updatedAt: createdAt
      }
    })
    
    res.status(201).json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Product with this barcode already exists' })
    }
    res.status(500).json({ message: 'Error creating product', error: error.message })
  }
})

// Update product (admin and cashier only, manager blocked)
router.put('/:id', authorize('admin', 'manager', 'cashier'), blockManagerWrites, async (req, res) => {
  try {
    const { name, barcode, category, price, cost_price, stock_quantity, min_stock_level, unit } = req.body
    
    // Check if product exists and belongs to shop
    const existingProduct = await req.prisma.product.findFirst({
      where: {
        id: req.params.id,
        shopId: req.shopId
      }
    })
    
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' })
    }
    
    const priceNum = parseFloat(price)
    const stockQuantityNum = parseInt(stock_quantity) || existingProduct.stockQuantity
    
    const product = await req.prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: name,
        barcode: barcode || null,
        category: category || null,
        price: priceNum,
        costPrice: cost_price ? parseFloat(cost_price) : null,
        stockQuantity: stockQuantityNum,
        minStockLevel: min_stock_level !== undefined ? parseInt(min_stock_level) : existingProduct.minStockLevel,
        unit: unit || 'piece',
        updatedAt: getEATDateObject() // Use EAT timezone
      }
    })
    
    res.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Product with this barcode already exists' })
    }
    res.status(500).json({ message: 'Error updating product' })
  }
})

// Delete product (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    // Check if product exists and belongs to shop
    const product = await req.prisma.product.findFirst({
      where: {
        id: req.params.id,
        shopId: req.shopId
      }
    })
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    
    await req.prisma.product.delete({
      where: { id: req.params.id }
    })
    
    res.json({ message: 'Product deleted' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ message: 'Error deleting product' })
  }
})

// Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    // Prisma doesn't support comparing two columns directly, so we use raw SQL for this query
    const lowStockProducts = await req.prisma.$queryRaw`
      SELECT * FROM products 
      WHERE shop_id = ${req.shopId} 
      AND stock_quantity <= min_stock_level 
      ORDER BY stock_quantity ASC
    `
    
    res.json(lowStockProducts)
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    res.status(500).json({ message: 'Error fetching low stock products' })
  }
})

export default router

