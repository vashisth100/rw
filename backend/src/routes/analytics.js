const router = require('express').Router()
const Report = require('../models/Report')
const auth   = require('../middleware/auth')

router.get('/stats', auth, async (req,res) => {
  try {
    const [total,high,medium,low,pending,inProgress,resolved] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({severity:'high'}),
      Report.countDocuments({severity:'medium'}),
      Report.countDocuments({severity:'low'}),
      Report.countDocuments({status:'Reported'}),
      Report.countDocuments({status:'In Progress'}),
      Report.countDocuments({status:'Resolved'}),
    ])
    res.json({ total,high,pending,inProgress,resolved,bySeverity:{high,medium,low},byStatus:{pending,inProgress,resolved} })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

router.get('/top-dangerous', auth, async (req,res) => {
  try {
    const top = await Report.find({status:{$ne:'Resolved'}}).sort({riskScore:-1}).limit(10)
    res.json(top)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

router.get('/trends', auth, async (req,res) => {
  try {
    const months = await Promise.all(Array.from({length:6},(_,i)=>{
      const d=new Date(); d.setMonth(d.getMonth()-(5-i))
      const s=new Date(d.getFullYear(),d.getMonth(),1)
      const e=new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59)
      const mon=s.toLocaleString('default',{month:'short'})
      return Promise.all([
        Report.countDocuments({createdAt:{$gte:s,$lte:e}}),
        Report.countDocuments({status:'Resolved',updatedAt:{$gte:s,$lte:e}}),
      ]).then(([reports,resolved])=>({month:mon,reports,resolved}))
    }))
    res.json(months)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

module.exports = router
