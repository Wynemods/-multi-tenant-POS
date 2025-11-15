import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, setShopDb } from '../middleware/auth.js'
import { blockManagerWrites } from '../middleware/readOnly.js'
import { getEATDateTime, getEATDateObject } from '../utils/timezone.js'

const router = express.Router()

router.use(authenticate, setShopDb)

// Checkout - Create transaction (manager blocked)
router.post('/checkout', blockManagerWrites, async (req, res) => {
  try {
    const { items, paymentMethod, total } = req.body
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }
    
    // Validate stock availability for products
    for (const item of items) {
      if (item.type === 'product') {
        const product = await req.prisma.product.findFirst({
          where: {
            id: item.id,
            shopId: req.shopId
          }
        })
        if (!product) {
          return res.status(404).json({ message: `Product ${item.id} not found` })
        }
        if (product.stockQuantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for product. Available: ${product.stockQuantity}, Requested: ${item.quantity}` 
          })
        }
        if (product.stockQuantity <= 0) {
          return res.status(400).json({ message: 'Product is out of stock' })
        }
      }
    }
    
    const transactionId = uuidv4()
    const transactionNumber = `TXN-${Date.now()}`
    const createdAt = getEATDateObject() // Use EAT timezone
    const itemCreatedAt = getEATDateObject()
    const inventoryLogCreatedAt = getEATDateObject()
    
    // Create transaction, items, update inventory, and create logs in a single transaction
    const transaction = await req.prisma.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          id: transactionId,
          shopId: req.shopId,
          transactionNumber: transactionNumber,
          userId: req.user.userId,
          totalAmount: parseFloat(total),
          paymentMethod: paymentMethod,
          status: 'completed',
          createdAt: createdAt
        }
      })
      
      // Create transaction items and update inventory
      const transactionItems = []
      for (const item of items) {
        const itemId = uuidv4()
        const subtotal = item.price * item.quantity
        
        // Create transaction item
        await tx.transactionItem.create({
          data: {
            id: itemId,
            transactionId: transactionId,
            itemType: item.type,
            itemId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: subtotal,
            createdAt: itemCreatedAt
          }
        })
        
        // Update stock if it's a product
        if (item.type === 'product') {
          const product = await tx.product.findFirst({
            where: {
              id: item.id,
              shopId: req.shopId
            }
          })
          
          if (product) {
            const previousStock = product.stockQuantity
            const newStock = Math.max(0, previousStock - item.quantity) // Prevent negative stock
            
            // Update product stock
            await tx.product.update({
              where: { id: item.id },
              data: { stockQuantity: newStock }
            })
            
            // Create inventory log
            const logId = uuidv4()
            await tx.inventoryLog.create({
              data: {
                id: logId,
                shopId: req.shopId,
                productId: item.id,
                transactionId: transactionId,
                changeType: 'sale',
                quantityChange: -item.quantity,
                previousStock: previousStock,
                newStock: newStock,
                userId: req.user.userId,
                createdAt: inventoryLogCreatedAt
              }
            })
          }
        }
        
        // Get item name for response
        let itemName = ''
        if (item.type === 'product') {
          const product = await tx.product.findFirst({ where: { id: item.id } })
          itemName = product?.name || 'Unknown Product'
        } else {
          const service = await tx.service.findFirst({ where: { id: item.id } })
          itemName = service?.name || 'Unknown Service'
        }
        
        transactionItems.push({
          id: itemId,
          name: itemName,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: subtotal
        })
      }
      
      return {
        ...newTransaction,
        items: transactionItems
      }
    })
    
    res.status(201).json(transaction)
  } catch (error) {
    console.error('Checkout error:', error)
    res.status(500).json({ message: 'Error processing transaction', error: error.message })
  }
})

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await req.prisma.transaction.findMany({
      where: { shopId: req.shopId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        items: true
      }
    })
    
    // Get item names for each transaction item
    const transactionsWithItems = await Promise.all(
      transactions.map(async (transaction) => {
        const itemsWithNames = await Promise.all(
          transaction.items.map(async (item) => {
            let name = 'Unknown'
            if (item.itemType === 'product') {
              const product = await req.prisma.product.findFirst({
                where: { id: item.itemId, shopId: req.shopId }
              })
              name = product?.name || 'Unknown Product'
            } else {
              const service = await req.prisma.service.findFirst({
                where: { id: item.itemId, shopId: req.shopId }
              })
              name = service?.name || 'Unknown Service'
            }
            return {
              ...item,
              name: name
            }
          })
        )
        return {
          ...transaction,
          items: itemsWithNames
        }
      })
    )
    
    res.json(transactionsWithItems)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({ message: 'Error fetching transactions' })
  }
})

// Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await req.prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        shopId: req.shopId
      },
      include: {
        items: true
      }
    })
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' })
    }
    
    // Get item names
    const itemsWithNames = await Promise.all(
      transaction.items.map(async (item) => {
        let name = 'Unknown'
        if (item.itemType === 'product') {
          const product = await req.prisma.product.findFirst({
            where: { id: item.itemId, shopId: req.shopId }
          })
          name = product?.name || 'Unknown Product'
        } else {
          const service = await req.prisma.service.findFirst({
            where: { id: item.itemId, shopId: req.shopId }
          })
          name = service?.name || 'Unknown Service'
        }
        return {
          ...item,
          name: name
        }
      })
    )
    
    res.json({
      ...transaction,
      items: itemsWithNames
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    res.status(500).json({ message: 'Error fetching transaction' })
  }
})

export default router

