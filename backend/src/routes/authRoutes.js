import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma.js'
import { authenticate, setShopDb } from '../middleware/auth.js'
import { generateShopId } from '../utils/shopIdGenerator.js'
import { getEATDateTime, getEATDateObject } from '../utils/timezone.js'

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
    const shopInfo = await prisma.shop.findUnique({
      where: { id: shopId }
    })
    if (!shopInfo) {
      return res.status(404).json({ message: 'Shop not found. Please check your Shop ID.' })
    }
    
    // Check if user already exists with this email (regardless of role)
    const existingUser = await prisma.user.findFirst({
      where: {
        shopId: shopId,
        email: email
      }
    })
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists in this shop. Please use a different email or contact admin.' 
      })
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = uuidv4()
    const createdAt = getEATDateObject() // Use EAT timezone
    
    // Generate username if not provided
    const finalUsername = username || email.split('@')[0]
    
    // Create user in shop database
    try {
      await prisma.user.create({
        data: {
          id: userId,
          shopId: shopId,
          username: finalUsername,
          email: email,
          passwordHash: hashedPassword,
          name: name,
          role: role,
          createdAt: createdAt
        }
      })
    } catch (dbError) {
      if (dbError.code === 'P2002') { // Prisma unique constraint error
        return res.status(400).json({ 
          message: 'User with this email or username already exists in this shop. Please use different credentials.' 
        })
      }
      throw dbError
    }
    
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
    
    // Check if shop already exists
    const existingShop = await prisma.shop.findUnique({
      where: { email: email }
    })
    
    if (existingShop) {
      return res.status(400).json({ message: 'Shop with this email already exists' })
    }
    
    // Generate short 5-character shop ID
    let shopId = generateShopId()
    let attempts = 0
    const maxAttempts = 10
    
    // Ensure shop ID is unique
    while (attempts < maxAttempts) {
      const existing = await prisma.shop.findUnique({
        where: { id: shopId }
      })
      if (!existing) break
      shopId = generateShopId()
      attempts++
    }
    
    if (attempts >= maxAttempts) {
      return res.status(500).json({ message: 'Failed to generate unique Shop ID. Please try again.' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const createdAt = getEATDateObject() // Use EAT timezone
    
    // Register shop and create admin user in a transaction
    await prisma.$transaction(async (tx) => {
      // Create shop
      await tx.shop.create({
        data: {
          id: shopId,
          shopName: shopName,
          ownerName: ownerName,
          email: email,
          phone: phone || null,
          address: address || null,
          createdAt: createdAt
        }
      })
      
      // Create admin user
      const adminId = uuidv4()
      await tx.user.create({
        data: {
          id: adminId,
          shopId: shopId,
          username: email,
          email: email,
          passwordHash: hashedPassword,
          name: ownerName,
          role: 'admin',
          createdAt: createdAt
        }
      })
      
      // Create manager user if provided
      const { managerName, managerEmail, managerPassword } = req.body
      if (managerName && managerEmail && managerPassword) {
        const managerId = uuidv4()
        const managerHashedPassword = await bcrypt.hash(managerPassword, 10)
        await tx.user.create({
          data: {
            id: managerId,
            shopId: shopId,
            username: managerEmail,
            email: managerEmail,
            passwordHash: managerHashedPassword,
            name: managerName,
            role: 'manager',
            createdAt: createdAt
          }
        })
      }
      
      // Create cashier user if provided
      const { cashierName, cashierEmail, cashierPassword } = req.body
      if (cashierName && cashierEmail && cashierPassword) {
        const cashierId = uuidv4()
        const cashierHashedPassword = await bcrypt.hash(cashierPassword, 10)
        await tx.user.create({
          data: {
            id: cashierId,
            shopId: shopId,
            username: cashierEmail,
            email: cashierEmail,
            passwordHash: cashierHashedPassword,
            name: cashierName,
            role: 'cashier',
            createdAt: createdAt
          }
        })
      }
    })
    
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
    const shopInfo = await prisma.shop.findUnique({
      where: { id: shopId }
    })
    if (!shopInfo) {
      return res.status(404).json({ message: 'Shop not found' })
    }
    
    // Get user from shop database
    const user = await prisma.user.findFirst({
      where: {
        shopId: shopId,
        email: email,
        role: role
      }
    })
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or role mismatch' })
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    // Update last login
    const lastLogin = getEATDateObject() // Use EAT timezone
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: lastLogin }
    })
    
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
router.get('/me', authenticate, setShopDb, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ message: 'Error fetching user' })
  }
})

export default router

