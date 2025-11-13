import jwt from 'jsonwebtoken'
import { getShopDb } from '../config/database.js'

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

// Middleware to set shop database connection
export const setShopDb = (req, res, next) => {
  try {
    if (req.shopId) {
      req.db = getShopDb(req.shopId)
    }
    next()
  } catch (error) {
    return res.status(400).json({ message: 'Invalid shop' })
  }
}

