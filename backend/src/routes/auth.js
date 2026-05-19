const router = require('express').Router()
const jwt    = require('jsonwebtoken')
const User   = require('../models/User')
const SECRET = process.env.JWT_SECRET || 'roadwatch_secret_v4'
const sign   = u => jwt.sign({ id:u._id, name:u.name, email:u.email, role:u.role }, SECRET, { expiresIn:'7d' })

router.post('/signup', async (req,res) => {
  try {
    const { name, email, password } = req.body
    if (!name||!email||!password) return res.status(400).json({ error:'All fields required' })
    if (password.length<6)        return res.status(400).json({ error:'Password must be 6+ characters' })
    if (await User.findOne({email})) return res.status(400).json({ error:'Email already registered' })
    const user  = await User.create({ name, email, password })
    const token = sign(user)
    res.status(201).json({ token, user:{ id:user._id, name:user.name, email:user.email, role:user.role } })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

router.post('/login', async (req,res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user||!(await user.comparePassword(password)))
      return res.status(400).json({ error:'Invalid email or password' })
    const token = sign(user)
    res.json({ token, user:{ id:user._id, name:user.name, email:user.email, role:user.role } })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

router.get('/me', require('../middleware/auth'), async (req,res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ error:'Not found' })
    res.json({ user })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

module.exports = router
