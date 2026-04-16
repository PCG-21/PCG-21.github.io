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

  PCG.crewPositions = [
    { id:'pos.a1',      name:'Audio A1',        department:'Audio',   union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:85, billRate:125}] },
    { id:'pos.a2',      name:'Audio A2',        department:'Audio',   union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:60, billRate:90}] },
    { id:'pos.v1',      name:'Video V1',        department:'Video',   union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:80, billRate:120}] },
    { id:'pos.dir.v',   name:'Video Director',  department:'Video',   union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:95, billRate:140}] },
    { id:'pos.ld',      name:'Lighting LD',     department:'Lighting',union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:82, billRate:122}] },
    { id:'pos.me',      name:'Lighting ME',     department:'Lighting',union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:55, billRate:85}] },
    { id:'pos.caller',  name:'Show Caller',     department:'Production',union:null, unionLocal:null,
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:90, billRate:135}] },
    { id:'pos.td',      name:'Technical Director', department:'Production', union:null, unionLocal:null,
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:110, billRate:160}] },
    { id:'pos.avtech',  name:'AV Tech',         department:'Mixed', union:null, unionLocal:null,
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:45, billRate:75}] },
    { id:'pos.led',     name:'LED Lead',        department:'Video', union:'IATSE', unionLocal:'720',
      ratesByVersion:[{rateCardVersionId:'rc.2026.Q1', payRate:70, billRate:105}] }
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
  // qualifications map
  const qMap = {
    'p.pshah':['pos.a1','pos.a2'],
    'p.mchen':['pos.a1'],
    'p.dkim':['pos.v1','pos.dir.v'],
    'p.eliott':['pos.ld'],
    'p.ctaylor':['pos.td'],
    'p.jgerber':['pos.caller','pos.td'],
    'p.rbenoit':['pos.led','pos.avtech'],
    'p.dmar':['pos.avtech'],
    'p.arachilla':['pos.avtech']
  };
  PCG.crewMembers.forEach(m=>{
    (qMap[m.id]||[]).forEach(posId=>{
      m.qualifications.push({ positionId:posId, rating: 5 });
    });
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
