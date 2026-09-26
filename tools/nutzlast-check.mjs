// =============================================================================
// nutzlast-check.mjs — Syntaxpruefung der NUTZLASTEN (25.09.2026)
// =============================================================================
// WOZU. deploy.py Stufe 3 prueft jede Datei mit node --check. Fuer PAYLOADS,
// DARKNET und GENESIS heisst das nur: die aeussere Datei parst. Die Nutzlasten
// darin sind Zeichenketten (const SRC_X = `...`) - ein Tippfehler dort parst
// aussen einwandfrei und faellt erst auf, wenn die QUEEN den Daemon
// materialisiert und er still nicht startet.
//
// WIE. Jede Nutzlast so herstellen, wie das Spiel es tut:
//   1. Vorlage "kochen" (Escape-Sequenzen wie im echten Template-Literal),
//   2. decodePayload: __SCHWARM_BT__ -> Backtick, __SCHWARM_DC__ -> Dollar-Klammer,
//   3. injectPorts: Marke /*__PORTS__*/ -> const SCHWARM_PORTS = {};
// und das Ergebnis als ES-Modul mit node --check parsen. Keine Ausfuehrung.
//
// AUFRUF (auf dem Pi):  node nutzlast-check.mjs DATEI [DATEI ...]
// Ausgabe je Nutzlast eine Zeile; Rueckgabe 0 = alle sauber, 1 = Fehler.
// =============================================================================
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";

const BT = String.fromCharCode(96);
const BS = String.fromCharCode(92);
const SENT_BT = "__SCHWARM_BT__";
const SENT_DC = "__SCHWARM_DC__";
const MARKE = "/*__PORTS__*/";

function vorlagen(text) {
    const aus = [];
    const re = /^const (SRC_\w+)\s*=\s*/gm;
    let m;
    while ((m = re.exec(text)) !== null) {
        let i = m.index + m[0].length;
        if (text[i] !== BT) continue;
        const start = ++i;
        while (i < text.length && text[i] !== BT) i += (text[i] === BS) ? 2 : 1;
        if (i >= text.length) { aus.push({ name: m[1], fehler: "wird nie geschlossen" }); break; }
        aus.push({ name: m[1], roh: text.slice(start, i) });
        re.lastIndex = i + 1;
    }
    return aus;
}

let fehler = 0, geprueft = 0;
const tmp = mkdtempSync(join(tmpdir(), "nutzlast-"));
try {
    for (const datei of process.argv.slice(2)) {
        const liste = vorlagen(readFileSync(datei, "utf8"));
        for (const v of liste) {
            const wo = basename(datei) + " / " + v.name;
            if (v.fehler) { fehler++; console.log("SYNTAXFEHLER " + wo + ": " + v.fehler); continue; }
            // Ohne Platzhalter ist das Template reiner Text: Kochen verarbeitet
            // dann nur Escape-Sequenzen und fuehrt nichts aus. Eine rohe
            // Dollar-Klammer waere ein Platzhalter (und im Spiel ohnehin ein
            // Fehler, PRUEFER Abschnitt 3) - dann NICHT kochen.
            if (v.roh.includes("$" + "{")) {
                fehler++; console.log("SYNTAXFEHLER " + wo + ": rohe Dollar-Klammer in der Vorlage");
                continue;
            }
            let src;
            try {
                src = new Function("return " + BT + v.roh + BT + ";")();
            } catch (e) {
                fehler++; console.log("SYNTAXFEHLER " + wo + ": Vorlage nicht herstellbar: " + e.message);
                continue;
            }
            src = src.split(SENT_BT).join(BT).split(SENT_DC).join("$" + "{")
                     .split(MARKE).join("const SCHWARM_PORTS = {};");
            const f = join(tmp, v.name + ".mjs");
            writeFileSync(f, src);
            const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
            geprueft++;
            if (r.status !== 0) {
                fehler++;
                const z = (r.stderr || "").split("\n").filter(x => x.trim()).slice(0, 4).join(" | ");
                console.log("SYNTAXFEHLER " + wo + ": " + z);
            } else {
                console.log("ok  " + wo);
            }
        }
    }
} finally {
    rmSync(tmp, { recursive: true, force: true });
}
console.log(geprueft + " Nutzlast(en) geparst, " + fehler + " Fehler.");
process.exit(fehler ? 1 : 0);
