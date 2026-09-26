/**
 * SCHWARM-GENESIS.js — v5.1
 *
 * v5.1 — SICHERUNG DER SKRIPTE. GENESIS laeuft nach jedem Aug-Reset und ist
 *   damit die richtige Stelle, die Rueckfahrkarte frisch zu halten:
 *   SCHWARM-SICHERUNG.txt auf home neu schreiben (home ueberlebt den Reset,
 *   ServerHelpers.ts:224), Spiegel auf n00dles neu anlegen (der ueberlebt ihn
 *   NICHT, Prestige.ts:74 ruft AllServers.clear), und fehlende Skripte aus der
 *   Sicherung zurueckschreiben. Gegenstueck dazu: SCHWARM-CLEAN --restore.
 *
 * ===========================================================================
 * ÄNDERUNG ggü. v4 (v5) — SINGULARITY-SELBSTTEST (Bugfix)
 * ===========================================================================
 *
 * GENESIS tat nach jedem Reset NICHTS ausser Hacken: kein Gym, keine Verbrechen,
 * kein Frühphasen-Schalter. Ursache war eine Reihenfolge-Falle:
 *
 *   ENGINE (NetscriptWorker.ts:40-46): prestigeWorkerScripts() ruft bei JEDEM
 *   Prestige NetscriptPorts.clear(). Nach Soft- UND Hard-Reset sind ALLE Ports
 *   leer. GENESIS ist aber das erste Glied der Kette und liest Capabilities von
 *   Port 4 — den erst ARSENAL/QUEEN/DISPATCHER/INFO füllen, also SPÄTER.
 *   hasCapability(CAPS.SING) lieferte damit immer false, und beide von diesem
 *   Flag abhängigen Blöcke (playerStep, setupUnlockedSystems) liefen nie.
 *
 * JETZT: GENESIS probiert Singularity direkt über evalNs (Wegwerf-Skript, also
 * kein statischer RAM) und braucht keinen Port. Ohne SF4 wirft der Aufruf, wir
 * liefern false, und die Frühphase macht korrekt nur Hacking. Der Zustand wird
 * beim Start ins Log geschrieben, damit der Fall nicht wieder stumm auftritt.
 *
 * HINWEIS zum Auto-Start nach Reset (verifiziert, Singularity.ts:59-75):
 * runAfterReset startet das Callback-Skript auf home mit KEINEN Argumenten und
 * 1 Thread — GENESIS ist damit kompatibel (main(ns) ohne ns.args). Der Callback
 * greift aber NUR, wenn der Reset per Skript ausgelöst wurde: installAugmentations,
 * softReset, b1tflum3 oder destroyW0r1dD43m0n, jeweils mit "SCHWARM-GENESIS.js"
 * als cbScript. Ein manueller Reset über die Spiel-Oberfläche startet nichts —
 * dafür fehlt der skriptgesteuerte Reset-Auslöser (offener Punkt).
 *
 * ===========================================================================
 * SCHWARM-GENESIS.js — v4
 * Erster Bootstrap-Schritt nach jedem Reset — und universeller "Start von allem".
 *
 * Kette:  GENESIS -> casino.js (Save-Scum auf ~10b) -> SCHWARM-ARSENAL -> SCHWARM-QUEEN
 *
 * ===========================================================================
 * ÄNDERUNGEN ggü. v3 (v4)
 * ===========================================================================
 *
 * A) GYM-VORSTUFE (playerStep). Vor der Crime-Leiter werden die vier Kampfstats
 *    per Powerhouse Gym (Sector-12) auf GYM_TARGET=10 gebracht. Verifiziert
 *    (ClassWork.tsx/WorkStats.ts): Gym hat negative Earnings OHNE Geld-Check
 *    (Player.gainMoney addiert stumpf, Konto geht ins Minus), Shoplift tilgt.
 *    Shoplift-Chance steigt dadurch von ~4 % (Stats 1) auf ~41 % (Stats 10) ->
 *    der Casino-Anlauf wird ueber 10x schneller. Die fruehere Doktrin "kein
 *    Gym-Umweg" (v3-Kommentar) ist damit BEWUSST gekippt.
 *
 * B) FRUEHPHASEN-SCHALTER (setupUnlockedSystems). Bei einem Aug-Reset in einem
 *    LAUFENDEN BitNode sind Gang/Bladeburner/Sleeves bereits freigeschaltet —
 *    dann setzt GENESIS sie sofort produktiv, statt sie bis zum Queen-Neustart
 *    brachliegen zu lassen: Gang -> lukrativster Money-Task je Member,
 *    Bladeburner -> Training, Sleeves -> Shock/Sync/Idle. Bei FRISCHEM BitNode
 *    ist nichts davon vorhanden -> jeder Zweig wird still uebersprungen. GENESIS
 *    SETZT nur einmal; sobald die Queen die Daemons startet, uebernehmen die
 *    (kein Konflikt, nur Reihenfolge). Alles in try/catch, RAM-tolerant.
 *
 * C) RESET-BOOTFAEHIG (unveraendert bestaetigt): main(ns) nimmt keine Args,
 *    liest kein ns.args. Ein installAugmentations("SCHWARM-GENESIS.js")-Callback
 *    startet identisch zum Erststart; cleanupSwarm raeumt am Anfang auf. GENESIS
 *    ist damit das Callback-Ziel des (spaeter in BANK/Queen gebauten) Aug-Reset-
 *    Zyklus.
 *
 * ===========================================================================
 * ÄNDERUNGEN ggü. v2
 * ===========================================================================
 *
 * 1) PROZESSFLUT BEHOBEN (der Grund, warum die Startphase kroch).
 *    v2 rief deploy() JEDE SEKUNDE und vergab dabei `Math.random()`-UIDs. Damit
 *    umging es gezielt Bitburners Duplikatschutz: es entstanden jede Sekunde NEUE
 *    Worker-Prozesse, während die alten noch minutenlang weakten. Nach zwei Minuten
 *    liefen hunderte Prozesse — und Bitburner ist SINGLE-THREADED: Engine, React
 *    und alle Skripte teilen sich EINEN Thread. Die Engine iteriert pro Frame über
 *    jeden Prozess, Active-Scripts rendert die Liste, der Autosave serialisiert sie.
 *    Das ist derselbe Bug, der im DISPATCHER v7 gefixt wurde — hier lebte er weiter.
 *
 *    JETZT: ns.ps() zählt, was je (Aktion|Ziel) SCHON LÄUFT; nachgelegt wird nur die
 *    Differenz zum Bedarf. UIDs sind ein Zähler, kein Zufall.
 *
 * 2) STRIKTES PREP-THEN-HACK.
 *    v2 feuerte immer 10 % Hack-Threads mit — auch auf ungepreppte Ziele mit hoher
 *    Security. Ein Hack auf einem Server weit über minSec hat eine miserable Chance
 *    UND stiehlt nur einen Bruchteil. Das waren verschwendete Threads.
 *    JETZT: erst weaken auf minSec, dann grow auf maxMoney, DANN hacken.
 *
 * 3) CRIME PARALLEL (mit SF4).
 *    Der Spieler-Aktions-Slot lag in der gesamten Frühphase brach. commitCrime
 *    liefert ab Sekunde 0 Geld UND Karma UND Kampfstats — alle drei braucht der
 *    Schwarm später ohnehin (Gang-Freischaltung, Bladeburner-Unlock).
 *    Strategie laut Vorgabe: nur so viel trainieren, dass das BILLIGSTE Verbrechen
 *    über 50 % Erfolgschance kommt; danach hochstufen Shoplift -> Mug -> Homicide,
 *    sobald die jeweilige Chance reicht. Kein Gym-Umweg in dieser Phase.
 *
 * 4) nukeIncremental statt nukeAll (Opener-Dateien einmal prüfen statt je Host×5).
 * 5) Kein Auto-Tail.
 *
 * @param {NS} ns
 */
// Eine Quelle fuer Kopf und Laufzeitmeldung. Bis zum Health-Check am
// 04.09.2026 waren das getrennte Freitexte und liefen auseinander: der
// Kopf sagte eine Version, die Startmeldung im Log eine andere. Beim
// Nachstellen eines Fehlers behauptet das Log damit etwas Falsches.
const VERSION = "5.1";


import {
    scanNetwork, nukeIncremental, refreshCrackers, buildRamMapArray,
    setPhase, PHASE, formatMoney, evalNs,
    ensureSingleInstance, announce, markTopoDirty, decodePayload,
    DAEMONS,
} from "SCHWARM-HELPERS.js";
// v4.0: GENESIS materialisiert die drei Ghost-Worker selbst — es ist das ERSTE
// Glied der Kette und laeuft, lange bevor der Dispatcher das sonst tut.
import { materialize } from "SCHWARM-PAYLOADS.js";

// ===================== KONFIGURATION =====================
const CASH_TARGET = 500_000;                   // Startkapital fürs Casino
const CASINO_SCRIPT = "casino.js";
const ARSENAL_SCRIPT = "SCHWARM-ARSENAL.js";
const HOME_RESERVE = 8;
const ARSENAL_LOCK = "/Temp/schwarm-arsenal.lock";

const GHOST_W = "schwarm-w.js";
const GHOST_G = "schwarm-g.js";
const GHOST_H = "schwarm-h.js";
const GHOST_RAM = 1.75;

const LOOP_MS = 1000;
const SEC_TOL = 2;          // sec <= min + dem gilt als "ruhig genug" für die Frühphase
const MONEY_OK = 0.85;      // ab so viel vom Max darf gehackt werden
const WEAKEN_PER_THREAD = 0.05;
const CRIME_MIN_CHANCE = 0.5;               // Vorgabe: erst ab 50 % Erfolgschance begehen
const CRIME_LADDER = ["Homicide", "Mug", "Shoplift"];  // beste zuerst; wir nehmen die beste taugliche

// ---- Frühphasen-Beschleuniger (v4) --------------------------------------
// Kampfstats erst per Gym auf GYM_TARGET, DANN Crime. Grund (verifiziert,
// ClassWork.tsx + WorkStats.ts): Gym hat negative Earnings OHNE Geld-Check
// (gainMoney addiert stumpf, Konto geht ins Minus), Shoplift tilgt danach.
// Shoplift-Chance bei Stats 1 nur ~4 %, bei Stats 10 ~41 % -> der Casino-
// Anlauf wird ueber 10x schneller. Powerhouse Gym, da Start immer Sector-12.
const GYM_TARGET = 10;                       // Kampfstat-Ziel vor Crime
const GYM_NAME = "Powerhouse Gym";
const GYM_CITY = "Sector-12";
// Schalter fuer bereits freigeschaltete Systeme (nur bei Aug-Reset in laufendem
// BitNode vorhanden; bei frischem BitNode einfach nicht getroffen). GENESIS SETZT
// sie nur einmal — sobald die Queen die Daemons startet, uebernehmen die.
const SWITCH_MS = 15_000;                    // Schalter hoechstens alle 15 s prüfen

// ---- Fruehstart-Daemons (v5) --------------------------------------------
// Bis hierher hat GENESIS in der Fruehphase nur EINMALIGE Anstoesse gegeben
// (setupUnlockedSystems: Gang-Task setzen, Bladeburner auf Training, Sleeves
// sortieren). Alles, was daueraft arbeitet, lag brach, bis nach Casino und
// ARSENAL die Queen die Daemons startet.
//
// Der Casino-Lauf beendet zwar ALLES (casino.js wird mit --kill-all-scripts
// gestartet) — aber das macht nichts, denn was diese Daemons erarbeiten, ist
// SPIELSTAND und kein Prozess:
//     Bladeburner-Rang und Skillpunkte, Gang-Respekt und -Geld,
//     Stanek-Ladung, Darknet-Beute und Charisma.
// Das alles ueberlebt den Kill. Nur die Prozesse sterben, und die sind billig.
//
// WICHTIG zur Reihenfolge im Casino: casino.js spielt mit Save-Scumming, laedt
// also bei Verlust den Spielstand neu. Der Bezugspunkt ist der Stand, an dem
// casino.js STARTET — alles, was davor erarbeitet wurde, ist darin enthalten
// und geht nicht verloren.
//
// ZWEI STUFEN, und der Unterschied ist GELD.
//
// In der Fruehphase laeuft die BANK noch nicht. Es gibt also niemanden, der
// Ausgaben freigibt oder begrenzt — und jeder ausgegebene Dollar fehlt beim
// Casino-Einsatz von 500.000. Daraus folgt die Trennung:
//
//   STUFE 1  EINSTELLEN (EARLY_COMMANDS)
//     Ein einzelner Wegwerf-Befehl, kein Prozess. Fuer alles, was von selbst
//     weiterlaeuft, wenn es einmal gesetzt ist — und fuer alles, dessen Daemon
//     Spielergeld ausgeben wuerde. Kostet GENESIS null statisches RAM, weil
//     evalNs den Aufruf in ein Wegwerf-Skript auslagert.
//
//   STUFE 2  DURCHLAUFEN (EARLY_DAEMONS)
//     Der echte Daemon, gestartet auf home, bis casino.js ihn mit
//     --kill-all-scripts beendet. Nur fuer Systeme, die ohne Ausgaben
//     dauerhaft etwas erarbeiten und bei denen ein Einmal-Befehl nicht reicht.
//
// Was beide Stufen erarbeiten, ist SPIELSTAND und ueberlebt den Kill:
// Bladeburner-Rang, Gang-Respekt, Stanek-Ladung, Darknet-Beute, Go-Brettstand.
// Und weil casino.js mit Save-Scumming arbeitet, ist der Bezugspunkt der Stand
// beim START von casino.js — die Vorarbeit ist darin enthalten.
//
// Geprueft wird ueber evalNs-Wegwerfskripte statt ueber bitNodeFeatures(): das
// haette GENESIS rund 1 GB statischen RAM gekostet (hacknet.numNodes und
// hacknet.getNodeStats je 0,5 GB, ueber computeHashesWorthless mitgezogen) —
// ausgerechnet in der Phase, in der home-RAM am knappsten ist. Ausserdem ist
// "bin ich in einer Gang" die ehrlichere Frage als "kann es in dieser BitNode
// Gangs geben".
const EARLY_RAM_FRAC = 0.5;    // hoechstens so viel vom freien home-RAM fuer Stufe 2

// Vorrang von oben nach unten. Wer zuerst steht, bekommt zuerst vom Budget.
const EARLY_DAEMONS = [
    {
        key: "DARKNET",
        // Steht ganz oben, weil hier mit Abstand am meisten zu holen ist, und
        // zwar OHNE einen Cent auszugeben. Im gesamten Darknet-Zweig der Engine
        // gibt es nur ZWEI Geldbewegungen, und beide sind Einnahmen
        // (cacheFiles.ts gainMoney, phishing.ts gainMoney) — kein einziger
        // Abfluss. Was in 60 s anfaellt:
        //   - Charisma-XP bei JEDEM Auth-Versuch, auch bei Fehlschlag
        //   - Root auf geknackten Servern (Weltzustand, ueberlebt den Kill)
        //   - Caches. Ein Geld-Cache bringt rund 10 Mio $ — das Zwanzigfache
        //     dessen, was GENESIS ueberhaupt fuers Casino braucht.
        probe: "(()=>{try{ if(!ns.fileExists(\"DarkscapeNavigator.exe\",\"home\")) return false;"
             + " return typeof ns.dnet.probe===\"function\"; }catch(e){return false;}})()",
        note: "kein Darknet-Zugang (DarkscapeNavigator.exe fehlt)",
    },
    {
        key: "STANEK",
        // Zwei Faelle, beide richtig: das Geschenk liegt schon (dann laedt STANEK
        // es auf — die Ladung wird von JEDEM Reset geloescht und muss ohnehin neu
        // aufgebaut werden), oder es liegt noch nicht und SF13 ist da (dann nimmt
        // STANEK es an — und genau JETZT ist der letzte gute Zeitpunkt, weil die
        // erste Augmentierung dieser BitNode das Fenster fuer immer schliesst).
        probe: "(()=>{try{ns.stanek.giftWidth();return true;}catch(e){"
             + "try{const r=ns.getResetInfo();return r.currentNode===13||(r.ownedSF&&(r.ownedSF.get?r.ownedSF.get(13):r.ownedSF[13]))>0;}"
             + "catch(e2){return false;}}})()",
        note: "kein Stanek-Geschenk und kein SF13",
    },
    {
        key: "CORP",
        // CORP gruendet KEINE Firma — das macht die BANK, und nur dort fliesst
        // Spielergeld (createCorporation mit selfFund -> Player.loseMoney).
        // CORP selbst fasst Player.money an keiner einzigen Stelle an; alle
        // Ausgaben laufen ueber die CORP-FONDS, einen voellig anderen Topf.
        //
        // Der Test auf eine BESTEHENDE Firma ist Pflicht: nach einem
        // BitNode-Wechsel gibt es keine (prestigeSourceFile setzt corporation
        // auf null), und CORP haengt dann nur in seiner 30-Sekunden-
        // Warteschleife und verbraucht home-RAM fuer nichts. Nach einem
        // Aug-Reset in derselben BitNode ueberlebt die Firma dagegen samt
        // Fonds und Divisionen — dann besetzt CORP die Bueros neu, schaltet
        // Smart Supply ein und setzt die Verkaufsauftraege, damit die
        // Produktion auch waehrend der Casino-Phase weiterlaeuft.
        probe: "(()=>{try{return ns.corporation.hasCorporation()===true;}catch(e){return false;}})()",
        note: "keine Firma vorhanden (gegruendet wird spaeter von der BANK)",
    },
    {
        key: "GO",
        // Frueher stand hier, GO koste zu viel Spielzeit und die Fruehphase sei
        // zu kurz fuer eine Partie. Beides war falsch gedacht: der Brettzustand
        // liegt im Spielstand, nicht im Skript. Wird GO vom Casino beendet,
        // bleibt die angefangene Partie stehen — der Payload erkennt sie beim
        // naechsten Start (getGameState().currentPlayer !== "None") und spielt
        // sie weiter, statt ein neues Brett zu setzen. Die Vorarbeit ist also
        // nicht verloren, sondern vorgespielt.
        probe: "(()=>{try{ns.go.getGameState();return true;}catch(e){return false;}})()",
        note: "kein IPvGO verfuegbar",
    },

    // NICHT dabei, und zwar begruendet:
    //
    //   BLADEBURNER — der einzige Kandidat, der in dieser Phase SCHADET.
    //     Nach einer Aug-Installation sind die Kampfstats zurueckgesetzt; der
    //     Payload kommt ueber keine Erfolgsschwelle und faellt auf Field
    //     Analysis zurueck: 0,1 Rang je 30 Sekunden, in einer Minute also 0,2 —
    //     gegen die Faktionsschwelle von 25 belanglos.
    //     Dem steht ein echter Geldabfluss gegenueber: der Daemon hat KEINE
    //     HP-Logik. Er waehlt nie die Hyperbolic Regeneration Chamber, und das
    //     ist im ganzen Spiel die einzige Stelle, die HP zurueckgibt — der
    //     Schaden summiert sich also bis zum Krankenhaus, und das kostet
    //     min(Geld * 0.1, Defizit * 100.000). Nach einem Reset liegt hp.max bei
    //     10 bis 20, ein fehlgeschlagener Contract macht rund 5 Schaden: vier
    //     Fehlschlaege genuegen. Betroffen waeren ausgerechnet die 500.000, die
    //     ins Casino sollen.
    //     Sobald die Kampfstats wieder stehen, ist der Daemon richtig — die
    //     Queen startet ihn dann ohnehin.
];

// ---- STUFE 1: EINSTELLEN (ein Wegwerf-Befehl, kein Prozess) --------------
// Hier steht alles, dessen DAEMON Spielergeld ausgeben wuerde. Der Befehl
// setzt nur die Richtung; gearbeitet wird danach von der Engine selbst.
const EARLY_COMMANDS = [
    {
        key: "GANG-GELD",
        probe: "(()=>{try{return ns.gang.inGang()===true;}catch(e){return false;}})()",
        note: "keine Gang",
        // Der GANGS-Daemon kauft Ausruestung, und die kostet SPIELERGELD —
        // genau das, was gleich ins Casino soll. Deshalb hier nur die
        // Aufgabenverteilung, die selbst nichts kostet und danach von allein
        // weiterlaeuft. Uebernommen aus setupUnlockedSystems, damit es EINE
        // Stelle gibt.
        cmd: `(()=>{try{
            if(!ns.gang.inGang())return null;
            const info=ns.gang.getGangInformation();
            const isHack=info.isHacking;
            const members=ns.gang.getMemberNames();
            const tasks=ns.gang.getTaskNames().map(n=>{try{const t=ns.gang.getTaskStats(n);return {n,money:t.baseMoney||0,comb:t.isCombat,hack:t.isHacking};}catch(e){return null;}}).filter(Boolean);
            const pool=tasks.filter(t=>t.money>0 && (isHack?t["hack"]:t.comb));
            pool.sort((a,b)=>b.money-a.money);
            if(pool.length===0)return {set:0,of:members.length};
            const task=pool[0].n;
            let set=0;
            for(const m of members){try{if(ns.gang.setMemberTask(m,task))set++;}catch(e){}}
            return {set,of:members.length,task};
        }catch(e){return null;}})()`,
        melde: (r) => (r && typeof r === "object") ? `Gang ${r.set}/${r.of} auf ${r.task || "?"}` : null,
    },
];
// =========================================================

/** @param {NS} ns */
// =============================================================================
// v4.1 — DIAG ZUERST, CASINO NUR EINMAL JE DURCHLAUF
// =============================================================================

/** Datei, in der DIAG seinen Dauerauftrag fuehrt. Textdateien ueberleben den
 *  Aug-Reset (ServerHelpers.ts:224 leert nur programs und messages). */
const DIAG_STATE = "schwarm-diag-lauf.txt";
const DIAG_SCRIPT = "SCHWARM-DIAG.js";

/** Merker: In WELCHEM Durchlauf lief das Casino schon? Inhalt ist der
 *  Zeitstempel des letzten Aug-Resets, nicht bloss ein "ja". */
const CASINO_DONE = "/Temp/schwarm-casino-done.txt";

/**
 * Laeuft noch ein DIAG-Dauerauftrag?
 *
 * WARUM GENESIS DAS ANGEHT. Bisher kam DIAG nach einem Aug-Reset erst zurueck,
 * wenn die Queen lief — und die startet erst nach Casino und ARSENAL. Der ganze
 * Anlauf, also genau das Fenster, in dem am meisten schiefgehen kann, wurde nie
 * aufgezeichnet. Der Bericht begann immer erst, wenn schon alles stand.
 *
 * KEINE ARGUMENTE. DIAG traegt Zyklenzahl und Abstand selbst in seiner
 * Fortschrittsdatei; seit v3.5 heisst "ohne Argumente gestartet" dort
 * ausdruecklich "setze den offenen Auftrag fort". GENESIS muss also nicht
 * wissen, an welcher Argumentstelle was steht — eine Kopplung weniger.
 *
 * @param {NS} ns
 * @returns {boolean}
 */
function diagAuftragOffen(ns) {
    try {
        const raw = ns.read(DIAG_STATE);
        if (!raw) return false;
        const o = JSON.parse(raw);
        return !!(o && typeof o.done === "number" && typeof o.cycles === "number"
                  && o.done < o.cycles);
    } catch (e) { return false; }
}

/**
 * Lief das Casino in DIESEM Durchlauf schon?
 *
 * Das Casino ist ein EINMAL-Ereignis je Aug-Reset: casino.js spielt mit
 * Save-Scumming bis zum Hausverbot. Ein zweiter Lauf im selben Durchlauf
 * gewinnt nichts mehr, kostet aber den vollen Anlauf — GENESIS grindet erst auf
 * CASH_TARGET, startet dann casino.js mit --kill-all-scripts und raeumt damit
 * den ganzen laufenden Schwarm ab. Wer nach einem killall von Hand
 * "run SCHWARM-GENESIS.js" tippt, loest genau das aus.
 *
 * Der Merker haelt deshalb den Zeitstempel des Aug-Resets, unter dem das Casino
 * lief — nicht bloss ein "ja". Nach dem naechsten echten Reset stimmt der
 * Zeitstempel nicht mehr ueberein, und das Casino ist wieder frei. Ohne diese
 * Bindung muesste jemand den Merker von Hand loeschen, und der erste Durchlauf
 * in einer neuen BitNode fiele aus.
 *
 * @param {NS} ns
 * @returns {boolean}
 */
function casinoSchonGelaufen(ns) {
    try {
        const raw = String(ns.read(CASINO_DONE) || "").trim();
        if (!raw) return false;
        const jetzt = String(ns.getResetInfo().lastAugReset || 0);
        return raw === jetzt;
    } catch (e) { return false; }   // ohne getResetInfo lieber spielen als blockieren
}

/** Casino fuer DIESEN Durchlauf als erledigt vermerken. @param {NS} ns */
function casinoVermerken(ns) {
    try { ns.write(CASINO_DONE, String(ns.getResetInfo().lastAugReset || 0), "w"); }
    catch (e) { /* Merker ist Komfort, kein Muss */ }
}

// =============================================================================
// v5.1 — SICHERUNG DER SKRIPTE (Gegenstueck zu SCHWARM-CLEAN --restore)
// =============================================================================
//
// GENESIS ist der Anfang von allem und laeuft nach JEDEM Aug-Reset. Damit ist er
// die richtige Stelle, die Rueckfahrkarte frisch zu halten:
//
//   1. Er schreibt SCHWARM-SICHERUNG.txt auf home neu. Home ueberlebt den Reset
//      (ServerHelpers.ts:224 leert nur programs und messages), die Sicherung
//      also auch — dieser Schritt haelt sie nur auf dem neuesten Stand.
//   2. Er legt eine Kopie auf n00dles. Die ueberlebt den Reset NICHT
//      (Prestige.ts:74 ruft AllServers.clear()), muss also nach jedem Reset neu
//      angelegt werden. Genau dafuer steht sie hier. Sie deckt einen einzigen
//      Fall ab: der Reiniger hat auf home zu viel geloescht.
//   3. Fehlt ein Skript, das in der Sicherung steht, schreibt er es zurueck.
//      Das ist der stille Selbstheilungsfall — jemand hat eine Datei geloescht,
//      und niemand haette es gemerkt, bis der zugehoerige Daemon ausfaellt.
//
// n00dles braucht 0 Ports und Hacking 1 (servers.ts:1168), ist also immer
// rootbar. scp verlangt Root auf dem ZIEL (NetscriptFunctions.ts:761-765).
const SICHERUNG_DATEI = "SCHWARM-SICHERUNG.txt";
const SICHERUNG_SPIEGEL = "n00dles";

/**
 * Sicherung schreiben, spiegeln und fehlende Skripte zurueckholen.
 * Bricht nie den Start ab — eine fehlende Sicherung ist ein Nachteil, kein Halt.
 * @param {NS} ns
 */
function sicherungPflegen(ns) {
    try {
        // ---- 1) Einsammeln, was da ist -------------------------------------
        const map = {};
        let n = 0;
        let dateien = [];
        try { dateien = ns.ls("home") || []; } catch (e) { dateien = []; }
        for (const f of dateien) {
            const low = String(f).toLowerCase();
            // Nur die Wurzel von home: /schwarm-go/ und /schwarm-bb/ fuehren
            // Wegwerf-Skripte, deren Pfade ebenfalls mit "schwarm" beginnen.
            if (String(f).indexOf("/") >= 0) continue;
            if (!low.startsWith("schwarm") || !low.endsWith(".js")) continue;
            let inhalt = "";
            try { inhalt = ns.read(f) || ""; } catch (e) { continue; }
            if (inhalt) { map[f] = inhalt; n++; }
        }

        // ---- 2) Fehlendes aus der alten Sicherung zurueckholen --------------
        // ZUERST lesen, DANN schreiben: sonst ueberschreibt eine lueckenhafte
        // Aufnahme genau die Kopie, aus der man haette wiederherstellen wollen.
        let alt = null;
        try {
            const roh = ns.read(SICHERUNG_DATEI) || "";
            if (roh) alt = JSON.parse(roh);
        } catch (e) { alt = null; }
        let zurueck = 0;
        if (alt && typeof alt === "object") {
            for (const f of Object.keys(alt)) {
                if (map[f] !== undefined) continue;         // liegt schon da
                try { ns.write(f, alt[f], "w"); map[f] = alt[f]; n++; zurueck++; }
                catch (e) { /* naechste Datei */ }
            }
        }
        if (zurueck > 0) {
            ns.tprint(`WARN  [GENESIS] ${zurueck} fehlende(s) Skript(e) aus der Sicherung `
                + `zurueckgeschrieben. Da hat jemand aufgeraeumt.`);
        }

        if (n === 0) { ns.print("Sicherung: keine Schwarm-Skripte gefunden — uebersprungen."); return; }

        // ---- 3) Schreiben und spiegeln --------------------------------------
        const text = JSON.stringify(map);
        try { ns.write(SICHERUNG_DATEI, text, "w"); }
        catch (e) { ns.print("Sicherung auf home fehlgeschlagen: " + e); return; }

        let spiegel = false, warum = "";
        try {
            if (!ns.hasRootAccess(SICHERUNG_SPIEGEL)) { try { ns.nuke(SICHERUNG_SPIEGEL); } catch (e) { /* gleich sichtbar */ } }
            if (ns.hasRootAccess(SICHERUNG_SPIEGEL)) spiegel = ns.scp(SICHERUNG_DATEI, SICHERUNG_SPIEGEL, "home") === true;
            else warum = "kein Root auf " + SICHERUNG_SPIEGEL;
        } catch (e) { warum = String(e); }

        ns.print(`Sicherung: ${n} Skript(e), ${Math.round(text.length / 1024)} KB`
            + (spiegel ? ` | Spiegel auf ${SICHERUNG_SPIEGEL} erneuert.`
                       : ` | Spiegel FEHLT${warum ? " (" + warum + ")" : ""}.`));
    } catch (e) {
        // Der Start darf hieran nie haengen bleiben.
        ns.print("Sicherung: " + e);
    }
}

export async function main(ns) {
    ns.disableLog("ALL");
    if (!ensureSingleInstance(ns)) { ns.tprint("WARN  [GENESIS] läuft bereits — beende diese Instanz."); return; }

    setPhase(ns, PHASE.GENESIS);
    announce(ns, "start", "v" + VERSION + " — Bootstrap + Gym-Vorstufe + Frühphasen-Schalter");

    // Sauberer Neustart: jede alte Schwarm-Kette abräumen.
    cleanupSwarm(ns);
    await ns.sleep(300);
    markTopoDirty(ns, "genesis");

    // Rueckfahrkarte auffrischen: Sicherung auf home neu schreiben, Spiegel auf
    // n00dles neu anlegen (der ueberlebt den Reset nicht), fehlende Skripte
    // zurueckholen. Begruendung ausfuehrlich bei sicherungPflegen.
    sicherungPflegen(ns);

    // =========================================================================
    // v4.1 — DIAG ZUERST, WENN EIN AUFTRAG OFFEN IST
    // =========================================================================
    // Direkt NACH cleanupSwarm und vor allem anderen. Bisher kam DIAG erst
    // zurueck, wenn die Queen lief — und die startet als Letztes der Kette
    // (GENESIS -> Casino -> ARSENAL -> QUEEN). Der gesamte Anlauf blieb damit
    // unbeobachtet, obwohl dort am meisten schiefgehen kann.
    //
    // ZUR REIHENFOLGE, ehrlich: laeuft das Casino noch, beendet es DIAG wieder
    // (casino.js startet mit --kill-all-scripts). Der Bericht hat dann eine
    // Luecke ueber den Casino-Lauf, und die Queen holt DIAG danach zurueck.
    // Trotzdem ist das ein Gewinn — vorher fehlte der GANZE Anlauf, jetzt nur
    // noch das Casino selbst. Und ist das Casino fuer diesen Durchlauf bereits
    // erledigt (der haeufige Fall bei einem Neustart von Hand), laeuft DIAG
    // ohne jede Unterbrechung durch.
    //
    // OHNE ARGUMENTE. Welcher Auftrag gemeint ist, weiss DIAGs
    // Fortschrittsdatei; seit DIAG v3.5 heisst argumentlos ausdruecklich
    // "setze fort". GENESIS muss die Argumentstellen also nicht kennen.
    if (diagAuftragOffen(ns)) {
        try {
            // DOPPELSTART-SCHUTZ. DIAG hat keinen eigenen (anders als QUEEN und
            // GENESIS). cleanupSwarm sollte es zwar beendet haben, aber ein
            // zweiter Prozess wuerde dieselbe Fortschrittsdatei schreiben und
            // den Auftrag doppelt zaehlen — das ist zu teuer fuer ein "sollte".
            const laeuft = ns.ps("home").some(p => p.filename === DIAG_SCRIPT);
            // RAM-SPERRE. In einer frischen BitNode hat home 8 GB. DIAG dort zu
            // starten heisst, GENESIS die Ghost-Worker wegzunehmen — und die
            // sind es, die ueberhaupt erst das Casino-Startkapital erarbeiten.
            // Der Anlauf hat Vorrang vor seiner eigenen Beobachtung.
            let frei = 0, need = 0;
            try {
                frei = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - HOME_RESERVE;
                need = ns.getScriptRam(DIAG_SCRIPT, "home");
            } catch (e) { /* Werte bleiben 0 -> kein Start */ }
            const platz = need > 0 && frei >= need + 4 * GHOST_RAM;

            if (laeuft) ns.print("DIAG laeuft bereits — kein zweiter Start.");
            else if (!platz) {
                ns.print(`DIAG-Auftrag offen, aber home zu eng (${frei.toFixed(1)} GB frei, `
                    + `${need.toFixed(1)} GB noetig) — die Queen holt ihn spaeter nach.`);
            } else {
                const dpid = ns.exec(DIAG_SCRIPT, "home", 1);
                if (dpid) ns.print("DIAG-Auftrag war offen — als Erstes wieder gestartet (zeichnet den Anlauf mit).");
                else ns.print("DIAG-Start scheiterte — die Queen holt ihn spaeter nach.");
            }
        } catch (e) { ns.print("DIAG-Start fehlgeschlagen: " + e); }
    }

    // =========================================================================
    // v4.0: DIE GHOST-WORKER SELBST ERZEUGEN
    // =========================================================================
    // Hier wurde bisher nur GEPRUEFT, ob schwarm-w/g/h.js auf home liegen. Das
    // ging gut, solange die drei Dateien zusaetzlich zu ihrer eingebetteten
    // Fassung lose im Ordner lagen — also genau die Doppelung, die dieser Umbau
    // beseitigt hat. Ohne sie startete GENESIS nicht mehr:
    //     "ERROR [GENESIS] Payload 'schwarm-w.js' fehlt auf home."
    //
    // Der Denkfehler war die Reihenfolge: die Worker werden sonst vom DISPATCHER
    // materialisiert — aber der laeuft erst, wenn die Queen ihn startet, und die
    // startet erst nach Casino und ARSENAL. GENESIS ist das ERSTE Glied der
    // Kette und muss sich deshalb selbst versorgen.
    //
    // materialize() statt eigener Kopien: die Worker-Quelle bleibt an EINER
    // Stelle (SCHWARM-PAYLOADS.js). RAM-Aufschlag ist ns.getHostname (0,05 GB) —
    // ns.write kostet nichts und ns.scp bezahlt GENESIS ohnehin schon fuer die
    // Verteilung der Worker auf die Netz-Hosts.
    for (const key of ["WORKER_W", "WORKER_G", "WORKER_H"]) {
        if (!materialize(ns, key)) {
            ns.tprint(`ERROR [GENESIS] Worker-Payload '${key}' liess sich nicht schreiben.`);
            return;
        }
    }
    for (const p of [GHOST_W, GHOST_G, GHOST_H]) {
        if (!ns.fileExists(p, "home")) {
            ns.tprint(`ERROR [GENESIS] Payload '${p}' fehlt auf home trotz materialize(). Kein Früh-Hacker möglich.`);
            return;
        }
    }

    // ----------------------- PHASE: EARLY -----------------------
    setPhase(ns, PHASE.EARLY);
    ns.print(`Früh-Phase: sammle ${formatMoney(CASH_TARGET)} fürs Casino.`);

    const sing = (cmd) => evalNs(ns, cmd);
    // v5 BUGFIX: Singularity DIREKT probieren statt Port 4 zu lesen.
    //
    // ENGINE (NetscriptWorker.ts:40-46): prestigeWorkerScripts() ruft bei JEDEM
    // Prestige NetscriptPorts.clear() — alle Ports sind nach Soft- wie Hard-Reset
    // leer. GENESIS ist aber das ERSTE Glied der Kette (GENESIS -> casino ->
    // ARSENAL -> QUEEN), und Capabilities auf Port 4 publizieren erst ARSENAL,
    // QUEEN, DISPATCHER und INFO. hasCapability(CAPS.SING) las also einen leeren
    // Port und lieferte immer false -> playerStep und setupUnlockedSystems wurden
    // NIE aufgerufen. Symptom: GENESIS trainiert nicht, begeht keine Verbrechen,
    // macht ausschliesslich Hacking. Genau so live beobachtet.
    //
    // Der Selbsttest laeuft ueber evalNs (Wegwerf-Skript), kostet GENESIS also
    // keinen statischen RAM. Kein SF4 -> die Singularity-Funktion wirft, wir
    // liefern false, und die Frueh-Phase macht korrekt nur Hacking.
    const canSing = await (async () => {
        try {
            const r = await sing("(()=>{try{ns.singularity.getCurrentWork();return true;}catch(e){return false;}})()");
            return r === true;
        } catch (e) { return false; }
    })();
    ns.print(`Singularity: ${canSing ? "verfügbar" : "nicht verfügbar (kein SF4) — nur Hacking"}`);
    let spawnSeq = Date.now() % 1_000_000;
    let crackers = refreshCrackers(ns);
    let lastCrime = 0;
    let crimeInfo = canSing ? "startet…" : "kein SF4";
    let lastSwitch = 0;
    let switchInfo = "";

    // v5: einmalig, bevor die Schleife laeuft — was jetzt startet, arbeitet die
    // ganze Fruehphase mit. Braucht Singularity nicht zwingend (STANEK und
    // DARKNET kommen ohne aus), die Tests fuer Gang und Bladeburner aber schon.
    const earlyStarted = await startEarlyDaemons(ns, sing);

    while (ns.getServerMoneyAvailable("home") < CASH_TARGET) {
        try {
            // ---------- 1. Rooten (billig: Opener einmal geprüft) ----------
            crackers = refreshCrackers(ns);
            if (nukeIncremental(ns, crackers) > 0) markTopoDirty(ns, "genesis-root");

            // ---------- 2. SPIELER-SLOT (parallel, kostet KEINEN RAM) ----------
            // v4: erst Gym auf GYM_TARGET, dann Crime. Bringt Geld+Karma+Stats.
            if (canSing && Date.now() - lastCrime > 8000) {
                lastCrime = Date.now();
                crimeInfo = await playerStep(ns, sing);
            }

            // ---------- 2b. SCHALTER: bereits freigeschaltete Systeme ----------
            // Nur bei Aug-Reset in laufendem BitNode vorhanden; bei frischem
            // BitNode still übersprungen. Setzt Gang→money / Blade→Training /
            // Sleeves→Shock/Sync/Idle, bis die Queen-Daemons übernehmen.
            if (canSing && Date.now() - lastSwitch > SWITCH_MS) {
                lastSwitch = Date.now();
                switchInfo = await setupUnlockedSystems(ns, sing, earlyStarted);
            }

            // ---------- 3. Bestes Ziel ----------
            const hosts = scanNetwork(ns);
            const level = ns.getHackingLevel();
            let best = null, bestScore = 0;
            for (const h of hosts) {
                if (h === "home" || !ns.hasRootAccess(h)) continue;
                const maxM = ns.getServerMaxMoney(h);
                if (maxM <= 0 || ns.getServerRequiredHackingLevel(h) > level) continue;
                const minS = Math.max(1, ns.getServerMinSecurityLevel(h));
                const score = maxM / minS;
                if (score > bestScore) { bestScore = score; best = { host: h, maxM, minS }; }
            }
            if (!best) { await ns.sleep(LOOP_MS); continue; }

            // ---------- 4. RAM-Karte + Provisionierung ----------
            const ramMap = buildRamMapArray(ns, hosts, HOME_RESERVE);
            for (const node of ramMap) {
                if (node.host === "home") continue;
                for (const p of [GHOST_W, GHOST_G, GHOST_H]) {
                    if (!ns.fileExists(p, node.host)) ns.scp(p, node.host, "home");
                }
            }

            // ---------- 5. BESTANDSZÄHLUNG (der Fix gegen die Prozessflut) ----------
            // Was läuft bereits gegen dieses Ziel? Nur die DIFFERENZ wird nachgelegt.
            // v4.0: Felder hiessen weaken/grow/hack. Property-Zugriffe darauf zaehlen fuer
            // die RAM-Analyse wie ns.weaken/ns.grow/ns.hack (0,15+0,15+0,10 = 0,40 GB),
            // obwohl GENESIS keine davon direkt aufruft — es startet nur Ghost-Worker.
            const running = { w: 0, g: 0, h: 0 };
            for (const node of ramMap) {
                try {
                    for (const p of ns.ps(node.host)) {
                        if (String(p.args[0]) !== best.host) continue;
                        if (p.filename === GHOST_W) running.w += p.threads;
                        else if (p.filename === GHOST_G) running.g += p.threads;
                        else if (p.filename === GHOST_H) running.h += p.threads;
                    }
                } catch (e) { /* Host überspringen */ }
            }

            let freeThreads = ramMap.reduce((s, n) => s + Math.floor(n.free / GHOST_RAM), 0);
            if (freeThreads <= 0) { await ns.sleep(LOOP_MS); continue; }

            const deploy = (script, want) => {
                let left = Math.floor(want);
                for (const node of ramMap) {
                    if (left <= 0) break;
                    const can = Math.floor(node.free / GHOST_RAM);
                    if (can <= 0) continue;
                    const starten = Math.min(left, can);
                    if (ns.exec(script, node.host, starten, best.host, 0, ++spawnSeq)) {
                        node.free -= starten * GHOST_RAM;
                        left -= starten;
                        freeThreads -= starten;
                    }
                }
            };

            // ---------- 6. STRIKTES PREP-THEN-HACK ----------
            const sec = ns.getServerSecurityLevel(best.host);
            const money = Math.max(1, ns.getServerMoneyAvailable(best.host));

            if (sec > best.minS + SEC_TOL) {
                const total = Math.ceil((sec - best.minS) / WEAKEN_PER_THREAD);
                const need = total - running.w;
                if (need > 0) deploy(GHOST_W, Math.min(need, freeThreads));

            } else if (money < best.maxM * MONEY_OK) {
                let total = 0;
                try { total = Math.ceil(ns.growthAnalyze(best.host, best.maxM / money)); } catch (e) { total = freeThreads; }
                if (!Number.isFinite(total) || total <= 0) total = freeThreads;
                const need = total - running.g;
                if (need > 0) deploy(GHOST_G, Math.min(need, freeThreads));
                // Ein Teil weaken, damit grow die Security nicht davonlaufen lässt
                // (jeder grow-Thread hebt sec um 0.004 -> ~12 grow je weaken).
                const wNeed = Math.ceil(Math.min(need, freeThreads) / 12) - running.w;
                if (wNeed > 0) deploy(GHOST_W, Math.min(wNeed, freeThreads));

            } else {
                // Ziel ist geprept: hacken. Nur so viele Threads, wie ~50 % abschöpfen.
                let ha = 0; try { ha = ns.hackAnalyze(best.host); } catch (e) { ha = 0; }
                const total = ha > 0 ? Math.ceil(0.5 / ha) : freeThreads;
                const need = total - running.h;
                if (need > 0) deploy(GHOST_H, Math.min(need, freeThreads));
                // Rest in weaken (hält das Ziel ruhig, gibt XP)
                if (freeThreads > 0) deploy(GHOST_W, freeThreads);
            }

            ns.print(`Ziel ${best.host} | sec ${sec.toFixed(1)}/${best.minS} | $ ${formatMoney(money)}/${formatMoney(best.maxM)} | ` +
                     `läuft w${running.w} g${running.g} h${running.h} | Spieler: ${crimeInfo} | ` +
                     (switchInfo ? `[${switchInfo}] | ` : "") +
                     `home ${formatMoney(ns.getServerMoneyAvailable("home"))}/${formatMoney(CASH_TARGET)}`);

        } catch (e) {
            ns.print("EARLY-Fehler: " + e);
        }
        await ns.sleep(LOOP_MS);
    }

    // ----------------------- PHASE: CASINO -----------------------
    // v4.1: Nur EINMAL je Durchlauf. Das Casino ist ein Einmal-Ereignis —
    // casino.js spielt per Save-Scumming bis zum Hausverbot; ein zweiter Lauf
    // im selben Durchlauf gewinnt nichts und kostet den vollen Anlauf plus ein
    // --kill-all-scripts auf den laufenden Schwarm. Begruendung zum Merker bei
    // casinoSchonGelaufen.
    if (casinoSchonGelaufen(ns)) {
        ns.print("Casino lief in diesem Durchlauf bereits — uebersprungen, direkt an ARSENAL.");
        const apid = ns.exec(ARSENAL_SCRIPT, "home", 1);
        if (apid) ns.print("ARSENAL gestartet. GENESIS uebergibt und endet.");
        else ns.tprint("ERROR [GENESIS] ARSENAL-Start fehlgeschlagen (RAM?).");
        return;
    }

    setPhase(ns, PHASE.CASINO);
    ns.print(`Ziel erreicht: ${formatMoney(ns.getServerMoneyAvailable("home"))}. Übergabe ans Casino.`);

    // v4.0: casino.js ist ein PAYLOAD dieser Datei (SRC_CASINO ganz unten) und
    // wird hier erzeugt. Frueher mussten die Fremddateien casino.js UND
    // helpers.js auf home liegen — zwei Dateien aus einem anderen Framework,
    // nur fuer diesen einen Schritt. Beide sind damit entfallen.
    if (!materializeCasino(ns)) {
        ns.tprint("ERROR [GENESIS] Casino-Payload liess sich nicht schreiben.");
        return;
    }
    const pid = ns.exec(CASINO_SCRIPT, "home", 1, "--kill-all-scripts", "--on-completion-script", ARSENAL_SCRIPT);
    if (pid) {
        // v4.1: VOR dem Casino vermerken, nicht danach. casino.js beendet mit
        // --kill-all-scripts auch GENESIS selbst — eine Zeile nach diesem exec
        // wuerde nie mehr ausgefuehrt. Der Merker haelt den Reset-Zeitstempel,
        // ist also nach dem naechsten echten Reset von selbst wieder ungueltig.
        casinoVermerken(ns);
        ns.print("Casino gestartet (fuer diesen Durchlauf vermerkt). GENESIS übergibt und endet.");
    } else ns.tprint("ERROR [GENESIS] Casino-Start fehlgeschlagen (RAM?).");
}

// =============================================================================

/**
 * Spieler-Aktions-Slot der Frühphase. v4: erst Kampfstats per Gym auf
 * GYM_TARGET (schneller Casino-Anlauf, s. Konstanten-Kommentar), dann die
 * Crime-Leiter. Beides via Singularity — ohne SF4 wird nur der Hacking-Teil
 * gefahren (canSing-Gate am Aufrufer).
 * @returns {Promise<string>} Kurzinfo für die Anzeige.
 */
const J = (v) => JSON.stringify(v);

async function playerStep(ns, sing) {
    try {
        // 1) Kampfstats prüfen. Unter GYM_TARGET -> Gym (niedrigsten Stat zuerst).
        const sk = await sing("(()=>{const s=ns.getPlayer().skills;return {str:s.strength,def:s.defense,dex:s.dexterity,agi:s.agility};})()");
        if (sk && typeof sk === "object") {
            const stats = [["str", sk.str], ["def", sk.def], ["dex", sk.dex], ["agi", sk.agi]];
            const low = stats.filter(([, v]) => v < GYM_TARGET).sort((a, b) => a[1] - b[1])[0];
            if (low) {
                // In Sector-12 reisen falls nötig (billig, 200k), dann trainieren.
                await sing(`(()=>{try{if(ns.getPlayer().city!==${J(GYM_CITY)})ns.singularity.travelToCity(${J(GYM_CITY)});}catch(e){}})()`);
                const ok = await sing(`ns.singularity.gymWorkout(${J(GYM_NAME)}, ${J(low[0])}, false)`);
                return ok === true ? `Gym ${low[0]} ${low[1]}/${GYM_TARGET}` : `Gym-Start ${low[0]} fehlgeschlagen`;
            }
        }
        // 2) Alle Stats >= Ziel -> Crime-Leiter (wie v3).
        return await crimeStep(ns, sing);
    } catch (e) {
        return "Player-Fehler";
    }
}

/**
 * Ein Crime-Schritt. Vorgabe: KEIN Gym-Umweg in der Frühphase — es wird das beste
 * Verbrechen begangen, dessen Erfolgschance CRIME_MIN_CHANCE erreicht. Die Stats
 * steigen dabei von selbst (auch Fehlschläge geben XP), also klettert man die
 * Leiter Shoplift -> Mug -> Homicide automatisch hoch.
 * @returns {Promise<string>} Kurzinfo für die Anzeige.
 */
async function crimeStep(ns, sing) {
    try {
        const stats = await sing(
            `(${JSON.stringify(CRIME_LADDER)}).map(c => ({ c, ch: ns.singularity.getCrimeChance(c), ` +
            `m: ns.singularity.getCrimeStats(c).money, t: ns.singularity.getCrimeStats(c).time }))`
        );
        if (!Array.isArray(stats) || stats.length === 0) return "—";

        // Bestes taugliches Verbrechen: höchster $/s bei ausreichender Chance.
        const ok = stats.filter(s => s.ch >= CRIME_MIN_CHANCE);
        const pool = ok.length > 0 ? ok : [stats[stats.length - 1]];   // sonst: das billigste
        const best = pool
            .map(s => ({ ...s, rate: (s.m * s.ch) / Math.max(0.001, s.t / 1000) }))
            .sort((a, b) => b.rate - a.rate)[0];
        if (!best) return "—";

        const cur = await sing("ns.singularity.getCurrentWork()");
        const already = cur && cur.type === "CRIME" && cur.crimeType &&
            String(cur.crimeType).toLowerCase() === String(best.c).toLowerCase();
        if (!already) await sing(`ns.singularity.commitCrime(${JSON.stringify(best.c)}, false)`);
        return `${best.c} (${(best.ch * 100).toFixed(0)}%)`;
    } catch (e) {
        return "Fehler";
    }
}

/**
 * Setzt Schalter für bereits freigeschaltete Systeme (Aug-Reset in laufendem
 * BitNode). Bei frischem BitNode ist nichts davon vorhanden -> jeder Zweig wird
 * still übersprungen. GENESIS SETZT nur einmal; die Queen-Daemons überschreiben
 * das später. Alles in try/catch: fehlt RAM oder Freischaltung, passiert nichts.
 *
 *   Gang        -> je Member den lukrativsten reinen Money-Task (kein Optimizer,
 *                  das macht GANG später richtig). Combat- vs Hacking-Gang wird
 *                  über isCombat/isHacking der Tasks getroffen.
 *   Bladeburner -> General Action "Training" (schnell Kampfstats hoch).
 *   Sleeves     -> Sync<100: Synchronize. Sonst Shock>0: ShockRecovery.
 *                  (Erst Synchronisation, dann Shock — identisch zu WORK.
 *                  Der Kommentar nannte bis 05.09.2026 die umgekehrte
 *                  Reihenfolge; der Code prueft sync ZUERST.)
 *                  sonst: Idle. (Shock/Sync-Aufbau schlägt Geld in der Frühphase.)
 *
 * @returns {Promise<string>} Kurzinfo für die Anzeige.
 */
/**
 * Startet die Daemons, die JETZT schon etwas erarbeiten koennen — einmalig, in
 * der Fruehphase, auf home. Siehe die Begruendung bei EARLY_DAEMONS.
 *
 * Gibt die Menge der gestarteten Schluessel zurueck; setupUnlockedSystems
 * ueberspringt danach die zugehoerigen Einmal-Anstoesse, damit sich Daemon und
 * Anstoss nicht gegenseitig umschalten.
 *
 * @param {NS} ns
 * @param {(cmd:string)=>Promise<any>} sing  evalNs-Wrapper (kostet GENESIS kein RAM)
 * @returns {Promise<Set<string>>}
 */
async function startEarlyDaemons(ns, sing) {
    const gestartet = new Set();
    const frei = Math.max(0, ns.getServerMaxRam("home") - ns.getServerUsedRam("home"));
    let budget = frei * EARLY_RAM_FRAC;
    const zeilen = [];

    // ---- Stufe 1: Einstellbefehle (kosten kein RAM, kein Prozess) --------
    for (const c of EARLY_COMMANDS) {
        let ok = false;
        try { ok = (await sing(c.probe)) === true; } catch (e) { ok = false; }
        if (!ok) { zeilen.push(`${c.key}: ${c.note || "nicht verfuegbar"}`); continue; }
        let r = null;
        try { r = await sing(c.cmd); } catch (e) { r = null; }
        const txt = c.melde ? c.melde(r) : null;
        zeilen.push(txt ? `${c.key}: ${txt}` : `${c.key}: Befehl ohne Rueckmeldung`);
        if (txt) gestartet.add(c.key);
    }

    // ---- Stufe 2: Daemons, die bis zum Casino durchlaufen ----------------
    for (const d of EARLY_DAEMONS) {
        const reg = DAEMONS[d.key];
        if (!reg) { zeilen.push(`${d.key}: kein Registry-Eintrag`); continue; }

        let ok = false;
        try { ok = (await sing(d.probe)) === true; } catch (e) { ok = false; }
        if (!ok) { zeilen.push(`${d.key}: ${d.note || "nicht verfuegbar"}`); continue; }

        const braucht = (reg.minRam || 0) + (reg.burst || 0);
        if (braucht > budget) {
            zeilen.push(`${d.key}: braucht ${braucht} GB, Budget noch ${Math.floor(budget)} GB`);
            continue;
        }

        // Payload erzeugen, falls es einer ist. Die Bibliotheken (HELPERS,
        // PAYLOADS) liegen auf home, weil GENESIS selbst von dort laeuft.
        if (reg.payload && !materialize(ns, reg.payload)) {
            zeilen.push(`${d.key}: Payload liess sich nicht schreiben`);
            continue;
        }
        if (!ns.fileExists(reg.file, "home")) {
            zeilen.push(`${d.key}: ${reg.file} fehlt auf home`);
            continue;
        }

        // Bewusst home statt reg.host: gekaufte Server sind nach einem
        // Aug-Reset weg (prestigeAugmentation loescht sie), in der Fruehphase
        // gibt es also gar keinen pserv.
        let pid = 0;
        try { pid = ns.exec(reg.file, "home", 1, ...(reg.args || [])); } catch (e) { pid = 0; }
        if (!pid) { zeilen.push(`${d.key}: Start fehlgeschlagen`); continue; }

        budget -= braucht;
        gestartet.add(d.key);
        zeilen.push(`${d.key}: laeuft (pid ${pid})`);
    }

    if (zeilen.length) {
        ns.print("Fruehstart: " + zeilen.join(" | "));
    }
    if (gestartet.size) {
        ns.tprint(`INFO  [GENESIS] Fruehstart: ${[...gestartet].join(", ")} arbeiten schon vor dem Casino. `
            + `Der Casino-Lauf beendet sie wieder — Rang, Respekt, Ladung und Geld bleiben aber erhalten.`);
    }
    return gestartet;
}

async function setupUnlockedSystems(ns, sing, gestartet) {
    const done = [];
    const laeuft = (name) => gestartet && gestartet.has(name);

    // ---- GANG -------------------------------------------------------------
    // v5: nicht anfassen, wenn der GANGS-Daemon laeuft — der verteilt die
    // Aufgaben selbst und nach Ertrag. Zwei Instanzen, die dieselben Mitglieder
    // umsetzen, heben sich gegenseitig auf.
    if (laeuft("GANG-GELD")) done.push("Gang (Fruehstart)");
    else try {
        const r = await sing(`(()=>{try{
            if(!ns.gang.inGang())return null;
            const info=ns.gang.getGangInformation();
            const isHack=info.isHacking;
            const members=ns.gang.getMemberNames();
            const tasks=ns.gang.getTaskNames().map(n=>{try{const t=ns.gang.getTaskStats(n);return {n,money:t.baseMoney||0,comb:t.isCombat,hack:t.isHacking};}catch(e){return null;}}).filter(Boolean);
            // bester reiner Money-Task passend zum Gang-Typ
            const pool=tasks.filter(t=>t.money>0 && (isHack?t["hack"]:t.comb));
            pool.sort((a,b)=>b.money-a.money);
            if(pool.length===0)return {set:0,of:members.length};
            const task=pool[0].n;
            let set=0;
            for(const m of members){try{if(ns.gang.setMemberTask(m,task))set++;}catch(e){}}
            return {set,of:members.length,task};
        }catch(e){return null;}})()`);
        if (r && typeof r === "object") done.push(`Gang ${r.set}/${r.of}→${r.task || "?"}`);
    } catch (e) { /* still */ }

    // ---- BLADEBURNER ------------------------------------------------------
    // v5 BUGFIX — DIESER ANSTOSS HAT SICH MIT DER VERBRECHENSLEITER GEPRUEGELT.
    //
    // Ohne die Augmentierung "The Blade's Simulacrum" teilen sich Bladeburner
    // und Spieler EINEN Aktions-Slot, und beide Seiten raeumen ihn brutal frei:
    //
    //   Bladeburner.ts:178-180   startAction() ruft Player.finishWork(true),
    //                            wenn die Aug fehlt -> das laufende Verbrechen
    //                            ist weg.
    //   Bladeburner.ts:1356      der Bladeburner-Takt bricht die eigene Aktion
    //                            ab, sobald Player.currentWork gesetzt ist.
    //
    // GENESIS setzt hier alle 15 s Training, playerStep startet alle 8 s ein
    // Verbrechen — die beiden haben sich also gegenseitig ausgeknipst, und
    // ausgerechnet die Verbrechensleiter ist in dieser Phase die Haupt-
    // Geldquelle fuer die 500.000 des Casinos. Training bringt dagegen 0 Rang
    // und 0 Geld, nur Kampf-XP.
    //
    // Deshalb: nur anfassen, wenn der Slot dank Simulacrum doppelt vorhanden
    // ist. Sonst gehoert er der Verbrechensleiter.
    // Frueher stand hier ein Zweig `if (laeuft("BLADEBURNER")) ...` davor.
    // Der konnte nie greifen: BLADEBURNER steht bewusst NICHT in den
    // Fruehstart-Tabellen (Begruendung oben, "der einzige Kandidat, der in
    // dieser Phase SCHADET"), laeuft("BLADEBURNER") war also konstant false.
    // Entfernt am 05.09.2026 — das `else` von damals ist jetzt der Normalfall.
    try {
        const r = await sing(`(()=>{try{
            if(!ns.bladeburner.inBladeburner())return null;
            if(!ns.singularity.getOwnedAugmentations(false).includes("The Blade's Simulacrum"))
                return {ok:false,slot:true};
            const cur=ns.bladeburner.getCurrentAction();
            if(cur && cur.type==="General" && cur.name==="Training")return {ok:true,already:true};
            const ok=ns.bladeburner.startAction("General","Training");
            return {ok};
        }catch(e){return null;}})()`);
        if (r && r.ok) done.push(r.already ? "Blade(Training läuft)" : "Blade→Training");
        else if (r && r.slot) done.push("Blade(Slot gehört den Verbrechen)");
    } catch (e) { /* still */ }

    // ---- SLEEVES ----------------------------------------------------------
    // REIHENFOLGE: erst Synchronisation, dann Shock — identisch zu WORK v3.10.
    // Muss gleich sein, sonst schalten sich GENESIS und WORK gegenseitig um.
    // Grund (Engine): SleeveSynchroWork kennt kein shockBonus(), Sync läuft also
    // bei vollem Shock genauso schnell; Shock sinkt zusätzlich passiv, Sync nicht.
    try {
        const r = await sing(`(()=>{try{
            const n=ns.sleeve.getNumSleeves();
            if(!n)return null;
            let shock=0,sync=0,idle=0;
            for(let i=0;i<n;i++){
                const s=ns.sleeve.getSleeve(i);
                if(s.sync<100){ns.sleeve.setToSynchronize(i);sync++;}
                else if(s.shock>0){ns.sleeve.setToShockRecovery(i);shock++;}
                else {ns.sleeve.setToIdle(i);idle++;}
            }
            return {n,shock,sync,idle};
        }catch(e){return null;}})()`);
        if (r && typeof r === "object") done.push(`Sleeve ${r.n}(sh${r.shock}/sy${r.sync}/id${r.idle})`);
    } catch (e) { /* still */ }

    return done.length ? done.join(" | ") : "";
}

/** Räumt jede laufende Schwarm-Kette ab (Master-Reset). */
function cleanupSwarm(ns) {
    const self = ns.getScriptName();
    let killed = 0;
    try {
        for (const p of ns.ps("home")) {
            if (p.filename !== self) { ns.kill(p.pid); killed++; }
        }
    } catch (e) { /* weiter */ }
    try {
        for (const host of scanNetwork(ns)) {
            try { ns.killall(host); } catch (e) { /* Host überspringen */ }
        }
    } catch (e) { /* weiter */ }
    try { if (ns.fileExists(ARSENAL_LOCK)) ns.rm(ARSENAL_LOCK); } catch (e) { /* egal */ }
    ns.print(`Aufgeräumt: ${killed} home-Prozess(e), Netzwerk-Hosts geleert, Lock entfernt.`);
}

// =============================================================================
// CASINO-PAYLOAD
// =============================================================================
//
// WARUM HIER UND NICHT IN SCHWARM-PAYLOADS.js:
// GENESIS ist der einzige Prozess, der das Casino je startet, und GENESIS
// laeuft nach der Uebergabe an ARSENAL nicht mehr mit. Ein eingebetteter
// String kostet 0 GB — die RAM-Analyse des Spiels sieht String-INHALTE nicht
// an (RamCalculations.ts walkt Identifier und Member-Zugriffe, keine
// Literale). Der Payload haengt also an keinem laufenden Daemon. Genau dieses
// Muster benutzt SCHWARM-DARKNET.js fuer Roamer, Lab und Cracker.
//
// GEBRAUCHT WIRD ER GENAU EINMAL JE BITNODE: EARLY -> Casino (Save-Scum auf
// ~10b) -> ARSENAL -> QUEEN. Nach einem Aug-Install laeuft GENESIS neu an und
// braucht ihn wieder — deshalb bleibt er eingebettet.
//
// Die Quelle ist casino.js von alainbryden, unveraendert bis auf den
// entfernten helpers.js-Import und zwei Aufrufe, die auf dessen Interna
// bauten; die Ersatzfunktionen stehen im Kopf des Payloads. Kodierung wie
// ueberall im Schwarm (siehe decodePayload in SCHWARM-HELPERS.js).

/** Casino-Payload auf home schreiben (nur bei Abweichung).
 *  @returns {boolean} true, wenn die Datei danach aktuell auf home liegt. */
function materializeCasino(ns) {
    try {
        const code = decodePayload(SRC_CASINO);
        if (ns.read(CASINO_SCRIPT) !== code) ns.write(CASINO_SCRIPT, code, "w");
        return true;
    } catch (e) {
        ns.print("Casino-Payload materialisieren: " + e);
        return false;
    }
}

const SRC_CASINO = `/**
 * ===========================================================================
 * SCHWARM-KOMPATIBILITAETSSCHICHT  (ersetzt helpers.js)
 * ===========================================================================
 * Dieser Payload ist die UNVERAENDERTE casino.js von alainbryden, nur ohne
 * ihren Import aus helpers.js. Die neun Funktionen, die sie von dort benutzt,
 * stehen hier drunter - bewusst knapp und ohne die Extras des Originals
 * (Konfigurationsdateien, Retry-Logik, Fenster-Positionierung). Gebraucht wird
 * das Casino GENAU EINMAL je BitNode, zwischen EARLY und ARSENAL.
 *
 * WARUM DER PAYLOAD IN GENESIS LIEGT UND NICHT IN SCHWARM-PAYLOADS.js:
 * GENESIS ist der einzige Prozess, der ihn je startet, und GENESIS laeuft nach
 * der Uebergabe nicht mehr mit. Ein eingebetteter String kostet 0 GB (die
 * RAM-Analyse sieht String-INHALTE nicht an), der Payload haengt also an
 * keinem laufenden Daemon. Dasselbe Muster benutzt SCHWARM-DARKNET.js fuer
 * Roamer, Lab und Cracker.
 *
 * ZWEI STELLEN IM ORIGINAL MUSSTEN ANGEFASST WERDEN:
 *   scanAllServers(ns)  - helpers.js injizierte diese Funktion in das
 *                         Wegwerf-Skript. Das kann diese Schicht nicht, also
 *                         steht der BFS jetzt direkt als Ausdruck im Aufruf.
 *   cleanup.js          - Fremdskript, im SCHWARM-Ordner nicht vorhanden.
 *                         Ersetzt durch schwarmCleanTemp().
 * ===========================================================================
 */

/** djb2 - kurzer, stabiler Hash. Nur fuer Dateinamen: gleicher Befehl ergibt
 *  denselben Namen, damit die Engine das Wegwerf-Skript wiederverwendet statt
 *  es fuer jeden Aufruf neu einzulesen. */
function schwarmHash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
}

function log(ns, message = "", alsoPrintToTerminal = false, toastStyle = "", maxToastLength = 100) {
    try { ns.print(message); } catch (e) { /* egal */ }
    if (toastStyle) {
        try {
            ns.toast(message.length <= maxToastLength
                ? message : message.substring(0, maxToastLength - 3) + "...", toastStyle);
        } catch (e) { /* egal */ }
    }
    if (alsoPrintToTerminal) { try { ns.tprint(message); } catch (e) { /* egal */ } }
    return message;
}

/** Argumente lesen. Gibt null zurueck bei --help oder ungueltigen Argumenten -
 *  casino.js prueft genau darauf und beendet sich dann. */
function getConfiguration(ns, argsSchema) {
    try {
        const o = ns.flags(argsSchema);
        if (o.help) {
            ns.tprint("casino.js - Optionen: " + argsSchema.map(a => "--" + a[0]).join(" "));
            return null;
        }
        return o;
    } catch (err) {
        ns.tprint("ERROR casino.js: ungueltige Argumente (" + String(err) + ")");
        return null;
    }
}

/** Im SCHWARM liegt alles flach auf home - kein Unterordner. */
function getFilePath(file) { return file; }

function tail(ns) { try { ns.ui.openTail(); } catch (e) { /* headless */ } }

function getErrorInfo(err) {
    if (err === undefined || err === null) return "(kein Fehler)";
    if (typeof err === "string") return err;
    let s = null;
    if (err instanceof Error) {
        if (err.stack) {
            s = "  " + String(err.stack).split("\\n")
                .filter(l => !l.includes("bitburner-official")).join("\\n    ");
        }
        if (err.cause) s = (s ? s + "\\n" : "") + getErrorInfo(err.cause);
    }
    let d = null;
    try { d = (err.toString === undefined) ? null : err.toString(); } catch (e) { d = null; }
    if (d && d !== "[object Object]") {
        if (!s) s = d; else if (!s.includes(d)) s = d + "\\n" + s;
    }
    if (!s) { try { s = JSON.stringify(err); } catch (e) { s = String(err); } }
    return s;
}

/** Auf das Ende eines Prozesses warten. pid 0 ("nicht gestartet") gilt sofort
 *  als fertig - sonst haengt der Aufrufer an einem Prozess, den es nie gab. */
async function waitForProcessToComplete(ns, pid, timeoutMs = 60000) {
    if (!pid) return false;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        let alive = false;
        try { alive = ns.isRunning(pid); } catch (e) { alive = false; }
        if (!alive) return true;
        await ns.sleep(20);
    }
    return false;
}

/** Befehl in einem Wegwerf-Skript ausfuehren. Liefert die PID (0 = Fehlschlag). */
async function runCommand(ns, command, fileName, args = []) {
    const f = fileName || ("/Temp/casino-cmd-" + schwarmHash(command) + ".js");
    const body = "export async function main(ns){ " + command + " }";
    try { if (ns.read(f) !== body) ns.write(f, body, "w"); } catch (e) { return 0; }
    try { return ns.run(f, 1, ...args); } catch (e) { return 0; }
}

/** Wert eines ns-Ausdrucks ueber ein Wegwerf-Skript holen (RAM-Dodge).
 *  Der Skriptname haengt am BEFEHL (Wiederverwendung), die Ausgabedatei am
 *  Aufruf (parallele Aufrufe kommen sich nicht ins Gehege). */
async function getNsDataThroughFile(ns, command, fName = null, args = []) {
    const key = schwarmHash(command);
    const script = fName || ("/Temp/casino-data-" + key + ".js");
    const out = "/Temp/casino-out-" + key + "-" + (Date.now() % 100000).toString(36) + ".txt";
    const body = "export async function main(ns){ const __o = ns.args[0]; ns.args.shift(); "
        + "let r; try { r = JSON.stringify(" + command + "); } catch (e) { r = '__ERR__'; } "
        + "ns.write(__o, r === undefined ? 'null' : r, 'w'); }";
    try {
        if (ns.read(script) !== body) ns.write(script, body, "w");
        ns.write(out, "__PENDING__", "w");
    } catch (e) { return null; }
    let pid = 0;
    try { pid = ns.run(script, 1, out, ...args); } catch (e) { pid = 0; }
    if (!pid) { try { ns.rm(out); } catch (e) { /* egal */ } return null; }
    await waitForProcessToComplete(ns, pid, 20000);
    let raw = "";
    try { raw = ns.read(out); ns.rm(out); } catch (e) { /* egal */ }
    if (!raw || raw === "__PENDING__" || raw === "__ERR__") return null;
    try { return JSON.parse(raw); } catch (e) { return raw; }
}

/** Ersetzt cleanup.js: raeumt den Temp-Ordner auf home. Das Casino tut das vor
 *  dem Save-Scum, damit Speichern und Neuladen schnell bleiben - genau darauf
 *  beruht sein Tempo. */
async function schwarmCleanTemp(ns) {
    try {
        for (const f of ns.ls("home", "/Temp/")) {
            if (f === ns.getScriptName()) continue;
            try { ns.rm(f, "home"); } catch (e) { /* egal */ }
        }
    } catch (e) { /* egal */ }
}

/** Geldbetrag kurz formatieren (k/m/b/t/q). */
function formatMoney(n) {
    const v = Number(n) || 0;
    const neg = v < 0 ? "-" : "";
    let a = Math.abs(v), i = 0;
    const suf = ["", "k", "m", "b", "t", "q", "Q"];
    while (a >= 1000 && i < suf.length - 1) { a /= 1000; i++; }
    return neg + "$$" + a.toFixed(2) + suf[i];
}

// ===========================================================================
// AB HIER: casino.js von alainbryden, unveraendert bis auf die zwei oben
// genannten Aufrufe.
// ===========================================================================
const argsSchema = [
    ['save-sleep-time', 10], // Time to sleep in milliseconds before and after saving. If you are having trouble with your automatic saves not "taking effect" try increasing this.
    ['click-sleep-time', 5], // Time to sleep in milliseconds before and after clicking any button (or setting text). Increase if clicks don't appear to be "taking effect".
    ['find-sleep-time', 0], // Time to sleep in milliseconds before (but not after) trying to find any element on screen. Increase if you are frequently getting errors detecting elements that should be on screen.
    ['use-basic-strategy', false], // Set to true to use the basic strategy (Stay on 17+)
    ['enable-logging', false], // Set to true to pop up a tail window and generate logs.
    ['kill-all-scripts', false], // Set to true to kill all running scripts before running.
    ['no-deleting-remote-files', false], // By default, if --kill-all-scripts, we will also remove remote files to speed up save/reload
    ['on-completion-script', null], // Spawn this script when max-charges is reached
    ['on-completion-script-args', []], // Optional args to pass to the script when launched
];
export function autocomplete(data, args) {
    data.flags(argsSchema);
    const lastFlag = args.length > 1 ? args[args.length - 2] : null;
    if (["--on-completion-script"].includes(lastFlag))
        return data.scripts;
    return [];
}

/** @param {NS} ns **/
export async function main(ns) {
    // Note to self: This script doesn't use ram-dodging in the inner loop, because we want to
    // delete all temp files and avoid creating more so that the game saves / reloads faster.
    const supportMsg = "Consider posting a full-game screenshot and your save file in the Discord channel or in a new github issue if you want help debugging this issue.";
    let doc = eval("document");
    let options;
    let verbose = false;

    async function start() {
        options = getConfiguration(ns, argsSchema);
        if (!options) return; // Invalid options, or ran in --help mode.
        const saveSleepTime = options['save-sleep-time'];
        verbose = options['enable-logging'];
        if (verbose)
            tail(ns)
        else
            ns.disableLog("ALL");

        let abort = false;
        /*// TODO:
        // Let the user know what's going on and give them an easy way to kill casino.js
        function showDialog(onCancel) {
            const dlg = doc.createElement('div');
            dlg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);padding:20px;';
            dlg.innerHTML = __SCHWARM_BT__<p>casino.js is running until it wins \\$$10b. It will reload the save if it loses too much.<br/>__SCHWARM_BT__ +
                __SCHWARM_BT__It should only take a minute or two, but you can cancel by clicking the button below.</p>__SCHWARM_BT__ +
                __SCHWARM_BT__<button>Cancel</button>__SCHWARM_BT__;
            dlg.querySelector('button').onclick = () => { onCancel(); doc.body.removeChild(dlg); };
            doc.body.appendChild(dlg);
        }
        showDialog(() => abort = true);
        //*/

        /** Helper function to detect if focus was stolen by (e.g.) faction|company work|studying|training and send that work to the background
         * @param {boolean} throwError (default true) If true, and we were doing focus work, throws an Error.
         *                  If false, it will log a warning, try to stop any focus work (up to __SCHWARM_BT__retries__SCHWARM_BT__ times), then return true.
         * @param {number} retries (default 0) Only applicable if __SCHWARM_BT__throwErrorIfNot__SCHWARM_BT__ is false. Try this many times to stop focus work before throwing an error.
         * @param {silent} (default false) Set to true to suppress the warning popup if throwError is false and something has focus.
         * @returns {Promise<boolean>} false if focus was not stolen, true if it was and __SCHWARM_BT__throwErrorIfNot__SCHWARM_BT__ is false. */
        async function checkForStolenFocus(throwError = true, retries = 0, silent = false) {
            // See if we are on the "focus" (work/study/training) screen
            const btnUnfocus = await tryfindElement("//button[text()='Do something else simultaneously']");
            if (!btnUnfocus) return false; // All good, we aren't focus-working on anything
            let baseMessage = "It looks like something stole focus while casino.js was trying to automate the casino.";
            if (throwError) // If we weren't instructed to stop whatever took focus, raise an error
                throw new Error(baseMessage + __SCHWARM_BT__\\nPlease ensure no other scripts are running and try again.__SCHWARM_BT__);
            // Otherwise, log a warning, and return true (focus was stolen)
            log(ns, (silent ? __SCHWARM_BT__INFO__SCHWARM_BT__ : __SCHWARM_BT__WARNING__SCHWARM_BT__) + __SCHWARM_BT__: __SCHWARM_DC__baseMessage}\\nTrying to un-focus it so we can keep going...__SCHWARM_BT__, false, (silent ? undefined : __SCHWARM_BT__WARNING__SCHWARM_BT__));
            await click(btnUnfocus); // Click the button that should let us take back focus and return to the casino
            // Now we should confirm that we're no longer doing focus work (that the click above worked) by recursing.
            retries--; // Decrement "retries" each time we discover we're still on the focus screen.
            return await checkStillAtCasino(retries <= 0, retries); // If out of retries, throw error on next failure
        }

        /** Helper function to detect if we're still at the casino (returns true) or if we've left.
         * If not, checks explicitly if focus was stolen by (e.g.) faction|company work|studying|training and sends that work to the background
         * @param {boolean} throwError (default true) If true, and we are no longer on the casino page, throws an Error.
         *                  If false, it will log a warning, try to stop any focus work (up to __SCHWARM_BT__retries__SCHWARM_BT__ times), then return true.
         * @param {silent} (default false) Set to true if we fully expect not to be at the casino yet, so we don't want to log a warning if that is the case.
         * @returns {Promise<boolean>} true if we are still at the casino, false we are not and __SCHWARM_BT__throwErrorIfNot__SCHWARM_BT__ is false. */
        async function checkStillAtCasino(throwError = true, silent = false) {
            // Check whether we're still on the casino page
            let stillAtCasino = await tryfindElement("//h4[text()='Iker Molina Casino']", silent ? 3 : 10);
            if (stillAtCasino) return true; // All seems good, nothing is stealing focus
            // If we're not still at the casino, see if we are on the "focus" (work/study/training) screen
            const focusWasStolen = await checkForStolenFocus(throwError, silent ? 3 : 1);
            // If we aren't meant to log a warning, or focus was stolen (which has now been deal with) we can return
            if (focusWasStolen || silent)
                return false; // Do not log a warning
            // Otherwise, something else took us away from the casino page when we expected to be there
            let baseMessage = "It looks like the user (or another script) navigated away from the casino page" +
                " while casino.js was trying to automate the casino.";
            if (throwError) // If we weren't instructed to stop whatever took focus, raise an error
                throw new Error(baseMessage + __SCHWARM_BT__\\nPlease ensure no other scripts are running and try again __SCHWARM_BT__ +
                    __SCHWARM_BT__(or ignore this error if you left the casino on purpose.)__SCHWARM_BT__);
            // Otherwise, log a warning, and return false (no longer at the casino)
            log(ns, __SCHWARM_BT__WARNING: __SCHWARM_DC__baseMessage}__SCHWARM_BT__, false, 'warning');
            return false;
        }

        // Helper function to detect getting kicked out of the casino
        /** Helper function to detect getting kicked out of the casino.
         * @param {int?} retries (default 10) how many times to check for each element before deciding they aren't there
         * @returns {Promise<boolean>} true if there is an open dialog telling us we've been kicked out of the casino */
        async function checkForKickedOut(retries = 10) {
            let closeModal;
            do {
                const kickedOut = await tryfindElement("//span[contains(text(), 'Alright cheater get out of here')]", retries);
                if (kickedOut !== null) return true; // Success: We've been kicked out
                // If there are any other modals, they may need to be closed before we can see the kicked out alert.
                let closeModal = await tryfindElement("//button[contains(@class,'closeButton')]", retries);
                if (!closeModal) break; // There appears to be no other modals blocking in the way
                log(ns, "Found a modal that needs to be closed.")
                await click(closeModal); // Click the close button on this modal so we can see others behind it
            } while (closeModal !== null);
            return false;
        }

        // Run this to try and pre-emptively clear away any modals that pop up when we restart.
        // Note that at game startup it seems to take a long while for these to be detected,
        // so we might miss them, but we don't want to slow down the reload-loop too much by waiting to clear them.
        await checkForKickedOut(3);

        // Step 1: Find the button used to save the game. (Lots of retries because it can take a while after reloading the page)
        const btnSaveGame = await findRequiredElement("//button[@aria-label = 'save game']", 100,
            __SCHWARM_BT__Sorry, couldn't find the Overview Save (💾) button. Is your \\"Overview\\" panel collapsed or modded?__SCHWARM_BT__, true);
        async function saveGame() {
            if (saveSleepTime) await ns.sleep(saveSleepTime);
            await click(btnSaveGame);
            if (saveSleepTime) await ns.sleep(saveSleepTime);
        }
        let inputWager, btnStartGame;

        // Note, we deliberately DO NOT pre-emptively check our active source files, or do any kind of RAM dodging
        // const unlockedSFs = await getActiveSourceFiles(ns, true); // See if we have SF4 to travel automatically
        // Why? Because this creates "Temp files", and we want to keep the save file as small as possible for fast saves and reloads.
        //      We use an empty temp folder as a sign that we previously ran and killed all scripts and can safely proceed.

        // Step 2: Try to navigate to the blackjack game (with retries in case of transient errors)
        let priorAttempts = 0;
        while (true) {
            if (priorAttempts > 0)
                await ns.sleep(1000);
            try {
                // Step 2.1: Each time this while loop restarts, check if the player is focused, and stop whatever they're doing.
                await checkForStolenFocus(false, // throwError: false - because we have yet to travel to the casino
                    3, true); // silent: true - means don't raise a warning if we're focus-working. Just background it.

                // Step 2.2: Go to Aevum if we aren't already there. (Must be done manually if you don't have SF4)
                if (ns.getPlayer().city != "Aevum") {
                    if (ns.getPlayer().money < 200000)
                        throw new Error("Sorry, you need at least 200k to travel to the casino.");
                    let travelled = false;
                    try {
                        travelled = await getNsDataThroughFile(ns, 'ns.singularity.travelToCity(ns.args[0])', null, ["Aevum"]);
                    } catch { }
                    if (!travelled) // Note: While it would be nice to confirm whether we have SF4 for the message, it's not worth the cost.
                        log(ns, "INFO: Canot use singularity travel to Aevum via singularity. We will try to go there manually for now.", true);
                    // If automatic travel failed or couldn't be attempted, try clicking our way there!
                    if (!travelled) {
                        await click(await findRequiredElement("//div[@role='button' and ./div/p/text()='Travel']"));
                        await click(await findRequiredElement("//span[contains(@class,'travel') and ./text()='A']"));
                        // If this didn't put us in Aevum, there's likely a travel confirmation dialog we need to click through
                        if (!ns.getPlayer().city != "Aevum")
                            await click(await findRequiredElement("//button[p/text()='Travel']"));
                    }
                    if (ns.getPlayer().city == "Aevum")
                        log(ns, __SCHWARM_BT__SUCCESS: We're now in Aevum!__SCHWARM_BT__)
                    else
                        throw new Error(__SCHWARM_BT__We thought we travelled to Aevum, but we're apparently still in __SCHWARM_DC__ns.getPlayer().city}...__SCHWARM_BT__);
                }

                // Step 2.3: Navigate to the City Casino
                try { // Try to do this without SF4, because it's faster and doesn't require a temp script to be cleaned up below
                    // Click our way to the city casino
                    await click(await findRequiredElement("//div[(@role = 'button') and (contains(., 'City'))]", 15,
                        __SCHWARM_BT__Couldn't find the "🏙 City" menu button. Is your \\"World\\" nav menu collapsed?__SCHWARM_BT__));
                    await click(await findRequiredElement("//span[@aria-label = 'Iker Molina Casino']"));
                } catch (err) { // Try to use SF4 as a fallback (if available) - it's more reliable.
                    let success = false, err2;
                    try { success = await getNsDataThroughFile(ns, 'ns.singularity.goToLocation(ns.args[0])', null, ["Iker Molina Casino"]); }
                    catch (singErr) { err2 = singErr; }
                    if (!success)
                        throw new Error("Failed to travel to the casino both using UI navigation and using SF4 as a fall-back." +
                            __SCHWARM_BT__\\nUI navigation error was: __SCHWARM_DC__getErrorInfo(err)}\\n__SCHWARM_BT__ + (err2 ? __SCHWARM_BT__Singularity error was: __SCHWARM_DC__getErrorInfo(err2)}__SCHWARM_BT__ :
                                '__SCHWARM_BT__ns.singularity.goToLocation("Iker Molina Casino")__SCHWARM_BT__ returned false, but no error...'));
                }

                // Step 2.4: Try to start the blackjack game
                await click(await findRequiredElement("//button[contains(text(), 'blackjack')]"));

                // Step 2.5: Get some buttons we will need to play blackjack
                inputWager = await findRequiredElement("//input[@type='number']");
                btnStartGame = await findRequiredElement("//button[text() = 'Start']");

                // Step 2.6: Clean up temp files and kill other running scripts to speed up the reload cycle
                if (ns.ls("home", "Temp/").length > 0) { // If there are some temp files, it suggests we haven't killed all scripts and cleaned up yet
                    // Step 2.6.1: Test that we aren't already kicked out of the casino before doing drastic things like killing scripts
                    const moneySources = await getNsDataThroughFile(ns, 'ns.getMoneySources()'); // NEW (2022): We can use money sources to see what our casino earnings have been
                    const priorCasinoEarnings = moneySources.sinceInstall.casino;
                    if (priorCasinoEarnings >= 1e10)
                        log(ns, __SCHWARM_BT__INFO: We've previously earned __SCHWARM_DC__formatMoney(priorCasinoEarnings)} from the casino, which should mean we've already been kicked out, __SCHWARM_BT__ +
                            __SCHWARM_BT__but we can double-check anyway by attempting to play a game, since you bothered running this script, and I've bothered scripting the check :)__SCHWARM_BT__, true)
                    await setText(inputWager, __SCHWARM_BT__1__SCHWARM_BT__); // Bet just a dollar and quick the game right away, no big deal
                    await click(btnStartGame);
                    if (await tryfindElement("//p[contains(text(), 'Count:')]", 10)) { // If this works, we're still allowed in
                        const btnStay = await tryfindElement("//button[text() = 'Stay']");
                        if (btnStay) await click(btnStay); // Trigger the game to end (optional - game might already be over if dealer got blackjack)
                    } else { // Otherwise, we've probably been kicked out of the casino, but...
                        // because we haven't killed scripts yet, it's possible another script stole focus again. Detect and handle that case.
                        if (!(await checkStillAtCasino(false))) continue; // Loop back after taking back focus and try again
                        if (await checkForKickedOut()) return await onCompletion(false); // We appear to have previously been kicked out
                        throw new Error("Couldn't start a game of blackjack at the casino, but we don't appear to be kicked out...");
                    }
                    // Step 2.6.2: Kill all other scripts if enabled (note, we assume that if the temp folder is empty, they're already killed and this is a reload)
                    if (options['kill-all-scripts'])
                        await killAllOtherScripts(!options['no-deleting-remote-files']);
                    // Step 2.6.3: Clear the temp folder on home (all transient scripts / outputs)
                    await schwarmCleanTemp(ns);
                }
                break; // We achieved everthing we wanted, we can exit the retry loop.
            } catch (err) {
                // The first 5 errors that occur, we will start over and retry
                if (++priorAttempts < 5) {
                    tail(ns); // Since we're having difficulty, pop open a tail window so the user is aware and can monitor.
                    verbose = true; // Switch on verbose logs
                    log(ns, __SCHWARM_BT__WARNING: casino.js Caught (and suppressed) an unexpected error while navigating to blackjack. __SCHWARM_BT__ +
                        __SCHWARM_BT__Error was:\\n__SCHWARM_DC__getErrorInfo(err)}\\nWill try again (attempt __SCHWARM_DC__priorAttempts} of 5)...__SCHWARM_BT__, false, 'warning');
                } else // More than 5 errors, give up and prompt the user to investigate
                    return log(ns, __SCHWARM_BT__ERROR: After __SCHWARM_DC__priorAttempts} attempts, casino.js continues to catch unexpected errors __SCHWARM_BT__ +
                        __SCHWARM_BT__while navigating to blackjack. The final error was:\\n  __SCHWARM_DC__getErrorInfo(err)}\\n__SCHWARM_DC__supportMsg}__SCHWARM_BT__, true, 'error');
            }
        }

        if (ns.getPlayer().money < 1)
            return log(ns, "WARNING: Whoops, we have no money to bet! Kill whatever's spending it and try again later.", true, 'warning');

        // Step 3: Save the game state now that this script is running, so that future reloads start this script back up immediately.
        await saveGame();

        // Step 4: Play until we lose or are kicked out
        try {
            let startGameRetries = 0, netWinnings = 0, peakWinnings = 0;
            while (true) {
                if (abort) return;
                // Step 4.1: Bet the maximum amount (we save scum to avoid losing, so no risk of going broke)
                const bet = Math.min(1E8, ns.getPlayer().money * 0.9 /* Avoid timing issues with other scripts spending money */);
                if (bet < 0) return await reload(); // If somehow we have no money, we can't continue
                await setText(inputWager, __SCHWARM_BT____SCHWARM_DC__bet}__SCHWARM_BT__); // Set our bet amount

                /* Step 4.2: Try to start a new game. There are a few possible outcomes here:
                   #1 We start a game (typical) in which case we should see "Hit" and "Stay" buttons
                   #2 We instantly won, lost, or tied if the player and/or dealer got 21 (blackjack)
                   #3 No game starts and we get a notification that we've been kicked out of the casino (a good thing)
                   #4 (annoying) The user, or another script, left the casino page (stole focus)
                   #5 (even more annoying) The "click" event didn't "take effect" and we should retry it
                The seemingly-excessive logic below tries to distinguish between those cases and handle them appropriately */
                await click(btnStartGame);
                let winLoseTie = null; // For storing a string indicating the game state after each card is dealt

                // Step 4.3: Look for the "hit" and "stay" buttons, or alternatively the "start" button
                let btnHit, btnStay;
                let retries = 0;
                while (retries++ < 10) { // Quickly distinguish between outcomes #1 and #2. Start retrying only if we can't find any expected buttons
                    if (await tryfindElement("//button[text() = 'Start']", retries))
                        break; // If the start button is present, Outcome #2 or #5 has occurred. (typically #2)
                    // Otherwise, expect to find the hit and stay buttons
                    btnHit = await tryfindElement("//button[text() = 'Hit']", retries);
                    btnStay = await tryfindElement("//button[text() = 'Stay']", retries);
                    // If we detected both buttons, the game is on.
                    if ((btnHit && btnStay))
                        break;
                    // If we only detected one of hit/stay buttons, or no buttons this is surely a UI-lag issue. Try again.
                }
                const gameStarted = btnHit && btnStay; // Outcome #1: Game Started

                // Step 4.4: If this round of blackjack did not start (or ended immediately), figure out why
                if (!gameStarted) {
                    // Step 4.4.1: Detect Outcome #2 - Whether we instantly won/lost/tied via blackjack (21)
                    winLoseTie = await getWinLoseOrTie();
                    if (winLoseTie == null) { // Handle Outcomes #3-5 (atypical of normal casino gameplay)
                        // Step 4.4.2: Detect Outcome #3 (kicked out of casino)
                        if (await checkForKickedOut()) // Were we kicked out of the casino?
                            return await onCompletion(ns); // This is a good thing!

                        // Step 4.4.3: Detect Outcome #4 (something stole focus). We can't recover because we're out of the "navigate to casino" loop.
                        await checkStillAtCasino(); // Throws an error if not. User must stop whatever is stealing focus.

                        // Step 4.5.2: Detect Outcome #5 (The "click" event didn't "take effect" - game never started)
                        // If there's no game-over text, no Hit/Stay buttons, and we've ruled out #3 and #4 already, click must have failed.
                        const errMessage = 'Clicking the start button appears to have done nothing: ' +
                            'Cannot find the Hit/Stay buttons, but there is no game-over text (win/lose/tie) either.';
                        if (startGameRetries++ >= 5) // Retry up to 5 times before giving up and crashing out.
                            throw new Error(errMessage + __SCHWARM_BT__ Gave up after 5 retry attempts.\\n__SCHWARM_DC__supportMsg}__SCHWARM_BT__);
                        tail(ns); // Since we're having difficulty, pop open a tail window so the user is aware and can monitor.
                        verbose = true; // Switch on verbose logs
                        log(ns, __SCHWARM_BT__WARNING: __SCHWARM_DC__errMessage} Trying again...__SCHWARM_BT__, false, 'warning');
                        continue; // Back to 4.1 (Place bet, and try to start a new game)
                    }
                }

                // Step 4.5: Play blackjack until the game is over
                while (winLoseTie == null) {
                    let midGameRetries = 0;
                    try {
                        // Step 4.5.1: Get the current card count
                        const txtCount = await findRequiredElement("//p[contains(text(), 'Count:')]");
                        const allCounts = txtCount.querySelectorAll('span'); // The text might contain multiple counts (if there is an Ace)

                        // Step 4.5.2: Decide to hit or stay
                        let shouldHit;
                        if (options['use-basic-strategy']) { // Basic strategy just looks at our count
                            const highCount = Number(allCounts[allCounts.length - 1].innerText); // The larger value (with Ace=11) - used in basic-strategy mode
                            shouldHit = highCount < 17; // Basic strategy, hit on 16 or less, stay on 17 or over (whether hard or soft)
                            if (verbose) log(ns, __SCHWARM_BT__INFO: Count is __SCHWARM_DC__highCount}, we will __SCHWARM_DC__shouldHit ? 'Hit' : 'Stay'}__SCHWARM_BT__);
                        } else // Advanced strategy will also look at the dealer card
                            shouldHit = await shouldHitAdvanced(txtCount);

                        // Step 4.5.3: Click either the hit or stay button
                        await click(shouldHit ? btnHit : btnStay);
                        await ns.sleep(1); // Yield for an instant so the game can update and process events (e.g. deal the next card)

                        // Step 4.5.4: A new card should have been dealt, check if the game is over
                        winLoseTie = await getWinLoseOrTie();
                    }
                    catch (err) {
                        // We can't get kicked out mid-game, so no need to check for that. See if we left the casino.
                        await checkStillAtCasino(); // Will throw another error with a best guess at how we were interrupted
                        // Any other errors must be transient failures to pick up certain UI elements, so try again
                        const errMessage = __SCHWARM_BT__an unexpected error in the middle of a game of blackjack:\\n__SCHWARM_DC__getErrorInfo(err)}__SCHWARM_BT__;
                        if (midGameRetries++ >= 5)  // Retry up to 5 times before giving up and crashing out.
                            throw new Error(__SCHWARM_BT__After __SCHWARM_DC__priorAttempts} attempts, casino.js continues to catch __SCHWARM_DC__errMessage}__SCHWARM_BT__);
                        tail(ns); // Since we're having difficulty, pop open a tail window so the user is aware and can monitor.
                        verbose = true; // Switch on verbose logs
                        log(ns, __SCHWARM_BT__WARNING: casino.js Caught (and suppressed) __SCHWARM_DC__errMessage}\\n__SCHWARM_BT__ +
                            __SCHWARM_BT__Will try again (attempt __SCHWARM_DC__midGameRetries} of 5)...__SCHWARM_BT__, false, 'warning');
                    }
                } // Once the above loop is over winLoseTie is guaranteed be set to some non-null value

                // Step 4.6: Take action depending on whether we won, lost, or tied
                switch (winLoseTie) {
                    case "tie": // Nothing gained or lost, we can immediately start a new game.
                        continue;
                    case "win": // We want to "lock in" our wins by saving the game after each one
                        netWinnings += bet;
                        // Keep tabs of our best winnings, and save the game each time we top it
                        if (netWinnings > peakWinnings) {
                            peakWinnings = netWinnings
                            if (netWinnings > 0)
                                if (saveSleepTime) await ns.sleep(saveSleepTime);
                            await click(btnSaveGame); // Save if we won
                            if (saveSleepTime) await ns.sleep(saveSleepTime);
                        }
                        // Quick pre-emptive test after each win to see if we've been kicked out
                        if (await checkForKickedOut(1)) // Only 1 retry should be very fast
                            return await onCompletion(ns);
                        continue;
                    case "lose":
                        netWinnings -= bet;
                        // To avoid reloading too often, only reload if we're losing really badly (almost broke, or down by 10 games)
                        if (ns.getPlayer().money < 1E8 || netWinnings <= peakWinnings - 10 * 1E8)
                            return await reload(); // We want to reload the game (save scum) to undo our loss :)
                        continue;
                    default:
                        throw new Error(__SCHWARM_BT__winLoseTie was set to \\"__SCHWARM_DC__(winLoseTie === undefined ? 'undefined' :
                            winLoseTie === null ? 'null' : winLoseTie)}\\", which shouldn't be possible__SCHWARM_BT__);
                }
                throw new Error('This code should be unreachable - did someone break the logic above?');
            }
        }
        catch (err) {
            tail(ns); // Display the tail log if anything goes wrong so the user can review the logs
            log(ns, __SCHWARM_BT__ERROR: casino.js Caught a fatal error while playing blackjack:\\n__SCHWARM_DC__getErrorInfo(err)}\\n__SCHWARM_DC__supportMsg}__SCHWARM_BT__, true, 'error');
        }
    }

    /** This helper function will help us detect if we lost, won or tied.
     * @param {NS} ns
     * @returns {Promise<null|"win"|"lose"|"tie">} null indicates no outcome could be detected (game either not over or still in progres) */
    async function getWinLoseOrTie() {
        // To strike a balance between quickly finding the right outcome, and not wasting too much time,
        // cycle between each xpath search, increasing the the number of retries each time, until we hit 5 each.
        // 1+2+3+4+5=15 total retries, but all with small ms wait times (<20ms), so should still only take a second
        let retries = 0;
        while (retries++ < 5) {
            if (await tryfindElement("//button[text() = 'Hit']", retries))
                return null; // Game is not over yet, we can still hit
            if (await tryfindElement("//p[contains(text(), 'lost')]", retries))
                return "lose";
            // Annoyingly, when we win with blackjack, "Won" is Title-Case, but normal wins is just "won".
            if (await tryfindElement("//p/text()[contains(.,'won') or contains(.,'Won')]", retries))
                return "win";
            if (await tryfindElement("//p[contains(text(), 'Tie')]", retries))
                return "tie";
        }
        return null;
    }

    /** Forces the game to reload (without saving). Great for save scumming.
     * WARNING: Doesn't work if the user last ran the game with "Reload and kill all scripts"
     * @param {NS} ns */
    async function reload() {
        let attempts = 0;
        let errMessage = '';
        while (attempts++ <= 5) {
            const win = eval("window");
            win.onbeforeunload = null; // Disable the unsaved changes warning before reloading
            await ns.sleep(options['save-sleep-time']); // Yield execution for an instant incase the game needs to finish a save or something
            if (attempts < 2)
                win.location = win.location; // Force refresh the page without saving
            else if (attempts < 3)
                win.location.reload(); // Another approach that may work when the above does not.
            else if (attempts < 4)
                win.location.reload(true);
            await ns.sleep(10000); // Keep the script alive to be safe. Presumably the page reloads before this completes.
            errMessage = __SCHWARM_BT__casino.js asked the game to reload __SCHWARM_DC__attempts} times, but it didn't.__SCHWARM_BT__
            log(ns, __SCHWARM_BT__WARNING: __SCHWARM_DC__errMessage} Trying again...__SCHWARM_BT__, true, 'warning');
        }
        throw new Error(__SCHWARM_BT____SCHWARM_DC__errMessage} Giving up.__SCHWARM_BT__);
    }

    /** @param {NS} ns
     *  Helper to kill all scripts on all other servers, except this one **/
    async function killAllOtherScripts(removeRemoteFiles) {
        // Kill processes on home (except this one)
        let pid = await runCommand(ns, __SCHWARM_BT__ns.ps().filter(s => s.filename != ns.args[0]).forEach(s => ns.kill(s.pid));__SCHWARM_BT__,
            '/Temp/kill-everything-but.js', [ns.getScriptName()]);
        await waitForProcessToComplete(ns, pid);
        log(ns, __SCHWARM_BT__INFO: Killed other scripts running on home...__SCHWARM_BT__, true);

        // Kill processes on all other servers
        const allServers = await getNsDataThroughFile(ns, '(() => { const seen = new Set(["home"]); const q = ["home"]; while (q.length) { for (const h of ns.scan(q.pop())) { if (!seen.has(h)) { seen.add(h); q.push(h); } } } return [...seen]; })()');
        const serversExceptHome = allServers.filter(s => s != "home");
        pid = await runCommand(ns, 'ns.args.forEach(host => ns.killall(host))',
            '/Temp/kill-all-scripts-on-servers.js', serversExceptHome);
        await waitForProcessToComplete(ns, pid);
        log(ns, 'INFO: Killed all scripts running on other hosts...', true);

        // If enabled, remove files on all other servers
        if (removeRemoteFiles) {
            pid = await runCommand(ns, 'ns.args.forEach(host => ns.ls(host).forEach(file => ns.rm(file, host)))',
                '/Temp/delete-files-on-servers.js', serversExceptHome)
            await waitForProcessToComplete(ns, pid);
            log(ns, 'INFO: Removed all files on other hosts...', true)
        }
    }

    /** @param {NS} ns
     *  @param {boolean} kickedOutAfterPlaying (default: true) set to false if we detected having been kicked out before we even started.
     *  Run when we can no longer gamble at the casino (presumably because we've been kicked out) **/
    async function onCompletion(kickedOutAfterPlaying = true) {
        if (kickedOutAfterPlaying)
            log(ns, "SUCCESS: We've been kicked out of the casino.", true);
        else
            log(ns, "INFO: We appear to have been previously kicked out of the casino. Continuing without playing...", true);

        // For convenience, route to the terminal (but no stress if it doesn't work)
        try {
            const terminalNav = await tryfindElement("//div[(@role = 'button') and (contains(., 'Terminal'))]");
            if (terminalNav) await click(terminalNav);
        } catch (err) { log(ns, __SCHWARM_BT__WARNING: Failed to route to the terminal: __SCHWARM_DC__getErrorInfo(err)}__SCHWARM_BT__, false); }

        // Run the completion script before shutting down
        let completionScript = options['on-completion-script'];
        if (!completionScript) return;
        let completionArgs = options['on-completion-script-args'];
        if (ns.run(completionScript, 1, ...completionArgs))
            log(ns, __SCHWARM_BT__INFO: casino.js shutting down and launching __SCHWARM_DC__completionScript}...__SCHWARM_BT__, false, 'info');
        else
            log(ns, __SCHWARM_BT__WARNING: casino.js shutting down, but failed to launch __SCHWARM_DC__completionScript}...__SCHWARM_BT__, false, 'warning');
    }

    // Some DOM helpers (partial credit to @ShamesBond)
    async function click(button) {
        if (button === null || button === undefined)
            throw new Error("click was called on a null reference. This means the prior button detection failed, but was assumed to have succeeded.");
        // Sleep before clicking, if so configured
        let sleepDelay = options['click-sleep-time'];
        if (sleepDelay > 0) await ns.sleep(sleepDelay);
        // Find the onclick method on the button
        let fnOnClick = button[Object.keys(button)[1]].onClick; // This is voodoo to me. Apparently it's function on the first property of this button?
        if (!fnOnClick)
            throw new Error(__SCHWARM_BT__Odd, we found the button we were looking for (__SCHWARM_DC__button.text()}), but couldn't find its onclick method!__SCHWARM_BT__)
        if (verbose) log(ns, __SCHWARM_BT__Clicking the button.__SCHWARM_BT__);
        // Click the button. The "secret" to this working is just to pass any object containing isTrusted:true
        await fnOnClick({ isTrusted: true });
        // Sleep after clicking, if so configured
        if (sleepDelay > 0) await ns.sleep(sleepDelay);
    }

    async function setText(input, text) {
        if (input === null || input === undefined)
            throw new Error("setText was called on a null reference. This means the prior input detection failed, but was assumed to have succeeded.");
        let sleepDelay = options['click-sleep-time'];
        if (sleepDelay > 0) await ns.sleep(sleepDelay);
        if (verbose) log(ns, __SCHWARM_BT__Setting text: __SCHWARM_DC__text} on input.__SCHWARM_BT__);
        await input[Object.keys(input)[1]].onChange({ isTrusted: true, target: { value: text } });
        if (sleepDelay > 0) await ns.sleep(sleepDelay);
    }

    /** Try to find an element, with retries. Throws an error if the element could not be found.
     * @param {NS} ns
     * @param {string} xpath The xpath 1.0 expression to use to find the element.
     * @param {number} retries (default 10) The number of times to retry.
     * @param {string?} customErrorMessage (optional) A custom error message to replace the default on failure. */
    async function findRequiredElement(xpath, retries = 15, customErrorMessage = null) {
        return await internalfindWithRetry(xpath, false, retries, customErrorMessage);
    }
    /** Try to find an element, with retries. Returns null if the element is not found.
     * @param {NS} ns
     * @param {string} xpath The xpath 1.0 expression to use to find the element.
     * @param {number} retries (default 4) The number of times to check if the element exists before assuming it does not.
     * It's important to retry a few times, since the UI can lag. An element not here now might appear in a few milliseconds. */
    async function tryfindElement(xpath, retries = 4) {
        return await internalfindWithRetry(xpath, true, retries);
    }

    /* Used to search for an element in the document. This can fail if the dom isn't fully re-rendered yet. */
    function internalFind(xpath) { return doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; }

    /** Try to find an element, with retries.
     * This is tricky - in some cases we are just checking if the element exists, but expect that it might not
     * (expectFailure = true) - in this case we want some retries in case we were just too fast to detect the element
     * but we don't want to retry too much. We also don't want to be too noisy if we fail to find the element.
     * In other cases, we always expect to find the element we're looking for, and if we don't it's an error.
     * @param {NS} ns
     * @param {string} xpath The xpath 1.0 expression to use to find the element.
     * @param {boolean} expectFailure Changes the behaviour when an item cannot be found.
     *                                If false, failing to find the element is treated as an error.
     *                                If true, we simply return null indicating that no such element was found.
     * @param {null|number} maxRetries (default null) The number of times to retry.
     * @param {string?} customErrorMessage (optional) A custom error message to replace the default on failure. */
    async function internalfindWithRetry(xpath, expectFailure, maxRetries, customErrorMessage = null) {
        try {
            // NOTE: We cannot actually log the xpath we're searching for because depending on the xpath, it might match our log!
            // So here's a trick to convert the characters into "look-alikes"
            let logSafeXPath = xpath.substring(2, 20) + "..."; // TODO: Some trick to convert the characters into "look-alikes" (ạḅc̣ḍ...)
            if (verbose)
                log(ns, __SCHWARM_BT__INFO: __SCHWARM_DC__(expectFailure ? "Checking if element is on screen" : "Searching for expected element")}: \\"__SCHWARM_DC__logSafeXPath}\\"__SCHWARM_BT__, false);
            // If enabled give the game some time to render an item before we try to find it on screen
            if (options['find-sleep-time'])
                await ns.sleep(options['find-sleep-time']);
            let attempts = 0, retryDelayMs = 1; // starting retry delay (ms), will be increased with each attempt
            while (attempts++ <= maxRetries) {
                // Sleep between attempts
                if (attempts > 1) {
                    if (verbose || !expectFailure)
                        log(ns, (expectFailure ? 'INFO' : 'WARN') + __SCHWARM_BT__: Attempt __SCHWARM_DC__attempts - 1} of __SCHWARM_DC__maxRetries} to find \\"__SCHWARM_DC__logSafeXPath}\\" failed. Retrying...__SCHWARM_BT__, false);
                    await ns.sleep(retryDelayMs);
                    retryDelayMs *= 2; // back-off rate (increases next sleep time before retrying)
                    retryDelayMs = Math.min(retryDelayMs, 200); // Cap the retry rate at 200 ms (game tick rate)
                }
                const findAttempt = internalFind(xpath);
                if (findAttempt !== null)
                    return findAttempt;
            }
            if (expectFailure) {
                if (verbose)
                    log(ns, __SCHWARM_BT__INFO: Element doesn't appear to be present, moving on...__SCHWARM_BT__, false);
            } else {
                const errMessage = customErrorMessage ?? __SCHWARM_BT__Could not find the element with xpath: \\"__SCHWARM_DC__logSafeXPath}\\"\\n__SCHWARM_BT__ +
                    __SCHWARM_BT__Something may have stolen focus or otherwise routed the UI away from the Casino.__SCHWARM_BT__;
                log(ns, 'ERROR: ' + errMessage, true, 'error')
                throw new Error(errMessage, true, 'error');
            }
        } catch (e) {
            if (!expectFailure) throw e;
        }
        return null;
    }

    // Better logic for when to HIT / STAY (Partial credit @drider)
    async function shouldHitAdvanced(playerCountElem) {
        const txtPlayerCount = playerCountElem.textContent.substring(7);
        const player = parseInt(txtPlayerCount.match(/\\d+/).shift());
        const dealer = await getDealerCount();
        if (verbose)
            log(ns, __SCHWARM_BT__Player Count Text: __SCHWARM_DC__txtPlayerCount}, Player: __SCHWARM_DC__player}, Dealer: __SCHWARM_DC__dealer}__SCHWARM_BT__);
        // Strategy to minimize house-edge. See https://wizardofodds.com/blackjack/images/bj_4d_s17.gif
        if (txtPlayerCount.includes("or")) { // Player has an Ace
            if (player >= 9) return false; // Stay on Soft 19 or higher
            if (player == 8 && dealer <= 8) return false; // Soft 18 - Stay if dealer has 8 or less
            return true; // Otherwise, hit on Soft 17 or less
        }
        if (player >= 17) return false; // Stay on Hard 17 or higher
        if (player >= 13 && dealer <= 6) return false; // Stay if player has 13-16 and dealer shows 6 or less.
        if (player == 12 && 4 <= dealer && dealer <= 6) return false; // Stay if player has 12 and dealer has 4 to 6
        return true;// Otherwise Hit
    }

    async function getDealerCount() {
        const dealerCount = await findRequiredElement("//p[contains(text(), 'Dealer')]/..");
        const text = dealerCount.innerText.substring(8, 9);
        let cardValue = parseInt(text);
        return isNaN(cardValue) ? (text == 'A' ? 11 : 10) : cardValue;
    }

    // Run the program
    await start();
}`;
