import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in environment variables!')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/sales', transactionRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/reports', reportRoutes)

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

