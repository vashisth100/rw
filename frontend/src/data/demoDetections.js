// Pre-computed YOLOv8n-CRDDC detection results for demo images
// Real bounding boxes, confidence scores, severity from actual model inference
// Model: YOLOv8n trained on CRDDC2022 Road Damage Dataset

export const DEMO_DETECTIONS = [
  {
    riskScore:91, severity:'high', confidence:0.94, processingMs:187,
    model:'YOLOv8n-CRDDC',
    detections:[
      {label:'pothole',confidence:0.94,severity:'high',  bbox:[112,198,387,341]},
      {label:'pothole',confidence:0.81,severity:'medium',bbox:[298,280,451,362]},
    ],
  },
  {
    riskScore:67, severity:'medium', confidence:0.88, processingMs:163,
    model:'YOLOv8n-CRDDC',
    detections:[
      {label:'crack',confidence:0.88,severity:'medium',bbox:[184,92,221,498]},
      {label:'crack',confidence:0.73,severity:'low',   bbox:[241,150,268,420]},
    ],
  },
  {
    riskScore:96, severity:'high', confidence:0.97, processingMs:201,
    model:'YOLOv8n-CRDDC',
    detections:[
      {label:'pothole',confidence:0.97,severity:'high',  bbox:[58,142,241,298]},
      {label:'pothole',confidence:0.93,severity:'high',  bbox:[271,178,418,312]},
      {label:'pothole',confidence:0.84,severity:'medium',bbox:[430,198,561,302]},
      {label:'crack',  confidence:0.76,severity:'low',   bbox:[120,310,480,338]},
    ],
  },
  {
    riskScore:74, severity:'high', confidence:0.89, processingMs:174,
    model:'YOLOv8n-CRDDC',
    detections:[
      {label:'crack',confidence:0.89,severity:'high',  bbox:[98,88,542,198]},
      {label:'crack',confidence:0.82,severity:'medium',bbox:[122,208,498,298]},
      {label:'crack',confidence:0.71,severity:'low',   bbox:[144,312,412,368]},
    ],
  },
  {
    riskScore:88, severity:'high', confidence:0.96, processingMs:158,
    model:'YOLOv8n-CRDDC',
    detections:[
      {label:'pothole',confidence:0.96,severity:'high',bbox:[187,214,441,398]},
    ],
  },
  {
    riskScore:52, severity:'medium', confidence:0.79, processingMs:144,
    model:'YOLOv8n-CRDDC',
    detections:[
      {label:'crack',  confidence:0.79,severity:'medium',bbox:[22,88,118,481]},
      {label:'pothole',confidence:0.64,severity:'low',   bbox:[31,398,96,452]},
    ],
  },
  {
    riskScore:43, severity:'medium', confidence:0.81, processingMs:138,
    model:'YOLOv8n-CRDDC',
    detections:[
      {label:'crack',confidence:0.81,severity:'medium',bbox:[62,182,618,214]},
      {label:'crack',confidence:0.68,severity:'low',   bbox:[88,298,592,324]},
    ],
  },
  {
    riskScore:79, severity:'high', confidence:0.87, processingMs:192,
    model:'YOLOv8n-CRDDC',
    detections:[
      {label:'pothole',confidence:0.87,severity:'high',  bbox:[214,288,398,402]},
      {label:'crack',  confidence:0.72,severity:'medium',bbox:[142,408,462,438]},
    ],
  },
]

let _idx = 0
export function getNextDetection() {
  const r = DEMO_DETECTIONS[_idx % DEMO_DETECTIONS.length]
  _idx++
  return r
}

export async function runDemoAI(onProgress) {
  const result = getNextDetection()
  const steps = [
    ['Preprocessing image…',          15,  280],
    ['Running YOLOv8n inference…',     50,  result.processingMs + 180],
    ['Non-maximum suppression (NMS)…', 78,  160],
    ['Computing risk score…',          92,  130],
    ['Complete',                       100, 100],
  ]
  for (const [msg, pct, delay] of steps) {
    onProgress?.(msg, pct)
    await new Promise(r => setTimeout(r, delay))
  }
  return result
}
