# Sources

Where every number in the Apollo 11 descent comes from. This file is written from
`model/sources.ts` by `npx tsx scripts/physics-sources.ts`; edit the registry, not this file.

The flight software is cited, never copied: line numbers refer to Luminary 099 (the Lunar Module's
program on Apollo 11) in the public transcription at https://github.com/chrislgarry/Apollo-11, commit `e7576d50f7c279a707cfaa71be2020592dbf43a8`.
The historical checks cite NASA SP-4029, Apollo by the Numbers: Apollo 11 timeline (history.nasa.gov/SP-4029/Apollo_11i_Timeline.htm).

## From the flight software

| Name | Value | What it is | Source |
|---|---|---|---|
| DPS thrust | 43,670.416 N | The descent engine’s rated thrust: 9,817.5 lbf. | `CONTROLLED_CONSTANTS.agc` line 36: `FDPS 2DEC 4.3670 B-7 # 9817.5 LBS FORCE IN NEWTONS` |
| DPS mass flow | 14.80 kg/s | Propellant flow at rated thrust: 32.62 lb/s. | `CONTROLLED_CONSTANTS.agc` line 37: `MDOTDPS 2DEC 0.1480 B-3 # 32.62 LBS/SEC IN KGS/CS` |
| FMAXODD | 48,145.441 N | The thrust at full throttle (the saturated, “odd” full-throttle position). | `CONTROLLED_CONSTANTS.agc` line 128: `FMAXODD DEC +3841 # FSAT +4.81454413 E+4` |
| FMAXPOS | 43,454.677 N | The highest thrust the throttle is positioned to below full throttle. | `CONTROLLED_CONSTANTS.agc` line 129: `FMAXPOS DEC +3467 # FMAX +4.34546769 E+4` |
| THROTLAG | 0.2000 s | The engine’s response lag the throttle command compensates for. | `CONTROLLED_CONSTANTS.agc` line 130: `THROTLAG DEC +20 # TAU (TH) +1.99999999 E-1` |
| Servicer cycle | 2 s | Guidance runs once per servicer pass, every two seconds. | `SERVICER.agc` line 73: `CA 2SECS # WAIT TWO SECONDS FOR READACCS` |
| Core sets | 7 jobs | How many jobs the executive can hold at once: 84 registers of core sets at 12 registers each. | `ERASABLE_ASSIGNMENTS.agc` line 374: `# DYNAMICALLY ALLOCATED CORE SETS FOR JOBS (84D)` |
| VAC areas | 5 areas | How many interpretive jobs can hold a vector accumulator at once (VAC1 to VAC5). | `ERASABLE_ASSIGNMENTS.agc` line 434: `VAC1USE ERASE … VAC5 ERASE +42D (lines 434–443)` |
| RODSCALE | 0.3048 m/s | How much one click of the rate-of-descent switch changes the commanded descent rate: 1 ft/s. | `ERASABLE_ASSIGNMENTS.agc` line 1391: `RODSCALE EQUALS LRWVFF +1 # I(1) CLICK SCALE FACTOR FOR ROD` |
| TAUROD | 1.500 s | The time constant in which P66 drives the descent rate to the commanded rate. | `ERASABLE_ASSIGNMENTS.agc` line 1392: `TAUROD EQUALS RODSCALE +1 # I(2) TIME CONSTANT FOR R.O.D.` |
| TENDBRAK | 60 s | Braking gives way to approach when the time to go to the braking target falls below this. | `LUNAR_LANDING_GUIDANCE_EQUATIONS.agc` line 692: `EXTLOGIC … CA TENDBRAK # WCHPHASE = 0 BRAKQUAD` |
| TENDAPPR | 12 s | The approach phase hands over to automatic vertical descent (P65) when its time to go falls below this. | `ERASABLE_ASSIGNMENTS.agc` line 2097: `TENDAPPR ERASE # B(1) LANDING PHASE SWITCHING CRITERION.` |
| P66 starts at the current rate |  | Entering P66 sets the desired altitude rate to the current altitude rate. | `LUNAR_LANDING_GUIDANCE_EQUATIONS.agc` line 147: `DCA HDOTDISP # SET DESIRED ALTITUDE RATE = CURRENT / DXCH VDGVERT # ALTITUDE RATE.` |
| Each click updates the rate |  | Each click of the rate switch adds RODSCALE to the desired altitude rate. | `LUNAR_LANDING_GUIDANCE_EQUATIONS.agc` line 953: `DAS VDGVERT # UPDATE DESIRED ALTITUDE RATE.` |
| A click in auto switches to P66 |  | During automatic landing, a click of the rate switch moves the program into P66. | `LUNAR_LANDING_GUIDANCE_EQUATIONS.agc` line 205: `CA RODCOUNT # NO. HAS THE ROD SWITCH BEEN "CLICKED"? … TCF STARTP66 # YES. SWITCH INTO THE ROD MODE.` |
| Quadratic guidance |  | Commanded acceleration: ACG = ADG + 6(VDG + VG)/TTF + 12(RDG − RG)/TTF², TTF the (negative) time to go. | `LUNAR_LANDING_GUIDANCE_EQUATIONS.agc` line 530: `# MAIN GUIDANCE EQUATION … ACG = ADG + 6(VDG + VG)/TTF + 12(RDG - RG)/(TTF)(TTF)` |
| Time to go |  | TTF is the root of the downrange jerk equation JDG·TTF³ + 6·ADG·TTF² + (18·VDG + 6·VG)·TTF + 24(RDG − RG) = 0, found by iteration from the last value. | `LUNAR_LANDING_GUIDANCE_EQUATIONS.agc` line 516: `TC ROOTPSRS # YIELDS TTF/8 IN MPAC` |
| 1202 |  | No core sets available: the executive could not hold another job. | `EXECUTIVE.agc` line 207: `TC BAILOUT1 # NO CORE SETS AVAILABLE. / OCT 1202` |
| 1201 |  | No VAC areas available: the executive could not give an interpretive job its work area. | `EXECUTIVE.agc` line 146: `TC BAILOUT1 / OCT 1201 # NO VAC AREAS.` |
| BAILOUT |  | An alarm through BAILOUT restarts the computer: jobs are dropped and the restart-protected ones (guidance) carry on. | `ALARM_AND_ABORT.agc` line 189: `BAILOUT1 INHINT` |
| Throttle recovery | 0.5700 of full thrust | Above this share of full thrust the engine stays at full throttle; below it the throttle follows guidance. | `THROTTLE_CONTROL_ROUTINES.agc` line 108: `# (BELOW 55%) THE QUANTITY -(FMAXODD - FP) IS COMPUTED …` |
| LPD angle | 1 ° | N64’s landing point designator angle: where the site sits on the window’s reticle. | `PINBALL_NOUN_TABLES.agc` line 726: `ECADR FUNNYDSP # 64 2INT 2INT` |
| ΔH | 0 m | N68’s third register: landing-radar altitude minus computed altitude. | `PINBALL_NOUN_TABLES.agc` line 740: `ECADR DELTAH # 68 COMP ALT DP1` |

## Approximations

Values the flight software doesn't hold (many descent targets were pad-loaded before flight, so the
source names them but carries no value), and places where the model simplifies.

| Name | Value | Why it is an approximation |
|---|---|---|
| RODSCALE | 0.3048 m/s | RODSCALE is pad-loaded, so the source names it but holds no value; 1 ft/s per click is the value the crews describe. |
| TAUROD | 1.500 s | Pad-loaded; 1.5 s is chosen for a steady response. |
| TENDBRAK | 60 s | TENDBRAK is pad-loaded (ERASABLE_ASSIGNMENTS.agc line 2096, “LANDING PHASE SWITCHING CRITERION”); 60 s is chosen so high gate falls near the flown altitude. |
| TENDAPPR | 12 s | Pad-loaded; 12 s is chosen so the vertical descent starts near low gate. |
| RBRFG (downrange) | -2,000 m | Pad-loaded (RBRFG, used as RDG at LUNAR_LANDING_GUIDANCE_EQUATIONS.agc line 1435). The braking targets and the ignition range were searched together so high gate falls near the flown 507 s and 7,000 ft. |
| RBRFG (altitude) | 600 m | Pad-loaded; see RBRFG. |
| VBRFG (downrange) | 40 m/s | Pad-loaded (VBRFG, line 1436). |
| VBRFG (altitude) | -30 m/s | Pad-loaded; see VBRFG. |
| ABRFG (downrange) | -2.500 m/s² | Pad-loaded (ABRFG, line 1437). |
| ABRFG (altitude) | 0 m/s² | Pad-loaded; see ABRFG. |
| RAPFG (downrange) | -30 m | Pad-loaded (RAPFG); chosen to end at low gate over the site. |
| RAPFG (altitude) | 30 m | Pad-loaded; see RAPFG. |
| VAPFG (downrange) | 1.500 m/s | Pad-loaded (VAPFG). |
| VAPFG (altitude) | -1 m/s | Pad-loaded; see VAPFG. |
| AAPFG (downrange) | 0 m/s² | Pad-loaded (AAPFG). |
| AAPFG (altitude) | 0 m/s² | Pad-loaded; see AAPFG. |
| P65 descent rate | -0.9144 m/s | P65 takes its rate from VDGVERT, which is set at run time (LUNAR_LANDING_GUIDANCE_EQUATIONS.agc line 1033); 3 ft/s is the documented automatic landing rate. |
| Time to go |  | The jerk target JDG is taken as zero (JBRFG and JAPFG are pad-loaded), so the equation is quadratic, and LEADTIME’s lag compensation (line 547) is left out. Without them the solved time to go lags as the vehicle slows, so here it may not fall behind the clock: each pass it is at least the last value plus the two-second period. |
| Descent load | 0.8500 of each cycle | A model of the cause, not an emulation: the AGC’s actual timing isn’t simulated. 85% is the figure usually given for the descent’s load. |
| Rendezvous radar steal | 0.1300 of each cycle | The figure usually given is about 13–15%; 13% is used. |
| Monitor display load | 0.08000 of each cycle | Chosen so that the extra display tips the load over, as it did when Aldrin called up N68. |
| Throttle recovery | 0.5700 of full thrust | The flight software throttles between FMAXPOS and FMAXODD by its own logic; a single 57% threshold stands in for it. With it, and without the jerk targets, the model throttles down at about 200 s where Apollo 11 did at 386 s (102:39:31); the timing of high gate and landing is matched instead. |
| LPD angle | 1 ° | Measured here between the line of sight to the site and the LM’s downward thrust axis; the window’s own geometry is left out. |
| ΔH | 0 m | Always 0: the model has no landing radar, so its altitude is exact. |
| LM mass at ignition | 15,095 kg | Mission data, not the flight software; rounded. |
| Descent propellant at ignition | 8,248 kg | Mission data, rounded. |
| Ignition altitude | 15,000 m | Mission data, rounded; the descent orbit’s low point. |
| Ignition speed | 1,692 m/s | From the descent orbit (60 by 8 nautical miles) at its low point, rounded. |
| Ignition range | 460,000 m | Searched with the braking targets so the braking phase lasts about as long as it did; the flight’s own ignition point came from the ignition algorithm. |
| Touchdown vertical limit | 3.048 m/s | The LM landing gear design limit, not a flight-software value. |
| Touchdown horizontal limit | 1.219 m/s | The LM landing gear design limit, not a flight-software value. |
| Lunar GM | 4,904,869,500,000 m³/s² | Modern value; the flight software carries its own (MUM). |
| Lunar radius at the site | 1,735,600 m | Rounded; the flight used RLS, the landing site vector, pad-loaded. |

## What the model leaves out

- The Moon is a sphere and the motion planar: the out-of-plane steering, the Moon's rotation and its
  terrain are left out, and the landing site is on the sphere.
- The executive is a model of why the 1202 happened (more work than the cycle had time for), not an
  emulation of the AGC: jobs are shares of a two-second cycle, not instructions.
- There is no landing radar: the computed altitude is exact, so N68's ΔH is always 0.
