// Only seed a fresh, explicitly named disposable integration database.
const fs=require('node:fs');
(async()=>{
  if(process.env.DB_NAME!=='portfolio_integration'||process.env.RUN_MYSQL_TESTS!=='1')throw Error('Disposable CI database required');
  const db=await require('mysql2/promise').createConnection({host:'127.0.0.1',port:3306,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,multipleStatements:true});
  try{await db.query(fs.readFileSync('database/seed.sql','utf8'));}finally{await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
