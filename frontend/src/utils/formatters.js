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
 * @param {string} dateString - Date string from database (EAT format: 'YYYY-MM-DD HH:MM:SS')
 * @returns {string} Formatted date string in EAT
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    // Parse the EAT datetime string from database
    // Format: 'YYYY-MM-DD HH:MM:SS' (already in EAT/Nairobi time, stored as-is)
    const [datePart, timePart] = dateString.split(' ')
    if (!datePart || !timePart) return dateString
    
    const [year, month, day] = datePart.split('-')
    const [hours, minutes] = timePart.split(':')
    
    // The database stores EAT time directly, so we parse it as Nairobi time
    // Create a date string and parse it as if it's in Nairobi timezone
    const dateStr = `${year}-${month}-${day}T${hours}:${minutes}:00+03:00`
    const date = new Date(dateStr)
    
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
    // Fallback: format the string directly (it's already in EAT)
    try {
      const [datePart, timePart] = dateString.split(' ')
      if (datePart && timePart) {
        const [year, month, day] = datePart.split('-')
        const [hours, minutes] = timePart.split(':')
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}, ${hours}:${minutes} EAT`
      }
    } catch (e) {
      console.error('Error in formatDate fallback:', e)
    }
    return dateString
  }
}

/**
 * Format date only (without time) in EAT
 * @param {string} dateString - Date string from database
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const [datePart] = dateString.split(' ')
    const [year, month, day] = datePart.split('-')
    const date = new Date(`${year}-${month}-${day}`)
    
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Nairobi'
    })
  } catch (error) {
    return dateString
  }
}

/**
 * Format time only in EAT
 * @param {string} dateString - Date string from database
 * @returns {string} Formatted time string
 */
export const formatTime = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const [, timePart] = dateString.split(' ')
    if (!timePart) return 'N/A'
    
    const [hours, minutes] = timePart.split(':')
    return `${hours}:${minutes} EAT`
  } catch (error) {
    return dateString
  }
}
