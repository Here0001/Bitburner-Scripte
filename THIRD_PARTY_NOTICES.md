# Third-party notices

## casino.js — Alain Bryden

`scripts/SCHWARM-GENESIS.js` embeds `casino.js` from
[alainbryden/bitburner-scripts](https://github.com/alainbryden/bitburner-scripts)
as a payload (constant `SRC_CASINO`). The script itself is used unchanged. SCHWARM
only replaces its import from `helpers.js` with a small compatibility layer (the nine
helper functions it needs) and swaps `cleanup.js` for its own temp-file cleanup.
The original file credits `@ShamesBond` (DOM helpers) and `@drider` (blackjack
hit/stay logic), and those credits are kept in the code.

Thank you, Alain, for sharing your scripts with the community.

```
MIT License

Copyright (c) 2021 Alain Bryden

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
