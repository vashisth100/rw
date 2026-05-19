import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../hooks/useApi'

const ACCENT='#e85d04', BLUE='#1a3c6e'
const fmt = n => n>=10000000?`₹${(n/10000000).toFixed(1)} Cr`:n>=100000?`₹${(n/100000).toFixed(1)} L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`
const gc  = g => ({A:'#16a34a',B:'#2563eb',C:'#d97706',D:'#dc2626'}[g]||'#6366f1')

export default function WardAccountability({ token, T, bg2, bdr, txM, txS }) {
  const [wards,   setWards]   = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy,  setSortBy]  = useState('pendingIssues')
  const [city,    setCity]    = useState('all')

  useEffect(() => {
    api.getWards(token).then(d=>setWards(Array.isArray(d)?d:[])).catch(console.error).finally(()=>setLoading(false))
  }, [token])

  const cities   = ['all',...new Set(wards.map(w=>w.city).filter(Boolean))]
  const filtered = wards.filter(w=>city==='all'||w.city===city).sort((a,b)=>{
    if (sortBy==='pendingIssues')  return b.pendingIssues-a.pendingIssues
    if (sortBy==='avgRisk')        return b.avgRisk-a.avgRisk
    if (sortBy==='resolutionRate') return b.resolutionRate-a.resolutionRate
    return b.pendingCost-a.pendingCost
  })
  const chartData = filtered.slice(0,8).map(w=>({name:w.ward?.replace(' Ward','').slice(0,14),pending:w.pendingIssues,resolved:w.resolved}))

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:64}}><div style={{width:36,height:36,border:'3px solid rgba(232,93,4,0.2)',borderTopColor:ACCENT,borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/></div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:'18px 22px',borderLeft:`4px solid ${BLUE}`}}>
        <div style={{fontWeight:800,fontSize:18,color:txM,marginBottom:6}}>Ward-wise Accountability</div>
        <div style={{fontSize:13,color:txS,lineHeight:1.7}}>Tracks municipal wards and elected councillors on road repair performance. Grades A–D based on resolution rate, pending issues, and average risk. Enables transparent public accountability.</div>
      </div>

      {filtered[0]?.pendingIssues>3&&(
        <div style={{background:T?'rgba(220,38,38,0.08)':'#fef2f2',border:'1px solid rgba(220,38,38,0.25)',borderRadius:10,padding:'14px 20px',borderLeft:'4px solid #dc2626'}}>
          <div style={{fontWeight:700,color:txM,fontSize:14}}>{filtered[0].ward} has the most neglected roads — {filtered[0].pendingIssues} unresolved issues</div>
          <div style={{fontSize:12,color:txS,marginTop:2}}>Councillor: {filtered[0].councillor} · Pending cost: {fmt(filtered[0].pendingCost)} · Resolution rate: {filtered[0].resolutionRate}%</div>
        </div>
      )}

      <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:12,color:txS,fontWeight:600}}>City:</span>
          {cities.map(c=><button key={c} onClick={()=>setCity(c)} style={{padding:'5px 12px',borderRadius:4,border:`1px solid ${bdr}`,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,background:city===c?BLUE:'transparent',color:city===c?'#fff':txS}}>{c==='all'?'All Cities':c}</button>)}
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:12,color:txS,fontWeight:600}}>Sort:</span>
          {[['pendingIssues','Most Pending'],['avgRisk','Avg Risk'],['resolutionRate','Resolution'],['pendingCost','Cost']].map(([k,l])=>(
            <button key={k} onClick={()=>setSortBy(k)} style={{padding:'5px 12px',borderRadius:4,border:`1px solid ${bdr}`,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,background:sortBy===k?ACCENT:'transparent',color:sortBy===k?'#fff':txS}}>{l}</button>
          ))}
        </div>
      </div>

      {chartData.length>0&&(
        <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
          <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:16}}>Pending vs Resolved by Ward</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{top:5,right:5,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T?'#1e293b':'#f1f5f9'}/>
              <XAxis dataKey="name" tick={{fill:txS,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:txS,fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,fontSize:13}}/>
              <Bar dataKey="pending" name="Pending" fill="#dc2626" radius={[4,4,0,0]} opacity={0.85}/>
              <Bar dataKey="resolved" name="Resolved" fill="#16a34a" radius={[4,4,0,0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
        {filtered.map((w,i)=>{
          const g = w.grade?.grade, c = gc(g)
          return (
            <motion.div key={w.ward} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
              style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:18}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:txM,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{w.ward}</div>
                  <div style={{fontSize:12,color:txS,marginTop:3}}>{w.city} · {w.councillor}</div>
                </div>
                <div style={{width:36,height:36,borderRadius:8,background:c+'18',border:`1px solid ${c}33`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:10}}>
                  <div style={{fontSize:15,fontWeight:900,color:c,lineHeight:1}}>{g}</div>
                  <div style={{fontSize:8,color:c,fontWeight:600,textTransform:'uppercase'}}>{w.grade?.label}</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                {[['Total',w.total,txM],['Pending',w.pendingIssues,'#d97706'],['Resolved',w.resolved,'#16a34a']].map(([l,v,col])=>(
                  <div key={l} style={{background:T?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:6,padding:'8px',textAlign:'center'}}>
                    <div style={{fontSize:16,fontWeight:800,color:col}}>{v}</div>
                    <div style={{fontSize:10,color:txS,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:11,color:txS,fontWeight:600}}>Resolution Rate</span>
                  <span style={{fontSize:11,fontWeight:700,color:w.resolutionRate>=60?'#16a34a':w.resolutionRate>=30?'#d97706':'#dc2626'}}>{w.resolutionRate}%</span>
                </div>
                <div style={{height:5,background:T?'#334155':'#f1f5f9',borderRadius:999,overflow:'hidden'}}>
                  <motion.div initial={{width:0}} animate={{width:`${w.resolutionRate}%`}} transition={{delay:i*0.04+0.3,duration:0.7}}
                    style={{height:'100%',borderRadius:999,background:w.resolutionRate>=60?'#16a34a':w.resolutionRate>=30?'#d97706':'#dc2626'}}/>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                <span style={{color:txS}}>Avg Risk: <strong style={{color:txM}}>{w.avgRisk}</strong></span>
                <span style={{color:txS}}>Pending: <strong style={{color:'#d97706'}}>{fmt(w.pendingCost)}</strong></span>
              </div>
            </motion.div>
          )
        })}
      </div>
      {filtered.length===0&&<div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:'48px 32px',textAlign:'center'}}><div style={{fontWeight:700,color:txM,marginBottom:6}}>No ward data — run: <code style={{color:ACCENT}}>node src/seed.js</code></div></div>}
    </div>
  )
}
