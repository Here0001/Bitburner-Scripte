/**
 * SCHWARM-ARSENAL.js — v4.3
 *
 * v4.3 — KAEUFE INS HANDLUNGSBUCH (TOR, DarkscapeNavigator, home-RAM),
 *   mit Betrag und Topf fuer den Kassenpruefer. home-RAM liegt in der Engine
 *   im selben Topf "servers" wie BANKs Kaeufe - ohne diese Zeilen meldete
 *   der Pruefer am Anfang jedes Laufs eine nicht protokollierte Ausgabe.
 *
 * v4.2 — SCHALTER GEGEN DIE WIRKLICHKEIT (Abschnitt 4c). Die Schalterdatei
 *   ueberlebt den Prestige, die Voraussetzungen nicht. Nach jedem Reset
 *   schaltet ARSENAL jetzt genau die Daemons ab, deren Bedingung NACHWEISLICH
 *   nicht erfuellt ist (daemonBereit() === false) — Gang ohne Karma,
 *   Bladeburner ohne Kampfwerte, Corp unter dem Softcap. Nur abschalten, nie
 *   einschalten: "kann nicht" ist eine Tatsache, "kann jetzt" eine
 *   Entscheidung. Bedingungsgeprueft statt pauschal, weil ARSENAL auch nach
 *   gewoehnlichen Aug-Installs laeuft, die das Karma NICHT zuruecksetzen.
 * Wird vom Casino nach dem Rauswurf (~10b) automatisch gestartet. Letzter
 * Bootstrap-Schritt vor der Queen.
 *
 * Aufgaben (v4 — bewusst geschrumpft):
 *   1. Eval-Cache aus dem Vorleben wegraeumen (v4.1).
 *   2. Capabilities frisch erkennen (Port-Speicher ist nach dem Casino-Reload leer).
 *   3. TOR-Router + DarkscapeNavigator kaufen (SF4). Der Navigator öffnet den
 *      Darknet-Modus; alle Portöffner erspielt danach SCHWARM-DARKNET.
 *   4. Phase auf SWARM setzen und die Queen starten.
 *
 * ===========================================================================
 * v4.1 — DER EVAL-CACHE UEBERLEBTE DEN RESET
 * ===========================================================================
 * /Temp/ liegt auf home, und home ueberlebt den Aug-Install. Der hash-benannte
 * Eval-Cache (HELPERS:3049) stand danach also weiter da — aus einem Spielstand,
 * den es nicht mehr gibt.
 *
 * WARUM DAS NICHT SCHON ERLEDIGT WAR. casino.js raeumt /Temp vollstaendig
 * (GENESIS:1212 schwarmCleanTemp, Schritt 2.6.3) — aber das Casino laeuft
 * GENAU EINMAL JE BITNODE (GENESIS:1083). Ist man erst einmal rausgeworfen,
 * kehrt casino.js vorher zurueck und die Aufraeumung wird nie erreicht. Bei
 * JEDEM weiteren Aug-Install im selben BitNode blieb der Cache damit liegen.
 * Gemessen im Bestand vom 13.09.: 44 Resets auf 451 DIAG-Laeufe, also rund
 * fuenf am Tag — und nur einer davon mit Casino.
 *
 * ARSENAL ist die richtige Stelle, weil es NACH JEDEM Reset laeuft: entweder
 * vom Casino gestartet oder direkt von GENESIS (GENESIS:742-745).
 *
 * KEIN RUNDUMSCHLAG WIE IM CASINO, UND ZWAR MIT ABSICHT. In /Temp/ liegen zwei
 * Merker, die genau hier gebraucht werden:
 *     /Temp/schwarm-arsenal.lock      — der Doppelstart-Schutz unten
 *     /Temp/schwarm-casino-done.txt   — "Casino lief in diesem Durchlauf schon"
 * Wer hier alles loescht, wirft den Casino-Merker weg und laesst das Casino bei
 * jedem Reset erneut anlaufen. Deshalb ein enges Muster statt eines Besens.
 *
 * NICHT ueber SCHWARM-CLEAN.js --temp geloest: CLEAN loescht im Normalfall
 * ALLES auf home. Ein solches Werkzeug darf nicht automatisch anlaufen — geht
 * das Argument je verloren, ist der Spielstand weg. Die paar Zeilen hier
 * koennen das bauartbedingt nicht.
 *
 * ===========================================================================
 * ÄNDERUNGEN ggü. v3
 * ===========================================================================
 * - HOME-RAM-AUSBAU ENTFERNT -> gehört jetzt der BANK.
 *   ARSENAL baute Home-RAM genau EINMAL aus (mit dem Casino-Geld) und schaute nie
 *   wieder hin. Home-RAM ist aber eine LAUFENDE Investitionsentscheidung, die mit
 *   pserv- und Hacknet-Käufen um denselben Geldbeutel konkurriert. Drei getrennte
 *   Käufer ohne gemeinsame Sicht = keine sinnvolle Priorisierung.
 *   Die BANK vergleicht jetzt fortlaufend $/GB (home vs. pserv) und entscheidet.
 *
 * - TOTER CONFIG-BLOCK ENTFERNT. ARSENAL schrieb schwarm_config.txt mit den Keys
 *   HACKING/HASHNET/SERVERS/SOLVER/GO/TRADER/FACTIONS/GANGS/BLADEBURNER/MAX_RESERVE_RAM.
 *   NIEMAND hat diese Datei je gelesen — die Daemon-Schalter liegen in
 *   schwarm-queen-state.txt (STATE_FILE), HASHNET/SERVERS/FACTIONS existieren als
 *   Daemons gar nicht mehr. Reine Irreführung.
 *
 * - Kein Auto-Tail (Doktrin). ensureSingleInstance/announce aus HELPERS.
 *
 * Fallback ohne SF4: klare Anweisungen ausgeben, Queen trotzdem starten.
 *
 * @param {NS} ns
 */

import {
    detectCapabilities, broadcastCapabilities, evalNs,
    setPhase, PHASE, formatMoney, ensureSingleInstance, announce, markTopoDirty,
    DAEMONS, setDaemonEnabled, sendSpawnWant, daemonBereit, isDaemonEnabled,
    chronik,                 // v4.3: Kaeufe ins Handlungsbuch
} from "SCHWARM-HELPERS.js";

// ===================== KONFIGURATION (bei Bedarf anpassen) =====================
const QUEEN_SCRIPT = "SCHWARM-QUEEN.js";   // EXAKTER Dateiname deiner Queen!

// MUSS identisch zur Konstante in SCHWARM-GENESIS.js sein.
const ARSENAL_LOCK = "/Temp/schwarm-arsenal.lock";

// Erkennt den DarkscapeNavigator in der getDarkwebPrograms()-Liste (case-insensitiv),
// egal ob der In-Game-Name "DarkscapeNavigator.exe", "Darkscape.exe" o.ä. lautet.
const NAVIGATOR_RE = /darkscape|navigator/i;

// v4.1 — Eval-Cache von HELPERS. ZWEI Dateiformen (HELPERS:3049-3051):
//   /Temp/schwarm-eval-<hash>.js            das gecachte Skript
//   /Temp/schwarm-eval-<hash>-<zufall>.txt  die Ausgabe EINES Aufrufs
// Die .txt raeumt HELPERS normal selbst weg (drei ns.rm-Pfade, auch im catch).
// Sie bleibt nur liegen, wenn der Prozess mittendrin stirbt — also genau beim
// --kill-all-scripts des Casinos und beim Aug-Install. Deshalb steht sie mit
// im Muster; CLEANs TEMP_EVAL_RE endet auf \.js$ und faengt sie nicht.
// Das Muster ist bewusst eng: es passt NICHT auf schwarm-arsenal.lock und
// NICHT auf schwarm-casino-done.txt.
const TEMP_EVAL_RE = /^\/?Temp\/schwarm-eval-[0-9a-z]+(?:-[0-9a-z]+)?\.(?:js|txt)$/;
// ==============================================================================

/**
 * Eval-Cache aus dem vorigen Leben wegraeumen. Rueckgabe: {weg, laufend}.
 *
 * Ueberspringt alles, was gerade laeuft. Nach dem Casino laeuft nichts mehr
 * (--kill-all-scripts), auf dem GENESIS-Weg kann GENESIS aber noch mitlaufen
 * und selbst evalNs benutzen — dann darf ihm hier nicht die Datei unter den
 * Fuessen weggezogen werden. Fuer die .js waere das verschmerzbar (HELPERS
 * schreibt sie bei Bedarf neu, HELPERS:3062), fuer eine .txt nicht: auf die
 * wartet ein laufender Aufruf.
 */
function raeumeEvalCache(ns) {
    let weg = 0, laufend = 0;
    try {
        const aktiv = new Set();
        for (const p of ns.ps("home")) aktiv.add(String(p.filename).replace(/^\//, ""));
        for (const f of ns.ls("home", "schwarm-eval-")) {
            if (!TEMP_EVAL_RE.test(f)) continue;
            if (aktiv.has(String(f).replace(/^\//, ""))) { laufend++; continue; }
            try { if (ns.rm(f, "home")) weg++; } catch (e) { /* egal, naechste */ }
        }
    } catch (e) { /* Aufraeumen darf den Bootstrap nie aufhalten */ }
    return { weg, laufend };
}

export async function main(ns) {
    ns.disableLog("ALL");

    // --- Zeitstempel-Lock (gegen quasi-gleichzeitigen Doppelstart) ---
    // Fall: Casino-Reload (save scum) UND GENESIS-Kette feuern ARSENAL fast
    // zeitgleich. Der ps-Schutz unten greift dann nicht (beide sehen sich im
    // selben Tick noch nicht). Lock liegt in /Temp/ -> verschwindet bei
    // Reload/Reset von selbst; GENESIS löscht ihn beim Aufräumen zusätzlich.
    const now = Date.now();
    const LOCK_WINDOW_MS = 15_000;
    try {
        const raw = ns.read(ARSENAL_LOCK);
        if (raw) {
            const stamp = Number(raw);
            if (Number.isFinite(stamp) && (now - stamp) < LOCK_WINDOW_MS) {
                // Frischer Lock -> eine andere ARSENAL-Instanz ist gerade aktiv. Lautlos beenden.
                return;
            }
        }
    } catch (e) { /* kein Lock lesbar -> weiter */ }
    try { ns.write(ARSENAL_LOCK, String(now), "w"); } catch (e) { /* weiter */ }

    // v4: KEIN Auto-Tail (Doktrin).
    if (!ensureSingleInstance(ns)) return;

    setPhase(ns, PHASE.ARSENAL);
    announce(ns, "start", "v4.1 — Temp-Reinigung, TOR + Navigator, dann Queen");

    // --- 1. Eval-Cache aus dem Vorleben wegraeumen ---
    // VOR detectCapabilities, denn das benutzt selbst evalNs und legt damit die
    // ersten Cache-Dateien des NEUEN Durchlaufs an. Andersherum wuerde man die
    // gerade erst erzeugten gleich wieder mitnehmen.
    {
        const t = raeumeEvalCache(ns);
        if (t.weg || t.laufend) {
            ns.print(`Temp-Reinigung: ${t.weg} Eval-Cache-Datei(en) aus dem Vorleben geloescht`
                + (t.laufend ? `, ${t.laufend} in Benutzung gelassen` : ""));
        }
    }

    // --- 2. Capabilities frisch erkennen & broadcasten ---
    let caps = {};
    try {
        caps = await detectCapabilities(ns);
        broadcastCapabilities(ns, caps);
    } catch (e) {
        ns.print("Sensorik-Fehler: " + e);
    }
    ns.print(`Capabilities: SF4=${caps.SF4 || 0} | TIX=${!!caps.TIX} | GANG=${!!caps.GANG} | CORP=${!!caps.CORP} | BLADE=${!!caps.BLADE}`);

    // --- 3. Aufrüsten via Singularity (nur mit SF4) ---
    if (caps.SING) {
        try {
            // 2a. TOR sicherstellen. getDarkwebPrograms() liefert ohne TOR eine leere Liste -> als Wahrheitstest nutzen.
            let programs = await evalNs(ns, "ns.singularity.getDarkwebPrograms()");
            if (!programs || programs.length === 0) {
                ns.print("Kaufe TOR-Router...");
                for (let i = 0; i < 5 && (!programs || programs.length === 0); i++) {
                    await evalNs(ns, "ns.singularity.purchaseTor()");
                    await ns.sleep(500);
                    programs = await evalNs(ns, "ns.singularity.getDarkwebPrograms()");
                }
                // v4.3: TOR kostet fest 200e3 (Constants.ts:44), Topf other.
                // Gekauft heisst: vorher keine Darkweb-Liste, jetzt eine.
                const torDa = !!(programs && programs.length > 0);
                try { chronik(ns, "ARSENAL", "tor", "TOR-Router", torDa ? "gekauft" : "fehlgeschlagen",
                    torDa ? formatMoney(200e3) : "Darkweb-Liste bleibt leer",
                    { betrag: torDa ? 200e3 : 0, topf: "other" }); } catch (e) { }
            }

            // 2b. NUR den DarkscapeNavigator kaufen (öffnet den Darknet-Modus).
            //     Rest der Programme kommt über SCHWARM-DARKNET.js (Roamer/Caches).
            if (programs && programs.length > 0) {
                ns.print("TOR aktiv. Beschaffe DarkscapeNavigator (Darknet-Zugang)...");
                const navName = programs.find(p => NAVIGATOR_RE.test(p));
                if (!navName) {
                    ns.print("  WARNUNG: DarkscapeNavigator nicht im Darkweb gefunden (Name geändert?). Übersprungen.");
                } else if (ns.fileExists(navName, "home")) {
                    ns.print(`  ${navName}: bereits vorhanden — Darknet-Modus sollte offen sein.`);
                } else {
                    const cost = await evalNs(ns, `ns.singularity.getDarkwebProgramCost(${JSON.stringify(navName)})`);
                    if (cost === null) {
                        ns.print(`  ${navName}: Kostenabfrage fehlgeschlagen (RAM?).`);
                    } else if (cost <= 0) {
                        ns.print(`  ${navName}: nicht käuflich (Code ${cost}).`);
                    } else if (ns.getServerMoneyAvailable("home") < cost) {
                        ns.print(`  ${navName}: zu teuer (${formatMoney(cost)}). Später erneut versuchen.`);
                    } else {
                        const ok = await evalNs(ns, `ns.singularity.purchaseProgram(${JSON.stringify(navName)})`);
                        try { chronik(ns, "ARSENAL", "programm", navName, ok === true ? "gekauft" : "fehlgeschlagen",
                            formatMoney(cost), { betrag: ok === true ? cost : 0, topf: "other" }); } catch (e) { }
                        ns.print(`  ${navName}: ${ok === true ? "gekauft — Darknet-Modus geöffnet" : "fehlgeschlagen"} (${formatMoney(cost)})`);
                    }
                }
                ns.print("Portöffner & übrige Programme werden über den Darknet-Modus erspielt (SCHWARM-DARKNET).");
            } else {
                ns.print("WARNUNG: TOR-Router konnte nicht aktiviert werden. Überspringe Navigator-Kauf.");
            }

            // 3. HOME-RAM: nur der NOTWENDIGE Mindestausbau (v4).
            //    Der laufende Ausbau gehört der BANK (ROI gegen pserv/Hacknet).
            //    ABER: Henne-Ei — passt die Queen nicht auf home, startet sie nie,
            //    also läuft auch die BANK nie an, die den Ausbau übernehmen soll.
            //    Deshalb hier genau so weit ausbauen, dass der Kern sicher passt.
            const HOME_MIN_GB = 64;   // Queen + BANK + Dashboard + Luft
            let upgrades = 0;
            for (let i = 0; i < 12; i++) {
                if (ns.getServerMaxRam("home") >= HOME_MIN_GB) break;
                const cost = await evalNs(ns, "ns.singularity.getUpgradeHomeRamCost()");
                if (cost === null || !isFinite(cost) || cost <= 0) break;
                if (ns.getServerMoneyAvailable("home") < cost) break;
                const ok = await evalNs(ns, "ns.singularity.upgradeHomeRam()");
                // v4.3: Topf servers - derselbe, in den BANK pserv und home bucht.
                try { chronik(ns, "ARSENAL", "home-ram", "home", ok === true ? "gekauft" : "fehlgeschlagen",
                    formatMoney(cost), { betrag: ok === true ? cost : 0, topf: "servers" }); } catch (e) { }
                if (ok !== true) break;
                upgrades++;
            }
            if (upgrades > 0) {
                markTopoDirty(ns, "home-ram");
                ns.print(`Home-RAM ${upgrades}x ausgebaut -> ${ns.getServerMaxRam("home")} GB (Mindestmaß für die Queen). ` +
                         `Weiterer Ausbau: BANK. Kapital: ${formatMoney(ns.getServerMoneyAvailable("home"))}`);
            } else {
                ns.print(`Home-RAM ${ns.getServerMaxRam("home")} GB — reicht. Weiterer Ausbau: BANK (ROI-gesteuert).`);
            }

        } catch (e) {
            ns.print("Aufrüst-Fehler: " + e);
        }
    } else {
        // Fallback ohne SF4: manuelle Anweisung (nur TOR + Navigator; Rest kommt über Darknet).
        ns.tprint("HINWEIS: Kein SF4 (Singularity) — ARSENAL kann nicht automatisch kaufen.");
        ns.tprint("  Bitte manuell erledigen: 1) TOR-Router im Stadt-Menü kaufen.");
        ns.tprint("  2) DarkscapeNavigator kaufen (günstiger in Chongqing, Shadowed Walkway) — öffnet den Darknet-Modus.");
        ns.tprint("  3) Portöffner NICHT kaufen — die holt SCHWARM-DARKNET über den Darknet-Modus.");
        ns.tprint("  4) Optional Home-RAM ausbauen (ohne SF4 kann die BANK das nicht automatisch).");
    }

    // --- 4. ENTFERNT (v4): schwarm_config.txt. Toter Block — niemand las die Datei.
    //     Die Daemon-Schalter leben in schwarm-queen-state.txt (HELPERS.STATE_FILE);
    //     die Keys HASHNET/SERVERS/SOLVER/FACTIONS existieren als Daemons nicht mehr.

    // --- 4b. STANEK anfordern, BEVOR die Queen loslaeuft (v4.1) ---
    //
    // canAcceptStaneksGift (CotMG/Helper.tsx) scheitert, sobald EINE
    // Augmentierung ausser NeuroFlux gekauft oder installiert ist — und zwar
    // fuer den ganzen Durchlauf, nicht bis zum naechsten Reset. Zwischen
    // Prestige und dem ersten Aug-Kauf der BANK liegt also das einzige Fenster.
    //
    // ARSENAL ist der richtige Ort dafuer: es laeuft nach dem Casino und
    // unmittelbar vor der Queen, also frueh genug, aber spaet genug, dass home
    // schon ausgebaut ist (die Ladungsstaerke haengt an der Threadzahl).
    //
    // Der Schalter wird nur GESETZT, nicht gestartet — deployt wird wie immer
    // von der Queen, damit es genau einen Deploy-Pfad gibt. Ohne SF13 meldet
    // der Payload sauber "gesperrt" und BANK gibt die Augs sofort wieder frei.
    if (DAEMONS.STANEK) {
        try {
            setDaemonEnabled(ns, "STANEK", 1);
            sendSpawnWant(ns, "STANEK");
            ns.tprint("INFO  [ARSENAL] STANEK angefordert — laeuft vor dem ersten Aug-Kauf.");
        } catch (e) { ns.print("STANEK-Anforderung: " + e); }
    }

    // --- 4c. SCHALTER GEGEN DIE WIRKLICHKEIT PRUEFEN (v4.2) -----------------
    //
    // schwarm-queen-state.txt liegt auf home und ueberlebt jeden Prestige. Die
    // VORAUSSETZUNGEN ueberleben ihn nicht: prestigeSourceFile setzt karma auf
    // 0, die Kampfwerte fallen zurueck, die Corp ist geloescht. Ein von Hand
    // gesetztes "GANGS: an" aus dem letzten Durchlauf stand damit in der neuen
    // BitNode auf einer Null — und ein "aus" regierte dort still weiter, obwohl
    // es nie fuer diese Node gemeint war.
    //
    // ARSENAL ist die richtige Stelle, weil es NACH JEDEM Reset laeuft und VOR
    // der Queen: der erste Takt sieht damit schon einen ehrlichen Schalter.
    //
    // NUR ABSCHALTEN, NIEMALS EINSCHALTEN. Das ist keine Vorsicht, sondern die
    // Aufgabenteilung: "kann nicht laufen" ist eine TATSACHE und darf sofort
    // wirken. "kann jetzt laufen" ist eine ENTSCHEIDUNG und gehoert dem
    // Menschen bzw. der Selbstverwaltung der Queen (2 h ohne Eingabe). Wer hier
    // auch einschaltete, wuerde jede bewusste Abschaltung bei jedem Aug-Install
    // ueberfahren.
    //
    // UND DESHALB BEDINGUNGSGEPRUEFT STATT PAUSCHAL: ARSENAL laeuft auch nach
    // einem gewoehnlichen Aug-Install, und Karma ueberlebt den (nur
    // prestigeSourceFile nullt es). Ein Rundumschlag wuerde dort eine laufende
    // Gang abschalten, die voellig in Ordnung ist.
    {
        // Die Spielerwerte ueber evalNs, nicht ueber ns.getPlayer(): so traegt
        // das Wegwerf-Skript die 0.5 GB und nicht ARSENAL selbst. null = nicht
        // bekommen -> daemonBereit liefert dann "unbekannt" und wir fassen
        // nichts an, statt auf einer Vermutung abzuschalten.
        let sp = null;
        try {
            const r = await evalNs(ns,
                `(() => { const p = ns.getPlayer(); let k = 0;`
                + ` try { k = ns.heart.break(); } catch (e) {}`
                + ` return { skills: p.skills, karma: k }; })()`);
            if (r && r.skills) sp = r;
        } catch (e) { sp = null; }

        const aus = [];
        for (const key of Object.keys(DAEMONS)) {
            let bereit;
            try { bereit = daemonBereit(ns, key, sp); } catch (e) { continue; }
            if (bereit !== false) continue;                 // true oder null -> in Ruhe lassen
            try {
                if (!isDaemonEnabled(ns, key)) continue;    // steht schon aus
                setDaemonEnabled(ns, key, 0);
                aus.push(key);
            } catch (e) { /* naechster */ }
        }
        if (aus.length) {
            ns.tprint(`INFO  [ARSENAL] Voraussetzung (noch) nicht erfuellt, abgeschaltet: ${aus.join(", ")}.`);
            try { announce(ns, "start", `ARSENAL: ${aus.join(", ")} abgeschaltet — Voraussetzung nicht erfuellt.`); } catch (e) { /* Beiwerk */ }
        }
    }

    // --- 5. Phase SWARM & Queen starten ---
    setPhase(ns, PHASE.SWARM);
    if (!ns.fileExists(QUEEN_SCRIPT, "home")) {
        ns.tprint(`FEHLER: '${QUEEN_SCRIPT}' fehlt auf home. Bitte Queen ablegen oder QUEEN_SCRIPT in ARSENAL anpassen.`);
        return;
    }
    const pid = ns.run(QUEEN_SCRIPT, 1);
    if (pid) ns.print(`Queen gestartet (PID ${pid}). Der Schwarm ist autonom. ARSENAL endet.`);
    else ns.tprint(`FEHLER: Queen-Start fehlgeschlagen (RAM zu knapp?). Home-RAM prüfen und Queen manuell starten.`);
}