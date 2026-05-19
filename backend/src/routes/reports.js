const router = require('express').Router()
const multer = require('multer')
const path   = require('path')
const axios  = require('axios')
const Report = require('../models/Report')
const auth   = require('../middleware/auth')
const fs     = require('fs')

const UPLOADS = path.join(__dirname,'../../uploads')
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS,{recursive:true})

const upload = multer({
  storage: multer.diskStorage({
    destination:(_,__,cb)=>cb(null,UPLOADS),
    filename:(_,f,cb)=>cb(null,`${Date.now()}-${f.originalname.replace(/\s/g,'_')}`),
  }),
  limits:{ fileSize:10*1024*1024 },
})

function computeRisk(severity,confidence=0.8) {
  const base = {low:18,medium:52,high:87}[severity]??50
  const bonus = Math.round((confidence-0.5)*20)
  return Math.min(100,Math.max(0,base+bonus+Math.floor(Math.random()*5)))
}

router.get('/', auth, async (req,res) => {
  try {
    const { severity,status,limit=100,page=1 } = req.query
    const filter={}
    if (severity&&severity!=='all') filter.severity=severity
    if (status&&status!=='all')     filter.status=status
    const [reports,total] = await Promise.all([
      Report.find(filter).sort({createdAt:-1}).limit(+limit).skip((+page-1)*+limit),
      Report.countDocuments(filter),
    ])
    res.json({ reports,total,page:+page })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

router.get('/:id', auth, async (req,res) => {
  try {
    const r = await Report.findById(req.params.id)
    if (!r) return res.status(404).json({ error:'Not found' })
    res.json(r)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

router.post('/', auth, upload.single('image'), async (req,res) => {
  try {
    if (!req.file) return res.status(400).json({ error:'Image required' })
    const { lat,lng,locationName,severity:cSev,riskScore:cRisk,detections:dStr } = req.body
    let detections=[],severity=cSev||'medium',confidence=0.82

    if (dStr) { try { detections=JSON.parse(dStr); confidence=detections[0]?.confidence||0.82 } catch{} }

    try {
      const ai = await axios.post(`${process.env.AI_SERVICE_URL||'http://localhost:8000'}/detect`,
        { image_path:path.join(UPLOADS,req.file.filename) },{ timeout:10000 })
      if (ai.data.detections?.length) { detections=ai.data.detections; severity=ai.data.severity||severity; confidence=ai.data.confidence||confidence }
    } catch{}

    const riskScore = cRisk ? +cRisk : computeRisk(severity,confidence)

    const report = await Report.create({
      imageUrl:`/uploads/${req.file.filename}`,
      location:{ name:locationName||'Reported Location', lat:+lat||28.6139, lng:+lng||77.209 },
      type:detections[0]?.label==='crack'?'Crack':'Pothole',
      severity,riskScore,confidence,
      reporter:req.user.name||'Anonymous',userId:req.user.id,detections,
    })

    if (req.app.get('io')) req.app.get('io').emit('new_report',report)
    res.status(201).json(report)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

router.patch('/:id/status', auth, async (req,res) => {
  try {
    const { status } = req.body
    if (!['Reported','In Progress','Resolved'].includes(status))
      return res.status(400).json({ error:'Invalid status' })
    const report = await Report.findByIdAndUpdate(req.params.id,{ status,updatedAt:new Date() },{new:true})
    if (!report) return res.status(404).json({ error:'Not found' })
    if (req.app.get('io')) req.app.get('io').emit('status_update',{ id:report._id,status })
    res.json(report)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

module.exports = router
