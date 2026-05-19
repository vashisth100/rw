const router = require('express').Router()
const Report = require('../models/Report')
const auth   = require('../middleware/auth')

// ── Budget Optimizer ──────────────────────────────────────────────────────────
router.get('/budget', auth, async (req,res) => {
  try {
    const budget  = parseInt(req.query.budget)||5000000
    const reports = await Report.find({status:{$ne:'Resolved'}}).sort({riskScore:-1}).lean()
    if (!reports.length) return res.json({budget,selected:[],totalCost:0,riskReduction:'0%',estimatedLivesSaved:0,avgRiskBefore:0})

    let remaining=budget, totalRisk=0, totalCost=0
    const selected=[]
    for (const r of reports) {
      const cost = r.repairCost||(r.severity==='high'?50000:r.severity==='medium'?12000:4000)
      if (cost<=remaining) {
        selected.push({ id:r._id, location:r.location?.name, ward:r.ward, city:r.city, severity:r.severity, riskScore:r.riskScore, repairCost:cost, roi:parseFloat((r.riskScore/(cost/1000)).toFixed(2)), status:r.status })
        remaining-=cost; totalRisk+=r.riskScore; totalCost+=cost
      }
      if (remaining<=0) break
    }

    const totalAllRisk = reports.reduce((s,r)=>s+r.riskScore,0)
    const riskReduction = totalAllRisk>0 ? Math.round((totalRisk/totalAllRisk)*100) : 0
    const avgRiskBefore = reports.length ? parseFloat((totalAllRisk/reports.length).toFixed(1)) : 0

    res.json({ budget, budgetUsed:totalCost, budgetRemaining:budget-totalCost, roadsSelected:selected.length, roadsTotal:reports.length, riskReduction:`${riskReduction}%`, avgRiskBefore, estimatedLivesSaved:Math.round(selected.filter(r=>r.severity==='high').length*0.3), selected })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

// ── Ward Accountability ───────────────────────────────────────────────────────
router.get('/wards', auth, async (req,res) => {
  try {
    const all = await Report.find({}).lean()
    if (!all.length) return res.json([])

    const wardMap={}
    for (const r of all) {
      const ward = r.ward||'Unknown Ward'
      if (!wardMap[ward]) wardMap[ward]={ ward,city:r.city||'Unknown',councillor:r.councillor||'Unknown',total:0,high:0,resolved:0,inProgress:0,reported:0,totalRisk:0,totalCost:0,pendingCost:0 }
      const w=wardMap[ward]
      w.total++; w.totalRisk+=r.riskScore||0; w.totalCost+=r.repairCost||0
      if (r.severity==='high')       w.high++
      if (r.status==='Resolved')     w.resolved++
      else if (r.status==='In Progress') w.inProgress++
      else                               w.reported++
      if (r.status!=='Resolved')         w.pendingCost+=(r.repairCost||0)
    }

    const grade = w => {
      const score = Math.round((w.resolved/w.total)*50 + Math.max(0,50-(w.totalRisk/w.total/2)))
      if (score>=75) return {grade:'A',label:'Excellent',color:'#16a34a'}
      if (score>=50) return {grade:'B',label:'Good',     color:'#2563eb'}
      if (score>=30) return {grade:'C',label:'Average',  color:'#d97706'}
      return              {grade:'D',label:'Poor',     color:'#dc2626'}
    }

    const wards = Object.values(wardMap).map(w=>({
      ...w,
      avgRisk:parseFloat((w.totalRisk/w.total).toFixed(1)),
      resolutionRate:parseFloat(((w.resolved/w.total)*100).toFixed(1)),
      pendingIssues:w.reported+w.inProgress,
      grade:grade(w),
    })).sort((a,b)=>b.pendingIssues-a.pendingIssues||b.avgRisk-a.avgRisk)

    res.json(wards)
  } catch(e) { res.status(500).json({ error:e.message }) }
})

// ── Predictive Maintenance ────────────────────────────────────────────────────
router.get('/predict', auth, async (req,res) => {
  try {
    const pending = await Report.find({status:{$ne:'Resolved'}}).lean()
    if (!pending.length) return res.json({predictions:[],summary:{total:0,critical:0,willWorsen:0,monsoonSeason:false}})

    const now=new Date()
    const month=now.getMonth()+1
    const monsoonRisk = month>=6&&month<=9?0.85:month===5||month===10?0.5:month===4||month===11?0.25:0.1
    const highTraffic = n=>['highway','nh-','expressway','ring road','main road','bypass','flyover'].some(k=>(n||'').toLowerCase().includes(k))
    const clusterRisk = (r,all) => {
      const R=0.01
      return Math.min(15,all.filter(x=>x._id.toString()!==r._id.toString()&&Math.abs((x.location?.lat||0)-(r.location?.lat||0))<R&&Math.abs((x.location?.lng||0)-(r.location?.lng||0))<R).length*3)
    }

    const predictions = pending.map(r=>{
      const age   = Math.floor((now-new Date(r.createdAt))/86400000)
      const htraf = highTraffic(r.location?.name)
      const cr    = clusterRisk(r,pending)
      const decay = Math.min(30,age*0.5)
      const pred  = Math.min(100,Math.round((r.riskScore+decay)*(htraf?1.4:1)*(1+monsoonRisk*0.3)+cr))
      const worse = pred>r.riskScore+10
      const days  = worse?Math.max(1,Math.round(20/(( htraf?1.4:1)*(1+monsoonRisk)))):null

      const urgency = pred>=85||(worse&&days<=7)?'CRITICAL':pred>=70||(worse&&days<=14)?'HIGH':pred>=50||worse?'MEDIUM':'LOW'
      const rec =
        pred>=85&&monsoonRisk>0.5?'Immediate repair required before monsoon intensifies. Structural risk.':
        pred>=80?'Schedule emergency repair within 48 hours. High accident probability.':
        pred>=70?'Prioritize repair within 1 week. Significant vehicle damage risk.':
        pred>=50&&monsoonRisk>0.5?'Repair before next rainfall. Waterlogging will accelerate damage.':
        pred>=50?'Schedule repair within 14 days.':'Monitor and include in next maintenance cycle.'

      return { id:r._id, location:r.location?.name, ward:r.ward, city:r.city, currentRisk:r.riskScore, predictedRisk:pred, riskIncrease:pred-r.riskScore, willWorsen:worse, daysToWorsen:days, monsoonVulnerable:monsoonRisk>0.5, highTraffic:htraf, clustered:cr>5, urgency, recommendation:rec }
    }).sort((a,b)=>({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}[a.urgency]||9)-({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}[b.urgency]||9))

    res.json({
      predictions,
      summary:{ total:pending.length, critical:predictions.filter(p=>p.urgency==='CRITICAL').length, willWorsen:predictions.filter(p=>p.willWorsen).length, monsoonSeason:monsoonRisk>0.5, monsoonRiskLevel:monsoonRisk>0.7?'High':monsoonRisk>0.4?'Medium':'Low', avgPredictedRisk:parseFloat((predictions.reduce((s,p)=>s+p.predictedRisk,0)/predictions.length).toFixed(1)) }
    })
  } catch(e) { res.status(500).json({ error:e.message }) }
})

module.exports = router
