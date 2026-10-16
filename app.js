import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const questions = {
  morning: [
    ['วันนี้ฉันรู้สึกอย่างไร?', 'ลองสำรวจอารมณ์และสภาพจิตใจของตัวเอง'],
    ['วันนี้ฉันรู้สึกขอบคุณอะไร?', 'เขียน 1–3 สิ่งเล็ก ๆ ที่ทำให้รู้สึกดี'],
    ['วันนี้สิ่งสำคัญ 3 อย่างที่ต้องทำคืออะไร?', 'เลือกสิ่งที่สำคัญจริง ๆ สำหรับวันนี้'],
    ['วันนี้ฉันอยากทำอะไรให้สำเร็จมากที่สุด?', 'ตั้งเป้าหมายหลัก 1 อย่าง'],
    ['อะไรอาจเป็นอุปสรรคของวันนี้?', 'ลองคิดวิธีรับมือไว้ล่วงหน้า'],
    ['วันนี้ฉันอยากพัฒนาตัวเองด้านไหน?', 'เช่น วินัย การสื่อสาร สมาธิ หรือความอดทน'],
    ['วันนี้ฉันอยากใช้ชีวิตด้วยแนวคิดอะไร?', 'เช่น ใจเย็น ทำให้เต็มที่ หรือไม่กดดันตัวเอง']
  ],
  evening: [
    ['วันนี้เกิดอะไรขึ้นบ้าง?', 'สรุปเหตุการณ์สำคัญของวัน'],
    ['งานที่ตั้งใจไว้ตอนเช้าสำเร็จแค่ไหน?', 'อะไรเสร็จแล้ว อะไรยังไม่เสร็จ และเพราะอะไร'],
    ['วันนี้ฉันภูมิใจในตัวเองเรื่องอะไร?', 'นับรวมความสำเร็จเล็ก ๆ ด้วยนะ'],
    ['วันนี้ฉันเจอปัญหาหรืออุปสรรคอะไร?', 'เขียนตามจริง โดยไม่ต้องตัดสินตัวเอง'],
    ['ฉันรับมือกับปัญหาได้ดีแค่ไหน?', 'ครั้งหน้ามีวิธีไหนที่อาจดีกว่าเดิม'],
    ['วันนี้ฉันได้เรียนรู้อะไร?', 'เกี่ยวกับงาน คนอื่น หรือเกี่ยวกับตัวเอง'],
    ['วันนี้อารมณ์ของฉันเป็นอย่างไร และเพราะอะไร?', 'มีอะไรทำให้มีความสุข เครียด หรือเหนื่อย'],
    ['วันนี้มีอะไรที่ฉันอยากทำให้ต่างออกไป?', 'เลือกสิ่งที่ปรับปรุงได้จริง'],
    ['พรุ่งนี้ฉันจะทำอะไรให้ดีขึ้น 1 อย่าง?', 'กำหนดเป็นการกระทำที่ชัดเจน']
  ]
};
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
let activeDay = Number(localStorage.getItem('lbl-active-day') || 1);
let activeSession = 'morning';
let questionPage = 0;
let user = null;
let auth = null;
let db = null;
let cloudReady = false;
let cloudModules = null;
let saveTimer = null;
let mascotTimer = null;
const localKey = () => user?.uid ? `lbl-journal-${user.uid}` : 'lbl-journal-demo';
const readData = () => { try { return JSON.parse(localStorage.getItem(localKey()) || '{}'); } catch { return {}; } };
const writeLocal = (data) => localStorage.setItem(localKey(), JSON.stringify(data));
const recordKey = (day, session) => `day${day}-${session}`;
const getRecord = (day=activeDay, session=activeSession) => readData()[recordKey(day, session)] || {};
const setMascot = (state, message) => {
  const cat = $('#sidebarCat');
  if (cat) cat.className = `cat-wrap cat-${state}`;
  const tip = $('#mascotMessage'); if (tip && message) tip.textContent = message;
};
function toast(message) { const t=$('#toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),2600); }
function goView(view) {
  $$('.view').forEach(v=>v.classList.remove('active-view'));
  const target = view==='morning'||view==='evening' ? $('#journalView') : view==='calendar' ? $('#calendarView') : $('#dashboardView');
  target.classList.add('active-view');
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view || (['morning','evening'].includes(view)&&b.dataset.view===view)));
  if(view==='morning'||view==='evening'){activeSession=view;questionPage=0;renderJournal();setMascot(view==='morning'?'greeting':'sleepy',view==='morning'?'อรุณสวัสดิ์ ♡ วันนี้เริ่มทีละนิดกันนะ':'วันนี้เก่งมากแล้ว ได้เวลาทบทวนและพักใจ ♡');}
  if(view==='calendar') renderLargeCalendar();
  if(view==='dashboard') { renderDashboard(); setMascot('idle','Good things take time ♡'); }
  window.scrollTo({top:0,behavior:'smooth'});
}
function dayStatus(day) { const data=readData(); const m=data[recordKey(day,'morning')]||{}; const e=data[recordKey(day,'evening')]||{}; return {morning:Object.values(m).some(v=>String(v).trim()),evening:Object.values(e).some(v=>String(v).trim())}; }
function renderDashboard(){
  const data=readData(); let completed=0; for(let d=1;d<=30;d++){const s=dayStatus(d);if(s.morning&&s.evening)completed++;}
  const started=Object.keys(data).filter(k=>Object.values(data[k]||{}).some(v=>String(v).trim())).length;
  const percent=Math.round(completed/30*100); $('#currentDay').textContent=String(activeDay).padStart(2,'0'); $('#progressFill').style.width=`${percent}%`; $('#progressPercent').textContent=`${percent}%`; $('#progressText').textContent=completed?`บันทึกครบทั้งเช้าและเย็นแล้ว ${completed} วัน`:'ทุกก้าวเล็ก ๆ มีความหมาย เริ่มได้เลยวันนี้';
  $('#dayGrid').innerHTML=''; for(let d=1;d<=30;d++){const s=dayStatus(d);const b=document.createElement('button');b.className='day-cell'+(d===activeDay?' today':'')+((s.morning||s.evening)?' written':'')+((s.morning!==s.evening)?' partial':'');b.textContent=String(d).padStart(2,'0');b.title=`Day ${d}: ${s.morning?'เช้าเขียนแล้ว':'ยังไม่เขียนช่วงเช้า'} / ${s.evening?'เย็นเขียนแล้ว':'ยังไม่เขียนช่วงเย็น'}`;b.addEventListener('click',()=>selectDay(d));$('#dayGrid').appendChild(b);}
}
function renderLargeCalendar(){
  const grid=$('#largeDayGrid');grid.innerHTML='';for(let d=1;d<=30;d++){const s=dayStatus(d);const b=document.createElement('button');b.className='day-cell'+(d===activeDay?' today':'')+((s.morning||s.evening)?' written':'')+((s.morning!==s.evening)?' partial':'');b.textContent=String(d).padStart(2,'0');b.addEventListener('click',()=>{selectDay(d);const summary=$('#selectedDaySummary');summary.innerHTML=`<h3>Day ${String(d).padStart(2,'0')}</h3><p>☼ Morning Journal: ${s.morning?'มีบันทึกแล้ว':'ยังไม่มีบันทึก'}</p><p>☾ Evening Reflection: ${s.evening?'มีบันทึกแล้ว':'ยังไม่มีบันทึก'}</p><button class="pill-button blue-button" id="openMorning">เปิดบันทึกตอนเช้า →</button> <button class="pill-button red-button" id="openEvening">เปิดบันทึกตอนเย็น →</button>`;$('#openMorning').onclick=()=>goView('morning');$('#openEvening').onclick=()=>goView('evening');});grid.appendChild(b);}
}
function selectDay(day){activeDay=day;localStorage.setItem('lbl-active-day',String(day));renderDashboard();toast(`เลือก Day ${String(day).padStart(2,'0')} แล้ว`);}
function renderJournal(){
  const qs=questions[activeSession];const record=getRecord();$('#journalEyebrow').textContent=`DAY ${String(activeDay).padStart(2,'0')} / ${activeSession==='morning'?'MORNING JOURNAL':'EVENING REFLECTION'}`;$('#journalTitle').innerHTML=activeSession==='morning'?'Good morning<span>.</span>':'You did enough<span>.</span>';$('#journalIntro').textContent=activeSession==='morning'?'ก่อนเริ่มวัน ลองใช้เวลาสักครู่เพื่อกลับมาอยู่กับตัวเอง':'วางเรื่องของวันนี้ลงสักครู่ แล้วมองย้อนกลับมาอย่างใจดีกับตัวเอง';$('#morningTab').classList.toggle('selected',activeSession==='morning');$('#eveningTab').classList.toggle('selected',activeSession==='evening');
  const start=questionPage*3;const end=Math.min(start+3,qs.length);$('#questionCounter').textContent=`QUESTION ${String(start+1).padStart(2,'0')} / ${String(qs.length).padStart(2,'0')}`;$('#questionFill').style.width=`${(end/qs.length)*100}%`;
  const form=$('#journalForm');form.innerHTML='';for(let i=start;i<end;i++){const card=document.createElement('div');card.className='question-card';card.innerHTML=`<div class="question-top"><span class="question-index">${String(i+1).padStart(2,'0')}</span><div class="question-copy"><h3></h3><p></p></div></div><textarea aria-label="คำตอบ" data-question="${i}" placeholder="เขียนสิ่งที่อยู่ในใจได้เลย..." rows="3"></textarea>`;card.querySelector('h3').textContent=qs[i][0];card.querySelector('p').textContent=qs[i][1];card.querySelector('textarea').value=record[i]||'';card.querySelector('textarea').addEventListener('input',e=>{saveAnswer(i,e.target.value);setMascot('curious','กำลังค่อย ๆ ทำความเข้าใจตัวเองอยู่ เก่งมากแล้ว ♡');});form.appendChild(card);}
  $('#prevQuestion').disabled=questionPage===0;$('#prevQuestion').style.opacity=questionPage===0?'.45':'1';$('#nextQuestion').textContent=end>=qs.length?'บันทึกและเสร็จสิ้น ✓':'คำถามถัดไป →';$('#saveStatus').textContent=user?`บันทึกสำหรับ ${user.displayName||user.email}`:'บันทึกอัตโนมัติในอุปกรณ์นี้';
}
function saveAnswer(index,value){const data=readData();const key=recordKey(activeDay,activeSession);data[key]=data[key]||{};data[key][index]=value;writeLocal(data);$('#saveStatus').textContent='บันทึกแล้ว ✓';renderDashboard();if(cloudReady) saveCloudRecord(key,data[key]);clearTimeout(saveTimer);saveTimer=setTimeout(()=>$('#saveStatus').textContent=user?'บันทึกในบัญชีของคุณ':'บันทึกอัตโนมัติในอุปกรณ์นี้',1800);}
function nextQuestion(){const max=Math.ceil(questions[activeSession].length/3)-1;if(questionPage<max){questionPage++;renderJournal();setMascot('playful','ไปต่ออีกนิดนะ! ทีละคำถามก็พอ ♡');}else{toast('บันทึกวันนี้เรียบร้อยแล้ว ♡');setMascot('celebrate','เย้! ขอบคุณที่แบ่งเวลาให้ตัวเองนะ ♡');renderDashboard();goView('dashboard');}}
function prevQuestion(){if(questionPage>0){questionPage--;renderJournal();}}
function bindEvents(){
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>goView(b.dataset.view)));
  $('#morningTab').addEventListener('click',()=>{activeSession='morning';questionPage=0;renderJournal();setMascot('greeting','มาเริ่มวันด้วยความตั้งใจดี ๆ กัน ♡');});$('#eveningTab').addEventListener('click',()=>{activeSession='evening';questionPage=0;renderJournal();setMascot('sleepy','วันนี้ทำดีที่สุดเท่าที่ทำได้แล้ว ♡');});$('#nextQuestion').addEventListener('click',nextQuestion);$('#prevQuestion').addEventListener('click',prevQuestion);
  $('#loginBtn').addEventListener('click',loginWithGoogle);$('#logoutBtn').addEventListener('click',logout);
  $('#loginBtn').addEventListener('mouseenter',()=>setMascot('playful','กำลังกดปุ่มอยู่เหรอ? สวัสดี! ♡'));$('#loginBtn').addEventListener('mouseleave',()=>setMascot('idle','Good things take time ♡'));
}
async function initFirebase(){if(!isFirebaseConfigured)return;try{const appMod=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');const authMod=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');const fsMod=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');const app=appMod.initializeApp(firebaseConfig);auth=authMod.getAuth(app);db=fsMod.getFirestore(app);cloudModules={...authMod,...fsMod};cloudReady=true;authMod.onAuthStateChanged(auth,async current=>{user=current||null;updateAccountUI();if(user){await loadCloudData();renderDashboard();renderJournal();toast('ยินดีต้อนรับกลับมา ♡');setMascot('greeting',`ยินดีต้อนรับ ${user.displayName||'กลับมา'} ♡`);}});}catch(err){console.error(err);toast('เชื่อมต่อระบบบัญชีไม่สำเร็จ ตรวจสอบ Firebase config');}}
async function loginWithGoogle(){if(!cloudReady){showNotice('ปุ่ม Google Login พร้อมเชื่อมต่อแล้ว แต่ต้องใส่ Firebase config ก่อนใช้งานจริง ดูขั้นตอนใน README.md ขณะนี้คุณทดลองเขียนและบันทึกในอุปกรณ์นี้ได้');return;}try{const provider=new cloudModules.GoogleAuthProvider();await cloudModules.signInWithPopup(auth,provider);}catch(err){console.error(err);toast('เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้งนะ');}}
async function logout(){if(cloudReady&&auth){await cloudModules.signOut(auth);}user=null;updateAccountUI();toast('ออกจากระบบแล้ว');}
function updateAccountUI(){$('#userLabel').textContent=user?(user.displayName||user.email||'My Journal'):'My Journal';$('#loginText').textContent=user?'เชื่อมต่อแล้ว':'Sign in with Google';$('#loginBtn').classList.toggle('hidden',!!user);$('#logoutBtn').classList.toggle('hidden',!user);}
function showNotice(message){const n=$('#loginNotice');n.textContent=message;n.classList.remove('hidden');n.scrollIntoView({behavior:'smooth',block:'center'});setMascot('curious','อีกนิดเดียวก็พร้อมแล้ว ♡');}
async function loadCloudData(){if(!user||!cloudReady)return;try{const ref=cloudModules.doc(db,'users',user.uid,'journal','entries');const snap=await cloudModules.getDoc(ref);if(snap.exists()){const cloudData=snap.data().entries||{};const local=readData();writeLocal({...cloudData,...local});}else{await cloudModules.setDoc(ref,{entries:readData(),updatedAt:Date.now()});}}catch(err){console.error(err);toast('ยังซิงก์ข้อมูลออนไลน์ไม่ได้ ตรวจสอบ Firestore rules');}}
async function saveCloudRecord(key,record){if(!user||!cloudReady)return;try{const ref=cloudModules.doc(db,'users',user.uid,'journal','entries');await cloudModules.setDoc(ref,{entries:readData(),updatedAt:Date.now()},{merge:true});$('#saveStatus').textContent='ซิงก์ออนไลน์แล้ว ✓';}catch(err){console.error(err);$('#saveStatus').textContent='บันทึกในเครื่องแล้ว · ซิงก์ไม่สำเร็จ';}}
function startMascotCycle(){const states=[['idle','Good things take time ♡'],['playful','ปุ่มนี้น่ากดจังเลย! ♡'],['curious','อยากเล่าอะไรให้ฟังไหม? ♡'],['idle','ค่อย ๆ เขียนก็ได้นะ ♡']];let i=0;mascotTimer=setInterval(()=>{if(!$('#dashboardView').classList.contains('active-view')&&!$('#journalView').classList.contains('active-view'))return;const s=states[i%states.length];if(!$('#journalView').classList.contains('active-view'))setMascot(s[0],s[1]);i++;},9500);}
updateAccountUI();bindEvents();renderDashboard();renderJournal();initFirebase();startMascotCycle();
