/**
 * SCHWARM-INFO.js — v2.7
 *
 * v2.7 — corpBuyback/corpSellShares melden ERFOLG. buyBackShares und
 *   sellShares sind in der Engine void; die Vorlagen reichten dieses "nichts"
 *   durch, und BANK hielt gelungene Kaeufe/Verkaeufe fuer gescheitert. Jetzt:
 *   aufrufen, dann true (eine Ausnahme bleibt false).
 *
 * v2.6 — DIE WIRKSAMEN INTERVALLE WERDEN VEROEFFENTLICHT.
 *   Bloecke, deren Leser aus ist, sammelt INFO SPAR_FAKTOR-mal seltener (bei
 *   knappem Pool bis zu 3x). Veroeffentlicht wurden aber die PLANwerte, und
 *   DIAG meldete den absichtlich verlangsamten Block als alt - in BN15 als
 *   Dauerbefund "corp(alt)", obwohl CORP gewollt aus ist. Jetzt tragen die
 *   Direkt-Bloecke ihr wirksames Intervall (intervall()), die Sweeps den Plan.
 *
 * v2.5 — upgradeHomeCores IN DER BEFEHLSLISTE. Er fehlte: jeder Kernkauf
 *   von BANK bekam UNKNOWN_CMD, act() lieferte null, und niemand erfuhr es.
 *   home stand deshalb in BN14 tagelang bei EINEM Kern (24.09.2026).
 *
 * v2.4 — TAKT NACH LAGE UND BEDARF. Feste Planintervalle ignorierten, wie
 *   voll der Pool ist und ob den Block ueberhaupt jemand liest. Jetzt zwei
 *   multiplikative Faktoren: Pool-Lage aus DISP_OUT (1/2/3) und Bedarf (x6,
 *   wenn der lesende Daemon aus ist). BEWUSST NUR VERLANGSAMT, NIE
 *   ABGESCHALTET: daemonBereit() entscheidet anhand genau dieser Bloecke,
 *   ob ein Daemon wieder an darf — ohne sie ginge er nie wieder an.
 *
 * v2.3 — 85 % DES SNAPSHOTS WAREN TOTES GEWICHT. Die Waage aus v2.2 zeigte:
 *   der augs-Block war 107.0k von 125.4k Zeichen. Ursache war `stats` im
 *   Katalog — je Faktion wiederholt, obwohl `b` schon je Aug aufgebaut ist,
 *   und von KEINEM Verbraucher gelesen (BANK/WORK nehmen name, price,
 *   repReq; scoreAugStats() wird nirgends aufgerufen). Ersatzlos entfernt.
 *   Spart zusaetzlich den getAugmentationStats-Aufruf im Sweep selbst.
 *
 * v2.2 — EINE WAAGE, BEVOR GEKUERZT WIRD. INFO_OUT ist das groesste JSON im
 *   Schwarm; DIAG schrieb dazu nur "(gross)". Ohne Zahlen je Block waere jede
 *   Kuerzung geraten. publish() traegt jetzt ein Feld w mit der JSON-Laenge je
 *   Block und der Summe. NOCH WIRD NICHTS GESTRICHEN: erst die Zahlen ansehen.
 *
 * v2.1 — BLACKOP-CHRONIK im blade-Block. Nicht nur die naechste Operation,
 *   sondern alle: Name, noetiger Rang, erledigt ja/nein. Ein einzelner
 *   Blick auf "naechste BlackOp" sagt nichts darueber, ob der Daemon
 *   VORANKOMMT — erst die Liste zeigt, ob seit Stunden dieselbe Operation
 *   ansteht oder ob er sie der Reihe nach abarbeitet.
 *
 * v2.0 (Spenden-Zulieferung)
 *   - RPC-Whitelist: donateToFaction (SingularityFn3, 5 GB Basis).
 *     Die Engine wirft dort NICHT, sie gibt bei jedem Verstoss false zurueck
 *     (Singularity.ts:925-963). Der Aufrufer muss den Rueckgabewert pruefen.
 *   - player-Block: factionRepMult = mults.faction_rep des Spielers.
 *     Geht zusammen mit dem BitNode-Multiplikator FactionWorkRepGain in
 *     repFromDonation = amt/1e6 * faction_rep * FactionWorkRepGain ein
 *     (Faction/formulas/donation.ts:8-10). Ohne den Wert muesste WORK mit 1
 *     rechnen und bei einem Multiplikator von 1,5 rund die Haelfte zu viel
 *     ueberweisen. Kein RAM-Effekt: p kommt aus dem ohnehin geholten
 *     ns.getPlayer().
 *
 * v1.9 (Sleeve-Aufgaben vollstaendig melden)
 *   - sleeves-Block: task.companyName und task.factionWorkType kommen mit.
 *     Beide fehlten seit jeher, weil vor WORK v5.0 kein Sleeve Firmenarbeit
 *     machte. Sichtbar wurde es im DIAG-Bericht als "FIRMA ?" — der eigentliche
 *     Schaden lag aber woanders: applySleeveRole erkennt an
 *     `t.companyName === firma`, dass ein Sleeve BEREITS bei dieser Firma
 *     arbeitet, und laesst ihn dann in Ruhe. Ohne das Feld war der Vergleich
 *     immer falsch und jeder Firmen-Sleeve wurde jeden Takt neu gesetzt: acht
 *     ueberfluessige RPC-Aufrufe alle 20 Sekunden, dauerhaft.
 *     Reine Datenfelder aus der bereits geholten APICopy — kein RAM-Effekt.
 *
 * v1.8 (WORK-v5.0-Zulieferung)
 *   - RPC-Whitelist: sleeveCompanyWork (ns.sleeve.setToCompanyWork, 4 GB fix).
 *     WORK setzt Sleeves ohne freie Faktion ab jetzt auf Firmenarbeit statt auf
 *     Crime. In BN8 ist dabei nur der LOHN tot (CompanyWorkMoney 0); der
 *     Firmen-Ruf laeuft voll, und 400.000 davon schalten eine Konzern-Faktion
 *     frei. Der Aufruf steht in try/catch, weil die Engine wirft, sobald ein
 *     zweiter Sleeve dieselbe Firma greift.
 *   - Kein RAM-Effekt fuer INFO selbst: die tpl-Vorlage ist eine Zeichenkette
 *     und wird im Temp-Skript ausgewertet, nicht hier statisch analysiert.
 *
 * v1.7 — DER bn-BLOCK KONNTE SEINEN EIGENEN WERT NIE ERFAHREN.
 *   hashesWorthless kommt aus computeHashesWorthless, und das liest seit
 *   HELPERS v4.6 den Multiplikator HacknetNodeMoney — AUS DIESEM BLOCK. Der
 *   "bn"-Block ist aber statisch und wird genau EINMAL beim Start gebaut:
 *   beim ersten und einzigen Durchlauf existiert er noch nicht, die Stufe
 *   faellt durch, es bleibt bei der Knotenmessung, und ohne Knoten lautet die
 *   konservative Antwort "nicht wertlos". Danach steht das im Block und
 *   aendert sich nie wieder.
 *
 *   Im Bericht sah man das Ergebnis unmittelbar nebeneinander: die Zeile
 *   "gesperrt: hashesWorthless" und zwei Zeilen darunter HacknetNodeMoney=0.00.
 *
 *   Der Wert liegt in collectBn aber laengst vor — mults wurde eben geholt.
 *   Er wird jetzt direkt daraus gebildet, ohne Umweg ueber den eigenen Block,
 *   und zusaetzlich in S.feat korrigiert (der hacknet-Block haengt daran).
 *
 * v1.6 — CHRONIK ENTRAUSCHT. Der erste Lauf hat geliefert, aber geflutet: von
 *   rund fuenfzig Eintraegen waren vielleicht fuenf echte Fehler. Ursachen,
 *   alle am Protokoll abgelesen: "/i" liess ABGELEHNT auch auf DARKNETs
 *   "Ohne Session (scp/exec werden abgelehnt)" und die TRADER-Statistik
 *   "abgelehnt: Amortisation 23" greifen; "WARN" traf INFILs harmlosen
 *   HP-Hinweis; und jedes Ende eines Einmal-Laufs (BACKDOOR, DIAG, AUGS ...)
 *   wurde vermerkt, obwohl es der Normalfall ist.
 *   JETZT zweistufig: erst muss ein Muster greifen, dann darf keine der sieben
 *   Ausnahmen zutreffen. Gross-/Kleinschreibung zaehlt bei den Schluesselwoertern,
 *   weil SCHWARM echte Fehler durchgehend gross schreibt. Einmal-Laeufe melden
 *   ihr blosses Ende nicht mehr — eine Fehlerzeile in ihrem Log kommt weiter
 *   durch. Geprueft gegen 16 echte Zeilen aus der gelieferten Chronik.
 *
 * v1.5 — FEHLER-CHRONIK (Abschnitt 7b). Fehler bekommt man nur mit, wenn man im
 *
 * v1.5 — FEHLER-CHRONIK (Abschnitt 7b). Fehler bekommt man nur mit, wenn man im
 *   richtigen Moment auf das richtige Tail schaut; ein abgestuerztes Skript ist
 *   danach spurlos weg. INFO schreibt jetzt fortlaufend nach
 *   SCHWARM-CHRONIK-BN<n>.txt: Logs laufender SCHWARM-Daemons UND die Logs
 *   abgestuerzter Prozesse (ns.getRecentScripts liefert sie samt timeOfDeath).
 *   Gleiche Meldungen werden ueber einen zahlenfreien Fingerabdruck entdoppelt.
 *   NICHT enthalten und nicht nachruestbar: die Browser-Konsole — Engine-
 *   Meldungen gehen an die Devtools, dafuer gibt es keine Netscript-API.
 *   Kosten 0.6 GB (getRecentScripts/ps/scan je 0.2; getScriptLogs/read/write 0),
 *   deshalb haengt das hier statt in einem eigenen Daemon. minRam in
 *   SCHWARM-HELPERS wurde entsprechend von 72 auf 74 angehoben.
 *
 * v1.4 — Snapshot enthält `iv`: die Planintervalle je Block (CFG.IV). Leser können
 *   die Frische damit gegen die echten Intervalle prüfen statt gegen geratene
 *   Schwellen. Anlass: DIAG meldete `market` dauerhaft als veraltet, weil es 30 s
 *   annahm — planmäßig läuft der Block alle 180 s.
 *
 * v1.3 — augs-Block liefert zusätzlich `installed`. Bisher gab es nur `owned`
 *   (= getOwnedAugmentations(true), also inkl. gekaufter-nicht-installierter). Die
 *   Engine prüft an mehreren Stellen aber hasAugmentation(name, ignoreQueued=true),
 *   wertet also NUR installierte Augs — z. B. Bladeburner.process(), das ohne
 *   installiertes BladesSimulacrum jede Aktion abbricht, sobald Player.currentWork
 *   gesetzt ist. Mit nur einer Liste ist diese Frage nicht beantwortbar. Beide Listen
 *   kommen in EINEM eval; die statischen RAM-Kosten bleiben identisch, weil RAM pro
 *   Funktion und nicht pro Aufruf berechnet wird. Nebennutzen: die Reset-Logik kann
 *   die gekauften-nicht-installierten Augs als owned minus installed zählen.
 * Zentraler Informations- & RPC-Daemon des Schwarms ("eine Quelle, alle lesen").
 *
 * ===========================================================================
 * DOKTRIN
 * ===========================================================================
 *
 * PROBLEM (v3.0-Stand): Jeder Daemon holte teure Daten selbst — WORK/BANK/AUGS/
 * QUEEN starteten laufend evalNs-Wegwerfskripte (Singularity bei SF4 L1: bis
 * 80 GB PRO Funktion), der Dispatcher musste dafür Puffer freihalten, und bei
 * vollem Pool lieferten die Aufrufe still null (Sticky-Hacks, START/STOP-
 * Ping-Pong, "Capabilities kippen auf false").
 *
 * LÖSUNG: EIN Daemon besitzt die Informationsbeschaffung. Er läuft auf dem
 * GRÖSSTEN pserv, sammelt alles in Blöcken und publiziert einen Multiplex-
 * JSON-Snapshot auf Port 28 (peek). Konsumenten lesen mit 0 GB RAM über
 * HELPERS.readInfoBlock(). Zusätzlich führt INFO seltene Singularity-/Kauf-
 * AKTIONEN als RPC aus (Port 29 rein, Port 30 raus) — verdrahtet wird das
 * erst ab WORK v2 / BANK v-next (bis dahin: Gerüst, getestet, ungenutzt).
 *
 * RAM-BAUWEISE (Kern der Doktrin — bewusst KEIN "alles statisch"):
 *   - STATISCH eingebaut sind nur die BILLIGEN Reads (kein SF4-Multiplikator):
 *     Player/ResetInfo/heart, Sleeve (4 GB/Fn), Bladeburner (0-4), Gang (0-2),
 *     Hacknet (0.5), Corp (0/10), Stock-Flags (0.05). Statische Grundlast
 *     dadurch ~63,6 GB (mem-verifiziert in v1.0.1; nach Änderungen erneut mit `mem`
 *     verifizieren und ggf. minRam in der Registry nachziehen).
 *   - ns.singularity.* (das einzig Teure: Basis ×16/×4/×1 je SF4-Level, in
 *     BN4 immer ×1 — Engine: RamCostGenerator.ts SF4Cost) läuft als
 *     GEBÜNDELTES evalNs AUF DEM EIGENEN HOST. Der Headroom dafür ist der
 *     burst-Wert der Registry (176 GB): die Queen hält minRam+burst dauerhaft
 *     reserviert, solange INFO lebt (Queen.planDeployments) — deshalb braucht
 *     INFO KEINEN Eintrag in Dispatcher.EVAL_DAEMONS, und evalNs liefert hier
 *     nie "null wegen Pool voll". Bündel sind so geschnitten, dass das größte
 *     bei SF4 L1 ≤ 162 GB kostet (Kostentabelle SING_GB unten, Guard prüft
 *     vor jedem Lauf den echten freien RAM).
 *   - Alles TICK-/TIMING-KRITISCHE bleibt draußen: TRADER-Kurse
 *     (stock.nextUpdate-synchron), GANG-Warfare-Fenster (gang.nextUpdate-
 *     synchron), DISPATCHER-Formeln. Der Snapshot ist Sekunden-frisch, nicht
 *     Tick-frisch — Konsumenten prüfen das Blockalter (maxAgeMs).
 *
 * SNAPSHOT (Port 28, peek, EIN JSON-String):
 *   { v:1, gen, ts, host, blocks: { <name>: {ts, ok, data, err?, tries?} } }
 *   Blöcke + Planintervalle (CFG.IV):
 *     bn      Start/Prestige  BitNode, aktive SF-Level, sf4/sf4Mult, Options,
 *                             Feature-Gates (wie HELPERS.bitNodeFeatures),
 *                             lastNodeReset, Multiplikatoren (nur SF5-live;
 *                             statische Fallback-Tabelle = v1.1-Kandidat, s.u.)
 *     player  5 s             money, skills, factions, city, hp, karma, jobs
 *     caps    15 s            WSE/TIX/FOURS/FOURSUI/DARKWEB (billige Flags)
 *     sleeves 10 s            n, je Sleeve {shock,sync,city,skills,task};
 *                             Kauf-Katalog (shop) gedrosselt alle 60 s
 *     blade   10 s            inDivision, rank, stamina, city, chaos,
 *                             Contract-Restzahlen, skillPoints
 *     gang    15 s            inGang + Kern von getGangInformation
 *     hacknet 10 s            nodes, production, hashes, capacity, worthless
 *     corp    20 s            exists, funds, revenue, shares, divisions
 *     work    15 s  [SING]    getCurrentWork + checkFactionInvitations
 *     rep     30 s  [SING]    je beigetretener Faktion {rep, favor}
 *     augs    120 s [SING]    owned + Katalog je Faktion {name,price,repReq,
 *                             stats} (3-Bündel-Kette A/B/C, seriell)
 *     market  180 s [SING]    Darkweb-Programme+Preise, Home-RAM-Upgradekosten
 *     crime   300 s [SING]    je Crime {chance, stats} (Spieler, nicht Sleeve)
 *   [SING]-Blöcke melden ohne SF4 dauerhaft ok:false/err:"NO_SING" — die
 *   Konsumenten fallen dann auf ihre bisherigen Wege zurück. Bei evalNs-
 *   Fehlern bleibt der LETZTE GUTE data-Stand stehen (ts ehrlich alt).
 *
 * RPC (Port 29 -> INFO, FIFO / Port 30 -> Consumer, peek):
 *   Request  (HELPERS.requestInfoAction): {c,id,cmd,a,t}
 *   Response (HELPERS.readInfoActionResult): rpcRes[consumer][id] =
 *            {ok, res|err, ts}; Aufräumen nach RPC_RESULT_TTL_MS.
 *   Whitelist RPC_CMDS mit deklarierten RAM-Kosten (Headroom-Scheduling);
 *   "eval" = freier Code-Notausgang mit konservativer Kostenannahme
 *   (= EVAL_HEADROOM_GB; bei SF4 L1 passen darin max. ~2 Fn3-Äquivalente).
 *   Gleiches (c,id) vor Abarbeitung erneut gesendet -> letzter gewinnt.
 *   Abarbeitung SERIELL (ein evalNs zur Zeit), RPC hat Vorrang vor Sweeps;
 *   eine laufende augs-Kette kann einen RPC um wenige Sekunden verzögern.
 *
 * BEWUSST NICHT IN v1:
 *   - installBackdoor (blockiert das Temp-Skript minutenlang -> Timeout;
 *     bleibt beim DISPATCHER als eigener BACKDOOR-Payload).
 *   - Statische BitNode-Multiplikator-Tabelle: die Werte hängen je BitNode
 *     auch vom BN-LEVEL ab (Formeln in BitNode.tsx, nicht nur Konstanten).
 *     Eine halb richtige Tabelle wäre schlimmer als keine -> v1.1 mit den
 *     Level-Formeln aus der Engine-Quelle. Bis dahin: mults nur SF5-live,
 *     multsSource meldet "live"/"none"; die Feature-Gates + die empirische
 *     hashesWorthless-Ableitung decken die kritischen Entscheidungen ab.
 *   - Verdrahtung der Konsumenten (WORK/BANK/GANG): kommt in deren
 *     Lieferungen. v1 ändert an fremdem Verhalten NUR, dass HELPERS.
 *     detectCapabilities den SF-Level zuerst hier liest (0 GB statt evalNs).
 *
 * ===========================================================================
 * PATCH-HISTORIE
 * ===========================================================================
 * v1.2 (CORP-Finanzanbindung)
 *   - RPC-Whitelist: corpBuyback + corpSellShares (BANK führt den Aktien-
 *     Handel der Corp aus; je 20 GB CorporationAction, laufen im Headroom).
 * v1.1 (ENDGAME-Anzeige)
 *   - blade-Block: nextBlackOp = getNextBlackOp() ({name, rank} | null) fürs
 *     Dashboard-ENDGAME-Panel (Daedalus-Bereitschaft). +2 GB statisch.
 * v1.0.2 (WORK-v2-Zulieferung)
 *   - sleeves-Block: task.actionType mit erfasst (Engine liefert bei "Take on
 *     contracts" den CONTRACT-Namen in actionName und den Typ in actionType —
 *     ohne actionType ist der Ist-Task-Vergleich der Konsumenten unvollständig).
 *     Kein RAM-Effekt (reines Datenfeld).
 *   - gang-Block: Feld "inGang" -> "member" umbenannt. Konsequenz aus der
 *     v1.0.1-Doktrin: Konsumenten greifen per `.inGang` zu, und Member-
 *     Zugriffe mit ns-Funktionsnamen zählt die RAM-Analyse mit (hier zwar
 *     0 GB, aber die Regel gilt ausnahmslos, sonst erodiert sie).
 * v1.0.1 (Live-mem-Fix)
 *   - RAM-ANALYSE-FALLE behoben: Die Kostentabelle hieß SING_BASE mit echten
 *     Funktionsnamen als Keys; Zugriffe wie `SING_BASE.getFactionRep` zählte
 *     die statische Analyse als API-Aufruf (Member-Expression-Matching, egal
 *     auf welchem Objekt). Live-`mem`: 101,55 GB, davon 38 GB Phantomkosten —
 *     bei SF4 L1 wären es +570 GB gewesen. Tabelle -> SING_GB mit neutralen
 *     Keys (cWork, cFacRep, ...); erwarteter mem-Wert jetzt ~63,6 GB und
 *     UNABHÄNGIG vom SF4-Level. Registry-minRam in HELPERS: 80 -> 72.
 *   - Merksatz (gilt schwarmweit): Property-KEYS und String-Inhalte sind für
 *     die RAM-Analyse kostenlos, Member-ZUGRIFFE `x.fnName` nicht.
 * v1.0 (Erstausgabe)
 *   - Snapshot-Blöcke bn/player/caps/sleeves/blade/gang/hacknet/corp (direkt)
 *     + work/rep/augs/market/crime (evalNs-Bündel, Kosten-Guard, seriell).
 *   - RPC-Gerüst mit Whitelist (Singularity-Aktionen, Sleeve-Setter,
 *     Börsen-Zugänge, createCorp) + eval-Notausgang; Ergebnis-TTL 180 s.
 *   - Prestige-Erkennung über lastNodeReset (10-s-Takt): Blöcke verwerfen,
 *     Generation erhöhen, bn sofort neu. (Ein echter Reset killt den pserv-
 *     Prozess ohnehin — der Check fängt Soft-Fälle.)
 *   - ensureSingleInstance + announce (HELPERS-Doktrin), kein Auto-Tail.
 *
 * Test:  run SCHWARM-INFO.js   (Tail: Blockalter + RPC-Zähler)
 * RAM:   statisch ~63,6 GB (mem-verifiziert v1.0.1) + burst 176 GB Headroom.
 *
 * @param {NS} ns
 */

import {
    SCHWARM_PORTS, ensureSingleInstance, announce, evalNs, evalNsDetailed, bitNodeFeatures,
    formatRam, readOut, isDaemonEnabled,
} from "SCHWARM-HELPERS.js";

// =============================================================================
// 1. KONFIGURATION
// =============================================================================

/** MUSS zum burst-Wert des INFO-Eintrags in HELPERS.DAEMONS passen. */
const EVAL_HEADROOM_GB = 176;

const CFG = {
    TICK_MS: 400,               // Hauptschleife
    PUBLISH_MIN_MS: 1000,       // Snapshot höchstens 1x/s neu schreiben
    PRESTIGE_CHECK_MS: 10_000,  // lastNodeReset-Abgleich
    RPC_RESULT_TTL_MS: 180_000, // Ergebnisse so lange vorhalten
    RPC_DRAIN_MAX: 20,          // max. Requests je Takt einsammeln
    RPC_MAX_TRIES: 3,           // NO_RAM-Wiederholungen, dann Fehler
    SHOP_IV_MS: 60_000,         // Sleeve-Kaufkatalog (teuerster Direkt-Teil)
    WIEGE_MS: 30_000,          // v2.2: Blockgroessen neu bestimmen (s. wiege())
    ERR_RETRY_MS: 30_000,       // Sweep-Fehler: früherer Neuversuch
    IV: {                       // Planintervalle je Block (ms)
        player: 5_000, caps: 15_000, sleeves: 10_000, blade: 10_000,
        gang: 15_000, hacknet: 10_000, corp: 20_000,
        work: 15_000, rep: 30_000, augs: 120_000, market: 180_000, crime: 300_000,
    },
};

/** Singularity-BASIS-Kosten (GB) der in den Sweeps gebündelten Reads — Engine:
 *  RamCostGenerator.ts. Laufzeitkosten = Basis × sf4Mult (16/4/1; BN4 immer 1).
 *
 *  !! RAM-ANALYSE-FALLE (v1.0.1, per `mem` belegt): Bitburners statische
 *  !! Analyse zählt JEDEN Member-Zugriff `irgendwas.fnName` als API-Aufruf,
 *  !! wenn fnName einem ns-Funktionsnamen gleicht — egal auf welchem Objekt.
 *  !! `SING_BASE.getFactionRep` kostete deshalb statisch wie der echte Call
 *  !! (v1.0: +38 GB bei ×1, wäre +570 GB bei SF4 L1). String-INHALTE zählen
 *  !! dagegen NICHT (Beweis: die evalNs-Templates tauchen in `mem` nicht auf).
 *  !! DAHER: Keys hier dürfen NIE echten ns-Funktionsnamen gleichen.
 *
 *  Zuordnung Key -> ns.singularity.*:
 *    cWork=getCurrentWork(0.5)  cInvites=checkFactionInvitations(3)
 *    cFacRep=getFactionRep(1)   cFacFavor=getFactionFavor(1)
 *    cOwnedAugs=getOwnedAugmentations(5)  cAugsFromFac=getAugmentationsFromFaction(5)
 *    cAugPrice=getAugmentationPrice(2.5)  cAugRepReq=getAugmentationRepReq(2.5)
 *    cAugStats=getAugmentationStats(5)    cDwProgs=getDarkwebPrograms(0.5)
 *    cDwCost=getDarkwebProgramCost(0.5)   cHomeRam=getUpgradeHomeRamCost(1.5)
 *    cCrimeChance=getCrimeChance(5)       cCrimeStats=getCrimeStats(5)
 */
const SING_GB = {
    cWork: 0.5, cInvites: 3, cFacRep: 1, cFacFavor: 1,
    cOwnedAugs: 5, cAugsFromFac: 5, cAugPrice: 2.5, cAugRepReq: 2.5, cAugStats: 5,
    cDwProgs: 0.5, cDwCost: 0.5, cHomeRam: 1.5,
    cCrimeChance: 5, cCrimeStats: 5,
};

/** Skript-Grundlast eines evalNs-Temp-Skripts (Base 1.6 + Rundung). */
const EVAL_SCRIPT_BASE_GB = 2;

/** Exakte Crime-Namen (Engine: CrimeEnumType, NetscriptDefinitions). */
const CRIMES = [
    "Shoplift", "Rob Store", "Mug", "Larceny", "Deal Drugs", "Bond Forgery",
    "Traffick Arms", "Homicide", "Grand Theft Auto", "Kidnap",
    "Assassination", "Heist",
];

const J = (v) => JSON.stringify(v);

// =============================================================================
// 2. RPC-WHITELIST
// =============================================================================
//
// kind "sing": Kosten = base × sf4Mult.   kind "fix": Kosten = base (GB).
// kind "free": Kosten = EVAL_HEADROOM_GB (konservativ; eval-Notausgang).
// tpl(args) liefert den Ausdruck fürs Temp-Skript; Argumente IMMER über J()
// einbetten (Escaping). Rückgabe false/Zahl/Objekt = API-Antwort; null =
// eval fehlgeschlagen (Throw im Temp / Timeout / kein RAM-Start).

const RPC_CMDS = {
    // ── Singularity-Aktionen (WORK v2 / BANK v-next / ARSENAL) ───────────────
    joinFaction:      { kind: "sing", base: 3,   tpl: (a) => `ns.singularity.joinFaction(${J(a[0])})` },
    workForFaction:   { kind: "sing", base: 3,   tpl: (a) => `ns.singularity.workForFaction(${J(a[0])},${J(a[1])},${a[2] === true})` },
    applyToCompany:   { kind: "sing", base: 3,   tpl: (a) => `ns.singularity.applyToCompany(${J(a[0])},${J(a[1])})` },
    workForCompany:   { kind: "sing", base: 3,   tpl: (a) => `ns.singularity.workForCompany(${J(a[0])},${a[1] === true})` },
    commitCrime:      { kind: "sing", base: 5,   tpl: (a) => `ns.singularity.commitCrime(${J(a[0])},${a[1] === true})` },
    gymWorkout:       { kind: "sing", base: 2,   tpl: (a) => `ns.singularity.gymWorkout(${J(a[0])},${J(a[1])},${a[2] === true})` },
    universityCourse: { kind: "sing", base: 2,   tpl: (a) => `ns.singularity.universityCourse(${J(a[0])},${J(a[1])},${a[2] === true})` },
    travelToCity:     { kind: "sing", base: 2,   tpl: (a) => `ns.singularity.travelToCity(${J(a[0])})` },
    purchaseAugmentation: { kind: "sing", base: 5, tpl: (a) => `ns.singularity.purchaseAugmentation(${J(a[0])},${J(a[1])})` },
    purchaseTor:      { kind: "sing", base: 2,   tpl: () => `ns.singularity.purchaseTor()` },
    purchaseProgram:  { kind: "sing", base: 2,   tpl: (a) => `ns.singularity.purchaseProgram(${J(a[0])})` },
    upgradeHomeRam:   { kind: "sing", base: 3,   tpl: () => `ns.singularity.upgradeHomeRam()` },
    upgradeHomeCores: { kind: "sing", base: 3,   tpl: () => `ns.singularity.upgradeHomeCores()` },   // v2.5: fehlte
    stopAction:       { kind: "sing", base: 1,   tpl: () => `ns.singularity.stopAction()` },

    // ── Sleeve-Setter (WORK v2; SleeveBase 4 GB, KEIN SF4-Mult) ──────────────
    sleeveShockRecovery: { kind: "fix", base: 4, tpl: (a) => `ns.sleeve.setToShockRecovery(${a[0] | 0})` },
    sleeveSynchronize:   { kind: "fix", base: 4, tpl: (a) => `ns.sleeve.setToSynchronize(${a[0] | 0})` },
    sleeveCrime:         { kind: "fix", base: 4, tpl: (a) => `ns.sleeve.setToCommitCrime(${a[0] | 0},${J(a[1])})` },
    sleeveFactionWork:   { kind: "fix", base: 4, tpl: (a) => `ns.sleeve.setToFactionWork(${a[0] | 0},${J(a[1])},${J(a[2])})` },
    // v1.8 (WORK v5.0): Firmenarbeit fuer Sleeves. In BN8 ist nur der LOHN tot
    // (CompanyWorkMoney 0), der Firmen-Ruf laeuft voll (CompanyWorkRepGain
    // fehlt in BN8, steht also auf 1) — und 400.000 Firmen-Ruf schalten die
    // Konzern-Faktion frei. setToCompanyWork WIRFT, wenn schon ein anderer
    // Sleeve dort arbeitet (NetscriptFunctions/Sleeve.ts:126-137), deshalb
    // try/catch: ein Fehlversuch darf die RPC-Kette nicht abbrechen.
    sleeveCompanyWork:   { kind: "fix", base: 4, tpl: (a) => `(() => { try { return ns.sleeve.setToCompanyWork(${a[0] | 0},${J(a[1])}); } catch (e) { return false; } })()` },
    sleeveGym:           { kind: "fix", base: 4, tpl: (a) => `ns.sleeve.setToGymWorkout(${a[0] | 0},${J(a[1])},${J(a[2])})` },
    sleeveBladeAction:   { kind: "fix", base: 4, tpl: (a) => a.length > 2 ? `ns.sleeve.setToBladeburnerAction(${a[0] | 0},${J(a[1])},${J(a[2])})` : `ns.sleeve.setToBladeburnerAction(${a[0] | 0},${J(a[1])})` },
    sleeveTravel:        { kind: "fix", base: 4, tpl: (a) => `ns.sleeve.travel(${a[0] | 0},${J(a[1])})` },
    sleeveBuyAug:        { kind: "fix", base: 4, tpl: (a) => `ns.sleeve.purchaseSleeveAug(${a[0] | 0},${J(a[1])})` },

    // ── Spenden (WORK v5.1) ──────────────────────────────────────────────────
    // SingularityFn3 = 5 GB Basis (RamCostGenerator.ts:57, :195 SF4Cost).
    // Die Engine prueft selbst und gibt bei jedem Verstoss FALSE zurueck statt zu
    // werfen (Singularity.ts:925-963): kein Mitglied, Gang-Faktion, Faktion bietet
    // keine Arbeit an, Betrag <= 0, zu wenig Geld, zu wenig Favor. Der Aufrufer
    // muss den Rueckgabewert also wirklich pruefen - ein stilles false saehe
    // sonst genauso aus wie eine geglueckte Spende.
    donateToFaction:  { kind: "sing", base: 5, tpl: (a) => `ns.singularity.donateToFaction(${J(a[0])},${Math.floor(Number(a[1]) || 0)})` },
    // ── Sleeve KAUFEN (nur BitNode 10, Covenant-Kampagne) ────────────────────
    // getSleeveCost braucht nur checkSleeveAPIAccess (BN10 ODER SF10) und ist
    // damit ueberall abfragbar; purchaseSleeve verlangt checkBitNodeRequirement,
    // also strikt BitNode 10, und wirft sonst. Beide deshalb in try/catch, damit
    // ein Fehlversuch die RPC-Kette nicht abbricht.
    // Rueckgabe von purchaseSleeve ist ein Result-Objekt {success, message},
    // KEIN Boolean — der Aufrufer muss .success pruefen.
    sleeveCost:          { kind: "fix", base: 4, tpl: () => `(() => { try { return ns.sleeve.getSleeveCost(); } catch (e) { return null; } })()` },
    sleeveBuy:           { kind: "fix", base: 4, tpl: () => `(() => { try { return ns.sleeve.purchaseSleeve(); } catch (e) { return null; } })()` },

    // ── Börsen-Zugänge (BANK v-next; stock.* 2.5 GB fix) ─────────────────────
    buyWse:    { kind: "fix", base: 2.5, tpl: () => `ns.stock.purchaseWseAccount()` },
    buyTix:    { kind: "fix", base: 2.5, tpl: () => `ns.stock.purchaseTixApi()` },
    buy4SData: { kind: "fix", base: 2.5, tpl: () => `ns.stock.purchase4SMarketData()` },
    buy4SApi:  { kind: "fix", base: 2.5, tpl: () => `ns.stock.purchase4SMarketDataTixApi()` },

    // ── Corp-Gründung + Aktien-Handel (BANK; CorporationAction 20 GB fix) ─────
    createCorp:     { kind: "fix", base: 20, tpl: (a) => `ns.corporation.createCorporation(${J(a[0])},${a[1] !== false})` },
    corpBuyback:    { kind: "fix", base: 20, tpl: (a) => `(() => { try { ns.corporation.buyBackShares(${Number(a[0])}); return true; } catch (e) { return false; } })()` },   // v2.7: void -> true
    corpSellShares: { kind: "fix", base: 20, tpl: (a) => `(() => { try { ns.corporation.sellShares(${Number(a[0])}); return true; } catch (e) { return null; } })()` },   // v2.7: void -> true

    // ── Notausgang: freier Ausdruck (Kosten unbekannt -> voller Headroom) ────
    eval: { kind: "free", base: 0, tpl: (a) => String(a[0] || "null") },
};

// =============================================================================
// 3. ZUSTAND
// =============================================================================

const S = {
    gen: 0,                 // Snapshot-Generation (Prestige -> +1)
    lastPublish: 0,
    lastPrestigeChk: 0,
    lastNodeReset: 0,
    lastShop: 0,            // Sleeve-Kaufkatalog-Drossel
    blocks: {},             // name -> {ts, ok, data, err?}
    gewicht: null,          // v2.2: name -> JSON-Laenge in Zeichen (+ SUMME)
    due: {},                // name -> frühester nächster Lauf (Sweeps)
    rpcQueue: [],           // [{c,id,cmd,a,t,tries}]
    rpcRes: {},             // consumer -> id -> {ok,res|err,ts}
    rpcSeen: 0, rpcOk: 0, rpcErr: 0,
    sf4: 0, mult: 16, sing: false,
    feat: null,             // bitNodeFeatures-Kopie (Gates für blade/gang/corp)
    facs: [],               // player.factions (rep-Sweep)
    invites: [],            // letzte Einladungen (augs-Katalog-Umfang)
    augTmp: null,           // Zwischenspeicher der augs-Kette
};

// =============================================================================
// 4. HILFEN
// =============================================================================

/** Blockergebnis eintragen. Bei Fehler bleibt der letzte gute data-Stand. */
function setBlock(name, ok, dataOrErr) {
    const b = S.blocks[name] || {};
    if (ok) { b.ts = Date.now(); b.ok = true; b.data = dataOrErr; delete b.err; }
    else { b.ok = false; b.err = String(dataOrErr || "?"); }
    S.blocks[name] = b;
}

/** Laufzeitkosten eines Bündels/Kommandos in GB. */
function costGb(kind, base) {
    if (kind === "free") return EVAL_HEADROOM_GB;
    const raw = (kind === "sing") ? base * S.mult : base;
    return raw + EVAL_SCRIPT_BASE_GB;
}

/** Passt ein evalNs-Lauf JETZT auf den eigenen Host? (Guard vor jedem Start) */
function ramOk(ns, gb) {
    try {
        const me = ns.getHostname();
        return (ns.getServerMaxRam(me) - ns.getServerUsedRam(me)) >= gb;
    } catch (e) { return false; }
}

/** ownedSF normalisieren (Map | Array-von-Paaren | Objekt) -> {n: lvl}. */
function sfMap(ownedSF) {
    const m = {};
    try {
        if (!ownedSF) return m;
        if (ownedSF instanceof Map) { for (const [k, v] of ownedSF) m[k] = v; return m; }
        if (Array.isArray(ownedSF)) { for (const p of ownedSF) if (Array.isArray(p)) m[p[0]] = p[1]; return m; }
        if (typeof ownedSF === "object") { for (const k of Object.keys(ownedSF)) m[k] = ownedSF[k]; return m; }
    } catch (e) { /* leer */ }
    return m;
}

/** Snapshot auf Port 28 (peek) veröffentlichen (gedrosselt). */
// =============================================================================
// v2.2 — DIE WAAGE: WAS WIEGT WELCHER BLOCK?
// =============================================================================
// INFO_OUT ist mit Abstand das groesste JSON im Schwarm, und DIAG schreibt dazu
// nur "(gross)". Damit laesst sich nicht entscheiden, wo gekuerzt werden soll —
// man wuerde am falschen Ende schneiden. Also erst wiegen.
//
// GEMESSEN WIRD, WAS AUCH UEBERTRAGEN WIRD: die Laenge der JSON-Darstellung je
// Block, keine Schaetzung aus der Feldzahl. Das ist genau die Groesse, die der
// Port traegt und die jeder Leser durchparsen muss.
//
// NICHT JEDEN TAKT. Die Waage serialisiert zusaetzlich zum eigentlichen
// publish(); bei TICK_MS=400 waere das Messen teurer als das Gemessene. Alle
// WIEGE_MS reicht — Blockgroessen aendern sich langsam.
let gewichtAt = 0;
function wiege(now) {
    if (S.gewicht && now - gewichtAt < CFG.WIEGE_MS) return S.gewicht;
    gewichtAt = now;
    const g = {};
    let summe = 0;
    for (const k of Object.keys(S.blocks)) {
        let n = -1;
        try { n = JSON.stringify(S.blocks[k]).length; } catch (e) { n = -1; }
        g[k] = n;
        if (n > 0) summe += n;
    }
    g.SUMME = summe;
    S.gewicht = g;
    return g;
}

// =============================================================================
// v2.4 — DER TAKT RICHTET SICH NACH LAGE UND BEDARF
// =============================================================================
// Bisher lief jeder Block auf einem festen Planintervall, egal wie voll der
// Pool war und egal, ob ihn ueberhaupt jemand liest. Zwei Faktoren korrigieren
// das; sie werden MULTIPLIZIERT, nicht gegeneinander abgewogen.
//
// 1. LAGE (taktFaktor): ist der Pool knapp, wird seltener gesammelt. Die
//    Sweeps sind Singularity-Aufrufe, die als Wegwerf-Skripte RAM belegen —
//    genau das, was bei knappem Pool fehlt. Gelesen aus DISP_OUT (Port, 0 GB),
//    nicht selbst gemessen: der Dispatcher hat die Zahl ohnehin.
//
// 2. BEDARF (bedarfFaktor): steht der Daemon aus, der einen Block liest,
//    braucht es ihn nicht im Minutentakt.
//
// UND HIER DIE FALLE, DIE ICH MIR FAST SELBST GESTELLT HAETTE: Blocks GANZ
// abschalten waere falsch. daemonBereit() (HELPERS v5.10) entscheidet anhand
// GENAU DIESER Bloecke, ob ein Daemon eingeschaltet werden DARF — gang.member,
// blade.inDivision, augs.installed. Wer sie nicht mehr sammelt, weil der Daemon
// aus ist, macht die Entscheidung "unbekannt" und der Daemon geht NIE wieder
// an. Eine Katze, die sich in den Schwanz beisst.
//
// Deshalb wird nur VERLANGSAMT, nie abgeschaltet: SPAR_FAKTOR-mal seltener.
// Die Frage "darf der wieder an?" bleibt beantwortbar, nur eben gemaechlicher.
const SPAR_FAKTOR = 6;          // Daemon aus -> so viel seltener sammeln
const BLOCK_LESER = {           // welcher Daemon-Schalter haengt an welchem Block
    blade: "BLADEBURNER", gang: "GANGS", corp: "CORP",
    sleeves: "WORK", crime: "WORK", rep: "WORK",
};
// SCHWELLEN, UND WARUM SIE SO NIEDRIG SIND: dieser Schwarm faehrt den Pool
// ABSICHTLICH fast voll — 8 bis 10 Prozent frei sind der NORMALZUSTAND, nicht
// die Ausnahme. Eine Schwelle bei 15 % haette den Sparmodus zum Dauerzustand
// gemacht und INFO im Normalbetrieb halbiert, ohne dass je ein Engpass vorlag.
// Gebremst wird deshalb erst, wenn es wirklich eng ist.
const LAGE_KNAPP = 0.03;        // < 3 % frei  -> dreifaches Intervall
const LAGE_ENG   = 0.08;        // < 8 % frei  -> doppeltes Intervall
const LAGE_MS    = 15000;       // so lange gilt eine Messung

// EIN Lesevorgang je LAGE_MS, nicht je Block und Takt. intervall() laeuft bei
// TICK_MS=400 rund 30x je Sekunde ueber sieben Bloecke; ohne diesen Cache
// waeren das 30 Dateilesungen der Schalterdatei je Sekunde — die Messung waere
// teurer als alles, was sie einspart.
let lageAt = 0, lageCache = 1, bedarfCache = {};

function lageFrisch(ns) {
    const now = Date.now();
    if (now - lageAt < LAGE_MS) return;
    lageAt = now;
    let f = 1;
    try {
        const d = readOut(ns, SCHWARM_PORTS.DISP_OUT);
        const total = Number(d && d.totalGb);
        const frei = Number(d && d.poolLeftGb);
        if (isFinite(total) && total > 0 && isFinite(frei)) {
            const anteil = frei / total;
            f = anteil < LAGE_KNAPP ? 3 : (anteil < LAGE_ENG ? 2 : 1);
        }
    } catch (e) { f = 1; }
    lageCache = f;
    const neu = {};
    for (const k of Object.keys(BLOCK_LESER)) {
        try { neu[k] = isDaemonEnabled(ns, BLOCK_LESER[k]) ? 1 : SPAR_FAKTOR; }
        catch (e) { neu[k] = 1; }            // unbekannt -> nicht bremsen
    }
    bedarfCache = neu;
}

// v2.6: diese Bloecke laufen ueber intervall() (Hauptschleife, DIRECT) -
// fuer sie ist das wirksame Intervall das ehrliche Soll fuer DIAG.
const DIREKT_BLOECKE = ["player", "caps", "sleeves", "blade", "gang", "hacknet", "corp"];
/** v2.6: Plan je Block, fuer Direkt-Bloecke mit Lage- und Bedarfsfaktor. */
function wirksameIntervalle(ns) {
    const iv = {};
    for (const k of Object.keys(CFG.IV)) {
        iv[k] = DIREKT_BLOECKE.indexOf(k) >= 0 ? intervall(ns, k) : CFG.IV[k];
    }
    return iv;
}
/** Wirksames Intervall eines Blocks in ms. */
function intervall(ns, k) {
    lageFrisch(ns);
    const basis = CFG.IV[k] || 30000;
    return basis * lageCache * (bedarfCache[k] || 1);
}

function publish(ns, force = false) {
    const now = Date.now();
    if (!force && now - S.lastPublish < CFG.PUBLISH_MIN_MS) return;
    S.lastPublish = now;
    try {
        const h = ns.getPortHandle(SCHWARM_PORTS.INFO_OUT);
        h.clear();
        // v1.4: iv = die Planintervalle je Block. Damit kann jeder Leser (v. a. DIAG)
        // die Frische gegen die WIRKLICHEN Intervalle prüfen. Vorher musste ein
        // Prüfer sie raten — market läuft z. B. planmäßig nur alle 180 s, wurde
        // gegen eine geratene 30-s-Schwelle aber dauernd als "stale" gemeldet.
        // v2.2: w = Blockgroessen in Zeichen (siehe wiege()). Der Eintrag ist
        // selbst winzig — eine Zahl je Block — und macht die Frage "wo sitzt
        // das Gewicht?" von aussen beantwortbar.
        h.tryWrite(JSON.stringify({
            v: 1, gen: S.gen, ts: now, host: ns.getHostname(),
            blocks: S.blocks, iv: wirksameIntervalle(ns), w: wiege(now),   // v2.6
        }));
    } catch (e) { /* nächster Takt */ }
}

/** RPC-Ergebnisse auf Port 30 (peek) veröffentlichen + TTL-Aufräumen. */
function publishRpc(ns) {
    const now = Date.now();
    try {
        for (const c of Object.keys(S.rpcRes)) {
            for (const id of Object.keys(S.rpcRes[c])) {
                if (now - (S.rpcRes[c][id].ts || 0) > CFG.RPC_RESULT_TTL_MS) delete S.rpcRes[c][id];
            }
            if (Object.keys(S.rpcRes[c]).length === 0) delete S.rpcRes[c];
        }
        const h = ns.getPortHandle(SCHWARM_PORTS.INFO_RPC_RES);
        h.clear();
        h.tryWrite(JSON.stringify(S.rpcRes));
    } catch (e) { /* nächster Takt */ }
}

// =============================================================================
// 5. DIREKTE BLÖCKE (billig, synchron, try/catch je Block)
// =============================================================================

/** bn: BitNode-Steckbrief. Setzt außerdem S.sf4/S.mult/S.sing/S.feat. */
function collectBn(ns) {
    try {
        const ri = ns.getResetInfo();
        const bn = (ri && typeof ri.currentNode === "number") ? ri.currentNode : 0;
        const sf = sfMap(ri && ri.ownedSF);          // AKTIVE Source-Files
        const sf4 = Math.max(Number(sf[4] || sf["4"] || 0), bn === 4 ? 3 : 0);
        const mult = (bn === 4) ? 1 : (sf4 <= 1 ? 16 : (sf4 === 2 ? 4 : 1));
        const feat = bitNodeFeatures(ns);            // Gates + hashesWorthless
        let mults = null, multsSource = "none";
        try { mults = ns.getBitNodeMultipliers(); multsSource = "live"; }
        catch (e) { /* kein SF5 -> v1.1-Tabelle folgt */ }

        // =====================================================================
        // v1.7 — DER BLOCK KONNTE SEINEN EIGENEN WERT NIE ERFAHREN
        // =====================================================================
        // feat.hashesWorthless kommt aus computeHashesWorthless, und das liest
        // seit HELPERS v4.6 den Multiplikator HacknetNodeMoney — AUS DIESEM
        // BLOCK. Der "bn"-Block ist aber statisch: er wird genau einmal beim
        // Start gebaut. Beim ersten (und einzigen) Durchlauf existiert er noch
        // nicht, die Stufe faellt durch, es bleibt bei der Knotenmessung — und
        // ohne Knoten lautet die konservative Antwort "nicht wertlos".
        // Danach steht das im Block und aendert sich nie wieder.
        //
        // Folge: der Bericht zeigte in BN8 dauerhaft "hashesWorthless: nein",
        // obwohl HacknetNodeMoney = 0 zwei Zeilen darunter stand.
        //
        // Hier ist der Wert aber schon da: mults wurde eben geholt. Also wird
        // er direkt daraus gebildet, ohne Umweg ueber den eigenen Block.
        // Dieselbe Zahl, die die Engine einsetzt (HacknetNodes.ts:10,
        // HacknetServers.ts:16). Fehlt sie (kein SF5), bleibt es bei der
        // Messung aus bitNodeFeatures.
        const hashesWertlos = (mults && typeof mults.HacknetNodeMoney === "number")
            ? mults.HacknetNodeMoney === 0
            : !!feat.hashesWorthless;

        S.sf4 = sf4; S.mult = mult; S.sing = sf4 > 0;
        S.lastNodeReset = (ri && ri.lastNodeReset) || 0;
        // v1.7: Den korrigierten Wert auch in S.feat legen — der hacknet-Block
        // (und alles andere, was S.feat liest) haengt sonst weiter am alten.
        feat.hashesWorthless = hashesWertlos;
        S.feat = feat;
        setBlock("bn", true, {
            bitNode: bn, sf, sf4, sf4Mult: mult,
            lastNodeReset: S.lastNodeReset,
            options: (ri && ri.bitNodeOptions) || {},
            features: {
                bladeburner: !!feat.bladeburner, corporation: !!feat.corporation,
                gang: !!feat.gang, grafting: !!feat.grafting, sleeves: !!feat.sleeves,
                hacknetServer: !!feat.hacknetServer, hashesWorthless: hashesWertlos,
            },
            mults, multsSource,
        });
    } catch (e) { setBlock("bn", false, e); }
}

/** player: Kernwerte inkl. Karma (heart.break: 0 GB). */
function collectPlayer(ns) {
    try {
        const p = ns.getPlayer();
        let karma = 0;
        try { karma = ns.heart.break(); } catch (e) { /* 0 */ }
        S.facs = Array.isArray(p.factions) ? p.factions.slice() : [];
        setBlock("player", true, {
            money: p.money, skills: p.skills, exp: p.exp, factions: S.facs,
            city: p.city, location: p.location, hp: p.hp, karma,
            numPeopleKilled: p.numPeopleKilled, jobs: p.jobs || {},
            entropy: p.entropy || 0,
            // v2.0: der Faktions-Ruf-Multiplikator des SPIELERS (aus Augmentierungen).
            // Nicht zu verwechseln mit dem BitNode-Multiplikator FactionWorkRepGain
            // im bn-Block - beide gehen in dieselbe Formel ein:
            //     repFromDonation = amt/1e6 * mults.faction_rep * FactionWorkRepGain
            //     (Faction/formulas/donation.ts:8-10, DonateMoneyToRepDivisor = 1e6)
            // Ohne diesen Wert muesste WORK beim Spenden mit 1 rechnen und wuerde
            // bei einem Multiplikator von 1,5 rund 50 % zu viel Geld ueberweisen.
            // Kostet nichts: p stammt aus dem ohnehin geholten ns.getPlayer().
            factionRepMult: (p.mults && typeof p.mults.faction_rep === "number")
                ? p.mults.faction_rep : null,
        });
    } catch (e) { setBlock("player", false, e); }
}

/** caps: billige Zugriffs-Flags (Börse, TOR). */
function collectCaps(ns) {
    try {
        const d = { WSE: false, TIX: false, FOURS: false, FOURSUI: false, DARKWEB: false };
        try { d.WSE = ns.stock.hasWseAccount(); } catch (e) { /* false */ }
        try { d.TIX = ns.stock.hasTixApiAccess(); } catch (e) { /* false */ }
        try { d.FOURS = ns.stock.has4SDataTixApi(); } catch (e) { /* false */ }
        try { d.FOURSUI = ns.stock.has4SData(); } catch (e) { /* false */ }
        try { d.DARKWEB = ns.hasTorRouter(); } catch (e) { /* false */ }
        setBlock("caps", true, d);
    } catch (e) { setBlock("caps", false, e); }
}

/** sleeves: Zustände je Sleeve; Kauf-Katalog gedrosselt (SHOP_IV_MS). */
function collectSleeves(ns) {
    try {
        let n = 0;
        try { n = ns.sleeve.getNumSleeves(); } catch (e) { n = 0; }
        const prev = (S.blocks.sleeves && S.blocks.sleeves.data) || {};
        const d = { n, list: [], shop: prev.shop || {} };
        for (let i = 0; i < n; i++) {
            try {
                const s = ns.sleeve.getSleeve(i);
                let task = null;
                try { task = ns.sleeve.getTask(i); } catch (e) { /* null */ }
                d.list.push({
                    i, shock: s.shock, sync: s.sync, city: s.city,
                    // v1.9: companyName und factionWorkType kamen dazu.
                    //
                    // Beide fehlten, weil es vor WORK v5.0 keine Firmenarbeit fuer
                    // Sleeves gab. Das war nicht nur eine Luecke im Bericht ("FIRMA ?"),
                    // sondern kostete jeden Takt Aufrufe: applySleeveRole prueft
                    //     if (t && t.type === "COMPANY" && t.companyName === firma)
                    // um einen Sleeve, der schon dort arbeitet, NICHT anzufassen.
                    // Ohne das Feld ist der Vergleich immer falsch, und jeder
                    // Firmen-Sleeve wurde jeden Takt neu gesetzt - acht ueberfluessige
                    // RPC-Aufrufe alle 20 Sekunden.
                    //
                    // Die Engine liefert beide Felder laengst (SleeveCompanyWork.APICopy
                    // gibt companyName, SleeveFactionWork.APICopy gibt factionWorkType).
                    // Reine Datenfelder, kein RAM-Effekt.
                    skills: s.skills, task: task ? {
                        type: task.type, factionName: task.factionName,
                        factionWorkType: task.factionWorkType,
                        companyName: task.companyName,
                        crimeType: task.crimeType, actionType: task.actionType,
                        actionName: task.actionName,
                    } : null,
                });
            } catch (e) { /* Sleeve überspringen */ }
        }
        const now = Date.now();
        if (n > 0 && now - S.lastShop >= CFG.SHOP_IV_MS) {
            S.lastShop = now;
            d.shop = {};
            for (let i = 0; i < n; i++) {
                try {
                    const augs = ns.sleeve.getSleevePurchasableAugs(i) || [];
                    d.shop[i] = augs.map(a => ({ name: a.name, cost: a.cost }));
                } catch (e) { d.shop[i] = []; }
            }
        }
        setBlock("sleeves", true, d);
    } catch (e) { setBlock("sleeves", false, e); }
}

/** blade: Rang/Stamina/Chaos/Contract-Restzahlen (nur wenn Feature + Division). */
function collectBlade(ns) {
    try {
        if (S.feat && !S.feat.bladeburner) { setBlock("blade", true, { inDivision: false, gated: true }); return; }
        let inDiv = false;
        try { inDiv = ns.bladeburner.inBladeburner(); } catch (e) { inDiv = false; }
        if (!inDiv) { setBlock("blade", true, { inDivision: false }); return; }
        const d = { inDivision: true };
        try { d.rank = ns.bladeburner.getRank(); } catch (e) { /* fehlt */ }
        try { const st = ns.bladeburner.getStamina(); d.stamina = [st[0], st[1]]; } catch (e) { /* fehlt */ }
        try { d.city = ns.bladeburner.getCity(); } catch (e) { /* fehlt */ }
        try { if (d.city) d.chaos = ns.bladeburner.getCityChaos(d.city); } catch (e) { /* fehlt */ }
        try { d.skillPoints = ns.bladeburner.getSkillPoints(); } catch (e) { /* fehlt */ }
        // v1.1: nächste BlackOp fürs ENDGAME-Panel (Dashboard). {name, rank}
        // oder null = alle BlackOps erledigt. +2 GB statisch (BladeApiBase/2).
        try { d.nextBlackOp = ns.bladeburner.getNextBlackOp(); } catch (e) { /* fehlt */ }
        // v1.2: ERFOLGSCHANCE der naechsten BlackOp mitliefern.
        //
        // Ohne sie meldete DIAG jede rangseitig erreichbare BlackOp als "prüfen,
        // ob der Daemon sie startet" — und lag damit dauerhaft falsch: der Rang
        // ist nur EINE von mehreren Bedingungen. Live war Operation Typhoon bei
        // Rang 6676 von 2500 erreichbar, die geschaetzte Erfolgschance lag aber
        // bei 19 % bis 32 %. Der Daemon liess sie also voellig zu Recht liegen.
        // getActionEstimatedSuccessChance liefert [min, max] — die Spanne ist
        // die Unsicherheit aus fehlender Aufklaerung.
        if (d.nextBlackOp && d.nextBlackOp.name) {
            try {
                const ch = ns.bladeburner.getActionEstimatedSuccessChance("Black Operations", d.nextBlackOp.name);
                if (Array.isArray(ch) && ch.length === 2) d.nextBlackOp.chance = [ch[0], ch[1]];
            } catch (e) { /* ohne Chance bleibt der Befund still */ }
        }
        // v2.1 — CHRONIK DER BLACKOPS. Nicht nur "was kommt als naechstes",
        // sondern der ganze Weg: was ist geschafft, was steht noch aus, und ab
        // welchem Rang.
        //
        // WOZU. Ein einzelner Blick auf "naechste BlackOp" sagt nichts darueber,
        // ob der Daemon VORANKOMMT. Erst die Liste zeigt, ob seit Stunden
        // dieselbe Operation ansteht oder ob er sie der Reihe nach abarbeitet —
        // und genau das war die Frage, bevor irgendjemand einen laufenden
        // Daemon "repariert".
        //
        // getActionCountRemaining liefert fuer BlackOps 1 (offen) oder 0
        // (erledigt); die Funktion ist unten fuer Contracts ohnehin geladen,
        // kostet hier also nichts zusaetzlich.
        try {
            d.blackOps = [];
            for (const n of ns.bladeburner.getBlackOpNames()) {
                const e = { n };
                try { e.r = ns.bladeburner.getBlackOpRank(n); } catch (err) { /* ohne Rang */ }
                try { e.o = ns.bladeburner.getActionCountRemaining("Black Operations", n); }
                catch (err) { /* ohne Stand */ }
                d.blackOps.push(e);
            }
        } catch (e) { /* ohne Chronik weiter */ }
        try {
            d.contracts = {};
            for (const c of ns.bladeburner.getContractNames()) {
                try { d.contracts[c] = ns.bladeburner.getActionCountRemaining("Contracts", c); }
                catch (e) { /* Contract überspringen */ }
            }
        } catch (e) { /* fehlt */ }
        setBlock("blade", true, d);
    } catch (e) { setBlock("blade", false, e); }
}

/** gang: Mitgliedschaft + Kernkennzahlen. */
function collectGang(ns) {
    try {
        if (S.feat && !S.feat.gang) { setBlock("gang", true, { member: false, gated: true }); return; }
        let inG = false;
        try { inG = ns.gang.inGang(); } catch (e) { inG = false; }
        if (!inG) { setBlock("gang", true, { member: false }); return; }
        const g = ns.gang.getGangInformation();
        setBlock("gang", true, {
            member: true,
            faction: g.faction, isHacking: g.isHacking, respect: g.respect,
            power: g.power, territory: g.territory, territoryClashChance: g.territoryClashChance,
            wantedLevel: g.wantedLevel, wantedPenalty: g.wantedPenalty,
            moneyGainRate: g.moneyGainRate, respectGainRate: g.respectGainRate,
        });
    } catch (e) { setBlock("gang", false, e); }
}

/** hacknet: Bestand + Produktion + Hash-Stand. */
function collectHacknet(ns) {
    try {
        const n = ns.hacknet.numNodes();
        let production = 0;
        for (let i = 0; i < n; i++) {
            try { production += ns.hacknet.getNodeStats(i).production || 0; } catch (e) { /* skip */ }
        }
        let hashes = null, capacity = null;
        try { hashes = ns.hacknet.numHashes(); } catch (e) { /* Nodes ohne Hashes */ }
        try { capacity = ns.hacknet.hashCapacity(); } catch (e) { /* dito */ }
        setBlock("hacknet", true, {
            nodes: n, production, hashes, capacity,
            hashesWorthless: !!(S.feat && S.feat.hashesWorthless),
        });
    } catch (e) { setBlock("hacknet", false, e); }
}

/** corp: Existenz + Kern von getCorporation (Konsument: BANK/DASHBOARD). */
function collectCorp(ns) {
    try {
        let exists = false;
        try { exists = ns.corporation.hasCorporation(); } catch (e) { exists = false; }
        if (!exists) { setBlock("corp", true, { exists: false }); return; }
        const c = ns.corporation.getCorporation();
        setBlock("corp", true, {
            exists: true, name: c.name, funds: c.funds,
            revenue: c.revenue, expenses: c.expenses, public: !!c.public,
            totalShares: c.totalShares, numShares: c.numShares,
            issuedShares: c.issuedShares, shareSaleCooldown: c.shareSaleCooldown,
            dividendRate: c.dividendRate, divisions: c.divisions || [],
        });
    } catch (e) { setBlock("corp", false, e); }
}

// =============================================================================
// 6. SINGULARITY-SWEEPS (evalNs-Bündel; nur mit SF4)
// =============================================================================
//
// Jeder Sweep: Kosten-Guard -> evalNs -> setBlock. Rückgabe true = fertig
// (Intervall neu setzen), false = Fehler (früherer Neuversuch). Die augs-Kette
// macht MEHRERE evalNs nacheinander (A: Katalog+Preis, B: RepReq+Stats,
// C: owned) — größtes Einzelbündel ≤ (5+2.5)×16+2 = 122 GB bei SF4 L1.

async function sweepWork(ns) {
    const cost = costGb("sing", SING_GB.cWork + SING_GB.cInvites);
    if (!ramOk(ns, cost)) return false;
    const r = await evalNs(ns,
        "(()=>({work:ns.singularity.getCurrentWork()," +
        "inv:ns.singularity.checkFactionInvitations()}))()");
    if (!r || typeof r !== "object") { setBlock("work", false, "EVAL_NULL"); return false; }
    S.invites = Array.isArray(r.inv) ? r.inv : [];
    setBlock("work", true, { currentWork: r.work || null, invitations: S.invites });
    return true;
}

async function sweepRep(ns) {
    if (S.facs.length === 0) { setBlock("rep", true, {}); return true; }
    const cost = costGb("sing", SING_GB.cFacRep + SING_GB.cFacFavor);
    if (!ramOk(ns, cost)) return false;
    const r = await evalNs(ns,
        `(()=>{const F=${J(S.facs)};const o={};for(const f of F){` +
        `o[f]={rep:ns.singularity.getFactionRep(f),favor:ns.singularity.getFactionFavor(f)};}` +
        `return o;})()`);
    if (!r || typeof r !== "object") { setBlock("rep", false, "EVAL_NULL"); return false; }
    setBlock("rep", true, r);
    return true;
}

/** augs-Kette: Katalog über beigetretene + eingeladene Faktionen. */
async function sweepAugs(ns) {
    const facs = Array.from(new Set([...S.facs, ...S.invites]));
    if (facs.length === 0) { setBlock("augs", true, { owned: [], catalog: {} }); return true; }

    // A: je Faktion Aug-Liste + Preis
    const costA = costGb("sing", SING_GB.cAugsFromFac + SING_GB.cAugPrice);
    if (!ramOk(ns, costA)) return false;
    const a = await evalNs(ns,
        `(()=>{const F=${J(facs)};const o={};for(const f of F){` +
        `try{const L=ns.singularity.getAugmentationsFromFaction(f);` +
        `o[f]=L.map(x=>({name:x,price:ns.singularity.getAugmentationPrice(x)}));}` +
        `catch(e){o[f]=[];}}return o;})()`, [], 15000);
    if (!a || typeof a !== "object") { setBlock("augs", false, "EVAL_NULL_A"); return false; }

    // B: je EINZIGARTIGEM Aug RepReq + Stats
    const names = Array.from(new Set(Object.values(a).flat().map(x => x.name)));
    // v2.3: cAugStats faellt weg — getAugmentationStats wird nicht mehr
    // aufgerufen. Das spart nicht nur Uebertragung, sondern auch Singularity-RAM
    // im Sweep selbst (Basis x sf4Mult).
    const costB = costGb("sing", SING_GB.cAugRepReq);
    if (!ramOk(ns, costB)) { setBlock("augs", false, "NO_RAM_B"); return false; }
    const b = await evalNs(ns,
        `(()=>{const N=${J(names)};const o={};for(const n of N){` +
        `try{o[n]={repReq:ns.singularity.getAugmentationRepReq(n)};}catch(e){o[n]=null;}}` +
        `return o;})()`, [], 15000);
    if (!b || typeof b !== "object") { setBlock("augs", false, "EVAL_NULL_B"); return false; }

    // C: eigene Augs — ZWEI Listen in EINEM eval:
    //   owned     = getOwnedAugmentations(true)  -> installiert UND gekauft-nicht-installiert
    //   installed = getOwnedAugmentations(false) -> nur wirklich installiert
    // Die Unterscheidung ist nicht kosmetisch: die Engine prüft an mehreren Stellen
    // hasAugmentation(name, ignoreQueued=true), also NUR installiert. Beispiel
    // Bladeburner.process(): ohne INSTALLIERTES BladesSimulacrum wird jede Aktion
    // abgebrochen, sobald Player.currentWork gesetzt ist — ein gekauftes, noch nicht
    // installiertes Aug hilft dort NICHT. Ebenso braucht die Reset-Logik die Zahl der
    // gekauften-nicht-installierten Augs (= owned minus installed).
    // Statische RAM-Kosten bleiben gleich: es ist dieselbe Funktion, nur zweimal
    // aufgerufen (RAM wird pro Funktion berechnet, nicht pro Aufruf).
    const costC = costGb("sing", SING_GB.cOwnedAugs);
    if (!ramOk(ns, costC)) { setBlock("augs", false, "NO_RAM_C"); return false; }
    const oa = await evalNs(ns,
        "(() => { try { return { owned: ns.singularity.getOwnedAugmentations(true), " +
        "installed: ns.singularity.getOwnedAugmentations(false) }; } catch (e) { return null; } })()");
    if (!oa || !Array.isArray(oa.owned)) { setBlock("augs", false, "EVAL_NULL_C"); return false; }
    const owned = oa.owned;
    const installed = Array.isArray(oa.installed) ? oa.installed : [];

    // =====================================================================
    // v2.3 — DER KATALOG TRUG 85 % DES GANZEN SNAPSHOTS, UND ZWAR UMSONST
    // =====================================================================
    // GEMESSEN (INFO v2.2 wiegt seit heute): der augs-Block war 107.0k von
    // 125.4k Zeichen — 85.3 %. Jeder Leser parste das bei JEDEM Zugriff mit.
    //
    // WOHER DAS GEWICHT KAM: `b` ist bereits je EINZIGARTIGEM Aug aufgebaut.
    // Diese Schleife hat es danach je FAKTION wieder auseinandergezogen — und
    // die meisten Augs bieten drei bis acht Faktionen an. `stats` ist dabei mit
    // rund 30 Multiplikatoren je Aug der dickste Teil und stand damit
    // mehrfach da.
    //
    // UND NIEMAND HAT ES GELESEN. Gesucht wurde im ganzen Schwarm:
    //   BANK  Z2711 ff.  -> name, price, repReq
    //   WORK  Z1819      -> name
    //   WORK  Z1994 ff.  -> name, price  ("v3.5: Rangfolge nach PREIS statt
    //                       nach Stat-Wert", damit Rep-Grind und Kauf in
    //                       dieselbe Richtung ziehen)
    // `stats` kommt in keinem Verbraucher vor. Die einzige Funktion, die es
    // auswerten wuerde — scoreAugStats() in HELPERS — wird NIRGENDS aufgerufen;
    // sie steht nur noch in Kommentaren. (Der Kommentar dort, AUGS importiere
    // sie, stimmt nicht mehr.)
    //
    // Deshalb faellt stats hier ersatzlos weg. Kein Verbraucher aendert sich,
    // kein Feld wird umbenannt — die Form des Katalogs bleibt exakt gleich.
    const catalog = {};
    for (const f of Object.keys(a)) {
        catalog[f] = a[f].map(x => ({
            name: x.name, price: x.price,
            repReq: b[x.name] ? b[x.name].repReq : null,
        }));
    }
    setBlock("augs", true, { owned, installed, catalog, facs });
    return true;
}

async function sweepMarket(ns) {
    const cost = costGb("sing",
        SING_GB.cDwProgs + SING_GB.cDwCost + SING_GB.cHomeRam);
    if (!ramOk(ns, cost)) return false;
    const r = await evalNs(ns,
        "(()=>{const o={programs:[],homeRamCost:null};" +
        "try{const P=ns.singularity.getDarkwebPrograms();" +
        "o.programs=P.map(p=>({name:p,cost:ns.singularity.getDarkwebProgramCost(p)}));}catch(e){}" +
        "try{o.homeRamCost=ns.singularity.getUpgradeHomeRamCost();}catch(e){}" +
        "return o;})()");
    if (!r || typeof r !== "object") { setBlock("market", false, "EVAL_NULL"); return false; }
    setBlock("market", true, r);
    return true;
}

async function sweepCrime(ns) {
    const cost = costGb("sing", SING_GB.cCrimeChance + SING_GB.cCrimeStats);
    if (!ramOk(ns, cost)) return false;
    const r = await evalNs(ns,
        `(()=>{const C=${J(CRIMES)};const o={};for(const c of C){` +
        `try{o[c]={chance:ns.singularity.getCrimeChance(c),` +
        `stats:ns.singularity.getCrimeStats(c)};}catch(e){o[c]=null;}}` +
        `return o;})()`, [], 15000);
    if (!r || typeof r !== "object") { setBlock("crime", false, "EVAL_NULL"); return false; }
    setBlock("crime", true, r);
    return true;
}

const SWEEPS = { work: sweepWork, rep: sweepRep, augs: sweepAugs, market: sweepMarket, crime: sweepCrime };

// =============================================================================
// 7. RPC-ABARBEITUNG
// =============================================================================

/** Port 29 leeren -> Queue (Dedupe: gleiches c/id ersetzt den alten Auftrag). */
function drainRpc(ns) {
    try {
        const h = ns.getPortHandle(SCHWARM_PORTS.INFO_IN);
        for (let i = 0; i < CFG.RPC_DRAIN_MAX; i++) {
            if (h.empty()) break;
            const raw = h.read();
            let req = null;
            try { req = JSON.parse(raw); } catch (e) { continue; }
            if (!req || !req.c || !req.id || !req.cmd) continue;
            req.tries = 0;
            const idx = S.rpcQueue.findIndex(q => q.c === req.c && q.id === req.id);
            if (idx >= 0) S.rpcQueue[idx] = req; else S.rpcQueue.push(req);
            S.rpcSeen++;
        }
    } catch (e) { /* nächster Takt */ }
}

function rpcResult(c, id, ok, val) {
    if (!S.rpcRes[c]) S.rpcRes[c] = {};
    S.rpcRes[c][id] = ok ? { ok: true, res: val, ts: Date.now() }
                         : { ok: false, err: String(val), ts: Date.now() };
    if (ok) S.rpcOk++; else S.rpcErr++;
}

/** Ältesten Auftrag ausführen. true = einer bearbeitet (auch bei Fehler). */
async function runRpc(ns) {
    const req = S.rpcQueue[0];
    if (!req) return false;
    const def = RPC_CMDS[req.cmd];
    if (!def) { S.rpcQueue.shift(); rpcResult(req.c, req.id, false, "UNKNOWN_CMD"); return true; }
    if (def.kind === "sing" && !S.sing) { S.rpcQueue.shift(); rpcResult(req.c, req.id, false, "NO_SING"); return true; }

    const cost = costGb(def.kind, def.base);
    if (!ramOk(ns, cost)) {
        req.tries = (req.tries || 0) + 1;
        if (req.tries >= CFG.RPC_MAX_TRIES) { S.rpcQueue.shift(); rpcResult(req.c, req.id, false, "NO_RAM"); return true; }
        return false;   // im nächsten Takt erneut (Auftrag bleibt vorn)
    }
    S.rpcQueue.shift();
    let code = null;
    try { code = def.tpl(Array.isArray(req.a) ? req.a : []); }
    catch (e) { rpcResult(req.c, req.id, false, "BAD_ARGS"); return true; }
    // v4.0: MIT GRUND. Vorher stand hier evalNs(), das bei Zeitueberschreitung,
    // fehlendem RAM, API-Fehler UND "die API lieferte wirklich null" dasselbe
    // null zurueckgab — im Report war dann eine lange Kette EVAL_NULL zu sehen,
    // aus der niemand ablesen konnte, was eigentlich los war.
    const r = await evalNsDetailed(ns, code, [], 15000);
    if (!r.ok) rpcResult(req.c, req.id, false, r.err ? `${r.reason}: ${r.err}` : r.reason);
    else rpcResult(req.c, req.id, true, r.value);
    return true;
}

// =============================================================================
// 8. HAUPTSCHLEIFE
// =============================================================================

/** @param {NS} ns */
// =============================================================================
// 7b. FEHLER-CHRONIK (v1.3)                                    [Datei, kein Port]
// =============================================================================
//
// ZWECK. Der Spieler bekommt einen Fehler nur mit, wenn er im richtigen Moment
// auf das richtige Tail schaut. Ein abgestuerztes Skript ist danach spurlos weg.
// Diese Chronik schreibt beides fortlaufend in eine Datei JE BITNODE, damit man
// nach einer Aenderung nachlesen kann, ob sie gewirkt hat.
//
// WAS SIE ERFASST:
//   1. ABGESTUERZTE Prozesse. ns.getRecentScripts() liefert die Logs von
//      Skripten, die nicht mehr laufen (RecentScript erweitert RunningScript um
//      timeOfDeath; logs ist dort string[], NetscriptDefinitions.d.ts:265).
//      Das ist die eigentliche Luecke: ein Absturz um 03:12 ist um 09:00 nicht
//      mehr rekonstruierbar.
//   2. LAUFENDE SCHWARM-Daemons. ns.getScriptLogs kostet 0 GB
//      (RamCostGenerator.ts:588), das Absammeln ist praktisch gratis.
//
// WAS SIE NICHT KANN, und das ist eine harte Grenze:
//   Die BROWSER-KONSOLE. Meldungen der Engine selbst (React, EnumHelper und so
//   weiter) gehen an die Devtools und sind fuer Netscript unerreichbar — es gibt
//   dafuer keine API. Wer so etwas sucht, muss weiter F12 druecken.
//
// KOSTEN. getRecentScripts 0.2 GB, ps 0.2 GB, scan 0.2 GB, getScriptLogs/read/
// write je 0 GB. Zusammen 0.6 GB — deshalb haengt das hier an INFO und braucht
// keinen eigenen Daemon.
//
// WARUM NUR "SCHWARM-"-DATEIEN. Die Worker (schwarm-wl.js, klein geschrieben)
// laufen in Hunderttausenden Instanzen. Ein getScriptLogs je Instanz waere zwar
// RAM-frei, wuerde aber den Takt sprengen. Der Praefix-Filter schliesst sie aus;
// Daemons beginnen alle mit "SCHWARM-".

const CHRONIK = {
    IV_MS: 15_000,             // Sammeltakt
    HOSTS_IV_MS: 120_000,      // Hostliste neu aufbauen
    WIEDERHOLUNG_MS: 600_000,  // dieselbe Meldung fruehestens wieder nach 10 min
    MAX_ZEILEN: 4000,          // Deckel; darueber wird in der MITTE gekuerzt
    LOG_TIEFE: 60,             // wie viele Log-Zeilen je Skript angeschaut werden
    datei: "",
    faellig: 0,
    hostsFaellig: 0,
    hosts: ["home"],
    gesehen: new Map(),        // Fingerabdruck -> {n, gemeldet}
    todStand: 0,               // juengster bereits verarbeiteter timeOfDeath
    puffer: [],
    geschrieben: 0,
};

// =============================================================================
// v1.6 — WAS ALS FEHLER GILT, UND WAS AUSDRUECKLICH NICHT
// =============================================================================
// Der erste Lauf hat die Chronik geflutet: von rund fuenfzig Eintraegen waren
// vielleicht fuenf echte Fehler. Die Ursachen, alle am gelieferten Protokoll
// abgelesen:
//
//   1. "/i" liess ABGELEHNT auch auf "abgelehnt" greifen. DARKNET meldet
//      "Ohne Session (scp/exec werden abgelehnt)" im Sekundentakt als
//      NORMALBETRIEB, und der TRADER schreibt "abgelehnt: Amortisation 23,
//      zu klein 40" in jede Statistikzeile. Das war der groesste Einzelposten.
//   2. "WARN" greift auf INFILs "Warnung: 10/10 HP, ein Fehlschlag kostet
//      bis zu 8" — eine Info, kein Fehler.
//   3. Jedes Prozessende wurde vermerkt. BACKDOOR, DIAG, AUGS, ARSENAL und
//      STANEK-LADER sind Einmal-Laeufe; ihr Ende ist der Normalfall.
//
// DESHALB ZWEISTUFIG: erst muss ein Muster GREIFEN, dann darf kein
// Ausschlussmuster zutreffen. Die Ausschlussliste ist der wichtigere Teil —
// eine Chronik, die man nicht mehr liest, ist so nutzlos wie gar keine.
//
// Gross-/Kleinschreibung zaehlt jetzt bei den Schluesselwoertern: SCHWARM
// schreibt echte Fehler durchgehend gross (ERROR, WARN, FEHLER, ABGELEHNT),
// waehrend beilaeufige Erwaehnungen klein geschrieben sind. Genau diese
// Unterscheidung ging mit "/i" verloren.
const CHRONIK_MUSTER = /(ERROR|FEHLER|FEHL |WARN[: ]|WARN$|Exception|RUNTIME|ABGELEHNT|SYNTAX|Traceback|is not a function|undefined is not|NO_RAM|UNKNOWN_CMD|Kein Layout berechenbar|abgestuerzt|Fehler|nicht startbar|\bNaN\b)/;
// Nachtrag v1.6: "Fehler" (gross) und "nicht startbar" kamen dazu, weil DARKNET
// seine echten Ausfaelle so meldet — "Labyrinth ... [Fehler] ... You feel
// disconnected" und "Laeufer nicht startbar (~4.5 GB noetig)". Beide waeren
// sonst durchgerutscht; der Pruefstand hat sie gefangen. "Fehlschlag" (INFILs
// harmloser Hinweis) trifft das Muster weiterhin NICHT.

// Was trotz Treffer NICHT in die Chronik gehoert. Reihenfolge egal, alles
// case-insensitiv — hier ist Grosszuegigkeit richtig, weil ein Fehlalarm
// teurer ist als eine uebersehene Randnotiz.
const CHRONIK_AUSNAHMEN = [
    /Ohne Session \(scp\/exec werden abgelehnt\)/i,   // DARKNET-Normalbetrieb
    /abgelehnt: Amortisation/i,                       // TRADER-Statistikzeile
    /\[INFIL\] Warnung: \d+\/\d+ HP/i,                // INFIL-Hinweis, kein Fehler
    /Passwort unbekannt/i,                            // DARKNET: noch nicht geknackt
    /connectToSession abgelehnt/i,                    // dito
    /SCHWARM-DISPATCHER v/i,                          // Statusbanner je Runde
    /Signale \d+ -> Kandidaten/i,                     // TRADER-Statusbanner
];

/** true, wenn die Zeile in die Chronik gehoert. */
function chronikRelevant(zeile) {
    if (!CHRONIK_MUSTER.test(zeile)) return false;
    for (let i = 0; i < CHRONIK_AUSNAHMEN.length; i++) {
        if (CHRONIK_AUSNAHMEN[i].test(zeile)) return false;
    }
    return true;
}

// Einmal-Laeufe: ihr Ende ist der Normalfall und wird NICHT vermerkt. Stirbt
// einer von ihnen mit einer Fehlerzeile im Log, kommt die trotzdem durch — nur
// das blosse "Prozess beendet" entfaellt.
const CHRONIK_EINMAL = ["SCHWARM-BACKDOOR.js", "SCHWARM-DIAG.js", "SCHWARM-AUGS.js",
    "SCHWARM-ARSENAL.js", "SCHWARM-GENESIS.js", "SCHWARM-RESET.js",
    "SCHWARM-STANEK-LADER.js", "SCHWARM-STANEK.js", "SCHWARM-INFIL.js"];

/** Dateiname je BitNode — beim Wechsel entsteht automatisch eine neue Chronik. */
function chronikDatei(bn) {
    return "SCHWARM-CHRONIK-BN" + (bn === 0 || bn ? bn : "X") + ".txt";
}

/** BitNode-Nummer aus dem eigenen Snapshot. */
function chronikBn() {
    const b = S.blocks && S.blocks.bn;
    const n = b && b.data ? b.data.bitNode : null;
    return (typeof n === "number") ? n : "X";
}

function chronikZeit(ms) {
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate())
        + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

/**
 * Fingerabdruck einer Meldung. Zeitstempel und Zahlen werden herausgerechnet,
 * damit "Portfolio-Wert ist NEGATIV ($-206420)" und dieselbe Meldung mit
 * "($-362739)" als EIN Eintrag gelten — sonst waere die Chronik nach einer
 * Stunde unlesbar.
 */
function chronikFinger(quelle, zeile) {
    return quelle + "|" + String(zeile)
        .replace(/\[[^\]]*\]/g, "")
        .replace(/[0-9]+/g, "#")
        .replace(/\s+/g, " ")
        .trim().slice(0, 160);
}

/**
 * Eine Zeile aufnehmen. Erstauftritt kommt sofort in den Puffer; Wiederholungen
 * werden nur gezaehlt und hoechstens alle WIEDERHOLUNG_MS mit Zaehler gemeldet.
 * @param {string} quelle   Skript@Host oder Skript [beendet]
 * @param {string} zeile
 * @param {number} [wann]
 * @param {boolean} [zwang] true = auch ohne Fehlermuster aufnehmen
 */
function chronikMerken(quelle, zeile, wann, zwang) {
    const roh = String(zeile == null ? "" : zeile).trim();
    if (!roh) return;
    if (!zwang && !chronikRelevant(roh)) return;
    const now = wann || Date.now();
    const f = chronikFinger(quelle, roh);
    const e = CHRONIK.gesehen.get(f);
    const text = roh.length > 400 ? roh.slice(0, 400) + " ..." : roh;
    if (!e) {
        CHRONIK.gesehen.set(f, { n: 1, gemeldet: now });
        CHRONIK.puffer.push(chronikZeit(now) + "  " + quelle + "  " + text);
        return;
    }
    e.n++;
    if (now - e.gemeldet >= CHRONIK.WIEDERHOLUNG_MS) {
        e.gemeldet = now;
        CHRONIK.puffer.push(chronikZeit(now) + "  " + quelle + "  (x" + e.n + ") " + text);
    }
}

/** Hostliste per BFS. Nur alle HOSTS_IV_MS, das reicht voellig. */
function chronikHosts(ns) {
    const kennen = new Set(["home"]);
    const stapel = ["home"];
    const raus = [];
    while (stapel.length) {
        const h = stapel.pop();
        raus.push(h);
        let nach = [];
        try { nach = ns.scan(h) || []; } catch (e) { nach = []; }
        for (const n of nach) if (!kennen.has(n)) { kennen.add(n); stapel.push(n); }
    }
    return raus;
}

/** Ein Sammellauf: erst die Toten, dann die Lebenden. */
function chronikSammeln(ns) {
    // ---- 1) Abgestuerzte / beendete Prozesse -------------------------------
    let tot = [];
    try { tot = ns.getRecentScripts() || []; } catch (e) { tot = []; }
    let neuerStand = CHRONIK.todStand;
    for (const rs of tot) {
        if (!rs || !rs.filename) continue;
        const name = String(rs.filename);
        if (name.indexOf("SCHWARM-") !== 0) continue;      // Worker ignorieren
        let t = 0;
        try { t = new Date(rs.timeOfDeath).getTime() || 0; } catch (e) { t = 0; }
        if (!t || t <= CHRONIK.todStand) continue;          // schon verarbeitet
        if (t > neuerStand) neuerStand = t;
        const q = name + " [beendet]";
        // Das ENDE selbst ist nur bei DAUERLAEUFERN eine Nachricht. Bei
        // Einmal-Laeufen (BACKDOOR, DIAG, AUGS ...) ist es der Normalfall und
        // hat die Chronik im ersten Lauf mit Rauschen gefuellt.
        if (CHRONIK_EINMAL.indexOf(name) < 0) {
            chronikMerken(q, "Prozess beendet nach "
                + Math.round(Number(rs.onlineRunningTime) || 0) + " s Laufzeit.", t, true);
        }
        const logs = Array.isArray(rs.logs) ? rs.logs : [];
        for (const z of logs.slice(-CHRONIK.LOG_TIEFE)) chronikMerken(q, z, t);
    }
    CHRONIK.todStand = neuerStand;

    // ---- 2) Laufende SCHWARM-Daemons ---------------------------------------
    for (const host of CHRONIK.hosts) {
        let procs = [];
        try { procs = ns.ps(host) || []; } catch (e) { continue; }
        for (const p of procs) {
            const fn = String((p && p.filename) || "");
            if (fn.indexOf("SCHWARM-") !== 0) continue;
            let logs = [];
            try { logs = ns.getScriptLogs(fn, host, ...((p && p.args) || [])) || []; }
            catch (e) { continue; }
            const q = fn + "@" + host;
            for (const z of logs.slice(-CHRONIK.LOG_TIEFE)) chronikMerken(q, z);
        }
    }
}

/**
 * Puffer wegschreiben. Gekuerzt wird in der MITTE: der Kopf (wann angelegt,
 * welche BitNode) und das Ende (was zuletzt passierte) sind beide wichtig, die
 * Mitte am wenigsten.
 * @returns {number} Anzahl neu geschriebener Zeilen
 */
function chronikSchreiben(ns) {
    if (!CHRONIK.puffer.length) return 0;
    const n = CHRONIK.puffer.length;
    let alt = "";
    try { alt = ns.read(CHRONIK.datei) || ""; } catch (e) { alt = ""; }
    if (!alt) {
        alt = "SCHWARM-FEHLERCHRONIK   BitNode " + chronikBn() + "\n"
            + "angelegt " + chronikZeit(Date.now()) + " von SCHWARM-INFO\n"
            + "\n"
            + "Quellen: Logs laufender SCHWARM-Daemons und Logs abgestuerzter\n"
            + "Prozesse (ns.getRecentScripts). Gleiche Meldungen werden entdoppelt;\n"
            + "(xN) heisst, sie kam seit dem letzten Eintrag N mal.\n"
            + "\n"
            + "NICHT enthalten: die Browser-Konsole. Engine-Meldungen (React,\n"
            + "EnumHelper) gehen an die Devtools und sind fuer Netscript nicht\n"
            + "lesbar — dafuer gibt es keine API.\n"
            + "==============================================================================\n";
    }
    let text = alt + CHRONIK.puffer.join("\n") + "\n";
    CHRONIK.puffer.length = 0;
    const zeilen = text.split("\n");
    if (zeilen.length > CHRONIK.MAX_ZEILEN) {
        const kopf = zeilen.slice(0, 12);
        const rest = CHRONIK.MAX_ZEILEN - kopf.length - 1;
        text = kopf.join("\n") + "\n... (" + (zeilen.length - kopf.length - rest)
            + " aeltere Zeilen gekuerzt) ...\n" + zeilen.slice(zeilen.length - rest).join("\n");
    }
    try { ns.write(CHRONIK.datei, text, "w"); } catch (e) { return 0; }
    CHRONIK.geschrieben += n;
    return n;
}

/** Takt-Einstieg. Laeuft im normalen INFO-Takt mit und blockiert nichts. */
function chronikTakt(ns) {
    const now = Date.now();
    if (!CHRONIK.datei) CHRONIK.datei = chronikDatei(chronikBn());
    if (now >= CHRONIK.hostsFaellig) {
        CHRONIK.hostsFaellig = now + CHRONIK.HOSTS_IV_MS;
        try { CHRONIK.hosts = chronikHosts(ns); } catch (e) { /* alte Liste behalten */ }
    }
    if (now < CHRONIK.faellig) return;
    CHRONIK.faellig = now + CHRONIK.IV_MS;
    chronikSammeln(ns);
    chronikSchreiben(ns);
}

/** Nach einem BitNode-Wechsel: neue Datei, Gedaechtnis leeren. */
function chronikPrestige() {
    CHRONIK.datei = chronikDatei(chronikBn());
    CHRONIK.gesehen.clear();
    CHRONIK.puffer.length = 0;
    CHRONIK.todStand = 0;
    CHRONIK.geschrieben = 0;
    CHRONIK.hostsFaellig = 0;
    CHRONIK.faellig = 0;
}

export async function main(ns) {
    ns.disableLog("ALL");
    if (!ensureSingleInstance(ns)) { ns.tprint("WARN  [INFO] läuft bereits — beende diese Instanz."); return; }
    announce(ns, "start", "v1.2 — Snapshot (Port 28) + RPC-Gerüst (29/30)");

    // Kaltstart: Steckbrief + alle Direkt-Blöcke sofort, dann publizieren.
    collectBn(ns);
    collectPlayer(ns); collectCaps(ns); collectSleeves(ns);
    collectBlade(ns); collectGang(ns); collectHacknet(ns); collectCorp(ns);
    const now0 = Date.now();
    const last = { player: now0, caps: now0, sleeves: now0, blade: now0, gang: now0, hacknet: now0, corp: now0 };
    for (const k of Object.keys(SWEEPS)) S.due[k] = 0;    // Sweeps sofort fällig
    publish(ns, true);
    ns.print(`INFO bereit auf ${ns.getHostname()} | SF4=${S.sf4} (Mult ×${S.mult}) | Headroom ${formatRam(EVAL_HEADROOM_GB)}`);

    const DIRECT = {
        player: collectPlayer, caps: collectCaps, sleeves: collectSleeves,
        blade: collectBlade, gang: collectGang, hacknet: collectHacknet, corp: collectCorp,
    };

    while (true) {
        try {
            const now = Date.now();

            // ---------- Prestige-Wache (Soft-Fälle; harter Reset killt uns eh) ----
            if (now - S.lastPrestigeChk >= CFG.PRESTIGE_CHECK_MS) {
                S.lastPrestigeChk = now;
                let reset = 0;
                try { reset = ns.getResetInfo().lastNodeReset || 0; } catch (e) { /* 0 */ }
                if (S.lastNodeReset && reset && reset !== S.lastNodeReset) {
                    ns.print("PRESTIGE erkannt -> Snapshot verwerfen, Steckbrief neu.");
                    S.blocks = {}; S.gen++; S.augTmp = null;
                    collectBn(ns);
                    chronikPrestige();          // neue BitNode -> neue Chronikdatei
                    for (const k of Object.keys(SWEEPS)) S.due[k] = 0;
                    for (const k of Object.keys(last)) last[k] = 0;
                    publish(ns, true);
                }
            }

            // ---------- Direkte Blöcke je Intervall -------------------------------
            for (const k of Object.keys(DIRECT)) {
                if (now - (last[k] || 0) >= intervall(ns, k)) { last[k] = now; DIRECT[k](ns); }
            }

            // ---------- RPC einsammeln; Vorrang vor Sweeps ------------------------
            drainRpc(ns);
            let acted = false;
            if (S.rpcQueue.length > 0) {
                acted = await runRpc(ns);
                if (acted) publishRpc(ns);
            }

            // ---------- Ein fälliger Sweep (seriell, nur wenn kein RPC lief) ------
            // Auswahl: der AM LÄNGSTEN überfällige zuerst (kleinstes due), nicht
            // der erste im Objekt — sonst monopolisieren die kurzintervalligen
            // Sweeps die Slots, wenn nach Prestige/Fehlern mehrere gleichzeitig
            // fällig sind, und market/crime kämen nie dran (im Mock-Test belegt).
            if (!acted && S.sing) {
                let pick = null, pickDue = Infinity;
                for (const k of Object.keys(SWEEPS)) {
                    const d = S.due[k] || 0;
                    if (now >= d && d < pickDue) { pick = k; pickDue = d; }
                }
                if (pick) {
                    const ok = await SWEEPS[pick](ns);
                    S.due[pick] = Date.now() + (ok ? CFG.IV[pick] : Math.min(CFG.IV[pick], CFG.ERR_RETRY_MS));
                }
            } else if (!acted && !S.sing) {
                // Ohne SF4: [SING]-Blöcke einmalig ehrlich markieren.
                for (const k of Object.keys(SWEEPS)) {
                    if (!S.blocks[k]) setBlock(k, false, "NO_SING");
                }
            }

            publish(ns);

            // ---------- Fehler-Chronik ------------------------------------------
            // Eigener Takt (15 s), eigener try — ein Fehler beim Sammeln darf den
            // Snapshot nicht mitreissen. Genau dieser Daemon ist die Stelle, an
            // der ein stiller Fehler am teuersten waere.
            try { chronikTakt(ns); }
            catch (e) { ns.print("Chronik-Ausnahme (nicht kritisch): " + e); }
        } catch (e) {
            announce(ns, "error", `Takt-Ausnahme: ${e}`);
        }
        await ns.sleep(CFG.TICK_MS);
    }
}