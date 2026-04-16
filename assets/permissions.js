/* ==========================================================================
   PCG STAGE — Permission & Role Model  (v2.1)
   §3.7 Permission Engine  ·  §25.1 Role Home Screens  ·  §16.2 State-based edit rules
   §E Source-of-Truth Hierarchy

   CRITICAL Rule 2: enforced at API layer, NOT UI layer.
   ========================================================================== */

(function(){
  window.PCG = window.PCG || {};

  // --- Entra security groups (spec §19.1) ---
  PCG.GROUPS = Object.freeze({
    ADMIN:           'STAGE-Administrators',
    AE:              'STAGE-AccountExecs',
    AE_NO_CONFIRM:   'STAGE-AExecs-NoConfirm',
    DIRECTORS:       'STAGE-Directors',
    LEADERSHIP:      'STAGE-Leadership',
    SCHEDULING:      'STAGE-Scheduling',
    TSMS:            'STAGE-TSMs',
    WH_SUPERVISORS:  'STAGE-WHSupervisors',
    WH_TECHS:        'STAGE-WHATechs',
    ACCOUNTING:      'STAGE-Accounting',
    PRODUCER:        'STAGE-Producers',
    PA:              'STAGE-ProductionAssistants',
    CREW:            'STAGE-Crew',
    EVERYONE:        'STAGE-Everyone'
  });

  // Personas with role labels matching §G PM/TD/Producer reality + §25.1 landings
  PCG.PERSONAS = [
    { id:'p.jsharp',    name:'James Sharp',      role:'Administrator',         landing:'leadership', groups:['STAGE-Administrators','STAGE-Everyone'] },
    { id:'p.kbenz',     name:'Karen Benz',       role:'Director of Operations',landing:'leadership', groups:['STAGE-Directors','STAGE-Leadership','STAGE-Everyone'] },
    { id:'p.jspringer', name:'Jeff Springer',    role:'Account Executive',     landing:'ae',         groups:['STAGE-AccountExecs','STAGE-Everyone'] },
    { id:'p.jsharp2',   name:'James Sharp (PM)', role:'Project Manager',       landing:'pm',         groups:['STAGE-Administrators','STAGE-Everyone'] },
    { id:'p.tscheff',   name:'Tyler Scheff',     role:'Project Manager',       landing:'pm',         groups:['STAGE-TSMs','STAGE-Everyone'] },
    { id:'p.ctaylor',   name:'Chris Taylor',     role:'Technical Site Manager (TSM)', landing:'eqlpc', groups:['STAGE-TSMs','STAGE-Everyone'] },
    { id:'p.jgerber',   name:'Jason Gerber',     role:'Producer / Show Caller',landing:'producer',   groups:['STAGE-Producers','STAGE-Everyone'] },
    { id:'p.coliver',   name:'Chelsea Oliver',   role:'Scheduling / Labor',    landing:'labor',      groups:['STAGE-Scheduling','STAGE-Everyone'] },
    { id:'p.svance',    name:'Steph Vance',      role:'Warehouse Supervisor',  landing:'warehouse',     groups:['STAGE-WHSupervisors','STAGE-Everyone'] },
    { id:'p.arachilla', name:'Alex Rachilla',    role:'Warehouse Tech',        landing:'warehouseTech', groups:['STAGE-WHATechs','STAGE-Everyone'] },
    { id:'p.bwhit',     name:'Brandon White',    role:'Accounting',            landing:'ae',         groups:['STAGE-Accounting','STAGE-Everyone'] },
    { id:'p.mchen',     name:'Mike Chen',        role:'Crew (Freelancer)',     landing:'crew',       groups:['STAGE-Crew'] }
  ];

  /* --------------------------------------------------------------------
     ROLE-BASED LANDING SURFACES  (§25.1, plus user additions 2026-04-15)

     PM          → Project Dashboard    (readiness, checklists, issues)
     Warehouse   → Warehouse TV / Prep Queue
     Labor       → Scheduling Grid
     TSM/EQLPC   → Conflict + Shortage Dashboard
     Producer    → Run of Show (if show is active)
     AE          → Quote / Project financial view
     Leadership  → Portfolio / Readiness dashboard
     Crew        → Crew PWA
  -------------------------------------------------------------------- */
  PCG.LANDING_ROUTES = {
    pm:            'pm-home.html',
    warehouse:     'wh-sup-home.html',
    warehouseTech: 'wh-tech-home.html',
    labor:         'labor-home.html',
    eqlpc:         'eqlpc.html',
    producer:      'producer-home.html',
    ae:            'ae-home.html',
    leadership:    'leadership-home.html',
    crew:          'crew/index.html'
  };

  PCG.landingUrlForUser = function(user){
    if(!user) return 'index.html';
    const persona = (PCG.PERSONAS||[]).find(p=>p.id===user.id);
    if(persona && persona.landing && PCG.LANDING_ROUTES[persona.landing])
      return PCG.LANDING_ROUTES[persona.landing];
    // Fall-through by group:
    if(PCG.hasAnyPermission(PCG.GROUPS.LEADERSHIP, PCG.GROUPS.DIRECTORS)) return PCG.LANDING_ROUTES.leadership;
    if(PCG.hasPermission(PCG.GROUPS.AE))             return PCG.LANDING_ROUTES.ae;
    if(PCG.hasPermission(PCG.GROUPS.SCHEDULING))     return PCG.LANDING_ROUTES.labor;
    if(PCG.hasPermission(PCG.GROUPS.TSMS))           return PCG.LANDING_ROUTES.eqlpc;
    if(PCG.hasPermission(PCG.GROUPS.PRODUCER))       return PCG.LANDING_ROUTES.producer;
    if(PCG.hasAnyPermission(PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS))
      return PCG.LANDING_ROUTES.warehouse;
    if(PCG.hasPermission(PCG.GROUPS.CREW))           return PCG.LANDING_ROUTES.crew;
    return 'index.html';
  };

  /* --------------------------------------------------------------------
     STATE-BASED EDIT PERMISSIONS  (§16.2 + user additions 2026-04-15)

     For each lifecycle state we define:
       - editable   : fields that can be modified by ANY qualified role
       - locked     : fields that are read-only regardless of role
       - override   : fields only changeable via ExceptionOverride + reason
  -------------------------------------------------------------------- */
  PCG.STATE_EDIT_RULES = {
    Opportunity: {
      editable: ['pif.*','project.clientId','project.aeId','project.pmId',
                 'project.estimatedBudget','project.notes','quote.*','quoteLine.*'],
      locked:   [],
      override: []
    },
    Quoted: {
      editable: ['quote.lines','quote.revision.*','project.pmId','project.notes',
                 'quote.termsText','quote.depositPct'],
      locked:   ['project.clientId','project.aeId','scopeRecord.*'],
      override: ['quoteRevision.rateCardVersionId']  // requires AE + Director
    },
    Awarded: {
      editable: ['project.pmId','project.notes','checklist.*','workback.*',
                 'shift.*','shiftAssignment.*','pullSheet.lines',
                 'venue.contacts','show.handoffChecklistComplete'],
      locked:   ['quoteRevision.status','scopeRecord.*','quote.totalRevenue','project.clientId'],
      override: ['quoteRevision.lines']  // Internal Correction only, Scheduling+ role
    },
    InPrep: {
      editable: ['pullSheet.lines','pullSheet.status','shiftAssignment.*',
                 'travelRecord.*','procurementRequest.*','checklist.*',
                 'addOrder.*','serviceTicket.*','scanRecord.*'],
      locked:   ['scopeRecord.*','quoteRevision.lines','show.dates.showStart',
                 'show.dates.showEnd'],
      override: ['pullSheet.authorizedById', 'show.dates.loadIn']  // TSM+Admin
    },
    OnShow: {
      editable: ['addOrder.*','fieldNote.*','scanRecord.*','runOfShow.liveState',
                 'serviceTicket.*','issueLog.*','runItem.status'],
      locked:   ['pullSheet.lines','quoteRevision.lines','shiftAssignment.dates',
                 'scopeRecord.*','show.dates.*'],
      override: ['runOfShow.structure']  // Producer+Admin only
    },
    Striking: {
      editable: ['scanRecord.*','serviceTicket.*','laborActual.workedHours',
                 'fieldNote.*','manifest.status'],
      locked:   ['quoteRevision.*','pullSheet.lines','shiftAssignment.dates'],
      override: []
    },
    Returning: {
      editable: ['scanRecord.*','serviceTicket.*','laborActual.*','manifest.status'],
      locked:   ['quoteRevision.*','pullSheet.lines'],
      override: ['serialized.status']  // OOC → Available needs Admin
    },
    Closing: {
      editable: ['laborActual.*','changeOrder.*','addOrder.billableDecision',
                 'damageCharge.*','closeoutRecord.*','invoiceMilestone.*'],
      locked:   ['quoteRevision.*','pullSheet.lines','scanRecord.*','scopeRecord.*'],
      override: ['closeoutRecord.financePacketGeneratedAt']
    },
    Archived: {
      editable: [],
      locked:   ['*'],                   // everything read-only
      override: []                        // backward transition required
    }
  };

  PCG.canEditField = function(entityPath, show){
    // entityPath like 'pullSheet.lines' or 'quoteRevision.status'
    const state = (show && show.lifecycleState) || 'Opportunity';
    const rules = PCG.STATE_EDIT_RULES[state] || PCG.STATE_EDIT_RULES.Opportunity;
    // Wildcard locked
    if(rules.locked.includes('*')) return { editable:false, reason:'Archived — read only', locked:true };
    // Explicit editable (or wildcard on same entity root)
    if(rules.editable.includes(entityPath) ||
       rules.editable.some(p => p.endsWith('.*') && entityPath.startsWith(p.slice(0,-2))))
      return { editable:true };
    // Explicit locked
    if(rules.locked.includes(entityPath) ||
       rules.locked.some(p => p.endsWith('.*') && entityPath.startsWith(p.slice(0,-2))))
      return { editable:false, reason:`Locked in ${state}`, locked:true };
    // Override-path
    if(rules.override.includes(entityPath))
      return { editable:false, reason:`${state}: requires override + reason`, locked:false, overridable:true };
    // Default: not-editable in this state
    return { editable:false, reason:`Not editable in ${state}`, locked:true };
  };

  /* --------------------------------------------------------------------
     SOURCE-OF-TRUTH HIERARCHY  (§E + user additions 2026-04-15)

     Each data domain has ONE authoritative source. The ShowReadiness
     engine synthesizes a confidence score from these sources. No screen
     should show conflicting facts because each one knows where to look.
  -------------------------------------------------------------------- */
  PCG.TRUTH_SOURCES = {
    // Gear state: Inventory State Engine (§1.1 Layer 2)
    gear: {
      owner: 'inventoryStateEngine',
      storeKey: 'inventorySerials',
      apiMethod: 'getSerializedItem',
      describedAs: 'Inventory state (serial.status + allocation)'
    },
    // Phase advancement: ChecklistGate
    phaseAdvance: {
      owner: 'checklistGate',
      storeKey: 'checklistItems',
      apiMethod: 'canAdvanceState',
      describedAs: 'Checklist completion (blocking items cleared or overridden)'
    },
    // Staffing: Schedule / ShiftAssignments
    staffing: {
      owner: 'scheduleEngine',
      storeKey: 'shiftAssignments',
      apiMethod: 'getSchedule',
      describedAs: 'ShiftAssignment status (Confirmed / Acknowledged)'
    },
    // Live execution: ROS ONLY; never used for readiness of not-yet-live shows
    liveExecution: {
      owner: 'runOfShowEngine',
      storeKey: 'runOfShows',
      apiMethod: 'getLiveROSState',
      describedAs: 'RunOfShow live state (Live mode only)'
    },
    // Readiness synthesis: computed; never directly editable
    readiness: {
      owner: 'readinessEngine',
      storeKey: null,
      apiMethod: 'getReadiness',
      describedAs: 'ShowReadiness score (synthesized from warehouse + labor + ROS + checklist + finance)'
    },
    // Financial truth: QuickBooks (cost actuals) + STAGE (operational rollup)
    financialActual: {
      owner: 'quickbooks',
      storeKey: null,
      apiMethod: 'getQBHandoffPacket',
      describedAs: 'QuickBooks (AP/AR) + STAGE rollup at closing'
    },
    // Venue facts: VenueRecord
    venue: {
      owner: 'venueRecord',
      storeKey: 'venues',
      apiMethod: 'getVenue',
      describedAs: 'VenueRecord (dock, union, power, rigging, warning flags)'
    },
    // Project scope: ScopeRecord is immutable after award
    soldScope: {
      owner: 'scopeRecord',
      storeKey: 'scopeRecords',
      apiMethod: 'getScopeRecord',
      describedAs: 'ScopeRecord (frozen at award, baseline for CO deltas)'
    },
    // Active scope = ScopeRecord + approved ChangeOrders
    currentScope: {
      owner: 'pricingEngine',
      storeKey: null,
      apiMethod: 'getCurrentScope',
      describedAs: 'ScopeRecord + approved ChangeOrders (computed)'
    }
  };

  PCG.truthSourceFor = function(domain){
    return PCG.TRUTH_SOURCES[domain] || null;
  };

  /* --------------------------------------------------------------------
     Session (persona switcher for demo)
  -------------------------------------------------------------------- */
  const STORAGE_KEY = 'pcg.persona.id';
  const savedId = (typeof localStorage !== 'undefined') ? localStorage.getItem(STORAGE_KEY) : null;
  const initial = PCG.PERSONAS.find(p=>p.id===savedId) || PCG.PERSONAS[0];

  PCG.user = {
    id: initial.id,
    name: initial.name,
    initials: initial.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase(),
    email: initial.id.replace('p.','').replace(/\./g,'')+'@premiercreativegroup.com',
    role: initial.role,
    landing: initial.landing,
    groups: initial.groups.slice()
  };

  PCG.switchPersona = function(personaId){
    const p = PCG.PERSONAS.find(x=>x.id===personaId);
    if(!p) return false;
    try { localStorage.setItem(STORAGE_KEY, p.id); } catch(e){}
    PCG.user.id = p.id;
    PCG.user.name = p.name;
    PCG.user.initials = p.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
    PCG.user.role = p.role;
    PCG.user.landing = p.landing;
    PCG.user.groups = p.groups.slice();
    PCG.user.email = p.id.replace('p.','').replace(/\./g,'')+'@premiercreativegroup.com';
    return true;
  };

  PCG.hasPermission    = (group)    => PCG.user.groups.indexOf(group) >= 0;
  PCG.hasAnyPermission = (...groups)=> groups.some(g => PCG.hasPermission(g));
  PCG.requireAny       = (...groups)=> {
    if(!groups.some(g=>PCG.hasPermission(g))) {
      const err = new Error('FORBIDDEN'); err.code = 403; err.required = groups; throw err;
    }
  };

  // --- Sensitive data tiers (§19.2) ---
  PCG.TIERS = {
    T1_CREW_PAY_RATES: [PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING],
    T2_MARGINS:        [PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP, PCG.GROUPS.ACCOUNTING],
    T3_BILL_RATES:     [PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.SCHEDULING, PCG.GROUPS.TSMS, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP, PCG.GROUPS.ACCOUNTING],
    T4_GENERAL:        [PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.AE_NO_CONFIRM, PCG.GROUPS.DIRECTORS, PCG.GROUPS.LEADERSHIP, PCG.GROUPS.SCHEDULING, PCG.GROUPS.TSMS, PCG.GROUPS.WH_SUPERVISORS, PCG.GROUPS.WH_TECHS, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.PRODUCER, PCG.GROUPS.PA],
    T5_CREW_OWN_DATA:  [PCG.GROUPS.CREW, PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING]
  };

  PCG.canSeeTier = tierKey => {
    const allowed = PCG.TIERS[tierKey] || [];
    return PCG.hasAnyPermission.apply(null, allowed);
  };

})();
