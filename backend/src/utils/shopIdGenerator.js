// Generate a short 5-character shop ID
export const generateShopId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like 0, O, I, 1
  let shopId = ''
  for (let i = 0; i < 5; i++) {
    shopId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return shopId
}

