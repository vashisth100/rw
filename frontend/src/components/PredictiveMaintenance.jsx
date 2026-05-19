import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../hooks/useApi'

const ACCENT='#e85d04'
const rc = s => s>=71?'#dc2626':s>=31?'#d97706':'#16a34a'
const urgStyle = u => ({
  CRITICAL:{bg:'rgba(220,38,38,0.12)',color:'#dc2626',border:'rgba(220,38,38,0.25)'},
  HIGH:    {bg:'rgba(217,119,6,0.12)', color:'#d97706',border:'rgba(217,119,6,0.25)'},
  MEDIUM:  {bg:'rgba(37,99,235,0.12)', color:'#2563eb',border:'rgba(37,99,235,0.25)'},
  LOW:     {bg:'rgba(22,163,74,0.12)', color:'#16a34a',border:'rgba(22,163,74,0.25)'},
}[u]||{bg:'rgba(99,102,241,0.12)',color:'#6366f1',border:'rgba(99,102,241,0.25)'})

export default function PredictiveMaintenance({ token, T, bg2, bdr, txM, txS }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    api.getPredictions(token).then(setData).catch(console.error).finally(()=>setLoading(false))
  }, [token])

  const preds    = data?.predictions || []
  const sum      = data?.summary     || {}
  const filtered = preds.filter(p =>
    filter==='all'      ? true :
    filter==='critical' ? p.urgency==='CRITICAL' :
    filter==='worsen'   ? p.willWorsen :
    filter==='monsoon'  ? p.monsoonVulnerable : true
  )

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:64}}>
      <div style={{width:36,height:36,border:'3px solid rgba(232,93,4,0.2)',borderTopColor:ACCENT,borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:'18px 22px',borderLeft:'4px solid #7c3aed'}}>
        <div style={{fontWeight:800,fontSize:18,color:txM,marginBottom:6}}>Predictive Maintenance Engine</div>
        <div style={{fontSize:13,color:txS,lineHeight:1.7}}>AI model analyzes report age, traffic volume, monsoon season proximity, and damage clustering to predict which roads will deteriorate fastest — before accidents happen.</div>
      </div>

      {sum.monsoonSeason&&(
        <motion.div initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}}
          style={{background:T?'rgba(37,99,235,0.1)':'#eff6ff',border:'1px solid rgba(37,99,235,0.3)',borderRadius:10,padding:'14px 20px',borderLeft:'4px solid #2563eb'}}>
          <div style={{fontWeight:700,color:txM,fontSize:14}}>Monsoon Season Active — {sum.monsoonRiskLevel} Risk</div>
          <div style={{fontSize:12,color:txS,marginTop:3}}>{sum.willWorsen} of {sum.total} roads predicted to worsen within 2 weeks. Rainfall accelerates damage.</div>
        </motion.div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {[['Roads Analyzed',sum.total||0,'#2563eb','pending issues'],['Critical Urgency',sum.critical||0,'#dc2626','need immediate action'],['Will Worsen',sum.willWorsen||0,'#d97706','in next 14 days'],['Avg Predicted Risk',sum.avgPredictedRisk||0,'#7c3aed','projected score']].map(([l,v,c,sub])=>(
          <div key={l} style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:16,borderTop:`3px solid ${c}`}}>
            <div style={{fontSize:26,fontWeight:900,color:c,letterSpacing:'-0.04em'}}>{v}</div>
            <div style={{fontSize:12,color:txM,fontWeight:600,marginTop:4}}>{l}</div>
            <div style={{fontSize:11,color:txS,marginTop:2}}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:8,padding:'10px 16px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <span style={{fontSize:12,color:txS,fontWeight:600}}>Filter:</span>
        {[['all','All'],['critical',`Critical (${sum.critical||0})`],['worsen','Will Worsen'],['monsoon','Monsoon Risk']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{padding:'5px 12px',borderRadius:4,border:`1px solid ${bdr}`,cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,background:filter===k?ACCENT:'transparent',color:filter===k?'#fff':txS}}>
            {l}
          </button>
        ))}
        <span style={{marginLeft:'auto',fontSize:12,color:txS}}>{filtered.length} shown</span>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtered.map((p,i)=>{
          const us = urgStyle(p.urgency)
          return (
            <motion.div key={String(p.id||i)} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
              style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:18}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                <div style={{background:us.bg,border:`1px solid ${us.border}`,borderRadius:6,padding:'6px 10px',textAlign:'center',flexShrink:0,minWidth:72}}>
                  <div style={{fontSize:11,fontWeight:900,color:us.color,letterSpacing:'0.04em'}}>{p.urgency}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:txM,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.location}</div>
                  <div style={{fontSize:12,color:txS,marginBottom:10,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                    <span>{p.ward} · {p.city}</span>
                    {p.highTraffic&&<span style={{background:'rgba(37,99,235,0.1)',color:'#2563eb',border:'1px solid rgba(37,99,235,0.2)',padding:'1px 7px',borderRadius:4,fontSize:10,fontWeight:700}}>HIGH TRAFFIC</span>}
                    {p.clustered&&<span style={{background:'rgba(124,58,237,0.1)',color:'#7c3aed',border:'1px solid rgba(124,58,237,0.2)',padding:'1px 7px',borderRadius:4,fontSize:10,fontWeight:700}}>CLUSTERED</span>}
                  </div>

                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    <div style={{textAlign:'center',flexShrink:0}}>
                      <div style={{fontSize:10,color:txS,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>Current</div>
                      <div style={{fontSize:22,fontWeight:900,color:rc(p.currentRisk),letterSpacing:'-0.04em'}}>{p.currentRisk}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{height:6,background:T?'#334155':'#f1f5f9',borderRadius:999,overflow:'hidden',marginBottom:5}}>
                        <div style={{height:'100%',borderRadius:999,width:`${p.currentRisk}%`,background:rc(p.currentRisk),opacity:0.4}}/>
                      </div>
                      <div style={{height:6,background:T?'#334155':'#f1f5f9',borderRadius:999,overflow:'hidden'}}>
                        <motion.div initial={{width:0}} animate={{width:`${p.predictedRisk}%`}} transition={{delay:i*0.03+0.4,duration:0.8}}
                          style={{height:'100%',borderRadius:999,background:rc(p.predictedRisk)}}/>
                      </div>
                    </div>
                    <div style={{textAlign:'center',flexShrink:0}}>
                      <div style={{fontSize:10,color:txS,fontWeight:700,textTransform:'uppercase',marginBottom:3}}>Predicted</div>
                      <div style={{fontSize:22,fontWeight:900,color:rc(p.predictedRisk),letterSpacing:'-0.04em'}}>{p.predictedRisk}</div>
                    </div>
                    {p.willWorsen&&(
                      <div style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.2)',borderRadius:6,padding:'4px 10px',textAlign:'center',flexShrink:0}}>
                        <div style={{fontSize:11,color:'#dc2626',fontWeight:700}}>+{p.riskIncrease}</div>
                        <div style={{fontSize:9,color:'#dc2626',opacity:0.7}}>in {p.daysToWorsen}d</div>
                      </div>
                    )}
                  </div>

                  <div style={{background:T?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:6,padding:'8px 12px',fontSize:12,color:txS,lineHeight:1.5}}>
                    <span style={{fontWeight:700,color:txM}}>Recommendation: </span>{p.recommendation}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
        {filtered.length===0&&<div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:'48px 32px',textAlign:'center'}}><div style={{fontWeight:700,color:txM}}>No predictions match this filter</div></div>}
      </div>
    </div>
  )
}
