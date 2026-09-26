/**
 * schwarm-install.js - downloads every SCHWARM script into your home server.
 *
 * In the Bitburner terminal:
 *   wget https://raw.githubusercontent.com/Here0001/Bitburner-Scripte/main/schwarm-install.js schwarm-install.js
 *   run schwarm-install.js
 *
 * Then start the swarm with:
 *   run SCHWARM-GENESIS.js
 *
 * Running the installer again updates all files to the newest version.
 * It only writes SCHWARM-*.js files and never deletes anything.
 *
 * @param {NS} ns
 */
const BASE_ROOT = "https://raw.githubusercontent.com/Here0001/Bitburner-Scripte/main/";
const BASE = BASE_ROOT + "scripts/";
const FILES = [
    "SCHWARM-HELPERS.js",     // shared library - everything imports it
    "SCHWARM-GENESIS.js",     // start here: bootstrap, casino once per reset
    "SCHWARM-ARSENAL.js",     // TOR, Darknet access, minimum home RAM, starts the Queen
    "SCHWARM-QUEEN.js",       // starts and supervises all daemons
    "SCHWARM-PAYLOADS.js",    // embedded daemons (go, trader, gang, bladeburner, ...)
    "SCHWARM-DISPATCHER.js",  // hacking: spreads hack/grow/weaken over all servers
    "SCHWARM-BANK.js",        // money: servers, home, hacknet, augs, big goals
    "SCHWARM-INFO.js",        // expensive game data, fetched once for everyone
    "SCHWARM-WORK.js",        // factions, companies, reputation, donations
    "SCHWARM-INFIL.js",       // infiltration
    "SCHWARM-CORP.js",        // corporation
    "SCHWARM-DARKNET.js",     // the v3.0 Darknet: exploring, caches, port openers
    "SCHWARM-DASHBOARD.js",   // overview in the game UI
    "SCHWARM-DIAG.js",        // 10-minute diagnosis reports
    "SCHWARM-CLEAN.js",       // stop everything cleanly
    "SCHWARM-SONDE.js",       // optional: read-only API probe
    "SCHWARM-EXPORTCHECK.js", // optional: read-only check of corporation exports
];

export async function main(ns) {
    if (ns.getHostname() !== "home") {
        ns.tprint("Please run the installer on home.");
        return;
    }
    let ok = 0;
    const failed = [];
    for (const f of FILES) {
        // The query string avoids stale copies from a cache between you and GitHub.
        const good = await ns.wget(BASE + f + "?t=" + Date.now(), f, "home");
        if (good) ok++;
        else failed.push(f);
    }
    // The plan file is YOURS: only fetch the example if you have none yet.
    const PLAN = "schwarm-plan.txt";
    if (!ns.fileExists(PLAN, "home")) {
        const plan = await ns.wget(BASE_ROOT + PLAN + "?t=" + Date.now(), PLAN, "home");
        ns.tprint(plan ? "Example plan written: " + PLAN + " (never ends a BitNode - edit it later)."
                       : "Could not download the example " + PLAN + " - the swarm runs without it.");
    } else {
        ns.tprint("Kept your existing " + PLAN + ".");
    }
    ns.tprint("SCHWARM installer: " + ok + "/" + FILES.length + " files downloaded.");
    if (failed.length) {
        ns.tprint("FAILED: " + failed.join(", ") + " - check your connection and run the installer again.");
        return;
    }
    ns.tprint("Done. Start the swarm with:  run SCHWARM-GENESIS.js");
}
