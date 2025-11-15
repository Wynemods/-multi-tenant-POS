import express from 'express'
import { authenticate, setShopDb } from '../middleware/auth.js'
import { getEATDateObject } from '../utils/timezone.js'

const router = express.Router()

router.use(authenticate, setShopDb)

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    // Get today's date in EAT timezone
    const now = getEATDateObject()
    const today = new Date(now)
    today.setUTCHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    
    // Today's sales
    const todaySalesResult = await req.prisma.transaction.aggregate({
      where: {
        shopId: req.shopId,
        status: 'completed',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        totalAmount: true
      }
    })
    const todaySales = todaySalesResult._sum.totalAmount || 0
    
    // Total transactions
    const totalTransactions = await req.prisma.transaction.count({
      where: { shopId: req.shopId }
    })
    
    // Low stock count - use raw query since Prisma doesn't support column comparison
    const lowStockResult = await req.prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM products
      WHERE shop_id = ${req.shopId}
      AND stock_quantity <= min_stock_level
    `
    const lowStockCount = lowStockResult[0]?.count || 0
    
    // Total products
    const totalProducts = await req.prisma.product.count({
      where: { shopId: req.shopId }
    })
    
    // Top products - use raw query for aggregation with joins
    const topProducts = await req.prisma.$queryRaw`
      SELECT 
        p.name,
        SUM(ti.quantity)::int as quantity_sold,
        SUM(ti.subtotal)::decimal as total_revenue
      FROM transaction_items ti
      JOIN products p ON ti.item_id = p.id AND p.shop_id = ${req.shopId}
      JOIN transactions t ON ti.transaction_id = t.id AND t.shop_id = ${req.shopId}
      WHERE ti.item_type = 'product'
      GROUP BY p.id, p.name
      ORDER BY quantity_sold DESC
      LIMIT 10
    `
    
    // Recent transactions
    const recentTransactions = await req.prisma.transaction.findMany({
      where: { shopId: req.shopId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    // Total revenue (all time)
    const totalRevenueResult = await req.prisma.transaction.aggregate({
      where: {
        shopId: req.shopId,
        status: 'completed'
      },
      _sum: {
        totalAmount: true
      }
    })
    const totalRevenue = totalRevenueResult._sum.totalAmount || 0
    
    // Average transaction value
    const avgTransactionValue = totalTransactions > 0 ? Number(totalRevenue) / totalTransactions : 0
    
    // Payment method breakdown
    const paymentMethods = await req.prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: { shopId: req.shopId },
      _count: { paymentMethod: true },
      _sum: { totalAmount: true }
    })
    
    // Sales by day (last 7 days)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
    
    const dailySales = await req.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as transaction_count,
        SUM(total_amount)::decimal as revenue
      FROM transactions
      WHERE shop_id = ${req.shopId}
        AND status = 'completed'
        AND created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `
    
    res.json({
      today_sales: Number(todaySales),
      total_transactions: totalTransactions,
      low_stock_count: lowStockCount,
      total_products: totalProducts,
      total_revenue: Number(totalRevenue),
      avg_transaction_value: avgTransactionValue,
      top_products: topProducts.map(p => ({
        name: p.name,
        quantity_sold: Number(p.quantity_sold),
        total_revenue: Number(p.total_revenue)
      })),
      recent_transactions: recentTransactions,
      payment_methods: paymentMethods.map(pm => ({
        method: pm.paymentMethod,
        count: pm._count.paymentMethod,
        total: Number(pm._sum.totalAmount || 0)
      })),
      daily_sales: dailySales.map(ds => ({
        date: ds.date.toISOString().split('T')[0],
        transaction_count: Number(ds.transaction_count),
        revenue: Number(ds.revenue)
      }))
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ message: 'Error fetching dashboard data' })
  }
})

export default router

