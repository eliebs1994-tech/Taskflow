// ── State ────────────────────────────────────────────────────────────────────
const API = '';
let state = {
  user: null, token: null, lang: 'en',
  tasks: [], departments: [], members: [], timeEntries: [], notifications: [],
  view: 'dashboard', deptFilter: null, taskFilter: 'all', taskSearch: '',
  activeTimer: null, timerInterval: null, sidebarOpen: false,
  activeTaskId: null
};

const i18n = {
  en: {
    dashboard: 'Dashboard', tasks: 'All tasks', time: 'Time tracking',
    reports: 'Reports', members: 'Team members', departments: 'Departments',
    settings: 'Settings', aiStudio: 'AI Studio', login: 'Sign in',
    username: 'Username', password: 'Password', addTask: 'Add task',
    logTime: 'Log time', open: 'Open', done: 'Done', overdue: 'Overdue',
    urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    title: 'Title', description: 'Description', department: 'Department',
    assignee: 'Assignee', priority: 'Priority', dueDate: 'Due date',
    startDate: 'Start date', estimatedHours: 'Estimated hours',
    noTasks: 'No tasks here', addMember: 'Add member', name: 'Full name',
    role: 'Role', admin: 'Admin', manager: 'Manager', member: 'Member',
    email: 'Email', gantt: 'Gantt', list: 'List', totalTasks: 'Total tasks',
    completed: 'Completed', hoursLogged: 'Hours logged', askAI: 'Ask AI',
    aiHelper: 'Ask AI anything about your tasks...',
    notifications: 'Notifications', markAllRead: 'Mark all read',
    profile: 'Profile', apiKey: 'Anthropic API key', logout: 'Sign out',
    searchTasks: 'Search tasks...', addDept: 'Add department',
    deptName: 'Department name', color: 'Color', arabicName: 'Arabic name',
    featureBuilder: 'AI Feature Builder', describeFeature: 'Describe a feature to add...',
    generateFeature: 'Generate', myTasks: 'My tasks', allTasks: 'All tasks',
    startTimer: 'Start timer', stopTimer: 'Stop timer', totalLogged: 'Total logged',
    note: 'Note', duration: 'Duration (minutes)', date: 'Date',
    comment: 'Add a comment...', send: 'Send', comments: 'Comments',
    currentPassword: 'Current password', newPassword: 'New password',
    saveProfile: 'Save profile', deactivate: 'Deactivate',
    taskDetail: 'Task detail', subtasks: 'Subtasks',
  },
  ar: {
    dashboard: 'لوحة التحكم', tasks: 'كل المهام', time: 'تتبع الوقت',
    reports: 'التقارير', members: 'أعضاء الفريق', departments: 'الأقسام',
    settings: 'الإعدادات', aiStudio: 'مختبر الذكاء الاصطناعي', login: 'تسجيل الدخول',
    username: 'اسم المستخدم', password: 'كلمة المرور', addTask: 'إضافة مهمة',
    logTime: 'تسجيل وقت', open: 'مفتوحة', done: 'منجزة', overdue: 'متأخرة',
    urgent: 'عاجل', high: 'عالي', medium: 'متوسط', low: 'منخفض',
    save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
    title: 'العنوان', description: 'الوصف', department: 'القسم',
    assignee: 'المسؤول', priority: 'الأولوية', dueDate: 'تاريخ الاستحقاق',
    startDate: 'تاريخ البدء', estimatedHours: 'الساعات المقدرة',
    noTasks: 'لا توجد مهام', addMember: 'إضافة عضو', name: 'الاسم الكامل',
    role: 'الدور', admin: 'مدير النظام', manager: 'مدير', member: 'عضو',
    email: 'البريد الإلكتروني', gantt: 'جانت', list: 'قائمة',
    totalTasks: 'إجمالي المهام', completed: 'المنجزة', hoursLogged: 'الساعات المسجلة',
    askAI: 'اسأل الذكاء الاصطناعي', aiHelper: 'اسأل عن مهامك...',
    notifications: 'الإشعارات', markAllRead: 'تعليم الكل مقروء',
    profile: 'الملف الشخصي', apiKey: 'مفتاح Anthropic API', logout: 'تسجيل الخروج',
    searchTasks: 'بحث في المهام...', addDept: 'إضافة قسم',
    deptName: 'اسم القسم', color: 'اللون', arabicName: 'الاسم بالعربية',
    featureBuilder: 'منشئ المميزات بالذكاء الاصطناعي', describeFeature: 'صف ميزة لإضافتها...',
    generateFeature: 'توليد', myTasks: 'مهامي', allTasks: 'كل المهام',
    startTimer: 'بدء المؤقت', stopTimer: 'إيقاف المؤقت', totalLogged: 'إجمالي المسجل',
    note: 'ملاحظة', duration: 'المدة (دقائق)', date: 'التاريخ',
    comment: 'أضف تعليقاً...', send: 'إرسال', comments: 'التعليقات',
    currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة',
    saveProfile: 'حفظ الملف', deactivate: 'تعطيل',
    taskDetail: 'تفاصيل المهمة', subtasks: 'المهام الفرعية',
  }
};
const t = (k) => (i18n[state.lang] || i18n.en)[k] || k;

// ── API helpers ───────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(API + '/api' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) { logout(); return null; }
  return res.json().catch(() => ({}));
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const ic = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 21V9h6v12"/><path d="M9 12h6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  gantt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="8" height="3" rx="1"/><rect x="8" y="9" width="10" height="3" rx="1"/><rect x="5" y="14" width="12" height="3" rx="1"/><line x1="3" y1="21" x2="21" y2="21"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
};

function svg(name, size=16) {
  return `<span style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${ic[name]||''}</span>`;
}

// ── Socket.io ─────────────────────────────────────────────────────────────────
let socket;
function connectSocket() {
  socket = io();
  if (state.user) socket.emit('join', state.user.id);
  socket.on('task_created', t => { if (!state.tasks.find(x=>x.id===t.id)) { state.tasks.unshift(t); if(['dashboard','tasks'].includes(state.view)) render(); } });
  socket.on('task_updated', t => { const i=state.tasks.findIndex(x=>x.id===t.id); if(i>=0){state.tasks[i]=t; if(['dashboard','tasks'].includes(state.view)) render(); } });
  socket.on('task_deleted', ({id}) => { state.tasks=state.tasks.filter(t=>t.id!==id); if(['dashboard','tasks'].includes(state.view)) render(); });
  socket.on('new_notification', n => { state.notifications.unshift(n); updateNotifBadge(); });
}

// ── Load data ─────────────────────────────────────────────────────────────────
async function loadAll() {
  const [tasks, depts, members, time, notifs] = await Promise.all([
    api('GET','/tasks'), api('GET','/departments'), api('GET','/users'),
    api('GET','/time'), api('GET','/notifications')
  ]);
  state.tasks = tasks || [];
  state.departments = depts || [];
  state.members = members || [];
  state.timeEntries = time || [];
  state.notifications = notifs || [];
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function doLogin() {
  const u = document.getElementById('l-user')?.value.trim();
  const p = document.getElementById('l-pass')?.value;
  if (!u || !p) return;
  const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u,password:p}) });
  const data = await res.json();
  if (!res.ok) { document.getElementById('l-err').textContent = data.error || 'Login failed'; return; }
  state.token = data.token; state.user = data.user; state.lang = data.user.language || 'en';
  localStorage.setItem('tf_token', state.token);
  document.body.classList.toggle('rtl', state.lang === 'ar');
  await loadAll(); connectSocket(); render();
}

function logout() {
  state.token=null; state.user=null; state.tasks=[]; state.departments=[]; state.members=[];
  localStorage.removeItem('tf_token');
  render();
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  if (!state.user) { app.innerHTML = renderLogin(); return; }
  app.innerHTML = `
    <div id="sidebar" class="${state.sidebarOpen?'open':''}">${renderSidebar()}</div>
    <div id="main">
      <div id="topbar">${renderTopbar()}</div>
      <div id="content">${renderPage()}</div>
    </div>`;
  updateNotifBadge();
}

function renderLogin() {
  return `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg2)">
    <div class="card" style="width:380px;padding:32px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:28px;font-weight:700;color:var(--purple);margin-bottom:4px">TaskFlow</div>
        <div style="font-size:13px;color:var(--text2)">Company task management</div>
      </div>
      <div class="field"><label>${t('username')}</label><input id="l-user" placeholder="${t('username')}" onkeydown="if(event.key==='Enter')doLogin()" /></div>
      <div class="field"><label>${t('password')}</label><input id="l-pass" type="password" placeholder="${t('password')}" onkeydown="if(event.key==='Enter')doLogin()" /></div>
      <div id="l-err" style="color:#A32D2D;font-size:12px;margin-bottom:8px;min-height:16px"></div>
      <button class="btn primary" style="width:100%;justify-content:center;padding:10px" onclick="doLogin()">${t('login')}</button>
    </div>
  </div>`;
}

function renderSidebar() {
  const depts = state.departments;
  return `
    <div class="logo">${svg('sparkle',22)}<span>TaskFlow</span></div>
    <nav>
      <div class="nav-section">Overview</div>
      ${navItem('dashboard', 'home', t('dashboard'))}
      ${navItem('tasks', 'check', t('tasks'))}
      ${navItem('gantt', 'gantt', 'Gantt')}
      ${navItem('time', 'clock', t('time'))}
      ${navItem('reports', 'chart', t('reports'))}
      <div class="nav-section">${t('departments')}</div>
      ${depts.map(d=>`<div class="nav-item ${state.view==='tasks'&&state.deptFilter===d.id?'active':''}" onclick="navDept('${d.id}')">
        <span class="dept-dot" style="background:${d.color}"></span>${state.lang==='ar'&&d.name_ar?d.name_ar:d.name}
        <span class="nav-badge">${state.tasks.filter(t=>t.department_id===d.id&&!t.done).length}</span>
      </div>`).join('')}
      <div class="nav-section">Team</div>
      ${navItem('members', 'users', t('members'))}
      ${navItem('departments', 'building', t('departments'))}
      ${state.user?.role==='admin'?navItem('aiStudio','sparkle',t('aiStudio')):''}
      <div class="nav-section">Account</div>
      ${navItem('settings','settings',t('settings'))}
      <div class="nav-item" onclick="logout()" style="color:var(--text3)">${svg('x')}${t('logout')}</div>
    </nav>`;
}

function navItem(view, icon, label) {
  return `<div class="nav-item ${state.view===view?'active':''}" onclick="nav('${view}')">${svg(icon)}${label}</div>`;
}

function renderTopbar() {
  const unread = state.notifications.filter(n=>!n.is_read).length;
  const titles = { dashboard:t('dashboard'), tasks:t('tasks'), gantt:'Gantt', time:t('time'), reports:t('reports'), members:t('members'), departments:t('departments'), settings:t('settings'), aiStudio:t('aiStudio') };
  const deptName = state.deptFilter ? (state.departments.find(d=>d.id===state.deptFilter)?.name||'') : '';
  const title = state.deptFilter ? deptName+' '+t('tasks') : (titles[state.view]||state.view);
  let actions = '';
  if (state.view==='tasks'||state.view==='dashboard') actions += `<button class="btn primary" onclick="openAddTask()">${svg('plus')}${t('addTask')}</button>`;
  if (state.view==='time') actions += `<button class="btn primary" onclick="openLogTime()">${svg('plus')}${t('logTime')}</button>`;
  if (state.view==='members') actions += `<button class="btn primary" onclick="openAddMember()">${svg('plus')}${t('addMember')}</button>`;
  if (state.view==='departments') actions += `<button class="btn primary" onclick="openAddDept()">${svg('plus')}${t('addDept')}</button>`;
  actions += `<button class="btn ai" onclick="toggleAI()">${svg('sparkle')}${t('askAI')}</button>`;
  actions += `<div style="position:relative"><button class="btn icon" onclick="openNotifs()" aria-label="Notifications">${svg('bell',18)}</button>${unread>0?`<span class="notif-dot" id="notif-dot"></span>`:''}</div>`;
  const u=state.user;
  actions += `<div class="avatar" style="width:30px;height:30px;background:${u.avatar_color};color:${u.avatar_text_color};cursor:pointer;font-size:11px" onclick="nav('settings')">${u.avatar_initials||u.username[0].toUpperCase()}</div>`;
  return `<button class="btn icon" onclick="toggleSidebar()" aria-label="Menu">${svg('menu',18)}</button>
    <span class="page-title">${title}</span>
    <div style="display:flex;align-items:center;gap:8px">${actions}</div>`;
}

function renderPage() {
  const pages = { dashboard:renderDashboard, tasks:renderTasks, gantt:renderGantt, time:renderTime, reports:renderReports, members:renderMembers, departments:renderDepartments, settings:renderSettings, aiStudio:renderAIStudio };
  return (pages[state.view]||renderDashboard)();
}

function renderDashboard() {
  const tasks=state.tasks, done=tasks.filter(t=>t.done).length, total=tasks.length;
  const overdue=tasks.filter(t=>!t.done&&t.due_date&&new Date(t.due_date)<new Date()).length;
  const urgent=tasks.filter(t=>!t.done&&t.priority==='urgent').length;
  const totalMins=state.timeEntries.reduce((a,e)=>a+e.duration_minutes,0);
  const mine=tasks.filter(t=>t.assignee_id===state.user.id&&!t.done).slice(0,5);
  return `
    ${renderAIBar()}
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">${t('totalTasks')}</div><div class="stat-val">${total}</div></div>
      <div class="stat-card"><div class="stat-label">${t('completed')}</div><div class="stat-val">${done}</div><div class="stat-sub">${total?Math.round(done/total*100):0}%</div></div>
      <div class="stat-card"><div class="stat-label">${t('overdue')}</div><div class="stat-val" style="color:${overdue>0?'#A32D2D':'inherit'}">${overdue}</div></div>
      <div class="stat-card"><div class="stat-label">${t('urgent')}</div><div class="stat-val" style="color:${urgent>0?'#854F0B':'inherit'}">${urgent}</div></div>
      <div class="stat-card"><div class="stat-label">${t('hoursLogged')}</div><div class="stat-val">${(totalMins/60).toFixed(1)}h</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div class="section-head"><h3>${t('myTasks')}</h3><button class="btn sm" onclick="nav('tasks')">${t('allTasks')} →</button></div>
        <div class="task-list">${mine.length?mine.map(renderTaskRow).join(''):`<div class="empty">${svg('check',32)}${t('noTasks')}</div>`}</div>
      </div>
      <div>
        <div class="section-head"><h3>${t('departments')}</h3></div>
        ${state.departments.map(d=>{
          const open=tasks.filter(t=>t.department_id===d.id&&!t.done).length;
          const tot=tasks.filter(t=>t.department_id===d.id).length;
          const pct=tot?Math.round((tot-open)/tot*100):0;
          return `<div class="bar-row"><span class="bar-label">${state.lang==='ar'&&d.name_ar?d.name_ar:d.name}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${d.color}"></div></div>
            <span class="bar-val">${open}</span></div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderTasks() {
  let tasks = state.deptFilter ? state.tasks.filter(t=>t.department_id===state.deptFilter) : state.tasks;
  if(state.taskFilter==='open') tasks=tasks.filter(t=>!t.done);
  else if(state.taskFilter==='done') tasks=tasks.filter(t=>t.done);
  else if(state.taskFilter==='overdue') tasks=tasks.filter(t=>!t.done&&t.due_date&&new Date(t.due_date)<new Date());
  else if(state.taskFilter==='urgent') tasks=tasks.filter(t=>!t.done&&t.priority==='urgent');
  else if(state.taskFilter==='mine') tasks=tasks.filter(t=>t.assignee_id===state.user.id);
  if(state.taskSearch) tasks=tasks.filter(t=>t.title.toLowerCase().includes(state.taskSearch.toLowerCase()));
  return `
    ${renderAIBar()}
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <input placeholder="${t('searchTasks')}" value="${state.taskSearch}" oninput="state.taskSearch=this.value;renderContent()" style="max-width:260px" />
    </div>
    <div class="filters">
      ${['all','open','done','overdue','urgent','mine'].map(f=>`<button class="filter-btn ${state.taskFilter===f?'active':''}" onclick="setFilter('${f}')">${t(f)||f}</button>`).join('')}
      <span style="font-size:12px;color:var(--text3);margin-left:auto">${tasks.length} task${tasks.length!==1?'s':''}</span>
    </div>
    <div class="task-list">${tasks.length?tasks.map(renderTaskRow).join(''):`<div class="empty">${svg('check',32)}<br>${t('noTasks')}</div>`}</div>`;
}

function renderTaskRow(task) {
  const isOverdue=!task.done&&task.due_date&&new Date(task.due_date)<new Date();
  const dueStr=task.due_date?fmtDate(task.due_date):'';
  const dept=state.departments.find(d=>d.id===task.department_id);
  return `<div class="task-row ${task.done?'done':''}" onclick="openTaskDetail('${task.id}')">
    <div class="check ${task.done?'checked':''}" onclick="event.stopPropagation();toggleDone('${task.id}')">${svg('check')}</div>
    <div class="task-body">
      <div class="task-title">${task.title}</div>
      <div class="task-meta">
        <span class="badge p-${task.priority}">${t(task.priority)}</span>
        ${dept?`<span class="tag" style="background:${dept.color}22;color:${dept.color}"><span class="dept-dot" style="background:${dept.color}"></span>${state.lang==='ar'&&dept.name_ar?dept.name_ar:dept.name}</span>`:''}
        ${dueStr?`<span class="due-date ${isOverdue?'overdue':''}">${svg('cal',11)} ${dueStr}</span>`:''}
        ${task.comment_count>0?`<span style="font-size:11px;color:var(--text3)">💬 ${task.comment_count}</span>`:''}
      </div>
    </div>
    ${task.avatar_initials?`<div class="avatar" style="width:26px;height:26px;background:${task.avatar_color};color:${task.avatar_text_color}" title="${task.assignee_name||''}">${task.avatar_initials}</div>`:''}
    <div class="task-actions" onclick="event.stopPropagation()">
      <button class="btn icon sm" onclick="openEditTask('${task.id}')" title="${t('edit')}">${svg('edit',14)}</button>
      <button class="btn icon sm" onclick="startTimer('${task.id}')" title="${t('startTimer')}">${svg('play',14)}</button>
      ${['admin','manager'].includes(state.user.role)?`<button class="btn icon sm danger" onclick="deleteTask('${task.id}')" title="${t('delete')}">${svg('trash',14)}</button>`:''}
    </div>
  </div>`;
}

function renderGantt() {
  const tasks=state.tasks.filter(t=>t.start_date&&t.due_date&&!t.done);
  if(!tasks.length) return `<div class="empty">${svg('gantt',40)}<br>No tasks with start &amp; due dates for Gantt view.<br><br><button class="btn primary" onclick="openAddTask()">Add a task</button></div>`;
  const dates=tasks.flatMap(t=>[new Date(t.start_date),new Date(t.due_date)]);
  const minDate=new Date(Math.min(...dates));
  const maxDate=new Date(Math.max(...dates));
  const totalDays=Math.max((maxDate-minDate)/86400000,1);
  const headers=[];
  for(let d=new Date(minDate);d<=maxDate;d.setDate(d.getDate()+7)){
    headers.push(new Date(d).toLocaleDateString('en-GB',{month:'short',day:'numeric'}));
  }
  return `
    <div style="overflow-x:auto">
      <div style="min-width:600px">
        <div class="gantt-row" style="background:var(--bg2);font-weight:500;font-size:11px">
          <div class="gantt-label">Task</div>
          <div class="gantt-track" style="display:flex">${headers.map(h=>`<div style="flex:1;padding:0 4px;color:var(--text3);font-size:10px">${h}</div>`).join('')}</div>
        </div>
        ${tasks.map(task=>{
          const dept=state.departments.find(d=>d.id===task.department_id);
          const color=dept?.color||'#534AB7';
          const start=(new Date(task.start_date)-minDate)/86400000;
          const end=(new Date(task.due_date)-minDate)/86400000;
          const left=Math.round(start/totalDays*100);
          const width=Math.max(Math.round((end-start)/totalDays*100),2);
          return `<div class="gantt-row">
            <div class="gantt-label" title="${task.title}">${task.title}</div>
            <div class="gantt-track">
              <div class="gantt-bar" style="left:${left}%;width:${width}%;background:${color}">${task.title}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderTime() {
  const entries=state.timeEntries;
  const totalMins=entries.reduce((a,e)=>a+e.duration_minutes,0);
  const timerHtml=state.activeTimer?`<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--red-light);border-radius:var(--radius);margin-bottom:14px;border:1px solid #F09595">
    <span style="width:8px;height:8px;background:var(--red);border-radius:50%;animation:spin .8s linear infinite;display:inline-block"></span>
    <span style="font-size:13px">Tracking: <strong>${state.tasks.find(t=>t.id===state.activeTimer.taskId)?.title||'Task'}</strong></span>
    <span id="timer-disp" style="font-weight:600;margin-left:8px"></span>
    <button class="btn sm danger" onclick="stopTimer()" style="margin-left:auto">${svg('stop',14)} ${t('stopTimer')}</button>
  </div>`:'';
  return `${timerHtml}
    <div class="stats-grid" style="margin-bottom:16px">
      <div class="stat-card"><div class="stat-label">${t('totalLogged')}</div><div class="stat-val">${(totalMins/60).toFixed(1)}h</div></div>
      <div class="stat-card"><div class="stat-label">Entries</div><div class="stat-val">${entries.length}</div></div>
      <div class="stat-card"><div class="stat-label">Avg/entry</div><div class="stat-val">${entries.length?Math.round(totalMins/entries.length)+'m':'—'}</div></div>
    </div>
    <div class="card">
      ${entries.length?entries.map(e=>{
        const task=state.tasks.find(t=>t.id===e.task_id);
        const dept=state.departments.find(d=>d.id===task?.department_id);
        const mins=e.duration_minutes;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:13px;font-weight:500">${task?.title||'Deleted task'}</div>
            <div style="font-size:11px;color:var(--text3)">${e.user_name||''} ${dept?'· '+dept.name:''} ${e.note?'· '+e.note:''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:12px;color:var(--text2)">${fmtDate(e.date)}</span>
            <span style="font-weight:500">${mins>=60?Math.floor(mins/60)+'h '+(mins%60?mins%60+'m':''):mins+'m'}</span>
            <button class="btn icon sm danger" onclick="deleteTimeEntry('${e.id}')">${svg('trash',13)}</button>
          </div>
        </div>`;
      }).join(''):`<div class="empty">No time entries yet</div>`}
    </div>`;
}

function renderReports() {
  const tasks=state.tasks, time=state.timeEntries;
  const byDept=state.departments.map(d=>{
    const dt=tasks.filter(t=>t.department_id===d.id);
    const mins=time.filter(e=>tasks.find(t=>t.id===e.task_id&&t.department_id===d.id)).reduce((a,e)=>a+e.duration_minutes,0);
    return {dept:d,total:dt.length,done:dt.filter(t=>t.done).length,mins};
  });
  const maxT=Math.max(...byDept.map(b=>b.total),1), maxM=Math.max(...byDept.map(b=>b.mins),1);
  const byMember=state.members.map(m=>({member:m,total:tasks.filter(t=>t.assignee_id===m.id).length,done:tasks.filter(t=>t.assignee_id===m.id&&t.done).length})).filter(b=>b.total>0);
  const maxMT=Math.max(...byMember.map(b=>b.total),1);
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div class="card"><div style="font-size:13px;font-weight:500;margin-bottom:12px">Tasks by department</div>${byDept.map(b=>`<div class="bar-row"><span class="bar-label">${b.dept.name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(b.total/maxT*100)}%;background:${b.dept.color}"></div></div><span class="bar-val">${b.total}</span></div>`).join('')}</div>
    <div class="card"><div style="font-size:13px;font-weight:500;margin-bottom:12px">Hours by department</div>${byDept.map(b=>`<div class="bar-row"><span class="bar-label">${b.dept.name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(b.mins/maxM*100)}%;background:${b.dept.color}"></div></div><span class="bar-val">${(b.mins/60).toFixed(1)}h</span></div>`).join('')}</div>
    <div class="card"><div style="font-size:13px;font-weight:500;margin-bottom:12px">Completion by department</div>${byDept.map(b=>{const p=b.total?Math.round(b.done/b.total*100):0;return`<div class="bar-row"><span class="bar-label">${b.dept.name}</span><div class="bar-track"><div class="bar-fill" style="width:${p}%;background:#1D9E75"></div></div><span class="bar-val">${p}%</span></div>`;}).join('')}</div>
    <div class="card"><div style="font-size:13px;font-weight:500;margin-bottom:12px">Tasks per member</div>${byMember.map(b=>`<div class="bar-row"><span class="bar-label">${b.member.full_name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(b.total/maxMT*100)}%;background:#534AB7"></div></div><span class="bar-val">${b.total}</span></div>`).join('')}</div>
    <div class="card" style="grid-column:1/-1"><div style="font-size:13px;font-weight:500;margin-bottom:12px">Priority breakdown (open tasks)</div><div style="display:flex;gap:12px;flex-wrap:wrap">${['urgent','high','medium','low'].map(p=>{const bg={urgent:'var(--red-light)',high:'var(--amber-light)',medium:'var(--blue-light)',low:'var(--green-light)'}[p];const tc={urgent:'#A32D2D',high:'#633806',medium:'#0C447C',low:'#27500A'}[p];const cnt=tasks.filter(t=>t.priority===p&&!t.done).length;return`<div style="background:${bg};border-radius:var(--radius);padding:12px 20px;text-align:center"><div style="font-size:22px;font-weight:600;color:${tc}">${cnt}</div><div style="font-size:11px;color:${tc};margin-top:2px">${t(p)}</div></div>`;}).join('')}</div></div>
  </div>`;
}

function renderMembers() {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
    ${state.members.map(m=>{
      const dept=state.departments.find(d=>d.id===m.department_id);
      const open=state.tasks.filter(t=>t.assignee_id===m.id&&!t.done).length;
      return `<div class="card" style="gap:10px;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar" style="width:38px;height:38px;background:${m.avatar_color};color:${m.avatar_text_color};font-size:13px">${m.avatar_initials}</div>
          <div><div style="font-size:14px;font-weight:500">${m.full_name}</div><div style="font-size:11px;color:var(--text3)">${m.role} · ${dept?.name||'—'}</div></div>
        </div>
        <div style="font-size:12px;color:var(--text2)">${open} open task${open!==1?'s':''}</div>
        <div style="display:flex;gap:6px">
          ${state.user.role==='admin'?`<button class="btn sm" onclick="openEditMember('${m.id}')">${svg('edit',13)}</button><button class="btn sm danger" onclick="deactivateMember('${m.id}')">${svg('trash',13)}</button>`:''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderDepartments() {
  return `<div style="display:flex;flex-direction:column;gap:8px">
    ${state.departments.map(d=>{
      const open=state.tasks.filter(t=>t.department_id===d.id&&!t.done).length;
      const total=state.tasks.filter(t=>t.department_id===d.id).length;
      const members=state.members.filter(m=>m.department_id===d.id).length;
      return `<div class="task-row">
        <span class="dept-dot" style="background:${d.color};width:12px;height:12px"></span>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:500">${d.name}${d.name_ar?` / ${d.name_ar}`:''}</div>
          <div style="font-size:12px;color:var(--text3)">${members} members · ${open} open / ${total} total tasks</div>
        </div>
        ${state.user.role==='admin'?`<div class="task-actions" style="opacity:1"><button class="btn sm danger" onclick="deleteDept('${d.id}')">${svg('trash',13)}</button></div>`:''}
      </div>`;
    }).join('')}
  </div>`;
}

function renderSettings() {
  const u=state.user;
  return `<div style="max-width:500px">
    <div class="card" style="margin-bottom:16px">
      <h3 style="margin-bottom:16px">${t('profile')}</h3>
      <div class="field"><label>${t('name')}</label><input id="s-name" value="${u.full_name||''}" /></div>
      <div class="field"><label>${t('email')}</label><input id="s-email" value="${u.email||''}" /></div>
      <div class="field"><label>Language</label>
        <select id="s-lang" onchange="state.lang=this.value;document.body.classList.toggle('rtl',this.value==='ar')">
          <option value="en" ${state.lang==='en'?'selected':''}>English</option>
          <option value="ar" ${state.lang==='ar'?'selected':''}>العربية</option>
        </select>
      </div>
      <div class="field"><label>${t('apiKey')}</label><input id="s-key" type="password" placeholder="sk-ant-..." value="${u.api_key||''}" /></div>
      <div class="field"><label>${t('currentPassword')}</label><input id="s-oldpw" type="password" placeholder="Leave blank to keep" /></div>
      <div class="field"><label>${t('newPassword')}</label><input id="s-newpw" type="password" placeholder="Leave blank to keep" /></div>
      <button class="btn primary" onclick="saveSettings()">${t('saveProfile')}</button>
    </div>
  </div>`;
}

function renderAIStudio() {
  if(state.user?.role!=='admin') return `<div class="empty">Admin only</div>`;
  return `<div style="max-width:700px">
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">${svg('sparkle',18)}<h3 style="margin:0">AI Assistant</h3></div>
      <p style="font-size:13px;color:var(--text2);margin-bottom:12px">Ask anything about your team's tasks, workload, or data.</p>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input id="ai-q" placeholder="e.g. Which department has the most overdue tasks?" style="flex:1" onkeydown="if(event.key==='Enter')askAI('ai-q','ai-resp')" />
        <button class="btn primary" onclick="askAI('ai-q','ai-resp')">${svg('sparkle')} Ask</button>
      </div>
      <div id="ai-resp" style="font-size:13px;color:var(--text2);line-height:1.7;min-height:20px"></div>
    </div>
    <div class="card" style="border:2px solid #E24B4A20;background:#FCEBEB22">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">${svg('sparkle',18)}<h3 style="margin:0">${t('featureBuilder')}</h3><span class="badge" style="background:#FCEBEB;color:#A32D2D;font-size:11px">Admin only</span></div>
      <p style="font-size:13px;color:var(--text2);margin-bottom:12px">Describe a feature you want to add to TaskFlow. Claude will analyze the request and provide implementation guidance with code examples.</p>
      <div class="field"><textarea id="fb-desc" placeholder="${t('describeFeature')}" style="min-height:90px"></textarea></div>
      <div style="display:flex;gap:8px">
        <button class="btn primary" onclick="askFeatureBuilder()">${svg('sparkle')} ${t('generateFeature')}</button>
      </div>
      <div id="fb-resp" style="margin-top:12px;font-size:13px;line-height:1.7;color:var(--text2)"></div>
    </div>
  </div>`;
}

let aiBarVisible=false;
function renderAIBar() {
  if(!aiBarVisible) return '';
  return `<div class="ai-panel" style="margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">${svg('sparkle',16)}<span style="font-size:13px;font-weight:500;color:var(--purple-dark)">${t('askAI')}</span>
      <button class="btn icon sm" onclick="aiBarVisible=false;renderContent()" style="margin-left:auto">${svg('x',14)}</button>
    </div>
    <div style="display:flex;gap:8px">
      <input id="ai-bar-q" placeholder="${t('aiHelper')}" style="flex:1;border-color:var(--purple-mid)" onkeydown="if(event.key==='Enter')askAI('ai-bar-q','ai-bar-resp')" />
      <button class="btn primary" onclick="askAI('ai-bar-q','ai-bar-resp')">${svg('sparkle')} ${t('askAI')}</button>
    </div>
    <div id="ai-bar-resp" style="font-size:13px;color:var(--purple-dark);margin-top:8px;line-height:1.7"></div>
  </div>`;
}

// ── Actions ───────────────────────────────────────────────────────────────────
function nav(view) { state.view=view; state.deptFilter=null; render(); }
function navDept(id) { state.view='tasks'; state.deptFilter=id; render(); }
function setFilter(f) { state.taskFilter=f; renderContent(); }
function toggleSidebar() { state.sidebarOpen=!state.sidebarOpen; document.getElementById('sidebar')?.classList.toggle('open',state.sidebarOpen); }
function toggleAI() { aiBarVisible=!aiBarVisible; renderContent(); }
function renderContent() { const c=document.getElementById('content'); if(c) c.innerHTML=renderPage(); }
function updateNotifBadge() { const dot=document.getElementById('notif-dot'); }

async function toggleDone(id) {
  const task=state.tasks.find(t=>t.id===id);
  if(!task) return;
  const updated=await api('PUT',`/tasks/${id}`,{done:!task.done});
  if(updated) { state.tasks=state.tasks.map(t=>t.id===id?updated:t); renderContent(); }
}

async function deleteTask(id) {
  if(!confirm('Delete this task?')) return;
  await api('DELETE',`/tasks/${id}`);
  state.tasks=state.tasks.filter(t=>t.id!==id);
  renderContent(); renderSidebarDepts();
}

function renderSidebarDepts() {
  const sb=document.getElementById('sidebar');
  if(sb) sb.innerHTML=renderSidebar();
}

async function deleteTimeEntry(id) {
  await api('DELETE',`/time/${id}`);
  state.timeEntries=state.timeEntries.filter(e=>e.id!==id);
  renderContent();
}

async function deactivateMember(id) {
  if(!confirm('Deactivate this member?')) return;
  await api('DELETE',`/users/${id}`);
  state.members=state.members.filter(m=>m.id!==id);
  renderContent();
}

async function deleteDept(id) {
  if(!confirm('Delete this department?')) return;
  await api('DELETE',`/departments/${id}`);
  state.departments=state.departments.filter(d=>d.id!==id);
  render();
}

async function saveSettings() {
  const payload={full_name:document.getElementById('s-name').value, email:document.getElementById('s-email').value, language:document.getElementById('s-lang').value, api_key:document.getElementById('s-key').value};
  const oldpw=document.getElementById('s-oldpw').value;
  const newpw=document.getElementById('s-newpw').value;
  if(newpw) { payload.current_password=oldpw; payload.new_password=newpw; }
  const updated=await api('PUT','/auth/me',payload);
  if(updated?.id) { state.user={...state.user,...updated}; state.lang=updated.language||'en'; document.body.classList.toggle('rtl',state.lang==='ar'); toast('Profile saved'); renderContent(); }
}

// ── Modals ────────────────────────────────────────────────────────────────────
function showModal(html) {
  const bg=document.createElement('div'); bg.className='modal-bg'; bg.id='modal-bg';
  bg.innerHTML=`<div class="modal">${html}</div>`;
  bg.addEventListener('click',e=>{ if(e.target===bg) closeModal(); });
  document.body.appendChild(bg);
}

function closeModal() { document.getElementById('modal-bg')?.remove(); }

function openAddTask() {
  const depts=state.departments.map(d=>`<option value="${d.id}" ${d.id===state.deptFilter?'selected':''}>${d.name}</option>`).join('');
  const members=state.members.map(m=>`<option value="${m.id}">${m.full_name}</option>`).join('');
  showModal(`<h3>${t('addTask')}</h3>
    <div class="field"><label>${t('title')}</label><input id="f-title" placeholder="${t('title')}" /></div>
    <div class="field"><label>${t('description')}</label><textarea id="f-desc" placeholder="${t('description')}"></textarea></div>
    <div class="row">
      <div class="field"><label>${t('department')}</label><select id="f-dept"><option value="">—</option>${depts}</select></div>
      <div class="field"><label>${t('priority')}</label><select id="f-prio"><option value="urgent">${t('urgent')}</option><option value="high">${t('high')}</option><option value="medium" selected>${t('medium')}</option><option value="low">${t('low')}</option></select></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('assignee')}</label><select id="f-assignee"><option value="">—</option>${members}</select></div>
      <div class="field"><label>${t('dueDate')}</label><input type="date" id="f-due" /></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('startDate')}</label><input type="date" id="f-start" /></div>
      <div class="field"><label>${t('estimatedHours')}</label><input type="number" id="f-hrs" min="0" step=".5" value="0" /></div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitAddTask()">${t('addTask')}</button></div>`);
}

async function submitAddTask() {
  const title=document.getElementById('f-title').value.trim();
  if(!title) return;
  const task=await api('POST','/tasks',{title,description:document.getElementById('f-desc').value,department_id:document.getElementById('f-dept').value||null,priority:document.getElementById('f-prio').value,assignee_id:document.getElementById('f-assignee').value||null,due_date:document.getElementById('f-due').value||null,start_date:document.getElementById('f-start').value||null,estimated_hours:parseFloat(document.getElementById('f-hrs').value)||0});
  if(task?.id) { if(!state.tasks.find(t=>t.id===task.id)) state.tasks.unshift(task); closeModal(); renderContent(); renderSidebarDepts(); toast('Task created'); }
}

function openEditTask(id) {
  const task=state.tasks.find(t=>t.id===id);
  if(!task) return;
  const depts=state.departments.map(d=>`<option value="${d.id}" ${d.id===task.department_id?'selected':''}>${d.name}</option>`).join('');
  const members=state.members.map(m=>`<option value="${m.id}" ${m.id===task.assignee_id?'selected':''}>${m.full_name}</option>`).join('');
  showModal(`<h3>${t('edit')} task</h3>
    <div class="field"><label>${t('title')}</label><input id="f-title" value="${task.title}" /></div>
    <div class="field"><label>${t('description')}</label><textarea id="f-desc">${task.description||''}</textarea></div>
    <div class="row">
      <div class="field"><label>${t('department')}</label><select id="f-dept"><option value="">—</option>${depts}</select></div>
      <div class="field"><label>${t('priority')}</label><select id="f-prio"><option value="urgent" ${task.priority==='urgent'?'selected':''}>${t('urgent')}</option><option value="high" ${task.priority==='high'?'selected':''}>${t('high')}</option><option value="medium" ${task.priority==='medium'?'selected':''}>${t('medium')}</option><option value="low" ${task.priority==='low'?'selected':''}>${t('low')}</option></select></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('assignee')}</label><select id="f-assignee"><option value="">—</option>${members}</select></div>
      <div class="field"><label>${t('dueDate')}</label><input type="date" id="f-due" value="${task.due_date||''}" /></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('startDate')}</label><input type="date" id="f-start" value="${task.start_date||''}" /></div>
      <div class="field"><label>${t('estimatedHours')}</label><input type="number" id="f-hrs" value="${task.estimated_hours||0}" step=".5" /></div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitEditTask('${id}')">${t('save')}</button></div>`);
}

async function submitEditTask(id) {
  const updated=await api('PUT',`/tasks/${id}`,{title:document.getElementById('f-title').value.trim(),description:document.getElementById('f-desc').value,department_id:document.getElementById('f-dept').value||null,priority:document.getElementById('f-prio').value,assignee_id:document.getElementById('f-assignee').value||null,due_date:document.getElementById('f-due').value||null,start_date:document.getElementById('f-start').value||null,estimated_hours:parseFloat(document.getElementById('f-hrs').value)||0});
  if(updated?.id) { state.tasks=state.tasks.map(t=>t.id===id?updated:t); closeModal(); renderContent(); toast('Task updated'); }
}

async function openTaskDetail(id) {
  const task=state.tasks.find(t=>t.id===id)||await api('GET',`/tasks/${id}`);
  if(!task) return;
  const comments=await api('GET',`/comments/${id}`)||[];
  const dept=state.departments.find(d=>d.id===task.department_id);
  const member=state.members.find(m=>m.id===task.assignee_id);
  const timeLogs=state.timeEntries.filter(e=>e.task_id===id);
  const totalMins=timeLogs.reduce((a,e)=>a+e.duration_minutes,0);
  showModal(`<div style="max-width:460px">
    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px">
      <div style="flex:1">
        <h3 style="margin-bottom:6px">${task.title}</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <span class="badge p-${task.priority}">${t(task.priority)}</span>
          ${dept?`<span class="tag" style="background:${dept.color}22;color:${dept.color}">${dept.name}</span>`:''}
          ${task.due_date?`<span class="due-date">${svg('cal',11)} ${fmtDate(task.due_date)}</span>`:''}
        </div>
      </div>
      <button class="btn icon" onclick="closeModal()">${svg('x')}</button>
    </div>
    ${task.description?`<p style="font-size:13px;color:var(--text2);margin-bottom:14px">${task.description}</p>`:''}
    <div style="font-size:12px;color:var(--text3);margin-bottom:14px">
      ${member?`Assigned to: <strong>${member.full_name}</strong> &nbsp;`:''}
      Time logged: <strong>${(totalMins/60).toFixed(1)}h</strong>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:500;margin-bottom:8px">${t('comments')} (${comments.length})</div>
      <div style="max-height:180px;overflow-y:auto;margin-bottom:10px">
        ${comments.map(c=>`<div style="margin-bottom:8px;padding:8px;background:var(--bg2);border-radius:var(--radius)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <div class="avatar" style="width:20px;height:20px;background:${c.avatar_color};color:${c.avatar_text_color};font-size:9px">${c.avatar_initials}</div>
            <span style="font-size:12px;font-weight:500">${c.full_name}</span>
            <span style="font-size:11px;color:var(--text3)">${fmtDate(c.created_at)}</span>
          </div>
          <div style="font-size:13px">${c.content}</div>
        </div>`).join('')||`<div style="font-size:12px;color:var(--text3)">No comments yet</div>`}
      </div>
      <div style="display:flex;gap:8px">
        <input id="comment-input" placeholder="${t('comment')}" style="flex:1" onkeydown="if(event.key==='Enter')submitComment('${id}')" />
        <button class="btn primary sm" onclick="submitComment('${id}')">${t('send')}</button>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn sm" onclick="openEditTask('${id}');closeModal()">${svg('edit',13)} ${t('edit')}</button>
      <button class="btn sm" onclick="startTimer('${id}');closeModal()">${svg('play',13)} ${t('startTimer')}</button>
    </div>
  </div>`);
}

async function submitComment(taskId) {
  const input=document.getElementById('comment-input');
  const content=input?.value.trim();
  if(!content) return;
  await api('POST',`/comments/${taskId}`,{content});
  input.value='';
  const tasks=await api('GET','/tasks');
  if(tasks) state.tasks=tasks;
  closeModal(); openTaskDetail(taskId);
}

function openLogTime() {
  const tasks=state.tasks.map(t=>`<option value="${t.id}">${t.title}</option>`).join('');
  showModal(`<h3>${t('logTime')}</h3>
    <div class="field"><label>Task</label><select id="f-task">${tasks}</select></div>
    <div class="row">
      <div class="field"><label>${t('duration')}</label><input type="number" id="f-dur" value="60" min="1" /></div>
      <div class="field"><label>${t('date')}</label><input type="date" id="f-date" value="${new Date().toISOString().slice(0,10)}" /></div>
    </div>
    <div class="field"><label>${t('note')}</label><input id="f-note" /></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitLogTime()">${t('logTime')}</button></div>`);
}

async function submitLogTime() {
  const dur=parseInt(document.getElementById('f-dur').value);
  if(!dur) return;
  const entry=await api('POST','/time',{task_id:document.getElementById('f-task').value,duration_minutes:dur,date:document.getElementById('f-date').value,note:document.getElementById('f-note').value});
  if(entry?.id) { state.timeEntries.unshift(entry); closeModal(); renderContent(); toast('Time logged'); }
}

function openAddMember() {
  const depts=state.departments.map(d=>`<option value="${d.id}">${d.name}</option>`).join('');
  showModal(`<h3>${t('addMember')}</h3>
    <div class="row">
      <div class="field"><label>${t('name')}</label><input id="f-name" /></div>
      <div class="field"><label>${t('username')}</label><input id="f-uname" /></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('email')}</label><input id="f-email" type="email" /></div>
      <div class="field"><label>${t('password')}</label><input id="f-pw" type="password" /></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('role')}</label><select id="f-role"><option value="admin">${t('admin')}</option><option value="manager">${t('manager')}</option><option value="member" selected>${t('member')}</option></select></div>
      <div class="field"><label>${t('department')}</label><select id="f-dept"><option value="">—</option>${depts}</select></div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitAddMember()">${t('addMember')}</button></div>`);
}

async function submitAddMember() {
  const res=await api('POST','/auth/register',{username:document.getElementById('f-uname').value.trim(),email:document.getElementById('f-email').value.trim(),password:document.getElementById('f-pw').value,full_name:document.getElementById('f-name').value.trim(),role:document.getElementById('f-role').value,department_id:document.getElementById('f-dept').value||null});
  if(res?.id) { const members=await api('GET','/users'); if(members) state.members=members; closeModal(); renderContent(); toast('Member added'); }
  else if(res?.error) toast(res.error);
}

function openEditMember(id) {
  const m=state.members.find(m=>m.id===id);
  if(!m) return;
  const depts=state.departments.map(d=>`<option value="${d.id}" ${d.id===m.department_id?'selected':''}>${d.name}</option>`).join('');
  showModal(`<h3>Edit member</h3>
    <div class="field"><label>${t('name')}</label><input id="f-name" value="${m.full_name}" /></div>
    <div class="row">
      <div class="field"><label>${t('role')}</label><select id="f-role"><option value="admin" ${m.role==='admin'?'selected':''}>${t('admin')}</option><option value="manager" ${m.role==='manager'?'selected':''}>${t('manager')}</option><option value="member" ${m.role==='member'?'selected':''}>${t('member')}</option></select></div>
      <div class="field"><label>${t('department')}</label><select id="f-dept"><option value="">—</option>${depts}</select></div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitEditMember('${id}')">${t('save')}</button></div>`);
}

async function submitEditMember(id) {
  await api('PUT',`/users/${id}`,{full_name:document.getElementById('f-name').value.trim(),role:document.getElementById('f-role').value,department_id:document.getElementById('f-dept').value||null});
  const members=await api('GET','/users'); if(members) state.members=members;
  closeModal(); renderContent(); toast('Member updated');
}

function openAddDept() {
  showModal(`<h3>${t('addDept')}</h3>
    <div class="row">
      <div class="field"><label>${t('deptName')}</label><input id="f-name" /></div>
      <div class="field"><label>${t('arabicName')}</label><input id="f-name-ar" /></div>
    </div>
    <div class="field"><label>${t('color')}</label><input type="color" id="f-color" value="#534AB7" style="height:38px;padding:2px 4px" /></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitAddDept()">${t('addDept')}</button></div>`);
}

async function submitAddDept() {
  const name=document.getElementById('f-name').value.trim();
  if(!name) return;
  const dept=await api('POST','/departments',{name,name_ar:document.getElementById('f-name-ar').value||null,color:document.getElementById('f-color').value});
  if(dept?.id) { state.departments.push(dept); closeModal(); render(); toast('Department added'); }
}

function openNotifs() {
  const notifs=state.notifications.slice(0,20);
  showModal(`<div style="max-width:400px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <h3 style="margin:0">${t('notifications')}</h3>
      <button class="btn sm" onclick="markAllRead()">${t('markAllRead')}</button>
    </div>
    ${notifs.length?notifs.map(n=>`<div class="notif-item ${!n.is_read?'unread':''}" onclick="markRead('${n.id}')">
      <div style="font-size:13px;font-weight:${n.is_read?'400':'500'}">${state.lang==='ar'&&n.title_ar?n.title_ar:n.title}</div>
      <div style="font-size:12px;color:var(--text3)">${state.lang==='ar'&&n.message_ar?n.message_ar:n.message||''}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:2px">${fmtDate(n.created_at)}</div>
    </div>`).join(''):`<div class="empty">No notifications</div>`}
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button></div>
  </div>`);
}

async function markAllRead() {
  await api('PUT','/notifications/read-all');
  state.notifications=state.notifications.map(n=>({...n,is_read:1}));
  closeModal(); updateNotifBadge();
}

async function markRead(id) {
  await api('PUT',`/notifications/${id}/read`);
  state.notifications=state.notifications.map(n=>n.id===id?{...n,is_read:1}:n);
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(taskId) {
  if(state.activeTimer) stopTimer();
  state.activeTimer={taskId,start:Date.now()};
  state.timerInterval=setInterval(()=>{
    const el=document.getElementById('timer-disp');
    if(el){const s=Math.floor((Date.now()-state.activeTimer.start)/1000);el.textContent=`${Math.floor(s/60)}m ${s%60}s`;}
  },1000);
  nav('time');
}

async function stopTimer() {
  if(!state.activeTimer) return;
  clearInterval(state.timerInterval);
  const mins=Math.max(1,Math.round((Date.now()-state.activeTimer.start)/60000));
  const entry=await api('POST','/time',{task_id:state.activeTimer.taskId,duration_minutes:mins,date:new Date().toISOString().slice(0,10),note:'Timer'});
  if(entry?.id) state.timeEntries.unshift(entry);
  state.activeTimer=null; state.timerInterval=null;
  renderContent(); toast(`Logged ${mins} minutes`);
}

// ── AI ────────────────────────────────────────────────────────────────────────
async function askAI(inputId, respId) {
  const input=document.getElementById(inputId);
  const resp=document.getElementById(respId);
  const q=input?.value.trim();
  if(!q||!resp) return;
  const key=state.user?.api_key;
  if(!key) { resp.innerHTML='<span style="color:#A32D2D">Please add your Anthropic API key in Settings first.</span>'; return; }
  resp.innerHTML='<div class="spinner"></div>';
  const context=buildAIContext();
  try {
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`You are an AI assistant for TaskFlow, a company task management app.\n\n${context}\n\nUser question: ${q}`}]})});
    const d=await r.json();
    if(d.error) { resp.innerHTML=`<span style="color:#A32D2D">${d.error.message}</span>`; return; }
    resp.innerHTML=`<div style="white-space:pre-wrap">${d.content[0].text}</div>`;
  } catch(e) { resp.innerHTML='<span style="color:#A32D2D">Request failed. Check your API key.</span>'; }
}

async function askFeatureBuilder() {
  const desc=document.getElementById('fb-desc')?.value.trim();
  const resp=document.getElementById('fb-resp');
  if(!desc||!resp) return;
  const key=state.user?.api_key;
  if(!key) { resp.innerHTML='<span style="color:#A32D2D">Please add your Anthropic API key in Settings first.</span>'; return; }
  resp.innerHTML='<div class="spinner"></div>';
  try {
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2000,messages:[{role:'user',content:`You are a senior full-stack developer helping an admin extend TaskFlow, a Node.js + SQLite + vanilla JS task management app.\n\nCurrent stack: Express.js backend, better-sqlite3, socket.io for real-time, vanilla JS frontend SPA, REST API.\n\nFeature request: ${desc}\n\nProvide:\n1. What files to create or modify\n2. Key code snippets (backend route + frontend function)\n3. Any database schema changes needed\n4. How to integrate it into the existing nav/UI\n\nBe specific and practical.`}]})});
    const d=await r.json();
    if(d.error) { resp.innerHTML=`<span style="color:#A32D2D">${d.error.message}</span>`; return; }
    resp.innerHTML=`<pre style="white-space:pre-wrap;font-size:12px;background:var(--bg2);padding:12px;border-radius:var(--radius);overflow-x:auto">${d.content[0].text}</pre>`;
  } catch(e) { resp.innerHTML='<span style="color:#A32D2D">Request failed.</span>'; }
}

function buildAIContext() {
  const total=state.tasks.length, done=state.tasks.filter(t=>t.done).length;
  const overdue=state.tasks.filter(t=>!t.done&&t.due_date&&new Date(t.due_date)<new Date()).length;
  const totalMins=state.timeEntries.reduce((a,e)=>a+e.duration_minutes,0);
  return `Company data summary:
- Departments: ${state.departments.map(d=>d.name).join(', ')}
- Total tasks: ${total} (${done} done, ${overdue} overdue)
- Team members: ${state.members.length}
- Hours logged: ${(totalMins/60).toFixed(1)}h
- Tasks: ${state.tasks.slice(0,20).map(t=>`"${t.title}" [${t.priority}, ${t.done?'done':'open'}, dept:${t.dept_name||t.department_id}, due:${t.due_date||'none'}]`).join('; ')}`;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if(!str) return '';
  return new Date(str).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'});
}

document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  const saved=localStorage.getItem('tf_token');
  if(saved) {
    state.token=saved;
    const me=await api('GET','/auth/me');
    if(me?.id) {
      state.user=me; state.lang=me.language||'en';
      document.body.classList.toggle('rtl',state.lang==='ar');
      await loadAll(); connectSocket();
    } else { state.token=null; localStorage.removeItem('tf_token'); }
  }
  render();
})();
