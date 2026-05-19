const B = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const h = t => ({ Authorization: `Bearer ${t}` })

export const api = {
  getReports:      (t, q={}) => fetch(`${B()}/api/reports?${new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([,v])=>v!=null)))}`, {headers:h(t)}).then(r=>r.json()),
  getStats:        t         => fetch(`${B()}/api/stats`,         {headers:h(t)}).then(r=>r.json()),
  getTrends:       t         => fetch(`${B()}/api/trends`,        {headers:h(t)}).then(r=>r.json()),
  getTopDangerous: t         => fetch(`${B()}/api/top-dangerous`, {headers:h(t)}).then(r=>r.json()),
  updateStatus: (t,id,status) => fetch(`${B()}/api/reports/${id}/status`,{method:'PATCH',headers:{...h(t),'Content-Type':'application/json'},body:JSON.stringify({status})}).then(r=>r.json()),
  createReport: (t,fd)        => fetch(`${B()}/api/reports`,{method:'POST',headers:h(t),body:fd}).then(r=>r.json()),
  getBudgetPlan:  (t,budget)  => fetch(`${B()}/api/features/budget?budget=${budget}`,{headers:h(t)}).then(r=>r.json()),
  getWards:       t           => fetch(`${B()}/api/features/wards`,  {headers:h(t)}).then(r=>r.json()),
  getPredictions: t           => fetch(`${B()}/api/features/predict`,{headers:h(t)}).then(r=>r.json()),
}
