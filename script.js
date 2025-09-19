// Single front-end localStorage-backed demo engine for index + student + faculty pages.
// DB key
const DB_KEY = 'icct_portal_db_v3';

// Default DB
const DEFAULT_DB = {
  campuses: ['Cainta (Main)','Sumulong (Cainta)','San Mateo','Cogeo','Antipolo','Taytay','Binangonan','Angono'],
  users: [
    // sample users
    { id:'s001', name:'Juan Dela Cruz', email:'s001@icct.edu.ph', pass:'pass', role:'student', campus:'Cainta (Main)', course:'BSIT', subjects:['IT101','Math1'], grades:{'IT101':[85],'Math1':[90]}, payments:[{id:'p1',item:'Tuition 1st Installment',amount:5000,status:'pending'}] },
    { id:'f001', name:'Prof. Santos', email:'f001@icct.edu.ph', pass:'pass', role:'faculty', campus:'Cainta (Main)', subjects:['IT101'] },
    { id:'admin', name:'Registrar', email:'admin@icct.edu.ph', pass:'pass', role:'admin', campus:'Cainta (Main)' }
  ],
  events: [ { id:'ev1', title:'Orientation', date: new Date().toISOString().slice(0,10), by:'admin' } ],
  announcements: [ { id:'a1', title:'Drug test this October (MANDATORY)', body:'All students must take the drug test on Oct 10. Bring valid ID.', time:new Date().toISOString() } ],
  mails: [],
  suggestions: []
};

// load or init DB
function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(!raw){ localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB)); return structuredClone(DEFAULT_DB); }
  try{ return JSON.parse(raw); } catch(e){ localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DB)); return structuredClone(DEFAULT_DB);}
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

let DB = loadDB();

// date/time update
function updateDateTime(){
  const el = document.querySelectorAll('#dt');
  const s = new Date().toLocaleString();
  el.forEach(x=>{ if(x) x.textContent = s; });
}
setInterval(updateDateTime,1000);
updateDateTime();

// THEME
function cycleTheme(){
  const cur = document.body.getAttribute('data-theme') || 'dim';
  const map = { 'light':'dim', 'dim':'', '':'light' };
  const next = map[cur];
  if(next) document.body.setAttribute('data-theme', next); else document.body.removeAttribute('data-theme');
  localStorage.setItem('icct_theme', next||'dim');
}
(function restoreTheme(){ const t = localStorage.getItem('icct_theme')||'dim'; if(t) document.body.setAttribute('data-theme', t); })();

// ---------- INDEX PAGE (login/register) ----------
document.addEventListener('DOMContentLoaded', ()=>{
  // toggle tabs on index if present
  const btnL = document.getElementById('btnLogin');
  const btnR = document.getElementById('btnRegister');
  if(btnL && btnR){
    btnL.onclick = ()=>{ showLoginTab(); };
    btnR.onclick = ()=>{ showRegisterTab(); };
    // populate campus select
    const regCampus = document.getElementById('regCampus');
    if(regCampus){
      regCampus.innerHTML = '';
      DB.campuses.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c; regCampus.appendChild(o); });
    }
  }

  // detect which page we are on: index, student, faculty
  if(location.pathname.endsWith('index.html') || location.pathname.endsWith('/')){
    // nothing else
  } else if(location.pathname.endsWith('student-dashboard.html')){
    // prepare student dashboard
    initStudentDashboard();
  } else if(location.pathname.endsWith('faculty-dashboard.html')){
    initFacultyDashboard();
  }

  // auto-redirect if logged in
  const last = localStorage.getItem('icct_last_user');
  if(last && (location.pathname.endsWith('index.html')||location.pathname.endsWith('/'))){
    const u = DB.users.find(x=>x.id===last);
    if(u){ redirectToDashboard(u); }
  }
});

// show/hide tabs
function showLoginTab(){ document.getElementById('loginForm').classList.remove('hidden'); document.getElementById('regForm').classList.add('hidden'); document.getElementById('btnLogin').classList.add('active'); document.getElementById('btnRegister').classList.remove('active'); }
function showRegisterTab(){ document.getElementById('loginForm').classList.add('hidden'); document.getElementById('regForm').classList.remove('hidden'); document.getElementById('btnLogin').classList.remove('active'); document.getElementById('btnRegister').classList.add('active'); }

function fillDemo(){ document.getElementById('loginId').value='s001'; document.getElementById('loginPass').value='pass'; }

// REGISTER
function register(e){
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const id = document.getElementById('regID').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;
  const role = document.getElementById('regRole').value;
  const campus = document.getElementById('regCampus').value || DB.campuses[0];
  const course = document.getElementById('regCourse').value || '';

  if(!name || !id || !email || !pass){ alert('Fill all required fields'); return; }
  if(DB.users.find(u=>u.id===id || u.email===email)){ alert('ID or email already used'); return; }
  const u = { id, name, email, pass, role, campus, course, subjects:[], grades:{}, payments:[] };
  DB.users.push(u);
  saveDB(DB);
  alert('Account created. ID: '+id);
  document.getElementById('loginId').value = id;
  showLoginTab();
}

// CLEAR REG
function clearRegister(){
  ['regName','regID','regEmail','regPass','regCourse'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
}

// LOGIN
function login(e){
  e.preventDefault();
  const idOrEmail = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value;
  const u = DB.users.find(x => x.id === idOrEmail || x.email === idOrEmail);
  if(!u || u.pass !== pass){ alert('Invalid credentials'); return; }
  localStorage.setItem('icct_last_user', u.id);
  redirectToDashboard(u);
}

function redirectToDashboard(user){
  if(user.role === 'student') location.href = 'student-dashboard.html';
  else if(user.role === 'faculty') location.href = 'faculty-dashboard.html';
  else location.href = 'faculty-dashboard.html';
}

// LOGOUT used on dashboards
function performLogout(){
  localStorage.removeItem('icct_last_user');
  // redirect to index
  location.href = 'index.html';
}

// ---------- Student Dashboard ----------
function initStudentDashboard(){
  // verify login
  const uid = localStorage.getItem('icct_last_user');
  if(!uid){ location.href = 'index.html'; return; }
  const user = DB.users.find(x=>x.id===uid);
  if(!user){ location.href = 'index.html'; return; }
  // set welcome name
  const w = document.getElementById('welcomeName');
  if(w) w.textContent = `Welcome, ${user.name}`;
  // populate top folders
  renderFolders('student');
  // render subjects/grades/payments
  renderStudentSubjects(user);
  renderStudentGrades(user);
  renderStudentPayments(user);
  renderEventsList();
  renderAnnouncements();
  renderNotificationsCount();
  // attach actions
  document.getElementById('monthLabel') && (document.getElementById('monthLabel').textContent = new Date().toLocaleString());
}

// top archive folders
function renderFolders(role){
  const arr = ['Student Records','Enrollment','Exams & ORF','Messages','Finance','Archive Files'];
  const root = document.getElementById('topFolders') || document.getElementById('folders');
  if(!root) return;
  root.innerHTML = '';
  arr.forEach(a=>{
    const d = document.createElement('div');
    d.className = 'folder';
    d.innerHTML = `<div style="font-size:22px">📁</div><h4>${a}</h4>`;
    d.onclick = ()=> {
      if(a==='Exams & ORF') generateORF();
      else if(a==='Messages') openComposeModal();
      else if(a==='Finance') alert('Payments & installments panel (bottom)'); 
      else alert(a+' — demo open');
    };
    root.appendChild(d);
  });
}

// STUDENT subjects
function renderStudentSubjects(user){
  const el = document.getElementById('subjectList');
  if(!el) return;
  el.innerHTML = '';
  const subs = user.subjects || [];
  if(subs.length === 0) { el.innerHTML = '<div class="muted">No subjects assigned.</div>'; return; }
  subs.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'subject-item';
    row.innerHTML = `<div>${s}</div>
      <div>
        <button onclick="downloadORF('${s.replace(/'/g,"\\'")}')">Download ORF</button>
      </div>`;
    el.appendChild(row);
  });
}

// GRADES
function renderStudentGrades(user){
  const el = document.getElementById('gradesArea');
  if(!el) return;
  el.innerHTML = '';
  const g = user.grades || {};
  const keys = Object.keys(g);
  if(keys.length===0){ el.innerHTML = '<div class="muted">No grades yet.</div>'; return; }
  const tbl = document.createElement('table');
  tbl.innerHTML = '<tr><th>Subject</th><th>Grades</th></tr>';
  keys.forEach(sub=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${sub}</td><td>${g[sub].join(', ')}</td>`;
    tbl.appendChild(tr);
  });
  el.appendChild(tbl);
}

// PAYMENTS
function renderStudentPayments(user){
  const el = document.getElementById('paymentsArea');
  if(!el) return;
  el.innerHTML = '';
  const p = user.payments || [];
  if(p.length===0){ el.innerHTML = '<div class="muted">No outstanding payments.</div>'; return; }
  const tbl = document.createElement('table');
  tbl.innerHTML = '<tr><th>Item</th><th>Amount</th><th>Status</th><th>Action</th></tr>';
  p.forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.item}</td><td>${it.amount||'--'}</td><td>${it.status}</td><td><button onclick="pay('${user.id}','${it.id}')">Pay</button></td>`;
    tbl.appendChild(tr);
  });
  el.appendChild(tbl);
}
function pay(uid,pid){
  const u = DB.users.find(x=>x.id===uid);
  if(!u) return;
  const item = u.payments.find(x=>x.id===pid);
  if(!item) return;
  item.status = 'paid';
  saveDB(DB);
  alert('Payment simulated as complete.');
  renderStudentPayments(u);
}

// EVENTS & ANNOUNCEMENTS
function addEvent(){
  const title = document.getElementById('calTitle').value.trim();
  const date = document.getElementById('calDate').value;
  const uid = localStorage.getItem('icct_last_user') || 'system';
  if(!title || !date) return alert('Fill event title & date');
  const id = 'ev' + Date.now();
  DB.events.push({ id, title, date, by: uid });
  saveDB(DB);
  document.getElementById('calTitle').value=''; document.getElementById('calDate').value='';
  renderEventsList();
}
function renderEventsList(){
  const el = document.getElementById('eventsList') || document.getElementById('eventsListFaculty') || document.getElementById('events');
  if(!el) return;
  el.innerHTML = '';
  DB.events.slice().reverse().forEach(e=>{
    const d = document.createElement('div');
    d.className = 'event-row';
    d.innerHTML = `<strong>${e.title}</strong><div class="muted">${e.date} — by ${e.by}</div>`;
    el.appendChild(d);
  });
}
function viewEvents(){ alert(DB.events.map(e=>`${e.date} — ${e.title}`).join('\n') || 'No events'); }

function renderAnnouncements(){
  const el = document.getElementById('announcementsList') || document.getElementById('announcementsListF') || document.getElementById('announcements');
  if(!el) return;
  el.innerHTML = '';
  DB.announcements.slice().reverse().forEach(a=>{
    const d = document.createElement('div');
    d.className = 'ann';
    d.innerHTML = `<div><strong>${a.title}</strong></div><div class="muted">${ new Date(a.time).toLocaleString()}</div><div>${a.body||''}</div>`;
    el.appendChild(d);
  });
}

// generate ORF
function generateORF(){
  const uid = localStorage.getItem('icct_last_user');
  if(!uid) return alert('Login first');
  const u = DB.users.find(x=>x.id===uid);
  if(!u) return alert('User not found');
  const content = `ICCT OFFICIAL REGISTRATION FORM\nName: ${u.name}\nID: ${u.id}\nCourse: ${u.course||'N/A'}\nCampus: ${u.campus}\nDate: ${new Date().toLocaleString()}\n\n(Subjects: ${ (u.subjects||[]).join(', ') })`;
  const blob = new Blob([content], { type:'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ORF_${u.id}.txt`; document.body.appendChild(a); a.click(); a.remove();
}

// SUGGESTIONS
function sendSuggestion(){
  const txt = document.getElementById('suggestionText').value.trim();
  const uid = localStorage.getItem('icct_last_user') || 'guest';
  if(!txt) return alert('Write suggestion first');
  DB.suggestions.push({ id:'s'+Date.now(), from:uid, text:txt, time:new Date().toISOString() });
  saveDB(DB);
  document.getElementById('suggestionText').value='';
  alert('Suggestion recorded. Thank you.');
}
function viewSuggestions(){ alert(DB.suggestions.map(s=>`${s.time} — ${s.from}: ${s.text}`).join('\n\n') || 'No suggestions'); }

// NOTIFICATIONS
function renderNotificationsCount(){
  const el = document.getElementById('notifCount');
  if(el) el.textContent = DB.announcements.length;
}
function openNotifications(){
  alert(DB.announcements.map(a=>`${a.title} — ${new Date(a.time).toLocaleString()}`).join('\n\n') || 'No notifications');
}
function renderNotificationsCount(){ renderNotificationsCount = ()=>{} } // placeholder to silence duplicate names
renderNotificationsCount = function(){ const el=document.getElementById('notifCount'); if(el) el.textContent = DB.announcements.length; }

// ---------- FACULTY Dashboard ----------
function initFacultyDashboard(){
  const uid = localStorage.getItem('icct_last_user');
  if(!uid){ location.href = 'index.html'; return; }
  const user = DB.users.find(x=>x.id===uid);
  if(!user){ location.href='index.html'; return; }
  document.getElementById('welcomeName').textContent = 'Welcome, ' + user.name;
  renderFolders('faculty');
  renderFacultySubjects(user);
  renderFacultyGradebook(user);
  renderEventsList();
  renderAnnouncements();
  renderNotificationsCount();
}

// FACULTY: subjects
function renderFacultySubjects(user){
  const el = document.getElementById('facultySubjects');
  if(!el) return;
  el.innerHTML = '';
  (user.subjects || []).forEach(s=>{
    const div = document.createElement('div');
    div.className = 'subject-item';
    div.innerHTML = `<div>${s}</div><div><button onclick="viewStudentsInSubject('${s.replace(/'/g,"\\'")}')">View Students</button></div>`;
    el.appendChild(div);
  });
}

// FACULTY: gradebook (editable)
function renderFacultyGradebook(user){
  const el = document.getElementById('facultyGradebook');
  if(!el) return;
  el.innerHTML = '';
  const subs = user.subjects || [];
  if(subs.length===0){ el.innerHTML = '<div class="muted">You have no subjects assigned.</div>'; return; }
  subs.forEach(sub=>{
    const box = document.createElement('div');
    box.className = 'panel';
    box.innerHTML = `<h4>${sub}</h4><div id="gradebox_${sub}"></div>`;
    el.appendChild(box);
    renderGradeboxForSubject(sub);
  });
}
function renderGradeboxForSubject(sub){
  const container = document.getElementById('gradebox_'+sub);
  if(!container) return;
  container.innerHTML = '';
  // find students who have this subject
  const studs = DB.users.filter(u=>u.role==='student' && (u.subjects||[]).includes(sub));
  if(studs.length===0){ container.innerHTML = '<div class="muted">No students enrolled in this subject.</div>'; return; }
  const tbl = document.createElement('table');
  tbl.innerHTML = '<tr><th>Student</th><th>Grades</th><th>Action</th></tr>';
  studs.forEach(s=>{
    const grades = (s.grades && s.grades[sub]) ? s.grades[sub].join(', ') : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.name} (${s.id})</td><td><input id="ginput_${sub}_${s.id}" placeholder="e.g. 85,90" value="${grades}"></td><td><button onclick="saveGrades('${sub}','${s.id}')">Save</button></td>`;
    tbl.appendChild(tr);
  });
  container.appendChild(tbl);
}
function saveGrades(sub, sid){
  const val = document.getElementById(`ginput_${sub}_${sid}`).value.trim();
  const arr = val ? val.split(',').map(x=>Number(x.trim())).filter(n=>!isNaN(n)) : [];
  const stu = DB.users.find(u=>u.id===sid);
  if(!stu) return alert('Student not found');
  stu.grades = stu.grades || {};
  stu.grades[sub] = arr;
  saveDB(DB);
  alert('Grades saved and will reflect to student portal.');
}

// FACULTY view students in subject
function viewStudentsInSubject(sub){
  const studs = DB.users.filter(u=>u.role==='student' && (u.subjects||[]).includes(sub));
  alert(studs.map(s=>`${s.id} — ${s.name}`).join('\n') || 'No students');
}

// FACULTY compose mail
function openComposeModal(){ document.getElementById('composeModal').classList.remove('hidden'); }
function closeCompose(){ document.getElementById('composeModal').classList.add('hidden'); }
function sendMailFromFaculty(){
  const to = document.getElementById('mailTo').value.trim();
  const subj = document.getElementById('mailSubject').value.trim();
  const body = document.getElementById('mailBody').value.trim();
  const uid = localStorage.getItem('icct_last_user') || 'faculty';
  const fileEl = document.getElementById('attachFile');
  const filename = fileEl && fileEl.files && fileEl.files[0] ? fileEl.files[0].name : '';
  if(!to || !subj || !body) return alert('Fill all fields');
  const id = 'm'+Date.now();
  DB.mails.push({ id, from:uid, to, subj, body, file: filename, time:new Date().toISOString() });
  // if to == 'all-students' broadcast announcement
  if(to === 'all-students'){
    DB.announcements.push({ id:'a'+Date.now(), title:subj, body, time:new Date().toISOString() });
    saveDB(DB);
    alert('Mail sent and announcement broadcast to all students (simulated).');
    closeCompose();
    renderAnnouncements();
    renderNotificationsCount();
    return;
  }
  saveDB(DB);
  alert('Mail stored (demo).');
  closeCompose();
}

// Inbox view for faculty (messages sent by students)
function renderInboxForFaculty(){
  const el = document.getElementById('inboxList');
  if(!el) return;
  el.innerHTML = '';
  const mails = DB.mails.filter(m=> m.to === localStorage.getItem('icct_last_user') || m.to === 'faculty@'+DB.users.find(u=>u.id===localStorage.getItem('icct_last_user')).campus);
  if(mails.length===0){ el.innerHTML = '<div class="muted">No messages</div>'; return; }
  mails.slice().reverse().forEach(m=>{
    const d = document.createElement('div');
    d.className = 'event-row';
    d.innerHTML = `<strong>${m.subj}</strong><div class="muted">From: ${m.from} — ${new Date(m.time).toLocaleString()}</div><div>${m.body}</div>`;
    el.appendChild(d);
  });
}

// ---------- ADMIN / CAMPUS / COURSES management (Admin Panel can be integrated) ----------
function addCampus(){
  const v = prompt('New campus name:');
  if(!v) return;
  DB.campuses.push(v);
  saveDB(DB);
  alert('Campus added.');
}
function removeCampus(name){
  DB.campuses = DB.campuses.filter(c=>c!==name);
  DB.users.forEach(u=>{ if(u.campus===name) u.campus = 'Unassigned'; });
  saveDB(DB);
  alert('Campus removed (users set to Unassigned).');
}

// ---------- UTILITIES ----------
function openComposeModal(){ // reuse for student side
  const html = `<div style="padding:12px">Compose (demo): To (id/email/all-students)<br><input id="tmpTo"><br>Subject<br><input id="tmpSub"><br>Message<br><textarea id="tmpBody"></textarea><br><button onclick="sendStudentMail()">Send</button><button onclick="closeGlobalCompose()">Close</button></div>`;
  const div = document.createElement('div'); div.id='globalCompose'; div.className='modal'; div.innerHTML = `<div class="modal-card">${html}</div>`;
  document.body.appendChild(div);
}
function closeGlobalCompose(){ const g = document.getElementById('globalCompose'); if(g) g.remove(); }
function sendStudentMail(){
  const to = document.getElementById('tmpTo').value.trim();
  const subj = document.getElementById('tmpSub').value.trim();
  const body = document.getElementById('tmpBody').value.trim();
  const uid = localStorage.getItem('icct_last_user') || 'guest';
  if(!to||!subj||!body) return alert('Fill fields');
  DB.mails.push({ id:'m'+Date.now(), from:uid, to, subj, body, time:new Date().toISOString() });
  if(to === 'all-students'){ DB.announcements.push({ id:'a'+Date.now(), title:subj, body, time:new Date().toISOString() }); saveDB(DB); }
  saveDB(DB);
  alert('Message sent (simulated)');
  closeGlobalCompose();
  renderAnnouncements();
  renderNotificationsCount();
}

// download ORF per subject
function downloadORF(sub){
  const uid = localStorage.getItem('icct_last_user');
  if(!uid) return alert('Login');
  const u = DB.users.find(x=>x.id===uid);
  if(!u) return alert('User not found');
  const content = `ICCT ORF\nName: ${u.name}\nID: ${u.id}\nCourse: ${u.course || 'N/A'}\nSubject: ${sub}\nCampus: ${u.campus}\nDate: ${new Date().toLocaleString()}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ORF_${u.id}_${sub}.txt`; document.body.appendChild(a); a.click(); a.remove();
}

// small helper to open notifications across pages
function openNotifications(){ alert(DB.announcements.map(a=>`${a.title} — ${new Date(a.time).toLocaleString()}`).join('\n\n') || 'No notifications'); }

// ensure notifications count is updated
function renderNotificationsCount(){ const el = document.getElementById('notifCount'); if(el) el.textContent = DB.announcements.length || 0; }

// expose some functions to window (used in inline onclick)
window.showLoginTab = showLoginTab;
window.showRegisterTab = showRegisterTab;
window.fillDemo = fillDemo;
window.register = register;
window.clearRegister = clearRegister;
window.login = login;
window.cycleTheme = cycleTheme;
window.performLogout = performLogout;
window.openComposeModal = openComposeModal;
window.closeCompose = closeCompose;
window.sendMailFromFaculty = sendMailFromFaculty;
window.addEvent = addEvent;
window.viewEvents = viewEvents;
window.generateORF = generateORF;
window.downloadORF = downloadORF;
window.sendSuggestion = sendSuggestion;
window.viewSuggestions = viewSuggestions;
window.openNotifications = openNotifications;
window.renderEventsList = renderEventsList;
window.renderAnnouncements = renderAnnouncements;
window.pay = pay;
window.sendStudentMail = sendStudentMail;
window.closeGlobalCompose = closeGlobalCompose;
window.addCampus = addCampus;
window.removeCampus = removeCampus;
window.sendMailFromFaculty = sendMailFromFaculty;
window.saveGrades = saveGrades;

// On faculty page load call additional renderers
setTimeout(()=>{
  // optional: if on faculty page, render inbox
  const inbox = document.getElementById('inboxList');
  if(inbox) renderInboxForFaculty();
  // if on faculty gradebook page, ensure render
  const gbook = document.getElementById('facultyGradebook');
  if(gbook){
    const uid = localStorage.getItem('icct_last_user');
    if(uid){
      const user = DB.users.find(u=>u.id===uid);
      if(user) renderFacultyGradebook(user);
    }
  }
}, 500);
