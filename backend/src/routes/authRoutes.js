import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { registerShop, getShopInfo, getShopDb, getMasterDb } from '../config/database.js'
import { authenticate, setShopDb } from '../middleware/auth.js'
import { generateShopId } from '../utils/shopIdGenerator.js'
import { getEATDateTime } from '../utils/timezone.js'

const router = express.Router()

// Register new user (manager or cashier) to existing shop
router.post('/register', async (req, res) => {
  try {
    const { shopId, name, email, password, role, username } = req.body  // Add username here
    
    if (!shopId || !name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    
    // Verify role is valid
    if (!['cashier', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be cashier or manager' })
    }
    
    // Verify shop exists
    const shopInfo = getShopInfo(shopId)
    if (!shopInfo) {
      return res.status(404).json({ message: 'Shop not found. Please check your Shop ID.' })
    }
    
    // Get shop database
    const shopDb = getShopDb(shopId)
    
    // Check if user already exists with this email (regardless of role)
    const existingUser = shopDb.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (existingUser) {
      shopDb.close()
      return res.status(400).json({ 
        message: 'User with this email already exists in this shop. Please use a different email or contact admin.' 
      })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()
    const createdAt = getEATDateTime()  // Use proper timezone function instead of Date.now()
    
    // Generate username if not provided
    const finalUsername = username || email.split('@')[0]
    
    // Create user in shop database
    try {
      shopDb.prepare(`
        INSERT INTO users (id, username, email, password_hash, name, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, 
        finalUsername,
        email, 
        hashedPassword, 
        name, 
        role, 
        createdAt
      )
    } catch (dbError) {
      shopDb.close()
      if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ 
          message: 'User with this email or username already exists in this shop. Please use different credentials.' 
        })
      }
      throw dbError
    }
    
    shopDb.close()
    
    res.status(201).json({
      message: 'Registration successful',
      role: role,
      username: finalUsername
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Registration failed', error: error.message })
  }
})

// Register new shop (admin only - separate endpoint)
router.post('/register-shop', async (req, res) => {
  try {
    const { shopName, ownerName, email, phone, address, password } = req.body
    
    if (!shopName || !ownerName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    
    // Get master database connection
    const masterDb = getMasterDb()
    
    // Check if shop already exists
    const existingShop = masterDb.prepare('SELECT * FROM shops WHERE email = ?').get(email)
    
    if (existingShop) {
      return res.status(400).json({ message: 'Shop with this email already exists' })
    }
    
    // Generate short 5-character shop ID
    let shopId = generateShopId()
    let attempts = 0
    const maxAttempts = 10
    
    // Ensure shop ID is unique
    while (attempts < maxAttempts) {
      const existing = masterDb.prepare('SELECT * FROM shops WHERE id = ?').get(shopId)
      if (!existing) break
      shopId = generateShopId()
      attempts++
    }
    
    if (attempts >= maxAttempts) {
      return res.status(500).json({ message: 'Failed to generate unique Shop ID. Please try again.' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Register shop and create database
    registerShop({
      id: shopId,
      shopName,
      ownerName,
      email,
      phone,
      address
    })
    
    // Wait a moment for database file to be fully written
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Create admin user in shop database
    const shopDb = getShopDb(shopId)
    const adminId = uuidv4()
    
    shopDb.prepare(`
      INSERT INTO users (id, username, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, email, email, hashedPassword, ownerName, 'admin')
    
    // Create manager user if provided
    const { managerName, managerEmail, managerPassword } = req.body
    if (managerName && managerEmail && managerPassword) {
      const managerId = uuidv4()
      const managerHashedPassword = await bcrypt.hash(managerPassword, 10)
      shopDb.prepare(`
        INSERT INTO users (id, username, email, password_hash, name, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(managerId, managerEmail, managerEmail, managerHashedPassword, managerName, 'manager')
    }
    
    // Create cashier user if provided
    const { cashierName, cashierEmail, cashierPassword } = req.body
    if (cashierName && cashierEmail && cashierPassword) {
      const cashierId = uuidv4()
      const cashierHashedPassword = await bcrypt.hash(cashierPassword, 10)
      shopDb.prepare(`
        INSERT INTO users (id, username, email, password_hash, name, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(cashierId, cashierEmail, cashierEmail, cashierHashedPassword, cashierName, 'cashier')
    }
    
    // Close the database connection
    shopDb.close()
    
    res.status(201).json({
      message: 'Shop registered successfully',
      shopId: shopId
    })
  } catch (error) {
    console.error('Shop registration error:', error)
    res.status(500).json({ message: 'Shop registration failed', error: error.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, shopId, role } = req.body
    
    if (!email || !password || !shopId || !role) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    
    // Verify role is valid
    if (!['cashier', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be cashier or manager' })
    }
    
    // Verify shop exists
    const shopInfo = getShopInfo(shopId)
    if (!shopInfo) {
      return res.status(404).json({ message: 'Shop not found' })
    }
    
    // Get user from shop database
    const shopDb = getShopDb(shopId)
    const user = shopDb.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, role)
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or role mismatch' })
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    // Update last login
    const lastLogin = getEATDateTime()
    shopDb.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(lastLogin, user.id)
    
    // Generate token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return res.status(500).json({ message: 'Server configuration error' })
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, shopId },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      shopId
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed', error: error.message })
  }
})

// Get current user
router.get('/me', authenticate, setShopDb, (req, res) => {
  try {
    const user = req.db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.user.userId)
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' })
  }
})

export default router

