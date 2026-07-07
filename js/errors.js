// SplashLens Error Code Database
// Sources: Hayward, Pentair, Jandy official service manuals + tech bulletins
// Maytronics/Aiper: LED indicator patterns (no text codes on display)

window.ERROR_DB = {

  hayward: {
    label: "Hayward",
    color: "#1d4ed8",
    categories: {

      "H-Series Gas Heater": {
        models: ["H100FD","H150FD","H200FD","H250FD","H300FD","H350FD","H400FD","Universal H-Series","XE Series","H-Series Low NOx"],
        codes: [
          { code:"E01", name:"Ignition Failure",
            causes:["No gas supply / gas valve closed","Faulty igniter or ignition module","Dirty or corroded flame sensor","Gas pressure too low","Clogged burner orifices","Bad gas valve"],
            fix:["Check gas shutoff is open","Check gas pressure at manifold (should be 3.5\" WC natural gas, 10\" LP)","Clean flame sensor rod with fine steel wool","Inspect igniter gap (should be 1/8\")","Check for error E01 after holding reset — 3 strikes = lockout"],
            severity:"high", callpro:true },
          { code:"E02", name:"Thermostat Failed High",
            causes:["Sensor/thermostat stuck or shorted (reads temp too high)","Control board failure","Damaged temperature sensor wiring"],
            fix:["Check wiring harness connections to temp sensors","Test thermostat resistance (should read ~10kΩ at room temp)","Replace thermostat if reading out of range"],
            severity:"high", callpro:true },
          { code:"E03", name:"Thermostat Failed Low",
            causes:["Temp sensor open circuit (reads too low)","Damaged sensor wiring","Defective control board"],
            fix:["Inspect sensor connector at control board","Check sensor wire continuity","Replace sensor if resistance reads infinite (open)"],
            severity:"medium", callpro:true },
          { code:"E04", name:"High Limit Fault",
            causes:["Low or no water flow","Dirty or clogged filter (check pressure)","Closed valves restricting flow","Pump not running or losing prime","Scale buildup in heat exchanger","High limit switch failed"],
            fix:["Verify pump is running and primed","Check filter pressure (clean if >10 PSI above normal)","Open all water valves fully","Backwash filter","Check for air in system","Test high limit switch continuity"],
            severity:"high", callpro:false },
          { code:"E05", name:"Pressure Switch Open",
            causes:["Insufficient water flow","Pressure switch failed or stuck open","Air in the system","Pump losing prime","Clogged filter"],
            fix:["Ensure pump is running strong — listen for cavitation","Check filter pressure and clean if needed","Verify all valves are open","Bleed air from system","Jumper pressure switch to test if switch is faulty (professional only)","Replace pressure switch if flow is confirmed good"],
            severity:"high", callpro:false },
          { code:"E06", name:"Stack Flue Overheat",
            causes:["Blocked flue or exhaust","Recirculating flue gases (bad location / near wall)","Combustion air starvation","Dirty burners"],
            fix:["Clear any debris from flue outlet","Check minimum clearances to walls/enclosures","Inspect burners for carbon buildup","Ensure adequate combustion air supply"],
            severity:"high", callpro:true },
          { code:"E07", name:"Gas Valve Error",
            causes:["Gas valve not responding to control board","Bad gas valve coil","Wiring fault to gas valve"],
            fix:["Check 24V at gas valve terminals during call for heat","Test gas valve coil resistance (~20–40Ω)","Replace gas valve if coil reads open or shorted"],
            severity:"high", callpro:true },
          { code:"BD", name:"Bad Display / Communication Error",
            causes:["Loose display wiring connector","Moisture in display connector","Control board fault","Display board failure"],
            fix:["Disconnect and reconnect the display cable at both ends","Check for corrosion or moisture on connector pins","If fault persists, replace display board"],
            severity:"medium", callpro:false },
          { code:"SF", name:"Service Filter",
            causes:["Filter pressure too high (dirty filter)","Pressure differential switch triggered"],
            fix:["Backwash sand/DE filter or clean cartridge","Reset by cleaning filter — code clears automatically","If code persists after cleaning, check pressure switch calibration"],
            severity:"low", callpro:false },
          { code:"AGS", name:"Automatic Gas Shutoff",
            causes:["Heater was inactive for extended period (safety feature)","Pilot mode / vacation mode activated"],
            fix:["Press 'Pool' or 'Spa' button to restart","Check if unit is in AGS/Vacation mode in settings","Normal operation — not a fault"],
            severity:"low", callpro:false },
          { code:"HI", name:"Water Temperature High",
            causes:["Pool water already at or above set point","Thermostat overshot","High ambient temperature affecting sensor reading"],
            fix:["Normal — heater shut off at target temp","Lower set point if desired","If temp is NOT actually high, check temperature sensor"],
            severity:"low", callpro:false },
          { code:"LO", name:"Water Temperature Low / Low Ambient",
            causes:["Ambient temperature too low for safe operation","Water temp below 40°F operating floor","Sensor reading error"],
            fix:["Wait for ambient temp to rise above 40°F","Check sensor wiring if temp is normal but code persists","For heat pumps: normal if ambient is below 50°F"],
            severity:"low", callpro:false }
        ]
      },

      "HeatPro Heat Pump": {
        models:["HeatPro 50K","HeatPro 95K","HeatPro 110K","HeatPro 140K","HP31104T","HP31105T","HP21004T"],
        codes:[
          { code:"LO", name:"Low Pressure / Low Ambient",
            causes:["Ambient air temperature below 50°F (normal cutoff)","Low refrigerant charge","Dirty evaporator coil (reduced airflow)","Refrigerant leak"],
            fix:["Check ambient temp — below 50°F is normal shutdown","Clean evaporator coil fins with garden hose (spray outward)","If ambient is warm and code persists: refrigerant issue — call HVAC tech"],
            severity:"medium", callpro:true },
          { code:"HI", name:"High Discharge Pressure",
            causes:["High ambient temperature (above 105°F)","Dirty condenser coil (evaporator)","Low water flow through heat exchanger","Refrigerant overcharge"],
            fix:["Clean evaporator coil fins","Check water flow rate through heat pump (need min 20 GPM)","Ensure no restrictions on water side unions","Normal above 105°F ambient — wait for cooler conditions"],
            severity:"high", callpro:true },
          { code:"FLO", name:"Flow Error / No Water Flow",
            causes:["Pump not running","Flow switch failed","Insufficient flow (< 20 GPM typically)","Closed valves","Dirty filter","Air in system"],
            fix:["Verify pump is running and primed","Check all valves are open","Clean filter","Minimum flow rate per spec sheet","Test flow switch continuity","Bypass flow switch temporarily to diagnose (pro only)"],
            severity:"high", callpro:false },
          { code:"LP", name:"Low Pressure Switch Tripped",
            causes:["Low refrigerant pressure","Refrigerant leak","Restriction in refrigerant circuit"],
            fix:["Do not add refrigerant without finding the leak first","Call licensed HVAC technician — this is a sealed system fault"],
            severity:"high", callpro:true },
          { code:"HP", name:"High Pressure Switch Tripped",
            causes:["Dirty evaporator coil","High ambient temp","Water side flow restriction","Refrigerant overcharge"],
            fix:["Clean evaporator coils","Check water flow","High ambient is normal — unit will restart when conditions improve","Call HVAC tech if persists after cleaning"],
            severity:"high", callpro:true },
          { code:"HH", name:"High Head Pressure",
            causes:["Extremely dirty evaporator coil","Very high ambient temperature","Refrigerant overcharge"],
            fix:["Thoroughly clean evaporator coil","Check ambient temp (>105°F normal shutdown)","HVAC tech needed if coil is clean and temp is normal"],
            severity:"high", callpro:true }
        ]
      },

      "TriStar / Super Pump VS": {
        models:["TriStar VS 1.85HP","EcoStar VS","Super Pump VS","MaxFlo VS","EcoStar SVRS"],
        codes:[
          { code:"OVER CURRENT", name:"Motor Over Current",
            causes:["Impeller clogged with debris","Motor bearings failing","Voltage too low","Running at RPM too high for restriction in system"],
            fix:["Remove pump basket and clear debris","Check impeller — remove pump and clear any blockage","Verify voltage at motor terminals matches nameplate","Lower max RPM setting if plumbing is undersized"],
            severity:"high", callpro:false },
          { code:"PRIMING", name:"Pump Not Priming",
            causes:["Low water level","Air leak in suction line","Closed suction valve","Debris clog at skimmer or main drain"],
            fix:["Check pool water level (must cover skimmer)","Inspect suction side fittings and unions for air leaks","Open suction valves fully","Clear skimmer basket and main drain"],
            severity:"medium", callpro:false },
          { code:"DRIVE TEMP", name:"Drive Temperature Fault",
            causes:["Pump running in enclosed space with no airflow","Ambient temperature too high","Drive cooling fan failure"],
            fix:["Ensure pump has adequate ventilation clearance","Pump must not be in sealed enclosure without airflow","Check cooling fan on drive — replace if not spinning"],
            severity:"high", callpro:false }
        ]
      }
    }
  },

  pentair: {
    label: "Pentair",
    color: "#0369a1",
    categories: {

      "MasterTemp / Max-E-Therm Gas Heater": {
        models:["MasterTemp 125","MasterTemp 175","MasterTemp 250","MasterTemp 300","MasterTemp 400","Max-E-Therm 125","Max-E-Therm 175","Max-E-Therm 250","Max-E-Therm 300","Max-E-Therm 400"],
        codes:[
          { code:"E01", name:"Ignition Failure",
            causes:["No gas supply","Gas valve not opening","Faulty hot surface igniter (HSI)","Dirty or failed flame sensor","Low gas pressure"],
            fix:["Check gas shutoff valve is open","Verify gas pressure (3.5\" WC natural, 10\" LP at manifold)","Inspect HSI element — should glow orange, replace if cracked","Clean flame rod with emery cloth","Check for multiple ignition lockout (will require manual reset)"],
            severity:"high", callpro:true },
          { code:"E02", name:"High Temperature Limit",
            causes:["Inadequate water flow","Dirty filter","Hi-limit switch tripped","Scale buildup in heat exchanger"],
            fix:["Check pump running and flow rate","Clean or backwash filter","Open all return valves fully","Allow heater to cool 15 minutes before reset","Inspect heat exchanger for scale buildup"],
            severity:"high", callpro:false },
          { code:"E03", name:"Pressure Switch Open",
            causes:["Low water flow","Pump not running","Closed valves","Filter pressure too high","Pressure switch malfunction"],
            fix:["Confirm pump is operating","Open all water valves fully","Clean or backwash filter","Check and clean pump basket","Test pressure switch — verify 24V signal when flow present"],
            severity:"high", callpro:false },
          { code:"E04", name:"Ignition Lockout",
            causes:["Three consecutive ignition failures triggered safety lockout","Same causes as E01"],
            fix:["Wait 1 hour for automatic retry OR press reset","If E01 kept recurring, diagnose gas/igniter before reset","Manual reset: hold 'Mode' button 5 seconds on some models"],
            severity:"high", callpro:true },
          { code:"E05", name:"Stack Flue Temperature Fault",
            causes:["Blocked or restricted flue exhaust","Recirculating combustion gases","Combustion air restriction","Dirty burner"],
            fix:["Clear any debris or nest from flue outlet","Check clearances per installation manual","Inspect burner tray for carbon / debris","Ensure adequate combustion air — sealed equipment rooms need air vents"],
            severity:"high", callpro:true },
          { code:"E06", name:"Sensor Failure",
            causes:["Temperature sensor (thermistor) failed open or short","Damaged sensor wiring","Moisture in control panel"],
            fix:["Check thermistor resistance — should be ~10kΩ at 25°C (77°F)","Inspect wiring harness for pinch or corrosion","Replace thermistor if out of spec","Check for moisture ingress in control compartment"],
            severity:"medium", callpro:true },
          { code:"E07", name:"High Limit Fault",
            causes:["Water temperature exceeded high limit switch setting (typically 135°F)","Hi-limit switch failed closed or open","Same flow issues as E02"],
            fix:["Allow unit to cool completely (20-30 minutes)","Check water flow before resetting","Test hi-limit switch resistance (should be closed/zero Ω when cool)","Replace hi-limit switch if faulty","Do NOT bypass — safety device"],
            severity:"high", callpro:true },
          { code:"BD", name:"Bad Display Connection",
            causes:["Display cable loose or disconnected","Moisture on display connector","Failed display board or control board"],
            fix:["Check display cable at both ends — disconnect/reconnect","Inspect for corrosion or moisture on connector","Try replacing display board first (cheaper) before control board"],
            severity:"medium", callpro:false },
          { code:"SF", name:"Service Filter",
            causes:["Filter differential pressure too high","Dirty filter cartridge, sand, or DE grids"],
            fix:["Backwash sand or DE filter","Clean cartridge filter","Reset is automatic after filter service","If code persists: check pressure switch calibration"],
            severity:"low", callpro:false },
          { code:"LO", name:"Low Temperature Cutoff",
            causes:["Ambient temperature below minimum operating temp","Sensor reading low","Normal cold-weather shutdown"],
            fix:["Normal below 40°F ambient","Check temperature sensor if ambient is warm and code persists"],
            severity:"low", callpro:false },
          { code:"HI", name:"High Temperature — Setpoint Reached",
            causes:["Water reached desired setpoint","Normal operation"],
            fix:["Normal shutdown — not an error","If pool is too hot, lower setpoint"],
            severity:"low", callpro:false }
        ]
      },

      "UltraTemp Heat Pump": {
        models:["UltraTemp 70","UltraTemp 90","UltraTemp 110","UltraTemp 120","UltraTemp 140"],
        codes:[
          { code:"LO TEMP", name:"Low Ambient Temperature",
            causes:["Air temperature below minimum operating range (~45°F)","Normal cold-weather shutdown"],
            fix:["Wait for ambient temperature to rise above 45°F","Normal operation — unit will restart automatically"],
            severity:"low", callpro:false },
          { code:"HIGH PRESS", name:"High Refrigerant Pressure",
            causes:["Dirty evaporator coil (reduced airflow)","High ambient temperature","Water flow restriction","Refrigerant overcharge"],
            fix:["Clean evaporator coil fins with garden hose","Check water flow — minimum GPM per spec","Call HVAC tech if coil clean and temps normal"],
            severity:"high", callpro:true },
          { code:"LOW PRESS", name:"Low Refrigerant Pressure",
            causes:["Low refrigerant — possible leak","Restriction in refrigerant circuit","Extremely low ambient temp"],
            fix:["Do not add refrigerant without finding leak","Call licensed HVAC/refrigeration technician"],
            severity:"high", callpro:true },
          { code:"FLOW", name:"Water Flow Error",
            causes:["Pump not running","Flow switch failure","Low water flow rate","Closed or restricted valves"],
            fix:["Verify pump running at adequate speed","Open all suction and return valves","Check and clean filter","Test flow switch","Min flow rate per model spec (typically 20-30 GPM)"],
            severity:"high", callpro:false }
        ]
      },

      "IntelliFlo VSF Pump": {
        models:["IntelliFlo VSF 3HP","IntelliFlo VS 3HP","IntelliFlo VS+SVRS","IntelliFlo i2","IntelliFlo3 VSF"],
        codes:[
          { code:"PRIMING", name:"Pump Not Priming",
            causes:["Air in suction line","Low pool water level","Closed suction valves","Debris blocking impeller"],
            fix:["Check water level at skimmer","Open suction valves","Check for air leaks at unions and lid O-ring","Remove pump lid and check for debris at impeller"],
            severity:"medium", callpro:false },
          { code:"ALARM 0001", name:"Undercurrent — No Flow Detected",
            causes:["Impeller blocked","Suction side closed","Low speed too low for priming"],
            fix:["Check for debris at impeller","Open suction valves","Increase minimum RPM to ensure priming"],
            severity:"medium", callpro:false },
          { code:"ALARM 0002", name:"Overcurrent — Motor Drawing Too Much Current",
            causes:["Impeller jammed with debris","Bearings failing","Voltage too low or high","RPM set too high for system"],
            fix:["Remove debris from impeller (remove pump lid and basket)","Check supply voltage — should match motor nameplate","Lower max RPM","If bearings: motor replacement needed"],
            severity:"high", callpro:false },
          { code:"ALARM 0003", name:"Overvoltage",
            causes:["Supply voltage too high","Lightning surge","GFCI or wiring issue"],
            fix:["Check supply voltage at motor terminals","Verify correct voltage for motor (115V or 230V)","Check GFCI breaker"],
            severity:"high", callpro:true },
          { code:"ALARM 0004", name:"Drive Temperature High",
            causes:["Inadequate airflow around pump","Pump in sealed enclosure","High ambient temperature"],
            fix:["Ensure minimum clearance around pump (6\" all sides)","Do not enclose pump without ventilation","Lower max RPM temporarily to reduce heat"],
            severity:"high", callpro:false }
        ]
      }
    }
  },

  jandy: {
    label: "Jandy / Zodiac",
    color: "#059669",
    categories: {

      "LXi / LRZ Gas Heater": {
        models:["LXi 125","LXi 175","LXi 250","LXi 325","LXi 400","LRZ125","LRZ175","LRZ250","LRZ325","LRZ400"],
        codes:[
          { code:"E01", name:"Ignition Failure",
            causes:["No gas","Gas valve fault","Igniter fault","Flame sensor dirty"],
            fix:["Verify gas supply and pressure","Check igniter — glow should appear orange during startup","Clean flame sensor","Check gas valve opens (24V to valve coil during call)"],
            severity:"high", callpro:true },
          { code:"E02", name:"High Limit",
            causes:["Inadequate water flow","Dirty filter","High limit switch tripped","Sensor wiring issue"],
            fix:["Check pump flow","Clean filter","Allow to cool and reset","Check all valves open"],
            severity:"high", callpro:false },
          { code:"E03", name:"Pressure / Flow Switch Open",
            causes:["Low water flow","Pump not running or losing prime","Pressure switch failure"],
            fix:["Verify pump operation","Open all valves","Check filter pressure","Test flow switch"],
            severity:"high", callpro:false },
          { code:"E04", name:"Sensor Fault",
            causes:["Water temperature sensor failed","Sensor wiring damaged","Moisture in electronics"],
            fix:["Test sensor resistance (~10kΩ at room temp)","Check wiring continuity","Replace sensor if out of spec"],
            severity:"medium", callpro:true },
          { code:"E05", name:"Flue / Stack Fault",
            causes:["Blocked flue","Combustion air issue","Dirty burner"],
            fix:["Clear flue obstruction","Check installation clearances","Clean burner tray"],
            severity:"high", callpro:true },
          { code:"SFS", name:"Service Filter Switch",
            causes:["Dirty filter — pressure differential too high"],
            fix:["Backwash sand/DE filter or clean cartridge","Code clears when filter is serviced"],
            severity:"low", callpro:false },
          { code:"AGS", name:"Auto Gas Shutoff",
            causes:["Heater idle for extended period (safety feature)"],
            fix:["Press any mode button to restart — normal safety feature"],
            severity:"low", callpro:false },
          { code:"SNSR", name:"Sensor Error",
            causes:["Temperature sensor open or shorted"],
            fix:["Test sensor resistance — should be ~10kΩ at 77°F","Replace if reading open (∞) or shorted (<100Ω)"],
            severity:"medium", callpro:true }
        ]
      },

      "VS FloPro Pump": {
        models:["VS FloPro 1.85HP","VSFHP185","FloPro VS"],
        codes:[
          { code:"ALARM", name:"General Alarm",
            causes:["Check display for sub-code or description","Motor, drive, or flow issue"],
            fix:["Read sub-display for specific fault","Common: overcurrent (debris), priming (air leak), drive temp (ventilation)"],
            severity:"medium", callpro:false },
          { code:"PRIMING", name:"Pump Not Priming",
            causes:["Air in suction line","Low water level","Closed valves","Blocked suction"],
            fix:["Check water level and suction line","Open all valves","Check for air leaks"],
            severity:"medium", callpro:false }
        ]
      },

      "JXi Gas Heater": {
        models:["JXi 150","JXi 200","JXi 260","JXi 340","JXi 400","JXi 150N","JXi 200N","JXi 260N","JXi 340N","JXi 400N"],
        codes:[
          { code:"E01", name:"Ignition Failure",
            causes:["Gas supply off or too low","Faulty hot surface igniter (HSI)","Dirty flame sensor","Gas valve not opening","Flue backpressure (installation clearance issue)"],
            fix:["Verify gas shutoff valve is open","Check manifold gas pressure (3.5\" WC natural, 10\" LP)","Inspect HSI — should glow bright orange, replace if cracked or dim","Clean flame rod with fine emery cloth","Check flue clearance from walls — minimum per install manual","JXi auto-retries 3x then locks out; hold MODE to reset lockout"],
            severity:"high", callpro:true },
          { code:"E02", name:"High Limit Fault",
            causes:["Insufficient water flow to heat exchanger","Filter pressure high / dirty filter","Closed valves restricting flow","High limit switch tripped or failed","Scale in heat exchanger tubes"],
            fix:["Verify pump running at adequate flow rate","Backwash or clean filter","Open all return valves fully","Allow 15-minute cooldown before reset","Inspect heat exchanger for scale; descale if flow history shows inadequate water treatment"],
            severity:"high", callpro:false },
          { code:"E03", name:"Pressure / Flow Switch Fault",
            causes:["Pump not running or losing prime","Low water level","Closed suction valve","Clogged pump basket or impeller","Pressure switch failure"],
            fix:["Confirm pump is running and primed","Check skimmer water level","Open all suction valves","Clean pump basket and inspect impeller","Test pressure switch — should close with adequate flow; replace if stuck open"],
            severity:"high", callpro:false },
          { code:"E04", name:"Water Temperature Sensor Fault",
            causes:["Water temp sensor (thermistor) failed open or shorted","Corroded sensor wiring connector","Moisture in control board connector"],
            fix:["Test sensor resistance — JXi sensor reads ~10kΩ at 77°F (25°C)","Check sensor wiring harness connector for green corrosion","Replace sensor if resistance is infinite (open) or near zero (short)"],
            severity:"medium", callpro:true },
          { code:"E05", name:"Stack / Flue Temperature Fault",
            causes:["Blocked or restricted flue exhaust","Recirculating combustion gases (wind, enclosure)","Insufficient combustion air","Dirty burner tray"],
            fix:["Clear any obstruction from flue outlet","Verify minimum clearances to walls and roof (per install guide)","Inspect burner tray for debris and carbon buildup","Ensure combustion air supply — sealed rooms require dedicated air vent"],
            severity:"high", callpro:true },
          { code:"E06", name:"Gas Valve Fault",
            causes:["Gas valve coil open or shorted","24V not reaching gas valve","Gas valve failed mechanically closed"],
            fix:["Measure 24VAC at gas valve terminals during startup — no voltage = control board issue","Test gas valve coil resistance (typically 20–50Ω) — open or shorted = replace valve","Do not bypass gas valve"],
            severity:"high", callpro:true },
          { code:"E07", name:"Communication / Board Fault",
            causes:["Control board failure","Display cable loose","Moisture ingress on board"],
            fix:["Check display ribbon cable at both connectors","Inspect control board for burn marks or moisture","If board appears clean: replace control board"],
            severity:"high", callpro:true },
          { code:"SFS", name:"Service Filter Switch",
            causes:["Filter differential pressure too high (dirty filter)"],
            fix:["Backwash sand/DE filter or clean cartridge","Code resets automatically after filter service"],
            severity:"low", callpro:false },
          { code:"AGS", name:"Auto Gas Shutoff",
            causes:["Heater idle for extended period — normal safety timeout"],
            fix:["Press MODE to restart — this is a normal safety feature, not a fault"],
            severity:"low", callpro:false },
          { code:"SNSR", name:"Sensor Error",
            causes:["Water temperature sensor failed open or shorted","Wiring harness fault"],
            fix:["Test thermistor resistance (~10kΩ at 77°F)","Inspect and re-seat wiring connector at control board","Replace sensor if out of spec"],
            severity:"medium", callpro:true },
          { code:"LOC", name:"Service Lockout Active",
            causes:["Multiple fault trips locked out the heater","Prior fault was not resolved before reset"],
            fix:["Diagnose and repair the underlying fault first","Reset lockout: hold MODE button for 5 seconds on most JXi models","Unit will not restart until root cause is fixed"],
            severity:"high", callpro:true },
          { code:"HLS", name:"High Limit Switch",
            causes:["Water temperature exceeded high limit (typically 135°F)","High limit switch failed","Same flow restriction causes as E02"],
            fix:["Allow full cooldown (20-30 min) before reset","Verify water flow before restarting","Test HLS switch resistance — should read 0Ω when cool; replace if open"],
            severity:"high", callpro:true }
        ]
      },

      "iAqualink Automation": {
        models:["iAqualink 2.0","iAqualink 3.0","iAqualink RS","AquaLink RS"],
        codes:[
          { code:"No Comms", name:"Communication Loss",
            causes:["RS-485 data cable wiring fault","Incorrect DIP switch addresses","Power issue at controller","Sub-panel or ancillary board offline"],
            fix:["Check RS-485 data cable from main board to sub-panels — verify wire order","Inspect DIP switch addresses on all sub-panels (must be unique, must match programming)","Cycle power to controller and all sub-panels","Check all terminal block wire connections for loose strands"],
            severity:"high", callpro:true },
          { code:"Offline in app", name:"iAqualink Offline",
            causes:["Wi-Fi password changed","Router IP changed","iAqualink module lost network","DHCP lease expired"],
            fix:["Re-connect iAqualink to Wi-Fi via iAqualink app (Add Device flow)","Assign static IP to iAqualink in router","Check iAqualink module LED status — solid green = connected, blinking = connecting, red = fault","Power cycle the iAqualink module"],
            severity:"medium", callpro:false },
          { code:"Freeze Protection On", name:"Freeze Protection Active",
            causes:["Air temperature sensor below freeze threshold","Normal freeze protection activation"],
            fix:["Normal system behavior — all equipment runs until temp rises above threshold","Do NOT override or disable freeze protection during freezing weather","Verify freeze sensor is installed correctly (in shade, not in sun)"],
            severity:"low", callpro:false }
        ]
      }
    }
  },

  maytronics: {
    label: "Maytronics (Dolphin)",
    color: "#7c3aed",
    categories: {

      "Dolphin Robot Cleaners": {
        models:["Dolphin Nautilus CC","Dolphin Nautilus CC Plus","Dolphin M600","Dolphin S300i","Dolphin Sigma","Dolphin Active 20","Dolphin Premier","Dolphin Active 30i"],
        note:"Maytronics uses LED indicator patterns — no text codes on display. Match your indicator lights below.",
        codes:[
          { code:"LED: Solid Red", name:"Motor/Drive Fault",
            causes:["Motor shaft jammed (tangled cable or debris)","Drive board failure","Impeller blocked"],
            fix:["Remove robot from pool","Check for tangled cable around roller brushes","Clear any debris from impeller","Reset by unplugging 30 seconds","If persists: drive board replacement"],
            severity:"high", callpro:false },
          { code:"LED: Blinking Red (slow)", name:"Low Water Temperature",
            causes:["Water temperature below operating minimum (~41°F)","Normal cold-water protection"],
            fix:["Wait for water temp to rise above 41°F","Normal — not a fault"],
            severity:"low", callpro:false },
          { code:"LED: Blinking Red (fast)", name:"Communication / Connectivity Fault",
            causes:["App communication issue","Cable fault","Power supply issue"],
            fix:["Unplug and replug power supply","Restart the MyDolphin+ app and reconnect","Check cable for damage or kinking","Test with a different power supply if available"],
            severity:"medium", callpro:false },
          { code:"LED: Red + Blue alternating", name:"Charging / Power Supply Issue",
            causes:["Power supply fault","Incorrect power supply voltage","Internal battery issue"],
            fix:["Check power supply output voltage matches robot spec","Use only OEM Maytronics power supply","If power supply confirmed good: internal fault, contact Maytronics"],
            severity:"high", callpro:true },
          { code:"LED: Solid Blue", name:"Normal Operation",
            causes:["Robot is running normally"],
            fix:["No action needed"],
            severity:"low", callpro:false },
          { code:"LED: Blinking Blue", name:"Cycle Complete",
            causes:["Cleaning cycle finished — normal"],
            fix:["Remove from pool and clean filter basket/cartridge"],
            severity:"low", callpro:false },
          { code:"No LED / Won't Start", name:"No Power",
            causes:["GFCI outlet tripped","Power supply failure","Faulty connection at swivel","Float cable damage"],
            fix:["Test GFCI outlet — press reset button on outlet","Inspect cable for cuts or damage (especially at swivel)","Test power supply output with multimeter","Check for corrosion at cable connections"],
            severity:"high", callpro:false }
        ]
      }
    }
  },

  aiper: {
    label: "Aiper",
    color: "#0891b2",
    categories: {

      "Aiper Robot Cleaners": {
        models:["Seagull Pro","Seagull Plus","Scuba S1","Scuba E1","Scuba N1","Surfer 1","Surfer M1","Smart 30 Pro","HJ2111"],
        note:"Aiper uses LED indicator patterns. Indicator behavior varies by model — check model-specific manual. Common patterns below.",
        codes:[
          { code:"LED: Blinking Red (3×)", name:"Motor Blocked / Impeller Jam",
            causes:["Debris wrapped around brushes or impeller","Wheel/brush locked"],
            fix:["Remove from pool","Clear debris from brushes, tracks, and impeller","Check suction intake for blockage","Reset by holding power button 3 seconds"],
            severity:"medium", callpro:false },
          { code:"LED: Blinking Red (continuous)", name:"Cliff Detection Error",
            causes:["Robot stuck on stairs or ledge","Sensor dirty","Slope too steep"],
            fix:["Place robot on flat pool floor away from steps","Clean cliff detection sensors on underside","If pool has unusual geometry, check compatibility"],
            severity:"low", callpro:false },
          { code:"LED: Red solid", name:"General Fault / Motor Error",
            causes:["Internal motor issue","Communication failure between motor and controller","Overheating"],
            fix:["Remove from pool and let cool 15 minutes","Unplug from charging station","Clear any debris from all rotating parts","If persists after reset: contact Aiper support"],
            severity:"high", callpro:true },
          { code:"No power / won't charge", name:"Charging Fault",
            causes:["Charging dock contacts corroded or misaligned","Battery aged (battery life ~2-3 years)","Charging cable damaged"],
            fix:["Clean charging dock contacts with dry cloth","Ensure robot is properly seated on dock","Check charging cable for damage","If battery won't hold charge: replacement battery needed"],
            severity:"medium", callpro:false },
          { code:"LED: Blue blinking (Seagull Pro)", name:"Cycle Complete",
            causes:["Normal — cleaning cycle finished"],
            fix:["Remove robot, clean filter basket, rinse robot"],
            severity:"low", callpro:false }
        ]
      }
    }
  },

  raypak: {
    label: "Raypak",
    color: "#dc2626",
    categories: {
      "Raypak Gas Heater": {
        models:["Raypak 106A","Raypak 156A","Raypak 206A","Raypak 266A","Raypak 336A","Raypak 406A","Raypak Digital","RP2100","RP2350"],
        codes:[
          { code:"E1", name:"Ignition Failure / Lockout",
            causes:["Gas supply issue","Failed igniter","Faulty gas valve","Low gas pressure"],
            fix:["Check gas supply and pressure","Inspect igniter element (hot surface igniter)","Check gas valve operation","Manual reset: hold 'Reset' button"],
            severity:"high", callpro:true },
          { code:"E2", name:"High Limit",
            causes:["Low water flow","Dirty filter","Hi-limit switch tripped"],
            fix:["Check pump and flow","Clean filter","Allow to cool and reset"],
            severity:"high", callpro:false },
          { code:"E3", name:"Pressure Switch Open",
            causes:["Low water flow","Pressure switch failure","Air in system"],
            fix:["Verify pump running","Open all valves","Clear filter","Test pressure switch"],
            severity:"high", callpro:false },
          { code:"E4", name:"Temperature Sensor Fault",
            causes:["Sensor open or shorted","Damaged wiring"],
            fix:["Test sensor resistance (~10kΩ at 77°F)","Replace if out of spec"],
            severity:"medium", callpro:true },
          { code:"E5", name:"Venter / Flue Fault (induced draft models)",
            causes:["Flue blocked","Venter motor failure","Pressure switch in venter circuit"],
            fix:["Check flue for obstruction","Test venter motor (should spin freely)","Check pressure tubing to venter switch for blockage"],
            severity:"high", callpro:true }
        ]
      }
    }
  },

  beatbot: {
    label: "Beatbot",
    color: "#f59e0b",
    categories: {
      "Beatbot Robot Cleaners": {
        models:["AquaSense","AquaSense 2","AquaSense Pro","AquaSense S2","iSkim Ultra"],
        note:"Beatbot robots use LED indicator patterns for physical units; app-connected models (AquaSense Pro, AquaSense S2) also show alphanumeric error codes in the Beatbot app.",
        codes:[
          { code:"LED: Solid Red", name:"Motor Blocked / Impeller Jam",
            causes:["Debris wrapped around impeller or brushes","Drive wheel obstructed","Robot caught on drain cover or obstacle"],
            fix:["Remove robot from pool immediately","Clear all debris from impeller, brushes, and drive wheels","Check suction inlet for blockage","Reset by unplugging for 30 seconds and restarting","If impeller is visibly jammed, gently rotate by hand to free"],
            severity:"high", callpro:false },
          { code:"LED: Blinking Red", name:"Cliff Detection or Water Entry Error",
            causes:["Robot detected pool edge, stairs, or abrupt ledge","Water ingress into electronics compartment (waterproofing breach)","Cliff sensor dirty or obscured"],
            fix:["Place robot on flat pool floor away from steps or ledges","Clean cliff detection sensors on underside with soft cloth","Inspect seals and gaskets for damage if water ingress is suspected","Do not run robot on pools with steep or non-standard geometry without checking compatibility"],
            severity:"medium", callpro:false },
          { code:"LED: Red + White alternating", name:"Low Battery / Charging Error",
            causes:["Battery charge critically low","Charging contacts corroded or misaligned","Charging cable or power supply fault","Battery aged or capacity degraded"],
            fix:["Return robot to charging dock immediately","Clean charging contacts on both robot and dock with dry cloth","Ensure robot is fully seated on dock","Inspect charging cable for damage","If battery will not charge after 4 hours, battery replacement may be needed"],
            severity:"medium", callpro:false },
          { code:"No power / won't start", name:"No Power",
            causes:["GFCI outlet tripped","Power supply failed","Float cable damaged","Charging dock fault","Battery fully depleted (not charged before first use)"],
            fix:["Press reset button on GFCI outlet and test outlet with another device","Inspect float cable for cuts or pinches","Verify power supply output with multimeter if available","Charge robot fully before first use (4+ hours)","Try a different outlet on a different circuit"],
            severity:"high", callpro:false },
          { code:"E01", name:"Brush Motor Overload",
            causes:["Brush roller jammed with hair, string, or debris","Brush roller bearing worn or seized","Brush drive belt broken or slipped"],
            fix:["Remove robot and clear all debris from brush roller","Check brush roller for free rotation — it should spin easily by hand","Inspect brush drive belt condition and seating","Reset via app: Settings > Reset Robot, or unplug for 60 seconds"],
            severity:"medium", callpro:false },
          { code:"E02", name:"Drive Motor Fault",
            causes:["Drive motor overheated","Debris jammed in drive wheel or track","Drive motor bearing failure","Internal drive board fault"],
            fix:["Remove robot from pool and let cool 20 minutes","Clear all debris from drive wheels and tracks","Attempt restart — if E02 returns immediately, drive motor or board needs service","Contact Beatbot support — drive motor replacement is typically required"],
            severity:"high", callpro:true },
          { code:"E03", name:"Pump Motor Fault",
            causes:["Suction impeller blocked (leaves, large debris)","Pump motor overload from running dry","Internal pump fault"],
            fix:["Remove and clean debris tray and suction inlet thoroughly","Check impeller for obstruction — clear any blockage","Do not run robot outside of water (pump runs dry and overheats)","If E03 returns after cleaning, pump motor service needed"],
            severity:"high", callpro:true },
          { code:"E05", name:"Charging Fault",
            causes:["Charging dock contacts corroded or bent","Power supply output out of spec","Battery management system (BMS) fault","Ambient temperature too cold for charging (<40°F)"],
            fix:["Clean charging contacts with isopropyl alcohol","Allow robot to warm to room temperature before charging if stored in cold","Test with a known-good power supply","If charging fault persists after contact cleaning: contact Beatbot support for BMS evaluation"],
            severity:"medium", callpro:false },
          { code:"E07", name:"Communication Loss (Wi-Fi / App Disconnected)",
            causes:["Wi-Fi network changed (SSID or password)","Robot out of Wi-Fi range during setup","App needs update","Router firewall blocking device communication","Robot firmware needs update"],
            fix:["Re-pair robot via Beatbot app: Settings > Add Device","Ensure 2.4 GHz Wi-Fi band is available (not 5 GHz only)","Update Beatbot app to latest version","Move router closer or add Wi-Fi extender near pool area","Check that router is not blocking local device communication"],
            severity:"low", callpro:false },
          { code:"LED: Solid Blue", name:"Normal Operation",
            causes:["Robot is running a cleaning cycle normally"],
            fix:["No action needed — robot is operating correctly"],
            severity:"low", callpro:false },
          { code:"LED: Blinking Blue", name:"Cycle Complete",
            causes:["Cleaning cycle has finished — normal end-of-cycle indicator"],
            fix:["Remove robot from pool","Open debris tray and empty collected debris","Rinse filter and tray with garden hose","Allow robot to dry before next use or storage"],
            severity:"low", callpro:false },
          { code:"App: Filter Full", name:"Debris Tray Full",
            causes:["Debris collection tray capacity reached","Heavy leaf or debris load in pool","Filter screen clogged reducing suction"],
            fix:["Remove robot from pool","Open debris tray door and empty all collected debris","Rinse tray and filter screen with hose until water runs clear","Reinstall tray and restart cycle"],
            severity:"low", callpro:false }
        ]
      }
    }
  },

  betta: {
    label: "Betta (BWT)",
    color: "#10b981",
    categories: {
      "Betta Robot Cleaners": {
        models:["Betta SE","Betta 2","Betta SE2","Betta Plus","Betta Cleaner"],
        note:"Betta robots (manufactured by Hammer / distributed under BWT brand) use LED indicator patterns and an audible buzzer. Most models are cordless with solar-assist charging. Betta SE and SE2 are surface skimmers; Betta Cleaner is a full in-pool robot.",
        codes:[
          { code:"LED: Blinking Red", name:"Low Battery — Charge Immediately",
            causes:["Battery charge level critically low","Robot has been running longer than battery capacity","Solar charge insufficient to maintain level (heavy cloud cover or shadowed pool)"],
            fix:["Remove robot from pool","Place on charging dock or connect charging cable","Allow minimum 4–6 hours charge before next use","Ensure solar panel is clean and unobstructed for solar-assist models"],
            severity:"medium", callpro:false },
          { code:"LED: Solid Red", name:"Drive Fault / Obstacle Stuck",
            causes:["Drive wheel or track jammed by debris","Robot wedged against wall, step, or drain cover","Drive motor stalled"],
            fix:["Remove robot from pool","Clear any debris from drive wheels, tracks, and undercarriage","Check that all wheels spin freely by hand","Reset by holding power button 5 seconds","Inspect pool for objects that could trap the robot"],
            severity:"high", callpro:false },
          { code:"LED: Red (3 blinks)", name:"Brush Blocked or Jammed",
            causes:["Hair, string, or fibrous debris wrapped around brush roller","Brush roller bearing worn","Brush drive mechanism fault"],
            fix:["Remove robot and cut away any wrapped hair or string with scissors","Spin brush roller manually — it should rotate freely","Clean brush roller housing and end caps","Replace brush roller if bearing is seized or bristles are heavily worn"],
            severity:"medium", callpro:false },
          { code:"Buzzer + Red LED", name:"Water Entry Alarm",
            causes:["Water has entered the electronics compartment","Seal or gasket damaged or displaced","Robot dropped or impacted before water entry"],
            fix:["Remove robot from pool immediately","Do NOT plug in or charge until fully dry","Allow robot to air-dry completely (24-48 hours minimum)","Inspect all seals, gaskets, and housing for cracks or damage","Contact Betta/BWT support — electronics water exposure may require professional service"],
            severity:"high", callpro:true },
          { code:"No power after full charge", name:"Battery or Charging Contact Issue",
            causes:["Battery has reached end of service life (typically 2–3 years)","Charging contacts on robot or dock are corroded or oxidized","Internal battery connection loose"],
            fix:["Clean charging contacts with fine sandpaper or isopropyl alcohol","Test with a different charging cable if available","If robot is 2+ years old and charge does not hold, battery replacement is likely needed","Contact Betta/BWT support for battery service options"],
            severity:"medium", callpro:false },
          { code:"Robot circles without moving forward", name:"Wheel / Track Slip or Brush Jam",
            causes:["One drive wheel or track has more resistance than the other (asymmetric drag)","Brush jam causing rotational bias","Track or wheel worn, cracked, or delaminated"],
            fix:["Remove robot and inspect both drive wheels/tracks for debris or damage","Clean and lubricate track joints if applicable","Check that brush roller spins freely — a jammed brush pulls the robot sideways","Replace worn or cracked tracks/wheels if found","Test on a flat surface out of water to isolate which side is dragging"],
            severity:"medium", callpro:false },
          { code:"Robot stays in corner", name:"Navigation Sensor Dirty or Blocked",
            causes:["Cliff or wall detection sensor covered in algae, debris, or scale","Sensor lens scratched or cloudy","Pool surface highly reflective (light-colored plaster) confusing sensors"],
            fix:["Remove robot and clean all sensors on underside and sides with soft damp cloth","Do not use abrasive cleaners on sensor lenses","Check that sensor ports are not blocked by debris buildup","If pool surface is very light-colored, check Betta compatibility documentation for reflective surfaces"],
            severity:"low", callpro:false },
          { code:"Solar charge not working", name:"Solar Panel Issue",
            causes:["Solar panel surface dirty, coated with sunscreen film, or covered by debris","Insufficient sunlight — overcast conditions, pool fully shaded","Panel or internal solar charge controller fault"],
            fix:["Clean solar panel with damp cloth — sunscreen and dust significantly reduce output","Position robot in direct sunlight for at least 3–4 hours for meaningful charge","Solar assist supplements but does not fully replace dock charging in low-light conditions","If panel is clean and conditions are sunny but charge does not occur: internal solar controller fault, contact BWT support"],
            severity:"low", callpro:false }
        ]
      }
    }
  },

  polaris: {
    label: "Polaris (Zodiac)",
    color: "#1d4ed8",
    categories: {
      "Polaris Pressure-Side Cleaners": {
        models:["Polaris 280","Polaris 380","Polaris 480","Polaris 3900 Sport","Polaris 65","Polaris 165","Polaris Quattro Sport"],
        note:"Polaris pressure-side cleaners require a dedicated booster pump (280/380/480/3900) or work off main pump return pressure (65/165). No electronic error codes — diagnosis is based on observed behavior.",
        codes:[
          { code:"Cleaner not moving", name:"Booster Pump Off or Drive Train Issue",
            causes:["Booster pump not running (for 280/380/480 models)","Feed hose kinked or disconnected","Drive belts broken or missing","Turbine/water wheel clogged","Water flow to cleaner too low"],
            fix:["Verify booster pump is running and circuit breaker is on","Check all hose connections at wall fitting and cleaner","Inspect all three drive belts — replace if cracked or broken","Remove turbine cover and clear debris from water wheel","Verify booster pump valve is open fully"],
            severity:"medium", callpro:false },
          { code:"Cleaner moves but bag not filling", name:"Backup Valve Stuck or Low Flow",
            causes:["Backup valve not cycling (stuck open or closed)","Water flow rate too low to fill bag","Bag torn or zipper open","Head float restricting intake","Debris deflector missing or misaligned"],
            fix:["Listen for backup valve clicking every 3-5 minutes — if silent, replace backup valve","Check flow rate — bag should inflate visibly while running","Inspect bag for tears and zipper closure","Remove and inspect head float — should be buoyant, not waterlogged","Confirm debris deflector is installed at intake throat"],
            severity:"medium", callpro:false },
          { code:"Cleaner climbs walls and gets stuck", name:"Water Chemistry or Tail Sweep Worn",
            causes:["Pool walls too slippery from algae or high pH (no traction)","Tail sweep worn or missing (tail sweep provides back-pressure to keep cleaner on floor)","Water pressure too high (overcorrects up walls)","Float tube waterlogged"],
            fix:["Treat pool chemistry — target pH 7.2-7.6, shock if algae present","Inspect tail sweep — replace if bristles worn below 1 inch","Reduce booster pump pressure if adjustable","Check float tube for water ingress — replace if waterlogged","Add a Polaris wing kit or deflector kit for chronic wall-climbing issues"],
            severity:"low", callpro:false },
          { code:"Backup valve not firing", name:"Backup Valve Timer or Wear",
            causes:["Backup valve timer set too infrequently or too frequently","Backup valve diaphragm worn or cracked","Debris lodged in backup valve seat","Low flow reducing valve actuation pressure"],
            fix:["Adjust backup valve timer — optimal is every 3-5 minutes (1/3 turn setting on most models)","Remove backup valve and inspect diaphragm — replace if cracked or stiff","Flush valve with clean water to clear debris","Test with a new backup valve if diagnosis is unclear — they are inexpensive and commonly replaced"],
            severity:"medium", callpro:false },
          { code:"Cleaner moves in circles", name:"Drive Belts Worn or One Wheel Not Turning",
            causes:["One drive belt broken, worn, or slipped off","One drive wheel seized or jammed","Wheel axle worn","Uneven pressure from head float position"],
            fix:["Remove cleaner from pool and inspect all three drive belts — all must be intact and correctly routed","Spin each wheel by hand — all should rotate freely","Replace all three drive belts as a set (they wear at similar rates)","Check wheel axle for debris binding","Re-seat head float in correct position"],
            severity:"medium", callpro:false },
          { code:"Head float above water line", name:"Water in Float — Replace",
            causes:["Head float has cracked or degraded and filled with water","UV degradation of float material over time"],
            fix:["Remove head float and shake — if you hear water sloshing inside, replace it","Float replacement is straightforward — unclip and swap","Water-filled float causes cleaner to drag along bottom and not cover pool properly"],
            severity:"low", callpro:false },
          { code:"Hose collapses", name:"Hose Swivel Restriction",
            causes:["Hose swivel joint too tight (restricts flow causing suction collapse)","Hose section kinked at connection point","Hose age — older hoses lose flexibility and kink more easily"],
            fix:["Check all swivel joints — they should rotate freely with minimal resistance","Do not over-tighten hose connections","Straighten hose sections and ensure no sharp bends","Consider replacing hose if it is more than 5 years old and repeatedly kinks"],
            severity:"low", callpro:false }
        ]
      },

      "Polaris Robot Cleaners (i-series)": {
        models:["Polaris iCleaner","Polaris AW20","Polaris AW40","Polaris Alpha IQ+","Polaris 9550 Sport","Polaris 9450 Sport","Polaris 9350"],
        note:"Polaris i-series and AW-series robots connect via the iAquaLink or Polaris app. LED indicators on the robot body plus in-app status messages are the primary diagnostic interface.",
        codes:[
          { code:"App: Not connecting", name:"Wi-Fi Setup or App Reset Needed",
            causes:["Wi-Fi network SSID or password changed since initial setup","Robot is paired to old network","App needs update","2.4 GHz Wi-Fi not available (robot requires 2.4 GHz, not 5 GHz)","Router firmware blocking mDNS or local device discovery"],
            fix:["Open Polaris/iAquaLink app and navigate to Settings > Devices > Remove Device","Re-add robot using in-app setup wizard","Ensure your phone is on 2.4 GHz Wi-Fi during setup (temporarily disable 5 GHz if dual-band)","Update app to latest version from App Store or Google Play","Reset robot Wi-Fi by holding the power button for 10 seconds until LED blinks rapidly"],
            severity:"low", callpro:false },
          { code:"App: Filter indicator", name:"Filter Canister Full — Clean Required",
            causes:["Debris collection canister has reached capacity","Heavy debris load (leaves, algae, fine sediment)","Filter screen clogged reducing suction flow"],
            fix:["Remove robot from pool","Open filter canister door (rear of robot)","Remove and empty filter canister — dispose of debris","Rinse filter screen/cartridge under garden hose until clear","Reinstall filter and restart cleaning cycle"],
            severity:"low", callpro:false },
          { code:"LED: Solid Red (AW20/AW40)", name:"Drive or Motor Fault",
            causes:["Drive motor stalled or overheated","Impeller blocked by debris","Robot trapped or drive wheel jammed"],
            fix:["Remove robot from pool","Clear all debris from impeller, brushes, and drive wheels","Let robot cool 15 minutes if it has been running for extended period","Unplug power supply for 60 seconds to perform full reset","If solid red persists after reset and cleaning: contact Polaris/Zodiac support"],
            severity:"high", callpro:true },
          { code:"LED: Blinking Red (AW20/AW40)", name:"Cable Tangle or Overcurrent Warning",
            causes:["Power cable tangled or kinked around robot body","Motor drawing excess current from obstacle or debris jam","Power supply issue"],
            fix:["Remove robot and untangle cable — lay cable out straight before restarting","Check impeller and brushes for debris","Ensure power cable has enough slack to follow robot through full pool coverage","Use cable swivel if cable tangling is chronic"],
            severity:"medium", callpro:false },
          { code:"LED: Solid Blue (AW20/AW40)", name:"Normal Operation",
            causes:["Robot is running normally"],
            fix:["No action needed"],
            severity:"low", callpro:false },
          { code:"LED: Blinking Blue (AW20/AW40)", name:"Cycle Complete",
            causes:["Cleaning cycle finished normally"],
            fix:["Remove robot from pool","Empty and rinse filter canister","Rinse robot exterior","Store out of direct sunlight when not in use"],
            severity:"low", callpro:false },
          { code:"No LED / Won't start (i-series)", name:"No Power — Supply or GFCI Fault",
            causes:["GFCI outlet tripped","Power supply unit failed","Cable damaged at plug or swivel","Transformer output out of spec"],
            fix:["Press reset button on GFCI outlet — test outlet with another device","Inspect cable for cuts, kinks, or damage at both ends","Check power supply output with multimeter if available","Try a known-good outlet on a different circuit","If power supply confirmed faulty: Polaris OEM power supply replacement required"],
            severity:"high", callpro:false }
        ]
      }
    }
  },

  intelliflo: {
    label: "IntelliFlo (Pentair)",
    color: "#0369a1",
    categories: {

      "IntelliFlo VF / VS / VSF Variable Speed Pump": {
        models: ["IntelliFlo VSF","IntelliFlo VS 3HP","IntelliFlo VF","IntelliFlo Variable Speed 011013","IntelliFlo2 VST","IntelliFlo3","EasyTouch with IntelliFlo"],
        codes: [
          { code:"E00", name:"Unknown Fault / General Error",
            causes:["Unspecified internal fault","Transient power or control board glitch"],
            fix:["Cycle power off for 30 seconds and restart","If fault persists after reset, contact Pentair support"],
            severity:"medium", callpro:false },
          { code:"E01", name:"Drive Overcurrent",
            causes:["Impeller blocked by debris","Motor winding resistance out of spec","Overload protection tripped"],
            fix:["Remove pump lid and clear impeller of any debris","Check motor winding resistance (~0.4Ω per phase on 3-phase windings)","Reset drive; if E01 returns immediately, motor or drive board may need replacement"],
            severity:"high", callpro:true },
          { code:"E02", name:"Motor Not Starting",
            causes:["Capacitor failed (single-phase models)","Drive board fault","Motor shaft seized"],
            fix:["Check and replace run/start capacitor on single-phase motors","Try spinning motor shaft by hand — if locked, motor may need replacement","Test drive board output; if no signal, drive board replacement needed"],
            severity:"high", callpro:true },
          { code:"E03", name:"Motor Running Too Slow / Underspeed",
            causes:["RPM target set below minimum operable speed","Voltage drop on long cable runs","Supply voltage below spec"],
            fix:["Raise minimum RPM setpoint in drive programming","Check supply voltage at drive input terminals — should match nameplate (240V typical)","Shorten cable run or increase wire gauge if voltage drop is significant"],
            severity:"medium", callpro:false },
          { code:"E04", name:"Low Voltage / Power Sag",
            causes:["Supply voltage below nameplate rating","Undersized breaker or wiring","Extension cords in use"],
            fix:["Check supply voltage at motor terminals (should be 240V ±10%)","Verify breaker amperage matches motor requirements","Extension cords are not permitted — run direct wiring to motor"],
            severity:"high", callpro:true },
          { code:"E05", name:"High Voltage / Power Surge",
            causes:["Utility power surge","Unregulated voltage spike on line"],
            fix:["Install proper surge protection at the electrical panel","Check utility power quality — contact utility if surges are frequent","If drive board is damaged by surge, replacement required"],
            severity:"high", callpro:true },
          { code:"E06", name:"Overcurrent / Motor Overloaded",
            causes:["Impeller jammed with debris","Worn bearings increasing drag","Motor amperage above rated value"],
            fix:["Remove pump basket and clear impeller of debris","Verify motor amperage at rated RPM with clamp meter — compare to nameplate FLA","Clean strainer basket","If bearings worn, motor replacement needed"],
            severity:"high", callpro:false },
          { code:"E07", name:"Motor Overtemperature",
            causes:["Motor windings overheating","Blocked ventilation on motor housing","High ambient temperature in equipment area"],
            fix:["Check airflow around motor — minimum 6\" clearance on all sides","Remove any covers or enclosures blocking motor ventilation","Verify ambient temperature is within motor operating range","If motor runs hot even with adequate airflow, motor may need replacement"],
            severity:"high", callpro:true },
          { code:"E08", name:"Drive Overtemperature",
            causes:["Drive board running too hot","Pump installed in direct sunlight or sealed enclosure","Insufficient clearance to walls or other equipment"],
            fix:["Ensure minimum 12\" clearance from walls and other equipment","Protect pump from direct sun exposure","Check drive compartment airflow — should not be in a completely sealed box","Lower max RPM temporarily to reduce heat load"],
            severity:"high", callpro:false },
          { code:"E09", name:"EEPROM / Configuration Error",
            causes:["Control board memory corruption","Drive board hardware fault"],
            fix:["Reset to factory defaults using the front panel display menu","If fault persists after factory reset, drive board replacement required","Contact Pentair warranty service"],
            severity:"high", callpro:true },
          { code:"E10", name:"Communication Fault",
            causes:["IntelliFlo not communicating with automation system (EasyTouch, IntelliCenter, etc.)","RS-485 wiring issue","Incorrect address DIP switch settings","Automation system re-pairing needed"],
            fix:["Check RS-485 data cable wiring (A/B polarity and shield grounding)","Verify pump address DIP switches match automation system address assignment","Re-pair pump in automation system software (EasyTouch / IntelliCenter setup menu)","Test RS-485 cable continuity — max run ~4,000 ft at 9600 baud"],
            severity:"medium", callpro:false },
          { code:"E11", name:"Priming Timeout",
            causes:["Pump failed to prime within 10-minute priming window","Air leaks at lid O-ring, unions, or suction fittings","Pool water level not covering skimmer intake","Suction valve closed or partially closed"],
            fix:["Check pool water level — must fully cover skimmer opening","Inspect pump lid O-ring and lubricate with Teflon-compatible silicone grease","Check all suction-side unions for air leaks (look for bubbles in pump basket)","Open all suction valves fully","Fill pump basket manually with water before restarting to assist priming"],
            severity:"high", callpro:false },
          { code:"E12", name:"Over Pressure",
            causes:["System pressure exceeds maximum setpoint","Dirty filter (most common cause)","Partially closed return valve","Broken return fitting creating restriction"],
            fix:["Backwash sand/DE filter or clean cartridge — dirty filter is the most common cause","Verify all return valves are fully open","Inspect return fittings for cracks or blockage","Lower max RPM if system is oversized for plumbing"],
            severity:"medium", callpro:false },
          { code:"E15", name:"Drive Fault (Hardware)",
            causes:["Internal hardware fault on drive board","Motor drive inverter failure","Voltage regulator fault inside drive"],
            fix:["Cycle power and attempt reset","If E15 returns immediately, drive board has an internal hardware failure","Contact Pentair warranty/service — drive board replacement required"],
            severity:"high", callpro:true },
          { code:"E17", name:"Motor Speed Fault",
            causes:["Motor unable to reach commanded RPM","System hydraulic restriction preventing target speed","Mechanical binding in motor or impeller"],
            fix:["Check system for closed valves, dirty filter, or other hydraulic restrictions","Inspect impeller for debris causing mechanical drag","If motor is free and hydraulics are clear, drive or motor service needed"],
            severity:"high", callpro:true },
          { code:"PRIMING", name:"Pump Priming Alert",
            causes:["Pump is in priming mode at startup — normal display during first 10 minutes"],
            fix:["Normal — allow up to 10 minutes for pump to prime","If PRIMING display persists beyond 10 minutes, fault converts to E11 — see E11 diagnosis"],
            severity:"low", callpro:false }
        ]
      }
    }
  },

  hayward_swg: {
    label: "Hayward Salt (TurboCell / AquaRite)",
    color: "#1d4ed8",
    categories: {

      "AquaRite / AquaRite Pro / TurboCell": {
        models:["AquaRite","AquaRite Pro","AquaRite S3","AquaRite XL","TurboCell T-3","TurboCell T-5","TurboCell T-9","TurboCell T-15","GLX-CELL-3","GLX-CELL-5","GLX-CELL-9","GLX-CELL-15"],
        codes:[
          { code:"No Flow", name:"Flow Not Detected",
            causes:["Pump not running or losing prime","Flow switch dirty or failed","Low water flow (pump speed too low on VSP)","Flow switch bypass jumper installed (check for misuse)"],
            fix:["Verify pump is running — AquaRite requires flow to generate chlorine","Clean flow switch paddle with white vinegar (calcium buildup stops paddle from moving)","On VSP: ensure pump speed is high enough for adequate flow through cell","Test flow switch — it should read closed when water flowing; replace if stuck open or closed"],
            severity:"high", callpro:false },
          { code:"Check Cell", name:"Cell Inspection Required",
            causes:["High calcium buildup on cell plates (most common)","Cell has reached end of life (average 5-7 years / 10,000 hrs)","Cell cable loose or corroded","Cell damaged — cracked housing or bent plates"],
            fix:["Inspect cell — if white calcium scale visible, perform acid wash: soak in 4:1 water-to-muriatic acid for 15 minutes, rinse thoroughly","Do NOT scrub cell plates — acid is the only safe cleaning method","Check cell cable connection at control box — wiggle while reading diagnostic output","Replace cell if acid wash doesn't resolve, cell is >7 years old, or plates appear damaged"],
            severity:"medium", callpro:false },
          { code:"Check Salt", name:"Low Salt Level",
            causes:["Salt level below minimum operating threshold (AquaRite target: 2700-3400 ppm, min 2700 ppm)","Salt sensor dirty (calcium on sensor = false low reading)","Cell producing less as it ages (cells become less efficient at detection near end of life)","Recent heavy rain diluting pool water"],
            fix:["Test salt level with quality test kit or strips — AquaRite display can read 200-400 ppm low or high","Add pool salt (evaporated, NOT rock salt or iodized table salt) if level confirmed low","Clean salt sensor with vinegar","If salt tests correct but code persists: replace cell or AquaRite sensor board"],
            severity:"medium", callpro:false },
          { code:"High Salt", name:"Salt Level Too High",
            causes:["Over-dosed salt addition","Insufficient water in pool when salt added","Salt sensor reading error"],
            fix:["Test salt with independent kit to confirm true reading","If salt is genuinely >4500 ppm: partially drain and refill pool with fresh water","Do not add more salt — cell will not operate above 5000 ppm"],
            severity:"medium", callpro:false },
          { code:"Cold Water", name:"Water Temperature Below Operating Range",
            causes:["Water temp below 50°F — AquaRite stops generating chlorine below 50°F","Normal seasonal shutdown"],
            fix:["Normal cold-weather behavior — supplement with liquid chlorine during cold spells","Unit will resume normal operation when water temp exceeds 50°F"],
            severity:"low", callpro:false },
          { code:"Low Output", name:"Chlorine Output Below Setpoint",
            causes:["Cell approaching end of life (production decreases over time)","Salt level slightly low","CYA too high (masks FC reading — pool may be adequately chlorinated)","Setpoint too low for bather load or pool size"],
            fix:["Run cell inspection diagnostic — compare cell amps to expected output for cell size","Increase output setpoint by 10% and monitor FC","Test true FC with Taylor K-2006 or FAS-DPD — strip tests are unreliable for SWG pools","Replace cell if amps consistently below 1A on cell diagnostic"],
            severity:"medium", callpro:false },
          { code:"Inspect Cell (Blinking)", name:"Cell Approaching End of Life",
            causes:["AquaRite meter has tracked cumulative runtime suggesting cell near replacement","This is a time-based alert, not a chemical alert"],
            fix:["Perform cell inspection — acid wash if calcium buildup is visible","If cell passes visual/acid test: reset the meter via AquaRite service menu","Replace cell if visual inspection shows worn or bent plates"],
            severity:"low", callpro:false }
        ]
      }
    }
  },

  pentair_automation: {
    label: "Pentair Automation (IntelliTouch / EasyTouch)",
    color: "#0369a1",
    categories: {

      "IntelliTouch / EasyTouch Automation": {
        models:["IntelliTouch i5+3","IntelliTouch i7+3","IntelliTouch i9+3","EasyTouch 4","EasyTouch 8","EasyTouch PL4","EasyTouch PL8","IntelliCenter"],
        codes:[
          { code:"No Comms (Pump)", name:"Pump Communication Lost",
            causes:["RS-485 data cable wiring fault between control panel and pump","Wrong DIP switch address on pump","Cable length too long or damaged","IntelliTouch firmware mismatch with newer IntelliFlo"],
            fix:["Check RS-485 cable color order at both ends — must be consistent (A/B/GND wiring specific to Pentair protocol)","Verify pump address DIP switches match assignment in IntelliTouch programming (Pump 1 = address 1, etc.)","Cable max: 1000ft for RS-485, but real-world limit is often 300ft — check for splices or sharp bends","Cycle power to both the control panel and the pump; wait 60 seconds for comms to re-establish"],
            severity:"high", callpro:true },
          { code:"Heater Fault", name:"Heater Communication / Control Fault",
            causes:["RS-485 cable fault between IntelliTouch and MasterTemp/Max-E-Therm","Heater board failed","Heater not getting 24VAC from IntelliTouch relay"],
            fix:["Check 24VAC output at IntelliTouch heater relay when heat is called","Test RS-485 cable from IntelliTouch to heater fireman switch interface","Inspect heater control board for burn marks or moisture","Re-pair heater in IntelliTouch programming (Heater → Protocol → Configure)"],
            severity:"high", callpro:true },
          { code:"IntelliChlor Fault", name:"Salt Cell Communication Error",
            causes:["RS-485 cable fault between IntelliTouch and IntelliChlor SCG","IntelliChlor cell or power center failure","Programming not assigned"],
            fix:["Check RS-485 data cable between IntelliTouch output board and IntelliChlor power center","Verify IntelliChlor is assigned in IntelliTouch programming","Test IntelliChlor independently — power center should show diagnostic lights"],
            severity:"medium", callpro:true },
          { code:"Freeze Protection", name:"Freeze Protection Active",
            causes:["Air temperature sensor reading below freeze threshold (default 36°F)","Freeze sensor location in direct sun causing false reading","Normal cold weather activation"],
            fix:["Normal behavior — all assigned freeze protection loads run until temp rises above threshold","If triggering falsely in warm weather: relocate freeze sensor to shaded area away from sun","Check freeze sensor wire integrity — open circuit = always triggers freeze protection"],
            severity:"low", callpro:false },
          { code:"Panel Offline", name:"Control Panel Not Responding",
            causes:["Power loss to control panel","Main breaker tripped","Control board failure","Display cable fault"],
            fix:["Check 240VAC supply at panel and incoming breaker","Verify 24VAC transformer output on control board (common fault point — transformers fail)","Inspect display cable from indoor panel to control box","IntelliCenter: check network connection if programming via app"],
            severity:"high", callpro:true },
          { code:"Valve Fault", name:"Valve Actuator Not Responding",
            causes:["Valve actuator motor failed","End stop switches inside actuator failed","Valve handle stuck (seized actuator)","Actuator not assigned in programming"],
            fix:["Manually operate valve — if valve turns freely by hand but actuator doesn't: actuator motor failed","Test actuator with jumper — apply 24VAC directly to actuator motor terminals and observe rotation","Check end stop switches inside actuator — small micro-switches that signal position","Program actuator assignment in IntelliTouch if recently added"],
            severity:"medium", callpro:false },
          { code:"Dim / No Display", name:"Touchscreen or Display Failure",
            causes:["Display backlight failing (common on IntelliTouch i-Series)","Screen damage from UV exposure","Cable connection loose"],
            fix:["IntelliTouch indoor display is NOT waterproof — moisture ingress kills screens; replace if water got in","Check display cable at back of touchscreen and at control box","Screens are available as replacement parts (EasyTouch indoor/outdoor, IntelliTouch color touchscreen)","IntelliCenter: verify Ethernet cable and power to IntelliCenter controller"],
            severity:"medium", callpro:false }
        ]
      }
    }
  },

  aquacal: {
    label: "AquaCal",
    color: "#0891b2",
    categories: {

      "AquaCal Heat Pump": {
        models: ["AquaCal TropiCal","AquaCal SQ Series","AquaCal SuperQuiet","SQ170","SQ225","SQ145","SQ120","T135","T75","T55","HeatWave SuperQuiet","AquaCal 4000 Series"],
        codes: [
          { code:"E1 / LO", name:"Low Refrigerant Pressure / Low Ambient",
            causes:["Ambient air temperature below 50°F (normal cold-weather cutoff)","Low refrigerant charge from slow leak","Dirty evaporator coil reducing airflow and refrigerant pressure"],
            fix:["Check ambient temperature — if below 50°F, unit shutdown is normal and will auto-restart when it warms up","Clean evaporator coil fins with a garden hose (spray from inside outward — never a pressure washer)","If ambient is 60°F+ and code persists: refrigerant charge issue — call licensed HVAC technician"],
            severity:"medium", callpro:true },
          { code:"E2 / HI", name:"High Refrigerant Pressure",
            causes:["Dirty evaporator coil reducing airflow","Low water flow rate through heat exchanger","Refrigerant overcharge"],
            fix:["Clean evaporator coil fins thoroughly","Verify water flow rate — minimum 20 GPM typically required through heat pump","Check that water-side unions on heat pump are fully open","If coil is clean and flow is confirmed: refrigerant overcharge or other sealed-system issue, call HVAC tech"],
            severity:"high", callpro:true },
          { code:"FLO", name:"Flow Switch / No Water Flow",
            causes:["Circulation pump not running","Flow switch failed open","Water flow below minimum threshold (~20 GPM)","Dirty filter restricting flow","Closed water valves"],
            fix:["Confirm pool pump is running at adequate speed","Open all water valves feeding the heat pump","Check and clean filter — a dirty filter is a common flow culprit","Test flow switch continuity — if open with confirmed good flow, flow switch replacement needed","Verify minimum GPM per model spec sheet"],
            severity:"high", callpro:false },
          { code:"E3", name:"Defrost Mode Active",
            causes:["Normal defrost cycle in cold or humid conditions","Evaporator coil frost accumulating in marginal ambient temperatures"],
            fix:["Normal operation — heat pump will defrost evaporator coil for 5-15 minutes and resume","No action needed if unit returns to normal heating after defrost","If unit stays in defrost mode for more than 20 minutes, check refrigerant charge"],
            severity:"low", callpro:false },
          { code:"E5", name:"Discharge Temperature Too High",
            causes:["High ambient air temperature","Refrigerant issue causing elevated discharge temperatures","Dirty condenser/evaporator coil"],
            fix:["Clean evaporator coil fins","Check for obstruction of airflow around unit","If ambient is normal and coil is clean: refrigerant system fault, schedule HVAC service"],
            severity:"high", callpro:true },
          { code:"E6", name:"Suction Temperature Fault",
            causes:["Low refrigerant charge causing suction line temperature deviation"],
            fix:["This is a refrigerant-circuit fault — call licensed HVAC technician for refrigerant diagnosis and service"],
            severity:"high", callpro:true },
          { code:"E7", name:"Compressor Overcurrent",
            causes:["Power supply amperage issue","Compressor hard-starting","Start capacitor failed"],
            fix:["Check power supply voltage and amperage at unit disconnect","Test start/run capacitor — replace if out of spec","If capacitor is good and compressor still hard-starts, contact HVAC/pool tech for compressor service"],
            severity:"high", callpro:true },
          { code:"E9", name:"Low Ambient Shutdown",
            causes:["Ambient air temperature below unit's minimum operating range (typically 45-50°F depending on model)"],
            fix:["Normal cold-weather protection — not a fault","Unit will automatically restart when ambient temperature rises above minimum","Check model spec for exact low-ambient cutoff"],
            severity:"low", callpro:false },
          { code:"FS1 / FS2", name:"Freeze Protection Active",
            causes:["Water temperature approaching freezing (32°F)","Heat pump protecting evaporator coil from freeze damage","System may not be winterized in freezing conditions"],
            fix:["Verify water is actively circulating through the system","If temperatures are below freezing, system should be winterized","Check if system should be drained or heat pump bypassed for winter"],
            severity:"medium", callpro:false },
          { code:"No display / no power", name:"No Power to Unit",
            causes:["GFCI outlet or breaker tripped (most common)","240V supply not present","Disconnect switch off"],
            fix:["Check and reset GFCI protection at the unit or panel","Check 240V breaker at main panel — confirm both legs are powered","Verify all disconnect switches are in the ON position","Check for 240V at unit disconnect with multimeter if available"],
            severity:"high", callpro:false }
        ]
      }
    }
  },

  starite: {
    label: "Sta-Rite",
    color: "#7c3aed",
    categories: {

      "Sta-Rite MAX-E-THERM / MASTER TEMP Gas Heater": {
        models: ["Max-E-Therm 200","Max-E-Therm 300","Max-E-Therm 400","Master Temp 125","Master Temp 175","Master Temp 250","Master Temp 300","Master Temp 400"],
        note: "Sta-Rite Max-E-Therm and Master Temp share identical controls with Pentair MasterTemp — codes are interchangeable.",
        codes: [
          { code:"E05", name:"Ignition Failure Lockout",
            causes:["Gas supply valve closed or insufficient pressure","Igniter failure or cracked element","Flame sensor dirty or corroded","Gas pressure out of spec (3.5\" WC natural, 10\" LP)","Three consecutive ignition failures triggered safety lockout"],
            fix:["Check gas supply shutoff is fully open","Verify gas pressure at manifold","Clean flame sensor rod with fine steel wool","Inspect hot surface igniter — replace if cracked or not glowing","After 3 failed ignition attempts unit locks out — hold Reset button to clear"],
            severity:"high", callpro:true },
          { code:"E06", name:"High Limit",
            causes:["Low water flow (dirty filter, closed valves, pump issue)","High limit switch tripped from overtemperature"],
            fix:["Verify pump is running and filter is clean","Open all water valves fully","Allow unit to cool completely before resetting","Check filter pressure — backwash or clean if elevated"],
            severity:"high", callpro:false },
          { code:"EO1", name:"Stack Flue Limit",
            causes:["Blocked flue or exhaust outlet","Recirculating exhaust gases back into unit","Combustion air starvation in enclosed space"],
            fix:["Clear any debris or obstruction from flue outlet","Check installation clearances (minimum 18\" above unit top, 12\" from sides)","Ensure adequate combustion air supply — sealed equipment rooms need dedicated air vents","Inspect for any nearby walls or structures causing exhaust recirculation"],
            severity:"high", callpro:true },
          { code:"AFS", name:"Air Flow Switch Open",
            causes:["Blocked combustion air inlet screen","Inducer motor failed or not spinning","Air flow switch itself has failed"],
            fix:["Inspect and clear combustion air inlet — remove any debris or insect nests","Pull inducer compartment cover and listen for inducer motor — it should be audible during startup","Check AFS pressure tubing for kinks or disconnection","Test AFS switch continuity — should close when inducer runs"],
            severity:"high", callpro:true },
          { code:"IGN", name:"Ignition Fault",
            causes:["Same root causes as E05 — gas pressure, igniter, flame sensor, gas valve"],
            fix:["Check gas pressure and supply","Inspect igniter and flame sensor (clean with steel wool)","Verify gas valve opens during call for heat (24V at valve coil)","Hold Reset to clear lockout after diagnosing root cause"],
            severity:"high", callpro:true },
          { code:"PRS", name:"Pressure Switch Open",
            causes:["Insufficient water flow","Pressure switch failure"],
            fix:["Verify pump running and flow is adequate","Clean or backwash filter","Test pressure switch — professionals may jumper PS terminals briefly to confirm switch is the fault (do not leave jumpered)"],
            severity:"high", callpro:false },
          { code:"HLS", name:"High Limit Switch Tripped",
            causes:["Water temperature exceeded high limit switch trip point","Restricted water flow caused localized overheating"],
            fix:["Allow heater to cool completely (15-20 minutes)","Check pump flow and filter before resetting","Reset by cycling power or pressing Reset button on control panel"],
            severity:"high", callpro:false },
          { code:"AGS", name:"Auto Gas Shutoff",
            causes:["Heater placed in vacation/AGS mode — normal safety feature after extended inactivity"],
            fix:["Press Pool or Spa button on control panel to restart heater","Not a fault — normal automatic safety shutoff"],
            severity:"low", callpro:false },
          { code:"Service Heater", name:"General Service Reminder",
            causes:["Annual service interval reached","Routine maintenance reminder — not a fault code"],
            fix:["Schedule annual inspection and cleaning","Clean burner tray, inspect heat exchanger, check gas pressure, clean flame sensor","Reset service reminder after maintenance is complete"],
            severity:"low", callpro:true }
        ]
      },

      "Sta-Rite Dura-Glas / Max-E-Glas Pump": {
        models: ["Dura-Glas","Dura-Glas II","Max-E-Glas","Max-E-Glas II","SuperMax","SuperMax VS"],
        codes: [
          { code:"Won't prime", name:"Pump Won't Prime",
            causes:["Clogged strainer basket","Air leak at pump lid O-ring or suction fittings","Suction valve partially or fully closed"],
            fix:["Remove and clean strainer basket","Inspect pump lid O-ring — lubricate with Teflon-compatible silicone lube (never petroleum-based)","Fill pump basket manually with water before restarting to assist initial prime","Check all suction-side fittings and unions for air leaks"],
            severity:"medium", callpro:false },
          { code:"Noisy / cavitating", name:"Pump Noise / Cavitation",
            causes:["Strainer basket clogged restricting suction flow","Air entering suction side of system","Suction pipe run too long or undersized for flow rate"],
            fix:["Clean strainer basket thoroughly","Inspect all suction fittings for air leaks — look for bubbles visible in pump basket","Check suction pipe sizing — undersized suction causes cavitation at higher speeds","Verify water level is adequate to cover skimmer"],
            severity:"medium", callpro:false },
          { code:"Leaking at shaft seal", name:"Shaft Seal Leak",
            causes:["Mechanical shaft seal worn from normal use","Pump operated dry (runs without water) which destroys seal quickly","High system pressure accelerating seal wear"],
            fix:["Replace shaft seal kit — full seal replacement is required, not just O-rings","Do not run pump dry under any circumstances","Lubricate new seal faces with clean water during installation — no oil or petroleum"],
            severity:"medium", callpro:false },
          { code:"High amperage / tripping breaker", name:"High Amperage / Breaker Trip",
            causes:["Impeller mechanically binding","Worn motor bearings increasing drag","Voltage drop causing motor to draw excess current","Start/run capacitor failed on single-phase motors"],
            fix:["Check supply line voltage at motor terminals — should match nameplate","Inspect and clean impeller for any debris binding","Check and replace run/start capacitor if reading out of spec","If bearings worn: motor replacement needed"],
            severity:"high", callpro:true },
          { code:"Motor humming, not starting", name:"Motor Hum — No Start",
            causes:["Start or run capacitor failed (most common single fix on single-phase motors)","Motor shaft seized from sitting idle","Voltage present but motor not developing torque"],
            fix:["Test and replace capacitor — this is the most common fix for a humming motor that won't start","Try spinning motor shaft by hand (with power OFF) — if locked, motor is seized","If shaft spins freely and new capacitor doesn't help, motor rewind or replacement needed"],
            severity:"high", callpro:false },
          { code:"Motor overheating", name:"Motor Overheating",
            causes:["Insufficient ventilation around motor","Direct sun exposure on motor housing","Worn bearings generating excess heat","Motor amps above nameplate FLA"],
            fix:["Ensure motor has adequate airflow — do not enclose without ventilation","Shield motor from direct sun if possible","Check motor amp draw with clamp meter — compare to nameplate FLA","If amps are normal and motor still overheats: bearings likely worn"],
            severity:"high", callpro:false }
        ]
      }
    }
  },

  waterway: {
    label: "Waterway",
    color: "#059669",
    categories: {

      "Waterway Pump & Filter": {
        models: ["Waterway Executive","Waterway Hi-Flo","Waterway Pump 1HP","Waterway Pump 1.5HP","Waterway Pump 2HP","Waterway Crystal Water DE Filter","Waterway Carefree Sand Filter","Waterway 58112","Waterway Variable Speed"],
        codes: [
          { code:"Won't start", name:"Pump Won't Start",
            causes:["GFCI tripped (most common cause)","Breaker tripped","Capacitor failed on single-phase motors","No 240V supply at motor terminals"],
            fix:["Check and reset GFCI protection at outlet or subpanel","Check main breaker — reset if tripped","Test supply voltage at motor terminals (240V expected)","Inspect and replace start/run capacitor if motor hums but won't start"],
            severity:"high", callpro:false },
          { code:"Loses prime", name:"Pump Loses Prime",
            causes:["Air leak at pump lid O-ring (very common on Waterway — O-ring degrades with age and UV)","Air leak at suction unions or fittings","Suction valve not fully open"],
            fix:["Inspect pump lid O-ring — apply a heavy bead of silicone lubricant (Teflon-compatible only)","Check all suction fittings for any gap or partial looseness","Open all suction valves fully","Check water level — must cover skimmer intake"],
            severity:"medium", callpro:false },
          { code:"Noisy / vibrating", name:"Pump Noise / Vibration",
            causes:["Pump not fully primed (air in system)","Impeller vane chipped or worn","Loose pump base mounting bolts","Motor bearing noise (early failure sign)"],
            fix:["Ensure pump is fully primed before diagnosing noise","Remove lid and inspect impeller for chips or debris","Tighten pump base mounting bolts","If noise is a grinding or whining from motor: bearings may be failing, motor service needed"],
            severity:"medium", callpro:false },
          { code:"Motor runs hot", name:"Motor Overheating",
            causes:["High ambient temperature with direct sun on motor","Worn motor bearings generating heat","Motor amp draw exceeding nameplate FLA","Motor vent openings blocked by debris"],
            fix:["Check and clear motor vent openings on both ends of motor","Shield motor from direct sun if possible","Measure motor amp draw and compare to nameplate FLA","If amps are normal and motor still overheats: bearing service needed"],
            severity:"high", callpro:false },
          { code:"Leaking at unions", name:"Union O-Ring Leak",
            causes:["Union O-rings dried out and cracking","O-rings were lubricated with petroleum-based product (swells rubber)","Unions over-tightened causing O-ring deformation"],
            fix:["Remove unions and replace O-rings","Lubricate new O-rings with Teflon-compatible silicone grease only — never petroleum-based products","Hand-tighten unions plus 1/4 turn — do not over-tighten"],
            severity:"low", callpro:false },
          { code:"Filter pressure won't drop after backwash", name:"Persistent High Filter Pressure",
            causes:["Sand channeling in filter (water finds path of least resistance through channels rather than filtering)","Filter needs new sand (sand wears and rounds after 5-7 years)","Broken lateral in sand filter base allowing debris bypass"],
            fix:["Spike backwash cycle — some filters allow a pressure spike to break up sand channels","If sand is 5+ years old, replace the sand","Inspect laterals at bottom of sand filter for cracks — broken laterals allow sand into pool and reduce filtration"],
            severity:"medium", callpro:false },
          { code:"Variable speed fault E01", name:"Variable Speed Overcurrent",
            causes:["Impeller blocked by debris","Motor drive fault"],
            fix:["Clear impeller of all debris","Reset drive by cycling power","If E01 returns: motor or drive board service needed (similar diagnosis to IntelliFlo E01)"],
            severity:"high", callpro:true },
          { code:"Variable speed fault E02", name:"Variable Speed Communication Loss",
            causes:["RS-485 communication loss with automation controller","Incorrect address DIP switch settings","Wiring fault in data cable"],
            fix:["Check RS-485 data cable wiring and connections","Verify DIP switch address settings match automation controller assignment","Re-pair pump in automation system if available","Test RS-485 cable continuity"],
            severity:"medium", callpro:false }
        ]
      }
    }
  }
};

// Field system expansion: newer categories where many calls are symptom-driven instead of code-driven.
Object.assign(window.ERROR_DB.hayward.categories, {
  "Lighting - ColorLogic / CrystaLogic": {
    models:["Universal ColorLogic 2.0","Universal CrystaLogic 2.0","ColorLogic 4.0","ColorLogic 320","CrystaLogic 320","Omni Direct lighting"],
    codes:[
      { code:"LIGHT-NO-POWER", name:"Light Will Not Turn On",
        causes:["GFCI or lighting breaker tripped","Transformer not outputting 12-15VAC","Bad relay or loose line/load wiring","Failed LED driver or fixture","Automation schedule or service mode disabling light"],
        fix:["Reset GFCI and confirm breaker holds","Verify transformer primary voltage and 12-15VAC secondary output","Check automation relay output when light circuit is commanded on","Inspect junction box and cord connections for corrosion or water intrusion","If voltage is present at fixture and light stays dark, fixture/driver failure is likely"],
        severity:"high", callpro:true },
      { code:"LIGHT-WRONG-COLOR", name:"ColorLogic Wrong Color / Out Of Sync",
        causes:["Power-cycle color mode out of sequence","Mixed ColorLogic generations or incompatible mode","Light not set to the same control mode as Omni/ProLogic","Long wire run causing voltage drop"],
        fix:["Power all lights off for 30 seconds, then restart the selected show/color together","Verify all fixtures are set to the same ColorLogic/Universal/Omni Direct mode","In Omni systems, confirm the light type and zone are assigned correctly","Measure voltage under load at the junction box; correct undersized wire or transformer capacity issues"],
        severity:"medium", callpro:false },
      { code:"LIGHT-GFCI-TRIP", name:"GFCI Trips When Light Turns On",
        causes:["Water intrusion in fixture or cord","Moisture/corrosion inside junction box","Damaged cord insulation","Transformer or relay short"],
        fix:["Do not bypass GFCI protection","Open junction box and inspect for water, corrosion, or damaged wirenuts","Disconnect fixture load and retest circuit to isolate fixture versus transformer/relay","Replace wet fixture or damaged cord assembly; do not splice underwater light cords"],
        severity:"high", callpro:true },
      { code:"OMNI-LIGHT-MISSING", name:"Light Missing From OmniLogic / OmniPL",
        causes:["Light not assigned in configuration","MSP/MPP communication issue","Incorrect relay or low-voltage output mapping","Firmware/configuration mismatch after equipment replacement"],
        fix:["Enter service/configuration and verify light relay, transformer, and group assignment","Power cycle Omni controller from shutdown, breaker off 60 seconds, then allow several minutes to reconnect","Check for communication-loss alarms before replacing parts","Export/save configuration before major changes"],
        severity:"medium", callpro:true }
    ]
  },
  "Automation - OmniLogic / OmniPL / ProLogic": {
    models:["OmniLogic","OmniPL","OmniHub","AquaPlus","ProLogic","OnCommand"],
    codes:[
      { code:"OMNI-OFFLINE", name:"Omni App / Cloud Offline",
        causes:["Controller network connection lost","Router/Wi-Fi credentials changed","Omni controller needs reboot","Cloud account/device pairing issue"],
        fix:["Power cycle Omni controller from the touchscreen shutdown, then breaker off 60 seconds","Wait at least 3 minutes after restart before judging connection","Confirm Ethernet/Wi-Fi connection and signal strength","If local control works but app does not, re-check account/device registration"],
        severity:"medium", callpro:false },
      { code:"COMM-LOSS", name:"Communication Loss Alarm",
        causes:["MSP/MPP communication wiring fault","Loose Ethernet-style cable between panels","Board power issue","Damaged low-voltage communication cable"],
        fix:["Open alarms and identify which module is reporting communication loss","Reseat MSP/MPP communication cable and inspect for corrosion","Verify low-voltage power supply outputs before replacing boards","If valves or relays are frozen by comm loss, resolve communication first"],
        severity:"high", callpro:true },
      { code:"VSP-NO-COMM", name:"Variable-Speed Pump Not Communicating",
        causes:["Low-speed bus/RS-485 wiring incorrect","Pump address/configuration not learned","Automation controlling relay power instead of data","Damaged communication board"],
        fix:["Verify pump has constant line power and is controlled by communication, not relay cycling","Check data-wire polarity and connection at Omni/ProLogic low-speed bus","Re-discover pump in configuration after wiring changes","Cycle power to pump and automation after correcting wiring"],
        severity:"high", callpro:true },
      { code:"SENSOR-BAD", name:"Bad Air / Water Sensor Reading",
        causes:["10k thermistor open or shorted","Sensor in direct sun or bad location","Cable damaged by rodents or landscape work","Wrong sensor assigned in automation"],
        fix:["Compare displayed temperature to a known thermometer","Inspect sensor cable and connector for breaks/corrosion","Test resistance against 10k thermistor table at current temperature","Relocate air sensor to shaded ventilated location if readings swing high"],
        severity:"medium", callpro:false }
    ]
  },
  "Advanced Sanitizer - HydraPure / UV / Ozone": {
    models:["HydraPure","HydroRite UVO3","UV/Ozone systems","AOP systems"],
    codes:[
      { code:"UV-LAMP", name:"UV Lamp Fault / Low Output",
        causes:["Lamp reached rated life","Quartz sleeve dirty or scaled","Ballast failure","Flow switch not proving water movement"],
        fix:["Confirm lamp runtime and replace lamp on schedule","Clean quartz sleeve with manufacturer-approved process","Verify flow switch and pump flow before replacing ballast","Wear eye protection and never look at an energized UV lamp directly"],
        severity:"medium", callpro:true },
      { code:"OZONE-NO-OUTPUT", name:"Ozone System Not Producing",
        causes:["Injector clogged or no vacuum","Check valve stuck or water-backed into ozone line","Ozone cell/module aged out","Air dryer or tubing restricted"],
        fix:["Verify injector vacuum with pump running","Inspect and replace check valve if water is present in ozone tubing","Clean injector and tubing restrictions","Replace ozone module/cell if vacuum is good and no output remains"],
        severity:"medium", callpro:false }
    ]
  }
});

Object.assign(window.ERROR_DB.pentair.categories, {
  "Lighting - IntelliBrite / MicroBrite / GloBrite": {
    models:["IntelliBrite Architectural Series","IntelliBrite 5G","MicroBrite Color","MicroBrite White","GloBrite","ColorVision Bubbler","Color Sync Controller"],
    codes:[
      { code:"LIGHT-NO-POWER", name:"Pentair Light Will Not Turn On",
        causes:["GFCI/breaker tripped","Transformer output missing","Color Sync/automation relay not sending power","Failed LED engine or driver","Water intrusion in fixture"],
        fix:["Confirm breaker and GFCI hold with load disconnected","Measure transformer secondary voltage under load","Command light directly from relay/controller and verify output","Inspect junction box and fixture cord for water/corrosion","Replace fixture if proper voltage is present and light remains dark"],
        severity:"high", callpro:true },
      { code:"LIGHT-NOT-SYNCED", name:"Color Lights Out Of Sync",
        causes:["Power-cycle color commands not synchronized","Mixed IntelliBrite/GloBrite/MicroBrite behavior","Controller mode mismatch","One fixture power-cycled separately"],
        fix:["Turn all light circuits off for 30 seconds, then choose the same saved color/show","If using Color Sync or IntelliCenter, confirm each light is assigned to the correct circuit/group","Avoid mixing unsupported generations in the same synchronized group","If one light never follows, isolate that fixture and test voltage/control"],
        severity:"medium", callpro:false },
      { code:"GLOBRITE-FAIL", name:"GloBrite / Nicheless Light Early Failure",
        causes:["Water intrusion at nicheless fitting","Heat or voltage stress","Transformer under/over voltage","Fixture electronics failed"],
        fix:["Confirm transformer voltage and wattage capacity","Inspect fixture/niche for water intrusion or damaged gasket/seal","Verify cord was not shortened/spliced outside approved junction location","Replace fixture if sealed electronics failed; most nicheless LED units are not board-serviceable"],
        severity:"medium", callpro:true },
      { code:"BUBBLER-DIM", name:"ColorVision Bubbler Light Dim / Weak Water",
        causes:["Low flow through bubbler line","Debris in nozzle or flow control","Light lens dirty or scaled","Pump speed too low during feature mode"],
        fix:["Increase feature pump speed and check valve position","Remove and clean bubbler nozzle/lens per manual","Balance flow if multiple bubblers are uneven","Inspect for air leaks or obstruction in feature plumbing"],
        severity:"low", callpro:false }
    ]
  },
  "Automation - IntelliCenter / EasyTouch / IntelliTouch": {
    models:["IntelliCenter","EasyTouch","IntelliTouch","ScreenLogic","IntelliCenter2 app","Wireless Remote"],
    codes:[
      { code:"NO-COMM", name:"Panel / Remote No Communication",
        causes:["Outdoor panel needs reset","Wireless link or antenna issue","RS-485 cable damaged","Firmware or address mismatch"],
        fix:["Press reset at outdoor control panel or power cycle high-voltage breaker for 30 seconds","Check antenna/transceiver wiring and status lights","Inspect RS-485 green/yellow conductors for loose strands or corrosion","Confirm each remote/device has a unique address"],
        severity:"medium", callpro:false },
      { code:"PUMP-NO-COMM", name:"IntelliFlo / IntelliFlo3 No Communication",
        causes:["RS-485 polarity or connection fault","Pump address mismatch","Pump not on constant power","Automation cable disconnected at drive"],
        fix:["Give pump constant line power and let automation control speed by data","Check RS-485 wiring at pump and automation board","Reset/reassign pump address if needed","If display says Display Not Active, that can be normal under automation control"],
        severity:"high", callpro:true },
      { code:"LIGHT-CIRCUIT", name:"Light Circuit Not Responding",
        causes:["Relay failed or circuit not assigned","Transformer not fed from correct relay","Light group/feature circuit misconfigured","GFCI tripped downstream"],
        fix:["Verify circuit assignment in IntelliCenter/EasyTouch","Listen/measure relay output when command is pressed","Check transformer primary and secondary voltage","Reset GFCI and inspect load if it trips again"],
        severity:"medium", callpro:false },
      { code:"VALVE-ACTUATOR", name:"Valve Actuator Not Moving",
        causes:["Actuator toggle switch off or in wrong position","24VAC missing","Cam/limit switch failed","Valve body seized"],
        fix:["Check actuator toggle switch and assigned valve circuit","Test 24VAC at actuator cable when commanded","Remove actuator and manually turn valve to confirm it is not seized","Adjust cams/limit switches only after marking original position"],
        severity:"medium", callpro:false }
    ]
  },
  "Water Features - MagicStream / Deck Jets / Bubblers": {
    models:["MagicStream Laminar","Deck Jet II","ColorVision Bubbler","MagicFlame","Sheer descent features"],
    codes:[
      { code:"FEATURE-NO-FLOW", name:"Water Feature Has No Flow",
        causes:["Feature valve closed","Pump speed too low","Filter dirty or return restriction","Nozzle clogged with debris"],
        fix:["Confirm feature valve/actuator position","Increase pump RPM for feature mode","Clean filter and pump basket","Remove and flush deck jet/laminar nozzle"],
        severity:"low", callpro:false },
      { code:"LAMINAR-BROKEN-STREAM", name:"Laminar Stream Broken / Splashing",
        causes:["Air in line","Debris in laminar canister","Flow too high or too low","Nozzle not level"],
        fix:["Purge air from feature line","Clean laminar screen/canister","Adjust flow slowly until stream becomes clear","Level nozzle and verify lid is not disturbing stream"],
        severity:"low", callpro:false }
    ]
  },
  "UV / Water Treatment - BioShield": {
    models:["BioShield UV","Commercial BioShield UV","UV water treatment"],
    codes:[
      { code:"UV-NO-LAMP", name:"BioShield UV Lamp Not On",
        causes:["Lamp expired","Ballast failed","Safety interlock open","No flow or controller disabled"],
        fix:["Verify power and interlock before opening housing","Replace lamp and clean sleeve on schedule","Check ballast output only with proper electrical safety","Confirm flow interlock is closed when pump runs"],
        severity:"medium", callpro:true }
    ]
  }
});

Object.assign(window.ERROR_DB.jandy.categories, {
  "Salt - TruClear / AquaPure / Drop-In Cells": {
    models:["TruClear Salt Chlorinator","TruClear XL","TRUCLEAR11K","TRUCLEARXL","AquaPure","Jandy drop-in replacement salt cells","TruClear cell body","TruClear cleaning cap"],
    codes:[
      { code:"TRUCLEAR-CHECK-CELL", name:"TruClear Check Cell / Visual Scale Inspection",
        causes:["Calcium scale visible on blades","Salt level outside operating range","Cell nearing end of service life","Low-flow operation reducing production","Cell polarity cycle cannot clear buildup"],
        fix:["Use the clear viewing window to inspect blades before removing the cell","Confirm salt level with an independent salt test before adding salt","If scale is visible, remove the cell and clean only per Jandy procedure","Do not guess from display alone; capture controller display, cell window, and water test proof before ordering"],
        severity:"medium", callpro:false },
      { code:"TRUCLEAR-LOW-OUTPUT", name:"TruClear Low Chlorine Output",
        causes:["Output percentage too low for bather load","Pump runtime too short","CYA too low for outdoor salt pool","Cell scaled or aging","Water temperature or low-flow condition reducing production"],
        fix:["Manually test FC, CYA, pH, and salt before changing hardware","Verify pump schedule and TruClear output percentage","Inspect the transparent window for blade scale","Supplement with liquid chlorine when the pool is behind; do not rely on the cell to recover a zero-FC pool quickly"],
        severity:"medium", callpro:false },
      { code:"TRUCLEAR-SERVICE-CAP", name:"Clean Cell While Circulating",
        causes:["Cell needs cleaning during a route stop","Tech wants to continue pump/filter service while the cell is out","Missing cap or wrong replacement fit"],
        fix:["Confirm the installed body and cap match the TruClear service procedure","Shut production off before removing the cell","Use the service/winterizing cap only as intended so circulation can continue while the cell is cleaned","Photograph the cell body, cap, and controller before leaving the stop"],
        severity:"low", callpro:false },
      { code:"TRUCLEAR-DROP-IN-FIT", name:"Drop-In Replacement Fit Check",
        causes:["Existing chlorinator footprint may not match","Competitor cell dimensions or unions unknown","Power/control compatibility not verified","SKU matchup incomplete"],
        fix:["Use the current manufacturer drop-in guide for dimensions and SKU matchups","Photograph the existing cell, unions, controller, and available straight pipe","Verify voltage/control requirements and AquaLink integration before quoting","Do not claim drop-in fit until measurements and model numbers are confirmed"],
        severity:"medium", callpro:false }
    ]
  },
  "Lighting - WaterColors / HydroCool / Infinite WaterColors": {
    models:["WaterColors LED","WaterColors Nicheless HydroCool","Infinite WaterColors","Jandy LED WaterFeatures","AquaLink light control"],
    codes:[
      { code:"LIGHT-NO-POWER", name:"Jandy Light Will Not Turn On",
        causes:["GFCI/breaker tripped","Transformer or relay not powering circuit","Bad fixture/driver","Water intrusion at fixture or junction box"],
        fix:["Reset GFCI and confirm it holds","Measure transformer output and relay line/load voltage","Inspect junction box for water/corrosion","If correct voltage reaches fixture and no light output, replace fixture"],
        severity:"high", callpro:true },
      { code:"LIGHT-COLOR-SYNC", name:"WaterColors Not Syncing / Wrong Color",
        causes:["Manual power-cycle sequence out of sync","AquaLink light type not configured correctly","Mixed fixture generations","One light on separate relay"],
        fix:["Turn all lights off for 30 seconds and restart same show together","Confirm AquaLink assigns each light to the correct circuit/group","Avoid grouping incompatible generations when consistent shows matter","Verify all fixtures share the intended transformer/relay control"],
        severity:"medium", callpro:false },
      { code:"HYDROCOOL-DIM", name:"HydroCool Nicheless Light Dim",
        causes:["Dirty lens","Voltage drop at long run","Incorrect transformer sizing","Fixture nearing failure"],
        fix:["Clean lens and inspect for scale","Measure voltage at junction box under load","Confirm transformer wattage supports total lighting load","If voltage is good and lens is clean, fixture replacement may be needed"],
        severity:"medium", callpro:false }
    ]
  },
  "Automation - AquaLink RS / iAquaLink": {
    models:["AquaLink RS","AquaLink PDA","iAquaLink 2.0","iAquaLink 3.0","AquaPure integration"],
    codes:[
      { code:"WAITING-CONNECTION", name:"iAquaLink Waiting For Connection",
        causes:["Wi-Fi/Ethernet connection lost","Device registration issue","Router changed SSID/password","Weak signal at equipment pad"],
        fix:["Verify local power center works from service buttons first","Check iAquaLink Wi-Fi/Ethernet status and router connection","Reboot power center and network hardware","Re-register device only after confirming network connection"],
        severity:"medium", callpro:false },
      { code:"EQUIPMENT-NOT-RESPONDING", name:"Equipment Not Responding From App",
        causes:["iAquaLink module connected to internet but not communicating with RS power center","4-wire RS-485 cable fault","Address conflict between remotes","Power center PCB issue"],
        fix:["Inspect 4-wire cable between iAquaLink J-box and red 4-pin connector","Check HELP/REMOTES or diagnostics for device visibility","Confirm ID jumpers/addresses are unique where multiple remotes exist","If service buttons work but app control does not, isolate iAquaLink communication path"],
        severity:"high", callpro:true },
      { code:"AQUAPURE-OFFLINE", name:"AquaPure / Salt System Offline",
        causes:["AquaPure board not powered","RS-485 wiring fault","Cell/controller not assigned","Blown fuse or failed board"],
        fix:["Check AquaPure power and fuse","Inspect RS-485 wiring at power center","Verify salt system is enabled/assigned in AquaLink","Confirm cell diagnostics at AquaPure panel before replacing automation board"],
        severity:"medium", callpro:true },
      { code:"ACTUATOR-STUCK", name:"Jandy Valve Actuator Stuck",
        causes:["Toggle switch off","Limit cam misadjusted","Actuator motor failed","Valve diverter seized"],
        fix:["Check actuator toggle switch and command from service panel","Remove actuator and turn valve manually","Inspect cams/limit switches and wiring","Replace actuator if motor does not run with confirmed 24VAC"],
        severity:"medium", callpro:false }
    ]
  }
});

window.ERROR_DB.cmp_pal_lighting = {
  label:"CMP / PAL / S.R. Smith Lighting",
  color:"#9333ea",
  categories:{
    "Lighting - Retrofit / Nicheless / Water Feature": {
      models:["CMP Brilliant Wonders LED","CMP Smart Sync","PAL Treo","PAL EvenGlow","S.R. Smith Treo","S.R. Smith Mod-Lite","S.R. Smith Kelo","J&J Electronics VU"],
      codes:[
        { code:"RETROFIT-FIT", name:"Retrofit Light Fit / Compatibility Check",
          causes:["Wrong niche adapter or 1.5 inch fitting requirement","Controller mode mismatch with Pentair/Hayward/Jandy system","Cord length or conduit path incompatible","Transformer wattage too small"],
          fix:["Verify niche/fitting type before ordering","Confirm voltage, color-control mode, and automation compatibility","Measure cord route to junction box; do not plan underwater splices","Sum fixture wattage and confirm transformer capacity with margin"],
          severity:"medium", callpro:false },
        { code:"SMART-SYNC", name:"Water Feature Lights Not Syncing",
          causes:["Controller not programmed for the installed light family","Power-cycle timing mismatch","Mixed brand compatibility mode issue","Shared transformer overloaded"],
          fix:["Set controller/programming to the intended brand mode","Power all lights off together before selecting color/show","Test one light at a time to find non-following fixture","Check transformer load and voltage under load"],
          severity:"medium", callpro:false },
        { code:"LANDSCAPE-DIM", name:"Landscape / Strip Light Dim Or Flickering",
          causes:["Voltage drop on low-voltage run","Undersized wire or transformer","Water in connector","Damaged strip segment"],
          fix:["Measure voltage at farthest fixture while lights are on","Use proper low-voltage wire gauge and transformer tap","Replace wet/corroded connectors","Isolate strip sections to find damaged segment"],
          severity:"low", callpro:false }
        ]
      }
    }
};

window.ERROR_DB.robots_expanded = {
  label:"Robot Cleaners / Smart Robots",
  color:"#0f766e",
  categories:{
    "Robotic Cleaners - Dolphin / Polaris / Aiper / Beatbot / WYBOT / Ecovacs / iGarden": {
      models:["Dolphin Explorer","Dolphin Premier","Dolphin Nautilus","Maytronics Dolphin Liberty","Polaris Alpha iQ","Polaris 9550","Polaris FREEDOM","Aiper Scuba","Aiper Seagull","Beatbot AquaSense","Beatbot AquaSense Pro","WYBOT S2","WYBOT C1","Ecovacs Goat / Winbot pool concepts","iGarden K-series","Betta SE","Betta SE Plus","Hayward AquaVac","Pentair Prowler"],
      codes:[
        { code:"ROBOT-NO-POWER", name:"Robot Has No Power",
          causes:["GFCI outlet tripped","Power supply failed","Floating cable damaged","Battery depleted on cordless unit","Charging contacts corroded"],
          fix:["Test outlet/GFCI with known-good device","Inspect power supply LEDs and output","Check floating cable for cuts, kinks, or swollen sections","For cordless robots, clean charging contacts and fully charge before retest","Do not open sealed battery housings unless manufacturer service procedure allows it"],
          severity:"high", callpro:false },
        { code:"ROBOT-NOT-MOVING", name:"Robot Powers On But Does Not Move",
          causes:["Drive track/wheel jammed","Impeller or brush motor overloaded","Filter basket packed with debris","Drive motor failed"],
          fix:["Remove robot from pool and clear tracks, wheels, brushes, and impeller","Empty and rinse filter basket/canister","Run short test on deck only if manual permits","If one side never drives after cleaning, suspect drive motor or gearbox"],
          severity:"medium", callpro:false },
        { code:"ROBOT-NOT-CLIMBING", name:"Robot Will Not Climb Walls",
          causes:["Filters dirty reducing suction","Brushes worn","Water chemistry causing slick surfaces","Program set to floor-only mode","Impeller weak or blocked"],
          fix:["Clean filters thoroughly","Inspect brushes/tracks for wear","Confirm cleaning mode includes walls/waterline","Balance chemistry and brush algae/slime film","Clear impeller and check for strong discharge flow"],
          severity:"low", callpro:false },
        { code:"ROBOT-WIFI", name:"Robot App / Wi-Fi Pairing Failure",
          causes:["2.4 GHz network required","Bluetooth/location permission missing during setup","Robot paired to old account/network","Weak Wi-Fi at pool area"],
          fix:["Use 2.4 GHz Wi-Fi during pairing and stand near power supply/robot","Enable app permissions required for pairing","Remove old device registration before adding again","Move router/mesh node or use stronger outdoor coverage"],
          severity:"low", callpro:false },
        { code:"ROBOT-WATER-INTRUSION", name:"Water In Electronics / Battery Area",
          causes:["Seal or housing crack","Charging-port gasket failure","Robot stored wet or dropped","Improper service opening"],
          fix:["Stop using and do not charge until fully inspected","Dry exterior and check warranty/service route","Inspect gaskets, covers, and housing for cracks","Water intrusion in battery/electronics is a service or replacement issue"],
          severity:"high", callpro:true },
        { code:"ROBOT-SHORT-RUNTIME", name:"Cordless Robot Short Runtime",
          causes:["Battery not fully charged","Charging contacts dirty","High debris load increasing motor draw","Cold water reducing battery output","Battery aging"],
          fix:["Clean and dry charging contacts before charging","Confirm full charge/dock status before route use","Empty basket and remove hair/string from tracks and impeller","Run a lighter cycle to compare runtime","If runtime stays far below spec, check warranty/service route before opening sealed battery housings"],
          severity:"medium", callpro:false },
        { code:"ROBOT-MAPPING-MISS", name:"AI Mapping / Navigation Miss",
          causes:["Pool shape not fully mapped","Waterline or sun glare confusing sensors","Obstacles, ledges, or benches interrupting route","Firmware/app issue","Dirty optical/ultrasonic sensor window"],
          fix:["Run a full learning cycle per app/manual","Clean sensor windows and basket","Remove loose toys, hoses, and large debris before cycle","Check for firmware/app updates","Document pool shape/ledge issue before calling vendor support"],
          severity:"low", callpro:false },
        { code:"ROBOT-DOCK-ISSUE", name:"Self-Dock / Charging Station Failure",
          causes:["Dock not level or positioned per manual","Power supply/GFCI issue","Contacts fouled with scale or debris","Robot cannot navigate to dock","Low Wi-Fi/Bluetooth handoff"],
          fix:["Place dock exactly per manufacturer spacing and depth guidance","Test GFCI/outlet and inspect power supply LED","Clean robot and dock contacts","Run a manual return-to-dock cycle if supported","Capture app error screen before support escalation"],
          severity:"medium", callpro:false },
        { code:"ROBOT-DEBRIS-DETECT", name:"Debris Recognition / Dirty Pool Miss",
          causes:["Filter basket full","Camera/sensor window dirty","Fine debris too small for selected filter panel","Cleaning cycle too short","AI mode not selected"],
          fix:["Empty basket and install fine filter panel if available","Clean camera/sensor window","Run floor/wall/waterline cycle instead of quick mode","Brush heavy algae or fine silt before relying on robot","Use manual vacuum for heavy cleanup when robot keeps recirculating debris"],
          severity:"low", callpro:false }
      ]
    }
  }
};

window.ERROR_DB.connected_pool_brain = {
  label:"Connected Pool Brain",
  color:"#2563eb",
  categories:{
    "Automation / Smart Backyard": {
      models:["Pentair IntelliCenter","Pentair EasyTouch","Hayward OmniLogic","Hayward OmniPL","Jandy AquaLink RS","iAquaLink","Zodiac iAquaLink","CCEI Vigipool","CCEI Tild VP","CCEI Antea VS","RS-485 pumps","Smart heaters","Valve actuators","App-connected lighting"],
      codes:[
        { code:"SMART-OFFLINE", name:"Pool App Shows System Offline",
          causes:["Wi-Fi/Ethernet lost at equipment pad","Router credentials changed","Controller cloud service/account issue","Controller needs reboot","Weak outdoor signal"],
          fix:["Confirm local control at the panel first","Check Ethernet/Wi-Fi signal and router changes","Power cycle controller using normal shutdown before breaker cycle","Wait several minutes before judging cloud reconnection","Capture app screen and controller network page before vendor escalation"],
          severity:"medium", callpro:false },
        { code:"RS485-NO-COMM", name:"RS-485 Device Not Communicating",
          causes:["A/B polarity reversed","Loose low-voltage terminal","Address conflict","Pump has relay power instead of constant line power","Damaged data cable"],
          fix:["Photograph wiring before moving conductors","Verify A/B polarity and shield/grounding per manual","Confirm device address and automation assignment","Give VS pump constant line power when controlled by data","Test continuity if communication drops intermittently"],
          severity:"medium", callpro:true },
        { code:"RELAY-WRONG-LOAD", name:"Wrong Device Turns On From App",
          causes:["Relay labels do not match actual load","Schedule assigned to wrong circuit","Aux names changed after service","Shared transformer/load confusion"],
          fix:["Use service mode and test one relay at a time","Relabel physical relay/load mapping","Verify automation circuit names and schedules","Check transformer load before combining lights/features","Save/export configuration before major changes"],
          severity:"medium", callpro:false },
        { code:"ACTUATOR-NO-MOVE", name:"Valve Actuator Does Not Move From Automation",
          causes:["Actuator toggle switch off","Cam switch at limit","24VAC missing","Aux/valve assignment wrong","Actuator motor failed"],
          fix:["Check actuator toggle switch and listen for motor","Verify 24VAC at actuator command","Confirm valve assignment in controller","Mark cam positions before adjustment","Replace actuator only after power and assignment are verified"],
          severity:"medium", callpro:false }
        ,
        { code:"CCEI-VS-COMM", name:"CCEI Antea VS / Vigipool Pump Control Issue",
          causes:["Antea VS antenna not paired to Vigipool app","Tild VP automation supply not configured","Pump model/control mode not supported","Weak wireless signal at pump room","Power to pump/controller interrupted"],
          fix:["Confirm exact pump model and Antea VS compatibility before promising control","Verify Tild VP and Vigipool app see the same equipment room device","Check pump has proper line power and the automation controller is not cycling it incorrectly","Capture app pairing screen, controller label, and pump model plate for vendor support"],
          severity:"medium", callpro:false }
      ]
    }
  }
};

window.ERROR_DB.smart_chem_dispensers = {
  label:"Smart Chemical Dispensers",
  color:"#0d9488",
  categories:{
    "Connected Chlorine / pH / ORP Devices": {
      models:["SunnyWhale FinWhale","smart chlorine dispenser","app-connected tablet dispenser","ORP sensor dispenser","pH sensor dispenser","temperature sensor dispenser"],
      codes:[
        { code:"SMART-FEED-VERIFY", name:"Smart Dispenser Reading Needs Verification",
          causes:["Probe drift","Free chlorine sensor not matching manual test","ORP affected by pH/CYA/temperature","Tablet feeder empty or bridged","App trend stale or offline"],
          fix:["Verify FC, pH, ORP, and temperature with manual tests before trusting dosing changes","Check tablet level and dispenser flow path","Look for app alerts for pH drift, low tablets, battery, or probe replacement","Do not let an app-connected feeder overrule unsafe manual test results"],
          severity:"high", callpro:false },
        { code:"SMART-FEED-LOW-TABLETS", name:"Low Tablets / No Chlorine Feed",
          causes:["Tablet chamber empty","Wet tablets bridged together","Flow path blocked","Dispenser battery low","App notification ignored"],
          fix:["Open only per manufacturer safety steps and PPE","Refill with compatible tablets only","Clear flow path and verify water movement through the dispenser","Confirm app shows fresh readings after service"],
          severity:"medium", callpro:false },
        { code:"SMART-FEED-PROBE", name:"pH / ORP / Chlorine Probe Replacement Flag",
          causes:["Probe aged out","Probe coated with scale or biofilm","Calibration drift","Low sample movement around device","Battery threshold reached"],
          fix:["Clean probe according to manufacturer instructions","Compare against a reliable manual test before calibration or replacement","Check battery and sample movement","Record probe age and app alert screenshot for the service proof packet"],
          severity:"medium", callpro:false }
      ]
    }
  }
};

window.ERROR_DB.handheld_vacuums = {
  label:"Handheld Vacuums / Leaf Vacs",
  color:"#0891b2",
  categories:{
    "Battery Pool / Spa Vacuums": {
      models:["Water Tech Volt Leaf Vac","Water Tech Volt FX-Series","Pool Blaster","battery handheld vacuum","spa vacuum"],
      codes:[
        { code:"VAC-NO-SUCTION", name:"Handheld Vac Has Weak Or No Suction",
          causes:["Debris bag/cup full","Impeller clogged","Battery low","Seal or bag not seated","Fine silt passing through wrong filter media"],
          fix:["Empty and rinse debris bag/cup","Clear impeller and intake path","Fully charge battery before judging motor strength","Reseat seals and bag collar","Use fine filter media for silt and normal bag for leaves"],
          severity:"low", callpro:false },
        { code:"VAC-NO-CHARGE", name:"Battery Vac Will Not Charge",
          causes:["Charging contacts wet or corroded","Charger failed","Battery aged out","Unit stored discharged","Water intrusion"],
          fix:["Dry and clean contacts before charging","Test charger output if available","Do not charge if water intrusion is suspected","Check warranty/service route if runtime remains poor after a full charge"],
          severity:"medium", callpro:false }
      ]
    }
  }
};

window.ERROR_DB.spa_hot_tub = {
  label:"Hot Tubs / Spas",
  color:"#7c3aed",
  categories:{
    "Spa Plumbing / Jets / Sanitation": {
      models:["hot tub plumbing","swim spa plumbing","jet pump","spa pack","ozone spa system","mineral cartridge","FROG @ease","FROG Serene","pipe and jet cleanser"],
      codes:[
        { code:"SPA-JET-LOW-FLOW", name:"Spa Jets Weak Or Uneven",
          causes:["Filter dirty","Air control closed or leaking","Jet insert clogged","Pump air lock","Slice valve partly closed"],
          fix:["Remove and clean spa filter first","Open/adjust air controls and listen for air draw","Remove and rinse suspect jet inserts","Bleed air from pump union only if trained and safe","Verify valves are fully open after service"],
          severity:"medium", callpro:false },
        { code:"SPA-PIPE-BIOFILM", name:"Spa Pipe / Jet Biofilm Flush Needed",
          causes:["Biofilm in plumbing","High bather load","Long drain interval","Sanitizer kept too low","Foam/odor after jets run"],
          fix:["Use a spa pipe and jet purge product before draining when biofilm is suspected","Run jets per product label, then drain and rinse thoroughly","Clean filters separately","Refill and balance water before sanitizer startup"],
          severity:"medium", callpro:false },
        { code:"SPA-NO-HEAT", name:"Spa Not Heating",
          causes:["Flow switch open due to dirty filter","Heater relay or element fault","Temperature sensor issue","Spa pack in economy/sleep mode","Breaker/GFCI issue"],
          fix:["Remove filter briefly only as a diagnostic if safe; replace/clean if flow returns","Confirm mode and setpoint","Check for flow/pressure error on display","Electrical heater checks require qualified service"],
          severity:"high", callpro:true },
        { code:"SPA-CHEM-DRIFT", name:"Spa Sanitizer Or pH Drifts Fast",
          causes:["Small water volume changes quickly","High temperature burns off sanitizer","Bather waste high","Alkalinity not stable","Feeder/mineral cartridge depleted"],
          fix:["Test before adding chemicals; small spas overdose easily","Adjust TA/pH in small increments","Shock/oxidize after high-use periods","Check cartridge/feeder date and replace on schedule","Drain/refill when TDS or age makes balancing impractical"],
          severity:"medium", callpro:false }
      ]
    }
  }
};

window.ERROR_DB.water_features_valves = {
  label:"Water Features / Valves / Actuators",
  color:"#0ea5e9",
  categories:{
    "Deck Jets / Laminars / Bubblers / Waterfalls": {
      models:["CMP Deck Jets","CMP Laminars","Pentair MagicStream","Jandy Deck Jets","Sheer descents","Bubblers","Water bowls"],
      codes:[
        { code:"FEATURE-LOW-FLOW", name:"Low Or Uneven Water Feature Flow",
          causes:["Feature valve partly closed","Dirty filter or low pump speed","Nozzle clogged","Air leak on suction side","Multiple features not balanced"],
          fix:["Open/adjust feature valve and increase pump RPM","Clean filter and pump basket","Remove and flush nozzles or laminar screens","Balance each feature valve one at a time","Check for air in pump basket indicating suction leak"],
          severity:"low", callpro:false },
        { code:"FEATURE-LEAK", name:"Water Feature Leaking / Draining Back",
          causes:["Check valve failed","Cracked feature body or fitting","Loose union","Winter freeze damage"],
          fix:["Inspect feature plumbing and check valve","Pressure test suspect feature line if leak is hidden","Replace cracked fittings or feature body","Winterize feature lines in freeze climates"],
          severity:"medium", callpro:true },
        { code:"ACTUATOR-WRONG-DIRECTION", name:"Actuator Turns Wrong Direction",
          causes:["Toggle switch set opposite desired direction","Cams adjusted incorrectly","Valve mounted 180 degrees from expected orientation"],
          fix:["Use actuator toggle switch to reverse direction if appropriate","Mark original cam positions before adjustment","Adjust open/close cams in small steps","Verify automation labels match actual valve function"],
          severity:"low", callpro:false }
      ]
    }
  }
};

window.ERROR_DB.advanced_sanitizers = {
  label:"UV / Ozone / AOP / Feeders",
  color:"#14b8a6",
  categories:{
    "UV / Ozone / AOP Systems": {
      models:["CMP DEL Ozone","DEL AOP","Paramount Clear O3","Ultra UV2","Hayward HydraPure","Pentair BioShield","AOP 40"],
      codes:[
        { code:"AOP-FLOW", name:"AOP / UV / Ozone Flow Fault",
          causes:["Pump not running","Flow switch stuck open","Bypass valve closed","Dirty filter lowering flow"],
          fix:["Confirm circulation pump is running at required speed","Open bypass/isolation valves","Clean filter and verify flow through treatment chamber","Test flow switch with confirmed water movement"],
          severity:"medium", callpro:false },
        { code:"UV-SLEEVE", name:"UV Sleeve Dirty / Low UV Performance",
          causes:["Scale on quartz sleeve","Lamp aged out","High calcium hardness or poor water balance","Sensor window fouled"],
          fix:["Clean quartz sleeve with approved cleaner and gloves","Replace lamp at rated interval even if it still glows","Correct water balance to reduce scaling","Clean UV sensor window if present"],
          severity:"low", callpro:false },
        { code:"OZONE-CHECKVALVE", name:"Ozone Check Valve / Water Backflow",
          causes:["Check valve failed","Injector vacuum weak","Tubing routed below water level","Pump off siphon condition"],
          fix:["Replace check valve immediately if water is in ozone tubing","Verify injector vacuum when pump runs","Route tubing per manual with high loop where required","Inspect ozone module for water damage before restarting"],
          severity:"high", callpro:false }
      ]
    },
    "Liquid / Tablet Feeders": {
      models:["Rola-Chem pumps","Stenner pumps","Hayward chlorinators","Pentair Rainbow feeders","Liquid chlorine feeders","Acid feed pumps"],
      codes:[
        { code:"FEED-NO-DRAW", name:"Feeder Pump Not Drawing Chemical",
          causes:["Empty tank","Suction tube cracked or clogged","Pump tube worn flat","Injection fitting blocked","Loss of prime"],
          fix:["Confirm tank level and suction weight position","Inspect/replace suction tubing and pump tube","Clean injection fitting/check valve","Prime pump with PPE and proper chemical handling"],
          severity:"medium", callpro:false },
        { code:"FEED-OVERFEED", name:"Chemical Feeder Overfeeding",
          causes:["Pump timer/program wrong","Stuck relay","ORP/pH probe reading falsely low/high","Siphon through injection line"],
          fix:["Disable feeder until water is manually tested","Check relay output and feed schedule","Clean/calibrate probe before trusting controller demand","Install/inspect anti-siphon valve"],
          severity:"high", callpro:true }
      ]
    }
  }
};

window.ERROR_DB.chemical_controllers = {
  label:"Commercial Chem Controllers",
  color:"#dc2626",
  categories:{
    "pH / ORP / FAC Controllers": {
      models:["Rola-Chem","CAT Controllers","BECS","Chemtrol","IPS Controllers","Prominent","Walchem","Pulsar","VivoAquatics"],
      codes:[
        { code:"ORP-LOW", name:"ORP Low / Chlorine Demand High",
          causes:["True low sanitizer","Dirty or failed ORP probe","pH too high suppressing ORP","CYA high in outdoor pool","Flow cell not moving water"],
          fix:["Verify sanitizer with calibrated manual test before feeding more chemical","Clean ORP probe and confirm flow through cell","Check pH and CYA because they change ORP behavior","Calibrate/replace probe if reading does not respond to known standard"],
          severity:"high", callpro:true },
        { code:"PH-HIGH", name:"pH High Alarm",
          causes:["True pH high","Acid tank empty","Acid feed pump not primed","pH probe dirty or out of calibration","Injection fitting blocked"],
          fix:["Manual test pH before feeding","Check acid tank, pump tube, suction line, and injection fitting","Clean and calibrate pH probe","Do not overfeed acid based on an unverified probe reading"],
          severity:"high", callpro:true },
        { code:"FLOW-CELL", name:"No Flow Through Sample Cell",
          causes:["Sample line clogged","Strainer dirty","Flow switch failed","Pump off or valves closed"],
          fix:["Open sample valves and clean strainer","Flush sample line and flow cell","Confirm controller flow switch closes with water movement","Do not allow controller to feed chemical without verified flow interlock"],
          severity:"high", callpro:true },
        { code:"PROBE-DRIFT", name:"Probe Drift / Unstable Readings",
          causes:["Probe aged out","Probe stored dry","Grounding/bonding noise","Dirty probe tip","Air bubbles in flow cell"],
          fix:["Clean probe and recalibrate with fresh standards","Remove bubbles and confirm steady sample flow","Check bonding/grounding and nearby electrical noise","Replace probe if it cannot hold calibration"],
          severity:"medium", callpro:true }
      ]
    }
  }
};

window.ERROR_DB.automatic_covers = {
  label:"Automatic Covers",
  color:"#64748b",
  categories:{
    "Automatic Pool Covers - Coverstar / Cover-Pools / APC": {
      models:["Coverstar","Cover-Pools","Automatic Pool Covers Inc.","Coverstar Central","Save-T Cover","PowerTouch"],
      codes:[
        { code:"COVER-NO-MOVE", name:"Cover Will Not Open Or Close",
          causes:["Key switch/controller not sending power","Breaker/GFCI tripped","Motor thermal overload","Cover track obstructed","Mechanism jammed"],
          fix:["Check breaker/GFCI and controller power","Remove leaves/debris from tracks and box","Let motor cool if it stopped mid-cycle","Do not force a jammed cover; inspect ropes, pulleys, and mechanism","Keep people out of pool area while troubleshooting"],
          severity:"high", callpro:true },
        { code:"COVER-CROOKED", name:"Cover Travels Crooked",
          causes:["Rope tension uneven","Track obstruction","Fabric waterlogged or overloaded","Pulley/guide wear","Mechanism out of alignment"],
          fix:["Stop operation before fabric binds","Clear both tracks and pump standing water from cover","Inspect ropes and pulleys for fray/wear","Adjustments to rope reels/mechanism should be handled by cover service if severe"],
          severity:"medium", callpro:true },
        { code:"COVER-WATERLOAD", name:"Water On Cover / Cover Sagging",
          causes:["Cover pump missing or failed","Rain load exceeding safe operation","Fabric stretched or support low","Drain path blocked"],
          fix:["Pump water off cover before operating","Never open cover with heavy standing water","Inspect automatic cover pump and power","Schedule fabric/mechanism inspection if sagging remains after water removal"],
          severity:"high", callpro:false },
        { code:"COVER-SAFETY", name:"Safety / Manual Operation Warning",
          causes:["Emergency/manual operation needed","Power failure","Cover used as only safety layer"],
          fix:["Follow manufacturer manual for manual operation; do not improvise around mechanism","Keep switch/key under responsible control and maintain line of sight","Treat cover as one safety layer, not the only protection","Call cover specialist for rope, motor, or mechanism failures"],
          severity:"high", callpro:true }
      ]
    }
  }
};
