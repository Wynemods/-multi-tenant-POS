// Middleware to block write operations for manager role
export const blockManagerWrites = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return res.status(403).json({ 
      message: 'Managers have read-only access. Cannot perform this action.' 
    })
  }
  next()
}

