/* PHONG WORK reminders preview: client-side only. No database writes. */
(() => {
  'use strict';
  const STORE = 'pw-reminders-settings-v1';
  const SENT = 'pw-reminders-sent-v1';
  const items = [
    { key: 'morning', label: 'Tổng quan đầu ngày', time: '08:00' },
    { key: 'noon', label: 'Cập nhật giữa trưa', time: '12:00' },
    { key: 'afternoon', label: 'Tiến độ buổi chiều', time: '15:00' },
    { key: 'end', label: 'Nhắc việc cuối ngày', time: '17:30' }
  ];
  const defaultConfig = { enabled: true, browser: false, times: Object.fromEntries(items.map(x => [x.key, x.time])) };
  const safeParse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  let config = { ...defaultConfig, ...safeParse(STORE, {}), times: { ...defaultConfig.times, ...(safeParse(STORE, {}).times || {}) } };
  let history = [];
  const nowDate = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
  const allTasks = () => (typeof tasks !== 'undefined' && Array.isArray(tasks)) ? tasks : [];
  const stats = () => {
    const today = nowDate();
    const mine = allTasks().filter(t => t.date === today);
    const done = mine.filter(t => t.done).length;
    const overdue = allTasks().filter(t => t.date < today && !t.done).length;
    return { total: mine.length, done, left: mine.length - done, overdue };
  };
  const message = key => {
    const s = stats();
    if (key === 'morning') return { title: '☀️ Công việc hôm nay', body: 'Bạn có ' + s.total + ' task hôm nay' + (s.overdue ? ', và ' + s.overdue + ' task quá hạn.' : '.') };
    if (key === 'noon') return { title: '🍱 Báo cáo giữa trưa', body: 'Đã xong ' + s.done + '/' + s.total + ' task (' + (s.total ? Math.round(s.done/s.total*100) : 100) + '%). Còn ' + s.left + ' task.' };
    if (key === 'afternoon') return { title: '🕒 Tiến độ lúc 15:00', body: 'Đã hoàn thành ' + s.done + '/' + s.total + ' task. ' + (s.left ? 'Còn ' + s.left + ' task hôm nay.' : 'Hôm nay đã hoàn thành hết!') };
    if (key === 'end') return s.left + s.overdue ? { title: '🔔 Nhắc việc cuối ngày', body: 'Còn ' + s.left + ' task hôm nay chưa xong' + (s.overdue ? ' và ' + s.overdue + ' task quá hạn.' : '.') } : null;
    return null;
  };
  const css = document.createElement('style');
  css.textContent = '#pwReminderBell{position:relative;border:1px solid #e6e8e8;background:#fff;border-radius:999px;width:36px;height:36px;display:inline-grid;place-items:center;cursor:pointer;font-size:17px;margin-left:10px;color:#17181b}#pwReminderDot{position:absolute;top:3px;right:3px;width:8px;height:8px;border-radius:50%;background:#ef7f7a;display:none}#pwReminderPanel{position:fixed;z-index:999999;right:18px;top:68px;width:min(370px,calc(100vw - 36px));max-height:calc(100vh - 90px);overflow:auto;background:#fff;color:#17181b;border:1px solid #e5e5e5;border-radius:18px;padding:18px;box-shadow:0 20px 60px #17223330;display:none;font-family:inherit}#pwReminderPanel.open{display:block}#pwReminderPanel h3{margin:0 0 7px;font-size:17px}#pwReminderPanel p{font-size:12px;line-height:1.55;color:#64707b;margin:5px 0 12px}#pwReminderPanel label{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:13px 0;font-size:13px}#pwReminderPanel input[type=time]{border:1px solid #ddd;border-radius:8px;padding:6px;max-width:105px;background:#fff;color:#17181b}#pwReminderPanel button{cursor:pointer;border-radius:10px;padding:9px 12px;background:#17181b;color:white;border:0;font-size:12px}#pwReminderPanel .pw-notice{border-radius:10px;background:#f5f7f7;padding:11px;margin-top:8px;font-size:12px;line-height:1.55}#pwReminderPanel .pw-notice strong{display:block;margin-bottom:3px}#pwReminderPanel .pw-btns{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}#pwReminderToast{position:fixed;right:18px;bottom:20px;z-index:999999;padding:14px 17px;border-radius:14px;background:#172b23;color:#fff;box-shadow:0 10px 35px #0003;max-width:min(370px,calc(100vw - 36px));display:none;font-size:12px;line-height:1.5}';
  document.head.appendChild(css);
  const bell = document.createElement('button');
  bell.id='pwReminderBell'; bell.type='button'; bell.title='Nhắc nhở tiến độ';bell.setAttribute('aria-label','Thông báo nhắc nhở');
  bell.innerHTML='🔔<span id="pwReminderDot"></span>';
  const top = document.querySelector('.top');
  if (top) top.appendChild(bell);
  const panel = document.createElement('div'); panel.id = 'pwReminderPanel';
  panel.innerHTML = '<h3>🔔 Nhắc nhở công việc</h3><p>Báo cáo dựa trên task thật trong app. Bản thử nghiệm chỉ chạy khi bạn mở website, không sửa dữ liệu Supabase.</p><label><span>Bật nhắc nhở</span><input type="checkbox" id="pwReminderEnabled"></label><div id="pwReminderTimes"></div><div class="pw-btns"><button id="pwReminderPermission" type="button">Bật thông báo trình duyệt</button><button id="pwReminderPreview" type="button">Xem báo cáo hiện tại</button></div><p>Thông báo máy tính chỉ hiện khi bạn cấp quyền. Nếu đóng hẳn website, lịch nhắc sẽ chưa chạy.</p><h3>Thông báo gần đây</h3><div id="pwReminderHistory"></div>';
  document.body.appendChild(panel);
  const $ = id => document.getElementById(id);
  $('pwReminderTimes').innerHTML = items.map(x => '<label><span>'+x.label+'</span><input type="time" data-reminder="'+x.key+'" value="'+config.times[x.key]+'"></label>').join('');
  $('pwReminderEnabled').checked = config.enabled;
  const save = () => { localStorage.setItem(STORE, JSON.stringify(config)); };
  $('pwReminderEnabled').addEventListener('change', e=>{config.enabled=e.target.checked; save();});
  panel.querySelectorAll('input[type=time]').forEach(input => input.addEventListener('change',e=>{config.times[e.target.dataset.reminder]=e.target.value;save();}));
  const renderHistory = () => { $('pwReminderHistory').innerHTML = history.length ? history.map(x=>'<div class="pw-notice"><strong></strong><span></span></div>').join('') : '<p>Chưa có thông báo nào trong phiên mở app này.</p>'; panel.querySelectorAll('.pw-notice').forEach((el,i)=>{el.querySelector('strong').textContent=history[i].title;el.querySelector('span').textContent=history[i].body;}); $('pwReminderDot').style.display = history.length && !panel.classList.contains('open') ? 'block':'none'; };
  const toast = ({title,body}) => { const el=$('pwReminderToast');el.textContent=title+' · '+body;el.style.display='block';clearTimeout(toast.timeoutId);toast.timeoutId=setTimeout(()=>el.style.display='none',9000); };
  const toastEl=document.createElement('div');toastEl.id='pwReminderToast';document.body.appendChild(toastEl);
  const show = (key, notify = false) => { const msg=message(key);if(!msg)return;history.unshift(msg);history=history.slice(0,12);renderHistory();toast(msg);if(notify && config.browser && 'Notification' in window && Notification.permission==='granted'){try{new Notification(msg.title,{body:msg.body,tag:'pw-reminder-'+key});}catch(e){console.warn('Browser notification unavailable',e);}} };
  $('pwReminderPreview').onclick = () => show(new Date().getHours()>=17?'end':new Date().getHours()>=15?'afternoon':new Date().getHours()>=12?'noon':'morning');
  $('pwReminderPermission').onclick = async () => { if (!('Notification' in window)) { alert('Trình duyệt này không hỗ trợ thông báo.');return; }const granted=await Notification.requestPermission(); config.browser=granted==='granted';save();$('pwReminderPermission').textContent=config.browser?'Đã bật thông báo ✓':'Chưa được cấp quyền'; };
  if (config.browser && 'Notification' in window && Notification.permission==='granted') $('pwReminderPermission').textContent='Đã bật thông báo ✓';
  bell.onclick = () => {panel.classList.toggle('open');renderHistory();};
  document.addEventListener('click',e=>{if(!panel.contains(e.target)&&!bell.contains(e.target))panel.classList.remove('open');});
  const check = () => {
    if (!config.enabled) return;
    const d=new Date(),min=d.getHours()*60+d.getMinutes(),day=nowDate();
    const sent=safeParse(SENT,{});
    let changed=false;
    for (const item of items) {
      const match=/^(\d{2}):(\d{2})$/.exec(config.times[item.key]||'');
      if(!match)continue;
      const trigger=Number(match[1])*60+Number(match[2]),key=day+'-'+item.key+'-'+config.times[item.key];
      if (min>=trigger && min<trigger+15 && !sent[key]) {sent[key]=true;changed=true;show(item.key,true);}
    }
    if(changed){const trimmed=Object.fromEntries(Object.entries(sent).filter(([k])=>k.slice(0,10)>=new Date(Date.now()-8*86400000).toISOString().slice(0,10)));localStorage.setItem(SENT,JSON.stringify(trimmed));}
  };
  setInterval(check,30000);setTimeout(check,1600);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
})();