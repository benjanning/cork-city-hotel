// Adapted from the original Node/Express/EJS coursework booking flow.
const express = require('express');
const session = require('express-session');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const {calculateNights, quote} = require('./booking');
const app = express();
const demo = process.env.MYSQL_MODE !== '1';
const rooms = [{id:1,name:'Single Room',price:80},{id:2,name:'Double Room',price:120},{id:3,name:'King Room',price:160}];
let connection;
if (!demo) {
  connection = require('mysql').createConnection({host:process.env.DB_HOST||'localhost',user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME});
  connection.connect();
}
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended:false,limit:'10kb'}));
app.use(session({secret:process.env.SESSION_SECRET||randomBytes(32).toString('hex'),resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'strict',maxAge:1800000}}));
app.set('view engine','ejs');
function getRooms(cb) { if(demo) return cb(null,rooms); connection.query('SELECT id,name,price FROM products',cb); }
app.get('/',(req,res)=>res.render('index'));
app.get('/booking',(req,res)=>getRooms((err,products)=>err?res.status(503).send('Database unavailable'):res.render('booking',{products})));
app.post('/booking',(req,res)=>{
  try {calculateNights(req.body.checkin,req.body.checkout);} catch(e) {return res.status(400).send(e.message);}
  req.session.bookingData = {checkin:req.body.checkin,checkout:req.body.checkout};
  delete req.session.roomData; delete req.session.confirmed;
  res.redirect('/select-room');
});
app.get('/select-room',(req,res)=>{
 if(!req.session.bookingData) return res.redirect('/booking');
 getRooms((err,rooms)=>err?res.status(503).send('Database unavailable'):res.render('select-room',{rooms,bookingData:{checkIn:req.session.bookingData.checkin,checkOut:req.session.bookingData.checkout}}));
});
app.post('/select-room',(req,res)=>{
 if(!req.session.bookingData) return res.redirect('/booking');
 getRooms((err,rooms)=>{
  if(err)return res.status(503).send('Database unavailable');
  const room=rooms.find(r=>r.id===Number(req.body.room));
  if(!room)return res.status(400).send('Select a valid room');
  try {const nights=calculateNights(req.session.bookingData.checkin,req.session.bookingData.checkout); const quantity=Number(req.body.quantity);
   req.session.roomData={roomName:room.name,quantity,totalCost:quote(room.price,quantity,nights)};
   res.redirect('/login');
  } catch(e){res.status(400).send(e.message);}
 });
});
app.get('/login',(req,res)=>req.session.roomData?res.render('login'):res.redirect('/booking'));
app.post('/login',(req,res)=>{if(!req.session.roomData)return res.redirect('/booking');req.session.confirmed=true;res.redirect('/confirmation');});
app.get('/confirmation',(req,res)=>{if(!req.session.confirmed)return res.redirect('/booking');res.render('confirmation',{bookingData:req.session.bookingData,roomData:req.session.roomData});});
app.get('/datetime',(req,res)=>res.send('External weather service omitted from the safe demonstration.'));
if(require.main===module)app.listen(process.env.PORT||3000,'127.0.0.1',()=>console.log('Local demo: http://127.0.0.1:3000'));
module.exports=app;
