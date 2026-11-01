const $ = id => document.getElementById(id);
let scenes = [], audioUrl = null, audioFile = null, cancelRender = false, renderStream = null;
const status = (s)=>$('status').textContent=s;
const clean = s => s.replace(/\s+/g,' ').trim();
const escapeHtml = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getKey = () => localStorage.getItem('cineforge_groq_key') || '';

$('settingsBtn').onclick=()=>{$('groqKey').value=getKey();$('model').value=localStorage.getItem('cineforge_model')||'llama-3.3-70b-versatile';$('settingsDialog').showModal()};
$('saveSettings').onclick=()=>{localStorage.setItem('cineforge_groq_key',$('groqKey').value.trim());localStorage.setItem('cineforge_model',$('model').value);};
$('clearKey').onclick=()=>{localStorage.removeItem('cineforge_groq_key');$('groqKey').value='';};

async function generateScript(topic, minutes, tone){
 const key=getKey();
 if(!key) return starterScript(topic, minutes);
 const model=localStorage.getItem('cineforge_model')||'llama-3.3-70b-versatile';
 const prompt=`You are a careful historical documentary writer. Create a ${minutes}-minute English documentary narration about: "${topic}". Style: ${tone}. Target roughly ${Number(minutes)*125} to ${Number(minutes)*145} spoken words. Structure: cold open, central question, historical setting, chronology, key people/events, evidence and what historians debate, consequences, satisfying conclusion. Use clear narration, no headings, no fake quotations, no invented facts, distinguish established facts from disputed claims. Avoid repetitive filler. Return only narration text in paragraphs.`;
 const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({model,temperature:0.65,max_tokens:Math.min(8000,Number(minutes)*210),messages:[{role:'user',content:prompt}]})});
 if(!res.ok){let t=await res.text();throw new Error('Groq request failed ('+res.status+'): '+t.slice(0,180))}
 const data=await res.json();return data.choices?.[0]?.message?.content||starterScript(topic,minutes);
}
function starterScript(topic, minutes){
 const p=[
 `Imagine standing at the edge of a world that no longer exists. Its monuments, roads and stories still leave traces, but the people who built it are gone. To understand ${topic}, we have to begin with one question: how did this story change the course of history?`,
 `The setting matters. Geography shaped where people settled, what they traded, how they defended themselves and which neighbours they encountered. Rivers, mountains, coastlines and routes were not just scenery; they were forces that shaped decisions.`,
 `Over time, communities developed institutions, technology and shared traditions. Their achievements did not appear overnight. They were built through generations of work, conflict, adaptation and exchange.`,
 `The turning points came when leaders and ordinary people faced choices under pressure. Alliances shifted, resources became contested and new ideas travelled across borders. The result was a story more complicated than the simple rise-and-fall versions often told.`,
 `What can we know today? Archaeology, written records, inscriptions, architecture and scientific analysis each preserve different pieces of the past. No single source tells the whole story. Historians compare evidence, test interpretations and revise conclusions when new discoveries appear.`,
 `Some questions remain open. A missing record is not proof of a lost super-civilisation, and a striking resemblance does not automatically prove contact. The strongest explanation is the one that best fits the available evidence while acknowledging what we still do not know.`,
 `The legacy of ${topic} is not only in ruins or famous names. It lives in languages, institutions, technologies, borders and memories that continued long after the original events. History is not a straight line; it is a chain of choices whose consequences can last for centuries.`
 ];
 const count=Math.max(7,Math.ceil(Number(minutes)*60/35));let out=[];
 for(let i=0;i<count;i++) out.push(p[i%p.length]+(i>6?` This chapter adds another layer to the story of ${topic}, connecting the evidence to the wider world and asking what changed next.`:''));
 return out.join('\n\n')+'\n\nThis is a starter outline, not a fact-checked finished script. Add a Groq key in Settings to generate a topic-specific draft, then verify historical claims before publishing.';
}
$('buildBtn').onclick=async()=>{
 const topic=clean($('topic').value), minutes=$('duration').value;
 if(topic.length<4){status('Please enter a documentary idea first.');return}
 $('buildBtn').disabled=true;status('Building your documentary script…');
 try{const script=await generateScript(topic,minutes,$('tone').value);$('scriptText').value=script;$('scriptPanel').classList.remove('hidden');$('scriptPanel').scrollIntoView({behavior:'smooth'});status('Script draft ready. Review it before creating scenes.');}
 catch(e){status(e.message+' — using starter outline instead.');$('scriptText').value=starterScript(topic,minutes);$('scriptPanel').classList.remove('hidden');}
 finally{$('buildBtn').disabled=false}
};
$('saveScript').onclick=()=>status('Edits are saved in this page session. Copy the script somewhere safe before closing.');
function splitIntoScenes(text){
 const paras=text.split(/\n+/).map(clean).filter(x=>x.length>30);
 const beats=[];paras.forEach(p=>{let s=p.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[p];s.forEach(x=>{x=clean(x);if(x.length>20)beats.push(x)})});
 const target=Math.min(90,Math.max(24,Math.round(Number($('duration').value)*4)));
 let groups=Array.from({length:target},()=>[]);
 beats.forEach((b,i)=>groups[Math.floor(i*target/Math.max(1,beats.length))].push(b));
 return groups.map((g,i)=>({id:i+1,text:g.join(' ')||paras[i%paras.length]||'The story continues.',title:makeTitle(g.join(' ')||paras[i%paras.length]||'History'),image:null,query:''}));
}
function makeTitle(s){let words=s.replace(/[^\w\s'-]/g,'').split(/\s+/).filter(Boolean);return words.slice(0,6).join(' ').toUpperCase()||'THE STORY';}
$('sceneBtn').onclick=()=>{scenes=splitIntoScenes($('scriptText').value);renderSceneList();$('scenePanel').classList.remove('hidden');$('exportPanel').classList.remove('hidden');$('renderEstimate').textContent=$('duration').value+' min target · 16:9';$('scenePanel').scrollIntoView({behavior:'smooth'});findImages();};
function renderSceneList(){ $('sceneList').innerHTML=scenes.map(s=>`<article class="scene"><img id="img${s.id}" alt="Scene ${s.id}" src="${s.image||placeholderSvg(s.id)}"><div><small>SCENE ${String(s.id).padStart(2,'0')}</small><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.text.slice(0,190))}${s.text.length>190?'…':''}</p></div></article>`).join('');}
function placeholderSvg(n){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g"><stop stop-color="#172b3b"/><stop offset="1" stop-color="#72532d"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="48%" fill="#f3d38e" font-size="34" text-anchor="middle" font-family="Georgia">CINEFORGE</text><text x="50%" y="62%" fill="white" font-size="18" text-anchor="middle">SCENE ${n}</text></svg>`);}
async function commonsSearch(query){
 const url='https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(query+' historical')+'&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json&origin=*';
 const r=await fetch(url);if(!r.ok)throw new Error('Image search unavailable');const j=await r.json();
 return Object.values(j.query?.pages||{}).map(p=>p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url).filter(Boolean);
}
async function findImages(){
 status('Finding historical images from Wikimedia Commons…');
 for(let i=0;i<scenes.length;i++){
  let s=scenes[i];let words=s.text.split(/\s+/).slice(0,7).join(' ');
  try{let urls=await commonsSearch(words);if(!urls.length)urls=await commonsSearch($('topic').value);s.image=urls[0]||null;}
  catch(e){s.image=null}
  const el=$('img'+s.id);if(el&&s.image)el.src=s.image;
  status(`Finding images… ${i+1}/${scenes.length}`);
 }
 status('Scene board ready. Some images may need manual replacement or verification.');
}
$('refreshImages').onclick=findImages;
$('audioFile').onchange=e=>{audioFile=e.target.files[0]||null;if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=audioFile?URL.createObjectURL(audioFile):null;status(audioFile?'Narration/music track loaded.':'Audio removed.');};

function loadImg(url){return new Promise(resolve=>{let im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=url;});}
function wrapText(ctx,text,maxWidth){let words=text.split(/\s+/),lines=[],line='';for(let w of words){let t=line?line+' '+w:w;if(ctx.measureText(t).width>maxWidth&&line){lines.push(line);line=w}else line=t;}if(line)lines.push(line);return lines;}
function drawFrame(ctx,w,h,scene,img,t,sceneIndex,total){
 ctx.fillStyle='#101722';ctx.fillRect(0,0,w,h);
 if(img){let scale=Math.max(w/img.width,h/img.height)*(1.02+0.08*t),iw=img.width*scale,ih=img.height*scale;let drift=(t-.5)*45;ctx.save();ctx.translate(w/2+drift,h/2);ctx.rotate((sceneIndex%2?1:-1)*.002*t);ctx.drawImage(img,-iw/2,-ih/2,iw,ih);ctx.restore();}
 else{let g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#142b3b');g.addColorStop(1,'#6c4c29');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d8b46b44';ctx.lineWidth=3;for(let x=0;x<w;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-250,h);ctx.stroke();}}
 let shade=ctx.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#00000008');shade.addColorStop(.55,'#00000022');shade.addColorStop(1,'#05070bdc');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#e4bd70';ctx.font='bold 23px Arial';ctx.fillText('CINEFORGE  /  HISTORY FILE',80,85);
 ctx.fillStyle='white';ctx.font='bold 54px Georgia';ctx.fillText(scene.title.slice(0,45),80,h-270);
 ctx.fillStyle='#e9edf4';ctx.font='29px Arial';let lines=wrapText(ctx,scene.text, w-160).slice(0,3);lines.forEach((line,i)=>ctx.fillText(line,80,h-190+i*42));
 ctx.fillStyle='#e4bd70';ctx.fillRect(80,h-55,(w-160)*(sceneIndex+1)/total,5);
 ctx.fillStyle='#d8dce4';ctx.font='20px Arial';ctx.fillText(String(sceneIndex+1).padStart(2,'0')+' / '+total,w-180,85);
}
$('cancelBtn').onclick=()=>{cancelRender=true;};
$('renderBtn').onclick=async()=>{
 if(!scenes.length){$('renderStatus').textContent='Create scenes first.';return}
 const canvas=$('renderCanvas'),ctx=canvas.getContext('2d');const fps=24;
 let totalDuration=Number($('duration').value)*60;
 let perScene=totalDuration/scenes.length;
 let audio=null,audioCtx=null,audioDest=null;
 if(audioUrl){
  audio=new Audio(audioUrl);audio.preload='auto';
  await new Promise(res=>{audio.onloadedmetadata=res;audio.onerror=res;});
  if(audio.duration&&isFinite(audio.duration)){totalDuration=audio.duration;perScene=totalDuration/scenes.length;}
 }
 const canvasStream=canvas.captureStream(fps);let tracks=[...canvasStream.getVideoTracks()];
 if(audio){
  try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();audioDest=audioCtx.createMediaStreamDestination();const source=audioCtx.createMediaElementSource(audio);source.connect(audioDest);source.connect(audioCtx.destination);tracks.push(...audioDest.stream.getAudioTracks());}
  catch(e){$('renderStatus').textContent='Audio capture is not supported in this browser. Rendering without audio.';audio=null;}
 }
 renderStream=new MediaStream(tracks);
 let mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
 let recorder;try{recorder=new MediaRecorder(renderStream,mime?{mimeType:mime}:{});}catch(e){$('renderStatus').textContent='This browser cannot record video. Try current Chrome.';return}
 let chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 const done=new Promise(resolve=>recorder.onstop=resolve);
 cancelRender=false;$('renderBtn').disabled=true;$('cancelBtn').classList.remove('hidden');$('renderStatus').textContent='Rendering in real time. Keep this tab open and screen awake.';
 recorder.start(1000);
 if(audio){audio.currentTime=0;await audio.play().catch(()=>{});}
 const loaded=await Promise.all(scenes.map(s=>s.image?loadImg(s.image):Promise.resolve(null)));
 const start=performance.now();let raf;
 const draw=now=>{
  let elapsed=(now-start)/1000;if(cancelRender||elapsed>=totalDuration){recorder.stop();return}
  let idx=Math.min(scenes.length-1,Math.floor(elapsed/perScene)),local=(elapsed%perScene)/perScene;
  drawFrame(ctx,canvas.width,canvas.height,scenes[idx],loaded[idx],local,idx,scenes.length);
  let pct=Math.min(99,Math.floor(elapsed/totalDuration*100));$('progressFill').style.width=pct+'%';$('renderPercent').textContent=pct+'%';$('renderStatus').textContent=`Rendering scene ${idx+1} of ${scenes.length} · ${Math.floor(elapsed)}s / ${Math.floor(totalDuration)}s`;
  raf=requestAnimationFrame(draw);
 };
 draw(performance.now());await done;cancelAnimationFrame(raf);
 if(audio){audio.pause();}if(audioCtx)await audioCtx.close().catch(()=>{});
 canvasStream.getTracks().forEach(t=>t.stop());if(audioDest)audioDest.stream.getTracks().forEach(t=>t.stop());
 const blob=new Blob(chunks,{type:recorder.mimeType||'video/webm'});const url=URL.createObjectURL(blob);
 $('downloadLink').href=url;$('downloadLink').classList.remove('hidden');$('downloadLink').download='cineforge-documentary.webm';
 $('progressFill').style.width='100%';$('renderPercent').textContent='100%';$('renderStatus').textContent=`Render finished · ${(blob.size/1024/1024).toFixed(1)} MB · ${cancelRender?'partial render':'complete'}`;
 $('renderBtn').disabled=false;$('cancelBtn').classList.add('hidden');
};
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
