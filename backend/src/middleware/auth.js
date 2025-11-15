import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma.js'

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    req.shopId = decoded.shopId
    
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    
    next()
  }
}

// Middleware to set Prisma client with shop context
export const setShopDb = async (req, res, next) => {
  try {
    if (req.shopId) {
      // Verify shop exists
      const shop = await prisma.shop.findUnique({
        where: { id: req.shopId }
      })
      
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' })
      }
      
      // Set Prisma client on request (all queries will need shopId filter)
      req.prisma = prisma
      req.shopId = req.shopId // Ensure shopId is available
    }
    next()
  } catch (error) {
    console.error('setShopDb error:', error)
    return res.status(400).json({ message: 'Invalid shop' })
  }
}

