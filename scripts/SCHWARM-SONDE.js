/**
 * SCHWARM-SONDE.js — v1.0
 *
 * v1.0 — LESENDE API-SONDE (Contract-Test im laufenden Spiel).
 *   Klopft die Netscript-API im Betrieb ab und prueft INVARIANTEN, die immer
 *   gelten muessen. Findet sie einen Verstoss, ist das entweder eine Engine-
 *   Macke ODER ein kaputter Spielzustand (den SCHWARM erzeugt hat) — beides
 *   will man wissen, bevor eine Strategie darauf aufbaut.
 *
 *   GRUNDREGEL: NUR LESEN. Kein hack/grow/weaken, kein Kauf, kein Schreiben in
 *   den Spielzustand. Die Sonde darf nie etwas kaputt machen, das sie sucht.
 *
 *   Geprueft wird pro Runde: der Spieler + ein rotierendes Fenster von Servern
 *   (ueber die Runden also alle). Befunde wandern nach SCHWARM-SONDE-BEFUND.txt
 *   (auf home), gedeckelt, mit Zeitstempel. Eine Herzschlag-Zeile beweist, dass
 *   die Sonde laeuft, auch wenn sie nichts findet.
 *
 *   Bewusst genuegsam: liest die Server einmal via scan, dann pro Runde nur ein
 *   Teilfenster — so bleibt die Laufzeit kurz und stoert SCHWARM nicht.
 */

const CFG = {
  RUNDE_MS: 60_000,      // Pause zwischen Runden
  FENSTER: 12,           // so viele Server pro Runde pruefen (rotierend)
  BEFUND_DATEI: "SCHWARM-SONDE-BEFUND.txt",
  MAX_BEFUNDE: 300,      // Datei-Deckel (aelteste fliegen raus)
  EPS: 1e-6,             // Toleranz fuer Gleitkomma-Vergleiche
};

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.print("SCHWARM-SONDE v1.0 — nur lesend, prueft API-Invarianten.");

  // ---- Netzwerk einmal einlesen (alle erreichbaren Hosts) ------------------
  const alle = netzKarte(ns);
  ns.print(`Sonde kennt ${alle.length} Server. Fenster ${CFG.FENSTER}/Runde.`);

  let start = 0;
  let runde = 0;

  while (true) {
    runde++;
    const befunde = [];
    const merke = (wo, text) => befunde.push(`[${wo}] ${text}`);

    // ---- 1. Spieler-Invarianten -------------------------------------------
    try {
      const p = ns.getPlayer();
      pruef(merke, "player", Number.isFinite(p.money), `money nicht endlich: ${p.money}`);
      pruef(merke, "player", p.money >= -CFG.EPS, `money negativ: ${p.money}`);
      if (p.hp) {
        pruef(merke, "player", p.hp.current <= p.hp.max + CFG.EPS, `hp.current>${p.hp.max}: ${p.hp.current}`);
        pruef(merke, "player", p.hp.current >= -CFG.EPS, `hp.current negativ: ${p.hp.current}`);
      }
      if (p.skills) for (const [k, v] of Object.entries(p.skills)) {
        pruef(merke, "player", Number.isFinite(v) && v >= 0, `skill ${k} unplausibel: ${v}`);
      }
    } catch (e) { merke("player", `getPlayer WARF: ${e}`); }

    // ---- 2. Server-Fenster (rotierend) ------------------------------------
    for (let i = 0; i < CFG.FENSTER && i < alle.length; i++) {
      const host = alle[(start + i) % alle.length];
      try {
        const s = ns.getServer(host);
        // Zahlenfelder endlich?
        for (const f of ["moneyAvailable", "moneyMax", "hackDifficulty", "minDifficulty",
                         "maxRam", "ramUsed", "requiredHackingSkill", "serverGrowth"]) {
          if (f in s) pruef(merke, host, Number.isFinite(s[f]), `${f} nicht endlich: ${s[f]}`);
        }
        // Geld: 0 <= verfuegbar <= maximum
        if (Number.isFinite(s.moneyMax) && s.moneyMax > 0) {
          pruef(merke, host, s.moneyAvailable >= -CFG.EPS, `moneyAvailable negativ: ${s.moneyAvailable}`);
          pruef(merke, host, s.moneyAvailable <= s.moneyMax + 1, `moneyAvailable>moneyMax: ${s.moneyAvailable}>${s.moneyMax}`);
        }
        // Sicherheit: aktuell >= Minimum
        if (Number.isFinite(s.minDifficulty)) {
          pruef(merke, host, s.hackDifficulty >= s.minDifficulty - CFG.EPS,
                `hackDifficulty<min: ${s.hackDifficulty}<${s.minDifficulty}`);
        }
        // RAM: 0 <= genutzt <= max
        pruef(merke, host, s.ramUsed >= -CFG.EPS && s.ramUsed <= s.maxRam + CFG.EPS,
              `ramUsed ausserhalb [0,${s.maxRam}]: ${s.ramUsed}`);

        // ---- 3. Vertrag: Kurz-Getter == volles Objekt ---------------------
        const mAvail = ns.getServerMoneyAvailable(host);
        pruef(merke, host, naheGleich(mAvail, s.moneyAvailable),
              `getServerMoneyAvailable != Server.moneyAvailable: ${mAvail} vs ${s.moneyAvailable}`);
        const maxRam = ns.getServerMaxRam(host);
        pruef(merke, host, naheGleich(maxRam, s.maxRam),
              `getServerMaxRam != Server.maxRam: ${maxRam} vs ${s.maxRam}`);
        const mMax = ns.getServerMaxMoney(host);
        pruef(merke, host, naheGleich(mMax, s.moneyMax),
              `getServerMaxMoney != Server.moneyMax: ${mMax} vs ${s.moneyMax}`);
      } catch (e) {
        merke(host, `getServer/Getter WARF: ${e}`);
      }
    }
    start = (start + CFG.FENSTER) % alle.length;

    // ---- 4. Befunde + Herzschlag rausschreiben ----------------------------
    const stempel = new Date().toISOString().replace("T", " ").slice(0, 19);
    let inhalt = safeRead(ns, CFG.BEFUND_DATEI);
    let zeilen = inhalt ? inhalt.split("\n").filter(z => z.length) : [];

    if (befunde.length) {
      for (const b of befunde) zeilen.push(`${stempel}  ${b}`);
      ns.print(`Runde ${runde}: ${befunde.length} BEFUND(E) — siehe ${CFG.BEFUND_DATEI}`);
    } else {
      ns.print(`Runde ${runde}: sauber (Fenster ab ${start}).`);
    }
    // Herzschlag-Zeile immer als erste Zeile ersetzen
    zeilen = zeilen.filter(z => !z.includes("HERZSCHLAG"));
    zeilen.unshift(`${stempel}  HERZSCHLAG  Runde=${runde} Server=${alle.length} Befunde_gesamt=${zeilen.length}`);
    if (zeilen.length > CFG.MAX_BEFUNDE) zeilen = zeilen.slice(0, CFG.MAX_BEFUNDE);
    ns.write(CFG.BEFUND_DATEI, zeilen.join("\n") + "\n", "w");

    await ns.sleep(CFG.RUNDE_MS);
  }
}

/** rekursiver Scan -> Liste aller erreichbaren Hosts (inkl. home) */
function netzKarte(ns) {
  const gesehen = new Set(["home"]);
  const rand = ["home"];
  while (rand.length) {
    const h = rand.pop();
    for (const n of ns.scan(h)) if (!gesehen.has(n)) { gesehen.add(n); rand.push(n); }
  }
  return [...gesehen];
}

function pruef(merke, wo, bedingung, meldung) { if (!bedingung) merke(wo, meldung); }
function naheGleich(a, b) { return Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * 1e-9); }
function safeRead(ns, datei) { try { return ns.read(datei); } catch { return ""; } }
