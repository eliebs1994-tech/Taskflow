// ── State ─────────────────────────────────────────────────────────────────────
const API = '';
let state = {
  user: null, token: null, lang: 'en',
  tasks: [], departments: [], members: [], timeEntries: [], notifications: [],
  statuses: [], tags: [], customFields: [],
  view: 'dashboard', viewMode: 'list',
  deptFilter: null, taskFilter: 'all', taskSearch: '',
  activeTimer: null, timerInterval: null, sidebarOpen: false,
  panelTaskId: null, panelTab: 'activity',
  panelChecklists: [], panelActivity: [], panelAttachments: [], panelCustom: { fields: [], values: [] },
  recording: false, mediaRecorder: null, audioChunks: [],
};

const i18n = {
  en: {
    dashboard:'Dashboard',tasks:'All tasks',time:'Time tracking',reports:'Reports',
    members:'Team members',departments:'Departments',settings:'Settings',login:'Sign in',
    username:'Username',password:'Password',addTask:'Add task',logTime:'Log time',
    open:'Open',done:'Done',overdue:'Overdue',urgent:'Urgent',high:'High',medium:'Medium',low:'Low',
    save:'Save',cancel:'Cancel',delete:'Delete',edit:'Edit',title:'Title',description:'Description',
    department:'Department',assignee:'Assignee',priority:'Priority',dueDate:'Due date',
    startDate:'Start date',estimatedHours:'Est. hours',noTasks:'No tasks',addMember:'Add member',
    name:'Full name',role:'Role',admin:'Admin',manager:'Manager',member:'Member',email:'Email',
    gantt:'Gantt',list:'List',board:'Board',totalTasks:'Total tasks',completed:'Completed',
    hoursLogged:'Hours logged',notifications:'Notifications',markAllRead:'Mark all read',
    profile:'Profile',logout:'Sign out',searchTasks:'Search tasks...',addDept:'Add department',
    deptName:'Department name',color:'Color',arabicName:'Arabic name',
    myTasks:'My tasks',allTasks:'All tasks',startTimer:'Start timer',stopTimer:'Stop timer',
    totalLogged:'Total logged',note:'Note',duration:'Duration (min)',date:'Date',
    comment:'Write a comment...',send:'Send',comments:'Comments',
    currentPassword:'Current password',newPassword:'New password',saveProfile:'Save profile',
    taskDetail:'Task detail',subtasks:'Subtasks',watchers:'Watchers',tags:'Tags',
    checklists:'Checklists',attachments:'Attachments',activity:'Activity',
    customFields:'Custom fields',addChecklist:'Add checklist',addField:'Add field',
    statuses:'Statuses',addStatus:'Add status',addTag:'Add tag',
  },
  ar: {
    dashboard:'لوحة التحكم',tasks:'كل المهام',time:'تتبع الوقت',reports:'التقارير',
    members:'أعضاء الفريق',departments:'الأقسام',settings:'الإعدادات',login:'تسجيل الدخول',
    username:'اسم المستخدم',password:'كلمة المرور',addTask:'إضافة مهمة',logTime:'تسجيل وقت',
    open:'مفتوحة',done:'منجزة',overdue:'متأخرة',urgent:'عاجل',high:'عالي',medium:'متوسط',low:'منخفض',
    save:'حفظ',cancel:'إلغاء',delete:'حذف',edit:'تعديل',title:'العنوان',description:'الوصف',
    department:'القسم',assignee:'المسؤول',priority:'الأولوية',dueDate:'تاريخ الاستحقاق',
    startDate:'تاريخ البدء',estimatedHours:'الساعات المقدرة',noTasks:'لا توجد مهام',
    addMember:'إضافة عضو',name:'الاسم الكامل',role:'الدور',admin:'مدير النظام',manager:'مدير',member:'عضو',
    email:'البريد الإلكتروني',gantt:'جانت',list:'قائمة',board:'لوحة',
    totalTasks:'إجمالي المهام',completed:'المنجزة',hoursLogged:'الساعات المسجلة',
    notifications:'الإشعارات',markAllRead:'تعليم الكل مقروء',profile:'الملف الشخصي',
    logout:'تسجيل الخروج',searchTasks:'بحث...',addDept:'إضافة قسم',deptName:'اسم القسم',
    color:'اللون',arabicName:'الاسم بالعربية',myTasks:'مهامي',allTasks:'كل المهام',
    startTimer:'بدء المؤقت',stopTimer:'إيقاف المؤقت',totalLogged:'إجمالي المسجل',
    note:'ملاحظة',duration:'المدة (دقائق)',date:'التاريخ',comment:'أضف تعليقاً...',
    send:'إرسال',comments:'التعليقات',currentPassword:'كلمة المرور الحالية',
    newPassword:'كلمة المرور الجديدة',saveProfile:'حفظ الملف',taskDetail:'تفاصيل المهمة',
    subtasks:'المهام الفرعية',watchers:'المراقبون',tags:'الوسوم',checklists:'قوائم التحقق',
    attachments:'المرفقات',activity:'النشاط',customFields:'الحقول المخصصة',
    addChecklist:'إضافة قائمة',addField:'إضافة حقل',statuses:'الحالات',addStatus:'إضافة حالة',addTag:'إضافة وسم',
  }
};
const t = k => (i18n[state.lang] || i18n.en)[k] || k;

// ── API ───────────────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(API + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { logout(); return null; }
  return res.json().catch(() => ({}));
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const ic = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>',
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>',
  building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 21V9h6v12"/><path d="M9 12h6"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  stop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  gantt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="8" height="3" rx="1"/><rect x="8" y="9" width="10" height="3" rx="1"/><rect x="5" y="14" width="12" height="3" rx="1"/><line x1="3" y1="21" x2="21" y2="21"/></svg>',
  board:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="11" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>',
  paperclip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  tag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
};
const svg = (name, size = 14) => `<span style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${ic[name] || ''}</span>`;

// ── Socket ─────────────────────────────────────────────────────────────────────
let socket;
function connectSocket() {
  socket = io();
  if (state.user) socket.emit('join', state.user.id);
  socket.on('task_created', t => { if (!state.tasks.find(x => x.id === t.id)) { state.tasks.unshift(t); renderContent(); } });
  socket.on('task_updated', t => { const i = state.tasks.findIndex(x => x.id === t.id); if (i >= 0) { state.tasks[i] = t; renderContent(); } });
  socket.on('task_deleted', ({ id }) => { state.tasks = state.tasks.filter(t => t.id !== id); renderContent(); });
  socket.on('new_notification', n => { state.notifications.unshift(n); updateNotifBadge(); });
}

// ── Load data ─────────────────────────────────────────────────────────────────
async function loadAll() {
  const [tasks, depts, members, time, notifs, statuses, tags, customFields] = await Promise.all([
    api('GET', '/tasks'), api('GET', '/departments'), api('GET', '/users'),
    api('GET', '/time'), api('GET', '/notifications'),
    api('GET', '/statuses'), api('GET', '/tags'), api('GET', '/customfields'),
  ]);
  state.tasks = tasks || [];
  state.departments = depts || [];
  state.members = members || [];
  state.timeEntries = time || [];
  state.notifications = notifs || [];
  state.statuses = statuses || [];
  state.tags = tags || [];
  state.customFields = customFields || [];
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function doLogin() {
  const u = document.getElementById('l-user')?.value.trim();
  const p = document.getElementById('l-pass')?.value;
  if (!u || !p) return;
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
  const data = await res.json();
  if (!res.ok) { document.getElementById('l-err').textContent = data.error || 'Login failed'; return; }
  state.token = data.token; state.user = data.user; state.lang = data.user.language || 'en';
  localStorage.setItem('tf_token', state.token);
  document.body.classList.toggle('rtl', state.lang === 'ar');
  await loadAll(); connectSocket(); render();
}

function logout() {
  state.token = null; state.user = null; state.tasks = []; state.departments = []; state.members = [];
  localStorage.removeItem('tf_token');
  render();
}

// ── Render shell ──────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  if (!state.user) { app.innerHTML = renderLogin(); return; }
  app.innerHTML = `
    <div id="sidebar" class="${state.sidebarOpen ? 'open' : ''}">${renderSidebar()}</div>
    <div id="main">
      <div id="topbar">${renderTopbar()}</div>
      <div id="content">${renderPage()}</div>
    </div>`;
  updateNotifBadge();
}

function renderLogin() {
  return `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F0EEFF">
    <div class="card" style="width:360px;padding:32px;box-shadow:0 8px 32px rgba(123,104,238,.18)">
      <div style="text-align:center;margin-bottom:28px">
        <div style="width:44px;height:44px;background:#7B68EE;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">${svg('check', 22)}</div>
        <div style="font-size:22px;font-weight:800;color:#1a1a1a;margin-bottom:4px">TaskFlow</div>
        <div style="font-size:12px;color:#6b6b6b">Company task management</div>
      </div>
      <div class="field"><label>${t('username')}</label><input id="l-user" placeholder="${t('username')}" onkeydown="if(event.key==='Enter')doLogin()" /></div>
      <div class="field"><label>${t('password')}</label><input id="l-pass" type="password" placeholder="${t('password')}" onkeydown="if(event.key==='Enter')doLogin()" /></div>
      <div id="l-err" style="color:#A32D2D;font-size:11px;margin-bottom:8px;min-height:14px"></div>
      <button class="btn primary" style="width:100%;justify-content:center;padding:10px;font-size:13px" onclick="doLogin()">${t('login')}</button>
    </div>
  </div>`;
}

function renderSidebar() {
  const depts = state.departments;
  return `
    <div class="logo">${svg('check', 20)}<span>TaskFlow</span></div>
    <nav>
      <div class="nav-section">Overview</div>
      ${navItem('dashboard', 'home', t('dashboard'))}
      ${navItem('tasks', 'list', t('tasks'))}
      ${navItem('gantt', 'gantt', 'Gantt')}
      ${navItem('time', 'clock', t('time'))}
      ${navItem('reports', 'chart', t('reports'))}
      <div class="nav-section">${t('departments')}</div>
      ${depts.map(d => `<div class="nav-item ${state.view === 'tasks' && state.deptFilter === d.id ? 'active' : ''}" onclick="navDept('${d.id}')">
        <span class="dept-dot" style="background:${d.color}"></span>${state.lang === 'ar' && d.name_ar ? d.name_ar : d.name}
        <span class="nav-badge">${state.tasks.filter(t => t.department_id === d.id && !t.done).length}</span>
      </div>`).join('')}
      <div class="nav-section">Team</div>
      ${navItem('members', 'users', t('members'))}
      ${navItem('departments', 'building', t('departments'))}
      <div class="nav-section">Account</div>
      ${navItem('settings', 'settings', t('settings'))}
      <div class="nav-item" onclick="logout()" style="color:#888">${svg('x')}${t('logout')}</div>
    </nav>`;
}

function navItem(view, icon, label) {
  return `<div class="nav-item ${state.view === view ? 'active' : ''}" onclick="nav('${view}')">${svg(icon)}${label}</div>`;
}

function renderTopbar() {
  const unread = state.notifications.filter(n => !n.is_read).length;
  const titles = { dashboard: t('dashboard'), tasks: t('tasks'), gantt: 'Gantt', time: t('time'), reports: t('reports'), members: t('members'), departments: t('departments'), settings: t('settings') };
  const deptName = state.deptFilter ? (state.departments.find(d => d.id === state.deptFilter)?.name || '') : '';
  const title = state.deptFilter ? deptName + ' ' + t('tasks') : (titles[state.view] || state.view);
  let actions = '';
  const showViewToggle = ['tasks', 'dashboard'].includes(state.view) || state.deptFilter;
  if (showViewToggle) {
    actions += `<button class="view-btn ${state.viewMode === 'list' ? 'active' : ''}" onclick="setViewMode('list')">${svg('list', 13)} List</button>`;
    actions += `<button class="view-btn ${state.viewMode === 'board' ? 'active' : ''}" onclick="setViewMode('board')">${svg('board', 13)} Board</button>`;
    actions += `<div style="width:1px;height:20px;background:var(--border2)"></div>`;
  }
  if (['tasks', 'dashboard'].includes(state.view) || state.deptFilter) actions += `<button class="btn primary" onclick="openAddTask()">${svg('plus', 13)}${t('addTask')}</button>`;
  if (state.view === 'time') actions += `<button class="btn primary" onclick="openLogTime()">${svg('plus', 13)}${t('logTime')}</button>`;
  if (state.view === 'members') actions += `<button class="btn primary" onclick="openAddMember()">${svg('plus', 13)}${t('addMember')}</button>`;
  if (state.view === 'departments') actions += `<button class="btn primary" onclick="openAddDept()">${svg('plus', 13)}${t('addDept')}</button>`;
  actions += `<div style="position:relative"><button class="btn icon" onclick="openNotifs()">${svg('bell', 16)}</button>${unread > 0 ? `<span class="notif-dot" id="notif-dot"></span>` : ''}</div>`;
  const u = state.user;
  actions += `<div class="avatar" style="width:28px;height:28px;background:${u.avatar_color};color:${u.avatar_text_color};cursor:pointer;font-size:10px" onclick="nav('settings')">${u.avatar_initials || u.username[0].toUpperCase()}</div>`;
  return `<button class="btn icon" onclick="toggleSidebar()">${svg('menu', 16)}</button>
    <span class="page-title">${title}</span>
    <div style="display:flex;align-items:center;gap:7px;margin-left:auto">${actions}</div>`;
}

function renderPage() {
  const pages = { dashboard: renderDashboard, tasks: renderTasks, gantt: renderGantt, time: renderTime, reports: renderReports, members: renderMembers, departments: renderDepartments, settings: renderSettings };
  return (pages[state.view] || renderDashboard)();
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const tasks = state.tasks, done = tasks.filter(t => t.done).length, total = tasks.length;
  const overdue = tasks.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date()).length;
  const urgent = tasks.filter(t => !t.done && t.priority === 'urgent').length;
  const totalMins = state.timeEntries.reduce((a, e) => a + e.duration_minutes, 0);
  const mine = tasks.filter(t => t.assignee_id === state.user.id && !t.done).slice(0, 6);
  if (state.viewMode === 'board') return renderBoard();
  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">${t('totalTasks')}</div><div class="stat-val">${total}</div></div>
      <div class="stat-card"><div class="stat-label">${t('completed')}</div><div class="stat-val">${done}</div><div class="stat-sub">${total ? Math.round(done / total * 100) : 0}%</div></div>
      <div class="stat-card"><div class="stat-label">${t('overdue')}</div><div class="stat-val" style="color:${overdue > 0 ? '#A32D2D' : 'inherit'}">${overdue}</div></div>
      <div class="stat-card"><div class="stat-label">${t('urgent')}</div><div class="stat-val" style="color:${urgent > 0 ? '#92400E' : 'inherit'}">${urgent}</div></div>
      <div class="stat-card"><div class="stat-label">${t('hoursLogged')}</div><div class="stat-val">${(totalMins / 60).toFixed(1)}h</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div>
        <div class="section-head"><h3>${t('myTasks')}</h3><button class="btn sm ghost" onclick="nav('tasks')">${t('allTasks')} →</button></div>
        <div class="task-list">${mine.length ? mine.map(renderTaskRow).join('') : `<div class="empty">${svg('check', 28)}<br>${t('noTasks')}</div>`}</div>
      </div>
      <div>
        <div class="section-head"><h3>${t('departments')}</h3></div>
        ${state.departments.map(d => {
          const open = tasks.filter(t => t.department_id === d.id && !t.done).length;
          const tot = tasks.filter(t => t.department_id === d.id).length;
          const pct = tot ? Math.round((tot - open) / tot * 100) : 0;
          return `<div class="bar-row"><span class="bar-label">${d.name}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${d.color}"></div></div>
            <span class="bar-val">${open}</span></div>`;
        }).join('')}
      </div>
    </div>`;
}

// ── Tasks list ────────────────────────────────────────────────────────────────
function renderTasks() {
  if (state.viewMode === 'board') return renderBoard();
  let tasks = state.deptFilter ? state.tasks.filter(t => t.department_id === state.deptFilter) : state.tasks;
  if (state.taskFilter === 'open') tasks = tasks.filter(t => !t.done);
  else if (state.taskFilter === 'done') tasks = tasks.filter(t => t.done);
  else if (state.taskFilter === 'overdue') tasks = tasks.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date());
  else if (state.taskFilter === 'urgent') tasks = tasks.filter(t => !t.done && t.priority === 'urgent');
  else if (state.taskFilter === 'mine') tasks = tasks.filter(t => t.assignee_id === state.user.id);
  if (state.taskSearch) tasks = tasks.filter(t => t.title.toLowerCase().includes(state.taskSearch.toLowerCase()));
  return `
    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">
      <input placeholder="${t('searchTasks')}" value="${state.taskSearch}" oninput="state.taskSearch=this.value;renderContent()" style="max-width:240px" />
      <span style="font-size:11px;color:var(--text3);margin-left:auto">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="filters">
      ${['all', 'open', 'done', 'overdue', 'urgent', 'mine'].map(f => `<button class="filter-btn ${state.taskFilter === f ? 'active' : ''}" onclick="setFilter('${f}')">${t(f) || f}</button>`).join('')}
      ${state.statuses.map(s => `<button class="filter-btn ${state.taskFilter === s.id ? 'active' : ''}" onclick="setFilter('${s.id}')" style="${state.taskFilter === s.id ? `background:${s.color}22;border-color:${s.color};color:${s.color}` : ''}">${s.name}</button>`).join('')}
    </div>
    <div class="task-list">${tasks.length ? tasks.map(renderTaskRow).join('') : `<div class="empty">${svg('check', 28)}<br>${t('noTasks')}</div>`}</div>`;
}

function renderTaskRow(task) {
  const isOverdue = !task.done && task.due_date && new Date(task.due_date) < new Date();
  const dept = state.departments.find(d => d.id === task.department_id);
  const status = state.statuses.find(s => s.id === task.status_id);
  const tagPills = (task.tags || []).slice(0, 3).map(tg => `<span class="tag-pill" style="background:${tg.color}22;color:${tg.color}">${tg.name}</span>`).join('');
  return `<div class="task-row ${task.done ? 'done' : ''}" onclick="openPanel('${task.id}')">
    <div class="check ${task.done ? 'checked' : ''}" onclick="event.stopPropagation();toggleDone('${task.id}')">${svg('check', 9)}</div>
    <div class="task-body">
      <div class="task-title">${task.title}</div>
      <div class="task-meta">
        ${status ? `<span class="status-badge" style="background:${status.color}">${status.name}</span>` : ''}
        <span class="badge p-${task.priority}">${t(task.priority)}</span>
        ${dept ? `<span style="font-size:10px;color:${dept.color};font-weight:600"><span class="dept-dot" style="background:${dept.color};display:inline-block;margin-right:2px"></span>${dept.name}</span>` : ''}
        ${task.due_date ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">${svg('cal', 10)} ${fmtDate(task.due_date)}</span>` : ''}
        ${tagPills}
        ${task.comment_count > 0 ? `<span style="font-size:10px;color:var(--text3)">💬 ${task.comment_count}</span>` : ''}
      </div>
    </div>
    ${task.avatar_initials ? `<div class="avatar" style="width:24px;height:24px;background:${task.avatar_color};color:${task.avatar_text_color};font-size:9px" title="${task.assignee_name || ''}">${task.avatar_initials}</div>` : ''}
    <div class="task-actions" onclick="event.stopPropagation()">
      <button class="btn icon sm" onclick="openPanel('${task.id}')" title="Open">${svg('edit', 12)}</button>
      <button class="btn icon sm" onclick="startTimer('${task.id}')" title="${t('startTimer')}">${svg('play', 12)}</button>
      ${['admin', 'manager'].includes(state.user.role) ? `<button class="btn icon sm danger" onclick="deleteTask('${task.id}')">${svg('trash', 12)}</button>` : ''}
    </div>
  </div>`;
}

// ── Board ─────────────────────────────────────────────────────────────────────
function renderBoard() {
  let tasks = state.deptFilter ? state.tasks.filter(t => t.department_id === state.deptFilter) : state.tasks;
  if (state.taskSearch) tasks = tasks.filter(t => t.title.toLowerCase().includes(state.taskSearch.toLowerCase()));
  return `
    ${state.view === 'tasks' || state.deptFilter ? `<div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
      <input placeholder="${t('searchTasks')}" value="${state.taskSearch}" oninput="state.taskSearch=this.value;renderContent()" style="max-width:220px" />
    </div>` : ''}
    <div class="board">
      ${state.statuses.map(status => {
        const colTasks = tasks.filter(t => t.status_id === status.id);
        return `<div class="board-col">
          <div class="board-col-header" style="background:${status.color}18">
            <span style="width:9px;height:9px;border-radius:50%;background:${status.color};display:inline-block"></span>
            <span class="board-col-name" style="color:${status.color}">${status.name}</span>
            <span class="board-col-count">${colTasks.length}</span>
          </div>
          <div class="board-cards">
            ${colTasks.map(task => renderBoardCard(task, status)).join('')}
          </div>
          <button class="board-add" onclick="openAddTask('${status.id}')">${svg('plus', 12)} Add task</button>
        </div>`;
      }).join('')}
      ${tasks.filter(t => !t.status_id).length > 0 ? `<div class="board-col">
        <div class="board-col-header" style="background:#f0f0f0">
          <span style="width:9px;height:9px;border-radius:50%;background:#999;display:inline-block"></span>
          <span class="board-col-name" style="color:#999">No Status</span>
          <span class="board-col-count">${tasks.filter(t => !t.status_id).length}</span>
        </div>
        <div class="board-cards">${tasks.filter(t => !t.status_id).map(task => renderBoardCard(task, null)).join('')}</div>
      </div>` : ''}
    </div>`;
}

function renderBoardCard(task, status) {
  const dept = state.departments.find(d => d.id === task.department_id);
  const tagPills = (task.tags || []).slice(0, 2).map(tg => `<span class="tag-pill" style="background:${tg.color}22;color:${tg.color}">${tg.name}</span>`).join('');
  const isOverdue = !task.done && task.due_date && new Date(task.due_date) < new Date();
  return `<div class="board-card" style="border-left-color:${status?.color || '#ddd'};opacity:${task.done ? 0.5 : 1}" onclick="openPanel('${task.id}')">
    <div class="board-card-title">${task.title}</div>
    <div class="board-card-meta">
      <span class="badge p-${task.priority}">${t(task.priority)}</span>
      ${dept ? `<span style="font-size:10px;color:${dept.color};font-weight:600">${dept.name}</span>` : ''}
      ${task.due_date ? `<span class="due-date ${isOverdue ? 'overdue' : ''}" style="margin-left:auto">${svg('cal', 10)} ${fmtDate(task.due_date)}</span>` : ''}
    </div>
    ${tagPills ? `<div style="margin-top:5px;display:flex;gap:3px;flex-wrap:wrap">${tagPills}</div>` : ''}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:7px">
      ${task.comment_count > 0 ? `<span style="font-size:10px;color:var(--text3)">💬 ${task.comment_count}</span>` : '<span></span>'}
      ${task.avatar_initials ? `<div class="avatar" style="width:22px;height:22px;background:${task.avatar_color};color:${task.avatar_text_color};font-size:8px" title="${task.assignee_name || ''}">${task.avatar_initials}</div>` : ''}
    </div>
  </div>`;
}

// ── Gantt ─────────────────────────────────────────────────────────────────────
function renderGantt() {
  const tasks = state.tasks.filter(t => t.start_date && t.due_date && !t.done);
  if (!tasks.length) return `<div class="empty">${svg('gantt', 36)}<br>No tasks with start &amp; due dates.<br><br><button class="btn primary" onclick="openAddTask()">Add a task</button></div>`;
  const dates = tasks.flatMap(t => [new Date(t.start_date), new Date(t.due_date)]);
  const minDate = new Date(Math.min(...dates)), maxDate = new Date(Math.max(...dates));
  const totalDays = Math.max((maxDate - minDate) / 86400000, 1);
  const headers = [];
  for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 7)) headers.push(new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }));
  return `<div style="overflow-x:auto"><div style="min-width:500px">
    <div class="gantt-row" style="background:var(--bg2);font-weight:600;font-size:10px">
      <div class="gantt-label">Task</div>
      <div class="gantt-track" style="display:flex">${headers.map(h => `<div style="flex:1;padding:0 4px;color:var(--text3);font-size:10px">${h}</div>`).join('')}</div>
    </div>
    ${tasks.map(task => {
      const dept = state.departments.find(d => d.id === task.department_id);
      const color = dept?.color || '#7B68EE';
      const start = (new Date(task.start_date) - minDate) / 86400000;
      const end = (new Date(task.due_date) - minDate) / 86400000;
      return `<div class="gantt-row">
        <div class="gantt-label" title="${task.title}">${task.title}</div>
        <div class="gantt-track">
          <div class="gantt-bar" style="left:${Math.round(start / totalDays * 100)}%;width:${Math.max(Math.round((end - start) / totalDays * 100), 2)}%;background:${color}">${task.title}</div>
        </div>
      </div>`;
    }).join('')}
  </div></div>`;
}

// ── Time ─────────────────────────────────────────────────────────────────────
function renderTime() {
  const entries = state.timeEntries;
  const totalMins = entries.reduce((a, e) => a + e.duration_minutes, 0);
  const timerHtml = state.activeTimer ? `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--red-light);border-radius:var(--radius);margin-bottom:12px;border:1px solid #F09595">
    <span style="width:7px;height:7px;background:var(--red);border-radius:50%;animation:spin .8s linear infinite;display:inline-block"></span>
    <span style="font-size:12px">Tracking: <strong>${state.tasks.find(t => t.id === state.activeTimer.taskId)?.title || 'Task'}</strong></span>
    <span id="timer-disp" style="font-weight:700;margin-left:6px"></span>
    <button class="btn sm danger" onclick="stopTimer()" style="margin-left:auto">${svg('stop', 12)} ${t('stopTimer')}</button>
  </div>` : '';
  return `${timerHtml}
    <div class="stats-grid" style="margin-bottom:14px">
      <div class="stat-card"><div class="stat-label">${t('totalLogged')}</div><div class="stat-val">${(totalMins / 60).toFixed(1)}h</div></div>
      <div class="stat-card"><div class="stat-label">Entries</div><div class="stat-val">${entries.length}</div></div>
      <div class="stat-card"><div class="stat-label">Avg/entry</div><div class="stat-val">${entries.length ? Math.round(totalMins / entries.length) + 'm' : '—'}</div></div>
    </div>
    <div class="card">
      ${entries.length ? entries.map(e => {
        const task = state.tasks.find(t => t.id === e.task_id);
        const dept = state.departments.find(d => d.id === task?.department_id);
        const mins = e.duration_minutes;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:12.5px;font-weight:500">${task?.title || 'Deleted task'}</div>
            <div style="font-size:10px;color:var(--text3)">${e.user_name || ''} ${dept ? '· ' + dept.name : ''} ${e.note ? '· ' + e.note : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--text2)">${fmtDate(e.date)}</span>
            <span style="font-weight:600;font-size:12px">${mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60 ? mins % 60 + 'm' : '') : mins + 'm'}</span>
            <button class="btn icon sm danger" onclick="deleteTimeEntry('${e.id}')">${svg('trash', 11)}</button>
          </div>
        </div>`;
      }).join('') : `<div class="empty">No time entries yet</div>`}
    </div>`;
}

// ── Reports ───────────────────────────────────────────────────────────────────
function renderReports() {
  const tasks = state.tasks, time = state.timeEntries;
  const byDept = state.departments.map(d => {
    const dt = tasks.filter(t => t.department_id === d.id);
    const mins = time.filter(e => tasks.find(t => t.id === e.task_id && t.department_id === d.id)).reduce((a, e) => a + e.duration_minutes, 0);
    return { dept: d, total: dt.length, done: dt.filter(t => t.done).length, mins };
  });
  const maxT = Math.max(...byDept.map(b => b.total), 1), maxM = Math.max(...byDept.map(b => b.mins), 1);
  const byMember = state.members.map(m => ({ member: m, total: tasks.filter(t => t.assignee_id === m.id).length, done: tasks.filter(t => t.assignee_id === m.id && t.done).length })).filter(b => b.total > 0);
  const maxMT = Math.max(...byMember.map(b => b.total), 1);
  const byStatus = state.statuses.map(s => ({ status: s, count: tasks.filter(t => t.status_id === s.id).length }));
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div class="card"><div style="font-size:12px;font-weight:600;margin-bottom:10px">Tasks by department</div>${byDept.map(b => `<div class="bar-row"><span class="bar-label">${b.dept.name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(b.total / maxT * 100)}%;background:${b.dept.color}"></div></div><span class="bar-val">${b.total}</span></div>`).join('')}</div>
    <div class="card"><div style="font-size:12px;font-weight:600;margin-bottom:10px">Hours by department</div>${byDept.map(b => `<div class="bar-row"><span class="bar-label">${b.dept.name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(b.mins / maxM * 100)}%;background:${b.dept.color}"></div></div><span class="bar-val">${(b.mins / 60).toFixed(1)}h</span></div>`).join('')}</div>
    <div class="card"><div style="font-size:12px;font-weight:600;margin-bottom:10px">Tasks by status</div>${byStatus.map(b => `<div class="bar-row"><span class="bar-label">${b.status.name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(b.count / maxT * 100)}%;background:${b.status.color}"></div></div><span class="bar-val">${b.count}</span></div>`).join('')}</div>
    <div class="card"><div style="font-size:12px;font-weight:600;margin-bottom:10px">Tasks per member</div>${byMember.map(b => `<div class="bar-row"><span class="bar-label">${b.member.full_name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(b.total / maxMT * 100)}%;background:#7B68EE"></div></div><span class="bar-val">${b.total}</span></div>`).join('')}</div>
  </div>`;
}

// ── Members ───────────────────────────────────────────────────────────────────
function renderMembers() {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px">
    ${state.members.map(m => {
      const dept = state.departments.find(d => d.id === m.department_id);
      const open = state.tasks.filter(t => t.assignee_id === m.id && !t.done).length;
      return `<div class="card" style="gap:10px;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:9px">
          <div class="avatar" style="width:36px;height:36px;background:${m.avatar_color};color:${m.avatar_text_color};font-size:12px">${m.avatar_initials}</div>
          <div><div style="font-size:13px;font-weight:600">${m.full_name}</div><div style="font-size:10px;color:var(--text3)">${m.role} · ${dept?.name || '—'}</div></div>
        </div>
        <div style="font-size:11px;color:var(--text2)">${open} open task${open !== 1 ? 's' : ''}</div>
        ${state.user.role === 'admin' ? `<div style="display:flex;gap:5px">
          <button class="btn sm" onclick="openEditMember('${m.id}')">${svg('edit', 11)} Edit</button>
          <button class="btn sm danger" onclick="deactivateMember('${m.id}')">${svg('trash', 11)}</button>
        </div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

// ── Departments ───────────────────────────────────────────────────────────────
function renderDepartments() {
  return `<div style="display:flex;flex-direction:column;gap:6px">
    ${state.departments.map(d => {
      const open = state.tasks.filter(t => t.department_id === d.id && !t.done).length;
      const total = state.tasks.filter(t => t.department_id === d.id).length;
      const members = state.members.filter(m => m.department_id === d.id).length;
      return `<div class="task-row">
        <span class="dept-dot" style="background:${d.color};width:11px;height:11px"></span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${d.name}${d.name_ar ? ` / ${d.name_ar}` : ''}</div>
          <div style="font-size:11px;color:var(--text3)">${members} members · ${open} open / ${total} total</div>
        </div>
        ${state.user.role === 'admin' ? `<button class="btn sm danger" onclick="deleteDept('${d.id}')">${svg('trash', 11)}</button>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

// ── Settings ──────────────────────────────────────────────────────────────────
let settingsTab = 'profile';
function renderSettings() {
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'statuses', label: 'Statuses' },
    { id: 'tags', label: 'Tags' },
    { id: 'fields', label: 'Custom Fields' },
  ];
  return `<div style="max-width:620px">
    <div style="display:flex;border-bottom:1px solid var(--border);margin-bottom:18px">
      ${tabs.map(tab => `<div style="padding:8px 16px;cursor:pointer;font-size:12.5px;font-weight:500;color:${settingsTab === tab.id ? 'var(--purple)' : 'var(--text2)'};border-bottom:2px solid ${settingsTab === tab.id ? 'var(--purple)' : 'transparent'};margin-bottom:-1px" onclick="settingsTab='${tab.id}';renderContent()">${tab.label}</div>`).join('')}
    </div>
    ${settingsTab === 'profile' ? renderSettingsProfile() : ''}
    ${settingsTab === 'statuses' ? renderSettingsStatuses() : ''}
    ${settingsTab === 'tags' ? renderSettingsTags() : ''}
    ${settingsTab === 'fields' ? renderSettingsFields() : ''}
  </div>`;
}

function renderSettingsProfile() {
  const u = state.user;
  return `<div class="card">
    <h3 style="margin-bottom:14px">${t('profile')}</h3>
    <div class="field"><label>${t('name')}</label><input id="s-name" value="${u.full_name || ''}" /></div>
    <div class="field"><label>${t('email')}</label><input id="s-email" value="${u.email || ''}" /></div>
    <div class="field"><label>Language</label>
      <select id="s-lang" onchange="state.lang=this.value;document.body.classList.toggle('rtl',this.value==='ar')">
        <option value="en" ${state.lang === 'en' ? 'selected' : ''}>English</option>
        <option value="ar" ${state.lang === 'ar' ? 'selected' : ''}>العربية</option>
      </select>
    </div>
    <div class="field"><label>${t('currentPassword')}</label><input id="s-oldpw" type="password" placeholder="Leave blank to keep" /></div>
    <div class="field"><label>${t('newPassword')}</label><input id="s-newpw" type="password" placeholder="Leave blank to keep" /></div>
    <button class="btn primary" onclick="saveSettings()">${t('saveProfile')}</button>
  </div>`;
}

function renderSettingsStatuses() {
  return `<div class="card">
    <h3 style="margin-bottom:14px">${t('statuses')}</h3>
    <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:14px">
      ${state.statuses.map(s => `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius)">
        <span style="width:12px;height:12px;border-radius:50%;background:${s.color};flex-shrink:0"></span>
        <span style="flex:1;font-size:12.5px;font-weight:500">${s.name}</span>
        <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:${s.is_closed ? 'var(--green-light)' : 'var(--blue-light)'};color:${s.is_closed ? '#166534' : '#1E40AF'}">${s.is_closed ? 'Closed' : 'Open'}</span>
        ${state.user.role === 'admin' ? `<button class="btn icon sm danger" onclick="deleteStatus('${s.id}')">${svg('trash', 11)}</button>` : ''}
      </div>`).join('')}
    </div>
    ${['admin', 'manager'].includes(state.user.role) ? `<div style="display:flex;gap:7px;align-items:flex-end">
      <div class="field" style="margin:0;flex:1"><label>Name</label><input id="st-name" placeholder="Status name" /></div>
      <div class="field" style="margin:0"><label>Color</label><input type="color" id="st-color" value="#6B6F76" style="height:33px;padding:2px 4px;width:60px" /></div>
      <div class="field" style="margin:0">
        <label>Type</label>
        <select id="st-closed" style="height:33px">
          <option value="0">Open</option>
          <option value="1">Closed</option>
        </select>
      </div>
      <button class="btn primary" onclick="addStatus()">${svg('plus', 12)} Add</button>
    </div>` : ''}
  </div>`;
}

function renderSettingsTags() {
  return `<div class="card">
    <h3 style="margin-bottom:14px">${t('tags')}</h3>
    <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px">
      ${state.tags.map(tg => `<div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:${tg.color}18;border:1px solid ${tg.color}44">
        <span style="font-size:12px;color:${tg.color};font-weight:600">${tg.name}</span>
        ${['admin', 'manager'].includes(state.user.role) ? `<button onclick="deleteTag('${tg.id}')" style="background:none;border:none;cursor:pointer;color:${tg.color};font-size:12px;padding:0;line-height:1">×</button>` : ''}
      </div>`).join('')}
    </div>
    ${['admin', 'manager'].includes(state.user.role) ? `<div style="display:flex;gap:7px;align-items:flex-end">
      <div class="field" style="margin:0;flex:1"><label>Name</label><input id="tag-name" placeholder="Tag name" /></div>
      <div class="field" style="margin:0"><label>Color</label><input type="color" id="tag-color" value="#534AB7" style="height:33px;padding:2px 4px;width:60px" /></div>
      <button class="btn primary" onclick="addTag()">${svg('plus', 12)} Add</button>
    </div>` : ''}
  </div>`;
}

function renderSettingsFields() {
  return `<div class="card">
    <h3 style="margin-bottom:14px">${t('customFields')}</h3>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
      ${state.customFields.map(f => `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius)">
        <span style="flex:1;font-size:12.5px;font-weight:500">${f.name}</span>
        <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--bg2);color:var(--text2)">${f.type}</span>
        ${['admin', 'manager'].includes(state.user.role) ? `<button class="btn icon sm danger" onclick="deleteCustomField('${f.id}')">${svg('trash', 11)}</button>` : ''}
      </div>`).join('')}
      ${!state.customFields.length ? `<div style="font-size:12px;color:var(--text3);text-align:center;padding:12px">No custom fields yet</div>` : ''}
    </div>
    ${['admin', 'manager'].includes(state.user.role) ? `<div style="display:flex;gap:7px;align-items:flex-end">
      <div class="field" style="margin:0;flex:1"><label>Name</label><input id="cf-name" placeholder="Field name" /></div>
      <div class="field" style="margin:0">
        <label>Type</label>
        <select id="cf-type" style="height:33px">
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="dropdown">Dropdown</option>
          <option value="checkbox">Checkbox</option>
          <option value="url">URL</option>
        </select>
      </div>
      <button class="btn primary" onclick="addCustomField()">${svg('plus', 12)} Add</button>
    </div>` : ''}
  </div>`;
}

// ── Task Panel ────────────────────────────────────────────────────────────────
async function openPanel(taskId) {
  state.panelTaskId = taskId;
  state.panelTab = 'activity';
  state.panelChecklists = [];
  state.panelActivity = [];
  state.panelAttachments = [];
  state.panelCustom = { fields: [], values: [] };

  const panel = document.getElementById('task-panel');
  const overlay = document.getElementById('panel-overlay');
  panel.innerHTML = '<div style="padding:20px;color:var(--text3)">Loading...</div>';
  panel.classList.add('open');
  overlay.style.display = 'block';

  const [task, checklists, activity, attachments, customData] = await Promise.all([
    api('GET', `/tasks/${taskId}`),
    api('GET', `/checklists/task/${taskId}`),
    api('GET', `/activity/task/${taskId}`),
    api('GET', `/attachments/task/${taskId}`),
    api('GET', `/customfields/task/${taskId}`),
  ]);
  if (!task) { closePanel(); return; }

  // Update task in state
  const idx = state.tasks.findIndex(t => t.id === taskId);
  if (idx >= 0) state.tasks[idx] = task;

  state.panelChecklists = checklists || [];
  state.panelActivity = activity || [];
  state.panelAttachments = attachments || [];
  state.panelCustom = customData || { fields: [], values: [] };

  renderPanel(task);
}

function closePanel() {
  state.panelTaskId = null;
  const panel = document.getElementById('task-panel');
  const overlay = document.getElementById('panel-overlay');
  panel.classList.remove('open');
  overlay.style.display = 'none';
  if (state.recording) stopRecording();
}

function renderPanel(task) {
  if (!task) return;
  const status = state.statuses.find(s => s.id === task.status_id);
  const dept = state.departments.find(d => d.id === task.department_id);
  const assignee = state.members.find(m => m.id === task.assignee_id);
  const tagIds = (task.tags || []).map(tg => tg.id);

  const panel = document.getElementById('task-panel');
  panel.innerHTML = `
    <div class="panel-header">
      <div class="check ${task.done ? 'checked' : ''}" onclick="toggleDone('${task.id}');openPanel('${task.id}')" style="width:18px;height:18px">${svg('check', 10)}</div>
      <input class="panel-title-input" id="panel-title" value="${escHtml(task.title)}" onblur="savePanelTitle('${task.id}')" onkeydown="if(event.key==='Enter')this.blur()" />
      <button class="btn icon" onclick="closePanel()">${svg('x', 16)}</button>
    </div>
    <div class="panel-body">
      <div class="panel-left">
        <div class="panel-field">
          <div class="panel-field-label">Status</div>
          <select class="panel-select" onchange="updateTaskField('${task.id}','status_id',this.value)">
            ${state.statuses.map(s => `<option value="${s.id}" ${s.id === task.status_id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Priority</div>
          <select class="panel-select" onchange="updateTaskField('${task.id}','priority',this.value)">
            ${['urgent', 'high', 'medium', 'low'].map(p => `<option value="${p}" ${p === task.priority ? 'selected' : ''}>${t(p)}</option>`).join('')}
          </select>
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Assignee</div>
          <select class="panel-select" onchange="updateTaskField('${task.id}','assignee_id',this.value)">
            <option value="">— Unassigned —</option>
            ${state.members.map(m => `<option value="${m.id}" ${m.id === task.assignee_id ? 'selected' : ''}>${m.full_name}</option>`).join('')}
          </select>
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Department</div>
          <select class="panel-select" onchange="updateTaskField('${task.id}','department_id',this.value)">
            <option value="">— None —</option>
            ${state.departments.map(d => `<option value="${d.id}" ${d.id === task.department_id ? 'selected' : ''}>${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Due date</div>
          <input type="date" class="panel-select" value="${task.due_date || ''}" onchange="updateTaskField('${task.id}','due_date',this.value)" />
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Start date</div>
          <input type="date" class="panel-select" value="${task.start_date || ''}" onchange="updateTaskField('${task.id}','start_date',this.value)" />
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Est. hours</div>
          <input type="number" class="panel-select" value="${task.estimated_hours || 0}" min="0" step=".5" onblur="updateTaskField('${task.id}','estimated_hours',parseFloat(this.value)||0)" />
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Tags</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px">
            ${(task.tags || []).map(tg => `<span class="tag-pill" style="background:${tg.color}22;color:${tg.color};cursor:pointer" onclick="removeTagFromTask('${task.id}','${tg.id}')">${tg.name} ×</span>`).join('')}
          </div>
          <select class="panel-select" onchange="addTagToTask('${task.id}',this.value);this.value=''">
            <option value="">+ Add tag...</option>
            ${state.tags.filter(tg => !tagIds.includes(tg.id)).map(tg => `<option value="${tg.id}">${tg.name}</option>`).join('')}
          </select>
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Watchers</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:5px">
            ${(task.watchers || []).map(w => `<div class="avatar" style="width:22px;height:22px;background:${w.avatar_color};color:${w.avatar_text_color};font-size:8px" title="${w.full_name}">${w.avatar_initials}</div>`).join('')}
          </div>
          <button class="btn sm ghost" onclick="watchTask('${task.id}')">${svg('eye', 11)} Watch</button>
        </div>
        <div class="panel-field">
          <div class="panel-field-label">Description</div>
          <textarea id="panel-desc" style="font-size:12px;min-height:80px" onblur="savePanelDesc('${task.id}')">${escHtml(task.description || '')}</textarea>
        </div>
        ${renderPanelChecklists(task.id)}
        ${renderPanelCustomFields(task.id)}
        <div style="margin-top:10px;display:flex;gap:6px">
          <button class="btn sm" onclick="startTimer('${task.id}');closePanel()">${svg('play', 11)} Timer</button>
          ${['admin', 'manager'].includes(state.user.role) ? `<button class="btn sm danger" onclick="deleteTask('${task.id}');closePanel()">${svg('trash', 11)} Delete</button>` : ''}
        </div>
      </div>
      <div class="panel-right">
        <div class="panel-tabs">
          <div class="panel-tab ${state.panelTab === 'activity' ? 'active' : ''}" onclick="state.panelTab='activity';refreshPanelRight('${task.id}')">Activity</div>
          <div class="panel-tab ${state.panelTab === 'attachments' ? 'active' : ''}" onclick="state.panelTab='attachments';refreshPanelRight('${task.id}')">Attachments (${state.panelAttachments.length})</div>
        </div>
        <div class="panel-tab-content" id="panel-tab-content">
          ${state.panelTab === 'activity' ? renderPanelActivity() : renderPanelAttachments(task.id)}
        </div>
        ${state.panelTab === 'activity' ? renderCommentInput(task.id) : ''}
      </div>
    </div>`;
}

function refreshPanelRight(taskId) {
  const tc = document.getElementById('panel-tab-content');
  if (tc) tc.innerHTML = state.panelTab === 'activity' ? renderPanelActivity() : renderPanelAttachments(taskId);
  // re-render comment input visibility
  const panel = document.getElementById('task-panel');
  const existing = panel.querySelector('.comment-input-area');
  if (state.panelTab === 'activity' && !existing) {
    panel.querySelector('.panel-right').insertAdjacentHTML('beforeend', renderCommentInput(taskId));
  } else if (state.panelTab !== 'activity' && existing) {
    existing.remove();
  }
}

function renderPanelActivity() {
  if (!state.panelActivity.length) return `<div class="empty" style="padding:30px">${svg('clock', 24)}<br>No activity yet</div>`;
  return `<div class="activity-feed">
    ${state.panelActivity.map(item => {
      const isComment = item.action === 'commented';
      const color = item.avatar_color || '#EEEDFE';
      const textColor = item.avatar_text_color || '#534AB7';
      const initials = item.avatar_initials || (item.full_name ? item.full_name[0] : '?');
      let text = '';
      if (item.action === 'created') text = `<strong>${item.full_name}</strong> created this task`;
      else if (item.action === 'status_changed') text = `<strong>${item.full_name}</strong> changed status from <em>${item.old_value || 'none'}</em> → <em>${item.new_value || 'none'}</em>`;
      else if (item.action === 'field_changed') text = `<strong>${item.full_name}</strong> changed <em>${item.field}</em> from <em>${item.old_value || '—'}</em> → <em>${item.new_value || '—'}</em>`;
      else if (item.action === 'commented') text = `<strong>${item.full_name}</strong>`;
      else if (item.action === 'attachment_added') text = `<strong>${item.full_name}</strong> attached <em>${item.new_value}</em>`;
      else text = `<strong>${item.full_name}</strong> ${item.action}`;
      return `<div class="activity-item">
        <div class="activity-dot" style="background:${color};color:${textColor}">${initials}</div>
        <div class="activity-content">
          <div class="activity-text">${text}</div>
          ${isComment ? `<div class="comment-bubble">${escHtml(item.new_value || '')}</div>` : ''}
          <div class="activity-time">${fmtDateTime(item.created_at)}</div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderCommentInput(taskId) {
  return `<div class="comment-input-area">
    <div class="comment-input-row">
      <div class="avatar" style="width:26px;height:26px;background:${state.user.avatar_color};color:${state.user.avatar_text_color};font-size:9px;flex-shrink:0">${state.user.avatar_initials}</div>
      <textarea class="comment-box" id="comment-input" placeholder="${t('comment')}" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitComment('${taskId}')}"></textarea>
      <button class="btn primary sm" onclick="submitComment('${taskId}')">${svg('play', 11)}</button>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;padding-left:32px">
      <button class="voice-btn ${state.recording ? 'recording' : ''}" id="voice-btn" onclick="toggleRecording('${taskId}')">${svg('mic', 12)} ${state.recording ? 'Stop' : 'Voice note'}</button>
      <label class="voice-btn" style="cursor:pointer">${svg('paperclip', 12)} Attach image
        <input type="file" accept="image/*" style="display:none" onchange="attachImage(event,'${taskId}')">
      </label>
    </div>
  </div>`;
}

function renderPanelAttachments(taskId) {
  if (!state.panelAttachments.length) return `<div class="empty" style="padding:30px">${svg('paperclip', 24)}<br>No attachments yet<br><br>
    <label class="btn primary" style="cursor:pointer">${svg('plus', 12)} Add file<input type="file" accept="image/*,audio/*" style="display:none" onchange="attachImage(event,'${taskId}')"></label></div>`;
  return `<div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
      <label class="btn sm" style="cursor:pointer">${svg('plus', 11)} Add<input type="file" accept="image/*,audio/*" style="display:none" onchange="attachImage(event,'${taskId}')"></label>
    </div>
    <div class="attachment-grid">
      ${state.panelAttachments.map(att => renderAttachmentItem(att, taskId)).join('')}
    </div>
  </div>`;
}

function renderAttachmentItem(att, taskId) {
  if (att.mime_type && att.mime_type.startsWith('audio/')) {
    return `<div class="attachment-item">
      <div class="attachment-audio"><span style="font-size:10px">🎤 Voice note</span><br><audio controls style="width:100%;margin-top:4px" src="" id="audio-${att.id}"></audio></div>
      <div class="attachment-name">${att.name}</div>
      <button class="attachment-del" onclick="deleteAttachment('${att.id}','${taskId}')">×</button>
    </div>`;
  }
  return `<div class="attachment-item">
    <img class="attachment-img" src="" id="img-${att.id}" onclick="viewImage('${att.id}')" alt="${att.name}" />
    <div class="attachment-name">${att.name}</div>
    <button class="attachment-del" onclick="deleteAttachment('${att.id}','${taskId}')">×</button>
  </div>`;
}

function renderPanelChecklists(taskId) {
  if (!state.panelChecklists.length && !['admin', 'manager'].includes(state.user.role)) return '';
  return `<div class="panel-field">
    <div class="panel-field-label">${t('checklists')}</div>
    ${state.panelChecklists.map(cl => {
      const done = cl.items.filter(i => i.is_done).length;
      const total = cl.items.length;
      const pct = total ? Math.round(done / total * 100) : 0;
      return `<div class="checklist-section">
        <div class="checklist-name">
          <span style="flex:1">${cl.name} <span style="font-size:10px;color:var(--text3)">${done}/${total}</span></span>
          <button class="btn icon sm danger" onclick="deleteChecklist('${cl.id}','${taskId}')">${svg('trash', 10)}</button>
        </div>
        <div class="checklist-progress"><div class="checklist-progress-fill" style="width:${pct}%"></div></div>
        ${cl.items.map(item => `<div class="checklist-item">
          <input type="checkbox" ${item.is_done ? 'checked' : ''} onchange="toggleChecklistItem('${item.id}','${taskId}',this.checked)" />
          <span class="checklist-item-name ${item.is_done ? 'done' : ''}">${escHtml(item.name)}</span>
          <button class="btn icon sm danger" onclick="deleteChecklistItem('${item.id}','${taskId}')" style="opacity:0.5;padding:2px">${svg('x', 9)}</button>
        </div>`).join('')}
        <div class="checklist-add">
          <input id="cli-${cl.id}" placeholder="Add item..." style="font-size:11px;padding:3px 7px" onkeydown="if(event.key==='Enter')addChecklistItem('${cl.id}','${taskId}')" />
          <button class="btn sm" onclick="addChecklistItem('${cl.id}','${taskId}')">${svg('plus', 10)}</button>
        </div>
      </div>`;
    }).join('')}
    <div class="checklist-add" style="margin-top:4px">
      <input id="cl-new-${taskId}" placeholder="New checklist..." style="font-size:11px;padding:3px 7px" onkeydown="if(event.key==='Enter')addChecklist('${taskId}')" />
      <button class="btn sm" onclick="addChecklist('${taskId}')">${svg('plus', 10)}</button>
    </div>
  </div>`;
}

function renderPanelCustomFields(taskId) {
  if (!state.panelCustom.fields.length) return '';
  const vals = {};
  (state.panelCustom.values || []).forEach(v => { vals[v.field_id] = v.value; });
  return `<div class="panel-field">
    <div class="panel-field-label">${t('customFields')}</div>
    ${state.panelCustom.fields.map(f => {
      const val = vals[f.id] || '';
      let input = '';
      if (f.type === 'checkbox') input = `<input type="checkbox" ${val === 'true' ? 'checked' : ''} onchange="saveCustomField('${taskId}','${f.id}',String(this.checked))" style="width:auto" />`;
      else if (f.type === 'date') input = `<input type="date" value="${val}" onblur="saveCustomField('${taskId}','${f.id}',this.value)" style="font-size:11px;padding:3px 7px" />`;
      else if (f.type === 'number') input = `<input type="number" value="${val}" onblur="saveCustomField('${taskId}','${f.id}',this.value)" style="font-size:11px;padding:3px 7px" />`;
      else if (f.type === 'url') input = `<input type="url" value="${val}" placeholder="https://..." onblur="saveCustomField('${taskId}','${f.id}',this.value)" style="font-size:11px;padding:3px 7px" />`;
      else input = `<input type="text" value="${escHtml(val)}" onblur="saveCustomField('${taskId}','${f.id}',this.value)" style="font-size:11px;padding:3px 7px" />`;
      return `<div class="cf-row"><span class="cf-label">${f.name}</span><span style="flex:1">${input}</span></div>`;
    }).join('')}
  </div>`;
}

// Load image/audio data after render
async function loadPanelMediaAfterRender() {
  for (const att of state.panelAttachments) {
    const data = await api('GET', `/attachments/${att.id}/data`);
    if (!data) continue;
    const src = `data:${data.mime_type};base64,${data.data}`;
    const img = document.getElementById(`img-${att.id}`);
    const audio = document.getElementById(`audio-${att.id}`);
    if (img) img.src = src;
    if (audio) audio.src = src;
  }
}

// ── Panel actions ─────────────────────────────────────────────────────────────
async function savePanelTitle(taskId) {
  const title = document.getElementById('panel-title')?.value.trim();
  if (!title) return;
  const updated = await api('PUT', `/tasks/${taskId}`, { title });
  if (updated?.id) { updateTaskInState(updated); toast('Title saved'); }
}

async function savePanelDesc(taskId) {
  const desc = document.getElementById('panel-desc')?.value;
  const updated = await api('PUT', `/tasks/${taskId}`, { description: desc });
  if (updated?.id) updateTaskInState(updated);
}

async function updateTaskField(taskId, field, value) {
  const updated = await api('PUT', `/tasks/${taskId}`, { [field]: value || null });
  if (updated?.id) {
    updateTaskInState(updated);
    if (field === 'status_id' || field === 'assignee_id') {
      const activity = await api('GET', `/activity/task/${taskId}`);
      state.panelActivity = activity || [];
      const tc = document.getElementById('panel-tab-content');
      if (tc && state.panelTab === 'activity') tc.innerHTML = renderPanelActivity();
    }
    renderContent();
    toast('Updated');
  }
}

async function submitComment(taskId) {
  const input = document.getElementById('comment-input');
  const content = input?.value.trim();
  if (!content) return;
  input.value = '';
  await api('POST', `/comments/${taskId}`, { content });
  const activity = await api('GET', `/activity/task/${taskId}`);
  state.panelActivity = activity || [];
  const tc = document.getElementById('panel-tab-content');
  if (tc && state.panelTab === 'activity') tc.innerHTML = renderPanelActivity();
  const tasks = await api('GET', '/tasks');
  if (tasks) { state.tasks = tasks; renderContent(); }
}

async function addTagToTask(taskId, tagId) {
  if (!tagId) return;
  await api('POST', `/tags/task/${taskId}`, { tag_id: tagId });
  await openPanel(taskId);
}

async function removeTagFromTask(taskId, tagId) {
  await api('DELETE', `/tags/task/${taskId}/${tagId}`);
  await openPanel(taskId);
}

async function watchTask(taskId) {
  await api('POST', `/tasks/${taskId}/watchers`);
  await openPanel(taskId);
  toast('Watching');
}

// Checklists
async function addChecklist(taskId) {
  const inp = document.getElementById(`cl-new-${taskId}`);
  const name = inp?.value.trim();
  if (!name) return;
  inp.value = '';
  await api('POST', `/checklists/task/${taskId}`, { name });
  const cls = await api('GET', `/checklists/task/${taskId}`);
  state.panelChecklists = cls || [];
  renderPanel(state.tasks.find(t => t.id === taskId) || await api('GET', `/tasks/${taskId}`));
  loadPanelMediaAfterRender();
}

async function deleteChecklist(clId, taskId) {
  await api('DELETE', `/checklists/${clId}`);
  state.panelChecklists = state.panelChecklists.filter(c => c.id !== clId);
  renderPanel(state.tasks.find(t => t.id === taskId) || await api('GET', `/tasks/${taskId}`));
  loadPanelMediaAfterRender();
}

async function addChecklistItem(clId, taskId) {
  const inp = document.getElementById(`cli-${clId}`);
  const name = inp?.value.trim();
  if (!name) return;
  inp.value = '';
  await api('POST', `/checklists/${clId}/items`, { name });
  const cls = await api('GET', `/checklists/task/${taskId}`);
  state.panelChecklists = cls || [];
  renderPanel(state.tasks.find(t => t.id === taskId) || await api('GET', `/tasks/${taskId}`));
  loadPanelMediaAfterRender();
}

async function toggleChecklistItem(itemId, taskId, done) {
  await api('PUT', `/checklists/items/${itemId}`, { is_done: done });
  const cls = await api('GET', `/checklists/task/${taskId}`);
  state.panelChecklists = cls || [];
  renderPanel(state.tasks.find(t => t.id === taskId) || await api('GET', `/tasks/${taskId}`));
  loadPanelMediaAfterRender();
}

async function deleteChecklistItem(itemId, taskId) {
  await api('DELETE', `/checklists/items/${itemId}`);
  const cls = await api('GET', `/checklists/task/${taskId}`);
  state.panelChecklists = cls || [];
  renderPanel(state.tasks.find(t => t.id === taskId) || await api('GET', `/tasks/${taskId}`));
  loadPanelMediaAfterRender();
}

// Custom fields
async function saveCustomField(taskId, fieldId, value) {
  await api('PUT', `/customfields/task/${taskId}/${fieldId}`, { value });
}

// Attachments
async function attachImage(event, taskId) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { toast('File too large (max 10MB)'); return; }
  const reader = new FileReader();
  reader.onload = async e => {
    const base64 = e.target.result.split(',')[1];
    await api('POST', `/attachments/task/${taskId}`, { name: file.name, mime_type: file.type, data: base64 });
    const atts = await api('GET', `/attachments/task/${taskId}`);
    state.panelAttachments = atts || [];
    state.panelTab = 'attachments';
    const task = state.tasks.find(t => t.id === taskId) || await api('GET', `/tasks/${taskId}`);
    renderPanel(task);
    loadPanelMediaAfterRender();
    toast('Attached');
  };
  reader.readAsDataURL(file);
}

async function deleteAttachment(attId, taskId) {
  await api('DELETE', `/attachments/${attId}`);
  state.panelAttachments = state.panelAttachments.filter(a => a.id !== attId);
  const tc = document.getElementById('panel-tab-content');
  if (tc && state.panelTab === 'attachments') tc.innerHTML = renderPanelAttachments(taskId);
  toast('Removed');
}

async function viewImage(attId) {
  const data = await api('GET', `/attachments/${attId}/data`);
  if (!data) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;display:flex;align-items:center;justify-content:center;cursor:pointer';
  overlay.onclick = () => overlay.remove();
  overlay.innerHTML = `<img src="data:${data.mime_type};base64,${data.data}" style="max-width:90vw;max-height:90vh;border-radius:8px" />`;
  document.body.appendChild(overlay);
}

// Voice recording
async function toggleRecording(taskId) {
  if (state.recording) {
    stopRecording(taskId);
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.audioChunks = [];
      state.mediaRecorder = new MediaRecorder(stream);
      state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);
      state.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(state.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async e => {
          const base64 = e.target.result.split(',')[1];
          await api('POST', `/attachments/task/${taskId}`, { name: `voice-${Date.now()}.webm`, mime_type: 'audio/webm', data: base64 });
          const atts = await api('GET', `/attachments/task/${taskId}`);
          state.panelAttachments = atts || [];
          state.panelTab = 'attachments';
          const task = state.tasks.find(t => t.id === taskId) || await api('GET', `/tasks/${taskId}`);
          renderPanel(task);
          loadPanelMediaAfterRender();
          toast('Voice note saved');
        };
        reader.readAsDataURL(blob);
      };
      state.mediaRecorder.start();
      state.recording = true;
      const btn = document.getElementById('voice-btn');
      if (btn) { btn.classList.add('recording'); btn.innerHTML = svg('stop', 12) + ' Stop'; }
    } catch (e) { toast('Microphone not available'); }
  }
}

function stopRecording(taskId) {
  if (state.mediaRecorder && state.recording) {
    state.mediaRecorder.stop();
    state.recording = false;
    const btn = document.getElementById('voice-btn');
    if (btn) { btn.classList.remove('recording'); btn.innerHTML = svg('mic', 12) + ' Voice note'; }
  }
}

// ── General actions ───────────────────────────────────────────────────────────
function nav(view) { state.view = view; state.deptFilter = null; closePanel(); render(); }
function navDept(id) { state.view = 'tasks'; state.deptFilter = id; closePanel(); render(); }
function setFilter(f) { state.taskFilter = f; renderContent(); }
function setViewMode(m) { state.viewMode = m; renderContent(); }
function toggleSidebar() { state.sidebarOpen = !state.sidebarOpen; document.getElementById('sidebar')?.classList.toggle('open', state.sidebarOpen); }
function renderContent() { const c = document.getElementById('content'); if (c) c.innerHTML = renderPage(); }
function updateNotifBadge() { }
function updateTaskInState(task) { const i = state.tasks.findIndex(t => t.id === task.id); if (i >= 0) state.tasks[i] = task; }

async function toggleDone(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  const doneStatus = state.statuses.find(s => s.is_closed);
  const openStatus = state.statuses.find(s => !s.is_closed);
  const newStatusId = !task.done ? (doneStatus?.id || task.status_id) : (openStatus?.id || task.status_id);
  const updated = await api('PUT', `/tasks/${id}`, { done: !task.done, status_id: newStatusId });
  if (updated) { updateTaskInState(updated); renderContent(); }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  await api('DELETE', `/tasks/${id}`);
  state.tasks = state.tasks.filter(t => t.id !== id);
  renderContent();
  renderSidebarDepts();
}

function renderSidebarDepts() { const sb = document.getElementById('sidebar'); if (sb) sb.innerHTML = renderSidebar(); }

async function deleteTimeEntry(id) {
  await api('DELETE', `/time/${id}`);
  state.timeEntries = state.timeEntries.filter(e => e.id !== id);
  renderContent();
}

async function deactivateMember(id) {
  if (!confirm('Deactivate this member?')) return;
  await api('DELETE', `/users/${id}`);
  state.members = state.members.filter(m => m.id !== id);
  renderContent();
}

async function deleteDept(id) {
  if (!confirm('Delete this department?')) return;
  await api('DELETE', `/departments/${id}`);
  state.departments = state.departments.filter(d => d.id !== id);
  render();
}

async function addStatus() {
  const name = document.getElementById('st-name')?.value.trim();
  const color = document.getElementById('st-color')?.value;
  const is_closed = document.getElementById('st-closed')?.value === '1';
  if (!name) return;
  const st = await api('POST', '/statuses', { name, color, is_closed });
  if (st?.id) { state.statuses.push(st); renderContent(); toast('Status added'); }
}

async function deleteStatus(id) {
  if (!confirm('Delete this status?')) return;
  await api('DELETE', `/statuses/${id}`);
  state.statuses = state.statuses.filter(s => s.id !== id);
  renderContent();
}

async function addTag() {
  const name = document.getElementById('tag-name')?.value.trim();
  const color = document.getElementById('tag-color')?.value;
  if (!name) return;
  const tg = await api('POST', '/tags', { name, color });
  if (tg?.id) { state.tags.push(tg); renderContent(); toast('Tag added'); }
}

async function deleteTag(id) {
  await api('DELETE', `/tags/${id}`);
  state.tags = state.tags.filter(t => t.id !== id);
  renderContent();
}

async function addCustomField() {
  const name = document.getElementById('cf-name')?.value.trim();
  const type = document.getElementById('cf-type')?.value;
  if (!name) return;
  const f = await api('POST', '/customfields', { name, type });
  if (f?.id) { state.customFields.push(f); renderContent(); toast('Field added'); }
}

async function deleteCustomField(id) {
  await api('DELETE', `/customfields/${id}`);
  state.customFields = state.customFields.filter(f => f.id !== id);
  renderContent();
}

async function saveSettings() {
  const payload = { full_name: document.getElementById('s-name').value, email: document.getElementById('s-email').value, language: document.getElementById('s-lang').value };
  const oldpw = document.getElementById('s-oldpw').value;
  const newpw = document.getElementById('s-newpw').value;
  if (newpw) { payload.current_password = oldpw; payload.new_password = newpw; }
  const updated = await api('PUT', '/auth/me', payload);
  if (updated?.id) { state.user = { ...state.user, ...updated }; state.lang = updated.language || 'en'; document.body.classList.toggle('rtl', state.lang === 'ar'); toast('Profile saved'); renderContent(); }
}

// ── Modals ─────────────────────────────────────────────────────────────────────
function showModal(html) {
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener('click', e => { if (e.target === bg) closeModal(); });
  document.body.appendChild(bg);
}
function closeModal() { document.getElementById('modal-bg')?.remove(); }

function openAddTask(defaultStatusId) {
  const depts = state.departments.map(d => `<option value="${d.id}" ${d.id === state.deptFilter ? 'selected' : ''}>${d.name}</option>`).join('');
  const members = state.members.map(m => `<option value="${m.id}">${m.full_name}</option>`).join('');
  const statuses = state.statuses.map(s => `<option value="${s.id}" ${s.id === defaultStatusId ? 'selected' : ''}>${s.name}</option>`).join('');
  const tagOptions = state.tags.map(tg => `<option value="${tg.id}">${tg.name}</option>`).join('');
  showModal(`<h3>${t('addTask')}</h3>
    <div class="field"><label>${t('title')}</label><input id="f-title" placeholder="${t('title')}" /></div>
    <div class="field"><label>${t('description')}</label><textarea id="f-desc" placeholder="${t('description')}"></textarea></div>
    <div class="row">
      <div class="field"><label>Status</label><select id="f-status">${statuses}</select></div>
      <div class="field"><label>${t('priority')}</label><select id="f-prio"><option value="urgent">${t('urgent')}</option><option value="high">${t('high')}</option><option value="medium" selected>${t('medium')}</option><option value="low">${t('low')}</option></select></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('department')}</label><select id="f-dept"><option value="">—</option>${depts}</select></div>
      <div class="field"><label>${t('assignee')}</label><select id="f-assignee"><option value="">—</option>${members}</select></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('dueDate')}</label><input type="date" id="f-due" /></div>
      <div class="field"><label>${t('startDate')}</label><input type="date" id="f-start" /></div>
    </div>
    <div class="row">
      <div class="field"><label>${t('estimatedHours')}</label><input type="number" id="f-hrs" min="0" step=".5" value="0" /></div>
      <div class="field"><label>${t('tags')}</label><select id="f-tags" multiple style="min-height:60px">${tagOptions}</select></div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitAddTask()">${t('addTask')}</button></div>`);
}

async function submitAddTask() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) return;
  const tagSel = document.getElementById('f-tags');
  const tags = tagSel ? Array.from(tagSel.selectedOptions).map(o => o.value) : [];
  const task = await api('POST', '/tasks', {
    title, description: document.getElementById('f-desc').value,
    department_id: document.getElementById('f-dept').value || null,
    priority: document.getElementById('f-prio').value,
    status_id: document.getElementById('f-status').value || null,
    assignee_id: document.getElementById('f-assignee').value || null,
    due_date: document.getElementById('f-due').value || null,
    start_date: document.getElementById('f-start').value || null,
    estimated_hours: parseFloat(document.getElementById('f-hrs').value) || 0,
    tags,
  });
  if (task?.id) { if (!state.tasks.find(t => t.id === task.id)) state.tasks.unshift(task); closeModal(); renderContent(); renderSidebarDepts(); toast('Task created'); }
}

function openLogTime() {
  const tasks = state.tasks.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
  showModal(`<h3>${t('logTime')}</h3>
    <div class="field"><label>Task</label><select id="f-task">${tasks}</select></div>
    <div class="row">
      <div class="field"><label>${t('duration')}</label><input type="number" id="f-dur" value="60" min="1" /></div>
      <div class="field"><label>${t('date')}</label><input type="date" id="f-date" value="${new Date().toISOString().slice(0, 10)}" /></div>
    </div>
    <div class="field"><label>${t('note')}</label><input id="f-note" /></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitLogTime()">${t('logTime')}</button></div>`);
}

async function submitLogTime() {
  const dur = parseInt(document.getElementById('f-dur').value);
  if (!dur) return;
  const entry = await api('POST', '/time', { task_id: document.getElementById('f-task').value, duration_minutes: dur, date: document.getElementById('f-date').value, note: document.getElementById('f-note').value });
  if (entry?.id) { state.timeEntries.unshift(entry); closeModal(); renderContent(); toast('Time logged'); }
}

function openAddMember() {
  const depts = state.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  showModal(`<h3>${t('addMember')}</h3>
    <div class="row"><div class="field"><label>${t('name')}</label><input id="f-name" /></div><div class="field"><label>${t('username')}</label><input id="f-uname" /></div></div>
    <div class="row"><div class="field"><label>${t('email')}</label><input id="f-email" type="email" /></div><div class="field"><label>${t('password')}</label><input id="f-pw" type="password" /></div></div>
    <div class="row">
      <div class="field"><label>${t('role')}</label><select id="f-role"><option value="admin">${t('admin')}</option><option value="manager">${t('manager')}</option><option value="member" selected>${t('member')}</option></select></div>
      <div class="field"><label>${t('department')}</label><select id="f-dept"><option value="">—</option>${depts}</select></div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitAddMember()">${t('addMember')}</button></div>`);
}

async function submitAddMember() {
  const res = await api('POST', '/auth/register', { username: document.getElementById('f-uname').value.trim(), email: document.getElementById('f-email').value.trim(), password: document.getElementById('f-pw').value, full_name: document.getElementById('f-name').value.trim(), role: document.getElementById('f-role').value, department_id: document.getElementById('f-dept').value || null });
  if (res?.id) { const members = await api('GET', '/users'); if (members) state.members = members; closeModal(); renderContent(); toast('Member added'); }
  else if (res?.error) toast(res.error);
}

function openEditMember(id) {
  const m = state.members.find(m => m.id === id);
  if (!m) return;
  const depts = state.departments.map(d => `<option value="${d.id}" ${d.id === m.department_id ? 'selected' : ''}>${d.name}</option>`).join('');
  showModal(`<h3>Edit member</h3>
    <div class="field"><label>${t('name')}</label><input id="f-name" value="${m.full_name}" /></div>
    <div class="row">
      <div class="field"><label>${t('role')}</label><select id="f-role"><option value="admin" ${m.role === 'admin' ? 'selected' : ''}>${t('admin')}</option><option value="manager" ${m.role === 'manager' ? 'selected' : ''}>${t('manager')}</option><option value="member" ${m.role === 'member' ? 'selected' : ''}>${t('member')}</option></select></div>
      <div class="field"><label>${t('department')}</label><select id="f-dept"><option value="">—</option>${depts}</select></div>
    </div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitEditMember('${id}')">${t('save')}</button></div>`);
}

async function submitEditMember(id) {
  await api('PUT', `/users/${id}`, { full_name: document.getElementById('f-name').value.trim(), role: document.getElementById('f-role').value, department_id: document.getElementById('f-dept').value || null });
  const members = await api('GET', '/users'); if (members) state.members = members;
  closeModal(); renderContent(); toast('Member updated');
}

function openAddDept() {
  showModal(`<h3>${t('addDept')}</h3>
    <div class="row"><div class="field"><label>${t('deptName')}</label><input id="f-name" /></div><div class="field"><label>${t('arabicName')}</label><input id="f-name-ar" /></div></div>
    <div class="field"><label>${t('color')}</label><input type="color" id="f-color" value="#534AB7" style="height:36px;padding:2px 4px" /></div>
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" onclick="submitAddDept()">${t('addDept')}</button></div>`);
}

async function submitAddDept() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) return;
  const dept = await api('POST', '/departments', { name, name_ar: document.getElementById('f-name-ar').value || null, color: document.getElementById('f-color').value });
  if (dept?.id) { state.departments.push(dept); closeModal(); render(); toast('Department added'); }
}

function openNotifs() {
  showModal(`<div style="max-width:380px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 style="margin:0">${t('notifications')}</h3>
      <button class="btn sm" onclick="markAllRead()">${t('markAllRead')}</button>
    </div>
    ${state.notifications.slice(0, 20).map(n => `<div class="notif-item ${!n.is_read ? 'unread' : ''}" onclick="markRead('${n.id}')">
      <div style="font-size:12.5px;font-weight:${n.is_read ? '400' : '600'}">${n.title}</div>
      <div style="font-size:11px;color:var(--text3)">${n.message || ''}</div>
    </div>`).join('') || `<div class="empty">No notifications</div>`}
    <div class="modal-actions"><button class="btn" onclick="closeModal()">${t('cancel')}</button></div>
  </div>`);
}

async function markAllRead() {
  await api('PUT', '/notifications/read-all');
  state.notifications = state.notifications.map(n => ({ ...n, is_read: 1 }));
  closeModal(); updateNotifBadge();
}

async function markRead(id) {
  await api('PUT', `/notifications/${id}/read`);
  state.notifications = state.notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n);
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(taskId) {
  if (state.activeTimer) stopTimer();
  state.activeTimer = { taskId, start: Date.now() };
  state.timerInterval = setInterval(() => {
    const el = document.getElementById('timer-disp');
    if (el) { const s = Math.floor((Date.now() - state.activeTimer.start) / 1000); el.textContent = `${Math.floor(s / 60)}m ${s % 60}s`; }
  }, 1000);
  nav('time');
}

async function stopTimer() {
  if (!state.activeTimer) return;
  clearInterval(state.timerInterval);
  const mins = Math.max(1, Math.round((Date.now() - state.activeTimer.start) / 60000));
  const entry = await api('POST', '/time', { task_id: state.activeTimer.taskId, duration_minutes: mins, date: new Date().toISOString().slice(0, 10), note: 'Timer' });
  if (entry?.id) state.timeEntries.unshift(entry);
  state.activeTimer = null; state.timerInterval = null;
  renderContent(); toast(`Logged ${mins} minutes`);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function fmtDate(str) { if (!str) return ''; return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }); }
function fmtDateTime(str) { if (!str) return ''; return new Date(str).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closePanel(); } });

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  const saved = localStorage.getItem('tf_token');
  if (saved) {
    state.token = saved;
    const me = await api('GET', '/auth/me');
    if (me?.id) {
      state.user = me; state.lang = me.language || 'en';
      document.body.classList.toggle('rtl', state.lang === 'ar');
      await loadAll(); connectSocket();
    } else { state.token = null; localStorage.removeItem('tf_token'); }
  }
  render();
})();
