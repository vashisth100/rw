require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('./models/User')
const Report   = require('./models/Report')

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roadwatch'

const INCIDENTS = [
  {name:'NH-48 Mahipalpur, New Delhi',        ward:'Mahipalpur Ward',      councillor:'Rajesh Gupta',     lat:28.5355,lng:77.1190,type:'Pothole',sev:'high',  risk:92,conf:0.94,status:'Reported',   city:'Delhi',    rep:'Vikram S.',  cost:82000},
  {name:'Ring Road, Lajpat Nagar',            ward:'Lajpat Nagar Ward',    councillor:'Sunita Sharma',    lat:28.5665,lng:77.2431,type:'Pothole',sev:'high',  risk:88,conf:0.94,status:'Reported',   city:'Delhi',    rep:'Priya M.',   cost:74000},
  {name:'Outer Ring Road, Munirka',           ward:'Munirka Ward',          councillor:'Amit Yadav',       lat:28.5527,lng:77.1718,type:'Crack',  sev:'high',  risk:79,conf:0.89,status:'In Progress',city:'Delhi',    rep:'Arjun K.',   cost:45000},
  {name:'MG Road, Connaught Place',           ward:'Connaught Place Ward',  councillor:'Deepak Jain',      lat:28.6314,lng:77.2167,type:'Pothole',sev:'medium',risk:55,conf:0.82,status:'In Progress',city:'Delhi',    rep:'Neha R.',    cost:18000},
  {name:'DND Flyway, Noida Entry',            ward:'IP Extension Ward',     councillor:'Ravi Kapoor',      lat:28.5821,lng:77.3034,type:'Crack',  sev:'high',  risk:81,conf:0.91,status:'Reported',   city:'Delhi',    rep:'Sanjay T.',  cost:52000},
  {name:'Rohini Sector 9 Main Road',          ward:'Rohini Ward',           councillor:'Meena Devi',       lat:28.7041,lng:77.1025,type:'Pothole',sev:'medium',risk:48,conf:0.78,status:'Reported',   city:'Delhi',    rep:'Kavya B.',   cost:14000},
  {name:'Dwarka Sector 12 Flyover',           ward:'Dwarka Ward',           councillor:'Suresh Negi',      lat:28.5921,lng:77.0460,type:'Crack',  sev:'high',  risk:76,conf:0.87,status:'In Progress',city:'Delhi',    rep:'Rahul D.',   cost:38000},
  {name:'Karol Bagh Main Market Road',        ward:'Karol Bagh Ward',       councillor:'Anita Singh',      lat:28.6514,lng:77.1909,type:'Pothole',sev:'low',   risk:24,conf:0.73,status:'Resolved',   city:'Delhi',    rep:'Mohan L.',   cost:5500},
  {name:'Shahdara Bridge, GTB Nagar',         ward:'Shahdara Ward',         councillor:'Dinesh Kumar',     lat:28.6869,lng:77.2833,type:'Pothole',sev:'high',  risk:85,conf:0.93,status:'Reported',   city:'Delhi',    rep:'Sunita P.',  cost:67000},
  {name:'NH-24 near Akshardham',              ward:'Preet Vihar Ward',      councillor:'Santosh Yadav',    lat:28.6127,lng:77.3010,type:'Pothole',sev:'high',  risk:90,conf:0.95,status:'Reported',   city:'Delhi',    rep:'Deepak V.',  cost:78000},
  {name:'Najafgarh Road, Uttam Nagar',        ward:'Uttam Nagar Ward',      councillor:'Harish Garg',      lat:28.6194,lng:77.0583,type:'Pothole',sev:'high',  risk:83,conf:0.92,status:'Reported',   city:'Delhi',    rep:'Ravi K.',    cost:61000},
  {name:'Vikas Marg, Nirman Vihar',           ward:'Vishwas Nagar Ward',    councillor:'Pooja Arora',      lat:28.6371,lng:77.2920,type:'Crack',  sev:'medium',risk:51,conf:0.80,status:'In Progress',city:'Delhi',    rep:'Ajay M.',    cost:16000},
  {name:'Pusa Road, Rajendra Nagar',          ward:'Rajendra Nagar Ward',   councillor:'Vijay Batra',      lat:28.6428,lng:77.1748,type:'Pothole',sev:'medium',risk:44,conf:0.76,status:'Resolved',   city:'Delhi',    rep:'Geeta S.',   cost:12000},
  {name:'Mathura Road, Sarai Kale Khan',      ward:'Okhla Ward',            councillor:'Zubair Ahmed',     lat:28.5934,lng:77.2607,type:'Crack',  sev:'low',   risk:19,conf:0.71,status:'Resolved',   city:'Delhi',    rep:'Fatima B.',  cost:3800},
  {name:'Wazirabad Road, Civil Lines',        ward:'Civil Lines Ward',       councillor:'Prem Lata',        lat:28.6814,lng:77.2219,type:'Crack',  sev:'medium',risk:42,conf:0.77,status:'In Progress',city:'Delhi',    rep:'Shyam G.',   cost:11000},
  {name:'Eastern Express Highway, Kurla',     ward:'Kurla Ward',             councillor:'Santosh Patil',    lat:19.0725,lng:72.8851,type:'Pothole',sev:'high',  risk:89,conf:0.94,status:'Reported',   city:'Mumbai',   rep:'Vijay P.',   cost:76000},
  {name:'LBS Road, Ghatkopar West',           ward:'Ghatkopar Ward',         councillor:'Mangal More',      lat:19.0874,lng:72.9082,type:'Crack',  sev:'high',  risk:77,conf:0.88,status:'In Progress',city:'Mumbai',   rep:'Anjali D.',  cost:42000},
  {name:'Western Express Hwy, Andheri',       ward:'Andheri Ward',           councillor:'Sudha Naik',       lat:19.1197,lng:72.8464,type:'Pothole',sev:'medium',risk:53,conf:0.81,status:'In Progress',city:'Mumbai',   rep:'Rohan S.',   cost:17000},
  {name:'Sion-Panvel Highway, Chembur',       ward:'Chembur Ward',           councillor:'Ramesh Raut',      lat:19.0544,lng:72.9005,type:'Pothole',sev:'high',  risk:84,conf:0.91,status:'Reported',   city:'Mumbai',   rep:'Prachi J.',  cost:63000},
  {name:'SV Road, Bandra West',               ward:'Bandra Ward',            councillor:'Asif Zakaria',     lat:19.0596,lng:72.8295,type:'Crack',  sev:'low',   risk:21,conf:0.72,status:'Resolved',   city:'Mumbai',   rep:'Kabir N.',   cost:4200},
  {name:'Linking Road, Khar',                 ward:'Khar Ward',              councillor:'Ameet Satam',      lat:19.0722,lng:72.8346,type:'Pothole',sev:'medium',risk:46,conf:0.79,status:'Reported',   city:'Mumbai',   rep:'Smita K.',   cost:13000},
  {name:'Jogeshwari-Vikhroli Link Road',      ward:'Jogeshwari Ward',        councillor:'Ravindra Waikar',  lat:19.1273,lng:72.8731,type:'Crack',  sev:'high',  risk:80,conf:0.90,status:'Reported',   city:'Mumbai',   rep:'Nilesh B.',  cost:51000},
  {name:'Ghodbunder Road, Thane West',        ward:'Thane West Ward',        councillor:'Sanjay More',      lat:19.2183,lng:72.9781,type:'Crack',  sev:'high',  risk:75,conf:0.86,status:'Reported',   city:'Mumbai',   rep:'Dinesh C.',  cost:37000},
  {name:'NH-48, Khalapur Toll Area',          ward:'Khalapur Ward',          councillor:'Suresh Ghule',     lat:18.8296,lng:73.2653,type:'Pothole',sev:'high',  risk:93,conf:0.97,status:'Reported',   city:'Mumbai',   rep:'Arun M.',    cost:89000},
  {name:'Thane-Belapur Road, Airoli',         ward:'Airoli Ward',            councillor:'Ganesh Naik',      lat:19.1563,lng:72.9998,type:'Pothole',sev:'medium',risk:49,conf:0.78,status:'In Progress',city:'Mumbai',   rep:'Supriya A.', cost:15000},
  {name:'Outer Ring Road, Marathahalli',      ward:'Marathahalli Ward',      councillor:'B.R. Nagaraj',     lat:12.9591,lng:77.6974,type:'Pothole',sev:'high',  risk:91,conf:0.96,status:'Reported',   city:'Bengaluru',rep:'Suresh K.',  cost:81000},
  {name:'Hosur Road, Electronic City',        ward:'Electronic City Ward',   councillor:'Anitha Kumar',     lat:12.8399,lng:77.6770,type:'Crack',  sev:'medium',risk:54,conf:0.80,status:'In Progress',city:'Bengaluru',rep:'Rajiv S.',   cost:18000},
  {name:'Bannerghatta Road, JP Nagar',        ward:'JP Nagar Ward',          councillor:'Sridhar Rao',      lat:12.8878,lng:77.5971,type:'Pothole',sev:'high',  risk:82,conf:0.92,status:'Reported',   city:'Bengaluru',rep:'Divya M.',   cost:59000},
  {name:'Bellary Road, Hebbal',               ward:'Hebbal Ward',            councillor:'Muniraju C.',      lat:13.0466,lng:77.5972,type:'Crack',  sev:'low',   risk:18,conf:0.70,status:'Resolved',   city:'Bengaluru',rep:'Kiran B.',   cost:3500},
  {name:'Mysore Road, Kengeri',               ward:'Kengeri Ward',           councillor:'Girish Naik',      lat:12.9074,lng:77.4823,type:'Pothole',sev:'medium',risk:47,conf:0.77,status:'Reported',   city:'Bengaluru',rep:'Sneha P.',   cost:13500},
  {name:'Tumkur Road, Yeshwanthpur',          ward:'Yeshwanthpur Ward',      councillor:'Pushpa Devi',      lat:13.0225,lng:77.5472,type:'Crack',  sev:'high',  risk:78,conf:0.88,status:'In Progress',city:'Bengaluru',rep:'Venkat R.',  cost:44000},
  {name:'Sarjapur Road, Bellandur',           ward:'Bellandur Ward',         councillor:'Narayanaswamy B.', lat:12.9268,lng:77.6775,type:'Pothole',sev:'high',  risk:86,conf:0.93,status:'Reported',   city:'Bengaluru',rep:'Aditya S.',  cost:69000},
  {name:'Magadi Road, Vijayanagar',           ward:'Vijayanagar Ward',       councillor:'H.V. Raju',        lat:12.9784,lng:77.5152,type:'Crack',  sev:'medium',risk:43,conf:0.76,status:'Resolved',   city:'Bengaluru',rep:'Meghana T.', cost:11000},
  {name:'Outer Ring Road, Gachibowli',        ward:'Gachibowli Ward',        councillor:'T. Prakash Rao',   lat:17.4435,lng:78.3477,type:'Pothole',sev:'high',  risk:87,conf:0.93,status:'Reported',   city:'Hyderabad',rep:'Ramesh N.',  cost:71000},
  {name:'Banjara Hills Road No.12',           ward:'Banjara Hills Ward',     councillor:'Kalvakuntla S.',   lat:17.4126,lng:78.4438,type:'Pothole',sev:'high',  risk:89,conf:0.95,status:'Reported',   city:'Hyderabad',rep:'Lakshmi T.', cost:77000},
  {name:'Jubilee Hills Check Post Road',      ward:'Jubilee Hills Ward',     councillor:'Madhu Yashki',     lat:17.4311,lng:78.4084,type:'Crack',  sev:'medium',risk:52,conf:0.81,status:'In Progress',city:'Hyderabad',rep:'Sravan K.',  cost:16500},
  {name:'Uppal Main Road, East Hyderabad',    ward:'Uppal Ward',             councillor:'Balram Naik',      lat:17.4050,lng:78.5597,type:'Pothole',sev:'medium',risk:46,conf:0.78,status:'Reported',   city:'Hyderabad',rep:'Padma R.',   cost:13000},
  {name:'Shamshabad Airport Road',            ward:'Shamshabad Ward',        councillor:'Rajender Rao',     lat:17.2403,lng:78.4294,type:'Crack',  sev:'high',  risk:76,conf:0.87,status:'Reported',   city:'Hyderabad',rep:'Anil G.',    cost:39000},
  {name:'Dilsukhnagar Main Road',             ward:'Dilsukhnagar Ward',      councillor:'Jeevan Reddy',     lat:17.3688,lng:78.5247,type:'Pothole',sev:'low',   risk:23,conf:0.73,status:'Resolved',   city:'Hyderabad',rep:'Usha D.',    cost:5000},
  {name:'Anna Salai, Teynampet',              ward:'Teynampet Ward',         councillor:'R. Natarajan',     lat:13.0418,lng:80.2341,type:'Pothole',sev:'high',  risk:83,conf:0.92,status:'Reported',   city:'Chennai',  rep:'Murugan S.', cost:60000},
  {name:'GST Road, Chromepet',                ward:'Chromepet Ward',         councillor:'K. Selvam',        lat:12.9516,lng:80.1462,type:'Crack',  sev:'high',  risk:79,conf:0.89,status:'In Progress',city:'Chennai',  rep:'Priya V.',   cost:46000},
  {name:'Mount Road, Guindy',                 ward:'Guindy Ward',            councillor:'M. Suresh',        lat:13.0067,lng:80.2206,type:'Pothole',sev:'medium',risk:50,conf:0.79,status:'Reported',   city:'Chennai',  rep:'Arumugam T.',cost:15500},
  {name:'ECR Road, Thiruvanmiyur',            ward:'Thiruvanmiyur Ward',     councillor:'P. Anbalagan',     lat:12.9830,lng:80.2590,type:'Crack',  sev:'low',   risk:20,conf:0.72,status:'Resolved',   city:'Chennai',  rep:'Deepa K.',   cost:4000},
  {name:'Poonamallee High Road, Koyambedu',   ward:'Koyambedu Ward',         councillor:'S. Vijayan',       lat:13.0694,lng:80.1948,type:'Pothole',sev:'high',  risk:85,conf:0.93,status:'Reported',   city:'Chennai',  rep:'Rajan M.',   cost:65000},
  {name:'EM Bypass, Kasba',                   ward:'Kasba Ward',             councillor:'Subrata Das',      lat:22.5124,lng:88.3890,type:'Pothole',sev:'high',  risk:88,conf:0.94,status:'Reported',   city:'Kolkata',  rep:'Debashis M.',cost:73000},
  {name:'VIP Road, New Town Kolkata',         ward:'New Town Ward',          councillor:'Tapas Roy',        lat:22.6060,lng:88.4546,type:'Crack',  sev:'medium',risk:49,conf:0.78,status:'In Progress',city:'Kolkata',  rep:'Anuradha B.',cost:14500},
  {name:'Park Street, Central Kolkata',       ward:'Hare Street Ward',       councillor:'Malya Mukherjee',  lat:22.5520,lng:88.3516,type:'Pothole',sev:'low',   risk:22,conf:0.70,status:'Resolved',   city:'Kolkata',  rep:'Sourav G.',  cost:5200},
  {name:'Diamond Harbour Road, Behala',       ward:'Behala Ward',            councillor:'Sudip Pandey',     lat:22.4938,lng:88.3156,type:'Crack',  sev:'high',  risk:77,conf:0.88,status:'Reported',   city:'Kolkata',  rep:'Mitali S.',  cost:43000},
  {name:'Pune-Mumbai Expressway, Wakad',      ward:'Wakad Ward',             councillor:'Santosh Shinde',   lat:18.5975,lng:73.7898,type:'Pothole',sev:'high',  risk:90,conf:0.95,status:'Reported',   city:'Pune',     rep:'Nikhil J.',  cost:78000},
  {name:'Nagar Road, Kalyani Nagar',          ward:'Kalyani Nagar Ward',     councillor:'Murlidhar Mohol',  lat:18.5502,lng:73.9011,type:'Crack',  sev:'medium',risk:48,conf:0.78,status:'In Progress',city:'Pune',     rep:'Pooja D.',   cost:14000},
  {name:'FC Road, Shivajinagar',              ward:'Shivajinagar Ward',      councillor:'Arvind Shinde',    lat:18.5280,lng:73.8416,type:'Pothole',sev:'low',   risk:19,conf:0.71,status:'Resolved',   city:'Pune',     rep:'Abhijit K.', cost:4000},
  {name:'Satara Road, Bibwewadi',             ward:'Bibwewadi Ward',         councillor:'Ganesh Bidkar',    lat:18.4719,lng:73.8571,type:'Crack',  sev:'high',  risk:82,conf:0.91,status:'Reported',   city:'Pune',     rep:'Shweta P.',  cost:57000},
  {name:'SG Highway, Bodakdev',               ward:'Bodakdev Ward',          councillor:'Bharat Shah',      lat:23.0415,lng:72.5052,type:'Pothole',sev:'high',  risk:86,conf:0.93,status:'Reported',   city:'Ahmedabad',rep:'Jignesh P.', cost:68000},
  {name:'CG Road, Navrangpura',               ward:'Navrangpura Ward',       councillor:'Kirti Patel',      lat:23.0340,lng:72.5598,type:'Crack',  sev:'medium',risk:45,conf:0.77,status:'In Progress',city:'Ahmedabad',rep:'Ruchit S.',  cost:12500},
  {name:'Ashram Road, Paldi',                 ward:'Paldi Ward',             councillor:'Ramesh Trivedi',   lat:23.0117,lng:72.5765,type:'Pothole',sev:'low',   risk:21,conf:0.72,status:'Resolved',   city:'Ahmedabad',rep:'Harsha D.',  cost:4500},
  {name:'Ring Road, Vatva GIDC',              ward:'Vatva Ward',             councillor:'Dhiru Patel',      lat:22.9683,lng:72.6402,type:'Crack',  sev:'high',  risk:80,conf:0.90,status:'Reported',   city:'Ahmedabad',rep:'Kalpesh M.', cost:50000},
]

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('✅ MongoDB connected')

  let demo = await User.findOne({email:'demo@roadwatch.ai'})
  if (!demo) {
    demo = await User.create({name:'Demo Officer',email:'demo@roadwatch.ai',password:'demo1234',role:'admin'})
    console.log('✅ Demo user: demo@roadwatch.ai / demo1234')
  }

  await Report.deleteMany({})
  const now = new Date()
  const docs = INCIDENTS.map((inc,i) => {
    const days  = Math.floor(Math.random()*90)
    const hours = Math.floor(Math.random()*24)
    const createdAt = new Date(now - days*86400000 - hours*3600000)
    const updatedAt = inc.status==='Resolved'
      ? new Date(createdAt.getTime() + Math.floor(2+Math.random()*12)*86400000)
      : createdAt
    return {
      imageUrl:`/uploads/demo_${(i%10)+1}.jpg`,
      location:{name:inc.name, lat:inc.lat, lng:inc.lng},
      type:inc.type, severity:inc.sev, riskScore:inc.risk, confidence:inc.conf,
      status:inc.status, reporter:inc.rep, userId:demo._id,
      detections:[{label:inc.type.toLowerCase(),confidence:inc.conf,severity:inc.sev,bbox:[40,55,200,155]}],
      ward:inc.ward, councillor:inc.councillor, city:inc.city, repairCost:inc.cost,
      createdAt, updatedAt,
    }
  })

  await Report.insertMany(docs)
  const total = docs.reduce((s,d)=>s+d.repairCost,0)
  console.log(`✅ Seeded ${docs.length} incidents across 8 cities`)
  console.log(`   High:${docs.filter(d=>d.severity==='high').length}  Medium:${docs.filter(d=>d.severity==='medium').length}  Low:${docs.filter(d=>d.severity==='low').length}`)
  console.log(`   Total repair cost: ₹${total.toLocaleString('en-IN')}`)
  process.exit(0)
}

seed().catch(e=>{ console.error('❌',e.message); process.exit(1) })
