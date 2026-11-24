// Offline scene renderer. Visitors receive only a video and poster, not Three.js.
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import sharp from 'sharp';
await mkdir('.cache',{recursive:true});
const { outputFiles }=await build({stdin:{contents:"import {createAssemblyScene} from './tools/factory-scene.js'; window.createAssemblyScene=createAssemblyScene;",resolveDir:process.cwd()},bundle:true,write:false,format:'iife',minify:true});
const server=createServer((req,res)=>{
  if(req.url==='/scene.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(outputFiles[0].text)}
  else{res.writeHead(200,{'Content-Type':'text/html'});res.end('<html><body style="margin:0;background:#0b0d0f"><canvas id="scene"></canvas><script src="/scene.js"></script></body></html>')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',args:['--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:768,height:768}});
page.on('pageerror',e=>console.error(e));
await page.goto(`http://127.0.0.1:${server.address().port}`);
await page.evaluate(()=>{window.scene=createAssemblyScene(document.querySelector('canvas'),768)});
for(const t of [0,5,9]){
  await page.evaluate(t=>window.scene.update(t),t);
  await page.screenshot({path:`.cache/assembly-scene-${t}.png`});
}
const types=await page.evaluate(()=>['video/mp4;codecs=avc1.42001f','video/webm;codecs=vp9'].filter(type=>MediaRecorder.isTypeSupported(type)));console.log('Supported encoders:',types);
if(!process.argv.includes('--preview')){
  const mime=types.find(t=>t.startsWith('video/mp4'))||types[0];if(!mime)throw new Error('No supported video encoder');
  const ext=mime.startsWith('video/mp4')?'mp4':'webm';
  await mkdir('assets/video',{recursive:true});
  for(const size of [768,480]){
    const result=await page.evaluate(async({size,mime})=>{
      window.scene.renderer.setSize(size,size);window.scene.update(0);
      const stream=document.querySelector('canvas').captureStream(24);
      const chunks=[],rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:size===768?1400000:650000});
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
      const done=new Promise(resolve=>rec.onstop=resolve);rec.start();
      const started=performance.now();
      await new Promise(resolve=>{
        const next=()=>{const elapsed=(performance.now()-started)/1000;window.scene.update(Math.min(12,elapsed));if(elapsed<12)requestAnimationFrame(next);else resolve()};requestAnimationFrame(next);
      });
      rec.stop();await done;stream.getTracks().forEach(t=>t.stop());
      const bytes=new Uint8Array(await new Blob(chunks,{type:mime}).arrayBuffer());
      let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);
    },{size,mime});
    const path=`assets/video/assembly-loop-${size}.${ext}`;await writeFile(path,Buffer.from(result,'base64'));console.log('Rendered',path);
  }
  for(const size of [480,768])await sharp('.cache/assembly-scene-5.png').resize(size,size).webp({quality:87}).toFile(`assets/images/assembly-poster-${size}.webp`);
}
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
