// SplashLens Chemical & Equipment Data
// Dosing factors sourced from Pool Math (TFP) verified formulas
// Volume formulas: standard industry calculations

window.CHEM_DATA = {

  // Pool Math verified dosing factors
  // Unit: amount per 1 ppm change per 10,000 gallons
  dosing: {
    fc: {
      label: "Free Chlorine (FC)",
      unit: "ppm", min: 2, max: 10, ideal: "3-6",
      products: [
        { id:"liquid10",   label:"Liquid Chlorine 10%",     unit:"fl oz", factor:12.85,  note:"Retail bleach. Reduces pH slightly." },
        { id:"liquid125",  label:"Liquid Chlorine 12.5%",   unit:"fl oz", factor:10.28,  note:"Commercial grade. Reduces pH slightly." },
        { id:"calHypo65",  label:"Cal-Hypo 65%",            unit:"oz dry",factor: 1.55,  note:"Raises calcium. Use for shock. Don't add directly to skimmer." },
        { id:"calHypo73",  label:"Cal-Hypo 73% (shock)",    unit:"oz dry",factor: 1.38,  note:"Strong shock. Pre-dissolve in bucket." },
        { id:"trichlor",   label:"Trichlor tabs/granular",  unit:"oz dry",factor: 1.10,  note:"Lowers pH and raises CYA. Tabs only for dispensers." },
        { id:"dichlor56",  label:"Dichlor 56%",             unit:"oz dry",factor: 1.56,  note:"Raises CYA faster than trichlor. Good for first-time use." },
        { id:"bleach825",  label:"Household Bleach 8.25%",  unit:"fl oz", factor:15.63,  note:"No stabilizer. Good for SLAM. Reduces pH." }
      ]
    },
    ph: {
      label: "pH",
      unit: "", min: 7.2, max: 7.8, ideal: "7.4-7.6",
      raise: [
        { id:"sodaAsh",    label:"Soda Ash (pH Up)",         unit:"oz dry", note:"Raises pH and TA. 6oz per 0.2pH per 10k gal at TA=100 (approx)" },
        { id:"borates",    label:"Sodium Tetraborate",       unit:"oz dry", note:"Raises pH. Stabilizes pH long-term." }
      ],
      lower: [
        { id:"muriaticAcid",label:"Muriatic Acid 31.45%",   unit:"fl oz",  note:"Lowers pH and TA. Pre-dilute in bucket of water." },
        { id:"dryAcid",    label:"Dry Acid (Sodium Bisulfate)", unit:"oz dry", note:"Lowers pH and TA. Safer to handle than muriatic." }
      ],
      // pH adjust factors: more complex due to TA dependence
      // fl oz muriatic per 0.1 pH decrease per 10k gallons (at various TA levels)
      muriaticFactor: { 50: 2.0, 75: 2.8, 100: 3.5, 125: 4.2, 150: 5.0 }, // TA → fl oz
      sodaAshFactor: 3.0  // oz dry per 0.1 pH increase per 10k gal (rough — varies with TA)
    },
    ta: {
      label: "Total Alkalinity (TA)",
      unit: "ppm", min: 80, max: 120, ideal: "80-100",
      raise: [
        { id:"bakingSoda", label:"Baking Soda (Sodium Bicarbonate)", unit:"lbs",
          factor: 1.5,  // lbs per 10 ppm per 10,000 gal
          note:"Raises TA with minor pH impact. Standard TA increaser." }
      ],
      lower: [
        { id:"muriaticAcid",label:"Muriatic Acid 31.45%", unit:"fl oz",
          note:"Add acid to lower TA, then aerate to raise pH back up. Multiple doses needed." }
      ]
    },
    ch: {
      label: "Calcium Hardness (CH)",
      unit: "ppm", min: 200, max: 400, ideal: "200-400",
      raise: [
        { id:"calciumChloride", label:"Calcium Chloride (dry)", unit:"lbs",
          factor: 1.25,  // lbs per 10 ppm per 10,000 gal
          note:"Pre-dissolve in bucket — extremely exothermic. Add slowly." }
      ],
      lower: [ { id:"drain", label:"Partial drain / dilution only", unit:"", note:"No chemical lowers CH. Must dilute with fresh water." } ]
    },
    cya: {
      label: "Cyanuric Acid / Stabilizer (CYA)",
      unit: "ppm", min: 30, max: 80, ideal: "30-50",
      raise: [
        { id:"cyanuricAcid", label:"Cyanuric Acid (Stabilizer)", unit:"lbs",
          factor: 0.73,  // lbs per 10 ppm per 10,000 gal
          note:"Add inside a sock hung in the skimmer. Dissolves slowly — takes 1-2 weeks to read accurately." }
      ],
      lower: [ { id:"drain", label:"Partial drain / dilution only", unit:"", note:"No chemical removes CYA. Must drain and dilute." } ]
    }
  },

  // SLAM protocol targets (FC = CYA × multiplier)
  slam: {
    greenPool:    { label:"Green Pool / Algae Kill",   mult: 0.40, note:"Maintain until: CC < 0.5 + water clear + passes OCLT" },
    maintenance:  { label:"Maintenance Shock",          mult: 0.20, note:"Standard weekly shock level" },
    mustardAlgae: { label:"Mustard (Yellow) Algae",     mult: 0.60, note:"Harder to kill — requires thorough brushing and sustained high FC" },
    blackAlgae:   { label:"Black Algae",                mult: 0.80, note:"Very resistant. Must physically scrub spots. Consider a long SLAM." },
    clearPool:    { label:"Already Clear Pool",         mult: 0.10, note:"Normal operating target" }
  },

  // Chemical addition order and wait times
  additionOrder: [
    { step:1, chem:"Muriatic Acid",        wait:"30 min (circulating)", reason:"Lower pH first so shock works efficiently. Pump running." },
    { step:2, chem:"Sodium Bicarbonate",   wait:"15 min",               reason:"Raise TA if needed before shocking. Spread across surface." },
    { step:3, chem:"Calcium Chloride",     wait:"4 hours",              reason:"Pre-dissolve in bucket. Allow to fully disperse before next addition." },
    { step:4, chem:"Cyanuric Acid",        wait:"24 hours",             reason:"Add to skimmer sock. Does not interact with other chems but slow to dissolve." },
    { step:5, chem:"Chlorine (liquid)",    wait:"Circulate 15 min",     reason:"Add last. Distribute around perimeter. Never mix directly with acid." },
    { step:6, chem:"Cal-Hypo Shock",       wait:"Pre-dissolve first",   reason:"NEVER add directly to skimmer. Pre-dissolve in bucket, then pour around pool." }
  ],

  // Ideal chemistry ranges
  ranges: {
    fc:   { low: 2,   high: 10,  ideal: "3-6",     unit: "ppm" },
    cc:   { low: 0,   high: 0.5, ideal: "0-0.2",   unit: "ppm", note:"Combined chlorine — above 0.5 = shock needed" },
    ph:   { low: 7.2, high: 7.8, ideal: "7.4-7.6", unit: "" },
    ta:   { low: 80,  high: 120, ideal: "80-100",   unit: "ppm" },
    ch:   { low: 200, high: 400, ideal: "200-400",  unit: "ppm", note:"Plaster/gunite pools lean 250-350; vinyl/fiberglass 150-250 OK" },
    cya:  { low: 30,  high: 80,  ideal: "30-50",    unit: "ppm", note:"Salt pools: 60-80. Above 100 = drain to dilute." },
    salt: { low: 2700, high: 3400, ideal: "3000-3200", unit: "ppm", note:"Only for salt chlorinator pools" },
    tds:  { low: 0,  high: 2000, ideal: "<1500",    unit: "ppm", note:"Above 1500: water quality degrading. Partial drain recommended." }
  },

  // Partial drain calculator data
  drainCalc: {
    description: "Used when CYA, CH, or TDS is too high. Calculate % to drain and replace with fresh water.",
    // Target = current × (1 - drain_pct) + 0 × drain_pct  →  drain_pct = 1 - (target / current)
  }
};

window.SPLASHLENS_TECH_RADAR = {
  updated: "2026-07-17",
  cadence: {
    daily: "Add 3-5 codes, model clues, part families, or proof prompts when new field patterns show up.",
    weekly: "Publish one field card, training scenario, or SEO/AEO hub update for pool tech search.",
    monthly: "Ship a Field Intelligence Update with new robots, automation, heaters, heat pumps, lights, salts, covers, and controller notes."
  },
  categories: [
    {
      name: "Robots",
      status: "High priority",
      examples: ["Beatbot AquaSense X", "Beatbot AquaSense 2 Ultra", "Beatbot Sora 30", "Aiper Scuba X1 / X1 Pro Max", "Aiper Scuba V3", "Aiper Scuba S1", "Aiper Scuba 800 / L1 / N1 / N3 AI Vision", "Aiper EcoSurfer / Surfer", "Maytronics Dolphin", "Polaris Alpha iQ", "WYBOT", "Ecovacs", "iGarden", "Betta", "Water Tech Volt"],
      proof: ["power supply or dock", "charging contacts", "self-cleaning station/dock", "tracks and brushes", "filter basket", "cord or battery housing", "app pairing screen", "firmware/status screen", "demo-unit accessory check", "fine-filter or ultra-fine-filter proof"],
      fieldFlags: ["no power", "will not climb", "Wi-Fi pairing failure", "HydroComm/app offline", "water intrusion", "short runtime", "navigation/mapping miss", "AI vision miss", "self-cleaning dock not rinsing fully", "demo unit missing dock/accessory"],
      sourceNotes: ["Beatbot is pushing AI mapping, debris recognition, cordless workflows, and self-cleaning/charging stations; SplashLens should capture dock, filter, charging, sensor, and app proof before warranty/support escalation."]
    },
    {
      name: "Connected Pool Network",
      status: "Live reference layer",
      examples: ["Pentair IntelliCenter", "Hayward Omni", "Jandy AquaLink RS", "Jandy AquaLink TCX", "Jandy AquaLink EDGE", "Jandy iAquaLink", "CCEI Vigipool", "CCEI Tild VP", "CCEI Antea VS", "RS-485 pumps", "valve actuators", "smart heaters", "lighting relays", "automatic covers"],
      proof: ["controller model", "firmware/app screen", "alert timestamp", "manual chemistry check", "local panel state", "relay label", "RS-485 wiring photo", "device assignment screen", "breaker/GFCI behavior", "wireless remote/handheld proof"],
      fieldFlags: ["offline app", "stale remote alert", "chemistry mismatch", "lost communication", "wrong relay", "actuator wrong direction", "pump not seen by automation", "light schedule mismatch", "remote controls app but local panel differs"],
      sourceNotes: ["Jandy automation controls lights, water features, spa settings, valves, filtration, cleaning, pumps, heaters, and remote app workflows; SplashLens should capture both app state and local panel proof."]
    },
    {
      name: "Heat / Cool",
      status: "Expanding",
      examples: ["Raypak", "Pentair MasterTemp / UltraTemp", "Hayward Universal H-Series / HeatPro", "Jandy JXi / VersaTemp", "AquaCal", "Gulfstream", "Rheem / Ruud", "Plunge All-In Gen 2"],
      proof: ["model plate", "fault display", "water flow reading", "filter pressure", "gas/electrical context", "ambient temperature"],
      fieldFlags: ["LO/IF/HL faults", "flow switch", "defrost", "refrigerant/service call", "heater lockout", "cooler/chiller sizing question"]
    },
    {
      name: "Lighting",
      status: "Live reference layer",
      examples: ["Pentair IntelliBrite / MicroBrite", "Hayward ColorLogic / Omni Direct", "Jandy WaterColors", "Jandy Infinite WaterColors", "CMP Brilliant Wonders / PAL", "retrofit niche lights"],
      proof: ["fixture label", "voltage", "transformer size", "junction box condition", "cord route", "automation mode"],
      fieldFlags: ["GFCI trip", "wrong color", "flicker", "one light out", "voltage drop", "retrofit compatibility"]
    },
    {
      name: "Chem Controllers / Feeders",
      status: "Live reference layer",
      examples: ["Rola-Chem", "CAT", "BECS", "Chemtrol", "IPS", "Stenner", "Prominent", "Walchem", "Pulsar", "SunnyWhale FinWhale"],
      proof: ["manual test reading", "probe age", "calibration standard", "flow cell", "tank/tablet level", "feed pump/tube", "app alert screen"],
      fieldFlags: ["ORP low", "pH high", "probe drift", "no sample flow", "overfeed risk", "blocked injection fitting", "low tablets", "stale app trend"]
    },
    {
      name: "Advanced Sanitizers",
      status: "Updated July 2026",
      examples: ["Jandy X-Series AOP In-Line", "Jandy X-Series AOP Off-Line", "CMP DEL Ozone", "Paramount Clear O3", "Hayward HydraPure", "Pentair BioShield", "UV-C systems", "ozone systems"],
      proof: ["model plate", "in-line or off-line configuration", "pool volume", "LED state", "flow and plumbing orientation", "mounting", "lamp age", "ozone tubing and check valve", "manual sanitizer reading"],
      fieldFlags: ["status light", "low flow", "lamp service interval", "water in ozone tubing", "check-valve failure", "configuration mismatch", "sanitizer residual not verified"]
    },
    {
      name: "Pool Safety Monitoring",
      status: "New proof lane",
      examples: ["SwamCam", "SwamCam OverWatchAI Dual Camera", "smart pool cameras", "pool alarms", "gate alarms", "wearable alarms"],
      proof: ["camera fields of view", "blind spots", "armed state", "walk-test timestamp", "audible alarm", "alert destinations", "network state", "backup power", "keypad and auto-arm", "privacy/access settings"],
      fieldFlags: ["coverage gap", "camera offline", "alert path failed", "backup power failed", "auto-arm failed", "notification permissions off", "privacy review needed", "supplemental safety layer only"]
    },
    {
      name: "Covers / Safety",
      status: "Live reference layer",
      examples: ["Coverstar", "Cover-Pools", "APC", "Coverstar Central", "Save-T Cover", "cover pumps", "Latham MeasureGO", "Latham MeasurePRO"],
      proof: ["track condition", "rope/pulley view", "motor/key switch", "controller label", "standing water load", "fabric alignment", "full pool perimeter", "steps and raised walls", "obstructions and anchor context", "measurement device capability"],
      fieldFlags: ["will not move", "travels crooked", "water on cover", "manual operation", "safety layer warning", "measure proof incomplete", "manufacturer review pending"]
    },
    {
      name: "Salt Systems",
      status: "Updated July 2026",
      examples: ["Jandy TruClear", "Jandy TruClear XL", "AquaPure", "Hayward AquaRite", "Pentair IntelliChlor", "Circupool"],
      proof: ["cell window or blade photo", "controller display", "independent salt test", "FC/CYA reading", "cell age", "pump schedule"],
      fieldFlags: ["check cell", "low output", "visible scale", "drop-in fit", "cleaning cap", "cell replacement quote"]
    },
    {
      name: "Hot Tubs / Spas",
      status: "Live spa lane",
      examples: ["Balboa BP/VS/GS/GL and TP/spaTouch systems", "Balboa TP400/TP500/TP600/TP800/TP900", "Balboa spaTouch Mini / spaTouch 2 / 3 / 4", "Gecko Y/XE/YT/in.touch", "Waterway NEO 1100 / 1500 / 2100", "Watkins / Hot Spring / Caldera controls", "Jacuzzi / Sundance controls", "Cal Spas 2026 Patio / Escape / Swim Pro", "Master Spas H2X", "Endless Pools fitness systems", "Hydropool swim spas", "PDC TruSwim / Summit", "Artesian TidalFit", "Bullfrog", "Marquis", "Coast", "Arctic", "Wellis", "FROG hot tub systems", "spa jet plumbing", "swim current pumps", "ozone / UV spa systems", "pipe and jet cleanser", "spa covers and lifters"],
      proof: ["spa pack label", "topside display code", "control panel family", "filter condition", "flow or pressure-switch context", "heater tube or sensor proof", "pump wet-end and motor label", "jet body or manifold proof", "suction cover marking", "sanitizer cartridge", "ozone/UV module and check valve", "manual water test", "drain/purge history", "cover/lifter condition", "GFCI trip timing", "swim-current pump label", "auxiliary keypad proof"],
      fieldFlags: ["no power", "flow/pressure error", "dry heater", "high limit", "sensor sync", "GFCI trips immediately", "GFCI trips on heat call", "one pump or jet bank dead", "weak swim current", "app offline", "aux keypad dead", "biofilm flush", "no heat", "heat loss overnight", "rapid pH drift", "foaming", "sanitizer depletion", "cover waterlogged", "audio/light accessory dead"],
      sourceNotes: ["Balboa publishes user guides for TP and spaTouch panels; Cal Spas publishes 2026 hot tub and swim-spa manuals; Coast and Master Spas publish owner manual lanes. SplashLens cards should stay proof-first and manual-verified."]
    }
  ]
};

window.SPLASHLENS_MONETIZATION_LANES = {
  promise: "Free field app first. Optional pro tools package proof, team visibility, facility workflows, and partner-reviewed field cards.",
  trustBoundary: "Manual lookup, basic PartSnap, calculators, Facility Assist, and cautious reference language stay useful without an account. Paid lanes add saved proof, heavier scanner use, team reports, and partner workflows.",
  plans: [
    {
      name: "Free Field App",
      planKey: "free_core",
      price: "$0",
      buyer: "Pool and spa techs",
      includes: ["Equipment code lookup", "Basic PartSnap", "Calculators", "Facility Assist", "Offline manual tools after first load"],
      guardrail: "No diagnosis, fitment, warranty, or official partner claim."
    },
    {
      name: "PartSnap Pro",
      planKey: "partsnap_pro_monthly",
      price: "$4.99/mo or $39/yr",
      buyer: "Heavy scanner users",
      includes: ["More online PartSnap and Error Scan usage", "Proof checklist before ordering or escalating", "Price-check search links with affiliate disclosure", "Scanner activation and restore flow"],
      guardrail: "Search links are for price checking; verify model, dimensions, and current parts diagram before ordering."
    },
    {
      name: "Service Proof Pro",
      planKey: "service_proof_pro_monthly",
      price: "$19/mo target",
      buyer: "Solo tech",
      includes: ["Save each pool's photos, readings, notes, and repair history", "Plain-English summary you can send to the customer", "One-tap packet for a boss, senior tech, or vendor", "Spot repeat issues before they become callbacks"],
      guardrail: "Built for cleaner documentation without becoming a full CRM."
    },
    {
      name: "Team / Facility Plans",
      planKey: "team_proof_os_monthly",
      price: "$99+/mo pilot target",
      buyer: "Service companies, facilities, CPOs, training groups",
      includes: ["See what your techs used, searched, and missed", "Reports with your company name on them", "Daily check and incident workflows for CPOs and facilities", "Team-level searched/missed reports"],
      guardrail: "Exports support existing CRMs; SplashLens is not a billing replacement."
    },
    {
      name: "Facility / CPO Pilot",
      planKey: "facility_cpo_pilot_monthly",
      price: "Included in team/facility pilots",
      buyer: "Facilities and training groups",
      includes: ["Daily checks", "Contamination event workflow", "Dose logs", "Escalation packets", "Staff handoff records"],
      guardrail: "Local code, facility policy, and CPO/trainer guidance still control."
    },
    {
      name: "Verified Manufacturer Cards",
      planKey: "verified_manufacturer_cards_monthly",
      price: "By arrangement",
      buyer: "Manufacturers and expert vendors",
      includes: ["Partner-reviewed field cards", "Required proof photos", "Warranty-safe wording", "Preferred escalation steps"],
      guardrail: "Only marked partner-verified after written partner review/approval."
    },
    {
      name: "Distributor / Counter Mode",
      planKey: "distributor_counter_mode_monthly",
      price: "By arrangement",
      buyer: "Parts counters and distributors",
      includes: ["Required model plate prompts", "Second photo workflow", "Symptom/code capture", "Wrong-order prevention packet"],
      guardrail: "Possible match and missing proof, never guaranteed fit."
    },
    {
      name: "Training Partner Layer",
      planKey: "training_partner_layer_monthly",
      price: "License, affiliate, or rev share",
      buyer: "Pool schools and instructors",
      includes: ["5-minute field lessons", "Proof-based quizzes", "CPO scenario workflows", "Senior-review practice packets"],
      guardrail: "No official training alignment unless agreed in writing."
    }
  ]
};

window.SAND_FILTER_DATA = {
  // Sand weight by tank diameter (inches) → pounds of #20 silica sand
  sandByDiameter: [
    { dia:16,  sand:50,  flow:"25-35 GPM",  sqft:1.4, commonModels:["Hayward S166T","Pentair TR40","Sand Dollar SD40"] },
    { dia:18,  sand:75,  flow:"35-50 GPM",  sqft:1.77, commonModels:["Hayward S180T","Pentair TR40C","Jacuzzi SL15"] },
    { dia:19,  sand:100, flow:"40-55 GPM",  sqft:1.97, commonModels:["Hayward S194T","Pentair TR60","AquaPro 19\""] },
    { dia:20,  sand:100, flow:"45-60 GPM",  sqft:2.16, commonModels:["Hayward S200T","Pentair TR60-C","Sta-Rite S7M400"] },
    { dia:21,  sand:150, flow:"50-70 GPM",  sqft:2.40, commonModels:["Hayward S210T","Custom 21"] },
    { dia:22,  sand:150, flow:"55-75 GPM",  sqft:2.64, commonModels:["Hayward S220T","Pentair TR100","Sand Dollar SD75"] },
    { dia:24,  sand:200, flow:"65-90 GPM",  sqft:3.14, commonModels:["Hayward S244T","Pentair TR140","Waterway Crystal Water 30\""] },
    { dia:26,  sand:250, flow:"75-100 GPM", sqft:3.69, commonModels:["Hayward S270T","Pentair TR100C"] },
    { dia:28,  sand:300, flow:"85-110 GPM", sqft:4.28, commonModels:["Hayward S311T","Commercial 28\""] },
    { dia:30,  sand:350, flow:"100-130 GPM",sqft:4.91, commonModels:["Pentair TR200","Commercial 30\""] },
    { dia:36,  sand:500, flow:"130-175 GPM",sqft:7.07, commonModels:["Commercial only"] }
  ],
  // Backwash guidance
  backwash: {
    triggerPSI: 8,   // psi above clean starting pressure
    durationSec: 120, // 2 minutes typical
    rinseMode: true,
    rinseSec: 30,
    note: "Always run on RINSE for 15-30 seconds after backwash before returning to FILTER."
  },
  // Sand replacement schedule
  replacement: {
    residential: "Every 3-5 years",
    commercial:  "Every 1-2 years",
    signs:["Filter pressure constantly high even after backwash","Cloudy water despite good chemistry","Sand channeling (water passing through without filtration)","Sand appearing in pool (broken lateral)"]
  },
  // Alternative media
  alternatMedia: [
    { name:"ZeoSand (Zeolite)",    amount:"lbs = sand_lbs × 0.5", note:"50% less by weight. Better filtration to 2-3 microns. Good for high-bather loads." },
    { name:"FilterGlass",          amount:"lbs = sand_lbs × 0.75", note:"Lasts 10+ years. Better filtration. No biological growth." },
    { name:"Polybead (Polyester)", amount:"lbs = sand_lbs × 0.5", note:"Environmentally friendly. Better than sand on small particles." }
  ]
};

window.POOL_VOLUME_DATA = {
  shapes: [
    {
      id:"rectangle", label:"Rectangle / Square",
      fields:["length","width","shallowEnd","deepEnd"],
      formula: (l,w,s,d) => l * w * ((s+d)/2) * 7.48,
      tip:"Measure inside wall to inside wall."
    },
    {
      id:"oval", label:"Oval / Ellipse",
      fields:["length","width","shallowEnd","deepEnd"],
      formula: (l,w,s,d) => l * w * 0.785 * ((s+d)/2) * 7.48,
      tip:"Measure longest length and widest point."
    },
    {
      id:"round", label:"Round / Circle",
      fields:["diameter","shallowEnd","deepEnd"],
      formula: (dia,_,s,d) => Math.PI * Math.pow(dia/2,2) * ((s+d)/2) * 7.48,
      tip:"Measure diameter across the center."
    },
    {
      id:"kidney", label:"Kidney",
      fields:["length","width1","width2","shallowEnd","deepEnd"],
      formula: (l,w1,w2,s,d) => (l * (w1+w2)/2 * 0.45) * ((s+d)/2) * 7.48,
      tip:"Measure length, then both widths (at widest bulges). 0.45 is standard kidney factor."
    },
    {
      id:"lshape", label:"L-Shape",
      fields:["length1","width1","length2","width2","shallowEnd","deepEnd"],
      formula: (l1,w1,l2,w2,s,d) => (l1*w1 + l2*w2) * ((s+d)/2) * 7.48,
      tip:"Divide the L into two rectangles. Measure each independently."
    },
    {
      id:"freeform", label:"Freeform (estimate)",
      fields:["surfaceAreaEst","shallowEnd","deepEnd"],
      formula: (area,_,s,d) => area * ((s+d)/2) * 7.48,
      tip:"Estimate surface area by overlaying a rectangle and subtracting ~20-30% for irregular edges."
    }
  ]
};

window.CLOSING_CHECKLIST = [
  { phase:"Chemistry — Pre-Close (do first, run pump 24h after)", steps:[
    "Test all 6: FC, CC, pH, TA, CH, CYA",
    "Adjust pH to 7.2–7.4 — slightly low prevents winter scale",
    "Adjust TA to 80–100 ppm",
    "Adjust CH to 200–400 ppm",
    "Shock pool to 10+ ppm FC using Cal-Hypo — big kill before cover goes on",
    "Add PolyQuat 60 algaecide per label (preferred — no foaming, works under cover)",
    "Add phosphate remover if phosphates were above 500 ppb",
    "Add metal sequestrant if source water is high in iron or copper",
    "DO NOT add extra CYA — it persists and you waste stabilizer"
  ]},
  { phase:"Equipment Shutdown", steps:[
    "Run pump/filter minimum 24 hours after adding closing chemicals",
    "Backwash sand/DE filter OR clean cartridge elements before shutdown",
    "For DE filters: disassemble and hose off grids — rinse thoroughly",
    "Turn off heater FIRST — allow 15 min to cool before shutting pump off",
    "Shut off salt chlorinator — clean cell with acid wash per spec",
    "Remove and store salt cell indoors for winter",
    "Disconnect and store automation equipment and remote controls",
    "Clean pump strainer basket thoroughly",
    "Turn off main power at breaker panel — tape breaker if pool is near public access"
  ]},
  { phase:"Winterize Plumbing", steps:[
    "Lower water level below skimmer opening (or mid-tile on vinyl/fiberglass)",
    "Blow out return lines with compressor — work pump → returns",
    "Insert Gizzmo / winterization plug into each skimmer throat",
    "Blow out skimmer line — plug when water clears",
    "Blow out main drain line — close valve or plug if accessible",
    "Add propylene glycol antifreeze to lines in hard-freeze climates (NEVER ethylene glycol)",
    "Drain pump completely — remove drain plug and store in basket",
    "Drain filter tank — remove drain cap",
    "Drain heater heat exchanger and chlorinator — open all unions",
    "Store all drain plugs in pump basket or labeled bag"
  ]},
  { phase:"Cover Installation", steps:[
    "Vacuum and skim pool surface before covering",
    "Install underwater return plugs before installing cover",
    "Install safety cover: all anchors fully seated and tensioned evenly",
    "For mesh safety covers: use water tubes or sandbags at perimeter against wind",
    "For solid covers: install submersible cover pump — must drain rain/snowmelt",
    "For above-ground: install air pillow first to absorb ice expansion pressure",
    "Verify cover cannot be lifted by wind — check all attachment points"
  ]},
  { phase:"Final Steps", steps:[
    "Photograph equipment pad — show plugs removed, drains open (reference for spring)",
    "Wrap exposed pipe unions with foam pipe insulation in freeze climates",
    "Lock and secure equipment enclosure",
    "Log closing date, all chemical levels, and any issues in notes",
    "Schedule spring opening 2–3 weeks before first use (chemistry needs time to stabilize)"
  ]}
];

window.WEEKLY_CHECKLIST = [
  { phase:"Water Testing", steps:[
    "Test Free Chlorine (FC) — target 3–6 ppm (salt pools: 3–5 ppm)",
    "Test pH — target 7.4–7.6",
    "Test Combined Chlorine (CC) — must stay below 0.5 ppm",
    "If CC ≥ 0.5: shock to breakpoint chlorination (see SLAM calculator)",
    "Spot-check CYA after heavy rain or significant splash-out",
    "Check salt level if applicable — verify 2700–3400 ppm",
    "Adjust any out-of-range parameters using the Dosing Calculator"
  ]},
  { phase:"Physical Maintenance", steps:[
    "Skim surface — remove leaves, insects, pollen, debris",
    "Brush all walls, steps, and corners — algae anchors here first",
    "Brush waterline tile to prevent calcium ring buildup",
    "Vacuum pool floor — use WASTE mode for heavy debris (bypasses filter)",
    "Clean pump strainer basket — reduced flow = reduced filtration",
    "Clean skimmer basket",
    "Empty robotic cleaner bag / filter tray if applicable"
  ]},
  { phase:"Equipment Check", steps:[
    "Note current filter PSI — compare to your clean baseline",
    "Backwash sand/DE filter if pressure is 8+ PSI above clean baseline",
    "Verify pump is primed and running — no air bubbles in sight glass",
    "Confirm heater is reaching set temperature",
    "Check salt cell display — inspect for scale if output is low",
    "Verify automation timers / schedules are correct",
    "Look for any drips or wet spots at unions, valves, and fittings"
  ]}
];

window.MONTHLY_CHECKLIST = [
  { phase:"Full Water Balance Panel", steps:[
    "Test all 6 parameters: FC, CC, pH, TA, CH, CYA",
    "Test TDS if possible — above 1500 ppm consider partial drain",
    "Test phosphates — above 500 ppb treat with phosphate remover before algae starts",
    "Check CH trend — calcium only goes up; if above 400 consider dilution",
    "Verify CYA hasn't crept above 80 ppm — drain to lower it",
    "Add metal sequestrant if source water has elevated iron or copper",
    "Calculate LSI (Langelier Saturation Index) if plaster pool — target -0.3 to +0.3"
  ]},
  { phase:"Filter Service", steps:[
    "Backwash sand or DE filter regardless of current PSI reading",
    "For DE filters: inspect grids for tears — a single torn grid bypasses all filtration",
    "For cartridge filters: remove, hose off pleats, inspect for wear or tears",
    "Log post-service pressure — this is your updated clean baseline",
    "Check multi-port or push-pull valve for bypassing or stiff handle",
    "Inspect sight glass — should clear within 15–30 seconds of backwash",
    "Check for sand channeling: water should spread across sand surface, not sinkhole"
  ]},
  { phase:"Equipment Deep Inspection", steps:[
    "Listen to pump motor — unusual noise or heat = bearing or capacitor issue",
    "Check all O-rings and unions — lubricate with Teflon-compatible lube (not petroleum)",
    "Inspect pump lid O-ring — replace if cracked, compressed flat, or leaking",
    "Inspect heater burner compartment for debris, spider nests, or carbon buildup",
    "Check gas line connections with soapy water — bubbles = leak, call a tech",
    "Acid wash salt cell if output is low (muriatic 4:1 dilution, 15 min max)",
    "Inspect all return jets — verify directional flow is sweeping the pool",
    "Inspect main drain cover for cracks — must be VGB anti-vortex compliant"
  ]},
  { phase:"Surfaces & Waterline", steps:[
    "Treat waterline tile with calcium lime remover or dilute muriatic on rag",
    "Brush corners, steps, and any discolored spots before they anchor",
    "Identify stains before treating — metal, organic, and mineral stains need different chemicals",
    "Inspect pool light lens for moisture intrusion or cracking",
    "Check deck drains for flow direction — must drain away from pool",
    "Inspect coping and expansion joints — seal cracks before water infiltrates and freezes"
  ]}
];

window.OPENING_CHECKLIST = [
  { phase:"Before Filling", steps:[
    "Remove and store winter cover — clean before storing",
    "Remove all winterization plugs and gizzmos from returns and skimmer",
    "Re-install all return fittings and drain plugs",
    "Reinstall main drain cover (check VGB compliance — anti-vortex cover required)",
    "Remove ice compensation bags / pillows (above-ground)",
    "Check equipment pad: look for freeze damage on heater unions, pump, filter",
    "Check all plumbing for cracks from freeze expansion"
  ]},
  { phase:"Fill & Equipment Start", steps:[
    "Fill pool to middle of skimmer opening",
    "Prime pump — fill pump basket and housing with water",
    "Start pump — verify priming within 2-3 minutes",
    "Check filter pressure at startup (note as your 'clean baseline' for the season)",
    "Bleed air from filter tank (on DE/cartridge: open air relief valve until water flows)",
    "Turn heater on — check for error codes (E01, E05 most common on cold startup)",
    "Verify all returns are flowing",
    "Check for any water leaks at unions, fittings, or filter"
  ]},
  { phase:"Water Chemistry — Test First", steps:[
    "Test: pH, FC, TC/CC, TA, CH, CYA (all 6 before adding anything)",
    "If water is green/cloudy: SLAM protocol (see Dosing Calculator)",
    "Balance in ORDER: pH → TA → CH → CYA → then chlorine last",
    "If CYA is 0 (fresh water): add stabilizer first — takes 1-2 weeks to absorb",
    "If CYA > 80: partial drain recommended before shocking",
    "Shock to breakpoint: FC should be 10× CC reading (or 10× CYA for SLAM)"
  ]},
  { phase:"Filter & Cleanup", steps:[
    "Backwash sand or DE filter (winter debris in filter)",
    "For DE filter: breakdown and hose off grids if not done at closing",
    "Brush all pool surfaces — algae hides in corners and on steps",
    "Vacuum to waste if heavy debris on bottom (bypass filter to avoid clogging)",
    "Run filter 24/7 until water is clear",
    "Check salt cell reading if applicable (clean with acid wash if needed)",
    "Test automation/timer settings for the season",
    "Check light fixtures for moisture intrusion"
  ]}
];

// ---------------------------------------------------------------------------
// DE Filter Reference Data
// ---------------------------------------------------------------------------
window.DE_FILTER_DATA = {
  // DE charge weight: lbs of DE powder per square foot of filter area
  // Standard: 1 lb per 10 sq ft (or 1.5 oz per sq ft)
  chargePerSqFt: { lbs: 0.1, oz: 1.5 },

  // Common DE filter grids by model — sq footage and initial DE charge
  filters: [
    { brand:"Hayward", model:"EC40",   sqft:40,  deChargeLbs:4.0,  backwashGPM:60,  noteableFeature:"Vertical grid. Common residential." },
    { brand:"Hayward", model:"EC50",   sqft:50,  deChargeLbs:5.0,  backwashGPM:75,  noteableFeature:"Vertical grid." },
    { brand:"Hayward", model:"EC65",   sqft:65,  deChargeLbs:6.5,  backwashGPM:90,  noteableFeature:"Popular mid-size." },
    { brand:"Hayward", model:"Pro-Grid DE3620", sqft:36, deChargeLbs:3.6, backwashGPM:55, noteableFeature:"Newer vertical grid design." },
    { brand:"Pentair", model:"FNS Plus 36", sqft:36, deChargeLbs:3.6, backwashGPM:55, noteableFeature:"Easy disassembly. Bump handle." },
    { brand:"Pentair", model:"FNS Plus 48", sqft:48, deChargeLbs:4.8, backwashGPM:70, noteableFeature:"Most popular Pentair DE." },
    { brand:"Pentair", model:"FNS Plus 60", sqft:60, deChargeLbs:6.0, backwashGPM:85, noteableFeature:"Large residential/light commercial." },
    { brand:"Pentair", model:"Quad DE 80", sqft:80, deChargeLbs:8.0, backwashGPM:120, noteableFeature:"4-element cartridge-style DE. No backwash valve needed." },
    { brand:"Jandy",   model:"DEV48",  sqft:48,  deChargeLbs:4.8,  backwashGPM:70,  noteableFeature:"Vertical grid. Common with Jandy systems." },
    { brand:"Jandy",   model:"DEV60",  sqft:60,  deChargeLbs:6.0,  backwashGPM:85,  noteableFeature:"Large residential." },
    { brand:"Sta-Rite",model:"System:3 S8D110", sqft:48, deChargeLbs:4.8, backwashGPM:70, noteableFeature:"Modular design. Easy grid access." },
    { brand:"Generic", model:"Custom — Calculate", sqft:null, deChargeLbs:null, backwashGPM:null, noteableFeature:"Enter sq footage below to calculate DE charge." }
  ],

  // How to recharge after backwash
  recharge: {
    steps: [
      "Mix DE powder with water in a bucket to form a slurry BEFORE adding to skimmer",
      "With pump running on FILTER, slowly pour slurry into skimmer",
      "Never add dry DE powder directly — clumping damages grids",
      "After backwash, only add back 80% of original charge (some DE remains on grids)",
      "After full teardown and hose-off: add 100% of original charge"
    ],
    safetyNote: "Wear a dust mask when handling DE powder — silica is a respiratory hazard. Use cellulose alternative (Perlite) if preferred."
  },

  // Signs grids need replacement
  gridReplacement: {
    signs: [
      "DE powder passing through into pool (cloudy water after recharge)",
      "Pressure rises faster than normal between backwashes",
      "Visible tears, holes, or broken frames on grids",
      "Grids appear matted, caked, or deformed after acid wash",
      "Manifold cracks or grid manifold is warped"
    ],
    interval: "Every 5-7 years residential, annually commercial or with heavy bather loads",
    acidWash: "Annual acid wash recommended: 1 part muriatic acid to 10 parts water, soak 15 min, rinse thoroughly"
  }
};

// ---------------------------------------------------------------------------
// Route/Day View — Schema Reference
// ---------------------------------------------------------------------------
// Route/Day view — stored in localStorage as 'poolens-route'
// Schema reference (not a window global — stored in localStorage directly):
// {
//   date: "2026-05-24",
//   jobs: [
//     { id: "timestamp", poolName: "Smith Residence", address: "123 Main St",
//       time: "09:00", done: false, note: "" }
//   ]
// }
window.ROUTE_SCHEMA_VERSION = 1; // bump to invalidate old localStorage data if schema changes

// ---------------------------------------------------------------------------
// Salt Chlorinator Reference Data
// ---------------------------------------------------------------------------
window.SALT_CHLORINATOR_DATA = {
  saltTargets: [
    { brand:"Hayward AquaRite",        target:"3000–3400 ppm", low:2700, high:3400 },
    { brand:"Pentair IntelliChlor",    target:"3100–3400 ppm", low:3100, high:3400 },
    { brand:"Zodiac / Jandy AquaPure", target:"3000–3500 ppm", low:3000, high:3500 },
    { brand:"Jandy TruClear / TruClear XL", target:"3000–3500 ppm", low:3000, high:3500 },
    { brand:"CircuPool",               target:"3000–3500 ppm", low:3000, high:3500 },
    { brand:"Generic / most brands",   target:"2700–3400 ppm", low:2700, high:3400 },
  ],
  saltToRaiseFactor: 0.83, // lbs per 1,000 gallons per 100 ppm rise
  cyaRecommendation: "60–80 ppm (UV degrades chlorine faster without a stabilizer buffer)",
  maintenance: [
    "Inspect cell every 3 months — remove and look for calcium buildup on plates",
    "Acid wash when scale is visible: 4:1 water:muriatic acid, 15 min max, rinse thoroughly",
    "Check controller output % — low output with adequate salt = scaling or aging cell",
    "Replace cell every 3–7 years depending on salt level and bather load",
    "Winterize: remove cell, flush with fresh water, store indoors above freezing",
    "Never exceed 3,500 ppm — excess salt accelerates corrosion on metal components",
  ],
  lowOutputCauses: [
    "Salt level out of range (test with dedicated salt meter)",
    "Calcium scale on cell plates (acid wash needed)",
    "Water temperature below 60°F — cells produce 25–50% less in cold water",
    "Cell age — efficiency decreases after 3–5 years of service",
    "Flow switch not sensing adequate flow (check basket, impeller, filter PSI)",
  ]
};

// ---------------------------------------------------------------------------
// Chemical Danger / Safety Reference Data
// ---------------------------------------------------------------------------
window.CHEM_DANGER_DATA = {
  neverMix: [
    { combo:"Chlorine + Muriatic Acid",         result:"Chlorine gas — immediately life-threatening. Even residue + fumes is dangerous.", icon:"☠", severity:"deadly" },
    { combo:"Trichlor + Cal-Hypo",              result:"Violent reaction — fire and explosion risk. Never allow these two to contact each other.", icon:"💥", severity:"deadly" },
    { combo:"Any two chlorine products (dry)",  result:"Different chlorine formulas react dangerously. Always add each product separately into pool water.", icon:"⚠", severity:"high" },
    { combo:"Chlorine + Ammonia-based algaecide",result:"Produces chloramine gas. Use only PolyQuat (quaternary ammonium) algaecides.", icon:"⚠", severity:"high" },
    { combo:"Acid + chlorine in confined space", result:"Fumes combine to create chlorine gas — always handle outdoors or in excellent ventilation.", icon:"☠", severity:"deadly" },
  ],
  safeHandling: [
    "Always add chemicals TO water — never add water to concentrated chemicals",
    "Add one chemical at a time, 15–30 min apart, with pump running",
    "Never use the same measuring cup for different chemicals without rinsing",
    "Store acid and chlorine on opposite sides of the storage area — never adjacent",
    "Keep all chemicals in original, labeled containers with lids sealed",
    "Wear nitrile gloves and eye protection every time — no exceptions",
    "Have a water hose ready — flush eyes or skin for 15 min if contact occurs",
    "Never store pool chemicals near heat sources, open flame, or in direct sunlight",
  ]
};

// ---------------------------------------------------------------------------
// Cartridge Filter Reference Data
// ---------------------------------------------------------------------------
window.CARTRIDGE_FILTER_DATA = {
  // Common cartridge filters by sq footage
  filters: [
    { brand:"Hayward", model:"C900",    sqft:90,   elements:1, cleaningInterval:"Every 3-6 months or 8+ PSI rise" },
    { brand:"Hayward", model:"C1200",   sqft:120,  elements:1, cleaningInterval:"Every 3-6 months or 8+ PSI rise" },
    { brand:"Hayward", model:"C1750",   sqft:175,  elements:1, cleaningInterval:"Every 3-6 months or 8+ PSI rise" },
    { brand:"Pentair", model:"Clean & Clear 100", sqft:100, elements:1, cleaningInterval:"Every 3-6 months" },
    { brand:"Pentair", model:"Clean & Clear 150", sqft:150, elements:1, cleaningInterval:"Every 3-6 months" },
    { brand:"Pentair", model:"Clean & Clear Plus 320", sqft:320, elements:4, cleaningInterval:"Every 6 months" },
    { brand:"Jandy",   model:"CV340",   sqft:340,  elements:4, cleaningInterval:"Every 6 months" },
    { brand:"Jandy",   model:"CV580",   sqft:580,  elements:4, cleaningInterval:"Every 6-12 months" },
    { brand:"Sta-Rite",model:"System:3 S8M500", sqft:500, elements:4, cleaningInterval:"Every 6-12 months" }
  ],
  cleaning: {
    steps: [
      "Turn pump OFF — never remove cartridge under pressure",
      "Release air pressure via air relief valve before opening",
      "Remove cartridge — hose off pleats top-to-bottom (never side-to-side — damages pleats)",
      "Inspect for tears, cracks, collapsed ends, or crushed core",
      "Soak overnight in cartridge cleaner or 1:10 muriatic acid solution for deep clean",
      "Rinse thoroughly — no acid residue before reinstalling",
      "Never use a pressure washer — destroys pleat fabric",
      "Reinstall — hand-tighten lid only, no tools needed on most models"
    ],
    replacementInterval: "Every 1-3 years depending on bather load and chemical balance",
    signs: [
      "Pleats torn, frayed, or collapsed",
      "End caps cracked or separated",
      "Core crushed or deformed",
      "Pressure stays high even after cleaning (media is spent)"
    ]
  }
};

// ---------------------------------------------------------------------------
// Chemical Product Catalog — Reference (NOT a dosing calculator)
// Helps techs identify products, generic equivalents, and retail alternatives.
// ---------------------------------------------------------------------------
window.CHEM_CATALOG = {

  categories: [

    // -----------------------------------------------------------------------
    // CATEGORY 1: Chlorine & Sanitizers
    // -----------------------------------------------------------------------
    {
      id: "chlorine",
      label: "Chlorine & Sanitizers",
      products: [
        {
          name: "Liquid Chlorine 10% / 12.5%",
          genericName: "Sodium Hypochlorite",
          activeIngredient: "Sodium Hypochlorite 10–12.5%",
          brands: [
            "HTH Pool Shock Liquid",
            "In The Swim Liquid Chlorine",
            "Clorox Pool Liquid Chlorinator",
            "Leslie's Liquid Chlorine"
          ],
          alternatives: [
            { store: "Walmart", product: "Clorox Splash-Less Bleach 8.25%", note: "Works but more dilute — use more oz per dose. No added thickeners." },
            { store: "Sam's Club", product: "Member's Mark Liquid Chlorine 12.5%", note: "Commercial grade, excellent value per gallon. Same as pool store stock." },
            { store: "Home Depot", product: "HTH Pool Liquid 10%", note: "Standard retail liquid chlorine — same product as pool store, usually cheaper." },
            { store: "Costco", product: "Kirkland Sodium Hypochlorite (when available)", note: "Check concentration on label. Often 8.25% — adjust dose accordingly." }
          ],
          notes: "Most economical sanitizer for active service. No stabilizer added — good for SLAM. Buy fresh and rotate stock — degrades ~50% potency within 6 months of manufacture. Never mix with other chemicals directly.",
          incompatible: ["Cal-Hypo", "Trichlor", "Dichlor", "muriatic acid", "ammonia-based algaecides"]
        },
        {
          name: "Cal-Hypo 65% Shock",
          genericName: "Calcium Hypochlorite",
          activeIngredient: "Calcium Hypochlorite 65%",
          brands: [
            "HTH Super Shock",
            "In The Swim Cal-Hypo Shock",
            "Leslie's Power Powder Plus",
            "BioGuard Burn Out Extreme",
            "Zappit 65"
          ],
          alternatives: [
            { store: "Sam's Club", product: "Member's Mark Pool Shock 68%", note: "Bulk bags significantly cheaper than pool store — same chemical." },
            { store: "Costco", product: "HTH Super Shock (bulk pack)", note: "Seasonal availability — stock up when available." },
            { store: "Home Depot", product: "HTH Super Shock 1-lb bags", note: "Standard retail — convenient but costs more per pound than bulk." },
            { store: "Walmart", product: "In The Swim Shock (seasonal)", note: "Available in season — verify concentration on bag." }
          ],
          notes: "Raises calcium hardness — track CH when shocking frequently. NEVER add directly to skimmer or dissolve in plastic bucket. Pre-dissolve in a dedicated 5-gal bucket of water, pour around perimeter. Keep dry and away from all other chemicals — reacts violently with Trichlor.",
          incompatible: ["Trichlor", "Dichlor", "liquid chlorine (never mix concentrates)", "acids"]
        },
        {
          name: "Cal-Hypo 73% Shock (Professional Grade)",
          genericName: "Calcium Hypochlorite",
          activeIngredient: "Calcium Hypochlorite 73%",
          brands: [
            "Olin 73% Cal-Hypo",
            "Accu-Tab 73%",
            "Arch Cal-Hypo 73",
            "BioGuard Super Soluble"
          ],
          alternatives: [
            { store: "Pool Supply Wholesale", product: "73% Cal-Hypo in 25/50-lb pails", note: "Not typically at consumer retail — source through pool supply distributors." }
          ],
          notes: "Professional/commercial grade. Higher concentration means less product per dose — calculate carefully. Same calcium-raise concern as 65% but stronger. Pre-dissolve protocol is mandatory — never shortcut this step.",
          incompatible: ["Trichlor", "Dichlor", "all chlorine concentrates", "acids", "flammable materials"]
        },
        {
          name: "Trichlor Tablets (3-inch)",
          genericName: "Trichloroisocyanuric Acid",
          activeIngredient: "Trichloro-s-Triazinetrione 90%",
          brands: [
            "HTH 3\" Chlorinating Tablets",
            "In The Swim Trichlor Tabs",
            "Clorox Pool Tabs",
            "Leslie's 3\" Tabs",
            "BioGuard Silk Tabs"
          ],
          alternatives: [
            { store: "Sam's Club", product: "Member's Mark 3\" Chlorine Tabs (3-lb or 35-lb bucket)", note: "Bulk purchase saves 30-60% vs pool store. Same trichlor chemistry." },
            { store: "Costco", product: "HTH 3\" Chlorine Tabs 35-lb bucket (seasonal)", note: "Best price per pound when available — stock up in spring." },
            { store: "Walmart", product: "HTH 3\" Tabs or Clorox Pool Tabs 5-lb bucket", note: "Retail pricing — acceptable for smaller pools or convenience." },
            { store: "Home Depot", product: "HTH Pool Tabs 3-lb or 5-lb bucket", note: "Standard retail. Compare per-pound price to warehouse clubs." }
          ],
          notes: "Each tab slowly lowers pH and raises CYA — monitor both monthly. Use ONLY in floating dispensers or erosion feeders, never directly in skimmer (corrosive to pump). Raises CYA ~2-4 ppm per tab per 10,000 gal over time — CYA creep is the primary reason pools get over-stabilized.",
          incompatible: ["Cal-Hypo (violent reaction — fire/explosion risk)", "liquid chlorine (never mix concentrates)", "other chlorine products", "acids"]
        },
        {
          name: "Dichlor Granular",
          genericName: "Sodium Dichloroisocyanurate",
          activeIngredient: "Sodium Dichloro-s-Triazinetrione Dihydrate 56%",
          brands: [
            "HTH Granular Dichlor",
            "In The Swim Dichlor",
            "BioGuard Burnout 3",
            "Leslie's Dichlor Shock"
          ],
          alternatives: [
            { store: "Sam's Club", product: "Member's Mark Dichlor (seasonal)", note: "Bulk savings available seasonally." },
            { store: "Home Depot / Walmart", product: "HTH Granular Shock (verify Dichlor on label)", note: "Some HTH granular is Dichlor, some is Cal-Hypo — read the label carefully." }
          ],
          notes: "Dissolves quickly and is good for vinyl liner pools (won't bleach). RAISES CYA approximately 1.5× the chlorine added — heavy use causes CYA to skyrocket. Not recommended for routine maintenance in stabilized pools. Better as a one-time or seasonal opener product.",
          incompatible: ["Cal-Hypo", "liquid chlorine concentrates", "acids"]
        },
        {
          name: "Non-Chlorine Shock (Potassium Monopersulfate)",
          genericName: "Potassium Monopersulfate",
          activeIngredient: "Potassium Peroxymonosulfate (KMPS) 42.8%",
          brands: [
            "HTH Non-Chlorine Shock",
            "BioGuard Burn Out 35",
            "Natural Chemistry Spa Oxidizer",
            "Leisure Time Renew",
            "In The Swim Non-Chlorine Shock"
          ],
          alternatives: [
            { store: "Walmart / Amazon", product: "Clorox Pool & Spa Shock Xtra Blue (verify KMPS formula)", note: "Some Clorox shock is KMPS-based — read label. Good for maintenance oxidation." }
          ],
          notes: "Oxidizes organic contaminants (sweat, oils, sunscreen) without adding chlorine or raising CYA. Does NOT kill algae alone — requires active chlorine. Use after heavy bather load to burn off organics. Pool can be re-entered 15 min after addition. Will give a false CC reading for 24 hours — do not test CC the same day.",
          incompatible: ["Cal-Hypo (in concentrated form)", "never mix dry chemicals directly"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 2: Baquacil System (Biguanide)
    // -----------------------------------------------------------------------
    {
      id: "baquacil",
      label: "Baquacil System (Biguanide — Chlorine-Free)",
      products: [
        {
          name: "Baquacil Sanitizer & Algistat",
          genericName: "Polyhexamethylene Biguanide (PHMB)",
          activeIngredient: "Poly(hexamethylene biguanide) hydrochloride 27.5%",
          brands: [
            "Baquacil Sanitizer & Algistat",
            "BioGuard SoftSwim B",
            "Swimtrine Plus"
          ],
          alternatives: [
            { store: "Pool specialty only", product: "No consumer retail equivalent", note: "PHMB is not sold outside the pool/spa channel. Must purchase from pool store or online pool supplier." }
          ],
          notes: "PRIMARY sanitizer in the Baquacil system. Maintains 30–50 ppm PHMB in water. Completely incompatible with chlorine — even trace chlorine contact destroys the biguanide system and creates a white floc that clogs filters. Requires its own dedicated oxidizer and shock products.",
          incompatible: ["ALL chlorine products (liquid, tablet, granular, shock)", "bromine", "copper-based algaecides"]
        },
        {
          name: "Baquacil Oxidizer",
          genericName: "Hydrogen Peroxide",
          activeIngredient: "Hydrogen Peroxide 27%",
          brands: [
            "Baquacil Oxidizer",
            "BioGuard SoftSwim C",
            "Baquashield"
          ],
          alternatives: [
            { store: "Note", product: "Do NOT substitute drugstore H2O2 (3%)", note: "Consumer hydrogen peroxide is only 3% — far too dilute. Pool-grade 27% is required for effective oxidation." }
          ],
          notes: "The oxidizer component of the Baquacil 3-part system. Applied weekly at 1 qt per 10,000 gal. Breaks down organic waste that PHMB alone cannot address. Keep levels at 30–50 ppm oxidizer. Do not substitute with chlorine-based shock under any circumstances.",
          incompatible: ["All chlorine products", "never mix with Baquacil CDX in concentrated form"]
        },
        {
          name: "Baquacil CDX",
          genericName: "Biguanide Performance Enhancer / Shock Bridge",
          activeIngredient: "Proprietary PHMB-compatible oxidizer blend",
          brands: [
            "Baquacil CDX",
            "BioGuard SoftSwim CDX"
          ],
          alternatives: [
            { store: "Pool specialty only", product: "No generic equivalent", note: "CDX is a specialized product with no consumer substitute — must use brand product." }
          ],
          notes: "The 'intelligent shock' that bridges the Baquacil Sanitizer and Oxidizer, preventing the characteristic pink/gray slime that occurs in neglected biguanide pools. Applied monthly. Many service techs underuse this — it's the most common reason biguanide pools develop chronic problems.",
          incompatible: ["All chlorine products", "acids in concentrated form"]
        },
        {
          name: "BioGuard SoftSwim B",
          genericName: "Polyhexamethylene Biguanide (PHMB)",
          activeIngredient: "Poly(hexamethylene biguanide) hydrochloride 27.5%",
          brands: ["BioGuard SoftSwim B"],
          alternatives: [
            { store: "Pool specialty only", product: "Functionally identical to Baquacil Sanitizer & Algistat", note: "Different brand, same chemistry. Either product maintains a biguanide pool." }
          ],
          notes: "BioGuard's version of the Baquacil Sanitizer. Same PHMB chemistry at the same concentration — interchangeable with Baquacil Sanitizer & Algistat. All chlorine compatibility warnings apply equally.",
          incompatible: ["ALL chlorine products", "bromine", "copper algaecides"]
        },
        {
          name: "BioGuard SoftSwim C",
          genericName: "Hydrogen Peroxide",
          activeIngredient: "Hydrogen Peroxide 27%",
          brands: ["BioGuard SoftSwim C"],
          alternatives: [
            { store: "Note", product: "Interchangeable with Baquacil Oxidizer", note: "Same chemistry — different brand. Either product works in a SoftSwim or Baquacil system." }
          ],
          notes: "BioGuard's version of the Baquacil Oxidizer. Applied weekly as the oxidation component of the 3-part SoftSwim system. Identical chemistry to Baquacil Oxidizer — can be used interchangeably.",
          incompatible: ["All chlorine products"]
        }
      ],
      systemWarning: "CRITICAL: Baquacil / SoftSwim pools CANNOT switch to chlorine without a full drain, surface cleaning, and refill. Mixing chlorine into a biguanide pool causes a white floc precipitation that clogs filters and requires complete system teardown. Always confirm sanitizer type BEFORE adding any product to an unfamiliar pool."
    },

    // -----------------------------------------------------------------------
    // CATEGORY 3: pH Adjusters
    // -----------------------------------------------------------------------
    {
      id: "ph",
      label: "pH Adjusters",
      products: [
        {
          name: "Soda Ash (pH Up)",
          genericName: "Sodium Carbonate",
          activeIngredient: "Sodium Carbonate (Na2CO3) 100%",
          brands: [
            "HTH pH Up",
            "Clorox Pool pH Up",
            "In The Swim pH Increaser",
            "BioGuard Balance Pak 200",
            "Leslie's pH Up"
          ],
          alternatives: [
            { store: "Walmart / Grocery", product: "Arm & Hammer Super Washing Soda (NOT baking soda)", note: "100% sodium carbonate — exact same chemical as pool store pH Up at a fraction of the cost. Confirm label reads 'sodium carbonate' not 'sodium bicarbonate'." },
            { store: "Walmart", product: "OxiClean Versatile Stain Remover (sodium carbonate only formula)", note: "Some versions are pure sodium carbonate — verify ingredients before use." }
          ],
          notes: "Raises both pH and Total Alkalinity. Add slowly — 1 lb at a time per 10,000 gal. Pre-dissolve in a bucket of water first to prevent localized high-pH damage to plaster or vinyl. Significant pH jumps (>0.4 in one dose) cause cloudy water — dose conservatively.",
          incompatible: ["Muriatic acid (never mix concentrates)", "dry acid"]
        },
        {
          name: "Baking Soda (Alkalinity Up)",
          genericName: "Sodium Bicarbonate",
          activeIngredient: "Sodium Bicarbonate (NaHCO3) 100%",
          brands: [
            "HTH Alkalinity Up",
            "Clorox Pool Alkalinity Increaser",
            "In The Swim Baking Soda",
            "Leslie's Alkalinity Up",
            "BioGuard Balance Pak 100"
          ],
          alternatives: [
            { store: "Walmart", product: "Arm & Hammer Baking Soda (large bags)", note: "100% identical chemical to any pool store product — same sodium bicarbonate. Saves $2+ per pound vs pool store branding." },
            { store: "Sam's Club", product: "Member's Mark Baking Soda (12-lb bags)", note: "Best price per pound — exact same chemical in bulk." },
            { store: "Costco", product: "Arm & Hammer Baking Soda (bulk)", note: "Seasonal availability — significant savings over pool store TA increaser." }
          ],
          notes: "Raises Total Alkalinity with minimal pH impact (unlike soda ash). The grocery and pool store products are chemically identical — no difference in pool performance. Broadcast across the surface with pump running. Add in increments — 1.5 lbs per 10 ppm per 10,000 gal.",
          incompatible: ["Muriatic acid (neutralizes — never mix concentrates)", "dry acid"]
        },
        {
          name: "Muriatic Acid (pH Down / Acid)",
          genericName: "Hydrochloric Acid",
          activeIngredient: "Hydrochloric Acid (HCl) 31.45%",
          brands: [
            "HTH pH Down (liquid)",
            "In The Swim Muriatic Acid",
            "Clorox Pool pH Reducer (liquid)",
            "Leslie's Muriatic Acid",
            "Klean Strip Muriatic Acid"
          ],
          alternatives: [
            { store: "Home Depot", product: "Klean Strip Muriatic Acid 31.45% (concrete section)", note: "EXACT same product and concentration as pool store acid — typically 20-50% cheaper. Look in the concrete/masonry aisle, not the pool section." },
            { store: "Lowe's", product: "Muriatic Acid 31.45% (masonry/concrete aisle)", note: "Identical product, same concentration. Check diluted formulas — some are 20% and require larger doses." },
            { store: "Tractor Supply", product: "Muriatic Acid (farm/livestock aisle)", note: "Same chemical — verify concentration. Used for livestock waterer cleaning and concrete etching." }
          ],
          notes: "Strong acid — always add acid TO pool water, never the reverse. Pre-dilute in a bucket of water (pour acid into water, not water into acid) before adding to pool. Pour slowly around the deep end with pump running. Lowers both pH and TA. Wear eye protection and gloves every time — no exceptions.",
          incompatible: ["Chlorine gas forms if mixed with chlorine in any form", "soda ash / baking soda (neutralization — never mix concentrates)", "any oxidizer"]
        },
        {
          name: "Dry Acid (pH Minus)",
          genericName: "Sodium Bisulfate",
          activeIngredient: "Sodium Bisulfate (NaHSO4) 93%+",
          brands: [
            "HTH pH Minus",
            "Lo 'N Slo Granular Acid",
            "BioGuard Optimizer pH Decreaser",
            "In The Swim Dry Acid",
            "Leslie's Dry Acid"
          ],
          alternatives: [
            { store: "Amazon / Pool Supply", product: "Sodium Bisulfate granular (pool grade)", note: "No common consumer retail equivalent at a meaningful savings. Dry acid is more expensive than muriatic per unit of pH change — use muriatic for cost efficiency." }
          ],
          notes: "Safer to handle than muriatic acid — no liquid acid fumes, easier to store. Same effect as muriatic (lowers pH and TA) but at higher cost per unit of pH change. Good choice for situations where liquid acid is inconvenient or unsafe. Dissolve in a bucket of water before adding to pool.",
          incompatible: ["Chlorine products (in concentrated dry form)", "calcium hypochlorite", "soda ash"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 4: Total Alkalinity
    // -----------------------------------------------------------------------
    {
      id: "alkalinity",
      label: "Total Alkalinity Adjusters",
      products: [
        {
          name: "Sodium Bicarbonate (TA Up)",
          genericName: "Sodium Bicarbonate",
          activeIngredient: "Sodium Bicarbonate (NaHCO3) 100%",
          brands: [
            "HTH Alkalinity Up",
            "In The Swim Total Alkalinity Increaser",
            "Clorox Pool Alkalinity Increaser",
            "BioGuard Balance Pak 100",
            "Leslie's Alkalinity Up"
          ],
          alternatives: [
            { store: "Walmart", product: "Arm & Hammer Baking Soda (1-lb, 4-lb, 12-lb bags)", note: "Exact same chemical. $0.55/lb at Walmart vs $2.50–$4/lb at pool store. Zero difference in pool performance." },
            { store: "Sam's Club", product: "Member's Mark Baking Soda 12-lb", note: "Cheapest per-pound option. Perfect for high-TA pools that need repeated treatment." },
            { store: "Costco", product: "Arm & Hammer Baking Soda bulk (seasonal)", note: "Stock up in early season. Store in airtight container." }
          ],
          notes: "This is the single biggest money-saving tip to share with pool owners: pool store Alkalinity Up IS baking soda at 3–5× markup. The chemical is identical — same purity, same performance. Dose: approximately 1.5 lbs raises TA by 10 ppm per 10,000 gallons.",
          incompatible: ["Muriatic acid (do not mix concentrates)"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 5: Calcium Hardness
    // -----------------------------------------------------------------------
    {
      id: "calcium",
      label: "Calcium Hardness Adjusters",
      products: [
        {
          name: "Calcium Chloride (CH Up)",
          genericName: "Calcium Chloride",
          activeIngredient: "Calcium Chloride (CaCl2) 77–83%",
          brands: [
            "HTH Calcium Up",
            "In The Swim Calcium Hardness Increaser",
            "Clorox Pool Calcium Hardness Increaser",
            "Leslie's Calcium Up",
            "Ultima Calcium Hardness Increaser"
          ],
          alternatives: [
            { store: "Home Depot / Lowe's", product: "DowFlake Xtra Calcium Chloride 77–83% (25-lb or 50-lb bag)", note: "Exact same chemical as pool store CH increaser — significantly cheaper per pound in bulk hardware bags." },
            { store: "Hardware stores / farm supply", product: "Peladow Calcium Chloride pellets 94-97%", note: "Higher concentration — adjust dose down by ~20%. Works identically." },
            { store: "Costco / Sam's Club", product: "Calcium Chloride ice melt (verify label)", note: "CAUTION: must confirm bag says 'Calcium Chloride' specifically. Many ice melts are sodium chloride (rock salt) which does NOTHING for CH. Read the label." },
            { store: "Tractor Supply / Farm Fleet", product: "Calcium Chloride flake or pellet (cattle/livestock grade)", note: "Same chemical. Bulk pricing available. Verify concentration on label." }
          ],
          notes: "Extremely exothermic when dissolved — pre-dissolve in a 5-gallon bucket of water, add calcium to water (not the reverse), stir, and allow to cool before adding to pool. Can raise water temp 10-15°F if added directly. Calcium only goes up — lowering CH requires partial drain. Never add more than 10 lbs per 10,000 gal per day.",
          incompatible: ["Cal-Hypo (violent heat reaction if mixed dry)"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 6: Cyanuric Acid (Stabilizer)
    // -----------------------------------------------------------------------
    {
      id: "cya",
      label: "Cyanuric Acid (Stabilizer / Conditioner)",
      products: [
        {
          name: "Cyanuric Acid",
          genericName: "Cyanuric Acid",
          activeIngredient: "Cyanuric Acid (CYA) 100%",
          brands: [
            "HTH Stabilizer & Conditioner",
            "In The Swim Cyanuric Acid",
            "Clorox Pool Stabilizer",
            "Leslie's Stabilizer & Conditioner",
            "BioGuard Stabilizer 100"
          ],
          alternatives: [
            { store: "Pool supply / Amazon", product: "Cyanuric Acid pool-grade granular", note: "No true consumer retail equivalent at a major savings. Sam's Club sometimes carries it seasonally — compare price per pound. Online pool suppliers often beat pool store pricing by 30-50%." }
          ],
          notes: "The only chemical that reduces UV degradation of free chlorine — essential for outdoor pools. Add by placing in a nylon sock hung in the skimmer basket — do NOT pour directly into pool or skimmer as it dissolves very slowly and can block skimmer flow. Takes 7-14 days to fully dissolve and register accurately on a test. Raise CYA no more than 10 ppm at a time and retest. There is NO chemical that removes CYA — only partial drain dilutes it. Target 30-50 ppm (60-80 ppm for salt pools).",
          incompatible: ["No dangerous incompatibilities — but CYA reduces chlorine effectiveness at high levels (above 80 ppm)"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 7: Algaecides
    // -----------------------------------------------------------------------
    {
      id: "algaecides",
      label: "Algaecides",
      products: [
        {
          name: "PolyQuat 60% Algaecide",
          genericName: "Polyquaternary Ammonium Chloride (PolyQuat)",
          activeIngredient: "Poly[oxyethylene(dimethyliminio)ethylene... quat] 60%",
          brands: [
            "BioGuard Banish",
            "HTH Super Algae Guard 60",
            "In The Swim PolyQuat 60",
            "Natural Chemistry Poly 60",
            "Clorox Pool Algaecide 60"
          ],
          alternatives: [
            { store: "Amazon / Pool Supply Online", product: "PolyQuat 60 generic", note: "Generic PolyQuat 60 formulas available from online pool suppliers — verify 60% concentration. Significant savings over branded pool store versions." }
          ],
          notes: "The preferred algaecide for service professionals. Compatible with all sanitizer systems including chlorine, bromine, and biguanide. Non-foaming at normal doses. Works preventatively and curatively. Use at closing and opening. Weekly maintenance dose extends algae-free intervals. Does not stain pool surfaces.",
          incompatible: ["None with chlorine — this is the safe choice. Do NOT use ammonia-based algaecides."]
        },
        {
          name: "PolyQuat 30% Algaecide (Maintenance Grade)",
          genericName: "Polyquaternary Ammonium Chloride (PolyQuat)",
          activeIngredient: "Poly[oxyethylene(dimethyliminio)ethylene... quat] 30%",
          brands: [
            "HTH Algae Guard 10",
            "In The Swim Algaecide 30",
            "Clorox Pool Algaecide",
            "BioGuard Algistat"
          ],
          alternatives: [
            { store: "Walmart / Home Depot", product: "Clorox Pool & Spa Algae Eliminator", note: "Verify PolyQuat formulation on label — some cheaper algaecides are copper-based. PolyQuat is preferred." }
          ],
          notes: "Lower concentration maintenance product. Good for weekly preventative doses. Less cost-effective than 60% for treating active algae — use 60% for any real algae problems. Non-staining, non-foaming at label doses.",
          incompatible: ["No dangerous incompatibilities when chlorine levels are maintained"]
        },
        {
          name: "Copper-Based Algaecide",
          genericName: "Copper Chelate or Copper Sulfate",
          activeIngredient: "Chelated Copper 7–9%",
          brands: [
            "BioGuard Algae All 60",
            "HTH Algae Guard",
            "Sparkle Chem Copper Algaecide",
            "Natural Chemistry Copper-Based"
          ],
          alternatives: [
            { store: "Walmart / Home Depot", product: "Algaecide products labeled with copper sulfate", note: "Copper algaecides are widely available but read the label. Cheaper products may have poorly chelated copper that stains more aggressively." }
          ],
          notes: "CAUTION: Works well against algae but raises copper levels in pool water. Copper above 0.3 ppm stains pool surfaces, especially light-colored plaster and vinyl liners (blue/green staining). Use only when necessary and monitor with a copper test. Not compatible with biguanide systems. PolyQuat is the preferred alternative for routine use.",
          incompatible: ["Baquacil / PHMB systems", "high phosphate water (reduces effectiveness)"]
        },
        {
          name: "Yellow/Mustard Algaecide",
          genericName: "Quaternary Ammonium Compound (specialty formula)",
          activeIngredient: "Quaternary ammonium compounds + activators",
          brands: [
            "Yellow Out",
            "Yellow Treat",
            "Mustard Buster",
            "BioGuard Yellow Treat",
            "In The Swim Yellow Algaecide"
          ],
          alternatives: [
            { store: "Pool specialty", product: "Limited retail availability — pool store or online pool supply", note: "Specialized product — not commonly found at mass retail." }
          ],
          notes: "Specifically formulated for Cladophora (yellow/mustard algae) which is chlorine-resistant and clings to walls and steps. Must be used in combination with a high-FC SLAM — the algaecide alone is insufficient. Brush all surfaces thoroughly before and after application. SLAM target for mustard algae is FC = CYA × 0.60.",
          incompatible: ["Do not mix with other algaecides simultaneously"]
        }
      ],
      categoryWarning: "NEVER use ammonia-based algaecides (non-PolyQuat ammonium compounds) in a chlorinated pool. Ammonia + chlorine produces chloramine gas and creates a severe odor and health hazard. Always verify the algaecide is PolyQuat (polyquaternary ammonium) — the label should say 'PolyQuat' or 'poly[oxyethylene]' in the active ingredient."
    },

    // -----------------------------------------------------------------------
    // CATEGORY 8: Phosphate Removers
    // -----------------------------------------------------------------------
    {
      id: "phosphates",
      label: "Phosphate Removers",
      products: [
        {
          name: "Lanthanum Chloride Phosphate Remover",
          genericName: "Lanthanum Chloride",
          activeIngredient: "Lanthanum Chloride (rare earth compound) ~7-10%",
          brands: [
            "Natural Chemistry PhosFree",
            "Lo-Chlor Phosphate Remover",
            "BioGuard Pool Complete",
            "In The Swim Phosphate Remover",
            "Orenda PR-10,000",
            "SeaKlear Phosphate Remover"
          ],
          alternatives: [
            { store: "Amazon / Pool Supply Online", product: "Generic lanthanum chloride phosphate remover", note: "Generic formulas available — compare lanthanum concentration per ounce. Brand products are often heavily marked up." }
          ],
          notes: "IMPORTANT application protocol: (1) Shut off pump or reduce to minimum flow. (2) Add slowly near return jets. (3) Run filter for 1 hour only. (4) BACKWASH or clean filter immediately — lanthanum creates a heavy white precipitate that clogs filters rapidly. Failure to backwash = complete filter blockage. Treat when phosphates exceed 500 ppb. High phosphates feed algae — eliminating them reduces chlorine demand.",
          incompatible: ["Do not add with pump at high speed — white cloud needs to settle into filter"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 9: Metal Sequestrants & Stain Prevention
    // -----------------------------------------------------------------------
    {
      id: "metals",
      label: "Metal Sequestrants & Stain Prevention",
      products: [
        {
          name: "Jack's Magic Blue Stuff",
          genericName: "Phosphonate-Based Metal Sequestrant",
          activeIngredient: "Phosphonic acid blend (sequestrant complex)",
          brands: [
            "Jack's Magic Blue Stuff",
            "Jack's Magic Pink Stuff (for copper/manganese)",
            "Jack's Magic Purple Stuff (for scale + metals)"
          ],
          alternatives: [
            { store: "Pool specialty / Amazon", product: "Jack's Magic is the industry standard — limited direct substitutes", note: "Industry preferred for a reason — most generic sequestrants don't perform as reliably on iron/manganese. Worth the cost." }
          ],
          notes: "Industry standard for metal sequestration. Use when source water has elevated iron, copper, or manganese, and when opening or after large water additions. Holds metals in solution so they can be filtered out rather than depositing as stains. Maintain weekly or monthly — sequestrants degrade over time and need replenishment. Different formulas (Blue/Pink/Purple) target different metal profiles — read the selector guide.",
          incompatible: ["No dangerous incompatibilities — but effectiveness is reduced below pH 7.2"]
        },
        {
          name: "Natural Chemistry Metal Free",
          genericName: "Chelating Agent / Metal Sequestrant",
          activeIngredient: "HEDP (hydroxyethylidene diphosphonic acid) based",
          brands: [
            "Natural Chemistry Metal Free",
            "BioGuard Metal Control",
            "In The Swim Metal Control",
            "Orenda CV-600"
          ],
          alternatives: [
            { store: "Amazon / Pool Supply", product: "HEDP-based metal sequestrant (generic)", note: "Generic HEDP sequestrants available at lower cost — verify active ingredient matches." }
          ],
          notes: "Good general-purpose metal sequestrant. Add at opening and after any large water additions. Regular monthly maintenance dose prevents metal staining buildup over a season. Most effective when pH is in range (7.4-7.6). Separate product from phosphate removers — metal sequestrants keep metals dissolved; phosphate removers remove phosphates from water.",
          incompatible: ["No hazardous incompatibilities"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 10: Water Clarifiers & Flocculants
    // -----------------------------------------------------------------------
    {
      id: "clarifiers",
      label: "Water Clarifiers & Flocculants",
      products: [
        {
          name: "Polyelectrolyte Clarifier (Weekly)",
          genericName: "Cationic Polyelectrolyte / Polyacrylamide",
          activeIngredient: "Polyaluminum chloride or cationic polymer",
          brands: [
            "BioGuard Polysheen",
            "HTH Super Clarifier",
            "Natural Chemistry Pool Perfect + PHOSfree",
            "Clorox Pool Clarifier",
            "In The Swim Water Clarifier"
          ],
          alternatives: [
            { store: "Walmart / Home Depot", product: "Clorox Pool & Spa Super Water Clarifier", note: "Good retail option. Same clarifier chemistry as pool store brands." }
          ],
          notes: "Clumps fine particles together (coagulation) so the filter can capture them. For mildly cloudy water or as a weekly maintenance product. Does NOT replace good filtration or chemistry balance — address root chemistry cause first. If water is cloudy from chemistry imbalance, fix the chemistry before adding clarifier.",
          incompatible: ["No dangerous incompatibilities"]
        },
        {
          name: "Flocculant (Pool Floc)",
          genericName: "Aluminum Sulfate / Alum",
          activeIngredient: "Aluminum Sulfate Al2(SO4)3 or polyaluminum chloride",
          brands: [
            "HTH Pool Flocculant",
            "In The Swim Pool Floc",
            "Clorox Pool Floc",
            "BioGuard Floc Out"
          ],
          alternatives: [
            { store: "Pool supply / water treatment supplier", product: "Alum (aluminum sulfate) granular — same as used in municipal water treatment", note: "Pool floc and water treatment alum are the same chemical. Agricultural/water treatment sources offer significantly lower pricing per pound." }
          ],
          notes: "SLAM-level clarifier — causes all suspended particles to drop rapidly to the pool floor as a visible cloud of sediment. Requires the pool to be still (pump off for 8-24 hours) while floc drops. Then vacuum ALL settled material to WASTE — do not send through filter. Run pump on WASTE setting, not filter. Expect to lose 1-3 inches of water. Not a routine product — for severe green water or post-algae cleanup.",
          incompatible: ["Do not add while pump is running at speed — defeats the settling action"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 11: Enzyme Treatments & Borate-Based Products
    // -----------------------------------------------------------------------
    {
      id: "enzymes",
      label: "Enzyme Treatments & pH Stabilizers",
      products: [
        {
          name: "Pool Perfect (Enzyme Treatment)",
          genericName: "Naturally-derived enzyme blend (lipase/protease)",
          activeIngredient: "Enzyme complex — lipase, protease, cellulase",
          brands: [
            "Natural Chemistry Pool Perfect",
            "Natural Chemistry Pool Perfect + PHOSfree (combo)",
            "BioGuard Pool Tonic",
            "Leisure Time Enzyme"
          ],
          alternatives: [
            { store: "Amazon / Pool Supply", product: "Generic enzyme pool treatment", note: "Generic enzyme products available — compare enzyme types on label. Natural Chemistry is the market leader for a reason — enzyme quality varies in generics." }
          ],
          notes: "Breaks down non-living organic waste — body oils, sunscreen, cosmetics, bird droppings — that accumulate in pool water and waterline tile. Reduces chlorine demand, prevents waterline ring buildup, and improves water clarity. Weekly maintenance dose (typically 4-8 oz per 10,000 gal) is more effective than infrequent large doses. Works gradually — noticeable improvement over 2-4 weeks.",
          incompatible: ["No dangerous incompatibilities — enzymes are biologically degraded by high chlorine, so add when FC is under 5 ppm for best efficacy"]
        },
        {
          name: "BioGuard Optimizer Plus (Borates)",
          genericName: "Sodium Tetraborate / Borate Salt",
          activeIngredient: "Sodium tetraborate 70%",
          brands: [
            "BioGuard Optimizer Plus",
            "ProTeam Supreme Plus",
            "Biolab Pool Perfect Booster",
            "TurboBoost"
          ],
          alternatives: [
            { store: "Pool supply / Amazon", product: "20 Mule Team Borax (household) — at 50 ppm, requires pH adjustment calculation", note: "Borax raises pH and borates simultaneously — requires muriatic acid to counteract pH rise. More complex than purpose-made pool borates but significantly cheaper. Look up the borate-from-Borax method online." }
          ],
          notes: "Maintains pool at 50 ppm borate, which provides three benefits: (1) stabilizes pH against drift, (2) water feels noticeably softer and silkier, (3) reduces algae growth and chlorine demand by ~15-20%. A one-time addition that persists all season unless water is diluted. Highly recommended for pools with chronic pH fluctuation problems.",
          incompatible: ["No dangerous incompatibilities"]
        }
      ]
    },

    // -----------------------------------------------------------------------
    // CATEGORY 12: Scale & Calcium Inhibitors
    // -----------------------------------------------------------------------
    {
      id: "scale",
      label: "Scale & Calcium Inhibitors",
      products: [
        {
          name: "Orenda SC-1000 Scale & Metal Control",
          genericName: "Chelant / Scale Inhibitor (HEDP-based)",
          activeIngredient: "HEDP + chelating agents blend",
          brands: [
            "Orenda SC-1000",
            "Orenda Technologies Scale Control"
          ],
          alternatives: [
            { store: "Pool specialty / Orenda distributor", product: "Orenda is specifically engineered for professional pool care — limited generic substitutes", note: "Popular with service tech professionals for its consistent results on scale-prone pools." }
          ],
          notes: "Professional-grade scale inhibitor favored by pool service technicians for its reliability on heater scale, salt cell calcium buildup, and waterline calcium deposits. Use at opening and monthly maintenance. Particularly valuable in high-CH areas or pools with aggressive water or high heat. Regular SC-1000 treatment significantly extends heater and salt cell life.",
          incompatible: ["No hazardous incompatibilities — compatible with all sanitizer types"]
        },
        {
          name: "Natural Chemistry Scale Free",
          genericName: "Polymaleic Acid Scale Inhibitor",
          activeIngredient: "Polymaleic acid (scale inhibitor polymer)",
          brands: [
            "Natural Chemistry Scale Free",
            "BioGuard Stain & Scale Control",
            "In The Swim Scale Remover & Preventer",
            "SeaKlear Scale Prevent & Remove"
          ],
          alternatives: [
            { store: "Amazon / Pool Supply", product: "Generic polymaleic acid scale inhibitor", note: "Generic formulas available from online pool suppliers at 30-50% savings — verify active ingredient." }
          ],
          notes: "Prevents and helps remove calcium scaling on pool surfaces, tile, heaters, and salt cells. Monthly maintenance dose (following opening treatment) is the most cost-effective approach — scaling is far harder to remove than to prevent. High-LSI water (high pH + high CH + high TA) requires consistent scale inhibitor use. Calculate LSI when in doubt.",
          incompatible: ["No hazardous incompatibilities"]
        }
      ]
    }

  ],  // end categories

  // -------------------------------------------------------------------------
  // Home Alternatives Quick Reference
  // -------------------------------------------------------------------------
  homeAlternatives: [
    {
      chemical: "Sodium Bicarbonate (TA Up / Alkalinity Up)",
      homeProduct: "Arm & Hammer Baking Soda",
      savings: "~$2.50/lb at pool store → $0.55/lb at Walmart. 100% identical chemical.",
      caution: "Must verify pure sodium bicarbonate — no additives. Large bags at Sam's Club are cheapest per pound."
    },
    {
      chemical: "Sodium Carbonate (pH Up / Soda Ash)",
      homeProduct: "Arm & Hammer Super Washing Soda",
      savings: "~$3/lb at pool store → $1/lb at Walmart. 100% identical.",
      caution: "Do NOT confuse with baking soda — different chemical, different effect. Box says 'Sodium Carbonate' not 'Sodium Bicarbonate'."
    },
    {
      chemical: "Muriatic Acid (pH Down)",
      homeProduct: "Muriatic Acid from Home Depot / Lowe's Concrete Section",
      savings: "20-50% cheaper than pool store. Identical product — same 31.45% concentration.",
      caution: "Same chemical — same safety precautions apply. Always dilute in water before adding to pool. Look in masonry/concrete aisle, not pool aisle."
    },
    {
      chemical: "Calcium Chloride (CH Up)",
      homeProduct: "DowFlake Xtra or any ice melt bag labeled 'Calcium Chloride'",
      savings: "Hardware store 50-lb bags are significantly cheaper than pool store per pound.",
      caution: "Verify label says Calcium Chloride specifically — NOT Rock Salt (NaCl) or Magnesium Chloride which do nothing for CH hardness."
    },
    {
      chemical: "Trichlor Tablets",
      homeProduct: "Sam's Club / Costco 3-lb or 35-lb bucket trichlor tabs",
      savings: "Bulk purchase saves 30-60% vs pool store per-tab pricing.",
      caution: "Same chemical — store properly in cool, dry place away from other chemicals. Never mix with other chlorine products."
    }
  ]

}; // end window.CHEM_CATALOG
