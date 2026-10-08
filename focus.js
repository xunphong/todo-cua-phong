/* PHONG WORK Focus. Local timer, does not change task data unless user explicitly marks done in main app. */
(()=>{'use strict';
const KEY='pw-focus-session-v1',get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
let state=get()||{title:'',duration:60,start:0,pausedAt:0,pausedTotal:0,nextStep:'',active:false,finished:false,reminded:false};
let notifiedEnd=false,notif15=false;
const root=document.createElement('section');root.id='pwFocus';root.className='pw-focus card';root.innerHTML=`
<div class="pw-focus-head"><div><span class="pw-focus-kicker">FOCUS MODE</span><h2>Chỉ một việc trước mắt 🎬</h2></div><button id="pwFocusCollapse" class="pw-focus-min">Thu gọn</button></div>
<div id="pwFocusContent">
<label class="pw-focus-label" for="pwFocusSaved">Chọn từ task chưa hoàn thành</label>
<div class="pw-focus-task-list" id="pwFocusSaved"><div class="pw-focus-loading">Đang tải công việc…</div></div>
<label class="pw-focus-label" for="pwFocusTask">Hoặc nhập việc khác</label>
<input id="pwFocusTask" maxlength="180" placeholder="Ví dụ: Dựng video du lịch 60 phút">
<label class="pw-focus-label" for="pwFocusStep">Bước tiếp theo / điểm dừng</label>
<textarea id="pwFocusStep" rows="2" maxlength="500" placeholder="Ví dụ: Chọn footage và dựng đoạn mở đầu"></textarea>
<div class="pw-focus-times"><span>Thời gian tập trung</span><div id="pwFocusDurations"><button data-min="15">15'</button><button data-min="25">25'</button><button data-min="60">60'</button></div></div>
<div class="pw-focus-clock" id="pwFocusClock">60:00</div>
<div class="pw-focus-visual-actions"><button id="pwFocusImmersive" type="button">⛶ Mở chế độ tập trung toàn màn hình</button></div>
<div class="pw-focus-status" id="pwFocusStatus">Chọn một việc rồi bắt đầu nhé.</div>
<div class="pw-focus-actions"><button id="pwFocusStart">Bắt đầu</button><button id="pwFocusPause" class="pw-focus-secondary" hidden>Tạm dừng</button><button id="pwFocusEnd" class="pw-focus-secondary" hidden>Kết thúc</button></div>
<div class="pw-focus-note">Nhắc quay lại sau 15 phút và hỏi tiến độ khi hết giờ. Muốn nhận thông báo Windows, hãy cấp quyền thông báo cho website.</div>
<div class="pw-focus-review" id="pwFocusReview" hidden><b>Bạn làm tới đâu rồi?</b><p>Đồng hồ đã kết thúc. Chọn cách tiếp tục phù hợp:</p><div class="pw-focus-review-actions"><button data-review="continue">Thêm 15 phút</button><button data-review="break">Nghỉ / lưu điểm dừng</button><button data-review="done">Đã xong việc</button></div></div>
</div>`;
const immersive=document.createElement('div');immersive.id='pwFocusImmersiveView';immersive.hidden=true;immersive.innerHTML=`
<div class="pw-immersive-glow"></div><div class="pw-immersive-inner">
<div class="pw-immersive-header"><span>✦ PHONG WORK / FOCUS</span><button id="pwImmersiveClose">✕ Thoát</button></div>
<div class="pw-immersive-content"><div class="pw-immersive-pill">TẬP TRUNG VÀO MỘT VIỆC</div>
<div id="pwImmersiveTask" class="pw-immersive-task"></div>
<div id="pwImmersiveClock" class="pw-immersive-clock">60:00</div>
<div class="pw-immersive-buttons"><button id="pwImmersivePause">⏸ Tạm dừng</button><button id="pwImmersivePlus">+5 phút</button><button id="pwImmersiveFinish">✓ Kết thúc</button></div>
<div id="pwImmersiveStep" class="pw-immersive-step"></div></div>
<div class="pw-immersive-bottom">Một việc tại một thời điểm. Không cần vội.</div>
</div>`;document.body.appendChild(immersive);
const style=document.createElement('style');style.textContent=`
.pw-focus{padding:21px 24px;margin-top:15px}.pw-focus-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.pw-focus-head h2{font-size:17px;margin:3px 0 14px}.pw-focus-kicker{font-weight:800;color:var(--video);font-size:10px;letter-spacing:.1em}.pw-focus-min{background:#eaf0fa;color:#35577f;border:none;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:11px}.pw-focus-label{display:block;font-size:11px;color:#697991;font-weight:700;margin:12px 0 6px}.pw-focus input,.pw-focus textarea{width:100%;border:1px solid #e0e7f0;background:#fff;border-radius:12px;padding:11px 13px;outline:none;color:var(--ink);font-size:13px;resize:vertical}.pw-focus input:focus,.pw-focus textarea:focus{border-color:var(--video)}.pw-focus-times{margin-top:16px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}.pw-focus-times button{border:0;border-radius:10px;padding:9px 12px;background:#f0f2f7;color:#526078;cursor:pointer}.pw-focus-times button.active{background:#dce8ff;color:#245caa;font-weight:800}.pw-focus-clock{text-align:center;font-weight:780;font-size:48px;font-variant-numeric:tabular-nums;margin:12px 0 0;letter-spacing:-2px}.pw-focus-status{text-align:center;color:#7a8394;font-size:11px;margin-bottom:14px}.pw-focus-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}.pw-focus-actions button,.pw-focus-review button{cursor:pointer;border:0;background:var(--video);color:#fff;border-radius:12px;padding:12px 22px;font-size:12px;font-weight:750}.pw-focus-actions button.pw-focus-secondary,.pw-focus-review button:nth-child(2){background:#e8eef8;color:#37577d}.pw-focus-note{font-size:10px;color:#86909e;text-align:center;margin-top:15px;line-height:1.55}.pw-focus-review{background:#edf3fd;border:1px solid #d9e7fc;padding:15px;border-radius:13px;margin-top:15px}.pw-focus-review p{font-size:12px;color:#67768b}.pw-focus-review-actions{display:flex;gap:7px;flex-wrap:wrap}.pw-focus-review button{padding:10px 13px}.pw-focus-review button:nth-child(3){background:#58b88a}#pwFocus[hidden],#pwFocus [hidden]{display:none!important}
@media(max-width:600px){.pw-focus{padding:18px 15px}.pw-focus-head h2{font-size:16px}.pw-focus-times{align-items:flex-start;flex-direction:column}.pw-focus-times button{min-width:63px}.pw-focus-clock{font-size:42px}.pw-focus-actions button{flex:1}}

/* Full-screen quiet workspace. CSS-only abstract landscape, no copyrighted image. */
.pw-focus select{width:100%;border:1px solid #dfe6f1;background:#fff;color:var(--ink);border-radius:12px;padding:11px 13px;font:inherit;font-size:13px;min-height:43px}
.pw-focus-visual-actions{text-align:center;margin:-2px 0 14px}.pw-focus-visual-actions button{border:1px solid #d9e5f6;background:#edf4ff;color:#38669f;font-size:12px;font-weight:750;padding:11px 14px;border-radius:12px;cursor:pointer}
#pwFocusImmersiveView{position:fixed;z-index:99997;inset:0;overflow:auto;isolation:isolate;background:linear-gradient(160deg,#668bb4 0%,#85accd 38%,#c6d9d6 68%,#c7c4a6 100%);color:#fff;font-family:Inter,system-ui,sans-serif}
#pwFocusImmersiveView[hidden]{display:none!important}
.pw-immersive-glow{position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 77% 35%,rgba(236,238,190,.46),transparent 36%),radial-gradient(ellipse at 20% 83%,rgba(40,73,93,.52),transparent 52%),linear-gradient(transparent,rgba(12,36,54,.36))}
.pw-immersive-inner{min-height:100dvh;display:flex;flex-direction:column;padding:clamp(20px,4vw,44px)}
.pw-immersive-header{display:flex;justify-content:space-between;gap:20px;align-items:center;font-size:12px;letter-spacing:.12em;font-weight:750}
.pw-immersive-header button,.pw-immersive-buttons button{border:1px solid rgba(255,255,255,.4);background:rgba(12,31,48,.21);backdrop-filter:blur(8px);color:#fff;border-radius:99px;padding:11px 15px;cursor:pointer;font-weight:700}
.pw-immersive-content{width:min(100%,750px);margin:auto;text-align:center;padding:35px 0}
.pw-immersive-pill{display:inline-block;border-radius:99px;background:rgba(239,246,211,.92);color:#435d69;padding:9px 17px;font-size:11px;font-weight:800;letter-spacing:.09em}
.pw-immersive-task{font-size:clamp(16px,2.8vw,24px);font-weight:650;margin:24px auto 0;max-width:650px;overflow-wrap:anywhere}
.pw-immersive-clock{font-size:clamp(82px,17vw,170px);font-weight:850;line-height:1.25;letter-spacing:-.07em;font-variant-numeric:tabular-nums;text-shadow:0 8px 38px rgba(25,47,66,.2)}
.pw-immersive-buttons{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin:12px auto 26px}
.pw-immersive-buttons button{font-size:13px;padding:13px 19px}
.pw-immersive-step{font-size:13px;max-width:580px;margin:auto;line-height:1.6;color:#f5f8f6}
.pw-immersive-bottom{text-align:center;font-size:12px;opacity:.84}
.pw-focus-task-list{max-height:340px;overflow:auto;border:1px solid #e1e6ea;border-radius:12px;background:#fbfbfa;margin-bottom:12px;scrollbar-width:thin}.pw-focus-loading{padding:18px 14px;font-size:12px;color:#7c8794}.pw-focus-day-head{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 13px;background:#f3f3ef;border-bottom:1px solid #e5e5e0;z-index:1}.pw-focus-day-head strong{font-size:12px;color:#33363b}.pw-focus-day-head small{font-size:10px;color:#90939b}.pw-focus-task-choice{display:flex;align-items:center;text-align:left;width:100%;gap:12px;padding:13px 14px;background:transparent;border:0;border-bottom:1px solid #ecece9;cursor:pointer;color:#17181b}.pw-focus-task-choice:hover{background:#eff4fc}.pw-focus-task-choice.selected{background:#eaf1fd}.pw-focus-choice-circle{display:grid;place-items:center;width:23px;height:23px;flex:0 0 23px;border-radius:50%;border:2px solid #c7c9ca;color:#fff;font-size:12px;font-weight:800}.pw-focus-task-choice.selected .pw-focus-choice-circle{background:#5b8def;border-color:#5b8def}.pw-focus-choice-main{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.pw-focus-choice-main b{font-size:12px;line-height:1.4;overflow-wrap:anywhere}.pw-focus-choice-main small{color:#898c91;font-size:10px}.pw-focus-choice-indicator{font-size:10px;color:#5b8def;font-weight:750}@media(max-width:600px){.pw-focus-task-list{max-height:300px}.pw-focus-task-choice{padding:12px 9px}.pw-focus-choice-indicator{font-size:9px}}
@media(max-width:600px){.pw-immersive-inner{padding:21px 15px}.pw-immersive-header{font-size:10px}.pw-immersive-clock{font-size:clamp(76px,18vw,110px)}.pw-immersive-buttons{gap:8px}.pw-immersive-buttons button{padding:11px;font-size:12px}}
`;document.head.appendChild(style);
const tasksCard=document.querySelector('.tasksCard');if(tasksCard)tasksCard.parentNode.insertBefore(root,tasksCard);else document.querySelector('.app')?.appendChild(root);
const saved=root.querySelector('#pwFocusSaved');
function availableTasks(){try{return typeof tasks!=='undefined'&&Array.isArray(tasks)?tasks.filter(t=>!t.done):[]}catch{return []}}
const fmtDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):(d||'Chưa có ngày');
let lastSignature='';
function refreshChoices(){
 const entries=availableTasks().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||String(a.name).localeCompare(String(b.name)));
 const sig=entries.map(t=>[t.id,t.date,t.name,t.brand,t.done].join('|')).join('~')+'#'+String(state.taskId||'');
 if(sig===lastSignature)return;lastSignature=sig;
 saved.replaceChildren();
 if(!entries.length){const empty=document.createElement('div');empty.className='pw-focus-loading';empty.textContent='Chưa tìm thấy task chưa hoàn thành. Đợi đồng bộ rồi thử lại.';saved.appendChild(empty);return}
 const grouped=new Map();
 entries.forEach(t=>{const key=t.date||'';if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(t)});
 for(const [day,items] of grouped){
  const group=document.createElement('div');group.className='pw-focus-day';
  const head=document.createElement('div');head.className='pw-focus-day-head';
  const label=document.createElement('strong');label.textContent=fmtDate(day);
  const count=document.createElement('small');count.textContent=items.length+' việc chưa xong';
  head.append(label,count);group.appendChild(head);
  items.forEach(t=>{
   const button=document.createElement('button');button.type='button';button.className='pw-focus-task-choice'+(String(state.taskId)===String(t.id)?' selected':'');
   const circle=document.createElement('span');circle.className='pw-focus-choice-circle';circle.textContent=String(state.taskId)===String(t.id)?'✓':'';
   const middle=document.createElement('span');middle.className='pw-focus-choice-main';
   const name=document.createElement('b');name.textContent=t.name;
   const meta=document.createElement('small');meta.textContent=[t.brand||'Không có brand',t.cat||''].filter(Boolean).join(' · ');
   middle.append(name,meta);
   const check=document.createElement('span');check.className='pw-focus-choice-indicator';check.textContent=String(state.taskId)===String(t.id)?'Đang chọn':'Chọn';
   button.append(circle,middle,check);
   button.addEventListener('click',()=>{
    if(state.active){status.textContent='Hãy kết thúc phiên đang chạy trước khi đổi task.';return}
    state.taskId=t.id;state.title=t.name;state.nextStep='';save();lastSignature='';refreshChoices();draw();
   });
   group.appendChild(button);
  });saved.appendChild(group);
 }
}
window.pwRefreshFocusTasks=refreshChoices;
refreshChoices();
const choicesInterval=setInterval(refreshChoices,2000);
const closeImmersive=()=>{immersive.hidden=true;document.body.style.overflow=''};
root.querySelector('#pwFocusImmersive').addEventListener('click',()=>{refreshChoices();immersive.hidden=false;document.body.style.overflow='hidden';updateImmersive()});
immersive.querySelector('#pwImmersiveClose').addEventListener('click',closeImmersive);
immersive.querySelector('#pwImmersivePause').addEventListener('click',()=>root.querySelector('#pwFocusPause').click());
immersive.querySelector('#pwImmersiveFinish').addEventListener('click',()=>{root.querySelector('#pwFocusEnd').click();closeImmersive();root.scrollIntoView({behavior:'smooth',block:'center'})});
immersive.querySelector('#pwImmersivePlus').addEventListener('click',()=>{if(!state.active)return;state.duration+=5;save();draw()});
function updateImmersive(){immersive.querySelector('#pwImmersiveClock').textContent=clock.textContent;immersive.querySelector('#pwImmersiveTask').textContent=state.title||'Chọn một việc để bắt đầu';immersive.querySelector('#pwImmersiveStep').textContent=state.nextStep||'';immersive.querySelector('#pwImmersivePause').textContent=state.pausedAt?'▶ Tiếp tục':'⏸ Tạm dừng'}

const $=id=>root.querySelector('#'+id),title=$('pwFocusTask'),step=$('pwFocusStep'),clock=$('pwFocusClock'),status=$('pwFocusStatus'),review=$('pwFocusReview');
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function elapsed(){return Math.max(0,(state.pausedAt||Date.now())-state.start-state.pausedTotal)}
function remaining(){return Math.max(0,state.duration*60000-elapsed())}
function notify(text){if(document.hidden&&'Notification'in window&&Notification.permission==='granted')try{new Notification('PHONG WORK · Focus',{body:text,tag:'phong-focus',icon:'icon-192.png'})}catch{}}
function draw(){
title.value=state.title;step.value=state.nextStep;
root.querySelectorAll('[data-min]').forEach(b=>b.classList.toggle('active',+b.dataset.min===state.duration));
const secs=state.active?Math.ceil(remaining()/1000):state.finished?0:state.duration*60;clock.textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
status.textContent=state.finished?'Phiên đã kết thúc. Bạn có thể lưu điểm dừng.':state.active?(state.pausedAt?'Đang tạm dừng':'Đang tập trung · thông báo Windows khi hết giờ'):'Sẵn sàng bắt đầu';
$('pwFocusStart').hidden=state.active||state.finished;
$('pwFocusPause').hidden=!state.active;$('pwFocusPause').textContent=state.pausedAt?'Tiếp tục':'Tạm dừng';$('pwFocusEnd').hidden=!state.active;review.hidden=!state.finished;updateImmersive();
}
title.addEventListener('input',()=>{state.title=title.value;state.taskId=null;save();refreshChoices()});step.addEventListener('input',()=>{state.nextStep=step.value;save()});
root.querySelectorAll('[data-min]').forEach(b=>b.addEventListener('click',()=>{if(state.active)return;state.duration=+b.dataset.min;state.finished=false;save();draw()}));
$('pwFocusStart').addEventListener('click',async()=>{if(!title.value.trim()){title.focus();return}state={...state,title:title.value.trim(),nextStep:step.value,duration:state.duration,start:Date.now(),pausedAt:0,pausedTotal:0,active:true,finished:false,reminded:false};save();draw();if('Notification'in window&&Notification.permission==='default')try{await Notification.requestPermission()}catch{}});
$('pwFocusPause').addEventListener('click',()=>{if(!state.active)return;if(state.pausedAt){state.pausedTotal+=Date.now()-state.pausedAt;state.pausedAt=0}else state.pausedAt=Date.now();save();draw()});
$('pwFocusEnd').addEventListener('click',()=>{state.active=false;state.finished=true;save();draw()});
root.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>{const action=b.dataset.review;if(action==='continue'){state={...state,duration:15,start:Date.now(),pausedAt:0,pausedTotal:0,active:true,finished:false,reminded:false};notif15=false;notifiedEnd=false}else{state.active=false;state.finished=false;state.start=0;if(action==='done')status.textContent='Đã ghi nhận kết thúc phiên. Task chính chưa tự đánh dấu hoàn thành.'}save();draw()}));
$('pwFocusCollapse').addEventListener('click',()=>{const x=$('pwFocusContent');x.hidden=!x.hidden;$('pwFocusCollapse').textContent=x.hidden?'Mở rộng':'Thu gọn'});
function tick(){if(!state.active||state.pausedAt)return;const passed=elapsed();if(passed>=900000&&!state.reminded&&state.duration>15){state.reminded=true;save();if(document.hidden)notify('Bạn còn đang dựng video chứ? Quay lại bước đang làm nhé 🎬')}
if(remaining()<=0){state.active=false;state.finished=true;save();draw();notify('Hết giờ Focus! Bạn đã làm đến đâu rồi?');if(!document.hidden)root.scrollIntoView({behavior:'smooth',block:'center'})}else clock.textContent=String(Math.floor(Math.ceil(remaining()/1000)/60)).padStart(2,'0')+':'+String(Math.ceil(remaining()/1000)%60).padStart(2,'0')}
draw();tick();setInterval(()=>{tick();if(!immersive.hidden)updateImmersive()},1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();draw()}});
})();