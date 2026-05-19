import { useEffect, useRef } from 'react'

const sevColor = s => s==='high'?'#dc2626':s==='medium'?'#d97706':'#16a34a'

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y)
  ctx.closePath()
}

export default function AIDetectionCanvas({ imageUrl, detections, modelName, processingMs }) {
  const ref = useRef()

  useEffect(() => {
    if (!ref.current || !imageUrl || !detections?.length) return
    const canvas = ref.current, ctx = canvas.getContext('2d'), img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      canvas.width  = img.naturalWidth  || img.width  || 640
      canvas.height = img.naturalHeight || img.height || 480
      ctx.drawImage(img, 0, 0)

      // Scale from model input (640×480) to actual image size
      const sx = canvas.width  / 640
      const sy = canvas.height / 480

      detections.forEach(({ bbox, label, confidence, severity }, i) => {
        const [x1,y1,x2,y2] = bbox
        const rx = x1*sx, ry = y1*sy, rw = (x2-x1)*sx, rh = (y2-y1)*sy
        const c  = sevColor(severity)
        const lw = Math.max(2, canvas.width/220)

        // Box + fill
        ctx.strokeStyle = c; ctx.lineWidth = lw
        ctx.strokeRect(rx, ry, rw, rh)
        ctx.fillStyle = c+'18'; ctx.fillRect(rx, ry, rw, rh)

        // Corner accents
        const d = Math.min(16, rw*0.18, rh*0.18)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, canvas.width/300)
        ;[[rx,ry],[rx+rw,ry],[rx,ry+rh],[rx+rw,ry+rh]].forEach(([cx,cy],j) => {
          const dx=j%2===0?d:-d, dy=j<2?d:-d
          ctx.beginPath(); ctx.moveTo(cx+dx,cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+dy); ctx.stroke()
        })

        // Label pill
        const fs  = Math.max(11, Math.min(14, canvas.width/48))
        const txt = `${label.toUpperCase()}  ${(confidence*100).toFixed(1)}%`
        ctx.font  = `700 ${fs}px Inter,Arial,sans-serif`
        const tw  = ctx.measureText(txt).width
        const ph  = fs+10, pw = tw+18
        const lx  = rx
        const ly  = ry > ph+4 ? ry-ph-4 : ry+rh+4
        ctx.fillStyle = c
        roundRect(ctx, lx, ly, pw, ph, 4); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'
        ctx.fillText(txt, lx+9, ly+ph/2)

        // Index badge
        const br = Math.max(10, fs*0.85)
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.beginPath(); ctx.arc(rx+rw-br-4, ry+br+4, br, 0, Math.PI*2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(9,fs-2)}px Inter,Arial,sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(i+1, rx+rw-br-4, ry+br+4)
        ctx.textAlign = 'left'
      })

      // Model watermark
      const wf = Math.max(10, canvas.width/68)
      const wm = `${modelName||'YOLOv8n-CRDDC'}  ·  ${processingMs||0}ms`
      ctx.font = `500 ${wf}px Inter,Arial,sans-serif`
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'
      const wmW = ctx.measureText(wm).width+16
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      roundRect(ctx, canvas.width-wmW-4, canvas.height-wf-14, wmW+4, wf+10, 4); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(wm, canvas.width-8, canvas.height-8)
      ctx.textAlign = 'left'
    }

    img.onerror = () => {
      canvas.width=640; canvas.height=360
      ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,640,360)
      ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='16px Inter,sans-serif'
      ctx.textAlign='center'; ctx.fillText('Image preview unavailable',320,180)
    }
    img.src = imageUrl
  }, [imageUrl, detections, modelName, processingMs])

  return <canvas ref={ref} style={{width:'100%',maxHeight:320,objectFit:'contain',borderRadius:8,display:'block'}}/>
}
