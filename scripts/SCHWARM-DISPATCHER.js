/**
 * SCHWARM-DISPATCHER.js — v12.4
 *
 * v12.4 — ZWEI PORTNUMMERN IN KOMMENTAREN ZEIGTEN AUF FREMDE POSTFAECHER.
 *   Bei den Port-Aliasen stand "// 25" fuer DISP_OUT (ist 3) und "// 6" fuer
 *   RESERVATION (ist 19). Ausgerechnet 25 und 6 sind belegt (STANEK_OUT,
 *   BANK_IN) — die Angaben waren also nicht nur veraltet, sondern irrefuehrend.
 *   Ausgefuehrt wurde immer das Richtige; der Schaden lag beim LESEN. Genau
 *   solche gespiegelten Nummern haben im Schwarm schon zweimal eine echte
 *   Portkollision erzeugt. Die Kommentare nennen jetzt keine Zahlen mehr.
 *
 * v12.0 — STANEKS LADEHOST FAELLT NACH DER LADUNG IN DEN POOL ZURUECK.
 *
 *   Bis v11.9 stand "fertig" mit in der Sperrbedingung. Der Host blieb also
 *   auch nach dem Ende der Ladung dauerhaft aus der Nutzung — und seit
 *   Payload v2.5 waehlt STANEK nicht mehr home, sondern den GROESSTEN Server.
 *
 *   Live gemessen am 04.09. bei 1,48 PB Pool, aus der Kreuzprobe des Berichts:
 *       frei: Dispatcher 99.7T (vor den Deploys)  vs.  real 163.1T
 *   Die 63,4 TB Unterschied waren pserv-0. In der Worker-Verteilung fehlte er
 *   vollstaendig, waehrend jeder andere pserv 37.449 Threads trug — rund
 *   4,8 % der gesamten Rechenleistung lagen brach, fuer einen One-Shot, der
 *   einmal je Prestige laeuft.
 *
 *   Festhalten ist auch gar nicht noetig: die LADUNG haengt nicht am Prozess.
 *   chargeFragment schreibt sie in die Fragmente (StaneksGift), sie ueberlebt
 *   das Ende des Laders. Fuer die naechste Ladung holt der
 *   "raeumt"-Handschlag den Host in zwei Takten zurueck.
 *
 *   Dazu gehoert zwingend das Zuruecksetzen von stanekGeraeumt. Der Merker
 *   verhindert doppeltes Raeumen desselben Hosts; wird der Host jetzt aber
 *   freigegeben und spaeter erneut angefordert, waere er ohne Ruecksetzen eine
 *   Falle — es wuerde nicht mehr geraeumt und der Lader kaeme nie hinein.
 *
 * SCHWARM-DISPATCHER.js — v11.9
 *
 * v11.9 — ZUSTAND "raeumt" AUF PORT 25 ANERKENNEN. STANEK (Payload v2.5)
 *   berechnet seine Threadzahl auf einem Fremdhost jetzt aus maxRam. Der Host
 *   ist im Moment der Wahl also noch voll mit Workern, und der Lader passt
 *   erst nach der Raeumung hinein. STANEK meldet ihn deshalb vorab als
 *   "raeumt". Ohne diesen Zustand blieben beide stehen: der Lader kaeme nicht
 *   hinein und meldete "fehler", und auf "fehler" wurde hier nicht geraeumt.
 *   Am Raeumen selbst aendert sich nichts — es trifft weiterhin nur Prozesse,
 *   deren Dateiname klein geschrieben mit "schwarm-" beginnt, also Worker.
 *
 * v11.8 — STANEKS LADEHOST GEHOERT IHM ALLEIN. Die Ladestaerke ist die
 *   Threadzahl EINES Skripts auf EINEM Host (Stanek.ts:53), laesst sich also
 *   nicht verteilen — der einzige Weg nach oben ist ein Host, den niemand
 *   sonst anfasst. Der von STANEK auf Port 25 gemeldete Ladehost wird deshalb
 *   aus der Nutzung genommen und EINMAL geraeumt (nur "schwarm-"-Worker; die
 *   Daemons heissen "SCHWARM-" und bleiben). Ohne das Raeumen brachte die
 *   Ausnahme nichts: die XP-Dauerlaeufer enden von selbst nie.
 *
 * v11.7 — HACKNET-SERVER HABEN NICHT IMMER EINEN KERN. coresOf behauptete
 *   "pserv-* und hacknet-* haben immer 1 Core". Fuer pserv stimmt das, fuer
 *   Hacknet-SERVER nicht: HacknetServer.ts:100 setzt cpuCores = this.cores, und
 *   die gehen bis 128 (Hacknet/data/Constants.ts:50). Der Kernbonus
 *   1 + (cores-1)/16 erreicht dort 8,94 — ausgerechnet die Hosts, auf denen
 *   weaken und grow am meisten bringen, galten als die schwaechsten.
 *
 * v11.3
 *
 * v11.3 — DIE BEEINFLUSSUNGSSTUFE SCHOB NACH UND ERSTICKTE SICH SELBST.
 *
 *   BEFUND (Livereport, Zyklus 4): manip belegte 4,0 TB von 7,4 TB und meldete
 *   dabei NULL Impuls-Aufrufe. Gleichzeitig: share 0 GB trotz aktivem Grind,
 *   XP-Kopffreiheit auf 0 GB, Pool-Rest 615 GB. Der gesamte Einsatz lag im
 *   Platz-schaffen-Zweig — dem hack OHNE stock-Flag, der nur Raum fuer den
 *   spaeteren grow macht.
 *
 *   A) KEINE VERRECHNUNG GEGEN `flying`. Jede andere Stufe rechnet
 *          need = total - flying.get(...)
 *      runManipStage nicht. Sie brachte also JEDEN 2-s-Takt den vollen Bedarf
 *      erneut aus, waehrend die alten Worker noch liefen — und grow/hack laufen
 *      auf einem Megacorp-Server bei Level 860 minutenlang. Strukturell derselbe
 *      Fehler wie der PREP-Bug aus v9.2 und der XP-Bug aus v9.4: eine Stufe, die
 *      ihren eigenen Bestand nicht abfragt.
 *      Groessenordnung: total = MANIP_CHUNK / hackAnalyze(host). Bei einem
 *      hochstufigen Ziel liegt hackAnalyze um 0,0001, das sind rund 3400 Threads
 *      = 5,8 TB — je Takt neu.
 *      FIX: beide Zweige (hack und grow) und der Sicherheits-weaken ziehen
 *      flying.get(keyOf(kind, CLS_MANIP, host)) ab.
 *
 *   B) DER SICHERHEITS-WEAKEN STAND AM ENDE und rechnete mit dem, was `mgb` nach
 *      dem hack-Abzug uebrig liess. Frisst hack alles, bekommt weaken null ->
 *      Sicherheit steigt -> calculateHackingTime steigt (er skaliert linear mit
 *      hackDifficulty, Hacking.ts:64) -> WENIGER IMPULSE PRO MINUTE. Also genau
 *      die Groesse, um die es der Stufe geht.
 *      FIX: weaken laeuft ZUERST. Sein Bedarf ist klein und exakt bezifferbar
 *      ((sec - minSec) / WEAKEN_1, gedeckelt auf MANIP_WEAKEN_MAX = 200 Threads
 *      = 350 GB gegen 4 TB), er bekommt also garantiert seinen Platz und der
 *      ganze Rest geht an hack/grow.
 *      Nebenbei korrigiert: der alte Code nahm `min(MANIP_WEAKEN_MAX, mgb/RAM)`
 *      — also 200 Threads, unabhaengig davon, ob 200 noetig waren.
 *
 *   C) BEWUSST NICHT UMGESETZT: ein Wellen-Deckel oder ein Anteilsdeckel fuer den
 *      Platz-schaffen-hack. Beides klingt plausibel und ist mechanisch falsch.
 *      calculateHackingTime kennt KEINEN Threads-Parameter (Hacking.ts:60-78):
 *      die Laufzeit eines Aufrufs ist unabhaengig von der Threadzahl. Der Zyklus
 *      hack -> grow dauert also immer 4,2 x T, egal wie gross der Chunk ist. Ein
 *      kleinerer Chunk heisst: gleiche Zeit, weniger Impuls. Ein Deckel wuerde
 *      die Impulsrate direkt SENKEN — er war in der ersten Fassung dieser Version
 *      vorgesehen und ist nach dieser Rechnung gestrichen worden.
 *
 *   D) REIHENFOLGE: manip -> CORE -> XP -> share. share stand bisher VOR der
 *      Beeinflussung (bei hackPays) und vor XP und nahm 40 % des freien Pools.
 *      In BN8, wo CORE keinen Dollar bringt und XP der eigentliche Fortschritt
 *      ist, war das genau falsch herum. Im Livereport nur deshalb unsichtbar,
 *      weil beide 0 GB bekamen.
 *
 *   E) SHARE-DECKEL UEBER DEN GRENZNUTZEN statt Festwert 2000.
 *      ENGINE (Share.ts): Bonus = 1 + ln(effThreads) / 25, wobei
 *      effThreads = threads x (1 + 2 x Int^0,8 / 600) x coreBonus
 *      (calculateEffectiveSharedThreads + calculateIntelligenceBonus).
 *      Die Funktion ist logarithmisch, hat also KEINEN Saettigungspunkt — jede
 *      Verdopplung bringt konstant ln(2)/25 = +2,77 Punkte und kostet doppelt so
 *      viel RAM. Ein "effektives Maximum" gibt es nicht, jeder Deckel ist eine
 *      Setzung. Herleitbar ist aber der Grenznutzen:
 *          Gewinn je zusaetzlichem TB = (1024 / RAM.share) / (25 x effThreads)
 *      SHARE_MARGINAL_MIN sagt jetzt, wieviel ein weiteres TB mindestens bringen
 *      muss; der Deckel folgt daraus. Bei 0,01 (ein Prozentpunkt je TB) sind das
 *      rund 1024 effektive Threads = 4 TB und ein Bonus von etwa +28 %. Der alte
 *      Festwert 2000 entsprach +31 %, dort brachte ein weiteres TB noch 0,4
 *      Punkte. Der Intelligence-Bonus wird echt gerechnet (ns.getPlayer steht
 *      ohnehin im Code), der coreBonus bewusst NICHT — er ist je Host anders,
 *      und ihn zu ignorieren macht den Deckel leicht grosszuegig statt zu streng.
 *
 *   F) XP-ZIELWAHL RECHNETE MIT DER FALSCHEN GROESSE. Sie nutzte minSec als
 *      Difficulty-Term, die Engine nutzt baseDifficulty (Hacking.ts:31-36).
 *      Server.ts:82-83 zeigt das Verhaeltnis:
 *          this.baseDifficulty = this.hackDifficulty;                 // Ausgangswert
 *          this.minDifficulty  = clamp(round(realDifficulty / 3), 1, 100);
 *      Also baseDifficulty ~ 3 x minSec — und der Fehler war NICHT gleichmaessig:
 *      bei foodnstuff (minSec 1) 3,3 statt 3,9, bei minSec 33 aber 12,9 statt
 *      32,7. Die Stufe bevorzugte leichte Server also staerker als richtig.
 *      Gelesen wird jetzt baseDifficulty, gemerkt wie coreCache (der Wert ist
 *      statisch; nur minDifficulty laesst sich per Hash-Upgrade veraendern).
 *
 *   ZURUECKGEZOGEN, weil bis zum Gleichgewichtszustand durchgerechnet falsch:
 *   die XP-Stufe auf hack umzustellen. hack liefert pro Aufruf dieselbe XP wie
 *   weaken, laeuft aber nur ein Viertel so lang (Hacking.ts:83-94) — auf dem
 *   Papier 3,7x mehr XP je RAM und Sekunde. Zwei Gruende dagegen:
 *     1. netscriptCanHack verlangt requiredHackingSkill <= Hacking-Level;
 *        netscriptCanWeaken/-Grow verlangen nur Root. Das XP-Ziel wird bewusst
 *        OHNE Level-Schranke gewaehlt.
 *     2. NetscriptHelpers.tsx:633: ist moneyDrained 0, faellt die XP auf ein
 *        Viertel. Die XP-Stufe fahrt Tausende Threads — der erste Aufruf leert
 *        das Ziel, danach liefert hack 0,25 X je Thread und Zeiteinheit, also
 *        exakt so viel wie weaken, aber mit Chancen-Risiko und einem geleerten
 *        Geld-Ziel. Der Vorteil besteht nur MIT grow-Gegenstueck, und eine
 *        hack/grow-Mischung im Gleichgewicht IST CORE.
 *
 * v11.2 — DER DISPATCHER STARB, SOBALD INFO DEN bn-BLOCK LIEFERTE.
 *
 *   BEFUND (Livelauf): nach wenigen Minuten hoerte Port 25 auf zu senden, die
 *   Ziele bekamen keine HWG-Worker mehr, belegt blieben 236 GB von 7,4 TB — die
 *   manip-Worker plus die Daemons selbst. Der Prozess lief weiter, nur seine
 *   Arbeit nicht.
 *
 *   A) URSACHE, eine Zeile in STUFE 1+2:
 *          const coreCeilGb = hackPays ? Infinity : totalGb * CORE_MAX_SHARE_NOPAY;
 *      `totalGb` wird erst UNTEN im Telemetrie-Block deklariert. `const` ist
 *      blockskopiert, der Zugriff davor wirft also ReferenceError (Temporal Dead
 *      Zone).
 *      WARUM ES ERST NACH MINUTEN KIPPTE: `hackPays` startet mit true, der
 *      else-Zweig wird dann gar nicht ausgewertet. hackMoneyWorthless() liest den
 *      bn-Block von INFO; bis der steht, bleibt es bei true. Sobald er da ist
 *      (BN8: ScriptHackMoneyGain 0), faellt hackPays auf false — und ab da
 *      crasht JEDER Takt an dieser Stelle. Der catch der Hauptschleife fing es
 *      ab, die Schleife lief also weiter, aber alles dahinter fiel aus: STUFE
 *      1+2, share, XP und der Port-25-Snapshot. Genau das Bild oben.
 *      FIX: gerechnet wird mit `poolTotalGb`, das an dieser Stelle laengst steht.
 *      Die zweite Deklaration `const totalGb = poolTotalGb` ist ERSATZLOS RAUS —
 *      zwei Namen fuer denselben Wert waren die eigentliche Falle. Es gibt jetzt
 *      genau eine Groesse, und sie gilt im ganzen Takt.
 *
 *   B) clsOf() KANNTE CLS_MANIP NICHT. deploy() setzt args[1] = "manip", die
 *      Abfrage kannte den Wert aber nicht — der Worker fiel durch und wurde ueber
 *      die Zielzugehoerigkeit als CORE gebucht.
 *      DAS WAR KEIN ANZEIGEPROBLEM: coreGbNow() summiert core_w+core_g+core_h+
 *      prep, also zaehlte manip-RAM gegen coreCeilGb und schnitt CORE zu frueh
 *      ab — obwohl das RAM in der Beeinflussung steckte. Im Report sichtbar als
 *      Klasse "manip": 0G bei gleichzeitig laufenden Impuls-Aufrufen.
 *      MITGEZOGEN: classSum, die Zeilentabelle in buildDiag und die
 *      Tail-Aufschluesselung fuehren MANIP jetzt mit. Ohne das waere die Klasse
 *      nach dem Fix als "nicht klassifiziert" aufgetaucht und der Fix haette wie
 *      ein neuer Fehler ausgesehen.
 *
 *   C) VERSIONSANGABEN VEREINHEITLICHT. Kopf sagte v10.7, announce() v9, der
 *      Tail-Header v9, buildDiag v10.3 — vier Nummern in einer Datei. Genau das
 *      Muster, das beim naechsten Snapshot-Abgleich einen Downgrade erzeugt.
 *
 *   BEWUSST NICHT GEAENDERT: budget.prep. Der Topf wird seit v10 nirgends mehr
 *   gelesen (STUFE 1 und 2 sind zusammengelegt und buchen beide auf "core").
 *   Toter Code, kein Fehler — er gehoert in die Architektur-Runde, nicht in
 *   einen Absturz-Fix.
 *
 * v10.7 — KURSBEEINFLUSSUNG (neue STUFE 3b).
 *
 *   ANLASS: In BN8 erzeugt der gesamte Hacking-Apparat KEINEN Dollar
 *   (BitNode.tsx:764-791, ScriptHackMoneyGain 0). Sein einziger Wert ist die
 *   Beeinflussung der Aktienkurse — und die funktioniert OHNE 4S, weil man die
 *   Richtung selbst setzt statt sie zu lesen.
 *
 *   ENGINE (PlayerInfluencing.ts):
 *       percTotalMoneyGrown = moneyGrown / server.moneyMax
 *       if (Math.random() < percTotalMoneyGrown)
 *           stock.changeForecastForecast(otlkMagForecast + 0.1)
 *   und spiegelbildlich -0.1 fuer hack mit moneyDrained.
 *
 *   DREI FOLGERUNGEN, und alle drei widersprechen der CORE-Logik:
 *
 *   1. DER IMPULS HAENGT AM AUFRUF, NICHT AN DEN THREADS. Ein grow() gibt genau
 *      EINE Chance; bei p >= 1 ist Schluss. Ein Aufruf mit 300 % Zuwachs bringt
 *      genauso viel wie einer mit 100 % — zehn Aufrufe à 30 % dagegen dreimal
 *      so viel. CORE buendelt maximal viele Threads in einen exec; hier ist das
 *      die schlechteste Aufteilung. Deshalb MANIP_CHUNK statt "so viel wie passt".
 *
 *   2. NUR EINE SEITE DARF BEEINFLUSSEN. grow braucht Platz (ein Server auf
 *      moneyMax waechst nicht, p ~ 0), also muss vorher gehackt werden — aber
 *      hack mit stock:true senkt den Forecast und frisst die eigene Arbeit auf.
 *      Deshalb traegt args[2] eine RICHTUNG: bei "up" beeinflusst nur grow, bei
 *      "down" nur hack. Die jeweils andere Seite laeuft ohne Flag.
 *
 *   3. DER ENGPASS IST DIE LAUFZEIT, NICHT DAS RAM. Von neutral (50) auf
 *      maximal (100) sind 500 Impulse noetig (Schrittweite 0.1 auf einer
 *      0-100-Skala, Stock.ts:154-161). Was zaehlt, sind ABGESCHLOSSENE Aufrufe
 *      pro Minute — ein Level-1-Server liefert davon ein Vielfaches eines
 *      ecorp. Die Stufe sortiert deshalb nach 60/growTime, nicht nach Ertrag.
 *
 *   ZIELWAHL liegt beim TRADER (Port 34): er kennt Position und Richtung und
 *   meldet nur, was er TATSAECHLICH HAELT. Beeinflussung ohne Position waere
 *   eine Wette auf 500 Impulse Vorlauf.
 *
 *   EIN SERVER IST GELDZIEL ODER BEEINFLUSSUNGSZIEL, NIE BEIDES — sonst hackt
 *   CORE, waehrend manip growt, und beide heben sich auf.
 *
 *
 * v10.6 — ZWEI FOLGEFEHLER AUS v10.3/v10.5, beide bei GROSSEN Portionen sichtbar.
 *
 *   P2) BILANZ UEBERBUCHTE WIEDER. Live: "verbucht 915,0 TB, real belegt 657,1 TB".
 *       Ursache ist der v10.3-Fix selbst: `used` wird beim Deploy SOFORT
 *       mitgebucht, `measuredUsedGb` aber im Pool-Aufbau gemessen — also VOR dem
 *       Deploy. Die Differenz ist genau das im Takt Platzierte (79.656 Threads
 *       x 1,75 GB = 139 TB). In v10.3 fiel das nicht auf, weil die Portionen klein
 *       waren; bei 80.000 Threads je Takt kippt es.
 *       FIX: das im Takt platzierte RAM wird mitgezaehlt (placedGb), damit
 *       `busyGb` und `used` denselben Zeitpunkt beschreiben.
 *
 *   P3) DER WELLEN-DECKEL GRIFF BEIM AUFFUELLEN NICHT. Live im 2-s-Wechsel:
 *           WORKER Threads 279019 -> 327153 (+48134)
 *           WORKER Threads 327153 -> 271159 (-55994)
 *       Genau die Synchronitaet, die die Wellen brechen sollen. Grund: der Deckel
 *       staffelt nur das SOLL (total/ticks). Lag `need` knapp darunter — 79.656
 *       gegen 80.748 —, war er wirkungslos und alles startete in einem Takt. Beim
 *       Auffuellen aus einem grossen Loch ist das der Regelfall, und der Pool wuchs
 *       hier von 422 auf 934 TB.
 *       FIX: wave() staffelt zusaetzlich den FREIEN PLATZ (fits/ticks). Der Deckel
 *       wirkt damit in beiden Lagen — im Gleichgewicht ueber das Soll, beim
 *       Auffuellen ueber den Platz.
 *
 * v10.5 — DER WELLEN-DECKEL ARBEITETE GEGEN SICH SELBST.
 *
 *   BEFUND (Livelauf, 30 Samples): 135,3 TB von 279,5 TB lagen brach, und zwar
 *   KONSTANT (134,5 .. 135,3 TB ueber das ganze Fenster). Kein Auffuellen, kein
 *   Schwanken. Die Buchfuehrung war dabei einwandfrei — Kreuzprobe 144,2 TB gegen
 *   144,2 TB real, frei 134,6 gegen 135,3. Es fehlte also nichts an der MESSUNG,
 *   der Dispatcher hat schlicht nicht nachgefuellt.
 *
 *   RECHNUNG mit den Livezahlen: total = (286208 - 5723) / 1,75 = 160.300 Threads,
 *   flying rund 80.160, fits 73.600 — und wave() begrenzt auf
 *   ceil(160300/8) = 20.000 Threads = 35 TB je Takt. Das muesste den Pool in vier
 *   Takten fuellen. Er blieb konstant. Also verschwinden die Worker genauso
 *   schnell, wie sie kommen.
 *
 *   URSACHE: FILL_TICKS war eine KONSTANTE (8). v10 hat sie gegen den
 *   umgekehrten Fall gebaut — damals lief weaken auf foodnstuff bei Level ~688
 *   rund 13,6 s bei 2-s-Takt, also sieben Takte Vollbelegung und ein Takt
 *   Leerlauf im Wechsel. Die Wellen sollten diese Synchronitaet brechen.
 *   Inzwischen ist das Hacking-Level 364 und das XP-Ziel foodnstuff verlangt
 *   Level 1: die weaken-Zeit skaliert mit dem Verhaeltnis Server- zu
 *   Spielerlevel (calculateHackingTime), sie ist also auf Sekunden gefallen.
 *   Ein Achtel des Solls je Takt reicht dann nicht mehr, um den Bestand zu
 *   halten — der Deckel, der Leerlauf verhindern sollte, ERZEUGT ihn.
 *
 *   A) FILL_TICKS IST JETZT DYNAMISCH: ceil(Worker-Laufzeit / Takt), gedeckelt
 *      auf FILL_TICKS_MAX. Die Wellen decken damit immer genau eine Laufzeit ab —
 *      bei 13,6 s wie bisher acht Takte, bei 1,5 s ein einziger, also volle
 *      Auffuellung. Die Laufzeit kommt aus ns.getWeakenTime(xpTarget), das im
 *      Slow-Takt ohnehin schon gemessen wird (Zeile "let wt = 1").
 *
 *   B) EINHEITEN GERADEGEZOGEN. `flying` buchte fuer weaken und grow
 *      1-CORE-AEQUIVALENTE (threads x coreBonus). Fuer CORE ist das richtig: der
 *      Bedarf kommt dort aus der Sicherheitsreduktion, und die skaliert mit den
 *      Cores. Fuer XP ist es falsch — der Kommentar an STUFE 4 sagt es selbst
 *      ("calculateHackingExpGain kennt KEINEN cores-Parameter"), und `total` ist
 *      eine reine RAM-Rechnung in echten Threads. Der Bestand wirkte dadurch
 *      groesser als er war und `need` fiel zu klein aus. Auf 1-Core-pservs faellt
 *      das kaum auf, auf Netz-Servern mit bis zu 15 Cores (Bonus 1,875) sehr wohl.
 *
 *   C) DIE XP-RECHNUNG STEHT JETZT IM SNAPSHOT (total, flying, fits, Portion,
 *      execs, Laufzeit, FILL_TICKS). Diese Version beruht auf einer HERLEITUNG,
 *      nicht auf einer Messung — die Laufzeit des Workers stand nirgends. Beim
 *      naechsten Report ist sie ablesbar, und falls die Herleitung falsch ist,
 *      sieht man es sofort statt vier Kandidaten durchzuprobieren.
 *
 * v10.4 — BACKDOOR LIEF NIE. Der Dispatcher meldete im Nachtlauf dauerhaft
 *   "Backdoor: aus (offen 12)" — er zaehlte die Ziele korrekt und startete den
 *   Payload trotzdem nicht ein einziges Mal.
 *
 *   URSACHE, eine Zeile:
 *       if (slow && backdoorPending > 0 && isDaemonEnabled(ns, "BACKDOOR", ...))
 *   BACKDOOR traegt in der Registry `triggered: true`, und isDaemonEnabled liefert
 *   ohne State-Eintrag `!(d.triggered || d.defaultOff)` — also FALSE. Ein
 *   State-Eintrag entsteht aber nur, wenn jemand den Schalter betaetigt, und das
 *   Dashboard blendet triggered-Daemons seit v4.4 aus. Es gab also niemanden, der
 *   diese Freigabe je haette erteilen koennen: eine geschlossene Tuer ohne Klinke.
 *   `triggered` heisst "die QUEEN startet den Daemon nicht von selbst" — der
 *   Dispatcher IST hier aber der Owner (owner "HACKING") und der Ausloeser. Er
 *   fragt jetzt nur noch, ob der Schalter EXPLIZIT auf 0 steht.
 *
 *   PARALLELBETRIEB. Ein Backdoor wartet calculateHackingTime/4; bei 12 offenen
 *   Zielen summiert sich das sequenziell auf viele Minuten, in denen ein einzelner
 *   Prozess nur wartet. Der Dispatcher startet jetzt bis zu BACKDOOR_MAX_PARALLEL
 *   Worker gleichzeitig, einen je Ziel, und bucht die laufenden aus ps() — kein
 *   Ziel wird doppelt belegt. Engine-Beleg fuer die Unbedenklichkeit
 *   (Singularity.ts:518-556): installBackdoor() friert Player.getCurrentServer()
 *   in einer lokalen Konstante ein, BEVOR netscriptDelay() laeuft. Ein anderer
 *   Prozess, der in der Wartezeit die Verbindung wechselt, beeinflusst den
 *   laufenden Backdoor nicht. Und da ns.singularity.connect() synchron ist, kann
 *   zwischen connect-Kette und Einfrieren kein anderes Skript dazwischenkommen.
 *
 *   REIHENFOLGE. Faktions-Server zuerst (CSEC, avmnite-02h, I.I.I.I,
 *   run4theh111z, fulcrumassets) — ihr Backdoor loest die Einladung aus und ist
 *   damit das eigentliche Ziel der Uebung. Danach nach Hacking-Level aufsteigend,
 *   weil die Wartezeit mit dem Level steigt: so sind die meisten Ziele am
 *   schnellsten erledigt.
 *
 *   W0R1D_D43M0N IST AUSGESCHLOSSEN, hier und im Payload. Engine
 *   (Singularity.ts:552): ein Backdoor dort ruft Router.toPage(Page.BitVerse) und
 *   BEENDET DIE BITNODE. Das Dashboard zeigt die Bereitschaft bewusst nur an
 *   ("Auslösung erfolgt NUR manuell durch dich"). Bisher war der Server nirgends
 *   ausgenommen — der Sammelmodus haette ihn mitgenommen, sobald das Level reicht.
 *   Aufgefallen ist das nur nicht, weil der Payload wegen des Gate-Fehlers oben
 *   ueberhaupt nie lief.
 *
 * v10.3 — DIAGNOSE, DIE NICHT MEHR LUEGT. Drei Befunde aus dem Nachtlauf, alle
 *   an der MESSUNG, nicht an der Zuteilung — mit EINER Ausnahme (C), die ein
 *   echter Zuteilungsfehler war.
 *
 *   A) BILANZ WAR ZEITLICH VERSCHOBEN. `used.*` entstand VOR dem Deploy (aus
 *      ps()), `leftGb` und damit `measuredBusy` DANACH. Alles, was im selben Takt
 *      gestartet wurde, erschien deshalb als "nicht klassifiziert" — live 608 GB
 *      von 5,86 TB, also 10 % des Netzes ohne Zuordnung. In einem Report stand
 *      gleichzeitig "CORE weaken 0 GB" und in der Zieltabelle 282 laufende
 *      weaken-Threads; beides konnte nicht stimmen.
 *      FIX: deploy() bucht jede Platzierung sofort auf ihre Klasse. Zusaetzlich
 *      wird die Belegung jetzt EXAKT gemessen (Summe getServerUsedRam ueber die
 *      gerooteten Hosts) statt aus totalGb - leftGb - reservedGb hergeleitet —
 *      die alte Herleitung zaehlte homeReserve und nicht provisionierte Hosts
 *      faelschlich als "belegt".
 *
 *   B) "! abgelaufene Reservierung ignoriert" BEI GESUNDER QUEEN. Port 6 hatte
 *      keinen Zeitstempel, also startete der Dispatcher seine 180-s-Uhr, sobald
 *      ein Host ZUERST in der Reservierung auftauchte — und liess sie durchlaufen,
 *      obwohl die Queen jeden 2-s-Takt frisch schrieb. Alle 180 s wurde eine
 *      voellig legitime 96-GB-Reservierung auf home fuer einen Takt verworfen.
 *      FIX: HELPERS v3.6 schreibt "@:<ms>" mit; die Deadline misst jetzt das
 *      Alter der MELDUNG. Fehlt der Marker (aeltere HELPERS), wird NICHT
 *      verworfen — die Lebendpruefung der Queen per ps() reicht dann.
 *      Der Leser dafuer (reservationsWrittenAt) steht ABSICHTLICH in dieser
 *      Datei statt in HELPERS: ein Named Import, den die vorhandene
 *      HELPERS-Version nicht kennt, laesst das ganze Modul nicht laden, und
 *      Bitburner meldet dann "does not have a main function" — der Dispatcher
 *      startet also gar nicht mehr. Diese Datei laeuft jetzt gegen JEDE
 *      HELPERS-Version; ohne v3.6 fehlt nur der Marker.
 *
 *   C) XP UND CORE TEILTEN SICH EINEN BUCHUNGSSCHLUESSEL. v10.2 hatte das nur als
 *      Anzeigeproblem beschrieben (xpIsCore). Es war mehr: STUFE 1 rechnet
 *          need = total - flying("weaken|ziel")
 *      und `flying` enthielt die Hunderttausende XP-Threads. Ist das XP-Ziel
 *      zugleich ein bewertetes Geld-Ziel (foodnstuff ist beides), wurde CORE-weaken
 *      dort rechnerisch UNTERDRUECKT — live 2157 Threads unter "CORE weaken",
 *      waehrend die xp-Klasse 0 GB meldete.
 *      FIX: der Worker bekommt args[1] als Klassenmarke ("xp" | "core" | "share"),
 *      der Schluessel lautet "art|klasse|ziel". Der Worker LIEST das Argument nie —
 *      es dient allein der Erkennung ueber ps().args[1]. Das ist die EINZIGE
 *      Verhaltensaenderung dieser Version. Fuer Worker OHNE args[1] (noch laufend
 *      aus einer v10.2-Instanz) wird die Klasse wie bisher aus der
 *      Zielzugehoerigkeit abgeleitet, damit der Uebergang nichts doppelt zaehlt.
 *      BEWUSST NICHT getrennt werden CORE und PREP: ein Ziel wandert bei
 *      steigendem Level von prep nach core, und zwei Schluessel wuerden die
 *      laufenden Threads in diesem Moment schlicht vergessen. Beide teilen sich
 *      deshalb die Klasse "core".
 *
 *   D) "Budget/Deckel erschoepft" WAR EIN SAMMEL-ETIKETT fuer jeden Pool-Rest,
 *      unabhaengig vom tatsaechlichen Grund. Jetzt fuehrt der Takt mit, WELCHE
 *      Deckel gegriffen haben (Budget-Topf, Wellen-Deckel, XP-Kopffreiheit,
 *      Ziel-Deckel, Bedarf gedeckt), und Abschnitt 2 nennt sie beim Namen.
 *
 * v10.2 — Snapshot meldet xpIsCore: ist das XP-Ziel gleichzeitig ein bewertetes
 *   Geld-Ziel (foodnstuff ist beides), teilen XP- und CORE-weaken denselben
 *   Buchungsschluessel "weaken|ziel". Die Telemetrie kann sie dann nicht trennen —
 *   die xp-Klasse zeigt 0 GB, waehrend die Threads unter core_w erscheinen. Das ist
 *   kein Fehler (die Ueberlappung haelt sogar die Sicherheit des Geld-Ziels am
 *   Minimum), aber ein Beobachter muss davon wissen: im 8-Stunden-Nachtlauf meldete
 *   DIAG 16 Zyklen lang "XP bekommt nichts", obwohl das Level von 128 auf 215 stieg.
 *
 * v10.1
 *
 * v10.1 — XP-Kopffreiheit auf die Haelfte des freien Pools begrenzt. Der Boden von
 *   128 GB war fuer einen Multi-Petabyte-Pool gedacht; direkt nach einem Aug-Reset
 *   ist der Pool aber klein (live: 1,5 TB gesamt, 128 GB frei nach Reservierungen),
 *   und der Boden verschlang genau den gesamten freien Rest -> xp bekam 0 GB.
 *
 * v10
 *
 * v10 — UMBAU auf reine One-Shot-Worker. Die Ursache der Rest-Oszillation war NICHT
 *   Buchfuehrung, sondern SYNCHRONITAET: die Worker sind bereits One-Shot (ein
 *   Aufruf, dann Ende), aber sie starteten alle im selben Takt und endeten damit
 *   auch gemeinsam. In dem Moment ist der Bestand 0 und das RAM zu 100 % frei, der
 *   naechste Takt fuellt alles wieder auf. Auf foodnstuff dauert weaken bei Level
 *   ~688 rund 13,6 s, der Takt ist 2 s — also sieben Takte Vollbelegung, ein Takt
 *   Leerlauf, im Wechsel. Live: 1,3 <-> 3,8 Mio Threads, bis zu 5,5 PB brach.
 *
 *   A) WELLEN (der eigentliche Fix). FILL_TICKS = 8: jeder Bedarf wird auf acht
 *      Takte verteilt. Nach 16 s ist der Sollstand erreicht; danach laeuft je Takt
 *      ein Achtel aus, waehrend ein Achtel landet -> gleichmaessige Umwaelzung.
 *   B) EINE Zaehlung (`flying`, Schluessel "art|ziel") statt vier getrennter
 *      Mechanismen (running / runningPrep / runningXp / shareThr). Jeder der vier
 *      Bugs dieser Reihe war eine Stufe, die ihren Zaehler nicht abgefragt hat.
 *      Gebaut aus ps(): Dateiname = Art, args[0] = Ziel. Grundwahrheit statt
 *      Buchfuehrung — uebersteht Neustarts, kann nicht driften.
 *   C) KEINE KILLS mehr. Reservierter Platz wird nur abgezogen; weil jeder Worker
 *      ein One-Shot ist, laeuft er binnen einer Worker-Laufzeit von selbst leer.
 *      Die Deadline-Eskalation war nur noetig, solange share endlos lief.
 *   D) share ist jetzt ebenfalls One-Shot (ns.share() kehrt nach ShareBonusTime =
 *      10 s zurueck, Share.ts:8). Damit entfaellt der komplette Abbau-Zweig aus
 *      v9.1 inklusive Karenzzeit und Zustand.
 *   E) ARGUMENTE: args[0] = Ziel, args[1] = Klassenmarke (seit v10.3),
 *      args[2] = Kursbeeinflussung (seit v10.7). Der Worker LIEST args[1] und
 *      args[2] nie — sie dienen allein der Erkennung ueber ps().args. share
 *      bekommt sie ebenfalls, sonst waeren share-Prozesse die einzigen ohne
 *      Marke. Kein Delay, keine Klasse, keine Seq — preventDuplicates ist
 *      per Standard false (NetscriptHelpers.tsx:257), identische exec-Aufrufe
 *      erzeugen also getrennte Prozesse. Die Telemetrie leitet die Klasse jetzt aus
 *      der Zielzugehoerigkeit ab statt aus einem Start-Label.
 *   F) STUFE 1 und 2 zusammengelegt — die Logik war identisch, nur darf auf
 *      Prep-Zielen nicht gehackt werden. Die Nachlese entfaellt (der Wellen-Deckel
 *      macht ihren Sonderfall gegenstandslos).
 *
 * v9.4 — XP-BUCHFÜHRUNG (Bugfix)
 *
 * v9.4 — XP-BUCHFÜHRUNG (Bugfix). STUFE 4 war die LETZTE Stufe ohne Verrechnung
 *   laufender Threads; ich hatte sie zweimal fälschlich als harmlos eingeschätzt,
 *   weil deploy() nur platziert, was ins freie RAM passt. Der Fehler liegt aber
 *   woanders: der Soll-Wert wurde aus dem FREIEN Rest berechnet, nicht aus der
 *   Gesamtkapazität minus Bestand. Weaken läuft mehrere Sekunden (foodnstuff bei
 *   Level 677: rund 3,5-14 s je nach hacking_speed), also über mehrere 2-s-Ticks.
 *   Endet ein Schwung, wird das RAM im nächsten Takt sofort komplett neu belegt,
 *   während used.xp die schon toten Prozesse noch mitzählt.
 *   Live gemessen (Report 21:44): Threads sprangen dauerhaft zwischen 118.000 und
 *   2.383.000, der Dispatcher verbuchte 4079 TB, real belegt waren 201 TB, und
 *   3960 TB lagen brach. Die drei Reports zeigen die Verschlechterung: Kreuzprobe
 *   21:00 noch 3454 gegen 3451 TB (sauber), 21:22 dann 3738 gegen 4036, 21:44
 *   schließlich 4079 gegen 201.
 *   FIX: `runningXp` aus der ps-Erfassung UND aus deploy(); der Soll-Bestand kommt
 *   aus (poolTotalGb - Kopffreiheit) / RAM.weaken, davon wird der Bestand
 *   abgezogen, und das Ergebnis zusätzlich auf das real freie RAM begrenzt. Die
 *   Nachlese füllt ebenfalls nur bis zum Soll-Bestand.
 *
 * v9.3 — XP-KOPFFREIHEIT + EVAL-PUFFER
 *
 * v9.3 — XP-KOPFFREIHEIT + EVAL-PUFFER. Behebt eine Kaskade, die live einen
 *   Totalausfall erzeugte (Report 18:01 gegen 17:33, 28 Minuten Abstand):
 *   STUFE 4 nahm mit `ceil(pool/RAM.weaken) * 2` jeden Rest, die Nachlese füllte
 *   jeden Knoten bis auf 0. Bei 1554 TB Pool hielt xp 1466 TB (94 %), frei blieben
 *   4-20 GB im GESAMTEN Pool. Das ist keine Überbelegung — deploy platziert nur,
 *   was passt — sondern VOLLBELEGUNG, und weil weaken auf hohem Level minutenlang
 *   läuft, blieb das RAM über viele Takte blockiert. Kette: INFOs evals scheiterten
 *   mit NO_RAM -> Blöcke work/rep/augs/market veralteten -> BANKs Rep-Ziel wurde
 *   null -> WORK fiel auf Crime zurück -> CORE brach von 102 TB auf 2,2 TB ein,
 *   Geld von $95m auf $10m.
 *   A) XP lässt jetzt `max(128 GB, Pool × 2 %)` frei; die Nachlese führt ein
 *      eigenes Restbudget und darf die Kopffreiheit nicht mehr auffressen.
 *   B) Eval-Puffer gegen INFOs ECHTE Bündelkosten gerechnet statt geschätzt:
 *      teuerstes Bündel ist crime (5 + 5 GB) × sf4Mult + 2 GB Grundlast, bei
 *      SF4 ≥ 3 also 12 GB. Der alte Puffer von 16 GB deckte genau eines, ohne
 *      Reserve für einen zweiten Verbraucher auf demselben Host — WORK und BANK
 *      nutzen io.act ebenfalls über evals. Jetzt 32 GB und bis zu 3 parallel.
 *   BEWUSST NICHT umgesetzt: ein prozentualer XP-Deckel (etwa 50 %). CORE sättigt
 *   bei 26 Zielen um ~114 TB (Report 17:33: core_h lief auf 113,9 TB und blieb
 *   dort). Bei 1554 TB Pool würde ein 50-%-Deckel rund 650 TB dauerhaft brachlegen,
 *   ohne dass CORE sie nutzen könnte. Die Kopffreiheit löst die Aushungerung; ein
 *   Anteilsdeckel würde nur Kapazität verschenken.
 *
 * v9.2 — PREP-BUCHFÜHRUNG (Bugfix)
 *
 * v9.2 — PREP-BUCHFÜHRUNG (Bugfix). STUFE 2 hatte, im Gegensatz zu STUFE 1, KEINE
 *   Verrechnung laufender Threads: `running.set` stand ausschließlich in
 *   `if (cls === WCLASS.CORE)`-Zweigen. STUFE 2 startete deshalb JEDEN Slow-Takt
 *   erneut den vollen Bedarf für dieselben (korrekt nach Level sortierten) Ziele,
 *   während die alten Worker noch flogen — weaken läuft auf hochstufigen Servern
 *   minutenlang. Bei PREP_POOL_FRAC 0.25 und 274 TB Pool sind das bis zu ~39.000
 *   Threads Deckel je Ziel und ~195.000 Threads je Takt, ungebremst nachgeschoben.
 *   Live sichtbar als 29-47 TB Dauerlast und Thread-Wellen von ~100k im 2-s-Raster.
 *   Der grow-Zweig war der schlimmere: er startete `min(total, cap)` ganz ohne
 *   Abzug. FIX: eigene Map `runningPrep` (getrennt von `running`, damit sich die
 *   Stufen nicht gegenseitig Threads anrechnen), gefüllt aus der ps-Erfassung UND
 *   aus deploy() (sonst bedienen mehrere Hosts im selben Takt dasselbe Ziel
 *   mehrfach); beide STUFE-2-Zweige ziehen sie ab.
 *   C) SHARE-DECKEL wirkte nicht. SHARE_MAX_THREADS (2000) ist ein Deckel auf den
 *      BESTAND, wurde aber nie gegen die laufenden Threads gerechnet — jeder Slow-
 *      Takt legte bis zu 2000 weitere nach, und weil schwarm-s.js endlos läuft,
 *      summierten sie sich auf live 10.751 Threads = 42 TB. Der Nutzen ist dabei
 *      logarithmisch (Share.ts: 1 + ln(T)/25): jede Verdopplung bringt konstant
 *      +2,77 Prozentpunkte und kostet doppelt so viel RAM. 42 TB gegen 8 TB waren
 *      gemessen +6,7 Punkte. Zähler shareThr aus der ps-Erfassung wird jetzt abgezogen.
 *   Zusätzlich `prepNext` im Port-25-Snapshot: die drei nächstliegenden Prep-Ziele
 *   mit Level-Bedarf, damit DIAG belegen kann, ob die XP-Stufe den Engpass löst.
 *
 * v9.1 — SHARE-ABBAU (Bugfix) + RAM-Falle beseitigt.
 *   A) schwarm-s.js ist `while (true) { await ns.share(); }` — der Worker beendet
 *      sich nie selbst. Bisher gab es genau EINEN kill-Pfad (Queen-Reservierungen),
 *      also blieben share-Worker nach dem Ende des Faktions-Grinds dauerhaft im
 *      Pool stehen. Live gemessen: 92,6 TB = 34 % des Pools, 40 s nachdem das
 *      Grind-Flag auf false ging; core_h (Geld-Hacking) hatte im selben Fenster
 *      im Schnitt 180 GB. STUFE 3 hat jetzt einen else-Zweig, der share-Worker
 *      abräumt, sobald der Grind SHARE_TEARDOWN_MS (30 s) durchgehend aus ist.
 *      Die Karenz verhindert Flattern, weil das Flag nach SHARE_MAX_AGE_MS (90 s)
 *      von selbst verfällt und ein verpasstes Auffrischen von WORK sonst sofort
 *      alle Worker töten würde. Zähler shareTorn steht im Port-25-Snapshot, damit
 *      DIAG den Abbau nachweisen kann.
 *   B) Alle Punkt-Zugriffe .share (used/RAM/budget/WORKER) auf ["share"] umgestellt.
 *      RamCalculations.ts hat einen eigenen MemberExpression-Handler, der object UND
 *      property abläuft; die property-Identifier landen in addRef(). Der Dispatcher
 *      zahlte damit die 2,4 GB von ns.share, obwohl er die Funktion nie aufruft.
 *      Ein String-Literal in Klammern ist ein Literal-Knoten und erzeugt keine
 *      Referenz. Objekt-SCHLÜSSEL (share: 0) bleiben unangetastet — acorn-walks
 *      Basis-Handler besucht nicht-berechnete Property-Keys nicht.
 * RAM-Vollstrecker des Schwarms: HWG-Zuteilung, Restpool, Solver, Backdoor.
 *
 * ===========================================================================
 * ÄNDERUNGEN ggü. v8  (alle Engine-Belege am Ende des Kopfes)
 * ===========================================================================
 *
 * A) BUGFIXES — behebt "einige Server sind nicht ausgelastet"
 *
 *  A1  SPAWN-BUDGET PRO STUFE statt global.
 *      v8: EIN Budget (max 200 execs) für alle vier Stufen. Stufe 1 (CORE) läuft
 *      zuerst und fraß es leer; Stufe 4 (XP) braucht 1 exec JE HOST und kam nicht
 *      mehr dran. Weil deploy() zusätzlich von den GRÖSSTEN Hosts abwärts füllte,
 *      blieben genau die KLEINEN Hosts leer.
 *      v9: Jede Stufe hat ihr eigenes Kontingent; XP bekommt garantiert
 *      (pool.length + 8) execs. Kein Host verhungert mehr.
 *
 *  A2  XP/FÜLLUNG VON KLEIN NACH GROSS (Best-Fit).
 *      Füll-Worker fressen zuerst die kleinen Reste. Die großen Hosts bleiben als
 *      zusammenhängender Block für CORE und die Daemon-Spawns der Queen frei.
 *
 *  A3  RESERVIERUNGS-LEICHEN (Port 6). Port 6 ist ein peek-Wert: stirbt die Queen,
 *      bleibt ihre letzte Reservierung für immer stehen -> der Host ist dauerhaft
 *      gedrosselt. v9 prüft im ohnehin laufenden ps()-Durchlauf, ob die QUEEN lebt.
 *      Tote Queen -> Reservierungen werden ignoriert UND Port 6 wird geleert.
 *      Zweite Sicherung: RESERVE_STALE_MS (Queen lebt, hängt aber).
 *
 *  A4  HOME_RESERVE=16 RAUS. v8 hielt fest 16 GB auf home zurück, HELPERS/Queen
 *      rechneten aber mit homeReserve()=5 -> die Queen glaubte, home habe 11 GB
 *      mehr, als der Dispatcher freigab (stille Deploy-Fehlschläge). Jetzt EINE
 *      Quelle: homeReserve(ns). Den Rest reserviert die Queen über Port 6 —
 *      genau so ist das Grundprinzip gedacht.
 *
 *  A5  EXEC-FEHLSCHLÄGE werden gezählt und gemeldet statt still geschluckt.
 *
 *  A6  NACHLESE-DURCHLAUF: nach Stufe 4 werden Rundungsreste eingesammelt.
 *
 * B) GENAUIGKEIT — setzt real RAM frei (mehr Platz für PREP/SHARE/XP)
 *
 *  B1  WORKER-RAM WIRD GEMESSEN, nicht geraten. v8 rechnete pauschal 1.75 GB.
 *      schwarm-h.js kostet real 1.70 (1.6 Basis + hack 0.1). Jetzt: ns.getScriptRam().
 *
 *  B2  CPU-CORES  <-- der größte Einzelposten.
 *      ENGINE (ServerHelpers.ts:288/294, grow.ts:25):
 *        getCoreBonus(cores)   = 1 + (cores-1)/16
 *        getWeakenEffect(t,c)  = ServerWeakenAmount * t * coreBonus * BN.ServerWeakenRate
 *        Grow-Log             ~= ... * coreBonus * threads
 *      ENGINE (ServerHelpers.ts:376): normale Netz-Server bekommen
 *        cpuCores = randInt(ceil(layer/2), layer)   -> Layer 15 = 8..15 Cores!
 *      ENGINE (BaseServer.ts:50): pserv-* haben IMMER 1 Core.
 *
 *      Folge: grow/weaken auf einem 15-Core-Server wirken 1.875x so stark wie auf
 *      einem pserv. v8 sortierte nach RAM und schob w/g bevorzugt auf die pservs —
 *      also auf die core-technisch SCHLECHTESTEN Hosts.
 *
 *      v9 Deploy-Reihenfolge:
 *        grow/weaken (CORE+PREP) -> Hosts nach cpuCores ABSTEIGEND
 *        hack                    -> Cores egal (calculatePercentMoneyHacked kennt
 *                                   keinen cores-Parameter) -> Cores AUFSTEIGEND,
 *                                   damit die Core-Hosts für w/g frei bleiben
 *        share                   -> Core-Bonus wirkt zwar (Share.ts:21), aber der
 *                                   Rep-Bonus ist 1+ln(t)/25 -> marginal -> Cores auf
 *        xp                      -> Hacking-XP kennt keine Cores
 *                                   (calculateHackingExpGain(server, person))
 *                                   -> kleinste Reste zuerst
 *
 *      Bedarf und Ist-Bestand werden in 1-CORE-ÄQUIVALENTEN geführt:
 *      ein weaken-Thread auf einem 15-Core-Host zählt als 1.875 Threads.
 *
 *  B3  WEAKEN_PER_THREAD=0.05 RAUS -> ns.weakenAnalyze(1, 1) (kennt den
 *      BitNode-Multiplikator ServerWeakenRate; die Konstante kannte ihn nicht).
 *
 *  B4  FORMULAS-PFAD (wenn Formulas.exe vorhanden — Kosten der formulas-API: 0 GB,
 *      RamCostGenerator.ts:678-700). Zielbewertung am GEPREPPTEN Server
 *      (hackDifficulty=minDifficulty, moneyAvailable=moneyMax) statt am aktuellen,
 *      verzerrten Zustand. Damit entfällt der MIN_HACK_CHANCE-Workaround aus v7
 *      ersatzlos: hackAnalyzeChance unterschätzt unruhige Ziele systematisch,
 *      formulas.hacking.hackChance(preppedServer, player) nicht.
 *      Neuer Score = $/s JE GB eines vollen Ernte-Zyklus (h+g+w), nicht Rohertrag.
 *      Ohne Formulas: alter Näherungspfad, aber core-korrigiert.
 *
 * C) DIAGNOSE (ersetzt das ursprünglich geplante separate Monitor-Skript)
 *
 *  C1  Port 25: JSON-Snapshot je Fast-Takt (peek). Kosten: 0 GB.
 *  C2  Flag --diag: Tabellen ins Tail + Datei schwarm-diag.txt (überschreibend).
 *      Enthält: Pool-Bilanz je Klasse, Host-Tabelle mit LEER-GB UND GRUND,
 *      Ziel-Tabelle Soll/Ist, exec-Fehlerrate, Budget-Ausschöpfung, Zeitreihe.
 *      Ein externer Monitor könnte die GRÜNDE gar nicht sehen — nur der Dispatcher
 *      weiß, warum er etwas nicht getan hat.
 *
 * ---------------------------------------------------------------------------
 * SHARE — unverändert gedeckelt. Engine (Share.ts:43): Rep = 1 + ln(threads)/25.
 * RAM 4.0 GB je Thread. 100 thr = +18 %, 1.000 thr = +28 %, 10.000 thr = +37 %.
 * Logarithmisch und teuer -> nur aus echtem Überschuss, stirbt zuerst.
 * ---------------------------------------------------------------------------
 *
 * Start:  run SCHWARM-DISPATCHER.js [--no-home] [--diag]
 * @param {NS} ns
 */
// Eine Quelle fuer Kopf und Laufzeitmeldung. Bis zum Health-Check am
// 04.09.2026 waren das getrennte Freitexte und liefen auseinander: der
// Kopf sagte eine Version, die Startmeldung im Log eine andere. Beim
// Nachstellen eines Fehlers behauptet das Log damit etwas Falsches.
const VERSION = "12.4";


import {
    getTopology, readReservations, readShareWanted,
    // isDaemonEnabled ist seit v10.4 NICHT mehr importiert: der einzige Aufruf war
    // das Backdoor-Gate, und genau dort war die Funktion falsch (siehe Kopf).
    // Ein Import, den niemand braucht, ist eine Abhaengigkeit, die nur brechen kann.
    readManagedState, ensureSingleInstance, announce,
    homeReserve, SCHWARM_PORTS, PSERV_PREFIX, bitNodeFeatures,
    readManipTargets, readReservationsAt, hackMoneyWorthless,
    // v12.0 ERNTEPFAD: der Dispatcher MELDET nur (reportReap), getoetet wird von
    // der Queen. Begruendung steht bei reportReap in HELPERS.
    XP_LONG_WORKER, reportReap,
} from "SCHWARM-HELPERS.js";
import { materialize } from "SCHWARM-PAYLOADS.js";

/**
 * ENTFERNT (v4.0): die lokale Kopie von reservationsWrittenAt().
 *
 * Sie stand hier mit der Begruendung, ein Named Import koenne gegen eine
 * aeltere HELPERS-Version brechen ("does not have a main function"). Die Sorge
 * war real, aber sie hat den Schwarm dieselbe Doktrin gekostet, die ihn zweimal
 * eine Port-Kollision gekostet hat: Code an zwei Orten pflegen. Der neue Ordner
 * enthaelt genau EINE HELPERS-Version — es gibt keine alte mehr, gegen die man
 * sich absichern muesste. Gelesen wird jetzt readReservationsAt() aus HELPERS.
 */

export async function main(ns) {
    ns.disableLog("ALL");
    if (!ensureSingleInstance(ns)) { ns.tprint("WARN  [DISPATCHER] läuft bereits — beende diese Instanz."); return; }

    // ---------- Dateien ----------
    // v12.0: xplong = XP-Dauerlaeufer (schwarm-wl.js). Gleicher Aufruf wie weaken,
    // aber in einer Schleife — er endet nie von selbst. Nur die XP-Stufe nutzt ihn.
    // Der Dateiname kommt aus HELPERS (XP_LONG_WORKER), weil die Queen dieselbe
    // Kennung zum Ernten braucht; zwei Schreibweisen waeren ein stiller Bruch.
    const WORKER = { weaken: "schwarm-w.js", grow: "schwarm-g.js", hack: "schwarm-h.js",
        share: "schwarm-s.js", xplong: XP_LONG_WORKER };
    const FILES = [WORKER["weaken"], WORKER["grow"], WORKER["hack"], WORKER["share"], WORKER["xplong"]];
    const SOLVER = "schwarm-solver.js";
    const BACKDOOR = "SCHWARM-BACKDOOR.js";
    const QUEEN_FILE = "SCHWARM-QUEEN.js";
    // Daemons, die ihre Daten über evalNs (Singularity-Wegwerf-Skripte) holen und
    // deshalb freien RAM auf IHREM Host brauchen. Ohne Puffer scheitern die Aufrufe
    // still -> Capabilities/Zustände kippen auf false. Siehe evalBufferGb.
    const EVAL_DAEMONS = new Set([
        "SCHWARM-QUEEN.js",   // detectCapabilities (getOwnedSourceFiles)
        "SCHWARM-WORK.js",    // Faction/Company/Crime/Sleeves — alles Singularity
        "SCHWARM-BANK.js",    // Home-RAM, Corp-Gründung, Congruity-Graft
        "SCHWARM-AUGS.js",    // Aug-Käufe
    ]);
    const DIAG_FILE = "schwarm-diag.txt";

    // ---------- Ports ----------
    // v12.4: Die Nummern in diesen beiden Kommentaren waren FALSCH — sie
    // nannten 25 und 6, tatsaechlich sind es 3 und 19. Ausgerechnet 25 und 6
    // sind dabei belegt (STANEK_OUT und BANK_IN), die Angabe war also nicht
    // nur veraltet, sondern zeigte auf fremde Postfaecher.
    //
    // Ausgefuehrt wurde immer das Richtige (der Code nimmt SCHWARM_PORTS), der
    // Schaden lag beim Lesen: genau solche gespiegelten Nummern haben im
    // Schwarm schon ZWEIMAL eine echte Portkollision erzeugt (siehe
    // SCHWARM-PAYLOADS, materialize: "Port 19, Port 34 — beide Male, weil eine
    // Zahl an zwei Orten gepflegt werden musste und einer vergessen wurde").
    //
    // Deshalb steht hier jetzt keine Zahl mehr. Die einzige Quelle ist
    // SCHWARM_PORTS in SCHWARM-HELPERS.js.
    const PORT_STAT = SCHWARM_PORTS.DISP_OUT;     // Deploy-Snapshot (peek, JSON)
    const PORT_RES = SCHWARM_PORTS.RESERVATION;   // RAM-Reservierungen der Queen

    // ---------- Stellschrauben ----------
    const MONEY_OK = 0.95;   // ab so viel vom Max gilt ein Ziel als "geldvoll"
    const SEC_TOL = 1.0;     // sec <= min + dem gilt als "ruhig"
    const HACK_FRAC = 0.5;   // ein Hack-Schub klaut höchstens so viel vom Maximum
    const MAX_TARGET_FRAC = 0.35;
    const GROW_CAP_THREADS = 100_000;
    const MIN_HACK_CHANCE = 0.30;   // NUR noch im Fallback ohne Formulas

    const LOOP_MS = 2000;
    const SLOW_EVERY = 8;           // teure Arbeit alle 16 s
    const CONTRACT_THRESHOLD = 5;

    // v10.4 BACKDOOR. Deckel gegen einen Schwarm aus Wartern: jeder Worker kostet
    // rund 8 GB (Basis 1.6 + scan 0.2 + getServer 2 + connect 2 + installBackdoor 2
    // + getHackingLevel 0.05, bei SF4 >= 3). Fuenf parallel sind 40 GB — auf einem
    // Multi-Terabyte-Pool nichts, und mehr bringt kaum etwas, weil die Ziele nach
    // Level sortiert abgearbeitet werden und die langsamen ohnehin lange dauern.
    const BACKDOOR_MAX_PARALLEL = 5;
    // Faktions-Server: ihr Backdoor loest die Einladung aus -> Vorrang.
    // w0r1d_d43m0n steht hier BEWUSST NICHT drin (siehe WORLD_DAEMON unten).
    const BACKDOOR_PRIO = new Set(["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets"]);
    // NIE automatisch backdooren: beendet die BitNode (Singularity.ts:552).
    const WORLD_DAEMON = "w0r1d_d43m0n";

    // v10.7 KURSBEEINFLUSSUNG.
    //
    // HIER STAND `const PORT_MANIP = 34;` mit der Begruendung, ein Named Import
    // koenne gegen eine aeltere HELPERS-Version brechen. Die Vorsicht war
    // berechtigt — der Preis war es nicht: DARKNET hatte sich 34 im selben
    // Zeitraum ebenfalls genommen (auch als lokale Konstante), beide schrieben
    // im Sekundentakt mit clear()+tryWrite(), und die Beeinflussungsziele kamen
    // hier nie heil an. Im Livereport: "manipZiele 6 -> —".
    //
    // Seit v4.0 gibt es genau eine Port-Tabelle, und der TRADER traegt seine
    // Ziele als Feld in seinem eigenen Ausgang. Gelesen wird ueber
    // readManipTargets() — die Nummer steht nirgends mehr doppelt.
    // Impulsgroesse je Aufruf. Ein grow() gibt EINE Chance mit p = Zuwachs/moneyMax;
    // bei p >= 1 ist Schluss. 0.34 heisst: drei Aufrufe fuellen den Server, jeder
    // mit rund 34 % Trefferchance — statt eines Aufrufs mit 100 %.
    const MANIP_CHUNK = 0.34;
    const MANIP_MAX_TARGETS = 4;
    const MANIP_POOL_FRAC = 0.35;   // hoechstens so viel des freien Pools
    // v11.0: Anteil, wenn die Beeinflussung ZUERST bedient wird (Hacking zahlt
    // in dieser BitNode kein Geld). Bewusst nicht 1.0 — CORE haelt die Ziele
    // weiter auf minSec und moneyMax, und genau das braucht die Beeinflussung
    // als Untergrund: ein Server mit hoher Sicherheit growt langsamer, und ein
    // Server auf moneyMax laesst sich nicht mehr hochgrowen. Der Rest geht
    // ausserdem in XP, und Hacking-Level ist auch in BN8 die Voraussetzung
    // dafuer, ueberhaupt an die grossen Organisationen heranzukommen.
    const MANIP_POOL_FRAC_LEAD = 0.70;
    // v11.1: Hoechstanteil des GESAMTPOOLS fuer die Geld-Ziele, wenn Hacking in
    // dieser BitNode kein Geld bringt. Der Rest bleibt ueber Taktgrenzen hinweg
    // frei — fuer die Kursbeeinflussung, fuer share und fuer die evals der
    // Singularity-Daemons. Ohne diese Decke belegt CORE alles und haelt es
    // minutenlang, weil grow/weaken auf hohem Level lange laufen.
    const CORE_MAX_SHARE_NOPAY = 0.45;
    const MANIP_WEAKEN_MAX = 200;   // Sicherheits-weaken je Ziel und Takt

    const SHARE_MAX_FRAC = 0.40;
    // v11.3: SHARE_MAX_THREADS (Festwert 2000) ist ERSETZT. Engine (Share.ts):
    //     Bonus = 1 + ln(effThreads) / 25
    // Logarithmisch, also ohne Saettigungspunkt: jede Verdopplung bringt konstant
    // ln(2)/25 = +2,77 Punkte und kostet doppelt so viel RAM. Ein "effektives
    // Maximum" existiert nicht — herleitbar ist nur der GRENZNUTZEN:
    //     Gewinn je zusaetzlichem TB = (1024 / RAM.share) / (25 x effThreads)
    // Dieser Wert sagt, wieviel ein weiteres TB mindestens bringen muss. 0,01 =
    // ein Prozentpunkt je TB; daraus folgen rund 1024 effektive Threads (4 TB)
    // und ein Bonus um +28 %. Der alte Festwert 2000 entsprach +31 %, dort brachte
    // ein weiteres TB nur noch 0,4 Punkte.
    const SHARE_MARGINAL_MIN = 0.01;
    // v10 WELLEN. Ein Worker macht EINEN Aufruf und endet; die Laufzeit bestimmt die
    // Engine (calculateHackingTime x4 fuer weaken). Auf foodnstuff sind das bei
    // Level ~688 rund 13,6 s, der Takt ist 2 s. Starten alle Worker im SELBEN Takt,
    // enden sie auch GEMEINSAM -> flying faellt auf 0, das RAM ist zu 100 % frei,
    // der naechste Takt fuellt alles wieder auf. Live gemessen: 1,3 <-> 3,8 Mio
    // Threads im 2-s-Wechsel, 5,5 PB zeitweise brach.
    // FILL_TICKS verteilt jeden Bedarf auf so viele Takte. 8 x 2 s = 16 s deckt eine
    // Worker-Laufzeit ab: nach 8 Takten ist der Sollstand erreicht, dann laeuft der
    // erste Schwung aus, waehrend der achte landet -> gleichmaessige Umwaelzung.
    // v10.5: FILL_TICKS ist keine Konstante mehr, sondern wird je Takt aus der
    // gemessenen Worker-Laufzeit abgeleitet (siehe fillTicksFor unten). Diese
    // beiden Werte sind nur die Grenzen.
    //   MIN 1  = keine Wellen. Richtig, sobald ein Worker kuerzer laeuft als ein
    //            Takt: dann ist jede Drosselung reiner Leerstand.
    //   MAX 8  = der alte Festwert. Er deckt 16 s Laufzeit ab; laenger laufende
    //            Worker brauchen keine feinere Verteilung, weil der Bestand dann
    //            ohnehin ueber viele Takte steht.
    const FILL_TICKS_MIN = 1;
    const FILL_TICKS_MAX = 8;
    // v11.5: Ab diesem freien Anteil am Gesamtpool wird NICHT mehr gestaffelt.
    // 0.15 heisst: solange ueber 15 % frei sind, kann jeder Bedarf sofort komplett
    // platziert werden — es gibt dann keinen Gleichschritt, den man brechen muesste.
    //
    // v11.6 HYSTERESE. Mit nur EINER Schwelle entsteht ein Saegezahn: bei 15 %
    // wird ausgesetzt, die XP-Stufe schluckt in einem einzigen Takt den ganzen
    // Rest, der freie Anteil faellt auf die Kopffreiheit, der Deckel greift
    // wieder, der Pool laeuft langsam auf 15 % zurueck. Im Livebericht sah man
    // beide Enden: der Dispatcher-Schnappschuss traf 8.4 %, die Messung der
    // Diagnose 16.2 % — und die Differenz sah aus wie ein Fehler von 2.6 TB.
    //
    // Zwei Schwellen statt einer: eingeschaltet wird bei 15 %, ausgeschaltet
    // erst wieder unter 6 %. Dazwischen bleibt der zuletzt gewaehlte Zustand
    // stehen. Der Deckel selbst bleibt unangetastet — er faengt eine gemessene
    // Thread-Schwingung ab (v10.6 P3) und darf nicht entfernt werden.
    const WAVE_BYPASS_ON  = 0.15;   // ab hier aussetzen
    const WAVE_BYPASS_OFF = 0.06;   // erst hier wieder staffeln
    const PREP_MAX_LEVEL_FACTOR = 3;
    // v9.3 XP-KOPFFREIHEIT. STUFE 4 nahm mit `ceil(pool/RAM.weaken) * 2` bewusst
    // JEDEN Rest. Das ist keine Überbelegung (deploy platziert nur, was passt),
    // sondern VOLLBELEGUNG: weaken-Worker laufen auf hohem Level minutenlang, das
    // RAM ist also über mehrere Takte blockiert. Live bei 1554 TB Pool: xp hielt
    // 1466 TB (94 %), frei blieben 4-20 GB im GESAMTEN Pool. Folge war eine Kaskade
    // — INFOs evals scheiterten mit NO_RAM, die Blöcke work/rep/augs/market
    // veralteten, BANKs Rep-Ziel wurde null, WORK fiel auf Crime zurück, und CORE
    // brach von 102 TB auf 2,2 TB ein (Geld $95m -> $10m).
    // Die Kopffreiheit bleibt frei, damit CORE und die evals im NÄCHSTEN Takt
    // Platz finden. Sie skaliert mit dem Pool, hat aber einen absoluten Boden.
    //
    // v12.1 — EIN RIEGEL STATT ZWEI, UND MIT DECKEL.
    // Bis v12.0 gab es hier zwei Groessen mit derselben Aufgabe: die Kopffreiheit
    // (2 % des Pools) und das Polster der XP-Stufe (10 %). Genommen wurde das
    // Maximum. Beide sind reine PROZENTSAETZE — und das war der Fehler.
    //
    // Was der Riegel decken muss, waechst NICHT mit dem Pool mit. Er muss den
    // Zuwachs auffangen, den CORE, manip und die evals von einem Takt zum
    // naechsten anmelden. Gemessen ueber acht Zyklen:
    //     core_g   1,5 T .. 11,3 T   (Sprung 2,3 T -> 10,5 T in EINEM Takt)
    //     core_w   0,1 T ..  0,9 T
    //     core_h   0,1 T ..  0,4 T
    //     manip    0,01 T .. 0,25 T
    // Zusammen also rund 13 TB Spitzenbedarf. Der Prozentsatz lieferte bei
    // 7,9 PB Pool aber 794 TB — das Sechzigfache, und damit 794 TB dauerhaft
    // brachliegendes RAM. Auf einem 2-TB-Pool lieferte derselbe Satz 200 GB,
    // also viel zu wenig fuer denselben Bedarf. Ein Prozentsatz passt hier auf
    // KEINER Poolgroesse.
    //
    // Deshalb: Prozentsatz nur noch als Anlaufkurve fuer kleine Pools, darueber
    // ein absoluter Deckel. 100 TB sind rund das Achtfache des gemessenen
    // Spitzenbedarfs — reichlich Luft, und trotzdem 694 TB, die jetzt XP fahren.
    const XP_PAD_FRAC = 0.10;              // Anlaufkurve fuer kleine Pools
    const XP_PAD_MAX_GB = 100 * 1024;      // DECKEL: 100 TB, ~8x der Messspitze
    // Boden bewusst KLEIN: er muss nur ein eval-Bündel (max. 12 GB bei SF4 ≥ 3) plus
    // einen CORE-Schritt für ein neu freigeschaltetes Ziel decken. Ein größerer Boden
    // (etwa 1 TB) wäre in der Frühphase bei 2 TB Pool über 50 % Dauerreserve.
    const XP_PAD_MIN_GB = 128;
    // v12.3: Anteil des Hacknet-RAMs, der je Server FREI bleibt, damit weiter
    // Hashes anfallen. Linear: 25 % Reserve = 25 % Hash-Rate (ramRatio in
    // HacknetServers.ts:14). Ausfuehrliche Begruendung an der Freigabestelle.
    // Sind Hashes in dieser BitNode ohnehin wertlos, faellt die Reserve weg.
    const HN_HASH_RESERVE_FRAC = 0.25;
    // Ernteschwelle ALS ANTEIL DES POLSTERS, nicht des Pools. Das ist der Kern der
    // Sache: waeren es weiter 3 % des Pools (238 TB), laege die Ernteschwelle bei
    // einem 100-TB-Polster UEBER dem Polster selbst — der Dispatcher wuerde in
    // jedem Takt ernten, was er im selben Takt gerade platziert hat. Die Hysterese
    // muss an derselben Groesse haengen wie die Wachstumsgrenze, sonst ist sie
    // keine. 0,30 erhaelt exakt das bisherige Verhaeltnis (10 % / 3 %).
    const XP_REAP_FRAC_OF_PAD = 0.30;
    const PREP_MAX_TARGETS = 5;

    const RESERVE_STALE_MS = 180_000;   // A3: Reservierung gilt nie länger als das

    const HIST_LEN = 20;                // 20 * 16 s = ~5 min Zeitreihe

    // v10.3 (C): KLASSENMARKE als args[1] jedes Workers. Der Worker LIEST sie nie —
    // sie existiert allein, damit ps() XP-Arbeit von Zielarbeit unterscheiden kann.
    // v10 hatte das Argument entfernt mit der Begruendung, preventDuplicates sei per
    // Standard false und ein Unterscheidungs-Argument daher unnoetig. Das stimmt fuer
    // die Prozess-ERZEUGUNG, war aber fuer die BUCHFUEHRUNG falsch: ohne Marke teilen
    // sich XP- und CORE-weaken auf demselben Ziel einen Schluessel, und STUFE 1
    // rechnet ihren Bedarf gegen fremde Threads.
    // CORE und PREP teilen sich bewusst EINE Klasse: ein Ziel wandert bei steigendem
    // Level von prep nach core, und zwei Schluessel wuerden die laufenden Threads in
    // genau diesem Moment vergessen.
    const CLS_CORE = "core", CLS_XP = "xp", CLS_SHARE = "share", CLS_MANIP = "manip";

    const useHome = !ns.args.includes("--no-home");
    const DIAG = ns.args.includes("--diag");
    const HOST = ns.getHostname();

    // ---------- Payloads materialisieren (selbstheilend) ----------
    const PW = {
        [WORKER["weaken"]]: "WORKER_W", [WORKER["grow"]]: "WORKER_G",
        [WORKER["hack"]]: "WORKER_H", [WORKER["share"]]: "WORKER_S",
        [WORKER["xplong"]]: "WORKER_WL",
        [SOLVER]: "SOLVER", [BACKDOOR]: "BACKDOOR_PAYLOAD",
    };
    for (const [fname, key] of Object.entries(PW)) {
        if (!materialize(ns, key)) { announce(ns, "error", `Payload ${key} (${fname}) nicht materialisierbar`); return; }
    }

    // ---------- B1: Worker-RAM MESSEN statt raten ----------
    const ramOf = (f, fb) => { try { const r = ns.getScriptRam(f); return r > 0 ? r : fb; } catch (e) { return fb; } };
    const RAM = {
        weaken: ramOf(WORKER["weaken"], 1.75),
        grow: ramOf(WORKER["grow"], 1.75),
        hack: ramOf(WORKER["hack"], 1.70),
        share: ramOf(WORKER["share"], 4.00),
        // v12.0: identischer Aufruf wie weaken, nur in einer Schleife — eine
        // for-Schleife kostet in RamCalculations.ts nichts. Der Wert wird trotzdem
        // GEMESSEN und nicht gleichgesetzt: sollte die Datei je abweichen,
        // rechnet der Takt sonst gegen einen erfundenen Bedarf.
        xplong: ramOf(WORKER["xplong"], 1.75),
    };
    const RAM_UNIT = Math.min(RAM["weaken"], RAM["grow"], RAM["hack"]);   // Pool-Rechnung in "Thread-Einheiten"

    // Zahlen-Formatierung. ns.formatNumber wurde in 3.0.0 entfernt -> ns.format.number.
    // Fallback formatiert selbst, damit diese Zeile NIE crasht (Engine-Version egal).
    const fmtNum = (n) => {
        try { if (ns.format && ns.format.number) return ns.format.number(n); } catch (e) { /* Fallback */ }
        const a = Math.abs(n);
        if (a >= 1e12) return (n / 1e12).toFixed(2) + "t";
        if (a >= 1e9) return (n / 1e9).toFixed(2) + "b";
        if (a >= 1e6) return (n / 1e6).toFixed(2) + "m";
        if (a >= 1e3) return (n / 1e3).toFixed(2) + "k";
        return n.toFixed(2);
    };
    const solverRam = Math.ceil(ramOf(SOLVER, 24));
    const backdoorRam = Math.ceil(ramOf(BACKDOOR, 16));

    // ---------- B3/B4: Engine-Werte holen ----------
    const HAS_FORMULAS = (() => { try { return ns.fileExists("Formulas.exe", "home"); } catch (e) { return false; } })();
    // weakenAnalyze kennt BN.ServerWeakenRate — die Konstante 0.05 kannte ihn nicht.
    const WEAKEN_1 = (() => { try { const v = ns.weakenAnalyze(1, 1); return v > 0 ? v : 0.05; } catch (e) { return 0.05; } })();
    const HACK_SEC_1 = (() => { try { const v = ns.hackAnalyzeSecurity(1); return v > 0 ? v : 0.002; } catch (e) { return 0.002; } })();
    const GROW_SEC_1 = (() => { try { const v = ns.growthAnalyzeSecurity(1); return v > 0 ? v : 0.004; } catch (e) { return 0.004; } })();

    announce(ns, "start", `v${VERSION} — Cores+Formulas (${HAS_FORMULAS ? "Formulas AN" : "Fallback"})${DIAG ? " [--diag]" : ""}`);

    // ---------- Zustand ----------
    const coreCache = new Map();          // host -> cpuCores (statisch, außer home)
    const provisioned = new Set();
    const hist = [];                      // Zeitreihe für --diag
    let tick = 0;
    let rooted = [], targets = [], prepTargets = [], xpTarget = null;
    // v12.3: welche Hosts sind Hacknet-Server, und wieviel bleibt dort frei?
    // Wird im Slow-Takt zusammen mit `rooted` gesetzt und im Pool-Aufbau gelesen.
    const hnSet = new Set();
    let hnReserveFrac = 0;
    // v10.5: gemessene weaken-Laufzeit des XP-Ziels in Sekunden. Grundlage fuer die
    // dynamische Wellenzahl. ns.getWeakenTime wird im Slow-Takt ohnehin fuer die
    // XP-Zielwahl gerufen — der Wert wird nur nicht mehr weggeworfen.
    let xpWeakenSec = 0;
    // v11.3 (F): baseDifficulty des XP-Ziels, fuer den Report.
    let xpBaseDiff = 0;
    // v11.3 (E): Intelligence-Bonus fuer die share-Rechnung. Engine
    // (intelligence.ts): 1 + weight x Int^0,8 / 600, und Share.ts ruft ihn mit
    // weight 2. Im Slow-Takt aktualisiert; ns.getPlayer steht ohnehin im Code,
    // kostet also keine zusaetzliche statische RAM.
    let shareIntBonus = 1;
    // v-next: EVAL-PUFFER. Singularity-Daemons (Queen/WORK/BANK/AUGS) holen ihre Daten
    // über evalNs = Wegwerf-Skripte. Deren RAM-Bedarf ist bei niedrigem SF4-Level
    // BRUTAL (RamCostGenerator.ts:88 -> Faktor 16 bei SF4 Lvl 1, also bis ~80 GB für
    // EINEN Call). Füllt der Dispatcher den Pool bis an den Rand, scheitern diese
    // Aufrufe -> detectCapabilities liefert false -> Daemons werden fälschlich als
    // "nicht freigeschaltet" behandelt (magenta im Dashboard, START/STOP-Ping-Pong).
    // Deshalb: auf Hosts, wo solche Daemons laufen, Platz freihalten.
    let evalBufferGb = 0;                 // im Slow-Takt aus dem SF4-Level berechnet
    const evalHosts = new Map();          // Host -> Anzahl laufender Singularity-Daemons
    let cctTotal = 0, backdoorPending = 0;
    let backdoorTargets = [];          // v10.4: die offenen Ziele, nicht nur ihre Anzahl
    let manipTargets = [];             // v10.7: [{host, dir, maxM, growSec, rate}]
    let manipDiag = null;              // v10.7: Rechenweg fuer Port 25 / DIAG
    // v11.0: Rueckkanal an den TRADER — welche Organisationen sind ueberhaupt
    // bedienbar (Server existiert, gerootet, Level reicht, hat Geld)?
    let manipOk = [];
    // v11.0: zahlt hack() in dieser BitNode Geld? Steuert, ob die Beeinflussung
    // VOR oder NACH den Geld-Zielen bedient wird. Kommt aus dem bn-Block des
    // INFO-Daemons (0 GB); ohne INFO gilt konservativ "ja".
    let hackPays = true;
    let solverPid = 0;
    let solverInfo = "aus", backdoorInfo = "aus";
    let backdoorDone = 0;              // in dieser Dispatcher-Instanz gestartete Worker
    let lastLog = "";
    let execOk = 0, execFail = 0;
    // v11.6: Zustand der Wellen-Deckel-Hysterese. Muss ueber die Takte hinweg
    // stehen bleiben — genau das ist der Unterschied zu einer einzelnen Schwelle.
    let waveBypassLatch = false;

    // v11.8: Ladehost von STANEK (Port 25). Er wird aus der Nutzung genommen
    // und einmal geraeumt; stanekGeraeumt merkt sich, fuer welchen Host das
    // schon passiert ist, damit nicht jede Runde erneut gekillt wird.
    let stanekHost = "";
    let stanekGeraeumt = "";

    // ---------- B2: Cores ----------
    // v11.7 BUGFIX — HACKNET-SERVER HABEN NICHT IMMER EINEN KERN.
    //
    // Hier stand "pserv-* und hacknet-* haben immer 1 Core". Fuer pserv stimmt
    // das (BaseServer.cpuCores = 1, nicht ausbaubar). Fuer Hacknet-SERVER nicht:
    // HacknetServer.ts:100 setzt cpuCores = this.cores, und die gehen bis 128
    // (Hacknet/data/Constants.ts:50). Der Kernbonus 1 + (cores-1)/16 erreicht
    // dort also 8,94 — genau die Hosts, auf denen weaken und grow am meisten
    // bringen, galten als die schwaechsten.
    //
    // Nur SF9-Server haben Kerne; hacknet-node-* sind keine Server und tauchen
    // hier ohnehin nicht auf. Gelesen wird wie bei home ueber getServer, aber
    // gecacht — die Kernzahl aendert sich nur beim Kauf eines Upgrades.
    const coresOf = (h) => {
        if (h.startsWith(PSERV_PREFIX)) return 1;
        if (h !== "home" && coreCache.has(h)) return coreCache.get(h);
        let c = 1;
        try { c = ns.getServer(h).cpuCores || 1; } catch (e) { c = 1; }
        if (h !== "home") coreCache.set(h, c);
        return c;
    };
    const coreBonus = (c) => 1 + (Math.max(1, c) - 1) / 16;

    // ---------- v11.3 (F): baseDifficulty MERKEN ----------
    // ENGINE (Hacking.ts:31-36): die XP je Thread ist 3 + baseDifficulty x 0,3 —
    // NICHT minDifficulty. Server.ts:82-83 setzt baseDifficulty auf den
    // Ausgangswert von hackDifficulty und minDifficulty auf rund ein Drittel
    // davon; die XP-Zielwahl unterschaetzte den Term damit um Faktor 3, und zwar
    // ungleichmaessig (bei kleinem minSec kaum, bei grossem stark).
    // Der Wert ist statisch: changeMinimumSecurity (Hash-Upgrade) veraendert
    // minDifficulty, nicht baseDifficulty. Also merken wie coreCache.
    const baseDiffCache = new Map();
    const baseDiffOf = (h, minSec) => {
        const hit = baseDiffCache.get(h);
        if (hit !== undefined) return hit;
        let v = 0;
        try { v = ns.getServer(h).baseDifficulty || 0; } catch (e) { v = 0; }
        // Rueckfall ueber die Engine-Relation, falls getServer scheitert.
        if (!(v > 0)) return Math.max(1, (minSec || 1) * 3);
        baseDiffCache.set(h, v);
        return v;
    };

    // ---------- v4.0: Skript-RAM MERKEN (Befund 10 der Pruefung) ----------
    // getScriptRam wurde im 2-s-Takt fuer jeden fremden Prozess auf jedem der
    // ~70 gerooteten Hosts gerufen. Der Wert haengt nur am Dateiinhalt und
    // aendert sich zwischen zwei Takten nicht. Schluessel ist Host+Datei, weil
    // dieselbe Datei auf zwei Hosts theoretisch unterschiedlich sein kann
    // (scp waehrend eines Umbaus).
    const scriptRamCache = new Map();
    const scriptRamOf = (file, host) => {
        const k = host + "|" + file;
        const hit = scriptRamCache.get(k);
        if (hit !== undefined) return hit;
        let v = 0;
        try { v = ns.getScriptRam(file, host) || 0; } catch (e) { v = 0; }
        // 0 NICHT merken: das heisst "Datei (noch) nicht da" und kann sich im
        // naechsten Takt aendern — ein gemerktes 0 wuerde den Posten `foreign`
        // dauerhaft zu klein halten.
        if (v > 0) scriptRamCache.set(k, v);
        return v;
    };

    while (true) {
        try {
            const slow = (tick % SLOW_EVERY === 0);
            tick++;

            // ============ SLOW-TAKT (alle 16 s) ==================================
            if (slow) {
                const topo = getTopology(ns);
                const all = Object.keys(topo.hosts || {});
                const level = ns.getHackingLevel();
                const player = HAS_FORMULAS ? ns.getPlayer() : null;

                // v-next: Hacknet-Server-RAM nutzen, WENN Hashes in dieser BitNode
                // wertlos sind (z.B. HacknetNodeMoney=0). Normal überspringt scanNetwork
                // sie (jede Fremdbelegung senkt die Hash-Rate) — aber bei wertlosen
                // Hashes ist das egal und ihr RAM ist freie Beute.
                // ENGINE: getNodeStats(i).name = "hacknet-server-N" (nur SF9-Server haben
                // Skript-RAM; Nodes nicht). adminRights sind gesetzt -> exec läuft.
                const feat = bitNodeFeatures(ns);
                // v11.0: Zahlt hack() dem Spieler ueberhaupt Geld? In BN8 nicht
                // (ScriptHackMoneyGain 0) — dort ist die Boerse die einzige
                // Quelle, und die Kursbeeinflussung muss VOR die Geld-Ziele.
                // 0 GB: gelesen wird der bn-Block von INFO.
                hackPays = !hackMoneyWorthless(ns);
                // v11.3 (E): Intelligence-Bonus fuer den share-Deckel.
                // Share.ts ruft calculateIntelligenceBonus(Int, 2), und
                // intelligence.ts ist 1 + weight x Int^0,8 / 600.
                try {
                    const pl = player || ns.getPlayer();
                    const iq = (pl && pl.skills && pl.skills.intelligence) || 0;
                    shareIntBonus = 1 + (2 * Math.pow(Math.max(0, iq), 0.8)) / 600;
                } catch (e) { shareIntBonus = 1; }
                // EVAL-PUFFER aus dem SF4-Level ableiten. Engine (RamCostGenerator.ts:88):
                // Singularity-Kosten × 16 bei SF4 Lvl 1, × 4 bei Lvl 2, × 1 ab Lvl 3
                // (in BN4 immer × 1). Teuerster Call (SingularityFn3 = 5 GB) ergibt damit
                // 80 / 20 / 5 GB — plus Skript-Grundlast. Der Puffer deckt EINEN Call.
                // v9.3: Werte gegen INFOs echte Bündelkosten gerechnet, nicht geschätzt.
                // SCHWARM-INFO bündelt mehrere Singularity-Reads in EIN eval-Skript;
                // die statische RAM eines Skripts ist die Summe der DISTINKTEN
                // Funktionen. Teuerstes Bündel ist crime (cCrimeChance 5 + cCrimeStats
                // 5) = 10 GB × sf4Mult + 2 GB Grundlast. Bei SF4 ≥ 3 also 12 GB —
                // der alte Puffer von 16 GB deckte genau EINES, ohne Reserve für
                // einen zweiten Verbraucher auf demselben Host (WORK und BANK nutzen
                // io.act ebenfalls über evals). 32 GB deckt zwei Bündel mit Luft.
                evalBufferGb = (feat.sf4 <= 0) ? 0
                             : (feat.bitNode === 4) ? 32
                             : (feat.sf4 === 1) ? 192
                             : (feat.sf4 === 2) ? 64 : 32;
                // =============================================================
                // v12.3 — HACKNET-RAM MITBENUTZEN, NICHT ERST WENN ES WERTLOS IST
                // =============================================================
                // Die Bedingung war "hashesWorthless && hacknetServer" — also ein
                // BitNode-Merkmal (ja/nein), keine Wirtschaftsrechnung. In BN10
                // steht hashesWorthless auf false, und damit lagen im Livebericht
                //     "RAM gesamt 8098.4T ... davon hacknet-* 160.0T (belegt 0G)"
                // 160 TB voellig ungenutzt herum.
                //
                // DIE RECHNUNG. Hash-Produktion haengt LINEAR am freien RAM
                // (Hacknet/formulas/HacknetServers.ts:14, ramRatio = 1 - ramUsed/maxRam),
                // der Tausch ist also stufenlos und in beide Richtungen exakt.
                // Gegenwert eines Hashes ist der Bodenpreis von "Sell for Money":
                // 4 Hashes -> 1e6, und dieser Preis steigt als einziger NIE
                // (Hacknet/data/HashUpgradesMetadata.tsx: cost: 4 als Festzahl).
                //     gemessen  526,2 Hashes/s auf 163.840 GB
                //             = 0,00321 Hashes/s je GB = rund 2,9 Mio $ je GB und Stunde
                //     dagegen   Hack-EMA im selben Bericht 968 Mio $ je GB und Stunde
                // Faktor rund 335 zugunsten des Schwarms.
                //
                // UND DIE KERNE. Hacknet-Server duerfen 128 Kerne haben
                // (Hacknet/data/Constants.ts, MaxCores: 128), gekaufte Server immer
                // genau einen. Fuer weaken und grow zaehlt coreBonus = 1+(cores-1)/16,
                // bei 128 Kernen also fast das Neunfache je Thread. Der Dispatcher
                // sortiert diese Stufen ohnehin schon nach Kernen absteigend
                // (byCoresDesc) — die besten Hosts des Netzes waren bloss nie im Pool.
                //
                // DIE GRENZE. Nicht alles hergeben: HN_HASH_RESERVE_FRAC des RAMs
                // bleibt je Host frei, damit anteilig Hashes weiterlaufen (Corp-
                // Forschung, Bladeburner-Rang/SP, Contracts). Weil der Zusammenhang
                // linear ist, sind 25 % Reserve genau 25 % Hash-Rate — keine
                // Schwelle, kein Kipppunkt.
                const hnHosts = [];
                if (feat.hacknetServer) {
                    try {
                        const n = ns.hacknet.numNodes();
                        for (let i = 0; i < n; i++) {
                            const st = ns.hacknet.getNodeStats(i);
                            if (st && st.name && st.name.startsWith("hacknet-server-")) hnHosts.push(st.name);
                        }
                    } catch (e) { /* Hacknet-API weg -> ignorieren */ }
                }
                // Reserve je Server festlegen: sind Hashes in dieser BitNode
                // wertlos, gibt es nichts zu schuetzen — dann alles hergeben.
                hnSet.clear();
                for (const h of hnHosts) hnSet.add(h);
                hnReserveFrac = feat.hashesWorthless ? 0 : HN_HASH_RESERVE_FRAC;

                // =============================================================
                // v11.8 — STANEKS LADEHOST GEHOERT IHM ALLEIN
                // =============================================================
                // Die Ladestaerke ist die Threadzahl EINES Skripts auf EINEM
                // Host (Stanek.ts:53). Sie laesst sich also nicht ueber mehrere
                // Server verteilen — der einzige Weg nach oben ist ein Host, den
                // niemand sonst anfasst. Und weil Hacknet-Server bis zu 128
                // Kerne haben (Hacknet/data/Constants.ts:50, Kernbonus bis 8,94)
                // ist genau dort der beste Platz dafuer.
                //
                // STANEK meldet seinen Ladehost auf Port 25. Dieser Host wird
                // hier aus der Nutzung genommen: keine neuen Worker mehr, und
                // die vorhandenen werden EINMAL geraeumt. Ohne das Raeumen
                // brachte die Ausnahme nichts — die XP-Dauerlaeufer enden von
                // selbst nie (schwarm-wl.js).
                //
                // Geraeumt wird nur, was klein geschrieben mit "schwarm-"
                // beginnt: das sind ausschliesslich Worker. Die Daemons und der
                // Lader heissen "SCHWARM-..." und bleiben unangetastet.
                stanekHost = "";
                try {
                    const roh = ns.peek(SCHWARM_PORTS.STANEK_OUT);
                    if (roh && roh !== "NULL PORT DATA") {
                        const st = JSON.parse(String(roh));
                        // v11.9: "raeumt" kam dazu. STANEK rechnet seine
                        // Threadzahl auf einem Fremdhost seit Payload v2.5 aus
                        // maxRam — der Host ist im Moment der Wahl also noch
                        // voll, und der Lader passt erst NACH der Raeumung
                        // hinein. STANEK meldet deshalb vorab "raeumt".
                        // Ohne diesen Zustand entstuende eine Verklemmung:
                        // der Lader kaeme nicht hinein, meldete "fehler", und
                        // auf "fehler" wuerde hier nicht geraeumt.
                        //
                        // v12.0: "fertig" ist RAUS. Bis v11.9 blieb der Host
                        // auch nach dem Ende der Ladung gesperrt — und seit
                        // Payload v2.5 waehlt STANEK den GROESSTEN Server.
                        // Live gemessen am 04.09. (1.48 PB Pool):
                        //     frei: Dispatcher 99.7T  vs.  real 163.1T
                        // Die 63,4 TB Unterschied waren pserv-0: physisch frei,
                        // fuer den Dispatcher nicht vorhanden. In der
                        // Worker-Verteilung fehlte er ganz, waehrend jeder
                        // andere pserv 37.449 Threads trug — rund 4,8 % der
                        // Rechenleistung lagen brach.
                        //
                        // Festhalten ist auch nicht noetig: die LADUNG haengt
                        // nicht am Prozess. chargeFragment schreibt sie in die
                        // Fragmente (StaneksGift), sie ueberlebt das Ende des
                        // Laders. Und fuer die naechste Ladung holt der
                        // "raeumt"-Handschlag den Host in zwei Takten zurueck —
                        // genau dafuer wurde er in v11.9 gebaut.
                        if (st && st.host && (st.state === "laedt" || st.state === "raeumt")) {
                            stanekHost = String(st.host);
                        }
                    }
                } catch (e) { stanekHost = ""; }

                // v12.0: MERKER ZURUECKSETZEN, SOBALD DER HOST FREI IST.
                //
                // stanekGeraeumt verhindert, dass derselbe Host in jedem Takt
                // erneut leergeraeumt wird. Solange "fertig" den Host festhielt,
                // war das harmlos: er wurde nie wieder freigegeben.
                //
                // Jetzt WIRD er freigegeben — und ohne dieses Zuruecksetzen
                // waere der Merker eine Falle: beim naechsten Nachladen meldet
                // STANEK denselben Host als "raeumt", die Bedingung
                // `stanekHost !== stanekGeraeumt` waere falsch, es wuerde NICHT
                // geraeumt, der Lader kaeme nicht hinein — und die Verklemmung
                // von v11.8 waere zurueck, nur an anderer Stelle.
                if (!stanekHost && stanekGeraeumt) {
                    stanekGeraeumt = "";
                }

                if (stanekHost && stanekHost !== "home" && stanekHost !== stanekGeraeumt) {
                    let weg = 0;
                    try {
                        for (const p of ns.ps(stanekHost)) {
                            if (String(p.filename).startsWith("schwarm-")) { ns.kill(p.pid); weg++; }
                        }
                    } catch (e) { /* Host evtl. gerade weg */ }
                    stanekGeraeumt = stanekHost;
                    if (weg > 0) {
                        ns.tprint("INFO  [DISPATCHER] " + stanekHost + " fuer STANEK freigeraeumt ("
                            + weg + " Worker beendet). Nach der Ladung faellt er"
                            + " wieder in den Pool zurueck.");
                    }
                }

                // --- nutzbare Hosts + Provisionierung ---
                rooted = [];
                for (const h of [...all, ...hnHosts]) {
                    if (h === stanekHost) continue;           // gehoert STANEK allein
                    if (h.startsWith("hacknet-") && !hnHosts.includes(h)) continue;   // nur freigegebene HN-Server
                    if (h === "darkweb") continue;            // gehört dem DARKNET
                    if (h === "home" && !useHome) continue;
                    if (h !== "home" && !ns.hasRootAccess(h)) continue;
                    if (ns.getServerMaxRam(h) <= 0) continue;
                    rooted.push(h);
                    if (!provisioned.has(h)) {
                        // v10 WICHTIG: IMMER kopieren, nicht nur wenn die Datei fehlt.
                        // Vorher stand hier `!ns.fileExists(f, h) && !ns.scp(...)` — auf
                        // Hosts mit einer ALTEN Worker-Version blieb diese liegen, und eine
                        // Payload-Aenderung wirkte nur auf home. Genau so waere der Umstieg
                        // auf One-Shot-share ins Leere gelaufen. `provisioned` ist
                        // prozesslokal, also kopiert jeder Dispatcher-Start genau EINMAL
                        // pro Host neu — danach kein Mehraufwand.
                        let ok = true;
                        for (const f of FILES) if (!ns.scp(f, h, HOST)) ok = false;
                        if (ok) provisioned.add(h);
                    }
                }

                // --- Ziele bewerten ---
                targets = []; prepTargets = [];
                let bestXp = -1; xpTarget = null;
                for (const h of all) {
                    try {
                        if (h === "home" || h === "darkweb") continue;
                        if (h.startsWith("hacknet-") || h.startsWith(PSERV_PREFIX)) continue;
                        if (!ns.hasRootAccess(h)) continue;
                        const info = topo.hosts[h] || {};
                        const maxM = info.maxMoney || 0;
                        const minS = info.minSec || 1;
                        const need = info.skill || 1;

                        // XP-Ziel: bestes XP/s. Braucht KEIN Geld und KEIN Level (nur Root).
                        // ENGINE: netscriptCanWeaken prüft nur Root, nicht das Level.
                        let wt = 1;
                        try { wt = ns.getWeakenTime(h) / 1000; } catch (e) { wt = 1; }
                        // v11.3 (F): baseDifficulty statt minSec — das ist die
                        // Groesse, mit der die Engine rechnet (Hacking.ts:36).
                        const bd = baseDiffOf(h, info.minSec);
                        const xpRate = (3 + bd * 0.3) / Math.max(0.1, wt);
                        if (xpRate > bestXp) { bestXp = xpRate; xpTarget = h; xpWeakenSec = wt; xpBaseDiff = bd; }

                        if (maxM <= 0) continue;

                        if (need > level) {
                            // Stufe 2: noch nicht hackbar — weaken/grow geht trotzdem (nur Root nötig).
                            if (need <= level * PREP_MAX_LEVEL_FACTOR) prepTargets.push({ host: h, maxM, minS, need });
                            continue;
                        }

                        let chance, pct, wtP;
                        if (HAS_FORMULAS) {
                            // B4: am GEPREPPTEN Server rechnen -> zustandsfrei, kein Chance-Bias.
                            const so = ns.getServer(h);
                            const prep = Object.assign({}, so, {
                                hackDifficulty: so.minDifficulty,
                                moneyAvailable: so.moneyMax,
                            });
                            chance = ns.formulas.hacking.hackChance(prep, player);
                            pct = ns.formulas.hacking.hackPercent(prep, player);
                            wtP = ns.formulas.hacking.weakenTime(prep, player) / 1000;
                        } else {
                            const sec = ns.getServerSecurityLevel(h);
                            try { chance = ns.hackAnalyzeChance(h); } catch (e) { chance = 1; }
                            try { pct = ns.hackAnalyze(h); } catch (e) { pct = 0; }
                            // Fallback-Bias: chance/pct sind zustandsabhängig. Nur bei RUHIGEN
                            // Zielen hart filtern (v7-Bugfix bleibt bestehen).
                            if (chance < MIN_HACK_CHANCE && sec <= minS + SEC_TOL) continue;
                            wtP = wt;
                        }
                        if (!(pct > 0) || !(chance > 0)) continue;

                        // --- Score = $/s JE GB eines vollen Ernte-Zyklus (h + g + w) ---
                        const hThr = Math.max(1, Math.ceil(HACK_FRAC / pct));
                        let gThr;
                        if (HAS_FORMULAS) {
                            const so = ns.getServer(h);
                            const after = Object.assign({}, so, {
                                hackDifficulty: so.minDifficulty,
                                moneyAvailable: Math.max(1, so.moneyMax * (1 - HACK_FRAC)),
                            });
                            gThr = Math.max(1, Math.ceil(ns.formulas.hacking.growThreads(after, player, so.moneyMax, 1)));
                        } else {
                            try { gThr = Math.max(1, Math.ceil(ns.growthAnalyze(h, 1 / Math.max(0.01, 1 - HACK_FRAC), 1))); }
                            catch (e) { gThr = 100; }
                        }
                        gThr = Math.min(gThr, GROW_CAP_THREADS);
                        const secAdd = hThr * HACK_SEC_1 + gThr * GROW_SEC_1;
                        const wThr = Math.max(1, Math.ceil(secAdd / WEAKEN_1));
                        const gbCycle = hThr * RAM["hack"] + gThr * RAM["grow"] + wThr * RAM["weaken"];
                        const perSec = (maxM * HACK_FRAC * chance) / Math.max(1, wtP);
                        const score = perSec / Math.max(1, gbCycle);   // $/s je GB

                        targets.push({ host: h, score, perSec, gbCycle, maxM, minS, chance, pct, wt: wtP, hThr, gThr, wThr });
                    } catch (e) { /* Ziel überspringen */ }
                }
                targets.sort((a, b) => b.score - a.score);
                prepTargets.sort((a, b) => a.need - b.need);

                // --- Contracts (billig: ls) ---
                cctTotal = 0;
                for (const h of all) { try { cctTotal += ns.ls(h, ".cct").length; } catch (e) { /* skip */ } }

                // --- Backdoor-Ziele ---
                // v10.4: Die LISTE wird gesammelt, nicht nur gezaehlt — der Start
                // unten braucht die Hostnamen, weil jeder Worker genau ein Ziel
                // bekommt. Reihenfolge: Faktions-Server zuerst (ihr Backdoor loest
                // die Einladung aus), dann nach Level aufsteigend, weil die
                // Wartezeit calculateHackingTime/4 mit dem Level steigt.
                backdoorTargets = [];
                try {
                    for (const h of all) {
                        if (h === "home" || h === "darkweb") continue;
                        if (h === WORLD_DAEMON) continue;   // beendet die BitNode — nur manuell
                        if (h.startsWith("hacknet-") || h.startsWith(PSERV_PREFIX)) continue;
                        if ((topo.hosts[h]?.skill || 0) > level) continue;
                        if (!ns.hasRootAccess(h)) continue;
                        const s = ns.getServer(h);
                        if (s.purchasedByPlayer || s.backdoorInstalled) continue;
                        backdoorTargets.push({ host: h, skill: topo.hosts[h]?.skill || 0 });
                    }
                    backdoorTargets.sort((a, b) =>
                        (BACKDOOR_PRIO.has(b.host) ? 1 : 0) - (BACKDOOR_PRIO.has(a.host) ? 1 : 0)
                        || a.skill - b.skill);
                } catch (e) { /* nicht kritisch */ }
                backdoorPending = backdoorTargets.length;

                // --- v10.7: Beeinflussungsziele des TRADERS (TRADER_OUT.manip, 0 GB) ---
                // Format [{org, dir:"up"|"down", val}]. Der Trader nennt die
                // ORGANISATION; die Zuordnung zum Server macht der Dispatcher, weil
                // er getServer ohnehin bezahlt und der Trader sonst netzweit
                // scannen muesste.
                // v11.0 RUECKKANAL. Zusaetzlich zur Zielliste wird gesammelt,
                // welche Organisationen der Dispatcher UEBERHAUPT bedienen kann.
                //
                // WARUM: Der Trader sortiert seine Wuensche nach Positionswert —
                // das sind die Megacorps, und deren Server sind die am
                // schwersten zu rootenden im Spiel. Im Livereport meldete er
                // ECorp, MegaCorp, Microdyne, Omega Software, AeroCorp und Rho
                // Construction; bedienen konnte der Dispatcher davon zwei. Ein
                // Zyklus spaeter stand im Report sogar "TRADER meldet 6
                // Beeinflussungsziele, der Dispatcher findet dafuer keinen
                // Server". Die Zielwahl war ANTIKORRELIERT mit der Machbarkeit.
                //
                // Der Trader kann das nicht wissen — er kennt keine Server. Der
                // Dispatcher schon. Also meldet er es zurueck (DISP_OUT.manipOk),
                // und der Trader waehlt nur noch aus dieser Menge.
                manipTargets = [];
                manipOk = [];
                try {
                    const want = readManipTargets(ns);
                    const dirOf = new Map();
                    for (const w of want) if (w && w.org && w.dir) dirOf.set(w.org, w.dir);
                    for (const h of all) {
                        if (h === "home" || h === "darkweb") continue;
                        if (h.startsWith("hacknet-") || h.startsWith(PSERV_PREFIX)) continue;
                        if ((topo.hosts[h]?.skill || 0) > level) continue;
                        if (!ns.hasRootAccess(h)) continue;
                        if ((topo.hosts[h]?.maxMoney || 0) <= 0) continue;
                        let org = null;
                        try { org = ns.getServer(h).organizationName; } catch (e) { continue; }
                        if (org) manipOk.push(org);
                    }
                    // Doppelte raus (mehrere Server je Organisation sind moeglich).
                    manipOk = [...new Set(manipOk)];

                    if (want.length > 0) {
                        for (const h of all) {
                            if (h === "home" || h === "darkweb") continue;
                            if (h.startsWith("hacknet-") || h.startsWith(PSERV_PREFIX)) continue;
                            if ((topo.hosts[h]?.skill || 0) > level) continue;
                            if (!ns.hasRootAccess(h)) continue;
                            let sv = null;
                            try { sv = ns.getServer(h); } catch (e) { continue; }
                            if (!sv || !sv.organizationName) continue;
                            const dir = dirOf.get(sv.organizationName);
                            if (!dir) continue;
                            const maxM = topo.hosts[h]?.maxMoney || 0;
                            if (maxM <= 0) continue;
                            // RANG = Impulse pro Minute. Der Effekt haengt an der Zahl
                            // der ABGESCHLOSSENEN Aufrufe, nicht an Threads oder RAM.
                            let gt = 1;
                            try { gt = ns.getGrowTime(h) / 1000; } catch (e) { gt = 1; }
                            gt = Math.max(0.1, gt);
                            // minSec MITSPEICHERN: die Stufe laeuft im Fast-Takt,
                            // wo `topo` nicht im Sichtbarkeitsbereich liegt.
                            const mnS = (topo.hosts[h] && topo.hosts[h].minSec) || 1;
                            manipTargets.push({ host: h, dir, maxM, minSec: mnS, growSec: gt, rate: 60 / gt });
                        }
                        manipTargets.sort((a, b) => b.rate - a.rate);
                        manipTargets = manipTargets.slice(0, MANIP_MAX_TARGETS);
                    }
                } catch (e) { manipTargets = []; }
            }

            // ============ FAST-TAKT (alle 2 s) ===================================
            let reservations = readReservations(ns);
            const now = Date.now();
            // v10.3 (B): Alter der MELDUNG, nicht Alter des Eintrags. Port 6 hatte bis
            // HELPERS v3.6 keinen Zeitstempel; die alte Uhr startete, sobald ein Host
            // zuerst auftauchte, und lief dann durch — auch wenn die Queen jeden Takt
            // frisch schrieb. 0 heisst "Alter unbekannt" (aeltere HELPERS) und darf
            // NICHT als "uralt" gelesen werden, sonst faellt jeder Daemon-Start aus.
            const resAt = readReservationsAt(ns);
            const resAgeMs = resAt > 0 ? (now - resAt) : -1;

            // --- Bestandsaufnahme: EIN ps() je Host, daraus alles ---
            // v10: EINE Zaehlung fuer ALLES. Schluessel "art|ziel", Wert 1-Core-
            // Aequivalent-Threads. Vorher gab es vier getrennte Mechanismen (running,
            // runningPrep, runningXp, shareThr) — und JEDER der vier Bugs dieser Reihe
            // war eine Stufe, die ihren nicht abgefragt hat. Eine Quelle, ueberall
            // benutzt. Gebaut aus ps(): Dateiname gibt die Art, args[0] das Ziel.
            // Das ist Grundwahrheit, keine Buchfuehrung — uebersteht Neustarts und
            // kann nicht driften.
            const flying = new Map();
            // Zielmengen fuer die Klassen-Herleitung bei Workern OHNE args[1]
            // (Uebergang von v10.2 — siehe clsOf).
            const coreSet = new Set(targets.map(t => t.host));
            // v10.3 (C): Schluessel ist jetzt "art|klasse|ziel". Ohne die Klasse
            // teilten sich XP- und CORE-weaken auf demselben Ziel einen Zaehler, und
            // STUFE 1 rechnete ihren Bedarf gegen fremde Threads.
            const keyOf = (k, cls, t) => k + "|" + cls + "|" + t;
            const SHARE_KEY = keyOf("share", CLS_SHARE, "*");
            /**
             * Klasse eines laufenden Workers bestimmen.
             * Bevorzugt args[1] (ab v10.3 gesetzt). Fehlt es — der Prozess stammt aus
             * einer aelteren Dispatcher-Instanz, die noch laeuft —, wird wie bisher
             * aus der Zielzugehoerigkeit hergeleitet. Ohne diesen Rueckfall wuerden
             * Alt-Worker in einen eigenen Schluessel wandern und der Takt wuerde
             * denselben Bedarf ein zweites Mal ausbringen.
             */
            const clsOf = (p, kind, tgt) => {
                const a = p.args && p.args.length > 1 ? String(p.args[1]) : "";
                // v11.2 BUGFIX: CLS_MANIP fehlte in dieser Abfrage. deploy() setzt
                // args[1] = "manip", der Wert war hier aber unbekannt — der Worker
                // fiel durch und wurde ueber die Zielzugehoerigkeit als CORE
                // gebucht. Das war KEIN Anzeigeproblem: coreGbNow() summiert
                // core_w+core_g+core_h+prep, also zaehlte manip-RAM gegen
                // coreCeilGb und schnitt CORE zu frueh ab.
                if (a === CLS_CORE || a === CLS_XP || a === CLS_SHARE || a === CLS_MANIP) return a;
                if (kind === "share") return CLS_SHARE;
                return (tgt === xpTarget && !coreSet.has(tgt)) ? CLS_XP : CLS_CORE;
            };
            const pool = [];
            const idle = [];               // für --diag: Hosts mit ungenutztem RAM + Grund
            let queenAlive = false;
            let reservedGb = 0, reservedHosts = 0;
            const used = { core_w: 0, core_g: 0, core_h: 0, prep: 0, xp: 0, share: 0, manip: 0, foreign: 0 };
            // v10.3 (D): welche Deckel haben in DIESEM Takt tatsaechlich gegriffen?
            // Ersetzt das Sammel-Etikett "Budget/Deckel erschoepft", das jeder
            // Pool-Rest bekam, unabhaengig vom Grund.
            const limits = new Set();
            // v10.5: Rechenweg der XP-Stufe fuer den Snapshot (siehe unten).
            let xpDiag = null;
            // v10.6 (P2): im DIESEN Takt platziertes RAM. `used` wird beim Deploy
            // sofort gebucht, die Messung stammt aber von VOR dem Deploy — ohne
            // diesen Posten meldet die Bilanz mehr belegt als gemessen.
            let placedGb = 0;
            // v10.4: welche Ziele haben SCHON einen laufenden Backdoor-Worker?
            // Grundwahrheit aus ps() (Dateiname + args[0]) statt Buchfuehrung —
            // uebersteht einen Dispatcher-Neustart und kann nicht driften. Genau die
            // Doktrin, mit der v10 die vier Worker-Zaehler auf `flying` reduziert hat.
            const bdRunning = new Set();
            // v12.0: Wo stehen wieviele XP-Dauerlaeufer, und wieviele davon
            // arbeiten noch am ALTEN Ziel? Beides je Takt frisch aus ps().
            const xpLong = new Map();          // host -> {threads, stale}
            // v12.2: zusaetzlich je HOST UND ZIEL. Ohne diese Aufschluesselung
            // konnte die Ernte-Meldung nur "auf home duerfen n Threads weg"
            // sagen — und die Queen griff daneben (Begruendung bei reapXpLong).
            const xpLongZiel = new Map();      // "host\0ziel" -> threads
            let xpLongTotal = 0, xpLongStale = 0;
            evalHosts.clear();   // je Takt neu bestimmen (Daemons wandern)

            for (const h of rooted) {
                try {
                    const cb = coreBonus(coresOf(h));
                    for (const p of ns.ps(h)) {
                        if (p.filename === QUEEN_FILE) queenAlive = true;
                        if (p.filename === BACKDOOR) bdRunning.add(String(p.args[0] || "*"));
                        // Singularity-Daemon hier? -> auf diesem Host Eval-Platz freihalten.
                        if (EVAL_DAEMONS.has(p.filename)) evalHosts.set(h, (evalHosts.get(h) || 0) + 1);

                        let kind = null;
                        if (p.filename === WORKER["weaken"]) kind = "weaken";
                        else if (p.filename === WORKER["grow"]) kind = "grow";
                        else if (p.filename === WORKER["hack"]) kind = "hack";
                        else if (p.filename === WORKER["share"]) kind = "share";
                        else if (p.filename === WORKER["xplong"]) kind = "xplong";
                        // v12.0 BESTANDSAUFNAHME DER DAUERLAEUFER. Sie ist die
                        // Grundlage jeder Ernte-Meldung: nur hier ist bekannt, WO
                        // wieviele stehen und auf WELCHES Ziel sie arbeiten.
                        // Aus ps() gelesen, nicht gebucht — uebersteht Neustarts.
                        if (kind === "xplong") {
                            const t = String(p.args[0]);
                            const e = xpLong.get(h) || { threads: 0, stale: 0 };
                            e.threads += p.threads;
                            // Ein Dauerlaeufer liest args nie neu. Wechselt das
                            // XP-Ziel, arbeitet er fuer immer am alten weiter — der
                            // Bestand waere dann zwar voll, aber am falschen Ort.
                            if (xpTarget && t !== xpTarget) e.stale += p.threads;
                            xpLong.set(h, e);
                            xpLongTotal += p.threads;
                            if (xpTarget && t !== xpTarget) xpLongStale += p.threads;
                            const k2 = h + " " + t;
                            xpLongZiel.set(k2, (xpLongZiel.get(k2) || 0) + p.threads);
                        }
                        if (!kind) {
                            // fremd (Daemons, Solver, Backdoor, manuelle Skripte)
                            // v4.0: GEMERKT statt jedes Mal gefragt. Diese Zeile lief
                            // je Takt fuer JEDEN fremden Prozess auf JEDEM der ~70
                            // gerooteten Hosts — bei 2 s Takt die teuerste Stelle im
                            // Schwarm. Der RAM-Bedarf einer Datei aendert sich aber
                            // praktisch nie; er kann sich nur aendern, wenn die Datei
                            // selbst ersetzt wird, und dann startet der Daemon ohnehin
                            // neu. Gleiches Muster wie coreCache weiter oben.
                            used.foreign += scriptRamOf(p.filename, h) * p.threads;
                            continue;
                        }

                        const ram = RAM[kind] * p.threads;

                        // v10.3: Art aus dem Dateinamen, Ziel aus args[0], KLASSE aus
                        // args[1] (mit Rueckfall fuer Alt-Worker, siehe clsOf).
                        const tgt = (kind === "share") ? "*" : String(p.args[0]);
                        const cls = clsOf(p, kind, tgt);
                        const k = keyOf(kind, cls, tgt);
                        // EINHEIT DER BUCHUNG (v10.5 korrigiert):
                        //   CORE/PREP-weaken und -grow zaehlen in 1-CORE-AEQUIVALENTEN
                        //     (threads x coreBonus). Richtig, weil ihr BEDARF aus der
                        //     Wirkung kommt — getWeakenEffect und die Grow-Formel
                        //     multiplizieren mit coreBonus (ServerHelpers.ts:288/294).
                        //   XP-weaken zaehlt in ECHTEN THREADS. calculateHackingExpGain
                        //     (server, person) kennt KEINEN cores-Parameter, und der
                        //     Sollwert der XP-Stufe ist eine reine RAM-Rechnung
                        //     (poolGb / RAM.weaken). Wurde der Bestand hier mit
                        //     coreBonus aufgeblasen, fiel `need` zu klein aus — auf
                        //     1-Core-pservs unmerklich, auf einem 15-Core-Netzserver
                        //     um Faktor 1,875.
                        //   hack und share: nie Core-gewichtet
                        //     (calculatePercentMoneyHacked kennt keine Cores; bei share
                        //     ist der Bonus logarithmisch und wird bewusst ignoriert).
                        const cored = (kind === "weaken" || kind === "grow") && cls !== CLS_XP;
                        const eff = cored ? p.threads * cb : p.threads;
                        flying.set(k, (flying.get(k) || 0) + eff);
                        // Telemetrie: jetzt entlang der ECHTEN Klasse. Vorher wurde sie
                        // aus der Zielzugehoerigkeit geraten — und lag genau dann falsch,
                        // wenn das XP-Ziel zugleich ein Geld-Ziel ist.
                        if (cls === CLS_SHARE) used["share"] += ram;
                        else if (cls === CLS_XP) used.xp += ram;
                        else if (cls === CLS_MANIP) used.manip += ram;
                        else if (coreSet.has(tgt)) {
                            if (kind === "weaken") used.core_w += ram;
                            else if (kind === "grow") used.core_g += ram;
                            else used.core_h += ram;
                        } else used.prep += ram;
                    }
                } catch (e) { /* Host überspringen */ }
            }

            // --- A3: Reservierungs-Leichen ---
            let resNote = "";
            if (!queenAlive && Object.keys(reservations).length) {
                reservations = {};
                try { ns.getPortHandle(PORT_RES).clear(); } catch (e) { /* egal */ }
                resNote = "QUEEN tot -> Reservierungen verworfen";
            } else if (resAgeMs > RESERVE_STALE_MS) {
                // Die Queen lebt als Prozess, hat aber seit RESERVE_STALE_MS nichts
                // mehr geschrieben -> ihre Schleife haengt. Erst DANN verwerfen.
                reservations = {};
                resNote = `Queen schreibt seit ${Math.round(resAgeMs / 1000)} s nicht mehr -> Reservierungen ignoriert`;
            }

            // --- EVAL-PUFFER: Deadline-Uhr für Hosts mit Singularity-Daemon ---
            // Der Puffer wird im Pool-Aufbau zur Reservierung addiert (nicht hier in
            // `reservations`, sonst würde ihn die STALE-Prüfung oben jeden Takt wieder
            // verwerfen). v10: die Uhr dient nur noch der Diagnose — es gibt keinen
            // Deadline-Kill mehr, One-Shot-Worker räumen den Platz von selbst.
            if (evalBufferGb > 0) {
            }

            // --- Pool bauen ---
            // v10.3 (A): Belegung EXAKT summieren statt aus totalGb - leftGb -
            // reservedGb herleiten. Die alte Herleitung zaehlte homeReserve und nicht
            // provisionierte Hosts als "belegt" und erzeugte damit einen Teil des
            // Postens "nicht klassifiziert".
            let measuredUsedGb = 0;
            // v11.7: home getrennt mitfuehren — die Zahl kostet hier nichts (die
            // Schleife liest maxRam und usedRam ohnehin) und beantwortet die Frage,
            // ob sich ein Kern-Ausbau von home lohnt. Siehe homeCores im Snapshot.
            let homeMaxGb = 0, homeFreeGb = 0;
            for (const h of rooted) {
                try {
                    const hUsed = ns.getServerUsedRam(h);
                    measuredUsedGb += hUsed;
                    if (h === "home") {
                        homeMaxGb = ns.getServerMaxRam(h);
                        homeFreeGb = Math.max(0, homeMaxGb - hUsed);
                    }
                    let free = ns.getServerMaxRam(h) - hUsed;
                    if (h === "home") free -= homeReserve(ns);   // A4: EINE Quelle
                    // v12.3: Auf Hacknet-Servern bleibt ein Anteil frei, damit
                    // weiter Hashes anfallen — dieselbe Bauart wie homeReserve.
                    // Ohne Reserve faellt die Hash-Rate des Servers auf null
                    // (ramRatio = 1 - ramUsed/maxRam). Sind Hashes wertlos, gibt
                    // es nichts zu schuetzen und die Reserve entfaellt.
                    else if (hnReserveFrac > 0 && hnSet.has(h)) {
                        try { free -= ns.getServerMaxRam(h) * hnReserveFrac; } catch (e) { /* egal */ }
                    }

                    let reason = "";
                    // v10 SPERRLISTE statt KILLS. Reservierter Platz wird nur noch
                    // ABGEZOGEN — es wird nichts mehr getoetet. Das genuegt jetzt, weil
                    // fast jeder Worker ein One-Shot ist: er macht einen Aufruf und
                    // endet, der reservierte Platz laeuft also innerhalb einer
                    // Worker-Laufzeit von selbst leer.
                    //
                    // AUSNAHME seit v12.0: der XP-Dauerlaeufer (schwarm-wl.js,
                    // WORKER.xplong) laeuft in einer Endlosschleife. Auf Hosts mit
                    // solchen Prozessen wird der Platz NICHT von selbst frei —
                    // dafuer meldet der Dispatcher der Queen eine Ernte
                    // (reportReap), und die Queen erntet.
                    // Queen-Reservierung und Eval-Puffer ADDIEREN sich (beides gebraucht).
                    const evalRes = (evalBufferGb > 0 && evalHosts.has(h))
                        ? evalBufferGb * Math.min(evalHosts.get(h), 3)   // max. 3 parallele Calls
                        : 0;
                    const res = (reservations[h] || 0) + evalRes;
                    if (res > 0) {
                        reservedHosts++; reservedGb += res;
                        free -= res;
                        reason = "reserviert";
                    }

                    const freeGb = Math.max(0, free);
                    if (!provisioned.has(h)) {
                        if (freeGb > RAM_UNIT) idle.push({ h, gb: freeGb, why: "nicht provisioniert" });
                        continue;
                    }
                    if (freeGb >= RAM_UNIT) {
                        pool.push({ host: h, freeGb, cores: coresOf(h) });
                    } else if (freeGb > 0 && !reason) {
                        idle.push({ h, gb: freeGb, why: "Rest < 1 Thread" });
                    } else if (reason) {
                        idle.push({ h, gb: Math.max(0, res), why: reason });
                    }
                } catch (e) { /* Host überspringen */ }
            }

            const poolGb = () => pool.reduce((s, n) => s + n.freeGb, 0);
            const startGb = poolGb();
            // v9.3: GESAMTKAPAZITÄT der gerooteten Hosts (nicht der freie Rest).
            // Basis für die XP-Kopffreiheit; die Telemetrie unten nutzt denselben Wert
            // weiter, damit es nur EINE Quelle gibt. getServerMaxRam ist bereits
            // bezahlt (0.05 GB je Funktion, nicht je Aufruf).
            //
            // v11.2: DIES IST DIE EINZIGE Gesamtgroesse. Weiter unten stand bis v11.1
            // zusaetzlich `const totalGb = poolTotalGb`, und STUFE 1+2 griff darauf
            // zu — also VOR der Deklaration. `const` ist blockskopiert, das war ein
            // ReferenceError in jedem Takt, sobald hackPays auf false fiel.
            const poolTotalGb = rooted.reduce((a, h) => {
                try { return a + ns.getServerMaxRam(h); } catch (e) { return a; }
            }, 0);
            const startThreads = Math.floor(startGb / RAM_UNIT);

            // --- SOLVER (One-Shot aus dem eigenen Pool) ---
            if (solverPid > 0 && ns.isRunning(solverPid)) solverInfo = "läuft";
            else {
                solverPid = 0;
                if (solverInfo === "läuft") solverInfo = "aus";
                if (slow && cctTotal >= CONTRACT_THRESHOLD) {
                    const node = pool.find(n => n.freeGb >= solverRam);
                    if (node) {
                        if (!ns.fileExists(SOLVER, node.host)) ns.scp(SOLVER, node.host, HOST);
                        const pid = ns.exec(SOLVER, node.host, 1);
                        if (pid > 0) { node.freeGb -= solverRam; solverPid = pid; solverInfo = `läuft@${node.host}`; }
                    } else solverInfo = "wartet auf RAM";
                }
            }

            // --- BACKDOOR (One-Shots, PARALLEL; owner = HACKING) ---
            //
            // ENGINE (Singularity.ts:518-556): installBackdoor() liest
            // Player.getCurrentServer() EINMAL und friert den Server in einer lokalen
            // Konstante ein, BEVOR netscriptDelay() laeuft. Ein anderer Prozess, der
            // waehrend der Wartezeit die Verbindung wechselt, beeinflusst den
            // laufenden Backdoor also nicht mehr -> mehrere Worker parallel sind
            // sicher. Zusaetzlich blockiert netscriptDelay nur den AUFRUFENDEN
            // Prozess und ruft kein Player.startWork() -> kein Konflikt mit WORK.
            //
            // GATE (v10.4-BUGFIX): NICHT isDaemonEnabled. BACKDOOR traegt
            // `triggered: true`, und isDaemonEnabled liefert dafuer ohne
            // State-Eintrag FALSE — ein Eintrag entsteht aber nur durch einen
            // Schalter, den das Dashboard fuer triggered-Daemons gar nicht anzeigt.
            // Die Freigabe war damit unerreichbar und der Payload lief NIE.
            // `triggered` bedeutet "die QUEEN startet das nicht von selbst"; der
            // Ausloeser ist hier der Dispatcher. Also gilt: alles ausser einer
            // ausdruecklichen 0 heisst ja.
            {
                const stNow = readManagedState(ns);
                const allowed = stNow.BACKDOOR !== 0;
                if (!allowed) {
                    backdoorInfo = "aus (Schalter)";
                } else if (backdoorPending === 0) {
                    backdoorInfo = bdRunning.size > 0
                        ? `${bdRunning.size} laufen` : "nichts offen";
                } else {
                    let started = 0;
                    if (slow) {
                        for (const t of backdoorTargets) {
                            if (bdRunning.size + started >= BACKDOOR_MAX_PARALLEL) break;
                            if (bdRunning.has(t.host)) continue;      // laeuft schon
                            const node = pool.find(n => n.freeGb >= backdoorRam);
                            if (!node) { backdoorInfo = "wartet auf RAM"; break; }
                            if (!ns.fileExists(BACKDOOR, node.host)) ns.scp(BACKDOOR, node.host, HOST);
                            const pid = ns.exec(BACKDOOR, node.host, 1, t.host);
                            if (pid > 0) {
                                node.freeGb -= backdoorRam;
                                bdRunning.add(t.host);
                                started++; backdoorDone++;
                            } else {
                                // exec abgelehnt -> Host diesen Takt sperren und
                                // beim naechsten Ziel einen anderen nehmen.
                                node.freeGb = 0;
                            }
                        }
                    }
                    if (backdoorInfo !== "wartet auf RAM") {
                        backdoorInfo = `${bdRunning.size} laufen / ${backdoorPending} offen`
                            + (started > 0 ? ` (+${started} gestartet)` : "");
                    }
                }
            }

            // ===================== DEPLOY =========================================
            // A1: Budget JE STUFE. XP bekommt garantiert einen exec je Host.
            const budget = {
                core: Math.max(40, pool.length * 2),
                prep: Math.max(15, pool.length),
                share: Math.max(10, Math.ceil(pool.length / 2)),
                xp: pool.length + 8,
                rest: pool.length + 8,
            };

            // B2: drei Sortierungen auf DENSELBEN Node-Objekten (freeGb propagiert).
            const byCoresDesc = [...pool].sort((a, b) => (b.cores - a.cores) || (b.freeGb - a.freeGb));
            const byCoresAsc = [...pool].sort((a, b) => (a.cores - b.cores) || (b.freeGb - a.freeGb));
            const bySmallFirst = [...pool].sort((a, b) => (a.freeGb - b.freeGb) || (a.cores - b.cores));

            /**
             * Worker starten. v10: keine Klasse, keine Seq, kein Delay — der Worker
             * bekommt genau EIN Argument (das Ziel), share gar keins.
             *
             * ENGINE (NetscriptHelpers.tsx:257): runOpts.preventDuplicates ist per
             * Standard FALSE. Identische exec-Aufrufe erzeugen also getrennte Prozesse;
             * ein Unterscheidungs-Argument ist nicht noetig. Die Prozesszahl bleibt
             * begrenzt, weil immer nur (Bedarf minus flying) gefeuert wird.
             *
             * @param {"weaken"|"grow"|"hack"|"share"} kind
             * @param {number} want   Bedarf in 1-CORE-AEQUIVALENT-Threads
             * @param {string} target Ziel ("*" bei share)
             * @param {Array}  order  Host-Reihenfolge
             * @param {string} bkey   Budget-Topf
             * @param {string} cls    Klassenmarke (args[1])
             * @param {boolean} infl  Kurs beeinflussen? (args[2])
             */
            const deploy = (kind, want, target, order, bkey, cls, infl) => {
                let left = Number.isFinite(want) ? Math.floor(want) : 0;
                if (left <= 0) return;
                const ramPer = RAM[kind];
                // v10.5: dieselbe Einheiten-Regel wie in der ps-Buchung oben — sonst
                // rechnet der Takt gegen seinen eigenen Bestand in fremder Einheit.
                const cored = (kind === "weaken" || kind === "grow") && cls !== CLS_XP;
                const key = keyOf(kind, cls, target);
                for (const node of order) {
                    if (left <= 0) break;
                    if (budget[bkey] <= 0) { limits.add("Budget " + bkey); break; }
                    const canFit = Math.floor(node.freeGb / ramPer);
                    if (canFit <= 0) continue;
                    const cb = cored ? coreBonus(node.cores) : 1;
                    const wantHere = Math.max(1, Math.ceil(left / cb));
                    const starten = Math.min(wantHere, canFit);
                    // v10.3: args[1] = Klassenmarke. Der Worker liest sie NIE; sie
                    // existiert allein fuer die Erkennung ueber ps().args[1]. share
                    // ruft ns.share() parameterlos auf, bekommt die Argumente aber
                    // trotzdem — sonst waeren share-Prozesse die einzigen ohne Marke.
                    // v10.7 args[2]: "1" = dieser Aufruf beeinflusst den Kurs.
                    // Nur STUFE 3b setzt es, und dort nur auf der passenden Seite.
                    const pid = ns.exec(WORKER[kind], node.host, starten, target, cls, infl ? "1" : "0");
                    if (pid > 0) {
                        node.freeGb -= starten * ramPer;
                        left -= Math.floor(starten * cb);
                        budget[bkey]--; execOk++;
                        // Im SELBEN Takt mitbuchen: deploy verteilt ueber mehrere Hosts,
                        // sonst sieht jeder Host die volle Restmenge.
                        flying.set(key, (flying.get(key) || 0) + starten * cb);
                        // v10.3 (A): Klassen-Bilanz sofort fortschreiben. Vorher entstand
                        // used.* ausschliesslich VOR dem Deploy, waehrend leftGb DANACH
                        // gemessen wurde — der Unterschied landete als "nicht
                        // klassifiziert" in der Diagnose (live 608 GB = 10 % des Netzes).
                        const gb = starten * ramPer;
                        placedGb += gb;                       // v10.6 (P2)
                        if (cls === CLS_SHARE) used["share"] += gb;
                        else if (cls === CLS_XP) used.xp += gb;
                        else if (cls === CLS_MANIP) used.manip += gb;
                        else if (coreSet.has(target)) {
                            if (kind === "weaken") used.core_w += gb;
                            else if (kind === "grow") used.core_g += gb;
                            else used.core_h += gb;
                        } else used.prep += gb;
                    } else {
                        execFail++;
                        node.freeGb = 0;   // Rechnung stimmte nicht -> Host diesen Takt sperren
                    }
                }
                if (left > 0) limits.add("Ziel-Deckel");
            };

            /**
             * Wellenzahl aus der GEMESSENEN Worker-Laufzeit (v10.5).
             *
             * Sinn der Wellen: starten alle Worker im selben Takt, enden sie auch
             * gemeinsam — dann faellt der Bestand auf 0 und das RAM ist fuer einen
             * Takt komplett frei. Die Verteilung ueber mehrere Takte bricht diese
             * Synchronitaet. Abgedeckt werden muss dafuer genau EINE Laufzeit; mehr
             * bringt nichts und weniger laesst Leerstand.
             *
             * Der alte Festwert 8 war fuer 13,6-s-Worker bei 2-s-Takt gedacht. Bei
             * kurzen Laufzeiten drosselt er den Nachschub unter das, was zum Halten
             * des Bestands noetig ist — dann ERZEUGT der Deckel den Leerlauf, den er
             * verhindern soll (live: 135 TB dauerhaft brach).
             *
             * @param {number} sec  gemessene Laufzeit in Sekunden (0 = unbekannt)
             * @returns {number}    Zahl der Takte, ueber die verteilt wird
             */
            const fillTicksFor = (sec) => {
                if (!(sec > 0)) return FILL_TICKS_MAX;      // unbekannt -> vorsichtig
                const t = Math.ceil((sec * 1000) / LOOP_MS);
                return Math.min(FILL_TICKS_MAX, Math.max(FILL_TICKS_MIN, t));
            };
            const fillTicks = fillTicksFor(xpWeakenSec);

            /**
             * Wellen-Portion (v10.6 erweitert).
             *
             * Gestaffelt wird jetzt BEIDES:
             *   das SOLL   (total / ticks)  — richtig im Gleichgewicht, wo der
             *                                 Bestand steht und nur umgewaelzt wird;
             *   der PLATZ  (fits / ticks)   — richtig beim AUFFUELLEN, wo `need` so
             *                                 gross ist wie das Loch.
             * Ohne den zweiten Teil war der Deckel wirkungslos, sobald `need` knapp
             * unter total/ticks lag (live 79.656 gegen 80.748): dann startete alles
             * in einem Takt und endete gemeinsam — die Thread-Zahl sprang im
             * 2-s-Wechsel um 48.000 auf und ab.
             *
             * @param {number} total  Sollbestand in Threads
             * @param {number} need   offener Bedarf
             * @param {number} [fits] freier Platz in Threads (0/undefined = kein Limit)
             * @param {number} [ticks]
             */
            // v11.5 UEBERSCHUSS-AUSNAHME.
            //
            // Der Wellen-Deckel loest ein SYNCHRONITAETS-Problem: starten alle Worker
            // im selben Takt, enden sie auch gemeinsam, der Pool faellt auf null und
            // wird schlagartig neu gefuellt. Das Staffeln bricht diesen Gleichschritt.
            //
            // Er setzt aber voraus, dass der Pool ueberhaupt KNAPP ist. Bleibt
            // dauerhaft ein grosser Rest frei, gibt es keinen Gleichschritt zu
            // brechen — dann bremst der Deckel nur noch. Livebeleg (BitNode 13):
            //     frei 4,4T .. 5,5T durchgehend, bei 27,9T Pool
            //     XP-Stufe: Bedarf 3491 thr -> Portion 437 thr je Takt (1/8)
            // und die Diagnose meldete dazu selbst "er fuellt den Pool nicht auf".
            //
            // Liegt der freie Anteil ueber der oberen Schwelle, wird nicht
            // gestaffelt. Die Gefahr, die der Deckel abwehrt, existiert in dieser
            // Lage nicht: was jetzt platziert wird, findet beim Auslaufen wieder
            // Platz vor. Unterhalb der UNTEREN Schwelle wird wieder gestaffelt;
            // dazwischen bleibt es beim bisherigen Zustand (Hysterese, s. o.).
            const freiFrac = poolTotalGb > 0 ? (poolGb() / poolTotalGb) : 0;
            if (freiFrac >= WAVE_BYPASS_ON) waveBypassLatch = true;
            else if (freiFrac < WAVE_BYPASS_OFF) waveBypassLatch = false;
            const waveBypass = waveBypassLatch;

            // =================================================================
            // v11.8 BUGFIX — DER BYPASS SCHALTETE SICH AB, WENN ER GEBRAUCHT WURDE
            // =================================================================
            // freiFrac ist der MOMENTAN freie Anteil. Nach einem Pulk-Tod der
            // XP-Flotte ist er nahe 1,0 — der Riegel sprang also genau dann auf
            // AN, wenn die gesamte Flotte neu zu platzieren war. Ergebnis: alle
            // Worker starteten wieder im selben Takt, liefen gleich lang und
            // starben erneut gemeinsam. Der Ueberschuss, der die Staffelung
            // abschaltet, entsteht durch den Pulk, den die Staffelung verhindern
            // soll. Selbstverstaerkend.
            //
            // Livebeleg (Bericht 17:55, Logbuch):
            //     [ 8.6s] WORKER Threads    2335 -> 4477095   (+4474760)
            //     [32.9s] WORKER Threads 4476905 ->    2471   (-4474434)
            //     [39.0s] WORKER Threads    2355 ->    6077
            // und in der Spur zwei Messungen spaeter beide Messgeraete auf 0 %.
            //
            // Die urspruengliche Begruendung ("bei viel freiem Platz gibt es
            // keinen Gleichschritt, den man brechen muesste") stimmt fuer die
            // CORE- und manip-Stufen: die platzieren kleine, zielgebundene
            // Mengen. Fuer die XP-Stufe ist sie falsch — die fuellt per Definition
            // den GESAMTEN Rest mit identischen Workern auf EIN Ziel. Sofort
            // platzieren IST dort der Gleichschritt.
            //
            // Deshalb kein neuer Schwellwert und keine Zaehler-Heuristik, sondern
            // die Aussage selbst: die XP-Stufe staffelt IMMER.
            // NACHTRAG v12.0: gilt nicht mehr. Die XP-Stufe ruft wave() gar
            // nicht auf (siehe "KEIN Wellen-Deckel" weiter unten) — seit den
            // Dauerlaeufern waere Staffeln nur noch Leerstand.
            const wave = (total, need, fits, ticks, darfBypass = true) => {
                if (waveBypass && darfBypass) { limits.add("Wellen-Deckel ausgesetzt (Ueberschuss)"); return need; }
                const n = ticks || fillTicks;
                let portion = Math.max(1, Math.ceil(total / n));
                if (fits > 0) portion = Math.min(portion, Math.max(1, Math.ceil(fits / n)));
                if (portion < need) limits.add("Wellen-Deckel (" + n + " Takte)");
                return Math.min(need, portion);
            };

            // =================================================================
            // KURSBEEINFLUSSUNG als eigene Stufe (v11.0 herausgezogen)
            // =================================================================
            // Der Block stand bis v10.7 als "STUFE 3b" NACH den Geld-Zielen und
            // NACH share — und bekam damit nur, was CORE uebriggelassen hatte.
            // Der Dispatcher fuellt den Pool aber absichtlich bis an den Rand:
            // poolGb() ist an dieser Stelle typisch 4-23 GB, mal 0,35 also
            // 1-8 GB. Im Livereport stand deshalb dauerhaft
            //     Klasse "manip": 0G ... Impuls-Aufrufe im letzten Takt: 1 (2G)
            // waehrend core_w/g/h zusammen 2,9 TB hielten.
            //
            // In einer normalen BitNode ist das vertretbar — dort verdient CORE
            // das Geld und die Beeinflussung ist ein Zubrot. In BN8 ist es
            // genau falsch herum: dort zahlt hack() dem Spieler NICHTS
            // (ScriptHackMoneyGain 0) und die Boerse ist die einzige Geldquelle.
            // 83 % des Pools liefen also fuer null Dollar, und die einzige
            // Quelle bekam 0,03 %.
            //
            // Deshalb ist die Stufe jetzt eine Funktion, die an ZWEI Stellen
            // gerufen werden kann — je nachdem, ob Hacking in dieser BitNode
            // ueberhaupt zahlt. Der Inhalt ist unveraendert.
            const runManipStage = (frac) => {
                if (manipTargets.length === 0 || budget.core <= 0) return;
                let mgb = poolGb() * frac;
                manipDiag = {
                    targets: manipTargets.length,
                    calls: 0, gb: 0,            // Aufrufe MIT Impuls (stock-Flag)
                    space: 0, spaceGb: 0,       // v11.3: Platz schaffen, OHNE Impuls
                    weaken: 0, weakenGb: 0,     // v11.3: Sicherheit senken
                    top: manipTargets[0].host, rate: +manipTargets[0].rate.toFixed(1),
                };
                /**
                 * v11.3 (A): offener Bedarf einer Art auf einem Ziel.
                 *
                 * Bis v11.2 fehlte diese Verrechnung vollstaendig — die Stufe brachte
                 * jeden 2-s-Takt den vollen Bedarf erneut aus, waehrend die alten
                 * Worker noch liefen. Bei einem hochstufigen Ziel ist total rund 3400
                 * Threads (5,8 TB), und grow/hack laufen dort minutenlang: live 4,0 TB
                 * in der Klasse manip bei NULL Impuls-Aufrufen.
                 *
                 * EINHEITEN (wie in der ps-Buchung und in deploy): weaken und grow
                 * zaehlen in 1-CORE-AEQUIVALENTEN, hack in echten Threads. Beide
                 * Bedarfsrechnungen unten liefern genau das — growthAnalyze(host, m, 1)
                 * und (sec - minSec)/WEAKEN_1 sind 1-Core-Werte, MANIP_CHUNK/hackAnalyze
                 * ist eine reine Thread-Zahl.
                 */
                const openNeed = (kind, host, total) =>
                    total - (flying.get(keyOf(kind, CLS_MANIP, host)) || 0);

                for (const m of manipTargets) {
                    if (mgb < RAM_UNIT) { limits.add("manip-Anteil"); break; }
                    let money = 0, sec = 0;
                    try { money = ns.getServerMoneyAvailable(m.host); } catch (e) { money = 0; }
                    try { sec = ns.getServerSecurityLevel(m.host); } catch (e) { sec = 0; }
                    const minS = m.minSec || 1;

                    // ---- ZUERST: SICHERHEIT (v11.3 B, vorgezogen) ----------------
                    // Der Block stand bis v11.2 am ENDE der Ziel-Schleife und rechnete
                    // mit dem, was `mgb` nach dem hack-Abzug uebrig liess. Frisst hack
                    // alles, bekommt weaken null -> Sicherheit steigt -> und
                    // calculateHackingTime skaliert LINEAR mit hackDifficulty
                    // (Hacking.ts:64: difficultyMult = requiredHackingSkill x
                    // hackDifficulty). Langsameres grow/hack heisst weniger
                    // ABGESCHLOSSENE Aufrufe je Minute — also weniger Impulse, genau
                    // die Groesse, um die es hier geht.
                    // Der Bedarf ist klein und exakt bezifferbar: 200 Threads Deckel
                    // sind 350 GB gegen mehrere TB fuer hack/grow. Vorrang kostet also
                    // praktisch nichts und sichert die Impulsrate.
                    // KORRIGIERT: der alte Code nahm min(MANIP_WEAKEN_MAX, mgb/RAM) —
                    // also stets 200 Threads, unabhaengig vom echten Bedarf.
                    if (sec > minS + SEC_TOL * 2) {
                        const totalW = Math.min(MANIP_WEAKEN_MAX,
                            Math.max(1, Math.ceil((sec - minS) / WEAKEN_1)));
                        const needW = openNeed("weaken", m.host, totalW);
                        if (needW > 0) {
                            const fit = Math.min(needW, Math.floor(mgb / RAM["weaken"]));
                            if (fit > 0) {
                                deploy("weaken", fit, m.host, byCoresDesc, "core", CLS_MANIP, false);
                                mgb -= fit * RAM["weaken"];
                                manipDiag.weaken++; manipDiag.weakenGb += fit * RAM["weaken"];
                            }
                        }
                        if (mgb < RAM_UNIT) { limits.add("manip-Anteil"); break; }
                    }

                    // ---- DANN: Impuls bzw. Platz dafuer schaffen ------------------
                    // KEIN Wellen- oder Anteilsdeckel auf dem Platz-schaffen-hack
                    // (v11.3 C): calculateHackingTime kennt keinen Threads-Parameter,
                    // die Laufzeit eines Aufrufs haengt also nicht an der Threadzahl.
                    // Der Zyklus hack -> grow dauert immer 4,2 x T; ein kleinerer
                    // Chunk heisst gleiche Zeit, weniger Impuls. Ein Deckel wuerde die
                    // Impulsrate SENKEN statt sie zu schuetzen.
                    if (m.dir === "up") {
                        if (money > m.maxM * (1 - MANIP_CHUNK)) {
                            // Platz schaffen — OHNE Impuls, sonst senkt der hack
                            // genau den Kurs, den der grow gleich heben soll.
                            let pct = 0;
                            try { pct = ns.hackAnalyze(m.host); } catch (e) { pct = 0; }
                            const totalH = Math.max(1, Math.ceil(MANIP_CHUNK / Math.max(1e-9, pct || 0.001)));
                            const needH = openNeed("hack", m.host, totalH);
                            if (needH > 0) {
                                const fit = Math.min(needH, Math.floor(mgb / RAM["hack"]));
                                if (fit > 0) {
                                    deploy("hack", fit, m.host, byCoresAsc, "core", CLS_MANIP, false);
                                    mgb -= fit * RAM["hack"];
                                    manipDiag.space++; manipDiag.spaceGb += fit * RAM["hack"];
                                }
                            } else limits.add("manip: Platz-schaffen laeuft schon");
                        } else {
                            let thr = 0;
                            try { thr = Math.ceil(ns.growthAnalyze(m.host, 1 / Math.max(0.01, 1 - MANIP_CHUNK), 1)); }
                            catch (e) { thr = 0; }
                            if (thr > 0) {
                                const needG = openNeed("grow", m.host, thr);
                                if (needG > 0) {
                                    const fit = Math.min(needG, Math.floor(mgb / RAM["grow"]));
                                    if (fit > 0) {
                                        deploy("grow", fit, m.host, byCoresDesc, "core", CLS_MANIP, true);
                                        mgb -= fit * RAM["grow"];
                                        manipDiag.calls++; manipDiag.gb += fit * RAM["grow"];
                                    }
                                } else limits.add("manip: Impuls laeuft schon");
                            }
                        }
                    } else {
                        if (money < m.maxM * MANIP_CHUNK) {
                            // Auffuellen — ohne Impuls (der grow wuerde den Kurs heben).
                            let thr = 0;
                            try { thr = Math.ceil(ns.growthAnalyze(m.host, 2, 1)); } catch (e) { thr = 0; }
                            if (thr > 0) {
                                const needG = openNeed("grow", m.host, thr);
                                if (needG > 0) {
                                    const fit = Math.min(needG, Math.floor(mgb / RAM["grow"]));
                                    if (fit > 0) {
                                        deploy("grow", fit, m.host, byCoresDesc, "core", CLS_MANIP, false);
                                        mgb -= fit * RAM["grow"];
                                        manipDiag.space++; manipDiag.spaceGb += fit * RAM["grow"];
                                    }
                                } else limits.add("manip: Platz-schaffen laeuft schon");
                            }
                        } else {
                            let pct = 0;
                            try { pct = ns.hackAnalyze(m.host); } catch (e) { pct = 0; }
                            const totalH = Math.max(1, Math.ceil(MANIP_CHUNK / Math.max(1e-9, pct || 0.001)));
                            const needH = openNeed("hack", m.host, totalH);
                            if (needH > 0) {
                                const fit = Math.min(needH, Math.floor(mgb / RAM["hack"]));
                                if (fit > 0) {
                                    deploy("hack", fit, m.host, byCoresAsc, "core", CLS_MANIP, true);
                                    mgb -= fit * RAM["hack"];
                                    manipDiag.calls++; manipDiag.gb += fit * RAM["hack"];
                                }
                            } else limits.add("manip: Impuls laeuft schon");
                        }
                    }
                }
            };

            // BN8 & Co: die Beeinflussung ZUERST bedienen, und mit dem Loewenanteil.
            // hackPays kommt aus dem bn-Block des INFO-Daemons (0 GB); faellt INFO
            // aus, gilt konservativ "Hacking zahlt" und alles laeuft wie bisher.
            if (!hackPays) runManipStage(MANIP_POOL_FRAC_LEAD);

            // ---- STUFE 1+2: ZIELE (bewertete + Prep in EINER Schleife) ----
            // v10: zusammengelegt. Die Logik war identisch, nur durfte auf Prep-Zielen
            // nicht gehackt werden (Level fehlt). Ein Zweig statt zwei halber.
            const perTargetCap = Math.max(1, Math.floor(startThreads * MAX_TARGET_FRAC));
            // v10.7: Ein Server ist Geldziel ODER Beeinflussungsziel, nie beides —
            // sonst hackt CORE, waehrend manip growt, und beide heben sich auf.
            // In BN8 kostet das nichts (jedes Geldziel wirft ohnehin 0 ab); in
            // anderen BitNodes gewinnt die Beeinflussung nur, solange der Trader
            // die Position wirklich haelt, denn nur dann meldet er sie.
            // =================================================================
            // CORE-DECKEL, wenn Hacking kein Geld bringt (v11.1)
            // =================================================================
            // v11.0 hat die Beeinflussung VOR die Geld-Ziele gezogen. Das half
            // sofort (manip 1 GB -> 230 GB, Impulse 0,8/min -> 25/min), hielt
            // aber nicht: im zweiten Messlauf war manip wieder bei 80 GB, und
            // der Pool meldete beim Tick-Start nur 63 GB frei von 5,5 TB.
            //
            // Die Reihenfolge INNERHALB eines Takts reicht eben nicht. CORE hat
            // keine Obergrenze — es nimmt jeden Takt, was frei ist, und seine
            // Worker laufen bei Level ~1200 auf grossen Servern MINUTENLANG.
            // Was CORE in Takt n belegt, fehlt in Takt n+1, n+2, ... Ein
            // Vorrang beim Verteilen nuetzt nichts, wenn nichts mehr zu
            // verteilen ist.
            //
            // Also braucht CORE eine echte RAM-Decke. `used.*` wird von deploy()
            // live fortgeschrieben (v10.3), die Pruefung sieht also auch die
            // Platzierungen DIESES Takts.
            //
            // WARUM NICHT NULL: CORE ist in BN8 nicht wertlos, nur unbezahlt.
            // Es haelt die Ziele auf minSec und moneyMax — genau der Untergrund,
            // den die Beeinflussung braucht (ein Server auf moneyMax laesst sich
            // nicht mehr hochgrowen, einer mit hoher Sicherheit growt langsam).
            // Und der XP-Ertrag ist die Voraussetzung dafuer, ueberhaupt an die
            // grossen Organisationen heranzukommen.
            const coreGbNow = () => (used.core_w || 0) + (used.core_g || 0)
                + (used.core_h || 0) + (used.prep || 0);
            // v11.2 BUGFIX: hier stand `totalGb`, das erst im Telemetrie-Block
            // WEITER UNTEN deklariert wird. `const` ist blockskopiert -> Zugriff
            // davor wirft ReferenceError (Temporal Dead Zone). Ausgeloest hat es
            // erst der Wechsel von hackPays auf false, weil der else-Zweig davor
            // gar nicht ausgewertet wurde. Ab da crashte JEDER Takt an dieser
            // Zeile: keine Ziele mehr bedient, kein share, kein XP, kein Port-25-
            // Snapshot. Gerechnet wird jetzt mit poolTotalGb, das hier laengst steht.
            const coreCeilGb = hackPays ? Infinity : poolTotalGb * CORE_MAX_SHARE_NOPAY;

            // =================================================================
            // BUGFIX v11.4 — DIE DECKE WAR NUR EIN TUERSTEHER, KEIN MASSBAND
            // =================================================================
            // Die Pruefung stand ausschliesslich am SCHLEIFENKOPF, also einmal je
            // Ziel. Ein einzelner Ziel-Durchgang darf aber bis perTargetCap
            // platzieren (MAX_TARGET_FRAC = 0,35 des Pools) — zwei Ziele reichen
            // damit, um die 45-%-Decke zu ueberspringen, ohne sie je zu "sehen".
            //
            // Livebeleg (Zyklus 1): core_w 7,2 TB von 7,7 TB, also 94 % statt 45 %.
            // Pool frei 0 GB, execOk 0, manip 0 GB, XP 10,6/s statt ueber 4000 —
            // der ganze Schwarm stand, weil 4219 weaken-Worker auf hochstufigen
            // Zielen minutenlang liefen und nichts mehr nachrücken konnte. In der
            // Deckel-Liste tauchte "CORE-Deckel" nicht einmal auf: poolGb() war 0,
            // also brach die Schleife schon an der Zeile davor ab.
            //
            // JETZT wird JEDE Platzierung auf den Restplatz unter der Decke
            // beschnitten. capCore() ist bewusst die letzte Instanz vor deploy():
            // wave() staffelt ueber Takte, perTargetCap begrenzt je Ziel, capCore
            // begrenzt die SUMME.
            const capCore = (threads, kind) => {
                if (!isFinite(coreCeilGb)) return threads;
                const room = Math.max(0, coreCeilGb - coreGbNow());
                const fit = Math.floor(room / RAM[kind]);
                if (fit < threads) limits.add("CORE-Deckel (Hacking zahlt nicht)");
                return Math.max(0, Math.min(threads, fit));
            };

            const manipHosts = new Set(manipTargets.map(m => m.host));
            const work = [
                ...targets.filter(t => !manipHosts.has(t.host))
                          .map(t => ({ host: t.host, minS: t.minS, maxM: t.maxM, pct: t.pct, hackable: true })),
                ...prepTargets.slice(0, PREP_MAX_TARGETS).map(t => ({ host: t.host, minS: t.minS, maxM: t.maxM, pct: 0, hackable: false })),
            ];
            for (const t of work) {
                if (poolGb() < RAM_UNIT || budget.core <= 0) break;
                if (coreGbNow() >= coreCeilGb) { limits.add("CORE-Deckel (Hacking zahlt nicht)"); break; }
                try {
                    const sec = ns.getServerSecurityLevel(t.host);
                    const money = Math.max(1, ns.getServerMoneyAvailable(t.host));

                    if (sec > t.minS + SEC_TOL) {
                        const total = Math.min(Math.ceil((sec - t.minS) / WEAKEN_1), perTargetCap);
                        // v10.3 (C): nur CORE-Threads gegenrechnen. Vorher stand hier der
                        // gemeinsame Schluessel, und auf einem Ziel, das zugleich XP-Ziel
                        // ist, machten die XP-Threads need dauerhaft negativ.
                        const need = total - (flying.get(keyOf("weaken", CLS_CORE, t.host)) || 0);
                        if (need > 0) deploy("weaken", capCore(wave(total, need), "weaken"), t.host, byCoresDesc, "core", CLS_CORE);
                        else limits.add("Bedarf gedeckt");

                    } else if (money < t.maxM * MONEY_OK) {
                        let raw = 0;
                        try { raw = Math.ceil(ns.growthAnalyze(t.host, t.maxM / money, 1)); }
                        catch (e) { raw = perTargetCap; }
                        if (!Number.isFinite(raw) || raw <= 0) raw = perTargetCap;
                        const total = Math.min(raw, GROW_CAP_THREADS, perTargetCap);
                        const need = total - (flying.get(keyOf("grow", CLS_CORE, t.host)) || 0);
                        if (need > 0) deploy("grow", capCore(wave(total, need), "grow"), t.host, byCoresDesc, "core", CLS_CORE);
                        else limits.add("Bedarf gedeckt");

                    } else if (t.hackable) {
                        // hack kennt KEINEN Core-Bonus -> auf die core-armen Hosts.
                        const total = Math.min(t.pct > 0 ? Math.ceil(HACK_FRAC / t.pct) : perTargetCap, perTargetCap);
                        const need = total - (flying.get(keyOf("hack", CLS_CORE, t.host)) || 0);
                        if (need > 0) deploy("hack", capCore(wave(total, need), "hack"), t.host, byCoresAsc, "core", CLS_CORE);
                        else limits.add("Bedarf gedeckt");
                    }
                } catch (e) { /* Ziel überspringen */ }
            }

            // ---- STUFE 3: KURSBEEINFLUSSUNG ----
            // Zahlt Hacking in dieser BitNode Geld, laeuft die Beeinflussung als
            // Zubrot NACH den Geld-Zielen. Zahlt es nichts, wurde sie schon oben
            // mit Vorrang bedient (siehe runManipStage).
            // v11.3 (D): share ist von hier nach STUFE 5 gewandert. Es stand
            // vorher VOR dieser Stufe und vor XP und nahm 40 % des freien Pools —
            // in BN8, wo CORE keinen Dollar bringt, war das genau falsch herum.
            if (hackPays) runManipStage(MANIP_POOL_FRAC);

            // Grind-Flag EINMAL lesen — der Wert steht im Snapshot und im Log,
            // gebraucht wird er erst in STUFE 5.
            const shareWanted = readShareWanted(ns);

            // ---- STUFE 4: XP-WEAKEN (Ueberschuss verwerten) ----
            // ENGINE: calculateHackingExpGain(server, person) kennt KEINEN cores-Parameter
            // -> XP profitiert nicht von Cores. Also: kleinste Reste zuerst (A2).
            // Der Ueberschuss ist echt: CORE saettigt bei den vorhandenen Zielen, und
            // jedes per Level freigeschaltete Ziel erweitert CORE dauerhaft — gemessen
            // rund 175 min bis zur naechsten Freischaltung. Kopffreiheit bleibt frei,
            // damit CORE und die evalNs-Aufrufe im naechsten Takt Platz finden.
            //
            // v12.1: EINE Groesse. Die frueheren zwei (Kopffreiheit 2 %, Polster
            // 10 %, verrechnet als Maximum) hatten dieselbe Aufgabe und dieselbe
            // Schwaeche — beides waren Prozentsaetze. Begruendung und Messwerte
            // stehen bei XP_PAD_MAX_GB weiter oben.
            //
            // ENTFALLEN: die v10.1-Begrenzung auf die HAELFTE DES FREIEN POOLS.
            // Sie war fuer EINWEG-Worker richtig — dort durfte ein Polster von
            // 128 GB nicht den gesamten freien Rest von 128 GB binden, sonst bekam
            // xp dauerhaft nichts. Fuer Dauerlaeufer waere sie SCHAEDLICH und zwar
            // selbstverstaerkend: im eingeschwungenen Zustand ist der freie Rest
            // gleich dem Polster. Ein Polster von "halbem freien Rest" halbiert
            // sich dann in jedem Takt — 100 T, 50 T, 25 T, bis nichts mehr bleibt.
            // Ein Riegel darf nicht an der Groesse haengen, die er selbst erzeugt.
            //
            // Der Fall, den v10.1 abfing, ist damit nicht zurueck: das Polster ist
            // jetzt ein ANTEIL DES POOLS (10 %) mit kleinem Boden, kein absoluter
            // Wert mehr. Auf 1,5 TB Pool sind das 153 GB statt 128 GB fest. Dass
            // XP dort einen Takt lang leer ausgeht, wenn CORE ueber 90 % haelt, ist
            // jetzt sogar richtig: was ein Dauerlaeufer belegt, muss geerntet
            // werden — die letzten Kruemel zu greifen kostet mehr, als sie bringen.
            const xpPadGb = Math.min(
                Math.max(XP_PAD_MIN_GB, poolTotalGb * XP_PAD_FRAC),
                XP_PAD_MAX_GB,
            );
            const xpReapGb = xpPadGb * XP_REAP_FRAC_OF_PAD;
            // =================================================================
            // v12.0 — DIE XP-STUFE FAEHRT DAUERLAEUFER
            // =================================================================
            // Bis v11.8 startete diese Stufe One-Shots (schwarm-w.js): ein weaken,
            // dann Ende. Bei der gemessenen Laufzeit von rund 12 s starteten alle
            // im selben Takt und endeten gemeinsam — Pulk-Tod. Livebeleg:
            //     [ 8.6s] WORKER Threads    2335 -> 4477095
            //     [32.9s] WORKER Threads 4476905 ->    2471
            //     [39.0s] WORKER Threads    2355 ->    6077
            // Laufzeit 12 s, Luecke 22 s. Der Wellen-Deckel sollte den Gleichschritt
            // brechen; die Gegenprobe (Nachbau ueber 40 Takte) zeigte aber, dass
            // Staffeln den DURCHSCHNITT senkt (90 % -> 86 %) — und XP ist ein
            // Integral ueber Threads x Zeit, also zaehlt der Durchschnitt. Damit war
            // die Stufe in einer Zwickmuehle: sofort fuellen erzeugt den Pulk,
            // staffeln kostet Bestand.
            //
            // Der Dauerlaeufer loest beides, statt zwischen ihnen zu waehlen. Er
            // stirbt nicht — es gibt keinen Gleichschritt mehr zu brechen und keine
            // Luecke mehr zu fuellen. Deshalb faellt hier auch der Wellen-Deckel weg
            // (siehe unten) und die offene Frage aus v11.8 ist erledigt.
            //
            // DER PREIS UND SEINE ABSICHERUNG. v10 hatte die Kills abgeschafft
            // ("SPERRLISTE statt KILLS") mit der Begruendung, JEDER Worker sei ein
            // One-Shot und gebe sein RAM von selbst frei. Fuer diese eine Klasse
            // gilt das nicht mehr. Zwei Vorkehrungen:
            //   1. POLSTER. Die Stufe nimmt nicht mehr den ganzen Rest. Sie laesst
            //      xpPadGb frei, damit CORE im naechsten Takt wachsen kann, ohne
            //      dass jemand eingreifen muss. Wie gross das ist und warum es
            //      seit v12.1 GEDECKELT ist: siehe XP_PAD_MAX_GB weiter oben.
            //   2. ERNTE. Reicht das Polster doch nicht (CORE waechst schneller als
            //      erwartet, oder die Queen reserviert), MELDET der Dispatcher der
            //      Queen, was geerntet werden darf. Getoetet wird von IHR — sie ist
            //      der zweite Bewerber um dasselbe RAM (Daemon-Reservierungen) und
            //      wuerde bei einem Selbst-Ernten des Dispatchers leer ausgehen.
            //      Siehe reportReap/reapXpLong in SCHWARM-HELPERS.js.
            //
            // Die Hysterese zwischen beiden verhindert das Pendeln: gewachsen wird
            // bis zum Polster, geerntet erst bei 30 % davon — dazwischen liegen
            // 70 % des Polsters (bei 100 TB also 70 TB) als toter Gang. Der
            // gemessene Ein-Takt-Sprung von CORE liegt bei rund 8 TB, passt also
            // gut neunmal hinein. Beide Groessen sind oben definiert und haengen
            // an DERSELBEN Basis — das ist Absicht, siehe XP_REAP_FRAC_OF_PAD.

            // Ernte-Plan dieses Takts (host -> threads). Gesammelt, dann EINMAL
            // gemeldet — sonst laegen bei 70 Hosts 70 Einzelnachrichten im Port.
            const reapPlan = new Map();
            const reapAdd = (h, t, ziel) => {
                const n = Math.ceil(t);
                if (n <= 0) return;
                // v12.2: Schluessel ist "host ziel". Zwei Auftraege fuer denselben
                // Host, aber verschiedene Ziele, sind zwei verschiedene Auftraege.
                const k = h + " " + (ziel || "*");
                reapPlan.set(k, (reapPlan.get(k) || 0) + n);
            };

            // GRUND 1 — VERALTETE DAUERLAEUFER. Ein laufender Prozess liest seine
            // args nie neu. Wechselt das XP-Ziel (besseres XP/s freigeschaltet),
            // arbeitet die alte Flotte fuer immer am alten Ziel weiter. Der One-Shot
            // hatte dieses Problem nicht — er war nach 12 s ohnehin weg.
            if (xpLongStale > 0) {
                // v12.2: je Host UND altem Ziel melden. Vorher ging nur die
                // Gesamtzahl raus, und die Queen erntete die falschen Prozesse.
                for (const [k, thr] of xpLongZiel) {
                    const i = k.indexOf(" ");
                    const h = k.slice(0, i), z = k.slice(i + 1);
                    if (z !== xpTarget) reapAdd(h, thr, z);
                }
                limits.add("XP-Ziel gewechselt (" + xpLongStale + " thr veraltet)");
            }

            if (!xpTarget) {
                // GRUND 2 — KEIN XP-ZIEL MEHR. Ohne Ziel gibt es keinen Grund, auch
                // nur einen Dauerlaeufer stehen zu lassen; sein RAM ist reiner
                // Verlust. (Ein One-Shot lief hier einfach aus.)
                for (const [k, thr] of xpLongZiel) {
                    const i = k.indexOf(" ");
                    reapAdd(k.slice(0, i), thr, k.slice(i + 1));
                }
            } else if (budget.xp > 0) {
                const freeNow = poolGb();
                // v12.1: EINE Sperre. Frueher stand hier das Maximum aus Kopffreiheit
                // und Polster — zwei Prozentsaetze fuer dieselbe Aufgabe. Jetzt nur noch
                // das gedeckelte Polster; die Kopffreiheit geht restlos darin auf.
                const sperre = xpPadGb;
                // v10.3 (C): eigener Schluessel — CORE-weaken auf demselben Ziel zaehlt
                // nicht mehr gegen das XP-Soll und umgekehrt. v12.0: die Art heisst
                // jetzt "xplong", damit alte One-Shots aus einer frueheren Instanz
                // nicht als Bestand mitzaehlen und die Flotte zu klein ausfaellt.
                const held = flying.get(keyOf("xplong", CLS_XP, xpTarget)) || 0;
                const fits = Math.floor(Math.max(0, freeNow - sperre) / RAM["xplong"]);
                // SOLL = Bestand + was ueber dem Polster frei ist. Die alte Fassung
                // rechnete den GANZEN Pool als Soll (poolTotalGb / RAM) und nahm sich
                // damit alles, was CORE nicht schon hielt. Das war nur tragbar,
                // solange die Flotte alle 12 s von selbst starb. Ein Dauerlaeufer mit
                // demselben Soll wuerde CORE dauerhaft aushungern.
                const total = held + fits;
                const need = fits;
                if (fits === 0 && freeNow > 0) {
                    limits.add("XP-Polster (" + Math.round(sperre) + " GB)");
                }
                const execBefore = execOk;
                // KEIN Wellen-Deckel. Er existierte, um den Gleichschritt sterbender
                // One-Shots zu brechen. Dauerlaeufer sterben nicht gemeinsam — hier
                // waere Staffeln nur noch Leerstand. budget.xp (pool.length + 8)
                // deckt genau einen exec je Host, die Vollbelegung passt in EINEN
                // Takt.
                const portion = need;
                if (need > 0) deploy("xplong", portion, xpTarget, bySmallFirst, "xp", CLS_XP);

                // GRUND 3 — POLSTER AUFGEBRAUCHT. Trotz Polster ist der freie Rest
                // unter die Ernteschwelle gefallen: CORE ist gewachsen, oder die
                // Queen hat Platz reserviert (readReservations zieht ihn oben vom
                // freien RAM ab). Zurueckgeholt wird bis zum Polster, nicht mehr —
                // was zuviel geerntet wird, ist verlorene XP.
                const freiNach = poolGb();
                if (freiNach < xpReapGb && xpLongTotal > 0) {
                    let restThr = Math.ceil((xpPadGb - freiNach) / RAM["xplong"]);
                    // v12.2: nur Traeger des AKTUELLEN Ziels. Die veralteten sind
                    // unter GRUND 1 schon vollstaendig gemeldet; sie hier noch
                    // einmal zu zaehlen wuerde doppelt ernten. Grosse Traeger
                    // zuerst: weniger Kills fuer dieselbe Menge.
                    const gross = [...xpLongZiel.entries()]
                        .filter(([k]) => k.slice(k.indexOf(" ") + 1) === xpTarget)
                        .sort((a, b) => b[1] - a[1]);
                    for (const [k, thr] of gross) {
                        if (restThr <= 0) break;
                        const offen = thr - (reapPlan.get(k) || 0);
                        if (offen <= 0) continue;
                        const nimm = Math.min(offen, restThr);
                        reapAdd(k.slice(0, k.indexOf(" ")), nimm, xpTarget);
                        restThr -= nimm;
                    }
                    limits.add("XP-Ernte (" + Math.round(xpPadGb - freiNach) + " GB fehlen)");
                }

                // v10.5 (C): die Rechnung offenlegen. Ohne diese Zahlen war der
                // Leerstand nur herleitbar, nicht nachweisbar — die Worker-Laufzeit
                // stand in keinem Report.
                xpDiag = {
                    total, held: Math.round(held), fits, need: Math.max(0, need),
                    portion, execs: execOk - execBefore,
                    weakenSec: +xpWeakenSec.toFixed(2), fillTicks,
                    headroomGb: Math.round(sperre),
                    lang: true, langThreads: xpLongTotal, langStale: xpLongStale,
                    padGb: Math.round(xpPadGb), freiGb: Math.round(freiNach),
                };
            } else {
                limits.add("Budget xp");
                xpDiag = { total: 0, held: 0, fits: 0, need: 0, portion: 0, execs: 0,
                    weakenSec: +xpWeakenSec.toFixed(2), fillTicks, headroomGb: Math.round(xpPadGb),
                    lang: true, langThreads: xpLongTotal, langStale: xpLongStale,
                    padGb: Math.round(xpPadGb), freiGb: Math.round(poolGb()) };
            }

            // ---- ERNTE MELDEN (Dispatcher meldet, Queen toetet) ----
            // Eine Nachricht je Host UND Ziel. Die Queen liest sie im selben
            // Takt-Raster (beide 2000 ms), die Verzoegerung liegt unter zwei
            // Sekunden. v12.2: das Ziel geht mit — ohne es hat die Queen die
            // falschen Prozesse getoetet (Begruendung bei reapXpLong in HELPERS).
            let reapHosts = 0, reapThreads = 0;
            for (const [k, t] of reapPlan) {
                if (t <= 0) continue;
                const i = k.indexOf(" ");
                if (reportReap(ns, k.slice(0, i), t, k.slice(i + 1))) {
                    reapHosts++; reapThreads += t;
                }
            }
            if (reapThreads > 0 && xpDiag) { xpDiag.reapHosts = reapHosts; xpDiag.reapThreads = reapThreads; }

            // ---- STUFE 5: SHARE (zuletzt, v11.3 D) ----
            // RANGFOLGE: manip -> CORE -> XP -> share. share steht ganz hinten, weil
            // es die einzige Stufe ohne jeden Nebennutzen ist: Engine (Share.ts) hat
            // KEIN gainHackingExp — share erzeugt also nicht einmal Erfahrung,
            // anders als jeder weaken/grow/hack-Aufruf (NetscriptFunctions.ts:297/375,
            // NetscriptHelpers.tsx:611). Es bekommt echten Rest, keinen Vorrang.
            //
            // v10: KEIN Abbau-Zweig noetig. ns.share() laeuft ShareBonusTime (10 s,
            // Share.ts:8) und kehrt zurueck; der One-Shot endet von selbst. Faellt das
            // Grind-Flag, laufen die Worker binnen 10 s aus — ohne Kills, ohne Karenz.
            //
            // v11.3 (E) DECKEL UEBER DEN GRENZNUTZEN statt Festwert:
            //     Bonus = 1 + ln(effThreads) / 25            (Share.ts)
            //     effThreads = threads x intBonus x coreBonus
            // Die Funktion saettigt nie — jede Verdopplung bringt konstant +2,77
            // Punkte bei doppeltem RAM. Es gibt also kein "effektives Maximum", nur
            // einen Grenznutzen. Gewinn je zusaetzlichem TB:
            //     (1024 / RAM.share) / (25 x effThreads)
            // Nach effThreads aufgeloest und gegen SHARE_MARGINAL_MIN gesetzt ergibt
            // das den Deckel. Der coreBonus bleibt bewusst UNBERUECKSICHTIGT: er ist
            // je Host anders, und ihn zu ignorieren macht den Deckel leicht
            // grosszuegig statt zu streng.
            const shareEffCap = (1024 / RAM["share"]) / (25 * SHARE_MARGINAL_MIN);
            const shareThreadCap = Math.max(1, Math.floor(shareEffCap / Math.max(1, shareIntBonus)));
            let shareDiag = null;
            if (shareWanted && budget["share"] > 0) {
                const byPool = Math.floor((poolGb() * SHARE_MAX_FRAC) / RAM["share"]);
                const total = Math.min(shareThreadCap, byPool);
                const held = flying.get(SHARE_KEY) || 0;
                const need = total - held;
                if (total >= shareThreadCap && byPool > shareThreadCap) limits.add("share-Grenznutzen");
                if (need > 0) deploy("share", wave(total, need), "*", byCoresAsc, "share", CLS_SHARE);
                // Bonus ausweisen: ohne die Zahl ist nicht zu sehen, WAS der RAM kauft.
                const eff = Math.max(1, (held + Math.max(0, need)) * shareIntBonus);
                shareDiag = {
                    cap: shareThreadCap, byPool, held: Math.round(held),
                    need: Math.max(0, need),
                    bonus: +(1 + Math.log(eff) / 25).toFixed(4),
                    intBonus: +shareIntBonus.toFixed(3),
                    perTbGain: +((1024 / RAM["share"]) / (25 * eff)).toFixed(5),
                };
            } else if (shareWanted) {
                limits.add("Budget share");
            }

            // ===================== TELEMETRIE (Port 25, 0 GB) ======================
            const leftGb = poolGb();
            // v11.2: `const totalGb = poolTotalGb;` ist RAUS. Zwei Namen fuer
            // denselben Wert, der zweite erst hier unten deklariert — genau daran
            // ist STUFE 1+2 gestorben (Temporal Dead Zone). Es gibt jetzt nur
            // poolTotalGb, und das gilt ab dem Pool-Aufbau im ganzen Takt.
            // v10.6 (P2): gemessen VOR dem Deploy + das im Takt Platzierte. Beide
            // Summanden beschreiben damit denselben Zeitpunkt wie `used`.
            const busyGb = measuredUsedGb + placedGb;
            const snap = {
                t: now, tick, formulas: HAS_FORMULAS,
                totalGb: Math.round(poolTotalGb), poolStartGb: Math.round(startGb), poolLeftGb: Math.round(leftGb),
                used: Object.fromEntries(Object.entries(used).map(([k, v]) => [k, Math.round(v)])),
                hosts: pool.length, targets: targets.length, prep: prepTargets.length,
                // v9.2: die drei nächstliegenden Prep-Ziele mit ihrem Level-Bedarf.
                // prepTargets ist nach need aufsteigend sortiert -> [0] ist die
                // nächste Freischaltung. Damit kann DIAG zeigen, ob die XP-Stufe
                // den Engpass tatsächlich abbaut oder nur RAM verbrennt.
                prepNext: prepTargets.slice(0, 3).map(t => ({ h: t.host, L: t.need })),
                xpTarget, shareWanted, reservedHosts, reservedGb, resNote,
                execOk, execFail,
                // =========================================================
                // v11.7 — home-KERNE UND -RAM IN DEN SNAPSHOT
                // =========================================================
                // Der coreBonus (1 + (cores-1)/16, ServerHelpers.ts:288) wirkt auf
                // weaken und grow — und home ist der EINZIGE eigene Server, der
                // mehr als einen Kern haben kann (pserv und hacknet stehen laut
                // BaseServer.ts:50 fest auf 1). Ob sich ein Kern-Ausbau lohnt,
                // haengt allein daran, wieviel vom Pool auf home laeuft; genau
                // diese Zahl stand bisher in keinem Bericht.
                //
                // KOSTENLOS: coresOf("home") wird in diesem Takt ohnehin schon
                // aufgerufen (Sortierung byCoresDesc), und getServerMaxRam ist
                // bereits im Pool-Aufbau bezahlt. Hier wird nur weitergereicht,
                // damit DIAG es nicht selbst holen muss — dort waere ns.getServer
                // 2 GB statische Kosten bei 6 GB minRam.
                homeCores: coresOf("home"),
                homeGb: Math.round(homeMaxGb),
                homeFreeGb: Math.round(homeFreeGb),
                // v10: keine Kills mehr — der Zaehler entfaellt. Statt dessen die
                // Wellen-Konstante, damit DIAG die Umwaelzung einordnen kann.
                fillTicks,
                xpDiag,
                // v10.7: Soll und Ist der Kursbeeinflussung.
                manipDiag,
                manipTargets: manipTargets.map(m => ({ h: m.host, d: m.dir, r: +m.rate.toFixed(1) })),
                // v11.3: Soll/Ist des share-Deckels inkl. erreichtem Bonus.
                shareDiag,
                // v11.3 (F): baseDifficulty des XP-Ziels — die Groesse, mit der die
                // Engine die XP je Thread rechnet (Hacking.ts:36).
                xpBaseDiff,
                // v11.0 RUECKKANAL an den TRADER: welche Organisationen KANN der
                // Dispatcher bedienen? Ohne das waehlt der Trader nach
                // Positionswert und landet regelmaessig bei Megacorps, deren
                // Server er nicht gerootet hat.
                manipOk,
                // v11.0: Zahlt Hacking in dieser BitNode? Steuert die Reihenfolge
                // der Stufen und gehoert in den Report, damit die RAM-Verteilung
                // einordenbar ist.
                hackPays,
                // v10.2: Ist das XP-Ziel GLEICHZEITIG ein bewertetes Geld-Ziel? Dann
                // teilen XP- und CORE-Arbeit denselben Buchungsschluessel ("weaken|ziel")
                // und die Telemetrie kann sie nicht trennen — die xp-Klasse zeigt 0,
                // waehrend die Threads unter core_w erscheinen. Das ist KEIN Fehler
                // (die Ueberlappung ist sogar nuetzlich: XP-weaken haelt die Sicherheit
                // des Ziels am Minimum), aber ein Beobachter muss davon wissen, sonst
                // meldet er "XP bekommt nichts", obwohl das Level steigt.
                // v10.3 (C): Die Ueberlappung ist jetzt sauber getrennt (eigener
                // Buchungsschluessel je Klasse). Das Feld bleibt als INFORMATION
                // erhalten — dass XP- und Geld-Arbeit auf demselben Ziel laufen, ist
                // beim Lesen der Zieltabelle weiterhin wissenswert (die xp-weaken
                // halten dort die Sicherheit am Minimum).
                backdoorRunning: bdRunning.size,
                backdoorPending,
                backdoorStarted: backdoorDone,
                xpIsCore: !!(xpTarget && coreSet.has(xpTarget)),
                busyGb: Math.round(busyGb),
                limits: [...limits],
                resAgeMs,
                budget, queenAlive,
                best: targets.slice(0, 3).map(t => ({ h: t.host, sPerGb: +t.score.toFixed(1), pct: +(t.pct * 100).toFixed(2) })),
            };
            try { const ph = ns.getPortHandle(PORT_STAT); ph.clear(); ph.tryWrite(JSON.stringify(snap)); } catch (e) { /* egal */ }

            // ===================== LOG / DIAG =====================================
            if (slow) {
                hist.push({ t: now, startGb: Math.round(startGb), leftGb: Math.round(leftGb), execFail });
                while (hist.length > HIST_LEN) hist.shift();

                const gb = (x) => (x >= 1024 ? (x / 1024).toFixed(1) + "T" : Math.round(x) + "G");
                const pct = (x) => poolTotalGb > 0 ? ((x / poolTotalGb) * 100).toFixed(1) + "%" : "—";
                const best = targets[0];
                const measuredBusy = busyGb;   // v10.3: gemessen statt hergeleitet
                const msg = [
                    `──────── SCHWARM-DISPATCHER v${VERSION} ${HAS_FORMULAS ? "[Formulas]" : "[Fallback]"} ────────`,
                    `Ziele ${targets.length} | Prep ${prepTargets.length} | Hosts ${pool.length} | Deckel ${perTargetCap} thr`,
                    `Bestes Ziel: ${best ? `${best.host}  ${fmtNum(best.perSec)}/s Pot.  (${best.score.toFixed(1)} $/s·GB)` : "—"}`,
                    `XP-Ziel: ${xpTarget || "—"}  (baseDifficulty ${xpBaseDiff || "?"} -> ${(3 + xpBaseDiff * 0.3).toFixed(1)} XP/Thread)`,
                    `Hacking zahlt: ${hackPays ? "JA" : "NEIN (Beeinflussung hat Vorrang, CORE gedeckelt)"}`,
                    `BELEGT (gemessen): ${gb(measuredBusy)} (${pct(measuredBusy)})`,
                    `  ps-Aufschlüsselung: w ${gb(used.core_w)} g ${gb(used.core_g)} h ${gb(used.core_h)} | prep ${gb(used.prep)} xp ${gb(used.xp)} manip ${gb(used.manip)} share ${gb(used["share"])}${shareWanted ? "" : " (kein Grind)"}`,
                    `Reserviert ${reservedHosts} Hosts / ${reservedGb} GB${resNote ? " — " + resNote : ""} (passiv, keine Kills)`,
                    `Deckel aktiv: ${limits.size ? [...limits].join(", ") : "keine"}`,
                    `Wellen: ${fillTicks} Takte (weaken-Laufzeit ${xpWeakenSec.toFixed(1)} s)`
                        + (xpDiag ? ` | XP Soll ${xpDiag.total} / Bestand ${xpDiag.held} thr` : ""),
                    `Kursbeeinflussung: ${manipTargets.length ? manipTargets.map(m => `${m.host}:${m.dir}`).join(" ") : "keine Ziele (Trader meldet nichts)"}`,
                    manipDiag
                        ? `  Impuls ${manipDiag.calls}x ${gb(manipDiag.gb)} | Platz schaffen ${manipDiag.space}x ${gb(manipDiag.spaceGb)}`
                          + ` | Sicherheit ${manipDiag.weaken}x ${gb(manipDiag.weakenGb)}`
                        : "  (keine Aufrufe in diesem Takt)",
                    shareDiag
                        ? `share: ${shareDiag.held}+${shareDiag.need} thr -> Bonus +${((shareDiag.bonus - 1) * 100).toFixed(1)} %`
                          + `  (Deckel ${shareDiag.cap} thr, Pool erlaubt ${shareDiag.byPool}, naechstes TB +${(shareDiag.perTbGain * 100).toFixed(2)} Pkt)`
                        : `share: ${shareWanted ? "gewollt, aber kein Pool-Rest (nachrangig)" : "aus (kein Grind)"}`,
                    `Solver: ${solverInfo} (cct ${cctTotal}/${CONTRACT_THRESHOLD}) | Backdoor: ${backdoorInfo}`
                        + (bdRunning.size ? ` [${[...bdRunning].join(" ")}]` : ""),
                    `Pool: ${gb(startGb)} verfügbar -> ${gb(leftGb)} ungenutzt (${pct(leftGb)} vom Netz)`,
                    `exec ok ${execOk} / fehl ${execFail}`,
                    "─────────────────────────────────────────────────",
                ].join("\n");
                if (msg !== lastLog) { ns.clearLog(); ns.print(msg); lastLog = msg; }

                if (DIAG) {
                    const d = buildDiag(ns, {
                        now, HAS_FORMULAS, totalGb: poolTotalGb, startGb, leftGb, busyGb, limits, resAgeMs,
                        used, pool, idle, targets, prepTargets,
                        flying, keyOf, CLS_CORE, CLS_XP, CLS_MANIP, xpTarget, xpDiag, fillTicks,
                        manipTargets, manipDiag, hackPays, shareDiag, xpBaseDiff,
                        shareIntBonus, SHARE_MARGINAL_MIN, shareThreadCap,
                        shareWanted, reservations, reservedGb, resNote, queenAlive,
                        execOk, execFail, budget, hist, RAM, RAM_UNIT, WEAKEN_1, coresOf, coreBonus,
                        solverInfo, backdoorInfo, cctTotal, backdoorPending, perTargetCap,
                        bdRunning, backdoorTargets, BACKDOOR_MAX_PARALLEL, backdoorDone,
                    });
                    try { ns.write(DIAG_FILE, d, "w"); } catch (e) { /* egal */ }
                    ns.print("\n" + d);
                }

                execOk = 0; execFail = 0;
            }

        } catch (e) {
            ns.print("FEHLER: " + e);
        }
        await ns.sleep(LOOP_MS);
    }
}

// =============================================================================
// DIAGNOSE — alles, was ein externer Monitor NICHT sehen könnte
// =============================================================================
/** @param {NS} ns */
function buildDiag(ns, c) {
    const L = [];
    const gb = (x) => (x >= 1024 ? (x / 1024).toFixed(2) + " TB" : x.toFixed(0) + " GB");
    const p = (x, of) => of > 0 ? ((x / of) * 100).toFixed(1).padStart(5) + " %" : "    — ";
    const pad = (s, n) => String(s).padEnd(n).slice(0, n);
    const num = (s, n) => String(s).padStart(n);
    const fmtNum = (n) => {
        try { if (ns.format && ns.format.number) return ns.format.number(n); } catch (e) { /* Fallback */ }
        const a = Math.abs(n);
        if (a >= 1e12) return (n / 1e12).toFixed(2) + "t";
        if (a >= 1e9) return (n / 1e9).toFixed(2) + "b";
        if (a >= 1e6) return (n / 1e6).toFixed(2) + "m";
        if (a >= 1e3) return (n / 1e3).toFixed(2) + "k";
        return n.toFixed(2);
    };

    L.push("╔══════════════════════════════════════════════════════════════════════════╗");
    // Rahmen bleibt buendig, egal wie lang die Versionsnummer wird: der Rest
    // der Zeile wird auf die Kastenbreite aufgefuellt statt fest verdrahtet.
    {
        const kopf = "  SCHWARM-DISPATCHER v" + VERSION + " — DIAGNOSE";
        L.push("║" + kopf + " ".repeat(Math.max(0, 74 - kopf.length)) + "║");
    }
    L.push("╚══════════════════════════════════════════════════════════════════════════╝");
    L.push(`Zeit          ${new Date(c.now).toLocaleTimeString()}`);
    L.push(`Formulas      ${c.HAS_FORMULAS ? "JA" : "NEIN (Fallback-Näherung)"}`);
    L.push(`Hacking zahlt ${c.hackPays ? "JA" : "NEIN — Beeinflussung hat Vorrang, CORE ist gedeckelt"}`);
    L.push(`Queen         ${c.queenAlive ? "lebt" : "TOT — Reservierungen verworfen"}`
        + (c.resAgeMs >= 0 ? `   (Port 6 vor ${(c.resAgeMs / 1000).toFixed(1)} s geschrieben)`
                           : "   (Port 6 ohne Zeitstempel — HELPERS < v3.6)"));
    L.push(`Worker-RAM    w ${c.RAM["weaken"]}  g ${c.RAM["grow"]}  h ${c.RAM["hack"]}  share ${c.RAM["share"]}  (gemessen)`);
    L.push(`weaken/Thread ${c.WEAKEN_1.toFixed(4)} sec  (1 Core, inkl. BitNode-Mult)`);
    L.push(`Hacking-Level ${ns.getHackingLevel()}   home-Cores ${c.coresOf("home")}`);
    L.push("");

    // ---- 1. POOL-BILANZ ----
    // WICHTIG: Die Prozess-Zählung (used.*) ist eine ps()-Momentaufnahme und kann
    // kurzlebige h/w/g-Worker "zwischen den Wellen" verpassen. Die WAHRHEIT ist der
    // gemessene belegte RAM (getServerUsedRam + im Takt platziert).
    // Deshalb: gemessene Summe als Basis, Prozess-Zählung nur zur Aufschlüsselung.
    // v11.2: MANIP wird mitgezaehlt. Seit clsOf CLS_MANIP kennt, wird die Klasse
    // korrekt gebucht — ohne sie hier waere sie als "nicht klassifiziert"
    // aufgetaucht und der Fix haette wie ein neuer Fehler ausgesehen.
    const classSum = c.used.core_w + c.used.core_g + c.used.core_h + c.used.prep
        + c.used.xp + (c.used.manip || 0) + c.used["share"];
    // v10.3 (A): BELEGT ist jetzt die exakte Summe getServerUsedRam über die
    // gerooteten Hosts. Die alte Herleitung (totalGb - leftGb - reservedGb) zählte
    // homeReserve und nicht provisionierte Hosts als belegt.
    const measuredBusy = Math.max(0, c.busyGb);
    const unclassified = Math.max(0, measuredBusy - classSum - c.used.foreign);
    L.push("── 1. POOL-BILANZ (BELEGT = Summe getServerUsedRam, exakt) ───────────────");
    L.push(`   Netz gesamt          ${gb(c.totalGb).padStart(10)}`);
    L.push(`   BELEGT gesamt        ${gb(measuredBusy).padStart(10)}   ${p(measuredBusy, c.totalGb)}`);
    L.push("   davon (Klassen: ps-Bestand + im selben Takt platziert):");
    const rows = [
        ["  CORE weaken", c.used.core_w], ["  CORE grow", c.used.core_g], ["  CORE hack", c.used.core_h],
        ["  PREP", c.used.prep], ["  XP", c.used.xp], ["  MANIP", c.used.manip || 0],
        ["  SHARE", c.used["share"]],
        ["  fremd (Daemons)", c.used.foreign], ["  nicht klassifiziert*", unclassified],
    ];
    for (const [k, v] of rows) L.push(`   ${pad(k, 22)} ${gb(v).padStart(10)}   ${p(v, c.totalGb)}`);
    L.push(`   ${pad("reserviert (Queen)", 22)} ${gb(c.reservedGb).padStart(10)}   ${p(c.reservedGb, c.totalGb)}`);
    L.push(`   ${pad("*** UNGENUTZT ***", 22)} ${gb(c.leftGb).padStart(10)}   ${p(c.leftGb, c.totalGb)}`);
    L.push("   * = Worker, die zwischen ps-Aufnahme und Messung geendet haben, plus");
    L.push("       Fremdprozesse ohne lesbare Skript-RAM. Seit v10.3 klein — vorher");
    L.push("       steckte hier alles, was im selben Takt gestartet wurde.");
    if (c.resNote) L.push(`   ! ${c.resNote}`);
    L.push("");

    // ---- 2. HOSTS MIT UNGENUTZTEM RAM ----
    L.push("── 2. UNGENUTZTER RAM JE HOST (mit Grund) ────────────────────────────────");
    // v10.3 (D): "Budget/Deckel erschöpft" war ein Sammel-Etikett für JEDEN Pool-Rest,
    // unabhängig vom tatsächlichen Grund. Jetzt stehen die Deckel, die in DIESEM Takt
    // wirklich gegriffen haben, namentlich darüber.
    const limitList = Array.isArray(c.limits) ? c.limits : [...(c.limits || [])];
    L.push(`   Aktive Deckel: ${limitList.length ? limitList.join(" · ") : "keine — Pool ist ausgereizt"}`);
    const poolWhy = limitList.length ? "Pool-Rest (Deckel s.o.)" : "Pool-Rest ohne erkannten Deckel";
    const leftovers = c.pool
        .filter(n => n.freeGb >= c.RAM_UNIT)
        .map(n => ({ h: n.host, gb: n.freeGb, cores: n.cores, why: poolWhy }))
        .concat(c.idle.map(i => ({ h: i.h, gb: i.gb, cores: c.coresOf(i.h), why: i.why })))
        .sort((a, b) => b.gb - a.gb)
        .slice(0, 25);
    if (!leftovers.length) L.push("   (nichts — Pool ist vollständig verwertet)");
    else {
        L.push(`   ${pad("HOST", 20)} ${num("FREI", 10)} ${num("CORES", 6)}  GRUND`);
        for (const x of leftovers) L.push(`   ${pad(x.h, 20)} ${num(gb(x.gb), 10)} ${num(x.cores, 6)}  ${x.why}`);
    }
    L.push("");

    // ---- 3. ZIELE: SOLL vs. IST ----
    L.push("── 3. ZIELE (Score = $/s·GB Potenzial nach Prep; w/g/h = laufende Threads) ─");
    L.push(`   ${pad("HOST", 18)} ${num("$/s·GB", 9)} ${num("$/s pot", 10)} ${num("sec", 7)} ${num("$%", 5)} ${num("chc", 5)}  ${num("w", 6)} ${num("g", 6)} ${num("h", 6)} ${num("xp-w", 7)}`);
    for (const t of c.targets.slice(0, 12)) {
        let sec = 0, money = 0;
        try { sec = ns.getServerSecurityLevel(t.host); money = ns.getServerMoneyAvailable(t.host); } catch (e) { /* egal */ }
        // v10.3 (C): w/g/h sind jetzt REIN die Zielarbeit; XP-weaken auf demselben
        // Host steht in einer eigenen Spalte. Vorher waren beide vermischt — auf
        // foodnstuff standen 2157 Threads unter "CORE weaken", obwohl es XP-Arbeit war.
        const rw = Math.round(c.flying.get(c.keyOf("weaken", c.CLS_CORE, t.host)) || 0);
        const rg = Math.round(c.flying.get(c.keyOf("grow", c.CLS_CORE, t.host)) || 0);
        const rh = Math.round(c.flying.get(c.keyOf("hack", c.CLS_CORE, t.host)) || 0);
        // v12.1 BUGFIX: Art "xplong", nicht "weaken". Seit v12.0 bucht die
        // XP-Stufe unter dem eigenen Schluessel; "weaken|xp|<ziel>" schreibt
        // niemand mehr. Diese Zeile las damit dauerhaft 0 und meldete "XP-weaken:
        // 0 Threads" direkt ueber der xpDiag-Zeile mit dem echten Bestand — zwei
        // widersprechende Zahlen fuer dieselbe Flotte, zwei Zeilen auseinander.
        const rx = Math.round(c.flying.get(c.keyOf("xplong", c.CLS_XP, t.host)) || 0);
        L.push(`   ${pad(t.host, 18)} ${num(t.score.toFixed(1), 9)} ${num(fmtNum(t.perSec), 10)} `
            + `${num((sec - t.minS).toFixed(1), 7)} ${num(((money / t.maxM) * 100).toFixed(0), 5)} `
            + `${num((t.chance * 100).toFixed(0), 5)}  ${num(rw, 6)} ${num(rg, 6)} ${num(rh, 6)} `
            + `${num(rx || "—", 7)}`);
    }
    L.push(`   Prep-Ziele: ${c.prepTargets.slice(0, 6).map(t => `${t.host}(L${t.need})`).join(" ") || "—"}`);
    L.push(`   XP-Ziel:    ${c.xpTarget || "—"}      Share: ${c.shareWanted ? "AN (Grind läuft)" : "aus"}`);
    {
        const xw = Math.round(c.flying.get(c.keyOf("xplong", c.CLS_XP, c.xpTarget)) || 0);
        L.push(`   XP-weaken:  ${xw} Threads (eigene Buchung seit v10.3, echte Threads`);
        L.push(`               ohne Core-Gewichtung seit v10.5)`);
        // v10.5: der komplette Rechenweg. Ohne ihn war der Leerstand nur herleitbar.
        const d = c.xpDiag;
        if (d) {
            L.push(`   XP je Thread: 3 + baseDifficulty(${c.xpBaseDiff || "?"}) x 0.3 = ${(3 + (c.xpBaseDiff || 0) * 0.3).toFixed(2)}`);
            L.push(`                 (v11.3: baseDifficulty, NICHT minSec — Hacking.ts:36.`);
            L.push(`                  Server.ts:83 setzt minDifficulty auf ~ein Drittel davon,`);
            L.push(`                  die alte Rechnung unterschaetzte schwere Ziele um Faktor 3.)`);
            L.push(`   XP-Rechnung: Soll ${d.total} thr | Bestand ${d.held} | passt ${d.fits}`);
            L.push(`                Bedarf ${d.need} -> Portion ${d.portion} thr in diesem Takt`);
            if (d.lang) {
                // v12.0: Wellen und Laufzeit sind hier keine Stellgroessen mehr —
                // der Dauerlaeufer endet nicht. Statt der Wellenzahl zaehlen jetzt
                // Polster (wieviel bleibt CORE) und Ernte (wieviel ging zurueck).
                L.push(`                Dauerlaeufer ${d.langThreads} thr`
                    + (d.langStale > 0 ? `, davon ${d.langStale} auf altem Ziel` : "")
                    + `   Laufzeit je weaken ${d.weakenSec} s   execs ${d.execs}`);
                L.push(`                Polster ${d.padGb} GB | frei danach ${d.freiGb} GB`
                    + `   Sperre ${d.headroomGb} GB`);
                if (d.reapThreads > 0) {
                    L.push(`                Ernte an QUEEN gemeldet: ${d.reapThreads} thr / ${d.reapHosts} Hosts`);
                }
            } else {
                L.push(`                Laufzeit ${d.weakenSec} s -> Wellen ${d.fillTicks} Takte`
                    + `   Kopffreiheit ${d.headroomGb} GB   execs ${d.execs}`);
                if (d.fillTicks === 1) {
                    L.push(`                (Wellen aus: der Worker endet innerhalb eines Takts,`);
                    L.push(`                 jede Drosselung waere reiner Leerstand)`);
                }
            }
        }
    }
    L.push("");

    // ---- 3b. KURSBEEINFLUSSUNG ----
    L.push("── 3b. KURSBEEINFLUSSUNG (Impulse, nicht Threads) ────────────────────────");
    {
        const mt = c.manipTargets || [];
        if (!mt.length) {
            L.push("   keine Ziele — der TRADER meldet keine gehaltene Position,");
            L.push("   oder der Dispatcher findet fuer die gemeldeten Organisationen");
            L.push("   keinen gerooteten Server mit ausreichendem Level.");
        } else {
            L.push(`   ${pad("HOST", 20)} ${num("RICHTUNG", 9)} ${num("Impulse/min", 12)}`);
            for (const m of mt) L.push(`   ${pad(m.host, 20)} ${num(m.dir, 9)} ${num(m.rate.toFixed(1), 12)}`);
            const d = c.manipDiag;
            if (d) {
                // v11.3: DREI Zweige getrennt. Vorher stand hier nur `calls`, und
                // genau deshalb war "4,0 TB bei 0 Impuls-Aufrufen" nicht aufloesbar —
                // man sah nicht, dass alles im Platz-schaffen-hack lag.
                L.push(`   im letzten Takt:`);
                L.push(`     Impuls (stock-Flag)   ${num(d.calls, 4)} Aufrufe   ${gb(d.gb).padStart(10)}`);
                L.push(`     Platz schaffen        ${num(d.space, 4)} Aufrufe   ${gb(d.spaceGb).padStart(10)}   (ohne Flag, Vorarbeit)`);
                L.push(`     Sicherheit senken     ${num(d.weaken, 4)} Aufrufe   ${gb(d.weakenGb).padStart(10)}   (laeuft seit v11.3 ZUERST)`);
                L.push(`   Von neutral (50) auf maximal (100) sind rund 500 Impulse noetig`);
                L.push(`   (Schrittweite 0.1, Stock.ts:154-161) — es zaehlen ABGESCHLOSSENE`);
                L.push(`   Aufrufe, nicht Threads. Die Laufzeit eines Aufrufs haengt NICHT`);
                L.push(`   an der Threadzahl (calculateHackingTime), ein groesserer Chunk`);
                L.push(`   ist deshalb strikt besser als mehrere kleine.`);
                if (d.calls === 0 && d.spaceGb > 0) {
                    L.push(`   -> kein Impuls in diesem Takt: das Ziel wird gerade erst auf`);
                    L.push(`      Chunk-Groesse gebracht. Bleibt das ueber viele Takte so,`);
                    L.push(`      ist der hack zu langsam (Level/Sicherheit) — nicht das RAM.`);
                }
            }
            L.push(`   MANIP belegt: ${gb(c.used.manip || 0)}`);
        }
    }
    L.push("");

    // ---- 3c. SHARE (v11.3) ----
    L.push("── 3c. SHARE (nachrangig — letzte Stufe) ─────────────────────────────────");
    {
        const d = c.shareDiag;
        L.push(`   Engine (Share.ts): Bonus = 1 + ln(effThreads) / 25,`);
        L.push(`   effThreads = Threads x Int-Bonus (${(c.shareIntBonus || 1).toFixed(3)}) x coreBonus`);
        L.push(`   Die Funktion saettigt NIE: jede Verdopplung bringt +2,77 Punkte bei`);
        L.push(`   doppeltem RAM. Der Deckel folgt daher aus dem GRENZNUTZEN, nicht aus`);
        L.push(`   einem Maximum — SHARE_MARGINAL_MIN = ${c.SHARE_MARGINAL_MIN} heisst: ein weiteres`);
        L.push(`   TB muss mindestens ${((c.SHARE_MARGINAL_MIN || 0) * 100).toFixed(1)} Prozentpunkte bringen.`);
        L.push(`   Deckel daraus: ${c.shareThreadCap} Threads (${gb((c.shareThreadCap || 0) * c.RAM["share"])})`);
        if (!c.shareWanted) L.push("   Status: AUS — WORK meldet keinen Faktions-Grind.");
        else if (!d) L.push("   Status: gewollt, aber kein Pool-Rest. Nachrangig, das ist gewollt.");
        else {
            L.push(`   Bestand ${d.held} thr + neu ${d.need} thr -> Bonus +${((d.bonus - 1) * 100).toFixed(2)} %`);
            L.push(`   naechstes TB bringt noch +${(d.perTbGain * 100).toFixed(3)} Punkte`);
            if (d.byPool < d.cap) L.push(`   (Pool begrenzt auf ${d.byPool} thr — der Grenznutzen-Deckel greift hier nicht)`);
        }
        L.push(`   SHARE belegt: ${gb(c.used["share"])}`);
        L.push("   Hinweis: share erzeugt KEINE Hacking-XP (Share.ts hat kein");
        L.push("   gainHackingExp) — anders als jeder weaken/grow/hack-Aufruf.");
    }
    L.push("");

    // ---- 4. DEPLOY-ZÄHLER ----
    L.push("── 4. DEPLOY (seit letztem Slow-Takt, 16 s) ──────────────────────────────");
    L.push(`   exec erfolgreich   ${num(c.execOk, 6)}`);
    L.push(`   exec FEHLGESCHLAGEN${num(c.execFail, 6)}   ${c.execFail > 0 ? "<-- RAM-Rechnung stimmt nicht!" : ""}`);
    L.push(`   Budget-Rest        core ${c.budget.core}  prep ${c.budget.prep}  share ${c.budget["share"]}  xp ${c.budget.xp}`);
    L.push(`   (budget.prep und budget.rest werden seit v10 nirgends mehr gelesen — die`);
    L.push(`    Nachlese aus v9 ist entfallen und STUFE 1+2 bucht beide auf "core".`);
    L.push(`    Toter Code, kein Fehler; Aufraeumen gehoert in die Architektur-Runde.)`);
    if (c.budget.xp <= 0) L.push("   ! XP-Budget erschöpft — Hosts könnten leer bleiben. pool.length prüfen.");
    if (c.budget.core <= 0) L.push("   ! CORE-Budget erschöpft — zu viele Ziele für den Pool.");
    L.push(`   Deckel je Ziel     ${c.perTargetCap} thr`);
    L.push(`   Solver ${c.solverInfo} (cct ${c.cctTotal})`);
    // v10.4: Backdoor bekommt eigene Zeilen — vorher stand hier nur "aus (offen 12)",
    // und genau das war monatelang wahr, ohne dass jemand den Grund sah.
    {
        const laufende = c.bdRunning ? [...c.bdRunning] : [];
        L.push(`   Backdoor ${c.backdoorInfo}   (max ${c.BACKDOOR_MAX_PARALLEL} parallel, `
            + `${c.backdoorDone} in dieser Instanz gestartet)`);
        if (laufende.length) L.push(`     laeuft auf: ${laufende.join(" ")}`);
        const next = (c.backdoorTargets || []).slice(0, 6).map(t => `${t.host}(L${t.skill})`);
        if (next.length) L.push(`     naechste:   ${next.join(" ")}`);
    }
    L.push("");

    // ---- 5. ZEITREIHE ----
    L.push("── 5. ZEITREIHE (16-s-Raster, ~5 min) ────────────────────────────────────");
    L.push(`   ${pad("ZEIT", 10)} ${num("POOL", 10)} ${num("UNGENUTZT", 11)} ${num("AUSL.", 7)} ${num("FEHL", 5)}`);
    for (const h of c.hist) {
        const auslast = h.startGb > 0 ? (((h.startGb - h.leftGb) / h.startGb) * 100).toFixed(0) + "%" : "—";
        L.push(`   ${pad(new Date(h.t).toLocaleTimeString(), 10)} ${num(gb(h.startGb), 10)} `
            + `${num(gb(h.leftGb), 11)} ${num(auslast, 7)} ${num(h.execFail, 5)}`);
    }
    if (c.hist.length >= 3) {
        const idles = c.hist.map(h => h.leftGb);
        const avg = idles.reduce((a, b) => a + b, 0) / idles.length;
        L.push(`   -> ungenutzt  min ${gb(Math.min(...idles))}  Ø ${gb(avg)}  max ${gb(Math.max(...idles))}`);
    }
    L.push("");

    // ---- 6. CORE-VERTEILUNG (der neue Hebel) ----
    L.push("── 6. CORES IM POOL (grow/weaken-Hebel) ──────────────────────────────────");
    const byCore = {};
    for (const n of c.pool) {
        const k = n.cores;
        byCore[k] = byCore[k] || { hosts: 0, gb: 0 };
        byCore[k].hosts++; byCore[k].gb += n.freeGb;
    }
    const keys = Object.keys(byCore).map(Number).sort((a, b) => b - a);
    if (!keys.length) L.push("   (Pool leer)");
    for (const k of keys) {
        L.push(`   ${num(k, 3)} Cores  ->  Bonus x${c.coreBonus(k).toFixed(3)}   `
            + `${num(byCore[k].hosts, 4)} Hosts   ${num(gb(byCore[k].gb), 10)} frei`);
    }
    L.push("   (pserv-* haben IMMER 1 Core. Netz-Server: randInt(ceil(layer/2), layer).)");

    return L.join("\n");
}

export function autocomplete() { return ["--no-home", "--diag"]; }