import{build}from'esbuild';import{readFileSync,writeFileSync,readdirSync,mkdirSync,statSync}from'node:fs';import{resolve,extname,join}from'node:path';import{execFileSync}from'node:child_process';import{gzipSync}from'node:zlib';import{createHash}from'node:crypto';
const dir=resolve('.preview-build');mkdirSync(dir,{recursive:true});
function walk(root){return readdirSync(root).sort().flatMap(n=>statSync(join(root,n)).isDirectory()?walk(join(root,n)):[join(root,n)]);}
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.txt':'text/plain','.xml':'application/xml','.woff2':'font/woff2','.woff':'font/woff'};
const modules=[],imports=[],entries=[],manifest=[];
for(const [i,file]of walk('dist').entries()){
 const type=types[extname(file)]||'application/octet-stream',text=/^(text\/|application\/(javascript|json|manifest\+json|xml)|image\/svg)/.test(type),name='review-asset-'+i+(text?'.txt':'.bin');
 const bytes=readFileSync(file);manifest.push({path:'/'+file.replace(/^dist\//,''),name,content_type:text?'text/plain':'application/octet-stream',sha256:createHash('sha256').update(bytes).digest('hex')});imports.push(`import a${i} from './${name}';`);entries.push(`${JSON.stringify('/'+file.replace(/^dist\//,''))}:{type:${JSON.stringify(type)},body:a${i}}`);modules.push({name,content_type:text?'text/plain':'application/octet-stream',content_base64:bytes.toString('base64')});
}
writeFileSync(join(dir,'review-assets.mjs'),imports.join('\n')+'\nexport const assets={'+entries.join(',')+'};');
const entry=readFileSync('worker/read-only-preview.mjs','utf8').replace("'./preview-auth.mjs'",JSON.stringify(resolve('worker/preview-auth.mjs'))).replace("'./preview-auth-api.mjs'",JSON.stringify(resolve("worker/preview-auth-api.mjs"))).replace("'./review-assets.mjs'","'./review-assets.mjs'");writeFileSync(join(dir,'entry.mjs'),entry);
const result=await build({entryPoints:[join(dir,'entry.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',external:['./review-asset-*'],minify:true});
modules.unshift({name:'review.js',content_type:'application/javascript+module',content_base64:Buffer.from(result.outputFiles[0].text).toString('base64')});
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
writeFileSync(join(dir,'version.json'),JSON.stringify({main_module:'review.js',compatibility_date:'2026-11-15',bindings:[{type:'plain_text',name:'SOURCE_COMMIT',text:source}],annotations:{'workers/message':'Founder-only read-only UI review '+source},modules}));
console.log(JSON.stringify({source,modules:modules.length,raw_bytes:modules.reduce((n,m)=>n+Buffer.from(m.content_base64,'base64').length,0),gzip_bytes:modules.reduce((n,m)=>n+gzipSync(Buffer.from(m.content_base64,'base64')).length,0)}));

// Transport only generated public Worker code and content hashes, never assets or credentials.
if(process.env.GITHUB_ACTIONS==='true')console.log('TEMAN_REVIEW_TRANSPORT_V1:'+JSON.stringify({source,main:modules[0],manifest}));
