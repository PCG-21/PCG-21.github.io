/* ==========================================================================
   CREW PWA — API client (conceptually the SAME backend as ops app per Rule 7).
   In the demo, we reach into the ops app's data via relative fetch of the seed.
   In production, this would be fetch('/api/crew/me') with the magic-link token.
   Zero shared UI code with the operations app.
   ========================================================================== */

(function(){
  window.CrewApi = {};

  /** Parse magic link token.  Format: SHA256(showId + crewMemberId + secret + expiry)
   *  For the demo we encode a plaintext JSON base64-url in the ?token= param.
   *  Eg: token={"m":"p.mchen","s":"SAE-WCX-2026","exp":"2026-04-18T12:00"}
   */
  CrewApi.parseToken = ()=>{
    const t = new URL(location.href).searchParams.get('token');
    if(!t){
      // Default demo identity: Mike Chen on SAE WCX
      return { crewMemberId:'p.mchen', showId:'SAE-WCX-2026', exp:null };
    }
    try {
      const json = atob(t.replace(/-/g,'+').replace(/_/g,'/'));
      const obj = JSON.parse(json);
      return { crewMemberId: obj.m, showId: obj.s, exp: obj.exp || null };
    } catch(e) { return null; }
  };

  CrewApi.isExpired = (ctx)=>{
    if(!ctx || !ctx.exp) return false;
    return new Date(ctx.exp) < new Date();
  };

  /* In Phase 3, all of these would be fetch('/api/crew/...') calls.
     Since this PWA shares the same tenant data as the ops app in demo mode,
     we load the same seed files via script tags — but the Crew App only
     reads from these three functions and nothing else.                   */

  CrewApi.getMe = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx || CrewApi.isExpired(ctx)) return null;
    const person = (window.PCG && window.PCG.people||[]).find(p=>p.id===ctx.crewMemberId);
    const member = (window.PCG && window.PCG.crewMembers||[]).find(m=>m.id===ctx.crewMemberId);
    return person ? {
      id: person.id,
      name: person.name,
      initials: (person.name||'').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase(),
      role: person.role,
      email: (member&&member.email) || null,
      phone: (member&&member.phone) || null,
      showId: ctx.showId
    } : null;
  };

  CrewApi.getMyShow = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return null;
    const p = (window.PCG && window.PCG.projects||[]).find(x=>x.code===ctx.showId);
    if(!p) return null;
    // Redact: crew sees NOTHING financial, NO pay rates, NO roster, NO margins
    const venue = (window.PCG && window.PCG.venues||[]).find(v=>v.id===p.venueId);
    return {
      code: p.code, name: p.name, client: p.client,
      venue: venue ? {
        name: venue.name,
        address: venue.address,
        loadInNotes: venue.loadInNotes,
        dockHours: venue.dockHours,
        union: !!venue.union,
        knownQuirks: venue.knownQuirks||[]
      } : null,
      dates: p.dates
    };
  };

  CrewApi.getMyAssignments = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return [];
    return (window.PCG && window.PCG.shiftAssignments||[])
      .filter(a => a.crewMemberId === ctx.crewMemberId)
      .map(a => {
        const proj = (window.PCG.projects||[]).find(p=>p.code===a.showId);
        const pos = (window.PCG.crewPositions||[]).find(p=>p.id===a.positionId);
        const posSafe = pos ? { name: pos.name, department: pos.department } : null;
        return {
          showId: a.showId,
          showName: proj ? proj.name : a.showId,
          dates: a.dates,
          callTime: a.callTime,
          status: a.status,
          position: posSafe
        };
      });
  };

  CrewApi.getMyTravel = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return null;
    const t = (window.PCG && window.PCG.travelRecords||[])
      .find(t => t.crewMemberId===ctx.crewMemberId && t.showId===ctx.showId);
    if(!t) return null;
    return {
      flightConfirmation: t.flightConfirmation,
      airline: t.airline,
      route: `${t.departureCity} → ${t.arrivalCity}`,
      departureTime: t.departureTime,
      arrivalTime: t.arrivalTime,
      hotelName: t.hotelName,
      hotelConfirmation: t.hotelConfirmation
      // No per-diem $ exposed to crew
      // No travelCostActual exposed to crew
    };
  };

  CrewApi.getKeyContacts = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return [];
    // Crew sees PM + TSM + onsite lead only. No AE, no client financial contacts.
    const p = (window.PCG.projects||[]).find(x=>x.code===ctx.showId);
    if(!p) return [];
    const pm = (window.PCG.people||[]).find(pp=>pp.id===p.pmId);
    const td = (window.PCG.people||[]).find(pp=>pp.id===p.td);
    return [
      pm && { role:'PM', name:pm.name, phone:'+1 313 555 0100' },
      td && { role:'TSM / TD', name:td.name, phone:'+1 313 555 0101' }
    ].filter(Boolean);
  };

  CrewApi.acknowledge = (showId)=>{
    // Write-through demo. Real system sets status=Acknowledged.
    const ctx = CrewApi.parseToken();
    const a = (window.PCG.shiftAssignments||[])
      .find(x => x.crewMemberId===ctx.crewMemberId && x.showId===showId);
    if(a) a.status = 'Acknowledged';
    return true;
  };

  // --- Timesheet entry (§12.3) ---
  CrewApi.getMyTimesheets = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return [];
    return (window.PCG.timesheets||[])
      .filter(t=>t.crewMemberId===ctx.crewMemberId && t.showId===ctx.showId)
      .sort((a,b)=>new Date(a.workDate)-new Date(b.workDate));
  };

  CrewApi.updateTimesheetField = (timesheetId, fields)=>{
    const t = (window.PCG.timesheets||[]).find(x=>x.id===timesheetId);
    if(!t || t.status!=='Draft') return null;
    Object.assign(t, fields);
    if(t.clockIn && t.clockOut){
      const hrs = (new Date(t.clockOut) - new Date(t.clockIn))/3600000 - (t.mealBreakMinutes||0)/60;
      t.workedHours = Math.max(0, Math.round(hrs*10)/10);
      t.otHours = Math.max(0, Math.min(t.workedHours - 8, 4));
      t.dtHours = Math.max(0, t.workedHours - 12);
    }
    return t;
  };

  CrewApi.submitTimesheet = (timesheetId)=>{
    const t = (window.PCG.timesheets||[]).find(x=>x.id===timesheetId);
    if(!t) return null;
    t.status = 'Submitted';
    t.submittedAt = new Date().toISOString();
    return t;
  };

  // --- Availability (§14.2 screen) ---
  CrewApi.addAvailabilityBlock = (fromDate, toDate, reason)=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return null;
    window.PCG.availabilityBlocks = window.PCG.availabilityBlocks || [];
    const block = {
      id:'ab.'+Math.random().toString(36).slice(2,8),
      crewMemberId: ctx.crewMemberId,
      fromDate, toDate,
      type:'Unavailable', reason,
      createdById: ctx.crewMemberId
    };
    window.PCG.availabilityBlocks.push(block);
    return block;
  };

  CrewApi.getMyAvailabilityBlocks = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return [];
    return (window.PCG.availabilityBlocks||[]).filter(b=>b.crewMemberId===ctx.crewMemberId);
  };

  // --- Clock in/out (Time screen, Lasso parity) ---
  CrewApi.getActiveClockEvent = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return null;
    return (window.PCG.clockEvents||[]).find(e => e.crewMemberId===ctx.crewMemberId && !e.clockOut) || null;
  };

  CrewApi.clockIn = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return null;
    window.PCG.clockEvents = window.PCG.clockEvents || [];
    if(CrewApi.getActiveClockEvent()) return null;
    const ev = {
      id:'ce.'+Math.random().toString(36).slice(2,8),
      crewMemberId: ctx.crewMemberId,
      clockIn: new Date().toISOString(), clockOut: null,
      shift:'Field Crew',
      showId: ctx.showId
    };
    window.PCG.clockEvents.push(ev);
    return ev;
  };

  CrewApi.clockOut = ()=>{
    const ev = CrewApi.getActiveClockEvent();
    if(!ev) return null;
    ev.clockOut = new Date().toISOString();
    return ev;
  };

  // --- Time cards (list of past clock events + timesheets) ---
  CrewApi.getMyTimeCards = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return [];
    const events = (window.PCG.clockEvents||[]).filter(e=>e.crewMemberId===ctx.crewMemberId);
    return events.map(e => {
      const hrs = e.clockOut
        ? ((new Date(e.clockOut) - new Date(e.clockIn))/3600000).toFixed(2)
        : 'Active';
      return {
        id: e.id,
        begin: e.clockIn,
        end: e.clockOut,
        account: e.showId || '—',
        hours: hrs
      };
    }).sort((a,b)=>new Date(b.begin) - new Date(a.begin));
  };

  // --- Messages (inbox) — combines static seed with live-sent messages ---
  CrewApi.getMyMessages = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return [];
    const seeded = [
      { id:'m.1', subject:'Detroit Uniform', preview:'The attire for Detroit is plain black polo, black pants, closed-toe black shoes. Ask Tyler if you need anything.', from:'p.tscheff', date:'2026-03-18', archived:false, showId:ctx.showId },
      { id:'m.2', subject:'Start Time and Point of Contact', preview:'Your start time for Sunday is 11 am. On-site lead is Chris Taylor. Message him when you arrive at dock 3.', from:'p.coliver', date:'2026-03-18', archived:false, showId:ctx.showId },
      { id:'m.3', subject:'Parking and Load-in', preview:'Enter via Atwater off Washington. Crew parking at American Center lot B. Badge at security hut.', from:'p.ctaylor', date:'2026-02-09', archived:false, showId:ctx.showId },
      { id:'m.4', subject:'IMPORTANT MESSAGE FROM OPERATIONS', preview:'When working with Premier, technical paperwork is to be submitted within 24 hours of strike. Timecards in Lasso, damage reports in STAGE.', from:'p.kbenz', date:'2026-01-28', archived:false, showId:ctx.showId },
      { id:'m.5', subject:'Crew Entrance', preview:'Hello All. We will be entering through the Atwater dock for this show. Please use the badges at the security desk.', from:'p.ctaylor', date:'2026-01-19', archived:true, showId:ctx.showId }
    ];
    // Pull messages sent to this crew member from the live messages store
    const live = (window.PCG.messages || []).filter(m => {
      const toMe = (m.toCrewIds||[]).includes(ctx.crewMemberId) || m.toAll;
      const forThisShow = !m.showId || m.showId === ctx.showId;
      return toMe && forThisShow;
    }).map(m => ({
      id: m.id, subject: m.subject, preview: m.body,
      from: m.fromId, date: m.sentAt, archived: false, showId: m.showId
    }));
    return live.concat(seeded);
  };

  // --- Upcoming events (all shows I am on) ---
  CrewApi.getMyUpcomingEvents = ()=>{
    const ctx = CrewApi.parseToken();
    if(!ctx) return [];
    const assns = (window.PCG.shiftAssignments||[]).filter(a=>a.crewMemberId===ctx.crewMemberId);
    const byShow = {};
    assns.forEach(a=>{
      const proj = (window.PCG.projects||[]).find(p=>p.code===a.showId);
      if(!proj) return;
      if(!byShow[a.showId]){
        byShow[a.showId] = {
          showId: a.showId,
          showName: proj.name,
          venueName: proj.venueName,
          loadIn: proj.dates.loadIn,
          loadOut: proj.dates.loadOut,
          allDates: new Set()
        };
      }
      (a.dates||[]).forEach(d => byShow[a.showId].allDates.add(d));
    });
    return Object.values(byShow)
      .map(x => ({ ...x, allDates: Array.from(x.allDates).sort() }))
      .sort((a,b)=>new Date(a.loadIn)-new Date(b.loadIn));
  };

})();
