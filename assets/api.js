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
  // Quote line editing (§EE pricing — rate tiers + client discounts)
  // ------------------------------------------------------------------
  // Find a revision anywhere it lives (PCG.quoteRevisions global, or quote.revisions[])
  const _findRevAny = (revId) => {
    let rev = (PCG.quoteRevisions||[]).find(r => r.id === revId);
    let quote = null;
    if(rev){
      quote = (PCG.quotes||[]).find(q => q.id === rev.quoteId || q.activeRevisionId === revId);
    } else {
      for(const q of (PCG.quotes||[])){
        const r = (q.revisions||[]).find(x => x.id === revId);
        if(r){ rev = r; quote = q; break; }
      }
    }
    return { rev, quote };
  };

  PCG.api.updateQuoteLine = (revId, lineId, patch) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    const { rev, quote } = _findRevAny(revId);
    if(!rev) throw new Error('Revision not found: '+revId);
    return applyPatch(rev, lineId, patch, quote);

    function applyPatch(rev, lineId, patch, quote){
      const line = (rev.lines||[]).find(l => l.id === lineId);
      if(!line) throw new Error('Line not found');
      if(rev.status === 'Issued' || rev.status === 'Accepted'){
        throw new Error('Cannot edit — revision is '+rev.status+'. Create a new revision.');
      }
      Object.assign(line, patch);

      // If rateTier changed, pull the right unitPrice from the inventory item
      if(patch.rateTier !== undefined && line.inventoryItemId){
        const inv = PCG.api.getInventoryItem(line.inventoryItemId);
        const rates = inv && inv.rates ? inv.rates : {};
        const tier = patch.rateTier;
        if(tier === 'client'){
          // Resolve clientId: quote.clientId → project.clientId lookup
          let clientId = quote && quote.clientId;
          if(!clientId && quote && quote.projectCode){
            const proj = (PCG.projects||[]).find(p => p.code === quote.projectCode);
            if(proj) clientId = proj.clientId;
          }
          const client = clientId ? PCG.api.getClient(clientId) : null;
          const baseDay = rates.day || line.unitPrice || 0;
          const discount = (client && client.discountPct) || 0;
          line.unitPrice = Math.round(baseDay * (1 - discount) * 100) / 100;
          line.clientDiscountPct = discount;
          line.rateTier = 'client';
        } else if(rates[tier] != null){
          line.unitPrice = rates[tier];
          line.clientDiscountPct = 0;
          line.rateTier = tier;
        }
      }

      // Recompute extended
      line.extended = (line.unitPrice || 0) * (line.qty || 0) * (line.days || 1);

      // Recompute revision totals via engine
      if(PCG.engines && PCG.engines.pricing && PCG.engines.pricing.computeRevisionTotals){
        try { PCG.engines.pricing.computeRevisionTotals(rev); } catch(e){}
      }

      PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'quoteLine.update', entityId:line.id, detail:Object.keys(patch).join(',') });
      return line;
    }
  };

  PCG.api.setRevisionDiscount = (revId, discount) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    const { rev: r } = _findRevAny(revId);
    if(!r) throw new Error('Revision not found');
    if(r.status === 'Issued' || r.status === 'Accepted'){
      throw new Error('Cannot modify discount on '+r.status+' revision — create a new revision.');
    }
    const pct = discount.type === 'percent' ? discount.value : 0;
    if(pct > 0.15){ PCG.requireAny(PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN); }
    r.discount = Object.assign({}, discount, { appliedAt:new Date().toISOString(), appliedById:PCG.user.id });
    if(PCG.engines && PCG.engines.pricing && PCG.engines.pricing.computeRevisionTotals){
      try { PCG.engines.pricing.computeRevisionTotals(r); } catch(e){}
    }
    PCG.auditLog.push({ at:r.discount.appliedAt, actor:PCG.user.id, action:'quote.discount.set', entityId:revId, detail:`${discount.type} ${discount.value} — ${discount.reason||''}` });
    return r.discount;
  };

  PCG.api.updateQuoteStatus = (quoteId, toStatus, reason) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    const q = (PCG.quotes||[]).find(x => x.id === quoteId);
    if(!q) throw new Error('Quote not found');
    const valid = ['Draft','InReview','Issued','Awarded','OnHold','Cancelled','Lost'];
    if(!valid.includes(toStatus)) throw new Error('Invalid status: '+toStatus);
    const prev = q.status;
    if(prev === 'Cancelled' && toStatus !== 'Cancelled'){
      PCG.requireAny(PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN);
    }
    q.status = toStatus;
    q['status_'+toStatus.toLowerCase()+'At'] = new Date().toISOString();
    if(toStatus === 'Cancelled' || toStatus === 'Lost') q.cancelReason = reason || '';
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'quote.status.'+toStatus.toLowerCase(), entityId:quoteId, detail:`${prev} → ${toStatus}${reason?' · '+reason:''}` });
    PCG.engines.notify.emit('QuoteStatusChanged', { quoteId, from:prev, to:toStatus });
    return q;
  };

  // ------------------------------------------------------------------
  // Quote Revisions — "New Revision" clone (replaces the immutable-Awarded case)
  // ------------------------------------------------------------------
  PCG.api.createQuoteRevision = (quoteId, opts) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    opts = opts || {};
    const q = (PCG.quotes||[]).find(x => x.id === quoteId);
    if(!q) return { ok:false, reason:'Quote not found' };
    // Find latest revision (the one to clone from)
    const sourceRev = (PCG.quoteRevisions||[]).find(r => r.id === (opts.fromRevId || q.activeRevisionId));
    if(!sourceRev) return { ok:false, reason:'Source revision not found' };
    const existingRevs = (PCG.quoteRevisions||[]).filter(r => r.quoteId === quoteId);
    const nextNum = Math.max(0, ...existingRevs.map(r => r.revisionNumber || 0)) + 1;
    const newRev = {
      id: 'qr.'+q.projectCode+'.v'+nextNum,
      quoteId,
      revisionNumber: nextNum,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      createdById: PCG.user.id,
      clonedFromRevisionId: sourceRev.id,
      lines: JSON.parse(JSON.stringify(sourceRev.lines||[])).map(l => Object.assign(l, { id:'qln.'+Math.random().toString(36).slice(2,8) })),
      options: JSON.parse(JSON.stringify(sourceRev.options||[])),
      discount: sourceRev.discount ? Object.assign({}, sourceRev.discount) : null,
      corrections: []
    };
    PCG.quoteRevisions = PCG.quoteRevisions || [];
    PCG.quoteRevisions.push(newRev);
    if(opts.makeActive !== false) q.activeRevisionId = newRev.id;
    if(PCG.engines && PCG.engines.pricing && PCG.engines.pricing.computeRevisionTotals){
      try { PCG.engines.pricing.computeRevisionTotals(newRev); } catch(e){}
    }
    PCG.auditLog.push({ at:newRev.createdAt, actor:PCG.user.id, action:'quote.revision.create', entityId:newRev.id, detail:`Cloned from ${sourceRev.id}` });
    PCG.engines.notify.emit('QuoteRevisionCreated', { quoteId, revisionId:newRev.id, revisionNumber:nextNum });
    return { ok:true, revision:newRev };
  };

  // ------------------------------------------------------------------
  // Quote Options (A/B/C pricing scenarios on one revision)
  // ------------------------------------------------------------------
  PCG.api.addQuoteOption = (revId, opt) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    const { rev } = _findRevAny(revId);
    if(!rev) throw new Error('Revision not found');
    rev.options = rev.options || [];
    const recommendedFlag = opt.recommended === true || rev.options.length === 0; // first = default recommended
    if(recommendedFlag) rev.options.forEach(o => o.recommended = false);
    const newOpt = {
      id: 'qopt.'+Math.random().toString(36).slice(2,8),
      label: opt.label || 'Option '+String.fromCharCode(65 + rev.options.length),
      description: opt.description || '',
      priceDelta: Number(opt.priceDelta) || 0,
      priceOverride: opt.priceOverride != null ? Number(opt.priceOverride) : null,
      inclusions: Array.isArray(opt.inclusions) ? opt.inclusions : [],
      exclusions: Array.isArray(opt.exclusions) ? opt.exclusions : [],
      recommended: recommendedFlag,
      clientSelected: false
    };
    rev.options.push(newOpt);
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'quote.option.add', entityId:newOpt.id, detail:newOpt.label });
    return newOpt;
  };

  PCG.api.updateQuoteOption = (revId, optId, patch) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    const { rev } = _findRevAny(revId);
    if(!rev) throw new Error('Revision not found');
    const o = (rev.options||[]).find(x => x.id === optId);
    if(!o) throw new Error('Option not found');
    if(patch.recommended === true){
      rev.options.forEach(x => x.recommended = false);
    }
    Object.assign(o, patch);
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'quote.option.update', entityId:optId, detail:Object.keys(patch).join(',') });
    return o;
  };

  PCG.api.removeQuoteOption = (revId, optId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    const { rev } = _findRevAny(revId);
    if(!rev) throw new Error('Revision not found');
    rev.options = (rev.options||[]).filter(o => o.id !== optId);
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'quote.option.remove', entityId:optId });
    return true;
  };

  // Compute effective total for a given option (base lines + optional override or delta)
  PCG.api.computeOptionTotal = (revId, optId) => {
    const { rev } = _findRevAny(revId);
    if(!rev) return null;
    const base = PCG.engines && PCG.engines.pricing
      ? PCG.engines.pricing.computeRevisionTotals(rev.lines||[]).totalRevenue
      : (rev.lines||[]).reduce((s,l) => s + (l.unitPrice||0)*(l.qty||0)*(l.days||1), 0);
    const o = (rev.options||[]).find(x => x.id === optId);
    if(!o) return { base, net: base };
    if(o.priceOverride != null) return { base, override:true, net: o.priceOverride };
    return { base, delta: o.priceDelta || 0, net: base + (o.priceDelta || 0) };
  };

  // §10.2 — Convert Awarded quote into per-department pull sheets (replaces legacy GO-Order)
  PCG.api.convertQuoteToPullSheets = (quoteId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS);
    const q = (PCG.quotes||[]).find(x => x.id === quoteId);
    if(!q) return { ok:false, reason:'Quote not found' };
    const rev = (PCG.quoteRevisions||[]).find(r => r.id === q.activeRevisionId)
             || (q.revisions||[]).find(r => r.id === q.activeRevisionId)
             || (q.revisions||[])[0];
    if(!rev) return { ok:false, reason:'Active revision not found' };
    const rentalLines = (rev.lines||[]).filter(l => l.type === 'Rental');
    if(!rentalLines.length) return { ok:false, reason:'No rental lines to convert' };

    const byDept = {};
    rentalLines.forEach(l => {
      const inv = PCG.api.getInventoryItem(l.inventoryItemId);
      const cat = inv && inv.categoryId ? (PCG.inventoryCategories||[]).find(c => c.id === inv.categoryId) : null;
      const dept = (cat && cat.department) || 'Mixed';
      (byDept[dept] = byDept[dept] || []).push({
        id: 'pl.'+Math.random().toString(36).slice(2,8),
        inventoryItemId: l.inventoryItemId,
        qty: l.qty, days: l.days, unitPrice: l.unitPrice,
        description: l.description, sourceQuoteLineId: l.id,
        scanStatus: 'pending', serialsAssigned: [], conditionOnReturn: null
      });
    });

    PCG.pullSheets = PCG.pullSheets || [];
    const created = [];
    Object.entries(byDept).forEach(([dept, lines]) => {
      const existing = PCG.pullSheets.find(p => p.showId === q.projectCode && p.department === dept);
      if(existing){
        if(existing.status === 'DeptLocked' || existing.status === 'Finalized'){
          created.push({ id: existing.id, dept, skipped:true, reason:'Already '+existing.status });
          return;
        }
        existing.lines = (existing.lines||[]).concat(lines);
        created.push({ id: existing.id, dept, merged:true, added:lines.length });
      } else {
        const ps = {
          id: 'ps.'+q.projectCode.toLowerCase().replace(/[^a-z0-9]+/g,'')+'.'+dept.toLowerCase().replace(/[^a-z0-9]+/g,''),
          showId: q.projectCode, department: dept, status: 'NotStarted',
          lines, authorizedById: null, authorizedAt: null,
          createdAt: new Date().toISOString(),
          createdFromQuoteId: quoteId, createdFromRevisionId: rev.id
        };
        PCG.pullSheets.push(ps);
        created.push({ id: ps.id, dept, created:true, lines:lines.length });
      }
    });

    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'quote.convertToPullSheets', entityId:quoteId, detail:`${created.length} dept pull sheets` });
    PCG.engines.notify.emit('PullSheetsGenerated', { quoteId, count:created.length, depts:Object.keys(byDept) });
    return { ok:true, created, byDept };
  };

  PCG.api.removeQuoteLine = (revId, lineId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    const { rev: r } = _findRevAny(revId);
    if(r){
      if(r.status === 'Issued' || r.status === 'Accepted') throw new Error('Cannot delete from '+r.status+' revision');
      r.lines = (r.lines||[]).filter(l => l.id !== lineId);
      if(PCG.engines && PCG.engines.pricing && PCG.engines.pricing.computeRevisionTotals){
        try { PCG.engines.pricing.computeRevisionTotals(r); } catch(e){}
      }
      PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'quoteLine.remove', entityId:lineId });
      return true;
    }
    throw new Error('Revision not found');
  };

  // ==================================================================
  // Employee Timecard / Self-service timesheet
  // Auto-populates rows from shift assignments; supports non-event
  // categories (Shop / Prep / Meeting / Travel / PTO / Gifted).
  // ==================================================================
  PCG.timecards = PCG.timecards || [];

  // Category → pay bucket (regular vs paid-not-worked)
  const TC_CATEGORIES = {
    ShowWork:     { label:'Show Work',   bucket:'regular',  billable:true  },
    Prep:         { label:'Prep',        bucket:'regular',  billable:false },
    Shop:         { label:'Shop / Warehouse', bucket:'regular', billable:false },
    Meeting:      { label:'Meeting',     bucket:'regular',  billable:false },
    Travel:       { label:'Travel',      bucket:'regular',  billable:false },
    Training:     { label:'Training',    bucket:'regular',  billable:false },
    OnCall:       { label:'On Call',     bucket:'regular',  billable:false },
    GiftedHours:  { label:'Gifted Hours',bucket:'gifted',   billable:false },
    PTO:          { label:'PTO / Vacation', bucket:'pto',    billable:false },
    Sick:         { label:'Sick',        bucket:'sick',     billable:false },
    Holiday:      { label:'Holiday',     bucket:'holiday',  billable:false },
    Unpaid:       { label:'Unpaid Leave',bucket:'unpaid',   billable:false }
  };
  PCG.api.getTimecardCategories = () => Object.entries(TC_CATEGORIES).map(([k,v]) => ({ key:k, ...v }));

  // Compute week (Monday-start by default) containing a given date
  PCG.api.getTimecardWeekStart = (dateStr) => {
    const d = new Date(dateStr); d.setHours(0,0,0,0);
    const dow = d.getDay(); // 0=Sun
    const daysBack = dow === 0 ? 6 : dow - 1;
    d.setDate(d.getDate() - daysBack);
    return d.toISOString().slice(0,10);
  };

  // Auto-populate week: pull shift assignments for the employee on each day
  PCG.api.getTimecardWeek = (crewMemberId, weekStartISO) => {
    const start = new Date(weekStartISO); start.setHours(0,0,0,0);
    const days = [];
    for(let i=0;i<7;i++){
      const d = new Date(start); d.setDate(start.getDate()+i);
      days.push(d.toISOString().slice(0,10));
    }

    // Find shift assignments that include any of these days
    const crewShifts = (PCG.shiftAssignments||[]).filter(sa => sa.crewMemberId === crewMemberId);
    // Pre-fetch existing saved timecard rows for this employee + week
    const saved = (PCG.timecards||[]).filter(tc => tc.crewMemberId === crewMemberId && days.includes(tc.date));

    const rows = days.map(date => {
      const savedForDay = saved.filter(tc => tc.date === date);
      if(savedForDay.length) return savedForDay;
      // Look up scheduled shifts for this day
      const dayShifts = crewShifts.filter(sa => (sa.dates||[]).includes(date));
      if(dayShifts.length){
        return dayShifts.map(sa => _makeRowFromShift(crewMemberId, date, sa));
      }
      return [_makeEmptyRow(crewMemberId, date)];
    }).flat();

    return { weekStart: weekStartISO, days, rows };
  };

  function _makeRowFromShift(crewMemberId, date, sa){
    const project = (PCG.projects||[]).find(p => p.code === sa.showId);
    const client = project ? PCG.api.getClient(project.clientId) : null;
    const position = (PCG.crewPositions||[]).find(p => p.id === sa.positionId);
    const venue = project && project.venueId ? (PCG.venues||[]).find(v => v.id === project.venueId) : null;
    const payRate = (position && position.ratesByVersion && position.ratesByVersion[0] && position.ratesByVersion[0].payRate) || 40;
    return {
      id: 'tc.'+crewMemberId+'.'+date+'.'+(sa.id||'x'),
      crewMemberId, date,
      shiftAssignmentId: sa.id,
      category: 'ShowWork',
      clockIn: sa.callTime || '',
      clockOut: '',
      breakMin: 30,
      hoursWorked: 0, hoursOT: 0, hoursDT: 0,
      showId: sa.showId,
      eventName: project ? project.name : sa.showId,
      clientName: client ? client.name : '',
      positionId: sa.positionId,
      positionName: position ? position.name : '',
      rosterPositionId: sa.id,
      eventId: project && project.eventFolderNumber ? project.eventFolderNumber : sa.showId,
      workingEvent: true,
      onCall: false,
      shift: 'Day',
      stOverride: 0,
      jobDoing: '',
      venueName: venue ? venue.name : (project && project.venueName) || '',
      cityState: venue ? ((venue.city||'') + (venue.state?', '+venue.state:'')) : '',
      timeZone: '',
      perDiem: 0,
      transportation: '',
      payRate,
      otOverride: null,
      dtOverride: null,
      status: 'Draft',
      sourceType: 'scheduled',
      notes: ''
    };
  }

  function _makeEmptyRow(crewMemberId, date){
    const person = PCG.findPerson(crewMemberId);
    const payRate = (person && person.payRate) || 40;
    return {
      id: 'tc.'+crewMemberId+'.'+date+'.manual.'+Math.random().toString(36).slice(2,5),
      crewMemberId, date,
      shiftAssignmentId: null,
      category: 'Shop',
      clockIn: '', clockOut: '', breakMin: 30,
      hoursWorked: 0, hoursOT: 0, hoursDT: 0,
      showId: null, eventName: '', clientName: '',
      positionId: null, positionName: '', rosterPositionId: null,
      eventId: null, workingEvent: false, onCall: false,
      shift: 'Day', stOverride: 0, jobDoing: '',
      venueName: '', cityState: '', timeZone: '',
      perDiem: 0, transportation: '',
      payRate,
      otOverride: null, dtOverride: null,
      status: 'Draft', sourceType: 'manual',
      notes: ''
    };
  }

  PCG.api.saveTimecardRow = (row) => {
    if(!row || !row.crewMemberId || !row.date) throw new Error('crewMemberId + date required');
    // Authorize: must be own record, or Admin/Scheduling/Accounting can edit others
    if(row.crewMemberId !== PCG.user.id){
      PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS);
    }
    // Compute hours if in/out given
    if(row.clockIn && row.clockOut){
      row.hoursWorked = _timecardHours(row.clockIn, row.clockOut, row.breakMin || 0);
    }
    row.updatedAt = new Date().toISOString();
    row.updatedById = PCG.user.id;

    PCG.timecards = PCG.timecards || [];
    const existing = PCG.timecards.find(tc => tc.id === row.id);
    if(existing) Object.assign(existing, row);
    else PCG.timecards.push(Object.assign({}, row));

    PCG.auditLog.push({ at:row.updatedAt, actor:PCG.user.id, action:'timecard.save', entityId:row.id, detail:`${row.date} ${row.category} ${row.hoursWorked}h` });
    return existing || row;
  };

  PCG.api.deleteTimecardRow = (rowId) => {
    const row = (PCG.timecards||[]).find(tc => tc.id === rowId);
    if(!row) throw new Error('Row not found');
    if(row.status === 'Approved'){
      PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.ACCOUNTING);
    }
    PCG.timecards = PCG.timecards.filter(tc => tc.id !== rowId);
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'timecard.delete', entityId:rowId });
    return true;
  };

  // ==================================================================
  // Premier Pay Rules (non-exempt technician, from Premier Pay Rules doc)
  //
  // • Straight Time: first 10 CONSECUTIVE hours after shift/call start
  // • Overtime 1.5×: 10th → 16th consecutive hour  OR  >40h/week
  // • Double Time 2.0×: >16 consecutive hours
  // • Premium Time 2.0×: hours worked between 12am–6am
  // • 10-hour call minimum: per event Assignment (not per day). Applies to
  //   show work, out-of-town work, dark days, travel. Does NOT apply to
  //   non-event shop/prep/meeting work.
  // • Gifted hours COUNT toward 40h FLSA OT threshold.
  // • PTO / Holiday / Sick / Bereavement / Jury do NOT count toward 40h.
  // • Holidays: 8h paid regardless; if worked, 8h holiday + OT on worked hrs.
  // • Submit by Tue 3pm; pay day Friday.
  // ==================================================================
  const PAY_RULES = {
    MIN_CALL_HOURS_EVENT: 10,
    CONSEC_OT_START: 10,
    CONSEC_DT_START: 16,
    WEEK_OT_THRESHOLD: 40,
    PREMIUM_START_HR: 0,   // 12am
    PREMIUM_END_HR: 6,     // 6am
    HOLIDAY_BASE_HOURS: 8,
    OUT_OF_TOWN_RADIUS_MI: 60,
    TURNAROUND_BREAK_HR: 8,
    CONTINUOUS_BREAK_HR: 4
  };
  // Premier's non-exempt technician thresholds (object, not union rule rows)
  PCG.api.getPremierPayRules = () => Object.assign({}, PAY_RULES, PCG.__payRuleOverrides || {});
  PCG.api.setPremierPayRules = (patch) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS);
    PCG.__payRuleOverrides = Object.assign({}, PCG.__payRuleOverrides || {}, patch || {});
    Object.keys(patch||{}).forEach(k => { if(k in PAY_RULES) PAY_RULES[k] = patch[k]; });
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'admin.premierPayRules.set', detail:JSON.stringify(patch) });
    return PCG.api.getPremierPayRules();
  };
  // Back-compat alias for timecard engine (avoid collision with union getPayRules returning an array)
  PCG.api.getPremierRulesObject = PCG.api.getPremierPayRules;

  // Observe Premier recognized holidays (§pay-rules)
  PCG.api.isPremierHoliday = (dateISO) => {
    const d = new Date(dateISO+'T12:00:00');
    const y = d.getFullYear(), m = d.getMonth(), day = d.getDate(), dow = d.getDay();
    // Fixed dates
    if(m===0 && day===1)  return "New Year's Day";
    if(m===6 && day===4)  return 'Independence Day';
    if(m===11 && day===24) return 'Christmas Eve';
    if(m===11 && day===25) return 'Christmas Day';
    // Last Monday of May (Memorial Day)
    if(m===4 && dow===1){
      const next = new Date(d); next.setDate(day+7);
      if(next.getMonth() !== 4) return 'Memorial Day';
    }
    // First Monday of September (Labor Day)
    if(m===8 && dow===1 && day<=7) return 'Labor Day';
    // Fourth Thursday of November (Thanksgiving) + Friday after
    if(m===10 && dow===4 && day>=22 && day<=28) return 'Thanksgiving';
    if(m===10 && dow===5 && day>=23 && day<=29) return 'Day after Thanksgiving';
    return null;
  };

  // Given a clock-in time and worked hours, compute how many hours fall in
  // the premium (12am-6am) window.
  function _premiumHoursInShift(clockInHr, hoursWorked){
    if(!hoursWorked) return 0;
    // Walk the shift minute-by-minute (coarse: 15-minute steps)
    let prem = 0;
    const steps = Math.ceil(hoursWorked * 4);
    for(let i=0;i<steps;i++){
      const t = (clockInHr + i/4) % 24;
      if(t >= PAY_RULES.PREMIUM_START_HR && t < PAY_RULES.PREMIUM_END_HR) prem += 0.25;
    }
    return Math.min(prem, hoursWorked);
  }

  // ==================================================================
  // Classification-aware dispatcher. Routes each row to the correct
  // engine based on crew member's payRuleId:
  //   • consecutive-hour       → Premier Non-Exempt Technician (W2)
  //   • time-banded-inhouse    → Premier In-House Union (3 employees)
  //   • time-banded-iatse      → IATSE Local 38 / 720 / High Steel
  //   • flat-hourly            → 1099 contractors
  // Each engine returns per-row buckets; totals sum across all rows.
  // ==================================================================
  PCG.api.computeTimecardTotalsByClassification = (rows) => {
    const grouped = { W2:[], InHouseUnion:[], IATSE:[], IATSE_HighSteel:[], IATSE_720:[], '1099':[] };
    (rows||[]).forEach(r => {
      const m = (PCG.crewMembers||[]).find(x => x.id === r.crewMemberId);
      const pr = m && m.payRuleId ? (PCG.payRules||[]).find(p => p.id === m.payRuleId) : null;
      const engine = pr ? pr.engine : 'consecutive-hour';
      const bucket = engine === 'time-banded-inhouse' ? 'InHouseUnion'
                   : engine === 'time-banded-iatse' ? (pr.unionLocal === '38-HighSteel' ? 'IATSE_HighSteel' : pr.unionLocal === '720' ? 'IATSE_720' : 'IATSE')
                   : engine === 'flat-hourly' ? '1099'
                   : 'W2';
      grouped[bucket] = grouped[bucket] || [];
      grouped[bucket].push({ row:r, rule:pr, engine });
    });
    // Dispatch to each engine and merge
    const combined = { st:0, ot:0, dt:0, pt:0, premium:0, gifted:0, holiday:0, minBonus:0, total:0, wageST:0, wageOT:0, wageDT:0, wagePT:0, wageHoliday:0, wageMinBonus:0, totalWage:0, breakdown:[] };
    Object.entries(grouped).forEach(([bucket, entries]) => {
      if(!entries.length) return;
      const sub = _computeBucket(bucket, entries);
      combined.st += sub.st; combined.ot += sub.ot; combined.dt += sub.dt; combined.pt += sub.pt;
      combined.premium += sub.premium; combined.gifted += sub.gifted; combined.holiday += sub.holiday; combined.minBonus += sub.minBonus;
      combined.wageST += sub.wageST; combined.wageOT += sub.wageOT; combined.wageDT += sub.wageDT; combined.wagePT += sub.wagePT;
      combined.wageHoliday += sub.wageHoliday; combined.wageMinBonus += sub.wageMinBonus;
      combined.breakdown = combined.breakdown.concat(sub.breakdown || []);
    });
    combined.total = combined.st + combined.ot + combined.dt + combined.pt + combined.gifted + combined.holiday + combined.minBonus;
    combined.totalWage = combined.wageST + combined.wageOT + combined.wageDT + combined.wagePT + combined.wageHoliday + combined.wageMinBonus;
    // Legacy field aliases for existing consumers
    combined.regHours = combined.st;
    combined.otHours = combined.ot;
    combined.dtHours = combined.dt;
    combined.premiumHours = combined.pt || combined.premium;
    combined.giftedHours = combined.gifted;
    combined.holidayHours = combined.holiday;
    combined.minCallBonusHours = combined.minBonus;
    combined.totalHours = combined.total;
    combined.regWage = combined.wageST;
    combined.otWage = combined.wageOT;
    combined.dtWage = combined.wageDT;
    combined.premWage = combined.wagePT;
    combined.holidayWage = combined.wageHoliday;
    combined.minCallBonusWage = combined.wageMinBonus;
    return combined;
  };

  function _computeBucket(bucket, entries){
    if(bucket === 'W2'){
      // Use the existing consecutive-hour engine (wrapped)
      const rows = entries.map(e => e.row);
      const r = PCG.api.computeTimecardTotals(rows);
      return {
        st:r.regHours, ot:r.otHours, dt:r.dtHours, pt:0, premium:r.premiumHours,
        gifted:r.giftedHours, holiday:r.holidayHours, minBonus:r.minCallBonusHours,
        wageST:r.regWage, wageOT:r.otWage, wageDT:r.dtWage, wagePT:r.premWage,
        wageHoliday:r.holidayWage, wageMinBonus:r.minCallBonusWage,
        breakdown:r.breakdown || []
      };
    }
    if(bucket === '1099'){
      let st=0, wage=0;
      entries.forEach(e => { const h = Number(e.row.hoursWorked)||0; const rate = Number(e.row.payRate)||0; st += h; wage += h*rate; });
      return { st, ot:0, dt:0, pt:0, premium:0, gifted:0, holiday:0, minBonus:0, wageST:wage, wageOT:0, wageDT:0, wagePT:0, wageHoliday:0, wageMinBonus:0, breakdown:[] };
    }
    // Union time-banded (InHouseUnion / IATSE)
    return _computeTimeBanded(entries);
  }

  // Walks each row's worked minutes and classifies each 15-minute slice
  // into ST / OT / DT / PT based on day-of-week × hour-of-day × classification rules.
  // Then applies dailyOTThresholdHours and prevailing-rate turnaround.
  function _computeTimeBanded(entries){
    const sorted = entries.slice().sort((a,b) => {
      const d = (a.row.date||'').localeCompare(b.row.date||'');
      if(d) return d;
      return (a.row.clockIn||'').localeCompare(b.row.clockIn||'');
    });
    let st=0, ot=0, dt=0, pt=0, holiday=0, minBonus=0;
    let wageST=0, wageOT=0, wageDT=0, wagePT=0, wageHoliday=0, wageMinBonus=0;
    const breakdown = [];
    let prevailingBucket = null; // 'ST' | 'OT' | 'DT' | 'PT' | null
    let lastShiftEnd = null;      // ISO string
    let weekDailyHours = {};      // date -> hours-worked (for dailyOTAfter8)

    sorted.forEach(e => {
      const r = e.row; const rule = e.rule || {};
      const rate = Number(r.payRate) || 0;
      const raw = Number(r.hoursWorked) || 0;
      if(!raw){
        breakdown.push({ rowId:r.id, date:r.date, worked:0 });
        return;
      }

      // Build start time
      const inHr = _parseClockHr(r.clockIn || '8:00a');
      if(isNaN(inHr)) return;
      const startMs = new Date(r.date + 'T00:00:00').getTime() + inHr * 3600000;

      // Check turnaround (prevailing rate): gap between lastShiftEnd and this shift start
      const prevailingActive = prevailingBucket && lastShiftEnd != null
        && (startMs - lastShiftEnd) / 3600000 < (rule.prevailingRateTurnaroundHrs || 8);

      const holidayName = PCG.api.isPremierHoliday(r.date);
      const isHoliday = !!holidayName;

      // Per-day cumulative for dailyOTAfter8
      const dailyAlready = weekDailyHours[r.date] || 0;
      const dailyThreshold = rule.dailyOTThresholdHours != null ? rule.dailyOTThresholdHours : Infinity;

      // Walk in 15-minute slices
      const slices = Math.ceil(raw * 4);
      let shiftMs = startMs;
      let workedSoFar = 0;
      const sliceBuckets = { ST:0, OT:0, DT:0, PT:0, HOL:0 };

      for(let i = 0; i < slices; i++){
        const sliceHrs = 0.25;
        const tod = (new Date(shiftMs).getHours() + new Date(shiftMs).getMinutes()/60);
        const dow = new Date(shiftMs).getDay(); // 0=Sun
        let bucket;
        if(isHoliday){ bucket = rule.holidayBucket || 'DT'; }
        else if(prevailingActive){ bucket = prevailingBucket; }
        else {
          bucket = _classifySlice(dow, tod, rule);
          // Daily-after-8h uplift
          if(bucket === 'ST' && (dailyAlready + workedSoFar) >= dailyThreshold){
            bucket = 'OT';
          }
        }
        sliceBuckets[bucket] = (sliceBuckets[bucket] || 0) + sliceHrs;
        workedSoFar += sliceHrs;
        shiftMs += sliceHrs * 3600000;
      }
      // Minimum call (per-event)
      const appliesMin = rule.minimumCallHours && r.showId && r.category === 'ShowWork';
      if(appliesMin && raw < rule.minimumCallHours){
        minBonus += (rule.minimumCallHours - raw);
        wageMinBonus += (rule.minimumCallHours - raw) * rate;
      }

      st += sliceBuckets.ST; wageST += sliceBuckets.ST * rate;
      ot += sliceBuckets.OT; wageOT += sliceBuckets.OT * rate * (rule.otMultiplier || 1.5);
      dt += sliceBuckets.DT; wageDT += sliceBuckets.DT * rate * (rule.dtMultiplier || 2.0);
      pt += sliceBuckets.PT; wagePT += sliceBuckets.PT * rate * (rule.ptMultiplier || 1.9);
      holiday += sliceBuckets.HOL; wageHoliday += sliceBuckets.HOL * rate * (rule.holidayMultiplier || 2.0);

      weekDailyHours[r.date] = dailyAlready + raw;
      // Determine new prevailing bucket for this shift = highest bucket reached
      const reached = sliceBuckets.DT > 0 ? 'DT' : sliceBuckets.PT > 0 ? 'PT' : sliceBuckets.OT > 0 ? 'OT' : 'ST';
      prevailingBucket = reached === 'ST' ? null : reached;
      lastShiftEnd = shiftMs;

      breakdown.push({ rowId:r.id, date:r.date, worked:raw, st:sliceBuckets.ST, ot:sliceBuckets.OT, dt:sliceBuckets.DT, pt:sliceBuckets.PT, prevailing: prevailingActive, holiday:holidayName, engine:rule.engine });
    });

    return { st, ot, dt, pt, premium:pt, gifted:0, holiday, minBonus,
             wageST, wageOT, wageDT, wagePT, wageHoliday, wageMinBonus,
             breakdown };
  }

  function _classifySlice(dow, tod, rule){
    // Check ptBands first (most specific for IATSE Sundays)
    if(rule.ptBands){
      for(const b of rule.ptBands){
        if(b.days.includes(dow) && tod >= b.startHr && tod < b.endHr) return 'PT';
      }
    }
    // DT bands (in-house union overnight + Sunday)
    if(rule.dtBands){
      for(const b of rule.dtBands){
        if(b.days.includes(dow) && tod >= b.startHr && tod < b.endHr) return 'DT';
      }
    }
    // OT bands
    if(rule.otBands){
      for(const b of rule.otBands){
        if(b.days.includes(dow) && tod >= b.startHr && tod < b.endHr) return 'OT';
      }
    }
    // ST window
    if(rule.stWindow && rule.stWindow.days.includes(dow) && tod >= rule.stWindow.startHr && tod < rule.stWindow.endHr){
      return 'ST';
    }
    return 'ST'; // default
  }

  // Compute pay-period totals honoring Premier rules.
  //   • Per-row: split into straight/OT/DT based on consecutive hours AND premium window
  //   • Per-event rows get 10h minimum applied
  //   • Weekly: re-bucket any remaining straight hours >40 into OT
  PCG.api.computeTimecardTotals = (rows) => {
    const sorted = (rows||[]).slice().sort((a,b) => (a.date+' '+(a.clockIn||'')).localeCompare(b.date+' '+(b.clockIn||'')));
    let weeklyStraight = 0; // accumulates straight hours toward 40h threshold (incl. gifted)
    let reg=0, ot=0, dt=0, prem=0, gifted=0, holidayPaid=0;
    let regWage=0, otWage=0, dtWage=0, premWage=0, holidayWage=0;
    let minCallBonus=0, minCallBonusWage=0;
    const breakdown = [];

    sorted.forEach(r => {
      const cat = TC_CATEGORIES[r.category] || {};
      const rate = Number(r.payRate) || 0;
      const raw = Number(r.hoursWorked) || 0;
      let workedHours = raw;
      let minApplied = false;

      // Holiday: 8h base always; worked hours layer on top (as OT per rule)
      const holidayName = PCG.api.isPremierHoliday(r.date);
      if(holidayName && cat.bucket !== 'unpaid'){
        holidayPaid += PAY_RULES.HOLIDAY_BASE_HOURS;
        holidayWage += PAY_RULES.HOLIDAY_BASE_HOURS * rate;
      }

      if(cat.bucket === 'unpaid') return;

      if(cat.bucket === 'pto' || cat.bucket === 'holiday' || cat.bucket === 'sick'){
        // Straight-time payout, no 40h contribution
        reg += workedHours;
        regWage += workedHours * rate;
        return;
      }

      if(cat.bucket === 'gifted'){
        gifted += workedHours;
        regWage += workedHours * rate;
        weeklyStraight += workedHours; // counts toward 40h
        return;
      }

      // 10-hour minimum for event assignments (showId present) — NOT for shop/prep/meeting
      const applies10Min = r.shiftAssignmentId && cat.billable !== false &&
                           !!r.showId && r.category === 'ShowWork';
      if(applies10Min && workedHours > 0 && workedHours < PAY_RULES.MIN_CALL_HOURS_EVENT){
        const bonus = PAY_RULES.MIN_CALL_HOURS_EVENT - workedHours;
        minCallBonus += bonus;
        minCallBonusWage += bonus * rate;
        workedHours = PAY_RULES.MIN_CALL_HOURS_EVENT;
        minApplied = true;
      }

      // Overrides (manual OT/DT set by user)
      if(r.otOverride != null){ ot += r.otOverride; otWage += r.otOverride*rate*1.5; return; }
      if(r.dtOverride != null){ dt += r.dtOverride; dtWage += r.dtOverride*rate*2; return; }

      // Split into straight / OT / DT by consecutive-hour rule
      const straightPart = Math.min(workedHours, PAY_RULES.CONSEC_OT_START);
      const otPart = Math.max(0, Math.min(workedHours, PAY_RULES.CONSEC_DT_START) - PAY_RULES.CONSEC_OT_START);
      const dtPart = Math.max(0, workedHours - PAY_RULES.CONSEC_DT_START);

      reg += straightPart; regWage += straightPart * rate;
      ot += otPart;        otWage += otPart * rate * 1.5;
      dt += dtPart;        dtWage += dtPart * rate * 2;

      weeklyStraight += straightPart;

      // Premium time (12am–6am) — additive 0.5× on top of base rate (since OT/DT categories already paid 1.5/2)
      const clockInHr = _parseClockHr(r.clockIn);
      const premH = isNaN(clockInHr) ? 0 : _premiumHoursInShift(clockInHr, workedHours);
      if(premH > 0){
        prem += premH;
        premWage += premH * rate * 0.5; // additive premium uplift (2× total when combined with 1.5× already applied)
      }

      breakdown.push({
        rowId: r.id, date: r.date,
        worked: workedHours, rawWorked: raw,
        straight: straightPart, ot: otPart, dt: dtPart, premium: premH,
        minApplied, holiday: holidayName
      });
    });

    // Weekly 40h roll-up: if straight+gifted exceeded 40, convert overage to OT
    if(weeklyStraight > PAY_RULES.WEEK_OT_THRESHOLD){
      const over = weeklyStraight - PAY_RULES.WEEK_OT_THRESHOLD;
      // Take it out of "reg" and bump into OT (using a proxy rate = average used rate)
      const avgRate = reg ? (regWage/reg) : 0;
      const moveH = Math.min(over, reg);
      reg -= moveH;
      regWage -= moveH * avgRate;
      ot += moveH;
      otWage += moveH * avgRate * 1.5;
    }

    return {
      // hour breakdown
      regHours: reg, otHours: ot, dtHours: dt,
      premiumHours: prem, giftedHours: gifted,
      holidayHours: holidayPaid,
      minCallBonusHours: minCallBonus,
      totalHours: reg + ot + dt + gifted + holidayPaid + minCallBonus,
      // wages
      regWage, otWage, dtWage, premWage, holidayWage,
      minCallBonusWage,
      totalWage: regWage + otWage + dtWage + premWage + holidayWage + minCallBonusWage,
      // context
      breakdown,
      rulesApplied: 'Premier Non-Exempt Technician Pay Rules'
    };
  };

  function _parseClockHr(s){
    if(!s) return NaN;
    s = String(s).trim().toLowerCase();
    let ampm = null;
    if(s.endsWith('a')) { ampm='a'; s=s.slice(0,-1); }
    else if(s.endsWith('p')) { ampm='p'; s=s.slice(0,-1); }
    else if(s.endsWith('am')) { ampm='a'; s=s.slice(0,-2); }
    else if(s.endsWith('pm')) { ampm='p'; s=s.slice(0,-2); }
    const parts = s.split(':');
    let h = parseInt(parts[0],10);
    const m = parts[1] ? parseInt(parts[1],10) : 0;
    if(ampm==='p' && h<12) h+=12;
    if(ampm==='a' && h===12) h=0;
    return isNaN(h) ? NaN : h + (m||0)/60;
  }

  function _timecardHours(clockIn, clockOut, breakMin){
    // HH:MM or HH:MMa/p format → hours worked
    const parse = s => {
      s = (s||'').trim().toLowerCase();
      let ampm = null;
      if(s.endsWith('a')) { ampm = 'a'; s = s.slice(0,-1); }
      else if(s.endsWith('p')) { ampm = 'p'; s = s.slice(0,-1); }
      else if(s.endsWith('am')) { ampm = 'a'; s = s.slice(0,-2); }
      else if(s.endsWith('pm')) { ampm = 'p'; s = s.slice(0,-2); }
      const parts = s.replace(/\s/g,'').split(':');
      let h = parseInt(parts[0],10);
      const m = parts[1] ? parseInt(parts[1],10) : 0;
      if(ampm === 'p' && h < 12) h += 12;
      if(ampm === 'a' && h === 12) h = 0;
      return h + (m||0)/60;
    };
    let inH = parse(clockIn);
    let outH = parse(clockOut);
    if(isNaN(inH) || isNaN(outH)) return 0;
    if(outH < inH) outH += 24; // over midnight
    let hrs = outH - inH - ((breakMin||0)/60);
    return Math.max(0, Math.round(hrs * 100) / 100);
  }

  PCG.api.submitTimecard = (crewMemberId, weekStartISO) => {
    if(crewMemberId !== PCG.user.id){
      PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS);
    }
    const week = PCG.api.getTimecardWeek(crewMemberId, weekStartISO);
    const now = new Date().toISOString();
    (week.rows || []).forEach(r => {
      if(r.status === 'Draft'){
        r.status = 'Submitted';
        r.submittedAt = now;
        PCG.api.saveTimecardRow(r);
      }
    });
    PCG.auditLog.push({ at:now, actor:PCG.user.id, action:'timecard.submit', entityId:crewMemberId, detail:weekStartISO });
    PCG.engines.notify.emit('TimecardSubmitted', { crewMemberId, weekStart:weekStartISO });
    return { ok:true, submittedAt:now };
  };

  PCG.api.approveTimecard = (crewMemberId, weekStartISO) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ACCOUNTING);
    const now = new Date().toISOString();
    (PCG.timecards||[])
      .filter(tc => tc.crewMemberId === crewMemberId)
      .filter(tc => tc.status === 'Submitted')
      .forEach(tc => {
        tc.status = 'Approved';
        tc.approvedById = PCG.user.id;
        tc.approvedAt = now;
      });
    PCG.auditLog.push({ at:now, actor:PCG.user.id, action:'timecard.approve', entityId:crewMemberId, detail:weekStartISO });
    return { ok:true };
  };

  // ==================================================================
  // Union Labor Call Export (Detroit union venues)
  //   IATSE Local 38 — stagehand, A/V, lighting, video, rigging
  //   IBEW Local 58  — electricians (power service, distro)
  //   UBC Local 1102 — carpenters / scenic
  //   IBT Local 299  — teamsters / freight drivers / forklift
  // Each union gets its own call sheet matching the Master Estimate
  // Sheet format (Stagehand Labor Order).
  // ==================================================================
  const UNION_JURISDICTIONS = {
    'IATSE': {
      id:'IATSE', localDefault:'38', full:'IATSE Local 38',
      contactTo:'labor@iatse38.com',
      stagehandClassifications: [
        'Hand - Audio','Hand - Lighting','Hand - Video','Hand - Scenic','Hand - General',
        'Board - Audio','Board - Lighting','Board - Video Switch','Board - Playback/Record','Board - Teleprompter',
        'Rigger - Up','Rigger - Down','Rigger - High Steel',
        'Camera - Stick','Camera - HH','Camera - Robotics','Camera - Jib',
        'Key - Meeting Room Technician','Key - Projectionist','Key - Cable Page',
        'Steward'
      ],
      ratesStandard: { ST:92.90, OT:139.35, PT:176.50 },
      ratesHighSteel: { ST:100.80, OT:151.25, PT:191.50 },
      leadDays:10, minCallHours:4,
      deptsCovered:['Audio','Video','Lighting','Rigging','Scenic','Video/LED','Production']
    },
    'IBEW': {
      id:'IBEW', localDefault:'58', full:'IBEW Local 58',
      contactTo:'dispatch@ibew58.org',
      stagehandClassifications: [
        'Journeyman Wireman','Apprentice Wireman','Working Foreman','General Foreman'
      ],
      ratesStandard: { ST:84.00, OT:126.00, DT:168.00 },
      leadDays:5, minCallHours:4,
      deptsCovered:['Power','Electrical','Distro']
    },
    'UBC': {
      id:'UBC', localDefault:'1102', full:'UBC Carpenters Local 1102',
      contactTo:'dispatch@ubc1102.org',
      stagehandClassifications: [
        'Journeyman Carpenter','Apprentice Carpenter','Foreman','Scenic Carpenter'
      ],
      ratesStandard: { ST:68.00, OT:102.00, DT:136.00 },
      leadDays:5, minCallHours:4,
      deptsCovered:['Scenic','Staging','Carpentry']
    },
    'IBT': {
      id:'IBT', localDefault:'299', full:'IBT Teamsters Local 299',
      contactTo:'dispatch@teamsters299.org',
      stagehandClassifications: [
        'Driver (CDL-A)','Driver (CDL-B)','Forklift Operator','Loader / Freight Handler','Warehouse Foreman'
      ],
      ratesStandard: { ST:62.00, OT:93.00, DT:124.00 },
      leadDays:5, minCallHours:4,
      deptsCovered:['Freight','Transport','Loading']
    }
  };
  PCG.api.getUnionJurisdictions = () => Object.values(UNION_JURISDICTIONS);
  PCG.api.getUnionJurisdiction = (id) => UNION_JURISDICTIONS[id] || null;

  // Gate: only show if project's venue is in Detroit AND union
  PCG.api.venueRequiresUnionCalls = (projectCode) => {
    const p = (PCG.projects||[]).find(x => x.code === projectCode);
    if(!p) return false;
    const v = p.venueId ? (PCG.venues||[]).find(x => x.id === p.venueId) : null;
    if(!v) return false;
    const isDetroit = (v.city || '').toLowerCase().includes('detroit')
                   || (v.address || '').toLowerCase().includes('detroit');
    const isUnion = v.union === true || (v.union && v.union.required === true);
    return isDetroit && isUnion;
  };

  // Build a per-union call list for a project. Pulls shift assignments for the
  // project that match the union's deptsCovered and groups by classification +
  // date range.
  PCG.api.buildUnionCall = (projectCode, unionId, opts) => {
    const u = UNION_JURISDICTIONS[unionId];
    if(!u) throw new Error('Unknown union: '+unionId);
    const p = (PCG.projects||[]).find(x => x.code === projectCode);
    if(!p) throw new Error('Project not found');
    const v = p.venueId ? (PCG.venues||[]).find(x => x.id === p.venueId) : null;

    // Pull shift assignments for this project
    const allShifts = (PCG.shiftAssignments||[]).filter(sa => sa.showId === projectCode);

    // Map position → union jurisdiction by department (for IATSE use unionLocal if set)
    const linesByDate = {};
    allShifts.forEach(sa => {
      const pos = (PCG.crewPositions||[]).find(x => x.id === sa.positionId);
      if(!pos) return;
      // Determine if this position belongs to this union
      const posUnion = pos.union || null;
      const classifies = (unionId === 'IATSE') ? (posUnion === 'IATSE' || u.deptsCovered.includes(pos.department))
                       : u.deptsCovered.includes(pos.department);
      if(!classifies) return;
      (sa.dates||[]).forEach(d => {
        linesByDate[d] = linesByDate[d] || [];
        // Map to the union's classification label (best match)
        const classification = _mapPositionToUnionClassification(pos, u);
        linesByDate[d].push({
          date: d,
          labor: classification,
          qty: 1,
          positionId: pos.id,
          positionName: pos.displayName || pos.name,
          startTime: sa.callTime || '06:00',
          endTime: '', // estimated end — stops at 14h default call
          notes: sa.notes || '',
          highSteel: classification.toLowerCase().includes('high steel'),
          sourceShiftId: sa.id
        });
      });
    });

    // Flatten + sort
    const lines = Object.values(linesByDate).flat().sort((a,b) =>
      (a.date+a.labor).localeCompare(b.date+b.labor));

    // Aggregate quantities (merge identical labor×date×startTime)
    const agg = {};
    lines.forEach(l => {
      const key = `${l.date}|${l.labor}|${l.startTime}|${l.highSteel}`;
      if(agg[key]){ agg[key].qty += l.qty; agg[key]._positions = (agg[key]._positions||[]).concat(l.positionName); }
      else { agg[key] = Object.assign({}, l, { _positions: [l.positionName] }); }
    });
    const aggregated = Object.values(agg);

    return {
      project: p,
      venue: v,
      union: u,
      lines: aggregated,
      summary: {
        totalLines: aggregated.length,
        totalQty: aggregated.reduce((s,l) => s+l.qty, 0),
        dates: [...new Set(aggregated.map(l => l.date))].sort(),
        earliestDate: aggregated.length ? aggregated[0].date : null,
        leadDaysRequired: u.leadDays
      },
      generatedAt: new Date().toISOString(),
      generatedById: PCG.user.id,
      eventNumber: p.eventFolderNumber || 'E'+(p.code||'').replace(/[^A-Z0-9]/gi,''),
      contactTo: u.contactTo
    };
  };

  function _mapPositionToUnionClassification(pos, u){
    const name = (pos.displayName || pos.name || '').toLowerCase();
    const dept = (pos.department || '').toLowerCase();
    // IATSE mappings
    if(u.id === 'IATSE'){
      if(name.includes('high steel') || name.includes('high-steel')) return 'Rigger - High Steel';
      if(name.includes('rigger') && name.includes('up')) return 'Rigger - Up';
      if(name.includes('rigger') && name.includes('down')) return 'Rigger - Down';
      if(name.includes('rigger')) return 'Rigger - Up';
      if(name.includes('cam') && name.includes('hh')) return 'Camera - HH';
      if(name.includes('cam') && name.includes('robot')) return 'Camera - Robotics';
      if(name.includes('cam') && name.includes('jib')) return 'Camera - Jib';
      if(name.includes('camera')) return 'Camera - Stick';
      if(name.includes('projection')) return 'Key - Projectionist';
      if(name.includes('cable')) return 'Key - Cable Page';
      if(name.includes('meeting room')) return 'Key - Meeting Room Technician';
      if(name.includes('steward')) return 'Steward';
      if(name.includes('a1') || name.includes('audio') && name.includes('tech')) return 'Board - Audio';
      if(name.includes('v1') || name.includes('switcher')) return 'Board - Video Switch';
      if(name.includes('playback') || name.includes('record')) return 'Board - Playback/Record';
      if(name.includes('teleprompt')) return 'Board - Teleprompter';
      if(name.includes('lighting') && (name.includes('director') || name.includes('ld'))) return 'Board - Lighting';
      if(dept === 'audio')    return 'Hand - Audio';
      if(dept === 'lighting') return 'Hand - Lighting';
      if(dept === 'video' || dept === 'video/led') return 'Hand - Video';
      if(dept === 'scenic')   return 'Hand - Scenic';
      return 'Hand - General';
    }
    if(u.id === 'IBEW'){
      if(name.includes('foreman')) return 'General Foreman';
      if(name.includes('apprentice')) return 'Apprentice Wireman';
      return 'Journeyman Wireman';
    }
    if(u.id === 'UBC'){
      if(name.includes('foreman')) return 'Foreman';
      if(name.includes('scenic')) return 'Scenic Carpenter';
      if(name.includes('apprentice')) return 'Apprentice Carpenter';
      return 'Journeyman Carpenter';
    }
    if(u.id === 'IBT'){
      if(name.includes('foreman')) return 'Warehouse Foreman';
      if(name.includes('forklift')) return 'Forklift Operator';
      if(name.includes('cdl-a') || name.includes('driver-a')) return 'Driver (CDL-A)';
      if(name.includes('driver')) return 'Driver (CDL-B)';
      return 'Loader / Freight Handler';
    }
    return 'Hand - General';
  }

  PCG.api.submitUnionCall = (projectCode, unionId, callSheet) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS);
    const sent = {
      id: 'uc.'+Math.random().toString(36).slice(2,8),
      projectCode, unionId,
      lines: callSheet.lines,
      submittedAt: new Date().toISOString(),
      submittedById: PCG.user.id,
      status: 'Submitted'
    };
    PCG.unionCalls = PCG.unionCalls || [];
    PCG.unionCalls.push(sent);
    PCG.auditLog.push({ at:sent.submittedAt, actor:PCG.user.id, action:'unionCall.submit', entityId:sent.id, detail:`${unionId} · ${projectCode} · ${callSheet.lines.length} lines` });
    PCG.engines.notify.emit('UnionCallSubmitted', { unionId, projectCode, lineCount:callSheet.lines.length });
    return sent;
  };

  PCG.api.acknowledgeAddOrder = (aoNumber) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.DIRECTORS);
    const ao = (PCG.addOrders||[]).find(a => a.aoNumber === aoNumber || a.id === aoNumber);
    if(!ao) throw new Error('Add order not found: '+aoNumber);
    if(ao.status !== 'Requested') return ao;
    ao.status = 'Acknowledged';
    ao.acknowledgedById = PCG.user.id;
    ao.acknowledgedAt   = new Date().toISOString();
    PCG.auditLog.push({ at:ao.acknowledgedAt, actor:PCG.user.id, action:'addOrder.ack', entityId:ao.id });
    PCG.engines.notify.emit('AddOrderAcknowledged', { id:ao.id, aoNumber:ao.aoNumber, showId:ao.showId });
    return ao;
  };

  PCG.api.advanceAddOrder = (aoNumber, toStatus) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS);
    const ao = (PCG.addOrders||[]).find(a => a.aoNumber === aoNumber || a.id === aoNumber);
    if(!ao) throw new Error('Add order not found');
    const valid = ['Acknowledged','Picking','Staged','InTransit','Delivered','Closed'];
    if(!valid.includes(toStatus)) throw new Error('Invalid status');
    ao.status = toStatus;
    ao[toStatus.charAt(0).toLowerCase()+toStatus.slice(1)+'At'] = new Date().toISOString();
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'addOrder.status.'+toStatus.toLowerCase(), entityId:ao.id });
    PCG.engines.notify.emit('AddOrderAdvanced', { id:ao.id, toStatus });
    return ao;
  };

  // ------------------------------------------------------------------
  // Orphan Scan resolution (§3.8 — supervisors adjudicate unexpected scans)
  // ------------------------------------------------------------------
  PCG.api.resolveOrphanScan = (workItemId, resolution, note) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.DIRECTORS);
    const w = (PCG.workItems||[]).find(x => x.id === workItemId);
    if(!w) throw new Error('Work item not found');
    if(w.type !== 'ScanOrphan') throw new Error('Not an orphan scan');
    w.status = 'Resolved';
    w.resolution = resolution || 'Manual adjudication';
    w.resolutionNote = note || '';
    w.resolvedById = PCG.user.id;
    w.resolvedAt = new Date().toISOString();
    PCG.auditLog.push({ at:w.resolvedAt, actor:PCG.user.id, action:'orphan.resolve', entityId:w.id, detail:resolution });
    PCG.engines.notify.emit('OrphanScanResolved', { id:w.id, resolution });
    return w;
  };

  // ------------------------------------------------------------------
  // Service Tickets (§21 — repair pipeline CRUD)
  // ------------------------------------------------------------------
  PCG.api.createServiceTicket = (data) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.TSMS);
    const t = {
      id: 'st.'+Math.random().toString(36).slice(2,8),
      serialId: data.serialId || null,
      itemId:   data.itemId   || null,
      showId:   data.showId   || null,
      description: data.description || '',
      triage:   data.triage   || 'Minor',
      status:   'Open',
      estimatedCost: data.estimatedCost || 0,
      clientCaused: !!data.clientCaused,
      recurringFailure: false,
      reportedById: PCG.user.id,
      reportedAt:   new Date().toISOString(),
      warrantyVendor: data.warrantyVendor || null,
      warrantyClaimStatus: data.warrantyVendor ? 'Not filed' : null,
      notes: data.notes || ''
    };
    PCG.serviceTickets = PCG.serviceTickets || [];
    PCG.serviceTickets.push(t);
    // Flip serial to OOC if provided
    if(t.serialId){
      const ser = (PCG.inventorySerials||[]).find(s => s.serial === t.serialId || s.barcode === t.serialId);
      if(ser){ ser.status = 'OOC'; ser.serviceTicketId = t.id; }
    }
    PCG.auditLog.push({ at:t.reportedAt, actor:PCG.user.id, action:'serviceTicket.create', entityId:t.id, detail:t.description });
    PCG.engines.notify.emit('ServiceTicketCreated', { id:t.id, triage:t.triage, clientCaused:t.clientCaused });
    return t;
  };

  PCG.api.advanceServiceTicket = (ticketId, toStatus) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS);
    const t = (PCG.serviceTickets||[]).find(x => x.id === ticketId);
    if(!t) throw new Error('Ticket not found');
    const valid = ['Open','WaitingParts','InRepair','VendorRepair','BenchTest','ReturnToService','Repaired','Retired','Deferred'];
    if(!valid.includes(toStatus)) throw new Error('Invalid ticket status');
    t.status = toStatus;
    t[toStatus.charAt(0).toLowerCase()+toStatus.slice(1)+'At'] = new Date().toISOString();
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'serviceTicket.status.'+toStatus.toLowerCase(), entityId:t.id });
    PCG.engines.notify.emit('ServiceTicketAdvanced', { id:t.id, toStatus });
    return t;
  };

  PCG.api.approveReturnToService = (ticketId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.DIRECTORS);
    const t = (PCG.serviceTickets||[]).find(x => x.id === ticketId);
    if(!t) throw new Error('Ticket not found');
    if(t.status !== 'ReturnToService' && t.status !== 'BenchTest'){
      throw new Error('Ticket must be in BenchTest or ReturnToService to approve RTS');
    }
    // §21.2 gate: need BenchTest logged + approver
    t.returnToServiceApprovedById = PCG.user.id;
    t.returnToServiceApprovedAt = new Date().toISOString();
    t.status = 'Repaired';
    t.repairedAt = t.returnToServiceApprovedAt;
    // Flip serial back to Available
    if(t.serialId){
      const ser = (PCG.inventorySerials||[]).find(s => s.serial === t.serialId || s.barcode === t.serialId);
      if(ser){ ser.status = 'Available'; ser.serviceTicketId = null; }
    }
    PCG.auditLog.push({ at:t.returnToServiceApprovedAt, actor:PCG.user.id, action:'serviceTicket.rts.approve', entityId:t.id });
    PCG.engines.notify.emit('ServiceTicketRTSApproved', { id:t.id });
    return t;
  };

  PCG.api.createDamageChargeFromTicket = (ticketId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.DIRECTORS);
    const t = (PCG.serviceTickets||[]).find(x => x.id === ticketId);
    if(!t) throw new Error('Ticket not found');
    if(!t.clientCaused) throw new Error('Only client-caused tickets can become damage charges');
    if(t.damageChargeId) return (PCG.damageCharges||[]).find(d => d.id === t.damageChargeId);
    const charge = {
      id: 'dc.'+Math.random().toString(36).slice(2,8),
      ticketId: t.id,
      showId:   t.showId,
      amount:   t.estimatedCost || 0,
      status:   'Draft',
      createdAt: new Date().toISOString(),
      createdById: PCG.user.id
    };
    PCG.damageCharges = PCG.damageCharges || [];
    PCG.damageCharges.push(charge);
    t.damageChargeId = charge.id;
    PCG.auditLog.push({ at:charge.createdAt, actor:PCG.user.id, action:'damageCharge.create', entityId:charge.id });
    PCG.engines.notify.emit('DamageChargeCreated', { id:charge.id, ticketId:t.id, amount:charge.amount });
    return charge;
  };

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
  // v2.1 — Messages (Labor Coord → Crew broadcast)
  // ------------------------------------------------------------------
  PCG.api.getMessages = (filter) => {
    let list = (PCG.messages||[]).slice().reverse();
    if(filter && filter.showId) list = list.filter(m=>m.showId===filter.showId);
    if(filter && filter.fromId) list = list.filter(m=>m.fromId===filter.fromId);
    return list;
  };
  PCG.api.sendMessage = (payload) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM);
    PCG.messages = PCG.messages || [];
    const m = {
      id: 'msg.'+Math.random().toString(36).slice(2,9),
      fromId: PCG.user.id,
      showId: payload.showId || null,
      toCrewIds: payload.toCrewIds || [],
      toAll: !!payload.toAll,
      subject: payload.subject || '',
      body: payload.body || '',
      sentAt: new Date().toISOString(),
      channel: payload.channel || 'inapp'  // inapp | email | sms
    };
    PCG.messages.push(m);
    PCG.engines.notify.emit('MessageSent', { id:m.id, to: m.toAll ? 'all-crew' : m.toCrewIds.length+' crew' });
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at: m.sentAt, actor: PCG.user.id, action: 'message.send', entityId: m.id,
      detail: `"${m.subject}" → ${m.toAll ? 'all crew on '+m.showId : m.toCrewIds.length+' recipients'}` });
    return m;
  };

  // ------------------------------------------------------------------
  // v2.1 — Pitches / Proposals (pre-quote)
  // ------------------------------------------------------------------
  PCG.api.getPitches = (filter) => {
    let list = (PCG.pitches||[]).slice();
    if(filter && filter.clientId) list = list.filter(p=>p.clientId===filter.clientId);
    if(filter && filter.status) list = list.filter(p=>p.status===filter.status);
    return list;
  };
  PCG.api.getPitch = (id) => (PCG.pitches||[]).find(p=>p.id===id) || null;

  PCG.api.createPitch = (fields) => {
    PCG.requireAny(PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN);
    const p = Object.assign({
      id:'pitch.'+Math.random().toString(36).slice(2,8),
      aeId: PCG.user.id, createdAt: new Date().toISOString(),
      status:'Draft', valueProps:[], deliverables:[],
      keyDates:{}, acceptedAt:null, convertedQuoteId:null
    }, fields);
    PCG.pitches = PCG.pitches || [];
    PCG.pitches.push(p);
    return p;
  };

  PCG.api.convertPitchToQuote = (pitchId) => {
    PCG.requireAny(PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN);
    const pitch = PCG.api.getPitch(pitchId);
    if(!pitch) return { ok:false, reason:'Pitch not found' };
    if(pitch.convertedQuoteId) return { ok:false, reason:'Already converted', quoteId:pitch.convertedQuoteId };
    pitch.status = 'Converted';
    pitch.acceptedAt = pitch.acceptedAt || new Date().toISOString();
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'pitch.convert', entityId:pitchId });
    return { ok:true };
  };

  // ------------------------------------------------------------------
  // v2.1 — Creative Requests (§24)
  // ------------------------------------------------------------------
  PCG.api.getCreativeRequests = (filter) => {
    let list = (PCG.creativeRequests||[]).slice();
    if(filter && filter.projectId) list = list.filter(r=>r.projectId===filter.projectId);
    if(filter && filter.status) list = list.filter(r=>r.status===filter.status);
    if(filter && filter.type) list = list.filter(r=>r.type===filter.type);
    return list;
  };

  PCG.api.advanceCreativeStatus = (requestId, toStatus) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.AE);
    const r = (PCG.creativeRequests||[]).find(x=>x.id===requestId);
    if(!r) return { ok:false };
    r.fabricationStatus = toStatus;
    if(toStatus==='Complete') r.status = 'Complete';
    return { ok:true, request:r };
  };

  // ------------------------------------------------------------------
  // v2.1 — Field Notes / Issue Log (§G + §22)
  // ------------------------------------------------------------------
  PCG.api.getFieldNotes = (showId) => (PCG.fieldNotes||[]).filter(n=>n.showId===showId);
  PCG.api.addFieldNote = (showId, text, category) => {
    const note = {
      id:'fn.'+Math.random().toString(36).slice(2,8),
      showId, authorId:PCG.user.id, text,
      category:category||'operational',
      attachments:[], timestamp:new Date().toISOString()
    };
    PCG.fieldNotes = PCG.fieldNotes || [];
    PCG.fieldNotes.unshift(note);
    return note;
  };

  // ------------------------------------------------------------------
  // v2.1 — Procurement Requests (§9.1)
  // ------------------------------------------------------------------
  PCG.api.getProcurementRequests = (filter) => {
    let list = (PCG.procurementRequests||[]).slice();
    if(filter && filter.status) list = list.filter(p=>p.status===filter.status);
    if(filter && filter.departmentId) list = list.filter(p=>p.departmentId===filter.departmentId);
    if(!PCG.canSeeTier('T2_MARGINS')) list = list.map(p=>{ const c={...p}; delete c.estimatedCost; return c; });
    return list;
  };

  // ------------------------------------------------------------------
  // v2.1 — Closeout Records (§35)
  // ------------------------------------------------------------------
  PCG.api.getCloseoutRecord = (showId) => (PCG.closeoutRecords||[]).find(c=>c.showId===showId) || null;
  PCG.api.canCloseoutClose = (showId) => {
    const c = PCG.api.getCloseoutRecord(showId);
    const show = PCG.api.getShow(showId);
    const blockers = [];
    if(!c)                              { return { ok:false, reasons:['No CloseoutRecord exists — show not yet in Closing state.'] }; }
    if(!c.pmSignoffAt)                  blockers.push('PM closeout sign-off not completed');
    if(!c.laborActualsConfirmed)        blockers.push('Labor actuals not finalized');
    const openTix = (PCG.serviceTickets||[]).filter(t=>t.showId===showId && !['Repaired','ReturnToService','Retired','Deferred'].includes(t.status));
    if(openTix.length)                  blockers.push(`${openTix.length} open service ticket(s) — resolve or defer`);
    if(!c.financeHandoffGeneratedAt)    blockers.push('Finance handoff packet not generated');
    const missing = (PCG.serviceTickets||[]).filter(t=>t.showId===showId && t.missing);
    if(missing.length > (c.missingItemResolutions||[]).length) blockers.push('Unresolved missing items without escalation');
    if(!c.lessonsLearned || !c.lessonsLearned.trim()) blockers.push('Lessons learned not captured (required field)');
    return { ok: blockers.length===0, reasons: blockers, record: c };
  };

  // ------------------------------------------------------------------
  // v2.1 — WorkItems (§25 full model, distinct from ActionQueue)
  // ------------------------------------------------------------------
  PCG.api.getWorkItems = (filter) => {
    let list = (PCG.workItems||[]).slice();
    if(filter && filter.ownerId) list = list.filter(w=>w.ownerId===filter.ownerId);
    if(filter && filter.type)    list = list.filter(w=>w.type===filter.type);
    if(filter && filter.status)  list = list.filter(w=>w.status===filter.status);
    if(filter && filter.priority) list = list.filter(w=>w.priority===filter.priority);
    return list;
  };

  // ------------------------------------------------------------------
  // v2.1 — Shop clock-in/out (§12.3 time capture foundation)
  // ------------------------------------------------------------------
  PCG.api.getActiveClockEvent = (crewMemberId) => {
    return (PCG.clockEvents||[]).find(e=>e.crewMemberId===crewMemberId && !e.clockOut) || null;
  };
  PCG.api.clockIn = (crewMemberId, warehouseId, shift) => {
    PCG.clockEvents = PCG.clockEvents || [];
    const existing = PCG.api.getActiveClockEvent(crewMemberId);
    if(existing) return { ok:false, reason:'Already clocked in', event:existing };
    const ev = {
      id:'ce.'+Math.random().toString(36).slice(2,8),
      crewMemberId, warehouseId: warehouseId||'wh.troy',
      clockIn:new Date().toISOString(), clockOut:null,
      shift: shift||'Day Shift', assignedPullSheets:[], assignedTasks:[]
    };
    PCG.clockEvents.push(ev);
    return { ok:true, event:ev };
  };
  PCG.api.clockOut = (crewMemberId) => {
    const ev = PCG.api.getActiveClockEvent(crewMemberId);
    if(!ev) return { ok:false, reason:'Not clocked in' };
    ev.clockOut = new Date().toISOString();
    return { ok:true, event:ev };
  };

  // ------------------------------------------------------------------
  // v2.1 — My (crew PWA) Timesheets
  // ------------------------------------------------------------------
  PCG.api.getMyTimesheets = () => (PCG.timesheets||[]).filter(t=>t.crewMemberId===PCG.user.id);
  PCG.api.submitTimesheet = (timesheetId) => {
    const t = (PCG.timesheets||[]).find(x=>x.id===timesheetId);
    if(!t) return { ok:false, reason:'Timesheet not found' };
    t.status = 'Submitted';
    t.submittedAt = new Date().toISOString();
    return { ok:true, timesheet:t };
  };
  PCG.api.updateMyTimesheet = (timesheetId, fields) => {
    const t = (PCG.timesheets||[]).find(x=>x.id===timesheetId);
    if(!t) return { ok:false, reason:'Timesheet not found' };
    if(t.status!=='Draft') return { ok:false, reason:'Timesheet already submitted' };
    Object.assign(t, fields);
    // Recompute hours if clock times changed
    if(fields.clockIn || fields.clockOut){
      const ci = new Date(t.clockIn), co = new Date(t.clockOut);
      if(t.clockIn && t.clockOut){
        const hrs = (co - ci)/3600000 - (t.mealBreakMinutes||0)/60;
        t.workedHours = Math.max(0, Math.round(hrs*10)/10);
        t.otHours = Math.max(0, Math.min(t.workedHours - 8, 4));
        t.dtHours = Math.max(0, t.workedHours - 12);
      }
    }
    return { ok:true, timesheet:t };
  };

  // ------------------------------------------------------------------
  // v2.1 — Add Order submission (§10.6)
  // ------------------------------------------------------------------
  PCG.api.submitAddOrder = (showId, description, urgency, items) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS);
    const ao = {
      id:'ao.'+Math.random().toString(36).slice(2,8),
      showId,
      aoNumber: 'AO-'+String((PCG.addOrders||[]).filter(a=>a.showId===showId).length+1).padStart(3,'0'),
      type:'AddOrder',
      requestedById:PCG.user.id, requestedAt:new Date().toISOString(),
      urgency: urgency||'Standard', description,
      items: items||[], status:'Requested',
      returnTracked:true, billableDecision:'Undecided'
    };
    PCG.addOrders = PCG.addOrders || [];
    PCG.addOrders.push(ao);
    PCG.engines.notify.emit('AddOrderSubmitted', { id:ao.id, showId, urgency });
    return ao;
  };

  // ------------------------------------------------------------------
  // v2.1 — Search (§33)
  // ------------------------------------------------------------------
  PCG.api.search = (q) => {
    const query = (q||'').toLowerCase().trim();
    if(!query) return { projects:[], venues:[], clients:[], serials:[], quotes:[], crew:[], tickets:[] };
    const qmatch = s => (s||'').toLowerCase().includes(query);
    return {
      projects: (PCG.projects||[]).filter(p => qmatch(p.code) || qmatch(p.name) || qmatch(p.client)),
      venues:   (PCG.venues||[]).filter(v => qmatch(v.name) || qmatch(v.city) || (v.aka||[]).some(qmatch)),
      clients:  (PCG.clients||[]).filter(c => qmatch(c.name) || qmatch(c.industry)),
      serials:  (PCG.inventorySerials||[]).filter(s => qmatch(s.serial) || qmatch(s.barcode)).slice(0,20),
      quotes:   (PCG.quotes||[]).filter(x => qmatch(x.quoteNo) || qmatch(x.projectCode)),
      crew:     (PCG.crewMembers||[]).filter(c => qmatch(c.name) || qmatch(c.email)),
      tickets:  (PCG.serviceTickets||[]).filter(t => qmatch(t.id) || qmatch(t.serialId) || qmatch(t.description)).slice(0,20)
    };
  };

  // ------------------------------------------------------------------
  // v2.1 — Clients / Master Data
  // ------------------------------------------------------------------
  PCG.api.getClients = () => (PCG.clients||[]).slice();
  PCG.api.getClient  = (id) => (PCG.clients||[]).find(c=>c.id===id) || null;
  PCG.api.getClientRevenueRollup = (clientId) => {
    if(!PCG.canSeeTier('T2_MARGINS')) return null;
    const client = PCG.api.getClient(clientId);
    if(!client) return null;
    const projects = (PCG.projects||[]).filter(p=>p.clientId===clientId);
    const quoted = projects.reduce((s,p)=>{
      const q = (PCG.quotes||[]).find(x=>x.projectCode===p.code);
      return s + ((q&&q.totalRevenue)||0);
    },0);
    return { clientId, quoted, ytd: client.revenueYTD, projectCount: projects.length };
  };

  // ------------------------------------------------------------------
  // v2.1 — System Definitions (Kits / System Builder)
  // ------------------------------------------------------------------
  PCG.api.getSystemDefinitions = () => (PCG.systemDefinitions||[]).slice();
  PCG.api.getSystemDefinition  = (id) => (PCG.systemDefinitions||[]).find(s=>s.id===id) || null;

  // ------------------------------------------------------------------
  // v2.1 — Inventory: models + serials + balance per warehouse
  // ------------------------------------------------------------------
  PCG.api.getWarehouses = () => (PCG.warehouses||[]).slice();
  PCG.api.getSerializedItems = (filter) => {
    let list = (PCG.inventorySerials||[]).slice();
    if(filter && filter.modelId) list = list.filter(s=>s.itemId===filter.modelId);
    if(filter && filter.status)  list = list.filter(s=>s.status===filter.status);
    return list;
  };
  PCG.api.getInventoryBalance = (modelId, warehouseId) => {
    // Computed view (§6.3)
    const model = PCG.api.getInventoryItem(modelId);
    if(!model) return null;
    const serials = (PCG.inventorySerials||[]).filter(s=>s.itemId===modelId);
    const count = status => serials.filter(s=>s.status===status).length;
    const confirmedAllocs = (PCG.allocations||[])
      .filter(a=>a.inventoryItemId===modelId && a.holdType==='confirmed')
      .reduce((s,a)=>s+(a.qty||0),0);
    const rpoSupply = (PCG.subRentals||[])
      .filter(r=>r.itemId===modelId && r.status==='Approved')
      .reduce((s,r)=>s+(r.qty||0),0);
    const owned = model.qty||0;
    const ooc = count('OOC');
    const missing = count('Lost') + count('Missing');
    const available = Math.max(0, owned - confirmedAllocs - ooc - missing + rpoSupply);
    return {
      modelId, warehouseId: warehouseId||'wh.premier-main',
      owned, available,
      reserved: 0, allocated: confirmedAllocs,
      picked: count('Picked'), onShow: count('OnShow'), returned: count('Returned'),
      qcHold: count('QCHold'), ooc, missing,
      onOrder: 0, subrental: rpoSupply
    };
  };
  PCG.api.getReorderRules = () => (PCG.reorderRules||[]).slice();
  PCG.api.getReorderAlerts = () => {
    return (PCG.reorderRules||[]).map(r=>{
      const b = PCG.api.getInventoryBalance(r.modelId, r.warehouseId);
      const model = PCG.api.getInventoryItem(r.modelId);
      return { rule:r, balance:b, model, triggered: b && b.available < r.minQty };
    }).filter(x=>x.triggered);
  };

  // ------------------------------------------------------------------
  // v2.1 — Logistics / Manifests / Drivers / Vehicles
  // ------------------------------------------------------------------
  PCG.api.getDrivers = () => (PCG.drivers||[]).slice();
  PCG.api.getVehicles = () => (PCG.vehicles||[]).slice();
  PCG.api.getContainer = (id) => (PCG.containers||[]).find(c=>c.id===id) || null;

  // ------------------------------------------------------------------
  // v2.1 — Timesheets + Payroll (§12.3)
  // ------------------------------------------------------------------
  PCG.api.getTimesheets = (filter) => {
    let list = (PCG.timesheets||[]).slice();
    if(filter && filter.showId)  list = list.filter(t=>t.showId===filter.showId);
    if(filter && filter.status)  list = list.filter(t=>t.status===filter.status);
    if(filter && filter.crewId)  list = list.filter(t=>t.crewMemberId===filter.crewId);
    // Tier-1 redaction: strip payRate-derived grossPay
    if(!PCG.canSeeTier('T1_CREW_PAY_RATES')){
      list = list.map(t=>{ const c={...t}; delete c.grossPay; return c; });
    }
    return list;
  };
  PCG.api.getPayRules = () => (PCG.payRules||[]).slice();
  PCG.api.generatePayrollExport = (showId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.ACCOUNTING);
    const ts = (PCG.timesheets||[]).filter(t=>t.showId===showId && t.status==='Approved');
    return ts.map(t => {
      const crew = PCG.findPerson(t.crewMemberId);
      const assn = (PCG.shiftAssignments||[]).find(a=>a.id===t.shiftAssignmentId);
      const pos  = assn && (PCG.crewPositions||[]).find(p=>p.id===assn.positionId);
      const rate = pos && pos.ratesByVersion && pos.ratesByVersion[0];
      const payRate = (rate && rate.payRate) || 0;
      const reg = t.workedHours - t.otHours - t.dtHours;
      const gross = reg*payRate + t.otHours*payRate*1.5 + t.dtHours*payRate*2.0;
      return {
        crewMemberId: t.crewMemberId, name: crew ? crew.name : null,
        employmentType: (PCG.crewMembers||[]).find(c=>c.id===t.crewMemberId)?.employmentType,
        workDate: t.workDate,
        regularHours: reg, otHours: t.otHours, dtHours: t.dtHours,
        grossPay: Math.round(gross*100)/100,
        payRuleApplied: t.payRuleApplied, mealPenalties: 0
      };
    });
  };

  // ------------------------------------------------------------------
  // v2.1 — Incidents (§22)
  // ------------------------------------------------------------------
  PCG.api.getIncidents = (filter) => {
    let list = (PCG.incidentReports||[]).slice();
    if(filter && filter.showId)   list = list.filter(i=>i.showId===filter.showId);
    if(filter && filter.status)   list = list.filter(i=>i.status===filter.status);
    if(filter && filter.severity) list = list.filter(i=>i.severity===filter.severity);
    return list;
  };

  // ------------------------------------------------------------------
  // Incident CRUD (§22)
  // ------------------------------------------------------------------
  PCG.api.createIncident = (data) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.PRODUCER, PCG.GROUPS.SCHEDULING, PCG.GROUPS.WH_SUPERVISORS);
    const inc = {
      id: 'inc.'+Math.random().toString(36).slice(2,8),
      showId: data.showId || null,
      description: data.description || '',
      type: data.type || 'Other',
      severity: data.severity || 'Minor',
      locationDescription: data.locationDescription || '',
      witnessNames: data.witnessNames || [],
      immediateActionTaken: data.immediateActionTaken || '',
      medicalAttentionRequired: !!data.medicalAttentionRequired,
      venueNotified: !!data.venueNotified,
      reportedById: PCG.user.id,
      reportedAt: new Date().toISOString(),
      status: 'Open',
      escalatedTo: null
    };
    // Critical auto-escalates to Directors
    if(inc.severity === 'Critical'){
      inc.status = 'Escalated';
      inc.escalatedTo = 'p.kbenz'; // Director of Ops stand-in
      inc.escalatedAt = inc.reportedAt;
    }
    PCG.incidentReports = PCG.incidentReports || [];
    PCG.incidentReports.push(inc);
    PCG.auditLog.push({ at:inc.reportedAt, actor:PCG.user.id, action:'incident.create', entityId:inc.id, detail:inc.severity+' '+inc.type });
    PCG.engines.notify.emit('IncidentReported', { id:inc.id, severity:inc.severity, type:inc.type });
    return inc;
  };

  PCG.api.escalateIncident = (id, toUserId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS);
    const inc = (PCG.incidentReports||[]).find(x=>x.id===id);
    if(!inc) throw new Error('Incident not found');
    inc.status = 'Escalated';
    inc.escalatedTo = toUserId || 'p.kbenz';
    inc.escalatedAt = new Date().toISOString();
    PCG.auditLog.push({ at:inc.escalatedAt, actor:PCG.user.id, action:'incident.escalate', entityId:inc.id });
    PCG.engines.notify.emit('IncidentEscalated', { id:inc.id, to:inc.escalatedTo });
    return inc;
  };

  PCG.api.closeIncident = (id, requireDirectorSignoff) => {
    const inc = (PCG.incidentReports||[]).find(x=>x.id===id);
    if(!inc) throw new Error('Incident not found');
    if(inc.type === 'PersonalInjury' && !requireDirectorSignoff){
      throw new Error('Personal Injury requires Director sign-off to close (§22)');
    }
    if(requireDirectorSignoff){
      PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS);
      inc.directorSignedOffById = PCG.user.id;
      inc.directorSignedOffAt = new Date().toISOString();
    } else {
      PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS);
    }
    inc.status = 'Closed';
    inc.closedAt = new Date().toISOString();
    PCG.auditLog.push({ at:inc.closedAt, actor:PCG.user.id, action:'incident.close', entityId:inc.id, detail:requireDirectorSignoff?'DirectorSignoff':'' });
    PCG.engines.notify.emit('IncidentClosed', { id:inc.id });
    return inc;
  };

  // ------------------------------------------------------------------
  // v2.1 — Crew Assignment workflow (§12.2 multi-step confirmation)
  // ------------------------------------------------------------------
  PCG.api.getQualifiedCrew = (positionId, filters) => {
    filters = filters || {};
    const members = (PCG.crewMembers||[]).slice();
    return members.map(m => {
      const qual = (m.qualifications||[]).find(q=>q.positionId===positionId);
      return { member:m, qualified: !!qual, rating: qual ? qual.rating : null };
    })
    .filter(x => {
      if(filters.qualifiedOnly && !x.qualified) return false;
      if(filters.market && !(x.member.market||[]).includes(filters.market)) return false;
      if(filters.employmentType && x.member.employmentType !== filters.employmentType) return false;
      if(filters.excludeDoNotUse && x.member.doNotUse) return false;
      if(filters.q){
        const q = filters.q.toLowerCase();
        if(!(x.member.name||'').toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a,b) => (b.rating||0) - (a.rating||0));
  };

  PCG.api.inviteCrew = (shiftAssignmentId, crewMemberId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS);
    const a = (PCG.shiftAssignments||[]).find(x=>x.id===shiftAssignmentId);
    if(!a) return { ok:false, reason:'Assignment not found' };
    const conflict = PCG.engines.scheduling.checkAssignment({
      crewMemberId, showId:a.showId, dates:a.dates
    });
    if(conflict.conflict) return { ok:false, reason:'Conflict', conflicts:conflict.conflicts };
    a.crewMemberId = crewMemberId;
    a.status = 'Invited';
    a.invitedAt = new Date().toISOString();
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:a.invitedAt, actor:PCG.user.id, action:'crew.invite',
      entityId:a.id, crewMemberId });
    PCG.engines.notify.emit('CrewInvited', { shiftAssignmentId, crewMemberId });
    return { ok:true, assignment:a };
  };

  PCG.api.advanceCrewStatus = (shiftAssignmentId, toStatus, notes) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS);
    const a = (PCG.shiftAssignments||[]).find(x=>x.id===shiftAssignmentId);
    if(!a) return { ok:false, reason:'Assignment not found' };
    const ts = new Date().toISOString();
    a.status = toStatus;
    if(toStatus==='Confirmed') a.confirmedAt = ts;
    if(toStatus==='Acknowledged') a.acknowledgedAt = ts;
    if(notes) a.note = notes;
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:ts, actor:PCG.user.id, action:'crew.status.'+toStatus.toLowerCase(), entityId:a.id });
    PCG.engines.notify.emit('CrewStatusChanged', { shiftAssignmentId, to:toStatus });
    return { ok:true, assignment:a };
  };

  PCG.api.cancelCrewAssignment = (shiftAssignmentId, reason) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.DIRECTORS);
    const a = (PCG.shiftAssignments||[]).find(x=>x.id===shiftAssignmentId);
    if(!a) return { ok:false };
    a.status = 'Cancelled';
    a.note = reason || a.note;
    const newSlot = Object.assign({}, a, {
      id: 'sa.'+Math.random().toString(36).slice(2,8),
      crewMemberId: null, status:'Placeholder', note:null
    });
    PCG.shiftAssignments.push(newSlot);
    return { ok:true, cancelled:a, newSlot };
  };

  PCG.api.cloneRosterFromPriorShow = (priorShowId, targetShowId) => {
    PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING);
    const priorAssns = (PCG.shiftAssignments||[]).filter(s=>s.showId===priorShowId);
    const target = PCG.api.getProject(targetShowId);
    if(!priorAssns.length) return { ok:false, reason:'No prior roster to clone' };
    const created = priorAssns.map(pa => Object.assign({}, pa, {
      id:'sa.'+Math.random().toString(36).slice(2,8),
      showId: targetShowId,
      status:'Invited',
      dates: (target.dates && target.dates.loadIn) ? [target.dates.loadIn.slice(0,10)] : pa.dates,
      invitedAt: new Date().toISOString()
    }));
    PCG.shiftAssignments = (PCG.shiftAssignments||[]).concat(created);
    return { ok:true, cloned: created.length };
  };

  // Full crew profile — aggregates ShiftAssignments, Timesheets, Travel, Ratings, LaborActuals for one member
  PCG.api.getCrewProfile = (memberId) => {
    const m = (PCG.crewMembers||[]).find(x=>x.id===memberId);
    if(!m) return null;
    // Pay rates redacted
    const copy = JSON.parse(JSON.stringify(m));
    if(!PCG.canSeeTier('T1_CREW_PAY_RATES')){
      (copy.qualifications||[]).forEach(q => delete q.payRate);
    }
    const assns = (PCG.shiftAssignments||[]).filter(s=>s.crewMemberId===memberId);
    const upcoming = assns.filter(a => {
      const sh = PCG.api.getShow(a.showId);
      return sh && sh.lifecycleState !== 'Archived' && a.status !== 'Cancelled';
    });
    const past = assns.filter(a => {
      const sh = PCG.api.getShow(a.showId);
      return (sh && sh.lifecycleState === 'Archived') || a.status === 'Completed';
    });
    const timesheets = (PCG.timesheets||[]).filter(t=>t.crewMemberId===memberId);
    const totalHoursYTD = timesheets.reduce((s,t)=>s+(t.workedHours||0),0);
    const totalOTYTD = timesheets.reduce((s,t)=>s+(t.otHours||0),0);
    const travelRecords = (PCG.travelRecords||[]).filter(t=>t.crewMemberId===memberId);
    const availabilityBlocks = (PCG.availabilityBlocks||[]).filter(b=>b.crewMemberId===memberId);
    const avgRating = (m.performanceRatings||[]).length
      ? (m.performanceRatings||[]).reduce((s,r)=>s+r.rating,0) / (m.performanceRatings||[]).length
      : null;

    // Qualified for positions
    const quals = (copy.qualifications||[]).map(q=>{
      const pos = (PCG.crewPositions||[]).find(p=>p.id===q.positionId);
      return { positionId:q.positionId, positionName:pos?pos.name:q.positionId, department:pos?pos.department:null, rating:q.rating };
    });

    return {
      member: copy,
      qualifications: quals,
      upcomingAssignments: upcoming,
      pastAssignments: past,
      timesheets,
      totalHoursYTD,
      totalOTYTD,
      travelRecords,
      availabilityBlocks,
      avgRating,
      assignmentCount: assns.length
    };
  };

  // Award a quote — seed ShiftAssignment placeholders from quote labor lines
  PCG.api.awardQuote = (quoteId) => {
    PCG.requireAny(PCG.GROUPS.AE, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN);
    const quote = (PCG.quotes||[]).find(q => q.id === quoteId);
    if(!quote) return { ok:false, reason:'Quote not found' };
    const rev = (PCG.quoteRevisions||[]).find(r => r.id === quote.activeRevisionId);
    if(!rev) return { ok:false, reason:'Active revision not found' };
    if(rev.status === 'Awarded') return { ok:false, reason:'Already awarded' };

    // 1) Mark revision Awarded, create ScopeRecord (frozen baseline)
    rev.status = 'Awarded';
    rev.approvedAt = new Date().toISOString();
    rev.approvedById = PCG.user.id;
    quote.status = 'Awarded';

    PCG.scopeRecords = PCG.scopeRecords || [];
    const scopeRec = {
      id: 'sr.'+quote.projectCode,
      quoteRevisionId: rev.id,
      projectCode: quote.projectCode,
      createdAt: new Date().toISOString()
    };
    PCG.scopeRecords.push(scopeRec);

    // 2) Seed ShiftAssignment placeholders from labor lines
    PCG.shiftAssignments = PCG.shiftAssignments || [];
    let seeded = 0;
    const proj = (PCG.projects||[]).find(p => p.code === quote.projectCode);
    const baseDate = proj && proj.dates ? proj.dates.loadIn : null;
    (rev.lines||[]).filter(l => l.type === 'Labor' && l.crewPositionId).forEach(line => {
      const pos = (PCG.crewPositions||[]).find(p => p.id === line.crewPositionId);
      const qty = line.qty || 1;
      for(let i = 0; i < qty; i++){
        PCG.shiftAssignments.push({
          id:'sa.'+Math.random().toString(36).slice(2,8),
          showId: quote.projectCode,
          crewMemberId: null,
          positionId: line.crewPositionId,
          positionGroup: pos ? (pos.department || 'Core') : 'Core',
          dates: baseDate ? [baseDate.slice(0,10)] : [],
          callTime: line.callTime || '07:00',
          status: 'Placeholder',
          invitedAt: null, confirmedAt: null, acknowledgedAt: null,
          note: 'Seeded from Quote line ' + line.id
        });
        seeded++;
      }
    });

    // 3) Audit log
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({
      at: new Date().toISOString(), actor: PCG.user.id,
      action: 'quote.award', entityId: quoteId,
      detail: `Seeded ${seeded} Placeholder ShiftAssignment(s); ScopeRecord frozen.`
    });

    PCG.engines.notify.emit('QuoteAwarded', { quoteId, seeded });
    return { ok:true, seeded, scopeRecordId: scopeRec.id };
  };

  PCG.api.getLaborCostPreview = (showId) => {
    if(!PCG.canSeeTier('T3_BILL_RATES')) return null;
    const assns = (PCG.shiftAssignments||[]).filter(s=>s.showId===showId);
    let totalBill = 0, totalPay = 0;
    assns.forEach(a=>{
      const pos = (PCG.crewPositions||[]).find(p=>p.id===a.positionId);
      if(!pos) return;
      const rate = pos.ratesByVersion && pos.ratesByVersion[0];
      if(!rate) return;
      const days = (a.dates||[]).length || 1;
      totalBill += (rate.billRate || 0) * 10 * days;
      if(PCG.canSeeTier('T1_CREW_PAY_RATES')) totalPay += (rate.payRate || 0) * 10 * days;
    });
    return { totalBill, totalPay, positionCount: assns.length };
  };

  // ------------------------------------------------------------------
  // v2.1 — Project crew (per-project slice of ShiftAssignments)
  // ------------------------------------------------------------------
  PCG.api.getProjectCrew = (showId) => {
    const assignments = (PCG.shiftAssignments||[]).filter(s=>s.showId===showId);
    return assignments.map(a => {
      const crew  = a.crewMemberId ? (PCG.api.getCrewMember(a.crewMemberId) || PCG.findPerson(a.crewMemberId)) : null;
      const pos   = PCG.api.getCrewPosition(a.positionId);
      const travel= (PCG.travelRecords||[]).find(t=>t.crewMemberId===a.crewMemberId && t.showId===showId);
      const ts    = (PCG.timesheets||[]).filter(t=>t.shiftAssignmentId===a.id);
      return {
        assignment: a,
        crew: crew ? { id:crew.id, name:crew.name, employmentType:crew.employmentType,
                       email:crew.email||null, phone:crew.phone||null } : null,
        position: pos ? { id:pos.id, name:pos.name, department:pos.department,
                          union: pos.union, unionLocal: pos.unionLocal } : null,
        travel: travel || null,
        timesheets: ts || [],
        confirmationStatus: a.status
      };
    });
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

  // ==================================================================
  // v2.X — Quote line mutation (real pickers replace Phase-2 stubs)
  // Spec §5.3 · §L (System Builder inside quoting)
  // ==================================================================
  function _auditQuote(revId, action, detail) {
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id,
      action:'quote.'+action, entityId:revId, detail });
  }
  function _revEditable(rev) {
    if(!rev) return { ok:false, reason:'Revision not found' };
    // Awarded revisions are technically immutable per spec (§EE) — Change Orders modify scope.
    // For the demo, allow edits with audit log. Real deployment should enforce.
    return { ok:true };
  }
  function _recomputeRevision(rev) {
    if(!PCG.engines || !PCG.engines.pricing) return;
    const t = PCG.engines.pricing.computeRevisionTotals(rev.lines||[]);
    rev.totalRevenue = t.totalRevenue;
    rev.totalCost = t.totalCost;
    rev.margin = t.margin;
  }

  PCG.api.addQuoteLine = (revId, line) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN, G.SCHEDULING);
    const rev = (PCG.quoteRevisions||[]).find(r=>r.id===revId);
    const guard = _revEditable(rev);
    if(!guard.ok) return { ok:false, reason:guard.reason };
    const newLine = Object.assign({
      id: 'qln.'+Math.random().toString(36).slice(2,8),
      packageName: line.packageName || 'Added Lines',
      type: line.type || 'Rental',
      qty: line.qty || 1,
      rateTier: line.rateTier || 'day',
      unitPrice: line.unitPrice || 0,
      days: line.days || 1,
      cost: line.cost || 0,
      marginContribution: 0,
      description: line.description || ''
    }, line);
    rev.lines = rev.lines || [];
    rev.lines.push(newLine);
    _recomputeRevision(rev);
    _auditQuote(revId, 'line.add', `+${newLine.description} × ${newLine.qty}`);
    return { ok:true, line:newLine, rev };
  };

  PCG.api.removeQuoteLine = (revId, lineId) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN, G.SCHEDULING);
    const rev = (PCG.quoteRevisions||[]).find(r=>r.id===revId);
    const guard = _revEditable(rev);
    if(!guard.ok) return { ok:false, reason:guard.reason };
    const before = (rev.lines||[]).length;
    rev.lines = (rev.lines||[]).filter(l=>l.id!==lineId);
    const removed = before - rev.lines.length;
    _recomputeRevision(rev);
    _auditQuote(revId, 'line.remove', `Removed line ${lineId}`);
    return { ok: removed > 0, removed, rev };
  };

  PCG.api.updateQuoteLine = (revId, lineId, fields) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN, G.SCHEDULING);
    const rev = (PCG.quoteRevisions||[]).find(r=>r.id===revId);
    const guard = _revEditable(rev);
    if(!guard.ok) return { ok:false, reason:guard.reason };
    const line = (rev.lines||[]).find(l=>l.id===lineId);
    if(!line) return { ok:false, reason:'Line not found' };
    Object.assign(line, fields);

    // Rate-tier pricing: auto-pull unitPrice from inventory.rates when tier switches
    if(fields.rateTier !== undefined && line.inventoryItemId){
      const inv = PCG.api.getInventoryItem(line.inventoryItemId);
      const rates = (inv && inv.rates) || {};
      const tier = fields.rateTier;
      if(tier === 'client'){
        const quote = (PCG.quotes||[]).find(q => q.id === rev.quoteId);
        let clientId = quote && quote.clientId;
        if(!clientId && quote && quote.projectCode){
          const proj = (PCG.projects||[]).find(p => p.code === quote.projectCode);
          if(proj) clientId = proj.clientId;
        }
        const client = clientId ? PCG.api.getClient(clientId) : null;
        const baseDay = rates.day || line.unitPrice || 0;
        const discount = (client && client.discountPct) || 0;
        line.unitPrice = Math.round(baseDay * (1 - discount) * 100) / 100;
        line.clientDiscountPct = discount;
      } else if(tier === 'custom'){
        // Leave unitPrice as-is; user will type a custom value
        line.clientDiscountPct = 0;
      } else if(rates[tier] != null){
        line.unitPrice = rates[tier];
        line.clientDiscountPct = 0;
      }
    }

    _recomputeRevision(rev);
    return { ok:true, line, rev };
  };

  // System Builder insert — spec §L "most critical gap" (v2.2)
  // Expands a SystemDefinition into a grouped block of quote lines.
  PCG.api.insertSystemDefinitionAsLines = (revId, sysDefId, opts) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN);
    const rev = (PCG.quoteRevisions||[]).find(r=>r.id===revId);
    const guard = _revEditable(rev);
    if(!guard.ok) return { ok:false, reason:guard.reason };
    const sd = (PCG.systemDefinitions||[]).find(s=>s.id===sysDefId);
    if(!sd) return { ok:false, reason:'System definition not found' };
    opts = opts || {};
    const sysQty = opts.sysQty || 1;
    const pkgName = sd.name;
    const added = [];
    const build = (comp, role) => {
      const inv = (PCG.inventory||[]).find(i=>i.id===comp.modelId);
      if(!inv) return null;
      const rate = (inv.rates && (inv.rates.day || inv.rates.week)) || 0;
      const line = {
        id: 'qln.'+Math.random().toString(36).slice(2,8),
        packageName: pkgName,
        type: 'Rental',
        inventoryItemId: inv.id,
        description: inv.name + (comp.role ? ' ('+comp.role+')' : ''),
        qty: (comp.qty||1) * sysQty,
        rateTier: 'day',
        unitPrice: rate,
        days: 1,
        cost: (inv.perItemCost || rate * 0.35) || 0,
        marginContribution: 0,
        systemDefinitionId: sd.id,
        componentRole: role,
        isOptional: role === 'optional'
      };
      return line;
    };
    (sd.requiredComponents || []).forEach(c => {
      const l = build(c, 'required'); if(l){ added.push(l); }
    });
    const pickedOptionalIds = new Set(opts.includeOptional || []);
    (sd.optionalComponents || []).forEach((c, idx) => {
      if (pickedOptionalIds.has(c.modelId) || pickedOptionalIds.has(String(idx))) {
        const l = build(c, 'optional'); if(l){ added.push(l); }
      }
    });
    rev.lines = rev.lines || [];
    added.forEach(l => rev.lines.push(l));
    _recomputeRevision(rev);
    _auditQuote(revId, 'line.insertSystem', `Inserted system "${sd.name}" × ${sysQty} (${added.length} lines)`);
    return { ok:true, added: added.length, systemDefinition: sd, rev };
  };

  // Copy lines from a prior quote revision into this one (replace or append).
  PCG.api.cloneRevisionLinesFrom = (srcRevId, destRevId, mode) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN);
    const src = (PCG.quoteRevisions||[]).find(r=>r.id===srcRevId);
    const dest = (PCG.quoteRevisions||[]).find(r=>r.id===destRevId);
    if(!src) return { ok:false, reason:'Source revision not found' };
    const guard = _revEditable(dest);
    if(!guard.ok) return { ok:false, reason:guard.reason };
    mode = mode || 'replace';
    const cloned = (src.lines||[]).map(l => Object.assign({}, l, {
      id: 'qln.'+Math.random().toString(36).slice(2,8),
      clonedFromLineId: l.id,
      clonedFromRevisionId: src.id
    }));
    if(mode === 'replace') dest.lines = cloned;
    else dest.lines = (dest.lines||[]).concat(cloned);
    _recomputeRevision(dest);
    _auditQuote(destRevId, 'clone', `Cloned ${cloned.length} lines from ${srcRevId} (${mode})`);
    return { ok:true, cloned: cloned.length, mode };
  };

  // ==================================================================
  // v2.X — Client Portal: issue + approvals + invites
  // Spec §U (Client Experience Engine), §36 (Client Communication Timeline)
  // ==================================================================
  PCG.api.issueQuoteToClient = (quoteId) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN);
    const q = (PCG.quotes||[]).find(x=>x.id===quoteId);
    if(!q) return { ok:false, reason:'Quote not found' };
    const rev = (PCG.quoteRevisions||[]).find(r=>r.id===q.activeRevisionId);
    if(!rev) return { ok:false, reason:'Active revision not found' };
    if(rev.status === 'Awarded') return { ok:false, reason:'Quote already awarded — nothing to issue' };
    rev.status = 'Issued';
    rev.issuedAt = new Date().toISOString();
    q.status = 'Issued';
    const proj = (PCG.projects||[]).find(p=>p.code===q.projectCode);
    const clientId = proj ? proj.clientId : null;
    const tokenPayload = { c: clientId, s: q.projectCode, qid: quoteId,
      exp: new Date(Date.now() + 14*24*3600*1000).toISOString() };
    const token = btoa(JSON.stringify(tokenPayload))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    PCG.clientInvites = PCG.clientInvites || [];
    const invite = {
      id:'ci.'+Math.random().toString(36).slice(2,8),
      clientId, projectCode: q.projectCode, quoteId,
      token, issuedAt: rev.issuedAt, issuedById: PCG.user.id, revokedAt: null
    };
    PCG.clientInvites.push(invite);
    _auditQuote(rev.id, 'issue', `Issued to client — token expires ${tokenPayload.exp.slice(0,10)}`);
    PCG.engines.notify.emit('QuoteIssuedToClient', { quoteId, clientId, projectCode: q.projectCode });
    return { ok:true, invite, url: 'client/index.html?token=' + token };
  };

  PCG.api.getClientInvites = (filter) => {
    let list = (PCG.clientInvites||[]).slice().reverse();
    if(filter && filter.quoteId)  list = list.filter(i=>i.quoteId===filter.quoteId);
    if(filter && filter.clientId) list = list.filter(i=>i.clientId===filter.clientId);
    return list;
  };

  PCG.api.recordClientApproval = (payload) => {
    PCG.clientApprovals = PCG.clientApprovals || [];
    const a = {
      id:'ca.'+Math.random().toString(36).slice(2,8),
      quoteId: payload.quoteId,
      quoteRevisionId: payload.quoteRevisionId,
      clientId: payload.clientId,
      projectCode: payload.projectCode,
      action: payload.action,      // 'Approved' | 'ChangesRequested'
      comment: payload.comment || '',
      at: new Date().toISOString(),
      byEmail: payload.byEmail || null
    };
    PCG.clientApprovals.push(a);
    // If approved, mark the revision
    if(payload.action === 'Approved'){
      const rev = (PCG.quoteRevisions||[]).find(r=>r.id===payload.quoteRevisionId);
      if(rev) {
        rev.clientApprovedAt = a.at;
        rev.clientApprovalId = a.id;
      }
    }
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:a.at, actor:'client:'+(payload.byEmail||payload.clientId),
      action:'client.'+payload.action.toLowerCase(), entityId: payload.quoteRevisionId,
      detail: payload.comment || '' });
    PCG.engines.notify.emit('ClientQuoteDecision', { action: payload.action, quoteId: payload.quoteId });
    return a;
  };

  PCG.api.getClientApprovals = (filter) => {
    let list = (PCG.clientApprovals||[]).slice().reverse();
    if(filter && filter.quoteId)  list = list.filter(a=>a.quoteId===filter.quoteId);
    if(filter && filter.clientId) list = list.filter(a=>a.clientId===filter.clientId);
    return list;
  };

  PCG.api.getClientContacts = (clientId) => {
    return (PCG.clientContacts||[]).filter(c => !clientId || c.clientId === clientId);
  };

  PCG.api.getClientMessages = (clientId, projectCode) => {
    return (PCG.clientMessages||[])
      .filter(m => (!clientId || m.clientId===clientId) && (!projectCode || m.projectCode===projectCode))
      .sort((a,b)=>new Date(a.at) - new Date(b.at));
  };

  PCG.api.postClientMessage = (payload) => {
    PCG.clientMessages = PCG.clientMessages || [];
    const m = {
      id:'cm.'+Math.random().toString(36).slice(2,8),
      clientId: payload.clientId,
      projectCode: payload.projectCode,
      fromSide: payload.fromSide || 'pcg',   // 'pcg' | 'client'
      fromName: payload.fromName || 'PCG',
      body: payload.body || '',
      at: new Date().toISOString()
    };
    PCG.clientMessages.push(m);
    return m;
  };

  // ==================================================================
  // v2.X — Show Tech Plan (Engineering: Video-IO + Intercom + Audio)
  // Spec §M / §T — read+basic-entry UX for live show
  // ==================================================================
  PCG.api.getShowTechPlan = (showId) => {
    return (PCG.showTechPlans||[]).find(p=>p.showId===showId) || null;
  };

  PCG.api.createShowTechPlan = (showId) => {
    PCG.requireAny(G.ADMIN, G.TSMS, G.DIRECTORS);
    PCG.showTechPlans = PCG.showTechPlans || [];
    if(PCG.api.getShowTechPlan(showId)) return PCG.api.getShowTechPlan(showId);
    const p = {
      id:'stp.'+Math.random().toString(36).slice(2,8),
      showId,
      videoIO: { id:'vio.'+Math.random().toString(36).slice(2,6), inputs:[], outputs:[], routes:[],
                 switcherModelId:null, notes:'' },
      intercom: { id:'ico.'+Math.random().toString(36).slice(2,6), systemType:'Clear-Com',
                  channels:[], beltpackAssignments:[], radioFrequencies:[], notes:'' },
      audioRack:{ id:'arp.'+Math.random().toString(36).slice(2,6), consoleModelId:null,
                  channelCount:0, channelList:[], outputs:[], notes:'' },
      createdAt: new Date().toISOString(), lastModifiedById: PCG.user.id
    };
    PCG.showTechPlans.push(p);
    return p;
  };

  function _requireTechEdit() { PCG.requireAny(G.ADMIN, G.TSMS, G.DIRECTORS); }

  PCG.api.addVideoIOPoint = (showId, point) => {
    _requireTechEdit();
    const plan = PCG.api.getShowTechPlan(showId) || PCG.api.createShowTechPlan(showId);
    const target = point.pointType === 'Output' ? plan.videoIO.outputs : plan.videoIO.inputs;
    const pt = Object.assign({
      id:'vpt.'+Math.random().toString(36).slice(2,8),
      pointNumber: (target.length + 1),
      label: point.label || '',
      signalType: point.signalType || 'SDI',
      signalFormat: point.signalFormat || '1080p59.94',
      sourceDevice: point.sourceDevice || '',
      destinationDevice: point.destinationDevice || '',
      pointType: point.pointType || 'Input'
    }, point);
    target.push(pt);
    plan.lastModifiedById = PCG.user.id;
    return pt;
  };

  PCG.api.removeVideoIOPoint = (showId, pointId) => {
    _requireTechEdit();
    const plan = PCG.api.getShowTechPlan(showId); if(!plan) return { ok:false };
    const before = plan.videoIO.inputs.length + plan.videoIO.outputs.length;
    plan.videoIO.inputs = plan.videoIO.inputs.filter(p=>p.id!==pointId);
    plan.videoIO.outputs = plan.videoIO.outputs.filter(p=>p.id!==pointId);
    plan.videoIO.routes = plan.videoIO.routes.filter(r => r.inputId!==pointId && r.outputId!==pointId);
    return { ok: (plan.videoIO.inputs.length + plan.videoIO.outputs.length) < before };
  };

  PCG.api.addVideoRoute = (showId, route) => {
    _requireTechEdit();
    const plan = PCG.api.getShowTechPlan(showId) || PCG.api.createShowTechPlan(showId);
    const r = Object.assign({
      id:'vrt.'+Math.random().toString(36).slice(2,8),
      name: route.name || 'Route ' + (plan.videoIO.routes.length+1),
      inputId: route.inputId, outputId: route.outputId
    }, route);
    plan.videoIO.routes.push(r);
    return r;
  };

  PCG.api.removeVideoRoute = (showId, routeId) => {
    _requireTechEdit();
    const plan = PCG.api.getShowTechPlan(showId); if(!plan) return { ok:false };
    const before = plan.videoIO.routes.length;
    plan.videoIO.routes = plan.videoIO.routes.filter(r=>r.id!==routeId);
    return { ok: plan.videoIO.routes.length < before };
  };

  PCG.api.addIntercomChannel = (showId, channel) => {
    _requireTechEdit();
    const plan = PCG.api.getShowTechPlan(showId) || PCG.api.createShowTechPlan(showId);
    const ch = Object.assign({
      id:'ich.'+Math.random().toString(36).slice(2,8),
      channelNumber: plan.intercom.channels.length + 1,
      channelLabel: channel.channelLabel || ('Channel '+ (plan.intercom.channels.length+1)),
      channelType: channel.channelType || 'Party',
      primaryUsers: channel.primaryUsers || []
    }, channel);
    plan.intercom.channels.push(ch);
    return ch;
  };

  PCG.api.removeIntercomChannel = (showId, channelId) => {
    _requireTechEdit();
    const plan = PCG.api.getShowTechPlan(showId); if(!plan) return { ok:false };
    const before = plan.intercom.channels.length;
    plan.intercom.channels = plan.intercom.channels.filter(c=>c.id!==channelId);
    plan.intercom.beltpackAssignments = plan.intercom.beltpackAssignments.filter(b=>b.channelId!==channelId);
    return { ok: plan.intercom.channels.length < before };
  };

  PCG.api.assignBeltpack = (showId, assignment) => {
    _requireTechEdit();
    const plan = PCG.api.getShowTechPlan(showId) || PCG.api.createShowTechPlan(showId);
    const a = Object.assign({
      id:'bp.'+Math.random().toString(36).slice(2,8),
      beltpackNumber: plan.intercom.beltpackAssignments.length + 1,
      userLabel: assignment.userLabel || 'Crew',
      positionId: assignment.positionId || null,
      channelId: assignment.channelId || null
    }, assignment);
    plan.intercom.beltpackAssignments.push(a);
    return a;
  };

  PCG.api.removeBeltpack = (showId, beltpackId) => {
    _requireTechEdit();
    const plan = PCG.api.getShowTechPlan(showId); if(!plan) return { ok:false };
    const before = plan.intercom.beltpackAssignments.length;
    plan.intercom.beltpackAssignments = plan.intercom.beltpackAssignments.filter(b=>b.id!==beltpackId);
    return { ok: plan.intercom.beltpackAssignments.length < before };
  };

  // ==================================================================
  // v2.X — EQLPC — real Substitution Proposal + Draft Sub-Rental flows
  // Spec §17 (EQLPC) · §8 (Availability) · §9 (Procurement)
  // ==================================================================
  PCG.api.getInventoryConflicts = PCG.api.getInventoryConflicts || (() => {
    return (PCG.engines && PCG.engines.availability && PCG.engines.availability.conflicts)
      ? PCG.engines.availability.conflicts()
      : [];
  });

  PCG.api.getSubstitutionProposals = (filter) => {
    let list = (PCG.substitutionProposals||[]).slice().reverse();
    if(filter && filter.showId) list = list.filter(s=>s.showId===filter.showId);
    if(filter && filter.status) list = list.filter(s=>s.status===filter.status);
    return list;
  };

  PCG.api.proposeSubstitution = (payload) => {
    PCG.requireAny(G.ADMIN, G.TSMS, G.WH_SUPERVISORS, G.DIRECTORS);
    PCG.substitutionProposals = PCG.substitutionProposals || [];
    const orig = PCG.api.getInventoryItem(payload.originalItemId);
    const sub  = PCG.api.getInventoryItem(payload.substituteItemId);
    const costOrig = (orig && orig.rates && orig.rates.day) || 0;
    const costSub  = (sub  && sub.rates  && sub.rates.day ) || 0;
    const delta = (costSub - costOrig) * (payload.qty || 1);
    const p = {
      id:'subprop.'+Math.random().toString(36).slice(2,8),
      showId: payload.showId,
      originalItemId: payload.originalItemId,
      originalName: orig ? orig.name : payload.originalItemId,
      substituteItemId: payload.substituteItemId,
      substituteName: sub ? sub.name : payload.substituteItemId,
      qty: payload.qty || 1,
      reason: payload.reason || '',
      costDelta: delta,
      status:'Proposed',
      requiresApproval: (delta > 0) ? 'AE-or-Director' : 'PM',
      proposedById: PCG.user.id, proposedAt: new Date().toISOString(),
      approvedById: null, approvedAt: null
    };
    PCG.substitutionProposals.push(p);
    // Create a WorkItem for the PM so they see it in the action queue
    PCG.workItems = PCG.workItems || [];
    PCG.workItems.push({
      id:'wi.'+Math.random().toString(36).slice(2,8),
      type:'SubstitutionApproval',
      ownerId: (function(){ const proj = (PCG.projects||[]).find(x=>x.code===payload.showId); return proj && proj.pmId; })(),
      priority: delta > 0 ? 'High' : 'Medium',
      status:'Open',
      entityRef: p.id,
      title: `Approve substitution: ${p.originalName} → ${p.substituteName}`,
      detail: `Qty ${p.qty} · ${delta===0?'transparent':delta>0?'+'+delta:delta} cost delta`,
      createdAt: p.proposedAt
    });
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:p.proposedAt, actor:PCG.user.id, action:'eqlpc.substitution.propose',
      entityId:p.id, detail:`${p.originalName} → ${p.substituteName} on ${payload.showId}` });
    PCG.engines.notify.emit('SubstitutionProposed', { id:p.id, showId:payload.showId });
    return { ok:true, proposal:p };
  };

  PCG.api.approveSubstitution = (proposalId) => {
    PCG.requireAny(G.ADMIN, G.DIRECTORS, G.AE);
    const p = (PCG.substitutionProposals||[]).find(x=>x.id===proposalId);
    if(!p) return { ok:false };
    p.status = 'Approved';
    p.approvedById = PCG.user.id;
    p.approvedAt = new Date().toISOString();
    const wi = (PCG.workItems||[]).find(w=>w.entityRef===p.id);
    if(wi) wi.status = 'Closed';
    return { ok:true, proposal:p };
  };

  PCG.api.draftSubRentalFromDeficit = (payload) => {
    PCG.requireAny(G.ADMIN, G.TSMS, G.WH_SUPERVISORS, G.DIRECTORS);
    PCG.subRentals = PCG.subRentals || [];
    const inv = PCG.api.getInventoryItem(payload.itemId);
    const estCost = (inv && inv.rates && inv.rates.week) ? inv.rates.week * payload.qty * 0.8 : 0;
    const proj = (PCG.projects||[]).find(p=>p.code===payload.showId);
    const rpo = {
      id:'rpo.'+Math.random().toString(36).slice(2,8),
      projectCode: payload.showId, showId: payload.showId,
      vendorId: payload.vendorId || null,
      vendorName: payload.vendorName || 'TBD — assign vendor',
      itemId: payload.itemId,
      itemDescription: (inv ? inv.name : payload.itemId) + (payload.qty>1?` (${payload.qty} units)`:''),
      qty: payload.qty || 1,
      fromDate: (proj && proj.dates) ? proj.dates.loadIn : null,
      toDate:   (proj && proj.dates) ? (proj.dates.ret || proj.dates.loadOut) : null,
      quotedCost: Math.round(estCost),
      holdExpiry: new Date(Date.now() + 3*24*3600*1000).toISOString(),
      status:'Draft', vendorRef:null, invoiceAmount:null,
      createdById: PCG.user.id, createdAt: new Date().toISOString()
    };
    PCG.subRentals.push(rpo);
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:rpo.createdAt, actor:PCG.user.id, action:'eqlpc.rpo.draft',
      entityId:rpo.id, detail:`Drafted RPO for ${rpo.itemDescription} on ${payload.showId}` });
    PCG.engines.notify.emit('SubRentalDrafted', { id:rpo.id, showId:payload.showId });
    return { ok:true, subRental:rpo };
  };

  // ==================================================================
  // FINAL SPEC §RR + §WW — Elite Pitch System
  // Replaces PowerPoint + PDF proposals. Section-based, shareable-link,
  // engagement-tracked, A/B options, comment thread, version diff.
  // Same link evolves: Pitch → Quote → Approval → Portal.
  // ==================================================================
  PCG.api.getPitches = (filter) => {
    let list = (PCG.pitches||[]).slice();
    if(filter && filter.clientId) list = list.filter(p => p.clientId === filter.clientId);
    if(filter && filter.status)   list = list.filter(p => p.status === filter.status);
    if(filter && filter.aeId)     list = list.filter(p => p.aeId === filter.aeId);
    return list.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
  };

  PCG.api.getPitch = (id) => {
    if(id && id.startsWith('PT-')){
      // Lookup by share token (client-side link)
      return (PCG.pitches||[]).find(p => p.shareToken === id) || null;
    }
    return (PCG.pitches||[]).find(p => p.id === id) || null;
  };

  PCG.api.createPitch = (fields) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN);
    PCG.pitches = PCG.pitches || [];
    const p = Object.assign({
      id:'pitch.'+Math.random().toString(36).slice(2,8),
      pitchNo:'PCG-PT-' + new Date().getFullYear() + '-' + String((PCG.pitches.length+1)).padStart(3,'0'),
      aeId: PCG.user.id,
      createdAt: new Date().toISOString(),
      status:'Draft',
      currentVersion:1,
      shareToken:null,
      engagementEvents:[],
      comments:[],
      sections:[
        { id:'sec.ov',  type:'Overview',     title:'Overview',      body:'' },
        { id:'sec.sd',  type:'System Design',title:'System Design', body:'' },
        { id:'sec.sch', type:'Schedule',     title:'Schedule',      body:'' },
        { id:'sec.opt', type:'Options',      title:'Options' },
        { id:'sec.pri', type:'Pricing',      title:'Investment',    body:'' },
        { id:'sec.cta', type:'CTA',          title:'Next Steps',    body:'Accept pitch → generate line-item quote.' }
      ],
      options:[],
      versionHistory:[{ v:1, at:new Date().toISOString(), author: PCG.user.id, change:'Draft created' }]
    }, fields);
    PCG.pitches.push(p);
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:p.createdAt, actor:PCG.user.id, action:'pitch.create', entityId:p.id, detail:p.projectIdea||''  });
    return { ok:true, pitch:p };
  };

  PCG.api.updatePitchSection = (pitchId, sectionId, fields) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN);
    const p = (PCG.pitches||[]).find(x => x.id===pitchId); if(!p) return { ok:false };
    const s = (p.sections||[]).find(x => x.id===sectionId); if(!s) return { ok:false };
    Object.assign(s, fields);
    // Bump version on body change
    if(fields.body !== undefined){
      p.currentVersion = (p.currentVersion||1) + 1;
      p.versionHistory = p.versionHistory || [];
      p.versionHistory.push({ v:p.currentVersion, at:new Date().toISOString(), author:PCG.user.id, change:`Edited "${s.title}"` });
    }
    return { ok:true, section:s, version:p.currentVersion };
  };

  PCG.api.issuePitch = (pitchId) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN);
    const p = (PCG.pitches||[]).find(x => x.id===pitchId); if(!p) return { ok:false };
    if(!p.shareToken) p.shareToken = 'PT-' + Math.random().toString(36).slice(2,8).toUpperCase();
    p.status = 'Issued';
    p.issuedAt = new Date().toISOString();
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:p.issuedAt, actor:PCG.user.id, action:'pitch.issue', entityId:p.id,
      detail:`Share link issued · ${p.shareToken}` });
    PCG.engines.notify.emit('PitchIssued', { id:p.id, token:p.shareToken });
    return { ok:true, pitch:p, url:`pitch-view.html?token=${p.shareToken}` };
  };

  PCG.api.convertPitchToQuote = (pitchId) => {
    PCG.requireAny(G.AE, G.AE_NO_CONFIRM, G.DIRECTORS, G.ADMIN);
    const p = (PCG.pitches||[]).find(x => x.id===pitchId); if(!p) return { ok:false, reason:'Pitch not found' };
    if(p.convertedQuoteId) return { ok:false, reason:'Already converted', quoteId:p.convertedQuoteId };
    p.status = 'Accepted';
    p.acceptedAt = p.acceptedAt || new Date().toISOString();
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id, action:'pitch.convert', entityId:pitchId });
    return { ok:true, pitch:p };
  };

  // Engagement tracking — writes from client-facing pitch view.
  // Event types: Opened | SectionViewed | TimeSpent | OptionSelected | CommentAdded | CTAClicked
  PCG.api.recordPitchEngagement = (pitchShareToken, event) => {
    const p = (PCG.pitches||[]).find(x => x.shareToken === pitchShareToken);
    if(!p) return { ok:false };
    p.engagementEvents = p.engagementEvents || [];
    const e = Object.assign({ at: new Date().toISOString() }, event);
    p.engagementEvents.push(e);
    // Auto-advance status: first open → "Opened"
    if(event.type === 'Opened' && p.status === 'Issued') p.status = 'Opened';
    return { ok:true, event:e };
  };

  PCG.api.postPitchComment = (pitchShareToken, payload) => {
    const p = (PCG.pitches||[]).find(x => x.shareToken === pitchShareToken);
    if(!p) return { ok:false };
    p.comments = p.comments || [];
    const cmt = {
      id:'cmt.'+Math.random().toString(36).slice(2,8),
      at: new Date().toISOString(),
      sectionId: payload.sectionId,
      fromSide: payload.fromSide || 'client',
      fromName: payload.fromName || 'Client',
      body: payload.body || ''
    };
    p.comments.push(cmt);
    // Also log as engagement event
    p.engagementEvents = p.engagementEvents || [];
    p.engagementEvents.push({ at:cmt.at, type:'CommentAdded', sectionId:cmt.sectionId, meta:{ body:cmt.body.slice(0,120) } });
    PCG.engines.notify.emit('PitchCommentAdded', { pitchId:p.id, commentId:cmt.id, fromSide:cmt.fromSide });
    return { ok:true, comment:cmt };
  };

  PCG.api.selectPitchOption = (pitchShareToken, optionId) => {
    const p = (PCG.pitches||[]).find(x => x.shareToken === pitchShareToken);
    if(!p) return { ok:false };
    p.selectedOptionId = optionId;
    p.engagementEvents = p.engagementEvents || [];
    p.engagementEvents.push({ at: new Date().toISOString(), type:'OptionSelected', sectionId:'sec.opt', meta:{ optionId } });
    PCG.engines.notify.emit('PitchOptionSelected', { pitchId:p.id, optionId });
    return { ok:true, selectedOptionId: optionId };
  };

  PCG.api.clickPitchCTA = (pitchShareToken, action) => {
    const p = (PCG.pitches||[]).find(x => x.shareToken === pitchShareToken);
    if(!p) return { ok:false };
    p.engagementEvents = p.engagementEvents || [];
    p.engagementEvents.push({ at: new Date().toISOString(), type:'CTAClicked', sectionId:'sec.cta', meta:{ action } });
    if(action === 'Accept') {
      p.status = 'Accepted';
      p.acceptedAt = new Date().toISOString();
      PCG.auditLog = PCG.auditLog || [];
      PCG.auditLog.push({ at:p.acceptedAt, actor:'client', action:'pitch.accept', entityId:p.id });
      PCG.engines.notify.emit('PitchAccepted', { pitchId:p.id });
    }
    return { ok:true, status:p.status };
  };

  // Engagement summary — aggregates all events for the pitch dashboard
  PCG.api.getPitchEngagementSummary = (pitchId) => {
    const p = PCG.api.getPitch(pitchId);
    if(!p) return null;
    const events = p.engagementEvents || [];
    const sectionDurations = {};
    let opens = 0, comments = 0, optionSelections = 0, ctaClicks = 0;
    events.forEach(e => {
      if(e.type === 'Opened') opens++;
      if(e.type === 'CommentAdded') comments++;
      if(e.type === 'OptionSelected') optionSelections++;
      if(e.type === 'CTAClicked') ctaClicks++;
      if(e.type === 'SectionViewed' && e.sectionId && e.meta && e.meta.durationSec){
        sectionDurations[e.sectionId] = (sectionDurations[e.sectionId]||0) + e.meta.durationSec;
      }
    });
    const rankedSections = Object.entries(sectionDurations)
      .map(([id, dur]) => {
        const sec = (p.sections||[]).find(s=>s.id===id);
        return { sectionId:id, title: sec ? sec.title : id, durationSec: dur };
      })
      .sort((a,b) => b.durationSec - a.durationSec);
    const skipped = (p.sections||[])
      .filter(s => !sectionDurations[s.id])
      .map(s => ({ sectionId:s.id, title:s.title }));
    const firstOpen = events.find(e => e.type==='Opened');
    const lastEvent = events[events.length-1];
    return {
      pitchId: p.id,
      opens,
      commentCount: comments,
      optionSelections,
      ctaClicks,
      selectedOptionId: p.selectedOptionId || null,
      firstOpenedAt: firstOpen ? firstOpen.at : null,
      lastActivityAt: lastEvent ? lastEvent.at : null,
      mostViewedSection: rankedSections[0] || null,
      sectionsByTime: rankedSections,
      skippedSections: skipped,
      totalEvents: events.length
    };
  };

  // ==================================================================
  // FINAL SPEC §LL — Workbox + Kit Rebuild scan API
  // ==================================================================
  PCG.api.getWorkboxes = (filter) => {
    let list = (PCG.workboxes||[]).slice();
    if(filter && filter.department) list = list.filter(w => w.department === filter.department);
    if(filter && filter.warehouseId) list = list.filter(w => w.currentLocationId === filter.warehouseId);
    if(filter && filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(w => w.barcode.toLowerCase().includes(q) || w.name.toLowerCase().includes(q));
    }
    // Compute shortage summary
    return list.map(w => {
      const shortage = (w.standardPack||[]).filter(p => p.currentQty < p.standardQty).length;
      const needed = (w.standardPack||[]).reduce((s, p) => s + Math.max(0, p.standardQty - p.currentQty), 0);
      return Object.assign({}, w, { shortage, needed });
    });
  };

  PCG.api.getWorkbox = (id) => {
    const w = (PCG.workboxes||[]).find(x => x.id === id);
    if(!w) return null;
    const shortage = (w.standardPack||[]).filter(p => p.currentQty < p.standardQty).length;
    const needed = (w.standardPack||[]).reduce((s, p) => s + Math.max(0, p.standardQty - p.currentQty), 0);
    return Object.assign({}, w, { shortage, needed });
  };

  // Find workbox by barcode scan (or by fuzzy match on name)
  PCG.api.findWorkboxByBarcode = (code) => {
    const c = String(code || '').toUpperCase().trim();
    if(!c) return null;
    return (PCG.workboxes||[]).find(w => w.barcode === c) || null;
  };

  // Scan an item INTO a workbox (increments current qty for a pack-list item)
  PCG.api.scanItemIntoWorkbox = (workboxId, itemNameOrBarcode, qty) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.WH_TECHS, G.TSMS);
    const w = (PCG.workboxes||[]).find(x => x.id === workboxId);
    if(!w) return { ok:false, reason:'Workbox not found' };
    const q = qty || 1;
    // Try exact pack-list match first
    const needle = String(itemNameOrBarcode || '').trim();
    const needleLower = needle.toLowerCase();
    const packItem = (w.standardPack||[]).find(p => p.item.toLowerCase().includes(needleLower) || (p.modelId && p.modelId === needle));
    if(packItem) {
      const short = packItem.standardQty - packItem.currentQty;
      packItem.currentQty = Math.min(packItem.standardQty, packItem.currentQty + q);
      const newShort = packItem.standardQty - packItem.currentQty;
      return { ok:true, matchKind:'PackItem', item:packItem, addedQty:short - newShort, stillShort:newShort, wasShort: short };
    }
    // Not in pack list — log as unexpected
    w.unexpectedScans = w.unexpectedScans || [];
    w.unexpectedScans.push({ at: new Date().toISOString(), code: needle, qty: q });
    return { ok:true, matchKind:'Unexpected', code: needle };
  };

  // Scan a serialized item into a workbox
  PCG.api.scanSerialIntoWorkbox = (workboxId, serialOrBarcode) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.WH_TECHS, G.TSMS);
    const w = (PCG.workboxes||[]).find(x => x.id === workboxId);
    if(!w) return { ok:false, reason:'Workbox not found' };
    const code = String(serialOrBarcode || '').toUpperCase().trim();
    const serial = (PCG.inventorySerials||[]).find(s => s.serial === code || s.barcode === code);
    if(!serial) return { ok:false, reason:'Serial not found in inventory', code };
    w.serialsFound = w.serialsFound || [];
    if(w.serialsFound.includes(serial.serial)) return { ok:true, matchKind:'Duplicate', serial };
    w.serialsFound.push(serial.serial);
    const wasExpected = (w.serialsExpected||[]).includes(serial.serial);
    // Update serial location to this container
    serial.currentLocationId = w.containerRef;
    return { ok:true, matchKind: wasExpected ? 'Expected' : 'Unexpected', serial };
  };

  PCG.api.markWorkboxComplete = (workboxId) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.TSMS);
    const w = (PCG.workboxes||[]).find(x => x.id === workboxId);
    if(!w) return { ok:false };
    w.status = 'Restocked';
    w.restockedAt = new Date().toISOString();
    w.restockedById = PCG.user.id;
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:w.restockedAt, actor:PCG.user.id, action:'workbox.restock',
      entityId:w.id, detail:`${w.name} restocked to standard` });
    return { ok:true, workbox:w };
  };

  // --- Kit Rebuild scan API ---
  PCG.api.getKitRebuildTasks = (filter) => {
    let list = (PCG.kitRebuildTasks||[]).slice();
    if(filter && filter.status) list = list.filter(t => t.status === filter.status);
    if(filter && filter.showId) list = list.filter(t => t.showId === filter.showId);
    return list;
  };

  PCG.api.openKitRebuild = (taskId, containerBarcode) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.WH_TECHS, G.TSMS);
    const t = (PCG.kitRebuildTasks||[]).find(x => x.id === taskId);
    if(!t) return { ok:false, reason:'Rebuild task not found' };
    const code = String(containerBarcode || '').toUpperCase().trim();
    if(code !== t.destinationContainerBarcode) {
      return { ok:false, reason:'Wrong container · expected '+t.destinationContainerBarcode+', got '+code };
    }
    t.destinationContainerOpen = true;
    t.status = t.status === 'Pending' ? 'InProgress' : t.status;
    t.openedAt = new Date().toISOString();
    t.openedById = PCG.user.id;
    return { ok:true, task:t };
  };

  PCG.api.scanComponentIntoKit = (taskId, componentBarcode) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.WH_TECHS, G.TSMS);
    const t = (PCG.kitRebuildTasks||[]).find(x => x.id === taskId);
    if(!t) return { ok:false, reason:'Rebuild task not found' };
    if(!t.destinationContainerOpen) return { ok:false, reason:'Scan destination container first' };
    const code = String(componentBarcode || '').toUpperCase().trim();
    const serial = (PCG.inventorySerials||[]).find(s => s.serial === code || s.barcode === code);
    const sd = (PCG.systemDefinitions||[]).find(x => x.id === t.sysDefId);

    if(serial) {
      if(t.scannedSerials.includes(serial.serial)) return { ok:true, matchKind:'Duplicate', serial };
      t.scannedSerials.push(serial.serial);
      // Check if this serial's model is part of BOM
      const bom = (sd.requiredComponents||[]).find(c => c.modelId === serial.itemId);
      if(bom) {
        t.scanned[serial.itemId] = (t.scanned[serial.itemId] || 0) + 1;
        return { ok:true, matchKind:'BOM_Match', serial, bomEntry: bom, newScannedQty: t.scanned[serial.itemId] };
      }
      // Not part of BOM
      t.unexpectedScans = t.unexpectedScans || [];
      t.unexpectedScans.push({ at:new Date().toISOString(), serial: serial.serial, modelId: serial.itemId, note:'Not in BOM' });
      return { ok:true, matchKind:'Unexpected', serial };
    }

    // Non-serialized — try model lookup
    const inv = (PCG.inventory||[]).find(i => i.id === code || i.model === code);
    if(inv) {
      const bom = (sd.requiredComponents||[]).find(c => c.modelId === inv.id);
      if(bom) {
        t.scanned[inv.id] = (t.scanned[inv.id] || 0) + 1;
        return { ok:true, matchKind:'BOM_Match', inventoryModel: inv, bomEntry: bom, newScannedQty: t.scanned[inv.id] };
      }
    }
    t.unexpectedScans = t.unexpectedScans || [];
    t.unexpectedScans.push({ at:new Date().toISOString(), code, note:'Not found in inventory' });
    return { ok:false, matchKind:'NotFound', code };
  };

  PCG.api.markKitComplete = (taskId, acceptPartial) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.TSMS);
    const t = (PCG.kitRebuildTasks||[]).find(x => x.id === taskId);
    if(!t) return { ok:false };
    const sd = (PCG.systemDefinitions||[]).find(x => x.id === t.sysDefId);
    const required = sd ? (sd.requiredComponents||[]) : [];
    const missing = required.filter(c => (t.scanned[c.modelId] || 0) < c.qty);
    if(missing.length > 0 && !acceptPartial){
      return { ok:false, reason:'Components still short', missing };
    }
    t.status = missing.length ? 'PartialKit' : 'Complete';
    t.completedAt = new Date().toISOString();
    t.completedById = PCG.user.id;
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:t.completedAt, actor:PCG.user.id, action:'kit.rebuild.'+t.status.toLowerCase(),
      entityId:t.id, detail:`${sd?sd.name:t.sysDefId} · ${missing.length} short` });
    if(missing.length){
      // Flag SystemDefinition as partial-availability
      if(sd) sd.partialKitStatus = true;
      PCG.engines.notify.emit('PartialKitFlagged', { taskId, sysDefId: t.sysDefId });
    }
    return { ok:true, task:t, missing };
  };

  // Stage concepts library (pulls from real PCG Miyra/Marquee/Lumen/Nova concepts)
  PCG.api.getStageConcepts = () => (PCG.stageConcepts||[]).slice();
  PCG.api.getStageConcept  = (id) => (PCG.stageConcepts||[]).find(c=>c.id===id);

  // Vendor library (§DD) — vendor quality + preferred-vendor recommendations
  PCG.api.getVendors = (filter) => {
    let list = (PCG.vendors||[]).slice();
    if(filter && filter.category) list = list.filter(v => v.category===filter.category || (v.preferredFor||[]).includes(filter.category));
    if(filter && filter.preferredOnly) list = list.filter(v => v.qualityScore >= 4.5);
    return list.sort((a,b) => (b.qualityScore||0) - (a.qualityScore||0));
  };
  PCG.api.getVendor = (id) => (PCG.vendors||[]).find(v => v.id===id) || null;
  PCG.api.recommendVendorForItem = (itemId) => {
    const inv = PCG.api.getInventoryItem(itemId); if(!inv) return [];
    const cat = (PCG.inventoryCategories||[]).find(c=>c.id===inv.categoryId);
    const dept = cat ? cat.department : 'Multi';
    return (PCG.vendors||[])
      .filter(v => (v.preferredFor||[]).includes(dept) || v.category===dept || v.category==='Multi')
      .sort((a,b) => (b.qualityScore||0) - (a.qualityScore||0))
      .slice(0, 3);
  };

  // ==================================================================
  // v2.X — CreativeRequest create (replaces fake notImpl on creative.html)
  // Spec §24
  // ==================================================================
  PCG.api.createCreativeRequest = (payload) => {
    PCG.requireAny(G.ADMIN, G.DIRECTORS, G.AE, G.AE_NO_CONFIRM);
    PCG.creativeRequests = PCG.creativeRequests || [];
    const r = {
      id:'cr.'+Math.random().toString(36).slice(2,8),
      projectId: payload.projectId,
      requestedById: PCG.user.id,
      requestedAt: new Date().toISOString(),
      type: payload.type || 'Graphic',
      description: payload.description || '',
      clientApprovalRequired: !!payload.clientApprovalRequired,
      deadline: payload.deadline || null,
      fabricationStatus: 'Pending',
      status:'Draft',
      attachments:[]
    };
    PCG.creativeRequests.push(r);
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:r.requestedAt, actor:PCG.user.id, action:'creative.request.create',
      entityId:r.id, detail:`${r.type} · ${r.projectId}` });
    PCG.engines.notify.emit('CreativeRequestCreated', { id:r.id, projectId:payload.projectId });
    return { ok:true, request:r };
  };

  // ==================================================================
  // v2.X — Travel record create (replaces fake notImpl on travel.html)
  // Spec §13
  // ==================================================================
  PCG.api.createTravelRecord = (payload) => {
    PCG.requireAny(G.ADMIN, G.SCHEDULING, G.DIRECTORS);
    PCG.travelRecords = PCG.travelRecords || [];
    const t = {
      id:'tr.'+Math.random().toString(36).slice(2,8),
      crewMemberId: payload.crewMemberId,
      showId: payload.showId,
      departureCity: payload.departureCity || '',
      arrivalCity: payload.arrivalCity || '',
      departureTime: payload.departureTime || null,
      arrivalTime: payload.arrivalTime || null,
      airline: payload.airline || null,
      flightConfirmation: payload.flightConfirmation || null,
      hotelName: payload.hotelName || null,
      hotelConfirmation: payload.hotelConfirmation || null,
      perDiemRate: payload.perDiemRate || 75,
      perDiemDays: payload.perDiemDays || 0,
      perDiemReimbursementSource: payload.perDiemReimbursementSource || 'Expense Report',
      createdById: PCG.user.id,
      createdAt: new Date().toISOString()
    };
    PCG.travelRecords.push(t);
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:t.createdAt, actor:PCG.user.id, action:'travel.create',
      entityId:t.id, detail:`${payload.crewMemberId} · ${payload.showId}` });
    return { ok:true, travel:t };
  };

  PCG.api.exportTravelCSV = (showId) => {
    PCG.requireAny(G.ADMIN, G.SCHEDULING, G.DIRECTORS, G.ACCOUNTING);
    const list = (PCG.travelRecords||[]).filter(t => !showId || showId === 'all' || t.showId === showId);
    const rows = [
      ['Crew','Show','Route','Departure','Arrival','Airline','Flight','Hotel','Hotel Conf','Per Diem $/day','Per Diem Days','Reimbursement Source']
    ];
    list.forEach(t => {
      const crew = PCG.findPerson(t.crewMemberId);
      rows.push([
        crew?crew.name:t.crewMemberId,
        t.showId,
        `${t.departureCity||'—'} → ${t.arrivalCity||'—'}`,
        t.departureTime || '',
        t.arrivalTime || '',
        t.airline || '',
        t.flightConfirmation || '',
        t.hotelName || '',
        t.hotelConfirmation || '',
        t.perDiemRate || '',
        t.perDiemDays || '',
        t.perDiemReimbursementSource || ''
      ]);
    });
    const csv = rows.map(r => r.map(c => {
      const s = String(c==null?'':c);
      return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
    }).join(',')).join('\n');
    return { ok:true, csv, count: list.length };
  };

  // ==================================================================
  // FINAL SPEC §II — Touring / Multi-City Operational System
  // ==================================================================
  PCG.api.getTours = () => (PCG.tours||[]).slice().map(t => {
    // Redact cost/margin for non-T2 viewers
    const copy = JSON.parse(JSON.stringify(t));
    if(!PCG.canSeeTier('T2_MARGINS') && copy.budgetSummary){
      delete copy.budgetSummary.totalQuotedCost;
      delete copy.budgetSummary.estimatedMargin;
    }
    return copy;
  });

  PCG.api.getTour = (id) => {
    const t = (PCG.tours||[]).find(x=>x.id===id);
    if(!t) return null;
    const copy = JSON.parse(JSON.stringify(t));
    if(!PCG.canSeeTier('T2_MARGINS') && copy.budgetSummary){
      delete copy.budgetSummary.totalQuotedCost;
      delete copy.budgetSummary.estimatedMargin;
    }
    return copy;
  };

  PCG.api.getTourStops = (tourId) =>
    (PCG.tourStops||[]).filter(s => !tourId || s.tourId === tourId)
      .slice().sort((a,b) => a.stopNumber - b.stopNumber);

  PCG.api.getTourStop = (id) => (PCG.tourStops||[]).find(s => s.id === id);

  PCG.api.getTourRoute = (tourId) => (PCG.tourRoutes||[]).find(r => r.tourId === tourId) || null;

  PCG.api.getTourInventoryPackage = (tourId) =>
    (PCG.tourInventoryPackages||[]).find(p => p.tourId === tourId) || null;

  PCG.api.getTourCrewPackage = (tourId) =>
    (PCG.tourCrewPackages||[]).find(p => p.tourId === tourId) || null;

  PCG.api.getTourLogisticsPlan = (tourId) =>
    (PCG.tourLogisticsPlans||[]).find(p => p.tourId === tourId) || null;

  // Tour financial summary — computed from stop projects
  PCG.api.getTourFinancialSummary = (tourId) => {
    const tour = PCG.api.getTour(tourId);
    if(!tour) return null;
    const stops = PCG.api.getTourStops(tourId);
    const stopFins = stops.map(s => {
      const proj = (PCG.projects||[]).find(p => p.code === s.linkedProjectId);
      const quote = (PCG.quotes||[]).find(q => q.projectCode === s.linkedProjectId);
      return {
        stopId: s.id, city: s.city,
        quotedRevenue: (quote && quote.totalRevenue) || 0,
        actualRevenue: s.stopStatus === 'Complete' ? ((quote && quote.totalRevenue) || 0) : 0,
        margin: (quote && PCG.canSeeTier('T2_MARGINS')) ? quote.margin : null,
        status: s.stopStatus
      };
    });
    const totalQuotedRevenue = stopFins.reduce((s,x)=>s+(x.quotedRevenue||0),0);
    const totalActualRevenue = stopFins.reduce((s,x)=>s+(x.actualRevenue||0),0);
    return {
      tourId, stops: stopFins,
      totalQuotedRevenue,
      totalActualRevenue,
      totalTravelCost: (tour.budgetSummary && tour.budgetSummary.travelBudget) || 0,
      totalFreightCost: (tour.budgetSummary && tour.budgetSummary.freightBudget) || 0,
      overallMargin: PCG.canSeeTier('T2_MARGINS') && tour.budgetSummary ? tour.budgetSummary.estimatedMargin : null
    };
  };

  // Create Tour Stop ROS — clones the master template into a new RunOfShow
  PCG.api.createStopROS = (stopId) => {
    PCG.requireAny(G.ADMIN, G.DIRECTORS, G.TSMS);
    const stop = PCG.api.getTourStop(stopId); if(!stop) return { ok:false, reason:'Stop not found' };
    const tour = PCG.api.getTour(stop.tourId);
    PCG.runOfShows = PCG.runOfShows || [];
    const existing = PCG.runOfShows.find(r => r.showId === stop.linkedProjectId);
    if(existing) return { ok:true, ros: existing, alreadyExisted:true };
    // Clone master template — for demo we use a simple scaffold
    const ros = {
      id:'ros.'+Math.random().toString(36).slice(2,8),
      showId: stop.linkedProjectId,
      clonedFromTemplateId: tour ? tour.masterROSTemplateId : null,
      createdAt: new Date().toISOString(),
      cues: [
        { cueNumber: 1, name:'Pre-Show Hold', durationMin: 30, department:['production'], notes:'House open. Walkin music playing.' },
        { cueNumber: 2, name:'Welcome & Opening Video', durationMin: 4,  department:['video','audio'], notes:'Video package rolls. Lights out on audience.' },
        { cueNumber: 3, name:'Keynote — Brand Vision', durationMin: 25, department:['audio','video','lighting'], notes:'Clip at 8:30 mark. Q&A skip-ready.' },
        { cueNumber: 4, name:'Reveal Moment', durationMin: 6, department:['video','audio','lighting','scenic'], notes:'LED reveal sequence. Full audio build.' },
        { cueNumber: 5, name:'Dealer Dialogue Panel', durationMin: 40, department:['audio','video'], notes:'4 wireless HH + 1 podium.' },
        { cueNumber: 6, name:'Close & Cocktail Reception Cue', durationMin: 8, department:['audio','lighting'], notes:'Music transition. House lights up full.' }
      ],
      status:'Draft'
    };
    PCG.runOfShows.push(ros);
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at: ros.createdAt, actor: PCG.user.id, action:'tour.stop.ros.create',
      entityId: ros.id, detail:`Cloned master template for stop ${stop.city}` });
    return { ok:true, ros };
  };

  PCG.api.getRunOfShow = (showId) => (PCG.runOfShows||[]).find(r => r.showId === showId);

  PCG.api.advanceStopStatus = (stopId, toStatus) => {
    PCG.requireAny(G.ADMIN, G.DIRECTORS, G.TSMS);
    const s = (PCG.tourStops||[]).find(x=>x.id===stopId);
    if(!s) return { ok:false };
    const prev = s.stopStatus;
    s.stopStatus = toStatus;
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at: new Date().toISOString(), actor: PCG.user.id,
      action:'tour.stop.status', entityId: stopId, detail: `${prev} → ${toStatus}` });
    return { ok:true, stop:s };
  };

  PCG.api.addStopIssue = (stopId, summary, severity) => {
    PCG.requireAny(G.ADMIN, G.DIRECTORS, G.TSMS, G.AE);
    const s = (PCG.tourStops||[]).find(x=>x.id===stopId);
    if(!s) return { ok:false };
    s.issues = s.issues || [];
    const issue = {
      id:'is.'+Math.random().toString(36).slice(2,8),
      at: new Date().toISOString(), summary,
      severity: severity || 'minor',
      reportedById: PCG.user.id
    };
    s.issues.push(issue);
    return { ok:true, issue };
  };

  // Day types — compute calendar of tour days from stops + route legs
  PCG.api.getTourDayCalendar = (tourId) => {
    const tour = PCG.api.getTour(tourId);
    const stops = PCG.api.getTourStops(tourId);
    const route = PCG.api.getTourRoute(tourId);
    if(!tour || !stops.length) return [];
    const days = {};
    const addDay = (date, type, context) => {
      const key = date.slice(0,10);
      days[key] = days[key] || { date: key, types: [], context: [] };
      if(!days[key].types.includes(type)) days[key].types.push(type);
      if(context) days[key].context.push(context);
    };
    stops.forEach(s => {
      addDay(s.loadInDate, 'Load-In', s.city);
      (s.showDates || []).forEach(d => addDay(d, 'Show', s.city));
      addDay(s.loadOutDate, 'Load-Out', s.city);
    });
    (route ? route.legs : []).forEach(leg => {
      const start = new Date(leg.departureDate).getTime();
      const end = new Date(leg.estimatedArrivalDate).getTime();
      for(let t = start; t <= end; t += 86400000){
        addDay(new Date(t).toISOString().slice(0,10), 'Travel',
          (stops.find(s=>s.id===leg.fromStopId)||{}).city + ' → ' + (stops.find(s=>s.id===leg.toStopId)||{}).city);
      }
    });
    return Object.values(days).sort((a,b)=>a.date.localeCompare(b.date));
  };

  // Availability override: TourInventoryItem models are blocked for tour date range
  const __originalCheckAvail = PCG.api.checkAvailability;
  PCG.api.checkAvailability = (req) => {
    const result = __originalCheckAvail(req);
    // Flag if any tour inventory package has this model committed through the window
    (PCG.tourInventoryPackages||[]).forEach(pkg => {
      const tour = (PCG.tours||[]).find(t => t.id === pkg.tourId);
      if(!tour) return;
      const overlaps = req.fromDate && req.toDate &&
        new Date(req.fromDate) <= new Date(tour.endDate) &&
        new Date(req.toDate)   >= new Date(tour.startDate);
      if(!overlaps) return;
      const item = (pkg.items||[]).find(i => i.modelId === req.itemId);
      if(!item) return;
      const projectCode = req.excludeShowId || req.projectCode;
      // Only flag if the requesting show is NOT a stop on this tour
      const isTourStopRequest = (PCG.tourStops||[]).some(s => s.tourId === tour.id && s.linkedProjectId === projectCode);
      if(isTourStopRequest) return;
      result.tourCommitment = {
        tourId: tour.id,
        tourName: tour.name,
        blockedThrough: tour.endDate
      };
      if(result.status === 'available' || result.status === 'partial'){
        result.status = 'partial';
        result.tourBlocked = item.qty;
      }
    });
    return result;
  };

  // ==================================================================
  // FINAL SPEC §J — Cycle Counts + Inventory Confidence
  // ==================================================================
  PCG.api.getCycleCounts = (filter) => {
    let list = (PCG.cycleCounts||[]).slice().sort((a,b) =>
      new Date(b.scheduledDate||0) - new Date(a.scheduledDate||0));
    if(filter && filter.status) list = list.filter(c => c.status === filter.status);
    if(filter && filter.warehouseId) list = list.filter(c => c.warehouseId === filter.warehouseId);
    return list;
  };

  PCG.api.getCycleCount = (id) => (PCG.cycleCounts||[]).find(c => c.id === id) || null;

  PCG.api.createCycleCount = (payload) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.TSMS, G.DIRECTORS);
    PCG.cycleCounts = PCG.cycleCounts || [];
    const countNo = 'CC-' + new Date().getFullYear() + '-' +
      String(PCG.cycleCounts.length + 40).padStart(4,'0');
    const c = {
      id:'cc.'+Math.random().toString(36).slice(2,8),
      countNumber: countNo,
      warehouseId: payload.warehouseId || 'wh.premier-main',
      countType: payload.countType || 'Spot',
      scope: payload.scope || { type:'All' },
      status:'Planned',
      assignedToId: payload.assignedToId || PCG.user.id,
      scheduledDate: payload.scheduledDate || new Date().toISOString().slice(0,10),
      startedAt: null, completedAt: null,
      approvedById: null, approvedAt: null,
      adjustmentsApplied: false,
      varianceSummary: null,
      notes: payload.notes || '',
      expectedLines: [], actualLines: [], varianceLines: []
    };
    // Seed expectedLines from scope + current balance
    const models = _resolveScope(payload.scope, payload.warehouseId);
    models.forEach(modelId => {
      const b = PCG.api.getInventoryBalance(modelId, payload.warehouseId);
      c.expectedLines.push({
        modelId, locationId: (b && b.warehouseId) || payload.warehouseId,
        expectedQty: (b && b.owned) || 0
      });
    });
    PCG.cycleCounts.push(c);
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:new Date().toISOString(), actor:PCG.user.id,
      action:'cycle.count.create', entityId:c.id, detail:`${c.countNumber} · ${c.countType}` });
    return { ok:true, cycleCount:c };
  };

  function _resolveScope(scope, warehouseId) {
    scope = scope || { type:'All' };
    const all = (PCG.inventory||[]).map(i => i.id);
    if(scope.type === 'All') return all;
    if(scope.type === 'Location') {
      // Map via serialized currentLocationId
      const modelsAtLoc = new Set();
      (PCG.inventorySerials||[]).forEach(s => {
        if((scope.locationIds||[]).includes(s.currentLocationId)) modelsAtLoc.add(s.itemId);
      });
      return Array.from(modelsAtLoc);
    }
    if(scope.type === 'Category') {
      return (PCG.inventory||[]).filter(i => (scope.categoryIds||[]).includes(i.categoryId)).map(i => i.id);
    }
    if(scope.type === 'Model') return scope.modelIds || [];
    return all;
  }

  PCG.api.submitCycleCountLine = (ccId, line) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.WH_TECHS, G.TSMS);
    const c = (PCG.cycleCounts||[]).find(x=>x.id===ccId);
    if(!c) return { ok:false };
    if(c.status==='Approved') return { ok:false, reason:'Count already approved' };
    c.status = 'InProgress';
    c.startedAt = c.startedAt || new Date().toISOString();
    const expected = c.expectedLines.find(e => e.modelId === line.modelId);
    const existing = c.actualLines.find(a => a.modelId === line.modelId);
    if(existing) {
      existing.countedQty = line.countedQty;
      existing.note = line.note || existing.note;
      existing.countedAt = new Date().toISOString();
    } else {
      c.actualLines.push({
        id:'ccl.'+Math.random().toString(36).slice(2,8),
        modelId: line.modelId,
        locationId: line.locationId || (expected && expected.locationId),
        expectedQty: (expected && expected.expectedQty) || 0,
        countedQty: line.countedQty,
        variance: line.countedQty - ((expected && expected.expectedQty) || 0),
        variancePct: ((expected && expected.expectedQty) > 0)
          ? (line.countedQty - expected.expectedQty) / expected.expectedQty
          : 0,
        countedById: PCG.user.id,
        countedAt: new Date().toISOString(),
        note: line.note || ''
      });
    }
    return { ok:true, cycleCount:c };
  };

  PCG.api.submitCycleCount = (ccId) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.WH_TECHS, G.TSMS);
    const c = (PCG.cycleCounts||[]).find(x=>x.id===ccId);
    if(!c) return { ok:false };
    c.status = 'PendingReview';
    c.completedAt = new Date().toISOString();
    c.varianceLines = (c.actualLines || []).filter(a => Math.abs(a.variance || 0) > 0);
    c.varianceSummary = {
      totalLines: c.actualLines.length,
      linesWithVariance: c.varianceLines.length,
      maxVariancePct: c.varianceLines.reduce((m,l)=>Math.max(m, Math.abs(l.variancePct||0)), 0)
    };
    return { ok:true, cycleCount:c };
  };

  PCG.api.approveCycleCountLine = (ccId, lineId, action, note) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.DIRECTORS);
    const c = (PCG.cycleCounts||[]).find(x=>x.id===ccId);
    if(!c) return { ok:false };
    const line = (c.varianceLines || c.actualLines).find(l => l.id===lineId);
    if(!line) return { ok:false, reason:'Line not found' };
    line.approvalAction = action;
    line.approvalNote = note || '';
    line.approvedAt = new Date().toISOString();
    line.approvedById = PCG.user.id;
    if(action === 'Accept') {
      // Write InventoryAdjustment
      PCG.inventoryAdjustments = PCG.inventoryAdjustments || [];
      PCG.inventoryAdjustments.push({
        id:'adj.'+Math.random().toString(36).slice(2,8),
        modelId: line.modelId, warehouseId: c.warehouseId, locationId: line.locationId,
        adjustmentType:'CycleCount',
        quantityBefore: line.expectedQty, quantityAfter: line.countedQty,
        quantityDelta: line.variance,
        reason: note || `Cycle count variance accepted (${c.countNumber})`,
        adjustedById: PCG.user.id, adjustedAt: line.approvedAt,
        cycleCountId: ccId,
        approvedById: PCG.user.id, approvedAt: line.approvedAt
      });
      // Adjust model qty
      const inv = (PCG.inventory||[]).find(i => i.id === line.modelId);
      if(inv) inv.qty = line.countedQty;
    }
    return { ok:true, line };
  };

  PCG.api.approveCycleCount = (ccId) => {
    PCG.requireAny(G.ADMIN, G.WH_SUPERVISORS, G.DIRECTORS);
    const c = (PCG.cycleCounts||[]).find(x=>x.id===ccId);
    if(!c) return { ok:false };
    const pending = (c.varianceLines||[]).filter(l => !l.approvalAction);
    if(pending.length) return { ok:false, reason:`${pending.length} variance line(s) still need review.` };
    c.status = 'Approved';
    c.approvedById = PCG.user.id;
    c.approvedAt = new Date().toISOString();
    c.adjustmentsApplied = true;
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at: c.approvedAt, actor: PCG.user.id, action:'cycle.count.approve',
      entityId: ccId, detail:`${c.countNumber} approved · ${c.varianceSummary?c.varianceSummary.linesWithVariance:0} variance(s)` });
    return { ok:true, cycleCount:c };
  };

  PCG.api.getInventoryAdjustments = (filter) => {
    let list = (PCG.inventoryAdjustments||[]).slice().reverse();
    if(filter && filter.modelId) list = list.filter(a => a.modelId === filter.modelId);
    if(filter && filter.type)    list = list.filter(a => a.adjustmentType === filter.type);
    return list;
  };

  // Inventory confidence — Trusted / Stale / Unverified based on last cycle count
  PCG.api.getInventoryConfidence = (modelId) => {
    const latestCount = (PCG.cycleCounts||[])
      .filter(c => c.status === 'Approved' &&
        (c.varianceLines||[]).some(l => l.modelId === modelId) ||
        (c.expectedLines||[]).some(e => e.modelId === modelId))
      .sort((a,b) => new Date(b.approvedAt||0) - new Date(a.approvedAt||0))[0];
    if(!latestCount) return { level:'Unverified', daysSinceCount:null };
    const days = Math.floor((Date.now() - new Date(latestCount.approvedAt).getTime()) / 86400000);
    const vLine = (latestCount.varianceLines||[]).find(l => l.modelId === modelId);
    const varPct = Math.abs((vLine && vLine.variancePct) || 0);
    if(varPct >= 0.05) return { level:'Discrepant', daysSinceCount: days, lastCountId: latestCount.id };
    if(days <= 30) return { level:'Trusted', daysSinceCount: days, lastCountId: latestCount.id };
    if(days <= 90) return { level:'Stale',   daysSinceCount: days, lastCountId: latestCount.id };
    return { level:'Unverified', daysSinceCount: days, lastCountId: latestCount.id };
  };

  // ==================================================================
  // v2.X — Real "create shift assignment" (replaces fake notImpl)
  // Spec §12.1 — Placeholder ShiftAssignment
  // ==================================================================
  PCG.api.createShiftAssignment = (payload) => {
    PCG.requireAny(G.ADMIN, G.SCHEDULING, G.DIRECTORS);
    const pos = (PCG.crewPositions||[]).find(p=>p.id===payload.positionId);
    const a = {
      id:'sa.'+Math.random().toString(36).slice(2,8),
      showId: payload.showId,
      crewMemberId: payload.crewMemberId || null,
      positionId: payload.positionId,
      positionGroup: pos ? (pos.department || 'Core') : 'Core',
      dates: payload.dates || [],
      callTime: payload.callTime || '07:00',
      status: payload.crewMemberId ? 'Invited' : 'Placeholder',
      invitedAt: payload.crewMemberId ? new Date().toISOString() : null,
      confirmedAt: null, acknowledgedAt: null,
      note: payload.notes || null,
      createdById: PCG.user.id,
      createdAt: new Date().toISOString()
    };
    if(payload.crewMemberId){
      const conflict = PCG.engines.scheduling.checkAssignment({
        crewMemberId: payload.crewMemberId, showId: payload.showId, dates: payload.dates
      });
      if(conflict.conflict) return { ok:false, reason:'Conflict', conflicts:conflict.conflicts };
    }
    PCG.shiftAssignments = PCG.shiftAssignments || [];
    PCG.shiftAssignments.push(a);
    PCG.auditLog = PCG.auditLog || [];
    PCG.auditLog.push({ at:a.createdAt, actor:PCG.user.id, action:'crew.shift.create',
      entityId:a.id, detail:`${pos?pos.name:payload.positionId} on ${payload.showId} · ${(payload.dates||[]).length} days` });
    PCG.engines.notify.emit('ShiftAssignmentCreated', { id:a.id, showId:payload.showId });
    return { ok:true, assignment:a };
  };

})();
