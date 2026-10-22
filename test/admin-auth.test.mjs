import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createApp, ADMIN_PATH} from '../server/app.mjs';
const password = 'test-only-long-random-password-123456789';

async function fixture(t, overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'rcbs-auth-test-'));
  fs.mkdirSync(path.join(root,'server'),{recursive:true});
  fs.mkdirSync(path.join(root,'dist/admin'),{recursive:true});
  fs.mkdirSync(path.join(root,'src/data'),{recursive:true});
  fs.mkdirSync(path.join(root,'public/uploads'),{recursive:true});
  fs.writeFileSync(path.join(root,'server/admin.html'),'Protected editor');
  fs.writeFileSync(path.join(root,'server/cms.yml'),'collections:\n  - name: settings\n    files:\n      - name: site\n        file: src/data/site.json\n');
  fs.writeFileSync(path.join(root,'src/data/site.json'),'{"title":"test"}');
  fs.writeFileSync(path.join(root,'dist/index.html'),'Public website');
  fs.writeFileSync(path.join(root,'dist/admin/index.html'),'Old unprotected editor');
  fs.writeFileSync(path.join(root,'.env'),'DO_NOT_EXPOSE');
  let clock = Date.now();
  const origin='http://localhost:3000';
  const app=await createApp({root,username:'admin',password,origin,now:()=>clock,...overrides});
  const server=app.listen(0,'127.0.0.1'); await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});});
  const request=(url,options={})=>fetch(base+url,{redirect:'manual',...options});
  const login=(supplied=password, extra={})=>request(ADMIN_PATH+'/login',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded',...extra},body:new URLSearchParams({username:'admin',password:supplied})});
  const cookie=async()=>{const r=await login();assert.equal(r.status,303);return r.headers.get('set-cookie').split(';')[0];};
  const api=(body,token,extra={})=>request(ADMIN_PATH+'/api/v1',{method:'POST',headers:{origin,'content-type':'application/json',...(token?{cookie:token}:{}),...extra},body:JSON.stringify(body)});
  return {root,origin,request,login,cookie,api,advance:ms=>clock+=ms};
}

test('public pages work; editor, configuration, API, old routes and secret files are gated',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request('/')).status,200);
  for(const route of [ADMIN_PATH,ADMIN_PATH+'/',ADMIN_PATH+'/config.yml']) {
    const r=await f.request(route);assert.equal(r.status,302);assert.equal(r.headers.get('location'),ADMIN_PATH+'/login');assert.equal(r.headers.get('cache-control'),'no-store');
  }
  assert.equal((await f.api({action:'info'})).status,401);
  for(const route of ['/admin','/admin/','/admin/config.yml','/.env','/server/cms.yml','/api/v1']) assert.equal((await f.request(route)).status,404);
});

test('password and same-origin checks, cookie flags, tampering and logout',async t=>{
  const f=await fixture(t);
  assert.equal((await f.login('incorrect')).status,401);
  assert.equal((await f.login(password,{origin:'https://attacker.example'})).status,403);
  const r=await f.login();assert.equal(r.status,303);
  const header=r.headers.get('set-cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Strict/);assert.match(header,/Path=\/admin123/);
  const token=header.split(';')[0];
  assert.equal((await f.request(ADMIN_PATH+'/',{headers:{cookie:token}})).status,200);
  assert.equal((await f.api({action:'info'},token)).status,200);
  assert.equal((await f.api({action:'info'},token,{origin:'https://attacker.example'})).status,403);
  assert.equal((await f.api({action:'info'},token+'0')).status,401);
  assert.equal((await f.request(ADMIN_PATH+'/logout',{method:'POST',headers:{cookie:token,origin:f.origin}})).status,303);
  assert.equal((await f.api({action:'info'},token)).status,401);
});

test('brute-force limits expire and sessions expire',async t=>{
  const f=await fixture(t,{loginLimit:2,sessionLifetime:1000});
  assert.equal((await f.login('wrong')).status,401);
  assert.equal((await f.login('wrong')).status,401);
  assert.equal((await f.login()).status,429);
  f.advance(15*60_000+1);
  const token=await f.cookie();f.advance(1001);
  assert.equal((await f.api({action:'info'},token)).status,401);
});

test('authenticated API cannot read credentials or edit executable files; allowed content works',async t=>{
  const f=await fixture(t);const token=await f.cookie();
  for(const target of ['.env','../.env','server/app.mjs','src/data/../../.env','/etc/passwd','public/uploads/evil.html','public/uploads/evil.js']) {
    assert.equal((await f.api({action:'getEntry',params:{branch:'main',path:target}},token)).status,403);
  }
  fs.symlinkSync(path.join(f.root,'.env'),path.join(f.root,'public/uploads/link.png'));
  assert.equal((await f.api({action:'getMediaFile',params:{branch:'main',path:'public/uploads/link.png'}},token)).status,403);
  assert.equal((await f.api({action:'getMedia',params:{branch:'main',mediaFolder:'public/uploads'}},token)).status,403);
  const read=await f.api({action:'getEntry',params:{branch:'main',path:'src/data/site.json'}},token);
  assert.equal(read.status,200);assert.match(JSON.stringify(await read.json()),/test/);
  const write=await f.api({action:'persistEntry',params:{branch:'main',entry:{slug:'site',path:'src/data/site.json',raw:'{"title":"updated"}'},assets:[],options:{commitMessage:'test',useWorkflow:false,status:'published'}}},token);
  assert.equal(write.status,200);assert.equal(JSON.parse(fs.readFileSync(path.join(f.root,'src/data/site.json'),'utf8')).title,'updated');
  const config=await f.request(ADMIN_PATH+'/config.yml',{headers:{cookie:token}});assert.match(await config.text(),/name: proxy/);
});

test('missing credentials and non-local plaintext origins fail closed; HTTPS sets Secure cookies',async t=>{
  await assert.rejects(createApp({root:'.',username:'admin',password:'',origin:'http://localhost:3000'}));
  await assert.rejects(createApp({root:'.',username:'admin',password,origin:'http://school.example'}));
  const f=await fixture(t,{origin:'https://school.example'});
  const r=await f.login(password,{origin:'https://school.example'});
  assert.equal(r.status,303);assert.match(r.headers.get('set-cookie'),/; Secure/);
});
