// Timezone utility for EAT (East Africa Time - UTC+3)
// EAT is UTC+3, no daylight saving time
// Nairobi, Kenya timezone

/**
 * Get current date/time in EAT (East Africa Time - UTC+3)
 * Returns ISO 8601 format string suitable for SQLite DATETIME
 * @returns {string} Current time in EAT as 'YYYY-MM-DD HH:MM:SS'
 */
export const getEATDateTime = () => {
  // Get current time in Nairobi (EAT - UTC+3)
  const now = new Date()
  
  // Use Intl.DateTimeFormat to get Nairobi time components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year').value
  const month = parts.find(p => p.type === 'month').value
  const day = parts.find(p => p.type === 'day').value
  const hours = parts.find(p => p.type === 'hour').value
  const minutes = parts.find(p => p.type === 'minute').value
  const seconds = parts.find(p => p.type === 'second').value
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Get current date in EAT
 * @returns {string} Current date in EAT as 'YYYY-MM-DD'
 */
export const getEATDate = () => {
  const now = new Date()
  
  // Use Intl.DateTimeFormat to get Nairobi date
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year').value
  const month = parts.find(p => p.type === 'month').value
  const day = parts.find(p => p.type === 'day').value
  
  return `${year}-${month}-${day}`
}

/**
 * Convert UTC datetime string to EAT datetime string
 * @param {string} utcDateTime - UTC datetime string
 * @returns {string} EAT datetime string
 */
export const convertToEAT = (utcDateTime) => {
  if (!utcDateTime) return null
  
  const date = new Date(utcDateTime)
  const eatOffset = 3 * 60 * 60 * 1000
  const eatTime = new Date(date.getTime() + eatOffset)
  
  const year = eatTime.getUTCFullYear()
  const month = String(eatTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(eatTime.getUTCDate()).padStart(2, '0')
  const hours = String(eatTime.getUTCHours()).padStart(2, '0')
  const minutes = String(eatTime.getUTCMinutes()).padStart(2, '0')
  const seconds = String(eatTime.getUTCSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

