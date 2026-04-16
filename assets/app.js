/* ==========================================================================
   PCG STAGE — App Shell (persistent nav, role switcher, helpers)
   Rule 8: Always uses PCG.api.* — never touches raw data.
   ========================================================================== */
(function(){
  window.PCG = window.PCG || {};

  // ----- Helpers (formatting + URL) -----
  PCG.qs = (key, fallback=null) => new URL(location.href).searchParams.get(key) ?? fallback;

  PCG.fmtDate = (iso, opts={}) => {
    if(!iso) return "—";
    const d = new Date(iso);
    const month = d.toLocaleString("en-US",{month:"short"});
    const day = d.getDate();
    const year = d.getFullYear();
    const time = opts.time ? ` ${d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}` : "";
    return `${month} ${day}, ${year}${time}`;
  };
  PCG.fmtShort = iso => iso ? (d=>`${d.toLocaleString("en-US",{month:"short"})} ${d.getDate()}`)(new Date(iso)) : "—";
  PCG.fmtTime  = iso => iso ? new Date(iso).toLocaleTimeString("en-US",{hour:"numeric", minute:"2-digit"}) : "—";
  PCG.ago = iso => {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms/60000);
    if(m<1) return "just now";
    if(m<60) return `${m}m ago`;
    const h=Math.floor(m/60);
    if(h<24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };
  PCG.money = n => (n==null||isNaN(n)) ? "—" : `$${Number(n).toLocaleString("en-US",{maximumFractionDigits:0})}`;
  PCG.pct   = n => (n==null||isNaN(n)) ? "—" : `${Math.round(Number(n)*100)}%`;

  PCG.escapeHtml = s => String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  PCG.statusPill = (health, label) => {
    const tone = {green:"green", amber:"amber", red:"red", gray:"gray", blue:"blue", purple:"purple"}[health] || "gray";
    return `<span class="pill ${tone}">${label || (health||"unknown").toUpperCase()}</span>`;
  };

  // Lifecycle state pill (operational canon)
  PCG.lifecyclePill = (state) => {
    const map = {
      Opportunity:'gray', Quoted:'blue', Awarded:'purple', InPrep:'amber',
      OnShow:'purple', Striking:'amber', Returning:'amber', Closing:'blue', Archived:'gray'
    };
    return `<span class="pill plain ${map[state]||'gray'}" title="Lifecycle state">${(state||'—').toUpperCase()}</span>`;
  };

  // ----- Navigation manifest (role-driven) -----
  // Each entry declares which groups can see it. API enforces data; nav just hides.
  PCG.NAV = [
    { label:'My Home', items:[
      { id:'myhome',    label:'My Home',      href:'home.html',           icon:'⌂', groups:'*' }
    ]},
    { label:'Operations', items:[
      { id:'portfolio', label:'Portfolio',    href:'index.html',          icon:'▦', groups:'*' },
      { id:'action',    label:'Action Queue', href:'action-queue.html',   icon:'◎', groups:'*' },
      { id:'playbook',  label:'Playbook',     href:'playbook.html?project=LCE-2026', icon:'☰', groups:'*' },
      { id:'checklist', label:'Checklists',   href:'checklist.html?project=LCE-2026', icon:'☑', groups:'*' },
      { id:'breakouts', label:'Breakouts',    href:'breakouts.html?project=SAE-WCX-2026', icon:'⊟', groups:'*' },
      { id:'showbook',  label:'Show Book',    href:'showbook.html?project=LCE-2026', icon:'❏', groups:'*' },
      { id:'venues',    label:'Venues',       href:'venue.html',          icon:'🏛', groups:'*' }
    ]},
    { label:'Sales & Quoting', items:[
      { id:'pif',       label:'PIF Intake',   href:'pif.html',            icon:'◧', groups:[PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN, PCG.GROUPS.LEADERSHIP] },
      { id:'quote',     label:'Quote Builder',href:'quote.html?id=q.LCE-2026.v3', icon:'§', groups:[PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING] }
    ]},
    { label:'Show Run', items:[
      { id:'ros',       label:'Run of Show',  href:'ros.html?project=GLBX-GSK26', icon:'▶', groups:'*' }
    ]},
    { label:'Inventory & Warehouse', items:[
      { id:'eqlpc',      label:'EQLPC Command Center', href:'eqlpc.html',        icon:'◇', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS] },
      { id:'warehouse',  label:'Warehouse Home',       href:'warehouse.html',    icon:'□', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS] },
      { id:'warehouse-tv',label:'Warehouse TV Mode',   href:'warehouse-tv.html', icon:'▣', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS] },
      { id:'qc',         label:'QC Scan',              href:'qc-scan.html?pullSheet=ps.sae.breakout',icon:'◆', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS] },
      { id:'ic',         label:'IC Return Scan',       href:'ic-scan.html?manifest=man.lce.out1', icon:'◈', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS] }
    ]},
    { label:'Crew & Labor', items:[
      { id:'scheduling', label:'Scheduling Grid', href:'scheduling.html',  icon:'▥', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS] },
      { id:'travel',     label:'Travel & Per Diem', href:'travel.html',     icon:'✈', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ACCOUNTING] }
    ]},
    { label:'Finance', items:[
      { id:'finance',    label:'Finance Dashboard', href:'finance.html',   icon:'◉', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.AE] },
      { id:'procurement',label:'Procurement / RPO', href:'procurement.html', icon:'⊙', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.AE] }
    ]},
    { label:'Departments', items:[
      { id:'creative',   label:'Creative',  href:'creative.html', icon:'◆', groups:'*' },
      { id:'tech',       label:'Technical', href:'tech.html',     icon:'▲', groups:'*' }
    ]},
    { label:'Field', items:[
      { id:'driver',     label:'Driver (mobile)', href:'driver.html?manifest=man.sae.out1', icon:'🚚', groups:'*' },
      { id:'crew-pwa',   label:'Crew PWA',        href:'crew/index.html', icon:'☷', groups:'*' }
    ]}
  ];

  PCG.navItems = () => {
    const out = [];
    PCG.NAV.forEach(g=>{
      const items = g.items.filter(it=>{
        if(it.groups==='*') return true;
        return it.groups.some(gp=>PCG.hasPermission(gp));
      });
      if(items.length) out.push({ label:g.label, items });
    });
    return out;
  };

  // ----- Shell render -----
  PCG.renderShell = (opts={}) => {
    const { active="portfolio", crumbs=[], pageTitle="", pageActions="" } = opts;
    const user = PCG.user;

    const nav = PCG.navItems();
    const navHtml = nav.map(g=>`
      <div class="section-label">${PCG.escapeHtml(g.label)}</div>
      ${g.items.map(it=>`
        <a class="nav-item ${it.id===active?"active":""}" href="${it.href}">
          <span class="icon">${it.icon}</span>
          <span class="lbl">${PCG.escapeHtml(it.label)}</span>
        </a>`).join("")}
    `).join("");

    const crumbHtml = crumbs.length
      ? crumbs.map((c,i)=>{
          const last = i===crumbs.length-1;
          return `<span class="${last?'current':''}">${c.href && !last ? `<a href="${c.href}">${PCG.escapeHtml(c.label)}</a>` : PCG.escapeHtml(c.label)}</span>${!last?'<span class="sep">/</span>':''}`;
        }).join("")
      : `<span class="current">${PCG.escapeHtml(pageTitle)}</span>`;

    const notifCount = PCG.api.getNotifications(20).length;
    const queueCount = PCG.api.getActionQueue().length;

    // Persona switcher
    const persOptions = (PCG.PERSONAS||[]).map(p=>
      `<option value="${p.id}" ${p.id===user.id?'selected':''}>${PCG.escapeHtml(p.name)} — ${PCG.escapeHtml(p.role)}</option>`
    ).join('');

    return `
      <aside class="rail">
        <div class="brand">
          <img class="badge" src="assets/pcg-logo.png" onerror="this.onerror=null;this.src='assets/pcg-logo.svg';" alt="PCG" />
          <div class="name">PCG Stage<small>Born Backstage</small></div>
        </div>
        ${navHtml}
        <div class="rail-footer">
          <div class="avatar">${user.initials}</div>
          <div style="flex:1;">
            <div style="color:var(--text-primary); font-size:12px; font-weight:600;">${PCG.escapeHtml(user.name)}</div>
            <div>${PCG.escapeHtml(user.role)}</div>
          </div>
        </div>
      </aside>
      <header class="topbar">
        <div class="crumbs">${crumbHtml}</div>
        <div class="search">
          <span style="color:var(--text-tertiary);">⌕</span>
          <input placeholder="Search projects, contacts, venues…" />
          <span class="kbd">/</span>
        </div>

        <div class="quick-actions" style="gap:var(--sp-3);">
          <div class="persona-switch" style="display:flex; align-items:center; gap:6px;">
            <span class="eyebrow" style="font-size:10px;">VIEW AS</span>
            <select id="persona-sel" style="background:var(--surface-2); color:var(--text-primary); border:1px solid var(--border); border-radius:var(--r-sm); padding:4px 8px; font-size:var(--fs-xs);">${persOptions}</select>
          </div>
          <a href="action-queue.html" class="btn sm" title="Action queue">◎ <span class="mono">${queueCount}</span></a>
          <button class="btn sm" title="Notifications">🔔 <span class="mono">${notifCount}</span></button>
          ${pageActions || ''}
        </div>
      </header>
    `;
  };

  PCG.mountShell = (opts) => {
    const el = document.getElementById("app-shell");
    if(el) el.outerHTML = PCG.renderShell(opts);
    // wire persona switcher
    const sel = document.getElementById("persona-sel");
    if(sel) sel.addEventListener('change', e => {
      PCG.switchPersona(e.target.value);
      location.reload();
    });
  };

  // ----- Component helpers (used across modules) -----
  PCG.avatar = (person) => {
    if(!person) return `<span class="av">??</span>`;
    const init = person.initials || (person.name||"").split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase();
    return `<span class="av" title="${PCG.escapeHtml(person.name)}">${init}</span>`;
  };

  PCG.projectHeader = (p) => {
    if(!p) return "";
    const pm = PCG.findPerson(p.pmId) || PCG.findPerson(p.primaryPM);
    const td = PCG.findPerson(p.td);
    const venue = PCG.api.getVenue(p.venueId);
    const show = p.show || {};
    return `
    <section class="proj-header">
      <div class="motif"></div>
      <div class="eyebrow">${p.code} · ${p.status && p.status.toUpperCase()} · ${PCG.lifecyclePill(show.lifecycleState)}</div>
      <h1>${PCG.escapeHtml(p.name)}</h1>
      <div class="meta">
        <div class="i"><span class="k">Client</span><span class="v">${PCG.escapeHtml(p.client||"—")}</span></div>
        <div class="i"><span class="k">Venue</span><span class="v">${PCG.escapeHtml(venue?venue.name:p.venueName||"—")}</span></div>
        <div class="i"><span class="k">Load-In</span><span class="v mono">${PCG.fmtShort(p.dates.loadIn)} ${PCG.fmtTime(p.dates.loadIn)}</span></div>
        <div class="i"><span class="k">Show Start</span><span class="v mono">${PCG.fmtShort(p.dates.showStart)} ${PCG.fmtTime(p.dates.showStart)}</span></div>
        <div class="i"><span class="k">Load-Out</span><span class="v mono">${PCG.fmtShort(p.dates.loadOut)} ${PCG.fmtTime(p.dates.loadOut)}</span></div>
        <div class="i"><span class="k">PM</span><span class="v">${pm?PCG.escapeHtml(pm.name):"—"}</span></div>
        <div class="i"><span class="k">TD</span><span class="v">${td?PCG.escapeHtml(td.name):"—"}</span></div>
        <div class="i"><span class="k">Health</span><span class="v">${PCG.statusPill(p.health)}</span></div>
        <div class="i"><span class="k">Quote</span><span class="v mono">${p.quoteNo||"—"}</span></div>
        <div class="i"><span class="k">Manifest</span><span class="v mono">${p.manifestNo||"—"}</span></div>
        <div class="i"><span class="k">Pull Sheet</span><span class="v mono">${p.pullSheetNo||"—"}</span></div>
        <div class="i"><span class="k">Customer PO</span><span class="v mono">${p.customerPO||"—"}</span></div>
      </div>
      <div class="actions">
        <a class="btn spectrum" href="playbook.html?project=${p.code}">⚡ Open Playbook</a>
        <a class="btn" href="showbook.html?project=${p.code}">❏ Show Book</a>
        ${p.showType==='breakout-heavy'?`<a class="btn" href="breakouts.html?project=${p.code}">⊟ Breakouts</a>`:''}
        ${PCG.canSeeTier('T2_MARGINS')?`<a class="btn ghost" href="quote.html?id=q.${p.code}.v${(p.code==='LCE-2026'?3:1)}">Quote</a>`:''}
        <a class="btn ghost" href="#">Flex ↗</a>
        <a class="btn ghost" href="#">Lasso ↗</a>
      </div>
    </section>`;
  };

  PCG.projectTabs = (p, active="overview") => {
    const base = `project.html?project=${p.code}`;
    const tabs = [
      ["overview","Overview"],["schedule","Schedule"],["rooms","Rooms & Breakouts"],
      ["gear","Gear"],["labor","Labor"],["procurement","Procurement"],
      ["docs","Docs"],["risks","Risks"],["approvals","Approvals"],
      ["changes","Changes"],["financials","Financials"],["log","Activity"]
    ];
    return `<nav class="tabs">${tabs.map(([id,lbl])=>
      `<a class="${id===active?'on':''}" href="${base}&tab=${id}">${lbl}</a>`
    ).join("")}</nav>`;
  };

  PCG.renderTimeline = (rootEl, opts={}) => {
    const days = opts.days || 42;
    const start = opts.start ? new Date(opts.start) : new Date("2026-04-01");
    const projects = PCG.api.getProjects();
    const dateAt = i => { const d=new Date(start); d.setDate(start.getDate()+i); return d; };
    const iso = d => d.toISOString().slice(0,10);
    const todayISO = (window.PCG.today || new Date()).toISOString().slice(0,10);

    const days$ = Array.from({length:days}, (_,i)=>dateAt(i));
    const labelEvery = days<=30 ? 2 : 3;
    const dayLabelHTML = days$.map((d,i)=>{
      const show = i%labelEvery===0;
      return `<span class="mono">${show?`${d.toLocaleString("en-US",{month:"short"})} ${d.getDate()}`:""}</span>`;
    }).join("");

    const gridHTML = days$.map(d=>{
      const cls = iso(d)===todayISO ? "d today" : "d";
      return `<div class="${cls}"></div>`;
    }).join("");

    const colForDate = iso2 => {
      const d = new Date(iso2);
      const diff = Math.floor((d - start)/(1000*60*60*24));
      return Math.max(0, Math.min(days, diff));
    };

    const bars = projects.map(p=>{
      const s = p.dates.loadIn.slice(0,10);
      const e = (p.dates.ret || p.dates.loadOut).slice(0,10);
      const c0 = colForDate(s); const c1 = Math.max(c0+0.5, colForDate(e));
      const leftPct = (c0/days)*100;
      const wPct = ((c1-c0)/days)*100;
      return `
        <div class="bar-row" data-project="${p.code}">
          <a class="bar ${p.health}" style="left:${leftPct}%; width:${wPct}%;" href="playbook.html?project=${p.code}" title="${PCG.escapeHtml(p.name)}">
            <span class="mono">${p.code}</span>
            <span>${PCG.escapeHtml(p.name.split("—")[0].trim())}</span>
          </a>
        </div>`;
    }).join("");

    rootEl.innerHTML = `
      <div class="timeline">
        <div class="day-labels" style="grid-template-columns: repeat(${days},1fr);">${dayLabelHTML}</div>
        <div class="grid-days"  style="grid-template-columns: repeat(${days},1fr);">${gridHTML}</div>
        <div class="bars">${bars}</div>
      </div>`;
  };

  // ----- Readiness badge (Source-of-Truth synthesis per §E) -----
  PCG.readinessBadge = (readiness, opts={}) => {
    if(!readiness) return '<span class="pill gray plain">—</span>';
    const tone = { Green:'green', Yellow:'amber', Red:'red', Blocked:'red' }[readiness.overall] || 'gray';
    const label = readiness.overall==='Blocked' ? 'BLOCKED' : readiness.overall.toUpperCase();
    if(opts.compact) return `<span class="pill ${tone}">${label}</span>`;
    const topBlocker = (Object.values(readiness.components)
      .flatMap(c=>c.blockers||[]).concat(Object.values(readiness.components).flatMap(c=>c.warnings||[])))[0];
    const subtitle = topBlocker ? `<span class="muted" style="font-size:11px;">${PCG.escapeHtml(topBlocker)}</span>` : '';
    return `<span class="pill ${tone}">${label}</span> ${subtitle}`;
  };

  PCG.readinessDetail = (readiness) => {
    if(!readiness) return PCG.states.empty('No readiness data');
    const tone = s => ({ Green:'green', Yellow:'amber', Red:'red', Blocked:'red' }[s] || 'gray');
    const comps = readiness.components;
    return Object.entries(comps).map(([key,c])=>{
      const b = (c.blockers||[]).map(x=>`<li>⛔ ${PCG.escapeHtml(x)}</li>`).join('');
      const w = (c.warnings||[]).map(x=>`<li>⚠ ${PCG.escapeHtml(x)}</li>`).join('');
      return `
        <div class="card card-pad" style="padding:12px 14px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="pill ${tone(c.status)}">${c.status.toUpperCase()}</span>
            <strong style="text-transform:uppercase; font-family:var(--font-display); letter-spacing:0.08em; font-size:12px;">${key}</strong>
            <span class="mono muted" style="margin-left:auto; font-size:11px;">Score ${c.score||0}</span>
          </div>
          ${(b||w) ? `<ul style="margin:6px 0 0; padding-left:18px; font-size:var(--fs-sm); color:var(--text-secondary);">${b}${w}</ul>`:''}
        </div>`;
    }).join('');
  };

  // ----- State-lock visualizer (§16 edit rules) -----
  PCG.lockBadge = (entityPath, showId) => {
    const chk = PCG.api.canEditField(entityPath, showId);
    if(chk.editable) return '<span class="pill green plain" style="font-size:10px;">EDITABLE</span>';
    if(chk.overridable) return `<span class="pill amber plain" style="font-size:10px;" title="${PCG.escapeHtml(chk.reason||'')}">OVERRIDE</span>`;
    return `<span class="pill gray plain" style="font-size:10px;" title="${PCG.escapeHtml(chk.reason||'')}">🔒 LOCKED</span>`;
  };

  // ----- Exception banner rail (§D.5) -----
  PCG.bannerRail = (showId) => {
    const banners = PCG.api.getActiveBanners(showId);
    if(!banners.length) return '';
    return `<div style="display:flex; flex-direction:column; gap:8px; margin-bottom:var(--sp-4);">
      ${banners.map(b=>{
        const cls = b.level==='red'?'red':'';
        return `<div class="attn-item ${cls}">
          <div style="font-size:16px;">${b.level==='red'?'⛔':'⚠'}</div>
          <div><div class="ttl">${PCG.escapeHtml(b.title)}</div>
          <div class="meta">${PCG.escapeHtml(b.detail||'')}</div></div>
        </div>`;
      }).join('')}
    </div>`;
  };

  // Empty / loading / error states helpers
  PCG.states = {
    loading: (label='Loading…') => `<div class="empty"><div class="spinner"></div> ${PCG.escapeHtml(label)}</div>`,
    empty:   (label='Nothing here.') => `<div class="empty">${PCG.escapeHtml(label)}</div>`,
    error:   (err) => `<div class="empty" style="color:var(--status-red);">Error: ${PCG.escapeHtml((err&&err.message)||err||'Unknown')}</div>`,
    forbidden: () => `<div class="empty">🔒 You don't have permission to view this section.</div>`
  };

})();
