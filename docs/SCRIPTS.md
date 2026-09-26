# SCHWARM — Script reference

Every script and embedded daemon, in plain English. Start with the [Beginner's Guide](GUIDE.md) if you are new.
All in-game messages are German; the guide has a small glossary.

## Contents
- [Start-up chain](#start-up-chain)
- [Core](#core)
- [Money and progress](#money-and-progress)
- [Side systems](#side-systems)
- [Payload daemons (embedded in SCHWARM-PAYLOADS.js, written to disk by the Queen)](#payload-daemons-embedded-in-schwarm-payloadsjs-written-to-disk-by-the-queen)
- [Optional tools](#optional-tools)

## Start-up chain

### SCHWARM-GENESIS.js (contains the embedded casino.js payload)

**What it does:** This is the script that starts everything, and the first step of the start-up chain GENESIS -> casino.js -> SCHWARM-ARSENAL.js -> SCHWARM-QUEEN.js. It first stops any old swarm processes. It then hacks with three small worker scripts (schwarm-w/g/h.js), weakening a target first, then growing it, then hacking it, until home holds $500,000. If you have SF4 it also trains at the gym and commits crimes. After that it writes out casino.js (Alain Bryden's blackjack bot, MIT licence), which plays and reloads the save whenever it loses until the casino bans you (about $10b in casino winnings). When the ban comes, casino.js starts ARSENAL.

**How it runs:** One-shot bootstrap script, not a daemon. You start it by hand once after installing. After that it starts automatically after every augmentation install or BitNode change, because the RESET payload calls installAugmentations("SCHWARM-GENESIS.js") and the BITNODE payload calls b1tflum3/destroyW0r1dD43m0n with it as the callback. `SCHWARM-CLEAN.js --restore` also starts it. It runs until home has $500k and then hands over. casino.js is started with --kill-all-scripts, so it also ends GENESIS. The casino runs only once per augmentation reset: the file /Temp/schwarm-casino-done.txt stores the reset timestamp. If the casino already ran in this reset, GENESIS skips it and starts SCHWARM-ARSENAL.js directly. A reset you do by hand in the game menus does not start GENESIS. In that case, type the run command yourself.

**Run it on its own:** run SCHWARM-GENESIS.js  (no arguments; the script reads no ns.args). Run it on home. It first kills every other script on home and on every network host (cleanupSwarm), so typing it restarts the whole swarm. The in-game terminal shows the log with `tail SCHWARM-GENESIS.js`. The script opens no tail window by itself.

**RAM:** Not in the DAEMONS registry, so there is no minRam. An older RAM measurement from 2026-09-05 (not the current code) showed about 11.25 GB. Check the current value in the game with `mem SCHWARM-GENESIS.js`. When it hands out worker threads it keeps 8 GB free on home (HOME_RESERVE). Early-start daemons may use at most 50% of the free home RAM.

**Needs:** SCHWARM-HELPERS.js and SCHWARM-PAYLOADS.js on home (it imports both). SCHWARM-ARSENAL.js for the handover, and SCHWARM-QUEEN.js after that. SF4 (Singularity) is optional. Without SF4 it only hacks. With SF4 it also does gym training, crimes, and the one-time pushes for gang, Bladeburner and sleeves. The casino step needs at least $200k to travel to Aevum. It uses Singularity travel if possible and otherwise clicks through the game menus. The game window must be open and usable: the Overview save button must be visible and the World/City menu must not be collapsed. The early-start daemons (DARKNET, STANEK, CORP, GO) only start if their test passes. DARKNET needs DarkscapeNavigator.exe, STANEK needs an existing gift or SF13/BitNode 13, CORP needs an existing corporation, and GO needs the IPvGO API to answer.

**On / off:** It has no switch, because it is not a registry daemon and cannot be turned off in the switch file or on the DASHBOARD. To stop it, run `kill SCHWARM-GENESIS.js`. To force the casino to run again in the same reset, delete /Temp/schwarm-casino-done.txt. It is intended to run only once per reset.

**Good to know:** What happens after start, in order: (1) It stops all old swarm processes and deletes the ARSENAL lock file. (2) It refreshes the backup SCHWARM-SICHERUNG.txt on home, copies it to n00dles as a mirror, and writes back any SCHWARM script that is missing but still in the backup. You will then see the warning 'fehlende(s) Skript(e) ... zurueckgeschrieben' ('missing script(s) ... written back'). (3) It restarts SCHWARM-DIAG.js only if a DIAG job is still unfinished in schwarm-diag-lauf.txt and home has enough RAM for it. (4) It writes the three worker scripts. (5) It starts the early daemons DARKNET, STANEK, CORP and GO if their tests pass, and gives gang members the best money task if you are in a gang. Bladeburner is deliberately left out. The early start does not check the switch file. The casino run kills these daemons again, but what they earned (rank, respect, charge, money) is kept. (6) With SF4, it trains all four combat stats to 10 at Powerhouse Gym in Sector-12 first (it travels there if needed). Per a code comment, your money can briefly go below zero from gym fees; the crimes pay it back. After that it commits the best crime among Homicide, Mug and Shoplift that has at least a 50% success chance. Every 15 s it also sets Bladeburner to Training, but only if you own The Blade's Simulacrum; otherwise the action slot stays with the crimes. It also puts sleeves on Synchronize, then Shock Recovery, then Idle. While casino.js is playing, do not click around in the game. It reloads the page to undo losses. It also deletes all files on other servers (not home) and clears /Temp on home. If navigation fails 5 times in a row it gives up and shows an error.

### SCHWARM-ARSENAL.js

**What it does:** The last start-up step before the Queen. It removes old eval-cache files from /Temp that are left over from before the reset. It detects the capabilities fresh (SF4, TIX, GANG, CORP, BLADE) and publishes them. With SF4 it buys the TOR router and only the DarkscapeNavigator, which opens Darknet mode; SCHWARM-DARKNET collects all other port openers later. It upgrades home RAM only up to the 64 GB minimum the Queen needs, and every purchase is logged to the chronicle. It turns the STANEK switch on, switches off daemons whose requirements are provably missing, sets the phase to SWARM, and starts SCHWARM-QUEEN.js.

**How it runs:** One-shot, and it ends after starting the Queen. It is started automatically by casino.js when the casino bans you (`--on-completion-script SCHWARM-ARSENAL.js`). If the casino already ran in this reset, SCHWARM-GENESIS.js starts it directly instead. So it runs once after every reset. A lock file (/Temp/schwarm-arsenal.lock, 15-second window) and a single-instance check stop it from running twice.

**Run it on its own:** run SCHWARM-ARSENAL.js  (no arguments). You can run it by hand if the chain stopped after the casino and the Queen never started. It kills nothing. If another ARSENAL started less than 15 s ago, it exits without a message.

**RAM:** Not in the DAEMONS registry, so there is no minRam. An older RAM measurement from 2026-09-05 (an older version) showed about 4.90 GB. Check the current value with `mem SCHWARM-ARSENAL.js`. Player stats are read through throwaway eval scripts, so ARSENAL itself does not pay for that RAM.

**Needs:** SCHWARM-HELPERS.js on home, and SCHWARM-QUEEN.js on home (without it: error 'Queen fehlt auf home', i.e. Queen missing). SF4 (Singularity) is needed for the automatic purchases. TOR costs $200k, and the Navigator and home RAM need enough cash. Without SF4 it prints manual steps to the terminal: buy the TOR router in the city menu, buy DarkscapeNavigator (the code says it is cheaper in Chongqing, Shadowed Walkway), do NOT buy port openers, and optionally upgrade home RAM. It still starts the Queen.

**On / off:** It has no switch and is not a registry daemon. It runs as part of the automatic chain and cannot be turned off on the DASHBOARD. It writes switches for other daemons (STANEK on; GANGS/BLADEBURNER/CORP off when their requirements are missing) through setDaemonEnabled into the switch file schwarm-queen-state.txt. You can turn those back on later on the DASHBOARD.

**Good to know:** The home RAM upgrades here stop at 64 GB (at most 12 upgrades). After that SCHWARM-BANK takes over. The switch check ('Schalter gegen die Wirklichkeit', switches against reality) only ever turns things OFF, never on. It covers GANGS without enough karma, BLADEBURNER without The Blade's Simulacrum or enough combat stats, and CORP when the BitNode's corporation softcap is too low. If player data cannot be read, it touches nothing. The terminal line starts with 'INFO [ARSENAL] Voraussetzung (noch) nicht erfuellt, abgeschaltet: …' ('requirement not met (yet), switched off: …'). ARSENAL turns the STANEK switch ON every time it runs and sends a start request, so Stanek's Gift can be accepted before the first augmentation purchase. The Queen does the actual start. Without SF13 the Stanek payload reports 'gesperrt' (locked). The Queen protects itself against a second copy, so a manual run while the Queen is already running is harmless.

### SCHWARM-CLEAN.js

**What it does:** A manual cleanup and reset tool for home, with a built-in way back. By default it stops every process, clears ports 1-40, saves all SCHWARM*.js scripts into a backup file, and then deletes all other files on home. It is meant for a clean test or a fresh re-install. `--restore` writes everything back from the backup and starts GENESIS. `--temp` only trims the eval cache in /Temp and is safe while the swarm is running.

**How it runs:** Manual tool only. Nothing starts it automatically, and the code comments say that is on purpose. It deliberately imports nothing, so it still works when SCHWARM-HELPERS.js is missing or being replaced. It runs once and ends.

**Run it on its own:** run SCHWARM-CLEAN.js --dry-run   (only shows what would happen, changes nothing; always do this first)
run SCHWARM-CLEAN.js   (full wipe: KILL all scripts on home and on every rooted host except Hacknet, clear ports 1-40, write the backup, then delete every file on home except CLEAN itself, the backup SCHWARM-SICHERUNG.txt, .exe programs and schwarm-chronik-* files)
run SCHWARM-CLEAN.js --keep-swarm   (like the default, but keeps every file whose name starts with 'schwarm'/'SCHWARM')
run SCHWARM-CLEAN.js --wipe-all   (also deletes .exe programs such as Formulas.exe, and the chronicle files)
run SCHWARM-CLEAN.js --no-backup   (wipe without writing a backup first)
run SCHWARM-CLEAN.js --restore   (read SCHWARM-SICHERUNG.txt from home, or from the n00dles mirror; write back every script that differs, then run SCHWARM-GENESIS.js)
run SCHWARM-CLEAN.js --temp [--keep N] [--dry-run]   (only delete /Temp/schwarm-eval-*.js down to N files, default 40; no kill, no wipe)
run SCHWARM-CLEAN.js --help   (prints a short help in German)

**RAM:** Not in the DAEMONS registry, so there is no minRam. An older RAM measurement from 2026-09-05 (an older version) showed about 5.90 GB. Check the current value with `mem SCHWARM-CLEAN.js`.

**Needs:** Nothing else: it has no imports and needs no Source-Files. For the backup mirror it roots n00dles if needed (0 ports needed). --restore needs a readable SCHWARM-SICHERUNG.txt on home or on n00dles, and SCHWARM-GENESIS.js has to be inside it.

**On / off:** It has no switch and is never started automatically. It only runs when you type a command, and the flags choose the mode. Off is the default state.

**Good to know:** Careful: the default mode does NOT keep the SCHWARM scripts on home. They survive only inside the backup file. It also deletes your own scripts, contracts (.cct), .lit/.msg files, and state/text files such as the switch file and schwarm-plan.txt. The backup contains only SCHWARM*.js scripts in the root of home, not .txt state files. So after `--restore` your switches and plan fall back to their defaults. If writing the backup fails, CLEAN stops before deleting anything. By then, however, the scripts are already killed and the ports cleared. The n00dles mirror only protects against CLEAN deleting too much; it does not survive an augmentation install, but the copy on home does. `--temp` leaves /Temp/schwarm-eval-*.txt output files alone and reports only how many there are. The --help text and tab-completion do not mention --restore, --no-backup or --wipe-all, but the code supports them. Typical clean re-install: `--dry-run`, then `run SCHWARM-CLEAN.js`, copy in the new scripts, then `run SCHWARM-GENESIS.js`.


## Core

### SCHWARM-QUEEN.js

**What it does:** The boss of the swarm and the ONLY script that starts and stops SCHWARM daemons. Every 2 seconds it reads the on/off switches and the daemon registry, picks a server for each daemon that should run, asks the DISPATCHER to free the RAM there, writes payload scripts to disk ('materializes' them) and launches them. It also roots new servers every 16 s, detects which game features you have unlocked (Source-Files, APIs), handles the augmentation-install cycle, restarts daemons whose code changed, and restarts itself when its own code changes.

**How it runs:** Daemon: runs forever with a 2-second loop, on home. Normally you never start it yourself. The bootstrap chain starts it: SCHWARM-GENESIS.js -> casino.js -> SCHWARM-ARSENAL.js -> SCHWARM-QUEEN.js (ARSENAL runs it at the end with 1 thread). After every scripted augmentation install, GENESIS runs again as the callback and the chain starts QUEEN again. Only one copy can run; a second one prints 'WARN [QUEEN] läuft bereits' and exits. When SCHWARM-QUEEN.js, SCHWARM-HELPERS.js or SCHWARM-PAYLOADS.js changes on disk, it restarts itself with ns.spawn. It checks every 20 s and restarts only after it sees the same new version twice. Your running daemons keep going and the new QUEEN takes them over.

**Run it on its own:** run SCHWARM-QUEEN.js   (on home, no arguments). Use this if the bootstrap was skipped or you killed QUEEN. To stop swarm management: kill SCHWARM-QUEEN.js. The daemons already running stay alive, but nothing starts, stops or restarts them until QUEEN runs again.

**RAM:** Unclear from the code. QUEEN is not in the DAEMONS registry, so there is no minRam for it. Check in game with: mem SCHWARM-QUEEN.js. Of that total, 2 GB come from ns.spawn, which it uses to restart itself. It also briefly needs a little free RAM on home for throw-away helper scripts (evalNs) when it checks Source-Files. The DISPATCHER keeps a buffer free for this.

**Needs:** SCHWARM-HELPERS.js and SCHWARM-PAYLOADS.js must be on the same server (both are imported). QUEEN itself needs no Source-File. Without SF4 (Singularity), every daemon whose registry capability is SING never starts: WORK, AUGS, INFIL, RESET, BITNODE, BACKDOOR and the SLEEVES switch. Other capability gates: TRADER needs TIX API access, GANGS needs the Gang API (SF2 or BitNode 2), BLADEBURNER needs SF7 or BitNode 7, CORP needs SF3 or BitNode 3. Optional: schwarm-plan.txt on home (strategy and the permission to end a BitNode). The AUTO self-management only works while SCHWARM-DASHBOARD.js runs, because the dashboard reports your last keyboard/mouse activity.

**On / off:** QUEEN has no switch of its own: it is not in the registry and has no dashboard button. Running means on; 'kill SCHWARM-QUEEN.js' means off. QUEEN is also what makes every other switch work. Switches live in schwarm-queen-state.txt on home, one value per daemon: 0 = off, 1 = on, 2 = forced (starts even when its owner did not ask for it). Dashboard buttons send STOP/START/FORCE commands to QUEEN, and QUEEN writes the file. A switch set to 0 stops a running daemon within one tick. One-shot daemons are the exception. If a key suddenly disappears from the switch file, QUEEN puts it back. Special switches: RESET on (the default) lets QUEEN start the augmentation install once BANK reports it is ready; RESET off means no install, and any pending pause is lifted. BITNODE only runs when its switch is on AND schwarm-plan.txt gives a fresh permission. AUTO (default on): if nobody has touched the game for 2 hours, QUEEN turns on every daemon whose requirements are proven met and turns off OVERVIEW and LOGVIEW. Daemons whose requirement is proven missing are switched off right away, whenever AUTO is on.

**Good to know:** - Log and terminal messages are in German. Watch it with 'tail SCHWARM-QUEEN.js' on home. 'WARTET <KEY>: ...' says why a daemon is waiting (usually RAM). After 5 minutes, a terminal line 'WARN [QUEEN] <KEY> ist eingeschaltet, laeuft aber seit ... s nicht: <reason>' names daemons that are switched on but not running. It is repeated at most every 30 minutes.
- Host choice: a purchased server (pserv-*) first, then other rooted servers, and home last. A pinHost in the registry forces a specific server. Registry order is start priority. About every 5 minutes, QUEEN moves one daemon at a time off home when there is room elsewhere, because home RAM (with its cores) is the most valuable.
- You can update the scripts on home while the swarm is running: QUEEN picks up changes to itself, HELPERS or PAYLOADS within about 40 s, and restarts changed daemons once. No killall needed. It does not do this during PRE_RESET.
- PRE_RESET phase (augmentation install coming): nothing new is started except the RESET one-shot. The dashboard then shows '! PRE_RESET — Install steht bevor'.
- To let the swarm END a BitNode, schwarm-plan.txt on home needs all three lines: 'BEENDEN: ja', 'GILT-FUER-NODE: <number of the CURRENT BitNode>' and 'WEG: daedalus' (or weltdaemon, or flume). The BITNODE switch must also be on. The permission only works in exactly that BitNode. A missing plan file is fine; the swarm just keeps running.
- It also re-triggers the STANEK charge run when the RAM pool has grown about 3x.
- The swarm uses ports 1-29 and 35. Do not use those ports in your own scripts.

### SCHWARM-HELPERS.js

**What it does:** The shared library that every SCHWARM script imports. It is not a program. It holds the DAEMONS registry, the one list of every daemon: file, allowed host (pinHost), minRam, burst, arguments, owner, default state and required capability (cap). It also holds the port table (SCHWARM_PORTS), the code that reads and writes the on/off switch file, detection of unlocked game features, host picking and deploying, network scan and auto-nuke, and the RAM-saving 'evalNs' temporary scripts. There is also the action log (schwarm-chronik.txt) and number formatting.

**How it runs:** Not a process. It is loaded by 'import' into QUEEN, DASHBOARD, DISPATCHER, BANK, WORK, INFO and most other daemons. When QUEEN starts a daemon on another server, it copies HELPERS there as a dependency ('deps').

**Run it on its own:** Not meant to be run alone. It has no main() function; it only provides functions and data to other scripts.

**RAM:** None of its own (it is a library). The RAM for the game functions a script uses from it is counted into that script's own cost.

**Needs:** Nothing. It must sit on home under exactly this name, because every other script imports 'SCHWARM-HELPERS.js'.

**On / off:** No switch for the library itself, but it defines the switch system everyone uses. The file is schwarm-queen-state.txt on home. Format: KEY:mode|KEY:mode|..., where mode 0 = off, 1 = on, 2 = forced. The file survives augmentation installs and BitNode changes, because home keeps its text files. If a daemon has no entry, the registry default applies. Off at first boot (defaultOff): BANK, WORK, CORP, DARKNET, GO, BITNODE, DIAG, LOGVIEW, SCAN, STANEK, INFIL. On by default: DASHBOARD, HACKING (the DISPATCHER), INFO, TRADER, AUGS, BLADEBURNER, GANGS, SLEEVES, OVERVIEW, AUTO, RESET. BACKDOOR is 'triggered' and is run by the DISPATCHER, not by switch. Beginners should flip switches with the SCHWARM-DASHBOARD buttons. The write function (setDaemonEnabled) re-reads the file to verify the change and reports an error if it did not stick.

**Good to know:** - Capability letters used by 'cap': SING = Singularity (SF4 or BitNode 4), CORP = SF3 or BitNode 3, BLADE = SF7 or BitNode 7, GANG = Gang API reachable (SF2 or BitNode 2), TIX = TIX API bought, HASHSERV = SF9 or BitNode 9. Once a Source-File is detected, it is never 'forgotten' during a run, even if a later check fails.
- On top of 'cap', a readiness check (daemonBereit) exists. GANGS needs karma of -54,000 or lower, unless you are in BitNode 2 or already have a gang. BLADEBURNER needs the augmentation 'The Blade's Simulacrum' installed, and all four combat stats at 100 to join (not needed once you are in the division). CORP needs a BitNode corporation soft cap of at least 0.75. QUEEN (with AUTO on) and ARSENAL use this check to switch such daemons off.
- Registry facts: the 'host' field is only documentation; only 'pinHost' is enforced. Registry order is start priority (DASHBOARD first, INFIL last). Examples of minRam (+burst) in GB: DASHBOARD 8, HACKING 18, INFO 74 (+176), BANK 25 (+5), WORK 7 (+24), CORP 5 (+24), TRADER 39 (+5), GANGS 38 (+8), BITNODE 56, RESET 14, STANEK 29, INFIL 15 (+16).
- Editing this file on home makes QUEEN restart itself, and every daemon that lists HELPERS in its deps restarts once. Do not rename the file.
- Old temporary evalNs scripts collect in /Temp/schwarm-eval-*. The code says 'run SCHWARM-CLEAN.js --temp' removes the leftovers.
- Ports used by the swarm: 1-29 and 35. Keep your own scripts off them.

### SCHWARM-DASHBOARD.js

**What it does:** Your control panel. It opens a log window titled SCHWARM-DASHBOARD.js with a row of coloured on/off buttons, one per daemon. The window also shows a 'KINETIK' bar of how the network RAM is used (hack, grow, weaken, prep, xp, share, daemons, reserved, free), a separate Hacknet-server RAM bar, and a blinking ENDGAME bar when Operation Daedalus or w0r1d_d43m0n is ready. It also adds extra rows to the game's Overview panel on the left, each with a tooltip: BitNode, wealth, stocks, income, expenses, script income/exp, hashes, gang territory, karma, corp, servers, home RAM, all RAM, share power, reserve. Finally, it records when you last pressed a key, clicked or scrolled, which the AUTO self-management needs.

**How it runs:** Daemon: refreshes every 0.5 s and redraws every 1 s. QUEEN starts it automatically: its owner is QUEEN, it is on by default, and it is first in the registry, so it comes up before everything else. It may run on any server (no pinHost). Only one copy runs at a time.

**Run it on its own:** run SCHWARM-DASHBOARD.js   (no arguments; this is the call named in the file header). The display works on its own, but the buttons only send commands to QUEEN, so they do nothing unless SCHWARM-QUEEN.js is running.

**RAM:** 8 GB (registry minRam 8, burst 0). The HELPERS header lists a measured value of about 6.65 GB.

**Needs:** SCHWARM-HELPERS.js (imported). No Source-File required. Some parts only fill in when other daemons run: the KINETIK detail needs the DISPATCHER (HACKING), the ENDGAME info needs INFO, the stocks row needs TRADER, the corp row needs CORP, territory needs GANGS, hashes need BANK. Button clicks need QUEEN.

**On / off:** The dashboard itself has no button, because the registry marks it 'oneshot' to hide it. It is on by default, and QUEEN restarts it if you kill it. Its buttons toggle the other daemons: a click sends STOP:<KEY> if the switch is on, otherwise START:<KEY>. The one-shot SCAN button sends FORCE:SCAN and runs it once. The buttons shown: HACKING, BANK, WORK, CORP, DARKNET, GO, TRADER, BLADEBURNER, GANGS, INFIL, DIAG, LOGVIEW, OVERVIEW, SCAN, RESET, then INFO, AUTO, BITNODE. DASHBOARD, BACKDOOR, AUGS, SLEEVES and STANEK are hidden. Colours: green = running, cyan = forced or one-shot running, yellow = switched on but not running yet ('startet…'), red = being stopped, grey = off, magenta = waiting for a feature you have not unlocked. Special buttons: RESET green = armed (installs augmentations when BANK says the round is done), grey = no install. BITNODE blinks red/yellow when all BlackOps are done. AUTO's tooltip shows the minutes left until self-management kicks in. OVERVIEW turns the Overview-panel rows on or off.

**Good to know:** - All labels and tooltips are in German (for example 'läuft @ pserv-0' = running on pserv-0, 'wartet auf Freischaltung' = waiting for unlock).
- The buttons live inside the log window. If you close it, the buttons are gone. Reopen the script's log from the Active Scripts page, or kill SCHWARM-DASHBOARD.js; QUEEN restarts it and it opens a fresh window.
- Be careful with HACKING: turning it off stops the DISPATCHER, the main money/XP engine. Turning RESET off stops automatic augmentation installs.
- Any key press, mouse click or scroll in the game resets the 2-hour AUTO timer. If the dashboard is not running, AUTO never triggers.
- The line 'BRUECKE — noch kein Lebenszeichen' refers to an optional PC-side helper (SCHWARM-BRUECKE.ps1) that writes SCHWARM-BRUECKE-STATUS.txt. It is display-only and safe to ignore if you don't use it.
- The ENDGAME bar is information only; it never acts for you.
- Some Overview rows only appear when relevant. Karma shows only without a gang and at -9 or lower. Hashes show only with Hacknet servers. Corp shows only when a corporation exists.

### SCHWARM-INFO.js

**What it does:** The swarm's central information and request service ('one source, everyone reads'), file header v2.7. It collects game data in blocks and publishes one JSON snapshot at most once per second on port 9, so other daemons can read it without paying the RAM cost. The blocks are: BitNode and Source-File levels and multipliers, player, stock and darkweb access flags, sleeves, Bladeburner, gang, Hacknet and corp. With SF4 it also collects current work and invitations, faction rep, the augmentation catalog, darkweb and home-RAM prices, and crime chances. It also runs a whitelist of expensive actions for other daemons as requests: joining factions and working, buying augs, programs, home RAM and cores, sleeve tasks, donations, stock access, and corp creation, buyback and share sales. Requests arrive on port 10 and results are posted on port 21. It also writes an error chronicle, SCHWARM-CHRONIK-BN<n>.txt, from the logs of running and crashed SCHWARM scripts.

**How it runs:** Runs all the time in a 400 ms loop. The QUEEN is its owner. The QUEEN starts it once some server has 250 GB free (74 minRam plus 176 burst) and keeps that RAM reserved while it runs. It is placed on the purchased server with the most free RAM, otherwise on another rooted server, and on home as the last resort. On a BitNode change it throws away its snapshot and rebuilds it. An augmentation install kills it, and the QUEEN starts it again.

**Run it on its own:** run SCHWARM-INFO.js   (takes no arguments). According to the header, its log shows how old each block is and the request counters. Only one copy per server: a second copy prints a warning and exits.

**RAM:** 74 in the registry (minRam; the engine measured 71.70 GB) plus 176 GB of reserved burst for the bundled Singularity scripts. That makes about 250 GB free on one server.

**Needs:** SCHWARM-HELPERS.js. It has no capability requirement: it always publishes the cheap blocks. The Singularity blocks (work, rep, augs, market, crime) and all Singularity requests need SF4, or being in BitNode 4. Without it those blocks report ok:false 'NO_SING' and the other daemons fall back to their own methods. Live BitNode multipliers need SF5; otherwise multsSource is 'none'. The sleeves block only has content if you have sleeves (SF10 / BN10). The Bladeburner and gang blocks are skipped when the BitNode does not offer those features. It reads the DISPATCHER's port 3 to slow down when the RAM pool is nearly full.

**On / off:** On by default (no defaultOff). It shows up as an INFO button in the DASHBOARD, added after the main buttons. A click toggles it, and the state is stored in schwarm-queen-state.txt on home. You normally leave it on: if it is off, other daemons fall back to their own, more RAM-hungry calls. It automatically collects a block 6 times less often when the daemon that reads it (BLADEBURNER, GANGS, CORP or WORK) is switched off. It collects 2-3 times less often when less than 8% or less than 3% of the RAM pool is free.

**Good to know:** Early in a run there is no server with about 250 GB free, so INFO simply does not start yet. That is normal: the other daemons use their fallbacks, and BANK builds a purchased server of at least 256 GB for it. The terminal start message still says 'v1.2 - Snapshot (Port 28) + RPC-Geruest (29/30)'. That is an old hard-coded text: the real version is 2.7 and the ports are now 9, 10 and 21 (see SCHWARM_PORTS in HELPERS). The header comments also still name the old ports 28/29/30. The chronicle file is written on the server INFO runs on (ns.write only writes locally), usually a purchased server. BANK's comments say an augmentation install deletes all purchased servers, so the chronicle is probably lost at each install. The chronicle keeps at most 4000 lines, repeats the same message at most every 10 minutes, and cannot see the browser console. If a Singularity request does not fit into free RAM, it gives up with 'NO_RAM' after 3 tries. On an internal error it prints ERROR to the terminal and opens its own tail window.

### SCHWARM-DIAG.js

**What it does:** The swarm's diagnosis tool (file header v3.24). It watches the swarm for a measuring window (default 60 seconds, one sample every 2 seconds) and writes a detailed report in German. Its sections are: 1 overview (money, phase, script versions), 2 switches vs. running daemons, 3 worker and RAM use, 4 BANK / hashes / market / corp, 4b the daemons' action log, 4c a cash book, 5 INFO blocks, 6 ports, 7 jobs, work and sleeves, 8 findings, 9 logbook. It also writes a short version, schwarm-kurz.txt, and a generated legend, schwarm-legende.txt. It starts no scripts and makes no purchases.

**How it runs:** Has two modes. The QUEEN starts it pinned to home with the registry arguments [60, 2000, 0, 10]. That is continuous mode: every 10 minutes it writes a complete report into its own file, SCHWARM-REPORT-<n>.txt, and it never stops by itself. In job mode (cycles > 0) it takes N snapshots: cycle 1 writes the full SCHWARM-REPORT.txt, later cycles only add changes above 2%. At the end it prints 'fertig' to the terminal and switches its own switch off (only when running on home). Progress is saved in schwarm-diag-lauf.txt, so after an augmentation install the restarted DIAG continues the same job.

**Run it on its own:** run SCHWARM-DIAG.js [windowSec] [sampleMs] [cycles] [gapMin]   Run it on home. windowSec = length of each measuring window (default 60, minimum 5). sampleMs = time between samples (default 2000, minimum 500). cycles = number of reports, where 0 means endless. gapMin = minutes from the start of one report to the start of the next (minimum 1). Example for one single report: run SCHWARM-DIAG.js 60 2000 1 1. Without arguments it continues an unfinished job from schwarm-diag-lauf.txt if one exists. Otherwise it uses 60 2000 4 15 (4 reports 15 minutes apart, about one hour, then it stops). 'run SCHWARM-DIAG.js 60 2000 0 10' is the continuous mode.

**RAM:** 9 (registry minRam, pinned to home)

**Needs:** SCHWARM-HELPERS.js. No Source-File needed (cap null). It must run on home, because it reads the switch file, INFIL's files, the action log and the script headers there, and switches itself off there. The sections are only filled if the other parts are running: DISPATCHER (port 3), the INFO snapshot, BANK, CORP and so on. Without them those sections stay empty or say so.

**On / off:** Off by default (defaultOff). Clicking the DIAG button in the DASHBOARD switches the continuous mode on or off. The QUEEN stores this in schwarm-queen-state.txt on home. With the AUTO switch on (default), the QUEEN also turns DIAG on after 2 hours without any keyboard or mouse input. A job-mode run switches itself off when it finishes.

**Good to know:** The reports are plain German text. Read them on home with 'cat SCHWARM-REPORT.txt' or 'nano SCHWARM-REPORT-1.txt'. The LOGVIEW daemon can also show the newest report in a tail window. In continuous mode, SCHWARM-REPORT-1.txt, -2.txt and so on pile up on home. The code says an external 'bridge' tool collects and deletes them, and nothing inside the game deletes them. So remove old ones yourself with 'rm'. Each report empties the daemons' action log (schwarm-chronik.txt), so every report shows only the actions since the previous one. If the QUEEN is running and DIAG's switch is off, the QUEEN will stop a copy you started by hand within about a minute. So run it by hand only while its switch is on or while the QUEEN is not running, or just use the Dashboard button. A second DIAG on the same server exits at once ('DIAG laeuft bereits'). The header still says 'one click = one report', but the Dashboard button now starts the endless 10-minute mode.


## Money and progress

### SCHWARM-BANK.js

**What it does:** This is the swarm's money manager (file header v5.17): anything that spends money or hashes goes through it. It keeps a cash floor of $10m plus money held back for the next big purchase. It buys the next cheapest infrastructure step (a new or upgraded purchased server 'pserv-N', a home RAM upgrade or a home core), Hacknet upgrades and stock-market access (WSE, TIX, 4S data, 4S API). It also works towards big goals: founding a corporation called 'ALPHA', grafting Congruity and then crafting augmentations, and buying back corporation shares. With hashes it sells the overflow, boosts the best hacking target, generates coding contracts, tops up corp funds and buys Bladeburner rank and skill points. It also approves money requests from other daemons (gang augs first, then faction donations, then gang equipment), plans each augmentation round (at most 5 augs, cheapest first, NeuroFlux as a filler) and tells the QUEEN when an augmentation install is due.

**How it runs:** Runs all the time in a loop with a 2-second tick. The QUEEN is its owner and starts or stops it. The QUEEN places it on the rooted server with the most free RAM, but never on a purchased server (BANK replaces and deletes those itself, 'meidePserv'). home is the last resort. BANK is also the owner of TRADER and AUGS: it sends WANT/DROP messages so the QUEEN starts or stops them. It never starts processes itself.

**Run it on its own:** run SCHWARM-BANK.js   (takes no arguments). Better: use the BANK button in the DASHBOARD. BANK is off by default. When the QUEEN is running and BANK's switch is off, the QUEEN finds a copy you started by hand (it checks all running scripts about once a minute, matching by file name) and stops it.

**RAM:** 25 in the registry (minRam), plus a 5 GB burst for throwaway evalNs scripts. A registry comment says the engine measured about 23.35 GB.

**Needs:** SCHWARM-HELPERS.js (its only import). QUEEN (starts it and carries out its WANT/DROP requests). INFO is strongly recommended: BANK reads the INFO snapshot and sends its Singularity and stock-access purchases through INFO. Without a fresh snapshot it falls back to its own throwaway evalNs scripts. What each part needs: buying augmentations, home RAM and home cores needs Singularity (SF4). The TRADER needs TIX API access, which BANK buys itself. Spending hashes needs Hacknet servers (BitNode 9 / SF9); without them that part just sleeps. Founding a corp needs the corporation feature (BitNode 3 / SF3) and is skipped where the BitNode's corp softcap is below 0.75. It is free in BN3 and costs $150b elsewhere. Crafting needs grafting (BitNode 10 / SF10). Sleeve augs need sleeves (SF10). Buying extra sleeves only works in BitNode 10. It also reads STANEK's port and does not buy augs while Stanek's Gift is still undecided. It buys 'The Red Pill' only when schwarm-plan.txt (relayed by the QUEEN) allows 'weltdaemon' and you are already in Daedalus.

**On / off:** Off by default (defaultOff). To turn it on, click the BANK button in the DASHBOARD tail window. The click sends START:BANK or STOP:BANK to the QUEEN, which stores 1 or 0 in schwarm-queen-state.txt on home. Colours: green = running, grey = off, yellow = starting, red = stopping. BANK also switches on by itself in two cases. First, when you explicitly switch on TRADER, AUGS or CORP (dependency autostart), unless you set BANK to off yourself. Second, when the AUTO switch is on (its default) and nobody has pressed a key or clicked in the game for 2 hours. The RESET switch changes how BANK behaves: if RESET is off, BANK never enters its 'reset phase' and keeps investing normally.

**Good to know:** BANK spends your cash automatically and only leaves $10m plus its hold-back reserve. Keep that in mind before buying things by hand. Its log messages are in German, and it does not open a tail window. Usually it runs on another server, not home, so open its log from the game's Active Scripts page. Typical log lines that explain 'why nothing is bought': 'AUGS: spare fuer ...' (saving up for an aug), 'AUGS gesperrt: STANEK laeuft noch' (augs blocked while STANEK runs), 'RESET-PHASE ...' and 'RESET zurueckgestellt' (install postponed while crafting). In the reset phase (aug round finished and RESET switched on) it stops buying servers and Hacknet, because the install wipes them. It also has the TRADER sell everything before the install. BANK builds one purchased server of at least 256 GB first, so that INFO has a home. Faction donations for WORK come from their own pot (5% of gross income) and get at most half of the free money. Corp share buybacks only happen in the price window that CORP announces. Do not run two copies: BANK has no single-instance check of its own, and the QUEEN kills the younger duplicate.

### SCHWARM-DISPATCHER.js

**What it does:** The swarm's hacking engine and RAM manager. Every 2 seconds it fills the free RAM of all rooted servers, your purchased servers, home and (if you have them) hacknet servers with tiny one-shot worker scripts. These workers prepare the best targets (weaken to minimum security, grow to maximum money) and then hack them for money. Leftover RAM goes to hacking-XP workers and, while WORK is grinding faction reputation, to share() workers that boost reputation gain. It also starts the coding-contract solver and the backdoor helper.

**How it runs:** Permanent daemon. The QUEEN starts it automatically: it is registry key HACKING, pinned to home, and ON by default (it is not marked defaultOff). The main loop runs every 2 s. A heavier 'slow tick' runs every 16 s: it re-ranks targets, counts coding contracts, collects backdoor targets and re-copies worker files. Only one instance can run; a second copy prints a warning and exits.

**Run it on its own:** run SCHWARM-DISPATCHER.js   (QUEEN starts it with no arguments). Optional flags: --no-home = do not put any workers on home; --diag = also print detailed diagnostic tables into its log window and write them to schwarm-diag.txt (overwritten each time). Normally you let the QUEEN start it instead of running it by hand.

**RAM:** Registry minRam 18 GB (engine measured about 16.5 GB, per a comment in SCHWARM-HELPERS). Must run on home (pinHost). The coding-contract solver and backdoor helpers it launches also need free RAM somewhere in the network. Their size is measured at runtime; a code comment estimates about 8 GB per backdoor helper, up to 5 run in parallel, and the fallback guess for the solver is 24 GB.

**Needs:** SCHWARM-HELPERS.js and SCHWARM-PAYLOADS.js on home. At startup it writes its worker files from PAYLOADS: schwarm-w.js, schwarm-g.js, schwarm-h.js, schwarm-s.js, schwarm-wl.js, schwarm-solver.js and SCHWARM-BACKDOOR.js. If one of them cannot be written, it reports an error and stops. Core hacking needs no Source-File. Optional extras: Formulas.exe (more accurate target scoring, otherwise a fallback estimate); SF4/Singularity for the backdoor helper (registry cap SING); SF9 or BitNode 9 hacknet servers, whose RAM it also uses; TRADER, which sends stock-manipulation targets; WORK, which sends the 'share wanted' flag; INFO, which tells it whether hacking pays money in this BitNode; QUEEN, which sends RAM reservations and roots new servers.

**On / off:** Dashboard button 'HACKING' (green = running, grey = off). ON by default. The state is saved in schwarm-queen-state.txt as HACKING:1 or HACKING:0; if you set it to 0, the QUEEN stops the process. The backdoor helper has no Dashboard button: it runs automatically unless the switch file explicitly contains BACKDOOR:0. The contract solver has no switch: it starts on its own once at least 5 .cct files exist on the network.

**Good to know:** 1) It does NOT root (nuke) servers itself. The QUEEN and GENESIS do that; the dispatcher only uses servers that already have root access. If you run it alone without the QUEEN, it will not gain new servers.
2) It deliberately leaves some RAM free, so seeing unused RAM is normal. It keeps: 5 GB on home; whatever the QUEEN reserves for starting daemons; an 'eval buffer' on hosts running Singularity daemons (192 GB at SF4 level 1, 64 GB at level 2, 32 GB at level 3+ or in BN4, 0 without SF4); a headroom of 10% of the pool (at least 128 GB, at most 100 TB); and 25% of each hacknet server's RAM so hashes keep coming. That last reserve drops to 0 if hashes are worthless in the BitNode.
3) Backdoors: faction servers come first (CSEC, avmnite-02h, I.I.I.I, run4theh111z, fulcrumassets) because backdooring them triggers faction invitations. w0r1d_d43m0n is NEVER backdoored automatically, because that would end the BitNode; you must do that yourself.
4) In BitNodes where hacking pays no money (e.g. BN8), stock manipulation for the TRADER comes first and money-hacking is capped at 45% of the pool.
5) When STANEK reports a charging host, the dispatcher kills the lower-case 'schwarm-' workers on that host once and leaves the host alone until charging is done.
6) It spends no money. The lower-case worker files are re-created automatically, and the QUEEN harvests the endless XP workers (schwarm-wl.js) when RAM is needed.
7) To watch it, open its log window (e.g. 'tail SCHWARM-DISPATCHER.js' on home). The German text shows best target, XP target, RAM use, solver and backdoor status, and which limits are active. A JSON snapshot is also published on the DISP_OUT port for DIAG and DASHBOARD.

### SCHWARM-WORK.js

**What it does:** Controls what your player character does all day, and your sleeves as well: gym training, crimes, faction work and company work. It works in phases. First it unlocks Bladeburner (combat stats to 100, then joins the division). Then it farms karma down to -54,000 and founds a gang (not in BN2). After that it earns faction reputation for the augmentations you still need, with company work as filler and crime as a last fallback. Along the way it accepts faction invitations, applies for jobs, travels to unlock location-based factions, donates money to factions (through BANK), and once per day collects the favor bonus that the game gives for exporting a save.

**How it runs:** Daemon. The QUEEN starts it when the WORK switch is ON and Singularity is available. It is OFF by default (defaultOff). It is not pinned to a host, so the QUEEN places it on any server with room. The main loop runs every 20 s, and every 10 s while training for Bladeburner. Only one instance can run. Since v5.6 it no longer starts the GANGS or BLADEBURNER daemons; the QUEEN does that through their own switches. WORK only joins the division and founds the gang.

**Run it on its own:** run SCHWARM-WORK.js   (optional --tail opens its log window; without it the window is actively closed). It takes no other arguments. Note: if the QUEEN is running and the WORK switch is OFF, the QUEEN stops any WORK process it finds. It is better to switch it on in the Dashboard.

**RAM:** Registry minRam 7 GB (measured about 5.85 GB) plus a burst of 24 GB for throwaway Singularity scripts. A code comment warns that at SF4 level 1 a single Singularity call can cost up to about 80 GB (x16 multiplier), so early on WORK needs a lot of free RAM to act.

**Needs:** Singularity access: SF4, or being in BitNode 4 (registry cap SING). SCHWARM-HELPERS.js is copied along. Optional extras: INFO daemon (then WORK reads from INFO's snapshot and sends actions as RPC calls, which it logs as [INFO] mode; without INFO it runs its own throwaway eval scripts, [EVAL] mode). BANK: donations are paid only through BANK's money-request system. SF10 or BN10 for sleeves. SF2 or BN2 for gangs. The Bladeburner capability (per the code: SF7 or BitNode 7) for the Bladeburner-unlock phase. Formulas.exe for a better choice of company job field.

**On / off:** Dashboard button 'WORK': OFF by default; magenta means the capability (SF4) is missing. Dashboard button 'SLEEVES': ON by default. It has no process of its own; it pauses or resumes the sleeve control inside WORK. Both are stored in schwarm-queen-state.txt. The daily save-export bonus can only be turned off in the file: set 'const EXPORT_BONUS_AKTIV = false'. Focus is set by CFG.FOCUS (false by default).

**Good to know:** 1) Once every 24 h it calls exportGame() for the +1 favor bonus on all your factions. Each call downloads a save file (bitburnerSave_<timestamp>_BN<n>.json.gz) into your browser's download folder. The script cannot delete or rotate these files.
2) City factions are grouped because they are enemies of each other: West (Sector-12 + Aevum), East (Chongqing + New Tokyo + Ishima) or Volhaven. Joining one group bans the others until your next augmentation install. WORK picks a group automatically after the Bladeburner phase. If you want a specific city faction, join it yourself first.
3) Location-bound factions (Tian Di Hui, Tetrads, The Dark Army, The Syndicate) never ban anyone. WORK travels to unlock them; each trip costs $200k and interrupts the current work.
4) WORK never takes jobs at FoodNStuff, Joe's Guns or Noodle Bar.
5) Work is unfocused by default (CFG.FOCUS=false). Without the Neuroreceptor Management Implant, unfocused work earns less. Turning focus on makes WORK take over the screen whenever it assigns new work, which can ruin an INFIL run.
6) While BANK is grafting an augmentation, WORK does not touch your work slot; it only does slot-free tasks such as invitations, job applications and sleeves. After you join Bladeburner without owning 'The Blade's Simulacrum', WORK leaves the slot to Bladeburner.
7) The gang is founded automatically, trying Speakers for the Dead, The Dark Army, The Syndicate, Tetrads, Slum Snakes and The Black Hand in that order. Whether the gang is then managed is decided by the GANGS switch.
8) During the reputation phase it sets the 'share wanted' flag, and the DISPATCHER then runs share() workers. Donations start only once a faction has enough favor for donating.
9) The log shows e.g. 'Phase: REP [INFO]'.

### SCHWARM-INFIL.js

**What it does:** Plays infiltrations for you automatically. It ranks all companies by expected reward per second, travels there, starts the infiltration, and solves every minigame directly through the game's internal (React) state instead of fake key presses. Then it collects the reward. In the default 'auto' mode it takes faction reputation while any faction you belong to still lacks reputation for its augmentations (NeuroFlux Governor is ignored); after that it takes money.

**How it runs:** Daemon. The QUEEN starts it on home with the arguments --mode auto --quiet when the INFIL switch is ON (OFF by default) and Singularity is available. It loops forever and never ends by itself, with one exception. If you click 'Cancel Infiltration' during a run, it sends STOP:INFIL to the QUEEN, which turns the switch off and kills it. If no QUEEN takes over within 20 s, INFIL exits on its own.

**Run it on its own:** run SCHWARM-INFIL.js   (defaults: auto mode, runs forever, no terminal output). Useful flags: --mode rep|money|auto; --minutes N (stop after N minutes, 0 = forever); --maxdiff X (maximum end difficulty, default 3.5); --maxrun N (safety timeout per run in seconds, default 900); --rotate (don't repeat the same target twice in a row); --lowrep (ignore augmentation goals); --notravel (never travel); --demand (wait until market demand recovers to 2/3); --rebuild (rebuild target and faction caches); --nostop (clicking 'Cancel Infiltration' does NOT switch INFIL off); --tail (open log window); --help. Diagnostics: 'run SCHWARM-INFIL.js --selftest' (while an infiltration is running) checks the React bridge; 'run SCHWARM-INFIL.js --probe' analyses the current screen. Both end right after.

**RAM:** Registry minRam 15 GB (the header calculates 13.7 GB at SF4 level 3+) plus a burst of 16 GB, pinned to home. The throwaway helper scripts need about 15 GB (target list) and 16 GB (faction goals) of free RAM on home. The header warns that at SF4 level 1 the script itself costs about 141 GB, and about 39 GB at level 2.

**Needs:** Singularity access: SF4 or BitNode 4 (registry cap SING); it uses goToLocation, travelToCity and getCurrentWork. The game window must be open, because INFIL uses the page (DOM). It is standalone and imports nothing from SCHWARM-HELPERS (deps are empty). It writes its own cache and log files on home. To switch itself off it sends a message to the QUEEN (command port 2).

**On / off:** Dashboard button 'INFIL': OFF by default; magenta means SF4 is missing. It is stored in schwarm-queen-state.txt. Clicking 'Cancel Infiltration' in the game during a run also switches it OFF, unless it was started with --nostop. Without the QUEEN, stop it with 'kill SCHWARM-INFIL.js'.

**Good to know:** 1) It reads React internals ('__reactFiber$' / '__reactProps$'), so a Bitburner update can break it. In that case it deliberately plays nothing, because fake keyboard input would put you in the hospital. It logs that the React bridge is broken and retries every minute; run --selftest to see why.
2) During a run it takes over the game screen. Don't navigate away mid-run: a page change cancels the infiltration.
3) A lost run costs HP and a hospital bill. A target that fails twice is skipped. After 6 disruptions (or 6 runs with no reward) it pauses for 5 minutes. Targets must start below difficulty 3.4 (the game's hard limit is 3.5). If nothing is reachable it waits and checks again as your stats grow.
4) Terminal output is off by default (--quiet defaults to true). The run history is in /infil-log.txt (last 200 lines); read it with 'cat /infil-log.txt'. Other files on home are /infil-targets.txt, /infil-goals.txt, /infil-targets-stamp.txt, /infil-probe.txt and the helper scripts /infil-cache-build.js and /infil-goals-build.js. The caches rebuild automatically after an augmentation install.
5) Since v2.5 it keeps playing while BANK is grafting, because infiltration does not cancel grafting. Setting GRAFT_PAUSE = true in the file brings back the old pause.
6) Travelling to another city costs money; use --notravel to avoid it.
7) The registry comment says the INFIL switch also controls WORK's focus. That is outdated: WORK v3.11 removed the link, and the two scripts are now independent.


## Side systems

### SCHWARM-CORP.js

**What it does:** Runs your Corporation for you. Once a corporation exists, it builds a fixed chain of divisions (Agriculture, Chemical, Tobacco, Pharmaceutical, Restaurant, Fishing, Water Utilities, Software, Mining, Refinery, Computer Hardware, Real Estate, Robotics, Healthcare). Each division is expanded to all 6 cities before the next one is founded. Along the way it buys the unlocks (Office API, Warehouse API, Smart Supply, Export), hires and assigns staff, sets up sales, exports, boost materials, AdVert, research, products and corporation upgrades. It also handles going public, dividends and share issues, and reports its figures on port 15 for BANK and DASHBOARD.

**How it runs:** Daemon (endless loop, one round every 5 s). QUEEN starts it when the CORP switch is on and the CORP capability is present. Normally BANK flips that switch: BANK founds the corporation 'ALPHA' ($150b self-funded, or free with seed money in BitNode 3) and then sends START:CORP to QUEEN. If no corporation exists yet, CORP just waits and checks every 30 s.

**Run it on its own:** run SCHWARM-CORP.js   (run it on home; normally let QUEEN start it). Optional flags: --tail opens its log window (without it, the window is closed on purpose); --reroll deletes the remembered blueprint file schwarm-corp-state.txt before starting.

**RAM:** 5 GB (registry minRam; the game measured about 3.2 GB) plus 24 GB burst headroom that QUEEN keeps free for its throwaway evalNs scripts.

**Needs:** SCHWARM-HELPERS.js on the same host. The CORP capability, which the code sets when you are in BitNode 3 or own Source-File 3. An existing corporation, founded by BANK or by you. Registry: dependsOn BANK, so switching CORP on also switches BANK on unless you set BANK explicitly off. Pinned to home (pinHost). All corporation API calls run as throwaway evalNs scripts (a corporation action costs 20 GB each), so free RAM on home matters.

**On / off:** Off by default (defaultOff). Turn it on or off with the CORP button in the DASHBOARD window. The button sends START:CORP or STOP:CORP to QUEEN, which saves the choice as CORP:1 or CORP:0 in schwarm-queen-state.txt. BANK switches it on automatically after it founds the corporation.

**Good to know:** Warning for beginners: with the default setting BOERSE_SOFORT = true, CORP skips investment rounds and takes the corporation public at the first chance. At the IPO it sells 80% of YOUR shares (BOERSE_SOFORT_ANTEIL = 0.80) to fund the build-out. To use up to 2 investment rounds first, set BOERSE_SOFORT = false near the top of the file. Other settings in that section: AUTO_NEUE_STUFE = true means it founds the next division itself. BRIBE_FACTION = "" means bribes are off. Where CorporationSoftcap is below 0.75, BANK will not found a corporation automatically; found it yourself and switch CORP on by hand. If the corporation already has divisions the first time CORP runs, it switches to 'ADOPT' mode: it runs those divisions but never founds new chain divisions. --reroll on a corporation that has divisions leads to ADOPT for the same reason. The header's 'you handle founding, investors, IPO, dividends' line is outdated; the current code does IPO and dividends itself.

### SCHWARM-DARKNET.js

**What it does:** Automates the Bitburner 3.0 Darknet. It writes its worker scripts to disk (schwarm-roamer.js, schwarm-crack.js, schwarm-lab.js) and places a roamer on the 'darkweb' server. From there roamers spread from server to server: they crack passwords, open caches, clear blocked RAM, phish (money and Charisma XP) and run labyrinth runs. The daemon keeps a map and an inventory, hands out orders on port 34, publishes status on port 20 for QUEEN, DASHBOARD and DIAG, and solves coding contracts found on Darknet servers with the SOLVER payload.

**How it runs:** Daemon (endless loop, one round every 2 s). QUEEN starts it when the DARKNET switch is on. Until DarkscapeNavigator.exe exists on home it only waits and reports 'waiting_for_navigator'.

**Run it on its own:** run SCHWARM-DARKNET.js   or   run SCHWARM-DARKNET.js --sweep   (--sweep forces one time-limited 'clear-out' at start: phishing pauses and the cache limit is raised to clear a backlog). The game's own --tail flag also works to open the log.

**RAM:** 8 GB (registry minRam; the game measured about 6.3 GB), no burst headroom.

**Needs:** SCHWARM-HELPERS.js and SCHWARM-PAYLOADS.js (for the SOLVER payload). DarkscapeNavigator.exe on home, bought on the darkweb with a TOR router; SCHWARM-ARSENAL buys both automatically if you have SF4 (Singularity). No Source-File is required (registry cap: null). Roamers, crackers and labyrinth runners use the Darknet servers' own RAM. The contract solver runs only on home and needs about 22 GB there.

**On / off:** Off by default (defaultOff). Turn it on or off with the DARKNET button in the DASHBOARD window (sends START:DARKNET or STOP:DARKNET to QUEEN; saved in schwarm-queen-state.txt).

**Good to know:** Registry host preference is home (the old pin to home was removed). If darkweb lacks RAM for the roamer, it kills other scripts running there. Stopping the daemon marks it offline and clears the order port, but roamers already on Darknet servers keep working on their own. Files on home: schwarm-dnet-map.txt (map), schwarm-dnet-reset.txt (reset stamp; the map is thrown away automatically after an augmentation install, because the Darknet is rebuilt then). You can add passwords by hand in schwarm-dnet-manual.txt (scripts only read it). In BitNodes where Darknet money is 0, phishing gets priority because Charisma speeds up every other Darknet action.


## Payload daemons (embedded in SCHWARM-PAYLOADS.js, written to disk by the Queen)

### SCHWARM-PAYLOADS.js (container library)

**What it does:** Not a daemon itself. It is a library that stores the source code of all 'payload' scripts (GO, TRADER, GANG, BLADEBURNER, AUGS, RESET, BITNODE, STANEK, SCAN, LOGVIEW, BACKDOOR, SOLVER and the hack/grow/weaken/share workers) as text. Its function materialize() writes a payload to disk as a real .js file, filling in the current port numbers from SCHWARM-HELPERS.js; payloadStamp() lets the QUEEN detect when a running daemon is still on old code.

**How it runs:** Never runs on its own. It is imported by QUEEN, DISPATCHER, GENESIS and DARKNET, which call materialize() right before they start a payload. A file is only rewritten when its content actually changed.

**Run it on its own:** not meant to be run alone (it is a library; there is no main())

**RAM:** n/a (library; importing it adds almost nothing because ns.write is free and ns.scp is cheap)

**Needs:** Must be on home next to SCHWARM-HELPERS.js, because it imports decodePayload and injectPorts from there. No Source-File of its own.

**On / off:** No switch. Each payload inside has its own switch (see the entries below).

**Good to know:** The payload files (SCHWARM-GO.js, SCHWARM-TRADER.js, schwarm-w.js and so on) only show up on your servers after something has materialized them, so they are missing on a fresh install until the QUEEN, Dispatcher or GENESIS has run. Don't edit those generated files by hand: the next start overwrites them with the version stored in SCHWARM-PAYLOADS.js. To change a payload, change it in SCHWARM-PAYLOADS.js. The QUEEN then notices that a running daemon has an old stamp and restarts it.

### SCHWARM-GO.js (payload GO)

**What it does:** Plays IPvGO (the Go minigame) against the AI factions, one game after another, for the IPvGO faction bonuses. It rotates opponents by weight (Netburners 3, Daedalus 2, Illuminati 2, Slum Snakes 1, The Black Hand 1, Tetrads 1) and adjusts those weights to the BitNode. It uses a board size and strategy profile per opponent (9x9 or 13x13), and has a 5x5 'farm mode' against Illuminati once its win rate is high enough. All board analysis is plain JavaScript, so it costs 0 GB.

**How it runs:** Endless daemon (owner QUEEN). The QUEEN starts it when the GO switch is on, preferably on a purchased server. In the early phase GENESIS may also start it briefly on home before the casino run if IPvGO is available (that early start does not check the switch). If a game is already running when it starts, it continues that game.

**Run it on its own:** run SCHWARM-GO.js  (plays forever; only one copy per server). run SCHWARM-GO.js --verify  (one-time self-test that compares its own chain/liberty/territory analysis with the real, expensive API. This needs SCHWARM-INFO.js running, because it asks INFO to make those calls; without an answer it reports that and stops.)

**RAM:** 13 (registry minRam, burst 0). The hot path is getBoardState 4 GB + makeMove 4 GB + base; cheats run in small throwaway scripts in /schwarm-go/.

**Needs:** The ns.go (IPvGO) API. The registry has no capability gate (cap null). Cheating (double moves) needs Source-File 14.2 and is used only when the cheat success chance is at least 85% and the win streak against that opponent is below 6. --verify needs SCHWARM-INFO running. Standalone: it imports nothing, and ports are filled in at materialize time.

**On / off:** Dashboard button 'GO'. Default OFF (defaultOff). When AUTO is on (the default), the QUEEN switches GO on by itself after 2 hours without player input. Alternative: GO:1 or GO:0 in schwarm-queen-state.txt on home.

**Good to know:** It does not open a window automatically; use 'tail SCHWARM-GO.js' to watch it. Win/loss statistics per opponent and board size are kept in /schwarm-go/stats.txt on the server it runs on, and summarized for DIAG on the GO_OUT port. Without SF14.2 the log says the cheat API is not available and it just plays normally. Opponents whose bonus is worthless in the current BitNode get weight 0 (for example Netburners when hacknet money is zeroed).

### SCHWARM-TRADER.js (payload TRADER)

**What it does:** Automatic stock trader. Before you own 4S data it estimates each stock's direction from a price history (40 ticks, at least 15 before it acts); with the 4S Market Data TIX API it uses the real forecasts. It opens long positions, and short positions only where shorting is unlocked and 4S data is present. Its capital is capped (a starting stake of 100 x commission plus 70% of its own profit, or at least 70% of cash plus portfolio). It reports its portfolio value and the number of open positions to BANK. It liquidates positions when BANK asks (before an augmentation install), and reports the companies it holds to the Dispatcher so hacking/growing can push those stock prices.

**How it runs:** Endless daemon (owner BANK). BANK sends WANT/DROP to the QUEEN and the QUEEN starts or stops it, preferably on a purchased server. During the reset phase BANK first has it sell everything, then stops it.

**Run it on its own:** run SCHWARM-TRADER.js  (no arguments; it is self-contained and imports nothing)

**RAM:** 39 + 5 burst (registry)

**Needs:** Capability TIX: a WSE account plus TIX API access (BANK buys both). The 4S Market Data TIX API is optional; BANK buys it later. Shorting needs BitNode 8 or Source-File 8 level 2+, and opening new shorts also needs 4S. BANK must be running for the QUEEN to start it automatically.

**On / off:** Dashboard button 'TRADER'. Default ON, but it only runs while BANK requests it, and BANK is OFF by default. If you switch TRADER on explicitly, the QUEEN also switches BANK on (unless you set BANK to 0 on purpose). File alternative: TRADER:0/1 in schwarm-queen-state.txt.

**Good to know:** The duplicate-start guard only works per server: don't start a second copy by hand on home while the QUEEN runs one on a purchased server, or the two will fight over the money. Without TIX access it just waits and checks again every 60 s. Its log is in German (for example 'WARTE: TIX-API fehlt' means TIX access is missing). In BitNodes where hacking pays no money (BN8) it prefers stocks whose price the swarm can manipulate.

### SCHWARM-GANG.js (payload GANGS)

**What it does:** Gang manager. It recruits members and assigns tasks with a greedy optimizer to maximize respect and money without letting the wanted level run away. It ascends members, times Territory Warfare to the territory tick (only members with enough defense join, and clashes only once the average win chance is at least 90%), and buys gang equipment and augmentations through BANK (augmentations get priority 300, other equipment 100). It publishes territory, power and task distribution for the DASHBOARD/DIAG.

**How it runs:** Endless daemon (owner QUEEN since HELPERS v5.13), started on a purchased server when the switch is on. If no gang exists yet, it waits and checks every 60 s instead of exiting. WORK is the script that actually founds the gang.

**Run it on its own:** run SCHWARM-GANG.js  (no arguments; SCHWARM-HELPERS.js must be on the same server because it imports it)

**RAM:** 38 + 8 burst (registry)

**Needs:** The gang mechanic. The game rule is BitNode 2 or Source-File 2, and outside BN2 karma must be <= -54000 before a gang can be founded (WORK farms that). Note that SCHWARM's GANG capability check calls ns.gang.inGang() inside try/catch, and that call never fails, so the registry gate hardly blocks it; the payload itself waits for the gang. Purchases only happen with money granted by BANK. Singularity (SF4) is optional and only used to look up required reputation.

**On / off:** Dashboard button 'GANGS' (the registry key is GANGS, not GANG). Default ON. When AUTO is on, the QUEEN switches it OFF immediately if it can prove the gang can't be founded yet (karma above -54000, not in BN2, no gang), and back on after 2 h without input once that has changed. File alternative: GANGS:0/1.

**Good to know:** It prints 'Noch keine Gang - warte' once to the terminal while it waits; that is normal. In BitNodes where the gang softcap makes equipment worthless it stops requesting money. Log messages are in German. Use 'tail SCHWARM-GANG.js' to watch it.

### SCHWARM-BLADEBURNER.js (payload BLADEBURNER)

**What it does:** Bladeburner manager focused on rank, then faction reputation, then augmentations. It picks the best safe action (operations and BlackOps only at 95%+ estimated success, contracts from 50%). It keeps stamina and chaos under control, moves to the city with the most Synthoids, uses Field Analysis, Incite Violence or Training when nothing is safe, buys skills (Overclock first), and joins the Bladeburner faction at rank 25. After every BlackOp except the last is done it switches to a 'money mode' that farms contracts.

**How it runs:** Endless daemon (owner QUEEN), started on a purchased server. If you are not in the Bladeburner division yet, it tries to join every 60 s and otherwise waits (WORK normally trains combat stats to 100 and joins).

**Run it on its own:** run SCHWARM-BLADEBURNER.js  (no arguments; it imports nothing and runs its expensive API calls in throwaway scripts in /schwarm-bb/, so it needs free RAM on the same server)

**RAM:** 4 + 24 burst (registry); the daemon itself is about 3 GB, and the burst is for its throwaway scripts

**Needs:** Capability BLADE. SCHWARM's check is Source-File 7 or being in BitNode 7 (the check does not look at SF6). All four combat stats must be at least 100 to join. 'The Blade's Simulacrum' matters a lot: without it the game cancels your current work when an action starts, so the script won't start actions while you are working. The Simulacrum/work check uses Singularity calls (SF4); without SF4 it is unclear whether it can start actions at all.

**On / off:** Dashboard button 'BLADEBURNER'. Default ON. When AUTO is on, the QUEEN switches it OFF immediately once it knows 'The Blade's Simulacrum' is not installed, or that combat stats are below 100 before joining. File alternative: BLADEBURNER:0/1.

**Good to know:** It NEVER runs 'Operation Daedalus' (that ends the BitNode) unless schwarm-plan.txt releases WEG: daedalus for the current BitNode; otherwise it only logs that Daedalus is ready. According to GENESIS it has no HP logic (it never picks the Hyperbolic Regeneration Chamber), so hospital bills can pile up. Use 'tail SCHWARM-BLADEBURNER.js' to watch it.

### SCHWARM-AUGS.js (payload AUGS)

**What it does:** A simple one-shot augmentation buyer. BANK decides which augmentation to buy from which faction (the cheapest reachable one, or NeuroFlux Governor) and publishes that target. AUGS reads it, calls purchaseAugmentation once, writes the exact cost to the action log (chronik), and exits.

**How it runs:** One-shot (owner BANK). About every 30 s, if there is a target, BANK asks the QUEEN to start it. It buys one augmentation per run and exits.

**Run it on its own:** not meant to be run alone. 'run SCHWARM-AUGS.js' only does something if BANK has already posted a purchase target; otherwise it prints 'kein Kaufziel' and exits.

**RAM:** 8 + 5 burst (registry). The real cost depends on your SF4 level: per its header, purchaseAugmentation costs 5 GB at SF4 level 3+ and up to 80 GB at SF4 level 1.

**Needs:** Singularity (Source-File 4, or BitNode 4). BANK must be running (it chooses the target using INFO's snapshot, so SCHWARM-INFO should run too). Also needs SCHWARM-HELPERS.js.

**On / off:** No Dashboard button (one-shot daemons are hidden). Default ON, but it only runs when BANK requests it. To block it, put AUGS:0 in schwarm-queen-state.txt. Switching it on explicitly also switches BANK on.

**Good to know:** The 'install augmentations' step is a separate script (RESET). AUGS only buys. A failed purchase is not an error: BANK simply asks again on its next round.

### SCHWARM-RESET.js (payload RESET)

**What it does:** Installs your purchased augmentations (the soft reset / 'prestige') and passes SCHWARM-GENESIS.js as the callback, so the whole swarm restarts by itself afterwards. Before installing it checks: no duplicate run; BANK's reset order exists; no Grafting in progress; SCHWARM-GENESIS.js is on home; home has enough RAM for GENESIS; and at least one augmentation is queued.

**How it runs:** One-shot (owner QUEEN, pinned to home). The QUEEN starts it only after BANK reports that the augmentation round is finished and the reset is ready. On success the game kills every script and starts GENESIS.

**Run it on its own:** not meant to be run alone. 'run SCHWARM-RESET.js' refuses to install anything without BANK's order (it prints a warning and exits).

**RAM:** 14 (registry; measured 12.6 GB at SF4.3, and more at lower SF4 levels)

**Needs:** Singularity (Source-File 4). BANK must be running (it produces the reset order). SCHWARM-GENESIS.js and SCHWARM-HELPERS.js on home.

**On / off:** Dashboard button 'RESET' is an on/off safety switch, not a trigger. Default ON (automatic installs allowed). OFF blocks every automatic augmentation install. File alternative: RESET:0/1.

**Good to know:** Leave it ON in normal play. If you turn it OFF, the swarm never installs augmentations, and the Dashboard notes say BANK can then get stuck in its reset phase. Clicking the button cannot force an install by hand; on start the script also resets its own switch back to 1.

### SCHWARM-BITNODE.js (payload BITNODE)

**What it does:** Ends the current BitNode and jumps straight to the next one. It uses destroyW0r1dD43m0n(nextBN, 'SCHWARM-GENESIS.js') or, for WEG 'flume', b1tflum3. Before it acts, five checks must pass: a fresh release from the QUEEN; a valid ZIEL-NODE in schwarm-plan.txt; SCHWARM-GENESIS.js on home; the game condition actually met (all BlackOps done, or root plus enough hacking level on w0r1d_d43m0n; 'flume' skips this); and the SF4 functions exist.

**How it runs:** Daemon (owner QUEEN, pinned to home), but the QUEEN only runs it while its switch is on AND a fresh release from schwarm-plan.txt is published. It checks every 5 s and exits when it performs the jump.

**Run it on its own:** run SCHWARM-BITNODE.js  (no arguments; it still waits for the plan release, so it does nothing unless schwarm-plan.txt allows it and the QUEEN is running)

**RAM:** 56 (registry; measured 54 GB, mostly destroyW0r1dD43m0n 32 + b1tflum3 16)

**Needs:** Singularity (Source-File 4); without it it exits at once. A hand-edited schwarm-plan.txt on home with 'BEENDEN: ja', 'GILT-FUER-NODE: <current BitNode number>', 'WEG: daedalus | weltdaemon | flume' and 'ZIEL-NODE: <1-15>'. The QUEEN running (it publishes the release, which expires after 30 s). SCHWARM-GENESIS.js and SCHWARM-HELPERS.js on home.

**On / off:** Dashboard button 'BITNODE' (shown at the end of the button row). Default OFF. AUTO never touches it. Even when ON it only runs while the plan release is valid; the real 'go' is the plan file. File alternative: BITNODE:0/1.

**Good to know:** This is the most drastic script: it ends your run. 'flume' leaves the BitNode WITHOUT a Source-File reward. The GILT-FUER-NODE line is a safety lock, so a release you forgot about stops working after a BitNode change. Set 'BEENDEN: nein' again when you are done.

### SCHWARM-STANEK.js (payload STANEK)

**What it does:** Handles Stanek's Gift. It accepts the gift if possible, computes the best fragment layout for the current BitNode (it tries every fragment count and fills gaps with Boosters), places the fragments, and charges them through a separate loader script (SCHWARM-STANEK-LADER.js) with as many threads as possible on the best server (home, a large purchased server, or a hacknet server with many cores). Status goes to the STANEK_OUT port and the file /schwarm-stanek.txt.

**How it runs:** Requested as a one-shot (owner QUEEN, pinned to home). ARSENAL requests it once per run (after the casino, before the first augmentation purchase), GENESIS may start it early, and the QUEEN re-requests it when the RAM pool has grown enough for a stronger recharge. Its first action is to switch its own switch off. After a charge it stays awake and checks every 60 s whether it can recharge with at least 3x the thread strength. It exits right away if there is nothing to do or the gift can't be accepted.

**Run it on its own:** run SCHWARM-STANEK.js [--host <server>] [--ziel <charge>]   --host forces the server the loader runs on; --ziel sets the target charge (default 150).

**RAM:** 29 (registry; the daemon itself is about 25 GB). The loader uses 2 GB per thread on the server it charges from.

**Needs:** Stanek's Gift: Source-File 13 or BitNode 13. The gift can only be accepted while no augmentation other than NeuroFlux Governor has been installed in this BitNode. Optionally SF5 to read BitNode multipliers itself (otherwise it takes them from INFO). Needs SCHWARM-HELPERS.js.

**On / off:** No Dashboard button (removed on purpose). Default OFF. ARSENAL/GENESIS/QUEEN switch it on when needed, and it switches itself off. AUTO ignores it.

**Good to know:** Fragment charge is lost at every augmentation install (the fragments stay in place), which is why it runs again after each reset. If the log says the gift is 'nicht annehmbar', you already installed an augmentation in this BitNode, and only a BitNode change reopens that window.

### SCHWARM-SCAN.js (payload SCAN)

**What it does:** Interactive network map in the Terminal. It prints a tree of all servers with root/backdoor status, required hacking level, coding contracts and (optionally) money, security and RAM. Server names and [backdoor] tags are clickable and type the connect chain into the terminal for you.

**How it runs:** True one-shot (owner QUEEN, pinned to home). A Dashboard click starts it; it finishes in under a second. Its first action is to set its own switch back to OFF.

**Run it on its own:** run SCHWARM-SCAN.js [--hide-stats]   (run it on home; --hide-stats leaves out the money/security/RAM columns)

**RAM:** 6 (registry)

**Needs:** The game's Terminal (DOM); if the Terminal tab isn't open it tries to switch to it. SCHWARM-HELPERS.js. No Source-File.

**On / off:** Dashboard button 'SCAN' works as a trigger: one click, one map. Default OFF, and it turns itself OFF again.

**Good to know:** Click navigation depends on React internals of the game. After a game update the map may still display correctly while the clicking stops working. Faction servers (CSEC, avmnite-02h, I.I.I.I, run4theh111z, w0r1d_d43m0n, fulcrumassets) are highlighted.

### SCHWARM-LOGVIEW.js (payload LOGVIEW)

**What it does:** Opens its own tail window 'SCHWARM - LOGBUCH' that always shows the newest DIAG report (SCHWARM-REPORT-<n>.txt, or SCHWARM-REPORT.txt), color-coded: green = running, yellow = look at this, red = broken, blue = numbers. It checks for a new report every 5 s.

**How it runs:** Endless display daemon (owner QUEEN). It runs while its switch is on and closes its window when stopped.

**Run it on its own:** run SCHWARM-LOGVIEW.js  (no arguments; run it on home)

**RAM:** 3 (registry; the engine confirmed 1.80 GB)

**Needs:** DIAG reports on home, so DIAG must be switched on or running ('run SCHWARM-DIAG.js 60 2000 0 10' is the continuous mode the window itself suggests). No imports, no Source-File.

**On / off:** Dashboard button 'LOGVIEW'. Default OFF. When AUTO is on, the QUEEN switches it OFF after 2 hours without input (it counts as a pure display). File alternative: LOGVIEW:0/1.

**Good to know:** If the window only says 'Noch kein Report da' (no report yet), DIAG isn't producing reports. Possible pitfall found in the code: it lists reports on home but reads them with ns.read, which only reads files on the server it is running on. Since the registry no longer pins it to home, the QUEEN may place it on a purchased server, and then it would never see a report. In that case start it by hand on home.

### SCHWARM-BACKDOOR.js (payload BACKDOOR_PAYLOAD)

**What it does:** Installs backdoors automatically. It walks the connect path to a target server with ns.singularity.connect() (no terminal typing), runs installBackdoor(), and finally connects you back to home. Faction servers (CSEC, avmnite-02h, I.I.I.I, run4theh111z, fulcrumassets) come first, which triggers their faction invitations.

**How it runs:** One-shot (owner HACKING = the Dispatcher; the QUEEN never starts it). On its slow tick the Dispatcher starts up to 5 copies in parallel, one per open target (rooted, hacking level high enough, not your own server, no backdoor yet).

**Run it on its own:** run SCHWARM-BACKDOOR.js <hostname>  (backdoors that one server) or run SCHWARM-BACKDOOR.js  (collect mode: every eligible server one after another)

**RAM:** 9 + 5 burst (registry); the Dispatcher measures the real script size (fallback 16)

**Needs:** Singularity (Source-File 4) for connect/installBackdoor. The Dispatcher does not check this itself, and the payload's calls simply fail without SF4. Root access plus a hacking level at or above the target's requirement. The Dispatcher (HACKING) must run for automatic use.

**On / off:** No Dashboard button (triggered daemon). It runs unless schwarm-queen-state.txt contains BACKDOOR:0; add that line to stop it.

**Good to know:** w0r1d_d43m0n is always skipped because a backdoor there ends the BitNode. The payload only allows it if schwarm-plan.txt releases 'WEG: weltdaemon' for the current BitNode. Running several copies at once is safe, and at the end your terminal is connected to home again.

### schwarm-solver.js (payload SOLVER)

**What it does:** Coding-contract solver. It scans the whole network once, solves every .cct contract it knows how to solve (stock trader I-IV, paths in a grid, IP addresses, Hamming codes, compression, ciphers, graph coloring and more), prints 'geloest X / fehlgeschlagen Y' to the terminal and exits.

**How it runs:** One-shot. The Dispatcher starts it on a server with enough free RAM once at least 5 contracts exist in the network. DARKNET also uses it in 'local' mode on darknet servers.

**Run it on its own:** run schwarm-solver.js  (whole network) or run schwarm-solver.js local [port]  (only the contracts on this server; if a port number above 0 is given, it reports 'host;SOLVE:DONE:solved/total' there)

**RAM:** not in the registry; the Dispatcher measures it (fallback value 24)

**Needs:** The ns.codingcontract API (no Source-File). It is not in the DAEMONS registry.

**On / off:** No switch of its own. It runs whenever the Dispatcher (Dashboard button 'HACKING', default ON) runs.

**Good to know:** A wrong answer uses up one of the contract's attempts. Contract types it doesn't know count as 'failed' and are left alone.

### Workers: schwarm-h.js / schwarm-g.js / schwarm-w.js / schwarm-s.js / schwarm-wl.js (payloads WORKER_H/G/W/S/WL)

**What it does:** The tiny scripts that do the actual hacking. schwarm-h.js = one hack(), schwarm-g.js = one grow(), schwarm-w.js = one weaken() on a target, schwarm-s.js = one share() (boosts faction reputation gain for about 10 s), and schwarm-wl.js = a weaken loop that never ends, used only for hacking-XP farming.

**How it runs:** The Dispatcher materializes them and starts them in large numbers on all rooted servers, purchased servers and home. GENESIS also writes the hack/grow/weaken workers itself for the early hacker before the Dispatcher runs. All except schwarm-wl.js end by themselves after one call. schwarm-wl.js is reported by the Dispatcher and killed by the QUEEN when a daemon needs the RAM. Share workers are only started while WORK reports that faction reputation is being farmed.

**Run it on its own:** not meant to be run alone. Technically 'run schwarm-h.js <target>' hacks the target once. Argument 0 is the target. The other arguments are bookkeeping labels that the Dispatcher reads via ps() (delay, uid, class core/prep/xp/share); schwarm-wl.js gets [target, "xp"]. For grow/hack, a third argument of the text "1" makes the call also move the stock price (set only by the Dispatcher's stock-manipulation stage).

**RAM:** Per thread, measured by the Dispatcher (these are its fallback values): hack 1.70, grow 1.75, weaken 1.75, xp-loop weaken 1.75, share 4.00

**Needs:** The Dispatcher (SCHWARM-DISPATCHER.js, registry key HACKING) and root access on the servers they run on. No Source-File.

**On / off:** No switch of their own. They follow the Dispatcher: Dashboard button 'HACKING' (default ON).

**Good to know:** When the Dispatcher needs RAM it kills workers in the order share -> xp -> prep. 'core' workers (hack/grow/weaken on active targets) are never killed and just finish. Seeing thousands of these processes is normal.


## Optional tools

### SCHWARM-SONDE.js

**What it does:** A read-only 'API probe' that checks the game's numbers are sane. Every minute it checks the player (money, HP, skills) and a rotating window of 12 servers: no negative or non-finite values, money not above max, security not below min, used RAM within 0..max, and short getters matching getServer(). Anything odd is appended with a timestamp to SCHWARM-SONDE-BEFUND.txt. A 'HEARTBEAT' line at the top shows it is alive even when it finds nothing.

**How it runs:** Manual tool. Not in the DAEMONS registry, so QUEEN never starts or stops it. Once started it runs forever (one round every 60 s) until you kill it.

**Run it on its own:** run SCHWARM-SONDE.js   (no arguments). Read results with: cat SCHWARM-SONDE-BEFUND.txt   Stop with: kill SCHWARM-SONDE.js

**RAM:** Not in the registry. By the game's RAM cost table about 4.55 GB (1.6 base + getServer 2 + getPlayer 0.5 + scan 0.2 + three small getters).

**Needs:** Nothing: no imports, no Source-Files. It only reads (no hack, buy or other game changes). It writes only its own report file, on the host it runs on (the header assumes home).

**On / off:** No switch or DASHBOARD button. Start it with run and stop it with kill.

**Good to know:** It scans the network only once at startup. Servers you buy later are not checked, and servers that disappear (for example purchased servers deleted by an augmentation install) produce 'getServer/Getter WARF' entries. Restart it after such events. The file is capped at 300 lines, but the code keeps the oldest lines, so once full, NEW findings are dropped (the comment says the oldest are dropped). Delete the file to start fresh. The heartbeat's 'Befunde_gesamt' is the number of lines in the file.

### SCHWARM-EXPORTCHECK.js

**What it does:** A one-time, read-only report on your corporation's export routes. It opens its log window and lists: (1) what each division produces and needs, (2) which export routes really exist, (3) which routes should exist based on the game's industry data, marked OK or FEHLT (missing) with the cities, and (4) a Sector-12 sample of whether imports actually flow. It changes nothing. It explains that routes are stored at the PRODUCING division, so in the game UI you have to look there.

**How it runs:** One-shot, run by hand. Prints its report and exits. Not in the registry; QUEEN never starts it.

**Run it on its own:** run SCHWARM-EXPORTCHECK.js   (no arguments; opens its own tail window). The output labels are German: 'GEKAUFT' = bought, 'FEHLT' = missing, 'ERGEBNIS' = result.

**RAM:** Not in the registry. It calls the Corporation API directly (no RAM dodge): six info functions at 10 GB each plus 1.6 base, about 61.6 GB by the game's cost table. Check with 'mem SCHWARM-EXPORTCHECK.js' before running.

**Needs:** An existing corporation (otherwise it prints 'Keine Corporation.' and stops). The Export unlock for routes to exist; the report shows whether it is bought. Reading warehouses and materials needs the corporation's Warehouse API unlock; without it every lookup fails quietly and the result wrongly looks like 'no routes'. No other scripts needed, but in practice it checks the setup built by SCHWARM-CORP.

**On / off:** No switch; you run it when you want a report.

**Good to know:** The 'should' list is every pair where one division produces a material another division needs, so it may list routes that are not worth building. Section 4 only samples Sector-12. Safe to run at any time because it only reads.
