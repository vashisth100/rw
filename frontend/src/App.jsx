import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { useAuth } from './context/AuthContext'
import LeafletMapView from './components/LeafletMapView'
import AIDetectionCanvas from './components/AIDetectionCanvas'
import BudgetOptimizer from './components/BudgetOptimizer'
import WardAccountability from './components/WardAccountability'
import PredictiveMaintenance from './components/PredictiveMaintenance'
import { runDemoAI } from './data/demoDetections'
import { api } from './hooks/useApi'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:'#020914', bg1:'#060f1e', bg2:'#0a1628', bg3:'#0f1e35',
  cyan:'#00d4ff', cyan2:'rgba(0,212,255,0.12)', cyan3:'rgba(0,212,255,0.06)',
  orange:'#ff6b35', green:'#00e676', red:'#ff3d5a', amber:'#ffaa00', purple:'#a78bfa',
  bdr:'rgba(0,212,255,0.12)', bdr2:'rgba(255,255,255,0.06)',
  tx1:'#e8f4fd', tx2:'rgba(180,210,240,0.6)', tx3:'rgba(100,150,200,0.35)',
}
const rc = s => s>=71?C.red:s>=31?C.amber:C.green

// ── Seed fallback data (instant, no backend) ──────────────────────────────────
const SEED = [
  {_id:'s1', location:{name:'NH-48 Mahipalpur, New Delhi',      lat:28.5355,lng:77.1190},type:'Pothole',severity:'high',  riskScore:92,confidence:0.94,status:'Reported',   reporter:'Vikram S.',  city:'Delhi',    ward:'Mahipalpur Ward',    councillor:'Rajesh Gupta',   repairCost:82000,createdAt:'2024-03-10'},
  {_id:'s2', location:{name:'Ring Road, Lajpat Nagar',           lat:28.5665,lng:77.2431},type:'Pothole',severity:'high',  riskScore:88,confidence:0.94,status:'Reported',   reporter:'Priya M.',   city:'Delhi',    ward:'Lajpat Nagar Ward',  councillor:'Sunita Sharma',  repairCost:74000,createdAt:'2024-03-08'},
  {_id:'s3', location:{name:'Eastern Exp Hwy, Kurla, Mumbai',    lat:19.0725,lng:72.8851},type:'Pothole',severity:'high',  riskScore:89,confidence:0.94,status:'Reported',   reporter:'Vijay P.',   city:'Mumbai',   ward:'Kurla Ward',         councillor:'Santosh Patil',  repairCost:76000,createdAt:'2024-03-07'},
  {_id:'s4', location:{name:'Outer Ring Road, Marathahalli',      lat:12.9591,lng:77.6974},type:'Pothole',severity:'high',  riskScore:91,confidence:0.96,status:'In Progress', reporter:'Suresh K.',  city:'Bengaluru',ward:'Marathahalli Ward',  councillor:'B.R. Nagaraj',   repairCost:81000,createdAt:'2024-03-06'},
  {_id:'s5', location:{name:'Banjara Hills Road No.12, Hyderabad',lat:17.4126,lng:78.4438},type:'Pothole',severity:'high',  riskScore:89,confidence:0.95,status:'Reported',   reporter:'Lakshmi T.', city:'Hyderabad',ward:'Banjara Hills Ward', councillor:'Kalvakuntla S.', repairCost:77000,createdAt:'2024-03-05'},
  {_id:'s6', location:{name:'Anna Salai, Teynampet, Chennai',     lat:13.0418,lng:80.2341},type:'Pothole',severity:'high',  riskScore:83,confidence:0.92,status:'Reported',   reporter:'Murugan S.', city:'Chennai',  ward:'Teynampet Ward',     councillor:'R. Natarajan',   repairCost:60000,createdAt:'2024-03-04'},
  {_id:'s7', location:{name:'EM Bypass, Kasba, Kolkata',          lat:22.5124,lng:88.3890},type:'Pothole',severity:'high',  riskScore:88,confidence:0.94,status:'Reported',   reporter:'Debashis M.',city:'Kolkata',  ward:'Kasba Ward',         councillor:'Subrata Das',    repairCost:73000,createdAt:'2024-03-03'},
  {_id:'s8', location:{name:'MG Road, Connaught Place, Delhi',    lat:28.6314,lng:77.2167},type:'Crack',  severity:'medium',riskScore:55,confidence:0.82,status:'In Progress', reporter:'Neha R.',    city:'Delhi',    ward:'CP Ward',            councillor:'Deepak Jain',    repairCost:18000,createdAt:'2024-03-02'},
  {_id:'s9', location:{name:'Outer Ring Road, Munirka, Delhi',    lat:28.5527,lng:77.1718},type:'Crack',  severity:'high',  riskScore:79,confidence:0.89,status:'In Progress', reporter:'Arjun K.',   city:'Delhi',    ward:'Munirka Ward',       councillor:'Amit Yadav',     repairCost:45000,createdAt:'2024-03-01'},
  {_id:'s10',location:{name:'LBS Road, Ghatkopar, Mumbai',        lat:19.0874,lng:72.9082},type:'Crack',  severity:'high',  riskScore:77,confidence:0.88,status:'In Progress', reporter:'Anjali D.',  city:'Mumbai',   ward:'Ghatkopar Ward',     councillor:'Mangal More',    repairCost:42000,createdAt:'2024-02-28'},
  {_id:'s11',location:{name:'Karol Bagh Main Market, Delhi',      lat:28.6514,lng:77.1909},type:'Pothole',severity:'low',   riskScore:24,confidence:0.73,status:'Resolved',    reporter:'Mohan L.',   city:'Delhi',    ward:'Karol Bagh Ward',    councillor:'Anita Singh',    repairCost:5500, createdAt:'2024-02-27'},
  {_id:'s12',location:{name:'Sarjapur Road, Bellandur, Bengaluru', lat:12.9268,lng:77.6775},type:'Pothole',severity:'high',  riskScore:86,confidence:0.93,status:'Reported',   reporter:'Aditya S.',  city:'Bengaluru',ward:'Bellandur Ward',     councillor:'Narayanaswamy',  repairCost:69000,createdAt:'2024-02-26'},
  {_id:'s13',location:{name:'Pune-Mumbai Expressway, Wakad',       lat:18.5975,lng:73.7898},type:'Pothole',severity:'high',  riskScore:90,confidence:0.95,status:'Reported',   reporter:'Nikhil J.',  city:'Pune',     ward:'Wakad Ward',         councillor:'Santosh Shinde', repairCost:78000,createdAt:'2024-02-25'},
  {_id:'s14',location:{name:'SG Highway, Bodakdev, Ahmedabad',     lat:23.0415,lng:72.5052},type:'Pothole',severity:'high',  riskScore:86,confidence:0.93,status:'Reported',   reporter:'Jignesh P.', city:'Ahmedabad',ward:'Bodakdev Ward',      councillor:'Bharat Shah',    repairCost:68000,createdAt:'2024-02-24'},
  {_id:'s15',location:{name:'Poonamallee High Road, Koyambedu',    lat:13.0694,lng:80.1948},type:'Pothole',severity:'high',  riskScore:85,confidence:0.93,status:'Reported',   reporter:'Rajan M.',   city:'Chennai',  ward:'Koyambedu Ward',     councillor:'S. Vijayan',     repairCost:65000,createdAt:'2024-02-23'},
]

// ── SVG Icons (no emoji, no images) ──────────────────────────────────────────
const Icon = ({ name, size=18, color='currentColor', sw=1.8 }) => {
  const p = { fill:'none', stroke:color, strokeWidth:sw, strokeLinecap:'round', strokeLinejoin:'round' }
  const paths = {
    road:     <><path d="M3 17l9-14 9 14"/><path d="M12 3v14"/><path d="M7 17h10"/></>,
    map:      <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
    pin:      <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    alert:    <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    check:    <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    camera:   <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    chart:    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    brain:    <><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.66z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.66z"/></>,
    shield:   <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    moon:     <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    sun:      <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    logout:   <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    user:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    chevron:  <polyline points="6 9 12 15 18 9"/>,
    x:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    dollar:   <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22V12h6v10M8 6h.01M16 6h.01M8 10h.01M16 10h.01"/></>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    upload:   <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    star:     <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" {...p}>{paths[name]}</svg>
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimCounter({ value, duration=1200 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  const inView = useInView(ref, { once:true })
  useEffect(() => {
    if (!inView) return
    const start = Date.now(), end = +String(value).replace(/[^0-9]/g,'') || 0
    const prefix = String(value).replace(/[0-9.,]/g,'')
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * end))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, value, duration])
  return <span ref={ref}>{display.toLocaleString('en-IN')}</span>
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, delta, sub }) {
  const ref = useRef()
  const inView = useInView(ref, { once:true })
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:24 }} animate={inView?{opacity:1,y:0}:{opacity:0,y:24}} transition={{ duration:0.5 }}
      whileHover={{ y:-4, transition:{duration:0.15} }}
      style={{ background:C.bg2, border:`1px solid ${C.bdr}`, borderRadius:8, padding:'18px 20px', borderTop:`2px solid ${accent}`, position:'relative', overflow:'hidden', cursor:'default' }}>
      {/* Corner accents */}
      <div style={{ position:'absolute', top:0, right:0, width:16, height:16, borderTop:`1px solid ${accent}`, borderRight:`1px solid ${accent}` }}/>
      <div style={{ position:'absolute', bottom:0, left:0, width:16, height:16, borderBottom:`1px solid ${accent}44`, borderLeft:`1px solid ${accent}44` }}/>
      {/* Glow */}
      <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:accent+'0a', pointerEvents:'none' }}/>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ width:38, height:38, borderRadius:6, background:accent+'18', border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', color:accent }}>
          {icon}
        </div>
        {delta!==undefined && (
          <span className="mono" style={{ fontSize:11, fontWeight:600, color:delta>=0?C.green:C.red, background:delta>=0?'rgba(0,230,118,0.08)':'rgba(255,61,90,0.08)', padding:'2px 7px', borderRadius:3 }}>
            {delta>=0?'+':''}{delta}%
          </span>
        )}
      </div>
      <div className="mono" style={{ fontSize:28, fontWeight:700, color:C.tx1, letterSpacing:'-0.04em', lineHeight:1 }}>
        {typeof value === 'number' ? <AnimCounter value={value}/> : value}
      </div>
      <div style={{ fontSize:12, color:C.tx2, marginTop:6, fontWeight:500 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.tx3, marginTop:3, fontFamily:'var(--mono)' }}>{sub}</div>}
    </motion.div>
  )
}

// ── Section wrapper with scroll animation ────────────────────────────────────
function Section({ children, delay=0 }) {
  const ref = useRef()
  const inView = useInView(ref, { once:true, margin:'-60px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, y:32 }} animate={inView?{opacity:1,y:0}:{opacity:0,y:32}}
      transition={{ duration:0.55, delay, ease:[0.22,1,0.36,1] }}>
      {children}
    </motion.div>
  )
}

// ── Report row ────────────────────────────────────────────────────────────────
function ReportRow({ r, selected, onClick, i }) {
  const id = r._id??r.id, score = r.riskScore??r.risk??50
  const ref = useRef()
  const inView = useInView(ref, { once:true })
  const sevClass = r.severity==='high'?'sev-high':r.severity==='medium'?'sev-medium':'sev-low'
  const stClass  = r.status==='Resolved'?'st-resolved':r.status==='In Progress'?'st-progress':'st-reported'
  return (
    <motion.div ref={ref}
      initial={{ opacity:0, x:-12 }} animate={inView?{opacity:1,x:0}:{opacity:0,x:-12}} transition={{ delay:i*0.03 }}
      onClick={onClick} whileHover={{ x:3, backgroundColor:'rgba(0,212,255,0.04)' }}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:6, cursor:'pointer', transition:'background 0.15s',
        background: selected?'rgba(0,212,255,0.06)':'transparent',
        border: `1px solid ${selected?C.bdr:C.bdr2}` }}>
      <div style={{ width:7, height:7, borderRadius:'50%', background:rc(score), flexShrink:0, boxShadow:`0 0 8px ${rc(score)}88` }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.tx1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {r.location?.name??r.location??'Unknown'}
        </div>
        <div style={{ fontSize:10, color:C.tx3, marginTop:2, fontFamily:'var(--mono)' }}>
          {r.type} · {r.city??'—'} · {new Date(r.createdAt??Date.now()).toLocaleDateString('en-IN')}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
        <span className={sevClass}>{(r.severity??'med').toUpperCase()}</span>
        <span className="mono" style={{ fontSize:15, fontWeight:700, color:rc(score) }}>{score}</span>
      </div>
    </motion.div>
  )
}

// ── GovField ──────────────────────────────────────────────────────────────────
function GovField({ label, type, placeholder, value, onChange, required }) {
  const [focus, setFocus] = useState(false)
  return (
    <div>
      <label className="label" style={{ marginBottom:8, fontSize:10 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        className="input-dark"
        style={{ borderColor: focus?C.cyan:C.bdr }}
      />
    </div>
  )
}

// ── Upload panel ──────────────────────────────────────────────────────────────
function UploadPanel({ token, onDone }) {
  const [drag,  setDrag]  = useState(false)
  const [file,  setFile]  = useState(null)
  const [prev,  setPrev]  = useState(null)
  const [busy,  setBusy]  = useState(false)
  const [res,   setRes]   = useState(null)
  const [loc,   setLoc]   = useState(null)
  const [name,  setName]  = useState('')
  const [done,  setDone]  = useState(false)
  const [step,  setStep]  = useState('pick')
  const [prog,  setProg]  = useState({ msg:'', pct:0 })
  const fRef = useRef()

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setLoc({ lat:p.coords.latitude, lng:p.coords.longitude }),
      () => setLoc({ lat:28.6139, lng:77.209 })
    )
  }, [])

  const pick = f => {
    if (!f?.type.startsWith('image/')) return
    setFile(f); setRes(null); setDone(false); setStep('analyze')
    const r = new FileReader(); r.onload=e=>setPrev(e.target.result); r.readAsDataURL(f)
  }
  const analyze = async () => {
    setBusy(true); setProg({ msg:'Initializing…', pct:5 })
    try { const result = await runDemoAI((msg,pct)=>setProg({msg,pct})); setRes(result); setStep('submit') }
    finally { setBusy(false); setProg({msg:'',pct:0}) }
  }
  const submit = async () => {
    if (!file||!res) return; setBusy(true)
    try {
      const fd=new FormData()
      fd.append('image',file); fd.append('lat',loc?.lat||28.6139); fd.append('lng',loc?.lng||77.209)
      fd.append('locationName',name||'Reported Location'); fd.append('severity',res.severity)
      fd.append('riskScore',res.riskScore); fd.append('detections',JSON.stringify(res.detections))
      onDone(await api.createReport(token,fd)); setDone(true)
    } catch(e){console.error(e)} finally{setBusy(false)}
  }
  const reset = ()=>{ setFile(null);setPrev(null);setRes(null);setDone(false);setStep('pick') }

  if (done) return (
    <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
      style={{ textAlign:'center', padding:'48px 24px', background:C.bg2, border:`1px solid ${C.bdr}`, borderRadius:8 }}>
      <div style={{ width:56,height:56,borderRadius:'50%',background:'rgba(0,230,118,0.1)',border:`1px solid ${C.green}44`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:C.green }}>
        <Icon name="check" size={24} color={C.green}/>
      </div>
      <div style={{ fontSize:18, fontWeight:700, color:C.tx1, marginBottom:8 }}>Report Submitted Successfully</div>
      <div style={{ fontSize:13, color:C.tx2, marginBottom:6 }}>
        Risk Score: <span className="mono" style={{ color:rc(res.riskScore), fontWeight:700 }}>{res.riskScore}/100</span>
      </div>
      <div className="mono" style={{ fontSize:11, color:C.cyan, marginBottom:24, padding:'6px 14px', background:C.cyan3, border:`1px solid ${C.bdr}`, borderRadius:4, display:'inline-block', letterSpacing:'0.08em' }}>
        REF: RW-{Date.now().toString().slice(-7)}
      </div>
      <br/>
      <button onClick={reset} style={{ padding:'9px 22px', borderRadius:4, border:`1px solid ${C.orange}`, background:'rgba(255,107,53,0.1)', color:C.orange, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
        REPORT ANOTHER ISSUE
      </button>
    </motion.div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Step indicator */}
      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
        {[['01','UPLOAD','pick'],['02','AI SCAN','analyze'],['03','SUBMIT','submit']].map(([num,l,s],i) => {
          const active=step===s, done2=['pick','analyze','submit'].indexOf(step)>i
          return (
            <div key={s} style={{ display:'flex', alignItems:'center', flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div className="mono" style={{ width:28,height:28,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,
                  background:active?C.cyan:done2?'rgba(0,230,118,0.15)':'transparent',
                  color:active?C.bg:done2?C.green:C.tx3,
                  border:`1px solid ${active?C.cyan:done2?C.green:C.bdr2}` }}>
                  {done2 ? <Icon name="check" size={12} color={C.green}/> : num}
                </div>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:active?C.cyan:done2?C.green:C.tx3 }}>{l}</span>
              </div>
              {i<2&&<div style={{ flex:1, height:1, margin:'0 10px', background:done2?C.green:C.bdr2 }}/>}
            </div>
          )
        })}
      </div>

      {!prev ? (
        <motion.div onClick={()=>fRef.current?.click()}
          onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);pick(e.dataTransfer.files[0])}}
          whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
          style={{ border:`1px dashed ${drag?C.cyan:C.bdr}`, background:drag?'rgba(0,212,255,0.04)':'transparent', borderRadius:8, padding:'44px 24px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', position:'relative' }}>
          <div className="corner-tl"/><div className="corner-tr"/><div className="corner-bl"/><div className="corner-br"/>
          <input ref={fRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>pick(e.target.files[0])}/>
          <div style={{ width:52,height:52,borderRadius:8,background:C.cyan3,border:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:C.cyan }}>
            <Icon name="upload" size={24} color={C.cyan}/>
          </div>
          <div style={{ fontWeight:600, color:C.tx1, fontSize:14, marginBottom:6 }}>UPLOAD ROAD DAMAGE PHOTO</div>
          <div style={{ fontSize:12, color:C.tx3 }}>Drag & drop or click to browse · PNG, JPG, WEBP · Max 10MB</div>
        </motion.div>
      ) : (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{ position:'relative', background:'#000', borderRadius:8, overflow:'hidden', border:`1px solid ${C.bdr}` }}>
            {res
              ? <AIDetectionCanvas imageUrl={prev} detections={res.detections} modelName={res.model} processingMs={res.processingMs}/>
              : <img src={prev} alt="preview" style={{width:'100%',maxHeight:280,objectFit:'contain',display:'block'}}/>}
            {busy&&(
              <div style={{ position:'absolute',inset:0,background:'rgba(2,9,20,0.85)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:28 }}>
                <div style={{ width:'75%', background:'rgba(0,212,255,0.1)', borderRadius:2, height:4, overflow:'hidden', border:`1px solid ${C.bdr}` }}>
                  <motion.div animate={{ width:`${prog.pct}%` }} transition={{ duration:0.4 }}
                    style={{ height:'100%', background:C.cyan, boxShadow:`0 0 12px ${C.cyan}` }}/>
                </div>
                <div style={{ fontSize:12, color:C.tx2, fontWeight:600, letterSpacing:'0.04em' }}>{prog.msg}</div>
                <div className="mono" style={{ fontSize:10, color:C.tx3 }}>YOLOv8n-CRDDC · {prog.pct}%</div>
              </div>
            )}
            {res&&<div style={{ position:'absolute',top:8,right:8,background:'rgba(0,230,118,0.85)',color:C.bg,padding:'4px 10px',borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:'0.06em',display:'flex',alignItems:'center',gap:5 }}>
              <Icon name="check" size={10} color={C.bg}/>DETECTION COMPLETE
            </div>}
          </div>

          {res&&(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              {[['DETECTIONS',res.detections.length,C.cyan],['RISK SCORE',`${res.riskScore}/100`,rc(res.riskScore)],['SEVERITY',res.severity.toUpperCase(),rc(res.riskScore)]].map(([l,v,col])=>(
                <div key={l} style={{background:C.bg3,border:`1px solid ${C.bdr}`,borderRadius:6,padding:'12px',textAlign:'center',position:'relative',overflow:'hidden'}}>
                  <div className="label" style={{justifyContent:'center',marginBottom:6,fontSize:9}}>{l}</div>
                  <div className="mono" style={{fontSize:16,fontWeight:700,color:col}}>{v}</div>
                </div>
              ))}
            </motion.div>
          )}

          {res&&(
            <div style={{ background:C.bg3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:'8px 12px', fontSize:11 }}>
              <span className="mono" style={{color:C.tx3}}>MODEL: </span><span style={{color:C.cyan,fontWeight:600}}>{res.model}</span>
              <span className="mono" style={{color:C.tx3,margin:'0 12px'}}>·</span>
              <span className="mono" style={{color:C.tx3}}>INFERENCE: </span><span style={{color:C.tx2}}>{res.processingMs}ms</span>
              <span className="mono" style={{color:C.tx3,margin:'0 12px'}}>·</span>
              <span className="mono" style={{color:C.tx3}}>OBJECTS: </span><span style={{color:C.tx2}}>{res.detections.length}</span>
            </div>
          )}

          {res&&<input className="input-dark" placeholder="LOCATION NAME (e.g. NH-48, near Toll Plaza)" value={name} onChange={e=>setName(e.target.value)} style={{textTransform:'uppercase',fontSize:12,letterSpacing:'0.04em'}}/>}

          <div style={{display:'flex',gap:10}}>
            {step==='analyze'&&!busy&&(
              <button onClick={analyze} style={{flex:1,padding:'11px',borderRadius:4,border:`1px solid ${C.cyan}`,background:C.cyan3,color:C.cyan,fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:13,letterSpacing:'0.04em'}}>
                RUN AI ANALYSIS
              </button>
            )}
            {step==='submit'&&(
              <button onClick={submit} disabled={busy} style={{flex:1,padding:'11px',borderRadius:4,border:'none',background:C.orange,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:13,letterSpacing:'0.04em',opacity:busy?0.6:1}}>
                {busy?'SUBMITTING…':'SUBMIT REPORT'}
              </button>
            )}
            <button onClick={reset} style={{padding:'11px 14px',borderRadius:4,border:`1px solid ${C.bdr2}`,background:'transparent',color:C.tx3,cursor:'pointer',display:'flex',alignItems:'center'}}>
              <Icon name="x" size={14} color={C.tx3}/>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, token, login, signup, logout, loading } = useAuth()
  const [tab,        setTab]       = useState('overview')
  const [ftab,       setFtab]      = useState('budget')
  const [authMode,   setAuthMode]  = useState(null)
  const [authForm,   setAuthForm]  = useState({name:'',email:'',password:''})
  const [authErr,    setAuthErr]   = useState('')
  const [authBusy,   setAuthBusy]  = useState(false)
  const [mapType,    setMapType]   = useState('roadmap')
  const [heatmap,    setHeatmap]   = useState(false)
  const [reports,    setReports]   = useState(SEED)
  const [stats,      setStats]     = useState(null)
  const [trends,     setTrends]    = useState([])
  const [topDanger,  setTopDanger] = useState([])
  const [selected,   setSelected]  = useState(null)
  const [filterSev,  setFilterSev] = useState('all')
  const [filterStat, setFilterStat]= useState('all')
  const [notif,      setNotif]     = useState(null)
  const [menuOpen,   setMenuOpen]  = useState(false)
  const menuRef = useRef()

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const toast = (msg,type='ok') => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3500) }

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [rD,sD,tD,dD] = await Promise.allSettled([
        api.getReports(token,{severity:filterSev!=='all'?filterSev:undefined,status:filterStat!=='all'?filterStat:undefined}),
        api.getStats(token), api.getTrends(token), api.getTopDangerous(token),
      ])
      if (rD.status==='fulfilled') { const r=rD.value?.reports??rD.value??[]; if(r.length) setReports(r) }
      if (sD.status==='fulfilled') setStats(sD.value)
      if (tD.status==='fulfilled') setTrends(tD.value??[])
      if (dD.status==='fulfilled') setTopDanger(dD.value??[])
    } catch {}
  }, [token, filterSev, filterStat])

  useEffect(()=>{ load() },[load])

  const handleNew = r => { setReports(p=>[r,...p]); toast(`REPORT SUBMITTED · RISK: ${r.riskScore}/100`); setTab('map') }
  const updateStatus = async (id,status) => {
    try { const u=await api.updateStatus(token,id,status); setReports(p=>p.map(r=>(r._id??r.id)===id?u:r)); toast(`STATUS → ${status.toUpperCase()}`) }
    catch(e) { toast(e.message,'err') }
  }
  const handleAuth = async e => {
    e.preventDefault(); setAuthErr(''); setAuthBusy(true)
    try {
      if (authMode==='login') await login(authForm.email,authForm.password)
      else await signup(authForm.name,authForm.email,authForm.password)
      setAuthMode(null); setAuthForm({name:'',email:'',password:''})
    } catch(err) { setAuthErr(err.message) }
    finally { setAuthBusy(false) }
  }

  const sel  = reports.find(r=>(r._id??r.id)===selected)
  const tabs = user
    ? [['overview','OVERVIEW'],['map','LIVE MAP'],['report','REPORT'],['analytics','ANALYTICS'],['features','AI TOOLS']]
    : [['overview','OVERVIEW'],['map','LIVE MAP']]

  const sevBadge = s => s==='high'?'sev-high':s==='medium'?'sev-medium':'sev-low'
  const stBadge  = s => s==='Resolved'?'st-resolved':s==='In Progress'?'st-progress':'st-reported'

  const CT = {  // common token shorthand
    card: { background:C.bg2, border:`1px solid ${C.bdr}`, borderRadius:8 },
    row: { display:'grid', gap:16 },
  }

  if (loading) return (
    <div className="grid-bg" style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{color:C.cyan,marginBottom:8}}><Icon name="road" size={40} color={C.cyan}/></div>
      <div style={{width:32,height:32,border:`2px solid ${C.bdr}`,borderTopColor:C.cyan,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <div className="mono" style={{fontSize:11,color:C.tx3,letterSpacing:'0.12em'}}>INITIALIZING ROADWATCH AI…</div>
    </div>
  )

  return (
    <div className="grid-bg" style={{minHeight:'100vh',background:C.bg,color:C.tx1,fontFamily:"'Inter',system-ui,sans-serif"}}>

      {/* TOAST */}
      <AnimatePresence>
        {notif&&(
          <motion.div initial={{opacity:0,y:-24,x:'-50%'}} animate={{opacity:1,y:0,x:'-50%'}} exit={{opacity:0,y:-16,x:'-50%'}}
            className="mono"
            style={{position:'fixed',top:20,left:'50%',zIndex:9999,padding:'9px 20px',borderRadius:4,fontSize:12,fontWeight:600,whiteSpace:'nowrap',letterSpacing:'0.05em',
              background:notif.type==='err'?'rgba(255,61,90,0.15)':'rgba(0,230,118,0.1)',
              border:`1px solid ${notif.type==='err'?C.red:C.green}44`,
              color:notif.type==='err'?C.red:C.green,
              boxShadow:`0 0 24px ${notif.type==='err'?'rgba(255,61,90,0.2)':'rgba(0,230,118,0.2)'}`,
            }}>
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header style={{ background:`linear-gradient(135deg,${C.bg1},${C.bg2})`, borderBottom:`1px solid ${C.bdr}`, position:'relative', overflow:'hidden' }}>
        {/* Scan line effect */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,212,255,0.03) 0%,transparent 100%)', pointerEvents:'none' }}/>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, position:'relative', zIndex:1 }}>

          {/* Logo — SVG icon, no image */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:8, background:C.cyan3, border:`1px solid ${C.bdr}`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', flexShrink:0 }}>
              <div className="corner-tl"/><div className="corner-tr"/><div className="corner-bl"/><div className="corner-br"/>
              <Icon name="road" size={22} color={C.cyan} sw={1.5}/>
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontWeight:900, fontSize:18, color:C.tx1, letterSpacing:'-0.03em' }}>ROADWATCH</span>
                <span className="mono" style={{ fontSize:11, fontWeight:700, color:C.cyan, background:C.cyan3, border:`1px solid ${C.bdr}`, padding:'2px 7px', borderRadius:3, letterSpacing:'0.08em' }}>AI</span>
              </div>
              <div className="mono" style={{ fontSize:9, color:C.tx3, letterSpacing:'0.12em', marginTop:2 }}>SMART ROAD INTELLIGENCE · GOV OF INDIA</div>
            </div>
          </div>

          {/* Center — live status */}
          <div className="hide-sm" style={{ display:'flex', alignItems:'center', gap:16, background:C.bg3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:'8px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span className="dot-green"/>
              <span className="mono" style={{ fontSize:11, color:C.tx2, letterSpacing:'0.06em' }}>SYSTEM OPERATIONAL</span>
            </div>
            <div style={{ width:1, height:16, background:C.bdr }}/>
            <span className="mono" style={{ fontSize:11, color:C.tx3 }}>{reports.length} INCIDENTS TRACKED</span>
            <div style={{ width:1, height:16, background:C.bdr }}/>
            <span className="mono" style={{ fontSize:11, color:C.tx3 }}>8 CITIES</span>
          </div>

          {/* Right controls */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {!user ? (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setAuthMode('login')}
                  style={{ padding:'8px 18px', borderRadius:4, border:`1px solid ${C.bdr}`, background:'transparent', color:C.tx2, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.04em' }}>
                  SIGN IN
                </button>
                <button onClick={()=>setAuthMode('signup')}
                  style={{ padding:'8px 18px', borderRadius:4, border:`1px solid ${C.orange}`, background:'rgba(255,107,53,0.1)', color:C.orange, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.04em' }}>
                  REGISTER
                </button>
              </div>
            ) : (
              <div ref={menuRef} style={{ position:'relative' }}>
                <button onClick={()=>setMenuOpen(m=>!m)}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 14px', borderRadius:4, border:`1px solid ${menuOpen?C.cyan:C.bdr}`, background:menuOpen?C.cyan3:'transparent', color:C.tx1, cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600, letterSpacing:'0.04em', transition:'all 0.2s' }}>
                  <div style={{ width:28, height:28, borderRadius:4, background:`linear-gradient(135deg,${C.cyan},#0088aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:C.bg }}>
                    {user.name?.[0]?.toUpperCase()||'U'}
                  </div>
                  <span className="hide-sm">{user.name.split(' ')[0].toUpperCase()}</span>
                  <motion.span animate={{ rotate:menuOpen?180:0 }} transition={{ duration:0.2 }}>
                    <Icon name="chevron" size={12} color={C.tx2}/>
                  </motion.span>
                </button>

                {/* Dropdown — HIGH z-index, fixed positioning context */}
                <AnimatePresence>
                  {menuOpen&&(
                    <motion.div
                      initial={{ opacity:0, y:8, scale:0.97 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      exit={{ opacity:0, y:4, scale:0.97 }}
                      transition={{ duration:0.15 }}
                      style={{
                        position:'absolute', right:0, top:'calc(100% + 10px)',
                        width:220, zIndex:99999,
                        background:C.bg2,
                        border:`1px solid ${C.bdr}`,
                        borderRadius:8,
                        boxShadow:`0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px ${C.bdr}`,
                        overflow:'hidden',
                      }}>
                      {/* Top accent line */}
                      <div style={{ height:2, background:`linear-gradient(90deg,${C.cyan},transparent)` }}/>
                      <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.bdr2}` }}>
                        <div style={{ fontSize:13, fontWeight:700, color:C.tx1 }}>{user.name}</div>
                        <div style={{ fontSize:11, color:C.tx3, marginTop:2 }}>{user.email}</div>
                        <div className="mono" style={{ fontSize:9, color:C.cyan, marginTop:6, letterSpacing:'0.08em' }}>
                          {user.role==='admin'?'ADMINISTRATOR':'FIELD OFFICER'}
                        </div>
                      </div>
                      <button onClick={()=>{logout();setMenuOpen(false)}}
                        style={{ width:'100%', padding:'12px 16px', border:'none', background:'transparent', color:C.red, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', alignItems:'center', gap:10, letterSpacing:'0.02em', transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,61,90,0.06)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <Icon name="logout" size={14} color={C.red}/>
                        SIGN OUT
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav style={{ background:C.bg1, borderBottom:`1px solid ${C.bdr2}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:48 }}>
          <div style={{ display:'flex', gap:0 }}>
            {tabs.map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                className="mono"
                style={{ padding:'0 20px', height:48, border:'none', borderBottom:tab===id?`2px solid ${C.cyan}`:'2px solid transparent', background:'transparent', color:tab===id?C.cyan:C.tx3, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--mono)', letterSpacing:'0.08em', transition:'all 0.15s', position:'relative' }}>
                {label}
                {tab===id&&<motion.div layoutId="nav-indicator" style={{ position:'absolute', bottom:-1, left:0, right:0, height:2, background:C.cyan, boxShadow:`0 0 8px ${C.cyan}` }}/>}
              </button>
            ))}
          </div>
          <div className="mono hide-sm" style={{ fontSize:10, color:C.tx3, letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:8 }}>
            <span className="dot-green"/>
            LIVE MONITORING ACTIVE
          </div>
        </div>
      </nav>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authMode&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:'fixed', inset:0, background:'rgba(2,9,20,0.92)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(8px)' }}
            onClick={e=>e.target===e.currentTarget&&setAuthMode(null)}>
            <motion.div initial={{scale:0.93,y:24}} animate={{scale:1,y:0}} exit={{scale:0.93,y:16}}
              style={{ background:C.bg2, border:`1px solid ${C.bdr}`, borderRadius:8, width:'100%', maxWidth:420, overflow:'hidden', boxShadow:`0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px ${C.bdr}` }}>
              {/* Header */}
              <div style={{ background:C.bg3, borderBottom:`1px solid ${C.bdr}`, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
                <div style={{ height:2, position:'absolute', top:0, left:0, right:0, background:`linear-gradient(90deg,${C.cyan},${C.orange},transparent)` }}/>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:6, background:C.cyan3, border:`1px solid ${C.bdr}`, display:'flex', alignItems:'center', justifyContent:'center', color:C.cyan }}>
                    <Icon name="shield" size={18} color={C.cyan}/>
                  </div>
                  <div>
                    <div style={{ fontWeight:800, color:C.tx1, fontSize:15, letterSpacing:'-0.02em' }}>ROADWATCH AI</div>
                    <div className="mono" style={{ fontSize:9, color:C.tx3, letterSpacing:'0.1em', marginTop:2 }}>SECURE GOVERNMENT PORTAL</div>
                  </div>
                </div>
                <button onClick={()=>setAuthMode(null)} style={{ background:C.bg2, border:`1px solid ${C.bdr}`, color:C.tx3, width:28, height:28, borderRadius:4, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="x" size={13} color={C.tx3}/>
                </button>
              </div>
              {/* Tabs */}
              <div style={{ display:'flex', borderBottom:`1px solid ${C.bdr2}` }}>
                {['login','signup'].map(m=>(
                  <button key={m} onClick={()=>{setAuthMode(m);setAuthErr('')}}
                    className="mono"
                    style={{ flex:1, padding:'13px 0', border:'none', borderBottom:authMode===m?`2px solid ${C.cyan}`:'2px solid transparent', background:'transparent', color:authMode===m?C.cyan:C.tx3, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--mono)', letterSpacing:'0.08em', transition:'all 0.15s' }}>
                    {m==='login'?'SIGN IN':'REGISTER'}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAuth} style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
                <AnimatePresence>
                  {authMode==='signup'&&(
                    <motion.div key="name" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden'}}>
                      <GovField label="FULL NAME" type="text" placeholder="Enter your full name" value={authForm.name} onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))} required/>
                    </motion.div>
                  )}
                </AnimatePresence>
                <GovField label="EMAIL ADDRESS" type="email" placeholder="officer@gov.in" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} required/>
                <GovField label="PASSWORD" type="password" placeholder="Minimum 6 characters" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} required/>
                {authErr&&(
                  <div style={{ background:'rgba(255,61,90,0.08)', border:`1px solid rgba(255,61,90,0.2)`, color:C.red, padding:'10px 14px', borderRadius:4, fontSize:12 }}>
                    {authErr}
                  </div>
                )}
                <button type="submit" disabled={authBusy}
                  style={{ padding:'13px', borderRadius:4, border:'none', background:C.orange, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity:authBusy?0.7:1, letterSpacing:'0.04em' }}>
                  {authBusy?'PLEASE WAIT…':authMode==='login'?'SIGN IN →':'CREATE ACCOUNT →'}
                </button>
                <div className="mono" style={{ textAlign:'center', fontSize:10, color:C.tx3, padding:'9px', background:C.cyan3, border:`1px solid ${C.bdr}`, borderRadius:4, letterSpacing:'0.04em' }}>
                  DEMO ACCESS: <span style={{color:C.cyan}}>demo@roadwatch.ai</span> / <span style={{color:C.cyan}}>demo1234</span>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <main style={{ maxWidth:1400, margin:'0 auto', padding:'28px 24px' }}>
        <AnimatePresence mode="wait">

          {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
          {tab==='overview'&&(
            <motion.div key="ov" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:28}}>

              {/* Hero */}
              <Section>
                <div style={{ position:'relative', borderRadius:8, overflow:'hidden', border:`1px solid ${C.bdr}`, background:C.bg2, minHeight:280 }}>
                  {/* Animated grid overlay */}
                  <div className="grid-bg" style={{ position:'absolute', inset:0, opacity:0.6, pointerEvents:'none' }}/>
                  {/* Cyan glow orbs */}
                  <div style={{ position:'absolute', top:'-20%', left:'30%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 70%)', pointerEvents:'none' }}/>
                  <div style={{ position:'absolute', bottom:'-30%', right:'10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,53,0.05) 0%,transparent 70%)', pointerEvents:'none' }}/>

                  {/* Corner decorations */}
                  <div style={{position:'absolute',top:0,left:0,width:30,height:30,borderTop:`2px solid ${C.cyan}`,borderLeft:`2px solid ${C.cyan}`}}/>
                  <div style={{position:'absolute',top:0,right:0,width:30,height:30,borderTop:`2px solid ${C.cyan}`,borderRight:`2px solid ${C.cyan}`}}/>
                  <div style={{position:'absolute',bottom:0,left:0,width:30,height:30,borderBottom:`2px solid ${C.cyan}44`,borderLeft:`2px solid ${C.cyan}44`}}/>
                  <div style={{position:'absolute',bottom:0,right:0,width:30,height:30,borderBottom:`2px solid ${C.cyan}44`,borderRight:`2px solid ${C.cyan}44`}}/>

                  <div style={{ padding:'40px 48px', position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:32 }}>
                    <div style={{ maxWidth:560 }}>
                      <div className="label" style={{ marginBottom:16 }}>NATIONAL ROAD INTELLIGENCE SYSTEM</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:16 }}>
                        {[
                          ['3.47 Lakh', 'potholes across India'],
                          ['₹87,000 Cr', 'annual vehicle damage'],
                          ['1.47 Lakh', 'road accidents per year'],
                        ].map(([num,label],i)=>(
                          <motion.div key={num} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.12+0.2}}
                            style={{display:'flex',alignItems:'baseline',gap:10}}>
                            <span className="mono" style={{fontSize:28,fontWeight:900,color:C.cyan,letterSpacing:'-0.04em',lineHeight:1.1}}>{num}</span>
                            <span style={{fontSize:14,color:C.tx2}}>{label}</span>
                          </motion.div>
                        ))}
                      </div>
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
                        style={{fontSize:14,color:C.tx2,lineHeight:1.8,marginBottom:22,borderLeft:`2px solid ${C.orange}`,paddingLeft:14}}>
                        RoadWatch AI detects, scores, and routes every road hazard to the right authority — automatically. Powered by YOLOv8 · Serving 8 cities.
                      </motion.div>
                      {!user&&(
                        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.8}} style={{display:'flex',gap:12}}>
                          <button onClick={()=>setAuthMode('login')}
                            style={{padding:'11px 24px',borderRadius:4,border:`1px solid ${C.orange}`,background:'rgba(255,107,53,0.1)',color:C.orange,fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:13,letterSpacing:'0.04em'}}>
                            ACCESS PORTAL →
                          </button>
                          <button onClick={()=>setTab('map')}
                            style={{padding:'11px 24px',borderRadius:4,border:`1px solid ${C.bdr}`,background:'transparent',color:C.tx2,fontWeight:600,cursor:'pointer',fontFamily:'inherit',fontSize:13,letterSpacing:'0.04em'}}>
                            VIEW LIVE MAP
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* Stats panel */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, flexShrink:0 }} className="hide-sm">
                      {[['94%','AI Accuracy','YOLOv8n-CRDDC',C.cyan],['2.3×','Faster Repairs','vs manual survey',C.green],['₹4.2Cr','Cost Saved','per quarter',C.orange],['8 Cities','Coverage','expanding',C.purple]].map(([v,l,sub,c])=>(
                        <motion.div key={l} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.3}}
                          style={{background:C.bg3,border:`1px solid ${C.bdr}`,borderRadius:6,padding:'14px 16px',position:'relative',overflow:'hidden'}}>
                          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${c},transparent)`}}/>
                          <div className="mono" style={{fontSize:22,fontWeight:700,color:c,letterSpacing:'-0.04em'}}>{v}</div>
                          <div style={{fontSize:12,color:C.tx2,marginTop:4,fontWeight:600}}>{l}</div>
                          <div className="mono" style={{fontSize:9,color:C.tx3,marginTop:2}}>{sub}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Stats row */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}} className="g4">
                <StatCard label="Total Reports"   value={stats?.total??reports.length}                               icon={<Icon name="pin"    size={18} color={C.orange}/>} accent={C.orange} delta={12} sub={`${reports.filter(r=>r.status==='Reported').length} pending action`}/>
                <StatCard label="High Risk Zones" value={stats?.high??reports.filter(r=>r.severity==='high').length} icon={<Icon name="alert"  size={18} color={C.red}/>}    accent={C.red}    delta={-5} sub="immediate attention needed"/>
                <StatCard label="Pending Repairs" value={stats?.pending??reports.filter(r=>r.status==='Reported').length} icon={<Icon name="clock"  size={18} color={C.amber}/>}  accent={C.amber}           sub="awaiting municipal action"/>
                <StatCard label="Issues Resolved" value={stats?.resolved??reports.filter(r=>r.status==='Resolved').length} icon={<Icon name="check"  size={18} color={C.green}/>}  accent={C.green}  delta={28} sub="successfully closed"/>
              </div>

              {/* Map + Feed */}
              <Section delay={0.1}>
                <div style={{display:'grid',gridTemplateColumns:'1.8fr 1fr',gap:18}} className="g21">
                  <div style={{...CT.card,padding:18}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                      <div>
                        <div className="label" style={{marginBottom:4}}>INCIDENT MAP</div>
                        <div style={{fontSize:13,fontWeight:600,color:C.tx1}}>Live Road Damage Feed</div>
                      </div>
                      <button onClick={()=>setTab('map')} className="mono"
                        style={{padding:'6px 14px',borderRadius:4,border:`1px solid ${C.bdr}`,background:'transparent',color:C.cyan,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'var(--mono)',letterSpacing:'0.08em'}}>
                        FULL MAP →
                      </button>
                    </div>
                    <LeafletMapView reports={reports} selectedId={selected} onSelect={setSelected} mapType={mapType} showHeatmap={false}/>
                  </div>

                  <div style={{...CT.card,padding:18,display:'flex',flexDirection:'column'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                      <div className="label">LIVE REPORTS</div>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <span className="dot-green"/>
                        <span className="mono" style={{fontSize:10,color:C.tx3,letterSpacing:'0.06em'}}>LIVE</span>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,overflowY:'auto',maxHeight:400}}>
                      {reports.slice(0,10).map((r,i)=>(
                        <ReportRow key={r._id??r.id} r={r} i={i} selected={selected===(r._id??r.id)} onClick={()=>{setSelected(r._id??r.id);setTab('map')}}/>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Damage types */}
              <Section delay={0.15}>
                <div style={{...CT.card,padding:22}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
                    <div>
                      <div className="label" style={{marginBottom:4}}>AI DETECTION CAPABILITY</div>
                      <div style={{fontSize:15,fontWeight:700,color:C.tx1}}>Road Damage Categories</div>
                    </div>
                    <div className="mono" style={{fontSize:10,color:C.tx3,background:C.bg3,border:`1px solid ${C.bdr}`,padding:'5px 12px',borderRadius:4,letterSpacing:'0.06em'}}>
                      YOLOv8n-CRDDC · 94% ACCURACY
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}} className="g3">
                    {[
                      [C.red,   'POTHOLE',   'Type D1/D40', 'Deep depressions caused by water infiltration and repeated traffic load. Primary cause of vehicle damage and accidents.'],
                      [C.amber, 'PAVEMENT CRACK','Type D10/D20', 'Surface fractures indicating structural fatigue. Early-stage detection prevents escalation to full pothole failure.'],
                      [C.green, 'DEGRADATION','Type D00/D01', 'General surface wear requiring preventive maintenance. Proactive treatment reduces long-term repair costs by 60%.'],
                    ].map(([color,title,code,desc])=>(
                      <motion.div key={title} whileHover={{y:-4,transition:{duration:0.15}}}
                        style={{background:C.bg3,border:`1px solid ${C.bdr}`,borderRadius:8,overflow:'hidden',position:'relative'}}>
                        <div style={{height:4,background:`linear-gradient(90deg,${color},transparent)`}}/>
                        <div style={{padding:'18px 18px 20px'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                            <div style={{width:36,height:36,borderRadius:6,background:color+'15',border:`1px solid ${color}30`,display:'flex',alignItems:'center',justifyContent:'center',color}}>
                              <Icon name="alert" size={18} color={color}/>
                            </div>
                            <span className="mono" style={{fontSize:9,color:C.tx3,letterSpacing:'0.06em'}}>{code}</span>
                          </div>
                          <div style={{fontWeight:800,fontSize:14,color:C.tx1,marginBottom:6,letterSpacing:'0.02em'}}>{title}</div>
                          <div style={{fontSize:12,color:C.tx2,lineHeight:1.65}}>{desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Section>

              {/* Impact metrics */}
              <Section delay={0.2}>
                <div style={{...CT.card,overflow:'hidden'}}>
                  <div style={{height:2,background:`linear-gradient(90deg,${C.cyan},${C.orange},${C.green},transparent)`}}/>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}} className="g21">
                    <div style={{padding:'28px 32px',borderRight:`1px solid ${C.bdr2}`}}>
                      <div className="label" style={{marginBottom:12}}>ESTIMATED PUBLIC IMPACT</div>
                      <div style={{fontSize:14,color:C.tx2,lineHeight:1.85}}>
                        Based on <strong style={{color:C.tx1}}>{stats?.resolved??reports.filter(r=>r.status==='Resolved').length} resolved incidents</strong>, RoadWatch AI estimates{' '}
                        <strong style={{color:C.cyan}}>₹{((stats?.resolved??reports.filter(r=>r.status==='Resolved').length)*12500).toLocaleString('en-IN')}</strong> in vehicle damage prevented and approximately{' '}
                        <strong style={{color:C.green}}>{Math.round((stats?.resolved??reports.filter(r=>r.status==='Resolved').length)*0.4)} accidents</strong> avoided this quarter.
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}} className="g2">
                      {[
                        ['₹'+((stats?.total??reports.length)*8500).toLocaleString('en-IN'),'Vehicle Damage Est.',C.red],
                        ['4.2 days','Avg. Response Time',C.amber],
                        [`${stats?.total>0?Math.round((stats?.resolved??0)/(stats?.total||1)*100):42}%`,'Completion Rate',C.green],
                        [reports.length,'Active Incidents',C.cyan],
                      ].map(([v,l,c],i)=>(
                        <div key={l} style={{padding:'20px 22px',borderBottom:i<2?`1px solid ${C.bdr2}`:'none',borderRight:i%2===0?`1px solid ${C.bdr2}`:'none'}}>
                          <div className="mono" style={{fontSize:20,fontWeight:700,color:c,letterSpacing:'-0.04em'}}>{v}</div>
                          <div style={{fontSize:11,color:C.tx3,marginTop:5}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}

          {/* ══ MAP ══════════════════════════════════════════════════════════ */}
          {tab==='map'&&(
            <motion.div key="map" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{...CT.card,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div>
                  <div className="label" style={{marginBottom:4}}>LIVE INCIDENT MAP</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.tx1}}>{reports.length} Active Incidents · 8 Cities</div>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <div style={{display:'flex',border:`1px solid ${C.bdr}`,borderRadius:4,overflow:'hidden'}}>
                    {[['roadmap','MAP'],['satellite','SAT'],['terrain','TERRAIN']].map(([t,l])=>(
                      <button key={t} onClick={()=>setMapType(t)} className="mono"
                        style={{padding:'7px 14px',border:'none',borderRight:`1px solid ${C.bdr}`,cursor:'pointer',fontFamily:'var(--mono)',fontSize:10,fontWeight:700,letterSpacing:'0.06em',
                          background:mapType===t?C.cyan:C.bg3,color:mapType===t?C.bg:C.tx3,transition:'all 0.15s'}}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>setHeatmap(h=>!h)} className="mono"
                    style={{padding:'7px 14px',borderRadius:4,border:`1px solid ${heatmap?C.red:C.bdr}`,background:heatmap?'rgba(255,61,90,0.1)':C.bg3,color:heatmap?C.red:C.tx3,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'var(--mono)',letterSpacing:'0.06em'}}>
                    HEATMAP {heatmap?'ON':'OFF'}
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div style={{...CT.card,padding:'10px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                  {[[C.red,'HIGH RISK (71-100)'],[C.amber,'MEDIUM (31-70)'],[C.green,'LOW RISK (0-30)']].map(([c,l])=>(
                    <div key={l} className="mono" style={{display:'flex',alignItems:'center',gap:7,fontSize:9,color:C.tx3,fontWeight:700,letterSpacing:'0.06em'}}>
                      <span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block',boxShadow:`0 0 6px ${c}`}}/>
                      {l}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:6}}>
                  {['all','high','medium','low'].map(s=>(
                    <button key={s} onClick={()=>setFilterSev(s)} className="mono"
                      style={{padding:'5px 11px',borderRadius:3,border:`1px solid ${filterSev===s?C.cyan:C.bdr2}`,cursor:'pointer',fontFamily:'var(--mono)',fontSize:9,fontWeight:700,letterSpacing:'0.06em',
                        background:filterSev===s?C.cyan2:'transparent',color:filterSev===s?C.cyan:C.tx3}}>
                      {s==='all'?'ALL':s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}} className="g21">
                <div style={{...CT.card,padding:14}}>
                  <LeafletMapView reports={reports.filter(r=>filterSev==='all'||(r.severity??'medium')===filterSev)} selectedId={selected} onSelect={setSelected} mapType={mapType} showHeatmap={heatmap}/>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <AnimatePresence mode="wait">
                    {sel ? (
                      <motion.div key="det" initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:12}}
                        style={{...CT.card,padding:20,position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${rc(sel.riskScore??50)},transparent)`}}/>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                          <div>
                            <div className="label" style={{marginBottom:4}}>INCIDENT DETAIL</div>
                            <div style={{fontWeight:700,fontSize:14,color:C.tx1,lineHeight:1.3,maxWidth:220}}>{sel.location?.name??'Unknown'}</div>
                            <div style={{fontSize:11,color:C.tx3,marginTop:4}}>{sel.type} · {sel.reporter??'Anonymous'}</div>
                          </div>
                          <button onClick={()=>setSelected(null)} style={{background:C.bg3,border:`1px solid ${C.bdr2}`,color:C.tx3,width:26,height:26,borderRadius:4,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Icon name="x" size={12} color={C.tx3}/>
                          </button>
                        </div>

                        {/* Risk gauge */}
                        <div style={{background:C.bg3,border:`1px solid ${C.bdr}`,borderRadius:6,padding:'16px',marginBottom:14,textAlign:'center',position:'relative',overflow:'hidden'}}>
                          <div className="label" style={{justifyContent:'center',marginBottom:8,fontSize:9}}>RISK SCORE</div>
                          <div className="mono" style={{fontSize:52,fontWeight:900,color:rc(sel.riskScore??50),letterSpacing:'-0.06em',lineHeight:1,textShadow:`0 0 30px ${rc(sel.riskScore??50)}66`}}>
                            {sel.riskScore??sel.risk??50}
                          </div>
                          <div className="mono" style={{fontSize:10,color:C.tx3,marginTop:3,letterSpacing:'0.06em'}}>OUT OF 100</div>
                          <div style={{height:4,background:C.bg2,borderRadius:999,overflow:'hidden',marginTop:12}}>
                            <motion.div initial={{width:0}} animate={{width:`${sel.riskScore??50}%`}} transition={{duration:0.8}}
                              style={{height:'100%',borderRadius:999,background:rc(sel.riskScore??50),boxShadow:`0 0 8px ${rc(sel.riskScore??50)}`}}/>
                          </div>
                        </div>

                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                          {[['SEVERITY',(sel.severity||'—').toUpperCase(),rc(sel.riskScore??50)],['CONFIDENCE',`${((sel.confidence||0.8)*100).toFixed(0)}%`,C.purple],['DATE',new Date(sel.createdAt??Date.now()).toLocaleDateString('en-IN'),null],['STATUS',sel.status??'Reported',null]].map(([l,v,c])=>(
                            <div key={l} style={{background:C.bg3,border:`1px solid ${C.bdr2}`,borderRadius:4,padding:'9px 10px'}}>
                              <div className="label" style={{fontSize:8,marginBottom:4}}>{l}</div>
                              <div className="mono" style={{fontSize:12,fontWeight:700,color:c||C.tx2}}>{v}</div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <div className="label" style={{fontSize:9,marginBottom:8}}>UPDATE STATUS</div>
                          <div style={{display:'flex',gap:6}}>
                            {['Reported','In Progress','Resolved'].map(s=>(
                              <button key={s} onClick={()=>{if(token)updateStatus(sel._id??sel.id,s);else toast('SIGN IN TO UPDATE','err')}}
                                className="mono"
                                style={{flex:1,padding:'7px 4px',borderRadius:3,border:`1px solid ${sel.status===s?C.cyan:C.bdr2}`,cursor:'pointer',fontFamily:'var(--mono)',fontSize:9,fontWeight:700,letterSpacing:'0.04em',
                                  background:sel.status===s?C.cyan2:'transparent',color:sel.status===s?C.cyan:C.tx3,transition:'all 0.15s'}}>
                                {s.split(' ')[0].toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="emp" initial={{opacity:0}} animate={{opacity:1}}
                        style={{...CT.card,padding:28,textAlign:'center'}}>
                        <div style={{width:44,height:44,borderRadius:6,background:C.bg3,border:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',color:C.tx3}}>
                          <Icon name="pin" size={20} color={C.tx3}/>
                        </div>
                        <div className="label" style={{justifyContent:'center',marginBottom:6,fontSize:9}}>NO INCIDENT SELECTED</div>
                        <div style={{fontSize:12,color:C.tx3,lineHeight:1.6}}>Click any marker on the map to view full incident details and update repair status</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ REPORT ════════════════════════════════════════════════════════ */}
          {tab==='report'&&(
            <motion.div key="rep" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              {!user ? (
                <div style={{...CT.card,padding:'56px 32px',textAlign:'center',maxWidth:520,margin:'0 auto',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.orange},transparent)`}}/>
                  <div className="corner-tl"/><div className="corner-tr"/>
                  <div style={{width:56,height:56,borderRadius:8,background:'rgba(255,107,53,0.1)',border:`1px solid ${C.orange}30`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:C.orange}}>
                    <Icon name="shield" size={26} color={C.orange}/>
                  </div>
                  <div className="label" style={{justifyContent:'center',marginBottom:8,fontSize:9}}>AUTHENTICATION REQUIRED</div>
                  <div style={{fontSize:20,fontWeight:700,color:C.tx1,marginBottom:10}}>Access Restricted</div>
                  <div style={{fontSize:14,color:C.tx2,marginBottom:24,lineHeight:1.7}}>Sign in with your government credentials to submit road damage reports to the municipal database.</div>
                  <button onClick={()=>setAuthMode('login')}
                    style={{padding:'12px 32px',borderRadius:4,border:`1px solid ${C.orange}`,background:'rgba(255,107,53,0.1)',color:C.orange,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.04em'}}>
                    SIGN IN TO REPORT →
                  </button>
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'start'}} className="g21">
                  <div style={{...CT.card,padding:22}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.orange},transparent)`,borderRadius:'8px 8px 0 0'}}/>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,paddingBottom:16,borderBottom:`1px solid ${C.bdr2}`}}>
                      <div style={{width:36,height:36,borderRadius:6,background:'rgba(255,107,53,0.1)',border:`1px solid ${C.orange}30`,display:'flex',alignItems:'center',justifyContent:'center',color:C.orange}}>
                        <Icon name="camera" size={18} color={C.orange}/>
                      </div>
                      <div>
                        <div className="label" style={{fontSize:9,marginBottom:3}}>DAMAGE REPORTING SYSTEM</div>
                        <div style={{fontWeight:700,fontSize:14,color:C.tx1}}>Submit Road Damage Report</div>
                      </div>
                    </div>
                    <UploadPanel token={token} onDone={handleNew}/>
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:16}}>
                    {/* How it works */}
                    <Section>
                      <div style={{...CT.card,padding:22}}>
                        <div className="label" style={{marginBottom:16}}>DETECTION PIPELINE</div>
                        <div style={{display:'flex',flexDirection:'column',gap:0}}>
                          {[['01','UPLOAD','Submit any road photo from your device or dashcam footage'],['02','INFERENCE','YOLOv8n-CRDDC identifies potholes and cracks with bounding box precision'],['03','RISK SCORE','Algorithm scores 0–100 based on severity, confidence, and context'],['04','DISPATCH','Municipal authority notified automatically with GPS and risk classification']].map(([num,t,d],idx,arr)=>(
                            <div key={num} style={{display:'flex',gap:14,paddingBottom:idx<arr.length-1?18:0,marginBottom:idx<arr.length-1?18:0,borderBottom:idx<arr.length-1?`1px solid ${C.bdr2}`:'none'}}>
                              <div className="mono" style={{width:30,height:30,borderRadius:4,background:C.cyan3,border:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:C.cyan,flexShrink:0,letterSpacing:'0.04em'}}>
                                {num}
                              </div>
                              <div>
                                <div style={{fontSize:12,fontWeight:700,color:C.tx1,marginBottom:3,letterSpacing:'0.02em'}}>{t}</div>
                                <div style={{fontSize:11,color:C.tx3,lineHeight:1.55}}>{d}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Section>

                    {/* Risk classification */}
                    <Section delay={0.1}>
                      <div style={{...CT.card,padding:22}}>
                        <div className="label" style={{marginBottom:16}}>RISK CLASSIFICATION MATRIX</div>
                        {[['71–100',C.red,'HIGH RISK','Immediate action. Emergency dispatch to municipal authority.'],['31–70',C.amber,'MEDIUM','Schedule repair within 14 days. Monitoring required.'],['0–30',C.green,'LOW RISK','Routine maintenance cycle. Next scheduled inspection.']].map(([r,c,l,d])=>(
                          <div key={r} style={{display:'flex',gap:12,alignItems:'center',marginBottom:10,padding:'11px 14px',background:C.bg3,border:`1px solid ${C.bdr2}`,borderRadius:4,borderLeft:`3px solid ${c}`}}>
                            <div className="mono" style={{fontWeight:900,fontSize:16,color:c,letterSpacing:'-0.04em',minWidth:52}}>{r}</div>
                            <div style={{borderLeft:`1px solid ${C.bdr2}`,paddingLeft:12}}>
                              <div style={{fontSize:11,fontWeight:700,color:c,letterSpacing:'0.04em',marginBottom:3}}>{l}</div>
                              <div style={{fontSize:11,color:C.tx3}}>{d}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ ANALYTICS ════════════════════════════════════════════════════ */}
          {tab==='analytics'&&(
            <motion.div key="an" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{...CT.card,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div>
                  <div className="label" style={{marginBottom:4}}>ANALYTICS DASHBOARD</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.tx1}}>Infrastructure Policy Intelligence</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  {['all','Reported','In Progress','Resolved'].map(s=>(
                    <button key={s} onClick={()=>setFilterStat(s)} className="mono"
                      style={{padding:'6px 13px',borderRadius:3,border:`1px solid ${filterStat===s?C.cyan:C.bdr2}`,cursor:'pointer',fontFamily:'var(--mono)',fontSize:9,fontWeight:700,letterSpacing:'0.06em',
                        background:filterStat===s?C.cyan2:'transparent',color:filterStat===s?C.cyan:C.tx3}}>
                      {s==='all'?'ALL':s.toUpperCase().replace(' ','_')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}} className="g4">
                <StatCard label="Total Reports"  value={stats?.total??reports.length}                               icon={<Icon name="pin"      size={18} color={C.orange}/>} accent={C.orange}/>
                <StatCard label="High Risk"      value={stats?.high??reports.filter(r=>r.severity==='high').length} icon={<Icon name="alert"    size={18} color={C.red}/>}    accent={C.red}/>
                <StatCard label="In Progress"    value={stats?.inProgress??reports.filter(r=>r.status==='In Progress').length} icon={<Icon name="activity" size={18} color={C.amber}/>}  accent={C.amber}/>
                <StatCard label="Resolved"       value={stats?.resolved??reports.filter(r=>r.status==='Resolved').length} icon={<Icon name="check"    size={18} color={C.green}/>}  accent={C.green} delta={28}/>
              </div>

              <Section>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}} className="g21">
                  <div style={{...CT.card,padding:22}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
                      <div className="label">TREND ANALYSIS — 6 MONTHS</div>
                      <div style={{display:'flex',gap:16}}>
                        {[[C.cyan,'Reported'],[C.green,'Resolved']].map(([c,l])=>(
                          <div key={l} className="mono" style={{display:'flex',alignItems:'center',gap:6,fontSize:9,color:C.tx3,fontWeight:700,letterSpacing:'0.06em'}}>
                            <span style={{width:12,height:3,borderRadius:1,background:c,display:'inline-block'}}/>
                            {l.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={trends.length>0?trends:[{month:'NOW',reports:reports.length,resolved:reports.filter(r=>r.status==='Resolved').length}]} margin={{top:5,right:5,left:-22,bottom:0}}>
                        <defs>
                          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.cyan} stopOpacity={0.25}/><stop offset="95%" stopColor={C.cyan} stopOpacity={0}/></linearGradient>
                          <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.2}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)"/>
                        <XAxis dataKey="month" tick={{fill:C.tx3,fontSize:10,fontFamily:'var(--mono)',fontWeight:600,letterSpacing:'0.06em'}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:C.tx3,fontSize:10,fontFamily:'var(--mono)'}} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{background:C.bg2,border:`1px solid ${C.bdr}`,borderRadius:6,fontSize:12,color:C.tx1,fontFamily:'var(--mono)'}}/>
                        <Area type="monotone" dataKey="reports"  stroke={C.cyan}  strokeWidth={2} fill="url(#cg)" name="REPORTED"/>
                        <Area type="monotone" dataKey="resolved" stroke={C.green} strokeWidth={2} fill="url(#gg)" name="RESOLVED"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{...CT.card,padding:22}}>
                    <div className="label" style={{marginBottom:16}}>SEVERITY DISTRIBUTION</div>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={[
                          {name:'HIGH',  value:stats?.bySeverity?.high  ||reports.filter(r=>r.severity==='high').length  ||1,color:C.red},
                          {name:'MEDIUM',value:stats?.bySeverity?.medium||reports.filter(r=>r.severity==='medium').length||1,color:C.amber},
                          {name:'LOW',   value:stats?.bySeverity?.low   ||reports.filter(r=>r.severity==='low').length   ||1,color:C.green},
                        ]} cx="50%" cy="50%" innerRadius={38} outerRadius={64} dataKey="value" paddingAngle={4}>
                          {[C.red,C.amber,C.green].map((c,i)=><Cell key={i} fill={c} opacity={0.9}/>)}
                        </Pie>
                        <Tooltip contentStyle={{background:C.bg2,border:`1px solid ${C.bdr}`,borderRadius:6,fontSize:11,fontFamily:'var(--mono)'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
                      {[['HIGH',C.red,stats?.bySeverity?.high||reports.filter(r=>r.severity==='high').length],['MEDIUM',C.amber,stats?.bySeverity?.medium||reports.filter(r=>r.severity==='medium').length],['LOW',C.green,stats?.bySeverity?.low||reports.filter(r=>r.severity==='low').length]].map(([l,c,v])=>(
                        <div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7}}>
                            <span style={{width:8,height:8,borderRadius:2,background:c,display:'inline-block'}}/>
                            <span className="mono" style={{fontSize:10,color:C.tx3,fontWeight:700,letterSpacing:'0.06em'}}>{l}</span>
                          </div>
                          <span className="mono" style={{fontSize:13,fontWeight:700,color:c}}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <Section delay={0.1}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}} className="g21">
                  {/* Danger zones */}
                  <div style={{...CT.card,padding:22}}>
                    <div className="label" style={{marginBottom:16}}>TOP DANGER ZONES</div>
                    {(topDanger.length>0?topDanger:[...reports].sort((a,b)=>(b.riskScore??0)-(a.riskScore??0))).slice(0,6).map((r,i)=>{
                      const score=r.riskScore??r.risk??50
                      return(
                        <motion.div key={r._id??i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}
                          style={{marginBottom:14}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <span className="mono" style={{fontSize:9,color:C.tx3,width:14,fontWeight:700}}>{String(i+1).padStart(2,'0')}</span>
                              <span style={{fontSize:12,color:C.tx2,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{r.location?.name??r.location??'Unknown'}</span>
                            </div>
                            <span className="mono" style={{fontWeight:900,fontSize:14,color:rc(score),textShadow:`0 0 8px ${rc(score)}66`}}>{score}</span>
                          </div>
                          <div style={{height:3,background:C.bg3,borderRadius:999,overflow:'hidden'}}>
                            <motion.div initial={{width:0}} animate={{width:`${score}%`}} transition={{delay:i*0.06+0.3,duration:0.7}}
                              style={{height:'100%',borderRadius:999,background:rc(score),boxShadow:`0 0 6px ${rc(score)}`}}/>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Reports table */}
                  <div style={{...CT.card,padding:22}}>
                    <div className="label" style={{marginBottom:16}}>ALL REPORTS</div>
                    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 60px',gap:10,padding:'7px 8px',background:C.bg3,border:`1px solid ${C.bdr2}`,borderRadius:4,marginBottom:6}}>
                      {['LOCATION','TYPE','SEVERITY','STATUS','RISK'].map(h=>(
                        <div key={h} className="mono" style={{fontSize:9,fontWeight:700,color:C.tx3,letterSpacing:'0.07em'}}>{h}</div>
                      ))}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:2,maxHeight:340,overflowY:'auto'}}>
                      {reports.filter(r=>filterStat==='all'||r.status===filterStat).map((r,i)=>{
                        const id=r._id??r.id, score=r.riskScore??r.risk??50
                        const sevC=r.severity==='high'?'sev-high':r.severity==='medium'?'sev-medium':'sev-low'
                        const stC=r.status==='Resolved'?'st-resolved':r.status==='In Progress'?'st-progress':'st-reported'
                        return(
                          <motion.div key={id} whileHover={{background:'rgba(0,212,255,0.04)'}} onClick={()=>{setSelected(id);setTab('map')}}
                            style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 60px',gap:10,padding:'9px 8px',borderRadius:4,cursor:'pointer',transition:'background 0.12s',borderBottom:`1px solid ${C.bdr2}`}}>
                            <div style={{fontSize:12,color:C.tx2,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.location?.name??r.location??'Unknown'}</div>
                            <div className="mono" style={{fontSize:10,color:C.tx3,fontWeight:600}}>{r.type?.toUpperCase()}</div>
                            <span className={sevC} style={{alignSelf:'center',width:'fit-content'}}>{(r.severity??'MED').toUpperCase()}</span>
                            <span className={stC} style={{alignSelf:'center',width:'fit-content',fontSize:9}}>{(r.status??'Reported').toUpperCase().replace(' ','_')}</span>
                            <span className="mono" style={{fontSize:14,fontWeight:900,color:rc(score)}}>{score}</span>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}

          {/* ══ SMART FEATURES ═══════════════════════════════════════════════ */}
          {tab==='features'&&(
            <motion.div key="ft" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{...CT.card,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div>
                  <div className="label" style={{marginBottom:4}}>AI INTELLIGENCE SUITE</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.tx1}}>Policy Decision Tools</div>
                </div>
                <div style={{display:'flex',gap:0,border:`1px solid ${C.bdr}`,borderRadius:4,overflow:'hidden'}}>
                  {[['budget','BUDGET OPT.',C.orange],['wards','WARD DATA',C.cyan],['predict','PREDICT',C.purple]].map(([id,label,c])=>(
                    <button key={id} onClick={()=>setFtab(id)} className="mono"
                      style={{padding:'8px 16px',border:'none',borderRight:`1px solid ${C.bdr2}`,cursor:'pointer',fontFamily:'var(--mono)',fontSize:10,fontWeight:700,letterSpacing:'0.06em',
                        background:ftab===id?c+'22':'transparent',color:ftab===id?c:C.tx3,transition:'all 0.15s',
                        borderBottom:ftab===id?`2px solid ${c}`:'2px solid transparent'}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {ftab==='budget' &&<motion.div key="b" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><BudgetOptimizer  token={token} T={true} bg2={C.bg2} bdr={C.bdr} txM={C.tx1} txS={C.tx2}/></motion.div>}
                {ftab==='wards'  &&<motion.div key="w" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><WardAccountability token={token} T={true} bg2={C.bg2} bdr={C.bdr} txM={C.tx1} txS={C.tx2}/></motion.div>}
                {ftab==='predict'&&<motion.div key="p" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><PredictiveMaintenance token={token} T={true} bg2={C.bg2} bdr={C.bdr} txM={C.tx1} txS={C.tx2}/></motion.div>}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer style={{background:C.bg1,borderTop:`1px solid ${C.bdr2}`,marginTop:48,padding:'20px 0'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:28,height:28,borderRadius:4,background:C.cyan3,border:`1px solid ${C.bdr}`,display:'flex',alignItems:'center',justifyContent:'center',color:C.cyan}}>
              <Icon name="road" size={14} color={C.cyan}/>
            </div>
            <div>
              <div className="mono" style={{fontSize:11,fontWeight:700,color:C.tx1,letterSpacing:'0.04em'}}>ROADWATCH AI — SMART ROAD INTELLIGENCE SYSTEM</div>
              <div className="mono" style={{fontSize:9,color:C.tx3,letterSpacing:'0.06em',marginTop:2}}>MINISTRY OF ROAD TRANSPORT & HIGHWAYS · DIGITAL INDIA PROGRAMME</div>
            </div>
          </div>
          <div className="mono" style={{fontSize:9,color:C.tx3,letterSpacing:'0.06em',textAlign:'right'}}>
            <div>© 2024 GOVERNMENT OF INDIA · ALL RIGHTS RESERVED</div>
            <div style={{marginTop:3,color:C.tx3}}>POWERED BY YOLOv8 · BUILT ON OPEN-SOURCE STACK</div>
          </div>
        </div>
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.cyan},${C.orange},transparent)`,marginTop:18,opacity:0.3}}/>
      </footer>
    </div>
  )
}
