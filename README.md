# POS System - Multi-Tenant Retail Management

A professional Point of Sale system for retail shops and supermarkets with multi-tenant support, where each shop has its own isolated database.

## Features

- **Multi-Tenant Architecture**: Each shop gets its own SQLite database
- **Role-Based Access Control**: Admin, Manager, and Cashier roles
- **Product Management**: Track inventory, prices, stock levels
- **Service Management**: Handle services like photocopying, scanning, passport applications
- **POS Interface**: Fast checkout with product and service selection
- **Transaction History**: Complete sales records with receipts
- **Inventory Management**: Stock tracking, restocking, low stock alerts
- **Reports & Analytics**: Sales reports, top products, dashboard
- **Security**: JWT authentication, password hashing, secure API

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

1. **Register a Shop**: Go to `/register` and create a new shop account
2. **Login**: Use the Shop ID, email, and password to login
3. **Add Products**: Go to Products page and add items
4. **Add Services**: Go to Services page and add services
5. **Process Sales**: Use the POS page to checkout customers
6. **View Reports**: Check sales and analytics in Reports page

## User Roles

- **Admin**: Full system control, can manage users, products, services
- **Manager**: Business owner, can view reports, manage inventory, check sales
- **Cashier**: Day-to-day operations, process sales, view products/services

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

## Project Structure

```
/pos-system
  /backend
    /src
      /config - Database configuration
      /middleware - Auth, error handling
      /routes - API routes
    /database - SQLite databases
  /frontend
    /src
      /components - Reusable components
      /pages - Page components
      /context - React context
      /utils - Utilities
```

## Development

Backend runs on `http://localhost:5000`
Frontend runs on `http://localhost:3000`

## License

ISC

