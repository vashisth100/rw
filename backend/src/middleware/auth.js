const jwt = require('jsonwebtoken')
const SECRET = process.env.JWT_SECRET || 'roadwatch_secret_v4'

module.exports = function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error:'No token — please sign in' })
  try { req.user = jwt.verify(token, SECRET); next() }
  catch { res.status(401).json({ error:'Invalid or expired token' }) }
}
