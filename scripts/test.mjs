import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';
const worker=(await import(pathToFileURL(new URL('../dist/server/index.js',import.meta.url).pathname))).default;
const origin='https://jury.example';const key='sk-'+'test'.repeat(15);const base={question:'A harmless fixture decision',context:'Supplied facts only',personas:'auto',custom_personas:'',criteria:'attendance',constraints:'',research:'Supplied evidence only',files:[]};
const req=(body=base,headers={})=>new Request(origin+'/api/deliberate',{method:'POST',headers:{'Content-Type':'application/json','X-Jury-Api-Key':key,Origin:origin,...headers},body:JSON.stringify(body)});
assert.equal((await worker.fetch(new Request(origin))).status,200);
assert.equal((await worker.fetch(req(base,{'X-Jury-Api-Key':''}))).status,401);
assert.equal((await worker.fetch(req(base,{Origin:'https://other.example'}))).status,403);
assert.equal((await worker.fetch(req({...base,files:[{name:'bad.pdf',base64:btoa('not a PDF')}]}))).status,400);
const oldFetch=globalThis.fetch;let called=0;
const fixture=JSON.parse(await readFile(new URL('../fixtures/live-fixture.json',import.meta.url),'utf8'));
const events=fixture.filter(e=>['council','evidence','turn','report'].includes(e.type));
// The gateway must derive reply links rather than trust model-generated indices.
for(const e of events)if(e.type==='turn')e.turn.reply_to=9999;
const modelText=JSON.stringify({events});
globalThis.fetch=async(url,options)=>{called++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer '+key);const b=JSON.parse(options.body);assert.equal(b.store,false);assert.equal(b.text.format.strict,true);const enc=new TextEncoder();const pieces=[];for(let i=0;i<modelText.length;i+=47)pieces.push('data: '+JSON.stringify({type:'response.output_text.delta',delta:modelText.slice(i,i+47)})+'\n\n');pieces.push('data: '+JSON.stringify({type:'response.completed'})+'\n\n');return new Response(new ReadableStream({start(c){for(const p of pieces)c.enqueue(enc.encode(p));c.close();}}));};
const r=await worker.fetch(req());assert.equal(r.status,200);const result=(await r.text()).trim().split('\n').map(JSON.parse);const final=result.find(e=>e.type==='report');assert.ok(final,JSON.stringify(result.at(-1)));assert.equal(final.report.jurors.length,10);assert.ok(final.report.turns.every((t,i)=>t.reply_to===null||t.reply_to<i));assert.ok(!JSON.stringify(result).includes(key));
globalThis.fetch=async()=>new Response('private upstream diagnostics should never be forwarded',{status:401});const error=await worker.fetch(req());assert.equal(error.status,401);assert.ok(!(await error.text()).includes('private upstream'));
globalThis.fetch=oldFetch;console.log('Passed: public page, visitor-key requirement, cross-origin rejection, upload validation, fragmented streaming, reply links, final report and sanitized provider errors.');
