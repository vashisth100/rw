const mongoose = require('mongoose')

const ReportSchema = new mongoose.Schema({
  imageUrl:   { type:String, required:true },
  location: {
    name: { type:String, default:'Unknown' },
    lat:  { type:Number, required:true },
    lng:  { type:Number, required:true },
  },
  type:       { type:String, enum:['Pothole','Crack'], required:true },
  severity:   { type:String, enum:['low','medium','high'], required:true },
  riskScore:  { type:Number, min:0, max:100, required:true },
  confidence: { type:Number, default:0.8 },
  status:     { type:String, enum:['Reported','In Progress','Resolved'], default:'Reported' },
  reporter:   { type:String, default:'Anonymous' },
  userId:     { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  detections: [{ label:String, confidence:Number, bbox:[Number], severity:String }],
  ward:        { type:String, default:'Unknown Ward' },
  councillor:  { type:String, default:'Unknown' },
  city:        { type:String, default:'Unknown' },
  repairCost:  { type:Number, default:0 },
  createdAt:   { type:Date, default:Date.now },
  updatedAt:   { type:Date, default:Date.now },
})

ReportSchema.index({ 'location.lat':1, 'location.lng':1 })
ReportSchema.index({ riskScore:-1 })
ReportSchema.index({ createdAt:-1 })
ReportSchema.index({ ward:1, city:1 })

module.exports = mongoose.model('Report', ReportSchema)
