import { getAuth } from '@clerk/express'
const requireAdmin = (req, res, next) => {
  const auth = getAuth(req)

  if (!auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!auth.has({ role: 'org:admin' })) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}

export default requireAdmin