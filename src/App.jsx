import { useState, useEffect, useRef } from "react";

const ADMIN_PASSWORD = "Helloteam";
const TEAM = ["Sera Lynn Elina","Henry Kisambira","Alicia Pieuse Lugano","Amos Bogere","Joyce Nabukenya","Peter Mwanja","David Sekamanya","Timothy Kawanguzi","Edward Kasule","Moreen Nassolo","Meshack","Charles Sekidde","Nicholas Onapa","Alexander Tumusiime"];
const INITIALS = {"Sera Lynn Elina":"SL","Henry Kisambira":"HK","Alicia Pieuse Lugano":"AP","Amos Bogere":"AB","Joyce Nabukenya":"JN","Peter Mwanja":"PM","David Sekamanya":"DS","Timothy Kawanguzi":"TK","Edward Kasule":"EK","Moreen Nassolo":"MN","Meshack":"ME","Charles Sekidde":"CS","Nicholas Onapa":"NO","Alexander Tumusiime":"AT"};
const PALETTE = ["#d4820a","#4a7c59","#b84c1e","#6a5c48","#8a6a9a","#3a6a8a","#7a9a4a","#9a4a6a","#4a7c8a","#c0522a","#5a8a6a","#8a4a2a","#3a7a9a","#9a6a3a"];
const PILLARS = [
  {icon:"🎯",label:"KPI & Target Achievement",desc:"Hit committed deliverables — client work, training targets, placements, revenue"},
  {icon:"💻",label:"Quality of Work Delivered",desc:"World-class output — web, design, film, brand work that represents ERA92 Elevate's standard"},
  {icon:"🌍",label:"Mission Impact",desc:"Directly moved the needle on youth empowerment — reached students, placed someone, opened a door"},
  {icon:"🤝",label:"Team & Community Contribution",desc:"Uplifted teammates, students or community — mentored, collaborated, filled gaps without being asked"},
  {icon:"💡",label:"Innovation & Problem Solving",desc:"Found a smarter, faster or more creative way — brought a new idea that made ERA92 better"},
  {icon:"🔥",label:"Attitude & Consistency",desc:"Showed up fully every week — reliable, resilient, solutions-focused especially when things got hard"},
];

// SCHEDULE: Opens Mon 07:00 | Closes Fri 18:00 | Announces Mon 07:30
function getNowInfo() {
  const n = new Date();
  return { day: n.getDay(), mins: n.getHours() * 60 + n.getMinutes(), date: n };
}
function checkVotingOpen() {
  const { day, mins } = getNowInfo();
  if (day === 1 && mins >= 420) return true;   // Mon from 07:00
  if (day >= 2 && day <= 4) return true;        // Tue Wed Thu all day
  if (day === 5 && mins < 1080) return true;    // Fri before 18:00
  return false;
}
function getStatus() {
  const { day, mins } = getNowInfo();
  if (day === 1 && mins < 420) return "soon";
  if ((day === 5 && mins >= 1080) || day === 6 || day === 0) return "closed";
  if (checkVotingOpen()) return "open";
  return "closed";
}
function checkShouldAnnounce() {
  const { day, mins } = getNowInfo();
  return day === 1 && mins >= 450; // Mon 07:30
}
function countdownTo(targetDay, targetH, targetM) {
  const now = new Date();
  const next = new Date(now);
  let days = (targetDay - now.getDay() + 7) % 7;
  if (days === 0 && now.getHours() * 60 + now.getMinutes() >= targetH * 60 + targetM) days = 7;
  next.setDate(now.getDate() + days);
  next.setHours(targetH, targetM, 0, 0);
  const ms = Math.max(next - now, 0);
  return { d: Math.floor(ms / 86400000), h: Math.floor((ms % 86400000) / 3600000), m: Math.floor((ms % 3600000) / 60000), s: Math.floor((ms % 60000) / 1000) };
}
function fmtCountdown(cd) {
  return `${cd.d > 0 ? cd.d + "d " : ""}${String(cd.h).padStart(2,"0")}h ${String(cd.m).padStart(2,"0")}m ${String(cd.s).padStart(2,"0")}s`;
}
function getWeekId(date = new Date()) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w = new Date(d.getFullYear(), 0, 4);
  return `${d.getFullYear()}-W${String(1 + Math.round(((d - w) / 86400000 - 3 + (w.getDay() + 6) % 7) / 7)).padStart(2, "0")}`;
}
function getWeekNum(date = new Date()) { return parseInt(getWeekId(date).split("-W")[1]); }
function getPrevWeekId() {
  const d = new Date(); const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) - 1);
  return getWeekId(d);
}
function memberColor(name) { return PALETTE[TEAM.indexOf(name) % PALETTE.length] || "#d4820a"; }
function fmtDate(ts) { return new Date(ts).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }

const SK = { scores: "era92_sc", history: "era92_hi", votes: "era92_vo", ann: "era92_an", voted: "era92_vd" };
function blankScores() { return Object.fromEntries(TEAM.map(n => [n, { score: 0, wins: 0, reason: "No nominations yet" }])); }

function buildWinner(votes, weekId) {
  if (!votes || !votes.length) return null;
  const tally = {};
  votes.forEach(v => { tally[v.nominee] = (tally[v.nominee] || 0) + 1; });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const [winner, count] = sorted[0];
  const cCount = {};
  votes.filter(v => v.nominee === winner).forEach(v => (v.pillars || []).forEach(p => { cCount[p] = (cCount[p] || 0) + 1; }));
  const topP = Object.entries(cCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => p);
  const reasons = votes.filter(v => v.nominee === winner && v.reason).map(v => v.reason);
  const reason = topP.length ? `Recognised for: ${topP.join(", ")}${reasons[0] ? ` — "${reasons[0]}"` : ""}` : reasons[0] || "Outstanding performance this week";
  return { weekId, weekNum: getWeekNum(), winner, votes: count, reason, tally: Object.fromEntries(sorted), ts: new Date().toISOString() };
}

export default function App() {
  const [tab, setTab] = useState("board");
  const [scores, setScores] = useState(blankScores());
  const [history, setHistory] = useState([]);
  const [allVotes, setAllVotes] = useState({});
  const [announced, setAnnounced] = useState({});
  const [votedMap, setVotedMap] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdErr, setPwdErr] = useState(false);
  const [toast, setToast] = useState(null);
  const [tick, setTick] = useState(0);
  const timerRef = useRef(null);

  const weekId = getWeekId();
  const weekNum = getWeekNum();
  const status = getStatus();
  const votingOpen = checkVotingOpen();
  const weekVotes = allVotes[weekId] || [];

  const cd = votingOpen ? countdownTo(5, 18, 0) : status === "soon" ? countdownTo(1, 7, 0) : countdownTo(1, 7, 30);
  const cdLabel = votingOpen ? "Closes in" : status === "soon" ? "Opens in" : "Announces in";

  useEffect(() => { timerRef.current = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(timerRef.current); }, []);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(SK.scores); if (r) setScores(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get(SK.history); if (r) setHistory(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get(SK.votes); if (r) setAllVotes(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get(SK.ann); if (r) setAnnounced(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get(SK.voted); if (r) setVotedMap(JSON.parse(r.value)); } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    tryAnnounce();
    const iv = setInterval(tryAnnounce, 60000);
    return () => clearInterval(iv);
  }, [loaded, announced, allVotes]);

  function tryAnnounce() {
    if (!checkShouldAnnounce()) return;
    const prev = getPrevWeekId();
    if (announced[prev]) return;
    const votes = allVotes[prev] || [];
    if (!votes.length) return;
    const entry = buildWinner(votes, prev);
    if (!entry) return;
    doAnnounce(entry, prev);
    showToast(`⚡ ${entry.winner} is Super Striker of Week ${entry.weekNum}!`);
  }

  function doAnnounce(entry, wkId) {
    setScores(prev => {
      const next = { ...prev };
      Object.entries(entry.tally).forEach(([name, count], i) => {
        if (!next[name]) next[name] = { score: 0, wins: 0, reason: "" };
        next[name] = { ...next[name], score: next[name].score + count + (i === 0 ? 3 : 0) };
      });
      next[entry.winner] = { ...next[entry.winner], wins: (next[entry.winner].wins || 0) + 1, reason: entry.reason };
      window.storage.set(SK.scores, JSON.stringify(next));
      return next;
    });
    setHistory(prev => { const n = [...prev, entry]; window.storage.set(SK.history, JSON.stringify(n)); return n; });
    setAnnounced(prev => { const n = { ...prev, [wkId]: true }; window.storage.set(SK.ann, JSON.stringify(n)); return n; });
  }

  async function submitVote(voter, nominee, pillars, reason) {
    if (!votingOpen) return { err: "Voting is closed. Opens Monday 7:00 AM, closes Friday 6:00 PM." };
    if ((votedMap[weekId] || []).includes(voter)) return { err: "You already voted this week." };
    if (voter === nominee) return { err: "You cannot nominate yourself." };
    const vote = { voter, nominee, pillars, reason, ts: new Date().toISOString() };
    const nv = { ...allVotes, [weekId]: [...weekVotes, vote] };
    const nd = { ...votedMap, [weekId]: [...(votedMap[weekId] || []), voter] };
    setAllVotes(nv); setVotedMap(nd);
    await window.storage.set(SK.votes, JSON.stringify(nv));
    await window.storage.set(SK.voted, JSON.stringify(nd));
    return { ok: true };
  }

  async function forceAnnounce() {
    if (!weekVotes.length) { alert("No votes yet this week."); return; }
    if (announced[weekId]) { alert("Already announced this week."); return; }
    const entry = buildWinner(weekVotes, weekId);
    doAnnounce(entry, weekId);
    showToast(`⚡ ${entry.winner} is Super Striker of Week ${weekNum}!`);
  }

  async function resetWeek() {
    if (!window.confirm("Reset all votes for the current week?")) return;
    const nv = { ...allVotes }; delete nv[weekId];
    const nd = { ...votedMap }; delete nd[weekId];
    const na = { ...announced }; delete na[weekId];
    setAllVotes(nv); setVotedMap(nd); setAnnounced(na);
    await window.storage.set(SK.votes, JSON.stringify(nv));
    await window.storage.set(SK.voted, JSON.stringify(nd));
    await window.storage.set(SK.ann, JSON.stringify(na));
    showToast("Week reset successfully.");
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 6000); }

  const latestWin = [...history].reverse()[0] || null;
  const sortedBoard = TEAM.map(n => ({ name: n, ...(scores[n] || { score: 0, wins: 0, reason: "No nominations yet" }) })).sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sortedBoard.map(s => s.score), 1);

  const C = { ink: "#1a1208", paper: "#f5f0e8", amber: "#d4820a", amberL: "#f0b340", amberP: "#fdf3dc", rust: "#b84c1e", sage: "#4a7c59", cream: "#faf6ef", mid: "#7a6a50", border: "#ddd4bc" };

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1208", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48, animation: "spin 1s linear infinite" }}>⚡</div>
      <div style={{ fontFamily: "monospace", color: "#d4820a", letterSpacing: 3, fontSize: 12 }}>LOADING ERA92 SUPER STRIKER...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const tabStyle = (id) => ({
    background: "none", border: "none", borderBottom: `2px solid ${tab === id ? (id === "admin" ? "#b84c1e" : "#d4820a") : "transparent"}`,
    color: tab === id ? (id === "admin" ? "#ff7755" : "#f0b340") : "#6a5c48",
    fontFamily: "monospace", fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
    padding: "13px 16px", cursor: "pointer", transition: "all 0.2s"
  });

  const statusColor = status === "open" ? "#4a7c59" : status === "soon" ? "#d4820a" : "#b84c1e";
  const statusLabel = status === "open" ? "🟢 VOTING OPEN" : status === "soon" ? "⏳ OPENS SOON" : "🔴 VOTING CLOSED";

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: "DM Sans, sans-serif", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pop { 0%{transform:scale(0.6);opacity:0} 80%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        select { font-family: DM Sans, sans-serif; }
        textarea { font-family: DM Sans, sans-serif; }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: C.sage, color: "white", padding: "12px 24px", borderRadius: 4, fontFamily: "monospace", fontSize: 12, letterSpacing: 1, zIndex: 9999, animation: "slideDown 0.3s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: C.ink, padding: "32px 40px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -70, right: -50, width: 320, height: 320, border: "50px solid rgba(212,130,10,0.09)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, position: "relative" }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.amber, marginBottom: 8 }}>ERA92 Elevate · 2026 Performance Tracker</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px,4vw,46px)", fontWeight: 900, lineHeight: 1.05, color: C.paper }}>
              Super Striker <span style={{ color: C.amberL }}>of the Week</span>
            </h1>
            <p style={{ fontSize: 13, color: "#a89880", marginTop: 6 }}>ERA92 Elevate's 6-pillar peer nomination · Auto-announced every Monday 7:30 AM</p>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ background: statusColor, color: "white", padding: "4px 12px", borderRadius: 3, fontFamily: "monospace", fontSize: 10, letterSpacing: 1.5 }}>{statusLabel}</span>
              <span style={{ background: "rgba(255,255,255,0.07)", color: "#a89880", padding: "4px 12px", borderRadius: 3, fontFamily: "monospace", fontSize: 10 }}>{cdLabel}: {fmtCountdown(cd)}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ background: C.amber, color: C.ink, padding: "7px 18px", borderRadius: 3, fontFamily: "monospace", fontSize: 11, fontWeight: 600, letterSpacing: 1.5 }}>WEEK {weekNum} · {new Date().getFullYear()}</div>
            <div style={{ color: "#5a4e3e", fontFamily: "monospace", fontSize: 10, marginTop: 5 }}>{weekVotes.length} vote{weekVotes.length !== 1 ? "s" : ""} this week</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: C.ink, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "0 40px", flexWrap: "wrap" }}>
        {[["board","🏆 Leaderboard"],["vote","⚡ Nominate"],["history","📅 Winners"],["howto","ℹ️ How It Works"],["admin","🔐 Admin"]].map(([id, label]) => (
          <button key={id} style={tabStyle(id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* PAGE CONTENT */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* ── LEADERBOARD ── */}
        {tab === "board" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: C.amber, borderRadius: 4, overflow: "hidden", marginBottom: 24 }}>
              {[[14,"Strikers"],[history.length,"Weeks Done"],[weekVotes.length,"Votes This Week"],[52-history.length,"Weeks Left"]].map(([n,l]) => (
                <div key={l} style={{ padding: "18px 12px", borderRight: "1px solid rgba(255,255,255,0.2)", textAlign: "center", lastChild: { borderRight: "none" } }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(26,18,8,0.6)", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* winner banner */}
            {latestWin ? (
              <div style={{ background: "linear-gradient(135deg,#1a1208,#2a1a06)", border: `2px solid #c9a227`, borderRadius: 6, padding: "22px 28px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{ fontSize: 48, flexShrink: 0 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.amber, marginBottom: 3 }}>Super Striker · Week {latestWin.weekNum} · Announced Monday 7:30 AM</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(20px,3vw,32px)", fontWeight: 900, color: C.amberL, lineHeight: 1.1 }}>{latestWin.winner}</div>
                  <div style={{ fontSize: 13, color: "#a89880", marginTop: 5, fontStyle: "italic" }}>"{latestWin.reason}"</div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 44, fontWeight: 700, color: "#c9a227", lineHeight: 1 }}>{latestWin.votes}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5c48", letterSpacing: 2, textTransform: "uppercase" }}>nominations</div>
                </div>
              </div>
            ) : (
              <div style={{ background: C.cream, border: `2px dashed ${C.border}`, borderRadius: 6, padding: "24px 28px", marginBottom: 24, textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 6 }}>⚡ Week {weekNum} — Voting in Progress</div>
                <p style={{ fontSize: 13, color: C.mid }}>First Super Striker auto-announced <strong>Monday 7:30 AM</strong>. Cast your nomination!</p>
              </div>
            )}

            {/* countdown bar */}
            <div style={{ background: C.ink, borderRadius: 4, padding: "13px 22px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#6a5c48", letterSpacing: 2, textTransform: "uppercase" }}>{cdLabel}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.amberL }}>{fmtCountdown(cd)}</div>
            </div>

            {/* board list */}
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Annual Leaderboard</div>
            <div style={{ fontSize: 12, color: C.mid, fontFamily: "monospace", marginBottom: 16 }}>6 ERA92 pillars · Auto-updated Monday 7:30 AM · Top scorer wins Year-End Award</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedBoard.map((m, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
                const bg = i === 0 ? "#fffae8" : i === 1 ? "#f5f8fa" : i === 2 ? "#fdf0e8" : C.cream;
                const bd = i === 0 ? "#c9a227" : i === 1 ? "#8a9ba8" : i === 2 ? "#a0522d" : C.border;
                const bar = i === 0 ? "#c9a227" : i === 1 ? "#8a9ba8" : i === 2 ? "#a0522d" : C.amber;
                const pct = Math.round((m.score / maxScore) * 100);
                return (
                  <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: bg, border: `1px solid ${bd}`, borderRadius: 4 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, width: 30, textAlign: "center", flexShrink: 0 }}>{medal}</div>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: `${memberColor(m.name)}22`, color: memberColor(m.name), flexShrink: 0 }}>{INITIALS[m.name]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{m.wins} win{m.wins !== 1 ? "s" : ""} · <em>{m.reason}</em></div>
                    </div>
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <div style={{ background: C.border, borderRadius: 2, height: 6 }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: bar, transition: "width 0.8s" }} /></div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 50 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, color: C.amber, lineHeight: 1 }}>{m.score}</div>
                      <div style={{ fontSize: 10, color: C.mid, fontFamily: "monospace" }}>pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NOMINATE ── */}
        {tab === "vote" && (
          <VoteTab weekNum={weekNum} weekId={weekId} votedMap={votedMap} submitVote={submitVote} status={status} votingOpen={votingOpen} cd={cd} cdLabel={cdLabel} C={C} />
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Weekly Winners · 2026</div>
            <div style={{ fontSize: 12, color: C.mid, fontFamily: "monospace", marginBottom: 22 }}>Auto-announced every Monday 7:30 AM</div>
            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24 }}>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: C.mid }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>⚡</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 6 }}>No winners yet</div>
                  <div style={{ fontSize: 13 }}>First Super Striker auto-announced Monday 7:30 AM!</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...history].reverse().map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, padding: "13px 16px", background: C.paper, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.amber}`, borderRadius: "0 4px 4px 0" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: C.mid, textTransform: "uppercase", whiteSpace: "nowrap", marginTop: 2, minWidth: 60 }}>Week {w.weekNum}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{w.winner} ⚡</div>
                        <div style={{ fontSize: 11, color: C.amber, fontFamily: "monospace" }}>{w.votes} nominations · {fmtDate(w.ts)}</div>
                        <div style={{ fontSize: 13, color: C.mid, marginTop: 3, fontStyle: "italic" }}>"{w.reason}"</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        {tab === "howto" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>How It Works</div>
            <div style={{ fontSize: 12, color: C.mid, fontFamily: "monospace", marginBottom: 22 }}>Everything the ERA92 Elevate team needs to know</div>
            <div style={{ background: C.ink, color: C.paper, borderRadius: 4, padding: "24px 28px", marginBottom: 22 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: C.amberL, marginBottom: 14 }}>🤖 Fully Automated — You Do Nothing</div>
              {[["1","Monday 7:00 AM","Voting opens. Each member submits one private nomination."],["2","Mon–Fri","Vote any time. Voting window closes Friday at 6:00 PM sharp."],["3","Monday 7:30 AM","System auto-tallies, picks winner, updates scores, announces result."],["4","Year-End","Highest cumulative score after 52 weeks wins Super Striker of the Year."]].map(([n,t,d]) => (
                <div key={n} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ background: C.amber, color: C.ink, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0, marginTop: 1 }}>{n}</div>
                  <div style={{ fontSize: 13, color: "#c8b89a" }}><strong style={{ color: C.paper }}>{t}:</strong> {d}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 22 }}>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.amber, marginBottom: 14 }}>The 6 ERA92 Elevate Assessment Pillars</div>
                {PILLARS.map(p => (
                  <div key={p.label} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 10px", background: C.paper, borderRadius: 3, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</div><div style={{ fontSize: 11, color: C.mid, marginTop: 1, lineHeight: 1.4 }}>{p.desc}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 22 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.amber, marginBottom: 12 }}>Privacy Rules</div>
                  {[["🙈","No live vote counts shown during the week"],["🔒","Nobody sees who you nominated"],["📣","Only winner + reason is announced — not raw votes"],["🚫","You cannot nominate yourself"]].map(([ic,t]) => (
                    <div key={t} style={{ display: "flex", gap: 10, fontSize: 13, marginBottom: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{ic}</span><span style={{ color: C.mid }}>{t}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 22 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.amber, marginBottom: 12 }}>Scoring</div>
                  {[["+3","Win the week (auto)"],["+1","Per nomination received"],["×2","Double week (admin only)"]].map(([p,d]) => (
                    <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
                      <span style={{ color: C.mid }}>{d}</span><strong style={{ color: C.amber, fontFamily: "monospace" }}>{p}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ADMIN ── */}
        {tab === "admin" && (
          adminOpen
            ? <AdminPanel scores={scores} allVotes={allVotes} weekId={weekId} weekNum={weekNum} weekVotes={weekVotes} forceAnnounce={forceAnnounce} resetWeek={resetWeek} lock={() => setAdminOpen(false)} C={C} />
            : (
              <div style={{ maxWidth: 380, margin: "60px auto", textAlign: "center", background: C.cream, border: `1px solid ${C.border}`, borderRadius: 6, padding: "40px 28px", animation: "fadeUp 0.4s ease" }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>🔐</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Admin Access</div>
                <div style={{ fontSize: 13, color: C.mid, marginBottom: 20 }}>Enter your admin password to view raw vote data.</div>
                <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === "Enter" && (() => { if (pwd === ADMIN_PASSWORD) { setAdminOpen(true); setPwdErr(false); setPwd(""); } else { setPwdErr(true); setPwd(""); } })()} placeholder="••••••" style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 3, padding: "11px 14px", fontSize: 16, width: "100%", textAlign: "center", letterSpacing: 6, outline: "none", color: C.ink, marginBottom: 10 }} />
                <button onClick={() => { if (pwd === ADMIN_PASSWORD) { setAdminOpen(true); setPwdErr(false); setPwd(""); } else { setPwdErr(true); setPwd(""); } }} style={{ background: C.ink, color: C.paper, border: "none", borderRadius: 3, padding: "12px 24px", fontSize: 13, fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", width: "100%" }}>Unlock →</button>
                {pwdErr && <div style={{ color: C.rust, fontSize: 12, marginTop: 8, fontFamily: "monospace" }}>❌ Incorrect password</div>}
              </div>
            )
        )}

      </div>

      <div style={{ textAlign: "center", padding: 20, background: C.ink, color: "#4a3c2c", fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>
        ERA92 ELEVATE · SUPER STRIKER OF THE WEEK · OPENS MON 7AM · CLOSES FRI 6PM · ANNOUNCES MON 7:30AM
      </div>
    </div>
  );
}

function VoteTab({ weekNum, weekId, votedMap, submitVote, status, votingOpen, cd, cdLabel, C }) {
  const [voter, setVoter] = useState("");
  const [nominee, setNominee] = useState("");
  const [pillars, setPillars] = useState([]);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const alreadyVoted = voter && (votedMap[weekId] || []).includes(voter);

  function togglePillar(label) { setPillars(prev => prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]); }

  async function handleSubmit() {
    if (!voter) { setErr("Please select your name."); return; }
    if (!nominee) { setErr("Please select a teammate to nominate."); return; }
    if (!pillars.length) { setErr("Please select at least one ERA92 Elevate pillar."); return; }
    if (!reason.trim()) { setErr("Please describe what they did that stood out."); return; }
    setLoading(true); setErr("");
    const r = await submitVote(voter, nominee, pillars, reason);
    setLoading(false);
    if (r.err) { setErr(r.err); return; }
    setDone(true);
  }

  const sel = { background: C.cream, border: `1px solid ${C.border}`, borderRadius: 3, padding: "10px 14px", fontSize: 14, color: C.ink, outline: "none", width: "100%", cursor: "pointer" };

  if (status === "closed") return (
    <div style={{ animation: "fadeUp 0.4s ease", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.ink, borderRadius: 6, padding: "44px 36px" }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🔴</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: C.amberL, marginBottom: 10 }}>Voting is Closed</div>
        <div style={{ fontSize: 14, color: "#a89880", lineHeight: 1.8, marginBottom: 24 }}>
          Voting closed <strong style={{ color: "white" }}>Friday at 6:00 PM</strong>.<br />
          Next window opens <strong style={{ color: "white" }}>Monday at 7:00 AM</strong>.<br />
          Winner announced <strong style={{ color: "white" }}>Monday at 7:30 AM</strong>.
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, padding: "14px 18px", display: "inline-block" }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5c48", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Announces in</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: C.amberL }}>{fmtCountdown(cd)}</div>
        </div>
      </div>
    </div>
  );

  if (status === "soon") return (
    <div style={{ animation: "fadeUp 0.4s ease", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: C.ink, borderRadius: 6, padding: "44px 36px" }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>⏳</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: C.amberL, marginBottom: 10 }}>Voting Opens Soon</div>
        <div style={{ fontSize: 14, color: "#a89880", lineHeight: 1.8, marginBottom: 24 }}>Voting opens today at <strong style={{ color: "white" }}>7:00 AM</strong>. Come back then!</div>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, padding: "14px 18px", display: "inline-block" }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a5c48", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Opens in</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: C.amberL }}>{fmtCountdown(cd)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Nominate a Super Striker</div>
      <div style={{ fontSize: 12, color: C.mid, fontFamily: "monospace", marginBottom: 22 }}>Week {weekNum} · 🟢 Voting Open · Closes Friday 6:00 PM · {fmtCountdown(cd)} remaining</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: C.amber, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            Your Nomination <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          {done ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "32px 16px", gap: 12, animation: "pop 0.4s ease" }}>
              <div style={{ fontSize: 52 }}>⚡</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#4a7c59" }}>Nomination Submitted!</div>
              <div style={{ fontSize: 13, color: C.mid, maxWidth: 280, lineHeight: 1.6 }}>Your vote is saved privately. Winner auto-announced <strong>Monday 7:30 AM</strong>.</div>
              <div style={{ background: C.ink, color: C.amberL, fontFamily: "monospace", fontSize: 11, letterSpacing: 2, padding: "9px 18px", borderRadius: 3, textTransform: "uppercase" }}>🤖 Auto-Announce: Monday 7:30 AM</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: C.ink, color: C.amberL, borderRadius: 3, padding: "10px 14px", fontSize: 12, fontFamily: "monospace", lineHeight: 1.6 }}>🔒 Your vote is completely private. No one sees who you nominate.</div>
              {err && <div style={{ background: "#fdf0e8", border: `1px solid ${C.rust}`, borderRadius: 3, padding: "10px 14px", fontSize: 13, color: C.rust }}>{err}</div>}
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.mid, marginBottom: 6 }}>Your Name</div>
                <select style={sel} value={voter} onChange={e => { setVoter(e.target.value); setErr(""); }}>
                  <option value="">— Who are you? —</option>
                  {TEAM.map(n => <option key={n}>{n}</option>)}
                </select>
                {alreadyVoted && <div style={{ fontSize: 12, color: C.rust, marginTop: 4, fontFamily: "monospace" }}>⚠ You already voted this week.</div>}
              </div>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.mid, marginBottom: 6 }}>Nominate a Teammate</div>
                <select style={sel} value={nominee} onChange={e => { setNominee(e.target.value); setErr(""); }}>
                  <option value="">— Select a teammate —</option>
                  {TEAM.filter(n => n !== voter).map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.mid, marginBottom: 8 }}>Why do they deserve it? Pick all that apply</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {PILLARS.map(p => {
                    const sel = pillars.includes(p.label);
                    return (
                      <div key={p.label} onClick={() => togglePillar(p.label)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: sel ? C.amberP : C.paper, border: `1px solid ${sel ? C.amber : C.border}`, borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }}>
                        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{p.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</div>
                          <div style={{ fontSize: 11, color: C.mid, marginTop: 1, lineHeight: 1.4 }}>{p.desc}</div>
                        </div>
                        {sel && <span style={{ color: C.amber, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.mid, marginBottom: 6 }}>What did they do that stood out?</div>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe specifically what they did that stood out this week…" style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 3, padding: "10px 13px", fontSize: 14, color: C.ink, outline: "none", width: "100%", resize: "vertical", minHeight: 72 }} />
              </div>
              <button onClick={handleSubmit} disabled={!votingOpen || alreadyVoted || loading} style={{ background: (!votingOpen || alreadyVoted) ? "#ddd4bc" : C.amber, color: (!votingOpen || alreadyVoted) ? "#a89880" : C.ink, border: "none", borderRadius: 3, padding: "13px 24px", fontSize: 14, fontWeight: 600, cursor: (!votingOpen || alreadyVoted) ? "not-allowed" : "pointer", alignSelf: "flex-start", transition: "background 0.2s" }}>
                {loading ? "Submitting…" : alreadyVoted ? "Already Voted This Week" : "Submit Nomination ⚡"}
              </button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 22 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.amber, marginBottom: 12 }}>🕐 This Week's Schedule</div>
            {[["🟢","Monday 7:00 AM","Voting opens"],["🔴","Friday 6:00 PM","Voting closes"],["🤖","Monday 7:30 AM","Winner auto-announced"]].map(([ic,t,d]) => (
              <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ic}</span>
                <div style={{ fontSize: 13 }}><strong>{t}</strong><br /><span style={{ color: C.mid, fontSize: 12 }}>{d}</span></div>
              </div>
            ))}
          </div>
          <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 22 }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.amber, marginBottom: 12 }}>Scoring</div>
            {[["+3","Win the week"],["+1","Per nomination received"],["×2","Double week"]].map(([p,d]) => (
              <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.mid }}>{d}</span><strong style={{ color: C.amber, fontFamily: "monospace" }}>{p}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ scores, allVotes, weekId, weekNum, weekVotes, forceAnnounce, resetWeek, lock, C }) {
  const tally = {};
  weekVotes.forEach(v => { tally[v.nominee] = (tally[v.nominee] || 0) + 1; });
  const tallyList = Object.entries(tally).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <div style={{ background: C.rust, color: "white", borderRadius: 4, padding: "13px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>🔐 Admin Dashboard</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Confidential — do not share this screen.</div>
        </div>
        <button onClick={lock} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 3, padding: "7px 14px", fontSize: 11, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>🔒 Lock</button>
      </div>

      <div style={{ background: C.ink, borderRadius: 4, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 28 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: C.amberL, marginBottom: 2 }}>Automation Active</div>
          <div style={{ fontSize: 13, color: "#a89880" }}>Opens Mon 7:00 AM · Closes Fri 6:00 PM · Announces Mon 7:30 AM · <strong style={{ color: C.paper }}>No action needed from you.</strong></div>
        </div>
        <div style={{ background: "#4a7c59", color: "white", padding: "4px 12px", borderRadius: 3, fontFamily: "monospace", fontSize: 10, letterSpacing: 2 }}>● RUNNING</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: C.rust, marginBottom: 14 }}>Week {weekNum} Live Tally</div>
          {tallyList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: C.mid, fontSize: 13 }}>No votes yet this week.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {tallyList.map(([name, count], i) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: i === 0 ? "#fffae8" : C.paper, border: `1px solid ${i === 0 ? "#c9a227" : C.border}`, borderRadius: 4 }}>
                  {i === 0 && <span style={{ fontSize: 16 }}>👑</span>}
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{name}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.amber, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 10, color: C.mid, fontFamily: "monospace" }}>votes</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: C.amberP, border: `1px solid ${C.amber}`, borderRadius: 4, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Manual Controls</div>
            <div style={{ fontSize: 12, color: C.mid, marginBottom: 10 }}>System auto-announces Monday 7:30 AM. Use only if needed.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={forceAnnounce} style={{ background: "#4a7c59", color: "white", border: "none", borderRadius: 3, padding: "9px 14px", fontSize: 12, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>⚡ Announce Now</button>
              <button onClick={resetWeek} style={{ background: "none", color: C.rust, border: `1px solid ${C.rust}`, borderRadius: 3, padding: "9px 14px", fontSize: 12, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>🗑 Reset Week</button>
            </div>
          </div>
        </div>

        <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: C.rust, marginBottom: 14 }}>Raw Votes This Week ({weekVotes.length})</div>
          <div style={{ overflowY: "auto", maxHeight: 320 }}>
            {weekVotes.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: C.mid, fontSize: 13 }}>No votes submitted yet.</div>
            ) : weekVotes.map((v, i) => (
              <div key={i} style={{ padding: "9px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>{v.voter}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: C.mid }}>{new Date(v.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div>→ <span style={{ background: C.amberP, border: `1px solid ${C.amber}`, borderRadius: 10, padding: "1px 10px", fontSize: 11, fontFamily: "monospace" }}>{v.nominee}</span></div>
                {v.pillars?.length > 0 && <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>{v.pillars.map(p => <span key={p} style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 8, padding: "1px 8px", fontSize: 10, fontFamily: "monospace", color: C.mid }}>{p}</span>)}</div>}
                {v.reason && <div style={{ fontSize: 12, color: C.mid, fontStyle: "italic", marginTop: 2 }}>"{v.reason}"</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 4, padding: 20 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: C.rust, marginBottom: 14 }}>All Scores — Auto-managed</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {TEAM.map(n => {
            const s = scores[n] || { score: 0, wins: 0 };
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", background: C.paper, border: `1px solid ${C.border}`, borderRadius: 3 }}>
                <div style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{n}</div>
                <div style={{ fontSize: 11, color: C.mid, fontFamily: "monospace" }}>{s.wins} win{s.wins !== 1 ? "s" : ""}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: C.amber, minWidth: 36, textAlign: "right" }}>{s.score}</div>
                <div style={{ fontSize: 10, color: C.mid, fontFamily: "monospace" }}>pts</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
