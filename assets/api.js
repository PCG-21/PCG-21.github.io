/* ==========================================================================
   PCG STAGE — API Abstraction Layer (MANDATORY — Rule 1)
   Every data access from every frontend layer routes through PCG.api.*.
   Phase 1: wrappers read static data.js.
   Phase 2+: wrappers call fetch('/api/...') — calling code never changes.
   ========================================================================== */
(function(){
  window.PCG = window.PCG || {};
  PCG.api = PCG.api || {};
  const G = PCG.GROUPS;

  // ------------------------------------------------------------------
  // Private "raw" accessors — used by engines only, never by UI.
  // UI MUST call PCG.api.*. These start with _raw to make that obvious.
  // ------------------------------------------------------------------
  PCG._rawGetActiveQuote   = (showId) => (PCG.quotes||[]).find(q=>q.showId===showId && q.status==='Issued');
  PCG._rawGetPullSheets    = (showId) => (PCG.pullSheets||[]).filter(p=>p.showId===showId);
  PCG._rawGetScans         = (showId) => (PCG.scanRecords||[]).filter(s=>s.showId===showId);
  PCG._rawExpectedReturnScans = (showId) => {
    const lines = (PCG.pullSheets||[]).filter(p=>p.showId===showId)
      .flatMap(p=>(p.lines||[])).length;
    return Math.max(1, lines);
  };
  PCG._rawMissingItems     = (showId) => (PCG.serviceTickets||[]).filter(t=>t.showId===showId && t.status==='Open' && t.missing);
  PCG._rawGetServiceTickets= (showId) => (PCG.serviceTickets||[]).filter(t=>t.showId===showId);
  PCG._rawAppendLifecycleLog = (entry) => {
    PCG.lifecycleLog = PCG.lifecycleLog || [];
    PCG.lifecycleLog.push(entry);
  };

  // ------------------------------------------------------------------
  // Identity / permissions (Section 3.7)
  // ------------------------------------------------------------------
  PCG.api.getCurrentUser = () => ({ ...PCG.user, groups: PCG.user.groups.slice() });
  PCG.api.hasPermission  = (group) => PCG.hasPermission(group);

  // ------------------------------------------------------------------
  // Projects & Shows
  // ------------------------------------------------------------------
  PCG.api.getProjects = (filter) => {
    let list = (PCG.projects||[]);
    if(filter && filter.state) list = list.filter(p=>p.show && p.show.lifecycleState===filter.state);
    if(filter && filter.mine)  list = list.filter(p=>p.pmId===PCG.user.id || p.aeId===PCG.user.id);
    // everyone sees tier-4 project data
    return list.map(p => PCG.api._redactProject(p));
  };

  PCG.api.getProject = (code) => {
    const p = (PCG.projects||[]).find(x=>x.code===code);
    return p ? PCG.api._redactProject(p) : null;
  };

  PCG.api.getShow = (showId) => {
    const p = (PCG.projects||[]).find(x => x.show && (x.show.id===showId || x.code===showId));
    if(!p || !p.show) return null;
    return Object.assign({}, p.show, { projectCode: p.code, client: p.client, clientId: p.clientId });
  };

  PCG.api._redactProject = (p) => {
    const copy = JSON.parse(JSON.stringify(p));
    // margin / cost visibility (Tier 2)
    if(!PCG.canSeeTier('T2_MARGINS')){
      delete copy.margin;
      delete copy.cost;
      if(copy.amountsApprox) delete copy.amountsApprox;
    }
    return copy;
  };

  // ------------------------------------------------------------------
  // Quotes
  // ------------------------------------------------------------------
  PCG.api.getQuotes = (projectCode) => {
    const list = (PCG.quotes||[]).filter(q=>!projectCode || q.projectCode===projectCode);
    return list.map(q => PCG.api._redactQuote(q));
  };
  PCG.api.getQuote = (id) => {
    const q = (PCG.quotes||[]).find(x=>x.id===id);
    return q ? PCG.api._redactQuote(q) : null;
  };
  PCG.api.getQuoteRevision = (revId) => {
    const r = (PCG.quoteRevisions||[]).find(x=>x.id===revId);
    if(!r) return null;
    const copy = JSON.parse(JSON.stringify(r));
    if(!PCG.canSeeTier('T2_MARGINS')){
      delete copy.totalCost;
      delete copy.margin;
      // also strip cost from lines
      (copy.lines||[]).forEach(l => { delete l.cost; delete l.marginContribution; });
    }
    return copy;
  };
  PCG.api._redactQuote = (q) => {
    const copy = JSON.parse(JSON.stringify(q));
    if(!PCG.canSeeTier('T2_MARGINS')){
      delete copy.totalCost; delete copy.margin;
    }
    return copy;
  };
  PCG.api.getQuoteMargin = (quoteId) => {
    if(!PCG.canSeeTier('T2_MARGINS')) return null;
    const q = (PCG.quotes||[]).find(x=>x.id===quoteId);
    return q ? { revenue:q.totalRevenue, cost:q.totalCost, margin:q.margin } : null;
  };

  // ------------------------------------------------------------------
  // Inventory & Availability
  // ------------------------------------------------------------------
  PCG.api.getInventory = (filter) => {
    let list = (PCG.inventory||[]).slice();
    if(filter && filter.category) list = list.filter(i=>i.categoryId===filter.category);
    if(filter && filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(i => (i.name||'').toLowerCase().includes(q) || (i.model||'').toLowerCase().includes(q));
    }
    return list.map(i => PCG.api._redactInventory(i));
  };
  PCG.api.getInventoryItem = (id) => {
    const i = (PCG.inventory||[]).find(x=>x.id===id);
    return i ? PCG.api._redactInventory(i) : null;
  };
  PCG.api._redactInventory = (i) => {
    const copy = JSON.parse(JSON.stringify(i));
    if(!PCG.canSeeTier('T3_BILL_RATES')){
      delete copy.rates;
      delete copy.replacementCost;
    }
    // perItemCost is cost basis — only Admin/Accounting see it
    if(!PCG.hasAnyPermission(G.ADMIN, G.ACCOUNTING)){
      delete copy.perItemCost;
    }
    return copy;
  };
  PCG.api.getInventoryCategories = () => (PCG.inventoryCategories||[]).slice();

  PCG.api.checkAvailability = (req) => PCG.engines.availability.check(req);

  PCG.api.getAllocations = (filter) => {
    let list = (PCG.allocations||[]).slice();
    if(filter && filter.showId) list = list.filter(a=>a.showId===filter.showId);
    if(filter && filter.itemId) list = list.filter(a=>a.inventoryItemId===filter.itemId);
    return list;
  };

  // ------------------------------------------------------------------
  // Crew & Labor
  // ------------------------------------------------------------------
  PCG.api.getCrewRoster = (filter) => {
    const list = (PCG.crewMembers||[]).slice();
    return list.map(m => PCG.api._redactCrewMember(m));
  };
  PCG.api.getCrewMember = (id) => {
    const m = (PCG.crewMembers||[]).find(x=>x.id===id);
    return m ? PCG.api._redactCrewMember(m) : null;
  };
  PCG.api._redactCrewMember = (m) => {
    const copy = JSON.parse(JSON.stringify(m));
    if(!PCG.canSeeTier('T1_CREW_PAY_RATES')){
      delete copy.payRate;
      (copy.qualifications||[]).forEach(q => delete q.payRate);
    }
    return copy;
  };
  PCG.api.getCrewPosition = (id) => {
    const pos = (PCG.crewPositions||[]).find(x=>x.id===id);
    if(!pos) return null;
    const copy = JSON.parse(JSON.stringify(pos));
    if(!PCG.canSeeTier('T1_CREW_PAY_RATES')){
      (copy.ratesByVersion||[]).forEach(r => delete r.payRate);
    }
    if(!PCG.canSeeTier('T3_BILL_RATES')){
      (copy.ratesByVersion||[]).forEach(r => delete r.billRate);
    }
    return copy;
  };
  PCG.api.getSchedule = (showId) => {
    return (PCG.shiftAssignments||[]).filter(s=>s.showId===showId);
  };
  PCG.api.checkCrewConflict = (assn) => PCG.engines.scheduling.checkAssignment(assn);

  PCG.api.getLaborActuals = (showId) => {
    // Cost visibility (Tier 2) gate
    const list = (PCG.laborActuals||[]).filter(l=>l.showId===showId).map(l=>{
      const copy = Object.assign({}, l);
      if(!PCG.canSeeTier('T1_CREW_PAY_RATES')) delete copy.payRate;
      if(!PCG.canSeeTier('T2_MARGINS')) delete copy.totalCost;
      return copy;
    });
    return list;
  };

  // ------------------------------------------------------------------
  // Warehouse / Pull / Scan / Manifest
  // ------------------------------------------------------------------
  PCG.api.getPullSheets = (showId) => (PCG.pullSheets||[]).filter(p=>p.showId===showId);
  PCG.api.getPullSheet  = (id) => (PCG.pullSheets||[]).find(p=>p.id===id);

  PCG.api.getWarehouseState = (whId) => {
    const whId2 = whId || 'wh.premier-main';
    const wh = { id: whId2, name:'Premier — Main Office', stats:{} };
    wh.stats.activePulls  = (PCG.pullSheets||[]).filter(p=>['InProgress','Prepped','Finalized'].includes(p.status)).length;
    wh.stats.openQCTickets = (PCG.serviceTickets||[]).filter(t=>t.status==='Open').length;
    wh.stats.outgoingManifests = (PCG.manifests||[]).filter(m=>m.status==='Staged'||m.status==='Departed').length;
    wh.stats.incomingManifests = (PCG.manifests||[]).filter(m=>m.status==='Returning').length;
    return wh;
  };

  PCG.api.getManifests = (filter) => {
    let list = (PCG.manifests||[]).slice();
    if(filter && filter.showId) list = list.filter(m=>m.showId===filter.showId);
    return list;
  };
  PCG.api.getManifest = (id) => (PCG.manifests||[]).find(m=>m.id===id);

  PCG.api.recordScan = async (scan) => {
    // Goes through offline queue first; IndexedDB is the durable store.
    try {
      const rec = await PCG.engines.sync.queue(scan);
      // live-append for demo UI updates
      PCG.scanRecords = PCG.scanRecords || [];
      PCG.scanRecords.push({
        showId: scan.showId, pullSheetLineId: scan.pullSheetLineId,
        serialId: scan.itemSerial, result: scan.result,
        direction: scan.direction || 'outbound',
        techId: PCG.user.id, ts: new Date().toISOString()
      });
      return { ok:true, scanId:rec.scanId, syncStatus:rec.syncStatus };
    } catch(e){
      return { ok:false, error:e.message };
    }
  };

  // ------------------------------------------------------------------
  // Sub-rentals / RPOs
  // ------------------------------------------------------------------
  PCG.api.getSubRentals = (filter) => {
    let list = (PCG.subRentals||[]).slice();
    if(filter && filter.showId) list = list.filter(r=>r.showId===filter.showId);
    return list;
  };
  PCG.api.getSubRental = (id) => (PCG.subRentals||[]).find(r=>r.id===id);

  // ------------------------------------------------------------------
  // Change Orders / Invoice milestones
  // ------------------------------------------------------------------
  PCG.api.getChangeOrders = (filter) => {
    let list = (PCG.changeOrders||[]).slice();
    if(filter && filter.projectCode) list = list.filter(c=>c.projectCode===filter.projectCode);
    // financialImpact is Tier 2
    if(!PCG.canSeeTier('T2_MARGINS')) list.forEach(c => delete c.financialImpact);
    return list;
  };
  PCG.api.getInvoiceMilestones = (projectCode) => {
    PCG.requireAny(G.ADMIN, G.ACCOUNTING, G.AE, G.AE_NO_CONFIRM, G.DIRECTORS);
    return (PCG.invoiceMilestones||[]).filter(m=>m.projectCode===projectCode);
  };

  // ------------------------------------------------------------------
  // Service tickets
  // ------------------------------------------------------------------
  PCG.api.getServiceTickets = (filter) => {
    let list = (PCG.serviceTickets||[]).slice();
    if(filter && filter.showId) list = list.filter(t=>t.showId===filter.showId);
    if(filter && filter.status) list = list.filter(t=>t.status===filter.status);
    return list;
  };

  // ------------------------------------------------------------------
  // Action queue / Approvals / Notifications
  // ------------------------------------------------------------------
  PCG.api.getActionQueue = () => {
    return (PCG.actionQueue||[]).filter(q=>{
      if(q.roles && q.roles.length)
        return q.roles.some(r => PCG.user.groups.includes(r));
      return true;
    });
  };
  PCG.api.getApprovals = (filter) => {
    // approvals are part of quote / CO flows; filter by pending by default
    return (PCG.approvals||[]).filter(a =>
      (!filter || !filter.status || a.status===filter.status) &&
      (!a.approverRoles || a.approverRoles.some(r => PCG.user.groups.includes(r)))
    );
  };
  PCG.api.getNotifications = (n) => PCG.engines.notify.recent(n||20);

  // ------------------------------------------------------------------
  // Conflicts (EQLPC)
  // ------------------------------------------------------------------
  PCG.api.getInventoryConflicts = () => PCG.engines.conflict.scanPortfolio();

  // ------------------------------------------------------------------
  // Transitions
  // ------------------------------------------------------------------
  PCG.api.canTransition = (showId, toState) => {
    const show = PCG.api.getShow(showId);
    return PCG.engines.lifecycle.canTransition(show, toState);
  };
  PCG.api.transitionShow = (showId, toState, opts) => {
    const show = PCG.api.getShow(showId);
    return PCG.engines.lifecycle.transition(show, toState, opts);
  };

  // ------------------------------------------------------------------
  // Rate cards / positions
  // ------------------------------------------------------------------
  PCG.api.getRateCardVersions = () => (PCG.rateCardVersions||[]).slice();

  // ------------------------------------------------------------------
  // Venues / Contacts
  // ------------------------------------------------------------------
  PCG.api.getVenues   = () => (PCG.venues||[]).slice();
  PCG.api.getVenue    = (id) => (PCG.venues||[]).find(v=>v.id===id);
  PCG.api.getContacts = (projectCode) => (PCG.contacts||[]).filter(c=>c.project===projectCode);

  // ------------------------------------------------------------------
  // Rooms / Breakouts (SAE WCX fixture)
  // ------------------------------------------------------------------
  PCG.api.getBreakouts = (showCode) => {
    if(showCode==='SAE-WCX-2026') return PCG.saeBreakouts;
    return null;
  };

  // ------------------------------------------------------------------
  // Manifest (driver) — magic-link scoped accessor (demo)
  // ------------------------------------------------------------------
  PCG.api.getDriverManifest = (manifestId) => {
    const m = (PCG.manifests||[]).find(x=>x.id===manifestId);
    if(!m) return null;
    // Strip anything not driver-relevant
    return {
      id:m.id, showId:m.showId, showName: (PCG.api.getShow(m.showId)||{}).name,
      vehicle: m.vehicle, driverName: m.driverName, departureDate: m.departureDate,
      arrivalDate: m.arrivalDate, dockInfo: m.dockInfo, address: m.address,
      items: (m.loadZones||[]).map(z => ({ zone:z.zone, cases:z.cases })),
      status: m.status
    };
  };

  // ------------------------------------------------------------------
  // Finance handoff packet (QuickBooks structured payload, §9.1)
  // ------------------------------------------------------------------
  PCG.api.generateQBHandoff = (projectCode) => {
    PCG.requireAny(G.ADMIN, G.ACCOUNTING, G.DIRECTORS);
    const p = (PCG.projects||[]).find(x=>x.code===projectCode);
    if(!p) return null;
    const quote = (PCG.quotes||[]).find(q=>q.projectCode===projectCode);
    const cos = (PCG.changeOrders||[]).filter(c=>c.projectCode===projectCode && c.status==='Approved');
    const coTotal   = cos.filter(c=>c.type==='CO').reduce((s,c)=>s+(c.financialImpact||0),0);
    const addTotal  = cos.filter(c=>c.type==='AddOrder').reduce((s,c)=>s+(c.financialImpact||0),0);
    const dmgTotal  = cos.filter(c=>c.type==='DamageCharge').reduce((s,c)=>s+(c.financialImpact||0),0);
    const laborActual = (PCG.laborActuals||[]).filter(l=>l.showId===(p.show&&p.show.id)).reduce((s,l)=>s+(l.totalCost||0),0);
    const subCost     = (PCG.subRentals||[]).filter(r=>r.projectCode===projectCode && r.status!=='Cancelled').reduce((s,r)=>s+(r.invoiceAmount||r.quotedCost||0),0);
    const revenue = (quote && quote.totalRevenue) || 0;
    const totalRev = revenue + coTotal + addTotal + dmgTotal;
    return {
      showId: projectCode, showName:p.name, client:p.client, closedAt:new Date().toISOString(),
      financials: {
        quoteRevenue: revenue, coAdders: coTotal, addOrderAdders: addTotal, damageCharges: dmgTotal,
        totalRevenue: totalRev, depositReceived: Math.round(totalRev*0.5), balanceDue: Math.round(totalRev*0.5),
        laborCostActual: laborActual, subRentalCostActual: subCost,
        estimatedMargin: totalRev ? ((totalRev - laborActual - subCost)/totalRev) : 0
      },
      lineItems: [
        { category:'revenue',   description:'Show Services',     amount:revenue, qbAccount:'TBD' },
        { category:'labor',     description:'Production Labor',  amount:laborActual, qbAccount:'TBD' },
        { category:'subrental', description:'Sub-Rentals',       amount:subCost, qbAccount:'TBD' },
        { category:'co',        description:'Change Orders',     amount:coTotal, qbAccount:'TBD' },
        { category:'addorder',  description:'Add Orders',        amount:addTotal, qbAccount:'TBD' },
        { category:'damage',    description:'Damage Charges',    amount:dmgTotal, qbAccount:'TBD' }
      ],
      qbStatus: 'pending'
    };
  };

  // ------------------------------------------------------------------
  // Travel
  // ------------------------------------------------------------------
  PCG.api.getTravelRecords = (showId) => (PCG.travelRecords||[]).filter(t=>t.showId===showId);

  // ------------------------------------------------------------------
  // v2.1 additions — Readiness · Editability · Landing · SOT
  // ------------------------------------------------------------------

  /** Source of truth: ShowReadiness confidence score (§E). */
  PCG.api.getReadiness = (showId) => PCG.engines.readiness.compute(showId);

  /** Batch readiness for portfolio view. */
  PCG.api.getPortfolioReadiness = () =>
    (PCG.projects||[])
      .filter(p=>p.show && p.show.lifecycleState!=='Archived')
      .map(p => ({ code:p.code, name:p.name, readiness: PCG.engines.readiness.compute(p.code) }));

  /** Can the current user edit this field in this show's current state? */
  PCG.api.canEditField = (entityPath, showId, requiredGroups) => {
    const show = PCG.api.getShow(showId);
    return PCG.engines.editability.check(entityPath, show, requiredGroups);
  };

  /** Role-based landing URL for the current user. */
  PCG.api.getLandingUrl = () => PCG.landingUrlForUser(PCG.user);

  /** Source-of-truth descriptor for a domain. */
  PCG.api.getTruthSource = (domain) => PCG.truthSourceFor(domain);

  // ------------------------------------------------------------------
  // v2.1 — PIF (Project Intake Form)
  // ------------------------------------------------------------------
  PCG.api.getPIFs = () => (PCG.pifs||[]).slice();
  PCG.api.getPIF  = (id) => (PCG.pifs||[]).find(p=>p.id===id);

  /** PIF handoff readiness score (§4.2). 0-100. */
  PCG.api.getPIFReadiness = (pifId) => {
    const pif = PCG.api.getPIF(pifId);
    if(!pif) return null;
    const checks = [
      { k:'venueId',              w:15, ok: !!pif.venueId },
      { k:'dates.estimatedLoadIn',w:15, ok: !!(pif.dates && pif.dates.estimatedLoadIn) },
      { k:'dates.estimatedShowStart',w:15, ok: !!(pif.dates && pif.dates.estimatedShowStart) },
      { k:'departments',          w:15, ok: (pif.departments||[]).length>0 },
      { k:'priorProjectRef',      w:10, ok: !!pif.priorProjectRef },
      { k:'clientContactName',    w:10, ok: !!pif.clientContactName },
      { k:'clientContactEmail',   w:10, ok: !!pif.clientContactEmail },
      { k:'aeId',                 w:10, ok: !!pif.aeId }
    ];
    const score = checks.reduce((s,c)=>s + (c.ok ? c.w : 0), 0);
    return {
      pifId, score, canAssignPM: score >= 60,
      missing: checks.filter(c=>!c.ok).map(c=>c.k)
    };
  };

  // ------------------------------------------------------------------
  // v2.1 — Venue Records (§F)
  // ------------------------------------------------------------------
  PCG.api.getVenueRecord = (id) => {
    const v = (PCG.venues||[]).find(x=>x.id===id);
    return v || null;
  };
  PCG.api.getVenueWarnings = (venueId) => {
    const v = PCG.api.getVenueRecord(venueId);
    return v && v.warningFlags ? v.warningFlags.slice() : [];
  };
  PCG.api.getPriorShowsAtVenue = (venueId) => {
    return (PCG.projects||[])
      .filter(p=>p.venueId===venueId && p.show && p.show.lifecycleState==='Archived')
      .map(p=>({ code:p.code, name:p.name, loadIn:p.dates.loadIn }));
  };
  PCG.api.getSiteSurveys = (venueId) => (PCG.siteSurveys||[]).filter(s=>s.venueId===venueId);

  // ------------------------------------------------------------------
  // v2.1 — Checklist
  // ------------------------------------------------------------------
  PCG.api.getChecklists = (showId) => (PCG.checklistItems||[]).filter(c=>c.showId===showId);
  PCG.api.getChecklistByPhase = (showId, phase) =>
    PCG.api.getChecklists(showId).filter(c=>c.phase===phase);
  PCG.api.completeChecklistItem = (id) => PCG.engines.checklistGate.completeItem(id);
  PCG.api.overrideChecklistItem = (id, reason) => PCG.engines.checklistGate.overrideItem(id, reason);
  PCG.api.canAdvanceToState = (showId, toState) => {
    const show = PCG.api.getShow(showId);
    return PCG.engines.checklistGate.canAdvance(show, toState);
  };

  // ------------------------------------------------------------------
  // v2.1 — Run of Show
  // ------------------------------------------------------------------
  PCG.api.getRunOfShow   = (showId) => (PCG.runOfShows||[]).find(r=>r.showId===showId) || null;
  PCG.api.getROSTemplates = () => (PCG.rosTemplates||[]).slice();
  PCG.api.getGlobalElements = () => (PCG.globalElements||[]).slice();
  PCG.api.getLiveROSState = (showId) => {
    const ros = PCG.api.getRunOfShow(showId);
    if(!ros) return null;
    const cur  = (ros.items||[]).find(i=>i.status==='InProgress');
    const done = (ros.items||[]).filter(i=>i.status==='Complete').length;
    const next = (ros.items||[]).find(i=>i.status==='Pending');
    return { status:ros.status, currentItem:cur, nextItem:next, completedCount:done, totalCount:(ros.items||[]).length };
  };

  // ------------------------------------------------------------------
  // v2.1 — Exception Overrides (§D)
  // ------------------------------------------------------------------
  PCG.api.getExceptionOverrides = (filter) => {
    let list = (PCG.exceptionOverrides||[]).slice();
    if(filter && filter.entityType) list = list.filter(e=>e.entityType===filter.entityType);
    if(filter && filter.showId)     list = list.filter(e=>e.entityId===filter.showId || (e.entityId||'').indexOf(filter.showId)===0);
    return list;
  };
  PCG.api.getActiveBanners = (showId) => {
    // Persistent warning banners per §D.5
    const banners = [];
    const show = PCG.api.getShow(showId);
    if(!show) return banners;
    // Checklist overrides on this show
    (PCG.checklistItems||[])
      .filter(c=>c.showId===showId && c.status==='Overridden')
      .forEach(c => banners.push({
        level:'yellow',
        title:`Checklist overridden: ${c.taskName}`,
        detail: c.overrideReason || '—'
      }));
    // Pull sheet finalized without Walk-the-Pile
    (PCG.pullSheets||[])
      .filter(p=>p.showId===showId && p.status==='Finalized' && !p.authorizedById)
      .forEach(p => banners.push({
        level:'red',
        title:`Pull sheet ${p.id} finalized WITHOUT Walk-the-Pile`,
        detail:'Warehouse supervisor authorization required.'
      }));
    // Unfilled positions
    const unfilled = (PCG.shiftAssignments||[]).filter(s=>s.showId===showId && !s.crewMemberId);
    if(unfilled.length) banners.push({
      level:'yellow',
      title:`${unfilled.length} labor position(s) unfilled`,
      detail: unfilled.map(s=>s.positionId).join(', ')
    });
    // RPO past hold expiry
    (PCG.subRentals||[])
      .filter(r=>r.showId===showId && r.status==='PendingApproval' && r.holdExpiry && new Date(r.holdExpiry) < new Date())
      .forEach(r => banners.push({
        level:'red',
        title:`RPO hold expired: ${r.vendorName} — ${r.itemDescription}`,
        detail: `Contact vendor; confirm or re-quote.`
      }));
    // Open service tickets on show gear
    (PCG.serviceTickets||[])
      .filter(t=>t.showId===showId && t.status==='Open')
      .forEach(t => banners.push({
        level: t.missing ? 'red' : 'yellow',
        title: `${t.missing?'Missing':'Open'} service ticket: ${t.description||t.id}`,
        detail: t.serialId ? `Serial ${t.serialId}` : ''
      }));
    return banners;
  };

  // ------------------------------------------------------------------
  // v2.1 — Hierarchy: Days / Shifts / Tasks
  // ------------------------------------------------------------------
  PCG.api.getDays = (showId)    => (PCG.days||[]).filter(d=>d.showId===showId);
  PCG.api.getShifts = (dayId)   => (PCG.shifts||[]).filter(s=>s.dayId===dayId);
  PCG.api.getTasks = (shiftId)  => (PCG.tasks||[]).filter(t=>t.shiftId===shiftId);

  // ------------------------------------------------------------------
  // v2.1 — Add Orders (§5.2 — now a distinct entity from ChangeOrder)
  // ------------------------------------------------------------------
  PCG.api.getAddOrders = (showId) => (PCG.addOrders||[]).filter(a=>a.showId===showId);

  // ------------------------------------------------------------------
  // Scope / Current Scope (ScopeRecord + approved COs)
  // ------------------------------------------------------------------
  PCG.api.getScopeRecord = (projectCode) =>
    (PCG.scopeRecords||[]).find(s=>s.projectCode===projectCode) || null;
  PCG.api.getCurrentScope = (projectCode) => {
    const baseline = PCG.api.getScopeRecord(projectCode);
    const cos = PCG.api.getChangeOrders({projectCode}).filter(c=>c.status==='Approved');
    return { baselineId: baseline && baseline.id, approvedChangeOrders: cos, baseline };
  };

  // ------------------------------------------------------------------
  // Audit Log access
  // ------------------------------------------------------------------
  PCG.api.getAuditLog = (filter) => {
    let list = (PCG.auditLog||[]).slice();
    if(filter && filter.entityId) list = list.filter(e=>e.entityId===filter.entityId);
    if(filter && filter.action)   list = list.filter(e=>e.action && e.action.startsWith(filter.action));
    return list;
  };

})();
