/* Desktop-only bridge. No credentials, task data or PIN are sent to native code. */
(()=>{
 const invoke=window.__TAURI__?.core?.invoke;
 if(!invoke)return;
 const KEY='pw-focus-session-v1';
 let last='';
 const sync=async()=>{
   let p;try{p=JSON.parse(localStorage.getItem(KEY)||'null')}catch{return}
   const signature=p?JSON.stringify([p.start,p.duration,p.pausedAt,p.pausedTotal,p.active,p.finished,p.reminded,p.title]):'empty';
   if(signature===last)return;last=signature;
   if(!p?.active){await invoke('cancel_focus');return}
   const elapsed=Math.max(0,(p.pausedAt||Date.now())-p.start-(p.pausedTotal||0));
   const remaining=Math.max(0,p.duration*60000-elapsed);
   const reminder=p.reminded||p.duration<=15?0:Math.max(0,900000-elapsed);
   await invoke('sync_focus',{title:String(p.title||'Công việc đang làm').slice(0,180),remainingMs:Math.floor(remaining),reminderMs:Math.floor(reminder),paused:Boolean(p.pausedAt)});
 };
 window.__TAURI__.event.listen('pw-open-focus',()=>{document.querySelector('#pwFocusImmersive')?.click()}).catch(console.warn);
 setInterval(()=>sync().catch(console.warn),1500);
 document.addEventListener('visibilitychange',()=>sync().catch(console.warn));
 sync().catch(console.warn);
})();
