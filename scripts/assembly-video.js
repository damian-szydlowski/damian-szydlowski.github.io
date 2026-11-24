// Native video playback only. The 3D scene is rendered offline in tools/.
export function setupAssemblyVideo() {
  const host=document.querySelector('[data-assembly-art]');
  if(!host)return;
  const video=host.querySelector('video'),button=host.querySelector('button');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const connection=navigator.connection;
  let visible=false,pausedByUser=false,blocked=false,loaded=false;
  video.muted=true; video.defaultMuted=true;
  function active(){return visible&&!document.hidden&&!pausedByUser&&!motion.matches&&!connection?.saveData&&!blocked;}
  function sync(){
    const staticMode=motion.matches||connection?.saveData;
    button.hidden=Boolean(staticMode);
    button.textContent=pausedByUser||blocked?'Play animation':'Pause animation';
    button.setAttribute('aria-label',pausedByUser||blocked?'Play assembly animation':'Pause assembly animation');
    if(staticMode){video.pause();delete host.dataset.ready;host.dataset.state='still';return;}
    if(!active()){video.pause();host.dataset.state='paused';return;}
    if(!loaded){video.src=matchMedia('(max-width: 767px)').matches?video.dataset.mobileSrc:video.dataset.src;loaded=true;}
    video.play().then(()=>{
      if(!active()){video.pause();return;}
      host.dataset.ready='true';host.dataset.state='playing';
    }).catch(error=>{
      if(error.name==='AbortError')return;
      blocked=true;host.dataset.state='still';delete host.dataset.ready;
      button.textContent='Play animation';button.setAttribute('aria-label','Play assembly animation');
    });
  }
  button.addEventListener('click',()=>{pausedByUser=blocked?false:!pausedByUser;blocked=false;sync();});
  video.addEventListener('error',()=>{video.pause();delete host.dataset.ready;host.dataset.state='still';button.hidden=true;});
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',sync);
  connection?.addEventListener('change',sync);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(host);
  else{visible=true;sync();}
  sync();
}
