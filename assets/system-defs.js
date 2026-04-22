/*
 * STAGE · System Definitions (director-authored) + rules engine.
 *
 * Two surfaces consume this:
 *   1. System Definitions admin library (system-builder.html)
 *      — director view · shows how each system is authored.
 *   2. Quote Builder guided insert modal (quote.html)
 *      — AE view · walks through the director's questions,
 *      fires rules, and inserts the expanded result into the quote.
 *
 * Mirrors the real repo's `SYSTEM_CATALOG` pattern in
 * pcg-stage-ui/components/quotes/systemConfigs.ts — steps, rules,
 * severity, emitted Gear/Labor lines, revision awareness.
 */
(function(){
  const PCG = (window.PCG = window.PCG || {});

  // ------------------------------------------------------------------
  // SYSTEM DEFINITIONS · seeded 5
  // Each system has:
  //   · meta · director ownership, dept, version, status, updated
  //   · steps · the questions an AE answers at quote-insert time
  //   · rules · conditions + emitted Gear / Labor lines
  //     Each rule declares severity: add | suggest | warn
  //   · base · gear + labor always included (no conditions)
  //
  // These are consumed by BOTH the director's Definitions page
  // (view-only authored content) AND the Quote Builder's guided
  // insert modal (AE answers → rules fire → lines emit).
  // ------------------------------------------------------------------
  PCG.SYSTEM_DEFS = [

    /* ============================================================
       IMAG SYSTEM · Video Director · v3.2
       ============================================================ */
    {
      id: 'imag',
      name: 'IMAG System',
      dept: 'video',
      deptLabel: 'Video',
      ico: '🎥',
      director: 'C. Taylor',
      directorTitle: 'Video Director',
      version: '3.2',
      status: 'Published',
      publishedAt: '2026-03-28',
      updated: '18 days ago',
      reuseCount: 22,
      summary: 'Standardized in-room camera + screen reinforcement package.',
      description: 'Covers camera count, recording / streaming, room scale, and graphics complexity. Applies company rules for shader requirement, redundancy, and streaming engineering.',
      directorNote: 'If you aren\'t sure, pick 3 cameras · recording · general session · moderate graphics. That is the 80% configuration — it will pass a full TD review.',
      base: {
        gear: [
          { item: 'Barco E2 · screen management' },
          { item: 'Multiview + ISO record rack' },
          { item: 'IMAG side LED pair' }
        ],
        labor: [
          { item: 'V1 · lead operator' },
          { item: 'Utility' }
        ]
      },
      steps: [
        { id:'cams', q:'How many cameras?', opts:[
          { v:'2', lbl:'2 cameras · front + wide',  tag:'Small' },
          { v:'3', lbl:'3 cameras · add hand-held',  tag:'Standard', def:true, recommended:true },
          { v:'4', lbl:'4+ cameras · complex',       tag:'Complex' }
        ]},
        { id:'camType', q:'Camera package level?', opts:[
          { v:'PTZ',    lbl:'PTZ · robotic package' },
          { v:'URSA',   lbl:'URSA · broadcast cinema', tag:'Standard', def:true },
          { v:'Studio', lbl:'Studio package · full ENG' }
        ]},
        { id:'rec', q:'Recording / streaming?', opts:[
          { v:'none', lbl:'None' },
          { v:'rec',  lbl:'Recording only',       tag:'Standard', def:true, recommended:true },
          { v:'live', lbl:'Live stream' },
          { v:'both', lbl:'Recording + live stream' }
        ]},
        { id:'room', q:'Room scale?', opts:[
          { v:'small', lbl:'Small ballroom · <500' },
          { v:'gs',    lbl:'General session · 500–1,500', tag:'Standard', def:true, recommended:true },
          { v:'arena', lbl:'Arena · 1,500+',                tag:'Complex' }
        ]},
        { id:'gfx', q:'Graphics / playback posture?', opts:[
          { v:'basic', lbl:'Basic · ProPresenter only' },
          { v:'mod',   lbl:'Moderate · QLab + lower-thirds', tag:'Standard', def:true },
          { v:'high',  lbl:'High-touch · custom Barco build' }
        ]}
      ],
      rules: [
        { id:'cam-ops', sev:'add',  label:'Camera operators',
          when: (a) => (parseInt(a.cams)||0) > 0,
          emit: (a) => ({ type:'labor', item:`Camera op × ${a.cams}`, why:`One operator per camera (${a.cams} selected)` }) },
        { id:'shader-req', sev:'add', label:'3+ cameras requires shader',
          when: (a) => (parseInt(a.cams)||0) >= 3,
          emit: () => ({ type:'labor', item:'Shader / engineer', why:'Rule · 3+ cameras always requires a dedicated shader (Video Director policy)' }) },
        { id:'ptz-skip-lenses', sev:'warn',
          label:'PTZ package swaps hard-lens workflow',
          when: (a) => a.camType === 'PTZ',
          emit: () => ({ type:'warn', item:'PTZ package · hard-lens kit and shader workflow are swapped out', why:'Rule · PTZ routes have no long-lens complement; shader duties shift to switcher' }) },
        { id:'kipro', sev:'add', label:'Recording adds Ki Pro + DIT',
          when: (a) => a.rec === 'rec' || a.rec === 'both',
          emit: () => [
            { type:'gear',  item:'AJA Ki Pro · ISO record rack', why:'Recording selected · Ki Pro is company standard' },
            { type:'labor', item:'DIT / record operator',         why:'Recording · dedicated record op required' }
          ]},
        { id:'streaming', sev:'add', label:'Live stream adds encoder + network engineer',
          when: (a) => a.rec === 'live' || a.rec === 'both',
          emit: () => [
            { type:'gear',  item:'Streaming encoder + redundant internet', why:'Live stream → redundancy required by standard' },
            { type:'labor', item:'Streaming / network engineer',            why:'Live stream · dedicated engineer required' }
          ]},
        { id:'arena-delay', sev:'add', label:'Arena adds delay IMAG + redundancy',
          when: (a) => a.room === 'arena',
          emit: () => [
            { type:'gear',  item:'Delay IMAG hangs · 2× pair',  why:'Arena → delay coverage required for sight lines' },
            { type:'gear',  item:'Redundant Barco E2 backup',   why:'Arena → processor redundancy mandatory' },
            { type:'labor', item:'IMAG delay operator',         why:'Arena delay hangs require a dedicated operator' }
          ]},
        { id:'high-gfx', sev:'add', label:'High-touch graphics adds dedicated ops',
          when: (a) => a.gfx === 'high',
          emit: () => [
            { type:'gear',  item:'High-touch Barco E2 preset library', why:'High-touch graphics posture selected' },
            { type:'labor', item:'Switcher operator · dedicated',       why:'High-touch → separated from V1 per standard' },
            { type:'labor', item:'Graphics / PowerPoint operator',      why:'High-touch → dedicated graphics op' }
          ]}
      ],
      outputs: (a, adds) => ({
        schedule:  6 + (a.room === 'arena' ? 2 : 0),
        flow:      12 + (a.rec === 'live' || a.rec === 'both' ? 3 : 0),
        warehouse: 18 + adds.filter(x => x.type === 'gear').length * 3,
        quote:     78_000 + (a.room === 'arena' ? 42_000 : 0) + (a.gfx === 'high' ? 28_000 : 0) + (a.rec === 'both' ? 22_000 : a.rec === 'live' ? 18_000 : a.rec === 'rec' ? 6_000 : 0)
      })
    },

    /* ============================================================
       LED WALL · Video/LED Director · v2.1
       ============================================================ */
    {
      id: 'led-wall',
      name: 'LED Wall System',
      dept: 'led',
      deptLabel: 'Video · LED',
      ico: '🟪',
      director: 'T. Rivera',
      directorTitle: 'Video / LED Director',
      version: '2.1',
      status: 'Published',
      publishedAt: '2026-03-23',
      updated: '23 days ago',
      reuseCount: 14,
      summary: 'Standardized LED wall package — header, backdrop, IMAG sides, or scenic wrap.',
      description: 'Applies rules for wall-size redundancy, outdoor weatherproofing, rigging / fly-frame requirements, and tour-grade cable / spares.',
      directorNote: 'Anything 30′ or wider triggers processor redundancy + a second LED tech — don\'t try to skip it. Outdoor or floor LED requires protection · the system will stop you if you try to omit it.',
      base: {
        gear: [
          { item: 'LED processor · Brompton Tessera' },
          { item: 'Cable + data package' },
          { item: 'Spare tiles (5% of face)' }
        ],
        labor: [
          { item: 'LED tech' },
          { item: 'Video engineer' }
        ]
      },
      steps: [
        { id:'size', q:'Wall size?', opts:[
          { v:'small',  lbl:'Small header · 10–16\'', tag:'Standard', def:true, recommended:true },
          { v:'medium', lbl:'Medium · 16–30\'' },
          { v:'large',  lbl:'Large · 30\'+',           tag:'Complex' }
        ]},
        { id:'pitch', q:'Pixel pitch?', opts:[
          { v:'2.6', lbl:'2.6mm · close viewing',   tag:'Standard', def:true, recommended:true },
          { v:'3.9', lbl:'3.9mm · medium room' },
          { v:'5.9', lbl:'5.9mm · outdoor / long throw' }
        ]},
        { id:'support', q:'Support posture?', opts:[
          { v:'ground', lbl:'Ground-stacked · carts', tag:'Standard', def:true },
          { v:'flown',  lbl:'Flown · fly frame' }
        ]},
        { id:'app', q:'Application?', opts:[
          { v:'header',   lbl:'Header only',           tag:'Standard', def:true },
          { v:'backdrop', lbl:'Full backdrop' },
          { v:'imag',     lbl:'IMAG side pair' },
          { v:'scenic',   lbl:'Scenic wrap · floor + walls', tag:'Complex' }
        ]},
        { id:'redun', q:'Redundancy posture?', opts:[
          { v:'standard', lbl:'Standard · single processor', tag:'Standard', def:true },
          { v:'tour',     lbl:'Tour-grade · doubled w/ spares' }
        ]},
        { id:'playback', q:'Content playback level?', opts:[
          { v:'basic', lbl:'Basic · in-house QLab' },
          { v:'mod',   lbl:'Moderate · Barco E2 + QLab', tag:'Standard', def:true },
          { v:'high',  lbl:'High-touch · dedicated content op' }
        ]}
      ],
      rules: [
        { id:'large-redun', sev:'add', label:'30\'+ requires processor redundancy',
          when: (a) => a.size === 'large',
          emit: () => [
            { type:'gear',  item:'Secondary processor · hot backup', why:'Rule · 30\'+ walls require processor redundancy' },
            { type:'labor', item:'LED tech · second',                why:'30\'+ · two-person LED crew required' }
          ]},
        { id:'flown-rig', sev:'add', label:'Flown wall adds rigging labor',
          when: (a) => a.support === 'flown',
          emit: () => [
            { type:'gear',  item:'Additional fly frame + rigging hardware', why:'Flown LED → heavier rigging spec' },
            { type:'labor', item:'Rigging crew × 2',                        why:'Flown LED requires rig call' }
          ]},
        { id:'outdoor', sev:'add', label:'Outdoor pitch requires weatherproofing',
          when: (a) => a.pitch === '5.9' || (a.app === 'scenic' && a.size === 'large'),
          emit: () => ({ type:'gear', item:'Weatherproof covers + tent shell', why:'Outdoor / scenic-wrap environments require protection by standard' }) },
        { id:'scenic-extra', sev:'add', label:'Scenic wrap needs floor LED',
          when: (a) => a.app === 'scenic',
          emit: () => [
            { type:'gear',  item:'Floor LED + vinyl protection', why:'Scenic wrap includes floor LED · requires protection' },
            { type:'labor', item:'Install crew × 2',              why:'Scenic wrap → extended install window' }
          ]},
        { id:'tour-grade', sev:'add', label:'Tour-grade doubles cable + adds system tech',
          when: (a) => a.redun === 'tour',
          emit: () => [
            { type:'gear',  item:'Doubled cable + spare tiles 10%', why:'Tour-grade redundancy standard' },
            { type:'labor', item:'System tech',                     why:'Tour-grade → dedicated system tech required' }
          ]},
        { id:'high-playback', sev:'add', label:'High-touch playback adds content op',
          when: (a) => a.playback === 'high',
          emit: () => ({ type:'labor', item:'Content operator', why:'High-touch playback → dedicated content op' }) }
      ],
      outputs: (a, adds) => ({
        schedule:  5 + (a.size === 'large' ? 2 : 0) + (a.support === 'flown' ? 1 : 0),
        flow:      4,
        warehouse: 28 + adds.filter(x => x.type === 'gear').length * 4,
        quote:     64_000 + (a.size === 'large' ? 38_000 : a.size === 'medium' ? 14_000 : 0) + (a.app === 'scenic' ? 34_000 : a.app === 'backdrop' ? 18_000 : 0) + (a.redun === 'tour' ? 16_000 : 0) + (a.playback === 'high' ? 12_000 : 0)
      })
    },

    /* ============================================================
       LINE ARRAY · Audio Director · v4.0
       ============================================================ */
    {
      id: 'line-array',
      name: 'Line Array System',
      dept: 'audio',
      deptLabel: 'Audio',
      ico: '🎚',
      director: 'P. Shah',
      directorTitle: 'Audio Director',
      version: '4.0',
      status: 'Published',
      publishedAt: '2026-04-04',
      updated: '11 days ago',
      reuseCount: 31,
      summary: 'Standardized line-array reinforcement — FOH + sub + wireless package.',
      description: 'Applies rules for room scale, arena delay hangs, broadcast RF coordination, and monitor-engineering requirements.',
      directorNote: 'Arena requires delay hangs — no exceptions. 16+ wireless channels requires an RF coordinator for spectrum scan day-of. If you pick broadcast tier, you also need a system tech on-site.',
      base: {
        gear: [
          { item: 'Yamaha CL5 FOH console' },
          { item: 'Stage rack + IO' },
          { item: 'd&b J-Series line array' }
        ],
        labor: [
          { item: 'A1 · FOH' },
          { item: 'A2 · stage' }
        ]
      },
      steps: [
        { id:'room', q:'Room scale?', opts:[
          { v:'small',  lbl:'Small · <500' },
          { v:'medium', lbl:'Medium · 500–1,500', tag:'Standard', def:true, recommended:true },
          { v:'arena',  lbl:'Arena · 1,500+',      tag:'Complex' }
        ]},
        { id:'config', q:'Configuration?', opts:[
          { v:'flown-main',  lbl:'Flown main + flown sub', tag:'Standard', def:true, recommended:true },
          { v:'flown-ground',lbl:'Flown L/R + ground sub' },
          { v:'ground',      lbl:'Ground-stack only · small rooms' }
        ]},
        { id:'delay', q:'Delay hangs?', opts:[
          { v:'none', lbl:'None · small room',    tag:'Standard', def:true },
          { v:'yes',  lbl:'Yes · required in arena' }
        ]},
        { id:'wireless', q:'Wireless package?', opts:[
          { v:'basic',     lbl:'Basic · 4ch handheld' },
          { v:'standard',  lbl:'Standard · 8ch mixed',   tag:'Standard', def:true, recommended:true },
          { v:'broadcast', lbl:'Broadcast · 16+ ch',      tag:'Complex' }
        ]},
        { id:'mon', q:'Monitors?', opts:[
          { v:'iem',   lbl:'IEMs only',                  tag:'Standard', def:true },
          { v:'wedge', lbl:'Wedges · front of stage' },
          { v:'both',  lbl:'IEMs + wedges' }
        ]},
        { id:'tier', q:'PA tier / type?', opts:[
          { v:'standard', lbl:'d&b J-Series · standard',   tag:'Standard', def:true },
          { v:'premium',  lbl:'d&b KSL · premium flown',    tag:'Complex' }
        ]}
      ],
      rules: [
        { id:'arena-delay', sev:'add', label:'Arena → delay hangs + system tech',
          when: (a) => a.room === 'arena' || a.delay === 'yes',
          emit: () => [
            { type:'gear',  item:'Delay line-array hangs · 2× pair', why:'Rule · arena requires delay coverage (no exceptions)' },
            { type:'gear',  item:'Additional amp racks',              why:'Arena scale → additional amplification' },
            { type:'labor', item:'System tech',                        why:'Arena → dedicated system tech required' },
            { type:'labor', item:'Rigging call × 2',                   why:'Arena delay hangs → additional rig crew' }
          ]},
        { id:'rf-coord', sev:'add', label:'16+ wireless requires RF coordinator',
          when: (a) => a.wireless === 'broadcast',
          emit: () => [
            { type:'gear',  item:'Shure Axient Digital · 16+ ch rack', why:'Broadcast tier → full Axient package' },
            { type:'labor', item:'RF coordinator · spectrum scan',      why:'Rule · 16+ wireless channels require RF coordination day-of' },
            { type:'labor', item:'System tech',                          why:'Broadcast tier → system tech required' }
          ]},
        { id:'standard-wireless', sev:'add', label:'Standard wireless · QLX-D',
          when: (a) => a.wireless === 'standard',
          emit: () => ({ type:'gear', item:'Shure QLX-D · 8ch', why:'Standard wireless tier' }) },
        { id:'wedge-mon', sev:'add', label:'Wedge monitors add monitor engineer',
          when: (a) => a.mon === 'wedge' || a.mon === 'both',
          emit: () => [
            { type:'gear',  item:'Monitor mix + wedge package', why:'Wedge monitors selected' },
            { type:'labor', item:'Monitor engineer',             why:'Wedge mixing → dedicated monitor engineer' }
          ]},
        { id:'iem-pack', sev:'add', label:'IEM rack',
          when: (a) => a.mon === 'iem' || a.mon === 'both',
          emit: () => ({ type:'gear', item:'IEM rack · Sennheiser 2000-series', why:'IEM monitors selected' }) },
        { id:'ksl-premium', sev:'add', label:'KSL premium tier upgrades arrays',
          when: (a) => a.tier === 'premium',
          emit: () => ({ type:'gear', item:'d&b KSL line array package · premium', why:'Premium PA tier selected' }) }
      ],
      outputs: (a, adds) => ({
        schedule:  4 + (a.room === 'arena' ? 2 : 0),
        flow:      3,
        warehouse: 22 + adds.filter(x => x.type === 'gear').length * 4,
        quote:     56_000 + (a.room === 'arena' ? 44_000 : a.room === 'medium' ? 10_000 : 0) + (a.wireless === 'broadcast' ? 22_000 : a.wireless === 'standard' ? 6_000 : 0) + (a.mon === 'both' ? 14_000 : a.mon === 'wedge' ? 8_000 : 4_000) + (a.tier === 'premium' ? 38_000 : 0)
      })
    },

    /* ============================================================
       GENERAL SESSION PACKAGE · composite · v1.4
       ============================================================ */
    {
      id: 'gs-package',
      name: 'General Session Package',
      dept: 'general',
      deptLabel: 'Composite · Video + Audio',
      ico: '🎤',
      director: 'C. Taylor + P. Shah',
      directorTitle: 'Video + Audio Directors',
      version: '1.4',
      status: 'Published',
      publishedAt: '2026-04-09',
      updated: '6 days ago',
      reuseCount: 9,
      summary: 'Pre-bundled GS — IMAG v3.2 + Line Array v4.0 + LED header 16\' + lighting.',
      description: 'Composite system · embeds the standard sub-systems at their standard answers. Use for typical corporate GS and tweak at the sub-system level if anything differs.',
      directorNote: 'This is the "most corporate GS" preset. If you choose it, you\'re picking the 3-camera + recording + GS-room + 16\' LED + 8ch wireless bundle. <strong>Sub-system tweaks happen on each component system.</strong>',
      base: {
        gear: [
          { item: 'IMAG System v3.2 · embedded' },
          { item: 'Line Array System v4.0 · embedded' },
          { item: 'LED header wall · 16\'' }
        ],
        labor: [
          { item: 'Show caller' },
          { item: 'Producer · on-site' }
        ]
      },
      steps: [
        { id:'days', q:'Show length?', opts:[
          { v:'1day', lbl:'Single day' },
          { v:'2day', lbl:'2 days',        tag:'Standard', def:true, recommended:true },
          { v:'multi',lbl:'3+ days · multi-day' }
        ]},
        { id:'awards', q:'Awards segment?', opts:[
          { v:'no',  lbl:'No', tag:'Standard', def:true },
          { v:'yes', lbl:'Yes · dedicated Awards evening' }
        ]},
        { id:'breakouts', q:'Breakout rooms?', opts:[
          { v:'0', lbl:'None', tag:'Standard', def:true },
          { v:'2', lbl:'2 rooms' },
          { v:'5', lbl:'5 rooms · full conference' }
        ]}
      ],
      rules: [
        { id:'awards', sev:'add', label:'Awards segment adds lighting + spots',
          when: (a) => a.awards === 'yes',
          emit: () => [
            { type:'gear',  item:'Awards lighting package · follow-spots × 2', why:'Awards segment selected' },
            { type:'labor', item:'Follow-spot ops × 2',                         why:'Awards → follow-spot coverage' }
          ]},
        { id:'breakouts', sev:'add', label:'Breakout rooms scale crew + kits',
          when: (a) => a.breakouts === '2' || a.breakouts === '5',
          emit: (a) => {
            const n = a.breakouts === '5' ? 5 : 2;
            return [
              { type:'gear',  item:`Breakout AV kit × ${n}`, why:'Breakout rooms selected · each gets the Breakout AV system' },
              { type:'labor', item:`Breakout tech × ${n}`,   why:'One tech per breakout room (company standard)' }
            ];
          }},
        { id:'multi-day', sev:'add', label:'3+ days adds crew rotation',
          when: (a) => a.days === 'multi',
          emit: () => ({ type:'labor', item:'Extra show-day crew rotation', why:'3+ day shows require an additional crew rotation' }) }
      ],
      outputs: (a, adds) => ({
        schedule:  14 + (a.breakouts === '5' ? 8 : a.breakouts === '2' ? 3 : 0) + (a.awards === 'yes' ? 2 : 0),
        flow:      28 + (a.awards === 'yes' ? 8 : 0),
        warehouse: 54 + adds.filter(x => x.type === 'gear').length * 6,
        quote:     245_000 + (a.awards === 'yes' ? 38_000 : 0) + (a.breakouts === '5' ? 65_000 : a.breakouts === '2' ? 28_000 : 0) + (a.days === 'multi' ? 48_000 : a.days === '2day' ? 18_000 : 0)
      })
    },

    /* ============================================================
       BREAKOUT ROOM AV · Video Director · v1.1
       ============================================================ */
    {
      id: 'breakout',
      name: 'Breakout Room AV Package',
      dept: 'general',
      deptLabel: 'Breakout',
      ico: '🪑',
      director: 'C. Taylor',
      directorTitle: 'Video Director',
      version: '1.1',
      status: 'Published',
      publishedAt: '2026-04-13',
      updated: '2 days ago',
      reuseCount: 47,
      summary: 'Repeatable per-room kit — projector or LED, lectern audio, wireless, basic capture.',
      description: 'Most-reused system in the library. Scales gear + crew with room count; triggers a floating lead at 5+ rooms.',
      directorNote: 'If you have more than 3 breakouts, always assign a floating Lead Breakout Tech so no tech is solo when something breaks.',
      base: {
        gear: [
          { item: 'Projector + screen OR 110" LED panel' },
          { item: 'Small-format mixer + 2ch wireless' },
          { item: 'Podium mic + speaker wedge' }
        ],
        labor: [
          { item: 'Breakout tech · 1 per room' }
        ]
      },
      steps: [
        { id:'display', q:'Display type?', opts:[
          { v:'proj', lbl:'Projector + screen', tag:'Standard', def:true, recommended:true },
          { v:'led',  lbl:'110" LED panel'}
        ]},
        { id:'capture', q:'Capture posture?', opts:[
          { v:'none', lbl:'No recording',                  tag:'Standard', def:true },
          { v:'rec',  lbl:'Audio record only' },
          { v:'full', lbl:'Full AV record · session library' }
        ]},
        { id:'count', q:'How many rooms?', opts:[
          { v:'1', lbl:'1' },
          { v:'3', lbl:'3', tag:'Standard', def:true },
          { v:'5', lbl:'5+ · adds floating lead' }
        ]}
      ],
      rules: [
        { id:'scale', sev:'add', label:'Kit + labor scale with count',
          when: (a) => (parseInt(a.count)||1) > 1,
          emit: (a) => {
            const n = parseInt(a.count) || 1;
            return [
              { type:'gear',  item:`Per-room kit × ${n}`, why:'Kit + labor scale with room count' },
              { type:'labor', item:`Breakout tech × ${n}`, why:'Each room gets one tech by standard' }
            ];
          }},
        { id:'lead-required', sev:'add', label:'5+ rooms triggers floating lead',
          when: (a) => (parseInt(a.count)||1) >= 5,
          emit: () => ({ type:'labor', item:'Lead Breakout Tech · floating', why:'Rule · 5+ rooms triggers a floating lead so no tech is solo on a break' }) },
        { id:'audio-rec', sev:'add', label:'Audio record',
          when: (a) => a.capture === 'rec',
          emit: () => ({ type:'gear', item:'Audio recorder per room', why:'Audio-only recording selected' }) },
        { id:'full-rec', sev:'add', label:'Full AV record',
          when: (a) => a.capture === 'full',
          emit: (a) => {
            const n = parseInt(a.count) || 1;
            return [
              { type:'gear',  item:'Full AV record rig per room',                 why:'Session-library recording selected' },
              { type:'labor', item:`Record op × ${Math.max(1, Math.ceil(n/3))}`, why:'Session-library capture → dedicated record ops' }
            ];
          }}
      ],
      outputs: (a, adds) => {
        const n = parseInt(a.count) || 1;
        return {
          schedule:  2 + (n >= 5 ? 2 : 0),
          flow:      0,
          warehouse: 12 * n,
          quote:     4_800 * n + (a.display === 'led' ? 2_400 * n : 0) + (a.capture === 'full' ? 3_200 * n : a.capture === 'rec' ? 600 * n : 0)
        };
      }
    }
  ];

  // ------------------------------------------------------------------
  // RULES ENGINE · evaluate a system against answers.
  // Returns { adds: [...], suggestions: [...], warnings: [...] }
  // Each rule may emit one line or an array of lines.
  // ------------------------------------------------------------------
  PCG.evaluateSystem = function(sys, answers){
    const out = { adds: [], suggestions: [], warnings: [] };
    (sys.rules || []).forEach(rule => {
      let fires = false;
      try { fires = !!rule.when(answers || {}); } catch(e){ fires = false; }
      if(!fires) return;
      let emitted = [];
      try { emitted = rule.emit(answers || {}); } catch(e){ emitted = []; }
      if(!Array.isArray(emitted)) emitted = [emitted];
      emitted.forEach(e => {
        if(!e) return;
        const entry = Object.assign({}, e, { ruleId: rule.id, ruleLabel: rule.label, severity: rule.sev });
        if(rule.sev === 'add')       out.adds.push(entry);
        else if(rule.sev === 'suggest') out.suggestions.push(entry);
        else if(rule.sev === 'warn')    out.warnings.push(entry);
      });
    });
    return out;
  };

  // Default-answers helper · director-recommended options
  PCG.defaultAnswers = function(sys){
    const a = {};
    (sys.steps || []).forEach(step => {
      const def = (step.opts || []).find(o => o.def);
      if(def) a[step.id] = def.v;
    });
    return a;
  };

  // Lookup by id
  PCG.getSystemDef = function(id){
    return (PCG.SYSTEM_DEFS || []).find(s => s.id === id);
  };

  // Dept palette used across both surfaces
  PCG.DEPT_PALETTE = {
    video:    { color: '#0199fd', bg: 'rgba(1,153,253,0.14)' },
    audio:    { color: '#f5b041', bg: 'rgba(245,176,65,0.14)' },
    led:      { color: '#9564d8', bg: 'rgba(149,100,216,0.14)' },
    lighting: { color: '#9564d8', bg: 'rgba(149,100,216,0.14)' },
    general:  { color: '#3ddc84', bg: 'rgba(61,220,132,0.14)' }
  };
})();
