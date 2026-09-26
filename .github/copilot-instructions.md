# Instructions for GitHub Copilot (code review)

This repository is **SCHWARM**, a script suite for the game Bitburner (v3.0.x, Netscript 2 / JavaScript modules).
The scripts in `scripts/` mirror exactly what runs in the author's game. Changes are tested outside this repository
(node benches, a static checker, a separate test game) before they are pushed here.

When you review a pull request, please keep these project rules in mind:

- **German comments are intentional.** Code comments, log messages and reports are German by design. Do not flag them
  or suggest translating them. The documentation in `README.md` and `docs/` is English.
- **Payload templates.** Several daemons live as JavaScript source inside template literals (`const SRC_GANG = \`...\``
  in `SCHWARM-PAYLOADS.js`, also in `SCHWARM-DARKNET.js` and `SCHWARM-GENESIS.js`). Inside these templates a backtick is
  written `__SCHWARM_BT__` and a dollar-brace `__SCHWARM_DC__`, and new code must not contain raw backticks, raw
  dollar-braces or backslashes. Flag any violation - it breaks the payload silently at runtime.
- **RAM is static.** Bitburner charges RAM for every `ns.*` function that appears in a script's source, even in
  unreachable code. Adding an `ns` call can make a daemon too big for its host. Expensive calls are deliberately routed
  through `evalNs(...)` strings or the INFO daemon (`io.act("name")`). Point out new direct `ns` calls in daemons.
- **Money protocol (BANK grants).** Consumers request money with `requestFunds`, buy only with a published grant
  (`readFundGrant`), then withdraw with cost 0 when they spent it, or with `requestFundsZurueck` when they did not.
  Every purchase is logged with `chronik(..., daten)` where `daten.betrag` is the amount **actually spent** (0 on
  failure) and `daten.topf` is the matching `getMoneySources()` bucket. Flag purchases without such a log line and log
  lines whose amount is not what the engine charged.
- **Ports.** All port numbers come from `SCHWARM_PORTS` in `SCHWARM-HELPERS.js`. A literal port number elsewhere is a
  bug unless a comment explains the mirror.
- **Version headers.** Each file carries its version in the header comment and in `const VERSION`; both must match.

Please focus on correctness: wrong money accounting, lost messages, races between daemons, RAM surprises, and anything
that could spend in-game money twice. Style nits are not needed.
