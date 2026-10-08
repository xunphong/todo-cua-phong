/* PHONG WORK Focus. Local timer, does not change task data unless user explicitly marks done in main app. */
(()=>{'use strict';
const KEY='pw-focus-session-v1',get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
let state=get()||{title:'',duration:60,start:0,pausedAt:0,pausedTotal:0,nextStep:'',active:false,finished:false,reminded:false};
let notifiedEnd=false,notif15=false;
const root=document.createElement('section');root.id='pwFocus';root.className='pw-focus card';root.innerHTML=`
<div class="pw-focus-head"><div><span class="pw-focus-kicker">FOCUS MODE</span><h2>Chỉ một việc trước mắt 🎬</h2></div><button id="pwFocusCollapse" class="pw-focus-min">Thu gọn</button></div>
<div id="pwFocusContent">
<label class="pw-focus-label" for="pwFocusTask">Việc bạn đang tập trung</label>
<input id="pwFocusTask" maxlength="180" placeholder="Ví dụ: Dựng video du lịch 60 phút">
<label class="pw-focus-label" for="pwFocusStep">Bước tiếp theo / điểm dừng</label>
<textarea id="pwFocusStep" rows="2" maxlength="500" placeholder="Ví dụ: Chọn footage và dựng đoạn mở đầu"></textarea>
<div class="pw-focus-times"><span>Thời gian tập trung</span><div id="pwFocusDurations"><button data-min="15">15'</button><button data-min="25">25'</button><button data-min="60">60'</button></div></div>
<div class="pw-focus-clock" id="pwFocusClock">60:00</div>
<div class="pw-focus-status" id="pwFocusStatus">Chọn một việc rồi bắt đầu nhé.</div>
<div class="pw-focus-actions"><button id="pwFocusStart">Bắt đầu</button><button id="pwFocusPause" class="pw-focus-secondary" hidden>Tạm dừng</button><button id="pwFocusEnd" class="pw-focus-secondary" hidden>Kết thúc</button></div>
<div class="pw-focus-note">Nhắc quay lại sau 15 phút và hỏi tiến độ khi hết giờ. Muốn nhận thông báo Windows, hãy cấp quyền thông báo cho website.</div>
<div class="pw-focus-review" id="pwFocusReview" hidden><b>Bạn làm tới đâu rồi?</b><p>Đồng hồ đã kết thúc. Chọn cách tiếp tục phù hợp:</p><div class="pw-focus-review-actions"><button data-review="continue">Thêm 15 phút</button><button data-review="break">Nghỉ / lưu điểm dừng</button><button data-review="done">Đã xong việc</button></div></div>
</div>`;
const style=document.createElement('style');style.textContent=`
.pw-focus{padding:21px 24px;margin-top:15px}.pw-focus-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.pw-focus-head h2{font-size:17px;margin:3px 0 14px}.pw-focus-kicker{font-weight:800;color:var(--video);font-size:10px;letter-spacing:.1em}.pw-focus-min{background:#eaf0fa;color:#35577f;border:none;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:11px}.pw-focus-label{display:block;font-size:11px;color:#697991;font-weight:700;margin:12px 0 6px}.pw-focus input,.pw-focus textarea{width:100%;border:1px solid #e0e7f0;background:#fff;border-radius:12px;padding:11px 13px;outline:none;color:var(--ink);font-size:13px;resize:vertical}.pw-focus input:focus,.pw-focus textarea:focus{border-color:var(--video)}.pw-focus-times{margin-top:16px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}.pw-focus-times button{border:0;border-radius:10px;padding:9px 12px;background:#f0f2f7;color:#526078;cursor:pointer}.pw-focus-times button.active{background:#dce8ff;color:#245caa;font-weight:800}.pw-focus-clock{text-align:center;font-weight:780;font-size:48px;font-variant-numeric:tabular-nums;margin:12px 0 0;letter-spacing:-2px}.pw-focus-status{text-align:center;color:#7a8394;font-size:11px;margin-bottom:14px}.pw-focus-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}.pw-focus-actions button,.pw-focus-review button{cursor:pointer;border:0;background:var(--video);color:#fff;border-radius:12px;padding:12px 22px;font-size:12px;font-weight:750}.pw-focus-actions button.pw-focus-secondary,.pw-focus-review button:nth-child(2){background:#e8eef8;color:#37577d}.pw-focus-note{font-size:10px;color:#86909e;text-align:center;margin-top:15px;line-height:1.55}.pw-focus-review{background:#edf3fd;border:1px solid #d9e7fc;padding:15px;border-radius:13px;margin-top:15px}.pw-focus-review p{font-size:12px;color:#67768b}.pw-focus-review-actions{display:flex;gap:7px;flex-wrap:wrap}.pw-focus-review button{padding:10px 13px}.pw-focus-review button:nth-child(3){background:#58b88a}#pwFocus[hidden],#pwFocus [hidden]{display:none!important}
@media(max-width:600px){.pw-focus{padding:18px 15px}.pw-focus-head h2{font-size:16px}.pw-focus-times{align-items:flex-start;flex-direction:column}.pw-focus-times button{min-width:63px}.pw-focus-clock{font-size:42px}.pw-focus-actions button{flex:1}}
`;document.head.appendChild(style);
const tasksCard=document.querySelector('.tasksCard');if(tasksCard)tasksCard.parentNode.insertBefore(root,tasksCard);else document.querySelector('.app')?.appendChild(root);
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
$('pwFocusPause').hidden=!state.active;$('pwFocusPause').textContent=state.pausedAt?'Tiếp tục':'Tạm dừng';$('pwFocusEnd').hidden=!state.active;review.hidden=!state.finished;
}
title.addEventListener('input',()=>{state.title=title.value;save()});step.addEventListener('input',()=>{state.nextStep=step.value;save()});
root.querySelectorAll('[data-min]').forEach(b=>b.addEventListener('click',()=>{if(state.active)return;state.duration=+b.dataset.min;state.finished=false;save();draw()}));
$('pwFocusStart').addEventListener('click',async()=>{if(!title.value.trim()){title.focus();return}state={...state,title:title.value.trim(),nextStep:step.value,duration:state.duration,start:Date.now(),pausedAt:0,pausedTotal:0,active:true,finished:false,reminded:false};save();draw();if('Notification'in window&&Notification.permission==='default')try{await Notification.requestPermission()}catch{}});
$('pwFocusPause').addEventListener('click',()=>{if(!state.active)return;if(state.pausedAt){state.pausedTotal+=Date.now()-state.pausedAt;state.pausedAt=0}else state.pausedAt=Date.now();save();draw()});
$('pwFocusEnd').addEventListener('click',()=>{state.active=false;state.finished=true;save();draw()});
root.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>{const action=b.dataset.review;if(action==='continue'){state={...state,duration:15,start:Date.now(),pausedAt:0,pausedTotal:0,active:true,finished:false,reminded:false};notif15=false;notifiedEnd=false}else{state.active=false;state.finished=false;state.start=0;if(action==='done')status.textContent='Đã ghi nhận kết thúc phiên. Task chính chưa tự đánh dấu hoàn thành.'}save();draw()}));
$('pwFocusCollapse').addEventListener('click',()=>{const x=$('pwFocusContent');x.hidden=!x.hidden;$('pwFocusCollapse').textContent=x.hidden?'Mở rộng':'Thu gọn'});
function tick(){if(!state.active||state.pausedAt)return;const passed=elapsed();if(passed>=900000&&!state.reminded&&state.duration>15){state.reminded=true;save();if(document.hidden)notify('Bạn còn đang dựng video chứ? Quay lại bước đang làm nhé 🎬')}
if(remaining()<=0){state.active=false;state.finished=true;save();draw();notify('Hết giờ Focus! Bạn đã làm đến đâu rồi?');if(!document.hidden)root.scrollIntoView({behavior:'smooth',block:'center'})}else clock.textContent=String(Math.floor(Math.ceil(remaining()/1000)/60)).padStart(2,'0')+':'+String(Math.ceil(remaining()/1000)%60).padStart(2,'0')}
draw();tick();setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();draw()}});
})();