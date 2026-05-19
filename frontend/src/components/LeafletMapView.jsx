import { useEffect, useRef, useState } from 'react'

const TILES = {
  roadmap:   { url:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',                              attr:'&copy; CARTO' },
  satellite: { url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr:'&copy; Esri' },
  terrain:   { url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',                                             attr:'&copy; OpenTopoMap' },
}

const rc = s => s>=71?'#dc2626':s>=31?'#d97706':'#16a34a'
const rs = s => s>=71?'rgba(220,38,38,0.6)':s>=31?'rgba(217,119,6,0.6)':'rgba(22,163,74,0.6)'

let _loaded = false
function loadLeaflet() {
  return new Promise(resolve => {
    if (_loaded && window.L) return resolve(window.L)
    if (!document.getElementById('lf-css')) {
      const l = document.createElement('link')
      l.id='lf-css'; l.rel='stylesheet'; l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(l)
    }
    const s1 = document.createElement('script'); s1.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s1.onload = () => {
      const s2 = document.createElement('script'); s2.src='https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'
      s2.onload = () => { _loaded=true; resolve(window.L) }
      s2.onerror= () => { _loaded=true; resolve(window.L) }
      document.head.appendChild(s2)
    }
    document.head.appendChild(s1)
  })
}

export default function LeafletMapView({ reports=[], selectedId, onSelect, mapType='roadmap', showHeatmap=false }) {
  const containerRef = useRef()
  const mapRef       = useRef(null)
  const tileRef      = useRef(null)
  const markersRef   = useRef([])
  const heatRef      = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadLeaflet().then(L => {
      if (!containerRef.current || mapRef.current) return
      const map = L.map(containerRef.current, { center:[22.5,82.3], zoom:5, zoomControl:true })
      const t = TILES[mapType]||TILES.roadmap
      tileRef.current = L.tileLayer(t.url,{attribution:t.attr,maxZoom:19,subdomains:'abcd'}).addTo(map)
      mapRef.current = map
      setReady(true)
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current=null; _loaded=false } }
  }, [])

  useEffect(() => {
    if (!ready||!mapRef.current||!window.L) return
    if (tileRef.current) tileRef.current.remove()
    const t = TILES[mapType]||TILES.roadmap
    tileRef.current = window.L.tileLayer(t.url,{attribution:t.attr,maxZoom:19,subdomains:'abcd'}).addTo(mapRef.current)
  }, [mapType, ready])

  useEffect(() => {
    if (!ready||!mapRef.current||!window.L) return
    const L = window.L
    if (heatRef.current) { heatRef.current.remove(); heatRef.current=null }
    if (showHeatmap && reports.length && L.heatLayer) {
      const pts = reports.map(r=>[ r.location?.lat??r.lat, r.location?.lng??r.lng, (r.riskScore??r.risk??50)/100 ])
      heatRef.current = L.heatLayer(pts,{radius:35,blur:25,gradient:{'0.2':'#16a34a','0.5':'#d97706','0.8':'#dc2626','1.0':'#7f1d1d'}}).addTo(mapRef.current)
    }
  }, [showHeatmap, reports, ready])

  useEffect(() => {
    if (!ready||!mapRef.current||!window.L) return
    const L = window.L
    markersRef.current.forEach(m=>m.remove()); markersRef.current=[]
    if (showHeatmap) return

    reports.forEach(r => {
      const id    = r._id??r.id
      const score = r.riskScore??r.risk??50
      const c     = rc(score)
      const isSel = id===selectedId
      const sz    = isSel?44:32
      const svg   = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz*1.3}" viewBox="0 0 44 57"><filter id="g${id}"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><path d="M22 2C13.2 2 6 9.2 6 18c0 11.3 16 34 16 34s16-22.7 16-34C38 9.2 30.8 2 22 2z" fill="${c}" filter="url(#g${id})" opacity="${isSel?1:0.9}"/>${isSel?`<circle cx="22" cy="18" r="15" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.3"/>`:''}><circle cx="22" cy="18" r="${isSel?9:7}" fill="white" opacity="0.95"/><text x="22" y="${isSel?22.5:21.5}" text-anchor="middle" fill="${c}" font-size="${isSel?9:7}" font-weight="800" font-family="Inter,Arial">${score}</text></svg>`
      const icon = L.divIcon({ html:`<div style="filter:drop-shadow(0 3px 8px ${rs(score)})">${svg}</div>`, className:'', iconSize:[sz,sz*1.3], iconAnchor:[sz/2,sz*1.3], popupAnchor:[0,-(sz*1.3)] })
      const lat = r.location?.lat??r.lat, lng = r.location?.lng??r.lng
      if (!lat||!lng) return
      const mk = L.marker([lat,lng],{icon,zIndexOffset:isSel?1000:score})
      mk.bindPopup(`<div style="background:#0f1e35;color:#e2e8f0;padding:16px;border-radius:12px;min-width:220px;font-family:Inter,Arial,sans-serif;border:1px solid rgba(255,255,255,0.08)"><div style="font-weight:800;font-size:14px;color:#f8fafc;margin-bottom:10px">${r.location?.name??r.location??'Unknown'}</div><div style="display:flex;gap:6px;margin-bottom:10px"><span style="background:${c}22;color:${c};border:1px solid ${c}44;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700">${(r.severity??'medium').toUpperCase()}</span><span style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);padding:3px 10px;border-radius:999px;font-size:11px">${r.status??'Reported'}</span></div><div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:2px;text-transform:uppercase">Risk Score</div><div style="font-size:22px;font-weight:900;color:${c}">${score}<span style="font-size:11px;color:rgba(255,255,255,0.3)">/100</span></div></div><div><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:2px;text-transform:uppercase">Type</div><div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.8);margin-top:4px">${r.type??'Pothole'}</div></div></div><div style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.3)">${r.reporter??'Anonymous'} · ${new Date(r.createdAt??Date.now()).toLocaleDateString('en-IN')}</div></div>`,{className:'rw-popup',maxWidth:280})
      mk.on('click',()=>onSelect(id))
      mk.addTo(mapRef.current)
      markersRef.current.push(mk)
    })
  }, [reports, selectedId, ready, showHeatmap])

  useEffect(() => {
    if (!ready||!selectedId||!mapRef.current) return
    const r = reports.find(r=>(r._id??r.id)===selectedId)
    if (r) { mapRef.current.setView([r.location?.lat??r.lat, r.location?.lng??r.lng],15,{animate:true}); setTimeout(()=>markersRef.current[reports.indexOf(r)]?.openPopup(),400) }
  }, [selectedId, ready])

  return (
    <>
      <style>{`.rw-popup .leaflet-popup-content-wrapper{background:transparent!important;border:none!important;box-shadow:0 16px 48px rgba(0,0,0,0.4)!important;border-radius:12px!important;padding:0!important}.rw-popup .leaflet-popup-content{margin:0!important}.rw-popup .leaflet-popup-tip-container{display:none!important}.leaflet-container{background:#0a1628!important}`}</style>
      <div ref={containerRef} style={{width:'100%',height:460,borderRadius:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}/>
    </>
  )
}
