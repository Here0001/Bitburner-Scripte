/**
 *  * v0.8 (KURSBEEINFLUSSUNG): schwarm-g.js und schwarm-h.js lesen args[2].
 *   "1" -> { stock: true }. Gesetzt nur von der Dispatcher-Stufe manip
 *   (v10.7) und dort nur auf der Seite, die den Impuls tragen soll.
 *   Zusammen mit SRC_TRADER v1.4 (meldet Ziele auf Port 34).
 * SCHWARM-PAYLOADS.js — v0.26
 *
 * v0.26 — GANG v0.8: zwei BANK-Antraege (Augs prio 300, Ausruestung
 *   prio 100), je Freigabe nur aus der eigenen Liste, beide im selben Takt,
 *   Kauf mit exaktem Betrag im Handlungsbuch. AUGS v1.1: Kauf im Buch.
 *   Gehoert zu BANK v5.17 und HELPERS v5.16 (Kassenpruefung).
 *   Nachtrag: GANG meldet ungenutzte Antraege "ungenutzt" ab (BANK bucht nicht).
 *   Nachtrag 3: GANG-Drossel greift jetzt (nur >5 % Aenderung oder alle 30 s).
 *
 * v0.25 — GO v0.7: --verify fragte INFO auf den Ports 29/30 an. Beide
 *   sind seit Langem anders belegt (29 = AKTIV_OUT, 30 = frei); INFO liest
 *   INFO_IN und antwortet auf INFO_RPC_RES. Gefunden von projektkarte.py.
 *
 * v0.24 — BLADEBURNER v0.6: DER SCHUTZ FUER LAUFENDE ARBEIT HATTE ZWEI LUECKEN.
 *   War der Simulacrum-Stand unbekannt (Probe ohne RAM), startete v0.5 eine
 *   Aktion, ohne die Arbeit zu pruefen - und die Engine bricht ohne
 *   Simulacrum jede Arbeit ab, auch ein Grafting. Dazu lag zwischen
 *   Arbeitsabfrage und Start ein Fenster (zwei Wegwerf-Skripte). Gefunden
 *   vom Skeptiker des Infiltrations-Workflows am 24.09.2026.
 *
 * v0.23 — BLADEBURNER v0.5 und GANG v0.6: EIGENSTAENDIG.
 *   Beide werden seit HELPERS v5.13 von der QUEEN gestartet, ohne WANT von
 *   WORK. Sie koennen also kommen, bevor WORK beigetreten ist bzw. die Gang
 *   gegruendet hat - und muessen dann WARTEN statt sich zu beenden (sonst
 *   startet die QUEEN sie jeden Takt neu). BLADEBURNER prueft zusaetzlich
 *   das Simulacrum, bevor er eine Aktion startet.
 *
 * v0.22 — NEUE NUTZLAST BITNODE (v1.0). Beendet den Durchlauf und waehlt die
 *   naechste Node in einem Aufruf. Prueft die Engine-Bedingung SELBST, statt
 *   der Freigabe zu glauben: die sagt "du darfst", nicht "es geht" — und
 *   genau zwischen beidem lag die Luecke, die am 13.09.2026 auffiel.
 *
 * v0.21 — GANG-Nutzlast v0.5: die Messlatte des Optimierers war in zwei
 *   Hinsichten falsch (Massstab und die Null). Begruendung am GANG-Kopf.
 *
 * v0.20 — NUTZLAST-STEMPEL + SCHREIBEN NUR BEI AENDERUNG.
 *   materialize() schrieb bedingungslos. Neu: gleicher Inhalt wird uebersprungen
 *   (Script.ts:36 kehrt dort ohnehin sofort zurueck), und payloadStamp() liefert
 *   den Stempel des FERTIGEN Codes, ohne etwas zu schreiben. Damit kann die
 *   Queen (v7.2) erkennen, dass ein laufender Daemon noch alten Code faehrt —
 *   was beim Einspielen von TRADER v1.6 live aufgefallen war.
 *
 * v0.19 — KAUF-VORRANG (TRADER v1.6) FUER BEEINFLUSSBARE ORGANISATIONEN.
 *   Der Trader liest den Dispatcher-Ausgang jetzt VOR den Einstiegen statt
 *   danach und nimmt hackPays und manipOk mit in die Kaufentscheidung. Bringt
 *   Hacken in dieser BitNode kein Geld, werden Symbole bevorzugt, deren Kurs
 *   der Schwarm selbst schieben kann. Begruendung und Engine-Belege stehen im
 *   Kopf von SCHWARM-TRADER.js weiter unten.
 *
 * v0.18 — GO 0.6: Slum Snakes bleibt drin und wird aufgewertet, statt nach
 *   der Gang-Gruendung abgeschaltet zu werden. Sein Bonus ist der einzige
 *   Hebel auf die Schummel-Chance in IPvGO. Begruendung mit Belegen im
 *   Kopf des GO-Payloads.
 *
 * v0.17 — LOGVIEW 1.1: DAS LOGBUCH IST JETZT FARBIG.
 *   gruen laeuft, gelb ansehen, rot kaputt, blau Zahlen.
 *
 *   Die Farben entstehen im ANZEIGER, nicht in DIAG. Die Reportdatei bleibt
 *   damit reiner Text — die Bruecke legt sie auf dem PC ab, und dort will
 *   niemand Steuerzeichen im Editor sehen. Ausserdem bleibt DIAG unberuehrt.
 *
 *   Moeglich ist das, weil das Tail-Fenster jede Zeile durch ANSIITypography
 *   schickt (ui/React/LogBoxManager.tsx:415) und die Form ESC[38;2;r;g;b m
 *   freie RGB-Werte erlaubt. Der ganze Report bleibt trotzdem EIN Logeintrag,
 *   die 50-Eintraege-Grenze also weiter eingehalten.
 *
 *   Die Regeln raten NICHT. Sie lesen DIAGs eigene Sprache: die Marke "!!",
 *   mit der DIAG jeden Problemfall selbst kennzeichnet (SCHWARM-DIAG.js:
 *   1360-1368), und die Urteilswoerter derselben Stelle ("ok", "aus
 *   (gewollt)", "ruht", "wartet", "frisch gestartet").
 *
 *   Zwei Faelle, die man leicht falsch macht und die deshalb eigene Regeln
 *   haben:
 *     - Abschnitt 8 BEFUNDE ist nicht pauschal rot. DIAG legt dort auch
 *       Entwarnungen ab ("Das ist korrektes Verhalten, kein Fehler",
 *       SCHWARM-DIAG.js:1401). Die sind gelb.
 *     - Logbuchzeilen bleiben grau, obwohl der Zeitstempel sie zahlenlastig
 *       macht. Sie berichten Ereignisse, keine Messwerte.
 *
 *   Die Farblogik steht auf Modulebene, nicht in main(): so kann die
 *   Pruefleiste sie gegen echte Berichte laufen lassen, ohne das Spiel zu
 *   starten. Eine Farbregel, die man nicht gegenpruefen kann, ist geraten.
 *
 * v0.16 — NEUER PAYLOAD LOGVIEW. Zeigt den neuesten DIAG-Report in einem
 *   eigenen Tail-Fenster. Ohne Import und ohne deps: 1.80 GB.
 *   Ein einziges ns.print mit Umbruechen pro Neuzeichnung — die Engine haelt
 *   nur 50 Logeintraege (Script/RunningScript.ts:109), rendert einen Eintrag
 *   aber mit pre-wrap als beliebig viele Zeilen (LogBoxManager.tsx:171).
 *   200 Report-Zeilen als 200 prints waeren zu 150 Zeilen abgeschnitten.
 *   resizeTail steht bewusst NACH einer kurzen Pause: openTail schickt nur
 *   ein Ereignis los, das Fenster baut React danach. resizeTail greift auf
 *   tailProps zu, das erst mit dem Fenster entsteht (UserInterface.ts:76-88)
 *   - direkt hintereinander verpufft die Groesse still.
 *
 * SCHWARM-PAYLOADS.js — v0.15
 *
 * v0.15 — STANEK 2.6: publish() spiegelt den Bericht zusaetzlich in die
 *   Zustandsdatei. Port 25 ist nur im Spiel lesbar; die Remote-API kennt
 *   Dateien, keine Ports. Damit ist der Ladehost jetzt auch von aussen
 *   pruefbar, ohne einen vollen DIAG-Lauf.
 *
 * v0.14 — STANEK 2.5: Ladehost nach maxRam statt nach Fuellstand, und jeder
 *   Fremdhost gilt als exklusiv. Dazu der neue Zustand "raeumt" auf Port 25,
 *   damit der Dispatcher den Host freimacht, BEVOR der Lader hineinwill.
 *
 * v0.13 (STANEK v2.4): Charisma zusaetzlich ausgeschlossen — DARKNET treibt den
 *   Wert im Betrieb ohnehin auf 840 bis 1500, ganz ohne Fragment. Mit 12 x 3 = 36
 *   lag es auf Platz acht und haette Plaetze belegt, die den Hack-Fragmenten
 *   fehlen. Uebrig bleiben im Normalfall genau fuenf Typen: HackingMoney,
 *   Hacking, HackingSpeed, Rep und HackingGrow.
 *
 * v0.12 (STANEK v2.3): FRAGMENT-AUSWAHL NACH LAGE. WorkMoney lag mit Power 10
 *   trotz Gewicht 5 auf Platz vier (5 x 10 = 50, gleichauf mit Rep) und stand
 *   mit +57,9 % im Gitter, ohne etwas einzubringen. WorkMoney, Crime und
 *   Bladeburner sind jetzt fest ausgeschlossen; Kampfwerte gelten nur bis alle
 *   vier >= 100 sind (Bladeburner-Freischaltung, SpecialLocation.tsx:105), und
 *   Hacknet-Fragmente nur dort, wo gekaufte Server gesperrt sind.
 *   Ausserdem: auf einem Hacknet-Server laedt STANEK jetzt mit 98 % statt 75 %
 *   und 8 GB Reserve statt 64 — der Dispatcher raeumt diesen Host seit v11.8
 *   ganz frei, jedes zurueckgehaltene Gigabyte waere verschenkt.
 *
 * v0.11 (STANEK v2.2, TRADER v1.5): HACKNET-SERVER IN DIE HOSTWAHL. Dort liegen die KERNE
 *   (bis 128, Hacknet/data/Constants.ts:50) gegen 1 auf jedem gekauften Server.
 *   Bei 128 Kernen ist der Bonus 8,94 — ein voll ausgebauter Hacknet-Server
 *   traegt 3072 Ladethreads und wirkt wie 27.456 auf einem Einkern-Server.
 *   Ausserdem: der Schnellausstieg meldet jetzt LAUT, warum er eine angeforderte
 *   Nachladung ablehnt. Vorher sah man nur, dass der Prozess sofort weg war.
 *
 * v0.10
 *
 * v0.10 (STANEK v1.4): DAS ERSTE GITTER BLIEB FUER IMMER LIEGEN. Die Regel
 *   "Suche unvollstaendig UND Gitter vorhanden -> niemals umbauen" war eine
 *   Sperre ohne Ausweg, weil die Suche NIE fertig wurde: die Chronik zeigt
 *   denselben Abbruch 121-mal in Folge, und vier Screenshots ueber Stunden
 *   zeigen exakt dasselbe Gitter inklusive "Arbeitslohn Power 10", das bei
 *   Crime und Shock-Recovery nichts bringt. "Unvollstaendig" heisst aber nicht
 *   "schlecht" — die Suche geht K aufsteigend vor und haelt immer das beste
 *   bisher Gefundene. JETZT entscheidet auch dort der Nutzen, nur mit hoeherer
 *   Schwelle (RELAYOUT_GAIN_TEIL 1.15 statt 1.04). Zeitbremse 6 s -> 15 s, und
 *   die Suche meldet Dauer, fertige K-Stufen und Atempausen — damit beim
 *   naechsten Lauf messbar ist, ob die Bremse zu knapp ist oder die Atempausen
 *   sie aufbrauchen.
 *
 * v0.9 (TRADER v1.3): OUT.held meldet die ANZAHL offener Positionen, getrennt
 *   vom Wert. Der Wert wird fuer BANK auf 0 geklemmt, weil eine Unterwasser-
 *   Short negativ ist — BANK hielt das Depot deshalb faelschlich fuer leer und
 *   toetete den TRADER mitten in der Reset-Phase (siehe SCHWARM-BANK v3.4).
 *   Die T6-Warnung ("Forderung uebersteigt den Depotwert") feuert jetzt nur noch
 *   bei POSITIVEM Wert: bei negativem ist eine hohe Forderung genau richtig, und
 *   die alte Meldung schob die Ursache faelschlich auf die BANK.
 *
 * v0.7
 * v0.7 (TRADER): BUGFIX mit vier Folgesymptomen. Im Portfolio-Block stand
 *   ns.stock.getSaleGain(sym, shares, "Long") — "Long" ist KEIN gueltiger
 *   Enum-Wert. Die Engine erwartet den WERT, nicht den Namen:
 *       PositionEnumType = { Long: "L", Short: "S" }   (NetscriptDefinitions:441)
 *   und getSaleGain prueft strikt (StockMarket.ts:118, nsGetMember OHNE
 *   {fuzzy:true}). Der Aufruf warf also JEDES MAL; der catch setzte gain=0 und
 *   das folgende "if (gain <= 0) continue" uebersprang JEDE Position. Port 26
 *   meldete dauerhaft $0, obwohl das Depot voll war.
 *   FOLGEN, alle im Livereport belegt:
 *     1. Dashboard zeigte keine Aktien und ein zu niedriges Vermoegen (v5.1
 *        bezieht den Depotwert bewusst nur aus Port 26, um 6 GB stock-API zu
 *        sparen — der Umbau war richtig, die Quelle war kaputt),
 *     2. BANK berechnet emaStock nur bei Portfolio > 1e6 -> Trader-Zins blieb
 *        $0/h und das Allokations-Gate arbeitete mit dem Floor von 10 %/h,
 *     3. `held` blieb leer -> die Liquidation fuer Grossziele konnte NIE greifen;
 *        das Sparziel Congruity wartete auf Geld, das nicht kommen konnte,
 *     4. der im BANK-Kopf als eigenes Problem beschriebene "4S-API-Deadlock"
 *        (Portfolio >= Preis/2 bei dauerhaft 0 Portfolio) hatte dieselbe Wurzel.
 *   Zusaetzlich ein FALLBACK: wirft getSaleGain, wird der Nettoerlös selbst
 *   gerechnet (shares x bidPrice - Gebuehr) und EINMALIG gewarnt. Der eigentliche
 *   Konstruktionsfehler war nicht der falsche String, sondern dass ein API-Fehler
 *   nicht von "keine Position" zu unterscheiden war — derselbe Fehlertyp wie beim
 *   Sticky-Schutz in detectCapabilities.
 * v0.6 (BACKDOOR): Der Payload kann jetzt EIN Ziel als Argument nehmen und wird
 *   vom Dispatcher mehrfach parallel gestartet. Ausserdem zwei Sicherungen:
 *     - w0r1d_d43m0n ist HART AUSGESCHLOSSEN. Engine (Singularity.ts:552):
 *       ein Backdoor darauf ruft Router.toPage(Page.BitVerse) auf und BEENDET DIE
 *       BITNODE. Die Doktrin lautet ausdruecklich, dass der Spieler das selbst
 *       ausloest (das Dashboard zeigt die Bereitschaft nur an). Der Sammelmodus
 *       haette den Server mitgenommen, sobald das Level reicht — es ist nur nie
 *       aufgefallen, weil der Payload wegen des Gate-Fehlers im Dispatcher (v10.4)
 *       ueberhaupt nie gestartet wurde.
 *     - Vor dem Aufruf wird geprueft, ob das Ziel inzwischen schon einen Backdoor
 *       hat. Bei parallelen Laeufen kann ein anderer Prozess schneller gewesen sein.
 *   PARALLELBETRIEB IST ENGINE-SEITIG SICHER (Singularity.ts:518-556):
 *   installBackdoor() liest Player.getCurrentServer() EINMAL und friert den Server
 *   in einer lokalen Konstante ein, BEVOR netscriptDelay() laeuft. Wechselt ein
 *   anderer Prozess waehrend der Wartezeit die Verbindung, trifft das den bereits
 *   laufenden Backdoor nicht mehr. Und weil ns.singularity.connect() synchron ist,
 *   kann zwischen der connect-Kette und dem Einfrieren kein anderes Skript
 *   dazwischenkommen — Netscript unterbricht nur an await-Punkten.
 * v0.5 (DASHBOARD-KNOPF): RESET-Payload setzt seinen eigenen Schalter beim Start
 *   auf den Registry-Default (1) zurueck. Hintergrund: der Dashboard-Knopf loest
 *   One-Shots seit DASHBOARD v5.1 mit FORCE aus (state=2), weil ein blosses START
 *   fuer RESET wirkungslos ist — shouldRun() in der Queen verlangt dort
 *   zusaetzlich ein WANT, das nur handleResetCycle setzt. state=2 bleibt aber
 *   stehen und wuerde nach dem Neustart durch GENESIS einen ZWEITEN Install
 *   ausloesen. Deshalb raeumt der Payload den Schalter selbst auf, und zwar auf 1
 *   (Registry-Default, RESET hat kein defaultOff) — auf 0 wuerde er den
 *   AUTOMATISCHEN Reset-Zyklus ueber Port 19 dauerhaft blockieren.
 *   SCAN macht dasselbe, dort aber auf 0 (defaultOff).
 *   UNVERAENDERT BLEIBT die Sicherung darunter: ohne Auftrag auf Port 19 (BANK)
 *   installiert RESET NICHTS. Der Knopf ist damit ein Ausloeser, kein Override —
 *   ein Aug-Install ohne fertige Kaufrunde waere die teuerste Fehlbedienung im
 *   ganzen Schwarm. Die Abbruchmeldung sagt jetzt auch, WARUM nichts passiert.
 * v0.4 (DASHBOARD-UMBAU): NEUER Payload SCAN — interaktive Netzkarte im
 *   Terminal (Baum mit Root-/Backdoor-Status, Level, Contracts, Geld/Sec/RAM;
 *   Servernamen und [backdoor]-Marken sind klickbar). Ersetzt das lose
 *   Fremdskript scan.js. One-Shot, ausgeloest ueber den Dashboard-Knopf.
 *   Drei Aenderungen ggue. der Vorlage, alle noetig:
 *     (a) Import auf SCHWARM-HELPERS.js — helpers.js gibt es hier nicht;
 *     (b) Formatter-Signaturen korrigiert (Vorlage rief formatMoney(x,4,1)
 *         und formatNumber(x,0,0); SCHWARM-HELPERS hat (n,dec) — die dritten
 *         Argumente waeren still verschluckt worden);
 *     (c) Praezedenz-Bug behoben: "server.moneyMax ?? 0 > 0" parst als
 *         "moneyMax ?? (0 > 0)" und war damit fuer jeden Server mit
 *         definiertem moneyMax wahr — auch bei moneyMax 0.
 *   Ausserdem: setDaemonEnabled(ns,"SCAN",0) als ERSTE Aktion (sonst
 *   Endlos-Neustart durch die Queen) und throw -> tprint bei unsichtbarem
 *   Terminal.
 * v0.3 (ENDGAME): BLADEBURNER-Payload — Daedalus-Sperre: die finale BlackOp
 *   "Operation Daedalus" wird NIE automatisch ausgeführt (beendet die BitNode);
 *   bei Bereitschaft einmalige Log-Meldung, Anzeige übernimmt das Dashboard.
 * v0.2 (BANK-v1.0-Zulieferung): GANG-Payload -> v0.4 — tryUpgrade() kauft über
 *   die BANK-Warteliste (Port 12/13, AUGS-identisches Protokoll) statt direkt
 *   am Treasury-RESERVE vorbei; Budget-Prozente entfallen. Nur die GANG-
 *   Sektion wurde angefasst.
 * (vorher: v0.1 — NEU im Payload-Umbau)
 * ============================================================================
 * Zentraler Speicher EINGEBETTETER Skript-Quellen ("Payloads") + materialize().
 * Ziel des Umbaus: nur wenige hand-gepflegte Dateien auf home; alles Uebrige wird
 * bei Bedarf von seinem Besitzer aus diesem Speicher materialisiert (auf Platte
 * geschrieben) und gestartet. Ersetzt die frueher in DISPATCHER/HELPERS/… verteilt
 * eingebetteten Quell-Strings.
 *
 * WAS HIER LIEGT (Stand v0.1 — stabile Payloads zuerst):
 *   WORKER_W/G/H     — die 3 Hot-Path-Worker (weaken/grow/hack). Vorher im
 *                      DISPATCHER als SRC_WEAKEN/SRC_GROW/SRC_HACK.
 *   SOLVER           — Contract-Solver. DEDUPLIZIERT: die frueher zweite Kopie im
 *                      Darknet (schwarm-dnet-solver) faellt weg. EINE Quelle,
 *                      modus-parametrisiert: args[0]="local" loest nur den lokalen
 *                      Host (Darknet), sonst netzweit; args[1]=Telemetrie-Port.
 *   BACKDOOR_PAYLOAD — aus SCHWARM-HELPERS.js hierher verschoben (dort bleibt der
 *                      const vorerst als Uebergang stehen, bis die Queen umgestellt
 *                      ist; danach entfernen).
 *
 * FOLGT (wird ergaenzt, sobald der jeweilige Daemon umgebaut ist):
 *   GO, TRADER, AUGS, BLADEBURNER, GANG, SCAN.
 *
 * KODIERUNG: Quellen ohne Backtick/${ (Worker/Solver/Backdoor) liegen im Klartext
 * in Backtick-Literalen; decodePayload() ist auf ihnen ein No-Op. "Schmutzige"
 * Quellen (z.B. der Roamer, spaeter) werden beim Generieren mit den ASCII-Sentinels
 * aus HELPERS kodiert und von decodePayload() zur Laufzeit zurueckgewandelt.
 * ============================================================================
 */

import { decodePayload, injectPorts } from "SCHWARM-HELPERS.js";

// ============================================================================
// WORKER — Hot-Path, trivial, backtick-/${-frei (direkt eingebettet)
// ============================================================================
// ARGUMENT-VERTRAG (v3.0):
//   args[0] = Ziel-Host
//   args[1] = Startverzögerung in ms (0 = sofort)
//   args[2] = uid (Zähler; umgeht Bitburners Duplikatschutz kontrolliert)
//   args[3] = KLASSE — "core" | "prep" | "xp" | "share"   [NEU v3.0]
//
// Die Worker LESEN args[3] nie. Es existiert ausschließlich, damit der Dispatcher
// über ns.ps().args[3] erkennt, welche Prozesse er beim Freimachen von RAM opfern
// darf: share -> xp -> prep. "core" (h/w/g auf aktiven Zielen) wird NIE gekillt,
// sondern läuft aus. Siehe HELPERS.WCLASS / WCLASS_KILL_ORDER.

const SRC_WEAKEN = `/** @param {NS} ns */
export async function main(ns) { await ns.weaken(ns.args[0]); }
`;
// XP-DAUERLAEUFER (v12.0). Gleicher Aufruf wie schwarm-w.js, aber in einer
// Schleife. Er existiert NUR fuer die XP-Stufe des Dispatchers.
//
// WARUM EINE SCHLEIFE. Der One-Shot endet nach einem weaken. Bei der aktuell
// gemessenen Laufzeit von rund 12 s starten alle XP-Worker im selben Takt und
// enden auch gemeinsam — der Pool faellt schlagartig auf null und steht dann
// leer, bis der Dispatcher ihn wieder gefuellt hat (live gemessen: hoch bei
// 5,8 s, tot bei 18,1 s, zurueck bei 40,2 s; Laufzeit 12 s, Luecke 22 s).
// Die Schleife kennt diesen Pulk-Tod nicht: der Prozess bleibt stehen und ruft
// weaken sofort erneut auf. Es gibt keine Luecke mehr zu fuellen.
//
// XP-GLEICHWERTIGKEIT. calculateHackingExpGain wertet je abgeschlossenem
// weaken-Aufruf, nicht je Prozess. Die Schleife liefert deshalb pro Zeit
// mindestens so viel XP wie wiederholte One-Shots — und spart deren
// Start-/Abbau-Aufwand.
//
// PREIS: der Prozess gibt sein RAM NIE von selbst frei. Das ist genau der
// Zustand, den v10 mit "SPERRLISTE statt KILLS" abgeschafft hatte. Deshalb
// gehoert zu diesem Worker zwingend der Erntepfad: der Dispatcher MELDET,
// die Queen TOETET (SCHWARM-HELPERS.js, reportReap/XP_LONG_WORKER).
// Ohne den Erntepfad verhungern Daemons, weil eine Queen-Reservierung auf
// einem Host mit Dauerlaeufern nie erfuellt wird.
//
// args[0] = Ziel · args[1] = Klassenmarke "xp" (nur fuer ps(), nie gelesen)
const SRC_WEAKEN_LONG = `/** @param {NS} ns */
export async function main(ns) { const t = ns.args[0]; for (;;) { await ns.weaken(t); } }
`;


// v0.8 KURSBEEINFLUSSUNG: args[2] === "1" heisst, dieser Aufruf beeinflusst den
// Kurs (PlayerInfluencing.ts). Gesetzt wird es NUR von der Dispatcher-Stufe
// manip, und dort nur auf einer Seite — bei Richtung "up" traegt grow das Flag
// und hack schafft nur Platz, bei "down" umgekehrt. Beides gleichzeitig wuerde
// sich aufheben (+0.1 bei grow, -0.1 bei hack).
// Fehlt args[2] (Worker aus einer aelteren Dispatcher-Instanz), ist der
// Vergleich false und der Worker verhaelt sich exakt wie bisher.
const SRC_GROW = `/** @param {NS} ns */
export async function main(ns) { await ns.grow(ns.args[0], { stock: ns.args[2] === "1" }); }
`;

const SRC_HACK = `/** @param {NS} ns */
export async function main(ns) { await ns.hack(ns.args[0], { stock: ns.args[2] === "1" }); }
`;

// SHARE-Worker (NEU v3.0). ns.share() erhöht den Faktions-Rufgewinn des Spielers,
// solange es läuft (~10 s je Aufruf). Der Dispatcher startet diese Worker NUR,
// wenn WORK auf Port 23 meldet, dass gerade Ruf gegrindet wird — sonst wäre der
// RAM in XP-Weaken besser aufgehoben.
//
// KORREKTUR (v12.0): dieser Absatz beschrieb bis hierher eine Endlosschleife
// ("der Worker soll dauerhaft teilen ... bis jemand ihn beendet"). Der Code
// darunter hat aber KEINE — er ist seit v10 ein One-Shot. ns.share() laeuft
// ShareBonusTime (10 s, Share.ts:8) und kehrt zurueck; faellt das Grind-Flag,
// laufen die Worker binnen 10 s von selbst aus, ohne Kills und ohne Karenz.
// Genau darauf baut die Dispatcher-Stufe 5 ("KEIN Abbau-Zweig noetig").
// Der einzige Worker MIT Schleife ist der XP-Dauerlaeufer oben; nur er braucht
// den Erntepfad. Die Unterscheidung muss stimmen, sonst ist nicht mehr zu sehen,
// welcher Prozess sein RAM von selbst zurueckgibt.
// args[0] ist hier ohne Bedeutung (Formkonstanz mit den anderen Workern).
const SRC_SHARE = `/** @param {NS} ns */
export async function main(ns) { await ns.share(); }
`;

// ============================================================================
// SOLVER — dedupliziert, modus-parametrisiert (siehe Kopf). Backtick-/${-frei.
// ============================================================================
const SRC_SOLVER = `/**
 * schwarm-solver.js — One-Shot Contract-Solver (Payload)
 * Scannt einmal das ganze Netz, loest alle .cct und beendet sich.
 * KEIN Sleep, KEINE Schleife. Wird vom SCHWARM-DISPATCHER bei Bedarf gestartet.
 * Backtick-frei: kann als String im Dispatcher eingebettet werden.
 */

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    // GEAENDERT (Payload-Konsolidierung, dedupliziert die 2. Solver-Kopie aus dem
    // Darknet): parametrisiert. args[0]==="local" -> loest NUR die .cct DIESES Hosts
    // (Darknet-Wiederverwendung), sonst netzweit. args[1] = optionaler Telemetrie-
    // Port; ist er >0, wird "host;SOLVE:DONE:solved/total" gemeldet (Roamer liest das).
    const localOnly = ns.args[0] === "local";
    const telemetryPort = Number(ns.args[1]) || 0;
    const hosts = localOnly ? [ns.getHostname()] : getAllServers(ns);
    let solved = 0, failed = 0;
    for (const s of hosts) {
        for (const c of ns.ls(s, ".cct")) {
            try {
                const type = ns.codingcontract.getContractType(c, s);
                const data = ns.codingcontract.getData(c, s);
                if (solve(type, data, s, c, ns)) solved++;
                else failed++;
            } catch (e) { failed++; }
        }
    }
    if (telemetryPort > 0) {
        try { ns.writePort(telemetryPort, ns.getHostname() + ";SOLVE:DONE:" + solved + "/" + (solved + failed)); } catch (e) {}
    }
    if (!localOnly && solved + failed > 0) {
        ns.tprint("[SCHWARM-SOLVER] geloest " + solved + " / fehlgeschlagen " + failed);
    }
}

// Alle Hosts ab home (inkl. home + gekaufte; ns.ls findet dort einfach nichts).
function getAllServers(ns) {
    const seen = new Set(["home"]);
    const q = ["home"];
    while (q.length) {
        const h = q.shift();
        for (const n of ns.scan(h)) if (!seen.has(n)) { seen.add(n); q.push(n); }
    }
    return [...seen];
}

function solve(type, data, server, contract, ns) {
    let solution = "";
    switch (type) {
        case "Algorithmic Stock Trader I":
            solution = maxProfit([1, data]);
            break;
        case "Algorithmic Stock Trader II":
            solution = maxProfit([Math.ceil(data.length / 2), data]);
            break;
        case "Algorithmic Stock Trader III":
            solution = maxProfit([2, data]);
            break;
        case "Algorithmic Stock Trader IV":
            solution = maxProfit(data);
            break;
        case "Minimum Path Sum in a Triangle":
            solution = solveTriangleSum(data, ns);
            break;
        case "Unique Paths in a Grid I":
            solution = uniquePathsI(data);
            break;
        case "Unique Paths in a Grid II":
            solution = uniquePathsII(data);
            break;
        case "Generate IP Addresses":
            solution = generateIps(data);
            break;
        case "Find Largest Prime Factor":
            solution = factor(data);
            break;
        case "Spiralize Matrix":
            solution = spiral(data);
            break;
        case "Merge Overlapping Intervals":
            solution = mergeOverlap(data);
            break;
        case "Find All Valid Math Expressions":
            solution = findAllValidMathExpressions(data);
            break;
        case "Array Jumping Game":
            solution = solveArrayJumpingGame(data, 0);
            break;
        case "Array Jumping Game II":
            solution = solveArrayJumpingGameII(data);
            break;
        case "Subarray with Maximum Sum":
            solution = subarrayMaxSum(data);
            break;
        case "Sanitize Parentheses in Expression":
            solution = sanitizeParentheses(data);
            break;
        case "Total Ways to Sum":
            solution = totalWaysToSum(data);
            break;
        case "Total Ways to Sum II":
            solution = totalWaysToSumII(data);
            break;
        case "HammingCodes: Encoded Binary to Integer":
            solution = solveHammingDecodeContract(data);
            break;
        case "HammingCodes: Integer to encoded Binary":
            solution = HammingEncode(data);
            break;
        case "HammingCodes: Integer to Encoded Binary":
            solution = HammingEncode(data);
            break;
        case "Shortest Path in a Grid":
            solution = shortestPathInGrid(data);
            break;
        case "Proper 2-Coloring of a Graph":
            solution = proper2ColoringOfAGraph(data);
            break;
        case "Compression III: LZ Compression":
            solution = compressionIII(data);
            break;
        case "Compression II: LZ Decompression":
            solution = decompressII(data);
            break;
        case "Compression I: RLE Compression":
            solution = rleCompress(data);
            break;
        case "Encryption I: Caesar Cipher":
            solution = caesarCipher(data);
            break;
        case "Encryption II: Vigenère Cipher":
            solution = vigenereCipher(data);
            break;
        case "Square Root":
            solution = solveSquareRoot(data);
            break;
        case "Total Number of Primes":
            solution = solveTotalPrimes(data);
            break;
        case "Largest Rectangle in a Matrix":
            solution = solveLargestRectangle(data);
            break;
        default:
            ns.print("WARN: kein Solver fuer Typ '" + type + "'");
            solution = "$SENTINEL_NO_SOLVER$";
            break;
    }
    if (solution === "$SENTINEL_NO_SOLVER$") return false;
    // v3.0.1: attempt(answer, filename, host) -> string (reward bei Erfolg, "" bei Fehler)
    const reward = ns.codingcontract.attempt(solution, contract, server);
    return typeof reward === "string" && reward.length > 0;
}

//ALGORITHMIC STOCK TRADER

function maxProfit(arrayData) {
    let i, j, k;

    let maxTrades = arrayData[0];
    let stockPrices = arrayData[1];

    let tempStr = "[0";
    for (i = 0; i < stockPrices.length; i++) {
        tempStr += ",0";
    }
    tempStr += "]";
    let tempArr = "[" + tempStr;
    for (i = 0; i < maxTrades - 1; i++) {
        tempArr += "," + tempStr;
    }
    tempArr += "]";

    let highestProfit = JSON.parse(tempArr);

    for (i = 0; i < maxTrades; i++) {
        for (j = 0; j < stockPrices.length; j++) { // Buy / Start
            for (k = j; k < stockPrices.length; k++) { // Sell / End
                if (i > 0 && j > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], highestProfit[i - 1][j - 1] + stockPrices[k] - stockPrices[j]);
                } else if (i > 0 && j > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i - 1][j - 1] + stockPrices[k] - stockPrices[j]);
                } else if (i > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i - 1][k], highestProfit[i][k - 1], stockPrices[k] - stockPrices[j]);
                } else if (j > 0 && k > 0) {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], highestProfit[i][k - 1], stockPrices[k] - stockPrices[j]);
                } else {
                    highestProfit[i][k] = Math.max(highestProfit[i][k], stockPrices[k] - stockPrices[j]);
                }
            }
        }
    }
    return highestProfit[maxTrades - 1][stockPrices.length - 1];
}

//SMALLEST TRIANGLE SUM

function solveTriangleSum(arrayData, ns) {
    let triangle = arrayData;
    let nextArray;
    let previousArray = triangle[0];

    for (let i = 1; i < triangle.length; i++) {
        nextArray = [];
        for (let j = 0; j < triangle[i].length; j++) {
            if (j == 0) {
                nextArray.push(previousArray[j] + triangle[i][j]);
            } else if (j == triangle[i].length - 1) {
                nextArray.push(previousArray[j - 1] + triangle[i][j]);
            } else {
                nextArray.push(Math.min(previousArray[j], previousArray[j - 1]) + triangle[i][j]);
            }

        }

        previousArray = nextArray;
    }

    return Math.min.apply(null, nextArray);
}

//UNIQUE PATHS IN A GRID

function uniquePathsI(grid) {
    const rightMoves = grid[0] - 1;
    const downMoves = grid[1] - 1;

    return Math.round(factorialDivision(rightMoves + downMoves, rightMoves) / (factorial(downMoves)));
}

function factorial(n) {
    return factorialDivision(n, 1);
}

function factorialDivision(n, d) {
    if (n == 0 || n == 1 || n == d)
        return 1;
    return factorialDivision(n - 1, d) * n;
}

function uniquePathsII(grid) {
    if (grid[0][0]) return 0
    let m = grid.length, n = grid[0].length
    let dp = Array.from({ length: m }, el => new Uint32Array(n))
    dp[0][0] = 1
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            if (grid[i][j] || (!i && !j)) continue
            else dp[i][j] = (i ? dp[i - 1][j] : 0) + (j ? dp[i][j - 1] : 0)
    return dp[m - 1][n - 1]
}

//GENERATE IP ADDRESSES

function generateIps(num) {
    const data = num.toString();

    const ret = [];
    for (let a = 1; a <= 3; ++a) {
        for (let b = 1; b <= 3; ++b) {
            for (let c = 1; c <= 3; ++c) {
                for (let d = 1; d <= 3; ++d) {
                    if (a + b + c + d === data.length) {
                        const A = parseInt(data.substring(0, a), 10);
                        const B = parseInt(data.substring(a, a + b), 10);
                        const C = parseInt(data.substring(a + b, a + b + c), 10);
                        const D = parseInt(data.substring(a + b + c, a + b + c + d), 10);
                        if (A <= 255 && B <= 255 && C <= 255 && D <= 255) {
                            const ip = [A.toString(), ".", B.toString(), ".", C.toString(), ".", D.toString()].join("");
                            if (ip.length === data.length + 3) {
                                ret.push(ip);
                            }
                        }
                    }
                }
            }
        }
    }

    return ret;
}

function isValidIpSegment(segment) {
    if (segment[0] == "0" && segment != "0") return false;
    segment = Number(segment);
    if (segment < 0 || segment > 255) return false;
    return true;
}

//GREATEST FACTOR

function factor(num) {
    for (let div = 2; div <= Math.sqrt(num); div++) {
        if (num % div != 0) {
            continue;
        }
        num = num / div;
        div = 1;
    }
    return num;
}

//SPIRALIZE Matrix

function spiral(arr, accum = []) {
    if (arr.length === 0 || arr[0].length === 0) {
        return accum;
    }
    accum = accum.concat(arr.shift());
    if (arr.length === 0 || arr[0].length === 0) {
        return accum;
    }
    accum = accum.concat(column(arr, arr[0].length - 1));
    if (arr.length === 0 || arr[0].length === 0) {
        return accum;
    }
    accum = accum.concat(arr.pop().reverse());
    if (arr.length === 0 || arr[0].length === 0) {
        return accum;
    }
    accum = accum.concat(column(arr, 0).reverse());
    if (arr.length === 0 || arr[0].length === 0) {
        return accum;
    }
    return spiral(arr, accum);
}

function column(arr, index) {
    const res = [];
    for (let i = 0; i < arr.length; i++) {
        const elm = arr[i].splice(index, 1)[0];
        if (elm) {
            res.push(elm);
        }
    }
    return res;
}

// Merge Overlapping Intervals

function mergeOverlap(intervals) {
    intervals.sort(([minA], [minB]) => minA - minB);
    for (let i = 0; i < intervals.length; i++) {
        for (let j = i + 1; j < intervals.length; j++) {
            const [min, max] = intervals[i];
            const [laterMin, laterMax] = intervals[j];
            if (laterMin <= max) {
                const newMax = laterMax > max ? laterMax : max;
                const newInterval = [min, newMax];
                intervals[i] = newInterval;
                intervals.splice(j, 1);
                j = i;
            }
        }
    }
    return intervals;
}

// Find All Valid Math Expressions

function findAllValidMathExpressions(data) {
    let input = data[0];
    let target = data[1];
    let res = [];
    getExprUtil(res, "", input, target, 0, 0, 0);
    return res;
}
function getExprUtil(res, curExp, input, target, pos, curVal, last) {
    if (pos == input.length) {
        if (curVal == target)
            res.push(curExp);
        return;
    }

    for (let i = pos; i < input.length; i++) {
        if (i != pos && input[pos] == '0')
            break;

        let part = input.substr(pos, i + 1 - pos);

        let cur = parseInt(part, 10);

        if (pos == 0)
            getExprUtil(res, curExp + part, input,
                target, i + 1, cur, cur);


        else {
            getExprUtil(res, curExp + "+" + part, input,
                target, i + 1, curVal + cur, cur);
            getExprUtil(res, curExp + "-" + part, input,
                target, i + 1, curVal - cur, -cur);
            getExprUtil(res, curExp + "*" + part, input,
                target, i + 1, curVal - last + last * cur,
                last * cur);
        }
    }
}

// Array Jumping Game
function solveArrayJumpingGame(a, i) {
    var l = a.length;
    if (l == 0) return 0;
    if (i >= l) return 0;
    if (i == l - 1) {
        return 1;

    }
    var k = a[i];
    for (let j = 1; j <= k; ++j) {
        if (solveArrayJumpingGame(a, i + j)) {
            return 1;
        }
    }
    return 0;
}


function solveArrayJumpingGameII(a, i = 0, jumpCount = 0) {
    let l = a.length;
    if (l == 0) return 0;
    if (i >= l) return 0;
    if (i == l - 1) {
        return jumpCount;
    }
    let minJumpCount = 0;
    let k = a[i];
    for (let j = 1; j <= k; ++j) {
        var jc = solveArrayJumpingGameII(a, i + j, jumpCount + 1);
        if (jc > 0 && (minJumpCount == 0 || jc < minJumpCount)) {
            minJumpCount = jc;
        }
    }
    return minJumpCount;
}

// Subarray with Maximum Sum

function subarrayMaxSum(a) {
    if (a.length == 0) {
        return 0;
    }
    var l = a.length;
    var maxSum = a[0];
    for (let i = 0; i < l; i++) {
        var c = a[i];
        if (c > maxSum) {
            maxSum = c;
        }
        for (let j = i + 1; j < l; j++) {
            c += a[j];
            if (c > maxSum) {
                maxSum = c;
            }
        }
    }
    return maxSum;
}

// Sanitize Parentheses in Expression

function isParenthesis(c) {
    return ((c == '(') || (c == ')'));
}

function isValidString(str) {
    let cnt = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] == '(')
            cnt++;
        else if (str[i] == ')')
            cnt--;
        if (cnt < 0)
            return false;
    }
    return (cnt == 0);
}

function sanitizeParentheses(str) {
    var res = [];
    if (str.length == 0)
        return res;

    let visit = new Set();

    let q = [];
    let temp;
    let level = false;

    q.push(str);
    visit.add(str);
    while (q.length != 0) {
        str = q.shift();
        if (isValidString(str)) {
            res.push(str)
            level = true;
        }
        if (level)
            continue;
        for (let i = 0; i < str.length; i++) {
            if (!isParenthesis(str[i]))
                continue;

            temp = str.substring(0, i) + str.substring(i + 1);
            if (!visit.has(temp)) {
                q.push(temp);
                visit.add(temp);
            }
        }
    }
    return res;
}

// Total Ways to Sum

function totalWaysToSum(data) {
    let k = data;

    let dp = Array.from({ length: data + 1 }, (_, i) => 0);
    dp[0] = 1;

    for (let row = 1; row < k + 1; row++) {
        for (let col = 1; col < data + 1; col++) {
            if (col >= row) {
                dp[col] = dp[col] + dp[col - row];
            }
        }
    }
    return (dp[data] - 1);
}

function totalWaysToSumII(data) {
    const n = data[0];
    const s = data[1];
    const ways = [1];
    ways.length = n + 1;
    ways.fill(0, 1);
    for (let i = 0; i < s.length; i++) {
        for (let j = s[i]; j <= n; j++) {
            ways[j] += ways[j - s[i]];
        }
    }
    return ways[n];
}

// HammingCodes

function HammingEncode(value) {
    function HammingSumOfParity(lengthOfDBits) {
        return lengthOfDBits < 3 || lengthOfDBits == 0
            ? lengthOfDBits == 0
                ? 0
                : lengthOfDBits + 1
            :
            Math.ceil(Math.log2(lengthOfDBits * 2)) <=
                Math.ceil(Math.log2(1 + lengthOfDBits + Math.ceil(Math.log2(lengthOfDBits))))
                ? Math.ceil(Math.log2(lengthOfDBits) + 1)
                : Math.ceil(Math.log2(lengthOfDBits));
    }
    const data = parseInt(value).toString(2).split("");
    const sumParity = HammingSumOfParity(data.length);
    const count = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
    const build = ["x", "x", ...data.splice(0, 1)];
    for (let i = 2; i < sumParity; i++) {
        build.push("x", ...data.splice(0, Math.pow(2, i) - 1));
    }
    for (const index of build.reduce(function (a, e, i) {
        if (e == "x")
            a.push(i);
        return a;
    }, [])) {

        const tempcount = index + 1;
        const temparray = [];
        const tempdata = [...build];
        while (tempdata[index] !== undefined) {
            const temp = tempdata.splice(index, tempcount * 2);
            temparray.push(...temp.splice(0, tempcount));
        }
        temparray.splice(0, 1);
        build[index] = (count(temparray, "1") % 2).toString();
    }
    build.unshift((count(build, "1") % 2).toString());
    return build.join("");
}

function HammingDecode(data) {
    const build = data.split("");
    const testArray = [];
    const sumParity = Math.ceil(Math.log2(data.length));
    const count = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
    let overallParity = build.splice(0, 1).join("");
    testArray.push(overallParity == (count(build, "1") % 2).toString() ? true : false);
    for (let i = 0; i < sumParity; i++) {
        const tempIndex = Math.pow(2, i) - 1;
        const tempStep = tempIndex + 1;
        const tempData = [...build];
        const tempArray = [];
        while (tempData[tempIndex] != undefined) {
            const temp = [...tempData.splice(tempIndex, tempStep * 2)];
            tempArray.push(...temp.splice(0, tempStep));
        }
        const tempParity = tempArray.shift();
        testArray.push(tempParity == (count(tempArray, "1") % 2).toString() ? true : false);
    }
    let fixIndex = 0;
    for (let i = 1; i < sumParity + 1; i++) {
        fixIndex += testArray[i] ? 0 : Math.pow(2, i) / 2;
    }
    build.unshift(overallParity);
    if (fixIndex > 0 && testArray[0] == false) {
        build[fixIndex] = build[fixIndex] == "0" ? "1" : "0";
    }
    else if (testArray[0] == false) {
        overallParity = overallParity == "0" ? "1" : "0";
    }
    else if (testArray[0] == true && testArray.some((truth) => truth == false)) {
        return 0;
    }
    for (let i = sumParity; i >= 0; i--) {
        build.splice(Math.pow(2, i), 1);
    }
    build.splice(0, 1);
    return parseInt(build.join(""), 2);
}

function solveHammingDecodeContract(data) {
    return "" + HammingDecode(data);
}

// Shortest Path in Grid

class BinHeap {
    constructor() {
        this.data = [];
    }
    get size() {
        return this.data.length;
    }
    push(value, weight) {
        const i = this.data.length;
        this.data[i] = [weight, value];
        this.heapifyUp(i);
    }
    peek() {
        if (this.data.length == 0)
            return undefined;
        return this.data[0][1];
    }
    pop() {
        if (this.data.length == 0)
            return undefined;
        const value = this.data[0][1];
        this.data[0] = this.data[this.data.length - 1];
        this.data.length = this.data.length - 1;
        this.heapifyDown(0);
        return value;
    }
    changeWeight(predicate, weight) {
        const i = this.data.findIndex((e) => predicate(e[1]));
        if (i == -1)
            return;
        this.data[i][0] = weight;
        const p = Math.floor((i - 1) / 2);
        if (!this.heapOrderABeforeB(this.data[p][0], this.data[i][0]))
            this.heapifyUp(i);
        else
            this.heapifyDown(i);
    }
    heapifyUp(i) {
        while (i > 0) {
            const p = Math.floor((i - 1) / 2);
            if (this.heapOrderABeforeB(this.data[p][0], this.data[i][0]))
                break;
            const tmp = this.data[p];
            this.data[p] = this.data[i];
            this.data[i] = tmp;
            i = p;
        }
    }
    heapifyDown(i) {
        while (i < this.data.length) {
            const l = i * 2 + 1;
            const r = i * 2 + 2;
            let toSwap = i;
            if (l < this.data.length && this.heapOrderABeforeB(this.data[l][0], this.data[toSwap][0]))
                toSwap = l;
            if (r < this.data.length && this.heapOrderABeforeB(this.data[r][0], this.data[toSwap][0]))
                toSwap = r;
            if (i == toSwap)
                break;
            const tmp = this.data[toSwap];
            this.data[toSwap] = this.data[i];
            this.data[i] = tmp;
            i = toSwap;
        }
    }
}
class MinHeap extends BinHeap {
    heapOrderABeforeB(weightA, weightB) {
        return weightA < weightB;
    }
}
class PathStep {
    constructor(fy, fx, ty, tx) {
        this.fromY = fy;
        this.fromX = fx;
        this.toY = ty;
        this.toX = tx;
    }
    toString() {
        if (this.fromY < this.toY) {
            return "D";
        }
        if (this.fromY > this.toY) {
            return "U";
        }
        if (this.fromX < this.toX) {
            return "R";
        }
        if (this.fromX > this.toX) {
            return "L";
        }
        return "";
    }
}
function shortestPathInGrid(data) {
    const width = data[0].length;
    const height = data.length;
    const dstY = height - 1;
    const dstX = width - 1;
    const distance = new Array(height);
    const queue = new MinHeap();
    const cameFrom = new Map();
    for (let y = 0; y < height; y++) {
        distance[y] = new Array(width).fill(Infinity);
    }
    function validPosition(y, x) {
        return y >= 0 && y < height && x >= 0 && x < width && data[y][x] == 0;
    }
    function* neighbors(y, x) {
        if (validPosition(y - 1, x))
            yield [y - 1, x];
        if (validPosition(y + 1, x))
            yield [y + 1, x];
        if (validPosition(y, x - 1))
            yield [y, x - 1];
        if (validPosition(y, x + 1))
            yield [y, x + 1];
    }
    distance[0][0] = 0;
    queue.push([0, 0], 0);
    while (queue.size > 0) {
        const [y, x] = queue.pop();
        for (const [yN, xN] of neighbors(y, x)) {
            const d = distance[y][x] + 1;
            if (d < distance[yN][xN]) {
                if (distance[yN][xN] == Infinity)
                    queue.push([yN, xN], d);
                else
                    queue.changeWeight(([yQ, xQ]) => yQ == yN && xQ == xN, d);
                distance[yN][xN] = d;
                cameFrom.set(yN + "," + xN, [y, x]);
            }
        }
    }
    if (distance[dstY][dstX] == Infinity)
        return "";
    const thePath = new Array();
    let current = [dstY, dstX];
    while (!(current[0] == 0 && current[1] == 0)) {
        let from = cameFrom.get(current[0] + "," + current[1]);
        thePath.unshift(new PathStep(from[0], from[1], current[0], current[1]));
        current = from;
    }
    return thePath.map(p => p.toString()).join("");
}

// Proper 2-Coloring of a Graph

function proper2ColoringOfAGraph(data) {
    function neighbourhood(vertex) {
        const adjLeft = data[1].filter(([a]) => a == vertex).map(([, b]) => b);
        const adjRight = data[1].filter(([, b]) => b == vertex).map(([a]) => a);
        return adjLeft.concat(adjRight);
    }

    const coloring = Array(data[0]).fill(undefined);
    while (coloring.some((val) => val === undefined)) {
        const initialVertex = coloring.findIndex((val) => val === undefined);
        coloring[initialVertex] = 0;
        const frontier = [initialVertex];

        while (frontier.length > 0) {
            const v = frontier.pop() || 0;
            const neighbors = neighbourhood(v);

            for (const id in neighbors) {
                const u = neighbors[id];

                if (coloring[u] === undefined) {
                    if (coloring[v] === 0) coloring[u] = 1;
                    else coloring[u] = 0;

                    frontier.push(u);
                }

                else if (coloring[u] === coloring[v]) {
                    return "[]";
                }
            }
        }
    }

    return coloring;
}

// Compression III

function compressionIII(data) {
    let cur_state = Array.from(Array(10), () => Array(10).fill(null));
    let new_state = Array.from(Array(10), () => Array(10));
    function set(state, i, j, str) {
        const current = state[i][j];
        if (current == null || str.length < current.length) {
            state[i][j] = str;
        }
        else if (str.length === current.length && Math.random() < 0.5) {
            state[i][j] = str;
        }
    }

    cur_state[0][1] = "";
    for (let i = 1; i < data.length; ++i) {
        for (const row of new_state) {
            row.fill(null);
        }
        const c = data[i];
        for (let length = 1; length <= 9; ++length) {
            const string = cur_state[0][length];
            if (string == null) {
                continue;
            }
            if (length < 9) {
                set(new_state, 0, length + 1, string);
            }
            else {
                set(new_state, 0, 1, string + "9" + data.substring(i - 9, i) + "0");
            }
            for (let offset = 1; offset <= Math.min(9, i); ++offset) {
                if (data[i - offset] === c) {
                    set(new_state, offset, 1, string + length + data.substring(i - length, i));
                }
            }
        }

        for (let offset = 1; offset <= 9; ++offset) {
            for (let length = 1; length <= 9; ++length) {
                const string = cur_state[offset][length];
                if (string == null) {
                    continue;
                }
                if (data[i - offset] === c) {
                    if (length < 9) {
                        set(new_state, offset, length + 1, string);
                    }
                    else {
                        set(new_state, offset, 1, string + "9" + offset + "0");
                    }
                }

                set(new_state, 0, 1, string + length + offset);
                for (let new_offset = 1; new_offset <= Math.min(9, i); ++new_offset) {
                    if (data[i - new_offset] === c) {
                        set(new_state, new_offset, 1, string + length + offset + "0");
                    }
                }
            }
        }
        const tmp_state = new_state;
        new_state = cur_state;
        cur_state = tmp_state;
    }
    let result = null;
    for (let len = 1; len <= 9; ++len) {
        let string = cur_state[0][len];
        if (string == null) {
            continue;
        }
        string += len + data.substring(data.length - len, data.length);
        if (result == null || string.length < result.length) {
            result = string;
        }
        else if (string.length === result.length && Math.random() < 0.5) {
            result = string;
        }
    }
    for (let offset = 1; offset <= 9; ++offset) {
        for (let len = 1; len <= 9; ++len) {
            let string = cur_state[offset][len];
            if (string == null) {
                continue;
            }
            string += len + "" + offset;
            if (result == null || string.length < result.length) {
                result = string;
            }
            else if (string.length === result.length && Math.random() < 0.5) {
                result = string;
            }
        }
    }
    return result !== null && result !== void 0 ? result : "";
}

//Compression II: LZ Decompression

function decompressII(data) {
    let plain = "";
    for (let i = 0; i < data.length;) {
        const literal_length = data.charCodeAt(i) - 0x30;
        if (literal_length < 0 || literal_length > 9 || i + 1 + literal_length > data.length) {
            return null;
        }
        plain += data.substring(i + 1, i + 1 + literal_length);
        i += 1 + literal_length;
        if (i >= data.length) {
            break;
        }
        const backref_length = data.charCodeAt(i) - 0x30;
        if (backref_length < 0 || backref_length > 9) {
            return null;
        }
        else if (backref_length === 0) {
            ++i;
        }
        else {
            if (i + 1 >= data.length) {
                return null;
            }
            const backref_offset = data.charCodeAt(i + 1) - 0x30;
            if ((backref_length > 0 && (backref_offset < 1 || backref_offset > 9)) || backref_offset > plain.length) {
                return null;
            }
            for (let j = 0; j < backref_length; ++j) {
                plain += plain[plain.length - backref_offset];
            }
            i += 2;
        }
    }
    return plain;
}

// Compression I: RLE Compression

function rleCompress(data) {
    let response = "";
    if (data === "") {
        return response;
    }

    let currentRun = "";
    let runLength = 0;

    function addEncodedRun(char, length) {
        while (length > 0) {
            if (length >= 9) {
                response += "9" + char;
            } else {
                response += String(length) + char;
            }
            length -= 9;
        }
    }

    for (let c of data) {
        if (currentRun === "") {
            currentRun = c;
            runLength = 1;
        } else if (currentRun === c) {
            runLength++;
        } else if (currentRun !== c) {
            addEncodedRun(currentRun, runLength);
            currentRun = c;
            runLength = 1;
        }
    }
    addEncodedRun(currentRun, runLength);
    return response;
}

// Encryption I: Caesar Cipher

function caesarCipher(data) {
    const cipher = [...data[0]]
        .map((a) => (a === " " ? a : String.fromCharCode(((a.charCodeAt(0) - 65 - data[1] + 26) % 26) + 65)))
        .join("");
    return cipher;
}

// Encryption II: Vigenère Cipher

function vigenereCipher(data) {
    const cipher = [...data[0]]
        .map((a, i) => {
            return a === " "
                ? a
                : String.fromCharCode(((a.charCodeAt(0) - 2 * 65 + data[1].charCodeAt(i % data[1].length)) % 26) + 65);
        })
        .join("");
    return cipher;
}

// Square Root
function solveSquareRoot(data) {
    try {
        let n = BigInt(data);
        if (n < 0n) return "[]";
        if (n === 0n) return "0";

        let x0 = n / 2n;
        if (x0 !== 0n) {
            let x1 = (x0 + n / x0) / 2n;
            while (x1 < x0) {
                x0 = x1;
                x1 = (x0 + n / x0) / 2n;
            }
            let diff0 = n - (x0 * x0);
            let diff1 = ((x0 + 1n) * (x0 + 1n)) - n;

            if (diff1 < diff0) {
                return (x0 + 1n).toString();
            }
            return x0.toString();
        }
        return "1";
    } catch (e) {
        return "$SENTINEL_NO_SOLVER$";
    }
}

// Total Number of Primes
function solveTotalPrimes(data) {
    try {
        let start = 0;
        let end = 0;

        if (Array.isArray(data)) {
            start = parseInt(data[0], 10);
            end = parseInt(data[1], 10);
        } else {
            start = 0;
            end = parseInt(data, 10);
        }

        if (isNaN(start) || isNaN(end) || end < 2) return 0;

        start = Math.max(start, 2);

        let sieve = new Uint8Array(end + 1);
        for (let p = 2; p * p <= end; p++) {
            if (sieve[p] === 0) {
                for (let i = p * p; i <= end; i += p) {
                    sieve[i] = 1;
                }
            }
        }

        let count = 0;
        for (let i = start; i <= end; i++) {
            if (sieve[i] === 0) {
                count++;
            }
        }

        return count;
    } catch (e) {
        return "$SENTINEL_NO_SOLVER$";
    }
}

// Largest Rectangle in a Matrix
function solveLargestRectangle(matrix) {
    try {
        if (!matrix || matrix.length === 0 || matrix[0].length === 0) return "[]";

        let maxArea = 0;
        let bestCoords = "[]";
        let heights = new Array(matrix[0].length).fill(0);

        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                heights[col] = (matrix[row][col] == 0) ? heights[col] + 1 : 0;
            }

            let stack = [];
            for (let i = 0; i <= heights.length; i++) {
                let h = (i === heights.length ? 0 : heights[i]);

                while (stack.length > 0 && h < heights[stack[stack.length - 1]]) {
                    let heightIndex = stack.pop();
                    let height = heights[heightIndex];
                    let right = i;
                    let left = stack.length === 0 ? -1 : stack[stack.length - 1];
                    let width = right - left - 1;
                    let area = height * width;

                    if (area > maxArea) {
                        maxArea = area;
                        let r1 = row - height + 1;
                        let c1 = left + 1;
                        let r2 = row;
                        let c2 = right - 1;

                        bestCoords = JSON.stringify([[r1, c1], [r2, c2]]);
                    }
                }
                stack.push(i);
            }
        }

        return bestCoords;
    } catch (e) {
        return "$SENTINEL_NO_SOLVER$";
    }
}
`;

// ============================================================================
// BACKDOOR — aus HELPERS hierher verschoben. Backtick-/${-frei.
// ============================================================================
// BACKDOOR (v3.0) — One-Shot, gestartet vom DISPATCHER (nicht mehr von der Queen).
//
// ENTFERNT: das busy-Flag auf Port 10. Engine-Beweis (Singularity.ts:548):
//   installBackdoor() nutzt netscriptDelay() — das markiert nur den AUFRUFENDEN
//   SKRIPT-PROZESS als beschäftigt. Es ruft KEIN Player.startWork() auf und
//   berührt Player.currentWork nicht. Es gibt also keinen Konflikt mit WORK
//   (Crime/Gym/Faction). Der ganze Focus-Handshake war überflüssig.
//
// VORAUSSETZUNGEN je Ziel (netscriptCanHack, "backdoor"):
//   kein eigener Server, Root vorhanden, requiredHackingSkill <= hackingLevel.
//   -> Rooten allein reicht NICHT. Deshalb der Level-Filter unten.
// connect() springt nur zu NACHBARN -> der BFS-Pfad wird Schritt für Schritt gegangen.
const SRC_BACKDOOR = `/** SCHWARM-BACKDOOR (Payload, One-Shot, gestartet vom DISPATCHER)
 *
 * ZWEI BETRIEBSARTEN:
 *   run SCHWARM-BACKDOOR.js <host>   EIN Ziel. So startet der Dispatcher ihn seit
 *                                    v10.4 — mehrere Prozesse parallel, einer je
 *                                    Ziel. Die Wartezeit je Backdoor ist
 *                                    calculateHackingTime/4; sequenziell summiert
 *                                    sich das auf Minuten, parallel laufen sie
 *                                    gleichzeitig ab.
 *   run SCHWARM-BACKDOOR.js          Sammelmodus (Rueckfallebene fuer den Aufruf
 *                                    von Hand): alle offenen Ziele nacheinander.
 *
 * KEIN TERMINAL NOETIG. ns.singularity.connect() setzt die Verbindung
 * programmatisch; installBackdoor() arbeitet auf dem so gesetzten Server. Es wird
 * KEIN Terminal-Eingabefeld angefasst und KEIN Tastaturereignis erzeugt.
 *
 * PARALLELBETRIEB IST SICHER (Singularity.ts:518-556): installBackdoor() liest
 * Player.getCurrentServer() einmal und haelt den Server in einer lokalen Konstante
 * fest, BEVOR netscriptDelay() laeuft. Ein anderer Prozess, der waehrend der
 * Wartezeit die Verbindung wechselt, beeinflusst den laufenden Backdoor nicht mehr.
 * ns.singularity.connect() ist synchron, also kann zwischen der connect-Kette und
 * dem Einfrieren kein anderes Skript dazwischenkommen (Netscript unterbricht nur an
 * await-Punkten).
 *
 * W0R1D_D43M0N IST HART AUSGESCHLOSSEN. Engine (Singularity.ts:552): ein Backdoor
 * dort ruft Router.toPage(Page.BitVerse) und BEENDET DIE BITNODE. Doktrin: das
 * loest der Spieler selbst aus.
 *
 * VORAUSSETZUNGEN je Ziel (netscriptCanHack, "backdoor"): kein eigener Server,
 * Root vorhanden, requiredHackingSkill <= hackingLevel. Rooten allein reicht nicht.
 *
 * connect() springt nur zu NACHBARN (oder zu backdoored/eigenen Servern), deshalb
 * wird der BFS-Pfad Schritt fuer Schritt gegangen.
 *
 * @param {NS} ns
 */
/*__PORTS__*/
export async function main(ns) {
    ns.disableLog("ALL");

    const WORLD_DAEMON = "w0r1d_d43m0n";   // NIE automatisch backdooren
    // v0.7 — AUSSER die QUEEN hat es fuer GENAU DIESE Node freigegeben.
    // Der Port kommt ueber die Ports-Marke herein (injectPorts ersetzt sie),
    // Frist von 30 s sorgt dafuer, dass eine tote QUEEN keine alte Freigabe
    // stehen laesst. Ohne Freigabe aendert sich nichts: der Server wird wie
    // bisher uebersprungen.
    let weltdaemonFrei = false;
    try {
        const p = ns.peek(SCHWARM_PORTS.PLAN_OUT);
        if (typeof p === "string" && p.length && p !== "NULL PORT DATA") {
            const o = JSON.parse(p);
            weltdaemonFrei = o && String(o.weg).toLowerCase() === "weltdaemon"
                && (Date.now() - Number(o.ts || 0) < 30000);
        }
    } catch (e) { weltdaemonFrei = false; }
    const only = ns.args.length > 0 ? String(ns.args[0]) : null;

    // Netz per BFS abbilden + Eltern-Zeiger fuer den Connect-Pfad merken.
    const parent = { home: null };
    const seen = new Set(["home"]);
    const queue = ["home"];
    while (queue.length) {
        const h = queue.shift();
        let nb = [];
        try { nb = ns.scan(h); } catch (e) { nb = []; }
        for (const n of nb) if (!seen.has(n)) { seen.add(n); parent[n] = h; queue.push(n); }
    }
    const pathTo = (t) => { const p = []; let c = t; while (c !== null && c !== undefined) { p.unshift(c); c = parent[c]; } return p; };

    const hl = ns.getHackingLevel();
    let done = 0, failed = 0, skipped = 0;

    // Zielmenge: EIN Ziel (Dispatcher-Modus) oder alle (Sammelmodus von Hand).
    const list = only ? [only] : [...seen];

    for (const host of list) {
        if (host === "home") continue;
        if (host === WORLD_DAEMON && !weltdaemonFrei) {
            ns.tprint("WARN  [BACKDOOR] " + WORLD_DAEMON + " wird NICHT automatisch backdoored — "
                + "das beendet die BitNode. Das machst du selbst.");
            skipped++;
            continue;
        }
        if (host === WORLD_DAEMON) {
            ns.tprint("WARN  [BACKDOOR] " + WORLD_DAEMON + " ist per Plan FREIGEGEBEN — der "
                + "Backdoor beendet jetzt die BitNode.");
        }
        if (!seen.has(host)) { ns.print("Unbekannter Host: " + host); failed++; continue; }
        let s;
        try { s = ns.getServer(host); } catch (e) { continue; }
        // Zweite Pruefung: bei parallelen Laeufen kann ein anderer Prozess
        // schneller gewesen sein.
        if (s.purchasedByPlayer || s.backdoorInstalled) continue;
        if (!s.hasAdminRights || (s.requiredHackingSkill || 0) > hl) { skipped++; continue; }

        // Connect-Pfad Schritt fuer Schritt gehen (connect nur zu Nachbarn).
        // Der Pfad beginnt bei home und ist damit unabhaengig davon, wo ein
        // paralleler Prozess die Verbindung gerade hinterlassen hat.
        let ok = true;
        for (const step of pathTo(host)) {
            let r = false; try { r = ns.singularity.connect(step); } catch (e) { r = false; }
            if (!r) { ok = false; break; }
        }
        if (!ok) { failed++; ns.print("Pfad nicht gangbar: " + host); continue; }
        try { await ns.singularity.installBackdoor(); done++; ns.print("Backdoor: " + host); }
        catch (e) { failed++; ns.print("Fehlgeschlagen: " + host + " (" + e + ")"); }
    }

    // connect() zieht den Terminal-Server des Spielers mit. Am Ende zurueck auf home,
    // damit der Spieler nicht irgendwo im Netz "aufwacht". Bei parallelen Laeufen
    // macht das jeder Prozess — der letzte gewinnt, und das ist immer home.
    try { ns.singularity.connect("home"); } catch (e) {}
    if (only) {
        if (done > 0) ns.tprint("INFO  [BACKDOOR] " + only + " backdoored.");
    } else {
        ns.print("BACKDOOR fertig: " + done + " neu, " + failed + " fehlgeschlagen, " + skipped + " uebersprungen.");
        if (done > 0) ns.tprint("INFO  [BACKDOOR] " + done + " Backdoor(s) installiert.");
    }
}
`;

// ============================================================================
// PAYLOAD-REGISTER  (Schluessel -> { file, src })  +  materialize()
// ============================================================================

// ============================================================================
// DAEMON-PAYLOADS (v0.2) — kodiert (Backtick/\${ -> ASCII-Sentinels, siehe HELPERS).
// Quelle: die jeweiligen SCHWARM-*.js. decodePayload() stellt sie zur Laufzeit her.
// ============================================================================
const SRC_GO = `/**
 * SCHWARM-GO.js — v0.7
 *
 * v0.7 — --VERIFY BEKAM NIE EINE ANTWORT. Die RPC-Ports standen hier als
 *   Zahlen (29 rein, 30 raus), aus einer Zeit vor der Porttabelle. INFO liest
 *   Auftraege laengst aus INFO_IN und antwortet auf INFO_RPC_RES; 29 ist heute
 *   AKTIV_OUT (Eingabe-Stempel des DASHBOARD). Die Nummern kommen jetzt aus
 *   SCHWARM_PORTS, Format und Ablauf bleiben gleich.
 *
 * v0.6 — SLUM SNAKES IST DER SCHLUESSEL ZUM SCHUMMELN, NICHT BALLAST.
 *   Im Kopf der Rotationstabelle stand der Rat, den Gegner nach der
 *   Gang-Gruendung auf 0 zu setzen: sein Bonus "crime success rate" wirke ja
 *   nicht auf die Gang. Der Vordersatz stimmt, die Folgerung war falsch.
 *
 *   Der Bonus multipliziert Player.mults.crime_success (effect.ts:77), und
 *   genau dieser Wert steht in der Formel fuer die Schummel-Chance:
 *       0.6 * (0.7 - 0.02*cheatCount)^cheatCount * crime_success + SF-Bonus
 *   (netscriptGoImplementation.ts:566). Der Doppelzug ist der staerkste
 *   Hebel im Spiel — und crime_success ist die einzige Stellschraube daran.
 *   Ohne SF14.3 braucht CHEAT_MIN 0.85 ein crime_success von 1.417; darunter
 *   wird ueberhaupt nicht geschummelt.
 *
 *   Deshalb dreimal umgekehrt zum urspruenglichen Plan:
 *     1. Slum Snakes ist aus BONUS_GATE RAUS. Der Eintrag zeigte ausserdem
 *        auf den falschen Multiplikator (CrimeMoney statt CrimeSuccessRate).
 *     2. Selbst CrimeSuccessRate wuerde nichts aendern: dieser BitNode-Wert
 *        gilt nur fuer echte Verbrechen (Crime/Crime.ts:132), die
 *        Schummelformel nimmt crime_success roh.
 *     3. Solange die gemessene Schummel-Chance unter CHEAT_MIN liegt, wird
 *        der Gegner sogar AUFGEWERTET (SLUM_BOOST).
 *
 *   Gemessen wird der HOECHSTWERT der Chance, nicht der letzte: sie faellt
 *   innerhalb einer Partie mit jedem Cheat, ein niedriger Endwert sagt also
 *   nichts ueber den Spieler.
 *
 * v0.5 — BitNode-abhaengige Gewichte (bitNodeWeights, BONUS_GATE,
 *   ILLUMINATI_BOOST) und der 5x5-Farmmodus. Stand bisher nur im Code, nicht
 *   im Kopf — nachgetragen.
 *
 * v0.4 (Paket A+B+C: Gegnerprofile + Taktik + INFO-RPC-Diagnose)
 * Eigenständiger IPvGO-Daemon des Kybernetik-Schwarms (Bitburner v3.0.1).
 *
 * Änderung ggü. v0.3 (Basis: Influence-Map-Ausbau, Bilanz war 2W/13L vor v0.3):
 *
 *   PAKET A — GEGNERPROFILE (Beleg: goAI.ts, jeder Gegner = feste Prioritätenkette):
 *   - PROFILES[gegner]: STRAT-Overrides + Brettgröße je Gegner; Merge bei Partiestart
 *     in das aktive Strategieobjekt S (chooseMove/influenceMap lesen nur noch S).
 *   - Gewichtete Rotation statt Reihenfolge: pickOpponent() = argmin(games/gewicht)
 *     über CFG.ROTATION — selbstbalancierend, übersteht Neustarts (Stats-Datei).
 *     Gewichte aus effect.ts (bonusPower: Netburners 1.3 = Maximum) + BN9-Nutzen.
 *     Beleg scoring.ts: nodePower/Streak/Wins sind PRO GEGNER getrennt; Rotation
 *     kostet keinen Streak. Bonuswachstum ~ln(n)*n^0.3 → breit schlägt Fokus.
 *   - Brettgrößen-Logik: Difficulty = (komi+0.5)*0.25 hängt NUR am Komi (effect.ts),
 *     NICHT an der Brettgröße → nodePower/Zeit ist größenneutral, aber Streak-Aufbau
 *     (Cap ×3 ab 8 Siegen) und Favor (jeder 2. Serien-Sieg als Mitglied) zählen PRO
 *     PARTIE → leichte Gegner auf 9×9 (schnelle Partien), schwere auf 13×13 (Raum).
 *   - Illuminati-Farmmodus 5×5: getDifficultyMultiplier() hat den Sonderfall
 *     boardSize==5 && komi==7.5 → ×8 (statt 2.0). Winrate-Gate mit Hysterese:
 *     Einstieg erst ab GATE_WR auf 13×13, Ausstieg bei EXIT_WR auf 5×5 (Zustand
 *     farmMode persistiert). Verlust auf 5×5 kostet denselben Streak wie überall.
 *
 *   PAKET B — TAKTIKMODULE (alles pures JS, 0 GB):
 *   - LEITERLESER ladderCaptured(): goAI.ts getDefendMove() rettet Ketten NUR durch
 *     Ausdehnen (getLibertyGrowthMoves) — nie durch Gegenschlag, keine Vorausschau.
 *     Jede Gegner-KI (auch Illuminati) läuft daher in Leitern. Offensiv: neue
 *     Prio 3a "Leiterjagd" fängt 2-Freiheiten-Ketten mit bewiesener Leiter.
 *     Defensiv: Prio 2 rettet nur noch, wenn die Rettung trägt (≥3 Freiheiten oder
 *     Leiter gewonnen) — tote Ketten werden aufgegeben statt Steine nachzuwerfen.
 *   - SNAPBACK-Filter in Prio 1: Schlagzug, dessen Ergebnis-Kette 1 Freiheit hat
 *     und sofort größer zurückgeschlagen wird, wird verworfen (KI kennt den Trick
 *     nicht — wir fallen aber auch nicht selbst darauf herein).
 *   - SEMEAI-Check in Prio 3: Atari nur, wenn die Gegner-Rettung (Ausdehnen) nicht
 *     ihrerseits meine angrenzende Kette in Atari setzt (Wettrennen verloren).
 *     Dazu Score-Malus für Züge, die eigene Front-Ketten auf 2 Freiheiten drücken.
 *   - WANDPFLEGE: findDisputedTerritory (controlledTerritory.ts) betritt von mir
 *     umschlossene Räume NUR, wenn eine Wandkette ≤4 Freiheiten hat → Wandketten
 *     mit <5 Freiheiten (S.WALL_LIBS) bekommen Verstärkungs-Bonus. Gebiet mit
 *     ≥5-Freiheiten-Wänden ist für JEDE Gegner-KI unbetretbar.
 *   - ECKEN-BLOCKER: isCornerAvailableForMove (goAI.ts) verlangt einen KOMPLETT
 *     leeren 3×3-Eckbereich → ein früher eigener Stein auf dem 3-3-Punkt schaltet
 *     das corner()-Modul der KI dauerhaft ab (klassisch ohnehin guter Punkt).
 *   - KONTAKT-MALUS (Tetrads-Profil): deren pattern()-Priorität matcht 3×3-Formen
 *     nur bei Kontakt — Abstand halten in der Frühphase lässt Tetrads in den
 *     "Planlos-Modus" (Zufallswahl) fallen.
 *
 *   PAKET C — RAM-FIX über SCHWARM-INFO (Beleg: RamCostGenerator.ts go-Kosten):
 *   - Die vier teuren Analysis-Calls in runVerify (getValidMoves 8, getChains 16,
 *     getLiberties 16, getControlledEmptyNodes 16 = 56 GB) wurden bislang DIREKT
 *     aufgerufen. Da runVerify von main erreichbar ist, zählt der statische RAM-
 *     Scanner diese 56 GB IMMER mit → GO brauchte real ~66 GB statt der ~10 GB,
 *     die der Hot-Path (getBoardState 4 + makeMove 4 + Basis) tatsächlich nutzt.
 *   - Jetzt delegiert --verify diese Calls an SCHWARM-INFO über dessen eval-RPC
 *     (seit v0.7 ueber SCHWARM_PORTS; vorher 29/30). INFO hält 176 GB evalNs-Headroom; für GO kosten die Calls
 *     0 GB (nur String-Argumente). GOs eigenes cheat()-Wegwerf-Pattern taugt dafür
 *     NICHT: ein 16-GB-Analysis-Skript startet auf GOs kleinem Host nicht — nur
 *     INFO hat den Headroom. GO bleibt standalone (RPC-Format inline nachgebaut,
 *     kein HELPERS-Import). Fallback: antwortet INFO nicht, meldet --verify das
 *     und bricht sauber ab. Registry-minRam für GO entsprechend auf 16 gezogen.
 *   - Der Hot-Path (getBoardState/makeMove) bleibt DIREKT; die Cheat-Calls bleiben
 *     in GOs eigenem cheat()-Pattern (playTwoMoves ist Hot-Path, verträgt keinen
 *     seriellen RPC; billig genug für GOs Host, als Strings 0 GB statisch).
 *
 *   META:
 *   - STREAK-GUARD: ab Serien-Stand ≥ CFG.STREAK_GUARD keine Cheat-Doppelzüge mehr.
 *     Beleg netscriptGoImplementation.ts: kritischer Cheat-Fehlschlag →
 *     forceEndGoGame = Niederlage + Streak-Reset + null nodePower.
 *   - Winrate-Tracking pro Gegner×Brettgröße in /schwarm-go/stats.txt (ns.read/
 *     ns.write = 0 GB), Serie (streak) wird selbst geführt (getStats wäre zwar
 *     0 GB, aber die eigene Zählung deckt zugleich das Winrate-Gate ab).
 *   - Läuft beim Start bereits eine Partie, wird deren Gegner (getOpponent, 0 GB)
 *     übernommen statt blind zu rotieren.
 *
 * Fixes aus v0.1–v0.3 bleiben vollständig erhalten:
 *   - Ko/Superko: History erfasst auch den Zwischenzustand nach dem EIGENEN Zug.
 *   - Sperrliste __SCHWARM_BT__blocked__SCHWARM_BT__ je Board-Zustand für engine-abgelehnte Züge (Reset bei
 *     Zustandswechsel), Zug-Limit 600 als letztes Sicherheitsnetz.
 *   - Influence-Map-Ausbau (Framing/Front/Keil/Linien/Area-Scoring, Pass-Schwelle).
 *
 * Doktrin (unverändert):
 *   - VOLLSTÄNDIG STANDALONE: kein helpers.js, keine Imports.
 *   - RAM: getBoardState() 4 GB + makeMove() 4 GB laufen DIREKT (Hot-Path, blockt
 *     intern — Dodge wäre teurer). Teure Analysis-API (getChains 16 / getLiberties
 *     16 / getControlledEmptyNodes 16 / getValidMoves 8) wird NICHT benutzt: alles
 *     in purem JS = 0 GB. passTurn/opponentNextTurn/getGameState/getOpponent/
 *     resetBoardState = 0 GB → direkt. Cheat-API nur über cheat()-Wegwerf-Skripte.
 *   - Jede ns-nutzende Stelle ist try…catch-isoliert; der Loop crasht nie.
 *
 * Verifikations-Modus:  run SCHWARM-GO.js --verify
 *   Vergleicht die JS-Analyse (Ketten/Freiheiten/legale Züge/Territorium) gegen die
 *   echte (teure) API. Nach jedem Versionssprung einmal laufen lassen.
 *
 * @param {NS} ns
 */

/*__PORTS__*/

// =============================================================================
// KONFIGURATION
// =============================================================================

const GO_DIR = "/schwarm-go";     // Ordner für Wegwerf-Skripte (Cheats) + Stats-Datei

const CFG = {
    OPPONENT: "auto",             // fester Gegner ODER "auto" (gewichtete Rotation)
    // v0.4: GEWICHTETE Rotation (ersetzt OPPONENT_PRIORITY). pickOpponent() wählt
    // den Gegner mit dem kleinsten Verhältnis gespielte Partien / Gewicht.
    // Gewichte: bonusPower (effect.ts: NB 1.3, SS 1.2, DA 1.1, BH 0.9, TE/IL 0.7)
    // × Schwarm-Nutzen in BN9 (Hacknet!) × Schwierigkeit. 0 = Gegner aussetzen.
    // v0.6 — SLUM SNAKES NIEMALS AUF 0. Hier stand: "crime_success wirkt NICHT
    // auf die Gang — nach Gang-Gruendung ggf. auf 0 senken." Der erste Teil
    // stimmt, der Rat daraus ist falsch und haette geschadet.
    //   Der Slum-Snakes-Bonus multipliziert Player.mults.crime_success
    //   (Go/effects/effect.ts:77), und GENAU DIESER Wert steht in der Formel
    //   fuer die Schummel-Chance:
    //       0.6 * (0.7 - 0.02*cheatCount)^cheatCount * crime_success + SF-Bonus
    //   (Go/effects/netscriptGoImplementation.ts:566).
    //   Slum Snakes ist damit der EINZIGE Hebel auf das eigene Schummeln — und
    //   der Schwarm schummelt (CHEAT_MIN). Ohne SF14.3 liegt die Chance bei
    //   cheatCount 0 nur bei 0.6*crime_success; fuer CHEAT_MIN 0.85 braucht es
    //   also crime_success >= 1.417. Bis dahin wird gar nicht geschummelt.
    //   Deshalb steht Slum Snakes NICHT mehr im BONUS_GATE, und unten wird der
    //   Gegner sogar AUFGEWERTET, solange die Chance nicht reicht.
    // v0.5: Diese Werte sind nur noch der AUSGANGSPUNKT. bitNodeWeights()
    // rechnet sie je BitNode um — siehe dort. Die alte Tabelle war fuer BN9
    // gestimmt ("Schwarm-Nutzen in BN9 (Hacknet!)"), und dort ist Netburners
    // mit Abstand am wertvollsten. In BN8 zahlt derselbe Bonus auf
    // HacknetNodeMoney = 0 ein, also auf nichts.
    ROTATION: {
        "Netburners": 3,
        "Daedalus": 2,
        "Illuminati": 2,
        "Slum Snakes": 1,
        "The Black Hand": 1,
        "Tetrads": 1,
    },
    // v0.5: Welcher BitNode-Multiplikator entscheidet, ob der Bonus eines
    // Gegners ueberhaupt etwas wert ist? Steht der auf 0, ist das Gewicht 0 —
    // der Gegner wird ausgesetzt, statt Partien zu verbrennen.
    //   Netburners     "increased hacknet production"  -> HacknetNodeMoney
    //   The Black Hand "hacking money"                 -> ScriptHackMoneyGain
    //
    // v0.6: Slum Snakes ist hier RAUS. Der Eintrag war doppelt falsch:
    //   1. FALSCHER MULTIPLIKATOR. Der Bonus heisst "crime success rate" und
    //      wirkt auf crime_success — dazu gehoert CrimeSuccessRate, nicht
    //      CrimeMoney. Ein BitNode mit CrimeMoney 0 haette den Gegner
    //      abgeschaltet, obwohl sein Bonus weiter wirkt.
    //   2. FALSCHE PRAEMISSE. Selbst CrimeSuccessRate 0 wuerde nichts aendern:
    //      dieser BitNode-Multiplikator wird NUR auf echte Verbrechen
    //      angewandt (Crime/Crime.ts:132). Die Schummelformel in
    //      netscriptGoImplementation.ts:566 nimmt Player.mults.crime_success
    //      ROH. Der Bonus hilft dem Schummeln also in jedem BitNode.
    // Daedalus (Reputation), Tetrads (Kampfstats) und Illuminati (schnellere
    // h/g/w) haengen an keinem Multiplikator, der sie wertlos machen koennte —
    // sie behalten ihr Grundgewicht.
    BONUS_GATE: {
        "Netburners": "HacknetNodeMoney",
        "The Black Hand": "ScriptHackMoneyGain",
    },
    // v0.6: Aufschlag fuer Slum Snakes, solange die Schummel-Chance unter
    // CHEAT_MIN liegt. Dann bringt jede andere Partie zwar ihren Bonus, aber
    // der Doppelzug — der staerkste Hebel im Spiel — bleibt gesperrt.
    SLUM_BOOST: 4,
    // v0.5: Zahlt Hacking kein Geld (BN8), ist die Kursbeeinflussung die einzige
    // Quelle — und deren Engpass sind ABGESCHLOSSENE grow/hack-Aufrufe je Minute,
    // nicht Threads. Illuminatis Bonus ("faster hack(), grow(), and weaken()")
    // wirkt damit direkt auf die Geldmaschine. Dazu kommt der 5x5-Sonderfall
    // (Schwierigkeit 8 statt 2). Beides zusammen rechtfertigt den Aufschlag.
    ILLUMINATI_BOOST: 3,
    BOARD_SIZE: 13,               // Fallback, wenn ein Gegner kein Profil hat
    LOOP_MS: 200,                 // kleiner Sicherheits-Takt (makeMove/opponentNextTurn blocken ohnehin)
    IDLE_MS: 5000,                // Takt, falls kein Spiel startbar ist
    CHEAT_MIN: 0.85,              // Cheats NUR ab dieser Erfolgschance (Fehlschlag kann Partie kosten)
    STREAK_GUARD: 6,              // ab dieser Siegesserie KEINE Cheats mehr (forceEndGoGame-Risiko);
                                  // Streak-Mult-Cap liegt bei 8 (scoring.ts) — die letzten Stufen
                                  // sind zu wertvoll für ein 15%-Restrisiko.
    // Illuminati-5×5-Farmmodus (Difficulty ×8 statt 2.0, effect.ts):
    FARM: {
        PROBE_GAMES: 6,           // v0.5: so viele Partien werden auf 5x5 SELBST gemessen,
                                  //  bevor entschieden wird (kurze Partien = billiger Test)
        GATE_GAMES: 12,           // Rueckfall-Tor ueber die Standardgroesse (nur noch,
                                  //  wenn der Probelauf die Quote verfehlt hat)
        GATE_WR: 0.85,            //  … mit dieser Winrate, bevor 5×5 versucht wird
        EXIT_GAMES: 8,            // Ausstieg: so viele jüngste 5×5-Partien …
        EXIT_WR: 0.6,             //  … unter dieser Winrate → zurück auf Standardgröße
    },
    STATS_FILE: GO_DIR + "/stats.txt",
    LOG_EVERY_MOVE: false,        // true = jeder Zug im Tail; false = nur Partie-Ende + Meilensteine
};

// Tuning der Ausbau-Heuristik (Prio 4/5) — BASISPROFIL. Gegnerprofile (PROFILES)
// überschreiben einzelne Werte; gelesen wird zur Laufzeit IMMER das aktive Objekt S.
const STRAT = {
    INF_RADIUS: 3,               // Einfluss-Reichweite eines Steins (Manhattan)
    INF_FALL: [4, 3, 2, 1],      // Einfluss nach Distanz 0..3
    SAFE_T: 5,                   // |Einfluss| ab hier gilt ein Feld als entschieden
    DEEP_FACTOR: 0.25,           // Gewicht für Felder tief im Gegnereinfluss (Invasion lohnt selten)
    W_GAIN: 0.8,                 // Gewicht des Gebietsgewinns (Framing/Front)
    WEDGE_BONUS: 7,              // Keil zwischen ≥2 unverbundene Gegnerketten (unterbindet Verbinden)
    CONNECT_BONUS: 6,            // stabilisiert eigene schwache Kette (≤2 Freiheiten → ≥3)
    CLUMP_MALUS: 3,              // pro berührter starker (≥4 Freiheiten) eigener Kette (Anti-Klumpen)
    LINE34_BONUS: 2.5,           // 3./4. Linie, solange das Brett offen ist (klassisch stark)
    LINE1_MALUS: 5,              // 1. Linie ohne jeden Kontakt (verschenkt)
    LINE2_MALUS: 2,              // 2. Linie ohne jeden Kontakt
    OWN_TERR_MALUS: 12,          // eigenes sicheres Gebiet füllen = Punkt vernichten
    NEUTRAL_BONUS: 1,            // neutraler Punkt = +1 bei Area-Scoring (Endspiel mitnehmen)
    PASS_T: -2,                  // bester Score darunter → passen statt sinnlos ziehen
    // --- v0.4: neue Stellschrauben (Paket B) ---
    EYE_BONUS: 6,                // Zug vervollständigt ein NEUES echtes Auge (Leben sichern)
    WALL_LIBS: 5,                // Wandketten unter dieser Freiheitszahl gelten als pflegebedürftig
                                 // (Engine-Schwelle: findDisputedTerritory invadiert bei ≤4)
    WALL_BONUS: 5,               // Verstärkungs-Bonus für pflegebedürftige Gebiets-Wandketten
    CORNER_BLOCK_BONUS: 4,       // Frühphase: 3-3-Punkt in komplett leerer Ecke besetzen
                                 // (deaktiviert das corner()-Modul der Gegner-KI dauerhaft)
    CONTACT_MALUS: 0,            // Malus je gegnernahem Punkt in der Frühphase (nur Tetrads > 0)
    SEMEAI_MALUS: 4,             // Zug drückt eigene Kette auf 2 Freiheiten neben stärkerem Feind
    LADDER_DEPTH: 32,            // Leiterleser: max. Halbzüge Vorausschau
    LADDER_BRANCH: 8,            // Leiterleser: max. Verzweigungs-Budget (seltene Doppeljagden)
};

// v0.4: Gegnerprofile — Brettgröße + STRAT-Overrides. Beleg je Zeile: goAI.ts.
//   Netburners   nie "smart", verteidigt Atari nicht, schlägt nicht gezielt
//                → tief einschnüren lohnt (DEEP_FACTOR hoch). 9×9: schnelle
//                Partien = schneller Streak-Cap + Favor-Takt (Begründung oben).
//   Slum Snakes  rettet sich (defendCapture zuerst), schlägt selbst kaum,
//                Growth-fixiert ohne Augen → großräumig einschnüren.
//   Black Hand   capture/surround-fixiert, baut NIE eigene Augen (kein eyeMove
//                in der Kette) → früh 2 echte Augen sichern (EYE_BONUS hoch),
//                Kompaktheit ist hier richtig (CLUMP_MALUS runter).
//   Tetrads      pattern-fixiert (3×3-Formen, nur lokal) → Kontakt meiden bis
//                Mittelspiel (CONTACT_MALUS), großräumig rahmen.
//   Daedalus     90% Illuminati-Logik → wie Illuminati spielen.
//   Illuminati   dichteste Kette, aber: keine Leiterlesung, Territoriums-Tabu
//                bei ≥5-Freiheiten-Wänden → Framing + Wandpflege. farmSize 5
//                aktiviert den ×8-Farmmodus hinter dem Winrate-Gate.
const PROFILES = {
    "Netburners":     { size: 9,  strat: { DEEP_FACTOR: 0.6, W_GAIN: 1.0 } },
    "Slum Snakes":    { size: 9,  strat: { DEEP_FACTOR: 0.45 } },
    "The Black Hand": { size: 13, strat: { EYE_BONUS: 12, CLUMP_MALUS: 1.5, CONNECT_BONUS: 8 } },
    "Tetrads":        { size: 13, strat: { CONTACT_MALUS: 4, W_GAIN: 1.0 } },
    "Daedalus":       { size: 13, strat: { WALL_BONUS: 8 } },
    "Illuminati":     { size: 13, farmSize: 5, strat: { WALL_BONUS: 8 } },
};

// Aktives Strategieobjekt (Basis + Profil-Overrides). Wird je Partie gesetzt.
let S = Object.assign({}, STRAT);
function applyProfile(opponent) {
    const p = PROFILES[opponent];
    S = Object.assign({}, STRAT, (p && p.strat) || {});
}

// Board-Zeichen der Engine.  "." leer | "X" wir (Router) | "O" Gegner | "#" toter/offline Knoten
const ME = "X", ENEMY = "O", EMPTY = ".", DEAD = "#";

// =============================================================================
// MINI-WERKZEUGE
// =============================================================================

/** Stabiler String-Hash (Dateinamen der Cheat-Wegwerf-Skripte). */
function _hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
}

/** Schlanker Zahlenformatierer. */
function fmt(n) {
    if (n == null || !isFinite(n)) return "?";
    const a = Math.abs(n);
    if (a >= 1e12) return (n / 1e12).toFixed(2) + "t";
    if (a >= 1e9) return (n / 1e9).toFixed(2) + "b";
    if (a >= 1e6) return (n / 1e6).toFixed(2) + "m";
    if (a >= 1e3) return (n / 1e3).toFixed(2) + "k";
    return String(Math.round(n));
}

/**
 * RAM-DODGE NUR FÜR CHEATS: wertet einen ns-Ausdruck in einem Wegwerf-Skript aus.
 * __SCHWARM_BT__expr__SCHWARM_BT__ ist ein String wie "ns.go.cheat.getCheatCount()". Der (teure/SF-gesperrte)
 * Call steckt NUR im erzeugten Skript → der Daemon zahlt und riskiert ihn nicht.
 * Wirft der Ausdruck (kein SF14.2) → das Skript schreibt "" → wir liefern null.
 * @returns {Promise<any|null>}
 */
async function cheat(ns, expr) {
    try {
        const id = _hash(expr);
        const out = __SCHWARM_BT____SCHWARM_DC__GO_DIR}/r___SCHWARM_DC__id}.txt__SCHWARM_BT__;
        const src = __SCHWARM_BT____SCHWARM_DC__GO_DIR}/s___SCHWARM_DC__id}.js__SCHWARM_BT__;
        const body =
            __SCHWARM_BT__/** @param {NS} ns */\\nexport async function main(ns){__SCHWARM_BT__ +
            __SCHWARM_BT__ try{ ns.write(__SCHWARM_DC__JSON.stringify(out)}, JSON.stringify(__SCHWARM_DC__expr}), "w"); }__SCHWARM_BT__ +
            __SCHWARM_BT__ catch(e){ ns.write(__SCHWARM_DC__JSON.stringify(out)}, "", "w"); } }__SCHWARM_BT__;
        if (ns.read(src) !== body) ns.write(src, body, "w");
        const pid = ns.run(src, { temporary: true });
        if (!pid) return null;
        let guard = 0;
        while (ns.isRunning(pid) && guard++ < 2000) await ns.sleep(15);
        const raw = ns.read(out);
        return raw === "" ? null : JSON.parse(raw);
    } catch (e) { return null; }
}

// =============================================================================
// STATISTIK (v0.4) — Winrate/Serie pro Gegner×Brettgröße, persistent (0 GB).
// =============================================================================

let STATS = { opp: {} };   // opp[name] = { streak, farmMode, sizes: { "13": {g,w,recent[]} } }

function loadStats(ns) {
    let next = null;
    try {
        const raw = ns.read(CFG.STATS_FILE);
        if (raw) next = JSON.parse(raw);
    } catch (e) { next = null; /* korrupte Datei → frisch */ }
    STATS = (next && typeof next === "object" && next.opp) ? next : { opp: {} };
}
function saveStats(ns) {
    try { ns.write(CFG.STATS_FILE, JSON.stringify(STATS), "w"); } catch (e) { /* egal */ }
    publishGoStats(ns);
}

/**
 * Lagebild an DIAG (v0.5, Port GO_OUT).
 *
 * WARUM UEBER EINEN PORT: die Statistik liegt in CFG.STATS_FILE — und GO laeuft
 * auf einem pserv. ns.read liest NUR lokal, DIAG sitzt auf home und kam an die
 * Zahlen also gar nicht heran. Ohne diesen Kanal liesse sich weder das Farm-Tor
 * noch ein Serienschutz an echten Daten entscheiden; man muesste raten.
 *
 * Kosten: peek/clear/tryWrite sind 0 GB. Geschrieben wird nur bei Aenderung
 * (saveStats), also je Partie-Ende, nicht je Zug.
 */
function publishGoStats(ns) {
    try {
        const opp = {};
        for (const name in STATS.opp) {
            const o = STATS.opp[name];
            const sizes = {};
            for (const k in (o.sizes || {})) {
                const s = o.sizes[k];
                const wr = s.recent && s.recent.length
                    ? s.recent.reduce((a, b) => a + b, 0) / s.recent.length : null;
                sizes[k] = { g: s.g || 0, w: s.w || 0, wr: wr === null ? null : Math.round(wr * 100) };
            }
            opp[name] = {
                streak: o.streak || 0,
                farm: !!o.farmMode,
                probed: !!o.farmProbed,
                sizes: sizes,
            };
        }
        const h = ns.getPortHandle(SCHWARM_PORTS.GO_OUT);
        h.clear();
        h.tryWrite(JSON.stringify({ ts: Date.now(), opp: opp, weights: activeWeights || CFG.ROTATION }));
    } catch (e) {
        // Frueher stand hier ein leeres catch — und genau das hat einen echten
        // Fehler ueber Stunden verdeckt: dem Payload fehlte die Marke
        // /*__PORTS__*/, SCHWARM_PORTS war also gar nicht definiert, und der
        // ReferenceError verschwand hier lautlos. Port 23 blieb leer, DIAG
        // meldete "GO hat noch keine Partie beendet" — obwohl GO fehlerfrei
        // spielte. Eine Diagnose, die ihre eigenen Fehler verschluckt, ist
        // schlimmer als keine.
        try { ns.print("WARN publishGoStats: " + String(e)); } catch (e2) { /* dann eben nicht */ }
    }
}
function oppStats(name) {
    const o = STATS.opp[name] || (STATS.opp[name] = { streak: 0, farmMode: false, sizes: {} });
    if (!o.sizes) o.sizes = {};
    return o;
}
function sizeStats(name, size) {
    const o = oppStats(name), k = String(size);
    return o.sizes[k] || (o.sizes[k] = { g: 0, w: 0, recent: [] });
}
function totalGames(name) {
    const o = STATS.opp[name];
    if (!o || !o.sizes) return 0;
    let g = 0;
    for (const k in o.sizes) g += o.sizes[k].g || 0;
    return g;
}
function recentWR(name, size) {
    const s = sizeStats(name, size);
    if (!s.recent.length) return null;
    return s.recent.reduce((a, b) => a + b, 0) / s.recent.length;
}
function recordResult(ns, name, size, won) {
    const o = oppStats(name), s = sizeStats(name, size);
    s.g++; if (won) s.w++;
    s.recent.push(won ? 1 : 0);
    if (s.recent.length > 20) s.recent.shift();
    o.streak = won ? (o.streak >= 0 ? o.streak + 1 : 1)
                   : (o.streak <= 0 ? o.streak - 1 : -1);
    saveStats(ns);
}

// =============================================================================
// BOARD-ANALYSE — reines JS, 0 GB.  Board = string[]; Zugriff board[x][y].
// Wir spielen immer als ME ("X"). Alle Funktionen sind seiteneffektfrei.
// =============================================================================

/** board (string[]) -> 2D-Char-Array grid[x][y] + size. */
function parse(board) {
    const size = board.length;
    const grid = [];
    for (let x = 0; x < size; x++) {
        const row = new Array(size);
        for (let y = 0; y < size; y++) row[y] = board[x][y];
        grid.push(row);
    }
    return { size, grid };
}

/** Orthogonale Nachbarn von (x,y), auf dem Brett. */
function neigh(x, y, size) {
    const r = [];
    if (x > 0) r.push([x - 1, y]);
    if (x < size - 1) r.push([x + 1, y]);
    if (y > 0) r.push([x, y - 1]);
    if (y < size - 1) r.push([x, y + 1]);
    return r;
}

/**
 * Kette (zusammenhängende gleichfarbige Steine, 4er-Nachbarschaft) ab (x,y).
 * @returns {{points:[number,number][], libs:Set<string>}} Punkte + Freiheits-Koordinaten.
 */
function chainAt(grid, size, x, y) {
    const color = grid[x][y];
    const seen = new Set([x + "," + y]);
    const stack = [[x, y]];
    const points = [];
    const libs = new Set();
    while (stack.length) {
        const [cx, cy] = stack.pop();
        points.push([cx, cy]);
        for (const [nx, ny] of neigh(cx, cy, size)) {
            const c = grid[nx][ny];
            if (c === EMPTY) { libs.add(nx + "," + ny); continue; }
            if (c === color && !seen.has(nx + "," + ny)) {
                seen.add(nx + "," + ny);
                stack.push([nx, ny]);
            }
        }
    }
    return { points, libs };
}

/** Alle Ketten einer Farbe: Array von {points, libs}. */
function chainsOf(grid, size, color) {
    const done = new Set();
    const out = [];
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (grid[x][y] !== color || done.has(x + "," + y)) continue;
        const ch = chainAt(grid, size, x, y);
        for (const [px, py] of ch.points) done.add(px + "," + py);
        out.push(ch);
    }
    return out;
}

/** Tiefe Kopie des Grids. */
function cloneGrid(grid) { return grid.map(r => r.slice()); }

/**
 * Simuliert den Zug __SCHWARM_BT__color__SCHWARM_BT__ auf (x,y): schlägt zuerst gegnerische Ketten ohne
 * Freiheit, prüft dann Selbstmord. Ändert das übergebene Grid NICHT.
 * @returns {{grid:string[][], captured:number}|null} null = illegaler Zug (Selbstmord).
 */
function simulate(grid, size, x, y, color) {
    if (grid[x][y] !== EMPTY) return null;
    const g = cloneGrid(grid);
    g[x][y] = color;
    const opp = color === ME ? ENEMY : ME;
    let captured = 0;
    // Gegnerische Nachbar-Ketten ohne Freiheit entfernen (schlagen).
    for (const [nx, ny] of neigh(x, y, size)) {
        if (g[nx][ny] !== opp) continue;
        const ch = chainAt(g, size, nx, ny);
        if (ch.libs.size === 0) {
            for (const [px, py] of ch.points) { g[px][py] = EMPTY; captured++; }
        }
    }
    // Selbstmord? Eigene Kette muss jetzt ≥1 Freiheit haben.
    const own = chainAt(g, size, x, y);
    if (own.libs.size === 0) return null;
    return { grid: g, captured };
}

/** Board-Signatur (Superko / Wiederholungsprüfung). */
function sig(grid) { return grid.map(r => r.join("")).join("/"); }

/**
 * Ist (x,y) ein ECHTES Auge für __SCHWARM_BT__color__SCHWARM_BT__? (nicht füllen!)
 * Heuristik (robust genug fürs Bot-Spiel): leerer Punkt, dessen orthogonale
 * Nachbarn ALLE eigene Steine (oder Wand) sind, und dessen Diagonalen
 * mehrheitlich eigen/Wand sind (Rand strenger).
 */
function isTrueEye(grid, size, x, y, color) {
    if (grid[x][y] !== EMPTY) return false;
    for (const [nx, ny] of neigh(x, y, size)) {
        const c = grid[nx][ny];
        if (c !== color && c !== DEAD) return false; // orthogonaler Nachbar nicht eigen → kein Auge
    }
    // Diagonalen
    const diag = [[x - 1, y - 1], [x - 1, y + 1], [x + 1, y - 1], [x + 1, y + 1]];
    let ownDiag = 0, offBoard = 0, enemyDiag = 0;
    for (const [dx, dy] of diag) {
        if (dx < 0 || dy < 0 || dx >= size || dy >= size) { offBoard++; continue; }
        const c = grid[dx][dy];
        if (c === color || c === DEAD) ownDiag++;
        else if (c === ENEMY || c === ME) enemyDiag++; // gegnerischer Stein auf Diagonale
    }
    // Am Rand/Ecke: keine gegnerische Diagonale erlaubt. Mitte: höchstens eine.
    if (offBoard > 0) return enemyDiag === 0;
    return enemyDiag <= 1;
}

/**
 * Territorium (grobe Schätzung): leere Regionen, die nur an eine Farbe grenzen.
 * @returns {{mine:number, theirs:number, neutral:number}}
 */
function territory(grid, size) {
    const seen = new Set();
    let mine = 0, theirs = 0, neutral = 0;
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (grid[x][y] !== EMPTY || seen.has(x + "," + y)) continue;
        const stack = [[x, y]];
        const region = [];
        let touchMe = false, touchEnemy = false;
        seen.add(x + "," + y);
        while (stack.length) {
            const [cx, cy] = stack.pop();
            region.push([cx, cy]);
            for (const [nx, ny] of neigh(cx, cy, size)) {
                const c = grid[nx][ny];
                if (c === ME) touchMe = true;
                else if (c === ENEMY) touchEnemy = true;
                else if (c === EMPTY && !seen.has(nx + "," + ny)) {
                    seen.add(nx + "," + ny); stack.push([nx, ny]);
                }
            }
        }
        if (touchMe && !touchEnemy) mine += region.length;
        else if (touchEnemy && !touchMe) theirs += region.length;
        else neutral += region.length;
    }
    return { mine, theirs, neutral };
}

/**
 * Einfluss-Karte: jeder Stein strahlt distanzabhängig aus (ME +, ENEMY −).
 * Positiv = mein Einfluss, negativ = Gegner, nahe 0 = umstritten (die "Front").
 * @returns {number[][]}
 */
function influenceMap(grid, size) {
    const inf = Array.from({ length: size }, () => new Array(size).fill(0));
    const R = S.INF_RADIUS, F = S.INF_FALL;
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        const c = grid[x][y];
        if (c !== ME && c !== ENEMY) continue;
        const s = c === ME ? 1 : -1;
        for (let dx = -R; dx <= R; dx++) {
            const rest = R - Math.abs(dx);
            for (let dy = -rest; dy <= rest; dy++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                inf[nx][ny] += s * F[Math.abs(dx) + Math.abs(dy)];
            }
        }
    }
    return inf;
}

/**
 * Besitzer-Karte der LEEREN Felder (Region-Flood wie territory()):
 * "M" = grenzt nur an mich, "T" = nur an Gegner, "N" = neutral/umstritten.
 * @returns {string[][]} (besetzte Felder = "")
 */
function ownerGrid(grid, size) {
    const own = Array.from({ length: size }, () => new Array(size).fill(""));
    const seen = new Set();
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (grid[x][y] !== EMPTY || seen.has(x + "," + y)) continue;
        const stack = [[x, y]];
        const region = [];
        let touchMe = false, touchEnemy = false;
        seen.add(x + "," + y);
        while (stack.length) {
            const [cx, cy] = stack.pop();
            region.push([cx, cy]);
            for (const [nx, ny] of neigh(cx, cy, size)) {
                const c = grid[nx][ny];
                if (c === ME) touchMe = true;
                else if (c === ENEMY) touchEnemy = true;
                else if (c === EMPTY && !seen.has(nx + "," + ny)) {
                    seen.add(nx + "," + ny); stack.push([nx, ny]);
                }
            }
        }
        const mark = touchMe && !touchEnemy ? "M" : touchEnemy && !touchMe ? "T" : "N";
        for (const [px, py] of region) own[px][py] = mark;
    }
    return own;
}

/**
 * Ketten-ID-Karte einer Farbe: id[x][y] = Ketten-Index (−1 sonst), libs[i] = Freiheiten
 * der Kette i. Ermöglicht O(1)-Lookups "welche Kette, wie stark" pro Feld.
 * @returns {{id:number[][], libs:number[]}}
 */
function chainIdGrid(grid, size, color) {
    const id = Array.from({ length: size }, () => new Array(size).fill(-1));
    const libs = [];
    let k = 0;
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (grid[x][y] !== color || id[x][y] !== -1) continue;
        const ch = chainAt(grid, size, x, y);
        for (const [px, py] of ch.points) id[px][py] = k;
        libs.push(ch.libs.size);
        k++;
    }
    return { id, libs };
}

// =============================================================================
// TAKTIKMODULE (v0.4, Paket B) — reines JS, 0 GB.
// =============================================================================

/**
 * LEITERLESER. Frage: Wird die Verteidiger-Kette am Ankerpunkt (ax,ay) — die
 * GENAU 1 Freiheit hat und deren Besitzer am Zug ist — sicher gefangen?
 *
 * Beleg goAI.ts: getDefendMove() rettet ausschließlich über getLibertyGrowthMoves
 * (Ausdehnen); Gegenschlag-Rettung und Vorausschau existieren nicht. Die KI dehnt
 * also in jede Leiter hinein. Wir lesen die Leiter vollständig:
 *   Verteidigerzüge = Ausdehnen auf die letzte Freiheit ODER Schlagen einer
 *   angrenzenden Angreiferkette mit 1 Freiheit (Leiterbrecher!).
 *   Danach: ≥3 Freiheiten → entkommen. ≤1 → dieser Pfad ist tot.
 *   Genau 2 → Angreifer probiert beide Freiheiten als nächste Jagdstation
 *   (nur Züge, die selbst ≥2 Freiheiten behalten und wieder Atari erzeugen).
 * Konservativ: Tiefen-/Budget-Überlauf ⇒ "nicht bewiesen" ⇒ false.
 * @returns {boolean} true = Kette fällt zwingend.
 */
function ladderCaptured(grid, size, ax, ay, depth, budget) {
    if (depth > S.LADDER_DEPTH || budget.n <= 0) return false;
    const defColor = grid[ax][ay];
    if (defColor !== ME && defColor !== ENEMY) return true;   // Anker weg = geschlagen
    const attColor = defColor === ME ? ENEMY : ME;
    const ch = chainAt(grid, size, ax, ay);
    if (ch.libs.size === 0) return true;
    if (ch.libs.size >= 2) return false;

    // Verteidigerzüge sammeln.
    const defMoves = [];
    const lib0 = [...ch.libs][0].split(",");
    defMoves.push([Number(lib0[0]), Number(lib0[1])]);
    const attSeen = new Set();
    for (const [px, py] of ch.points) for (const [nx, ny] of neigh(px, py, size)) {
        if (grid[nx][ny] !== attColor) continue;
        const key = nx + "," + ny;
        if (attSeen.has(key)) continue;
        const ac = chainAt(grid, size, nx, ny);
        for (const [qx, qy] of ac.points) attSeen.add(qx + "," + qy);
        if (ac.libs.size === 1) {
            const cl = [...ac.libs][0].split(",");
            defMoves.push([Number(cl[0]), Number(cl[1])]);
        }
    }

    for (const [dx, dy] of defMoves) {
        const sim1 = simulate(grid, size, dx, dy, defColor);
        if (!sim1) continue;                                   // illegal → kein Ausweg
        if (sim1.grid[ax][ay] !== defColor) return false;      // Anker gewandert? (kann bei
                                                               // Schlag-Rettung nicht passieren,
                                                               // Sicherheitsnetz) → nicht bewiesen
        const after = chainAt(sim1.grid, size, ax, ay);
        if (after.libs.size >= 3) return false;                // Flucht gelungen
        if (after.libs.size <= 1) continue;                    // weiter Atari → Pfad tot
        // Genau 2 Freiheiten: Angreifer jagt weiter.
        let attWins = false;
        for (const key of after.libs) {
            const p = key.split(",");
            const fx = Number(p[0]), fy = Number(p[1]);
            const sim2 = simulate(sim1.grid, size, fx, fy, attColor);
            if (!sim2) continue;
            if (sim2.grid[ax][ay] !== defColor) { attWins = true; break; } // direkt geschlagen
            const attStone = chainAt(sim2.grid, size, fx, fy);
            if (attStone.libs.size < 2) continue;              // Jagdstein in Selbst-Atari → keine Jagd
            const defAfter = chainAt(sim2.grid, size, ax, ay);
            if (defAfter.libs.size !== 1) continue;            // kein Atari mehr → keine Jagd
            budget.n--;
            if (ladderCaptured(sim2.grid, size, ax, ay, depth + 2, budget)) { attWins = true; break; }
        }
        if (!attWins) return false;                            // Verteidiger hat rettenden Pfad
    }
    return true;                                               // alle Verteidigerwege tot
}

/**
 * Offensive Leiterjagd: finde einen Zug, der eine gegnerische 2-Freiheiten-Kette
 * in eine BEWIESEN gewonnene Leiter zwingt. Größte Kette zuerst.
 * @returns {{m:object, len:number}|null}
 */
function ladderHuntMove(grid, size, legal) {
    const targets = chainsOf(grid, size, ENEMY).filter(c => c.libs.size === 2);
    if (!targets.length) return null;
    targets.sort((a, b) => b.points.length - a.points.length);
    for (const ch of targets) {
        const anchor = ch.points[0];
        for (const key of ch.libs) {
            const p = key.split(",");
            const lx = Number(p[0]), ly = Number(p[1]);
            const m = legal.find(z => z.x === lx && z.y === ly);
            if (!m) continue;
            if (m.ownLibs < 2) continue;                       // Jagdstein nie in Selbst-Atari
            if (m.grid[anchor[0]][anchor[1]] !== ENEMY) continue; // (Schlag wäre Prio 1)
            const after = chainAt(m.grid, size, anchor[0], anchor[1]);
            if (after.libs.size !== 1) continue;               // Zug erzeugt kein Atari
            const budget = { n: S.LADDER_BRANCH };
            if (ladderCaptured(m.grid, size, anchor[0], anchor[1], 0, budget))
                return { m, len: ch.points.length };
        }
    }
    return null;
}

/**
 * SNAPBACK gegen mich? Mein Schlagzug hinterlässt eine eigene Kette mit genau
 * 1 Freiheit — schlägt der Gegner dort sofort MEHR zurück, als ich gewann?
 */
function snapbackLoss(m, size) {
    if (m.ownLibs !== 1) return false;
    const own = chainAt(m.grid, size, m.x, m.y);
    const p = [...own.libs][0].split(",");
    const sim2 = simulate(m.grid, size, Number(p[0]), Number(p[1]), ENEMY);
    if (!sim2) return false;                                   // er kann nicht → kein Snapback
    return sim2.captured > m.captured;
}

/**
 * SEMEAI-Check für Prio 3: Ich setze eine 2er-Freiheiten-Kette in Atari — kann
 * der Gegner sich durch Ausdehnen retten UND dabei seinerseits eine meiner an
 * seine Rettung grenzenden Ketten in Atari setzen (bzw. sofort schlagen)?
 * Dann ist das Wettrennen verloren: Finger weg.
 */
function atariBackfires(m, anchor, size) {
    const after = chainAt(m.grid, size, anchor[0], anchor[1]);
    if (after.libs.size !== 1) return false;
    const p = [...after.libs][0].split(",");
    const rx = Number(p[0]), ry = Number(p[1]);
    const sim2 = simulate(m.grid, size, rx, ry, ENEMY);
    if (!sim2) return false;                                   // Rettung unmöglich → kein Rückschlag
    if (sim2.captured > 0) return true;                        // seine Rettung schlägt meine Steine
    const his = chainAt(sim2.grid, size, anchor[0], anchor[1]);
    if (his.libs.size < 2) return false;                       // er bleibt in Atari → ich gewinne
    let myMin = 99;
    for (const [nx, ny] of neigh(rx, ry, size)) {
        if (sim2.grid[nx][ny] !== ME) continue;
        const c = chainAt(sim2.grid, size, nx, ny);
        if (c.libs.size < myMin) myMin = c.libs.size;
    }
    return myMin <= 1;                                         // er rettet sich UND ich hänge in Atari
}

/** Entsteht durch den Zug ein NEUES echtes Auge für mich (Nachbarschaft)? */
function makesEye(m, grid0, size) {
    for (const [nx, ny] of neigh(m.x, m.y, size)) {
        if (m.grid[nx][ny] !== EMPTY) continue;
        if (isTrueEye(m.grid, size, nx, ny, ME) && !isTrueEye(grid0, size, nx, ny, ME)) return true;
    }
    return false;
}

/**
 * ECKEN-BLOCKER-Punkte: die vier 3-3-Zielpunkte der Gegner-KI, solange deren
 * 3×3-Eckbereich komplett leer und weitgehend intakt ist (Spiegel der Engine-
 * Prüfung isCornerAvailableForMove: ≥7 lebende Punkte, 0 Steine). Ein eigener
 * Stein dort schaltet das corner()-Modul der KI für diese Ecke dauerhaft ab.
 * @returns {Set<string>} "x,y"-Schlüssel
 */
function cornerBlockSet(grid, size) {
    const edge = size - 1, cm = edge - 2;
    const zones = [
        [cm, cm, edge, edge, cm, cm],
        [0, cm, 2, edge, 2, cm],
        [0, 0, 2, 2, 2, 2],
        [cm, 0, edge, 2, cm, 2],
    ];
    const out = new Set();
    for (const [x1, y1, x2, y2, tx, ty] of zones) {
        if (tx < 0 || ty < 0 || tx > edge || ty > edge) continue;
        let pieces = 0, live = 0;
        for (let x = Math.max(0, x1); x <= Math.min(edge, x2); x++) {
            for (let y = Math.max(0, y1); y <= Math.min(edge, y2); y++) {
                const c = grid[x][y];
                if (c === DEAD) continue;
                live++;
                if (c !== EMPTY) pieces++;
            }
        }
        if (live >= 7 && pieces === 0) out.add(tx + "," + ty);
    }
    return out;
}

// =============================================================================
// ZUG-WAHL (Heuristik)
// =============================================================================

/**
 * Wählt den besten Zug für ME. Gibt {x,y,reason} zurück oder null (→ passen).
 * Liest das AKTIVE Strategieobjekt S (Basis + Gegnerprofil).
 * @param {string[]} board
 * @param {Set<string>} history  Menge bereits gesehener Board-Signaturen (Superko).
 * @param {Set<string>} [blocked] Koordinaten ("x,y"), die die Engine für DIESEN Board-
 *   Zustand bereits abgelehnt hat (z.B. Superko-Edge-Case) — nicht erneut versuchen.
 */
function chooseMove(board, history, blocked) {
    const { size, grid } = parse(board);
    const isBlocked = blocked || new Set();

    // Alle legalen Züge (leer, kein Selbstmord, kein Superko) vorab sammeln,
    // inkl. simuliertem Ergebnis (captured, resultierende eigene Freiheiten).
    const legal = [];
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (grid[x][y] !== EMPTY) continue;
        if (isBlocked.has(x + "," + y)) continue;             // von der Engine bereits abgelehnt
        const sim = simulate(grid, size, x, y, ME);
        if (!sim) continue;                                   // Selbstmord
        if (history.has(sig(sim.grid))) continue;             // Superko / Wiederholung (vorab)
        const own = chainAt(sim.grid, size, x, y);
        legal.push({ x, y, captured: sim.captured, ownLibs: own.libs.size, grid: sim.grid });
    }
    if (legal.length === 0) return null;

    // --- Prio 1: Schlagen (größte Beute zuerst) — v0.4: Snapback-Filter ---
    const caps = legal.filter(m => m.captured > 0).sort((a, b) => b.captured - a.captured);
    for (const m of caps) {
        if (snapbackLoss(m, size)) continue;                  // Köder: er schlägt größer zurück
        return { x: m.x, y: m.y, reason: __SCHWARM_BT__schlägt __SCHWARM_DC__m.captured}__SCHWARM_BT__ };
    }

    // Eigene Ketten in Atari (genau 1 Freiheit) ermitteln.
    const myChains = chainsOf(grid, size, ME);
    const atariChains = myChains.filter(c => c.libs.size === 1);

    // --- Prio 2: Eigene Kette aus Atari retten — v0.4: nur wenn die Rettung TRÄGT ---
    // (≥3 Freiheiten, oder bei genau 2 Freiheiten: keine bewiesen verlorene Leiter.
    //  Aussichtslose Ketten werden aufgegeben statt Steine nachzuwerfen — die
    //  Gegner-KI kennt diesen Verzicht nicht, wir schon.)
    if (atariChains.length) {
        atariChains.sort((a, b) => b.points.length - a.points.length);
        for (const ch of atariChains) {
            const anchor = ch.points[0];
            const rescues = [];
            for (const m of legal) {
                if (m.grid[anchor[0]][anchor[1]] !== ME) continue; // Kette verschwunden? egal
                const after = chainAt(m.grid, size, anchor[0], anchor[1]);
                if (after.libs.size >= 2) rescues.push({ m, libs: after.libs.size });
            }
            rescues.sort((a, b) => b.libs - a.libs);
            for (const r of rescues) {
                if (r.libs === 2) {
                    const budget = { n: S.LADDER_BRANCH };
                    if (ladderCaptured(r.m.grid, size, anchor[0], anchor[1], 0, budget)) continue; // tote Leiter
                }
                return { x: r.m.x, y: r.m.y, reason: __SCHWARM_BT__rettet Kette (__SCHWARM_DC__ch.points.length}) aus Atari__SCHWARM_BT__ };
            }
            // keine tragfähige Rettung → Kette bewusst aufgeben, nächste prüfen
        }
    }

    // --- Prio 3a (v0.4): LEITERJAGD — 2-Freiheiten-Kette in gewonnene Leiter zwingen ---
    const hunt = ladderHuntMove(grid, size, legal);
    if (hunt) return { x: hunt.m.x, y: hunt.m.y, reason: __SCHWARM_BT__Leiterjagd auf __SCHWARM_DC__hunt.len}er-Kette__SCHWARM_BT__ };

    // --- Prio 3b: Gegner in Atari setzen (Kette von 2 → 1 Freiheit) — v0.4: Semeai-Check ---
    const enemyChains = chainsOf(grid, size, ENEMY);
    let atariMove = null, atariScore = 0;
    for (const ch of enemyChains) {
        if (ch.libs.size !== 2) continue;                    // 1 wäre bereits Prio 1 (schlagbar)
        for (const key of ch.libs) {
            const p = key.split(",");
            const lx = Number(p[0]), ly = Number(p[1]);
            const m = legal.find(z => z.x === lx && z.y === ly);
            if (!m) continue;
            const anchor = ch.points[0];
            if (m.grid[anchor[0]][anchor[1]] !== ENEMY) continue;
            const after = chainAt(m.grid, size, anchor[0], anchor[1]);
            if (after.libs.size !== 1) continue;
            if (atariBackfires(m, anchor, size)) continue;    // Wettrennen verloren → lassen
            const score = ch.points.length + m.ownLibs * 0.1; // große Beute + sicherer Stein
            if (score > atariScore) { atariScore = score; atariMove = m; }
        }
    }
    if (atariMove) return { x: atariMove.x, y: atariMove.y, reason: __SCHWARM_BT__Atari auf __SCHWARM_DC__atariScore | 0}er-Kette__SCHWARM_BT__ };

    // --- Prio 4/5: Ausbau — Influence-Map-Heuristik (Framing, Keil, Front) ---
    // Belohnt EINFLUSSGEWINN über umstrittene Felder statt Kontakt zu eigenen
    // Steinen. Filter: kein Self-Atari, kein Auge füllen. v0.4 ergänzt: Augen-Bonus,
    // Wandpflege, Ecken-Blocker, Kontakt-Malus (Tetrads), Semeai-Malus.
    const inf = influenceMap(grid, size);
    const owner = ownerGrid(grid, size);
    const eChains = chainIdGrid(grid, size, ENEMY);
    const mChains = chainIdGrid(grid, size, ME);
    let stones = 0;
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (grid[x][y] !== EMPTY) stones++;
    const early = stones / (size * size) < 0.6;              // Brett noch offen?

    // v0.4 WANDPFLEGE: eigene Ketten, die an eigenes Gebiet ("M") grenzen und
    // < S.WALL_LIBS Freiheiten haben. Engine-Beleg: findDisputedTerritory
    // invadiert eingeschlossene Räume nur bei Wandketten mit ≤4 Freiheiten.
    const needy = new Set();
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        const cid = mChains.id[x][y];
        if (cid < 0 || mChains.libs[cid] >= S.WALL_LIBS || needy.has(cid)) continue;
        for (const [nx, ny] of neigh(x, y, size)) {
            if (owner[nx][ny] === "M") { needy.add(cid); break; }
        }
    }

    // v0.4 ECKEN-BLOCKER: nur in der Frühphase relevant.
    const cornerBlocks = early ? cornerBlockSet(grid, size) : new Set();

    let best = null, bestScore = -Infinity;
    for (const m of legal) {
        if (isTrueEye(grid, size, m.x, m.y, ME)) continue;   // eigenes Auge NIE füllen
        if (m.ownLibs < 2) continue;                          // Self-Atari meiden
        let score = m.captured * 5 + m.ownLibs * 0.3;

        // 1) Gebietsgewinn: wie viel UMSTRITTENES/gegnerisches Leerfeld bestrahlt der Zug?
        //    Felder, die schon sicher meins sind, bringen nichts (Anti-Klumpen per Design).
        let gain = 0;
        const R = S.INF_RADIUS;
        for (let dx = -R; dx <= R; dx++) {
            const rest = R - Math.abs(dx);
            for (let dy = -rest; dy <= rest; dy++) {
                if (!dx && !dy) continue;
                const nx = m.x + dx, ny = m.y + dy;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                if (grid[nx][ny] !== EMPTY) continue;
                const cur = inf[nx][ny];
                if (cur >= S.SAFE_T) continue;                // schon sicher meins
                const w = S.INF_FALL[Math.abs(dx) + Math.abs(dy)];
                gain += w * (cur <= -S.SAFE_T ? S.DEEP_FACTOR : 1);
            }
        }
        score += gain * S.W_GAIN;

        // 2) Kontakt-Analyse: schwache eigene Kette stützen = gut; an starke kleben = Klumpen.
        const touchedMine = new Set();
        const touchedEnemy = new Set();
        let enemyTouch = 0, ownTouch = 0;
        for (const [nx, ny] of neigh(m.x, m.y, size)) {
            if (grid[nx][ny] === ME) { ownTouch++; touchedMine.add(mChains.id[nx][ny]); }
            else if (grid[nx][ny] === ENEMY) { enemyTouch++; touchedEnemy.add(eChains.id[nx][ny]); }
        }
        let weak = false, strongTouch = 0;
        for (const cid of touchedMine) {
            if (mChains.libs[cid] <= 2) weak = true;
            else if (mChains.libs[cid] >= 4) strongTouch++;
        }
        if (weak && m.ownLibs >= 3) score += S.CONNECT_BONUS;
        if (!weak) score -= strongTouch * S.CLUMP_MALUS;

        // 2b) v0.4 WANDPFLEGE: pflegebedürftige Gebiets-Wandkette verstärken.
        for (const cid of touchedMine) {
            if (needy.has(cid) && m.ownLibs > mChains.libs[cid]) { score += S.WALL_BONUS; break; }
        }

        // 2c) v0.4 AUGEN-BONUS: Zug vervollständigt ein neues echtes Auge (Leben!).
        if (S.EYE_BONUS > 0 && (ownTouch > 0) && makesEye(m, grid, size)) score += S.EYE_BONUS;

        // 2d) v0.4 SEMEAI-Malus: eigene Kette auf 2 Freiheiten drücken, während eine
        //     berührte Gegnerkette stärker ist → Wettrennen droht verloren zu gehen.
        if (m.ownLibs === 2 && touchedEnemy.size) {
            let eMax = 0;
            for (const eid of touchedEnemy) if (eChains.libs[eid] > eMax) eMax = eChains.libs[eid];
            if (eMax > 2) score -= S.SEMEAI_MALUS;
        }

        // 3) Keil: liegt der Zug zwischen ≥2 UNVERBUNDENEN Gegnerketten (Manhattan ≤2)?
        //    Genau das Gegenmittel gegen "verstreute Steine später verbinden".
        const wedgeIds = new Set();
        for (let dx = -2; dx <= 2; dx++) {
            const rest = 2 - Math.abs(dx);
            for (let dy = -rest; dy <= rest; dy++) {
                const nx = m.x + dx, ny = m.y + dy;
                if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
                const eid = eChains.id[nx][ny];
                if (eid >= 0) wedgeIds.add(eid);
            }
        }
        if (wedgeIds.size >= 2) score += S.WEDGE_BONUS + (wedgeIds.size - 2) * 2;

        // 3b) v0.4 KONTAKT-MALUS (Tetrads-Profil): deren Pattern-Matcher sieht nur
        //     3×3-Umgebungen — ohne Kontakt fällt Tetrads in den Zufallsmodus.
        if (S.CONTACT_MALUS > 0 && early) {
            let near = enemyTouch;
            const dg = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dx, dy] of dg) {
                const nx = m.x + dx, ny = m.y + dy;
                if (nx >= 0 && ny >= 0 && nx < size && ny < size && grid[nx][ny] === ENEMY) near++;
            }
            if (near > 0) score -= S.CONTACT_MALUS * near;
        }

        // 3c) v0.4 ECKEN-BLOCKER: 3-3-Punkt in komplett leerer Ecke besetzen.
        if (early && cornerBlocks.has(m.x + "," + m.y)) score += S.CORNER_BLOCK_BONUS;

        // 4) Linien: 3./4. Linie stark, solange offen; 1./2. Linie ohne Kontakt schwach.
        const line = Math.min(m.x, m.y, size - 1 - m.x, size - 1 - m.y);
        if (early && (line === 2 || line === 3)) score += S.LINE34_BONUS;
        if (!enemyTouch && !ownTouch) {
            if (line === 0) score -= S.LINE1_MALUS;
            else if (line === 1) score -= S.LINE2_MALUS;
        }

        // 5) Eigenes sicheres Gebiet füllen vernichtet einen Punkt; neutrale Punkte
        //    sind bei Area-Scoring +1 (Endspiel-Dame mitnehmen).
        if (owner[m.x][m.y] === "M") score -= S.OWN_TERR_MALUS;
        else if (owner[m.x][m.y] === "N") score += S.NEUTRAL_BONUS;

        if (score > bestScore) { bestScore = score; best = m; }
    }
    // Unter der Pass-Schwelle ist jeder Zug Punktvernichtung (z.B. nur noch eigenes
    // Gebiet füllbar) → passen. Doppelpass beendet die Partie regulär.
    if (best && bestScore > S.PASS_T)
        return { x: best.x, y: best.y, reason: __SCHWARM_BT__Ausbau (Score __SCHWARM_DC__bestScore.toFixed(1)})__SCHWARM_BT__ };

    // Nichts Sinnvolles → passen (Partie zu Ende bringen).
    return null;
}

// =============================================================================
// VERIFIKATION (--verify): JS-Analyse gegen echte API abgleichen
// =============================================================================

/** Zählt Ketten einer Farbe in meiner JS-Analyse (für groben API-Abgleich). */
function myChainCount(board, color) {
    const { size, grid } = parse(board);
    return chainsOf(grid, size, color).length;
}

/** Baut meine legale-Züge-Matrix (boolean[x][y]) für Vergleich mit getValidMoves(). */
function myValidMatrix(board, history) {
    const { size, grid } = parse(board);
    const mat = [];
    for (let x = 0; x < size; x++) {
        const row = new Array(size).fill(false);
        for (let y = 0; y < size; y++) {
            if (grid[x][y] !== EMPTY) continue;
            const sim = simulate(grid, size, x, y, ME);
            if (!sim) continue;
            if (history.has(sig(sim.grid))) continue;
            row[y] = true;
        }
        mat.push(row);
    }
    return mat;
}

// =============================================================================
// INFO-RPC-CLIENT (nur --verify) — Ports aus SCHWARM_PORTS (v0.7).
// =============================================================================
// Die teure Analysis-API (getChains/getLiberties/getControlledEmptyNodes je 16,
// getValidMoves 8 GB) wird NICHT direkt aufgerufen: runVerify ist von main aus
// erreichbar, der statische RAM-Scanner zählt diese ~56 GB sonst IMMER mit und
// bläht GO von ~10 auf ~66 GB. Stattdessen delegiert der Diagnose-Modus die vier
// Calls an SCHWARM-INFO über dessen eval-RPC (INFO_IN rein, INFO_RPC_RES raus). INFO
// hält dafür 176 GB evalNs-Headroom bereit; für GO kosten die Calls 0 GB. Ein
// 16-GB-Wegwerfskript über GOs eigenes cheat()-Pattern würde auf GOs kleinem
// Host (16 GB) nicht starten — nur INFO hat den Headroom. Kein HELPERS-Import
// (GO bleibt standalone): Nachrichtenformat inline, identisch zu
// HELPERS.requestInfoAction / readInfoActionResult.
// v0.7: vorher 29/30 hartcodiert - 29 ist AKTIV_OUT, 30 schreibt niemand.
const INFO_RPC_REQ = SCHWARM_PORTS.INFO_IN, INFO_RPC_RES = SCHWARM_PORTS.INFO_RPC_RES, INFO_EMPTY_PORT = "NULL PORT DATA";

/**
 * Führt einen ns-Ausdruck über INFOs eval-RPC aus und wartet auf das Ergebnis.
 * @returns {Promise<any|undefined>} API-Ergebnis, oder undefined wenn INFO nicht
 *   antwortet (nicht aktiv / Timeout) bzw. der Ausdruck drüben geworfen hat.
 */
async function infoEval(ns, expr, timeoutMs = 8000) {
    const id = "v" + _hash(expr) + (Date.now() % 100000);
    try {
        const h = ns.getPortHandle(INFO_RPC_REQ);
        const req = JSON.stringify({ c: "GO", id, cmd: "eval", a: [expr], t: Date.now() });
        if (!h.tryWrite(req)) { await ns.sleep(200); if (!h.tryWrite(req)) return undefined; }
    } catch (e) { return undefined; }
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        await ns.sleep(150);
        try {
            const v = ns.peek(INFO_RPC_RES);
            if (v !== INFO_EMPTY_PORT && v !== "") {
                const o = JSON.parse(v);
                const r = o && o.GO && o.GO[id];
                if (r) return r.ok ? r.res : undefined;
            }
        } catch (e) { /* weiter pollen */ }
    }
    return undefined;
}

async function runVerify(ns) {
    ns.ui.openTail();
    ns.print("=== SCHWARM-GO --verify: JS-Analyse vs. API (Analysis-Calls via INFO-RPC) ===");

    // INFO-RPC-Vorabtest: die teuren Analysis-Calls laufen über SCHWARM-INFO,
    // damit GO selbst schlank bleibt. Ohne INFO kann --verify nicht abgleichen.
    const ping = await infoEval(ns, "1+1");
    if (ping !== 2) {
        ns.print("FEHLER: SCHWARM-INFO antwortet nicht auf den eval-RPC (INFO_IN/INFO_RPC_RES).");
        ns.print("        --verify delegiert die teure Analysis-API an INFO. Bitte INFO");
        ns.print("        starten (Queen-Registry) und --verify erneut ausführen.");
        return;
    }
    ns.print("OK: INFO-eval-RPC erreichbar.");

    // Sicherstellen, dass ein Brett existiert.
    let board = null;
    try { board = ns.go.getBoardState(); } catch (e) { /* unten */ }
    if (!board) {
        try { ns.go.resetBoardState("Netburners", 9); board = ns.go.getBoardState(); }
        catch (e) { ns.print(__SCHWARM_BT__FEHLER: kein Brett verfügbar: __SCHWARM_DC__e}__SCHWARM_BT__); return; }
    }
    const size = parse(board).size;

    // 1) getValidMoves — legale Züge vergleichen (History hier leer: Momentaufnahme)
    let apiValid = await infoEval(ns, "ns.go.analysis.getValidMoves()");
    if (!apiValid) ns.print("WARN getValidMoves via INFO: kein Ergebnis (Timeout/Fehler).");
    if (apiValid) {
        const mine = myValidMatrix(board, new Set());
        let diff = 0, checked = 0, sample = "";
        for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
            checked++;
            if (Boolean(apiValid[x][y]) !== Boolean(mine[x][y])) {
                diff++;
                if (sample.length < 80) sample += __SCHWARM_BT__ (__SCHWARM_DC__x},__SCHWARM_DC__y})API=__SCHWARM_DC__apiValid[x][y]}/JS=__SCHWARM_DC__mine[x][y]}__SCHWARM_BT__;
            }
        }
        ns.print(diff === 0
            ? __SCHWARM_BT__OK  getValidMoves: alle __SCHWARM_DC__checked} Felder stimmen.__SCHWARM_BT__
            : __SCHWARM_BT__ABWEICHUNG getValidMoves: __SCHWARM_DC__diff}/__SCHWARM_DC__checked} Felder.__SCHWARM_DC__sample}__SCHWARM_BT__);
    }

    // 2) getChains — Kettenzahl grob vergleichen
    let apiChains = await infoEval(ns, "ns.go.analysis.getChains()");
    if (!apiChains) ns.print("WARN getChains via INFO: kein Ergebnis (Timeout/Fehler).");
    if (apiChains) {
        const ids = new Set();
        for (let x = 0; x < apiChains.length; x++) for (let y = 0; y < apiChains[x].length; y++) {
            const v = apiChains[x][y];
            if (v !== null && v !== undefined) ids.add(v);
        }
        const mineCnt = myChainCount(board, ME) + myChainCount(board, ENEMY);
        ns.print(__SCHWARM_BT__INFO Ketten: API=__SCHWARM_DC__ids.size} | JS(X+O)=__SCHWARM_DC__mineCnt} __SCHWARM_BT__ +
            __SCHWARM_BT__(inkl. evtl. leerer Regionen in der API — grober Richtwert)__SCHWARM_BT__);
    }

    // 3) getLiberties — Freiheitszahl pro besetzter Zelle vergleichen
    let apiLibs = await infoEval(ns, "ns.go.analysis.getLiberties()");
    if (!apiLibs) ns.print("WARN getLiberties via INFO: kein Ergebnis (Timeout/Fehler).");
    if (apiLibs) {
        const { size: s2, grid } = parse(board);
        let diff = 0, checked = 0, sample = "";
        for (let x = 0; x < s2; x++) for (let y = 0; y < s2; y++) {
            if (grid[x][y] !== ME && grid[x][y] !== ENEMY) continue;
            const ch = chainAt(grid, s2, x, y);
            const a = apiLibs[x][y];
            checked++;
            if (a >= 0 && a !== ch.libs.size) {
                diff++; if (sample.length < 80) sample += __SCHWARM_BT__ (__SCHWARM_DC__x},__SCHWARM_DC__y})API=__SCHWARM_DC__a}/JS=__SCHWARM_DC__ch.libs.size}__SCHWARM_BT__;
            }
        }
        ns.print(diff === 0
            ? __SCHWARM_BT__OK  getLiberties: alle __SCHWARM_DC__checked} besetzten Felder stimmen.__SCHWARM_BT__
            : __SCHWARM_BT__ABWEICHUNG getLiberties: __SCHWARM_DC__diff}/__SCHWARM_DC__checked} Felder.__SCHWARM_DC__sample}__SCHWARM_BT__);
    }

    // 4) getControlledEmptyNodes — Territoriums-Zählung grob vergleichen
    let apiCtrl = await infoEval(ns, "ns.go.analysis.getControlledEmptyNodes()");
    if (!apiCtrl) ns.print("WARN getControlledEmptyNodes via INFO: kein Ergebnis (Timeout/Fehler).");
    if (apiCtrl) {
        // API-Format: string[] wie Board; "X"/"O" = kontrolliert, "?" = umstritten, "." = leer/neutral.
        let apiMine = 0, apiTheirs = 0;
        for (let x = 0; x < apiCtrl.length; x++) for (let y = 0; y < apiCtrl[x].length; y++) {
            const c = apiCtrl[x][y];
            if (c === ME) apiMine++; else if (c === ENEMY) apiTheirs++;
        }
        const t = territory(parse(board).grid, size);
        ns.print(__SCHWARM_BT__INFO Territorium: API X=__SCHWARM_DC__apiMine}/O=__SCHWARM_DC__apiTheirs} | __SCHWARM_BT__ +
            __SCHWARM_BT__JS X=__SCHWARM_DC__t.mine}/O=__SCHWARM_DC__t.theirs} (neutral __SCHWARM_DC__t.neutral}). __SCHWARM_BT__ +
            __SCHWARM_BT__Meine Zählung ist bewusst simpel — Richtwert, kein 1:1.__SCHWARM_BT__);
    }

    ns.print("=== --verify fertig. Bei 'OK' bei getValidMoves+getLiberties ist das " +
        "Fundament belastbar. ===");
}

// =============================================================================
// GEGNERWAHL & SPIELSTEUERUNG (v0.4)
// =============================================================================

/**
 * Gewichtete Rotation: Gegner mit kleinstem Verhältnis (gespielte Partien /
 * Gewicht) ist dran. Selbstbalancierend, neustart-fest (Stats-Datei), und
 * Streak-neutral (scoring.ts: Serien sind pro Gegner getrennt gespeichert).
 * CFG.OPPONENT !== "auto" übersteuert alles.
 */
/**
 * ROTATIONSGEWICHTE JE BITNODE (v0.5).
 *
 * Die Gewichte in CFG.ROTATION bewerten den BONUS-SKALAR (bonusPower aus
 * effect.ts) — nicht den NUTZEN des Bonus in dieser BitNode. Das ist derselbe
 * Denkfehler, der Bladeburner und Corp in BN8 als "verfuegbar" fuehrt, obwohl
 * beide dort wirtschaftlich tot sind: caps beantwortet "darf ich", nicht
 * "lohnt es sich".
 *
 * Konkret stand im Kopf der Tabelle "Schwarm-Nutzen in BN9 (Hacknet!)" — sie
 * war fuer BitNode 9 gestimmt. In BN8 ist HacknetNodeMoney 0, und Netburners
 * (hoechstes Gewicht, 3) zahlt damit auf nichts ein. Dasselbe gilt fuer
 * The Black Hand gegen ScriptHackMoneyGain 0.
 *
 * Quelle sind die Multiplikatoren aus dem bn-Block des INFO-Daemons (0 GB,
 * reiner peek). Fehlt INFO, bleiben die Grundgewichte stehen — konservativ,
 * denn ein faelschlich ausgesetzter Gegner waere schlimmer als ein leicht
 * falsch gewichteter.
 *
 * @returns {Object<string, number>} Gewichte, 0 = Gegner aussetzen.
 */
/**
 * Beste je gemessene Schummel-Chance.
 *
 * BEWUSST DAS MAXIMUM, nicht der letzte Wert: die Chance faellt INNERHALB einer
 * Partie mit jedem Cheat (Faktor (0.7 - 0.02*n)^n). Ein niedriger Messwert am
 * Partieende heisst also nicht, dass crime_success niedrig ist. Das Maximum
 * entspricht dem Wert bei cheatCount 0 — und nur der sagt etwas ueber den
 * Spieler aus. Da Go-Boni nur wachsen, veraltet das Maximum auch nicht.
 */
let besteCheatChance = null;

function bitNodeWeights(ns) {
    const w = Object.assign({}, CFG.ROTATION);
    let m = null;
    try {
        const raw = ns.peek(SCHWARM_PORTS.INFO_OUT);
        if (raw && raw !== "NULL PORT DATA") {
            const snap = JSON.parse(raw);
            const bn = snap && snap.blocks && snap.blocks.bn;
            if (bn && bn.ok && bn.data) m = bn.data.mults;
        }
    } catch (e) { m = null; }
    if (!m) return w;                       // ohne Wissen nichts veraendern

    for (const name in CFG.BONUS_GATE) {
        const key = CFG.BONUS_GATE[name];
        if (typeof m[key] === "number" && m[key] === 0) w[name] = 0;
    }
    // Illuminati aufwerten, wenn Hacking kein Geld bringt: dann ist die
    // Kursbeeinflussung die einzige Quelle, und ihr Engpass sind abgeschlossene
    // grow/hack-Aufrufe je Minute — genau das beschleunigt dieser Bonus.
    if (typeof m.ScriptHackMoneyGain === "number" && m.ScriptHackMoneyGain === 0) {
        w["Illuminati"] = (w["Illuminati"] || 1) * CFG.ILLUMINATI_BOOST;
    }
    // v0.6: Slum Snakes aufwerten, solange nicht geschummelt werden kann.
    // Der Doppelzug ist der staerkste Hebel im Spiel, und crime_success ist
    // die einzige Stellschraube daran (netscriptGoImplementation.ts:566).
    // Solange die gemessene Chance unter CHEAT_MIN liegt, zahlt sich jede
    // Slum-Snakes-Partie doppelt aus: eigener Bonus PLUS Weg zum Schummeln.
    // Noch nie gemessen (besteCheatChance null) heisst: es wurde noch nie
    // geschummelt — dann gilt dasselbe.
    if (besteCheatChance === null || besteCheatChance < CFG.CHEAT_MIN) {
        w["Slum Snakes"] = (w["Slum Snakes"] || 1) * CFG.SLUM_BOOST;
    }
    return w;
}

/** Zuletzt berechnete Gewichte — fuer die Diagnose auf Port GO_OUT. */
let activeWeights = null;

function pickOpponent(ns) {
    if (CFG.OPPONENT && CFG.OPPONENT !== "auto") return CFG.OPPONENT;
    const W = bitNodeWeights(ns);
    activeWeights = W;
    let best = null, bestKey = Infinity;
    for (const name in W) {
        const w = W[name];
        if (!w || w <= 0) continue;
        const key = totalGames(name) / w;
        if (key < bestKey) { bestKey = key; best = name; }
    }
    return best || "Netburners";
}

/**
 * Brettgröße je Gegner (Profil), inkl. Illuminati-5×5-Farmmodus mit
 * Winrate-Gate und Hysterese (Zustand farmMode persistiert in der Stats-Datei).
 */
function pickBoardSize(ns, name) {
    const p = PROFILES[name] || {};
    const base = p.size || CFG.BOARD_SIZE;
    if (!p.farmSize) return base;
    const f = CFG.FARM;
    const o = oppStats(name);
    const farm = sizeStats(name, p.farmSize);
    if (o.farmMode) {
        const wrFarm = recentWR(name, p.farmSize);
        if (farm.recent.length >= f.EXIT_GAMES && wrFarm !== null && wrFarm < f.EXIT_WR) {
            o.farmMode = false;
            farm.recent = [];            // frischer Anlauf beim nächsten Gate-Einstieg
            saveStats(ns);
            ns.print(__SCHWARM_BT__INFO [FARM] __SCHWARM_DC__name}: 5×5-Winrate __SCHWARM_DC__(wrFarm * 100) | 0}% < __SCHWARM_DC__(f.EXIT_WR * 100) | 0}% — zurück auf __SCHWARM_DC__base}×__SCHWARM_DC__base}.__SCHWARM_BT__);
            return base;
        }
        return p.farmSize;
    }
    // =====================================================================
    // v0.5 — DAS TOR MASS DIE FALSCHE GROESSE
    // =====================================================================
    // Bedingung war: GATE_GAMES (12) Partien auf der STANDARDGROESSE mit
    // GATE_WR (85 %) Siegquote. Zwei Probleme:
    //   1. Gegen Illuminati — den staerksten Gegner — sind 85 % auf 13x13 eine
    //      sehr hohe Huerde. Wird sie nie erreicht, wird der x8-Modus nie
    //      betreten, und der groesste Hebel des ganzen Spielers bleibt liegen.
    //   2. Sie misst das Falsche. 5x5 ist ein anderes Spiel: kaum Leitern,
    //      kaum Territorium, fast alles ist Nahkampf. Die 13x13-Quote sagt
    //      darueber wenig aus.
    // Da 5x5-Partien sehr kurz sind, ist der direkte Test billiger als die
    // Ableitung: PROBE_GAMES Partien auf 5x5 spielen und DORT messen. Faellt
    // die Quote unter EXIT_WR, greift die bestehende Hysterese und es geht
    // zurueck — der Probelauf kostet also hoechstens ein paar kurze Partien.
    if (farm.recent.length < f.PROBE_GAMES) {
        if (!o.farmProbed) {
            o.farmProbed = true;
            saveStats(ns);
            ns.print(__SCHWARM_BT__INFO [FARM] __SCHWARM_DC__name}: Probelauf __SCHWARM_DC__f.PROBE_GAMES} Partien auf __SCHWARM_DC__p.farmSize}x__SCHWARM_DC__p.farmSize} (Difficulty x8) — gemessen wird dort, nicht auf __SCHWARM_DC__base}x__SCHWARM_DC__base}.__SCHWARM_BT__);
        }
        return p.farmSize;
    }
    const wrProbe = recentWR(name, p.farmSize);
    if (wrProbe !== null && wrProbe >= f.EXIT_WR) {
        o.farmMode = true;
        saveStats(ns);
        ns.print(__SCHWARM_BT__OK [FARM] __SCHWARM_DC__name}: Probelauf __SCHWARM_DC__(wrProbe * 100) | 0}% auf __SCHWARM_DC__p.farmSize}x__SCHWARM_DC__p.farmSize} — Farmmodus (Difficulty x8) aktiv.__SCHWARM_BT__);
        return p.farmSize;
    }

    const sBase = sizeStats(name, base);
    const wrBase = recentWR(name, base);
    if (sBase.recent.length >= f.GATE_GAMES && wrBase !== null && wrBase >= f.GATE_WR) {
        o.farmMode = true;
        saveStats(ns);
        ns.print(__SCHWARM_BT__OK [FARM] __SCHWARM_DC__name}: Winrate __SCHWARM_DC__(wrBase * 100) | 0}% auf __SCHWARM_DC__base}×__SCHWARM_DC__base} — Farmmodus __SCHWARM_DC__p.farmSize}×__SCHWARM_DC__p.farmSize} (Difficulty ×8) aktiv.__SCHWARM_BT__);
        return p.farmSize;
    }
    return base;
}

// =============================================================================
// HAUPT
// =============================================================================

export async function main(ns) {
    ns.disableLog("ALL");

    // Doppelstart-Schutz (nur eine Instanz pro Host).
    try {
        const self = ns.getScriptName(), host = ns.getHostname();
        if (ns.ps(host).filter(p => p.filename === self).length > 1) return;
    } catch (e) { /* weiter */ }

    // Verifikations-Modus?
    if (ns.args.includes("--verify")) { await runVerify(ns); return; }

    // v3.0: KEIN Auto-Tail (Doktrin). Bei Bedarf: tail SCHWARM-GO.js
    ns.print("SCHWARM-GO v0.4 — Start (Profile + Leiter/Snapback/Semeai/Wand/Ecken).");
    loadStats(ns);
    // Sofort melden, nicht erst nach der ersten beendeten Partie. Sonst steht
    // im Pruefbericht minutenlang "GO laeuft nicht", obwohl GO laeuft.
    publishGoStats(ns);

    // --- Cheat-Check (einmalig, RAM-frei über cheat()) ---
    let CHEATS = false;
    const probe = await cheat(ns, "ns.go.cheat.getCheatCount()");
    if (probe !== null && probe !== undefined) {
        CHEATS = true;
        ns.print(__SCHWARM_BT__OK: Cheat-API verfügbar (SF14.2). Doppelzüge ab Chance __SCHWARM_DC__CFG.CHEAT_MIN}, Streak-Guard ab __SCHWARM_DC__CFG.STREAK_GUARD}.__SCHWARM_BT__);
    } else {
        ns.print("INFO: Cheat-API NICHT verfügbar (SF14.2 fehlt) — spiele normal weiter.");
    }

    let games = 0, wins = 0, losses = 0;

    // --- Hauptloop über beliebig viele Partien ---
    while (true) {
        let opponent = pickOpponent(ns);
        try {
            // Läuft schon ein Spiel? Dann DESSEN Gegner übernehmen; sonst neues Brett.
            let state = null;
            try { state = ns.go.getGameState(); } catch (e) { /* ignore */ }
            const inGame = state && state.currentPlayer !== "None";
            if (inGame) {
                try { const cur = ns.go.getOpponent(); if (cur && cur !== "No AI") opponent = cur; } catch (e) { /* egal */ }
            } else {
                const bsize = pickBoardSize(ns, opponent);
                try { ns.go.resetBoardState(opponent, bsize); }
                catch (e) {
                    ns.print(__SCHWARM_BT__WARN: resetBoardState('__SCHWARM_DC__opponent}') fehlgeschlagen: __SCHWARM_DC__e}. Warte…__SCHWARM_BT__);
                    await ns.sleep(CFG.IDLE_MS); continue;
                }
            }
            applyProfile(opponent);                 // v0.4: aktives Strategieprofil setzen

            const history = new Set();
            let running = true;
            let blocked = new Set();   // Züge, die die Engine für den AKTUELLEN Zustand abgelehnt hat
            let lastSig = null;        // Board-Signatur der letzten Iteration (Zustandswechsel-Erkennung)
            let turns = 0;             // Zug-Limit als letztes Sicherheitsnetz (Engine-Anomalie)
            let playedSize = 0;        // tatsächliche Brettgröße dieser Partie (fürs Tracking)

            // --- eine Partie zu Ende spielen ---
            while (running) {
                if (++turns > 600) { ns.print("WARN: Zug-Limit (600) erreicht — Partie-Schleife verlassen."); break; }
                let board;
                try { board = ns.go.getBoardState(); }
                catch (e) { ns.print(__SCHWARM_BT__WARN getBoardState: __SCHWARM_DC__e}__SCHWARM_BT__); await ns.sleep(CFG.LOOP_MS); continue; }
                if (!playedSize) playedSize = parse(board).size;

                const curSig = sig(parse(board).grid);
                // Zustandswechsel? -> Sperrliste zurücksetzen (galt nur für den alten Zustand).
                if (curSig !== lastSig) { blocked = new Set(); lastSig = curSig; }
                history.add(curSig);

                const move = chooseMove(board, history, blocked);

                // (Optionaler) Cheat-Doppelzug: nur wenn verfügbar, ein normaler Zug
                // existiert, die Erfolgschance hoch ist UND (v0.4) die Siegesserie
                // nicht auf dem Spiel steht (kritischer Fail = forceEndGoGame =
                // Niederlage + Serien-Reset, netscriptGoImplementation.ts).
                let result = null;
                const streakNow = oppStats(opponent).streak;
                if (CHEATS && move && streakNow < CFG.STREAK_GUARD) {
                    const ch = await cheat(ns, "ns.go.cheat.getCheatSuccessChance()");
                    if (ch !== null && (besteCheatChance === null || ch > besteCheatChance)) {
                        besteCheatChance = ch;    // v0.6: Hoechstwert, siehe dort
                    }
                    if (ch !== null && ch >= CFG.CHEAT_MIN) {
                        const { size, grid } = parse(board);
                        // zweiter Punkt: erster leerer Nachbar des Zuges (sonst kein Doppelzug)
                        let second = null;
                        for (const [nx, ny] of neigh(move.x, move.y, size)) {
                            if (grid[nx][ny] === EMPTY && !(nx === move.x && ny === move.y)) { second = [nx, ny]; break; }
                        }
                        if (second) {
                            result = await cheat(ns,
                                __SCHWARM_BT__await ns.go.cheat.playTwoMoves(__SCHWARM_DC__move.x},__SCHWARM_DC__move.y},__SCHWARM_DC__second[0]},__SCHWARM_DC__second[1]})__SCHWARM_BT__);
                            if (result && CFG.LOG_EVERY_MOVE) ns.print(__SCHWARM_BT__CHEAT Doppelzug (__SCHWARM_DC__move.x},__SCHWARM_DC__move.y})+(__SCHWARM_DC__second[0]},__SCHWARM_DC__second[1]})__SCHWARM_BT__);
                        }
                    }
                }

                // Normalzug (Standardfall), falls kein Cheat gespielt wurde.
                if (!result) {
                    if (move) {
                        try {
                            result = await ns.go.makeMove(move.x, move.y);
                            if (CFG.LOG_EVERY_MOVE) ns.print(__SCHWARM_BT__Zug (__SCHWARM_DC__move.x},__SCHWARM_DC__move.y}) — __SCHWARM_DC__move.reason}__SCHWARM_BT__);
                        } catch (e) {
                            // Engine hat den Zug abgelehnt (Superko-Edge-Case o.Ä.). Zug für DIESEN
                            // Zustand sperren und sofort einen anderen wählen — NIEMALS endlos denselben.
                            blocked.add(move.x + "," + move.y);
                            if (CFG.LOG_EVERY_MOVE) ns.print(__SCHWARM_BT__INFO Zug (__SCHWARM_DC__move.x},__SCHWARM_DC__move.y}) abgelehnt (__SCHWARM_DC__String(e).split(":").pop().trim().slice(0, 40)}) — wähle anderen.__SCHWARM_BT__);
                            await ns.sleep(20);
                            continue;                        // board unverändert -> chooseMove nimmt nächstbesten (gesperrter ist raus)
                        }
                    } else {
                        // Kein sinnvoller/legaler Zug (evtl. alle gesperrt). Passen beendet die Partie,
                        // sobald der Gegner ebenfalls passt.
                        try { result = await ns.go.passTurn(); } catch (e) { ns.print(__SCHWARM_BT__WARN passTurn: __SCHWARM_DC__e}__SCHWARM_BT__); await ns.sleep(CFG.LOOP_MS); continue; }
                        if (CFG.LOG_EVERY_MOVE) ns.print("passe (kein lohnender Zug — Gegner darf ausfüllen).");
                    }
                }

                if (result && result.type === "gameOver") { running = false; break; }

                // Zwischenzustand NACH meinem Zug erfassen (vor dem Gegnerzug). Ohne das
                // fehlt der Engine-bekannte Zustand in der History -> Ko würde wieder crashen.
                try { history.add(sig(parse(ns.go.getBoardState()).grid)); } catch (e) { /* unkritisch */ }

                // Gegner ziehen lassen (blockt bis fertig).
                try {
                    const opp = await ns.go.opponentNextTurn(false);
                    if (opp && opp.type === "gameOver") { running = false; break; }
                } catch (e) { ns.print(__SCHWARM_BT__WARN opponentNextTurn: __SCHWARM_DC__e}__SCHWARM_BT__); }

                await ns.sleep(CFG.LOOP_MS);
            }

            // --- Partie ausgewertet ---
            games++;
            let finalBoard = null, t = null;
            try { finalBoard = ns.go.getBoardState(); t = territory(parse(finalBoard).grid, parse(finalBoard).size); } catch (e) { /* egal */ }
            if (!playedSize && finalBoard) playedSize = parse(finalBoard).size;
            let won = null;
            try {
                const gs = ns.go.getGameState();     // {blackScore, whiteScore, komi, ...}
                if (gs && typeof gs.blackScore === "number" && typeof gs.whiteScore === "number") {
                    won = gs.blackScore > gs.whiteScore; // wir = Schwarz/X (Komi *.5 → nie Gleichstand)
                    if (won) wins++; else losses++;
                    recordResult(ns, opponent, playedSize || CFG.BOARD_SIZE, won);
                    const o = oppStats(opponent);
                    const wr = recentWR(opponent, playedSize || CFG.BOARD_SIZE);
                    ns.print(__SCHWARM_BT__Partie __SCHWARM_DC__games} vs __SCHWARM_DC__opponent} [__SCHWARM_DC__playedSize}×__SCHWARM_DC__playedSize}]: __SCHWARM_DC__won ? "GEWONNEN" : "verloren"} __SCHWARM_BT__ +
                        __SCHWARM_BT__(X __SCHWARM_DC__gs.blackScore} : __SCHWARM_DC__gs.whiteScore} O). Serie __SCHWARM_DC__o.streak}, WR __SCHWARM_DC__wr === null ? "?" : ((wr * 100) | 0) + "%"}. __SCHWARM_BT__ +
                        __SCHWARM_BT__Bilanz __SCHWARM_DC__wins}W/__SCHWARM_DC__losses}L.__SCHWARM_BT__);
                }
            } catch (e) { /* Score nicht lesbar */ }
            if (won === null) {
                ns.print(__SCHWARM_BT__Partie __SCHWARM_DC__games} vs __SCHWARM_DC__opponent} beendet__SCHWARM_BT__ +
                    (t ? __SCHWARM_BT__ (Territorium JS X=__SCHWARM_DC__t.mine}/O=__SCHWARM_DC__t.theirs}).__SCHWARM_BT__ : "."));
            }

            await ns.sleep(CFG.LOOP_MS);
        } catch (e) {
            ns.print(__SCHWARM_BT__WARN Partie-Loop: __SCHWARM_DC__e}__SCHWARM_BT__);
            await ns.sleep(CFG.IDLE_MS);
        }
    }
}
`;
// ===========================================================================
// EINSETZEN IN SCHWARM-PAYLOADS.js   —   SRC_TRADER v1.4
// ===========================================================================
// Gegen den bestehenden "const SRC_TRADER = ...;" austauschen (endet mit  }`;
// vor const SRC_BLADEBURNER). Keine Kodierung noetig — der Block ist
// zeichengleich mit dem Dateiinhalt, decodePayload() ist ein No-Op.
//
// Kopf-Changelog ergaenzen:
//   * v1.0 (TRADER v1.4): KURSBEEINFLUSSUNG, Zulieferung. Der Trader meldet auf
//   *   Port 34, welche ORGANISATION in welche Richtung beeinflusst werden soll
//   *   ("up" = Long gehalten -> nur grow beeinflusst; "down" = Short -> nur
//   *   hack). Gemeldet wird ausschliesslich, was er TATSAECHLICH HAELT.
//   *   Ausfuehrung und Zielwahl liegen beim DISPATCHER.
// ===========================================================================

const SRC_TRADER = `/**
 * SCHWARM-TRADER.js — v1.6
 * Hybrid-Trader (Pre-4S + 4S) mit Short-Unterstuetzung. Bitburner v3.0.1.
 *
 * ===========================================================================
 * v1.6 — DIE SCHLEIFE WAR OFFEN: GEKAUFT WURDE AM HEBEL VORBEI
 * ===========================================================================
 * Seit v1.4 meldet der Trader Beeinflussungsziele, und seit v11.0 filtert er
 * sie mit manipOk auf das, was der Dispatcher wirklich bedienen kann. Beides
 * geschah aber ERST NACH DEM KAUF. Die Kaufentscheidung selbst kannte manipOk
 * nicht — sie ging allein nach Prognose.
 *
 * Im Livebericht aus BN8 stand das Ergebnis wortwoertlich:
 *     "Trader haelt Positionen ($4.49b), aber KEINE davon ist beeinflussbar."
 * Gekauft wurde also an dem einzigen Vorteil vorbei, den diese BitNode laesst.
 *
 * WARUM DER HEBEL IN BN8 UEBERHAUPT NOCH DA IST — nachgeschlagen, nicht
 * angenommen: hack() beeinflusst den Kurs ueber moneyDrained, nicht ueber
 * moneyGained (NetscriptHelpers.tsx:641 und :662). ScriptHackMoneyGain=0 nimmt
 * einem das Geld, nicht die Wirkung. Die Trefferchance ist dabei
 * moneyDrained / server.moneyMax (PlayerInfluencing.ts:34) — grosse Bissen
 * wirken, Kruemel fast nie. Und die Richtung muss niemand erraten: long halten
 * und grow()en treibt hoch, short halten und hack()en drueckt. Shorting ist in
 * BN8 ohne Source-File frei (StockTicker.tsx:277).
 *
 * ZWEI REGELN, beide nur aktiv wenn der Dispatcher hackPays=false meldet:
 *   1. GEWICHT — beeinflussbare Kandidaten zaehlen mit MANIP_BUY_BONUS-fachem
 *      Gewicht. Das verschiebt Rangfolge und Budgetanteil, ohne eine zweite
 *      Zuteilungslogik einzufuehren; es ist dieselbe Sortierung wie vorher.
 *   2. SCHWELLE — ihre Einstiegsschwelle wird um MANIP_ENTER_RELAX gelockert.
 *      Ohne das waere Regel 1 oft gegenstandslos: bevorzugen kann man nur, was
 *      ueberhaupt in die Auswahl kommt, und ohne 4S ist die geschaetzte
 *      Prognose traege. Gelockert, nicht abgeschafft.
 *
 * WAS AUSDRUECKLICH NICHT ANGETASTET IST: Das Gewicht ist eine EIGENE Groesse
 * neben expRet. expRet geht in die Amortisationsrechnung ein (netPerTick,
 * minValue) — haette der Bonus dort mitgewirkt, waere der Schutz gegen
 * Geschaefte, die Spread und Kommission nie hereinholen, still um den Faktor 3
 * aufgeweicht worden. Der Bonus darf die Reihenfolge aendern, nicht die
 * Rechnung, ob ein Kauf sich traegt. Ebenso unveraendert: Deckel je Symbol,
 * freie Stueckzahl, Barreserve.
 *
 * IN JEDER ANDEREN BITNODE aendert sich nichts. Fehlt hackPays im
 * Dispatcher-Ausgang (aeltere Version), bleibt "fuehrt" false und die Funktion
 * verhaelt sich Zeile fuer Zeile wie in v1.5 — kein Raten ueber die BitNode.
 *
 * ===========================================================================
 * v1.4 — KURSBEEINFLUSSUNG: ZIELE MELDEN (Port 34)
 * ===========================================================================
 * In BN8 ist der Markt die einzige Geldquelle (BitNode.tsx:764-791), und der
 * gesamte Hacking-Apparat erzeugt dort keinen Dollar (ScriptHackMoneyGain 0).
 * Sein einziger Wert ist die KURSBEEINFLUSSUNG — und die funktioniert ohne 4S,
 * weil man die Richtung selbst setzt statt sie zu lesen.
 *
 * ENGINE (PlayerInfluencing.ts):
 *     percTotalMoneyGrown = moneyGrown / server.moneyMax
 *     if (Math.random() < percTotalMoneyGrown)
 *         stock.changeForecastForecast(otlkMagForecast + 0.1)
 *   und spiegelbildlich fuer hack mit -0.1.
 *
 * DREI FOLGERUNGEN, die das Zusammenspiel bestimmen:
 *   1. Der Impuls haengt am AUFRUF, nicht an den Threads. Ein grow() gibt genau
 *      EINE Chance; bei p >= 1 ist Schluss. Viele kleine Aufrufe schlagen wenige
 *      grosse. Das umzusetzen ist Sache des DISPATCHERS.
 *   2. hack und grow duerfen NICHT beide beeinflussen. grow braucht Platz (ein
 *      Server auf moneyMax waechst nicht, p ~ 0), also muss vorher gehackt
 *      werden — aber hack mit stock:true senkt den Forecast und frisst die
 *      eigene Arbeit auf. Deshalb traegt die Meldung eine RICHTUNG, keinen
 *      An/Aus-Schalter: bei "up" beeinflusst nur grow, bei "down" nur hack.
 *   3. Der Engpass ist die grow-LAUFZEIT, nicht das RAM. Von neutral (50) auf
 *      maximal bullish (100) sind 500 Impulse noetig (Schrittweite 0.1,
 *      Stock.ts:154-161). Schnelle, niedrigstufige Server liefern pro Minute ein
 *      Vielfaches der Impulse eines ecorp — die Zielwahl innerhalb der Stufe
 *      gehoert deshalb ebenfalls zum DISPATCHER, der die Laufzeiten kennt.
 *
 * WAS DIESE VERSION TUT: sie meldet, WELCHE Organisation in welche Richtung
 * beeinflusst werden soll — mehr nicht. Gemeldet wird NUR, was der Trader
 * tatsaechlich HAELT; eine Manipulation ohne Position waere eine Wette auf 500
 * Impulse Vorlauf, und die Positionsgroesse ist ohnehin durch den Deckel
 * begrenzt.
 *
 * MAPPING: die Meldung nennt die ORGANISATION (ns.stock.getOrganization, 2 GB,
 * einmal beim Start gecacht — Symbole und Organisationen sind statisch). Der
 * Dispatcher vergleicht sie gegen server.organizationName; getServer bezahlt er
 * ohnehin. So kostet die Anbindung ihn 0 GB und den Trader 2 GB statt umgekehrt
 * einen netzweiten Scan.
 *
 * ===========================================================================
 * v1.3 — VERMOEGENSBODEN FUER DEN EINSATZDECKEL
 * ===========================================================================
 * BEFUND aus der v1.2-Diagnose (Livelauf, 8 Fenster):
 *     Deckel $10000000 (Einlage $10000000 + 70% von Gewinn $-7251195739)
 *     Signale 52 -> Kandidaten 7 -> gekauft 0 | zu klein 7
 *     Schwelle: kleinstes minValue $33960590 | Limit je Symbol $2000000
 *
 * MINUS 7,25 MILLIARDEN. Das ist der kumulierte Netto-Cashflow seit dem letzten
 * Aug-Install — also die Bilanz des v1.0-Karussells (bei $100k Kommission rund
 * 72.500 Transaktionen). Der Deckel aus v1.1 haengt allein an diesem Wert und
 * bestraft den Trader damit dauerhaft fuer einen Fehler, der laengst behoben
 * ist: max(0, gewinn) faengt die Negativitaet zwar ab, aber bis die 7,25 Mrd
 * wieder eingespielt sind, bleibt der Deckel auf der Einlage. Mit $10m Kapital
 * passiert das nie.
 *
 * B2 IST NICHT SCHULD. Die Amortisationsrechnung stimmt: um $200k Gebuehren bei
 * ~0,1 %/Tick ueber zehn Ticks zu verdienen, braucht es Millionenpositionen.
 * B2 sagt zu Recht, dass sich $2m-Positionen nicht rechnen — falsch bemessen
 * war das KAPITAL, nicht die Schwelle.
 *
 * LOESUNG: ein zweiter, altlastenfreier Pfad.
 *     deckel = max( einlage + REINVEST x max(0, gewinn),     [Gewinnpfad]
 *                   TRADE_FRAC x (Bar + Depot) )             [Vermoegensboden]
 * Der Boden kennt keine Historie, waechst automatisch mit und macht den
 * Cashflow als Steuergroesse unschaedlich, ohne ihn aufzugeben: sobald der
 * Gewinnpfad hoeher liegt, gewinnt wieder er.
 *
 * WARUM DER BODEN LOKAL IST UND NICHT AUS DER TREASURY KOMMT: in BN8 ist der
 * Markt die EINZIGE Geldquelle (BitNode.tsx:764-791). Ein Deckel, der an Port 5
 * oder an BANK haengt, legt bei deren Ausfall die gesamte Oekonomie still — und
 * genau solche Kopplungen haben in dieser Datei schon zwei Deadlocks erzeugt.
 * Der Trader muss allein handlungsfaehig bleiben.
 * Treasury.STOCKS wird BEWUSST NICHT gelesen: dort ist der Wert als "Anteil des
 * verfuegbaren Geldes fuer Kaeufe" definiert (DEFAULT_TREASURY), nicht als
 * Handelskapital-Quote. Zwei Bedeutungen fuer eine Zahl waere dieselbe Sorte
 * Doppeldeutigkeit, die schon AUG_WEIGHTS gegen das TIER-Array auseinander-
 * laufen liess.
 *
 * Die Statuszeile nennt jetzt, WELCHER Pfad den Deckel gerade setzt.
 *
 * ===========================================================================
 * v1.2 — DIAGNOSE: WARUM WIRD NICHT GEKAUFT?
 * ===========================================================================
 * ANLASS (Livelauf 45 min): der Trader arbeitet — in BN8 ist der Markt die
 * EINZIGE Geldquelle (BitNode.tsx:764-791: CompanyWork/Crime/Hacknet/Manual/
 * ScriptHackMoneyGain/CodingContract/Infiltration/Darknet/Gang/Corp alle 0),
 * und das Vermoegen stieg von $98,61m auf $181,06m. Das Geld kann nur von hier
 * kommen. ABER: das Depot stand dabei durchgehend bei $0-5m, obwohl der Deckel
 * bei dem Gewinn laengst um $60-70m liegen muesste. Er nutzt unter 10 % seines
 * erlaubten Kapitals.
 *
 * WARUM DAS NICHT ZU KLAEREN WAR: der Trader protokollierte nur, was er TUT —
 * nie, warum er es NICHT tut. Ein abgelehnter Kauf hinterlaesst keine Spur.
 * Dieselbe Luecke wie beim Dispatcher vor der XP-Diagnose: die entscheidende
 * Groesse stand in keinem Report, also blieb nur Raten.
 *
 * DIESE VERSION AENDERT AM VERHALTEN NICHTS. Sie zaehlt in runEntries mit,
 * WORAN ein Kandidat gescheitert ist, und gibt alle DIAG_MS eine Statuszeile
 * aus:
 *   - Deckel, Gewinn, Depot, Auslastung, Barkapital
 *   - Ticks im Fenster, davon mit Handel und davon durch Cooldown gesperrt
 *   - Kandidaten -> gekauft, und die Ablehnungsgruende einzeln:
 *       Amortisation  netPerTick <= 0 (Spread frisst den Erwartungswert)
 *       zu klein      Position unter minValue (B2)
 *       Platz         maxShares ausgeschoepft
 *       Budget        Kopfraum/Bar reicht fuer die Kommission nicht
 *       kein Signal   Forecast in der Totzone / Pre-4S-Historie zu kurz
 *   - DIE KERNZAHL: kleinstes minValue im Fenster gegen das Symbol-Limit.
 *     Liegt die Schwelle systematisch ueber dem Limit, ist B2 der Blocker und
 *     kein Signal kann je durchkommen — das sagt die Zeile dann ausdruecklich.
 *
 * ===========================================================================
 * v1.1 — EIGENES KAPITAL STATT ERSTZUGRIFF AUFS VERMOEGEN
 * ===========================================================================
 * BEFUND aus dem Livelauf: ein Liquidations-Kauf-Karussell.
 *     LIQUIDATION (BANK): FLCM S aufgeloest (~$33.46m)
 *     GEKAUFT (Short): 382,000x FLCM fuer $13.62m
 *     LIQUIDATION (BANK): FLCM S aufgeloest (~$39.49m)
 * BANK forderte $4,51 Mrd von einem Depot, das $68m wert war. Die Forderung war
 * unerfuellbar und wurde jeden Tick neu gestellt; der Trader liquidierte, leerte
 * Port 27 und kaufte mit dem Erloes im selben Durchlauf nach. Vier Kommissionen
 * je Runde bei unveraendertem Kurs — Geld $61,61m -> $53,9k in einem Zyklus.
 *
 * DREI URSACHEN, alle in v1.0 eingebaut:
 *   1. A5 machte den Liquidationserloes sofort wieder verfuegbar. Fuer eine
 *      Umschichtung richtig, bei offenem BANK-Auftrag falsch: das Geld gehoert
 *      dann BANK. Der Test A5b pruefte sogar ausdruecklich, dass gekauft wird —
 *      er kodierte den Fehler.
 *   2. B1 deckelte den Anteil am freien BARkapital, nicht die Gesamtposition.
 *      Nach jeder Liquidation war das Barkapital wieder voll, also durfte
 *      dasselbe Symbol erneut 20 % bekommen — beliebig oft.
 *   3. Der Trader leerte Port 27 selbst. BANK setzte ihn neu, dazwischen wurde
 *      gekauft. Aufraeumen gehoert dem Auftraggeber.
 *
 * K1 EINSATZDECKEL (ersetzt "alles ausser der Barreserve").
 *      deckel = einlage + REINVEST x max(0, gewinn)
 *      einlage = START_FEES x Kommission   (100 x 100k = 10 Mio bei Standard)
 *      gewinn  = stockCashflow + depotwert
 *   ZUR GEWINNFORMEL: getMoneySources().sinceInstall["stock"] ist NICHT der
 *   Gewinn, sondern der Netto-Cashflow — BuyingAndSelling.tsx bucht Kauf
 *   (loseMoney, Z. 105/280) und Verkauf (gainMoney, Z. 173/362) auf denselben
 *   Zaehler. Bei offenen Positionen ist der Wert negativ, weil die Kaufkosten
 *   abgeflossen und die Erloese noch nicht da sind. Erst Cashflow + Depotwert
 *   ergibt den Gewinn. Ein Deckel auf dem rohen Cashflow wuerde genau dann
 *   schrumpfen, wenn der Trader arbeitet.
 *   Nach einem Aug-Install faellt der Deckel auf die Einlage zurueck, weil
 *   sinceInstall zurueckgesetzt wird — passend, denn das Depot ist dann
 *   ebenfalls weg (Prestige.ts:167-169 initStockMarket).
 *
 * K2 AUSSCHUETTUNG statt Anforderung. Liegt der Depotwert ueber dem Deckel,
 *   wird aktiv abgebaut (schwaechste Position zuerst) — der Gewinn fliesst von
 *   selbst an BANK, ohne Port 27.
 *   ASYMMETRIE, und die ist der Kern: der KAUFdeckel sinkt bei Verlusten (wer
 *   verliert, bekommt kein frisches Kapital), die AUSSCHUETTUNG greift aber nur
 *   bei gewinn > 0. Ohne diese Trennung entstuende eine Todesspirale: Buchverlust
 *   -> Deckel faellt -> Zwangsverkauf -> Verlust realisiert -> Gewinn faellt
 *   weiter -> naechster Zwangsverkauf.
 *   KEIN VERFALL nicht genutzten Kapitals: der Deckel bindet kein Geld, er
 *   begrenzt nur, wieviel gebunden werden DARF. Nicht Gekauftes liegt ohnehin
 *   auf dem einen Konto und steht BANK zur Verfuegung. Ein Verfall waere eine
 *   Einwegsperre — nach einem Abschwung, in dem die Hysterese planmaessig alles
 *   verkauft, kaeme der Trader nie wieder hoch.
 *
 * K3 PORT 27 WIRD NIE MEHR VOM TRADER GELEERT. Der Auftraggeber raeumt auf
 *   (BANK v3.2 setzt ihn auf 0, sobald das Portfolio leer ist). Damit ist die
 *   Race-Bedingung strukturell weg. Auftraege stellt BANK nur noch vor dem
 *   Aug-Install.
 *
 * K4 KEINE EINSTIEGE, solange ein Auftrag anliegt oder in den letzten
 *   LIQ_COOLDOWN_TICKS Durchlaeufen anlag.
 *
 * T4 SHORTS EROEFFNEN NUR MIT 4S. Ohne echten Forecast beruht die Richtung auf
 *   einer Haeufigkeitszaehlung ueber 40 Ticks; bei unbegrenztem Verlustrisiko
 *   ist das nicht vertretbar. GETRENNTE FLAGS: canShort (Engine-Gate, gilt fuer
 *   Bewertung und AUSSTIEG) und mayOpenShort (Gate UND 4S, gilt fuer EINSTIEG).
 *   Ohne die Trennung waeren bestehende Shorts eingefroren und nie schliessbar.
 *
 * T4b ABWICKLUNGSMODUS: bestehende Shorts werden bei fehlendem 4S aktiv
 *   abgebaut statt passiv gehalten.
 *
 * T6 Einmalige Warnung, wenn eine Forderung den gemeldeten Depotwert deutlich
 *   uebersteigt — sonst sucht man den Fehler beim Trader, waehrend er bei BANK
 *   liegt.
 *
 * ===========================================================================
 * v1.0 — SHORT-TAUGLICHKEIT + ERTRAGSUMBAU  (Paket A + B1-B3 + B4')
 * ===========================================================================
 * Bis v0.x war Shorting zwar ausprogrammiert, aber per Konstante
 * (ENABLE_SHORTING=false) tot geschaltet — und haette man sie einfach auf true
 * gesetzt, waeren vier Fehler sofort scharf geworden. Die sind jetzt behoben.
 *
 * A1 CAPABILITY ZUR LAUFZEIT (statt Konstante)
 *   ENABLE_SHORTING entfaellt. Die Freischaltung wird aus ns.getResetInfo()
 *   (1 GB) abgeleitet und spiegelt das Engine-Gate exakt:
 *       buyShort/sellShort      StockMarket.ts:151,163  -> bitNodeN !== 8 &&
 *                               activeSourceFileLvl(8) <= 1  => throw
 *       placeOrder/cancelOrder/  StockMarket.ts:178,192,204 -> <= 2 => throw
 *       getOrders
 *   Also:  canShort = node===8 || sf8>=2 ,  canOrder = node===8 || sf8>=3.
 *   IN BN8 IST BEIDES AB SEKUNDE 1 FREI (BitNode.tsx:294) — kein SF noetig.
 *   canOrder wird nur ermittelt und geloggt (Vorarbeit fuer einen spaeteren
 *   Stop-Loss); Limit/Stop-Orders benutzt dieser Trader noch nicht.
 *
 * A2 PORTFOLIO-WERT (Port 26) ENTHAELT SHORTS      [BUGFIX]
 *   Vorher summierte der Block nur Long-Positionen. Mit aktiven Shorts haette
 *   BANK ein zu niedriges Vermoegen gesehen — dieselbe Fehlerklasse wie der
 *   frueher gefixte getSaleGain-Bug, mit denselben Folgen (Trader-Zins 0,
 *   Allokations-Gate am Floor, Grossziele warten auf Geld).
 *   WICHTIG: Der Short-Erloes ist origCost + profit (StockMarketHelpers.ts:55-59)
 *   und wird NEGATIV, sobald askPrice > 2 x playerAvgShortPx. Das alte Muster
 *   "if (gain <= 0) continue" haette eine Unterwasser-Position verschluckt und
 *   der BANK zu viel Vermoegen gemeldet. Negative Werte gehen deshalb MIT
 *   VORZEICHEN in die Summe ein.
 *   Zugleich ist die Fehlererkennung repariert: geprueft wird jetzt auf
 *   Number.isFinite, nicht auf "> 0". Ein API-Fehler war vorher nicht von
 *   "Position ist wertlos" zu unterscheiden — genau daran hing der alte Bug.
 *
 * A3 LIQUIDATION DECKT SHORTS                      [BUGFIX]
 *   Die Verkaufsliste enthielt nur Longs; bei short-lastigem Depot lief ein
 *   BANK-Auftrag (Port 27) ins Leere. Jetzt gemeinsame Liste mit Richtung und
 *   einheitlichem Ausstiegs-Rang: Long 0.5-forecast, Short forecast-0.5. Hoher
 *   Rang = Position, die der Trader ohnehin bald aufloesen wuerde.
 *
 * A4 POSITIONEN WERDEN NACHGEFUEHRT                [BUGFIX]
 *   Vorher las die Schleife getPosition() einmal und rechnete danach mit
 *   veralteten Stueckzahlen weiter: nach einem Long-Verkauf blieb sharesLong
 *   stehen, und der anschliessende Short im selben Durchlauf bekam ueber
 *   maxShares - sharesLong - sharesShort systematisch zu wenig Stueck
 *   zugeteilt (Engine-Limit: BuyingAndSelling.tsx:261, gilt fuer Long+Short
 *   gemeinsam). Jetzt fuehrt jeder Trade das Buch mit.
 *
 * A5 VERKAUFSERLOES IST SOFORT VERFUEGBAR          [BUGFIX]
 *   myCash wurde nur bei Kaeufen fortgeschrieben. Erloese standen erst im
 *   Folgetick bereit — in BN8, wo der Markt die einzige Geldquelle ist
 *   (BitNode.tsx:764, ScriptHackMoneyGain 0), kostet das Rotation.
 *
 * A6 KONSTANTEN AUS DER ENGINE
 *   ns.stock.getConstants() kostet 0 GB (RamCostGenerator.ts:125) und liefert
 *   StockMarketCommission, msPerStockUpdate, msPerStockUpdateMin. Die frueheren
 *   Festwerte FEE=100000 und RESERVE_CASH=10000000 entfallen; die Reserve ist
 *   jetzt ein Vielfaches der Kommission. Grund: eine 10-Mio-Sperre blockiert den
 *   Trader in fruehen BitNodes vollstaendig, waehrend sie in BN8 (Start 250 Mio,
 *   Prestige.ts:38) belanglos ist. Die Fallback-Zahlen unten greifen NUR, wenn
 *   getConstants() ausfaellt.
 *
 * B1 POSITIONS-SIZING
 *   Vorher: afford = myCash / askPrice. Das erste Symbol mit forecast > 0.55
 *   verbrauchte das gesamte Kapital, alle weiteren Signale des Ticks gingen
 *   leer aus — und welches das war, entschied die Reihenfolge von getSymbols().
 *   Jetzt werden alle Kandidaten gesammelt, nach Erwartungswert gewichtet und
 *   je Symbol auf MAX_SYMBOL_FRAC gedeckelt.
 *
 * B2 MINDEST-POSITIONSGROESSE
 *   Ein Rundlauf kostet 2 x Kommission plus den Spread. Statt eines
 *   Dollar-Schwellwerts wird die Amortisationsdauer gerechnet:
 *       wert * (expRet * BREAKEVEN_TICKS - spreadAnteil) >= 2 * kommission
 *   Positionen, die sich nicht binnen BREAKEVEN_TICKS Markt-Ticks rechnen,
 *   werden nicht eroeffnet.
 *
 * B3 HYSTERESE
 *   Ein- und Ausstiegsschwellen sind getrennt (Totzone um 0.5). Vorher lagen
 *   Verkauf (<= 0.50) und Kauf (> 0.55) so eng, dass ein um 0.5 pendelnder
 *   Forecast Positionen kostenpflichtig hin- und herdrehte; mit Shorts waere
 *   das doppelt teuer geworden (Long raus, Short rein, zurueck).
 *
 * B4' ADAPTIVER TAKT (statt ns.stock.nextUpdate)
 *   Kurse aendern sich NUR beim Markt-Tick; zwischen Ticks ist der Preis
 *   eingefroren. Schneller zu reagieren bringt also keinen besseren Preis —
 *   der Nutzen liegt allein darin, keinen Tick zu VERPASSEN. Genau das passiert
 *   bei gespeicherter Bonus-Zeit (getBonusTime = storedCycles x MilliPerCycle,
 *   StockMarket.ts:338): der Markt tickt dann bis auf msPerStockUpdateMin
 *   herunter, ein starrer 2-s-Takt sieht nur noch jede zweite Bewegung und die
 *   Pre-4S-Schaetzung wird verfaelscht. Der Takt richtet sich deshalb nach den
 *   Engine-Werten und geht bei Bonus-Zeit herunter.
 *   ns.stock.nextUpdate() waere die elegantere Loesung, wurde aber bewusst
 *   NICHT genommen: die Aufloesung des Promise ist in der vorliegenden
 *   Quellenkopie nicht belegbar (StockMarket.ts:340-345 zeigt nur den Wrapper),
 *   und ein unbelegbarer Blockierpunkt in einem Dauerlaeufer ist teurer als der
 *   marginale Polling-Aufwand.
 *
 * ZUSAETZLICH
 *   - Doppelstart-Schutz (fehlte). Zwei Trader wuerden sich gegenseitig das
 *     Kapital wegkaufen und Port 26 abwechselnd ueberschreiben. Der Schutz
 *     wirkt PRO HOST: eine Handstart-Instanz auf home und eine Queen-Instanz
 *     auf einem pserv erkennen einander nicht.
 *   - KEINE Template-Literale in dieser Datei. Damit ist die Payload-Kopie in
 *     SCHWARM-PAYLOADS.js (SRC_TRADER) zeichengleich mit dieser Datei und
 *     decodePayload() ein No-Op — eine Fehlerquelle weniger bei jeder Pflege.
 *
 * STANDALONE: kein Import aus SCHWARM-HELPERS.js (Handstart ohne Schwarm
 * moeglich). Die Portnummern 21/26/27 sind deshalb hier gespiegelt; sie
 * muessen zu SCHWARM_PORTS in HELPERS passen.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");

    // Doppelstart-Schutz (pro Host, siehe Kopf).
    try {
        const self = ns.getScriptName();
        if (ns.ps(ns.getHostname()).filter(p => p.filename === self).length > 1) {
            ns.print("TRADER laeuft auf diesem Host bereits — beende.");
            return;
        }
    } catch (e) { /* im Zweifel weiterlaufen */ }

    // --- Ports -------------------------------------------------------------
    //
    // KEINE GESPIEGELTEN NUMMERN MEHR (v4.0). Hier standen vier Konstanten, die
    // SCHWARM_PORTS von Hand nachbildeten — darunter
    //
    //     const PORT_MANIP = 34;
    //     // "bewusst eine NEUE Nummer ... 19-21 gehoeren DARKNET"
    //
    // Die Begruendung war sorgfaeltig und trotzdem falsch: DARKNET hatte sich
    // 34 im selben Zeitraum fuer seine Arbeitsauftraege genommen, ebenfalls als
    // lokale Konstante. Beide leerten den Port vor dem Schreiben, im
    // Sekundentakt, und haben sich gegenseitig ausgeloescht.
    //
    // Die Marke unten ersetzt injectPorts() beim Materialisieren durch die
    // zentrale Tabelle. Der TRADER hat damit ueberhaupt keine eigene Portnummer
    // mehr, die veralten koennte.
    //
    // SEIN AUSGANG IST EIN OBJEKT. portfolio, manip und promote sind Felder
    // darin, keine eigenen Ports — sie gehoeren alle demselben Schreiber und
    // werden im selben Takt berechnet. Deshalb schreibt der Trader den ganzen
    // Ausgang in EINEM Zug (writeTraderOut), ohne Read-Modify-Write.
    /*__PORTS__*/

    // Spiegel des eigenen Ausgangs. Der TRADER ist sein EINZIGER Schreiber, also
    // genuegt ein lokales Objekt plus flushOut() — kein Read-Modify-Write, kein
    // JSON.parse je Takt. Die drei Felder entstehen an verschiedenen Stellen im
    // Takt (portfolio frueh, manip/promote spaet), deshalb der Spiegel statt
    // eines einzelnen Schreibaufrufs am Ende: bei ruhigem Markt bricht der Takt
    // vorzeitig ab und das Portfolio muesste sonst ungemeldet bleiben.
    // v1.5: "held" = ANZAHL offener Positionen, getrennt vom WERT.
    // Grund: der Wert wird fuer BANK auf 0 geklemmt (siehe unten), weil eine
    // Unterwasser-Short einen NEGATIVEN Wert hat. BANK las bisher nur den Wert
    // und schloss aus "0" auf "Depot leer" — dann hat sie in der Reset-Phase
    // DROP:TRADER geschickt und damit die einzige Instanz getoetet, die die
    // Position noch haette schliessen koennen. Die Zahl der Positionen ist die
    // Angabe, die diese Entscheidung wirklich braucht.
    const OUT = { portfolio: 0, held: 0, manip: [], promote: "NONE" };
    const flushOut = () => {
        try {
            const h = ns.getPortHandle(SCHWARM_PORTS.TRADER_OUT);
            h.clear();
            return h.tryWrite(JSON.stringify(OUT));
        } catch (e) { return false; }
    };
    /** Ausgang der BANK lesen ({} wenn leer/defekt). Feld "liquidate" = Auftrag.
     *  KEINE BACKTICKS IN DIESER DATEI ausserhalb der Payload-Grenzen — der
     *  Quelltext hier steht in einem Template-Literal, ein Backtick beendet es. */
    const readBankOut = () => {
        try {
            const v = ns.peek(SCHWARM_PORTS.BANK_OUT);
            if (v === "NULL PORT DATA" || typeof v !== "string" || !v.length) return {};
            const o = JSON.parse(v);
            return (o && typeof o === "object") ? o : {};
        } catch (e) { return {}; }
    };
    /** Ausgang des DISPATCHERs lesen ({} wenn leer/defekt).
     *  Felder, die uns interessieren:
     *    manipOk   Organisationen, die er bedienen KANN (v11.0 Rueckkanal)
     *    hackPays  zahlt hack() in dieser BitNode Geld? */
    const readDispOut = () => {
        try {
            const v = ns.peek(SCHWARM_PORTS.DISP_OUT);
            if (v === "NULL PORT DATA" || typeof v !== "string" || !v.length) return {};
            const o = JSON.parse(v);
            return (o && typeof o === "object") ? o : {};
        } catch (e) { return {}; }
    };

    // --- Stellschrauben (dimensionslos oder als Vielfache von Engine-Werten) -
    const TUNE = {
        RESERVE_FEES: 20,        // Barreserve = 20 x Kommission (nie investiert)
        START_FEES: 100,         // K1: Einlage = 100 x Kommission (~10 Mio)
        TRADE_FRAC: 0.70,        // v1.3: Vermoegensboden — so viel vom Gesamt-
                                 //     vermoegen (Bar + Depot) darf der Trader
                                 //     mindestens binden, unabhaengig von der
                                 //     Cashflow-Historie. In BN8 ist der Markt
                                 //     die einzige Geldquelle; 30 % bleiben fuer
                                 //     Augs und Betrieb liegen.
        REINVEST: 0.70,          // K1: Anteil des eigenen Gewinns, den der Trader
                                 //     behalten darf. Der Rest bleibt als Cash
                                 //     liegen und gehoert damit BANK. Der
                                 //     Trader-Anteil am Vermoegen konvergiert
                                 //     gegen diesen Wert statt zu divergieren.
        LIQ_COOLDOWN_TICKS: 3,   // K4: so viele Durchlaeufe nach einem Auftrag
                                 //     keine Einstiege (gegen das Karussell)
        MAX_SYMBOL_FRAC: 0.20,   // B1: hoechstens 20 % des Kapitals je Symbol
        BREAKEVEN_TICKS: 10,     // B2: Position muss sich binnen 10 Ticks rechnen
        LONG_ENTER: 0.55,        // B3: Hysterese
        LONG_EXIT: 0.48,
        SHORT_ENTER: 0.45,
        SHORT_EXIT: 0.52,
        HISTORY_LIMIT: 40,       // Laenge der Pre-4S-Aufzeichnung
        MIN_HISTORY: 15,         // Mindest-Ticks, bevor Pre-4S schaetzt
        PROMOTE_TOP_N: 5,        // Volatilitaet saettigt -> wenige Ziele
        MANIP_TOP_N: 6,          // v1.4: so viele Beeinflussungsziele melden
        // --- v1.6: Kauf-Vorrang fuer beeinflussbare Organisationen ----------
        // Wirken NUR, wenn der Dispatcher hackPays=false meldet — also in
        // BitNodes, in denen Hacken kein Geld bringt und die Kursbeeinflussung
        // der einzige Vorteil ist (BN8: ScriptHackMoneyGain 0). In jeder
        // anderen BitNode ist das Verhalten unveraendert.
        MANIP_BUY_BONUS: 3,      // Gewicht beeinflussbarer Kandidaten (x expRet)
        MANIP_ENTER_RELAX: 0.03, // Einstiegsschwelle fuer sie um so viel gelockert
        NO_TIX_SLEEP_MS: 60000,  // Wartetakt ohne TIX-Zugang
        DIAG_MS: 30000,          // v1.2: Statuszeile hoechstens alle 30 s
    };

    const K = readStockConstants(ns);
    const CAP = detectStockCaps(ns);

    ns.print("SCHWARM-TRADER v1.1 — BitNode " + CAP.node + ", SF8 Level " + CAP.sf8
        + " | Short " + (CAP.canShort ? "FREI" : "gesperrt")
        + " | Limit/Stop " + (CAP.canOrder ? "FREI (ungenutzt)" : "gesperrt")
        + " | Kommission " + fmtMoney(ns, K.fee)
        + " | Einlage " + fmtMoney(ns, K.fee * TUNE.START_FEES)
        + " | Reinvest " + Math.round(TUNE.REINVEST * 100) + "%");

    const orgOf = {};            // v1.4: Symbol -> Organisation (statisch, gecacht)
    const history = {};          // sym -> Preisreihe, [0] = neuester
    let warnedGainApi = false;   // Fallback-Warnung nur einmal
    let warnedNegative = false;  // Unterwasser-Warnung nur einmal
    let warnedRequest = false;   // unerfuellbare Forderung nur einmal (T6)
    let liqCooldown = 0;         // K4: Durchlaeufe ohne Einstiege
    let shortNoticed = false;    // T4-Hinweis nur einmal
    let lastDiag = 0;            // v1.2: 0 = erste Statuszeile sofort beim Start
    let stat = newStat();        // v1.2: Zaehler seit der letzten Statuszeile

    while (true) {
        let sleepMs = nextSleepMs(ns, K);
        try {
            if (!ns.stock.hasTixApiAccess()) {
                ns.print("WARTE: TIX-API fehlt. Erneute Pruefung in "
                    + Math.round(TUNE.NO_TIX_SLEEP_MS / 1000) + " s.");
                await ns.asleep(TUNE.NO_TIX_SLEEP_MS);
                continue;
            }

            const has4S = safeCall(() => ns.stock.has4SDataTixApi(), false);

            // T4: Shorts EROEFFNEN nur mit echtem Forecast. canShort (Engine-Gate)
            // bleibt davon unberuehrt und gilt weiter fuer Bewertung und AUSSTIEG —
            // sonst waeren bestehende Short-Positionen eingefroren.
            const mayOpenShort = CAP.canShort && has4S;
            if (CAP.canShort && !has4S && !shortNoticed) {
                shortNoticed = true;
                ns.print("INFO: Shorts sind freigeschaltet, aber ohne 4S-Forecast werden KEINE "
                    + "neuen eroeffnet (Richtung waere geraten, Verlustrisiko unbegrenzt). "
                    + "Bestehende Shorts werden abgebaut.");
            }

            const symbols = ns.stock.getSymbols();
            const reserve = K.fee * TUNE.RESERVE_FEES;
            let cash = ns.getServerMoneyAvailable("home") - reserve;

            // ---------------------------------------------------------------
            // 1. Kurshistorie fortschreiben + Markt-Tick erkennen
            // ---------------------------------------------------------------
            let ticked = false;
            for (const sym of symbols) {
                let px = 0;
                try { px = ns.stock.getPrice(sym); } catch (e) { px = 0; }
                if (!(px > 0)) continue;
                let h = history[sym];
                if (!h) { h = []; history[sym] = h; }
                if (h.length === 0 || h[0] !== px) {
                    h.unshift(px);
                    ticked = true;
                    if (h.length > TUNE.HISTORY_LIMIT) h.pop();
                }
            }

            // ---------------------------------------------------------------
            // 2. Buch aufbauen: Positionen + Preise + Forecast je Symbol.
            //    EINE Erhebung fuer Portfolio-Meldung, Liquidation und Handel —
            //    frueher las der Portfolio-Block getPosition separat.
            // ---------------------------------------------------------------
            const book = buildBook(ns, symbols, has4S, history, TUNE);
            const bySym = {};
            for (const e of book) bySym[e.sym] = e;

            // ---------------------------------------------------------------
            // 3. Portfolio-Wert melden + Liquidationsauftrag ausfuehren.
            //    Laeuft bewusst VOR dem Tick-Gate: BANK soll den Wert auch bei
            //    ruhigem Markt sehen, und ein Auftrag darf nicht auf einen Tick
            //    warten muessen.
            // ---------------------------------------------------------------
            const port = valuePortfolio(ns, book, K, CAP);
            if (port.estimated && !warnedGainApi) {
                warnedGainApi = true;
                ns.tprint("WARN  [TRADER] ns.stock.getSaleGain liefert keinen brauchbaren Wert — "
                    + "Portfolio wird selbst gerechnet. Engine-Signatur pruefen: "
                    + "PositionType erwartet 'L' oder 'S' (StockMarket.ts:118, strikte Pruefung).");
            }
            if (port.value < 0 && !warnedNegative) {
                warnedNegative = true;
                ns.tprint("WARN  [TRADER] Portfolio-Wert ist NEGATIV (" + fmtMoney(ns, port.value)
                    + ") — mindestens eine Short-Position steht tief unter Wasser. "
                    + "Shorts haben unbegrenztes Verlustrisiko; BANK bekommt 0 gemeldet.");
            }
            // WERT geklemmt (BANK rechnet damit und darf nie negativ werden),
            // ANZAHL ungeklemmt — siehe Begruendung bei der OUT-Deklaration.
            OUT.portfolio = Math.max(0, Math.floor(port.value));
            OUT.held = Array.isArray(port.held) ? port.held.length : 0;
            flushOut();

            // ---------------------------------------------------------------
            // 3b. Liquidationsauftrag (nur noch vor dem Aug-Install, BANK v3.2).
            //     K3: der Port wird NICHT geleert — das macht der Auftraggeber,
            //     sobald das Portfolio leer ist. Selbst zu leeren hat das
            //     Karussell erst ermoeglicht.
            // ---------------------------------------------------------------
            // Liquidations-Auftrag ist ein ZUSTAND und steht deshalb im Ausgang
            // der BANK, nicht in unserem Eingang: er gilt, bis BANK ihn aendert.
            // K3 bleibt gueltig — wir loeschen ihn NICHT, das macht der
            // Auftraggeber. Selbst zu loeschen hat das Karussell erst ermoeglicht.
            const liqRaw = Number(readBankOut().liquidate);
            const liqReq = Number.isFinite(liqRaw) && liqRaw > 0 ? liqRaw : 0;
            if (liqReq > 0) {
                liqCooldown = TUNE.LIQ_COOLDOWN_TICKS;                   // K4
                if (port.held.length > 0) {
                    const raised = runLiquidation(ns, port.held, liqReq, bySym);
                    ns.print("LIQUIDATION: " + fmtMoney(ns, raised) + " von "
                        + fmtMoney(ns, liqReq) + " freigemacht.");
                    cash = ns.getServerMoneyAvailable("home") - reserve;
                }
                // T6: nur melden, wenn der Auftrag einen POSITIVEN Depotwert
                // deutlich uebersteigt. Bei negativem Wert ist ein hoher Auftrag
                // genau richtig — BANK sagt damit "alles schliessen", und die
                // alte Meldung schob die Ursache faelschlich auf die BANK.
                if (port.value > 0 && liqReq > port.value * 2 && !warnedRequest) {
                    warnedRequest = true;
                    ns.tprint("WARN  [TRADER] Liquidations-Forderung " + fmtMoney(ns, liqReq)
                        + " uebersteigt den Depotwert " + fmtMoney(ns, port.value)
                        + " deutlich — sie kann nicht erfuellt werden. Ursache liegt beim "
                        + "Auftraggeber (BANK), nicht hier.");
                }
            } else if (liqCooldown > 0) liqCooldown--;

            // ---------------------------------------------------------------
            // 4. Handel nur bei Marktbewegung.
            // ---------------------------------------------------------------
            stat.ticks++;
            if (!ticked) {
                stat.quiet++;
                if (Date.now() - lastDiag >= TUNE.DIAG_MS) {
                    printStatus(ns, stat, capitalCap(ns, port.value, cash, K, TUNE), port.value, cash, K, TUNE);
                    stat = newStat(); lastDiag = Date.now();
                }
                await ns.asleep(sleepMs); continue;
            }
            stat.trade++;

            // K1: Einsatzdeckel aus Einlage + Anteil am EIGENEN Gewinn.
            const cap = capitalCap(ns, port.value, cash, K, TUNE);

            cash = runExits(ns, book, K, CAP, TUNE, cash, mayOpenShort);
            // K2: Ausschuettung — Depot ueber dem Deckel abbauen. NUR bei Gewinn
            //     (siehe Asymmetrie im Kopf), sonst entstuende eine Todesspirale.
            if (cap.gain > 0 && port.value > cap.limit) {
                cash += payout(ns, port.held, port.value - cap.limit, bySym, cap);
            }
            // v1.6: Der Dispatcher-Ausgang wird JETZT gelesen, nicht erst nach
            // den Einstiegen. Er traegt zwei Dinge, die schon beim KAUFEN
            // zaehlen: hackPays (bringt Hacken in dieser BitNode ueberhaupt
            // Geld?) und manipOk (welche Organisationen kann der Dispatcher
            // tatsaechlich schieben?). Ein Lesevorgang, zwei Verwender.
            const dispOut = readDispOut();
            // Beeinflussung FUEHRT, wenn Hacken kein Geld bringt. Nur dann
            // greifen die beiden Kauf-Regeln unten. Fehlt das Feld (aeltere
            // Dispatcher-Version), bleibt alles beim Alten — kein Raten.
            const manipInfo = {
                fuehrt: dispOut.hackPays === false,
                kann: new Set(Array.isArray(dispOut.manipOk) ? dispOut.manipOk : []),
                orgOf,
            };

            // K4: keine Einstiege, solange ein Auftrag anliegt/anlag.
            if (liqCooldown === 0) {
                cash = runEntries(ns, book, K, CAP, TUNE, cash, cap, port.value, mayOpenShort, stat, manipInfo);
            } else stat.blocked++;
            // v4.0: beide Meldungen sind Felder im EIGENEN Ausgang, kein eigener
            // Port mehr. Ein Schreibvorgang statt zwei.
            //
            // v11.0 REIHENFOLGE IST BEDEUTSAM: erst die Beeinflussungsziele
            // (Richtung), dann die Promote-Ziele (Amplitude) — letztere bauen
            // auf ersteren auf. Volatilitaet ohne festgelegte Richtung erhoeht
            // nur die Varianz, nicht den Erwartungswert.
            OUT.manip   = buildManipTargets(ns, book, orgOf, TUNE, dispOut.manipOk);
            OUT.promote = buildPromoteTargets(ns, book, has4S, CAP, TUNE, mayOpenShort, OUT.manip, orgOf);
            flushOut();

            // v1.2: Statuszeile (aendert nichts, erklaert nur).
            if (Date.now() - lastDiag >= TUNE.DIAG_MS) {
                printStatus(ns, stat, cap, port.value, cash, K, TUNE);
                stat = newStat(); lastDiag = Date.now();
            }

        } catch (e) {
            ns.print("FEHLER IM TRADER: " + e);
        }
        await ns.asleep(sleepMs);
    }
}

// ===========================================================================
// ENGINE-ANBINDUNG
// ===========================================================================

/**
 * Kommission und Tick-Takt aus der Engine lesen (A6). ns.stock.getConstants()
 * kostet 0 GB und braucht KEINEN TIX-Zugang (StockMarket.ts:47 hat keinen
 * checkTixApiAccess). Die Zahlen unten sind reine Notnagel-Werte fuer den Fall,
 * dass der Aufruf ausfaellt — im Normalbetrieb werden sie ueberschrieben.
 * @param {NS} ns
 * @returns {{fee:number, msUpdate:number, msUpdateMin:number}}
 */
function readStockConstants(ns) {
    const out = { fee: 100e3, msUpdate: 6000, msUpdateMin: 1000 };
    try {
        const c = ns.stock.getConstants();
        if (c) {
            if (Number.isFinite(c.StockMarketCommission) && c.StockMarketCommission > 0) out.fee = c.StockMarketCommission;
            if (Number.isFinite(c.msPerStockUpdate) && c.msPerStockUpdate > 0) out.msUpdate = c.msPerStockUpdate;
            if (Number.isFinite(c.msPerStockUpdateMin) && c.msPerStockUpdateMin > 0) out.msUpdateMin = c.msPerStockUpdateMin;
        }
    } catch (e) { /* Notnagel-Werte behalten */ }
    return out;
}

/**
 * Freischaltungen aus ns.getResetInfo() ableiten (A1) — exakter Spiegel der
 * Engine-Gates in StockMarket.ts:151/163 (Short) und 178/192/204 (Orders).
 * ownedSF ist laut NetscriptFunctions.ts:1491 eine Map mit den AKTIVEN Leveln
 * (BitNode-Optionen bereits eingerechnet); die anderen Formen sind Absicherung.
 * @param {NS} ns
 * @returns {{node:number, sf8:number, canShort:boolean, canOrder:boolean}}
 */
function detectStockCaps(ns) {
    let node = 0, sf8 = 0;
    try {
        const ri = ns.getResetInfo();
        if (ri) {
            if (Number.isFinite(ri.currentNode)) node = Number(ri.currentNode);
            const m = ri.ownedSF;
            if (m instanceof Map) sf8 = Number(m.get(8)) || 0;
            else if (Array.isArray(m)) {
                for (const pair of m) if (Array.isArray(pair) && Number(pair[0]) === 8) sf8 = Number(pair[1]) || 0;
            } else if (m && typeof m === "object") {
                const v = (m[8] !== undefined) ? m[8] : m["8"];
                sf8 = Number(v) || 0;
            }
        }
    } catch (e) { /* konservativ: alles gesperrt */ }
    return { node, sf8, canShort: node === 8 || sf8 >= 2, canOrder: node === 8 || sf8 >= 3 };
}

/**
 * Schlafdauer bis zum naechsten Durchlauf (B4'). Ohne Bonus-Zeit ein Drittel
 * des Tick-Abstands (drei Blicke je Tick reichen, weil der Preis dazwischen
 * eingefroren ist); mit Bonus-Zeit die halbe Mindestdauer, damit bei
 * beschleunigtem Aufholen kein Tick verlorengeht.
 * @param {NS} ns
 * @param {{msUpdate:number, msUpdateMin:number}} K
 * @returns {number} ms
 */
function nextSleepMs(ns, K) {
    let ms = K.msUpdate / 3;
    try { if (ns.stock.getBonusTime() > 0) ms = K.msUpdateMin / 2; } catch (e) { /* kein TIX */ }
    return Math.max(50, Math.round(ms));
}

// ===========================================================================
// MARKTBUCH
// ===========================================================================

/**
 * Positionen, Preise und Forecast je Symbol EINMAL erheben.
 * getPosition liefert [longShares, longAvgPx, shortShares, shortAvgPx].
 * @returns {Array<Object>} Buch-Eintraege (werden von Trades mutiert, A4).
 */
function buildBook(ns, symbols, has4S, history, TUNE) {
    const book = [];
    for (const sym of symbols) {
        const e = {
            sym, lShares: 0, lAvg: 0, sShares: 0, sAvg: 0,
            ask: 0, bid: 0, forecast: 0.5, vola: 0, ready: false, room: -1,
        };
        try {
            const p = ns.stock.getPosition(sym);
            if (Array.isArray(p)) {
                e.lShares = Number(p[0]) || 0; e.lAvg = Number(p[1]) || 0;
                e.sShares = Number(p[2]) || 0; e.sAvg = Number(p[3]) || 0;
            }
        } catch (err) { /* Symbol ohne Position */ }
        try { e.ask = ns.stock.getAskPrice(sym); } catch (err) { e.ask = 0; }
        try { e.bid = ns.stock.getBidPrice(sym); } catch (err) { e.bid = 0; }

        if (has4S) {
            try {
                e.forecast = ns.stock.getForecast(sym);
                e.vola = ns.stock.getVolatility(sym);
                e.ready = Number.isFinite(e.forecast) && Number.isFinite(e.vola);
            } catch (err) { e.ready = false; }
        } else {
            const est = estimateFromHistory(history[sym], TUNE.MIN_HISTORY);
            if (est) { e.forecast = est.forecast; e.vola = est.vola; e.ready = true; }
        }
        book.push(e);
    }
    return book;
}

/**
 * Pre-4S-Schaetzung aus der Kurshistorie ([0] = neuester Preis).
 * forecast = Anteil der Aufwaertsbewegungen, vola = groesste relative Bewegung.
 * @returns {{forecast:number, vola:number}|null} null, wenn zu wenig Daten.
 */
function estimateFromHistory(h, minLen) {
    if (!h || h.length < minLen) return null;
    let ups = 0, vola = 0;
    for (let i = 0; i < h.length - 1; i++) {
        if (h[i] > h[i + 1]) ups++;
        const v = Math.abs(h[i] - h[i + 1]) / h[i + 1];
        if (v > vola) vola = v;
    }
    return { forecast: ups / (h.length - 1), vola };
}

// ===========================================================================
// PORTFOLIO & LIQUIDATION  (A2 / A3)
// ===========================================================================

/**
 * Liquidierbaren Depotwert bestimmen und die Verkaufsliste aufbauen.
 *
 * Erloesformeln der Engine (StockMarketHelpers.ts:42-60):
 *   Long : shares * bidPrice - kommission
 *   Short: shares * avgShortPx + ((avgShortPx - askPrice) * shares - kommission)
 *          = shares * (2 * avgShortPx - askPrice) - kommission
 * Der Short-Wert ist NICHT nach unten begrenzt (siehe A2 im Kopf).
 *
 * @returns {{value:number, held:Array<Object>, estimated:boolean}}
 */
function valuePortfolio(ns, book, K, CAP) {
    let value = 0, estimated = false;
    const held = [];
    for (const e of book) {
        if (e.lShares > 0) {
            const g = saleGain(ns, e.sym, e.lShares, "L",
                () => (e.bid > 0 ? e.lShares * e.bid - K.fee : NaN));
            if (Number.isFinite(g.value)) {
                value += g.value;
                if (g.estimated) estimated = true;
                // Nur werthaltige Positionen taugen zur Liquidation.
                if (g.value > 0) held.push({ sym: e.sym, pos: "L", shares: e.lShares, gain: g.value, rank: 0.5 - e.forecast });
            }
        }
        // Ohne Freischaltung kann es keine Short-Position geben; der Aufruf
        // wuerde nur unnoetig gegen das Engine-Gate laufen.
        if (CAP.canShort && e.sShares > 0) {
            const g = saleGain(ns, e.sym, e.sShares, "S",
                () => (e.ask > 0 && e.sAvg > 0 ? e.sShares * (2 * e.sAvg - e.ask) - K.fee : NaN));
            if (Number.isFinite(g.value)) {
                value += g.value;
                if (g.estimated) estimated = true;
                if (g.value > 0) held.push({ sym: e.sym, pos: "S", shares: e.sShares, gain: g.value, rank: e.forecast - 0.5 });
            }
        }
    }
    return { value, held, estimated };
}

/**
 * getSaleGain mit Eigenberechnung als Rueckfallebene.
 * GEPRUEFT WIRD AUF Number.isFinite, NICHT auf "> 0": ein API-Fehler war frueher
 * nicht von einer wertlosen Position zu unterscheiden, und genau daran hing der
 * Bug, der Port 26 dauerhaft auf 0 hielt.
 * @returns {{value:number, estimated:boolean}}
 */
function saleGain(ns, sym, shares, posType, fallback) {
    let v = NaN;
    try { v = ns.stock.getSaleGain(sym, shares, posType); } catch (e) { v = NaN; }
    if (Number.isFinite(v)) return { value: v, estimated: false };
    let f = NaN;
    try { f = fallback(); } catch (e) { f = NaN; }
    return { value: f, estimated: Number.isFinite(f) };
}

/**
 * Liquidationsauftrag der BANK abarbeiten: Positionen in der Reihenfolge
 * aufloesen, die der Trader ohnehin am ehesten verkaufen wuerde (hoechster
 * Ausstiegs-Rang zuerst). Fuehrt das Buch mit (A4).
 * @returns {number} tatsaechlich freigemachte Summe (Schaetzung nach Erloesformel)
 */
function runLiquidation(ns, held, request, bySym) {
    held.sort((a, b) => b.rank - a.rank);
    let raised = 0;
    for (const h of held) {
        if (raised >= request) break;
        let px = 0;
        try {
            px = (h.pos === "L") ? ns.stock.sellStock(h.sym, h.shares) : ns.stock.sellShort(h.sym, h.shares);
        } catch (e) { px = 0; }
        if (!(px > 0)) continue;
        raised += h.gain;
        const e = bySym[h.sym];
        if (e) {
            if (h.pos === "L") { e.lShares = 0; e.lAvg = 0; }
            else { e.sShares = 0; e.sAvg = 0; }
        }
        ns.print("LIQUIDATION (BANK): " + h.sym + " " + h.pos + " aufgeloest (~"
            + fmtMoney(ns, h.gain) + ").");
    }
    return raised;
}

// ===========================================================================
// HANDEL
// ===========================================================================

/**
 * Ausstiege (B3-Hysterese). Fuehrt Buch und Barbestand mit (A4/A5).
 * sellStock liefert den bidPrice, sellShort den askPrice (StockMarket.ts:140/171).
 * @returns {number} aktualisierter Barbestand
 */
function runExits(ns, book, K, CAP, TUNE, cash, mayOpenShort) {
    for (const e of book) {
        // T4b ABWICKLUNG: Shorts ohne 4S werden abgebaut, auch ohne Signal.
        // Sie liegen sonst unbegrenzt auf einer Haeufigkeitsschaetzung — genau
        // die Lage, aus der die FLCM-Position entstanden ist.
        if (CAP.canShort && !mayOpenShort && e.sShares > 0) {
            let px = 0;
            try { px = ns.stock.sellShort(e.sym, e.sShares); } catch (err) { px = 0; }
            if (px > 0) {
                const proceeds = e.sShares * (2 * e.sAvg - px) - K.fee;
                cash += proceeds;
                ns.print("ABWICKLUNG (Short ohne 4S): " + e.sym + " geschlossen, "
                    + fmtMoney(ns, proceeds));
                e.sShares = 0; e.sAvg = 0;
            }
        }
        if (!e.ready) continue;

        if (e.lShares > 0 && e.forecast < TUNE.LONG_EXIT) {
            let px = 0;
            try { px = ns.stock.sellStock(e.sym, e.lShares); } catch (err) { px = 0; }
            if (px > 0) {
                const proceeds = e.lShares * px - K.fee;
                const profit = (px - e.lAvg) * e.lShares - 2 * K.fee;
                cash += proceeds;
                ns.print("VERKAUFT (Long): " + e.sym + " | Gewinn " + fmtMoney(ns, profit));
                e.lShares = 0; e.lAvg = 0;
            }
        }

        if (CAP.canShort && e.sShares > 0 && e.forecast > TUNE.SHORT_EXIT) {
            let px = 0;
            try { px = ns.stock.sellShort(e.sym, e.sShares); } catch (err) { px = 0; }
            if (px > 0) {
                const proceeds = e.sShares * (2 * e.sAvg - px) - K.fee;
                const profit = (e.sAvg - px) * e.sShares - 2 * K.fee;
                cash += proceeds;
                ns.print("GEDECKT (Short): " + e.sym + " | Gewinn " + fmtMoney(ns, profit));
                e.sShares = 0; e.sAvg = 0;
            }
        }
    }
    return cash;
}

/**
 * Einstiege mit Sizing (B1) und Mindestgroesse (B2).
 *
 * Sizing: Gewicht eines Kandidaten = sein Erwartungswert im Verhaeltnis zur
 * Summe aller Erwartungswerte, gedeckelt auf MAX_SYMBOL_FRAC des Startkapitals.
 * Damit entscheidet nicht mehr die Reihenfolge von getSymbols(), wer Kapital
 * bekommt. Restkapital bleibt liegen und wird im naechsten Tick neu verteilt.
 *
 * Mindestgroesse: eine Position muss ihre Rundlaufkosten (2 x Kommission plus
 * Spread) binnen BREAKEVEN_TICKS Markt-Ticks verdienen.
 *
 * buyStock liefert den askPrice, buyShort den bidPrice (StockMarket.ts:129/152).
 * maxShares begrenzt Long UND Short gemeinsam (BuyingAndSelling.tsx:261).
 * @returns {number} aktualisierter Barbestand
 */
function runEntries(ns, book, K, CAP, TUNE, cash, cap, depot, mayOpenShort, stat, manipInfo) {
    const S = stat || newStat();   // Diagnose optional (Tests/Handaufruf)
    if (!(cash > K.fee)) return cash;

    // =========================================================================
    // v1.6 — WER GESCHOBEN WERDEN KANN, WIRD ZUERST GEKAUFT
    // =========================================================================
    // Die Schleife war offen: der Trader kaufte nach Prognose, und ERST DANACH
    // fragte buildManipTargets, welche der gehaltenen Positionen der Dispatcher
    // ueberhaupt schieben kann. Im Livebericht aus BN8 stand das Ergebnis:
    //     "Trader haelt Positionen ($4.49b), aber KEINE davon ist beeinflussbar."
    // Gekauft wurde also genau an dem Vorteil vorbei, der in dieser BitNode der
    // einzige ist.
    //
    // Warum das gerade in BN8 zaehlt: hack() beeinflusst den Kurs ueber
    // moneyDrained, NICHT ueber moneyGained (NetscriptHelpers.tsx:641/662). Der
    // Multiplikator ScriptHackMoneyGain=0 nimmt einem also das Geld, nicht die
    // Hebelwirkung. Und die Richtung muss man nicht erraten — man setzt sie
    // selbst: long halten und grow()en treibt hoch, short halten und hack()en
    // drueckt (PlayerInfluencing.ts:24/47). Shorting ist in BN8 ohnehin frei
    // (StockTicker.tsx:277).
    //
    // Zwei Regeln, beide NUR aktiv wenn Beeinflussung fuehrt:
    //   1. GEWICHT: beeinflussbare Kandidaten bekommen expRet x MANIP_BUY_BONUS.
    //      Damit gewinnen sie Rangfolge UND Budgetanteil, ohne dass eine zweite
    //      Zuteilungslogik entsteht — es ist dieselbe Sortierung wie vorher.
    //   2. SCHWELLE: ihre Einstiegsschwelle wird um MANIP_ENTER_RELAX gelockert.
    //      Ohne das waere Regel 1 oft gegenstandslos: man kann nur bevorzugen,
    //      was ueberhaupt in die Auswahl kommt, und ohne 4S ist die geschaetzte
    //      Prognose traege. Gelockert, nicht abgeschafft — gegen einen klar
    //      fallenden Kurs anzuschieben bleibt schlechter Handel.
    //
    // ALLE anderen Schutzmechanismen bleiben unangetastet: Amortisation (B2),
    // Deckel je Symbol, freie Stueckzahl, Barreserve.
    //
    // Fehlt manipInfo oder meldet der Dispatcher hackPays nicht (aeltere
    // Version), ist "fuehrt" false und diese Funktion verhaelt sich Zeile fuer
    // Zeile wie vorher. Das ist Absicht: kein Raten ueber die BitNode.
    const mFuehrt = !!(manipInfo && manipInfo.fuehrt && manipInfo.kann && manipInfo.kann.size > 0);
    const istBeeinflussbar = (sym) => {
        if (!mFuehrt) return false;
        const org = resolveOrg(ns, sym, manipInfo.orgOf || {});
        return !!org && manipInfo.kann.has(org);
    };

    // K1: Der Einsatz ist doppelt begrenzt — durch das vorhandene Bargeld UND
    // durch den Kopfraum unter dem Einsatzdeckel. Frueher zaehlte nur das Bar-
    // kapital; nach einer Liquidation war das wieder voll, also durfte dasselbe
    // Symbol beliebig oft nachgekauft werden.
    const headroom = Math.max(0, cap.limit - depot);
    if (!(headroom > K.fee)) { S.rejBudget++; return cash; }
    const budgetTotal = Math.min(cash, headroom);

    const cands = [];
    for (const e of book) {
        if (!e.ready) continue;
        const edge = Math.abs(e.forecast - 0.5);
        const expRet = e.vola * edge;
        if (!(expRet > 0)) { S.rejSignal++; continue; }

        // v1.6: Beeinflussbarkeit erst hier pruefen — resolveOrg kostet einen
        // Cache-Zugriff je Symbol, und ohne Signalgrundlage waere er umsonst.
        const schiebbar = istBeeinflussbar(e.sym);
        const lockern = schiebbar ? TUNE.MANIP_ENTER_RELAX : 0;

        let dir = null;
        if (e.forecast > TUNE.LONG_ENTER - lockern) dir = "L";
        else if (mayOpenShort && e.forecast < TUNE.SHORT_ENTER + lockern) dir = "S";   // T4
        if (!dir) { S.rejSignal++; continue; }
        S.signals++;

        // v1.6: Das GEWICHT bestimmt Rangfolge und Budgetanteil. Es ist
        // absichtlich eine EIGENE Groesse neben expRet und nicht dessen
        // Ueberschreibung: expRet geht unten in die Amortisationsrechnung ein
        // (netPerTick, minValue). Wuerde man dort den Bonus mitschleppen, waere
        // der Schutz gegen Geschaefte, die Spread und Kommission nie
        // hereinholen, um den Faktor MANIP_BUY_BONUS aufgeweicht — und zwar
        // still. Der Bonus darf die Reihenfolge aendern, nicht die Rechnung,
        // ob sich ein Kauf ueberhaupt traegt.
        const gewicht = schiebbar ? expRet * TUNE.MANIP_BUY_BONUS : expRet;

        const price = (dir === "L") ? e.ask : e.bid;
        if (!(price > 0) || !(e.ask > 0) || !(e.bid > 0)) continue;

        // Freie Stueckzahl erst hier abfragen — spart getMaxShares auf allen
        // Symbolen ohne Kaufsignal.
        if (e.room < 0) {
            let mx = 0;
            try { mx = ns.stock.getMaxShares(e.sym); } catch (err) { mx = 0; }
            e.room = Math.max(0, mx - e.lShares - e.sShares);
        }
        if (e.room <= 0) { S.rejRoom++; continue; }

        // B2: Mindestwert aus der Amortisationsbedingung.
        const spreadFrac = (e.ask - e.bid) / e.ask;
        const netPerTick = expRet * TUNE.BREAKEVEN_TICKS - spreadFrac;
        if (!(netPerTick > 0)) { S.rejAmort++; continue; }   // rechnet sich nie
        const minValue = (2 * K.fee) / netPerTick;
        if (minValue < S.minValLow) S.minValLow = minValue;

        cands.push({ e, dir, price, expRet, gewicht, minValue, schiebbar });
    }
    if (cands.length === 0) return cash;
    S.cands += cands.length;

    cands.sort((a, b) => b.gewicht - a.gewicht);
    const startCash = budgetTotal;
    const perSymbol = cap.limit * TUNE.MAX_SYMBOL_FRAC;   // gemessen am DECKEL
    let weightSum = 0;
    for (const c of cands) weightSum += c.gewicht;
    if (!(weightSum > 0)) return cash;
    S.perSymbol = perSymbol;

    for (const c of cands) {
        if (!(cash > K.fee)) { S.rejBudget++; break; }
        const share = startCash * (c.gewicht / weightSum);
        // Je Symbol gilt der Deckel-Anteil ABZUEGLICH der bereits gehaltenen
        // Position — sonst waechst ein Symbol ueber Nachkaeufe beliebig weit.
        const holdVal = c.e.lShares * c.e.ask + c.e.sShares * c.e.bid;
        const room = Math.max(0, perSymbol - holdVal);
        const budget = Math.min(share, room, cash);
        const spend = budget - K.fee;
        if (!(spend > 0)) { S.rejBudget++; continue; }

        let shares = Math.floor(spend / c.price);
        if (shares > c.e.room) shares = c.e.room;
        if (shares <= 0) { S.rejBudget++; continue; }
        if (shares * c.price < c.minValue) { S.rejSmall++; continue; }   // B2

        let px = 0;
        try {
            px = (c.dir === "L") ? ns.stock.buyStock(c.e.sym, shares) : ns.stock.buyShort(c.e.sym, shares);
        } catch (err) { px = 0; }
        if (!(px > 0)) continue;

        const cost = shares * px + K.fee;
        cash -= cost;
        S.bought++;
        applyFill(c.e, c.dir, shares, px);              // A4
        ns.print("GEKAUFT (" + (c.dir === "L" ? "Long" : "Short") + (c.schiebbar ? ", schiebbar" : "") + "): "
            + fmtNum(ns, shares) + "x " + c.e.sym + " fuer " + fmtMoney(ns, cost));
    }
    return cash;
}

/** Buch nach einem Kauf fortschreiben: Stueckzahl und Durchschnittspreis (A4). */
function applyFill(e, dir, shares, px) {
    if (dir === "L") {
        const total = e.lAvg * e.lShares + px * shares;
        e.lShares += shares;
        e.lAvg = e.lShares > 0 ? total / e.lShares : 0;
    } else {
        const total = e.sAvg * e.sShares + px * shares;
        e.sShares += shares;
        e.sAvg = e.sShares > 0 ? total / e.sShares : 0;
    }
    if (e.room > 0) e.room = Math.max(0, e.room - shares);
}

/**
 * KURSBEEINFLUSSUNG (v1.4): melden, welche Organisation in welche Richtung
 * beeinflusst werden soll. Ausfuehrung und Zielwahl liegen beim DISPATCHER.
 *
 * NUR GEHALTENE POSITIONEN. Ohne Position waere die Beeinflussung eine Wette:
 * bis der zweite Forecast von neutral auf das Maximum steht, braucht es rund
 * 500 Impulse (Schrittweite 0.1 auf einer 0-100-Skala, Stock.ts:154-161), und
 * die Positionsgroesse ist ohnehin durch den Einsatzdeckel begrenzt.
 *
 * RICHTUNG statt An/Aus:
 *   "up"   Long gehalten  -> nur grow beeinflusst (hack schafft nur Platz)
 *   "down" Short gehalten -> nur hack beeinflusst
 * Beides gleichzeitig zu beeinflussen wuerde sich gegenseitig aufheben —
 * PlayerInfluencing.ts vergibt +0.1 bei grow und -0.1 bei hack.
 *
 * Sortiert nach gebundenem Kapital: wo am meisten Geld liegt, lohnt der Einsatz
 * am meisten. Die Meldung steht auch ohne Markt-Tick (peek), damit der
 * Dispatcher-Slowtakt sie nicht verpasst.
 */
function buildManipTargets(ns, book, orgOf, TUNE, machbar) {
    // v11.0 MACHBARKEIT SCHLAEGT POSITIONSWERT.
    //
    // Diese Funktion sortierte nach gebundenem Kapital — und das sind die
    // Megacorps, deren Server im Spiel die am schwersten zu rootenden sind. Der
    // Trader kennt keine Server, also meldete er munter ECorp und MegaCorp,
    // waehrend der Dispatcher davon nichts bedienen konnte. Im Livereport:
    //     SOLL: ECorp, MegaCorp, Microdyne, Omega Software, AeroCorp, Rho Construction
    //     IST:  omega-net, rho-construction
    // und einen Zyklus spaeter "der Dispatcher findet dafuer keinen Server".
    // Die Rangfolge war damit ANTIKORRELIERT mit dem, was tatsaechlich ging.
    //
    // "machbar" ist die Liste aus DISP_OUT.manipOk. Ist sie leer (Dispatcher
    // meldet noch nichts, aeltere Version), faellt die Funktion auf das alte
    // Verhalten zurueck — lieber ein unerreichbares Ziel als gar keines.
    const kann = (machbar && machbar.length > 0) ? new Set(machbar) : null;
    const list = [];
    const verworfen = [];
    for (const e of book) {
        const org = resolveOrg(ns, e.sym, orgOf);
        if (!org) continue;
        // Wert der gehaltenen Position als Rang. Long und Short zaehlen getrennt;
        // haelt der Trader wider Erwarten beides, gewinnt die groessere Seite.
        const lv = e.lShares > 0 ? e.lShares * e.bid : 0;
        const sv = e.sShares > 0 ? e.sShares * e.ask : 0;
        if (lv <= 0 && sv <= 0) continue;
        const dir = lv >= sv ? "up" : "down";
        const eintrag = { org, dir, val: Math.round(Math.max(lv, sv)) };
        if (kann && !kann.has(org)) { verworfen.push(org); continue; }
        list.push(eintrag);
    }
    list.sort((a, b) => b.val - a.val);
    const top = list.slice(0, TUNE.MANIP_TOP_N);
    // Stillschweigend verwerfen waere genau der Fehler von vorher: niemand
    // haette gemerkt, dass die halbe Liste ins Leere lief.
    if (verworfen.length > 0 && top.length === 0) {
        ns.print("MANIP: keines der gehaltenen Symbole ist beeinflussbar ("
            + verworfen.slice(0, 4).join(", ") + (verworfen.length > 4 ? " ..." : "")
            + ") — Server nicht gerootet, Level zu niedrig oder ohne Server im Netz.");
    }
    return top;
}

/**
 * Symbol -> Organisation. Statisch (die Zuordnung aendert sich nie), deshalb
 * einmal je Symbol abgefragt und danach aus dem Cache. getOrganization kostet
 * GetStock (2 GB) — einmal fuer die ganze Datei, nicht je Aufruf.
 * @returns {string|null}
 */
function resolveOrg(ns, sym, cache) {
    if (Object.prototype.hasOwnProperty.call(cache, sym)) return cache[sym];
    let org = null;
    try { const o = ns.stock.getOrganization(sym); if (typeof o === "string" && o) org = o; }
    catch (e) { org = null; }
    cache[sym] = org;
    return org;
}

/**
 * Volatilitaets-Ziele fuer die Darknet-Roamer veroeffentlichen (Port 21).
 * NUR mit echtem 4S-Forecast: ohne Richtungswissen waere das Hochtreiben der
 * Volatilitaet kontraproduktiv. Gemeldet werden gehaltene Positionen und
 * aktuelle Kaufsignale, staerkste Richtung zuerst.
 */
function buildPromoteTargets(ns, book, has4S, CAP, TUNE, mayOpenShort, manip, orgOf) {
    // =========================================================================
    // v11.0 — DAS has4S-GATE WAR FALSCH HERUM
    // =========================================================================
    // Hier stand  if (has4S) { ... }  sonst "NONE". Begruendung im alten Kopf:
    // "ohne Richtungswissen waere das Hochtreiben der Volatilitaet
    // kontraproduktiv". Das stimmt fuer PASSIVES Handeln — aber bei aktiver
    // Kursbeeinflussung setzt der Schwarm die Richtung SELBST und kennt sie
    // deshalb ohne 4S. Genau so steht es im Kopf von SCHWARM-DISPATCHER
    // ("funktioniert OHNE 4S, weil man die Richtung selbst setzt"). Die beiden
    // Dateien widersprachen sich.
    //
    // Folge in BN8 (FOURS:0, Boerse ist die einzige Geldquelle): der
    // Darknet-Promoter hat dort noch NIE gelaufen.
    //
    // WAS DER PROMOTER TUT — und warum die Reihenfolge zaehlt:
    //   av = random x (mv x getDarknetVolatilityMult(sym)) / 100
    // Er vergroessert die AMPLITUDE der Kursschritte, nicht ihre Richtung
    // (StockMarket.ts:264). Die Richtung entscheidet chc aus dem Forecast.
    // Bei neutralem Forecast (chc ~ 0.5) verdoppelt mehr Volatilitaet also nur
    // die Varianz — Erwartungswert bleibt null. Erst wenn die Richtung steht,
    // wird aus Amplitude Ertrag. Deshalb: promoten NUR, was auch beeinflusst
    // wird, und zwar in derselben Rangfolge.
    //
    // Der Multiplikator ist gedeckelt (max 4,0) und zerfaellt je Marktzyklus
    // um den Faktor 0,4 (effects.ts:216) — Nachschub muss also laufen.
    let payload = "NONE";
    const list = [];

    // 1. Vorrang: die Symbole, die der Dispatcher gerade aktiv beeinflusst.
    //    Deren Richtung ist bekannt, ohne dass 4S noetig waere.
    if (Array.isArray(manip) && manip.length > 0) {
        const wanted = new Set(manip.map(m => m.org));
        for (const e of book) {
            if (!e.ready) continue;
            const org = resolveOrg(ns, e.sym, orgOf || {});
            if (org && wanted.has(org)) list.push({ sym: e.sym, strength: 2 });
        }
    }

    // 2. Ergaenzend (nur mit 4S): starke Forecast-Signale ohne Beeinflussung.
    //    Hier ist das alte Argument weiterhin richtig — ohne Forecast waere das
    //    blindes Aufdrehen der Varianz.
    if (has4S) {
        for (const e of book) {
            if (!e.ready) continue;
            if (list.some(x => x.sym === e.sym)) continue;
            const holding = e.lShares > 0 || e.sShares > 0;
            const signal = e.forecast > TUNE.LONG_ENTER || (mayOpenShort && e.forecast < TUNE.SHORT_ENTER);
            if (holding || signal) list.push({ sym: e.sym, strength: Math.abs(e.forecast - 0.5) });
        }
    }

    // 3. v0.6 ENTKOPPLUNG: gehaltene Positionen, die NICHT beeinflusst werden.
    //
    //    Seit die Promote-Liste an den Beeinflussungszielen haengt, teilen sich
    //    beide Kanaele einen Ausfallpunkt. Live nachweisbar in BN13:
    //        TRADER_OUT: {"portfolio":840336280, "manip":[], "promote":"NONE"}
    //    Das Depot stand bei ueber 800 Mio, beeinflussbar war nichts (bei
    //    Hacking-Level 105 ist kaum ein Konzern-Server gerootet) - und damit fiel
    //    auch der Promoter aus, obwohl er von der Zielwahl gar nicht abhaengt.
    //
    //    Volatilitaet wirkt auf den KURS, nicht auf die Richtung: getDarknetVolatilityMult
    //    geht als Faktor in die Schrittweite ein (StockMarket.ts). Fuer eine gehaltene
    //    Position ist eine groessere Schrittweite auch ohne aktive Beeinflussung
    //    nutzbar - der Trader verkauft ohnehin nach seiner eigenen Regel.
    //    Deshalb: niedrigere Gewichtung als die beeinflussten Symbole, aber nicht null.
    for (const e of book) {
        if (!e.ready) continue;
        if (list.some(x => x.sym === e.sym)) continue;
        if (!(e.lShares > 0 || e.sShares > 0)) continue;
        list.push({ sym: e.sym, strength: 0.5 });
    }

    list.sort((a, b) => b.strength - a.strength);
    const top = list.slice(0, TUNE.PROMOTE_TOP_N).map(c => c.sym);
    if (top.length > 0) payload = top.join(",");
    return payload;
}

// ===========================================================================
// EINSATZKAPITAL  (K1 / K2)
// ===========================================================================

/**
 * Einsatzdeckel: wieviel Kapital der Trader binden darf.
 *
 *     deckel = einlage + REINVEST x max(0, gewinn)
 *     gewinn = stockCashflow + depotwert
 *
 * WARUM NICHT DER ROHE CASHFLOW: getMoneySources().sinceInstall["stock"] ist der
 * Netto-Cashflow, nicht der Gewinn — BuyingAndSelling.tsx bucht Kauf (loseMoney,
 * Z. 105/280) und Verkauf (gainMoney, Z. 173/362) auf denselben Zaehler. Bei
 * offenen Positionen ist er negativ, weil die Kaufkosten abgeflossen und die
 * Erloese noch nicht da sind. Erst zusammen mit dem Depotwert ergibt sich der
 * Gewinn; auf dem rohen Cashflow wuerde der Deckel genau dann schrumpfen, wenn
 * der Trader arbeitet.
 *
 * Der Deckel BINDET KEIN GELD — er begrenzt nur, wieviel gebunden werden darf.
 * Nicht Gekauftes liegt auf dem einen Spielerkonto und steht BANK zur Verfuegung.
 * Deshalb gibt es auch keinen "Verfall" ungenutzten Kapitals: er waere eine
 * Einwegsperre, die den Trader nach jedem Abschwung dauerhaft klein hielte.
 *
 * @returns {{limit:number, gain:number, base:number, ok:boolean}}
 */
function capitalCap(ns, depotValue, cashValue, K, TUNE) {
    const base = K.fee * TUNE.START_FEES;
    const depot = Number.isFinite(depotValue) ? Math.max(0, depotValue) : 0;
    const bar = Number.isFinite(cashValue) ? Math.max(0, cashValue) : 0;

    // Pfad 2: VERMOEGENSBODEN. Kennt keine Historie und ist damit immun gegen
    // Altlasten im Cashflow (siehe Kopf v1.3). Waechst automatisch mit.
    const floor = TUNE.TRADE_FRAC * (bar + depot);

    let flow = 0, ok = false;
    try {
        const src = ns.getMoneySources().sinceInstall || {};
        // Index-Zugriff: Namespace-Namen koennten von der statischen RAM-Analyse
        // gematcht werden (Doktrin: im Zweifel Index statt Punkt).
        const v = Number(src["stock"]);
        if (Number.isFinite(v)) { flow = v; ok = true; }
    } catch (e) { ok = false; }

    if (!ok) {
        // Gewinn nicht messbar -> Boden gegen Einlage. Der Boden ist die
        // konservativere Groesse nur dann NICHT, wenn kaum Vermoegen da ist.
        const limit = Math.max(base, floor);
        return { limit, gain: 0, base, floor, ok: false, src: limit === floor ? "Boden" : "Einlage" };
    }
    const gain = flow + depot;
    const byGain = base + TUNE.REINVEST * Math.max(0, gain);
    const limit = Math.max(byGain, floor);
    return { limit, gain, base, floor, ok: true, src: limit === floor && floor > byGain ? "Boden" : "Gewinn" };
}

/**
 * AUSSCHUETTUNG (K2): Depot ueber dem Deckel abbauen, schwaechste Position
 * zuerst. Der Aufrufer stellt sicher, dass nur bei GEWINN ausgeschuettet wird —
 * bei Buchverlusten wuerde ein Zwangsverkauf den Verlust realisieren, den Gewinn
 * weiter druecken und den naechsten Zwangsverkauf ausloesen.
 * @returns {number} tatsaechlich freigemachte Summe
 */
function payout(ns, held, excess, bySym, cap) {
    if (!(excess > 0) || !held || held.length === 0) return 0;
    const list = held.slice().sort((a, b) => b.rank - a.rank);
    let freed = 0;
    for (const h of list) {
        if (freed >= excess) break;
        let px = 0;
        try {
            px = (h.pos === "L") ? ns.stock.sellStock(h.sym, h.shares) : ns.stock.sellShort(h.sym, h.shares);
        } catch (e) { px = 0; }
        if (!(px > 0)) continue;
        freed += h.gain;
        const e = bySym[h.sym];
        if (e) { if (h.pos === "L") { e.lShares = 0; e.lAvg = 0; } else { e.sShares = 0; e.sAvg = 0; } }
        ns.print("AUSSCHUETTUNG: " + h.sym + " " + h.pos + " -> " + fmtMoney(ns, h.gain)
            + " (Deckel " + fmtMoney(ns, cap.limit) + ")");
    }
    return freed;
}

// ===========================================================================
// DIAGNOSE (v1.2) — beantwortet "warum wird nicht gekauft?"
// ===========================================================================

/** Frischer Zaehlersatz fuer ein Diagnose-Fenster. */
function newStat() {
    return {
        ticks: 0, trade: 0, quiet: 0, blocked: 0,
        signals: 0, cands: 0, bought: 0,
        rejSignal: 0, rejRoom: 0, rejAmort: 0, rejSmall: 0, rejBudget: 0,
        minValLow: Infinity, perSymbol: 0,
    };
}

/**
 * Statuszeile. Aendert nichts, erklaert nur — aber sie beantwortet die Frage,
 * die sich aus dem Log allein nicht beantworten liess: warum bleibt das Depot
 * klein, obwohl der Deckel Platz haette?
 *
 * DIE ENTSCHEIDENDE ZEILE ist der Vergleich "kleinstes minValue" gegen
 * "Limit je Symbol". minValue ist die Positionsgroesse, ab der sich ein Kauf
 * binnen BREAKEVEN_TICKS amortisiert (B2); perSymbol ist, was der Deckel je
 * Symbol ueberhaupt zulaesst. Liegt die Schwelle DAUERHAFT ueber dem Limit,
 * kann kein Signal je durchkommen — dann blockieren sich B2 und der Deckel
 * gegenseitig, und die Stellschraube ist BREAKEVEN_TICKS oder MAX_SYMBOL_FRAC,
 * nicht die Signalqualitaet.
 */
function printStatus(ns, S, cap, depot, cash, K, TUNE) {
    const pct = cap.limit > 0 ? (depot / cap.limit * 100) : 0;
    ns.print("STATUS  Deckel " + fmtMoney(ns, cap.limit) + " via " + (cap.src || "?")
        + "  [Gewinnpfad: " + fmtMoney(ns, cap.base) + " + "
        + Math.round(TUNE.REINVEST * 100) + "% von " + fmtMoney(ns, cap.gain)
        + " | Boden: " + Math.round(TUNE.TRADE_FRAC * 100) + "% vom Vermoegen = "
        + fmtMoney(ns, cap.floor || 0) + "]"
        + (cap.ok ? "" : "  (Gewinn nicht messbar)"));
    ns.print("        Depot " + fmtMoney(ns, depot) + " = " + pct.toFixed(0) + "% des Deckels"
        + " | Bar " + fmtMoney(ns, cash)
        + " | Ticks " + S.ticks + " (Handel " + S.trade + ", ruhig " + S.quiet
        + (S.blocked > 0 ? ", gesperrt " + S.blocked : "") + ")");
    ns.print("        Signale " + S.signals + " -> Kandidaten " + S.cands + " -> gekauft " + S.bought
        + " | abgelehnt: Amortisation " + S.rejAmort + ", zu klein " + S.rejSmall
        + ", Platz " + S.rejRoom + ", Budget " + S.rejBudget);

    if (S.perSymbol > 0) {
        const low = Number.isFinite(S.minValLow) ? S.minValLow : null;
        ns.print("        Schwelle: kleinstes minValue "
            + (low === null ? "—" : fmtMoney(ns, low))
            + " | Limit je Symbol " + fmtMoney(ns, S.perSymbol));
        if (low !== null && low > S.perSymbol && S.bought === 0) {
            ns.print("        -> B2 BLOCKIERT: selbst das beste Signal braucht eine groessere "
                + "Position, als der Deckel je Symbol zulaesst. Stellschraube ist "
                + "BREAKEVEN_TICKS (" + TUNE.BREAKEVEN_TICKS + ") oder MAX_SYMBOL_FRAC ("
                + TUNE.MAX_SYMBOL_FRAC + "), nicht die Signalqualitaet.");
        }
    } else if (S.trade > 0 && S.signals === 0) {
        ns.print("        -> kein einziges Kaufsignal im Fenster (Forecasts in der Totzone "
            + "oder Pre-4S-Historie noch zu kurz).");
    }
}

// ===========================================================================
// KLEINWERKZEUG
// ===========================================================================

const EMPTY_PORT = "NULL PORT DATA";

function safeCall(fn, fallback) {
    try { const v = fn(); return (v === undefined || v === null) ? fallback : v; }
    catch (e) { return fallback; }
}

function writePort(ns, port, value) {
    try { const h = ns.getPortHandle(port); h.clear(); h.tryWrite(String(value)); return true; }
    catch (e) { return false; }
}

function clearPort(ns, port) {
    try { ns.getPortHandle(port).clear(); return true; } catch (e) { return false; }
}

function readNumberPort(ns, port) {
    try {
        const v = ns.peek(port);
        if (v === EMPTY_PORT) return 0;
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : 0;
    } catch (e) { return 0; }
}

/** ns.format.* kostet 0 GB (RamCostGenerator.ts:264-270); Fallback fuer Mocks. */
function fmtMoney(ns, n) {
    try { return ns.format.money(n); } catch (e) { return "$" + Math.round(Number(n) || 0); }
}

function fmtNum(ns, n) {
    try { return ns.format.number(n); } catch (e) { return String(Math.round(Number(n) || 0)); }
}
`;
const SRC_BLADEBURNER = `/**
 * SCHWARM-BLADEBURNER.js — v0.6 (eigenstaendig: warten statt beenden, Simulacrum-Schutz in einem Zug)
 *
 * v0.6 — SCHUTZ OHNE LUECKE. v0.5 startete bei UNBEKANNTEM Simulacrum-Stand
 *   (Probe ohne RAM) trotzdem, ohne die Arbeit zu pruefen, und fragte Arbeit
 *   und Start in zwei getrennten Wegwerf-Skripten ab. Jetzt: Simulacrum
 *   GESICHERT -> starten; sonst Arbeitsabfrage und Start im SELBEN Skript,
 *   und wer arbeitet, wird nicht unterbrochen. Unbekannt = nichts abbrechen.
 *
 * v0.5 — EIGENSTAENDIG. Die QUEEN startet mich seit HELPERS v5.13 selbst.
 *   (1) Noch nicht in der Division: WARTEN (je 60 s ein Beitrittsversuch),
 *       nicht beenden - sonst startete die QUEEN mich jeden Takt neu.
 *   (2) Ohne The Blade's Simulacrum ruft startAction in der Engine
 *       Player.finishWork(true) auf (Bladeburner.ts) - bricht also die
 *       laufende Arbeit ab, auch ein Grafting. Bisher verhinderte das WORK
 *       nur zufaellig. Jetzt pruefe ich es selbst: ohne Simulacrum keine
 *       Aktion, solange der Spieler etwas tut. Skills, Stadt und Chaos
 *       laufen weiter - die brechen nichts ab.
 *
 * v0.4 — Schritt 2: Erkundungs-Fallback statt stumpfem Training
 * Eigenständiger Bladeburner-Daemon des Kybernetik-Schwarms (Bitburner v3.0.1).
 *
 * CHANGELOG v0.4:
 *   - FIX: Count-Filter von ">1" auf ">=1" korrigiert (die exakt letzte verfügbare
 *     Aktion wurde bisher verschenkt).
 *   - NEU: Intelligente Fallback-Kette, wenn weder sichere Operation noch Contract
 *     verfügbar ist (früher IMMER sofort Training):
 *       a) Aufträge leer & Pop niedrig  → Incite Violence (neue Aufträge; abschaltbar
 *          via INCITE_ENABLED, weil es Chaos in ALLEN Städten erhöht → senkt Chancen).
 *       b) Pop niedrig                   → Field Analysis (schärft die Schätzung,
 *          verengt die Chance-Spanne → hebt die untere Grenze; stamina-frei).
 *       c) Pop ok, Chance dennoch zu gering → Training (Kampfstats sind der Engpass).
 *   - Statuszeile nennt bei Bedarf den Fallback-Grund.
 *
 * CHANGELOG v0.3:
 *   - NEU: Automatischer Stadtwechsel in die Synth-reichste Stadt (Hysterese
 *     CITY_SWITCH_FACTOR gegen Flackern). Statuszeile zeigt geschätzte Population.
 *
 * Doktrin:
 *   - VOLLSTÄNDIG STANDALONE: kein helpers.js, kein work-for-factions, KEINE Imports.
 *   - RAM-Dodge per "Payload als String": teure ns.bladeburner.*-Calls liegen NUR
 *     als String im Code (Abschnitt bb()). Der RAM-Zähler ignoriert Strings → der
 *     Daemon selbst bleibt winzig (~3 GB). Bezahlt wird nur das erzeugte Mini-Skript,
 *     und das auch nur, solange es läuft (Sekundentakt, kein Hot-Path → Doktrin-konform).
 *   - Jede ns-nutzende Stelle ist try…catch-isoliert; der Loop crasht nie.
 *
 * Voraussetzungs-Check (BitNode-abhängig, beim Start + laufend):
 *   - inBladeburner()? Falls nein → joinBladeburnerDivision() versuchen. Diese Funktion
 *     prüft INTERN: SF6/SF7 vorhanden, BN nicht gesperrt, alle Kampfstats ≥ 100.
 *     Schlägt sie fehl → idlen + Status melden, später erneut versuchen.
 *
 * Strategie-Fokus: schnell Rang → Bladeburner-Faktion-Ruf → Augs.
 *   Geld ist bei Bladeburner Nebensache (das liefert HASHNET/Hacking).
 *
 * Test:  run SCHWARM-BLADEBURNER.js   (Tail beobachten)
 *
 * @param {NS} ns
 */

// =============================================================================
// KONFIGURATION (oben halten = leicht tunebar)
// =============================================================================

/*__PORTS__*/
const BB_DIR = "/schwarm-bb";                 // Ordner für die Wegwerf-Skripte
const CITIES = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"];
const ANTI_CHAOS_OP = "Stealth Retirement Operation"; // schneller/effektiver als Diplomacy

const CFG = {
    LOOP_MS: 2000,        // Takt des Hauptloops
    WAIT_MS: 8000,        // Takt, solange Voraussetzungen fehlen
    SUCCESS_MIN: 0.95,    // Operations/BlackOps NUR ab dieser Min-Chance (Fehlschlag kostet Rang!)
    // v0.4: Ab welcher Spannweite der Schaetzung eine BlackOp erst aufgeklaert
    // wird, statt sie zu verwerfen. Siehe die lange Begruendung an der
    // Entscheidungsstelle weiter unten.
    EST_SPREAD_MAX: 0.02,
    RECON_MAX_ROUNDS: 40, // danach Aufklaerung pausieren, damit nichts festhaengt
    CONTRACT_MIN: 0.50,   // Contracts dürfen aggressiver laufen (Fehlschlag kostet KEINEN Rang)
    LOW_STAMINA: 0.50,    // unter diesem Wert: stamina-freie Aktion
    HIGH_STAMINA: 0.60,   // erst ab hier wieder normale Aktionen (Hysterese)
    CHAOS_SOFT: 50,       // ab hier Chaos aktiv senken (wenn sichere Anti-Chaos-Op da)
    CHAOS_HARD: 100,      // ab hier notfalls Diplomacy
    FACTION_RANK: 25,     // ab diesem Rang der Bladeburner-Faktion beitreten (für Ruf/Augs)
    TRAIN_FALLBACK: "Training", // wenn nichts Sicheres geht → Kampfstats hochziehen
    CITY_SWITCH_FACTOR: 1.10,   // nur wechseln, wenn beste Stadt ≥10% mehr geschätzte Synths hat
    POP_LOW: 1e8,               // geschätzte Synth-Pop, ab der "kaum Synths" gilt (an (Pop …)-Log justieren)
    INCITE_ENABLED: true,       // Incite Violence bei leeren Aufträgen & niedriger Pop? (erhöht Chaos ALLER Städte)

    // =========================================================================
    // v0.5 — GELDMODUS (Endgame)
    // =========================================================================
    // Bis hierher galt: "Geld ist bei Bladeburner Nebensache" (siehe Doktrin im
    // Kopf). Das stimmt, SOLANGE der Rang noch etwas kauft — BlackOps, Rufe,
    // Augs. Ist die vorletzte BlackOp erledigt, steht nur noch "Operation
    // Daedalus" offen, und die wird bewusst NIE automatisch gestartet: sie
    // beendet die BitNode (Daedalus-Sperre weiter unten). Ab da hat weiterer
    // Rang keinen Abnehmer mehr — und Contracts sind die einzige Bladeburner-
    // Quelle, die ueberhaupt Geld zahlt.
    //
    // ENGINE-BELEG (Bladeburner.ts:936-942): Geld gibt es NUR fuer Contracts,
    // nie fuer Operations oder BlackOps:
    //     if (!isOperation) { moneyGain = ContractBaseMoneyGain
    //                                     * rewardMultiplier
    //                                     * getSkillMult(Money); }
    // rewardMultiplier waechst mit rewardFac hoch Level. Aus data/Contracts.ts:
    //     Bounty Hunter  rewardFac 1.085   (baseDifficulty 250)
    //     Retirement     rewardFac 1.065   (baseDifficulty 200)
    //     Tracking       rewardFac 1.041   (baseDifficulty 125)
    // Bei gleichem Level zahlt Bounty Hunter also am meisten — daher die
    // Reihenfolge in GELD_CONTRACTS.
    GELD_MODUS: true,
    // Ab welcher geschaetzten Erfolgschance der finalen BlackOp der Modus
    // greift. Der Wunsch war "wenn die neue 100 % Erfolg hat"; 0.999 statt 1.0,
    // weil die Engine eine SCHAETZSPANNE liefert und exakte 1.0 an einer
    // Fliesskomma-Grenze haengen wuerde.
    GELD_BOP_MIN: 0.999,
    // Nachschub-Hysterese. Gefarmt wird, bis der Vorrat aufgebraucht ist;
    // dann wird mit Incite Violence bis GELD_VORRAT_ZIEL aufgefuellt. Zwei
    // Schwellen statt einer, sonst wechselt der Daemon im Sekundentakt
    // zwischen Farmen und Nachschub.
    GELD_VORRAT_LEER: 1,
    GELD_VORRAT_ZIEL: 50,
    // Nach dem Auffuellen ist das Chaos hoch und die Chance gefallen ->
    // Diplomatie, bis sie wieder hier steht.
    GELD_CHANCE_ZIEL: 1.00,
    // ABBRUCH FUER DIE DIPLOMATIE. Diplomacy hat genau EINEN Hebel: Chaos.
    // Ist das Chaos schon fast null und die Chance trotzdem unter dem Ziel,
    // liegt es an Stats oder Bevoelkerung — dann wuerde Diplomatie ewig
    // weiterlaufen und nichts bewirken. Contracts kosten bei Fehlschlag KEINEN
    // Rang (siehe CONTRACT_MIN), also wird dann einfach gefarmt.
    GELD_CHAOS_FLOOR: 1,
};

// v0.5: Geld-Contracts, absteigend nach Ertrag je Auftrag (rewardFac aus
// data/Contracts.ts, Begruendung bei CFG.GELD_MODUS). Die Liste ist zugleich
// die Auswahlreihenfolge im Geldmodus.
const GELD_CONTRACTS = ["Bounty Hunter", "Retirement", "Tracking"];

let daedalusAnnounced = false;   // ENDGAME-Hinweis nur einmal ins Log
// v0.5: Nachschub-Riegel des Geldmodus. true = es wird gerade aufgefuellt.
// Ueberlebt die Runden, damit aus "Vorrat leer" nicht bei jedem einzelnen
// gefarmten Auftrag sofort wieder "Vorrat voll" wird.
let nachschubLatch = false;
let geldModusAngesagt = false;   // Umschalt-Meldung nur einmal ins Log
// v0.4: aufeinanderfolgende Aufklaerungsrunden fuer eine wartende BlackOp.
// Wird bei jedem BlackOp-Start und bei jedem Rangwechsel zurueckgesetzt; der
// Deckel verhindert, dass der Daemon bei einer Schaetzung, die aus anderem
// Grund nicht zusammenfaellt, dauerhaft nur noch aufklaert.
let reconRounds = 0;
let lastBopName = null;          // wechselt die BlackOp, faengt die Aufklaerung neu an


// Skill-Prioritäten: KLEINER = wichtiger (multipliziert die Kosten beim Vergleich).
// Unbekannte Skills bekommen automatisch 1.0. Auf schnellen Aufstieg + etwas Geld getrimmt.
const SKILL_ADJ = {
    "Overclock": 0.1,        // Aktionen schneller → alles schneller. Top-Prio.
    "Digital Observer": 0.9, // Erfolgschance Operations.
    "Blade's Intuition": 0.9,// Erfolgschance allgemein.
    "Cloak": 1.1, "Tracer": 1.2, "Reaper": 1.2, "Evasive System": 1.2,
    "Hands of Midas": 2.0,   // Geld pro Contract (Wunsch: nicht abwürgen).
    "Hyperdrive": 1.3, "Datamancer": 1.3,
    "Cyber's Edge": 1.5,     // Stamina selten der Engpass.
};

// =============================================================================
// MINI-WERKZEUGE
// =============================================================================

/** Stabiler String-Hash (für Dateinamen der Wegwerf-Skripte). */
function _hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
}

/** Schlanker Zahlenformatierer (kein Import nötig). */
function fmt(n) {
    if (n == null || !isFinite(n)) return "?";
    const a = Math.abs(n);
    if (a >= 1e12) return (n / 1e12).toFixed(2) + "t";
    if (a >= 1e9) return (n / 1e9).toFixed(2) + "b";
    if (a >= 1e6) return (n / 1e6).toFixed(2) + "m";
    if (a >= 1e3) return (n / 1e3).toFixed(2) + "k";
    return String(Math.round(n));
}

/**
 * RAM-DODGE: wertet einen ns-Ausdruck in einem Wegwerf-Skript aus und gibt das
 * (JSON-geparste) Ergebnis zurück. __SCHWARM_BT__expr__SCHWARM_BT__ ist ein String wie "ns.bladeburner.getRank()".
 * Der teure Call steckt NUR im erzeugten Skript → der Daemon zahlt ihn nicht.
 * @returns {Promise<any|null>} null bei RAM-Knappheit/Fehler (Tick wird dann übersprungen).
 */
async function bb(ns, expr) {
    try {
        const id = _hash(expr);
        const out = __SCHWARM_BT____SCHWARM_DC__BB_DIR}/r___SCHWARM_DC__id}.txt__SCHWARM_BT__;
        const src = __SCHWARM_BT____SCHWARM_DC__BB_DIR}/s___SCHWARM_DC__id}.js__SCHWARM_BT__;
        const body = __SCHWARM_BT__/** @param {NS} ns */\nexport async function main(ns){ ns.write(__SCHWARM_DC__JSON.stringify(out)}, JSON.stringify(__SCHWARM_DC__expr}), "w"); }__SCHWARM_BT__;
        if (ns.read(src) !== body) ns.write(src, body, "w"); // nur schreiben, wenn neu/geändert
        const pid = ns.run(src, { temporary: true });
        if (!pid) return null; // kein RAM/Burst frei → Tick auslassen
        let guard = 0;
        while (ns.isRunning(pid) && guard++ < 1000) await ns.sleep(15);
        const raw = ns.read(out);
        return raw === "" ? null : JSON.parse(raw);
    } catch (e) { return null; }
}

// v0.6 — START NUR MIT GESICHERTEM SIMULACRUM ODER OHNE ARBEIT, IN EINEM ZUG.
// Engine (Bladeburner.ts:173-180, startAction): ohne The Blade's Simulacrum
// wird Player.finishWork(true) gerufen - die laufende Arbeit bricht ab, auch
// ein Grafting (Geld und Fortschritt weg).
// v0.5 hatte zwei Luecken: (1) war der Simulacrum-Stand UNBEKANNT (Probe ohne
// RAM -> null), wurde gestartet, ohne die Arbeit zu pruefen; (2) Arbeitsabfrage
// und Start liefen in zwei Wegwerf-Skripten, mit einem Fenster dazwischen.
// Jetzt: Simulacrum GESICHERT -> starten. Sonst Arbeitsabfrage und Start im
// SELBEN Wegwerf-Skript (ein Skript laeuft ohne Unterbrechung durch). Arbeitet
// der Spieler, wird nicht gestartet. Unbekannt heisst damit: nichts abbrechen.
// Liefert bb null (kein RAM), passiert gar nichts - der naechste Takt fragt neu.
let _simHat = null;
let _simStand = 0;
async function starteAktion(ns, typ, name) {
    const jetzt = Date.now();
    if (_simHat !== true && jetzt - _simStand > 1800000) {
        const r = await bb(ns, 'ns.singularity.getOwnedAugmentations(false).some(a => a.indexOf("Simulacrum") >= 0)');
        if (r === true || r === false) { _simHat = r; _simStand = jetzt; }
    }
    const T = JSON.stringify(typ), N = JSON.stringify(name);
    if (_simHat === true) return await bb(ns, "ns.bladeburner.startAction(" + T + ", " + N + ")");
    const r = await bb(ns, '(() => { const w = ns.singularity.getCurrentWork(); if (w) return "ARBEIT:" + w.type;'
        + ' return ns.bladeburner.startAction(' + T + ', ' + N + ') ? "OK" : "ABGELEHNT"; })()');
    if (typeof r === "string" && r.indexOf("ARBEIT:") === 0) {
        ns.print("Kein Simulacrum gesichert und der Spieler arbeitet (" + r.slice(7) + ") - keine Bladeburner-Aktion, um sie nicht abzubrechen.");
    }
    return r;
}

/** Hilfs-Ausdruck: eine Funktion über eine Liste [typ,name]-Paare sweepen → {name: ergebnis}. */
function sweepExpr(fnName, pairs) {
    return __SCHWARM_BT__(() => { const r = {}; for (const p of __SCHWARM_DC__JSON.stringify(pairs)}) { r[p[1]] = ns.bladeburner.__SCHWARM_DC__fnName}(p[0], p[1]); } return r; })()__SCHWARM_BT__;
}

// =============================================================================
// HAUPT
// =============================================================================

export async function main(ns) {
    ns.disableLog("ALL");

    // Doppelstart-Schutz (nur eine Instanz pro Host).
    try {
        const self = ns.getScriptName(), host = ns.getHostname();
        if (ns.ps(host).filter(p => p.filename === self).length > 1) return;
    } catch (e) { /* weiter */ }

    ns.print("SCHWARM-BLADEBURNER v0.6 — Start.");

    // --- Phase A ENTFERNT (v3.0) — das war die Deadlock-Ursache ---------------
    // FRÜHER: Dieser Payload wurde gestartet, sobald SF7 vorhanden war, und hing
    // dann ewig in einer Warteschleife ("Kampfstats < 100"). WORK sah den Prozess
    // laufen, hielt ihn für den Slot-Inhaber und stellte JEDE eigene Arbeit ein —
    // also auch das Stat-Training, auf das dieser Payload wartete. Deadlock.
    //
    // JETZT: WORK trainiert erst auf 100/100/100/100, ruft joinBladeburnerDivision()
    // SELBST auf und meldet erst DANACH WANT:BLADEBURNER an die Queen. Wenn dieser
    // Payload startet, ist die Division garantiert schon beigetreten.
    //
    // Sicherheitsnetz: Sollte er wider Erwarten doch ohne Division starten
    // (Handstart, Prestige-Rennen), beendet er sich sofort — statt zu blockieren.
    // v0.5: WARTEN STATT BEENDEN. Die QUEEN startet mich ohne Anforderung
    // von WORK - ich kann also vor dem Beitritt kommen. Ein return hier
    // hiesse: jeden Takt ein neuer Start, jeden Takt eine Warnung.
    let wartenGemeldet = false;
    while (!safeInBladeburner(ns)) {
        const joined = await bb(ns, "ns.bladeburner.joinBladeburnerDivision()");
        if (joined === true) {
            ns.print("OK: Bladeburner-Division beigetreten (Sicherheitsnetz).");
            break;
        }
        if (!wartenGemeldet) {
            ns.tprint("INFO  [BLADEBURNER] Noch nicht in der Division (Kampfstats unter 100?). Warte - WORK trainiert und tritt bei.");
            wartenGemeldet = true;
        }
        await ns.sleep(60000);
    }

    // --- Phase B: Statische Daten EINMAL holen (Namenslisten) ---
    const skillNames = (await bb(ns, "ns.bladeburner.getSkillNames()")) || [];
    const generalNames = (await bb(ns, "ns.bladeburner.getGeneralActionNames()")) || [];
    // Reversed = höchster Ruf zuerst (so picken wir die beste sichere Aktion zuerst).
    const contractNames = ((await bb(ns, "ns.bladeburner.getContractNames()")) || []).slice().reverse();
    const operationNames = ((await bb(ns, "ns.bladeburner.getOperationNames()")) || []).slice().reverse();
    ns.print(__SCHWARM_BT__INFO: __SCHWARM_DC__contractNames.length} Contracts, __SCHWARM_DC__operationNames.length} Operations, __SCHWARM_BT__ +
        __SCHWARM_BT____SCHWARM_DC__skillNames.length} Skills geladen. Hauptloop läuft.__SCHWARM_BT__);

    let lowStaminaActive = false;
    let joinedFaction = false;

    // --- Phase C: Hauptloop ---
    while (true) {
        try {
            // 1) Zustands-Batch (rank, sp, stamina, city, current action)
            const info = await bb(ns, "(() => ({ rank: ns.bladeburner.getRank(), sp: ns.bladeburner.getSkillPoints(), " +
                "stamina: ns.bladeburner.getStamina(), city: ns.bladeburner.getCity(), cur: ns.bladeburner.getCurrentAction() }))()");
            if (!info) { await ns.sleep(CFG.LOOP_MS); continue; } // RAM-Knappheit → später

            const rank = info.rank || 0;
            const sp = info.sp || 0;
            const stamina = Array.isArray(info.stamina) ? info.stamina : [1, 1];
            let city = info.city || CITIES[0];   // let: kann durch Stadtwechsel unten geändert werden
            const cur = info.cur; // {type, name} oder null
            const staminaPct = stamina[1] > 0 ? stamina[0] / stamina[1] : 1;

            // 1b) STADTWECHSEL: geschätzte Synth-Population aller Städte holen und in
            //     die reichste wechseln (Hysterese, damit er nicht ständig hin- und herspringt).
            //     switchCity ist kostenlos (setzt nur die aktive Stadt) — kein Chaos, keine Zeit.
            const popExpr = __SCHWARM_BT__(() => { const r = {}; for (const c of __SCHWARM_DC__JSON.stringify(CITIES)}) __SCHWARM_BT__ +
                __SCHWARM_BT__{ r[c] = ns.bladeburner.getCityEstimatedPopulation(c); } return r; })()__SCHWARM_BT__;
            const pops = (await bb(ns, popExpr)) || {};
            let bestCity = city, bestPop = pops[city] || 0;
            for (const c of CITIES) {
                const p = pops[c] || 0;
                if (p > bestPop) { bestPop = p; bestCity = c; }
            }
            const curPopBefore = pops[city] || 0;
            let switched = false;
            if (bestCity !== city && bestPop > curPopBefore * CFG.CITY_SWITCH_FACTOR) {
                const ok = await bb(ns, __SCHWARM_BT__ns.bladeburner.switchCity(__SCHWARM_DC__JSON.stringify(bestCity)})__SCHWARM_BT__);
                if (ok === true) {
                    ns.print(__SCHWARM_BT__STADT: Wechsel __SCHWARM_DC__city} (Pop __SCHWARM_DC__fmt(curPopBefore)}) → __SCHWARM_DC__bestCity} (Pop __SCHWARM_DC__fmt(bestPop)}).__SCHWARM_BT__);
                    city = bestCity;
                    switched = true;
                }
            }
            const curPop = pops[city] || 0; // geschätzte Population der (jetzt evtl. neuen) Stadt

            // 2) Chaos der aktuellen Stadt
            const chaosMap = (await bb(ns, __SCHWARM_BT__(() => ({ c: ns.bladeburner.getCityChaos(__SCHWARM_DC__JSON.stringify(city)}) }))()__SCHWARM_BT__)) || { c: 0 };
            const chaos = chaosMap.c || 0;

            // 3) Nächste BlackOp — getNextBlackOp() liefert in diesem Build bereits {name, rank} (oder null).
            const bop = await bb(ns, "ns.bladeburner.getNextBlackOp()");
            // Neue BlackOp in der Reihe? Dann faengt die Aufklaerung von vorn an —
            // sonst wuerde ein einmal erreichter Deckel alle spaeteren blockieren.
            const bopName = (bop && bop.name) || null;
            if (bopName !== lastBopName) { lastBopName = bopName; reconRounds = 0; }

            // 4) Erfolgschancen + Restzahlen (je 1 Funktion = 1 Wegwerf-Skript)
            const cPairs = contractNames.map(n => ["Contracts", n]);
            const oPairs = operationNames.map(n => ["Operations", n]);
            const chancePairs = cPairs.concat(oPairs);
            // DAEDALUS-SPERRE (Doktrin-Entscheid): "Operation Daedalus" beendet
            // die BitNode — der SPIELER triggert sie SELBST im Bladeburner-UI.
            // Der Daemon führt sie NIE automatisch aus; das Dashboard zeigt die
            // Bereitschaft als ENDGAME-Hinweis (INFO blade.nextBlackOp).
            // v0.7 — DIE SPERRE BLEIBT, BEKOMMT ABER EINE BENANNTE AUSNAHME.
            // Die QUEEN spiegelt die Freigabe aus schwarm-plan.txt auf Port
            // PLAN_OUT; planFreigabe() prueft dort zusaetzlich, ob sie fuer die
            // LAUFENDE BitNode gilt. Ohne Freigabe aendert sich nichts: Daedalus
            // kommt nicht in chancePairs, also kann weder der Start- noch der
            // Aufklaerungszweig sie anfassen.
            //
            // Die Doktrin bleibt damit unveraendert — ein Daemon beendet nie von
            // sich aus einen Durchlauf. Er tut es nur, wenn oben jemand fuer
            // GENAU DIESE Node GENAU DIESEN Weg freigegeben hat.
            // Gelesen wird der Port direkt: dieser Payload ist bewusst ohne
            // HELPERS-Import gebaut, ein Import zoege dessen ganzen RAM-Preis
            // mit. SCHWARM_PORTS kommt ueber die Ports-Marke herein,
            // die injectPorts() beim Materialisieren ersetzt — so gibt es hier
            // keine eigene Portnummer, die veralten koennte.
            // Die FRIST ist die Sicherung: schreibt die QUEEN nicht mehr (tot,
            // abgestuerzt), verfaellt die Freigabe von selbst in 30 s.
            let daedalusFrei = false;
            try {
                const p = ns.peek(SCHWARM_PORTS.PLAN_OUT);
                if (typeof p === "string" && p.length && p !== "NULL PORT DATA") {
                    const o = JSON.parse(p);
                    daedalusFrei = o && String(o.weg).toLowerCase() === "daedalus"
                        && (Date.now() - Number(o.ts || 0) < 30000);
                }
            } catch (e) { daedalusFrei = false; }
            if (bop && bop.name === "Operation Daedalus" && !daedalusFrei) {
                if (rank >= (bop.rank || Infinity) && !daedalusAnnounced) {
                    daedalusAnnounced = true;
                    ns.print("ENDGAME: Operation Daedalus BEREIT (Rang " + Math.floor(rank) +
                        ") — manueller Trigger durch den Spieler, Daemon fasst sie nicht an.");
                }
            } else if (bop && rank >= (bop.rank || Infinity)) {
                if (bop.name === "Operation Daedalus") {
                    ns.print("ENDGAME: Operation Daedalus ist per Plan FREIGEGEBEN — der Daemon"
                        + " nimmt sie ab jetzt in die Auswahl. Das beendet die BitNode.");
                }
                chancePairs.push(["Black Operations", bop.name]);
            }

            // ================================================================
            // v0.5: CHANCE DER FINALEN BLACKOP — SEPARAT GEMESSEN
            // ================================================================
            // Der Geldmodus soll erst greifen, wenn Daedalus auf 100 % steht.
            // Diese Zahl darf aber NICHT ueber chancePairs kommen: chancePairs
            // speist minC(), und minC() ist genau das Tor, durch das die
            // BlackOp-Auswahl geht ("bop && rank >= ... && minC(bop.name) >=
            // SUCCESS_MIN"). Stuende Daedalus dort drin, wuerde der Daemon sie
            // im selben Takt STARTEN — und damit die BitNode beenden, die der
            // Spieler ausdruecklich behalten will.
            // Gemessen wird also getrennt, gelesen wird nur hier. Die Sperre
            // oben bleibt unberuehrt.
            let daedalusChance = 0;
            if (bop && bop.name === "Operation Daedalus" && rank >= (bop.rank || Infinity)) {
                const dc = await bb(ns, "(() => { try { const c = ns.bladeburner.getActionEstimatedSuccessChance('Black Operations', 'Operation Daedalus'); return { min: c[0], max: c[1] }; } catch (e) { return { min: 0, max: 0 }; } })()");
                // ============================================================
                // v0.6 BUGFIX — DIE UNTERE ZAHL IST BEI BLACKOPS BEDEUTUNGSLOS
                // ============================================================
                // v0.5 las c[0]. Damit haette der Geldmodus NIE angesprochen:
                // im Livebericht stand vier Zyklen lang
                //     "Erfolgschance 61.5 % ~ 100.0 %"
                // waehrend die echte Chance 100 % war. Die Spanne kommt allein
                // aus der Bevoelkerungsschaetzung der Stadt (dort um Faktor 1.63
                // daneben) — und die wirkt auf BlackOps GAR NICHT:
                //     Actions/BlackOperation.ts
                //       getPopulationSuccessFactor() { return 1; }
                //       getChaosSuccessFactor()      { return 1; }
                // Beide Faktoren sind fest 1. Fuer eine BlackOp ist die OBERE
                // Grenze also die wahre Chance, die untere reines Schaetzrauschen.
                // Genau dieselbe Einsicht steht schon im v0.4-Block der
                // Aufklaerungs-Entscheidung weiter unten — sie gilt hier ebenso.
                daedalusChance = (dc && typeof dc.max === "number") ? dc.max : 0;
            }

            const chances = (await bb(ns, sweepExpr("getActionEstimatedSuccessChance", chancePairs))) || {};
            const counts = (await bb(ns, sweepExpr("getActionCountRemaining", cPairs.concat(oPairs)))) || {};

            const minC = name => (chances[name] && chances[name][0] != null) ? chances[name][0] : 0;
            const maxC = name => (chances[name] && chances[name][1] != null) ? chances[name][1] : 0;
            const cnt = name => (counts[name] != null ? counts[name] : 0);

            // 5) Stamina-Hysterese
            lowStaminaActive = staminaPct < CFG.LOW_STAMINA || (lowStaminaActive && staminaPct < CFG.HIGH_STAMINA);

            // v0.5: Ist der Rang am Ziel? Nur noch Daedalus offen, und die
            // waere sicher — dann kauft weiterer Rang nichts mehr, und der
            // Daemon stellt auf Geld um.
            const geldModus = CFG.GELD_MODUS === true
                && bop && bop.name === "Operation Daedalus"
                && rank >= (bop.rank || Infinity)
                && daedalusChance >= CFG.GELD_BOP_MIN;
            if (geldModus && !geldModusAngesagt) {
                geldModusAngesagt = true;
                ns.print("GELDMODUS: alle BlackOps ausser Daedalus erledigt, Daedalus bei "
                    + Math.round(daedalusChance * 100) + " % — ab jetzt zaehlt Geld, nicht Rang. "
                    + "Daedalus bleibt gesperrt (beendet die BitNode).");
            }

            // 6) Beste Aktion bestimmen
            let bestType = "General", bestName = CFG.TRAIN_FALLBACK, reason = "Fallback";

            if (lowStaminaActive) {
                // Stamina-frei: bei hohem Chaos gleich senken, sonst Schätzungen verbessern.
                bestType = "General";
                bestName = chaos > CFG.CHAOS_SOFT ? "Diplomacy" : "Field Analysis";
                reason = __SCHWARM_BT__Stamina niedrig (__SCHWARM_DC__(staminaPct * 100).toFixed(0)}%)__SCHWARM_BT__;
            } else if (chaos > CFG.CHAOS_HARD) {
                bestType = "General"; bestName = "Diplomacy";
                reason = __SCHWARM_BT__Chaos sehr hoch (__SCHWARM_DC__chaos.toFixed(0)})__SCHWARM_BT__;
            } else if (chaos > CFG.CHAOS_SOFT && cnt(ANTI_CHAOS_OP) >= 1 && minC(ANTI_CHAOS_OP) > 0.9) {
                bestType = "Operations"; bestName = ANTI_CHAOS_OP;
                reason = __SCHWARM_BT__Chaos senken (__SCHWARM_DC__chaos.toFixed(0)})__SCHWARM_BT__;
            } else if (bop && rank >= (bop.rank || Infinity) && minC(bop.name) >= CFG.SUCCESS_MIN) {
                bestType = "Black Operations"; bestName = bop.name;
                reason = "BlackOp bereit";
                reconRounds = 0;
            } else if (bop && rank >= (bop.rank || Infinity)
                       && maxC(bop.name) >= CFG.SUCCESS_MIN
                       && (maxC(bop.name) - minC(bop.name)) > CFG.EST_SPREAD_MAX
                       && reconRounds < CFG.RECON_MAX_ROUNDS) {
                // ============================================================
                // v0.4 BUGFIX — BLACKOPS WURDEN NIE AUSGEFUEHRT
                // ============================================================
                // Livebeleg ueber acht Messzyklen: Rang stieg von 30.000 auf
                // 76.000, die Diagnose meldete jedesmal "startbar, Chance
                // 92,3 % ~ 100,0 %" — und keine einzige BlackOp lief. Der Grund
                // stand eine Zeile hoeher: geprueft wurde minC, also die
                // UNTERGRENZE der Schaetzung, gegen 0,95.
                //
                // Diese Untergrenze ist bei BlackOps aber KEINE Aussage ueber
                // das Risiko. Warum, steht in der Engine:
                //
                //   Actions/BlackOperation.ts
                //     getPopulationSuccessFactor() { return 1; }
                //     getChaosSuccessFactor()      { return 1; }
                //
                // Bevoelkerung und Chaos gehen bei einer BlackOp also GAR NICHT
                // in die Erfolgswahrscheinlichkeit ein. In Action.getSuccessRange
                // heisst das: der geschaetzte und der echte Wert sind identisch,
                // diff = 0, und die Spanne waere ein Punkt. Breit wird sie erst
                // durch die Zeile danach:
                //
                //   let r = city.pop / city.popEst;
                //   if (r < 1) low *= r; else high *= r;
                //
                // Es wird also GENAU EIN Ende verschoben, und zwar allein wegen
                // des Schaetzfehlers bei der Stadtbevoelkerung — einer Groesse,
                // die auf den tatsaechlichen Wuerfelwurf keinerlei Einfluss hat.
                // Bei "92,3 % ~ 100,0 %" war die wahre Chance 100 %, und die
                // 92,3 % waren nichts als ein um 8 % danebenliegender
                // Bevoelkerungsschaetzwert.
                //
                // Die Loesung ist nicht, die Schwelle zu senken (dann wuerde bei
                // r > 1 zu optimistisch gehandelt), sondern das fehlende Wissen
                // zu beschaffen: Field Analysis ruft
                // improvePopulationEstimateByPercentage auf, das popEst monoton
                // an pop heranfuehrt und dort klemmt (City.ts). Damit geht r
                // gegen 1 und die Spanne faellt zusammen — DANACH ist minC
                // wieder eine ehrliche Zahl und der strenge 0,95-Test oben
                // greift korrekt. Die Aufklaerung kostet keine Ausdauer und
                // bringt selbst Rang.
                bestType = "General"; bestName = "Field Analysis";
                reconRounds++;
                reason = __SCHWARM_BT__BlackOp-Schaetzung unscharf (__SCHWARM_DC__(minC(bop.name) * 100).toFixed(1)}% ~ __SCHWARM_BT__
                    + __SCHWARM_BT____SCHWARM_DC__(maxC(bop.name) * 100).toFixed(1)}%) — Aufklaerung Runde __SCHWARM_DC__reconRounds}__SCHWARM_BT__;
            } else if (geldModus) {
                // ============================================================
                // v0.5 — GELDMODUS: DREI PHASEN, EIN KREISLAUF
                // ============================================================
                //   FARMEN     bestbezahlten Contract fahren, bis der Vorrat leer ist
                //   NACHSCHUB  Incite Violence, bis wieder GELD_VORRAT_ZIEL da sind
                //   REPARATUR  Incite hat das Chaos hochgetrieben und die Chance
                //              gesenkt -> Diplomatie, bis die Chance wieder steht
                // Danach von vorn. Warum diese Reihenfolge und keine andere:
                // Incite Violence erzeugt Auftraege, hebt aber das Chaos in ALLEN
                // Staedten; hohes Chaos senkt die Erfolgschancen. Erst auffuellen,
                // dann aufraeumen, dann ernten — wer waehrend des Auffuellens
                // farmt, farmt mit fallender Chance.
                //
                // Der Riegel nachschubLatch haelt die Phase fest. Ohne ihn waere
                // nach dem ersten nachgelegten Auftrag der Vorrat wieder ">= 1"
                // und der Daemon wuerde zwischen Farmen und Nachschub flattern.
                const vorrat = GELD_CONTRACTS.reduce((a, n) => a + cnt(n), 0);
                if (vorrat <= CFG.GELD_VORRAT_LEER) nachschubLatch = true;
                else if (vorrat >= CFG.GELD_VORRAT_ZIEL) nachschubLatch = false;

                // Reihenfolge = Ertrag je Auftrag (GELD_CONTRACTS). Genommen wird
                // der erstbeste, der ueberhaupt vorraetig und machbar ist.
                const bester = GELD_CONTRACTS.find(n => cnt(n) >= 1 && minC(n) >= CFG.CONTRACT_MIN) || null;
                const besteChance = bester ? minC(bester) : 0;

                if (nachschubLatch) {
                    bestType = "General"; bestName = "Incite Violence";
                    reason = "Geldmodus: Nachschub " + vorrat + "/" + CFG.GELD_VORRAT_ZIEL;
                } else if (besteChance < CFG.GELD_CHANCE_ZIEL && chaos > CFG.GELD_CHAOS_FLOOR) {
                    bestType = "General"; bestName = "Diplomacy";
                    reason = "Geldmodus: Chance " + Math.round(besteChance * 100) + " %, Chaos "
                        + chaos.toFixed(0) + " -> Diplomatie";
                } else if (bester) {
                    bestType = "Contracts"; bestName = bester;
                    reason = "Geldmodus: " + bester + " (" + vorrat + " im Vorrat, "
                        + Math.round(besteChance * 100) + " %)";
                } else {
                    // Vorrat da, aber keiner ueber CONTRACT_MIN: Schaetzung schaerfen.
                    // Stamina-frei und ohne Chaos-Kosten — anders als Incite.
                    bestType = "General"; bestName = "Field Analysis";
                    reason = "Geldmodus: kein Auftrag ueber " + Math.round(CFG.CONTRACT_MIN * 100)
                        + " % -> Schaetzung schaerfen";
                }
            } else {
                // Operations (hoher Ruf) — nur sicher, da Fehlschlag Rang kostet.
                let pick = operationNames.find(n => cnt(n) >= 1 && minC(n) >= CFG.SUCCESS_MIN);
                if (pick) { bestType = "Operations"; bestName = pick; reason = "beste sichere Operation"; }
                else {
                    // Contracts — dürfen aggressiver laufen (kein Rang-Verlust bei Fehlschlag).
                    pick = contractNames.find(n => cnt(n) >= 1 && minC(n) >= CFG.CONTRACT_MIN);
                    if (pick) { bestType = "Contracts"; bestName = pick; reason = "bester Contract"; }
                    else {
                        // Nichts Sicheres. Statt stumpf zu trainieren: erkunden/erzeugen.
                        const hasAnyCount = operationNames.some(n => cnt(n) >= 1) || contractNames.some(n => cnt(n) >= 1);
                        const popLow = curPop < CFG.POP_LOW;

                        if (!hasAnyCount && popLow && CFG.INCITE_ENABLED) {
                            // Aufträge leer UND kaum Synths → neue Aufträge erzwingen.
                            // Preis: Chaos in ALLEN Städten steigt (senkt künftige Chancen).
                            bestType = "General"; bestName = "Incite Violence";
                            reason = "Aufträge leer & Pop niedrig → Incite Violence";
                        } else if (popLow) {
                            // Schätzung schärfen: verengt die Chance-Spanne → hebt die untere
                            // Grenze; bringt Ops/Contracts oft wieder über die Schwelle. Stamina-frei.
                            bestType = "General"; bestName = "Field Analysis";
                            reason = "Pop niedrig → Schätzung schärfen";
                        } else {
                            // Pop ist da, Chance dennoch zu gering → Kampfstats sind der Engpass.
                            bestType = "General"; bestName = CFG.TRAIN_FALLBACK;
                            reason = "Pop ok, Chance niedrig → trainieren";
                        }
                    }
                }
            }

            // 7) Aktion starten, falls sie sich geändert hat.
            //    Nach einem Stadtwechsel IMMER neu starten, da die Aktion an die Stadt gebunden ist.
            const sameAction = cur && cur.name === bestName;
            if (!sameAction || switched) {
                await starteAktion(ns, bestType, bestName);   // v0.6: Schutz fuer laufende Arbeit steckt darin
            }

            // 8) Skill kaufen (einer pro Tick, günstigster nach Prio, den wir uns leisten)
            if (sp > 0 && skillNames.length) {
                const costPairs = skillNames.map(n => ["", n]); // typ ignoriert, nur Name zählt
                const costExpr = __SCHWARM_BT__(() => { const r = {}; for (const p of __SCHWARM_DC__JSON.stringify(costPairs)}) __SCHWARM_BT__ +
                    __SCHWARM_BT__{ r[p[1]] = ns.bladeburner.getSkillUpgradeCost(p[1], 1); } return r; })()__SCHWARM_BT__;
                const costs = (await bb(ns, costExpr)) || {};
                let buy = null, buyScore = Infinity;
                for (const sn of skillNames) {
                    const c = costs[sn];
                    if (c == null || !isFinite(c) || c <= 0 || c > sp) continue; // gesperrt/zu teuer/maxed
                    const score = c * (SKILL_ADJ[sn] || 1.0);
                    if (score < buyScore) { buyScore = score; buy = sn; }
                }
                if (buy) await bb(ns, __SCHWARM_BT__ns.bladeburner.upgradeSkill(__SCHWARM_DC__JSON.stringify(buy)}, 1)__SCHWARM_BT__);
            }

            // 9) Faktion beitreten (für Ruf/Augs), sobald Rang reicht
            if (!joinedFaction && rank >= CFG.FACTION_RANK) {
                const ok = await bb(ns, "ns.bladeburner.joinBladeburnerFaction()");
                if (ok === true) { joinedFaction = true; ns.print("OK: Bladeburner-Faktion beigetreten (Ruf läuft jetzt)."); }
            }

            // 10) Statuszeile
            ns.print(__SCHWARM_BT__Rang __SCHWARM_DC__fmt(rank)} | SP __SCHWARM_DC__fmt(sp)} | Stam __SCHWARM_DC__(staminaPct * 100).toFixed(0)}% | __SCHWARM_BT__ +
                __SCHWARM_BT____SCHWARM_DC__city} (Pop __SCHWARM_DC__fmt(curPop)})__SCHWARM_DC__switched ? " ↷" : ""} Chaos __SCHWARM_DC__chaos.toFixed(0)} | → __SCHWARM_DC__bestName} (__SCHWARM_DC__reason})__SCHWARM_BT__);

        } catch (e) {
            ns.print(__SCHWARM_BT__WARN: Tick-Ausnahme abgefangen: __SCHWARM_DC__e}__SCHWARM_BT__);
        }
        await ns.sleep(CFG.LOOP_MS);
    }
}

/** inBladeburner() ist gratis (0 GB) und ohne SF aufrufbar → direkt nutzen. */
function safeInBladeburner(ns) {
    try { return !!ns.bladeburner.inBladeburner(); } catch (e) { return false; }
}`;
const SRC_GANG = `/**
 * SCHWARM-GANG.js — v0.8 (zwei BANK-Antraege: Augs vor Spende vor Ausruestung)
 *
 * v0.8 — ZWEI ANTRAEGE STATT EINEM (BANK v5.17). Gang-Augs mit prio 300,
 *   uebrige Ausruestung mit prio 100; dazwischen spendet WORK (200). Augs
 *   bleiben beim Aufstieg, Ausruestung faellt weg - deshalb diese Folge (mit
 *   dem Spieler abgestimmt). Eine Freigabe kauft nur aus ihrer Liste, beide
 *   werden im selben Takt verbraucht, jeder Verbrauch steht mit exaktem
 *   Betrag im Handlungsbuch (Topf gang_expenses - den bucht in der Engine
 *   NUR purchaseEquipment, also exakt pruefbar).
 *
 * v0.7 — (Kopf nachgetragen) Aufgabenverteilung im Lagebild, Korrektur
 *   am Warfare-Zaehler, Stillstand-Bugfix - Einzelheiten an den Stellen.
 *
 * v0.6 — EIGENSTAENDIG. Die QUEEN startet mich seit HELPERS v5.13 selbst,
 *   auch bevor WORK die Gang gegruendet hat. Ohne Gang wirft jeder
 *   ns.gang-Aufruf - die Hauptschleife haette endlos Fehler gedreht. Jetzt
 *   warte ich (je 60 s eine Probe), bis es eine Gang gibt.
 *
 * v0.5 — Messlatte des Optimierers
 * SCHWARM-nativer Gang-Manager — ERSATZ für das Fremdskript gangs.js.
 *
 * Änderung ggü. v0.4 (Optimierer nahm NIE einen Plan an):
 *   Zwei Fehler an EINER Zeile, der Messlatte bestTotalGain.
 *   1. MASSSTAB: Im Modus "both money and respect" bewertet die Schleife
 *      jeden Plan mit money/1000 + respect, die Latte nahm aber rohes
 *      moneyGainRate. Bei $50k/s gegen einen Mischwert um 100 war
 *      "100 > 50000" nie wahr — in diesem Modus wurde nie ein Plan
 *      angenommen, egal wie gut er war.
 *   2. DIE NULL: Verdient die Gang nichts, ist die Latte 0, und ein Plan
 *      mit ebenfalls 0 scheitert an "0 > 0". Genau dieser Plan haette aber
 *      den Trainings-Rückfall enthalten, der aus der Lage herausführt.
 *      Die Mitglieder blieben auf Aufgaben sitzen, für die sie zu schwach
 *      sind (formulas.ts:24-25 gibt bei statWeight - 4*difficulty <= 0 hart
 *      0 zurück) und trainierten nie — eine Falle, die sich selbst zuhält.
 *   LIVE: 55 von 431 Berichten mit "GANG: Respekt-Rate 0", im Log dazu
 *   "INFO: Kein besserer Plan".
 *
 * SCHWARM-nativer Gang-Manager — ERSATZ für das Fremdskript gangs.js.
 *
 * Änderung ggü. v0.3 (BANK-v1.0-Zulieferung):
 *   tryUpgrade() kauft nicht mehr direkt am Treasury-RESERVE vorbei, sondern
 *   über die zentrale BANK-Warteliste (Antrag GANGS/equip-<seq> auf Port 12,
 *   Freigabe Port 13, Abmeldung per cost=0 -> BANK bucht den Spartopf aus).
 *   AUG_BUDGET_PCT/EQUIP_BUDGET_PCT entfallen; Priorisierung gegen AUGS/CORP
 *   übernimmt die BANK zentral (CONSUMER_PRIO). Details am tryUpgrade-Kopf.
 *
 * Änderung ggü. v0.2 (Territory-Warfare, am Quellcode 3.0.1 verifiziert):
 *   Mechanik-Erkenntnisse aus src/Gang: der Power-Zuwachs pro Territory-Tick ist
 *   ein SNAPSHOT (AllGangs[gang].power += Summe calculatePower() der Mitglieder,
 *   die IM TICK-MOMENT "Territory Warfare" machen) — die Zeit davor auf Warfare
 *   zählt NICHT. Territory tickt alle CyclesPerTerritoryAndPowerUpdate = 100
 *   Cycles; process() verarbeitet 10..25 Cycles/Durchlauf; nextUpdate() liefert
 *   die verarbeiteten Cycles exakt zurück. Nur Mitglieder auf "Territory Warfare"
 *   können bei Clashes sterben (Chance ~ baseDeathChance / def^0.6).
 *
 *   Daraus folgt der (mechanisch optimale) TIMING-ANSATZ statt Dauer-Warfare:
 *     - Loop ist nextUpdate()-getaktet (synchron zum Gang-Processing).
 *     - Territory-Ticks werden über getAllGangInformation() erkannt (die NPC-
 *       Gangs ändern sich in JEDEM Tick — robust, unabhängig von eigener Power).
 *       Ein mitgezählter Cycle-Stand (aus nextUpdate) sagt, wann der nächste Tick
 *       fällig ist; die Beobachtung resynchronisiert ihn.
 *     - Erst wenn <= WARFARE_LEAD_CYCLES (= maxCyclesToProcess) bis zum Tick,
 *       werden die wehrhaften Mitglieder auf "Territory Warfare" gesetzt — damit
 *       garantiert VOR dem Tick, aber nur kurz (Rep/Geld läuft die übrige Zeit).
 *     - Clash-TEILNAHME (setTerritoryWarfare) nur bei Ø-Win-Chance >=
 *       WARFARE_WINCHANCE_THRESHOLD; sonst nur Power aufbauen (Clash aus).
 *     - Nur Mitglieder mit ausreichender Defense gehen ins Fenster (Todesschutz);
 *       schwache bleiben auf ihren Rep/Geld-Aufgaben.
 *     - Bei 100 % Territorium: Warfare aus, alle dauerhaft auf Rep/Geld.
 *
 * Änderung ggü. v0.1 (Ausrüstungs-/Augmentierungs-Logik überarbeitet):
 *   - ÷100-Frühdrossel ENTFERNT (kam aus gangs.js: "kein 4S / BN8 -> Budget/100").
 *     Sie bremste genau das Frühspiel aus, in dem die Upgrades den größten
 *     Progress-Hebel bilden. Einzige Bremse ist jetzt die RESERVE (Treasury Port 5).
 *   - Käufe in ZWEI Phasen mit klarer Priorität, abgeleitet aus der Ascension-
 *     Mechanik (getMemberInformation trennt __SCHWARM_BT__augmentations__SCHWARM_BT__ = permanent von
 *     __SCHWARM_BT__upgrades__SCHWARM_BT__ = transient; nur transiente Ausrüstung geht beim Ascend verloren):
 *       Phase 1 — Augmentierungen (permanent): aggressiv für ALLE Mitglieder,
 *                 auch frisch rekrutierte/trainierende. Dauerhafter Stat-Boost,
 *                 überlebt jede Ascension -> bester Progress-Hebel.
 *       Phase 2 — transiente Ausrüstung: NUR für stabile Mitglieder (seit
 *                 MIN_TRAINING_MS nicht ascended/rekrutiert). Frühe, häufig
 *                 ascendende Mitglieder würden sie sofort wieder verlieren
 *                 (Geldverschwendung). Das Kriterium selbst-reguliert.
 *   - EQUIP_BUDGET_PCT 0.002 -> 0.02 (transiente Käufe für stabile Mitglieder
 *     finden damit real statt; 0.002 war praktisch wirkungslos).
 *
 * Zweck: Gang automatisch gründen (Prioritätsliste, Policy A — vollautomatisch),
 * Mitglieder rekrutieren, Aufgaben so verteilen, dass Ruf/Geld maximiert werden
 * (ohne dass die Wanted-Rate entgleist), Mitglieder ascenden und Ausrüstung
 * kaufen (budget-/RESERVE-bewusst über die Treasury).
 *
 * Doktrin / Architektur-Entscheidungen (am Quellcode 3.0.1 verifiziert):
 *   - HOT-PATH → DIREKTE ns.gang.*-Calls (KEIN evalNs). Begründung: die Gang-API
 *     ist moderat teuer (GangApiBase = 4 GB; die meisten Calls 1-2 GB). Alles
 *     zusammen ~34 GB statisch — sauberer und in Summe RAM-günstiger als der
 *     Temp-Skript-Ansatz von gangs.js (16 minRam + 40 Burst = 56 GB). evalNs wird
 *     NUR für die seltenen, optionalen Singularity-Calls genutzt (requiredRep /
 *     factionRep), die keinen Hot-Path bilden.
 *   - SCHWARM-native: SCHWARM-HELPERS (Format, readTreasury, evalNs, hasCapability).
 *     KEIN helpers.js, KEIN gangs.js.
 *   - Budget: RESERVE aus der Treasury (Port 5) statt reserve.txt. Zusätzlich
 *     eigene %-pro-Tick-Deckel (transient vs. permanent), wie gangs.js.
 *   - Kern-Manager braucht KEIN Singularity (SF4). requiredRep/factionRep nutzen
 *     Singularity nur, WENN vorhanden (Capability SING), sonst Schätzung.
 *   - Jede Stelle try…catch-isoliert; der Loop crasht nie.
 *
 * NICHT in v0.1 (kommt in v0.2): Territory-Warfare mit ns.gang.nextUpdate()-
 *   Timing (Power-Aufbau ohne dauerhaften Ruf/Geld-Verlust). v0.1 schaltet
 *   Warfare beim Start bewusst AUS (schützt schwache Mitglieder vor Clash-Toden,
 *   solange kein Power-Management existiert).
 *
 * Vereinfacht ggü. gangs.js (bewusst, v0.1-robust): kein waitForGameUpdate
 *   (Optimierung rein über die Formeln; der nächste Loop sieht die echten Raten),
 *   kein separater fixWantedGainRate-Fail-Safe (der Greedy-Algorithmus hält die
 *   Wanted-Toleranz bereits selbst ein).
 *
 * Formeln & Greedy-Algorithmus: übernommen aus gangs.js (alainbryden), die sie
 *   ihrerseits aus dem Bitburner-Quellcode (Gang/GangMember.ts) stammen.
 *
 * Test:  run SCHWARM-GANG.js   (Tail beobachten)
 *
 * @param {NS} ns
 */
import { formatNumber, formatMoney, evalNs, hasCapability, requestFunds, readFundGrant, publishGangInfo, readBankInfo, chronik, requestFundsZurueck } from "SCHWARM-HELPERS.js";

// =============================================================================
// KONFIGURATION
// =============================================================================

const CFG = {
    LOOP_MS: 2000,               // Fallback-Takt, falls nextUpdate() nicht verfügbar
    OPT_INTERVAL_MS: 10_000,     // Task-Optimierung (teurer) seltener als der Haupt-Takt
    FOCUS: "auto",               // "auto" | "respect" | "money" — Optimierungsziel

    // --- Territory-Warfare (v0.3) ---
    TERRITORY_WARFARE: true,        // Warfare-Automatik an/aus
    TERRITORY_DONE: 0.9999,         // ab hier gilt Territorium als 100 % (API-Rundung)
    WARFARE_WINCHANCE_THRESHOLD: 0.90, // Clash-Teilnahme erst ab dieser Ø-Win-Chance
    WARFARE_LEAD_CYCLES: 25,        // so viele Cycles vor dem Tick auf Warfare schalten
                                    // (= maxCyclesToProcess; garantiert VOR dem Tick)
    WARFARE_MIN_DEF: 100,           // Mindest-Defense fürs Warfare-Fenster (Todesschutz)
    WARFARE_DEF_FRAC: 0.1,          // zusätzlich: mind. dieser Anteil der höchsten Defense

    TRAINING_PCT: 0.05,          // Anteil Zyklen mit Zufalls-Training statt Arbeit
    ASCEND_THRESHOLD: 1.05,      // Ascend, wenn ein Hauptstat-Multi um mehr als das steigt
    ASCEND_SPACING: 0.05,        // pro Mitglied-Index gestaffelt (frühe Mitglieder stabiler)
    MIN_TRAINING_MS: 200_000,    // nach Ascend/Recruit so lange (min.) trainieren

    // ENTFERNT (v3.1): EQUIP_BUDGET_PCT/AUG_BUDGET_PCT — Einkauf läuft über die
    // BANK-Warteliste (siehe tryUpgrade); lokale Budget-Prozente sind obsolet.
    OFF_STAT_PENALTY: 50,        // "Kosten"-Aufschlag für Ausrüstung ohne Hauptstat-Nutzen
    WANTED_PENALTY_THRESHOLD: 0.0001,

    REQ_REP_REFRESH_MS: 300_000, // requiredRep neu bestimmen (ändert sich langsam)
    DEFAULT_REQ_REP: 2.5e6,      // Annahme ohne SF4
};

// Gang-Gründung: Prioritätsliste (Combat-Gangs zuerst — sie skalieren am weitesten;
// Hack-Gangs NiteSec/The Black Hand bewusst weggelassen). Erste gründbare gewinnt.
// Anpassbar durch Umsortieren.
const GANGS_BY_POWER = [
    "Speakers for the Dead", "The Dark Army", "The Syndicate", "Tetrads",
    "Slum Snakes", "The Black Hand",
];

// =============================================================================
// MODUL-STATE
// =============================================================================

let myGangFaction = "";
let isHackGang = false;
let strWantedReduction = "";                 // "Vigilante Justice" | "Ethical Hacking"
let importantStats = [];                      // ["hack"] | ["str","def","dex","agi"]
let allTaskNames = [];
let allTaskStats = {};                        // taskName -> TaskStats
let equipments = [];                          // [{name,type,cost,stats}]
let myGangMembers = [];
let assignedTasks = {};                       // memberName -> taskName
let lastMemberReset = {};                     // memberName -> ms (Ascend/Recruit)
let multGangSoftcap = 1;                      // BitNode-GangSoftcap (Fallback 1)
let requiredRep = CFG.DEFAULT_REQ_REP;
let lastReqRepRefresh = 0;
let hasSing = false;

// Territory-Warfare-Laufzeitstatus (v0.3)
let cyclesSinceTick = 0;                       // Schätzung: Cycles seit letztem Territory-Tick
let lastAllGangs = null;                        // für Tick-Erkennung (NPC-Gangs ändern sich je Tick)
let inWarfareWindow = false;                    // sind wehrhafte Mitglieder gerade auf Warfare?
let warfareSince = 0;                           // v0.6: seit wann (ms) - Notbremse gegen Dauer-Warfare
let warfareLoggedDone = false;                  // 100%-Meldung nur einmal

// Engine-Konstanten (aus src/Gang, Bitburner 3.0.1)
const CYCLES_PER_TERRITORY = 100;               // GangConstants.CyclesPerTerritoryAndPowerUpdate
const MILLI_PER_CYCLE = 200;                    // CONSTANTS.MilliPerCycle

// =============================================================================
// HAUPT
// =============================================================================

export async function main(ns) {
    ns.disableLog("ALL");

    // Doppelstart-Schutz
    try {
        const self = ns.getScriptName();
        if (ns.ps(ns.getHostname()).filter(p => p.filename === self).length > 1) return;
    } catch (e) { /* weiter */ }

    // v3.0: KEIN Auto-Tail (Doktrin). Bei Bedarf: tail SCHWARM-GANG.js
    ns.print("SCHWARM-GANG v0.8 — Phasen: Phase 1=Territorium/Power, Phase 2=Geld/Rep.");

    // v0.6: WARTEN, BIS ES EINE GANG GIBT. getGangInformation wirft ohne
    // Gang - genau das ist die Probe, und sie kostet keinen neuen RAM, weil
    // die Hauptschleife dieselbe Funktion ohnehin benutzt.
    let ohneGangGemeldet = false;
    while (true) {
        let da = false;
        try { ns.gang.getGangInformation(); da = true; } catch (e) { da = false; }
        if (da) break;
        if (!ohneGangGemeldet) {
            ns.tprint("INFO  [GANG] Noch keine Gang - warte. WORK gruendet sie, sobald das Karma reicht.");
            ohneGangGemeldet = true;
        }
        await ns.sleep(60000);
    }

    await initialize(ns);

    const hasNextUpdate = typeof ns.gang.nextUpdate === "function";

    let lastOptimize = 0;
    let phase1logged = false, phase2logged = false;
    while (true) {
        try {
            const info = ns.gang.getGangInformation();
            myGangMembers = ns.gang.getMemberNames();

            // v4.0: Kennzahlen ins eigene Postfach (GANG_OUT).
            // Das Dashboard LAS diesen Kanal schon lange (readGangInfo), aber
            // geschrieben hat ihn NIEMAND — publishGangInfo hatte im ganzen
            // Projekt keinen einzigen Aufrufer, die Anzeige war dauerhaft leer.
            // Reine Anzeige, niemand handelt darauf; Geld/s kommt beim Dashboard
            // aus getMoneySources, damit es EINE Quelle fuer alle Raten gibt.
            try {
                publishGangInfo(ns, {
                    territory: info.territory,
                    power: info.power,
                    engaged: !!info.territoryWarfareEngaged,
                    members: myGangMembers.length,
                    // v0.6 DIAGNOSE: der Warfare-Zustand gehoert ins Lagebild.
                    // Genau diese drei Zahlen haetten den Stillstand sofort gezeigt -
                    // ein cyclesSinceTick weit ueber 100 bei dauerhaft gesetztem
                    // warfare ist der Fingerabdruck des davongelaufenen Zaehlers.
                    warfare: inWarfareWindow,
                    cyclesSinceTick: Math.round(cyclesSinceTick),
                    respectNext: (typeof info.respectForNextRecruit === "number")
                        ? info.respectForNextRecruit : null,
                    respect: info.respect,
                    // Die eine Zahl, an der man den Stillstand sofort sieht: steht sie
                    // bei 0, verdient KEIN Mitglied Respekt - dann laufen sie alle auf
                    // "Territory Warfare" (der Task hat kein baseRespect).
                    respectRate: info.respectGainRate,
                    moneyRate: info.moneyGainRate,
                    // v0.7: WER MACHT WAS. Ohne diese Verteilung blieb die Frage
                    // offen, warum die Respekt-Rate 0 ist: liegt es daran, dass
                    // alle auf "Territory Warfare" stehen (dieser Task zahlt
                    // keinen Respekt), oder daran, dass die Mitglieder fuer ihre
                    // Aufgabe zu schwach sind? Die Engine gibt bei zu schwachen
                    // Mitgliedern exakt 0 zurueck:
                    //     statWeight -= 4 * task.difficulty;
                    //     if (statWeight <= 0) return 0;
                    // Beide Faelle sehen in der Rate gleich aus, brauchen aber
                    // verschiedene Antworten — die Verteilung trennt sie.
                    tasks: (() => {
                        const h = {};
                        try {
                            for (const m of ns.gang.getMemberNames()) {
                                const t = ns.gang.getMemberInformation(m).task || "Unassigned";
                                h[t] = (h[t] || 0) + 1;
                            }
                        } catch (e) { /* Anzeige darf den Takt nie stoppen */ }
                        return h;
                    })(),
                    ts: Date.now(),
                });
            } catch (e) { /* Anzeige darf den Takt nie stoppen */ }

            const territoryDone = info.territory >= CFG.TERRITORY_DONE;

            // ================================================================
            // EINHEITLICHE STRATEGIE (v0.4 — BUGFIX)
            // ================================================================
            // FRÜHER: Zwei Phasen. Phase 1 (Territorium < 100 %) setzte ALLE Mitglieder
            //   DAUERHAFT auf "Territory Warfare" und rief den Optimizer NIE auf.
            //
            // Warum das die Gang komplett einfror (verifiziert an data/tasks.ts):
            //   Der Task "Territory Warfare" hat KEIN baseRespect, KEIN baseMoney.
            //   Er liefert ausschließlich Power. Also:
            //     - kein Respect  -> respectForNextRecruit() = 5^(n-2) wird nie erreicht
            //                        -> NIE ein neues Mitglied (Stagnation bei 3)
            //     - kein Geld     -> keine Ausrüstung
            //     - kein Training -> Stats bleiben unten
            //   Und Gang.calculatePower() ist PROPORTIONAL zu den Stats:
            //     memberPower = (hack+str+def+dex+agi+cha) / 95
            //   Ein Mitglied mit Stats 10 bringt 0.63, eines mit Stats 1000 bringt 63.
            //   Schwache Mitglieder auf Warfare sind also fast wertlos — und sie werden
            //   nie stark, weil sie nie trainieren. Selbst das Ziel der Phase (Power)
            //   wurde damit verfehlt.
            //
            //   Der Code widersprach zudem seiner EIGENEN Doku: der Kopf beschreibt
            //   korrekt, dass nur der TICK-MOMENT zählt (Gang.processTerritoryAndPowerGains
            //   addiert Power alle CyclesPerTerritoryAndPowerUpdate = 100 Cycles) —
            //   der Code setzte trotzdem dauerhaft.
            //
            // JETZT: Eine Strategie. Der Greedy-Optimizer (der Training, Respect, Geld
            //   und Wanted-Kontrolle bereits vollständig beherrscht) läuft IMMER.
            //   Territory Warfare wird NUR im Tick-Fenster gesetzt — dort zählt es.
            // ================================================================

            // Recruit / Ascend / Ausrüstung laufen immer.
            const recruited = await doRecruit(ns);
            const ascended  = await tryAscend(ns, info);
            await tryUpgrade(ns, info);
            if (recruited || ascended) await updateMemberActivities(ns);

            // Clash-Teilnahme je Win-Chance (schützt schwache Mitglieder vor dem Tod).
            await manageEngagement(ns, info);

            // Territory-Tick erkennen (die NPC-Gangs ändern sich im Tick).
            if (CFG.TERRITORY_WARFARE) {
                const allGangs = ns.gang.getAllGangInformation();
                const ticked = lastAllGangs != null && JSON.stringify(allGangs) !== JSON.stringify(lastAllGangs);
                lastAllGangs = allGangs;
                if (ticked) {
                    // ====================================================
                    // v0.6 BUGFIX - DER ZAEHLER LIEF DAVON
                    // ====================================================
                    // Hier stand:
                    //     cyclesSinceTick = Math.max(0, cyclesSinceTick - CYCLES_PER_TERRITORY)
                    // also GENAU EINE Periode je erkanntem Tick. ns.gang.nextUpdate()
                    // liefert aber cycles * MilliPerCycle, und bei aufgestauten Zyklen
                    // (Bonuszeit, Hintergrund-Tab, Skript-Neustart) sind das MEHRERE
                    // Perioden auf einmal. Der Zaehler wuchs damit monoton, nearTick war
                    // dauerhaft wahr - und weil inWarfareWindow NUR hier zurueckgesetzt
                    // wird, blieben die Mitglieder fuer immer auf "Territory Warfare".
                    //
                    // Der Task hat laut data/tasks.ts KEIN baseRespect und KEIN baseMoney.
                    // Die Gang verdiente also weder Respekt noch Geld, und die Schwelle
                    // fuer das naechste Mitglied ist 5^(Mitglieder-3+1) - bei 9 Mitgliedern
                    // 78.125 Respekt. Livebeleg: 9 Mitglieder und Territorium exakt auf
                    // dem Startwert 1/7 ueber vier Messzyklen unveraendert.
                    //
                    // v0.7 KORREKTUR. Hier stand:
                    //     cyclesSinceTick %= CYCLES_PER_TERRITORY;
                    // mit dem Kommentar, das hole den Zaehler "in JEDEM Fall in den
                    // gueltigen Bereich zurueck". Das war falsch: fuer jeden Wert
                    // unter 100 ist x % 100 === x — ein reiner Leerlauf. Ein einmal
                    // entstandener Versatz blieb damit fuer immer erhalten.
                    //
                    // Genau das stand im Livebericht: cyclesSinceTick 78. Die
                    // Fensterschwelle ist CYCLES_PER_TERRITORY - WARFARE_LEAD_CYCLES
                    // = 75, also war nearTick praktisch dauerhaft wahr und der
                    // Normalbetrieb (else-Zweig) kam kaum noch dran.
                    //
                    // An DIESER Stelle ist der Tick gerade erkannt worden — seit dem
                    // letzten Tick sind also null Cycles vergangen. Die einzig
                    // richtige Antwort ist 0, nicht der Rest einer Division.
                    cyclesSinceTick = 0;
                    if (inWarfareWindow) {
                        inWarfareWindow = false;
                        warfareSince = 0;
                        lastOptimize = 0;      // sofort zurück auf produktive Aufgaben
                    }
                }
            }

            // WARFARE-FENSTER: kurz vor dem Tick auf Territory Warfare schalten.
            // Power wird NUR im Tick-Moment gutgeschrieben — die Zeit davor zählt nicht.
            const nearTick = cyclesSinceTick >= (CYCLES_PER_TERRITORY - CFG.WARFARE_LEAD_CYCLES);
            const wantWarfare = CFG.TERRITORY_WARFARE && !territoryDone;

            // v0.6 NOTBREMSE. Der Modulo oben repariert den davonlaufenden Zaehler,
            // aber das Fenster haengt weiterhin an EINER Bedingung: der Tick-Erkennung
            // per JSON-Vergleich von getAllGangInformation(). Setzt die aus - etwa weil
            // zwei Messungen zufaellig gleich aussehen oder der Aufruf wirft -, waere
            // wieder Dauer-Warfare die Folge, also genau der Stillstand von vorher.
            // Ein Fenster deckt hoechstens WARFARE_LEAD_CYCLES Cycles ab; mehr als das
            // Dreifache in Echtzeit ist sicher ein Fehler und wird abgebrochen.
            const warfareMaxMs = CFG.WARFARE_LEAD_CYCLES * MILLI_PER_CYCLE * 3;
            if (inWarfareWindow && warfareSince > 0 && (Date.now() - warfareSince) > warfareMaxMs) {
                inWarfareWindow = false;
                warfareSince = 0;
                cyclesSinceTick = 0;
                lastOptimize = 0;
                ns.print("WARN: Warfare-Fenster nach " + Math.round(warfareMaxMs / 1000)
                    + " s zwangsbeendet - der Territoriums-Tick wurde nicht erkannt. "
                    + "Zurueck auf produktive Aufgaben (Respekt/Geld/Training).");
            }

            if (wantWarfare && nearTick) {
                if (!inWarfareWindow) {
                    setWarfareMembers(ns, info);
                    inWarfareWindow = true;
                    warfareSince = Date.now();
                    ns.print("Warfare-Fenster: Territorium " + (info.territory * 100).toFixed(1) + "% — Power-Tick steht an.");
                }
            } else {
                // NORMALBETRIEB: Greedy-Optimierung.
                // Der Optimizer weist selbst zu: Training (schwache/frische Mitglieder),
                // Respect (solange Mitglieder fehlen), Geld (danach) und Vigilante Justice
                // (wenn die Wanted-Rate entgleist). Genau das fehlte in Phase 1 komplett.
                if (Date.now() - lastOptimize >= CFG.OPT_INTERVAL_MS) {
                    await refreshRequiredRep(ns);
                    await optimize(ns, info);
                    lastOptimize = Date.now();
                }
            }

            if (territoryDone && !phase2logged) {
                ns.print("Territorium 100% — Clash aus, volle Optimierung auf Geld/Rep.");
                try { ns.gang.setTerritoryWarfare(false); } catch (e) { /* egal */ }
                phase2logged = true;
            }

        } catch (err) {
            ns.print("WARN: " + (typeof err === "string" ? err : (err && err.message) || JSON.stringify(err)));
        }

        // --- Warten: synchron zum Gang-Processing (exakte Cycle-Zählung via nextUpdate) ---
        if (hasNextUpdate) {
            try {
                const ms = await ns.gang.nextUpdate();
                cyclesSinceTick += (Number(ms) || 0) / MILLI_PER_CYCLE;
            } catch (e) { await ns.sleep(CFG.LOOP_MS); }
        } else {
            await ns.sleep(CFG.LOOP_MS);
        }
    }
}

// =============================================================================
// SETUP
// =============================================================================

/** Auf Gang warten / gründen, danach Stammdaten (Ausrüstung, Aufgaben) laden. */
async function initialize(ns) {
    // Singularity-Verfügbarkeit (für optionale requiredRep/factionRep-Berechnung)
    hasSing = hasCapability(ns, "SING");

    // GangSoftcap aus BitNode-Multiplikatoren (nur mit SF5 lesbar; sonst Fallback 1)
    try {
        const gs = await evalNs(ns, "ns.getBitNodeMultipliers().GangSoftcap");
        // v0.5 BUGFIX: hier stand "gs > 0". Damit wurde ausgerechnet der Wert
        // VERWORFEN, der die ganze Aussage traegt: GangSoftcap 0 (BN8) bedeutet
        //     territoryPenalty = (0.2*territory + 0.8) * 0 = 0
        //     respectGain = Math.pow(..., 0) = 1
        //     moneyGain   = Math.pow(..., 0) = 1
        // also KONSTANT 1 je Zyklus, unabhaengig von Stats, Ausruestung und
        // Territorium (Gang/formulas/formulas.ts:27/71). Ausruestung ist dort
        // nicht schwaecher, sondern mathematisch wirkungslos. Der Guard liess
        // stattdessen den Fallback 1 stehen — die Gang hielt sich fuer eine
        // normale BitNode und beantragte munter Milliarden.
        if (typeof gs === "number" && gs >= 0 && isFinite(gs)) multGangSoftcap = gs;
    } catch (e) { multGangSoftcap = 1; }

    // Auf Gang warten / gründen. createGang() gibt false, solange die Bedingungen
    // (v.a. Karma <= -54000; in BN2 sofort) nicht erfüllt sind. SCHWARM-WORK farmt
    // das Karma parallel. Hier nur pollen, bis die Gründung greift.
    let logged = false;
    let inGang = false;
    while (!inGang) {
        try { inGang = ns.gang.inGang(); } catch (e) { inGang = false; }
        if (inGang) break;
        if (!logged) {
            ns.print("Warte auf Gang-Gründung (Karma <= -54000 nötig; SCHWARM-WORK farmt parallel)...");
            logged = true;
        }
        for (const f of GANGS_BY_POWER) {
            try { if (ns.gang.createGang(f)) { inGang = true; break; } } catch (e) { /* nächste */ }
        }
        if (!inGang) await ns.sleep(2000);
    }

    const info = ns.gang.getGangInformation();
    myGangFaction = info.faction;
    isHackGang = info.isHacking;
    strWantedReduction = isHackGang ? "Ethical Hacking" : "Vigilante Justice";
    importantStats = isHackGang ? ["hack"] : ["str", "def", "dex", "agi"];
    if (logged) ns.print(__SCHWARM_BT__OK: Gang "__SCHWARM_DC__myGangFaction}" gegründet (__SCHWARM_DC__isHackGang ? "Hacking" : "Combat"}).__SCHWARM_BT__);

    // Warfare beim Start AUS (sauberer Initialzustand; der Loop steuert sie ab jetzt dynamisch)
    try { ns.gang.setTerritoryWarfare(false); } catch (e) { /* egal */ }

    // Ausrüstung (Namen/Typ/Stats ändern sich nie — einmal laden; Kosten holt tryUpgrade frisch)
    try {
        const names = ns.gang.getEquipmentNames();
        equipments = names.map(name => ({
            name,
            type: ns.gang.getEquipmentType(name),
            cost: ns.gang.getEquipmentCost(name),
            stats: ns.gang.getEquipmentStats(name),
        })).sort((a, b) => a.cost - b.cost);
    } catch (e) { equipments = []; }

    // Aufgaben-Stammdaten (einmal)
    try {
        allTaskNames = ns.gang.getTaskNames();
        allTaskStats = Object.fromEntries(allTaskNames.map(t => [t, ns.gang.getTaskStats(t)]));
    } catch (e) { allTaskNames = []; allTaskStats = {}; }

    // Aktuelle Mitglieder + deren Task initialisieren
    myGangMembers = ns.gang.getMemberNames();
    for (const m of myGangMembers) {
        let cur = "";
        try { cur = ns.gang.getMemberInformation(m).task; } catch (e) { cur = ""; }
        assignedTasks[m] = (cur && cur !== "Unassigned") ? cur : trainTask();
        if (!lastMemberReset[m]) lastMemberReset[m] = Date.now();
    }
    // Erste drei Mitglieder sind gratis — sofort holen
    while (myGangMembers.length < 3) {
        const ok = await doRecruit(ns);
        if (!ok) break;
    }
    await updateMemberActivities(ns);
    await refreshRequiredRep(ns);
    ns.print(__SCHWARM_BT__Setup fertig: __SCHWARM_DC__myGangMembers.length} Mitglieder, __SCHWARM_DC__allTaskNames.length} Aufgaben, __SCHWARM_DC__equipments.length} Ausrüstungen.__SCHWARM_BT__);
}

// =============================================================================
// AKTIONEN
// =============================================================================

/** Ein neues Mitglied rekrutieren, wenn möglich. @returns {Promise<boolean>} */
async function doRecruit(ns) {
    try {
        if (!ns.gang.canRecruitMember()) return false;
        let i = 0, name;
        do { name = __SCHWARM_BT__Thug __SCHWARM_DC__++i}__SCHWARM_BT__; } while (myGangMembers.includes(name) || myGangMembers.includes(name + " Understudy"));
        if (i < myGangMembers.length) name += " Understudy"; // den Gefallenen zu Ehren
        if (ns.gang.recruitMember(name)) {
            myGangMembers.push(name);
            assignedTasks[name] = trainTask();
            lastMemberReset[name] = Date.now();
            ns.print(__SCHWARM_BT__OK: Mitglied rekrutiert: "__SCHWARM_DC__name}"__SCHWARM_BT__);
            return true;
        }
    } catch (e) { ns.print("WARN: Rekrutierung fehlgeschlagen: " + e); }
    return false;
}

/** Mitglieder ascenden, wenn ein Hauptstat-Multi genug steigt. @returns {Promise<boolean>} */
async function tryAscend(ns, info) {
    let any = false;
    try {
        for (let i = 0; i < myGangMembers.length; i++) {
            const member = myGangMembers[i];
            // frühe Mitglieder bekommen die höchste Schwelle (stabiler, solange wenige da sind)
            const threshold = CFG.ASCEND_THRESHOLD + (11 - i) * CFG.ASCEND_SPACING;
            let res;
            try { res = ns.gang.getAscensionResult(member); } catch (e) { res = undefined; }
            if (!res || !importantStats.some(s => res[s] >= threshold)) continue;
            const done = ns.gang.ascendMember(member);
            if (done !== undefined) {
                lastMemberReset[member] = Date.now();
                any = true;
                ns.print(__SCHWARM_BT__OK: __SCHWARM_DC__member} ascended (__SCHWARM_DC__importantStats.map(s => __SCHWARM_BT____SCHWARM_DC__s} __SCHWARM_DC__res[s].toFixed(2)}x__SCHWARM_BT__).join(", ")}).__SCHWARM_BT__);
            }
        }
    } catch (e) { ns.print("WARN: Ascend fehlgeschlagen: " + e); }
    return any;
}

/** Fehlende Ausruestung/Augmentierungen kaufen - ueber BANK-Freigaben.
 *
 *  v0.8 (BANK v5.17): ZWEI Antraege, je Art einer:
 *    aug-<lauf>-<n>    Gang-Augmentierungen   prio 300 (bleiben beim Aufstieg)
 *    equip-<lauf>-<n>  uebrige Ausruestung    prio 100 (faellt beim Aufstieg weg)
 *  Dazwischen liegen die Spenden von WORK (200). BANK bedient der Reihe nach
 *  und ueberspringt, was nicht passt - die Kopf-Blockade von v0.5 gibt es
 *  nicht mehr. Der Zuschnitt auf REQ_CASH_FRAC bleibt als ANTEIL: die Gang ist
 *  ein Nebenzweig, Spieler-Augs und Server sollen weiter Geld bekommen.
 *
 *  Eine Freigabe kauft NUR aus ihrer eigenen Liste (bis v0.7 kaufte eine
 *  Freigabe quer durch Augs und Ausruestung). Nach dem Verbrauch: abmelden
 *  (cost 0, BANK bucht), Handlungsbuch mit exaktem Betrag, eine Runde
 *  aussetzen, damit BANK das Verschwinden sieht.
 *
 *  <lauf> ist die Startzeit (Basis 36): nach einem Neustart beginnt n wieder
 *  bei 1, und "equip-1" koennte sonst mit einem alten, noch nicht
 *  verfallenen Antrag zusammenfallen. */
const REQ_CHUNK_MAX = 25;              // Hoechstzahl Posten je Antrag
// v0.5: Anteil des von BANK gemeldeten freien Geldes, den ein Gang-Antrag
// hoechstens beanspruchen darf. Die Gang ist ein Nebenzweig.
const REQ_CASH_FRAC = 0.25;
const REQ_PRIO = { aug: 300, equip: 100 };   // v0.8: mit dem Spieler abgestimmt
const REQ_REFRESH_MS = 30000;          // v0.8: spaetestens so oft auffrischen (BANK-TTL 90 s)
let softcapLogged = false;             // Hinweis nur einmal ins Log
const reqLauf = Date.now().toString(36);
let reqSeq = 0;
const reqState = { aug: { aktiv: null, skip: 0 }, equip: { aktiv: null, skip: 0 } };

/** Antrag einer Art zurueckziehen (cost 0). */
function reqAbmelden(ns, art) {
    const st = reqState[art];
    // Nachtrag: ungenutzt - hier wurde nichts gekauft, BANK soll nicht buchen.
    if (st.aktiv) { requestFundsZurueck(ns, "GANGS", st.aktiv.id); st.aktiv = null; }
}

/** Liegt fuer diese Art eine Freigabe vor, daraus NUR aus der eigenen Liste
 *  kaufen, abmelden und den Verbrauch ins Handlungsbuch schreiben. */
function reqVerbrauchen(ns, art, liste) {
    const st = reqState[art];
    if (!st.aktiv) return false;
    const freigabe = readFundGrant(ns, "GANGS", st.aktiv.id);
    if (!(freigabe > 0)) return false;
    let rest = freigabe, n = 0, summe = 0;
    for (const o of liste) {
        if (o.cost > rest) continue;
        try {
            if (ns.gang.purchaseEquipment(o.member, o.name)) { n++; summe += o.cost; rest -= o.cost; }
        } catch (e) { /* weiter */ }
    }
    const id = st.aktiv.id;
    // abmelden: mit Kauf bucht BANK, ohne Kauf (n 0) ungenutzt - nicht buchen
    if (n > 0) requestFunds(ns, "GANGS", id, "money", 0);
    else requestFundsZurueck(ns, "GANGS", id);
    st.aktiv = null;
    // Zaehler statt Schalter: der Verbrauchstakt selbst und der naechste
    // stellen keinen neuen Antrag (wie bis v0.7: return + reqSkipOnce).
    st.skip = 2;
    // Der Preis kommt aus getEquipmentCost im selben synchronen Takt - genau
    // das bucht purchaseEquipment (GangMember.ts:359) in gang_expenses.
    try {
        chronik(ns, "GANG", "freigabe", "GANGS/" + id, "verbraucht",
            n + " Kaeufe fuer " + formatMoney(summe) + " von " + formatMoney(freigabe),
            { id: "GANGS/" + id, betrag: summe, freigabe: freigabe, n: n, topf: "gang_expenses", art: art });
    } catch (e) { /* darf nie stoeren */ }
    if (n > 0) ns.print("OK: " + n + " Kaeufe (" + art + ") fuer " + formatMoney(summe)
        + " (BANK-Freigabe " + formatMoney(freigabe) + ").");
    return true;
}

/** Antrag einer Art stellen oder auffrischen - zugeschnitten auf das Budget. */
function reqStellen(ns, art, liste, budget) {
    const st = reqState[art];
    if (st.skip > 0) { st.skip--; return; }
    const chunk = [];
    let sum = 0;
    for (const o of liste) {
        if (chunk.length >= REQ_CHUNK_MAX) break;
        if (isFinite(budget) && sum + o.cost > budget) continue;   // zu teuer -> ueberspringen
        chunk.push(o); sum += o.cost;
    }
    // Passt nicht einmal der billigste Posten: Antrag zurueckziehen und im
    // naechsten Takt neu pruefen.
    if (chunk.length === 0 || !(sum > 0)) { reqAbmelden(ns, art); return; }
    const jetzt = Date.now();
    if (!st.aktiv) { reqSeq++; st.aktiv = { id: art + "-" + reqLauf + "-" + reqSeq, sum: 0, at: 0 }; }
    // Nur bei geaendertem Betrag oder alle 30 s senden. Bis v0.7 ging jede
    // Runde (~2 s) eine Zeile an BANK - mit zwei Antraegen waere das der halbe
    // Eingang (50 Plaetze), und ein voller Eingang verschluckt Abmeldungen.
    // Nachtrag 3: "gleicher Betrag" traf fast nie - die Preise schwanken jeden
    // Takt ein wenig. Erst ab 5 % Aenderung neu senden.
    const aenderung = st.aktiv.sum > 0 ? Math.abs(sum - st.aktiv.sum) / st.aktiv.sum : 1;
    if (aenderung < 0.05 && jetzt - st.aktiv.at < REQ_REFRESH_MS) return;
    st.aktiv.sum = sum;
    st.aktiv.at = jetzt;
    requestFunds(ns, "GANGS", st.aktiv.id, "money", sum, REQ_PRIO[art]);
    ns.print("BANK-Antrag " + st.aktiv.id + ": " + chunk.length + " Posten, " + formatMoney(sum)
        + " (offen: " + liste.length + ", Prio " + REQ_PRIO[art] + ").");
}

async function tryUpgrade(ns, info) {
    try {
        if (equipments.length === 0) return;
        // Kosten frisch (Rabatt aendert sich mit Ruf/Territorium)
        for (const e of equipments) {
            try { e.cost = ns.gang.getEquipmentCost(e.name); } catch (err) { /* alten Wert behalten */ }
        }

        const dictMembers = Object.fromEntries(myGangMembers.map(m => [m, ns.gang.getMemberInformation(m)]));
        const now = Date.now();

        // Ausruestung ohne Hauptstat-Nutzen "teurer" erscheinen lassen (zurueckstellen)
        const perceivedCost = (equip) => {
            const helps = Object.keys(equip.stats).some(stat => importantStats.some(i => stat.includes(i)));
            return equip.cost * (helps ? 1 : CFG.OFF_STAT_PENALTY);
        };

        // --- WUNSCHLISTEN: Augs (alle Mitglieder), transiente Ausruestung
        //     (nur stabile Mitglieder), je Liste billig -> teuer. ---
        const wishAugs = [], wishEquip = [];
        for (const equip of equipments) {
            const isAug = equip.type === "Augmentation";
            for (const member of Object.values(dictMembers)) {
                if (isAug) {
                    if (!member.augmentations.includes(equip.name)) {
                        wishAugs.push({ member: member.name, name: equip.name, type: equip.type, cost: equip.cost, p: perceivedCost(equip) });
                    }
                } else {
                    const stable = (now - (lastMemberReset[member.name] || 0)) >= CFG.MIN_TRAINING_MS;
                    if (stable && !member.upgrades.includes(equip.name)) {
                        wishEquip.push({ member: member.name, name: equip.name, type: equip.type, cost: equip.cost, p: perceivedCost(equip) });
                    }
                }
            }
        }
        wishAugs.sort((a, b) => a.p - b.p);
        wishEquip.sort((a, b) => a.p - b.p);

        // --- FREIGABEN VERBRAUCHEN: beide Arten im selben Takt ---
        reqVerbrauchen(ns, "aug", wishAugs);
        reqVerbrauchen(ns, "equip", wishEquip);

        // Leere Liste -> Antrag dieser Art zurueckziehen.
        if (wishAugs.length === 0) reqAbmelden(ns, "aug");
        if (wishEquip.length === 0) reqAbmelden(ns, "equip");
        if (wishAugs.length === 0 && wishEquip.length === 0) return;

        // =================================================================
        // v0.5 - WIRKUNGSLOSE BITNODE: GAR NICHT ERST BEANTRAGEN
        // =================================================================
        // GangSoftcap 0 heisst Math.pow(x, 0) = 1: Respekt- und Geldzuwachs
        // sind konstant 1 je Zyklus, egal wie gut ausgeruestet die Mitglieder
        // sind. Jeder Dollar in Ausruestung ist dort zu 100 % verloren.
        if (multGangSoftcap === 0) {
            reqAbmelden(ns, "aug");
            reqAbmelden(ns, "equip");
            if (!softcapLogged) {
                softcapLogged = true;
                ns.print("AUSRUESTUNG AUS: GangSoftcap ist 0 in dieser BitNode. "
                    + "Respekt- und Geldzuwachs sind dort konstant 1 je Zyklus "
                    + "(Math.pow(x,0)), Ausruestung aendert daran nichts. "
                    + "Territorium und Aufstieg laufen normal weiter.");
            }
            return;
        }

        // Budget je Antrag: REQ_CASH_FRAC des Geldes, das BANK als frei meldet.
        let frei = Infinity;
        try {
            const bi = readBankInfo(ns);
            if (bi && typeof bi.frei === "number" && isFinite(bi.frei)) frei = bi.frei;
        } catch (e) { frei = Infinity; }
        const budget = isFinite(frei) ? Math.max(0, frei * REQ_CASH_FRAC) : Infinity;

        reqStellen(ns, "aug", wishAugs, budget);
        reqStellen(ns, "equip", wishEquip, budget);
    } catch (e) { ns.print("WARN: Ausruestungskauf fehlgeschlagen: " + e); }
}

/**
 * Aufgaben an alle Mitglieder gemäß assignedTasks setzen (nur bei Abweichung).
 * Direkte setMemberTask-Schleife (kein Batch-Temp-Skript nötig).
 */
async function updateMemberActivities(ns) {
    try {
        const dictMembers = Object.fromEntries(myGangMembers.map(m => [m, ns.gang.getMemberInformation(m)]));
        let changed = 0;
        for (const m of myGangMembers) {
            const want = assignedTasks[m] || trainTask();
            const cur = dictMembers[m] ? dictMembers[m].task : "";
            if (cur === want) continue;
            try { if (ns.gang.setMemberTask(m, want)) changed++; } catch (e) { /* weiter */ }
        }
        if (changed > 0) {
            const kinds = myGangMembers.map(m => assignedTasks[m]).filter((v, i, s) => s.indexOf(v) === i);
            ns.print(__SCHWARM_BT__INFO: __SCHWARM_DC__changed} Aufgaben aktualisiert (__SCHWARM_DC__kinds.join(", ")}).__SCHWARM_BT__);
        }
    } catch (e) { ns.print("WARN: Aufgaben setzen fehlgeschlagen: " + e); }
}

/** Clash-Teilnahme (setTerritoryWarfare) abhängig von der Ø-Win-Chance gegen aktive Gangs.
 *  Bei Teilnahme = 1 (jeder Tick ein Clash); zu schwach -> aus (nur Power aufbauen). */
async function manageEngagement(ns, info) {
    try {
        const others = ns.gang.getAllGangInformation();
        let total = 0, count = 0, lowest = 1, lowestName = "";
        for (const name in others) {
            if (name === myGangFaction || !others[name] || others[name].territory <= 0) continue;
            const win = info.power / (info.power + others[name].power);
            total += win; count++;
            if (win < lowest) { lowest = win; lowestName = name; }
        }
        const avg = count > 0 ? total / count : 1; // keine Gegner mehr -> volle Chance
        const shouldEngage = avg >= CFG.WARFARE_WINCHANCE_THRESHOLD;
        if (shouldEngage !== info.territoryWarfareEngaged) {
            ns.gang.setTerritoryWarfare(shouldEngage);
            ns.print(__SCHWARM_BT__INFO: Clash-Teilnahme __SCHWARM_DC__shouldEngage ? "AN" : "AUS"} __SCHWARM_BT__ +
                __SCHWARM_BT__(Ø Win __SCHWARM_DC__(avg * 100).toFixed(0)} %__SCHWARM_BT__ +
                (lowestName ? __SCHWARM_BT__, schwächster Gegner __SCHWARM_DC__lowestName} __SCHWARM_DC__(lowest * 100).toFixed(0)} %__SCHWARM_BT__ : "") +
                __SCHWARM_BT__, Power __SCHWARM_DC__formatNumber(info.power)}).__SCHWARM_BT__);
        }
    } catch (e) { ns.print("WARN: Engagement-Steuerung fehlgeschlagen: " + e); }
}

/** Wehrhafte Mitglieder ins Warfare-Fenster setzen (nur diese können bei Clashes sterben,
 *  Chance ~ 1/def^0.6 -> hohe Defense = sicher). Schwache bleiben auf ihrer Rep/Geld-Aufgabe.
 *  @returns {Promise<boolean>} true, wenn wenigstens ein Mitglied kämpft. */
async function setWarfareTasks(ns) {
    try {
        const dict = Object.fromEntries(myGangMembers.map(m => [m, ns.gang.getMemberInformation(m)]));
        const maxDef = Math.max(1, ...Object.values(dict).map(m => m.def));
        let n = 0;
        for (const m of myGangMembers) {
            const mi = dict[m];
            const wehrhaft = mi.def >= CFG.WARFARE_MIN_DEF && mi.def >= maxDef * CFG.WARFARE_DEF_FRAC;
            if (!wehrhaft) continue;
            if (mi.task !== "Territory Warfare") { try { ns.gang.setMemberTask(m, "Territory Warfare"); } catch (e) { /* weiter */ } }
            n++;
        }
        return n > 0;
    } catch (e) { ns.print("WARN: Warfare-Aufgaben fehlgeschlagen: " + e); return false; }
}

/**
 * Aufgaben so wählen, dass optStat (Ruf/Geld/beides) maximiert wird, ohne dass
 * die Wanted-Rate die Toleranz überschreitet. Greedy mit 100 zufälligen
 * Reihenfolgen (aus gangs.js). Optimierung rein über die Formeln.
 */
async function optimize(ns, info) {
    try {
        const dictMembers = Object.fromEntries(myGangMembers.map(m => [m, ns.gang.getMemberInformation(m)]));

        const curPenalty = wantedPenalty(info) - 1;
        const wantedGainTolerance =
            curPenalty < -1.1 * CFG.WANTED_PENALTY_THRESHOLD && info.wantedLevel >= (1.1 + info.respect / 1000) && info.respect > 200
                ? -0.01 * info.wantedLevel
                : curPenalty < -0.9 * CFG.WANTED_PENALTY_THRESHOLD && info.wantedLevel >= (1.1 + info.respect / 10000)
                    ? 0
                    : Math.max(info.respectGainRate / 1000, info.wantedLevel / 10);

        const playerMoney = ns.getServerMoneyAvailable("home");

        // Faktions-Ruf: mit SF4 exakt, sonst aus respect geschätzt (1/75 pro respect)
        let factionRep = -1;
        if (hasSing) {
            try {
                const r = await evalNs(ns, __SCHWARM_BT__ns.singularity.getFactionRep(__SCHWARM_DC__JSON.stringify(myGangFaction)})__SCHWARM_BT__);
                if (typeof r === "number") factionRep = r;
            } catch (e) { /* Schätzung unten */ }
        }
        if (factionRep < 0) factionRep = info.respect / 75;

        const optStat = CFG.FOCUS === "respect" ? "respect"
            : CFG.FOCUS === "money" ? "money"
                : factionRep > requiredRep ? "money"
                    : (playerMoney > 1e11 || info.respect < 9000) ? "respect"
                        : "both money and respect";

        // Gewinne jedes Mitglieds für jede Aufgabe vorberechnen; Aufgaben ohne
        // jeden Nutzen, die aber Wanted erzeugen, entfernen.
        const memberTaskRates = Object.fromEntries(Object.values(dictMembers).map(m => [m.name, allTaskNames.map(taskName => ({
            name: taskName,
            respect: computeRepGains(info, taskName, m),
            money: calculateMoneyGains(info, taskName, m),
            wanted: computeWantedGains(info, taskName, m),
        })).filter(t => t.wanted <= 0 || t.money > 0 || t.respect > 0)]));

        if (optStat === "both money and respect") {
            Object.values(memberTaskRates).flat().forEach(v => v[optStat] = v.money / 1000 + v.respect);
            Object.values(memberTaskRates).forEach((tasks, idx) => tasks.sort((a, b) => idx % 2 === 0 ? b.respect - a.respect : b.money - a.money));
        } else {
            Object.values(memberTaskRates).forEach(tasks => tasks.sort((a, b) => b[optStat] - a[optStat]));
        }

        let bestTaskAssignments = null, bestWanted = 0;
        // =====================================================================
        // v0.5 BUGFIX — ZWEI GRUENDE, WARUM "KEIN BESSERER PLAN" DIE GANG EINFROR
        // =====================================================================
        // Hier stand:
        //     let bestTotalGain = info.wantedLevelGainRate > wantedGainTolerance ? 0
        //         : optStat === "respect" ? info.respectGainRate : info.moneyGainRate;
        //
        // FEHLER 1 — MASSSTAB. Im Modus "both money and respect" bewertet die
        // Schleife jeden Plan mit  money/1000 + respect  (siehe oben, wo
        // v[optStat] gesetzt wird). Die Messlatte nahm aber info.moneyGainRate,
        // also ROHES Geld je Sekunde. Bei $50k/s Einnahmen und einem
        // Mischwert um 100 ist "100 > 50000" nie wahr — in diesem Modus wurde
        // also NIE ein Plan angenommen, egal wie gut er war. Die Latte muss in
        // derselben Einheit liegen wie das, was gemessen wird.
        //
        // FEHLER 2 — DIE NULL. Verdient die Gang gerade nichts, ist die Latte 0.
        // Ein Plan, der ebenfalls 0 ergibt, scheitert dann an "0 > 0" — und
        // genau das ist der Zustand, aus dem man herauskommen will: liefert
        // JEDE Aufgabe 0, greift weiter oben der Trainings-Rueckfall
        //     (taskRates[0][optStat] === 0) -> trainTask()
        // und der wurde nie uebernommen. Die Mitglieder blieben auf Aufgaben
        // sitzen, fuer die sie zu schwach sind (Engine: statWeight - 4*difficulty
        // <= 0 gibt hart 0 zurueck, Gang/formulas/formulas.ts:24-25) und
        // trainierten nicht, wurden also auch nie stark genug. Eine Falle, die
        // sich selbst zuhaelt.
        //
        // LIVE: in 55 von 431 Berichten "GANG: Respekt-Rate 0"; im Log dazu
        // "INFO: Kein besserer Plan".
        //
        // Bei einer Latte von 0 wird sie auf -1 gesetzt: dann gewinnt auch ein
        // Plan mit Ertrag 0 — und das ist richtig so, denn er enthaelt das
        // Training, das aus der Lage herausfuehrt.
        let bestTotalGain = info.wantedLevelGainRate > wantedGainTolerance ? 0
            : optStat === "respect" ? info.respectGainRate
                : optStat === "money" ? info.moneyGainRate
                    : (info.moneyGainRate / 1000) + info.respectGainRate;
        if (!(bestTotalGain > 0)) bestTotalGain = -1;

        for (let shuffle = 0; shuffle < 100; shuffle++) {
            const proposed = {};
            let totalWanted = 0, totalGain = 0;
            shuffleArray(myGangMembers.slice()).forEach((member, index) => {
                const taskRates = memberTaskRates[member];
                if (!taskRates || taskRates.length === 0) return;
                const sustainable = (index < myGangMembers.length - 2) ? taskRates : taskRates.filter(c => (totalWanted + c.wanted) <= wantedGainTolerance);
                const inTraining = (Date.now() - (lastMemberReset[member] || 0)) < CFG.MIN_TRAINING_MS;
                const bestTask = (taskRates[0][optStat] === 0 || inTraining)
                    ? (taskRates.find(t => t.name === trainTask()) || taskRates[0])
                    : (totalWanted > wantedGainTolerance || sustainable.length === 0)
                        ? (taskRates.find(t => t.name === strWantedReduction) || taskRates[0])
                        : sustainable[0];
                proposed[member] = bestTask;
                totalWanted += bestTask.wanted;
                totalGain += bestTask[optStat];
            });
            // solange über Toleranz: den größten Wanted-Erzeuger herunterstufen
            let guard = 9999;
            while (totalWanted > wantedGainTolerance && Object.values(proposed).some(t => t.name !== strWantedReduction)) {
                const worst = Object.keys(proposed).reduce((t, c) =>
                    proposed[c].name !== strWantedReduction && (t == null || proposed[t].wanted < proposed[c].wanted) ? c : t, null);
                if (worst == null) break;
                const next = memberTaskRates[worst].filter(c => c.wanted < proposed[worst].wanted)[0]
                    || memberTaskRates[worst].find(t => t.name === strWantedReduction);
                if (!next) break;
                totalWanted += next.wanted - proposed[worst].wanted;
                totalGain += next[optStat] - proposed[worst][optStat];
                proposed[worst] = next;
                if (guard-- <= 0) break;
            }
            if ((totalWanted <= wantedGainTolerance && totalGain > bestTotalGain) ||
                (totalWanted > wantedGainTolerance && totalWanted < bestWanted)) {
                bestTaskAssignments = proposed; bestTotalGain = totalGain; bestWanted = totalWanted;
            }
        }

        // v0.7 BUGFIX — DIE GANG STAND STUNDENLANG STILL.
        //
        // Hier stand das Setzen der Aufgaben INNERHALB der if-Bedingung. Das
        // sah sparsam aus, war aber der Grund fuer den Stillstand:
        //
        //   setWarfareMembers() schreibt "Territory Warfare" DIREKT in die
        //   Engine (setMemberTask) und fasst assignedTasks nicht an. Ab dem
        //   ersten Warfare-Fenster gilt also: Engine = Territory Warfare,
        //   Cache = der alte produktive Plan.
        //
        //   Schliesst das Fenster, laeuft optimize() — und rechnet bei
        //   unveraenderten Stats denselben Plan wieder heraus, der schon im
        //   Cache steht. Die some()-Bedingung verglich Plan gegen CACHE, war
        //   damit falsch, und der EINZIGE Aufruf, der die Engine wieder in
        //   Ordnung gebracht haette, wurde uebersprungen. Ausgegeben wurde
        //   "Aufgaben bereits optimal" — bei Respekt-Rate 0.00.
        //
        // Der Task "Territory Warfare" hat in data/tasks.ts weder baseRespect
        // noch baseMoney; formulas.ts gibt dort hart 0 zurueck. Die Gang
        // verdiente also nichts mehr und kam nie ueber die Rekrutierungs-
        // schwelle 5^(Mitglieder-3+1) = 78.125 bei 9 Mitgliedern.
        //
        // JETZT laeuft updateMemberActivities IMMER. Es vergleicht als einzige
        // Funktion gegen die ECHTE Engine-Aufgabe (cur === want -> continue)
        // und kostet daher nichts, wenn ohnehin alles passt. Damit heilt sich
        // jede Abweichung zwischen Cache und Engine von selbst — unabhaengig
        // davon, wodurch sie entstanden ist.
        const geplant = bestTaskAssignments != null;
        if (geplant) {
            for (const m of myGangMembers) if (bestTaskAssignments[m]) assignedTasks[m] = bestTaskAssignments[m].name;
        }
        await updateMemberActivities(ns);
        if (geplant) {
            ns.print(__SCHWARM_BT__OK: Aufgaben optimiert für __SCHWARM_DC__optStat} (Toleranz __SCHWARM_DC__wantedGainTolerance.toPrecision(2)}). __SCHWARM_BT__ +
                __SCHWARM_BT__Ruf/s __SCHWARM_DC__formatNumber(info.respectGainRate)}, Geld/s __SCHWARM_DC__formatMoney(info.moneyGainRate)}, __SCHWARM_BT__ +
                __SCHWARM_BT__Wanted/s __SCHWARM_DC__info.wantedLevelGainRate.toPrecision(3)}, Ruf __SCHWARM_DC__formatNumber(factionRep)}/__SCHWARM_DC__formatNumber(requiredRep)}.__SCHWARM_BT__);
        } else {
            ns.print(__SCHWARM_BT__INFO: Kein besserer Plan für __SCHWARM_DC__optStat} | Ruf/s __SCHWARM_DC__formatNumber(info.respectGainRate)}, __SCHWARM_BT__ +
                __SCHWARM_BT__Geld/s __SCHWARM_DC__formatMoney(info.moneyGainRate)}, Wanted/s __SCHWARM_DC__info.wantedLevelGainRate.toPrecision(3)}.__SCHWARM_BT__);
        }
    } catch (e) { ns.print("WARN: Optimierung fehlgeschlagen: " + e); }
}

/** requiredRep bestimmen: teuerste unbesessene Aug der Gang-Faktion (mit SF4), sonst Default. */
async function refreshRequiredRep(ns) {
    if (lastReqRepRefresh && Date.now() - lastReqRepRefresh < CFG.REQ_REP_REFRESH_MS) return;
    lastReqRepRefresh = Date.now();
    if (!hasSing) { requiredRep = CFG.DEFAULT_REQ_REP; return; }
    try {
        const augs = await evalNs(ns, __SCHWARM_BT__ns.singularity.getAugmentationsFromFaction(__SCHWARM_DC__JSON.stringify(myGangFaction)})__SCHWARM_BT__);
        const owned = await evalNs(ns, "ns.singularity.getOwnedAugmentations(true)");
        if (!Array.isArray(augs) || !Array.isArray(owned)) { requiredRep = CFG.DEFAULT_REQ_REP; return; }
        const ownedSet = new Set(owned);
        // "The Red Pill" ignorieren (Gangs bieten ihn fälschlich außerhalb BN2 an)
        const unowned = augs.filter(a => !ownedSet.has(a) && a !== "The Red Pill");
        if (unowned.length === 0) { requiredRep = 0; return; }
        const reqs = await evalNs(ns, __SCHWARM_BT__Object.fromEntries((__SCHWARM_DC__JSON.stringify(unowned)}).map(a => [a, ns.singularity.getAugmentationRepReq(a)]))__SCHWARM_BT__);
        if (reqs) requiredRep = Math.max(0, ...unowned.map(a => reqs[a] || 0));
    } catch (e) { requiredRep = CFG.DEFAULT_REQ_REP; }
}

// =============================================================================
// FORMELN (aus Bitburner-Quellcode via gangs.js — reine Funktionen, 0 GB)
// =============================================================================

/**
 * WARFARE-FENSTER (v0.4): Mitglieder für den Power-Tick auf "Territory Warfare" setzen.
 *
 * Engine-Fakten:
 *   Gang.calculatePower():
 *     nur Mitglieder mit task === "Territory Warfare" zählen; ihr Beitrag ist
 *     GangMember.calculatePower() = (hack+str+def+dex+agi+cha) / 95.
 *   Gang.processTerritoryAndPowerGains():
 *     Power wird NUR alle CyclesPerTerritoryAndPowerUpdate (=100) Cycles addiert.
 *   -> Es zählt allein, wer IM TICK-MOMENT auf Warfare steht. Dauerhaft dort zu
 *      stehen bringt keinen Power-Vorteil, kostet aber Respect, Geld und Training.
 *
 * Todesrisiko: Nur wenn Clashes AKTIV sind (territoryWarfareEngaged), können
 * Mitglieder auf diesem Task sterben. Ist der Clash aus, dürfen ALLE mitmachen —
 * mehr Stats-Summe = mehr Power. Ist er an, nur die wehrhaften.
 */
function setWarfareMembers(ns, info) {
    try {
        const rows = [];
        for (const m of myGangMembers) {
            try {
                const mi = ns.gang.getMemberInformation(m);
                if (mi) rows.push({ name: m, mi });
            } catch (e) { /* Mitglied überspringen */ }
        }
        if (rows.length === 0) return;

        const clashOn = !!info.territoryWarfareEngaged;
        const maxDef = Math.max(1, ...rows.map(r => r.mi.def));

        let on = 0;
        for (const { name, mi } of rows) {
            // Bei aktivem Clash nur wehrhafte Mitglieder (Todesschutz).
            const safe = !clashOn ||
                (mi.def >= CFG.WARFARE_MIN_DEF && mi.def >= maxDef * CFG.WARFARE_DEF_FRAC);
            if (!safe) continue;
            try {
                if (mi.task !== "Territory Warfare") ns.gang.setMemberTask(name, "Territory Warfare");
                on++;
            } catch (e) { /* weiter */ }
        }
        ns.print("Warfare: " + on + "/" + rows.length + " Mitglieder auf Territory Warfare" +
                 (clashOn ? " (Clash AKTIV — nur wehrhafte)" : " (Clash aus — alle)"));
    } catch (e) { /* Fenster darf nie crashen */ }
}

function trainTask() { return "Train " + (isHackGang ? "Hacking" : "Combat"); }

function getStatWeight(task, m) {
    return (task.hackWeight / 100) * m["hack"] +
        (task.strWeight / 100) * m.str +
        (task.defWeight / 100) * m.def +
        (task.dexWeight / 100) * m.dex +
        (task.agiWeight / 100) * m.agi +
        (task.chaWeight / 100) * m.cha;
}

const wantedPenalty = (info) => info.respect / (info.respect + info.wantedLevel);
const territoryPenalty = (info) => (0.2 * info.territory + 0.8) * multGangSoftcap;

function computeRepGains(info, taskName, m) {
    const task = allTaskStats[taskName];
    if (!task) return 0;
    const statWeight = getStatWeight(task, m) - 4 * task.difficulty;
    if (task.baseRespect === 0 || statWeight <= 0) return 0;
    const territoryMult = Math.max(0.005, Math.pow(info.territory * 100, task.territory.respect) / 100);
    if (isNaN(territoryMult) || territoryMult <= 0) return 0;
    const respectMult = wantedPenalty(info);
    return Math.pow(11 * task.baseRespect * statWeight * territoryMult * respectMult, territoryPenalty(info));
}

function computeWantedGains(info, taskName, m) {
    const task = allTaskStats[taskName];
    if (!task) return 0;
    const statWeight = getStatWeight(task, m) - 3.5 * task.difficulty;
    if (task.baseWanted === 0 || statWeight <= 0) return 0;
    const territoryMult = Math.max(0.005, Math.pow(info.territory * 100, task.territory.wanted) / 100);
    if (isNaN(territoryMult) || territoryMult <= 0) return 0;
    return (task.baseWanted < 0)
        ? 0.4 * task.baseWanted * statWeight * territoryMult
        : Math.min(100, (7 * task.baseWanted) / Math.pow(3 * statWeight * territoryMult, 0.8));
}

function calculateMoneyGains(info, taskName, m) {
    const task = allTaskStats[taskName];
    if (!task) return 0;
    const statWeight = getStatWeight(task, m) - 3.2 * task.difficulty;
    if (task.baseMoney === 0 || statWeight <= 0) return 0;
    const territoryMult = Math.max(0.005, Math.pow(info.territory * 100, task.territory.money) / 100);
    if (isNaN(territoryMult) || territoryMult <= 0) return 0;
    const respectMult = wantedPenalty(info);
    return Math.pow(5 * task.baseMoney * statWeight * territoryMult * respectMult, territoryPenalty(info));
}

/** Fisher-Yates-Shuffle (verhindert Optimierungs-Zyklen durch Reihenfolge). */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}`;
const SRC_BITNODE = `/**
 * SCHWARM-BITNODE.js — v1.0   Den Durchlauf beenden und die naechste Node waehlen
 *
 * WARUM ES DIESES SKRIPT UEBERHAUPT BRAUCHT. Stufe 2 hat die ERLAUBNIS
 * verdrahtet (Plan-Datei -> QUEEN -> Port PLAN_OUT -> BLADEBURNER/BACKDOOR/BANK)
 * und die HANDLUNG vergessen. Am 13.09.2026 war "Operation Daedalus" erledigt,
 * alle BlackOps durch — und nichts passierte. Der Grund steht in der Engine:
 * finishBitNode() wird AUSSCHLIESSLICH aus der Bladeburner-Oberflaeche gerufen
 * (Bladeburner/ui/BlackOpPage.tsx, Knopf "Destroy w0r1d_d43m0n") und aus dem
 * Dev-Menue. Fuer den Bladeburner-Weg gibt es KEINE Skript-Schnittstelle.
 *
 * DER WEG, DEN ES GIBT, ist ns.singularity.destroyW0r1dD43m0n(nextBN, cbScript).
 * Ihre Bedingung ist ein ODER (NetscriptFunctions/Singularity.ts):
 *     hackingRequirements()      Skill >= wd.requiredHackingSkill UND Adminrechte
 *  ODER
 *     bladeburnerRequirements()  numBlackOpsComplete >= numberOfBlackOperations
 * Mit nextBN ruft sie direkt enterBitNode(...) — sie waehlt die naechste Node
 * also gleich mit, ohne den BitVerse-Bildschirm. cbScript laeuft drueben an.
 *
 * DAEMON, NICHT ONE-SHOT — und das ist Absicht. Ein One-Shot haette an der
 * Start-Logik der QUEEN gehangen (RESET braucht dort zusaetzlich ein WANT).
 * Als Daemon mit defaultOff bedeutet "aus" wirklich aus: das Skript laeuft
 * dann gar nicht. Angeschaltet wartet es geduldig, bis alles zusammenpasst.
 *
 * FUENF HUERDEN, alle muessen fallen. Die Reihenfolge ist von billig nach teuer:
 *   1. Freigabe frisch auf PLAN_OUT (weg = daedalus | weltdaemon)
 *   2. ZIEL-NODE aus der Plan-Datei, ganze Zahl 1..14
 *   3. Callback-Skript liegt auf home — sonst startet drueben nichts
 *   4. Engine-Bedingung selbst nachgeprueft, NICHT der Freigabe geglaubt
 *   5. destroyW0r1dD43m0n ueberhaupt vorhanden (SF4)
 *
 * WARUM HUERDE 4 TROTZ HUERDE 1. Die Freigabe sagt "du darfst", nicht "es
 * geht". Zwischen beidem lag am 13.09. der ganze Fehler. Wer die Erlaubnis
 * fuer die Faehigkeit haelt, baut genau diese Luecke ein zweites Mal.
 *
 * @param {NS} ns
 */
import { planFreigabe, announce } from "SCHWARM-HELPERS.js";

const CALLBACK  = "SCHWARM-GENESIS.js";
const PLAN_FILE = "schwarm-plan.txt";
const TAKT_MS   = 5000;

/** ZIEL-NODE aus der Plan-Datei. Gibt null zurueck, wenn sie unplausibel ist. */
function zielNode(ns) {
    let text = "";
    try { text = ns.read(PLAN_FILE) || ""; } catch (e) { return null; }
    for (const roh of text.split("\\n")) {
        const zeile = roh.split("#")[0].trim();
        const i = zeile.indexOf(":");
        if (i <= 0) continue;
        if (zeile.slice(0, i).trim().toUpperCase() !== "ZIEL-NODE") continue;
        const wert = zeile.slice(i + 1).trim();
        if (!/^\\d+$/.test(wert)) return null;
        const n = Number(wert);
        return (n >= 1 && n <= 15) ? n : null;   // v1.1: BN15 gibt es auch
    }
    return null;
}

/** Engine-Bedingung SELBST pruefen — die Freigabe ist Erlaubnis, kein Nachweis. */
function engineBereit(ns) {
    // Bladeburner-Zweig: alle BlackOps durch. getNextBlackOp() liefert dann null.
    try {
        if (ns.bladeburner.inBladeburner()) {
            const naechste = ns.bladeburner.getNextBlackOp();
            if (naechste === null) return "bladeburner: alle BlackOps erledigt";
        }
    } catch (e) { /* kein Bladeburner -> anderer Zweig */ }
    // Hacking-Zweig: Adminrechte auf dem Weltdaemon und Skill hoch genug.
    try {
        const s = ns.getServer("w0r1d_d43m0n");
        if (s && s.hasAdminRights && ns.getHackingLevel() >= s.requiredHackingSkill) {
            return "hacking: Adminrechte und Skill auf w0r1d_d43m0n";
        }
    } catch (e) { /* Server nicht sichtbar -> nicht bereit */ }
    return null;
}

export async function main(ns) {
    ns.disableLog("ALL");
    try {
        const self = ns.getScriptName();
        if (ns.ps(ns.getHostname()).filter(p => p.filename === self).length > 1) {
            ns.print("BITNODE: laeuft bereits — beende."); return;
        }
    } catch (e) { /* weiter */ }

    if (typeof ns.singularity?.destroyW0r1dD43m0n !== "function"
        && typeof ns.singularity?.b1tflum3 !== "function") {
        ns.tprint("WARN  [BITNODE] weder destroyW0r1dD43m0n noch b1tflum3 (kein SF4) — Daemon beendet sich.");
        return;
    }

    ns.print("BITNODE: scharf. Wartet auf Freigabe + Engine-Bedingung.");
    let letzteMeldung = "";

    while (true) {
        const weg = planFreigabe(ns);                         // Huerde 1
        const ziel = zielNode(ns);                            // Huerde 2
        const hatCb = ns.fileExists(CALLBACK, "home");        // Huerde 3
        // ==================================================================
        // v1.1 — ZWEITER WEG HINAUS: "flume" (der Pruefplatz)
        // ==================================================================
        // Huerde 4 gilt nur fuer den ECHTEN Ausgang. "flume" ist kein Sieg,
        // sondern ein Seitenausgang: Singularity.ts:1139 prueft bei b1tflum3
        // NUR SF4 und eine gueltige BitNode-Nummer — kein Weltdaemon, keine
        // BlackOps, kein Besitz von b1t_flum3.exe. engineBereit() waere hier
        // also keine Sicherung, sondern eine Sperre gegen etwas, das gar nicht
        // gesperrt ist.
        //
        // WAS ES KOSTET, STEHT IN RedPill.tsx:66 — dort steht
        //     if (!isFlume) giveSourceFile(destroyedBitNode);
        // Flumen heisst also wechseln OHNE Source-File. Der
        // laufende Durchlauf ist weg, der Fortschritt zaehlt fuer nichts.
        //
        // WOFUER ES TROTZDEM DA IST: als PRUEFPLATZ. BN3 gruendet die Corp mit
        // Saatgeld gratis (Corporation/helpers.ts:71) und hat Softcap 1.0 —
        // dort laesst sich CORP.js gegen eine echte Corp entwickeln und danach
        // wieder heraus, ohne die REIHENFOLGE dauerhaft zu verlassen.
        //
        // DIE SICHERUNG BLEIBT DIESELBE, und das ist der Grund, warum hier
        // kein zweites Werkzeug steht: BEENDEN + GILT-FUER-NODE + ZIEL-NODE aus
        // schwarm-plan.txt, von Hand gesetzt und mit deploy.py eingespielt.
        // GILT-FUER-NODE macht die Freigabe nach dem Wechsel von selbst
        // wirkungslos — eine vergessene Zeile kann also nicht zweimal zuschlagen.
        const flume = (weg === "flume");
        const grund = flume
            ? "flume: Seitenausgang, kein Source-File"
            : (weg ? engineBereit(ns) : null);                // Huerde 4

        if (weg && ziel && hatCb && grund) {
            const satz = __SCHWARM_BT__BITNODE: beende diesen Durchlauf (__SCHWARM_DC__weg}, __SCHWARM_DC__grund}) und gehe nach BN__SCHWARM_DC__ziel}.__SCHWARM_BT__;
            ns.tprint("WARN  [BITNODE] " + satz);
            try { announce(ns, "aktion", satz); } catch (e) { /* Meldung ist Beiwerk */ }
            await ns.sleep(1500);          // damit die Zeile noch im Log landet
            if (flume) ns.singularity.b1tflum3(ziel, CALLBACK);
            else ns.singularity.destroyW0r1dD43m0n(ziel, CALLBACK);
            return;                        // ab hier existiert dieser Lauf nicht mehr
        }

        // Nur bei ECHTER Aenderung ins Log — sonst eine Zeile alle 5 s.
        const fehlt = !weg ? "keine frische Freigabe"
            : !ziel ? "ZIEL-NODE fehlt oder ist unplausibel"
            : !hatCb ? (CALLBACK + " fehlt auf home")
            : "Engine-Bedingung noch nicht erfuellt";
        if (fehlt !== letzteMeldung) { ns.print("BITNODE wartet: " + fehlt); letzteMeldung = fehlt; }
        await ns.sleep(TAKT_MS);
    }
}`;
const SRC_RESET = `/**
 * SCHWARM-RESET.js — v1.0  (Aug-Install als One-Shot)
 *
 * Letztes Glied des Reset-Zyklus:
 *   BANK zaehlt gekaufte-nicht-installierte Augs  -> Port 19 (RESET_READY)
 *   QUEEN pausiert (PRE_RESET) und startet diesen One-Shot
 *   RESET ruft installAugmentations("SCHWARM-GENESIS.js")
 *   -> Engine toetet ALLE Skripte und startet GENESIS neu -> Kette laeuft an
 *
 * WARUM EIN EIGENES SKRIPT und nicht Code in der Queen: installAugmentations
 * beendet das aufrufende Skript ("This will cause this script to be killed",
 * Singularity.ts:208). Die Queen wuerde also ihr eigenes Grab schaufeln, und ein
 * Fehlschlag mitten im Aufruf wuerde sie mitnehmen. Als One-Shot ist der Aufruf
 * isoliert: schlaegt er fehl, laeuft der Schwarm unbeschaedigt weiter.
 *
 * CALLBACK (verifiziert, Singularity.ts:59-75): runAfterReset startet das
 * Callback-Skript auf home mit KEINEN Argumenten und 1 Thread und prueft vorher
 * das freie RAM. Reicht es nicht, gibt die Engine einen Terminal-Fehler aus und
 * startet NICHTS — deshalb prueft dieses Skript den Platz VORHER selbst und
 * bricht lieber ab, als einen Reset ohne Neustart auszuloesen.
 *
 * SICHERUNGEN (in dieser Reihenfolge):
 *   1. Doppelstart-Schutz.
 *   2. Grafting laeuft?          -> Abbruch. Ein Install wuerde die Arbeit verwerfen.
 *   3. Callback-Skript auf home? -> Abbruch, sonst startet nach dem Reset nichts.
 *   4. Genug RAM auf home?       -> Abbruch (siehe oben).
 *   5. Ueberhaupt Augs in der Warteschlange? -> Abbruch (Engine liefert sonst false).
 *
 * @param {NS} ns
 */
import { readResetReady, announce, setDaemonEnabled } from "SCHWARM-HELPERS.js";

const CALLBACK = "SCHWARM-GENESIS.js";

export async function main(ns) {
    ns.disableLog("ALL");

    // 1. Doppelstart-Schutz — zwei parallele Installs waeren nicht wiederherstellbar.
    try {
        const self = ns.getScriptName();
        if (ns.ps(ns.getHostname()).filter(p => p.filename === self).length > 1) {
            ns.print("RESET: laeuft bereits — beende.");
            return;
        }
    } catch (e) { /* weiter */ }

    // 1b. SCHALTER ZURUECKSETZEN (v0.5). Der Dashboard-Knopf loest One-Shots mit
    // FORCE aus (state=2), weil ein START fuer RESET wirkungslos waere: shouldRun()
    // in der Queen verlangt dort zusaetzlich ein WANT, das nur handleResetCycle
    // setzt. state=2 bliebe aber stehen — nach dem Neustart durch GENESIS wuerde
    // die Queen sofort einen ZWEITEN Install ausloesen. Deshalb hier aufraeumen.
    // WICHTIG: auf 1, nicht auf 0. RESET hat kein defaultOff, 1 ist der
    // Registry-Default; eine 0 wuerde den AUTOMATISCHEN Zyklus ueber Port 19
    // dauerhaft blockieren (isDaemonEnabled schluege dann immer fehl).
    try { setDaemonEnabled(ns, "RESET", 1); } catch (e) { /* weiter */ }

    // Auftrag der Queen gegenlesen. Fehlt er, wurde manuell gestartet: dann NICHT
    // installieren — ein Reset ist die folgenreichste Aktion im ganzen Schwarm.
    const order = readResetReady(ns);
    if (!order) {
        ns.tprint("WARN  [RESET] Kein Auftrag auf Port 19 — es wird nichts installiert. "
            + "Den Auftrag setzt BANK, sobald die Aug-Runde durch ist (checkResetReady). "
            + "Der Dashboard-Knopf ist ein Ausloeser, kein Override.");
        return;
    }

    // 2. Grafting darf nicht verworfen werden (BANK prueft das auch, hier doppelt:
    //    zwischen BANKs Meldung und diesem Start liegen Sekunden).
    let work = null;
    try { work = ns.singularity.getCurrentWork(); } catch (e) { /* ohne SF4 kein Reset */ }
    if (work && work.type === "GRAFTING") {
        ns.tprint("WARN  [RESET] Grafting laeuft — Install verschoben.");
        return;
    }

    // 3. Callback-Skript muss auf home liegen, sonst startet nach dem Reset nichts.
    if (!ns.fileExists(CALLBACK, "home")) {
        ns.tprint(__SCHWARM_BT__ERROR [RESET] __SCHWARM_DC__CALLBACK} fehlt auf home — Install ABGEBROCHEN.__SCHWARM_BT__);
        announce(ns, "error", __SCHWARM_BT__Reset abgebrochen: __SCHWARM_DC__CALLBACK} fehlt auf home.__SCHWARM_BT__);
        return;
    }

    // 4. RAM-Vorpruefung. runAfterReset bricht still ab, wenn der Platz fehlt —
    //    dann waere der Reset passiert, aber nichts wuerde wieder anlaufen.
    //    Nach dem Install ist home leer (alle Skripte sind tot), es zaehlt also die
    //    MAXIMALE Groesse, nicht die momentan freie.
    let needGb = 0, homeMax = 0;
    try { needGb = ns.getScriptRam(CALLBACK, "home"); } catch (e) { needGb = 0; }
    try { homeMax = ns.getServerMaxRam("home"); } catch (e) { homeMax = 0; }
    if (!(needGb > 0)) {
        ns.tprint(__SCHWARM_BT__ERROR [RESET] RAM-Bedarf von __SCHWARM_DC__CALLBACK} nicht bestimmbar — ABGEBROCHEN.__SCHWARM_BT__);
        return;
    }
    if (homeMax < needGb) {
        ns.tprint(__SCHWARM_BT__ERROR [RESET] home hat __SCHWARM_DC__homeMax} GB, __SCHWARM_DC__CALLBACK} braucht __SCHWARM_DC__needGb} GB — ABGEBROCHEN.__SCHWARM_BT__);
        announce(ns, "error", __SCHWARM_BT__Reset abgebrochen: home zu klein fuer __SCHWARM_DC__CALLBACK}.__SCHWARM_BT__);
        return;
    }

    // 5. Sind ueberhaupt Augs in der Warteschlange? Ohne die liefert
    //    installAugmentations nur false und protokolliert "You do not have any
    //    Augmentations to be installed" (Singularity.ts:203-206).
    let queued = 0;
    try {
        const all = ns.singularity.getOwnedAugmentations(true);
        const inst = ns.singularity.getOwnedAugmentations(false);
        queued = Math.max(0, all.length - inst.length);
    } catch (e) { queued = order.count || 0; }
    if (queued <= 0) {
        ns.tprint("WARN  [RESET] Keine Augs in der Warteschlange — nichts zu installieren.");
        return;
    }

    // --------------------------- AUSFUEHRUNG ---------------------------
    ns.tprint(__SCHWARM_BT__INFO  [RESET] Installiere __SCHWARM_DC__queued} Augmentierung(en). Callback: __SCHWARM_DC__CALLBACK}__SCHWARM_BT__);
    ns.tprint(__SCHWARM_BT__INFO  [RESET] Grund: __SCHWARM_DC__order.why || "—"}__SCHWARM_BT__);
    try { announce(ns, "info", __SCHWARM_BT__Aug-Install: __SCHWARM_DC__queued} Stueck, danach __SCHWARM_DC__CALLBACK}__SCHWARM_BT__); } catch (e) { /* egal */ }
    await ns.sleep(200);        // der Meldung Zeit geben, sichtbar zu werden

    try {
        // Ab hier ist dieses Skript tot — der Rueckgabewert kommt praktisch nie an.
        ns.singularity.installAugmentations(CALLBACK);
    } catch (e) {
        ns.tprint(__SCHWARM_BT__ERROR [RESET] Install fehlgeschlagen: __SCHWARM_DC__String(e).slice(0, 200)}__SCHWARM_BT__);
        announce(ns, "error", "Aug-Install fehlgeschlagen — Schwarm laeuft weiter.");
        return;
    }
    // Nicht erreichbar, wenn der Install geklappt hat.
    ns.print("RESET: installAugmentations kehrte zurueck — vermutlich nichts installiert.");
}
`;

const SRC_AUGS = `/**
 * SCHWARM-AUGS.js — v1.1 (dummer Aug-Käufer, One-Shot)
 *
 * v1.1 — JEDER KAUFVERSUCH STEHT IM HANDLUNGSBUCH, mit exaktem Betrag
 *   (Geldstand vor/nach dem synchronen purchaseAugmentation, Topf
 *   augmentations). Bis v1.0 stand ein Aug-Kauf nirgends; DIAG musste aus
 *   Prozess-Stichproben raten, ob AUGS lief - und meldete Fehlalarme.
 *
 * ROLLE NACH DER VEREINHEITLICHUNG: AUGS scannt und entscheidet NICHTS mehr.
 * Die gesamte Auswahl (welches Aug, welche Faktion, ob Geld reicht) trifft BANK
 * — sie kennt das Geld und liest Katalog/Preise/Ruf aus dem INFO-Snapshot. BANK
 * legt EIN Ziel auf Port 18 (AUG_BUY) ab und lässt diesen One-Shot starten
 * (WANT an die Queen). AUGS liest das Ziel, kauft es, beendet sich.
 *
 * Damit sind ALLE früheren Aufgaben entfallen und liegen woanders:
 *   - Aug-/Ruf-/Besitz-Scan      -> INFO (augs- + rep-Block, 0 GB für Leser)
 *   - Auswahl (billigstes erst)  -> BANK (pickCheapestAug)
 *   - Rep-Ziel an WORK melden     -> BANK (hat jetzt die Auswahl-Daten)
 *   - NFG                         -> BANK entscheidet, schickt es als normales
 *                                    Ziel {faction, aug:"NeuroFlux Governor"}
 *
 * AUGS kennt NeuroFlux gar nicht als Sonderfall: es kauft stumpf, was auf dem
 * Port steht. Ein Ziel = ein Kauf = ein Lauf. Die Queen startet den One-Shot im
 * BANK-Intervall erneut, solange BANK ein Ziel meldet.
 *
 * RAM: nur purchaseAugmentation (SF4). Bei SF4>=3 sind das 5 GB, bei SF4 L1
 * 80 GB — der Aufrufer (Queen/Dispatcher) sucht ohnehin einen Host mit Platz.
 *
 * @param {NS} ns
 */
import { readAugBuy, formatMoney, announce, chronik } from "SCHWARM-HELPERS.js";

export async function main(ns) {
    ns.disableLog("ALL");

    // Doppelstart-Schutz (One-Shots sollen sich nie überlappen).
    try {
        const self = ns.getScriptName();
        if (ns.ps(ns.getHostname()).filter(p => p.filename === self).length > 1) return;
    } catch (e) { /* weiter */ }

    // 1. Ziel von BANK lesen (Port 18). Kein Ziel -> nichts zu tun.
    const order = readAugBuy(ns);
    if (!order) {
        ns.print("AUGS: kein Kaufziel auf Port 18 — beende.");
        return;
    }
    const { faction, aug } = order;

    // 2. Kaufen. purchaseAugmentation prüft selbst Ruf, Geld und Prereqs und
    //    gibt bei Fehlschlag false zurück (kein Wurf) — wir fangen trotzdem ab.
    let ok = false, err = "";
    let geldVor = 0;
    try { geldVor = ns.getServerMoneyAvailable("home"); } catch (e) { geldVor = 0; }
    try {
        ok = ns.singularity.purchaseAugmentation(faction, aug);
    } catch (e) { err = String(e); }
    // v1.1: exakter Betrag - der Kauf ist synchron, dazwischen bewegt sich
    // kein anderes Geld. Topf wie in getMoneySources.
    let kosten = 0;
    try { kosten = Math.max(0, geldVor - ns.getServerMoneyAvailable("home")); } catch (e) { kosten = 0; }
    try {
        chronik(ns, "AUGS", "aug", aug + " @ " + faction, ok === true ? "gekauft" : "fehlgeschlagen",
            ok === true ? formatMoney(kosten) : (err ? err.slice(0, 80) : "purchaseAugmentation = false"),
            { betrag: ok === true ? kosten : 0, topf: "augmentations" });
    } catch (e) { /* darf nie stoeren */ }

    if (ok === true) {
        ns.print(__SCHWARM_BT__AUGS: gekauft — __SCHWARM_DC__aug} @ __SCHWARM_DC__faction}.__SCHWARM_BT__);
        try { announce(ns, "info", __SCHWARM_BT__Aug gekauft: __SCHWARM_DC__aug} @ __SCHWARM_DC__faction}__SCHWARM_BT__); } catch (e) { /* egal */ }
    } else {
        ns.print(__SCHWARM_BT__AUGS: Kauf fehlgeschlagen — __SCHWARM_DC__aug} @ __SCHWARM_DC__faction}__SCHWARM_BT__ + (err ? __SCHWARM_BT__ (__SCHWARM_DC__err.slice(0, 100)})__SCHWARM_BT__ : "") +
                 ". BANK meldet beim nächsten Lauf erneut.");
    }
    // One-Shot: beendet sich. BANK/Queen starten neu, solange ein Ziel gemeldet wird.
}
`;

// ============================================================================
// STANEK - Stanek's Gift: annehmen, Gitter optimal belegen, aufladen     [v2.0]
// ============================================================================
// Waehlt die Fragmente nach den BitNode-Multiplikatoren aus, fuellt die Luecken
// mit Verstaerkern und laedt ueber einen EIGENEN Prozess mit voller Threadzahl:
// die Ladungsstaerke haengt an der Threadzahl des LADENDEN Prozesses, und ein
// Daemon laeuft mit einem Thread. Backtick-/${-frei -> decodePayload ist No-Op.
const SRC_STANEK = `/**
 * SCHWARM-STANEK.js — v2.6
 *
 * v2.6 — DER LADEHOST WAR VON AUSSEN NICHT PRUEFBAR. Zustand, Ladehost und
 *   Threadzahl standen nur auf Port 25. Die Remote-API des Spiels liefert aber
 *   Dateien (getFile), keine Ports - also brauchte jede Nachschau von aussen
 *   einen vollen DIAG-Lauf. publish() schreibt denselben Bericht jetzt
 *   zusaetzlich in schwarm-stanek.txt und ergaenzt dort die Layoutfelder
 *   (score, quelle, gitter), statt sie zu ueberschreiben.
 *
 * SCHWARM-STANEK.js — v2.5
 *
 * v2.5 — DIE LADUNG HING AN EINEM ZUFALLSZEITPUNKT.
 *
 * Gemessen am 04.09. im Bericht von 04:14:
 *     03:53:04  STANEK gestartet auf home     WORKER Threads 0 -> 200
 *     03:53:54  WORKER Threads 200 -> 13561   Pool frei 2.6T / 26.0T
 * STANEK waehlte seinen Ladehost, als der Schwarm 199 GB frei hatte, und nahm
 * home mit 295 Threads. Fuenfzig Sekunden spaeter standen 26 TB bereit — aber
 * die Threadzahl steht ab dem Laderstart fest (StaneksGift.charge skaliert
 * numCharge sonst nach unten), also blieb der ganze Durchlauf auf 295.
 *
 * Wirkung, an beiden Berichten nachgerechnet (Hack-Beute, Power 2, BN14):
 *     Threadstaerke 6144, Ladung  84.6  ->  +19.5 %
 *     Threadstaerke  295, Ladung 150.0  ->  +12.0 %
 * Die volle Ladung gleicht die schwache Threadstaerke nicht aus: in der
 * Effektformel steht highestCharge im Logarithmus, numCharge dagegen nur mit
 * Exponent 0.07.
 *
 * ZWEI URSACHEN, beide in pickHost:
 *   1. "exklusiv" galt nur fuer hacknet-server-*. Der Dispatcher raeumt aber
 *      jeden Fremdhost (v11.8). Gekaufte Server bekamen deshalb die geteilten
 *      Grenzen, obwohl sie voellig frei geraeumt werden.
 *   2. Gerechnet wurde mit free. Auf einem Host, der geraeumt WIRD, ist maxRam
 *      die richtige Bezugsgroesse.
 *
 * home bleibt auf free — dort raeumt der Dispatcher nicht, weil die anderen
 * Daemons dort wohnen. Die Kerne bleiben unveraendert im Faktor
 * (1 + (cores-1)/16); diese Aenderung betrifft nur die RAM-Haelfte.
 *
 * Neu ist der Zustand "raeumt" auf Port 25: der gewaehlte Fremdhost ist im
 * Moment der Wahl noch voll, und der Dispatcher raeumt erst, wenn er ihn
 * sieht. Ohne die Vorabmeldung entstuende eine Verklemmung (Lader kommt nicht
 * hinein -> "fehler" -> Dispatcher raeumt nicht). Braucht SCHWARM-DISPATCHER
 * ab v11.9.
 *
 * ===========================================================================
 * WAS DAS SKRIPT IST
 * ===========================================================================
 * Ein Lauf nach jedem Prestige: Geschenk annehmen, Gitter optimal belegen,
 * Fragmente mit voller Threadzahl aufladen, beenden.
 *
 * WICHTIG: die LADUNG ueberlebt keinen Aug-Reset. PlayerObjectGeneralMethods
 * ruft prestigeAugmentation -> staneksGift.prestigeAugmentation -> clearCharge.
 * Die FRAGMENTE bleiben liegen, ihre Ladung faellt auf 0. Deshalb muss dieses
 * Skript nach JEDEM Reset noch einmal laufen — nicht nur beim BitNode-Start.
 *
 * ===========================================================================
 * WAS AN v1.0 FALSCH WAR  (aus dem laufenden Spiel nachgerechnet)
 * ===========================================================================
 * v1.0 hat die Threadzahl aus dem freien RAM berechnet, ausgegeben — und dann
 * nie benutzt. Geladen hat der Daemon selbst, und der laeuft mit 1 Thread.
 * Die Engine nimmt aber genau dessen Threadzahl:
 *
 *     NetscriptFunctions/Stanek.ts:
 *     staneksGift.charge(fragment, ctx.workerScript.scriptRef.threads * coreBonus)
 *
 * Damit blieb highestCharge auf 1 stehen — dem kleinstmoeglichen Wert. In der
 * Effektformel steht highestCharge im Logarithmus:
 *
 *     CotMG/formulas/effect.ts:
 *     1 + (ln(highestCharge+1)/60) * ((numCharge+1)/5)^0.07 * power * boost * BNmult
 *
 * ln(2)/60 = 0.0116 gegen ln(513)/60 = 0.1040 bei 512 Threads: Faktor 9.
 * Gegenprobe an einem echten Spielstand (BN13.1, BNmult 2, numCharge 74):
 * die Formel liefert fuer das Hacking-Fragment +2.79 % — exakt das, was im
 * Spiel stand. Der Fehler war also nicht "etwas schwach", sondern "auf dem
 * absoluten Minimum".
 *
 * Zweiter Fehler: BOOSTER wurden nie gesetzt. v1.0 hat erst alle Stat-Fragmente
 * greedy von links oben verteilt; danach war keine 3x3- oder 2x4-Flaeche mehr
 * frei, in die ein Booster (5 Felder) gepasst haette. Booster sind aber der
 * billigste Multiplikator im ganzen Spiel:
 *
 *     CotMG/StaneksGift.ts, effect():
 *     neighbors.filter(type === Booster); for (b of neighbors) boost *= b.power
 *
 * Jeder ANGRENZENDE Booster multipliziert die Kraft mit 1.1, und er braucht
 * dafuer selbst KEINE Ladung. Zwei Booster an einem Fragment sind 1.21x.
 *
 * ===========================================================================
 * WARUM WENIGE FRAGMENTE BESSER SIND — UND WARUM NICHT AUS DEM GRUND,
 * DEN MAN ZUERST VERMUTET
 * ===========================================================================
 * Die naheliegende Vermutung lautet: viele Fragmente teilen sich die Ladung,
 * also lieber wenige stark laden. Das stimmt so NICHT. Jedes Fragment hat
 * seinen eigenen numCharge, und numCharge steht mit Exponent 0.07 in der
 * Formel. Von 6 auf 2 Fragmente zu gehen verdreifacht numCharge je Fragment
 * und bringt dadurch 3^0.07 = 1.08 — acht Prozent. Das allein waere den
 * Verzicht auf vier Fragmente nie wert.
 *
 * Der echte Grund ist der PLATZ. Das Gitter hat in BN13.1 genau 30 Felder
 * (6x5); erst ab BN13.2 sind es 36 (6x6). Ein Stat-Fragment kostet 4 Felder,
 * ein Booster 5. Ein Geschick-Fragment mit Gewicht ~5 belegt also vier
 * Felder, die einem Booster fehlen, der neben zwei Hacking-Fragmenten +28 und
 * mehr bringt. Fragmente wegzulassen lohnt sich, weil dadurch Booster
 * hineinpassen — nicht wegen der Ladung.
 *
 * Deshalb waehlt dieses Skript nicht "die besten K Fragmente", sondern
 * rechnet fuer JEDES K von 1 bis maximal moeglich ein vollstaendiges Layout
 * samt Boostern durch und nimmt das mit dem hoechsten Gesamtnutzen. Wo kein
 * Booster mehr hineinpasst, bleibt auch ein schwaches Fragment drin — es
 * kostet dann ja nichts mehr.
 *
 * ===========================================================================
 * WAS AN v2.0 FALSCH WAR  (aus dem laufenden Spiel nachgestellt)
 * ===========================================================================
 * Die Threadzahl war repariert — im Spiel stieg der Hacking-Effekt von
 * +2.79 % auf +25.9 %, genau wie vorausgerechnet. Zwei andere Dinge waren es
 * nicht:
 *
 * 1. KEINE MULTIPLIKATOREN AUF DEM LAUF, DER ZAEHLT. Die BitNode-
 *    Multiplikatoren kamen ausschliesslich vom INFO-Daemon ueber Port 9.
 *    STANEK wird aber von ARSENAL angefordert, BEVOR die Queen und damit INFO
 *    laufen. Auf dem einen Lauf, der das Gitter anlegt, war der Port also
 *    leer. Ohne die Knappheit dieser BitNode (BN13: HackExpGain 0.1) faellt
 *    Hacking-Skill von Nutzen 285 auf 95 und rutscht hinter Hack-Beute;
 *    Arbeitslohn (Power 10) und Hacknet-Kosten steigen auf. Nachgestellt:
 *    ohne Multiplikatoren liefert der Optimierer exakt die sieben Fragmente,
 *    die im Spiel lagen — Arbeitslohn, Hack-Beute, Hacknet-Kosten,
 *    Hack-Tempo, zweimal Hacking-Skill, Ruf. Kein Suchfehler, eine fehlende
 *    Eingabe. Deshalb fragt das Skript jetzt notfalls selbst (4 GB, SF5).
 *
 * 2. DIE UMBELEGUNGSSCHWELLE HAT DEN FEHLER FESTGEHALTEN. Mit 1.10 blieb das
 *    Fehl-Layout liegen: es erreichte 902 von 951 moeglichen Punkten, also
 *    1.054 — knapp unter der Schwelle. Der Fehler konnte sich nicht selbst
 *    heilen. Jetzt 1.04.
 *
 * Dazu kam ein Fehler ausserhalb dieses Skripts, der es aber traf: die Queen
 * startete den One-Shot alle 12 Sekunden neu (siehe Selbst-Aus in main()).
 *
 * ===========================================================================
 * DAS ZEITFENSTER
 * ===========================================================================
 * Engine (CotMG/Helper.tsx, canAcceptStaneksGift):
 *
 *     if ([...Player.augmentations, ...Player.queuedAugmentations]
 *         .filter(a => a.name !== NeuroFluxGovernor).length !== 0)
 *       return { success:false, ... };
 *
 * JEDE Augmentierung ausser NeuroFlux sperrt das ANNEHMEN — fuer die GANZE
 * BitNode, nicht nur bis zum naechsten Reset:
 *
 *     prestigeAugmentation():   queuedAugmentations = []   augmentations BLEIBT
 *     prestigeSourceFile():     augmentations = []         erst hier ist es weg
 *
 * Ein Aug-Reset oeffnet das Fenster also NICHT wieder. Reihenfolge deshalb:
 * BITNODE-START -> GENESIS -> STANEK -> alles andere.
 * Ist das Geschenk einmal angenommen, gilt die Sperre nicht mehr: dieses
 * Skript darf und muss danach nach jedem Reset erneut laufen (siehe oben).
 *
 * ===========================================================================
 * BONUSZEIT UND CORES
 * ===========================================================================
 * StaneksGift.inBonus() ist wahr, sobald 5 Cycles aufgestaut sind; dann dauert
 * eine Ladung 200 ms statt 1000 ms. Die Engine nutzt den Puffer von selbst.
 * Die Cores des LAUF-HOSTS gehen multiplikativ ein:
 * getCoreBonus(cores) = 1 + (cores-1)/16. Deshalb wird home bei der Hostwahl
 * bevorzugt, aber ein deutlich groesserer Server schlaegt die Cores.
 *
 * ===========================================================================
 * DRITTER ERTRAG: FAKTIONS-RUF
 * ===========================================================================
 *     cotmg.playerReputation += (faction_rep * (threads^0.95 * (favor+100))) / 1000
 * Auch hier steht die Threadzahl — mit Exponent 0.95, also fast linear. Mit
 * 1 Thread waren das 0.1 Ruf je Ladung, mit 512 Threads sind es rund 38.
 * Das ist der einzige Weg zu "Stanek's Gift - Awakening" und "- Serenity".
 *
 * @param {NS} ns
 */

import { setDaemonEnabled } from "SCHWARM-HELPERS.js";

/*__PORTS__*/

// ===========================================================================
// TYPEN UND BEWERTUNG
// ===========================================================================
//
// Die Typnummern stammen aus CotMG/FragmentType.ts und sind stabil; die
// Fragment-LISTE selbst wird zur Laufzeit ueber fragmentDefinitions() geholt.
// Bewusst KEINE fest verdrahteten Layout-Tabellen: die veralten mit jedem
// Balance-Patch, und die Gittergroesse haengt an BitNode und SF-Level.
//
//     baseSize = 9 + StaneksGiftExtraSize + SF13-Level
//     width    = max(2, min(floor(baseSize/2 + 1.0), 25))
//     height   = max(3, min(floor(baseSize/2 + 0.6), 25))
//
// ACHTUNG: die Spielanzeige "BN13.1" ist NICHT das SF13-Level, sondern
// SF13-Level + 1. Das Source-File wird erst beim Zerstoeren der BitNode
// vergeben, der ERSTE Durchlauf heisst also 13.1 und hat SF13-Level 0.
// (Gegenprobe in der Engine: getBitNodeMultipliers benutzt als Vorgabewert
//  activeSourceFileLvl(bitNodeN) + 1.)
//
//   BN13.1  SF13 0  -> baseSize 10 -> 6x5 = 30 Felder   <- Erstdurchlauf
//   BN13.2  SF13 1  -> baseSize 11 -> 6x6 = 36 Felder
//   BN13.3  SF13 2  -> baseSize 12 -> 7x6 = 42 Felder
//
// BN8 -> ExtraSize -99 -> 2x3 = 6 Felder, dort passt genau EIN Fragment und
// kein einziger Booster. Beides faellt hier automatisch heraus, weil W und H
// zur Laufzeit gelesen werden und nirgends eine feste Feldzahl steht.
const FT = {
    HackingSpeed: 3, HackingMoney: 4, HackingGrow: 5, Hacking: 6,
    Strength: 7, Defense: 8, Dexterity: 9, Agility: 10, Charisma: 11,
    HacknetMoney: 12, HacknetCost: 13, Rep: 14, WorkMoney: 15,
    Crime: 16, Bladeburner: 17, Booster: 18,
};

const TYPE_NAME = {
    3: "Hack-Tempo", 4: "Hack-Beute", 5: "Grow-Kraft", 6: "Hacking-Skill",
    7: "Staerke", 8: "Verteidigung", 9: "Geschick", 10: "Beweglichkeit",
    11: "Charisma", 12: "Hacknet-Ertrag", 13: "Hacknet-Kosten", 14: "Ruf",
    15: "Arbeitslohn", 16: "Verbrechen", 17: "Bladeburner", 18: "Verstaerker",
};

// Grundnutzen je Prozentpunkt Effekt, ohne BitNode-Wissen.
//
// Die Zahlen sind bewusst gespreizt, denn sie konkurrieren gegen Booster:
// ein Booster neben einem Fragment mit Nutzen N bringt 0.1 * N. Ein Fragment
// muss also mehr als ein Zehntel des Nutzens seiner Nachbarn wert sein, um
// seine vier Felder zu rechtfertigen. Genau deshalb stehen Kampfstats und
// Arbeitslohn hier so tief: sie halten diesem Vergleich nicht stand.
//
// Der Gesamtnutzen eines Fragments ist GEWICHT * POWER. Power steht in der
// Engine (Fragment.ts) und geht direkt in die Effektformel ein:
//   Hacking 1.0 | HackingSpeed 1.3 | HackingMoney 2.0 | HackingGrow 0.5
//   Rep 0.5 | WorkMoney 10 | Crime 2 | Charisma 3 | Bladeburner 0.4
//   Kampfstats 2 | HacknetMoney 1 | HacknetCost 2
// WorkMoney hat Power 10 und wuerde mit hohem Gewicht alles verdraengen —
// deshalb steht sein Gewicht bei 5: Lohn aus Jobs ist neben Hack- und
// Boersenertrag im laufenden Schwarm Kleingeld.
const BASE_WEIGHT = {
    [FT.Rep]:          100,
    [FT.Hacking]:       95,
    [FT.HackingSpeed]:  70,
    [FT.HackingMoney]:  60,
    [FT.Bladeburner]:   55,
    [FT.HackingGrow]:   45,
    [FT.HacknetMoney]:  40,
    [FT.HacknetCost]:   22,
    [FT.Crime]:         15,
    [FT.Charisma]:      12,
    [FT.Dexterity]:      6,
    [FT.Agility]:        6,
    [FT.Strength]:       5,
    [FT.Defense]:        5,
    // =========================================================================
    // v2.3 — WorkMoney AUF 0: DAS FRAGMENT WAR VIERTBESTER, OBWOHL ES NICHTS BRINGT
    // =========================================================================
    // Bewertet wird GEWICHT x POWER (siehe unten bei scoreByType), und WorkMoney
    // hat mit Abstand die hoechste Power im Spiel: 10, gegen 3 beim naechsten
    // (Charisma) und 2 bei fast allen uebrigen (Fragment.ts). Selbst mit dem
    // niedrigen Gewicht 5 kam es damit auf 50 und lag gleichauf mit Rep:
    //
    //     HackingMoney  60 x 2    = 120
    //     Hacking       95 x 1    =  95
    //     HackingSpeed  70 x 1.3  =  91
    //     WorkMoney      5 x 10   =  50   <-- landete deshalb im Gitter
    //     Rep          100 x 0.5  =  50
    //     HacknetCost   22 x 2    =  44
    //     ...
    //
    // Im Gitter stand es folglich mit +57,9 % — und zahlte nichts, weil der
    // Spieler ueber Hacking und Crime verdient, nicht ueber Firmengehalt. Die
    // 26 gehaltenen "IT Intern"-Stellen bringen neben dem Hack-Einkommen nichts.
    //
    // 0 statt einer kleinen Zahl, weil scoreByType bei sc <= 0 den Kandidaten
    // ganz verwirft (siehe "if (sc <= 0) continue"). Damit ist das Fragment
    // nicht bloss unwahrscheinlich, sondern ausgeschlossen — und der frei
    // gewordene Platz geht an das naechstbeste, das hineinpasst.
    //
    // NEBENWIRKUNG, erwuenscht: scoreExisting bewertet das BESTEHENDE Gitter mit
    // denselben Gewichten. Es verliert dadurch 50 Punkte, und ein neuer Plan
    // ueberspringt die Umbau-Schwelle leichter. Genau deshalb bleibt das alte
    // Gitter jetzt nicht weiter liegen.
    [FT.WorkMoney]:      0,
};

// Welcher BitNode-Multiplikator entscheidet, ob ein Fragment ueberhaupt etwas
// wert ist? Steht er auf 0, faellt das Fragment ganz heraus.
//
//   BN8   HacknetNodeMoney 0     -> Hacknet-Fragmente wertlos
//         ScriptHackMoneyGain 0  -> Hack-Beute wertlos (hack() zahlt nicht aus)
//         BladeburnerRank 0      -> Bladeburner UND Kampfstats wertlos
//         CompanyWorkMoney 0     -> Arbeitslohn wertlos
//         CrimeMoney 0           -> Verbrechen wertlos
//   BN13  alle > 0, aber gedaempft -> alle bleiben, mit kleinerem Gewicht
//
// Hack-TEMPO und Grow-Kraft haengen bewusst NICHT an ScriptHackMoneyGain:
// in BN8 wird mit grow()/hack() die Boerse manipuliert, nicht Geld geholt —
// dort sind beide weiter bares Geld wert.
const GATE_MULT = {
    [FT.HacknetMoney]: "HacknetNodeMoney",
    [FT.HacknetCost]:  "HacknetNodeMoney",
    [FT.HackingMoney]: "ScriptHackMoneyGain",
    [FT.Bladeburner]:  "BladeburnerRank",
    [FT.Strength]:     "BladeburnerRank",
    [FT.Defense]:      "BladeburnerRank",
    [FT.Dexterity]:    "BladeburnerRank",
    [FT.Agility]:      "BladeburnerRank",
    [FT.Crime]:        "CrimeMoney",
    [FT.WorkMoney]:    "CompanyWorkMoney",
};

// Multiplikatoren, die ein Fragment WERTVOLLER machen, je kleiner sie sind:
// wo Hacking-Erfahrung knapp ist, ist ein Hacking-Fragment mehr wert, nicht
// weniger. BN13 ist der Musterfall (HackExpGain 0.1, FactionWorkRepGain 0.6).
const SCARCITY_MULT = {
    [FT.Hacking]: { mult: "HackExpGain", cap: 3 },
    [FT.Rep]:     { mult: "FactionWorkRepGain", cap: 2 },
};

const CFG = {
    // v2.3: ZWEI SAETZE VON GRENZEN.
    //
    // Auf einem GETEILTEN Host muss Platz fuer andere bleiben — dort gelten die
    // alten Werte (64 GB frei lassen, hoechstens 75 % belegen).
    //
    // Auf einem EXKLUSIVEN Host nicht: der Dispatcher nimmt STANEKs Ladehost
    // seit v11.8 ganz aus der Nutzung und raeumt ihn einmal frei. Dann ist jedes
    // zurueckgehaltene Gigabyte verschenkte Ladestaerke — und die steht im
    // Logarithmus (CotMG/formulas/effect.ts), zaehlt also doppelt.
    // 8 GB bleiben trotzdem stehen: der Lader selbst und ein wenig Luft, damit
    // ein Neustart nicht am letzten Byte scheitert.
    RAM_RESERVE_GB: 64,         // geteilter Host: so viel bleibt frei
    RAM_RESERVE_EXKLUSIV: 8,    // exklusiver Host: nur noch Luft fuer den Lader
    CHARGE_RAM: 2.0,            // Basis 1.6 + chargeFragment 0.4 — der Lader ruft NICHTS sonst
    CHARGE_MAX_FRAC: 0.75,      // geteilter Host: hoechstens so viel
    CHARGE_MAX_FRAC_EXKLUSIV: 0.98,  // exklusiver Host: praktisch alles
    MIN_THREADS: 8,
    MAX_THREADS: 32768,
    // Ein fremder Host muss die Ladung um diesen Faktor verbessern (gemessen
    // an ln(threads+1), nicht an den Threads selbst), sonst bleibt es bei home.
    // Sonst wuerde ein 2 %-Gewinn einen ganzen pserv aus dem Hack-Pool ziehen.
    FREMDHOST_VORTEIL: 1.15,
    // Ziel-Ladung. Der Effekt waechst nur mit numCharge^0.07 — von 150 auf 1000
    // waeren es +14 % bei siebenfacher Laufzeit. Wer stattdessen Ruf bei der
    // Church of the Machine God farmen will (linear in den Ladungen), setzt
    // WEITER_FUER_RUF auf true; dann laeuft der Lader bis zum Kill weiter.
    TARGET_CHARGE: 150,
    WEITER_FUER_RUF: false,
    // v2.3: Der Daemon bleibt nach der Ladung wach und sieht in diesem Takt
    // nach, ob der Pool inzwischen mehr hergibt. 60 s sind reichlich — der Pool
    // waechst ueber Minuten, nicht ueber Sekunden, und ein wacher Daemon kostet
    // nur seine eigenen ~25 GB.
    WATCH_MS: 60_000,
    // Ab diesem Vielfachen der bisherigen Threadstaerke wird nachgeruestet.
    // Bewusst hoch: das Nachladen skaliert numCharge nach unten
    // (numCharge = highestCharge*numCharge/threads + 1), das lohnt erst bei
    // einem deutlichen Sprung. Faktor 3 entspricht rund +40 % Effekt.
    NACHLADE_FAKTOR: 3,
    // Neu belegen nur, wenn das neue Layout mindestens so viel besser ist.
    // Neubelegen kostet die gesamte bisherige Ladung.
    // Neu belegen nur, wenn das neue Layout mindestens so viel besser ist —
    // Neubelegen kostet die gesamte bisherige Ladung.
    //
    // 1.04 statt der urspruenglichen 1.10 (v2.1): mit 1.10 blieb das im Spiel
    // beobachtete Fehl-Layout fuer immer liegen. Es war ohne BitNode-
    // Multiplikatoren entstanden und erreichte 902 von 951 Punkten — 1.054,
    // also unter der Schwelle. Der Fehler konnte sich damit nicht selbst
    // heilen. Ein Rueckkoppeln ist ungefaehrlich, weil optimize() bei
    // gleicher Eingabe dasselbe Layout liefert (feste Zufallssaat): nach
    // einer Umbelegung ist das Verhaeltnis exakt 1.0 und es passiert nichts
    // mehr.
    RELAYOUT_GAIN: 1.04,
    // v2.2: Schwelle fuer eine ABGEBROCHENE Suche. Hoeher als RELAYOUT_GAIN,
    // weil ein Teilergebnis weniger vertrauenswuerdig ist und der Umbau die
    // ganze Ladung kostet — aber endlich, statt wie bisher unerreichbar.
    RELAYOUT_GAIN_TEIL: 1.15,
    // Zufallsneustarts je Fragmentzahl.
    //
    // Ehrlich gemessen im 6x5-Gitter: 24 Neustarts liefern 951 Punkte, 64
    // liefern ebenfalls 951, und erst eine erschoepfende Suche mit 500
    // Neustarts findet 981 — drei Prozent mehr, fuer den zwanzigfachen
    // Rechenaufwand. Die Suche ist eine Heuristik und wird hier bewusst nicht
    // zum Optimum getrieben: sie laeuft im Spiel-Thread, und jede Sekunde
    // Rechnen ist eine Sekunde Ruckeln.
    //
    // =====================================================================
    // v2.4 — 48 WAR AUF DAS FALSCHE GITTER GEEICHT
    // =====================================================================
    // Die Messung oben stammt vom 6x5-Gitter (30 Felder, BN13). Auf dem
    // kleinen 5x4-Gitter (20 Felder, BN10: StaneksGiftExtraSize -3) sieht es
    // voellig anders aus. Erschoepfend nachgerechnet:
    //     48 Neustarts  -> 356 Punkte   (genau das Gitter, das im Spiel liegt)
    //    200 Neustarts  -> 401 Punkte   = das Optimum
    //   1000 Neustarts  -> 401 Punkte   (nichts mehr zu holen)
    // Das sind 12,6 Prozent, die dauerhaft liegen bleiben.
    //
    // URSACHE, und sie ist nicht die Neustartzahl allein: der deterministische
    // Anlauf r = 0 waehlt bei K = 4 mit sorted.slice(0,4) bereits das OPTIMALE
    // Paket (Hack-Beute 120 + Hacking 95 + Hacking 95 + Hack-Tempo 91 = 401).
    // buildLayout laeuft sich damit aber in einer Sackgasse fest und gibt
    // "return null" zurueck (siehe dort) — das beste Paket wird kommentarlos
    // ACHTUNG fuer spaetere Aenderungen: dieser Kommentar steht INNERHALB des
    // Template-Literals SRC_STANEK. Ein Backtick hier beendet das Literal und
    // zerlegt die ganze Datei — genau das ist beim Schreiben dieses Blocks
    // passiert. Backticks im Payload-Text immer als __SCHWARM_BT__ schreiben.
    // verworfen, und 48 Zufallsanlaeufe treffen die passende Reihenfolge nicht
    // mehr. Sauber waere ein Backtracking in buildLayout; das ist der groessere
    // Eingriff. Mehr Anlaeufe sind die kleine Reparatur mit demselben Ergebnis.
    //
    // Die Ruckel-Sorge oben bleibt berechtigt, ist aber bereits abgedeckt:
    // OPT_MS (6 s) ist eine HARTE Zeitbremse, die optimize() unabhaengig von
    // der Neustartzahl abbricht. Im Nachbau lagen 200 Anlaeufe bei 0,2 s.
    //
    // Wirkung im Spiel: das Ruf-Fragment (+7,4 %) weicht einem zweiten
    // Hacking-Fragment. Hacking steigt damit von 1,148 auf 1,148^2 = 1,318,
    // also von +14,8 % auf +31,8 %. Hack-Beute und Hack-Tempo bleiben.
    OPT_RESTARTS: 200,
    // v2.2: 6000 -> 15000. Die Suche wurde in 121 Laeufen kein einziges Mal
    // fertig. STANEK ist ein Einmal-Lauf, der selten startet; 15 s einmalig
    // sind vertretbar, und die Atempausen halten das Bild fluessig.
    OPT_MS: 15000,              // harte Zeitbremse fuer die Suche
    POLL_MS: 2000,
    LADER_FILE: "SCHWARM-STANEK-LADER.js",
    STATE_FILE: "/schwarm-stanek.txt",
};

// Der Ladeprozess als Quelltext. Bewusst als Zeilenliste und ohne jede weitere
// NS-Funktion: jede zusaetzliche Funktion wuerde den RAM je Thread erhoehen und
// damit die Threadzahl senken — und genau daran haengt die Ladungsstaerke.
const LADER_SRC = [
    "/** SCHWARM-STANEK-LADER.js — erzeugt von SCHWARM-STANEK.js, nicht von Hand pflegen.",
    " *",
    " *  Winziger Ladeprozess. RAM je Thread: 1.6 Basis + 0.4 chargeFragment = 2.0 GB.",
    " *  Die Engine laedt mit der Threadzahl GENAU DIESES Prozesses:",
    " *      staneksGift.charge(fragment, ctx.workerScript.scriptRef.threads * coreBonus)",
    " *  Deshalb hier keine Ausgabe, kein Port, kein sleep — jede NS-Funktion mehr",
    " *  kostet Threads und damit Ladung.",
    " *",
    " *  Argumente: x0 y0 x1 y1 ... — die Wurzeln der ladbaren Fragmente.",
    " *  Laeuft endlos im Kreis; SCHWARM-STANEK.js beendet ihn.",
    " *  @param {NS} ns */",
    "export async function main(ns) {",
    "    const a = ns.args;",
    "    const pts = [];",
    "    for (let i = 0; i + 1 < a.length; i += 2) pts.push([Number(a[i]), Number(a[i + 1])]);",
    "    if (pts.length === 0) return;",
    "    for (;;) {",
    "        for (let i = 0; i < pts.length; i++) {",
    "            try { await ns.stanek.chargeFragment(pts[i][0], pts[i][1]); }",
    "            catch (e) { return; }",
    "        }",
    "    }",
    "}",
    "",
].join("\\n");

// ===========================================================================
// AUSGANG / EINGANG
// ===========================================================================

/** Ausgang: Lagebild fuer DIAG (0 GB — peek/clear/tryWrite kosten nichts). */
function publish(ns, obj) {
    const voll = Object.assign({ ts: Date.now() }, obj);
    try {
        const h = ns.getPortHandle(SCHWARM_PORTS.STANEK_OUT);
        h.clear();
        h.tryWrite(JSON.stringify(voll));
    } catch (e) { /* Diagnose darf den Lauf nie stoppen */ }

    // v2.6 — DASSELBE AUCH IN DIE ZUSTANDSDATEI.
    //
    // Port 25 traegt den Ladehost, die Threadzahl und den Zustand. Ports sind
    // aber NUR im Spiel lesbar: die Remote-API des Spiels kennt Dateien
    // (getFile), keine Ports. Damit war von aussen nicht pruefbar, wo STANEK
    // gerade laedt - dafuer brauchte es jedes Mal einen vollen DIAG-Lauf.
    //
    // Deshalb wird derselbe Bericht jetzt zusaetzlich in die Zustandsdatei
    // gespiegelt. Die Layoutfelder (score, quelle, gitter) schreibt writeState
    // beim Planen und bleiben erhalten - hier wird nur ergaenzt, nie ersetzt.
    // ns.read und ns.write kosten 0 GB, der Takt ist POLL_MS.
    try {
        let alt = {};
        try {
            const roh = ns.read(CFG.STATE_FILE);
            if (roh) alt = JSON.parse(roh) || {};
        } catch (e) { alt = {}; }
        ns.write(CFG.STATE_FILE, JSON.stringify(Object.assign(alt, voll)), "w");
    } catch (e) { /* Diagnose darf den Lauf nie stoppen */ }
}

/**
 * BitNode-Multiplikatoren — ZWEI Quellen, in dieser Reihenfolge.
 *
 * Das hier war der teuerste Fehler der Fassung v2.0, und er war unsichtbar:
 * gelesen wurde NUR der INFO-Daemon. STANEK wird aber von ARSENAL angefordert,
 * BEVOR die Queen und damit INFO ueberhaupt laufen. Auf genau dem Lauf, der
 * das Gitter anlegt, war Port 9 also leer, weightOf() fiel auf die
 * Grundgewichte zurueck — und ohne die BN13-Knappheit (HackExpGain 0.1) sinkt
 * Hacking-Skill von 285 auf 95 und rutscht hinter Hack-Beute. Ergebnis war
 * ein Gitter mit Arbeitslohn und Hacknet-Kosten statt Verstaerkern.
 * Nachgestellt und bestaetigt: ohne Multiplikatoren liefert der Optimierer
 * exakt die sieben Fragmente, die im Spiel lagen.
 *
 * Deshalb fragt das Skript jetzt notfalls SELBST. Das kostet 4 GB statisches
 * RAM (getBitNodeMultipliers) und setzt SF5 voraus — beides ist der Preis
 * dafuer, nicht von der Startreihenfolge abzuhaengen.
 *
 * @returns {{mults: object|null, quelle: string}}
 */
function bitNodeMults(ns) {
    // 1. INFO-Port (0 GB) — wenn der Daemon laeuft, ist das die billigste Quelle.
    try {
        const raw = ns.peek(SCHWARM_PORTS.INFO_OUT);
        if (raw && raw !== "NULL PORT DATA") {
            const snap = JSON.parse(raw);
            const bn = snap && snap.blocks && snap.blocks.bn;
            const m = (bn && bn.ok && bn.data) ? bn.data.mults : null;
            if (m && typeof m === "object") return { mults: m, quelle: "INFO" };
        }
    } catch (e) { /* naechste Quelle */ }
    // 2. Selbst fragen (4 GB, braucht SF5).
    try {
        const m = ns.getBitNodeMultipliers();
        if (m && typeof m === "object") return { mults: m, quelle: "direkt" };
    } catch (e) { /* kein SF5 */ }
    return { mults: null, quelle: "keine" };
}

/**
 * Zustandsdatei (0 GB). Sie haelt fest, WOMIT das liegende Gitter gebaut wurde
 * — vor allem, ob dabei BitNode-Multiplikatoren zur Verfuegung standen. Ohne
 * diese Notiz kann ein spaeterer Lauf nicht unterscheiden zwischen "Gitter ist
 * gut" und "Gitter ist blind geraten und muss neu".
 */
function readState(ns) {
    try {
        const raw = ns.read(CFG.STATE_FILE);
        if (!raw) return null;
        const o = JSON.parse(raw);
        return (o && typeof o === "object") ? o : null;
    } catch (e) { return null; }
}

function writeState(ns, obj) {
    try { ns.write(CFG.STATE_FILE, JSON.stringify(obj), "w"); } catch (e) { /* egal */ }
}

/** Fragmentliste fuer die Telemetrie: Name, Kraft, fertiger Effekt, Ladung. */
function fragListe(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
        const f = list[i];
        out.push({
            name: TYPE_NAME[f.type] || ("Typ " + f.type),
            power: f.power,
            effekt: typeof f.chargedEffect === "number" ? +f.chargedEffect.toFixed(4) : null,
            ladung: +(f.numCharge || 0).toFixed(1),
        });
    }
    out.sort(function (a, b) { return (b.effekt || 0) - (a.effekt || 0); });
    return out;
}

/**
 * Gewicht eines Fragments in DIESER BitNode. 0 = nicht setzen.
 *
 * Ohne Multiplikatoren (INFO laeuft nicht, kein SF5) bleibt das Grundgewicht
 * stehen — konservativ: ein faelschlich gesetztes Fragment kostet Platz, ein
 * faelschlich weggelassenes kostet seinen ganzen Effekt fuer den Durchlauf.
 */
/**
 * v2.4 — LAGEABHAENGIGE AUSSCHLUESSE.
 *
 * Bewertet wird GEWICHT x POWER. WorkMoney hat mit Power 10 die hoechste Power
 * im Spiel (naechster ist Charisma mit 3, Fragment.ts) und landete deshalb
 * selbst mit Gewicht 5 auf Platz vier — es stand mit +57,9 % im Gitter und
 * zahlte nichts. Genau daran haengt die ganze Gruppe hier: ein Fragment, das
 * fuer DIESEN Schwarm nichts bringt, muss auf 0, nicht auf "wenig".
 *
 * 0 heisst AUSGESCHLOSSEN, nicht "unwahrscheinlich": scoreByType verwirft den
 * Kandidaten bei sc <= 0 ganz. Und weil scoreExisting mit denselben Gewichten
 * rechnet, verliert ein Gitter mit so einem Fragment sofort an Wert — der
 * Umbau kommt dadurch von selbst zustande.
 *
 * @param {number} type
 * @param {object|null} mults   BitNode-Multiplikatoren (oder null)
 * @param {object|null} lage    { kampfFertig:boolean, pservMoeglich:boolean }
 */
function weightOf(type, mults, lage) {
    const base = BASE_WEIGHT[type];
    if (base === undefined) return 0;

    // ---- Feste Ausschluesse (Vorgabe des Spielers) -------------------------
    // WorkMoney: Firmengehalt ist neben dem Hack-Einkommen bedeutungslos; die
    //   26 gehaltenen "IT Intern"-Stellen bringen praktisch nichts.
    // Crime: "+x% crime money and success chance" (FragmentType.ts). Crime ist
    //   hier Karma-Mittel, keine Einnahmequelle.
    // Bladeburner: "+x% bladeburner stats (max stamina, stamina gain, Field
    //   Analysis, action success chance)" — wirkt nur, wenn Bladeburner laeuft.
    if (type === FT.WorkMoney) return 0;
    if (type === FT.Crime) return 0;
    if (type === FT.Bladeburner) return 0;
    // Charisma: DARKNET treibt den Wert im Betrieb ohnehin hoch — im Lagebild
    // standen cha 840 bis 1500, ohne dass ein Fragment daran beteiligt war.
    // Mit Gewicht 12 x Power 3 = 36 lag es auf Platz acht und haette Plaetze
    // belegt, die den Hack-Fragmenten fehlen.
    if (type === FT.Charisma) return 0;

    // ---- Kampfwerte: NUR bis Bladeburner freigeschaltet ist ----------------
    // Die Division verlangt Staerke, Verteidigung, Geschicklichkeit UND
    // Beweglichkeit jeweils >= 100 (Locations/ui/SpecialLocation.tsx:105).
    // Bis dahin beschleunigen die Fragmente das Hochtrainieren; danach sind sie
    // totes Gewicht, weil der Schwarm nicht ueber Kampfwerte verdient.
    if (type === FT.Strength || type === FT.Defense
        || type === FT.Dexterity || type === FT.Agility) {
        if (!lage || lage.kampfFertig) return 0;
    }

    // ---- Hacknet: nur wenn es die einzige kaufbare RAM-Quelle ist ----------
    // In den meisten BitNodes kauft man normale Server; Hacknet ist dann eine
    // Nebenlinie und die Fragmente lohnen den Platz nicht. Wo gekaufte Server
    // gesperrt sind (CloudServerLimit 0, BitNode.tsx:810), ist Hacknet die
    // einzige Quelle — dort zaehlen sie.
    if (type === FT.HacknetMoney || type === FT.HacknetCost) {
        if (!lage || lage.pservMoeglich) return 0;
    }

    if (!mults) return base;
    let w = base;

    const gate = GATE_MULT[type];
    if (gate && typeof mults[gate] === "number") {
        if (mults[gate] === 0) return 0;
        // Ein gedaempfter, aber nicht toter Multiplikator daempft auch das
        // Fragment — nach unten begrenzt, damit BN13 (0.4) nicht alles killt.
        if (mults[gate] > 0 && mults[gate] < 1) w *= Math.max(0.35, mults[gate]);
    }

    const sc = SCARCITY_MULT[type];
    if (sc && typeof mults[sc.mult] === "number" && mults[sc.mult] > 0) {
        w *= Math.min(sc.cap, 1 / mults[sc.mult]);
    }
    return w;
}

/**
 * Lagebild fuer weightOf: was gilt gerade im Spiel?
 * Beide Abfragen sind billig — getPlayer 0.5 GB, der Rest kommt aus den
 * BitNode-Multiplikatoren, die ohnehin schon gelesen wurden.
 * @param {NS} ns
 * @param {object|null} mults
 */
function lageErmitteln(ns, mults) {
    let kampfFertig = false;
    try {
        const s = ns.getPlayer().skills;
        kampfFertig = (s.strength >= 100 && s.defense >= 100
            && s.dexterity >= 100 && s.agility >= 100);
    } catch (e) { kampfFertig = true; }   // im Zweifel NICHT auf Kampfwerte setzen

    // Gekaufte Server moeglich? Ohne Multiplikatoren wird das angenommen —
    // dann bleiben die Hacknet-Fragmente aussen vor, was der haeufigere Fall ist.
    let pservMoeglich = true;
    try {
        if (mults && typeof mults.CloudServerLimit === "number") {
            pservMoeglich = mults.CloudServerLimit > 0;
        }
    } catch (e) { pservMoeglich = true; }

    return { kampfFertig: kampfFertig, pservMoeglich: pservMoeglich };
}

// ===========================================================================
// GEOMETRIE — exakter Nachbau aus CotMG/Fragment.ts
// ===========================================================================
//
// Hier stand in v1.0 der Kommentar, eine eigene Drehung sei zu gefaehrlich und
// canPlaceFragment muesse alles abtasten. Das war richtig, solange nur GEPRUEFT
// wurde, ob etwas passt. Fuer die Suche nach dem BESTEN Layout reicht das
// nicht: sie muss Tausende Varianten durchrechnen, ohne das Gitter anzufassen.
// Deshalb ist die Geometrie hier 1:1 aus der Engine uebernommen — und jede
// gefundene Platzierung wird VOR dem Setzen trotzdem mit canPlaceFragment
// gegengeprueft. Weicht auch nur eine ab, bricht der Lauf ab statt zu raten.

function fWidth(shape, rot) { return rot % 2 === 0 ? shape[0].length : shape.length; }
function fHeight(shape, rot) { return rot % 2 === 0 ? shape.length : shape[0].length; }

function fullAt(shape, rot, x, y) {
    const w = fWidth(shape, rot), h = fHeight(shape, rot);
    if (y < 0 || y >= h || x < 0 || x >= w) return false;
    let sx = 0, sy = 0, mx = 1, my = 1;
    if (rot === 1) { sx = w - 1; sy = 0; mx = -1; my = 1; }
    else if (rot === 2) { sx = w - 1; sy = h - 1; mx = -1; my = -1; }
    else if (rot === 3) { sx = 0; sy = h - 1; mx = 1; my = -1; }
    let qx = sx + mx * x, qy = sy + my * y;
    if (rot % 2 === 1) { const t = qx; qx = qy; qy = t; }
    const row = shape[qy];
    return !!(row && row[qx]);
}

/** Weltkoordinaten aller belegten Felder. */
function cellsOf(shape, rot, x0, y0) {
    const out = [];
    for (let y = 0; y < fHeight(shape, rot); y++) {
        for (let x = 0; x < fWidth(shape, rot); x++) {
            if (fullAt(shape, rot, x, y)) out.push([x0 + x, y0 + y]);
        }
    }
    return out;
}

/**
 * Nachbarfelder in Weltkoordinaten — die Felder, auf denen ein Booster wirken
 * wuerde. Nachbau von Fragment.neighbors(): alle 4er-Nachbarn belegter Felder,
 * die selbst nicht belegt sind, ohne Duplikate.
 */
function neighborsOf(shape, rot, x0, y0) {
    const seen = {}, out = [];
    const H = fHeight(shape, rot), W = fWidth(shape, rot);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (!fullAt(shape, rot, x, y)) continue;
            const cand = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
            for (let i = 0; i < cand.length; i++) {
                const cx = cand[i][0], cy = cand[i][1];
                if (fullAt(shape, rot, cx, cy)) continue;
                const k = cx + "," + cy;
                if (seen[k]) continue;
                seen[k] = 1;
                out.push([x0 + cx, y0 + cy]);
            }
        }
    }
    return out;
}

// ===========================================================================
// LAYOUT-SUCHE
// ===========================================================================

function makeGrid(W, H) {
    const g = [];
    for (let y = 0; y < H; y++) { const r = []; for (let x = 0; x < W; x++) r.push(-1); g.push(r); }
    return g;
}

/** Nachbau von StaneksGift.canPlace: der ganze Rahmen muss ins Gitter. */
function fits(grid, W, H, shape, rot, x0, y0) {
    const w = fWidth(shape, rot), h = fHeight(shape, rot);
    if (x0 < 0 || y0 < 0 || x0 + w > W || y0 + h > H) return false;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (!fullAt(shape, rot, x, y)) continue;
            if (grid[y0 + y][x0 + x] !== -1) return false;
        }
    }
    return true;
}

function stamp(grid, shape, rot, x0, y0, mark) {
    const cs = cellsOf(shape, rot, x0, y0);
    for (let i = 0; i < cs.length; i++) grid[cs[i][1]][cs[i][0]] = mark;
}

/**
 * Wie gut liegt diese Platzierung? Zwei gegenlaeufige Wuensche:
 *
 *   KOMPAKT    — dicht an Rand und Nachbarn gepackte Fragmente lassen eine
 *                zusammenhaengende Restflaeche uebrig, und nur dort passt ein
 *                Booster (5 Felder) ueberhaupt hinein.
 *   OFFEN      — ein wertvolles Fragment will viele FREIE Nachbarfelder, denn
 *                nur an die kann sich spaeter ein Booster anlegen.
 *
 * Beides wird ueber den Anteil am Spitzennutzen gemischt: das beste Fragment
 * zaehlt freie Nachbarn voll (es soll erreichbar bleiben), ein schwaches
 * zaehlt nur Kompaktheit (es soll nicht im Weg stehen). Ohne diese Mischung
 * landeten die Hacking-Fragmente in der Ecke und die Booster beim Ruf.
 */
function placeScore(grid, W, H, shape, rot, x0, y0, share) {
    const nb = neighborsOf(shape, rot, x0, y0);
    let occ = 0, free = 0;
    for (let i = 0; i < nb.length; i++) {
        const x = nb[i][0], y = nb[i][1];
        if (x < 0 || y < 0 || x >= W || y >= H) occ++;
        else if (grid[y][x] !== -1) occ++;
        else free++;
    }
    return occ + share * free;
}

/** Deterministischer Zufall — gleicher Spielstand, gleiches Layout. */
function mkRnd(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** Reihenfolge nach Nutzen gewichtet ziehen: gute Fragmente meist zuerst. */
function weightedOrder(cands, rnd) {
    const pool = cands.slice(), out = [];
    while (pool.length > 0) {
        let tot = 0;
        for (let i = 0; i < pool.length; i++) tot += pool[i].score;
        let r = rnd() * tot, i = 0;
        for (; i < pool.length - 1; i++) { r -= pool[i].score; if (r <= 0) break; }
        out.push(pool.splice(i, 1)[0]);
    }
    return out;
}

/**
 * Setzt so viele Booster in die Luecken, wie noch Nutzen bringen — immer den
 * mit dem groessten Zugewinn zuerst. Ein Booster, der kein Stat-Fragment
 * beruehrt, bringt nichts und wird gar nicht erst gesetzt.
 *
 * Die Engine zaehlt einen Nachbar-Booster GENAU EINMAL, egal ueber wie viele
 * Felder er anliegt (StaneksGift.effect entdoppelt vor der Multiplikation).
 * Deshalb hier ein Treffer-Set je Fragment, keine Feldzaehlung.
 */
function addBoosters(grid, W, H, placed, boosterDefs, counts) {
    const touch = {};
    for (let i = 0; i < placed.length; i++) {
        placed[i].boost = 0;
        const nb = placed[i].nb;
        for (let j = 0; j < nb.length; j++) {
            const k = nb[j][0] + "," + nb[j][1];
            if (!touch[k]) touch[k] = [];
            touch[k].push(i);
        }
    }

    const boosters = [];
    for (;;) {
        let best = null;
        for (let bi = 0; bi < boosterDefs.length; bi++) {
            const b = boosterDefs[bi];
            if ((counts[b.id] || 0) >= (b.limit || 1)) continue;
            for (let rot = 0; rot < 4; rot++) {
                for (let y = 0; y < H; y++) {
                    for (let x = 0; x < W; x++) {
                        if (!fits(grid, W, H, b.shape, rot, x, y)) continue;
                        const cs = cellsOf(b.shape, rot, x, y);
                        const hit = {};
                        for (let i = 0; i < cs.length; i++) {
                            const lst = touch[cs[i][0] + "," + cs[i][1]];
                            if (!lst) continue;
                            for (let j = 0; j < lst.length; j++) hit[lst[j]] = 1;
                        }
                        let gain = 0;
                        for (const key in hit) {
                            const p = placed[key];
                            gain += p.def.score * (Math.pow(1.1, p.boost + 1) - Math.pow(1.1, p.boost));
                        }
                        if (gain > 0 && (best === null || gain > best.gain)) {
                            best = { def: b, rot: rot, x: x, y: y, gain: gain, hit: hit };
                        }
                    }
                }
            }
        }
        if (best === null) break;
        stamp(grid, best.def.shape, best.rot, best.x, best.y, 1000 + boosters.length);
        boosters.push({ def: best.def, rot: best.rot, x: best.x, y: best.y });
        counts[best.def.id] = (counts[best.def.id] || 0) + 1;
        for (const key in best.hit) placed[key].boost++;
    }
    return boosters;
}

function totalScore(placed) {
    let s = 0;
    for (let i = 0; i < placed.length; i++) s += placed[i].def.score * Math.pow(1.1, placed[i].boost);
    return s;
}

/**
 * Ein vollstaendiges Layout: erst die uebergebenen Stat-Fragmente, dann die
 * Booster. Rueckgabe null, wenn nicht alle Stat-Fragmente passen.
 */
function buildLayout(W, H, chosen, boosterDefs, rnd, maxScore) {
    const grid = makeGrid(W, H);
    const placed = [];
    const counts = {};

    for (let ci = 0; ci < chosen.length; ci++) {
        const c = chosen[ci];
        const share = maxScore > 0 ? c.score / maxScore : 1;
        const opts = [];
        for (let rot = 0; rot < 4; rot++) {
            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (!fits(grid, W, H, c.shape, rot, x, y)) continue;
                    opts.push({ rot: rot, x: x, y: y, s: placeScore(grid, W, H, c.shape, rot, x, y, share) });
                }
            }
        }
        if (opts.length === 0) return null;
        opts.sort(function (a, b) { return (b.s - a.s) || (a.y - b.y) || (a.x - b.x); });
        const pick = opts[Math.floor(rnd() * Math.min(4, opts.length))];
        stamp(grid, c.shape, pick.rot, pick.x, pick.y, placed.length);
        placed.push({
            def: c, rot: pick.rot, x: pick.x, y: pick.y, boost: 0,
            nb: neighborsOf(c.shape, pick.rot, pick.x, pick.y),
        });
        counts[c.id] = (counts[c.id] || 0) + 1;
    }

    const boosters = addBoosters(grid, W, H, placed, boosterDefs, counts);
    return { grid: grid, counts: counts, placed: placed, boosters: boosters, score: totalScore(placed) };
}

/**
 * Umsetzungsrunde: nimmt ein fertiges Layout und versucht, JEDES einzelne
 * Stat-Fragment woanders hinzulegen — Booster jedesmal komplett neu verteilt.
 * Das ist der Schritt, der die Booster von den billigen zu den teuren
 * Fragmenten umhaengt; der greedy Aufbau allein schafft das nicht, weil er die
 * Stat-Fragmente setzt, bevor er weiss, wo die Booster landen werden.
 */
async function relocate(W, H, lay, boosterDefs, maxScore, deadline, breathe) {
    let cur = lay;
    for (let sweep = 0; sweep < 3; sweep++) {
        let improved = false;
        // Teuerste zuerst: dort ist der Hebel am groessten.
        const order = cur.placed.map(function (p, i) { return i; })
            .sort(function (a, b) { return cur.placed[b].def.score - cur.placed[a].def.score; });

        for (let oi = 0; oi < order.length; oi++) {
            if (Date.now() > deadline) return cur;
            await breathe();
            const idx = order[oi];
            const moving = cur.placed[idx];
            const others = cur.placed.filter(function (p, i) { return i !== idx; });

            // Gitter ohne dieses Fragment und ohne alle Booster.
            const base = makeGrid(W, H);
            const baseCounts = {};
            for (let i = 0; i < others.length; i++) {
                stamp(base, others[i].def.shape, others[i].rot, others[i].x, others[i].y, i);
                baseCounts[others[i].def.id] = (baseCounts[others[i].def.id] || 0) + 1;
            }

            let best = null;
            for (let rot = 0; rot < 4; rot++) {
                for (let y = 0; y < H; y++) {
                    for (let x = 0; x < W; x++) {
                        if (!fits(base, W, H, moving.def.shape, rot, x, y)) continue;
                        const grid = makeGrid(W, H);
                        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) grid[yy][xx] = base[yy][xx];
                        const placed = others.map(function (p) {
                            return { def: p.def, rot: p.rot, x: p.x, y: p.y, boost: 0, nb: p.nb };
                        });
                        stamp(grid, moving.def.shape, rot, x, y, placed.length);
                        placed.push({
                            def: moving.def, rot: rot, x: x, y: y, boost: 0,
                            nb: neighborsOf(moving.def.shape, rot, x, y),
                        });
                        const counts = {};
                        for (const k in baseCounts) counts[k] = baseCounts[k];
                        counts[moving.def.id] = (counts[moving.def.id] || 0) + 1;
                        const boosters = addBoosters(grid, W, H, placed, boosterDefs, counts);
                        const sc = totalScore(placed);
                        if (best === null || sc > best.score) {
                            best = { grid: grid, counts: counts, placed: placed, boosters: boosters, score: sc };
                        }
                    }
                }
            }
            if (best !== null && best.score > cur.score + 1e-9) { cur = best; improved = true; }
        }
        if (!improved) break;
    }
    return cur;
}

/**
 * Sucht das beste Layout. Probiert JEDE Fragmentzahl von 1 bis zum Maximum
 * durch, jeweils mit mehreren Zufallsneustarts — genau hier faellt die
 * Entscheidung "lieber ein Fragment weniger und ein Booster mehr". Zum Schluss
 * bekommt der Sieger noch eine Umsetzungsrunde.
 */
async function optimize(W, H, cands, boosterDefs, deadline, breathe) {
    const sorted = cands.slice().sort(function (a, b) { return b.score - a.score; });
    if (sorted.length === 0) return null;
    const maxScore = sorted[0].score;
    const maxK = Math.min(sorted.length, Math.floor((W * H) / 4));
    let best = null;
    let vollstaendig = true;
    // v2.2: MESSEN STATT RATEN. Die Chronik zeigte 121 Abbrueche in Folge —
    // die Suche wurde also NIE fertig. Ob das an zu wenig Rechenzeit liegt oder
    // an den Atempausen (jedes await kostet einen Spieltakt, nicht Rechenzeit),
    // ist von aussen nicht zu sehen. Diese drei Zahlen beantworten es.
    const t0 = Date.now();
    let kFertig = 0;
    let atemzuege = 0;

    // K AUFSTEIGEND. Die Reihenfolge ist nicht gleichgueltig: bricht die
    // Zeitbremse mittendrin ab, bleibt das beste bis dahin gefundene Layout
    // stehen. Absteigend waere das im Zweifel die fragmentreichste,
    // verstaerkerloseste Variante — also genau die schlechteste. Aufsteigend
    // sind zuerst die kleinen, verstaerkerreichen Layouts durchgerechnet.
    for (let K = 1; K <= maxK; K++) {
        await breathe(); atemzuege++;
        if (Date.now() > deadline) { vollstaendig = false; break; }
        for (let r = 0; r < CFG.OPT_RESTARTS; r++) {
            // Zwischendurch atmen lassen: ohne das blockiert die Suche den
            // Spiel-Thread am Stueck und das Bild ruckelt sichtbar.
            if (r > 0 && r % 8 === 0) { await breathe(); atemzuege++; }
            const rnd = mkRnd(K * 7919 + r * 104729 + 12345);
            // Lauf 0 ist der deterministische Anlauf: strikt nach Nutzen.
            const order = (r === 0) ? sorted.slice(0, K) : weightedOrder(sorted, rnd).slice(0, K);
            const lay = buildLayout(W, H, order, boosterDefs, r === 0 ? function () { return 0; } : rnd, maxScore);
            if (lay === null) continue;
            if (best === null || lay.score > best.score) { best = lay; best.k = K; }
        }
        kFertig = K;          // diese K-Stufe ist komplett durchgerechnet
    }
    if (best === null) return null;
    const k = best.k;
    // relocate() uebernimmt nur echte Verbesserungen (score > cur.score), kann
    // also nie verschlechtern — hier ist kein Rueckfallnetz noetig.
    best = await relocate(W, H, best, boosterDefs, maxScore, deadline, breathe);
    best.k = k;
    best.vollstaendig = vollstaendig;
    best.dauerMs = Date.now() - t0;
    best.kFertig = kFertig;
    best.maxK = maxK;
    best.atemzuege = atemzuege;
    return best;
}

/** Nutzen eines BESTEHENDEN Gitters, mit denselben Gewichten gerechnet. */
function scoreExisting(active, scoreOf) {
    const stats = [], boosters = [];
    for (let i = 0; i < active.length; i++) {
        const f = active[i];
        if (!f.shape) return null;                 // ohne Form nicht bewertbar
        if (f.type === FT.Booster) boosters.push(f); else stats.push(f);
    }
    let total = 0;
    const detail = [];
    for (let i = 0; i < stats.length; i++) {
        const f = stats[i];
        const nb = neighborsOf(f.shape, f.rotation, f.x, f.y);
        const nbKeys = {};
        for (let j = 0; j < nb.length; j++) nbKeys[nb[j][0] + "," + nb[j][1]] = 1;
        let b = 0;
        for (let j = 0; j < boosters.length; j++) {
            const cs = cellsOf(boosters[j].shape, boosters[j].rotation, boosters[j].x, boosters[j].y);
            for (let k = 0; k < cs.length; k++) {
                if (nbKeys[cs[k][0] + "," + cs[k][1]]) { b++; break; }
            }
        }
        const s = scoreOf(f.type) * Math.pow(1.1, b);
        total += s;
        detail.push({ type: f.type, boost: b });
    }
    return { score: total, detail: detail, stats: stats.length, boosters: boosters.length };
}

// ===========================================================================
// HOSTWAHL
// ===========================================================================

/**
 * Der Lader muss als EIN Prozess auf EINEM Server laufen: die Engine liest die
 * Threadzahl genau dieses Prozesses. Hundert Kopien mit je 80 Threads ergeben
 * highestCharge 80, nicht 8000 — Aufteilen bringt also nichts.
 * Gesucht ist deshalb der Server mit den meisten Threads, wobei die Cores
 * multiplikativ zaehlen: getCoreBonus(cores) = 1 + (cores-1)/16.
 */
function pickHost(ns, override) {
    const names = [ns.getHostname()];
    if (override) names.length = 0;
    if (override) names.push(override);
    else {
        try {
            const ps = ns.cloud.getServerNames();
            for (let i = 0; i < ps.length; i++) names.push(ps[i]);
        } catch (e) { /* kein Cloud-Zugriff — dann eben nur home */ }
        // v2.2: HACKNET-SERVER MITNEHMEN. Sie waren nicht in der Auswahl, und
        // genau dort liegen die KERNE: bis 128 Stueck (Hacknet/data/Constants
        // .ts:50) gegen 1 auf jedem gekauften Server (BaseServer.ts:50).
        //
        // Die Ladestaerke ist threads * (1 + (cores-1)/16) — bei 128 Kernen also
        // Faktor 8,94. Ein voll ausgebauter Hacknet-Server (8192 GB, Constants
        // .ts:49) traegt 3072 Ladethreads und wirkt damit wie 27.456 auf einem
        // Einkern-Server. Um das mit einem pserv zu erreichen, braeuchte man
        // dort 55 TB frei.
        //
        // Gesucht wird ueber die Namenskonvention (HacknetHelpers.tsx:75) statt
        // ueber die Hacknet-API — getServer ist hier ohnehin schon im Einsatz,
        // das kostet also kein zusaetzliches RAM. Die Schleife bricht beim
        // ersten fehlenden Namen ab; mehr als 64 Knoten gibt es praktisch nicht.
        for (let i = 0; i < 64; i++) {
            const hn = "hacknet-server-" + i;
            try { if (!ns.getServer(hn)) break; } catch (e) { break; }
            names.push(hn);
        }
    }

    const homeName = ns.getHostname();
    let best = null, home = null;
    for (let i = 0; i < names.length; i++) {
        let s = null;
        try { s = ns.getServer(names[i]); } catch (e) { continue; }
        if (!s) continue;
        const maxRam = s.maxRam || 0;
        const free = maxRam - (s.ramUsed || 0);
        // v2.5 — EXKLUSIV IST JEDER FREMDHOST, UND DORT ZAEHLT maxRam.
        //
        // Zwei Fehler auf einmal, beide am selben Ort:
        //
        // 1. "exklusiv" galt nur fuer hacknet-server-*. Der Dispatcher raeumt
        //    aber JEDEN Host ausser home, sobald STANEK ihn auf Port 25 meldet
        //    (SCHWARM-DISPATCHER v11.8, Bedingung stanekHost != home). Gekaufte
        //    Server bekamen hier also die geteilten Grenzen (64 GB Reserve,
        //    75 %), obwohl sie in Wahrheit voellig frei geraeumt werden.
        //
        // 2. Gerechnet wurde mit free. Auf einem Host, der GERAEUMT WIRD, ist
        //    das die falsche Bezugsgroesse — dort zaehlt maxRam. Live gemessen
        //    am 04.09.: STANEK waehlte um 03:53:04 home mit 295 Threads, weil
        //    der Pool in dieser Sekunde 199 GB frei hatte. Fuenfzig Sekunden
        //    spaeter waren es 26 TB. Die Threadstaerke bleibt aber ab dem Start
        //    konstant (siehe Kommentar bei "5. Lader schreiben und starten"),
        //    also hing die Ladung des ganzen Durchlaufs an einem
        //    Zufallszeitpunkt waehrend des Hochfahrens.
        //
        // home bleibt bewusst auf free: dort raeumt der Dispatcher NICHT,
        // weil die anderen Daemons dort wohnen.
        //
        // Die KERNE bleiben unangetastet — sie stecken unveraendert im
        // Faktor (1 + (cores-1)/16) weiter unten. Diese Aenderung betrifft nur
        // die RAM-Haelfte der Rechnung.
        const exklusiv = names[i] !== homeName;
        const reserve = exklusiv ? CFG.RAM_RESERVE_EXKLUSIV : CFG.RAM_RESERVE_GB;
        const frac = exklusiv ? CFG.CHARGE_MAX_FRAC_EXKLUSIV : CFG.CHARGE_MAX_FRAC;
        const basis = exklusiv ? maxRam : free;
        const budget = Math.min(basis - reserve, maxRam * frac);
        const t = Math.min(CFG.MAX_THREADS, Math.floor(Math.max(0, budget) / CFG.CHARGE_RAM));
        if (t < CFG.MIN_THREADS) continue;
        const cores = s.cpuCores || 1;
        const cand = { host: names[i], threads: t, cores: cores, eff: t * (1 + (cores - 1) / 16) };
        if (names[i] === homeName) home = cand;
        if (best === null || cand.eff > best.eff) best = cand;
    }
    if (best === null) return null;

    // HOME HAT VORFAHRT — und zwar nicht aus Bequemlichkeit, sondern weil dort
    // der Platz RESERVIERT ist.
    //
    // Die Queen meldet je Daemon minRam + burst auf Port 19, und der Dispatcher
    // haelt genau diese Menge auf genau diesem Host frei: erst passiv (nicht
    // nachfuellen), nach 90 s aktiv (Fuell-Worker killen, nie den Kern).
    // STANEK ist mit pinHost "home" eingetragen, die Reservierung liegt also
    // immer auf home.
    //
    // Die alte Regel hier hat genau daran vorbeigesucht: sie nahm den Host mit
    // den meisten freien Threads. Das ist per Konstruktion NICHT home — home ist
    // ja nur bis zur Reservierungsgrenze frei, waehrend anderswo zufaellig
    // gerade Platz ist. Live gemessen: 42 Threads auf einem pserv, waehrend auf
    // home reservierter Platz ungenutzt blieb.
    //
    // Ein fremder Host lohnt deshalb erst, wenn er home DEUTLICH schlaegt — dort
    // ist der Platz geliehen und kann jederzeit wieder zugebaut werden, waehrend
    // die Ladung eine konstante Threadzahl bis zum Ende braucht.
    if (home && best.host !== home.host) {
        const gain = Math.log(best.eff + 1) / Math.log(home.eff + 1);
        if (gain < CFG.FREMDHOST_VORTEIL) return home;
    }
    // Kein home in der Auswahl (zu voll fuer MIN_THREADS)? Dann ist der fremde
    // Host der Notnagel — besser schwach laden als gar nicht.
    return best;
}

// ===========================================================================
// HAUPTLAUF
// ===========================================================================

/** @param {NS} ns */
export async function main(ns) {
    // SELBST-AUS — die ALLERERSTE Anweisung, vor jeder Ausstiegsmoeglichkeit.
    //
    // shouldRun() in SCHWARM-QUEEN.js hat einen unbedingten Zweig
    //   if (d.owner === "QUEEN") return true;
    // der VOR der WANT-Pruefung greift. Fuer einen oneshotDaemon mit
    // owner "QUEEN" ist der WANT-Verbrauch beim Deploy damit wirkungslos:
    // der Payload endet, die Queen sieht wieder true und startet nach Ablauf
    // der Gnadenfrist (GRACE_MS 12000) erneut — im Spiel gemessen alle 12-14
    // Sekunden, stundenlang. Jeder dieser Laeufe rechnete ein Layout durch und
    // riss einen Ladeprozess ueber hunderte Gigabyte hoch, nur um ihn zwei
    // Sekunden spaeter wieder zu beenden.
    //
    // SCAN hat dasselbe Registry-Muster und loest es genauso; RESET hat
    // stattdessen einen hartcodierten Sonderzweig in der Queen. Das Selbst-Aus
    // kommt ohne Aenderung an der Queen aus.
    // 0 und nicht 1, weil STANEK defaultOff ist — das raeumt zugleich einen
    // per Dashboard gesetzten FORCE-Zustand (Schalter 2) ab.
    try { setDaemonEnabled(ns, "STANEK", 0); } catch (e) { /* weiter */ }

    ns.disableLog("ALL");

    let hostOverride = null, zielOverride = null;
    for (let i = 0; i < ns.args.length - 1; i++) {
        if (ns.args[i] === "--host") hostOverride = String(ns.args[i + 1]);
        if (ns.args[i] === "--ziel") zielOverride = Number(ns.args[i + 1]);
    }
    const ziel = (zielOverride && zielOverride > 0) ? zielOverride : CFG.TARGET_CHARGE;

    // Doppelstart-Schutz: zwei Ladeprozesse mit verschiedenen Threadzahlen
    // wuerden sich gegenseitig den highestCharge-Hoechststand zerschiessen.
    try {
        const self = ns.getScriptName(), here = ns.getHostname();
        if (ns.ps(here).filter(function (p) { return p.filename === self; }).length > 1) {
            ns.tprint("WARN  [STANEK] laeuft bereits — beende diese Instanz.");
            return;
        }
    } catch (e) { /* im Zweifel weiter */ }

    // --- 1. Geschenk annehmen (nur beim allerersten Mal) -----------------
    let active = [];
    let haveGift = true;
    try { active = ns.stanek.activeFragments(); } catch (e) { haveGift = false; }

    if (!haveGift) {
        let ok = false;
        try { ok = ns.stanek.acceptGift(); } catch (e) { ok = false; }
        if (!ok) {
            ns.tprint("INFO  [STANEK] Geschenk nicht annehmbar — Lauf beendet. Haeufigster Grund: in "
                + "DIESER BitNode wurde bereits eine Augmentierung installiert (ausser NeuroFlux). "
                + "Ein Aug-Reset hebt das NICHT auf (installierte Augs ueberleben ihn); erst ein "
                + "BitNode-Wechsel oeffnet das Fenster wieder. Zweiter moeglicher Grund: kein SF13.");
            publish(ns, { state: "gesperrt", grund: "Aug in dieser BitNode bereits installiert, oder kein SF13" });
            return;
        }
        ns.print("Geschenk angenommen.");
        try { active = ns.stanek.activeFragments(); } catch (e) { active = []; }
    }

    // --- 2. Schnellausstieg ----------------------------------------------
    // Die Queen startet diesen One-Shot immer wieder (alle paar Sekunden, wenn
    // ihn jemand anfordert). Ohne diese Abkuerzung liefe jedes Mal die
    // Layoutsuche (einige hundert Millisekunden Rechenzeit) und es wuerde ein
    // Ladeprozess ueber hunderte Gigabyte gestartet, nur um zwei Sekunden
    // spaeter wieder beendet zu werden. Ist nichts zu tun, ist der Lauf jetzt
    // nach wenigen Millisekunden vorbei.
    const zustand = readState(ns);
    const ladbar = active.filter(function (f) { return f.type !== FT.Booster; });
    let minLadung = Infinity, hoechstLadung = 0;
    for (let i = 0; i < ladbar.length; i++) {
        const n = ladbar[i].numCharge || 0;
        if (n < minLadung) minLadung = n;
        if ((ladbar[i].highestCharge || 0) > hoechstLadung) hoechstLadung = ladbar[i].highestCharge || 0;
    }
    // NACHLADEN, WENN DER POOL GEWACHSEN IST.
    //
    // STANEK laeuft frueh, wenn der Schwarm noch klein ist. Live gemessen: 42
    // Threads auf einem pserv, weil home und die Server damals voll waren —
    // und danach nie wieder etwas, weil der One-Shot sich selbst abschaltet.
    // Spaeter stehen leicht hundertmal so viele Threads bereit.
    //
    // Nachladen lohnt fast immer. Die Engine skaliert numCharge zwar nach
    // unten, wenn die Threadzahl steigt:
    //     numCharge = highestCharge * numCharge / threads + 1
    // aber numCharge steht mit Exponent 0.07 in der Formel, die Threadzahl im
    // Logarithmus. Von 42 auf 512 gerechnet, mit numCharge 150:
    //     alt  ln(43)/60  * (151/5)^0.07 = 0.0627 * 1.264 = 0.0792
    //     neu  ln(513)/60 * ( 14/5)^0.07 = 0.1040 * 1.076 = 0.1119
    // also gut 40 Prozent mehr auf JEDES Fragment, sofort — und numCharge
    // baut sich danach wieder auf.
    //
    // Die Schwelle ist bewusst hoch (Faktor 3): fuer ein paar Prozent lohnt
    // es nicht, die aufgebaute Ladung umzuskalieren.
    let nachladen = false;
    if (ladbar.length > 0 && minLadung >= ziel && hoechstLadung > 0) {
        const p = pickHost(ns, hostOverride);
        if (p) {
            const jetzt = p.threads * (1 + (p.cores - 1) / 16);
            if (jetzt >= hoechstLadung * 3) {
                nachladen = true;
                ns.tprint("INFO  [STANEK] Nachladen: bisher Threadstaerke " + hoechstLadung
                    + ", jetzt sind " + Math.round(jetzt) + " moeglich (" + p.host + "). "
                    + "Das bringt rund "
                    + Math.round((Math.log(jetzt + 1) / Math.log(hoechstLadung + 1) - 1) * 100)
                    + " % mehr Effekt auf jedes Fragment.");
            }
        }
    }

    if (ladbar.length > 0 && minLadung >= ziel && !nachladen
        && zustand && zustand.quelle && zustand.quelle !== "keine") {
        // v2.2: NICHT MEHR STUMM. Wurde eine Nachladung angefordert und hier
        // abgelehnt, sah der Spieler nur, dass der Prozess sofort wieder weg
        // war — die Queen meldete "Faktor 25.2, Nachladung angefordert", und
        // Sekunden spaeter stand nichts mehr im ps. Der Grund lag hier und ging
        // ueber ns.print an ein Log, das mit dem Prozess verschwand.
        //
        // Die Zahlen dazu, damit die Ablehnung nachvollziehbar ist: die
        // Ladestaerke ist die Threadzahl EINES Skripts auf EINEM Host
        // (Stanek.ts:53). Mehrere Server helfen dabei nicht.
        const p0 = pickHost(ns, hostOverride);
        const jetzt0 = p0 ? Math.round(p0.threads * (1 + (p0.cores - 1) / 16)) : 0;
        ns.tprint("INFO  [STANEK] Nichts zu tun: Ladung " + minLadung.toFixed(0)
            + " >= Ziel " + ziel + ". Nachladen abgelehnt — bester Einzelhost "
            + (p0 ? p0.host : "keiner") + " gibt " + jetzt0 + " Threads, geladen ist mit "
            + Math.round(hoechstLadung) + " (noetig waere das Dreifache, also "
            + Math.round(hoechstLadung * 3) + ").");
        publish(ns, {
            state: "fertig", gitter: ns.stanek.giftWidth() + "x" + ns.stanek.giftHeight(),
            multsQuelle: zustand.quelle, threadStaerke: hoechstLadung,
            min: +minLadung.toFixed(1), ziel: ziel,
            verstaerker: active.length - ladbar.length, unveraendert: true,
            bestHost: p0 ? p0.host : "", bestThreads: jetzt0,
        });
        return;
    }

    // --- 3. Bestes Layout rechnen ----------------------------------------
    const W = ns.stanek.giftWidth();
    const H = ns.stanek.giftHeight();
    const mq = bitNodeMults(ns);
    const mults = mq.mults;
    if (!mults) {
        ns.tprint("WARN  [STANEK] Keine BitNode-Multiplikatoren erreichbar (INFO laeuft nicht, "
            + "und getBitNodeMultipliers braucht SF5). Es gelten die Grundgewichte — die Auswahl "
            + "ist dann deutlich schlechter, weil die Knappheiten dieser BitNode fehlen.");
    } else {
        ns.print("BitNode-Multiplikatoren von: " + mq.quelle);
    }

    // v2.3: Lagebild fuer die Gewichtung — Kampfwerte nur bis zur Bladeburner-
    // Freischaltung, Hacknet-Fragmente nur wo gekaufte Server gesperrt sind.
    const lage = lageErmitteln(ns, mults);
    ns.print("Lage: Kampfwerte " + (lage.kampfFertig ? "fertig (>=100, Fragmente aus)" : "im Aufbau (Fragmente an)")
        + " | gekaufte Server " + (lage.pservMoeglich ? "moeglich (Hacknet-Fragmente aus)" : "gesperrt (Hacknet-Fragmente an)"));

    const defs = ns.stanek.fragmentDefinitions();
    const cands = [], boosterDefs = [];
    const scoreByType = {};
    for (let i = 0; i < defs.length; i++) {
        const f = defs[i];
        if (f.type === FT.Booster) { boosterDefs.push(f); continue; }
        const w = weightOf(f.type, mults, lage);
        const sc = w * (f.power || 1);
        scoreByType[f.type] = sc;
        if (sc <= 0) continue;
        cands.push({ id: f.id, type: f.type, shape: f.shape, power: f.power, weight: w, score: sc, limit: f.limit || 1 });
    }
    const scoreOf = function (t) { return scoreByType[t] || 0; };

    const plan = await optimize(W, H, cands, boosterDefs, Date.now() + CFG.OPT_MS,
        function () { return ns.sleep(0); });
    if (plan === null) {
        ns.tprint("ERROR [STANEK] Kein Layout berechenbar — Gitter " + W + "x" + H + ", "
            + cands.length + " Bewerber. Lauf beendet.");
        publish(ns, { state: "fehler", grund: "keine Platzierung moeglich", gitter: W + "x" + H });
        return;
    }

    const old = scoreExisting(active, scoreOf);
    const oldScore = old ? old.score : 0;

    // =========================================================================
    // v2.2 BUGFIX — DAS ERSTE GITTER BLIEB FUER IMMER LIEGEN
    // =========================================================================
    // Hier stand: "plan unvollstaendig UND ein Gitter existiert -> niemals
    // umbauen". Die Absicht war richtig (eine bestehende Ladung nicht fuer ein
    // halb durchgerechnetes Layout wegwerfen), die Wirkung nicht: die Suche
    // wurde NIE fertig. Die Fehler-Chronik zeigt denselben Abbruch 121-mal in
    // Folge, und in vier Screenshots ueber Stunden stand exakt dasselbe Gitter —
    // inklusive "Arbeitslohn Power 10", das bei Crime und Shock-Recovery nichts
    // bringt. Das war kein Zufall, sondern eine Sperre ohne Ausweg: was einmal
    // liegt, bleibt liegen.
    //
    // Der Denkfehler: "unvollstaendig" heisst NICHT "schlecht". Die Suche geht
    // K aufsteigend vor und haelt immer das beste bisher Gefundene fest; ein
    // abgebrochener Lauf liefert also ein GUELTIGES, nur nicht garantiert
    // optimales Layout. Und ob es besser ist als das bestehende, steht direkt
    // darunter ohnehin schon als Rechnung — oldScore gegen plan.score.
    //
    // JETZT entscheidet in beiden Faellen der Nutzen. Ein abgebrochener Lauf
    // muss nur deutlicher gewinnen (RELAYOUT_GAIN_TEIL statt RELAYOUT_GAIN),
    // weil die Ladung beim Umbau verloren geht und ein knapper Vorsprung diesen
    // Preis nicht wert waere.
    const teilSuche = !plan.vollstaendig;
    const schwelle = teilSuche ? CFG.RELAYOUT_GAIN_TEIL : CFG.RELAYOUT_GAIN;
    let relayout = true;
    if (active.length > 0 && oldScore > 0 && plan.score < oldScore * schwelle) {
        relayout = false;
        ns.print("Bestehendes Gitter bleibt liegen: Nutzen " + oldScore.toFixed(0)
            + " gegen " + plan.score.toFixed(0) + " (noetig waere das "
            + schwelle.toFixed(2) + "-fache" + (teilSuche ? ", Teilsuche" : "") + ").");
    }

    // Messwerte der Suche IMMER melden — auch wenn umgebaut wird. Ohne sie war
    // nicht zu unterscheiden, ob die Zeitbremse zu knapp ist oder die
    // Atempausen sie aufbrauchen (jedes await kostet einen Spieltakt, nicht
    // Rechenzeit). Diese Zeile beantwortet das im naechsten Lauf.
    ns.print("Layoutsuche: " + (plan.vollstaendig ? "vollstaendig" : "ABGEBROCHEN")
        + " nach " + (plan.dauerMs || 0) + " ms (Bremse " + CFG.OPT_MS + " ms), "
        + (plan.kFertig || 0) + "/" + (plan.maxK || 0) + " K-Stufen fertig, "
        + (plan.atemzuege || 0) + " Atempausen.");

    if (relayout) {
        if (active.length > 0) {
            ns.tprint("INFO  [STANEK] Gitter wird neu belegt: Nutzen " + oldScore.toFixed(0)
                + " -> " + plan.score.toFixed(0) + " (" + (plan.placed.length) + " Fragmente + "
                + plan.boosters.length + " Verstaerker statt " + old.stats + " + " + old.boosters
                + "). Die bisherige Ladung geht dabei verloren und wird neu aufgebaut.");
            try { ns.stanek.clearGift(); } catch (e) { /* weiter */ }
        }
        // Gegenprobe mit der Engine, bevor irgendetwas gesetzt wird.
        const all = [];
        for (let i = 0; i < plan.placed.length; i++) {
            const p = plan.placed[i];
            all.push({ id: p.def.id, rot: p.rot, x: p.x, y: p.y, type: p.def.type });
        }
        for (let i = 0; i < plan.boosters.length; i++) {
            const b = plan.boosters[i];
            all.push({ id: b.def.id, rot: b.rot, x: b.x, y: b.y, type: FT.Booster });
        }
        for (let i = 0; i < all.length; i++) {
            const a = all[i];
            let ok = false;
            try { ok = ns.stanek.canPlaceFragment(a.x, a.y, a.rot, a.id); } catch (e) { ok = false; }
            if (!ok) {
                ns.tprint("ERROR [STANEK] Eigene Geometrie und Engine sind uneins bei Fragment "
                    + a.id + " auf (" + a.x + "," + a.y + ") Drehung " + a.rot
                    + ". Lauf abgebrochen, damit kein halbes Gitter entsteht.");
                publish(ns, { state: "fehler", grund: "Geometrie weicht von der Engine ab" });
                return;
            }
            let done = false;
            try { done = ns.stanek.placeFragment(a.x, a.y, a.rot, a.id); } catch (e) { done = false; }
            if (!done) {
                ns.tprint("ERROR [STANEK] placeFragment abgelehnt bei " + a.id + " — Lauf abgebrochen.");
                publish(ns, { state: "fehler", grund: "placeFragment abgelehnt" });
                return;
            }
        }
        ns.print("Gitter " + W + "x" + H + ": " + plan.placed.length + " Fragmente, "
            + plan.boosters.length + " Verstaerker.");
    }

    try { active = ns.stanek.activeFragments(); } catch (e) { active = []; }
    const chargeable = active.filter(function (f) { return f.type !== FT.Booster; });
    if (chargeable.length === 0) {
        ns.tprint("ERROR [STANEK] Kein ladbares Fragment im Gitter — Lauf beendet.");
        publish(ns, { state: "fehler", grund: "nur Verstaerker im Gitter" });
        return;
    }

    // Zustand festhalten, BEVOR geladen wird: das Layout steht jetzt fest, und
    // beim naechsten Start entscheidet die Quelle darueber, ob der
    // Schnellausstieg oben greifen darf.
    writeState(ns, { score: Math.round(plan.score), quelle: mq.quelle, gitter: W + "x" + H, ts: Date.now() });

    // Ladung schon am Ziel? Dann gar nicht erst einen Ladeprozess ueber
    // hunderte Gigabyte starten, nur um ihn zwei Sekunden spaeter zu beenden.
    let lo0 = Infinity, hc0 = 0;
    for (let i = 0; i < chargeable.length; i++) {
        const n = chargeable[i].numCharge || 0;
        if (n < lo0) lo0 = n;
        if ((chargeable[i].highestCharge || 0) > hc0) hc0 = chargeable[i].highestCharge || 0;
    }
    // =====================================================================
    // AB HIER: DAUERSCHLEIFE STATT EINMAL-LAUF (v2.3)
    // =====================================================================
    // Vorgeschichte, zweimal live danebengegangen:
    //
    //   1. Als reiner One-Shot lud STANEK mit dem, was direkt nach dem Reset
    //      zufaellig frei war — gemessen 42 Threads. Der Pool wuchs danach von
    //      0,9 auf 14,9 TB, aber der Lauf war laengst beendet und schaltete sich
    //      selbst ab. Aus eigener Kraft holte er das nie nach.
    //
    //   2. Der Versuch, das ueber eine groessere Reservierung zu loesen
    //      (burst 256 in der Registry), machte es SCHLIMMER: die Queen verlangt
    //      minRam+burst als FREIEN Platz auf home, findet ihn im engen Startpool
    //      nicht, verwirft die Reservierung nach 90 s und versucht es ewig neu.
    //      Ergebnis: STANEK lief in acht Messzyklen ueberhaupt nicht mehr.
    //
    // Die beiden Anforderungen widersprechen sich nur scheinbar:
    //      klein starten koennen  UND  gross laden koennen
    // Sie trennen sich sauber, wenn der Daemon WACH BLEIBT. Er belegt dann nur
    // seine eigenen ~25 GB (die Registry deckt sie mit minRam 64 ab), laedt
    // zunaechst mit dem wenigen, was da ist, und ruestet spaeter von selbst
    // nach — ohne Reservierung, ohne dass ihn jemand neu anfordern muss.
    //
    // Der Selbst-Aus ganz oben bleibt richtig: der Schalter steht auf 0, die
    // Queen startet also nichts nach, waehrend dieser Prozess weiterlaeuft.
    let ersterLauf = true;
    for (;;) {
        if (!ersterLauf) {
            // Lage neu aufnehmen — Ladung und Threadstaerke koennen sich
            // geaendert haben (Aug-Reset loescht die Ladung, Pool waechst).
            try { active = ns.stanek.activeFragments(); } catch (e) { active = []; }
            const ch0 = active.filter(function (f) { return f.type !== FT.Booster; });
            if (ch0.length === 0) { await ns.sleep(CFG.WATCH_MS); continue; }
            chargeable.length = 0;
            for (let i = 0; i < ch0.length; i++) chargeable.push(ch0[i]);
            lo0 = Infinity; hc0 = 0;
            for (let i = 0; i < chargeable.length; i++) {
                const n = chargeable[i].numCharge || 0;
                if (n < lo0) lo0 = n;
                if ((chargeable[i].highestCharge || 0) > hc0) hc0 = chargeable[i].highestCharge || 0;
            }
        }

    // --- 4. Ladehost und Threadzahl --------------------------------------
    const pick = pickHost(ns, hostOverride);
    if (pick === null) {
        if (ersterLauf) {
            ns.tprint("WARN  [STANEK] Noch kein Server mit genug freiem RAM fuer die Ladung "
                + "(mindestens " + (CFG.MIN_THREADS * CFG.CHARGE_RAM) + " GB plus "
                + CFG.RAM_RESERVE_GB + " GB Reserve). Ich bleibe wach und versuche es weiter.");
            publish(ns, { state: "zu_wenig_ram", ziel: ziel });
            ersterLauf = false;
        }
        await ns.sleep(CFG.WATCH_MS);
        continue;
    }
    const coreBonus = 1 + (pick.cores - 1) / 16;

    // Genug Ladung UND keine nennenswert bessere Threadzahl in Sicht? Dann
    // schlafen statt laden. Der Vergleich ist der Kern des Nachruestens.
    const jetztEff = pick.threads * coreBonus;
    const lohnt = hc0 <= 0 || jetztEff >= hc0 * CFG.NACHLADE_FAKTOR;
    if (lo0 >= ziel && !lohnt && !CFG.WEITER_FUER_RUF) {
        if (ersterLauf) {
            ns.print("Ladung bereits bei " + lo0.toFixed(0) + " (Ziel " + ziel + ") — nichts zu tun.");
            publish(ns, {
                state: "fertig", gitter: W + "x" + H, multsQuelle: mq.quelle,
                threadStaerke: hc0, min: +lo0.toFixed(1), ziel: ziel,
                verstaerker: active.length - chargeable.length,
                fragmente: fragListe(chargeable), unveraendert: true,
            });
            ersterLauf = false;
        }
        await ns.sleep(CFG.WATCH_MS);
        continue;
    }
    if (lo0 >= ziel && lohnt) {
        ns.tprint("INFO  [STANEK] Ruesten nach: bisher Threadstaerke " + hc0 + ", jetzt sind "
            + Math.round(jetztEff) + " moeglich (" + pick.host + ") — rund "
            + Math.round((Math.log(jetztEff + 1) / Math.log(hc0 + 1) - 1) * 100)
            + " % mehr Effekt auf jedes Fragment.");
    }
    ersterLauf = false;

    // --- 5. Lader schreiben und starten ----------------------------------
    // Ab hier bleibt die Threadzahl konstant. Eine spaetere Erhoehung wuerde
    // numCharge nach unten umskalieren, eine Senkung nur Bruchteile liefern:
    //   if (threads > highestCharge) numCharge = highestCharge*numCharge/threads + 1
    //   else                         numCharge += threads / highestCharge
    const coords = [];
    for (let i = 0; i < chargeable.length; i++) { coords.push(chargeable[i].x); coords.push(chargeable[i].y); }

    // v2.5 — ERST ANMELDEN, DANN STARTEN.
    //
    // Seit die Threadzahl auf einem Fremdhost aus maxRam kommt, ist der Host im
    // Moment der Wahl in aller Regel noch VOLL mit Workern. Der Dispatcher
    // raeumt ihn — aber erst, wenn er ihn auf Port 25 sieht. Ohne diese
    // Anmeldung entstuende eine Verklemmung: der Lader kaeme nicht hinein
    // (pid 0 -> state "fehler"), und auf "fehler" raeumt der Dispatcher nicht.
    //
    // Deshalb wird der Host jetzt VOR dem ersten Startversuch als "raeumt"
    // gemeldet. Der Dispatcher behandelt diesen Zustand wie "laedt" (v11.9):
    // keine neuen Worker, vorhandene einmal beenden. Danach passt der Lader.
    const brauchtGb = pick.threads * CFG.CHARGE_RAM;
    if (pick.host !== ns.getHostname()) {
        let freiJetzt = 0;
        try {
            const s = ns.getServer(pick.host);
            freiJetzt = (s.maxRam || 0) - (s.ramUsed || 0);
        } catch (e) { freiJetzt = 0; }
        if (freiJetzt < brauchtGb) {
            publish(ns, {
                state: "raeumt", host: pick.host, threads: pick.threads,
                cores: pick.cores, grund: "warte auf Raeumung durch den Dispatcher",
            });
            ns.tprint("INFO  [STANEK] " + pick.host + " wird fuer die Ladung freigeraeumt ("
                + brauchtGb.toFixed(0) + " GB noetig, " + freiJetzt.toFixed(0)
                + " GB frei). Warte auf den Dispatcher.");
            // Zwei Dispatcher-Takte Vorlauf. Reicht das nicht, laeuft die
            // Schleife ohnehin erneut durch und meldet wieder "raeumt".
            await ns.sleep(CFG.POLL_MS * 3);
        }
    }

    let pid = 0;
    try {
        ns.write(CFG.LADER_FILE, LADER_SRC, "w");
        if (pick.host !== ns.getHostname()) ns.scp(CFG.LADER_FILE, pick.host, ns.getHostname());
        pid = ns.exec(CFG.LADER_FILE, pick.host, pick.threads, ...coords);
    } catch (e) {
        ns.tprint("ERROR [STANEK] Lader liess sich nicht starten: " + String(e));
        publish(ns, { state: "fehler", grund: "Lader-Start fehlgeschlagen" });
        await ns.sleep(CFG.WATCH_MS); continue;
    }
    if (pid === 0) {
        // Auf einem Fremdhost ist das kein Fehler, sondern "noch nicht geraeumt".
        // Als "raeumt" gemeldet bleibt der Dispatcher dran; als "fehler" haette
        // er den Host wieder zugebaut und wir kaemen nie hinein.
        if (pick.host !== ns.getHostname()) {
            publish(ns, {
                state: "raeumt", host: pick.host, threads: pick.threads,
                cores: pick.cores, grund: "Lader passt noch nicht — Raeumung laeuft",
            });
            ns.print("STANEK: " + pick.host + " noch zu voll fuer " + brauchtGb.toFixed(0)
                + " GB — bleibt angemeldet, naechster Versuch in "
                + (CFG.WATCH_MS / 1000) + " s.");
        } else {
            ns.tprint("ERROR [STANEK] Lader liess sich nicht starten (kein RAM auf home).");
            publish(ns, { state: "fehler", grund: "kein RAM fuer den Lader auf home" });
        }
        await ns.sleep(CFG.WATCH_MS); continue;
    }

    ns.tprint("INFO  [STANEK] Ladung laeuft: " + pick.threads + " Threads auf " + pick.host
        + " (" + (pick.threads * CFG.CHARGE_RAM).toFixed(0) + " GB, " + pick.cores + " Cores, Faktor "
        + coreBonus.toFixed(2) + "), " + chargeable.length + " Fragmente, Ziel " + ziel + ".");

    // Schwaecher als der bisherige Hoechststand? Dann kriecht die Ladung nur
    // noch: die Engine rechnet dann numCharge += threads / highestCharge, also
    // Bruchteile statt +1 je Aufruf (StaneksGift.charge).
    if (hc0 > 0 && pick.threads * coreBonus < hc0) {
        ns.tprint("WARN  [STANEK] Nur " + Math.round(pick.threads * coreBonus) + " effektive Threads, "
            + "bisheriger Hoechststand war " + hc0 + ". Jede Ladung zaehlt jetzt nur noch "
            + (pick.threads * coreBonus / hc0).toFixed(2) + " statt 1.00 — der Ladehost ist zu voll. "
            + "Wenn moeglich home freiraeumen und STANEK erneut anfordern.");
    }

    // --- 6. Ueberwachen ---------------------------------------------------
    const t0 = Date.now();
    let lastMin = -1, stillSince = t0;
    for (;;) {
        await ns.sleep(CFG.POLL_MS);

        let live = [];
        try { live = ns.stanek.activeFragments(); } catch (e) { live = []; }
        const ch = live.filter(function (f) { return f.type !== FT.Booster; });
        if (ch.length === 0) {
            ns.tprint("ERROR [STANEK] Fragmente sind verschwunden — Ladung beendet.");
            try { ns.kill(pid); } catch (e) { /* egal */ }
            publish(ns, { state: "fehler", grund: "Gitter geleert" });
            break;
        }

        let lo = Infinity, hi = 0, hc = 0;
        for (let i = 0; i < ch.length; i++) {
            const n = ch[i].numCharge || 0;
            if (n < lo) lo = n;
            if (n > hi) hi = n;
            if ((ch[i].highestCharge || 0) > hc) hc = ch[i].highestCharge || 0;
        }

        publish(ns, buildReport(ns, "laedt", live, pick, coreBonus, ziel, lo, hi, hc, t0, W, H, mq.quelle));

        if (!ns.isRunning(pid, pick.host)) {
            ns.tprint("WARN  [STANEK] Lader ist ausgefallen (Ladung " + lo.toFixed(1) + "/" + ziel + ").");
            publish(ns, buildReport(ns, "abgebrochen", live, pick, coreBonus, ziel, lo, hi, hc, t0, W, H, mq.quelle));
            break;
        }

        if (lo > lastMin + 0.01) { lastMin = lo; stillSince = Date.now(); }
        else if (Date.now() - stillSince > 60000) {
            ns.tprint("WARN  [STANEK] Ladung bewegt sich seit einer Minute nicht (" + lo.toFixed(1)
                + "). Lader wird beendet.");
            try { ns.kill(pid); } catch (e) { /* egal */ }
            publish(ns, buildReport(ns, "haengt", live, pick, coreBonus, ziel, lo, hi, hc, t0, W, H, mq.quelle));
            break;
        }

        if (lo >= ziel && !CFG.WEITER_FUER_RUF) {
            try { ns.kill(pid); } catch (e) { /* egal */ }
            const secs = Math.round((Date.now() - t0) / 1000);
            ns.tprint("INFO  [STANEK] fertig nach " + secs + " s: " + ch.length + " Fragmente auf Ladung "
                + lo.toFixed(0) + ", Threadstaerke " + hc + ".");
            publish(ns, buildReport(ns, "fertig", live, pick, coreBonus, ziel, lo, hi, hc, t0, W, H, mq.quelle));
            break;
        }
    }

    // Der Ladeprozess ist beendet (fertig, ausgefallen oder abgewuergt). Der
    // DAEMON bleibt: er schlaeft und sieht spaeter nach, ob der Pool inzwischen
    // deutlich mehr Threads hergibt. Genau das ist der Unterschied zum frueheren
    // One-Shot, der mit 42 Threads endete und nie wieder etwas tat.
    await ns.sleep(CFG.WATCH_MS);
    }   // Ende der Dauerschleife
}

/**
 * Lagebild fuer DIAG. Enthaelt bewusst den fertig gerechneten Effekt je
 * Fragment (chargedEffect kommt direkt aus der Engine) — damit im Pruefbericht
 * steht, was die Fragmente WIRKLICH bringen, und nicht nur, wie viele es sind.
 */
function buildReport(ns, state, live, pick, coreBonus, ziel, lo, hi, hc, t0, W, H, quelle) {
    const ladbar = live.filter(function (f) { return f.type !== FT.Booster; });
    const boosters = live.length - ladbar.length;
    const frags = fragListe(ladbar);
    return {
        state: state,
        gitter: W + "x" + H,
        host: pick.host, threads: pick.threads, cores: pick.cores,
        coreBonus: +coreBonus.toFixed(3),
        threadStaerke: hc,
        multsQuelle: quelle,
        fragmente: frags,
        verstaerker: boosters,
        min: isFinite(lo) ? +lo.toFixed(1) : null,
        max: +hi.toFixed(1),
        ziel: ziel,
        sekunden: Math.round((Date.now() - t0) / 1000),
    };
}

`;

// ============================================================================
// SCAN - interaktive Netzkarte im Terminal (One-Shot)                    [v0.4]
// ============================================================================
// Backtick-/${-frei -> direkt eingebettet, decodePayload() ist hier ein No-Op.
// Reines ASCII: die Kastengrafik des Baums steht als \\uXXXX-Escape im Text,
// damit diese Datei Copy-Paste in den Spiel-Editor unbeschadet uebersteht.
const SRC_SCAN = `/**
 * SCHWARM-SCAN.js (Payload, One-Shot, gestartet ueber den Dashboard-Knopf)
 *
 * Interaktive Netzkarte im Terminal: Baumdarstellung aller Server mit
 * Root-/Backdoor-Status, benoetigtem Hacking-Level, Contracts und (optional)
 * Geld/Security/RAM. Servernamen sind KLICKBAR (setzt die connect-Kette ins
 * Terminal ab), ebenso die [backdoor]-Marken.
 *
 * HERKUNFT: aus dem Fremdskript scan.js. Angepasst fuer den Schwarm:
 *   - Import auf SCHWARM-HELPERS.js umgestellt (helpers.js gibt es hier nicht).
 *   - FORMATTER-SIGNATUREN korrigiert. Die Vorlage rief formatMoney(x, 4, 1)
 *     und formatNumber(x, 0, 0); SCHWARM-HELPERS hat formatMoney(n, dec) und
 *     formatNumber(n, dec). Die dritten Argumente waeren still verschluckt
 *     worden und haetten die Spaltenausrichtung zerschossen.
 *   - PRAEZEDENZ-BUG der Vorlage behoben: "server.moneyMax ?? 0 > 0" parst als
 *     "server.moneyMax ?? (0 > 0)", also "moneyMax ?? false" - die Bedingung war
 *     fuer JEDEN Server mit definiertem moneyMax wahr, auch bei moneyMax 0.
 *     Jetzt geklammert. Dieselbe Stelle noch einmal bei maxRam.
 *   - throw bei unsichtbarem Terminal -> ns.tprint + sauberes Ende. Ein per
 *     Knopf gestarteter Prozess darf nicht mit einer Ausnahme sterben.
 *   - SELBST-AUS als ERSTE Aktion (setDaemonEnabled(ns,"SCAN",0)). Ohne das
 *     startet die Queen den One-Shot im 2-s-Takt endlos neu: owner "QUEEN" plus
 *     Schalter=1 ergibt in shouldRun() jeden Takt true. Muster wie SCHWARM-DIAG.
 *
 * ANTI-AUTOMATION: setNavCommand ruft die React-Props onChange/onKeyDown DIREKT
 * auf und erzeugt KEIN dispatchEvent("keydown"). Der Watchdog der Engine prueft
 * ausschliesslich keydown-Events auf isTrusted/instanceof KeyboardEvent - dieser
 * Weg loest ihn also nicht aus.
 *
 * PATCH-RISIKO: terminalInput ist ein React-Knoten; der Zugriff auf den
 * Handler-Schluessel (Object.keys(terminalInput)[1]) haengt an der internen
 * Property-Reihenfolge von React. Bricht das nach einem Spiel-Update, bleibt die
 * Karte lesbar, nur die Klick-Navigation faellt aus.
 *
 * Aufruf: run SCHWARM-SCAN.js [--hide-stats]
 * @param {NS} ns
 */
import { formatRam, formatMoney, formatNumber, setDaemonEnabled } from "SCHWARM-HELPERS.js";

export function autocomplete() { return ["--hide-stats"]; }

export async function main(ns) {
    // ERSTE Aktion: Schalter zurueck auf AUS. Siehe Kopf - sonst Endlos-Neustart.
    try { setDaemonEnabled(ns, "SCAN", 0); } catch (e) { /* weiter */ }

    const showStats = !ns.args.includes("--hide-stats");
    const factionServers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "w0r1d_d43m0n", "fulcrumassets"];
    const css = "    <style id=\\"scanCSS\\">\\n"
        + "        .serverscan {white-space:pre; color:#ccc; font:14px consolas,monospace; line-height: 16px; }\\n"
        + "        .serverscan .server {color:#080; cursor:pointer; text-decoration:underline;}\\n"
        + "        .serverscan .faction {color:#088;}\\n"
        + "        .serverscan .rooted {color:#6f3;}\\n"
        + "        .serverscan .rooted.faction {color:#0ff;}\\n"
        + "        .serverscan .rooted::before {color:#6f3;}\\n"
        + "        .serverscan .hack {display:inline-block;}\\n"
        + "        .serverscan .red {color:red;}\\n"
        + "        .serverscan .green {color:green;}\\n"
        + "        .serverscan .backdoor {color:#6f3;}\\n"
        + "        .serverscan .backdoor.faction {color:#0ff;}\\n"
        + "        .serverscan .backdoor > a {cursor:pointer; text-decoration:underline;}\\n"
        + "        .serverscan .cct {color:#0ff;}\\n"
        + "        .serverscan .serverStats {color:#8AA;}\\n"
        + "    </style>";

    const doc = globalThis["document"];
    if (!doc) { ns.tprint("WARN  [SCAN] Kein DOM (headless?) - nichts zu zeichnen."); return; }

    // v0.5 — ERST DEN REITER WECHSELN, DANN AUFGEBEN.
    //
    // "terminal-input" gibt es nur, solange der Terminal-Reiter offen ist.
    // Wer den SCAN-Knopf vom Dashboard aus drueckt, steht aber fast nie dort —
    // frueher brach der Lauf hier mit einer Belehrung ab ("wechsle auf den
    // Terminal-Reiter und druecke den Knopf erneut"). Zwei Klicks fuer etwas,
    // das das Skript selbst erledigen kann.
    //
    // Die Seitenleiste traegt kein stabiles Attribut (Sidebar/ui/SidebarItem
    // .tsx: MUI-ListItem, nur Text und Klick), also wird ueber den sichtbaren
    // Text gesucht. Schlaegt das fehl, bleibt die alte Meldung als Rueckfall —
    // kaputt gehen kann dabei nichts, es wird nur geklickt.
    let terminalInput = doc.getElementById("terminal-input");
    if (!terminalInput) {
        try {
            const kandidaten = doc.querySelectorAll("div[role=button], li, button, a");
            for (let i = 0; i < kandidaten.length; i++) {
                const t = (kandidaten[i].textContent || "").trim();
                if (t === "Terminal") { kandidaten[i].click(); break; }
            }
        } catch (e) { /* Reiterwechsel ist Kuer, nicht Pflicht */ }
        // React braucht einen Takt, bis das Eingabefeld im DOM steht.
        for (let versuch = 0; versuch < 20 && !terminalInput; versuch++) {
            await ns.sleep(50);
            terminalInput = doc.getElementById("terminal-input");
        }
    }
    if (!terminalInput) {
        ns.tprint("WARN  [SCAN] Terminal nicht erreichbar - der Reiterwechsel hat nicht geklappt. "
            + "Bitte von Hand auf den Terminal-Reiter wechseln und den Knopf erneut druecken.");
        return;
    }
    const terminalEventHandlerKey = Object.keys(terminalInput)[1];

    function terminalInsert(html) {
        const term = doc.getElementById("terminal");
        if (!term) return false;
        term.insertAdjacentHTML("beforeend", "<li>" + html + "</li>");
        return true;
    }

    // React-Props DIREKT aufrufen (kein dispatchEvent) -> Watchdog-sicher.
    async function setNavCommand(inputValue) {
        try {
            terminalInput.value = inputValue;
            terminalInput[terminalEventHandlerKey].onChange({ target: terminalInput });
            terminalInput.focus();
            await terminalInput[terminalEventHandlerKey].onKeyDown({ key: "Enter", preventDefault: () => 0 });
        } catch (e) { /* Klick verwerfen, Karte bleibt stehen */ }
    }

    const myHackLevel = ns.getHackingLevel();

    // 2 GB. Notwendig fuer backdoorInstalled - ohne das gaebe es keine
    // [backdoor]-Marken, und genau die sind der Nutzen dieser Karte.
    function getServerInfo(serverName) {
        try { return ns.getServer(serverName); } catch (e) { return null; }
    }

    function createServerEntry(serverName) {
        const server = getServerInfo(serverName);
        if (!server) return "<span>" + serverName + " (nicht lesbar)</span>";
        const requiredHackLevel = server.requiredHackingSkill;
        const rooted = server.hasAdminRights;
        const canHack = requiredHackLevel <= myHackLevel;
        const shouldBackdoor = !server.backdoorInstalled && canHack && serverName !== "home"
            && rooted && !server.purchasedByPlayer;
        let contracts = [];
        try { contracts = ns.ls(serverName, ".cct"); } catch (e) { contracts = []; }
        const isFaction = factionServers.includes(serverName);

        // (moneyMax ?? 0) > 0 - die Klammern sind der Bugfix (siehe Kopf).
        const hasMoney = (server.moneyMax ?? 0) > 0;
        const hasRam = (server.maxRam ?? 0) > 0;

        let out = "<span id=\\"" + serverName + "\\">"
            + "<a class=\\"server" + (isFaction ? " faction" : "") + (rooted ? " rooted" : "") + "\\">"
            + serverName + "</a>"
            + (server.purchasedByPlayer ? ""
                : " <span class=\\"hack " + (canHack ? "green" : "red") + "\\">(" + requiredHackLevel + ")</span>")
            + (shouldBackdoor
                ? " <span class=\\"" + (isFaction ? "faction " : "") + "backdoor\\">[<a>backdoor</a>]</span>" : "")
            + " " + contracts.map(c => "<span class=\\"cct\\" title=\\"" + c + "\\">@</span>").join("");

        if (showStats) {
            const money = (hasMoney
                ? (formatMoney(server.moneyAvailable ?? 0, 1).padStart(7) + " / "
                    + formatMoney(server.moneyMax ?? 0, 1).padStart(7) + " ")
                : "".padStart(18)).padEnd(18);
            const sec = ("Sec: " + formatNumber(server.hackDifficulty ?? 0, 0).padStart(3)
                + "/" + formatNumber(server.minDifficulty ?? 0, 0) + " ").padEnd(13);
            const ram = "RAM: " + formatRam(server.maxRam ?? 0).padStart(6)
                + (hasRam ? " (" + ((server.ramUsed * 100) / server.maxRam).toFixed(1) + "% belegt)" : "");
            out += " <span class=\\"serverStats\\">... Money: " + money + sec + ram + "</span>";
        }
        return out + "</span>";
    }

    function buildOutput(parent, prefix) {
        if (parent === undefined) parent = servers[0];
        if (prefix === undefined) prefix = ["\\n"];
        let output = prefix.join("") + createServerEntry(parent);
        if (showStats) {   // Statistik-Spalte grob rechtsbuendig ausrichten
            const backdoorLen = output.includes("backdoor") ? 11 : 0;
            const atCount = (output.match(/@/g) || []).length;
            const lvlMatch = (output.match(/\\(\\d+\\)/g) || [{ length: -1 }])[0].length + 1;
            const expectedLength = parent.length + (2 * prefix.length) + backdoorLen + atCount + lvlMatch;
            output = output.replace("...", ".".repeat(Math.max(1, 60 - expectedLength)));
        }
        for (let i = 0; i < servers.length; i++) {
            if (parentByIndex[i] !== parent) continue;
            const newPrefix = prefix.slice();
            const appearsAgain = parentByIndex.slice(i + 1).includes(parentByIndex[i]);
            const lastElementIndex = newPrefix.length - 1;
            newPrefix.push(appearsAgain ? "\\u251c\\u2574" : "\\u2514\\u2574");
            newPrefix[lastElementIndex] = newPrefix[lastElementIndex]
                .replace("\\u251c\\u2574", "\\u2502 ").replace("\\u2514\\u2574", "  ");
            output += buildOutput(servers[i], newPrefix);
        }
        return output;
    }

    function ordering(serverA, serverB) {
        // Kleinere Teilbaeume nach oben.
        let orderNumber = treeDepth[serverA] - treeDepth[serverB];
        if (orderNumber === 0) orderNumber = ns.scan(serverA).length - ns.scan(serverB).length;
        if (orderNumber === 0) {
            const a = getServerInfo(serverA), b = getServerInfo(serverB);
            orderNumber = (b && b.purchasedByPlayer ? 1 : 0) - (a && a.purchasedByPlayer ? 1 : 0);
        }
        // Nur die ersten 2 Zeichen vergleichen, damit gekaufte Server in
        // Kaufreihenfolge stehen bleiben.
        if (orderNumber === 0) {
            orderNumber = serverA.slice(0, 2).toLowerCase().localeCompare(serverB.slice(0, 2).toLowerCase());
        }
        return orderNumber;
    }

    // CSS neu setzen (falls es sich geaendert hat)
    const old = doc.getElementById("scanCSS");
    if (old) old.remove();
    doc.head.insertAdjacentHTML("beforeend", css);

    // Erster Durchlauf: Tiefe jedes Teilbaums bestimmen (nur zum Sortieren).
    const treeDepth = {};
    function getTreeDepth(server, stack) {
        if (stack === undefined) stack = [];
        stack.push(server);
        const connected = ns.scan(server).filter(s => !stack.includes(s));
        if (connected.length === 0) { treeDepth[server] = 0; return 0; }
        const maxSub = 1 + Math.max(...connected.map(s => getTreeDepth(s, stack)));
        treeDepth[server] = maxSub;
        return maxSub;
    }
    getTreeDepth("home");

    // Zweiter Durchlauf: Reihenfolge + connect-Ketten sammeln.
    const servers = ["home"];
    const parentByIndex = [""];
    const routes = { home: "home" };
    for (const server of servers) {
        for (const next of ns.scan(server).sort(ordering)) {
            if (servers.includes(next)) continue;
            const info = getServerInfo(next);
            servers.push(next);
            parentByIndex.push(server);
            routes[next] = (info && info.backdoorInstalled)
                ? "connect " + next
                : routes[server] + ";connect " + next;
        }
    }

    if (!terminalInsert("<div class=\\"serverscan new\\">" + buildOutput() + "</div>")) {
        ns.tprint("WARN  [SCAN] Terminal-Ausgabe nicht gefunden.");
        return;
    }
    doc.querySelectorAll(".serverscan.new .server").forEach(entry => entry
        .addEventListener("click", setNavCommand.bind(null, routes[entry.childNodes[0].nodeValue])));
    doc.querySelectorAll(".serverscan.new .backdoor").forEach(btn => btn
        .addEventListener("click", setNavCommand.bind(
            null, routes[btn.parentNode.childNodes[0].childNodes[0].nodeValue] + ";backdoor")));
    const fresh = doc.querySelector(".serverscan.new");
    if (fresh) fresh.classList.remove("new");
}
`;

const SRC_LOGVIEW = `/**
 * SCHWARM-LOGVIEW.js (Payload, Dauerlaeufer, Schalter im Dashboard)  v1.1
 *
 * Zeigt den JEWEILS NEUESTEN DIAG-Report in einem eigenen Tail-Fenster,
 * eingefaerbt nach Zustand: gruen laeuft, gelb ansehen, rot kaputt, blau Zahlen.
 *
 * WARUM EIN EIGENES FENSTER UND NICHT DAS VON DIAG:
 *   DIAGs Tail zeigt seine Arbeitsmeldungen ("Zyklus 3: 28 Samples"), nicht den
 *   Report. Und im Dauerlauf schreibt DIAG jeden Lauf in eine eigene Datei
 *   (SCHWARM-REPORT-<lfd>.txt), die die Bruecke abholt. Ein Fenster, das die
 *   Datei liest, ueberlebt diesen Wechsel; ein Blick in DIAGs Log nicht.
 *
 * WARUM EIN print MIT ZEILENUMBRUECHEN UND NICHT VIELE:
 *   Die Engine haelt pro Skript nur Settings.MaxLogCapacity Eintraege (Vorgabe
 *   50, siehe Script/RunningScript.ts:109) - ein Report mit 600 Zeilen waere
 *   also fast vollstaendig abgeschnitten. Ein einziger print mit Umbruechen ist
 *   EIN Eintrag, und das Tail-Fenster rendert ihn mit "white-space: pre-wrap"
 *   (ui/React/LogBoxManager.tsx:171) trotzdem als viele Zeilen. Deshalb steht
 *   hier bewusst genau ein print pro Neuzeichnung.
 *
 * WARUM DIE FARBEN HIER ENTSTEHEN UND NICHT IN DIAG:
 *   Die Reportdatei bleibt so reiner Text. Die Bruecke legt sie auf dem PC ab,
 *   und dort will niemand Steuerzeichen im Editor sehen. Ausserdem bleibt DIAG
 *   unangetastet - Messen und Anzeigen sind zwei Aufgaben.
 *
 * WORAN DIE FARBEN HAENGEN - KEINE GERATENEN STICHWOERTER:
 *   DIAG hat eine eigene Sprache fuer Urteile, und genau die wird gelesen:
 *     "!!"              -> DIAG markiert damit SELBST jeden Problemfall
 *                          (SCHWARM-DIAG.js:1360-1368: "!! FEHLT - nie gesehen",
 *                          "!! instabil", "!! Neustart-Schleife",
 *                          "!! AUS, laeuft aber").
 *     "ok" am Zeilenende, "aus (gewollt)", "ruht", "One-Shot lief"
 *                       -> die Sollzustaende aus derselben Stelle.
 *     "wartet", "frisch gestartet", "Hinweis:"
 *                       -> weder Fehler noch Normalbetrieb.
 *   Abschnitt 8 BEFUNDE ist die Fundliste. Sie ist NICHT pauschal rot: DIAG
 *   legt dort auch Beruhigungen ab, etwa "wartet auf SING. Das ist korrektes
 *   Verhalten, kein Fehler." (SCHWARM-DIAG.js:1401). Solche Zeilen sind gelb.
 *
 * WARUM DIE FARBLOGIK AUSSERHALB VON main STEHT:
 *   Damit die Pruefleiste sie mit einem echten Report fuettern kann, ohne das
 *   Spiel zu starten. Eine Farbregel, die man nicht gegen echte Berichte
 *   halten kann, ist geraten - und geratene Farben sind schlimmer als keine.
 *
 * RAM: Grundlast 1.60 + ns.ls 0.20 = 1.80 GB, von der Engine bestaetigt.
 * Alles aus ns.ui kostet nichts (Netscript/RamCostGenerator.ts:440-443).
 * Kein Import, keine deps.
 */

const PRAEFIX = "SCHWARM-REPORT-";
const TAKT_MS = 5000;

// ---------------------------------------------------------------------------
// FARBEN. Das Tail-Fenster wertet ANSI-Folgen aus: LogBoxManager reicht jede
// Zeile durch ANSIITypography (LogBoxManager.tsx:415), und die Form
// ESC[38;2;r;g;b m erlaubt freie RGB-Werte (ANSIITypography.tsx, Zweig
// "codePart === 38"). Deshalb hier dieselben Toene wie im Dashboard - der
// Schwarm soll ueberall gleich aussehen.
//
// Das ESC-Zeichen kommt aus fromCharCode und nicht als Backslash-Folge: dieser
// Payload reist als Zeichenkette durch SCHWARM-PAYLOADS.js, und jeder
// Backslash auf dem Weg ist eine Fehlerquelle mehr.
//
// Reines Blau (#0000ff) waere auf schwarzem Grund kaum lesbar - deshalb ein
// helles Blau statt des ANSI-Standardtons.
// ---------------------------------------------------------------------------
const ESC   = String.fromCharCode(27);
const AUS   = ESC + "[0m";
const GRUEN = ESC + "[38;2;0;255;102m";
const GELB  = ESC + "[38;2;255;204;0m";
const ROT   = ESC + "[38;2;255;68;68m";
const BLAU  = ESC + "[38;2;90;170;255m";

/** Besteht die Zeile nur aus diesem einen Zeichen? (Trennlinien) */
function nurAus(s, zeichen) {
    if (!s.length) return false;
    for (let i = 0; i < s.length; i++) { if (s[i] !== zeichen) return false; }
    return true;
}
function hat(s, teil) { return s.indexOf(teil) >= 0; }
function istZiffer(c) { return c >= "0" && c <= "9"; }

/**
 * Eine Reportzeile einfaerben.
 * Reihenfolge ist Absicht: Rot vor Gelb vor Gruen. Eine Zeile, die BEIDES
 * traegt ("!! instabil (27/30)" neben einem "ok" weiter vorn), muss als
 * Problem durchkommen.
 *
 * @param {string} zeile     Rohzeile
 * @param {boolean} inBefund Steht die Zeile im Fundblock?
 * @returns {string|null}    Farbcode oder null fuer "unveraendert lassen"
 */
function farbeFuer(zeile, inBefund) {
    const t = zeile.trim();
    if (!t.length) return null;

    // --- Rahmen -> blau ---------------------------------------------------
    if (nurAus(t, "=") || nurAus(t, "-")) return BLAU;
    if (t.slice(0, 3) === "== ") return BLAU;              // "== 4b BACKDOOR =="
    if (t.slice(0, 4) === "KEY ") return BLAU;             // Spaltenkopf der Daemon-Tabelle
    if (t.slice(0, 8) === "Legende:") return BLAU;

    // --- Fundblock --------------------------------------------------------
    // Nicht pauschal rot: DIAG legt dort auch ausdrueckliche Entwarnungen ab.
    // Die sind gelb, weil man sie gelesen haben soll, aber nichts kaputt ist.
    if (inBefund) {
        if (hat(t, "kein Fehler") || hat(t, "korrektes Verhalten") || hat(t, "Normalfall")) return GELB;
        if (istZiffer(t[0])) return ROT;
        return null;
    }

    // --- Rot: was DIAG selbst als Problem markiert -------------------------
    if (hat(t, "!!")) return ROT;
    if (hat(t, "FEHLT")) return ROT;
    if (hat(t, "Absturz")) return ROT;

    // --- Gelb: weder Fehler noch Normalbetrieb -----------------------------
    if (hat(t, "Hinweis")) return GELB;
    if (hat(t, "wartet")) return GELB;
    if (hat(t, "frisch gestartet")) return GELB;
    if (hat(t, "nicht im Fenster")) return GELB;

    // --- Gruen: die Sollzustaende aus SCHWARM-DIAG.js:1352-1369 ------------
    if (t.slice(-3) === " ok" || t === "ok") return GRUEN;
    if (hat(t, "aus (gewollt)")) return GRUEN;
    if (hat(t, "ruht")) return GRUEN;
    if (hat(t, "One-Shot lief")) return GRUEN;
    if (hat(t, "durch (One-Shot")) return GRUEN;
    if (hat(t, "Queen läuft") || hat(t, "Queen laeuft")) return GRUEN;

    // --- Zahlenlastige Zeilen -> blau --------------------------------------
    // Eine Messzeile erkennt man nicht am ersten Zeichen, sondern daran, dass
    // sie ueberwiegend aus Zahlen besteht. "prep  3.7T .. 3.7T (Ø 3.7T)" faengt
    // mit einem Buchstaben an und ist trotzdem reine Statistik.
    //
    // AUSGENOMMEN sind Logbuchzeilen ("[ 12.1s 16:32:05] PROZESS + GO gestartet").
    // Die tragen wegen des Zeitstempels viele Ziffern, berichten aber
    // EREIGNISSE. Blau wuerde dort behaupten, es seien Messwerte.
    if (t[0] !== "[") {
        let ziffern = 0;
        let feste = 0;
        for (let i = 0; i < t.length; i++) {
            const c = t[i];
            if (c === " ") continue;
            feste++;
            if (istZiffer(c)) ziffern++;
        }
        // Mindestens drei Ziffern und mindestens ein Fuenftel des Zeichenvorrats.
        // Die Untergrenze haelt Fliesstext heraus, in dem einmal eine Zahl steht.
        if (ziffern >= 3 && ziffern * 5 >= feste) return BLAU;
    }
    // Kurze Zahlenzeilen wie "2 QUEEN_IN  —" haben zu wenige Ziffern fuer die
    // Regel oben, gehoeren aber zum Portabzug.
    if (istZiffer(t[0])) return BLAU;

    return null;
}

/**
 * Ganzen Report einfaerben und dabei zaehlen, wie viel Aufmerksamkeit er
 * verlangt.
 *
 * JEDE Zeile bekommt vorn entweder eine Farbe oder ein Zuruecksetzen. Ohne das
 * Zuruecksetzen liefe die Farbe der Vorzeile einfach weiter - ANSI faerbt bis
 * zur naechsten Anweisung, nicht bis zum Zeilenende.
 *
 * @param {string} inhalt Reporttext
 * @returns {{text: string, rot: number, gelb: number}}
 */
function einfaerben(inhalt) {
    const zeilen = inhalt.split("\\n");
    const raus = [];
    let inBefund = false;
    let befundKommt = false;
    let rot = 0;
    let gelb = 0;

    for (const zeile of zeilen) {
        const t = zeile.trim();

        // Blockgrenzen. Die Ueberschrift "8  BEFUNDE" steht zwischen zwei
        // Trennlinien - der Block beginnt also erst hinter der zweiten. Die
        // Kurzform "BEFUNDE:" (Delta-Zyklen) beginnt sofort.
        if (hat(t, "BEFUNDE") && !inBefund) {
            if (t === "BEFUNDE:") { inBefund = true; }
            else { befundKommt = true; }
        } else if (befundKommt && nurAus(t, "=")) {
            inBefund = true;
            befundKommt = false;
        } else if (inBefund && (!t.length || nurAus(t, "="))) {
            inBefund = false;
        }

        const f = farbeFuer(zeile, inBefund);
        if (f === ROT) rot++;
        else if (f === GELB) gelb++;
        raus.push((f || AUS) + zeile);
    }
    return { text: raus.join("\\n") + AUS, rot: rot, gelb: gelb };
}

/**
 * Kopfzeile mit Ampel und Legende.
 * @param {string} hinweis Welche Datei, welcher Lauf
 * @param {number} rot     Anzahl roter Zeilen
 * @param {number} gelb    Anzahl gelber Zeilen
 * @returns {string}
 */
function kopfBauen(hinweis, rot, gelb) {
    let ampel;
    if (rot > 0) {
        ampel = ROT + "* " + rot + " fehlerhaft";
        if (gelb > 0) ampel += GELB + "   * " + gelb + " zu pruefen";
    } else if (gelb > 0) {
        ampel = GELB + "* " + gelb + " zu pruefen";
    } else {
        ampel = GRUEN + "* nichts Auffaelliges";
    }
    return BLAU + hinweis + AUS + "\\n"
        + ampel + AUS + "\\n"
        + GRUEN + "* laeuft  " + GELB + "* ansehen  " + ROT + "* kaputt  "
        + BLAU + "* Zahlen" + AUS + "\\n"
        + BLAU + "-".repeat(78) + AUS;
}

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.ui.setTailTitle("SCHWARM - LOGBUCH");
    // Ein gekillter Prozess laesst sein Fenster sonst offen stehen.
    ns.atExit(() => { try { ns.ui.closeTail(); } catch (e) { /* egal */ } });
    // resizeTail ERST NACH EINER PAUSE. openTail schickt nur ein Ereignis los;
    // das Fenster baut React danach selbst. resizeTail greift aber auf
    // runningScriptObj.tailProps zu - und das entsteht erst mit dem Fenster
    // (NetscriptFunctions/UserInterface.ts:76-88, "tailProps?.setSize"). Direkt
    // hintereinander aufgerufen verpufft die Groesse also STILL, weil das
    // Fragezeichen den Fehler schluckt. setTailTitle ist davon nicht betroffen:
    // es schreibt in runningScriptObj.title und braucht das Fenster nicht.
    await ns.sleep(250);
    ns.ui.resizeTail(1000, 760);

    let zuletztName = "";
    let zuletztInhalt = "";
    let zuletztHinweis = "";

    while (true) {
        let name = "";
        let hoechste = -1;
        // ns.ls filtert per Teilzeichenkette, nicht per Praefix - deshalb wird
        // unten noch einmal geprueft.
        for (const f of ns.ls("home", "SCHWARM-REPORT")) {
            // Laufende Nummer aus dem Dateinamen. BEWUSST OHNE regulaeren
            // Ausdruck: der Payload wird als Zeichenkette transportiert, und
            // jeder Backslash darin ist eine Fehlerquelle mehr.
            let n = -1;
            if (f.indexOf(PRAEFIX) === 0 && f.slice(-4) === ".txt") {
                const rest = f.slice(PRAEFIX.length, f.length - 4);
                const z = Number(rest);
                if (rest.length && isFinite(z)) n = z;
            }
            if (n > hoechste) { hoechste = n; name = f; }
        }
        // Kein nummerierter Report da? Dann laeuft DIAG im Auftragsmodus und
        // schreibt in die gemeinsame Datei.
        if (hoechste < 0) {
            const alt = ns.ls("home", "SCHWARM-REPORT.txt");
            name = alt.length ? "SCHWARM-REPORT.txt" : "";
        }

        let inhalt = "";
        if (name) { try { inhalt = ns.read(name); } catch (e) { inhalt = ""; } }

        // Leer gelesen heisst fast immer: DIAG schreibt gerade. Alten Stand
        // stehen lassen, statt ein leeres Fenster zu zeigen.
        if (name && inhalt) {
            const hinweis = hoechste >= 0
                ? "  Lauf " + hoechste + "  |  " + name
                : "  " + name + "  |  Auftragsmodus (DIAG laeuft nicht endlos)";
            if (name !== zuletztName || inhalt !== zuletztInhalt) {
                const g = einfaerben(inhalt);
                ns.clearLog();
                ns.print(kopfBauen(hinweis, g.rot, g.gelb) + "\\n" + g.text);
                zuletztName = name;
                zuletztInhalt = inhalt;
                zuletztHinweis = hinweis;
            }
        } else if (!zuletztInhalt) {
            // Noch nie etwas gesehen - erklaeren statt leer bleiben.
            if (zuletztHinweis !== "wartet") {
                ns.clearLog();
                ns.print(BLAU + "  SCHWARM - LOGBUCH" + AUS + "\\n" + BLAU + "-".repeat(78) + AUS
                    + "\\n\\n  Noch kein Report da."
                    + "\\n\\n  DIAG als Dauerlaeufer starten:"
                    + "\\n    run SCHWARM-DIAG.js 60 2000 0 10"
                    + "\\n  (Fenster 60 s, Messtakt 2000 ms, 0 = endlos, alle 10 min)"
                    + "\\n\\n  Oder DIAG im Dashboard einschalten - die Registry"
                    + "\\n  startet ihn mit genau diesen Werten.");
                zuletztHinweis = "wartet";
            }
        } else if (!name) {
            // Der gezeigte Report wurde abgeholt und geloescht, ein neuer ist
            // noch nicht fertig. Alten Stand behalten, aber ehrlich beschriften.
            // Ab Bruecke v1.7 ist das der Ausnahmefall: sie laesst den juengsten
            // Bericht liegen und raeumt nur die aelteren weg.
            const marke = zuletztHinweis + "  [abgeholt]";
            if (zuletztHinweis.slice(-12) !== "  [abgeholt]") {
                const g = einfaerben(zuletztInhalt);
                ns.clearLog();
                ns.print(kopfBauen(marke, g.rot, g.gelb) + "\\n" + g.text);
                zuletztHinweis = marke;
            }
        }

        await ns.sleep(TAKT_MS);
    }
}
`;

const PAYLOADS = {
    WORKER_W:         { file: "schwarm-w.js",        src: SRC_WEAKEN },  // schwarm-w.js = WEAKEN
    WORKER_WL:        { file: "schwarm-wl.js",       src: SRC_WEAKEN_LONG }, // XP-Dauerlaeufer [v12.0]
    WORKER_G:         { file: "schwarm-g.js",        src: SRC_GROW },    // schwarm-g.js = GROW
    WORKER_H:         { file: "schwarm-h.js",        src: SRC_HACK },    // schwarm-h.js = HACK
    WORKER_S:         { file: "schwarm-s.js",        src: SRC_SHARE },   // schwarm-s.js = SHARE  [NEU v3.0]
    SOLVER:           { file: "schwarm-solver.js",   src: SRC_SOLVER },
    BACKDOOR_PAYLOAD: { file: "SCHWARM-BACKDOOR.js", src: SRC_BACKDOOR },
    GO:              { file: "SCHWARM-GO.js"             , src: SRC_GO },
    TRADER:          { file: "SCHWARM-TRADER.js"         , src: SRC_TRADER },
    BLADEBURNER:     { file: "SCHWARM-BLADEBURNER.js"    , src: SRC_BLADEBURNER },
    GANGS:           { file: "SCHWARM-GANG.js"           , src: SRC_GANG },
    AUGS:            { file: "SCHWARM-AUGS.js"           , src: SRC_AUGS },
    BITNODE:         { file: "SCHWARM-BITNODE.js"        , src: SRC_BITNODE },
    RESET:           { file: "SCHWARM-RESET.js"          , src: SRC_RESET },
    SCAN:            { file: "SCHWARM-SCAN.js"           , src: SRC_SCAN },
    STANEK:          { file: "SCHWARM-STANEK.js"         , src: SRC_STANEK },
    LOGVIEW:         { file: "SCHWARM-LOGVIEW.js"        , src: SRC_LOGVIEW },
};

/** Liste aller vorhandenen Payload-Schluessel. */
export function payloadKeys() { return Object.keys(PAYLOADS); }

/** Ist ein Payload-Schluessel vorhanden? */
export function hasPayload(key) { return key in PAYLOADS; }

/** Dateiname eines Payloads (ohne zu materialisieren), oder null. */
export function payloadFile(key) { return PAYLOADS[key] ? PAYLOADS[key].file : null; }

/**
 * Payload materialisieren: dekodieren + auf Platte schreiben.
 * ns.write schreibt IMMER auf den Host, auf dem der aufrufende Daemon laeuft.
 *   - Besitzer auf home (Queen/BANK/WORK): schreibt nach home; danach via
 *     HELPERS.deployDaemon deployen (scp home -> Zielhost + exec).
 *   - Dispatcher auf pserv: schreibt lokal; optional host-Param -> scp auf Ziel.
 * RAM (Importer): ns.write (0) + ns.scp (~0). Nur bei Angabe von host wird gescp't.
 * @param {NS} ns
 * @param {string} key    Payload-Schluessel.
 * @param {string} [host] Optionaler Zielhost; wenn != aktueller Host, wird gescp't.
 * @returns {string|null} Dateiname oder null bei unbekanntem Schluessel/Fehler.
 */
/**
 * v0.20 — STEMPEL EINER NUTZLAST, OHNE SIE ZU SCHREIBEN.
 *
 * Wozu: Ein laufender Bitburner-Prozess behaelt seinen Code. Wird eine Nutzlast
 * geaendert und die Datei neu geschrieben, laeuft der bereits gestartete Daemon
 * WEITER MIT DEM ALTEN STAND — bis ihn jemand neu startet. Das ist live
 * aufgefallen: nach dem Einspielen von TRADER v1.6 musste der Daemon von Hand
 * aus- und wieder eingeschaltet werden, sonst handelte weiter v1.5.
 *
 * Die Queen merkt sich beim Start den Stempel und vergleicht ihn spaeter mit
 * dem aktuellen. Weichen sie ab, laeuft dort alter Code.
 *
 * Der Stempel wird ueber den FERTIGEN Code gebildet (dekodiert und mit
 * eingesetzten Ports), nicht ueber die Quelle: nur der fertige Code landet im
 * Prozess. Eine Portnummer-Aenderung muss also genauso einen Neustart ausloesen
 * wie eine Codeaenderung.
 *
 * Verfahren: Laenge plus eine 32-Bit-Rollsumme (djb2). Bewusst KEINE
 * kryptografische Pruefsumme — es geht um "hat sich etwas geaendert", nicht um
 * Faelschungssicherheit, und die Funktion laeuft in einem 2-Sekunden-Takt.
 *
 * @param {NS} ns
 * @param {string} key  Payload-Schluessel
 * @returns {string|null} Stempel, oder null bei unbekanntem Schluessel/Fehler
 */
export function payloadStamp(ns, key) {
    const p = PAYLOADS[key];
    if (!p) return null;
    try {
        const code = injectPorts(decodePayload(p.src));
        let h = 5381;
        for (let i = 0; i < code.length; i++) {
            h = (((h << 5) + h) ^ code.charCodeAt(i)) >>> 0;   // djb2-xor
        }
        return code.length + ":" + h.toString(36);
    } catch (e) {
        try { ns.print("ERR payloadStamp " + key + ": " + String(e)); } catch (e2) {}
        return null;
    }
}

export function materialize(ns, key, host) {
    const p = PAYLOADS[key];
    if (!p) { try { ns.print("WARN materialize: unbekannter Payload '" + key + "'"); } catch (e) {} return null; }
    try {
        // v4.0: ZWEI Schritte statt einem.
        //   decodePayload  — macht die kollisionsfreie Kodierung rueckgaengig
        //                    (__SCHWARM_BT__ -> Backtick, __SCHWARM_DC__ -> ${).
        //   injectPorts    — setzt die Marke __PORTS__ durch die AKTUELLE
        //                    Port-Tabelle aus SCHWARM-HELPERS.js.
        // Der zweite Schritt ist der Grund, warum ein Payload keine eigene
        // Portnummer mehr besitzt. Genau solche gespiegelten Nummern haben
        // zweimal eine Kollision erzeugt (Port 19, Port 34) — beide Male, weil
        // eine Zahl an zwei Orten gepflegt werden musste und einer vergessen
        // wurde. Payloads ohne Ports (die vier Worker) tragen keine Marke; dort
        // ist injectPorts ein No-Op.
        const code = injectPorts(decodePayload(p.src));

        // Waechter gegen eine Fehlerklasse, die genau einmal zu viel passiert
        // ist: SRC_GO benutzte SCHWARM_PORTS.GO_OUT, trug aber keine Marke
        // /*__PORTS__*/. injectPorts ist ohne Marke ein No-Op, also war
        // SCHWARM_PORTS im fertigen Skript nie definiert. Der ReferenceError
        // landete in einem leeren catch — GO spielte stundenlang fehlerfrei
        // und meldete kein einziges Mal etwas. Diese zwei Zeilen haetten das
        // beim ersten Materialisieren aufgedeckt.
        if (code.indexOf("SCHWARM_PORTS.") !== -1 && code.indexOf("const SCHWARM_PORTS =") === -1) {
            try {
                ns.tprint("ERROR [PAYLOADS] '" + key + "' benutzt SCHWARM_PORTS, hat aber keine "
                    + "/*__PORTS__*/-Marke — jeder Portzugriff wirft dort einen ReferenceError.");
            } catch (e2) { /* dann eben nur der Rueckgabewert */ }
        }

        // v0.20: NUR schreiben, wenn sich wirklich etwas geaendert hat.
        // Script.ts:36 verwirft bei jeder Zuweisung mit ABWEICHENDEM Inhalt das
        // uebersetzte Modul (invalidateModule) — bei gleichem Inhalt kehrt es
        // sofort zurueck. Das unbedingte Schreiben war also entweder wirkungslos
        // oder es hat bei jedem Start eine Neuuebersetzung erzwungen. Und ohne
        // diesen Vergleich konnte niemand feststellen, OB sich eine Nutzlast
        // geaendert hat — genau das braucht die Queen, um einen laufenden
        // Daemon mit veraltetem Code neu zu starten.
        let alt = null;
        try { alt = ns.read(p.file); } catch (e) { alt = null; }
        if (alt !== code) ns.write(p.file, code, "w");
        if (host && host !== ns.getHostname()) ns.scp(p.file, host, ns.getHostname());
        return p.file;
    } catch (e) {
        try { ns.print("ERR materialize " + key + ": " + String(e)); } catch (e2) {}
        return null;
    }
}
