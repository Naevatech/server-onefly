import { getAuth } from '@clerk/express'
const requireAuth = (req, res, next) => {
  const auth = getAuth(req)
  console.log('Authorization header present:', Boolean(req.headers.authorization))
  console.log('getAuth(req):', auth)
  console.log('auth.debug():', auth.debug())

  if (!auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  next()
}

export default requireAuth