// Currency formatter
export const formatCurrency = (amount) => {
  return `KSH ${Number(amount).toLocaleString('en-KE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

// Format currency without symbol (just number)
export const formatCurrencyNumber = (amount) => {
  return Number(amount).toLocaleString('en-KE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

/**
 * Format date/time in EAT (East Africa Time - UTC+3)
 * Handles both ISO date strings from Prisma (UTC) and legacy string format
 * @param {string|Date} dateInput - Date string (ISO format from Prisma) or Date object
 * @returns {string} Formatted date string in EAT
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A'
  
  try {
    let date
    
    // Handle ISO date strings from Prisma (UTC) or Date objects
    if (dateInput instanceof Date) {
      date = dateInput
    } else if (dateInput.includes('T') || dateInput.includes('Z')) {
      // ISO format from Prisma (UTC)
      date = new Date(dateInput)
    } else {
      // Legacy format: 'YYYY-MM-DD HH:MM:SS' (assumed to be EAT)
      const [datePart, timePart] = dateInput.split(' ')
      if (!datePart || !timePart) return dateInput
      
      const [year, month, day] = datePart.split('-')
      const [hours, minutes] = timePart.split(':')
      const dateStr = `${year}-${month}-${day}T${hours}:${minutes}:00+03:00`
      date = new Date(dateStr)
    }
    
    // Format using Nairobi timezone to ensure correct display
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Africa/Nairobi',
      hour12: false
    }
    
    return date.toLocaleString('en-KE', options) + ' EAT'
  } catch (error) {
    // Fallback: try to parse as legacy format
    try {
      if (typeof dateInput === 'string' && !dateInput.includes('T')) {
        const [datePart, timePart] = dateInput.split(' ')
        if (datePart && timePart) {
          const [year, month, day] = datePart.split('-')
          const [hours, minutes] = timePart.split(':')
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}, ${hours}:${minutes} EAT`
        }
      }
    } catch (e) {
      console.error('Error in formatDate fallback:', e)
    }
    return String(dateInput)
  }
}

/**
 * Format date only (without time) in EAT
 * @param {string|Date} dateInput - Date string (ISO format from Prisma) or Date object
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (dateInput) => {
  if (!dateInput) return 'N/A'
  
  try {
    let date
    
    if (dateInput instanceof Date) {
      date = dateInput
    } else if (dateInput.includes('T') || dateInput.includes('Z')) {
      // ISO format from Prisma (UTC)
      date = new Date(dateInput)
    } else {
      // Legacy format
      const [datePart] = dateInput.split(' ')
      const [year, month, day] = datePart.split('-')
      date = new Date(`${year}-${month}-${day}`)
    }
    
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Nairobi'
    })
  } catch (error) {
    return String(dateInput)
  }
}

/**
 * Format time only in EAT
 * @param {string|Date} dateInput - Date string (ISO format from Prisma) or Date object
 * @returns {string} Formatted time string
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return 'N/A'
  
  try {
    let date
    
    if (dateInput instanceof Date) {
      date = dateInput
    } else if (dateInput.includes('T') || dateInput.includes('Z')) {
      // ISO format from Prisma (UTC)
      date = new Date(dateInput)
    } else {
      // Legacy format
      const [datePart, timePart] = dateInput.split(' ')
      if (!timePart) return 'N/A'
      const [year, month, day] = datePart.split('-')
      const [hours, minutes] = timePart.split(':')
      date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00+03:00`)
    }
    
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi',
      hour12: false
    }) + ' EAT'
  } catch (error) {
    return String(dateInput)
  }
}
