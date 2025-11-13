# POS System - Multi-Tenant Retail Management

A professional Point of Sale system for retail shops and supermarkets with multi-tenant support, where each shop has its own isolated database.

## Features

- **Multi-Tenant Architecture**: Each shop gets its own SQLite database with unique 5-character Shop ID
- **Role-Based Access Control**: Admin (full control), Manager (read-only viewing), and Cashier (process sales)
- **Product Management**: Track inventory, prices, stock levels with minimum stock alerts
- **Service Management**: Handle services like photocopying, scanning, passport applications
- **POS Interface**: Fast checkout with visual stock alerts (red borders for low/out of stock)
- **Transaction History**: Complete sales records with receipts
- **Inventory Management**: Stock tracking, restocking, low stock alerts, inventory activity logs
- **Reports & Analytics**: Sales reports, top products, dashboard
- **Security**: JWT authentication, password hashing, secure API
- **Timezone Support**: All timestamps in EAT (East Africa Time - UTC+3) for accurate Kenyan time

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3) - one database per shop
- **Authentication**: JWT tokens
- **Security**: bcrypt, helmet, CORS

## Installation

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your JWT_SECRET
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. **Register a Shop**: Go to `/register-shop` and create a new shop account (creates admin)
2. **Register Users**: Go to `/register` to add Manager or Cashier accounts using Shop ID
3. **Login**: Use Shop ID, email, password, and role to login
4. **Add Products**: Go to Products page and add items (min stock level required)
5. **Add Services**: Go to Services page and add services
6. **Process Sales**: Use the POS page to checkout customers (visual alerts for low stock)
7. **View Reports**: Check sales and analytics in Reports page

## User Roles

- **Admin**: Full system control, can manage users, products, services, inventory
- **Manager**: Read-only access, can view reports, inventory, sales, but cannot make changes
- **Cashier**: Day-to-day operations, process sales, view products/services, manage inventory

## Stock Alert System

- **Low Stock Alert**: Products with stock ≤ min_stock_level show red border in POS
- **Out of Stock**: Products with stock = 0 show "Out of Stock" and cannot be added to cart
- **Visual Indicators**: Red borders and backgrounds in POS for immediate visibility
- **Backend Validation**: Prevents negative stock and validates availability before checkout

## Database Structure

- **Master Database**: Tracks all registered shops
- **Shop Databases**: Each shop has its own database file (`{shopId}.db`)
- **Tables**: users, products, services, transactions, transaction_items, inventory_logs, audit_logs

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- SQL injection prevention
- Secure session management
- Manager role write protection

## Timezone

All timestamps are stored and displayed in **EAT (East Africa Time - UTC+3)** for accurate Kenyan time tracking.

## Project Structure

```
/pos-system
  /backend
    /src
      /config - Database configuration
      /middleware - Auth, error handling, read-only protection
      /routes - API routes
      /utils - Shop ID generator, timezone utilities
    /database - SQLite databases
  /frontend
    /src
      /components - Reusable components
      /pages - Page components
      /context - React context (Auth, Toast)
      /utils - API client, formatters
```

## Development

Backend runs on `http://localhost:5000`
Frontend runs on `http://localhost:3000` (or port specified in vite config)

## License

ISC
