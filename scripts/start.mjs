import http from 'node:http';
import {Readable} from 'node:stream';
import worker from '../dist/server/index.js';
const port=Number(process.env.PORT||10000);
const server=http.createServer(async(req,res)=>{
  if(req.method==='GET'&&req.url==='/healthz'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"status":"ok"}');return;}
  const abort=new AbortController();
  req.on('aborted',()=>abort.abort());
  res.on('close',()=>{if(!res.writableEnded)abort.abort();});
  try{
    const host=req.headers.host;
    if(!host||!/^[-a-zA-Z0-9.:[\]]+$/.test(host)){res.writeHead(400);res.end('Invalid host.');return;}
    const forwarded=String(req.headers['x-forwarded-proto']||'').split(',')[0].trim();
    const protocol=forwarded==='https'?'https':'http';
    const headers=new Headers();
    for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
    const init={method:req.method,headers,signal:abort.signal};
    if(req.method!=='GET'&&req.method!=='HEAD'){init.body=Readable.toWeb(req);init.duplex='half';}
    const request=new Request(`${protocol}://${host}${req.url}`,init);
    const result=await worker.fetch(request);
    res.writeHead(result.status,Object.fromEntries(result.headers));
    if(result.body){const body=Readable.fromWeb(result.body);body.on('error',()=>res.destroy());body.pipe(res);}else res.end();
  }catch{
    if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});
    if(!res.destroyed)res.end('{"error":"The jury connection was interrupted."}');
  }
});
server.headersTimeout=30000;
server.requestTimeout=120000;
server.listen(port,'0.0.0.0',()=>console.log('AI Jury listening on port '+port));
process.on('SIGTERM',()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),10000).unref();});
