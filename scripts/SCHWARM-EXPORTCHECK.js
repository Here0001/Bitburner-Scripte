/**
 * SCHWARM-EXPORTCHECK.js — v1.0
 *
 * Einmal-Skript. Es aendert NICHTS. Es liest nur und zeigt an:
 *
 *   1. WELCHE Exportrouten es tatsaechlich gibt (alle Divisionen, alle Staedte).
 *   2. WELCHE es geben MUESSTE (aus den Branchendaten der Engine abgeleitet).
 *   3. Was davon FEHLT.
 *
 * Hintergrund, warum das Nachschauen im Spiel taeuscht:
 * Eine Route wird beim ERZEUGER gespeichert, nicht beim Empfaenger
 * (Corporation/Actions.ts:571 legt sie auf material.exports der QUELLE ab).
 * Wer bei Agriculture nach einem Export fuer Water sucht, sucht an der
 * falschen Stelle — dort steht der Zufluss im Tooltip unter "Import:".
 * Der Export steht bei "Water Utilities".
 *
 * Aufruf:  run SCHWARM-EXPORTCHECK.js
 *
 * @param {NS} ns
 */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.ui.openTail();
    ns.clearLog();

    // Eigene Zahlenformatierung statt ns.format.number: dann haengt dieses
    // Skript an KEINER Formatier-API und ueberlebt den naechsten Umbenenner.
    const z = (n) => {
        const v = Number(n) || 0, a = Math.abs(v);
        if (a >= 1e12) return (v / 1e12).toFixed(2) + "t";
        if (a >= 1e9)  return (v / 1e9).toFixed(2) + "b";
        if (a >= 1e6)  return (v / 1e6).toFixed(2) + "m";
        if (a >= 1e3)  return (v / 1e3).toFixed(2) + "k";
        return v.toFixed(3);
    };

    const c = ns.corporation;
    if (!c.hasCorporation()) { ns.print("Keine Corporation."); return; }

    const MATS = ["Water", "Ore", "Minerals", "Food", "Plants", "Metal",
                  "Hardware", "Chemicals", "Drugs", "Robots", "AI Cores", "Real Estate"];
    const CITIES = ["Sector-12", "Aevum", "Chongqing", "New Tokyo", "Ishima", "Volhaven"];

    const corp = c.getCorporation();
    const divs = corp.divisions.slice();

    // --- 0) Unlock pruefen. Ohne "Export" wirft jeder Aufruf. ---
    let exportFrei = false;
    try { exportFrei = c.hasUnlock("Export"); } catch (e) { exportFrei = false; }
    ns.print("=".repeat(64));
    ns.print("EXPORT-PRUEFUNG  —  " + divs.length + " Division(en)");
    ns.print("Unlock \"Export\": " + (exportFrei ? "GEKAUFT" : "FEHLT — ohne das geht gar nichts!"));
    ns.print("=".repeat(64));

    // --- 1) Branchendaten sammeln: wer erzeugt was, wer braucht was ---
    const info = {};
    for (const d of divs) {
        let typ = "?", data = null;
        try { typ = c.getDivision(d).type; } catch (e) { /* egal */ }
        try { data = c.getIndustryData(typ); } catch (e) { /* egal */ }
        info[d] = {
            typ,
            erzeugt: (data && data.producedMaterials) ? data.producedMaterials.slice() : [],
            braucht: (data && data.requiredMaterials) ? Object.keys(data.requiredMaterials) : [],
            staedte: [],
        };
        for (const city of CITIES) {
            try { if (c.hasWarehouse(d, city)) info[d].staedte.push(city); } catch (e) { /* egal */ }
        }
    }

    ns.print("");
    ns.print("--- 1) WAS JEDE DIVISION ERZEUGT UND BRAUCHT ---");
    for (const d of divs) {
        const i = info[d];
        ns.print(`  ${d} (${i.typ}) — ${i.staedte.length} Lager`);
        ns.print(`      erzeugt: ${i.erzeugt.join(", ") || "—"}`);
        ns.print(`      braucht: ${i.braucht.join(", ") || "—"}`);
    }

    // --- 2) TATSAECHLICHE Routen auslesen ---
    // getMaterial(...).exports ist ein Array {division, city, amount}
    // (NetscriptFunctions/Corporation.ts:236 klont material.exports).
    const echt = [];   // {src, srcCity, dst, dstCity, mat, amount}
    let gelesen = 0, leseFehler = 0;
    for (const d of divs) {
        for (const city of info[d].staedte) {
            for (const mat of MATS) {
                let m = null;
                try { m = c.getMaterial(d, city, mat); gelesen++; }
                catch (e) { leseFehler++; continue; }
                if (!m || !Array.isArray(m.exports)) continue;
                for (const e of m.exports) {
                    echt.push({ src: d, srcCity: city, dst: e.division, dstCity: e.city,
                                mat, amount: String(e.amount) });
                }
            }
        }
    }

    ns.print("");
    ns.print("--- 2) TATSAECHLICH VORHANDENE ROUTEN ---");
    ns.print(`    (${gelesen} Materialposten gelesen, ${leseFehler} nicht lesbar)`);
    if (echt.length === 0) {
        ns.print("    KEINE EINZIGE ROUTE. Die Verkabelung existiert nicht.");
    } else {
        // Nach Route zusammenfassen, Staedte zaehlen — sonst 6 Zeilen je Route.
        const grp = new Map();
        for (const r of echt) {
            const k = `${r.src} -> ${r.dst} (${r.mat})  Menge ${r.amount}`;
            grp.set(k, (grp.get(k) || 0) + 1);
        }
        for (const [k, n] of grp) ns.print(`    ${k}   [${n} Stadt/Staedte]`);
        ns.print(`    Summe: ${echt.length} Einzelrouten.`);
    }

    // --- 3) SOLL-Routen ableiten und vergleichen ---
    const soll = [];
    for (const src of divs) {
        for (const mat of info[src].erzeugt) {
            for (const dst of divs) {
                if (dst === src) continue;
                if (!info[dst].braucht.includes(mat)) continue;
                soll.push({ src, dst, mat });
            }
        }
    }
    const daKey = new Set(echt.map(r => `${r.src}|${r.dst}|${r.mat}|${r.srcCity}`));

    ns.print("");
    ns.print("--- 3) SOLL-ROUTEN UND WAS FEHLT ---");
    ns.print(`    ${soll.length} sinnvolle Route(n) aus den Branchendaten.`);
    let fehlt = 0;
    for (const s of soll) {
        const staedte = info[s.src].staedte.filter(city => !daKey.has(`${s.src}|${s.dst}|${s.mat}|${city}`));
        if (staedte.length === 0) {
            ns.print(`    OK      ${s.src} -> ${s.dst} (${s.mat})`);
        } else {
            fehlt++;
            ns.print(`    FEHLT   ${s.src} -> ${s.dst} (${s.mat})   in: ${staedte.join(", ")}`);
        }
    }

    // --- 4) Zufluss/Abfluss der EMPFAENGER: laeuft ein Import wirklich? ---
    ns.print("");
    ns.print("--- 4) LAEUFT BEI DEN EMPFAENGERN WIRKLICH ETWAS AN? ---");
    ns.print("    (Sector-12 als Stichprobe; importAmount > 0 heisst: es fliesst.)");
    for (const d of divs) {
        if (info[d].braucht.length === 0) continue;
        if (!info[d].staedte.includes("Sector-12")) continue;
        const teile = [];
        for (const mat of info[d].braucht) {
            let m = null;
            try { m = c.getMaterial(d, "Sector-12", mat); } catch (e) { continue; }
            if (!m) continue;
            teile.push(`${mat}: Lager ${z(m.stored)}`
                + `, Import ${z(m.importAmount || 0)}/s`
                + `, Kauf ${z(m.buyAmount || 0)}/s`);
        }
        if (teile.length) ns.print(`    ${d}: ` + teile.join(" | "));
    }

    ns.print("");
    ns.print("=".repeat(64));
    ns.print(echt.length === 0
        ? "ERGEBNIS: Keine Route vorhanden. Der Export ist nie angelegt worden."
        : (fehlt === 0 ? "ERGEBNIS: Alle sinnvollen Routen stehen."
                       : `ERGEBNIS: ${fehlt} von ${soll.length} Routen fehlen.`));
    ns.print("=".repeat(64));
}
