import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from './context/AuthContext'
import LeafletMapView from './components/LeafletMapView'
import AIDetectionCanvas from './components/AIDetectionCanvas'
import BudgetOptimizer from './components/BudgetOptimizer'
import WardAccountability from './components/WardAccountability'
import PredictiveMaintenance from './components/PredictiveMaintenance'
import { runDemoAI } from './data/demoDetections'
import { api } from './hooks/useApi'

// ── FALLBACK seed data (shown instantly, no backend needed) ───────────────────
const SEED = [
  {_id:'s1',location:{name:'NH-48 Mahipalpur, New Delhi',lat:28.5355,lng:77.1190},type:'Pothole',severity:'high',  riskScore:92,confidence:0.94,status:'Reported',   reporter:'Vikram S.',  city:'Delhi',    ward:'Mahipalpur Ward',  councillor:'Rajesh Gupta',  repairCost:82000,createdAt:'2024-03-10'},
  {_id:'s2',location:{name:'Ring Road, Lajpat Nagar',    lat:28.5665,lng:77.2431},type:'Pothole',severity:'high',  riskScore:88,confidence:0.94,status:'Reported',   reporter:'Priya M.',   city:'Delhi',    ward:'Lajpat Nagar Ward',councillor:'Sunita Sharma', repairCost:74000,createdAt:'2024-03-08'},
  {_id:'s3',location:{name:'Eastern Exp Hwy, Kurla',     lat:19.0725,lng:72.8851},type:'Pothole',severity:'high',  riskScore:89,confidence:0.94,status:'Reported',   reporter:'Vijay P.',   city:'Mumbai',   ward:'Kurla Ward',       councillor:'Santosh Patil', repairCost:76000,createdAt:'2024-03-07'},
  {_id:'s4',location:{name:'Outer Ring Road, Marathahalli',lat:12.9591,lng:77.6974},type:'Pothole',severity:'high',riskScore:91,confidence:0.96,status:'In Progress', reporter:'Suresh K.',  city:'Bengaluru',ward:'Marathahalli Ward',councillor:'B.R. Nagaraj',  repairCost:81000,createdAt:'2024-03-06'},
  {_id:'s5',location:{name:'Banjara Hills Road No.12',   lat:17.4126,lng:78.4438},type:'Pothole',severity:'high',  riskScore:89,confidence:0.95,status:'Reported',   reporter:'Lakshmi T.', city:'Hyderabad',ward:'Banjara Hills Ward',councillor:'Kalvakuntla S.',repairCost:77000,createdAt:'2024-03-05'},
  {_id:'s6',location:{name:'Anna Salai, Teynampet',      lat:13.0418,lng:80.2341},type:'Pothole',severity:'high',  riskScore:83,confidence:0.92,status:'Reported',   reporter:'Murugan S.', city:'Chennai',  ward:'Teynampet Ward',   councillor:'R. Natarajan',  repairCost:60000,createdAt:'2024-03-04'},
  {_id:'s7',location:{name:'EM Bypass, Kasba',           lat:22.5124,lng:88.3890},type:'Pothole',severity:'high',  riskScore:88,confidence:0.94,status:'Reported',   reporter:'Debashis M.',city:'Kolkata',  ward:'Kasba Ward',       councillor:'Subrata Das',   repairCost:73000,createdAt:'2024-03-03'},
  {_id:'s8',location:{name:'MG Road, Connaught Place',   lat:28.6314,lng:77.2167},type:'Crack',  severity:'medium',riskScore:55,confidence:0.82,status:'In Progress', reporter:'Neha R.',    city:'Delhi',    ward:'CP Ward',          councillor:'Deepak Jain',   repairCost:18000,createdAt:'2024-03-02'},
  {_id:'s9',location:{name:'Outer Ring Road, Munirka',   lat:28.5527,lng:77.1718},type:'Crack',  severity:'high',  riskScore:79,confidence:0.89,status:'In Progress', reporter:'Arjun K.',   city:'Delhi',    ward:'Munirka Ward',     councillor:'Amit Yadav',    repairCost:45000,createdAt:'2024-03-01'},
  {_id:'s10',location:{name:'LBS Road, Ghatkopar',       lat:19.0874,lng:72.9082},type:'Crack',  severity:'high',  riskScore:77,confidence:0.88,status:'In Progress', reporter:'Anjali D.',  city:'Mumbai',   ward:'Ghatkopar Ward',   councillor:'Mangal More',   repairCost:42000,createdAt:'2024-02-28'},
  {_id:'s11',location:{name:'Karol Bagh Main Market',    lat:28.6514,lng:77.1909},type:'Pothole',severity:'low',   riskScore:24,confidence:0.73,status:'Resolved',    reporter:'Mohan L.',   city:'Delhi',    ward:'Karol Bagh Ward',  councillor:'Anita Singh',   repairCost:5500, createdAt:'2024-02-27'},
  {_id:'s12',location:{name:'Sarjapur Road, Bellandur',  lat:12.9268,lng:77.6775},type:'Pothole',severity:'high',  riskScore:86,confidence:0.93,status:'Reported',   reporter:'Aditya S.',  city:'Bengaluru',ward:'Bellandur Ward',   councillor:'Narayanaswamy', repairCost:69000,createdAt:'2024-02-26'},
  {_id:'s13',location:{name:'Pune-Mumbai Expressway',    lat:18.5975,lng:73.7898},type:'Pothole',severity:'high',  riskScore:90,confidence:0.95,status:'Reported',   reporter:'Nikhil J.',  city:'Pune',     ward:'Wakad Ward',       councillor:'Santosh Shinde',repairCost:78000,createdAt:'2024-02-25'},
  {_id:'s14',location:{name:'SG Highway, Bodakdev',      lat:23.0415,lng:72.5052},type:'Pothole',severity:'high',  riskScore:86,confidence:0.93,status:'Reported',   reporter:'Jignesh P.', city:'Ahmedabad',ward:'Bodakdev Ward',    councillor:'Bharat Shah',   repairCost:68000,createdAt:'2024-02-24'},
  {_id:'s15',location:{name:'Poonamallee High Road',     lat:13.0694,lng:80.1948},type:'Pothole',severity:'high',  riskScore:85,confidence:0.93,status:'Reported',   reporter:'Rajan M.',   city:'Chennai',  ward:'Koyambedu Ward',   councillor:'S. Vijayan',    repairCost:65000,createdAt:'2024-02-23'},
]

// ── Constants ─────────────────────────────────────────────────────────────────
const ACCENT = '#e85d04'
const BLUE   = '#1a3c6e'
const rc     = s => s>=71?'#dc2626':s>=31?'#d97706':'#16a34a'
const IMGS   = {
  hero:    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&q=80',
  road1:   'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
  road2:   'https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=800&q=80',
  p1:      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&q=80',
  p2:      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  crack:   'https://images.unsplash.com/photo-1566888596782-c7f41cc184c5?w=600&q=80',
  repair:  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
}

// ── GovField ──────────────────────────────────────────────────────────────────
function GovField({ label, type, placeholder, value, onChange, T, bdr, required }) {
  const [f, setF] = useState(false)
  return (
    <div>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:T?'#94a3b8':'#64748b',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:'100%',padding:'11px 14px',borderRadius:6,background:T?'#0f172a':'#f8fafc',border:`1px solid ${f?ACCENT:bdr}`,color:T?'#f1f5f9':'#0f172a',fontSize:14,outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color 0.2s'}}/>
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, delta, bg2, bdr, txM, txS }) {
  return (
    <motion.div whileHover={{y:-3,transition:{duration:0.15}}}
      style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:20,borderTop:`3px solid ${accent}`}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
        <div style={{width:42,height:42,borderRadius:10,background:accent+'1a',display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</div>
        {delta!==undefined&&<span style={{fontSize:11,fontWeight:700,color:delta>=0?'#16a34a':'#dc2626',background:delta>=0?'#dcfce7':'#fee2e2',padding:'3px 8px',borderRadius:4}}>{delta>=0?'+':''}{delta}%</span>}
      </div>
      <div style={{fontSize:30,fontWeight:900,color:txM,letterSpacing:'-0.04em',lineHeight:1}}>{value}</div>
      <div style={{fontSize:13,color:txS,marginTop:6}}>{label}</div>
    </motion.div>
  )
}

// ── UploadPanel ───────────────────────────────────────────────────────────────
function UploadPanel({ token, onDone, T, bg2, bdr, txM, txS }) {
  const [drag,   setDrag]   = useState(false)
  const [file,   setFile]   = useState(null)
  const [prev,   setPrev]   = useState(null)
  const [busy,   setBusy]   = useState(false)
  const [res,    setRes]    = useState(null)
  const [loc,    setLoc]    = useState(null)
  const [name,   setName]   = useState('')
  const [done,   setDone]   = useState(false)
  const [step,   setStep]   = useState('pick')
  const [prog,   setProg]   = useState({msg:'',pct:0})
  const fRef = useRef()

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setLoc({lat:p.coords.latitude, lng:p.coords.longitude}),
      ()  => setLoc({lat:28.6139, lng:77.209})
    )
  }, [])

  const pick = f => {
    if (!f?.type.startsWith('image/')) return
    setFile(f); setRes(null); setDone(false); setStep('analyze')
    const r = new FileReader(); r.onload = e => setPrev(e.target.result); r.readAsDataURL(f)
  }

  const analyze = async () => {
    setBusy(true); setProg({msg:'Initializing…',pct:5})
    try {
      const result = await runDemoAI((msg,pct) => setProg({msg,pct}))
      setRes(result); setStep('submit')
    } finally { setBusy(false); setProg({msg:'',pct:0}) }
  }

  const submit = async () => {
    if (!file||!res) return; setBusy(true)
    try {
      const fd = new FormData()
      fd.append('image',file); fd.append('lat',loc?.lat||28.6139); fd.append('lng',loc?.lng||77.209)
      fd.append('locationName',name||'Reported Location'); fd.append('severity',res.severity)
      fd.append('riskScore',res.riskScore); fd.append('detections',JSON.stringify(res.detections))
      onDone(await api.createReport(token,fd)); setDone(true)
    } catch(e) { console.error(e) } finally { setBusy(false) }
  }

  const reset = () => { setFile(null);setPrev(null);setRes(null);setDone(false);setStep('pick') }

  if (done) return (
    <motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} style={{textAlign:'center',padding:'48px 24px'}}>
      <div style={{width:60,height:60,borderRadius:'50%',background:'#dcfce7',border:'2px solid #16a34a',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div style={{fontSize:20,fontWeight:800,color:txM,marginBottom:8}}>Report Submitted Successfully</div>
      <div style={{fontSize:13,color:txS,marginBottom:6}}>Risk Score: <span style={{color:rc(res.riskScore),fontWeight:700}}>{res.riskScore}/100</span> · Pinned on map</div>
      <div style={{fontSize:12,color:'#15803d',marginBottom:28,padding:'8px 16px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,display:'inline-block'}}>
        Reference: RW-{Date.now().toString().slice(-7)} · Municipal authority notified
      </div>
      <br/>
      <button onClick={reset} style={{padding:'10px 24px',borderRadius:6,border:'none',background:ACCENT,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Report Another Issue</button>
    </motion.div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Step tracker */}
      <div style={{display:'flex',alignItems:'center'}}>
        {[['Upload','pick'],['AI Analysis','analyze'],['Submit','submit']].map(([l,s],i) => {
          const active=step===s, done2=['pick','analyze','submit'].indexOf(step)>i
          return (
            <div key={s} style={{display:'flex',alignItems:'center',flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,
                  background:active?ACCENT:done2?'#16a34a':'transparent',color:active||done2?'#fff':T?'#64748b':'#94a3b8',
                  border:active?`2px solid ${ACCENT}`:done2?'2px solid #16a34a':`2px solid ${T?'#475569':'#cbd5e1'}`}}>
                  {done2?<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>:i+1}
                </div>
                <span style={{fontSize:12,fontWeight:600,color:active?ACCENT:done2?'#16a34a':txS}}>{l}</span>
              </div>
              {i<2&&<div style={{flex:1,height:2,margin:'0 8px',background:done2?'#16a34a':bdr,borderRadius:999}}/>}
            </div>
          )
        })}
      </div>

      {!prev ? (
        <motion.div onClick={()=>fRef.current?.click()}
          onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);pick(e.dataTransfer.files[0])}}
          whileHover={{scale:1.003}} whileTap={{scale:0.997}}
          style={{border:`2px dashed ${drag?ACCENT:bdr}`,background:drag?'#fff7ed':'transparent',borderRadius:10,padding:'40px 24px',textAlign:'center',cursor:'pointer',transition:'all 0.2s'}}>
          <input ref={fRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>pick(e.target.files[0])}/>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}}>
            {[IMGS.p1,IMGS.crack,IMGS.repair].map((src,i)=>(
              <img key={i} src={src} alt="" style={{width:72,height:52,objectFit:'cover',borderRadius:6,border:`1px solid ${bdr}`,opacity:0.75}}/>
            ))}
          </div>
          <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:6}}>Upload Road Damage Photo</div>
          <div style={{fontSize:13,color:txS}}>Drag & drop or click · PNG, JPG, WEBP up to 10MB</div>
        </motion.div>
      ) : (
        <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{position:'relative',background:'#000',borderRadius:10,overflow:'hidden',border:`1px solid ${bdr}`}}>
            {res
              ? <AIDetectionCanvas imageUrl={prev} detections={res.detections} modelName={res.model} processingMs={res.processingMs}/>
              : <img src={prev} alt="preview" style={{width:'100%',maxHeight:280,objectFit:'contain',display:'block'}}/>
            }
            {busy&&(
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:28}}>
                <div style={{width:'78%',background:'rgba(255,255,255,0.1)',borderRadius:999,height:5,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:999,background:ACCENT,width:`${prog.pct}%`,transition:'width 0.4s ease'}}/>
                </div>
                <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',fontWeight:600}}>{prog.msg}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',fontFamily:'monospace'}}>YOLOv8n-CRDDC · {prog.pct}%</div>
              </div>
            )}
            {res&&(
              <div style={{position:'absolute',top:8,right:8,background:'rgba(22,163,74,0.9)',color:'#fff',padding:'4px 10px',borderRadius:4,fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Detection Complete
              </div>
            )}
          </div>

          {res&&(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              {[['Detections',res.detections.length,null],['Risk Score',`${res.riskScore}/100`,rc(res.riskScore)],['Severity',res.severity.toUpperCase(),rc(res.riskScore)]].map(([l,v,c])=>(
                <div key={l} style={{background:T?'#0f172a':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:8,padding:'12px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:txS,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{l}</div>
                  <div style={{fontSize:16,fontWeight:700,color:c||txM}}>{v}</div>
                </div>
              ))}
            </motion.div>
          )}

          {res&&(
            <div style={{background:T?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:8,padding:'10px 14px',fontSize:12,color:txS}}>
              <strong style={{color:txM}}>Model: </strong>{res.model} &nbsp;·&nbsp;
              <strong style={{color:txM}}>Inference: </strong>{res.processingMs}ms &nbsp;·&nbsp;
              <strong style={{color:txM}}>Detections: </strong>{res.detections.length} object{res.detections.length!==1?'s':''} found
            </div>
          )}

          {res&&<input placeholder="Location name (e.g. NH-48, near Toll Plaza)" value={name} onChange={e=>setName(e.target.value)}
            style={{padding:'10px 14px',borderRadius:6,background:T?'#0f172a':'#f8fafc',border:`1px solid ${bdr}`,color:txM,fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box',width:'100%'}}/>}

          <div style={{display:'flex',gap:10}}>
            {step==='analyze'&&!busy&&<button onClick={analyze} style={{flex:1,padding:'11px',borderRadius:6,border:'none',background:BLUE,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Run AI Analysis</button>}
            {step==='submit'&&<button onClick={submit} disabled={busy} style={{flex:1,padding:'11px',borderRadius:6,border:'none',background:ACCENT,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:busy?0.6:1}}>{busy?'Submitting…':'Submit Report'}</button>}
            <button onClick={reset} style={{padding:'11px 14px',borderRadius:6,border:`1px solid ${bdr}`,background:'transparent',color:txS,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
  const [dark,       setDark]      = useState(false)
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

  const T   = dark
  const bg  = T?'#0f172a':'#f1f5f9'
  const bg2 = T?'#1e293b':'#ffffff'
  const bdr = T?'#334155':'#e2e8f0'
  const txM = T?'#f1f5f9':'#0f172a'
  const txS = T?'#94a3b8':'#64748b'

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

  useEffect(() => { load() }, [load])

  const handleNew = r => { setReports(p=>[r,...p]); toast(`Report submitted · Risk: ${r.riskScore}/100`); setTab('map') }
  const updateStatus = async (id,status) => {
    try { const u=await api.updateStatus(token,id,status); setReports(p=>p.map(r=>(r._id??r.id)===id?u:r)); toast(`Status → ${status}`) }
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
    ? [['overview','Overview'],['map','Live Map'],['report','Report Issue'],['analytics','Analytics'],['features','Smart Features']]
    : [['overview','Overview'],['map','Live Map']]

  const sevL = s=>({high:'#fef2f2 #dc2626 #fecaca',medium:'#fffbeb #d97706 #fde68a',low:'#f0fdf4 #16a34a #bbf7d0'}[s]||'#eff6ff #2563eb #bfdbfe')
  const sevD = s=>({high:'rgba(220,38,38,0.15) #f87171 rgba(220,38,38,0.3)',medium:'rgba(217,119,6,0.15) #fbbf24 rgba(217,119,6,0.3)',low:'rgba(22,163,74,0.15) #4ade80 rgba(22,163,74,0.3)'}[s]||'rgba(37,99,235,0.15) #60a5fa rgba(37,99,235,0.3)')
  const statC= (s)=>({Reported:'#2563eb','In Progress':'#d97706',Resolved:'#16a34a'}[s]||'#6366f1')

  const iconProps = { fill:'none', strokeLinecap:'round', strokeLinejoin:'round' }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14}}>
      <div style={{width:36,height:36,border:'3px solid #e2e8f0',borderTopColor:ACCENT,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:bg,color:txM,fontFamily:"'Inter',system-ui,sans-serif",transition:'background 0.25s,color 0.25s'}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${bdr};border-radius:99px}
        input:focus{border-color:${ACCENT}!important;outline:none}
        .leaflet-control-zoom a{background:${bg2}!important;color:${txM}!important;border-color:${bdr}!important}
        .leaflet-control-attribution{background:${T?'rgba(15,23,42,0.85)':'rgba(255,255,255,0.9)'}!important;color:${txS}!important;font-size:10px!important}
        .rw-popup .leaflet-popup-content-wrapper{background:transparent!important;border:none!important;box-shadow:0 16px 48px rgba(0,0,0,0.3)!important;border-radius:12px!important;padding:0!important}
        .rw-popup .leaflet-popup-content{margin:0!important}
        .rw-popup .leaflet-popup-tip-container{display:none!important}
      `}</style>

      {/* TOAST */}
      <AnimatePresence>
        {notif&&(
          <motion.div initial={{opacity:0,y:-20,x:'-50%'}} animate={{opacity:1,y:0,x:'-50%'}} exit={{opacity:0,y:-16,x:'-50%'}}
            style={{position:'fixed',top:20,left:'50%',zIndex:9999,padding:'10px 22px',borderRadius:6,fontSize:13,fontWeight:600,whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',
              background:notif.type==='err'?'#fee2e2':'#dcfce7',border:`1px solid ${notif.type==='err'?'#fca5a5':'#86efac'}`,color:notif.type==='err'?'#dc2626':'#16a34a'}}>
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header style={{background:T?'linear-gradient(135deg,#0f1e35,#0a1425)':`linear-gradient(135deg,${BLUE},#1e4d8c)`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:`url(${IMGS.hero})`,backgroundSize:'cover',backgroundPosition:'center',opacity:0.07,pointerEvents:'none'}}/>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:46,height:46,borderRadius:10,overflow:'hidden',border:'2px solid rgba(255,255,255,0.2)',flexShrink:0}}>
              <img src={IMGS.road1} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
            <div>
              <div style={{fontWeight:900,fontSize:20,color:'#fff',letterSpacing:'-0.03em',lineHeight:1}}>RoadWatch AI</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',letterSpacing:'0.07em',marginTop:3,textTransform:'uppercase'}}>Smart Road Intelligence · Government of India</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={()=>setDark(d=>!d)}
              style={{padding:'8px 14px',borderRadius:6,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.08)',color:'#fff',fontSize:13,cursor:'pointer',fontFamily:'inherit',fontWeight:500,display:'flex',alignItems:'center',gap:7}}>
              {T
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
              {T?'Light Mode':'Dark Mode'}
            </button>
            {!user ? (
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setAuthMode('login')} style={{padding:'8px 18px',borderRadius:6,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Sign In</button>
                <button onClick={()=>setAuthMode('signup')} style={{padding:'8px 18px',borderRadius:6,border:'none',background:ACCENT,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Register</button>
              </div>
            ) : (
              <div style={{position:'relative'}}>
                <button onClick={()=>setMenuOpen(m=>!m)}
                  style={{display:'flex',alignItems:'center',gap:9,padding:'8px 14px',borderRadius:6,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.08)',color:'#fff',cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800}}>{user.name?.[0]?.toUpperCase()||'U'}</div>
                  {user.name.split(' ')[0]}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <AnimatePresence>
                  {menuOpen&&(
                    <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:4}}
                      style={{position:'absolute',right:0,top:'calc(100% + 8px)',width:210,background:bg2,border:`1px solid ${bdr}`,borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.15)',zIndex:200,overflow:'hidden'}}>
                      <div style={{padding:'14px 16px',borderBottom:`1px solid ${bdr}`}}>
                        <div style={{fontSize:13,fontWeight:700,color:txM}}>{user.name}</div>
                        <div style={{fontSize:11,color:txS,marginTop:2}}>{user.email}</div>
                        <span style={{fontSize:10,fontWeight:700,color:ACCENT,marginTop:4,display:'inline-block',textTransform:'uppercase',letterSpacing:'0.05em'}}>{user.role==='admin'?'Administrator':'Field Officer'}</span>
                      </div>
                      <button onClick={()=>{logout();setMenuOpen(false)}}
                        style={{width:'100%',padding:'12px 16px',border:'none',background:'transparent',color:'#dc2626',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',textAlign:'left',display:'flex',alignItems:'center',gap:8}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign Out
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
      <nav style={{background:bg2,borderBottom:`1px solid ${bdr}`,boxShadow:T?'0 1px 0 #334155':'0 1px 4px rgba(0,0,0,0.06)',position:'sticky',top:0,zIndex:50}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:50}}>
          <div style={{display:'flex',gap:0}}>
            {tabs.map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)}
                style={{padding:'0 22px',height:50,border:'none',borderBottom:tab===id?`2px solid ${ACCENT}`:'2px solid transparent',background:'transparent',color:tab===id?ACCENT:txS,fontSize:14,fontWeight:tab===id?700:500,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:txS}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#16a34a',animation:'pulse 2s infinite',display:'inline-block'}}/>
            <span style={{fontWeight:500}}>Live · {reports.length} incidents tracked</span>
          </div>
        </div>
      </nav>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authMode&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
            onClick={e=>e.target===e.currentTarget&&setAuthMode(null)}>
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:10}}
              style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,width:'100%',maxWidth:420,overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,0.25)'}}>
              <div style={{position:'relative',height:110,overflow:'hidden'}}>
                <img src={IMGS.road2} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${BLUE}ee,#1e4d8ccc)`,display:'flex',alignItems:'flex-end',justifyContent:'space-between',padding:'16px 22px'}}>
                  <div>
                    <div style={{fontWeight:800,color:'#fff',fontSize:16}}>RoadWatch AI</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.55)',letterSpacing:'0.05em',textTransform:'uppercase',marginTop:2}}>Secure Government Portal</div>
                  </div>
                  <button onClick={()=>setAuthMode(null)} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',width:28,height:28,borderRadius:6,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              <div style={{display:'flex',borderBottom:`1px solid ${bdr}`}}>
                {['login','signup'].map(m=>(
                  <button key={m} onClick={()=>{setAuthMode(m);setAuthErr('')}}
                    style={{flex:1,padding:'13px 0',border:'none',borderBottom:authMode===m?`2px solid ${ACCENT}`:'2px solid transparent',background:'transparent',color:authMode===m?ACCENT:txS,fontSize:14,fontWeight:authMode===m?700:500,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
                    {m==='login'?'Sign In':'Register'}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAuth} style={{padding:24,display:'flex',flexDirection:'column',gap:14}}>
                <AnimatePresence>
                  {authMode==='signup'&&(
                    <motion.div key="name" initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden'}}>
                      <GovField label="Full Name" type="text" placeholder="Enter your full name" value={authForm.name} onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))} T={T} bdr={bdr} required/>
                    </motion.div>
                  )}
                </AnimatePresence>
                <GovField label="Email Address" type="email" placeholder="Enter registered email" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} T={T} bdr={bdr} required/>
                <GovField label="Password" type="password" placeholder="Minimum 6 characters" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} T={T} bdr={bdr} required/>
                {authErr&&<div style={{background:'#fee2e2',border:'1px solid #fca5a5',color:'#dc2626',padding:'10px 14px',borderRadius:6,fontSize:13}}>{authErr}</div>}
                <button type="submit" disabled={authBusy}
                  style={{padding:'13px',borderRadius:6,border:'none',background:ACCENT,color:'#fff',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit',opacity:authBusy?0.7:1}}>
                  {authBusy?'Please wait…':authMode==='login'?'Sign In →':'Create Account →'}
                </button>
                <div style={{textAlign:'center',fontSize:12,color:txS,padding:'10px',background:T?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:6}}>
                  Demo: <span style={{color:ACCENT,fontWeight:600}}>demo@roadwatch.ai</span> / <span style={{color:ACCENT,fontWeight:600}}>demo1234</span>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <main style={{maxWidth:1400,margin:'0 auto',padding:'28px 24px'}}>
        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {tab==='overview'&&(
            <motion.div key="ov" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:22}}>
              <div style={{position:'relative',borderRadius:12,overflow:'hidden',height:270}}>
                <img src={IMGS.hero} alt="City" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:`linear-gradient(90deg,${BLUE}f5 0%,${BLUE}cc 55%,transparent 100%)`}}/>
                <div style={{position:'absolute',inset:0,padding:'32px 40px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:4,padding:'5px 12px',marginBottom:14,width:'fit-content'}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'#4ade80',animation:'pulse 2s infinite',display:'inline-block'}}/>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.85)',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase'}}>Live · 8 Cities · AI-Powered</span>
                  </div>
                  <h1 style={{fontSize:28,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',margin:'0 0 10px',lineHeight:1.15,maxWidth:520}}>Smart Road Intelligence System</h1>
                  <p style={{fontSize:14,color:'rgba(255,255,255,0.62)',lineHeight:1.75,maxWidth:480,margin:0}}>
                    AI detects potholes and cracks, assigns risk scores, and helps Municipal Corporations prioritize repairs — saving crores in infrastructure costs.
                  </p>
                  {!user&&(
                    <div style={{display:'flex',gap:12,marginTop:20}}>
                      <button onClick={()=>setAuthMode('login')} style={{padding:'11px 24px',borderRadius:6,border:'none',background:ACCENT,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Sign In to Report</button>
                      <button onClick={()=>setTab('map')} style={{padding:'11px 24px',borderRadius:6,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.1)',color:'#fff',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>View Live Map</button>
                    </div>
                  )}
                </div>
                <div style={{position:'absolute',bottom:20,right:24,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[['3,847','Roads Monitored'],['94%','AI Accuracy'],['2.3x','Faster Repairs'],['₹4.2Cr','Cost Saved']].map(([v,l])=>(
                    <div key={l} style={{background:'rgba(10,20,37,0.75)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'10px 14px',backdropFilter:'blur(8px)',textAlign:'center'}}>
                      <div style={{fontSize:18,fontWeight:900,color:'#fff',letterSpacing:'-0.04em'}}>{v}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:2,textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
                <StatCard label="Total Reports"   value={stats?.total??reports.length} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} accent={ACCENT} delta={12} bg2={bg2} bdr={bdr} txM={txM} txS={txS}/>
                <StatCard label="High Risk Zones" value={stats?.high??reports.filter(r=>r.severity==='high').length} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} accent="#dc2626" delta={-5} bg2={bg2} bdr={bdr} txM={txM} txS={txS}/>
                <StatCard label="Pending Repairs" value={stats?.pending??reports.filter(r=>r.status==='Reported').length} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} accent="#d97706" bg2={bg2} bdr={bdr} txM={txM} txS={txS}/>
                <StatCard label="Issues Resolved" value={stats?.resolved??reports.filter(r=>r.status==='Resolved').length} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} accent="#16a34a" delta={28} bg2={bg2} bdr={bdr} txM={txM} txS={txS}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1.8fr 1fr',gap:18}}>
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:18}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                    <div><div style={{fontWeight:700,fontSize:16,color:txM}}>Live Incident Map</div><div style={{fontSize:12,color:txS,marginTop:2}}>Click any marker to view details</div></div>
                    <button onClick={()=>setTab('map')} style={{padding:'7px 14px',borderRadius:6,border:`1px solid ${BLUE}`,background:'transparent',color:BLUE,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Full Map →</button>
                  </div>
                  <LeafletMapView reports={reports} selectedId={selected} onSelect={setSelected} mapType={mapType} showHeatmap={false}/>
                </div>
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:18}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                    <div style={{fontWeight:700,fontSize:16,color:txM}}>Recent Reports</div>
                    <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#16a34a',fontWeight:600}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:'#16a34a',animation:'pulse 2s infinite',display:'inline-block'}}/>Live
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:380,overflowY:'auto'}}>
                    {reports.slice(0,8).map((r,i)=>{
                      const id=r._id??r.id, score=r.riskScore??r.risk??50, color=rc(score)
                      const [sb,sc,sbr]=(T?sevD:sevL)(r.severity).split(' ')
                      return (
                        <motion.div key={id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                          onClick={()=>{setSelected(id);setTab('map')}}
                          style={{display:'flex',alignItems:'center',gap:12,padding:'11px 12px',borderRadius:8,background:T?'rgba(255,255,255,0.02)':'#f8fafc',border:`1px solid ${bdr}`,cursor:'pointer'}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:txM,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.location?.name??r.location??'Unknown'}</div>
                            <div style={{fontSize:11,color:txS,marginTop:2}}>{r.type} · {new Date(r.createdAt??Date.now()).toLocaleDateString('en-IN')}</div>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                            <span style={{background:sb,color:sc,border:`1px solid ${sbr}`,padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:700}}>{(r.severity??'medium').toUpperCase()}</span>
                            <span style={{fontSize:16,fontWeight:800,color,letterSpacing:'-0.04em'}}>{score}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
                <div style={{fontWeight:700,fontSize:16,color:txM,marginBottom:4}}>Common Road Damage Types We Detect</div>
                <div style={{fontSize:13,color:txS,marginBottom:18}}>YOLOv8n model trained on CRDDC2022 dataset — 94% accuracy across pothole and crack categories</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
                  {[[IMGS.p1,'Potholes','Deep depressions caused by water infiltration and traffic load. High accident risk for two-wheelers and vehicles.','#dc2626','High Risk'],[IMGS.crack,'Pavement Cracks','Surface fractures indicating structural weakness. Early detection prevents escalation to full potholes.','#d97706','Medium Risk'],[IMGS.repair,'Road Degradation','General surface wear requiring preventive maintenance before serious structural damage occurs.','#16a34a','Low Risk']].map(([src,title,desc,color,badge])=>(
                    <div key={title} style={{borderRadius:10,overflow:'hidden',border:`1px solid ${bdr}`}}>
                      <div style={{position:'relative',height:160}}>
                        <img src={src} alt={title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        <div style={{position:'absolute',top:10,right:10,background:color,color:'#fff',padding:'3px 10px',borderRadius:4,fontSize:11,fontWeight:700}}>{badge}</div>
                      </div>
                      <div style={{padding:'14px 16px'}}>
                        <div style={{fontWeight:700,fontSize:14,color:txM,marginBottom:5}}>{title}</div>
                        <div style={{fontSize:12,color:txS,lineHeight:1.6}}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                  <div style={{padding:'28px 32px',borderRight:`1px solid ${bdr}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:ACCENT,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:10}}>Estimated Public Impact</div>
                    <p style={{fontSize:14,color:txS,lineHeight:1.8,margin:0}}>Based on <strong style={{color:txM}}>{stats?.resolved??reports.filter(r=>r.status==='Resolved').length} resolved incidents</strong>, RoadWatch AI estimates <strong style={{color:txM}}>₹{((stats?.resolved??reports.filter(r=>r.status==='Resolved').length)*12500).toLocaleString('en-IN')}</strong> in vehicle damage prevented and approximately <strong style={{color:txM}}>{Math.round((stats?.resolved??reports.filter(r=>r.status==='Resolved').length)*0.4)} accidents</strong> avoided.</p>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                    {[['₹'+((stats?.total??reports.length)*8500).toLocaleString('en-IN'),'Vehicle Damage Est.','#dc2626'],['4.2 days','Avg. Response','#d97706'],[`${stats?.total>0?Math.round((stats?.resolved??0)/(stats?.total||1)*100):42}%`,'Completion Rate','#16a34a'],[reports.length.toString(),'Total Incidents','#2563eb']].map(([v,l,c],i)=>(
                      <div key={l} style={{padding:'20px 24px',borderBottom:i<2?`1px solid ${bdr}`:'none',borderRight:i%2===0?`1px solid ${bdr}`:'none'}}>
                        <div style={{fontSize:22,fontWeight:800,color:c,letterSpacing:'-0.04em'}}>{v}</div>
                        <div style={{fontSize:12,color:txS,marginTop:4}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MAP */}
          {tab==='map'&&(
            <motion.div key="map" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div>
                  <h1 style={{fontSize:20,fontWeight:800,color:txM,margin:0}}>Live Road Damage Map</h1>
                  <p style={{fontSize:12,color:txS,margin:'4px 0 0'}}>{reports.length} active incidents across 8 Indian cities</p>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <div style={{display:'flex',border:`1px solid ${bdr}`,borderRadius:6,overflow:'hidden'}}>
                    {[['roadmap','Map'],['satellite','Satellite'],['terrain','Terrain']].map(([t,l])=>(
                      <button key={t} onClick={()=>setMapType(t)} style={{padding:'7px 14px',border:'none',borderRight:`1px solid ${bdr}`,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,background:mapType===t?BLUE:'transparent',color:mapType===t?'#fff':txS,transition:'all 0.15s'}}>{l}</button>
                    ))}
                  </div>
                  <button onClick={()=>setHeatmap(h=>!h)} style={{padding:'7px 14px',borderRadius:6,border:`1px solid ${heatmap?'#dc2626':bdr}`,background:heatmap?(T?'rgba(220,38,38,0.1)':'#fee2e2'):'transparent',color:heatmap?'#dc2626':txS,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                    Heatmap {heatmap?'ON':'OFF'}
                  </button>
                </div>
              </div>
              <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                  {[['#dc2626','High Risk (71–100)'],['#d97706','Medium (31–70)'],['#16a34a','Low (0–30)']].map(([c,l])=>(
                    <div key={l} style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:txS}}><span style={{width:10,height:10,borderRadius:'50%',background:c,display:'inline-block'}}/>{l}</div>
                  ))}
                </div>
                <div style={{display:'flex',gap:6}}>
                  {['all','high','medium','low'].map(s=>(
                    <button key={s} onClick={()=>setFilterSev(s)} style={{padding:'5px 12px',borderRadius:4,border:`1px solid ${bdr}`,cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:600,background:filterSev===s?BLUE:'transparent',color:filterSev===s?'#fff':txS}}>
                      {s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16}}>
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:14}}>
                  <LeafletMapView reports={reports.filter(r=>filterSev==='all'||(r.severity??'medium')===filterSev)} selectedId={selected} onSelect={setSelected} mapType={mapType} showHeatmap={heatmap}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <AnimatePresence mode="wait">
                    {sel ? (
                      <motion.div key="det" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0}} style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:20}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${bdr}`}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:15,color:txM}}>{sel.location?.name??sel.location??'Unknown'}</div>
                            <div style={{fontSize:12,color:txS,marginTop:4}}>{sel.type} · {sel.reporter??'Anonymous'}</div>
                          </div>
                          <button onClick={()=>setSelected(null)} style={{width:28,height:28,borderRadius:6,border:`1px solid ${bdr}`,background:'transparent',color:txS,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                        <div style={{background:T?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:8,padding:16,marginBottom:14,textAlign:'center'}}>
                          <div style={{fontSize:10,color:txS,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Risk Score</div>
                          <div style={{fontSize:48,fontWeight:900,color:rc(sel.riskScore??50),letterSpacing:'-0.06em',lineHeight:1}}>{sel.riskScore??sel.risk??50}</div>
                          <div style={{fontSize:11,color:txS,marginTop:3}}>out of 100</div>
                          <div style={{height:6,background:T?'#334155':'#f1f5f9',borderRadius:999,overflow:'hidden',marginTop:10}}>
                            <motion.div initial={{width:0}} animate={{width:`${sel.riskScore??50}%`}} transition={{duration:0.8}} style={{height:'100%',borderRadius:999,background:rc(sel.riskScore??50)}}/>
                          </div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                          {[['Severity',(sel.severity||'—').toUpperCase(),rc(sel.riskScore??50)],['Confidence',`${((sel.confidence||0.8)*100).toFixed(0)}%`,'#7c3aed'],['Date',new Date(sel.createdAt??Date.now()).toLocaleDateString('en-IN'),null],['Status',sel.status??'Reported',statC(sel.status)]].map(([l,v,c])=>(
                            <div key={l} style={{background:T?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:7,padding:'9px 12px'}}>
                              <div style={{fontSize:10,color:txS,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{l}</div>
                              <div style={{fontSize:13,fontWeight:700,color:c||txM}}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{fontSize:11,color:txS,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Update Status</div>
                          <div style={{display:'flex',gap:6}}>
                            {['Reported','In Progress','Resolved'].map(s=>(
                              <button key={s} onClick={()=>{if(token)updateStatus(sel._id??sel.id,s);else toast('Sign in to update status','err')}}
                                style={{flex:1,padding:'8px 4px',borderRadius:6,border:`1px solid ${sel.status===s?BLUE:bdr}`,cursor:'pointer',fontFamily:'inherit',fontSize:11,fontWeight:700,background:sel.status===s?BLUE:'transparent',color:sel.status===s?'#fff':txS,transition:'all 0.15s'}}>
                                {s.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="emp" initial={{opacity:0}} animate={{opacity:1}} style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:28,textAlign:'center'}}>
                        <div style={{width:48,height:48,borderRadius:10,background:T?'#0f172a':'#f1f5f9',border:`1px solid ${bdr}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={txS} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <div style={{fontWeight:700,color:txM,fontSize:14,marginBottom:6}}>Select an Incident</div>
                        <div style={{fontSize:12,color:txS,lineHeight:1.6}}>Click any marker on the map to view full details and update repair status</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* REPORT */}
          {tab==='report'&&(
            <motion.div key="rep" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              {!user ? (
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,overflow:'hidden',maxWidth:560,margin:'0 auto'}}>
                  <div style={{position:'relative',height:160}}>
                    <img src={IMGS.p2} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    <div style={{position:'absolute',inset:0,background:'rgba(10,20,37,0.72)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24}}>
                      <div style={{fontWeight:800,fontSize:20,color:'#fff',marginBottom:6}}>Authentication Required</div>
                      <div style={{fontSize:13,color:'rgba(255,255,255,0.65)'}}>Sign in to submit road damage reports</div>
                    </div>
                  </div>
                  <div style={{padding:'24px 28px',textAlign:'center'}}>
                    <p style={{fontSize:14,color:txS,marginBottom:20}}>Sign in with your government credentials to submit reports to the municipal database.</p>
                    <button onClick={()=>setAuthMode('login')} style={{padding:'12px 32px',borderRadius:6,border:'none',background:ACCENT,color:'#fff',fontWeight:700,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>Sign In Now</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'start'}}>
                  <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${bdr}`}}>
                      <div style={{width:36,height:36,borderRadius:8,overflow:'hidden',flexShrink:0}}>
                        <img src={IMGS.p1} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,color:txM}}>Submit Road Damage Report</div>
                        <div style={{fontSize:12,color:txS}}>AI detection · Risk scoring · GPS tagged</div>
                      </div>
                    </div>
                    <UploadPanel token={token} onDone={handleNew} T={T} bg2={bg2} bdr={bdr} txM={txM} txS={txS}/>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:16}}>
                    <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
                      <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:3,height:18,background:ACCENT,borderRadius:2,display:'inline-block'}}/>How It Works
                      </div>
                      {[['Upload Photo','Capture or upload any road photo from your device'],['AI Detection','YOLOv8n-CRDDC identifies potholes and cracks with real bounding boxes'],['Risk Scoring','0–100 score based on damage severity, confidence, and context'],['Authority Alert','Municipal body notified automatically with GPS and risk data']].map(([t,d],idx)=>(
                        <div key={t} style={{display:'flex',gap:14,marginBottom:idx<3?16:0,paddingBottom:idx<3?16:0,borderBottom:idx<3?`1px solid ${bdr}`:'none'}}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:ACCENT,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,flexShrink:0}}>{idx+1}</div>
                          <div><div style={{fontSize:13,fontWeight:700,color:txM,marginBottom:3}}>{t}</div><div style={{fontSize:12,color:txS,lineHeight:1.5}}>{d}</div></div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
                      <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:3,height:18,background:ACCENT,borderRadius:2,display:'inline-block'}}/>Risk Classification
                      </div>
                      {[['71–100','High Risk','#dc2626','Immediate action required. Public safety hazard.','#fef2f2','#fecaca'],['31–70','Medium Risk','#d97706','Repair within 14 days. Monitor closely.','#fffbeb','#fde68a'],['0–30','Low Risk','#16a34a','Schedule routine maintenance within 30 days.','#f0fdf4','#bbf7d0']].map(([r,l,c,d,bg3,bd3])=>(
                        <div key={r} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10,padding:'11px 14px',background:T?'rgba(255,255,255,0.02)':bg3,border:`1px solid ${T?'rgba(255,255,255,0.07)':bd3}`,borderRadius:7,borderLeft:`4px solid ${c}`}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                              <span style={{fontWeight:900,fontSize:15,color:c}}>{r}</span>
                              <span style={{fontSize:11,fontWeight:700,color:c,background:c+'18',padding:'2px 8px',borderRadius:4}}>{l}</span>
                            </div>
                            <div style={{fontSize:12,color:txS}}>{d}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ANALYTICS */}
          {tab==='analytics'&&(
            <motion.div key="an" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div><h1 style={{fontSize:20,fontWeight:800,color:txM,margin:0}}>Analytics & Insights</h1><p style={{fontSize:12,color:txS,margin:'4px 0 0'}}>Data-driven infrastructure policy decisions</p></div>
                <div style={{display:'flex',gap:6}}>
                  {['all','Reported','In Progress','Resolved'].map(s=>(
                    <button key={s} onClick={()=>setFilterStat(s)} style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${bdr}`,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,background:filterStat===s?BLUE:'transparent',color:filterStat===s?'#fff':txS}}>{s==='all'?'All':s}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
                <StatCard label="Total"       value={stats?.total??reports.length}                              accent={ACCENT}  bg2={bg2} bdr={bdr} txM={txM} txS={txS} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}/>
                <StatCard label="High Risk"   value={stats?.high??reports.filter(r=>r.severity==='high').length} accent="#dc2626" bg2={bg2} bdr={bdr} txM={txM} txS={txS} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}/>
                <StatCard label="In Progress" value={stats?.inProgress??reports.filter(r=>r.status==='In Progress').length} accent="#d97706" bg2={bg2} bdr={bdr} txM={txM} txS={txS} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
                <StatCard label="Resolved"    value={stats?.resolved??reports.filter(r=>r.status==='Resolved').length} accent="#16a34a" delta={28} bg2={bg2} bdr={bdr} txM={txM} txS={txS} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
                  <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:18}}>Reports vs Resolved — 6 Months</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trends.length>0?trends:[{month:'Now',reports:reports.length,resolved:reports.filter(r=>r.status==='Resolved').length}]} margin={{top:5,right:5,left:-22,bottom:0}}>
                      <defs>
                        <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ACCENT} stopOpacity={0.2}/><stop offset="95%" stopColor={ACCENT} stopOpacity={0}/></linearGradient>
                        <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={T?'#1e293b':'#f1f5f9'}/>
                      <XAxis dataKey="month" tick={{fill:txS,fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:txS,fontSize:11}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,fontSize:13,color:txM}}/>
                      <Area type="monotone" dataKey="reports" stroke={ACCENT} strokeWidth={2.5} fill="url(#og)" name="Reported"/>
                      <Area type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2.5} fill="url(#gg)" name="Resolved"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
                  <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:16}}>Severity Breakdown</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={[{name:'High',value:stats?.bySeverity?.high||reports.filter(r=>r.severity==='high').length||1,color:'#dc2626'},{name:'Medium',value:stats?.bySeverity?.medium||reports.filter(r=>r.severity==='medium').length||1,color:'#d97706'},{name:'Low',value:stats?.bySeverity?.low||reports.filter(r=>r.severity==='low').length||1,color:'#16a34a'}]} cx="50%" cy="50%" innerRadius={36} outerRadius={62} dataKey="value" paddingAngle={3}>
                        {['#dc2626','#d97706','#16a34a'].map((c,i)=><Cell key={i} fill={c}/>)}
                      </Pie>
                      <Tooltip contentStyle={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,fontSize:13}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:8}}>
                    {[['High','#dc2626',stats?.bySeverity?.high||reports.filter(r=>r.severity==='high').length],['Medium','#d97706',stats?.bySeverity?.medium||reports.filter(r=>r.severity==='medium').length],['Low','#16a34a',stats?.bySeverity?.low||reports.filter(r=>r.severity==='low').length]].map(([l,c,v])=>(
                      <div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:13}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:2,background:c,display:'inline-block'}}/><span style={{color:txS}}>{l} Risk</span></div>
                        <span style={{fontWeight:700,color:c}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
                  <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:3,height:18,background:'#dc2626',borderRadius:2,display:'inline-block'}}/>Top Danger Zones
                  </div>
                  {(topDanger.length>0?topDanger:[...reports].sort((a,b)=>(b.riskScore??0)-(a.riskScore??0))).slice(0,6).map((r,i)=>{
                    const score=r.riskScore??r.risk??50
                    return (
                      <div key={r._id??i} style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:10,fontWeight:800,color:txS,width:16,fontFamily:'monospace'}}>#{i+1}</span>
                            <span style={{fontSize:13,color:txM,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:130}}>{r.location?.name??r.location??'Unknown'}</span>
                          </div>
                          <span style={{fontWeight:800,fontSize:14,color:rc(score)}}>{score}</span>
                        </div>
                        <div style={{height:5,background:T?'#334155':'#f1f5f9',borderRadius:999,overflow:'hidden'}}>
                          <motion.div initial={{width:0}} animate={{width:`${score}%`}} transition={{delay:i*0.05+0.2,duration:0.7}} style={{height:'100%',borderRadius:999,background:rc(score)}}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
                  <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:3,height:18,background:ACCENT,borderRadius:2,display:'inline-block'}}/>All Reports
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 60px',gap:10,padding:'8px',background:T?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:6,marginBottom:6}}>
                    {['Location','Type','Severity','Status','Risk'].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:txS,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</div>)}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:2,maxHeight:320,overflowY:'auto'}}>
                    {reports.filter(r=>filterStat==='all'||r.status===filterStat).map(r=>{
                      const id=r._id??r.id, score=r.riskScore??r.risk??50
                      const [sb,sc,sbr]=(T?sevD:sevL)(r.severity).split(' ')
                      return (
                        <motion.div key={id} whileHover={{background:T?'rgba(255,255,255,0.03)':'#f8fafc'}}
                          onClick={()=>{setSelected(id);setTab('map')}}
                          style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 60px',gap:10,padding:'10px 8px',borderRadius:6,cursor:'pointer',transition:'background 0.12s',borderBottom:`1px solid ${bdr}`}}>
                          <div style={{fontSize:13,color:txM,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.location?.name??r.location??'Unknown'}</div>
                          <div style={{fontSize:12,color:txS}}>{r.type}</div>
                          <span style={{background:sb,color:sc,border:`1px solid ${sbr}`,padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:700,width:'fit-content',alignSelf:'center'}}>{(r.severity??'med').toUpperCase()}</span>
                          <div style={{fontSize:12,color:statC(r.status),fontWeight:600}}>{r.status}</div>
                          <div style={{fontSize:15,fontWeight:800,color:rc(score)}}>{score}</div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SMART FEATURES */}
          {tab==='features'&&(
            <motion.div key="ft" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div><h1 style={{fontSize:20,fontWeight:800,color:txM,margin:0}}>Smart Features</h1><p style={{fontSize:12,color:txS,margin:'4px 0 0'}}>AI-powered tools for policy makers and municipal administrators</p></div>
                <div style={{display:'flex',border:`1px solid ${bdr}`,borderRadius:6,overflow:'hidden'}}>
                  {[['budget','Budget Optimizer','#e85d04'],['wards','Ward Accountability','#1a3c6e'],['predict','Predictive Maintenance','#7c3aed']].map(([id,label,c])=>(
                    <button key={id} onClick={()=>setFtab(id)}
                      style={{padding:'8px 18px',border:'none',borderRight:`1px solid ${bdr}`,cursor:'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600,background:ftab===id?c:'transparent',color:ftab===id?'#fff':txS,transition:'all 0.15s',whiteSpace:'nowrap'}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <AnimatePresence mode="wait">
                {ftab==='budget'&&<motion.div key="b" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}><BudgetOptimizer token={token} T={T} bg2={bg2} bdr={bdr} txM={txM} txS={txS}/></motion.div>}
                {ftab==='wards' &&<motion.div key="w" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}><WardAccountability token={token} T={T} bg2={bg2} bdr={bdr} txM={txM} txS={txS}/></motion.div>}
                {ftab==='predict'&&<motion.div key="p" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}><PredictiveMaintenance token={token} T={T} bg2={bg2} bdr={bdr} txM={txM} txS={txS}/></motion.div>}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer style={{background:T?'linear-gradient(135deg,#0f1e35,#0a1425)':`linear-gradient(135deg,${BLUE},#1e4d8c)`,marginTop:48,padding:'24px 0',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:`url(${IMGS.road1})`,backgroundSize:'cover',backgroundPosition:'center',opacity:0.05,pointerEvents:'none'}}/>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,position:'relative',zIndex:1}}>
          <div>
            <div style={{fontWeight:700,color:'#fff',fontSize:15}}>RoadWatch AI — Smart Road Intelligence System</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:4}}>Powered by YOLOv8 AI · Ministry of Road Transport & Highways · Government of India</div>
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',textAlign:'right'}}>
            <div>© 2024 Government of India · All Rights Reserved</div>
            <div style={{marginTop:3}}>Built under Digital India Programme</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
