# SCHWARM — Beginner's Guide

> **Note for beginners:** SCHWARM is German for "swarm". The code, the in-game log messages, the dashboard tooltips and the DIAG reports are all in **German**. A short glossary is at the end of this page.

---

## 1. What SCHWARM does

SCHWARM is a set of scripts that plays Bitburner (v3.0.x) mostly on its own. It roots every server it can reach. A central hacking engine (the **Dispatcher**) runs weaken, grow and hack workers on all of them, and it also solves coding contracts and installs backdoors. An economy manager (**BANK**) spends your money:

- purchased servers, home RAM and cores
- Hacknet servers and hashes
- stock market access (WSE account, TIX API, 4S data)
- augmentations and grafting
- founding a corporation

The swarm also handles these areas:

| Area | What the code does |
|---|---|
| Money and progress | Stock trading (**TRADER**). Factions, company jobs, crime and sleeves (**WORK**). |
| Side systems | Gang (**GANGS**), Bladeburner (**BLADEBURNER**), corporation (**CORP**), the v3.0 Darknet (**DARKNET**), IPvGO (**GO**), infiltration (**INFIL**) and Stanek's Gift (**STANEK**). |
| Augmentations | When a round of augmentations has been bought, it installs them (**RESET**) and restarts itself. |
| Ending a BitNode | It can end a BitNode and pick the next one (**BITNODE**), but only after you approve it in a plan file. |

One process, the **QUEEN**, decides which of these parts run and where. You control it through an in-game **DASHBOARD**.

---

## 2. Start-up chain

### The one command you run

Put all `SCHWARM-*.js` files on `home` (see [Installation](../README.md#installation)). Then type this in the terminal:

```
run SCHWARM-GENESIS.js
```

It takes no arguments. GENESIS calls itself the universal "start of everything".

> **Warning:** when GENESIS starts, it **kills every other script on `home` and runs `killall` on every server it can reach**. That includes your own scripts.

### What happens next

1. **GENESIS (bootstrap)**
   - Stops any older SCHWARM chain.
   - Refreshes a backup of all SCHWARM scripts (`SCHWARM-SICHERUNG.txt` on home, plus a copy on `n00dles`). Any SCHWARM script that has gone missing is written back from this backup.
   - If a DIAG job was still unfinished, it restarts DIAG first, but only if home has room.
   - Writes three tiny hacking workers, roots servers and hacks the best target ("prep first, then hack") until you have **$500k**.
   - **With SF4 (Singularity):** it also trains all four combat stats to 10 at Powerhouse Gym (Sector-12). Then it commits the best crime with at least a 50% success chance (Shoplift, Mug or Homicide).
   - **Without SF4:** it only hacks. The log says `Singularity: nicht verfügbar (kein SF4) — nur Hacking`.
   - If available, it briefly starts DARKNET, STANEK, CORP or GO before the casino (using at most half of the free home RAM). If you already have a gang, it sets every member to the best money task.

2. **Casino (at most once per augmentation cycle)**
   - GENESIS writes `casino.js` from an embedded copy. This is *casino.js by alainbryden (MIT)*, unchanged except for replacing its `helpers.js` import.
   - It starts `casino.js` with `--kill-all-scripts`, which ends every other script.
   - casino.js travels to Aevum (this costs $200k) and plays blackjack until it has won about **$10b** and is kicked out. It reloads the save when it loses too much.
   - A marker file (`/Temp/schwarm-casino-done.txt`) stores the time of the last augmentation reset, so GENESIS never starts the casino twice in the same cycle.
   - The code comments say the casino is really only needed once per BitNode. If you were already kicked out, casino.js notices this and hands straight over to ARSENAL.

3. **ARSENAL** (started automatically when the casino finishes, or directly by GENESIS if the casino already ran)
   - Cleans up the old eval cache and detects which features you have unlocked.
   - With SF4, it buys the **TOR router** and **DarkscapeNavigator.exe** (the Darknet entry). It also upgrades home RAM up to **64 GB**, the code's minimum for "Queen + BANK + Dashboard + headroom".
   - Without SF4, it prints manual instructions (see Troubleshooting).
   - Turns on the one-time STANEK run. This must happen before the first augmentation purchase of the run.
   - Turns **off** any daemon whose prerequisite is provably missing: a gang without enough karma, Bladeburner without the right stats and augmentation, a corporation below the soft-cap limit. ARSENAL never turns anything **on**.
   - Starts the **QUEEN**.

4. **QUEEN (normal operation)**
   - Every 2 seconds it reads the switch file, the plan file and your unlocked features, then starts or stops daemons.
   - The DASHBOARD starts first, so you have the buttons right away.
   - Daemons go to purchased servers first, then other rooted servers, then home. Some are pinned to home: the Dispatcher, CORP, RESET, BITNODE, DIAG, SCAN, STANEK and INFIL.
   - It restarts crashed daemons and runs the augmentation-install cycle.

### After an augmentation install or a new BitNode

The install is done by the RESET daemon, and a BitNode ending by the BITNODE daemon. Both hand `SCHWARM-GENESIS.js` to the game as a callback, so **the whole chain starts again by itself**.

> **Warning:** if you install augmentations **by hand** through the game UI, nothing restarts. In that case, type `run SCHWARM-GENESIS.js` yourself.

### Restarting by hand

Running `run SCHWARM-GENESIS.js` again at any time is safe. It cleans up the running swarm. If the casino already ran in this cycle, it skips the casino and goes straight to ARSENAL and then the QUEEN.

---

## 3. Minimum requirements

### Home RAM

- A fresh BitNode starts with **8 GB** on home. GENESIS is built to start there and places its workers on other rooted servers.
- The code's own minimum for normal operation is **64 GB home RAM** (ARSENAL: `HOME_MIN_GB = 64`). With SF4, ARSENAL buys this automatically with the casino money. **Without SF4 you have to upgrade home RAM yourself.**
- Registry RAM for the core daemons:
  - Dispatcher (`HACKING`): 18 GB, pinned to home
  - DASHBOARD: 8 GB
  - BANK: 25 + 5 GB
- **INFO** (the shared data service) needs one server with **248 GB free** (74 + 176 GB burst). Until such a server exists it doesn't start, and the other daemons use fallbacks.
- A higher SF4 level makes Singularity calls much cheaper:
  - At SF4 level 1, a single WORK call can cost about 80 GB.
  - RESET's `installAugmentations` costs 80 GB at SF4.1 but 5 GB at SF4.3.
  - The AUGS notes say costs multiply ×4/×16 below SF4.3.

### Source-Files and other unlocks

| Unlock | What it enables in SCHWARM (from the code) |
|---|---|
| **SF4** (Singularity) | Gym and crime in the early phase. ARSENAL's automatic purchases. WORK, AUGS (buying augmentations), RESET (installing them), BACKDOOR, INFIL and BITNODE. Without SF4 there is no automatic augmentation cycle. |
| **SF2** (or BitNode 2) | Gangs. Outside BN2 you also need **karma ≤ -54,000** to create one. |
| **SF3** (or BitNode 3) | Corporation. BANK founds it at $150b; in BN3 founding is free with seed money. BANK and ARSENAL only allow it when the BitNode's CorporationSoftcap is **≥ 0.75**. |
| **SF7** (or BitNode 7) | Bladeburner. This is what the capability check tests. The daemon also needs **The Blade's Simulacrum installed** and **100 in strength, defense, dexterity and agility**. Without the Simulacrum, any other work cancels Bladeburner actions. |
| **SF9** (or BitNode 9) | Hacknet *servers* (hashes), which BANK spends. |
| **SF10** (or BitNode 10) | Sleeves (driven by WORK, so SF4 is needed too). The code notes that Grafting also requires SF10. |
| **SF13** (or BitNode 13) | Stanek's Gift. It must be accepted before the first augmentation purchase of a run, and ARSENAL arranges that. Without SF13 the STANEK payload reports "locked". |
| **SF5** (optional) | Lets the swarm read BitNode multipliers. Some checks fall back to older behaviour without it. |
| **TIX API** | Stock trading (TRADER). BANK buys the WSE account, TIX API and 4S data itself. |
| **DarkscapeNavigator.exe** | The Darknet (DARKNET). ARSENAL buys it with SF4. DARKNET then earns the port-opener programs. |

---

## 4. Control surfaces

### 4.1 DASHBOARD

The Queen starts the DASHBOARD automatically. It opens a window titled **"SCHWARM-OS // SCHALTTAFEL"** (switchboard). The window contains:

- **Button bar:** one button per daemon (details below).
- **ENDGAME bar:** blinks when a way to end the BitNode is available right now. It is information only and never triggers anything.
- **[ KINETIK ]:** RAM usage of the whole pool as a colored bar. Green is hack, yellow grow, cyan weaken, blue prep, magenta XP, white share, light red other daemons and grey reserved. A second bar shows Hacknet-server RAM.
- **BRUECKE / PRUEFER lines:** status of the author's PC bridge. If you don't use it, it shows "noch kein Lebenszeichen" (no sign of life yet), which is harmless.
- **Overview HUD:** extra lines in the game's left overview panel (income, expenses, hashes, karma, gang territory, corporation, stocks, reserve). The details are in their tooltips.

The DASHBOARD also records when you last pressed a key, clicked or scrolled in the game window. The AUTO switch uses this.

**Buttons**, in bar order. "Default" is the state when the key is not yet in the switch file (first start). RAM is the registry value in GB (minRam + burst).

| Button | What it does | Default | Needs | RAM |
|---|---|---|---|---|
| HACKING | The Dispatcher: hack/grow/weaken workers, contract solver, backdoors | on | – | 18 (home) |
| BANK | Economy: servers, home RAM and cores, Hacknet and hashes, stock accounts, augmentation choice, corporation founding, grafting | **off** | – | 25+5 |
| WORK | Factions, company jobs, crime, joining Bladeburner, creating the gang, sleeves | **off** | SF4 | 7+24 |
| CORP | Runs the corporation once it exists | **off** | SF3 | 5+24 (home) |
| DARKNET | Darknet exploration, caches, port openers | **off** | Navigator | 8 |
| GO | Plays IPvGO | **off** | – | 13 |
| TRADER | Stock trading; runs only when BANK asks for it | on | TIX API | 39+5 |
| BLADEBURNER | Bladeburner actions | on* | SF7 + Simulacrum + stats | 4+24 |
| GANGS | Gang management | on* | gang access + karma | 38+8 |
| INFIL | Infiltration: reputation until augmentation needs are met, then money | **off** | SF4 | 15+16 (home) |
| DIAG | Diagnostic reports | **off** | – | 9 (home) |
| LOGVIEW | Window that shows the newest DIAG report | **off** | – | 3 |
| OVERVIEW | The HUD lines in the overview panel (no process) | on | – | 0 |
| SCAN | One-shot: interactive network map in the terminal. A click runs it once | – | – | 6 (home) |
| RESET | **Armed** means the swarm installs augmentations once BANK reports that the round is done | on (armed) | SF4 | 14 (home) |
| INFO | Shared data service for the other daemons | on | 248 GB host | 74+176 |
| AUTO | Self-management (see 4.2) | on | DASHBOARD running | – |
| BITNODE | Ends the BitNode when the plan file approves it (see 4.3) | **off** | SF4 | 56 (home) |

\* ARSENAL switches BLADEBURNER and GANGS off again after a reset if their prerequisites are missing.

Some daemons have **no button**:
- **AUGS:** one-shot augmentation buyer, started for BANK.
- **BACKDOOR:** started by the Dispatcher.
- **STANEK:** one-shot, turned on by ARSENAL once per run.
- **SLEEVES:** switch only, controlled by WORK. You can set `SLEEVES:0` in the switch file.
- **DASHBOARD** itself.

**Clicking a button** toggles it: on sends START, off sends STOP. The Queen writes the new state to the switch file and starts or stops the daemon within its 2-second cycle. SCAN is a trigger: every click runs it once.

**Button colors:**

| Color | Meaning |
|---|---|
| green | running |
| cyan | forced / running right now |
| yellow | switched on but not running yet (for example waiting for RAM) |
| red | being stopped |
| grey | off |
| magenta | waiting for an unlock (missing Source-File or feature) |

Special cases:
- **RESET:** green means armed, cyan means it is installing right now.
- **BITNODE:** blinks yellow and red when ending the BitNode is possible right now. If its switch is off, you could end the BitNode by hand on the Bladeburner page.
- **AUTO:** the tooltip shows the minutes left until self-management kicks in.

### 4.2 The switch file: `schwarm-queen-state.txt`

- It lives on `home` and is **one line** in this form:
  ```
  KEY:mode|KEY:mode|...
  ```
  `mode` is `0` = off, `1` = on (allowed), `2` = forced (start even if the owner daemon didn't ask). For example: `BANK:1|WORK:1|DIAG:0|RESET:1`.
- A key that is missing uses the registry default from the table above.
- `0` beats everything. With `1`, a daemon owned by BANK (TRADER, AUGS) still only runs when BANK asks for it.
- The file survives augmentation installs and BitNode changes.
- **The easiest way to change a switch is the DASHBOARD button.** You can also edit the file on home (for example `nano schwarm-queen-state.txt`). Change the numbers, but **don't delete entries**: the Queen restores keys that suddenly disappear.
- Switching a daemon to `0` makes the Queen stop it, whatever changed the file.
- **AUTO** (on by default):
  - It immediately turns **off** any daemon whose prerequisite is provably missing.
  - After **2 hours with no key press, click or scroll in the game window**, it turns **on** everything whose unlock exists and whose prerequisites are proven, and turns OVERVIEW and LOGVIEW off.
  - It never touches BITNODE, the one-shots (SCAN, STANEK, RESET, AUGS) or AUTO itself.
  - Without a running DASHBOARD, AUTO does nothing.

### 4.3 The plan file: `schwarm-plan.txt`

This file holds your strategy. The swarm only **reads** it and never writes to it. It is the **only** place where ending a BitNode can be approved.

- **Format:** lines like `KEY: value`. Everything after `#` is a comment. Unknown keys are ignored.
- The file must be on `home`. Edit it in the game (for example `nano schwarm-plan.txt`). The Queen re-reads it every 2 seconds.
- If the file is missing, the swarm runs normally but never ends a BitNode. The log says `PLAN: schwarm-plan.txt nicht gefunden` (not found).
- The installer downloads an **example plan** with `BEENDEN: nein` (never end a BitNode) - but only if you do not have a `schwarm-plan.txt` yet. Adjust it to your game.

| Key | Meaning |
|---|---|
| `SOLL-NODE` | The BitNode this run is **supposed** to be in. It is only compared with the current one; a mismatch logs `PLAN: ABWEICHUNG` (deviation). Set it to your current BitNode to silence that. If this key is missing, `ZIEL-NODE` is used for the comparison. |
| `ZIEL-NODE` | The **next** BitNode (a number from 1 to 15). BITNODE passes it to the game when ending the run. |
| `BEENDEN` | `ja` or `nein` (German for yes/no). **Only the word `ja` works.** |
| `GILT-FUER-NODE` | Must equal the **current** BitNode number. After you move to a new BitNode, an old approval stops working by itself. |
| `WEG` | How the run ends (see below). |

**Values for `WEG`:**

- **`daedalus`:** finish the Bladeburner black op "Operation Daedalus". The BLADEBURNER daemon only touches it with this approval. BITNODE then ends the run once **all** black ops are done.
- **`weltdaemon`:** hack the world daemon `w0r1d_d43m0n`. BANK buys *The Red Pill* only with this approval; it costs no money but needs Daedalus reputation. It must be **installed** first. BITNODE acts once you have admin rights on `w0r1d_d43m0n` and enough hacking skill.
- **`flume`:** a side exit (`b1tflum3`). It needs only SF4 and a valid `ZIEL-NODE`, but gives **no Source-File**, and the current run is lost.

Other keys in the shipped file (`SOLL-GRUND`, `BN10-AUSSTIEG`, `REDPILL-WEG`, `BLADEBURNER-START`, `REIHENFOLGE`, `UEBERSPRUNGEN`, `NOTIZ` and so on) are **notes**. The code does not read them. For example, the Blade's Simulacrum rule is enforced in the code separately.

**To opt in to ending a BitNode, all of these must be true:**
1. The **BITNODE** button is on. It is off by default.
2. The plan has `BEENDEN: ja`, `GILT-FUER-NODE: <current BitNode>`, a valid `WEG` and a valid `ZIEL-NODE`.
3. You have SF4.
4. For `daedalus` and `weltdaemon`, the game condition is actually met. BITNODE checks this itself and does not just trust the approval.

Example, ending BitNode 6 through Daedalus and moving to BitNode 12:
```
SOLL-NODE: 6
ZIEL-NODE: 12
BEENDEN: ja
GILT-FUER-NODE: 6
WEG: daedalus
```

GENESIS starts by itself in the new BitNode. Afterwards set `BEENDEN` back to `nein`, as the plan file's own comments recommend.

### 4.4 DIAG reports

- **With the DASHBOARD button:** the Queen starts DIAG in continuous mode (arguments `60 2000 0 10`). Every **10 minutes** it writes a full report to a new file **`SCHWARM-REPORT-<n>.txt`**, until you switch DIAG off.
- **By hand:**
  ```
  run SCHWARM-DIAG.js <windowSec> <intervalMs> <cycles> <gapMin>
  ```
  For example, `run SCHWARM-DIAG.js 60 2000 4 15` makes 4 reports 15 minutes apart. They go into **`SCHWARM-REPORT.txt`**: the first cycle is complete and later cycles list only changes. Then DIAG switches itself off.
  - With no arguments, DIAG continues an unfinished job; otherwise it uses `60 2000 4 15`.
- **Other files it writes:**
  - `schwarm-kurz.txt`: a short version in abbreviations
  - `schwarm-legende.txt`: a generated legend for those abbreviations
  - `schwarm-diag-lauf.txt`: job progress, so a job continues after an augmentation install
- **LOGVIEW** shows the newest report in its own window.
- Reports are in German. Nothing in the game scripts deletes old `SCHWARM-REPORT-<n>.txt` files (the author's PC bridge normally collects them), so remove old ones with `rm` now and then.

### 4.5 Optional tools

| Script | What it does |
|---|---|
| `SCHWARM-SONDE.js` | Read-only API probe. Writes findings to `SCHWARM-SONDE-BEFUND.txt`. |
| `SCHWARM-EXPORTCHECK.js` | Read-only check of corporation export routes. |

---

## 5. Stopping and updating

### Stopping

- **One part:** click its DASHBOARD button until it is grey.
- **No automatic augmentation installs:** switch **RESET** off (grey).
- **No BitNode ending:** leave **BITNODE** off and `BEENDEN: nein`.
- **`killall` in the terminal:** stops the scripts on the server you are connected to (home). That includes the Queen and the Dispatcher. Daemons that the Queen placed on purchased servers keep running there.
- **Everything, everywhere, keeping the SCHWARM files:**
  ```
  run SCHWARM-CLEAN.js --keep-swarm --dry-run   (shows what would happen)
  run SCHWARM-CLEAN.js --keep-swarm
  ```
  This kills every process on home and on all rooted servers, clears ports 1 to 40 and writes a backup. It then **deletes every file on home whose name does not start with "schwarm"**. It keeps `.exe` programs, the backup and the `schwarm-chronik-*` files, but **your own scripts are deleted**. Always do a `--dry-run` first.
- **Full wipe:** `run SCHWARM-CLEAN.js` with no flags deletes everything on home except the cleaner itself, the backup `SCHWARM-SICHERUNG.txt`, `.exe` programs and the chronicle. `--wipe-all` deletes `.exe` files too.
- **Restore after a wipe:**
  ```
  run SCHWARM-CLEAN.js --restore
  ```
  This writes all scripts back from `SCHWARM-SICHERUNG.txt` (from home, or from the copy on `n00dles`) and starts GENESIS.
- **Starting again:** `run SCHWARM-GENESIS.js`.

### Updating

Download the new versions **over** the old files, keeping the same names, while the swarm runs:

- The running Queen notices a new `SCHWARM-QUEEN.js`, `SCHWARM-HELPERS.js` or `SCHWARM-PAYLOADS.js`. It checks every 20 seconds, confirms on the next check and then restarts itself without stopping the daemons.
- Daemons whose code changed are restarted by the Queen's code check, which also runs every 20 seconds.
- Changes to `SCHWARM-GENESIS.js` and `SCHWARM-ARSENAL.js` take effect the next time they run. `schwarm-plan.txt` is re-read every 2 seconds.
- If anything looks stuck afterwards, run `run SCHWARM-GENESIS.js`.
- **Deleting a SCHWARM script does not remove it for good:** GENESIS writes missing `SCHWARM*.js` files back from `SCHWARM-SICHERUNG.txt` the next time it runs.

---

## 6. Troubleshooting

These are the problems the code itself warns about:

- **`Singularity: nicht verfügbar (kein SF4) — nur Hacking`** or **`HINWEIS: Kein SF4 (Singularity)`**
  You have no SF4. Do these by hand, as ARSENAL prints them:
  1. Buy the TOR router.
  2. Buy DarkscapeNavigator. It is cheaper in Chongqing, at the Shadowed Walkway.
  3. **Don't** buy port openers; DARKNET earns them.
  4. Upgrade home RAM yourself.

- **`FEHLER: Queen-Start fehlgeschlagen (RAM zu knapp?)`** or **`ERROR [GENESIS] Casino-Start fehlgeschlagen (RAM?)`**
  Not enough free RAM on home. Upgrade home (64 GB is the code's minimum) and start the Queen by hand with `run SCHWARM-QUEEN.js`.

- **`'SCHWARM-QUEEN.js' fehlt auf home`**, **`Payload '…' fehlt auf home`** or **`Worker-Payload … liess sich nicht schreiben`**
  A file is missing or broken, usually `SCHWARM-PAYLOADS.js` or `SCHWARM-HELPERS.js`. Copy it again.

- **Casino problems**
  - It needs $200k to travel to Aevum (`Sorry, you need at least 200k…`). GENESIS collects $500k first.
  - **Don't click around or start focused work while casino.js runs.** It stops with messages about focus being stolen or the page being left.
  - It reloads the save on losses; that is intended.
  - When it is done it logs `SUCCESS: We've been kicked out of the casino.` and starts ARSENAL.

- **Nothing is bought and no augmentations are installed**
  **BANK is off by default.** Turn on BANK (and WORK if you have SF4), or wait for AUTO. RESET must be green (armed).

- **I installed augmentations by hand and now nothing runs**
  A manual install does not restart the chain. Run `run SCHWARM-GENESIS.js`.

- **Button stays magenta (`wartet auf Freischaltung`)**
  The needed Source-File or feature is missing (see section 3).

- **Button stays yellow**
  After 5 minutes the Queen prints `WARN [QUEEN] <KEY> ist eingeschaltet, laeuft aber seit … s nicht: <reason>`. Usual reasons are not enough free RAM, or the owner (BANK) not asking for the daemon.

- **I switched on GANGS, BLADEBURNER or CORP and it flipped back to grey**
  The prerequisite is not met, and AUTO or ARSENAL switched it off. ARSENAL prints `Voraussetzung (noch) nicht erfuellt, abgeschaltet: …`. The prerequisites are:
  - GANGS: karma ≤ -54,000, unless you are in BN2 or already in a gang
  - BLADEBURNER: The Blade's Simulacrum installed and 100 in all four combat stats
  - CORP: CorporationSoftcap ≥ 0.75

- **`PLAN: ABWEICHUNG …`**
  Set `SOLL-NODE` to your current BitNode.

- **`PLAN: BEENDEN steht auf ja, aber GILT-FUER-NODE oder WEG passt nicht`**
  Check the numbers, and remember that only `ja` counts as yes.

- **BITNODE log `BITNODE wartet: …`**
  The reason follows the colon:
  - `keine frische Freigabe`: no current approval
  - `ZIEL-NODE fehlt oder ist unplausibel`: ZIEL-NODE missing or invalid
  - `SCHWARM-GENESIS.js fehlt auf home`: GENESIS is not on home
  - `Engine-Bedingung noch nicht erfuellt`: the game condition is not met yet

  **`WARN [BITNODE] weder destroyW0r1dD43m0n noch b1tflum3 (kein SF4)`** means you need SF4.

- **`Schalter X liess sich nicht setzen`**
  Writing the switch file failed, so the daemon and the file now disagree. Set the switch again.

- **Clicking "Cancel Infiltration"** turns INFIL off on purpose. Switch it on again on the DASHBOARD.

- **Remote API offline after loading** (only if you push files from your PC through Bitburner's Remote API)
  The game tries to connect only once, 2 seconds after it starts. If the save loads slower, the connection stays offline. Use Options → Remote API → Connect once after the game has loaded.

- **`WARN [QUEEN] läuft bereits` / `WARN [GENESIS] läuft bereits`**
  A second copy was started. It ends itself, which is harmless.

---

## Mini glossary (German → English)

| German | English |
|---|---|
| ja / nein | yes / no |
| an / aus | on / off |
| läuft / startet… / wird beendet | running / starting… / being stopped |
| scharf | armed |
| Schalter | switch |
| BEENDEN | end (the BitNode) |
| GILT-FUER-NODE | valid for BitNode |
| SOLL-NODE / ZIEL-NODE | intended BitNode / next BitNode |
| WEG | route |
| weltdaemon | world daemon (`w0r1d_d43m0n`) |
| Freigabe | approval |
| Voraussetzung | prerequisite |
| Befund | finding |
| Sicherung | backup |
| Bericht / Lagebild | report / status snapshot |
