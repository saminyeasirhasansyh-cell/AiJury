import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
const [html,script,handler,data]=await Promise.all([read('src/index.html'),read('src/app.js'),read('worker/handler.mjs'),read('worker/model-config.json')]);
const {SYSTEM,SCHEMA}=JSON.parse(data);
const validation=script.slice(script.indexOf('function fail(message)'),script.indexOf('function makeTurns(d)'));
const output='const HTML='+JSON.stringify(html)+';\nconst SCRIPT='+JSON.stringify(script)+';\nconst SYSTEM='+JSON.stringify(SYSTEM)+';\nconst SCHEMA='+JSON.stringify(SCHEMA)+';\n'+validation+'\n'+handler;
await rm(new URL('dist',root),{recursive:true,force:true});await mkdir(new URL('dist/server',root),{recursive:true});await writeFile(new URL('dist/server/index.js',root),output);
console.log('Built the public jury room. No API credentials are bundled.');
