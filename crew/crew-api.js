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

})();
