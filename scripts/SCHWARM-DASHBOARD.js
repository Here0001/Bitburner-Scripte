/**
 * SCHWARM-DASHBOARD.js — v6.1
 *
 * v6.1 — DER DAEDALUS-HINWEIS NENNT BEIDE WEGE. "manuell im Bladeburner-UI"
 *   liess glauben, es gehe per Skript nicht. Es geht: Plan-Freigabe
 *   (WEG: daedalus) -> BLADEBURNER startet Daedalus -> BITNODE beendet die
 *   Node. Am 24.09.2026 in der Testumgebung bewiesen (BN14 -> BN15).
 *
 * v6.0 — AKTIVITAETS-LAUSCHER UND DER AUTO-KNOPF.
 *   Gefragt war, Terminal-Eingaben, Schalterdrucke und von Hand getaetigte
 *   Kaeufe zu erkennen. Jede Sorte einzeln nachzuweisen waere teuer und
 *   zerbrechlich — aber sie haben alle dieselbe Voraussetzung: eine Eingabe
 *   im Spielfenster. EIN Lauscher am Dokument (keydown/mousedown/wheel)
 *   erfasst deshalb alle drei auf einmal, auch die Faelle, an die niemand
 *   gedacht hat. Kosten: null, weil einmalig gesetzt und auf eine Meldung
 *   je 5 s gedrosselt.
 *
 *   Dazu der Knopf AUTO an der Stelle, an der STANEK verschwunden ist. Sein
 *   Tooltip nennt die Restzeit bis zur Selbstverwaltung.
 *
 * v5.9 — BITNODE-KNOPF, UND ER BLINKT.
 *   Neuer Schalter fuer den Daemon, der den Durchlauf beendet. Er hat einen
 *   eigenen Farbzweig, weil der Standardzweig hier zweimal falsch laege.
 *
 *   DAS BLINKEN HAENGT AN DER LAGE, NICHT AM SCHALTER. "Uebergang moeglich"
 *   ist eine Eigenschaft des Spielstands: alle BlackOps durch (blade-Block,
 *   nextBlackOp === null) — genau die Bedingung, die destroyW0r1dD43m0n
 *   akzeptiert. Auch bei AUSGESCHALTETEM Daemon soll man das sehen, denn dann
 *   kann man von Hand beenden. Wer nur den Schalter faerbt, verschweigt die
 *   halbe Information — derselbe Fehler wie beim grauen RESET-Knopf in v5.5.
 *
 *   Gelb/rot im Wechsel alle 800 ms, gesteuert ueber die Uhr und nicht ueber
 *   einen Zaehler: so blinkt es auch weiter, wenn eine Aktualisierung ausfaellt.
 *
 * v5.8 — DIE BRUECKE IST JETZT SICHTBAR.
 *   Bisher liess sich im Spiel nicht erkennen, ob SCHWARM-BRUECKE.ps1 auf dem
 *   PC ueberhaupt noch laeuft. Fiel die Aufgabenplanung aus, merkte man es
 *   erst, wenn Stunden spaeter Berichte fehlten.
 *
 *   Direkt abfragen geht nicht: der Verbindungszustand der Remote-API
 *   ("Online" / "Offline" / "Reconnecting") entsteht in
 *   RemoteFileAPI/RemoteFileAPI.ts:20 und wird ueber
 *   RemoteFileApiConnectionEvents ausschliesslich an die Oberflaeche verteilt.
 *   In den Netscript-Funktionen taucht er nirgends auf.
 *
 *   Also andersherum: die Bruecke legt ab v2.2 nach jedem geglueckten Lauf
 *   SCHWARM-BRUECKE-STATUS.txt ab. Das Dashboard liest den Zeitstempel und
 *   zeigt Ampel, vergangene Zeit und die Zeit bis zum naechsten Lauf.
 *
 *   Der Punkt daran ist, dass die Datei NICHT LUEGEN KANN. Sie kommt nur an,
 *   wenn eine Verbindung bestand — ihr Alter ist die Aussage, nicht ihr
 *   Inhalt. Ein Statusfeld, das jemand auf "Online" setzt, waere wertlos.
 *
 *   Zweite Zeile: das Ergebnis von SCHWARM-PRUEFER.pl, das die Bruecke
 *   mitschickt. Bewusst ein EIGENER Punkt — der erste beantwortet "steht die
 *   Verbindung?", der zweite "ist der Quelltext sauber?". Zwei Fragen in eine
 *   Ampel zu pressen macht beide unlesbar.
 *
 * v5.7 — DIE HNS-BESCHRIFTUNG WAR EINE BEHAUPTUNG VON GESTERN.
 *   Unter dem Hacknet-Balken stand fest "HNS (eigener Pool — kein Worker-RAM)".
 *   Das stimmt, solange Hashes etwas wert sind: dann haelt der Dispatcher
 *   HN_HASH_RESERVE_FRAC frei. Sind Hashes wertlos, setzt er hnReserveFrac auf
 *   0 und nimmt die Server VOLLSTAENDIG in den Pool. Im Screenshot vom 06.09.
 *   waren sie zu 99,8 Prozent belegt, waehrend daneben "kein Worker-RAM" stand.
 *   Die Zeile nennt jetzt den tatsaechlichen Zustand.
 *
 * v5.6 — EINE FLACKERNDE ZEILE WURDE ZU ZWEI RUHIGEN.
 *   Die Overview-Zeile "Einnahmen" zeigte das NETTO und sprang staendig
 *   zwischen Plus und Minus, ohne dass sich am Betrieb etwas geaendert haette.
 *
 *   Der Grund liegt in der Natur der Zahlen, nicht in der Glaettung: Einnahmen
 *   tropfen stetig, AUSGABEN kommen stossweise. Ein Serverkauf von 50 Mio. in
 *   einem einzigen Takt ergibt, auf die Minute hochgerechnet, eine gewaltige
 *   negative Rate — die dann ueber die ganze Glaettung wieder abklingt. Ein
 *   Mittelwert aus zwei so verschiedenen Vorgaengen ist fuer beide falsch.
 *
 *   Jetzt gibt es ZWEI Zeilen. Die Einnahmen bleiben ruhig, weil Kaeufe sie
 *   nicht mehr beruehren; die Ausgaben DUERFEN ausschlagen, denn dort ist der
 *   Ausschlag die Information ("gerade wurde etwas gekauft"). Beide sind ueber
 *   rund eine Minute gemittelt (RATE_TAU_SLOW_MS) statt ueber 20 Sekunden.
 *
 *   Aufgeteilt wird am VORZEICHEN des Deltas, nicht an einer Feldliste: manche
 *   Felder sind immer negativ (servers, augmentations), andere haben eigene
 *   *_expenses-Felder (gang, hacknet), und "other" kann beides sein. Das
 *   Vorzeichen stimmt in jedem dieser Faelle. Das Feld "total" wird dabei
 *   uebersprungen — es ist die Summe der uebrigen und wuerde jeden Betrag ein
 *   zweites Mal zaehlen.
 *
 *   Das Netto ist nicht verschwunden: es steht als Kopfzeile in beiden
 *   Tooltips, zusammen mit der bisherigen Aufschluesselung je Quelle (die
 *   weiterhin die schnellere 20-s-Rate zeigt — dort will man sehen, was GERADE
 *   passiert). Die Ausgabenzeile blendet sich aus, solange nichts ausgegeben
 *   wird.
 *
 * v5.5 — RESET WAR IMMER GRAU, EGAL WIE DER SCHALTER STAND.
 *   v5.3 machte RESET vom Ausloeser zum An/Aus-Schalter — die FARBE blieb
 *   aber im One-Shot-Zweig, und der kennt nur "laeuft gerade" oder grau.
 *   RESET laeuft Sekundenbruchteile, also war der Knopf praktisch immer
 *   grau, und der Tooltip behauptete weiter "Klick startet sie".
 *   Am 05.09.2026 hat das echten Schaden gemacht: RESET stand auf aus,
 *   sichtbar war das nirgends, und BANK hing dadurch dauerhaft in der
 *   Reset-Phase fest (SCHWARM-BANK.js v4.5).
 *   RESET hat jetzt einen eigenen Farbzweig: gruen = scharf, grau = aus,
 *   cyan = installiert gerade. "Scharf" heisst nicht "laeuft" — den
 *   Install loest BANK aus, sobald die Aug-Runde durch ist.
 *
 * v5.4 — KNOPF LOGVIEW. Steht in MANAGED_ORDER direkt hinter DIAG, weil er
 *   dessen Ausgabe zeigt. Ein normaler An/Aus-Schalter: an oeffnet das
 *   Fenster, aus killt den Prozess und ns.atExit schliesst es wieder.
 *   Ohne den Eintrag in MANAGED_ORDER waere der Knopf zwar erschienen
 *   (der Nachzuegler-Zweig faengt neue Daemons ab), aber ganz am Ende.
 *
 * SCHWARM-DASHBOARD.js — v5.3
 *
 * v5.3 — DER RESET-KNOPF WAR EIN AUSLOESER, KEIN SCHALTER.
 *
 *   Er lief ueber den FORCE-Zweig fuer oneshotDaemon-Eintraege und setzte damit
 *   state=2. In der Queen steht "if (state[key] === 2) return true;" VOR dem
 *   RESET-Sonderfall (SCHWARM-QUEEN.js:379 vor :388) — ein Klick loeste also
 *   sofort installAugmentations() aus.
 *
 *   Der Spieler hielt den Knopf fuer wirkungslos: bis v5.1 setzte er nur
 *   state=1, und weil shouldRun fuer RESET zusaetzlich ein WANT verlangt,
 *   passierte sichtbar nichts ("blieb gelb haengen"). Seit v5.1 ist er scharf,
 *   ohne dass sich das Aussehen geaendert haette. Ein Bedienelement, das man
 *   fuer tot haelt und das in Wahrheit die folgenreichste Aktion des Schwarms
 *   ausloest, ist die gefaehrlichste Sorte.
 *
 *   Jetzt ein normaler An/Aus-Schalter, Regelfall "an":
 *     an  -> handleResetCycle darf anfordern, sobald BANK auf Port 19 meldet
 *     aus -> shouldRun bricht an isDaemonEnabled ab, kein Prestige
 *   Von Hand ausloesen geht nicht mehr, und das ist Absicht: der Anlass kommt
 *   von BANK. SCAN bleibt ein Ausloeser.
 *
 * SCHWARM-DASHBOARD.js — v5.2
 *
 * v5.2 — KINETIK: manip HATTE KEINE FARBE.
 *
 *   Der Dispatcher meldet acht Klassen auf Port 25 (core_w, core_g, core_h,
 *   prep, xp, share, manip, foreign), KIN_SEGMENTS kannte aber nur sieben.
 *   buildKineticSegments laeuft ueber diese Liste, also floss manip nie in
 *   classSum ein und schlug vollstaendig im Rest-Segment "sonstige" auf. Im
 *   Bericht vom 04.09. waren das 1,7 TB Kursbeeinflussung, ausgewiesen als
 *   "nicht zugeordnet" — obwohl der Dispatcher sie sauber gemessen hatte.
 *
 *   Jetzt: manip in hellblau als eigenes Segment. Dazu eine Wache — meldet der
 *   Dispatcher kuenftig eine Klasse ohne Segment, steht sie als Warnzeile unter
 *   der Legende, statt still in "sonstige" zu verschwinden.
 *
 *   Die Legende laesst leere Klassen jetzt weg. Mit zehn Segmenten stehen im
 *   Normalbetrieb mehrere auf 0 (share ohne Grind, manip ohne TRADER-Auftrag,
 *   core_h waehrend der Prep-Phase); Farben fuer nicht vorhandene Balken zu
 *   erklaeren macht die vorhandenen schwerer zu finden.
 *
 *   NICHT geaendert: "foreign" bleibt EIN Segment. Dort stecken alle
 *   Dauerdaemons, der Solver, Backdoor und Staneks Lader — einzeln waeren das
 *   Splitter von unter einem Balkenblock.
 *
 * v5.1 — RAM-Diät, strikte Gates, One-Shot-Knöpfe
 *
 * ===========================================================================
 * WAS SICH GEGENÜBER v5.0 ÄNDERT
 * ===========================================================================
 *
 * A) RAM VON 22,90 GB AUF ~6,90 GB. Zwei Aufrufe machten 70 % des Verbrauchs aus,
 *    und beide lieferten Zahlen, die längst auf einem Port stehen:
 *      - ns.corporation.getCorporation()  10,00 GB  ->  Port 31 (CORP_INFO.funds)
 *      - ns.stock.getSymbols/getPosition/getBidPrice  3× 2,00 GB
 *                                          6,00 GB  ->  Port 26 (PORTFOLIO_VALUE)
 *    Auf home, wo BANK, WORK, INFIL, RESET und der Dispatcher um denselben Platz
 *    konkurrieren, sind 16 GB für zwei Anzeigewerte nicht zu rechtfertigen.
 *    NEBENEFFEKT, der zur Doktrin passt: läuft der jeweilige Daemon nicht, gibt es
 *    keinen Wert und die Zeile bleibt weg — genau das gewünschte Verhalten.
 *    Port 26 meldet den LIQUIDIERBAREN Wert (nach Gebühren, getSaleGain), also
 *    etwas weniger als die reine Kurssumme. Für eine Anzeige ist das die
 *    ehrlichere Zahl.
 *
 * B) STRIKTE FREISCHALTUNGS-GATES. Eine Zeile erscheint nur, wenn das zugehörige
 *    System in dieser BitNode tatsächlich läuft:
 *      Hashes    nur bei hashCapacity > 0        (keine Hash-Server -> weg)
 *      Territory nur bei frischem GANG_INFO      (keine Gang -> weg)
 *      Karma     nur ohne Gang und <= -9
 *      Corp      nur bei frischem CORP_INFO mit totalShares > 0
 *      Aktien    nur bei Portfolio > 0
 *      Share Pwr nur > 1.0001 (die Engine lässt Spuren stehen)
 *      Reserve   nur > 0
 *    Für CORP_INFO wird jetzt das Alter geprüft (CORP v0.20 sendet ts). Fehlt ts,
 *    gilt der Snapshot als gültig — sonst würde eine ältere CORP die Zeile
 *    dauerhaft verstecken.
 *
 * C) SPARTOPF-ZEILE ENTFERNT. Das Kaufverhalten der BANK läuft inzwischen über die
 *    Rangliste (v2.x), der Spartopf ist als Steuergröße raus. Eine Zahl anzeigen,
 *    die nichts mehr steuert, ist schlimmer als sie wegzulassen. readBankInfo ist
 *    damit aus dem Dashboard verschwunden.
 *
 * D) ONE-SHOT-KNÖPFE SENDEN JETZT "FORCE". Symptom war: RESET ließ sich nicht mehr
 *    auslösen und blieb dauerhaft gelb. Ursache in der Queen (shouldRun):
 *        if (key === "RESET") return !!S.wants.RESET;
 *    Ein START über den Schalter setzt nur state=1 — der RESET-Sonderzweig verlangt
 *    aber ein WANT, das ausschließlich handleResetCycle setzt (nach BANKs Meldung
 *    auf Port 19). Der Daemon startete also nie, und weil "an, aber läuft nicht"
 *    gelb gezeichnet wird, blieb der Knopf gelb hängen.
 *    FORCE setzt state=2, und der 2er-Zweig steht in shouldRun VOR dem
 *    RESET-Sonderfall -> der One-Shot läuft an. Damit daraus kein Dauer-Install
 *    wird, setzt der RESET-Payload seinen Schalter beim Start selbst auf den
 *    Registry-Default zurück (PAYLOADS v0.5); SCAN macht dasselbe.
 *
 * ===========================================================================
 * WAS SICH IN v5.0 GEGENÜBER v4.6.1 GEÄNDERT HAT
 * ===========================================================================
 *
 * 1) DAS TAIL-FENSTER IST JETZT EINE SCHALTTAFEL, KEIN DATENBLATT.
 *    Übrig bleiben: Button-Leiste, ENDGAME-Leiste, Kopfzeile und der
 *    [ KINETIK ]-Balken. Die Blöcke FINANZEN, EINNAHMEN, HACKNET, GANG, BANK
 *    und CORP sind aus dem Tail verschwunden — sie stehen jetzt im Overview
 *    (linke Spalte des Spiels), wo man sie sieht, ohne ein Fenster zu öffnen.
 *
 * 2) OVERVIEW-HUD (overview-extra-hook-0/1).
 *    Übernommen ist die Render-Technik von stats.js, nicht dessen Architektur:
 *      - ein Knoten-Cache (nodeMap) hält die erzeugten <span>s; geschrieben
 *        wird nur, wenn sich der Text geändert hat -> kein Neuaufbau, kein
 *        Flackern;
 *      - jede Zeile hat einen TOOLTIP. Dort steckt die Aufschlüsselung, die
 *        vorher als Tabellenblock im Tail stand (z.B. alle Einnahmequellen
 *        einzeln). Deshalb wirkt die Zeile knapp, ohne dass Information
 *        verloren geht;
 *      - ns.atExit() räumt die Zeilen wieder ab.
 *    KEIN eigener Prozess: das Dashboard hat den DOM-Zugriff und erhebt die
 *    Zahlen ohnehin. Ein zweiter Daemon müsste getMoneySources (1.0) +
 *    stock.* (~2.5) + hacknet.* (1.0) + getResetInfo (1.0) + Basis (1.6) ein
 *    zweites Mal bezahlen — rund 7 GB doppelt — und bräuchte zusätzlich einen
 *    Port oder eine zweite Erhebung derselben Werte. Der Schalter dafür ist
 *    der VIRTUELLE Registry-Eintrag OVERVIEW (Muster SLEEVES).
 *    WICHTIG beim Aufräumen: es wird NICHT innerHTML="" gesetzt (so macht es
 *    stats.js). Läuft stats.js parallel, würde das dessen Zeilen mit löschen.
 *    Entfernt werden nur die Knoten aus der eigenen nodeMap.
 *
 * 3) [ KINETIK ] IST JETZT EIN SEGMENTBALKEN MIT LEGENDE.
 *    Farbe je Arbeitsart statt einer Auslastungsfarbe:
 *      grün = hack · gelb = grow · cyan = weaken · blau = prep · magenta = xp
 *      weiß = share · hellrot = Daemons/fremd · grau = reserviert · '-' = frei
 *    Datenquelle ist Port 25 (DISPATCH_STAT, 0 GB) — der Dispatcher
 *    veröffentlicht seine ps-Aufschlüsselung ohnehin je Fast-Takt. Ist der
 *    Snapshot älter als STAT_MAX_AGE_MS oder fehlt er, fällt der Balken auf die
 *    Eigenmessung zurück und zeigt nur noch belegt/frei — mit Vermerk, damit
 *    niemand die grobe Darstellung für die Wahrheit hält.
 *    ZWEITER BALKEN für Hacknet-Server-RAM. Der gehört NICHT in denselben
 *    Balken: HNS-RAM ist kein Worker-Pool (jede Fremdbelegung senkt die
 *    Hash-Rate), der Dispatcher fasst ihn nur an, wenn Hashes in dieser
 *    BitNode wertlos sind. Eigene Skala, eigene Farbe (hellblau).
 *
 * 4) NEUE KNÖPFE: SCAN (One-Shot, interaktive Netzkarte im Terminal) und
 *    OVERVIEW (schaltet den HUD aus Punkt 2 ab).
 *
 * 5) BLADEBURNER-ZEILEN im HUD bewusst NICHT umgesetzt (auf Wunsch).
 *    Der ENDGAME-Block liest den blade-Block weiterhin — der zeigt aber die
 *    Daedalus-Bereitschaft, nicht Rang/SP.
 *
 * ZUSATZKOSTEN gegenüber v4.6.1: getTotalScriptIncome 0.1 + getTotalScriptExpGain
 * 0.1 + getSharePower 0.2 + getResetInfo 1.0 + hacknet.numNodes 0.5 = 1.9 GB.
 * ns.heart.break() ist mit 0 GB veranschlagt (RamCostGenerator: heart {break: 0}).
 * Registry-minRam wurde deshalb auf 24 angehoben.
 *
 * ---------------------------------------------------------------------------
 * ÜBERNOMMEN AUS v4.6.1 (unverändert gültig):
 *   - Reset-Erkennung der Einnahmeraten an den NUR-WACHSENDEN Feldern
 *     (RATE_MONOTONIC). `total` taugt dafür nicht: es FÄLLT bei jeder Ausgabe,
 *     weil Ausgaben als negative Beträge einfließen — jeder Hacknet-Kauf galt
 *     sonst als Install-Reset und ließ den Block flackern.
 *   - Hash-Verbrauch kommt aus Port 33, nicht aus "Produktion minus
 *     Bestandsänderung": am Cap verpuffen Hashes, statt ausgegeben zu werden.
 *   - Button-Filter generisch über triggered/oneshotDaemon/virtual, gestochen
 *     von showInDashboard.
 *   - Netz-Scan nur alle SCAN_EVERY Takte, Renderpfad bei 1 s.
 * ---------------------------------------------------------------------------
 *
 * BENÖTIGT: SCHWARM-HELPERS.js >= v3.5 (Registry-Einträge SCAN + OVERVIEW,
 *           readGangInfo / readHashInfo), SCHWARM-PAYLOADS.js >= v0.4 (SRC_SCAN).
 * Aufruf:   run SCHWARM-DASHBOARD.js
 *
 * @param {NS} ns
 */

import {
    DAEMONS, CAPABILITY_GATE, PHASE, SCHWARM_PORTS, PSERV_PREFIX,
    getTopology, ensureSingleInstance, getCapabilities, getPhase,
    sendCmd, formatMoney, formatNumber, formatRam,
    readManagedState, isDaemonEnabled,
    readInfoBlock, readCorpInfo, readGangInfo, readHashInfo, readPortfolioValue,
} from "SCHWARM-HELPERS.js";

// ---------------------------------------------------------------------------
// Steuerbare Daemons = echte DAUER-Daemons. Ausgeblendet werden triggered
// (BACKDOOR, vom Dispatcher geführt), oneshotDaemon (AUGS) und virtual
// (SLEEVES) — ihre Funktion hängt am Eltern-Daemon, ein Schalter steuerte
// nichts. showInDashboard sticht den Filter; das nutzen RESET, SCAN und
// OVERVIEW (virtueller Eintrag ohne Prozess, aber mit echtem Effekt).
//
// v5.3: RESET ist ein AN/AUS-SCHALTER, kein Auslöser. "aus" verhindert den
// Aug-Install (shouldRun bricht an isDaemonEnabled ab, SCHWARM-QUEEN.js:373),
// "an" ist der Regelfall und lässt handleResetCycle ihn anfordern, sobald BANK
// meldet. Bis v5.2 stand hier "Not-Aus" — das war falsch: der Knopf lief über
// den FORCE-Zweig und löste den Install AUS, statt ihn zu verhindern.
// SCAN dagegen bleibt ein Auslöser, dort IST der Knopf der Startbefehl.
// ---------------------------------------------------------------------------
const HIDE_FROM_DASHBOARD = (d) =>
    !d.showInDashboard && (d.oneshot || d.triggered || d.oneshotDaemon || d.virtual);
const MANAGED_ORDER = [
    "HACKING", "BANK", "WORK", "CORP", "DARKNET", "GO", "TRADER",
    "BLADEBURNER", "GANGS", "INFIL", "DIAG", "LOGVIEW", "OVERVIEW", "SCAN", "RESET",
];
const MANAGED = [
    ...MANAGED_ORDER.filter(k => k in DAEMONS && !HIDE_FROM_DASHBOARD(DAEMONS[k])),
    // Falls jemand künftig einen Daemon hinzufügt, ohne MANAGED_ORDER zu pflegen:
    ...Object.keys(DAEMONS).filter(k => !HIDE_FROM_DASHBOARD(DAEMONS[k]) && !MANAGED_ORDER.includes(k)),
];

/** Der HUD-Schalter. Virtueller Registry-Eintrag, kein Prozess. */
const AUTO_RUHE_MS = 2 * 60 * 60 * 1000;   // v6.0: Ruhezeit bis zur Selbstverwaltung
const HUD_KEY = "OVERVIEW";

// =============================================================================
// ENDGAME (v4.1, unverändert): pure Bewertung, exportiert für den Testharness.
// Eingabe: { blade, augsOwned, worldDaemon, hackLvl } — alles darf fehlen.
// Ausgabe: [{ id, blink, text }]; blink=true heißt "Option besteht JETZT".
// =============================================================================
const ENDGAME_BLACKOP = "Operation Daedalus";     // BladeburnerBlackOpName (Engine)
const ENDGAME_AUG = "The Red Pill";               // AugmentationName.TheRedPill
export const WORLD_DAEMON_HOST = "w0r1d_d43m0n";  // SpecialServers.WorldDaemon

export function computeEndgame(d) {
    const items = [];
    const fmt = (n) => formatNumber(Math.floor(n || 0));
    const b = d && d.blade;
    if (b && b.inDivision && b.nextBlackOp && b.nextBlackOp.name === ENDGAME_BLACKOP) {
        const req = b.nextBlackOp.rank || 400e3;
        const rank = b.rank || 0;
        if (rank >= req) {
            items.push({ id: "DAEDALUS", blink: true,
                text: "OPERATION DAEDALUS BEREIT — BitNode-Ende: per Plan freigeben (WEG: daedalus) oder von Hand im Bladeburner-UI" });
        } else {
            items.push({ id: "DAEDALUS", blink: false,
                text: "Daedalus in Sicht: Rang " + fmt(rank) + " / " + fmt(req) });
        }
    }
    const owned = d && Array.isArray(d.augsOwned) ? d.augsOwned : null;
    if (d && d.worldDaemon) {
        const need = d.worldDaemon.skill || 0;
        const lvl = d.hackLvl || 0;
        if (need > 0 && lvl >= need) {
            items.push({ id: "WORLD", blink: true,
                text: "W0R1D_D43M0N BEREIT — Backdoor beendet die BitNode (Hacking " + fmt(lvl) + " >= " + fmt(need) + ")" });
        } else {
            items.push({ id: "WORLD", blink: false,
                text: "w0r1d_d43m0n sichtbar — Hacking " + fmt(lvl) + " / " + fmt(need) });
        }
    } else if (owned && owned.includes(ENDGAME_AUG)) {
        // Server noch unsichtbar -> Red Pill ist gekauft, aber nicht installiert.
        items.push({ id: "REDPILL", blink: false,
            text: "The Red Pill gekauft — Installation schaltet " + WORLD_DAEMON_HOST + " frei" });
    }
    return items;
}

// =============================================================================
// EINNAHMERATEN (v4.6, unverändert)
// =============================================================================
//
// ns.getMoneySources() (1 GB) liefert die KUMULIERTEN Beträge je Quelle seit dem
// letzten Install — eine Quelle für alle Raten, statt jedem Daemon eine eigene
// Meldung abzuverlangen. Ausgabe-Felder (gang_expenses, hacknet_expenses,
// servers, augmentations, class, hospitalization) stehen dort als NEGATIVE
// Summen; das Vorzeichen trennt hier Einnahme von Ausgabe.
const RATE_TAU_MS = 20_000;
// v5.6: Traegere Glaettung fuer die beiden Summenzeilen (Einnahmen / Ausgaben).
// Eine Minute, wie vom Nutzer gewuenscht: Ausgaben kommen stossweise, und ueber
// 20 s bleibt ein einzelner Serverkauf als Ausschlag sichtbar statt als Mittel.
const RATE_TAU_SLOW_MS = 60_000;

/**
 * Felder, die NUR wachsen können (reine Einnahmen). Nur an ihnen darf ein
 * Install-Reset erkannt werden. `total` taugt dafür NICHT — es fällt bei jedem
 * Einkauf, weil Ausgaben als negative Beträge einfließen. Jeder Hacknet-Kauf
 * hätte sonst einen "Reset" ausgelöst und die EMA geleert (v4.6.1-Bugfix).
 */
const RATE_MONOTONIC = ["hacking", "crime", "work", "gang", "corporation", "hacknet",
    "bladeburner", "casino", "codingcontract", "infiltration", "sleeves", "darknet"];

/** Anzeigezeilen: [Label, Einnahmefeld, Ausgabefeld|null]. */
const RATE_ROWS = [
    ["Hacking", "hacking", null],
    ["Gang", "gang", "gang_expenses"],
    ["Corporation", "corporation", null],
    ["Hacknet", "hacknet", "hacknet_expenses"],
    ["Crime", "crime", null],
    ["Arbeit", "work", null],
    ["Sleeves", "sleeves", null],
    ["Bladeburner", "bladeburner", null],
    ["Aktien", "stock", null],
    ["Infiltration", "infiltration", null],
    ["Contracts", "codingcontract", null],
    ["Casino", "casino", null],
    ["Darknet", "darknet", null],
    ["Server", "servers", null],
    ["Augmentierung", "augmentations", null],
    ["Studium", "class", null],
    ["Klinik", "hospitalization", null],
    ["Sonstiges", "other", null],
];

/**
 * Raten fortschreiben. Beim ersten Aufruf entsteht noch keine Rate (es fehlt
 * der Vorgängerwert).
 * @param {NS} ns
 * @param {{last:object|null, lastAt:number, ema:object}} store
 */
export function updateMoneyRates(ns, store) {
    let src = null;
    try { src = ns.getMoneySources().sinceInstall; } catch (e) { return; }
    if (!src) return;
    const now = Date.now();

    if (store.last) {
        // Aug-Install setzt sinceInstall zurück -> ein einzelnes, riesiges
        // Negativdelta. Erkannt an den NUR-WACHSENDEN Feldern (siehe oben).
        let wasReset = false;
        for (const k of RATE_MONOTONIC) {
            if ((Number(src[k]) || 0) < (Number(store.last[k]) || 0) - 1) { wasReset = true; break; }
        }
        if (wasReset) {
            store.last = src; store.lastAt = now; store.ema = {};
            store.emaPlus = undefined; store.emaMinus = undefined;   // v5.6
            return;
        }
        const dtMs = now - store.lastAt;
        if (dtMs < 200) return;                       // zu kurz -> Rauschen
        const dtMin = dtMs / 60000;
        const alpha = 1 - Math.exp(-dtMs / RATE_TAU_MS);
        // =====================================================================
        // v5.6 — EIN- UND AUSGABEN GETRENNT SAMMELN
        // =====================================================================
        // Die Netto-Zeile flackerte, und der Grund liegt in der Natur der Zahlen:
        // Einnahmen tropfen stetig, AUSGABEN kommen stossweise. Ein einzelner
        // Serverkauf ist ein Ausschlag von vielen Millionen in EINEM Takt; auf
        // die Minute hochgerechnet ergibt das eine absurde Rate, die dann ueber
        // die ganze Glaettung wieder abklingt. Netto zeigte deshalb abwechselnd
        // Gewinn und Verlust, ohne dass sich am Betrieb irgendetwas geaendert
        // haette.
        //
        // Zwei getrennte Summen loesen das: die Einnahmenzeile bleibt ruhig,
        // weil sie von Kaeufen gar nicht mehr beruehrt wird, und die
        // Ausgabenzeile DARF ausschlagen — dort ist der Ausschlag die
        // Information.
        //
        // Aufgeteilt wird am Vorzeichen des Deltas, nicht an einer Feldliste:
        // manche Felder (servers, augmentations) sind immer negativ, andere
        // (gang, hacknet) haben eigene *_expenses-Felder, und "other" kann
        // beides. Das Vorzeichen stimmt in jedem dieser Faelle.
        //
        // "total" wird uebersprungen: es ist die Summe aller anderen Felder und
        // wuerde jeden Betrag ein zweites Mal zaehlen.
        let plus = 0, minus = 0;
        for (const k in src) {
            const d = (Number(src[k]) || 0) - (Number(store.last[k]) || 0);
            const perMin = d / dtMin;
            store.ema[k] = (store.ema[k] === undefined)
                ? perMin
                : store.ema[k] + alpha * (perMin - store.ema[k]);
            if (k === "total") continue;
            if (perMin > 0) plus += perMin; else minus += perMin;
        }
        // Eigene, TRAEGERE Glaettung fuer die beiden Zeilen: rund eine Minute
        // statt 20 Sekunden. Die Aufschluesselung im Tooltip behaelt die
        // schnellere Rate — dort will man sehen, was GERADE passiert.
        const slow = 1 - Math.exp(-dtMs / RATE_TAU_SLOW_MS);
        store.emaPlus = (store.emaPlus === undefined)
            ? plus : store.emaPlus + slow * (plus - store.emaPlus);
        store.emaMinus = (store.emaMinus === undefined)
            ? minus : store.emaMinus + slow * (minus - store.emaMinus);
    }
    store.last = src; store.lastAt = now;
}

/**
 * Anzeigezeilen aus den geglätteten Raten bauen. Rein rechnerisch (kein ns),
 * damit die Vorzeichen-/Umbuchungslogik testbar bleibt.
 * @param {object} ema  Feld -> $/min
 * @returns {{label:string, inc:number, exp:number}[]}
 */
export function buildIncomeRows(ema) {
    const out = [];
    for (const [label, incKey, expKey] of RATE_ROWS) {
        let inc = Number(ema[incKey]) || 0;
        let exp = expKey ? (Number(ema[expKey]) || 0) : 0;
        // Reine Ausgabefelder (Server, Augs, Klinik, ...) stehen als negative
        // Einnahme -> in die Ausgabespalte umbuchen.
        if (inc < 0) { exp += inc; inc = 0; }
        if (Math.abs(inc) < 1 && Math.abs(exp) < 1) continue;
        out.push({ label, inc, exp });
    }
    out.sort((a, b) => b.inc - a.inc);   // Einnahmen absteigend, reine Ausgaben ans Ende
    return out;
}

// =============================================================================
// KINETIK — Segmentbalken (v5.0)
// =============================================================================
//
// Der Dispatcher veröffentlicht auf Port 25 je Fast-Takt (2 s) einen Snapshot
// mit der ps-Aufschlüsselung: used {core_w, core_g, core_h, prep, xp, share,
// foreign}, totalGb, poolLeftGb, reservedGb. Das ist ohnehin da — das Dashboard
// muss dafür keinen einzigen zusätzlichen ns-Call bezahlen (peek = 0 GB).
//
// EHRLICHKEIT DER ZAHLEN: die ps-Aufschlüsselung ist eine Momentaufnahme und
// verpasst kurzlebige Worker "zwischen den Wellen" (der Dispatcher schreibt das
// in seiner eigenen Diagnose genauso hin). Der Balken zeigt deshalb den
// gemessenen Belegt-Anteil als Basis und die Klassen nur als Aufteilung
// darin; was übrig bleibt, läuft als "nicht zugeordnet" mit.

const STAT_MAX_AGE_MS = 12_000;   // Port-25-Snapshot älter -> Fallback-Balken

/** ANSI-Farbcodes je Segment. Reihenfolge = Reihenfolge im Balken. */
// v5.2 — manip HATTE KEINE FARBE UND WAR DESHALB UNSICHTBAR.
//
// Der Dispatcher meldet acht Klassen auf Port 25 (SCHWARM-DISPATCHER, Zeile
// 1410): core_w, core_g, core_h, prep, xp, share, manip, foreign. Hier standen
// nur sieben davon — "manip" fehlte. buildKineticSegments laeuft aber ueber
// DIESE Liste, also floss die Kursbeeinflussung nie in classSum ein und landete
// vollstaendig im Rest-Segment "sonstige". Im Bericht vom 04.09. waren das
// 1,7 TB, die als "nicht zugeordnet" ausgewiesen wurden, obwohl der Dispatcher
// sie sauber gemessen hatte.
//
// WAS IN WELCHER FARBE STECKT (Zuordnung in SCHWARM-DISPATCHER ab Zeile 1469):
//   core_h/g/w  Worker auf einem Geldziel, nach Art getrennt
//   prep        Worker auf einem noch nicht fertigen Ziel
//   xp / share  eigene Klassen, unabhaengig vom Ziel
//   manip       Kursbeeinflussung fuer den TRADER
//   foreign     ALLES ohne erkennbare Worker-Art: Dauerdaemons, Solver,
//               Backdoor, manuell gestartete Skripte UND Staneks Lader.
//               Bewusst EIN Segment — einzeln waeren es Splitter von unter
//               einem Balkenblock.
//   other       gemessen belegt minus Summe der Klassen. Ein echter Rest,
//               keine Sammelkiste: steht hier etwas Grosses, hat der Snapshot
//               Prozesse nicht erwischt.
//   res         Reservierungen der Queen (kein laufender Prozess).
const KIN_SEGMENTS = [
    { key: "core_h", label: "hack",     color: "\x1b[32m" },   // grün
    { key: "core_g", label: "grow",     color: "\x1b[33m" },   // gelb
    { key: "core_w", label: "weaken",   color: "\x1b[36m" },   // cyan
    { key: "prep",   label: "prep",     color: "\x1b[34m" },   // blau
    { key: "xp",     label: "xp",       color: "\x1b[35m" },   // magenta
    { key: "manip",  label: "manip",    color: "\x1b[94m" },   // hellblau
    { key: "share",  label: "share",    color: "\x1b[37m" },   // weiß
    { key: "foreign", label: "Daemons", color: "\x1b[91m" },   // hellrot
    { key: "other",  label: "sonstige", color: "\x1b[90m" },   // grau (echter Rest)
    { key: "res",    label: "reserv.",  color: "\x1b[2;37m" }, // gedimmt
];

// Die Klassen, die der Dispatcher meldet. Fehlt eine davon oben, wird sie
// stillschweigend unter "sonstige" verbucht — genau der Fehler, den v5.2
// behoben hat. buildKineticSegments prueft das jetzt bei jedem Aufruf.
const DISPATCHER_KLASSEN = ["core_w", "core_g", "core_h", "prep", "xp", "share", "manip", "foreign"];

/** DISP_OUT (Port 3) lesen (peek, 0 GB). null, wenn nichts/defekt.
 *  Stand bis zum Health-Check am 04.09.2026 faelschlich als "Port 25"
 *  im Kommentar - 25 ist STANEK_OUT. Gelesen wurde immer DISP_OUT. */
export function readDispatchStat(ns) {
    try {
        const v = ns.peek(SCHWARM_PORTS.DISP_OUT);
        if (typeof v !== "string" || v === "NULL PORT DATA") return null;
        const o = JSON.parse(v);
        return (o && typeof o.totalGb === "number") ? o : null;
    } catch (e) { return null; }
}

/**
 * Segmente für den Kinetik-Balken bestimmen. Rein rechnerisch (kein ns).
 *
 * @param {object|null} snap    Port-25-Snapshot (oder null)
 * @param {{max:number, used:number}} measured  Eigenmessung des Dashboards
 * @param {number} nowMs
 * @returns {{total:number, busy:number, free:number, detailed:boolean,
 *            parts:{key:string,label:string,color:string,gb:number}[]}}
 */
export function buildKineticSegments(snap, measured, nowMs) {
    const mMax = Math.max(0, Number(measured && measured.max) || 0);
    const mUsed = Math.max(0, Number(measured && measured.used) || 0);
    const fresh = !!(snap && Number.isFinite(snap.t) && (nowMs - snap.t) <= STAT_MAX_AGE_MS);

    if (!fresh) {
        // Fallback: nur belegt/frei. Bewusst KEINE erfundene Aufteilung.
        return {
            total: mMax, busy: Math.min(mUsed, mMax), free: Math.max(0, mMax - mUsed),
            detailed: false,
            parts: [{ key: "busy", label: "belegt", color: "\x1b[32m", gb: Math.min(mUsed, mMax) }],
        };
    }

    const total = Math.max(mMax, Number(snap.totalGb) || 0);
    const u = snap.used || {};
    const res = Math.max(0, Number(snap.reservedGb) || 0);
    // Der Dispatcher meldet poolLeftGb als "ungenutzt nach Abzug der
    // Reservierungen". Belegt ist damit total - frei - reserviert.
    const free = Math.max(0, Number(snap.poolLeftGb) || 0);
    const busy = Math.max(0, total - free - res);

    const parts = [];
    let classSum = 0;
    for (const seg of KIN_SEGMENTS) {
        if (seg.key === "other" || seg.key === "res") continue;
        const gb = Math.max(0, Number(u[seg.key]) || 0);
        classSum += gb;
        parts.push({ key: seg.key, label: seg.label, color: seg.color, gb });
    }

    // v5.2: Meldet der Dispatcher eine Klasse, fuer die es hier kein Segment
    // gibt, faellt sie unbemerkt in "sonstige". Genau so verschwanden 1,7 TB
    // manip. Kommt eine neue Klasse dazu, soll das AUFFALLEN statt sich zu
    // verstecken — der Name wandert in fehlendeKlassen und wird angezeigt.
    const fehlendeKlassen = [];
    for (const k of DISPATCHER_KLASSEN) {
        if (!KIN_SEGMENTS.some(s => s.key === k) && Number(u[k]) > 0) fehlendeKlassen.push(k);
    }
    // Differenz zwischen gemessener Belegung und ps-Summe: laufende Worker, die
    // der Snapshot gerade nicht erwischt hat. Wird ausgewiesen statt verteilt.
    const other = Math.max(0, busy - classSum);
    const segOther = KIN_SEGMENTS.find(s => s.key === "other");
    const segRes = KIN_SEGMENTS.find(s => s.key === "res");
    parts.push({ key: "other", label: segOther.label, color: segOther.color, gb: other });
    parts.push({ key: "res", label: segRes.label, color: segRes.color, gb: res });

    return { total, busy, free, detailed: true, parts, fehlendeKlassen };
}

/**
 * Segmentbalken zeichnen. Blöcke werden proportional verteilt; Restplätze gehen
 * an die größten Nachkommaanteile (sonst verschluckt die Rundung kleine, aber
 * vorhandene Klassen komplett und der Balken lügt).
 * @param {{gb:number, color:string}[]} parts
 * @param {number} total
 * @param {number} width
 */
export function drawSegmentBar(parts, total, width = 45) {
    const res = "\x1b[0m";
    if (!(total > 0)) return "[" + "-".repeat(width) + "]";
    const raw = parts.map(p => (Math.max(0, p.gb) / total) * width);
    const base = raw.map(Math.floor);
    let used = base.reduce((a, b) => a + b, 0);
    const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac);
    for (const o of order) {
        if (used >= width) break;
        if (raw[o.i] <= 0) continue;
        base[o.i]++; used++;
    }
    let out = "[";
    for (let i = 0; i < parts.length; i++) {
        if (base[i] > 0) out += parts[i].color + "\u2588".repeat(base[i]) + res;
    }
    out += "-".repeat(Math.max(0, width - used)) + "]";
    return out;
}

/** Legende: farbiger Block + Klartext, zwei Zeilen. */
function kineticLegend(parts, fehlendeKlassen) {
    const res = "\x1b[0m";
    const cell = (p) => p.color + "\u2588" + res + " " + p.label;

    // v5.2: Klassen ohne Belegung weglassen. Mit manip sind es zehn Segmente,
    // und im Normalbetrieb stehen mehrere davon auf 0 (share ohne Grind, manip
    // ohne TRADER-Auftrag, core_h waehrend der Prep-Phase). Eine Legende, die
    // Farben fuer nicht vorhandene Balken erklaert, macht die vorhandenen
    // schwerer zu finden. Ist alles 0, wird die volle Liste gezeigt \u2014 sonst
    // stuende dort gar nichts.
    const sichtbar = parts.filter(p => p.gb > 0);
    const zeigen = sichtbar.length > 0 ? sichtbar : parts;

    const mitte = Math.ceil(zeigen.length / 2);
    const zeilen = [
        zeigen.slice(0, mitte).map(cell).join("  "),
        zeigen.slice(mitte).map(cell).join("  "),
    ].filter(s => s.length > 0);

    // Meldet der Dispatcher eine Klasse ohne Segment, faellt sie in "sonstige".
    // Das soll sichtbar sein, nicht stillschweigend passieren.
    if (fehlendeKlassen && fehlendeKlassen.length > 0) {
        zeilen.push("\x1b[33m! ohne Farbe, zaehlt als sonstige: "
            + fehlendeKlassen.join(", ") + res);
    }
    return zeilen;
}

// =============================================================================
// OVERVIEW-HUD (v5.0)
// =============================================================================
//
// FESTE Zeilenliste: die DOM-Knoten entstehen EINMAL und werden danach nur noch
// beschrieben oder versteckt. Eine dynamische Liste würde bei jedem
// Sichtbarkeitswechsel neu aufbauen — genau das Flackern, das die nodeMap
// vermeiden soll.
const HUD_ROWS = [
    { key: "bitnode", label: "BitNode" },
    { key: "wealth",  label: "Vermögen" },
    { key: "stocks",  label: "Aktien" },
    { key: "income",  label: "Einnahmen" },
    { key: "expense", label: "Ausgaben" },
    { key: "scrinc",  label: "Scr Inc" },
    { key: "screxp",  label: "Scr Exp" },
    { key: "hashes",  label: "Hashes" },
    { key: "terr",    label: "Territory" },
    { key: "karma",   label: "Karma" },
    { key: "corp",    label: "Corp" },
    { key: "servers", label: "Server" },
    { key: "homeram", label: "Home RAM" },
    { key: "allram",  label: "All RAM" },
    { key: "share",   label: "Share Pwr" },
    { key: "reserve", label: "Reserve" },
];

/**
 * HUD-Inhalte berechnen. REIN RECHNERISCH (kein ns) — dadurch ohne laufendes
 * Spiel prüfbar, und die Sichtbarkeitsregeln stehen an EINER Stelle.
 *
 * @param {object} d  gesammelte Rohdaten (siehe main)
 * @returns {Object<string,{show:boolean,value:string,tip:string}>}
 */
export function buildHudRows(d) {
    const r = {};
    const set = (k, show, value, tip) => { r[k] = { show: !!show, value: String(value ?? ""), tip: String(tip ?? "") }; };
    const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) : "0.0");

    // --- BitNode ---
    set("bitnode", d.bitNode > 0, d.bitNode + "." + (1 + (d.bitNodeSf || 0)),
        "Aktuelle BitNode " + d.bitNode + ", eigenes Source-File-Level " + (d.bitNodeSf || 0)
        + " (die Anzeige zeigt das Level, das der nächste Durchlauf brächte).");

    // --- Vermögen ---
    // Aktien und Corp-Fonds kommen aus den Ports (26 bzw. 31), nicht mehr aus
    // eigenen NS-Calls — siehe Kopf A). Läuft der jeweilige Daemon nicht, ist der
    // Posten schlicht 0 und taucht in der Aufschlüsselung nicht auf.
    const wealth = (d.cash || 0) + (d.stockValue || 0) + (d.corpFunds || 0);
    set("wealth", true, formatMoney(wealth),
        "Liquide:      " + formatMoney(d.cash || 0)
        + ((d.stockValue || 0) > 0 ? "\nAktien:       " + formatMoney(d.stockValue) : "")
        + ((d.corpFunds || 0) > 0 ? "\nCorporation:  " + formatMoney(d.corpFunds) : ""));

    // --- Aktien: eigene Zeile, nur solange etwas im Depot liegt ---
    set("stocks", (d.stockValue || 0) > 0, formatMoney(d.stockValue || 0),
        "Liquidierbarer Depotwert nach Gebühren (vom TRADER auf Port 26 gemeldet). "
        + "Ohne laufenden TRADER gibt es keinen Wert und die Zeile verschwindet.");

    // --- Einnahmen und Ausgaben: ZWEI Zeilen (v5.6) ---
    //
    // Vorher stand hier EINE Netto-Zeile. Sie flackerte zwischen Plus und Minus,
    // ohne dass sich am Betrieb etwas geaendert hatte: Einnahmen tropfen stetig,
    // Ausgaben kommen stossweise. Ein Serverkauf von 50 Mio. in einem Takt ist,
    // auf die Minute hochgerechnet, eine gewaltige negative Rate — die dann ueber
    // die ganze Glaettung wieder abklingt.
    //
    // Getrennt betrachtet wird jede Zeile fuer sich aussagekraeftig: die
    // Einnahmen bleiben ruhig, weil Kaeufe sie nicht mehr beruehren, und die
    // Ausgaben DUERFEN ausschlagen — dort ist der Ausschlag die Information.
    // Beide sind ueber rund eine Minute geglaettet.
    //
    // Das Netto ist damit nicht verschwunden, es steht in beiden Tooltips.
    const rows = buildIncomeRows(d.ema || {});
    const plus = Number(d.emaPlus);
    const minus = Number(d.emaMinus);
    const netto = (isFinite(plus) && isFinite(minus)) ? (plus + minus) : Number((d.ema || {}).total);

    let incTip = "";
    for (const x of rows) {
        incTip += x.label.padEnd(14)
            + (x.inc >= 1 ? ("+" + formatMoney(x.inc) + "/min").padStart(14) : "".padStart(14))
            + (x.exp <= -1 ? ("  -" + formatMoney(-x.exp) + "/min") : "")
            + "\n";
    }
    if (incTip === "") incTip = "Noch keine Rate gemessen (braucht ein paar Sekunden).";
    const kopf = "Netto: " + (netto < 0 ? "-" : "+") + formatMoney(Math.abs(netto || 0)) + "/min"
        + "   (Einnahmen " + formatMoney(isFinite(plus) ? plus : 0)
        + " minus Ausgaben " + formatMoney(isFinite(minus) ? -minus : 0) + ")\n"
        + "Beide Zeilen sind ueber rund eine Minute gemittelt; die Aufschluesselung\n"
        + "unten zeigt die schnellere Rate (~20 s):\n\n";

    set("income", isFinite(plus) && rows.length > 0,
        "+" + formatMoney(Math.max(0, plus || 0)) + "/min", kopf + incTip);
    // Die Ausgabenzeile verschwindet, solange nichts ausgegeben wird — eine
    // dauerhafte Null waere nur eine Zeile Platzverschwendung.
    set("expense", isFinite(minus) && minus <= -1,
        "-" + formatMoney(Math.abs(minus || 0)) + "/min", kopf + incTip);

    // --- Skript-Einkommen / -Erfahrung ---
    set("scrinc", d.scriptInc !== null && d.scriptInc !== undefined,
        formatMoney(d.scriptInc || 0) + "/s",
        "Momentanes Einkommen aller laufenden Skripte auf allen Servern.");
    set("screxp", d.scriptExp !== null && d.scriptExp !== undefined,
        formatNumber(d.scriptExp || 0) + "/s",
        "Momentaner Hacking-Erfahrungsgewinn aller laufenden Skripte.");

    // --- Hashes ---
    let hashTip = "Hash-Bestand / Kapazität.";
    if (d.hashFresh) {
        hashTip += "\nProduktion:  +" + formatNumber((d.hashProdPerSec || 0) * 60, 0) + "/min"
            + "\nVerbrauch:   -" + formatNumber(d.hashSpendPerMin || 0, 0) + "/min"
            + "\n(Verbrauch kommt aus Port 33 — HASHNET zählt ihn exakt mit. "
            + "\"Produktion minus Bestandsänderung\" wäre falsch, sobald der Pool am Cap steht.)";
    }
    set("hashes", (d.hashCap || 0) > 0,
        formatNumber(d.hashNum || 0) + " / " + formatNumber(d.hashCap || 0), hashTip);

    // --- Gang-Territorium ---
    const gi = d.gang || {};
    set("terr", d.gangFresh, ((Number(gi.territory) || 0) * 100).toFixed(2) + " %",
        "Territorium im Bandenkrieg."
        + (gi.power !== undefined ? "\nPower:       " + formatNumber(Number(gi.power) || 0) : "")
        + (gi.winChance !== undefined ? "\nWin-Chance:  " + ((Number(gi.winChance) || 0) * 100).toFixed(1) + " %" : "")
        + (gi.members !== undefined ? "\nMitglieder:  " + gi.members : "")
        + (gi.engaged !== undefined ? "\nClash:       " + (gi.engaged ? "aktiv" : "aus") : ""));

    // --- Karma: nur solange es interessant ist (keine Gang, spürbar negativ) ---
    set("karma", !d.gangFresh && (d.karma || 0) <= -9, formatNumber(d.karma || 0),
        "Karma. Für eine eigene Gang außerhalb von BN2 sind -54.000 nötig; "
        + "einige Faktionen verlangen kleine Beträge (höchstens -90 für The Syndicate).");

    // --- Corp ---
    // Gate: nur wenn eine Corporation existiert UND die Meldung frisch ist. Der
    // ts-Fallback (kein ts -> gültig) ist Absicht: eine CORP älter als v0.20
    // sendet keinen Zeitstempel, und eine dauerhaft versteckte Zeile wäre der
    // schlechtere Fehler als eine leicht veraltete.
    const ci = d.corp || {};
    const corpFresh = ci.ts === undefined || (Date.now() - Number(ci.ts)) < 90_000;
    const hasCorp = !!(ci && ci.totalShares && corpFresh);
    const ownFrac = hasCorp && ci.totalShares > 0 ? (ci.numShares / ci.totalShares * 100) : 100;
    set("corp", hasCorp, formatMoney(ci.profitPerSec || 0) + "/s",
        "Profit pro Sekunde (Umsatz minus Kosten)."
        + "\nFonds:      " + formatMoney(ci.funds || 0)
        + "\nDividende:  " + (ci.dividendRate ? (ci.dividendRate * 100).toFixed(1) + " %" : "0 %")
        + "\nValuation:  " + formatMoney(ci.valuation || 0)
        + "\nEigentum:   " + ownFrac.toFixed(1) + " %"
        + (ci.public ? "\nAm Markt:   " + formatNumber(ci.issuedShares || 0)
            + (ci.sellCooldown > 0 ? "  (Handel-Cooldown)" : "") : "\nStatus:     privat (kein IPO)"));

    // --- Server ---
    set("servers", (d.srvTotal || 0) > 0,
        (d.srvTotal || 0) + "/" + (d.srvRooted || 0) + "/" + (d.srvPurchased || 0),
        "Server im Netz / davon gerootet / davon gekauft."
        + (d.hnCount > 0 ? "\nHacknet:     " + d.hnCount + " Server, "
            + formatRam(d.hnMax || 0) + " RAM" : ""));

    // --- home-RAM ---
    set("homeram", (d.homeMax || 0) > 0,
        formatRam(d.homeMax || 0) + " " + pct(d.homeUsed || 0, d.homeMax || 0) + " %",
        "RAM auf home."
        + "\nBelegt: " + formatRam(d.homeUsed || 0)
        + "\nFrei:   " + formatRam(Math.max(0, (d.homeMax || 0) - (d.homeUsed || 0))));

    // --- Netz-RAM ---
    set("allram", (d.ramMax || 0) > 0,
        formatRam(d.ramMax || 0) + " " + pct(d.ramUsed || 0, d.ramMax || 0) + " %",
        "Summe über alle gerooteten Hosts (ohne Hacknet-Server)."
        + "\nBelegt: " + formatRam(d.ramUsed || 0)
        + "\nFrei:   " + formatRam(Math.max(0, (d.ramMax || 0) - (d.ramUsed || 0)))
        + (d.hnMax > 0 ? "\nHacknet-Server getrennt: " + formatRam(d.hnUsed || 0)
            + " von " + formatRam(d.hnMax) + " belegt" : ""));

    // --- Share ---
    set("share", (d.sharePower || 0) > 1.0001, formatNumber(d.sharePower || 0),
        "Multiplikator auf den Faktions-Rufgewinn durch share()-Threads. "
        + "Der Effekt ist logarithmisch (1 + ln(Threads)/25) und läuft bei ~1,65 aus.");

    // --- Reserve ---
    set("reserve", (d.reserve || 0) > 0, formatMoney(d.reserve || 0),
        "Betrag, den Skripte unangetastet lassen (reserve.txt, gespiegelt aus der Treasury-Politik).");

    return r;
}

// =============================================================================
// HAUPTSCHLEIFE
// =============================================================================

export async function main(ns) {
    ns.disableLog("ALL");

    // --- Doppelstart-Schutz: nur ein Dashboard-Fenster zulassen ---
    try {
        const self = ns.getScriptName();
        if (ns.ps("home").filter(p => p.filename === self).length > 1) return;
    } catch (e) { /* weiter */ }
    if (!ensureSingleInstance(ns)) return;

    ns.clearLog();
    // Das Dashboard IST die Anzeige — hier ist openTail beabsichtigt (einzige
    // Ausnahme der No-Auto-Tail-Doktrin).
    ns.ui.openTail();

    const BASE_MS = 500;
    const SCAN_EVERY = 2;                 // Vollscan alle 2 Takte = 1 s
    let tick = 0;

    const cache = {
        ramMax: 0, ramUsed: 0, homeMax: 0, homeUsed: 0,
        srvTotal: 0, srvRooted: 0, srvPurchased: 0,
        hnCount: 0, hnMax: 0, hnUsed: 0,
        locations: {}, worldDaemon: null,
    };
    // v5.6: emaPlus / emaMinus sind die getrennten Summen fuer die beiden
    // Overview-Zeilen; sie bleiben undefined, bis die erste Rate vorliegt.
    const rates = { last: null, lastAt: 0, ema: {}, emaPlus: undefined, emaMinus: undefined };
    const hashSpend = { last: null, lastAt: 0, ema: 0 }; // Hash-Verbrauch (Hashes/min)

    // BitNode + SF-Level: EINMAL. Beides ändert sich nur bei einem Prestige, und
    // ein Prestige beendet dieses Skript ohnehin (GENESIS startet neu).
    let bitNode = 0, bitNodeSf = 0;
    try {
        const ri = ns.getResetInfo();
        if (ri && typeof ri.currentNode === "number") bitNode = ri.currentNode;
        const sf = ri && ri.ownedSF;
        if (sf) {
            if (sf instanceof Map) bitNodeSf = sf.get(bitNode) || 0;
            else if (Array.isArray(sf)) { for (const p of sf) if (Array.isArray(p) && p[0] === bitNode) bitNodeSf = p[1] || 0; }
            else if (typeof sf === "object") bitNodeSf = sf[bitNode] || sf[String(bitNode)] || 0;
        }
    } catch (e) { /* Zeile bleibt versteckt */ }

    // HUD-Zustand (DOM-Knoten + Aufräumer)
    const hud = { nodes: {}, built: false, cssDone: false, exitHooked: false };
    if (!hud.exitHooked) {
        try { ns.atExit(() => teardownHud(hud)); hud.exitHooked = true; } catch (e) { /* egal */ }
    }

    // ANSI-Farben (Cyberpunk-Palette)
    const c_cy = "\x1b[36m", c_gr = "\x1b[32m", c_ye = "\x1b[33m";
    const c_rd = "\x1b[31m", c_bl2 = "\x1b[94m";
    const c_w = "\x1b[37m", res = "\x1b[0m";

    const daemonKeys = MANAGED;

    const spinner = ["|", "/", "-", "\\"];
    let spinIdx = 0;

    while (true) {
        try {
            // --- 1. Queen-State (Toggle-Zustand) lesen: KEY -> 0|1|2 ---
            const state = readQueenState(ns, daemonKeys);

            // --- 2. Schwarm-Signale (Ports) ---
            const caps = getCapabilities(ns);
            const capsKnown = Object.keys(caps).length > 0;
            const phase = getPhase(ns) ?? "—";

            // --- 3. Netzwerk-Scan (teuer) — nur alle SCAN_EVERY Takte ---
            //
            // Hostliste aus dem Topologie-Cache (kein BFS), billige Einzelwerte
            // statt ns.getServer(). Das Dashboard ist eine Anzeige, keine
            // Regelung — eine 1 s alte RAM-Summe schadet niemandem.
            if (tick % SCAN_EVERY === 0) {
                let rMax = 0, rUsed = 0, total = 0, rooted = 0, purchased = 0;
                const loc = {};
                for (const k of daemonKeys) loc[k] = null;
                const fileToKey = {};
                for (const k of daemonKeys) if (DAEMONS[k] && DAEMONS[k].file) fileToKey[DAEMONS[k].file] = k;

                for (const host of Object.keys(getTopology(ns).hosts || {})) {
                    try {
                        total++;
                        const isRoot = host === "home" || ns.hasRootAccess(host);
                        if (isRoot) rooted++;
                        if (host.startsWith(PSERV_PREFIX)) purchased++;
                        if (!isRoot) continue;
                        if (!host.startsWith("hacknet-")) {
                            const mx = ns.getServerMaxRam(host);
                            const us = ns.getServerUsedRam(host);
                            rMax += mx; rUsed += us;
                            if (host === "home") { cache.homeMax = mx; cache.homeUsed = us; }
                        }
                        for (const proc of ns.ps(host)) {
                            const key = fileToKey[proc.filename];
                            if (key && !loc[key]) loc[key] = host;
                        }
                    } catch (e) { /* Host überspringen */ }
                }
                cache.ramMax = rMax; cache.ramUsed = rUsed; cache.locations = loc;
                cache.srvTotal = total; cache.srvRooted = rooted; cache.srvPurchased = purchased;

                // Hacknet-Server-RAM getrennt erfassen. scanNetwork() filtert sie
                // bewusst aus der Topologie (jede Fremdbelegung senkt die
                // Hash-Rate), also müssen die Namen aus der Hacknet-API kommen.
                // numNodes 0.5 GB; getServerMaxRam/UsedRam sind bereits bezahlt.
                let hnC = 0, hnM = 0, hnU = 0;
                try {
                    const n = ns.hacknet.numNodes();
                    for (let i = 0; i < n; i++) {
                        const h = "hacknet-server-" + i;
                        try {
                            const mx = ns.getServerMaxRam(h);
                            if (mx > 0) { hnC++; hnM += mx; hnU += ns.getServerUsedRam(h); }
                        } catch (e) { /* kein Hash-Server (nur Node) */ }
                    }
                } catch (e) { /* keine Hacknet-API */ }
                cache.hnCount = hnC; cache.hnMax = hnM; cache.hnUsed = hnU;

                try { cache.worldDaemon = (getTopology(ns).hosts || {})[WORLD_DAEMON_HOST] || null; }
                catch (e) { cache.worldDaemon = null; }
            }

            // --- ANZEIGE-GATE: Renderpfad bleibt bei 1 s ---
            if (tick % 2 !== 0) { tick++; await ns.asleep(BASE_MS); continue; }

            // --- 4. Finanzen ---
            // v5.1: KEINE eigenen corporation.*- und stock.*-Calls mehr. Die beiden
            // kosteten zusammen 16 GB (getCorporation 10, drei stock-Funktionen je 2)
            // und lieferten Zahlen, die CORP und TRADER ohnehin auf ihre Ports legen.
            // Läuft der Daemon nicht, bleibt der Wert 0 und die Zeile verschwindet —
            // was der gewünschten Gate-Logik entspricht.
            const ci = readCorpInfo(ns);                       // Port 31, 0 GB
            const stockValue = Math.max(0, readPortfolioValue(ns));   // Port 26, 0 GB
            const corpFunds = Number(ci && ci.funds) || 0;
            let cash = 0, hnHashes = 0, hnCap = 0;
            try { cash = ns.getServerMoneyAvailable("home"); } catch (e) { /* 0 */ }
            try {
                if (ns.hacknet.numHashes !== undefined) {
                    hnHashes = ns.hacknet.numHashes();
                    hnCap = ns.hacknet.hashCapacity();
                }
            } catch (e) { /* 0 */ }

            // --- 4b. Raten fortschreiben (1x je Renderdurchlauf = 1 s) ---
            updateMoneyRates(ns, rates);

            const gi = readGangInfo(ns);
            const hi = readHashInfo(ns);
            const giFresh = !!(gi && gi.ts && (Date.now() - gi.ts) < 90_000);   // GANG meldet je Tick (~20 s)
            const hiFresh = !!(hi && hi.ts && (Date.now() - hi.ts) < 30_000);   // HASHNET meldet alle 2 s

            // Hash-Verbrauch: HASHNET liefert die KUMULIERTE Summe (Port 33).
            // Ein Neustart von HASHNET setzt sie auf 0 zurück -> negatives Delta
            // verwerfen statt anzeigen.
            if (hiFresh && typeof hi.spentTotal === "number") {
                if (hashSpend.last !== null) {
                    const dMs = Date.now() - hashSpend.lastAt;
                    const d = hi.spentTotal - hashSpend.last;
                    if (dMs >= 200) {
                        const perMin = d >= 0 ? d / (dMs / 60000) : 0;
                        const a = 1 - Math.exp(-dMs / RATE_TAU_MS);
                        hashSpend.ema += a * (perMin - hashSpend.ema);
                        hashSpend.last = hi.spentTotal; hashSpend.lastAt = Date.now();
                    }
                } else { hashSpend.last = hi.spentTotal; hashSpend.lastAt = Date.now(); }
            }

            // --- 4c. Billige Zusatzwerte für den HUD ---
            let scriptInc = null, scriptExp = null, sharePower = 0, karma = 0, reserve = 0;
            try { const si = ns.getTotalScriptIncome(); scriptInc = Array.isArray(si) ? si[0] : si; } catch (e) { scriptInc = null; }
            try { scriptExp = ns.getTotalScriptExpGain(); } catch (e) { scriptExp = null; }
            try { sharePower = ns.getSharePower(); } catch (e) { sharePower = 0; }
            try { karma = ns.heart.break(); } catch (e) { karma = 0; }         // 0 GB
            try { reserve = Number(ns.read("reserve.txt") || 0) || 0; } catch (e) { reserve = 0; }

            // --- 5. ENDGAME (reine Info) ---
            let endgameItems = [];
            try {
                const blade = readInfoBlock(ns, "blade", 90_000);
                const augsB = readInfoBlock(ns, "augs", 600_000);
                const playerB = readInfoBlock(ns, "player", 90_000);
                let hackLvl = playerB && playerB.skills ? (playerB.skills.hacking || 0) : 0;
                if (!hackLvl) { try { hackLvl = ns.getHackingLevel(); } catch (e) { /* 0 */ } }
                endgameItems = computeEndgame({
                    blade, augsOwned: augsB ? augsB.owned : null,
                    worldDaemon: cache.worldDaemon || null, hackLvl,
                });
            } catch (e) { endgameItems = []; }

            // --- 6. TAIL: Kopf + KINETIK. Sonst nichts mehr. ---
            const snap = readDispatchStat(ns);
            const kin = buildKineticSegments(snap, { max: cache.ramMax, used: cache.ramUsed }, Date.now());
            const spin = spinner[spinIdx++ % spinner.length];

            let out = "\n";
            out += c_cy + "=================================================" + res + "\n";
            out += c_cy + " // SCHWARM-OS // SCHALTTAFEL              " + spin + res + "\n";
            if (phase === PHASE.PRE_RESET) out += c_rd + " ! PRE_RESET — Install steht bevor" + res + "\n";
            out += c_cy + "=================================================" + res + "\n";

            out += c_w + " [ KINETIK ]" + res + "\n";
            out += ns.sprintf(" > Auslastung: %5.1f%%   %s / %s\n",
                kin.total > 0 ? (kin.busy / kin.total) * 100 : 0,
                formatRam(kin.busy), formatRam(kin.total));
            out += " " + drawSegmentBar(kin.parts, kin.total, 45) + "\n";
            if (kin.detailed) {
                for (const line of kineticLegend(kin.parts, kin.fehlendeKlassen)) out += "  " + line + "\n";
            } else {
                out += "  " + c_ye + "(Dispatcher-Snapshot fehlt oder ist alt — nur belegt/frei)" + res + "\n";
            }
            if (cache.hnMax > 0) {
                out += ns.sprintf(" > Hacknet:    %5.1f%%   %s / %s\n",
                    (cache.hnUsed / cache.hnMax) * 100, formatRam(cache.hnUsed), formatRam(cache.hnMax));
                out += " " + drawSegmentBar(
                    [{ gb: cache.hnUsed, color: c_bl2 }], cache.hnMax, 45) + "\n";
                // v5.7 — DIE BESCHRIFTUNG WAR EINE BEHAUPTUNG VON GESTERN.
                // "kein Worker-RAM" stimmt, solange Hashes etwas wert sind:
                // dann haelt der Dispatcher HN_HASH_RESERVE_FRAC frei, damit
                // die Hash-Produktion weiterlaeuft. Sind Hashes wertlos, setzt
                // er hnReserveFrac auf 0 (DISPATCHER v12.3) und nimmt die
                // Server VOLLSTAENDIG in den Pool. Im Bild vom 06.09. waren sie
                // zu 99,8 % belegt, waehrend daneben "kein Worker-RAM" stand.
                {
                    let hashWertlos = false;
                    try {
                        const b = readInfoBlock(ns, "bn", Infinity);
                        hashWertlos = !!(b && b.features && b.features.hashesWorthless);
                    } catch (e) { hashWertlos = false; }
                    out += "  " + c_bl2 + "\u2588" + res + (hashWertlos
                        ? " HNS — Hashes hier wertlos, laeuft voll als Worker-RAM mit\n"
                        : " HNS (eigener Pool — Reserve fuer die Hash-Produktion)\n");
                }
            }
            // ---------------------------------------------------------------
            // v5.8 — BRUECKE: LEBENSZEICHEN VOM PC
            // ---------------------------------------------------------------
            // Das Spiel kann den Verbindungszustand der Remote-API NICHT selbst
            // abfragen. Er entsteht in RemoteFileAPI/RemoteFileAPI.ts:20
            // (getRemoteFileApiConnectionStatus -> "Online"/"Offline"/
            // "Reconnecting") und wird ueber RemoteFileApiConnectionEvents nur
            // an die Oberflaeche verteilt. In den Netscript-Funktionen kommt er
            // nirgends vor — es gibt keinen Weg, ihn zu lesen.
            //
            // Deshalb umgekehrt: SCHWARM-BRUECKE.ps1 legt nach jedem geglueckten
            // Lauf SCHWARM-BRUECKE-STATUS.txt ab. Diese Datei KANN NICHT LUEGEN —
            // sie kommt nur an, wenn eine Verbindung bestand. Ihr Alter ist die
            // Aussage, nicht ihr Inhalt.
            //
            // Den Takt gibt die Bruecke selbst mit (Feld "takt"). Bewusst nicht
            // hier als Konstante: eine Zahl, die an zwei Stellen gepflegt wird,
            // war in diesem Projekt schon dreimal die Fehlerursache (Portnummern
            // in Kommentaren, Queen-Stempel, minRam-Doku).
            {
                let bl = null;
                try {
                    let roh = ns.read("SCHWARM-BRUECKE-STATUS.txt");
                    // BOM und Rand abschneiden. PowerShell haengt beim Schreiben
                    // je nach Fassung und Codierung ein U+FEFF davor, und
                    // JSON.parse wirft daran — die Anzeige waere dann stumm auf
                    // "noch kein Lebenszeichen" gefallen, also auf genau die
                    // Meldung, die "Bruecke laeuft nicht" bedeutet. Ein
                    // unsichtbares Zeichen haette wie ein Ausfall ausgesehen.
                    //
                    // U+FEFF ausgeschrieben, NICHT als Zeichen. Erst stand hier
                    // das BOM selbst im Ausdruck - unsichtbar im Editor, und
                    // jede Umkodierung oder ein Kopieren durch ein Werkzeug,
                    // das Zeichen normalisiert, haette den Schutz stillschweigend
                    // entfernt. SCHWARM-PRUEFER.pl hat genau das gemeldet
                    // (Pruefung 6, "Null-Breite-Zeichen") - beim ersten Lauf
                    // ueber diese Datei.
                    if (typeof roh === "string") roh = roh.replace(/^\uFEFF/, "").trim();
                    if (roh && roh.length > 1) bl = JSON.parse(roh);
                } catch (e) { bl = null; }

                const zeit = (ms) => {
                    const s = Math.max(0, Math.round(ms / 1000));
                    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
                };

                if (!bl || typeof bl.ts !== "number") {
                    out += "\n  " + c_w + "█" + res
                        + " BRUECKE — noch kein Lebenszeichen"
                        + c_w + "  (SCHWARM-BRUECKE.ps1 ab v2.2 legt es an)" + res;
                } else {
                    const takt  = (typeof bl.takt === "number" && bl.takt > 0) ? bl.takt * 1000 : 600000;
                    const alter = Date.now() - bl.ts;
                    const bis   = takt - alter;

                    // Drei Stufen. Die Schwellen sind bewusst grosszuegig: ein
                    // Lauf faellt schon aus, wenn das Spiel kurz zu war, und ein
                    // Alarm, der bei jedem Tab-Wechsel angeht, wird ignoriert.
                    let farbe, text;
                    if (alter <= takt * 1.3) {
                        farbe = c_gr;
                        text  = "verbunden";
                    } else if (alter <= takt * 2.5) {
                        farbe = c_ye;
                        text  = "ein Lauf ausgelassen";
                    } else {
                        farbe = c_rd;
                        text  = "keine Verbindung";
                    }

                    out += "\n  " + farbe + "█" + res + " BRUECKE v" + (bl.v || "?")
                        + " — " + farbe + text + res
                        + c_w + "   letzter Kontakt vor " + zeit(alter) + res;
                    // Die Restzeit nur zeigen, solange sie eine Aussage ist.
                    // Ist der Takt laengst ueberschritten, waere "in -12:03"
                    // schlechter als gar nichts.
                    if (bis > 0) out += c_w + ", naechster in ~" + zeit(bis) + res;
                    if (typeof bl.geholt === "number") {
                        out += c_w + "   (" + bl.geholt + " Datei"
                            + (bl.geholt === 1 ? "" : "en") + " geholt)" + res;
                    }

                    // Der Vorpruefer ist eine EIGENE Aussage. Er faerbt den
                    // Punkt nicht mit ein: der Punkt beantwortet "steht die
                    // Verbindung?", nicht "ist der Quelltext sauber?". Zwei
                    // Fragen in eine Ampel zu pressen macht beide unlesbar.
                    if (bl.pruefer && typeof bl.pruefer.befunde === "number") {
                        const p = bl.pruefer;
                        out += "\n  " + (p.befunde > 0 ? c_rd : c_gr) + "█" + res
                            + " PRUEFER — " + (p.befunde > 0
                                ? c_rd + p.befunde + " Befund(e)" + res + c_w + " (SCHWARM-PRUEFER.pl auf dem PC)" + res
                                : c_gr + "sauber" + res)
                            + (p.hinweise > 0 ? c_w + ", " + p.hinweise + " Hinweis(e)" + res : "");
                    }
                }
            }

            out += "\n" + c_cy + "=================================================" + res;

            // --- 7. Steuerflächen + HUD ---
            ensureButtons(ns, daemonKeys, state, cache.locations, caps, capsKnown);
            ensureEndgameBar(ns, endgameItems, tick);

            if (isDaemonEnabled(ns, HUD_KEY, state)) {
                const rows = buildHudRows({
                    bitNode, bitNodeSf,
                    cash, stockValue, corpFunds,
                    ema: rates.ema,
                    // v5.6: getrennte Summen fuer die Ein- und Ausgabenzeile
                    emaPlus: rates.emaPlus,
                    emaMinus: rates.emaMinus,
                    scriptInc, scriptExp, sharePower, karma, reserve,
                    hashNum: hnHashes, hashCap: hnCap, hashFresh: hiFresh,
                    hashProdPerSec: hiFresh ? (Number(hi.prodPerSec) || 0) : 0,
                    hashSpendPerMin: hashSpend.ema,
                    gang: gi, gangFresh: giFresh,
                    corp: ci,
                    srvTotal: cache.srvTotal, srvRooted: cache.srvRooted, srvPurchased: cache.srvPurchased,
                    hnCount: cache.hnCount, hnMax: cache.hnMax, hnUsed: cache.hnUsed,
                    homeMax: cache.homeMax, homeUsed: cache.homeUsed,
                    ramMax: cache.ramMax, ramUsed: cache.ramUsed,
                });
                renderHud(ns, hud, rows);
            } else if (hud.built) {
                teardownHud(hud);
            }

            ns.clearLog();
            ns.print(out);
        } catch (e) {
            ns.print("\x1b[31m[DASHBOARD-FEHLER] " + e + "\x1b[0m");
        }
        tick++;
        await ns.asleep(BASE_MS);
    }
}

/**
 * Toggle-Zustand lesen: KEY -> 0|1|2. Nutzt den GETEILTEN Leser readManagedState
 * aus HELPERS + die korrekten Registry-Defaults (triggered/defaultOff -> 0, sonst 1),
 * exakt wie die Queen die State-Datei schreibt.
 * @param {NS} ns
 * @param {string[]} keys
 * @returns {Object<string, number>}
 */
function readQueenState(ns, keys) {
    const state = {};
    for (const k of keys) {
        const d = DAEMONS[k];
        state[k] = (d && (d.triggered || d.defaultOff)) ? 0 : 1;   // Registry-Default
    }
    const parsed = readManagedState(ns);
    for (const k of keys) if (k in parsed) state[k] = parsed[k];
    return state;
}

/**
 * Tail-Fenster dieses Dashboards finden (Titel-Treffer). Gemeinsame Hilfe für
 * Button- und ENDGAME-Leiste.
 * @returns {Element|null}
 */
function findTailWindow(doc) {
    for (const w of doc.querySelectorAll(".react-draggable")) {
        if (w.textContent.includes("SCHWARM-DASHBOARD.js")) return w.querySelector(".react-resizable");
    }
    return null;
}

/**
 * Button-Leiste sicherstellen und einfärben. Baut die Leiste (mit IDs) nur dann
 * neu, wenn sie fehlt oder das Tail-Fenster neu gezeichnet wurde — sonst werden
 * nur Farbe + Tooltip aktualisiert (flackerfrei).
 * Klick toggelt: läuft/gewollt -> "STOP:<KEY>", sonst -> "START:<KEY>".
 *
 * Farb-Code: grün=läuft · cyan=forciert · gelb=startet · rot=wird beendet ·
 *            grau=aus · magenta=wartet auf Freischaltung (Capability fehlt).
 *
 * @param {NS} ns
 * @param {string[]} keys
 * @param {Object<string, number>} states KEY -> 0|1|2
 * @param {Object<string, string|null>} locations KEY -> Host oder null
 * @param {Object<string, boolean>} caps
 * @param {boolean} capsKnown
 */
/**
 * v6.0 — WANN HAT ZULETZT EIN MENSCH ETWAS GETAN?
 *
 * DER TRICK IST, NICHT ZU FRAGEN WAS. Der Spieler wollte Terminal-Eingaben,
 * Schalterdrucke und von Hand getaetigte Kaeufe (Augs, Hashes, Corp) erkennen.
 * Jede dieser Handlungen einzeln nachzuweisen waere teuer und zerbrechlich:
 * man muesste Spielerzustand pollen und gegen das halten, was der Schwarm
 * selbst bestellt hat.
 *
 * Sie haben aber alle EINE Gemeinsamkeit: sie brauchen eine Eingabe im
 * Spielfenster. Ein Tastendruck oder ein Mausklick. Deshalb genuegt EIN
 * Lauscher am Dokument, und er erfasst alle drei Faelle auf einmal —
 * einschliesslich derer, an die wir nicht gedacht haben.
 *
 * KOSTEN: null. Der Lauscher wird EINMAL gesetzt (Merker am Dokument gegen
 * Mehrfachregistrierung), und geschrieben wird hoechstens alle 5 Sekunden
 * (clearPort/tryWrite sind 0 GB). Kein Polling, kein Timer.
 *
 * WAS ER NICHT SIEHT: reines Zuschauen ueber noVNC ohne Anfassen. Das ist
 * gewollt — "keine Aktionen feststellbar" heisst genau das.
 *
 * Faellt der Lauscher aus, bleibt der Stempel alt und der Schwarm haelt den
 * Spieler fuer abwesend. Das ist die sichere Richtung fuer unbeobachtetes
 * Spielen und damit der richtige Fehlerfall.
 */
function ensureAktivitaetsLauscher(ns) {
    try {
        const doc = globalThis["document"];
        if (!doc || doc["__schwarmAktivHook"]) return;
        const h = ns.getPortHandle(SCHWARM_PORTS.AKTIV_OUT);
        let zuletzt = 0;
        const melden = () => {
            const now = Date.now();
            if (now - zuletzt < 5000) return;     // Drossel: hoechstens alle 5 s
            zuletzt = now;
            try { h.clear(); h.tryWrite(String(now)); } catch (e) { /* Port weg */ }
        };
        for (const art of ["keydown", "mousedown", "wheel"]) {
            doc.addEventListener(art, melden, true);   // capture: auch aus Unterfenstern
        }
        doc["__schwarmAktivHook"] = true;
        melden();                                  // der Start selbst zaehlt als Aktion
        ns.print("AKTIVITAET: Lauscher gesetzt (keydown/mousedown/wheel).");
    } catch (e) { ns.print("[WARNUNG] Aktivitaets-Lauscher: " + e); }
}

function ensureButtons(ns, keys, states, locations, caps, capsKnown) {
    try {
        const doc = globalThis["document"];
        if (!doc) return;
        ensureAktivitaetsLauscher(ns);   // v6.0: einmalig, danach ein No-Op
        const tailWindow = findTailWindow(doc);
        if (!tailWindow) return;

        let bar = doc.getElementById("schwarm-button-bar");
        if (!bar || !tailWindow.contains(bar)) {
            if (bar) bar.remove();
            bar = doc.createElement("div");
            bar.id = "schwarm-button-bar";
            bar.style.padding = "5px";
            bar.style.borderBottom = "1px solid #00ffff";
            bar.style.display = "flex";
            bar.style.flexWrap = "wrap";
            bar.style.gap = "6px";
            bar.style.backgroundColor = "#050505";
            for (const key of keys) {
                const btn = doc.createElement("button");
                btn.id = "schwarm-btn-" + key;
                btn.innerText = key;
                btn.style.backgroundColor = "#111";
                btn.style.border = "1px solid #555";
                btn.style.padding = "3px 8px";
                btn.style.cursor = "pointer";
                btn.style.fontFamily = "monospace";
                btn.style.fontSize = "12px";
                btn.onclick = () => {
                    try {
                        const st = readQueenState(ns, keys);
                        const d = DAEMONS[key];
                        // One-Shots (SCAN, RESET) kennen kein "läuft" — ein Klick ist
                        // immer ein Auslösen. Ohne diese Ausnahme wäre der zweite Klick
                        // ein STOP auf einen Prozess, den es nicht mehr gibt.
                        //
                        // v5.1: FORCE statt START. Ein START setzt nur state=1; für
                        // RESET verlangt shouldRun() in der Queen aber zusätzlich ein
                        // WANT ("if (key === \"RESET\") return !!S.wants.RESET;"), das
                        // ausschließlich handleResetCycle nach BANKs Port-19-Meldung
                        // setzt. Der Daemon startete also nie und der Knopf blieb gelb
                        // hängen ("an, aber läuft nicht"). FORCE setzt state=2, und der
                        // 2er-Zweig steht in shouldRun VOR dem RESET-Sonderfall.
                        // Gegen einen Dauer-Install setzt der Payload seinen Schalter
                        // beim Start selbst auf den Registry-Default zurück
                        // (PAYLOADS v0.5) — RESET auf 1, SCAN auf 0.
                        //
                        // v5.3 — RESET IST HIER RAUS. Der FORCE-Zweig setzt state=2,
                        //   und in der Queen steht "if (state[key] === 2) return true;"
                        //   VOR dem RESET-Sonderfall. Ein Klick loeste also sofort den
                        //   Aug-Install aus — waehrend der Spieler den Knopf fuer einen
                        //   Not-Aus hielt, weil er in der Fassung vor v5.1 nur state=1
                        //   setzte und sichtbar nichts tat ("blieb gelb haengen").
                        //   Ein Knopf, den man fuer wirkungslos haelt und der in
                        //   Wahrheit die folgenreichste Aktion des Schwarms ausloest,
                        //   ist die gefaehrlichste Sorte Bedienelement.
                        //
                        //   RESET ist jetzt ein normaler An/Aus-Schalter:
                        //     an  -> handleResetCycle darf ihn anfordern, sobald BANK
                        //            auf Port 19 meldet. Das ist der Regelfall.
                        //     aus -> shouldRun bricht schon an isDaemonEnabled ab
                        //            (SCHWARM-QUEEN.js:373) — kein Prestige.
                        //   Ausloesen von Hand geht damit nicht mehr, und das ist
                        //   Absicht: der Anlass kommt von BANK, nicht vom Daumen.
                        //
                        //   SCAN bleibt im FORCE-Zweig — dort IST der Knopf der
                        //   Ausloeser, und ein Scan kostet nichts als Rechenzeit.
                        if (d && d.oneshotDaemon && key !== "RESET") {
                            sendCmd(ns, "FORCE:" + key); return;
                        }
                        const on = st[key] === 1 || st[key] === 2;
                        sendCmd(ns, (on ? "STOP:" : "START:") + key);
                    } catch (e) { /* Klick verwerfen */ }
                };
                bar.appendChild(btn);
            }
            tailWindow.insertBefore(bar, tailWindow.firstChild);
        }

        // Jeder Button ist ein farbiges SEGMENT: Rahmen + Text in der Statusfarbe,
        // Hintergrund als dunkle Tönung derselben Farbe.
        const tint = { "#00ff66": "#0a2417", "#00ffff": "#062525", "#ffcc00": "#2a2205",
                       "#ff4444": "#2a0d0d", "#cc66ff": "#1e1029", "#555": "#141414" };

        // v5.9 — IST DER UEBERGANG MOEGLICH? Das ist eine Eigenschaft der LAGE,
        // nicht des Schalters: auch bei ausgeschaltetem BITNODE soll man sehen,
        // dass man jetzt von Hand beenden koennte. Quelle ist der blade-Block
        // von INFO; getNextBlackOp() liefert null, wenn ALLE BlackOps durch
        // sind — genau die Bedingung, die destroyW0r1dD43m0n akzeptiert
        // (bladeburnerRequirements, NetscriptFunctions/Singularity.ts).
        let uebergangMoeglich = false;
        try {
            const bl = readInfoBlock(ns, "blade", 90_000);
            uebergangMoeglich = !!(bl && bl.inDivision === true && bl.nextBlackOp === null);
        } catch (e) { uebergangMoeglich = false; }
        // Blinken heisst hier: zwischen zwei Farben wechseln, im Sekundentakt.
        // Der Wechsel haengt an der Uhr, nicht an einem Zaehler — dann blinkt es
        // auch dann weiter, wenn eine Aktualisierung einmal ausfaellt.
        const blinkRot = (Math.floor(Date.now() / 800) % 2) === 0;

        for (const key of keys) {
            const btn = doc.getElementById("schwarm-btn-" + key);
            if (!btn) continue;
            const d = DAEMONS[key] || {};
            const mode = states[key];
            const running = locations[key] != null;
            const reqCap = CAPABILITY_GATE[key];
            // Virtuelle Einträge (SLEEVES, OVERVIEW) haben KEINEN Prozess -> "running"
            // über PID ist sinnlos. Sie sind schlicht an (grün) oder aus (grau).
            // Ohne diese Sonderregel blieben sie dauerhaft gelb ("startet…").
            const isVirtual = !!d.virtual;
            // One-Shots (SCAN, RESET) laufen unter einer Sekunde. Sie sind
            // "bereit", nicht "an" — ein gelbes "startet…" wäre irreführend.
            const isOneShot = !!d.oneshotDaemon;
            const gated = mode !== 0 && !running && !isVirtual && reqCap && capsKnown && caps[reqCap] !== true;
            let col, tip;
            if (isVirtual) {
                if (mode !== 0) { col = "#00ff66"; tip = key === HUD_KEY ? "HUD im Overview aktiv" : "aktiv (über den Eltern-Daemon)"; }
                else { col = "#555"; tip = "aus"; }
            }
            else if (gated) { col = "#cc66ff"; tip = "wartet auf Freischaltung (" + reqCap + ")"; }
            // v5.5 — RESET WAR IMMER GRAU, EGAL WIE DER SCHALTER STAND.
            //   v5.3 hat RESET vom Auslöser zum An/Aus-Schalter gemacht, aber
            //   die FARBE blieb der One-Shot-Zweig darunter: der kennt nur
            //   "läuft gerade" (cyan) oder grau. RESET läuft aber nur
            //   Sekundenbruchteile — der Knopf war also praktisch immer grau,
            //   und der Tooltip behauptete obendrein "Klick startet sie",
            //   obwohl der Klick seit v5.3 nur noch umschaltet.
            //
            //   Am 05.09.2026 hat das echten Schaden angerichtet: RESET stand
            //   auf aus, niemand konnte es sehen, und BANK hing dadurch
            //   dauerhaft in der Reset-Phase (kein Install möglich). Der
            //   Schwarm kaufte keine Server mehr und der TRADER blieb aus.
            //
            //   "an" heißt hier SCHARF, nicht "läuft": den Install löst BANK
            //   aus, sobald die Aug-Runde durch ist. Ein gelbes "startet…"
            //   wäre deshalb genauso falsch wie das Grau.
            // v6.0 — AUTO: kein Daemon, sondern die Selbstverwaltung.
            // Gruen heisst NICHT "laeuft", sondern "darf": nach zwei Stunden
            // ohne Eingabe schaltet die Queen ein, was kann, und die
            // kosmetischen Anzeigen aus. Der Tooltip nennt die verbleibende
            // Zeit, damit man nicht raten muss, ob gleich etwas passiert.
            else if (key === "AUTO") {
                let rest = null;
                try {
                    const roh = Number(ns.peek(SCHWARM_PORTS.AKTIV_OUT));
                    if (isFinite(roh) && roh > 0) rest = Math.max(0, AUTO_RUHE_MS - (Date.now() - roh));
                } catch (e) { rest = null; }
                if (mode === 0) { col = "#555"; tip = "aus — der Schwarm fasst keinen Schalter selbst an"; }
                else if (rest === null) { col = "#ffcc00"; tip = "an, aber noch keine Aktivitaet gemessen"; }
                else if (rest > 0) {
                    col = "#00ff66";
                    tip = "an — greift in " + Math.ceil(rest / 60000) + " min ohne weitere Eingabe";
                } else { col = "#00ffff"; tip = "an und AKTIV — der Schwarm verwaltet sich gerade selbst"; }
            }
            // v5.9 — BITNODE: die folgenreichste Taste im ganzen Brett.
            // Drei Zustaende, und der dritte ist der eigentliche Zweck:
            //   grau   aus, Uebergang auch nicht moeglich — nichts zu sehen
            //   gruen  an, wartet (Freigabe oder Engine-Bedingung fehlt noch)
            //   BLINKT der Uebergang IST moeglich. Gelb/rot im Wechsel, damit
            //          es niemand uebersieht — egal ob der Schalter an ist.
            //          Bei ausgeschaltetem Schalter heisst es: du koenntest
            //          jetzt von Hand beenden. Bei angeschaltetem: es passiert
            //          jeden Moment.
            else if (key === "BITNODE") {
                if (uebergangMoeglich) {
                    col = blinkRot ? "#ff4444" : "#ffcc00";
                    tip = mode !== 0
                        ? "UEBERGANG MOEGLICH und der Schalter ist AN — der Daemon beendet den Durchlauf, sobald die Freigabe frisch ist."
                        : "UEBERGANG MOEGLICH, Schalter ist AUS — von Hand: Bladeburner-Seite, Knopf \"Destroy w0r1d_d43m0n\".";
                }
                else if (mode !== 0) { col = "#00ff66"; tip = "scharf — wartet auf Freigabe (schwarm-plan.txt) UND Engine-Bedingung"; }
                else { col = "#555"; tip = "aus — dieser Durchlauf wird nicht beendet"; }
            }
            else if (key === "RESET") {
                if (running) { col = "#00ffff"; tip = "installiert gerade @ " + locations[key]; }
                else if (mode !== 0) { col = "#00ff66"; tip = "scharf — Install, sobald BANK die Aug-Runde als durch meldet"; }
                else { col = "#555"; tip = "aus — kein Install; der Schwarm investiert normal weiter"; }
            }
            else if (isOneShot) {
                if (running) { col = "#00ffff"; tip = "läuft gerade @ " + locations[key]; }
                else { col = "#555"; tip = "Einmal-Aktion — Klick startet sie"; }
            }
            else if (mode === 2 && running) { col = "#00ffff"; tip = "forciert @ " + locations[key]; }
            else if (mode !== 0 && running) { col = "#00ff66"; tip = "läuft @ " + locations[key]; }
            else if (mode !== 0 && !running) { col = "#ffcc00"; tip = "startet…"; }
            else if (mode === 0 && running) { col = "#ff4444"; tip = "wird beendet"; }
            else { col = "#555"; tip = "aus"; }
            btn.style.color = col;
            btn.style.borderColor = col;
            btn.style.backgroundColor = tint[col] || "#111";
            btn.title = tip;
        }
    } catch (e) {
        ns.print("[WARNUNG] Buttons: " + e);
    }
}

/**
 * Blinkende ENDGAME-Leiste ÜBER der Button-Leiste. Reine Info — kein onClick,
 * keine Auslösung. Erscheint nur für Items mit blink=true (Option besteht JETZT).
 * @param {NS} ns
 * @param {{id:string, blink:boolean, text:string}[]} items
 * @param {number} tick
 */
function ensureEndgameBar(ns, items, tick) {
    try {
        const doc = globalThis["document"];
        if (!doc) return;
        const ready = (items || []).filter(i => i.blink);
        let bar = doc.getElementById("schwarm-endgame-bar");
        if (ready.length === 0) { if (bar) bar.remove(); return; }

        const tailWindow = findTailWindow(doc);
        if (!tailWindow) return;
        if (!bar || !tailWindow.contains(bar)) {
            if (bar) bar.remove();
            bar = doc.createElement("div");
            bar.id = "schwarm-endgame-bar";
            bar.style.padding = "6px 8px";
            bar.style.fontFamily = "monospace";
            bar.style.fontSize = "13px";
            bar.style.fontWeight = "bold";
            bar.style.color = "#ffffff";
            bar.style.borderBottom = "1px solid #0a84ff";
            bar.style.textAlign = "center";
            tailWindow.insertBefore(bar, tailWindow.firstChild);
        }
        bar.style.backgroundColor = (Math.floor(tick / 2) % 2 === 0) ? "#0a84ff" : "#052b52";
        bar.innerText = ready.map(i => "\u25b6 " + i.text).join("   |   ");
        bar.title = "ENDGAME-Info — Auslösung erfolgt NUR manuell durch dich.";
    } catch (e) { /* Anzeige-Fehler nie eskalieren */ }
}

// ---------------------------------------------------------------------------
// OVERVIEW-HUD: DOM-Teil
// ---------------------------------------------------------------------------

const HUD_CSS_ID = "schwarmHudCSS";
const HUD_CSS = "<style id=\"" + HUD_CSS_ID + "\">"
    + ".schwarm-hud { margin: 0; position: relative; }"
    + ".schwarm-hud.hidden { display: none; }"
    + ".schwarm-hud:hover .schwarm-tip { visibility: visible; opacity: 0.92; }"
    + ".schwarm-hud .schwarm-tip {"
    + "  visibility: hidden; position: absolute; z-index: 10002;"
    + "  right: 20px; top: 19px; padding: 3px 10px;"
    + "  text-align: right; white-space: pre; font-family: monospace;"
    + "  border-radius: 6px; border: 1px solid #0ff8; background-color: #000d;"
    + "}"
    + "</style>";

/** CSS einmalig einhängen. Eigene ID -> kollidiert nicht mit stats.js. */
function ensureHudCss(doc) {
    if (doc.getElementById(HUD_CSS_ID)) return;
    doc.head.insertAdjacentHTML("beforeend", HUD_CSS);
}

/**
 * HUD zeichnen. Die Knoten entstehen EINMAL; danach werden nur textContent und
 * die hidden-Klasse angefasst — deshalb flackert nichts.
 *
 * @param {NS} ns
 * @param {{nodes:object, built:boolean}} hud
 * @param {Object<string,{show:boolean,value:string,tip:string}>} rows
 */
function renderHud(ns, hud, rows) {
    try {
        const doc = globalThis["document"];
        if (!doc) return;
        const hook0 = doc.getElementById("overview-extra-hook-0");
        const hook1 = doc.getElementById("overview-extra-hook-1");
        if (!hook0 || !hook1) return;   // Overview eingeklappt -> nichts zu tun

        // Neu bauen, wenn die Knoten fehlen oder das Overview neu gerendert wurde.
        const first = hud.nodes[HUD_ROWS[0].key];
        if (!hud.built || !first || !hook0.contains(first.title)) {
            teardownHud(hud);
            ensureHudCss(doc);
            const mk = (txt) => {
                const p = doc.createElement("p");
                p.className = "schwarm-hud hidden";
                const text = doc.createElement("span");
                text.textContent = txt;
                p.appendChild(text);
                const tip = doc.createElement("span");
                tip.className = "schwarm-tip";
                p.appendChild(tip);
                return { p, text, tip };
            };
            for (const row of HUD_ROWS) {
                const t = mk(row.label.padEnd(10, " "));
                const v = mk("");
                hook0.appendChild(t.p);
                hook1.appendChild(v.p);
                hud.nodes[row.key] = { title: t.p, titleText: t.text, titleTip: t.tip,
                                       value: v.p, valueText: v.text, valueTip: v.tip };
            }
            hud.built = true;
        }

        for (const row of HUD_ROWS) {
            const n = hud.nodes[row.key];
            const r = rows[row.key] || { show: false, value: "", tip: "" };
            if (!n) continue;
            if (r.show) {
                // Wert links vom Rand freistellen (wie stats.js): ein Leerzeichen.
                const val = " " + String(r.value).trim();
                if (n.valueText.textContent !== val) n.valueText.textContent = val;
                if (n.valueTip.textContent !== r.tip) n.valueTip.textContent = r.tip;
                if (n.titleTip.textContent !== r.tip) n.titleTip.textContent = r.tip;
                n.title.classList.remove("hidden");
                n.value.classList.remove("hidden");
            } else {
                n.title.classList.add("hidden");
                n.value.classList.add("hidden");
            }
        }
    } catch (e) { /* Anzeige-Fehler nie eskalieren */ }
}

/**
 * HUD abräumen. WICHTIG: es wird NICHT innerHTML="" gesetzt (so macht es
 * stats.js) — läuft stats.js parallel, würde das dessen Zeilen mitlöschen.
 * Entfernt werden ausschließlich die eigenen Knoten.
 * @param {{nodes:object, built:boolean}} hud
 */
function teardownHud(hud) {
    try {
        for (const key of Object.keys(hud.nodes || {})) {
            const n = hud.nodes[key];
            try { if (n.title) n.title.remove(); } catch (e) { /* egal */ }
            try { if (n.value) n.value.remove(); } catch (e) { /* egal */ }
        }
        hud.nodes = {};
        hud.built = false;
    } catch (e) { /* egal */ }
}