/**
 * SCHWARM-DIAG.js — v3.26
 *
 * v3.26 — CORP OHNE CORP IST KEIN MANGEL, UND "AUS, LAEUFT ABER" NUR, WENN
 *   ES AM FENSTERENDE NOCH STIMMT. QUEEN v7.17 startet CORP erst, wenn eine
 *   Corp besteht - "Schalter an, kein Prozess" ist dann der Sollzustand
 *   ("wartet auf eine Corp"), nicht "FEHLT". Und im Testspiel z1832 wurde
 *   der CORP-Schalter mitten im Fenster umgelegt; die Queen beendete den
 *   Prozess 28 s spaeter, DIAG meldete trotzdem "Queen hat nicht
 *   aufgeraeumt". Befund jetzt nur, wenn der Prozess in der LETZTEN Probe
 *   noch lief.
 *
 * v3.25 — CORP-BEFUNDE NUR AUF FRISCHEN ZAHLEN, MIT DER RICHTIGEN BEGRUENDUNG.
 *   (Punkt 24) Die Staedte-Regel zitierte das Reifetor von CORP v0.39
 *   ("< 3"), meldete auch den normalen Ausbau der neuesten Division und
 *   rechnete auf eingefrorenem CORP_OUT weiter (z1794: 2862 s alt, CORP aus,
 *   Chemical hatte laengst 2 Staedte). Jetzt:
 *   - Frische-Tor: CORP-Befunde nur, wenn CORP in den Proben lief UND
 *     CORP_OUT hoechstens CORP_PORT_FRISCH_S alt ist. Sonst eine Zeile
 *     "eingefroren" und keine Befunde.
 *   - Staedte: Befund erst, wenn eine Division ueber CORP_STAEDTE_SERIE_MIN
 *     Berichte bei laufendem CORP nicht waechst. Begruendung nach
 *     ensureCities und dem Reifetor v0.40.
 *   - Upgrades: verglichen wird mit dem, was corpUpgradeStep seit CORP v0.45
 *     greifen kann (Fonds - Unlock - Betriebskapital), nicht mit dem Budget.
 *   - Stillstand: der Zweig "Stufe ueber den Fonds" ist seit CORP v0.22
 *     unerreichbar (Deckel 50 %) und entfaellt.
 *   - Lager: nur fuer die Division, die dran ist (Reihum seit CORP v0.45).
 *   - Node-Lage: in schwachen Nodes eine Zeile (kein Befund), was die Corp
 *     dort bringt. "Corp(P31)" hiess der falsche Port - CORP_OUT ist 15.
 *   Nachtrag 1: Staedte-Text nach dem echten Ablauf (ensureCities fuer JEDE
 *   Division vor der Reihum-Wahl, eine einzelne kranke Stadt sperrt);
 *   Reifegrad zeigt CORP ohne Corp in schwachen Nodes als "offen".
 *
 * v3.24 — KASSE. Neuer Abschnitt 4c, maschinenlesbar: Kassenbuch der
 *   Engine (getMoneySources), Geldstand, Reset-Stempel und ALLE Zeilen des
 *   Handlungsbuchs roh. kassen-pruefer.py rechnet daraus je Topf, ob jeder
 *   Geldabfluss protokolliert ist, und prueft jede BANK-Freigabe. Dazu:
 *   Port 35 je Probe umschichten, Freigabeliste statt "Top", Befund
 *   "nicht bedient" nur fuer DENSELBEN Antrag im ganzen Fenster.
 *   Nachtrag (Gegenpruefung): Port 35 wird auch in der Pause zwischen den
 *   Messfenstern umgeschichtet (vorher nur 1 von 10 min - der Port lief
 *   ueber); im Auftragsmodus steht der Kassenblock auch in den Teilberichten.
 *   Nachtrag 3: #KASSE traegt den Ladezeitpunkt der Seite (seite) - daran
 *   erkennt kassen-pruefer.py ein Neuladen des Spiels.
 *
 * v3.23 — RAETSEL-BEFUND: "wird nicht fertig" statt "ohne Versuch".
 *   Bei Rueckmelde-Modellen ist jeder ungeloeste Lauf "feedback", auch nach
 *   Dutzenden echter Versuche (Workflow 25.09.2026). Der Grund steht seit
 *   DARKNET v4.10 in der FEEDBACK-Meldung (Frist, Ziel weg, kein Log-Eintrag).
 *
 * v3.22 — DIE HANDLUNGEN DER DAEMONS STEHEN IM BERICHT.
 *   Der Bericht bleibt wie er ist, es kommt ein Abschnitt dazu. DIAG holt
 *   das Handlungsbuch (HELPERS v5.12) und LEERT es dabei — damit enthaelt
 *   jeder Bericht genau die Handlungen seines Zeitraums, und die Datei
 *   kann nicht wachsen. Die Rotation erledigt sich dadurch von selbst.
 *   WOZU: die Engine sagt nirgends, WER etwas getan hat. Was hier NICHT
 *   steht, war nicht der Schwarm, sondern der Spieler.
 *
 * v3.21 — DER UPGRADE-BEFUND WAR ZU ENG GEFASST (mein Fehler).
 *   Er verlangte `Stufe 0`. Die erste Messung zeigte sofort, dass das am
 *   Ziel vorbeigeht: Wilson stand auf Stufe 16, die naechste kostete
 *   $262 Bio. gegen $1,27 Bio. Rundenbudget. Der Befund schlug deshalb nie
 *   an. Jetzt zaehlt nur noch, ob die NAECHSTE Stufe ueber dem Budget
 *   liegt — und er nennt die Stufe mit.
 *
 * v3.20 — DIE CORP-UPGRADES WAREN NIRGENDS ZU SEHEN.
 *   In 60 Berichten stand keine Zeile dazu, obwohl es die teuersten
 *   Posten der Corp sind. Seit CORP v0.44 liegen Stufe und naechster
 *   Preis auf Port 31; der Vollbericht schneidet den Port-Inhalt aber
 *   bei ~160 Zeichen ab. Also hier zeigen.
 *   ERSTE MESSUNG 21.09.2026: Insight 65, Neural 160, Focus 111,
 *   SmartFab 107 — gekauft wird also sehr wohl. Der Verdacht "nie
 *   gekauft" war falsch. Die naechsten Stufen kosten inzwischen mehr
 *   als das ganze Rundenbudget (Wilson $262 Bio. gegen $1,27 Bio.).
 *   OFFEN: der Befund prueft noch auf Stufe 0 und schlaegt deshalb
 *   nicht an. Richtig waere "naechste Stufe teurer als das Budget".
 *
 * v3.19 — DER GANG-BEFUND WAR EIN FEHLALARM.
 *   "ALLE N Mitglieder stehen auf Territory Warfare ... kann nicht rekrutieren"
 *   meldete den NORMALFALL. GANG schaltet absichtlich kurz vor dem
 *   Territoriums-Tick um, weil Power nur im Tick-Moment gutgeschrieben wird
 *   (Gang.ts:186 ff.); das Fenster deckt die letzten 25 von 100 Cycles ab.
 *   DIAG traf es damit in rund einem Viertel der Stichproben.
 *   Nachgewiesen am 19.09.2026 ueber sechs Berichte: warfare wechselte
 *   false/false/true/false/true/true, die Power stieg dabei stetig 17,8 -> 35,6.
 *   Jetzt zaehlt DIAG aufeinanderfolgende Beobachtungen (GANG_WARFARE_STREAK_MIN)
 *   und meldet erst, wenn es ueber zwei Berichte (~20 min) anhaelt. Im Fenster
 *   steht nur noch ein Hinweis im Bericht, kein Befund.
 *
 * v3.18 — KENNZAHLEN JE DIVISION. "1 Division(en), 4 Bueros" liess die beiden
 *   Fragen offen, auf die es beim Haerten ankommt: sind die Bueros besetzt,
 *   sind die Lager gefuellt? Seit CORP v0.37 liegen die Zahlen auf dem Port;
 *   hier stehen sie als Tabelle, samt Befunden zu halb besetzten Bueros,
 *   vollen Lagern und Divisionen, die noch nicht in allen Staedten sind.
 *
 * v3.17 — DATEI IST NICHT PROZESS. Alle Versionsnummern im Bericht kommen
 *   aus den DATEIEN. Ein Daemon behaelt seinen Code aber bis zum Neustart.
 *   Die Queen meldet ihre LAUFENDE Fassung jetzt selbst (QUEEN v7.14,
 *   QUEEN_OUT.ver); weicht sie von der Datei ab, ist das ein Befund.
 *
 * v3.16 — GEWICHT STATT "(gross)". INFO v2.2 liefert die JSON-Laenge je
 *   Block mit; die Tabelle in Abschnitt 5 zeigt sie jetzt als ZEICHEN und
 *   ANTEIL samt Summe. Ohne diese Zahlen liesse sich nicht entscheiden, wo
 *   gekuerzt werden soll — man wuerde am falschen Ende schneiden.
 *
 * v3.15 — FREISCHALTUNGEN UND REIFEGRAD IM BERICHT.
 *   Karma und die vier Kampfwerte standen NIRGENDS im Report — damit war die
 *   haeufigste Frage ueberhaupt ("warum geht GANGS/BLADEBURNER nicht an?") aus
 *   dem Bericht nicht zu beantworten, obwohl beide Zahlen im player-Block schon
 *   dalagen. Neu ist ausserdem die Unterscheidung, auf die es ankommt: Karma
 *   und Kampfwerte sind EINTRITTSKARTEN. Ist die Gang gegruendet bzw. die
 *   Division betreten, sind sie erledigt und duerfen wieder fallen — deshalb
 *   steht die Huerde neben der Frage, ob sie schon genommen wurde. Das Urteil
 *   kommt aus daemonBereit() selbst, nicht aus einer Nachbildung.
 *
 * v3.14 — SCHWELLE ANGEGLICHEN UND EINE CHRONIK.
 *   a) BLACKOP_MIN_CHANCE stand auf 0.80, der BLADEBURNER-Payload verlangt
 *      aber CFG.SUCCESS_MIN = 0.95. DIAG meldete deshalb bei 93,3 % einen
 *      Befund ("prueft, ob der Daemon sie startet"), obwohl der Daemon voellig
 *      korrekt wartete. VIERTER Fehlalarm dieser Familie — diesmal nicht aus
 *      Unkenntnis einer Mechanik, sondern aus zwei Zahlen fuer dieselbe Frage
 *      in zwei Dateien. Der PRUEFER vergleicht sie ab sofort.
 *   b) CHRONIK: wieviele BlackOps erledigt sind und welche als naechstes
 *      anstehen, samt noetigem Rang. Eine einzelne "naechste Operation" zeigt
 *      nicht, ob der Daemon vorankommt; die Reihe zeigt es.
 *      Daten aus INFO v2.1 (blade.blackOps) — dort ist die API ohnehin geladen.
 *
 * v3.13 — BITNODE OHNE FREIGABE IST KEIN MANGEL.
 *   Gemeldet wurde "soll laufen, Capability ok, aber im ganzen Fenster kein
 *   Prozess". Stimmt woertlich, ist aber der SOLLZUSTAND: seit QUEEN v7.9 hat
 *   der Daemon einen Ausloeser. Der Schalter ist die ABSICHT des Spielers und
 *   ueberlebt BitNode-Wechsel; gestartet wird er nur bei FRISCHER Freigabe auf
 *   PLAN_OUT. Ohne sie belegte er sonst stundenlang RAM fuers Schlafen.
 *
 *   DRITTER FEHLALARM DIESER BAUART — nach Daedalus (v3.8) und Grafting
 *   (v3.10). Immer dasselbe Muster: DIAG kennt eine absichtliche Mechanik
 *   nicht und meldet sie als Defekt. Geprueft wird jetzt mit demselben
 *   planFreigabe() wie bei den Verbrauchern, nicht mit einer zweiten Lesart.
 *
 * v3.12 — WIEVIELE SKRIPTE, NICHT NUR WIEVIELE THREADS.
 *   Der Schwarm hat immer ueber Threads und RAM geredet. Fuer die RECHENZEIT
 *   ist aber die Zahl der SKRIPTINSTANZEN entscheidend: in Bitburner ist ein
 *   Skript mit N Threads EIN WorkerScript — Threads vervielfachen die Wirkung,
 *   nicht die Ausfuehrung. Teuer ist das Anlegen und Abraeumen. 500.000
 *   Threads in wenigen grossen Skripten kosten fast nichts, dieselben Threads
 *   in Tausenden kleiner Skripte kosten viel.
 *
 *   Die neue Zeile nennt Instanzen, Threads und den Schnitt je Skript. Damit
 *   ist die Frage "Dauerfeuer oder Batches?" keine Glaubensfrage mehr: bei
 *   wenigen hundert Skripten lohnt der Umbau nicht, bei Tausenden schon.
 *
 * v3.11 — SPALTEN KLEBTEN ANEINANDER.
 *   padR() benutzte padEnd(): das FUELLT nur auf und tut bei ueberlangen Werten
 *   gar nichts. Gelesen als "30/30 @millenium-fitnessok" — Hostname 18 Zeichen,
 *   Spalte 22, mit "30/30 " davor 24. Betraf JEDE Tabelle, nicht nur die
 *   Daemon-Liste, deshalb an der Wurzel behoben: ist der Wert zu lang, kommt
 *   immer ein Leerzeichen dahinter. Nicht abschneiden — ein halber Hostname
 *   waere schlimmer als eine verschobene Spalte.
 *
 * v3.10 — GRAFTING IST KEIN MANGEL.
 *   Gemeldet wurde: Rep-Ziel "MegaCorp" steht, aber WORK macht GRAFTING, das
 *   Ziel werde nicht bearbeitet. Woertlich richtig, als Befund falsch — und
 *   dazu im Subjekt verkehrt: WORK graftet nicht, BANK tut es. WORK GIBT DEN
 *   SLOT ABSICHTLICH FREI (GRAFTING-SCHUTZ, WORK v4.4), weil ein faelschlich
 *   uebernommener Slot einen laufenden Graft vernichtet und damit Stunden.
 *   Beim Auftreten stand das Ziel bei 1.695.941 von 1.750.000 — 97 Prozent,
 *   nichts hing. Jetzt eine ruhige Zustandszeile statt eines Befunds.
 *   DIESELBE FEHLERKLASSE WIE v3.8: eine absichtliche Mechanik, die DIAG
 *   nicht kannte, als Defekt gemeldet. Beim naechsten Befund dieser Art
 *   zuerst fragen, ob ein Daemon das mit Absicht tut.
 *
 * v3.9 — ZWEI FALSCHE ETIKETTEN.
 *   a) "18 Stadt/Staedte" gibt es nicht. Bitburner kennt SECHS Staedte; was
 *      CORP auf P31 sendet, ist die Summe ueber alle Divisionen
 *      (SCHWARM-CORP.js: ownDivs.reduce(... citiesByDiv[d].length)), also die
 *      Zahl der BUEROS. 18 = 6 Staedte x 3 Divisionen. Der Spieler hat es
 *      gesehen, bevor ich es gesehen habe.
 *   b) Abschnitt 5 war mit "Port 28" ueberschrieben — INFO sendet aber auf
 *      INFO_OUT = 9. Die 28 ist seit HELPERS v5.1 PLAN_OUT. Ich bin dem selbst
 *      als vermeintlichem Portkonflikt hinterhergelaufen. Die Nummer kommt
 *      jetzt aus SCHWARM_PORTS statt aus einem Zeichenketten-Gedaechtnis —
 *      dieselbe Lehre wie bei den alten "Port 25"/"Port 34"-Kommentaren:
 *      eine zweite Wahrheit driftet, die erzeugte driftet nicht.
 *   Reine Beschriftung, kein Verhalten geaendert.
 *
 * v3.8 — DAUER-FEHLALARM AUF EINE DOKTRIN-ENTSCHEIDUNG.
 *   Der BlackOp-Befund kannte die DAEDALUS-SPERRE des Bladeburner-Daemons
 *   nicht. Die ruhige Zustandszeile fuer die Finale galt nur dem Zweig mit
 *   enger Schaetzung; bei UNSCHARFER Schaetzung (ch[0] unter der Schwelle,
 *   ch[1] darueber) fiel "Operation Daedalus" in den dritten Zweig und
 *   erzeugte einen Befund: der Daemon solle "Field Analysis" laufen lassen.
 *
 *   Der Daemon tut das mit voller Absicht NICHT. Er nimmt die Finale gar
 *   nicht erst in chancePairs auf, damit sie NIE automatisch startet — sie
 *   beendet die BitNode, und diesen Ausloeser will der Spieler selbst in der
 *   Hand haben. Ohne Eintrag liefern minC/maxC 0, also kann auch sein
 *   Aufklaerungszweig nicht feuern. Alles korrekt, nur von aussen nicht zu
 *   sehen.
 *
 *   GEMESSEN: der Befund stand am 13.09.2026 ueber 12 Laeufe am Stueck als
 *   EINZIGER aktiver Befund im Destillat. Dieselbe Lehre wie in v3.6 und beim
 *   CORP-Export (v0.34): ein Befund, der immer steht und immer dieselbe
 *   richtige Antwort hat, ist Grundrauschen — und Grundrauschen macht die
 *   echten Befunde unsichtbar.
 *
 * v3.7 — DERSELBE MESSFEHLER, NUR AN ALLEN UEBRIGEN STELLEN.
 *   v3.6 hat unten die Kreuzprobe auf `rootU + hnU` umgestellt und dabei die
 *   richtige Lehre gezogen — aber nur an EINER Stelle angewandt. Ueberall
 *   sonst rechnete der Bericht weiter gegen `rootT`, also gegen das Netz OHNE
 *   die Hacknet-Server. Seit DISPATCHER v11.x sind die aber im Pool
 *   (`rooted = [...all, ...hnHosts]`).
 *
 *   AUFGEFALLEN im Kurzreport z601, der jetzt vom Pi abgeholt wird:
 *       PT=77.9T   BY=138.7T
 *   Belegt groesser als gesamt. Ursache: PT kam aus DIAGs Messung (ohne
 *   Hacknet), BY und die DK-Klassen aus dem Dispatcher-Snapshot (mit).
 *
 *   AM LIVEBERICHT 602 NACHGERECHNET — die Luecke ist exakt, nicht ungefaehr:
 *       gerootet ohne hacknet   101.9T
 *       hacknet-*                96.0T
 *       zusammen                197.9T   =   Dispatcher totalGb 197.9T
 *
 *   WAS DAS VERFAELSCHT HAT:
 *     - PT/PF im Kurzreport: Pool um 49 % zu klein. PF stand bei 934G,
 *       waehrend der Dispatcher 15.0T frei meldete — Faktor 16, und zwar in
 *       Richtung "Pool ist voll". Genau die Richtung, die zu falschen
 *       Schluessen fuehrt: RAM nachkaufen, Flotte drosseln.
 *     - home-Anteil und Kern-Empfehlung: durch den zu kleinen Nenner war der
 *       ausgewiesene Gesamtnutzen eines weiteren Kerns DOPPELT so hoch wie
 *       der echte (2.0 % statt 1.0 % Anteil). Kernpreise beginnen bei $7.5b.
 *     - Die Spur-Widerspruchsprobe verglich RAM ohne Hacknet gegen eine
 *       ps-Threadzahl mit Hacknet. Sie schlug bisher nur deshalb nicht an,
 *       weil beide Seiten zufaellig nahe der Saettigung lagen.
 *     - Die Zeile "Pool-Abweichung" meldete in JEDEM Lauf eine Abweichung in
 *       exakter Hoehe der Hacknet-Server — ein Dauer-Hinweis auf einen
 *       Unterschied, den DIAG selbst erzeugt hatte.
 *
 *   GEAENDERT: `takeRam` liefert jetzt zusaetzlich poolT/poolU/poolFree
 *   (gerootet + hacknet) an EINER Stelle. Alles, was die Frage "wieviel kann
 *   der Dispatcher benutzen" stellt, rechnet dagegen. rootT/rootFree bleiben
 *   erhalten und stehen weiter im Bericht — sie beantworten eine andere,
 *   ebenfalls sinnvolle Frage.
 *
 *   NEU im Kurzreport: `HN` = Hacknet-Anteil am Pool. Ohne ihn liess sich von
 *   aussen nicht nachpruefen, aus welchen zwei Teilen PT besteht — und genau
 *   diese Nachpruefung haette den Fehler frueher sichtbar gemacht.
 *
 *   NEU als Befund: belegt groesser als Pool gesamt. Arithmetisch unmoeglich,
 *   also immer ein Hinweis auf gemischte Quellen. Kostet nichts und faellt
 *   beim naechsten Mal sofort auf, statt wochenlang mitzulaufen.
 *
 * v3.6 — DER HAEUFIGSTE BEFUND WAR EIN MESSFEHLER DER DIAGNOSE SELBST.
 *   "Dispatcher verbucht N, real belegt sind N" stand in 263 von 431
 *   Berichten — 61 Prozent, sechs Tage lang, ohne dass je eine Ursache
 *   dahinter war.
 *
 *   URSACHE: Die Kreuzprobe verglich zwei verschiedene Mengen.
 *     dispSum  = alle Dispatcher-Klassen, INKLUSIVE Worker auf Hacknet-Servern
 *     realBusy = ramPeak.rootU, und takeRam schliesst Hacknet ausdruecklich
 *                aus (`if (rooted && !isHn)`)
 *   Uebrig blieb ein systematischer Ueberhang in Hoehe der Hacknet-Belegung.
 *   Am Bericht 458 nachgerechnet: 198.7T - 135.2T = 63.5T Differenz, und
 *   hacknet-* war mit 66.0T belegt.
 *
 *   Seit DISPATCHER v12.3 belegt er die Hacknet-Server sogar VOLLSTAENDIG,
 *   sobald Hashes wertlos sind — die Luecke wurde also mit der Zeit groesser.
 *
 *   Verglichen wird jetzt gegen rootU + hnU. Hash-Produktion verbraucht
 *   keinen RAM; belegter RAM auf einem Hacknet-Server sind immer Skripte.
 *   Der Schwellwert 1.25 bleibt unveraendert — geaendert wurde nur, WOGEGEN
 *   verglichen wird.
 *
 *   LEHRE, und sie steht vier Zeilen weiter unten schon einmal fuer einen
 *   anderen Befund: ein Dauer-Fehlalarm ist schlimmer als kein Befund. Er
 *   macht die echten unsichtbar, weil man sich an die rote Zeile gewoehnt.
 *
 *   Ebenfalls nachgetragen: DIAG_VERSION stand auf "3.4", waehrend der Kopf
 *   v3.5 sagte. SCHWARM-PRUEFER.pl kannte nur `const VERSION` und sah die
 *   Konstante nicht — das ist dort jetzt behoben.
 *
 * v3.5 — DER BERICHT ZEIGT JETZT, WAS DIE SLEEVES TUN.
 *   Bisher kamen die Sleeves im Bericht genau einmal vor: "SLEEVES virtuell —
 *   kein Prozess (Teil von WORK)". Was die acht Stueck ARBEITEN, stand
 *   nirgends. Aufgefallen ist das, als sie stundenlang Shoplift begingen: zu
 *   sehen war das ausschliesslich im Log von WORK — und ein Log ist weg,
 *   sobald der Daemon neu startet. Ein Zustand, den man nur im Vorbeigehen
 *   bemerken kann, wird irgendwann nicht bemerkt.
 *
 *   Neu unter "7 JOBS & ARBEIT": je Sleeve shock, sync, Kampfschnitt, Stadt
 *   und die laufende Aufgabe, darunter die Verteilung. Alle Werte aus dem
 *   sleeves-Block von INFO (SCHWARM-INFO.js:509-520), kein neuer RAM-Bedarf.
 *
 *   Dazu zwei Befunde, die der Bericht ab jetzt selbst stellt:
 *     - Sleeves auf CRIME, waehrend CrimeMoney der BitNode 0 ist. Das war der
 *       Zustand am 06.09.: sechs von acht auf Shoplift, fuer exakt $0.
 *     - Sleeves auf Shock 100. shockBonus() skaliert JEDEN Ertrag mit
 *       (100-shock)/100 — ein solcher Sleeve liefert nichts, sieht im Spiel
 *       aber beschaeftigt aus.
 *
 * v3.4 — HEALTHCHECK 7: ZWEI MODULE FEHLTEN DAUERHAFT IN DER VERSIONSZEILE.
 *   skriptVersionen sucht "— v<Zahl>" im Dateikopf und uebersprang alles
 *   andere still ("ohne Kopf: generierter Payload"). Das traf aber nicht nur
 *   die generierten Kleinskripte, sondern auch zwei echte Module mit anders
 *   formatiertem Kopf:
 *       SCHWARM-DARKNET.js v4.8 — ...    (Strich NACH der Version)
 *       SCHWARM-INFIL.js  v2.2           (gar kein Strich)
 *   Beide tauchten deshalb NIE in der Versionszeile auf — ausgerechnet DARKNET,
 *   die meistgeaenderte Datei. Nach einem Push war aus dem Bericht nicht
 *   nachpruefbar, welche Fassung dort laeuft.
 *
 *   Die beiden Koepfe sind angeglichen. Zusaetzlich meldet DIAG einen
 *   unlesbaren Kopf jetzt als "?" statt ihn zu verschlucken: fehlende
 *   Information ist selbst eine Information.
 *
 * v3.3 — BITNODE-STECKBRIEF IM BERICHT.
 *   Nach einem BitNode-Wechsel verhalten sich halbe Daemons anders, und zwar
 *   aus genau einem Grund: den BitNode-Multiplikatoren. Der Bericht zeigte die
 *   Nummer, aber nie die Regeln. Wer danach nachsah, musste raten oder die
 *   Engine-Quelle aufschlagen — bei jeder einzelnen Frage neu.
 *
 *   Die Daten lagen laengst da: SCHWARM-INFO.collectBn ruft
 *   getBitNodeMultipliers live auf (sofern SF5 vorhanden) und legt sie in den
 *   Block "bn". DIAG liest den INFO-Schnappschuss ohnehin schon (takeSample).
 *   Der Steckbrief kostet deshalb KEINEN einzigen zusaetzlichen ns-Aufruf und
 *   kein Gramm RAM — es fehlten nur die Zeilen, die es hinschreiben.
 *
 *   Gezeigt werden ausschliesslich Multiplikatoren, die von 1 ABWEICHEN;
 *   alles andere ist Normalzustand und wuerde nur Seiten fuellen. Werte auf
 *   NULL werden gesondert herausgestellt: sie bedeuten, dass eine ganze
 *   Einnahmequelle in dieser BitNode nicht existiert (BN8 z. B. setzt
 *   Hacking-, Crime- und Hacknet-Geld auf 0 — wer das nicht weiss, sucht den
 *   Fehler stundenlang im Schwarm statt in den Spielregeln).
 *
 *   Bei einem Wechsel im laufenden Dauerauftrag steht zusaetzlich "BN x -> y"
 *   dabei, mit dem Hinweis auf den Bericht davor: derselbe Rechner unter den
 *   alten Regeln, eine Datei zurueck.
 *
 * v3.2 — ABBRUCH-GRUENDE JE RUECKMELDEART. DARKNET v4.5 meldet den Grund
 *   jetzt fuer jede Art getrennt (mit ";;" verkettet); bisher kam nur EINER
 *   ueber alle Modelle, und damit war der des interessanten Modells praktisch
 *   nie zu sehen.
 *
 * v3.1 — DAUERLAUF. "run SCHWARM-DIAG.js 60 2000 0 10" heisst: endlos, alle
 *   10 Minuten ein Lagebild. Der Auftragsmodus (cycles > 0) bleibt exakt wie
 *   er war - N Zyklen, Zyklus 1 vollstaendig, Rest als Delta, eine Datei,
 *   danach Selbstabschaltung.
 *
 *   Im Dauerlauf waere das falsch herum: eine endlos wachsende Datei, und
 *   Delta-Eintraege, die ohne ihren Anfang wertlos sind. Deshalb schreibt dort
 *   JEDER Lauf ein eigenes, vollstaendiges Lagebild nach
 *   SCHWARM-REPORT-<lfd>.txt. Die Bruecke (ab v1.6) holt sie ab und loescht
 *   sie im Spiel - erst nachdem sie auf dem PC liegen.
 *
 *   Der Zaehler lfd steht im Plan und ueberlebt damit einen Neustart des
 *   Skripts. Ohne das begaenne er wieder bei 1 und ueberschriebe eine noch
 *   nicht abgeholte Datei.
 *
 *   Infinity ueberlebt JSON.stringify nicht (wird zu null), deshalb steht im
 *   Plan 0 fuer "endlos" und grenze() rechnet es zurueck.
 *
 * SCHWARM-DIAG.js — v3.0
 *
 * v3.0 — TAKTGENAUIGKEIT. ns.sleep(IV_MS) darf laenger dauern als IV_MS: die
 *   Engine gibt den Aufruf erst zurueck, wenn ihre Schleife wieder dran ist.
 *   Die Differenz ist ein direktes Ruckel-Mass, und sie kostet nichts — DIAG
 *   schlaeft ohnehin 30 mal je Lauf. Gemessen wird NUR der Schlaf, nicht die
 *   Messarbeit davor; sonst gaebe DIAG die eigene Last als Spiel-Last aus.
 *
 * SCHWARM-DIAG.js — v2.9
 *
 * v2.9 — DIE BANNERZEILE LOG. DIAG_VERSION stand auf "2.6", der Dateikopf auf
 *   v2.8. Im Bericht vom 04.09. stand oben "SCHWARM-DIAGNOSE v2.6" und zwei
 *   Zeilen darunter "DIAG 2.8" — die Versionszeile, die genau solche
 *   Falschbeschriftungen aufdecken soll, war selbst falsch beschriftet.
 *
 * v2.8 — STANEK-BEFUND AUF EINZELHOST UMGESTELLT. DIAG rechnete weiter mit der
 *   Poolsumme und empfahl deshalb Neustarts, die nichts bringen konnten: die
 *   Ladestaerke ist die Threadzahl EINES Skripts auf EINEM Host (Stanek.ts:53).
 *   Live gemeldet "im Pool waeren rund 4204 Threads frei, 40 % mehr" — der
 *   beste Einzelhost gab dort keine 600 her. Jetzt dieselbe Formel und dieselbe
 *   Hostmenge wie Queen (v6.9) und STANEK (v2.3), inklusive der exklusiven
 *   Grenzen auf Hacknet-Servern.
 *
 * v2.7
 *
 * v2.7 — VERSIONSZEILE im UEBERBLICK. Der Nutzer spielt die Dateien von Hand
 *   ein und hat mehrfach nicht gewusst, welcher Stand im Spiel liegt — einmal
 *   hielt er eine Datei fuer verloren, weil nur der Versionskopf nicht
 *   mitgezogen worden war. Gelesen werden die ersten 400 Zeichen jeder
 *   SCHWARM-*.js in der Wurzel von home; ns.read kostet 0 GB.
 *
 * v2.6  (Kursbeeinflussung sichtbar machen)
 *
 * v2.6 — NEUER ABSCHNITT 4d fuer die Kursbeeinflussung (Dispatcher v10.7,
 *   TRADER v1.4). Er stellt SOLL und IST gegenueber: was der Trader auf Port 34
 *   meldet, welche Server der Dispatcher dafuer gefunden hat, und wie viele
 *   Impuls-Aufrufe im Takt tatsaechlich gefeuert wurden.
 *   Die Trennung ist noetig, weil zwischen Wunsch und Wirkung drei Dinge liegen
 *   koennen: keine Position (dann meldet der Trader nichts — korrekt), kein
 *   passender Server (Level zu hoch, kein Root, Organisation ohne Pendant), oder
 *   kein RAM. Ohne die Gegenueberstellung waere nicht entscheidbar, welches.
 *   Dazu die Hochrechnung "~500 Impulse bis zur Saettigung" (Stock.ts:154-161,
 *   Schrittweite 0.1 auf einer 0-100-Skala) gegen die gemessene Rate.
 *   Neue Klasse "manip" in DCLASSES und drei Kennzahlen fuer den Verlauf.
 *
 * v2.5  (XP-Rechenweg auch im VOLLEN Report, BANK-RESERVE)
 *
 * v2.5 — ZWEI NACHTRAEGE.
 *   1) Der XP-Rechenweg stand in v2.4 nur im KURZreport und im --diag des
 *      Dispatchers, nicht im vollen SCHWARM-REPORT.txt. Gerade der wird aber
 *      gelesen, wenn man wissen will, warum die XP-Stufe wieviel bekommt. Jetzt
 *      steht er im Abschnitt "XP-Ertrag im Fenster".
 *   2) BANK v3.0 ersetzt den Spartopf durch eine RESERVE (Betriebssockel + HOLD +
 *      offene Freigaben) und meldet sie auf Port 14. Der Report zeigte weiter nur
 *      den Spartopf — also genau die Zahl, die seit v3.0 nichts mehr entscheidet.
 *      Neue Zeilen: RESERVE mit Aufschluesselung, frei fuer Investitionen, und die
 *      Finanzierungszeit des Grossziels (vertagt oder aktiv).
 *
 *
 * v2.4 — NEUE ZEILE "XP" im Kurzreport und ein Block im vollen Report. Dispatcher
 *   v10.5 legt seinen Rechenweg fuer die XP-Stufe in den Snapshot (Soll, Bestand,
 *   was passt, Bedarf, Wellen-Portion, gemessene Worker-Laufzeit, Wellenzahl,
 *   gefeuerte execs). Bis v2.3 liess sich der dauerhafte Leerstand von 135 TB nur
 *   HERLEITEN — die Worker-Laufzeit stand in keinem Report, und damit war die
 *   entscheidende Groesse unsichtbar. Diese Zeile macht sie nachpruefbar; liegt
 *   die Herleitung daneben, faellt es sofort auf.
 *   Die Zeile steht in JEDEM Zyklus (auch im diff): sie steckt nicht in den
 *   Metriken und erscheint deshalb in keiner CH-Zeile.
 *
 *
 * v2.3 — VIER KORREKTUREN, alle aus einem Livelauf mit 4 Zyklen.
 *
 *   1) TAKT DRIFTETE UM DIE FENSTERLAENGE. Die Wartezeit begann NACH dem
 *      Messfenster (`const until = Date.now() + GAP_MS`), der Abstand war also
 *      Fenster + Pause = 16 min statt 15. Live: 08:59:24 / 09:15:24 / 09:31:25 /
 *      09:47:26 — vier Laeufe in 48 statt 45 Minuten, und der Auftrag "4x in
 *      einer Stunde" endete zu spaet. Jetzt wird von START zu START gerechnet.
 *      Dauert ein Zyklus laenger als der Abstand, wird nicht negativ gewartet,
 *      sondern sofort weitergemacht — mit Vermerk, damit der Drift sichtbar ist.
 *
 *   2) KURZREPORT HIELT SICH NICHT AN "NUR AENDERUNGEN". Der volle Report macht
 *      es richtig (Zyklus 2+ = VERAENDERT-Liste), der Kurzreport wiederholte
 *      dagegen die komplette KZ-Zeile UND listete zusaetzlich CH — doppelt, ohne
 *      Informationsgewinn, denn CH traegt die Absolutwerte als "alt -> neu".
 *      Jetzt im diff-Modus nur CH, DK, F und LB.
 *      WARUM DK BLEIBT: die Klassenverteilung steckt NICHT in den Metriken und
 *      erscheint deshalb in keiner CH-Zeile. Ohne eigene Zeile verschwaende genau
 *      die Information, an der sich das XP-/Geld-Verhaeltnis verfolgen laesst
 *      (live: 77,7 TB auf xp gegen 442 GB auf core_h).
 *      WARUM PF/BY/WT NICHT EXTRA: die stehen in den Metriken und tauchen ohnehin
 *      als CH auf, sobald sie sich um mehr als 2 % bewegen — was praktisch immer
 *      der Fall ist. Eine zweite Fuehrung waere Redundanz.
 *
 *   3) LEERWERTE RUTSCHTEN DURCH. In der KZ-Zeile stand "RB=null": der Wert war
 *      der STRING "null", nicht echtes null, also griff die Pruefung
 *      `val === null` nicht. Jetzt filtert isEmptyMetric() null, undefined,
 *      Leerstring und die Strings "null"/"undefined"/"NaN".
 *
 *   4) BACKDOOR-SOLL WAR FALSCH. Die Soll-Spalte kam aus isDaemonEnabled, und das
 *      liefert fuer triggered-Daemons ohne State-Eintrag "aus" — der Dispatcher
 *      startet BACKDOOR aber seit v10.4 ohne Schalter (nur eine ausdrueckliche 0
 *      stoppt ihn). Ergebnis war der Fehlbefund "Schalter aus, Prozess laeuft
 *      trotzdem". Daemons mit owner "HACKING" zeigen jetzt "auto" und erzeugen
 *      keinen Befund.
 *
 *   5) TITELZEILE stand hartkodiert auf "v2.1" — derselbe Fehler wie in v1.3
 *      (Kommentarkopf gepflegt, Ausgabe nicht). Jetzt aus einer Konstante.
 *
 * v2.2 — VIER LUECKEN GESCHLOSSEN, EINE FEHLINFORMATION KORRIGIERT.
 *
 *   1) BACKDOOR kam in dieser Datei GAR NICHT VOR. `backdoorPending` liegt seit
 *      Dispatcher v9 im Port-25-Snapshot; niemand hat es ausgewertet. Genau
 *      deshalb blieb monatelang unbemerkt, dass der Dispatcher den Payload nie
 *      startete (Gate-Fehler, behoben in v10.4): der Wert stand die ganze Zeit da.
 *      Eine Diagnose, die eine vorhandene Zahl nicht liest, ist an dieser Stelle
 *      wertlos. Neuer Abschnitt 4b mit eigenem Befund, wenn offene Ziele UND kein
 *      laufender Worker zusammentreffen.
 *
 *   2) INFIL kam ebenfalls nicht vor, obwohl es selbst mitschreibt:
 *      /infil-log.txt (Ringpuffer, Zeitstempel + Klartext-Praefix REP/MONEY/NONE/
 *      ABBRUCH), /infil-goals.txt, /infil-targets(-stamp).txt, /infil-probe.txt.
 *      Neuer Abschnitt 4c: Erfolgsverhaeltnis, Cache-Alter, Ziele, Probe-Auszug.
 *      Alles ueber ns.read -> 0 GB zusaetzlich.
 *
 *   3) FEHLINFORMATION: die xpIsCore-Erklaerung behauptete, die xp-Klasse zeige
 *      "deshalb 0 GB, waehrend die Threads unter core_w laufen. Kein Fehler."
 *      Das war fuer Dispatcher v10.2 richtig. Seit v10.3 sind die
 *      Buchungsschluessel getrennt ("art|klasse|ziel"), die xp-Klasse zeigt echte
 *      Werte — der alte Text haette eine korrekte Zahl als Artefakt wegerklaert.
 *
 *   4) TOTER ZWEIG: disp.shareTorn wurde noch gelesen. Das Feld gibt es seit
 *      Dispatcher v10 nicht mehr (keine Kills, One-Shots raeumen sich selbst).
 *
 *   5) NEUE SNAPSHOT-FELDER ausgewertet: busyGb (exakt gemessene Belegung statt
 *      Herleitung), limits (welche Deckel tatsaechlich gegriffen haben, statt zu
 *      raten), resAgeMs (Queen-Heartbeat auf Port 6 — der Vermerk "abgelaufene
 *      Reservierung" war bis Dispatcher v10.3 ein Messfehler und kein Befund),
 *      backdoorRunning/Pending/Started.
 *
 *   6) PORT-UEBERSICHT vervollstaendigt: 11 RESET_READY, 12 BANK_REQ, 19-21
 *      DARKNET, 24 TOPO, 29 INFO_RPC_REQ, 32 GANG_INFO, 33 HASH_INFO.
 *
 *   7) KURZREPORT schwarm-kurz.txt — dieselben Daten in Kuerzeln, eine Zeile je
 *      Sachverhalt, ohne Rahmen und ohne Erklaertexte. Gedacht zum Weitergeben an
 *      eine Auswertung ausserhalb des Spiels; der volle Report bleibt unveraendert
 *      fuer den Menschen am Bildschirm.
 *      WICHTIG: die Legende (schwarm-legende.txt) wird GENERIERT, aus derselben
 *      Tabelle SHORT_KEYS, aus der auch geschrieben wird. Eine handgepflegte
 *      Legende waere eine zweite Quelle fuer dieselbe Information und wuerde beim
 *      ersten geaenderten Kuerzel still falsch — dasselbe Muster wie damals
 *      AUG_WEIGHTS gegen das TIER-Array in AUGS. Die Kopfzeile traegt eine
 *      Formatversion, damit ein Leser eine Abweichung bemerkt statt zu raten.
 *
 *   8) VERLAUF IST JETZT DER STANDARD: ohne Argumente 4 Lagebilder im Abstand von
 *      15 Minuten (vorher 1 Lagebild). Ein Standbild zeigt nicht, ob ein Bestand
 *      nur waechst oder eine Zahl nur einmal ausgerutscht ist — genau das war bei
 *      den Bladeburner-Skillpunkten und beim ersten Dispatcher-Report das Problem
 *      (jener entstand 16 s nach dem Start und zeigte deshalb 75 % freien Pool).
 *      Nach dem letzten Zyklus schaltet DIAG sich wie bisher selbst ab.
 *
 * v2.1 — Drei Fehlalarme aus dem ersten 8-Stunden-Nachtlauf beseitigt:
 *   1. "XP-Stufe belegt 0G" — das XP-Ziel (foodnstuff) ist gleichzeitig ein Geld-Ziel,
 *      XP- und CORE-weaken teilen den Buchungsschlüssel. Dispatcher v10.2 meldet die
 *      Überlappung als xpIsCore; DIAG erklärt sie statt sie anzuklagen.
 *   2. Fehlender Daemon: erst prüfen, ob der OWNER ein WANT gesendet hat, bevor
 *      RAM-Enge behauptet wird. 16 Zyklen "reserviert 96G" bei BLADEBURNER, obwohl
 *      der wahre Grund war, dass WORK kein WANT sendet.
 *   3. Selbstbezug ("DIAG: Schalter aus, läuft aber") unterdrückt.
 *
 * v2.0 — DAUERLAUF. Mehrere Lagebilder im Abstand von N Minuten; das erste
 *   vollstaendig, die weiteren nur mit Veraenderungen. Reset-fest ueber eine
 *   Fortschrittsdatei. Siehe Abschnitt DAUERLAUF unten.
 *
 * v1.8 — Anzeige "killed undefined" entfernt. Dispatcher v10 kennt keine Kills mehr
 *   (One-Shot-Worker raeumen sich selbst), der Snapshot fuehrt das Feld nicht mehr.
 *
 * v1.7 — Abschnitt 3b Bladeburner: Rang, Chaos, Ausdauer, Skillpunkte IM VERLAUF und
 *   die nächste BlackOp mit Rang-Abgleich. Zwei Betriebsbeobachtungen sollen damit
 *   messbar werden: Skillpunkte stapeln sich auf 100k+ ohne Ausgabe, und angebotene
 *   BlackOps werden nicht immer gestartet. Beides braucht Verlauf — ein Standbild
 *   zeigt nicht, ob der Bestand nur wächst.
 *
 * v1.6 — Der Rep-Ziel-Abgleich erfasst jetzt auch den Fall, dass WORK gar keine
 *   Faktionsarbeit macht (Durchfall in Firma oder Crime). Vorher feuerte die Regel
 *   nur bei FACTION-Arbeit für die falsche Faktion und übersah damit den realen
 *   Fall: Ziel "Slum Snakes" gesetzt, tatsächlich COMPANY-Arbeit bei FoodNStuff.
 *   Zusätzlich wird erkannt und benannt, wenn das Ziel die GANG-Faktion ist.
 *
 * v1.5 — bn aus der Frische-Prüfung genommen (NO_STALE_CHECK). Der Block trägt
 *   BitNode-Nummer und Source-File-Level, hat kein Planintervall und wird von INFO
 *   absichtlich fast nie erneuert; die Meldung "STALE" war ein Fehlalarm.
 *
 * v1.4 — Prüfstring für den Slot-Schutz korrigiert: "The Blade's Simulacrum"
 *   statt des Enum-Schlüssels "BladesSimulacrum". Der Fehlalarm behauptete, das
 *   Aug fehle, während Faktionsarbeit und Bladeburner-Operation nachweislich
 *   parallel liefen.
 *
 * v1.3 — Korrekturen nach dem zweiten Livereport:
 *   1. Titelzeile im Report zeigte weiter v1.0 (nur der Kommentarkopf war gepflegt).
 *   2. Block-Frische kommt jetzt aus INFOs eigener Intervall-Tabelle (Snapshot-Feld
 *      `iv`, INFO v1.4) mal STALE_TOL, statt aus einer geratenen Tabelle. Die alte
 *      Annahme meldete `market` dauerhaft als veraltet (30 s angenommen, planmäßig
 *      180 s) und führte einen Block `company`, den INFO gar nicht kennt. Bewertet
 *      werden nur noch Blöcke, die im Snapshot wirklich vorkommen.
 *   3. Neuer Befund: Rep-Ziel (Port 17) gegen tatsächliche Faktionsarbeit geprüft —
 *      im Report forderte BANK "Slum Snakes", gearbeitet wurde für "The Black Hand".
 *
 * v1.2 — Abschnitt 3b "XP-Ertrag": Hacking-Level und -XP im Verlauf, XP/s, XP/s je TB
 *   Einsatz sowie die drei nächsten Prep-Freischaltungen mit Level-Lücke (braucht
 *   prepNext aus Dispatcher v9.2). Hintergrund: STUFE 4 schiebt allen Rest-RAM in
 *   XP-weaken — im ersten Livereport 42 % des Pools — und die Prep-Ziele hängen
 *   ausschließlich am Level (need <= level). Ohne Wirkungsnachweis ist nicht
 *   entscheidbar, ob dieser Einsatz den Engpass abbaut. Datenquelle ist der
 *   player-Block (skills/exp), kostet also keine zusätzlichen NS-Aufrufe.
 *
 * v1.1 — Korrekturen nach dem ersten Livereport (alle Punkte dort belegt):
 *   1. INFO-Zeitstempel heißt ts, nicht t. Vorher meldete DIAG "INFO tickt nicht",
 *      während das Logbuch laufend frische Blöcke zeigte. Gegenprobe ergänzt:
 *      Befund nur, wenn AUCH kein einzelner Block seinen ts bewegt hat.
 *   2. Kopfzeile korrigiert — DIAG nutzt eine eigene BFS, hacknet-* ist im Scan.
 *   3. Block "company" in die Frische-Liste aufgenommen (INFO liefert 14, nicht 13).
 *   4. "Pool voll" ist kein Fehler mehr per se: nur Befund, wenn etwas daran
 *      scheitert (execFail > 0 oder ein gewollter Daemon ohne Prozess). Sonst Hinweis.
 *   5. Aug-Kaufziel: Standzeit zählt. Erschien es erst kurz vor Fensterende, ist das
 *      kein Urteil über AUGS (Fehlalarm im ersten Report: Ziel kam bei 54 s von 60 s).
 *   6. Gegenprobe "share ohne Grind" — der eigentliche Fund des ersten Reports
 *      (92,6 TB Endlos-Worker). Seit Dispatcher v10 sind share-Worker One-Shots;
 *      der Befund feuert daher nur, wenn sich der Bestand HAELT (v2.2).
 *   7. Freies RAM wird gegengeprüft, nicht nur die Summe (Dispatcher meldete 7 GB
 *      frei, real 11,2 TB — seine Sicht hinkt einen Takt nach).
 *   8. Work-Slot-Schutz: prüft BladesSimulacrum INSTALLIERT vs. nur gekauft, weil
 *      Bladeburner.process() mit ignoreQueued=true prüft. Braucht INFOs installed-Liste.
 *
 * ZWECK: ein Verlaufsbild über ~60 s. Zeigt, was läuft, was nicht läuft, was
 * anders läuft als gedacht und wo sich Dinge gegenseitig blockieren. Schreibt
 * alles nach SCHWARM-REPORT.txt (überschreibt bei jedem Lauf).
 *
 * REIN LESEND — kein exec, kein kill, keine Singularity, kein evalNs. Genutzte
 * NS-Funktionen und ihre statischen Kosten (RamCostGenerator.ts):
 *   Basis 1.60 | ps 0.20 | scan 0.20 | getServerMaxRam 0.05 | getServerUsedRam
 *   0.05 | hasRootAccess 0.05 | getHostname 0.05 | getPlayer 0.50 (flach!
 *   Tabelleneintrag ist SingularityFn1/4 und NICHT in SF4Cost() gewickelt, also
 *   SF4-unabhängig) | peek/read/write/sleep 0
 *   => ~2.70 GB. RAM wird EINMAL pro Funktion berechnet, nicht pro Aufruf —
 *   die 30 Sample-Runden kosten deshalb nichts zusätzlich.
 *
 * RAM-FALLE (RamCalculations.ts, MemberExpression -> Identifier -> addRef):
 * der Scanner zählt JEDEN Identifier, auch Objekt-Eigenschaften bei Punkt-
 * Zugriff. `used.share` würde die Kosten von ns.share aufschlagen. Im Code
 * steht deshalb konsequent used["share"] — ein String-Literal ist ein Literal-
 * Knoten und erzeugt keine Referenz.
 *
 * DAUERLAUF: run SCHWARM-DIAG.js <FensterSek> <IntervallMs> <Zyklen> <AbstandMin>
 *   STANDARD (ohne Argumente, also auch per Dashboard-Knopf): 60 2000 4 15
 *   -> 4 Lagebilder im Abstand von 15 min = eine Stunde, dann Selbstabschaltung.
 *   Beispiel Nachtlauf: run SCHWARM-DIAG.js 60 2000 16 30  -> 8 Stunden.
 *   Zyklus 1 schreibt den VOLLEN Report, jeder weitere haengt nur die
 *   VERAENDERUNGEN an (Schwelle 2 %, damit Zahlen nicht rauschen) samt Befunden und
 *   gekuerztem Logbuch. Ein Aug-Install mitten im Lauf beendet DIAG; der Fortschritt
 *   steht in schwarm-diag-lauf.txt (Textdatei -> ueberlebt), die Queen startet DIAG
 *   neu (Schalter steht in der ebenfalls ueberlebenden State-Datei), und der Lauf
 *   wird fortgesetzt. Der Reset wird im Report ausdruecklich vermerkt.
 *
 * START: Dashboard-Schalter DIAG (Queen sucht Host, Dispatcher macht RAM frei).
 * Nach dem Report schaltet DIAG sich SELBST AB (setDaemonEnabled -> 0), ein
 * Klick = ein Report. Manuell: run SCHWARM-DIAG.js [Sekunden] [Intervall-ms]
 *
 * @param {NS} ns
 */
import {
    SCHWARM_PORTS, DAEMONS,
    readManagedState, isDaemonEnabled, readCapabilities,
    readBankInfo, readCorpInfo, readReservations, readTreasury,
    readPortfolioValue, readLiquidationRequest, readRepTarget,
    readShareWanted, readHashCacheNeed, readInfoSnapshot, getPhase,
    setDaemonEnabled, readOut, readAugBuy, readResetReady, planFreigabe,
    daemonBereit, bereitSpielerInfo,   // DAEMONS steht schon oben — nicht doppelt!
    corpBesteht,                       // v3.26: CORP laeuft nur mit Corp (QUEEN v7.17)
    chronikLesen, CHRONIK_KUERZEL,     // v3.22: das Handlungsbuch
    chronikUmschichten,                // v3.24: Port 35 je Probe in die Datei
    BEREIT_GANG_KARMA, BEREIT_BLADE_STAT,
} from "SCHWARM-HELPERS.js";

const OUT_FILE = "SCHWARM-REPORT.txt";
const SHORT_FILE = "schwarm-kurz.txt";       // v2.2: Kurzfassung zum Weitergeben
const LEGEND_FILE = "schwarm-legende.txt";   // v2.2: GENERIERT, nie von Hand pflegen
const DIAG_VERSION = "3.26";   // EINE Quelle fuer Kopfzeile und Kurzreport-Format
// NACHGETRAGEN AM 11.09.: stand auf "3.4", waehrend der Dateikopf schon v3.5
// sagte — dieselbe Falle, vor der oben (Zeile 95 und 368) bereits zweimal
// gewarnt wird. Im Bericht vom 11.09. stand oben "SCHWARM-DIAGNOSE v3.4" und
// in der Versionszeile "DIAG 3.5".
//
// Warum es niemand bemerkt hat: SCHWARM-PRUEFER.pl prueft den Kopf gegen
// `const VERSION` — diese Konstante heisst aber DIAG_VERSION und fiel deshalb
// durch das Raster. Der Pruefer erkennt ab sofort jede Konstante mit VERSION
// im Namen.
// v2.9: stand auf "2.6", waehrend der Dateikopf schon v2.8 sagte. Die Bannerzeile
//   meldete damit eine Version, die es nicht gab — im Bericht vom 04.09. stand oben
//   "SCHWARM-DIAGNOSE v2.6" und zwei Zeilen darunter "DIAG 2.8". Genau die Sorte
//   Falschbeschriftung, die die Versionszeile eigentlich verhindern soll.
//   SHORT_FORMAT haengt daran, wird aber nur innerhalb dieser Datei angezeigt
//   (Zeile 537 Legende, Zeile 3028 JSON-Feld) — kein anderer Daemon liest es.
const SHORT_FORMAT = DIAG_VERSION;                  // Formatversion in Zeile 1 des Kurzreports

// INFIL schreibt diese Dateien selbst (SCHWARM-INFIL v2.x). Reines ns.read -> 0 GB.
const INFIL_LOG = "/infil-log.txt";
const INFIL_GOALS = "/infil-goals.txt";
const INFIL_STAMP = "/infil-targets-stamp.txt";
const INFIL_PROBE = "/infil-probe.txt";
const BACKDOOR_FILE = "SCHWARM-BACKDOOR.js";

/**
 * KUERZEL-TABELLE des Kurzreports — die EINZIGE Quelle. Aus ihr wird geschrieben
 * UND die Legende erzeugt; eine zweite, handgepflegte Liste wuerde beim ersten
 * geaenderten Kuerzel still falsch werden.
 * Aufbau: [Kuerzel, Schluessel in `metrics`, Klartext, Typ].
 * Der TYP steuert die Formatierung ("money" -> $-Suffix, "gb" -> G/T, "n" -> Zahl,
 * "s" -> Text) UND die Einheitenangabe in der Legende. Ohne ihn muesste die
 * Formatierung an einer zweiten Stelle nach Feldnamen entscheiden — und genau
 * solche Doppelungen laufen beim naechsten neuen Feld auseinander.
 */
const SHORT_KEYS = [
    ["M",  "geld",        "Barvermoegen",                          "money"],
    ["L",  "level",       "Hacking-Level",                         "n"],
    ["XP", "xpGesamt",    "Hacking-Erfahrung gesamt",              "n"],
    ["PT", "poolTotal",   "Pool gesamt (gerootet + Hacknet-Server = Dispatcher-Basis)", "gb"],
    ["PF", "poolFrei",    "Pool ungenutzt",                        "gb"],
    ["HN", "poolHacknet", "davon auf Hacknet-Servern",             "gb"],
    ["BY", "busy",        "Pool belegt (gemessen, Dispatcher v10.3+)", "gb"],
    ["HO", "hosts",       "gerootete Hosts (ohne Hacknet)",        "n"],
    ["TG", "ziele",       "bewertete Geld-Ziele",                  "n"],
    ["PR", "prep",        "Prep-Ziele",                            "n"],
    ["EF", "execFail",    "fehlgeschlagene exec im Fenster",       "n"],
    ["WT", "wThreads",    "Worker-Threads gesamt",                 "n"],
    ["SP", "spartopf",    "BANK-Spartopf",                         "money"],
    ["SZ", "sparziel",    "aktives Grossziel",                     "s"],
    ["HE", "hackEma",     "Hacking-Ertrag je GB und Stunde (EMA)",  "money"],
    ["PH", "phase",       "Bootstrap-Phase",                       "s"],
    ["AR", "arbeit",      "aktuelle Spieler-Arbeit",               "s"],
    ["JB", "jobs",        "Anzahl Firmen-Anstellungen",            "n"],
    ["RZ", "repZiel",     "gemeldetes Rep-Ziel (Port 17)",         "s"],
    ["AK", "augKauf",     "Aug-Kaufauftrag (Port 18)",             "s"],
    ["RB", "resetBereit", "Reset-Bereitschaft (Port 11)",          "s"],
    ["BR", "bladeRang",   "Bladeburner-Rang",                      "n"],
    ["BS", "bladeSkill",  "Bladeburner-Skillpunkte",               "n"],
    ["DA", "daemonsAn",   "laufende Registry-Daemons",             "n"],
    ["FB", "befunde",     "Anzahl Befunde in diesem Zyklus",       "n"],
    ["MZ", "manipZiele",  "Beeinflussungsziele (Port 34)",          "n"],
    ["MG", "manipGb",     "RAM in der Beeinflussungs-Klasse",       "gb"],
    ["MC", "manipCalls",  "Impuls-Aufrufe im letzten Takt",         "n"],
];

/** Zeilen-Praefixe des Kurzreports (ebenfalls Quelle fuer die Legende). */
const SHORT_LINES = [
    ["#SK", "Kopf: Formatversion, Zyklus, Uhrzeit, Host"],
    ["KZ",  "Kennzahlen (nur im vollen Zyklus; Kuerzel siehe Tabelle unten)"],
    ["DK",  "Dispatcher-Klassen in GB: core_w/core_g/core_h/prep/xp/share/fremd/nicht-klassifiziert"],
    ["DL",  "Dispatcher: aktive Deckel (nur voller Zyklus; im diff als CH deckel)"],
    ["DQ",  "Dispatcher: Queen-Heartbeat auf Port 6 in s (-1 = kein Zeitstempel)"],
    ["BD",  "Backdoor: r=laufend/offen  st=in dieser Instanz gestartet  [Ziele]; im diff nur die Ziele"],
    ["XP",  "XP-Stufe: soll/ist/passt Threads, port=Portion je Takt, wt=Worker-Laufzeit s, ft=Wellen-Takte, ex=execs"],
    ["IF",  "INFIL: n=Logzeilen  ok=REP+MONEY  abr=Abbrueche (nur voller Zyklus; im diff als CH)"],
    ["F",   "Befund (durchnummeriert)"],
    ["CH",  "Aenderung gegenueber dem Vorzyklus: Schluessel alt -> neu (ab 2 % Abweichung)"],
    ["LB",  "Logbuch-Zeile aus dem Messfenster"],
];
// Fortschritt des Dauerauftrags. Textdatei -> ueberlebt den Aug-Reset
// (ServerHelpers.ts:224 leert nur programs und messages, nicht textFiles).
const STATE_FILE_DIAG = "schwarm-diag-lauf.txt";
const SELF_KEY = "DIAG";
// v3.19 — WIE OFT HINTEREINANDER STANDEN ALLE AUF "Territory Warfare"?
//
// Eine Momentaufnahme kann das GEPLANTE Fenster nicht vom Stillstand
// unterscheiden. GANG schaltet die Mitglieder absichtlich kurz vor dem
// Territoriums-Tick auf Warfare, weil Power NUR im Tick-Moment gutgeschrieben
// wird (Gang.ts:186 ff.) — das Fenster deckt die letzten 25 von 100 Cycles ab.
// DIAG trifft es damit in rund einem Viertel der Stichproben und meldete es
// bis v3.18 jedes Mal als Dauerzustand ("kann nicht rekrutieren").
//
// Am 19.09.2026 nachgewiesen: ueber sechs Berichte hinweg wechselte warfare
// false/false/true/false/true/true, und die Power stieg dabei stetig von 17,8
// auf 35,6. Es war also nie ein Stillstand — nur die Meldung klang so.
//
// DIAG laeuft als Schleife mit GAP_MIN Minuten Abstand. Zwei Beobachtungen
// hintereinander liegen damit ~20 Minuten auseinander, das Fenster dauert
// hoechstens Sekunden. Erst ab dann ist es wirklich ein Befund.
// Der Zaehler lebt im Prozess; ein DIAG-Neustart setzt ihn zurueck, und das
// ist richtig so — nach einem Neustart ist nichts beobachtet.
const GANG_WARFARE_STREAK_MIN = 2;
let gangWarfareStreak = 0;
// v3.25: CORP_OUT gilt als frisch bis zu dieser Sekundenzahl. CORP
// veroeffentlicht etwa alle 35 s (z1789: 19:35:03 / 19:35:38).
const CORP_PORT_FRISCH_S = 120;
// v3.25: so viele frische Berichte in Folge ohne neue Stadt, bevor es ein
// Befund ist. CORP kauft je Runde hoechstens EINE Stadt je Division (vor der
// Reihum-Wahl) und nur, wenn jede einzelne Stadt gesund ist - einzelne
// Berichte ohne Zuwachs sind normal.
const CORP_STAEDTE_SERIE_MIN = 3;
const corpStaedteSerie = {};    // Division -> { staedte, n }
// v3.4: Anlauf-Skripte. Keine Daemons — deshalb nicht in der Registry und
// bisher unsichtbar. Siehe den BOOTSTRAP-Block in Abschnitt 2.
const BOOT_FILES = { "SCHWARM-GENESIS.js": "GENESIS", "SCHWARM-ARSENAL.js": "ARSENAL" };
const DUR_DEF  = 60_000;   // Fensterlänge
const IV_DEF   = 2_000;    // Sample-Abstand (= Dispatcher-Fast-Tick)

// Worker-Payloads des Dispatchers (Kleinschreibung ist Absicht, s. PAYLOADS).
const WORKER_FILES = {
    "schwarm-w.js": "W", "schwarm-g.js": "G", "schwarm-h.js": "H",
    // v3.0: XP-Dauerlaeufer. Eigenes Kuerzel, damit im Prozessbild auf einen Blick
    // zu sehen ist, welche Threads von selbst enden (W) und welche geerntet werden
    // muessen (XPL) — der Unterschied entscheidet, ob ein voller Host ein Problem ist.
    "schwarm-wl.js": "XPL",
    "schwarm-s.js": "SHR", "schwarm-solver.js": "SOLV",
};
// v3.1 BUGFIX: "XPL" fehlte. WORKER_FILES kennt das Kuerzel seit v3.0, diese
// Liste nicht — und sie steuert BEIDES: das Vor-Nullen der Zaehler (takeProcs)
// und die gedruckten Zeilen. Folge: wsum["XPL"] lief auf undefined + n = NaN,
// waehrend wtotal die Threads mitzaehlte. Die Tabelle zeigte also W/G/H/SHR/SOLV
// mit ein paar tausend Threads und darunter eine "Summe" von ueber vier
// Millionen, ohne Zeile fuer die Differenz — ausgerechnet der groesste
// RAM-Verbraucher des Schwarms war in der einzigen Tabelle unsichtbar, die
// echte Prozesse je Klasse auflistet. Und diese Tabelle ist die unabhaengige
// Gegenprobe zum Dispatcher-Snapshot; ohne die Zeile prueft sie nichts mehr.
const WCLASSES  = ["W", "G", "H", "SHR", "SOLV", "XPL"];
const QUEEN_FILE = "SCHWARM-QUEEN.js";

// Dispatcher-Klassen aus dem Port-25-Snapshot. "share" NUR als String führen.
const DCLASSES = ["core_w", "core_g", "core_h", "prep", "xp", "share", "manip", "foreign"];

// Frische-Bewertung der INFO-Blöcke.
// v1.3: die Sollwerte kommen jetzt aus dem Snapshot selbst (Feld `iv`, INFO v1.4)
// und werden mit STALE_TOL multipliziert. Vorher stand hier eine GERATENE Tabelle —
// sie meldete `market` dauerhaft als veraltet (angenommen 30 s, planmäßig 180 s)
// und einen Block `company`, den INFO überhaupt nicht führt. Ein Prüfer darf seine
// Erwartung nicht erfinden, wenn die geprüfte Stelle sie selbst kennt.
const STALE_TOL = 3;          // erst ab dem Dreifachen des Planintervalls auffällig
const IV_FALLBACK = 120_000;  // für Blöcke ohne Eintrag in iv
// v1.5: Blöcke ohne Planintervall, deren Inhalt sich nie ändert. bn trägt BitNode-
// Nummer und Source-File-Level — INFO erneuert das absichtlich fast nie. Als
// "STALE" zu melden war ein Fehlalarm (live: 1477 s Alter, Inhalt korrekt).
const NO_STALE_CHECK = new Set(["bn"]);

// ---------- Formatierer (eigene, damit keine Abhängigkeit von formatNumber) ----------
const nGb = (v) => (!isFinite(v) || v === null) ? "—" : (v >= 1024 ? (v / 1024).toFixed(1) + "T" : Math.round(v) + "G");
const nMoney = (v) => {
    const x = Number(v);
    if (!isFinite(x)) return "—";
    const a = Math.abs(x), s = x < 0 ? "-" : "";
    if (a >= 1e12) return s + "$" + (a / 1e12).toFixed(2) + "t";
    if (a >= 1e9)  return s + "$" + (a / 1e9).toFixed(2) + "b";
    if (a >= 1e6)  return s + "$" + (a / 1e6).toFixed(2) + "m";
    if (a >= 1e3)  return s + "$" + (a / 1e3).toFixed(1) + "k";
    return s + "$" + a.toFixed(0);
};
const nNum = (v, d = 1) => (isFinite(v) ? Number(v).toFixed(d) : "—");
// v3.18: Stueckzahlen kurz (Lagergroessen). Bewusst KEIN nMoney — das setzt
// ein Dollarzeichen davor, und Lager werden in Einheiten gemessen, nicht in Geld.
const fmtK = (v) => {
    const n = Number(v);
    if (!isFinite(n)) return "—";
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "G";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(Math.round(n));
};
// v2.8: Ab dieser UNTEREN Schaetzgrenze gilt eine BlackOp als startbar. Die
// Engine liefert eine Spanne [min, max]; die Breite ist die Unsicherheit aus
// fehlender Aufklaerung. Auf das MINIMUM abzustellen ist die vorsichtige Wahl —
// eine gescheiterte BlackOp kostet Rang und Teammitglieder.
// v3.14 — MUSS MIT DEM DAEMON UEBEREINSTIMMEN.
// Hier stand 0.80, waehrend der BLADEBURNER-Payload seit jeher
// CFG.SUCCESS_MIN = 0.95 verlangt. Folge: DIAG meldete jede Operation ab 80 %
// als "lohnt" und fragte, ob der Daemon sie startet — bei 93,3 % also einen
// Befund, obwohl der Daemon voellig korrekt wartete. Vierter Fehlalarm dieser
// Familie, und diesmal aus dem klassischen Grund: DIESELBE FRAGE, ZWEI ZAHLEN,
// ZWEI DATEIEN. SCHWARM-PRUEFER.pl vergleicht die beiden Werte seit heute bei
// jedem Push; wer einen aendert, muss den anderen mitziehen.
const BLACKOP_MIN_CHANCE = 0.95;
// v3.11: padEnd FUELLT NUR AUF — ist der Wert laenger als die Spalte, fehlt die
// Trennung ganz und die naechste Spalte klebt daran. Live gelesen als
// "30/30 @millenium-fitnessok": der Hostname ist 18 Zeichen lang, die Spalte 22,
// mit "30/30 " davor also 24. Kein Funktionsfehler, aber beim Ueberfliegen
// falsch verstanden — und das ist in einem Lagebericht dasselbe wie ein Fehler.
// Ueberlange Werte bekommen deshalb IMMER ein Leerzeichen. NICHT abschneiden:
// ein halber Hostname waere schlimmer als eine verschobene Spalte.
const padR = (v, n) => {
    const s = String(v === undefined || v === null ? "—" : v);
    return s.length >= n ? s + " " : s.padEnd(n);
};
const padL = (v, n) => String(v === undefined || v === null ? "—" : v).padStart(n);
const jparse = (v) => { try { return (typeof v === "string" && v.length && v !== "NULL PORT DATA") ? JSON.parse(v) : null; } catch (e) { return null; } };
const clock = (t) => { try { return new Date(t).toLocaleTimeString(); } catch (e) { return String(t); } };

/**
 * KURZREPORT (v2.2). Dieselben Daten wie der volle Report, aber als eine Zeile je
 * Sachverhalt: Kuerzel statt Klartext, keine Rahmen, keine Erklaertexte, Tabellen
 * nur mit Abweichern. Gedacht zum Weitergeben an eine Auswertung ausserhalb des
 * Spiels — der volle Report bleibt fuer den Menschen am Bildschirm.
 *
 * ERZEUGT AUS DEN STRUKTURIERTEN DATEN, nicht aus dem Reporttext. Sonst waere es
 * eine zweite Formatierung derselben Sache, die beim ersten geaenderten Satz
 * auseinanderlaeuft.
 *
 * @param {object} a  { formatVersion, cycleNo, cycles, stamp, host, metrics, prev,
 *                      findings, book, disp, bdTargets, infilLast, isFirst }
 * @returns {string[]}
 */
/**
 * Ist eine Kennzahl leer? v2.3: In der KZ-Zeile stand live "RB=null" — der Wert
 * war der STRING "null" (aus einem JSON-Feld), nicht echtes null, also griff die
 * Pruefung `val === null` nicht. Solche Platzhalter kommen aus mehreren Quellen
 * (Ports liefern "null", nicht gesetzte Felder undefined), deshalb EINE Stelle.
 */
function isEmptyMetric(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === "number") return !isFinite(v);
    const t = String(v).trim();
    return t === "" || t === "null" || t === "undefined" || t === "NaN" || t === "—";
}

function buildShort(a) {
    const K = [];
    const v = (x) => (x === null || x === undefined) ? "-" : String(x);
    const gb = (x) => (x === null || x === undefined) ? "-" :
        (x >= 1024 ? (x / 1024).toFixed(1) + "T" : Math.round(x) + "G");

    K.push(`#SK ${a.formatVersion} z${a.cycleNo}/${a.cycles} ${a.stamp} @${a.host}`
        + (a.isFirst ? " full" : " diff"));

    // Kennzahlen in EINER Zeile. Reihenfolge, Kuerzel UND Format kommen aus
    // SHORT_KEYS — die Legende beschreibt damit garantiert dasselbe.
    const money = (x) => {
        if (!isFinite(x)) return v(x);
        const s2 = Math.abs(x); const sg = x < 0 ? "-" : "";
        if (s2 >= 1e12) return sg + "$" + (s2 / 1e12).toFixed(2) + "t";
        if (s2 >= 1e9)  return sg + "$" + (s2 / 1e9).toFixed(2) + "b";
        if (s2 >= 1e6)  return sg + "$" + (s2 / 1e6).toFixed(2) + "m";
        if (s2 >= 1e3)  return sg + "$" + (s2 / 1e3).toFixed(2) + "k";
        return sg + "$" + s2.toFixed(0);
    };
    const num = (x) => {
        if (!isFinite(x)) return v(x);
        const s2 = Math.abs(x);
        if (s2 >= 1e9) return (x / 1e9).toFixed(2) + "b";
        if (s2 >= 1e6) return (x / 1e6).toFixed(2) + "m";
        if (s2 >= 1e4) return (x / 1e3).toFixed(1) + "k";
        return String(x);
    };
    // v2.3: KZ nur im VOLLEN Zyklus. Im diff-Modus traegt CH die Absolutwerte als
    // "alt -> neu"; die komplette Kennzahlenliste zusaetzlich zu wiederholen war
    // reine Verdopplung (live rund die Haelfte des Kurzreports).
    if (a.isFirst) {
        const kz = [];
        for (const [ab, key, , typ] of SHORT_KEYS) {
            const val = a.metrics[key];
            if (isEmptyMetric(val)) continue;
            kz.push(ab + "=" + (typ === "money" ? money(val) : typ === "gb" ? gb(val)
                : typ === "n" ? num(val) : v(val)));
        }
        K.push("KZ " + kz.join(" "));
    }

    // Dispatcher-Klassen (nur belegte).
    if (a.disp && a.disp.used) {
        const u = a.disp.used;
        const parts = [];
        for (const k of DCLASSES) if ((u[k] || 0) > 0) parts.push(k + "=" + gb(u[k]));
        if (a.disp.busyGb !== undefined) {
            const cls = DCLASSES.reduce((n, k) => n + (u[k] || 0), 0);
            const ncl = Math.max(0, a.disp.busyGb - cls);
            if (ncl > 0) parts.push("ncl=" + gb(ncl));
        }
        // DK bleibt IMMER: die Klassenverteilung steckt NICHT in den Metriken und
        // erscheint daher in keiner CH-Zeile. Ohne sie verschwaende im diff-Modus
        // genau die Information, an der sich das XP-/Geld-Verhaeltnis verfolgen
        // laesst (live: 77,7 TB auf xp gegen 442 GB auf core_h).
        if (parts.length) K.push("DK " + parts.join(" "));
        // DL steht als `deckel` in den Metriken -> im diff als CH. DQ nicht.
        if (a.isFirst && Array.isArray(a.disp.limits) && a.disp.limits.length) {
            K.push("DL " + a.disp.limits.join("|"));
        }
        if (a.disp.resAgeMs !== undefined) K.push("DQ " + Math.round(a.disp.resAgeMs / 1000));
    }

    // XP-Rechenweg (v2.4). IMMER, auch im diff: die Zahlen stehen nicht in den
    // Metriken, erscheinen also in keiner CH-Zeile — und genau an ihnen laesst sich
    // ablesen, ob die XP-Stufe den Pool fuellt oder von einem Deckel gebremst wird.
    if (a.disp && a.disp.xpDiag) {
        const x = a.disp.xpDiag;
        K.push(`XP soll=${num(x.total)} ist=${num(x.held)} passt=${num(x.fits)}`
            + ` port=${num(x.portion)} wt=${x.weakenSec}s ft=${x.fillTicks} ex=${x.execs}`);
    }
    // Backdoor und INFIL: nur im VOLLEN Zyklus. Alle ihre Zahlen (bdOffen,
    // bdLaufend, bdGestartet, ifLog, ifOk, ifAbbruch) stehen in den Metriken und
    // erscheinen im diff-Modus als CH-Zeile, sobald sie sich bewegen.
    // Die ZIELLISTE der laufenden Backdoor-Worker steht nicht in den Metriken —
    // sie wird deshalb auch im diff mitgegeben, wenn welche laufen.
    if (a.isFirst && !isEmptyMetric(a.metrics.bdOffen)) {
        K.push(`BD r=${v(a.metrics.bdLaufend)}/${v(a.metrics.bdOffen)}`
            + ` st=${v(a.metrics.bdGestartet)}`
            + (a.bdTargets && a.bdTargets.length ? " [" + a.bdTargets.join(",") + "]" : ""));
    } else if (!a.isFirst && a.bdTargets && a.bdTargets.length) {
        K.push("BD [" + a.bdTargets.join(",") + "]");
    }
    if (a.isFirst && a.metrics.ifLog) {
        K.push(`IF n=${v(a.metrics.ifLog)} ok=${v(a.metrics.ifOk)} abr=${v(a.metrics.ifAbbruch)}`);
    }
    // Befunde.
    (a.findings || []).forEach((f, i) => K.push(`F${i + 1} ${String(f).replace(/\s+/g, " ")}`));
    // Aenderungen (nur ab Zyklus 2).
    for (const c of (a.changes || [])) K.push("CH " + c);
    // Logbuch gekuerzt.
    for (const b of (a.book || []).slice(0, 20)) K.push("LB " + String(b).replace(/\s+/g, " "));
    return K;
}

/**
 * LEGENDE — GENERIERT aus SHORT_KEYS und SHORT_LINES, also aus derselben Quelle,
 * aus der der Kurzreport geschrieben wird. Eine handgepflegte Legende waere eine
 * zweite Quelle fuer dieselbe Information und wuerde beim ersten geaenderten
 * Kuerzel still falsch — dasselbe Muster wie AUG_WEIGHTS gegen das TIER-Array in
 * AUGS. Die Datei wird bei jedem Lauf neu geschrieben.
 * @returns {string}
 */
function buildLegend() {
    const L = [];
    L.push(`SCHWARM-KURZREPORT — Legende, Format ${SHORT_FORMAT}`);
    L.push("GENERIERT von SCHWARM-DIAG. Nicht von Hand pflegen: die Quelle sind die");
    L.push("Tabellen SHORT_KEYS und SHORT_LINES im Skript.");
    L.push("");
    L.push("AUFBAU: Zyklus 1 ist vollstaendig, Zyklus 2+ enthaelt NUR Aenderungen");
    L.push("(CH), die Dispatcher-Klassen (DK) und den Queen-Heartbeat (DQ). Alle");
    L.push("uebrigen Kennzahlen stehen in den CH-Zeilen als 'alt -> neu'.");
    L.push("");
    L.push("ZEILENARTEN");
    for (const [pre, txt] of SHORT_LINES) L.push("  " + String(pre).padEnd(5) + txt);
    L.push("");
    L.push("KENNZAHLEN in der KZ-Zeile   (Format: money=$-Suffix, gb=G/T, n=Zahl, s=Text)");
    for (const [ab, key, txt, typ] of SHORT_KEYS) {
        L.push("  " + String(ab).padEnd(4) + String(typ || "s").padEnd(6)
            + String(key).padEnd(13) + txt);
    }
    L.push("");
    L.push("EINHEITEN");
    L.push("  G / T   Gigabyte / Terabyte RAM");
    L.push("  $-Werte mit k/m/b/t-Suffix");
    L.push("  Zeiten in Sekunden, wenn nicht anders vermerkt");
    L.push("  '-'     Wert nicht vorhanden oder nicht ermittelbar");
    L.push("");
    L.push("DISPATCHER-KLASSEN in der DK-Zeile");
    L.push("  core_w/core_g/core_h  weaken/grow/hack auf bewerteten Geld-Zielen");
    L.push("  prep                  weaken/grow auf noch nicht hackbaren Zielen");
    L.push("  xp                    XP-weaken (eigene Buchung ab Dispatcher v10.3)");
    L.push("  share                 share()-Worker fuer den Faktions-Rufbonus");
    L.push("  foreign               Daemons und Fremdskripte");
    L.push("  ncl                   nicht klassifiziert (Messdifferenz, sollte klein sein)");
    return L.join("\n");
}

/**
 * VERSIONSSTAND ALLER SCHWARM-SKRIPTE (v2.7).
 *
 * ANLASS. Der Nutzer spielt die Dateien von Hand ein und hat mehrfach nicht
 * gewusst, welcher Stand im Spiel liegt — einmal hielt er eine Datei sogar fuer
 * verloren, weil der Versionskopf nicht mitgezogen worden war. Ein Lagebild, das
 * ueber alles Auskunft gibt, sollte auch das sagen.
 *
 * WOHER DIE NUMMER KOMMT. Jede Datei traegt in den ersten Zeilen einen Kopf der
 * Form " * SCHWARM-QUEEN.js — v6.7". Gelesen wird nur der Anfang der Datei; ein
 * "v" mitten im Text kann also nicht mehr treffen. ns.read kostet 0 GB
 * (RamCostGenerator.ts:632), das ist im Takt also kostenlos.
 *
 * NUR HOME. Payload-Dateien auf anderen Hosts sind Kopien; ihr Stand ergibt sich
 * aus dem hier. Und Dateien, die keinen Kopf tragen (die generierten Payloads),
 * werden ausgelassen statt mit "?" aufgefuehrt — sonst waere die Zeile voll mit
 * Rauschen.
 *
 * @param {NS} ns
 * @returns {Array<{name:string, ver:string}>} nach Namen sortiert
 */
function skriptVersionen(ns) {
    const raus = [];
    let dateien = [];
    try { dateien = ns.ls("home") || []; } catch (e) { return raus; }
    for (const f of dateien) {
        const name = String(f);
        if (name.indexOf("/") >= 0) continue;              // Unterordner (Temp) ueberspringen
        if (!name.startsWith("SCHWARM-") || !name.endsWith(".js")) continue;
        let kopf = "";
        try { kopf = (ns.read(name) || "").slice(0, 400); } catch (e) { continue; }
        // " * SCHWARM-QUEEN.js — v6.7"  oder  "— v0.10 — Total-Reiniger"
        const m = kopf.match(/—\s*v([0-9]+(?:\.[0-9]+)*)/);
        if (!m) {
            // v3.4 — EIN UNLESBARER KOPF DARF NICHT STILL VERSCHWINDEN.
            //
            // Hier stand nur `continue`, mit der Begruendung "ohne Kopf:
            // generierter Payload". Das stimmte fuer die kleinwerdenden
            // Worker-Skripte — traf aber genauso zwei ECHTE Module, deren Kopf
            // bloss anders formatiert war:
            //     SCHWARM-DARKNET.js v4.8 — ...    (Strich NACH der Version)
            //     SCHWARM-INFIL.js  v2.2           (gar kein Strich)
            // Beide fehlten damit dauerhaft in der Versionszeile des Berichts —
            // ausgerechnet DARKNET, die meistgeaenderte Datei. Nach einem Push
            // war nicht nachpruefbar, welche Fassung laeuft.
            //
            // Die Koepfe sind angeglichen. Damit ein kuenftiger Ausreisser
            // nicht wieder unbemerkt bleibt, wird er jetzt GEMELDET statt
            // uebersprungen: fehlende Information ist selbst eine Information.
            // Die generierten Kleinskripte (schwarm-g.js usw.) beginnen mit
            // Kleinbuchstaben und kommen hier gar nicht erst an.
            raus.push({ name: name.replace(/^SCHWARM-/, "").replace(/\.js$/, ""), ver: "?" });
            continue;
        }
        raus.push({ name: name.replace(/^SCHWARM-/, "").replace(/\.js$/, ""), ver: m[1] });
    }
    raus.sort((a, b) => a.name.localeCompare(b.name));
    return raus;
}

export async function main(ns) {
    ns.disableLog("ALL");

    const DUR_MS = Math.max(5_000, (Number(ns.args[0]) || 0) * 1000 || DUR_DEF);
    const IV_MS  = Math.max(500, Number(ns.args[1]) || IV_DEF);
    const selfHost = ns.getHostname();

    // Doppelstart-Schutz: zwei parallele Diagnosen verfälschen sich gegenseitig.
    try {
        const self = ns.getScriptName();
        if (ns.ps(selfHost).filter(p => p.filename === self).length > 1) {
            ns.print("DIAG läuft bereits — beende.");
            return;
        }
    } catch (e) { /* weiter */ }

    // ================= ZYKLEN-STEUERUNG (v2.0) =================
    // Ein Lagebild = ein Messfenster + Auswertung. Im Dauerlauf wiederholt DIAG das
    // im Abstand von GAP_MIN Minuten. Der ERSTE Zyklus schreibt den vollen Report
    // (Modus "w"), jeder weitere haengt nur die VERAENDERUNGEN an (Modus "a").
    //
    // RESET-FESTIGKEIT: Ein Aug-Install beendet ALLE Skripte — DIAG stirbt also
    // mitten im Lauf. Verifiziert (ServerHelpers.ts:224 prestigeHomeComputer):
    // programs und messages werden geleert, `scripts` und `textFiles` NICHT. Skripte
    // und Textdateien ueberleben, .exe nicht. Und weil schwarm-queen-state.txt eine
    // Textdatei ist, bleibt der DIAG-Schalter an — die Queen startet DIAG von selbst
    // neu. DIAG legt seinen Fortschritt deshalb in STATE_FILE_DIAG ab und setzt den
    // Lauf nach dem Neustart fort, statt von vorn zu beginnen.
    // v2.2: Verlauf ist der STANDARD. Ein Standbild sagt nicht, ob ein Bestand nur
    // waechst (Bladeburner-Skillpunkte) oder eine Zahl einmal ausgerutscht ist (der
    // erste Dispatcher-Report entstand 16 s nach dem Start und zeigte deshalb 75 %
    // freien Pool). 4 Zyklen x 15 min = eine Stunde, dann Selbstabschaltung.
    // v3.5: WURDEN ZYKLEN UEBERHAUPT ANGEGEBEN? Das entscheidet weiter unten,
    // ob ein offener Auftrag fortgesetzt oder ueberschrieben wird — siehe dort.
    const CYCLES_ARG  = Number(ns.args[2]);
    const GAP_ARG     = Number(ns.args[3]);
    // v3.1 — DAUERLAUF. "run SCHWARM-DIAG.js 60 2000 0 10" heisst: endlos,
    // alle 10 Minuten ein Lagebild.
    //
    // Der Auftragsmodus (cycles > 0) bleibt unveraendert: N Zyklen, Zyklus 1
    // vollstaendig, die folgenden nur Aenderungen, alles in EINER Datei, danach
    // Selbstabschaltung. Das ist weiterhin das Richtige, wenn man gezielt eine
    // Stunde beobachten will.
    //
    // Im Dauerlauf ist das falsch herum: eine Datei, die endlos waechst, und
    // Delta-Eintraege, die ohne den Anfang nichts wert sind. Deshalb schreibt
    // jeder Zyklus dort ein EIGENES, VOLLSTAENDIGES Lagebild
    // (SCHWARM-REPORT-<lfd>.txt). Die Bruecke holt sie ab und loescht sie im
    // Spiel — so laeuft der Ordner nicht voll und jede Datei steht fuer sich.
    const DAUERLAUF   = isFinite(CYCLES_ARG) && CYCLES_ARG === 0;
    const HAT_ARGS    = isFinite(CYCLES_ARG) && CYCLES_ARG >= 0;
    const CYCLES  = DAUERLAUF ? Infinity : Math.max(1, Math.floor(CYCLES_ARG || 4));
    const GAP_MIN = Math.max(1, Math.floor(GAP_ARG || (DAUERLAUF ? 10 : 15)));
    const GAP_MS  = GAP_MIN * 60_000;

    /** Fortschritt lesen. null = kein laufender Auftrag. */
    const loadProgress = () => {
        try {
            const raw = ns.read(STATE_FILE_DIAG);
            if (!raw) return null;
            const o = JSON.parse(raw);
            return (o && typeof o.done === "number" && typeof o.cycles === "number") ? o : null;
        } catch (e) { return null; }
    };
    const saveProgress = (o) => { try { ns.write(STATE_FILE_DIAG, JSON.stringify(o), "w"); } catch (e) { /* egal */ } };

    // Fortsetzen oder neu beginnen? Nur fortsetzen, wenn die Parameter passen —
    // sonst haette ein neuer Auftrag mit anderen Werten einen alten weitergefuehrt.
    // =====================================================================
    // v3.5 — OHNE ARGUMENTE HEISST "MACH WEITER", NICHT "FANG NEU AN"
    // =====================================================================
    // Bis v3.4 verglich diese Stelle die gespeicherten Parameter IMMER gegen
    // die Argumente — und ohne Argumente standen dort die Vorgabewerte 4/15.
    // Ein Auftrag ueber 8 Zyklen waere nach einem argumentlosen Neustart also
    // stillschweigend durch einen frischen 4er-Auftrag ersetzt worden.
    //
    // Genau das braucht GENESIS aber: nach einem Aug-Reset soll DIAG als
    // ERSTES wieder laufen und den Anlauf mitschreiben — und GENESIS soll
    // dafuer NICHT wissen muessen, an welcher Argumentstelle die Zyklen
    // stehen. Es ruft "run SCHWARM-DIAG.js" ohne alles; welcher Auftrag
    // gemeint ist, weiss die Fortschrittsdatei am besten.
    //
    // Mit Argumenten gilt weiter die alte Regel: andere Werte = anderer
    // Auftrag, der alte wird verworfen. Sonst koennte man einen laufenden
    // Auftrag nie mehr ueberschreiben.
    let plan = loadProgress();
    // v3.1: Infinity ueberlebt JSON.stringify nicht (wird zu null). Im Plan
    // steht deshalb 0 fuer "endlos", und diese Helfer rechnen es zurueck.
    const grenze = (p) => (p && Number(p.cycles) === 0) ? Infinity : (p ? Number(p.cycles) : 0);
    const CYCLES_GESPEICHERT = DAUERLAUF ? 0 : CYCLES;

    const offen = plan && plan.done < grenze(plan);
    if (offen && !HAT_ARGS) {
        ns.print(`DIAG setzt Auftrag fort (ohne Argumente): Zyklus ${plan.done + 1} von `
            + `${grenze(plan) === Infinity ? "endlos" : plan.cycles}, Abstand ${plan.gapMin} min.`);
    } else if (!plan || plan.cycles !== CYCLES_GESPEICHERT || plan.gapMin !== GAP_MIN || plan.done >= grenze(plan)) {
        plan = { cycles: CYCLES_GESPEICHERT, gapMin: GAP_MIN, done: 0, startedAt: Date.now(),
                 resets: 0, lastAugReset: 0, prevMetrics: null, lfd: 0 };
    } else {
        ns.print(`DIAG setzt Auftrag fort: Zyklus ${plan.done + 1} von `
            + `${grenze(plan) === Infinity ? "endlos" : plan.cycles}.`);
    }
    if (typeof plan.lfd !== "number") plan.lfd = 0;
    const ENDLOS = grenze(plan) === Infinity;
    // Ab hier zaehlt, was IM PLAN steht — nicht, was in den Argumenten stand.
    const PLAN_GAP_MS = Math.max(1, Number(plan.gapMin) || GAP_MIN) * 60_000;
    while (plan.done < grenze(plan)) {
        const cycleNo = plan.done + 1;
        // Im Dauerlauf ist JEDER Zyklus "der erste": er schreibt ein
        // vollstaendiges Lagebild in eine eigene Datei. Delta-Eintraege waeren
        // dort wertlos, weil die Bruecke die Vorgaengerdatei schon abgeholt und
        // im Spiel geloescht hat.
        const isFirst = ENDLOS || (cycleNo === 1);
        // v2.3: Beginn DIESES Zyklus. Grundlage fuer den Start-zu-Start-Takt unten.
        const cycleStartedAt = Date.now();

        // Aug-Reset seit dem letzten Zyklus? Die Pruefung steht ABSICHTLICH hier und
        // nicht vor der Schleife: nach einem Neustart faengt sie den Reset zwar auch
        // vor dem ersten Zyklus, aber so wird jeder Reset erkannt — auch einer, der
        // DIAG (aus welchem Grund auch immer) ueberlebt hat. getResetInfo = 1 GB, flach.
        try {
            // =============================================================
            // v3.5 — AUG-RESET UND BITNODE-WECHSEL SIND NICHT DASSELBE
            // =============================================================
            // Bis v3.4 wurde nur lastAugReset beobachtet. Ein BitNode-Wechsel
            // faellt darunter, denn prestigeSourceFile ruft intern erst
            // prestigeAugmentation (PlayerObjectGeneralMethods.ts:126 setzt
            // lastAugReset, :173 danach lastNodeReset) — der Wechsel wurde
            // also erkannt, aber als gewoehnlicher Aug-Reset gemeldet.
            //
            // Damit ging die interessanteste Beobachtung verloren, die dieser
            // Bericht ueberhaupt machen kann: bei einem BitNode-Wechsel
            // aendern sich ALLE Multiplikatoren des Spiels auf einen Schlag
            // (initBitNodeMultipliers, Prestige.ts:204). Ein Zyklus davor und
            // einer danach zeigen an derselben Maschine, was die neue BitNode
            // aus ihr macht — und plan.prevMetrics traegt die Zahlen des
            // vorigen Zyklus ohnehin schon hinueber.
            //
            // Dass der Auftrag beides ueberlebt, ist kein Zufall: BEIDE Wege
            // laufen ueber prestigeHomeComputer (ServerHelpers.ts:224), und
            // das leert nur programs und messages. Skripte und Textdateien
            // — also auch die Fortschrittsdatei — bleiben liegen.
            const ri = ns.getResetInfo();
            const lar = ri.lastAugReset || 0;
            const lnr = ri.lastNodeReset || 0;
            const bnNow = Number(ri.currentNode) || 0;
            if (plan.lastNodeReset && lnr !== plan.lastNodeReset) {
                plan.resets++;
                plan.resetJustNow = lar;
                plan.nodeSwitch = { von: plan.bitNode || 0, nach: bnNow };
            } else if (plan.lastAugReset && lar !== plan.lastAugReset) {
                plan.resets++;
                plan.resetJustNow = lar;
            }
            plan.lastAugReset = lar;
            plan.lastNodeReset = lnr;
            plan.bitNode = bnNow;
        } catch (e) { /* ohne SF4 kein Reset-Nachweis */ }
        const t0 = Date.now();
        // EIGENE BFS statt scanNetwork: die Diagnose muss ALLES sehen, auch
        // hacknet-Server. scanNetwork filtert die bewusst heraus (sie sollen keine
        // Schwarm-Hosts sein) — für einen Ist-Abgleich mit der Dispatcher-Sicht
        // wäre dieser blinde Fleck aber genau der Fehler, den man sucht.
        const hosts = (() => {
            const seenH = new Set(["home"]), q = ["home"];
            try {
                while (q.length) for (const nx of ns.scan(q.shift())) if (!seenH.has(nx)) { seenH.add(nx); q.push(nx); }
            } catch (e) { /* Teilscan besser als Crash */ }
            return [...seenH];
        })();
        const file2key = {};
        for (const [k, d] of Object.entries(DAEMONS)) if (d && d.file) file2key[d.file] = k;

        const book = [];        // Logbuch-Zeilen (Teil A)
        const series = [];      // Kennzahlen je Sample (Teil B)
        const seen = {};        // Daemon-Key -> {n, hostSet, pidSet}
        const noteOnce = new Set();
        let prev = null;

        const rel = (t) => ((t - t0) / 1000).toFixed(1).padStart(5) + "s";
        // Drosselung: ein Tag darf das Logbuch nicht fluten (z. B. Spartopf, der
        // sich jeden BANK-Tick ändert). Nach LOG_CAP Zeilen kommt EINE Sammelnotiz.
        const LOG_CAP = 12;
        const tagCount = {};
        const note = (t, tag, msg) => {
            const c = (tagCount[tag] = (tagCount[tag] || 0) + 1);
            if (c <= LOG_CAP) book.push(`[${rel(t)} ${clock(t)}] ${padR(tag, 9)} ${msg}`);
            else if (c === LOG_CAP + 1) book.push(`[${rel(t)} ${clock(t)}] ${padR(tag, 9)} ... weitere Änderungen dieses Typs unterdrückt (Deckel ${LOG_CAP})`);
        };

        // ---------- Prozess-Aufnahme ----------
        const takeProcs = () => {
            const bdT = new Set();   // v2.2: Ziele laufender Backdoor-Worker
            const dae = {}, wrk = {}, wsum = {}, boot = {};
            // v3.12: ANZAHL DER SKRIPTINSTANZEN, nicht nur der Threads.
            // Bis hierher hat der Schwarm immer ueber Threads und RAM geredet.
            // Fuer die RECHENZEIT ist aber eine andere Groesse entscheidend: in
            // Bitburner ist ein Skript mit N Threads EIN WorkerScript — Threads
            // vervielfachen die Wirkung, nicht die Ausfuehrung. Teuer ist das
            // ANLEGEN und ABRAEUMEN. 500.000 Threads in wenigen grossen
            // Skripten kosten die Engine fast nichts, dieselben Threads in
            // Tausenden kleiner Skripte kosten viel.
            // wcount/wtotal ergibt die durchschnittliche Groesse eines Workers
            // und beantwortet damit die Frage "Dauerfeuer oder Batches?".
            let wtotal = 0, wcount = 0, queenUp = false, foreign = 0;
            for (const cls of WCLASSES) wsum[cls] = 0;
            for (const h of hosts) {
                let list;
                try { list = ns.ps(h) || []; } catch (e) { continue; }
                for (const p of list) {
                    const f = p.filename || "";
                    if (f === QUEEN_FILE) { queenUp = true; continue; }
                    const wc = WORKER_FILES[f];
                    if (wc) {
                        const per = wrk[h] || (wrk[h] = {});
                        per[wc] = (per[wc] || 0) + (p.threads || 1);
                        wsum[wc] += (p.threads || 1);
                        wtotal += (p.threads || 1);
                        wcount++;
                        continue;
                    }
                    // v2.2: Backdoor-Worker tragen ihr Ziel in args[0] (Dispatcher
                    // v10.4 startet einen Prozess je Ziel). Das ps() laeuft hier
                    // ohnehin -> die Ziele kosten nichts extra.
                    if (f === BACKDOOR_FILE) bdT.add(String((p.args && p.args[0]) || "*"));
                    const k = file2key[f];
                    if (k) {
                        (dae[k] || (dae[k] = [])).push({ h, pid: p.pid, thr: p.threads });
                    } else if (f === "SCHWARM-STANEK-LADER.js") {
                        // v3.0: kein Fremdling. Den schreibt und startet STANEK selbst;
                        // er steht bewusst nicht in der Registry, weil er kein Daemon ist,
                        // sondern ein reiner Ladeprozess mit 2.0 GB je Thread. Die Engine
                        // liest die Threadzahl GENAU DIESES Prozesses fuer die Ladungs-
                        // staerke — deshalb muss er ein eigener Prozess sein.
                    } else if (BOOT_FILES[f]) {
                        // v3.4: GENESIS und ARSENAL sind keine Registry-Daemons, sondern
                        // der Anlauf nach einem Aug-Reset. Bisher liefen sie unter
                        // "foreign" — also unter "Schwarm-Datei, die hier nichts zu
                        // suchen hat". Genau falsch: sie gehoeren zum Bild, und zwar
                        // in dem Moment, in dem der Schwarm am verletzlichsten ist.
                        boot[BOOT_FILES[f]] = { h, pid: p.pid };
                    } else if (f.startsWith("SCHWARM-") || f.startsWith("schwarm-")) {
                        foreign++;   // Schwarm-Datei ohne Registry-Eintrag (z. B. Prüfskripte)
                    }
                }
            }
            return { dae, wrk, wsum, wtotal, wcount, queenUp, foreign, boot, bdT: [...bdT] };
        };

        // ---------- echte RAM-Lage (nur in den beiden Vollscans) ----------
        // Trennt bewusst vier Töpfe: ALLE Hosts, nur GEROOTETE OHNE hacknet,
        // hacknet-Server (Sonderfall: erzeugen Hashes, Fremdbelegung senkt ihre
        // Rate) und — seit v3.7 — den POOL, also gerootet + hacknet.
        //
        // Bis v3.6 stand hier "nur GEROOTETE (nur die kann der Dispatcher
        // benutzen -> einzig faire Vergleichsbasis)". Dieser Satz war einmal
        // richtig und ist es seit DISPATCHER v11.x nicht mehr: dort ist
        // `rooted = [...all, ...hnHosts]`, die Hacknet-Server sind also im Pool.
        const takeRam = () => {
            let allT = 0, rootT = 0, rootU = 0, nRoot = 0, hnT = 0, hnU = 0, nHn = 0;
            for (const h of hosts) {
                let mx = 0;
                try { mx = ns.getServerMaxRam(h); } catch (e) { continue; }
                if (!(mx > 0)) continue;
                allT += mx;
                const isHn = h.startsWith("hacknet-");
                if (isHn) { nHn++; hnT += mx; try { hnU += ns.getServerUsedRam(h); } catch (e) { /* egal */ } }
                let rooted = false;
                try { rooted = ns.hasRootAccess(h); } catch (e) { /* egal */ }
                if (rooted && !isHn) {
                    nRoot++; rootT += mx;
                    try { rootU += ns.getServerUsedRam(h); } catch (e) { /* egal */ }
                }
            }
            // v3.7: der POOL — das, womit der Dispatcher tatsaechlich arbeitet.
            // Am Livebericht 602 nachgerechnet: rootT 101.9T + hacknet 96.0T
            // = 197.9T, und der Dispatcher meldete im selben Takt totalGb 197.9T.
            // Die Uebereinstimmung ist exakt, nicht ungefaehr — poolT ist also
            // die richtige Bezugsgroesse und keine Naeherung.
            const poolT = rootT + hnT, poolU = rootU + hnU;
            return { allT, rootT, rootU, rootFree: Math.max(0, rootT - rootU), nRoot, hnT, hnU, nHn,
                     poolT, poolU, poolFree: Math.max(0, poolT - poolU) };
        };

        // ---------- ein Sample ----------
        const takeSample = () => {
            const t = Date.now();
            // v3.24: Port 35 fasst 50 Zeilen; ohne CORP auf home wurde er nur
            // alle 10 min geleert, und bei Ueberlauf faellt die aelteste Zeile
            // lautlos weg. Kostet 0 GB (Port/read/write).
            try { chronikUmschichten(ns); } catch (e) { /* darf nie stoeren */ }
            const pr = takeProcs();
            const disp = jparse(ns.peek(SCHWARM_PORTS.DISP_OUT));
            const inf = readInfoSnapshot(ns);
            return {
                t, pr, disp, inf,
                bank: readBankInfo(ns) || {},
                corp: readCorpInfo(ns) || null,
                res: readReservations(ns) || {},
                caps: readCapabilities(ns) || {},
                treas: readTreasury(ns) || null,
                phase: getPhase(ns),
                repT: readRepTarget(ns),
                augBuy: readAugBuy(ns),
                pv: readPortfolioValue(ns),
                lq: readLiquidationRequest(ns),
                shrWanted: readShareWanted(ns),
                hashNeed: readHashCacheNeed(ns),
                spwn: String(ns.peek(SCHWARM_PORTS.QUEEN_IN) ?? ""),   // NICHT "spawn": ns.spawn kostet 2 GB (RAM-Falle)
            };
        };

        // ---------- Delta-Erkennung fürs Logbuch ----------
        const logDelta = (cur) => {
            const t = cur.t;
            const a = prev, b = cur;

            // Daemon-Prozesse: gekommen / gegangen / Neustart (neue PID)
            const keysNow = Object.keys(b.pr.dae), keysBefore = a ? Object.keys(a.pr.dae) : [];
            for (const k of keysNow) {
                const now = b.pr.dae[k], before = a ? (a.pr.dae[k] || []) : null;
                if (!a) continue;
                if (!before || before.length === 0) {
                    note(t, "PROZESS", `+ ${k} gestartet auf ${now.map(x => x.h).join(",")} (pid ${now.map(x => x.pid).join(",")})`);
                    continue;
                }
                const pidsNow = now.map(x => x.pid).sort().join(","), pidsBefore = before.map(x => x.pid).sort().join(",");
                if (pidsNow !== pidsBefore) note(t, "PROZESS", `~ ${k} PID-Wechsel ${pidsBefore} -> ${pidsNow} (Neustart)`);
            }
            for (const k of keysBefore) {
                if (!b.pr.dae[k] || b.pr.dae[k].length === 0) {
                    const d = DAEMONS[k] || {};
                    const kind = d.oneshotDaemon ? " (One-Shot, normal)" : "";
                    note(t, "PROZESS", `- ${k} beendet${kind}`);
                }
            }
            if (a && a.pr.queenUp !== b.pr.queenUp) note(t, "QUEEN", b.pr.queenUp ? "Queen läuft" : "Queen NICHT mehr gesehen");

            // Worker-Gesamtzahl (nur bei relevanter Änderung)
            if (a) {
                const d = b.pr.wtotal - a.pr.wtotal;
                if (Math.abs(d) >= Math.max(4, a.pr.wtotal * 0.1)) {
                    note(t, "WORKER", `Threads ${a.pr.wtotal} -> ${b.pr.wtotal} (${d > 0 ? "+" : ""}${d})`);
                }
            }

            // Dispatcher-Snapshot
            const dn = b.disp, db = a ? a.disp : null;
            if (dn && !db) note(t, "DISPATCH", `Snapshot da: Tick ${dn.tick}, Pool frei ${nGb(dn.poolLeftGb)}/${nGb(dn.totalGb)}`);
            if (dn && db) {
                if (dn.tick !== db.tick) {
                    const parts = [];
                    for (const c of DCLASSES) {
                        const vn = (dn.used || {})[c] || 0, vb = (db.used || {})[c] || 0;
                        if (Math.abs(vn - vb) >= 8) parts.push(`${c} ${nGb(vb)}->${nGb(vn)}`);
                    }
                    if (Math.abs((dn.poolLeftGb || 0) - (db.poolLeftGb || 0)) >= 8) parts.push(`frei ${nGb(db.poolLeftGb)}->${nGb(dn.poolLeftGb)}`);
                    if (parts.length) note(t, "DISPATCH", `Tick ${dn.tick}: ` + parts.join(" | "));
                }
                if ((dn.execFail || 0) > (db.execFail || 0)) note(t, "DISPATCH", `execFail +${(dn.execFail || 0) - (db.execFail || 0)} (gesamt ${dn.execFail}) — RAM-Enge oder Host voll`);
                if ((dn.killed || 0) > (db.killed || 0)) note(t, "DISPATCH", `Worker beendet +${(dn.killed || 0) - (db.killed || 0)} (gesamt ${dn.killed})`);
                if (dn.resNote !== db.resNote) note(t, "DISPATCH", `Reservierungs-Notiz: ${dn.resNote || "—"}`);
                if (!!dn.shareWanted !== !!db.shareWanted) note(t, "DISPATCH", `shareWanted -> ${dn.shareWanted}`);
                if (dn.xpTarget !== db.xpTarget) note(t, "DISPATCH", `XP-Ziel ${db.xpTarget || "—"} -> ${dn.xpTarget || "—"}`);
                if ((dn.targets || 0) !== (db.targets || 0) || (dn.prep || 0) !== (db.prep || 0)) {
                    note(t, "DISPATCH", `Ziele ${db.targets}->${dn.targets}, Prep ${db.prep}->${dn.prep}`);
                }
                if (!!dn.queenAlive !== !!db.queenAlive) note(t, "DISPATCH", `queenAlive -> ${dn.queenAlive}`);
            }

            // Reservierung (Port 6)
            const rs = (o) => Object.entries(o || {}).map(([h, g]) => `${h}:${Math.round(g)}`).sort().join("|") || "—";
            if (a && rs(a.res) !== rs(b.res)) note(t, "RESERV", `${rs(a.res)}  ->  ${rs(b.res)}`);

            // SPAWN-Port (flüchtig: nur was der peek gerade sieht)
            if (b.spwn && b.spwn !== "NULL PORT DATA" && (!a || a.spwn !== b.spwn)) note(t, "SPAWN", `Port 22 zeigt: ${b.spwn}`);

            // BANK
            const ba = a ? a.bank : null, bb = b.bank;
            if (bb && ba) {
                if (Math.abs((bb.savings || 0) - (ba.savings || 0)) > Math.max(1e6, (ba.savings || 0) * 0.02)) {
                    note(t, "BANK", `Spartopf ${nMoney(ba.savings)} -> ${nMoney(bb.savings)}`);
                }
                const gk = (x) => (x && x.goal) ? `${x.goal.key}/${x.goal.status || "—"}` : "—";
                if (gk(ba) !== gk(bb)) note(t, "BANK", `Sparziel ${gk(ba)} -> ${gk(bb)} (${bb.goal ? nMoney(bb.goal.cost) : "—"})`);
                if ((bb.openMoneyReqs || 0) !== (ba.openMoneyReqs || 0)) note(t, "BANK", `offene Geldanträge ${ba.openMoneyReqs || 0} -> ${bb.openMoneyReqs || 0}`);
                if (bb.topTarget !== ba.topTarget) note(t, "BANK", `Top-Antrag: ${bb.topTarget || "—"}`);
            } else if (bb && Object.keys(bb).length && !noteOnce.has("bank1")) {
                noteOnce.add("bank1");
                note(t, "BANK", `Info da: Spartopf ${nMoney(bb.savings)}, Rate ${nNum((bb.savingsRate || 0) * 100, 0)}%, Ziel ${bb.goal ? bb.goal.key : "—"}`);
            }

            // Phase / Capabilities
            if (a && a.phase !== b.phase) note(t, "PHASE", `${a.phase} -> ${b.phase}`);
            const cs = (o) => Object.entries(o || {}).filter(([, v]) => v).map(([k]) => k).sort().join(",") || "—";
            if (a && cs(a.caps) !== cs(b.caps)) note(t, "CAPS", `${cs(a.caps)}  ->  ${cs(b.caps)}`);

            // INFO-Snapshot: tickt er? welche Blöcke aktualisieren?
            if (b.inf) {
                if (!a || !a.inf) {
                    note(t, "INFO", `Snapshot da (${Object.keys(b.inf.blocks || {}).length} Blöcke)`);
                } else {
                    const changed = [];
                    for (const bn of Object.keys(b.inf.blocks || {})) {
                        const nb = b.inf.blocks[bn], ob = (a.inf.blocks || {})[bn];
                        if (nb && ob && (nb.ts || 0) !== (ob.ts || 0)) changed.push(bn);
                        if (nb && ob && nb.ok !== ob.ok) note(t, "INFO", `Block ${bn} ok:${ob.ok} -> ok:${nb.ok}${nb.err ? " (" + nb.err + ")" : ""}`);
                    }
                    if (changed.length) note(t, "INFO", `frisch: ${changed.join(",")}`);
                }
            } else if (!noteOnce.has("infoMiss")) {
                noteOnce.add("infoMiss");
                note(t, "INFO", `KEIN Snapshot auf Port ${SCHWARM_PORTS.INFO_OUT} — alle Konsumenten laufen auf Fallback`);
            }

            // Kleinkram-Ports
            const rt = (x) => x && x.fac ? `${x.fac}/${x.aug || "—"}` : "—";
            if (a && rt(a.repT) !== rt(b.repT)) note(t, "REP-ZIEL", `${rt(a.repT)} -> ${rt(b.repT)}`);
            const ab = (x) => x && x.aug ? `${x.aug}@${x.faction}` : "—";
            if (a && ab(a.augBuy) !== ab(b.augBuy)) note(t, "AUG-KAUF", `Port 18: ${ab(a.augBuy)} -> ${ab(b.augBuy)}`);
            if (a && Math.abs((b.pv || 0) - (a.pv || 0)) > Math.max(1e6, (a.pv || 0) * 0.05)) note(t, "PORTFOLIO", `${nMoney(a.pv)} -> ${nMoney(b.pv)}`);
            if (a && (a.lq || 0) !== (b.lq || 0)) note(t, "LIQUID", `Anforderung ${nMoney(a.lq)} -> ${nMoney(b.lq)}`);
            if (a && !!a.shrWanted !== !!b.shrWanted) note(t, "SHARE", `Grind-Flag -> ${b.shrWanted}`);
            if (a && (a.hashNeed || 0) !== (b.hashNeed || 0)) note(t, "HASH", `Cache-Bedarf ${nNum(a.hashNeed, 0)} -> ${nNum(b.hashNeed, 0)}`);
            const ci = (x) => x ? `${x.divisions || 0}div/${nMoney(x.funds || 0)}` : "—";
            if (a && ci(a.corp) !== ci(b.corp)) note(t, "CORP", `${ci(a.corp)} -> ${ci(b.corp)}`);
        };

        // ================= Messfenster =================
        const ramStart = takeRam();
        // =====================================================================
        // v2.7 — EINE EINZELMESSUNG REICHT NICHT MEHR
        // =====================================================================
        // takeRam() lief bisher genau zweimal: einmal am Anfang, einmal NACH der
        // Messschleife. Beide Dispatcher-Befunde haengen an der zweiten Messung.
        //
        // Der Wurmfortsatz daran: die XP-Flotte laeuft im PULK. Jeder pserv traegt
        // EINEN riesigen Worker (~18.700 Threads), alle wurden im selben Takt
        // gestartet, alle laufen 7,93 s, also sterben auch alle gleichzeitig. Im
        // Livelog steht das im Klartext:
        //     14:41:11  Threads 387892 -> 8635
        //     14:41:13  Threads 8635 -> 385339
        // und so weiter alle 8 bis 10 Sekunden. Zwischen Sterben und Neustart ist
        // die Maschine fuer ein bis zwei Sekunden fast leer.
        //
        // Faellt die EINE Endmessung in so eine Luecke, meldet DIAG Unsinn — und
        // zwar gleich doppelt. Genau das ist passiert: "Ende 709.3T / 685.0T frei"
        // im selben Sample, in dem ps 394.597 laufende Worker-Threads zaehlte. Die
        // beiden Zahlen widersprechen sich um den Faktor 30; sie koennen gar nicht
        // aus demselben Moment stammen. Daraus wurden zwei erfundene Befunde:
        // "Buchfuehrung liegt ueber der Realitaet" und "Dispatcher laesst Platz
        // liegen".
        //
        // Jetzt wird waehrend des Fensters mehrfach gemessen und fuer die Befunde
        // der Hoechststand der Belegung benutzt. Der Abstand ist bewusst 5 Samples
        // (10 s) und nicht 4: der Pulk hat rund 9 s Periode, ein 8-s-Raster wuerde
        // sich darauf einschwingen und immer wieder dieselbe Phase treffen.
        let ramPeak = ramStart;
        let ramScans = 1;
        const RAM_EVERY = 5;
        // v2.7 BEWEISSPUR. Im Livebericht widersprachen sich DREI Messgeraete, und
        // der Bericht enthielt nicht genug, um zu entscheiden, welches luegt:
        //   DIAG ps          387.892 -> 8.635 -> 385.339 Threads, alle 8-10 s
        //   DIAG RAM-Scan    685.0T von 709.3T frei  (also so gut wie leer)
        //   Dispatcher-Pool  in 30 Messungen NIE mehr als 29.6T von 709.3T frei
        // Die ersten beiden sagen "die Flotte stirbt im Pulk", der dritte sagt
        // "die Flotte steht". Der Dispatcher misst dasselbe alle 2 s und haette
        // einen Einbruch von 690 TB nicht 30-mal verpassen koennen.
        //
        // Statt zu raten wird jetzt bei JEDER RAM-Messung festgehalten, was die
        // anderen beiden im selben Moment sagen. Weichen sie voneinander ab, steht
        // es im Bericht — dann ist beim naechsten Lauf entschieden, welches Geraet
        // repariert gehoert, statt dass wieder ein Befund auf Verdacht entsteht.
        const ramSpur = [];
        // v3.0: Ruckel-Messung. Wie weit weicht ns.sleep(IV_MS) von IV_MS ab?
        let schlafMax = 0, schlafSumme = 0, schlafZahl = 0;
        // v2.8: Zahl der Messwidersprueche. Muss HIER stehen, weil der Befund erst
        // unten gemeldet werden kann (findings existiert dort noch nicht).
        let ramWiderspruch = 0;
        note(t0, "START", `Fenster ${Math.round(DUR_MS / 1000)}s, Intervall ${IV_MS}ms, Hosts ${hosts.length}, DIAG-Host ${selfHost}`);

        const MAX_SAMPLES = 600;   // Notbremse, falls sleep kürzer liefert als gedacht
        while (Date.now() - t0 < DUR_MS && series.length < MAX_SAMPLES) {
            const s = takeSample();
            // Daemon-Sichtbarkeit mitzählen
            for (const [k, arr] of Object.entries(s.pr.dae)) {
                const e = seen[k] || (seen[k] = { n: 0, hostSet: new Set(), pidSet: new Set(), first: -1, last: -1 });
                e.n++;
                // v3.0: WANN ein Daemon zu sehen war, nicht nur wie oft. Ohne das
                // konnte "erst ab Sample 8 da, dann durchgehend" nicht von
                // "flackert" unterschieden werden — nach jedem Aug-Reset meldete
                // der Bericht deshalb sieben Daemons als "instabil", obwohl sie
                // nur gerade erst gestartet worden waren.
                if (e.first < 0) e.first = series.length;
                e.last = series.length;
                for (const x of arr) { e.hostSet.add(x.h); e.pidSet.add(x.pid); }
            }
            logDelta(s);
            prev = s;
            series.push(s);
            if (series.length % RAM_EVERY === 0) {
                const r = takeRam();
                ramScans++;
                // v3.7: poolU statt rootU. Die Spur haelt neben dem RAM die
                // ps-Threadzahl fest (s.pr.wtotal), und die zaehlt ueber ALLE
                // Hosts inklusive der Hacknet-Server. Solange links rootU stand,
                // verglich die Widerspruchsprobe unten RAM ohne Hacknet gegen
                // Threads mit Hacknet — zwei verschiedene Mengen.
                ramSpur.push({ i: series.length, u: r.poolU, thr: s.pr.wtotal, disp: s.disp ? s.disp.poolLeftGb : null });
                if (r.poolU > ramPeak.poolU) ramPeak = r;
            }
            // v3.0 — RUCKEL-MESSUNG, KOSTENLOS.
            //
            // ns.sleep(2000) darf laenger dauern als 2000 ms: die Engine kann
            // den Aufruf erst zurueckgeben, wenn ihre Schleife wieder dran ist.
            // Die Differenz ist damit ein direktes Mass dafuer, wie schwer das
            // Spiel gerade traegt — ohne einen einzigen zusaetzlichen Aufruf.
            //
            // Gemessen wird NUR der Schlaf, nicht die Messarbeit davor. Sonst
            // wuerde DIAG die eigene Last als Spiel-Last ausgeben. Die
            // Kopfzeile ("61s, 27 Samples a 2000ms") legte genau diesen Fehler
            // nahe: 27 x 2000 = 54 s Soll gegen 61 s Ist - darin steckte aber
            // auch DIAGs eigene Arbeit.
            {
                const vorSchlaf = Date.now();
                await ns.sleep(IV_MS);
                const abweichung = Date.now() - vorSchlaf - IV_MS;
                if (abweichung > schlafMax) schlafMax = abweichung;
                schlafSumme += abweichung;
                schlafZahl++;
            }
        }
        const ramEnd = takeRam();
        ramScans++;
        const sLetzt = series[series.length - 1] || null;
        ramSpur.push({ i: series.length, u: ramEnd.poolU, thr: sLetzt ? sLetzt.pr.wtotal : null,
                       disp: sLetzt && sLetzt.disp ? sLetzt.disp.poolLeftGb : null });
        if (ramEnd.poolU > ramPeak.poolU) ramPeak = ramEnd;
        const last = series[series.length - 1] || takeSample();
        note(Date.now(), "ENDE", `${series.length} Samples aufgenommen`);

        // ================= Auswertung =================
        const L = [];
        const kasseBlock = [];   // Nachtrag: 4c auch fuer die Teilberichte (Auftragsmodus)
        const hr = (s) => L.push("", "=".repeat(78), s, "=".repeat(78));
        const agg = (pick) => {
            const v = series.map(pick).filter(x => isFinite(x));
            if (!v.length) return null;
            const sum = v.reduce((a, b) => a + b, 0);
            return { min: Math.min(...v), max: Math.max(...v), avg: sum / v.length, last: v[v.length - 1], n: v.length };
        };
        const aggStr = (a, f = nGb) => a ? `${f(a.min)} .. ${f(a.max)}  (Ø ${f(a.avg)}, zuletzt ${f(a.last)})` : "—";

        L.push("SCHWARM-DIAGNOSE  v" + DIAG_VERSION);
        L.push(`Erstellt: ${clock(t0)} — ${clock(Date.now())}   (${Math.round((Date.now() - t0) / 1000)}s, ${series.length} Samples à ${IV_MS}ms)`);
        L.push(`DIAG-Host: ${selfHost}   Hosts im Scan: ${hosts.length} (eigene BFS — hacknet-* eingeschlossen)`);
        // v3.0: Ruckel-Zeile. Grosse Abweichungen heissen, dass die Engine ihre
        // Schleife nicht mehr im Takt schafft — meist zu viele laufende
        // Prozesse. Die Schwellen sind bewusst grob: es geht um "faellt auf",
        // nicht um Millisekunden-Genauigkeit.
        if (schlafZahl > 0) {
            const schnitt = schlafSumme / schlafZahl;
            const anteil = (schnitt / IV_MS) * 100;
            const urteil = anteil < 5 ? "fluessig"
                         : anteil < 20 ? "leicht traege"
                         : anteil < 50 ? "traege" : "STARK verzoegert";
            L.push(`Taktgenauigkeit: ${urteil} — ns.sleep(${IV_MS}) dauerte im Schnitt `
                + `${Math.round(schnitt)}ms zu lang (+${anteil.toFixed(1)}%), `
                + `Spitze +${Math.round(schlafMax)}ms   [${schlafZahl} Messungen]`);
        }

        // ---------- 1 ÜBERBLICK ----------
        hr("1  ÜBERBLICK");
        const pl = (() => { try { return ns.getPlayer(); } catch (e) { return null; } })();
        const capList = Object.entries(last.caps || {}).filter(([, v]) => v).map(([k]) => k);
        L.push(`Phase:          ${last.phase ?? "—"}`);
        L.push(`Capabilities:   ${capList.length ? capList.join(", ") : "— (Port 4 leer)"}`);
        L.push(`Geld:           ${pl ? nMoney(pl.money) : "—"}`);
        // v3.17 — DATEI IST NICHT PROZESS.
        // Die Versionszeile darunter liest alle Nummern aus den DATEIEN. Ein
        // Daemon behaelt seinen Code aber, bis er neu startet — "liegt da" und
        // "laeuft" koennen weit auseinander sein. Am 19.09. stand ueberall
        // QUEEN 7.13, ein Pruefstand gegen Datei und Plan lieferte sauber
        // "flume", und PLAN_OUT meldete trotzdem weg:null: es lief noch die
        // alte QUEEN. Seit QUEEN v7.14 sagt sie es selbst auf QUEEN_OUT.
        const qLauf = (() => { try { return readOut(ns, SCHWARM_PORTS.QUEEN_OUT).ver || null; } catch (e) { return null; } })();
        const qDatei = (() => {
            try {
                const t = ns.read("SCHWARM-QUEEN.js") || "";
                const m = t.match(/const VERSION = "([0-9.]+)"/);
                return m ? m[1] : null;
            } catch (e) { return null; }
        })();
        L.push(`Queen:          ${last.pr.queenUp ? "läuft" : "NICHT gesehen"}`
            + (qLauf ? `   Prozess v${qLauf}` : "   Prozess v? (QUEEN < v7.14 meldet es nicht)")
            + (qDatei ? `   Datei v${qDatei}` : ""));
        if (qLauf && qDatei && qLauf !== qDatei) {
            findings.push(`QUEEN: Datei v${qDatei}, LAUFEND aber v${qLauf}. Eingespielter Code wirkt erst nach `
                + `einem Neustart der Queen — bis dahin verhaelt sich der Schwarm nach der alten Fassung, `
                + `waehrend jede Versionsanzeige die neue zeigt. Ein Aug-Reset raeumt das von selbst auf.`);
        }
        {
            // v2.7: Welcher Stand liegt tatsaechlich im Spiel? Zwei Zeilen,
            // damit nach einem Einspielen sofort sichtbar ist, was angekommen ist.
            const vs = skriptVersionen(ns);
            const txt = vs.map(v => `${v.name} ${v.ver}`).join("  ");
            L.push(`Versionen:      ${vs.length ? txt : "kein Versionskopf gefunden"}`);
        }
        L.push(`Treasury(P5):   ${last.treas ? JSON.stringify(last.treas).slice(0, 160) : "—"}`);
        // v3.7: POOL = gerootet + Hacknet-Server. Das ist die Menge, die der
        // Dispatcher belegt, und damit die einzige, gegen die sich Belegung und
        // freier Platz vergleichen lassen. Die hacknet-freie Sicht steht eine
        // Zeile darunter weiter drin — sie beantwortet eine andere, ebenfalls
        // sinnvolle Frage ("wie gross ist mein klassisches Netz").
        L.push(`RAM real (POOL = gerootet + Hacknet-Server — genau das nutzt der Dispatcher):`);
        L.push(`                Start ${nGb(ramStart.poolT)} total / ${nGb(ramStart.poolFree)} frei   ->   Ende ${nGb(ramEnd.poolT)} / ${nGb(ramEnd.poolFree)} frei   (${ramEnd.nRoot} gerootet + ${ramEnd.nHn} hacknet)`);
        L.push(`                davon ohne Hacknet: ${nGb(ramEnd.rootT)} total / ${nGb(ramEnd.rootFree)} frei`
            + `   |   Hacknet-Server: ${nGb(ramEnd.hnT)} total / ${nGb(Math.max(0, ramEnd.hnT - ramEnd.hnU))} frei`);
        // v2.7: Einzelmessungen waren unbrauchbar, solange die XP-Flotte im Pulk
        // starb und neu startete. Seit v3.0 (Dauerlaeufer) gibt es diesen Pulk-Tod
        // nicht mehr; der Hoechststand bleibt trotzdem die Bezugszahl, weil CORE
        // zwischen den Takten weiter schwankt (gemessen core_g 1,5 T .. 11,3 T).
        L.push(`                Belegt-Hoechststand im Fenster: ${nGb(ramPeak.poolU)} von ${nGb(ramPeak.poolT)}`
            + `  (${ramScans} Messungen; Hoechststand, weil CORE zwischen den Takten schwankt)`);
        if (ramEnd.poolU < ramPeak.poolU * 0.5) {
            L.push(`                ! Die Endmessung traf eine solche Luecke (${nGb(ramEnd.poolU)} statt ${nGb(ramPeak.poolU)}).`
                + ` Fuer die Bewertung wird der Hoechststand benutzt.`);
        }
        // =====================================================================
        // v2.8 — home: KERNE UND ANTEIL AM POOL
        // =====================================================================
        // Der coreBonus (ServerHelpers.ts:288) ist 1 + (cores-1)/16 und wirkt auf
        // weaken und grow — nicht auf hack (calculatePercentMoneyHacked kennt
        // keinen cores-Parameter). home ist der EINZIGE eigene Server, der mehr
        // als einen Kern haben kann: pserv und hacknet stehen laut
        // BaseServer.ts:50 fest auf 1, und Fremdserver mit vielen Kernen
        // (randInt(ceil(layer/2), layer), bis 15) haben ueberwiegend 0 GB RAM,
        // weil ihnen in servers.ts der maxRamExponent fehlt.
        //
        // Ob sich ein Kern-Ausbau lohnt, haengt damit an genau einer Zahl: wieviel
        // vom Pool laeuft auf home. Die stand bisher in keinem Bericht.
        //
        // Die Werte kommen aus dem Dispatcher-Snapshot, nicht aus einer eigenen
        // Messung — ns.getServer waere hier 2 GB statische Kosten bei 6 GB minRam.
        if (last.disp && Number.isFinite(Number(last.disp.homeGb)) && Number(last.disp.homeGb) > 0) {
            const hGb = Number(last.disp.homeGb);
            const hCores = Math.max(1, Number(last.disp.homeCores) || 1);
            // v3.7: Nenner ist der POOL, nicht rootT. Vorher wurde durch eine zu
            // kleine Zahl geteilt, und zwar genau um die Hacknet-Server zu klein:
            // am Bericht 602 war home 2.0T von 101.9T = 2.0 %, richtig sind
            // 2.0T von 197.9T = 1.0 %. Der ausgewiesene Gesamtnutzen eines
            // weiteren Kerns war damit DOPPELT so hoch wie der echte — bei
            // Kernpreisen ab $7.5b ist das eine Kaufentscheidung auf falscher
            // Grundlage, auch wenn die Empfehlung hier zufaellig gleich bleibt.
            const anteil = ramPeak.poolT > 0 ? (hGb / ramPeak.poolT) : 0;
            const bonus = (c) => 1 + (c - 1) / 16;
            const jetzt = bonus(hCores), naechst = bonus(hCores + 1);
            // PlayerObjectServerMethods.ts:43 -> 1e9 * 7,5^cores
            const kosten = 1e9 * Math.pow(7.5, hCores);
            L.push(`home:           ${nGb(hGb)} von ${nGb(ramPeak.poolT)} Pool (${(anteil * 100).toFixed(1)} %)`
                + `   frei ${nGb(Number(last.disp.homeFreeGb) || 0)}   ${hCores} Kern${hCores === 1 ? "" : "e"}`
                + `  ->  weaken/grow x${jetzt.toFixed(4)}`);
            if (hCores >= 8) {
                L.push(`                Kerne am Maximum (8) — mehr laesst die Engine nicht zu.`);
            } else {
                // Der Zugewinn wirkt NUR auf den home-Anteil. Ehrlich ausgewiesen:
                // erst der Effekt auf home, dann der auf die Gesamtwirkung.
                const aufHome = (naechst / jetzt - 1) * 100;
                const gesamt = aufHome * anteil;
                L.push(`                Naechster Kern: ${nMoney(kosten)} -> x${naechst.toFixed(4)}`
                    + `  (+${aufHome.toFixed(1)} % auf w/g AUF home, das sind +${gesamt.toFixed(2)} % auf die Gesamtwirkung)`);
                if (gesamt < 0.5) {
                    L.push(`                Lohnt sich derzeit kaum — home ist zu klein. Erst home-RAM ausbauen,`);
                    L.push(`                dann Kerne: der Bonus skaliert mit dem Anteil, nicht mit der Kernzahl allein.`);
                }
            }
        }
        // v2.7: die Beweisspur ausgeben und die drei Messgeraete gegeneinander halten.
        if (ramSpur.length > 1 && ramPeak.poolT > 0) {
            const thrMax = Math.max(1, ...ramSpur.map(x => Number(x.thr) || 0));
            // v3.12: Instanzen und Durchschnittsgroesse. EINE Zeile, aber sie
            // beantwortet die Frage, ob ein Umbau auf Batches ueberhaupt lohnt.
            const letzteP = series.length ? series[series.length - 1].pr : null;
            if (letzteP && letzteP.wcount > 0) {
                const schnitt = letzteP.wtotal / letzteP.wcount;
                L.push(`                Worker: ${nNum(letzteP.wcount, 0)} Skripte fuer `
                    + `${nNum(letzteP.wtotal, 0)} Threads  (im Schnitt ${schnitt.toFixed(0)} Threads je Skript)`);
            }
            L.push(`                Spur (Sample | RAM belegt | ps-Threads | Dispatcher frei):`);
            let widerspruch = 0;
            for (const x of ramSpur) {
                // v3.7: poolT als Nenner, passend zu x.u = poolU. Vorher stand
                // hier RAM OHNE Hacknet ueber einer Threadzahl MIT Hacknet — die
                // Probe verglich zwei Mengen. Sie schlug bisher nur deshalb nicht
                // an, weil beide Seiten zufaellig nahe der Saettigung lagen; das
                // ist Glueck, keine Richtigkeit.
                const uA = x.u / ramPeak.poolT;                    // Anteil belegt laut RAM-Scan
                const tA = (Number(x.thr) || 0) / thrMax;          // Anteil Flotte laut ps
                const kaputt = Math.abs(uA - tA) > 0.4;
                if (kaputt) widerspruch++;
                L.push(`                  ${String(x.i).padStart(3)} | ${nGb(x.u).padStart(9)} `
                    + `(${(100 * uA).toFixed(0).padStart(3)} %) | ${nNum(x.thr, 0).padStart(9)} `
                    + `(${(100 * tA).toFixed(0).padStart(3)} %) | ${x.disp === null ? "—" : nGb(x.disp)}`
                    + (kaputt ? "   <-- passt nicht zusammen" : ""));
            }
            // v2.8 ABSTURZ BEHOBEN. Hier stand ein findings.push(). `findings` wird
            // aber erst rund 20 Zeilen SPAETER deklariert (Abschnitt 2, SOLL/IST) —
            // der Zugriff lag also in der temporalen Todeszone der const-Bindung und
            // warf bei JEDEM Lauf, sobald zwei Widersprueche zusammenkamen:
            //     ReferenceError: Cannot access 'findings' before initialization
            // Der Syntax-Pruefstand konnte das nicht sehen: new Function() prueft
            // Syntax, nicht Laufzeit-Bindungen. Gezaehlt wird jetzt hier, gemeldet
            // wird unten, wo findings existiert.
            ramWiderspruch = widerspruch;
        }
        L.push(`RAM gesamt:     ${nGb(ramEnd.allT)} über alle Hosts   davon hacknet-* ${nGb(ramEnd.hnT)} (belegt ${nGb(ramEnd.hnU)})`);
        if (last.disp) {
            L.push(`RAM Dispatcher: total ${nGb(last.disp.totalGb)} / frei ${nGb(last.disp.poolLeftGb)} / reserviert ${nGb(last.disp.reservedGb)}   [Tick ${last.disp.tick}, formulas=${last.disp.formulas}]`);
            // v3.7: verglichen wird gegen poolT statt rootT. Vorher meldete diese
            // Zeile in JEDEM Lauf eine "Pool-Abweichung" in exakter Hoehe der
            // Hacknet-Server (Bericht 602: 96.0T Abweichung, 96.0T hacknet) —
            // ein Dauer-Hinweis auf einen Unterschied, den DIAG selbst erzeugt
            // hatte. Was jetzt noch uebrig bleibt, ist echt: STANEKs Ladehost
            // (der gehoert ihm allein), ein abgeschaltetes home, oder Hosts, die
            // erst zwischen den beiden Messungen gerootet wurden.
            const drift = Math.abs((last.disp.totalGb || 0) - ramEnd.poolT);
            if (drift > Math.max(64, ramEnd.poolT * 0.25)) {
                L.push(`  ! Pool-Abweichung ${nGb(drift)}: Dispatcher ${nGb(last.disp.totalGb)} vs. Pool real ${nGb(ramEnd.poolT)}`
                    + `  (gerootet ${nGb(ramEnd.rootT)} + hacknet ${nGb(ramEnd.hnT)}).`);
                L.push(`    Mögliche Gründe: STANEKs Ladehost (gehoert ihm allein), home abgeschaltet, oder Hosts erst neu gerootet.`);
            }
        } else {
            L.push("RAM Dispatcher: KEIN Snapshot auf Port 25");
        }

        // ---------- BITNODE-STECKBRIEF (v3.3) ----------
        // Nach einem BitNode-Wechsel verhalten sich halbe Daemons anders, und
        // zwar aus GENAU einem Grund: die BitNode-Multiplikatoren. Ohne sie im
        // Bericht muesste man beim Nachsehen jedes Mal raten oder die
        // Engine-Quelle aufschlagen. Sie stehen laengst im INFO-Block "bn"
        // (collectBn ruft getBitNodeMultipliers live, sofern SF5 da ist) — sie
        // wurden nur nirgends gezeigt.
        //
        // Gezeigt werden ausschliesslich die Multiplikatoren, die von 1
        // ABWEICHEN. Alles andere ist Normalzustand und wuerde die Seite
        // fuellen, ohne etwas zu sagen. Bei einem Wechsel stehen ausserdem der
        // vorige und der neue Knoten nebeneinander.
        try {
            const bnB = last.inf && last.inf.blocks ? last.inf.blocks["bn"] : null;
            const bnD = (bnB && bnB.ok !== false && bnB.data) ? bnB.data : null;
            if (bnD) {
                const sfTxt = (() => {
                    const sf = bnD.sf || {};
                    const k = Object.keys(sf).map(Number).filter(n => n > 0).sort((a, b) => a - b);
                    return k.length ? k.map(n => `SF${n}.${sf[n] ?? sf[String(n)]}`).join(" ") : "keine";
                })();
                L.push("");
                L.push(`BitNode:        BN${bnD.bitNode}   Source-Files: ${sfTxt}`);
                const f = bnD.features || {};
                const an = Object.keys(f).filter(k => f[k] === true);
                const aus = Object.keys(f).filter(k => f[k] !== true);
                L.push(`  verfuegbar:   ${an.length ? an.join(", ") : "—"}`);
                L.push(`  gesperrt:     ${aus.length ? aus.join(", ") : "—"}`);

                if (bnD.mults && typeof bnD.mults === "object") {
                    const ab = Object.keys(bnD.mults)
                        .filter(k => typeof bnD.mults[k] === "number" && bnD.mults[k] !== 1)
                        .sort((a, b) => bnD.mults[a] - bnD.mults[b]);
                    if (ab.length) {
                        L.push(`  Multiplikatoren != 1 (${bnD.multsSource}), ${ab.length} Stueck — aufsteigend:`);
                        // Vier je Zeile, damit der Block kurz bleibt.
                        for (let i = 0; i < ab.length; i += 4) {
                            L.push("    " + ab.slice(i, i + 4)
                                .map(k => `${k}=${Number(bnD.mults[k]).toFixed(2)}`.padEnd(30)).join("").trimEnd());
                        }
                        const nullen = ab.filter(k => bnD.mults[k] === 0);
                        if (nullen.length) {
                            // Bewusst neutral formuliert: eine Null kann "diese
                            // Einnahmequelle bringt hier nichts" heissen (z. B.
                            // ScriptHackMoney) ODER "diese Mechanik ist
                            // abgeschaltet" (z. B. GangSoftcap). Beides heisst
                            // fuer den Schwarm dasselbe: dort ist nichts zu holen,
                            // und wer den Fehler bei sich sucht, sucht falsch.
                            L.push(`  ! AUF NULL — hier ist nichts zu holen, das ist die BitNode und kein Defekt:`);
                            L.push(`    ${nullen.join(", ")}`);
                        }
                    } else {
                        L.push("  Multiplikatoren: alle auf 1 (unveraenderte BitNode).");
                    }
                } else {
                    L.push(`  Multiplikatoren: nicht lesbar (${bnD.multsSource || "kein SF5"}) —`
                        + " ohne Source-File 5 wirft getBitNodeMultipliers.");
                }
                if (plan.nodeSwitch) {
                    L.push(`  ! BITNODE-WECHSEL in diesem Dauerauftrag: BN${plan.nodeSwitch.von} -> BN${plan.nodeSwitch.nach}.`);
                    L.push("    Der Bericht davor zeigt denselben Rechner unter den alten Regeln.");
                }
            }
        } catch (e) { /* Steckbrief darf den Bericht nie stoppen */ }

        // ---------- 2 SOLL/IST DAEMONS ----------
        hr("2  SOLL / IST  — DAEMONS");
        const state = readManagedState(ns);
        L.push(padR("KEY", 12) + padR("SOLL", 16) + padR("CAP", 13) + padR("IST", 22) + "BEFUND");
        L.push("-".repeat(78));
        const findings = [];
        // v2.8: der Messwiderspruch aus Abschnitt 1 — dort gezaehlt, hier gemeldet.
        if (ramWiderspruch >= 2) {
            findings.push(`DIAG misst sich selbst widerspruechlich: in ${ramWiderspruch} von ${ramSpur.length} `
                + `Messungen sagen RAM-Scan und ps-Zaehlung Verschiedenes ueber denselben Moment `
                + `(siehe Spur in Abschnitt 1). Solange das so ist, sind die Dispatcher-Befunde nicht `
                + `belastbar — erst das Messgeraet reparieren, dann den Betrieb bewerten.`);
        }
        const missingDaemons = [];   // Daemons, die laufen sollen und im Fenster nie auftauchten
        // v3.0 KALTSTART. Der Dispatcher-Tick zaehlt, wie lange der Schwarm schon
        // steht (ein Tick alle 2 s, Neustart setzt ihn auf 0). Liegt er unter 60,
        // laeuft der Schwarm keine zwei Minuten — dann sind fehlende und
        // lueckenhaft gesehene Daemons der NORMALFALL, nicht ein Befund. Im
        // Bericht direkt nach einem Aug-Reset (Tick 23) standen deshalb sieben
        // Fehlalarme, darunter "BLADEBURNER FEHLT — nie gesehen" fuer einen
        // Daemon, der zwei Minuten spaeter sauber lief.
        const dispTick = Number(last.disp && last.disp.tick);
        const kaltstart = Number.isFinite(dispTick) && dispTick < 60;
        if (kaltstart) {
            L.push(`  (KALTSTART: Dispatcher erst bei Tick ${dispTick} — der Schwarm faehrt gerade hoch.`);
            L.push(`   Fehlende oder lueckenhaft gesehene Daemons sind hier normal und werden nicht gemeldet.)`);
        }
        for (const key of Object.keys(DAEMONS)) {
            const d = DAEMONS[key] || {};
            // v2.3: Daemons mit owner "HACKING" fuehrt der DISPATCHER selbst, nicht die
            // Queen. Ihr Soll ergibt sich NICHT aus isDaemonEnabled: BACKDOOR traegt
            // `triggered: true`, und die Funktion liefert dafuer ohne State-Eintrag
            // false — der Dispatcher startet ihn seit v10.4 aber, solange der Schalter
            // nicht ausdruecklich auf 0 steht. Ergebnis war der Fehlbefund "Schalter
            // aus, Prozess laeuft trotzdem" (live gemeldet, obwohl alles korrekt war).
            const selfDriven = (DAEMONS[key] && DAEMONS[key].owner === "HACKING");
            const wanted = selfDriven
                ? (state[key] !== 0)                       // nur eine ausdrueckliche 0 stoppt
                : (() => { try { return isDaemonEnabled(ns, key, state); } catch (e) { return false; } })();
            const capNeed = d.cap || null;
            const capOk = !capNeed || (last.caps || {})[capNeed] === true;
            const e = seen[key] || { n: 0, hostSet: new Set(), pidSet: new Set(), first: -1, last: -1 };
            const nS = series.length || 1;
            // v3.0: Ist der Daemen erst WAEHREND des Fensters angelaufen und seither
            // lueckenlos da? Dann ist er nicht instabil, sondern frisch gestartet.
            // Kennzeichen: eine einzige PID, letzte Sichtung am Fensterende, und die
            // Zahl der Sichtungen deckt genau die Spanne seit der ersten Sichtung.
            const frischGestartet = e.n > 0 && e.pidSet.size <= 1
                && e.last >= nS - 2 && e.n >= (e.last - e.first + 1) - 1 && e.first > 0;

            const sollTxt = d.virtual ? "virtuell"
                : selfDriven ? (wanted ? "auto (Dispatcher)" : "aus (Schalter)")
                : d.triggered ? (wanted ? "an (getriggert)" : "aus")
                : d.oneshotDaemon ? (wanted ? "an (One-Shot)" : "aus")
                : (wanted ? "an" : "aus");
            const istTxt = e.n === 0 ? "—"
                : `${e.n}/${nS} @${[...e.hostSet].join(",")}` + (e.pidSet.size > 1 ? ` (${e.pidSet.size} PIDs)` : "");

            let verdict;
            if (d.virtual) verdict = "kein Prozess (Teil von " + (d.owner || "?") + ")";
            // v3.0: One-Shots mit Selbst-Aus. SCAN und STANEK setzen als ERSTE
            // Anweisung setDaemonEnabled(...,0) und arbeiten danach weiter — sonst
            // startet die Queen sie im 12-Sekunden-Takt endlos neu (owner "QUEEN"
            // liefert in shouldRun einen unbedingten Treffer). "Schalter aus und
            // laeuft trotzdem" ist bei ihnen also der SOLLZUSTAND, kein Fehler.
            else if (!wanted && d.oneshotDaemon) verdict = e.n > 0 ? "One-Shot lief (Selbst-Aus)" : "aus (gewollt)";
            // v3.26: nur ein Befund, wenn der Prozess am FENSTERENDE noch lief. Wird
            // der Schalter mittendrin umgelegt, beendet die Queen den Daemon ein
            // paar Sekunden spaeter - das ist aufgeraeumt, nicht vergessen.
            else if (!wanted) verdict = e.n === 0 ? "aus (gewollt)"
                : (e.last < nS - 1 ? `aus (im Fenster beendet, zuletzt Probe ${e.last + 1})`
                                   : "!! AUS, läuft aber");
            else if (!capOk) verdict = `wartet: ${capNeed} fehlt`;
            else if (d.oneshotDaemon) verdict = e.n > 0 ? "One-Shot lief" : "One-Shot nicht im Fenster";
            else if (selfDriven) verdict = e.n > 0 ? "laeuft (Dispatcher-gefuehrt)" : "ruht — nichts offen";
            else if (d.triggered) verdict = e.n > 0 ? "getriggert aktiv" : "ruht (normal)";
            // v3.13 — BITNODE OHNE FREIGABE IST KEIN MANGEL.
            // Der Daemon hat seit QUEEN v7.9 einen AUSLOESER: der Schalter ist
            // die ABSICHT des Spielers (und ueberlebt BitNode-Wechsel), gestartet
            // wird er aber nur, wenn eine FRISCHE Freigabe auf PLAN_OUT liegt.
            // Ohne sie belegte er sonst stundenlang RAM fuer eine Schleife, die
            // nur schlaeft. "Schalter an, kein Prozess" ist damit der SOLLZUSTAND.
            //
            // DRITTER FEHLALARM DIESER ART (nach Daedalus in v3.8 und Grafting in
            // v3.10): DIAG kennt eine absichtliche Mechanik nicht und meldet sie
            // als Defekt. Merksatz steht am Kopf von v3.10 — bei einem Befund
            // dieser Form zuerst fragen, ob ein Daemon das mit Absicht tut.
            else if (key === "BITNODE" && e.n === 0 && !planFreigabe(ns)) {
                verdict = "wartet auf Freigabe (schwarm-plan.txt)";
            }
            // v3.26 — CORP OHNE CORP (QUEEN v7.17): der Schalter ist die Absicht,
            // gestartet wird erst, wenn eine Corp besteht. Sollzustand, kein Mangel.
            else if (key === "CORP" && e.n === 0 && corpBesteht(ns) !== true) {
                verdict = "wartet auf eine Corp (BANK gruendet)";
            }
            else if (e.n === 0) verdict = "!! FEHLT — nie gesehen";
            else if (frischGestartet) verdict = `frisch gestartet (ab Sample ${e.first + 1})`;
            else if (e.n < nS * 0.9) verdict = `!! instabil (${e.n}/${nS})`;
            else if (e.pidSet.size > 2) verdict = `!! Neustart-Schleife (${e.pidSet.size} PIDs)`;
            else verdict = "ok";

            L.push(padR(key, 12) + padR(sollTxt, 16) + padR(capNeed ? (capOk ? capNeed + " ok" : capNeed + " FEHLT") : "—", 13) + padR(istTxt, 22) + verdict);

            if (verdict.startsWith("!!") && !kaltstart) {
                if (e.n === 0) {
                    const why = [];
                    // v2.1: Owner-getriebene Daemons brauchen ein WANT ihres Besitzers.
                    // Fehlt das, ist RAM-Enge die FALSCHE Erklärung — im Nachtlauf stand
                    // 16 Zyklen lang "Belege: reserviert 96G" bei BLADEBURNER, obwohl der
                    // wahre Grund war, dass WORK kein WANT sendet (Division nicht betreten).
                    const ownedBy = (d.owner && d.owner !== "QUEEN") ? d.owner : null;
                    const wantSeen = series.some(x => String(x.spwn || "").includes("WANT:" + key));
                    const noWant = !!(ownedBy && !wantSeen);
                    if (noWant) why.push(`kein WANT von ${ownedBy} im Fenster (Port 22) — der Owner fordert ihn nicht an`);
                    if (last.disp && !noWant) {
                        if ((last.disp.poolLeftGb || 0) < (d.minRam || 0) + (d.burst || 0)) why.push(`Pool frei ${nGb(last.disp.poolLeftGb)} < Bedarf ${nGb((d.minRam || 0) + (d.burst || 0))}`);
                        if ((last.disp.execFail || 0) > 0) why.push(`execFail ${last.disp.execFail}`);
                        if ((last.disp.reservedGb || 0) > 0) why.push(`reserviert ${nGb(last.disp.reservedGb)} (${last.disp.resNote || "—"})`);
                    }
                    if (d.pinHost) why.push(`pinHost ${d.pinHost}`);
                    missingDaemons.push(key);
                    findings.push(`${key}: soll laufen, Capability ok, aber im ganzen Fenster kein Prozess. ` + (why.length ? "Belege: " + why.join("; ") : "Ursache im Logbuch/Queen-Log prüfen."));
                } else if (verdict.includes("instabil") || verdict.includes("Neustart")) {
                    findings.push(`${key}: ${verdict.replace("!! ", "")} — Absturz oder Verdrängung. Logbuch nach "PID-Wechsel"/"beendet" durchsehen.`);
                } else if (verdict.includes("AUS, läuft aber") && key !== SELF_KEY) {
                    // v2.1: DIAG selbst ausgenommen — es schaltet sich planmäßig nach jedem
                    // Auftrag ab und wird danach per Terminal gestartet. Der Befund wäre in
                    // jedem Bericht nur Rauschen über den Berichterstatter.
                    findings.push(`${key}: Schalter aus, Prozess läuft trotzdem (manuell gestartet oder Queen hat nicht aufgeräumt).`);
                }
            }
            if (wanted && capNeed && !capOk) findings.push(`${key}: wartet auf ${capNeed}. Das ist korrektes Verhalten, kein Fehler.`);
            if (d.dependsOn) {
                const depOn = (() => { try { return isDaemonEnabled(ns, d.dependsOn, state); } catch (e2) { return false; } })();
                if (wanted && !depOn) findings.push(`${key}: braucht ${d.dependsOn}, der ist aber aus.`);
            }
        }

        // =====================================================================
        // v3.4 — BOOTSTRAP: GENESIS UND ARSENAL SICHTBAR MACHEN
        // =====================================================================
        // Beide standen nie in dieser Tabelle, weil sie keine Daemons der
        // Registry sind, sondern der Anlauf: nach einem Aug-Reset toetet die
        // Engine ALLES und startet allein GENESIS, das seinerseits ARSENAL und
        // die Queen hochzieht. Genau in diesem Fenster ist der Schwarm am
        // verletzlichsten — und genau dort war der Bericht blind.
        //
        // Der Dauerauftrag selbst ueberlebt den Reset (STATE_FILE_DIAG, eine
        // Textdatei; ServerHelpers.ts:224 leert nur programs und messages). Der
        // DIAG-PROZESS ueberlebt ihn nicht — das kann er auch nicht, die Engine
        // beendet jedes Skript. Die Zyklen laufen also weiter, nur das Fenster,
        // in dem der Reset faellt, fehlt. plan.resets zaehlt diese Faelle mit.
        //
        // Was hier steht, ist deshalb kein SOLL/IST, sondern eine Beobachtung:
        // laeuft der Anlauf gerade, oder ist er durch?
        {
            const zeilen = [];
            for (const key of ["GENESIS", "ARSENAL"]) {
                let gesehen = 0, host = "";
                for (const s of series) {
                    const p = s.pr && s.pr.boot ? s.pr.boot[key] : null;
                    if (p) { gesehen++; if (!host) host = p.h || ""; }
                }
                const ist = gesehen > 0
                    ? `${gesehen}/${series.length}${host ? " @" + host : ""}`
                    : "—";
                const befund = gesehen > 0
                    ? (gesehen >= series.length ? "laeuft durchgehend" : "laeuft an")
                    : "durch (One-Shot, nicht im Fenster)";
                zeilen.push(padR(key, 12) + padR("Bootstrap", 16) + padR("—", 13) + padR(ist, 22) + befund);
            }
            if (zeilen.length) {
                L.push("");
                L.push("BOOTSTRAP (keine Daemons — der Anlauf nach einem Aug-Reset):");
                for (const z of zeilen) L.push(z);
                if (plan && plan.resets > 0) {
                    L.push(`   In diesem Dauerauftrag gab es ${plan.resets} Aug-Reset(s). Der Auftrag laeuft`);
                    L.push("   weiter (Fortschritt liegt in einer Textdatei), der DIAG-PROZESS aber nicht —");
                    L.push("   das Fenster, in das ein Reset faellt, kann deshalb luecken.");
                }
            }
        }

        // ---------- 3 WORKER-EINSATZ ----------
        hr("3  WORKER-EINSATZ");
        L.push("Dispatcher-Sicht (Port 25, GB je Klasse):");
        for (const c of DCLASSES) {
            const a = agg(s => (s.disp && s.disp.used) ? (s.disp.used[c] || 0) : NaN);
            L.push("  " + padR(c, 9) + aggStr(a));
        }
        L.push("  " + padR("frei", 9) + aggStr(agg(s => s.disp ? s.disp.poolLeftGb : NaN)));
        L.push("  " + padR("reserv.", 9) + aggStr(agg(s => s.disp ? s.disp.reservedGb : NaN)));
        const aT = agg(s => s.disp ? s.disp.targets : NaN), aP = agg(s => s.disp ? s.disp.prep : NaN);
        L.push(`  Ziele ${aggStr(aT, (x) => nNum(x, 0))} | Prep ${aggStr(aP, (x) => nNum(x, 0))} | execOk ${last.disp ? last.disp.execOk : "—"} | execFail ${last.disp ? last.disp.execFail : "—"} `);
        L.push(`  XP-Ziel ${last.disp ? (last.disp.xpTarget || "—") : "—"} | shareWanted ${last.disp ? last.disp.shareWanted : "—"} | Grind-Flag(P23) ${last.shrWanted}`);
        if (last.disp && Array.isArray(last.disp.best) && last.disp.best.length) {
            L.push("  Top-Ziele: " + last.disp.best.map(x => `${x.h} (${x.sPerGb} $/s·GB, ${x.pct}%)`).join(" | "));
        }
        L.push("");
        L.push("Reale Prozesse (ps, Threads je Klasse):");
        const wa = {};
        for (const c of WCLASSES) wa[c] = agg(s => s.pr.wsum[c]);
        for (const c of WCLASSES) L.push("  " + padR(c, 9) + aggStr(wa[c], (x) => nNum(x, 0)));
        L.push("  " + padR("Summe", 9) + aggStr(agg(s => s.pr.wtotal), (x) => nNum(x, 0)));
        const topHosts = Object.entries(last.pr.wrk || {})
            .map(([h, o]) => [h, Object.values(o).reduce((a, b) => a + b, 0)])
            .sort((a, b) => b[1] - a[1]).slice(0, 8);
        if (topHosts.length) L.push("  Verteilung (zuletzt, Top 8): " + topHosts.map(([h, n]) => `${h}:${n}`).join(", "));
        if (last.pr.foreign > 0) L.push(`  Fremde SCHWARM-Dateien ohne Registry-Eintrag: ${last.pr.foreign} (Prüf-/Altskripte)`);

        // Kreuzprobe Soll/Ist
        const dispSum = last.disp && last.disp.used ? DCLASSES.reduce((a, c) => a + (last.disp.used[c] || 0), 0) : null;
        // =====================================================================
        // v3.6 BUGFIX — DIE KREUZPROBE VERGLICH ZWEI VERSCHIEDENE MENGEN
        // =====================================================================
        // Hier stand `const realBusy = ramPeak.rootU;`.
        //
        // rootU ist aber ABSICHTLICH ohne Hacknet-Server (takeRam, oben:
        // `if (rooted && !isHn)`). Der Dispatcher belegt die Hacknet-Server
        // sehr wohl — seit DISPATCHER v12.3 sogar VOLLSTAENDIG, sobald Hashes
        // wertlos sind (hnReserveFrac 0). dispSum zaehlt deren Worker also mit,
        // realBusy nicht. Uebrig bleibt ein systematischer Ueberhang in genau
        // der Hoehe der Hacknet-Belegung.
        //
        // NACHGERECHNET am Bericht 458 vom 11.09.:
        //     verbucht 198.7T, "real" 135.2T  ->  Differenz 63.5T
        //     hacknet-* belegt                              66.0T
        // Der Rest ist die Spanne zwischen Hoechststand und Momentaufnahme.
        //
        // WIRKUNG: Dieser Befund stand in 263 von 431 Berichten (61 %) — der
        // mit Abstand haeufigste, sechs Tage lang, und nie mit einer echten
        // Ursache dahinter. Ein Dauer-Fehlalarm ist schlimmer als kein Befund:
        // er macht die echten unsichtbar, weil man sich an die rote Zeile
        // gewoehnt. (Genau dieselbe Lehre steht vier Zeilen weiter unten schon
        // einmal, fuer einen anderen Befund.)
        //
        // Hash-Produktion selbst verbraucht KEINEN RAM — belegter RAM auf einem
        // Hacknet-Server sind immer Skripte. hnU ist damit die richtige
        // Ergaenzung, nicht nur eine Naeherung.
        //
        // v3.7: `rootU + hnU` heisst jetzt `poolU` und wird an EINER Stelle
        // gebildet (takeRam). Die Rechnung ist unveraendert — sie hat nur
        // aufgehoert, die einzige Stelle im Bericht zu sein, die richtig rechnet.
        const realBusy = ramPeak.poolU;
        if (dispSum !== null) {
            L.push("");
            L.push(`Kreuzprobe: Dispatcher-Klassen zusammen ${nGb(dispSum)}  vs.  real belegt ${nGb(realBusy)}`
                + `  (gerootet ${nGb(ramPeak.rootU)} + hacknet ${nGb(ramPeak.hnU || 0)})`);
            L.push(`            (Hoechststand aus ${ramScans} Messungen; real enthält auch die Daemons selbst)`);
            if (realBusy > 0 && dispSum > realBusy * 1.25) {
                findings.push(`Dispatcher verbucht ${nGb(dispSum)}, real belegt sind ${nGb(realBusy)} — seine Buchführung liegt über der Realität (verwaiste Einträge oder Worker still gestorben).`);
            }
            if (dispSum > 0 && realBusy > dispSum * 1.5) {
                findings.push(`Real belegt ${nGb(realBusy)}, Dispatcher verbucht nur ${nGb(dispSum)} — es läuft RAM-Verbrauch, den er nicht kennt (Fremdprozesse/manuelle Starts).`);
            }
        }
        // =====================================================================
        // v3.7 — WAECHTER: BELEGT DARF NIE GROESSER SEIN ALS GESAMT
        // =====================================================================
        // Der Fehler, den v3.7 repariert, war von aussen sofort sichtbar: im
        // Kurzreport stand "PT=77.9T ... BY=138.7T". Belegt groesser als gesamt
        // ist arithmetisch unmoeglich und kann nur EINE Ursache haben — zwei
        // Zahlen aus verschiedenen Quellen in einer Zeile. Trotzdem lief das
        // wochenlang mit, weil niemand die beiden Zahlen nebeneinander hielt.
        //
        // Diese Probe kostet nichts und faellt beim naechsten Mal sofort auf.
        // Sie prueft die FERTIGEN Kennzahlen, also genau das, was im Kurzreport
        // landet — nicht die Zwischenwerte, aus denen sie gebaut wurden.
        // 2 % Toleranz, weil PT die Endmessung ist und BY der Dispatcher-Wert
        // aus einem leicht anderen Moment.
        {
            const pt = Number(ramEnd.poolT), by = Number(last.disp ? (last.disp.busyGb ?? NaN) : NaN);
            if (Number.isFinite(pt) && Number.isFinite(by) && pt > 0 && by > pt * 1.02) {
                findings.push(`Kennzahlen aus zwei Quellen gemischt: belegt ${nGb(by)} ist groesser als Pool gesamt ${nGb(pt)}. `
                    + `Das kann nicht sein. Entweder misst DIAG eine andere Menge als der Dispatcher (v3.6/v3.7 war `
                    + `genau das: Hacknet-Server hier ausgeschlossen, dort im Pool), oder der Dispatcher-Snapshot ist `
                    + `veraltet. Solange das steht, sind PT, PF und jede Prozentangabe darauf unbrauchbar.`);
            }
        }
        // =====================================================================
        // BUGFIX v4.0 — DIESER BEFUND WAR EIN DAUER-FEHLALARM
        // =====================================================================
        // Verglichen wurden zwei Zahlen, die NICHT dasselbe messen:
        //
        //   poolLeftGb   (Dispatcher) — frei NACH Abzug der Queen-Reservierungen,
        //                der Eval-Puffer und der home-Reserve. Das ist der Platz,
        //                den er fuer Worker benutzen DARF.
        //   rootFree     (DIAG)       — physisch frei, ohne jeden Abzug.
        //
        // Die Differenz IST die Reservierung. Im Livereport: Dispatcher "frei 11G /
        // reserviert 542G", DIAG "real 614G frei" — 542 + Rest ergibt genau die
        // 614. Der Befund erschien deshalb in JEDEM Zyklus und behauptete, der
        // Dispatcher "verschenke Kapazitaet", waehrend der in Wahrheit genau das
        // tat, was die Queen ihm aufgetragen hatte.
        //
        // Ein Diagnosewerkzeug, das dauerhaft einen erfundenen Fehler meldet,
        // senkt den Wert aller echten Befunde daneben. Jetzt wird die
        // Reservierung abgezogen, bevor verglichen wird — der Befund kann dann
        // nur noch feuern, wenn wirklich Platz brachliegt.
        if (last.disp && ramEnd.poolT > 0) {
            // v3.7: hier war die Verfaelschung in die ANDERE Richtung, und
            // deshalb unsichtbar. Verglichen wurde `realUsable` (aus rootFree,
            // also OHNE die freien Hacknet-Server) gegen `dFree` aus dem
            // Dispatcher-Snapshot (MIT). Der reale Platz wurde damit
            // systematisch zu klein gerechnet, die Bedingung unten also
            // systematisch zu selten erfuellt: ein Dispatcher, der tatsaechlich
            // Platz liegen laesst, waere nicht aufgefallen. Ein Fehlalarm
            // nervt — ein stiller Fehlalarm-Gegenteil verschweigt.
            //
            // v3.0 KORREKTUR — dieser Befund war zur Haelfte ein Fehlalarm.
            //
            // Verglichen wurden zwei Zahlen, die nicht vergleichbar sind:
            //   poolLeftGb ist der Pool NACH allen Deploy-Stufen, also der
            //     TIEFSTSTAND eines Takts;
            //   ramEnd.rootFree wird am Ende der Messschleife genommen und
            //     trifft irgendeine Phase.
            // Der Dispatcher schwankt zwischen beiden Werten (der Wellen-Deckel
            // wird ab WAVE_BYPASS_FRAC ausgesetzt, dann ist der Pool schlagartig
            // leer, dann greift er wieder). Minimum gegen Spitzenwert gerechnet
            // ergab im Livebericht einen erfundenen Fehlbetrag von 2.6 TB.
            //
            // Jetzt: poolStartGb (der Pool VOR den Deploys, das Gegenstueck zu
            // rootFree), die gewollte XP-Kopffreiheit ebenfalls abgezogen, und
            // gemeldet wird nur noch, wenn der Dispatcher AUS EIGENER MESSUNG
            // Platz liegen laesst — xpDiag.portion < xpDiag.fits.
            const dFree = Number.isFinite(last.disp.poolStartGb)
                ? last.disp.poolStartGb : (last.disp.poolLeftGb || 0);
            // Reservierung aus DEM Snapshot, den der Dispatcher selbst gemeldet
            // hat (nicht aus Port 19 neu lesen — sonst vergleicht man wieder zwei
            // Zeitpunkte). Fehlt das Feld, wird ersatzweise Port 19 summiert.
            let reservedGb = Number(last.disp.reservedGb);
            if (!Number.isFinite(reservedGb)) {
                reservedGb = Object.values(last.res || {}).reduce((a, b) => a + (Number(b) || 0), 0);
            }
            const xd = last.disp.xpDiag || null;
            const headroomGb = (xd && Number(xd.headroomGb)) || 0;
            // v2.7: Hoechststand statt Endmessung. Mit der Endmessung stand hier im
            // Livebericht "real 685.0T frei" — das war die Luecke zwischen zwei
            // Worker-Wellen, nicht brachliegender Platz.
            const realUsable = Math.max(0, ramPeak.poolFree - reservedGb - headroomGb);
            L.push(`            frei: Dispatcher ${nGb(dFree)} (vor den Deploys)  vs.  real ${nGb(ramPeak.poolFree)}`
                + `  (bei Hoechstlast; reserviert ${nGb(reservedGb)}, XP-Polster ${nGb(headroomGb)} -> nutzbar ${nGb(realUsable)})`);
            // Der harte Beleg: die XP-Stufe hatte Platz und hat ihn nicht genutzt.
            const liegenGelassen = xd && Number(xd.fits) > 0 && Number(xd.portion) < Number(xd.fits)
                ? Number(xd.fits) - Number(xd.portion) : 0;
            // v2.7 ZWEITE HUERDE: der Rueckstand muss auch ins Gewicht fallen.
            //
            // Der Wellen-Deckel verteilt eine Nachfuellung ABSICHTLICH auf mehrere
            // Takte; ein kleiner Rest ist damit der Normalzustand und kein Fehler.
            // Live: 4.200 von 410.818 Soll-Threads offen, gestartet 1.050 — der
            // "Fehlbetrag" von 3.150 Threads war ein Prozent der Flotte. Gemeldet
            // wird deshalb erst ab 5 % des Solls (mindestens 500 Threads).
            const xpSoll = (xd && Number(xd.total)) || 0;
            const spuerbar = liegenGelassen >= Math.max(500, xpSoll * 0.05);
            if (liegenGelassen > 0 && spuerbar && realUsable > Math.max(64, dFree + ramPeak.poolT * 0.05)) {
                const deckel = Array.isArray(last.disp.limits) && last.disp.limits.length
                    ? last.disp.limits.join(", ") : "keine gemeldet";
                findings.push(`Dispatcher laesst Platz liegen: die XP-Stufe haette ${xd.fits} Threads unterbringen `
                    + `koennen, gestartet hat sie ${xd.portion} — ${liegenGelassen} Threads blieben ungenutzt, `
                    + `obwohl der Bedarf offen ist. Aktive Deckel: ${deckel}. `
                    + `Stellschraube ist WAVE_BYPASS_FRAC im Dispatcher, nicht der Wellen-Deckel selbst `
                    + `(der faengt eine gemessene Thread-Schwingung ab).`);
            }
        }
        if (last.disp && (last.disp.execFail || 0) > 0) {
            findings.push(`execFail = ${last.disp.execFail}: Worker-Starts scheitern. Typisch: Pool voll (frei ${nGb(last.disp.poolLeftGb)}) oder Reservierung frisst den Host.`);
        }
        // FIX v1.1: ein voller Pool ist der NORMALFALL — der Dispatcher füllt ihn
        // absichtlich mit Füll-Workern und gibt für Daemons per Reservierung wieder
        // frei. Nur melden, wenn tatsächlich etwas daran scheitert: fehlgeschlagene
        // Starts oder ein Daemon, der laufen soll und nirgends auftaucht.
        const freeAgg = agg(s => s.disp ? s.disp.poolLeftGb : NaN);
        // v3.1: Schwelle gegen das GEMELDETE Polster, nicht gegen feste 2 %.
        // Die 2 % waren die alte XP-Kopffreiheit; seit sie bei 100 TB gedeckelt
        // ist, pendelt der freie Rest bei rund 1,3 % des Pools ein — die Bedingung
        // waere also DAUERHAFT wahr, und "Pool durchgehend voll" haette jeden
        // execFail faelschlich dem vollen Pool zugeschrieben. Voll ist der Pool
        // erst, wenn der freie Rest UNTER das Polster faellt: dort hoert der
        // Dispatcher von sich aus auf zu fuellen, darunter wird es eng.
        const padGb = Number(last.disp && last.disp.xpDiag && last.disp.xpDiag.padGb) || 0;
        const engSchwelle = padGb > 0 ? padGb * 0.5 : (last.disp ? last.disp.totalGb * 0.02 : 0);
        const poolTight = freeAgg && last.disp && (last.disp.totalGb || 0) > 0 && freeAgg.max < engSchwelle;
        if (poolTight) {
            const symptom = [];
            if ((last.disp.execFail || 0) > 0) symptom.push(`execFail ${last.disp.execFail}`);
            if (missingDaemons.length) symptom.push(`Daemons ohne Prozess: ${missingDaemons.join(", ")}`);
            if (symptom.length) {
                findings.push(`Pool durchgehend voll (max frei ${nGb(freeAgg.max)} von ${nGb(last.disp.totalGb)}) UND es scheitert etwas daran — ${symptom.join("; ")}.`);
            } else {
                L.push("");
                L.push(`Hinweis: Pool war durchgehend voll (max frei ${nGb(freeAgg.max)}), aber nichts ist daran gescheitert (execFail 0, alle gewollten Daemons laufen). Das ist der Normalfall — der Dispatcher füllt absichtlich auf.`);
            }
        }
        if (last.disp && last.disp.shareWanted && (last.disp.used || {})["share"] === 0) {
            findings.push("shareWanted ist gesetzt, aber die Klasse \"share\" hat 0 GB — der Grind bekommt keine Worker.");
        }
        // FIX v1.1 (Gegenprobe): share-Worker OHNE Grind-Wunsch. schwarm-s.js ist eine
        // Endlosschleife; vor Dispatcher v9.1 gab es keinen Abbau-Pfad, die Worker
        // blieben also nach dem Grind für immer im Pool. Genau das war der Fund im
        // ersten Livereport (92,6 TB = 34 % des Pools).
        // v2.2: shareTorn ist ENTFALLEN. Dispatcher v10 kennt keine Kills mehr — der
        // share-Worker ist selbst ein One-Shot (ns.share() kehrt nach ShareBonusTime
        // = 10 s zurueck, Share.ts:8) und laeuft von allein aus. Faellt das Grind-Flag,
        // sind die Worker binnen ~10 s weg. Ein Bestand OHNE Grind ist daher nur dann
        // ein Befund, wenn er sich HAELT; ein Rest im Messfenster ist normaler Auslauf.
        const shrGb = last.disp && last.disp.used ? (last.disp.used["share"] || 0) : 0;
        if (last.disp && !last.disp.shareWanted && shrGb > 0) {
            const shrFirst = series.length && series[0].disp && series[0].disp.used
                ? (series[0].disp.used["share"] || 0) : 0;
            if (shrFirst > 0 && shrGb >= shrFirst) {
                findings.push(`Kein Grind gewünscht, aber ${nGb(shrGb)} share-Worker halten sich `
                    + `über das ganze Fenster (Start ${nGb(shrFirst)}). Seit Dispatcher v10 laufen `
                    + `share-One-Shots binnen ~10 s aus — hier stimmt etwas nicht.`);
            } else {
                L.push("");
                L.push(`share läuft aus: ${nGb(shrFirst)} -> ${nGb(shrGb)} im Fenster (kein Grind). Normal.`);
            }
        }

        // ---------- 3b XP-ERTRAG: zahlt sich die XP-Stufe aus? ----------
        // STUFE 4 des Dispatchers schiebt allen Rest-RAM in XP-weaken. Das ist nur
        // sinnvoll, wenn das Hacking-Level dadurch messbar steigt — denn genau daran
        // hängen die Prep-Ziele (sie werden erst Ziele, wenn need <= level). Ohne
        // diesen Abschnitt sieht man 42 % Pool-Einsatz ohne jeden Wirkungsnachweis.
        // Datenquelle ist der player-Block (skills/exp), kostet also nichts extra.
        const plv = (x) => {
            try {
                const b = x.inf && x.inf.blocks ? x.inf.blocks["player"] : null;
                return (b && b.data) ? b.data : null;
            } catch (e) { return null; }
        };
        const lvlA = agg(s2 => { const d = plv(s2); return d && d.skills ? Number(d.skills.hacking) : NaN; });
        const xpA  = agg(s2 => { const d = plv(s2); return d && d.exp ? Number(d.exp.hacking) : NaN; });
        if (lvlA || xpA) {
            L.push("");
            L.push("XP-Ertrag im Fenster:");
            const secs = Math.max(1, (Date.now() - t0) / 1000);
            if (lvlA) {
                const dLvl = lvlA.last - lvlA.min;
                L.push(`  Hacking-Level   ${nNum(lvlA.min, 0)} -> ${nNum(lvlA.last, 0)}  (${dLvl > 0 ? "+" + nNum(dLvl, 0) : "keine Änderung"})`);
            }
            if (xpA) {
                const dXp = xpA.last - xpA.min;
                L.push(`  Hacking-XP      ${nNum(xpA.min, 0)} -> ${nNum(xpA.last, 0)}   = ${nNum(dXp / secs, 1)} XP/s`);
            }
            const xpGb = last.disp && last.disp.used ? (last.disp.used.xp || 0) : 0;
            if (xpA && xpGb > 0) {
                const dXp = xpA.last - xpA.min;
                L.push(`  Einsatz         ${nGb(xpGb)} in der XP-Klasse  ->  ${nNum((dXp / secs) / xpGb * 1000, 2)} XP/s je TB`);
            }
            // =================================================================
            // v2.9 — DIE XP-RECHNUNG STAND IM FALSCHEN BLOCK
            // =================================================================
            // Diese sechs Zeilen (Soll/Bestand/Bedarf/Portion/Worker-Laufzeit)
            // hingen INNERHALB von "if (pn && pn.length && lvlA)", also im
            // Abschnitt "Naechste Freischaltungen". Sobald das Hacking-Level alle
            // Prep-Ziele ueberholt hat, ist prepNext leer — und mit dem Abschnitt
            // verschwand die XP-Rechnung aus dem Bericht.
            //
            // Genau dann braucht man sie am dringendsten: bei Level 9075 meldet
            // der Bericht "Prep 0 .. 0", die Flotte pulsiert (Spur: 100 % / 0 % /
            // 0 % / 100 %), und die einzige Zahl, die Pulk von "Worker kuerzer als
            // der Takt" unterscheidet — die Worker-Laufzeit — war nicht zu sehen.
            // Zwei Lagebilder lang habe ich vergeblich danach gefragt, waehrend
            // DIAG sie selbst unterdrueckt hat.
            //
            // Die XP-Rechnung haengt an nichts, was mit Freischaltungen zu tun
            // haette. Sie steht jetzt eigenstaendig.
            const xd = last.disp && last.disp.xpDiag;
            if (xd) {
                L.push(`  XP-Stufe: Soll ${xd.total} thr | Bestand ${xd.held} | passt ${xd.fits}`);
                L.push(`            Bedarf ${xd.need} -> Portion ${xd.portion} thr je Takt, execs ${xd.execs}`);
                if (xd.lang) {
                    // v3.0 DAUERLAEUFER. Ab hier ist die Laufzeit KEIN Engpass mehr:
                    // der Worker endet nicht, also gibt es weder Pulk-Tod noch
                    // Nachfuell-Luecke. Die Zahl bleibt trotzdem im Bericht — sie
                    // war der Beleg fuer die Umstellung und macht sichtbar, ob sich
                    // die Lage im Spiel weiter verschiebt.
                    L.push(`            Bauart: DAUERLAEUFER (schwarm-wl.js) — der Worker endet nicht.`);
                    L.push(`            Bestand gesamt ${xd.langThreads} thr`
                        + (xd.langStale > 0 ? `, davon ${xd.langStale} auf einem ALTEN Ziel` : "")
                        + `  ·  Laufzeit je weaken ${xd.weakenSec} s`);
                    L.push(`            Polster ${xd.padGb} GB fuer CORE | frei nach der Stufe ${xd.freiGb} GB`
                        + `  (Sperre ${xd.headroomGb} GB)`);
                    if (xd.reapThreads > 0) {
                        L.push(`            Ernte gemeldet: ${xd.reapThreads} thr auf ${xd.reapHosts} Hosts`
                            + ` — die Queen toetet, der Dispatcher meldet nur.`);
                    }
                    // Der Sinn der Umstellung in EINER Zahl. Ohne Dauerlaeufer stand
                    // der Pool zwischen Pulk-Tod und Nachschub leer; gemessen wurde
                    // Laufzeit rund 12 s bei rund 22 s Luecke, also gut ein Drittel
                    // Auslastung. Faellt der Bestand hier trotzdem auf null, ist die
                    // Ursache eine andere und der Befund unten meldet sie.
                    if (xd.langThreads === 0 && xd.total > 0) {
                        findings.push(`Die XP-Stufe soll ${xd.total} Threads fahren, es laeuft aber kein einziger `
                            + `Dauerlaeufer. Entweder wurde gerade geerntet (dann steht oben eine Ernte-Zeile), `
                            + `oder schwarm-wl.js liegt nicht auf den Hosts — dann scheitert jeder exec still.`);
                    }
                    if (xd.langStale > 0) {
                        // =====================================================
                        // v3.2 — WER HAT SCHULD? DIE FRAGE BEANTWORTEN, NICHT STELLEN
                        // =====================================================
                        // Bis v3.1 endete dieser Befund mit "Bleibt die Zahl ueber
                        // mehrere Zyklen stehen, kommt die Meldung nicht an." Das ist
                        // eine Hausaufgabe fuer den Leser, keine Diagnose — und im
                        // Livebericht stand die Zahl vier Zyklen lang auf exakt 1883.
                        //
                        // Es gibt genau drei Moeglichkeiten, und sie sind
                        // unterscheidbar, weil DIAG den Eingang der Queen ohnehin je
                        // Sample mitliest (spwn, Port 2):
                        //   1. Die Meldung LIEGT dauerhaft im Port  -> die Queen holt
                        //      sie nicht ab. Sie laeuft nicht, oder mit altem Code.
                        //   2. Der Port ist meist leer, die Zahl sinkt trotzdem nicht
                        //      -> die Queen holt ab und toetet die FALSCHEN Prozesse.
                        //   3. Die Zahl sinkt -> alles in Ordnung, nur noch nicht fertig.
                        // Ein Port, der geleert wird, ist im Stichprobenmittel meist
                        // leer; einer, den niemand liest, zeigt bei JEDEM Sample
                        // dasselbe. Die Haelfte als Schwelle trennt beides deutlich.
                        const reapProben = series.filter(x => String(x.spwn || "").startsWith("REAP:")).length;
                        const anteil = series.length ? reapProben / series.length : 0;
                        let ursache;
                        if (anteil >= 0.5) {
                            ursache = `Die Ernte-Meldung liegt in ${reapProben} von ${series.length} Messungen `
                                + `unabgeholt im Eingang der Queen (Port 2). Ein Port, der geleert wird, ist `
                                + `meist leer — dieser nicht. Die Queen holt sie also nicht ab: entweder `
                                + `laeuft sie nicht, oder sie laeuft mit einer Fassung vor v12.0, die das `
                                + `Verb REAP nicht kennt. SCHWARM-QUEEN.js und SCHWARM-HELPERS.js einspielen `
                                + `und die Queen neu starten.`;
                        } else {
                            ursache = `Der Eingang der Queen wird geleert (REAP nur in ${reapProben} von `
                                + `${series.length} Messungen sichtbar), die Zahl sinkt aber nicht. Dann `
                                + `greift die Ernte daneben: bis v12.1 nannte die Meldung nur Host und `
                                + `Menge, nicht das ZIEL — die Queen toetete die groessten Prozesse, und `
                                + `das sind die der frischen Flotte, nicht die veralteten. Ab v12.2 traegt `
                                + `die Meldung das Ziel.`;
                        }
                        findings.push(`${xd.langStale} XP-Threads arbeiten noch am alten Ziel. Ein laufender `
                            + `Dauerlaeufer liest seine Argumente nie neu. ${ursache}`);
                    }
                } else {
                    // ALTBESTAND: ein Dispatcher vor v12.0 laeuft noch. Die Laufzeit
                    // ist dort der Engpass — deshalb bleibt die alte Rechnung stehen.
                    L.push(`            Worker-Laufzeit ${xd.weakenSec} s -> Wellen ${xd.fillTicks} Takte`
                        + `  (Kopffreiheit ${xd.headroomGb} GB)`);
                    if (xd.fillTicks === 1) {
                        L.push(`            Wellen aus: der Worker endet innerhalb eines Takts —`);
                        L.push(`            jede Drosselung waere reiner Leerstand.`);
                    }
                    // v2.9: die Auslastung direkt ausrechnen. Ein Worker laeuft
                    // weakenSec Sekunden, nachgefuellt wird alle 2 s (LOOP_MS im
                    // Dispatcher). Ist die Laufzeit kuerzer als ein Takt, steht der
                    // Pool den Rest der Zeit leer — und genau das ist die Frage,
                    // die dieser Bericht beantworten soll.
                    const lz = Number(xd.weakenSec);
                    if (Number.isFinite(lz) && lz > 0) {
                        const takt = 2;
                        if (lz < takt) {
                            const quote = Math.round(100 * lz / takt);
                            L.push(`            ACHTUNG: die Laufzeit (${lz} s) ist kuerzer als der`);
                            L.push(`            Dispatcher-Takt (${takt} s). Nachgefuellt wird erst im naechsten`);
                            L.push(`            Takt — der Pool arbeitet also hoechstens ${quote} % der Zeit.`);
                            findings.push(`XP-Worker laufen ${lz} s, der Dispatcher fuellt aber nur alle ${takt} s nach. `
                                + `Zwischen Ende und Nachschub steht der Pool leer: hoechstens ${quote} % Auslastung. `
                                + `Einweg-Worker sind bei dieser Hacking-Geschwindigkeit zu kurzlebig fuer den Takt. `
                                + `Der Dispatcher ab v12.0 faehrt hier Dauerlaeufer — diese Meldung heisst also `
                                + `auch: der alte Dispatcher laeuft noch.`);
                        }
                    }
                }
            }
            // Abstand zur nächsten Freischaltung (prepNext, Dispatcher v9.2)
            const pn = last.disp && Array.isArray(last.disp.prepNext) ? last.disp.prepNext : null;
            if (pn && pn.length && lvlA) {
                const lvlNow = lvlA.last;
                L.push("  Nächste Freischaltungen (Prep-Ziele, nach Level-Bedarf):");
                for (const e of pn) L.push(`    ${padR(e.h, 22)} braucht L${padL(e.L, 5)}   Lücke ${padL(Math.max(0, e.L - lvlNow), 5)}`);
                const gap = Math.max(0, pn[0].L - lvlNow);
                // v2.1: Ist das XP-Ziel gleichzeitig ein Geld-Ziel, teilen XP- und
                // CORE-weaken denselben Buchungsschlüssel — die xp-Klasse zeigt dann 0,
                // während die Threads unter core_w laufen. Im Nachtlauf meldete DIAG
                // deshalb 16 Zyklen lang "XP bekommt nichts", obwohl das Level von 128
                // auf 215 stieg. Erklären statt anklagen.
                // v2.2 KORRIGIERT. Der alte Text behauptete, die xp-Klasse zeige
                // "deshalb 0 GB". Das galt fuer Dispatcher v10.2, wo XP- und
                // CORE-weaken denselben Buchungsschluessel teilten. Seit v10.3 ist der
                // Schluessel "art|klasse|ziel", die Klassen sind getrennt und die
                // xp-Zahl ist echt — der alte Hinweis haette eine korrekte Zahl als
                // Artefakt wegerklaert. Unterscheidbar am Feld busyGb, das erst v10.3
                // mitschickt.
                // v2.5: der Rechenweg der XP-Stufe (Dispatcher v10.5). Er stand bis
                // v2.4 nur im Kurzreport — hier wird er gelesen.
                const overlap = !!(last.disp && last.disp.xpIsCore);
                const dispV103 = !!(last.disp && last.disp.busyGb !== undefined);
                if (overlap && !dispV103) {
                    L.push(`  Hinweis: das XP-Ziel (${last.disp.xpTarget}) ist gleichzeitig ein Geld-Ziel,`);
                    L.push(`  und dieser Dispatcher (< v10.3) bucht beide auf EINEN Schlüssel: die`);
                    L.push(`  xp-Klasse zeigt 0 GB, obwohl die Threads laufen — sie stehen unter core_w.`);
                    L.push(`  Folge: STUFE 1 rechnet ihren Bedarf gegen die XP-Threads und startet auf`);
                    L.push(`  diesem Ziel kein CORE-weaken mehr. Dispatcher-Update empfohlen.`);
                } else if (overlap) {
                    L.push(`  Hinweis: das XP-Ziel (${last.disp.xpTarget}) ist gleichzeitig ein Geld-Ziel.`);
                    L.push(`  Beide Klassen arbeiten auf demselben Host, werden aber seit Dispatcher`);
                    L.push(`  v10.3 GETRENNT gebucht — die xp-Zahl oben ist echt. Nützliche`);
                    L.push(`  Nebenwirkung: das XP-weaken hält die Sicherheit des Geld-Ziels am Minimum.`);
                }
                if (gap > 0 && lvlA.last === lvlA.min && !overlap) {
                    findings.push(`Die XP-Stufe belegt ${nGb(xpGb)}, aber das Hacking-Level hat sich im Fenster nicht bewegt. Bis zur nächsten Freischaltung (${pn[0].h}) fehlen ${gap} Level — mit diesem Fenster nicht abschätzbar, längeres Fenster nötig (run SCHWARM-DIAG.js 300).`);
                }
            } else if (last.disp && !Array.isArray(last.disp.prepNext)) {
                L.push("  (Dispatcher < v9.2 liefert prepNext nicht — Abstand zur Freischaltung unbekannt.)");
            }
        }

        // ---------- 3c BLADEBURNER ----------
        // v1.7: Skillpunkte und nächste BlackOp im Verlauf. Anlass sind zwei Beobachtungen
        // aus dem Betrieb: Punkte stapeln sich auf 100k+, ohne ausgegeben zu werden, und
        // angebotene BlackOps werden nicht immer gestartet. Beides ist nur mit Verlauf
        // belegbar — ein Standbild zeigt nicht, ob die Punkte STEIGEN oder stagnieren.
        // Datenquelle ist INFOs blade-Block (rank/skillPoints/stamina/chaos/nextBlackOp).
        const bl = (x) => { try { const b = x.inf && x.inf.blocks ? x.inf.blocks["blade"] : null; return (b && b.data) ? b.data : null; } catch (e) { return null; } };
        const blNow = bl(last);
        if (blNow) {
            const spA = agg(s2 => { const d = bl(s2); return d ? Number(d.skillPoints) : NaN; });
            L.push("");
            L.push("Bladeburner:");
            L.push(`  Rang ${nNum(blNow.rank, 0)} | Chaos ${nNum(blNow.chaos, 1)} | Stadt ${blNow.city || "—"}` +
                   (blNow.stamina ? ` | Ausdauer ${nNum(blNow.stamina[0], 0)}/${nNum(blNow.stamina[1], 0)}` : ""));
            if (spA) {
                const dSp = spA.last - spA.min;
                L.push(`  Skillpunkte ${nNum(spA.min, 0)} -> ${nNum(spA.last, 0)}  (${dSp > 0 ? "+" + nNum(dSp, 0) : dSp < 0 ? nNum(dSp, 0) + " ausgegeben" : "unverändert"})`);
                // Steigen sie nur und werden nie kleiner, gibt der Daemon nichts aus.
                if (spA.last >= spA.max && dSp > 0 && spA.last > 1000) {
                    findings.push(`Bladeburner-Skillpunkte stiegen im Fenster von ${nNum(spA.min, 0)} auf ${nNum(spA.last, 0)} und wurden NIE ausgegeben (Bestand nur gewachsen). Bei ${nNum(spA.last, 0)} liegenden Punkten arbeitet der Daemon ohne Skill-Ausbau.`);
                }
            }
            const nb = blNow.nextBlackOp;
            if (nb && nb.name) {
                const reach = (typeof nb.rank === "number") ? (Number(blNow.rank) >= nb.rank) : null;
                L.push(`  Nächste BlackOp: ${nb.name} (Rang ${nNum(nb.rank, 0)} nötig, Rang ${nNum(blNow.rank, 0)} vorhanden)` +
                       (reach === true ? "  -> ERREICHBAR" : reach === false ? "  -> Rang fehlt" : ""));
                // v2.8: DER RANG IST NUR EINE VON MEHREREN BEDINGUNGEN.
                //
                // Hier stand ein Befund, sobald der Rang reichte — er feuerte
                // dadurch in jedem Bericht, obwohl der Daemon voellig richtig
                // handelte. Live: Operation Typhoon, Rang 6676 von 2500 noetig,
                // geschaetzte Erfolgschance aber nur 19,0 % bis 32,1 %. Eine
                // gescheiterte BlackOp kostet Rang und Mitglieder; sie liegen zu
                // lassen ist die richtige Entscheidung.
                //
                // Der Befund gilt jetzt nur noch, wenn Rang UND Erfolgschance
                // stimmen — dann waere ein Nichtstarten tatsaechlich fragwuerdig.
                // v3.0: die Spannweite ist bei BlackOps KEIN Risikomass.
                // BlackOperation.ts setzt getPopulationSuccessFactor und
                // getChaosSuccessFactor fest auf 1 — Schaetzwert und echter Wert
                // sind also identisch, und Action.getSuccessRange verschiebt
                // danach GENAU EIN Ende der Spanne mit r = pop / popEst. Eine
                // breite Spanne heisst hier deshalb nicht "unsicher", sondern
                // nur "die Bevoelkerung dieser Stadt ist schlecht geschaetzt".
                const ch = Array.isArray(nb.chance) ? nb.chance : null;
                const spread = ch ? (ch[1] - ch[0]) : 0;
                // v3.14: CHRONIK. Eine einzelne "naechste BlackOp" sagt nichts
                // darueber, ob der Daemon VORANKOMMT — erst die Reihe zeigt, ob
                // seit Stunden dasselbe ansteht. Erledigte werden gezaehlt, nicht
                // einzeln aufgezaehlt: interessant ist die Front, nicht die
                // Vergangenheit.
                if (blNow && Array.isArray(blNow.blackOps) && blNow.blackOps.length) {
                    const alle = blNow.blackOps;
                    const fertig = alle.filter(x => x && x.o === 0).length;
                    const offen = alle.filter(x => x && x.o !== 0);
                    L.push(`                   Chronik: ${fertig} von ${alle.length} BlackOps erledigt`);
                    for (const x of offen.slice(0, 4)) {
                        const reicht = typeof x.r === "number" && typeof blNow.rank === "number" && blNow.rank >= x.r;
                        L.push(`                     ${reicht ? "Rang ok " : "gesperrt"}  ${padR(x.n, 26)}`
                            + `Rang ${nNum(x.r, 0)}`);
                    }
                    if (offen.length > 4) L.push(`                     ... und ${offen.length - 4} weitere`);
                }
                if (ch) {
                    L.push(`                   Erfolgschance ${(ch[0] * 100).toFixed(1)} % ~ ${(ch[1] * 100).toFixed(1)} %`
                        + (ch[1] < BLACKOP_MIN_CHANCE ? "  -> zu niedrig, Daemon wartet zu Recht"
                            : spread > 0.02 ? "  -> Spanne von der Bevoelkerungsschaetzung, nicht vom Risiko"
                            : "  -> lohnt"));
                    // v2.7: die Spanne wird staendig als Unsicherheit missverstanden.
                    // Sie ist keine. Bei BlackOps ist est === real (beide Faktoren fest
                    // auf 1), also diff = 0 und low = high = real; erst danach zieht
                    // getSuccessRange EIN Ende mit r = pop / popEst weg. Der Wert, der
                    // NICHT verschoben wurde, ist die echte Chance.
                    if (spread > 0.02) {
                        const r = ch[1] > 0 ? ch[0] / ch[1] : 1;
                        L.push(`                   Die echte Chance ist ${(ch[1] * 100).toFixed(1)} %. Die untere Zahl entsteht `
                            + `allein daraus, dass die Bevoelkerungsschaetzung`);
                        L.push(`                   dieser Stadt um Faktor ${(1 / Math.max(r, 1e-9)).toFixed(2)} danebenliegt — auf BlackOps `
                            + `wirkt die Bevoelkerung gar nicht. "Field Analysis" richtet sie.`);
                    }
                }
                // =========================================================
                // v3.6 — "OPERATION DAEDALUS" IST KEIN BEFUND, SONDERN ABSICHT
                // =========================================================
                // Diese Zeile stand in jedem einzelnen Zyklus von vier
                // Lagebildern in Folge: "ist startbar ... Pruefen, ob der
                // Daemon sie tatsaechlich startet." Er startet sie nicht, und
                // das ist gewollt — Daedalus beendet die BitNode
                // (Daedalus-Sperre im Bladeburner-Payload; der Spieler
                // entscheidet selbst im UI, weil ein Wechsel jeden Fortschritt
                // bei Sleeves und Grafting abschneidet).
                //
                // Ein Befund, der in jedem Bericht steht und immer dieselbe
                // richtige Antwort hat, ist kein Befund mehr, sondern
                // Grundrauschen — und Grundrauschen macht die echten Befunde
                // unsichtbar. Fuer die finale BlackOp also eine ruhige
                // Zustandszeile, fuer alle anderen weiterhin ein Befund.
                // =========================================================
                // v3.8 — DIE AUSNAHME FUER DIE FINALE GALT NUR EINEM ZWEIG
                // =========================================================
                // Die ruhige Zustandszeile stand nur im ERSTEN Fall (Spanne
                // eng, ch[0] schon ueber der Schwelle). Ist die Schaetzung
                // dagegen unscharf — ch[0] darunter, ch[1] darueber —, fiel
                // "Operation Daedalus" in den DRITTEN Zweig und erzeugte einen
                // Befund: der Daemon solle Field Analysis laufen lassen.
                //
                // Das ist falsch, und zwar aus einem Grund, den DIAG nicht
                // sehen konnte: der Bladeburner-Daemon hat eine ausdrueckliche
                // DAEDALUS-SPERRE (PAYLOADS, Doktrin-Entscheid). Er nimmt die
                // Finale gar nicht erst in chancePairs auf, damit sie NIE
                // automatisch startet — sie beendet die BitNode, und den
                // Ausloeser will der Spieler selbst in der Hand haben. Ohne
                // Eintrag in chancePairs liefern minC/maxC 0, also kann auch
                // der Aufklaerungszweig des Daemons nicht feuern. Er verhaelt
                // sich exakt wie vorgesehen.
                //
                // GEMESSEN: der Befund stand am 13.09.2026 ueber 12 Laeufe am
                // Stueck als einziger aktiver Befund im Destillat — ein
                // Dauer-Fehlalarm auf eine Doktrin-Entscheidung. Dieselbe Lehre
                // wie in v3.6 und beim CORP-Export: ein Befund, der immer steht
                // und immer dieselbe richtige Antwort hat, macht die echten
                // unsichtbar.
                //
                // Fuer die Finale also IMMER die ruhige Zustandszeile, mit der
                // Spanne, wenn sie unscharf ist — nie ein Befund.
                const istFinale = String(nb.name) === "Operation Daedalus";
                const startbarEng  = reach === true && ch && ch[0] >= BLACKOP_MIN_CHANCE;
                const startbarWeit = reach === true && ch && ch[1] >= BLACKOP_MIN_CHANCE && spread > 0.02;
                if (istFinale && (startbarEng || startbarWeit)) {
                    L.push("");
                    L.push(`  "${nb.name}" waere startbar (${(ch[1] * 100).toFixed(1)} %) und wird`);
                    L.push("  ABSICHTLICH nicht gestartet: sie beendet die BitNode. Der Ausloeser");
                    L.push("  liegt beim Spieler im Bladeburner-UI. Kein Fehler.");
                    if (startbarWeit && !startbarEng) {
                        L.push(`  (Die Schaetzung ist unscharf, ${(ch[0] * 100).toFixed(1)} %–${(ch[1] * 100).toFixed(1)} %.`);
                        L.push("   Auch das ist keiner: die Sperre haelt die Finale aus chancePairs");
                        L.push("   heraus, deshalb klaert der Daemon sie bewusst nicht auf.)");
                    }
                } else if (startbarEng) {
                    findings.push(`BlackOp "${nb.name}" ist startbar: Rang ${nNum(blNow.rank, 0)} >= ${nNum(nb.rank, 0)} `
                        + `UND Erfolgschance ${(ch[0] * 100).toFixed(1)} %–${(ch[1] * 100).toFixed(1)} %. `
                        + `Prüfen, ob der Daemon sie tatsächlich startet.`);
                } else if (startbarWeit) {
                    findings.push(`BlackOp "${nb.name}": Rang reicht (${nNum(blNow.rank, 0)} >= ${nNum(nb.rank, 0)}), `
                        + `Obergrenze ${(ch[1] * 100).toFixed(1)} % — aber die Untergrenze steht bei `
                        + `${(ch[0] * 100).toFixed(1)} %, weil die Bevoelkerungsschaetzung der Stadt daneben liegt. `
                        + `Bei BlackOps beeinflusst die Bevoelkerung den Wurf gar nicht (Faktor fest 1); die Spanne `
                        + `ist reines Schaetzrauschen. Der Daemon sollte "Field Analysis" laufen lassen, bis sie `
                        + `zusammenfaellt — passiert das nicht, laeuft die Aufklaerung nicht.`);
                }
            } else if (nb === null) {
                L.push("  Nächste BlackOp: keine offen (alle erledigt)");
            }
        }

        // ---------- 4 BANK / HASHNET / MARKT / CORP ----------
        hr("4  BANK / HASHNET / MARKT / CORP");
        const B = last.bank || {};
        // v2.5: RESERVE zuerst — sie entscheidet seit BANK v3.0, was ausgegeben wird.
        // Der Spartopf steht darunter und ist ausdruecklich als Anzeige markiert,
        // damit niemand mehr aus ihm auf die Kaufkraft schliesst.
        if (B.reserve) {
            const R = B.reserve;
            L.push(`RESERVE:        ${nMoney(R.gesamt)}   (Sockel ${nMoney(R.sockel)}`
                + (R.hold > 0 ? ` + HOLD ${nMoney(R.hold)}` : "")
                + (R.grants > 0 ? ` + Freigaben ${nMoney(R.grants)}` : "") + `)`);
            L.push(`Frei:           ${nMoney(B.frei)} fuer Investitionen`
                + (B.betriebsfrei !== undefined ? `   ${nMoney(B.betriebsfrei)} fuer Betrieb (Reisen/Klinik)` : ""));
        }
        L.push(`Spartopf:       ${nMoney(B.savings)}   Sparrate ${nNum((B.savingsRate || 0) * 100, 0)}%`
            + (B.reserve ? "  [ANZEIGE, entscheidet seit BANK v3.0 nichts]" : "")
            + `   (Verlauf ${aggStr(agg(s => (s.bank || {}).savings), nMoney)})`);
        L.push(`Sparziel:       ${B.goal ? `${B.goal.key} — ${B.goal.label} @ ${nMoney(B.goal.cost)}  [Status ${B.goal.status || "—"}]` : "keines"}`
            // v2.5: die Finanzierungszeit entscheidet seit BANK v3.0, ob das Ziel
            // ueberhaupt aktiv wird. Ohne sie war nicht zu sehen, warum eines vertagt ist.
            + (B.goalEtaMin !== undefined && B.goalEtaMin !== null
                ? `   Finanzierung in ~${B.goalEtaMin} min` : ""));
        if (B.goal) L.push(`                liquid ${nMoney(B.goal.liquid)} | Portfolio ${nMoney(B.goal.portfolio)}`);
        L.push(`Corp-Ziel:      ${B.corpGoal ? nMoney(B.corpGoal) : (B.corpExists ? "Corp existiert" : "—")}`);
        L.push(`Trader-Rate:    ${B.ratePerH !== undefined ? nMoney(B.ratePerH) + "/h" : "—"}   Hack-EMA ${B.hackPerGbH !== undefined ? nMoney(B.hackPerGbH) + "/GB·h" : "—"}`);
        // v2.7: WARUM der Top-Antrag nicht freigegeben wurde. Der Befund "Antraege
        // werden nicht bedient (Geld fehlt oder Freigabe haengt)" liess ueber
        // Stunden offen, welches von beidem — die Antwort stand nur im Rohwert
        // auf BANK_IN. BANK meldet den Grund jetzt selbst.
        if (Array.isArray(B.freigaben)) {
            // v3.24 (BANK v5.17): mehrere Freigaben je Takt - alle zeigen,
            // dazu was uebersprungen wurde und warum.
            L.push(`Anträge offen:  ${B.openMoneyReqs || 0}   freigegeben ${B.freigaben.length}`
                + `   uebersprungen ${B.unbedient || 0}   Rest danach ${nMoney(B.restNachFreigaben)}`);
            for (const f of B.freigaben) {
                L.push(`                frei   ${String(f.req).padEnd(34)} ${nMoney(f.betrag)}  Prio ${f.prio}`
                    + (f.gekuerzt ? "  gekuerzt" : "") + (f.bestand ? "  (Bestand)" : ""));
            }
            for (const b of (B.blockiert || [])) {
                L.push(`                warte  ${String(b.req).padEnd(34)} ${b.grund}`);
            }
        } else {
            L.push(`Anträge offen:  ${B.openMoneyReqs || 0}   Top: ${B.topTarget || "—"}`
                + (B.topBlocked ? `   [nicht freigegeben: ${B.topBlocked}]` : ""));
        }
        L.push(`Markt-Caps:     ${B.market ? JSON.stringify(B.market) : "—"}`);
        L.push(`Portfolio(P26): ${nMoney(last.pv)}   Liquidation(P27): ${nMoney(last.lq)}   Hash-Bedarf(P9): ${nNum(last.hashNeed, 0)}`);
        const hb = last.inf && last.inf.blocks ? last.inf.blocks["hacknet"] : null;
        L.push(`Hacknet(INFO):  ${hb && hb.ok !== false && hb.data ? JSON.stringify(hb.data).slice(0, 200) : "— (Block fehlt/stale)"}`);
        // =====================================================================
        // v2.8 — CORP LESBAR STATT ROH-JSON
        // =====================================================================
        // Hier stand ein abgeschnittener JSON-Dump. CORP veroeffentlicht auf Port 31
        // seit v0.21 laengst die Kennzahlen, die man braucht (reserve, budget,
        // divisions, cities) — sie wurden nur nie angezeigt. Ab v0.22 kommt die
        // Reserve zusaetzlich aufgeschluesselt.
        //
        // Die entscheidende Zahl ist das RUNDENBUDGET. CORP rechnet
        //     availFunds = funds - (Unlock + naechste Stufe + Betriebskapital)
        //     budget     = availFunds * SPEND_FRACTION (0,5)
        // Ist die Reserve groesser als die Fonds, wird das Budget null — dann kauft
        // die Corp NICHTS mehr, auch keine Lager, kein Personal, keine Upgrades.
        // Und weil sie nicht mehr waechst, erreicht sie die Reserve nie. Genau
        // dieselbe Bauart wie die Sparziel-Sperre, die in BANK schon aufgefallen ist.
        const cq = last.corp;
        // v3.25: readCorpInfo liefert {} statt null - ohne ts gab es nie eine Meldung.
        if (!cq || !cq.ts) {
            L.push(`Corp(P15):      —`);
        } else {
            const alt = cq.ts ? Math.round((Date.now() - cq.ts) / 1000) : null;
            // v3.25: FRISCHE-TOR. Befunde nur, wenn CORP lief und der Port frisch ist.
            const corpLief = !!(seen["CORP"] && seen["CORP"].n > 0);
            const corpFrisch = corpLief && alt !== null && alt <= CORP_PORT_FRISCH_S;
            L.push(`Corp(P15):      Fonds ${nMoney(cq.funds || 0)}   Profit ${nMoney(cq.profitPerSec || 0)}/s   `
                + `${cq.divisions || 0} Division(en), ${cq.cities || 0} Bueros (Division x Stadt, max 6 Staedte)`
                + (alt === null ? "" : `   (${alt} s alt)`));
            if (!corpFrisch) {
                const um = new Date(cq.ts);
                const hhmm = `${String(um.getHours()).padStart(2, "0")}:${String(um.getMinutes()).padStart(2, "0")}`;
                L.push(`                (CORP ${corpLief ? "meldet nicht" : "lief in diesem Fenster nicht"} — `
                    + `Stand von ${hhmm}, vor ${Math.round((alt || 0) / 60)} min. Die Zahlen sind eingefroren, `
                    + `die CORP-Befunde ruhen.)`);
            }
            // v3.25: Node-Lage - was bringt die Corp in DIESER Node? Kein Befund.
            try {
                const bnC = last.inf && last.inf.blocks ? last.inf.blocks["bn"] : null;
                const mC = bnC && bnC.data ? bnC.data.mults : null;
                const sc = mC && typeof mC.CorporationSoftcap === "number" ? mC.CorporationSoftcap : null;
                if (sc !== null && sc < 0.75) {
                    const expo = Math.max(0, sc - 0.15);
                    L.push(`                Node-Lage: CorporationSoftcap ${sc.toFixed(2)} — die Dividende wird `
                        + `hoch ${expo.toFixed(2)} genommen (mit beiden Unlocks hoch ${sc.toFixed(2)}), die Corp bringt `
                        + `hier kaum Geld. Gesteuert wird sie trotzdem (Spieler 26.09.), gegruendet nur, `
                        + `wenn $150b in 60 s hereinkommen (BANK v5.18).`);
                }
            } catch (e) { /* nur Anzeige */ }
            const rp = cq.reserveParts || null;
            // v2.9: cq.budget ist der REST nach allen Kaeufen, nicht das Budget.
            // Wer beides verwechselt, haelt eine Corp, die ihr Geld vollstaendig
            // ausgibt, faelschlich fuer blockiert. Gemessen wird am START.
            const budStart = Number(cq.budgetStart);
            const budRest = Number(cq.budget) || 0;
            const bud = Number.isFinite(budStart) ? budStart : budRest;
            L.push(`                Reserve ${nMoney(cq.reserve || 0)}`
                + (rp ? ` = Unlock ${nMoney(rp.unlock)} + naechste Stufe ${nMoney(rp.stage)} `
                      + `+ Betriebskapital ${nMoney(rp.workCap)}` : " (Aufschluesselung fehlt — CORP < v0.22)")
                + `   ->  Rundenbudget ${nMoney(bud)}`
                + (Number.isFinite(budStart)
                    ? `, davon ${nMoney(Math.max(0, budStart - budRest))} ausgegeben (${nMoney(budRest)} uebrig)`
                    : " (CORP < v0.23: das ist der REST nach den Kaeufen, nicht das Budget)"));
            if (cq.public) {
                const eigen = cq.totalShares > 0 ? (cq.numShares / cq.totalShares * 100) : 100;
                L.push(`                Boerse: ${eigen.toFixed(1)} % eigen, Dividende `
                    + `${((cq.dividendRate || 0) * 100).toFixed(1)} %, Kurs ${nMoney(cq.sharePrice || 0)}`);
            } else {
                L.push(`                privat   Investitionsrunde ${cq.investRound || 0}/${cq.maxInvestRounds || "?"}`);
            }

            // =================================================================
            // v3.20 — DIE CORP-UPGRADES WAREN NIRGENDS ZU SEHEN
            // =================================================================
            // In 60 Berichten stand keine Zeile dazu. Ob Project Insight,
            // Smart Storage oder Wilson Analytics je gekauft wurden, war von
            // aussen nicht feststellbar — obwohl es die teuersten und am
            // laengsten wirkenden Posten der Corp sind.
            //
            // Seit CORP v0.44 liegen Stufe und naechster Preis auf dem Port.
            // Hier wird nur gezeigt, nicht gerechnet.
            const ups = (cq.ups && typeof cq.ups === "object") ? cq.ups : null;
            if (ups) {
                const kurz = {
                    "Wilson Analytics": "Wilson", "Smart Factories": "SmartFab",
                    "Smart Storage": "SmartLager", "Project Insight": "Insight",
                    "ABC SalesBots": "SalesBots", "Neural Accelerators": "Neural",
                    "FocusWires": "Focus", "Speech Processor Implants": "Speech",
                    "Nuoptimal Nootropic Injector Implants": "Nuoptimal",
                    "DreamSense": "Dream",
                };
                const teile = Object.keys(ups).map(n => {
                    const u = ups[n] || {};
                    const lvl = (typeof u.lvl === "number" && u.lvl >= 0) ? u.lvl : "?";
                    const c = (typeof u.cost === "number" && u.cost >= 0) ? ` (${nMoney(u.cost)})` : "";
                    return `${kurz[n] || n} ${lvl}${c}`;
                });
                for (let i = 0; i < teile.length; i += 3) {
                    L.push(`                ${i === 0 ? "Upgrades:" : "         "} `
                        + teile.slice(i, i + 3).join("  |  "));
                }

                // DER BEFUND: ein Posten, der teurer ist als das GANZE
                // Rundenbudget, ist nicht teuer — er ist unerreichbar.
                // corpUpgradeStep laeuft als LETZTER und sieht ohnehin nur den
                // Rest nach Lager, Buero, Boost und AdVert. Dieselbe Krankheit
                // wie beim Lager (CORP v0.43) und beim Buero (v0.39).
                // v3.25: seit CORP v0.45 greift corpUpgradeStep Rundenrest UND
                // Grossposten-Topf - zusammen Fonds - Unlock - Betriebskapital.
                const greifbar = (cq.funds || 0) - (rp ? (rp.unlock || 0) + (rp.workCap || 0) : 0);
                const unerreichbar = !corpFrisch ? [] : Object.keys(ups).filter(n => {
                    const u = ups[n] || {};
                    // v3.21: OHNE die Einschraenkung auf Stufe 0. Die stand hier
                    // zuerst und ging am Ziel vorbei - die erste Messung zeigte
                    // Wilson auf Stufe 16 mit $262 Bio. fuer die naechste, gegen
                    // $1,27 Bio. Budget. Unerreichbar ist unerreichbar, egal auf
                    // welcher Stufe.
                    return typeof u.cost === "number" && u.cost > 0
                        && greifbar > 0 && u.cost > greifbar;
                });
                if (unerreichbar.length) {
                    findings.push(`CORP: bei ${unerreichbar.length} Upgrade(s) kostet die `
                        + `NAECHSTE Stufe mehr als alles, was corpUpgradeStep ueberhaupt greifen kann `
                        + `(Rundenrest plus Grossposten-Topf = Fonds minus Unlock-Reserve minus `
                        + `Betriebskapital, ${nMoney(greifbar)}): `
                        + unerreichbar.map(n => `${n} Stufe ${ups[n].lvl} -> ${nMoney(ups[n].cost)}`).join(", ")
                        + `. Einen eigenen Topf haben die Upgrades seit CORP v0.45 schon; diese `
                        + `Stufen kommen erst, wenn die Fonds wachsen.`);
                }
            }

            // =================================================================
            // v3.18 — WIE GUT STEHT JEDE DIVISION WIRKLICH DA?
            // =================================================================
            // "1 Division(en), 4 Bueros" hat zwei Fragen offen gelassen, die
            // beim Haerten die einzigen sind, auf die es ankommt: sind die
            // Bueros besetzt, und sind die Lager gefuellt? Eine Division in
            // vier Staedten mit je zwei Mitarbeitern sieht in der alten Zeile
            // genauso aus wie eine mit je neunzig.
            //
            // Seit CORP v0.37 liegen die Zahlen auf dem Port. Hier werden sie
            // nur noch gezeigt — gerechnet wird nichts, damit die Anzeige der
            // Entscheidung nicht widersprechen kann (die Falle aus BANK v5.6).
            const dl = Array.isArray(cq.divs) ? cq.divs : null;
            if (dl && dl.length) {
                const maxSt = cq.maxStaedte || 6;
                L.push("");
                L.push("                " + padR("DIVISION", 14) + padR("BRANCHE", 16)
                    + padL("STAEDTE", 8) + padL("PERSONAL", 12) + padL("LAGER", 16)
                    + padL("MOR/ENE", 9) + padL("RP", 8) + padL("BUERO+3", 10) + "  VERKAUF");
                L.push("                " + "-".repeat(88));
                for (const d of dl) {
                    const lager = (d.wh || 0) > 0
                        ? `${fmtK(d.whUsed || 0)}/${fmtK(d.wh || 0)}`
                        : "kein Lager";
                    L.push("                " + padR(String(d.d || "?"), 14)
                        + padR(String(d.ind || "?"), 16)
                        + padL(`${d.staedte || 0}/${maxSt}`, 8)
                        + padL(`${d.emp || 0}/${d.empMax || 0}`, 12)
                        + padL(lager, 16)
                        + padL(`${d.moral || 0}/${d.energie || 0}`, 9)
                        + padL(String(d.rp || 0), 8)
                        + padL(d.oCost === null || d.oCost === undefined ? "—"
                               : (d.oCost < 0 ? "FEHLER" : nMoney(d.oCost)), 10)
                        + "  " + (d.ta2 ? "TA.II" : "MP")
                        + (d.produkte ? " +Produkte" : ""));
                }
                // BEFUNDE, die aus diesen Zahlen unmittelbar folgen - v3.25 nur
                // auf frischen Zahlen (Frische-Tor oben).
                const dranJetzt = typeof cq.dran === "string" ? cq.dran : null;
                if (corpFrisch) {
                    for (const k of Object.keys(corpStaedteSerie)) {
                        if (!dl.some(x => x.d === k)) delete corpStaedteSerie[k];
                    }
                }
                for (const d of dl) {
                    if (!corpFrisch) break;
                    // v3.25: STAEDTE. Eine Division unter 6 Staedten ist erst ein
                    // Befund, wenn sie ueber mehrere frische Berichte nicht waechst.
                    const st = d.staedte || 0;
                    if (st < maxSt) {
                        const s = corpStaedteSerie[d.d];
                        corpStaedteSerie[d.d] = (s && s.staedte === st) ? { staedte: st, n: s.n + 1 } : { staedte: st, n: 1 };
                        const n = corpStaedteSerie[d.d].n;
                        if (n >= CORP_STAEDTE_SERIE_MIN) {
                            const krank = (d.moral || 0) < 50 || (d.energie || 0) < 50;
                            findings.push(`CORP: Division "${d.d}" steht seit ${n} Berichten unveraendert in `
                                + `${st} von ${maxSt} Staedten, obwohl CORP laeuft. ensureCities kauft je Runde `
                                + `hoechstens EINE Stadt je Division (Buero + Lager, $9 Mrd.), fuer jede Division noch `
                                + `vor der Reihum-Wahl aus dem gemeinsamen Rundenbudget - und nur, wenn JEDE einzelne `
                                + `bestehende Stadt Moral/Energie >= 50 und Personal hat. `
                                + (krank ? `Moral/Energie stehen im Schnitt bei ${d.moral}/${d.energie}. `
                                         : `Rundenbudget ${nMoney(bud)}; Moral/Energie im Schnitt ${d.moral}/${d.energie} - `
                                           + `eine EINZELNE Stadt unter 50 sperrt trotzdem (CORP meldet nur den Schnitt; `
                                           + `im CORP-Log steht dann "Staedte-Ausbau wartet"). `)
                                + `Ist die Division Vorstufe einer noch ungebauten Blaupausen-Stufe, bleibt deren `
                                + `Reifetor zu, solange Staedte fehlen (SCHWARM-CORP v0.40: prevCities.length < CITIES.length).`);
                        }
                    } else {
                        delete corpStaedteSerie[d.d];
                    }
                    // v3.25: LAGER nur fuer die Division, die dran ist - die anderen
                    // warten seit CORP v0.45 planmaessig auf ihre Runde.
                    if (dranJetzt && dranJetzt !== d.d) {
                        if ((d.wh || 0) > 0 && (d.whUsed || 0) / d.wh > 0.95) {
                            L.push(`                "${d.d}": Lager ${Math.round(100 * d.whUsed / d.wh)} % — wartet auf ihre `
                                + `Runde (dran: ${dranJetzt}, Reihum seit CORP v0.45).`);
                        }
                    } else if ((d.wh || 0) > 0 && (d.whUsed || 0) / d.wh > 0.95) {
                        findings.push(`CORP: Division "${d.d}" hat ihre Lager zu ${Math.round(100 * d.whUsed / d.wh)} % `
                            + `gefuellt (${fmtK(d.whUsed)}/${fmtK(d.wh)}). Ab 100 % stockt die Produktion — Lager vergroessern.`);
                    }
                    if ((d.empMax || 0) > 0 && (d.emp || 0) < d.empMax) {
                        findings.push(`CORP: Division "${d.d}" hat ${d.emp} von ${d.empMax} Buerplaetzen besetzt. `
                            + `Leere Plaetze kosten Miete und produzieren nichts.`);
                    }
                }
            } else if (cq.divisions > 0) {
                L.push("                (CORP < v0.37 meldet keine Kennzahlen je Division.)");
            }
            // DER BEFUND: Budget null trotz vorhandener Fonds heisst Stillstand.
            // v3.25: nur frisch. Der Zweig "Stufe ueber den Fonds" ist seit CORP
            // v0.22 unerreichbar - die Stufen-Ruecklage ist auf 50 % gedeckelt.
            if (corpFrisch && bud <= 0 && (cq.funds || 0) > 0) {
                const teile = rp ? `Unlock-Reserve ${nMoney(rp.unlock || 0)} + Betriebskapital `
                    + `${nMoney(rp.workCap || 0)}` : `Reserve ${nMoney(cq.reserve || 0)}`;
                findings.push(`CORP steht still: Rundenbudget 0, weil ${teile} die Fonds `
                    + `${nMoney(cq.funds)} aufzehren. Die Stufen-Ruecklage ist es nicht — sie ist seit CORP `
                    + `v0.22 auf 50 % der freien Fonds gedeckelt. Damit ist auch der Grossposten-Topf leer: `
                    + `kein Lager, kein Buero, keine Stadt, keine Upgrades, kein Boost.`);
            }
        }
        if (Array.isArray((last.bank || {}).blockiert)) {
            // v3.24 (BANK v5.17): nur DERSELBE Antrag, der in JEDER Probe des
            // Fensters uebersprungen wurde, ist ein Befund. Offene Antraege gibt
            // es mit zwei GANG-Antraegen und einer Spende fast immer.
            let immer = null;
            for (const smp of series) {
                const bl = ((smp.bank || {}).blockiert || []);
                const ids = new Set(bl.map(b => b.req));
                immer = immer === null ? ids : new Set([...immer].filter(x => ids.has(x)));
                if (!immer.size) break;
            }
            if (immer && immer.size && series.length >= 3) {
                const gr = ((last.bank || {}).blockiert || []).filter(b => immer.has(b.req)).map(b => `${b.req} (${b.grund})`);
                findings.push(`BANK hat ${immer.size} Antrag/Antraege im ganzen Fenster uebersprungen: ${gr.join("; ")}.`);
            }
        } else {
            const oReq = agg(s => (s.bank || {}).openMoneyReqs);
            if (oReq && oReq.min > 0) findings.push(`BANK hatte im ganzen Fenster ${oReq.min}+ offene Geldanträge — Anträge werden nicht bedient (Geld fehlt oder Freigabe hängt).`);
        }
        if ((last.lq || 0) > 0) findings.push(`Liquidations-Anforderung steht seit dem Fenster offen (${nMoney(last.lq)}) — TRADER verkauft nicht oder ist aus.`);

        // ===================================================================
        // 4b  HANDLUNGEN DER DAEMONS (v3.22)
        // ===================================================================
        // Die Engine sagt nirgends, WER etwas getan hat. Wer aus dem ZUSTAND
        // auf den URHEBER schliesst, irrt sich — am 21.09.2026 zweimal
        // hintereinander geschehen (erst "Project Insight wurde nie gekauft",
        // es stand auf Stufe 65; dann "CORP kauft also kraeftig", es war der
        // Spieler). Deshalb schreibt seit HELPERS v5.12 jeder Daemon selbst
        // auf, was er tut.
        //
        // WAS HIER NICHT STEHT, WAR NICHT DER SCHWARM.
        //
        // chronikLesen LEERT die Datei dabei — jeder Bericht enthaelt also
        // genau seinen Zeitraum, und die Datei kann nicht wachsen.
        // v3.24: Kassenbuch der Engine, Geldstand und das Leeren des Buchs im
        // SELBEN synchronen Block (kein await dazwischen) - sonst passt die
        // Differenz im Kassenbuch nicht zu den Zeilen dieses Berichts.
        let kasse = null, eintraege = [], kasseFehler = "";
        try {
            const q = ns.getMoneySources();
            const geld = ns.getPlayer().money;
            const ri = ns.getResetInfo();
            kasse = { v: 1, t: Date.now(), geld, aug: ri.lastAugReset, node: ri.lastNodeReset,
                      bn: ri.currentNode, qi: q.sinceInstall, qs: q.sinceStart };
        } catch (e) { kasseFehler = String(e); }
        try { eintraege = chronikLesen(ns, true); } catch (e) { kasseFehler = kasseFehler || String(e); }
        try {
            hr(`4b  HANDLUNGEN DER DAEMONS (seit dem letzten Bericht)`);
            if (!eintraege.length) {
                L.push("        keine — in diesem Zeitraum hat KEIN Daemon etwas protokolliert.");
                // v3.24: Hier stand "Aenderungen kamen dann vom Spieler" - ein
                // Schluss aus einer Abwesenheit auf einen Urheber. Nicht jeder
                // Kauf wird protokolliert (siehe 4c).
                L.push("        (Was trotzdem geschah, war nicht protokolliert - nicht zwingend der Spieler.)");
            } else {
                // Umkehrtabelle: Kuerzel -> Daemonname, damit der Bericht
                // lesbar bleibt und niemand die Tabelle auswendig koennen muss.
                const nachName = {};
                for (const [name, k] of Object.entries(CHRONIK_KUERZEL || {})) nachName[k] = name;
                // Zaehlung je Daemon und Ausgang — das ist die Zeile, auf die es
                // ankommt: wer war fleissig, und was ist dabei gescheitert?
                const zaehler = {};
                for (const e of eintraege) {
                    const d = nachName[e.k] || e.k;
                    zaehler[d] = zaehler[d] || {};
                    const key = `${e.art}/${e.ausgang}`;
                    zaehler[d][key] = (zaehler[d][key] || 0) + 1;
                }
                for (const d of Object.keys(zaehler).sort()) {
                    const teile = Object.entries(zaehler[d])
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, n]) => `${k} ${n}x`);
                    L.push(`        ${d.padEnd(12)} ${teile.join("  |  ")}`);
                }
                // Danach die juengsten Zeilen im Wortlaut. Mehr als 25 hilft
                // niemandem und blaeht den Bericht auf.
                L.push("");
                const zeig = eintraege.slice(-25);
                if (eintraege.length > zeig.length) {
                    L.push(`        (${eintraege.length} Handlungen, die letzten ${zeig.length}:)`);
                }
                for (const e of zeig) {
                    const d = (nachName[e.k] || e.k).padEnd(11);
                    L.push(`        ${e.zeit}  ${d} ${String(e.art).padEnd(9)} `
                        + `${String(e.woran).padEnd(26)} ${String(e.ausgang).padEnd(10)} ${e.dazu || ""}`.trimEnd());
                }
            }
        } catch (e) {
            // Eine Aufzeichnung darf den Bericht nie kosten.
            L.push(`        (Handlungsbuch nicht lesbar: ${e})`);
        }

        // ===================================================================
        // 4c  KASSE (v3.24) - maschinenlesbar, fuer kassen-pruefer.py
        // ===================================================================
        // Eine Zeile je Datensatz, Kennung vorne:
        //   #KASSE {v,t,geld,aug,node,bn}   Stand beim Leeren des Buchs
        //   #QI {...}  getMoneySources().sinceInstall   #QS {...}  sinceStart
        //   #H <Rohzeile>   JEDE Zeile des Handlungsbuchs (4b zeigt nur 25)
        // Der Pruefer rechnet je Topf: Abfluss laut Engine minus protokollierte
        // Betraege. Wer etwas gekauft hat, das NICHT protokolliert ist, sagt er
        // nicht - das Kassenbuch kennt keinen Urheber.
        try {
            hr("4c  KASSE (maschinenlesbar, fuer kassen-pruefer.py)");
            if (kasse) {
                // Nachtrag 3: seite = wann die Spielseite geladen wurde (kostet kein
                // RAM). Aendert sie sich, wurde neu geladen - Kassenbuch und
                // Geld springen auf den Spielstand zurueck, Sammelzeilen fehlen.
                let seite = null;
                try { seite = (typeof performance !== "undefined" && performance.timeOrigin) ? Math.round(performance.timeOrigin) : null; } catch (e) { seite = null; }
                kasseBlock.push("#KASSE " + JSON.stringify({ v: kasse.v, t: kasse.t, geld: kasse.geld,
                    aug: kasse.aug, node: kasse.node, bn: kasse.bn, n: eintraege.length, seite }));
                kasseBlock.push("#QI " + JSON.stringify(kasse.qi));
                kasseBlock.push("#QS " + JSON.stringify(kasse.qs));
            } else {
                kasseBlock.push("#KASSE-FEHLER " + (kasseFehler || "unbekannt"));
            }
            for (const e of eintraege) kasseBlock.push("#H " + (e.roh || ""));
            for (const z of kasseBlock) L.push(z);
        } catch (e) {
            L.push(`#KASSE-FEHLER ${e}`);
        }

        // ---------- 5 INFO-BLÖCKE ----------
        hr(`5  INFO-BLÖCKE (Port ${SCHWARM_PORTS.INFO_OUT})`);
        if (!last.inf) {
            L.push("KEIN Snapshot. Alle Konsumenten (BANK/WORK/CORP/...) laufen auf ihre Fallbacks.");
            findings.push(`INFO publiziert nichts auf Port ${SCHWARM_PORTS.INFO_OUT} — jeder Konsument macht teure Einzelabfragen oder arbeitet blind.`);
        } else {
            const iv = last.inf.iv || null;
            // v3.16: GEWICHT statt "(gross)". INFO v2.2 liefert die JSON-Laenge je
            // Block mit; ohne sie liesse sich nicht entscheiden, wo gekuerzt werden
            // soll — man wuerde am falschen Ende schneiden.
            const gew = last.inf.w || null;
            const gSum = gew && gew.SUMME > 0 ? gew.SUMME : 0;
            L.push(padR("BLOCK", 10) + padL("ALTER", 8) + padL("PLAN", 7) + padL("SOLL<", 8)
                + padR("   OK", 8) + padL("ZEICHEN", 9) + padL("ANTEIL", 8) + "  STATUS");
            L.push("-".repeat(78));
            const tNow = Date.now();
            const stale = [];
            // Nur bewerten, was INFO tatsächlich führt — keine erfundenen Blocknamen.
            for (const bn of Object.keys(last.inf.blocks || {})) {
                const b = last.inf.blocks[bn];
                const skipAge = NO_STALE_CHECK.has(bn);
                const plan = (iv && iv[bn]) ? iv[bn] : IV_FALLBACK;
                const soll = plan * STALE_TOL;
                const age = tNow - (b.ts || 0);
                const okTxt = b.ok === false ? "nein" : "ja";
                const bad = b.ok === false || (!skipAge && age > soll);
                const planTxt = (iv && iv[bn]) ? Math.round(plan / 1000) + "s" : (skipAge ? "statisch" : "—");
                const gz = gew && typeof gew[bn] === "number" && gew[bn] >= 0 ? gew[bn] : null;
                const gTxt = gz === null ? "—" : (gz >= 1000 ? (gz / 1000).toFixed(1) + "k" : String(gz));
                const aTxt = (gz !== null && gSum > 0) ? (100 * gz / gSum).toFixed(1) + "%" : "—";
                L.push(padR(bn, 10) + padL(Math.round(age / 1000) + "s", 8) + padL(planTxt, 7) +
                       padL(skipAge ? "—" : Math.round(soll / 1000) + "s", 8) + padR("   " + okTxt, 8) +
                       padL(gTxt, 9) + padL(aTxt, 8) + "  " +
                       (bad ? "STALE/AUS" + (b.err ? " " + b.err : "") : "frisch"));
                if (bad) stale.push(bn + (b.err ? "(" + b.err + ")" : "(alt)"));
            }
            if (gSum > 0) {
                L.push("-".repeat(78));
                L.push(padR("SUMME", 10) + padL("", 8) + padL("", 7) + padL("", 8) + padR("", 8)
                    + padL((gSum / 1000).toFixed(1) + "k", 9) + padL("100%", 8)
                    + "  Zeichen, die jeder Leser durchparst");
            } else {
                L.push("(INFO < v2.2 wiegt seine Bloecke nicht — Spalte ZEICHEN bleibt leer.)");
            }
            if (!iv) L.push("(INFO < v1.4 liefert keine Intervall-Tabelle — Sollwerte auf " + Math.round(IV_FALLBACK / 1000) + "s Pauschale.)");
            // FIX v1.1: der Snapshot trägt das Feld "ts" (SCHWARM-INFO setzt ts, nicht t).
            // Vorher wurde s.inf.t gelesen -> immer undefined -> die Regel meldete
            // fälschlich "INFO tickt nicht", obwohl das Logbuch frische Blöcke zeigte.
            // Zusätzlich als Gegenprobe: haben sich Block-Zeitstempel bewegt?
            const tsA = agg(s => s.inf ? Number(s.inf.ts ?? s.inf.t ?? 0) : NaN);
            const blocksMoved = (() => {
                if (series.length < 2) return true;
                const first = series[0].inf, lastS = series[series.length - 1].inf;
                if (!first || !lastS) return false;
                for (const bn of Object.keys(lastS.blocks || {})) {
                    const a2 = (first.blocks || {})[bn], b2 = lastS.blocks[bn];
                    if (a2 && b2 && (a2.ts || 0) !== (b2.ts || 0)) return true;
                }
                return false;
            })();
            if (tsA && tsA.min === tsA.max && !blocksMoved) {
                findings.push("INFO tickt nicht: weder Snapshot-Zeitstempel noch ein einziger Block hat sich im Fenster bewegt.");
            }
            if (stale.length) findings.push(`INFO-Blöcke nicht brauchbar: ${stale.join(", ")}. Konsumenten dieser Blöcke fallen auf Fallback zurück.`);
        }

        // ---------- 6 PORTS ----------
        hr("6  PORTS (peek, Rohwerte gekürzt)");
        const pk = (n) => { try { const v = ns.peek(n); return (v === "NULL PORT DATA" || v === undefined) ? "—" : String(v).slice(0, 150); } catch (e) { return "?"; } };
        // v4.0: Die Liste wird AUS DER TABELLE ERZEUGT, nicht mehr von Hand
        // gepflegt. Vorher standen die Nummern hier ein zweites Mal, und genau
        // deshalb fehlten in v2.1 acht Ports — darunter alle DARKNET-Kanaele,
        // weil die in einer eigenen Tabelle standen. Eine neue Portnummer
        // erscheint jetzt automatisch im Report; vergessen kann man sie nicht mehr.
        const portList = Object.entries(SCHWARM_PORTS)
            .sort((a, b) => a[1] - b[1])
            .map(([name, num]) => [`${num} ${name}`, num]);
        for (const [name, num] of portList) {
            if (num === undefined) continue;
            const v = pk(num);
            const isBig = num === SCHWARM_PORTS.INFO_OUT;
            L.push(padR(name, 20) + (isBig ? `(${v.length >= 150 ? "gross" : "klein"}) ` : "") + v);
        }
        L.push("Legende: ungerade Nummer = AUSGANG eines Daemons (peek, ein Schreiber),");
        L.push("         gerade = EINGANG (FIFO). 19-21 sind begruendete Ausnahmen fuer");
        L.push("         heisse Pfade, 22 ist das TOPO-Anschlagbrett.");
        L.push("Hinweis: EINGAENGE werden nur ge-peekt, nie geleert — die Diagnose greift");
        L.push("         nicht in den Betrieb ein.");

        // ---------- 7 JOBS & ARBEIT ----------
        hr("7  JOBS & ARBEIT");
        const jobs = pl && pl.jobs ? Object.entries(pl.jobs) : [];
        // currentWork-Typ vorab: entscheidet, ob der Bladeburner-Slot-Konflikt greift.
        const cwType = (() => {
            try {
                const w = last.inf && last.inf.blocks && last.inf.blocks["work"] && last.inf.blocks["work"].data
                    ? last.inf.blocks["work"].data.currentWork : null;
                return w && w.type ? String(w.type) : null;
            } catch (e) { return null; }
        })();
        L.push(`Gehaltene Jobs (${jobs.length}):`);
        if (!jobs.length) L.push("  keine");
        for (const [comp, pos] of jobs) L.push("  " + padR(comp, 26) + pos);
        // FIX v1.1: Work-Slot-Konflikt Bladeburner. Bladeburner.process() bricht JEDE
        // Aktion ab, solange Player.currentWork gesetzt ist — geprüft wird dort
        // hasAugmentation(BladesSimulacrum, true), also mit ignoreQueued=true: nur ein
        // INSTALLIERTES Aug schützt. Gekauft-aber-nicht-installiert hilft nicht. Genau
        // deshalb braucht es hier die installed-Liste (INFO liefert sie seit v1.0.3);
        // der owned-Eintrag allein würde die Frage falsch beantworten.
        // v1.4 BUGFIX: Der Aug heißt "The Blade's Simulacrum" (Enums.ts:123), nicht wie
        // der Enum-SCHLÜSSEL. Mit dem Schlüssel traf includes() nie -> DIAG meldete das
        // Aug als fehlend, obwohl es installiert war (im Overview liefen Faktionsarbeit
        // und Bladeburner-Operation sichtbar parallel). SCHWARM-WORK.js hatte den
        // richtigen String längst; ich hätte dort nachsehen müssen statt zu raten.
        const SIMULACRUM = "The Blade's Simulacrum";
        const ab2 = last.inf && last.inf.blocks ? last.inf.blocks["augs"] : null;
        const abD = ab2 && ab2.data ? ab2.data : null;
        const bbOn = (() => { try { return isDaemonEnabled(ns, "BLADEBURNER", state); } catch (e) { return false; } })();
        if (bbOn && abD) {
            const inOwned = Array.isArray(abD.owned) ? abD.owned.includes(SIMULACRUM) : false;
            const hasInst = Array.isArray(abD.installed) ? abD.installed.includes(SIMULACRUM) : null;
            if (hasInst === null) {
                L.push(`Slot-Schutz (${SIMULACRUM}): nicht entscheidbar — INFO liefert keine installed-Liste (INFO aktualisieren).`);
            } else if (hasInst) {
                L.push(`Slot-Schutz: ${SIMULACRUM} installiert — Bladeburner läuft parallel zur Spielerarbeit.`);
            } else if (inOwned) {
                L.push(`Slot-Schutz: ${SIMULACRUM} GEKAUFT, aber NICHT installiert.`);
                findings.push(`${SIMULACRUM} ist gekauft, aber nicht installiert. Die Engine prüft mit ignoreQueued=true — bis zum Aug-Reset bricht Bladeburner jede Aktion ab, solange WORK den Slot hält. Der BLADEBURNER-Daemon arbeitet bis dahin ins Leere.`);
            } else {
                L.push(`Slot-Schutz: ${SIMULACRUM} nicht vorhanden.`);
                if (cwType) {
                    findings.push(`BLADEBURNER ist an, aber ${SIMULACRUM} fehlt und der Work-Slot ist mit ${cwType} belegt — Bladeburner.process() setzt jede Aktion zurück (und schaltet die Automatik ab). Entweder das Aug beschaffen oder Bladeburner auf Sleeves legen.`);
                }
            }
        }

        const wb = last.inf && last.inf.blocks ? last.inf.blocks["work"] : null;
        const cw = wb && wb.data ? wb.data.currentWork : undefined;
        L.push(`Aktuelle Arbeit: ${cw ? JSON.stringify(cw).slice(0, 200) : (wb ? "keine (currentWork null)" : "— (work-Block fehlt)")}`);
        const inv = wb && wb.data ? wb.data.invitations : null;
        L.push(`Faktions-Einladungen: ${Array.isArray(inv) ? (inv.length ? inv.join(", ") : "keine") : "—"}`);

        // =====================================================================
        // v3.15 — FREISCHALTUNGEN UND REIFEGRAD
        // =====================================================================
        // Der Bericht fuehrte Karma und die Kampfwerte NIRGENDS. Damit war die
        // haeufigste Frage ueberhaupt — "warum geht GANGS/BLADEBURNER nicht an?"
        // — aus dem Bericht nicht zu beantworten, obwohl beide Zahlen im
        // player-Block schon dalagen.
        //
        // UND DIE UNTERSCHEIDUNG, DIE DEN UNTERSCHIED MACHT: Karma und
        // Kampfwerte sind EINTRITTSKARTEN. Ist die Gang gegruendet bzw. die
        // Division betreten, sind sie erledigt und der Wert darf wieder fallen.
        // Deshalb steht hier beides nebeneinander: die Huerde UND ob sie schon
        // genommen wurde. Ohne das liest man eine rote Zahl als Problem,
        // waehrend die Tuer laengst offen ist.
        {
            const pb = last.inf && last.inf.blocks ? last.inf.blocks["player"] : null;
            const pd = pb && pb.data ? pb.data : null;
            const gb = last.inf && last.inf.blocks ? last.inf.blocks["gang"] : null;
            const bb = last.inf && last.inf.blocks ? last.inf.blocks["blade"] : null;
            const inGang = gb && gb.data ? gb.data.member === true : null;
            const inBlade = bb && bb.data ? bb.data.inDivision === true : null;
            const sk = pd && pd.skills ? pd.skills : null;
            const km = pd && typeof pd.karma === "number" ? pd.karma : null;

            const ja = (b) => b === true ? "ja" : (b === false ? "nein" : "—");
            L.push("Freischaltungen:");
            L.push(`  Gang         gegruendet: ${ja(inGang)}`
                + `   Karma ${km === null ? "—" : Math.round(km)} / ${BEREIT_GANG_KARMA}`
                + (inGang === true ? "   (Huerde erledigt, Wert egal)"
                   : (km !== null && km > BEREIT_GANG_KARMA
                      ? `   fehlen ${Math.round(km - BEREIT_GANG_KARMA)}` : "")));
            const vier = ["strength", "defense", "dexterity", "agility"];
            const werte = sk ? vier.map(w => (typeof sk[w] === "number" ? sk[w] : "?")).join("/") : "—";
            const zuNiedrig = sk ? vier.filter(w => typeof sk[w] === "number" && sk[w] < BEREIT_BLADE_STAT) : [];
            L.push(`  Bladeburner  Division betreten: ${ja(inBlade)}`
                + `   str/def/dex/agi ${werte} (Beitritt braucht ${BEREIT_BLADE_STAT})`
                + (inBlade === true ? "   (Huerde erledigt, Werte egal)"
                   : (zuNiedrig.length ? `   zu niedrig: ${zuNiedrig.join(", ")}` : "")));

            // Und jetzt das Urteil, das ARSENAL und QUEEN tatsaechlich faellen —
            // dieselbe Funktion, nicht eine Nachbildung. Eine Nachbildung waere
            // genau die Doppelpflege, die hier schon dreimal Fehlerursache war.
            const sp = bereitSpielerInfo(ns);
            const urteil = [];
            for (const key of Object.keys(DAEMONS)) {
                let b;
                try { b = daemonBereit(ns, key, sp); } catch (e) { continue; }
                if (b === true) continue;                    // nur das Auffaellige zeigen
                // Nachtrag 1: CORP liefert in schwachen Nodes ohne Corp null, OBWOHL
                // die Daten da sind - dort entscheidet BANK nach dem Einkommen.
                let offen = false;
                if (key === "CORP" && b === null) {
                    try {
                        const bnR = last.inf && last.inf.blocks ? last.inf.blocks["bn"] : null;
                        const mR = bnR && bnR.data ? bnR.data.mults : null;
                        offen = !!(mR && typeof mR.CorporationSoftcap === "number");
                    } catch (e) { offen = false; }
                }
                urteil.push(`${key} ${b === false ? "NEIN" : (offen ? "offen (BANK gruendet nach Einkommen)" : "unbekannt")}`);
            }
            L.push(`  Reifegrad (daemonBereit): ${urteil.length ? urteil.join("  ·  ") : "alle bereit"}`);
            L.push("  Lesehilfe: NEIN = wird abgeschaltet und bleibt aus. unbekannt = Daten fehlen,");
            L.push("             der Schwarm fasst den Schalter dann NICHT an (kein Raten).");
        }

        // =====================================================================
        // v3.5 — WAS MACHEN DIE SLEEVES EIGENTLICH?
        // =====================================================================
        // Der Bericht nannte die Sleeves bisher nur an einer Stelle: "SLEEVES
        // virtuell - kein Prozess (Teil von WORK)". Was die acht Stueck TUN,
        // stand nirgends. Aufgefallen ist das, als sie ueber Stunden Shoplift
        // begingen — sichtbar war das nur im Log von WORK, und Logs sind weg,
        // sobald der Daemon neu startet.
        //
        // Der sleeves-Block von INFO liefert alles Noetige (SCHWARM-INFO.js:509-520):
        // je Sleeve shock, sync, city, skills und die laufende Aufgabe.
        {
            const slB = last.inf && last.inf.blocks ? last.inf.blocks["sleeves"] : null;
            const slD = slB && slB.data ? slB.data : null;
            const liste = slD && Array.isArray(slD.list) ? slD.list : null;

            if (!liste) {
                L.push("Sleeves: — (sleeves-Block fehlt)");
            } else if (!liste.length) {
                L.push("Sleeves: keine in dieser BitNode.");
            } else {
                // Die Aufgabe in eine Zeile bringen. Die Engine liefert je
                // Art andere Felder (SleeveCompanyWork/SleeveFactionWork/...
                // APICopy), deshalb Feld fuer Feld statt einer Formel.
                const aufgabe = (t) => {
                    if (!t || !t.type) return ["LEER", ""];
                    const ty = String(t.type);
                    if (ty === "COMPANY")     return ["FIRMA",  t.companyName || "?"];
                    if (ty === "FACTION")     return ["REP",    (t.factionName || "?")
                                                       + (t.factionWorkType ? ` (${t.factionWorkType})` : "")];
                    if (ty === "CRIME")       return ["CRIME",  t.crimeType || "?"];
                    if (ty === "CLASS")       return ["LERNEN", (t.classType || "?")
                                                       + (t.location ? ` @${t.location}` : "")];
                    if (ty === "BLADEBURNER") return ["BLADE",  (t.actionName || t.actionType || "?")];
                    if (ty === "RECOVERY")    return ["SHOCK",  "Erholung"];
                    if (ty === "SYNCHRO")     return ["SYNC",   "Synchronisation"];
                    if (ty === "INFILTRATE")  return ["INFIL",  "Synthoids"];
                    if (ty === "SUPPORT")     return ["STUETZ", "Bladeburner"];
                    return [ty, ""];
                };

                const zaehler = {};
                L.push(`Sleeves (${liste.length}):`);
                for (const s of liste) {
                    const [art, was] = aufgabe(s.task);
                    zaehler[art] = (zaehler[art] || 0) + 1;
                    const sk = s.skills || {};
                    const kampf = Math.round(((sk.strength || 0) + (sk.defense || 0)
                                            + (sk.dexterity || 0) + (sk.agility || 0)) / 4);
                    L.push("  " + padR("#" + s.i, 4)
                        + padR("shock " + nNum(s.shock || 0, 0), 10)
                        + padR("sync " + nNum(s.sync || 0, 0), 10)
                        + padR("Kampf " + kampf, 11)
                        + padR(String(s.city || "?"), 12)
                        + padR(art, 8) + was);
                }
                L.push("  Verteilung: " + Object.entries(zaehler)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => `${v}x ${k}`).join(", "));

                // BEFUND: Crime in einer BitNode, in der Verbrechen kein Geld
                // bringen. Genau das war der Zustand am 06.09. — acht Sleeves,
                // sechs davon auf Shoplift, fuer exakt $0. Die Muehe, das zu
                // bemerken, soll kuenftig der Bericht uebernehmen.
                const crimeN = zaehler["CRIME"] || 0;
                if (crimeN > 0) {
                    const cm = (() => {
                        try { return last.inf.blocks["bn"].data.mults.CrimeMoney; }
                        catch (e) { return null; }
                    })();
                    if (cm === 0) {
                        findings.push(`${crimeN} Sleeve(s) begehen Verbrechen, obwohl CrimeMoney in dieser `
                            + `BitNode 0 ist — das bringt nur Kampf-Exp und keinen Cent. `
                            + `WORK ab v5.0 setzt sie stattdessen auf Firmenarbeit (Firmen-Ruf laeuft `
                            + `voll weiter); bleibt es bei CRIME, fehlen Faktionen UND Firmen mit Job.`);
                    }
                }
                // BEFUND: ein Sleeve mit Shock 100 verdient nichts. shockBonus()
                // skaliert JEDEN Ertrag mit (100-shock)/100.
                const tot = liste.filter(s => (s.shock || 0) >= 100).length;
                if (tot > 0) {
                    findings.push(`${tot} Sleeve(s) stehen auf Shock 100 — shockBonus() skaliert jeden `
                        + `Ertrag mit (100-shock)/100, sie liefern also exakt nichts.`);
                }
            }
        }
        L.push(`Rep-Ziel (P17): ${last.repT ? `${last.repT.fac} für ${last.repT.aug || "—"} (${nNum(last.repT.have, 0)}/${nNum(last.repT.need, 0)})` : "—"}`);
        // v3.7: Export-Bonus. +1 Favor auf JEDE Mitgliedsfaktion, hoechstens alle
        // 24 h (ExportBonus.tsx). Ohne diese Zeile ist nicht zu sehen, ob WORK ihn
        // ueberhaupt abholt — und ein verpasster Tag ist unwiederbringlich.
        {
            const eb = (() => { try { return jparse(ns.peek(SCHWARM_PORTS.WORK_OUT)).exportBonus; } catch (e) { return null; } })();
            if (eb && eb.at) {
                const hSeit = (Date.now() - Number(eb.at)) / 3_600_000;
                const faellig = hSeit >= 24;
                L.push(`Export-Bonus: zuletzt vor ${hSeit.toFixed(1)} h geholt (${eb.n}x in diesem Lauf)`
                    + `${faellig ? "  — wieder faellig" : `  — naechster in ${(24 - hSeit).toFixed(1)} h`}`);
            } else {
                L.push("Export-Bonus: in diesem Lauf noch nicht geholt (+1 Favor je Faktion, alle 24 h).");
            }
        }
        L.push(`Aug-Kaufziel (P18): ${last.augBuy ? `${last.augBuy.aug} @ ${last.augBuy.faction}` : "—"}`);
        // =====================================================================
        // v2.8 — DIE WARTESCHLANGE: GEKAUFT, ABER NOCH NICHT INSTALLIERT
        // =====================================================================
        // Bisher stand hier nur das AKTUELLE Kaufziel. Was bereits gekauft ist und
        // auf den naechsten Install wartet, war nirgends zu sehen — obwohl INFO
        // beide Listen liefert:
        //     owned     = getOwnedAugmentations(true)   installiert UND gekauft
        //     installed = getOwnedAugmentations(false)  nur installiert
        // Die Differenz ist die Warteschlange. Sie ist auch die Zahl, an der
        // BANKs Reset-Bereitschaft haengt (RESET_MIN_AUGS): ohne mindestens ein
        // wartendes Aug meldet BANK bewusst keinen Install, weil er dann nichts
        // braechte und die gesamte Infrastruktur kostet.
        if (abD && Array.isArray(abD.owned) && Array.isArray(abD.installed)) {
            const inst = new Set(abD.installed);
            const NFG = "NeuroFlux Governor";
            const queued = abD.owned.filter(n => !inst.has(n));
            const echte = queued.filter(n => n !== NFG);
            const nfg = queued.length - echte.length;
            if (queued.length === 0) {
                L.push(`Gekauft, wartet auf Install: keine  (BANK meldet erst ab `
                    + `1 wartendem Aug Reset-Bereitschaft)`);
            } else {
                L.push(`Gekauft, wartet auf Install (${echte.length}${nfg ? ` + ${nfg}x NeuroFlux` : ""}):`);
                for (const n of echte) L.push(`  ${n}`);
                if (nfg) L.push(`  NeuroFlux Governor x${nfg}  (zaehlt NICHT fuer die Reset-Schwelle)`);
            }
            L.push(`Installiert insgesamt: ${abD.installed.length}`);
        }
        const workOn = (() => { try { return isDaemonEnabled(ns, "WORK", state); } catch (e) { return false; } })();
        if (workOn && jobs.length <= 1) {
            findings.push(`WORK ist an, aber es sind nur ${jobs.length} Job(s) gehalten. Player.jobs ist eine Map — mehrere Firmen gleichzeitig sind engine-seitig möglich. Prüfen, ob WORK sich überhaupt breit bewirbt (applyToCompany) oder nur bei einer Firma.`);
        }
        if (workOn && !cw) findings.push("WORK ist an, aber currentWork ist leer — es arbeitet gerade nichts (Slot frei oder Task abgebrochen).");
        // v1.3: Soll/Ist der Faktionsarbeit. BANK gibt auf Port 17 das Rep-Ziel vor;
        // arbeitet WORK für eine ANDERE Faktion, farmt es Ruf, den niemand angefordert
        // hat — und das angeforderte Ziel steht still. Die Ursache liegt entweder in
        // BANKs Auswahl (Faktion nicht beitrittsfähig/nicht Mitglied) oder in WORKs
        // eigener Rangliste, die das Ziel überstimmt.
        if (last.repT && last.repT.fac && cw) {
            const gangFac = (() => { try { const g = last.inf.blocks["gang"]; return (g && g.data && g.data.member) ? g.data.faction : null; } catch (e) { return null; } })();
            const hint = last.repT.fac === gangFac
                ? ` "${last.repT.fac}" ist die GANG-Faktion — dort lehnt die Engine workForFaction grundsätzlich ab.`
                : "";
            // v2.7: KEIN BEFUND MEHR, wenn beides FAKTIONSARBEIT ist.
            //
            // Hier stand "Rep-Ziel und Arbeit passen nicht zusammen". Das war eine
            // Fehldeutung: WORK wechselt die Faktion ABSICHTLICH. Sobald alles
            // freigeschaltet ist, was in diesem Spiellauf an Augs erreichbar ist,
            // soll der Ruf GLEICHMAESSIG ueber die Faktionen verteilt werden — das
            // hebt den Favor ueberall zugleich, und nach dem naechsten Softreset
            // faermt sich der Ruf bei allen gleichzeitig schneller.
            // Ein Wechsel je Zyklus ist damit das gewuenschte Verhalten, kein
            // Fehler. Der Befund haette nur die echten Befunde verwaessert.
            //
            // Die GANG-Faktion bleibt ein echter Fall: dort lehnt die Engine
            // workForFaction grundsaetzlich ab, das ist kein Verteilen, sondern
            // ein Ziel, das nie erreicht werden kann.
            if (cw.type === "FACTION" && cw.factionName && cw.factionName !== last.repT.fac) {
                if (hint) findings.push(`Rep-Ziel "${last.repT.fac}" ist unerreichbar.${hint}`);
            } else if (cw.type === "GRAFTING") {
                // v3.10: KEIN BEFUND, sondern eine Zustandszeile. Dieselbe
                // Fehlerklasse wie der Daedalus-Fehlalarm in v3.8: DIAG kannte
                // eine ABSICHTLICHE Mechanik nicht und meldete sie als Mangel.
                //
                // Grafting ist BANKs Arbeit, nicht WORKs. WORK gibt den Slot
                // bewusst frei — der GRAFTING-SCHUTZ (WORK v4.4) steigt aus,
                // sobald currentWork.type "GRAFTING" ist, und zwar weil ein
                // faelschlich uebernommener Slot einen laufenden Graft
                // vernichtet und damit Stunden. "Das Ziel wird nicht
                // bearbeitet" stimmt woertlich, beschreibt aber ein gewolltes
                // Nachgeben auf Zeit.
                //
                // Der Ruf laeuft danach von selbst weiter. Als der Befund
                // zuletzt auftrat, stand MegaCorp bei 1.695.941 von 1.750.000.
                L.push(`Rep-Ziel "${last.repT.fac}" ruht: BANK graftet`
                    + `${cw.augmentation ? ` "${cw.augmentation}"` : ""}`
                    + `${typeof cw.cyclesWorked === "number" ? ` (Takt ${cw.cyclesWorked})` : ""}`
                    + ` — WORK gibt den Slot absichtlich frei. Kein Fehler.`);
            } else if (cw.type !== "FACTION") {
                // v1.6: auch der Durchfall in Firma/Crime ist eine Nichterfüllung des
                // Rep-Ziels — vorher fiel dieser Fall durch die Prüfung (live: Ziel
                // "Slum Snakes" gesetzt, tatsächlich COMPANY-Arbeit bei FoodNStuff).
                findings.push(`Rep-Ziel "${last.repT.fac}" (für ${last.repT.aug || "?"}) steht, aber WORK macht ${cw.type}${cw.companyName ? " bei " + cw.companyName : ""} — das Ziel wird nicht bearbeitet.${hint}`);
            }
        }
        // FIX v1.1: Standzeit berücksichtigen. Erscheint das Kaufziel erst kurz vor
        // Fensterende, hatte der One-Shot noch keine Chance — das war im ersten
        // Livereport ein Fehlalarm (Ziel kam bei 54,2 s von 60 s).
        const augStood = series.filter(x => x.augBuy && x.augBuy.aug).length;
        // =====================================================================
        // v2.7 — "NICHT GESEHEN" IST NICHT "NICHT GELAUFEN"
        // =====================================================================
        // Der Befund behauptete eine Ursache, die die Messung gar nicht hergibt:
        // "WANT kommt nicht durch oder Queen findet keinen Host". Belegt war nur,
        // dass AUGS in keinem der 30 ps-Durchlaeufe auftauchte. AUGS ist aber ein
        // One-Shot — ein Kauf ueber Singularity und Schluss. Bei 2 s Abstand
        // zwischen den Messungen ist es reiner Zufall, ob so ein Lauf getroffen wird.
        //
        // Es gibt eine zweite Spur, und die ist belastbar: die Queen reserviert vor
        // jedem Start Speicher auf Port 19. AUGS braucht minRam + burst; taucht
        // genau dieser Betrag waehrend des Fensters neu auf, HAT die Queen den Start
        // vorbereitet — dann ist WANT angekommen und ein Host gefunden.
        //
        // Im Livebericht stand das sogar im Logbuch:
        //     15:26:13  RESERV  ... -> ...|pserv-2:37      (AUGS: 32 + 5 = 37)
        //     15:26:15  RESERV  ... -> ...                 (wieder weg)
        // Zwei Sekunden Reservierung, dazwischen lief der One-Shot. Der Befund war
        // ein Fehlalarm — die Frage ist dann nicht "warum startet er nicht", sondern
        // hoechstens "warum steht das Ziel danach noch". Auch das hat eine harmlose
        // Erklaerung: BANK waehlt aus dem INFO-Block "augs", der bis zu 360 s alt
        // sein darf, und schlaegt bis zur naechsten Auffrischung dasselbe Aug vor.
        const augNeed = (DAEMONS.AUGS && ((DAEMONS.AUGS.minRam || 0) + (DAEMONS.AUGS.burst || 0))) || 0;
        let augResSpur = null;
        if (augNeed > 0) {
            for (let i = 1; i < series.length && !augResSpur; i++) {
                const ra = series[i - 1].res || {}, rb = series[i].res || {};
                for (const h of Object.keys(rb)) {
                    const d = (Number(rb[h]) || 0) - (Number(ra[h]) || 0);
                    if (Math.abs(d - augNeed) < 1) { augResSpur = h; break; }
                }
            }
        }
        if (last.augBuy && (!seen["AUGS"] || seen["AUGS"].n === 0)) {
            if (augResSpur) {
                L.push("");
                L.push(`Hinweis: AUGS war in keinem ps-Durchlauf zu sehen, aber die Queen hat waehrend des`);
                L.push(`         Fensters ${augNeed} GB auf ${augResSpur} reserviert — genau den AUGS-Bedarf.`);
                L.push(`         Der One-Shot lief also zwischen zwei Messungen. Dass das Kaufziel danach`);
                L.push(`         noch steht, ist normal: BANK liest den INFO-Block "augs", der bis zu 360 s`);
                L.push(`         alt sein darf, und schlaegt bis zur Auffrischung dasselbe Aug vor.`);
            } else if (augStood >= Math.max(3, series.length * 0.5)) {
                findings.push(`Auf Port 18 steht seit ${augStood}/${series.length} Samples ein Aug-Kaufziel, aber der AUGS-One-Shot lief nie — WANT kommt nicht durch oder Queen findet keinen Host. (Auch keine Reservierung ueber ${augNeed} GB im Fenster, die Queen hat also gar nicht erst angesetzt.)`);
            } else {
                L.push("");
                L.push(`Hinweis: Aug-Kaufziel stand erst ${augStood}/${series.length} Samples — zu kurz für ein Urteil über AUGS.`);
            }
        }

        // ---------- 4b BACKDOOR ----------
        // Diese Auswertung fehlte bis v2.1 KOMPLETT. `backdoorPending` liegt seit
        // Dispatcher v9 im Snapshot; niemand hat es gelesen. Deshalb blieb der
        // Gate-Fehler (Payload wurde NIE gestartet, behoben in Dispatcher v10.4)
        // monatelang unbemerkt, obwohl die Zahl die ganze Zeit im Port stand.
        const bd = {
            pend: last.disp && last.disp.backdoorPending !== undefined ? last.disp.backdoorPending : null,
            // v4.0 RAM-FALLE BEHOBEN. Dieses Feld hiess frueher wie die
            // ns-Funktion zum Starten von Skripten. Die RAM-Analyse walkt bei
            // jedem Property-Zugriff node.property (RamCalculations.ts,
            // MemberExpression) und schlaegt den Namen in der Kostentabelle
            // nach - EGAL auf welchem Objekt er steht. DIAG bezahlte dadurch
            // 1,00 GB fuer eine Funktion, die es nie aufruft; bei rund 2,7 GB
            // Eigenbedarf ist das ueber ein Drittel. Genau der Merksatz aus
            // dem Kopf von SCHWARM-HELPERS.
            laufend: last.disp && last.disp.backdoorRunning !== undefined ? last.disp.backdoorRunning : null,
            started: last.disp && last.disp.backdoorStarted !== undefined ? last.disp.backdoorStarted : null,
            targets: last.pr.bdT || [],
        };
        L.push("");
        L.push("== 4b BACKDOOR " + "=".repeat(61));
        if (bd.pend === null) {
            L.push("Dispatcher meldet keine Backdoor-Zahlen (< v10.4) — nicht bewertbar.");
        } else {
            L.push(`offene Ziele ${bd.pend}   laufende Worker ${bd.laufend ?? "—"}`
                + `   in dieser Dispatcher-Instanz gestartet ${bd.started ?? "—"}`);
            if (bd.targets.length) L.push(`laeuft auf: ${bd.targets.join(" ")}`);
            // Verlauf: hielt sich "offen > 0 bei 0 laufenden" ueber das GANZE Fenster?
            // Ein einzelnes Sample wuerde die Luecke zwischen zwei Slow-Takten (16 s)
            // als Fehler melden — deshalb wird die ganze Serie geprueft.
            const withNums = series.filter(x => x.disp && x.disp.backdoorPending !== undefined);
            const idle = withNums.filter(x => x.disp.backdoorPending > 0 && (x.disp.backdoorRunning || 0) === 0);
            if (withNums.length >= 3 && idle.length === withNums.length) {
                findings.push(`${bd.pend} Server sind backdoor-faehig, aber im GANZEN Messfenster lief `
                    + `kein einziger Worker. Pruefen: Schalter BACKDOOR auf 0? SF4 vorhanden? `
                    + `RAM fuer ${nGb(8)} frei? (Bis Dispatcher v10.3 war das ein Gate-Fehler: `
                    + `isDaemonEnabled liefert fuer triggered-Daemons ohne State-Eintrag false.)`);
            } else if (bd.pend > 0 && (bd.laufend || 0) === 0) {
                L.push("gerade kein Worker aktiv — normal zwischen zwei Slow-Takten (16 s).");
            }
        }

        // ---------- 4d KURSBEEINFLUSSUNG ----------
        // Stellt SOLL (Port 34, TRADER) und IST (Dispatcher) gegenueber. Ohne die
        // Trennung waere nicht entscheidbar, ob keine Position gehalten wird, kein
        // Server passt oder schlicht das RAM fehlt.
        L.push("");
        L.push("== 4d KURSBEEINFLUSSUNG " + "=".repeat(52));
        {
            const md = last.disp ? last.disp.manipDiag : null;
            const mt = (last.disp && Array.isArray(last.disp.manipTargets)) ? last.disp.manipTargets : [];
            // v4.0: aus dem Ausgang des TRADERs (Feld manip). Frueher Port 34 —
            // dieselbe Nummer, die DARKNET fuer seine Auftraege benutzte; die
            // Ziele kamen deshalb beim Dispatcher nie zuverlaessig an.
            const traderOut = readOut(ns, SCHWARM_PORTS.TRADER_OUT);
            const p34 = Array.isArray(traderOut.manip) ? traderOut.manip : null;
            const mgb = (last.disp && last.disp.used) ? (last.disp.used.manip || 0) : 0;

            if (p34 === null) {
                L.push("TRADER meldet keine Beeinflussungsziele — Trader laeuft nicht.");
            } else if (!Array.isArray(p34) || p34.length === 0) {
                // v2.8: DREI FAELLE STATT EINEM.
                //
                // Hier stand pauschal "Trader haelt keine Position". Das war falsch,
                // sobald der Trader zwar Papiere haelt, der Dispatcher sie aber nicht
                // bedienen kann — und genau das ist bei niedrigem Hacking-Level der
                // Regelfall, weil die Konzern-Server dann nicht gerootet sind.
                // Live nachweisbar: die Zeile stand im Bericht, waehrend zwei
                // Abschnitte hoeher "Portfolio(P26): $929,60m" gemeldet wurde.
                const pv = Number(last.pv) || 0;
                const okList = (last.disp && Array.isArray(last.disp.manipOk)) ? last.disp.manipOk : null;
                if (pv > 0) {
                    L.push(`Trader haelt Positionen (${nMoney(pv)}), aber KEINE davon ist beeinflussbar.`);
                    L.push(`Der Dispatcher meldet ${okList === null ? "keine" : okList.length} bedienbare Organisation(en)`
                        + " — beeinflussbar ist nur, wessen Server gerootet ist und dessen");
                    L.push("Level-Anforderung erfuellt ist. Bei niedrigem Hacking-Level ist das normal.");
                } else {
                    L.push("Trader haelt keine Position -> nichts zu beeinflussen. Das ist korrekt:");
                    L.push("eine Beeinflussung ohne Position waere eine Wette auf ~500 Impulse Vorlauf.");
                }
            } else {
                L.push("SOLL (Trader):          " + p34.map(x => `${x.org}:${x.dir}`).join("  "));
                if (mt.length) {
                    L.push("IST  (Dispatcher):      " + mt.map(x => `${x.h}(${x.d}, ${x.r} Impulse/min)`).join("  "));
                } else {
                    L.push("IST  (Dispatcher):      KEIN Server zugeordnet.");
                    L.push("                        Moegliche Gruende: Hacking-Level zu niedrig,");
                    L.push("                        kein Root, oder Organisation ohne Server-Pendant.");
                }
                L.push(`Klasse "manip": ${nGb(mgb)}`);
                if (md) {
                    L.push(`Impuls-Aufrufe im letzten Takt: ${md.calls}   (${nGb(md.gb)})`);
                    if (md.rate > 0) {
                        // Stock.ts:154-161 — Schrittweite 0.1 auf einer 0-100-Skala.
                        L.push(`Richtwert: ~500 Impulse von neutral bis maximal. Bei ${md.rate} Aufrufen/min`);
                        L.push(`           auf ${md.top} sind das rund ${Math.round(500 / Math.max(1, md.rate))} min je Ziel`);
                        L.push(`           (ohne Trefferquote — je Aufruf trifft er mit p = Zuwachs/moneyMax).`);
                    }
                }
            }
            if (Array.isArray(p34) && p34.length > 0 && mt.length === 0) {
                findings.push(`TRADER meldet ${p34.length} Beeinflussungsziel(e), der Dispatcher findet `
                    + `dafuer keinen Server. Pruefen: Hacking-Level, Root-Rechte, oder ob die `
                    + `Organisation ueberhaupt einen Server im Netz hat.`);
            }
            // =================================================================
            // v3.3 — "manip 0 GB" IST BEI HOHEM LEVEL EIN MESSARTEFAKT
            // =================================================================
            // Dieser Befund stand vier Lagebilder in Folge, obwohl die Stufe
            // nachweislich arbeitete: dieselben Berichte meldeten
            //     "IST (Dispatcher): megacorp(up, 157.5 Impulse/min)"
            // Beides zugleich kann nur eines heissen: die Worker LAUFEN, sie
            // sind nur nie da, wenn jemand hinsieht.
            //
            // Genau dieselbe Falle wie frueher bei den XP-Workern. Bei
            // Hacking-Level 25.000 dauert ein weaken 0,08 s, ein grow und ein
            // hack entsprechend weniger — ein manip-Worker lebt einige
            // Dutzend Millisekunden. Der Dispatcher misst einmal je Takt
            // (2000 ms), trifft ihn also mit wenigen Prozent Wahrscheinlichkeit.
            // "0 GB belegt" ist dann kein Platzmangel, sondern eine Momentaufnahme
            // zwischen zwei Aufrufen.
            //
            // Belastbar ist nicht der Bestand, sondern der DURCHSATZ: md.rate
            // (Impulse je Minute) und md.calls (Aufrufe im letzten Takt) zaehlen
            // abgeschlossene Arbeit statt laufender Prozesse. Nur wenn AUCH die
            // null sind, steht die Stufe wirklich still.
            const manipRate = md ? Number(md.rate) || 0 : 0;
            const manipTop = mt.length ? Math.max(...mt.map(x => Number(x.r) || 0)) : 0;
            const manipLaeuft = manipRate > 0 || manipTop > 0 || (md ? Number(md.calls) > 0 : false);
            if (Array.isArray(p34) && p34.length > 0 && mt.length > 0 && mgb === 0 && manipLaeuft) {
                L.push("");
                L.push(`Hinweis: Klasse "manip" zeigt 0 GB, die Stufe arbeitet aber (${manipTop || manipRate}`
                    + ` Impulse/min). Bei dieser Hacking-Geschwindigkeit leben die Worker nur`);
                L.push("         Millisekunden — eine Messung je Takt trifft sie fast nie. Kein Fehler.");
            } else if (Array.isArray(p34) && p34.length > 0 && mt.length > 0 && mgb === 0 && !manipLaeuft) {
                findings.push("Beeinflussungsziele stehen und Server sind zugeordnet, aber die Klasse "
                    + "\"manip\" hat 0 GB UND es laeuft kein einziger Impuls (weder im letzten Takt "
                    + "noch als Rate). Die Stufe bekommt wirklich keinen Platz oder faellt vorher "
                    + "durch ein Gate — Budget core, manipTargets oder der Pool-Anteil.");
            }
        }

        // ---------- 4e DARKNET ----------
        // NEU (v2.7). DIAG hatte fuer das Darknet bisher NUR die Rohzeile in der
        // Port-Tabelle — bei einem Subsystem mit Roamern, Knack-Ops, Phishing,
        // Promoter und Labyrinth deutlich zu wenig, um zu sehen, wo es klemmt.
        //
        // Quelle ist DNET_OUT.status (peek, 0 GB), also der Snapshot, den der
        // DARKNET-Daemon ohnehin je Runde schreibt.
        L.push("");
        L.push("== 4e DARKNET " + "=".repeat(62));
        {
            let st = "";
            try { st = String((jparse(ns.peek(SCHWARM_PORTS.DNET_OUT)) || {}).status || ""); }
            catch (e) { st = ""; }
            if (!st || st.indexOf("DARKNET") !== 0) {
                L.push("  kein Status — DARKNET laeuft nicht oder hat noch nichts gemeldet.");
            } else {
                const kv = {};
                for (const part of st.split("|")) {
                    const eq = part.indexOf("=");
                    if (eq > 0) kv[part.slice(0, eq)] = part.slice(eq + 1);
                }
                const g = (k, d) => (kv[k] === undefined ? (d === undefined ? "—" : d) : kv[k]);
                // "alive" = Server mit laufendem ROAMER-Prozess (aus ps).
                // "roamers" = Server, die sich beim Daemon GEMELDET haben.
                // alive > roamers ist normal und kein Fehler: ein frisch besiedelter
                // Server laeuft schon, bevor seine erste Meldung ankommt. Deshalb
                // beide getrennt benennen statt als Bruch zu schreiben — als
                // "38/21" gelesen sah es nach einer kaputten Quote aus.
                // v2.8: KUMULATIVE ZAEHLER ALS SOLCHE BESCHRIFTEN.
                // "gemeldet 545" neben "Karte 52" und "geknackt 15454" neben
                // 51 bekannten Servern las sich wie ein Widerspruch — beide Zahlen
                // sind aber Gesamtsummen seit dem Start, die nie zurueckgesetzt
                // werden, waehrend alles daneben eine Momentaufnahme ist.
                L.push(`  JETZT    Roamer ${g("alive")}   Abdeckung ${g("coverage")}   `
                    + `Ops ${g("ops")}   offen ${g("pending")}   Karte ${g("mapped")}`);
                L.push(`  SEIT START  gemeldet ${g("roamers")}   geknackt ${g("cracked")}   `
                    + `Caches ${g("caches")}`);
                L.push(`  Sturm ${g("storm")}`);
                L.push(`  wartet auf Passwort ${g("needpw")}   ungeloest ${g("todo")}   `
                    + `Grossblock ${g("bigblock")}   gesperrt ${g("gated")}`);
                if (kv.labhost !== undefined || kv.lab !== undefined) {
                    L.push(`  Labyrinth ${g("lab", g("labhost"))} [${g("labstate")}] `
                        + `Pos ${g("labpos")}  bekannt ${g("labknown")}  Zuege ${g("labmoves")}  `
                        + `geloest ${g("labsolved")}`);
                }
                // v3.8: WARUM ist ein Rueckmelde-Loeser gescheitert? Der Grund kommt
                // seit DARKNET v4.5 aus dem Loeser selbst (fbwhy). Er beantwortet die
                // Frage, die der Befund "gibt auf, ohne zu antworten" bisher nur
                // gestellt hat — an welcher der Ruecksprungstellen es endet.
                // v3.2: DARKNET v4.5 meldet den Grund JE RUECKMELDEART, mit ";;"
                // getrennt. Vorher kam nur EIN Grund ueber alle Modelle — und
                // damit stand der des interessanten Modells praktisch nie da.
                if (kv.fbwhy) {
                    const gruende = String(kv.fbwhy).split(";;").map(s => s.trim()).filter(Boolean);
                    if (gruende.length === 1) {
                        L.push(`  Rueckmelde-Abbruch: ${gruende[0]}`);
                    } else if (gruende.length > 1) {
                        L.push(`  Rueckmelde-Abbrueche (je Art, zuletzt):`);
                        for (const g of gruende) L.push(`    ${g}`);
                    }
                }
                // Phishing-Vorrang: sagt der Daemon dem Roamer, dass Charisma hier
                // wertvoller ist als Geld? (BitNodes ohne Darknet-Geld, z.B. BN8.)
                if (kv.phishprio !== undefined) {
                    L.push(`  Phishing-Vorrang: ${kv.phishprio === "1"
                        ? "JA — kein Darknet-Geld in dieser BitNode, Ertrag ist Charisma-XP"
                        : "nein — Phishing laeuft nachrangig"}`);
                }

                // --- Raetsel-Statistik je Modell -------------------------------
                // Die Erkennung ist exakt (crack() schaltet auf modelId aus
                // getServerDetails). Interessant ist deshalb nicht, WAS erkannt
                // wird, sondern was TEUER ist:
                //   feedback = Rueckmelde-Raetsel, Raten mit Rueckmeldung
                //   todo     = Hint nicht geparst -> gezielt behebbare Loeser-Luecke
                //   Ø Vers.  = Versuche je Lauf, der beste Hinweis auf den Aufwand
                const models = g("models", "-");
                if (models && models !== "-") {
                    L.push("");
                    L.push("  RAETSEL JE MODELL (ok / fehl / todo / feedback / Ø Versuche)");
                    L.push("  " + "-".repeat(70));
                    for (const row of models.split(",")) {
                        const c = row.split(":");
                        if (c.length < 2) continue;
                        const z = String(c[1]).split("/");
                        const [ok, fail, td, fb, avg] = [z[0] || "0", z[1] || "0", z[2] || "0", z[3] || "0", z[4] || "0"];
                        const n = Number(ok) + Number(fail) + Number(td) + Number(fb);
                        const quote = n > 0 ? Math.round((Number(ok) / n) * 100) + "%" : "—";
                        L.push(`  ${String(c[0]).padEnd(30)} ${String(ok).padStart(4)} ${String(fail).padStart(5)} `
                            + `${String(td).padStart(5)} ${String(fb).padStart(9)} ${String(avg).padStart(7)}   ${quote}`);
                        // Ein Modell, das nur ueber todo scheitert, ist eine LUECKE im
                        // Loeser — der Hint kam an, wurde aber nicht verstanden. Das ist
                        // die billigste Stelle zum Nachbessern, deshalb als Befund.
                        if (Number(td) > 0 && Number(ok) === 0) {
                            findings.push(`Raetselmodell "${c[0]}" wurde ${td}x nicht geloest, weil der Hinweis `
                                + `nicht ausgewertet werden konnte (todo) — und noch nie erfolgreich. `
                                + `Das ist eine Luecke im Loeser, kein Rate-Problem.`);
                        }
                        // v2.7.1: derselbe Fall ueber den FEEDBACK-Pfad. Den hatte
                        // die erste Fassung uebersehen — sie fragte nur nach todo.
                        // Unterschied: bei todo kam der Hinweis an und wurde nicht
                        // verstanden (Loeser-Luecke), bei feedback laeuft ein
                        // Rate-Rueckmeldungs-Spiel, das nicht konvergiert. Beides
                        // ist behebbar, aber an verschiedenen Stellen — deshalb
                        // getrennte Formulierung statt eines Sammelbefunds.
                        // v2.9: MINDEST-STICHPROBE. Die erste Fassung feuerte schon
                        // bei fb=1 und ok=0 — im Livereport genau so passiert, kurz
                        // nach einem DARKNET-Neustart (die Statistik liegt im
                        // Speicher und faengt dann bei null an). Zwei Zyklen spaeter
                        // stand dasselbe Modell bei 6 Erfolgen und 86 %.
                        // Ein einzelner Fehlversuch ist kein Befund, sondern Rauschen.
                        if (Number(fb) >= 3 && Number(ok) === 0) {
                            findings.push(`Raetselmodell "${c[0]}": ${fb} Rueckmelde-Versuche, kein einziger Erfolg `
                                + `(Ø ${avg} Versuche). Die Erkennung stimmt — das Ratespiel konvergiert nicht.`);
                        }
                        // v3.0: BEIDE Regeln oben verlangen ok === 0. Ein Modell mit
                        // ein paar Erfolgen konnte deshalb strukturell nie auffallen,
                        // egal wie schlecht es lief — im Livereport stand MathML mit
                        // 9 Erfolgen zu 98 Fehlschlaegen (8 %) in der Tabelle, und die
                        // Befundliste blieb still. Die Spalte "fehl" wurde bis hier in
                        // keiner einzigen Bedingung gelesen, nur gedruckt.
                        //
                        // Kein Deckel auf die Ø-Versuchszahl: die waere ein
                        // Falschalarm-Automat. DARKNET fuehrt Modelle mit
                        // Buendel-Orakel (Mastermind, Divisibility, Maxima ...), fuer
                        // die dreistellige Versuchszahlen der geplante Normalfall
                        // sind — Factori-Os etwa erwartet 80. Eine feste Schwelle
                        // wuerde ein Dutzend gesunder Modelle dauerhaft anschwaerzen.
                        // Die Erfolgsquote dagegen sagt bei JEDEM Modell dasselbe.
                        const nOk = Number(ok);
                        const schonGemeldet = (Number(td) > 0 && nOk === 0) || (Number(fb) >= 3 && nOk === 0);
                        if (n >= 20 && (nOk / n) < 0.5 && !schonGemeldet) {
                            // =================================================
                            // v3.3 — ZWEI KRANKHEITEN, ZWEI DIAGNOSEN
                            // =================================================
                            // "defekter Loeser-Zweig" warf bisher zwei gegensaetzliche
                            // Faelle in einen Topf, und die Behandlung ist jeweils die
                            // andere:
                            //   VIELE Fehlschlaege -> der Loeser ANTWORTET, aber falsch.
                            //     Die Logik stimmt nicht (Livebeleg: "PHP 5.4",
                            //     36 Fehlschlaege bei 6 Treffern).
                            //   KEINE Fehlschlaege -> der Loeser gibt AUF, ohne zu
                            //     antworten; die Laeufe enden als todo/feedback
                            //     (Livebeleg: "Factori-Os", 0 Fehlschlaege bei
                            //     5 Treffern von 28 Laeufen). Das ist ein Budget-,
                            //     Charisma- oder Abbruchproblem, keine falsche Formel.
                            // Wer beides gleich meldet, sucht an der falschen Stelle.
                            const nFail = Number(fail) || 0;
                            const stumm = n - nOk - nFail;      // weder geloest noch falsch beantwortet
                            let art;
                            if (nFail > nOk) {
                                art = `Der Loeser ANTWORTET, aber falsch (${nFail} Fehlschlaege gegen `
                                    + `${ok} Treffer) — die Rechenvorschrift stimmt nicht.`;
                            } else if (stumm > nOk) {
                                art = `Der Loeser wird nicht FERTIG: ${stumm} von ${n} Laeufen enden `
                                    + `ungeloest (${nFail} falsche Antworten). Kein Formelfehler — meist `
                                    + `Zeitdeckel oder Abbruch; den Grund zeigt "Rueckmelde-Abbrueche".`;
                            } else {
                                art = `${nFail} Fehlschlaege, ${stumm} Abbrueche ohne Versuch.`;
                            }
                            findings.push(`Raetselmodell "${c[0]}": nur ${ok} von ${n} Laeufen geloest `
                                + `(${quote}). ${art}`);
                        }
                    }
                } else {
                    L.push("  Raetsel-Statistik: noch keine Laeufe erfasst.");
                }
            }
        }

        // ---------- 4h STANEK ----------
        // NEU (v2.9). STANEK laeuft genau EINMAL je BitNode-Durchlauf und beendet
        // sich danach — im Logbuch steht dann nur "PROZESS - STANEK beendet", ohne
        // ein Wort dazu, ob es geklappt hat. Der Ausgang auf Port 25 ist die
        // einzige Spur, und die stand bisher nur als Rohzeile in der Port-Tabelle.
        L.push("");
        L.push("== 4h STANEK " + "=".repeat(63));
        {
            const st = jparse(ns.peek(SCHWARM_PORTS.STANEK_OUT));
            if (!st || !st.state) {
                L.push("  keine Meldung — STANEK lief in diesem Durchlauf noch nicht.");
                L.push("  Er wird von ARSENAL angefordert, bevor die Queen startet.");
            } else {
                const alter = st.ts ? Math.round((Date.now() - st.ts) / 1000) : null;
                L.push(`  Zustand: ${st.state}${alter === null ? "" : `   (${alter} s alt)`}`);
                if (st.state === "gesperrt") {
                    L.push(`  Grund: ${st.grund || "—"}`);
                    L.push("  Das ist ENDGUELTIG fuer diese BitNode: prestigeAugmentation() leert nur");
                    L.push("  queuedAugmentations, installierte Augs bleiben. Erst prestigeSourceFile()");
                    L.push("  (BitNode-Wechsel) setzt augmentations zurueck — ein Aug-Reset also NICHT.");
                } else if (st.state === "zu_wenig_ram") {
                    L.push("  Kein Server hatte genug freien Speicher fuer den Ladeprozess.");
                    L.push("  Der Lader kostet 2 GB je Thread und muss als EIN Prozess auf EINEM");
                    L.push("  Server laufen — die Engine liest die Threadzahl genau dieses Prozesses,");
                    L.push("  Aufteilen bringt also nichts. Registry-Eintrag STANEK.minRam pruefen.");
                    findings.push("STANEK konnte nicht laden: kein Server mit genug freiem Speicher fuer den "
                        + "Ladeprozess. Der Effekt jedes Fragments haengt ueber ln(Threads+1) an der Threadzahl "
                        + "des ladenden Prozesses; ohne Ladung sind alle Fragmente wirkungslos.");
                } else if (st.state === "fehler" || st.state === "haengt" || st.state === "abgebrochen") {
                    L.push(`  Grund: ${st.grund || "—"}`);
                    findings.push(`STANEK ist im Zustand "${st.state}" stehengeblieben (${st.grund || "ohne Grundangabe"}). `
                        + `Ohne abgeschlossene Ladung bleiben die Fragmente auf dem Minimaleffekt.`);
                } else {
                    // v3.0: der Bericht zeigt jetzt, was die Fragmente WIRKLICH bringen.
                    // Vorher stand hier nur ihre Anzahl — und genau deshalb ist ein Jahr
                    // lang nicht aufgefallen, dass alle auf +2,8 % festhingen.
                    L.push(`  Gitter ${st.gitter || "?"}   Ladehost ${st.host || "?"}   `
                        + `${st.threads || "?"} Threads x ${st.cores || 1} Cores (Faktor ${st.coreBonus || 1})`);
                    L.push(`  Ladung ${st.min === null || st.min === undefined ? "—" : st.min} / ${st.ziel}`
                        + `   Threadstaerke ${st.threadStaerke === undefined ? "?" : st.threadStaerke}`
                        + `   Verstaerker ${st.verstaerker === undefined ? "?" : st.verstaerker}`
                        + (st.sekunden === undefined ? "" : `   ${st.sekunden} s`));
                    if (Array.isArray(st.fragmente) && st.fragmente.length) {
                        for (const f of st.fragmente) {
                            const pct = (typeof f.effekt === "number") ? `+${((f.effekt - 1) * 100).toFixed(1)} %` : "?";
                            L.push(`    ${String(f.name || "?").padEnd(16)} Power ${String(f.power).padEnd(4)} `
                                + `Ladung ${String(f.ladung).padStart(6)}   ${pct}`);
                        }
                    }
                    // Der Befund, der v1.0 sofort aufgedeckt haette: highestCharge ist die
                    // hoechste je benutzte Threadzahl (StaneksGift.charge). Steht sie auf 1,
                    // hat ein Prozess mit EINEM Thread geladen — der Effekt liegt dann auf
                    // ln(2)/60, dem absoluten Minimum, egal wie oft geladen wurde.
                    const hs = Number(st.threadStaerke);
                    if (isFinite(hs) && hs > 0 && hs < 8) {
                        findings.push(`STANEK laedt mit Threadstaerke ${hs}. Der Fragmenteffekt haengt ueber `
                            + `ln(Threadstaerke+1)/60 daran: bei 1 sind das 0.0116, bei 512 dagegen 0.104 — `
                            + `Faktor 9 auf JEDES Fragment. Vermutlich laeuft noch der alte Payload im `
                            + `Speicher; STANEK neu starten, damit der eigene Ladeprozess greift.`);
                    }
                    // v3.0: STANEK laeuft frueh, wenn der Pool noch klein ist —
                    // live gemessen 42 Threads auf einem pserv, weil home und die
                    // Server damals voll waren. Spaeter steht ein Vielfaches
                    // bereit, aber der One-Shot ist laengst beendet und schaltet
                    // sich selbst ab; von allein holt er das nie nach.
                    //
                    // Nachladen mit MEHR Threads lohnt fast immer: die Engine
                    // skaliert numCharge zwar nach unten (numCharge =
                    // highestCharge*numCharge/threads + 1), aber numCharge steht
                    // mit Exponent 0.07 in der Formel und die Threadzahl im
                    // Logarithmus. Von 42 auf 512 sind das rund 40 % mehr Effekt
                    // auf JEDES Fragment, sofort und dauerhaft.
                    else if (isFinite(hs) && hs >= 8) {
                        // =====================================================
                        // v2.8 — DIESELBE RECHNUNG WIE QUEEN UND STANEK
                        // =====================================================
                        // Hier stand die POOLSUMME (freiGb * 0.75 / 2). Das ist
                        // dieselbe falsche Bezugsgroesse, die die Queen bis v6.8
                        // benutzt hat: die Ladestaerke ist die Threadzahl EINES
                        // Skripts auf EINEM Host (Stanek.ts:53). Der Pool als
                        // Ganzes laesst sich dafuer nicht zusammenlegen.
                        //
                        // Solange DIAG weiter poolweit rechnet, empfiehlt es
                        // einen Neustart, der nichts bringt — und der Nutzer
                        // haelt den Schwarm fuer defekt, obwohl er richtig
                        // ablehnt. Also dieselbe Formel, dieselbe Hostmenge.
                        //
                        // Auf Hacknet-Servern gelten die exklusiven Grenzen: der
                        // Dispatcher nimmt STANEKs Ladehost seit v11.8 ganz aus
                        // der Nutzung (8 GB Reserve, 98 % Anteil statt 64/75 %).
                        // Kandidaten wie im Payload: home, gekaufte Server,
                        // Hacknet-Server. Aufgezaehlt ueber die Namenskonvention,
                        // damit hier keine zusaetzliche API noetig wird.
                        const kand = ["home"];
                        for (let i = 0; i < 64; i++) {
                            let da = false;
                            try { da = !!ns.getServer("pserv-" + i); } catch (e) { da = false; }
                            if (!da) break;
                            kand.push("pserv-" + i);
                        }
                        for (let i = 0; i < 64; i++) {
                            let da = false;
                            try { da = !!ns.getServer("hacknet-server-" + i); } catch (e) { da = false; }
                            if (!da) break;
                            kand.push("hacknet-server-" + i);
                        }
                        let moeglich = 0, bester = "";
                        for (const h of kand) {
                            let sv = null;
                            try { sv = ns.getServer(h); } catch (e) { continue; }
                            if (!sv) continue;
                            const maxR = sv.maxRam || 0;
                            const freeR = maxR - (sv.ramUsed || 0);
                            const exkl = h.startsWith("hacknet-server-");
                            const budget = Math.min(freeR - (exkl ? 8 : 64),
                                maxR * (exkl ? 0.98 : 0.75));
                            const thr = Math.min(32768, Math.floor(Math.max(0, budget) / 2.0));
                            if (thr < 8) continue;
                            const cores = sv.cpuCores || 1;
                            const eff = Math.floor(thr * (1 + (cores - 1) / 16));
                            if (eff > moeglich) { moeglich = eff; bester = h; }
                        }
                        if (moeglich >= hs * 3 && moeglich >= 64) {
                            const alt = Math.log(hs + 1) / 60;
                            const neu = Math.log(moeglich + 1) / 60;
                            findings.push(`STANEK laedt mit Threadstaerke ${hs}. Bester EINZELHOST `
                                + `${bester} gaebe ${moeglich} Threads — der Pool als Ganzes zaehlt hier `
                                + `nicht, die Ladestaerke ist die Threadzahl eines Skripts auf einem Host. `
                                + `Der Effekt je Fragment haengt an ln(Threads+1): `
                                + `${(alt * 100).toFixed(2)} gegen ${(neu * 100).toFixed(2)} — `
                                + `etwa ${Math.round((neu / alt - 1) * 100)} % mehr auf JEDES Fragment.`);
                        }
                    }
                }
            }
        }

        // ---------- 4g GANG ----------
        // NEU (v2.8). Die Gang stand ueber Stunden bei 9 Mitgliedern, ohne dass der
        // Bericht den Grund zeigte: Mitglieder auf "Territory Warfare" verdienen
        // laut data/tasks.ts weder Respekt noch Geld (der Task hat kein baseRespect
        // und kein baseMoney), und die Rekrutierungsschwelle ist 5^(Mitglieder-3+1).
        // Sichtbar war davon nichts — GANG_OUT meldete nur Territorium und Power.
        L.push("");
        L.push("== 4g GANG " + "=".repeat(65));
        {
            const gi = jparse(ns.peek(SCHWARM_PORTS.GANG_OUT));
            if (!gi || typeof gi !== "object" || gi.members === undefined) {
                L.push("  keine Daten — GANGS laeuft nicht oder hat noch nichts gemeldet.");
            } else {
                const alter = gi.ts ? Math.round((Date.now() - gi.ts) / 1000) : null;
                const rr = Number(gi.respectRate);
                const need = Number(gi.respectNext);
                const have = Number(gi.respect);
                L.push(`  Mitglieder ${gi.members}   Territorium ${((Number(gi.territory) || 0) * 100).toFixed(1)} %   `
                    + `Power ${nNum(Number(gi.power) || 0, 0)}   Clash ${gi.engaged ? "AN" : "aus"}`
                    + (alter === null ? "" : `   (${alter} s alt)`));
                // v3.0: Bei voller Gang liefert die Engine respectForNextRecruit
                // null (GangConstants.MaximumGangMembers = 12). Der alte Zweig
                // rechnete daraus "Respekt 7.002.693 / 0 ... ETA 0 min" — eine
                // Zahl, die nichts bedeutet und wie ein Fehler aussieht.
                if (Number(gi.members) >= 12 || gi.respectNext === null) {
                    L.push(`  Gang ist voll (${gi.members}/12) — keine Rekrutierung mehr moeglich.   `
                        + `Respekt ${nNum(have, 0)}   Rate ${isFinite(rr) ? rr.toFixed(2) : "?"}/Cycle`);
                } else if (isFinite(need) && isFinite(have)) {
                    const rest = Math.max(0, need - have);
                    // Bei Respekt-Rate 0 waere die ETA unendlich — das ist genau der
                    // Zustand, den der Befund unten meldet, also hier kein "Infinity".
                    // Rate ist je Cycle, ein Cycle sind 200 ms (CONSTANTS.MilliPerCycle).
                    const etaMin = (isFinite(rr) && rr > 0) ? (rest / rr) * 200 / 60000 : Infinity;
                    const eta = !isFinite(etaMin) ? "nie"
                        : etaMin < 60 ? Math.round(etaMin) + " min"
                        : Math.round(etaMin / 60) + " h";
                    L.push(`  Respekt ${nNum(have, 0)} / ${nNum(need, 0)} fuers naechste Mitglied   `
                        + `Rate ${isFinite(rr) ? rr.toFixed(2) : "?"}/Cycle   ETA ${eta}`);
                }
                // v2.9: Aufgabenverteilung. Trennt die zwei Ursachen einer
                // Respekt-Rate von 0, die in der Zahl selbst gleich aussehen:
                // alle auf Territory Warfare (Task zahlt nichts) ODER Mitglieder
                // zu schwach fuer ihre Aufgabe (statWeight - 4*difficulty <= 0).
                if (gi.tasks && typeof gi.tasks === "object") {
                    const rows = Object.entries(gi.tasks).sort((a, b) => b[1] - a[1]);
                    if (rows.length) {
                        L.push("  Aufgaben: " + rows.map(([k, v]) => `${v}x ${k}`).join("  ·  "));
                        const warf = Number(gi.tasks["Territory Warfare"] || 0);
                        const total = rows.reduce((a, r) => a + r[1], 0);
                        const alleWarfare = warf > 0 && warf === total;
                        // v3.19: Streak zaehlen, nicht die Momentaufnahme melden.
                        gangWarfareStreak = alleWarfare ? gangWarfareStreak + 1 : 0;
                        if (alleWarfare && gangWarfareStreak < GANG_WARFARE_STREAK_MIN) {
                            // Erwarteter Zustand: das Fenster vor dem Tick. Als
                            // Hinweis in den Bericht, NICHT als Befund.
                            L.push(`  (im geplanten Warfare-Fenster — Beobachtung `
                                + `${gangWarfareStreak}/${GANG_WARFARE_STREAK_MIN}, noch kein Befund)`);
                        } else if (alleWarfare) {
                            findings.push(`GANG: seit ${gangWarfareStreak} Berichten stehen ALLE ${total} `
                                + `Mitglieder auf "Territory Warfare" — das ist kein Fenster mehr, sondern `
                                + `ein Stillstand. Der Task hat kein baseRespect und kein baseMoney; die Gang `
                                + `verdient weder Respekt noch Geld und kann nicht rekrutieren. Verdacht: die `
                                + `Tick-Erkennung in GANG greift nicht (cyclesSinceTick laeuft ueber 100).`);
                        } else if (Number(gi.respectRate) === 0 && warf < total) {
                            findings.push(`GANG: Respekt-Rate 0, obwohl nur ${warf} von ${total} Mitgliedern auf `
                                + `"Territory Warfare" stehen. Dann sind die Mitglieder fuer ihre Aufgaben zu `
                                + `schwach: die Engine liefert 0, sobald statWeight - 4*difficulty <= 0 ist. `
                                + `Leichtere Aufgabe oder erst trainieren.`);
                        }
                    }
                }
                if (gi.warfare !== undefined) {
                    L.push(`  Warfare-Fenster ${gi.warfare ? "AKTIV" : "aus"}   `
                        + `cyclesSinceTick ${gi.cyclesSinceTick === undefined ? "?" : gi.cyclesSinceTick}`
                        + "   (eine Territoriums-Periode = 100 Cycles)");
                    // DER FINGERABDRUCK des Zaehler-Fehlers: liegt cyclesSinceTick
                    // deutlich ueber einer Periode, wurde der Tick nicht erkannt und
                    // das Fenster kann nicht mehr schliessen.
                    //
                    // v2.7 EINGRENZUNG — bei VOLLEM Territorium war das ein Fehlalarm.
                    //
                    // Live gemeldet: "cyclesSinceTick 197" bei Territorium 100 %. Der
                    // Zaehler lief tatsaechlich hoch, nur war er in dem Zustand ohne
                    // jede Wirkung. Im GANG-Payload steht:
                    //     territoryDone = info.territory >= CFG.TERRITORY_DONE
                    //     wantWarfare   = CFG.TERRITORY_WARFARE && !territoryDone
                    //     if (wantWarfare && nearTick) { Fenster auf } else { optimieren }
                    // Bei territoryDone ist wantWarfare FALSCH, der nearTick-Zweig also
                    // unerreichbar — das Fenster kann gar nicht mehr aufgehen, egal wie
                    // hoch der Zaehler steht. Der Bericht belegte das in derselben Zeile
                    // selbst: "Warfare-Fenster aus", Aufgaben 6x Human Trafficking und
                    // 5x Terrorism, also durchgehend produktiv.
                    //
                    // Dass der Zaehler bei 100 % ueberhaupt hochlaeuft, ist erklaerbar:
                    // erkannt wird der Tick am JSON-Vergleich von getAllGangInformation().
                    // Wer alles haelt, sieht bei den NPC-Gangs kaum noch Bewegung — zwei
                    // Messungen koennen gleich aussehen, dann bleibt der Reset aus.
                    // Folgenlos, solange nichts mehr davon abhaengt.
                    //
                    // Echter Befund bleibt es, SOLANGE Territorium fehlt: dort haengt das
                    // Fenster wirklich, und "Territory Warfare" zahlt weder Respekt noch Geld.
                    const terrVoll = Number(gi.territory) >= 1;
                    if (Number(gi.cyclesSinceTick) > 150 && !terrVoll) {
                        findings.push(`GANG: cyclesSinceTick steht bei ${gi.cyclesSinceTick}, eine Territoriums-Periode `
                            + `sind aber 100 Cycles. Der Tick wird nicht erkannt — das Warfare-Fenster kann nicht `
                            + `schliessen, und auf "Territory Warfare" verdient niemand Respekt.`);
                    } else if (Number(gi.cyclesSinceTick) > 150) {
                        L.push(`  (Zaehler ueber einer Periode — bei 100 % Territorium ohne Wirkung: `
                            + `das Warfare-Fenster wird gar nicht mehr geoeffnet.)`);
                    }
                }
                // v2.9: Nur noch, wenn die Aufgabenverteilung FEHLT. Liegt sie vor,
                // sagen die Befunde oben nicht "pruefen, ob ...", sondern welcher
                // der beiden Faelle es ist. Ein Befund, der eine Frage stellt, die
                // der Bericht selbst beantworten koennte, ist eine halbe Diagnose.
                if (isFinite(rr) && rr === 0 && Number(gi.members) < 12 && !gi.tasks) {
                    findings.push(`GANG: Respekt-Rate ist 0 bei ${gi.members} Mitgliedern. Fuer das naechste `
                        + `braucht es ${nNum(need, 0)} Respekt — das wird so nie erreicht. Die `
                        + `Aufgabenverteilung fehlt im Snapshot (aeltere GANG-Version?), sonst stuende hier, `
                        + `woran es liegt.`);
                }
            }
        }

        // ---------- 4f GO ----------
        // NEU (v2.7). Grundlage fuer zwei Entscheidungen, die bisher nur zu raten
        // waren: greift das 5x5-Farm-Tor (Difficulty x8 statt 2), und lohnt ein
        // Serienschutz? Beides haengt an der Siegquote je Gegner UND Brettgroesse,
        // und die lag in einer Datei auf dem pserv, an die DIAG nicht herankam.
        L.push("");
        L.push("== 4f GO (IPvGO) " + "=".repeat(59));
        {
            const go = jparse(ns.peek(SCHWARM_PORTS.GO_OUT));
            if (!go || !go.opp || Object.keys(go.opp).length === 0) {
                L.push("  keine Daten — GO laeuft nicht oder hat noch keine Partie beendet.");
            } else {
                const alter = go.ts ? Math.round((Date.now() - go.ts) / 1000) : null;
                L.push(`  Stand ${alter === null ? "—" : alter + " s alt"}`);
                L.push("");
                L.push("  GEGNER               GEW   SERIE  FARM   GRÖSSE   PARTIEN  SIEGE   WR(20)");
                L.push("  " + "-".repeat(76));
                const W = go.weights || {};
                for (const name of Object.keys(go.opp)) {
                    const o = go.opp[name];
                    const gew = W[name] === undefined ? "—" : String(W[name]);
                    // Gewicht 0 heisst: in dieser BitNode zahlt der Bonus auf einen
                    // Null-Multiplikator ein, der Gegner wird bewusst ausgesetzt.
                    const farm = o.farm ? "5x5" : (o.probed ? "Probe" : "—");
                    const sizes = Object.keys(o.sizes || {});
                    if (sizes.length === 0) {
                        L.push(`  ${name.padEnd(20)} ${gew.padStart(3)}   ${String(o.streak).padStart(5)}  ${farm.padEnd(6)}   —`);
                        continue;
                    }
                    let first = true;
                    for (const k of sizes) {
                        const s = o.sizes[k];
                        const kopf = first
                            ? `  ${name.padEnd(20)} ${gew.padStart(3)}   ${String(o.streak).padStart(5)}  ${farm.padEnd(6)}`
                            : "  " + " ".repeat(38);
                        L.push(`${kopf} ${(k + "x" + k).padStart(7)} ${String(s.g).padStart(8)} ${String(s.w).padStart(6)}   `
                            + `${s.wr === null ? "—" : s.wr + " %"}`);
                        first = false;
                    }
                }
                L.push("");
                L.push("  GEW = Rotationsgewicht nach BitNode (0 = ausgesetzt, weil der Bonus");
                L.push("        dieses Gegners hier auf einen Null-Multiplikator zahlt).");
                L.push("  FARM: 5x5 = Farmmodus aktiv (Difficulty x8) · Probe = Probelauf laeuft.");
                L.push("  SERIE: negativ = Pechstraehne. Der Streak-Multiplikator liegt bei");
                L.push("        <0 auf x0,5 und deckelt bei +8 auf x3 (effect.ts).");
            }
        }

        // ---------- 4c INFIL ----------
        // Quellen sind INFILs eigene Dateien (ns.read -> 0 GB). Bewertet wird
        // BEOBACHTEND: jede Aussage steht neben ihrer Rohzahl, damit die Schwellen an
        // echten Laeufen nachgezogen werden koennen statt geraten zu bleiben.
        L.push("");
        L.push("== 4c INFIL " + "=".repeat(64));
        const infil = { n: 0, rep: 0, mon: 0, nil: 0, abr: 0, ageS: null, goals: null, last: [] };
        {
            let raw = "";
            try { raw = ns.read(INFIL_LOG) || ""; } catch (e) { raw = ""; }
            const rows = raw.split("\n").filter(x => x.trim().length > 0);
            infil.n = rows.length;
            for (const r of rows) {
                const u = r.toUpperCase();
                if (u.includes("ABBRUCH")) infil.abr++;
                else if (u.includes("REP")) infil.rep++;
                else if (u.includes("MONEY")) infil.mon++;
                else if (u.includes("NONE")) infil.nil++;
            }
            infil.last = rows.slice(-8);
            try {
                const st = jparse(ns.read(INFIL_STAMP));
                if (st && st.ts) infil.ageS = Math.round((Date.now() - st.ts) / 1000);
            } catch (e) { /* kein Stempel */ }
            try {
                const g = jparse(ns.read(INFIL_GOALS));
                if (g && Array.isArray(g.goals)) infil.goals = g.goals.length;
            } catch (e) { /* keine Ziele */ }
        }
        const infilRuns = !!(seen["INFIL"] && seen["INFIL"].n > 0);
        if (infil.n === 0) {
            L.push(`kein Logbuch (${INFIL_LOG} leer oder nicht vorhanden)`
                + (infilRuns ? " — INFIL laeuft, hat aber noch nichts geschrieben." : " — INFIL laeuft nicht."));
        } else {
            L.push(`Logzeilen ${infil.n}   REP ${infil.rep}   MONEY ${infil.mon}`
                + `   NONE ${infil.nil}   ABBRUCH ${infil.abr}`);
            L.push(`Ziel-Cache ${infil.ageS === null ? "kein Stempel" : infil.ageS + " s alt"}`
                + `   Aug-Ziele ${infil.goals === null ? "—" : infil.goals}`);
            L.push("letzte Laeufe:");
            for (const r of infil.last) L.push("  " + r);

            const gut = infil.rep + infil.mon;
            const ges = gut + infil.abr;
            // v2.7: SCHWELLE VON 30 % AUF 85 % ANGEHOBEN.
            //
            // Die alten 30 % gingen davon aus, dass ein Abbruch einen kaputten
            // Minigame-Loeser bedeutet. Der Regelfall ist ein anderer: INFIL ist
            // NACHRANGIG und bricht planmaessig ab, wenn es gerade kein lohnendes
            // Geld- oder Rep-Ziel gibt oder WORK die Faktion wechselt — und WORK
            // wechselt absichtlich staendig (gleichmaessige Favor-Verteilung).
            // Beobachtet wurden ueber Stunden stabile 47-49 % bei laufendem
            // Betrieb; der Befund war also Dauerrauschen und hat die echten
            // Befunde verwaessert.
            // Bei 85 % ist dagegen wirklich etwas kaputt: dann kommt praktisch
            // kein Lauf mehr durch, und das ist kein Vorrang-Effekt mehr.
            if (ges >= 20 && infil.abr / ges > 0.85) {
                findings.push(`INFIL bricht ${infil.abr} von ${ges} Laeufen ab (${Math.round(infil.abr / ges * 100)} %). `
                    + `Ueber 85 % kommt praktisch kein Lauf mehr durch — das ist kein Vorrang-Effekt mehr. `
                    + `${INFIL_PROBE} unten zeigt, an welchem Minigame es haengt.`);
            }
            if (infilRuns && gut === 0 && infil.n >= 3) {
                findings.push(`INFIL laeuft, aber im Logbuch steht kein einziger erfolgreicher Lauf `
                    + `(${infil.n} Zeilen, davon ${infil.nil}x NONE, ${infil.abr}x ABBRUCH).`);
            }
            if (infil.nil > 0 && infil.nil === infil.n) {
                findings.push(`INFIL findet dauerhaft kein Ziel (${infil.nil}x NONE). `
                    + `Meist fehlt der Stadt-/Firmen-Zugang oder alle Ziele sind zu schwer.`);
            }
            // v3.0: DIESER BEFUND IST RAUS — er war ein Fehlalarm, und zwar in
            // JEDEM Zyklus von zwoelf gemessenen. Genau solche Dauerlaeufer
            // entwerten die echten Befunde daneben.
            //
            // Der Zielcache haelt vier Felder je Ort:
            //     { name, city, sec: startingSecurityLevel, lvl: maxClearanceLevel }
            // Alle vier stammen aus location.infiltrationData und sind STATISCHE
            // Ortsdaten (NetscriptFunctions/Infiltration.ts:41,47,64-65). Sie
            // aendern sich weder mit der Zeit noch mit den Spielerwerten.
            //
            // Was von den Spielerwerten abhaengt, ist die Schwierigkeit —
            // Infiltration/formulas/game.ts:45-52 zieht dort
            // pow(Summe der Kampf- und Charisma-Werte, 0.9)/250 ab. Das wird
            // aber bei JEDEM Aufruf frisch gerechnet und steht nicht im Cache.
            // Ein alter Cache ist deshalb kein alter Wert, sondern nur eine
            // alte Datei mit unveraenderlichem Inhalt.
            //
            // INFIL baut ihn ohnehin nach jedem Aug-Reset neu (SCHWARM-INFIL.js:
            // staleAfterReset) — der einzige Anlass, bei dem sich die Ortsliste
            // ueberhaupt aendern koennte, weil neue Staedte erreichbar werden.
            // Das Alter allein sagt gar nichts, und der Befund ist ersatzlos
            // gestrichen.
        }
        // Probe-Datei auf Wunsch grundsaetzlich anhaengen (kann lang werden).
        {
            let probeText = "";
            try { probeText = ns.read(INFIL_PROBE) || ""; } catch (e) { probeText = ""; }
            const pr = probeText.split("\n").filter(x => x.length > 0);
            if (pr.length) {
                L.push("");
                L.push(`${INFIL_PROBE} (${pr.length} Zeilen):`);
                for (const r of pr) L.push("  " + r);
            }
        }

        // ---------- 8 BEFUNDE ----------
        hr("8  BEFUNDE");
        if (!findings.length) L.push("Keine Auffälligkeiten in den geprüften Regeln.");
        findings.forEach((f, i) => L.push(`${padL(i + 1, 2)}. ${f}`));

        // ---------- 9 LOGBUCH ----------
        hr("9  LOGBUCH (nur Änderungen)");
        if (book.length <= 2) L.push("Keine Änderungen im Fenster — alles stand still (oder das Fenster war zu kurz).");
        for (const b of book) L.push(b);


        // ---------- Kennzahlen für den Änderungs-Vergleich ----------
        // Bewusst flach und klein: nur was sich sinnvoll vergleichen laesst. Der
        // volle Report ist im ersten Zyklus schon geschrieben; hier geht es um die
        // Frage "was hat sich in 30 min bewegt".
        const metrics = {
            geld:        pl ? pl.money : null,
            level:       lvlA ? lvlA.last : null,
            xpGesamt:    xpA ? xpA.last : null,
            // v3.7: POOL statt rootT/rootFree. Das war der schwerste der drei
            // Fehler, weil der Kurzreport die Zahlen aus ZWEI Quellen mischte:
            // PT/PF aus DIAGs Messung OHNE Hacknet, BY und die DK-Klassen aus
            // dem Dispatcher-Snapshot MIT Hacknet. Im Bericht z601 stand deshalb
            // "PT=77.9T ... BY=138.7T" — belegt groesser als gesamt, was nicht
            // sein kann. PF war mit 934G angegeben, waehrend der Dispatcher im
            // selben Moment 15.0T frei meldete: Faktor 16 daneben, und zwar in
            // der Richtung "Pool ist voll", die zu genau den falschen Schluessen
            // fuehrt (mehr RAM kaufen, Flotte drosseln).
            poolTotal:   ramEnd.poolT,
            // v2.7: bei Hoechstlast, nicht die Endmessung. Sonst springt die
            // Zyklus-zu-Zyklus-Zeile "poolFrei 685.0T -> 21.3T", obwohl sich
            // nichts geaendert hat ausser der Phase der Worker-Welle.
            poolFrei:    ramPeak.poolFree,
            // v3.7: der Hacknet-Anteil steht jetzt als eigene Kennzahl im
            // Kurzreport. Ohne ihn laesst sich von aussen nicht nachpruefen,
            // aus welchen zwei Teilen PT besteht — und genau diese Nachpruefung
            // haette den Fehler oben sechs Tage frueher sichtbar gemacht.
            poolHacknet: ramEnd.hnT,
            hosts:       ramEnd.nRoot,
            ziele:       last.disp ? last.disp.targets : null,
            prep:        last.disp ? last.disp.prep : null,
            execFail:    last.disp ? last.disp.execFail : null,
            wThreads:    last.pr.wtotal,
            spartopf:    (last.bank || {}).savings ?? null,
            sparziel:    (last.bank || {}).goal ? last.bank.goal.key : null,
            hackEma:     (last.bank || {}).hackPerGbH ?? null,
            phase:       last.phase ?? null,
            arbeit:      cwType,
            jobs:        jobs.length,
            repZiel:     last.repT ? last.repT.fac : null,
            augKauf:     last.augBuy ? last.augBuy.aug : null,
            resetBereit: (() => { try { const r = readResetReady(ns); return r ? `${r.count} Augs` : null; } catch (e) { return null; } })(),
            bladeRang:   blNow ? blNow.rank : null,
            bladeSkill:  blNow ? blNow.skillPoints : null,
            daemonsAn:   Object.keys(seen).length,
            befunde:     findings.length,
            // v2.2: Backdoor + INFIL wandern in den Aenderungs-Vergleich. Genau hier
            // wird ein Verlauf wertvoll: "offen 12 -> 12 -> 12 -> 12" ist ein Befund,
            // "12 -> 9 -> 5 -> 2" ist gesunder Betrieb.
            bdOffen:     bd.pend,
            bdLaufend:   bd.laufend,
            bdGestartet: bd.started,
            ifLog:       infil.n,
            ifOk:        infil.rep + infil.mon,
            ifAbbruch:   infil.abr,
            // Dispatcher v10.3+: exakte Belegung und die Deckel, die gegriffen haben.
            busy:        last.disp ? (last.disp.busyGb ?? null) : null,
            // v2.6: Kursbeeinflussung im Verlauf. "0 -> 0 -> 0" ist ein Befund,
            // "0 -> 2 -> 4" ist gesunder Hochlauf.
            manipZiele:  (() => { try { const m = readOut(ns, SCHWARM_PORTS.TRADER_OUT).manip; return Array.isArray(m) ? m.length : 0; } catch (e) { return null; } })(),
            manipGb:     last.disp ? ((last.disp.used || {}).manip ?? null) : null,
            manipCalls:  (last.disp && last.disp.manipDiag) ? last.disp.manipDiag.calls : null,
            deckel:      last.disp && Array.isArray(last.disp.limits) ? last.disp.limits.join(",") : null,
        };

    // ================= AUSGABE + ZYKLUS-ABSCHLUSS =================
        const stamp = new Date().toLocaleString();
        // v2.2: die Aenderungsliste wird BEIDE Male gebraucht (voller Report und
        // Kurzreport), deshalb VOR der Verzweigung berechnet — vorher entstand sie
        // nur im else-Zweig und war fuer den Kurzreport nicht verfuegbar.
        const changes = [];
        if (!isFirst) {
            const P = plan.prevMetrics || {};
            const fmtS = (k, val) => {
                if (val === null || val === undefined) return "-";
                if (k === "geld" || k === "spartopf" || k === "hackEma") return nMoney(val);
                // v3.7: poolHacknet gehoert hier dazu. Fehlt ein gb-Feld in dieser
                // Liste, faellt es auf String(val) zurueck und steht als nackte
                // GB-Zahl neben lauter T-Werten — im Kurzreport unauffaellig,
                // beim Vergleich zweier Zyklen aber irrefuehrend.
                if (k === "poolTotal" || k === "poolFrei" || k === "poolHacknet" || k === "busy" || k === "manipGb") return nGb(val);
                return String(val);
            };
            for (const k of Object.keys(metrics)) {
                const a2 = P[k], b2 = metrics[k];
                if (a2 === b2) continue;
                if (typeof a2 === "number" && typeof b2 === "number" && a2 !== 0) {
                    if (Math.abs(b2 - a2) / Math.abs(a2) < 0.02) continue;
                }
                changes.push(`${k} ${fmtS(k, a2)} -> ${fmtS(k, b2)}`);
            }
        }
        if (isFirst) {
            // Vollständiges Lagebild, überschreibt einen alten Report.
            //
            // v3.1: Im Dauerlauf bekommt JEDER Zyklus eine eigene Datei
            // (SCHWARM-REPORT-<lfd>.txt). Der laufende Zaehler steht im Plan
            // und ueberlebt damit auch einen Neustart des Skripts — sonst
            // wuerde nach jedem Neustart wieder bei 1 begonnen und eine noch
            // nicht abgeholte Datei ueberschrieben.
            const ziel = ENDLOS ? `SCHWARM-REPORT-${plan.lfd + 1}.txt` : OUT_FILE;
            const head = ENDLOS
                ? [
                    `DAUERLAUF: Lagebild alle ${plan.gapMin} min. Jeder Lauf schreibt eine eigene Datei.`,
                    `Lauf ${plan.lfd + 1} — vollstaendig. Wird nach dem Abholen im Spiel geloescht.`,
                    "",
                  ].join("\n")
                : [
                    `AUFTRAG: ${plan.cycles} Lagebild(er) im Abstand von ${plan.gapMin} min.`,
                    `Zyklus 1 von ${plan.cycles} — vollständig. Weitere Zyklen listen nur Änderungen.`,
                    "",
                  ].join("\n");
            try {
                ns.write(ziel, head + L.join("\n") + "\n", "w");
                if (ENDLOS) plan.lfd++;
            }
            catch (e) { ns.print("Schreibfehler: " + e); }
        } else {
            // Nur Änderungen gegenüber dem VORIGEN Zyklus anhängen.
            // v2.2: Die Liste steht schon oben (changes) — hier nur noch formatieren.
            // Die 2-%-Schwelle gegen Rauschen ist dort angewandt.
            const diff = changes.map(c => {
                const i = c.indexOf(" ");
                return `  ${padR(c.slice(0, i), 13)} ${c.slice(i + 1)}`;
            });
            const out = [];
            out.push("");
            out.push("=".repeat(78));
            out.push(`ZYKLUS ${cycleNo} von ${plan.cycles}   ${stamp}   (+${plan.gapMin} min)`);
            out.push("=".repeat(78));
            if (plan.resetJustNow) {
                out.push("");
                if (plan.nodeSwitch) {
                    // v3.5: Der seltenste und aussagekraeftigste Fall. Hier stehen die
                    // Zahlen von VOR und NACH dem Wechsel im selben Bericht — nirgends
                    // sonst ist der Einfluss der BitNode-Multiplikatoren direkt sichtbar.
                    const s = plan.nodeSwitch;
                    out.push(`>>> BITNODE-WECHSEL erkannt: BN${s.von || "?"} -> BN${s.nach || "?"}.`);
                    out.push(">>> Damit haben sich ALLE Multiplikatoren gleichzeitig geaendert");
                    out.push(">>> (Prestige.ts:204 initBitNodeMultipliers). Der Abschnitt VERAENDERT");
                    out.push(">>> unten vergleicht denselben Schwarm vor und nach dem Wechsel —");
                    out.push(">>> Hack-Ertrag, Corp-Bewertung, Crime, Hacknet, Bladeburner-Rang.");
                    out.push(">>> Achtung: Server, Hacknet und Boersenpositionen sind weg, home nicht.");
                    delete plan.nodeSwitch;
                } else {
                    out.push(">>> AUG-RESET seit dem letzten Zyklus erkannt. Alle Skripte wurden beendet,");
                    out.push(">>> DIAG wurde neu gestartet und setzt den Auftrag fort.");
                }
                out.push(`>>> Resets in diesem Lauf: ${plan.resets}`);
                delete plan.resetJustNow;
            }
            out.push("");
            out.push(diff.length ? "VERÄNDERT:" : "VERÄNDERT: nichts oberhalb der 2-%-Schwelle.");
            for (const d of diff) out.push(d);
            if (findings.length) {
                out.push("");
                out.push("BEFUNDE:");
                findings.forEach((f, i) => out.push(`  ${padL(i + 1, 2)}. ${f}`));
            }
            if (book.length > 2) {
                out.push("");
                out.push(`LOGBUCH (${book.length} Zeilen im Fenster, gekürzt auf 25):`);
                for (const b of book.slice(0, 25)) out.push("  " + b);
            }
            // Nachtrag: chronikLesen hat das Buch auch in diesem Zyklus geleert -
            // ohne diesen Block waeren seine Zeilen spurlos weg.
            if (kasseBlock.length) {
                out.push("");
                out.push("4c  KASSE (maschinenlesbar, fuer kassen-pruefer.py)");
                for (const z of kasseBlock) out.push(z);
            }
            try { ns.write(OUT_FILE, out.join("\n") + "\n", "a"); }
            catch (e) { ns.print("Schreibfehler: " + e); }
        }

        // ---------- KURZREPORT + LEGENDE (v2.2) ----------
        try {
            const shortLines = buildShort({
                formatVersion: SHORT_FORMAT, cycleNo, cycles: plan.cycles,
                stamp: new Date().toTimeString().slice(0, 8), host: selfHost,
                metrics, findings, book, changes, isFirst,
                disp: last.disp, bdTargets: bd.targets, infilLast: infil.last,
            });
            // Zyklus 1 legt neu an, die weiteren haengen an -> eine Datei mit dem
            // ganzen Verlauf, so wie beim vollen Report.
            ns.write(SHORT_FILE, shortLines.join("\n") + "\n", isFirst ? "w" : "a");
            ns.write(LEGEND_FILE, buildLegend() + "\n", "w");
        } catch (e) { ns.print("Kurzreport: " + e); }

        plan.done = cycleNo;
        plan.prevMetrics = metrics;
        saveProgress(plan);
        ns.print(`DIAG Zyklus ${cycleNo}/${ENDLOS ? "endlos" : plan.cycles}: ${series.length} Samples, ${findings.length} Befunde.`);

        if (plan.done >= grenze(plan)) break;
        // Warten. In Scheiben, damit ein Reset mitten im Warten nicht als hängender
        // Prozess erscheint und die Engine zwischendurch atmen kann.
        //
        // v2.3: Der Takt wird von START zu START gerechnet. Vorher stand hier
        // `Date.now() + GAP_MS`, also NACH dem Messfenster — der Abstand war damit
        // Fenster + Pause. Live gemessen: 08:59:24 / 09:15:24 / 09:31:25 / 09:47:26,
        // also 16 statt 15 Minuten, und ein Auftrag "4x in einer Stunde" lief 48
        // statt 45 Minuten. Bei einem 60-s-Fenster ist das wenig; bei einem langen
        // Fenster (600 s) waere der Takt komplett verschoben.
        // v3.5: PLAN_GAP_MS statt GAP_MS — bei einem argumentlosen Fortsetzen
        // steht der richtige Abstand im Plan, nicht in den Vorgabewerten.
        const until = cycleStartedAt + PLAN_GAP_MS;
        if (until <= Date.now()) {
            ns.print(`HINWEIS: Zyklus dauerte laenger als der Abstand (${plan.gapMin} min) — `
                + `naechster Lauf startet sofort, der Takt verschiebt sich.`);
        }
        // Nachtrag: in der Pause alle 5 s Port 35 umschichten. Vorher nur im
        // 60-s-Messfenster - in den ~9 min dazwischen lief der Port ueber
        // (50 Plaetze, GANG allein ~3 Zeilen je 6 s), die aeltesten Kaeufe fielen
        // lautlos heraus (Testspiel 26.09.: K1 gang_expenses $549m).
        while (Date.now() < until) {
            try { chronikUmschichten(ns); } catch (e) { /* darf nie stoeren */ }
            await ns.sleep(Math.min(5_000, until - Date.now()));
        }
    }

    // ================= ABSCHLUSS =================
    // v3.1: Im Dauerlauf wird diese Stelle nie erreicht — die Schleife bricht
    // nicht ab. Und selbst wenn: es gaebe keine gemeinsame Datei, an die man
    // anhaengen koennte, weil jeder Lauf seine eigene schreibt.
    if (!ENDLOS) {
        try { ns.write(OUT_FILE, `\n${"=".repeat(78)}\nAUFTRAG BEENDET nach ${plan.done} Zyklus/Zyklen.\n`, "a"); } catch (e) { /* egal */ }
    }
    ns.print(`Report: ${OUT_FILE} auf ${selfHost}` + (selfHost !== "home" ? "  (NICHT home!)" : ""));
    ns.print(`Kurzfassung: ${SHORT_FILE}   Legende: ${LEGEND_FILE} (generiert)`);
    try { ns.tprint(`INFO  [DIAG] fertig nach ${plan.done} Zyklus/Zyklen — ${OUT_FILE} / ${SHORT_FILE}`); } catch (e) { /* egal */ }

    // Auftrag abgeschlossen -> Fortschrittsdatei leeren, damit ein neuer Start
    // frisch beginnt und nicht versucht fortzusetzen.
    try { ns.write(STATE_FILE_DIAG, "", "w"); } catch (e) { /* egal */ }

    // Selbstabschaltung: ein Klick = ein AUFTRAG (nicht ein Zyklus).
    // setDaemonEnabled schreibt die State-Datei auf den LOKALEN Host — nur auf home
    // ist das die richtige.
    if (selfHost === "home") {
        try {
            if (SELF_KEY in DAEMONS) { setDaemonEnabled(ns, SELF_KEY, 0); ns.print("DIAG-Schalter auf AUS gesetzt."); }
        } catch (e) { ns.print("Selbstabschaltung fehlgeschlagen: " + e); }
    } else {
        ns.print("Nicht auf home -> keine Selbstabschaltung (State-Datei liegt auf home).");
    }
}
