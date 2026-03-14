import { useState, useEffect, useCallback } from 'react';
import { ADMIN_PW, USER_KEY, ADMIN_KEY, memberColor, getInitials } from './constants.js';
import SuperStriker from './components/SuperStriker.jsx';
import TaskTracker from './components/TaskTracker.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState('');
  const [isAdmin, setIsAdmin]         = useState(false);
  const [authed, setAuthed]           = useState(false);
  const [activeApp, setActiveApp]     = useState('ss');
  const [toast, setToast]             = useState(null);

  // Persist login across page reloads
  useEffect(() => {
    const u = localStorage.getItem(USER_KEY);
    const a = localStorage.getItem(ADMIN_KEY) === '1';
    if (u) { setCurrentUser(u); setIsAdmin(a); setAuthed(true); }
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  function handleEnter(name) {
    setCurrentUser(name); setIsAdmin(false);
    localStorage.setItem(USER_KEY, name);
    localStorage.removeItem(ADMIN_KEY);
    setAuthed(true);
    showToast(`Welcome, ${name.split(' ')[0]}! ⚡`);
  }

  function handleAdminEnter() {
    setCurrentUser('Admin'); setIsAdmin(true);
    localStorage.setItem(USER_KEY, 'Admin');
    localStorage.setItem(ADMIN_KEY, '1');
    setAuthed(true);
    showToast('Admin mode active ⚡');
  }

  function handleLogout() {
    if (!window.confirm('Log out?')) return;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setAuthed(false); setCurrentUser(''); setIsAdmin(false);
  }

  if (!authed) return <AuthScreen onEnter={handleEnter} onAdmin={handleAdminEnter} />;

  const av = isAdmin ? '⚡' : getInitials(currentUser);
  const avColor = isAdmin ? 'var(--admin)' : memberColor(currentUser);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* GLOBAL HEADER */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoDot} />
          ERA92 <span style={{ color: 'var(--amber)', marginLeft: 4 }}>Elevate</span>
        </div>

        {/* APP SWITCHER */}
        <div style={styles.switcher}>
          <button
            style={{ ...styles.switchBtn, ...(activeApp === 'ss' ? styles.switchBtnActive : {}) }}
            onClick={() => setActiveApp('ss')}
          >⚡ Super Striker</button>
          <button
            style={{ ...styles.switchBtn, ...(activeApp === 'task' ? styles.switchBtnTask : {}) }}
            onClick={() => setActiveApp('task')}
          >📋 Task Tracker</button>
        </div>

        <div style={styles.hdrRight}>
          <div style={styles.liveBadge}><span style={styles.liveDot} />LIVE</div>
          {isAdmin && <div style={styles.adminBadge}>⚡ ADMIN</div>}
          <div style={{ ...styles.userBadge }} onClick={handleLogout} title="Click to log out">
            <div style={{ ...styles.uAv, background: avColor }}>{av}</div>
            <span>{isAdmin ? 'Admin' : currentUser.split(' ')[0]}</span>
          </div>
        </div>
      </header>

      {/* SECTIONS */}
      {activeApp === 'ss'   && <SuperStriker currentUser={currentUser} isAdmin={isAdmin} showToast={showToast} />}
      {activeApp === 'task' && <TaskTracker  currentUser={currentUser} isAdmin={isAdmin} showToast={showToast} />}

      <Toast message={toast} />
    </div>
  );
}

// ── AUTH SCREEN ──────────────────────────────────────────────
function AuthScreen({ onEnter, onAdmin }) {
  const [name, setName]       = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [pw, setPw]           = useState('');
  const [pwErr, setPwErr]     = useState(false);

  function submitName() {
    if (!name.trim()) return;
    onEnter(name.trim());
  }
  function submitAdmin() {
    if (pw === ADMIN_PW) { onAdmin(); }
    else { setPwErr(true); setPw(''); }
  }

  return (
    <div style={styles.authOverlay}>
      <div style={styles.authCard}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{showPw ? '🔐' : '⚡'}</div>
        <div style={styles.authTitle}>
          ERA92 <span style={{ color: showPw ? 'var(--admin)' : 'var(--amber)' }}>Elevate</span>
        </div>
        {!showPw ? (
          <>
            <p style={styles.authSub}>Enter your name to access the team dashboard — Super Striker voting and task board.</p>
            <input
              style={styles.authInput}
              placeholder="Your full name e.g. Joyce Nabukenya"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitName()}
              autoFocus
            />
            <button style={styles.authBtn} onClick={submitName}>Enter Dashboard →</button>
            <button style={styles.authLink} onClick={() => setShowPw(true)}>🔐 Admin Login</button>
          </>
        ) : (
          <>
            <p style={styles.authSub}>Enter the admin password to access full management controls.</p>
            <input
              style={styles.authInput}
              type="password"
              placeholder="Admin password"
              value={pw}
              onChange={e => { setPw(e.target.value); setPwErr(false); }}
              onKeyDown={e => e.key === 'Enter' && submitAdmin()}
              autoFocus
            />
            {pwErr && <div style={{ color:'var(--red)', fontSize:11, marginBottom:8, fontFamily:'DM Mono,monospace' }}>Incorrect password.</div>}
            <button style={{ ...styles.authBtn, background:'var(--admin)', color:'#fff' }} onClick={submitAdmin}>Unlock Admin →</button>
            <button style={styles.authLink} onClick={() => { setShowPw(false); setPwErr(false); }}>← Back</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── STYLES ──────────────────────────────────────────────────
const styles = {
  header: {
    background:'var(--surface)', borderBottom:'1px solid var(--border)',
    padding:'0 22px', height:56, display:'flex', alignItems:'center',
    justifyContent:'space-between', position:'sticky', top:0, zIndex:300, gap:10,
  },
  logo: {
    fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16,
    display:'flex', alignItems:'center', gap:8, flexShrink:0, color:'var(--text)',
  },
  logoDot: {
    width:7, height:7, background:'var(--amber)', borderRadius:'50%',
    animation:'pulse 2s infinite',
  },
  switcher: {
    display:'flex', gap:2, background:'var(--surface2)',
    border:'1px solid var(--border2)', borderRadius:8, padding:3,
  },
  switchBtn: {
    background:'none', border:'none', borderRadius:6, color:'var(--text2)',
    fontFamily:'DM Mono,monospace', fontSize:10, letterSpacing:'1.5px',
    textTransform:'uppercase', padding:'6px 14px', cursor:'pointer',
    transition:'all .2s', whiteSpace:'nowrap',
  },
  switchBtnActive: { background:'var(--amber)', color:'var(--ink)', fontWeight:600 },
  switchBtnTask:   { background:'var(--green)', color:'var(--ink)', fontWeight:600 },
  hdrRight: { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  liveBadge: {
    fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--green)',
    display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
  },
  liveDot: {
    width:6, height:6, background:'var(--green)', borderRadius:'50%',
    display:'inline-block', animation:'pulse 2s infinite',
  },
  adminBadge: {
    background:'rgba(185,124,249,.1)', border:'1px solid var(--admin)',
    borderRadius:20, padding:'3px 10px', fontSize:10, color:'var(--admin)',
    fontFamily:'DM Mono,monospace', letterSpacing:'1px',
  },
  userBadge: {
    background:'var(--surface2)', border:'1px solid var(--border2)',
    borderRadius:20, padding:'4px 11px', fontSize:12, cursor:'pointer',
    display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
  },
  uAv: {
    width:20, height:20, borderRadius:'50%', color:'var(--ink)',
    fontSize:9, fontWeight:700, display:'flex', alignItems:'center',
    justifyContent:'center', fontFamily:'Syne,sans-serif', flexShrink:0,
  },
  authOverlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,.93)',
    display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:400,
  },
  authCard: {
    background:'var(--surface)', border:'1px solid var(--border2)',
    borderRadius:14, padding:34, width:'100%', maxWidth:400, textAlign:'center',
  },
  authTitle: {
    fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, marginBottom:6,
  },
  authSub: { color:'var(--text2)', fontSize:12, marginBottom:20, lineHeight:1.6 },
  authInput: {
    width:'100%', background:'var(--bg)', border:'1px solid var(--border2)',
    borderRadius:6, padding:'9px 12px', color:'var(--text)',
    fontFamily:'DM Sans,sans-serif', fontSize:13, outline:'none',
    marginBottom:10, display:'block',
  },
  authBtn: {
    width:'100%', background:'var(--amber)', color:'var(--ink)', border:'none',
    borderRadius:6, padding:'11px 0', fontSize:14, fontWeight:600,
    cursor:'pointer', fontFamily:'DM Sans,sans-serif', marginBottom:10,
  },
  authLink: {
    background:'none', border:'none', color:'var(--text3)', fontSize:11,
    cursor:'pointer', fontFamily:'DM Mono,monospace', textDecoration:'underline',
    display:'block', margin:'0 auto',
  },
};
