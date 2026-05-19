import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../hooks/useApi'

const ACCENT='#e85d04', BLUE='#1a3c6e'
const rc = s => s>=71?'#dc2626':s>=31?'#d97706':'#16a34a'
const fmt = n => n>=10000000?`₹${(n/10000000).toFixed(1)} Cr`:n>=100000?`₹${(n/100000).toFixed(1)} L`:`₹${n.toLocaleString('en-IN')}`
const PRESETS = [{l:'₹10 Lakh',v:1000000},{l:'₹25 Lakh',v:2500000},{l:'₹50 Lakh',v:5000000},{l:'₹1 Crore',v:10000000},{l:'₹2 Crore',v:20000000}]

export default function BudgetOptimizer({ token, T, bg2, bdr, txM, txS }) {
  const [budget,  setBudget]  = useState(5000000)
  const [custom,  setCustom]  = useState('')
  const [plan,    setPlan]    = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try { setPlan(await api.getBudgetPlan(token, budget)) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const sc = s => ({high:'#dc2626',medium:'#d97706',low:'#16a34a'}[s]||'#6366f1')

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:'18px 22px',borderLeft:`4px solid ${ACCENT}`}}>
        <div style={{fontWeight:800,fontSize:18,color:txM,marginBottom:6}}>Budget Optimizer</div>
        <div style={{fontSize:13,color:txS,lineHeight:1.7}}>Enter your repair budget. The algorithm uses risk-per-rupee scoring to select the optimal set of roads — maximising public safety impact within your financial constraints.</div>
      </div>

      <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
        <div style={{fontSize:11,fontWeight:700,color:txS,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:14}}>Select Budget</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
          {PRESETS.map(p=>(
            <button key={p.v} onClick={()=>{setBudget(p.v);setCustom('')}}
              style={{padding:'9px 18px',borderRadius:6,border:`1px solid ${budget===p.v?ACCENT:bdr}`,background:budget===p.v?ACCENT:'transparent',color:budget===p.v?'#fff':txS,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
              {p.l}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:10}}>
          <input type="number" placeholder="Custom amount (₹)" value={custom}
            onChange={e=>{setCustom(e.target.value);if(e.target.value)setBudget(+e.target.value)}}
            style={{flex:1,padding:'10px 14px',borderRadius:6,background:T?'#0f172a':'#f8fafc',border:`1px solid ${bdr}`,color:txM,fontSize:14,outline:'none',fontFamily:'inherit'}}/>
          <button onClick={run} disabled={loading||!budget}
            style={{padding:'10px 28px',borderRadius:6,border:'none',background:BLUE,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',opacity:loading?0.7:1,whiteSpace:'nowrap'}}>
            {loading?'Calculating…':'Optimize Budget'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {plan && (
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[[fmt(plan.budgetUsed),'Budget Used',ACCENT,'of '+fmt(plan.budget)],[fmt(plan.budgetRemaining),'Remaining','#16a34a','unspent'],[plan.roadsSelected,'Roads Selected',BLUE,`of ${plan.roadsTotal}`],[plan.riskReduction,'Risk Reduction','#7c3aed','estimated']].map(([v,l,c,sub])=>(
                <div key={l} style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:16,borderTop:`3px solid ${c}`}}>
                  <div style={{fontSize:22,fontWeight:900,color:c,letterSpacing:'-0.04em'}}>{v}</div>
                  <div style={{fontSize:12,color:txM,fontWeight:600,marginTop:4}}>{l}</div>
                  <div style={{fontSize:11,color:txS,marginTop:2}}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{background:T?'rgba(232,93,4,0.08)':'#fff7ed',border:`1px solid ${T?'rgba(232,93,4,0.2)':'#fed7aa'}`,borderRadius:10,padding:'16px 20px',borderLeft:`4px solid ${ACCENT}`}}>
              <div style={{fontWeight:700,color:txM,fontSize:14}}>With {fmt(budget)}, repair {plan.roadsSelected} roads · reduce overall risk by {plan.riskReduction}</div>
              <div style={{fontSize:13,color:txS,marginTop:4}}>Estimated {plan.estimatedLivesSaved} accidents prevented · Avg risk before: {plan.avgRiskBefore}/100</div>
            </div>

            <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:22}}>
              <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:3,height:18,background:ACCENT,borderRadius:2,display:'inline-block'}}/>Recommended Repair Sequence
              </div>
              <div style={{display:'grid',gridTemplateColumns:'auto 2fr 1fr 1fr 1fr 1fr',gap:10,padding:'8px 10px',background:T?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${bdr}`,borderRadius:6,marginBottom:6}}>
                {['#','Location','Ward','Severity','Risk','Est. Cost'].map(h=>(
                  <div key={h} style={{fontSize:10,fontWeight:700,color:txS,textTransform:'uppercase',letterSpacing:'0.07em'}}>{h}</div>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:2,maxHeight:380,overflowY:'auto'}}>
                {plan.selected.map((r,i)=>(
                  <motion.div key={r.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                    style={{display:'grid',gridTemplateColumns:'auto 2fr 1fr 1fr 1fr 1fr',gap:10,padding:'10px',borderRadius:6,borderBottom:`1px solid ${bdr}`,alignItems:'center'}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:ACCENT+'18',color:ACCENT,fontSize:11,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center'}}>{i+1}</div>
                    <div style={{fontSize:13,color:txM,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.location}</div>
                    <div style={{fontSize:11,color:txS,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.ward}</div>
                    <span style={{background:sc(r.severity)+'18',color:sc(r.severity),border:`1px solid ${sc(r.severity)}33`,padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:700,width:'fit-content'}}>{r.severity?.toUpperCase()}</span>
                    <div style={{fontSize:14,fontWeight:800,color:rc(r.riskScore)}}>{r.riskScore}</div>
                    <div style={{fontSize:13,fontWeight:600,color:txM}}>{fmt(r.repairCost)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!plan&&!loading&&(
        <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:'48px 32px',textAlign:'center'}}>
          <div style={{fontWeight:700,color:txM,fontSize:15,marginBottom:6}}>Select a budget to get started</div>
          <div style={{fontSize:13,color:txS}}>The optimizer calculates the best roads to repair within your allocated funds</div>
        </div>
      )}
    </div>
  )
}
