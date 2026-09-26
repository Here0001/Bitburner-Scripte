# SCHWARM — a self-driving script suite for Bitburner

[![check](https://github.com/Here0001/Bitburner-Scripte/actions/workflows/check.yml/badge.svg)](https://github.com/Here0001/Bitburner-Scripte/actions/workflows/check.yml)

**SCHWARM** (German for *swarm*) plays [Bitburner](https://github.com/bitburner-official/bitburner-src) largely by itself.
It roots and hacks the whole network, manages your money, buys and installs augmentations, and runs gangs,
corporations, Bladeburner, the stock market, the Darknet, IPvGO and Stanek's Gift. It can also end a BitNode for
you, but only after you explicitly allow it.

## First: play Bitburner

If you have not played it yet: **Bitburner is a wonderful programming game**, and it is free and open source.
Everything here exists because the game is so much fun to automate.

- Play in the browser: <https://bitburner-official.github.io/>
- Play on Steam: <https://store.steampowered.com/app/1812820/Bitburner/>
- Source code and community: <https://github.com/bitburner-official/bitburner-src> · Discord: <https://discord.gg/TFc3hKD>

A huge thank-you to the Bitburner developers and contributors.

## Installation

In the Bitburner terminal, on `home`:

```
wget https://raw.githubusercontent.com/Here0001/Bitburner-Scripte/main/schwarm-install.js schwarm-install.js
run schwarm-install.js
```

The installer downloads all `SCHWARM-*.js` scripts to `home`. It also writes an example `schwarm-plan.txt`, but
only if you do not have one yet. Run it again later to update. The swarm notices new files and restarts the
changed parts by itself.

## First steps

```
run SCHWARM-GENESIS.js
```

That is the only command you need. GENESIS earns start money, runs the casino once per augmentation cycle,
buys the basics and starts the **Queen**. The Queen then starts and supervises everything else. Its **DASHBOARD**
window has one button per part; click a button to switch that part on or off.

Things worth knowing before you start:

- **GENESIS kills all other running scripts**, on `home` and on every server it can reach. Your own scripts too.
- **The casino step reloads the game** whenever it loses. Do not click around in the game while it plays.
- **BANK, WORK and several other parts are OFF by default.** Switch them on in the DASHBOARD, or wait:
  after 2 hours without input, the AUTO switch turns on everything whose requirements are met.
- **All in-game messages and reports are German.** The guide has a small glossary.
- Built and tested on **Bitburner v3.0.1**. SCHWARM gets much stronger with Source-File 4 (Singularity),
  and without SF4 there is no automatic augmentation cycle.

## Documentation

- **[Beginner's Guide](docs/GUIDE.md)**: start-up chain, requirements, the DASHBOARD, the switch file, the plan
  file (how to allow ending a BitNode), DIAG reports, stopping and updating, and troubleshooting.
- **[Script reference](docs/SCRIPTS.md)**: what every script and embedded daemon does, how to run it on its own,
  RAM, requirements, and how to switch it on or off.

## Checks

Every pull request and every push to `main` runs [automatic checks](.github/workflows/check.yml): a static checker
(`tools/SCHWARM-PRUEFER.pl`: version headers, payload rules, port table, daemon registry, RPC names) and a syntax
check of every script and of every daemon embedded as a template string (`tools/nutzlast-check.mjs`).

## Credits

- **casino.js** by **Alain Bryden** ([alainbryden/bitburner-scripts](https://github.com/alainbryden/bitburner-scripts), MIT License).
  It is embedded unchanged in `SCHWARM-GENESIS.js`, which only swaps its `helpers.js` import for a small
  compatibility layer. It includes partial credits to **@ShamesBond** and **@drider**, kept in the code.
  Thank you for sharing it! See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Bitburner** by the [bitburner-official](https://github.com/bitburner-official) team and all its contributors.

## License

[MIT](LICENSE). The embedded casino.js keeps its own MIT notice (Copyright (c) 2021 Alain Bryden).
