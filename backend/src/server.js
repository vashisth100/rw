const express  = require('express')
const cors     = require('cors')
const mongoose = require('mongoose')
const path     = require('path')
const fs       = require('fs')
const http     = require('http')
const { Server }=require('socket.io')
require('dotenv').config()

const app    = express()
const server = http.createServer(app)
const io     = new Server(server,{cors:{origin:'*'}})
const PORT   = process.env.PORT||3001

app.set('io',io)
app.use(cors({origin:'*'}))
app.use(express.json())

const UPLOADS=path.join(__dirname,'../uploads')
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS,{recursive:true})
app.use('/uploads',express.static(UPLOADS))

app.use('/api/auth',     require('./routes/auth'))
app.use('/api/reports',  require('./routes/reports'))
app.use('/api',          require('./routes/analytics'))
app.use('/api/features', require('./routes/features'))
app.get('/health',(_,res)=>res.json({status:'ok',time:new Date()}))

io.on('connection',s=>{
  console.log(`Client connected: ${s.id}`)
  s.on('disconnect',()=>console.log(`Client disconnected: ${s.id}`))
})

async function seedDemo() {
  const User=require('./models/User')
  if (!(await User.findOne({email:'demo@roadwatch.ai'}))) {
    await User.create({name:'Demo Officer',email:'demo@roadwatch.ai',password:'demo1234',role:'admin'})
    console.log('✅ Demo user: demo@roadwatch.ai / demo1234')
  }
}

mongoose.connect(process.env.MONGODB_URI||'mongodb://localhost:27017/roadwatch')
  .then(async()=>{
    console.log('✅ MongoDB connected')
    await seedDemo()
    server.listen(PORT,()=>console.log(`🚀 Server → http://localhost:${PORT}`))
  })
  .catch(err=>{
    console.error('❌ MongoDB:',err.message)
    server.listen(PORT,()=>console.log(`🚀 Server → http://localhost:${PORT} (no DB)`))
  })

module.exports={app,server}
