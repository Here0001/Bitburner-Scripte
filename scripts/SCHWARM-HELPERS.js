/**
 * SCHWARM-HELPERS.js — v5.16
 *
 * v5.16 — DAS HANDLUNGSBUCH WIRD PRUEFBAR. chronik() nimmt ein siebtes
 *   Feld: JSON mit ms (Epochenzeit) und dem, was der Aufrufer mitgibt - vor
 *   allem betrag (EXAKT) und topf (Feld in getMoneySources). Damit laesst
 *   sich jeder protokollierte Kauf gegen das Kassenbuch der Engine rechnen
 *   (kassen-pruefer.py). Dazu chronikUmschichten() fuer DIAG (Port 35 fasst
 *   nur 50 Zeilen), Ringpuffer 1000, DIAG minRam 9 (+getMoneySources).
 *   Nachtrag (Testspiel + Gegenpruefung): Freigaben tragen __ts und gelten
 *   hoechstens 120 s (steht BANK, spendete WORK sonst alle 20 s erneut);
 *   requestFundsZurueck() meldet einen Antrag UNGENUTZT ab, BANK bucht ihn
 *   dann nicht; drainBankInbox sammelt solche Abmeldungen.
 *   Nachtrag 2: verlorene Zeilen hinterlassen eine Spur - verdraengte
 *   Portzeilen zaehlt chronik() (verlorenPort in der naechsten Zeile),
 *   kuerzt der Ringpuffer, steht eine Markerzeile (verlorenPuffer) vorn.
 *
 * v5.15 — BITNODE braucht 54 GB, eingetragen waren 20. Gemessen per
 *   calculateRam (25.09.2026, Testumgebung) samt aller anderen Nutzlasten;
 *   nur BITNODE fiel heraus. Frueh in einer Node (home 128 GB) konnte sein
 *   Start daran scheitern. minRam jetzt 56 (Muster: gemessen + 1-2 GB).
 *
 * v5.14 — DAS HANDLUNGSBUCH LIEGT AUF HOME, EGAL WO DER DAEMON LAEUFT.
 *   ns.read/ns.write treffen nur den EIGENEN Rechner. BANK laeuft auf einem
 *   Fremdrechner, DIAG liest auf home: am 24.09.2026 lagen 29 BANK-Zeilen
 *   (home-Kaeufe, Wartezeiten) ungelesen auf run4theh111z - keine erreichte
 *   je einen Bericht. Jetzt schreibt chronik() von Fremdrechnern in den
 *   Port CHRONIK (35); auf home sammelt jeder Schreiber und chronikLesen()
 *   den Port mit ein. Welcher Rechner: ns.self().server (0 GB).
 *
 * v5.13 — BLADEBURNER UND GANGS GEHOEREN DER QUEEN, NICHT MEHR WORK.
 *   Bisher Owner WORK: die QUEEN startete sie nur, solange WORK alle 20 s
 *   ein WANT schickte. Am 24.09.2026 zweifach gerissen: WORK schickte nach
 *   einem Neustart DROP:BLADEBURNER, bevor es den Beitritt ueberhaupt geprueft
 *   hatte, und waehrend eines Graftings schickte es gar nichts mehr. Beide
 *   Daemons lagen stundenlang still. Jetzt wie GO: Schalter an + Mechanik da
 *   -> die QUEEN startet sie. WORK tritt nur noch bei und gruendet.
 *
 * v5.12 — DAS HANDLUNGSBUCH (Idee des Nutzers).
 *   Die Engine sagt nirgends, WER etwas getan hat. Aus einem ZUSTAND auf
 *   einen URHEBER zu schliessen geht deshalb schief — mir am 21.09.2026
 *   zweimal passiert: erst "Project Insight wurde nie gekauft" (stand auf
 *   Stufe 65), dann "CORP kauft also kraeftig" (der Nutzer hatte es von
 *   Hand gekauft). Also schreibt jetzt jeder Daemon auf, was er tut.
 *   chronik() schreibt eine Zeile, chronikLesen() holt und leert sie.
 *   Der AUSGANG ist ein Feld, keine Kategorie: eine Handlung ist eine
 *   Handlung, ob sie gelingt oder nicht.
 *
 * v5.11 — planFreigabe() KANNTE "flume" NICHT. QUEEN v7.13 hat den Weg in
 *   den SCHREIBER eingetragen, nicht in den LESER — und jeder Verbraucher
 *   liest ueber diese Funktion. PLAN_OUT trug korrekt weg:"flume", und
 *   shouldRun() sagte trotzdem nein. Ein Portwert braucht beide Tore.
 *
 * v5.10 — EINTRITTSKARTE ODER BETRIEBSBEDINGUNG? daemonBereit() behandelte
 *   beides gleich. Karma und Kampfwerte sind EINTRITTSKARTEN: wer eine Gang
 *   gegruendet oder die Division betreten hat, ist drin — gegruendet wird nicht
 *   zweimal, und ein Aug-Install haette eine laufende Gang sonst "unreif"
 *   gemacht. Deshalb steht der Mitgliedsstand jetzt VOR der Huerde.
 *   "The Blade's Simulacrum" ist dagegen eine echte BETRIEBSBEDINGUNG
 *   (Bladeburner.ts:1356) und wird auf VORHANDENSEIN geprueft — der IST-Stand,
 *   denn prestigeSourceFile endet mit `this.augmentations = []`.
 *
 * v5.9 — REIFEGRAD: daemonBereit(). Die Schalterdatei liegt auf home und
 *   ueberlebt jeden Prestige — die VORAUSSETZUNGEN nicht. Ein "GANGS: aus" aus
 *   BN12 regierte still in BN15 weiter, waehrend das Karma dort bei 0 neu
 *   anfing. `cap` faengt das nicht: es sagt, ob es die Mechanik GIBT, nicht ob
 *   man sie BENUTZEN kann. Neue Funktion mit drei Zustaenden (ja / nachweislich
 *   nein / unbekannt); ARSENAL schaltet danach beim Reset ab, die QUEEN
 *   beruecksichtigt sie in der Selbstverwaltung. Belege am Code.
 *
 * v5.8 — DIE UEBRIGEN PINS DURCHGEGANGEN, jeder mit seinem ECHTEN Grund.
 *   DARKNET und LOGVIEW verlieren ihren (tote Datei bzw. widerlegtes DOM).
 *   INFIL behaelt ihn, aber nicht wegen des DOM: DIAG liest vier seiner
 *   Dateien LOKAL, und ns.read kennt keinen Host. CORP (Zustandsdatei muss
 *   den Soft-Reset ueberleben), DIAG (liest fuenf Dateien auf home) und
 *   BITNODE (liest schwarm-plan.txt) behalten ihn ebenfalls zu Recht.
 *
 * v5.7 — DASHBOARD BRAUCHT home NICHT. Der Registry-Kommentar sagte "DOM" —
 *   aber das DOM gehoert dem Browser, nicht dem Spielserver. Ich hatte den
 *   Kommentar uebernommen statt ihn zu pruefen. Probe laeuft ueber
 *   AKTIV_OUT; haelt sie, fallen auch INFIL und die uebrigen
 *   DOM-Begruendungen.
 *
 * v5.6 — INFO minRam 71 -> 74. Die BlackOp-Chronik hat das Skript auf 71,70 GB
 *   gebracht, also knapp ueber seine eigene Registry-Angabe. Getragen hat das
 *   der Burst-Puffer; ohne ihn waere der Start still fehlgeschlagen.
 *
 * v5.5 — WORK BRAUCHT home NICHT.
 *   Null Dateizugriffe im ganzen Skript; der Pin war eine Annahme. CORP und
 *   DIAG behalten ihren dagegen zu Recht: CORP muss schwarm-corp-state.txt
 *   ueber den Soft-Reset retten (die Corp ueberlebt ihn ja auch), DIAG liest
 *   vierzehn Dateien lokal, darunter die INFIL-Logs.
 *
 * v5.4 — AUTO-SCHALTER, AKTIV_OUT, UND STANEK VERLIERT SEINEN KNOPF.
 *   a) Neuer Port AKTIV_OUT (29): Zeitstempel der letzten MENSCHLICHEN
 *      Eingabe. Das DASHBOARD schreibt ihn, die QUEEN liest ihn.
 *   b) Neuer virtueller Eintrag AUTO (Vorgabe AN) — der Schalter fuer die
 *      Selbstverwaltung nach zwei Stunden Ruhe. Kein Daemon, nur ein Knopf;
 *      virtual:true laesst die Queen ihn ueberspringen, das Dashboard zeigt
 *      ihn, und der Zustand liegt in derselben Schalterdatei wie alles andere.
 *   c) STANEK bekommt showInDashboard:false. Er ist kein Schalter, den man
 *      sinnvoll bedient: ARSENAL schaltet ihn in dem EINEN Fenster je Lauf ein
 *      und er schaltet sich selbst wieder aus. Der Knopf lud nur dazu ein, ihn
 *      zur falschen Zeit zu druecken.
 *
 * v5.3 — BANK MUSS NICHT AUF home, SIE MUSS NUR VON DEN pservs WEG.
 *   Neues Registry-Merkmal meidePserv; pickHost() ueberspringt damit die
 *   pserv-Liste. BANK loescht pservs selbst (ns.cloud.deleteServer) und
 *   koennte sich dort abraeumen — das war der wahre Grund, nicht "home".
 *   Sie greift auf gar keine Datei zu, also bindet sie auch nichts an home.
 *   Gewinn: rund 30 GB auf home, wo als einziges die Kerne auf weaken/grow
 *   wirken.
 *
 *   NEBENBEFUND: das Feld `host` in der Registry wird NIRGENDS gelesen — nur
 *   `pinHost` wirkt. Es ist reine Dokumentation und sieht doch aus wie eine
 *   Anweisung. Beim Lesen der Tabelle nicht darauf hereinfallen.
 *
 * v5.2 — REGISTRY-EINTRAG BITNODE.
 *   Stufe 2 hat die ERLAUBNIS verdrahtet, einen Durchlauf zu beenden, und die
 *   HANDLUNG vergessen: am 13.09.2026 war "Operation Daedalus" erledigt, alle
 *   BlackOps durch — und nichts geschah. finishBitNode() ruft die Engine NUR
 *   aus der Bladeburner-Oberflaeche (BlackOpPage.tsx). Der skriptbare Weg ist
 *   ns.singularity.destroyW0r1dD43m0n(nextBN, cbScript), deren Bedingung ein
 *   ODER ist: Hacking+Adminrechte auf w0r1d_d43m0n ODER alle BlackOps durch.
 *
 *   DAEMON MIT defaultOff, NICHT ONE-SHOT. Ein One-Shot haenge an der
 *   WANT-Logik der Queen (siehe RESET-Sonderzweig); als Daemon heisst "aus"
 *   wirklich aus — das Skript laeuft dann gar nicht.
 *
 * v5.1 — PORT PLAN_OUT (28) UND planFreigabe().
 *   Die QUEEN liest `schwarm-plan.txt` und spiegelt die Freigabe, einen
 *   BitNode-Durchlauf zu beenden, auf diesen Port. EIN Port und keine Datei,
 *   weil ns.read NUR LOKAL liest — der BACKDOOR-Werker laeuft auf pserv und
 *   kaeme an eine Datei auf home nicht heran. Ports sind global.
 *
 *   planFreigabe() ist die gemeinsame Pruefung fuer alle Verbraucher. Drei
 *   Daemons, die dieselbe Pruefung je einzeln nachbauen, sind drei
 *   Gelegenheiten, sie falsch zu bauen — und ein Fehler kostet hier nicht eine
 *   Logzeile, sondern den Spielstand.
 *
 *   GEPRUEFT WIRD ueber die FRISCHE (PLAN_FRISCH_MS = 30 s), nicht ueber einen
 *   zweiten Node-Vergleich. Die Frist kann mehr: sie schuetzt auch davor, dass
 *   eine TOTE QUEEN eine alte Freigabe ewig stehen laesst. Die QUEEN schreibt
 *   in jedem Takt (2 s), 30 s sind reichlich Luft und trotzdem eine harte
 *   Obergrenze.
 *
 * v5.0 — DER EVAL-CACHE WAR EIN CACHE OHNE DECKEL.
 *   v4.0 hat den Skriptnamen in evalNsDetailed vom Zufall auf einen Hash DES
 *   BEFEHLS umgestellt, damit gleiche Befehle dieselbe Datei benutzen und das
 *   Spiel sie nur einmal kompiliert. Das wirkt — aber nur, solange der
 *   BEFEHLSTEXT wiederkehrt. Viele Aufrufer betten veraenderliche Werte in den
 *   Text ein: CORP Betraege (upgradeWarehouse/bulkPurchase/issueNewShares/
 *   bribe), WORK sogar GANZE LISTEN (`${J(augList)}` in der Aug-Bewertung).
 *   Jeder neue Wert ergibt einen neuen Hash, eine neue Datei — und die alte
 *   blieb FUER IMMER liegen. Niemand hat je eine geloescht.
 *
 *   GEMESSEN am 13.09.2026 ueber die Remote File API: 1216 Dateien auf home,
 *   davon 794 Stueck /Temp/schwarm-eval-*.js. Mit demselben djb2 wie unten
 *   nachgerechnet: von den 13 rein statischen Befehlen im ganzen Schwarm
 *   liegen 9 als Datei vor — die uebrigen 785 stammen aus Befehlen mit
 *   eingebetteten Werten. Ein Cache mit unbegrenztem Schluesselraum ist kein
 *   Cache, sondern ein Leck.
 *
 *   JETZT: jeder Prozess fuehrt Buch ueber SEINE Skripte (EVAL_CACHE_MAX) und
 *   loescht den aeltesten, sobald ein neuer dazukommt. Nur EIGENE — fremde
 *   Prozesse behalten ihren Cache, der Kompilier-Gewinn von v4.0 bleibt also
 *   erhalten. Kostet KEIN zusaetzliches GB: ns.rm steht in dieser Funktion
 *   ohnehin schon (Ausgabedatei), und ns.ls wird bewusst NICHT benutzt.
 *   Altbestand und Reste beendeter Prozesse gehen ueber
 *   `run SCHWARM-CLEAN.js --temp` weg (CLEAN v5.3).
 *
 * v4.9 — DER SCHALTER-ZUSTAND WAR AN home GEFESSELT.
 *   ns.read und ns.write haben KEINEN Server-Parameter; beide arbeiten auf dem
 *   Host des laufenden Skripts (NetscriptFunctions.ts:1077 und :1114). Die
 *   Datei schwarm-queen-state.txt liegt auf home — ein Daemon auf einem
 *   anderen Host findet dort nichts, faellt auf die Registry-Vorgaben zurueck
 *   und ignoriert seinen An/Aus-Knopf STILLSCHWEIGEND. Kein Fehler im Log,
 *   nichts im Bericht. Das hat bisher niemand gemerkt, weil alle sechs
 *   betroffenen Daemons auf home gepinnt sind — und genau das wollen wir
 *   aufloesen, damit home-RAM an das geht, was von Kernen profitiert.
 *
 *   NEU: Port STATE_OUT (27). Die Queen spiegelt den Zustand jeden Takt
 *   dorthin, readManagedState liest ZUERST die Datei und DANN den Port.
 *   Auf home aendert sich damit kein einziges Bit — das ist der Sinn der
 *   Reihenfolge. Auf jedem anderen Host greift der Spiegel.
 *
 *   DIE DATEI BLEIBT: Ports sind eine reine Speicher-Map (NetscriptWorker.ts:38)
 *   und stehen nicht im Spielstand — nach einem Neuladen sind sie leer. Ein
 *   reiner Port-Zustand wuerde jeden Reload vergessen.
 *
 *   LEERER PORT HEISST "UNBEKANNT", NIE "AUS". Nach einem Reload ist er fuer
 *   genau einen Queen-Takt leer; wer das als "aus" liest, schaltet in dieser
 *   Sekunde den ganzen Schwarm ab.
 *
 * v4.8 — HEALTHCHECK 11: RAM-BUDGETS NACHGEMESSEN.
 *   Acht Daemons gegen die heute von der Engine gemeldeten Werte gehalten:
 *     INFO 71/69,70   BANK 25/23,35   DISPATCHER 18/16,50   INFIL 15/13,70
 *     DARKNET 8/6,30  DASHBOARD 8/6,65  WORK 7/5,85  DIAG 7/5,90
 *   Alle acht haben denselben Puffer von 1,1 bis 1,7 GB — die Werte sind also
 *   gepflegt, nicht geraten. Kein Budget lag zu niedrig.
 *
 *   EINE DOKU-DRIFT: zwei Kommentare nannten "INFO.minRam 72 -> 74", im Code
 *   stehen 71. Die 71 ist richtig (Puffer 1,3 GB wie ueberall), die Kommentare
 *   waren veraltet und sind nachgezogen.
 *
 *   GEPRUEFT UND VERWORFEN: CORP mit minRam 5 sah bei 46 verschiedenen
 *   ns.corporation-Aufrufen zu niedrig aus. 47 der 53 Vorkommen stehen aber in
 *   ZEICHENKETTEN fuer evalNs — Wegwerf-Skripte, die den Daemon nichts kosten.
 *   Genau der Trick, den der CORP-Kopf beschreibt. Der Wert stimmt.
 *
 * v4.7 — HEALTHCHECK 2/6: EIN GESCHEITERTER SCHALTER SCHWIEG.
 *   setDaemonEnabled lieferte bei Fehlschlag sauber false — und JEDER Aufrufer
 *   warf den Wert weg, meist in einem stillen try/catch (RESET, STANEK, SCAN,
 *   QUEEN.readStateHealed). Der Schalterstand ist aber der folgenreichste
 *   gemeinsame Zustand im Schwarm: schlaegt das Schreiben fehl, glaubt der
 *   Daemon sich abgeschaltet, waehrend die Datei "an" sagt — und bei den
 *   One-Shots kann die einmalige Handlung dadurch erneut laufen.
 *   Jetzt wird gemeldet (hoechstens einmal je Minute und Schalter) UND
 *   zurueckgelesen: ns.write wirft nicht, wenn der Inhalt nicht ankommt.
 *
 * v4.6 — HENNE UND EI BEIM HACKNET.
 *   computeHashesWorthless entschied an einem VORHANDENEN Knoten. Ohne Knoten
 *   galt "nicht entscheidbar -> false". Daraus wurde eine geschlossene
 *   Schleife, die live auftrat:
 *     0 Knoten -> nicht entscheidbar -> hashesWorthless=false -> BANK bewertet
 *     Hacknet nach Hash-Ertrag -> Ertrag ist 0 (BN8) -> nie ein Kauf -> weiter
 *     0 Knoten.
 *   Der Nutzer musste den ersten Server von Hand kaufen, und nach dem naechsten
 *   Aug-Install war der Zustand wieder derselbe (prestigeAugmentation setzt das
 *   Hacknet zurueck). Der Infrastruktur-Modus aus BANK v4.9 konnte deshalb gar
 *   nicht anspringen — er haengt an genau diesem Wert.
 *
 *   Dabei steht die Antwort ohne jeden Knoten fest. Beide Produktionsformeln
 *   enden auf denselben Faktor (HacknetNodes.ts:10, HacknetServers.ts:16):
 *   currentNodeMults.HacknetNodeMoney. Ist er 0, ist die Produktion 0 — bei
 *   jedem Ausbaustand, fuer Nodes wie fuer Server. Mit SF5 wird jetzt dieser
 *   Multiplikator gefragt; ohne SF5 bleibt es bei der Messung am Knoten.
 *
 * v4.5 — announce() KANNTE "info" NICHT UND SCHWIEG DAZU.
 *   Die Funktion behandelte start, stop und error. Jeder andere Wert fiel durch
 *   alle Zweige und bewirkte NICHTS — kein Fehler, kein Hinweis. Benutzt wurde
 *   "info" trotzdem an vier Stellen, darunter zwei Meldungen des AUGS-Payloads
 *   ("Aug gekauft: <aug> @ <faction>" und "Aug-Install: N Stueck, danach
 *   <callback>"). Diese Meldungen hat nie jemand gesehen.
 *
 *   Das ist die unangenehmste Fehlerart: nichts stuerzt ab, nichts wird rot,
 *   die Zeile steht im Code und sieht richtig aus. Aufgefallen erst beim
 *   Nachlesen, warum eine neue Meldung aus QUEEN v7.2 nicht ankam.
 *
 *   ZUSAETZLICH: Der Dateikopf stand auf v4.4, die Konstante VERSION auf "4.3".
 *   Der Bericht meldete damit eine andere Fassung, als der Kopf behauptete.
 *
 * v4.4 — DIAG WIRD DAUERLAEUFER, LOGVIEW KOMMT DAZU.
 *   DIAG bekommt args [60, 2000, 0, 10]: Zyklen 0 heisst endlos, alle
 *   10 Minuten ein vollstaendiges Lagebild in eine eigene Datei. Vorher
 *   args: [] — Auftragsmodus, 4 Zyklen, danach Selbstabschaltung.
 *   LOGVIEW ist ein reiner Anzeiger (3 GB, defaultOff, showInDashboard).
 *   defaultOff bleibt bei BEIDEN: nach einem Prestige ist der Platz auf
 *   home knapp, und der gespeicherte Schalterstand ueberlebt den Reset
 *   ohnehin (schwarm-queen-state.txt liegt auf home).
 *
 * SCHWARM-HELPERS.js — v4.3
 *
 * v4.3 — REGISTRY AUF DIE GEMESSENEN WERTE. minRam war Schaetzwerk; die
 *   Brücke liefert seit 04.09. den exakten Bedarf aus calculateRam, also vom
 *   Spiel selbst. DREI Daemons waren UNTERdeklariert — die Queen reservierte
 *   weniger, als ns.exec braucht, und der Start haette auf einem knappen Host
 *   scheitern muessen:
 *       HACKING  16 -> 18   (gemessen 16,50)
 *       BANK     16 -> 25   (gemessen 23,35)
 *       TRADER   32 -> 39   (gemessen 37,45)
 *   Die uebrigen waren zu grosszuegig und blockierten Platz: RESET 96 -> 14,
 *   STANEK 64 -> 29, AUGS 32 -> 8, CORP 8 -> 5 (nach der Umbenennung 3,20).
 *   Alle Werte: gemessener Bedarf aufgerundet plus 1 GB Luft.
 *
 *   burst blieb unangetastet — das ist der Puffer fuer die evalNs-Wegwerf-
 *   skripte und haengt am teuersten API-Aufruf, nicht am statischen Bedarf.
 *
 * SCHWARM-HELPERS.js — v4.2
 *
 * v3.7 — readPortfolioHeld(): ANZAHL offener TRADER-Positionen, getrennt vom
 *   Wert. readPortfolioValue liefert 0, sobald das Depot negativ ist (Short
 *   unter Wasser), und BANK schloss daraus faelschlich auf "leer" — siehe
 *   SCHWARM-BANK v3.4. Ausserdem INFO.minRam angehoben (heute: 71): die Fehler-Chronik in
 *   SCHWARM-INFO v1.5 bringt drei APIs zu je 0.2 GB mit.
 *
 * v3.6
 * Zentrale Bibliothek des Kybernetik-Schwarms (Bitburner v3.0.1).
 *
 * ===========================================================================
 * v3.6 — ZEITSTEMPEL AUF PORT 6 (RESERVATION)
 * ===========================================================================
 *
 * PROBLEM: Port 6 ist ein peek-Port ohne Zeitstempel. Der Dispatcher konnte
 * "die Queen hat gerade eben geschrieben" nicht von "der Wert steht hier seit
 * einer Stunde" unterscheiden. Seine Notbremse dagegen (RESERVE_STALE_MS, 180 s)
 * mass deshalb die falsche Groesse: sie startete ihre Uhr, sobald ein Host ZUERST
 * in der Reservierung auftauchte, und lief dann durch — auch wenn die Queen die
 * Reservierung jeden 2-s-Takt frisch schrieb. Live sichtbar als
 *     "! abgelaufene Reservierung ignoriert"
 * bei kerngesunder Queen: alle 180 s wurde eine voellig legitime 96-GB-Reservierung
 * auf home fuer einen Takt verworfen, und die Diagnose meldete einen Fehler, den
 * es nicht gab.
 *
 * LOESUNG: publishReservations haengt einen Marker "@:<ms>" an. readReservations
 * liefert unveraendert { host: gb } (der Marker wird uebersprungen) — DIAG und
 * jeder andere Leser merken davon nichts. Wer das Alter braucht, nimmt
 * readReservationsAt(). Fehlt der Marker (aeltere Queen/HELPERS auf einem
 * Fremdhost), liefert sie 0 = "Alter unbekannt"; der Dispatcher wendet dann keine
 * Deadline an und verlaesst sich auf die Lebendpruefung der Queen per ps().
 *
 * v3.5.1 — DASHBOARD.minRam 24 -> 16 (siehe Registry-Eintrag)
 * v3.5 — DASHBOARD-UMBAU (Overview-HUD + SCAN-One-Shot)
 * ===========================================================================
 *
 * NEUE REGISTRY-EINTRAEGE:
 *   OVERVIEW — VIRTUELLER Eintrag (file: null, virtual: true), exakt nach dem
 *     Muster von SLEEVES. Es gibt KEINEN Prozess: das DASHBOARD rendert den
 *     Overview-HUD selbst (es hat den DOM-Zugriff und erhebt die Zahlen
 *     ohnehin). Der Eintrag existiert ausschliesslich, damit im Dashboard ein
 *     An/Aus-Schalter erscheint und sein Zustand in der State-Datei landet.
 *     BEGRUENDUNG gegen einen eigenen Prozess: ein zweiter HUD-Daemon muesste
 *     getMoneySources (1.0) + stock.* (~2.5) + hacknet.* (1.0) + getResetInfo
 *     (1.0) ein ZWEITES Mal bezahlen — rund 7 GB doppelt, plus einen weiteren
 *     Port oder eine zweite Erhebung derselben Zahlen. Beide brauechten zudem
 *     pinHost "home" (DOM). Der einzige Vorteil waere Unabhaengigkeit von einem
 *     Dashboard-Absturz; das wiegt 7 GB nicht auf.
 *     KEIN defaultOff -> Standard AN.
 *   SCAN — echter One-Shot-Payload (interaktive Netzkarte im Terminal).
 *     pinHost "home" (braucht das Terminal-DOM), defaultOff, oneshotDaemon,
 *     showInDashboard. Der Payload schaltet sich SELBST wieder aus
 *     (setDaemonEnabled(ns,"SCAN",0) als erste Aktion) — sonst wuerde die Queen
 *     ihn im 2-s-Takt endlos neu starten, weil owner "QUEEN" + Schalter=1 in
 *     shouldRun() jeden Takt true ergibt. RESET loest dasselbe Problem ueber
 *     einen Sonderzweig in der Queen; das Selbst-Aus-Muster (wie DIAG) kommt
 *     ohne Queen-Patch aus.
 *
 * GEAENDERT: DASHBOARD.minRam 8 -> 24. Der alte Planwert war schon vor dem
 *   Umbau zu niedrig (getMoneySources 1.0 + stock ~2.5 + hacknet 1.0 + corp +
 *   Basis 1.6); mit dem HUD kommen getTotalScriptIncome/ExpGain (2x0.1),
 *   getSharePower (0.2), getResetInfo (1.0) und hacknet.numNodes (0.5) dazu.
 *   Die Queen misst den echten Bedarf per getScriptRam — minRam ist nur der
 *   Planwert fuer die Reservierung, aber ein zu kleiner Planwert reserviert zu
 *   wenig und der Start scheitert still.
 *
 * ===========================================================================
 * v3.4 — Port 32 GANG_INFO, Port 33 HASH_INFO
 * ===========================================================================
 *
 * Zwei reine ANZEIGE-Kanaele fuer das Dashboard (niemand handelt darauf):
 *   32 GANG_INFO — GANG meldet Territorium/Power/Win-Chance je Territory-Tick.
 *   33 HASH_INFO — HASHNET meldet Bestand/Kapazitaet/Produktion und den
 *      KUMULIERTEN Hash-Verbrauch. Letzterer ist noetig, weil es fuer Hashes
 *      keine getMoneySources-Entsprechung gibt und die naheliegende Schaetzung
 *      "Produktion minus Bestandsaenderung" falsch wird, sobald der Pool am Cap
 *      steht — dort verpuffen Hashes, statt ausgegeben zu werden.
 *
 * ===========================================================================
 * v3.1.1 — LIVE-MEM-NACHZIEHER (INFO-Registry)
 * ===========================================================================
 *
 * INFO.minRam 80 -> 72: Live-`mem` von SCHWARM-INFO ergab 101,55 GB, davon
 * 38 GB Phantomkosten durch eine RAM-ANALYSE-FALLE in dessen Kostentabelle
 * (Member-Zugriffe `X.getFactionRep` zählen wie echte API-Aufrufe — egal auf
 * welchem Objekt; String-Inhalte und Property-Keys zählen dagegen NICHT).
 * Nach dem Fix (SCHWARM-INFO v1.0.1, neutrale Tabellen-Keys): 63,55 GB,
 * SF4-Level-unabhängig. MERKSATZ für alle künftigen Schwarm-Dateien: keine
 * Objekt-Properties nach ns-Funktionen benennen, wenn per Punkt zugegriffen wird.
 *
 * ===========================================================================
 * v3.1 — INFO-DAEMON-ANBINDUNG (Ports 28/29/30)
 * ===========================================================================
 *
 * NEU: SCHWARM-INFO.js ist die zentrale Quelle für teure Reads ("eine Quelle,
 * alle lesen") und — ab WORK v2 / BANK v-next — Ausführer seltener Singularity-/
 * Kauf-Aktionen (RPC). HELPERS liefert dafür nur die dünne Anbindung:
 *   - SCHWARM_PORTS: INFO_SNAPSHOT 28 (peek, Multiplex-JSON aller Blöcke),
 *     INFO_RPC_REQ 29 (FIFO, {c,id,cmd,a,t}), INFO_RPC_RES 30 (peek, Ergebnisse
 *     je consumer/id). Portnummern sind in der Engine beliebige positive
 *     Integers (NetscriptPort.ts) — es gibt KEIN 20er-Limit; die "50" in den
 *     Settings ist die Warteschlangentiefe JE Port.
 *   - Neue Sektion 5e2: readInfoSnapshot / readInfoBlock (mit maxAgeMs-
 *     Altersprüfung!) / requestInfoAction / readInfoActionResult. Alles reine
 *     peek/tryWrite-Helfer, 0 GB — der statische Fußabdruck der Importer
 *     ändert sich NICHT.
 *   - detectCapabilities(): SF-Level kommen jetzt ZUERST aus dem INFO-Snapshot
 *     (Block "bn", 0 GB, mit lastNodeReset-Stale-Schutz); der evalNs-RAM-Dodge
 *     bleibt Fallback, der Sticky-Schutz letzte Sicherung. BitNode-Nummer
 *     direkt aus ns.getResetInfo() statt per Wegwerf-Skript. Effekt: Läuft
 *     INFO, erzeugt der SENSE-Takt der Queen KEINE Temp-Skripte mehr.
 *   - REGISTRY: neuer Eintrag INFO (owner QUEEN, host "pserv", minRam 80
 *     Planwert, burst 176 = Eval-Headroom; Details am Eintrag). Dashboard
 *     zeigt den Button automatisch (alle Nicht-oneshot-Daemons).
 *
 * ===========================================================================
 * v3.0 — MELDEWEG-UMBAU, TOPOLOGIE-CACHE, LEBENSZYKLUS
 * ===========================================================================
 *
 * GRUNDPRINZIP (neu, gilt schwarmweit):
 *   Ein Daemon, der einen anderen Daemon/Payload starten will, DEPLOYT NICHT
 *   SELBST. Er MELDET seinen Wunsch der Queen (Port 22, "WANT:KEY"). Die Queen
 *   ist alleiniger Deployer: sie prüft Freigabe + Capability, wählt den Host,
 *   sagt dem Dispatcher über Port 6, wieviel RAM dort freizumachen ist,
 *   materialisiert den Payload und startet ihn.
 *       Owner  -> Port 22 (WANT) -> QUEEN -> Port 6 (RESERVATION) -> DISPATCHER
 *   Damit gibt es genau EINEN Deploy-Pfad und EINEN Reservierungs-Pfad.
 *
 *   AUSNAHME (bewusst): Der DISPATCHER darf seine eigenen kurzlebigen One-Shots
 *   (SOLVER, BACKDOOR) direkt starten. Er IST der RAM-Eigentümer — er nimmt sich
 *   Platz aus dem eigenen Pool und kann sich selbst nichts wegschnappen.
 *
 * NEUE PORTS:
 *   22 SPAWN — Owner -> Queen: "WANT:KEY" (idempotent, ~alle 10 s wiederholen)
 *              bzw. "DROP:KEY" (abbestellen). FIFO, konsumierend.
 *   23 SHARE — WORK -> Dispatcher: "Faktions-Grind aktiv" (Zeitstempel; läuft
 *              nach SHARE_MAX_AGE_MS von selbst aus, falls WORK stirbt). peek.
 *   24 TOPO  — beliebig -> alle: Topologie hat sich geändert ("pserv"/"cracker"/
 *              "darknet"). Konsumierend; invalidiert den Topologie-Cache.
 *
 * ENTFALLENE PORTS:
 *   7  WORKERS       — war toter Code (niemand schrieb/las ihn).
 *   10 BACKDOOR_BUSY — ÜBERFLÜSSIG. Engine-Beweis (Singularity.ts:548):
 *                      installBackdoor() nutzt netscriptDelay() und blockiert nur
 *                      den AUFRUFENDEN SKRIPT-PROZESS, nicht Player.currentWork.
 *                      Es gibt keinen startWork()-Aufruf -> KEINE Kollision mit
 *                      Crime/Gym/Faction-Arbeit. WORK legte bisher grundlos die
 *                      Arbeit nieder, sobald der Backdoor-Payload lief.
 *   11 BACKDOOR_PEND — überflüssig: der Dispatcher ist jetzt selbst BACKDOOR-Owner
 *                      (er kennt Root-Status + Hacking-Level ohnehin) und muss der
 *                      Queen nichts mehr melden.
 *
 * TOPOLOGIE-CACHE (schwarm-topo.txt):
 *   requiredHackingSkill und numOpenPortsRequired sind laut Engine (Server.ts:73/87)
 *   STATISCH je BitNode. maxRam ist NUR bei home / pserv-* / hacknet-* dynamisch.
 *   Also: EIN BFS beim Start, danach Neubau nur bei Ereignis (Prestige, pserv-Kauf,
 *   neuer Cracker, Darknet-Server) oder alle TOPO_MAX_AGE_MS als Sicherheitsnetz.
 *
 * ROOTING (nukeIncremental):
 *   GEÄNDERT: rootet SO FRÜH WIE MÖGLICH — nur die Ports zählen (ns.nuke prüft
 *   KEIN Hacking-Level). Das alte nukeAll war identisch, der Dispatcher-eigene
 *   autoNuke() dagegen wartete zusätzlich aufs Level und verschenkte damit RAM.
 *   Vereinheitlicht auf "früh rooten". Der Backdoor-Payload gated separat aufs
 *   Level (netscriptCanHack verlangt requiredHackingSkill <= hackingLevel).
 *   Zudem: Opener-Dateien werden EINMAL geprüft (refreshCrackers), nicht je Host×5.
 *
 * LEBENSZYKLUS:
 *   ensureSingleInstance(ns)  — ersetzt 4 identische Doppelstart-Blöcke.
 *   announce(ns, kind, msg)   — kurze tprint-Zeile bei Start/Stop. Tail NUR bei
 *                               Fehler. Alle Auto-Tails sind raus (Doktrin).
 *
 * DEPLOY:
 *   deployDaemon() ist HOST-AGNOSTISCH: Quelle = ns.getHostname() statt hart
 *   "home". Damit kann die Queen auf einem beliebigen Host laufen.
 *
 * REGISTRY:
 *   - SCAN entfernt (toter Eintrag: Payload "SCAN" existierte nie).
 *   - BACKDOOR: owner "HACKING" (Dispatcher) statt "QUEEN".
 *   - deployDaemon-Fehlertext-Default korrigiert (|| 0 statt || 16).
 *
 * ===========================================================================
 *
 * Änderung ggü. v2.6 (PAYLOAD-UMBAU — Konsolidierung auf wenige home-Dateien):
 *   - REGISTRY neu geschnitten. Neue Felder je Daemon:
 *       owner   — wer den Daemon startet/stoppt: "QUEEN" | "BANK" | "WORK" |
 *                 "DASHBOARD". Ersetzt die früher fest in der Queen verdrahteten
 *                 PERSISTENT/TRIGGERED-Listen; diese werden jetzt aus owner
 *                 abgeleitet. Ökonomie-Payloads (TRADER/AUGS) führt BANK,
 *                 Kinetik-Payloads (BLADEBURNER/GANG) führt WORK, GO führt die
 *                 Queen, SCAN das Dashboard.
 *       payload — Schlüssel in SCHWARM-PAYLOADS.js (neu). Ein Daemon mit payload
 *                 liegt NICHT als lose Datei auf home, sondern wird vom Besitzer
 *                 bei Bedarf aus dem kodierten Quell-Speicher materialisiert.
 *       oneshot — Einmal-Anzeige (SCAN), kein Dauer-Daemon.
 *   - ENTFERNT: Key INFRA (Hacknet-/pserv-Logik in BANK gemergt — ein Prozess
 *     weniger auf home), Key FACTIONS (tot, durch WORK ersetzt), Key SOLVER
 *     (tot; der Dispatcher materialisiert seinen Solver jetzt aus PAYLOADS,
 *     dedupliziert die zweite Solver-Kopie). SCHWARM-HASHNET.js war bereits tot
 *     (Logik längst in BANK) und ist damit endgültig raus.
 *   - HINZU: Key SCAN (SCHWARM-SCAN.js, aus scan.js), Key GO/TRADER/AUGS/
 *     BLADEBURNER/GANG/BACKDOOR tragen jetzt payload-Schlüssel.
 *   - DARKNET: deps auf schwarm-dnet-helpers.js/schwarm-roamer.js entfernt —
 *     Lib + Roamer wandern in EINE Datei SCHWARM-DARKNET.js (Roamer eingebettet).
 *   - pickHost() setzt jetzt selbst pinHost durch (vorher nur die Queen). BANK
 *     erbt INFRAs Henne-Ei-Schutz (baut die pservs) via pinHost:"home";
 *     relocateFromHome() lässt alle pinHost-Daemons (BANK/CORP/DARKNET) auf home.
 *   - NEU: STATE_FILE + readManagedState()/isDaemonEnabled() — geteilter Leser
 *     der Queen-State-Datei, damit die Besitzer (BANK/WORK) den An/Aus-Zustand
 *     ihrer Payloads kennen, ohne dass die Queen-Buttons ihre Wirkung verlieren.
 *   - NEU: decodePayload() — Runtime-Gegenstück zur kollisionsfreien Payload-
 *     Kodierung (Backtick -> __SCHWARM_BT__, ${ -> __SCHWARM_DC__; reines ASCII,
 *     copy-paste-sicher). Erlaubt das Einbetten beliebiger Skripte als String
 *     ohne manuelles Escapen; No-Op auf bereits sauberen Quellen.
 *   - AUFRAEUMEN (Payload-Daemon-Durchgang): GANGS.payload = "GANGS" (payload-Key
 *     == Registry-Key, damit die Launcher BANK/WORK den Registry-Key durchreichen
 *     koennen). Toter const BACKDOOR_PAYLOAD entfernt — liegt jetzt in
 *     SCHWARM-PAYLOADS.js (Schluessel "BACKDOOR_PAYLOAD").
 *   HINWEIS: Historische Kommentare unten nennen teils noch "HASHNET"/"INFRA".
 *   Die Port-Belegung (8/9) bleibt gültig; Leser ist jetzt BANK statt HASHNET.
 *
 * Änderung ggü. v2.5:
 *   - Hash-Bedarf: Bedarfs-Bus an BANK_IN (Port 6), Präfix "HASH|".
 *     (Stand ursprünglich als eigener Port 8; der Verteiler wurde nie ein
 *     eigener Daemon, die BANK übernimmt ihn.)
 *     FIFO mit mehreren Schreibern (CORP, WORK, später BLADEBURNER melden
 *     ihren Hash-Bedarf), EIN Leser (SCHWARM-HASHNET.js). Kein peek-Snapshot
 *     wie Treasury, weil mehrere Produzenten sich sonst gegenseitig
 *     überschreiben würden.
 *   - Neue Funktionen publishHashNeed() / drainHashNeeds() (Abschnitt 5b).
 *     Produzenten melden periodisch; der Verteiler hält den letzten Stand je
 *     Produzent und verwirft veraltete Meldungen (Staleness im Verteiler).
 *   - Neuer Port 9 (HASHCACHE): Rückkanal HASHNET -> INFRA. HASHNET meldet die
 *     Hash-Kosten seines teuersten GEWÜNSCHTEN Ziels (peek, ein Wert); INFRA
 *     vergrößert den Cache, sobald die Kapazität dieses Ziel + Buffer nicht
 *     fasst. Funktionen publishHashCacheNeed() / readHashCacheNeed().
 *   - Neuer Registry-Eintrag HASHNET -> SCHWARM-HASHNET.js. deps nur
 *     SCHWARM-HELPERS.js. burst 0, KEIN burstDaemon: alle ns.hacknet.*-Calls
 *     kosten nur 0,5 GB (RamCostConstants.Hacknet) und laufen direkt (Hot-
 *     Path-Doktrin) — kein RAM-Dodge nötig, keine Singularity-Calls (WORK
 *     meldet Firma/Tätigkeit selbst über Port 8). cap null: der Daemon pollt
 *     harmlos und schläft, solange keine Hash-Server existieren.
 *
 * Änderung ggü. v2.4:
 *   - Registry-Eintrag GO -> SCHWARM-GO.js (SCHWARM-nativer IPvGO-Daemon, ersetzt
 *     das Fremdskript go.js — go.js bleibt als Datei erhalten, wird aber nicht mehr
 *     geführt). deps [] (standalone, kein helpers.js). burst 0 und KEIN burstDaemon:
 *     der Hot-Path (getBoardState 4 GB + makeMove 4 GB) läuft direkt; die teure
 *     Analysis-API entfällt komplett (Ketten/Freiheiten/Territorium in JS = 0 GB).
 *     minRam 12 (nur Fallback; die Queen misst per getScriptRam). Der Cheat-Pfad
 *     (SF14.2) läuft als String-Payload und feuert ohne SF14.2 nie -> kein Burst
 *     nötig. cap null (IPvGO ist immer verfügbar). Der Dashboard-Go-Button
 *     (START:GO/STOP:GO) startet damit automatisch den neuen Daemon — die Queen
 *     ist rein registry-getrieben und musste NICHT angefasst werden.
 *
 * Änderung ggü. v2.3:
 *   - Registry-Eintrag GANGS -> SCHWARM-GANG.js (SCHWARM-nativer Gang-Manager,
 *     ersetzt das Fremdskript gangs.js). deps nur noch SCHWARM-HELPERS.js (kein
 *     helpers.js). burstDaemon: true + burst 8, weil NUR die seltenen, optionalen
 *     Singularity-Calls (requiredRep/factionRep/GangSoftcap) per evalNs als
 *     Wegwerf-Skripte laufen; die Gang-API selbst wird direkt aufgerufen (Hot-
 *     Path). minRam 38 statt 16: direkte ns.gang.*-Calls tragen ~32 GB statisch,
 *     dafür entfällt der große Temp-Skript-Burst des Altskripts (war 40) — in
 *     Summe RAM-günstiger (vorher 16+40=56, jetzt 38+8=46). cap CAPS.GANG
 *     unverändert. FACTIONS-Eintrag bleibt (Dashboard-Konsistenz), wird von der
 *     Queen ohnehin nicht mehr geführt — kein Konflikt mit WORK.
 *
 * Änderung ggü. v2.2:
 *   - Neuer Registry-Eintrag CORP -> SCHWARM-CORP.js. pinHost "home" (die
 *     Blaupausen-Datei schwarm-corp-state.txt muss pserv-Rebuilds und Prestige
 *     überstehen — wie bei DARKNET). burstDaemon: true + burst 24, weil ALLE
 *     Corp-Calls per evalNs als Wegwerf-Skripte laufen (Action 20 GB + Basis).
 *     cap CAPS.CORP (detectCapabilities setzt das Flag bei SF3/BN3). Damit
 *     erbt CORP den generischen An/Aus-Schalter der Queen (STOP:CORP /
 *     START:CORP / FORCE:CORP auf Port 1) und der freigehaltene Burst-
 *     Headroom schützt evalNs künftig vor dem Dispatcher (vorher Glückssache).
 *
 * Änderung ggü. v2.1:
 *   - Neuer Registry-Eintrag WORK -> SCHWARM-WORK.js (SCHWARM-nativer Arbeits-
 *     Daemon, ersetzt das Fremdskript work-for-factions.js / Key FACTIONS in der
 *     Queen-Führung). burstDaemon: true (nutzt evalNs für teure Singularity-
 *     Sweeps), burst 24 wie BLADEBURNER, cap CAPS.SING. Der FACTIONS-Eintrag
 *     bleibt vorerst bestehen (Dashboard-Konsistenz), wird aber von der Queen
 *     nicht mehr geführt.
 *
 * Änderung ggü. v2.0:
 *   - BLADEBURNER-Registry zeigt jetzt auf SCHWARM-BLADEBURNER.js (SCHWARM-native,
 *     standalone, KEIN helpers.js mehr). Neuer Marker `burstDaemon: true`, da die
 *     Burst-Erkennung der Queen sonst an `helpers.js in deps` hängt.
 *
 * Doktrin: Port-basierte IPC mit Delimited-Strings (kein In-Game-JSON auf Ports).
 * Stabilität > Komplexität: jede Funktion ist try…catch-isoliert und darf
 * den Aufrufer (insbesondere die Queen) niemals crashen.
 *
 * Sektionen:
 *   1. KONFIGURATION  — Ports, Phasen, Capability-Flags, Daemon-Registry, Treasury, Aug-Politik
 *   2. PORT-IPC       — String-Befehlsbus (Queen <-> Worker, Ports 1+2)
 *   3. PHASEN         — Bootstrap-Phasen-Signal (Port 3, peek, ein Wert)
 *   4. CAPABILITY     — Freischaltungs-Broadcast (Port 4, Delimited-String)
 *   5. TREASURY       — Geld-Politik (Port 5) + reserve.txt-Bridge für Drittskripte
 *   6. NETZWERK       — BFS-Scan, Auto-Nuke, RAM-Map
 *   7. DEPLOY         — Daemon-Verteilung auf Hosts (scp + exec, Registry-gesteuert)
 *   8. RAM-DODGE      — getSchwarmData() (gebündelte Billig-Calls)
 *   9. FORMAT         — Geld / Zahl / RAM / Dauer
 *
 * BREAKING CHANGE ggü. v1: DAEMONS ist jetzt eine Objekt-Registry (Datei, Host,
 * RAM, Args, Capability je Daemon). Nur Queen & Dashboard nutzen sie — beide
 * werden neu gebaut. CAPABILITY_GATE bleibt als abgeleiteter Export erhalten.
 * GENESIS / CASINO / ARSENAL sind nicht betroffen (deren Importe unverändert).
 *
 * @param {NS} ns
 */
// Eine Quelle fuer Kopf und Laufzeitmeldung. Bis zum Health-Check am
// 04.09.2026 waren das getrennte Freitexte und liefen auseinander: der
// Kopf sagte eine Version, die Startmeldung im Log eine andere. Beim
// Nachstellen eines Fehlers behauptet das Log damit etwas Falsches.
const VERSION = "5.16";


// =============================================================================
// 1. KONFIGURATION
// =============================================================================

/**
 * PORT-BELEGUNG — POSTFACH-MODELL (v4.0, vollstaendige Neuvergabe)
 * ===========================================================================
 *
 * WARUM DER UMBAU. Bis v3.6 bekam jeder Kanal seine eigene Nummer, und wer
 * einen neuen brauchte, nahm die naechste freie. Das ist ZWEIMAL schiefgegangen:
 *
 *   Port 19 — RESET_READY gegen DARKNET-Roamer-Telemetrie (behoben in v3.3).
 *   Port 34 — DARKNET-Arbeitsauftraege gegen TRADER-Beeinflussungsziele. Beide
 *             Schreiber machten clear()+tryWrite() im Sekundentakt und haben
 *             sich gegenseitig ueberschrieben; im Livereport war das als
 *             "manipZiele 6 -> —" sichtbar (behoben mit dieser Version).
 *
 * Beide Male war die Ursache dieselbe: ein Daemon fuehrte seine Portnummer
 * LOKAL als Konstante, und die zentrale Tabelle wusste nichts davon. Ein
 * Umnummerieren allein haette das nicht verhindert — es braucht eine Regel,
 * unter der eine Kollision gar nicht erst entstehen KANN.
 *
 * DIE REGEL
 * ---------
 *   Jeder Daemon hat genau ZWEI Ports: einen AUSGANG und einen EINGANG.
 *
 *     AUSGANG (UNGERADE Nummer, peek)
 *         GENAU EIN Schreiber — der Daemon selbst. Beliebig viele Leser.
 *         Inhalt ist EIN JSON-Objekt mit benannten Feldern; jedes frueher
 *         eigenstaendige Signal ist heute ein Feld darin.
 *
 *     EINGANG (GERADE Nummer, FIFO)
 *         Beliebig viele Schreiber, GENAU EIN Leser — der Daemon selbst.
 *         Enthaelt EREIGNISSE, keine Zustaende.
 *
 *   Daraus folgt unmittelbar: zu jeder ungeraden Nummer gehoert genau ein
 *   schreibender Prozess. Zwei Schreiber auf einem Ausgang sind kein
 *   Fluechtigkeitsfehler mehr, sondern ein Regelbruch, den man beim Lesen
 *   der Tabelle sofort sieht.
 *
 * ZUSTAND ODER EREIGNIS?
 * ----------------------
 *   Die Trennlinie, an der entschieden wird, wohin ein Signal gehoert:
 *
 *     ZUSTAND  — "wieviel Geld ist frei", "welches Aug soll gekauft werden",
 *                "liquidiere bis auf X". Gilt, bis er sich aendert; ein
 *                verpasster Takt ist egal, Ueberschreiben ist harmlos.
 *                -> Feld im AUSGANG des Besitzers. Der Leser holt es sich.
 *
 *     EREIGNIS — "starte TRADER", "ich beantrage $5m", "Roamer meldet Fund".
 *                Darf nicht verlorengehen, wird genau einmal verarbeitet.
 *                -> EINGANG des Empfaengers.
 *
 *   Deshalb liegt der Liquidations-Auftrag (BANK -> TRADER) NICHT in TRADERs
 *   Eingang, sondern als Feld in BANKs Ausgang: er ist ein Zustand, kein
 *   einmaliges Kommando. Und deshalb liegt ein WANT im Eingang der Queen und
 *   nicht im Ausgang des Owners.
 *
 * DREI AUSNAHMEN (19-21)
 * ----------------------
 *   Diese Kanaele werden in einer 2-Sekunden-Schleife gelesen. Laegen sie als
 *   Feld in einem Sammel-JSON, muesste der Leser je Takt das GANZE Objekt
 *   parsen, nur um eine Zahl zu bekommen — bei INFO_RPC_RES waere das der
 *   13-Bloecke-Snapshot, das teuerste JSON im System. Jede Ausnahme traegt
 *   ihre Begruendung am Eintrag; es sind bewusst genau drei.
 *
 * PAYLOAD-DAEMONS
 * ---------------
 *   TRADER, GANGS, GO, BLADEBURNER, AUGS, RESET, SCAN und BACKDOOR sind
 *   standalone und koennen HELPERS NICHT importieren — GENAU DESHALB standen
 *   ihre Portnummern frueher als Literale im Quelltext, und genau daher kam
 *   die 34er-Kollision. Sie tragen jetzt am Kopf die Marke  __PORTS__  in
 *   einem Blockkommentar; materialize() (SCHWARM-PAYLOADS.js) ersetzt sie beim
 *   Schreiben durch DIESE Tabelle. Ein Payload kann damit nicht mehr driften.
 *   SCHWARM-DARKNET.js macht dasselbe fuer Roamer, Lab und Cracker.
 *
 * EINE NUMMER AUSSERHALB DIESER TABELLE IST EIN FEHLER. Es gibt keine zweite
 * Port-Tabelle mehr — DNET_PORTS ist ersatzlos entfallen — und keine lokalen
 * Port-Konstanten in Einzeldateien.
 */
export const SCHWARM_PORTS = {
    // ═══ POSTFAECHER ═══════════════════════════════════════════════════════
    //     ungerade = AUSGANG (peek, EIN Schreiber) · gerade = EINGANG (FIFO)

    /** QUEEN -> alle (peek, JSON). Felder: phase, caps, treasury.
     *  Frueher drei Ports (3 PHASE, 4 CAPABILITY, 5 TREASURY). Alle drei
     *  schreibt ausschliesslich die Queen, alle drei werden selten gesetzt
     *  (SENSE-Takt, 16 s) und oft gelesen — der klassische Zustand. */
    QUEEN_OUT: 1,
    /** alle -> QUEEN (FIFO). Ereignisse im Format "VERB:ARG":
     *    STOP/START/FORCE/PRE_RESET/RESUME  (Dashboard)
     *    WANT/DROP                          (Owner: BANK, WORK)
     *  Frueher zwei Ports (1 COMMAND, 22 SPAWN). Die Queen zog beide ohnehin
     *  im selben Takt; jetzt EIN Durchgang, der klassifiziert
     *  (drainQueenInbox). */
    QUEEN_IN: 2,

    /** DISPATCHER -> alle (peek, JSON). Deploy-Snapshot: Tick, RAM je Klasse,
     *  Ziele, execOk/execFail, Deckel. Leser: DASHBOARD, DIAG. */
    DISP_OUT: 3,
    /** alle -> DISPATCHER (FIFO). Heute ungenutzt — reserviert, damit das
     *  Paarmuster geschlossen bleibt. Kandidat: gezielte Ziel-Vorgaben. */
    DISP_IN: 4,

    /** BANK -> alle (peek, JSON). Felder:
     *    info       Kennzahlen (Spartopf, Reserve, frei, Grossziel)   [war 14]
     *    grants     erteilte Freigaben je Consumer                    [war 13]
     *    resetReady Aug-Install faellig -> QUEEN                      [war 11]
     *    augBuy     Kaufauftrag -> AUGS                               [war 18]
     *    liquidate  zu liquidierende Summe -> TRADER                  [war 27]
     *    hashCache  teuerstes gewuenschtes Hash-Ziel                  [war  9]
     *    hash       Bestand/Kapazitaet/Produktion/Verbrauch -> DASHBOARD
     *               [war 33 HASH_INFO; der Port hatte seit dem Tod von
     *                SCHWARM-HASHNET keinen Schreiber mehr, das Dashboard
     *                zeigte dauerhaft nichts an. BANK ist heute der einzige
     *                spendHashes-Aufrufer und damit der richtige Besitzer.] */
    BANK_OUT: 5,
    /** alle -> BANK (FIFO). Ereignisse, zwei Sorten, am Praefix unterscheidbar:
     *    "REQ|..."   Antrag auf eine grosse Anschaffung   [war 12 BANK_REQ]
     *    "HASH|..."  Hash-Bedarf eines Produzenten        [war  8 HASHNEED]
     *  Zusammengelegt, weil beides "ein Consumer bittet BANK um eine knappe
     *  Ressource" ist und BANK beide im selben Takt abarbeitet. */
    BANK_IN: 6,

    /** WORK -> alle (peek, JSON). Felder:
     *    repZiel  welche Faktion WORK gerade farmt (INFORMATIV)       [war 17]
     *  Rein diagnostisch: niemand handelt darauf. Die Richtung wurde in v3.5
     *  gedreht — vorher schickte BANK hierher ein Ziel und ueberstimmte WORKs
     *  eigene Rangliste, ohne CANNOT_WORK, Gang-Faktion oder Mitgliedschaften
     *  zu kennen. */
    WORK_OUT: 7,
    /** alle -> WORK (FIFO). Heute ungenutzt — reserviert. */
    WORK_IN: 8,

    /** INFO -> alle (peek, JSON). Felder:
     *    blocks   Multiplex-Snapshot aller Info-Bloecke               [war 28]
     *  Die RPC-ERGEBNISSE liegen bewusst NICHT hier, sondern auf 21 — siehe
     *  dort. */
    INFO_OUT: 9,
    /** Consumer -> INFO (FIFO). Aktions-RPC {c,id,cmd,a,t}.           [war 29] */
    INFO_IN: 10,

    /** TRADER -> alle (peek, JSON). Felder:
     *    portfolio  liquidierbarer Wert in $ -> BANK                  [war 26]
     *    manip      Beeinflussungsziele [{org,dir,val}] -> DISPATCHER  [war 34]
     *    promote    Symbole fuer Volatilitaets-Promote -> DARKNET-Roamer [war 21]
     *  Die drei Felder gehoerten schon immer EINEM Schreiber; als drei
     *  verstreute Ports war "manip" auf derselben Nummer gelandet wie DARKNETs
     *  Auftragskanal. */
    TRADER_OUT: 11,
    /** alle -> TRADER (FIFO). Heute ungenutzt — der Liquidations-Auftrag ist
     *  ein ZUSTAND und steht deshalb in BANK_OUT.liquidate, nicht hier. */
    TRADER_IN: 12,

    /** DARKNET -> alle (peek, JSON). Felder:
     *    status  Lage-Snapshot -> QUEEN/DASHBOARD/DIAG                [war 20]
     *    orders  Arbeitsauftraege -> Roamer                           [war 34] */
    DNET_OUT: 13,
    /** Roamer/Ops -> DARKNET (FIFO). Funde und Ergebnisse.            [war 19] */
    DNET_IN: 14,

    /** CORP -> alle (peek, JSON). Kennzahlen + Aktien-Absichten.      [war 31] */
    CORP_OUT: 15,
    /** alle -> CORP (FIFO). Heute ungenutzt — reserviert. */
    CORP_IN: 16,

    /** GANG -> alle (peek, JSON). Territorium/Power/Win-Chance.       [war 32]
     *  ACHTUNG: Port 32 hatte einen Leser (DASHBOARD) und KEINEN Schreiber —
     *  publishGangInfo hatte im ganzen Projekt keinen Aufrufer, die Anzeige
     *  war dauerhaft leer. Der GANG-Payload schreibt jetzt hierher. */
    GANG_OUT: 17,
    /** alle -> GANG (FIFO). Heute ungenutzt — reserviert. */
    GANG_IN: 18,

    // ═══ AUSNAHMEN — heisser Pfad, je Takt gelesen ════════════════════════
    //     Kein Postfach, weil der Leser sonst je 2-s-Takt ein grosses JSON
    //     parsen muesste, um an eine Zahl zu kommen.

    /** QUEEN -> DISPATCHER (peek). Freizumachender RAM je Host, plus
     *  Zeitstempel-Marker "@:<ms>". Der Dispatcher liest das JEDEN Takt.
     *  Als Feld in QUEEN_OUT muesste er dafuer Phase, Caps und Treasury
     *  mitparsen.                                                     [war 6] */
    RESERVATION: 19,
    /** WORK -> DISPATCHER (peek). Grind-Flag mit Zeitstempel, laeuft nach
     *  SHARE_MAX_AGE_MS von selbst aus. Ebenfalls je Takt gelesen. [war 23] */
    SHARE: 20,
    /** INFO -> Consumer (peek, JSON je consumer/id). Bewusst GETRENNT von
     *  INFO_OUT: WORK pollt Ergebnisse im Sekundentakt, und INFO_OUT.blocks
     *  ist mit 13 Bloecken das groesste JSON im Schwarm. Zusammengelegt
     *  wuerde jede Ergebnis-Abfrage den kompletten Snapshot parsen. [war 30] */
    INFO_RPC_RES: 21,

    // ═══ ANSCHLAGBRETT ════════════════════════════════════════════════════

    // ═══ NACHZUEGLER-PAAR ════════════════════════════════════════════════
    //     Kommt NACH den Ausnahmen, weil der Paarblock 1-18 bei der Neuvergabe
    //     bereits geschlossen war. Die Regel gilt unveraendert: ungerade =
    //     Ausgang (ein Schreiber), gerade = Eingang.

    /** GO -> alle (peek, JSON). Partien, Siegquote und nodePower je Gegner und
     *  Brettgroesse, Zustand des 5x5-Farmmodus, aktive Rotationsgewichte.
     *  REIN DIAGNOSTISCH: niemand handelt darauf.
     *  WARUM UEBERHAUPT: GO fuehrt seine Statistik in /schwarm-go/stats.txt —
     *  und laeuft auf einem pserv. ns.read liest nur LOKAL, DIAG sitzt auf home
     *  und kam an die Zahlen also gar nicht heran. Ohne diesen Kanal liesse sich
     *  weder das Farm-Tor noch ein Serienschutz an echten Daten entscheiden. */
    GO_OUT: 23,
    /** alle -> GO (FIFO). Heute ungenutzt — reserviert, damit das Paarmuster
     *  geschlossen bleibt. Kandidat: Gegner von Hand vorgeben. */
    GO_IN: 24,

    /** STANEK -> alle (peek, JSON). Zustand des Einmal-Laufs: angenommen,
     *  Fragmente gesetzt, Ladungen, schwaechste Ladung, oder der Grund fuers
     *  Scheitern.
     *  WARUM EIN EIGENER KANAL: STANEK laeuft genau einmal je Durchlauf und
     *  beendet sich danach. Ohne diesen Ausgang waere hinterher nicht mehr
     *  feststellbar, OB er lief und mit welcher Threadzahl — und genau die
     *  Threadzahl entscheidet ueber die Ladungsstaerke (siehe Payload-Kopf).
     *  BANK liest das Feld "state", um AUGS zu sperren, solange Stanek offen
     *  ist: jede Aug ausser NeuroFlux verschliesst das Geschenk endgueltig. */
    STANEK_OUT: 25,
    /** alle -> STANEK (FIFO). Heute ungenutzt — reserviert. */
    STANEK_IN: 26,

    /** beliebig -> alle (peek, Zaehler). "Die Netzkarte hat sich geaendert."
     *  BEWUSST KEIN POSTFACH: es gibt weder EINEN Schreiber noch EINEN Leser —
     *  BANK, QUEEN, GENESIS und ARSENAL melden, QUEEN, DISPATCHER, DASHBOARD
     *  und DIAG hoeren zu.
     *  FRUEHER (Port 24) war das eine KONSUMIERENDE FIFO: wer zuerst las, nahm
     *  die Meldung mit, fuer alle anderen war sie weg. Die Queen liest alle
     *  2 s, der Dispatcher alle 16 — die Queen gewann praktisch immer, und der
     *  Dispatcher erfuhr von einem neuen Server erst ueber das 5-Minuten-
     *  Sicherheitsnetz. Ein frisch gekaufter pserv stand so lange leer.
     *  JETZT: ein Zaehler, den jeder Schreiber hochzaehlt und jeder Leser nur
     *  ANSIEHT. Jeder Prozess merkt sich den zuletzt gesehenen Stand — damit
     *  bekommen ALLE die Meldung.                                    [war 24] */
    TOPO: 22,

    /** QUEEN -> alle (peek, EIN Schreiber). Der Schalter-Zustand als Spiegel der
     *  Datei schwarm-queen-state.txt.
     *
     *  WARUM ES DIESEN PORT GIBT: ns.read und ns.write haben KEINEN
     *  Server-Parameter — sie arbeiten immer auf dem Host, auf dem das Skript
     *  laeuft (NetscriptFunctions.ts:1077 und :1114, beide
     *  `const server = ctx.workerScript.getServer()`). Ein Daemon auf einem
     *  gekauften Server kann die Datei auf home also NICHT lesen. Er faende
     *  dort nichts, fiele auf die Registry-Vorgaben zurueck und wuerde seinen
     *  An/Aus-Schalter STILLSCHWEIGEND ignorieren: kein Fehler im Log, nichts
     *  im Bericht, der Knopf wirkt einfach nicht mehr.
     *
     *  WARUM DIE DATEI TROTZDEM BLEIBT: Ports sind eine reine Speicher-Map
     *  (NetscriptWorker.ts:38, `new Map<PortNumber, Port>()`) und stehen NICHT
     *  im Spielstand. Nach einem Neuladen des Spiels sind sie leer. Ein reiner
     *  Port-Zustand wuerde jeden Reload vergessen und alle Schalter auf die
     *  Vorgabe zuruecksetzen.
     *
     *  ALSO BEIDES: die Datei auf home bleibt die dauerhafte Wahrheit, die
     *  Queen spiegelt sie jeden Takt hierher, und Daemons auf fremden Hosts
     *  lesen den Spiegel. Kostet nichts — peek/writePort/clearPort stehen mit
     *  0 GB in RamCostGenerator.ts:634-638. */
    STATE_OUT: 27,
    /** v5.1 — DIE FREIGABE, EINEN BITNODE-DURCHLAUF ZU BEENDEN.
     *  Die QUEEN liest `schwarm-plan.txt` (nur sie sitzt fest auf home) und
     *  spiegelt die Freigabe hierher. Ein PORT und keine Datei, weil `ns.read`
     *  NUR LOKAL liest: der BACKDOOR-Werker laeuft auf pserv und kaeme an eine
     *  Datei auf home gar nicht heran. Ports sind global.
     *  Inhalt: { weg: "daedalus"|"weltdaemon"|null, node: <BitNode>, ts }
     *  Leser: BLADEBURNER, BACKDOOR, BANK — alle ueber planFreigabe(). */
    PLAN_OUT: 28,
    /** v5.4 — AKTIV_OUT: Zeitstempel der letzten MENSCHLICHEN Eingabe.
     *
     *  Geschrieben vom DASHBOARD (es besitzt ohnehin das DOM), gelesen von der
     *  QUEEN. Warum ein Port und keine Datei: ns.read liest nur lokal, und der
     *  Wert soll auch von Daemons auf fremden Hosts lesbar sein.
     *
     *  WAS DARIN STEHT, ist bewusst nur EINE Zahl: wann zuletzt ueberhaupt
     *  jemand etwas getan hat. NICHT was. Siehe die Begruendung an
     *  publishAktivitaet() im DASHBOARD. */
    AKTIV_OUT: 29,
    /** v5.14 — CHRONIK: Handlungsbuch-Zeilen von Daemons auf FREMDEN Rechnern.
     *
     *  FIFO, eine Zeile je Nachricht (Format wie in CHRONIK_DATEI). Geleert
     *  wird er auf home: von jedem chronik()-Aufruf dort und von
     *  chronikLesen() in DIAG. 35 kam in keinem Skript vor und liegt im
     *  Bereich, den CLEAN beim Neustart leert (1-40). (v5.15: Hier stand
     *  "34 = TRADER PORT_MANIP" - die Zahl steht seit TRADER v4.0 nur noch in
     *  Kommentaren. Belegt war 30 durch GO --verify; seit PAYLOADS v0.25 nimmt
     *  GO die Tabelle. Freie Nummern zeigt projektkarte.py, auch die
     *  ausserhalb dieser Tabelle.) */
    CHRONIK: 35,
};

/**
 * Freigabe zum Beenden des Durchlaufs lesen.  -> "daedalus" | "weltdaemon" | null
 *
 * EINE Implementierung fuer alle drei Verbraucher. Drei Daemons, die dieselbe
 * Pruefung je einzeln nachbauen, sind drei Gelegenheiten, sie falsch zu bauen —
 * und ein Fehler kostet hier nicht eine Logzeile, sondern den Spielstand.
 *
 * ZWEITE SICHERUNG gegen einen ALTEN Portinhalt: die Nachricht traegt die Node,
 * fuer die sie gilt. Steht nach einem Wechsel noch die alte Freigabe im Port
 * (die QUEEN hat sie nur noch nicht ueberschrieben), greift sie NICHT. Dieselbe
 * selbstentschaerfende Sicherung wie GILT-FUER-NODE in der Plandatei.
 *
 * @param {NS} ns
 * @param {string} [erwartet] optional auf einen Weg einschraenken
 */
export const PLAN_FRISCH_MS = 30000;

export function planFreigabe(ns, erwartet) {
    let o;
    try { o = readOut(ns, SCHWARM_PORTS.PLAN_OUT); } catch (e) { return null; }
    if (!o || typeof o !== "object") return null;
    const weg = String(o.weg || "").toLowerCase();
    // v5.11 — "flume" GEHOERT HIERHER, NICHT NUR IN DIE QUEEN.
    //
    // Ein Wert, der ueber einen Port geht, muss ZWEI Tore passieren: die
    // Weissliste des SCHREIBERS (QUEEN.endeFreigegeben) und die des LESERS
    // (hier). v7.13 hat nur das erste geoeffnet. Ergebnis am 19.09.2026: auf
    // PLAN_OUT stand korrekt {"weg":"flume"}, die Plan-Datei stimmte, der
    // Pruefstand lieferte "flume" — und JEDER Verbraucher warf den Wert hier
    // wieder weg. shouldRun() sagte nein, BITNODE lief nicht, und die Queen
    // meldete "Grund nicht naeher bestimmbar".
    //
    // Die Regel, die das kuenftig abfaengt: wer eine Weissliste erweitert,
    // sucht ZUERST nach allen anderen Stellen, die denselben Wert pruefen.
    if (weg !== "daedalus" && weg !== "weltdaemon" && weg !== "flume") return null;
    // FRISCHE STATT NODE-VERGLEICH. Die QUEEN hat die Node beim Schreiben schon
    // geprueft; sie hier nochmal zu pruefen kostet getResetInfo in jedem
    // Verbraucher. Die Frist kann MEHR als der Node-Vergleich: sie schuetzt
    // auch davor, dass eine TOTE QUEEN eine alte Freigabe ewig stehen laesst.
    // Die QUEEN schreibt in jedem Takt (2 s) — 30 s sind reichlich Luft und
    // trotzdem eine harte Obergrenze.
    if (!(Date.now() - Number(o.ts || 0) < PLAN_FRISCH_MS)) return null;
    if (erwartet && weg !== String(erwartet).toLowerCase()) return null;
    return weg;
}

/** Ein WANT verfällt, wenn der Owner es nicht innerhalb dieser Zeit erneuert.
 *  Stirbt ein Owner, startet die Queen also keine Geister-Payloads nach. */
export const SPAWN_WANT_TTL_MS = 45_000;

/** Der Owner soll sein WANT etwa in diesem Takt wiederholen (deutlich < TTL). */
export const SPAWN_WANT_REFRESH_MS = 10_000;

/** SHARE-Flag gilt so lange als gültig. Crasht WORK, läuft es von selbst aus. */
export const SHARE_MAX_AGE_MS = 90_000;

/**
 * WORKER-KLASSEN (v3.0) — das 4. exec-Argument jedes Dispatcher-Workers.
 *
 * Damit der Dispatcher beim Freimachen von RAM weiß, WEN er killen darf.
 * Die Worker selbst lesen das Argument nie; es dient nur der Erkennung über
 * ns.ps().args[3]. Kill-Reihenfolge = Reihenfolge der Kosten:
 *
 *   SHARE  — reiner Rep-Bonus. Kill kostet NICHTS.       -> zuerst
 *   XP     — XP-Weaken zum Pool-Füllen. Kill kostet XP.  -> danach
 *   PREP   — weaken/grow auf NEBENzielen (Vorbereitung). -> danach
 *   CORE   — h/w/g auf AKTIVEN Zielen. NIE killen — läuft aus (passiv).
 */
export const WCLASS = { CORE: "core", PREP: "prep", XP: "xp", SHARE: "share" };

/** Reihenfolge, in der Füll-Worker beim Freimachen geopfert werden. */
export const WCLASS_KILL_ORDER = [WCLASS.SHARE, WCLASS.XP, WCLASS.PREP];

/** So lange versucht der Dispatcher, eine Reservierung PASSIV zu erfüllen
 *  (auslaufen lassen). Danach killt er Füll-Worker — aber nie CORE. */
export const RESERVE_DEADLINE_MS = 20_000;

/** Bootstrap-Phasen des Schwarms. */
export const PHASE = {
    // v4.1: BOOT hat GEFEHLT. SCHWARM-QUEEN.js ruft beim Kaltstart
    //   if (getPhase(ns) === null) setPhase(ns, PHASE.BOOT);
    // und PHASE.BOOT war undefined -> setPhase schrieb String(undefined),
    // also den Text "undefined", in den Ausgang der Queen. Im Report stand
    // dann "Phase: undefined" und im Logbuch "PHASE null -> undefined".
    // Aufgefallen ist es nie, weil getPhase danach den WAHRHEITSWERT-tauglichen
    // String "undefined" zurueckgab: die Bedingung war erfuellt, der Kaltstart
    // wiederholte sich nicht, und niemand las die Phase ausser der Anzeige.
    BOOT: "BOOT",           // Queen laeuft, Bootstrap-Kette noch nicht durch
    GENESIS: "GENESIS",     // API-Test, Capability-Broadcast
    EARLY: "EARLY",         // Früh-Hacker bis Casino-Startkapital
    CASINO: "CASINO",       // Casino solo (Save-Scum auf ~10b)
    ARSENAL: "ARSENAL",     // TOR + Programme + Marktzugänge kaufen
    SWARM: "SWARM",         // Voller Betrieb (Queen autonom)
    PRE_RESET: "PRE_RESET", // Install steht bevor: NFG-Dump, Aufräumen
};

/**
 * Bekannte Capability-Flags (Port 4). Sensorik liegt bei GENESIS / Queen.
 *   WSE      — WSE-Account vorhanden
 *   TIX      — TIX-API (Skripthandel möglich)
 *   FOURS    — 4S-Daten-TIX-API (echte Forecasts)
 *   GANG     — Gang gegründet / SF2 aktiv nutzbar
 *   SING     — Singularity verfügbar (SF4)
 *   BLADE    — Bladeburner-API nutzbar (SF7 / BN7)
 *   HASHSERV — Hacknet-SERVER (Hashes) statt Nodes (SF9 / BN9)
 *   DARKWEB  — TOR gekauft
 *   CORP     — Corporation-API (SF3 / BN3), für später
 */
export const CAPS = {
    WSE: "WSE", TIX: "TIX", FOURS: "FOURS", GANG: "GANG", SING: "SING",
    BLADE: "BLADE", HASHSERV: "HASHSERV", DARKWEB: "DARKWEB", CORP: "CORP",
};

/**
 * Zentrale Daemon-Registry — Single Source of Truth für Queen & Dashboard.
 * Beim Umbenennen einer Datei NUR hier ändern.
 *
 *   file        — exakter Dateiname auf 'home' (Quelle für Deployment)
 *   deps        — Dateien, die mit auf den Ziel-Host kopiert werden müssen
 *   host        — Präferenz: "home" oder "pserv" (Fallback regelt pickHost)
 *   minRam      — geschätzter statischer RAM-Bedarf des Skripts (GB) [Planwert]
 *   burst       — zusätzlicher Freiraum (GB) für Temp-Skripte (RAM-Dodging)
 *   burstDaemon — (optional) explizit als Burst-Daemon markieren, auch OHNE
 *                 helpers.js in deps. Für SCHWARM-native Daemons, die selbst
 *                 Wegwerf-Skripte starten (z.B. SCHWARM-BLADEBURNER.js).
 *   args        — Standard-Startargumente
 *   cap         — benötigtes Capability-Flag (null = immer startbar)
 *   pinHost     — (optional) ERZWINGT diesen Host, kein Auto-Pick. Für Daemons,
 *                 die zwingend auf 'home' laufen müssen (DARKNET: Passwort-/
 *                 Karten-DB übersteht einen Prestige nur auf home).
 *   owner       — wer die FACH-Entscheidung trifft, ob der Daemon laufen soll:
 *                 "QUEEN"   — die Queen entscheidet selbst (registry-getrieben).
 *                 "BANK"    — BANK meldet WANT/DROP auf Port 22.
 *                 "WORK"    — WORK meldet WANT/DROP auf Port 22.
 *                 "HACKING" — der DISPATCHER führt den Daemon selbst (BACKDOOR).
 *                             Die Queen fasst ihn NICHT an und reserviert nichts.
 *                 GEDEPLOYT wird in allen Fällen außer "HACKING" von der QUEEN.
 *   payload     — Schlüssel in SCHWARM-PAYLOADS.js. Ein Daemon mit payload liegt
 *                 NICHT als lose Datei auf home, sondern wird vor dem Start aus
 *                 dem kodierten Quell-Speicher materialisiert.
 *   triggered   — startet nicht von selbst; nur auf Auslöser (BACKDOOR).
 *   defaultOff  — beim ersten Boot AUS, bis jemand zuschaltet (CORP).
 *   oneshotDaemon — Der Daemon BEENDET SICH SELBST (AUGS). Die Queen konsumiert
 *                 sein WANT beim Deploy, statt es bis zum TTL zu halten — sonst
 *                 würde sie ihn nach jedem Selbst-Ende sofort neu starten. Der
 *                 Owner sendet also je gewünschtem Lauf GENAU EIN WANT.
 *
 * Hinweise:
 *   BLADEBURNER: SCHWARM-native (kein helpers.js). Gibt KEINE Hashes aus — die
 *                Hash->Rang/SP-Kopplung kommt separat (Schritt 2). Burst-
 *                Headroom via `burstDaemon`-Marker (siehe Queen.isBurstDaemon),
 *                weil die teuren ns.bladeburner.*-Calls als Wegwerf-Skripte laufen.
 *   BACKDOOR:    TRIGGERED-Daemon (kein Dauerlauf). Die Queen materialisiert
 *                BACKDOOR_PAYLOAD bei Bedarf als SCHWARM-BACKDOOR.js, startet ihn
 *                EINMAL (Dispatcher meldet offene Ziele über Port 11) und räumt
 *                nach Selbstbeendigung auf. Braucht SF4 (Singularity). Setzt
 *                während des Laufs Port 10 (busy) -> WORK gibt den Focus frei.
 *   AUGS:        ohne SF4.3 vervielfachen sich Singularity-RAM-Kosten (×4/×16),
 *                daher hoher minRam-Planwert.
 *   DARKNET:     MUSS auf home (pinHost) — die Passwort-/Karten-DB übersteht
 *                einen Prestige nur dort. Leichtgewichtig: der Daemon sät nur
 *                aus & sammelt; die RAM-Last liegt auf den Darknet-Servern
 *                selbst (außerhalb des normalen Host-Pools).
 *   CORP:        MUSS auf home (pinHost) — die Blaupausen-Datei
 *                (schwarm-corp-state.txt) liegt auf dem Lauf-Host und muss
 *                pserv-Rebuilds/Prestige überstehen. Gründung, Investoren,
 *                IPO bleiben manuell (Doktrin); der Daemon pollt harmlos,
 *                bis die Corporation existiert.
 *   INFRA:       baut die pservs selbst -> darf auf home bleiben (Henne-Ei).
 *                Seit v1.0-INFRA managed dieser Daemon ZUSÄTZLICH das Hacknet
 *                (Merge aus server.js + HIVE-HASHNET.js). Cap bleibt null, da
 *                die Hacknet-Logik sich selbst abschaltet, wenn keine
 *                Hash-Server vorhanden sind. Ab INFRA v1.2 kauft INFRA nur
 *                noch Nodes/Upgrades — die Hash-AUSGABE liegt bei HASHNET.
 *   BANK:        zentraler Ökonomie-Daemon (aus HASHNET hervorgegangen).
 *                Verwaltet BEIDE knappen Ressourcen: Hashes (einziger
 *                spendHashes-Aufrufer, wie zuvor HASHNET) UND Geld (5%-Sparen
 *                vom Bruttozufluss, Antrag/Freigabe für große Anschaffungen,
 *                Auto-Corp-Gründung "ALPHA" bei $150b -> START:CORP). Der
 *                Hash-Block schläft ohne Hash-Server; der Geld-Block läuft immer.
 *                burstDaemon (evalNs für createCorporation). host home.
 */
// GEÄNDERT (v2.7, Payload-Umbau): siehe Kopf-Changelog. owner = Besitzer, der
// den Daemon startet/stoppt; payload = Schlüssel in SCHWARM-PAYLOADS.js (Daemon
// liegt dann nicht als lose home-Datei vor, sondern wird bei Bedarf materialisiert).
export const DAEMONS = {
    // ── Kern — von der Queen direkt geführt (owner "QUEEN") ──────────────────
    // DASHBOARD STEHT BEWUSST ZUERST: planDeployments iteriert in Registry-Reihenfolge,
    //   der plan wird sequenziell abgearbeitet. So kommt das Kontroll-/Überwachungs-UI
    //   VOR dem Dispatcher hoch -> der Spieler hat ab der ersten Sekunde die Schalter.
    //   MUSS auf home (pinHost) — importiert HELPERS, öffnet das UI-Tail auf dem Hauptknoten.
    //   Kein payload (eigene Datei), kein triggered (soll immer laufen), NIE defaultOff
    //   (ohne Dashboard kein Zuschalten der anderen Daemons -> Henne-Ei). Eigener
    //   Doppelstart-Schutz fängt eine manuelle Instanz ab (kein Konflikt mit `run`).
    //   oneshot:true -> NUR fürs Button-Filter (kein Selbst-Steuer-Button); die Queen
    //   ignoriert oneshot und startet es normal (≠ oneshotDaemon = beendet sich selbst).
    //   v3.5.1: minRam 8 -> 16. Gemessen wurden mit DASHBOARD v5.0 exakt 22,90 GB;
    //   davon entfielen 10,00 GB auf corporation.getCorporation und 6,00 GB auf drei
    //   stock-Funktionen — beides fuer je EINE Anzeigezahl. v5.1 holt diese Werte
    //   stattdessen von Port 31 (CORP v0.20 sendet funds) und Port 26 (TRADER meldet
    //   den Portfolio-Wert), beides 0 GB. Damit bleiben rund 6,90 GB; 16 gibt Luft
    //   fuer kuenftige Zeilen, ohne home unnoetig zu blockieren.
    // v5.7: pinHost ENTFERNT — der alte Grund war falsch. Im Kommentar stand
    // "DOM", aber das DOM gehoert dem BROWSER, nicht dem Spielserver: der
    // Server ist in Bitburner reine Buchhaltung fuer RAM und Dateien.
    // eval("document") liefert von jedem Host dasselbe Fenster. Beweis laeuft
    // BEWIESEN am 14.09.2026: DASHBOARD lief auf pserv-0 und schrieb den
    // Aktivitaetsstempel weiter. Damit sind alle "DOM"-Begruendungen erledigt.
    DASHBOARD:   { file: "SCHWARM-DASHBOARD.js",    deps: ["SCHWARM-HELPERS.js"], host: "home",  minRam: 8, burst: 0, args: [], cap: null, owner: "QUEEN", oneshot: true },
    HACKING:     { file: "SCHWARM-DISPATCHER.js",  deps: ["SCHWARM-HELPERS.js", "SCHWARM-PAYLOADS.js"], host: "home", pinHost: "home", minRam: 18, burst: 0,  args: [], cap: null,       owner: "QUEEN" },
    // INFO (v3.1): zentraler Informations- & RPC-Daemon ("eine Quelle, alle lesen").
    //   Läuft auf dem GRÖSSTEN pserv (pickHost sortiert nach freiem RAM). Statisch
    //   trägt er nur die BILLIGEN Reads — mem-verifiziert (v3.1.1): 63,55 GB,
    //   SF4-Level-UNABHÄNGIG (die frühere Phantomlast von +38 GB kam von der
    //   Kostentabelle: `X.getFactionRep`-Member-Zugriffe zählt die RAM-Analyse
    //   wie echte API-Aufrufe; behoben in SCHWARM-INFO v1.0.1, Keys neutral);
    //   ns.singularity.* läuft als gebündeltes evalNs im burst-Headroom. burst
    //   MUSS zu EVAL_HEADROOM_GB in SCHWARM-INFO.js passen (176 = größtes Bündel
    //   162 GB bei SF4 L1 + Reserve). Die Queen hält minRam+burst dauerhaft
    //   reserviert, solange der Daemon lebt (planDeployments) -> KEIN Eintrag in
    //   Dispatcher.EVAL_DAEMONS nötig; evalNs liefert hier nie "null wegen Pool
    //   voll". Kein cap-Gate: ohne SF4 publiziert INFO die billigen Blöcke
    //   trotzdem ([SING]-Blöcke melden ok:false). Startet automatisch, sobald
    //   ein Host mit minRam+burst (248 GB) existiert; bis dahin scheitert
    //   pickHost leise und alle Konsumenten nutzen ihre bisherigen Fallbacks.
    // v6.7: minRam angehoben. Die Fehler-Chronik bringt drei neue APIs mit
    // (getRecentScripts, ps, scan - je 0.2 GB, RamCostGenerator.ts:605-607);
    // getScriptLogs, read und write kosten nichts.
    //
    // v4.8 (Healthcheck 11): Der Kommentar nannte "72 -> 74", im Code stehen
    // 71. Nachgemessen hat die Engine am 06.09. fuer SCHWARM-INFO.js
    // 69,70 GB — 71 gibt damit denselben Puffer von rund 1,3 GB wie bei allen
    // anderen Daemons (BANK 25/23,35 - DISPATCHER 18/16,50 - WORK 7/5,85).
    // Der Wert stimmt, die Doku war veraltet.
    // v5.6: minRam 71 -> 74. Die BlackOp-Chronik (INFO v2.1) hat das Skript auf
    // 71,70 GB gebracht — knapp UEBER die eigene Angabe. Getragen hat das bisher
    // nur der Burst-Puffer; ohne ihn haette die Queen zu wenig reserviert und der
    // Start waere STILL fehlgeschlagen. Drei GB Luft, damit die naechste kleine
    // Ergaenzung nicht dasselbe Spiel ausloest.
    INFO:        { file: "SCHWARM-INFO.js",         deps: ["SCHWARM-HELPERS.js"], host: "pserv", minRam: 74, burst: 176, burstDaemon: true, args: [], cap: null, owner: "QUEEN" },
    // v4.0: deps auf das reduziert, was WIRKLICH importiert wird. BANK fuehrte
    // SCHWARM-PAYLOADS.js mit, importiert es aber nicht — bei jedem Deploy wurde
    // eine 265-KB-Datei sinnlos mitkopiert.
    // v5.3: pinHost "home" ENTFERNT, dafuer meidePserv. BANK greift auf GAR KEINE
    // Datei zu (kein ns.read/ns.write/fileExists im ganzen Skript) — sie
    // arbeitet ausschliesslich ueber Ports und kann deshalb ueberall wohnen.
    // Die einzige echte Bedingung ist "nicht auf einem pserv", weil sie die
    // selbst loescht. Das gibt home rund 30 GB zurueck.
    BANK:        { file: "SCHWARM-BANK.js",         deps: ["SCHWARM-HELPERS.js"], host: "fremd", meidePserv: true, minRam: 25, burst: 5, burstDaemon: true, args: [], cap: null, owner: "QUEEN", defaultOff: true },
    // WORK ist der Singularity-lastigste Daemon (Faction/Company/Crime/Sleeves laufen
    //   ALLE über evalNs). Bei SF4 Lvl 1 kostet EIN Call bis ~80 GB (RamCostGenerator
    //   :88 -> Faktor 16). pinHost "home", weil ein kleiner pserv den nötigen Eval-
    //   Puffer gar nicht bereitstellen KANN -> WORK bliebe dauerhaft blockiert
    //   ("Singularity-Aufruf liefert null", Sleeves/Caps kippen auf false).
    // v5.5: pinHost entfernt. WORK greift auf GAR KEINE Datei zu (kein
    // ns.read/ns.write/fileExists im ganzen Skript) — es arbeitet ueber Ports
    // und die Singularity-API, und die sind hostunabhaengig. Der Pin war eine
    // Annahme, kein Zwang. Gibt home rund 31 GB zurueck.
    WORK:        { file: "SCHWARM-WORK.js",         deps: ["SCHWARM-HELPERS.js"], host: "fremd",  minRam: 7,  burst: 24, burstDaemon: true, args: [], cap: CAPS.SING, owner: "QUEEN", defaultOff: true },
    CORP:        { file: "SCHWARM-CORP.js",         deps: ["SCHWARM-HELPERS.js"], host: "home",  pinHost: "home", minRam: 5, burst: 24, burstDaemon: true, args: [], cap: CAPS.CORP, owner: "QUEEN", defaultOff: true, dependsOn: "BANK" },
    // v5.8: pinHost ENTFERNT. Der Grund war schwarm-dnet-manual.txt —
    // die Datei existiert im Spiel gar nicht (geprueft 13.09.), und DIAG liest
    // NICHTS von DARKNET. Die Karte ist ein Lauf-Cache, der ohnehin bei jedem
    // Prestige neu entsteht (prestigeDarknetState leert das ganze Netz).
    DARKNET:     { file: "SCHWARM-DARKNET.js",      deps: ["SCHWARM-HELPERS.js", "SCHWARM-PAYLOADS.js"], host: "home",  minRam: 8, burst: 0, args: [], cap: null, owner: "QUEEN", defaultOff: true },
    GO:          { file: "SCHWARM-GO.js",           deps: [],                     host: "pserv", minRam: 13, burst: 0,  args: [], cap: null,       owner: "QUEEN", payload: "GO", defaultOff: true },
    // ── Netz-Zweig — vom DISPATCHER selbst geführt (owner "HACKING") ─────────
    // GEÄNDERT (v3.0): BACKDOOR gehört jetzt dem Dispatcher, nicht der Queen.
    //   Begründung: (a) installBackdoor() belegt KEINEN Spieler-Slot (netscriptDelay,
    //   nicht startWork) -> es gab nie einen Konflikt mit WORK; (b) der Dispatcher
    //   kennt Root-Status und Hacking-Level ohnehin aus seinem Slow-Takt; (c) er ist
    //   der RAM-Eigentümer und startet den SOLVER schon nach genau diesem Muster.
    //   Folge: Port 10 + 11 entfallen ersatzlos.
    //   ACHTUNG: Die Queen reserviert für owner "HACKING" NICHTS — der Dispatcher
    //   nimmt sich den Platz aus dem eigenen Pool.
    BACKDOOR:    { file: "SCHWARM-BACKDOOR.js",     deps: [],                     host: "pserv", minRam: 9,  burst: 5,  args: [], cap: CAPS.SING, owner: "HACKING", payload: "BACKDOOR_PAYLOAD", triggered: true, burstDaemon: true },

    // ── Ökonomie-Zweig — Owner BANK (meldet WANT/DROP; die QUEEN deployt) ────
    // INFRA-Logik (pservs + Hacknet + Home-RAM) ist in BANK gemergt.
    // v4.0: deps geleert — TRADER ist ein Payload und importiert NICHTS. Die
    // Angabe kostete bei jedem Deploy ein sinnloses scp von HELPERS auf den pserv.
    TRADER:      { file: "SCHWARM-TRADER.js",       deps: [],                     host: "pserv", minRam: 39, burst: 5,  burstDaemon: true, args: [], cap: CAPS.TIX,  owner: "BANK", payload: "TRADER" },
    AUGS:        { file: "SCHWARM-AUGS.js",         deps: ["SCHWARM-HELPERS.js"], host: "home",  minRam: 8, burst: 5,  burstDaemon: true, args: [], cap: CAPS.SING, owner: "BANK", payload: "AUGS", oneshotDaemon: true },

    // ── Kinetik-Zweig — Owner QUEEN seit v5.13 (vorher WORK per WANT/DROP) ──
    // Die QUEEN startet beide selbst: Schalter an + Mechanik vorhanden. WORK
    // tritt nur noch der Division bei und gruendet die Gang. Die Daemons
    // warten selbst, falls sie zu frueh kommen (BLADEBURNER v0.5, GANG v0.6).
    BLADEBURNER: { file: "SCHWARM-BLADEBURNER.js",  deps: [],                     host: "pserv", minRam: 4,  burst: 24, burstDaemon: true, args: [], cap: CAPS.BLADE, owner: "QUEEN", payload: "BLADEBURNER" },
    GANGS:       { file: "SCHWARM-GANG.js",         deps: ["SCHWARM-HELPERS.js"], host: "pserv", minRam: 38, burst: 8,  burstDaemon: true, args: [], cap: CAPS.GANG,  owner: "QUEEN", payload: "GANGS" },

    // SLEEVES — VIRTUELLER Eintrag (v1.2): KEIN Prozess, nur ein Dashboard-Schalter.
    //   WORK steuert die Sleeves selbst (Rep-/Stat-Farming); dieser Eintrag existiert
    //   nur, damit der Spieler sie fürs Handspiel per Button abschalten kann.
    //   file: null  -> nichts zu starten.
    //   cap: SING   -> schließt den ERSATZ-WANT-Pfad der Queen: fehlt SF4, greift das
    //                  cap-Gate in shouldRun; ist SF4 da, läuft WORK (kein Ersatz-WANT).
    //                  => die Queen deployt SLEEVES in KEINEM Fall. (isDaemonEnabled
    //                  ignoriert cap, WORK liest den Schalter also unabhängig davon.)
    //   KEIN triggered/defaultOff -> Standard AN (Sleeves farmen automatisch mit).
    //   KEIN oneshot -> erscheint als Dashboard-Button.
    SLEEVES:     { file: null, virtual: true, deps: [], host: "home", minRam: 0, burst: 0, args: [], cap: CAPS.SING, owner: "WORK" },

    // OVERVIEW — VIRTUELLER Eintrag (v3.5), zweites Exemplar des SLEEVES-Musters.
    //   Es gibt KEINEN Prozess. Das DASHBOARD rendert den Overview-HUD selbst
    //   (overview-extra-hook-0/1): es besitzt den DOM-Zugriff und erhebt die
    //   Zahlen ohnehin fuer seine eigenen Bloecke. Dieser Eintrag existiert nur,
    //   damit der Spieler den HUD per Dashboard-Knopf abschalten kann und der
    //   Zustand in der State-Datei steht.
    //   WARUM KEIN EIGENER DAEMON: ein zweiter Prozess muesste getMoneySources
    //   (1.0) + stock.* (~2.5) + hacknet.* (1.0) + getResetInfo (1.0) + Basis
    //   (1.6) ein ZWEITES Mal bezahlen — rund 7 GB doppelt — plus einen Port
    //   oder eine zweite Erhebung derselben Werte. Beide brauechten zudem
    //   pinHost "home" wegen des DOM. Der einzige Gewinn waere Unabhaengigkeit
    //   von einem Dashboard-Absturz; dann ist aber ohnehin niemand mehr da, der
    //   die Schalter bedient.
    //   file: null  -> nichts zu starten. cap: null -> in jeder BitNode nutzbar.
    //   KEIN defaultOff -> Standard AN.
    //   owner "DASHBOARD" ist KEINE Kosmetik, sondern noetig: bei owner "QUEEN"
    //   liefert shouldRun() jeden Takt true, planDeployments nimmt den Eintrag in
    //   den Plan auf und deployDaemon() stolpert dann ueber file:null ("Datei
    //   fehlt auf home: null") — eine Fehlzeile alle zwei Sekunden. Mit einem
    //   Owner, der keine WANTs sendet, fasst die Queen den Eintrag NIE an.
    //   (SLEEVES loest dasselbe Problem ueber owner "WORK" + cap-Gate.)
    //   showInDashboard: true ist PFLICHT — der generische Button-Filter des
    //   Dashboards blendet virtual-Eintraege sonst aus (so ist SLEEVES gemeint:
    //   dort steuert der Eltern-Daemon). Hier hat der Schalter aber eine echte
    //   Wirkung, also muss er den Filter stechen.
    OVERVIEW:    { file: null, virtual: true, deps: [], host: "home", minRam: 0, burst: 0, args: [], cap: null, owner: "DASHBOARD", showInDashboard: true },
    // v5.4 — AUTO: kein Daemon, sondern ein SCHALTER fuer die Selbstverwaltung.
    // An (Vorgabe): hat der Spieler zwei Stunden nichts getan, schaltet die
    // QUEEN alles ein, dessen Voraussetzungen erfuellt sind, und die
    // kosmetischen Anzeigen aus. Aus: der Schwarm fasst keinen Schalter an.
    // Virtueller Eintrag wie OVERVIEW — die Queen ueberspringt file:null
    // ohnehin, das Dashboard zeigt ihn trotzdem, und der Zustand landet in
    // derselben Schalterdatei wie alles andere. Kein Sonderweg.
    AUTO:        { file: null, virtual: true, deps: [], host: "home", minRam: 0, burst: 0, args: [], cap: null, owner: "QUEEN", showInDashboard: true },

    // DIAG (v1.0): Diagnose-Werkzeug, KEIN Betriebsdaemon. Läuft ~60 s, schreibt
    //   SCHWARM-REPORT.txt und schaltet sich danach SELBST AUS (setDaemonEnabled
    //   -> 0). Ein Klick im Dashboard = ein Report. Steht bewusst ZULETZT in der
    //   Registry: planDeployments arbeitet die Reihenfolge sequenziell ab, die
    //   Diagnose darf echten Daemons nie den Platz wegnehmen.
    //   pinHost "home": setDaemonEnabled schreibt die State-Datei lokal, und der
    //   Report soll dort liegen, wo du ihn liest. minRam 6 deckt die gemessenen
    //   ~2,7 GB (Basis 1.6 + ps 0.2 + scan 0.2 + getPlayer 0.5 + 3×0.05) mit
    //   Reserve. Rein lesend (peek/ps/scan), kein cap-Gate nötig.
    // RESET (v10): fuehrt den Aug-Install aus und uebergibt SCHWARM-GENESIS.js als
    //   Callback. Engine (Singularity.ts:59-75): runAfterReset startet das
    //   Callback-Skript auf home mit KEINEN Argumenten und 1 Thread und prueft
    //   vorher, ob dort genug RAM frei ist — GENESIS ist damit kompatibel.
    //   Bewusst ein eigener One-Shot statt Code in der Queen: der Aufruf toetet das
    //   ausfuehrende Skript, und die Queen soll nicht ihr eigenes Grab schaufeln.
    //   pinHost "home", weil das Callback-Skript dort liegen muss.
    //   minRam 14: gemessen 12,6 GB (calculateRam, 25.09.2026, SF4.3). Bei
    //   niedrigerem SF4 kostet installAugmentations mehr (SingularityFn3: 5 GB bei
    //   SF4>=3, 80 GB bei Level 1); ohne SF4 startet die Queen es ohnehin nicht.
    // v5.2: BITNODE. Beendet den Durchlauf und waehlt die naechste Node.
    // DAEMON, NICHT ONE-SHOT: ein One-Shot haenge an der WANT-Logik der Queen
    // (siehe RESET); als Daemon mit defaultOff heisst "aus" wirklich aus, das
    // Skript laeuft dann gar nicht. Angeschaltet wartet es, bis Freigabe UND
    // Engine-Bedingung zusammenkommen. v5.15: minRam 56 - gemessen 54 GB
    // (destroyW0r1dD43m0n 32 + b1tflum3 16 + Rest); vorher standen hier 20.
    BITNODE:     { file: "SCHWARM-BITNODE.js", deps: ["SCHWARM-HELPERS.js"], host: "home", pinHost: "home", minRam: 56, burst: 0, args: [], cap: CAPS.SING, owner: "QUEEN", payload: "BITNODE", defaultOff: true, showInDashboard: true },
    RESET:       { file: "SCHWARM-RESET.js", deps: ["SCHWARM-HELPERS.js"], host: "home", pinHost: "home", minRam: 14, burst: 0, args: [], cap: CAPS.SING, owner: "QUEEN", payload: "RESET", oneshotDaemon: true, showInDashboard: true },
    // args [FensterSek, MesstaktMs, Zyklen, AbstandMin]. Zyklen 0 = DAUERLAUF:
    // alle 10 Minuten ein vollstaendiges Lagebild in eine eigene Datei
    // (SCHWARM-REPORT-<lfd>.txt), die die Bruecke abholt und danach im Spiel
    // loescht. Vorher stand hier args: [] â das ergab den Auftragsmodus mit
    // 4 Zyklen und Selbstabschaltung nach einer Stunde. [v4.4]
    DIAG:        { file: "SCHWARM-DIAG.js", deps: ["SCHWARM-HELPERS.js"], host: "home", pinHost: "home", minRam: 9, burst: 0, args: [60, 2000, 0, 10], cap: null, owner: "QUEEN", defaultOff: true },
    // Reiner Anzeiger: oeffnet ein eigenes Tail-Fenster und zeigt darin den
    // neuesten DIAG-Report. Kein Import, keine deps â gemessen 1.80 GB.
    // Kein oneshotDaemon: der Schalter soll AN und AUS koennen, nicht nur
    // ausloesen. showInDashboard, weil der Filter reine Anzeiger sonst
    // ausblenden wuerde. [v4.4]
    // v5.8: pinHost ENTFERNT — Begruendung war "DOM", und die ist seit dem
    // DASHBOARD-Beweis hinfaellig: das DOM gehoert dem Browser, nicht dem Host.
    LOGVIEW:     { file: "SCHWARM-LOGVIEW.js", deps: [], host: "home", minRam: 3, burst: 0, args: [], cap: null, owner: "QUEEN", payload: "LOGVIEW", defaultOff: true, showInDashboard: true },

    // SCAN (v3.5): interaktive Netzkarte im Terminal. ECHTER One-Shot — laeuft
    //   unter einer Sekunde, schreibt seinen Baum ins Terminal-DOM und endet.
    //   pinHost "home": braucht #terminal und #terminal-input; auf einem pserv
    //   gibt es kein DOM.
    //   minRam 8 deckt die gemessenen ~4,2 GB (Basis 1.6 + getServer 2.0 + scan
    //   0.2 + ls 0.2 + getHackingLevel 0.05 + State-Schreiber) mit Reserve.
    //   defaultOff + showInDashboard: der Knopf IST der Ausloeser.
    //   oneshotDaemon: die Queen verbraucht das WANT beim Deploy.
    //   WICHTIG: der Payload setzt als ERSTE Aktion setDaemonEnabled(ns,"SCAN",0).
    //   Ohne das wuerde die Queen ihn im 2-s-Takt endlos neu starten — owner
    //   "QUEEN" plus Schalter=1 ergibt in shouldRun() jeden Takt true. RESET
    //   loest dasselbe ueber einen Sonderzweig in der Queen; das Selbst-Aus
    //   (Muster DIAG) kommt ohne Aenderung an der Queen aus.
    SCAN:        { file: "SCHWARM-SCAN.js", deps: ["SCHWARM-HELPERS.js"], host: "home", pinHost: "home", minRam: 6, burst: 0, args: [], cap: null, owner: "QUEEN", payload: "SCAN", defaultOff: true, oneshotDaemon: true, showInDashboard: true },

    // STANEK (v4.2): EINMAL-Lauf direkt nach dem Prestige. Nimmt das Geschenk an,
    //   belegt das Gitter bitnode-abhaengig und laedt die Fragmente auf.
    //
    //   pinHost "home" ist PFLICHT, nicht Vorliebe: die Engine rechnet
    //   charge(fragment, threads * getCoreBonus(cores)) mit den Cores des
    //   LAUF-Hosts (NetscriptFunctions/Stanek.ts). Ein pserv hat immer genau
    //   einen Core — dort waere jede Ladung schwaecher.
    //
    //   minRam ist ABSICHTLICH gross. Der Daemon selbst braucht nur wenige GB,
    //   aber die Ladungsstaerke haengt LINEAR an der Threadzahl, und
    //   highestCharge (der Hoechststand) bestimmt, was spaetere Ladungen noch
    //   wert sind. Die Reservierung ist damit kein Puffer, sondern der Ertrag:
    //   sie zwingt den Dispatcher, home vorher freizuraeumen.
    //
    //   defaultOff + oneshotDaemon: startet ausschliesslich, wenn ihn jemand
    //   anfordert (GENESIS nach dem Prestige, oder der Dashboard-Knopf), und
    //   beendet sich selbst. Die Queen verbraucht das WANT beim Deploy.
    //
    //   cap: null statt CAPS.SING — Stanek haengt an SF13, nicht an SF4. Das
    //   Gate sitzt im Payload (acceptGift scheitert sauber und meldet warum).
    //
    //   minRam 64 (war 512, v2.0): der DAEMON braucht nur ~21 GB. Den grossen
    //   Speicher braucht der Ladeprozess, den er selbst startet — und der sucht
    //   sich seinen Host inzwischen aus (home wegen der Cores bevorzugt, ein
    //   deutlich groesserer pserv schlaegt sie). Ein 512er-Gate auf home haette
    //   den Lauf verhindert, obwohl anderswo reichlich Platz ist. Reicht es
    //   nirgends, meldet der Payload "zu_wenig_ram" und DIAG zeigt es an.
    //   WICHTIG (v2.1), gleicher Grund wie bei SCAN: der Payload setzt als
    //   ERSTE Aktion setDaemonEnabled(ns,"STANEK",0). Ohne das startet die
    //   Queen ihn endlos neu — owner "QUEEN" liefert in shouldRun() einen
    //   unbedingten Treffer VOR der WANT-Pruefung, der oneshotDaemon-Verbrauch
    //   laeuft also ins Leere. Im Spiel gemessen: alle 12-14 Sekunden ein
    //   Neustart, stundenlang. Daher auch deps auf HELPERS (war []).
    //
    //   burst 0 — UND DAS IST ABSICHT, nach einem Fehlversuch in beide Richtungen.
    //
    //   Der Gedanke lag nahe, hier den Bedarf des LADEPROZESSES anzumelden
    //   (burst 256), damit die Queen ihn reserviert und der Dispatcher den Platz
    //   freiraeumt. Live ging das nach hinten los: die Queen verlangt
    //   minRam + burst als JETZT freien Platz auf dem pinHost. Im engen Pool
    //   direkt nach dem Reset (unter 1 TB gesamt) gibt es die 320 GB auf home
    //   nicht, die Reservierung verfaellt nach RESERVE_DEADLINE_MS (in der
    //   QUEEN 90 s; die Konstante gleichen Namens HIER steht auf 20 s und
    //   gehoert zu einem anderen Zweck) und
    //   wird endlos neu versucht. Ergebnis in acht Messzyklen: STANEK lief
    //   ueberhaupt nicht mehr — vorher lief er wenigstens schwach.
    //
    //   Die Anforderungen "klein starten koennen" und "gross laden koennen"
    //   trennen sich nicht ueber die Reservierung, sondern im Payload: der
    //   Daemon bleibt seit v2.3 nach der Ladung WACH, laedt erst mit dem
    //   wenigen, was da ist, und ruestet selbsttaetig nach, sobald der Pool
    //   mindestens das Dreifache hergibt. Dafuer braucht er keine Reservierung
    //   ueber seinen eigenen Bedarf hinaus.
    //
    //   minRam 64 deckt den Daemon (rund 25 GB) mit Luft.
    // v5.4: KEIN Dashboard-Knopf mehr. STANEK ist kein Schalter, den man
    // sinnvoll bedient: ARSENAL schaltet ihn in dem EINEN Fenster je Lauf ein
    // (nach dem Casino, vor dem ersten Aug-Kauf — nur dort laesst sich das
    // Geschenk annehmen), und er schaltet sich selbst wieder aus. Ein Knopf
    // dafuer lud nur dazu ein, ihn zur falschen Zeit zu druecken. Was er tut,
    // steht im Log und im Vollbericht (Abschnitt 4h).
    STANEK:      { file: "SCHWARM-STANEK.js", deps: ["SCHWARM-HELPERS.js"], host: "home", pinHost: "home", minRam: 29, burst: 0, args: [], cap: null, owner: "QUEEN", payload: "STANEK", defaultOff: true, oneshotDaemon: true, showInDashboard: false },

    // INFIL (v1.0): Infiltrations-Dispatcher. Sucht das beste Ziel, startet
    //   inflitrator.js, kassiert die Beute und wiederholt das dauerhaft.
    //   STANDALONE: importiert NICHTS aus HELPERS -> deps leer.
    //   pinHost "home": braucht DOM-Zugriff und legt seine Cache-Dateien dort ab.
    //   burst 16: die teuren Abfragen laufen in kurzlebigen Wegwerf-Skripten
    //     (getInfiltration 15 GB, Augmentations-APIs 12.5 GB) — Casino-Pattern.
    //   --quiet ist PFLICHT: ohne die Flagge öffnet INFIL einen Auswahldialog
    //     (ns.prompt) und ein von der Queen gestarteter Prozess hinge dort fest.
    //   --mode auto: Reputation, bis alle Aug-Anforderungen erfüllt sind, danach
    //     Geld — und zurück, sobald eine neue Faktion dazukommt.
    //   defaultOff: startet ausschließlich über den Dashboard-Schalter. Genau
    //     dieser Schalter steuert zugleich den Fokus von WORK (s. updateFocus dort).
    // v5.8: pinHost BLEIBT — aber aus dem RICHTIGEN Grund. Nicht wegen des DOM
    // (das ist hostunabhaengig), sondern weil DIAG vier INFIL-Dateien LOKAL
    // liest (INFIL_LOG/GOALS/PROBE/STAMP) und ns.read keinen Host-Parameter
    // kennt. Zoege INFIL weg, waere DIAG bei Infiltrationen blind. Aufzuheben
    // waere das nur, wenn INFIL seine Logs nach home scp'te.
    INFIL:       { file: "SCHWARM-INFIL.js", deps: [], host: "home", pinHost: "home", minRam: 15, burst: 16, burstDaemon: true, args: ["--mode", "auto", "--quiet"], cap: CAPS.SING, owner: "QUEEN", defaultOff: true },

    // (v3.0 hatte SCAN als toten Eintrag entfernt, weil der Payload nie existierte.
    //  v3.5 fuehrt ihn richtig ein: SRC_SCAN liegt jetzt in SCHWARM-PAYLOADS.js und
    //  das Dashboard hat einen Knopf dafuer. Siehe Eintrag SCAN oben.)
};

/** Abwärtskompatibler Export (v1-Form): Daemon -> Capability-Flag. */
export const CAPABILITY_GATE = Object.fromEntries(
    Object.entries(DAEMONS).filter(([, d]) => d.cap).map(([k, d]) => [k, d.cap])
);

// ============================================================================
// REGISTRY-ABLEITUNGEN & PAYLOAD-INFRASTRUKTUR (NEU v2.7 — Payload-Umbau)
// ============================================================================


/** Pfad der Queen-State-Datei (Button-Zustand: 0=aus, 1=an, 2=erzwungen).
 *  Zentral hier, damit Queen UND Besitzer (BANK/WORK) denselben Pfad nutzen. */
export const STATE_FILE = "schwarm-queen-state.txt";

/**
 * Liest die Queen-State-Datei -> { KEY: mode } (mode 0|1|2). Format wie von der
 * Queen geschrieben: "KEY:mode|KEY:mode|...". Nur gültige Keys/Modi. Fällt bei
 * fehlender/defekter Datei auf {} zurück (Besitzer wenden dann eigene Defaults an).
 * @param {NS} ns
 * @returns {Object<string, number>}
 */
/** Die gemeinsame Textform "KEY:mode|KEY:mode|..." in ein Objekt zerlegen.
 *  EINE Stelle fuer Datei UND Port — zwei Parser fuer dasselbe Format waeren
 *  genau die Sorte Doppelpflege, die hier schon dreimal Fehler verursacht hat. */
function parseManagedState(raw) {
    const out = {};
    if (raw && typeof raw === "string" && raw.includes(":")) {
        for (const part of raw.split("|")) {
            const [k, v] = part.split(":"); const n = Number(v);
            if (k in DAEMONS && [0, 1, 2].includes(n)) out[k] = n;
        }
    }
    return out;
}

/**
 * QUEEN -> alle: den Schalter-Zustand auf Port STATE_OUT spiegeln (v4.9).
 *
 * Nur die Queen ruft das auf. Sie laeuft auf home, liest dort die Datei und
 * legt denselben Text auf den Port, damit Daemons auf ANDEREN Hosts ihn
 * ueberhaupt sehen koennen (Begruendung ausfuehrlich bei SCHWARM_PORTS.STATE_OUT).
 *
 * @param {NS} ns
 * @param {Object<string, number>} state
 * @returns {boolean}
 */
export function publishManagedState(ns, state) {
    try {
        const teile = [];
        for (const k of Object.keys(state || {})) {
            const n = Number(state[k]);
            if (k in DAEMONS && [0, 1, 2].includes(n)) teile.push(k + ":" + n);
        }
        const h = ns.getPortHandle(SCHWARM_PORTS.STATE_OUT);
        h.clear();
        // Leerer Zustand -> Marke statt gar nichts. Sonst waere "Queen hat noch
        // nichts geschrieben" von "Queen sagt: keine Abweichung von den
        // Vorgaben" nicht zu unterscheiden, und der Leser muesste raten.
        return h.tryWrite(teile.length ? teile.join("|") : "LEER:0");
    } catch (e) { return false; }
}

/**
 * Liest den Queen-State -> { KEY: mode } (mode 0|1|2).
 *
 * REIHENFOLGE, und die ist Absicht: ZUERST die Datei, DANN der Port.
 *   - Auf home liefert die Datei etwas, und das Verhalten ist Zeichen fuer
 *     Zeichen das alte. Die sechs Kern-Daemons, die heute dort laufen, merken
 *     von dieser Aenderung nichts — das ist der ganze Sinn der Reihenfolge.
 *   - Auf jedem anderen Host liefert ns.read einen leeren String (die Datei
 *     liegt dort schlicht nicht; die Queen kopiert sie auch nie mit, sie steht
 *     in keinem deps-Eintrag). Dann greift der Port.
 *
 * Faellt beides aus, kommt {} zurueck — und das heisst weiterhin "keine
 * Abweichung von den Registry-Vorgaben", NICHT "alles aus". Ein leerer Port
 * darf niemals als "aus" gelesen werden: nach einem Neuladen des Spiels ist er
 * fuer genau einen Queen-Takt leer, und in dieser Sekunde wuerde sonst der
 * ganze Schwarm abschalten.
 *
 * @param {NS} ns
 * @returns {Object<string, number>}
 */
// =============================================================================
// DAS HANDLUNGSBUCH (v5.12)
// =============================================================================
// WOZU. Die Engine sagt nirgends, WER etwas getan hat. Wer aus dem ZUSTAND auf
// den URHEBER schliesst, irrt sich frueher oder spaeter — am 21.09.2026
// zweimal hintereinander geschehen. Also schreibt jeder Daemon selbst auf, was
// er tut, und DIAG kann die Handlungen des Schwarms von denen des Spielers
// trennen.
//
// FORM: eine Zeile je Handlung, Felder durch | getrennt.
//     C|00:42:11|upgrade|Smart Storage|ok|+1 fuer $2.25b
//     C|00:42:14|lager|Agriculture/Sector-12|zu teuer|$4.36b, Budget $1.20b
//
// DER AUSGANG IST EIN FELD, KEINE KATEGORIE. Es braucht also keine Zusatzregel
// "auch Fehlschlaege mitschreiben" — eine Handlung ist eine Handlung, ob sie
// gelingt oder nicht. Genau daran waere der Lager-Fehler (CORP v0.43) sofort
// aufgefallen: CORP versuchte JEDE Runde eine Lagerstufe zu kaufen, es passte
// nie ins Budget, und niemand erfuhr es.
//
// KOSTET KEIN RAM: ns.read und ns.write sind mit 0 GB bepreist.
export const CHRONIK_DATEI = "schwarm-chronik.txt";

// Ringpuffer-Obergrenze. DIAG leert die Datei alle ~10 Minuten; faellt DIAG
// aus, waechst sie sonst unbegrenzt. Ein unbegrenzter Sammler ist die Falle,
// in die INFO mit dem Aug-Katalog schon einmal gelaufen ist.
// v5.16: 400 -> 1000. CORP allein schreibt ~170 Zeilen je 10 min; ohne DIAG
// war die Grenze nach ~23 min erreicht.
const CHRONIK_MAX_ZEILEN = 1000;

// Nachtrag 2: verdraengte Portzeilen dieses Prozesses seit der letzten
// eigenen Zeile. Jeder Daemon hat seine eigene Kopie des Moduls.
let chronikVerlorenPort = 0;

/** Nachtrag 2: Markerzeile fuer Zeilen, die der Ringpuffer abgeschnitten hat. */
function chronikVerlustZeile(n) {
    const t = new Date();
    const zz = (x) => String(x).padStart(2, "0");
    return ["X", `${zz(t.getHours())}:${zz(t.getMinutes())}:${zz(t.getSeconds())}`, "chronik", "puffer",
        "verloren", `${n} Zeilen abgeschnitten`, JSON.stringify({ ms: t.getTime(), verlorenPuffer: n })].join("|");
}

/** Nachtrag 2: auf CHRONIK_MAX_ZEILEN kuerzen - mit Markerzeile vorn. */
function chronikKuerzen(zeilen) {
    if (zeilen.length <= CHRONIK_MAX_ZEILEN) return zeilen;
    // Steht vorn schon ein Marker, zaehlt er mit - sonst fiele er beim naechsten
    // Kuerzen samt seiner Zahl heraus (Pruefstand: 6 verloren, Marker sagte 2).
    let vorher = 0, echt = zeilen;
    if (zeilen[0] && zeilen[0].indexOf("|chronik|puffer|verloren|") > 0) {
        try { vorher = Number(JSON.parse(zeilen[0].split("|").slice(6).join("|")).verlorenPuffer) || 0; } catch (e) { vorher = 0; }
        echt = zeilen.slice(1);
    }
    const behalten = CHRONIK_MAX_ZEILEN - 1;
    const weg = Math.max(0, echt.length - behalten);
    return [chronikVerlustZeile(vorher + weg)].concat(echt.slice(-behalten));
}

// FESTE TABELLE, nicht aus dem Namen abgeleitet: Anfangsbuchstaben kollidieren
// (BANK/BLADEBURNER/BITNODE, CORP/CLEAN, DARKNET/DISPATCHER/DIAG). Wer einen
// neuen Daemon ergaenzt, traegt ihn HIER ein — an genau einer Stelle.
export const CHRONIK_KUERZEL = {
    ARSENAL: "A", BLADEBURNER: "B", CORP: "C", DARKNET: "D",
    EXPORTCHECK: "E", GANG: "G", HACKING: "H", INFIL: "I",
    BANK: "K", CLEAN: "L", BITNODE: "N", GO: "O",
    DISPATCHER: "P", QUEEN: "Q", RESET: "R", STANEK: "S",
    TRADER: "T", AUGS: "U", WORK: "W", DIAG: "X",
};

/**
 * Eine Handlung ins Handlungsbuch schreiben.
 *
 * Darf den Takt NIE reissen — es ist eine Aufzeichnung, kein Arbeitsschritt.
 * Deshalb faengt die Funktion alles ab und meldet nur true/false zurueck.
 *
 * @param {NS} ns
 * @param {string} daemon   Schluessel aus CHRONIK_KUERZEL, z.B. "CORP"
 * @param {string} art      was fuer eine Handlung, z.B. "upgrade", "lager"
 * @param {string} woran    Gegenstand, z.B. "Smart Storage" oder "Agri/Aevum"
 * @param {string} ausgang  "ok", "zu teuer", "fehler", ... — ein FELD, keine
 *                          Kategorie: auch ein Fehlschlag ist eine Handlung.
 * @param {string} [dazu]   Freitext, z.B. Betrag
 * @param {object} [daten]  v5.16: maschinenlesbar, wird als JSON das siebte
 *                          Feld. Ueblich: betrag (EXAKT, keine formatMoney-
 *                          Rundung), topf (Feld in getMoneySources, z.B.
 *                          "gang_expenses"), id (Freigabe-id). ms setzt
 *                          chronik() selbst.
 * @returns {boolean} geschrieben?
 */
/** v5.14: alles einsammeln, was Daemons auf fremden Rechnern in den Port gelegt haben. */
function chronikPortLeeren(ns) {
    const aus = [];
    try {
        const h = ns.getPortHandle(SCHWARM_PORTS.CHRONIK);
        for (let i = 0; i < 1000 && !h.empty(); i++) {
            const v = h.read();
            if (typeof v === "string" && v.length) aus.push(v);
        }
    } catch (e) { /* ohne Port nichts */ }
    return aus;
}

export function chronik(ns, daemon, art, woran, ausgang, dazu, daten) {
    try {
        const k = CHRONIK_KUERZEL[daemon] || "?";
        const t = new Date();
        const zz = (n) => String(n).padStart(2, "0");
        const zeit = `${zz(t.getHours())}:${zz(t.getMinutes())}:${zz(t.getSeconds())}`;
        // | ist das Trennzeichen und darf im Text nicht vorkommen.
        const sauber = (x) => String(x === undefined || x === null ? "" : x).replace(/\|/g, "/").replace(/[\r\n]+/g, " ");
        const felder = [k, zeit, sauber(art), sauber(woran), sauber(ausgang), sauber(dazu)];
        // v5.16: siebtes Feld, maschinenlesbar. Die Uhrzeit oben hat kein
        // Datum und Betraege stehen dort nur gerundet - fuer den Abgleich mit
        // dem Kassenbuch der Engine braucht es beides exakt. JSON enthaelt
        // kein | als Syntax; in Zeichenketten wird es wie oben zu /.
        let extra = { ms: t.getTime() };
        if (daten && typeof daten === "object") extra = Object.assign(extra, daten);
        if (chronikVerlorenPort > 0) extra.verlorenPort = chronikVerlorenPort;   // Nachtrag 2
        felder.push(JSON.stringify(extra).split("|").join("/"));
        const zeile = felder.join("|");

        // v5.14 — DAS BUCH LIEGT AUF HOME, EGAL WO DER DAEMON LAEUFT.
        // ns.read/ns.write treffen nur den EIGENEN Rechner; DIAG liest auf home.
        // Nicht auf home -> Port (voll: die aelteste Zeile faellt raus). Auf
        // home -> Datei, und dabei gleich einsammeln, was im Port wartet.
        // ns.self() kostet 0 GB (getHostname haette 0,05 gekostet).
        let host = "home";
        try { host = ns.self().server; } catch (e) { host = "home"; }
        if (host !== "home") {
            // Nachtrag 2: write() gibt die verdraengte (aelteste) Zeile zurueck,
            // wenn der Port voll war. Unsere Zeile steht jetzt drin und traegt
            // die bisher gezaehlten mit; ab hier zaehlt nur der neue Verlust.
            const weg = ns.getPortHandle(SCHWARM_PORTS.CHRONIK).write(zeile);
            chronikVerlorenPort = (weg !== null && weg !== undefined) ? 1 : 0;
            return true;
        }
        const ausPort = chronikPortLeeren(ns);

        let alt = "";
        try { alt = ns.read(CHRONIK_DATEI) || ""; } catch (e) { alt = ""; }
        let zeilen = alt ? alt.split("\n").filter(z => z.length > 0) : [];
        for (const z of ausPort) zeilen.push(z);   // v5.14: aeltere zuerst
        zeilen.push(zeile);
        // Ringpuffer: die aeltesten fallen hinten raus - Nachtrag 2: mit Marker.
        zeilen = chronikKuerzen(zeilen);
        ns.write(CHRONIK_DATEI, zeilen.join("\n") + "\n", "w");
        return true;
    } catch (e) {
        return false;   // eine Aufzeichnung darf nie den Takt reissen
    }
}

/**
 * Das Handlungsbuch holen — und dabei leeren.
 *
 * DIAG ruft das einmal je Bericht auf. Dadurch enthaelt jeder Bericht genau
 * die Handlungen seines Zeitraums, und die Datei kann nicht wachsen. Die
 * Aufbewahrung uebernimmt das Berichtsarchiv, das ohnehin fortlaufend ablegt.
 *
 * @param {NS} ns
 * @param {boolean} [leeren=true]  false = nur lesen (zum Nachschauen)
 * @returns {{k:string,zeit:string,art:string,woran:string,ausgang:string,dazu:string,daten:object|null,roh:string}[]}
 */
export function chronikLesen(ns, leeren) {
    let roh = "";
    try { roh = ns.read(CHRONIK_DATEI) || ""; } catch (e) { return []; }
    // v5.14: auch, was ueber den Port kam (Daemons auf fremden Rechnern).
    // Nur beim Leeren - wer nur hineinschaut, soll den Port nicht leeren.
    if (leeren !== false) {
        const ausPort = chronikPortLeeren(ns);
        if (ausPort.length) roh = roh + String.fromCharCode(10) + ausPort.join(String.fromCharCode(10));
        try { ns.write(CHRONIK_DATEI, "", "w"); } catch (e) { /* egal */ }
    }
    const aus = [];
    for (const z of roh.split("\n")) {
        if (!z) continue;
        const f = z.split("|");
        if (f.length < 5) continue;
        // v5.16: siebtes Feld (JSON) und die Rohzeile fuer den Kassenabschnitt.
        let daten = null;
        if (f.length > 6) { try { daten = JSON.parse(f.slice(6).join("|")); } catch (e) { daten = null; } }
        aus.push({ k: f[0], zeit: f[1], art: f[2], woran: f[3], ausgang: f[4], dazu: f[5] || "", daten, roh: z });
    }
    return aus;
}

/**
 * v5.16 — Port 35 in die Datei umschichten, OHNE die Datei zu leeren.
 *
 * Der Port fasst 50 Zeilen (Settings.MaxPortCapacity), und bei Ueberlauf
 * wirft die Engine die AELTESTE lautlos weg. Geleert wurde er nur von einem
 * chronik()-Aufruf auf home (praktisch nur CORP) oder von DIAG alle 10 min -
 * ohne Corp (BN15-Test) blieben damit 50 Zeilen je 10 min fuer ALLE Daemons
 * auf fremden Rechnern zusammen. DIAG ruft das jetzt bei jeder Probe.
 * Laeuft nur auf home sinnvoll (ns.read/ns.write treffen den eigenen Rechner).
 * @param {NS} ns
 * @returns {number} umgeschichtete Zeilen
 */
export function chronikUmschichten(ns) {
    try {
        const ausPort = chronikPortLeeren(ns);
        if (!ausPort.length) return 0;
        const NLZ = String.fromCharCode(10);
        let alt = "";
        try { alt = ns.read(CHRONIK_DATEI) || ""; } catch (e) { alt = ""; }
        let zeilen = alt ? alt.split(NLZ).filter(z => z.length > 0) : [];
        for (const z of ausPort) zeilen.push(z);
        zeilen = chronikKuerzen(zeilen);   // Nachtrag 2: mit Marker
        ns.write(CHRONIK_DATEI, zeilen.join(NLZ) + NLZ, "w");
        return ausPort.length;
    } catch (e) {
        return 0;
    }
}

export function readManagedState(ns) {
    try {
        const ausDatei = parseManagedState(ns.read(STATE_FILE));
        if (Object.keys(ausDatei).length > 0) return ausDatei;
    } catch (e) { /* kein Zugriff -> Port versuchen */ }
    try {
        const v = ns.peek(SCHWARM_PORTS.STATE_OUT);
        if (v === EMPTY_PORT || typeof v !== "string") return {};
        return parseManagedState(v);      // "LEER:0" ergibt {} — LEER ist kein Daemon-Key
    } catch (e) { return {}; }
}

/**
 * Schreibt EINEN Daemon-Schalter in die Queen-State-Datei (der fehlende Gegen-
 * part zu readManagedState). Ohne diesen Schreiber hatten die Dashboard-Buttons
 * keine Wirkung: die Queen killte den Prozess, fand im nächsten Takt aber keinen
 * State-Eintrag und nahm den Registry-Default "an" -> Daemon startete sofort neu.
 *
 * Format identisch zum Leser: "KEY:mode|KEY:mode|...", mode 0=aus, 1=an, 2=erzwungen.
 * Merge-sicher: liest den vorhandenen State, ändert nur den einen Key, schreibt
 * alles zurück. Ungültige Keys/Modi werden ignoriert (kein Schreiben).
 *
 * @param {NS} ns
 * @param {string} key   Daemon-Key aus DAEMONS.
 * @param {number} mode  0=aus, 1=an, 2=erzwungen.
 * @returns {boolean}    true, wenn geschrieben wurde.
 */
// v4.7 — EIN GESCHEITERTER SCHALTER DARF NICHT SCHWEIGEN.
//
// setDaemonEnabled lieferte bei jedem Fehlschlag sauber `false` — und JEDER
// Aufrufer warf den Wert weg, meist in einem stillen try/catch. Gefunden beim
// Healthcheck an vier Stellen (RESET, STANEK, SCAN, QUEEN.readStateHealed).
//
// Warum das schlimmer ist als es aussieht: der Schalterstand ist der
// folgenreichste GEMEINSAME Zustand im Schwarm. Schlaegt das Schreiben fehl,
// glaubt der Daemon, er habe sich abgeschaltet — die Datei sagt weiter "an",
// und die Queen startet ihn wieder. Bei den One-Shots (RESET, STANEK, SCAN)
// heisst das im schlimmsten Fall: die einmalige Handlung laeuft erneut.
//
// Gemeldet wird hoechstens einmal je Minute und Schalter: ein Dauerfehler soll
// auffallen, aber das Terminal nicht zulaufen lassen.
const _schalterGemeldet = new Map();
function _schalterFehler(ns, key, grund) {
    try {
        const jetzt = Date.now();
        if (jetzt - (_schalterGemeldet.get(key) || 0) < 60_000) return;
        _schalterGemeldet.set(key, jetzt);
        announce(ns, "error", `Schalter ${key} liess sich nicht setzen (${grund}). `
            + `Der Daemon glaubt jetzt etwas anderes als ${STATE_FILE}.`);
    } catch (e) { /* Melden darf nie die Ursache verschlimmern */ }
}

export function setDaemonEnabled(ns, key, mode) {
    try {
        if (!(key in DAEMONS)) { _schalterFehler(ns, key, "unbekannter Daemon"); return false; }
        const m = Number(mode);
        if (![0, 1, 2].includes(m)) { _schalterFehler(ns, key, `ungueltiger Modus ${mode}`); return false; }
        const s = readManagedState(ns);   // {} bei fehlender Datei -> sauberer Erststart
        s[key] = m;
        const line = Object.entries(s)
            .filter(([k, v]) => k in DAEMONS && [0, 1, 2].includes(Number(v)))
            .map(([k, v]) => `${k}:${v}`)
            .join("|");
        ns.write(STATE_FILE, line, "w");
        // Gegenlesen: ns.write wirft nicht, wenn der Inhalt nicht ankommt —
        // etwa weil die Datei gerade anderweitig beschrieben wurde. Der Schalter
        // ist zu wichtig, um sich auf "kein Fehler geworfen" zu verlassen.
        let zurueck = "";
        try { zurueck = ns.read(STATE_FILE) || ""; } catch (e) { zurueck = ""; }
        if (zurueck !== line) { _schalterFehler(ns, key, "zurueckgelesen weicht ab"); return false; }
        return true;
    } catch (e) {
        _schalterFehler(ns, key, String(e && e.message ? e.message : e));
        return false;
    }
}

/**
 * Soll ein Daemon laufen? Kapselt die Default-Regel: fehlt ein Eintrag (erster
 * Boot), gilt AN — außer der Daemon ist triggered oder defaultOff (dann AUS).
 * Mode 0 = aus, 1/2 = an. Damit lesen BANK/WORK den An/Aus-Zustand ihrer
 * Payloads, ohne dass die Dashboard-Buttons ihre Wirkung verlieren.
 * @param {NS} ns
 * @param {string} key   Daemon-Key aus DAEMONS.
 * @param {Object<string,number>} [state]  Vorab geladener State (spart Re-Read).
 * @returns {boolean}
 */
export function isDaemonEnabled(ns, key, state) {
    const d = DAEMONS[key];
    if (!d) return false;
    const s = state || readManagedState(ns);
    if (key in s) return s[key] !== 0;
    return !(d.triggered || d.defaultOff);
}

// ── Payload-Kodierung ───────────────────────────────────────────────────────
// Eingebettete Skript-Quellen werden beim GENERIEREN kollisionsfrei kodiert:
//   Backtick (`) -> __SCHWARM_BT__ ,  ${ -> __SCHWARM_DC__
// Reines ASCII, damit die Sentinels Copy-Paste in den Spiel-Editor unbeschadet
// überstehen (Private-Use-Codepoints tun das nicht immer). Kollision wird beim
// Generieren je Quelle geprüft — die Tokens kommen in echtem Code nicht vor.
// So lässt sich BELIEBIGER Code als Template-String einbetten, ohne von Hand zu
// escapen. decodePayload() macht das vor dem ns.write rückgängig. Bei bereits
// sauberen Quellen (backtick-/${-frei, z.B. Worker/Solver/Backdoor) ist die
// Dekodierung ein No-Op. Die kodierten Quellen liegen in SCHWARM-PAYLOADS.js.
export const PAYLOAD_BACKTICK = "__SCHWARM_BT__";
export const PAYLOAD_DOLLARCURLY = "__SCHWARM_DC__";

/**
 * Kodierten Payload-Quelltext in echten, ausführbaren Quelltext zurückwandeln.
 * split/join statt replaceAll für maximale Interpreter-Kompatibilität. No-Op auf
 * bereits sauberen Quellen.
 * @param {string} encoded  Quelltext aus SCHWARM-PAYLOADS.js (kodiert oder sauber).
 * @returns {string} Ausführbar, bereit für ns.write(file, src, "w").
 */
export function decodePayload(encoded) {
    return String(encoded)
        .split(PAYLOAD_BACKTICK).join("`")
        .split(PAYLOAD_DOLLARCURLY).join("${");
}

/** Marke, die ein Payload am Kopf traegt und die injectPorts() ersetzt. */
export const PORTS_MARKER = "/*__PORTS__*/";

/**
 * PORTNUMMERN IN EINEN PAYLOAD EINSETZEN (v4.0).
 *
 * DAS PROBLEM, DAS DAS LOEST: Payload-Daemons sind standalone — sie liegen als
 * String in SCHWARM-PAYLOADS.js bzw. SCHWARM-DARKNET.js und koennen HELPERS
 * nicht importieren. Ihre Portnummern standen deshalb als LITERALE im Quelltext:
 *
 *     const PORT_MANIP = 34;      // in SCHWARM-TRADER
 *     const DNET_PORTS = { ..., ORDERS: 34 };   // in SCHWARM-DARKNET
 *
 * Zwei Dateien, dieselbe Zahl, beide mit clear()+tryWrite() im Sekundentakt —
 * das war die Port-34-Kollision. Zwei Versionen vorher hatte dieselbe Bauart
 * schon Port 19 zerlegt. Eine reine Neunummerierung haette daran nichts
 * geaendert: der naechste neue Kanal waere wieder von Hand vergeben worden.
 *
 * JETZT: Der Payload traegt an genau einer Stelle die Marke
 *
 *     /*__PORTS__* /          (ohne Leerzeichen; hier nur wegen des Kommentars)
 *
 * und benutzt darunter ganz normal SCHWARM_PORTS.XYZ. Beim Materialisieren
 * ersetzt diese Funktion die Marke durch die AKTUELLE Tabelle. Der Payload kann
 * damit nicht mehr driften — er hat keine eigene Zahl mehr, die veralten koennte.
 *
 * Fehlt die Marke, bleibt der Quelltext unveraendert (No-Op fuer Payloads ohne
 * Ports, z. B. die vier Worker).
 *
 * @param {string} src  Bereits DEKODIERTER Quelltext.
 * @returns {string}
 */
export function injectPorts(src) {
    const s = String(src);
    if (!s.includes(PORTS_MARKER)) return s;
    const block = "const SCHWARM_PORTS = " + JSON.stringify(SCHWARM_PORTS) + ";";
    return s.split(PORTS_MARKER).join(block);
}

/**
 * Geld-Politik (Stufe A, statisch). Anteile = Bruchteil des VERFÜGBAREN Geldes
 * (Geld minus RESERVE), den eine Domäne pro Zyklus ausgeben darf.
 * RESERVE = absolute $-Untergrenze, die niemand antastet.
 * AUGS kauft per Doktrin nur das Top-Aug seiner Liste und wartet sonst —
 * "Geld an letzter Stelle" ist damit verhaltensbasiert gesichert.
 * In Stufe B überschreibt der Treasurer-Daemon diese Werte dynamisch auf Port 5.
 */
export const DEFAULT_TREASURY = {
    RESERVE: 0,      // 0 = kein Polster (früh ok). Später anheben.
    SERVERS: 0.40,   // Cloud-Server
    AUGS: 0.30,      // Augmentierungen
    NODES: 0.10,     // Hacknet
    STOCKS: 0.15,    // Trader (klein gehalten — nicht mehr Erster an der Kasse)
};

/**
 * Aug-Stat-Gewichtung — SINGLE SOURCE OF TRUTH für alle Aug-Bewertungen.
 *
 * GEAENDERT (v2.8, VEREINHEITLICHUNG): Vorher gab es ZWEI konkurrierende Systeme:
 * dieses AUG_WEIGHTS (faction_rep 10, hacking_speed 8, …) und ein davon völlig
 * abweichendes TIER-Array im AUGS-Payload (hacknet_node_money 100000, hacking_speed
 * 10000, faction_rep 3000, …). Beide bewerteten dieselben Augs unterschiedlich —
 * wer immer AUG_WEIGHTS nutzte (z.B. WORK für die Rep-Ziel-Wahl), farmte damit
 * potenziell Ruf für ANDERE Augs, als AUGS anschließend kaufte. Jetzt eine Quelle;
 * AUGS importiert scoreAugStats() und hat kein eigenes Scoring mehr.
 *
 * Kategorie-Tiers (großer Abstand => Kategorie dominiert die Reihenfolge):
 *   1. HASH-RATE  (hacknet_node_money …) — in BN9 die Haupteinnahme
 *   2. HACK-RATE  (hacking_speed/money/grow/chance)
 *   3. REP-GEWINN (faction_rep, company_rep) — selbstverstärkend: mehr Rep ->
 *                 schneller neue Augs -> mehr Rep-Mults … deshalb VOR den Stats
 *   4. STATS      (hacking/str/def/dex/agi/charisma + _exp)
 *   5. REST       (crime, bladeburner, work_money …) -> AUG_REST_WEIGHT
 *
 * Reihenfolge = Match-Reihenfolge (key.includes): "hacking_speed" muss VOR dem
 * generischen "hacking" stehen, sonst frisst es dieses.
 */
export const AUG_WEIGHTS = [
    ["hacknet_node_money", 100000],  // HASH-RATE (Einnahme in BN9)
    ["hacknet",             40000],  // sonstige Hacknet-Mults (Kostensenkung)
    ["hacking_speed",       10000],  // HACK-RATE
    ["hacking_money",       10000],
    ["hacking_grow",         9000],
    ["hacking_chance",       8000],
    ["faction_rep",          3000],  // REP-GEWINN (vor Stats)
    ["company_rep",          2500],
    ["hacking_exp",          1500],  // STATS
    ["hacking",              1200],
    ["strength",              300],
    ["defense",               300],
    ["dexterity",             300],
    ["agility",               300],
    ["charisma",              300],
];

/** Gewicht für alles, was in AUG_WEIGHTS nicht gematcht wird (crime_*, bladeburner_* …). */
export const AUG_REST_WEIGHT = 50;

// PRIORITY_AUGS wurde am 05.09.2026 entfernt: die Liste war exportiert,
// aber kein einziger Daemon importierte sie. Ein Kommentar beschrieb sie
// als geltende Regel ("Sonderfall-Augs: immer kaufwuerdig") - tatsaechlich
// kauft BANK ueber pickCheapestAug rein preisgesteuert. Wer die Politik
// will, muss sie dort einbauen, nicht hier deklarieren.


/**
 * Score eines Augs aus seinen Stats (Multiplikator-Objekt von getAugmentationStats).
 * Ein Aug summiert die Gewichte ALLER seiner Multiplikatoren, gewichtet mit der
 * Stärke des jeweiligen Mults. Reine Funktion, 0 GB RAM.
 * @param {Object<string, number>} stats
 * @returns {number} Gewichteter Score (>= 0)
 */
export function scoreAugStats(stats) {
    let score = 0;
    for (const [key, val] of Object.entries(stats || {})) {
        if (typeof val !== "number" || val === 1) continue;
        const hit = AUG_WEIGHTS.find(([pattern]) => key.includes(pattern));
        const w = hit ? hit[1] : AUG_REST_WEIGHT;
        score += w * Math.abs(val - 1);
    }
    return score;
}

/** Präfix gekaufter Server (SCHWARM-BANK.js vergibt 'pserv-N';
 *  INFRA ist seit v3.0 in die BANK gewandert). */
export const PSERV_PREFIX = "pserv-";

/** Standard-Sentinel, den ns.peek() / port.read() bei leerem Port liefert. */
const EMPTY_PORT = "NULL PORT DATA";

// =============================================================================
// 2. POSTFACH-GRUNDLAGE — die vier Zugriffsarten
// =============================================================================
//
// ALLES, was im Schwarm ueber Ports laeuft, geht durch genau diese vier
// Funktionen. Sie sind der Grund, warum die Regel aus der Port-Tabelle
// durchgehalten werden KANN: wer einen Kanal braucht, waehlt eine der vier und
// muss sich nicht ueberlegen, ob er clear() vor tryWrite() setzt oder nicht.
//
//   AUSGANG (peek, ein Schreiber)      readOut(port)  ·  writeOutField(port, feld, wert)
//   EINGANG (FIFO, ein Leser)          pushIn(port, nachricht)  ·  drainIn(port)
//
// WARUM writeOutField LIEST, BEVOR ES SCHREIBT: Ein Ausgang traegt mehrere
// Felder, die an verschiedenen Stellen im Takt gesetzt werden (BANK schreibt
// z.B. `info` am Tickende, `augBuy` aber schon beim Aug-Schritt). Wuerde jede
// Publish-Funktion das ganze Objekt ersetzen, loeschte sie die Felder der
// anderen. Read-Modify-Write ist hier gefahrlos, weil per Definition nur EIN
// Prozess auf einen Ausgang schreibt — es gibt keinen zweiten Schreiber, mit
// dem man sich verschraenken koennte.
//
// KOSTEN: peek/clear/tryWrite/read sind alle 0 GB (RamCostGenerator.ts). Die
// Read-Modify-Write-Runde kostet also nur einen JSON.parse — deshalb liegen die
// drei Kanaele, die je 2-s-Takt gelesen werden, bewusst NICHT in einem Ausgang
// (siehe Ausnahmen 19-21 in der Port-Tabelle).

/**
 * AUSGANG lesen. Liefert immer ein Objekt — bei leerem oder defektem Port {}.
 * Damit ist `readOut(ns, P).feld` an jeder Stelle sicher.
 * @param {NS} ns
 * @param {number} port
 * @returns {Object}
 */
export function readOut(ns, port) {
    try {
        const v = ns.peek(port);
        if (v === EMPTY_PORT || typeof v !== "string" || v.length === 0) return {};
        const o = JSON.parse(v);
        return (o && typeof o === "object") ? o : {};
    } catch (e) { return {}; }
}

/**
 * EIN Feld im eigenen AUSGANG setzen; alle anderen Felder bleiben stehen.
 * `undefined` als Wert loescht das Feld.
 * @param {NS} ns
 * @param {number} port
 * @param {string} field
 * @param {*} value
 * @returns {boolean}
 */
export function writeOutField(ns, port, field, value) {
    try {
        const o = readOut(ns, port);
        if (value === undefined) delete o[field]; else o[field] = value;
        const h = ns.getPortHandle(port);
        h.clear();
        return h.tryWrite(JSON.stringify(o));
    } catch (e) { return false; }
}

/**
 * EREIGNIS in einen fremden EINGANG legen (FIFO, nicht ueberschreibend).
 * @param {NS} ns
 * @param {number} port
 * @param {string} message
 * @returns {boolean} false, wenn der Port voll ist (Tiefe 50 je Port).
 */
export function pushIn(ns, port, message) {
    try { return ns.getPortHandle(port).tryWrite(String(message)); }
    catch (e) { return false; }
}

/**
 * Den EIGENEN EINGANG komplett leeren und die Nachrichten zurueckgeben.
 * IMMER vollstaendig leeren, nie einzeln lesen: ein Eingang, der nur teilweise
 * geleert wird, laeuft nach 50 Nachrichten voll, und ab dann liefert pushIn
 * still `false` — genau die Sorte Fehler, die man erst Stunden spaeter merkt.
 * @param {NS} ns
 * @param {number} port
 * @param {number} [max=200] Notbremse gegen eine Endlosschleife bei defektem Port.
 * @returns {string[]} Nachrichten in Eingangsreihenfolge.
 */
export function drainIn(ns, port, max = 200) {
    const out = [];
    try {
        const h = ns.getPortHandle(port);
        for (let i = 0; i < max && !h.empty(); i++) out.push(String(h.read()));
    } catch (e) { /* Teilergebnis ist besser als nichts */ }
    return out;
}

// =============================================================================
// 2b. QUEEN-EINGANG (Port 2) — Kommandos UND Spawn-Meldungen in EINEM Durchgang
// =============================================================================

/**
 * Befehl an die Queen senden (String, z.B. "STOP:TRADER").
 * @param {NS} ns
 * @param {string} command
 * @returns {boolean} true, wenn geschrieben; false, wenn der Port voll ist.
 */
export function sendCmd(ns, command) {
    return pushIn(ns, SCHWARM_PORTS.QUEEN_IN, command);
}

// =============================================================================
// 3. PHASEN
// =============================================================================

/**
 * Bootstrap-Phase setzen (überschreibt den Port-Wert).
 * @param {NS} ns
 * @param {string} phase Wert aus PHASE.
 * @returns {boolean}
 */
export function setPhase(ns, phase) {
    return writeOutField(ns, SCHWARM_PORTS.QUEEN_OUT, "phase", String(phase));
}

/**
 * Aktuelle Bootstrap-Phase lesen (peek, nicht-konsumierend).
 * @param {NS} ns
 * @returns {string|null} Phase oder null, wenn noch keine gesetzt wurde.
 */
export function getPhase(ns) {
    const p = readOut(ns, SCHWARM_PORTS.QUEEN_OUT).phase;
    return (typeof p === "string" && p.length > 0) ? p : null;
}

// =============================================================================
// 4. CAPABILITY
// =============================================================================

/**
 * Capability-Snapshot veröffentlichen (überschreibt Port 4).
 * Format: "TIX:1|FOURS:0|GANG:1|..."
 * @param {NS} ns
 * @param {Object<string, boolean>} caps Flags aus CAPS als Schlüssel.
 * @returns {boolean}
 */
export function publishCapabilities(ns, caps) {
    // v4.0: Feld in QUEEN_OUT statt eigener Port. Das Delimited-String-Format
    // bleibt erhalten — detectCapabilities liefert neben Booleans auch die
    // SF4-STUFE als Zahl, und "SF4:3" muss durch readCapabilities wieder als 3
    // ankommen, nicht als true.
    const s = Object.entries(caps || {})
        .map(([k, v]) => `${k}:${typeof v === "number" ? v : (v ? 1 : 0)}`).join("|");
    return writeOutField(ns, SCHWARM_PORTS.QUEEN_OUT, "caps", s);
}

/**
 * Capability-Snapshot lesen (peek).
 * @param {NS} ns
 * @returns {Object<string, boolean>} Leeres Objekt, wenn nichts gesetzt.
 */
export function readCapabilities(ns) {
    try {
        const v = readOut(ns, SCHWARM_PORTS.QUEEN_OUT).caps;
        if (typeof v !== "string" || v.length === 0) return {};
        const out = {};
        for (const part of v.split("|")) {
            const [k, val] = part.split(":");
            if (!k) continue;
            // "1"/"0" sind Booleans, alles andere Numerische ist eine STUFE.
            // Vorher stand hier stur `val === "1"` — damit kam SF4 Level 3 als
            // `false` zurueck. Aufgefallen war das nie, weil alle Leser nur auf
            // Wahrheitswert pruefen; wer die Stufe braucht, nimmt bisher den
            // INFO-bn-Block. Ein Wert > 1 bleibt jetzt trotzdem erhalten, und
            // die Wahrheitswert-Pruefungen funktionieren unveraendert weiter.
            if (val === "1") { out[k] = true; continue; }
            if (val === "0") { out[k] = false; continue; }
            const n = Number(val);
            out[k] = Number.isFinite(n) ? n : false;
        }
        return out;
    } catch (e) { return {}; }
}

/**
 * Einzelnes Capability-Flag prüfen.
 * @param {NS} ns
 * @param {string} flag Flag aus CAPS.
 * @returns {boolean}
 */
export function hasCapability(ns, flag) {
    return readCapabilities(ns)[flag] === true;
}

// =============================================================================
// 5. TREASURY (Stufe A — Port 5 + reserve.txt-Bridge)
// =============================================================================

/**
 * Geld-Politik veröffentlichen (überschreibt Port 5). Unbekannte Felder werden
 * mit DEFAULT_TREASURY aufgefüllt. Format: "RESERVE:10000000|SERVERS:0.4|..."
 * @param {NS} ns
 * @param {Object<string, number>} [treasury] Teil- oder Vollpolitik.
 * @returns {boolean}
 */
export function publishTreasury(ns, treasury) {
    const merged = { ...DEFAULT_TREASURY, ...(treasury || {}) };
    const s = Object.entries(merged).map(([k, v]) => `${k}:${v}`).join("|");
    return writeOutField(ns, SCHWARM_PORTS.QUEEN_OUT, "treasury", s);
}

/**
 * Geld-Politik lesen (peek). Fällt bei leerem/defektem Port auf
 * DEFAULT_TREASURY zurück — Spender sind dadurch immer handlungsfähig.
 * @param {NS} ns
 * @returns {Object<string, number>}
 */
export function readTreasury(ns) {
    try {
        const v = readOut(ns, SCHWARM_PORTS.QUEEN_OUT).treasury;
        if (typeof v !== "string" || !v.includes(":")) {
            return { ...DEFAULT_TREASURY };
        }
        const out = { ...DEFAULT_TREASURY };
        for (const part of v.split("|")) {
            const [k, val] = part.split(":");
            const num = Number(val);
            if (k && !Number.isNaN(num)) out[k] = num;
        }
        return out;
    } catch (e) { return { ...DEFAULT_TREASURY }; }
}


/**
 * Bridge: spiegelt die RESERVE aus Port 5 nach reserve.txt, damit Drittskripte
 * (gangs.js liest reserve.txt nativ) ohne Code-Eingriff angebunden sind.
 * Von der Queen einmal pro Zyklus aufrufen. Schreibt nur bei Änderung.
 * @param {NS} ns
 * @returns {boolean}
 */
export function syncReserveFile(ns) {
    try {
        const t = readTreasury(ns);
        const val = String(t.RESERVE || 0);
        if (ns.read("reserve.txt") !== val) ns.write("reserve.txt", val, "w");
        return true;
    } catch (e) { return false; }
}

// =============================================================================
// 5b. HASH-BEDARF (Port 6, BANK_IN — Produzenten -> BANK)
// =============================================================================
//
// Mehrere Schreiber, EIN Leser (SCHWARM-HASHNET.js). Deshalb FIFO statt
// peek-Snapshot: bei einem Ein-Wert-Port würden sich CORP und WORK gegenseitig
// überschreiben. Nachrichtenformat (eine Zeile, keine Semikolons in Werten):
//
//     PRODUZENT|schlüssel=wert;schlüssel=wert
//
// Beispiele:
//     CORP|funds=8.3e11;researchDiv=Agro;researchWant=1
//     WORK|company=MegaCorp;doing=COMPANY
//     WORK|doing=STUDY
//
// Produzenten melden periodisch (jeder Tick oder alle paar Sekunden reicht).
// Der Verteiler hält je Produzent nur den LETZTEN Stand samt Zeitstempel und
// behandelt Meldungen älter als sein Staleness-Fenster als "kein Bedarf".

/**
 * Hash-Bedarf melden (Produzent -> BANK, FIFO auf Port 6 mit Praefix "HASH|").
 * Gelesen von drainBankInbox. Einen eigenen HASHNET-Daemon gibt es nicht mehr.
 * @param {NS} ns
 * @param {string} producer  z.B. "CORP" oder "WORK"
 * @param {Object<string,string|number|boolean>} fields  flache Schlüssel/Wert-Paare
 * @returns {boolean} true, wenn geschrieben; false bei vollem/defektem Port.
 */
export function publishHashNeed(ns, producer, fields) {
    const body = Object.entries(fields || {})
        .map(([k, v]) => `${k}=${String(v).replace(/[;|]/g, ",")}`)
        .join(";");
    return pushIn(ns, SCHWARM_PORTS.BANK_IN, `HASH|${producer}|${body}`);
}

/**
 * Cache-Bedarf melden (BANK an sich selbst: teuerstes gewuenschtes Hash-Ziel).
 * BANK vergroessert den Hash-Speicher, sobald die Kapazitaet dieses Ziel
 * (+ Buffer) nicht fasst. Feld in BANK_OUT, weil es ein ZUSTAND ist.
 * @param {NS} ns
 * @param {number} hashes  Hash-Kosten des teuersten gewünschten Ziels (0 = kein Bedarf)
 * @returns {boolean}
 */
export function publishHashCacheNeed(ns, hashes) {
    return writeOutField(ns, SCHWARM_PORTS.BANK_OUT, "hashCache",
        Math.max(0, Math.floor(hashes || 0)));
}

/**
 * Cache-Bedarf lesen. Fällt bei leerem/defektem Port auf 0.
 * @param {NS} ns
 * @returns {number} Hash-Kosten des teuersten gewünschten Ziels (0 = kein Bedarf)
 */
export function readHashCacheNeed(ns) {
    const n = Number(readOut(ns, SCHWARM_PORTS.BANK_OUT).hashCache);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

// =============================================================================
// 5c. SPAWN-MELDEWEG (Port 22 — Owner -> QUEEN)                          [v3.0]
// =============================================================================
//
// Ersetzt die alte Backdoor-Koordination (Ports 10/11) UND die drei parallelen
// Deploy-Pfade (Queen + BANK + WORK riefen alle deployDaemon()).
//
// GRUNDPRINZIP:
//   Ein Owner (BANK/WORK) entscheidet FACHLICH, ob ein Payload-Daemon laufen soll.
//   Er deployt ihn aber NICHT selbst, sondern meldet:
//
//       sendSpawnWant(ns, "TRADER")   -> "TRADER soll laufen"   (idempotent!)
//       sendSpawnDrop(ns, "TRADER")   -> "TRADER soll enden"
//
//   Die Queen sammelt die Meldungen (drainSpawnWants), prüft Dashboard-Freigabe +
//   Capability, wählt den Host, sagt dem Dispatcher über Port 6, wieviel RAM dort
//   freizumachen ist, materialisiert den Payload und startet ihn.
//
// IDEMPOTENZ + TTL:
//   Der Owner wiederholt sein WANT etwa alle SPAWN_WANT_REFRESH_MS (10 s). Die Queen
//   lässt WANTs nach SPAWN_WANT_TTL_MS (45 s) verfallen. Stirbt ein Owner, startet
//   die Queen also nichts Neues nach — bereits Laufendes bleibt aber unangetastet
//   (kein Selbstmord-Pakt).
//
// VORRANG: Der Dashboard-Schalter schlägt jedes WANT. state=0 (STOP) gewinnt immer.

/** Owner -> QUEEN: Payload-Daemon anfordern. IDEMPOTENT — periodisch wiederholen
 *  (siehe SPAWN_WANT_REFRESH_MS), sonst verfällt der Wunsch nach SPAWN_WANT_TTL_MS.
 *  @param {NS} ns
 *  @param {string} key  Daemon-Key aus DAEMONS.
 *  @returns {boolean}   true, wenn die Meldung in den Port passte. */
export function sendSpawnWant(ns, key) {
    return pushIn(ns, SCHWARM_PORTS.QUEEN_IN, "WANT:" + key);
}

/** Owner -> QUEEN: Payload-Daemon abbestellen. Die Queen beendet eine laufende
 *  Instanz und startet sie nicht neu, bis ein neues WANT eintrifft.
 *  @param {NS} ns
 *  @param {string} key  Daemon-Key aus DAEMONS.
 *  @returns {boolean} */
export function sendSpawnDrop(ns, key) {
    return pushIn(ns, SCHWARM_PORTS.QUEEN_IN, "DROP:" + key);
}

// =============================================================================
// 5c-bis. ERNTEPFAD FUER XP-DAUERLAEUFER (Port 2)                       [v12.0]
// =============================================================================
//
// AUSGANGSLAGE. Bis v11.x war JEDER Worker ein One-Shot: ein Aufruf, dann Ende.
// Darauf baute v10 die Entscheidung "SPERRLISTE statt KILLS" — reservierter
// Platz musste nicht freigeraeumt werden, er lief innerhalb einer Worker-
// Laufzeit von selbst leer (siehe SCHWARM-DISPATCHER.js, Reservierungsblock).
//
// Mit dem XP-Dauerlaeufer (schwarm-wl.js) gilt diese Voraussetzung fuer EINE
// Klasse nicht mehr. Sein RAM wird nie von selbst frei. Ohne Gegenmassnahme
// verhungert jeder Daemon, dessen Queen-Reservierung auf einen Host mit
// Dauerlaeufern faellt: die Queen wartet RESERVE_HOLD_MS, laesst die
// Reservierung verfallen, plant neu — und trifft denselben Zustand.
//
// ZUSTAENDIGKEIT. Getoetet wird ausschliesslich von der QUEEN. Der Dispatcher
// MELDET nur, was geerntet werden darf. Das ist kein Umweg, sondern die
// Aufloesung eines Besitzkonflikts: es gibt ZWEI Bewerber um dasselbe RAM —
// der Dispatcher (fuer h/w/g) und die Queen (fuer Daemon-Reservierungen).
// Wuerde der Dispatcher selbst toeten, erntete er nur fuer sich; die Queen
// saehe den Platz nie. Ein Toeter, zwei Melder.
//
// FORMAT. "REAP:<host>|<threads>" auf QUEEN_IN. Unbekannte Verben landen in
// drainQueenInbox() ohnehin in `cmds`, der Kanal traegt das ohne Umbau.
// `threads` ist eine UNTERGRENZE: die Queen toetet ganze Prozesse, bis
// mindestens so viele Threads verschwunden sind. Ein leicht zu grosser Schnitt
// ist harmlos — der Dispatcher fuellt im naechsten Takt nach.

/** Dateiname des XP-Dauerlaeufers. EINE Quelle fuer Dispatcher (startet,
 *  zaehlt, meldet) und Queen (erntet). */
export const XP_LONG_WORKER = "schwarm-wl.js";

/** DISPATCHER -> QUEEN: auf `host` duerfen mindestens `threads` Threads
 *  XP-Dauerlaeufer geerntet werden.
 *  @param {NS} ns @param {string} host @param {number} threads
 *  @returns {boolean} true, wenn die Meldung in den Port passte. */
export function reportReap(ns, host, threads, target) {
    const t = Math.max(1, Math.floor(threads));
    // v12.2: Das ZIEL gehoert in die Meldung. Begruendung an reapXpLong.
    // "*" heisst "egal welches" (Ueberschuss, XP abgeschaltet).
    const z = (typeof target === "string" && target) ? target : "*";
    return pushIn(ns, SCHWARM_PORTS.QUEEN_IN, "REAP:" + host + "|" + t + "|" + z);
}

/**
 * QUEEN: XP-Dauerlaeufer auf einem Host toeten, bis mindestens `threads`
 * Threads frei sind. Toetet NUR XP_LONG_WORKER — nie einen One-Shot, nie einen
 * Daemon, nie CORE-Arbeit.
 *
 * Grosse Prozesse zuerst: so werden moeglichst wenige Kills gebraucht, und der
 * Ueberschuss bleibt klein. Ein einzelner Prozess mit mehr Threads als
 * gefordert wird trotzdem getoetet — sonst bliebe der Bedarf ewig offen, wenn
 * ein Host nur einen einzigen grossen Dauerlaeufer traegt.
 *
 * @param {NS} ns
 * @param {string} host
 * @param {number} threads  Untergrenze der zu erntenden Threads
 * @returns {{killed:number, threads:number}} tatsaechlich getoetete Prozesse/Threads
 */
export function reapXpLong(ns, host, threads, target) {
    let ziel = Math.max(1, Math.floor(threads));
    const nurZiel = (typeof target === "string" && target && target !== "*") ? target : null;
    let killed = 0, got = 0;
    try {
        const procs = ns.ps(host)
            .filter(p => p.filename === XP_LONG_WORKER)
            // =================================================================
            // v12.2 BUGFIX — DIE ERNTE TRAF DIE FALSCHEN PROZESSE
            // =================================================================
            // Diese Zeile fehlte. Der Dispatcher meldete "auf home duerfen 1883
            // Threads weg", die Queen sortierte ALLE Dauerlaeufer des Hosts nach
            // Groesse und toetete von oben, bis 1883 erreicht waren — ohne zu
            // wissen, WELCHE gemeint waren.
            //
            // Im Regelfall sind die groessten Prozesse aber die des AKTUELLEN
            // Ziels (die frisch und in einem Zug platziert werden), waehrend die
            // veralteten aus einer frueheren Runde klein und zahlreich sind. Die
            // Queen erntete also die frische Flotte und liess die veraltete
            // stehen; der Dispatcher fuellte im naechsten Takt nach und meldete
            // dieselbe Zahl erneut. Ein perfekter Kreislauf, der nichts bewirkt.
            //
            // LIVEBELEG (vier Lagebilder, 45 Minuten):
            //     Zyklus 1  "1883 auf einem ALTEN Ziel ... Ernte gemeldet: 1883"
            //     Zyklus 2  "1883 XP-Threads arbeiten noch am alten Ziel"
            //     Zyklus 3  "SPAWN Port 2 zeigt: REAP:home|1883"
            //     Zyklus 4  "SPAWN Port 2 zeigt: REAP:home|1883"
            // Exakt dieselbe Zahl, Zyklus fuer Zyklus. Eine Ernte, die wirkt,
            // veraendert die Zahl; eine, die danebengreift, nicht.
            //
            // JETZT sagt die Meldung, WAS gemeint ist. Nur Prozesse auf genau
            // diesem Ziel werden getoetet; "*" heisst weiterhin "egal welches"
            // (Ueberschuss-Ernte, XP abgeschaltet, Reservierung der Queen).
            .filter(p => !nurZiel || String(p.args && p.args[0]) === nurZiel)
            .sort((a, b) => b.threads - a.threads);
        for (const p of procs) {
            if (got >= ziel) break;
            if (ns.kill(p.pid)) { killed++; got += p.threads; }
        }
    } catch (e) { /* Host weg oder kein Zugriff — naechster Takt */ }
    return { killed, threads: got };
}

/** QUEEN: ALLE XP-Dauerlaeufer eines Hosts ernten (Reservierung, Ziel-Wechsel,
 *  XP-Stufe abgeschaltet). @param {NS} ns @param {string} host */
export function reapXpLongAll(ns, host) {
    return reapXpLong(ns, host, Number.MAX_SAFE_INTEGER);
}

/**
 * QUEEN: den EIGENEN EINGANG (Port 2) in EINEM Durchgang leeren und sortieren.
 *
 * WARUM EIN DURCHGANG. Frueher lagen Dashboard-Kommandos auf Port 1 und
 * Spawn-Meldungen auf Port 22, und die Queen hatte zwei Leser (recvCmd in einer
 * Schleife, drainSpawnWants danach). Mit dem Postfach-Modell teilen sich beide
 * denselben Eingang — zwei getrennte Leser wuerden sich gegenseitig Nachrichten
 * wegnehmen, je nachdem wer zuerst drankommt. Es gibt deshalb GENAU EINEN
 * Leser, der klassifiziert. Das ist keine Notloesung, sondern die Regel: ein
 * Eingang, ein Leser.
 *
 * Nachrichtenformat ist einheitlich "VERB:ARG":
 *     WANT:TRADER / DROP:TRADER            von den Ownern (BANK, WORK)
 *     STOP:GO / START:GO / FORCE:GO        vom Dashboard
 *     PRE_RESET / RESUME                   vom Dashboard (ohne ARG)
 *
 * @param {NS} ns
 * @param {Object<string, number>} store  WANT-Bestand der Queen (KEY -> ts, wird mutiert).
 * @returns {{wants:string[], drops:string[], cmds:Array<{verb:string, arg:string}>}}
 */
export function drainQueenInbox(ns, store) {
    const wants = [], drops = [], cmds = [];
    const now = Date.now();
    for (const raw of drainIn(ns, SCHWARM_PORTS.QUEEN_IN)) {
        const idx = raw.indexOf(":");
        const verb = idx < 0 ? raw : raw.slice(0, idx);
        const arg  = idx < 0 ? ""  : raw.slice(idx + 1);
        if (verb === "WANT") {
            if (arg in DAEMONS) { store[arg] = now; wants.push(arg); }
        } else if (verb === "DROP") {
            if (arg in DAEMONS) { delete store[arg]; drops.push(arg); }
        } else {
            cmds.push({ verb, arg });
        }
    }
    return { wants, drops, cmds };
}

/**
 * QUEEN: abgelaufene WANTs aus dem Bestand entfernen (toter Owner -> kein
 * Geisterstart). Gibt die verfallenen Keys zurück.
 * @param {NS} ns
 * @param {Object<string, number>} store
 * @returns {string[]}
 */
export function expireSpawnWants(ns, store) {
    const gone = [];
    try {
        const now = Date.now();
        for (const key of Object.keys(store)) {
            if (now - (store[key] || 0) > SPAWN_WANT_TTL_MS) { delete store[key]; gone.push(key); }
        }
    } catch (e) { /* egal */ }
    return gone;
}

// =============================================================================
// 5d. SHARE-FLAG (Port 23 — WORK -> DISPATCHER)                          [v3.0]
// =============================================================================
//
// WORK meldet "ich grinde gerade Faktions-Ruf". Der Dispatcher darf dann seinen
// RESTPOOL (das, was nach dem h/w/g-Kernbedarf übrig bleibt) in share()-Worker
// stecken — das hebt den Rep-Gewinn, ohne dem Hacking Threads wegzunehmen.
//
// Der Wert ist ein Zeitstempel. Crasht WORK, läuft das Flag nach SHARE_MAX_AGE_MS
// von selbst aus — es braucht keinen Aufräumer.

/** WORK -> DISPATCHER: Grind-Flag setzen (on=true) oder löschen (on=false). */
export function publishShareWanted(ns, on) {
    try {
        const h = ns.getPortHandle(SCHWARM_PORTS.SHARE);
        h.clear();
        if (on) h.tryWrite(String(Date.now()));
        return true;
    } catch (e) { return false; }
}

/** DISPATCHER: Grind-Flag lesen. true = share() ist erwünscht und noch frisch. */
export function readShareWanted(ns) {
    try {
        const v = ns.peek(SCHWARM_PORTS.SHARE);
        if (v === EMPTY_PORT) return false;
        const t = Number(v);
        return Number.isFinite(t) && (Date.now() - t) <= SHARE_MAX_AGE_MS;
    } catch (e) { return false; }
}

// --- Trader-Liquidation (Port 26/27) [v-next] --------------------------------
// Zweck: BANK darf für die ZWEI großen Sprünge (Corp-Gründung, Congruity-Graft)
// das im Trader gebundene Kapital anfordern. Der Trader meldet, was liquide zu
// machen wäre (26); BANK fordert bei Bedarf eine Summe an (27), der Trader
// verkauft dann gezielt die schwächsten Positionen. Für den Alltag (kleine
// Upgrades) NICHT genutzt — da läuft der Trader ungestört.

/** BANK: liquidierbaren Portfolio-Wert lesen (0, wenn kein Trader/kein Wert).
 *  Geschrieben wird das Feld vom TRADER selbst — er ist ein Payload und schreibt
 *  seinen ganzen Ausgang (portfolio/manip/promote) in EINEM Zug, weil er alle
 *  drei Werte im selben Takt berechnet. Deshalb gibt es hier keinen
 *  publishPortfolioValue-Gegenpart mehr; der hatte ohnehin nie einen Aufrufer. */
export function readPortfolioValue(ns) {
    const n = Number(readOut(ns, SCHWARM_PORTS.TRADER_OUT).portfolio);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * BANK: ANZAHL der offenen Positionen des TRADERs.
 *
 * Warum getrennt vom Wert: readPortfolioValue() liefert 0, sobald das Depot
 * NEGATIV ist — und das ist es, sobald eine Short-Position tief unter Wasser
 * steht (StockMarketHelpers.ts:55-59: Short-Erloes = origCost + profit, wird
 * negativ, sobald askPrice ueber dem doppelten Einstand liegt).
 *
 * BANK schloss aus "Wert 0" auf "Depot leer" und hat in der Reset-Phase
 * DROP:TRADER geschickt. Damit starb die einzige Instanz, die die Position
 * haette schliessen koennen — und die Position blieb offen in den Aug-Install
 * hinein. Diese Zahl ist die Angabe, die "ist noch etwas offen?" beantwortet.
 *
 * @param {NS} ns
 * @returns {number} 0, wenn nichts offen ist oder der TRADER nichts meldet.
 */
export function readPortfolioHeld(ns) {
    const n = Number(readOut(ns, SCHWARM_PORTS.TRADER_OUT).held);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** DISPATCHER: Beeinflussungsziele des TRADERs lesen — [{org, dir:"up"|"down", val}].
 *  FRUEHER lag das auf Port 34, den sich DARKNET fuer seine Arbeitsauftraege
 *  genommen hatte; beide leerten den Port vor dem Schreiben und haben sich
 *  gegenseitig ueberschrieben. Jetzt ein Feld im Ausgang des TRADERs, also
 *  strukturell unteilbar von seinem Besitzer. */
export function readManipTargets(ns) {
    const v = readOut(ns, SCHWARM_PORTS.TRADER_OUT).manip;
    return Array.isArray(v) ? v : [];
}

/** DARKNET-Roamer: angefordertes Symbol fuer den Volatilitaets-Promote. */
export function readPromoteRequest(ns) {
    const v = readOut(ns, SCHWARM_PORTS.TRADER_OUT).promote;
    return (typeof v === "string" && v.length > 0) ? v : "";
}

/** BANK: Liquidations-Auftrag setzen ($-Summe). 0 löscht den Auftrag.
 *  Feld im Ausgang der BANK, NICHT im Eingang des TRADERs: "liquidiere bis auf
 *  X" ist ein ZUSTAND, der so lange gilt, bis BANK ihn aendert — kein einmaliges
 *  Kommando. Ein verpasster Takt ist damit folgenlos, und der TRADER kann nach
 *  einem Neustart einfach nachsehen, statt eine verlorene Nachricht zu vermissen. */
export function requestLiquidation(ns, amount) {
    const a = Math.max(0, Number(amount) || 0);
    return writeOutField(ns, SCHWARM_PORTS.BANK_OUT, "liquidate", a > 0 ? a : undefined);
}

/** TRADER: offenen Liquidations-Auftrag lesen ($, 0 = keiner). */
export function readLiquidationRequest(ns) {
    const n = Number(readOut(ns, SCHWARM_PORTS.BANK_OUT).liquidate);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

// =============================================================================
// 5e2. INFO-SNAPSHOT & RPC (Ports 28/29/30)                              [v3.1]
// =============================================================================
//
// SCHWARM-INFO.js publiziert auf Port 28 EINEN Multiplex-JSON-Snapshot:
//   { v, gen, ts, host, blocks: { <name>: {ts, ok, data, err?} } }
// Blöcke: bn, player, caps, sleeves, blade, gang, hacknet, corp (direkt) und
// work, rep, augs, market, crime (Singularity-Sweeps; ohne SF4 ok:false).
// Konsumenten lesen mit 0 GB (peek). WICHTIG: readInfoBlock() prüft das
// BLOCKALTER — wer aktuelle Daten braucht, gibt ein knappes maxAgeMs an und
// fällt bei null auf seinen bisherigen Weg (z.B. evalNs) zurück. So bleibt
// der Schwarm auch ohne laufendes INFO voll funktionsfähig.
//
// RPC (ab WORK v2 / BANK v-next verdrahtet — bis dahin nur Gerüst):
//   Port 29 (Consumer -> INFO, FIFO): {c, id, cmd, a, t}
//     c=Consumer-Name ("WORK"/"BANK"/...), id=eindeutig je Auftrag,
//     cmd=Whitelist-Schlüssel in SCHWARM-INFO.js (RPC_CMDS), a=Argumente.
//   Port 30 (INFO -> Consumer, peek): { <c>: { <id>: {ok, res|err, ts} } }
//     Ergebnisse leben RPC_RESULT_TTL_MS (180 s), dann räumt INFO sie ab.
//   Muster beim Consumer: requestInfoAction() -> pollend readInfoActionResult()
//   bis Eintrag da oder eigener Timeout; gleiche (c,id) erneut senden ersetzt
//   den alten Auftrag (Dedupe in INFO).

// =============================================================================
// 5e3. REIFEGRAD — IST DIE VORAUSSETZUNG EINES DAEMONS UEBERHAUPT ERFUELLT?
// =============================================================================
// v5.9 — DER SCHALTER UEBERLEBTE DEN BITNODE-WECHSEL, DIE VORAUSSETZUNG NICHT.
//
// schwarm-queen-state.txt liegt auf home, und home ueberlebt jeden Prestige.
// Ein von Hand gesetztes "GANGS: aus" aus BN12 regierte damit still weiter in
// BN15 — waehrend drueben `this.karma = 0` lief und die Voraussetzung ohnehin
// von vorn zu erarbeiten war. Umgekehrt genauso: ein "an" aus einem Lauf, in
// dem die Bedingung erfuellt WAR, steht nach dem Wechsel auf einer Null.
//
// `cap` beantwortet das nicht. Es sagt nur, ob die MECHANIK in dieser BitNode
// existiert (SF/BN), nicht, ob der Spieler sie JETZT benutzen kann. Zwischen
// "Gangs gibt es hier" und "ich darf eine gruenden" liegen 54.000 Karma.
//
// RUECKGABE, DREI ZUSTAENDE — das mittlere ist der wichtige:
//   true   Bedingung erfuellt ODER es gibt fuer diesen Daemon keine.
//   false  Bedingung NACHWEISLICH nicht erfuellt -> darf ausgeschaltet werden.
//   null   es gibt eine Bedingung, aber die Daten fehlen -> NICHT ANFASSEN.
// Raten waere hier eine Handlung, kein Zustand.
//
// DIE SPIELERWERTE KOMMEN VON AUSSEN, UND ZWAR AUS EINEM GUTEN GRUND.
// Naheliegend waere ns.getPlayer() hier in HELPERS. Das kostet aber 0.5 GB
// STATISCH — und HELPERS importiert praktisch jeder Daemon. Aus einer bequemen
// Zeile werden so 0.5 GB mal fuenfzehn, ausgerechnet dort, wo der DISPATCHER
// ohnehin am Limit liegt. Deshalb nimmt daemonBereit() die Werte als Argument:
//   QUEEN    liest sie aus dem INFO-Block (Port, 0 GB) -> bereitSpielerInfo()
//   ARSENAL  laeuft VOR INFO und holt sie ueber evalNs (Wegwerf-Skript, das
//            die Kosten traegt, nicht der Aufrufer)
// Fehlt die Angabe, liefert daemonBereit() fuer die betroffenen Daemons null
// ("unbekannt") — und null heisst hier ausdruecklich: nichts tun.
//
// ENGINE-BELEGE:
//   GANGS        Gang/data/Constants.ts:27  GangKarmaRequirement: -54000
//                PlayerObjectGangMethods.ts:22  karma > Requirement -> Absage.
//                In BN2 entfaellt die Huerde (dort ist die Gang frei).
//   BLADEBURNER  Beitritt verlangt 100 in ALLEN VIER Kampfwerten.
//                NICHT hier geprueft, aber dazugehoerig: ohne "The Blade's
//                Simulacrum" bricht Bladeburner.ts:1356 jede Aktion ab, sobald
//                Player.currentWork gesetzt ist — und WORK arbeitet immer.
//                Diese Sperre steht bewusst in schwarm-plan.txt
//                (BLADEBURNER-START), weil sie eine STRATEGIE ist und keine
//                Tatsache: mit Sleeves waere sie umgehbar.
//   CORP         Corporation.ts:54/:195 — der Softcap ist ein EXPONENT auf die
//                Auszahlung. Unter 0.75 bleibt von einer Milliarde keine
//                Groessenordnung uebrig. Gleiche Schwelle wie BANK v5.3
//                (CORP_SOFTCAP_LOHNT) — bewusst doppelt genannt, aber mit
//                derselben Zahl und derselben Begruendung an beiden Stellen.
export const BEREIT_GANG_KARMA = -54_000;  // Gang/data/Constants.ts:27
export const BEREIT_BLADE_STAT = 100;      // Beitritt: alle vier Kampfwerte
export const BEREIT_CORP_SOFTCAP = 0.75;   // = BANK CORP_SOFTCAP_LOHNT
export const BEREIT_BLADE_AUG = "The Blade's Simulacrum";

// v5.10 — EINMAL FREIGESCHALTET IST NICHT DASSELBE WIE "BEDINGUNG ERFUELLT".
// Die Karma-Huerde und die Kampfwert-Huerde sind EINTRITTSKARTEN, keine
// Dauerbedingungen. Wer eine Gang gegruendet hat, hat sie — das Karma danach
// ist gleichgueltig, und gegruendet wird nicht zweimal. Wer die
// Bladeburner-Division betreten hat, ist drin, auch wenn die Kampfwerte nach
// einem Aug-Install kurz darunter liegen.
//
// Deshalb wird ZUERST der Mitgliedsstand gefragt und erst danach die Huerde.
// Andersherum haette ein Aug-Install eine laufende Gang "unreif" gemacht.
/** Installierte Augmentierungen aus dem INFO-Block. null = nicht bekannt. */
function bereitAugsInstalliert(ns) {
    try {
        const a = readInfoBlock(ns, "augs", Infinity);
        if (a && Array.isArray(a.installed)) return a.installed;
    } catch (e) { /* nichts */ }
    return null;
}

/** Spielerwerte aus dem INFO-Block (0 GB). null = kein frischer Block da. */
export function bereitSpielerInfo(ns) {
    try {
        const p = readInfoBlock(ns, "player", 120_000);
        if (p && p.skills) return { skills: p.skills, karma: p.karma };
    } catch (e) { /* nichts */ }
    return null;
}

/**
 * Ist die fachliche Voraussetzung dieses Daemons erfuellt?
 * @param {NS} ns
 * @param {string} key  Registry-Schluessel (DAEMONS).
 * @param {{skills:object, karma:number}|null} [sp]  Spielerwerte; fehlen sie,
 *        wird der INFO-Block versucht. Siehe Begruendung oben.
 * @returns {boolean|null} true = ja/keine, false = nachweislich nein, null = unbekannt.
 */
export function daemonBereit(ns, key, sp) {
    if (sp === undefined) sp = bereitSpielerInfo(ns);
    if (key === "GANGS") {
        // Schon gegruendet? Dann ist die Huerde Geschichte.
        try {
            const g = readInfoBlock(ns, "gang", Infinity);
            if (g && g.member === true) return true;
        } catch (e) { /* weiter zur Huerde */ }
        let bn = null;
        try { const b = readInfoBlock(ns, "bn", Infinity); if (b) bn = b.bitNode; } catch (e) { /* unbekannt */ }
        if (bn === 2) return true;                       // in BN2 ist die Gang frei
        if (!sp || typeof sp.karma !== "number") return null;
        return sp.karma <= BEREIT_GANG_KARMA;
    }
    if (key === "BLADEBURNER") {
        // HUERDE 1, UND SIE GILT DAUERHAFT: ohne "The Blade's Simulacrum"
        // bricht Bladeburner.ts:1356 JEDE Aktion ab, sobald Player.currentWork
        // gesetzt ist — und WORK arbeitet immer. Das ist keine Eintrittskarte,
        // sondern eine Betriebsbedingung: sie muss auch dann noch stimmen, wenn
        // die Division laengst betreten ist.
        //
        // WICHTIG: Augmentierungen ueberleben den BitNode-Wechsel NICHT.
        // prestigeSourceFile endet mit `this.augmentations = []`
        // (PlayerObjectGeneralMethods.ts:174). Ein "hab ich doch schon" aus dem
        // letzten Durchlauf zaehlt hier also nicht — gefragt wird der IST-Stand.
        const inst = bereitAugsInstalliert(ns);
        if (inst === null) return null;
        if (inst.indexOf(BEREIT_BLADE_AUG) < 0) return false;

        // HUERDE 2, EINE EINTRITTSKARTE: die Kampfwerte braucht nur der
        // BEITRITT. Wer drin ist, bleibt drin.
        try {
            const b = readInfoBlock(ns, "blade", Infinity);
            if (b && b.inDivision === true) return true;
        } catch (e) { /* weiter zur Huerde */ }
        if (!sp || !sp.skills) return null;
        const s = sp.skills;
        for (const w of ["strength", "defense", "dexterity", "agility"]) {
            if (typeof s[w] !== "number") return null;
            if (s[w] < BEREIT_BLADE_STAT) return false;
        }
        return true;
    }
    if (key === "CORP") {
        let m = null;
        try { const b = readInfoBlock(ns, "bn", Infinity); if (b) m = b.mults; } catch (e) { m = null; }
        if (!m || typeof m.CorporationSoftcap !== "number") return null;
        return m.CorporationSoftcap >= BEREIT_CORP_SOFTCAP;
    }
    return true;                                          // keine Zusatzbedingung
}

/** Kompletten INFO-Snapshot lesen (Objekt) oder null, wenn keiner vorliegt. */
export function readInfoSnapshot(ns) {
    const o = readOut(ns, SCHWARM_PORTS.INFO_OUT);
    return (o && o.blocks) ? o : null;
}

/**
 * Einen Block aus dem INFO-Snapshot lesen.
 * @param {NS} ns
 * @param {string} block   Blockname (z.B. "bn", "rep", "augs").
 * @param {number} [maxAgeMs=60000]  Höchstalter; Infinity = Alter egal.
 * @returns {*} data des Blocks oder null (fehlt / ok:false / zu alt).
 */
export function readInfoBlock(ns, block, maxAgeMs = 60_000) {
    try {
        const s = readInfoSnapshot(ns);
        if (!s) return null;
        const b = s.blocks[block];
        if (!b || b.ok === false) return null;
        if (Number.isFinite(maxAgeMs) && Date.now() - (b.ts || 0) > maxAgeMs) return null;
        return (b.data !== undefined) ? b.data : null;
    } catch (e) { return null; }
}

/** Consumer -> INFO: Aktions-Auftrag einreihen. true = im Port angenommen. */
export function requestInfoAction(ns, consumer, id, cmd, args = []) {
    return pushIn(ns, SCHWARM_PORTS.INFO_IN, JSON.stringify({
        c: String(consumer), id: String(id), cmd: String(cmd),
        a: Array.isArray(args) ? args : [args], t: Date.now(),
    }));
}

/** Consumer: Ergebnis eines Auftrags lesen -> {ok, res|err, ts} oder null.
 *  Eigener Port (21), NICHT Feld in INFO_OUT — siehe Begruendung an der
 *  Port-Tabelle: WORK pollt das im Sekundentakt, und INFO_OUT.blocks ist mit
 *  13 Bloecken das groesste JSON im Schwarm. */
export function readInfoActionResult(ns, consumer, id) {
    const o = readOut(ns, SCHWARM_PORTS.INFO_RPC_RES);
    return (o && o[consumer] && o[consumer][id]) ? o[consumer][id] : null;
}

// =============================================================================
// 5e. TOPOLOGIE-CACHE (Port 24 + schwarm-topo.txt)                       [v3.0]
// =============================================================================
//
// ENGINE-FAKTEN (verifiziert an Server.ts):
//   - requiredHackingSkill und numOpenPortsRequired werden NUR im Konstruktor
//     gesetzt (Server.ts:73/87) -> je BitNode statisch, ändern sich NIE.
//   - maxRam ist statisch AUSSER auf home, pserv-* und hacknet-*.
//
// Folge: Ein netzweiter BFS mit getServer() je Host ist Verschwendung, wenn er
// im Takt läuft. Wir bauen ihn EINMAL, legen ihn in schwarm-topo.txt ab und
// erneuern nur bei Ereignis:
//     markTopoDirty(ns, "pserv")    nach pserv-Kauf            (BANK)
//     markTopoDirty(ns, "cracker")  nach Cracker-Kauf/-Fund    (ARSENAL/DARKNET)
//     markTopoDirty(ns, "darknet")  bei neuen Darknet-Servern  (DARKNET)
// … plus einem Sicherheitsnetz alle TOPO_MAX_AGE_MS und nach jedem Prestige
// (erkannt über ns.getResetInfo().lastAugReset).

export const TOPO_FILE = "schwarm-topo.txt";
export const TOPO_MAX_AGE_MS = 300_000;   // Sicherheitsnetz: spätestens alle 5 min

/** Hosts, deren maxRam sich zur Laufzeit ändern kann (alles andere ist statisch). */
export function isDynamicRamHost(host) {
    return host === "home" || host.startsWith(PSERV_PREFIX) || host.startsWith("hacknet-");
}

// ---------------------------------------------------------------------------
// DAS ANSCHLAGBRETT (Port 22) — Befund 4 der Pruefung, hier behoben
// ---------------------------------------------------------------------------
//
// FRUEHER: markTopoDirty schrieb "DIRTY:<grund>" in eine FIFO, und getTopology
// LAS die Meldung heraus. Damit war es eine Warteschlange, kein Rundruf: wer
// zuerst las, nahm die Meldung mit, fuer alle anderen war sie weg. Die Queen
// ruft buildRamMapFast -> getTopology alle 2 Sekunden, der Dispatcher alle 16 —
// die Queen gewann praktisch jedes Mal. Der Dispatcher, also ausgerechnet der
// Prozess, der das RAM benutzt, erfuhr von einem neu gekauften Server erst ueber
// das 5-Minuten-Sicherheitsnetz. So lange stand er leer.
//
// JETZT: ein ZAEHLER, den jeder Schreiber hochzaehlt und jeder Leser nur
// ANSIEHT (peek). Jeder Prozess merkt sich in TOPO_SEEN den Stand, bei dem er
// zuletzt neu gebaut hat. Ist der Zaehler groesser, ist er dran — und zwar
// JEDER Prozess einzeln, weil niemand dem anderen etwas wegnimmt.
//
// Der Zaehler laeuft nur hoch und wird nie zurueckgesetzt; ein Ueberlauf ist
// bei einem 2-s-Takt und Number.MAX_SAFE_INTEGER kein realistischer Fall. Faellt
// er doch einmal (Portleerung durch SCHWARM-CLEAN), erkennt der Vergleich
// "gesehen > aktuell" den Sprung nach unten und baut einmal neu auf.

/** Prozess-lokal: bei welchem Zaehlerstand haben WIR zuletzt neu gebaut? */
let TOPO_SEEN = -1;

/** Beliebiger Daemon -> alle: "die Topologie hat sich geändert".
 *  Zaehlt das Anschlagbrett um eins hoch. Der Grund dient nur dem Log — er wird
 *  bewusst nicht mitgefuehrt, weil kein Leser ihn je ausgewertet hat und ein
 *  Zaehler ohne Nutzlast nicht kaputtgehen kann.
 *  @param {NS} ns
 *  @param {string} reason  "pserv" | "cracker" | "darknet" | frei (nur fuers Log) */
export function markTopoDirty(ns, reason = "event") {
    try {
        const h = ns.getPortHandle(SCHWARM_PORTS.TOPO);
        const cur = Number(ns.peek(SCHWARM_PORTS.TOPO));
        const next = (Number.isFinite(cur) ? cur : 0) + 1;
        h.clear();
        // Der eigene Zaehlerstand wird MITGEZOGEN: wer selbst meldet, weiss ja
        // bereits Bescheid und muss nicht wegen seiner eigenen Meldung neu bauen.
        // Ohne das baute z.B. die BANK nach jedem pserv-Kauf zweimal.
        if (TOPO_SEEN >= 0) TOPO_SEEN = next;
        return h.tryWrite(String(next));
    } catch (e) { return false; }
}

/** Intern: liegt seit unserem letzten Bau eine neue Meldung an? NUR peek —
 *  es wird nichts verbraucht, damit ALLE Prozesse dieselbe Meldung sehen. */
function topoBoardChanged(ns) {
    try {
        const cur = Number(ns.peek(SCHWARM_PORTS.TOPO));
        const n = Number.isFinite(cur) ? cur : 0;
        if (TOPO_SEEN < 0) { TOPO_SEEN = n; return false; }  // Erststart: nur merken
        if (n === TOPO_SEEN) return false;
        TOPO_SEEN = n;                                        // auch bei Sprung nach unten
        return true;
    } catch (e) { return false; }
}

/** Intern: Topologie frisch per BFS aufbauen (der EINE teure Scan). */
function scanTopology(ns) {
    const t = { built: Date.now(), reset: 0, hosts: {} };
    try { const ri = ns.getResetInfo(); if (ri && ri.lastAugReset) t.reset = ri.lastAugReset; } catch (e) { /* 0 */ }
    for (const host of ["home", ...scanNetwork(ns)]) {
        try {
            t.hosts[host] = {
                maxRam: ns.getServerMaxRam(host),
                skill: ns.getServerRequiredHackingLevel(host),
                ports: ns.getServerNumPortsRequired(host),
                maxMoney: ns.getServerMaxMoney(host),
                minSec: ns.getServerMinSecurityLevel(host),
            };
        } catch (e) { /* Host überspringen */ }
    }
    return t;
}

let TOPO_CACHE = null;   // Prozess-lokaler Cache (spart auch das ns.read)

/**
 * Topologie holen. Baut neu, wenn: kein Cache / Datei fehlt / Dirty-Signal /
 * Prestige erkannt / älter als TOPO_MAX_AGE_MS. Sonst 0 Netz-Calls.
 * @param {NS} ns
 * @param {boolean} [force=false]  Neubau erzwingen.
 * @returns {{built:number, reset:number, hosts:Object<string,{maxRam:number,skill:number,ports:number,maxMoney:number,minSec:number}>}}
 */
export function getTopology(ns, force = false) {
    try {
        const dirty = topoBoardChanged(ns);
        if (!TOPO_CACHE) {
            try { const raw = ns.read(TOPO_FILE); if (raw) TOPO_CACHE = JSON.parse(raw); } catch (e) { TOPO_CACHE = null; }
        }
        let stale = force || dirty || !TOPO_CACHE || !TOPO_CACHE.hosts;
        if (!stale) {
            if (Date.now() - (TOPO_CACHE.built || 0) > TOPO_MAX_AGE_MS) stale = true;
            else {
                // Prestige? -> alles neu (Root-Rechte + Netz sind zurückgesetzt)
                try {
                    const ri = ns.getResetInfo();
                    if (ri && ri.lastAugReset && ri.lastAugReset !== TOPO_CACHE.reset) stale = true;
                } catch (e) { /* egal */ }
            }
        }
        if (stale) {
            TOPO_CACHE = scanTopology(ns);
            try { ns.write(TOPO_FILE, JSON.stringify(TOPO_CACHE), "w"); } catch (e) { /* egal */ }
        }
        return TOPO_CACHE;
    } catch (e) {
        return TOPO_CACHE || { built: 0, reset: 0, hosts: {} };
    }
}


/**
 * RAM-Karte OHNE netzweiten BFS: statisches maxRam aus dem Topologie-Cache,
 * dynamisches maxRam nur für home/pserv/hacknet live. getServerUsedRam ist ein
 * billiger Lookup und liefert die Wahrheit (inkl. fremder Skripte) — bleibt live.
 *
 * @param {NS} ns
 * @param {boolean} [includeHome=true]
 * @param {number}  [minMax=0]  Hosts mit maxRam < minMax werden übersprungen
 *                              (spart getServerUsedRam auf 0-GB-Hosts).
 * @returns {Object<string, {max:number, used:number, free:number}>}
 */
export function buildRamMapFast(ns, includeHome = true, minMax = 0) {
    const map = {};
    try {
        const topo = getTopology(ns);
        for (const [host, info] of Object.entries(topo.hosts || {})) {
            if (host === "home" && !includeHome) continue;
            if (host.startsWith("hacknet-")) continue;      // nie Schwarm-Host
            try {
                const max = isDynamicRamHost(host) ? ns.getServerMaxRam(host) : (info.maxRam || 0);
                if (max <= 0 || max < minMax) continue;
                if (host !== "home" && !ns.hasRootAccess(host)) continue;
                const used = ns.getServerUsedRam(host);
                map[host] = { max, used, free: Math.max(0, max - used) };
            } catch (e) { /* Host überspringen */ }
        }
    } catch (e) { /* Teilkarte ist besser als Crash */ }
    return map;
}

// =============================================================================
// 5f. LEBENSZYKLUS (Doppelstart-Schutz + Anzeige-Doktrin)                [v3.0]
// =============================================================================

/**
 * Doppelstart-Schutz. Ersetzt die vier identischen Inline-Blöcke in QUEEN/WORK/
 * GENESIS/ARSENAL/DASHBOARD.
 * @param {NS} ns
 * @returns {boolean} true = wir sind die EINZIGE Instanz (weitermachen);
 *                    false = es läuft schon eine (Aufrufer soll return machen).
 */
export function ensureSingleInstance(ns) {
    try {
        const self = ns.getScriptName();
        const host = ns.getHostname();
        return ns.ps(host).filter(p => p.filename === self).length <= 1;
    } catch (e) { return true; }   // im Zweifel laufen lassen
}

/**
 * ANZEIGE-DOKTRIN (v3.0): KEIN Auto-Tail beim Start. Nur eine kurze Terminal-Zeile.
 * Ein Tail-Fenster wird NUR bei einem Fehler geöffnet — dann will man ihn auch sehen.
 * @param {NS} ns
 * @param {"start"|"stop"|"error"} kind
 * @param {string} [msg]
 */
export function announce(ns, kind, msg = "") {
    try {
        const name = ns.getScriptName().replace(/^SCHWARM-/, "").replace(/\.js$/, "");
        if (kind === "start")      ns.tprint(`INFO  [${name}] gestartet auf ${ns.getHostname()}${msg ? " — " + msg : ""}`);
        else if (kind === "stop")  ns.tprint(`INFO  [${name}] beendet${msg ? " — " + msg : ""}`);
        // v4.5 — "info" WAR NIE VORGESEHEN, WURDE ABER VIERMAL BENUTZT.
        // Die Funktion kannte nur start/stop/error; jeder andere Wert fiel durch
        // alle Zweige und tat GAR NICHTS — ohne Fehler, ohne Hinweis. Betroffen
        // waren unter anderem zwei Meldungen des AUGS-Payloads ("Aug gekauft",
        // "Aug-Install: N Stueck"), die damit nie jemand zu sehen bekam.
        // Ein unbekannter Wert ist hier kein Fehler, sondern ein stiller Ausfall
        // — genau die Sorte, die man erst bemerkt, wenn man sie sucht.
        else if (kind === "info")  ns.tprint(`INFO  [${name}]${msg ? " " + msg : ""}`);
        else if (kind === "error") {
            ns.tprint(`ERROR [${name}] ${msg}`);
            try { ns.ui.openTail(); } catch (e) { /* headless */ }
            try { ns.print("FEHLER: " + msg); } catch (e) { /* egal */ }
        }
    } catch (e) { /* Anzeige darf nie crashen */ }
}

// =============================================================================
// 5g. BANK-FRAMEWORK (Ports 12/13/14 — Consumer <-> BANK)
// =============================================================================

// =============================================================================
//
// SCHWARM-BANK.js ist der zentrale Ökonomie-Daemon: er verwaltet BEIDE knappen
// Ressourcen (Hashes + Geld) und ist Torwächter für teure Anschaffungen.
//
//   SPAREN: 5% des BRUTTO-Zuflusses je Tick (Einnahmen ohne Ausgaben, gemessen
//           über getMoneySources) wandern in einen Spartopf. Der Rest ist frei.
//   ANTRÄGE: Consumer melden GROSSE Ziele (oberhalb einer Schwelle) mit Kosten
//           und Währung über BANK_IN (FIFO). Kleinkram kaufen sie autonom weiter.
//   FREIGABE: Sobald das freie Geld ein Ziel deckt, schreibt die BANK eine
//           Freigabe in BANK_OUT.grants. Der Consumer sieht sie, kauft, meldet fertig.
//           BANK v5.17: MEHRERE Freigaben je Takt, der Reihe nach nach prio
//           (bei Gleichstand billigster zuerst); passt einer nicht, wird er
//           uebersprungen statt alle dahinter zu blockieren. Eine erteilte
//           Freigabe bleibt stehen, solange ihr Antrag offen ist.
//
// Antrags-Format (eine Zeile):  REQ|CONSUMER|id=<key>;cur=money|hashes;cost=<zahl>;prio=<zahl>
//   id   = eindeutiger Antragsschlüssel je Consumer (z.B. "server-1pb", "aug:NeuroFlux")
//   cur  = "money" oder "hashes"
//   cost = Zielkosten in der Währung
//   prio = optionale Dringlichkeit (höher = wichtiger); Default aus BANK-Config
// Ein erneuter Antrag mit gleicher id AKTUALISIERT den bestehenden (Kosten/Prio).
// Ein Antrag mit cost<=0 ZIEHT den Antrag zurück (Consumer will das Ziel nicht mehr).
//
// Hash-Bedarf laeuft ueber denselben Eingang mit Praefix HASH| — siehe
// publishHashNeed. Ein Eingang, ein Leser: drainBankInbox sortiert.

/** v5.16 Nachtrag: Antrag UNGENUTZT zurueckziehen (Zielwechsel, nichts gekauft).
 *  Eine normale Abmeldung (cost 0) heisst fuer BANK "verbraucht" und wird
 *  gebucht; diese hier nicht. */
export function requestFundsZurueck(ns, consumer, id) {
    const body = `id=${String(id).replace(/[;|]/g, ",")};cur=money;cost=0;prio=;ungenutzt=1`;
    return pushIn(ns, SCHWARM_PORTS.BANK_IN, `REQ|${consumer}|${body}`);
}

/** Consumer -> BANK: großen Anschaffungs-Antrag melden (FIFO, BANK_IN). */
export function requestFunds(ns, consumer, id, currency, cost, prio) {
    const body = `id=${String(id).replace(/[;|]/g, ",")};cur=${currency};cost=${Math.max(0, Math.floor(cost || 0))};prio=${prio == null ? "" : prio}`;
    return pushIn(ns, SCHWARM_PORTS.BANK_IN, `REQ|${consumer}|${body}`);
}

/**
 * BANK: den EIGENEN EINGANG (Port 6) in EINEM Durchgang leeren und sortieren.
 *
 * Ersetzt drainFundRequests + drainHashNeeds. Zwei getrennte Leser auf demselben
 * Eingang wuerden sich gegenseitig Nachrichten wegnehmen — dieselbe Falle wie
 * bei der Queen. Ein Eingang, ein Leser.
 *
 * @param {NS} ns
 * @param {Object} fundStore  store[CONSUMER][id] = {cur, cost, prio, ts}. cost<=0 loescht.
 * @param {Object} hashStore  store[PRODUZENT]    = {ts, fields}
 * @returns {{reqs:number, hashes:number}} Anzahl verarbeiteter Meldungen je Sorte.
 */
export function drainBankInbox(ns, fundStore, hashStore, ungenutzt) {
    let reqs = 0, hashes = 0;
    const now = Date.now();
    for (const raw of drainIn(ns, SCHWARM_PORTS.BANK_IN)) {
        const p1 = raw.indexOf("|");
        if (p1 <= 0) continue;
        const kind = raw.slice(0, p1);
        const rest = raw.slice(p1 + 1);
        const p2 = rest.indexOf("|");
        if (p2 <= 0) continue;
        const who = rest.slice(0, p2);
        const f = {};
        for (const pair of rest.slice(p2 + 1).split(";")) {
            const eq = pair.indexOf("=");
            if (eq > 0) f[pair.slice(0, eq)] = pair.slice(eq + 1);
        }

        if (kind === "REQ") {
            if (!f.id) continue;
            if (!fundStore[who]) fundStore[who] = {};
            const cost = Number(f.cost);
            if (!isFinite(cost) || cost <= 0) {
                delete fundStore[who][f.id];
                // v5.16 Nachtrag: ungenutzt zurueckgezogen -> BANK bucht nicht.
                if (f.ungenutzt === "1" && ungenutzt instanceof Set) ungenutzt.add(who + "/" + f.id);
            }
            else fundStore[who][f.id] = {
                cur: f.cur === "hashes" ? "hashes" : "money", cost,
                prio: f.prio === "" ? null : Number(f.prio), ts: now,
            };
            reqs++;
        } else if (kind === "HASH") {
            hashStore[who] = { ts: now, fields: f };
            hashes++;
        }
    }
    return { reqs, hashes };
}

/** BANK -> Consumer: Freigaben veröffentlichen (Feld `grants` in BANK_OUT).
 *  grants = { CONSUMER: { id: freigegebeneKosten, ... }, ... } */
export function publishFundGrants(ns, grants) {
    // v5.16 Nachtrag: __ts = wann BANK diese Freigaben veroeffentlicht hat.
    // Ein Verbraucher erkennt daran eine stehengebliebene BANK und eine
    // Veroeffentlichung, aus der er schon gekauft hat.
    return writeOutField(ns, SCHWARM_PORTS.BANK_OUT, "grants",
        Object.assign({}, grants || {}, { __ts: Date.now() }));
}

/** Hoechstalter einer Freigabe. Steht BANK laenger, gilt keine mehr. */
export const FREIGABE_MAX_ALTER_MS = 120_000;

/** Wann BANK die Freigaben zuletzt veroeffentlicht hat (null = unbekannt). */
export function readFundGrantStempel(ns) {
    const all = readOut(ns, SCHWARM_PORTS.BANK_OUT).grants;
    return all && typeof all.__ts === "number" ? all.__ts : null;
}

/** Consumer: die eigene Freigabe für einen Antrag lesen (0 = nicht freigegeben).
 *  Der Consumer kauft nur, wenn hier >= seine Kosten stehen. */
export function readFundGrant(ns, consumer, id) {
    const all = readOut(ns, SCHWARM_PORTS.BANK_OUT).grants;
    // v5.16 Nachtrag: eine veraltete Veroeffentlichung gilt nicht. Ohne
    // __ts (BANK vor v5.17) wie bisher.
    if (all && typeof all.__ts === "number" && Date.now() - all.__ts > FREIGABE_MAX_ALTER_MS) return 0;
    const g = all && all[consumer] && all[consumer][id];
    return typeof g === "number" && g > 0 ? g : 0;
}

/** BANK -> alle: Kennzahlen veröffentlichen (Feld `info` in BANK_OUT). */
export function publishBankInfo(ns, info) {
    return writeOutField(ns, SCHWARM_PORTS.BANK_OUT, "info", info || {});
}

/** Beliebiger Leser: Bank-Kennzahlen lesen ({} wenn nichts da). */
export function readBankInfo(ns) {
    const o = readOut(ns, SCHWARM_PORTS.BANK_OUT).info;
    return (o && typeof o === "object") ? o : {};
}

/** BANK -> DASHBOARD: Hash-Kennzahlen (Feld `hash` in BANK_OUT).
 *  Felder: num, cap, prodPerSec, spentTotal (kumuliert), ts.
 *  BESITZERWECHSEL: das lag frueher auf Port 33 und gehoerte SCHWARM-HASHNET.
 *  Seit dessen Tod hatte der Port KEINEN Schreiber mehr — das Dashboard zeigte
 *  dauerhaft nichts. BANK ist heute der einzige spendHashes-Aufrufer und zaehlt
 *  den Verbrauch ohnehin mit; damit ist sie der richtige Besitzer.
 *  spentTotal springt bei einem BANK-Neustart auf 0 zurueck — Leser muessen
 *  negative Deltas auf 0 klemmen. */
export function publishHashInfo(ns, info) {
    return writeOutField(ns, SCHWARM_PORTS.BANK_OUT, "hash", info || {});
}

/** Beliebiger Leser: Hash-Kennzahlen ({} wenn nichts da). */
export function readHashInfo(ns) {
    const o = readOut(ns, SCHWARM_PORTS.BANK_OUT).hash;
    return (o && typeof o === "object") ? o : {};
}

// =============================================================================
// 5d2. CORP-KENNZAHLEN (Port 31 — CORP -> BANK/Dashboard)   [NEU v3.2]
// =============================================================================
//
// CORP veröffentlicht je Durchlauf einen kompakten Zustand. Zwei Verbraucher:
//   - BANK führt Aktien-Rückkäufe aus (buyback) und nutzt sellShares als dritte
//     Liquiditätsquelle für Großziele — die CORP fasst eigene Aktien NICHT mehr
//     selbst an (Trennung: CORP baut, BANK finanziert). Felder u.a.:
//       public, sharePrice, issuedShares, numShares, totalShares, investorShares,
//       sellCooldown, profitPerSec (revenue-expenses), dividendRate, valuation,
//       buyback {want,chunk}, floorOwnFrac (Eigentums-Untergrenze).
export function publishCorpInfo(ns, info) {
    try {
        const h = ns.getPortHandle(SCHWARM_PORTS.CORP_OUT);
        h.clear();
        return h.tryWrite(JSON.stringify(info || {}));
    } catch (e) { return false; }
}

/** Beliebiger Leser: Corp-Kennzahlen ({} wenn nichts da). */
export function readCorpInfo(ns) {
    return readOut(ns, SCHWARM_PORTS.CORP_OUT);
}

// =============================================================================
// 5d3. GANG-KENNZAHLEN (Port 32 — GANG -> Dashboard)   [NEU v3.3]
// =============================================================================
//
// GANG veröffentlicht je Territory-Tick einen kompakten Zustand. Reine ANZEIGE —
// niemand handelt auf diesen Port. Felder: territory (0..1), power, winChance
// (Ø gegen Gangs mit Territorium), engaged, members, ts.
//
// Geld/s steht bewusst NICHT hier: das Dashboard bezieht alle Einnahmeraten aus
// ns.getMoneySources() (1 GB, kumuliert je Quelle inkl. gang/gang_expenses) und
// bildet daraus Deltas — eine Quelle für alle Raten statt je Daemon eine eigene.
export function publishGangInfo(ns, info) {
    try {
        const h = ns.getPortHandle(SCHWARM_PORTS.GANG_OUT);
        h.clear();
        return h.tryWrite(JSON.stringify(info || {}));
    } catch (e) { return false; }
}

/** Beliebiger Leser: Gang-Kennzahlen ({} wenn nichts da). */
export function readGangInfo(ns) {
    return readOut(ns, SCHWARM_PORTS.GANG_OUT);
}

// =============================================================================
// 5e. REP-ZIEL (WORK_OUT.repZiel)   [NEU v2.8]
// =============================================================================
//
// Problem bisher: AUGS kaufte nur, was rep-technisch schon ging, und verwarf alles
// andere still. WORK wiederum wählte seine Faktion nach eigenen Kriterien. Niemand
// sagte WORK, welcher Ruf als NÄCHSTES gebraucht wird — der Rep-Grind lief also
// potenziell an den tatsächlich anstehenden Augs vorbei.
//
// Jetzt: AUGS bestimmt das bestbewertete Aug, dessen Ruf NOCH NICHT reicht, und legt
// Faktion + Rep-Lücke auf Port 17. WORK kann gezielt dorthin arbeiten.
//
// Format (JSON, peek): { fac, aug, need, have, score, ts }
//   fac   — Faktion, bei der die Lücke am kleinsten ist
//   need  — benötigter Ruf für das Aug
//   have  — aktueller Ruf bei fac
//
// ABWÄRTSKOMPATIBEL: Wer den Port nicht liest, merkt nichts. WORK bindet ihn mit
// wenigen Zeilen an (readRepTarget(ns) -> Faktion bevorzugen).

/** AUGS -> WORK: nächstes Rep-Ziel veröffentlichen (peek, JSON). null = kein Ziel. */
export function publishRepTarget(ns, target) {
    return writeOutField(ns, SCHWARM_PORTS.WORK_OUT, "repZiel", target || undefined);
}

/** WORK: nächstes Rep-Ziel lesen. null, wenn keins gesetzt ist. */
export function readRepTarget(ns) {
    const o = readOut(ns, SCHWARM_PORTS.WORK_OUT).repZiel;
    return (o && o.fac) ? o : null;
}

// BANK -> AUGS (Port 18). BANK wählt das zu kaufende Aug (billigstes rep-
// erreichbares, aus dem INFO-augs/rep-Block) und legt es hier ab. Der AUGS-
// One-Shot liest genau EIN Ziel, kauft es und beendet sich. Die Auswahl liegt
// bewusst in BANK (kennt Geld + Katalog); AUGS ist nur der ausführende Arm.

/** BANK -> AUGS: zu kaufendes Aug veröffentlichen (peek, JSON {faction,aug}). null = nichts. */
export function publishAugBuy(ns, order) {
    return writeOutField(ns, SCHWARM_PORTS.BANK_OUT, "augBuy",
        (order && order.faction && order.aug) ? order : undefined);
}

// BANK -> QUEEN (Port 19). BANK zaehlt die GEKAUFTEN-aber-nicht-installierten Augs
// (INFO-augs-Block: owned minus installed) und meldet, wenn ein Install faellig ist.
// Die Queen fuehrt ihn dann als One-Shot aus. Warum BANK und nicht die Queen selbst:
// BANK kennt Katalog, Geld und Grafting-Zustand — die Queen soll schlank bleiben.
// Der Port ist ein peek-Port: die Meldung STEHT, solange die Bedingung gilt, und
// verschwindet von selbst, wenn BANK sie zurueckzieht (z. B. weil Grafting anlief).

/** BANK -> QUEEN: Install-Bereitschaft melden. null = nicht bereit. */
export function publishResetReady(ns, info) {
    return writeOutField(ns, SCHWARM_PORTS.BANK_OUT, "resetReady",
        (info && info.count > 0) ? info : undefined);
}

/** QUEEN: Install-Bereitschaft lesen. null, wenn nichts ansteht. */
export function readResetReady(ns) {
    const o = readOut(ns, SCHWARM_PORTS.BANK_OUT).resetReady;
    return (o && o.count > 0) ? o : null;
}

/** AUGS: zu kaufendes Aug lesen. null, wenn kein gültiges Ziel gesetzt ist. */
export function readAugBuy(ns) {
    const o = readOut(ns, SCHWARM_PORTS.BANK_OUT).augBuy;
    return (o && o.faction && o.aug) ? o : null;
}

// =============================================================================
// 6. NETZWERK
// =============================================================================

/**
 * BFS über das gesamte Netzwerk. 'home' ist NICHT enthalten
 * (Früh-Hacker sollen home nie als Ziel sehen).
 * @param {NS} ns
 * @returns {string[]} Alle erreichbaren Hostnamen (inkl. pserv-*).
 */
export function scanNetwork(ns) {
    const seen = new Set(["home"]);
    const queue = ["home"];
    try {
        while (queue.length > 0) {
            const host = queue.shift();
            for (const next of ns.scan(host)) {
                if (!seen.has(next)) { seen.add(next); queue.push(next); }
            }
        }
    } catch (e) { /* Teilscan ist besser als Crash */ }
    seen.delete("home");
    // Hacknet-Server/-Nodes NIEMALS als Schwarm-Hosts behandeln — sie erzeugen
    // Hashes/Geld; jede Fremdbelegung senkt ihre Rate. Schließt sie zentral aus
    // nukeAll, buildRamMap(Array), pickHost und findDaemon aus.
    return [...seen].filter(h => !h.startsWith("hacknet-server-") && !h.startsWith("hacknet-node-"));
}

/**
 * Verfügbare Port-Öffner EINMAL ermitteln. Vorher wurde je Host 5× fileExists
 * gerufen — bei 80 Hosts = 400 Calls je Takt. Jetzt: 5 Calls je SENSE-Takt.
 *
 * =========================================================================
 * v4.0 — DIE LISTE STEHT JETZT HIER DRIN, NICHT MEHR IM MODUL-KOPF
 * =========================================================================
 * PORT_OPENERS war eine `const` auf der AEUSSERSTEN Ebene dieser Datei. Die
 * RAM-Analyse gibt aber nur FunctionDeclarations einen eigenen Schluessel
 * (RamCalculations.ts, parseOnlyCalculateDeps): Pfeilfunktionen in einem
 * Top-Level-const werden dem GLOBALEN Bereich des Moduls zugerechnet — und
 * "dieses Modul haengt am globalen Bereich jenes Moduls, egal wie importiert
 * wird". Damit zahlte JEDER Importeur von SCHWARM-HELPERS die fuenf
 * Port-Programme mit:
 *
 *     brutessh + ftpcrack + relaysmtp + httpworm + sqlinject
 *     = 5 x RamCostConstants.PortProgram (0,05) = 0,25 GB
 *
 * Bezahlt haben das 13 Daemons, auch die, die nie einen Server rooten. Bei
 * kleinen Werkzeugen wie DIAG (Planwert 6 GB) oder SCAN (8 GB) ist das ein
 * spuerbarer Anteil. Es ist auch der Grund, warum SCHWARM-INFOCHECK im Kopf
 * schrieb, ein HELPERS-Import ziehe "dessen komplette RAM-Last" mit — die
 * Beobachtung stimmte, die Ursache war diese eine Liste.
 *
 * In einer FunctionDeclaration zahlt nur noch, wer die Funktion auch
 * referenziert. Das sind QUEEN (rootet im SENSE-Takt) und GENESIS/ARSENAL
 * ueber nukeAll — genau die, die es brauchen.
 *
 * @param {NS} ns
 * @param {string} [src]  Host, auf dem die .exe liegen (Default: Lauf-Host).
 * @returns {{list:Array, count:number}}
 */
export function refreshCrackers(ns, src) {
    const PORT_OPENERS = [
        { file: "BruteSSH.exe",  fn: (ns2, h) => ns2.brutessh(h) },
        { file: "FTPCrack.exe",  fn: (ns2, h) => ns2.ftpcrack(h) },
        { file: "relaySMTP.exe", fn: (ns2, h) => ns2.relaysmtp(h) },
        { file: "HTTPWorm.exe",  fn: (ns2, h) => ns2.httpworm(h) },
        { file: "SQLInject.exe", fn: (ns2, h) => ns2.sqlinject(h) },
    ];
    const host = src || (() => { try { return ns.getHostname(); } catch (e) { return "home"; } })();
    const list = [];
    for (const opener of PORT_OPENERS) {
        try { if (ns.fileExists(opener.file, host)) list.push(opener); } catch (e) { /* skip */ }
    }
    return { list, count: list.length };
}

/**
 * INKREMENTELLES ROOTING (v3.0). Ersetzt nukeAll().
 *
 * GEÄNDERT: rootet SO FRÜH WIE MÖGLICH. ns.nuke() prüft ausschließlich die
 * offenen Ports — KEIN Hacking-Level (Engine: netscriptCanHack gilt für hack/
 * backdoor, nicht für nuke). Früh gerootete Server liefern sofort RAM, auch wenn
 * sie als Hack-Ziel noch zu hoch sind. Der alte Dispatcher-autoNuke() wartete
 * zusätzlich aufs Level und verschenkte damit Kapazität.
 *
 * Kosten: Ist alles gerootet, was gerootet werden kann -> 0 Netz-Calls.
 * Sonst nur die Hosts, deren Port-Bedarf die vorhandenen Cracker decken.
 *
 * @param {NS} ns
 * @param {{list:Array, count:number}} [crackers]  Ergebnis von refreshCrackers()
 *        (spart die fileExists-Calls; wird sonst hier ermittelt).
 * @returns {number} Anzahl neu gerooteter Server.
 */
export function nukeIncremental(ns, crackers) {
    let rooted = 0;
    const ck = crackers && Array.isArray(crackers.list) ? crackers : refreshCrackers(ns);
    if (ck.count === 0) {
        // Ohne Cracker lassen sich nur 0-Port-Server rooten — die auch.
    }
    try {
        const topo = getTopology(ns);
        for (const [host, info] of Object.entries(topo.hosts || {})) {
            if (host === "home" || host.startsWith("hacknet-")) continue;
            try {
                if (ns.hasRootAccess(host)) continue;            // billig, kein getServer
                const need = info.ports || 0;
                if (need > ck.count) continue;                   // nicht genug Cracker -> überspringen
                for (const opener of ck.list) {
                    try { opener.fn(ns, host); } catch (e) { /* schon offen */ }
                }
                ns.nuke(host);
                rooted++;
            } catch (e) { /* einzelner Host darf den Lauf nicht stoppen */ }
        }
    } catch (e) { /* Teilergebnis */ }
    return rooted;
}

/**
 * ABWÄRTSKOMPATIBEL: alte Signatur, neue Mechanik.
 * GENESIS/CLEAN dürfen weiter nukeAll(ns) rufen.
 * @param {NS} ns
 * @returns {number}
 */
export function nukeAll(ns) {
    return nukeIncremental(ns);
}

// ENTFERNT (v4.0): buildRamMap().
//
// Es gab DREI Funktionen fuer dieselbe Aufgabe "RAM-Karte bauen":
//   buildRamMap       — netzweiter BFS je Aufruf (diese hier, die aelteste)
//   buildRamMapFast   — aus dem Topologie-Cache, nur dynamische Hosts live
//   buildRamMapArray  — dieselbe Karte als sortiertes Array
// Die langsame Fassung hatte nur noch EINEN Aufrufer: relocateFromHome, das
// seinerseits von niemandem gerufen wurde. Beide sind entfallen; buildRamMapFast
// ist in jeder Lage die richtige Wahl, buildRamMapArray bleibt fuer GENESIS.

// =============================================================================
// 7. DEPLOY (Daemon-Verteilung)
// =============================================================================

/**
 * home-Reserve: kleines Fixpolster, NUR damit die Worker-Platzierung nicht an
 * Rundung kantet. Daemons werden ohnehin auf pserv ausgelagert (siehe pickHost),
 * daher hält home keinen großen Block mehr zurück — das Loch füllen Worker,
 * bis später der Corp-Manager den Platz beansprucht.
 * @param {NS} ns
 * @returns {number} Freizuhaltende GB auf 'home'.
 */
export function homeReserve(ns) {
    return 5;
}

/**
 * Besten Host für einen Daemon wählen.
 *
 * GEÄNDERT (v3.0): Nimmt optional eine FERTIGE RAM-Karte entgegen. Die Queen baut
 * pro Takt genau eine (buildRamMapFast) und reicht sie hier durch. Das behebt den
 * gravierendsten Fehler von v2.7/v5:
 *
 *   FRÜHER hatte die Queen eine EIGENE Host-Prognose (predictHost) für die
 *   Reservierung auf Port 6, während der eigentliche Deploy pickHost() nutzte.
 *   Beide Algorithmen wichen voneinander ab (predictHost kannte z.B. keine
 *   Fremdhosts). Ergebnis: Die Queen hielt pserv-3 frei, der Daemon landete auf
 *   pserv-1 -> exec lieferte PID 0 oder verdrängte Worker.
 *
 *   JETZT gibt es nur noch DIESE Funktion. Die Queen wählt den Host, reserviert
 *   GENAU DORT und deployt GENAU DORTHIN.
 *
 * Doktrin unverändert: pserv-* (größter freier RAM zuerst) -> sonstige gerootete
 * Hosts -> home (Notnagel). pinHost hat Vorrang.
 *
 * @param {NS} ns
 * @param {string} key Schlüssel aus DAEMONS.
 * @param {Object<string,{max:number,used:number,free:number}>} [map] Fertige RAM-Karte.
 * @returns {string|null} Hostname oder null, wenn nirgends Platz ist.
 */
export function pickHost(ns, key, map = null) {
    try {
        const d = DAEMONS[key];
        if (!d) return null;
        const need = (d.minRam || 2) + (d.burst || 0);
        const m = map || buildRamMapFast(ns, true);

        // pinHost wird HIER durchgesetzt (fest verdrahteter Host vor Auto-Pick).
        if (d.pinHost) {
            const r = m[d.pinHost];
            const free = r ? (d.pinHost === "home" ? r.free - homeReserve(ns) : r.free) : -1;
            return free >= need ? d.pinHost : null;
        }

        // pserv-Hosts mit genug Platz, größter Rest zuerst.
        //
        // v5.3 — meidePserv. EIN Daemon darf dort NICHT wohnen: BANK kauft,
        // ersetzt und LOESCHT die pservs (ns.cloud.deleteServer). Landete sie
        // auf einem, koennte sie sich mitten im Ausbau selbst abraeumen. Bisher
        // war das mit pinHost:"home" geloest — zu grob: home ist der teuerste
        // Platz im Schwarm, weil nur dort die Kerne auf weaken/grow wirken.
        // "Nicht auf einem pserv" ist die tatsaechliche Bedingung; jeder
        // gerootete Fremdserver erfuellt sie. home bleibt Notnagel.
        const pservs = d.meidePserv ? [] : Object.entries(m)
            .filter(([h]) => h.startsWith(PSERV_PREFIX))
            .filter(([, r]) => r.max >= need && r.free >= need)
            .sort((a, b) => b[1].free - a[1].free)
            .map(([h]) => h);

        // sonstige gerootete Netzwerk-Hosts (kein home, kein pserv)
        const others = Object.entries(m)
            .filter(([h]) => h !== "home" && !h.startsWith(PSERV_PREFIX))
            .filter(([, r]) => r.max >= need && r.free >= need)
            .sort((a, b) => b[1].free - a[1].free)
            .map(([h]) => h);

        const homeFree = m["home"] ? m["home"].free - homeReserve(ns) : -1;
        const homeOk = homeFree >= need;

        return pservs[0] ?? others[0] ?? (homeOk ? "home" : null);
    } catch (e) { return null; }
}

// ENTFERNT (v4.0): relocateFromHome().
//
// Gedacht war sie fuer eine spaetere home-Raeumung zugunsten des Corp-Managers.
// Gerufen hat sie nie jemand. Sie enthielt ausserdem einen wirkungslosen
// Ausdruck — `d.args ? [] : []` liefert in beiden Zweigen dasselbe leere Array —
// was ein guter Hinweis darauf ist, dass der Code nie gelaufen ist.
//
// Der Umzug waere heute auch der falsche Mechanismus: die Queen entscheidet ueber
// pickHost() bei JEDEM Start neu, wo ein Daemon hingehoert, und ein Daemon, den
// man auf home nicht mehr haben will, bekommt schlicht kein pinHost. Ein
// zweiter, nebenherlaufender Verschiebe-Pfad haette denselben Konflikt erzeugt,
// den v6 mit den drei parallelen Deploy-Pfaden schon einmal hatte.

/**
 * Daemon deployen: Dateien prüfen, ggf. scp auf Ziel-Host, exec mit Registry-Args.
 * RAM (Importer): ~2.2 GB (fileExists + scp + exec).
 * @param {NS} ns
 * @param {string} key Schlüssel aus DAEMONS.
 * @param {string|null} [host=null] Erzwungener Host; sonst pickHost().
 * @param {string[]} [extraArgs=[]] Zusätzliche Argumente (nach Registry-Args).
 * @returns {number} PID oder 0 bei Fehlschlag.
 */
export function deployDaemon(ns, key, host = null, extraArgs = []) {
    try {
        const d = DAEMONS[key];
        if (!d) return 0;
        // GEÄNDERT (v3.0): HOST-AGNOSTISCH. Quelle der Dateien ist der LAUF-HOST des
        // Aufrufers, nicht hart "home". Damit kann die Queen auf einem beliebigen
        // Host laufen: materialize() schreibt Payloads ohnehin lokal, und ARSENAL
        // kopiert HELPERS/PAYLOADS/QUEEN beim Fern-Install mit auf den Ziel-Host.
        // Läuft der Aufrufer auf home, ist das Verhalten identisch zu v2.7.
        const src = ns.getHostname();
        const target = host || pickHost(ns, key);
        if (!target) {
            // BUGFIX (v3.0): Default war "|| 16" -> die Meldung log einen falschen Bedarf.
            ns.print(`DEPLOY ${key}: kein Host mit ${(d.minRam || 2) + (d.burst || 0)} GB frei.`);
            return 0;
        }
        const files = [d.file, ...(d.deps || [])];
        for (const f of files) {
            if (!ns.fileExists(f, src)) {
                ns.print(`DEPLOY ${key}: Datei fehlt auf ${src}: ${f}`);
                return 0;
            }
        }
        if (target !== src && !ns.scp(files, target, src)) {
            ns.print(`DEPLOY ${key}: scp ${src} -> ${target} fehlgeschlagen.`);
            return 0;
        }
        const args = [...(d.args || []), ...(extraArgs || [])];
        const pid = ns.exec(d.file, target, 1, ...args);
        if (pid === 0) ns.print(`DEPLOY ${key}: exec auf ${target} lieferte PID 0 (RAM?).`);
        return pid;
    } catch (e) {
        ns.print(`DEPLOY ${key}: Ausnahme: ${e}`);
        return 0;
    }
}

/**
 * Laufende Instanz eines Daemons im gesamten Netz suchen.
 * @param {NS} ns
 * @param {string} key Schlüssel aus DAEMONS.
 * @returns {{host:string, pid:number}|null}
 */
export function findDaemon(ns, key) {
    try {
        const d = DAEMONS[key];
        if (!d) return null;
        for (const host of ["home", ...scanNetwork(ns)]) {
            try {
                if (host !== "home" && !ns.hasRootAccess(host)) continue;
                const proc = ns.ps(host).find(p => p.filename === d.file);
                if (proc) return { host, pid: proc.pid };
            } catch (e) { /* Host überspringen */ }
        }
        return null;
    } catch (e) { return null; }
}

// ENTFERNT (v4.0): killDaemon(). Kein Aufrufer im ganzen Projekt — die Queen
// ist alleiniger Deployer und beendet ueber ihre eigene PID-Tabelle (stop()),
// nicht ueber einen Netz-Scan. Ein zweiter Weg, Daemons zu killen, waere genau
// die Sorte Parallel-Pfad, die v6 abgeschafft hat.

// =============================================================================
// 8. RAM-DODGE
// =============================================================================

/**
 * Gebündelter Billig-Snapshot für Worker, die keine teuren APIs ziehen sollen.
 * RAM: ~0.15 GB.
 * @param {NS} ns
 * @returns {{money:number, hackLevel:number, phase:string|null, caps:Object<string,boolean>}}
 */
export function getSchwarmData(ns) {
    const data = { money: 0, hackLevel: 0, phase: null, caps: {} };
    try { data.money = ns.getServerMoneyAvailable("home"); } catch (e) { /* 0 */ }
    try { data.hackLevel = ns.getHackingLevel(); } catch (e) { /* 0 */ }
    data.phase = getPhase(ns);
    data.caps = readCapabilities(ns);
    return data;
}

// =============================================================================
// 9. FORMAT
// =============================================================================

const NUM_SUFFIX = ["", "k", "m", "b", "t", "q", "Q"];

/**
 * Zahl mit Größen-Suffix formatieren (1234567 -> "1.23m").
 * @param {number} n
 * @param {number} [dec=2] Nachkommastellen.
 * @returns {string}
 */
export function formatNumber(n, dec = 2) {
    if (n == null || Number.isNaN(n)) return "0";
    const sign = n < 0 ? "-" : "";
    let abs = Math.abs(n);
    let i = 0;
    while (abs >= 1000 && i < NUM_SUFFIX.length - 1) { abs /= 1000; i++; }
    return sign + abs.toFixed(i === 0 ? 0 : dec) + NUM_SUFFIX[i];
}

/**
 * Geldbetrag formatieren (1234567 -> "$1.23m").
 * @param {number} n
 * @param {number} [dec=2]
 * @returns {string}
 */
export function formatMoney(n, dec = 2) {
    const s = formatNumber(n, dec);
    return s.startsWith("-") ? "-$" + s.slice(1) : "$" + s;
}

/**
 * RAM formatieren (2048 -> "2.00TB").
 * @param {number} gb RAM in GB.
 * @returns {string}
 */
export function formatRam(gb) {
    if (gb == null || Number.isNaN(gb)) return "0GB";
    const units = ["GB", "TB", "PB", "EB"];
    let v = gb, i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return v.toFixed(i === 0 ? 0 : 2) + units[i];
}


// =============================================================================
// 10. KOMPATIBILITÄT (v1-Bestandsskripte: GENESIS / CASINO / ARSENAL)
// -----------------------------------------------------------------------------
// Diese Sektion existiert nur, damit unveränderte v1-Skripte gegen v2 laufen.
// Beim regulären Neudurchgang werden GENESIS/ARSENAL auf die v2-Kern-Funktionen
// (Sektion 1–9) gezogen; danach kann dieser Block entfallen.
// =============================================================================

/** Alias: alter Name für publishCapabilities (ARSENAL). */
export const broadcastCapabilities = publishCapabilities;

/** Alias: alter Name für readCapabilities (Queen-Altimport / sonstige). */
export const getCapabilities = readCapabilities;

/**
 * RAM-Dodge-Evaluator: führt ein beliebiges ns-Kommando in einem Temp-Skript aus
 * und gibt das Ergebnis zurück. Ersetzt den v1-`getSchwarmData(ns, command)`.
 * Nur für teure/seltene Calls (z.B. Singularity in ARSENAL) gedacht — NICHT für
 * Hot-Paths. Kostet den Aufrufer ~1.0 GB (ns.run).
 *
 * @param {NS} ns
 * @param {string} command ns-Ausdruck, z.B. "ns.singularity.purchaseTor()".
 * @param {any[]} [args=[]] Argumente, im Temp-Skript als ns.args[0..] verfügbar.
 * @param {number} [timeoutMs=10000] Maximale Wartezeit auf das Ergebnis.
 * @returns {Promise<any|null>} Deserialisiertes Ergebnis oder null bei Fehler/Timeout.
 */
export async function evalNs(ns, command, args = [], timeoutMs = 10000) {
    const r = await evalNsDetailed(ns, command, args, timeoutMs);
    return r.ok ? r.value : null;
}

/**
 * Wie evalNs, aber MIT GRUND (v4.0).
 *
 * ============================================================================
 * ZWEI PROBLEME DER ALTEN FASSUNG
 * ============================================================================
 *
 * 1. DIE SKRIPT-WIEDERVERWENDUNG FUNKTIONIERTE NIE.
 *    Der Dateiname enthielt Math.random(), und der Skripttext enthielt den
 *    Dateinamen. Damit war der Text bei JEDEM Aufruf anders, und die Zeile
 *
 *        if (ns.read(fscript) !== body) ns.write(fscript, body, "w");
 *
 *    war wirkungslos — es gab nie ein vorhandenes Skript, mit dem man haette
 *    vergleichen koennen. Das Spiel musste also fuer jeden einzelnen Aufruf
 *    ein neues Skript einlesen und dessen RAM berechnen. WORK feuert diese
 *    Aufrufe im Sekundentakt.
 *
 *    JETZT: Der Skriptname wird aus dem BEFEHL abgeleitet (stabiler Hash), die
 *    Ausgabedatei kommt als ns.args[0] herein. Gleicher Befehl = gleiches
 *    Skript = das Spiel kompiliert es einmal und benutzt es wieder. Die
 *    Ausgabedatei bleibt pro Aufruf eindeutig, damit sich parallele Aufrufe
 *    desselben Befehls nicht ins Gehege kommen.
 *
 * 2. VIER URSACHEN, EIN ERGEBNIS.
 *    Zeitueberschreitung, kein RAM zum Starten, Fehler in der API und "die API
 *    hat wirklich null geliefert" ergaben ALLE null. Im Livereport steht auf
 *    dem RPC-Ergebnis-Port eine lange Kette von {"ok":false,"err":"EVAL_NULL"},
 *    und daraus ist nicht ablesbar, ob SF4 fehlt, der Speicher voll war oder
 *    etwas haengt. Diese Funktion liefert deshalb den Grund mit; evalNs()
 *    darueber bleibt fuer alle bestehenden Aufrufer unveraendert.
 *
 * @returns {Promise<{ok:boolean, value:any, reason:"OK"|"NO_RAM"|"TIMEOUT"|"API_ERR"|"WRITE_ERR", err?:string}>}
 */
/**
 * Wie viele Eval-Skripte EIN Prozess gleichzeitig liegen lassen darf (v5.0).
 *
 * Die Zahl ist eine Obergrenze fuer den Muell, nicht fuer den Nutzen: der
 * Kompilier-Gewinn faellt nur bei Befehlen an, die WIEDERKEHREN, und ein
 * Prozess hat davon eine Handvoll (WORK: getPlayer, getCurrentWork, karma,
 * inGang, inBladeburner, factions — sechs Stueck im Sekundentakt). 24 laesst
 * dafuer reichlich Luft und deckelt den Rest trotzdem hart.
 *
 * SICHTBAR wird der Deckel erst bei den Befehlen mit eingebetteten Werten —
 * genau die, die den Cache nie nutzen konnten und ihn nur vollgeschrieben
 * haben. Fuer sie kostet das Loeschen nichts: sie waeren ohnehin nie wieder
 * gebraucht worden.
 */
const EVAL_CACHE_MAX = 24;

/**
 * Eval-Skripte DIESES Prozesses, aeltestes zuerst (v5.0).
 * Modul-Scope = pro Prozess eigen; jeder Daemon hat seine eigene Liste und
 * fasst die Dateien der anderen NIE an.
 */
const __evalCacheMru = [];

/**
 * Skript als "gerade benutzt" vermerken und den Ueberhang loeschen (v5.0).
 *
 * LAUFENDE SKRIPTE SIND SICHER, ohne dass wir das pruefen muessten: die Engine
 * verweigert das Loeschen selbst (BaseServer.removeFile -> "Cannot delete a
 * script that is currently running!", BaseServer.ts:190). ns.rm gibt dann
 * schlicht false zurueck und die Datei bleibt liegen — beim naechsten Aufruf
 * desselben Befehls kommt sie ueber diesen Weg erneut in die Liste.
 *
 * KEIN ns.ls: das kostete 0.2 GB (RamCostGenerator.ts:605) in JEDEM Skript,
 * das evalNs importiert — das sind sieben. ns.rm steht in evalNsDetailed
 * ohnehin schon im Budget, dieser Deckel ist damit gratis.
 *
 * Host: bewusst OHNE zweites Argument, also der Host des laufenden Skripts —
 * genau dort hat ns.write die Datei angelegt (INFO laeuft auf einem pserv,
 * nicht auf home).
 */
function __evalCacheTouch(ns, scriptFile) {
    const i = __evalCacheMru.indexOf(scriptFile);
    if (i >= 0) __evalCacheMru.splice(i, 1);
    __evalCacheMru.push(scriptFile);
    while (__evalCacheMru.length > EVAL_CACHE_MAX) {
        const alt = __evalCacheMru.shift();
        try { ns.rm(alt); } catch (e) { /* laeuft noch oder ist schon weg — egal */ }
    }
}

export async function evalNsDetailed(ns, command, args = [], timeoutMs = 10000) {
    const sentinel = "__SCHWARM_PENDING__";
    let outFile = null, scriptFile = null;
    try {
        // Stabiler Name aus dem Befehl: gleicher Befehl -> gleiche Datei -> das
        // Spiel kompiliert das Skript genau einmal. djb2, weil es kurz ist und
        // hier nur Kollisionsfreiheit "gut genug" braucht — eine Kollision
        // fuehrte lediglich dazu, dass zwei Befehle sich ein Skript teilen
        // wollten; deshalb steht der Befehl zusaetzlich ALS TEXT im Skript und
        // wird beim Vergleich mitgeprueft.
        let h = 5381;
        for (let i = 0; i < command.length; i++) h = (((h << 5) + h) ^ command.charCodeAt(i)) >>> 0;
        scriptFile = "/Temp/schwarm-eval-" + h.toString(36) + ".js";
        outFile = "/Temp/schwarm-eval-" + h.toString(36) + "-"
            + (Date.now() % 100000).toString(36) + Math.floor(Math.random() * 1296).toString(36) + ".txt";

        // Das Skript nimmt die AUSGABEDATEI als ns.args[0] entgegen; alle
        // weiteren Argumente rutschen um eins nach hinten und stehen dem Befehl
        // wie gehabt als ns.args[0..] zur Verfuegung.
        const body =
            "export async function main(ns){" +
            "const __out=ns.args[0];ns.args.shift();" +
            "let r;try{r=JSON.stringify(" + command + ");}" +
            "catch(e){r='__ERR__'+(typeof e=='string'?e:(e&&e.message)||'unknown');}" +
            "ns.write(__out,r===undefined?'null':r,'w');}";
        if (ns.read(scriptFile) !== body) ns.write(scriptFile, body, "w");
        // v5.0: Deckel. Erst NACH dem write vermerken (vorher gibt es die Datei
        // womoeglich gar nicht) und vor dem run. Die eigene Datei ist dabei die
        // juengste in der Liste und kann vom Deckel nie getroffen werden.
        __evalCacheTouch(ns, scriptFile);
        ns.write(outFile, sentinel, "w");

        const pid = ns.run(scriptFile, 1, outFile, ...args);
        if (pid === 0) {
            try { ns.rm(outFile); } catch (e) { /* egal */ }
            return { ok: false, value: null, reason: "NO_RAM" };
        }

        const start = Date.now();
        while (ns.read(outFile) === sentinel && Date.now() - start < timeoutMs) {
            await ns.sleep(25);
        }
        const raw = ns.read(outFile);
        // Das SKRIPT bleibt liegen (Wiederverwendung), nur die Ausgabe geht weg.
        try { ns.rm(outFile); } catch (e) { /* egal */ }

        if (raw === sentinel) return { ok: false, value: null, reason: "TIMEOUT" };
        if (typeof raw === "string" && raw.startsWith("__ERR__")) {
            return { ok: false, value: null, reason: "API_ERR", err: raw.slice(7) };
        }
        try { return { ok: true, value: JSON.parse(raw), reason: "OK" }; }
        catch (e) { return { ok: true, value: raw, reason: "OK" }; }
    } catch (e) {
        try { if (outFile) ns.rm(outFile); } catch (e2) { /* egal */ }
        return { ok: false, value: null, reason: "WRITE_ERR", err: String(e) };
    }
}

/**
 * Capability-Erkennung im v1-Objektformat (ARSENAL erwartet u.a. SF4/SING/TIX/GANG/CORP/BLADE).
 * Misst billige Flags direkt; Source-File-abhängige Flags über getOwnedSourceFiles
 * (RAM-Dodge). Wirft nie — fehlende Felder sind schlicht false/0.
 *
 * @param {NS} ns
 * @returns {Promise<Object<string, boolean|number>>}
 *   { SF4:number, SING:bool, TIX:bool, FOURS:bool, WSE:bool, GANG:bool,
 *     BLADE:bool, CORP:bool, HASHSERV:bool, DARKWEB:bool }
 */
export async function detectCapabilities(ns) {
    const c = {
        SF4: 0, SING: false, TIX: false, FOURS: false, WSE: false,
        GANG: false, BLADE: false, CORP: false, HASHSERV: false, DARKWEB: false,
    };
    // Source-Files: Quellen-Reihenfolge (v3.1)
    //   1) INFO-Snapshot (Port 28, Block "bn") — 0 GB, KEIN Temp-Skript. Damit
    //      erzeugt der 16-s-SENSE-Takt der Queen keine Wegwerf-Skripte mehr,
    //      sobald INFO läuft. Stale-Schutz: lastNodeReset des Snapshots muss
    //      zum LIVE-Wert passen, sonst lag ein Prestige dazwischen -> ignorieren.
    //   2) RAM-Dodge (evalNs getOwnedSourceFiles) wie bisher — Fallback, solange
    //      INFO (noch) nicht läuft.
    //   3) Sticky-Schutz (unten) — einmal erkannte SFs verschwinden nie still.
    //   BitNode-Nummer kommt jetzt DIREKT aus ns.getResetInfo() (1 GB; zahlt
    //   jeder HELPERS-Importer über bitNodeFeatures ohnehin) statt per evalNs.
    let sf = {};
    let sfOk = false;              // hat eine der SF-Quellen geliefert?
    let bn = 0;
    let riLive = null;
    try { riLive = ns.getResetInfo(); } catch (e) { /* null */ }
    if (riLive && typeof riLive.currentNode === "number") bn = riLive.currentNode;
    try {
        const bnb = readInfoBlock(ns, "bn", Infinity);
        if (bnb && bnb.sf && riLive && bnb.lastNodeReset === riLive.lastNodeReset) {
            sf = bnb.sf; sfOk = true;
        }
    } catch (e) { /* weiter mit RAM-Dodge */ }
    if (!sfOk) {
        try {
            const arr = await evalNs(ns, "ns.singularity.getOwnedSourceFiles().map(s=>[s.n,s.lvl])");
            if (Array.isArray(arr)) { sf = Object.fromEntries(arr); sfOk = true; }
        } catch (e) { /* leer lassen */ }
    }
    const lvl = (n) => Math.max(Number(sf[n] ?? sf[String(n)] ?? 0), bn === n ? 1 : 0);

    c.SF4 = lvl(4);
    c.SING = c.SF4 > 0;
    c.CORP = lvl(3) > 0;
    c.BLADE = lvl(7) > 0 || bn === 7;
    c.HASHSERV = lvl(9) > 0 || bn === 9;

    try { c.WSE = ns.stock.hasWseAccount(); } catch (e) { /* false */ }
    try { c.TIX = ns.stock.hasTixApiAccess(); } catch (e) { /* false */ }
    try { c.FOURS = ns.stock.has4SDataTixApi(); } catch (e) { /* false */ }
    try { c.DARKWEB = ns.hasTorRouter(); } catch (e) { /* false */ }
    try { ns.gang.inGang(); c.GANG = true; } catch (e) { c.GANG = false; }

    // ---- STICKY-SCHUTZ (v-next) --------------------------------------------
    // getOwnedSourceFiles läuft über evalNs (Wegwerf-Skript). Ist der RAM-Pool voll
    // — und der Dispatcher füllt ihn bewusst bis fast an den Rand — schlägt der
    // Dodge fehl und liefert null. Ohne diesen Schutz fielen dann SING/CORP/BLADE/
    // HASHSERV auf false zurück, obwohl die Source-Files längst vorhanden sind.
    // FOLGEN (live beobachtet): Dashboard zeigt alles magenta "wartet auf
    // Freischaltung"; shouldRun() stoppt cap-gebundene Daemons; der ERSATZ-WANT-Pfad
    // der Queen (ownerBlocked) startet BLADEBURNER, während WORK DROP sendet ->
    // START/STOP-Ping-Pong im Sekundentakt.
    // Source-File-BESITZ ändert sich nur bei einem Prestige — und dort wird ohnehin
    // frisch erkannt (checkPrestige -> detectCapabilities). Ein einmal erkanntes SF
    // darf also NIE durch einen fehlgeschlagenen RAM-Dodge verschwinden.
    if (!sfOk) {
        const prev = readCapabilities(ns);
        if (prev && Object.keys(prev).length > 0) {
            if (prev.SING === true)     { c.SING = true; if (c.SF4 < 1) c.SF4 = 1; }
            if (prev.CORP === true)     c.CORP = true;
            if (prev.BLADE === true)    c.BLADE = true;
            if (prev.HASHSERV === true) c.HASHSERV = true;
        }
    }

    return c;
}

// =============================================================================
// BITNODE-FEATURES (v-next) — welche Spielmodi sind in DIESER BitNode nutzbar?
// -----------------------------------------------------------------------------
// HINTERGRUND: Ein Modus kann freigeschaltet (SF vorhanden) UND doch abgeschaltet
// sein — per BitNode-Regel (currentNodeMults, z.B. BladeburnerRank=0) oder per
// bitNodeOptions.disable* (Spieler-Einstellung). Das getrennt sauber zu prüfen
// verhindert die "endlos ins Leere farmen"-Fehler (WORK-Bladeburner) und erlaubt
// Sondernutzungen (Hacknet-RAM, wenn Hashes wertlos sind).
//
// ENGINE-BELEGE:
//   getResetInfo() ist GLOBAL (kein SF4/SF5), 1 GB. Liefert currentNode, ownedSF
//     (aktive SourceFiles) und bitNodeOptions (die disable*-Flags).
//   canAccessBitNodeFeature(n) = (currentNode === n) || (activeSourceFileLvl(n) > 0)
//   canAccessBladeburner  = (SF6||SF7) && !disableBladeburner   (NICHT Rank!)
//   canAccessCorporation  = SF3        && !disableCorporation
//   canAccessGang         = (BN2||SF2) && !disableGang          (+ Karma prüft GANG selbst)
//   canAccessGrafting     = SF10
//   hasHacknetServers     = SF9        && !disableHacknetServer  (true=Hash-Server)
//
// "hashesWorthless" ist ein SONDERFALL: das ist eine BITNODE-REGEL (HacknetNodeMoney),
// die exakt nur getBitNodeMultipliers() liefert — und DAS braucht SF5. SF5-frei
// leiten wir es empirisch aus der TATSÄCHLICHEN Produktion ab: getNodeStats().production
// rechnet den BitNode-Mult bereits ein. Produziert ein vorhandener Hacknet-Knoten
// trotz Level/RAM ~0, sind Hashes/Node-Geld in dieser BitNode wertlos.

/** Prozess-lokaler Cache. Die Feature-Gates ändern sich nur bei Prestige. */
let BNF_CACHE = null;

/** Intern: ownedSF kann als Map, Objekt oder Array-von-Paaren ankommen -> vereinheitlichen. */
function sfMap(ownedSF) {
    const m = {};
    try {
        if (!ownedSF) return m;
        if (ownedSF instanceof Map) { for (const [k, v] of ownedSF) m[k] = v; return m; }
        if (Array.isArray(ownedSF)) { for (const pair of ownedSF) if (Array.isArray(pair)) m[pair[0]] = pair[1]; return m; }
        if (typeof ownedSF === "object") { for (const k of Object.keys(ownedSF)) m[k] = ownedSF[k]; return m; }
    } catch (e) { /* leeres m */ }
    return m;
}

/**
 * Feature-Gates der aktuellen BitNode. Synchron, ~1-2 GB (getResetInfo + evtl.
 * getNodeStats). Prozess-lokal gecacht; invalidiert bei Prestige (lastNodeReset).
 *
 * Rückgabe (alle bool, außer bitNode):
 *   { bitNode, bladeburner, corporation, gang, grafting, sleeves, hacknetServer,
 *     hashesWorthless }
 *
 * Nutzung:
 *   - Queen:      GANG/CORP/BLADEBURNER nicht deployen, wo der Modus fehlt.
 *   - WORK:       Bladeburner-Phase nur wenn .bladeburner (ergänzt den Rank-Fallback).
 *   - BANK:       .hashesWorthless -> kein Hash-Kaufziel; .grafting -> Graft-Ökonomie.
 *   - DISPATCHER: .hashesWorthless -> Hacknet-Server-RAM als Worker-Pool freigeben.
 *
 * @param {NS} ns
 * @returns {{bitNode:number, sf4:number, bladeburner:boolean, corporation:boolean, gang:boolean,
 *            grafting:boolean, sleeves:boolean, hacknetServer:boolean, hashesWorthless:boolean}}
 */
export function bitNodeFeatures(ns) {
    // --- Prestige-Invalidierung ---
    let nodeReset = 0;
    let ri = null;
    try { ri = ns.getResetInfo(); if (ri && ri.lastNodeReset) nodeReset = ri.lastNodeReset; } catch (e) { /* 0 */ }
    if (BNF_CACHE && BNF_CACHE._reset === nodeReset) {
        // Gates sind statisch -> Cache. hashesWorthless ist dynamisch (s.u.) -> frisch.
        BNF_CACHE.hashesWorthless = computeHashesWorthless(ns, BNF_CACHE);
        return BNF_CACHE;
    }

    // --- Gates neu ermitteln ---
    const bn = (ri && typeof ri.currentNode === "number") ? ri.currentNode : 0;
    const sf = sfMap(ri && ri.ownedSF);
    const opt = (ri && ri.bitNodeOptions) || {};
    const has = (n) => bn === n || (sf[n] || 0) > 0;   // canAccessBitNodeFeature

    const f = {
        _reset: nodeReset,
        bitNode: bn,
        sf4:           Math.max(sf[4] || 0, bn === 4 ? 3 : 0),   // SF4-Level (Singularity-RAM!)
        bladeburner:  (has(6) || has(7)) && !opt.disableBladeburner,
        corporation:   has(3) && !opt.disableCorporation,
        gang:         (bn === 2 || (sf[2] || 0) > 0) && !opt.disableGang,   // Karma prüft GANG selbst
        grafting:      has(10),
        // v4.2: Stanek braucht SF13 (canAccessCotMG -> canAccessBitNodeFeature(13)).
        // Die GittergroeSSE haengt zusaetzlich am SF13-LEVEL:
        //     baseSize = 9 + StaneksGiftExtraSize + SF13-Level
        // Deshalb den Level mitfuehren, nicht nur ja/nein.
        stanek:        has(13),
        sf13:          Math.max(sf[13] || 0, bn === 13 ? 1 : 0),
        sleeves:       true,   // wird gleich empirisch überschrieben (getNumSleeves)
        hacknetServer: has(9) && !opt.disableHacknetServer,   // true = Hash-Server statt Nodes
        hashesWorthless: false,
    };

    // Sleeves: das Feature-Gate ist SF10/BN10, ABER die zuverlässige Prüfung ist die
    // tatsächliche Anzahl (0 = keine, in dieser BitNode nicht verfügbar). WORK cached
    // das separat; hier setzen wir einen konservativen Default aus dem Gate.
    f.sleeves = has(10);

    f.hashesWorthless = computeHashesWorthless(ns, f);
    BNF_CACHE = f;
    return f;
}

/**
 * ZAHLT HACKING IN DIESER BITNODE UEBERHAUPT GELD?                    [v4.1]
 *
 * WARUM DAS EINE EIGENE FRAGE IST. `caps` beantwortet "darf ich" — nicht "lohnt
 * es sich". In BN8 sind Bladeburner, Corp und Gang formal freigeschaltet
 * (BLADE/CORP/GANG stehen auf 1), aber wirtschaftlich tot:
 *
 *     ScriptHackMoneyGain 0   hack() zahlt dem Spieler NICHTS
 *     CompanyWorkMoney 0 · CrimeMoney 0 · HacknetNodeMoney 0
 *     InfiltrationMoney 0 · CodingContractMoney 0 · DarknetMoneyMultiplier 0
 *     CorporationValuation 0 · BladeburnerRank 0 · GangSoftcap 0
 *                                                  (BitNode.tsx:764-790)
 *
 * Die Boerse ist dort die einzige Geldquelle. Wer das nicht weiss, verteilt sein
 * RAM nach Ertragsschaetzungen, die alle null sind — im Livereport lagen 2,9 TB
 * auf Geld-Hacking mit $0 Ertrag, waehrend die Kursbeeinflussung (die einzige
 * Quelle) im Schnitt 1 GB bekam.
 *
 * ACHTUNG, FEINHEIT: `hack()` LEERT den Server weiterhin (ScriptHackMoney 0.3),
 * nur der Spieler bekommt nichts. Und influenceStockThroughServerHack rechnet
 * mit dem ABGEZOGENEN Betrag (NetscriptHelpers.tsx:641/660) — Manipulation per
 * hack funktioniert in BN8 also ungebremst. "Hacking ist wertlos" heisst
 * ausdruecklich NICHT "hack() ist wirkungslos".
 *
 * KOSTEN: 0 GB. Gelesen wird der bn-Block des INFO-Daemons, der die
 * Multiplikatoren ohnehin fuehrt (mit SF5 live, sonst null). ns.getBitNodeMultipliers
 * kostet 4 GB und wird hier bewusst NICHT aufgerufen — der Wert waere jedem
 * Importeur dieser Datei aufgeschlagen worden.
 *
 * @param {NS} ns
 * @returns {boolean} true = hack() bringt dem Spieler kein Geld.
 *                    Bei Unkenntnis (INFO laeuft nicht, kein SF5) FALSE —
 *                    konservativ, denn die Folge waere sonst, dass der
 *                    Dispatcher in einer normalen BitNode das Geld-Hacking
 *                    zugunsten der Kursbeeinflussung herunterfaehrt.
 */
export function hackMoneyWorthless(ns) {
    try {
        const bn = readInfoBlock(ns, "bn", Infinity);   // statisch je BitNode
        const m = bn && bn.mults;
        if (!m || typeof m.ScriptHackMoneyGain !== "number") return false;
        return m.ScriptHackMoneyGain === 0;
    } catch (e) { return false; }
}

/**
 * Intern: Sind Hashes/Hacknet-Node-Geld in dieser BitNode wertlos?
 * Zwei Stufen, beide SF5-frei bevorzugt:
 *   1. Existiert ein Hacknet-Knoten -> production lesen. Rechnet den BitNode-Mult
 *      bereits ein. Knoten mit Level/RAM > Basis, aber production ~0 -> wertlos.
 *   2. Kein Knoten vorhanden -> nicht entscheidbar -> false (konservativ: Hacknet
 *      bleibt Produzent). Sobald der erste Knoten existiert, greift Stufe 1.
 * @param {NS} ns
 * @param {Object} f  bereits ermittelte Features (für hacknetServer-Kontext)
 * @returns {boolean}
 */
function computeHashesWorthless(ns, f) {
    try {
        // =====================================================================
        // v4.6 — STUFE 0: DEN MULTIPLIKATOR FRAGEN, NICHT DEN KNOTEN
        // =====================================================================
        // Die Messung unten braucht einen VORHANDENEN Knoten. Ohne Knoten galt
        // "nicht entscheidbar -> false". Das erzeugte eine Sackgasse, die live
        // aufgetreten ist:
        //
        //   0 Knoten -> "nicht entscheidbar" -> hashesWorthless = false
        //            -> BANK bewertet Hacknet nach HASH-Ertrag
        //            -> Ertrag ist 0 (BN8)
        //            -> es wird nie ein Knoten gekauft
        //            -> es gibt weiterhin 0 Knoten
        //
        // Um zu erkennen, dass Hashes wertlos sind, brauchte es also einen
        // Knoten, den man nur kaufte, wenn Hashes nicht wertlos sind. Der
        // Nutzer musste den ersten Server von Hand kaufen — und nach dem
        // naechsten Aug-Install war der Zustand wieder derselbe, weil
        // prestigeAugmentation das Hacknet zuruecksetzt.
        //
        // Dabei steht die Antwort laengst fest, ganz ohne Knoten. Beide
        // Produktionsformeln enden auf denselben Faktor:
        //     HacknetNodes.ts:10    ... * currentNodeMults.HacknetNodeMoney
        //     HacknetServers.ts:16  ... * currentNodeMults.HacknetNodeMoney
        // Ist er 0, ist die Produktion 0 — bei jedem Ausbaustand, fuer Nodes
        // wie fuer Server. Das ist keine Schaetzung, sondern dieselbe Zahl, die
        // die Engine einsetzt.
        //
        // Ohne SF5 gibt es die Multiplikatoren nicht; dann bleibt es bei der
        // Messung unten.
        const bn = readInfoBlock(ns, "bn", Infinity);
        const m = bn && bn.mults;
        if (m && typeof m.HacknetNodeMoney === "number") return m.HacknetNodeMoney === 0;

        const n = ns.hacknet.numNodes();
        if (n <= 0) return false;                 // Stufe 2: nicht entscheidbar
        // Stufe 1: irgendein Knoten mit production ~0 trotz vorhandenem Level?
        // Wir prüfen den ersten Knoten; reicht, weil der Mult global gilt.
        const st = ns.hacknet.getNodeStats(0);
        if (!st) return false;
        // production ist hashRate (Server) oder $/s (Node). Beides skaliert mit dem
        // BitNode-Mult. Ein frisch gekaufter Knoten hat Level 1 und trotzdem >0
        // production, AUSSER der Mult ist 0.
        return (st.production || 0) <= 0;
    } catch (e) {
        return false;   // Hacknet-API nicht verfügbar -> konservativ
    }
}

/**
 * RAM-Karte als ARRAY mit Reserve-Abzug — v1-Form, die GENESIS erwartet.
 * Iterierbar via `for (const node of map)`, Felder: { host, max, used, free }.
 * 'home' ist enthalten, aber sein free ist um homeReserveGb reduziert.
 *
 * @param {NS} ns
 * @param {string[]} [hosts=null] Vorab ermittelte Hostliste; null => scanNetwork(ns)+home.
 * @param {number} [homeReserveGb=16] Auf 'home' freizuhaltende GB.
 *   (Stand bis 05.09.2026 als =0 im JSDoc, waehrend die Signatur 16 setzt.
 *   Wer sich auf die Doku verliess, rechnete mit 16 GB mehr, als es gibt.)
 * @returns {Array<{host:string, max:number, used:number, free:number}>}
 *   Absteigend nach freiem RAM sortiert.
 */
export function buildRamMapArray(ns, hosts = null, homeReserveGb = 16) {
    const list = [];
    let targets = hosts;
    if (!Array.isArray(targets)) targets = ["home", ...scanNetwork(ns)];
    for (const host of targets) {
        try {
            if (host !== "home" && !ns.hasRootAccess(host)) continue;
            const max = ns.getServerMaxRam(host);
            if (max <= 0) continue;
            const used = ns.getServerUsedRam(host);
            let free = max - used;
            if (host === "home") free = Math.max(0, free - (homeReserveGb || 0));
            if (free <= 0) continue;
            list.push({ host, max, used, free });
        } catch (e) { /* Host überspringen */ }
    }
    list.sort((a, b) => b.free - a.free);
    return list;
}

// =============================================================================
// 11. RESERVIERUNG (Port 19, RESERVATION) — Queen -> Dispatcher
// -----------------------------------------------------------------------------
// Die Queen sagt dem Dispatcher, wieviel RAM er auf welchem Host FREIMACHEN soll.
// Der Dispatcher setzt das in ZWEI STUFEN um (siehe SCHWARM-DISPATCHER v8):
//   1. PASSIV: er legt dort keine neuen Worker mehr hinein. Laufende h/w/g-Worker
//      auf aktiven Zielen bleiben unangetastet — sie laufen aus. Kein Ertragsverlust.
//   2. AKTIV: reicht das nach RESERVE_DEADLINE_MS nicht, killt er FÜLL-Worker
//      (share -> XP-Weaken -> Prep auf Nebenzielen). Die sind reiner Pufferertrag;
//      ihr Verlust kostet fast nichts. Der Hacking-Kern wird NIE angetastet.
//
// ENTFERNT (v3.0): Port 7 (WORKER-SNAPSHOT), publishWorkerSnapshot,
// readWorkerSnapshot, workerKind, hostFreeETA — waren toter Code (niemand hat je
// geschrieben oder gelesen). Die Zwei-Stufen-Politik oben ersetzt die
// ETA-Schätzerei durch etwas, das tatsächlich funktioniert.
// =============================================================================

/**
 * Reservierungs-Map veröffentlichen (überschreibt Port 19, RESERVATION).
 * Format: "host:gb|host:gb|...". Hosts ohne Reservierung werden weggelassen.
 * @param {NS} ns
 * @param {Object<string, number>} reservations host -> reservierte GB.
 * @returns {boolean}
 */
export function publishReservations(ns, reservations) {
    try {
        const s = Object.entries(reservations || {})
            .filter(([, gb]) => gb > 1)
            .map(([h, gb]) => `${h}:${gb}`).join("|");
        // v3.6: Zeitstempel-Marker anhaengen. "@" ist kein gueltiger Hostname, der
        // Eintrag kann also nie mit einer echten Reservierung verwechselt werden.
        // Er steht AUCH bei leerer Map dabei — sonst waere "NONE" nicht datierbar
        // und der Dispatcher koennte "gerade geleert" nicht von "seit gestern leer"
        // unterscheiden.
        const stamp = "@:" + Date.now();
        const body = s.length > 0 ? (s + "|" + stamp) : ("NONE|" + stamp);
        const port = ns.getPortHandle(SCHWARM_PORTS.RESERVATION);
        port.clear();
        return port.tryWrite(body);
    } catch (e) { return false; }
}

/**
 * Alter der Reservierungs-Meldung: Zeitstempel in ms oder 0, wenn keiner
 * mitgeschrieben wurde (aeltere Queen/HELPERS). 0 heisst ausdruecklich
 * "Alter unbekannt" — ein Leser darf daraus NICHT "uralt" schliessen und die
 * Reservierung verwerfen, sonst kippt die Abwaertskompatibilitaet in einen
 * Totalausfall der Daemon-Starts.
 * @param {NS} ns
 * @returns {number} ms-Zeitstempel oder 0.
 */
export function readReservationsAt(ns) {
    try {
        const v = ns.peek(SCHWARM_PORTS.RESERVATION);
        if (typeof v !== "string") return 0;
        for (const part of v.split("|")) {
            if (part.startsWith("@:")) {
                const n = Number(part.slice(2));
                return Number.isFinite(n) && n > 0 ? n : 0;
            }
        }
        return 0;
    } catch (e) { return 0; }
}

/**
 * Reservierungs-Map lesen (peek). Leeres Objekt, wenn nichts/NONE gesetzt.
 * @param {NS} ns
 * @returns {Object<string, number>} host -> reservierte GB.
 */
export function readReservations(ns) {
    try {
        const v = ns.peek(SCHWARM_PORTS.RESERVATION);
        // v3.6: "NONE" kommt jetzt als "NONE|@:<ms>" — der alte Vergleich auf exakt
        // "NONE" greift dann nicht mehr. Das ist folgenlos (die Schleife unten filtert
        // beide Teile weg), der Frueh-Ausstieg bleibt aber der Klarheit halber drin.
        if (typeof v !== "string" || v === "NONE" || !v.includes(":")) return {};
        const out = {};
        for (const part of v.split("|")) {
            if (part.startsWith("@:")) continue;   // v3.6: Zeitstempel-Marker, kein Host
            const [h, gb] = part.split(":");
            const n = Number(gb);
            if (h && h !== "NONE" && Number.isFinite(n) && n > 0) out[h] = n;
        }
        return out;
    } catch (e) { return {}; }
}
