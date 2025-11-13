import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { getEATDateTime } from '../utils/timezone.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Master database for shop management
const masterDbPath = path.join(__dirname, '../../database/master.db')
const shopsDbDir = path.join(__dirname, '../../database/shops')

// Ensure directories exist
if (!fs.existsSync(path.dirname(masterDbPath))) {
  fs.mkdirSync(path.dirname(masterDbPath), { recursive: true })
}
if (!fs.existsSync(shopsDbDir)) {
  fs.mkdirSync(shopsDbDir, { recursive: true })
}

// Initialize master database
const initMasterDb = () => {
  const db = new Database(masterDbPath)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      shop_name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      created_at DATETIME NOT NULL,
      db_path TEXT NOT NULL
    )
  `)
  
  return db
}

// Get master database connection
export const getMasterDb = () => {
  return initMasterDb()
}

// Create shop database
export const createShopDatabase = (shopId) => {
  const dbPath = path.join(shopsDbDir, `${shopId}.db`)
  const db = new Database(dbPath)
  
  // Create all tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier',
      created_at DATETIME NOT NULL,
      last_login DATETIME
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT UNIQUE,
      category TEXT,
      price REAL NOT NULL,
      cost_price REAL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_level INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'piece',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      duration_minutes INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME NOT NULL
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transaction_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS transaction_items (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      transaction_id TEXT,
      change_type TEXT NOT NULL,
      quantity_change INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME NOT NULL,
      user_id TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id TEXT,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  
  // Close the database connection
  db.close()
  
  return dbPath
}

// Get shop database connection
export const getShopDb = (shopId) => {
  const dbPath = path.join(shopsDbDir, `${shopId}.db`)
  if (!fs.existsSync(dbPath)) {
    throw new Error('Shop database not found')
  }
  return new Database(dbPath)
}

// Store shop database path in master db
export const registerShop = (shopData) => {
  const masterDb = getMasterDb()
  const shopId = shopData.id
  const dbPath = createShopDatabase(shopId)
  const createdAt = getEATDateTime()
  
  masterDb.prepare(`
    INSERT INTO shops (id, shop_name, owner_name, email, phone, address, db_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    shopId,
    shopData.shopName,
    shopData.ownerName,
    shopData.email,
    shopData.phone,
    shopData.address,
    dbPath,
    createdAt
  )
  
  return shopId
}

// Get shop info from master db
export const getShopInfo = (shopId) => {
  const masterDb = getMasterDb()
  return masterDb.prepare('SELECT * FROM shops WHERE id = ?').get(shopId)
}

