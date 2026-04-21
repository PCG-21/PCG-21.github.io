/* ==========================================================================
   PCG STAGE — App Shell (persistent nav, role switcher, helpers)
   Rule 8: Always uses PCG.api.* — never touches raw data.
   ========================================================================== */
(function(){
  // ----- Demo PIN gate (outer access lock for hosted preview) -----
  // Runs before anything else so users without the PIN never see ops data.
  // Bypass: ?bypass_pin=true in URL, or sessionStorage.setItem('pcg_demo_pin','1').
  try {
    const path = location.pathname || '';
    const skipGate = path.endsWith('pin-gate.html')
                  || /[?&]bypass_pin=true\b/.test(location.search);
    if (!skipGate && !sessionStorage.getItem('pcg_demo_pin')) {
      const ret = encodeURIComponent((path.split('/').pop() || '') + location.search);
      location.replace('pin-gate.html?return=' + ret);
      return;
    }
    if (/[?&]bypass_pin=true\b/.test(location.search)) {
      sessionStorage.setItem('pcg_demo_pin', '1');
    }
  } catch (e) { /* sessionStorage may throw in privacy mode — fall through */ }

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
    // =================================================================
    // 1. PROJECT MANAGEMENT — PM-first primary section.
    //    In the live repo this content maps to Workspace /work (PM daily
    //    command surface) + the Show spine (Program → Show → Project).
    //    "Show" is the operational unit; "Project" is commercial/billing.
    //    Demo groups both here for the PM-first story.
    // =================================================================
    { label:'▍ Project Management', primary:true, items:[
      { id:'pm-home',       label:'Dashboard (Work)',    href:'pm-home.html',                               icon:'⌂', groups:'*' },
      { id:'pif',           label:'＋ New · PIF',         href:'pif.html',                                   icon:'◧', groups:[PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP, PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS] },
      { id:'show-center',   label:'Show Command Center', href:'show-center.html?project=LCE-2026',          icon:'◈', groups:'*' },
      { id:'site-visit',    label:'Site Visit (guided)', href:'site-visit.html?project=LCE-2026',           icon:'🗺', groups:'*' },
      { id:'field-capture', label:'Field Capture (mobile)', href:'field-capture.html?project=LCE-2026',     icon:'📱', groups:'*' },
      { id:'advance',       label:'Advance (auto)',      href:'advance.html?project=LCE-2026',              icon:'⚡', groups:'*' },
      { id:'client-portal',        label:'Client Portal (external)',  href:'client-portal.html?project=LCE-2026',        icon:'🔗', groups:'*' },
      { id:'client-portal-config', label:'↳ Portal Config (internal)', href:'client-portal-config.html?project=LCE-2026', icon:'🔧', groups:[PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP, PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS] },
      { id:'portfolio',     label:'Portfolio',           href:'index.html',                                  icon:'▦', groups:'*' },
      { id:'action',        label:'Action Queue',        href:'action-queue.html',                           icon:'◎', groups:'*' },
      { id:'myhome',        label:'My Home',             href:'home.html',                                   icon:'☖', groups:'*' },
      { id:'search',        label:'Search',              href:'search.html',                                 icon:'⌕', groups:'*' }
    ]},

    // =================================================================
    // 2. WORKSPACE — repo group. Commercial entities + readiness/ops.
    // =================================================================
    { label:'▍ Workspace', items:[
      { id:'clients',   label:'Clients',       href:'clients.html',                icon:'◉', groups:'*' },
      { id:'projects',  label:'Projects',      href:'projects.html',               icon:'▤', groups:'*' },
      { id:'tours',     label:'Tours',         href:'tours.html',                  icon:'🚌', groups:'*' },
      { id:'venues',    label:'Venues',        href:'venue.html',                  icon:'🏛', groups:'*' }
    ]},

    // =================================================================
    // 3. SALES — repo group · Pitches / PIFs / Quotes / Programs.
    // =================================================================
    { label:'▍ Sales', items:[
      { id:'pitch',     label:'Pitches',       href:'pitch.html',                  icon:'★', groups:[PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP, PCG.GROUPS.ADMIN] },
      { id:'quote',     label:'Quote Builder', href:'quote.html?id=q.LCE-2026.v3', icon:'§', groups:[PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING] }
    ]},

    // =================================================================
    // 4. PRODUCTION — repo group · Shows / ROS / Show Books / Scheduling.
    // =================================================================
    { label:'▍ Production', items:[
      { id:'ros',          label:'Run of Show',        href:'ros.html?project=GLBX-GSK26', icon:'▶', groups:'*' },
      { id:'showbook',     label:'Show Book',          href:'showbook.html?project=LCE-2026',      icon:'❏', groups:'*' },
      { id:'showbook-gen', label:'Show Book Generator', href:'showbook-gen.html?project=LCE-2026', icon:'⚙', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.SCHEDULING, PCG.GROUPS.TSMS, PCG.GROUPS.AE, PCG.GROUPS.PA] },
      { id:'playbook',     label:'Playbook',           href:'playbook.html?project=LCE-2026',    icon:'☰', groups:'*' },
      { id:'workback',     label:'Workback · Handoff', href:'workback.html?project=LCE-2026',    icon:'⇄', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.SCHEDULING, PCG.GROUPS.TSMS, PCG.GROUPS.AE] },
      { id:'checklist',    label:'Checklists',         href:'checklist.html?project=LCE-2026',   icon:'☑', groups:'*' },
      { id:'field-notes',  label:'Field Notes',        href:'field-notes.html?project=LCE-2026', icon:'✎', groups:'*' },
      { id:'breakouts',    label:'Breakouts',          href:'breakouts.html?project=SAE-WCX-2026', icon:'⊟', groups:'*' },
      { id:'add-order',    label:'Add Orders (Field)', href:'add-order.html',              icon:'＋', groups:[PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS] },
      { id:'tour-edge',    label:'Tour Edge Cases',    href:'tour-edge-cases.html', icon:'⚠', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.SCHEDULING, PCG.GROUPS.AE] },
      { id:'incidents',    label:'Incidents',          href:'incidents.html', icon:'⚠', groups:'*' },
      { id:'closeout',     label:'Closeout',           href:'closeout.html?project=GLBX-GSK26',  icon:'✓', groups:'*' }
    ]},

    // Show Execution content now lives under ▍ Production above.

    // -------- Crew & Labor — repo: under Production / Workspace.  --------
    { label:'▍ Crew & Labor', items:[
      { id:'labor-home',   label:'Labor Home',        href:'labor-home.html',    icon:'⌂', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS] },
      { id:'scheduling',   label:'Scheduling Grid',   href:'scheduling.html',    icon:'▥', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS] },
      { id:'crew-assign',  label:'Assign Crew',       href:'crew-assign.html',   icon:'✔', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS] },
      { id:'project-crew', label:'Project Crew',      href:'project-crew.html?project=LCE-2026', icon:'◴', groups:'*' },
      { id:'crew-profile', label:'Crew Profiles',     href:'crew-profile.html?id=p.pshah', icon:'☰', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS] },
      { id:'travel',       label:'Travel & Per Diem', href:'travel.html',        icon:'✈', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ACCOUNTING] },
      { id:'timesheets',   label:'Timesheets',        href:'timesheets.html',    icon:'◱', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS] },
      { id:'timecard',     label:'My Timecard',       href:'timecard.html',      icon:'⏱', groups:'*' },
      { id:'union-call',   label:'Union Labor Call',  href:'union-call.html?project=SAE-WCX-2026&union=IATSE', icon:'⚡', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS] },
      { id:'messages',     label:'Crew Messages',     href:'messages.html',      icon:'✉', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM] }
    ]},

    // -------- Warehouse — repo group. --------
    { label:'▍ Warehouse', items:[
      { id:'wh-sup-home',  label:'Warehouse Lead',    href:'wh-sup-home.html', icon:'⌂', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS] },
      { id:'wh-tech-home', label:'Warehouse Tech',    href:'wh-tech-home.html', icon:'⌂', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS] },
      { id:'eqlpc',        label:'EQLPC',             href:'eqlpc.html',     icon:'◇', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.DIRECTORS] },
      { id:'inventory',    label:'Inventory',         href:'inventory.html', icon:'▣', groups:'*' },
      { id:'pull-sheet',   label:'Pull Sheets',       href:'pull-sheet.html?id=ps.sae.breakout', icon:'☱', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.DIRECTORS] },
      { id:'kits',         label:'System Builder · Kits', href:'kits.html',   icon:'◆', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.DIRECTORS] },
      { id:'kit-rebuild',  label:'Kit Rebuild · Restock', href:'kit-rebuild.html', icon:'⚒', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.DIRECTORS] },
      { id:'cycle-count',  label:'Cycle Counts',      href:'cycle-count.html', icon:'◷', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.DIRECTORS] },
      { id:'service',      label:'Service / R&M',     href:'service.html',   icon:'⚒', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.DIRECTORS] },
      { id:'logistics',    label:'Logistics',         href:'logistics.html', icon:'🚚', groups:'*' },
      { id:'procurement',  label:'Procurement / RPO', href:'procurement.html', icon:'⊙', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.AE] },
      { id:'vendors',      label:'Vendor Library',    href:'vendors.html', icon:'★', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.AE] }
    ]},

    // -------- Tech Planning — repo: Production / Creative. --------
    { label:'▍ Tech Planning', items:[
      { id:'videoio',      label:'Video I/O Plan',    href:'video-io.html?showId=GLBX-GSK26', icon:'▤', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP] },
      { id:'intercom',     label:'Intercom',          href:'intercom.html?showId=GLBX-GSK26', icon:'📻', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP] },
      { id:'tech-reuse',   label:'Historical Reuse',  href:'tech-reuse.html', icon:'↻', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP] },
      { id:'creative',     label:'Creative · Bldg B', href:'creative.html', icon:'◆', groups:'*' },
      { id:'tech',         label:'Technical',         href:'tech.html',     icon:'▲', groups:'*' }
    ]},

    // Venues moved up into Workspace to mirror the repo.

    // -------- Finance — repo group. --------
    { label:'▍ Finance', items:[
      { id:'finance',      label:'Finance Dashboard', href:'finance.html', icon:'◉', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.AE, PCG.GROUPS.LEADERSHIP] }
    ]},
    { label:'▍ Leadership', items:[
      { id:'reports', label:'Reports',            href:'reports.html', icon:'📊', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.AE] },
      { id:'audit',   label:'Audit Trail',        href:'audit.html',   icon:'◻', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP, PCG.GROUPS.ACCOUNTING] },
      { id:'admin',      label:'Admin · Governance', href:'admin.html',     icon:'⚙', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS] },
      { id:'pay-rules',  label:'Pay Rules Settings', href:'pay-rules.html', icon:'⌘', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS] }
    ]},
    { label:'▍ Field Surfaces', items:[
      { id:'qc',       label:'QC Scan',         href:'qc-scan.html?pullSheet=ps.sae.breakout', icon:'◆', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS] },
      { id:'ic',       label:'IC Return Scan',  href:'ic-scan.html?manifest=man.lce.out1',     icon:'◈', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS] },
      { id:'whtv',     label:'Warehouse TV',    href:'warehouse-tv.html',     icon:'▣', groups:[PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS] },
      { id:'driver',   label:'Driver (mobile)', href:'driver.html?manifest=man.sae.out1', icon:'🚚', groups:'*' },
      { id:'crew-pwa', label:'Crew PWA',        href:'crew/index.html',                  icon:'☷', groups:'*' }
    ]}
  ];

  PCG.navItems = () => {
    const out = [];
    PCG.NAV.forEach(g=>{
      const items = g.items.filter(it=>{
        if(it.groups==='*') return true;
        return it.groups.some(gp=>PCG.hasPermission(gp));
      });
      if(items.length) out.push({ label:g.label, items, primary: !!g.primary });
    });
    return out;
  };

  // ----- Shell render -----
  PCG.renderShell = (opts={}) => {
    const { active="portfolio", crumbs=[], pageTitle="", pageActions="" } = opts;
    const user = PCG.user;

    const nav = PCG.navItems();
    const navHtml = nav.map((g, i)=>{
      const cls = (g.primary ? 'primary ' : '') + (i > 0 ? 'divider' : '');
      return `
      <div class="section-label ${cls}">${PCG.escapeHtml(g.label)}</div>
      ${g.items.map(it=>`
        <a class="nav-item ${it.id===active?"active":""}" href="${it.href}">
          <span class="icon">${it.icon}</span>
          <span class="lbl">${PCG.escapeHtml(it.label)}</span>
        </a>`).join("")}`;
    }).join("");

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
    // Demo Story Mode — renders a guided-flow strip just under the
    // topbar on PM-first pages. Disabled via ?story=off or dismiss button.
    try { PCG.renderStoryStrip && PCG.renderStoryStrip(opts); } catch(e){}
    // wire persona switcher
    const sel = document.getElementById("persona-sel");
    if(sel) sel.addEventListener('change', e => {
      PCG.switchPersona(e.target.value);
      // Redirect to new persona's landing page so they don't land on a
      // page that doesn't match their role (e.g. TSM ending up on pm-home).
      // Exception: stay on the current page if it's a shared deep-link page
      // (quote.html, project.html, tour-view.html etc.) so demos can persist
      // context when "viewing as" another role.
      const stickyPages = ['quote.html','project.html','tour-view.html','tours.html','pitch.html','pitch-view.html','clients.html','finance.html','eqlpc.html','inventory.html','cycle-count.html','video-io.html','intercom.html','scheduling.html','crew-assign.html','crew-profile.html','playbook.html','showbook.html','ros.html','checklist.html','search.html','action-queue.html','admin.html','reports.html','audit.html'];
      const cur = location.pathname.split('/').pop();
      if(stickyPages.includes(cur)){
        location.reload(); // keep the demo context but refresh for new perms
      } else {
        const dest = PCG.api.getLandingUrl();
        location.href = dest || 'home.html';
      }
    });
    // wire topbar search input
    const searchInput = document.querySelector('.topbar .search input');
    if(searchInput){
      searchInput.addEventListener('keydown', e => {
        if(e.key === 'Enter' && searchInput.value.trim()){
          location.href = 'search.html?q=' + encodeURIComponent(searchInput.value.trim());
        }
      });
    }
    // global `/` shortcut to focus search
    document.addEventListener('keydown', e => {
      if(e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA'){
        e.preventDefault();
        const si = document.querySelector('.topbar .search input');
        if(si) si.focus();
      }
    });
  };

  // =================================================================
  // Demo Story Mode — PIF → Show → Fix Issue → Advance → Portal.
  // Renders a compact guided-flow strip between the topbar and the
  // page content. Steps auto-mark complete from sessionStorage flags
  // and the active step is detected from the current page.
  // =================================================================
  PCG.renderStoryStrip = (opts) => {
    if(new URL(location.href).searchParams.get('story') === 'off') return;
    if(sessionStorage.getItem('pcg_story_hide') === '1') return;

    const PAGE = (location.pathname.split('/').pop() || 'home.html');
    const steps = [
      { k:'pif',     lbl:'PIF',          ico:'◧', href:'pif.html',
        match: p => p === 'pif.html',
        done: () => {
          const drafts = JSON.parse(sessionStorage.getItem('pcg_demo_shows') || '[]');
          return drafts.length > 0 || ['show-center.html','advance.html','site-visit.html','field-capture.html','client-portal.html','client-portal-config.html'].includes(PAGE);
        }
      },
      { k:'show',    lbl:'Show Center',  ico:'◈', href:'show-center.html?project=LCE-2026',
        match: p => p === 'show-center.html',
        done: () => ['advance.html','site-visit.html','field-capture.html','client-portal.html','client-portal-config.html'].includes(PAGE)
      },
      { k:'fix',     lbl:'Fix Issue',    ico:'⚠', href:'show-center.html?project=LCE-2026#sec-decisions',
        match: p => p === 'show-center.html' && location.hash === '#sec-decisions',
        done: () => {
          // Count marked-as-decision from any show's chat marks
          const keys = Object.keys(sessionStorage).filter(k => k.startsWith('pcg_chat_marks_'));
          return keys.some(k => { try { const m = JSON.parse(sessionStorage.getItem(k) || '{}'); return (m.decision || []).length > 0 || (m.issue || []).length > 0; } catch { return false; } });
        }
      },
      { k:'field',   lbl:'Field / Visit', ico:'📱', href:'field-capture.html?project=LCE-2026',
        match: p => p === 'field-capture.html' || p === 'site-visit.html',
        done: () => {
          return Object.keys(sessionStorage).some(k => k.startsWith('pcg_field_') && JSON.parse(sessionStorage.getItem(k) || '[]').length > 0)
              || Object.keys(sessionStorage).some(k => k.startsWith('pcg_sv_'));
        }
      },
      { k:'advance', lbl:'Advance',      ico:'⚡', href:'advance.html?project=LCE-2026',
        match: p => p === 'advance.html',
        done: () => PAGE === 'client-portal.html' || PAGE === 'client-portal-config.html'
      },
      { k:'portal',  lbl:'Client Portal', ico:'🔗', href:'client-portal.html?project=LCE-2026',
        match: p => p === 'client-portal.html',
        done: () => false
      }
    ];

    let activeIdx = steps.findIndex(s => s.match(PAGE));
    if(activeIdx < 0){
      // Default: first not-done step
      activeIdx = steps.findIndex(s => !s.done());
      if(activeIdx < 0) activeIdx = steps.length - 1;
    }

    const strip = document.createElement('div');
    strip.className = 'story-strip';
    strip.innerHTML = `
      <div class="story-inner">
        <span class="story-tag">🎬 Demo Story · run it end-to-end</span>
        <div class="story-steps">
          ${steps.map((s, i) => {
            const isDone = i < activeIdx || s.done();
            const isOn   = i === activeIdx;
            return `
              <a class="story-step ${isOn?'on':''} ${isDone?'done':''}" href="${s.href}" data-k="${s.k}">
                <span class="sn">${isDone && !isOn ? '✓' : (i + 1)}</span>
                <span class="si">${s.ico}</span>
                <span class="sl">${PCG.escapeHtml(s.lbl)}</span>
              </a>
              ${i < steps.length - 1 ? '<span class="story-arrow">→</span>' : ''}`;
          }).join('')}
        </div>
        <button class="story-hide" title="Hide for this session">×</button>
      </div>`;
    // Insert right after the topbar (or fall back to body start)
    const topbar = document.querySelector('.topbar');
    if(topbar && topbar.parentNode) topbar.parentNode.insertBefore(strip, topbar.nextSibling);
    else document.body.insertBefore(strip, document.body.firstChild);

    strip.querySelector('.story-hide').addEventListener('click', () => {
      sessionStorage.setItem('pcg_story_hide', '1');
      strip.remove();
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
