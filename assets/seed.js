/* ==========================================================================
   PCG STAGE — Extended Domain Seed
   Loads AFTER data.js. Wraps existing projects as Projects w/ child Show,
   attaches lifecycleState, and adds the full entity set required by the spec.
   ========================================================================== */
(function(){
  window.PCG = window.PCG || {};

  /* -----------------------------------------------------------------
     Wrap existing projects with a Show sub-entity + lifecycleState.
     Spec §4.1: Phase 1 → Project has exactly 1 Show.
  ----------------------------------------------------------------- */
  const lifecycleMap = {
    'LCE-2026':     'InPrep',
    'SAE-WCX-2026': 'InPrep',
    'GLBX-GSK26':   'OnShow',
    'WOC-2026':     'Awarded',
    'DAS-BOOTH-26': 'Awarded',
    'TCO-EXPO':     'OnShow',
    'ELSO-SS26':    'Quoted'
  };

  (PCG.projects||[]).forEach(p=>{
    p.aeId   = p.primaryPM;   // placeholder mapping
    p.pmId   = p.secondaryPM || p.primaryPM;
    p.clientId = 'c.'+(p.client||'').toLowerCase().replace(/[^a-z]/g,'').slice(0,10);
    p.show = {
      id: p.code,
      projectCode: p.code,
      name: p.name,
      venueId: p.venueId,
      warehouseId: 'wh.premier-main',
      dates: p.dates,
      lifecycleState: lifecycleMap[p.code] || 'Awarded',
      pmId: p.pmId,
      handoffChecklistComplete: ['InPrep','OnShow','Striking','Returning','Closing','Archived'].includes(lifecycleMap[p.code]||''),
      crewClockInListGeneratedAt: lifecycleMap[p.code]==='OnShow' ? '2026-04-10T06:00' : null,
      closeoutSignedOffAt: null,
      laborActualsFinalizedAt: null,
      financePacketGeneratedAt: null
    };
  });

  /* -----------------------------------------------------------------
     Add two more seeded shows: small corporate + arena + program concept
  ----------------------------------------------------------------- */
  // Small show — fits the "small" category in the seed brief
  if(!PCG.findProject('ACR-BOARD26')){
    PCG.projects.push({
      code: 'ACR-BOARD26',
      name: 'Accrue Holdings — Board Meeting',
      client: 'Accrue Holdings',
      clientAddress: 'Chicago, IL',
      clientId: 'c.accrue',
      aeId: 'p.jspringer', pmId: 'p.koliver',
      primaryPM: 'p.koliver',
      showType: 'small',
      status: 'confirmed',
      health: 'green',
      venueId: 'v.mcormick',
      venueName: 'Private · Ritz Carlton Chicago',
      stageSet: null,
      dates: { prep:'2026-04-18', loadIn:'2026-04-21T08:00', showStart:'2026-04-22T09:00', showEnd:'2026-04-22T17:00', loadOut:'2026-04-22T22:00', ret:'2026-04-24T11:00' },
      oneLiner: '1-day board meeting — small. 1 lectern + 2 screens + comms.',
      quoteNo: 'P01-5601', manifestNo: 'SHORT1', pullSheetNo: 'SM001', customerPO: 'ACR-06', terms:'NET 30', rateDays: 1,
      scopeSold: ['Single screen + lectern','Wireless mic package (4)','Conference call bridge'],
      scopeCurrent: ['Single screen + lectern','Wireless mic package (4)','Conference call bridge'],
      attention: [], risks: [], approvals: [], changes: [], gearSummary:{audio:[],video:[]}, docs:[], pmNotes:'', activity:[],
      show: null
    });
  }
  // Arena show
  if(!PCG.findProject('NAT-TOUR26')){
    PCG.projects.push({
      code: 'NAT-TOUR26',
      name: 'Nationals Tour Kickoff — Arena',
      client: 'Nationals Tour LLC',
      clientAddress: 'Nashville, TN',
      clientId: 'c.natltour',
      aeId: 'p.jspringer', pmId: 'p.ctaylor',
      primaryPM: 'p.ctaylor',
      showType: 'arena',
      status: 'confirmed',
      health: 'amber',
      venueId: 'v.huntington',
      venueName: 'Bridgestone Arena · Nashville',
      stageSet: 'Nova',
      dates: { prep:'2026-05-04', loadIn:'2026-05-14T04:00', showStart:'2026-05-17T19:00', showEnd:'2026-05-17T23:00', loadOut:'2026-05-18T04:00', ret:'2026-05-21T11:00' },
      oneLiner: '20,000-seat arena tour kickoff. Full concert production — flown PA, video wall, flown lighting.',
      quoteNo: 'P01-5702', manifestNo: 'ARENA1', pullSheetNo: 'AR001', customerPO:'NT-2026', terms:'NET 30', rateDays:4,
      scopeSold: ['Flown PA · d&b KSL','Video wall 40x20','Flown lighting rig','5-camera IMAG','Pyro package'],
      scopeCurrent: ['Flown PA · d&b KSL','Video wall 40x20','Flown lighting rig','5-camera IMAG','Pyro package','+ delay tower added'],
      attention: [{ kind:'amber', title:'Pyro permit timeline — Nashville FD', owner:'p.ctaylor', due:'2026-05-10T17:00' }],
      risks: [], approvals: [], changes: [], gearSummary:{audio:[],video:[]}, docs:[], pmNotes:'', activity:[],
      show: null
    });
  }
  // Program-level concept (ELSO portfolio — referenced but not full multi-show build per §4.1 deferral)
  if(!PCG.findProject('ELSO-PROG26')){
    PCG.projects.push({
      code: 'ELSO-PROG26',
      name: 'ELSO — OneSource Program 2026',
      client: 'Credit Acceptance',
      clientAddress: 'Southfield, MI',
      clientId: 'c.creditaccept',
      aeId: 'p.jspringer', pmId: 'p.koliver',
      primaryPM: 'p.koliver',
      showType: 'program-concept',
      status: 'opportunity',
      health: 'gray',
      venueId: null,
      venueName: 'Program across 6 ELSO events (Phase 5+ multi-show)',
      stageSet: 'Lumen (shared)',
      dates: { prep:'2026-06-01', loadIn:'2026-06-10T00:00', showStart:'2026-06-11T00:00', showEnd:'2026-12-01T00:00', loadOut:'2026-12-02T00:00', ret:'2026-12-05T00:00' },
      oneLiner: 'OneSource program — 6 ELSO events leveraging shared Lumen set + crew. Phase-5 multi-show data model.',
      quoteNo: 'P01-PROG-ELSO', manifestNo:null, pullSheetNo:null, customerPO:null, terms:'TBD', rateDays:null,
      scopeSold: ['Shared Lumen stage set','Consolidated crew pool','Unified budget'],
      scopeCurrent: ['Shared Lumen stage set','Consolidated crew pool','Unified budget'],
      attention: [], risks: [], approvals: [], changes: [], gearSummary:{audio:[]}, docs:[], pmNotes:'', activity:[],
      show: null
    });
  }

  // Apply lifecycleState to the new shows too
  lifecycleMap['ACR-BOARD26'] = 'InPrep';
  lifecycleMap['NAT-TOUR26']  = 'Awarded';
  lifecycleMap['ELSO-PROG26'] = 'Opportunity';

  // Re-run show attachment for any new projects
  PCG.projects.forEach(p=>{
    if(!p.show){
      p.show = {
        id: p.code, projectCode:p.code, name:p.name,
        venueId: p.venueId, warehouseId:'wh.premier-main',
        dates: p.dates,
        lifecycleState: lifecycleMap[p.code] || 'Opportunity',
        pmId: p.pmId || p.primaryPM,
        handoffChecklistComplete: ['InPrep','OnShow','Striking','Returning','Closing','Archived'].includes(lifecycleMap[p.code]||''),
        crewClockInListGeneratedAt: null,
        closeoutSignedOffAt: null,
        laborActualsFinalizedAt: null,
        financePacketGeneratedAt: null
      };
    }
  });

  /* -----------------------------------------------------------------
     Venues — add McCormick variant if missing
  ----------------------------------------------------------------- */
  if(!PCG.findVenue('v.mcormick')){
    PCG.venues.push({ id:'v.mcormick', name:'Private · Ritz Carlton Chicago', address:'160 E Pearson St, Chicago, IL', loadInNotes:'Loading dock on side. No union.', dockHours:'6am–11pm', union:false, knownQuirks:[] });
  }

  /* -----------------------------------------------------------------
     Inventory catalog + categories
  ----------------------------------------------------------------- */
  PCG.inventoryCategories = [
    { id:'cat.audio.lineArray',  name:'Audio / Line Array',       department:'Audio' },
    { id:'cat.audio.subs',       name:'Audio / Subs',              department:'Audio' },
    { id:'cat.audio.wireless',   name:'Audio / Wireless',          department:'Audio' },
    { id:'cat.audio.console',    name:'Audio / Console',           department:'Audio' },
    { id:'cat.audio.monitors',   name:'Audio / Stage Monitors',    department:'Audio' },
    { id:'cat.video.screenCtl',  name:'Video / Screen Control',    department:'Video' },
    { id:'cat.video.cams',       name:'Video / Cameras',           department:'Video' },
    { id:'cat.video.monitors',   name:'Video / Monitors',          department:'Video' },
    { id:'cat.video.recording',  name:'Video / Recording',         department:'Video' },
    { id:'cat.lighting.console', name:'Lighting / Console',        department:'Lighting' },
    { id:'cat.lighting.moving',  name:'Lighting / Moving Lights',  department:'Lighting' },
    { id:'cat.scenic.led',       name:'Scenic / LED',              department:'Scenic' },
    { id:'cat.scenic.truss',     name:'Scenic / Truss',            department:'Scenic' },
    { id:'cat.breakout',         name:'Breakout Standard Kit',     department:'Warehouse' }
  ];

  // Catalog — day rates from real LCE quote. Replacement costs illustrative. perItemCost intentionally null (cost basis service returns 0).
  PCG.inventory = [
    // AUDIO
    { id:'inv.db-j8',      categoryId:'cat.audio.lineArray', name:'d&b J8 Line Array Speaker', manufacturer:'d&b Audiotechnik', model:'J8',  qty:24, rates:{ day:150, week:450, twoWeek:600, fourWeek:900 }, replacementCost:18000, perItemCost:null, oocCount:0, missingCount:0, warehouseLocationId:'wh.A.12.B' },
    { id:'inv.db-jsub',    categoryId:'cat.audio.subs',      name:'d&b JSub Subwoofer',        manufacturer:'d&b Audiotechnik', model:'JSub', qty:10, rates:{ day:200, week:600 }, replacementCost:14000, perItemCost:null, oocCount:0, missingCount:0 },
    { id:'inv.db-q1',      categoryId:'cat.audio.lineArray', name:'d&b Q1 Line-Array 4-pack',  manufacturer:'d&b', model:'Q1-4pk', qty:6, rates:{ day:500 }, replacementCost:22000, perItemCost:null },
    { id:'inv.db-q10',     categoryId:'cat.audio.lineArray', name:'d&b Q10 2-pack',             manufacturer:'d&b', model:'Q10-2pk', qty:6, rates:{ day:250 }, replacementCost:9000 },
    { id:'inv.la-k2',      categoryId:'cat.audio.lineArray', name:'L-Acoustics K2 (sub-rental)',manufacturer:'L-Acoustics', model:'K2', qty:12, rates:{ day:180 }, replacementCost:25000 },
    { id:'inv.shure-axd',  categoryId:'cat.audio.wireless',  name:'Shure Axient Digital 4-pack', manufacturer:'Shure', model:'AD4Q', qty:8, rates:{ day:800 }, replacementCost:22000 },
    { id:'inv.shure-axd8', categoryId:'cat.audio.wireless',  name:'Shure Axient Digital 8-pack', manufacturer:'Shure', model:'AD4Q-8', qty:4, rates:{ day:1600 }, replacementCost:44000 },
    { id:'inv.yam-cl5',    categoryId:'cat.audio.console',   name:'Yamaha CL5 Audio Console',    manufacturer:'Yamaha', model:'CL5', qty:4, rates:{ day:1400 }, replacementCost:28000 },
    // VIDEO
    { id:'inv.barco-e2',   categoryId:'cat.video.screenCtl', name:'Barco E2 4K Screen Management', manufacturer:'Barco', model:'E2', qty:3, rates:{ day:4500 }, replacementCost:180000 },
    { id:'inv.ursa-g2',    categoryId:'cat.video.cams',      name:'BMD URSA Broadcast G2 Camera (w/o lens)', manufacturer:'Blackmagic', model:'URSA G2', qty:8, rates:{ day:1000 }, replacementCost:7000 },
    { id:'inv.fuji-42x',   categoryId:'cat.video.cams',      name:'Fujinon 42x Camera Lens Kit', manufacturer:'Fujinon', model:'HA42x9.7', qty:2, rates:{ day:800 }, replacementCost:46000 },
    { id:'inv.fuji-55x',   categoryId:'cat.video.cams',      name:'Fujinon 55x Long Throw Lens', manufacturer:'Fujinon', model:'XA-55x', qty:1, rates:{ day:1200 }, replacementCost:70000 },
    { id:'inv.mon-50dual', categoryId:'cat.video.monitors',  name:'50" Dual UHD Monitor Kit (Samsung Crystal)', manufacturer:'Samsung', model:'QN50', qty:14, rates:{ day:600 }, replacementCost:2400 },
    { id:'inv.bmd-recdual',categoryId:'cat.video.recording', name:'BMD 4K Dual Recorders Kit',  manufacturer:'Blackmagic', model:'HyperDeck', qty:6, rates:{ day:800 }, replacementCost:4000 },
    // LIGHTING
    { id:'inv.gma3',       categoryId:'cat.lighting.console',name:'grandMA3 Full-Size Console', manufacturer:'MA Lighting', model:'MA3', qty:2, rates:{ day:900 }, replacementCost:75000 },
    { id:'inv.robe-spiider',categoryId:'cat.lighting.moving',name:'Robe Spiider LED Moving Light',manufacturer:'Robe', model:'Spiider', qty:32, rates:{ day:80 }, replacementCost:7800 },
    // SCENIC
    { id:'inv.ledf-3p9',   categoryId:'cat.scenic.led',      name:'3.9mm LED Panel (ROE CB3.9)', manufacturer:'ROE', model:'CB3.9', qty:240, rates:{ day:25 }, replacementCost:2800 },
    { id:'inv.truss-12x', categoryId:'cat.scenic.truss',     name:'12" Box Truss — 10\' section', manufacturer:'Tomcat', model:'12"', qty:80, rates:{ day:20 }, replacementCost:650 },
    // BREAKOUT
    { id:'inv.brk-8table', categoryId:'cat.breakout', name:'8\' Folding Table', manufacturer:'House', qty:40, rates:{ day:15 }, replacementCost:180 },
    { id:'inv.brk-lcd',    categoryId:'cat.breakout', name:'55" LCD Breakout Display', manufacturer:'Samsung', qty:36, rates:{ day:75 }, replacementCost:900 },
    { id:'inv.brk-wlshh',  categoryId:'cat.breakout', name:'Wireless Handheld (Shure QLX-D)', manufacturer:'Shure', qty:30, rates:{ day:60 }, replacementCost:1200 },
    { id:'inv.brk-podmic', categoryId:'cat.breakout', name:'Pod Microphone (Earthworks FM500)', manufacturer:'Earthworks', qty:80, rates:{ day:35 }, replacementCost:580 },
    { id:'inv.brk-mixer',  categoryId:'cat.breakout', name:'Allen & Heath QU-16 Mixer', manufacturer:'A&H', qty:32, rates:{ day:150 }, replacementCost:2200 },
    { id:'inv.brk-spkr',   categoryId:'cat.breakout', name:'HS Speaker + Stand (QSC K10.2)', manufacturer:'QSC', qty:36, rates:{ day:120 }, replacementCost:900 }
  ];

  /* -----------------------------------------------------------------
     Inventory serials (subset for scan demo)
  ----------------------------------------------------------------- */
  PCG.inventorySerials = [];
  const seedSerials = (itemId, n, prefix) => {
    for(let i=1;i<=n;i++){
      PCG.inventorySerials.push({
        id:`${prefix}-${String(i).padStart(3,'0')}`,
        itemId, serial:`${prefix}${String(i).padStart(3,'0')}`,
        barcode:`${prefix}${String(i).padStart(6,'0')}`, // Code 128 string
        status:'Available', currentShowId:null, currentLocationId:'wh.A.1.A'
      });
    }
  };
  seedSerials('inv.db-j8',       24, 'J8');
  seedSerials('inv.db-jsub',     10, 'JSUB');
  seedSerials('inv.shure-axd',    8, 'AXD');
  seedSerials('inv.mon-50dual',  14, 'LCD50');
  seedSerials('inv.ursa-g2',      8, 'URSA');
  seedSerials('inv.brk-lcd',     36, 'LCD55');
  // Mark a couple OOC & Missing for realism
  if(PCG.inventorySerials[0]) PCG.inventorySerials[0].status = 'OnShow';
  if(PCG.inventorySerials[5]) PCG.inventorySerials[5].status = 'OOC';

  /* -----------------------------------------------------------------
     Allocations — simulate real holds on live shows
  ----------------------------------------------------------------- */
  PCG.allocations = [
    // LCE Las Vegas — confirmed holds
    { id:'alloc.lce.j8',    showId:'LCE-2026',   inventoryItemId:'inv.db-j8',      qty:24, fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'OnShow', sourceType:'owned' },
    { id:'alloc.lce.jsub',  showId:'LCE-2026',   inventoryItemId:'inv.db-jsub',    qty:12, fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'Pulled', sourceType:'owned' }, // CONFLICT: only 10 owned
    { id:'alloc.lce.q1',    showId:'LCE-2026',   inventoryItemId:'inv.db-q1',      qty:7,  fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'OnShow', sourceType:'owned' }, // conflict: only 6 owned
    { id:'alloc.lce.axd8',  showId:'LCE-2026',   inventoryItemId:'inv.shure-axd8', qty:1,  fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'OnShow', sourceType:'owned' },
    { id:'alloc.lce.e2',    showId:'LCE-2026',   inventoryItemId:'inv.barco-e2',   qty:1,  fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'OnShow', sourceType:'owned' },
    { id:'alloc.lce.ursa',  showId:'LCE-2026',   inventoryItemId:'inv.ursa-g2',    qty:5,  fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'OnShow', sourceType:'owned' },
    { id:'alloc.lce.mon',   showId:'LCE-2026',   inventoryItemId:'inv.mon-50dual', qty:9,  fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'OnShow', sourceType:'owned' },
    // SAE WCX Detroit — overlapping monitor hold (conflict 9+9=18 vs 14 supply)
    { id:'alloc.sae.mon',   showId:'SAE-WCX-2026', inventoryItemId:'inv.mon-50dual', qty:9, fromDate:'2026-04-14', toDate:'2026-04-20', holdType:'confirmed', status:'Pulled', sourceType:'owned' },
    { id:'alloc.sae.brkLcd',showId:'SAE-WCX-2026', inventoryItemId:'inv.brk-lcd',    qty:30,fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'Pulled', sourceType:'owned' },
    { id:'alloc.sae.brkPod',showId:'SAE-WCX-2026', inventoryItemId:'inv.brk-podmic', qty:66,fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'Pulled', sourceType:'owned' },
    { id:'alloc.sae.brkWlshh',showId:'SAE-WCX-2026', inventoryItemId:'inv.brk-wlshh', qty:26,fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'Pulled', sourceType:'owned' },
    { id:'alloc.sae.mixer', showId:'SAE-WCX-2026', inventoryItemId:'inv.brk-mixer',  qty:27,fromDate:'2026-04-10', toDate:'2026-04-20', holdType:'confirmed', status:'Pulled', sourceType:'owned' },
    // Globex LV — currently on show
    { id:'alloc.glbx.j8',   showId:'GLBX-GSK26', inventoryItemId:'inv.db-j8',      qty:12, fromDate:'2026-04-08', toDate:'2026-04-18', holdType:'confirmed', status:'OnShow', sourceType:'owned' },
    // Nationals Tour — large hold, future
    { id:'alloc.nat.j8',    showId:'NAT-TOUR26', inventoryItemId:'inv.db-j8',      qty:24, fromDate:'2026-05-14', toDate:'2026-05-21', holdType:'confirmed', status:'Hold', sourceType:'owned' },
    { id:'alloc.nat.ledf',  showId:'NAT-TOUR26', inventoryItemId:'inv.ledf-3p9',   qty:240,fromDate:'2026-05-14', toDate:'2026-05-21', holdType:'confirmed', status:'Hold', sourceType:'owned' },
    // Accrue small show
    { id:'alloc.acr.mon',   showId:'ACR-BOARD26', inventoryItemId:'inv.mon-50dual',qty:1,  fromDate:'2026-04-21', toDate:'2026-04-24', holdType:'confirmed', status:'Hold' },
    { id:'alloc.acr.axd',   showId:'ACR-BOARD26', inventoryItemId:'inv.shure-axd', qty:1,  fromDate:'2026-04-21', toDate:'2026-04-24', holdType:'confirmed', status:'Hold' }
  ];

  /* -----------------------------------------------------------------
     Sub-rentals (RPOs)
  ----------------------------------------------------------------- */
  PCG.subRentals = [
    { id:'rpo.lce.jsub', projectCode:'LCE-2026', showId:'LCE-2026', vendorId:'solotech', vendorName:'Solotech',
      itemId:'inv.db-jsub', itemDescription:'d&b JSub Sub-Rental (2 units)', qty:2,
      fromDate:'2026-04-10', toDate:'2026-04-20', quotedCost:4200, holdExpiry:'2026-04-15T16:00',
      status:'PendingApproval', vendorRef:'SOL-2026-0418', invoiceAmount:null },
    { id:'rpo.nat.ksl',  projectCode:'NAT-TOUR26', showId:'NAT-TOUR26', vendorId:'prg', vendorName:'PRG',
      itemId:'inv.la-k2', itemDescription:'L-Acoustics KSL package', qty:1,
      fromDate:'2026-05-14', toDate:'2026-05-21', quotedCost:18500, holdExpiry:'2026-05-08T00:00',
      status:'Approved', vendorRef:'PRG-25-9012', invoiceAmount:18500 }
  ];

  /* -----------------------------------------------------------------
     Service tickets (damage tracking)
  ----------------------------------------------------------------- */
  PCG.serviceTickets = [
    { id:'svc.001', serialId:'J8-003', itemId:'inv.db-j8', showId:'GLBX-GSK26',
      reportedById:'p.arachilla', description:'Grille dented during load-in', diagnosis:'Cosmetic only — no acoustic loss',
      partsNeeded:'Replacement grille panel', laborHours:1.5, estimatedCost:280,
      status:'Open', missing:false, clientCaused:true,
      warrantyVendor:'d&b', warrantyExpiry:'2028-01-01', warrantyClaimStatus:'N/A' },
    { id:'svc.002', serialId:'LCD55-017', itemId:'inv.brk-lcd', showId:'SAE-WCX-2026',
      reportedById:'p.arachilla', description:'Panel flickers under load — cable or panel',
      diagnosis:null, partsNeeded:null, laborHours:0, estimatedCost:null,
      status:'Open', missing:false, clientCaused:false }
  ];

  /* -----------------------------------------------------------------
     Crew positions + rate cards
  ----------------------------------------------------------------- */
  PCG.rateCardVersions = [
    { id:'rc.2026.Q1', name:'2026 Q1', effectiveFrom:'2026-01-01', effectiveTo:'2026-06-30' },
    { id:'rc.2026.Q3', name:'2026 Q3', effectiveFrom:'2026-07-01', effectiveTo:'2026-12-31' }
  ];

  // PCG naming convention: PP=Production, PA=Production Audio, PL=Production Lighting, PV=Production Video, UHP=Union House Person
  PCG.crewPositions = [
    // PP — Production
    { id:'pos.td',      name:'PP - Production - Technical Director (TD)', displayName:'Technical Director (TD)', department:'Production', union:null, unionLocal:null,
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:110, billRate:160, dayRate:400}] },
    { id:'pos.caller',  name:'PP - Production - Show Caller', displayName:'Show Caller', department:'Production',union:null, unionLocal:null,
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:90, billRate:135, dayRate:400}] },
    { id:'pos.proj',    name:'PP - Production - Project Manager', displayName:'Project Manager', department:'Production', union:null, unionLocal:null,
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:100, billRate:150, dayRate:400}] },

    // PA — Production Audio
    { id:'pos.a1',      name:'PA - Audio - Tech (A1)',  displayName:'Audio A1',  department:'Audio',   union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:85, billRate:125, dayRate:375}] },
    { id:'pos.a2',      name:'PA - Audio - Tech (A2)',  displayName:'Audio A2',  department:'Audio',   union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:60, billRate:90, dayRate:250}] },

    // PV — Production Video
    { id:'pos.v1',      name:'PV - Video - Switcher Screen(s)', displayName:'Video V1 / Switcher', department:'Video', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:80, billRate:120, dayRate:350}] },
    { id:'pos.dir.v',   name:'PV - Video - Director',   displayName:'Video Director',  department:'Video',   union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:95, billRate:140, dayRate:400}] },
    { id:'pos.cam',     name:'PV - Video - Camera Operator', displayName:'Camera Operator', department:'Video', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:70, billRate:105, dayRate:325}] },
    { id:'pos.led',     name:'PV - Video - LED Tech',   displayName:'LED Lead',        department:'Video', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:70, billRate:105, dayRate:300}] },

    // PL — Production Lighting
    { id:'pos.ld',      name:'PL - Lighting - Director (LD)',   displayName:'Lighting LD', department:'Lighting', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:82, billRate:122, dayRate:375}] },
    { id:'pos.me',      name:'PL - Lighting - Master Electrician (ME)', displayName:'Lighting ME', department:'Lighting', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:55, billRate:85, dayRate:225}] },

    // UHP — Union House Persons / general labor
    { id:'pos.uhp.a',   name:'UHP - Hand - Audio', displayName:'Audio Hand', department:'Audio', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:40, billRate:65, dayRate:175}] },
    { id:'pos.uhp.l',   name:'UHP - Hand - Lighting', displayName:'Lighting Hand', department:'Lighting', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:40, billRate:65, dayRate:175}] },
    { id:'pos.uhp.rig', name:'UHP - Rigger - General', displayName:'Rigger', department:'Rigging', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:60, billRate:95, dayRate:300}] },
    { id:'pos.uhp.carp',name:'UHP - Carpenter / Stagehand', displayName:'Carpenter / Stagehand', department:'Scenic', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:45, billRate:70, dayRate:200}] },

    // Mixed / utility
    { id:'pos.avtech',  name:'AV Tech', displayName:'AV Tech', department:'Mixed', union:null, unionLocal:null,
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:45, billRate:75, dayRate:200}] }
  ];

  // Industry experience verticals (from Lasso screenshot)
  PCG.experienceVerticals = [
    'AV', 'Corporate', 'Events', 'Live Entertainment', 'Sports',
    'Festivals', 'Trade Shows', 'Exhibit', 'Broadcast', 'Closed Studio', 'Theatre / Theatrical'
  ];

  /* -----------------------------------------------------------------
     Crew Members
  ----------------------------------------------------------------- */
  const basePeople = PCG.people||[];
  PCG.crewMembers = basePeople.map(p=>({
    id: p.id, name: p.name, email:p.id.replace('p.','')+'@premiercreativegroup.com',
    phone:'+1 313 555 0'+String(Math.floor(100+Math.random()*900)),
    employmentType: ['p.mchen'].includes(p.id) ? '1099' : 'W2',
    market: ['Detroit','Las Vegas','Chicago'],
    qualifications: [],
    doNotUse: false,
    performanceRatings: []
  }));
  // qualifications map — rating 1-5
  const qMap = {
    'p.pshah':    [['pos.a1',5],['pos.a2',5]],
    'p.mchen':    [['pos.a1',4.5]],
    'p.dkim':     [['pos.v1',5],['pos.dir.v',4.5],['pos.cam',4]],
    'p.eliott':   [['pos.ld',5],['pos.me',5]],
    'p.ctaylor':  [['pos.td',5],['pos.proj',4.5]],
    'p.jgerber':  [['pos.caller',5],['pos.td',4]],
    'p.rbenoit':  [['pos.led',5],['pos.cam',4.5],['pos.avtech',4]],
    'p.dmar':     [['pos.avtech',4.5],['pos.cam',3.5]],
    'p.arachilla':[['pos.avtech',4],['pos.uhp.a',4.5]],
    'p.jspringer':[['pos.proj',5],['pos.td',4]],
    'p.tscheff':  [['pos.proj',5],['pos.td',4.5]],
    'p.coliver':  [['pos.proj',4.5]],
    'p.jsharp':   [['pos.proj',5]]
  };

  // Enriched Lasso-style profile fields
  const profileMap = {
    'p.pshah':    { homeBase:'Detroit, MI',   markets:['Detroit','Las Vegas','Chicago'], address:{street:'35390 Churchill St',city:'Richmond',state:'MI',zip:'48062'}, employeeCode:'PS.026', username:'p.shah@premiercreative' },
    'p.mchen':    { homeBase:'Detroit, MI',   markets:['Detroit','Nashville'],           address:{street:'1204 Main St', city:'Detroit',state:'MI',zip:'48201'},  employeeCode:'MC.014', username:'m.chen@premiercreative' },
    'p.dkim':     { homeBase:'Las Vegas, NV', markets:['Las Vegas','Detroit'],           address:{street:'8310 Sahara', city:'Las Vegas',state:'NV',zip:'89103'}, employeeCode:'DK.008', username:'d.kim@premiercreative' },
    'p.ctaylor':  { homeBase:'Detroit, MI',   markets:['Detroit','Las Vegas','Nashville','Chicago'], address:{street:'4402 Woodward', city:'Detroit',state:'MI',zip:'48201'}, employeeCode:'CT.002', username:'c.taylor@premiercreative' },
    'p.arachilla':{ homeBase:'Detroit, MI',   markets:['Detroit'],                        address:{street:'220 Atwater', city:'Detroit',state:'MI',zip:'48226'}, employeeCode:'AR.012', username:'a.rachilla@premiercreative' }
  };

  PCG.crewMembers.forEach(m => {
    // Qualifications with ratings
    (qMap[m.id]||[]).forEach(([posId, rating])=>{
      m.qualifications.push({ positionId: posId, rating });
    });

    // Profile enrichment
    const p = profileMap[m.id] || {};
    m.homeBase = p.homeBase || 'Detroit, MI';
    m.markets = p.markets || m.market || ['Detroit'];
    m.market = m.markets;
    m.address = p.address || null;
    m.employeeCode = p.employeeCode || null;
    m.username = p.username || null;

    // Experience ratings by vertical (from Lasso profile pattern)
    m.experience = {};
    (PCG.experienceVerticals||[]).forEach(v => {
      const pool = ['Expert','Strong','Some','Yet', 'No Response'];
      m.experience[v] = pool[Math.floor(Math.random()*pool.length)];
    });
    // Top 5 crew members are experts at Corporate + AV
    if(['p.pshah','p.dkim','p.ctaylor','p.eliott','p.jgerber','p.mchen'].includes(m.id)){
      m.experience['Corporate'] = 'Expert';
      m.experience['AV'] = 'Expert';
    }

    // Onboarding status
    m.onboardingStatus = {
      w9: true, i9: true, emergencyContact: true,
      rateAgreement: m.employmentType==='1099' ? (Math.random() > 0.1) : true,
      contractStatus: m.employmentType==='1099' ? 'Signed' : null
    };
    m.payrollReadiness = m.onboardingStatus.w9 && m.onboardingStatus.i9 && (m.employmentType!=='1099' || m.onboardingStatus.rateAgreement);

    // Emergency contact
    m.emergencyContact = {
      name: m.name.split(' ')[0] + ' (Spouse)',
      phone: '+1 555 555 ' + String(Math.floor(1000 + Math.random()*9000)),
      relationship: 'Spouse'
    };

    // Performance ratings (per-show)
    m.performanceRatings = [];
    const showsWorked = (PCG.shiftAssignments||[]).filter(s=>s.crewMemberId===m.id && s.status==='Completed');
    showsWorked.forEach(a => {
      m.performanceRatings.push({
        showId: a.showId,
        rating: 4 + Math.random(),
        notes: '',
        ratedById: 'p.ctaylor'
      });
    });

    // Client preferences
    m.clientPreferences = [];
    if(m.id === 'p.ctaylor') m.clientPreferences.push({ clientId:'c.littlecae', note:'LCE client has asked for Chris specifically', type:'preferred' });
    if(m.id === 'p.pshah')   m.clientPreferences.push({ clientId:'c.littlecae', note:'Requested by LCE for wireless coord', type:'preferred' });

    // Certifications
    m.certifications = [];
    if(['p.ctaylor','p.eliott','p.rbenoit'].includes(m.id)){
      m.certifications.push({ type:'ETCP - Rigging', issuedAt:'2024-06-01', expiresAt:'2027-06-01' });
    }
    if(m.id === 'p.eliott'){
      m.certifications.push({ type:'OSHA 30', issuedAt:'2023-03-15', expiresAt:'2026-03-15' });
    }
  });

  /* -----------------------------------------------------------------
     Shift Assignments (realistic w/ statuses)
  ----------------------------------------------------------------- */
  const showDates = (code, start, end) => {
    const out=[]; const d=new Date(start); const e=new Date(end);
    while(d<=e){ out.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()+1); }
    return out;
  };

  PCG.shiftAssignments = [
    // LCE
    { id:'sa.lce.pm', showId:'LCE-2026', crewMemberId:'p.jspringer', positionId:'pos.td', positionGroup:'Core', dates:showDates('LCE-2026','2026-04-10','2026-04-15'), callTime:'06:00', status:'Confirmed' },
    { id:'sa.lce.td', showId:'LCE-2026', crewMemberId:'p.ctaylor',  positionId:'pos.td', positionGroup:'Core', dates:showDates('LCE-2026','2026-04-10','2026-04-15'), callTime:'06:00', status:'Confirmed' },
    { id:'sa.lce.sc', showId:'LCE-2026', crewMemberId:'p.jgerber',  positionId:'pos.caller', positionGroup:'Core', dates:showDates('LCE-2026','2026-04-12','2026-04-15'), callTime:'08:00', status:'Confirmed' },
    { id:'sa.lce.a1', showId:'LCE-2026', crewMemberId:'p.pshah',    positionId:'pos.a1', positionGroup:'Audio', dates:showDates('LCE-2026','2026-04-10','2026-04-15'), callTime:'06:00', status:'Confirmed', note:'REASSIGNED from Mike Chen' },
    { id:'sa.lce.v1', showId:'LCE-2026', crewMemberId:'p.dkim',     positionId:'pos.v1', positionGroup:'Video', dates:showDates('LCE-2026','2026-04-10','2026-04-15'), callTime:'06:00', status:'Confirmed' },
    { id:'sa.lce.ld', showId:'LCE-2026', crewMemberId:'p.eliott',   positionId:'pos.ld', positionGroup:'Lighting', dates:showDates('LCE-2026','2026-04-10','2026-04-15'), callTime:'06:00', status:'Confirmed' },
    { id:'sa.lce.a2', showId:'LCE-2026', crewMemberId:null,         positionId:'pos.a2', positionGroup:'Audio', dates:showDates('LCE-2026','2026-04-10','2026-04-15'), callTime:'06:00', status:'Invited' },
    // SAE
    { id:'sa.sae.pm', showId:'SAE-WCX-2026', crewMemberId:'p.tscheff', positionId:'pos.td', positionGroup:'Core', dates:showDates('SAE-WCX-2026','2026-04-10','2026-04-16'), callTime:'07:00', status:'Confirmed' },
    { id:'sa.sae.td', showId:'SAE-WCX-2026', crewMemberId:'p.ctaylor', positionId:'pos.td', positionGroup:'Core', dates:showDates('SAE-WCX-2026','2026-04-14','2026-04-16'), callTime:'07:00', status:'Confirmed' },
    { id:'sa.sae.a1', showId:'SAE-WCX-2026', crewMemberId:'p.mchen',   positionId:'pos.a1', positionGroup:'Audio', dates:showDates('SAE-WCX-2026','2026-04-14','2026-04-16'), callTime:'07:00', status:'Confirmed' },
    { id:'sa.sae.fl140', showId:'SAE-WCX-2026', crewMemberId:'p.dkim',  positionId:'pos.v1', positionGroup:'Floor Lead', dates:showDates('SAE-WCX-2026','2026-04-13','2026-04-16'), callTime:'08:00', status:'Confirmed' },
    // Globex LV (on show)
    { id:'sa.glbx.td', showId:'GLBX-GSK26', crewMemberId:'p.ctaylor', positionId:'pos.td', positionGroup:'Core', dates:showDates('GLBX-GSK26','2026-04-08','2026-04-13'), callTime:'06:00', status:'Completed' }
  ];

  PCG.availabilityBlocks = [
    { id:'ab.001', crewMemberId:'p.dmar', fromDate:'2026-04-25', toDate:'2026-04-30', reason:'Pre-booked vacation' }
  ];

  PCG.travelRecords = [
    { id:'tr.lce.pshah', crewMemberId:'p.pshah', showId:'LCE-2026',
      flightConfirmation:'DL-Q87H4X', airline:'Delta',
      departureCity:'DTW', arrivalCity:'LAS',
      departureTime:'2026-04-10T06:45', arrivalTime:'2026-04-10T08:30',
      hotelName:'Caesars Palace (Crew Block)', hotelConfirmation:'CP-2026-1141',
      carRental:null, perDiemRate:75, perDiemDays:6, perDiemReimbursementSource:'PCG Card', travelCostActual:540 },
    { id:'tr.lce.dkim', crewMemberId:'p.dkim', showId:'LCE-2026',
      flightConfirmation:'DL-B77G9P', airline:'Delta',
      departureCity:'DTW', arrivalCity:'LAS',
      departureTime:'2026-04-10T06:45', arrivalTime:'2026-04-10T08:30',
      hotelName:'Caesars Palace (Crew Block)', hotelConfirmation:'CP-2026-1142',
      carRental:null, perDiemRate:75, perDiemDays:6, perDiemReimbursementSource:'PCG Card', travelCostActual:540 }
  ];

  PCG.laborActuals = [
    { id:'la.glbx.ctaylor', shiftAssignmentId:'sa.glbx.td', showId:'GLBX-GSK26',
      scheduledHours: 48, workedHours: 52, otHours: 4, dtHours:0, variance:4, lockedAt:null, payRate:110, totalCost: 48*110 + 4*110*1.5 }
  ];

  /* -----------------------------------------------------------------
     Pull Sheets + Lines + Scans
  ----------------------------------------------------------------- */
  PCG.pullSheets = [
    { id:'ps.lce.audio', showId:'LCE-2026', department:'Audio',
      status:'Shipped',
      finalizedById:'p.arachilla', authorizedById:'p.svance', authorizedAt:'2026-04-09T16:00',
      lines:[
        { id:'psl.lce.a.1', inventoryItemId:'inv.db-j8',   qty:24, scanRequired:true, scanStatus:'verified', serialsAssigned:['J8-001','J8-002','J8-003','J8-004'] },
        { id:'psl.lce.a.2', inventoryItemId:'inv.db-jsub', qty:12, scanRequired:true, scanStatus:'verified', serialsAssigned:['JSUB-001','JSUB-002','JSUB-003','JSUB-004','JSUB-005','JSUB-006','JSUB-007','JSUB-008','JSUB-009','JSUB-010'] },
        { id:'psl.lce.a.3', inventoryItemId:'inv.shure-axd8', qty:1, scanRequired:true, scanStatus:'verified' }
      ] },
    { id:'ps.lce.video', showId:'LCE-2026', department:'Video',
      status:'Shipped',
      finalizedById:'p.arachilla', authorizedById:'p.svance', authorizedAt:'2026-04-09T17:00',
      lines:[
        { id:'psl.lce.v.1', inventoryItemId:'inv.barco-e2', qty:1, scanRequired:true, scanStatus:'verified' },
        { id:'psl.lce.v.2', inventoryItemId:'inv.ursa-g2',  qty:5, scanRequired:true, scanStatus:'verified' },
        { id:'psl.lce.v.3', inventoryItemId:'inv.mon-50dual',qty:9, scanRequired:true, scanStatus:'verified' }
      ] },
    { id:'ps.sae.breakout', showId:'SAE-WCX-2026', department:'Breakout',
      status:'InProgress',
      finalizedById:null, authorizedById:null, authorizedAt:null,
      lines:[
        { id:'psl.sae.b.1', inventoryItemId:'inv.brk-lcd',   qty:30, scanRequired:true, scanStatus:'pending' },
        { id:'psl.sae.b.2', inventoryItemId:'inv.brk-podmic',qty:66, scanRequired:true, scanStatus:'pending' },
        { id:'psl.sae.b.3', inventoryItemId:'inv.brk-wlshh', qty:26, scanRequired:true, scanStatus:'pending' },
        { id:'psl.sae.b.4', inventoryItemId:'inv.brk-mixer', qty:27, scanRequired:true, scanStatus:'pending' }
      ] },
    { id:'ps.acr.audio', showId:'ACR-BOARD26', department:'Audio',
      status:'NotStarted',
      finalizedById:null, authorizedById:null,
      lines:[
        { id:'psl.acr.a.1', inventoryItemId:'inv.shure-axd', qty:1, scanRequired:true, scanStatus:'pending' },
        { id:'psl.acr.a.2', inventoryItemId:'inv.mon-50dual',qty:1, scanRequired:true, scanStatus:'pending' }
      ] }
  ];

  PCG.scanRecords = [];  // populated by scan UI

  /* -----------------------------------------------------------------
     Manifests + Vehicles
  ----------------------------------------------------------------- */
  PCG.vehicles = [
    { id:'veh.12', name:'Truck #12', type:'semi', licensePlate:'MI-2612', status:'On Show' },
    { id:'veh.07', name:'Truck #07', type:'semi', licensePlate:'MI-2607', status:'On Show' },
    { id:'veh.22', name:'Truck #22', type:'box',  licensePlate:'MI-2622', status:'On Route' },
    { id:'veh.08', name:'Truck #08', type:'semi', licensePlate:'MI-2608', status:'On Show' }
  ];
  PCG.manifests = [
    { id:'man.lce.out1', showId:'LCE-2026', vehicleId:'veh.12', vehicle:'Truck #12 (semi)',
      driverId:'drv.jreyes', driverName:'Jose Reyes',
      departureDate:'2026-04-08T05:00', arrivalDate:'2026-04-10T05:30',
      status:'Delivered',
      dockInfo:'Caesars Forum — Dock B. Window 06:00–06:30.',
      address:'3911 Koval Ln, Las Vegas, NV',
      loadZones:[ { zone:'Audio', cases:22 }, { zone:'Video', cases:18 } ] },
    { id:'man.sae.out1', showId:'SAE-WCX-2026', vehicleId:'veh.22', vehicle:'Truck #22 (26 box + liftgate)',
      driverId:'drv.mhahn', driverName:'Maria Hahn',
      departureDate:'2026-04-09T07:00', arrivalDate:'2026-04-10T09:00',
      status:'Departed',
      dockInfo:'Huntington Place — Dock 3 Atwater. Window 09:00–09:30. Liftgate required.',
      address:'1 Washington Blvd, Detroit, MI 48226',
      loadZones:[ { zone:'Breakout Kit A', cases:38 }, { zone:'Breakout Kit B', cases:42 } ] }
  ];

  /* -----------------------------------------------------------------
     Quotes + Revisions + Lines + ScopeRecord
  ----------------------------------------------------------------- */
  PCG.quotes = [
    { id:'q.LCE-2026.v3', projectCode:'LCE-2026', showId:'LCE-2026',
      quoteNo:'P01-5437', status:'Awarded',
      activeRevisionId:'qr.LCE-2026.v3',
      termsText:'50% / NET 30 · Tax Exempt', depositPct:0.5,
      totalRevenue:397799.61, totalCost:265000, margin:0.334 },
    { id:'q.SAE-WCX-2026.v1', projectCode:'SAE-WCX-2026', showId:'SAE-WCX-2026',
      quoteNo:'P01-5481', status:'Awarded',
      activeRevisionId:'qr.SAE-WCX-2026.v1',
      termsText:'NET 30', depositPct:0.5, totalRevenue:512000, totalCost:362000, margin:0.293 },
    { id:'q.ACR-BOARD26.v1', projectCode:'ACR-BOARD26', showId:'ACR-BOARD26',
      quoteNo:'P01-5601', status:'Awarded',
      activeRevisionId:'qr.ACR-BOARD26.v1',
      termsText:'NET 30', depositPct:0.5, totalRevenue:4800, totalCost:950, margin:0.80 },
    { id:'q.NAT-TOUR26.v2', projectCode:'NAT-TOUR26', showId:'NAT-TOUR26',
      quoteNo:'P01-5702', status:'Issued',
      activeRevisionId:'qr.NAT-TOUR26.v2',
      termsText:'NET 30', depositPct:0.5, totalRevenue:185000, totalCost:118000, margin:0.362 }
  ];

  const baseQuoteLines = [
    { id:'qln.1', packageName:'Audio · Main System', type:'Rental', inventoryItemId:'inv.db-j8', description:'d&b J8 Line Array', qty:24, rateTier:'day', unitPrice:150, days:2.25, cost:20, marginContribution:0.74 },
    { id:'qln.2', packageName:'Audio · Main System', type:'Rental', inventoryItemId:'inv.db-jsub', description:'d&b JSub', qty:12, rateTier:'day', unitPrice:200, days:2.25, cost:28, marginContribution:0.69 },
    { id:'qln.3', packageName:'Audio · Wireless', type:'Rental', inventoryItemId:'inv.shure-axd8', description:'Axient Digital 8-pack', qty:1, rateTier:'day', unitPrice:1600, days:2.25, cost:180, marginContribution:0.76 },
    { id:'qln.4', packageName:'Video · Screen Ctl', type:'Rental', inventoryItemId:'inv.barco-e2', description:'Barco E2 4K', qty:1, rateTier:'day', unitPrice:4500, days:2.25, cost:600, marginContribution:0.73 },
    { id:'qln.5', packageName:'Video · Cameras', type:'Rental', inventoryItemId:'inv.ursa-g2', description:'BMD URSA G2 Cam', qty:5, rateTier:'day', unitPrice:1000, days:2.25, cost:100, marginContribution:0.80 },
    { id:'qln.6', packageName:'Labor', type:'Labor', crewPositionId:'pos.a1', description:'Audio A1 — 6 days', qty:1, rateTier:'day', unitPrice:125*12, days:6, cost:85*12, marginContribution:0.32 },
    { id:'qln.7', packageName:'Labor', type:'Labor', crewPositionId:'pos.v1', description:'Video V1 — 6 days', qty:1, rateTier:'day', unitPrice:120*12, days:6, cost:80*12, marginContribution:0.33 },
    { id:'qln.8', packageName:'SubRental', type:'SubRental', description:'Sub-rental d&b JSub × 2 (Solotech)', qty:2, unitPrice:2100, days:1, cost:0, vendorCost:4200, marginContribution:-0.02 }
  ];

  PCG.quoteRevisions = [
    { id:'qr.LCE-2026.v3', quoteId:'q.LCE-2026.v3', revisionNumber:3,
      status:'Awarded', rateCardVersionId:'rc.2026.Q1',
      totalRevenue:397799.61, totalCost:265000, margin:0.334,
      author:'p.jspringer', createdAt:'2026-04-09T14:22', approvedAt:'2026-04-11T10:05', approvedById:'p.kbenz',
      corrections: [
        { at:'2026-04-12T11:00', by:'p.coliver', summary:'Typo fix in package label — no $ impact', type:'internal' }
      ],
      lines: baseQuoteLines
    },
    { id:'qr.SAE-WCX-2026.v1', quoteId:'q.SAE-WCX-2026.v1', revisionNumber:1, status:'Awarded', rateCardVersionId:'rc.2026.Q1',
      totalRevenue:512000, totalCost:362000, margin:0.293,
      author:'p.jspringer', createdAt:'2026-03-15', approvedAt:'2026-03-20', approvedById:'p.kbenz', corrections:[], lines:[] },
    { id:'qr.ACR-BOARD26.v1', quoteId:'q.ACR-BOARD26.v1', revisionNumber:1, status:'Awarded', rateCardVersionId:'rc.2026.Q1',
      totalRevenue:4800, totalCost:950, margin:0.802,
      author:'p.jspringer', createdAt:'2026-04-05', approvedAt:'2026-04-07', approvedById:'p.kbenz', corrections:[], lines:[] },
    { id:'qr.NAT-TOUR26.v2', quoteId:'q.NAT-TOUR26.v2', revisionNumber:2, status:'Issued', rateCardVersionId:'rc.2026.Q1',
      totalRevenue:185000, totalCost:118000, margin:0.362,
      author:'p.jspringer', createdAt:'2026-04-14', approvedAt:null, approvedById:null, corrections:[], lines:[] }
  ];

  // ScopeRecords (frozen on award)
  PCG.scopeRecords = [
    { id:'sr.LCE-2026', quoteRevisionId:'qr.LCE-2026.v3', projectCode:'LCE-2026', createdAt:'2026-04-11T10:05' },
    { id:'sr.SAE-WCX-2026', quoteRevisionId:'qr.SAE-WCX-2026.v1', projectCode:'SAE-WCX-2026', createdAt:'2026-03-20' },
    { id:'sr.ACR-BOARD26', quoteRevisionId:'qr.ACR-BOARD26.v1', projectCode:'ACR-BOARD26', createdAt:'2026-04-07' }
  ];

  /* -----------------------------------------------------------------
     Change Orders + Invoice Milestones
  ----------------------------------------------------------------- */
  PCG.changeOrders = [
    { id:'co.001', projectCode:'LCE-2026', scopeRecordId:'sr.LCE-2026', description:'CO #3 — Awards Ready Room AV', initiatedById:'p.jspringer', type:'CO', financialImpact:18400, status:'Pending', clientVisible:true, billingQueueAt:null },
    { id:'co.002', projectCode:'LCE-2026', scopeRecordId:'sr.LCE-2026', description:'CO #2 — Cocktail DJ patch + IFB', initiatedById:'p.jspringer', type:'CO', financialImpact:12800, status:'Approved', clientVisible:true, billingQueueAt:'2026-04-11T15:00' },
    { id:'co.003', projectCode:'LCE-2026', scopeRecordId:'sr.LCE-2026', description:'Sub-rental JSub (Solotech)', initiatedById:'p.svance', type:'CO', financialImpact:4200, status:'Pending', clientVisible:false, billingQueueAt:null },
    { id:'co.004', projectCode:'GLBX-GSK26', scopeRecordId:null, description:'Grille dent — J8 unit 003 (client-caused)', initiatedById:'p.svance', type:'DamageCharge', financialImpact:280, status:'Pending', clientVisible:true },
    { id:'co.005', projectCode:'GLBX-GSK26', scopeRecordId:null, description:'Onsite add-on — pre-function cocktail ambient', initiatedById:'p.jsharp', type:'AddOrder', financialImpact:2400, status:'Pending', clientVisible:true },
    { id:'co.006', projectCode:'SAE-WCX-2026', scopeRecordId:'sr.SAE-WCX-2026', description:'Room 310B CRC Classroom add', initiatedById:'p.tscheff', type:'CO', financialImpact:3850, status:'Pending', clientVisible:true }
  ];

  PCG.invoiceMilestones = [
    { id:'im.lce.dep',   projectCode:'LCE-2026',    type:'deposit',  amount:198899, dueDate:'2026-03-15', receivedDate:'2026-03-14', qbInvoiceRef:'QB-INV-4411', status:'paid' },
    { id:'im.lce.prog',  projectCode:'LCE-2026',    type:'progress', amount:99450,  dueDate:'2026-04-08', receivedDate:null, qbInvoiceRef:null, status:'invoiced' },
    { id:'im.lce.final', projectCode:'LCE-2026',    type:'final',    amount:99450,  dueDate:'2026-04-30', receivedDate:null, qbInvoiceRef:null, status:'pending' },
    { id:'im.sae.dep',   projectCode:'SAE-WCX-2026',type:'deposit',  amount:256000, dueDate:'2026-03-25', receivedDate:'2026-03-22', qbInvoiceRef:'QB-INV-4501', status:'paid' },
    { id:'im.sae.final', projectCode:'SAE-WCX-2026',type:'final',    amount:256000, dueDate:'2026-05-01', receivedDate:null, qbInvoiceRef:null, status:'pending' }
  ];

  /* -----------------------------------------------------------------
     Opportunities (pipeline)
  ----------------------------------------------------------------- */
  PCG.opportunities = [
    { id:'op.01', clientId:'c.microsoft', clientName:'Microsoft', aeId:'p.jspringer', estimatedValue:450000, probability:0.6, estimatedScope:'Summer Partner Summit', status:'open', followUpDate:'2026-05-02', notes:'Need venue lock before Q3' },
    { id:'op.02', clientId:'c.googleai',  clientName:'Google AI',  aeId:'p.jspringer', estimatedValue:980000, probability:0.3, estimatedScope:'AI Dev Conference', status:'quoted', followUpDate:'2026-05-15', notes:'Client reviewing 2 other vendors' },
    { id:'op.03', clientId:'c.autonat',   clientName:'Auto Nation', aeId:'p.kbenz',     estimatedValue:180000, probability:0.85,estimatedScope:'Dealer Kickoff',     status:'open',   followUpDate:'2026-04-25', notes:'' }
  ];

  /* -----------------------------------------------------------------
     Lifecycle log (runtime append-only, seeded with a couple entries)
  ----------------------------------------------------------------- */
  PCG.lifecycleLog = [
    { showId:'LCE-2026', at:'2026-04-11T10:05', actor:'p.jspringer', from:'Quoted',  to:'Awarded', override:false, backward:false },
    { showId:'LCE-2026', at:'2026-04-12T14:30', actor:'p.jsharp',    from:'Awarded', to:'InPrep',  override:false, backward:false }
  ];

  /* =================================================================
     V2.1 ADDITIONS
     ================================================================= */

  /* -----------------------------------------------------------------
     Venue Records (§F) — expand existing venues w/ warningFlags, dock,
     union, power, rigging specifics
  ----------------------------------------------------------------- */
  const enrichVenue = (id, extra) => {
    const v = PCG.venues.find(x=>x.id===id);
    if(v) Object.assign(v, extra);
  };

  enrichVenue('v.caesars-forum', {
    aka:['Caesar\'s Forum','CF LV'], city:'Las Vegas', state:'NV',
    venueType:'Convention', status:'Active',
    dock:{ dockNumber:'B', dockAddress:'Koval Ln east side', accessHours:'24/7 by advance schedule',
           badgeRequired:true, maxTruckLength:53, loadingDockCount:6,
           notes:'30-min standing zone on Koval side. Freight elevator #3 highest rated.' },
    union:{ required:true, local:'IATSE 720', jurisdictionNotes:'Crew calls through steward. 4-hour minimum.' },
    power:{ availableAmps:1200, distroType:'Bus duct + Cam-Lok', powerNotes:'Tie-ins at 4 locations around ballroom.' },
    rigging:{ riggingAllowed:true, pointLoadLimit:2000, riggingApprovalRequired:true,
              ceilingHeight:'28ft clear', notes:'Non-standard truss points — confirm plot.' },
    warningFlags:[
      'Dock timing strict — Vincent will turn trucks away outside window',
      'Forum Ballroom ceiling has non-standard truss points',
      'Freight elevator #3 is load-rated higher — prefer for case carts'
    ],
    priorShowIds:['LCE-2025','LCE-2024']
  });

  enrichVenue('v.huntington', {
    aka:['HPD','Huntington Place Detroit'], city:'Detroit', state:'MI',
    venueType:'Convention', status:'Active',
    dock:{ dockNumber:'3', dockAddress:'Atwater Street entrance', accessHours:'6am–11pm with badge',
           badgeRequired:true, maxTruckLength:53, loadingDockCount:4,
           notes:'Loading dock 3 has 53\' clearance. Strict window enforcement.' },
    union:{ required:true, local:'IATSE 38', jurisdictionNotes:'Load-in windows cut if late. 4h min.' },
    power:{ availableAmps:800, distroType:'Cam-Lok', powerNotes:'Tie-in at rear of each ballroom.' },
    rigging:{ riggingAllowed:true, pointLoadLimit:1500, riggingApprovalRequired:true,
              ceilingHeight:'22-26ft depending on ballroom', notes:'House rigger required for flown.' },
    warningFlags:[
      'Load-in windows strictly enforced — show ops desk cuts access if late',
      'Cell coverage weak in 140/142 sub-level — carry radios',
      'Show office is Meeting Room 312A'
    ],
    priorShowIds:['SAE-WCX-2025','SAE-WCX-2024']
  });

  enrichVenue('v.mgm-grand', {
    aka:['MGM Grand'], city:'Las Vegas', state:'NV',
    venueType:'Hotel', status:'Active',
    dock:{ dockNumber:'Arena', dockAddress:'behind Arena entrance', accessHours:'24/7',
           badgeRequired:false, maxTruckLength:53, loadingDockCount:3, notes:'' },
    union:{ required:false, jurisdictionNotes:'House tech must be on clock during rig.' },
    power:{ availableAmps:1500, distroType:'Bus + Cam-Lok', powerNotes:'' },
    rigging:{ riggingAllowed:true, pointLoadLimit:2500, riggingApprovalRequired:false,
              ceilingHeight:'32ft clear', notes:'' },
    warningFlags:['House tech must be on clock during rig'],
    priorShowIds:[]
  });

  enrichVenue('v.crocker', {
    aka:['Crocker Park','Market Square'], city:'Westlake', state:'OH',
    venueType:'Outdoor', status:'Active',
    dock:{ dockAddress:'Side street between Market Square and gravel lot', accessHours:'7am–10pm',
           badgeRequired:false, notes:'NO stopping on Vine St — trucks must park at Promenade lot after unload.' },
    union:{ required:false, jurisdictionNotes:'' },
    warningFlags:[
      'NO stopping on Vine Street — dock hazards on only',
      'Tight residential area — minimize idling',
      'No signage on exterior — crew call from main entrance'
    ],
    priorShowIds:['ELSO-2025']
  });

  enrichVenue('v.mccormick', {
    aka:['McCormick Place'], city:'Chicago', state:'IL',
    venueType:'Convention', status:'Active',
    union:{ required:true, local:'IATSE 2 + Teamsters 727', jurisdictionNotes:'Rigging must go through house. Marshalling yard mandatory for 53\'+.' },
    warningFlags:['Marshalling yard mandatory for all trucks 53\'+','House rigger required for all flown elements'],
    priorShowIds:[]
  });

  /* -----------------------------------------------------------------
     Site Surveys — §F.2
  ----------------------------------------------------------------- */
  PCG.siteSurveys = [
    { id:'ss.hpd.sae', venueId:'v.huntington', projectId:'SAE-WCX-2026',
      surveyDate:'2026-02-10', surveyedById:'p.ctaylor', showType:'BreakoutConference',
      sections:{
        power: { notes:'Tie-in at rear of Ballroom C sufficient; needs extension run to 330B.', issues:['Circuit 17 was flagged last year — confirm live.'] },
        rigging:{ notes:'House rigger booked for main stage only. Break rooms use self-climbing.', issues:[] },
        network:{ notes:'Venue WiFi weak in 140 wing; deploy PCG mesh.', issues:['Confirm SSID with venue IT'] }
      },
      recommendations:[
        { priority:'High', description:'Deploy PCG mesh network in 140 wing for breakouts' },
        { priority:'Medium',description:'Pre-position case carts near freight elevator A' }
      ],
      requiresFollowUp:false, publishedToVenueRecord:true
    }
  ];

  /* -----------------------------------------------------------------
     Checklist Templates + seeded ChecklistItems (§C.2)
  ----------------------------------------------------------------- */
  PCG.checklistTemplates = [
    { id:'ct.prodSvc.confirmed', department:'ProductionServices', phase:'Confirmed', requiredForStateAdvance:true,
      tasks:['Quote awarded','PM assigned','Deposit invoiced','AE→PM handoff checklist complete'] },
    { id:'ct.prodSvc.finalPrep', department:'ProductionServices', phase:'FinalPrep', requiredForStateAdvance:true,
      tasks:['Pull sheets locked','Crew letters sent','TD package distributed','Transport confirmed'] },
    { id:'ct.prodSvc.onsite',    department:'ProductionServices', phase:'Onsite', requiredForStateAdvance:true,
      tasks:['Crew clocked in','Load-in complete','ROS approved','Dept leads confirmed ready'] },
    { id:'ct.prodSvc.postShow',  department:'ProductionServices', phase:'PostShow', requiredForStateAdvance:true,
      tasks:['All gear returned','Labor actuals submitted','PM closeout signed','Lessons learned captured'] },
    { id:'ct.prodSvc.invoice',   department:'ProductionServices', phase:'ReadyToInvoice', requiredForStateAdvance:true,
      tasks:['Labor actuals finalized','Sub-rentals matched','CO billing queue clear','Finance packet generated'] },
    { id:'ct.tech.finalPrep',    department:'TechnicalServices', phase:'FinalPrep', requiredForStateAdvance:true,
      tasks:['Pull sheet technical review complete','System completeness validated','Network config documented'] },
    { id:'ct.labor.finalPrep',   department:'SharedServices',    phase:'FinalPrep', requiredForStateAdvance:true,
      tasks:['All positions confirmed (or flagged unfilled)','Travel booked','Crew letters sent'] }
  ];

  const mkChecklistItem = (i, showId, template, taskName, opts={}) => ({
    id: `cli.${showId}.${i}`,
    templateId: template.id, projectId:showId, showId,
    taskName, description: taskName,
    phase: template.phase, department: template.department,
    status: opts.status || 'Pending',
    blocking: opts.blocking !== false,
    assignedToRole: opts.assignedToRole || template.department,
    dueDate: opts.dueDate || null,
    completedAt: opts.completedAt || null,
    completedById: opts.completedById || null,
    overrideReason: opts.overrideReason || null,
    overriddenById: opts.overriddenById || null
  });

  PCG.checklistItems = [];

  // LCE-2026 (InPrep) — Confirmed phase all done, FinalPrep in progress
  const lceTemp1 = PCG.checklistTemplates.find(t=>t.id==='ct.prodSvc.confirmed');
  const lceTemp2 = PCG.checklistTemplates.find(t=>t.id==='ct.prodSvc.finalPrep');
  const lceTemp3 = PCG.checklistTemplates.find(t=>t.id==='ct.tech.finalPrep');
  const lceTemp4 = PCG.checklistTemplates.find(t=>t.id==='ct.labor.finalPrep');

  lceTemp1.tasks.forEach((t,i)=>PCG.checklistItems.push(mkChecklistItem(`lce-c-${i}`, 'LCE-2026', lceTemp1, t,
    { status:'Complete', completedAt:'2026-04-11T12:00', completedById:'p.jspringer' })));
  lceTemp2.tasks.forEach((t,i)=>PCG.checklistItems.push(mkChecklistItem(`lce-fp-${i}`, 'LCE-2026', lceTemp2, t,
    { status: i<2 ? 'Complete':'Pending', completedAt: i<2?'2026-04-13T14:00':null, dueDate:'2026-04-14T17:00' })));
  lceTemp3.tasks.forEach((t,i)=>PCG.checklistItems.push(mkChecklistItem(`lce-tf-${i}`, 'LCE-2026', lceTemp3, t,
    { status:'Complete', completedAt:'2026-04-13T11:00', completedById:'p.ctaylor' })));
  lceTemp4.tasks.forEach((t,i)=>PCG.checklistItems.push(mkChecklistItem(`lce-lf-${i}`, 'LCE-2026', lceTemp4, t,
    { status: i===0? 'Overridden':'Pending',
      overrideReason: i===0?'A2 position unfilled — covered by freelance swap at call':null,
      overriddenById: i===0?'p.coliver':null,
      dueDate:'2026-04-14T17:00' })));

  // SAE-WCX-2026 (InPrep) — Confirmed done, FinalPrep partial
  lceTemp1.tasks.forEach((t,i)=>PCG.checklistItems.push(mkChecklistItem(`sae-c-${i}`, 'SAE-WCX-2026', lceTemp1, t,
    { status:'Complete', completedAt:'2026-03-22T10:00', completedById:'p.jspringer' })));
  lceTemp2.tasks.forEach((t,i)=>PCG.checklistItems.push(mkChecklistItem(`sae-fp-${i}`, 'SAE-WCX-2026', lceTemp2, t,
    { status: i===0?'Pending':'Complete', dueDate:'2026-04-13T17:00' })));

  // GLBX (OnShow) — checklist mostly done
  lceTemp1.tasks.forEach((t,i)=>PCG.checklistItems.push(mkChecklistItem(`glbx-c-${i}`, 'GLBX-GSK26', lceTemp1, t,
    { status:'Complete', completedAt:'2026-04-02T10:00' })));
  const lceTempOnsite = PCG.checklistTemplates.find(t=>t.id==='ct.prodSvc.onsite');
  lceTempOnsite.tasks.forEach((t,i)=>PCG.checklistItems.push(mkChecklistItem(`glbx-on-${i}`, 'GLBX-GSK26', lceTempOnsite, t,
    { status:'Complete', completedAt:'2026-04-11T08:00' })));

  /* -----------------------------------------------------------------
     Exception Overrides (§D)
  ----------------------------------------------------------------- */
  PCG.exceptionOverrides = [
    { id:'eo.001', entityType:'ChecklistItem', entityId:'cli.LCE-2026.lce-lf-0',
      blockingCondition:'All labor positions confirmed required before FinalPrep complete',
      overrideReason:'A2 position unfilled — freelance swap booked to cover day-of',
      overriddenById:'p.coliver', overriddenAt:'2026-04-14T10:00',
      riskLevel:'Medium', approvalRequired:false }
  ];

  /* -----------------------------------------------------------------
     Run of Show (§15) + Global Elements + Templates
  ----------------------------------------------------------------- */
  PCG.globalElements = [
    { id:'ge.sponsor-read', name:'Sponsor Read Standard', type:'Script',
      departments:['Audio','Graphics'], durationSec:45,
      description:'Standard sponsor acknowledgement script. Audio: lav hot. Graphics: sponsor logo.' },
    { id:'ge.outro',        name:'Standard Outro', type:'Music',
      departments:['Audio','Lighting'], durationSec:120,
      description:'House music out + lighting fade to house.' },
    { id:'ge.walkout',      name:'Walk-Out Announcement', type:'Script',
      departments:['Audio','Video'], durationSec:30,
      description:'Walk-out announcement, safe travels, thanks for coming.' }
  ];

  PCG.rosTemplates = [
    { id:'rost.corp-gs', name:'Corporate General Session — Standard',
      showType:'GeneralSession', author:'p.jgerber',
      itemsTemplate:[
        { title:'Doors Open',            type:'Announcement', est:10 },
        { title:'Welcome / Pre-Show Loop',type:'Video',        est:15 },
        { title:'Welcome Remarks',       type:'Live — Speaker',est:5 },
        { title:'Sponsor Acknowledgement',type:'Live — Speaker',est:3, globalElementId:'ge.sponsor-read' },
        { title:'Video Package',         type:'Video',         est:4 },
        { title:'Keynote',               type:'Live — Speaker',est:45 },
        { title:'Panel Discussion',      type:'Live — Panel',  est:30 },
        { title:'Break',                 type:'Break',         est:15 },
        { title:'Awards Presentation',   type:'Live — Awards', est:30 },
        { title:'Closing Remarks',       type:'Live — Speaker',est:5 },
        { title:'Outro / Music Out',     type:'Audio',         est:2, globalElementId:'ge.outro' }
      ]
    }
  ];

  // Seeded ROS for GLBX (OnShow) — Live demo
  PCG.runOfShows = [
    { id:'ros.glbx', showId:'GLBX-GSK26', status:'Approved',
      approvedAt:'2026-04-10T10:00', approvedById:'p.jgerber',
      items: [
        { id:'ri.1',  order:1,  title:'Doors Open',             type:'Announcement',  estDurationMin:10, status:'Complete',   confidenceStatus:'Green' },
        { id:'ri.2',  order:2,  title:'Welcome / Pre-Show Loop',type:'Video',         estDurationMin:15, status:'Complete',   confidenceStatus:'Green' },
        { id:'ri.3',  order:3,  title:'Welcome Remarks',        type:'Live — Speaker',estDurationMin:5,  status:'Complete',   confidenceStatus:'Green' },
        { id:'ri.4',  order:4,  title:'Sponsor Acknowledgement',type:'Live — Speaker',estDurationMin:3,  status:'Complete',   confidenceStatus:'Green', globalElementId:'ge.sponsor-read' },
        { id:'ri.5',  order:5,  title:'Video Package',          type:'Video',         estDurationMin:4,  status:'Complete',   confidenceStatus:'Green' },
        { id:'ri.6',  order:6,  title:'CEO Keynote',            type:'Live — Speaker',estDurationMin:45, status:'Complete',   confidenceStatus:'Green' },
        { id:'ri.7',  order:7,  title:'Product Panel',          type:'Live — Panel',  estDurationMin:30, status:'InProgress', confidenceStatus:'Yellow',
          overrunMin: 4, notes:'Running 4 min over.' },
        { id:'ri.8',  order:8,  title:'Break',                  type:'Break',         estDurationMin:15, status:'Pending',    confidenceStatus:'Green' },
        { id:'ri.9',  order:9,  title:'Award — Top Sales Team', type:'Live — Awards', estDurationMin:30, status:'Pending',    confidenceStatus:'Red',
          notes:'Winner video not delivered yet. Content team notified.' },
        { id:'ri.10', order:10, title:'Closing Remarks',        type:'Live — Speaker',estDurationMin:5,  status:'Pending',    confidenceStatus:'Green' },
        { id:'ri.11', order:11, title:'Outro / Music Out',      type:'Audio',         estDurationMin:2,  status:'Pending',    confidenceStatus:'Green', globalElementId:'ge.outro' }
      ]
    },
    { id:'ros.lce', showId:'LCE-2026', status:'Draft',
      items: (function(){
        const t = PCG.rosTemplates[0].itemsTemplate;
        return t.map((r,i)=>({ id:`ri.lce.${i}`, order:i+1, title:r.title, type:r.type, estDurationMin:r.est, status:'Pending', confidenceStatus:'Yellow' }));
      })()
    }
  ];

  /* -----------------------------------------------------------------
     PIF records (§4)
  ----------------------------------------------------------------- */
  PCG.pifs = [
    { id:'pif.lce', projectCode:'LCE-2026', projectName:'LCE — Conference 2026',
      clientId:'c.littlecae', aeId:'p.jspringer', pmId:'p.jspringer',
      venueId:'v.caesars-forum', showType:'GeneralSession',
      dates:{ estimatedLoadIn:'2026-04-10T07:00', estimatedShowStart:'2026-04-13T06:00',
              estimatedShowEnd:'2026-04-15T18:00', estimatedLoadOut:'2026-04-15T23:00',
              estimatedReturn:'2026-04-20T11:00' },
      estimatedBudget:400000, estimatedAttendance:1200,
      departments:['Audio','Video','Lighting','Scenic','Labor'],
      estimatedHeadcount:14, travelRequired:true, subRentalAnticipated:true,
      breakoutRoomCount:0,
      clientContactName:'Jennifer Beth', clientContactEmail:'jbeth@lce.com',
      priorProjectRef:'LCE-2025', status:'Converted', createdBy:'p.jspringer',
      createdAt:'2026-01-08', convertedToProjectAt:'2026-01-15' },
    { id:'pif.new', projectCode:'MSFT-2026', projectName:'Microsoft Summer Partner Summit 2026',
      clientId:'c.microsoft', aeId:'p.jspringer', pmId:null,
      venueId:'v.mcormick', showType:'BreakoutConference',
      dates:{ estimatedLoadIn:'2026-06-20T08:00', estimatedShowStart:'2026-06-22T09:00',
              estimatedShowEnd:'2026-06-24T18:00', estimatedLoadOut:'2026-06-24T23:00',
              estimatedReturn:'2026-06-27T11:00' },
      estimatedBudget:450000, estimatedAttendance:800,
      departments:['Audio','Video','Lighting','Labor'],
      estimatedHeadcount:18, travelRequired:true, subRentalAnticipated:false,
      breakoutRoomCount:12,
      clientContactName:null, clientContactEmail:null,
      priorProjectRef:null, status:'Draft', createdBy:'p.jspringer',
      createdAt:'2026-04-15' }
  ];

  /* -----------------------------------------------------------------
     Hierarchy: Days / Shifts / Tasks for live-ish shows
  ----------------------------------------------------------------- */
  PCG.days = [
    { id:'d.lce.1', showId:'LCE-2026', date:'2026-04-10', description:'Load-In Day' },
    { id:'d.lce.2', showId:'LCE-2026', date:'2026-04-11', description:'Setup / Rehearsal Day' },
    { id:'d.lce.3', showId:'LCE-2026', date:'2026-04-12', description:'Rehearsal Day' },
    { id:'d.lce.4', showId:'LCE-2026', date:'2026-04-13', description:'Show Day 1 — Welcome/Keynote' },
    { id:'d.lce.5', showId:'LCE-2026', date:'2026-04-14', description:'Show Day 2 — Awards Night' },
    { id:'d.lce.6', showId:'LCE-2026', date:'2026-04-15', description:'Show Day 3 + Strike' }
  ];

  PCG.shifts = [
    { id:'sh.lce.1.li',  dayId:'d.lce.1', showId:'LCE-2026', callType:'Load-In',  start:'06:00', end:'22:00', department:'All', name:'Load-In Core' },
    { id:'sh.lce.4.pre', dayId:'d.lce.4', showId:'LCE-2026', callType:'Pre-Show', start:'05:00', end:'09:00', department:'Core', name:'Pre-Show Setup' },
    { id:'sh.lce.4.sh',  dayId:'d.lce.4', showId:'LCE-2026', callType:'Show',     start:'09:00', end:'20:00', department:'All',  name:'Show Day 1' },
    { id:'sh.lce.6.st',  dayId:'d.lce.6', showId:'LCE-2026', callType:'Strike',   start:'20:00', end:'04:00', department:'All',  name:'Strike' }
  ];

  PCG.tasks = [
    { id:'tk.1', shiftId:'sh.lce.1.li', assignedToId:'p.ctaylor', description:'Receive trucks and stage cases',
      status:'Completed', completedAt:'2026-04-10T12:00' },
    { id:'tk.2', shiftId:'sh.lce.1.li', assignedToId:'p.pshah',   description:'Ballroom audio rig + bench',
      status:'InProgress' },
    { id:'tk.3', shiftId:'sh.lce.1.li', assignedToId:'p.dkim',    description:'Video camera package bench + path test',
      status:'Pending' }
  ];

  /* -----------------------------------------------------------------
     Add Orders (§5.2 — separate from Change Orders)
  ----------------------------------------------------------------- */
  PCG.addOrders = [
    { id:'ao.001', showId:'GLBX-GSK26', aoNumber:'AO-001', type:'AddOrder',
      requestedById:'p.jsharp', requestedAt:'2026-04-11T11:30',
      urgency:'Urgent', description:'Add 2x handheld wireless for pre-function cocktail',
      items:[{ inventoryItemId:'inv.brk-wlshh', qty:2, description:'Wireless HH' }],
      status:'Delivered',
      warehouseAcknowledgedById:'p.svance', warehouseAcknowledgedAt:'2026-04-11T11:45',
      dispatchedAt:'2026-04-11T12:00', deliveredAt:'2026-04-11T14:30',
      returnTracked:true, billableDecision:'ClientBillable', financialImpact:2400, linkedCOId:null },
    { id:'ao.002', showId:'LCE-2026', aoNumber:'AO-001', type:'AddOrder',
      requestedById:'p.jspringer', requestedAt:'2026-04-14T17:40',
      urgency:'Standard', description:'Awards Ready Room — chairs + AV sweep',
      items:[{ inventoryItemId:'inv.brk-lcd', qty:1, description:'55" LCD' }],
      status:'Requested', returnTracked:true, billableDecision:'ClientBillable', financialImpact:18400 }
  ];

  /* -----------------------------------------------------------------
     Ensure ScopeRecord has projectCode for getScopeRecord lookup
  ----------------------------------------------------------------- */
  (PCG.scopeRecords||[]).forEach(sr => { if(!sr.projectCode && sr.id) sr.projectCode = sr.id.replace(/^sr\./,''); });

  /* -----------------------------------------------------------------
     Seed audit log with lifecycle transitions
  ----------------------------------------------------------------- */
  PCG.auditLog = PCG.auditLog || [];

  /* =================================================================
     v2.1 — BROADER MODULE SEED
     (§6 Inventory · §7 Kits · §12 Timesheets · §20 Logistics · §21 R&M · §22 Safety · Clients)
     ================================================================= */

  /* ---------- Clients (master records) ---------- */
  PCG.clients = [
    { id:'c.littlecae', name:'Little Caesars Enterprises', industry:'Quick-Service Restaurant',
      billingAddress:'2211 Woodward Ave, Detroit, MI 48201',
      primaryContactId:null, aeId:'p.jspringer', priorProjectCodes:['LCE-2025','LCE-2024'],
      revenueYTD: 1250000, status:'Active',
      preferences:['Deliver decks Wed noon','Kevin Adams is content lead — not decision-maker'],
      doNotUse:[] },
    { id:'c.sae',        name:'SAE International',        industry:'Professional Association',
      billingAddress:'400 Commonwealth Dr, Warrendale, PA 15096',
      aeId:'p.jspringer', priorProjectCodes:['SAE-WCX-2025','SAE-WCX-2024'],
      revenueYTD: 512000, status:'Active', preferences:[], doNotUse:[] },
    { id:'c.globex',     name:'Globex Corporation',       industry:'Conglomerate',
      billingAddress:'1701 Market St, Philadelphia, PA 19103',
      aeId:'p.jspringer', priorProjectCodes:['GLBX-2025','GLBX-2024'],
      revenueYTD: 890000, status:'Active', preferences:[], doNotUse:[] },
    { id:'c.woc',        name:'Women of Color Magazine',  industry:'Media',
      billingAddress:'Fairfax, VA', aeId:'p.jspringer', priorProjectCodes:[], revenueYTD:210000, status:'Active' },
    { id:'c.stellantis', name:'Stellantis Marketing',     industry:'Automotive',
      billingAddress:'1000 Chrysler Dr, Auburn Hills, MI', aeId:'p.jspringer', priorProjectCodes:[], revenueYTD:340000, status:'Active' },
    { id:'c.techco',     name:'TechCo Inc.',              industry:'Software', aeId:'p.jspringer', priorProjectCodes:[], revenueYTD:180000, status:'Active' },
    { id:'c.creditaccept',name:'Credit Acceptance (ELSO)',industry:'Financial Services', aeId:'p.jspringer', priorProjectCodes:['ELSO-2025'], revenueYTD:620000, status:'Active' },
    { id:'c.natltour',   name:'Nationals Tour LLC',       industry:'Entertainment', aeId:'p.jspringer', priorProjectCodes:[], revenueYTD:0, status:'New' },
    { id:'c.accrue',     name:'Accrue Holdings',          industry:'Investment', aeId:'p.jspringer', priorProjectCodes:[], revenueYTD:0, status:'New' },
    { id:'c.microsoft',  name:'Microsoft',                industry:'Software', aeId:'p.jspringer', priorProjectCodes:[], revenueYTD:0, status:'Prospect' }
  ];

  /* ---------- System Definitions (Kits) §7 ---------- */
  PCG.systemDefinitions = [
    { id:'sd.db-j8-12', name:'d&b J8 Line Array — 12 Cabinet System', category:'Audio',
      departmentId:'dept.audio', managedById:'p.pshah', currentVersionId:'sdv.1',
      requiredComponents:[
        { modelId:'inv.db-j8', qty:12, role:'mainCabinet' },
        { modelId:'inv.db-jsub', qty:6, role:'sub' }
      ],
      optionalComponents:[
        { modelId:'inv.db-q10', qty:4, condition:'frontFill' }
      ],
      suggestedComponents:[
        { modelId:'inv.db-q1', qty:4, reason:'Center cluster delay' }
      ],
      substitutionRules:[
        { originalModelId:'inv.db-j8', substituteModelId:'inv.la-k2',
          condition:'size-and-coverage match', approvalRequired:'PM', costImpactType:'vendorCostDelta' }
      ],
      compatibilityRules:[
        { type:'error', description:'J8 cabinets require dAMP10 amps — cannot use Crown',
          severity:'error' }
      ],
      autoIncludeRules:[
        { trigger:'if qty of inv.db-j8 ≥ 12', addModelId:'amp.damp10', addQty:1 }
      ],
      storageRequirements:{ location:'Aisle A / Zone 4', cases:6, rackCount:2, specialHandling:'Fragile ribbon tweeters' },
      standardPackList:[
        { modelId:'rig.y-jbar', qty:4, notes:'Y-bars' },
        { modelId:'rig.j-jack', qty:4, notes:'J-Jack' },
        { modelId:'cbl.speakon-50', qty:8, notes:'50ft speakON' }
      ],
      dayRate: 24*150 + 6*200 + 4*250, weekRate: 24*450 + 6*600 + 4*750,
      lastModifiedAt:'2026-02-10', lastModifiedById:'p.pshah',
      changeHistory:[
        { at:'2026-02-10', by:'p.pshah', summary:'Added optional Q10 front-fill line' },
        { at:'2025-11-02', by:'p.pshah', summary:'Initial definition — 12-cabinet standard' }
      ]
    },
    { id:'sd.brk-standard', name:'Breakout Standard Kit (per room)', category:'Breakout',
      departmentId:'dept.wh', managedById:'p.svance', currentVersionId:'sdv.1',
      requiredComponents:[
        { modelId:'inv.brk-8table', qty:1, role:'table' },
        { modelId:'inv.brk-lcd',    qty:1, role:'display' },
        { modelId:'inv.brk-wlshh',  qty:1, role:'wirelessHH' },
        { modelId:'inv.brk-podmic', qty:2, role:'podMic' },
        { modelId:'inv.brk-mixer',  qty:1, role:'mixer' },
        { modelId:'inv.brk-spkr',   qty:1, role:'speaker' }
      ],
      optionalComponents:[{ modelId:'inv.brk-lcd', qty:1, condition:'VDA room' }],
      substitutionRules:[],
      compatibilityRules:[],
      autoIncludeRules:[],
      storageRequirements:{ location:'Aisle B / Zone 2', cases:1, rackCount:0 },
      standardPackList:[{ modelId:'cbl.xlr-25', qty:4, notes:'25ft XLR' }],
      dayRate: 15 + 75 + 60 + 2*35 + 150 + 120, weekRate: 450,
      lastModifiedAt:'2026-01-15', lastModifiedById:'p.svance', changeHistory:[]
    },
    { id:'sd.barco-e2', name:'Barco E2 4K Screen Management Package', category:'Video',
      departmentId:'dept.video', managedById:'p.dkim', currentVersionId:'sdv.1',
      requiredComponents:[
        { modelId:'inv.barco-e2', qty:1, role:'switcher' }
      ],
      optionalComponents:[], suggestedComponents:[
        { modelId:'inv.mon-50dual', qty:2, reason:'Preview/program monitors' }
      ],
      substitutionRules:[], compatibilityRules:[
        { type:'warning', description:'Requires 10GigE network fabric for 4K', severity:'warning' }
      ],
      autoIncludeRules:[], storageRequirements:{ location:'Aisle C / Zone 1', cases:2, specialHandling:'Climate controlled' },
      standardPackList:[], dayRate: 4500, weekRate: 13500,
      lastModifiedAt:'2026-03-01', lastModifiedById:'p.dkim', changeHistory:[]
    }
  ];

  /* ---------- Service Tickets expansion §21 ---------- */
  const existingTickets = (PCG.serviceTickets||[]).slice();
  PCG.serviceTickets = existingTickets.concat([
    { id:'svc.003', serialId:'J8-007', itemId:'inv.db-j8', showId:null,
      reportedById:'p.arachilla', reportedAt:'2026-04-08T15:10',
      description:'HF driver distortion > -10dB at 3kHz', triage:'Major',
      diagnosis:'Ribbon tweeter damage — ordered replacement', status:'WaitingParts',
      partsNeeded:'Ribbon tweeter assembly', laborHours:3.5, estimatedCost:1650,
      clientCaused:false, recurringFailure:true,
      warrantyVendor:'d&b', warrantyExpiry:'2028-01-01', warrantyClaimStatus:'Filed',
      warrantyClaimOutcome:'Pending vendor response' },
    { id:'svc.004', serialId:'AXD-003', itemId:'inv.shure-axd', showId:'LCE-2026',
      reportedById:'p.pshah', reportedAt:'2026-04-10T09:00',
      description:'RF drop on Ch 4 — likely antenna cable', triage:'Minor',
      diagnosis:'Bent SMA connector', status:'InRepair',
      partsNeeded:'SMA connector + 6ft coax', laborHours:0.75, estimatedCost:45,
      clientCaused:false, recurringFailure:false },
    { id:'svc.005', serialId:'URSA-002', itemId:'inv.ursa-g2', showId:null,
      reportedById:'p.dkim', reportedAt:'2026-04-05T11:00',
      description:'SDI output intermittent', triage:'Major',
      diagnosis:'Mainboard replacement required', status:'VendorRepair',
      partsNeeded:'Sent to Blackmagic', laborHours:0, estimatedCost:2200,
      clientCaused:false, recurringFailure:false },
    { id:'svc.006', serialId:'LCD50-009', itemId:'inv.mon-50dual', showId:'GLBX-GSK26',
      reportedById:'p.svance', reportedAt:'2026-04-12T14:00',
      description:'Panel scratch from cart load', triage:'Minor',
      diagnosis:'Cosmetic only', status:'BenchTest',
      partsNeeded:null, laborHours:0.5, estimatedCost:80,
      clientCaused:true, recurringFailure:false,
      damageChargeId:'co.004' }
  ]);

  /* ---------- Containers (§6) ---------- */
  PCG.containers = [
    { id:'ctr.001', label:'Case J8-RACK-01', type:'Rack', contents:[{serialId:'J8-001'},{serialId:'J8-002'}], currentLocationId:'wh.A.12.B', currentShowId:'LCE-2026', weightLbs:220 },
    { id:'ctr.002', label:'Case J8-RACK-02', type:'Rack', contents:[{serialId:'J8-003'},{serialId:'J8-004'}], currentLocationId:'wh.A.12.B', currentShowId:'LCE-2026', weightLbs:220 },
    { id:'ctr.003', label:'WB-AUDIO-01 Workbox', type:'Case', contents:[], currentLocationId:'wh.A.1.A', weightLbs:140 }
  ];

  /* ---------- Drivers §20 ---------- */
  PCG.drivers = [
    { id:'drv.jreyes', crewMemberId:'p.jreyes', name:'Jose Reyes', licenseClass:'CDL-A', licenseExpiry:'2027-06-30', dotMedicalExpiry:'2026-11-15' },
    { id:'drv.mhahn',  crewMemberId:'p.mhahn',  name:'Maria Hahn', licenseClass:'CDL-A', licenseExpiry:'2028-02-12', dotMedicalExpiry:'2027-01-20' }
  ];

  /* ---------- Timesheets §12.3 ---------- */
  PCG.payRules = [
    { id:'pr.iatse720', name:'IATSE-720-Standard', employmentType:'IATSE', unionLocal:'720', market:'Las Vegas',
      dailyOTThresholdHours:8, weeklyOTThresholdHours:40, dailyDTThresholdHours:12,
      minimumCallMinutes:600, otMultiplier:1.5, dtMultiplier:2.0, holidayMultiplier:2.5,
      mealPenaltyAfterMinutes:360, mealPenaltyAmount:50,
      effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31' },
    { id:'pr.iatse38', name:'IATSE-38-Standard', employmentType:'IATSE', unionLocal:'38', market:'Detroit',
      dailyOTThresholdHours:8, weeklyOTThresholdHours:40, dailyDTThresholdHours:12,
      minimumCallMinutes:600, otMultiplier:1.5, dtMultiplier:2.0, holidayMultiplier:2.5,
      effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31' },
    { id:'pr.w2std', name:'W2-Standard', employmentType:'W2', unionLocal:null, market:'*',
      dailyOTThresholdHours:8, weeklyOTThresholdHours:40, dailyDTThresholdHours:12,
      minimumCallMinutes:480, otMultiplier:1.5, dtMultiplier:2.0, holidayMultiplier:2.0,
      effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31' },
    { id:'pr.1099', name:'1099-Standard', employmentType:'1099', unionLocal:null, market:'*',
      dailyOTThresholdHours:10, weeklyOTThresholdHours:50, dailyDTThresholdHours:14,
      minimumCallMinutes:480, otMultiplier:1.0, dtMultiplier:1.0, holidayMultiplier:1.0,
      effectiveFrom:'2026-01-01', effectiveTo:'2026-12-31' }
  ];

  PCG.timesheets = [
    { id:'ts.001', shiftAssignmentId:'sa.glbx.td', crewMemberId:'p.ctaylor', showId:'GLBX-GSK26',
      workDate:'2026-04-10', clockIn:'2026-04-10T06:00', clockOut:'2026-04-10T18:30',
      scheduledHours:10, workedHours:12, otHours:2, dtHours:0, mealBreakMinutes:30,
      travelHours:0, notes:'', submittedAt:'2026-04-10T19:00',
      approvedById:'p.coliver', approvedAt:'2026-04-11T08:00', status:'Approved', payRuleApplied:'pr.w2std' },
    { id:'ts.002', shiftAssignmentId:'sa.glbx.td', crewMemberId:'p.ctaylor', showId:'GLBX-GSK26',
      workDate:'2026-04-11', clockIn:'2026-04-11T06:00', clockOut:'2026-04-11T20:30',
      scheduledHours:10, workedHours:14, otHours:4, dtHours:0, mealBreakMinutes:30,
      notes:'Extended rehearsal per PM', submittedAt:'2026-04-11T21:00',
      status:'Submitted', payRuleApplied:'pr.w2std' },
    { id:'ts.003', shiftAssignmentId:'sa.glbx.td', crewMemberId:'p.ctaylor', showId:'GLBX-GSK26',
      workDate:'2026-04-12', clockIn:'2026-04-12T06:00', clockOut:'2026-04-12T21:00',
      scheduledHours:10, workedHours:14.5, otHours:4, dtHours:0.5, mealBreakMinutes:30,
      notes:'OT > 2h — explicit approval note: client added rehearsal block', submittedAt:'2026-04-12T21:45',
      status:'Submitted', payRuleApplied:'pr.w2std' }
  ];

  /* ---------- Incident Reports §22 ---------- */
  PCG.incidentReports = [
    { id:'inc.001', showId:'GLBX-GSK26', reportedById:'p.ctaylor', reportedAt:'2026-04-11T10:45',
      type:'NearMiss', severity:'Minor',
      description:'Cable tray insufficiently secured behind FOH — walkway obstructed. No injury.',
      locationDescription:'MGM Ballroom — FOH east aisle',
      witnessNames:['Priya Shah','Dana Kim'], immediateActionTaken:'Gaffed immediately, checked remaining run.',
      medicalAttentionRequired:false, venueNotified:true, status:'Closed',
      closedAt:'2026-04-11T14:30', closedById:'p.ctaylor', attachments:[] },
    { id:'inc.002', showId:'LCE-2026', reportedById:'p.arachilla', reportedAt:'2026-04-10T08:00',
      type:'PropertyDamage', severity:'Minor',
      description:'J8 cabinet J8-003 grille dent from cart impact during load-in.',
      locationDescription:'Caesars Forum Dock B',
      immediateActionTaken:'Cabinet tagged, swapped from active rig.',
      medicalAttentionRequired:false, venueNotified:false, status:'UnderReview',
      escalatedTo:'p.kbenz', attachments:[] }
  ];

  /* ---------- InventoryModel entries (expand on existing flat inventory) ---------- */
  // Back-fill model-like fields for entries if missing
  (PCG.inventory||[]).forEach(i=>{
    i.class = i.class || (i.categoryId && i.categoryId.startsWith('cat.breakout') ? 'Rental' : 'Rental');
    i.ownedQty = i.qty;
    i.activeSerialCount = (PCG.inventorySerials||[]).filter(s=>s.itemId===i.id).length;
    i.averageUtilizationPct = Math.min(100, Math.round(30 + Math.random()*50));
    i.status = i.status || 'Active';
  });

  // Mark some serials across the state machine for demo
  (PCG.inventorySerials||[]).forEach((s, idx) => {
    if(idx === 2)  s.status = 'QCHold';
    if(idx === 10) s.status = 'Lost';
  });

  /* ---------- Reorder Rules (§6) ---------- */
  PCG.reorderRules = [
    { id:'rr.001', modelId:'inv.brk-podmic', warehouseId:'wh.premier-main', minQty:40, reorderQty:20, preferredVendorId:'earthworks-direct', lastTriggeredAt:null },
    { id:'rr.002', modelId:'inv.brk-wlshh',  warehouseId:'wh.premier-main', minQty:20, reorderQty:10, preferredVendorId:'shure-direct',       lastTriggeredAt:null }
  ];

  /* ---------- Warehouses (§10 — three locations) ---------- */
  PCG.warehouses = [
    { id:'wh.troy',      name:'Troy / Main / HQ', address:'Troy, MI', purpose:'Primary — full pull, QC, IC, staging, loading. Manifest origination. Fleet base.', capacitySqft: 42000, serialCount: 16233 },
    { id:'wh.hpd',       name:'Huntington Place (HPD / Center)', address:'Detroit, MI', purpose:'Secondary — full pull, QC, IC. Center AE home base. Cross-rental receiving.', capacitySqft: 9500, serialCount: 2234 },
    { id:'wh.bldg-b',    name:'Building B (OneSource / Creative)', address:'Detroit, MI', purpose:'Creative services + scenic storage. Limited shipping.', capacitySqft: 8200, serialCount: 420 }
  ];

  /* ---------- Field Notes / Issue Log (§G) ---------- */
  PCG.fieldNotes = [
    { id:'fn.001', showId:'GLBX-GSK26', authorId:'p.ctaylor',
      text:'Client requested pre-function cocktail ambient added — filed AO-001. Confirmed with PM verbally, will cost later.',
      category:'change', attachments:[], timestamp:'2026-04-11T11:30' },
    { id:'fn.002', showId:'GLBX-GSK26', authorId:'p.pshah',
      text:'RF coordination issue Ch 4 — swapped to backup frequency. Talent was mid-speech, handled live. Service ticket opened post-show.',
      category:'operational', attachments:[], timestamp:'2026-04-11T14:22' },
    { id:'fn.003', showId:'GLBX-GSK26', authorId:'p.svance',
      text:'J8-003 grille dented during load-in — cart impact at dock. Photos attached. Flagged to AE for damage charge.',
      category:'damage', attachments:['/docs/j8-003-dent-1.jpg','/docs/j8-003-dent-2.jpg'], timestamp:'2026-04-08T15:10' },
    { id:'fn.004', showId:'LCE-2026', authorId:'p.jspringer',
      text:'Client added Awards ready room — scope change, filed as CO#3. Need Flex update + power walkthrough.',
      category:'change', attachments:[], timestamp:'2026-04-14T17:40' },
    { id:'fn.005', showId:'LCE-2026', authorId:'p.ctaylor',
      text:'Vincent at Caesars confirmed dock timing. Truck #12 arriving 5:30am, Truck #07 at 6:00am. Do not be late.',
      category:'note', attachments:[], timestamp:'2026-04-09T18:00' },
    { id:'fn.006', showId:'SAE-WCX-2026', authorId:'p.tscheff',
      text:'Room 310B CRC Classroom added last-week — waiting on billing clarification (master vs own). Steph reviewing.',
      category:'change', attachments:[], timestamp:'2026-04-14T19:10' }
  ];

  /* ---------- Procurement Requests (§9.1) ---------- */
  PCG.procurementRequests = [
    { id:'pr.001', departmentId:'dept.audio', requesterId:'p.pshah',
      itemDescription:'Shure AD4Q (G57+) 4-pack Wireless Microphone Combo Kit',
      qty:1, justification:'High wireless demand across Q2 shows; current inventory 100% allocated on peak weeks.',
      estimatedCost:22000, vendorId:'shure-direct', dateNeeded:'2026-06-15',
      status:'PendingApproval', approvalRoute:['Dept Director','CFO'], createdAt:'2026-04-12T10:00' },
    { id:'pr.002', departmentId:'dept.wh', requesterId:'p.svance',
      itemDescription:'Replacement ribbon tweeters — d&b J8 (qty 4, warranty + spares)',
      qty:4, justification:'J8-007 recurring failure — stock 2 warranty spares.',
      estimatedCost:1800, vendorId:'db-direct', dateNeeded:'2026-05-01',
      status:'Approved', approvedById:'p.kbenz', approvedAt:'2026-04-14T14:00',
      poNumber:'PO-2026-0142', expectedDelivery:'2026-04-28', createdAt:'2026-04-13T09:00' },
    { id:'pr.003', departmentId:'dept.video', requesterId:'p.dkim',
      itemDescription:'BMD URSA Broadcast G2 (2 units) + 20x HD lens',
      qty:2, justification:'Capital — expand camera fleet. Expected 14-month payback.',
      estimatedCost:45000, vendorId:'b-h', dateNeeded:'2026-09-01',
      status:'Draft', createdAt:'2026-04-10T11:00' }
  ];

  /* ---------- Closeout Records (§35) ---------- */
  PCG.closeoutRecords = [
    { id:'co.rec.glbx', showId:'GLBX-GSK26',
      pmSignoffAt: null, pmSignoffById: null,
      laborActualsConfirmed: false,
      subRentalInvoicesMatched: true,
      scopeVsDeliveredReviewed: false,
      financeHandoffGeneratedAt: null,
      missingItemResolutions: [],
      openTicketDispositions: [
        { ticketId:'svc.001', disposition:'Deferred', notes:'Cosmetic only; billing to client in progress' }
      ],
      lessonsLearned: '',
      techRatings: [
        { crewMemberId:'p.ctaylor', rating: 5, notes:'Strong leadership onsite' }
      ],
      clientSatisfactionNote: 'Client rep verbally positive; awaiting written feedback.',
      postShowFollowUpAssigned: false
    }
  ];

  /* ---------- Work Items (§25 full WorkItem model) ---------- */
  PCG.workItems = [
    { id:'wi.001', type:'InventoryConflict', priority:'Critical',
      ownerId:'p.ctaylor', status:'Open',
      title:'JSub — 2-unit deficit on LCE-2026',
      description:'10 owned, 12 allocated. Sub-rental via Solotech pending approval.',
      linkedEntity:{ entityType:'SubRentalRPO', entityId:'rpo.lce.jsub' },
      dueBy:'2026-04-15T16:00', escalationPath:'p.kbenz', createdAt:'2026-04-14T09:00' },
    { id:'wi.002', type:'ApprovalNeeded', priority:'High',
      ownerId:'p.kbenz', status:'Open',
      title:'CO #3 — Awards Ready Room ($18,400)',
      description:'Client-requested scope addition. AE filed, awaiting Director approval.',
      linkedEntity:{ entityType:'ChangeOrder', entityId:'co.001' },
      dueBy:'2026-04-16T12:00', createdAt:'2026-04-14T18:00' },
    { id:'wi.003', type:'LaborActualsMissing', priority:'High',
      ownerId:'p.coliver', status:'Open',
      title:'Timesheets not finalized — GLBX closeout blocked',
      description:'2 of 3 GLBX timesheets still in Submitted status. Closeout cannot complete.',
      linkedEntity:{ entityType:'Show', entityId:'GLBX-GSK26' },
      dueBy:'2026-04-16T17:00', createdAt:'2026-04-14T10:00' },
    { id:'wi.004', type:'RPODeadline', priority:'Critical',
      ownerId:'p.svance', status:'Open',
      title:'RPO hold expires in 4h — Solotech JSub',
      description:'Sub-rental for LCE-2026 — confirm go/no-go.',
      linkedEntity:{ entityType:'SubRentalRPO', entityId:'rpo.lce.jsub' },
      dueBy:'2026-04-15T16:00', escalationPath:'p.kbenz', createdAt:'2026-04-15T12:00' },
    { id:'wi.005', type:'MaintenanceOverdue', priority:'Standard',
      ownerId:'p.svance', status:'Open',
      title:'J8-007 — retirement review recommended',
      description:'3 service tickets in 12 months. Recurring failure flag.',
      linkedEntity:{ entityType:'SerializedItem', entityId:'J8-007' },
      dueBy:null, createdAt:'2026-04-08T15:00' },
    { id:'wi.006', type:'AddOrderPending', priority:'High',
      ownerId:'p.svance', status:'Open',
      title:'AO-002 LCE — Awards Ready Room AV',
      description:'PM submitted Add Order — warehouse acknowledgment pending.',
      linkedEntity:{ entityType:'AddOrder', entityId:'ao.002' },
      dueBy:'2026-04-15T15:00', createdAt:'2026-04-14T17:40' },
    { id:'wi.007', type:'ScanOrphan', priority:'Standard',
      ownerId:'p.svance', status:'Open',
      title:'Orphaned return scan — LCD55-024',
      description:'Scan captured; pull sheet line no longer exists. WH Lead review required.',
      linkedEntity:{ entityType:'ScanRecord', entityId:'sc.orphan.001' },
      dueBy:null, createdAt:'2026-04-14T16:00' },
    { id:'wi.008', type:'CloseoutBlocked', priority:'High',
      ownerId:'p.jsharp', status:'Open',
      title:'GLBX-GSK26 closeout blocked',
      description:'Labor actuals not finalized · 1 open service ticket deferred · finance packet not yet generated.',
      linkedEntity:{ entityType:'Show', entityId:'GLBX-GSK26' },
      dueBy:'2026-04-18T17:00', createdAt:'2026-04-14T09:00' }
  ];

  /* ---------- Clock Events (shop clock-in/out, §12.3 time capture) ---------- */
  PCG.clockEvents = [
    { id:'ce.001', crewMemberId:'p.arachilla', warehouseId:'wh.troy',
      clockIn:'2026-04-15T07:02', clockOut:null, shift:'Day Shift',
      assignedPullSheets:['ps.sae.breakout'],
      assignedTasks:[
        { id:'tk.wh.1', description:'Pull d&b JSub sub-rental from Solotech receive area', status:'InProgress' },
        { id:'tk.wh.2', description:'Cycle count — Aisle A Zone 4 (J8 cabinets)', status:'Pending' },
        { id:'tk.wh.3', description:'Prep SAE WCX breakout kits (30 rooms)', status:'InProgress' }
      ]
    }
  ];

  /* ---------- Pitches / Proposals (pre-quote — AE creative) ---------- */
  PCG.pitches = [
    { id:'pitch.lce.2026', projectCode:'LCE-2026', clientId:'c.littlecae', aeId:'p.jspringer',
      title:'LCE Conference 2026 — Creative Proposal',
      status:'Accepted', createdAt:'2026-01-20', acceptedAt:'2026-02-08',
      stageSetId:'sd.db-j8-12', stageSetName:'Marquee',
      showType:'GeneralSession', estimatedBudgetLow:350000, estimatedBudgetHigh:420000,
      estimatedAttendance:1200, breakoutCount:0,
      valueProps:[
        'Marquee stage — LED × 4 panels with split-fabric traveler frames the keynote',
        'd&b J-Series line array gives intelligible speech to every seat',
        'Dedicated Awards program package rolls in Night 2 — no strike',
        '24/7 PCG crew lead (Jeff Springer) — 1 throat to choke'
      ],
      creativeDirection:'Bold, confident, polished. Keynote stage is the brand moment; breakouts reinforce.',
      keyDates:{ loadIn:'2026-04-10', showStart:'2026-04-13', showEnd:'2026-04-15' },
      deliverables:['Keynote GS stage + show flow','Rehearsal day','Awards reception','Walk-in loops'],
      nextSteps:'Contract + deposit invoice · quote issued · PM assigned · load-in prep begins 6 weeks out',
      convertedQuoteId:'q.LCE-2026.v3'
    },
    { id:'pitch.msft.2026', projectCode:null, clientId:'c.microsoft', aeId:'p.jspringer',
      title:'Microsoft Summer Partner Summit 2026 — Creative Proposal',
      status:'Draft', createdAt:'2026-04-14', acceptedAt:null,
      stageSetId:'sd.barco-e2', stageSetName:'Lumen (proposed)',
      showType:'BreakoutConference', estimatedBudgetLow:420000, estimatedBudgetHigh:510000,
      estimatedAttendance:800, breakoutCount:12,
      valueProps:[
        'Lumen set — LED × 4 + LED header, brand-swappable for Microsoft palette',
        'Breakout-heavy package — 12 rooms of consistent standardized kits',
        'Keynote Ballroom with d&b line array + Barco E2 screen management',
        'Dedicated sweep crew for room resets between sessions'
      ],
      creativeDirection:'Techy, modern, warm. Brand-forward visuals with Microsoft color palette baked into LED pre-rolls.',
      keyDates:{ loadIn:'2026-06-20', showStart:'2026-06-22', showEnd:'2026-06-24' },
      deliverables:['Keynote GS package','12 breakout rooms standard kit','Streaming record of keynote','Sponsor loop playback'],
      nextSteps:'Share with client · collect feedback · convert to Quote if accepted',
      convertedQuoteId:null
    }
  ];

  /* ---------- Creative Requests (§24) ---------- */
  PCG.creativeRequests = [
    { id:'cr.001', projectId:'LCE-2026', requestedById:'p.jspringer', requestedAt:'2026-03-20T14:00',
      type:'Graphic', description:'Sponsor loop — 8 sponsors, full-motion 20s each, 4K',
      clientApprovalRequired:true, deadline:'2026-04-11',
      fabricationStatus:'InRevision',
      installDependencies:[], status:'InProgress',
      attachments:['/docs/sponsor-loop-v2.mov'] },
    { id:'cr.002', projectId:'LCE-2026', requestedById:'p.jspringer', requestedAt:'2026-03-15T10:00',
      type:'Rendition', description:'Marquee stage set — final renders for client approval',
      clientApprovalRequired:true, deadline:'2026-04-01',
      fabricationStatus:'Complete',
      status:'Complete', attachments:['/docs/marquee-v3-render.pdf'] },
    { id:'cr.003', projectId:'WOC-2026', requestedById:'p.jspringer', requestedAt:'2026-03-28T10:00',
      type:'Scenic', description:'Custom LED art treatment — Miyra set, Women of Color brand palette',
      clientApprovalRequired:true, deadline:'2026-05-01',
      fabricationStatus:'InDesign',
      installDependencies:['Scenic crew load-in ready','LED processor config done'], status:'InProgress',
      attachments:[] },
    { id:'cr.004', projectId:'SAE-WCX-2026', requestedById:'p.tscheff', requestedAt:'2026-03-10T15:00',
      type:'Print', description:'31 room signage — foam core, one per breakout room with SAE branding',
      clientApprovalRequired:false, deadline:'2026-04-12',
      fabricationStatus:'PrintProduction',
      status:'InProgress', attachments:[] },
    { id:'cr.005', projectId:'GLBX-GSK26', requestedById:'p.jsharp', requestedAt:'2026-04-11T16:00',
      type:'Installation', description:'Pre-function cocktail activation — 3x LED art pieces, ambient',
      clientApprovalRequired:false, deadline:'2026-04-12',
      fabricationStatus:'ApprovedForProduction',
      status:'InProgress', attachments:[] },
    { id:'cr.006', projectId:'NAT-TOUR26', requestedById:'p.jspringer', requestedAt:'2026-04-15T09:00',
      type:'Graphic', description:'Nationals Tour — IMAG graphics package, 5 camera bump-ins',
      clientApprovalRequired:true, deadline:'2026-05-10',
      fabricationStatus:'Pending',
      status:'Draft', attachments:[] }
  ];

  /* ---------- My-Crew Timesheets (for Crew PWA entry) ---------- */
  // Ensure Mike Chen (p.mchen) has an in-progress timesheet on SAE WCX
  if(PCG.timesheets && !PCG.timesheets.find(t=>t.crewMemberId==='p.mchen')){
    PCG.timesheets.push(
      { id:'ts.mc.1', shiftAssignmentId:'sa.sae.a1', crewMemberId:'p.mchen', showId:'SAE-WCX-2026',
        workDate:'2026-04-14', clockIn:'2026-04-14T07:00', clockOut:'2026-04-14T19:00',
        scheduledHours:10, workedHours:11.5, otHours:3.5, dtHours:0, mealBreakMinutes:30,
        notes:'Set day 1 — audio rig Keynote Ballroom', submittedAt:null,
        status:'Draft', payRuleApplied:'pr.iatse38' },
      { id:'ts.mc.2', shiftAssignmentId:'sa.sae.a1', crewMemberId:'p.mchen', showId:'SAE-WCX-2026',
        workDate:'2026-04-15', clockIn:null, clockOut:null,
        scheduledHours:10, workedHours:0, otHours:0, dtHours:0, mealBreakMinutes:0,
        notes:'', submittedAt:null, status:'Draft', payRuleApplied:'pr.iatse38' }
    );
  }


  /* -----------------------------------------------------------------
     v2.X — ShowTechPlan (Engineering — spec §M / §T)
     MVP demo per spec line 6983: one plan on the live ROS show.
  ----------------------------------------------------------------- */
  PCG.showTechPlans = [{
    id:'stp.glbx.gsk26',
    showId:'GLBX-GSK26',
    createdAt:'2026-04-10T08:00',
    lastModifiedAt:'2026-04-12T14:30',
    lastModifiedById:'p.ctaylor',

    videoIO: {
      id:'vio.glbx', switcherModelId:'inv.ross-carb',
      switcherModelName:'Ross Carbonite Ultra 12',
      notes:'Backup switcher (Ross Graphite) on rack 2 in case of failure. SDI-only venue.',
      inputs:[
        { id:'vpt.i1', pointNumber:1, label:'PGM1 SDI',     signalType:'SDI',  signalFormat:'1080p59.94',
          sourceDevice:'Ross Carbonite ME1', destinationDevice:'LED Main Processor', pointType:'Input' },
        { id:'vpt.i2', pointNumber:2, label:'PGM2 SDI',     signalType:'SDI',  signalFormat:'1080p59.94',
          sourceDevice:'Ross Carbonite ME2', destinationDevice:'Stage Left Sidebar',  pointType:'Input' },
        { id:'vpt.i3', pointNumber:3, label:'Laptop HDMI',  signalType:'HDMI', signalFormat:'1080p60',
          sourceDevice:'Presenter laptop → HDMI→SDI converter', destinationDevice:'Carbonite Input 5', pointType:'Input' },
        { id:'vpt.i4', pointNumber:4, label:'IMAG SDI',     signalType:'SDI',  signalFormat:'1080p59.94',
          sourceDevice:'Sony HXC-100 Cam 1', destinationDevice:'Carbonite Input 7', pointType:'Input' }
      ],
      outputs:[
        { id:'vpt.o1', pointNumber:1, label:'MAIN LED SDI',    signalType:'SDI',  signalFormat:'1080p59.94',
          sourceDevice:'Carbonite PGM OUT',  destinationDevice:'Absen A3 LED Wall · Main', pointType:'Output' },
        { id:'vpt.o2', pointNumber:2, label:'Confidence HDMI', signalType:'HDMI', signalFormat:'1080p60',
          sourceDevice:'Carbonite AUX 1',    destinationDevice:'Presenter confidence monitor · front-of-stage', pointType:'Output' },
        { id:'vpt.o3', pointNumber:3, label:'Record SDI',      signalType:'SDI',  signalFormat:'1080p59.94',
          sourceDevice:'Carbonite PGM OUT',  destinationDevice:'Blackmagic HyperDeck Studio HD Plus (session record)', pointType:'Output' }
      ],
      routes:[
        { id:'vrt.r1', name:'PGM → Main Wall',       inputId:'vpt.i1', outputId:'vpt.o1' },
        { id:'vrt.r2', name:'IMAG → Confidence',     inputId:'vpt.i4', outputId:'vpt.o2' }
      ]
    },

    intercom: {
      id:'ico.glbx', systemType:'Clear-Com', systemModelId:'inv.cc-hub',
      notes:'Wired IFB to speaker stage left via XLR. 2-wire Clear-Com on Channel A, 4-wire Dante matrix on Channels B+C.',
      channels:[
        { id:'ich.show', channelNumber:1, channelLabel:'SHOW',       channelType:'Party',
          primaryUsers:['Show Caller','TD','Stage Manager','A1'] },
        { id:'ich.tech', channelNumber:2, channelLabel:'TECH',       channelType:'Party',
          primaryUsers:['TD','Video Director','V1','LD','ME'] },
        { id:'ich.prod', channelNumber:3, channelLabel:'PRODUCTION', channelType:'IFB',
          primaryUsers:['Show Caller → Presenter','Producer Speak'] }
      ],
      beltpackAssignments:[
        { id:'bp.1', beltpackNumber:1, userLabel:'Show Caller — C. Oliver',   positionId:'pos.caller',  channelId:'ich.show' },
        { id:'bp.2', beltpackNumber:2, userLabel:'TD — C. Taylor',             positionId:'pos.td',      channelId:'ich.show' },
        { id:'bp.3', beltpackNumber:3, userLabel:'Stage Manager — FOH',        positionId:null,          channelId:'ich.show' },
        { id:'bp.4', beltpackNumber:4, userLabel:'A1 — P. Shah',               positionId:'pos.a1',      channelId:'ich.show' },
        { id:'bp.5', beltpackNumber:5, userLabel:'Video Director — D. Kim',    positionId:'pos.dir.v',   channelId:'ich.tech' },
        { id:'bp.6', beltpackNumber:6, userLabel:'LD — E. Reyes',              positionId:'pos.ld',      channelId:'ich.tech' }
      ],
      radioFrequencies:[
        { id:'rf.1', band:'UHF', frequency:'470.325', assignedTo:'Handhelds (2)' },
        { id:'rf.2', band:'UHF', frequency:'535.850', assignedTo:'Lav / IFB' }
      ]
    },

    audioRack: {
      id:'arp.glbx', consoleModelId:'inv.yam-ql5', consoleModelName:'Yamaha QL5',
      channelCount:32, notes:'QL5 rack at FOH position 18. 32 channels in, 16 out via Dante to amp room.',
      channelList:[
        { channel:1,  label:'Presenter Lav 1',   source:'Shure AD2/KSM11 (RF 470.325)',    group:'Speech' },
        { channel:2,  label:'Presenter Lav 2',   source:'Shure AD2/KSM11 (RF 470.525)',    group:'Speech' },
        { channel:3,  label:'Handheld HH1',      source:'Shure AD2 (RF 535.850)',           group:'Speech' },
        { channel:4,  label:'Handheld HH2',      source:'Shure AD2 (RF 536.050)',           group:'Speech' },
        { channel:5,  label:'Podium Mic',        source:'Shure MX418 Gooseneck',            group:'Speech' },
        { channel:6,  label:'Q&A Mic 1',         source:'Shure SM58',                        group:'Speech' },
        { channel:7,  label:'Q&A Mic 2',         source:'Shure SM58',                        group:'Speech' },
        { channel:8,  label:'Playback L',        source:'QLab → MOTU M4 L',                 group:'Playback' },
        { channel:9,  label:'Playback R',        source:'QLab → MOTU M4 R',                 group:'Playback' },
        { channel:10, label:'Video Embed L',     source:'Carbonite embedded audio L',        group:'Playback' },
        { channel:11, label:'Video Embed R',     source:'Carbonite embedded audio R',        group:'Playback' },
        { channel:12, label:'Press Feed Out',    source:'MIX bus → ProjectorRack',           group:'Output' }
      ],
      outputs:[
        { name:'Main L/R', routing:'L+R to J8 Array via Lake LM44' },
        { name:'Sub Send', routing:'Aux 3 to JSub' },
        { name:'Monitor', routing:'Aux 1 to Stage Monitor (Q1 wedges)' },
        { name:'Press Feed', routing:'Aux 5 → Press Room XLR' }
      ]
    }
  }];

  /* -----------------------------------------------------------------
     v2.X — Client contacts (for portal magic-link auth)
     Spec §U — Client Experience Engine
  ----------------------------------------------------------------- */
  PCG.clientContacts = [
    // Little Caesars
    { id:'cc.lce.jbeth',   clientId:'c.littlecae', name:'Jordan Beth',    role:'VP Events',         email:'jbeth@lce.com',        phone:'+1 313 555 0201', portalAccess:'Full' },
    { id:'cc.lce.mhart',   clientId:'c.littlecae', name:'Morgan Hart',    role:'Procurement',       email:'mhart@lce.com',        phone:'+1 313 555 0202', portalAccess:'ReadOnly' },
    { id:'cc.lce.rvega',   clientId:'c.littlecae', name:'Rita Vega',      role:'Brand Marketing',   email:'rvega@lce.com',        phone:'+1 313 555 0203', portalAccess:'ReadOnly' },
    // SAE
    { id:'cc.sae.kwong',   clientId:'c.sae',       name:'Kelly Wong',     role:'Program Director',  email:'kwong@sae.org',        phone:'+1 248 555 0301', portalAccess:'Full' },
    { id:'cc.sae.trami',   clientId:'c.sae',       name:'Tomás Ramírez',  role:'Operations Lead',   email:'tramirez@sae.org',     phone:'+1 248 555 0302', portalAccess:'ReadOnly' },
    // Globex
    { id:'cc.glbx.ahoward',clientId:'c.globex',    name:'Andrea Howard',  role:'CMO Office',        email:'ahoward@globex.com',   phone:'+1 212 555 0401', portalAccess:'Full' },
    { id:'cc.glbx.pmarx',  clientId:'c.globex',    name:'Priya Marx',     role:'Brand Events',      email:'pmarx@globex.com',     phone:'+1 212 555 0402', portalAccess:'ReadOnly' }
  ];

  /* -----------------------------------------------------------------
     v2.X — Client messages (portal ↔ PCG threaded)
  ----------------------------------------------------------------- */
  PCG.clientMessages = [
    { id:'cm.001', clientId:'c.littlecae', projectCode:'LCE-2026',
      fromSide:'pcg', fromName:'J. Springer', at:'2026-04-10T14:22',
      body:'Latest quote (Rev 3) is in your portal. A couple of line additions around the cocktail reception — see Proposal tab. Let me know if the window still works.' },
    { id:'cm.002', clientId:'c.littlecae', projectCode:'LCE-2026',
      fromSide:'client', fromName:'J. Beth', at:'2026-04-11T09:40',
      body:'Thanks — reviewing with Morgan. One question on the LED wall size; can we talk 2pm?' },
    { id:'cm.003', clientId:'c.littlecae', projectCode:'LCE-2026',
      fromSide:'pcg', fromName:'J. Springer', at:'2026-04-11T10:05',
      body:'2pm works. Jasmine will send a Teams link. The LED wall is spec\'d for 16\' × 9\' — happy to walk through alternatives.' }
  ];

  /* -----------------------------------------------------------------
     v2.X — Prior-year quote (enables Copy-From-Prior flow in quote builder)
  ----------------------------------------------------------------- */
  if (PCG.quotes && !PCG.quotes.find(q=>q.id==='q.LCE-2025.final')) {
    PCG.quotes.unshift({
      id:'q.LCE-2025.final', quoteNo:'Q-2025-0188', projectCode:'LCE-2025',
      clientId:'c.littlecae', version:4,
      activeRevisionId:'qr.LCE-2025.v4',
      rateCardVersionId:'rc.2025.Q4',
      status:'Awarded', totalRevenue:104800, totalCost:58900, margin:0.438,
      createdAt:'2025-02-20', createdById:'p.jspringer',
      termsText:'NET 30 · 50% deposit required on quote award'
    });
    PCG.quoteRevisions.unshift({
      id:'qr.LCE-2025.v4', quoteId:'q.LCE-2025.final',
      revisionNumber:4, status:'Awarded',
      rateCardVersionId:'rc.2025.Q4',
      createdAt:'2025-03-15', approvedAt:'2025-03-22', approvedById:'p.jspringer',
      totalRevenue:104800, totalCost:58900, margin:0.438,
      lines:[
        { id:'qln.l25.a1', packageName:'Audio — Main Room', type:'Rental',
          inventoryItemId:'inv.db-j8',   description:'d&b J8 Line Array',
          qty:12, rateTier:'week', unitPrice:450, days:5, cost:280, marginContribution:1700 },
        { id:'qln.l25.a2', packageName:'Audio — Main Room', type:'Rental',
          inventoryItemId:'inv.db-jsub', description:'d&b JSub Sub',
          qty:6, rateTier:'week', unitPrice:600, days:5, cost:360 },
        { id:'qln.l25.v1', packageName:'Video — IMAG', type:'Rental',
          inventoryItemId:'inv.barco-e2', description:'Barco E2 Screen Mgmt',
          qty:1, rateTier:'week', unitPrice:13500, days:5, cost:4600 },
        { id:'qln.l25.v2', packageName:'Video — IMAG', type:'Rental',
          inventoryItemId:'inv.mon-50dual', description:'50" LCD Monitor (dual)',
          qty:4, rateTier:'week', unitPrice:250, days:5, cost:90 },
        { id:'qln.l25.l1', packageName:'Labor', type:'Labor',
          crewPositionId:'pos.a1', description:'Audio A1', qty:1, rateTier:'day', unitPrice:125, days:5, cost:85 },
        { id:'qln.l25.l2', packageName:'Labor', type:'Labor',
          crewPositionId:'pos.v1', description:'Video V1', qty:1, rateTier:'day', unitPrice:120, days:5, cost:80 },
        { id:'qln.l25.l3', packageName:'Labor', type:'Labor',
          crewPositionId:'pos.ld', description:'Lighting LD', qty:1, rateTier:'day', unitPrice:122, days:5, cost:82 }
      ],
      corrections:[]
    });
  }

  /* -----------------------------------------------------------------
     v2.X — Client approvals & invites (runtime; empty until issue+approve)
  ----------------------------------------------------------------- */
  PCG.clientInvites = PCG.clientInvites || [];
  PCG.clientApprovals = PCG.clientApprovals || [];
  PCG.substitutionProposals = PCG.substitutionProposals || [];

  /* -----------------------------------------------------------------
     FINAL SPEC §II — Touring / Multi-City Operational System
     A tour = sequential execution with continuity of inventory + crew.
     Lincoln Navigator 2027 National Launch — 5-stop automotive tour.
  ----------------------------------------------------------------- */

  // Lincoln Navigator brand tour — extend client list
  if(!(PCG.clients||[]).find(c=>c.id==='c.lincoln')){
    PCG.clients.push({
      id:'c.lincoln', name:'Lincoln Motor Company', industry:'Automotive',
      billingAddress:'1 American Rd, Dearborn, MI', primaryContactId:null,
      aeId:'p.jspringer', priorProjectCodes:[], revenueYTD:0, status:'Active',
      preferences:['Executive-grade catering','Quiet load-in 6am','Dedicated tour PM']
    });
  }

  // Client contacts for Lincoln (portal)
  PCG.clientContacts.push(
    { id:'cc.lin.hsolis',  clientId:'c.lincoln', name:'Helena Solís', role:'Global Brand Events Director', email:'hsolis@lincoln.com',  phone:'+1 313 555 0501', portalAccess:'Full' },
    { id:'cc.lin.mmcneil', clientId:'c.lincoln', name:'Marcus McNeil',role:'Tour Field Marketing Lead',   email:'mmcneil@lincoln.com', phone:'+1 313 555 0502', portalAccess:'ReadOnly' }
  );

  /* ----- Linked Projects per Tour Stop (5 cities) ----- */
  const tourProjects = [
    { code:'LIN-NYC-26',  name:'Lincoln Navigator Launch — NYC',       venueId:'venue.jacob-javits', city:'New York, NY',     loadIn:'2026-05-04', showStart:'2026-05-06', showEnd:'2026-05-08', loadOut:'2026-05-08', lifecycle:'Awarded' },
    { code:'LIN-CHI-26',  name:'Lincoln Navigator Launch — Chicago',   venueId:'venue.mccormick',    city:'Chicago, IL',      loadIn:'2026-05-13', showStart:'2026-05-15', showEnd:'2026-05-17', loadOut:'2026-05-17', lifecycle:'Awarded' },
    { code:'LIN-ATL-26',  name:'Lincoln Navigator Launch — Atlanta',   venueId:'venue.gwcc',         city:'Atlanta, GA',      loadIn:'2026-05-22', showStart:'2026-05-24', showEnd:'2026-05-26', loadOut:'2026-05-26', lifecycle:'Awarded' },
    { code:'LIN-DFW-26',  name:'Lincoln Navigator Launch — Dallas',    venueId:'venue.kay-bailey',   city:'Dallas, TX',       loadIn:'2026-05-31', showStart:'2026-06-02', showEnd:'2026-06-04', loadOut:'2026-06-04', lifecycle:'InPrep' },
    { code:'LIN-LAX-26',  name:'Lincoln Navigator Launch — Los Angeles',venueId:'venue.la-conv',     city:'Los Angeles, CA',  loadIn:'2026-06-09', showStart:'2026-06-11', showEnd:'2026-06-13', loadOut:'2026-06-13', lifecycle:'Opportunity' }
  ];

  // Seed minimal venue records for tour stops if missing
  (PCG.venues = PCG.venues || []);
  [
    { id:'venue.jacob-javits', name:'Javits Center',                       address:'655 W 34th St, New York, NY 10001',        city:'New York, NY',    loadInNotes:'Dock on 40th St · union venue IATSE Local 1' },
    { id:'venue.mccormick',    name:'McCormick Place · Lakeside',          address:'2301 S Lake Shore Dr, Chicago, IL 60616', city:'Chicago, IL',     loadInNotes:'Marshaling yard off Martin Luther King · IATSE 2' },
    { id:'venue.gwcc',         name:'Georgia World Congress Center · B',  address:'285 Andrew Young Blvd, Atlanta, GA 30313', city:'Atlanta, GA',     loadInNotes:'Building B dock — tight clearance for 53ft trailers' },
    { id:'venue.kay-bailey',   name:'Kay Bailey Hutchison Convention Ctr', address:'650 S Griffin St, Dallas, TX 75202',       city:'Dallas, TX',      loadInNotes:'Dock on Young St · IATSE 127' },
    { id:'venue.la-conv',      name:'LA Convention Center · West Hall',   address:'1201 S Figueroa St, Los Angeles, CA 90015',city:'Los Angeles, CA', loadInNotes:'Dock on Chick Hearn Ct · IATSE 33 required' }
  ].forEach(v => { if(!PCG.venues.find(x=>x.id===v.id)) PCG.venues.push(v); });

  // Seed Projects for each tour stop
  tourProjects.forEach(t => {
    if(PCG.findProject(t.code)) return;
    PCG.projects.push({
      code: t.code, name: t.name, client:'Lincoln Motor Company', clientId:'c.lincoln',
      aeId:'p.jspringer', pmId: 'p.jsharp', td:'p.ctaylor',
      venueId: t.venueId, venueName: t.venueId.replace('venue.',''),
      showType:'corporate-launch',
      dates:{ loadIn: t.loadIn+'T06:00', showStart: t.showStart+'T09:00', showEnd: t.showEnd+'T17:00', loadOut: t.loadOut+'T22:00', ret: t.loadOut+'T22:00' },
      status:'open', health: t.lifecycle==='Awarded'?'green':t.lifecycle==='InPrep'?'amber':'gray',
      show:{ id:t.code, lifecycleState: t.lifecycle },
      quoteNo:'Q-LIN-'+t.code.split('-')[1], manifestNo:null, pullSheetNo:null, customerPO:'PO-LIN-2026-0001',
      tourId:'tour.lincoln-navigator-26', tourStopNumber: tourProjects.indexOf(t)+1
    });
  });

  /* ----- The Tour itself ----- */
  PCG.tours = [{
    id:'tour.lincoln-navigator-26',
    name:'Lincoln Navigator 2027 National Launch Tour',
    clientId:'c.lincoln',
    accountAEId:'p.jspringer',
    primaryPMId:'p.jsharp',
    tourType:'Automotive',
    status:'Executing',
    startDate:'2026-05-04',
    endDate:'2026-06-13',
    primaryInventoryPackageId:'tpk.lincoln.inv.core',
    primaryCrewPackageId:'tpk.lincoln.crew.core',
    logisticsPlanId:'tlp.lincoln',
    masterROSTemplateId:'ros.tpl.lincoln-master',
    budgetSummary:{
      totalQuotedRevenue: 3850000,
      totalQuotedCost:   2130000,
      estimatedMargin:   0.447,
      travelBudget:       285000,
      freightBudget:      185000
    },
    notes:'Client traveling with tour: Marcus McNeil (Field Marketing). Brand ambassador on-site each city. Custom dealer kit activation in each regional hub — local hire expected at 6-8 crew per stop.',
    clientContactId:'cc.lin.hsolis'
  }];

  /* ----- Tour Stops ----- */
  PCG.tourStops = tourProjects.map((t, i) => ({
    id:'tstop.lincoln-'+t.code.split('-')[1].toLowerCase(),
    tourId:'tour.lincoln-navigator-26',
    stopNumber: i+1,
    city: t.city.split(',')[0],
    state: t.city.split(',')[1]?t.city.split(',')[1].trim():'',
    venueId: t.venueId,
    linkedProjectId: t.code,
    travelDaysBefore: i===0 ? 0 : 2,
    maintenanceDaysBefore: i===0 ? 5 : 1,
    dayOffsBefore: i===0 ? 0 : 1,
    loadInDate: t.loadIn,
    showDates: [t.showStart, t.showEnd],
    loadOutDate: t.loadOut,
    departureDate: i<tourProjects.length-1 ? (new Date(new Date(t.loadOut).getTime()+86400000).toISOString().slice(0,10)) : t.loadOut,
    stopStatus: i<2 ? 'Complete' : i===2 ? 'Active' : i===3 ? 'Prepping' : 'Upcoming',
    localCrewRequired: true,
    localCrewCount: 6 + i,
    localCrewBriefingNotes: 'IATSE rules per local. Start with AV Tech orientation + venue walkthrough 1h before call.',
    specialRequirements: i===0 ? 'NYC: union venue, 4h pre-call safety briefing required.'
                       : i===1 ? 'Chicago: marshaling yard 7 miles from venue, allow 45 min transit.'
                       : i===2 ? 'Atlanta: dock clearance 13\'6" — rooftop packages must route off-truck.'
                       : i===3 ? 'Dallas: heat advisory May-June — crew hydration protocol active.'
                       : 'LA: noise ordinance load-in before 7am.',
    stopBudgetOverride: null,
    issues: i===2 ? [{ id:'is.atl.1', at:'2026-05-24T11:20', summary:'Confidence monitor SDI drop on LED processor — swapped to spare.', severity:'minor' }] : [],
    notes: i===2 ? 'Live now — monitoring.' : ''
  }));

  /* ----- Tour Route (legs between stops) ----- */
  PCG.tourRoutes = [{
    id:'tr.lincoln',
    tourId:'tour.lincoln-navigator-26',
    orderedStops: PCG.tourStops.map(s=>s.id),
    legs: [
      { id:'trl.nyc-chi',  tourRouteId:'tr.lincoln', fromStopId:'tstop.lincoln-nyc', toStopId:'tstop.lincoln-chi', departureDate:'2026-05-09', estimatedArrivalDate:'2026-05-11', distanceMiles:790,  estimatedDriveHours:13, freightType:'OwnTruck', vehicleIds:['veh.t1','veh.t2','veh.t3'], driverIds:['drv.jreyes','drv.mhahn'], trackingNumber:null, notes:'Straight shot on I-80. One overnight.' },
      { id:'trl.chi-atl',  tourRouteId:'tr.lincoln', fromStopId:'tstop.lincoln-chi', toStopId:'tstop.lincoln-atl', departureDate:'2026-05-18', estimatedArrivalDate:'2026-05-20', distanceMiles:715,  estimatedDriveHours:11, freightType:'OwnTruck', vehicleIds:['veh.t1','veh.t2','veh.t3'], driverIds:['drv.jreyes','drv.mhahn'], trackingNumber:null, notes:'I-65 S via Indianapolis, Louisville.' },
      { id:'trl.atl-dfw',  tourRouteId:'tr.lincoln', fromStopId:'tstop.lincoln-atl', toStopId:'tstop.lincoln-dfw', departureDate:'2026-05-27', estimatedArrivalDate:'2026-05-30', distanceMiles:780,  estimatedDriveHours:12, freightType:'OwnTruck', vehicleIds:['veh.t1','veh.t2','veh.t3'], driverIds:['drv.jreyes'],            trackingNumber:null, notes:'Two overnight layovers. Montgomery, then Little Rock.' },
      { id:'trl.dfw-lax',  tourRouteId:'tr.lincoln', fromStopId:'tstop.lincoln-dfw', toStopId:'tstop.lincoln-lax', departureDate:'2026-06-05', estimatedArrivalDate:'2026-06-08', distanceMiles:1435, estimatedDriveHours:22, freightType:'OwnTruck', vehicleIds:['veh.t1','veh.t2','veh.t3'], driverIds:['drv.jreyes','drv.mhahn'], trackingNumber:null, notes:'Longest leg. 3-day buffer. Phoenix overnight recommended.' }
    ]
  }];

  /* ----- Tour Inventory Package (gear that travels the whole tour) ----- */
  PCG.tourInventoryPackages = [{
    id:'tpk.lincoln.inv.core',
    tourId:'tour.lincoln-navigator-26',
    name:'Lincoln Tour Core Package',
    description:'LED + audio + lighting + video switching package that travels all 5 cities.',
    totalWeightLbs: 18400,
    totalReplacementValue: 892000,
    packageStatus: 'AtStop',
    currentLocationId: 'venue.gwcc',
    currentStopId: 'tstop.lincoln-atl',
    items: [
      { id:'tii.j8',     packageId:'tpk.lincoln.inv.core', modelId:'inv.db-j8',      qty:24, serialIds:['J8-001','J8-002','J8-003','J8-004','J8-005','J8-006','J8-007','J8-008'], role:'MainSystem', damageNotes:[], replacedAtStopIds:[], currentCondition:'Good' },
      { id:'tii.jsub',   packageId:'tpk.lincoln.inv.core', modelId:'inv.db-jsub',    qty:6,  serialIds:[], role:'MainSystem', damageNotes:[], replacedAtStopIds:[], currentCondition:'Good' },
      { id:'tii.e2',     packageId:'tpk.lincoln.inv.core', modelId:'inv.barco-e2',   qty:1,  serialIds:['E2-001'], role:'MainSystem', damageNotes:[], replacedAtStopIds:[], currentCondition:'Excellent' },
      { id:'tii.ql5',    packageId:'tpk.lincoln.inv.core', modelId:'inv.yam-ql5',    qty:1,  serialIds:['QL5-002'], role:'MainSystem', damageNotes:[], replacedAtStopIds:[], currentCondition:'Good' },
      { id:'tii.ledf',   packageId:'tpk.lincoln.inv.core', modelId:'inv.ledf-3p9',   qty:180,serialIds:[], role:'MainSystem', damageNotes:[{ stopId:'tstop.lincoln-atl', note:'2 tiles cracked during load-in — swapped to spares', reportedAt:'2026-05-23T08:40', serviceTicketId:null }], replacedAtStopIds:['tstop.lincoln-atl'], currentCondition:'Fair' },
      { id:'tii.axd',    packageId:'tpk.lincoln.inv.core', modelId:'inv.shure-axd',  qty:4,  serialIds:['AXD-001','AXD-002','AXD-003','AXD-004'], role:'MainSystem', damageNotes:[], replacedAtStopIds:[], currentCondition:'Excellent' },
      { id:'tii.mon50',  packageId:'tpk.lincoln.inv.core', modelId:'inv.mon-50dual', qty:8,  serialIds:[], role:'Support', damageNotes:[], replacedAtStopIds:[], currentCondition:'Good' }
    ]
  }];

  /* ----- Tour Crew Package ----- */
  PCG.tourCrewPackages = [{
    id:'tpk.lincoln.crew.core',
    tourId:'tour.lincoln-navigator-26',
    name:'Lincoln Tour Core Crew',
    notes:'Core traveling crew for all 5 stops. Local hires (~6-8 per stop) added per city via Labor Coord.',
    travelingCrew: [
      { id:'tcm.1', packageId:'tpk.lincoln.crew.core', crewMemberId:'p.ctaylor', positionId:'pos.td',     role:'Core', startStopId:'tstop.lincoln-nyc', endStopId:'tstop.lincoln-lax', travelArrangement:'WithTour', confirmationStatus:'Confirmed' },
      { id:'tcm.2', packageId:'tpk.lincoln.crew.core', crewMemberId:'p.pshah',   positionId:'pos.a1',     role:'Core', startStopId:'tstop.lincoln-nyc', endStopId:'tstop.lincoln-lax', travelArrangement:'WithTour', confirmationStatus:'Confirmed' },
      { id:'tcm.3', packageId:'tpk.lincoln.crew.core', crewMemberId:'p.dkim',    positionId:'pos.dir.v',  role:'Core', startStopId:'tstop.lincoln-nyc', endStopId:'tstop.lincoln-lax', travelArrangement:'WithTour', confirmationStatus:'Confirmed' },
      { id:'tcm.4', packageId:'tpk.lincoln.crew.core', crewMemberId:'p.eliott',  positionId:'pos.ld',     role:'Core', startStopId:'tstop.lincoln-nyc', endStopId:'tstop.lincoln-lax', travelArrangement:'WithTour', confirmationStatus:'Confirmed' },
      { id:'tcm.5', packageId:'tpk.lincoln.crew.core', crewMemberId:'p.coliver', positionId:'pos.caller', role:'Core', startStopId:'tstop.lincoln-nyc', endStopId:'tstop.lincoln-lax', travelArrangement:'WithTour', confirmationStatus:'Confirmed' },
      { id:'tcm.6', packageId:'tpk.lincoln.crew.core', crewMemberId:'p.arachilla',positionId:'pos.v1',    role:'PartialTour', startStopId:'tstop.lincoln-nyc', endStopId:'tstop.lincoln-atl', travelArrangement:'WithTour', confirmationStatus:'Confirmed', replacedByCrewMemberId:'p.rbenoit', replacedAtStopId:'tstop.lincoln-dfw' },
      { id:'tcm.7', packageId:'tpk.lincoln.crew.core', crewMemberId:'p.rbenoit', positionId:'pos.v1',     role:'PartialTour', startStopId:'tstop.lincoln-dfw', endStopId:'tstop.lincoln-lax', travelArrangement:'FlyIn',    confirmationStatus:'Confirmed' }
    ]
  }];

  /* ----- Tour Logistics Plan ----- */
  PCG.tourLogisticsPlans = [{
    id:'tlp.lincoln',
    tourId:'tour.lincoln-navigator-26',
    primaryWarehouseId:'wh.troy',
    vehicles:['veh.t1','veh.t2','veh.t3'],
    driverRotation:[
      { driverId:'drv.jreyes', legs:['trl.nyc-chi','trl.chi-atl','trl.atl-dfw','trl.dfw-lax'] },
      { driverId:'drv.mhahn',  legs:['trl.nyc-chi','trl.chi-atl','trl.dfw-lax'] }
    ],
    standardLoadOrder:'Audio rigging first-on/last-off · LED bundles deck-side · Video switching in climate crate · Lighting last-on',
    caseManifestTemplate:'std.tour.lincoln',
    freightInsuranceValue: 892000,
    freightInsurancePolicyRef:'TRV-2026-LINC-892K',
    notes:'Refuel in Toledo + Nashville on long legs. Climate crate monitors log every 4h — Tour PM gets alert on >85F interior.'
  }];

  /* ----- Tour Day Types (per day, across full tour window) ----- */
  PCG.tourDayTypes = [
    // Calculated on-the-fly by tour.html, not pre-seeded here — the page derives from stops + legs
  ];

  /* -----------------------------------------------------------------
     FINAL SPEC §J.3 — Cycle Count records
  ----------------------------------------------------------------- */
  PCG.cycleCounts = [
    { id:'cc.2026.0040', countNumber:'CC-2026-0040', warehouseId:'wh.premier-main',
      countType:'Partial', scope:{ type:'Category', categoryIds:['cat.audio'] },
      status:'Approved', assignedToId:'p.svance',
      scheduledDate:'2026-03-15', startedAt:'2026-03-15T08:00', completedAt:'2026-03-15T12:30',
      approvedById:'p.svance', approvedAt:'2026-03-15T14:05', adjustmentsApplied:true,
      varianceSummary:{ totalLines:14, linesWithVariance:1, maxVariancePct:0.017 },
      notes:'Quarterly audio dept count. Clean. Low variance.',
      expectedLines:[], actualLines:[], varianceLines:[
        { id:'ccl.40.1', modelId:'inv.shure-axd', locationId:'wh.A.2.C', expectedQty:8, countedQty:8, variance:0, variancePct:0, countedById:'p.svance', countedAt:'2026-03-15T09:12' },
        { id:'ccl.40.2', modelId:'inv.db-j8',     locationId:'wh.A.12.B',expectedQty:24,countedQty:24,variance:0, variancePct:0, countedById:'p.svance', countedAt:'2026-03-15T09:40' }
      ]},
    { id:'cc.2026.0041', countNumber:'CC-2026-0041', warehouseId:'wh.premier-main',
      countType:'Spot', scope:{ type:'Model', modelIds:['inv.brk-wlshh','inv.brk-podmic'] },
      status:'PendingReview', assignedToId:'p.bwhit',
      scheduledDate:'2026-04-14', startedAt:'2026-04-14T13:30', completedAt:'2026-04-14T15:10',
      approvedById:null, approvedAt:null, adjustmentsApplied:false,
      varianceSummary:{ totalLines:2, linesWithVariance:2, maxVariancePct:0.085 },
      notes:'Discrepancy detected on wireless handhelds — pending WH Lead review.',
      expectedLines:[], actualLines:[], varianceLines:[
        { id:'ccl.41.1', modelId:'inv.brk-wlshh',  locationId:'wh.B.4.A', expectedQty:36, countedQty:33, variance:-3, variancePct:-0.083, countedById:'p.bwhit', countedAt:'2026-04-14T14:15', note:'3 units not in bin — possibly at SAE still.' },
        { id:'ccl.41.2', modelId:'inv.brk-podmic', locationId:'wh.B.4.B', expectedQty:48, countedQty:46, variance:-2, variancePct:-0.042, countedById:'p.bwhit', countedAt:'2026-04-14T14:45', note:'2 short. Check IC return queue.' }
      ]},
    { id:'cc.2026.0042', countNumber:'CC-2026-0042', warehouseId:'wh.troy',
      countType:'Full', scope:{ type:'All' },
      status:'Planned', assignedToId:'p.bwhit',
      scheduledDate:'2026-04-22', startedAt:null, completedAt:null,
      approvedById:null, approvedAt:null, adjustmentsApplied:false,
      varianceSummary:null,
      notes:'Quarterly Troy full count. Budget day allocated.',
      expectedLines:[], actualLines:[], varianceLines:[]}
  ];

  PCG.inventoryAdjustments = [
    { id:'adj.001', modelId:'inv.shure-axd', warehouseId:'wh.premier-main', locationId:'wh.A.2.C',
      adjustmentType:'CycleCount', quantityBefore:8, quantityAfter:8, quantityDelta:0,
      reason:'Confirmed — no variance', adjustedById:'p.svance', adjustedAt:'2026-03-15T14:05',
      cycleCountId:'cc.2026.0040', approvedById:'p.svance', approvedAt:'2026-03-15T14:05' }
  ];

  /* -----------------------------------------------------------------
     Augment existing actionQueue with explicit roles
  ----------------------------------------------------------------- */
  (PCG.actionQueue||[]).forEach(q=>{
    if(!q.roles){
      if(q.kind==='approval') q.roles = [PCG.GROUPS.ADMIN, PCG.GROUPS.DIRECTORS, PCG.GROUPS.ACCOUNTING, PCG.GROUPS.AE];
      else if(q.kind==='decision') q.roles = [PCG.GROUPS.ADMIN, PCG.GROUPS.AE, PCG.GROUPS.DIRECTORS];
      else if(q.kind==='risk') q.roles = [PCG.GROUPS.ADMIN, PCG.GROUPS.TSMS, PCG.GROUPS.AE];
      else if(q.kind==='ownership') q.roles = [PCG.GROUPS.ADMIN, PCG.GROUPS.SCHEDULING, PCG.GROUPS.TSMS];
      else q.roles = [PCG.GROUPS.ADMIN];
    }
  });

})();
