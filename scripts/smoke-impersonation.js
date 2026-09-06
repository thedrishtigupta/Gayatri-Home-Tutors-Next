// scripts/smoke-impersonation.js
// Checks admin "View as tutor" against a running dev server.
//
//   node scripts/smoke-impersonation.js --port 3000
//
// Uses a disposable tutor with no account at all — the case an admin most often
// needs, previewing the panel for someone who never signed up. Cleans up after.
const fs=require("fs"),path=require("path");
const ROOT=path.join(__dirname,"..");
const PORT=(()=>{const i=process.argv.indexOf("--port");return i>-1&&process.argv[i+1]?process.argv[i+1]:"3000";})();
const BASE=`http://localhost:${PORT}`;
const env=Object.fromEntries(fs.readFileSync(path.join(ROOT,".env.local"),"utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")&&l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^(["'])(.*)\1$/,"$2")]}));
const ssl=env.DB_SSL_CA_PATH?{ca:fs.readFileSync(path.resolve(ROOT,env.DB_SSL_CA_PATH),"utf8"),rejectUnauthorized:true}:undefined;
let pass=0,fail=0;
const check=(l,ok,d="")=>{console.log(`  ${ok?"PASS":"FAIL"}  ${l}${d?` — ${d}`:""}`);ok?pass++:fail++;};
const jars={};
async function call(jar,method,url,body){
  const res=await fetch(BASE+url,{method,headers:{"Content-Type":"application/json",...(jars[jar]?{Cookie:jars[jar]}:{})},body:body===undefined?undefined:JSON.stringify(body),redirect:"manual"});
  const sc=res.headers.getSetCookie?.()||[];
  if(sc.length){const pairs=sc.map(c=>c.split(";")[0]);
    const jar0=Object.fromEntries((jars[jar]?jars[jar].split("; "):[]).map(p=>[p.split("=")[0],p]));
    for(const p of pairs){const k=p.split("=")[0]; if(p.endsWith("=")) delete jar0[k]; else jar0[k]=p;}
    jars[jar]=Object.values(jar0).join("; ");}
  const t=await res.text();let j=null;try{j=JSON.parse(t)}catch{}
  return {status:res.status,json:j,text:t};
}
(async()=>{
  const conn=await require("mysql2/promise").createConnection({host:env.DB_HOST,port:+env.DB_PORT,user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_NAME,ssl});
  let tid=null;
  try{
    const [ins]=await conn.query(`INSERT INTO tutors (first_name,last_name,email,whatsapp,teaching_mode,status,terms_accepted) VALUES ('Imp','Target',?,'9000000002','In-person','active',1)`,[`imp-${Date.now()}@example.invalid`]);
    tid=ins.insertId;
    console.log(`fixture: tutor #${tid} (no account — never signed up)\n`);

    const {SignJWT}=require("jose");
    jars.a=`ght_admin_token=${await new SignJWT({id:null,username:"impersonation-test",role:"super_admin"}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("10m").sign(new TextEncoder().encode(env.JWT_SECRET))}`;

    console.log("1. starting impersonation");
    const start=await call("a","POST","/api/admin/tutor-impersonate",{tutorId:tid});
    check("admin can start",start.status===200&&start.json?.ok,start.json?.tutor?.name);
    check("tutor cookie issued",(jars.a||"").includes("ght_tutor_token"));

    const [[log]]=await conn.query("SELECT * FROM tutor_impersonation_log WHERE tutor_id=? ORDER BY id DESC LIMIT 1",[tid]);
    check("audit row written",Boolean(log)&&log.admin_name==="impersonation-test");

    console.log("\n2. what the admin can see and do");
    const prof=await call("a","GET","/api/tutor/profile");
    check("can READ the tutor's panel",prof.status===200&&prof.json?.data?.tutor?.id===tid);
    check("marked read-only",prof.json?.data?.impersonation?.readOnly===true);
    check("names the impersonator",prof.json?.data?.impersonation?.byName==="impersonation-test");

    const write=await call("a","PATCH","/api/tutor/profile",{first_name:"Hacked"});
    check("cannot WRITE as the tutor",write.status===403,write.json?.error?.slice(0,46));
    const [chk]=await conn.query("SELECT first_name FROM tutors WHERE id=?",[tid]);
    check("tutor record untouched",chk[0].first_name==="Imp");
    const [subs]=await conn.query("SELECT COUNT(*) n FROM tutor_profile_changes WHERE tutor_id=?",[tid]);
    check("no change request created",Number(subs[0].n)===0);

    console.log("\n3. admin powers retained");
    const adminApi=await call("a","GET","/api/admin/tutors?limit=1");
    check("still admin elsewhere",adminApi.status===200);

    console.log("\n4. exiting");
    const stop=await call("a","DELETE","/api/admin/tutor-impersonate");
    check("exit accepted",stop.status===200);
    const after=await call("a","GET","/api/tutor/profile");
    check("tutor session gone",after.status===401);
    const stillAdmin=await call("a","GET","/api/admin/tutors?limit=1");
    check("admin session survived",stillAdmin.status===200);
    const [[closed]]=await conn.query("SELECT ended_at FROM tutor_impersonation_log WHERE id=?",[log.id]);
    check("audit row closed",Boolean(closed.ended_at));

    console.log("\n5. a plain tutor cannot impersonate");
    const nope=await call("t","POST","/api/admin/tutor-impersonate",{tutorId:tid});
    check("unauthenticated refused",nope.status===401);
  }catch(e){console.error("\nunexpected:",e.message);fail++;}
  finally{ if(tid){await conn.query("DELETE FROM tutors WHERE id=?",[tid]);console.log(`\ncleaned up tutor #${tid}`);} await conn.end(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode=fail?1:0;
})();
