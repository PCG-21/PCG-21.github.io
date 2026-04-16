/* ==========================================================================
   PCG STAGE — Core System Services (Engines)
   §3 — Independent of any specific module. Defined contracts.
   ========================================================================== */
(function(){
  window.PCG = window.PCG || {};
  PCG.engines = PCG.engines || {};

  /* ========================================================================
     1. LIFECYCLE STATE MACHINE  — §3.3
     Every lifecycle-dependent module reads Show.lifecycleState before render.
     ======================================================================== */
  const STATES = ['Opportunity','Quoted','Awarded','InPrep','OnShow','Striking','Returning','Closing','Archived'];
  const FORWARD = {
    'Opportunity': ['Quoted'],
    'Quoted':      ['Awarded'],
    'Awarded':     ['InPrep','Quoted'],       // Quoted = admin reverse
    'InPrep':      ['OnShow','Awarded'],      // Awarded = admin reverse
    'OnShow':      ['Striking','InPrep'],     // InPrep = admin reverse (show cancelled mid-event)
    'Striking':    ['Returning'],
    'Returning':   ['Closing'],
    'Closing':     ['Archived'],
    'Archived':    []                         // terminal, never reverses
  };

  // Spec §3.3 — guard conditions. Return {ok:true} or {ok:false, reason, overrideBy?:[]}
  const GUARDS = {
    'Opportunity→Quoted': show => ({ ok:true }),
    'Quoted→Awarded': show => {
      const fail = [];
      const quote = PCG._rawGetActiveQuote(show.id);
      if(!quote || quote.status !== 'Issued') fail.push('Active QuoteRevision must be Issued');
      if(!show.pmId) fail.push('PM must be assigned');
      if(!show.clientId) fail.push('Client record required');
      return fail.length ? { ok:false, reasons:fail, overrideBy:[PCG.GROUPS.ADMIN] } : { ok:true };
    },
    'Awarded→InPrep': show => {
      const fail = [];
      if(!show.handoffChecklistComplete) fail.push('AE→PM handoff checklist must be complete');
      const pulls = PCG._rawGetPullSheets(show.id);
      if(!pulls || pulls.length===0) fail.push('At least one PullSheet must exist');
      return fail.length ? { ok:false, reasons:fail, overrideBy:[PCG.GROUPS.ADMIN] } : { ok:true };
    },
    'InPrep→OnShow': show => {
      const fail = [];
      const pulls = PCG._rawGetPullSheets(show.id) || [];
      const unFinalized = pulls.filter(p => p.status !== 'Finalized' && p.status !== 'Shipped');
      if(unFinalized.length) fail.push(`Pull sheets not Finalized: ${unFinalized.map(p=>p.department).join(', ')}`);
      const unauthorized = pulls.filter(p => p.status === 'Finalized' && !p.authorizedById);
      if(unauthorized.length) fail.push(`Walk-the-Pile missing: ${unauthorized.map(p=>p.department).join(', ')}`);
      if(!show.crewClockInListGeneratedAt) fail.push('Crew clock-in list must be generated');
      return fail.length ? { ok:false, reasons:fail, overrideBy:[PCG.GROUPS.TSMS, PCG.GROUPS.ADMIN], logRequired:true } : { ok:true };
    },
    'OnShow→Striking': show => ({ ok:true }),
    'Striking→Returning': show => ({ ok:true }),   // auto on manifest departure
    'Returning→Closing': show => {
      const fail = [];
      const scans = PCG._rawGetScans(show.id) || [];
      const expected = PCG._rawExpectedReturnScans(show.id) || 1;
      const pct = scans.filter(s=>s.direction==='return').length / Math.max(1,expected);
      if(pct < 0.9) fail.push(`Return scan ${Math.round(pct*100)}% — must be ≥ 90%`);
      const missing = PCG._rawMissingItems(show.id) || [];
      const unescalated = missing.filter(m => !m.escalatedAt);
      if(unescalated.length) fail.push(`${unescalated.length} missing item(s) not escalated`);
      return fail.length ? { ok:false, reasons:fail, overrideBy:[PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.ADMIN], logRequired:true } : { ok:true };
    },
    'Closing→Archived': show => {
      const fail = [];
      if(!show.closeoutSignedOffAt) fail.push('PM closeout sign-off missing');
      if(!show.laborActualsFinalizedAt) fail.push('Labor actuals not finalized');
      const openTix = (PCG._rawGetServiceTickets(show.id) || []).filter(t => t.status!=='Repaired' && t.status!=='Retired' && t.status!=='Deferred');
      if(openTix.length) fail.push(`${openTix.length} open ServiceTicket(s) — resolve or defer`);
      if(!show.financePacketGeneratedAt) fail.push('Finance handoff packet not generated');
      return fail.length ? { ok:false, reasons:fail, overrideBy:[PCG.GROUPS.ADMIN], logRequired:true } : { ok:true };
    }
  };

  // Backward transitions (admin only, always logged)
  const BACKWARDS = {
    'Awarded→Quoted':  { allowedGroups:[PCG.GROUPS.ADMIN], effect:'Releases confirmed holds → provisional. Clears staffing seed.' },
    'InPrep→Awarded':  { allowedGroups:[PCG.GROUPS.ADMIN], effect:'Pull sheets → Not Started. Crew invitations suspended. Holds retained. Reason required.' },
    'OnShow→InPrep':   { allowedGroups:[PCG.GROUPS.ADMIN], effect:'Show cancelled mid-event. Damage/return workflow opens immediately.' }
  };

  PCG.engines.lifecycle = {
    STATES,

    canTransition(show, toState){
      if(!show) return { ok:false, reasons:['Show not found'] };
      const key = `${show.lifecycleState}→${toState}`;
      const backward = BACKWARDS[key];
      if(backward){
        if(!PCG.hasAnyPermission.apply(null, backward.allowedGroups))
          return { ok:false, reasons:['Admin permission required for backward transition'], overrideBy:backward.allowedGroups };
        return { ok:true, backward:true, effect:backward.effect, logRequired:true };
      }
      if(!(FORWARD[show.lifecycleState]||[]).includes(toState))
        return { ok:false, reasons:[`Illegal transition ${show.lifecycleState} → ${toState}`] };
      const guard = GUARDS[key];
      return guard ? guard(show) : { ok:true };
    },

    transition(show, toState, opts){
      opts = opts || {};
      const check = this.canTransition(show, toState);
      if(!check.ok){
        if(!opts.overrideReason) return check;
        // Override path
        if(!check.overrideBy || !PCG.hasAnyPermission.apply(null, check.overrideBy))
          return { ok:false, reasons:['Override not permitted for role'], required:check.overrideBy };
        PCG._rawAppendLifecycleLog({
          showId: show.id, at: new Date().toISOString(),
          actor: PCG.user.id, from: show.lifecycleState, to: toState,
          override: true, reasons: check.reasons, overrideReason: opts.overrideReason
        });
      } else {
        PCG._rawAppendLifecycleLog({
          showId: show.id, at: new Date().toISOString(),
          actor: PCG.user.id, from: show.lifecycleState, to: toState,
          override: false, backward: !!check.backward
        });
      }
      show.lifecycleState = toState;
      // Side effects run async (spec §3.3 — partial completion)
      setTimeout(()=>PCG.engines.lifecycle._runSideEffects(show, toState), 0);
      return { ok:true, transitioned:true };
    },

    _runSideEffects(show, toState){
      if(toState==='Awarded'){
        // hold creation, staffing seed, checklist, deposit notification
        PCG.engines.notify.emit('StateTransition', { showId:show.id, from:'Quoted', to:'Awarded' });
      }
      if(toState==='InPrep'){
        PCG.engines.notify.emit('PrepActivated', { showId:show.id });
      }
      // non-blocking; failures would enqueue action queue items
    },

    // Lifecycle-gated UI helpers
    canEditQuote(show){ return show && (show.lifecycleState==='Opportunity' || show.lifecycleState==='Quoted'); },
    canOpenPullSheet(show){ return show && ['InPrep','OnShow','Striking','Returning'].includes(show.lifecycleState); },
    canRunScans(show){ return show && ['InPrep','OnShow','Striking','Returning'].includes(show.lifecycleState); },
    isReadOnly(show){ return show && show.lifecycleState==='Archived'; }
  };

  /* ========================================================================
     2. AVAILABILITY ENGINE  — §3.1
     Demo implementation: static data. In prod, this call moves to server.
     ======================================================================== */
  PCG.engines.availability = {
    /**
     * POST /api/availability/check (contract in spec §3.1)
     * In Phase 1 this is informational only over static data.
     */
    check(req){
      if(!req || !req.itemId) return { status:'error', code:'DATE_RANGE_INVALID' };
      const item = (PCG.inventory||[]).find(i=>i.id===req.itemId);
      if(!item) return { status:'error', code:'ITEM_NOT_FOUND' };

      const from = new Date(req.fromDate), to = new Date(req.toDate);
      if(isNaN(from) || isNaN(to) || to<from) return { status:'error', code:'DATE_RANGE_INVALID' };

      const owned = (item.qty||0) - (item.oocCount||0) - (item.missingCount||0);
      const allocs = (PCG.allocations||[]).filter(a=>
        a.inventoryItemId===req.itemId &&
        a.holdType==='confirmed' &&
        a.showId !== req.excludeShowId &&
        PCG.engines.availability._overlaps(a.fromDate, a.toDate, req.fromDate, req.toDate)
      );
      const allocated = allocs.reduce((s,a)=>s+(a.qty||0), 0);
      const rpoSupply = (PCG.subRentals||[])
        .filter(r => r.itemId===req.itemId && r.status==='Approved' &&
          PCG.engines.availability._overlaps(r.fromDate, r.toDate, req.fromDate, req.toDate))
        .reduce((s,r)=>s+(r.qty||0), 0);
      const supply = owned + rpoSupply;
      const available = Math.max(0, supply - allocated);

      if(available >= (req.qty||1)){
        return { status:'available', available, owned, allocated, rpoSupply, source: rpoSupply>0?'owned+rpo':'owned' };
      }
      if(available > 0){
        return {
          status:'partial', available, required:req.qty, deficit:(req.qty - available),
          owned, allocated, subrental_eligible:true,
          suggested_vendors: ['Solotech','PRG','VER','IMPACT'].slice(0,3)
        };
      }
      const conflicts = allocs.map(a=>{
        const show = (PCG.projects||[]).map(p=>p.show).filter(Boolean).find(s=>s.id===a.showId) ||
                     (PCG.projects||[]).find(p=>p.code===a.showId) ||
                     { id:a.showId, name:a.showId };
        return {
          showId: show.code || a.showId,
          showName: show.name || a.showId,
          qty: a.qty,
          overlap:{ from:a.fromDate, to:a.toDate },
          holdType:a.holdType
        };
      });
      const substitutions = (PCG.inventory||[])
        .filter(i => i.id!==item.id && i.categoryId===item.categoryId)
        .slice(0,3)
        .map(i=>({ itemId:i.id, name:i.name, available:i.qty, similarity:'category-match' }));
      return { status:'conflict', available:0, required:req.qty, owned, conflicts, substitutions };
    },

    _overlaps(aFrom,aTo,bFrom,bTo){
      return !(new Date(aTo) < new Date(bFrom) || new Date(aFrom) > new Date(bTo));
    }
  };

  /* ========================================================================
     3. CONFLICT DETECTION ENGINE  — §3.2
     Writes to ConflictLog. Demo version is synchronous scan of fixtures.
     ======================================================================== */
  PCG.engines.conflict = {
    scanPortfolio(){
      const items = PCG.inventory || [];
      const out = [];
      items.forEach(item=>{
        const dateMap = {};
        (PCG.allocations||[])
          .filter(a => a.inventoryItemId===item.id && a.holdType==='confirmed')
          .forEach(a=>{
            const key = `${a.fromDate}|${a.toDate}`;
            dateMap[key] = dateMap[key] || { from:a.fromDate, to:a.toDate, allocs:[] };
            dateMap[key].allocs.push(a);
          });
        Object.values(dateMap).forEach(win=>{
          const totalAllocated = win.allocs.reduce((s,a)=>s+a.qty,0);
          const rpo = (PCG.subRentals||[])
            .filter(r=>r.itemId===item.id && r.status==='Approved' &&
              PCG.engines.availability._overlaps(r.fromDate, r.toDate, win.from, win.to))
            .reduce((s,r)=>s+r.qty,0);
          const supply = (item.qty||0) - (item.oocCount||0) - (item.missingCount||0) + rpo;
          if(totalAllocated > supply){
            out.push({
              itemId:item.id, itemName:item.name, category:item.categoryId,
              owned: item.qty||0, confirmedRPOs:rpo, totalAllocated,
              deficit: totalAllocated - supply,
              overlappingDates: { from:win.from, to:win.to },
              conflictingShows: win.allocs.slice(0,5).map(a=>({
                showId: a.showId, qty:a.qty, holdType:a.holdType
              })),
              severity: (totalAllocated-supply) > (item.qty*0.5) ? 'high' : 'medium',
              resolutionStatus: 'Open'
            });
          }
        });
      });
      return out;
    },

    crewConflicts(memberId, showId, callDate){
      const me = (PCG.crewMembers||[]).find(m=>m.id===memberId);
      if(!me) return { conflict:false };
      const conflicts = (PCG.shiftAssignments||[])
        .filter(s => s.crewMemberId===memberId && s.showId!==showId && s.status!=='Cancelled')
        .filter(s => (s.dates||[]).some(d => d === callDate))
        .map(s => ({ showId:s.showId, overlap:{from:callDate,to:callDate}, status:s.status }));
      return conflicts.length ? { conflict:true, conflicts } : { conflict:false };
    }
  };

  /* ========================================================================
     4. PRICING ENGINE  — §3.4
     Two post-approval tracks: Internal Correction vs Formal Change Order.
     ======================================================================== */
  PCG.engines.pricing = {
    CO_DIRECTOR_THRESHOLD: 5000,  // TBD §14
    DISCOUNT_CSO_THRESHOLD: 0.10,

    // Quotes are immutable once Awarded. Only internal corrections by Scheduling+.
    canEditRevision(revision){
      if(!revision) return false;
      if(revision.status==='Superseded') return false;
      if(revision.status==='Awarded')
        return PCG.hasAnyPermission(PCG.GROUPS.SCHEDULING, PCG.GROUPS.ADMIN); // internal correction only
      return PCG.hasAnyPermission(PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN);
    },

    logInternalCorrection(revision, correction){
      if(revision.status!=='Awarded') return { ok:false, reason:'Only awarded revisions use internal corrections' };
      PCG.requireAny(PCG.GROUPS.SCHEDULING, PCG.GROUPS.ADMIN);
      revision.corrections = revision.corrections || [];
      revision.corrections.push(Object.assign({ at:new Date().toISOString(), by:PCG.user.id }, correction));
      return { ok:true };
    },

    submitChangeOrder(co){
      // Routing based on financial impact (§5.1 hardcoded rules)
      if(Math.abs(co.financialImpact) > this.CO_DIRECTOR_THRESHOLD){
        co.approvalRoute = ['PM','AE','Director'];
      } else {
        co.approvalRoute = ['PM','AE'];
      }
      co.status = 'Pending';
      return co;
    },

    enforceDiscountGuard(discountPct){
      if(discountPct > this.DISCOUNT_CSO_THRESHOLD
         && !PCG.hasAnyPermission(PCG.GROUPS.DIRECTORS, PCG.GROUPS.ADMIN)){
        throw Object.assign(new Error('Discount >10% requires CSO/Director approval'), { code:'DISCOUNT_GUARD' });
      }
    },

    // Quote totals always use cost basis service (see §5 below)
    computeRevisionTotals(lines){
      let rev=0, cost=0;
      (lines||[]).forEach(l=>{
        const extRev = (l.unitPrice||0) * (l.qty||0) * (l.days||1);
        rev += extRev;
        cost += PCG.engines.cost.costForLine(l) * (l.qty||0) * (l.days||1);
      });
      return { totalRevenue:rev, totalCost:cost, margin: rev ? (rev-cost)/rev : 0 };
    },

    /* FINAL SPEC §EE.1 — Fee Stacking Rules
       Fee order is fixed + non-configurable:
       1) Line discounts → 2) Section discounts → 3) Total discount
       4) Service fee (% of equipment) → 5) Admin fee
       6) Fuel surcharge (% of transport) → 7) Expedite charge → 8) Tax
       HARD RULE: No fee-on-fee. Tax is the only exception.
    */
    computeStackedTotals(lines, opts){
      opts = opts || {};
      const types = {
        equip:   ['Rental','SubRental','HeavyEquipment','Consumable'],
        labor:   ['Labor','LaborPackage'],
        service: ['Service'],
        travel:  ['Travel'],
        transport:['Transport'],
        fee:     ['Fee'],
        disc:    ['Discount'],
        misc:    ['Misc','Purchase']
      };
      const typeOf = t => Object.entries(types).find(([,arr]) => arr.includes(t))[0] || 'misc';
      const ext = l => (l.unitPrice||0) * (l.qty||0) * (l.days||1);

      // 1-3) Discounts are already embedded as negative lines in our data model.
      // We separate them for clear reporting.
      const subtotals = { equip:0, labor:0, service:0, travel:0, transport:0, misc:0 };
      const discounts = { line:0, section:0, total:0 };
      (lines||[]).forEach(l => {
        const category = typeOf(l.type);
        if(l.type === 'Discount'){
          const amt = ext(l); // already negative
          if(l.discountScope==='Section') discounts.section += amt;
          else if(l.discountScope==='Total') discounts.total += amt;
          else discounts.line += amt;
        } else if(l.type === 'Fee') {
          /* fees handled below */
        } else if(category in subtotals) {
          subtotals[category] += ext(l);
        }
      });
      // Post-discount equipment subtotal (spec fee base for §4)
      const postDiscountEquip = subtotals.equip + discounts.line + discounts.section; // discounts are neg
      const preFeeTotal = subtotals.equip + subtotals.labor + subtotals.service + subtotals.travel + subtotals.transport + subtotals.misc + discounts.line + discounts.section + discounts.total;
      // 4) Service fee — default 5% of post-discount equipment
      const serviceFeePct = opts.serviceFeePct != null ? opts.serviceFeePct : 0.05;
      const serviceFee = Math.round(postDiscountEquip * serviceFeePct);
      // 5) Admin fee (flat from opts, or 0)
      const adminFee = opts.adminFee || 0;
      // 6) Fuel surcharge (default 0 unless transport > 0)
      const fuelPct = opts.fuelPct != null ? opts.fuelPct : 0;
      const fuelSurcharge = Math.round(subtotals.transport * fuelPct);
      // 7) Expedite flat
      const expediteCharge = opts.expediteCharge || 0;
      // 8) Tax — applied to taxable categories only, post-all-fees
      const taxableBase = preFeeTotal + serviceFee + adminFee + fuelSurcharge + expediteCharge
        - subtotals.travel  // travel typically tax exempt
        - subtotals.transport; // transport often exempt
      const taxRate = opts.taxRate || 0;
      const tax = Math.round(taxableBase * taxRate);
      const grandTotal = preFeeTotal + serviceFee + adminFee + fuelSurcharge + expediteCharge + tax;
      return { subtotals, discounts, postDiscountEquip, preFeeTotal, serviceFee, adminFee, fuelSurcharge, expediteCharge, tax, grandTotal };
    },

    /* FINAL SPEC §YY — Margin Risk Warnings (6 triggers)
       Runs per line AND per revision. Returns ranked risk list. */
    computeMarginWarnings(rev){
      if(!rev) return [];
      const warnings = [];
      const lines = rev.lines || [];
      // Compute line ext rev/cost
      const withMargin = lines.map(l => {
        const extRev = (l.unitPrice||0) * (l.qty||0) * (l.days||1);
        const extCost = PCG.engines.cost.costForLine(l) * (l.qty||0) * (l.days||1);
        return { l, extRev, extCost, pct: extRev ? (extRev - extCost) / extRev : 0 };
      });
      // 1) Overall revision margin below 30% floor
      if(rev.margin != null && rev.margin < 0.30){
        warnings.push({ kind:'OVERALL_BELOW_FLOOR', level:'high',
          message:`Quote margin ${Math.round(rev.margin*100)}% < 30% floor`, ref:rev.id });
      }
      // 2) Individual line margin negative
      withMargin.filter(x => x.extCost > x.extRev && x.extRev > 0).forEach(x =>
        warnings.push({ kind:'NEGATIVE_LINE_MARGIN', level:'high',
          message:`Line "${x.l.description}" is below cost (margin ${Math.round(x.pct*100)}%)`, ref:x.l.id }));
      // 3) Sub-rental without vendor cost set
      lines.filter(l => l.type==='SubRental' && !l.vendorCost).forEach(l =>
        warnings.push({ kind:'SUBRENTAL_COST_MISSING', level:'medium',
          message:`Sub-rental "${l.description}" has no vendorCost — margin computed as 100%`, ref:l.id }));
      // 4) Labor blend mixing Union + non-Union positions
      const laborPositions = lines.filter(l => l.type==='Labor').map(l => {
        const pos = (PCG.crewPositions||[]).find(p => p.id===l.crewPositionId);
        return pos ? !!pos.union : null;
      }).filter(x => x !== null);
      if(laborPositions.some(u=>u) && laborPositions.some(u=>!u)){
        warnings.push({ kind:'LABOR_BLEND_MIXED', level:'medium',
          message:`Quote mixes union and non-union positions — verify blended rate assumptions` });
      }
      // 5) Heavy discount stacking (>20% total across all discount lines)
      const discountTotal = lines.filter(l => l.type==='Discount').reduce((s,l) => s + Math.abs((l.unitPrice||0)), 0);
      if(rev.totalRevenue && (discountTotal / rev.totalRevenue) > 0.20){
        warnings.push({ kind:'HEAVY_DISCOUNT_STACK', level:'high',
          message:`Discount lines total ${Math.round(discountTotal/rev.totalRevenue*100)}% — exceeds 20% threshold, Director approval required` });
      }
      // 6) Travel pass-through with zero cost (could signal miscategorized reimbursable)
      const passthrough = lines.filter(l => l.type==='Travel' && l.billingMethod==='PassThrough' && (l.unitPrice - (l.cost||0)) === 0 && l.unitPrice > 0);
      if(passthrough.length > 0 && passthrough.reduce((s,l)=>s+((l.unitPrice||0)*(l.qty||0)*(l.days||1)),0) > (rev.totalRevenue||0) * 0.10){
        warnings.push({ kind:'TRAVEL_PASSTHRU_LARGE', level:'medium',
          message:`${passthrough.length} travel line(s) billed pass-through with zero markup — confirm billing method` });
      }
      return warnings.sort((a,b) => (a.level==='high'?0:1) - (b.level==='high'?0:1));
    }
  };

  /* ========================================================================
     5. COST BASIS SERVICE  — user decision: blended future, $0 default
     ======================================================================== */
  PCG.engines.cost = {
    // Strategy resolver — keep all cost math here so UI/quote never embeds rules
    _strategy: { mode: 'default_zero' }, // future: 'blended' | 'per_item' | 'category' | 'depreciation'

    setStrategy(s){ this._strategy = Object.assign(this._strategy, s||{}); },

    costForLine(line){
      if(!line) return 0;
      if(line.type==='Labor'){
        // labor uses pay rate if known and permitted; bill rate from rate card otherwise 0
        const pos = (PCG.crewPositions||[]).find(p=>p.id===line.crewPositionId);
        if(!pos) return 0;
        return this.costForCrewPosition(pos);
      }
      if(line.type==='SubRental'){
        return line.vendorCost || 0;
      }
      // Rental / Misc
      if(this._strategy.mode === 'per_item' && line.inventoryItemId){
        const inv = (PCG.inventory||[]).find(i=>i.id===line.inventoryItemId);
        return (inv && inv.perItemCost) || 0;
      }
      if(this._strategy.mode === 'category'){
        const inv = (PCG.inventory||[]).find(i=>i.id===line.inventoryItemId);
        const cat = (PCG.inventoryCategories||[]).find(c=>c.id===(inv&&inv.categoryId));
        return (cat && cat.categoryCost) || 0;
      }
      if(this._strategy.mode === 'blended'){
        // placeholder blended formula
        const inv = (PCG.inventory||[]).find(i=>i.id===line.inventoryItemId);
        if(!inv) return 0;
        return (inv.perItemCost!=null) ? inv.perItemCost : ((inv.replacementCost||0) * 0.02);
      }
      return 0; // default_zero fallback
    },

    costForCrewPosition(pos){
      // pay rate visibility enforced at API boundary — this service assumes caller authorized
      const vers = (pos && pos.ratesByVersion) || [];
      const active = vers[vers.length-1];
      return (active && active.payRate) || 0;
    }
  };

  /* ========================================================================
     6. SCHEDULING ENGINE  — §3.5
     Sync conflict check on ShiftAssignment create/modify.
     ======================================================================== */
  PCG.engines.scheduling = {
    OT_THRESHOLD_HRS: 8,    // configurable per jurisdiction — OPEN DECISION #7
    DT_THRESHOLD_HRS: 12,

    checkAssignment(assn){
      // returns sync result (§3.5 shape)
      const overlap = PCG.engines.conflict.crewConflicts(assn.crewMemberId, assn.showId, assn.dates && assn.dates[0]);
      if(overlap.conflict) return overlap;
      const block = (PCG.availabilityBlocks||[]).find(b =>
        b.crewMemberId===assn.crewMemberId &&
        (assn.dates||[]).some(d => d >= b.fromDate && d <= b.toDate));
      if(block) return { conflict:true, conflicts:[{ blockReason:block.reason, overlap:{from:block.fromDate, to:block.toDate}, status:'Blocked' }] };
      return { conflict:false };
    },

    classifyHours(worked){
      const w = worked || 0;
      if(w <= this.OT_THRESHOLD_HRS) return { reg:w, ot:0, dt:0 };
      if(w <= this.DT_THRESHOLD_HRS) return { reg:this.OT_THRESHOLD_HRS, ot:w-this.OT_THRESHOLD_HRS, dt:0 };
      return { reg:this.OT_THRESHOLD_HRS, ot:this.DT_THRESHOLD_HRS-this.OT_THRESHOLD_HRS, dt:w-this.DT_THRESHOLD_HRS };
    }
  };

  /* ========================================================================
     7. NOTIFICATION ENGINE  — §3.6
     Event-driven, not a messaging app.
     ======================================================================== */
  PCG.engines.notify = {
    _listeners: [],
    _queue: [],

    on(event, fn){ this._listeners.push({event, fn}); },
    emit(event, payload){
      this._queue.push({ event, payload, at:new Date().toISOString(), id:'n'+Math.random().toString(36).slice(2,9) });
      if(this._queue.length>200) this._queue.shift();
      this._listeners.filter(l=>l.event===event || l.event==='*').forEach(l=>{
        try { l.fn(event, payload); } catch(e){}
      });
    },
    recent(n){ return this._queue.slice(-Math.abs(n||20)).reverse(); }
  };

  /* ========================================================================
     9. SHOW READINESS ENGINE  — §E (v2.1)
     Synthesizes a confidence score from 5 components:
       warehouse · labor · ROS · checklist · finance
     Overall = Blocked > Red > Yellow > Green
     Result is AUTHORITATIVE for "is this show actually in good shape?"
     Uses Source-of-Truth Hierarchy (PCG.TRUTH_SOURCES) for every input.
     ======================================================================== */
  PCG.engines.readiness = {
    compute(showId){
      if(!showId) return null;
      const show = PCG.api && PCG.api.getShow ? PCG.api.getShow(showId) : null;
      if(!show) return null;
      const components = {
        warehouse: this._warehouse(show),
        labor:     this._labor(show),
        ros:       this._ros(show),
        checklist: this._checklist(show),
        finance:   this._finance(show)
      };
      const values = Object.values(components);
      let overall = 'Green';
      if(values.some(c=>c.status==='Blocked')) overall='Blocked';
      else if(values.some(c=>c.status==='Red')) overall='Red';
      else if(values.some(c=>c.status==='Yellow')) overall='Yellow';
      return {
        showId, computedAt: new Date().toISOString(), overall, components,
        truthSources: {
          warehouse: 'inventoryStateEngine',
          labor:     'scheduleEngine',
          ros:       'runOfShowEngine',
          checklist: 'checklistGate',
          finance:   'pricingEngine + invoiceMilestone'
        }
      };
    },

    _warehouse(show){
      const pulls = (PCG.pullSheets||[]).filter(p=>p.showId===show.id);
      if(!pulls.length) return { status:'Yellow', score:40, blockers:[], warnings:['No pull sheets'] };
      const finalized    = pulls.filter(p=>['Finalized','Shipped','OnShow','Returning','Received','Closed'].includes(p.status));
      const notFinalized = pulls.length - finalized.length;
      const noAuth       = pulls.filter(p=>p.status==='Finalized' && !p.authorizedById).length;
      const openTix      = (PCG.serviceTickets||[]).filter(t=>t.showId===show.id && t.status==='Open').length;
      const blockers=[], warnings=[];
      if(noAuth) blockers.push(`${noAuth} pull sheet(s) finalized without Walk-the-Pile`);
      if(notFinalized) warnings.push(`${notFinalized} pull sheet(s) not finalized`);
      if(openTix) warnings.push(`${openTix} open service ticket(s)`);
      const score = Math.max(0, 100 - noAuth*40 - notFinalized*15 - openTix*10);
      let status = 'Green';
      if(blockers.length) status = 'Red';
      else if(warnings.length) status = 'Yellow';
      return { status, score, blockers, warnings };
    },

    _labor(show){
      const assn = (PCG.shiftAssignments||[]).filter(s=>s.showId===show.id);
      if(!assn.length) return { status:'Yellow', score:50, blockers:[], warnings:['No shift assignments'] };
      const confirmed = assn.filter(s=>['Confirmed','Acknowledged','Completed'].includes(s.status)).length;
      const invited   = assn.filter(s=>s.status==='Invited').length;
      const unfilled  = assn.filter(s=>!s.crewMemberId).length;
      const pctConfirmed = confirmed / assn.length;
      // Time-to-show window
      const hrsToShow = (new Date(show.dates.showStart) - new Date())/3600000;
      const blockers=[], warnings=[];
      if(hrsToShow < 48 && pctConfirmed < 0.9) blockers.push(`Only ${Math.round(pctConfirmed*100)}% confirmed <48h before show`);
      else if(pctConfirmed < 0.9) warnings.push(`${invited} invited position(s) not confirmed`);
      if(unfilled) warnings.push(`${unfilled} unfilled position(s)`);
      const score = Math.round(pctConfirmed*100) - unfilled*5;
      let status = 'Green';
      if(blockers.length) status = 'Red';
      else if(warnings.length) status = 'Yellow';
      return { status, score, blockers, warnings, pctConfirmed };
    },

    _ros(show){
      const ros = (PCG.runOfShows||[]).find(r=>r.showId===show.id);
      const blockers=[], warnings=[];
      if(!ros){
        if(show.lifecycleState==='OnShow') blockers.push('Show is On Show but no RunOfShow exists');
        else warnings.push('No RunOfShow drafted');
        return { status:blockers.length?'Red':'Yellow', score:40, blockers, warnings };
      }
      const blocked = (ros.items||[]).filter(i=>i.confidenceStatus==='Red').length;
      if(blocked) blockers.push(`${blocked} run item(s) blocked`);
      if(ros.status==='Draft')    warnings.push('ROS in Draft');
      if(ros.status==='InReview') warnings.push('ROS in Review');
      const score = ros.status==='Approved' ? 100 : ros.status==='InReview' ? 70 : 40;
      let status = 'Green';
      if(blockers.length) status = 'Red';
      else if(warnings.length) status = 'Yellow';
      return { status, score, blockers, warnings };
    },

    _checklist(show){
      const gate = PCG.engines.checklistGate.canAdvance(show, show.lifecycleState);
      const items = (PCG.checklistItems||[]).filter(c=>c.showId===show.id);
      if(!items.length) return { status:'Yellow', score:50, blockers:[], warnings:['No checklist seeded'] };
      const overdue = items.filter(c=>c.status==='Pending' && c.dueDate && new Date(c.dueDate) < new Date()).length;
      const blockersOpen = items.filter(c=>c.blocking && !['Complete','NA','Overridden'].includes(c.status));
      const overridden   = items.filter(c=>c.status==='Overridden').length;
      const blockers=[], warnings=[];
      if(blockersOpen.length && !gate.allowed) blockers.push(`${blockersOpen.length} blocking checklist item(s) open`);
      if(overdue) warnings.push(`${overdue} overdue item(s)`);
      if(overridden) warnings.push(`${overridden} item(s) overridden`);
      const completed = items.filter(c=>c.status==='Complete').length;
      const score = Math.round((completed/items.length)*100);
      let status = 'Green';
      if(blockers.length) status = 'Red';
      else if(warnings.length) status = 'Yellow';
      return { status, score, blockers, warnings };
    },

    _finance(show){
      const proj = (PCG.projects||[]).find(p=>p.code===(show.projectCode||show.id));
      const ims = (PCG.invoiceMilestones||[]).filter(m=>m.projectCode===(show.projectCode||show.id));
      const blockers=[], warnings=[];
      const hrsToShow = (new Date(show.dates.showStart) - new Date())/3600000;
      const deposit = ims.find(m=>m.type==='deposit');
      if(deposit && deposit.status!=='paid'){
        if(hrsToShow < 72 && ['Awarded','InPrep','OnShow'].includes(show.lifecycleState))
          blockers.push('Deposit not received and show is <72h away');
        else warnings.push('Deposit not yet received');
      }
      const score = deposit && deposit.status==='paid' ? 100 : 60;
      let status = 'Green';
      if(blockers.length) status = 'Red';
      else if(warnings.length) status = 'Yellow';
      return { status, score, blockers, warnings };
    }
  };

  /* ========================================================================
     10. CHECKLIST GATE ENGINE  — §C (v2.1)
     Blocks lifecycle state advance if any blocking checklist items
     in current or prior phases are open without override.
     ======================================================================== */
  PCG.engines.checklistGate = {
    // Phase map: which lifecycle state each checklist phase corresponds to
    PHASE_ORDER: ['Inquiry','Tentative','Confirmed','FinalPrep','Onsite','ShowStrike','PostShow','ReadyToInvoice'],
    STATE_TO_PHASE: {
      Opportunity:'Inquiry', Quoted:'Tentative', Awarded:'Confirmed',
      InPrep:'FinalPrep', OnShow:'Onsite', Striking:'ShowStrike',
      Returning:'ShowStrike', Closing:'PostShow', Archived:'ReadyToInvoice'
    },

    phasesUpTo(targetPhase){
      const idx = this.PHASE_ORDER.indexOf(targetPhase);
      return idx >= 0 ? this.PHASE_ORDER.slice(0, idx+1) : [];
    },

    canAdvance(show, toState){
      if(!show) return { allowed:true, blockedBy:[] };
      const fromPhase = this.STATE_TO_PHASE[show.lifecycleState] || 'Inquiry';
      const toPhase   = this.STATE_TO_PHASE[toState] || fromPhase;
      const required = this.phasesUpTo(toPhase);
      const items = (PCG.checklistItems||[])
        .filter(c => c.showId === show.id)
        .filter(c => required.includes(c.phase))
        .filter(c => c.blocking === true)
        .filter(c => !['Complete','NA','Overridden'].includes(c.status));
      return items.length ? { allowed:false, blockedBy:items } : { allowed:true, blockedBy:[] };
    },

    overrideItem(checklistItemId, reason){
      PCG.requireAny(PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS);
      const item = (PCG.checklistItems||[]).find(c=>c.id===checklistItemId);
      if(!item) throw new Error('Checklist item not found');
      if(!reason || !reason.trim()) throw new Error('Override reason required');
      item.status = 'Overridden';
      item.overrideReason = reason;
      item.overriddenById = PCG.user.id;
      item.overriddenAt = new Date().toISOString();
      PCG.auditLog = PCG.auditLog || [];
      PCG.auditLog.push({
        at: item.overriddenAt, actor: PCG.user.id,
        action: 'checklist.override',
        entityId: checklistItemId, reason
      });
      return item;
    },

    completeItem(checklistItemId){
      const item = (PCG.checklistItems||[]).find(c=>c.id===checklistItemId);
      if(!item) throw new Error('Checklist item not found');
      item.status = 'Complete';
      item.completedAt = new Date().toISOString();
      item.completedById = PCG.user.id;
      return item;
    }
  };

  /* ========================================================================
     11. EDITABILITY ENGINE  — §16 + user additions
     Single source of truth for "can I edit this field right now?"
     Combines permission (who) with lifecycle (when).
     ======================================================================== */
  PCG.engines.editability = {
    check(entityPath, show, requiredGroups){
      const stateRule = PCG.canEditField(entityPath, show);
      if(stateRule.locked) return { editable:false, reason:stateRule.reason, stateLocked:true };
      if(requiredGroups && requiredGroups.length && !PCG.hasAnyPermission.apply(null, requiredGroups))
        return { editable:false, reason:'Insufficient permission for this field', permissionLocked:true };
      if(stateRule.overridable){
        if(PCG.hasAnyPermission(PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS))
          return { editable:false, reason:stateRule.reason, overridable:true };
        return { editable:false, reason:stateRule.reason, locked:true };
      }
      return { editable: stateRule.editable === true };
    }
  };

  /* ========================================================================
     8. OFFLINE SYNC ENGINE  — §3.8
     Architecture-level. IndexedDB queue used by QC/IC Scan PWA.
     ======================================================================== */
  PCG.engines.sync = {
    DB_NAME: 'pcg-stage-scan',
    STORE:   'scans',
    VERSION: 1,

    _db: null,

    async open(){
      if(this._db) return this._db;
      if(!('indexedDB' in window)) throw new Error('IndexedDB not supported');
      return new Promise((resolve,reject)=>{
        const req = indexedDB.open(this.DB_NAME, this.VERSION);
        req.onupgradeneeded = ev => {
          const db = ev.target.result;
          if(!db.objectStoreNames.contains(this.STORE)){
            const os = db.createObjectStore(this.STORE, { keyPath:'scanId' });
            os.createIndex('syncStatus', 'syncStatus');
            os.createIndex('pullSheetLineId', 'pullSheetLineId');
          }
        };
        req.onsuccess = ev => { this._db = ev.target.result; resolve(this._db); };
        req.onerror   = ev => reject(ev.target.error);
      });
    },

    async queue(scan){
      const db = await this.open();
      return new Promise((resolve,reject)=>{
        const tx = db.transaction(this.STORE, 'readwrite');
        const os = tx.objectStore(this.STORE);
        const rec = Object.assign({
          scanId: crypto.randomUUID ? crypto.randomUUID() : ('s'+Math.random().toString(36).slice(2)),
          syncStatus: 'pending',
          conflictResolution: null,
          timestamp: new Date().toISOString(),
          techId: PCG.user.id,
          deviceId: navigator.userAgent.slice(0,40)
        }, scan);
        os.put(rec);
        tx.oncomplete = ()=>resolve(rec);
        tx.onerror    = ()=>reject(tx.error);
      });
    },

    async pending(){
      const db = await this.open();
      return new Promise((resolve,reject)=>{
        const tx = db.transaction(this.STORE, 'readonly');
        const os = tx.objectStore(this.STORE);
        const idx = os.index('syncStatus');
        const out = [];
        idx.openCursor(IDBKeyRange.only('pending')).onsuccess = ev => {
          const c = ev.target.result;
          if(c){ out.push(c.value); c.continue(); } else resolve(out);
        };
        tx.onerror = ()=>reject(tx.error);
      });
    },

    async resolvePending(){
      // Phase 1 demo: mark them synced locally. Real prod POSTs to server.
      const db = await this.open();
      const pend = await this.pending();
      return new Promise((resolve,reject)=>{
        const tx = db.transaction(this.STORE, 'readwrite');
        const os = tx.objectStore(this.STORE);
        pend.forEach(r => { r.syncStatus='synced'; os.put(r); });
        tx.oncomplete = ()=>resolve(pend.length);
        tx.onerror = ()=>reject(tx.error);
      });
    },

    // §3.8 conflict resolution — FAIL wins
    resolveConflict(recordA, recordB){
      if(recordA.result === 'Fail' || recordB.result === 'Fail') return 'fail_wins';
      return 'first_write_wins';
    }
  };

})();
