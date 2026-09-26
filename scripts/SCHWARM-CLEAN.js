/**
 * SCHWARM-CLEAN.js — v5.3 — Total-Reiniger für home, mit Rückfahrkarte.
 *
 * v5.3 — NEUER MODUS --temp: NUR DEN EVAL-CACHE STUTZEN.
 *   Gemessen am 13.09.2026 lagen auf home 1216 Dateien, davon 794 Stueck
 *   /Temp/schwarm-eval-*.js. Der Grund steht in SCHWARM-HELPERS v5.0: der
 *   hash-benannte Cache hatte keinen Deckel, weil viele Befehle veraenderliche
 *   Werte im TEXT tragen (CORP-Betraege, WORK-Aug-Listen) und damit bei jedem
 *   neuen Wert eine neue Datei ergeben. HELPERS v5.0 deckelt das jetzt an der
 *   Quelle; dieser Modus raeumt den ALTBESTAND und die Reste beendeter
 *   Prozesse, an die ein laufender Prozess nicht mehr herankommt.
 *
 *   GETRENNTER ZWEIG, ABSICHTLICH. --temp laeuft VOR jeder anderen Logik und
 *   kehrt danach zurueck: kein KILL, keine Ports, keine Sicherung, kein Wipe.
 *   Jeder Kandidat muss ausserdem gegen TEMP_EVAL_RE passen. Ein Reiniger, der
 *   im Normalfall ALLES loescht, darf im Teilmodus nicht aus Versehen mehr
 *   erwischen als angekuendigt.
 *
 * v5.2 — DIE SICHERUNG FASSTE UNTERORDNER MIT. /schwarm-go/ und /schwarm-bb/
 *   fuehren Wegwerf-Skripte (PAYLOADS:1576 und :4340), und ihre PFADE beginnen
 *   ebenfalls mit "schwarm" — der Praefixtest sammelte sie alle ein. Daher 119
 *   statt gut 20. Jetzt nur noch die Wurzel von home. Der Trockenlauf zeigt
 *   ausserdem die NAMEN der gesicherten Dateien; beim ersten Mal hatte ich die
 *   Ursache geraten (Temp-Cache) statt sie zu messen — und falsch geraten.
 *
 * v5.1 — DER TROCKENLAUF HAT ZWEI DINGE AUFGEDECKT.
 *   1. Unter den 345 Loeschtreffern standen NUKE.exe, BruteSSH.exe, AutoLink.exe
 *      und Formulas.exe. ns.rm loescht Programme wirklich (BaseServer.ts:195).
 *      Formulas.exe kostet 5 Mrd — das nimmt ein Aufraeumwerkzeug nicht
 *      beilaeufig mit. .exe und die Fehler-Chronik sind jetzt geschuetzt;
 *      --wipe-all hebt den Schutz auf.
 *   2. Die Sicherung fasste 116 "Skripte". Rund 90 davon waren
 *      /Temp/schwarm-eval-*.js — der hash-benannte Eval-Cache (HELPERS:2712),
 *      nicht der Schwarm. /Temp/ ist jetzt ausgenommen.
 * ============================================================================
 * Zweck: home komplett leerräumen, damit du einen frischen Stand einspielen und
 * auf sauberem System testen kannst. Prozess-Aufräumung macht GENESIS beim Start
 * ohnehin selbst (cleanupSwarm) — DIESES Werkzeug ist der Datei-Nuke.
 *
 * BEWUSST OHNE IMPORTS: läuft auch, wenn SCHWARM-HELPERS.js fehlt oder gerade
 * getauscht wird. Ein Reset-Werkzeug darf nicht von dem System abhängen, das es
 * zurücksetzt.
 *
 * WAS ES TUT (Default)
 *   1. KILL:  beendet ALLE Prozesse auf home (außer sich selbst) und ruft auf
 *             jedem erreichbaren, gerooteten Host killall.
 *   2. PORTS: leert die IPC-Ports 1–40. Die Port-Tabelle endet bei 26 (GO 23/24, STANEK 25/26; TOPO liegt auf 22);
 *             der Rest faengt Reste aus aelteren Staenden ab.
 *   3. WIPE:  löscht ALLE Dateien auf home — außer dieser Datei selbst.
 *             Das schließt Spiel-Flavor (.lit/.msg), Contracts (.cct), Caches
 *             und State/Temp mit ein. Genau das ist für einen echten Reset gewollt.
 *
 * FLAGS
 *   (keine)        Total-Wipe: alles außer SCHWARM-CLEAN.js.
 *   --keep-swarm   NUR Fremdkram/State/Flavor löschen; die aktuellen Schwarm-
 *                  Skripte (Präfix "schwarm"/"SCHWARM") bleiben erhalten.
 *                  Für Aufräumen OHNE Neu-Einspielen.
 *   --dry-run      Zeigt nur an, was passieren würde. Verändert nichts.
 *   --temp         KEIN Wipe. Stutzt NUR /Temp/schwarm-eval-*.js auf --keep
 *                  Stück zurück und endet. Läuft der Schwarm dabei weiter,
 *                  ist das folgenlos: was gerade läuft, schützt die Engine
 *                  selbst, und jede gelöschte Datei schreibt HELPERS beim
 *                  nächsten gleichen Befehl neu.
 *   --keep N       Nur mit --temp: wie viele Eval-Skripte stehen bleiben
 *                  (Vorgabe 40). Sind es ohnehin weniger, passiert nichts.
 *
 * TYPISCHER ABLAUF FÜR SAUBERE TESTS
 *   run SCHWARM-CLEAN.js --dry-run     # Kontrolle: was wird getroffen?
 *   run SCHWARM-CLEAN.js               # home leerräumen (nur der Reiniger bleibt)
 *   -> neue Skripte einspielen ->  run SCHWARM-GENESIS.js
 *
 * TEMP-CACHE IM LAUFENDEN BETRIEB STUTZEN (v5.3)
 *   run SCHWARM-CLEAN.js --temp --dry-run   # zählen, nichts anfassen
 *   run SCHWARM-CLEAN.js --temp             # auf 40 Stück zurückschneiden
 *
 * HINWEIS DARKNET: Roamer laufen auf separaten Darknet-Servern (nicht im normalen
 * Scan) und lösen sich beim nächsten Reload/Prestige von selbst auf.
 *
 * @param {NS} ns
 */

const FLAGS = [
    ["keep-swarm", false],
    ["dry-run", false],
    ["restore", false],
    ["no-backup", false],
    ["wipe-all", false],
    ["temp", false],
    ["keep", 40],
    ["help", false],
];

// v5.3 — WER IM --temp-MODUS UEBERHAUPT IN FRAGE KOMMT.
// Der Ausdruck ist bewusst eng: Ordner "Temp", Praefix "schwarm-eval-", danach
// nur der djb2-Hash aus HELPERS (Ziffern und Kleinbuchstaben, toString(36)),
// Endung .js. Alles andere wird in diesem Modus NICHT angefasst — auch nicht,
// wenn es zufaellig in /Temp/ liegt. ns.ls liefert Pfade ohne fuehrenden
// Schraegstrich, HELPERS schreibt sie mit; beides ist erlaubt.
const TEMP_EVAL_RE = /^\/?Temp\/schwarm-eval-[0-9a-z]+\.js$/;

// Nur relevant für --keep-swarm: diese Dateien überleben zusätzlich zu allen,
// deren Name (case-insensitiv) mit "schwarm" beginnt.
// v4.0: LEER. Frueher standen hier helpers.js, scan.js und casino.js — die drei
// Fremdskripte, die der Schwarm noch brauchte. casino.js ist jetzt ein Payload
// in SCHWARM-GENESIS.js (und braucht damit auch helpers.js nicht mehr), scan.js
// ist durch den SCAN-Payload ersetzt. Der Ordner enthaelt nur noch
// SCHWARM-Dateien; --keep-swarm behaelt sie alle ueber das Praefix.
const KEEP_COMPANIONS = [];

// =============================================================================
// SICHERUNG UND WIEDERHERSTELLUNG (v5.0)
// =============================================================================
//
// WARUM NICHT EINBETTEN. Die naheliegende Idee war, GENESIS als Quelltext in
// den Reiniger zu legen — so wie SCHWARM-PAYLOADS die Daemons fuehrt. Das
// scheitert an einer harten Zahl: GENESIS enthaelt 44 Backticks und 60 "${".
// In ein Template-Literal gelegt wuerde es das Literal beim ersten Backtick
// schliessen; genau dieser Fehler hat den Schwarm in dieser Sitzung schon
// zweimal getroffen. Man koennte es JSON-escapen — dann muesste der Reiniger
// aber bei JEDER GENESIS-Aenderung neu erzeugt werden, und irgendwann traegt er
// einen alten Stand, ohne dass es jemand merkt.
//
// STATTDESSEN EINE SICHERUNGSDATEI. Sie enthaelt ALLE Schwarm-Skripte als JSON
// ({dateiname: inhalt}) und ist immer aktuell, weil sie unmittelbar vor dem
// Aufraeumen geschrieben wird. Der Reiniger selbst ist damit die "Vor-Genesis":
// er ueberlebt per Definition (er loescht sich nie), liest die Sicherung und
// schreibt alles zurueck.
//
// WO SIE LIEGT — und warum home die WICHTIGERE Kopie ist:
//   home  ueberlebt einen Aug-Install. prestigeHomeComputer (ServerHelpers.ts
//         :224) loescht nur Programme, Nachrichten und ramUsed; Skripte und
//         Textdateien bleiben liegen.
//   n00dles ueberlebt einen Aug-Install NICHT. Prestige.ts:74 ruft
//         prestigeAllServers(), und das ist AllServers.clear() — alle Server
//         werden vernichtet und neu erzeugt.
// Die Kopie auf n00dles deckt deshalb genau EINEN Fall ab: der Reiniger hat auf
// home zu viel geloescht. Fuer den Reset ist sie wertlos, dafuer ist home da.
// n00dles braucht 0 Ports und Hacking 1 (servers.ts:1168) — also immer rootbar.
const SICHERUNG   = "SCHWARM-SICHERUNG.txt";
const SPIEGEL     = "n00dles";
const SCHWARM_PRAEFIX = "schwarm";

/** Alle Schwarm-Skripte auf home einsammeln. */
function sammleSkripte(ns) {
    const map = {};
    let n = 0;
    for (const f of safeLs(ns, "home")) {
        const name = String(f);
        const low = name.toLowerCase();
        // NUR DIE WURZEL VON HOME. Das war der Grund fuer 119 Treffer statt gut
        // zwanzig: /schwarm-go/ und /schwarm-bb/ sind Ordner fuer Wegwerf-
        // Skripte (PAYLOADS:1576 und :4340), und ihre PFADE beginnen ebenfalls
        // mit "schwarm" — der Praefixtest hat sie deshalb alle eingesammelt.
        // Sie entstehen bei Bedarf neu und gehoeren nicht in die Sicherung.
        //
        // Der Eval-Cache in Temp/ lag uebrigens NIE darin: "Temp/..." beginnt
        // nicht mit "schwarm". Das hatte ich zuerst geraten und dann gemessen —
        // die Zahl stieg nach dem vermeintlichen Fix von 116 auf 119.
        if (name.indexOf("/") >= 0) continue;
        if (!low.startsWith(SCHWARM_PRAEFIX)) continue;
        if (!low.endsWith(".js")) continue;          // nur Code, kein State
        if (name === SICHERUNG) continue;
        let inhalt = "";
        try { inhalt = ns.read(name) || ""; } catch (e) { continue; }
        if (!inhalt) continue;
        map[name] = inhalt;
        n++;
    }
    return { map: map, n: n };
}

/**
 * Sicherung schreiben: home zuerst, danach der Spiegel auf n00dles.
 * @returns {{ok:boolean, n:number, bytes:number, spiegel:boolean, warum:string}}
 */
function schreibeSicherung(ns) {
    const s = sammleSkripte(ns);
    if (s.n === 0) return { ok: false, n: 0, bytes: 0, spiegel: false, warum: "keine Schwarm-Skripte auf home gefunden" };
    let text = "";
    try { text = JSON.stringify(s.map); } catch (e) { return { ok: false, n: s.n, bytes: 0, spiegel: false, warum: "JSON: " + e }; }
    try { ns.write(SICHERUNG, text, "w"); }
    catch (e) { return { ok: false, n: s.n, bytes: text.length, spiegel: false, warum: "Schreiben auf home: " + e }; }

    // Spiegel. Fehlschlag ist KEIN Fehler des Ganzen — die Kopie auf home ist
    // die wichtigere, und n00dles ist ohnehin nur gegen Reiniger-Pannen da.
    let spiegel = false, warum = "";
    try {
        if (!ns.hasRootAccess(SPIEGEL)) { try { ns.nuke(SPIEGEL); } catch (e) { /* gleich sichtbar */ } }
        if (ns.hasRootAccess(SPIEGEL)) spiegel = ns.scp(SICHERUNG, SPIEGEL, "home") === true;
        else warum = "kein Root auf " + SPIEGEL;
    } catch (e) { warum = String(e); }
    return { ok: true, n: s.n, bytes: text.length, spiegel: spiegel, warum: warum };
}

/**
 * Sicherung lesen — home zuerst, dann der Spiegel.
 * @returns {{map:object|null, quelle:string}}
 */
function leseSicherung(ns) {
    for (const host of ["home", SPIEGEL]) {
        let roh = "";
        try { roh = (host === "home" ? ns.read(SICHERUNG) : leseVonFremd(ns, SICHERUNG, host)) || ""; }
        catch (e) { roh = ""; }
        if (!roh) continue;
        try {
            const m = JSON.parse(roh);
            if (m && typeof m === "object" && Object.keys(m).length > 0) return { map: m, quelle: host };
        } catch (e) { /* naechste Quelle */ }
    }
    return { map: null, quelle: "" };
}

/** Eine Datei von einem fremden Host lesen: erst herholen, dann lesen. */
function leseVonFremd(ns, datei, host) {
    try {
        if (!ns.hasRootAccess(host)) return "";
        if (ns.scp(datei, "home", host) !== true) return "";
        return ns.read(datei) || "";
    } catch (e) { return ""; }
}

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const opts = ns.flags(FLAGS);
    if (opts.help) return printHelp(ns);

    const dry = opts["dry-run"];
    const keepSwarm = opts["keep-swarm"];
    const self = ns.getScriptName();
    const tag = dry ? "[DRY-RUN] " : "";

    // ------------------------------------------------------- 0a. TEMP (v5.3)
    // Steht VOR allem anderen und kehrt danach zurueck. Dieser Zweig toetet
    // nichts, leert keine Ports, sichert nichts und wipet nichts — er stutzt
    // ausschliesslich den Eval-Cache aus SCHWARM-HELPERS.
    //
    // WARUM DAS IM LAUFENDEN BETRIEB GEFAHRLOS IST, gleich zweifach:
    //   1. Ein Skript, das GERADE LAEUFT, laesst sich gar nicht loeschen. Die
    //      Engine lehnt ab (BaseServer.removeFile: "Cannot delete a script that
    //      is currently running!"), ns.rm gibt false zurueck, die Datei bleibt.
    //   2. Eine geloeschte Cache-Datei ist kein Verlust, sondern hoechstens ein
    //      einmaliger Umweg: HELPERS schreibt sie beim naechsten gleichen
    //      Befehl neu (`if (ns.read(scriptFile) !== body) ns.write(...)`).
    //      Bezahlt wird dann eine Kompilierung — dieselbe, die ohne Cache bei
    //      JEDEM Aufruf anfaellt.
    //
    // DIE AUSGABEDATEIEN (/Temp/schwarm-eval-*-*.txt) BLEIBEN BEWUSST LIEGEN.
    // Sie tragen KEINE Skriptendung, die Engine schuetzt sie also nicht; wer
    // gerade auf sein Ergebnis wartet, liest eine geloeschte Datei als "" und
    // bekaeme ein falsches Ergebnis statt einer Zeitueberschreitung. HELPERS
    // raeumt sie in jedem Rueckgabeweg selbst weg — uebrig bleiben nur die aus
    // hart abgebrochenen Prozessen. Der Bericht NENNT ihre Zahl, damit ein
    // Anwachsen auffaellt; wegzuraeumen sind sie ueber den normalen Wipe.
    if (opts["temp"]) {
        const keep = Math.max(0, Math.floor(Number(opts["keep"]) || 0));
        const alle = safeLs(ns, "home");
        const skripte = alle.filter(f => TEMP_EVAL_RE.test(f));
        const ausgaben = alle.filter(f => /^\/?Temp\/schwarm-eval-.+\.txt$/.test(f));

        ns.tprint("═══════════════════════════════════════════════");
        ns.tprint(` ${tag}SCHWARM-CLEAN — Eval-Cache stutzen (--temp)`);
        ns.tprint("═══════════════════════════════════════════════");
        ns.tprint(` GEFUNDEN  ${skripte.length} Eval-Skript(e) | Grenze --keep ${keep}`
            + (ausgaben.length ? ` | ${ausgaben.length} Ausgabedatei(en) (bleiben)` : ""));

        if (skripte.length <= keep) {
            ns.tprint(" NICHTS ZU TUN — der Cache liegt unter der Grenze.");
            ns.tprint("═══════════════════════════════════════════════");
            return;
        }

        // Wer bleibt, ist nicht zu bestimmen: das Spiel kennt kein Datum je
        // Datei, und der Hash traegt keine Zeit. Die Auswahl ist deshalb
        // willkuerlich (ls-Reihenfolge) — und darf es sein, siehe Punkt 2 oben.
        const kandidaten = skripte.slice(0, skripte.length - keep);
        ns.tprint(` TREFFER   ${kandidaten.length} zum Loeschen: ${preview(kandidaten, 6)}`);

        let weg = 0, laeuft = 0;
        if (!dry) {
            for (const f of kandidaten) {
                let ok = false;
                try { ok = ns.rm(f, "home") === true; } catch (e) { ok = false; }
                if (ok) weg++; else laeuft++;
            }
            ns.tprint(` GELOESCHT ${weg}`
                + (laeuft ? ` | ${laeuft} uebersprungen (laufen gerade oder schon weg)` : "")
                + ` | ${skripte.length - weg} bleiben`);
        }
        ns.tprint("═══════════════════════════════════════════════");
        return;
    }

    // ---------------------------------------------------------- 0. RESTORE
    // Die "Vor-Genesis": alles zurueckschreiben und GENESIS starten. Dieser
    // Zweig laeuft VOR allem anderen und beendet sich danach — er raeumt nicht
    // auf, er baut auf.
    if (opts["restore"]) {
        ns.tprint("═══════════════════════════════════════════════");
        ns.tprint(" SCHWARM-CLEAN — WIEDERHERSTELLUNG");
        ns.tprint("═══════════════════════════════════════════════");
        const s = leseSicherung(ns);
        if (!s.map) {
            ns.tprint(" KEINE SICHERUNG gefunden — weder auf home noch auf " + SPIEGEL + ".");
            ns.tprint(" Ohne sie kann hier nichts wiederhergestellt werden.");
            ns.tprint("═══════════════════════════════════════════════");
            return;
        }
        const namen = Object.keys(s.map);
        ns.tprint(` QUELLE ${s.quelle} | ${namen.length} Datei(en) in der Sicherung`);
        let neu = 0, gleich = 0, fehlerN = 0;
        for (const f of namen) {
            if (f === self) continue;                 // sich selbst nie ueberschreiben
            try {
                if (ns.read(f) === s.map[f]) { gleich++; continue; }
                ns.write(f, s.map[f], "w");
                neu++;
            } catch (e) { fehlerN++; }
        }
        ns.tprint(` SCHREIB ${neu} neu/ersetzt | ${gleich} schon identisch`
            + (fehlerN ? ` | ${fehlerN} FEHLER` : ""));
        const gen = "SCHWARM-GENESIS.js";
        if (!ns.fileExists(gen, "home")) {
            ns.tprint(` ${gen} liegt auch nach der Wiederherstellung nicht vor — Sicherung unvollstaendig.`);
        } else {
            let pid = 0;
            try { pid = ns.exec(gen, "home"); } catch (e) { pid = 0; }
            ns.tprint(pid > 0 ? ` START  ${gen} laeuft (PID ${pid}). Der Schwarm baut sich neu auf.`
                              : ` ${gen} liess sich nicht starten — von Hand: run ${gen}`);
        }
        ns.tprint("═══════════════════════════════════════════════");
        return;
    }

    ns.tprint("═══════════════════════════════════════════════");
    ns.tprint(` ${tag}SCHWARM-CLEAN — Total-Reiniger${keepSwarm ? " (--keep-swarm)" : ""}`);
    ns.tprint("═══════════════════════════════════════════════");

    // ---------------------------------------------------------------- 1. KILL
    const hosts = scan(ns);
    let killedHome = 0, killedRemote = 0, clearedHosts = 0;
    try {
        for (const p of ns.ps("home")) {
            if (p.filename === self) continue;
            if (!dry) ns.kill(p.pid);
            killedHome++;
        }
    } catch (e) { /* weiter */ }
    for (const host of hosts) {
        if (host === "home") continue;
        try {
            if (!ns.hasRootAccess(host)) continue;
            const n = ns.ps(host).length;
            if (n <= 0) continue;
            if (!dry) ns.killall(host);
            killedRemote += n; clearedHosts++;
        } catch (e) { /* Host überspringen */ }
    }
    ns.tprint(` KILL   home: ${killedHome} Prozess(e) | Netz: ${killedRemote} auf ${clearedHosts} Host(s)`);

    // ---------------------------------------------------------------- 2. PORTS
    //
    // BUGFIX v4.0: hier stand `port <= 25`. Der Schwarm benutzte zu dem
    // Zeitpunkt aber schon Ports bis 34 (Portfolio 26, Liquidation 27, INFO
    // 28-30, CORP 31, GANG 32, HASH 33, Beeinflussung/Auftraege 34). Nach einem
    // "sauberen Neustart" standen auf neun Ports also noch Werte aus dem
    // vorigen Leben — und man sucht den Fehler dann im neuen Code.
    //
    // Die Tabelle endet bei 26 (GO_OUT 23, GO_IN 24, STANEK_OUT 25,
    // STANEK_IN 26; TOPO liegt auf 22). PORT_MAX steht
    // trotzdem auf 40: dieses Werkzeug soll auch Reste aus AELTEREN Staenden
    // wegraeumen (genau dafuer wird es benutzt), und ein leerer Port kostet
    // nichts. Die Obergrenze darf gern zu hoch sein — zu niedrig war sie schon.
    const PORT_MAX = 40;
    let portsCleared = 0;
    for (let port = 1; port <= PORT_MAX; port++) {
        try {
            const h = ns.getPortHandle(port);
            if (!h.empty()) { if (!dry) h.clear(); portsCleared++; }
        } catch (e) { /* überspringen */ }
    }
    ns.tprint(` PORTS  ${portsCleared} belegte(r) Port(s) geleert (1–${PORT_MAX})`);

    // ------------------------------------------------- 2b. SICHERUNG SCHREIBEN
    // UNMITTELBAR vor dem Loeschen, damit sie garantiert den Stand enthaelt, der
    // gleich verschwindet. Genau deshalb muss der Reiniger sie nicht in sich
    // tragen — sie ist immer aktuell, ohne dass jemand etwas nachpflegt.
    if (!dry && !opts["no-backup"]) {
        const sich = schreibeSicherung(ns);
        if (sich.ok) {
            ns.tprint(` SICHER ${sich.n} Skript(e), ${Math.round(sich.bytes / 1024)} KB -> ${SICHERUNG}`
                + (sich.spiegel ? ` | Spiegel auf ${SPIEGEL} ok` : ` | Spiegel FEHLT${sich.warum ? " (" + sich.warum + ")" : ""}`));
        } else {
            ns.tprint(` SICHER FEHLGESCHLAGEN: ${sich.warum}`);
            ns.tprint("        ABBRUCH — ohne Sicherung wird hier nichts geloescht.");
            ns.tprint("        Wenn das gewollt ist: --no-backup.");
            ns.tprint("═══════════════════════════════════════════════");
            return;
        }
    } else if (dry) {
        const s = sammleSkripte(ns);
        ns.tprint(` SICHER ${s.n} Skript(e) wuerden nach ${SICHERUNG} gesichert (+ Spiegel ${SPIEGEL}).`);
        // v5.2: Namen zeigen. Beim ersten Trockenlauf standen dort 116 Dateien,
        // und ich habe die Ursache GERATEN (Temp-Cache) statt sie zu messen —
        // falsch geraten. Diese Zeile beendet das Raten.
        if (s.n) ns.tprint("        " + preview(Object.keys(s.map), 12));
    }

    // ---------------------------------------------------------------- 3. WIPE
    // =========================================================================
    // v5.1 — PROGRAMME UND CHRONIK STEHEN NICHT MEHR IN DER LOESCHLISTE
    // =========================================================================
    // Der Trockenlauf hat es gezeigt: unter den 345 Treffern standen NUKE.exe,
    // BruteSSH.exe, AutoLink.exe — und Formulas.exe. ns.rm loescht Programme
    // tatsaechlich (BaseServer.ts:195 splict sie aus this.programs), das ist
    // kein Anzeigefehler.
    //
    // Formulas.exe kostet 5 Milliarden. Ein Werkzeug, das "aufraeumen" heisst,
    // darf so etwas nicht beilaeufig mitnehmen — und ein Reset braucht es auch
    // nicht: ein Aug-Install loescht die Programme ohnehin selbst
    // (prestigeHomeComputer, ServerHelpers.ts:227) und legt NUKE neu an.
    //
    // Dasselbe fuer die Fehler-Chronik: sie ist Langzeit-Gedaechtnis ueber
    // BitNodes hinweg. Sie einem Testlauf zu opfern waere ein schlechter Tausch.
    //
    // Wer wirklich ALLES weghaben will: --wipe-all.
    const wipeAll = opts["wipe-all"];
    const keepCompanions = new Set(KEEP_COMPANIONS.map(s => s.toLowerCase()));
    const isKeeper = (f) => {
        if (f === self) return true;                       // niemals sich selbst löschen
        if (f === SICHERUNG) return true;                  // die Rueckfahrkarte bleibt IMMER
        if (!wipeAll) {
            const l = String(f).toLowerCase();
            if (l.endsWith(".exe")) return true;           // gekaufte/erstellte Programme
            if (l.indexOf("schwarm-chronik-") >= 0) return true;  // Fehler-Gedaechtnis
        }
        if (!keepSwarm) return false;
        const low = f.toLowerCase();
        if (low.startsWith("schwarm")) return true;        // aktuelle Schwarm-Skripte
        return keepCompanions.has(low);   // Liste derzeit leer, s. KEEP_COMPANIONS
    };

    const all = safeLs(ns, "home");
    const deleted = [];
    let kept = 0;
    for (const f of all) {
        if (isKeeper(f)) { kept++; continue; }
        if (!dry) { try { ns.rm(f, "home"); } catch (e) { /* egal */ } }
        deleted.push(f);
    }
    ns.tprint(` WIPE   ${deleted.length} Datei(en) ${dry ? "würden gelöscht" : "gelöscht"}`
        + ` | ${kept} behalten` + (wipeAll ? " (--wipe-all: auch .exe und Chronik)" : " (Reiniger, Sicherung, .exe, Chronik)"));
    if (deleted.length) ns.tprint("        " + preview(deleted));

    ns.tprint("───────────────────────────────────────────────");
    if (dry) {
        ns.tprint(" DRY-RUN beendet — es wurde NICHTS verändert.");
    } else {
        ns.tprint(keepSwarm
            ? " Fertig. Fremdkram/State entfernt, Schwarm-Skripte behalten."
            : " Fertig. home ist leer (nur der Reiniger liegt noch da).");
        ns.tprint(" Neue Skripte einspielen -> run SCHWARM-GENESIS.js");
        ns.tprint(` Oder alles aus der Sicherung zurueck -> run ${self} --restore`);
    }
    ns.tprint("═══════════════════════════════════════════════");
}

// =============================================================================
// Helfer (self-contained)
// =============================================================================

/** BFS über das normale Netz ab home. Hacknet-Server/-Nodes ausgeschlossen. */
function scan(ns) {
    const seen = new Set(["home"]);
    const q = ["home"];
    try {
        while (q.length) {
            const h = q.shift();
            for (const n of ns.scan(h)) if (!seen.has(n)) { seen.add(n); q.push(n); }
        }
    } catch (e) { /* Teilscan reicht */ }
    return [...seen].filter(h => !h.startsWith("hacknet-server-") && !h.startsWith("hacknet-node-"));
}

function safeLs(ns, host) { try { return ns.ls(host) || []; } catch (e) { return []; } }

/** Kurze, lesbare Vorschau einer Dateiliste. */
function preview(list, max = 15) {
    const shown = list.slice(0, max).join(", ");
    return list.length > max ? `${shown}, … (+${list.length - max})` : shown;
}

function printHelp(ns) {
    ns.tprint([
        "SCHWARM-CLEAN.js — Total-Reiniger für home",
        "",
        "  run SCHWARM-CLEAN.js               Total-Wipe: alles außer diese Datei",
        "  run SCHWARM-CLEAN.js --keep-swarm  nur Fremdkram/State löschen, Schwarm behalten",
        "  run SCHWARM-CLEAN.js --dry-run     nur anzeigen, nichts verändern",
        "",
        "  run SCHWARM-CLEAN.js --temp        NUR /Temp/schwarm-eval-*.js stutzen (auf 40)",
        "  run SCHWARM-CLEAN.js --temp --keep 100    andere Grenze",
        "     --temp wipet NICHTS und killt NICHTS; darf im laufenden Betrieb laufen.",
        "",
        "Löscht im Default auch .cct/.lit/.msg/.cache — gewollt für einen echten Reset.",
        "Erst  --dry-run  laufen lassen, um zu sehen, was getroffen wird.",
    ].join("\n"));
}

export function autocomplete(data, args) {
    return ["--keep-swarm", "--dry-run", "--help"];
}