/* ==========================================================================
   PCG STAGE — Seed Data
   Real projects (LCE-2026, SAE-WCX-2026) + plausible portfolio.
   Mirrors the shape of a SharePoint List response.
   ========================================================================== */

window.PCG = window.PCG || {};
window.PCG.today = new Date("2026-04-15T09:30:00");

window.PCG.user = {
  id: "u.jsharp",
  name: "James Sharp",
  initials: "JS",
  email: "jsharp@premiercreativegroup.com",
  role: "Project Manager",
  groups: ["PCG-ProjectManagers", "PCG-Leadership"]
};

window.PCG.venues = [
  {
    id: "v.caesars-forum",
    name: "Caesars Forum Conference Center",
    address: "3911 Koval Ln, Las Vegas, NV 89109",
    loadInNotes: "Dock on east side. Union crew required (IATSE 720). Security escort to forum ballrooms after 10pm. No overnight truck parking — stage at Silver State Industrial Park.",
    dockHours: "24/7 with advance schedule. 30min max standing load zone, Koval side.",
    union: true,
    knownQuirks: [
      "WiFi locked down — request SSID from venue tech 48h prior",
      "Freight elevator #3 is load-rated higher; prefer for case carts",
      "Forum Ballroom ceiling has non-standard truss points — confirm rigging plot"
    ]
  },
  {
    id: "v.huntington",
    name: "Huntington Place (Detroit)",
    address: "1 Washington Blvd, Detroit, MI 48226",
    loadInNotes: "Dock on Atwater side. IATSE 38 union house. Load-in windows strictly enforced — show ops desk cuts access if late.",
    dockHours: "6am–11pm with badge. Loading dock 3 has 53' clearance.",
    union: true,
    knownQuirks: [
      "Room numbers by floor (110–116, 140–142 wing, 250s, 300s, 400s)",
      "Cell coverage weak in 140–142 sub-level; carry radios",
      "Show office is Meeting Room 312A"
    ]
  },
  {
    id: "v.mgm-grand",
    name: "MGM Grand Conference Center",
    address: "3799 Las Vegas Blvd S, Las Vegas, NV 89109",
    loadInNotes: "Dock behind Arena entrance. Non-union house but house tech must be on clock during rig.",
    dockHours: "24/7",
    union: false,
    knownQuirks: []
  },
  {
    id: "v.crocker",
    name: "Market Square — Crocker Park",
    address: "239 Market St, Westlake, OH 44145",
    loadInNotes: "NO STOPPING on Vine Street. Unload on side street between Market Square and the gravel lot — hazards on, move vehicle immediately after. Trucks park in American Greetings surface lot or Promenade lot.",
    dockHours: "7am–10pm",
    union: false,
    knownQuirks: [
      "Tight residential area — keep idling minimal",
      "No signage on exterior — crew call from main entrance"
    ]
  },
  {
    id: "v.mccormick",
    name: "McCormick Place (Chicago)",
    address: "2301 S King Dr, Chicago, IL 60616",
    loadInNotes: "IATSE 2 + Teamsters 727. Rigging must go through house.",
    dockHours: "Strict daily schedule",
    union: true,
    knownQuirks: ["Marshalling yard required for all trucks 53'+"]
  },
  {
    id: "v.wardman",
    name: "Omni Shoreham Hotel",
    address: "2500 Calvert St NW, Washington, DC 20008",
    loadInNotes: "Dock rear of property. Non-union. No rigging — scenic must be freestanding or clamped.",
    dockHours: "6am–midnight",
    union: false,
    knownQuirks: []
  }
];

// --- Contacts (selective; used in handoff/playbook) ---
window.PCG.contacts = [
  // LCE
  { id: "c.lce.kspringer",  project: "LCE-2026", name: "Jennifer Beth",       role: "Client — Program Lead",        category: "client", phone: "+1 313 555 0199", email: "jbeth@lce.com", onsite: true },
  { id: "c.lce.kadams",     project: "LCE-2026", name: "Kevin Adams",          role: "Client — Content / PPT Coord", category: "client", phone: "+1 313 555 0142", email: "kadams@lce.com", onsite: true },
  { id: "c.lce.tjimenez",   project: "LCE-2026", name: "Tina Jimenez",         role: "Client — Billing",             category: "client", phone: "+1 313 555 0108", email: "ap@lce.com" },
  { id: "c.lce.vmallon",    project: "LCE-2026", name: "Vincent Mallon",       role: "Venue — Tech Liaison",         category: "venue",  phone: "+1 702 555 0177", email: "v.mallon@caesars.com" },
  // SAE
  { id: "c.sae.mclay",      project: "SAE-WCX-2026", name: "Megan Clay",       role: "Client — Conference Producer", category: "client", phone: "+1 248 555 0112", email: "mclay@sae.org", onsite: true },
  { id: "c.sae.rhoffman",   project: "SAE-WCX-2026", name: "Ryan Hoffman",     role: "Client — Technical Sessions",  category: "client", phone: "+1 248 555 0155", email: "rhoffman@sae.org", onsite: true },
  { id: "c.sae.gwoods",     project: "SAE-WCX-2026", name: "Gary Woods",       role: "Venue — Event Manager",        category: "venue",  phone: "+1 313 555 0134", email: "gwoods@huntingtonplace.com" },
];

// --- People / Internal crew ---
window.PCG.people = [
  { id: "p.jsharp",  name: "James Sharp",    initials: "JS", role: "PM / Platform" },
  { id: "p.jspringer", name: "Jeff Springer", initials: "JF", role: "Account Manager" },
  { id: "p.koliver",   name: "Keith Oliver",   initials: "KO", role: "Creative Director" },
  { id: "p.tscheff",   name: "Tyler Scheff",   initials: "TS", role: "Mini GS / Breakouts Lead" },
  { id: "p.ctaylor",   name: "Chris Taylor",   initials: "CT", role: "TD — Ballroom GS" },
  { id: "p.jgerber",   name: "Jason Gerber",   initials: "JG", role: "Show Caller" },
  { id: "p.coliver",   name: "Chelsea Oliver", initials: "CO", role: "ShoFlo / Schedules" },
  { id: "p.arachilla", name: "Alex Rachilla",  initials: "AR", role: "Quote / Pull Sheet" },
  { id: "p.pshah",     name: "Priya Shah",     initials: "PS", role: "Audio A1" },
  { id: "p.mchen",     name: "Mike Chen",      initials: "MC", role: "Audio A1 (Freelance)" },
  { id: "p.dkim",      name: "Dana Kim",       initials: "DK", role: "Video V1" },
  { id: "p.eliott",    name: "Elliot Reyes",   initials: "ER", role: "Lighting LD" },
  { id: "p.rbenoit",   name: "Renée Benoit",   initials: "RB", role: "LED Lead / Cam 1" },
  { id: "p.dmar",      name: "Dan Marino",     initials: "DM", role: "Scenic Lead / Cam 2" },
  { id: "p.svance",    name: "Steph Vance",    initials: "SV", role: "Warehouse / Logistics" },
  { id: "p.lperez",    name: "Lara Perez",     initials: "LP", role: "Procurement" },
  { id: "p.bwhit",     name: "Brandon White",  initials: "BW", role: "Finance Controller" },
];

// --- Projects ---
window.PCG.projects = [
  /* ---------------- LCE-2026 — Real (P01-5437) ---------------- */
  {
    code: "LCE-2026",
    name: "LCE — Conference 2026",
    client: "Little Caesars Enterprises, Inc.",
    clientAddress: "2211 Woodward Ave, Detroit, MI 48201",
    showType: "general-session",
    status: "in-prep",
    health: "amber",
    venueId: "v.caesars-forum",
    venueName: "Caesars Forum, Las Vegas",
    primaryPM: "p.jspringer",
    secondaryPM: "p.jsharp",
    td: "p.ctaylor",
    creativeLead: "p.koliver",
    showCaller: "p.jgerber",
    dates: {
      prep:    "2026-04-03",
      loadIn:  "2026-04-10T07:00",
      showStart:"2026-04-13T06:00",
      showEnd: "2026-04-15T18:00",
      loadOut: "2026-04-15T23:00",
      ret:     "2026-04-20T11:00"
    },
    // Cross-refs
    quoteNo: "P01-5437",
    manifestNo: "EHMYY",
    pullSheetNo: "UZ4JX",
    customerPO: "LCEP186991",
    terms: "50% / NET 30 — Tax Exempt",
    rateDays: 2.25,
    amountsApprox: {
      audio: 47477.86,
      video: 60159.42,
      lighting: 38200.00,
      scenic: 29400.00,
      labor: 58200.00,
      trucking: 11400.00,
      misc: 4850.00
    },
    stageSet: "Marquee",
    oneLiner: "4-day corporate conference for Little Caesars leadership. Main GS + Awards + breakouts at Caesars Forum.",
    scopeSold: [
      "Main General Session, Caesars Forum Ballroom",
      "Marquee stage set (LED header, split fabric traveler)",
      "d&b J-Series line array, 4x flown arrays + JSub",
      "4x HD camera package (2x Fujinon long lens + 3x ENG)",
      "Barco E2 4K screen management",
      "Axient Digital wireless — 12ch handheld/beltpack",
      "Cocktail reception — ambient reinforcement (Tues night)",
      "Awards program — Day 4 evening"
    ],
    scopeCurrent: [
      "Main General Session, Caesars Forum Ballroom",
      "Marquee stage set (LED header, split fabric traveler)",
      "d&b J-Series line array, 4x flown arrays + JSub",
      "4x HD camera package (2x Fujinon long lens + 3x ENG) + PEEK-A-BOO Sony robo package",
      "Barco E2 4K screen management",
      "Axient Digital wireless — 16ch handheld/beltpack (UPGRADED from 12ch)",
      "Cocktail reception — ambient reinforcement (Tues night) + DJ patch",
      "Awards program — Day 4 evening (RSVP +35)",
      "Recovery room (AWARDS ready room) — ADDED Apr 14"
    ],
    attention: [
      { kind: "red",   title: "Sub-rental on 2x d&b JSubs — confirmation deadline Tue 4pm PT", owner: "p.svance", due: "2026-04-15T16:00" },
      { kind: "amber", title: "Awards ready room not yet costed or in Flex",                    owner: "p.jspringer", due: "2026-04-16T12:00" },
      { kind: "amber", title: "Client sponsor loop PPT not received",                            owner: "p.koliver",   due: "2026-04-16T17:00" },
      { kind: "blue",  title: "Confirm union call changes with IATSE 720 steward",               owner: "p.ctaylor",   due: "2026-04-17T09:00" }
    ],
    risks: [
      { title: "d&b JSub sub-rental unconfirmed", sev: "high",   owner: "p.svance",  status: "open", mitigation: "Secondary vendor (Solotech) on hold; go/no-go 4/15 16:00 PT." },
      { title: "A1 Mike Chen double-booked vs SAE WCX 4/14", sev: "high", owner: "p.jspringer", status: "open", mitigation: "Reassign to Priya Shah; Mike covers SAE only." },
      { title: "Client sponsor loop content late", sev: "medium", owner: "p.koliver",  status: "open", mitigation: "Placeholder loop drafted; swap-in point in V1 flow." },
      { title: "Awards ready room power spec unknown", sev: "medium", owner: "p.ctaylor", status: "open", mitigation: "Walkthrough scheduled 4/16 PM with venue." }
    ],
    approvals: [
      { title: "Change Order #3 — Awards ready room (+$18,400)", requester: "p.jspringer", approver: "p.bwhit", status: "pending", since: "2026-04-14" },
      { title: "Sub-rental 2x JSub via Solotech ($4,200)",        requester: "p.svance",    approver: "p.jspringer", status: "pending", since: "2026-04-14" }
    ],
    changes: [
      { date: "2026-04-14", title: "Client added Awards ready room", by: "Kevin Adams (client)", impact: "+$18,400 est; needs Flex update; power walkthrough" },
      { date: "2026-04-13", title: "Wireless mics upgraded 12→16ch", by: "Ryan Hoffman (client)", impact: "Flex v3 + AD4Q quad receivers added" },
      { date: "2026-04-12", title: "A1 reassigned: Mike Chen → Priya Shah", by: "Jeff Springer",  impact: "Conflict resolved against SAE WCX" },
      { date: "2026-04-11", title: "CO #2 approved (+$12,800)",              by: "Brandon White",  impact: "Cocktail DJ patch + extra IFB adds" }
    ],
    gearSummary: {
      audio: [
        { group: "CONTROL", items: "Yamaha CL5 + 2x QLab + I/O racks" },
        { group: "MAIN SYSTEM", items: "4x d&b J Flying Frame, 24x J8, 12x JSub" },
        { group: "CENTER CLUSTERS", items: "3x d&b Q1 4-pack (2 clusters of 6)" },
        { group: "FRONT FILL", items: "4x d&b Q10 2-pack" },
        { group: "OUTFILL / DELAYS", items: "4x d&b Q1 4-pack (4 clusters of 4)" },
        { group: "WIRELESS", items: "Shure Axient Digital 4-pack + 8-pack (16ch G57+)" },
        { group: "COMMS", items: "Clear-Com Arcadia + 2x FS II 5-station" }
      ],
      video: [
        { group: "SCREEN CONTROL", items: "Barco E2 4K" },
        { group: "PROJECTION", items: "2x Panasonic PT-RZ14KU + 0.9-1.1 zoom lenses" },
        { group: "CAMERAS", items: "2x BMD URSA Broadcast G2 + Fujinon 42x & 55x long lens + 3x ENG" },
        { group: "AWARDS/CONCERT CAMS", items: "3x URSA + 16x lens kit, CamWave wireless" },
        { group: "PEEK-A-BOO", items: "Sony SRG-X400 robo package (3)" },
        { group: "MONITORS", items: "5x 50\" confidence + 4x 50\" backstage + FOH/Graphics Ops" },
        { group: "RECORDS", items: "3x BMD 4K dual recorders + 12x 2TB SSD" }
      ],
      lighting: [],
      scenic: []
    },
    docs: [
      { title: "Quote P01-5437 (v3)",        url: "#", sz: "1.2 MB", pinned: true,  cat: "Quote" },
      { title: "Manifest EHMYY",             url: "#", sz: "380 KB", pinned: true,  cat: "Flex" },
      { title: "Pull Sheet UZ4JX",           url: "#", sz: "2.1 MB", pinned: true,  cat: "Flex" },
      { title: "Ballroom Rigging Plot v2",   url: "#", sz: "4.5 MB", pinned: true,  cat: "Plots" },
      { title: "Show Flow v4 (ShoFlo)",      url: "#", sz: "—",      pinned: true,  cat: "Script" },
      { title: "Client Master Agenda v7",    url: "#", sz: "220 KB", pinned: false, cat: "Client" },
      { title: "Marquee Set Renderings",     url: "#", sz: "28 MB",  pinned: true,  cat: "Creative" },
      { title: "Venue Load-In Map",          url: "#", sz: "180 KB", pinned: true,  cat: "Venue" },
      { title: "IATSE 720 Call Confirmation",url: "#", sz: "42 KB",  pinned: false, cat: "Labor" }
    ],
    pmNotes: `**Vincent at Caesars is picky about dock timing.** Confirm truck arrival within the 15-minute window he gives you — he will turn trucks away.

Kevin Adams sends all PPTs via USB, expects to deliver day-of. Build buffer into DSM load — do NOT expect Monday content in hand before Sunday night.

**Client billing contact is Tina Jimenez, NOT Kevin.** CO invoices go to Tina's address only.

Client expects sponsor slideshow loop running during ALL non-presentation time. If we don't get content by Wed 5pm, use placeholder loop in V1 show folder.

Jennifer Beth is the real decision-maker onsite — if Kevin is uncertain on a scope change, escalate to Jennifer, not back through email.`,
    activity: [
      { ts: "2026-04-15T09:12", actor: "Jeff Springer",  text: "Posted daily status — flagged JSub sub-rental as go/no-go at 16:00 PT today." },
      { ts: "2026-04-14T17:40", actor: "Kevin Adams",    text: "Client request: add Awards ready room (recovery space). Needs full AV." },
      { ts: "2026-04-14T15:22", actor: "Alex Rachilla",  text: "Flex Pull Sheet UZ4JX updated to v3 (added 6x Source Four LEDs)." },
      { ts: "2026-04-14T11:06", actor: "Brandon White",  text: "CO #2 approved — $12,800 for cocktail DJ patch + IFB adds." },
      { ts: "2026-04-13T20:18", actor: "Jeff Springer",  text: "A1 reassigned: Mike Chen → Priya Shah (resolving SAE WCX conflict)." },
      { ts: "2026-04-13T14:03", actor: "Chris Taylor",   text: "Rigging plot v2 issued — revised fly points for Forum Ballroom truss." },
      { ts: "2026-04-12T10:45", actor: "Chelsea Oliver", text: "ShoFlo Show Flow v4 published — awards program block added." }
    ]
  },

  /* ---------------- SAE-WCX-2026 — Real (breakout-heavy) ---------------- */
  {
    code: "SAE-WCX-2026",
    name: "SAE WCX 2026 — World Congress Experience",
    client: "SAE International",
    clientAddress: "400 Commonwealth Dr, Warrendale, PA 15096",
    showType: "breakout-heavy",
    status: "in-prep",
    health: "amber",
    venueId: "v.huntington",
    venueName: "Huntington Place, Detroit",
    primaryPM: "p.tscheff",
    secondaryPM: "p.jsharp",
    td: "p.ctaylor",
    creativeLead: "p.koliver",
    dates: {
      prep:    "2026-04-06",
      loadIn:  "2026-04-10T07:00",
      showStart:"2026-04-14T07:00",
      showEnd: "2026-04-16T18:00",
      loadOut: "2026-04-16T23:00",
      ret:     "2026-04-20T11:00"
    },
    quoteNo: "P01-5481",
    manifestNo: "GTRWA",
    pullSheetNo: "BF2XK",
    customerPO: "SAE-26-WCX-017",
    terms: "NET 30",
    rateDays: 4,
    stageSet: "Distributed (30+ rooms, no centralized set)",
    oneLiner: "SAE annual technical conference. 30+ concurrent technical session rooms across Huntington Place, plus 2 keynote ballrooms and a Ground Vehicle Committee meeting.",
    scopeSold: [
      "30 breakout rooms — standard session kit (8' table, stand, LCD, laptop, pod/desk mics)",
      "2 technical session rooms (330A/B) — enhanced kit, 9 audio inputs each",
      "Larger session rooms 320, 321 — 5 inputs",
      "Keynote I–IV in Ballroom",
      "Track Rooms 1–5 (rotating tech program)",
      "House audio (HS) in 330s, 400s corridor rooms",
      "Daily room refresh / sweep crew"
    ],
    scopeCurrent: [
      "30 breakout rooms — standard session kit (8' table, stand, LCD, laptop, pod/desk mics)",
      "2 technical session rooms (330A/B) — enhanced kit, 9 audio inputs each",
      "Larger session rooms 320, 321 — 5 inputs",
      "Keynote I–IV in Ballroom",
      "Track Rooms 1–5 (rotating tech program)",
      "House audio (HS) in 330s, 400s corridor rooms",
      "Daily room refresh / sweep crew",
      "ADDED 4/14: 310B as CRC Classroom (on own) — 5 inputs, HS speaker, chart stand"
    ],
    attention: [
      { kind: "red",   title: "30x LCDs: 6 due back from Globex GSK on 4/13 — cutting it close for 4/14 show start", owner: "p.svance", due: "2026-04-13T18:00" },
      { kind: "amber", title: "Crew coverage 4/13 strike → 4/14 set gap — 3 techs needed overnight",                   owner: "p.tscheff", due: "2026-04-12T17:00" },
      { kind: "amber", title: "Breakout sheet v7 needs reconciliation with SAE's published agenda",                    owner: "p.coliver", due: "2026-04-15T12:00" },
      { kind: "blue",  title: "IATSE 38 day-of call confirmation",                                                     owner: "p.ctaylor", due: "2026-04-13T09:00" }
    ],
    risks: [
      { title: "Shared inventory with LCE — 6x 50\" LCDs returning from LV 4/15",  sev: "high",   owner: "p.svance",   status: "open", mitigation: "Confirmed alt supply from Detroit warehouse; 2 LCDs held as buffer." },
      { title: "Crew fatigue — same people on LCE load-out 4/15 → SAE coverage",    sev: "medium", owner: "p.tscheff",  status: "open", mitigation: "No overlap crew; LCE strike team does not pull SAE shifts." },
      { title: "Room 310B added last-week — billing path unclear (master vs own)",  sev: "low",    owner: "p.jsharp",   status: "open", mitigation: "Pending answer from Steph on billing; hold invoicing." },
      { title: "Huntington dock schedule tight — 8-truck stagger required",         sev: "medium", owner: "p.ctaylor",  status: "open", mitigation: "Marshalling yard confirmed; trucks staged 30min windows." }
    ],
    approvals: [
      { title: "Add Room 310B CRC Classroom kit", requester: "p.tscheff", approver: "p.jspringer", status: "pending", since: "2026-04-14" }
    ],
    changes: [
      { date: "2026-04-14", title: "Room 310B added (CRC Classroom)",         by: "Megan Clay (client)", impact: "+5 audio inputs; billing TBD" },
      { date: "2026-04-13", title: "320/321 scaled down — 'more intimate'",    by: "Ryan Hoffman (client)", impact: "-4 inputs each; kept HS speaker; no impact to load" },
      { date: "2026-04-11", title: "Breakout sheet v7 published",              by: "Chelsea Oliver",        impact: "Matches SAE agenda except 3 room labels" }
    ],
    gearSummary: {
      audio: [
        { group: "BREAKOUT STANDARD KIT (x30 rooms)", items: "8' table, stand, LCD, laptop, PC DI, PR, floor mic stand, wireless HH, pod mic, 2x desk mic, mixer, HS speaker" },
        { group: "ENHANCED TECH SESSIONS (330A/B)",   items: "2x tables, 2 stands, 2 LCDs, 1 VDA, 6 desk mics, 9 inputs" },
        { group: "LARGER SESSIONS (320, 321)",        items: "standard kit + 2 desk mics, 5 inputs, chart stand (321)" },
        { group: "TOTALS (across floor)",              items: "31 stands, 30 LCDs, 27 laptops, 27 PC DIs, 27 PRs, 27 wireless lavs, 26 wireless HH, 66 pod mics, 27 mixers, 146 audio inputs" }
      ],
      video: [
        { group: "KEYNOTE BALLROOM",  items: "Separate package — PA, 2x 20k lasers, confidence monitors, Barco E2" },
        { group: "TRACK ROOMS (1–5)", items: "Rotating tech program kit — 1x 75\" monitor, 1x laptop, wireless handheld" }
      ]
    },
    docs: [
      { title: "Quote P01-5481",                    url: "#", sz: "1.8 MB", pinned: true,  cat: "Quote" },
      { title: "Breakout Sheet v7 (xlsm)",          url: "#", sz: "640 KB", pinned: true,  cat: "Breakouts" },
      { title: "Huntington Place Load-In Map",      url: "#", sz: "520 KB", pinned: true,  cat: "Venue" },
      { title: "SAE Published Program",             url: "#", sz: "2.3 MB", pinned: true,  cat: "Client" },
      { title: "IATSE 38 Call Schedule",            url: "#", sz: "40 KB",  pinned: true,  cat: "Labor" },
      { title: "Standard Breakout Kit Spec",        url: "#", sz: "90 KB",  pinned: false, cat: "Reference" }
    ],
    pmNotes: `**Floor-by-floor ownership:** 100s = Scheff, 140s/142s = Kim, 250s = Ramos, 300s = Taylor, 400s = Scheff. We sweep at 7am, 12pm, 5pm — nothing stays broken for more than ~3 hrs.

**330A/B is the star track — enhanced kit, 9 inputs.** Ryan Hoffman produces this personally. He will text you at 6am. Answer.

Don't assume committee meetings (312B) need the full rig — they often want paper, water, and silence. Confirm with session owner before rolling a kit in.

**"On own" billing note:** Some rooms (313A PFL 180 Session, 310B CRC Classroom) are billed separately, NOT under master SAE PO. When in doubt — ask Steph Vance before invoicing.

Track Room 5 has a lectern microphone issue on 2025 show — take extra pod mic as backup.`,
    activity: [
      { ts: "2026-04-15T08:55", actor: "Tyler Scheff",   text: "Sweep crew confirmed 7am/12pm/5pm walk-throughs for Tue–Thu." },
      { ts: "2026-04-14T19:10", actor: "Megan Clay",     text: "Client: please add 310B as CRC Classroom — need mic kit + HS." },
      { ts: "2026-04-14T09:30", actor: "Chris Taylor",   text: "Dock schedule confirmed with Huntington — 8 truck stagger locked." },
      { ts: "2026-04-13T16:05", actor: "Chelsea Oliver", text: "Breakout Sheet v7 published; 3 room labels drift from SAE program." },
      { ts: "2026-04-12T11:50", actor: "Steph Vance",    text: "6x 50\" LCDs: coming back from LCE Globex on 4/13 PM — buffer held." }
    ]
  },

  /* ---------------- Globex Sales Kickoff 2026 ---------------- */
  {
    code: "GLBX-GSK26",
    name: "Globex — Global Sales Kickoff 2026",
    client: "Globex Corporation",
    clientAddress: "1701 Market St, Philadelphia, PA 19103",
    showType: "general-session",
    status: "live",
    health: "green",
    venueId: "v.mgm-grand",
    venueName: "MGM Grand, Las Vegas",
    primaryPM: "p.jsharp",
    td: "p.ctaylor",
    creativeLead: "p.koliver",
    dates: {
      prep:   "2026-04-01",
      loadIn: "2026-04-08T06:00",
      showStart: "2026-04-11T07:00",
      showEnd: "2026-04-13T18:00",
      loadOut: "2026-04-13T23:00",
      ret:    "2026-04-18T11:00"
    },
    quoteNo: "P01-5402", manifestNo: "KD72J", pullSheetNo: "LW88C",
    customerPO: "GLBX-26-KO-44", terms: "NET 30", rateDays: 3,
    stageSet: "Nova",
    oneLiner: "3-day sales kickoff — 2800 pax, high-energy GS + breakouts + awards dinner.",
    scopeSold: ["GS Arena — Nova stage set","LED wall 32' × 14'","Wireless 20ch","4-camera package","Awards dinner night 2"],
    scopeCurrent: ["GS Arena — Nova stage set","LED wall 32' × 14'","Wireless 20ch","4-camera package","Awards dinner night 2","Added: pre-function cocktail ambient"],
    attention: [{kind:"blue", title:"Final strike 4/13 night — strike crew confirmed", owner:"p.ctaylor", due:"2026-04-13T22:00"}],
    risks: [], approvals: [],
    changes: [{date:"2026-04-14",title:"Pre-function cocktail ambient added", by:"Keith Oliver", impact:"+1 tech, +$2,400"}],
    gearSummary: { audio:[], video:[], lighting:[], scenic:[] },
    docs: [], pmNotes: "Nova set — standard load. Client is repeat, low drama.", activity: []
  },

  /* ---------------- Women of Color Conference 2026 ---------------- */
  {
    code: "WOC-2026",
    name: "Women of Color — Annual Conference 2026",
    client: "Women of Color Magazine",
    clientAddress: "Fairfax, VA",
    showType: "general-session",
    status: "confirmed",
    health: "green",
    venueId: "v.wardman",
    venueName: "Omni Shoreham, Washington DC",
    primaryPM: "p.tscheff",
    td: "p.dmar",
    creativeLead: "p.koliver",
    dates: { prep:"2026-05-05", loadIn:"2026-05-14T06:00", showStart:"2026-05-16T08:00", showEnd:"2026-05-17T21:00", loadOut:"2026-05-17T23:30", ret:"2026-05-20T11:00" },
    quoteNo: "P01-5510", manifestNo: null, pullSheetNo: null, customerPO: "WOC-2026-02", terms: "NET 30", rateDays: 2,
    stageSet: "Miyra",
    oneLiner: "2-day conference + awards. Creative-heavy, custom LED scenic treatment, general session + 3 breakouts.",
    scopeSold: ["Miyra stage set","Custom LED treatment per Signature Design brief","GS + 3 breakouts","Awards ceremony night 2","Pre-function activation"],
    scopeCurrent: ["Miyra stage set","Custom LED treatment per Signature Design brief","GS + 3 breakouts","Awards ceremony night 2","Pre-function activation"],
    attention: [], risks: [], approvals: [],
    changes: [],
    gearSummary: { audio:[], video:[], lighting:[], scenic:[] },
    docs: [], pmNotes: "", activity: []
  },

  /* ---------------- Detroit Auto Show booth (overlap to show conflict) ---------------- */
  {
    code: "DAS-BOOTH-26",
    name: "Detroit Auto Show — OEM Booth Activation",
    client: "Stellantis Marketing",
    clientAddress: "1000 Chrysler Dr, Auburn Hills, MI",
    showType: "expo-booth",
    status: "confirmed",
    health: "amber",
    venueId: "v.huntington",
    venueName: "Huntington Place, Detroit",
    primaryPM: "p.jspringer",
    td: "p.dmar",
    dates: { prep:"2026-04-15", loadIn:"2026-04-18T06:00", showStart:"2026-04-22T09:00", showEnd:"2026-04-24T18:00", loadOut:"2026-04-24T22:00", ret:"2026-04-27T11:00" },
    quoteNo:"P01-5541", manifestNo:null, pullSheetNo:null, customerPO:"STLNT-DAS-007", terms:"NET 30", rateDays:3,
    oneLiner: "3-day booth activation, 50' × 60' footprint, interactive LED + reveal stage.",
    scopeSold: ["30' curved LED backwall","Reveal stage with fog system","Interactive touchscreens (4)","Live talent cue system"],
    scopeCurrent: ["30' curved LED backwall","Reveal stage with fog system","Interactive touchscreens (4)","Live talent cue system"],
    attention: [{kind:"amber", title:"Dock sharing with SAE strike 4/16 PM — potential collision", owner:"p.jspringer", due:"2026-04-16T12:00"}],
    risks: [{title:"Inbound truck window overlaps SAE outbound", sev:"medium", owner:"p.dmar", status:"open", mitigation:"Staggered marshalling yard hold"}],
    approvals: [], changes: [], gearSummary:{audio:[],video:[],lighting:[],scenic:[]}, docs:[], pmNotes:"", activity:[]
  },

  /* ---------------- TechCo Expo — LIVE right now ---------------- */
  {
    code: "TCO-EXPO",
    name: "TechCo — Partner Expo Activations",
    client: "TechCo Inc.",
    showType: "expo",
    status: "live",
    health: "green",
    venueId: "v.mccormick",
    venueName: "McCormick Place, Chicago",
    primaryPM: "p.jsharp",
    td: "p.dmar",
    dates: { prep:"2026-04-09", loadIn:"2026-04-14T06:00", showStart:"2026-04-17T09:00", showEnd:"2026-04-19T17:00", loadOut:"2026-04-19T21:00", ret:"2026-04-22T11:00" },
    quoteNo: "P01-5460", manifestNo:"QZT11", pullSheetNo:"RAB72", customerPO:"TCO-26-04", terms:"NET 30", rateDays:3,
    oneLiner: "3-booth partner expo activation across McCormick. Currently in load-in.",
    scopeSold:["3 booth activations","Per-booth 10x10 LED wall","Live streaming to client web portal","Lead capture integration"],
    scopeCurrent:["3 booth activations","Per-booth 10x10 LED wall","Live streaming to client web portal","Lead capture integration"],
    attention: [], risks: [], approvals: [], changes: [], gearSummary:{audio:[],video:[],lighting:[],scenic:[]}, docs:[], pmNotes:"", activity:[]
  },

  /* ---------------- ELSO Summer Summit (planning) ---------------- */
  {
    code: "ELSO-SS26",
    name: "ELSO Summer Summit — OneSource Program",
    client: "Credit Acceptance (ELSO Events)",
    showType: "general-session",
    status: "planning",
    health: "green",
    venueId: "v.crocker",
    venueName: "Market Square — Crocker Park, Westlake OH",
    primaryPM: "p.koliver",
    td: "p.ctaylor",
    dates: { prep:"2026-06-01", loadIn:"2026-06-10T08:00", showStart:"2026-06-12T09:00", showEnd:"2026-06-13T18:00", loadOut:"2026-06-13T23:00", ret:"2026-06-15T11:00" },
    quoteNo: "P01-5588", manifestNo:null, pullSheetNo:null, customerPO:"ELSO-26-SS", terms:"NET 30", rateDays:2,
    stageSet: "Lumen",
    oneLiner: "First OneSource program summit — 2-day leadership summit + awards.",
    scopeSold: ["Lumen stage set","GS in Market Square","Awards ceremony","Crew parking — Promenade lot"],
    scopeCurrent: ["Lumen stage set","GS in Market Square","Awards ceremony","Crew parking — Promenade lot"],
    attention: [], risks: [], approvals: [], changes: [], gearSummary:{audio:[],video:[],lighting:[],scenic:[]},
    docs: [], pmNotes: "No stopping on Vine St — see load-in note. Trucks must park at Promenade lot after unload.", activity: []
  }
];

// --- Cross-show conflicts (computed in real system, hardcoded for demo) ---
window.PCG.conflicts = [
  { kind: "crew", severity: "high",
    title: "Mike Chen (A1) conflict: LCE-2026 (4/10-4/15, Las Vegas) overlaps SAE-WCX-2026 (4/14-4/16, Detroit)",
    resolved: true,
    detail: "Reassigned LCE A1 to Priya Shah on 4/13. Mike Chen covers SAE only." },
  { kind: "gear", severity: "medium",
    title: "6× 50″ monitor kits: returning from LCE (LV) 4/15 AM → needed for SAE (Detroit) 4/14 set day",
    resolved: false,
    detail: "Inventory team holding 2× buffer from Detroit warehouse. Go/no-go by 4/13 EOD." },
  { kind: "dock", severity: "medium",
    title: "Huntington Place dock sharing: SAE-WCX load-out 4/16 PM ↔ DAS-BOOTH-26 load-in 4/18 AM",
    resolved: false,
    detail: "Marshalling yard coordination required. Windows committed but tight." },
  { kind: "crew", severity: "low",
    title: "Chris Taylor (TD) working LCE strike 4/15 night — thin coverage for any SAE 4/16 escalation",
    resolved: false,
    detail: "Backfill plan: Dan Marino rolls from DAS-BOOTH prep." }
];

// --- SAE WCX breakout grid raw (for breakouts.html) ---
// Rooms grouped by floor; active = currently has kit assigned; label = session type.
window.PCG.saeBreakouts = {
  days: [
    { id:"set-fri", label:"Fri 4/10 · SET", type:"set" },
    { id:"set-mon", label:"Mon 4/13 · SET", type:"set" },
    { id:"show-tue", label:"Tue 4/14 · SHOW", type:"show" },
    { id:"show-wed", label:"Wed 4/15 · SHOW", type:"show" },
    { id:"show-thu", label:"Thu 4/16 · SHOW", type:"show" }
  ],
  floors: [
    {
      name: "100 Level",
      rooms: ["110A","110B","111A","111B","112A","112B","112C","112D","113A","113B","113C","114A","114B","115A","115B","116A","116B"],
      activeMap: {} // all inactive this show
    },
    {
      name: "140 Wing",
      rooms: ["140A","140B","140C","140D","140E","140F","140G","141","142A","142B","142C"],
      activeMap: {
        "140A":"Technical Session", "140B":"Technical Session", "140C":"Technical Session",
        "140D":"Technical Session", "140E":"Technical Session", "140F":"Technical Session",
        "140G":"Technical Session", "141":"Technical Session (larger)",
        "142A":"Technical Session", "142B":"Technical Session", "142C":"Technical Session"
      }
    },
    {
      name: "250 Wing",
      rooms: ["250A","250B","250C","251A","251B","251C","252A","252B","258","259","260"],
      activeMap: {
        "250A":"Breakout", "250B":"Breakout", "250C":"Breakout (w/ VDA)",
        "251A":"Breakout", "251B":"Breakout", "251C":"Breakout",
        "252A":"Breakout", "252B":"Breakout",
        "258":"House Audio Only", "259":"House Audio Only", "260":"House Audio Only"
      }
    },
    {
      name: "300 Level",
      rooms: ["310A","310B","311A","311B","312A","312B","313A","313B","320","321","330A","330B","331A","331B","331C","332","333","334","335","336","337","338","340","341","353","354","355","356","357","358","359","360"],
      activeMap: {
        "310A":"House Audio Only · Open",
        "310B":"CRC Classroom (on own)",
        "311A":"Open",
        "311B":"Marketing Office",
        "312A":"Show Office · Open",
        "312B":"Ground Vehicle Committee",
        "313A":"PFL 180 Session (on own)",
        "320":"Technical Session (intimate)",
        "321":"Technical Session (intimate)",
        "330A":"TECHNICAL SESSION LARGE",
        "330B":"TECHNICAL SESSION LARGE",
        "331A":"House Audio · Paper Session (master bill)",
        "331B":"House Audio", "331C":"House Audio",
        "353":"Breakout", "354":"Breakout", "355":"Breakout", "356":"Breakout",
        "357":"House Audio", "358":"House Audio", "359":"House Audio", "360":"House Audio"
      }
    },
    {
      name: "400 Level",
      rooms: ["410A","410B","411A","411B","411C","412A","412B","413A","413B","414A","414B","415A","415B","420A","420B","430A","430B"],
      activeMap: {
        "410A":"House Audio", "410B":"House Audio",
        "420A":"House Audio", "420B":"House Audio",
        "430A":"House Audio", "430B":"House Audio"
      }
    }
  ],
  totals: {
    "Tables 7'": 5, "Tables 8'": 18, "Tables 10'": 8, "Stands": 31, "LCD": 30, "VDA": 3,
    "Laptops": 27, "PC DI": 27, "PR (Remote)": 27, "Floor Mic Stand": 27,
    "Wireless Lav": 27, "Wireless HH": 26, "Pod Mic": 66,
    "Mixer": 27, "Chart Stand": 6, "Total Audio Inputs": 146
  }
};

// --- Global action queue (across projects) ---
window.PCG.actionQueue = [
  { proj:"LCE-2026",     kind:"approval",  priority:"high", title:"CO #3 — Awards ready room (+$18,400)",            owner:"p.bwhit",     waitOn:"Jeff Springer",  stale:"8h" },
  { proj:"LCE-2026",     kind:"approval",  priority:"high", title:"Sub-rental 2× JSub via Solotech ($4,200)",         owner:"p.jspringer", waitOn:"Jeff Springer",  stale:"18h" },
  { proj:"SAE-WCX-2026", kind:"approval",  priority:"medium",title:"Room 310B CRC Classroom add — confirm billing",   owner:"p.jspringer", waitOn:"Tyler Scheff",   stale:"12h" },
  { proj:"LCE-2026",     kind:"decision",  priority:"medium",title:"Sponsor loop content final deadline — Wed 5pm",   owner:"p.koliver",   waitOn:"Keith Oliver",   stale:"40h" },
  { proj:"SAE-WCX-2026", kind:"ownership", priority:"medium",title:"Room 356 — no owner assigned",                    owner:null,          waitOn:"Unassigned",     stale:"36h" },
  { proj:"LCE-2026",     kind:"risk",      priority:"high", title:"IATSE 720 call changes — steward confirmation",   owner:"p.ctaylor",   waitOn:"Chris Taylor",   stale:"4h" },
  { proj:"DAS-BOOTH-26", kind:"risk",      priority:"medium",title:"Huntington dock sharing w/ SAE strike 4/16",      owner:"p.jspringer", waitOn:"Jeff Springer",  stale:"1d" },
  { proj:"GLBX-GSK26",   kind:"approval",  priority:"low",  title:"Pre-function cocktail ambient — CO approve",        owner:"p.bwhit",     waitOn:"Brandon White",  stale:"2d" }
];

// --- Portfolio helpers ---
window.PCG.findProject = function(code){ return (window.PCG.projects||[]).find(p=>p.code===code); };
window.PCG.findPerson  = function(id){ return (window.PCG.people||[]).find(p=>p.id===id); };
window.PCG.findVenue   = function(id){ return (window.PCG.venues||[]).find(v=>v.id===id); };
