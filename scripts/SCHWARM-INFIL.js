/**
 * SCHWARM-INFIL.js — v2.5
 * =============================================================================
 * NEU IN v2.5 - WAEHREND EINES GRAFTINGS WIRD NICHT MEHR PAUSIERT.
 * Frage des Spielers (24.09.2026): "unterbricht infil den crafting vorgang?"
 * Quelltext-Pruefung mit vier unabhaengigen Agenten: nein - die Infiltration
 * ruft weder startWork noch finishWork, der Graft laeuft in der Spielschleife
 * seitenunabhaengig weiter (engine.tsx:97), auch Schaden, Krankenhaus, Sieg
 * und Abbruch fassen ihn nicht an. Live bestaetigt in der Testumgebung auf
 * pi-01. Einziger Preis: ein FOKUSSIERTER Graft verliert beim Seitenwechsel
 * den Fokus (Tempo 0,8); BANK graftet ohnehin unfokussiert. Bis v2.4 standen
 * Geld und Ruf fuer die ganze Dauer jedes Graftings still.
 * GRAFT_PAUSE = true stellt das alte Verhalten her. Jeder Lauf bei laufendem
 * Grafting schreibt "GRAFT-PROBE ... vorher ja, nachher ja/NEIN" ins Lauf-Log.
 *
 * NEU IN v2.4 - Fenster ohne --tail wird ausdruecklich GESCHLOSSEN. Bitburner
 * stellt offene Tail-Fenster je Skript wieder her; blosses Nicht-Oeffnen
 * reichte deshalb nicht. Siehe SCHWARM-CORP.js v0.36.
 *
 * NEU IN v2.3 - TAIL-FENSTER NUR MIT --tail. Es ging bei jedem Start auf und
 * blitzte im Spiel auf. Kein Fehler, nur Stoerung. Gleiche Aenderung wie
 * SCHWARM-CORP.js v0.35.
 *
 * NEU IN v2.2 - "CANCEL INFILTRATION" SCHALTET INFIL AB
 *
 *   Klickt der Spieler waehrend eines Laufs auf "Cancel Infiltration", brach
 *   INFIL bisher nur den Lauf ab und nahm sich das naechste Ziel. Zum wirklichen
 *   Abschalten blieb nur killall. Jetzt legt INFIL den Dashboard-Schalter um und
 *   beendet sich.
 *
 *   ERKENNUNG UEBER DEN KLICK, NICHT UEBER EINE HEURISTIK.
 *   v1.7 bis v1.11 hatten das schon einmal, ueber playerTookFocus() ("es laeuft
 *   eine Arbeit und der Focus-Knopf fehlt"). Das war nicht unterscheidungs-
 *   faehig - genau so sieht es aus, wenn SCHWARM-WORK fokussierte Fraktions-
 *   arbeit macht. Daraus wurde eine Ein/Aus-Schleife, die nur per killall zu
 *   brechen war; in v1.12 flog die Erkennung ersatzlos raus.
 *   Am Infiltration-Objekt ist der Fall ebenfalls nicht zu erkennen:
 *   InfiltrationRoot.tsx raeumt die Infiltration bei JEDEM Seitenwechsel ab
 *   (useEffect(() => cancel, [cancel])), ein Router.toPage() aus einem fremden
 *   Skript sieht also identisch aus.
 *   Der Klick dagegen ist eindeutig: der Spieler erzeugt ein DOM-Ereignis mit
 *   isTrusted === true, INFIL klickt ueber die React-Prop onClick() und erzeugt
 *   ueberhaupt kein DOM-Ereignis, und ein Seitenwechsel erzeugt gar keinen
 *   Klick. Beobachtet wird nur, gesendet wird nichts - die Anti-Automatik haengt
 *   ausserdem an keydown, nicht an click.
 *
 *   ABSCHALTEN UEBER DIE QUEEN, NICHT UEBER DIE STATE-DATEI.
 *   Gesendet wird "STOP:INFIL" auf Port 2 (SCHWARM_PORTS.QUEEN_IN).
 *   SCHWARM-QUEEN handleCommands() macht daraus setDaemonEnabled("INFIL", 0),
 *   loescht das WANT und beendet den Prozess. INFIL schreibt die Queen-State-
 *   Datei bewusst NICHT selbst - genau das tat setOwnSwitch() bis v1.11, ein
 *   Read-Modify-Write von aussen auf eine Datei, die der Queen gehoert.
 *
 *   AUSNAHME VON "INFIL BEENDET SICH NIE SELBST".
 *   Uebernimmt die Queen nicht innerhalb von STOP_GRACE_MS (keine Queen aktiv,
 *   INFIL von Hand gestartet), beendet sich INFIL selbst. Das ist der EINZIGE
 *   Selbstbeenden-Pfad in dieser Datei und er greift ausschliesslich auf eine
 *   ausdrueckliche Anweisung des Spielers hin. Mit --nostop bleibt das alte
 *   Verhalten (Lauf abbrechen, naechstes Ziel).
 *
 *   Der Klick-Handler meldet sich ueber einen Generationsstempel auf globalThis
 *   selbst ab, wenn er von einer aelteren Instanz stammt; zusaetzlich raeumt
 *   ns.atExit() ihn beim Toeten des Skripts ab. Der doppelte Boden ist Absicht -
 *   genau hier hatte inflitrator.js seine Zombies.
 * -----------------------------------------------------------------------------
 * NEU IN v2.1 - BEFUNDE AUS DEM ERSTEN DAUERBETRIEB
 *
 *   1) MARKTSAETTIGUNG WURDE MIT DEM FALSCHEN ZEITSTEMPEL FORTGESCHRIEBEN.
 *      addFloors() lief mit Date.now(), also mit dem Zeitpunkt des LAUFENDES.
 *      Victory.tsx ruft aber
 *          decreaseMarketDemandMultiplier(state.gameStartTimestamp, maxLevel)
 *      und game.ts setzt darin lastChangeTimestamp = timestamp - die Engine
 *      datiert die Erhoehung auf den LAUFBEGINN zurueck, bei 31 Leveln also
 *      rund 50 s in die Vergangenheit. Unsere Schaetzung alterte damit pro Lauf
 *      um genau diese 50 s zu wenig. Nach zwanzig Laeufen meldete das Log
 *      "Demand jetzt 0 %", waehrend die Ertraege unveraendert bei 8-9b lagen -
 *      bei einem echten Multiplikator von 0 waere der Ertrag ebenfalls 0
 *      gewesen, er wirkt rein multiplikativ. Jetzt wird st.gameStartTimestamp
 *      aus der Fiber gelesen und durchgereicht.
 *
 *   2) DIE ERTRAGSERWARTUNG IM LOG WAR SYSTEMATISCH ZU NIEDRIG.
 *      Gemeldet "erwartet 6.47b", tatsaechlich 8.36b - und das bei jedem Lauf.
 *      Ursache: baseRep()/baseCash() lassen WKSharmonizer (1.5 fuer Geld, 1.2
 *      fuer Rep) und currentNodeMults.Infiltration* bewusst weg, weil sie
 *      konstant sind und sich im Ranking wegkuerzen. Fuer die Sortierung
 *      richtig, als Anzeige irrefuehrend. Statt die Multiplikatoren ueber
 *      teure Singularity-Aufrufe zu ermitteln, fuehrt yieldCalib jetzt den
 *      Quotienten aus gemessenem und erwartetem Ertrag als gleitenden Mittel-
 *      wert mit. Das deckt alle Faktoren gemeinsam ab, zieht nach einem
 *      BitNode-Wechsel oder einem neu gekauften Harmonizer von selbst nach und
 *      wirkt AUSSCHLIESSLICH auf die Anzeige, nie auf die Zielsortierung.
 *
 *   3) VERLORENE MINISPIELE WERDEN JETZT ZUGEORDNET.
 *      Bisher stand nur "1 Minispiel(e) verloren" im Log. Ohne den Namen laesst
 *      sich nicht beurteilen, ob ein Loeser ein Problem hat. Der Zaehler haengt
 *      am zuletzt gesehenen SPIELBAREN Modell, weil onFailure() die Stufe
 *      sofort durch ein CountdownModel ersetzt und der Wechsel bei einem
 *      Stufen-Timeout (setStageTime) auch zwischen zwei Takten passieren kann.
 *      Ausgabe: "verloren: SlashModel x2, WireCuttingModel".
 *
 *   4) DIAGNOSE FUER "INFILTRATE-KNOPF NICHT GEFUNDEN".
 *      Trat sechsmal in der Startphase des Schwarms auf, danach nie wieder.
 *      goToLocation() liefert true und macht laut Singularity.ts nur
 *      Router.toPage(Page.Location, {location}) - den Fokus loest es NICHT.
 *      Laeuft eine fokussierte Arbeit (z.B. SCHWARM-WORK), schaltet die
 *      Oberflaeche auf die Work-Seite zurueck und die Location wird nie
 *      gerendert. Das ist ein VERDACHT, keine Feststellung: statt eine
 *      Gegenmassnahme zu raten, protokolliert INFIL jetzt die tatsaechlich
 *      sichtbaren Ueberschriften und Knoepfe sowie getCurrentWork(). Bestaetigt
 *      das Log den Verdacht, ist setFocus(false) der naechste Schritt - das
 *      ruft laut Singularity.ts nur Router.toPage(Page.Terminal) und KEIN
 *      finishWork(), die Arbeit liefe also weiter. Es kostet aber
 *      SingularityFn2 = 3 GB (mal SF4-Faktor) und sprengt damit den
 *      Registry-Eintrag minRam 16 - deshalb erst messen, dann bauen.
 * -----------------------------------------------------------------------------
 * VOLLSTAENDIGER NEUBAU. Der externe Auto-Infiltrator (inflitrator.js) wird
 * nicht mehr benutzt; INFIL spielt selbst.
 *
 * -----------------------------------------------------------------------------
 * !!! ACHTUNG: REACT-INTERNA - KANN BEI JEDEM SPIELE-UPDATE BRECHEN !!!
 * -----------------------------------------------------------------------------
 * Dieses Skript greift ueber die React-Fiber-Eigenschaften "__reactFiber$..."
 * und "__reactProps$..." auf das laufende Infiltration-Objekt zu. Diese Namen
 * sind INTERNA von React und unterliegen KEINER Stabilitaetsgarantie. Bricht
 * nach einem Bitburner- oder React-Update die Zielsuche, sind genau diese drei
 * Stellen anzupassen:
 *
 *     1) fiberOf()        - Praefix "__reactFiber$"
 *     2) propsOf()        - Praefix "__reactProps$"
 *     3) findInfiltration() - Aufstieg ueber fiber.return und die Pruefung
 *                             memoizedProps -> Infiltration-Merkmale
 *
 * Diagnose:  run SCHWARM-INFIL.js --selftest   (waehrend eine Infiltration
 *            laeuft; meldet Brueckenstatus und fehlende Modellfelder)
 *
 * KEIN RUECKFALL AUF TASTATUR-EMULATION. Wenn die Bruecke bricht, startet INFIL
 * gar keinen Lauf. Grund: ui/InfiltrationRoot.tsx
 *     const press = (event) => {
 *       if (!event.isTrusted || !(event instanceof KeyboardEvent)) {
 *         state.onFailure({ automated: true });   // damage = Player.hp.current
 *         return;
 *       }
 *       state.stage.onKey(event);
 *     };
 * Jedes untrusted keydown auf document heisst sofort volle HP und Krankenhaus.
 * Ein "Notbetrieb" mit gefaelschten Events waere also schlimmer als Stillstand.
 *
 * -----------------------------------------------------------------------------
 * WARUM DER NEUBAU
 * -----------------------------------------------------------------------------
 * Der alte Weg (inflitrator.js) faelschte isTrusted, indem er
 * document.addEventListener durch einen Wrapper ersetzte. Daran haingen vier
 * Fehlerquellen, die zusammen die gemeldeten Abbrueche und verlorenen Spiele
 * erklaeren:
 *
 *   1) SCHWARM-INFIL v1.x schickte in dismissDialogs() ein untrusted keydown
 *      mit key "Escape" direkt an document - alle 150 ms, waehrend des Laufs,
 *      sobald irgendein Dialog stand. Mit Wrapper landete "ESCAPE" im
 *      BackwardModel-Rateversuch (nur Backspace/Shift/Ctrl/Alt werden dort
 *      gefiltert) -> onFailure. Ohne Wrapper -> onFailure({automated:true})
 *      -> Krankenhaus. Beides mitten im Lauf.
 *
 *   2) Die Drahtfarben in inflitrator.js standen auf "red"/"blue"/"white"/
 *      "rgb(255, 193, 7)". Die Engine benutzt heute die Okabe-Ito-Palette
 *      (model/WireCuttingModel.tsx): #D55E00 / #F0E442 / #0072B2 / #FFFFFF.
 *      Kein einziger Treffer -> die Regel "Cut all wires colored X" lieferte
 *      nie einen Draht. generateQuestion alterniert Position/Farbe bei
 *      rules >= 2, es ist also IMMER eine Farbregel dabei: jedes
 *      Wire-Cutting-Minispiel lief in den Timeout.
 *
 *   3) endInfiltration() in inflitrator.js setzte state.game nicht zurueck.
 *      Hatte der Folgelauf zufaellig dasselbe erste Minispiel, wurde init()
 *      uebersprungen und mit den Daten des Vorlaufs gespielt (1/8 pro Lauf).
 *
 *   4) "--stop" kehrte vor dem Aufraeumen zurueck (if (args.stop) return steht
 *      vor unwrapEventListeners), und unwrapEventListeners meldete ohnehin
 *      keinen einzigen Wrapper ab, sondern loeschte nur die Buchhaltung. Die
 *      Zombies feuerten in Folgelaeufen mit.
 *
 * Alle vier verschwinden mit dem DOM-Scraping, nicht durch Flickwerk.
 *
 * -----------------------------------------------------------------------------
 * WIE ES JETZT LAEUFT
 * -----------------------------------------------------------------------------
 * InfiltrationStage.ts definiert:
 *     export interface KeyboardLikeEvent {
 *       key: string; altKey: boolean; ctrlKey: boolean;
 *       metaKey: boolean; shiftKey: boolean; preventDefault?: () => void;
 *     }
 * onKey nimmt also ein GEWOEHNLICHES OBJEKT. Wir rufen state.stage.onKey()
 * direkt auf - der press-Handler wird nie durchlaufen, die Anti-Automatik ist
 * strukturell unerreichbar.
 *
 * Mit dem Infiltration-Objekt in der Hand entfaellt jedes Raten:
 *   BackwardModel      answer, guess
 *   BracketModel       left, right
 *   BribeModel         choices, index, correctIndex
 *   CheatCodeModel     code, index
 *   Cyberpunk2077Model grid, answers, currentAnswerIndex, x, y
 *   MinesweeperModel   minefield, answer, x, y, memoryPhase
 *   SlashModel         phase
 *   WireCuttingModel   wiresToCut
 * Dazu state.startingDifficulty, state.maxLevel, state.level, state.results.
 *
 * Nebenwirkung, die viel Aerger erspart: ein modaler Dialog (Fraktions-
 * einladung nach einem Backdoor) stoert den Lauf NICHT mehr, weil unsere
 * Tastenanschlaege nicht mehr durch das DOM laufen. Dialoge werden nur noch
 * vor und nach einem Lauf weggeraeumt, nie waehrenddessen.
 *
 * -----------------------------------------------------------------------------
 * AUS v1.14 UNVERAENDERT UEBERNOMMEN (gegen Engine-Quellen verifiziert)
 * -----------------------------------------------------------------------------
 *   Infiltration/formulas/game.ts     MaxDifficultyForInfiltration = 3.5
 *                                     DecayRate -2e-5, MarketDemandFactor 1e-3
 *                                     calculateDifficulty / calculateReward
 *   Infiltration/formulas/victory.ts  calculateTradeInformationRepReward
 *                                     calculateSellInformationCashReward
 *   Infiltration/utils.ts             calculateDamageAfterFailingInfiltration
 *                                       = startingDifficulty * 3 (halbiert mit
 *                                         WKSharmonizer)
 *   Locations/Hospital.ts             Kosten haengen am HP-Verlust
 *   MoneySourceTracker.ts             Felder "infiltration"/"hospitalization"
 * Ebenso: Zielcache, Fraktionsziele, Market-Demand-Modell, Grafting-Gate,
 * kein Selbstbeenden, kein ns.prompt.
 *
 * -----------------------------------------------------------------------------
 * ERSATZLOS ENTFALLEN
 * -----------------------------------------------------------------------------
 *   inflitrator.js als Prozess, wrapEventListeners/unwrapEventListeners,
 *   wrapperZoo/collectWrappers/sweepWrappers, infiltratorColdStart/Stop,
 *   parseFormattedNumber + Gruppierungs-Regexe, infilPanel/infilTitle/
 *   normalizeTitle/introVisible/victoryVisible, automationTexts/
 *   automationBusted, der Escape-Ausweg in dismissDialogs, LOST_SCREEN_MS und
 *   STALL_LIMIT_MS als DOM-Notanker, diffReps/SoA-Sonderbehandlung.
 *
 * RAM (nachgerechnet aus RamCostGenerator.ts, SF4 Stufe 3+):
 *     getPortHandle/tryWrite/atExit kosten 0 - die Abschaltung ist gratis.
 *     Base                  1.6
 *     goToLocation          5.0   (SingularityFn3)
 *     travelToCity          2.0   (SingularityFn1)
 *     getFactionRep         1.0   (SingularityFn2 / 3)
 *     getCurrentWork        0.5
 *     getMoneySources       1.0
 *     getResetInfo          1.0
 *     run                   1.0
 *     getPlayer             0.5   (SingularityFn1 / 4)
 *     isRunning             0.1
 *                          ----
 *                          13.7 GB
 * SF4Cost() multipliziert die Singularity-Posten mit 16 (Stufe 1) bzw. 4
 * (Stufe 2): dann 141.2 bzw. 39.2 GB. Der Registry-Eintrag in SCHWARM-HELPERS
 * (minRam 16 / burst 16) deckt Stufe 3 ab; darunter muss der Dispatcher mehr
 * reservieren.
 *
 * Die teuren Abfragen (getInfiltration 15 GB, Augmentations-APIs 12.5 GB)
 * laufen weiter in kurzlebigen Wegwerf-Skripten (Casino-Pattern) und belasten
 * den statischen Bedarf nicht.
 *
 * Aufruf manuell:    run SCHWARM-INFIL.js
 * Aufruf als Daemon: args ["--mode","auto","--quiet"]
 * Diagnose:          run SCHWARM-INFIL.js --selftest
 *                    run SCHWARM-INFIL.js --probe
 * =============================================================================
 */

const VERSION = "2.5";

// 0-GB-DOM-Zugriff (indirekt, damit der statische RAM-Scanner nichts findet)
const doc = globalThis["document"];

const CACHE_FILE = "/infil-targets.txt";
const GOALS_FILE = "/infil-goals.txt";
const CACHE_STAMP = "/infil-targets-stamp.txt";
const BUILDER_FILE = "/infil-cache-build.js";
const GOALS_BUILDER = "/infil-goals-build.js";
const PROBE_FILE = "/infil-probe.txt";
const RUN_LOG_FILE = "/infil-log.txt";
const RUN_LOG_KEEP = 200;

// --- Engine-Konstanten -------------------------------------------------------
const ENGINE_MAX_DIFFICULTY = 3.5;   // game.ts MaxDifficultyForInfiltration
const SAFE_START_DIFFICULTY = 3.4;   // Sicherheitsabstand: Stats aendern sich
const DECAY_RATE = -2e-5;
const MARKET_DEMAND_FACTOR = 1e-3;
const OPTIMAL_MARKET_MULT = 2 / 3;

// --- Tuning ------------------------------------------------------------------
const POLL_MS = 150;            // Takt ausserhalb eines Laufs
const PLAY_TICK_MS = 30;        // Takt WAEHREND eines Laufs.
                                // SlashModel Brutal hat ein 250-ms-Fenster
                                // (model/SlashModel.ts difficultySettings),
                                // Faktor 8 Reserve.
const NAV_TIMEOUT_MS = 8000;
const SCREEN_TIMEOUT_MS = 6000;
const SEC_PER_LEVEL_INIT = 2.5;
const CYCLE_OVERHEAD_SEC = 5;
const TRAVEL_PENALTY_SEC = 4;
const MAX_FAILS = 6;
const DEMAND_WAIT_MAX_MS = 45000;
const GOALS_REFRESH_MS = 180000;
const GRAFT_WAIT_POLL_MS = 5000;
const GRAFT_WAIT_LOG_MS = 60000;
const NO_TARGET_WAIT_MS = 60000;
const NO_TARGET_GIVEUP_MS = 1800000;
const FATAL_WAIT_MS = 30000;
const COOLDOWN_MS = 300000;
const BLOCK_AFTER = 2;
const GRAFT_POLL_MS = 5000;
// v2.5: Pause waehrend eines Graftings AUS - Begruendung im Kopf. true = altes Verhalten.
const GRAFT_PAUSE = false;
const BRIDGE_RETRY_MS = 60000;  // Bruecke kaputt -> so lange warten, dann neu

/**
 * EINGANG DER QUEEN (== SCHWARM_PORTS.QUEEN_IN in SCHWARM-HELPERS.js).
 *
 * WARUM HIER EINE ZAHL UND KEIN IMPORT: INFIL ist bewusst STANDALONE
 * (deps: [] in der Registry) — es ist DOM-lastig und kontrolliert seinen
 * RAM-Fussabdruck selbst, ohne an HELPERS zu haengen.
 *
 * DIESE ZAHL IST DIE EINZIGE IHRER ART IM GANZEN SCHWARM. Die Payload-Daemons
 * (TRADER, GANGS, GO, …) hatten frueher dasselbe Problem und haben genau
 * dadurch die Port-34-Kollision ausgeloest; sie bekommen ihre Portnummern seit
 * v4.0 von materialize() aus der zentralen Tabelle eingesetzt. INFIL ist kein
 * Payload und kann das nicht — hier bleibt es beim Spiegeln.
 * WER SCHWARM_PORTS.QUEEN_IN AENDERT, MUSS DIESE ZEILE MITZIEHEN.
 */
const COMMAND_PORT = 2;
/** Wartezeit auf den Queen-Takt, nachdem STOP:INFIL gesendet wurde. */
const STOP_GRACE_MS = 20000;

// =============================================================================
// LAUFZEIT-ZUSTAND
// =============================================================================

let QUIET = false;

/** Lokale Schaetzung des Market-Demand-Zustands (game.ts InfiltrationState). */
let mdFloors = 0;
let mdStamp = Date.now();

/** Gleitender Mittelwert: gemessene Sekunden pro Clearance-Level. */
let secPerLevel = SEC_PER_LEVEL_INIT;

/**
 * Gleitender Korrekturfaktor fuer die ANGEZEIGTE Ertragserwartung.
 *
 * baseRep()/baseCash() lassen bewusst drei konstante Faktoren weg, weil sie
 * sich im Ranking wegkuerzen:
 *   - WKSharmonizer          1.5 (Geld) bzw. 1.2 (Rep)   victory.ts
 *   - currentNodeMults.InfiltrationMoney / InfiltrationRep
 *   - (Rep) faction.favor spielt nur bei SoA eine Rolle
 * Fuer die Sortierung ist das richtig, fuer die Log-Zeile war es irrefuehrend:
 * gemeldet wurden "erwartet 6.47b" bei tatsaechlich 8.36b - genau der
 * Harmonizer-Faktor. Statt die Multiplikatoren ueber teure Singularity-Aufrufe
 * zu ermitteln, wird der Quotient aus gemessenem und erwartetem Ertrag
 * mitgefuehrt. Das deckt alle drei Faktoren gemeinsam ab und zieht nach einem
 * BitNode-Wechsel oder einem neu gekauften Harmonizer von selbst nach.
 *
 * Wirkt AUSSCHLIESSLICH auf die Anzeige, nie auf die Zielsortierung.
 */
const yieldCalib = { rep: 1, money: 1 };
const CALIB_ALPHA = 0.3;

function calibrate(mode, measured, expected) {
  if (!(expected > 0) || !(measured > 0)) return;
  const q = measured / expected;
  // Ausreisser abweisen: ein einzelner Messfehler soll die Anzeige nicht kippen.
  if (!(q > 0.05) || !(q < 20)) return;
  const k = mode === "money" ? "money" : "rep";
  yieldCalib[k] = yieldCalib[k] * (1 - CALIB_ALPHA) + q * CALIB_ALPHA;
}

// =============================================================================
// LOGGING
// =============================================================================
//
// ANSI-Farben sind in ns.print/ns.tprint unterstuetzt
// (NetscriptDefinitions_d.ts: "For custom coloring, use ANSI escape sequences").
// Farbschema:
//   BLAU   Reputation kassiert
//   GELB   Geld kassiert
//   ROT    keine Belohnung, Abbruch, Krankenhaus, Stoerung
//   GRAU   normaler Betrieb
// Gruen wird bewusst NICHT mehr verwendet.

const C = {
  rep: "\u001b[38;5;39m",    // blau
  money: "\u001b[38;5;220m", // gelb
  bad: "\u001b[38;5;196m",   // rot
  dim: "\u001b[38;5;245m",   // grau
  warn: "\u001b[38;5;214m",  // orange
  off: "\u001b[0m",
};

function log(ns, msg) {
  ns.print(`${C.dim}[INFIL] ${msg}${C.off}`);
}

function say(ns, msg, color) {
  const c = color || C.dim;
  ns.print(`${c}[INFIL] ${msg}${C.off}`);
  if (!QUIET) ns.tprint(`${c}[INFIL] ${msg}${C.off}`);
}

/**
 * Eine Zeile je Ereignis in eine Datei, damit der Verlauf im laufenden Betrieb
 * per `cat /infil-log.txt` lesbar ist - ns.print landet nur im Tail-Fenster.
 *
 * BEWUSST OHNE ANSI: der Terminal-`cat` gibt den Inhalt roh aus, Escape-Codes
 * wuerden dort als Muell stehen. Stattdessen ein Klartext-Praefix
 * (REP / MONEY / NONE / ABBRUCH / ...), nach dem sich auch greppen laesst.
 */
function runLog(ns, line) {
  try {
    const stamp = new Date().toISOString().slice(11, 19);
    let prev = "";
    try {
      prev = ns.read(RUN_LOG_FILE) || "";
    } catch (e) {
      prev = "";
    }
    const rows = (prev ? prev.split("\n") : []).filter((x) => x.length > 0);
    rows.push(`${stamp} ${line}`);
    while (rows.length > RUN_LOG_KEEP) rows.shift();
    ns.write(RUN_LOG_FILE, rows.join("\n") + "\n", "w");
  } catch (e) {
    /* Log ist optional */
  }
}

/**
 * Verlorene Minispiele als "SlashModel x2, WireCuttingModel" statt nur einer
 * Zahl. Nur damit laesst sich beurteilen, ob ein Loeser ein Problem hat oder ob
 * es Einzelfaelle waren - SlashModel ist das einzige Modell mit Zeitfenster
 * (250 ms auf Brutal) und damit der einzige, bei dem der Takt eine Rolle
 * spielen kann.
 */
function describeLost(res) {
  const by = (res && res.lostBy) || {};
  const keys = Object.keys(by).sort((a, b) => by[b] - by[a]);
  if (!keys.length) return `${(res && res.lost) || 0}x (Modell unbekannt)`;
  return keys.map((k) => (by[k] > 1 ? `${k} x${by[k]}` : k)).join(", ");
}

/** Zaehlwerke zweier Laeufe zusammenfassen. */
function mergeLost(total, by) {
  for (const k of Object.keys(by || {})) total[k] = (total[k] || 0) + by[k];
  return total;
}

function fmt(n) {
  if (n == null || !isFinite(n)) return "?";
  const a = Math.abs(n);
  if (a >= 1e12) return (n / 1e12).toFixed(2) + "t";
  if (a >= 1e9) return (n / 1e9).toFixed(2) + "b";
  if (a >= 1e6) return (n / 1e6).toFixed(2) + "m";
  if (a >= 1e3) return (n / 1e3).toFixed(2) + "k";
  return String(Math.round(n));
}

// =============================================================================
// ENGINE-FORMELN  (unveraendert aus v1.14, gegen game.ts/victory.ts verifiziert)
// =============================================================================

/** game.ts calculateRawDiff */
function rawDiff(stats, startingSecurityLevel, intelligence) {
  const v = startingSecurityLevel - Math.pow(stats, 0.9) / 250 - intelligence / 1600;
  return v > 0 ? v : 0;
}

/** game.ts calculateDifficulty */
function calcDifficulty(sec, player) {
  const s = player.skills;
  const stats = s.strength + s.defense + s.dexterity + s.agility + s.charisma;
  return rawDiff(stats, sec, s.intelligence || 0);
}

/** game.ts calculateReward - benutzt bewusst den Fixwert 465 fuer die Stats. */
function calcReward(sec, player) {
  const v = rawDiff(465, sec, player.skills.intelligence || 0);
  return v > 3 ? 3 : v;
}

/** victory.ts calculateTradeInformationRepReward - balanceMultiplier */
function balanceMultiplier(sec) {
  if (sec < 4) return 0.45;
  if (sec < 5) return 0.4;
  if (sec < 7) return 0.35;
  if (sec < 12) return 0.3;
  if (sec < 14) return 0.26;
  if (sec < 15) return 0.25;
  return 0.2;
}

/**
 * Rep-Ertrag OHNE Market-Demand. Der Multiplikator ist global und wirkt auf
 * alle Ziele gleich - im Ranking kuerzt er sich weg. Ihn dort mitzufuehren hat
 * bei Demand 0 alle Ziele auf 0 gesetzt und die Sortierung entwertet.
 * BitNode-Mult und WKSharmonizer sind ebenfalls konstant und entfallen.
 */
function baseRep(target, player) {
  const reward = calcReward(target.sec, player);
  const levelBonus = target.lvl * Math.pow(1.005, target.lvl);
  return Math.pow(reward + 1, 1.1) * Math.pow(target.sec, 1.1) * balanceMultiplier(target.sec) * 30 * levelBonus;
}

/** victory.ts calculateSellInformationCashReward, ohne Market-Demand. */
function baseCash(target, player) {
  const reward = calcReward(target.sec, player);
  const levelBonus = target.lvl * Math.pow(1.01, target.lvl);
  return Math.pow(reward + 1, 2) * Math.pow(target.sec, 3) * 3e3 * levelBonus;
}

/**
 * utils.ts calculateDamageAfterFailingInfiltration.
 * Neu in v2.0: wird tatsaechlich benutzt - vor dem Start wird geprueft, ob die
 * HP fuer mindestens einen Fehlschlag reichen.
 */
function failDamage(startingDifficulty, harmonizer) {
  return startingDifficulty * 3 * (harmonizer ? 0.5 : 1);
}

// --- Market-Demand -----------------------------------------------------------

function currentFloors(now) {
  // Ohne Guard ergibt 0 * exp(sehr gross) = NaN und der Multiplikator ist
  // fuer den Rest der Sitzung unbrauchbar.
  if (!(mdFloors > 0)) return 0;
  const dt = now - mdStamp;
  if (!(dt > 0)) return mdFloors;
  return mdFloors * Math.exp(DECAY_RATE * dt);
}

function marketMult(now) {
  const f = currentFloors(now);
  const m = 1 - MARKET_DEMAND_FACTOR * f * f;
  return m < 0 ? 0 : m > 1 ? 1 : m;
}

/**
 * Erhoehung der Marktsaettigung nach einem Lauf.
 *
 * v2.1 BUGFIX: `at` MUSS der Zeitstempel des LAUFBEGINNS sein, nicht der des
 * Laufendes. Victory.tsx ruft
 *     decreaseMarketDemandMultiplier(state.gameStartTimestamp, state.maxLevel)
 * und game.ts setzt darin  lastChangeTimestamp = timestamp  - die Engine
 * datiert die Erhoehung also auf den Laufbeginn zurueck, rund 50 s in die
 * Vergangenheit.
 *
 * Bis v2.0 stand hier Date.now(). Dadurch alterte unsere Schaetzung pro Lauf
 * um genau diese 50 s zu wenig; ueber zwanzig Laeufe summierte sich das so weit
 * auf, dass das Log "Demand jetzt 0 %" meldete, waehrend die tatsaechlichen
 * Ertraege unveraendert bei 8-9b lagen. Bei einem echten Multiplikator von 0
 * waere der Ertrag ebenfalls 0 gewesen - der Multiplikator wirkt rein
 * multiplikativ (victory.ts).
 */
function addFloors(n, at) {
  mdFloors = currentFloors(at) + n;
  mdStamp = at;
}

/**
 * Der Ertrag wird erst bei Victory berechnet, also 20-50 s nach der Zielwahl.
 * Die Halbwertszeit der Erholung liegt bei 34.7 s - in dieser Zeit erholt sich
 * der Multiplikator erheblich. Fuer jede Erwartung zaehlt daher der Wert am
 * Ende des Laufs, nicht der bei der Auswahl.
 */
function projectedMult(now, etaMs) {
  return marketMult(now + (etaMs > 0 ? etaMs : 0));
}

/** Wartezeit in ms, bis der Multiplikator das Optimum 2/3 erreicht. */
function msUntilOptimalMult(now) {
  const f = currentFloors(now);
  const fTarget = Math.sqrt((1 - OPTIMAL_MARKET_MULT) / MARKET_DEMAND_FACTOR);
  if (f <= fTarget) return 0;
  return Math.log(f / fTarget) / -DECAY_RATE;
}

// =============================================================================
// WEGWERF-SKRIPTE (Casino-Pattern)
// =============================================================================
//
// getInfiltration kostet 15 GB, die Augmentations-APIs zusammen 12.5 GB. Der
// statische RAM-Scanner zaehlt jeden erreichbaren Aufruf, auch wenn er nur
// einmal pro Sitzung noetig ist. Deshalb laufen beide in kurzlebigen
// Einmal-Prozessen, deren RAM nur waehrend der Ausfuehrung belegt ist.

async function runThrowaway(ns, file, src, ramHint) {
  if (ns.read(file) !== src) ns.write(file, src, "w");
  const pid = ns.run(file, { temporary: true });
  if (!pid) {
    say(ns, `FEHLER: ${file} nicht startbar (~${ramHint} GB frei noetig).`, C.bad);
    return false;
  }
  let guard = 0;
  while (ns.isRunning(pid) && guard++ < 600) await ns.sleep(50);
  return true;
}

const TARGET_SRC =
  "/** @param {NS} ns */\n" +
  "export async function main(ns) {\n" +
  "  const out = [];\n" +
  "  for (const loc of ns.infiltration.getPossibleLocations()) {\n" +
  "    try {\n" +
  "      const i = ns.infiltration.getInfiltration(loc.name);\n" +
  "      out.push({ name: loc.name, city: loc.city,\n" +
  "                 sec: i.startingSecurityLevel, lvl: i.maxClearanceLevel });\n" +
  "    } catch (e) { /* Location ohne Infiltrationsdaten */ }\n" +
  "  }\n" +
  "  ns.write(" + JSON.stringify(CACHE_FILE) + ", JSON.stringify(out), \"w\");\n" +
  "  ns.write(" + JSON.stringify(CACHE_STAMP) + ", JSON.stringify({ ts: Date.now() }), \"w\");\n" +
  "}\n";

/**
 * Offene Rep-Ziele je Fraktion.
 * NeuroFlux Governor wird ausgeklammert: die Stufe ist beliebig wiederholbar
 * und die Rep-Anforderung waechst mit jedem Kauf - keine Fraktion waere je
 * "fertig" und die Umschaltung auf Geld traete nie ein.
 */
const GOALS_SRC =
  "/** @param {NS} ns */\n" +
  "export async function main(ns) {\n" +
  "  const S = ns.singularity;\n" +
  "  const owned = new Set(S.getOwnedAugmentations(true));\n" +
  "  const out = [];\n" +
  "  for (const f of ns.getPlayer().factions) {\n" +
  "    let need = 0;\n" +
  "    try {\n" +
  "      for (const a of S.getAugmentationsFromFaction(f)) {\n" +
  "        if (owned.has(a)) continue;\n" +
  "        if (a === \"NeuroFlux Governor\") continue;\n" +
  "        const r = S.getAugmentationRepReq(a);\n" +
  "        if (isFinite(r) && r > need) need = r;\n" +
  "      }\n" +
  "    } catch (e) { continue; }\n" +
  "    if (need <= 0) continue;\n" +
  "    let rep = 0;\n" +
  "    try { rep = S.getFactionRep(f); } catch (e) { continue; }\n" +
  "    if (!isFinite(rep) || rep >= need) continue;\n" +
  "    out.push({ faction: f, need: need, rep: rep, gap: need - rep });\n" +
  "  }\n" +
  "  out.sort((a, b) => a.gap - b.gap);\n" +
  "  ns.write(" + JSON.stringify(GOALS_FILE) + ", JSON.stringify({ ts: Date.now(), goals: out }), \"w\");\n" +
  "}\n";

function readJson(ns, file) {
  try {
    const raw = ns.read(file);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function readTargets(ns) {
  const arr = readJson(ns, CACHE_FILE);
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const ok = arr.filter((t) => t && t.name && t.city && isFinite(t.sec) && isFinite(t.lvl));
  return ok.length ? ok : null;
}

/**
 * Zeitstempel des letzten Augmentierungs-Resets (Softreset). 1 GB.
 * Beide Caches ueberleben den Reset auf der Platte, sind danach aber falsch:
 * die Fraktionsreputationen stehen auf 0, die besessenen Augmentierungen sind
 * andere, und die Schwierigkeitsbewertung haengt an den zurueckgesetzten Stats.
 */
function lastAugReset(ns) {
  try {
    const r = ns.getResetInfo();
    const v = r ? Number(r.lastAugReset) : NaN;
    return isFinite(v) ? v : 0;
  } catch (e) {
    return 0;
  }
}

function fileStamp(ns, file) {
  try {
    const o = readJson(ns, file);
    if (o && !Array.isArray(o) && isFinite(o.ts)) return Number(o.ts);
    return 0;
  } catch (e) {
    return 0;
  }
}

function readGoals(ns) {
  const o = readJson(ns, GOALS_FILE);
  if (!o || !Array.isArray(o.goals)) return null;
  return o;
}

// =============================================================================
// ZIELAUSWAHL
// =============================================================================

/**
 * Bewertet alle Ziele. Kriterium ist Ertrag pro Sekunde: der balanceMultiplier
 * faellt bei hohem Security-Level von 0.45 auf 0.20, das teuerste Ziel ist also
 * nicht automatisch das beste.
 */
function rankTargets(targets, player, opts) {
  const out = [];
  for (const t of targets) {
    const diff = calcDifficulty(t.sec, player);
    const endDiff = diff + t.lvl / 50; // Infiltration.ts difficulty() = start + level/50

    // HARTE Grenze der Engine - und sie gilt NUR fuer die Startschwierigkeit:
    // Infiltration.ts startInfiltration()
    //   if (this.startingDifficulty >= MaxDifficultyForInfiltration)
    //       -> Player.takeDamage(Player.hp.current); this.cancel();
    // Die Endschwierigkeit darf darueber liegen, sie macht die Minispiele nur
    // haerter. Beides gegen 3.5 zu pruefen sperrte NWO (Start 3.15 / Ende 4.15)
    // selbst bei --maxdiff 99 aus, obwohl die Engine es zulaesst.
    if (diff >= SAFE_START_DIFFICULTY) continue;

    // WEICHE Grenze: wie hart duerfen die Minispiele am Ende werden.
    // Seit v2.0 spielt INFIL nicht mehr auf Zeit gegen das DOM, sondern loest
    // jedes Minispiel in einem Zug - die Endschwierigkeit ist damit weit
    // weniger kritisch als vorher. Der Standard bleibt trotzdem konservativ.
    if (endDiff >= opts.maxdiff) continue;
    if (opts.rotateBlock && t.name === opts.rotateBlock) continue;
    if (opts.banned && opts.banned[t.name] >= BLOCK_AFTER) continue;

    const foreign = t.city !== player.city;
    if (foreign && opts.noTravel) continue;

    const value = opts.money ? baseCash(t, player) : baseRep(t, player);
    const sec = t.lvl * secPerLevel + CYCLE_OVERHEAD_SEC + (foreign ? TRAVEL_PENALTY_SEC : 0);
    out.push({ t, diff, endDiff, base: value, sec, perSec: value / sec, foreign });
  }
  out.sort((a, b) => b.perSec - a.perSec);
  return out;
}

/** Bestes Ziel, bevorzugt in der aktuellen Stadt, solange es >= 80 % erreicht. */
function pickTarget(ranked) {
  if (ranked.length === 0) return null;
  const best = ranked[0];
  if (!best.foreign) return best;
  const local = ranked.find((r) => !r.foreign);
  if (local && local.perSec >= best.perSec * 0.8) return local;
  return best;
}

// =============================================================================
// DOM-BASIS
// =============================================================================
//
// Nur noch fuer das, was ausserhalb des Infiltrationsschirms passiert:
// "Infiltrate Company" anklicken, Belohnungsknoepfe druecken, Dialoge
// wegraeumen. Waehrend eines Laufs wird das DOM nicht mehr angefasst.

function root() {
  try {
    return doc.getElementById("root") || doc.body;
  } catch (e) {
    return null;
  }
}

const TAIL_MARKERS = ["react-draggable", "MuiDialog", "MuiSnackbar", "notistack"];

function isTailNode(el) {
  const cls = el && typeof el.className === "string" ? el.className : "";
  if (!cls) return false;
  for (const m of TAIL_MARKERS) if (cls.indexOf(m) !== -1) return true;
  return false;
}

/**
 * Query im Spielbereich, Tail-Fenster ausgeschlossen. Die Tail-Fenster der
 * Schwarm-Daemonen haengen im selben Dokument - ohne diesen Filter hat die
 * Buttonsuche fruehe Treffer in HACKING/BANK/WORK gelandet.
 */
function qGame(sel) {
  const r = root();
  if (!r) return [];
  let list = [];
  try {
    list = Array.prototype.slice.call(r.querySelectorAll(sel));
  } catch (e) {
    return [];
  }
  return list.filter((el) => {
    let p = el;
    let depth = 0;
    while (p && depth++ < 40) {
      if (isTailNode(p)) return false;
      p = p.parentElement;
    }
    return true;
  });
}

/** Query im gesamten Dokument (fuer Dialoge, Snackbars und Menue-Portale). */
function qAll(sel) {
  try {
    return Array.prototype.slice.call(doc.querySelectorAll(sel));
  } catch (e) {
    return [];
  }
}

function txt(el) {
  return ((el && el.textContent) || "").trim();
}

function fakeEvent() {
  return {
    isTrusted: true,
    button: 0,
    type: "click",
    preventDefault() {},
    stopPropagation() {},
    persist() {},
    nativeEvent: { isTrusted: true },
  };
}

/**
 * Klick ueber die React-onClick-Prop.
 *
 * Ein blosses el.click() scheitert an Infiltration/utils.ts trusted(), das
 * !event.isTrusted verwirft. MAUS-Events haben KEINE Anti-Automatik-Strafe -
 * die gilt laut InfiltrationRoot.tsx ausschliesslich fuer keydown. Deshalb ist
 * dieser Weg unbedenklich, waehrend ein gefaelschtes keydown toedlich waere.
 */
function rClick(el) {
  if (!el) return false;
  const p = propsOf(el);
  if (p && typeof p.onClick === "function") {
    try {
      p.onClick(fakeEvent());
      return true;
    } catch (e) {
      /* fall through */
    }
  }
  try {
    el.click();
    return true;
  } catch (e) {
    return false;
  }
}

function findGameButton(test) {
  for (const b of qGame("button")) {
    const t = txt(b).toLowerCase();
    if (t && test(t)) return b;
  }
  return null;
}

function findTradeButton() {
  return findGameButton(
    (t) =>
      t.indexOf("trade") !== -1 &&
      t.indexOf("reputation") !== -1 &&
      t.indexOf("infiltrator") === -1 &&
      t.indexOf("shadows") === -1,
  );
}

function findSellButton() {
  return findGameButton((t) => t.indexOf("sell") !== -1 && (t.indexOf("$") !== -1 || t.indexOf("cash") !== -1));
}

/**
 * Dialoge wegraeumen.
 *
 * v2.0 - DER ESCAPE-AUSWEG IST ERSATZLOS ENTFALLEN. v1.9 bis v1.15 schickten
 * hier ein untrusted keydown mit key "Escape" direkt an document. Das war eine
 * der Hauptursachen fuer Abbrueche mitten im Lauf:
 *   - mit aktivem Wrapper landete "ESCAPE" im Rateversuch von BackwardModel
 *     bzw. BracketModel (dort werden nur Backspace/Shift/Ctrl/Alt gefiltert)
 *     -> onFailure
 *   - ohne Wrapper -> InfiltrationRoot press() -> onFailure({automated:true})
 *     -> volle HP -> Krankenhaus
 * und das alle 150 ms, solange irgendein Dialog stand.
 *
 * Bleibt ein Dialog stehen (die Fraktionseinladung hat weder "Close" noch "OK",
 * sondern "Join"/"Decline"), wird er jetzt einfach stehengelassen. Das ist seit
 * v2.0 unkritisch, weil unsere Tastenanschlaege nicht mehr durch das DOM
 * laufen - ein Modal ueber der Infiltration stoert den Lauf nicht mehr.
 *
 * TIPP: In den Spieloptionen "Suppress faction invitation popups" einschalten.
 * Settings.SuppressFactionInvites schaltet den emit-Aufruf komplett ab und
 * nimmt damit die Ursache statt der Wirkung.
 */
function dismissDialogs() {
  let n = 0;
  for (const d of qAll(".MuiDialog-root")) {
    let hit = null;
    for (const b of Array.prototype.slice.call(d.querySelectorAll("button"))) {
      if (/close|ok\b|okay|dismiss/i.test(txt(b))) {
        hit = b;
        break;
      }
    }
    if (hit) {
      rClick(hit);
      n++;
      continue;
    }
    const bd = d.querySelector(".MuiBackdrop-root");
    if (bd) {
      try {
        bd.click();
        n++;
      } catch (e) {
        /* ignore */
      }
    }
    // Kein Escape-Fallback. Siehe Funktionskommentar.
  }
  return n;
}

/**
 * Infiltration.ts dialogBoxCreate("Infiltration was cancelled because you were
 * hospitalized") - das eindeutige Signal fuer ein Hospital-Ereignis.
 * Ebenfalls dort: "You were discovered immediately. That location is far too
 * secure ..." als Snackbar, wenn startingDifficulty >= 3.5.
 */
function engineAbortReason() {
  const sel = ".MuiDialog-root, .MuiAlert-root, .SnackbarItem-message, .notistack-MuiContent, .SnackbarContent-root";
  for (const el of qAll(sel)) {
    const t = txt(el).toLowerCase();
    if (t.indexOf("cancelled because you were hospitalized") !== -1) return "Krankenhaus";
    if (t.indexOf("far too secure") !== -1) return "Ziel zu sicher fuer die aktuellen Werte";
  }
  return null;
}

async function waitFor(ns, fn, timeoutMs, stepMs) {
  const step = stepMs || POLL_MS;
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    let v = null;
    try {
      v = fn();
    } catch (e) {
      v = null;
    }
    if (v) return v;
    await ns.sleep(step);
  }
  return null;
}

// =============================================================================
// CANCEL-WACHE
// =============================================================================
//
// Klickt der Spieler waehrend eines Laufs auf "Cancel Infiltration", soll INFIL
// nicht nur den Lauf abbrechen, sondern sich abschalten - sonst startet die
// Queen im naechsten Takt einfach neu und man kommt nur per killall heraus.
//
// WARUM EIN KLICK-BEOBACHTER UND NICHT WIE FRUEHER EINE HEURISTIK
// ---------------------------------------------------------------------------
// v1.7 bis v1.11 hatten das schon einmal, ueber playerTookFocus(): "es laeuft
// eine Arbeit und der Focus-Knopf fehlt". Das war nicht unterscheidungsfaehig -
// genau so sieht es aus, wenn SCHWARM-WORK fokussierte Fraktionsarbeit macht.
// Daraus wurde eine sich selbst tragende Ein/Aus-Schleife, die nur per killall
// zu brechen war; in v1.12 flog die Erkennung deshalb ersatzlos raus.
//
// Am Infiltration-Objekt allein ist der Fall bis heute nicht zu erkennen:
// InfiltrationRoot.tsx raeumt die Infiltration bei JEDEM Seitenwechsel ab
//     useEffect(() => cancel, [cancel]);
// Ein Router.toPage() aus einem anderen Skript sieht also identisch aus wie ein
// Klick des Spielers.
//
// Der Klick selbst ist dagegen eindeutig:
//   - Der Spieler klickt      -> echtes DOM-Ereignis, isTrusted === true
//   - INFIL klickt            -> ueber die React-Prop onClick(), es entsteht
//                                UEBERHAUPT KEIN DOM-Ereignis
//   - der Rueckfall el.click()-> DOM-Ereignis mit isTrusted === false
//   - anderes Skript wechselt die Seite -> gar kein Klick
// Damit ist die Unterscheidung exakt statt geraten.
//
// KEIN ANTI-AUTOMATIK-RISIKO: die Strafe in InfiltrationRoot.tsx haengt an
// dispatchten KEYDOWN-Ereignissen. Hier wird nur ZUGEHOERT, nichts gesendet,
// und der Ereignistyp ist "click".
//
// KEIN LISTENER-ZOMBIE: registriert wird ein benannter Handler, der ueber einen
// Generationsstempel auf globalThis erkennt, wenn er von einer aelteren Instanz
// stammt, und sich dann selbst abmeldet. Zusaetzlich meldet ns.atExit() ihn ab,
// wenn das Skript getoetet wird. Der doppelte Boden ist Absicht - genau hier
// hatte inflitrator.js seine Zombies (unwrapEventListeners loeschte nur die
// Buchhaltung und meldete keinen einzigen Handler ab).

const WATCH_KEY = "__SCHWARM_INFIL_CANCELWATCH";

const cancelWatch = {
  gen: 0,
  handler: null,
  hit: false,
  armed: false,
};

/** Traegt der Knopf unter dem Klick den Abbruchtext? */
function isCancelButton(el) {
  let node = el;
  let depth = 0;
  while (node && depth++ < 8) {
    if (node.tagName === "BUTTON") {
      const t = txt(node).toLowerCase();
      return t.indexOf("cancel") !== -1 && t.indexOf("infiltrat") !== -1;
    }
    node = node.parentElement;
  }
  return false;
}

function installCancelWatch(ns) {
  removeCancelWatch();
  const gen = (Number(globalThis[WATCH_KEY]) || 0) + 1;
  globalThis[WATCH_KEY] = gen;
  cancelWatch.gen = gen;
  cancelWatch.hit = false;

  const handler = function (ev) {
    // Handler einer aelteren Instanz: selbst abraeumen und nichts tun.
    if (globalThis[WATCH_KEY] !== gen) {
      try {
        doc.removeEventListener("click", handler, true);
      } catch (e) {
        /* ignore */
      }
      return;
    }
    if (!ev || ev.isTrusted !== true) return;      // nur echte Spielerklicks
    if (!cancelWatch.armed) return;                // nur waehrend eines Laufs
    try {
      if (isCancelButton(ev.target)) cancelWatch.hit = true;
    } catch (e) {
      /* ignore */
    }
  };

  cancelWatch.handler = handler;
  try {
    // Capture-Phase: der Klick wird auch dann gesehen, wenn React ihn stoppt.
    doc.addEventListener("click", handler, true);
    return true;
  } catch (e) {
    cancelWatch.handler = null;
    return false;
  }
}

function removeCancelWatch() {
  if (!cancelWatch.handler) return;
  for (const cap of [true, false]) {
    try {
      doc.removeEventListener("click", cancelWatch.handler, cap);
    } catch (e) {
      /* ignore */
    }
  }
  cancelWatch.handler = null;
  cancelWatch.armed = false;
}

/**
 * Schaltet INFIL ab.
 *
 * Der saubere Weg fuehrt ueber die Queen: sendCmd("STOP:INFIL") auf Port 1.
 * SCHWARM-QUEEN handleCommands() macht daraus
 *     setDaemonEnabled(ns, "INFIL", 0); delete S.wants.INFIL; stop(ns, "INFIL");
 * schaltet also den Dashboard-Schalter aus UND beendet den Prozess.
 *
 * INFIL schreibt die Queen-State-Datei bewusst NICHT selbst. Genau das tat
 * setOwnSwitch() bis v1.11 - ein Read-Modify-Write von aussen auf eine Datei,
 * die der Queen gehoert, mit einem Rennen um fremde Eintraege.
 *
 * Laeuft keine Queen (INFIL von Hand gestartet), passiert nach dem Senden
 * nichts. Deshalb beendet sich INFIL nach einer Schonfrist selbst - das ist die
 * EINZIGE Ausnahme von der Regel "INFIL beendet sich nie selbst", und sie
 * greift ausschliesslich auf eine ausdrueckliche Anweisung des Spielers hin.
 */
async function shutdownByPlayer(ns, reason) {
  say(ns, `${reason} - INFIL schaltet sich ab.`, C.warn);
  runLog(ns, `AUS ${reason}`);

  let sent = false;
  try {
    sent = ns.getPortHandle(COMMAND_PORT).tryWrite("STOP:INFIL");
  } catch (e) {
    sent = false;
  }

  if (sent) {
    log(ns, `STOP:INFIL an die Queen gesendet (Port ${COMMAND_PORT}) - der Dashboard-Schalter geht auf AUS.`);
    log(ns, `Wieder einschalten: Dashboard-Knopf, oder von Hand "run SCHWARM-INFIL.js".`);
    // Die Queen killt uns im naechsten Takt. Passiert das nicht (keine Queen
    // aktiv, Port voll, Befehl verschluckt), beenden wir uns selbst.
    const until = Date.now() + STOP_GRACE_MS;
    while (Date.now() < until) await ns.sleep(500);
    log(ns, "Queen hat nicht uebernommen - INFIL beendet sich selbst.");
  } else {
    say(ns, `Command-Port ${COMMAND_PORT} war voll - der Dashboard-Schalter bleibt auf AN. ` +
            `INFIL beendet sich trotzdem; die Queen startet es im naechsten Takt neu. ` +
            `Zum dauerhaften Abschalten den Dashboard-Knopf benutzen.`, C.bad);
    runLog(ns, `AUS Port ${COMMAND_PORT} voll - Schalter NICHT umgelegt`);
  }
  removeCancelWatch();
}

// =============================================================================
// REACT-FIBER-BRUECKE
// =============================================================================
//
// !!! DIES IST DIE STELLE, DIE EIN SPIELE-UPDATE BRECHEN KANN !!!
//
// React haengt an jeden von ihm erzeugten DOM-Knoten zwei Eigenschaften mit
// zufaelligem Suffix:
//     __reactFiber$<hash>   -> der Fiber-Knoten (Baumstruktur, .return = Eltern)
//     __reactProps$<hash>   -> die Props des zugehoerigen Elements
// Beides ist INTERNA ohne Stabilitaetsgarantie.
//
// Wir brauchen daraus genau ein Objekt: die laufende Infiltration
// (Player.infiltration). InfiltrationRoot.tsx reicht sie als Prop weiter:
//     <StageComponent state={state} stage={state.stage} />
//     <Intro state={state} />
// Also steht sie in memoizedProps.state irgendeiner Fiber oberhalb der
// gerenderten Paper-Elemente.
//
// Wenn nach einem Update nichts mehr gefunden wird:
//   1. In der Browser-Konsole einen Knoten des Infiltrationsschirms
//      inspizieren und die tatsaechlichen Praefixe ablesen.
//   2. FIBER_PREFIX / PROPS_PREFIX unten anpassen.
//   3. Falls React die Props-Struktur geaendert hat, looksLikeInfiltration()
//      gegen die neuen Feldnamen anpassen.
//   4. `run SCHWARM-INFIL.js --selftest` bestaetigt die Reparatur.

const FIBER_PREFIX = "__reactFiber$";
const PROPS_PREFIX = "__reactProps$";

function fiberOf(el) {
  if (!el) return null;
  for (const k in el) {
    if (k.indexOf(FIBER_PREFIX) === 0) return el[k];
  }
  return null;
}

function propsOf(el) {
  if (!el) return null;
  for (const k in el) {
    if (k.indexOf(PROPS_PREFIX) === 0) return el[k];
  }
  // Rueckfall: manche Builds haengen die Props unter anderem Namen an.
  try {
    for (const k of Object.keys(el)) {
      const v = el[k];
      if (v && typeof v === "object" && (typeof v.onClick === "function" || typeof v.onChange === "function")) {
        return v;
      }
    }
  } catch (e) {
    /* ignore */
  }
  return null;
}

/**
 * Merkmale des Infiltration-Objekts aus Infiltration.ts. Bewusst mehrere,
 * damit kein beliebiges anderes Prop-Objekt faelschlich als Treffer gilt.
 */
function looksLikeInfiltration(o) {
  return !!(
    o &&
    typeof o === "object" &&
    typeof o.onFailure === "function" &&
    typeof o.onSuccess === "function" &&
    typeof o.cancel === "function" &&
    o.stage &&
    typeof o.stage.onKey === "function" &&
    isFinite(o.maxLevel) &&
    isFinite(o.level) &&
    isFinite(o.startingSecurityLevel) &&
    isFinite(o.startingDifficulty)
  );
}

/**
 * Sucht das Infiltration-Objekt.
 *
 * Einstiegspunkte sind die Paper/Container-Knoten des Infiltrationsschirms;
 * von dort geht es ueber fiber.return nach oben, und in jeder Ebene werden
 * ALLE memoizedProps-Werte geprueft. Damit ist es egal, unter welchem
 * Prop-Namen die Infiltration durchgereicht wird.
 *
 * Rueckgabe: das Objekt oder null.
 */
function findInfiltration() {
  const seeds = qGame(".MuiContainer-root, .MuiPaper-root");
  for (const el of seeds) {
    let f = fiberOf(el);
    let depth = 0;
    while (f && depth++ < 40) {
      const p = f.memoizedProps;
      if (p && typeof p === "object") {
        // Der haeufige Fall zuerst, ohne ueber alle Keys zu laufen.
        if (looksLikeInfiltration(p.state)) return p.state;
        for (const k in p) {
          if (k === "state") continue;
          if (looksLikeInfiltration(p[k])) return p[k];
        }
      }
      f = f.return;
    }
  }
  return null;
}

/**
 * Bruecke mit Zwischenspeicher. Das Objekt bleibt fuer die Dauer einer
 * Infiltration dasselbe (Player.infiltration), die Suche laeuft also nur
 * einmal je Lauf. Bei jedem Zugriff wird geprueft, ob es noch gueltig ist.
 */
const bridge = {
  cached: null,
  /** Das aktuelle Infiltration-Objekt oder null, wenn keines laeuft. */
  get() {
    if (this.cached && looksLikeInfiltration(this.cached)) return this.cached;
    this.cached = findInfiltration();
    return this.cached;
  },
  drop() {
    this.cached = null;
  },
};

/**
 * Ein Tastendruck an das Modell. KEIN DOM, KEIN KeyboardEvent.
 *
 * InfiltrationStage.ts:
 *   export interface KeyboardLikeEvent {
 *     key: string; altKey: boolean; ctrlKey: boolean;
 *     metaKey: boolean; shiftKey: boolean; preventDefault?: () => void;
 *   }
 * preventDefault ist optional; alle Modelle rufen es als event.preventDefault?.()
 * auf. Wir geben trotzdem eine Noop mit, damit ein Modell, das die Optionalitaet
 * eines Tages verliert, nicht wirft.
 *
 * altKey/ctrlKey/shiftKey MUESSEN false sein: BackwardModel.ignorableKeyboardEvent
 * verwirft sonst den Anschlag stillschweigend.
 */
function sendKey(stage, key) {
  stage.onKey({
    key: key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {},
  });
}

function stageName(st) {
  try {
    return (st && st.stage && st.stage.constructor && st.stage.constructor.name) || "";
  } catch (e) {
    return "";
  }
}

// =============================================================================
// MINISPIEL-LOESER
// =============================================================================
//
// Jeder Loeser liest AUSSCHLIESSLICH Felder des Modellobjekts und liefert eine
// Liste von Tastenwerten (event.key). Kein DOM, keine Farben, keine Titel.
//
// Die Feldnamen stehen hier gebuendelt, damit ein Engine-Update an genau EINER
// Stelle nachzuziehen ist. `--selftest` prueft sie gegen das laufende Modell.
//
// ZWEI ENTWURFSREGELN:
//   1. Modelle OHNE Cursor (Backward, Bracket, CheatCode, WireCutting, Bribe)
//      liefern den kompletten Rest in einem Zug. Die Sendeschleife bricht ab,
//      sobald das Modell wechselt - ueberzaehlige Tasten koennen also nicht in
//      die Folgestufe laufen.
//   2. Modelle MIT Cursor (Cyberpunk2077, Minesweeper) liefern nur den Weg zum
//      NAECHSTEN Ziel plus Bestaetigung. Der naechste Takt plant aus dem echten
//      Modellzustand neu - das ist selbstkorrigierend, falls ein Anschlag
//      verlorengeht, statt auf einer mitgefuehrten Schaetzposition aufzubauen.
//   3. SlashModel liefert hoechstens EINE Taste. Ein zweites Leerzeichen
//      waehrend Phase 0 oder 2 waere ein sofortiger Fehlschlag.

const KEY_SPACE = " ";   // KeyboardEventKey.ts: SPACE = " "

/** utils.ts getArrow akzeptiert w/a/s/d ebenso wie die Pfeiltasten. */
const ARROW_TO_KEY = {
  "\u2191": "w", // hoch
  "\u2193": "s", // runter
  "\u2190": "a", // links
  "\u2192": "d", // rechts
};

const CLOSE_OF = { "(": ")", "[": "]", "{": "}", "<": ">" };

/** Kuerzester Weg auf einem Ring von `size` Feldern, als Tastenliste. */
function wrapPath(from, to, size, plusKey, minusKey) {
  const keys = [];
  if (!(size > 0)) return keys;
  const fwd = ((to - from) % size + size) % size;
  const bwd = ((from - to) % size + size) % size;
  if (fwd <= bwd) {
    for (let i = 0; i < fwd; i++) keys.push(plusKey);
  } else {
    for (let i = 0; i < bwd; i++) keys.push(minusKey);
  }
  return keys;
}

function wrapDist(from, to, size) {
  if (!(size > 0)) return 0;
  const fwd = ((to - from) % size + size) % size;
  const bwd = ((from - to) % size + size) % size;
  return fwd <= bwd ? fwd : bwd;
}

/**
 * Weg zu einer Gitterposition. Beide Modelle rechnen identisch:
 *   this.x = (this.x + dx + grid[0].length) % grid[0].length
 *   this.y = (this.y + dy + grid.length)    % grid.length
 * also x ueber die Spalten (grid[0].length), y ueber die Zeilen (grid.length).
 */
function gridPath(x, y, tx, ty, cols, rows) {
  return wrapPath(x, tx, cols, "d", "a").concat(wrapPath(y, ty, rows, "s", "w"));
}

const SOLVERS = {
  IntroModel: { fields: [], plan: () => [] },
  CountdownModel: { fields: [], plan: () => [] },
  VictoryModel: { fields: [], plan: () => [] },

  /**
   * BackwardModel: das UI spiegelt die Antwort nur per CSS (transform:
   * scaleX(-1)), der Modellwert steht in normaler Reihenfolge.
   * onKey: guess += event.key.toUpperCase(). `answer` ist bereits GROSS und
   * kann Leerzeichen enthalten - " ".toUpperCase() bleibt " ".
   */
  BackwardModel: {
    fields: ["answer", "guess"],
    plan(s) {
      const a = String(s.answer || "");
      const g = String(s.guess || "");
      // Ist der Rateversuch bereits falsch, ist das Spiel ohnehin verloren;
      // dann nichts mehr senden, statt den Fehlschlag selbst auszuloesen.
      if (!a.startsWith(g)) return [];
      return a.slice(g.length).split("");
    },
  },

  /**
   * BracketModel: `left` sind die offenen Klammern, `right` das bereits
   * Getippte. onKey prueft nach dem Anhaengen
   *     match(left[left.length - right.length], char)
   * also wird `left` von hinten nach vorn geschlossen.
   */
  BracketModel: {
    fields: ["left", "right"],
    plan(s) {
      const left = String(s.left || "");
      const right = String(s.right || "");
      const keys = [];
      for (let i = left.length - right.length - 1; i >= 0; i--) {
        const c = CLOSE_OF[left[i]];
        if (!c) return keys; // unbekanntes Zeichen: lieber abbrechen als raten
        keys.push(c);
      }
      return keys;
    },
  },

  /**
   * BribeModel: onKey bewegt bei w/d/UP/RIGHT vorwaerts, bei s/a/DOWN/LEFT
   * rueckwaerts, jeweils mit Umlauf. `correctIndex` ist die Position des
   * positiven Wortes - die Wortliste im Skript entfaellt damit vollstaendig.
   */
  BribeModel: {
    fields: ["choices", "index", "correctIndex"],
    plan(s) {
      const n = (s.choices && s.choices.length) || 0;
      if (!n) return [];
      const ci = Number(s.correctIndex);
      if (!isFinite(ci) || ci < 0) return [];
      return wrapPath(Number(s.index) || 0, ci, n, "w", "s").concat([KEY_SPACE]);
    },
  },

  /** CheatCodeModel: `code` ist ein Array von Pfeilsymbolen, `index` der Stand. */
  CheatCodeModel: {
    fields: ["code", "index"],
    plan(s) {
      const code = s.code || [];
      const keys = [];
      for (let i = Number(s.index) || 0; i < code.length; i++) {
        const k = ARROW_TO_KEY[code[i]];
        if (!k) return keys;
        keys.push(k);
      }
      return keys;
    },
  },

  /**
   * Cyberpunk2077Model: Cursor auf `answers[currentAnswerIndex]` fahren und
   * bestaetigen. Dasselbe Symbol kann mehrfach im Gitter stehen - es gewinnt
   * die naechstgelegene Fundstelle.
   */
  Cyberpunk2077Model: {
    fields: ["grid", "answers", "currentAnswerIndex", "x", "y"],
    plan(s) {
      const grid = s.grid || [];
      const rows = grid.length;
      const cols = rows ? grid[0].length : 0;
      if (!rows || !cols) return [];
      const want = (s.answers || [])[Number(s.currentAnswerIndex) || 0];
      if (want === undefined) return [];
      const x = Number(s.x) || 0;
      const y = Number(s.y) || 0;
      let best = null;
      let bestCost = Infinity;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          if (grid[gy][gx] !== want) continue;
          const cost = wrapDist(x, gx, cols) + wrapDist(y, gy, rows);
          if (cost < bestCost) {
            bestCost = cost;
            best = [gx, gy];
          }
        }
      }
      if (!best) return [];
      return gridPath(x, y, best[0], best[1], cols, rows).concat([KEY_SPACE]);
    },
  },

  /**
   * MinesweeperModel: in der Merkphase passiert nichts (onKey kehrt dort
   * sofort zurueck, die Phase endet per Zeitgeber). Danach werden die noch
   * nicht markierten Minen der Reihe nach angefahren.
   * onKey verlangt minefield[y][x] === true, sonst onFailure - es wird also
   * ausschliesslich auf echten Minen bestaetigt.
   */
  MinesweeperModel: {
    fields: ["minefield", "answer", "x", "y", "memoryPhase"],
    plan(s) {
      if (s.memoryPhase) return [];
      const mf = s.minefield || [];
      const ans = s.answer || [];
      const rows = mf.length;
      const cols = rows ? mf[0].length : 0;
      if (!rows || !cols) return [];
      const x = Number(s.x) || 0;
      const y = Number(s.y) || 0;
      let best = null;
      let bestCost = Infinity;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          if (!mf[gy][gx]) continue;
          if (ans[gy] && ans[gy][gx]) continue; // schon markiert
          const cost = wrapDist(x, gx, cols) + wrapDist(y, gy, rows);
          if (cost < bestCost) {
            bestCost = cost;
            best = [gx, gy];
          }
        }
      }
      if (!best) return [];
      return gridPath(x, y, best[0], best[1], cols, rows).concat([KEY_SPACE]);
    },
  },

  /**
   * SlashModel: phase 0 "Guarding", 1 "Distracted", 2 "Alerted". Nur in Phase 1
   * ist das Leerzeichen ein Treffer, in 0 und 2 ein sofortiger Fehlschlag.
   * Deshalb hoechstens EINE Taste - und nur bei phase === 1.
   */
  SlashModel: {
    fields: ["phase"],
    plan(s) {
      return Number(s.phase) === 1 ? [KEY_SPACE] : [];
    },
  },

  /**
   * WireCuttingModel: `wiresToCut` ist ein Set der zu schneidenden Indizes -
   * die Engine hat die Regeln bereits ausgewertet. Damit entfaellt die
   * komplette Farb- und Regelauswertung, die in inflitrator.js gegen eine
   * veraltete Palette lief (red/blue/white/#FFC107 statt Okabe-Ito) und jedes
   * Spiel mit einer Farbregel verlor.
   * onKey verlangt eine positive Ganzzahl <= wires.length; wiresmax ist 9.
   */
  WireCuttingModel: {
    fields: ["wiresToCut", "cutWires", "wires"],
    plan(s) {
      const set = s.wiresToCut;
      if (!set || typeof set.forEach !== "function") return [];
      const keys = [];
      set.forEach((i) => {
        const n = Number(i) + 1;
        if (n >= 1 && n <= 9) keys.push(String(n));
      });
      return keys;
    },
  },
};

/**
 * Tastenliste an das aktuelle Modell schicken.
 *
 * Nach jedem Anschlag wird geprueft, ob st.stage noch dasselbe Objekt ist.
 * onSuccess/onFailure ersetzen stage durch ein neues CountdownModel - der
 * Abbruch verhindert damit, dass ueberzaehlige Tasten in der Folgestufe landen
 * (genau der Fehler, den inflitrator.js beim "distracted"-Spiel hatte: dort
 * fehlte jeder Wachposten und es wurden bis zu zehn Leerzeichen gesendet).
 */
function applyPlan(st, keys) {
  if (!keys || !keys.length) return 0;
  const stage = st.stage;
  let sent = 0;
  for (const k of keys) {
    if (st.stage !== stage) break;
    try {
      sendKey(stage, k);
    } catch (e) {
      break;
    }
    sent++;
  }
  return sent;
}

// -----------------------------------------------------------------------------
// MODELLERKENNUNG
// -----------------------------------------------------------------------------
//
// Bitburner wird gebuendelt ausgeliefert. Ob dabei die Klassennamen erhalten
// bleiben, ist eine Einstellung des Bundlers und kann sich mit jedem Build
// aendern - "stage.constructor.name" ist also KEINE verlaessliche Grundlage.
// (Dass InfiltrationRoot.tsx den Namen in seiner Fehlermeldung ausgibt, spricht
// dafuer, dass er derzeit erhalten ist. Verlassen wollen wir uns nicht darauf.)
//
// Deshalb zweistufig: erst der Name, dann eine Signatur aus Feldern, die es nur
// in genau einem Modell gibt. Die Reihenfolge ist wichtig - MinesweeperModel
// traegt ein Feld `answer` als Array, BackwardModel eines als Zeichenkette.

const STAGE_SIGNATURES = [
  ["WireCuttingModel", (s) => !!s.wiresToCut && typeof s.wiresToCut.forEach === "function"],
  ["MinesweeperModel", (s) => Array.isArray(s.minefield) && "memoryPhase" in s],
  ["Cyberpunk2077Model", (s) => Array.isArray(s.grid) && Array.isArray(s.answers)],
  ["BribeModel", (s) => Array.isArray(s.choices) && isFinite(s.correctIndex)],
  ["CheatCodeModel", (s) => Array.isArray(s.code) && isFinite(s.index)],
  ["BracketModel", (s) => typeof s.left === "string" && typeof s.right === "string"],
  ["BackwardModel", (s) => typeof s.answer === "string" && typeof s.guess === "string"],
  ["SlashModel", (s) => isFinite(s.phase) && !("choices" in s)],
  ["CountdownModel", (s) => isFinite(s.count)],
];

/**
 * Kanonischer Modellname. IntroModel und VictoryModel haben ueberhaupt keine
 * Felder (beide sind nur `onKey(__) {}`) und lassen sich daher nur ueber den
 * Zustand der Infiltration auseinanderhalten:
 *   - vor startInfiltration() ist gameStartTimestamp noch -1  -> Intro
 *   - nach dem letzten Level ruft onSuccess() cleanup(), also
 *     clearSubscription === null bei level >= maxLevel        -> Victory
 */
function detectStage(st) {
  const stage = st && st.stage;
  if (!stage) return "";
  const n = (stage.constructor && stage.constructor.name) || "";
  if (n && SOLVERS[n]) return n;

  for (const sig of STAGE_SIGNATURES) {
    try {
      if (sig[1](stage)) return sig[0];
    } catch (e) {
      /* naechste Signatur */
    }
  }

  if (st.clearSubscription === null && st.level >= st.maxLevel) return "VictoryModel";
  if (!(st.gameStartTimestamp > 0)) return "IntroModel";
  return n;
}

/** Fehlende Modellfelder eines Modells, fuer --selftest und Laufdiagnose. */
function missingFields(name, stage) {
  const def = SOLVERS[name];
  if (!def) return null;
  const miss = [];
  for (const f of def.fields) {
    if (!(f in stage)) miss.push(f);
  }
  return miss;
}

// =============================================================================
// EIN INFILTRATIONSLAUF
// =============================================================================

/**
 * Ist die Infiltration beendet?
 *
 * Infiltration.ts cleanup() setzt clearSubscription = null. Gerufen wird es
 * genau zweimal: von cancel() (Abbruch, Krankenhaus, Seitenwechsel) und von
 * onSuccess(), wenn maxLevel erreicht ist und der Siegesschirm kommt.
 * Der Siegesfall wird VORHER abgefangen, hier bleibt also nur der Abbruch.
 *
 * Das ist deutlich verlaesslicher als die DOM-Pruefung aus v1.x
 * (".MuiContainer-root children.length >= 3"), die Countdown und Victory
 * faelschlich als "Schirm weg" gewertet hat: InfiltrationRoot.tsx rendert das
 * Timer-Paper in genau diesen beiden Zustaenden nicht.
 */
function runEnded(st) {
  return !st || st.clearSubscription === null;
}

/**
 * Startet den Lauf und spielt ihn zu Ende.
 * Rueckgabe: { ok, seconds, results, lost, reason, aborted, fatal, bridge }
 */
async function runOne(ns, cand, cfg) {
  const t = cand.t;
  const started = Date.now();

  bridge.drop();
  dismissDialogs();

  const player = ns.getPlayer();
  if (t.city !== player.city) {
    if (cfg.noTravel) return { ok: false, reason: "andere Stadt, Reisen aus" };
    if (!ns.singularity.travelToCity(t.city)) {
      return { ok: false, reason: `Reise nach ${t.city} fehlgeschlagen` };
    }
    await ns.sleep(200);
  }

  if (!ns.singularity.goToLocation(t.name)) {
    return { ok: false, reason: `goToLocation("${t.name}") fehlgeschlagen` };
  }

  const btn = await waitFor(ns, () => findGameButton((x) => x.indexOf("infiltrate") !== -1), NAV_TIMEOUT_MS);
  if (!btn) {
    // v2.1 DIAGNOSE. goToLocation() hat true geliefert - Singularity.ts macht
    // dort nur Router.toPage(Page.Location, {location}) und loest den Fokus
    // NICHT. Laeuft eine fokussierte Arbeit, schaltet die Oberflaeche auf die
    // Work-Seite zurueck und die Location wird nie gerendert; der Knopf fehlt
    // dann, obwohl navigiert wurde. Ob das die Ursache ist, muss das Log
    // zeigen - deshalb wird hier festgehalten, was tatsaechlich auf dem Schirm
    // stand, statt eine Gegenmassnahme zu raten.
    const heads = qGame("h1,h2,h3,h4,h5,h6").map(txt).filter(Boolean).slice(0, 6);
    const btns = qGame("button").map(txt).filter(Boolean).slice(0, 12);
    let work = "kein Zugriff";
    try {
      const w = ns.singularity.getCurrentWork();
      work = w ? `${w.type}${w.factionName ? " " + w.factionName : ""}${w.companyName ? " " + w.companyName : ""}` : "keine";
    } catch (e) {
      /* ignore */
    }
    say(ns, `Infiltrate-Knopf fehlt bei ${t.name}. Arbeit: ${work}`, C.bad);
    log(ns, `  Ueberschriften: ${JSON.stringify(heads)}`);
    log(ns, `  Knoepfe: ${JSON.stringify(btns)}`);
    runLog(ns, `ABBRUCH ${t.name} kein Infiltrate-Knopf | work=${work} | h=${JSON.stringify(heads)} | b=${JSON.stringify(btns)}`);
    return { ok: false, reason: `Infiltrate-Knopf nicht gefunden (laufende Arbeit: ${work})` };
  }
  rClick(btn);

  // Ab hier existiert Player.infiltration und InfiltrationRoot rendert den
  // Vorstart-Schirm (IntroModel). Auf die Bruecke warten.
  const st = await waitFor(ns, () => bridge.get(), SCREEN_TIMEOUT_MS, 60);
  if (!st) {
    return {
      ok: false,
      bridge: true,
      reason: "React-Bruecke findet das Infiltration-Objekt nicht (siehe Kopf der Datei)",
    };
  }

  // ---------------------------------------------------------------------------
  // SICHERHEITSPRUEFUNG VOR DEM START - NEU IN v2.0
  //
  // Infiltration.ts startInfiltration():
  //   if (this.startingDifficulty >= MaxDifficultyForInfiltration) {
  //     ... "You were discovered immediately" ...
  //     Player.takeDamage(Player.hp.current);   // volle HP, sofort Krankenhaus
  //     this.cancel();
  //   }
  // Bis v1.x wurde die Schwierigkeit nur GESCHAETZT (aus den Spielerstats).
  // Jetzt steht der von der Engine berechnete Wert direkt zur Verfuegung - wir
  // brechen ab, BEVOR der Schaden entsteht.
  // ---------------------------------------------------------------------------
  if (st.startingDifficulty >= ENGINE_MAX_DIFFICULTY) {
    try {
      st.cancel();
    } catch (e) {
      /* ignore */
    }
    bridge.drop();
    return {
      ok: false,
      tooHard: true,
      reason: `Startschwierigkeit ${st.startingDifficulty.toFixed(2)} >= ${ENGINE_MAX_DIFFICULTY} - Abbruch vor dem Start (kein HP-Verlust)`,
    };
  }

  // Hinweis bei knappen HP. Konservativ ohne WKSharmonizer gerechnet, der den
  // Schaden halbieren wuerde - lieber ueberschaetzen.
  try {
    const hp = ns.getPlayer().hp;
    const dmg = failDamage(st.startingDifficulty, false);
    if (hp && hp.current > 0 && hp.current < dmg * 2) {
      log(ns, `Warnung: ${Math.round(hp.current)}/${Math.round(hp.max)} HP, ein Fehlschlag kostet bis zu ${dmg.toFixed(0)}.`);
    }
  } catch (e) {
    /* ignore */
  }

  // Ab jetzt zaehlt ein echter Klick auf "Cancel Infiltration" als Anweisung
  // des Spielers. Vorher nicht: waehrend der Navigation kann der Knopf noch von
  // einem fremden Schirm stammen, und ausserhalb eines Laufs geht uns ein
  // manueller Abbruch nichts an.
  cancelWatch.hit = false;
  cancelWatch.armed = true;

  // Start. Der "Start"-Knopf im Intro-Schirm ruft genau das hier.
  try {
    st.startInfiltration();
  } catch (e) {
    bridge.drop();
    return { ok: false, reason: `startInfiltration() warf: ${e}` };
  }

  // startInfiltration() setzt gameStartTimestamp = Date.now(). Genau diesen
  // Wert reicht Victory.tsx spaeter an decreaseMarketDemandMultiplier weiter -
  // wir muessen unsere Marktschaetzung mit demselben Stempel fortschreiben.
  const engineStart = isFinite(st.gameStartTimestamp) && st.gameStartTimestamp > 0
    ? st.gameStartTimestamp
    : started;

  // ---------------------------------------------------------------------------
  // SPIELSCHLEIFE
  // ---------------------------------------------------------------------------
  try {
    return await playLoop(ns, st, cfg, started, engineStart);
  } finally {
    cancelWatch.armed = false;
  }
}

/** Die eigentliche Spielschleife, herausgezogen wegen des finally oben. */
async function playLoop(ns, st, cfg, started, engineStart) {
  const end = Date.now() + cfg.maxRunMs;
  let lastStage = null;
  let lastLevel = -1;
  let lastResults = "";
  // v2.1: welches Minispiel hat den Fehlschlag verursacht?
  // Bei onFailure() wird stage sofort durch ein CountdownModel ersetzt; der
  // Wechsel kann ausserdem zwischen zwei Takten passieren (Stufen-Timeout ueber
  // setStageTime). Deshalb wird der zuletzt gesehene SPIELBARE Modellname
  // mitgefuehrt, nicht der des aktuellen Takts.
  const lostBy = {};
  let lastGameName = "";
  let lastMove = Date.now();
  let unknownWarned = {};
  let fieldWarned = {};
  let verifyAt = Date.now() + 1000;

  while (Date.now() < end) {
    // 0) Hat der Spieler "Cancel Infiltration" gedrueckt? Das hat Vorrang vor
    //    allem anderen - der Lauf ist damit ohnehin beendet.
    if (cancelWatch.hit) {
      bridge.drop();
      return {
        ok: false, aborted: true, playerStop: true,
        reason: '"Cancel Infiltration" vom Spieler gedrueckt',
        results: st.results || "", lostBy, engineStart,
      };
    }

    const name = detectStage(st);

    // 1) Siegesschirm - VOR runEnded pruefen, weil onSuccess dort ebenfalls
    //    cleanup() ruft.
    if (name === "VictoryModel") {
      const lost = (st.results || "").split("\u2717").length - 1;
      return {
        ok: true, seconds: (Date.now() - started) / 1000,
        results: st.results || "", lost, lostBy, engineStart,
      };
    }

    // 2) Abbruch durch die Engine oder den Spieler
    if (runEnded(st)) {
      const why = engineAbortReason() || "Infiltration beendet (Abbruch, Fokuswechsel oder Seitenwechsel)";
      const lost = (st.results || "").split("\u2717").length - 1;
      bridge.drop();
      return { ok: false, aborted: true, reason: why, results: st.results || "", lost, lostBy, engineStart };
    }

    // 3) Gegenprobe: haengt unser Objekt noch am gerenderten Baum? Faengt den
    //    Fall ab, dass eine ANDERE Infiltration gestartet wurde.
    if (Date.now() >= verifyAt) {
      verifyAt = Date.now() + 1000;
      const live = findInfiltration();
      if (live && live !== st) {
        bridge.drop();
        return { ok: false, aborted: true, reason: "eine andere Infiltration hat uebernommen", results: st.results || "", lostBy, engineStart };
      }
    }

    // 4) Spielen
    const def = SOLVERS[name];
    if (!def) {
      if (!unknownWarned[name]) {
        unknownWarned[name] = 1;
        say(ns, `Unbekanntes Minispiel "${name}" - kein Loeser vorhanden. Engine-Update? --selftest ausfuehren.`, C.bad);
        runLog(ns, `UNBEKANNT Minispiel ${name}`);
      }
    } else {
      const miss = missingFields(name, st.stage);
      if (miss && miss.length) {
        if (!fieldWarned[name]) {
          fieldWarned[name] = 1;
          say(ns, `Modell "${name}" fehlen Felder: ${miss.join(", ")} - Loeser anpassen (siehe SOLVERS).`, C.bad);
          runLog(ns, `FELDER fehlen in ${name}: ${miss.join(",")}`);
        }
      } else {
        try {
          applyPlan(st, def.plan(st.stage));
        } catch (e) {
          if (!fieldWarned[name]) {
            fieldWarned[name] = 1;
            say(ns, `Loeser "${name}" warf: ${e}`, C.bad);
            runLog(ns, `LOESERFEHLER ${name} ${e}`);
          }
        }
      }
    }

    // 4b) Fehlschlag einem Minispiel zuordnen.
    if (name && name !== "CountdownModel" && name !== "IntroModel" && name !== "VictoryModel") {
      lastGameName = name;
    }
    if ((st.results || "").length > lastResults.length) {
      const added = st.results.slice(lastResults.length);
      if (added.indexOf("\u2717") !== -1) {
        const key = lastGameName || name || "?";
        lostBy[key] = (lostBy[key] || 0) + 1;
        log(ns, `Minispiel verloren: ${key} (Level ${st.level}/${st.maxLevel})`);
        runLog(ns, `VERLOREN ${key} level=${st.level}/${st.maxLevel}`);
      }
    }

    // 5) Fortschrittskontrolle auf Modellbasis statt auf DOM-Titeln.
    if (st.stage !== lastStage || st.level !== lastLevel || st.results !== lastResults) {
      lastStage = st.stage;
      lastLevel = st.level;
      lastResults = st.results;
      lastMove = Date.now();
    } else if (Date.now() - lastMove > 90000) {
      bridge.drop();
      return { ok: false, aborted: true, reason: "kein Fortschritt seit 90 s", results: st.results || "", lostBy, engineStart };
    }

    await ns.sleep(PLAY_TICK_MS);
  }

  bridge.drop();
  return { ok: false, aborted: true, reason: `Notanker nach ${Math.round(cfg.maxRunMs / 1000)} s`, results: st.results || "", lostBy, engineStart };
}

/**
 * Aufraeumen nach einem Abbruch.
 *
 * v2.0: cancel() direkt am Modell statt Knopfsuche im DOM. Kein
 * Infiltrator-Prozess mehr, den man stoppen muesste, und kein Wrapper-Zoo.
 */
async function cleanupAfterAbort(ns) {
  const st = bridge.get();
  if (st && !runEnded(st)) {
    try {
      st.cancel();
    } catch (e) {
      /* ignore */
    }
  }
  bridge.drop();
  await ns.sleep(150);
  dismissDialogs();
}

// =============================================================================
// BEUTE KASSIEREN
// =============================================================================
//
// Der Siegesschirm ist KEINE Dialogbox, sondern eine SEITE (Victory.tsx unter
// InfiltrationRoot). Solange er steht, laesst sich keine neue Infiltration
// starten. Oberste Regel bleibt daher: er darf nie offen bleiben.
//
// Geklickt wird ueber die React-Props. Maus-Ereignisse haben keine
// Anti-Automatik - Infiltration/utils.ts trusted() prueft lediglich isTrusted,
// und das erfuellt fakeEvent(). Der toedliche Pfad in InfiltrationRoot gilt
// ausschliesslich fuer keydown.

const OPTION_BLOCKLIST = ["none", "-", "shadows of anarchy"];

/**
 * Shadows of Anarchy steht dauerhaft bei 0 Rep. Victory.tsx filtert das
 * Dropdown ohnehin auf Fraktionen mit offersWork(), SoA taucht dort also nicht
 * auf - die Sperre bleibt als Guertel zum Hosentraeger.
 */
function optionIsValid(name) {
  const n = String(name || "").trim().toLowerCase();
  return !!n && OPTION_BLOCKLIST.indexOf(n) === -1;
}

/** Steht der Siegesschirm noch? */
function victoryOpen() {
  const live = findInfiltration();
  if (live && detectStage(live) === "VictoryModel") return true;
  // Zweitmarker: beide Beuteknoepfe gibt es nur auf dem Siegesschirm.
  return !!(findTradeButton() && findSellButton());
}

function selectNode() {
  return qGame("[role='combobox'], .MuiSelect-select")[0] || null;
}

function selectText() {
  const el = selectNode();
  return el ? txt(el) : "";
}

/**
 * Alle Prop-Objekte mit onChange oberhalb des Select-Knotens.
 *
 * Victory.tsx uebergibt changeDropdown als onChange an <Select>; MUI reicht das
 * durch mehrere interne Ebenen weiter. Welche Ebene wir erwischen, ist egal -
 * jede akzeptiert ein Ereignis mit target.value. Es wird der Reihe nach
 * probiert und nach jedem Versuch geprueft, ob der Select den Wert uebernommen
 * hat.
 */
function selectPropCandidates() {
  const el = selectNode();
  if (!el) return [];
  const out = [];
  let f = fiberOf(el);
  let depth = 0;
  while (f && depth++ < 25) {
    const p = f.memoizedProps;
    if (p && typeof p === "object" && typeof p.onChange === "function") out.push(p);
    f = f.return;
  }
  return out;
}

/** Rekursiv die value-Attribute der MenuItem-Kinder einsammeln. */
function collectOptionValues(children, out, depth) {
  const d = depth || 0;
  if (d > 8 || children == null || children === false || children === true) return;
  if (Array.isArray(children)) {
    for (const c of children) collectOptionValues(c, out, d + 1);
    return;
  }
  if (typeof children !== "object") return;
  const p = children.props;
  if (p) {
    if (typeof p.value === "string" && p.value && out.indexOf(p.value) === -1) out.push(p.value);
    if (p.children) collectOptionValues(p.children, out, d + 1);
  }
}

/**
 * Waehlbare Fraktionen.
 * Bevorzugt aus den React-Kindern des Select - damit muss das Menue gar nicht
 * erst geoeffnet werden (v1.x musste dafuer ein Portal aufklappen, die
 * Optionen aus dem DOM lesen und den Backdrop wieder wegklicken).
 * Rueckfall: Menue oeffnen und die Eintraege ablesen.
 */
async function factionOptions(ns) {
  const cands = selectPropCandidates();
  for (const p of cands) {
    if (!p.children) continue;
    const vals = [];
    collectOptionValues(p.children, vals, 0);
    const ok = vals.filter(optionIsValid);
    if (ok.length) return { names: ok, viaProps: true };
  }

  // Rueckfall ueber das DOM-Menue.
  const el = selectNode();
  if (!el) return { names: [], viaProps: false };
  const ME = globalThis["MouseEvent"];
  try {
    if (ME) el.dispatchEvent(new ME("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    else el.click();
  } catch (e) {
    try {
      el.click();
    } catch (e2) {
      return { names: [], viaProps: false };
    }
  }
  const list = await waitFor(
    ns,
    () => {
      const l = qAll("li[role='option'], .MuiMenuItem-root");
      return l.length ? l : null;
    },
    2000,
    60,
  );
  const names = [];
  if (list) {
    for (const o of list) {
      const n = txt(o);
      if (optionIsValid(n) && names.indexOf(n) === -1) names.push(n);
    }
  }
  try {
    const bd = qAll(".MuiBackdrop-root, .MuiModal-backdrop")[0];
    if (bd) bd.click();
  } catch (e) {
    /* ignore */
  }
  await ns.sleep(120);
  return { names, viaProps: false };
}

/** Wert im Dropdown setzen. Rueckgabe: true, wenn er uebernommen wurde. */
async function setFaction(ns, name) {
  for (const p of selectPropCandidates()) {
    try {
      p.onChange({
        target: { value: name, name: p.name },
        currentTarget: { value: name },
        preventDefault() {},
        stopPropagation() {},
      });
    } catch (e) {
      continue;
    }
    await ns.sleep(120);
    if (selectText().toLowerCase().indexOf(String(name).toLowerCase()) !== -1) return true;
  }

  // Rueckfall: Menue oeffnen und den Eintrag anklicken.
  const el = selectNode();
  if (!el) return false;
  const ME = globalThis["MouseEvent"];
  try {
    if (ME) el.dispatchEvent(new ME("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    else el.click();
  } catch (e) {
    /* ignore */
  }
  const list = await waitFor(
    ns,
    () => {
      const l = qAll("li[role='option'], .MuiMenuItem-root");
      return l.length ? l : null;
    },
    2000,
    60,
  );
  if (list) {
    for (const o of list) {
      if (txt(o) === name) {
        rClick(o);
        await ns.sleep(200);
        return selectText().toLowerCase().indexOf(String(name).toLowerCase()) !== -1;
      }
    }
  }
  try {
    const bd = qAll(".MuiBackdrop-root, .MuiModal-backdrop")[0];
    if (bd) bd.click();
  } catch (e) {
    /* ignore */
  }
  return false;
}

/**
 * Zielfraktion bestimmen: zuerst das naechste offene Aug-Ziel (kleinste
 * Restluecke, damit Fraktionen der Reihe nach fertig werden), sonst die
 * niedrigste angebotene Reputation.
 */
async function chooseFaction(ns, goals) {
  const { names } = await factionOptions(ns);
  if (!names.length) return { ok: false, reason: "keine waehlbare Fraktion im Dropdown" };

  for (const g of goals || []) {
    if (names.indexOf(g.faction) !== -1) {
      return { ok: true, name: g.faction, why: `Aug-Ziel, Restluecke ${fmt(g.gap)}` };
    }
  }

  let chosen = null;
  let bestRep = Infinity;
  for (const n of names) {
    let rep = null;
    try {
      rep = ns.singularity.getFactionRep(n);
    } catch (e) {
      rep = null;
    }
    if (rep === null || !isFinite(rep)) continue;
    if (rep < bestRep) {
      bestRep = rep;
      chosen = n;
    }
  }
  if (!chosen) return { ok: false, reason: "keine Fraktion mit lesbarer Reputation" };
  return { ok: true, name: chosen, why: `kein offenes Aug-Ziel im Dropdown, niedrigste Rep ${fmt(bestRep)}` };
}

function infilMoney(ns) {
  try {
    const s = ns.getMoneySources();
    const v = s && s.sinceInstall ? s.sinceInstall.infiltration : null;
    return isFinite(v) ? v : null;
  } catch (e) {
    return null;
  }
}

/**
 * Kumulierte Krankenhauskosten (negativ, MoneySourceTracker "hospitalization").
 * Der DOM-Dialog ist fluechtig, dieser Wert bleibt - er belegt eine
 * Hospitalisierung auch dann noch, wenn der Dialog schon weg ist.
 * Hospital.ts: die Kosten haengen am HP-Verlust; bei vollen HP sind sie 0.
 */
function hospMoney(ns) {
  try {
    const s = ns.getMoneySources();
    const v = s && s.sinceInstall ? s.sinceInstall.hospitalization : null;
    return isFinite(v) ? v : null;
  } catch (e) {
    return null;
  }
}

function factionRep(ns, name) {
  try {
    const r = ns.singularity.getFactionRep(name);
    return isFinite(r) ? r : null;
  } catch (e) {
    return null;
  }
}

/**
 * Geld kassieren.
 *
 * Gemessen wird ueber MoneySourceTracker.infiltration - das zaehlt isoliert nur
 * Infiltrationsertraege, laufende Trades von TRADER oder Kaeufe von BANK
 * verfaelschen die Messung also nicht.
 *
 * v2.0: die 50-%-Sollwertregel aus v1.x ist entfallen. Der Sollwert kam aus dem
 * Knopftext und musste dafuer durch parseFormattedNumber - eine Heuristik ueber
 * Tausendertrenner. Verifiziert wird jetzt schlicht: es kam Geld an und der
 * Schirm ist zu. Das ist die Aussage, auf die es ankommt, und sie erzeugt keine
 * Fehlalarme.
 */
async function claimMoney(ns) {
  const btn = findSellButton();
  if (!btn) {
    say(ns, `Sell-Knopf nicht gefunden. Knoepfe: ${JSON.stringify(qGame("button").map(txt))}`, C.bad);
    return { ok: false, verified: false, reason: "kein Sell-Knopf", mode: "money", delta: 0 };
  }

  const label = txt(btn);
  const before = infilMoney(ns);
  rClick(btn);
  await ns.sleep(400);
  const after = infilMoney(ns);
  const gone = !victoryOpen();
  const delta = before !== null && after !== null ? after - before : null;

  let verified = true;
  let reason = "";
  if (delta === null) {
    verified = gone;
    if (!verified) reason = "Schirm blieb offen, kein Money-Tracker lesbar";
  } else if (delta <= 0) {
    verified = false;
    reason = "kein Geld gutgeschrieben";
  }

  log(ns, `Sell "${label}" | Ist ${fmt(delta)} | Schirm ${gone ? "zu" : "OFFEN"}`);
  return { ok: gone && verified, verified, reason, mode: "money", delta: delta || 0 };
}

/**
 * Reputation kassieren.
 *
 * v2.0: gemessen wird gezielt die GEWAEHLTE Fraktion. Damit entfaellt die
 * diffReps-/"groesster Gewinner"-Logik aus v1.x samt der SoA-Sonderregel:
 * Shadows of Anarchy bekommt fuer die Infiltration selbst Reputation
 * (Victory.tsx handleInfiltrators), was in v1.11 bei JEDEM korrekten Trade den
 * Fehlalarm "Rep ging an die falsche Fraktion" ausgeloest hat.
 */
async function claimRep(ns, goals) {
  const pick = await chooseFaction(ns, goals);
  if (!pick.ok) {
    // NICHT wortlos aufgeben: bis v1.9 kehrte claimRep hier zurueck, ohne einen
    // Knopf gedrueckt zu haben - der Siegesschirm blieb danach stehen und
    // blockierte jede weitere Infiltration.
    log(ns, `Fraktionsauswahl fehlgeschlagen (${pick.reason}) - weiche auf Geld aus.`);
    const alt = await claimMoney(ns);
    alt.reason = `Rep nicht moeglich (${pick.reason}) -> Geld kassiert`;
    alt.fallback = true;
    return alt;
  }

  if (!(await setFaction(ns, pick.name))) {
    log(ns, `Dropdown hat "${pick.name}" nicht uebernommen (zeigt "${selectText()}") - weiche auf Geld aus.`);
    const alt = await claimMoney(ns);
    alt.reason = `Dropdown blieb auf "${selectText()}" -> Geld kassiert`;
    alt.fallback = true;
    return alt;
  }
  log(ns, `Zielfraktion: ${pick.name} (${pick.why})`);

  const btn = findTradeButton();
  if (!btn) {
    say(ns, `Trade-Knopf nicht gefunden. Knoepfe: ${JSON.stringify(qGame("button").map(txt))}`, C.bad);
    return { ok: false, verified: false, reason: "kein Trade-Knopf", mode: "rep", delta: 0 };
  }

  const label = txt(btn);
  const before = factionRep(ns, pick.name);
  rClick(btn);
  await ns.sleep(400);
  const after = factionRep(ns, pick.name);

  const gone = !victoryOpen();
  const delta = before !== null && after !== null ? after - before : null;

  let verified = true;
  let reason = "";
  if (delta === null) {
    verified = gone;
    if (!verified) reason = "Schirm blieb offen, Rep nicht lesbar";
  } else if (delta <= 0) {
    verified = false;
    reason = `keine Rep bei ${pick.name} gutgeschrieben`;
  }

  log(ns, `Trade "${label}" | ${pick.name} ${fmt(delta)} | Schirm ${gone ? "zu" : "OFFEN"}`);
  return { ok: gone && verified, verified, reason, mode: "rep", faction: pick.name, delta: delta || 0 };
}

/**
 * Beute kassieren, mit Notfallkassierung.
 *
 * Der Siegesschirm darf unter keinen Umstaenden offen bleiben. Schlaegt der
 * gewuenschte Weg fehl, wird der jeweils andere Beuteknopf gedrueckt und
 * notfalls irgendeiner auf dem Schirm - eine kleinere Belohnung ist immer
 * besser als ein haengendes Spiel.
 */
async function claimLoot(ns, mode, goals) {
  let last = { ok: false, verified: false, reason: "nicht versucht", delta: 0, mode };
  for (let versuch = 1; versuch <= 2; versuch++) {
    last = mode === "money" ? await claimMoney(ns) : await claimRep(ns, goals);
    if (last.verified) return last;
    if (versuch === 1 && victoryOpen()) {
      log(ns, "Siegesschirm noch offen - zweiter Versuch.");
      await ns.sleep(400);
      continue;
    }
    break;
  }

  if (victoryOpen()) {
    const order = mode === "money" ? [findTradeButton, findSellButton] : [findSellButton, findTradeButton];
    for (const finder of order) {
      const btn = finder();
      if (!btn) continue;
      say(ns, `NOTKASSE: "${txt(btn)}" gedrueckt, damit der Siegesschirm nicht stehen bleibt.`, C.warn);
      runLog(ns, `NOTKASSE "${txt(btn)}" (${last.reason})`);
      rClick(btn);
      await ns.sleep(400);
      if (!victoryOpen()) {
        return { ok: true, verified: false, reason: `Notkasse (${last.reason})`, mode: "emergency", delta: 0 };
      }
    }
    for (const btn of qGame("button")) {
      const label = txt(btn);
      if (!label) continue;
      rClick(btn);
      await ns.sleep(300);
      if (!victoryOpen()) {
        say(ns, `NOTKASSE (Rueckfall): "${label}" gedrueckt.`, C.warn);
        runLog(ns, `NOTKASSE-RUECKFALL "${label}"`);
        return { ok: true, verified: false, reason: `Notkasse Rueckfall (${last.reason})`, mode: "emergency", delta: 0 };
      }
    }
    say(ns, `SIEGESSCHIRM BLEIBT OFFEN - kein Knopf hat gewirkt. Knoepfe: ${JSON.stringify(qGame("button").map(txt))}`, C.bad);
  }

  if (!last.verified) say(ns, `VERIFIKATION FEHLGESCHLAGEN: ${last.reason}`, C.bad);
  return last;
}

// =============================================================================
// GRAFTING-SCHUTZ
// =============================================================================
//
// ns.singularity.stopAction() ruft Player.finishWork(true) - also cancelled.
// GraftingWork.tsx dazu woertlich: "You cancelled the grafting of {aug}. Your
// money was not returned to you." Ein Abbruch waehrend eines Graftings
// vernichtet also Geld UND Augmentierung.
//
// Zusaetzlich haelt Grafting den Fokus und wuerde jeden Lauf verdraengen.
// Deshalb wird waehrend eines Graftings gar nicht erst gestartet.
//
// In dieser Datei gibt es bewusst KEIN stopAction(). INFIL fasst den Work-Slot
// ueberhaupt nicht an - das Grafting-Risiko ist strukturell ausgeschlossen,
// nicht nur abgesichert.

function graftingActive(ns) {
  try {
    const w = ns.singularity.getCurrentWork();
    return !!(w && w.type === "GRAFTING");
  } catch (e) {
    // Im Zweifel als aktiv werten: lieber pausieren als einen Kauf vernichten.
    return true;
  }
}

// =============================================================================
// SELBSTTEST
// =============================================================================

/**
 * Prueft die React-Bruecke und, falls gerade eine Infiltration laeuft, die
 * Modellfelder des aktuellen Minispiels.
 *
 * Das ist das Werkzeug fuer den Fall "nach dem Spiele-Update geht nichts mehr":
 * es sagt, OB die Bruecke traegt und WELCHE Felder fehlen.
 */
function selftest(ns) {
  const out = [];
  out.push(`SCHWARM-INFIL Selbsttest v${VERSION}  ${new Date().toISOString()}`);
  out.push("");

  if (!doc) {
    out.push("FEHLER: kein DOM-Zugriff (globalThis.document ist leer).");
    ns.tprint("\n" + out.join("\n"));
    return;
  }

  const seeds = qGame(".MuiContainer-root, .MuiPaper-root");
  out.push(`Startknoten fuer die Suche: ${seeds.length}`);

  let withFiber = 0;
  for (const el of seeds) if (fiberOf(el)) withFiber++;
  out.push(`davon mit "${FIBER_PREFIX}...": ${withFiber}`);
  if (seeds.length && !withFiber) {
    out.push("");
    out.push(">>> DIE FIBER-EIGENSCHAFT FEHLT. React hat das Praefix geaendert.");
    out.push(">>> In der Browser-Konsole einen Spielknoten inspizieren und");
    out.push(">>> FIBER_PREFIX / PROPS_PREFIX im Kopf der Datei anpassen.");
  }

  const st = findInfiltration();
  out.push("");
  if (!st) {
    out.push("Infiltration-Objekt: NICHT GEFUNDEN.");
    out.push("  Laeuft gerade eine Infiltration? Ohne laufenden Schirm ist das normal.");
    out.push("  Wenn ja: looksLikeInfiltration() gegen Infiltration.ts abgleichen.");
    ns.tprint("\n" + out.join("\n"));
    ns.write(PROBE_FILE, out.join("\n"), "w");
    return;
  }

  out.push("Infiltration-Objekt: GEFUNDEN");
  out.push(`  Ort:                ${(st.location && st.location.name) || "?"}`);
  out.push(`  Level:              ${st.level} / ${st.maxLevel}`);
  out.push(`  Startsicherheit:    ${st.startingSecurityLevel}`);
  out.push(`  Startschwierigkeit: ${Number(st.startingDifficulty).toFixed(3)} (Engine-Grenze ${ENGINE_MAX_DIFFICULTY})`);
  out.push(`  aktuelle Schwierigkeit: ${typeof st.difficulty === "function" ? st.difficulty().toFixed(3) : "?"}`);
  out.push(`  Ergebnisse:         "${st.results || ""}"`);
  out.push(`  beendet (cleanup):  ${runEnded(st)}`);

  const name = detectStage(st);
  const rawName = stageName(st);
  out.push("");
  out.push(`Aktuelles Modell: ${name || "?"}` + (rawName && rawName !== name ? `  (Klassenname: "${rawName}" - ueber Feldsignatur erkannt)` : ""));
  const def = SOLVERS[name];
  if (!def) {
    out.push("  >>> KEIN LOESER VORHANDEN. Neues Minispiel in der Engine?");
    out.push("  >>> Modell in SOLVERS ergaenzen.");
  } else {
    const miss = missingFields(name, st.stage);
    if (miss.length) {
      out.push(`  >>> FEHLENDE FELDER: ${miss.join(", ")}`);
      out.push("  >>> Loeser in SOLVERS gegen das Modell abgleichen.");
    } else {
      out.push(`  Felder vollstaendig: ${def.fields.join(", ") || "(keine noetig)"}`);
      try {
        const plan = def.plan(st.stage);
        out.push(`  Geplante Tasten: ${JSON.stringify(plan)}`);
        out.push("  (NUR GEPLANT - der Selbsttest sendet nichts.)");
      } catch (e) {
        out.push(`  >>> Loeser warf: ${e}`);
      }
    }
  }

  out.push("");
  out.push("Bekannte Loeser: " + Object.keys(SOLVERS).join(", "));
  out.push("");
  out.push("Beuteknoepfe sichtbar:");
  out.push(`  Trade: ${!!findTradeButton()}   Sell: ${!!findSellButton()}`);
  const cands = selectPropCandidates();
  out.push(`  Select-Kandidaten mit onChange: ${cands.length}`);

  const text = out.join("\n");
  ns.write(PROBE_FILE, text, "w");
  ns.tprint("\n" + text + `\n\n(auch geschrieben nach ${PROBE_FILE})`);
}

function probeDump(ns) {
  const out = [`SCHWARM-INFIL PROBE v${VERSION}  ${new Date().toISOString()}`];

  out.push("--- Ueberschriften (Spielbereich) ---");
  for (const el of qGame("h1,h2,h3,h4,h5,h6")) {
    const t = txt(el);
    if (t) out.push(`  <${el.tagName.toLowerCase()}> ${t}`);
  }
  out.push("--- Knoepfe (Spielbereich) ---");
  for (const b of qGame("button")) {
    const t = txt(b);
    if (t) out.push(`  "${t}"`);
  }
  out.push("--- Selects ---");
  for (const s of qGame(".MuiSelect-select, [role='combobox'], select")) out.push(`  text="${txt(s)}"`);
  out.push("--- Offene Menue-Optionen ---");
  for (const o of qAll("li[role='option'], .MuiMenuItem-root")) out.push(`  "${txt(o)}"`);
  out.push("--- Dialoge / Snackbars ---");
  for (const d of qAll(".MuiDialog-root, .MuiAlert-root, .SnackbarItem-message, .notistack-MuiContent")) {
    const t = txt(d);
    if (t) out.push(`  ${t.slice(0, 300)}`);
  }
  out.push("--- React-Bruecke ---");
  const st = findInfiltration();
  out.push(`  Infiltration-Objekt: ${st ? "gefunden" : "nicht gefunden"}`);
  if (st) {
    out.push(`  Modell: ${detectStage(st)} | Level ${st.level}/${st.maxLevel} | Ergebnisse "${st.results || ""}"`);
  }

  const text = out.join("\n");
  ns.write(PROBE_FILE, text, "w");
  ns.tprint("\n" + text + `\n\n(auch geschrieben nach ${PROBE_FILE})`);
}

// =============================================================================
// MAIN
// =============================================================================

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const flags = ns.flags([
    ["minutes", 0],
    ["maxdiff", 3.5],
    ["maxrun", 900],
    ["mode", ""],
    ["notravel", false],
    ["rotate", false],
    ["lowrep", false],
    ["demand", false],
    ["probe", false],
    ["selftest", false],
    ["rebuild", false],
    ["quiet", true],
    ["nostop", false],
    ["help", false],
  ]);

  QUIET = !!flags.quiet;

  if (flags.help) {
    ns.tprint(
      `\nSCHWARM-INFIL v${VERSION}\n` +
        `  --mode rep|money|auto  Beute (Default auto: Rep solange es Rep-Ziele gibt)\n` +
        `  --minutes N            Laufzeit; 0 = Dauerbetrieb (Default)\n` +
        `  --maxdiff X            Grenze der ENDschwierigkeit (Default 3.5). Die Engine\n` +
        `                         begrenzt nur den STARTwert auf 3.5; hoehere Werte sind\n` +
        `                         erlaubt (NWO braucht ca. 4.5).\n` +
        `  --maxrun N             Notanker je Lauf in Sekunden (Default 900)\n` +
        `  --rotate               dasselbe Ziel nicht direkt wiederholen\n` +
        `  --lowrep               Aug-Ziele ignorieren, immer niedrigste Rep\n` +
        `  --notravel             keine Stadtreisen\n` +
        `  --demand               auf Market-Demand 2/3 warten\n` +
        `  --rebuild              Ziel- und Fraktionscache neu aufbauen\n` +
        `  --selftest             React-Bruecke und Modellfelder pruefen, dann Ende\n` +
        `  --probe                aktuellen Schirm analysieren, dann Ende\n` +
        `  --quiet                keine Terminal-Ausgabe (STANDARD)\n` +
        `  --nostop               NICHT abschalten, wenn der Spieler waehrend eines\n` +
        `                         Laufs "Cancel Infiltration" drueckt. Ohne die Flagge\n` +
        `                         sendet INFIL dabei STOP:INFIL an die Queen (Port 1),\n` +
        `                         legt damit den Dashboard-Schalter um und beendet sich.\n` +
        `\nLaufprotokoll: cat ${RUN_LOG_FILE}  (auch waehrend INFIL laeuft)\n` +
        `\nHINWEIS: v2.0 spielt ueber die React-Fiber direkt am Modell. Bricht das\n` +
        `nach einem Spiele-Update, meldet --selftest die Ursache. inflitrator.js\n` +
        `wird nicht mehr benoetigt.\n`,
    );
    return;
  }

  if (!doc) {
    ns.tprint("FEHLER: kein DOM-Zugriff.");
    return;
  }
  if (flags.selftest) {
    selftest(ns);
    return;
  }
  if (flags["probe"]) {
    probeDump(ns);
    return;
  }

  // v2.4: nur auf Ansage, sonst ausdruecklich ZU. Siehe CORP v0.36 - das blosse
  // Weglassen reichte nicht, weil Bitburner offene Fenster je Skript wieder
  // herstellt.
  if (ns.args.includes("--tail")) {
    try {
      ns.ui.openTail();
    } catch (e) {
      /* Tail-Fenster ist optional */
    }
  } else {
    try {
      ns.ui.closeTail();
    } catch (e) {
      /* kein Fenster da */
    }
  }

  // Klickwache fuer "Cancel Infiltration". atExit meldet den Handler auch dann
  // ab, wenn das Skript getoetet wird (killall, Dashboard-STOP, Prestige) -
  // genau das fehlte inflitrator.js und hat dort die Zombie-Listener erzeugt.
  const watchOn = !flags.nostop;
  if (watchOn) {
    if (installCancelWatch(ns)) {
      log(ns, 'Klick auf "Cancel Infiltration" schaltet INFIL ab (--nostop hebt das auf).');
    } else {
      say(ns, 'Klickwache liess sich nicht installieren - "Cancel Infiltration" schaltet INFIL nicht ab.', C.warn);
    }
  }
  try {
    ns.atExit(() => removeCancelWatch());
  } catch (e) {
    /* atExit ist optional */
  }

  // --- Grafting-Gate: warten, nicht abschalten -------------------------------
  // Rund um einen Softreset ist Grafting genau das, was laeuft (BANK graftet vor
  // und nach dem Install). Bis v1.8 schrieb INFIL sich hier selbst auf AUS und
  // war danach dauerhaft still. Jetzt wird gewartet.
  if (GRAFT_PAUSE && graftingActive(ns)) {
    say(ns, "Grafting laeuft - INFIL wartet und startet, sobald es beendet ist.");
    runLog(ns, "WARTE auf Ende des Graftings");
    let waited = 0;
    while (graftingActive(ns)) {
      await ns.sleep(GRAFT_WAIT_POLL_MS);
      waited += GRAFT_WAIT_POLL_MS;
      if (waited % GRAFT_WAIT_LOG_MS < GRAFT_WAIT_POLL_MS) {
        log(ns, `Grafting laeuft noch - warte (${Math.round(waited / 60000)} min).`);
      }
    }
    say(ns, "Grafting beendet - INFIL nimmt die Arbeit auf.");
    runLog(ns, `START nach ${Math.round(waited / 1000)} s Wartezeit (Grafting)`);
  }

  const cfg = {
    noTravel: !!flags.notravel,
    maxRunMs: Math.max(60, Number(flags.maxrun) || 900) * 1000,
  };

  let mode = String(flags.mode || "").toLowerCase();
  if (["rep", "money", "auto"].indexOf(mode) === -1) {
    if (mode) log(ns, `Unbekannter Modus "${mode}" - nehme auto.`);
    mode = "auto";
  }

  // --- Caches ----------------------------------------------------------------
  const augReset = lastAugReset(ns);
  const cacheAge = fileStamp(ns, CACHE_STAMP);
  const goalsAge = fileStamp(ns, GOALS_FILE);
  const staleAfterReset = augReset > 0 && cacheAge < augReset;
  const goalsStale = augReset > 0 && goalsAge < augReset;
  if (augReset > 0) {
    const mins = Math.round((Date.now() - augReset) / 60000);
    runLog(
      ns,
      `START (letzter Aug-Reset vor ${mins} min` +
        `${staleAfterReset ? ", Zielcache veraltet -> Neuaufbau" : ""}` +
        `${goalsStale ? ", Fraktionsziele veraltet -> Neuaufbau" : ""})`,
    );
  }

  let targets = flags.rebuild || staleAfterReset ? null : readTargets(ns);
  if (!targets) {
    say(ns, "Baue Zielcache (einmalig, 15 GB Wegwerf-Skript)...");
    if (!(await runThrowaway(ns, BUILDER_FILE, TARGET_SRC, 15))) return;
    targets = readTargets(ns);
    if (!targets) {
      say(ns, "FEHLER: Zielcache konnte nicht erstellt werden.", C.bad);
      return;
    }
  }

  let goals = [];
  let goalsStamp = 0;
  async function refreshGoals(force) {
    if (!force && Date.now() - goalsStamp < GOALS_REFRESH_MS) return;
    goalsStamp = Date.now();
    if (!(await runThrowaway(ns, GOALS_BUILDER, GOALS_SRC, 16))) return;
    const g = readGoals(ns);
    goals = g && Array.isArray(g.goals) ? g.goals : [];
  }
  if (flags.lowrep) {
    goals = [];
    log(ns, "--lowrep: Aug-Ziele aus, es gewinnt die niedrigste Reputation im Dropdown.");
  } else {
    await refreshGoals(true);
  }

  const forever = Number(flags.minutes) <= 0;
  say(
    ns,
    `v${VERSION} | Modus ${mode} | ${targets.length} Ziele | ${goals.length} Fraktionen mit offenen Augs | ` +
      `${forever ? "Dauerbetrieb" : flags.minutes + " min"} | maxdiff ${flags.maxdiff}`,
  );
  runLog(ns, `START v${VERSION} mode=${mode} maxdiff=${flags.maxdiff}`);
  if (goals.length) {
    log(ns, `Reihenfolge: ${goals.slice(0, 5).map((g) => `${g.faction} (${fmt(g.gap)})`).join(" -> ")}`);
  }

  // --- Hauptschleife ---------------------------------------------------------
  // INFIL BEENDET SICH UNTER KEINEN UMSTAENDEN SELBST. Jeder frueher toedliche
  // Ausgang ist ein Wartezustand. Abgeschaltet wird ausschliesslich von aussen
  // (killall oder Dashboard-Schalter).
  const deadline = forever ? Infinity : Date.now() + Number(flags.minutes) * 60000;
  let lastTarget = "";
  let fails = 0;
  let banned = {};
  let graftPaused = false;
  let noTargetMs = 0;
  let runs = 0;
  let wins = 0;
  let lostGames = 0;
  const lostTotal = {};
  let gainedRep = 0;
  let gainedCash = 0;

  while (Date.now() < deadline) {
    if (!flags.lowrep) await refreshGoals(false);

    const effMode = mode === "auto" ? (flags.lowrep || goals.length ? "rep" : "money") : mode;

    if (GRAFT_PAUSE && graftingActive(ns)) {
      if (!graftPaused) {
        graftPaused = true;
        say(ns, "PAUSE: Grafting laeuft (BANK) - INFIL wartet, Slot bleibt unberuehrt.");
        runLog(ns, "PAUSE grafting");
      }
      await ns.sleep(GRAFT_POLL_MS);
      continue;
    }
    if (graftPaused) {
      graftPaused = false;
      say(ns, "Grafting beendet - INFIL nimmt die Arbeit wieder auf.");
    }

    const p = ns.getPlayer();
    dismissDialogs();

    if (flags.demand) {
      const wait = Math.min(msUntilOptimalMult(Date.now()), DEMAND_WAIT_MAX_MS);
      if (wait > 500) {
        log(ns, `Demand ${(marketMult(Date.now()) * 100).toFixed(0)} % -> warte ${(wait / 1000).toFixed(0)} s`);
        await ns.sleep(wait);
      }
    }

    const ranked = rankTargets(targets, p, {
      maxdiff: Number(flags.maxdiff),
      rotateBlock: flags.rotate ? lastTarget : "",
      banned,
      noTravel: cfg.noTravel,
      money: effMode === "money",
    });
    const cand = pickTarget(ranked);
    if (!cand) {
      const nBanned = Object.keys(banned).filter((k) => banned[k] >= BLOCK_AFTER).length;
      noTargetMs += NO_TARGET_WAIT_MS;
      if (noTargetMs > NO_TARGET_GIVEUP_MS) {
        say(
          ns,
          `Seit ${Math.round(noTargetMs / 60000)} min kein Ziel (${nBanned} gesperrt, maxdiff ${flags.maxdiff}) - ` +
            `Sperren aufgehoben, Zieltafel wird neu gebaut.`,
          C.warn,
        );
        runLog(ns, `NEUBEWERTUNG nach ${Math.round(noTargetMs / 60000)} min ohne Ziel`);
        banned = {};
        targets = null;
        noTargetMs = 0;
      }
      log(
        ns,
        `Kein Ziel erreichbar (${nBanned} gesperrt) - warte ${NO_TARGET_WAIT_MS / 1000} s und bewerte neu. ` +
          `Stats wachsen ueber WORK/Sleeves nach.`,
      );
      await ns.sleep(NO_TARGET_WAIT_MS);
      if (!targets) {
        if (!(await runThrowaway(ns, BUILDER_FILE, TARGET_SRC, 15))) {
          await ns.sleep(FATAL_WAIT_MS);
          continue;
        }
        targets = readTargets(ns) || [];
      }
      continue;
    }
    noTargetMs = 0;

    const mm = projectedMult(Date.now(), cand.sec * 1000);
    const kal = effMode === "money" ? yieldCalib.money : yieldCalib.rep;
    const erwartetRoh = cand.base * mm;
    log(
      ns,
      `Ziel: ${cand.t.name} (${cand.t.city}) | diff ${cand.diff.toFixed(2)}->${cand.endDiff.toFixed(2)} | ` +
        `${cand.t.lvl} Level | erwartet ${fmt(erwartetRoh * kal)}${effMode === "money" ? "$" : " Rep"}` +
        (Math.abs(kal - 1) > 0.02 ? ` (Rohwert ${fmt(erwartetRoh)}, kalibriert x${kal.toFixed(2)})` : "") +
        ` | Demand bei Abschluss ~${(mm * 100).toFixed(0)} %`,
    );

    runs++;
    const hospBefore = hospMoney(ns);
    // v2.5: laeuft ein Grafting, vorher/nachher festhalten - der Beleg, dass
    // der Lauf es nicht abbricht. NEIN heisst: beendet ODER abgebrochen, dann
    // getOwnedAugmentations pruefen.
    const graftVorher = graftingActive(ns);
    const res = await runOne(ns, cand, cfg);
    if (graftVorher) {
      const graftNachher = graftingActive(ns);
      runLog(ns, `GRAFT-PROBE ${cand.t.name}: Grafting vorher ja, nachher ${graftNachher ? "ja" : "NEIN"}`
        + ` (Lauf ${res.ok ? "ok" : "nicht ok: " + (res.reason || "?")})`);
      if (!graftNachher) say(ns, "Nach diesem Lauf laeuft KEIN Grafting mehr - beendet oder abgebrochen?", C.warn);
    }

    if (!res.ok) {
      // --- Der Spieler hat abgebrochen: abschalten, nicht weitermachen ------
      if (res.playerStop) {
        await cleanupAfterAbort(ns);
        await shutdownByPlayer(ns, '"Cancel Infiltration" gedrueckt');
        return;
      }

      // --- Bruecke kaputt: das ist die einzige echte Betriebsstoerung --------
      if (res.bridge) {
        say(
          ns,
          `REACT-BRUECKE GREIFT NICHT. Ohne sie wird NICHT gespielt - ein Notbetrieb ` +
            `mit gefaelschten Tastatur-Ereignissen wuerde onFailure({automated:true}) ausloesen ` +
            `(volle HP, Krankenhaus). Diagnose: run SCHWARM-INFIL.js --selftest`,
          C.bad,
        );
        runLog(ns, `NONE BRUECKE defekt - kein Lauf. --selftest ausfuehren.`);
        await cleanupAfterAbort(ns);
        await ns.sleep(BRIDGE_RETRY_MS);
        continue;
      }

      // --- Ziel war zu schwer: gesperrt, aber kein Schaden ------------------
      if (res.tooHard) {
        banned[cand.t.name] = BLOCK_AFTER;
        say(ns, `${cand.t.name}: ${res.reason}`, C.warn);
        runLog(ns, `ABBRUCH ${cand.t.name} zu schwer (vor dem Start abgefangen)`);
        await cleanupAfterAbort(ns);
        continue;
      }

      const hospAfter = hospMoney(ns);
      const hospCost = hospBefore !== null && hospAfter !== null ? hospBefore - hospAfter : 0;
      const wasHospital = res.reason.indexOf("Krankenhaus") !== -1 || hospCost > 0;
      const reason = wasHospital && hospCost > 0 ? `${res.reason} (${fmt(hospCost)}$ Behandlung)` : res.reason;

      // Krankenhaus und verlorener Schirm sind Spielverlaeufe, keine
      // Betriebsstoerung - sie zaehlen auf das ZIEL, nicht auf den NOTAUS.
      const softFail = wasHospital || !!res.aborted;
      if (!softFail) fails++;
      banned[cand.t.name] = (banned[cand.t.name] || 0) + 1;
      const hit = banned[cand.t.name];
      lostGames += res.lost || 0;
      mergeLost(lostTotal, res.lostBy);

      const lostTxt = res.lost ? ` | verloren: ${describeLost(res)}` : "";
      say(
        ns,
        `ABBRUCH bei ${cand.t.name}: ${reason}${lostTxt}` +
          (res.results ? ` | Verlauf "${res.results.slice(-15)}"` : ""),
        C.bad,
      );
      runLog(ns, `ABBRUCH ${cand.t.name} ${reason}${res.lost ? ` lost=${describeLost(res)}` : ""}`);
      if (hit >= BLOCK_AFTER) {
        say(ns, `${cand.t.name} wird gesperrt (${hit} Fehlschlaege) - naechstes Ziel.`, C.warn);
      }
      await cleanupAfterAbort(ns);

      if (fails >= MAX_FAILS) {
        say(ns, `Zu viele Stoerungen (${fails}) - Pause von ${COOLDOWN_MS / 60000} min, dann weiter.`, C.warn);
        runLog(ns, `PAUSE nach ${fails} Stoerungen`);
        await ns.sleep(COOLDOWN_MS);
        fails = 0;
        banned = {};
        continue;
      }

      await ns.sleep(800);
      continue;
    }

    // --- Lauf erfolgreich ------------------------------------------------------
    lastTarget = cand.t.name;
    banned[cand.t.name] = 0;
    lostGames += res.lost || 0;
    mergeLost(lostTotal, res.lostBy);
    const measured = res.seconds / cand.t.lvl;
    if (isFinite(measured) && measured > 0.3 && measured < 30) {
      secPerLevel = secPerLevel * 0.7 + measured * 0.3;
    }

    const claim = await claimLoot(ns, effMode, goals);
    // v2.1: mit dem Zeitstempel des LAUFBEGINNS, so wie Victory.tsx es tut
    // (decreaseMarketDemandMultiplier(state.gameStartTimestamp, maxLevel)).
    addFloors(cand.t.lvl, res.engineStart || Date.now() - res.seconds * 1000);

    if (claim.verified) {
      wins++;
      fails = 0;
      const isMoney = claim.mode === "money";
      if (isMoney) gainedCash += claim.delta;
      else gainedRep += claim.delta;

      // Anzeigekalibrierung gegen den TATSAECHLICHEN Multiplikator zum
      // Siegeszeitpunkt, nicht gegen die Prognose bei der Zielwahl.
      calibrate(claim.mode, claim.delta, cand.base * marketMult(res.engineStart || Date.now()));

      const color = isMoney ? C.money : C.rep;
      const beute = isMoney ? `+${fmt(claim.delta)}$` : `${claim.faction} +${fmt(claim.delta)} Rep`;
      say(
        ns,
        `OK ${cand.t.name} in ${res.seconds.toFixed(1)} s -> ${beute}` +
          (res.lost ? ` | verloren: ${describeLost(res)}` : "") +
          ` | Demand jetzt ${(marketMult(Date.now()) * 100).toFixed(0)} %`,
        color,
      );
      runLog(
        ns,
        `${isMoney ? "MONEY" : "REP"} ${cand.t.name} ${res.seconds.toFixed(1)}s ` +
          (isMoney ? `+${fmt(claim.delta)}$` : `${claim.faction} +${fmt(claim.delta)}rep`) +
          (res.lost ? ` lost=${describeLost(res)}` : "") +
          ` demand=${(marketMult(Date.now()) * 100).toFixed(0)}%`,
      );

      // Buchhaltung der Restluecke, damit der Fraktionswechsel ohne teuren
      // Cache-Neuaufbau erkannt wird.
      if (claim.mode === "rep" && goals.length) {
        const g = goals.find((x) => x.faction === claim.faction);
        if (g) {
          g.gap -= claim.delta;
          if (g.gap <= 0) {
            say(ns, `${claim.faction} hat alle Aug-Anforderungen erreicht - naechste Fraktion.`, C.rep);
            await refreshGoals(true);
          }
        }
      }
    } else {
      fails++;
      say(ns, `KEINE BELOHNUNG bei ${cand.t.name}: ${claim.reason || "unbekannt"}`, C.bad);
      runLog(ns, `NONE ${cand.t.name} ${claim.reason || "?"}`);
      if (fails >= MAX_FAILS) {
        say(
          ns,
          `Beute kam ${fails}x nicht an - Pause von ${COOLDOWN_MS / 60000} min. ` +
            `Siegesschirm bei Gelegenheit mit --probe pruefen.`,
          C.bad,
        );
        runLog(ns, `PAUSE nach ${fails} Laeufen ohne Belohnung`);
        await ns.sleep(COOLDOWN_MS);
        fails = 0;
        continue;
      }
    }

    bridge.drop();
    await ns.sleep(250);
  }

  await cleanupAfterAbort(ns);

  const lostDetail = describeLost({ lost: lostGames, lostBy: lostTotal });
  say(
    ns,
    `Ende. ${wins}/${runs} verwertet | ${fmt(gainedRep)} Rep | ${fmt(gainedCash)}$ | ` +
      `${lostGames} Minispiele verloren${lostGames ? ` (${lostDetail})` : ""} | ` +
      `${secPerLevel.toFixed(2)} s/Level | Kalibrierung Rep x${yieldCalib.rep.toFixed(2)} / Geld x${yieldCalib.money.toFixed(2)}`,
  );
  runLog(ns, `ENDE ${wins}/${runs} | ${fmt(gainedRep)}rep | ${fmt(gainedCash)}$ | lost=${lostGames}${lostGames ? ` (${lostDetail})` : ""}`);
}