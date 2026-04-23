import { useState, useEffect, useCallback } from "react";

var API = "https://schoolsaavy-backend-updated.onrender.com/api";

/* ====== HTTP CLIENT ====== */
var http = {
  request: async function(method, path, body, token) {
    var h = { "Content-Type": "application/json", Accept: "application/json" };
    if (token) h.Authorization = "Bearer " + token;
    var opts = { method: method, headers: h };
    if (body) opts.body = JSON.stringify(body);
    try {
      var r = await fetch(API + path, opts);
      return { ok: r.ok, data: await r.json() };
    } catch (err) {
      return { ok: false, data: { message: "Network error. Backend may be waking up — try again in 30s." } };
    }
  },
  get: function(p, t) { return http.request("GET", p, null, t); },
  post: function(p, b, t) { return http.request("POST", p, b, t); }
};

/* ====== ICONS ====== */
var I = {
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  file: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  out: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  pulse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9c.07-.28.04-.59-.18-.82l-.06-.06a2 2 0 112.83-2.83l.06.06c.23.22.54.25.82.18A1.65 1.65 0 009 4.68V3a2 2 0 014 0v.09c.03.63.37 1.2 1 1.51.28.07.59.04.82-.18l.06-.06a2 2 0 112.83 2.83l-.06.06c-.22.23-.25.54-.18.82.31.63.88.97 1.51 1H21a2 2 0 010 4h-.09c-.63.03-1.2.37-1.51 1z"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  school: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 22h20"/><path d="M6 22V6l6-4 6 4v16"/><path d="M10 22v-4h4v4"/><rect x="9" y="9" width="2" height="2" rx=".3"/><rect x="13" y="9" width="2" height="2" rx=".3"/><rect x="9" y="13" width="2" height="2" rx=".3"/><rect x="13" y="13" width="2" height="2" rx=".3"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
};

function Ic(props) {
  var s = props.size || 20;
  return <span style={{ width: s, height: s, display: "inline-flex", flexShrink: 0 }}>{props.icon}</span>;
}

/* ====== STYLES ====== */
var CSS = [
  '@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap");',
  ':root{--ink:#0c1222;--ink2:#1e293b;--mute:#64748b;--faint:#94a3b8;--line:#e2e8f0;--wash:#f1f5f9;--bg:#f8fafc;--w:#fff;--brand:#1e3a5f;--brand2:#2b5289;--acc:#c9963b;--acc2:#dbb06a;--accbg:rgba(201,150,59,.08);--g:#059669;--gbg:#ecfdf5;--r:#dc2626;--rbg:#fef2f2;--a:#d97706;--abg:#fffbeb;--b:#2563eb;--bbg:#eff6ff;--rd:10px;--s2:0 4px 24px rgba(0,0,0,.06);--s3:0 20px 60px rgba(0,0,0,.1)}',
  '*{margin:0;padding:0;box-sizing:border-box}',
  'body{font-family:"Outfit",sans-serif;background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased}',
  '@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}',
  '@keyframes spin{to{transform:rotate(360deg)}}',
  '@keyframes slideIn{from{transform:translateX(-100%)}to{transform:none}}',
  '.fu{animation:fadeUp .5s ease both}.d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}.d5{animation-delay:.25s}',
  '.sp{width:20px;height:20px;border:2.5px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:spin .55s linear infinite;display:inline-block}',
  '.spd{border-color:var(--line);border-top-color:var(--brand)}',
  /* Login */
  '.lsh{min-height:100vh;display:flex;background:var(--brand);position:relative;overflow:hidden}',
  '.lsh::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 20% 50%,rgba(201,150,59,.08),transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(43,82,137,.3),transparent 50%)}',
  '.ll{flex:1.1;display:flex;flex-direction:column;justify-content:center;padding:80px 60px;position:relative;z-index:1;color:#fff}',
  '.llg{display:flex;align-items:center;gap:14px;margin-bottom:56px}',
  '.llm{width:52px;height:52px;border-radius:13px;background:linear-gradient(135deg,var(--acc),var(--acc2));display:flex;align-items:center;justify-content:center;color:var(--brand)}',
  '.llg h1{font-family:"Fraunces",serif;font-size:30px;font-weight:700}',
  '.llg b{color:var(--acc)}',
  '.lht{max-width:440px}',
  '.lht h2{font-family:"Fraunces",serif;font-size:40px;font-weight:700;line-height:1.15;margin-bottom:18px;letter-spacing:-.5px}',
  '.lht em{font-style:normal;color:var(--acc2)}',
  '.lht p{font-size:16px;color:rgba(255,255,255,.55);line-height:1.65;max-width:380px}',
  '.lps{display:flex;flex-wrap:wrap;gap:10px;margin-top:40px}',
  '.lp{padding:8px 18px;border-radius:100px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.5);font-size:13px}',
  '.lr{width:460px;display:flex;align-items:center;justify-content:center;padding:40px;position:relative;z-index:1}',
  '.lc{width:100%;background:var(--w);border-radius:16px;padding:44px 36px;box-shadow:var(--s3)}',
  '.lc h3{font-family:"Fraunces",serif;font-size:24px;font-weight:700;margin-bottom:4px}',
  '.lc .sub{color:var(--mute);font-size:14px;margin-bottom:28px}',
  '.fld{margin-bottom:18px}',
  '.fld label{display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.7px;color:var(--ink2);margin-bottom:6px}',
  '.fld input,.fld select{width:100%;padding:11px 14px;border:1.5px solid var(--line);border-radius:8px;font-size:14px;background:var(--wash);transition:.2s;font-family:inherit}',
  '.fld input:focus,.fld select:focus{outline:none;border-color:var(--acc);box-shadow:0 0 0 3px var(--accbg);background:var(--w)}',
  '.bp{width:100%;padding:13px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;background:var(--brand);color:#fff;transition:.2s;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit}',
  '.bp:hover{background:var(--brand2)}.bp:disabled{opacity:.55;cursor:default}',
  '.ae{background:var(--rbg);border:1px solid #fecaca;color:var(--r);padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:18px;text-align:center}',
  /* Shell */
  '.sh{display:flex;min-height:100vh}',
  '.sd{width:256px;background:var(--brand);color:#fff;position:fixed;top:0;left:0;bottom:0;z-index:100;display:flex;flex-direction:column;transition:transform .25s}',
  '.sdh{padding:22px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,.06)}',
  '.sdm{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--acc),var(--acc2));display:flex;align-items:center;justify-content:center;color:var(--brand);flex-shrink:0}',
  '.sdb{font-family:"Fraunces",serif;font-size:17px;font-weight:700}.sdb b{color:var(--acc)}',
  '.sdn{flex:1;padding:14px 10px;overflow-y:auto;display:flex;flex-direction:column;gap:1px}',
  '.sds{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.6px;color:rgba(255,255,255,.25);padding:18px 12px 7px}',
  '.nb{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:8px;border:none;background:none;color:rgba(255,255,255,.5);font-size:13.5px;cursor:pointer;width:100%;text-align:left;font-family:inherit;transition:.15s}',
  '.nb:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.85)}',
  '.nb.on{background:var(--accbg);color:var(--acc);font-weight:500}',
  '.sdf{padding:12px 10px;border-top:1px solid rgba(255,255,255,.06)}',
  '.mn{flex:1;margin-left:256px;display:flex;flex-direction:column}',
  '.tp{height:60px;background:var(--w);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:sticky;top:0;z-index:50}',
  '.tl{display:flex;align-items:center;gap:14px}.tl h2{font-size:17px;font-weight:600}',
  '.tr{display:flex;align-items:center;gap:12px}',
  '.ti{width:38px;height:38px;border-radius:9px;border:1px solid var(--line);background:var(--w);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--mute);transition:.15s;font-family:inherit}.ti:hover{background:var(--wash);color:var(--ink)}',
  '.mb{display:none;background:none;border:none;cursor:pointer;color:var(--ink)}',
  '.tu{display:flex;align-items:center;gap:9px;padding:5px 11px 5px 5px;border:1px solid var(--line);border-radius:9px;cursor:pointer;background:var(--w);font-family:inherit;transition:.15s}.tu:hover{background:var(--wash)}',
  '.ta{width:30px;height:30px;border-radius:7px;background:var(--brand);color:var(--acc);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}',
  '.tun{font-size:13px;font-weight:600;color:var(--ink)}.tur{font-size:10.5px;color:var(--mute);text-transform:capitalize}',
  '.pg{flex:1;padding:28px}',
  /* Dashboard */
  '.bn{background:linear-gradient(135deg,var(--brand),var(--brand2));border-radius:var(--rd);padding:30px 32px;color:#fff;margin-bottom:28px;position:relative;overflow:hidden}',
  '.bn::after{content:"";position:absolute;top:-40%;right:-8%;width:280px;height:280px;background:radial-gradient(circle,rgba(201,150,59,.12),transparent 70%)}',
  '.bn h2{font-family:"Fraunces",serif;font-size:22px;margin-bottom:6px}.bn p{color:rgba(255,255,255,.55);font-size:13.5px}',
  '.mg{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:28px}',
  '.mc{background:var(--w);border:1px solid var(--line);border-radius:var(--rd);padding:22px;transition:.2s;cursor:default}.mc:hover{box-shadow:var(--s2);transform:translateY(-2px)}',
  '.mt{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}',
  '.mi{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center}',
  '.mi.b{background:var(--bbg);color:var(--b)}.mi.g{background:var(--gbg);color:var(--g)}.mi.a{background:var(--abg);color:var(--a)}.mi.r{background:var(--rbg);color:var(--r)}',
  '.ml{font-size:12.5px;color:var(--mute);font-weight:500}',
  '.mv{font-size:30px;font-weight:700;font-family:"Fraunces",serif}',
  '.md{font-size:11.5px;font-weight:500;margin-top:3px}.md.u{color:var(--g)}.md.d{color:var(--r)}',
  /* Cards & Tables */
  '.cd{background:var(--w);border:1px solid var(--line);border-radius:var(--rd);margin-bottom:22px}',
  '.ch{padding:18px 22px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}.ch h3{font-size:15px;font-weight:600}',
  '.cb{padding:22px}',
  '.acs{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}',
  '.ab{padding:18px 12px;border:1.5px dashed var(--line);border-radius:var(--rd);background:var(--w);cursor:pointer;text-align:center;transition:.2s;font-family:inherit}.ab:hover{border-color:var(--acc);background:var(--accbg)}',
  '.ab span{display:flex;justify-content:center;margin-bottom:8px;color:var(--brand)}.ab p{font-size:12.5px;font-weight:500}',
  '.tw{overflow-x:auto}',
  'table{width:100%;border-collapse:collapse}',
  'th{text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.7px;color:var(--mute);padding:10px 14px;border-bottom:1px solid var(--line);background:var(--wash)}',
  'td{padding:12px 14px;border-bottom:1px solid var(--line);font-size:13.5px;color:var(--ink2)}',
  'tr:hover td{background:var(--wash)}',
  '.bg{padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;display:inline-block}',
  '.bgg{background:var(--gbg);color:var(--g)}.bgr{background:var(--rbg);color:var(--r)}.bga{background:var(--abg);color:var(--a)}.bgb{background:var(--bbg);color:var(--b)}',
  '.tba{display:flex;gap:6px}',
  '.tbb{width:30px;height:30px;border-radius:6px;border:1px solid var(--line);background:var(--w);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--mute);transition:.15s;font-family:inherit}.tbb:hover{background:var(--wash);color:var(--ink)}',
  '.tb{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap}',
  '.sb{display:flex;align-items:center;gap:8px;padding:9px 14px;border:1.5px solid var(--line);border-radius:8px;background:var(--w);min-width:240px}',
  '.sb input{border:none;outline:none;font-size:13.5px;background:transparent;width:100%;color:var(--ink);font-family:inherit}',
  '.bs{padding:9px 18px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.15s;font-family:inherit}',
  '.bsb{background:var(--brand);color:#fff}.bsb:hover{background:var(--brand2)}',
  '.bso{background:var(--w);border:1.5px solid var(--line);color:var(--ink2)}.bso:hover{background:var(--wash)}',
  /* Health */
  '.hg{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}',
  '.hi{padding:16px;border-radius:8px;background:var(--wash);border:1px solid var(--line)}',
  '.hl{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--mute);font-weight:600;margin-bottom:4px}',
  '.hv{font-size:14px;font-weight:600}.hv.ok{color:var(--g)}.hv.er{color:var(--r)}',
  '.ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99}',
  /* Responsive */
  '@media(max-width:1024px){.mg{grid-template-columns:repeat(2,1fr)}.acs{grid-template-columns:repeat(3,1fr)}}',
  '@media(max-width:768px){.lsh{flex-direction:column}.ll{padding:40px 24px}.lps{display:none}.lr{width:100%;padding:0 20px 40px}.lc{padding:28px 22px}.sd{transform:translateX(-100%)}.sd.op{transform:none;animation:slideIn .25s ease}.mn{margin-left:0}.mb{display:flex}.pg{padding:18px}.mg{grid-template-columns:1fr}.acs{grid-template-columns:repeat(2,1fr)}.lht h2{font-size:28px}}'
].join('\n');

/* ====== LOGIN ====== */
function Login(props) {
  var onAuth = props.onAuth;
  var _email = useState(""); var email = _email[0]; var setEmail = _email[1];
  var _pw = useState(""); var password = _pw[0]; var setPassword = _pw[1];
  var _ld = useState(false); var loading = _ld[0]; var setLoading = _ld[1];
  var _er = useState(""); var error = _er[0]; var setError = _er[1];
  var _ut = useState("super_admin"); var userType = _ut[0]; var setUserType = _ut[1];

  var handleSubmit = async function(ev) {
    ev.preventDefault();
    setLoading(true);
    setError("");
    var result = await http.post("/auth/login", {
      email: email,
      password: password,
      user_type: userType
    });
    if (result.ok && (result.data.token || result.data.access_token)) {
      var token = result.data.token || result.data.access_token;
      var user = result.data.user || (result.data.data ? result.data.data.user : null);
      onAuth(token, user);
    } else {
      setError(result.data.message || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="lsh">
      <div className="ll fu">
        <div className="llg">
          <div className="llm"><Ic icon={I.school} size={26} /></div>
          <h1>School<b>Saavy</b></h1>
        </div>
        <div className="lht">
          <h2>Smart School<br/>Management,<br/><em>Simplified.</em></h2>
          <p>One unified platform to manage students, teachers, attendance, fees, exams, and everything your institution needs.</p>
        </div>
        <div className="lps">
          {["Student Records","Attendance","Fee Tracking","Exam Results","Activity Logs","Notifications"].map(function(t, i) {
            return <span key={i} className="lp">{t}</span>;
          })}
        </div>
      </div>
      <div className="lr">
        <form className="lc fu d2" onSubmit={handleSubmit}>
          <h3>Welcome Back</h3>
          <p className="sub">Sign in to your SchoolSaavy account</p>
          {error && <div className="ae">{error}</div>}
          <div className="fld">
            <label>Email</label>
            <input type="email" placeholder="superadmin@schoolsaavy.com" value={email} onChange={function(e){setEmail(e.target.value)}} required />
          </div>
          <div className="fld">
            <label>Password</label>
            <input type="password" placeholder="Enter password" value={password} onChange={function(e){setPassword(e.target.value)}} required />
          </div>
          <div className="fld">
            <label>Login As</label>
            <select value={userType} onChange={function(e){setUserType(e.target.value)}}>
              <option value="super_admin">Super Admin</option>
              <option value="admin">School Admin</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <button className="bp" type="submit" disabled={loading}>
            {loading ? <span className="sp" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ====== DASHBOARD ====== */
function Dash(props) {
  var go = props.go;
  var stats = [
    {l:"Total Students",v:"1,284",d:"12% from last month",u:true,c:"b",icon:I.users},
    {l:"Total Teachers",v:"86",d:"3 new this term",u:true,c:"g",icon:I.user},
    {l:"Attendance Today",v:"94%",d:"2% from yesterday",u:true,c:"a",icon:I.check},
    {l:"Pending Fees",v:"\u20B92.4L",d:"8% collected",u:false,c:"r",icon:I.dollar}
  ];
  var actions = [
    {icon:I.users,t:"Add Student",p:"students"},
    {icon:I.user,t:"Add Teacher",p:"teachers"},
    {icon:I.check,t:"Mark Attendance",p:"attendance"},
    {icon:I.dollar,t:"Collect Fee",p:"fees"},
    {icon:I.file,t:"Create Exam",p:"exams"}
  ];
  var activity = [
    {t:"2 min ago",u:"Admin",a:"Marked attendance for Class 10-A",s:"Success"},
    {t:"15 min ago",u:"Mr. Sharma",a:"Uploaded exam results",s:"Success"},
    {t:"1 hr ago",u:"Admin",a:"Collected fee from Rahul Kumar",s:"Pending"},
    {t:"2 hrs ago",u:"Mrs. Gupta",a:"Updated student records",s:"Success"},
    {t:"3 hrs ago",u:"Admin",a:"Added new teacher profile",s:"Success"}
  ];

  return (
    <div>
      <div className="bn fu"><h2>Welcome to SchoolSaavy</h2><p>Here's a quick overview of your school's performance</p></div>
      <div className="mg">
        {stats.map(function(x,i){return(
          <div key={i} className={"mc fu d"+(i+1)}><div className="mt"><div><div className="ml">{x.l}</div><div className="mv">{x.v}</div><div className={"md "+(x.u?"u":"d")}>{x.u?"\u2191":"\u2193"} {x.d}</div></div><div className={"mi "+x.c}><Ic icon={x.icon}/></div></div></div>
        )})}
      </div>
      <div className="cd fu d5"><div className="ch"><h3>Quick Actions</h3></div><div className="cb"><div className="acs">
        {actions.map(function(x,i){return(
          <button key={i} className="ab" onClick={function(){go(x.p)}}><span><Ic icon={x.icon}/></span><p>{x.t}</p></button>
        )})}
      </div></div></div>
      <div className="cd fu"><div className="ch"><h3>Recent Activity</h3></div><div className="cb"><div className="tw"><table>
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Status</th></tr></thead>
        <tbody>{activity.map(function(r,i){return(
          <tr key={i}><td style={{color:"var(--mute)",fontSize:12.5}}>{r.t}</td><td style={{fontWeight:500}}>{r.u}</td><td>{r.a}</td><td><span className={"bg "+(r.s==="Success"?"bgg":"bga")}>{r.s}</span></td></tr>
        )})}</tbody>
      </table></div></div></div>
    </div>
  );
}

/* ====== MODULE PAGE ====== */
function Mod(props) {
  var title = props.title; var cols = props.cols; var data = props.data;
  var _q = useState(""); var query = _q[0]; var setQuery = _q[1];
  var filtered = data.filter(function(r){return Object.values(r).some(function(v){return String(v).toLowerCase().includes(query.toLowerCase())})});

  return (
    <div>
      <div className="tb fu">
        <div className="sb"><Ic icon={I.search} size={16}/><input placeholder={"Search "+title.toLowerCase()+"..."} value={query} onChange={function(e){setQuery(e.target.value)}}/></div>
        <div style={{display:"flex",gap:8}}>
          <button className="bs bso"><Ic icon={I.file} size={15}/> Export</button>
          <button className="bs bsb"><Ic icon={I.plus} size={15}/> Add New</button>
        </div>
      </div>
      <div className="cd fu d1"><div className="cb" style={{padding:0}}><div className="tw"><table>
        <thead><tr>{cols.map(function(c,i){return <th key={i}>{c}</th>})}<th>Actions</th></tr></thead>
        <tbody>
          {filtered.length===0 ? <tr><td colSpan={cols.length+1} style={{textAlign:"center",padding:40,color:"var(--mute)"}}>No records found</td></tr>
          : filtered.map(function(r,i){return(
            <tr key={i}>
              {cols.map(function(c,j){
                var val=r[c];
                if(c==="Status"){var cls=(val==="Active"||val==="Paid")?"bgg":(val==="Pending"||val==="On Leave")?"bga":(val==="Overdue"||val==="Inactive")?"bgr":"bgb";return <td key={j}><span className={"bg "+cls}>{val}</span></td>}
                if(c==="Grade"){var gcls=(val==="A+"||val==="A")?"bgg":(val==="B+"||val==="B")?"bgb":"bga";return <td key={j}><span className={"bg "+gcls}>{val}</span></td>}
                return <td key={j}>{val}</td>;
              })}
              <td><div className="tba">
                <button className="tbb" title="View"><Ic icon={I.eye} size={14}/></button>
                <button className="tbb" title="Edit"><Ic icon={I.edit} size={14}/></button>
                <button className="tbb" title="Delete"><Ic icon={I.trash} size={14}/></button>
              </div></td>
            </tr>
          )})}
        </tbody>
      </table></div></div></div>
    </div>
  );
}

/* ====== SAMPLE DATA ====== */
var SD = {
  students:{t:"Students",c:["Name","Roll No","Class","Parent","Phone","Status"],d:[
    {Name:"Aarav Sharma","Roll No":"101",Class:"10-A",Parent:"Rajesh Sharma",Phone:"9876543210",Status:"Active"},
    {Name:"Priya Patel","Roll No":"102",Class:"10-A",Parent:"Suresh Patel",Phone:"9876543211",Status:"Active"},
    {Name:"Rohan Gupta","Roll No":"103",Class:"10-B",Parent:"Ankit Gupta",Phone:"9876543212",Status:"Active"},
    {Name:"Sneha Reddy","Roll No":"104",Class:"9-A",Parent:"Vikram Reddy",Phone:"9876543213",Status:"Inactive"},
    {Name:"Arjun Singh","Roll No":"105",Class:"9-B",Parent:"Harpreet Singh",Phone:"9876543214",Status:"Active"}
  ]},
  teachers:{t:"Teachers",c:["Name","Subject","Department","Phone","Experience","Status"],d:[
    {Name:"Dr. Meera Joshi",Subject:"Mathematics",Department:"Science",Phone:"9988776655",Experience:"12 yrs",Status:"Active"},
    {Name:"Mr. Amit Verma",Subject:"English",Department:"Humanities",Phone:"9988776656",Experience:"8 yrs",Status:"Active"},
    {Name:"Mrs. Kavita Nair",Subject:"Physics",Department:"Science",Phone:"9988776657",Experience:"15 yrs",Status:"Active"},
    {Name:"Mr. Raj Malhotra",Subject:"History",Department:"Humanities",Phone:"9988776658",Experience:"5 yrs",Status:"On Leave"}
  ]},
  attendance:{t:"Attendance",c:["Date","Class","Present","Absent","Total","Status"],d:[
    {Date:"2026-04-09",Class:"10-A",Present:"38",Absent:"2",Total:"40",Status:"Active"},
    {Date:"2026-04-09",Class:"10-B",Present:"35",Absent:"5",Total:"40",Status:"Active"},
    {Date:"2026-04-09",Class:"9-A",Present:"40",Absent:"0",Total:"40",Status:"Active"},
    {Date:"2026-04-08",Class:"10-A",Present:"36",Absent:"4",Total:"40",Status:"Active"}
  ]},
  fees:{t:"Fee Management",c:["Student","Class","Amount","Due Date","Paid","Status"],d:[
    {Student:"Aarav Sharma",Class:"10-A",Amount:"\u20B915,000","Due Date":"2026-04-15",Paid:"\u20B915,000",Status:"Paid"},
    {Student:"Priya Patel",Class:"10-A",Amount:"\u20B915,000","Due Date":"2026-04-15",Paid:"\u20B910,000",Status:"Pending"},
    {Student:"Rohan Gupta",Class:"10-B",Amount:"\u20B915,000","Due Date":"2026-03-15",Paid:"\u20B90",Status:"Overdue"},
    {Student:"Sneha Reddy",Class:"9-A",Amount:"\u20B912,000","Due Date":"2026-04-15",Paid:"\u20B912,000",Status:"Paid"}
  ]},
  exams:{t:"Exams & Results",c:["Student","Exam","Subject","Marks","Percentage","Grade"],d:[
    {Student:"Aarav Sharma",Exam:"Mid-Term",Subject:"Math",Marks:"92/100",Percentage:"92%",Grade:"A+"},
    {Student:"Priya Patel",Exam:"Mid-Term",Subject:"Math",Marks:"85/100",Percentage:"85%",Grade:"A"},
    {Student:"Rohan Gupta",Exam:"Mid-Term",Subject:"Math",Marks:"76/100",Percentage:"76%",Grade:"B+"},
    {Student:"Sneha Reddy",Exam:"Mid-Term",Subject:"Science",Marks:"68/100",Percentage:"68%",Grade:"B"},
    {Student:"Arjun Singh",Exam:"Mid-Term",Subject:"Science",Marks:"55/100",Percentage:"55%",Grade:"C"}
  ]}
};

/* ====== HEALTH CHECK ====== */
function Health() {
  var _h = useState(null); var h = _h[0]; var setH = _h[1];
  var _ld = useState(true); var loading = _ld[0]; var setLoading = _ld[1];

  useEffect(function(){
    fetch(API+"/health").then(function(r){return r.json()}).then(function(d){setH(d);setLoading(false)}).catch(function(){setLoading(false)});
  },[]);

  if(loading) return <div style={{textAlign:"center",padding:60}}><span className="sp spd"/></div>;
  if(!h) return <div className="ae">Unable to reach API. Backend may be sleeping.</div>;

  var items=[
    {l:"Status",v:h.status?h.status.toUpperCase():"?",ok:h.status==="ok"},
    {l:"Database",v:h.database,ok:h.database==="connected"},
    {l:"Redis",v:h.redis,ok:h.redis==="connected"},
    {l:"Version",v:h.version},{l:"Server",v:h.server},{l:"Memory",v:h.memory},
    {l:"DB Latency",v:h.db_duration},{l:"Timestamp",v:h.timestamp?h.timestamp.slice(0,19):""}
  ];

  return(
    <div className="cd fu"><div className="ch"><h3>Backend API Health</h3><span className={"bg "+(h.status==="ok"?"bgg":"bgr")}>{h.status==="ok"?"Healthy":"Issues"}</span></div>
    <div className="cb"><div className="hg">
      {items.map(function(x,i){var cls=x.ok===true?"ok":x.ok===false?"er":"";return(
        <div key={i} className="hi"><div className="hl">{x.l}</div><div className={"hv "+cls}>{x.v||"\u2014"}</div></div>
      )})}
    </div></div></div>
  );
}

/* ====== NAV ====== */
var NAV=[
  {id:"dash",l:"Dashboard",i:I.grid,s:"m"},
  {id:"students",l:"Students",i:I.users,s:"m"},
  {id:"teachers",l:"Teachers",i:I.user,s:"m"},
  {id:"attendance",l:"Attendance",i:I.check,s:"m"},
  {id:"fees",l:"Fee Management",i:I.dollar,s:"m"},
  {id:"exams",l:"Exams & Results",i:I.file,s:"m"},
  {id:"activity",l:"Activity Logs",i:I.pulse,s:"s"},
  {id:"health",l:"API Health",i:I.gear,s:"s"}
];

/* ====== MAIN APP ====== */
export default function App() {
  var _tk = useState(null); var token = _tk[0]; var setToken = _tk[1];
  var _us = useState(null); var user = _us[0]; var setUser = _us[1];
  var _pg = useState("dash"); var page = _pg[0]; var setPage = _pg[1];
  var _so = useState(false); var sidebarOpen = _so[0]; var setSidebarOpen = _so[1];

  var handleAuth = useCallback(function(t,u){setToken(t);setUser(u)},[]);
  var handleLogout = function(){setToken(null);setUser(null);setPage("dash")};

  if(!token) return(<><style>{CSS}</style><Login onAuth={handleAuth}/></>);

  var initials = user&&user.name ? user.name.split(" ").map(function(n){return n[0]}).join("").slice(0,2).toUpperCase() : "AD";
  var currentNav = NAV.find(function(n){return n.id===page}) || NAV[0];

  var renderPage = function(){
    if(page==="dash") return <Dash go={setPage}/>;
    if(page==="health") return <Health/>;
    if(page==="activity") return(
      <div style={{textAlign:"center",padding:70}}>
        <div style={{transform:"scale(3)",marginBottom:28,opacity:0.15}}><Ic icon={I.pulse} size={20}/></div>
        <h3 style={{fontSize:18,fontWeight:600,marginBottom:6}}>Activity Logs</h3>
        <p style={{color:"var(--mute)",fontSize:13.5}}>Connect to backend to view activity logs</p>
      </div>
    );
    var module=SD[page];
    if(module) return <Mod title={module.t} cols={module.c} data={module.d}/>;
    return <Dash go={setPage}/>;
  };

  return(
    <><style>{CSS}</style>
    <div className="sh">
      {sidebarOpen && <div className="ov" onClick={function(){setSidebarOpen(false)}}/>}
      <aside className={"sd "+(sidebarOpen?"op":"")}>
        <div className="sdh"><div className="sdm"><Ic icon={I.school} size={20}/></div><div className="sdb">School<b>Saavy</b></div></div>
        <nav className="sdn">
          <div className="sds">Main</div>
          {NAV.filter(function(n){return n.s==="m"}).map(function(n){return(
            <button key={n.id} className={"nb "+(page===n.id?"on":"")} onClick={function(){setPage(n.id);setSidebarOpen(false)}}><Ic icon={n.i}/> {n.l}</button>
          )})}
          <div className="sds">System</div>
          {NAV.filter(function(n){return n.s==="s"}).map(function(n){return(
            <button key={n.id} className={"nb "+(page===n.id?"on":"")} onClick={function(){setPage(n.id);setSidebarOpen(false)}}><Ic icon={n.i}/> {n.l}</button>
          )})}
        </nav>
        <div className="sdf"><button className="nb" onClick={handleLogout}><Ic icon={I.out}/> Sign Out</button></div>
      </aside>
      <div className="mn">
        <header className="tp">
          <div className="tl"><button className="mb" onClick={function(){setSidebarOpen(true)}}><Ic icon={I.menu} size={22}/></button><h2>{currentNav.l}</h2></div>
          <div className="tr">
            <button className="ti"><Ic icon={I.bell} size={18}/></button>
            <button className="tu"><div className="ta">{initials}</div><div><div className="tun">{user&&user.name?user.name:"Admin"}</div><div className="tur">{user&&user.role?user.role:"admin"}</div></div></button>
          </div>
        </header>
        <main className="pg">{renderPage()}</main>
      </div>
    </div></>
  );
}
