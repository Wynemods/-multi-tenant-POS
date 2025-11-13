import express from 'express'
import { authenticate, setShopDb } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate, setShopDb)

// Dashboard summary
router.get('/dashboard', (req, res) => {
  try {
    // Today's sales
    const todaySales = req.db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM transactions
      WHERE DATE(created_at) = DATE('now')
      AND status = 'completed'
    `).get()
    
    // Total transactions
    const totalTransactions = req.db.prepare(`
      SELECT COUNT(*) as count FROM transactions
    `).get()
    
    // Low stock count
    const lowStockCount = req.db.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock_quantity <= min_stock_level
    `).get()
    
    // Total products
    const totalProducts = req.db.prepare('SELECT COUNT(*) as count FROM products').get()
    
    // Top products
    const topProducts = req.db.prepare(`
      SELECT p.name, 
             SUM(ti.quantity) as quantity_sold,
             SUM(ti.subtotal) as total_revenue
      FROM transaction_items ti
      JOIN products p ON ti.item_id = p.id
      WHERE ti.item_type = 'product'
      GROUP BY p.id, p.name
      ORDER BY quantity_sold DESC
      LIMIT 10
    `).all()
    
    // Recent transactions
    const recentTransactions = req.db.prepare(`
      SELECT * FROM transactions
      ORDER BY created_at DESC
      LIMIT 10
    `).all()
    
    res.json({
      today_sales: todaySales.total,
      total_transactions: totalTransactions.count,
      low_stock_count: lowStockCount.count,
      total_products: totalProducts.count,
      top_products: topProducts,
      recent_transactions: recentTransactions
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ message: 'Error fetching dashboard data' })
  }
})

export default router

