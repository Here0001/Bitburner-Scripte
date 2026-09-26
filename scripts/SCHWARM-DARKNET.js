/**
 * SCHWARM-DARKNET.js — v4.10 — Darknet-Subsystem, DEZENTRAL + PARALLEL.
 *
 * v4.10 — RUECKMELDE-RAETSEL KAMEN NICHT DURCH (Knacker v4.1).
 *   BN15, 25.09.2026: Factori-Os, RateMyPix.Auth, BellaCuore, KingOfTheHill
 *   nur 40-57 % geloest. Ursachen (Workflow + Gegenprobe am Code):
 *   (1) harte Wanduhr 120 s je Lauf; bei frischem Charisma kostet jeder
 *       Versuch 3-5 s -> Rueckmelde-Modelle bekommen jetzt 10 min;
 *   (2) Ziel weg (351/404/503): der Lauf zaehlte bis zur Frist 100-ms-Nieten
 *       -> endet jetzt sofort, mit Grund;
 *   (3) 408 = Zeitueberschreitung ohne Log-Eintrag -> einmal wiederholen;
 *   (4) probeOne las bei fehlendem Eintrag den eines FREMDEN Versuchs
 *       (Binaersuche in die falsche Richtung) -> jetzt kein Eintrag = Abbruch;
 *   (5) nach Fristende keine teure Log-Abfrage mehr; solveDivisibility
 *       rechnet nicht mehr mit halber Liste weiter;
 *   (6) jeder Abbruch meldet seinen Grund (FEEDBACK ... | Grund).
 *
 * v4.9 — Leiche entfernt: writeManualEntfernt() stand seit v4.1 ohne einen
 *   einzigen Aufrufer im Skript. schwarm-dnet-manual.txt BLEIBT als
 *   Handkanal (nur lesen): sie existiert im Spiel gar nicht, kostet also
 *   nichts, und ohne sie gaebe es keinen Weg, ein Passwort von Hand
 *   beizusteuern. Der Pin auf home haengt weiterhin an ihr.
 * Laeuft auf HOME (persistent ueber Augments + BitNode-Wechsel).
 *
 * v4.8 — HEALTHCHECK 3: ZWEI TOTE FUNKTIONEN KOSTETEN 1,0 GB JE ROAMER.
 *   tryAuth() und scrapeLogs() standen noch im Roamer, wurden aber nirgends
 *   gerufen. Der Dateikopf sagt selbst, warum: v4.1 hat beide nach
 *   schwarm-crack.js verschoben ("v4.1.1 — BEIM AUSLAGERN VERGESSEN"), dort
 *   leben sie und werden benutzt. Die Originale blieben zurueck.
 *
 *   Toter Code ist in Bitburner nicht gratis: der BLOSSE BEZEICHNER einer
 *   ns-Funktion geht in die Skriptkosten ein, der Aufruf ist egal. Die beiden
 *   brachten dem Roamer damit dauerhaft mit
 *       ns.dnet.authenticate  0,4 GB  (RamCostGenerator.ts:238)
 *       ns.dnet.heartbleed    0,6 GB  (RamCostGenerator.ts:241)
 *   — zusammen 1,0 GB auf JEDEM Darknet-Rechner. Beide APIs kamen im ganzen
 *   Roamer NUR in diesen beiden Funktionen vor (die verbliebenen Nennungen
 *   stehen in Kommentaren und kosten nichts).
 *
 *   Weniger RAM je Roamer heisst unmittelbar mehr Hosts, auf die er passt:
 *   spread() prueft den freien Speicher gegen roamerNeed().
 *
 * v4.7 — DIE ROAMER HOLEN SICH IHRE NUTZLASTEN JETZT SELBST.
 *   schwarm-crack.js, schwarm-lab.js und der Roamer wurden NUR beim Besiedeln
 *   kopiert. Wer schon lief, behielt seinen Stand fuer immer — ein eingespielter
 *   Fix erreichte ihn nie. Genau daran hing v4.6: die Korrektur des
 *   RMS-Musters lag auf home, waehrend die Fremdrechner weiter mit dem kaputten
 *   Muster rechneten. Sauber wurde es nur, weil ein Aug-Reset alles neu
 *   besiedelt hat.
 *
 *   Der Weg war nicht offensichtlich, steht aber eindeutig in der Engine:
 *   ns.scp prueft Rechte AUSSCHLIESSLICH auf dem ZIEL
 *   (NetscriptFunctions.ts:761-767). Die QUELLE wird nur nachgeschlagen
 *   (helpers.getServer, Zeile 770) — ohne jede Pruefung. Ein Roamer darf also
 *   von home HOLEN, obwohl home ihm nichts schicken duerfte (dafuer braeuchte
 *   home eine Session auf dem Fremdrechner). Fuer den eigenen Server ist man
 *   automatisch authentifiziert (offlineServerHandling.ts:99).
 *
 *   Damit braucht es keine Kaskade ueber Nachbarn: jeder Roamer haelt sich
 *   selbst aktuell, alle 30 Runden und einmal beim Start.
 *
 *   Die LOESER wirken sofort — schwarm-crack.js und schwarm-lab.js werden bei
 *   jedem Einsatz frisch ge-exec't. Der Roamer-Rumpf zieht beim naechsten
 *   Neustart nach; ein Selbst-Neustart per ns.spawn waere moeglich, kostet
 *   aber 2 GB dauerhaft auf JEDEM Host und damit Ausbreitungsreichweite.
 *
 * v4.6 — PHP 5.4: EIN EINZIGER FEHLENDER BACKSLASH.
 *   Der Grund aus v4.5 kam an und war eindeutig:
 *     "Grundmessung: keine RMS-Abweichung in der Antwort: 001279; RMS Deviation:4.74"
 *   Die Abweichung STAND in der Antwort. Der Loeser konnte sie nur nicht sehen.
 *
 *   Ursache: Die Loeser leben als Text in SRC_CRACK, einem Template-Literal.
 *   Beim Auswerten wird daraus Quelltext, und dabei frisst JavaScript eine
 *   Backslash-Ebene: aus "\\s" wird "\s", aus "\s" wird schlicht "s".
 *   In Zeile 3775 stand das Muster mit EINFACHEN Backslashes. Was im Spiel
 *   lief, war also
 *       /RMSs*Deviations*:s*([0-9]*.?[0-9]+)/i
 *   und das kann "RMS Deviation:4.74" niemals treffen — es verlangt "RMSs",
 *   "Deviations" und ein "s" vor der Zahl. Jede Grundmessung scheiterte,
 *   jedes fuenf- bis fuenfzehnstellige Passwort ging verloren. Die rund 1 %
 *   Erfolge kamen ausschliesslich aus dem Umstell-Weg fuer kurze Passwoerter.
 *   Jetzt steht dort "\\s" bzw. "\\.", im Spiel also "\s" und "\.".
 *
 *   WARUM DAS DURCH ALLE TESTS KAM: Mein Pruefstand hat den Mustertext roh
 *   aus der Datei geschnitten und NICHT entdoppelt. Er hat damit das Muster
 *   geprueft, das dastehen SOLL, statt des Musters, das laeuft — und 640 von
 *   640 gemeldet. Ein Pruefstand, der die Auswertung des Template-Literals
 *   ueberspringt, kann genau diese Fehlerklasse grundsaetzlich nicht finden.
 *   Der Nachweis laeuft jetzt ueber die ENTDOPPELTE Zeile: alt trifft keine
 *   einzige echte Engine-Antwort, neu trifft "RMS Deviation:4.74",
 *   "RMS Deviation: 0.0" und "rms deviation : 12" und weist die
 *   Laengen-Absage weiterhin korrekt ab.
 *
 *   Zusaetzlich geprueft: SRC_ROAMER, SRC_LAB und SRC_CRACK wurden Zeile fuer
 *   Zeile auf ungerade Backslash-Laeufe abgesucht. Zeile 3775 war die EINZIGE
 *   Fundstelle in allen drei Nutzlasten. (SCHWARM-PAYLOADS.js ebenfalls: dort
 *   nur ein "\n" in einer verschachtelten Backtick-Zeichenkette, das gewollt
 *   zu einem echten Zeilenumbruch wird und dort erlaubt ist.)
 *
 * v4.5 — DER ABBRUCH-GRUND WAR DA, ABER UNSICHTBAR.
 *   Jede Ruecksprungstelle der Rueckmelde-Loeser traegt seit v4.5 einen Grund
 *   ein. Gemeldet wurde aber nur EINER ueber ALLE Modelle — der letzte. Weil
 *   staendig mehrere Arten scheitern, stand der Grund des interessanten
 *   Modells praktisch nie im Lagebild: "PHP 5.4" lag bei 1 % Erfolg und 666
 *   Abbruechen, und gezeigt wurde immer updown, spice oder maxima.
 *   Jetzt wird JE RUECKMELDEART der letzte Grund gemeldet (hoechstens fuenf).
 *
 *   Der Loeser selbst ist NICHT geaendert. Gegen eine exakte Nachbildung der
 *   Engine (ServerGenerator.ts:108-124, authentication.ts:127-143) loest er
 *   640 von 640 Faellen — auch mit Protokoll-Rauschen. Der Fehler liegt also
 *   in den Daten, die er im Spiel bekommt, nicht in seiner Rechnung. Welche,
 *   sagt das naechste Lagebild.
 *
 * v4.4 — RateMyPix.Auth: Kostenschaetzung 60 -> 85 (gerechnet, nicht geraten:
 *   eine Sonde je Alphabetzeichen plus rund L*log2(L) fuer die Positionen).
 *   Der Loeser selbst ist unveraendert und korrekt — sein Alphabet deckt sich
 *   Zeichen fuer Zeichen mit dictionaryData.ts. Ausserdem: der Kommentar am
 *   Fuellzeichen behauptete, die Tilde komme in keinem Passwort vor. Das gilt
 *   nur fuer die zwei Modelle, die es benutzen — jetzt steht das auch da.
 *
 * v4.3 — DAS WOERTERBUCH WURDE IMMER NUR ZU ZWEI DRITTELN GELESEN.
 *   Ein Knack-Lauf hat zwei Minuten (RUN_MS). Bei teuren Zielen reicht die
 *   ZEIT nicht fuer alle Woerter: die Auth-Dauer ist
 *   850 ms * (5*chaRequired + (difficulty+1)*100) / (charisma + 150).
 *   Live an "TopPass" (93 Woerter): im Schnitt 66 Versuche, dann war die
 *   Frist um — und der naechste Lauf begann WIEDER bei Wort 1.
 *   Damit war das letzte Drittel der Liste unerreichbar. Bilanz vor dem
 *   Reset: 4 geknackt, 7 aufgegeben, 36 %. Kein Zufall, sondern Bauart.
 *
 *   Der Lauf merkt sich jetzt in dnet-pos.txt, wo er aufgehoert hat, und der
 *   naechste faengt dort an. Entscheidend ist der UMLAUF: es wird nicht
 *   "ab N bis Ende" probiert, sondern die Liste einmal rund. So ist jedes
 *   Wort in jedem Lauf erreichbar, und ein veralteter Stand (der Server
 *   wurde neu gewuerfelt) kostet nichts — er verschiebt nur den Startpunkt.
 *
 *   NICHT die Ursache war das Woerterbuch selbst: es hat 93 Eintraege und
 *   ist damit vollstaendig (DarkNet/models/dictionaryData.ts:61-155).
 *   Ich hatte zwischendurch 290 gezaehlt — das war ein Zaehlfehler von mir,
 *   der alle Woerterbuecher der Datei zusammenwarf.
 *
 * v4.2 — KINGOFTHEHILL IN EINEM DRITTEL DER SONDEN.
 *   Der Loeser rasterte den ganzen Zahlenbereich mit Schrittweite w ab, das
 *   sind rund 90 Sonden, bevor die Feinsuche ueberhaupt anfing. Dabei ist
 *   ln(Hoehe) ueber einem einzelnen Berg EXAKT eine Parabel — drei Punkte
 *   genuegen, und aus ihnen fallen Bergmitte UND Berghoehe heraus. Die
 *   Hoehe sagt, ob man auf dem Hauptberg steht (10000) oder wie viele Berge
 *   daneben (je 2600 weniger). Damit wird gezielt gesprungen statt gerastert.
 *
 *   Gemessen gegen eine exakte Nachbildung von
 *   DarkNet/effects/authentication.ts:216-244, 800 Faelle:
 *       bisher Ø 76,8 Sonden   neu Ø 30,9 Sonden   beide 800/800 geloest.
 *   Bei einem einzelnen Berg (difficulty < 8): 7 statt 95.
 *   Der schlechteste Fall steigt leicht (111 statt 95) — wenn der schnelle
 *   Weg nicht traegt, sind seine Sonden verloren und das Raster laeuft
 *   trotzdem. Das ist der bewusste Tausch: viel besserer Schnitt gegen
 *   einen etwas teureren Ausreisser.
 *
 *   Das Raster BLEIBT als Rueckfall, und seine Schrittweite w bleibt
 *   unangetastet. Sie ist nicht zu fein: bei Schritt w misst der Hauptberg
 *   im schlechtesten Fall 7800 und schlaegt jeden Nebenberg (hoechstens
 *   7530) auch in dessen bestem Fall. Bei Schritt 2w waere die Rangfolge
 *   umgekehrt — 3700 gegen 7400. Fast haette ich genau das gespart.
 *
 *   Die Suche steht als reine Funktion ohne ns da (kothSuchen) und wird von
 *   der Pruefleiste WORTGLEICH gegen die nachgebaute Engine gefahren.
 *
 * v4.1.2 — DIE SACKGASSE DER DEZENTRALISIERUNG. Der Preis des v4.1-Umbaus, den
 *   ich uebersehen hatte: Livelauf meldete "4 Nachbarn / 4 erledigt / 0 offen" bei
 *   NULL gestarteten Knack-Ops und 4 % Abdeckung — das Darknet stand still.
 *
 *   Ursache: "geknackt" galt als "erledigt". Mit der frueheren netzweiten
 *   Passwortliste stimmte das, denn dort ueberlebte das Passwort jeden
 *   Roamer-Neustart. Lokal (dnet-pw.txt) gilt es nicht mehr: ein Roamer, der nach
 *   killall oder Mutation neu startet, kennt das Passwort seines laengst
 *   gerooteten Nachbarn nicht — und ohne Session lehnt die Engine scp UND exec ab
 *   (NetscriptFunctions.ts:636/761). Der Server war besetzt-aber-unerreichbar, und
 *   weil er als erledigt gezaehlt wurde, fasste ihn niemand mehr an. Ein Zustand,
 *   aus dem sich das System nicht selbst befreien konnte.
 *
 *   Behoben an beiden Enden, ohne die globale Liste zurueckzuholen:
 *     - Der Roamer zaehlt einen gerooteten Nachbarn nur dann als erledigt, wenn
 *       dort ein Roamer laeuft ODER eine gueltige Session besteht (hasSession aus
 *       der Engine). Sonst bleibt er ein Ziel.
 *     - Der Knack-Op bricht bei vorhandenem Root nicht mehr ab, sondern beschafft
 *       Passwort und Session. Das geht, weil checkPassword (authentication.ts:19-31)
 *       AUSSCHLIESSLICH das Passwort vergleicht und den Root-Status ignoriert;
 *       handleSuccessfulAuth bindet die Session dann an die PID des Ops. Bei den
 *       berechenbaren Modellen kostet das genau einen Versuch.
 *   So beschafft sich jeder Roamer selbst, was er braucht — das ist die dezentrale
 *   Antwort auf das Problem, nicht die Rueckkehr zur gemeinsamen Liste.
 *
 * v4.1.1 — LAUFZEITFEHLER im Knack-Op behoben: "ReferenceError: DEBUG_DUMP is not
 *   defined" in scrapeLogs. Die Funktion ist beim v4.1-Umbau aus dem Roamer in
 *   schwarm-crack.js gewandert, die beiden Diagnose-Variablen drumherum
 *   (DEBUG_DUMP, dumpedLogs) blieben zurueck. Betroffen war der Rueckfall-Pfad:
 *   ein Modell, das crack() nicht kennt, fuehrt zu res.todo -> scrapeLogs -> Wurf.
 *   Ursache auf Werkzeugebene: node --check findet nur SYNTAXfehler; ein freier
 *   Identifier faellt erst zur Laufzeit auf. Die Pruefung laeuft jetzt zusaetzlich
 *   ueber den AST (acorn) gegen alle Bindungen jedes EINGEBETTETEN Payloads —
 *   also gegen exakt den Code, den die Engine ausfuehrt.
 *
 * v4.1 — GLOBALER ZUSTAND ABGEBAUT, GEMESSEN STATT GEFUEHRT.
 *   Leitfrage: Wenn ein Skript ohnehin nur den eigenen und die angrenzenden Server
 *   sehen und bearbeiten kann, warum wird dann eine netzweite Liste gefuehrt?
 *   Die Pruefung ergab: fuer keine dieser Informationen gibt es einen mechanischen
 *   Grund — und zwei der letzten drei Fehler kamen genau aus diesen Umwegen.
 *
 *   (A) PASSWOERTER SIND JETZT LOKAL. Ein Passwort braucht nur, wer
 *       ns.dnet.connectToSession(nachbar, pw) aufruft. Sessions haengen an der PID
 *       (authentication.ts:206), fuer den eigenen Server ist man automatisch
 *       authentifiziert (offlineServerHandling.ts:99) — der Aufrufer sitzt also
 *       IMMER auf demselben Server wie der Knack-Op, der das Passwort gefunden hat.
 *       Ein Verzeichnis, ein Schreiber, ein Leser: dnet-pw.txt, nie gescp't.
 *       Die netzweite Verteilung war zudem aktiv schaedlich: prestigeDarknetState
 *       (DarknetState.ts:84-101, bei JEDEM Aug-Install ueber Prestige.ts:76) baut
 *       das Darknet komplett neu auf, die Datei ueberlebt aber als Textdatei
 *       (ServerHelpers.ts:224) — sie sammelte mit jedem BitNode eine Ladung
 *       wertloser Eintraege, die nur Fehlversuche erzeugten. Dazu schrieben mehrere
 *       Prozesse dieselbe Datei (last-write-wins).
 *       Und der Umweg selbst war die Ursache des v4.0-Bugs: weil das Nachlesen ein
 *       eigener Schritt war, ging er beim Auslagern des Crackers verloren.
 *       schwarm-dnet-manual.txt ist ab jetzt fuer Skripte NUR LESBAR und enthaelt
 *       ausschliesslich, was der Spieler eintraegt — das gilt netzweit und wandert
 *       weiter mit. writeManual und die Lab-Passwort-Rueckschreibung entfallen.
 *
 *   (B) SESSIONEN WERDEN GEMESSEN, NICHT GEFUEHRT. getServerDetails liefert
 *       hasSession und isConnectedToCurrentServer direkt aus der Engine
 *       (Darknet.ts:419-423). Bis v4.0.2 entschied die Modulvariable SESSIONS —
 *       gesetzt beim Knacken, danach nie geprueft. Sie konnte also eine Session
 *       behaupten, die es nicht mehr gab (serverState wird bei Mutation und bei
 *       jedem Prestige geleert). Daher die Log-Meldung "exec abgelehnt trotz
 *       Session und freiem RAM": tatsaechlich fehlte meist die DIREKTVERBINDUNG,
 *       die in der Diagnose gar nicht vorkam, obwohl ns.exec sie prueft
 *       (NetscriptFunctions.ts:636) und Mutation sie mit p=0,5 entfernt.
 *       Jetzt wird jede der drei Bedingungen einzeln gelesen und benannt.
 *
 *   (C) KARTE WIRD NACH EINEM RESET VERWORFEN. Aus demselben Grund wie (A): nach
 *       einem Aug-Install existiert keiner der gespeicherten Hostnamen mehr. Ohne
 *       die Pruefung las der Daemon 40+ Geisterhosts ein, und bis die Inventur sie
 *       ausgekehrt hatte, waren "gemappt", "Abdeckung", Auftragsvergabe und
 *       Nachsaat falsch. Erkennung ueber getResetInfo().lastAugReset (1 GB, flach).
 *
 *   (D) LABYRINTH-CACHE OHNE PASSWORT. Im Livelauf lag auf cru3l_l4byr1nth
 *       dauerhaft ein Cache, den niemand oeffnen konnte: das Passwort kannte nur
 *       der Laeufer, der das Lab damals geloest hat, und es war mit seinem Prozess
 *       verloren. Der Laeufer holt sich jetzt beides neu — auf einem geloesten Lab
 *       gibt ein beliebiger Zug sofort Success samt Passwort zurueck
 *       (labyrinth.ts:267-273) und bindet die Session an SEINE PID. Er ist damit
 *       der einzige Prozess, der den Cache ernten kann, und wird dafuer gestartet.
 *
 *   (E) RUECKSTAU MIT GB JE SERVER. Die Gesamtsumme allein war nicht deutbar: sie
 *       waechst auch im Normalbetrieb, weil jeder neu erschlossene Server seinen
 *       eigenen Fremdblock mitbringt (ramblock.ts, getRamBlock). Im Livelauf stieg
 *       sie von 144 auf 310 GB, gleichzeitig aber von 47 auf 64 Server — also etwa
 *       gleichbleibend je Server. Erst der Quotient zeigt echten Stillstand.
 *
 * v4.0.2 — VIER FIXES AUS DEM ZWEITEN LIVELAUF (Log 16./17.08.).
 *   Fortschritt war sichtbar (Abdeckung 17-23 % -> 30 %, 13 Roamer), aber die
 *   Aussaat-Spalte wuchs wieder (3 -> 14) und der Fremdblock von 148 auf 228 GB.
 *
 *   (A) REGRESSION AUS v4.0.1: spread() raeumte den Fremdblock nicht mehr.
 *       Die neu eingebaute RAM-Diagnose stand VOR der Block-Behandlung und kehrte
 *       mit return false zurueck. Ein frisch geknackter Darknet-Server haelt aber
 *       fast seinen gesamten Speicher als blockedRam beim Vorbesitzer (ramblock.ts,
 *       getRamBlock) — die Pruefung griff also IMMER, und genau der RODE-Op, der
 *       diesen Block raeumt, wurde nie gestartet. Jetzt: erst roden, dann ueber zu
 *       wenig Platz klagen. Die RAM-Meldung nennt zusaetzlich die Serverkapazitaet
 *       und den echten Bedarf (getScriptRam statt geratener 9 GB).
 *
 *   (B) DER FERN-RODE-OP NAHM ALLEN RAM. Er lief mit maxThreads ohne Reserve —
 *       derselbe Fehler, der in manageBlock schon behoben war. Mit mehr als einem
 *       geknackten Nachbarn blieb fuer den zweiten Block nie Platz ("Roden nicht
 *       startbar: RAM knapp"). Jetzt Reserve plus Threaddeckel
 *       (SPREAD_RODE_THREADS), und eine ausdrueckliche Duplikatpruefung: das
 *       preventDuplicates von runDnetOp greift nur bei identischen Argumenten, die
 *       Iterationszahl wird aber dynamisch berechnet.
 *
 *   (C) MERKLISTEN WUCHSEN UNBEGRENZT. PENDING_SPREAD, SESSION_WARNED und
 *       CRACK_STARTED behielten Hosts, die durch Mutation gar keine Nachbarn mehr
 *       sind (NetworkMovement.ts trennt Verbindungen und verschiebt Server). Die
 *       Aussaat-Spalte stieg dadurch von 3 auf 14, ohne dass mehr offen war — die
 *       Zahl log. Jetzt werden sie jede Runde auf die aktuelle Nachbarschaft
 *       beschraenkt.
 *
 *   (D) VERALTETE STATUSMELDUNGEN IM DAEMON. pending und noSession wurden nur
 *       durch eine Gegenmeldung geleert; laeuft auf einem Host inzwischen ein
 *       Roamer, versucht niemand mehr ein spread — die Meldung blieb ewig stehen.
 *       Im Log stand u1tr4.o4sis gleichzeitig als Roamer-Host UND als "geknackt,
 *       aber kein Roamer drauf". Der Daemon kehrt sie jetzt gegen aliveRoamers und
 *       die Inventur aus.
 *
 * v4.0.1 — DREI FIXES AUS DEM ERSTEN LIVELAUF (Log 12.08., 38k Charisma):
 *
 *   (A) PASSWOERTER KAMEN NIE BEIM ROAMER AN — Folgefehler des v4.0-Umbaus.
 *       Der Knack-Op legt jedes Passwort in schwarm-dnet-manual.txt ab. Der Roamer
 *       las diese Datei aber nur EINMAL beim Start: in v3.14 geschah das Nachlesen
 *       als Nebeneffekt der Cracker-Schleife (assembleCandidates brauchte die Liste
 *       jede Runde), und beim Auslagern des Crackers ist der Aufruf mit
 *       verschwunden. Ein Passwort, das NACH dem Start gefunden wurde, erreichte
 *       PWDB also nie — und ohne Passwort keine Session, ohne Session
 *       (NetscriptFunctions.ts:636/761) kein spread und keine Fern-Ernte.
 *       Im Log genau dieses Bild: Knack-Ops meldeten Erfolge (6 von 14), waehrend
 *       PENDING_SPREAD von 16 auf 22 wuchs, die Abdeckung bei 17-23 % stand und
 *       fuenf Hosts als "Passwort unbekannt" gemeldet wurden — dieselben, auf denen
 *       gerade Knack-Ops liefen. Jetzt wird die Datei jede Runde nachgelesen
 *       (ns.read = 0 GB).
 *
 *   (B) ZOMBIE-KNACK-OPS in der Anzeige. crackOps wurde nur durch eine
 *       Abschlussmeldung geleert. Stirbt ein Op ohne Meldung (killall, Mutation
 *       toetet die Prozesse eines Servers, Ausnahme vor dem ersten tell), blieb der
 *       Eintrag stehen. Das Log zeigte 8 "laufende" Ops, deren Liste sich ueber
 *       31 s nicht bewegte — bei 38k Charisma faellt ein ZeroLogon aber in
 *       Millisekunden. Jetzt wird gegen ns.ps abgeglichen.
 *
 *   (C) IRREFUEHRENDE spread-MELDUNG. "exec abgelehnt trotz Session und freiem RAM"
 *       behauptete etwas, das nie gemessen wurde — geprueft war nur der Fremdblock.
 *       Ein Ziel kann durch eigene Cache-Ops (je 3,6 GB) voll sein. Jetzt steht der
 *       echte freie RAM des Ziels in der Meldung, und ein fehlgeschlagenes scp wird
 *       als solches benannt.
 *
 * v4.0 — WARUM DAS DARKNET ALLES LIEGEN LIESS. Sechs Ursachen, alle am
 *   TypeScript-Quellcode belegt. Die erste erklaert den Grossteil.
 *
 *   (1) DER CRACKER HAT ALLES ANDERE VERHUNGERT.
 *       ATTEMPT_BUDGET stand auf 150 — PRO NACHBAR UND RUNDE — und das Knacken
 *       war Schritt 1 der Roamer-Schleife. Ein Auth-Versuch kostet echte
 *       Spielzeit (effects.ts:60-90):
 *         850 ms * (5*chaRequired + (difficulty+1)*100) / (charisma + 150)
 *       mal underleveledFactor = 1,5 + (chaRequired+50)/(charisma+50), wenn das
 *       eigene Charisma unter dem verlangten liegt; heartbleed kostet zusaetzlich
 *       das 1,5-fache. Bei difficulty 10, chaRequired 200 und Charisma 500 sind
 *       das ~2,7 s je Versuch, also rund SIEBEN MINUTEN fuer EINEN Nachbarn.
 *       Solange lief kein Cache, kein Contract, kein Roden, keine Aussaat.
 *       Ein unloesbares Feedback-Raetsel verbrannte das Budget jede Runde neu;
 *       PARKED griff erst NACH der Erschoepfung.
 *       BEHOBEN: Der Cracker ist ein EIGENER PAYLOAD (schwarm-crack.js), ein
 *       Prozess je Ziel. Der Roamer bewertet nur noch und startet Ops.
 *       Zwingend, weil netscriptDelay (NetscriptHelpers.tsx:466-479) den Timer in
 *       EINEM Feld je WorkerScript haelt — parallele Auth in einem Prozess ist
 *       nicht moeglich. Nebengewinn: authenticate liest die Threadzahl des
 *       Aufrufers (Darknet.ts:125) und rechnet threadsFactor = 1/(1+0,2*(t-1)),
 *       Threads machen also JEDEN Versuch schneller. Der Roamer lief mit 1.
 *
 *   (2) `ns.print && 0;` IN parseMsg WARF BEI JEDER LAB-ERNTE.
 *       parseMsg hat kein ns im Scope (das ist der Parameter von main). Jede
 *       LABCACHEOK-Meldung erzeugte einen ReferenceError, der aus drainTelemetry
 *       ins Runden-catch flog. Folge: in DIESER Runde entfielen Aussaat,
 *       healthScan, Lab-Mandat, watchLabs, Contract-Solver, Manual-Verteilung,
 *       Status UND Log vollstaendig — der Daemon setzte genau dann aus, wenn das
 *       Labyrinth (der Pfad zur Red Pill) etwas geerntet hatte.
 *       BEHOBEN: Zeile entfernt; ausserdem hat jetzt JEDER Schritt sein eigenes
 *       catch, ein Wurf kann nie mehr die ganze Runde mitnehmen.
 *
 *   (3) DER CACHE-ZWEITVERSUCH ZAHLTE DIE BELOHNUNG, LOESCHTE ABER NICHTS.
 *       openCache (Darknet.ts:321-331) prueft mit dem AUFGELOESTEN Pfad
 *       (resolveCacheFilePath -> resolveFilePath streift ein fuehrendes "/" ab,
 *       FilePath.ts:60-63), entfernt den Eintrag aber mit dem ROHEN String:
 *         server.caches = server.caches.filter(c => c !== fileName)
 *       Bei "/x.cache" passt die Pruefung, das Loeschen greift nicht —
 *       getRewardFromCache laeuft trotzdem. Genau das tat harvestServer im
 *       zweiten Anlauf ("die andere Pfadform probieren"): Belohnung kassiert,
 *       Datei bleibt liegen, unsere Weltzustandspruefung meldet Fehlschlag, nach
 *       drei Anlaeufen war der Cache dauerhaft abgeschrieben. DAS war die Halde.
 *       BEHOBEN: immer exakt der ns.ls-String.
 *
 *   (4) ALLE MERKLISTEN WAREN EINWEG-RIEGEL. OPENED (Set), CCT_SEEN (Set) und
 *       das einmal kippende RODED schrieben Misserfolge fuer die Prozesslebenszeit
 *       fest — auch wenn der Fehlschlag nur an fehlendem RAM lag. Und der Daemon
 *       loeschte cctHosts beim Solver-START statt nach Erfolg: ein Contract, dessen
 *       Typ der Solver nicht kennt, war fuer immer aus der Liste.
 *       BEHOBEN: Fristen statt Endstationen; die Warteliste raeumt die Inventur
 *       erst, wenn die .cct-Datei wirklich verschwunden ist.
 *
 *   (5) DER DAEMON NUTZTE SEINE KOSTENLOSE FERNSICHT NICHT.
 *       ns.ls listet Caches und .cct auch von Darknet-Servern
 *       (NetscriptFunctions.ts:839-846 — nur Existenzpruefung, KEINE Session-,
 *       Admin- oder Verbindungspruefung), ns.dnet.getBlockedRam kostet 0 GB.
 *       Trotzdem erfuhr der Daemon von einem Contract nur durch eine
 *       Roamer-Meldung — obwohl Contracts gar keinen Roamer brauchen
 *       (codingcontract.* nehmen alle einen host-Parameter).
 *       NEU: Fern-Inventur (takeInventory) als Grundlage fuer Auftragsvergabe,
 *       Rueckstau-Anzeige, Kahlschlag-Ausloesung und Kartenpflege.
 *
 *   (6) DIE KARTE WURDE NIE AUSGEKEHRT. Mutation loescht bis zu 4 Server je Tick,
 *       verschiebt 3 und trennt mit p=0,5 ALLE Verbindungen eines Servers
 *       (NetworkMovement.ts:45-190). Geloeschte Server landen in offlineServers,
 *       ns.ls liefert dann eine leere Liste statt zu werfen — tote Hostnamen
 *       blieben also fuer immer stehen. "mapped" und "coverage" waren aufgeblaeht,
 *       healthScan pingte Geister.
 *       BEHOBEN: dreimal leer gesehen -> raus aus der Karte.
 *
 *   WEITERES in v4.0:
 *     - LEICHT VOR SCHWER: targetCost bewertet jedes Ziel mit der ECHTEN
 *       Engine-Wartezeit (Charisma-Malus, difficulty) mal der erwarteten
 *       Versuchszahl des Modells (MODEL_EFFORT, aus den jeweiligen Loesern
 *       abgeleitet). Triviale Server (ZeroLogon: ein Versuch) kommen damit
 *       garantiert vor KingOfTheHill (~150 Versuche).
 *     - BREITE VOR TIEFE: je offenes Ziel ein Op; Threads erst, wenn nichts
 *       anderes offen ist (ein zweiter Op bringt das Doppelte, 2 Threads nur
 *       1,2-fach).
 *     - PHISHING ZULETZT: es laeuft erst, wenn der eigene Block geraeumt ist,
 *       keine Caches offen sind, kein Knack-Op laeuft und kein Nachbar mehr
 *       ungeknackt oder unbesiedelt ist. Es ist die QUELLE neuer Caches
 *       (cacheFiles.ts legt bei jedem Treffer eine ".d.cache" an) und belegte
 *       vorher allen freien RAM — der Server erstickte am eigenen Ertrag.
 *     - AUFTRAEGE auf Port 34 (peek): der Daemon kennt Inventar und Topologie und
 *       priorisiert Labyrinth -> Fremdbloecke -> Caches. Die Roamer bleiben
 *       selbststaendig; ein Auftrag ohne Eintrag fuer sie aendert nichts. Jeder
 *       Auftrag traegt eine Frist (Totmannschalter): stirbt der Daemon, faellt
 *       alles von selbst in den Normalbetrieb.
 *     - KAHLSCHLAG: ab SWEEP_BACKLOG offenen Posten automatisch, per
 *       `run SCHWARM-DARKNET.js --sweep` auf Wunsch. Phishing ruht, Cache-Deckel
 *       hoch, grosse Bloecke auch ohne freien Stasis-Platz. Zeitlich begrenzt.
 *     - NACHSAAT auch abseits von darkweb: ns.exec ins Darknet verlangt Session
 *       UND Direktverbindung (NetscriptFunctions.ts:636), ausser bei Backdoor
 *       (backdoorBypasses). Genau dieser Pfad wird jetzt genutzt.
 *     - Der 22-GB-Solver wandert nicht mehr mit jedem spread mit (er laeuft seit
 *       v3.8 nur auf home), ensureSession-Rueckgabewerte werden ausgewertet, und
 *       Phishing wird nicht mehr fuer einen einzelnen Thread neu aufgezogen.
 *
 * ARCHITEKTUR (drei Payloads, eine Quelle je Aufgabe):
 *   SCHWARM-DARKNET.js   Daemon auf home: Karte, Inventur, Auftraege, Aussaat,
 *                        Lab-Mandat, Contract-Solver, Status/Log.
 *   schwarm-roamer.js    Exekutive je Server: ernten, roden, besiedeln, melden,
 *                        Knack-Ops und Lab-Laeufer starten. Wartet nie lange.
 *   schwarm-crack.js     Passwortknacker, ein Prozess je Ziel, mehrere Threads.
 *   schwarm-lab.js       Labyrinth-Laeufer (Position haengt an der PID).
 *   schwarm-solver.js    Contract-Solver aus SCHWARM-PAYLOADS, laeuft NUR auf home.
 *
 * PORTS: 19 Telemetrie (FIFO, Roamer/Ops -> Daemon), 20 Status (peek, Daemon ->
 *   Queen/Dashboard/DIAG), 21 Promote (Trader -> Roamer, peek), 34 Auftraege
 *   (peek, Daemon -> Roamer, NEU in v4.0).
 *
 * START:  run SCHWARM-DARKNET.js [--sweep]
 * RAM: gering (IPC + scp/exec + materialize). Roamer/Knacker/Lab laufen auf den
 *   Darknet-Servern, der Contract-Solver auf home. host home (pinHost in der Registry).
 */

import {
    decodePayload, SCHWARM_PORTS, injectPorts,
    readOut, writeOutField, pushIn, drainIn, readInfoBlock,
} from "SCHWARM-HELPERS.js";
import { materialize } from "SCHWARM-PAYLOADS.js";

/**
 * Hat Phishing in dieser BitNode Vorrang? (v4.2)
 *
 * JA, wenn es kein Darknet-Geld gibt. Dann bleibt als Ertrag nur Charisma-XP —
 * und Charisma ist der Multiplikator fuer jede andere Darknet-Op:
 *   memoryReallocation  charismaFactor = 1 + cha/100      (bei cha 3000: x31)
 *   promoteStock        (500 + cha)/500                   (bei cha 3000: x7)
 *   phishingAttack      max(10000 x 400/(400+cha), 200) ms
 *   Knack-Ops           underleveledFactor sinkt mit cha
 * Phishing wird damit vom Nebenprodukt zur Voraussetzung fuer alles andere.
 *
 * Quelle ist der bn-Block des INFO-Daemons (0 GB; ns.getBitNodeMultipliers
 * kostet 4 GB und wird bewusst nicht aufgerufen). Fehlt der Block, gilt "nein" —
 * konservativ, denn ein faelschlich hochgestuftes Phishing naehme den Knack-Ops
 * den RAM weg.
 */
/**
 * Modell-Statistik als eine kompakte Zeile fuer den Status-Port (v4.2).
 * Format je Eintrag:  modelId:ok/fail/todo/feedback/oVersuche
 * Getrennt durch Komma, absteigend nach Gesamtzahl, hoechstens zehn Eintraege.
 */
function modelDigest() {
    const rows = [...modelStats.entries()]
        .sort((a, b) => b[1].n - a[1].n)
        .slice(0, 10)
        .map(([id, s]) => {
            const avg = s.n > 0 ? Math.round(s.tries / s.n) : 0;
            return `${id}:${s.ok}/${s.fail}/${s.todo}/${s.feedback}/${avg}`;
        });
    return rows.length > 0 ? rows.join(",") : "-";
}

function phishPriority(ns) {
    try {
        const bn = readInfoBlock(ns, "bn", Infinity);
        const m = bn && bn.mults;
        if (!m || typeof m.DarknetMoneyMultiplier !== "number") return false;
        return m.DarknetMoneyMultiplier === 0;
    } catch (e) { return false; }
}

// ---- Konfiguration ----------------------------------------------------------
const NAVIGATOR = "DarkscapeNavigator.exe"; // Darknet-Zugang
const ROAMER = "schwarm-roamer.js";          // vom Daemon aus dem String materialisiert
const LAB = "schwarm-lab.js";                // NEU v3.7: Labyrinth-Laeufer
const CRACK = "schwarm-crack.js";            // NEU v4.0: Passwortknacker (ein Ziel je Prozess)
const SOLVER = "schwarm-solver.js";          // vom Daemon aus PAYLOADS materialisiert
const MANUAL = "schwarm-dnet-manual.txt";    // manuell eingetippte Passwoerter
const MAP_FILE = "schwarm-dnet-map.txt";     // Karte (Session-Cache, killall-fest)
const STAMP_FILE = "schwarm-dnet-reset.txt"; // v4.1: lastAugReset, gegen Geisterkarten
const FIRST_HOP = "darkweb";                 // immer authentifiziert + mit home verbunden
const LOOP_MS = 2000;
const SUMMARY_EVERY = 15;                    // lesbare Zusammenfassung alle N Runden
const MANUAL_EVERY = 10;                     // Manual-Datei alle N Runden spiegeln
const REDEPLOY_ON_START = true;              // bei Start den darkweb-Roamer neu ausrollen
// Die acht Labyrinth-Server tragen FESTE Hostnamen (SpecialServers.ts:13-20).
// Das ist der einzige Teil des Darknets, den der Daemon ohne Roamer ansprechen
// kann: ns.scan("darkweb") liefert nur home zurueck (NetworkGenerator.ts:125
// setzt serversOnNetwork explizit zurueck), die Darknet-Topologie ist also
// AUSSCHLIESSLICH ueber ns.dnet.probe() von einem Server vor Ort sichtbar.
// Bekannte Hostnamen lassen sich aber direkt mit scp/exec/ls ansprechen.
const LAB_HOSTS = ["th3_l4byr1nth", "cru3l_l4byr1nth", "m3rc1l3ss_l4byr1nth", "ub3r_l4byr1nth",
    "et3rn4l_l4byr1nth", "end13ss_l4byr1nth", "f1n4l_l4byr1nth", "b0nus_l4byr1nth"];
const LAB_HARVEST_EVERY = 5;                 // Labyrinth-Caches alle N Runden pruefen
const CACHE_OP = "/dnet-op-cache-lab.js";    // Wegwerf-Op, vom Daemon erzeugt
const HEALTH_EVERY = 8;                      // Lebenszeichen-Scan alle N Runden (~16 s)
const CCT_EVERY = 10;                        // Contract-Ernte alle N Runden (~20 s)
const CCT_BATCH = 12;                        // hoechstens so viele Hosts je Solver-Lauf

// ---- v4.0: Fern-Inventur, Auftragsvergabe, Kartenpflege ---------------------
// Der Daemon kann von home aus KOSTENLOS das ganze Darknet inventarisieren:
// ns.ls liefert auch fuer Darknet-Server die Dateiliste (NetscriptFunctions.ts:
// 839-846 — nur getServer + Existenzpruefung, KEINE Session-, Admin- oder
// Verbindungspruefung), und ns.dnet.getBlockedRam kostet 0 GB. Bis v3.14 wurde
// diese Sicht nicht genutzt: der Daemon erfuhr von einem Contract nur, wenn ein
// Roamer ihn meldete — obwohl Contracts ueberhaupt keinen Roamer brauchen.
const INVENTORY_EVERY = 6;      // Fern-Inventur alle N Runden (~12 s)
// Gueltigkeit eines Auftrags. Muss DEUTLICH ueber dem Inventur-Abstand liegen
// (INVENTORY_EVERY * LOOP_MS = 12 s), sonst laeuft die Frist zwischen zwei
// Vergaben ab und die Roamer fallen grundlos in den Normalbetrieb.
const ORDER_TTL_MS = 45000;
const SWEEP_MINUTES = 10;       // Dauer eines Kahlschlags (--sweep / Auto-Auslöser)
const SWEEP_BACKLOG = 25;       // ab so vielen offenen Posten Kahlschlag von selbst
const SWEEP_COOLDOWN_MS = 600000; // danach so lange kein neuer Auto-Kahlschlag
const GONE_LIMIT = 3;           // so oft leer gesehen -> aus der Karte werfen
const SEED_FANOUT = 3;          // so viele verwaiste Server je Runde nachsaeen
const REPORT_REST = 8;          // so viele Restposten im Log nennen

// ---- IPC ---------------------------------------------------------------------
//
// DNET_PORTS IST ERSATZLOS ENTFALLEN (v4.0).
//
// Diese Datei fuehrte eine EIGENE Port-Tabelle, und genau daraus ist die
// schlimmste Kollision des Schwarms entstanden: hier stand
//
//     const DNET_PORTS = { TELEMETRY: 19, STATUS: 20, ORDERS: 34 };
//     // "34 ist neu (v4.0) und war frei — die Registry endet bei 33"
//
// Die Registry endete zwar bei 33, aber der TRADER hatte sich 34 fuer seine
// Beeinflussungsziele genommen (SCHWARM-TRADER v1.4, ebenfalls als lokale
// Konstante). Beide Schreiber machten clear()+tryWrite() im Sekundentakt und
// haben sich gegenseitig ueberschrieben: der Dispatcher bekam DARKNETs
// Auftragszeile und scheiterte am JSON.parse, die Roamer bekamen die JSON-Liste
// des Traders und daraus keinen Auftrag. Im Livereport sichtbar als
// "manipZiele 6 -> —". Dasselbe war 2 Versionen vorher schon mit Port 19
// passiert.
//
// JETZT: eine einzige Tabelle (SCHWARM_PORTS in SCHWARM-HELPERS.js), und die
// Roamer/Lab/Crack-Payloads bekommen ihre Nummern von injectPorts() eingesetzt,
// statt sie zu spiegeln. Zwei Schreiber auf einem Ausgang sind damit kein
// Fluechtigkeitsfehler mehr, sondern strukturell ausgeschlossen.

/** Roamer/Ops -> Daemon (Eingang, FIFO). Eine Meldung oder null. */
function readTelemetry(ns) {
    const msgs = drainIn(ns, SCHWARM_PORTS.DNET_IN, 1);
    return msgs.length > 0 ? msgs[0] : null;
}
/** Daemon -> alle: Lage-Snapshot (Feld `status` im eigenen Ausgang). */
function publishStatus(ns, str) {
    return writeOutField(ns, SCHWARM_PORTS.DNET_OUT, "status", String(str));
}
/** Daemon -> Roamer: Arbeitsauftraege (Feld `orders` im eigenen Ausgang).
 *  Format siehe readOrders im Roamer. */
function publishOrders(ns, str) {
    return writeOutField(ns, SCHWARM_PORTS.DNET_OUT, "orders", String(str));
}

// ---- Payloads (self-contained, kodiert; siehe decodePayload in HELPERS) ------
//
// ==========================================================================
// WARNUNG — AB HIER BIS ZUM SCHLIESSENDEN BACKTICK IST ALLES EIN STRING
// ==========================================================================
// Der gesamte Roamer, samt aller Raetselloeser, liegt als Template-Literal in
// dieser Datei. Ein einzelner BACKTICK irgendwo darin — auch in einem
// Kommentar, auch um ein Wort herum wie in "das Feld `known`" — beendet das
// Literal, und der Rest der Datei wird als Code gelesen. Die Fehlermeldung
// zeigt dann auf eine voellig andere Stelle ("Unexpected identifier 'known'")
// und die uebliche Zeilen-Bisektion laeuft ins Leere, weil jedes Praefix ab
// hier ohnehin unvollstaendig ist.
//
// Passiert: v4.3, in einem Kommentar zu solveDivisibility. Und vorher schon
// einmal in SCHWARM-PAYLOADS.js (SRC_STANEK). Zweimal derselbe Griff.
//
// REGEL: in diesem Block Woerter in "doppelte Anfuehrungszeichen" setzen, nie
// in Backticks. Und ${ ebenso vermeiden — das oeffnet eine Einsetzung.
// ==========================================================================
const SRC_ROAMER = `/**
 * schwarm-roamer.js — Darknet-Exekutive (SELF-CONTAINED Payload, v3.7).
 *
 * v3.7 — RUECKBAU AUF "JEDER SERVER EIN ROAMER".
 *   Die Lebenszyklus-Ideen aus v2/v3.4/v3.5 haben sich gegenseitig blockiert:
 *   isOccupied zaehlte seit v2 auch dnet-Ops mit, und ab v3.5 setzte der Roamer
 *   selbst auf jeden geknackten Nachbarn einen Phish-Op. Damit galt jeder
 *   Nachbar sofort als "versorgt" und bekam NIE einen Roamer — kein Cache, kein
 *   Contract, kein Promote und vor allem keine Weiterverbreitung von dort aus.
 *   Die Erschliessung endete bei der ersten Generation.
 *   Dazu kam: der Phish-Op laeuft seit v2 endlos und ensurePhishing belegt allen
 *   freien RAM. Der einzige Pfad, der davor KEIN killPhishing gerufen hat, war
 *   ausgerechnet der neue Nachbar-RODE-Op aus v3.2 — auf einem fertigen Server
 *   war also nie Platz, um den Fremdblock eines frisch geknackten Nachbarn zu
 *   raeumen. Zweite Sackgasse.
 *
 *   Deshalb:
 *     - isOccupied prueft wieder NUR den Roamer.
 *     - ensureNeighborPhishing entfernt (der Roamer bringt sein Phishing mit).
 *     - killPhishing vor dem RODE-Op in spread(); Threadzahl erst DANACH.
 *     - RODE-Op-Datei pro Ziel (/dnet-op-rode-<host>.js). Vorher blockierten sich
 *       eigener Block und Nachbarblock ueber preventDuplicates gegenseitig.
 *     - Der gesamte Ruhestands-Apparat ist raus (RETIRE_*, retireIfDone,
 *       frontierOpen, TRIES, neighborHasRoamer, roamerCost, RELAUNCH-Op).
 *     - COMMON_PW vollstaendig (93 Eintraege aus dictionaryData.ts).
 *
 *   LABYRINTH laeuft ab jetzt in einem EIGENEN Prozess (schwarm-lab.js). Grund:
 *   die Position haengt an der PID (DarknetState.labLocations[pid]); im Roamer
 *   blockierte der Loeser die Schleife hunderte Zuege lang. Der Roamer startet
 *   den Laeufer nur noch und arbeitet weiter.
 *
 * Loest .cct ueber den PAYLOADS-Solver (schwarm-solver.js, local-Modus).
 * Teure dnet-Calls laufen ueber Wegwerf-Op-Skripte, damit ihr RAM nicht dauerhaft
 * im Roamer haengt.
 */

// ============================ INLINE-LIB (self-contained) ============================
const STORM_SEED_FILE = "STORM_SEED.exe";

/** Op-Typen fuer den Dispatcher. */
const DNET_OPS = {
    RODE: "rode",         // memoryReallocation in Schleife bis Block leer (nimmt ein ZIEL)
    STASIS: "stasis",     // setStasisLink(true)
    UNSTASIS: "unstasis", // setStasisLink(false)
    PHISH: "phish",       // phishingAttack endlos
    CACHE: "cache",       // openCache(filename)
    PROMOTE: "promote",   // promoteStock(symbol)
    MIGRATE: "migrate",   // induceServerMigration(target)
    // v3.8: SOLVE ENTFERNT. Der Contract-Solver braucht laut RamCostGenerator
    // 1,6 + attempt 10 + getContractType 5 + getData 5 + scan/ls 0,4 = 22,0 GB.
    // getMaxRam gibt Darknet-Servern bis Tiefe 5 aber genau 16 GB, wovon der
    // Roamer 8,85 belegt — lokal loesen war nie moeglich. codingcontract.attempt
    // nimmt einen host-Parameter: der Daemon loest sie jetzt auf home.
};
/** dnet-Antwortcodes (aus DarkNet/Enums.ts gespiegelt). */
const DNET_CODE = {
    SUCCESS: 200,
    DIRECT_CONNECTION_REQUIRED: 351,
    AUTH_FAILURE: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    REQUEST_TIMEOUT: 408,
    NOT_ENOUGH_CHARISMA: 451,
    STASIS_LINK_LIMIT: 453,
    NO_BLOCK_RAM: 454,
    PHISHING_FAILED: 455,
    SERVICE_UNAVAILABLE: 503,
};

/** Modell-IDs (Werte = die getarnten Namen aus getServerDetails().modelId). */
const DNET_MODELS = {
    EchoVuln: "DeskMemo_3.1",
    SortedEchoVuln: "PHP 5.4",
    NoPassword: "ZeroLogon",
    Captcha: "CloudBlare(tm)",
    DefaultPassword: "FreshInstall_1.0",
    BufferOverflow: "Pr0verFl0",
    MastermindHint: "DeepGreen",
    TimingAttack: "2G_cellular",
    LargestPrimeFactor: "PrimeTime 2",
    RomanNumeral: "BellaCuore",
    DogNames: "Laika4",
    GuessNumber: "AccountsManager_4.2",
    CommonPasswordDictionary: "TopPass",
    EUCountryDictionary: "EuroZone Free",
    Yesn_t: "NIL",
    BinaryEncodedFeedback: "110100100",
    SpiceLevel: "RateMyPix.Auth",
    ConvertToBase10: "OctantVoxel",
    parsedExpression: "MathML",
    divisibilityTest: "Factori-Os",
    tripleModulo: "BigMo%od",
    globalMaxima: "KingOfTheHill",
    packetSniffer: "OpenWebAccessPoint",
    encryptedPassword: "OrdoXenos",
    labyrinth: "(The Labyrinth)",
};

// PORTNUMMERN KOMMEN VON AUSSEN (v4.0). Die Marke darunter ersetzt
// injectPorts() beim Materialisieren durch die zentrale Tabelle aus
// SCHWARM-HELPERS.js. Vorher stand hier eine eigene DNET_PORTS-Tabelle mit
// handvergebenen Nummern — die hat sich mit dem TRADER auf Port 34 ueberkreuzt
// (und zwei Versionen vorher schon einmal auf 19). Ein Payload hat keine
// eigenen Portnummern mehr.
/*__PORTS__*/

/** Ausgang des Daemons lesen ({} wenn leer/defekt). Felder: status, orders. */
function readDnetOut(ns) {
    try {
        const v = ns.peek(SCHWARM_PORTS.DNET_OUT);
        if (v === "NULL PORT DATA" || typeof v !== "string" || !v.length) return {};
        const o = JSON.parse(v);
        return (o && typeof o === "object") ? o : {};
    } catch (e) { return {}; }
}
/** Ein Feld aus dem Ausgang des TRADERs lesen ({} wenn leer/defekt). */
function readTraderOut(ns) {
    try {
        const v = ns.peek(SCHWARM_PORTS.TRADER_OUT);
        if (v === "NULL PORT DATA" || typeof v !== "string" || !v.length) return {};
        const o = JSON.parse(v);
        return (o && typeof o === "object") ? o : {};
    } catch (e) { return {}; }
}

// =============================================================================
// 2. CRACKER — AUSGELAGERT (v4.0)
// =============================================================================
//
// Woerterbuecher, Mathe-Helfer, die crack()-Registry und alle Feedback-Loeser
// stehen ab v4.0 in schwarm-crack.js. Grund (drei Engine-Belege):
//
//   1. netscriptDelay (NetscriptHelpers.tsx:466-479) haelt den laufenden Timer in
//      EINEM Feld je WorkerScript (ws.delay/ws.delayReject). Zwei gleichzeitige
//      Auth-Aufrufe im selben Prozess ueberschreiben sich — der Roamer konnte
//      Nachbarn also nur streng NACHEINANDER knacken. Da jeder Versuch echte
//      Spielzeit kostet (effects.ts:60-90), blockierte ein einziges schweres Ziel
//      die ganze Runde: Caches, Contracts, Roden und Aussaat kamen nicht dran.
//      Genau das war im Spiel zu sehen.
//
//   2. authenticate liest die Threadzahl des aufrufenden Skripts (Darknet.ts:125)
//      und rechnet threadsFactor = 1/(1 + 0,2*(threads-1)) in die Wartezeit. Der
//      Roamer lief mit 1 Thread; als eigener Op laeuft der Knacker mit mehreren
//      und ist damit ein Vielfaches schneller.
//
//   3. Eine Quelle. Der Cracker liegt NUR in schwarm-crack.js — eine zweite Kopie
//      im Roamer waere beim ersten neuen Modell auseinandergelaufen.
//
// Der Roamer behaelt aus dem alten Block nur DNET_MODELS (Labyrinth-Erkennung)
// und DNET_CODE (NO_BLOCK_RAM im RODE-Op). Er zahlt dadurch kein authenticate
// (0,4) und kein heartbleed (0,6) mehr.
// =============================================================================
// 5. OP-DISPATCHER
// =============================================================================

function opRamCost(op) {
    const calls = {};
    calls[DNET_OPS.RODE] = 1;
    calls[DNET_OPS.STASIS] = 12;
    calls[DNET_OPS.UNSTASIS] = 12;
    calls[DNET_OPS.PHISH] = 2;
    calls[DNET_OPS.CACHE] = 2;
    calls[DNET_OPS.PROMOTE] = 2;
    calls[DNET_OPS.MIGRATE] = 4;
    return 1.6 + (calls[op] || 0);
}

/**
 * Dateiname eines Ops.
 *
 * v3.7 gab nur RODE einen Namen je Ziel. v3.8 zieht das auf ALLE Ops mit
 * Argument durch — der Ausloeser war CACHE: runDnetOp laeuft mit
 * preventDuplicates, also konnte pro Runde nur EIN Cache geoeffnet werden.
 * Da Phishing laufend neue Caches erzeugt (cacheFiles.ts: addCacheToServer bei
 * jedem erfolgreichen phishingAttack, Endung ".d.cache"), entstehen sie
 * schneller, als ein einzelner Op sie abarbeiten kann.
 * PHISH bleibt absichtlich ohne Argument-Suffix: davon soll es je Server genau
 * einen Prozessverbund geben.
 */
function opFileName(op, arg) {
    if (op === DNET_OPS.PHISH || arg === undefined || arg === null || arg === "") {
        return "/dnet-op-" + op + ".js";
    }
    return "/dnet-op-" + op + "-" + String(arg).replace(/[^A-Za-z0-9_.-]/g, "_") + ".js";
}

function buildOpScript(op) {
    const P = SCHWARM_PORTS.DNET_IN;
    // ns.args: [arg, iterations] — Bedeutung je Op. Threads kommen ueber run().
    const head = __SCHWARM_BT__/** SCHWARM dnet-op (auto-generiert). */
export async function main(ns){
  const arg = ns.args[0]; const iter = Number(ns.args[1] ?? 1); const host = ns.getHostname();
  // RODE nimmt ein ZIEL: memoryReallocation(host) verlangt laut Darknet.ts nur
  // requireDirectConnection + requireAdminRights, der Block eines NACHBARN laesst
  // sich also von hier aus raeumen.
  const target = (typeof arg === "string" && arg) ? arg : host;
  const tell = (m) => { try { ns.getPortHandle(__SCHWARM_DC__P}).tryWrite(host + "\\u001f" + m); } catch(e){} };
  try {__SCHWARM_BT__;
    const tail = __SCHWARM_BT__
  } catch(e){ tell("__SCHWARM_DC__op.toUpperCase()}:ERR:" + e); }
}__SCHWARM_BT__;

    let body = "";
    switch (op) {
        case DNET_OPS.RODE:
            body = __SCHWARM_BT__
    let last = null;
    for (let i = 0; i < iter; i++){
      last = await ns.dnet.memoryReallocation(target);
      if (!last || last.code === __SCHWARM_DC__DNET_CODE.NO_BLOCK_RAM}) break;
      if (ns.dnet.getBlockedRam(target) <= 0) break;
    }
    tell("RODE:DONE:" + target + ":" + (last ? last.code : "none"));__SCHWARM_BT__;
            break;
        case DNET_OPS.STASIS:
            body = __SCHWARM_BT__
    const r = await ns.dnet.setStasisLink(true);
    tell("STASIS:" + (r && r.success ? "OK" : "FAIL:" + (r ? r.code : "none")));__SCHWARM_BT__;
            break;
        case DNET_OPS.UNSTASIS:
            body = __SCHWARM_BT__
    const r = await ns.dnet.setStasisLink(false);
    tell("UNSTASIS:" + (r && r.success ? "OK" : "FAIL:" + (r ? r.code : "none")));__SCHWARM_BT__;
            break;
        case DNET_OPS.PHISH:
            // ENDLOS: der Phisher ist der Dauerertrag des Servers. "iter" wird
            // ignoriert; Aufrufer duerfen es weiter mitgeben.
            body = __SCHWARM_BT__
    let ok = 0, n = 0;
    while (true){
      const r = await ns.dnet.phishingAttack();
      n++; if (r && r.success) ok++;
      if (n % 200 === 0) tell("PHISH:ALIVE:" + ok + "/" + n);
    }__SCHWARM_BT__;
            break;
        case DNET_OPS.CACHE:
            body = __SCHWARM_BT__
    const r = ns.dnet.openCache(String(arg), true);
    tell("CACHE:" + (r && r.success ? "OK" : "FAIL"));__SCHWARM_BT__;
            break;
        case DNET_OPS.PROMOTE:
            body = __SCHWARM_BT__
    for (let i = 0; i < iter; i++){ await ns.dnet.promoteStock(String(arg)); }
    tell("PROMOTE:DONE:" + arg);__SCHWARM_BT__;
            break;
        case DNET_OPS.MIGRATE:
            body = __SCHWARM_BT__
    let last = null;
    for (let i = 0; i < iter; i++){ last = await ns.dnet.induceServerMigration(String(arg)); }
    tell("MIGRATE:DONE:" + arg);__SCHWARM_BT__;
            break;
        default:
            body = __SCHWARM_BT__
    tell("ERR:unbekannte Op");__SCHWARM_BT__;
    }
    return head + body + tail;
}

/**
 * Startet eine teure Op als Mini-Skript LOKAL auf dem aktuellen Server.
 * Der teure dnet-Call steckt nur im erzeugten Skript, nicht im Roamer.
 */
function runDnetOp(ns, op, opts) {
    const o = opts || {};
    try {
        const threads = Math.max(1, Math.floor(o.threads || 1));
        const need = opRamCost(op) * threads;
        const host = ns.getHostname();
        const free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        if (free < need) {
            return { ok: false, pid: 0, reason: "RAM knapp: " + free.toFixed(1) + "/" + need.toFixed(1) + " GB" };
        }
        const file = opFileName(op, o.name !== undefined ? o.name : o.arg);
        ns.write(file, buildOpScript(op), "w");
        const pid = ns.run(file, { threads: threads, temporary: true, preventDuplicates: true },
            o.arg === undefined ? "" : o.arg, o.iterations === undefined ? 1 : o.iterations);
        return { ok: pid > 0, pid: pid, reason: pid > 0 ? undefined : "run fehlgeschlagen (RAM/Duplikat?)" };
    } catch (e) {
        return { ok: false, pid: 0, reason: String(e) };
    }
}

function pushTelemetry(ns, msg) {
    try { return ns.getPortHandle(SCHWARM_PORTS.DNET_IN).tryWrite(String(msg)); }
    catch (e) { return false; }
}

// ============================ ROAMER-LOGIK ============================

// v4.0: SOLVER_FILE ist ENTFALLEN. Der Solver kostet 22 GB und laeuft seit v3.8
// nur auf home; der Roamer hat ihn trotzdem bei jedem spread mitkopiert.
const LAB_FILE = "schwarm-lab.js";        // vom Daemon materialisiert, hier weitergereicht
const CRACK_FILE = "schwarm-crack.js";    // v4.0: der Knacker, eigener Prozess je Ziel
const CRACK_RAM = 3.0;                    // Basis 1,6 + auth 0,4 + heartbleed 0,6
                                          // + getServerDetails 0,1 + ls 0,2 (je Thread)
const CRACK_OPS_MAX = 4;                  // gleichzeitige Knack-Ops je Server
const CRACK_THREADS_MAX = 8;              // Threads je Op, wenn Platz uebrig ist
const CRACK_RETRY = 30;                   // Runden bis zum naechsten Anlauf je Ziel
// Threaddeckel fuer das Fern-Roden eines Nachbarn. Ohne Deckel belegt ein einziger
// Op den ganzen Server und blockiert Knack-Ops, Cache-Ops und das Roden weiterer
// Nachbarn. 8 Threads raeumen laut ramblock.ts bereits das Achtfache je Aufruf.
const SPREAD_RODE_THREADS = 8;
// Kostendeckel. targetCost liefert die erwartete Gesamtzeit in Einheiten von
// 850 ms (der baseTime aus effects.ts:72). 120 entspricht also gut 100 Sekunden.
// Ziele darueber gelten als teuer und bekommen NUR einen Op, und nur wenn kein
// billiges Ziel mehr offen ist — genau das verhindert, dass ein
// KingOtHeHill-Server (~150 Versuche) oder ein Ziel weit ueber dem eigenen
// Charisma alle Slots belegt, waehrend nebenan triviale Server warten.
const CRACK_COST_SOFT = 120;
const CRACK_HEAVY_MAX = 1;                // gleichzeitige Ops auf teuren Zielen
// v4.1 — PASSWOERTER SIND LOKAL, NICHT GLOBAL.
//
// Bis v4.0.2 wanderte jedes gefundene Passwort in die netzweit verteilte
// schwarm-dnet-manual.txt (writeManual + scp bei jedem spread + Verteilung durch
// den Daemon). Das hatte KEINEN mechanischen Nutzen: ein Passwort braucht nur, wer
// ns.dnet.connectToSession(nachbar, pw) aufrufen will — Sessions haengen an der PID
// (authentication.ts:206) —, und das ist immer ein Prozess auf DEMSELBEN Server wie
// der Knack-Op, der es gefunden hat. Fuer den eigenen Server ist man automatisch
// authentifiziert (offlineServerHandling.ts:99); die Passwoerter seiner Nachbarn
// erarbeitet jeder Roamer selbst vor Ort.
//
// Die globale Liste war dagegen aktiv schaedlich:
//   - prestigeDarknetState (DarknetState.ts:84-101, bei JEDEM Aug-Install ueber
//     Prestige.ts:76) baut das Netz komplett neu auf. Alle gespeicherten
//     Passwoerter sind danach wertlos, die Datei ueberlebt den Reset aber
//     (ServerHelpers.ts:224 leert textFiles nicht) -> sie sammelt mit jedem
//     BitNode eine Ladung Muell, die nur Fehlversuche produziert.
//   - Mehrere Prozesse schrieben dieselbe Datei (last-write-wins).
//   - Und der Umweg selbst war die Ursache des v4.0-Bugs: weil das Nachlesen ein
//     eigener Schritt war, ging er beim Umbau verloren.
//
// Jetzt: PW_FILE ist streng lokal (ein Schreiber, ein Leser, kein scp). MANUAL ist
// fuer Skripte NUR NOCH LESBAR und enthaelt ausschliesslich, was der Spieler selbst
// eingetragen hat — das gilt netzweit und wird weiter verteilt.
const PW_FILE = "dnet-pw.txt";            // lokal: Knack-Op -> Roamer
const MANUAL = "schwarm-dnet-manual.txt"; // global, NUR LESEN (Spielereingaben)
const PHISH_ON = true;
const RODE_ON = true;
const STASIS_ON = true;
const SOLVE_ON = true;      // lokale .cct VOR dem Roden loesen
const PROMOTE_ON = true;    // promoten NUR, wenn der Trader Symbole meldet
// v4.2: Ladungen zerfallen je Marktzyklus (450 s) um den Faktor 0,4
// (effects.ts:216 scaleDarknetVolatilityIncreases). Der Bedarf ist also
// DAUERHAFT, nicht einmalig. 20 Iterationen bei ~1,3 s je Aufruf (cha 3000)
// sind 26 s Arbeit je Op — danach stand der Promoter still bis zur naechsten
// Runde. 120 Iterationen decken gut zweieinhalb Minuten am Stueck.
// v4.3: von 120 auf 60 zurueckgenommen. 120 Iterationen sind bei ~1,3 s je
// Aufruf rund 156 s Dauerbelegung — auf darkweb, dem Einstiegsserver mit dem
// knappsten RAM, blockiert das die Erschliessung zu lange. 60 decken gut eine
// Minute am Stueck; gegen den Zerfall (x0,4 je Marktzyklus, 450 s) reicht das,
// weil promoteSlots() im erschlossenen Netz wieder mehrere Ops zulaesst.
const PROMOTE_ITERS = 60;
// v4.2: Der Trader meldet bis zu PROMOTE_TOP_N Symbole; der Roamer nahm bisher
// nur das erste (split(",")[0]). Jetzt bedient EIN Roamer mehrere Symbole
// parallel, solange RAM da ist — die Ops sind mit 2 GB billig.
const PROMOTE_MAX_PARALLEL = 3;
// v4.2: Hoechstzahl gleichzeitiger Raeumungen fuer NACHBARN je Roamer.
// Bewusst klein: der eigene Server hat Vorrang, und jede Op belegt 1 GB + Basis.
const RODE_NEIGHBOR_MAX = 2;
const LAB_ON = true;        // Labyrinth-Laeufer starten, wenn ein Lab benachbart ist
const LOOP_MS = 2000;
const IDLE_MS = 8000;
const RODE_MAX_BLOCK = 256;   // GB: darueber gilt der Block als "gross" -> Stasis zuerst
const RODE_MAX_ITERS = 200;      // Untergrenze je Op-Start
const RODE_ITERS_MAX = 20000;    // Obergrenze (v3.8: Iterationen werden berechnet)
const BIG_RODE_ITERS = 2000;
const BIGBLOCK_RETRY = 40;       // Runden Pause, wenn alle Stasis-Plaetze belegt sind
const CACHE_MAX_TRIES = 3;       // Anlaeufe je Cache-Datei, dann aufgeben + melden
const CACHE_OPS_MAX = 2;         // gleichzeitige Cache-Ops je Server (v3.9)
const REMOTE_HARVEST = true;     // Caches auf Nachbarn ohne Roamer fernoeffnen (v3.10)
const SCAN_REPORT_EVERY = 5;     // Lagebericht des Roamers alle n Runden (v3.9)
const PHISH_ITERS = 50;       // nur noch Alt-Argument; der Phish-Op laeuft endlos
const SCRAPE_MAX_CANDS = 30;
const DEBUG_DUMP = true;
// v4.0: CRACK_MS und ATTEMPT_BUDGET sind ENTFALLEN. Sie waren Notbremsen gegen
// das Verhungern der Roamer-Runde durch den eigenen Cracker — der laeuft jetzt in
// eigenen Prozessen (schwarm-crack.js) und blockiert hier gar nichts mehr. Die
// Wanduhr steckt dort als RUN_MS.
const PARK_ROUNDS = 25;
const LOG_LINES_MAX = 200;    // MAX_LOG_LINES der Engine (packetSniffing.ts)
const PACKET_CANDS = 40;
const LAB_CLAIM_GRACE = 6;    // Runden ohne Mandat vom Daemon, dann trotzdem starten
const LAB_RAM_GUESS = 4.5;    // Lab-Laeufer: Basis 1,6 + authenticate 0,4 + ls 0,2
                              // + scp 0,6 + exec 1,3 (er erntet den Cache selbst, v3.13)

// ---- Modul-Zustand ----------------------------------------------------------
const PARKED = new Map();         // host -> Runde, ab der wieder probiert wird
const CACHE_TRIES = new Map();    // Cache-Datei -> Anlaeufe (v3.8)
const CCT_SEEN = new Map();       // .cct -> Runde der letzten Meldung (v4.0)
const PWDB = new Map();           // host -> Passwort (fuer connectToSession)     [v3.12]
const SESSIONS = new Set();       // Hosts, fuer die DIESE PID eine Session hat   [v3.12]
const SESSION_WARNED = new Set(); // Hosts, fuer die schon einmal gemeldet wurde   [v3.13]
const CRACK_STARTED = new Map();  // host -> Runde des letzten Knack-Op-Starts     [v4.0]
// v4.0: Zahl der offen gebliebenen Ziele aus der letzten Runde. -1 = noch unbekannt.
// Grundlage fuer die RAM-Reserve beim Roden (siehe rodeReserve).
let openTargets = -1;
// Ziele, die am harten heartbleed-Charisma-Deckel haengen (einmal melden, dann ruhen).
// Wird geleert, sobald das Charisma reicht — Charisma waechst durch das Knacken
// selbst: calculatePasswordAttemptChaGain (effects.ts:113-124) gibt EXP bei JEDEM
// Versuch, auch bei Fehlschlaegen, und skaliert LINEAR mit den Threads.
const CHA_BLOCKED = new Set();
let bigBlockUntil = 0;            // Runde, ab der ein grosser Block neu versucht wird
let labWaited = 0;                // Runden ohne Labyrinth-Mandat vom Daemon
let labFocus = false;             // Vorrang fuer den Labyrinth-Laeufer (v3.14)
let labNeighbor = "";             // benachbarter Labyrinth-Server, falls vorhanden
const PENDING_SPREAD = new Set(); // geknackt, aber noch kein Roamer drauf
// v4.0 — AUS RIEGELN WERDEN FRISTEN.
// OPENED war eine Menge fuer immer: eine Cache-Datei, die nach CACHE_MAX_TRIES
// Anlaeufen aufgegeben wurde, blieb bis zum Prozessende unangetastet — auch wenn
// der Fehlschlag nur an fehlendem RAM oder einer Mutation lag. Dasselbe Muster
// bei CCT_SEEN und dem einmal kippenden RODED. Genau daran haben sich die Halden
// aufgebaut, die du im Spiel siehst. Jetzt merkt sich der Roamer, WANN er es
// wieder versuchen darf.
const OPENED = new Map();         // Cache-Schluessel -> Runde des naechsten Anlaufs
const RETRY_AFTER = 120;          // Runden bis zum naechsten Anlauf (~4 min)
let ROUND = 0;
let RODED = false;
let rodeRecheck = 0;              // Runde, ab der der eigene Block neu geprueft wird
const RODE_RECHECK = 60;          // Roden wird regelmaessig neu geprueft (Blocks wachsen)
// Auftragslage vom Daemon (Port 34, peek). sweepUntil > now heisst: Kahlschlag —
// alle Quoten aus, Phishing ruht, jeder Cache und jeder Block wird angefasst.
let sweepUntil = 0;
let orderStamp = "";              // letzter gelesener Auftrag (Log-Entprellung)
const ORDERS = { harvest: new Set(), rode: new Set(), settle: new Set() };
let stormReported = false;
let dumpedDetails = false;
const reportedPws = new Set();
let dumpedLogs = false;

/**
 * AUFTRAEGE DES DAEMONS LESEN (Port 34, peek, 0 GB).
 *
 * v4.0 — WARUM DER DAEMON JETZT MITREDET. Der Roamer sieht nur seine direkten
 * Nachbarn (ns.dnet.probe) und entscheidet allein, was er anfasst. Der Daemon
 * dagegen kann von home aus KOSTENLOS das ganze Darknet inventarisieren: ns.ls
 * listet Caches und .cct auch fuer Darknet-Server (NetscriptFunctions.ts:839-846,
 * keine Session- und keine Verbindungspruefung) und ns.dnet.getBlockedRam kostet
 * 0 GB. Er weiss also, WO etwas liegt — nur anfassen kann er es nicht (openCache
 * verlangt einen Prozess auf dem Server selbst, Darknet.ts:313; exec/scp
 * verlangen Session und Direktverbindung, NetscriptFunctions.ts:636/761).
 * Deshalb: der Daemon plant, die Roamer fuehren aus.
 *
 * Format (eine Zeile, peek):  ORDERS|until=<ms>|sweep=<ms>|<host>=<flags> …
 *   flags: h = Caches ernten, r = roden, s = besiedeln
 * Ein Auftrag ohne Eintrag fuer diesen Roamer ist kein Fehler: dann arbeitet er
 * nach eigenem Ermessen weiter (Selbststaendigkeit bleibt erhalten, der Auftrag
 * setzt nur Prioritaeten).
 */
function readOrders(ns, self) {
    ORDERS.harvest.clear(); ORDERS.rode.clear(); ORDERS.settle.clear();
    let txt = "";
    try { txt = String(readDnetOut(ns).orders || ""); } catch (e) { txt = ""; }
    if (!txt || txt === "NULL PORT DATA" || txt.indexOf("ORDERS") !== 0) { sweepUntil = 0; return; }
    const parts = txt.split("|");
    let until = 0;
    for (const p of parts) {
        if (p.indexOf("until=") === 0) { until = Number(p.slice(6)) || 0; continue; }
        if (p.indexOf("sweep=") === 0) { sweepUntil = Number(p.slice(6)) || 0; continue; }
        if (p.indexOf("cha=") === 0) { chaKnown = Number(p.slice(4)) || 0; continue; }
        // v4.2: Der Daemon sagt, ob Phishing VORRANG hat. Siehe phishPriority
        // unten — der Roamer kann das selbst nicht entscheiden, weil er die
        // BitNode-Multiplikatoren nicht kennt.
        if (p.indexOf("phish=") === 0) { phishPrio = p.slice(6) === "1"; continue; }
    }
    // TOTMANNSCHALTER: ein abgelaufener Auftrag gilt nicht mehr. Stirbt der Daemon,
    // faellt der Roamer von selbst in den Normalbetrieb zurueck — es bleibt kein
    // Roamer mit abgeschaltetem Phishing oder aufgehobenen Deckeln zurueck.
    if (until > 0 && Date.now() > until) { sweepUntil = 0; return; }
    for (const p of parts) {
        const eq = p.indexOf("=");
        if (eq <= 0) continue;
        const key = p.slice(0, eq);
        if (key === "until" || key === "sweep" || key === "cha" || key === "phish"
            || key === "ORDERS") continue;
        const flags = p.slice(eq + 1);
        if (flags.indexOf("h") >= 0) ORDERS.harvest.add(key);
        if (flags.indexOf("r") >= 0) ORDERS.rode.add(key);
        if (flags.indexOf("s") >= 0) ORDERS.settle.add(key);
    }
    if (txt !== orderStamp) {
        orderStamp = txt;
        const mine = [...ORDERS.harvest, ...ORDERS.rode, ...ORDERS.settle];
        if (mine.length || sweepUntil > Date.now()) {
            tell(ns, ["ORDER", self, sweepActive() ? "sweep" : "normal",
                "h:" + ORDERS.harvest.size, "r:" + ORDERS.rode.size, "s:" + ORDERS.settle.size]);
        }
    }
}

/** Kahlschlag-Modus aktiv? (Deckel aus, Phishing ruht, alles wird angefasst.) */
function sweepActive() { return sweepUntil > Date.now(); }

/** Wie viele Cache-Ops darf dieser Server parallel fahren? */
function cacheOpsLimit() { return sweepActive() ? 8 : CACHE_OPS_MAX; }

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const ROAMER = ns.getScriptName();
    const self = ns.getHostname();
    tell(ns, ["JOIN", self]);
    // v3.12: mitgelieferte Passwoerter uebernehmen — sie sind der Schluessel zu
    // den Sessions der Nachbarn (siehe ensureSession).
    try {
        for (const src of [readLocalPw(ns), readManual(ns)]) {
            for (const h in src.byHost) if (!PWDB.has(h)) PWDB.set(h, src.byHost[h]);
        }
    } catch (e) { /* egal */ }
    reportSelf(ns, self);

    // =====================================================================
    // v4.7 — DER ROAMER HOLT SICH SEINE NUTZLASTEN SELBST VON HOME
    // =====================================================================
    // Bisher wurden schwarm-crack.js, schwarm-lab.js und der Roamer selbst NUR
    // beim Besiedeln kopiert. Wer schon lief, behielt seinen Stand fuer immer —
    // ein eingespielter Fix erreichte ihn nie. Genau daran hing der
    // PHP-5.4-Fehler: die Korrektur lag auf home, waehrend die Fremdrechner
    // weiter mit dem kaputten Muster rechneten.
    //
    // Der Weg dorthin war nicht offensichtlich, steht aber eindeutig in der
    // Engine: ns.scp prueft Rechte AUSSCHLIESSLICH auf dem ZIEL
    // (NetscriptFunctions.ts:761-767, checkDarknetServer mit requireAdminRights
    // und requireSession). Die QUELLE wird nur nachgeschlagen
    // (helpers.getServer, Zeile 770) — ohne jede Pruefung. Ein Roamer darf
    // also von home HOLEN, obwohl home ihm nichts schicken duerfte: fuer den
    // eigenen Server ist man automatisch authentifiziert
    // (offlineServerHandling.ts:99).
    //
    // Damit braucht es keine Kaskade ueber Nachbarn und keine Sessions von
    // home aus. Jeder Roamer haelt sich selbst aktuell.
    //
    // WAS DAS ERREICHT UND WAS NICHT:
    //   - schwarm-crack.js und schwarm-lab.js wirken SOFORT. Sie werden bei
    //     jedem Einsatz frisch ge-exec't, holen sich den Code also neu.
    //   - Der Roamer SELBST behaelt seinen Code, bis er neu startet. Die Datei
    //     wird trotzdem mitgeholt: der naechste Start auf diesem Host nimmt
    //     dann den neuen Stand.
    //
    // BEWUSST OHNE SELBST-NEUSTART: ns.spawn wuerde den Prozess durch einen
    // frischen ersetzen, kostet aber 2 GB im RAM-Bedarf des Roamers — dauerhaft
    // und auf JEDEM Host. Darknet-Server sind klein, und der Bedarf entscheidet
    // mit, wohin sich der Schwarm ueberhaupt ausbreiten kann (spread prueft
    // tgtFree gegen roamerNeed). Der Gewinn waere gering: die LOESER liegen in
    // schwarm-crack.js und schwarm-lab.js, und die werden bei jedem Einsatz
    // frisch ge-exec't, holen sich den neuen Code also ohnehin sofort. Der
    // Roamer-Rumpf aendert sich selten und zieht beim naechsten Aug-Reset nach.
    //
    // Erst nach dem naechsten Roamer-Neustart (Aug-Reset oder Neubesiedlung)
    // ist diese Auffrischung ueberhaupt an Bord — vorher gibt es sie auf den
    // Fremdrechnern ja noch nicht. Ab dann haelt sie sich selbst.
    const REFRESH_EVERY = 30;                  // Runden zwischen zwei Abgleichen

    const holeNutzlasten = () => {
        try {
            // Zielserver ist der eigene; Quelle ist home. Gleicher Inhalt ist in
            // der Engine ein No-Op (Script.ts:36), das kostet also nichts.
            return ns.scp([CRACK_FILE, LAB_FILE, ROAMER], self, "home") === true;
        } catch (e) { return false; }
    };
    holeNutzlasten();   // gleich beim Start, nicht erst nach 30 Runden

    let round = 0;
    while (true) {
        ROUND = round;
        let didWork = false;

        // v4.7: Nutzlasten periodisch von home nachziehen (siehe oben).
        if (round > 0 && round % REFRESH_EVERY === 0) holeNutzlasten();

        // v4.0 — REIHENFOLGE ERNEUT GEDREHT, UND DIESMAL AUS DEM RICHTIGEN GRUND.
        //
        // v3.9 hatte die Ausbreitung nach vorn gezogen, weil ein Wurf in einem der
        // vorherigen Schritte sie sonst verschluckte. Das Problem war echt, die
        // Loesung aber falsch herum: das Cracken ist der EINZIGE Schritt, der
        // Spielzeit im Sekundenbereich verbraucht (jeder Auth-Versuch blockiert,
        // siehe CRACK_MS oben). Alles andere sind Prozessstarts und ns.ls-Aufrufe,
        // also Millisekunden. Wer die teure Arbeit zuerst macht, verhungert die
        // billige — genau das war im Spiel zu sehen: Roamer leben, Caches und
        // Contracts bleiben liegen.
        //
        // Jetzt zuerst das Billige (ernten, melden, roden, besiedeln), danach mit
        // dem RESTBUDGET der Runde das Teure (Raetsel loesen). Jeder Schritt hat
        // weiterhin sein eigenes catch, der Grund von v3.9 bleibt also gewahrt.

        // 0. Auftragslage vom Daemon holen (0 GB, ein peek).
        try { readOrders(ns, self); } catch (e) { sweepUntil = 0; }

        // 0b. PASSWOERTER NACHLESEN — v4.0.1, KRITISCHER FIX.
        //
        // Der Knack-Op (schwarm-crack.js) schreibt jedes gefundene Passwort in die
        // lokale schwarm-dnet-manual.txt. Bis v4.0 las der Roamer diese Datei nur
        // EINMAL beim Start: in v3.14 geschah das Nachlesen als Nebeneffekt der
        // Cracker-Schleife (assembleCandidates brauchte die Liste jede Runde), und
        // beim Auslagern des Crackers ist dieser Aufruf mit verschwunden.
        //
        // Folge im Livelauf: PWDB blieb leer, ensureSession scheiterte mit
        // "Passwort unbekannt", und damit fielen ALLE Folgeschritte aus, die eine
        // Session brauchen (NetscriptFunctions.ts:636/761): kein spread, keine
        // Fern-Ernte. Das Log zeigte genau das — Knack-Ops meldeten Erfolge,
        // waehrend PENDING_SPREAD von 16 auf 22 wuchs und die Abdeckung bei 17-23 %
        // stehen blieb. ns.read kostet 0 GB; jede Runde nachlesen ist gratis.
        try {
            // Lokale Datei zuerst (dort schreibt der Knack-Op), dann die
            // Spielerliste. ns.read kostet 0 GB.
            for (const src of [readLocalPw(ns), readManual(ns)]) {
                for (const h in src.byHost) if (!PWDB.has(h)) PWDB.set(h, src.byHost[h]);
            }
        } catch (e) { /* unkritisch */ }

        // 1. ERNTE — Caches oeffnen. Billig und der eigentliche Ertrag.
        try { harvestServer(ns, self); } catch (e) { tell(ns, ["ERR", self, "ernte: " + String(e && e.message ? e.message : e)]); }

        // 2. Contracts an den Daemon melden (geloest wird auf home).
        try { reportContracts(ns, self); } catch (e) { tell(ns, ["ERR", self, "contracts: " + String(e && e.message ? e.message : e)]); }

        // 3. Fern-Ernte und Besiedlung fuer bereits geknackte Nachbarn.
        try { if (await serveKnownNeighbors(ns, self, ROAMER)) didWork = true; }
        catch (e) { tell(ns, ["ERR", self, "nachbarn: " + String(e && e.message ? e.message : e)]); }

        // 4. Eigene .txt-Funde melden.
        try { reportFindings(ns, self); } catch (e) { /* unkritisch */ }

        // 5. (Promote ist nach v4.3 ans ENDE gewandert — siehe Schritt 8b.)

        // 6/7. NEUE NACHBARN KNACKEN — LEICHT VOR SCHWER, parallel, ohne Warten.
        try {
            const seen = safeProbe(ns);
            // Offene Ziele bewerten und sortieren. targetCost spiegelt die echte
            // Engine-Wartezeit (Charisma-Malus + difficulty + Modellaufwand), also
            // kommen triviale Server garantiert vor schweren Feedback-Raetseln.
            // Vorher arbeitete der Roamer die Nachbarn in der Reihenfolge ab, in der
            // ns.dnet.probe sie liefert — ein KingOfTheHill-Server (150 Versuche)
            // neben einem ZeroLogon (1 Versuch) bekam dieselbe Aufmerksamkeit.
            const open = [];
            let held = 0;
            for (const host of seen) {
                let d = null;
                try { d = ns.dnet.getServerDetails(host); } catch (e) { d = null; }
                if (!d || d.isOnline === false || d.isConnectedToCurrentServer === false) continue;
                if (d.modelId === DNET_MODELS.labyrinth) { handleLab(ns, host, d, ROAMER); continue; }
                if (isOccupied(ns, host, ROAMER)) { held++; continue; }   // dort laeuft ein Roamer
                if (safeRoot(ns, host)) {
                    // v4.1.2 — DIE SACKGASSE DER DEZENTRALISIERUNG.
                    // Bis hierher galt "geknackt" als "erledigt". Mit der globalen
                    // Passwortliste stimmte das: das Passwort ueberlebte dort jeden
                    // Roamer-Neustart. Lokal (dnet-pw.txt) gilt das nicht mehr —
                    // ein Roamer, der nach killall oder Mutation neu startet, hat
                    // fuer einen laengst gerooteten Nachbarn KEIN Passwort und
                    // damit keine Session. Ohne Session lehnt die Engine scp und
                    // exec ab (NetscriptFunctions.ts:636/761): der Server war
                    // besetzt-aber-unerreichbar und wurde nie wieder angefasst.
                    // Genau das zeigte der Livelauf: "4 Nachbarn / 4 erledigt /
                    // 0 offen" bei 0 gestarteten Knack-Ops und 4 % Abdeckung.
                    //
                    // Der Ausweg steht in authentication.ts:19-31: checkPassword
                    // vergleicht NUR das Passwort, der Root-Status ist ihm egal.
                    // Ein gerooteter Server laesst sich also neu authentifizieren —
                    // und handleSuccessfulAuth bindet die Session an unsere PID.
                    // Bei den berechenbaren Modellen kostet das genau einen Versuch.
                    if (ensureSession(ns, host, d)) { held++; continue; }
                    // Keine Session: als Ziel behandeln, damit der Knack-Op das
                    // Passwort (und damit die Session) beschafft.
                }
                if (crackRunning(ns, host)) continue;                  // Op laeuft schon
                const last = CRACK_STARTED.get(host);
                if (last !== undefined && ROUND - last < CRACK_RETRY) continue;
                if (ROUND < (PARKED.get(host) || 0)) continue;
                // UNLOESBAR statt nur langsam: Orakel-Raetsel ueber dem eigenen
                // Charisma koennen NIE gelingen (heartbleed-Deckel). Einmal melden,
                // danach nicht mehr anfassen — die Zeit gehoert den loesbaren Zielen.
                if (!solvableNow(ns, d)) {
                    if (!CHA_BLOCKED.has(host)) {
                        CHA_BLOCKED.add(host);
                        tell(ns, ["CHARISMA", host,
                            String(d.requiredCharismaSkill === undefined ? "?" : d.requiredCharismaSkill),
                            String(d.modelId || "?")]);
                    }
                    continue;
                }
                CHA_BLOCKED.delete(host);
                open.push({ host: host, d: d, cost: targetCost(ns, host, d) });
            }
            open.sort((a, b) => a.cost - b.cost);
            openTargets = open.length;   // Grundlage der RAM-Reserve beim Roden

            // v4.0.2: MERKLISTEN AUF DIE AKTUELLE NACHBARSCHAFT BESCHRAENKEN.
            // PENDING_SPREAD und SESSION_WARNED wuchsen unbegrenzt: Mutation trennt
            // Verbindungen und verschiebt Server (NetworkMovement.ts), ein einmal
            // eingetragener Host blieb aber fuer immer drin, obwohl er gar kein
            // Nachbar mehr ist. Im Livelauf stieg die Aussaat-Spalte dadurch von 3
            // auf 14, ohne dass tatsaechlich mehr offen war — die Zahl log.
            const nb = new Set(seen);
            for (const h of [...PENDING_SPREAD]) if (!nb.has(h)) PENDING_SPREAD.delete(h);
            for (const h of [...SESSION_WARNED]) if (!nb.has(h)) SESSION_WARNED.delete(h);
            for (const h of [...CRACK_STARTED.keys()]) if (!nb.has(h)) CRACK_STARTED.delete(h);

            // BREITE VOR TIEFE: erst je Ziel EINEN Op, Threads nur mit Restplatz.
            // threadsFactor = 1/(1+0,2*(threads-1)) bringt bei 2 Threads nur
            // 1,2-fach; ein zweiter Op auf einem ANDEREN Ziel bringt das Doppelte.
            // Threads lohnen also erst, wenn nichts anderes mehr offen ist.
            let running = crackOpsRunning(ns, self);
            const cheapOpen = open.filter((t) => t.cost <= CRACK_COST_SOFT).length;
            let heavy = 0;
            // THREAD-BUDGET VORAB PLANEN. Vorher wurde die Threadzahl aus dem
            // MOMENTANEN freien RAM gerechnet — nachdem die ersten (billigen) Ops
            // ihre Slots belegt hatten, blieb fuer das teure Ziel nichts mehr uebrig,
            // und genau dort bringen Threads am meisten (threadsFactor wirkt auf
            // jeden der vielen Versuche). Jetzt wird der Platz fuer die geplanten
            // Slots zuerst abgezogen; was danach bleibt, geht an die teuren Ziele.
            const slots = Math.min(CRACK_OPS_MAX - running, open.length);
            const budget = Math.floor(freeRam(ns, self) / CRACK_RAM);
            const spare = Math.max(0, budget - slots);   // Threads ueber die Slots hinaus
            let spareLeft = spare;
            for (const t of open) {
                if (running >= CRACK_OPS_MAX) break;
                const isHeavy = t.cost > CRACK_COST_SOFT;
                // TEURE ZIELE BREMSEN. Ein Ziel mit vielen Versuchen oder weit ueber
                // dem eigenen Charisma (underleveledFactor bis 3,4-fach) darf nicht
                // alle Slots belegen, solange billige Nachbarn warten. Erst wenn kein
                // billiges Ziel mehr offen ist, geht EIN Op auf ein teures — mit
                // Threads, weil threadsFactor dort am meisten bringt.
                if (isHeavy) {
                    if (cheapOpen > 0) continue;
                    if (heavy >= CRACK_HEAVY_MAX) continue;
                }
                if (freeRam(ns, self) < CRACK_RAM && !killPhishingIfNeeded(ns, self)) break;
                // Threads bekommen teure Ziele (dort wirkt threadsFactor auf viele
                // Versuche) und ein einzeln verbliebenes Ziel. Sonst Breite vor Tiefe:
                // ein zweiter Op auf einem anderen Ziel bringt den doppelten
                // Durchsatz, 2 Threads nur 1,2-fach.
                const wantThreads = isHeavy || (open.length === 1 && running === 0);
                let threads = 1;
                if (wantThreads && spareLeft > 0) {
                    threads = Math.max(1, Math.min(CRACK_THREADS_MAX, 1 + spareLeft));
                    spareLeft -= (threads - 1);
                }
                const why = startCrackOp(ns, t.host, t.d, threads);
                if (why === "") { running++; if (isHeavy) heavy++; didWork = true; }
                else if (why.indexOf("RAM") === 0) break;
            }
            if (round % SCAN_REPORT_EVERY === 0) {
                // "erledigt" heisst ab v4.1.2: besiedelt ODER mit gueltiger Session.
                tell(ns, ["SCAN", self, String(seen.length), String(held), String(open.length),
                    freeRam(ns, self).toFixed(1) + "/" + safeMaxRam(ns, self) + " GB",
                    String(PENDING_SPREAD.size), String(running),
                    sweepActive() ? "sweep" : "normal"]);
            }
        } catch (e) { tell(ns, ["ERR", self, "ausbreiten: " + String(e && e.message ? e.message : e)]); }

        // 8. FREMDBLOCK RODEN — nach der Erschliessung, mit dem Rest-RAM.
        //    v4.0: Das Roden lief bis hierher VOR dem Cracken und nahm mit
        //    maxThreads allen freien RAM; danach fand kein Knack-Op mehr Platz und
        //    der Op lief seine ganze Laufzeit weiter (im Harness reproduziert).
        //    Sachlich gehoert es auch hinter die Erschliessung: der eigene Block
        //    behindert nur diesen Server, dessen Roamer bereits laeuft — ein neu
        //    geknackter Nachbar bringt dagegen einen ZUSAETZLICHEN Roamer und
        //    dessen RAM ins Netz. rodeReserve() haelt zusaetzlich Platz frei.
        try {
            if (RODED && ROUND >= rodeRecheck) { RODED = false; rodeRecheck = ROUND + RODE_RECHECK; }
            if (!RODED) manageBlock(ns, self);
            // v4.2: Ist der EIGENE Block weg, den der Nachbarn angehen. Das ist
            // der einzige Weg, Server freizuraeumen, die so zugesetzt sind, dass
            // dort gar kein Roamer mehr startet — siehe rodeNeighbors.
            if (RODED) rodeNeighbors(ns, self);
        } catch (e) { tell(ns, ["ERR", self, "roden: " + String(e && e.message ? e.message : e)]); }

        // 8b. PROMOTE — v4.3 HIERHER VERSCHOBEN.
        //
        // DER FEHLER: Promote stand als Schritt 5 VOR der Erschliessung. Solange
        // es ein Op mit 20 Iterationen war (~26 s), fiel das nicht auf. Mit
        // v4.2 wurden daraus bis zu DREI Ops mit je 120 Iterationen — also rund
        // 156 s Belegung. Auf darkweb, dem Einstiegsserver mit dem knappsten RAM,
        // lagen daraufhin zwei Promoter neben dem Roamer, und fuer Knack-Ops
        // blieb nichts uebrig: die Karte fiel von 111 auf 4 Server, geknackt von
        // 28 auf 2. Der Roamer erstickte am eigenen Ertrag — exakt der Fehler,
        // vor dem der Kommentar an Schritt 9 beim Phishing warnt, nur eine
        // Stufe frueher.
        //
        // JETZT gilt dieselbe Rangfolge wie fuer Phishing: erst erschliessen,
        // dann verwerten. Zusaetzlich haelt promoteSlots() Platz frei, solange
        // ueberhaupt Ziele offen sind.
        try { if (!sweepActive()) maybePromote(ns, self); } catch (e) { /* unkritisch */ }

        // 9. Dauer-Phishing ZULETZT und nur, wenn nichts Wichtigeres offen ist.
        //    v4.0: Phishing ist die QUELLE der Cache-Halde — jeder erfolgreiche
        //    phishingAttack legt eine ".d.cache" an (cacheFiles.ts). Frueher belegte
        //    es allen freien RAM, sodass Knack-, Cache- und RODE-Ops keinen Platz
        //    mehr fanden: der Server erstickte am eigenen Ertrag. Jetzt laeuft es
        //    erst, wenn der eigene Block geraeumt ist, keine Caches offen sind, kein
        //    Knack-Op laeuft UND kein Nachbar mehr ungeknackt oder unbesiedelt ist.
        //    v4.2 VORRANG-PHISHING. Die fuenffache UND-Kette oben ist richtig,
        //    solange Phishing nur Geld und Caches bringt. In einer BitNode ohne
        //    Darknet-Geld (BN8: DarknetMoneyMultiplier 0) bleibt aber genau ein
        //    Ertrag uebrig — CHARISMA-XP, threads x 50 x mult je Treffer — und
        //    Charisma ist der Multiplikator fuer ALLES andere im Darknet:
        //        memoryReallocation:  charismaFactor = 1 + cha/100   (bei 3000: x31)
        //        promoteStock:        (500 + cha)/500                (bei 3000: x7)
        //        phishingAttack:      max(10000 x 400/(400+cha), 200) ms
        //        Knack-Ops:           underleveledFactor sinkt mit cha
        //    Phishing ist dort also keine Restverwertung, sondern die Investition,
        //    die jede andere Op beschleunigt — und stand als Letztes in der Kette.
        //    Der Daemon setzt phish=1 im Auftrag; der Roamer laesst dann nur noch
        //    die Bedingungen stehen, die echte KONKURRENZ um RAM abbilden.
        try {
            const phishOk = phishPrio
                ? (RODED && crackOpsRunning(ns, self) === 0)
                : (RODED && !sweepActive() && !backlogOpen(ns, self)
                   && crackOpsRunning(ns, self) === 0 && !neighborsOpen(ns, self, ROAMER));
            if (phishOk) ensurePhishing(ns, self);
        } catch (e) { /* unkritisch */ }

        round++;
        // Im Kahlschlag kurzer Takt: die Arbeit ist billig, nur Prozessstarts.
        await ns.sleep(sweepActive() ? 800 : (didWork ? LOOP_MS : IDLE_MS));
    }
}

/**
 * Liegt auf diesem Server noch Arbeit? Entscheidet, ob Phishing ruhen muss.
 * Beide Aufrufe sind bereits bezahlt (ls 0,2 GB / getBlockedRam 0 GB).
 */
function backlogOpen(ns, self) {
    try {
        for (const f of safeLs(ns, self)) if (String(f).endsWith(".cache")) return true;
        if (Number(ns.dnet.getBlockedRam(self)) > 0) return true;
    } catch (e) { /* im Zweifel phishen */ }
    return false;
}

/**
 * BEREITS GEKNACKTE NACHBARN VERSORGEN — ohne einen einzigen Auth-Versuch.
 *
 * v4.0 — DIESER PFAD HING VORHER HINTER DEM CRACKER. Fern-Ernte (harvestRemote)
 * und Besiedlung (spread) brauchen nur Adminrechte und eine Session, beides ist
 * bei einem geknackten Nachbarn schon vorhanden. Sie steckten aber mitten in
 * handleServer, also hinter den bis zu 150 Auth-Versuchen des jeweils vorherigen
 * Nachbarn. Ergebnis: geknackte Server ohne Roamer blieben liegen ("Geknackt,
 * aber kein Roamer drauf" im Log), und ihre Caches wurden nie geoeffnet.
 * Jetzt laufen sie VOR dem Cracken und in jeder Runde.
 * @returns {Promise<boolean>} true, wenn etwas getan wurde
 */
async function serveKnownNeighbors(ns, self, roamer) {
    let work = false;
    for (const host of safeProbe(ns)) {
        let d;
        try { d = ns.dnet.getServerDetails(host); } catch (e) { continue; }
        if (!d || d.isOnline === false) continue;
        // v4.1: Ohne Direktverbindung lehnt die Engine scp und exec ab
        // (NetscriptFunctions.ts:636/761). Vorher wurde das nicht geprueft, und
        // spread lief in ein exec=0, dessen Grund niemand kannte.
        if (d.isConnectedToCurrentServer === false) continue;
        if (d.modelId === DNET_MODELS.labyrinth) continue;   // macht handleLab
        if (!safeRoot(ns, host)) continue;                   // noch nicht geknackt
        confirmRemote(ns, host);
        harvestRemote(ns, host, roamer, d);
        if (!isOccupied(ns, host, roamer)) { if (spread(ns, host, roamer)) work = true; }
    }
    return work;
}

// =============================================================================
// Nachbarn knacken / offene Server besetzen
// =============================================================================

/**
 * Ist noch ein Nachbar ungeknackt oder unbesiedelt? Entscheidet, ob Phishing
 * anlaufen darf (siehe Schritt 8 der Hauptschleife).
 */
/**
 * NACHBAR-KAPAZITAET (v4.2).
 *
 * neighborsOpen() beantwortet "ist da noch was ungeknackt oder unbesiedelt" —
 * aber NICHT "ist da noch Platz". Genau das fehlte: ein Roamer wusste nie, dass
 * der Nachbar 40 GB frei hat, waehrend er selbst am Limit klebte.
 *
 * Liefert die direkt verbundenen, gerooteten Nachbarn mit freiem RAM und
 * Fremdblock, absteigend nach Block sortiert (dort lohnt Roden am meisten).
 *
 * @returns {Array<{host:string, free:number, block:number}>}
 */
function neighborCapacity(ns, self) {
    const out = [];
    for (const host of safeProbe(ns)) {
        if (host === self) continue;
        let d = null;
        try { d = ns.dnet.getServerDetails(host); } catch (e) { continue; }
        if (!d || d.isOnline === false) continue;
        if (d.modelId === DNET_MODELS.labyrinth) continue;   // Labyrinth nie anfassen
        if (!safeRoot(ns, host)) continue;                   // ohne Admin kein Zugriff
        let block = 0;
        try { block = ns.dnet.getBlockedRam(host); } catch (e) { block = 0; }
        out.push({ host: host, free: freeRam(ns, host), block: block });
    }
    out.sort((a, b) => b.block - a.block);
    return out;
}

/**
 * FREMDBLOCK BEIM NACHBARN RODEN (v4.2).
 *
 * DER BEFUND: manageBlock() rodete ausschliesslich den EIGENEN Server
 * (arg: self). Die Engine erlaubt memoryReallocation(host) aber fuer JEDEN
 * direkt verbundenen Server — Darknet.ts verlangt nur requireDirectConnection
 * und requireAdminRights, nicht "ist mein eigener Host".
 *
 * WARUM DAS DEN TOTEN RAM ERKLAERT: Ein Server, dessen Fremdblock so gross ist,
 * dass kein Roamer mehr hineinpasst, wird von NIEMANDEM geraeumt — der einzige,
 * der es taete, kann dort nicht starten. Er bleibt dauerhaft tot. Ein Nachbar
 * raeumt ihn dagegen sofort frei, und danach passt auch wieder ein Roamer hinein.
 *
 * REIHENFOLGE: erst der eigene Block (manageBlock), dann die Nachbarn. Der
 * eigene behindert den laufenden Roamer unmittelbar; der fremde ist eine
 * Investition in zusaetzliche Kapazitaet.
 *
 * VORRANG: groesster Block zuerst — dort ist am meisten zu holen, und dort ist
 * die Wahrscheinlichkeit am hoechsten, dass gar kein Roamer mehr passt.
 */
function rodeNeighbors(ns, self) {
    if (!RODE_ON) return;
    if (!lootCleared()) return;
    let started = 0;
    for (const n of neighborCapacity(ns, self)) {
        if (started >= RODE_NEIGHBOR_MAX) break;
        if (n.block <= 0) continue;
        // Laeuft fuer diesen Nachbarn schon eine Raeumung? Der Op-Dateiname
        // traegt das Ziel, opRunning unterscheidet also sauber.
        if (opRunning(ns, self, DNET_OPS.RODE, n.host)) continue;
        const threads = maxThreads(ns, self, DNET_OPS.RODE, rodeReserve());
        if (threads < 1) return;                  // kein Platz mehr -> Schluss
        const iters = rodeIters(ns, self, n.block, threads);
        const op = runDnetOp(ns, DNET_OPS.RODE,
            { arg: n.host, iterations: iters, threads: threads });
        if (!op.ok) return;                       // RAM zu Ende
        started++;
        tell(ns, ["RODENB", self, n.host, String(Math.round(n.block))]);
    }
}

function neighborsOpen(ns, self, roamer) {
    for (const host of safeProbe(ns)) {
        let d = null;
        try { d = ns.dnet.getServerDetails(host); } catch (e) { continue; }
        if (!d || d.isOnline === false) continue;
        if (d.modelId === DNET_MODELS.labyrinth) {
            if (!safeRoot(ns, host)) return true;       // Labyrinth hat Vorrang
            continue;
        }
        if (!safeRoot(ns, host)) return true;
        if (!isOccupied(ns, host, roamer)) return true; // geknackt, aber unbesiedelt
    }
    return false;
}

/**
 * Wie viel RAM braucht der Roamer auf dem Ziel? getScriptRam kostet 0,1 GB und
 * liefert den echten Wert — eine geratene Konstante lief bei jeder Aenderung des
 * Roamers aus dem Ruder.
 */
function roamerNeed(ns, roamer) {
    try { const r = Number(ns.getScriptRam(roamer)); if (r > 0) return r; } catch (e) { /* */ }
    return 9;
}

/** Phishing weichen lassen, wenn dadurch Platz fuer einen Knack-Op entsteht. */
function killPhishingIfNeeded(ns, self) {
    killPhishing(ns, self);
    return freeRam(ns, self) >= CRACK_RAM;
}

/**
 * EIN NACHBAR EINSCHAETZEN UND EINEN KNACK-OP STARTEN — ohne selbst zu warten.
 *
 * v4.0: Frueher stand hier die komplette Auth-Schleife (bis 150 Versuche mit je
 * mehreren Sekunden Wartezeit). Jetzt wird nur bewertet und delegiert; das
 * Knacken macht schwarm-crack.js in einem eigenen Prozess mit mehreren Threads.
 *
 * @returns {string} "" wenn erledigt/nichts zu tun, sonst der Grund
 */
function handleServer(ns, host, roamer) {
    let d;
    try { d = ns.dnet.getServerDetails(host); } catch (e) { return "unlesbar"; }
    if (!d || d.isOnline === false || d.isConnectedToCurrentServer === false) return "offline";

    if (DEBUG_DUMP && !dumpedDetails) {
        dumpedDetails = true;
        try { ns.print("DETAILS " + host + ": " + JSON.stringify(d)); } catch (e) { /* */ }
    }

    // Das Labyrinth ist kein Passwortraetsel — es wird gelaufen (eigener Prozess,
    // Position haengt an der PID: DarknetState.labLocations[pid]).
    if (d.modelId === DNET_MODELS.labyrinth) { handleLab(ns, host, d, roamer); return ""; }

    if (safeRoot(ns, host)) return "";          // geknackt -> serveKnownNeighbors
    if (isOccupied(ns, host, roamer)) return "";
    if (crackRunning(ns, host)) return "laeuft";

    const parkedUntil = PARKED.get(host) || 0;
    if (ROUND < parkedUntil) return "geparkt";

    return startCrackOp(ns, host, d);
}

/**
 * ZIELE BEWERTEN: LEICHT VOR SCHWER.
 *
 * Ohne Reihenfolge arbeitet der Roamer die Nachbarn so ab, wie ns.dnet.probe sie
 * liefert — ein schweres Feedback-Raetsel neben einem trivialen ZeroLogon-Server
 * bekam damit dieselbe Aufmerksamkeit. Die Engine liefert alles Noetige vorab in
 * getServerDetails (0,1 GB, wird ohnehin gelesen):
 *
 *   requiredCharismaSkill  Reicht mein Charisma? Sonst greift der
 *                          underleveledFactor (effects.ts:78):
 *                            1,5 + (chaRequired + 50)/(charisma + 50)
 *                          Bei 600 Charisma gegen 1175 Bedarf ist das Faktor 3,4
 *                          AUF JEDEN VERSUCH — solche Ziele lohnen erst spaeter.
 *   difficulty             Geht linear in die Auth-Zeit ein ((difficulty+1)*100).
 *   modelId                Entscheidet die ARBEITSART: deterministische Modelle
 *                          (ZeroLogon, FreshInstall, TopPass, PrimeTime,
 *                          Hamming, XOR, Captcha, Base10, MathML …) sind mit
 *                          wenigen Versuchen erledigt; Feedback-Modelle
 *                          (Mastermind, GuessNumber, Divisibility, Maxima …)
 *                          brauchen Dutzende Auth-Runden ueber heartbleed.
 *
 * Kleinerer Wert = zuerst dran.
 */
function targetCost(ns, host, d) {
    if (!d) return 1e9;
    const cha = playerCha(ns);
    const chaReq = Number(d.requiredCharismaSkill) || 0;
    const diff = Number(d.difficulty) || 0;

    // Charisma-Malus: exakt der Engine-Faktor, damit die Rangfolge die echte
    // Wartezeit widerspiegelt und keine geratene Ersatzformel.
    const under = (cha <= chaReq && Number(d.depth) > 1)
        ? 1.5 + (chaReq + 50) / (cha + 50) : 1;
    // Grundzeit je Versuch (effects.ts:70-75), ohne die Konstanten drumherum.
    const perTry = (5 * chaReq + (diff + 1) * 100) / (cha + 150) * under;
    // Erwartete Versuchszahl nach Modellart.
    const kind = MODEL_EFFORT[d.modelId];
    const tries = kind === undefined ? 40 : kind;
    return perTry * tries;
}

/**
 * Ist dieses Ziel mit dem AKTUELLEN Charisma ueberhaupt loesbar?
 *
 * Orakel-Raetsel brauchen heartbleed, und das bricht unter
 * requiredCharismaSkill hart ab (Darknet.ts:269). Ohne diese Pruefung wuerde der
 * Roamer solche Ziele anfassen, sobald nichts anderes offen ist — und dort
 * beliebig viele teure Auth-Versuche verbrennen, die NIE zum Erfolg fuehren
 * koennen. Berechenbare Modelle bleiben immer erlaubt: sie sind bei zu niedrigem
 * Charisma nur langsam, nicht unmoeglich.
 */
function solvableNow(ns, d) {
    if (!d) return false;
    if (!FEEDBACK_MODELS.has(d.modelId)) return true;
    return playerCha(ns) >= (Number(d.requiredCharismaSkill) || 0);
}

/**
 * Charisma des Spielers — kommt VOM DAEMON (Auftrag, Feld cha=).
 *
 * ns.getPlayer kostet 0,5 GB. Auf einem 16-GB-Darknet-Server, von dem der Roamer
 * schon rund 7 GB braucht und jeder Knack-Op weitere 3 GB je Thread, ist das ein
 * halber Thread — fuer eine Zahl, die sich langsam aendert und die der Daemon auf
 * home ohnehin kennt. Er schickt sie im Auftrag mit (Port 34, peek, 0 GB).
 * Fallback ohne Auftrag: CHA_FALLBACK. Der ist bewusst NIEDRIG gewaehlt, damit
 * die Sortierung im Zweifel vorsichtig ist (teure Ziele wandern nach hinten)
 * statt Zeit an unloesbaren Orakeln zu verbrennen.
 */
const CHA_FALLBACK = 100;
let chaKnown = 0;
// v4.2: Setzt der Daemon phish=1 im Auftrag, hat Phishing Vorrang. Der Roamer
// kann das nicht selbst entscheiden — dazu braeuchte er die BitNode-
// Multiplikatoren, und die kennt nur der Daemon (ueber den INFO-bn-Block).
let phishPrio = false;
function playerCha(ns) { return chaKnown > 0 ? chaKnown : CHA_FALLBACK; }

/**
 * Erwartete Versuchszahl je Modell. Abgeleitet aus dem jeweiligen Loeser in
 * schwarm-crack.js, NICHT geraten:
 *   1  = das Passwort ist berechenbar (ein Versuch)
 *   4  = kleine Wortliste
 *   26 = EU-Laender, 93 = COMMON_PW (Woerterbuecher)
 *   30 = Binaersuche/Praefixaufbau (updown, timing)
 *   60+ = Buendel-Orakel (Mastermind, Spice, Divisibility, Maxima, Packet)
 */
/**
 * MODELLE, DIE ZWINGEND heartbleed BRAUCHEN — und damit einen HARTEN
 * Charisma-Deckel haben.
 *
 * Der entscheidende Unterschied (am Quellcode belegt):
 *   ns.dnet.authenticate hat KEINEN Charisma-Deckel. Charisma geht nur als
 *   ZEITMALUS ein (effects.ts:78, underleveledFactor bis ~3,4-fach) — jeder
 *   Server ist also grundsaetzlich knackbar, es dauert nur laenger.
 *   ns.dnet.heartbleed dagegen bricht HART ab (Darknet.ts:269):
 *     if (Player.skills.charisma < server.requiredCharismaSkill) -> Code 451
 *
 * Alle Orakel-Raetsel holen ihr Feedback aus den Serverlogs, und die liest nur
 * heartbleed. Fehlt das Charisma, sind sie NICHT langsam, sondern UNLOESBAR —
 * jeder Versuch dort ist verschwendete Zeit. Solche Ziele werden nur gemeldet.
 *
 * NICHT in dieser Liste, obwohl es Feedback-Modelle sind:
 *   Pr0verFl0 (BufferOverflow) — der erste Versuch ist 2*L gleiche Zeichen und
 *     ergibt sich allein aus passwordLength (getServerDetails), ohne Logs.
 *   Alle berechenbaren Modelle (ZeroLogon, PrimeTime, XOR, Base10, MathML,
 *     Hamming, Captcha, Woerterbuecher) — die brauchen nie ein Orakel.
 */
const FEEDBACK_MODELS = new Set([
    "AccountsManager_4.2",   // GuessNumber      (Binaersuche ueber Logs)
    "BellaCuore",            // RomanNumeral     (nur der Bereichs-Fall)
    "DeepGreen",             // MastermindHint
    "NIL",                   // Yesn_t
    "RateMyPix.Auth",        // SpiceLevel
    "2G_cellular",           // TimingAttack
    "OpenWebAccessPoint",    // packetSniffer
    "PHP 5.4",               // SortedEchoVuln (v4.3: braucht die RMS-Rueckmeldung)
    "Factori-Os",            // divisibilityTest
    "BigMo%od",              // tripleModulo
    "KingOfTheHill",         // globalMaxima
]);

const MODEL_EFFORT = {
    // v4.4: RateMyPix.Auth war mit 60 zu billig geschaetzt. Der Loeser
    // braucht eine Sonde je Alphabetzeichen (Haeufigkeiten) plus rund
    // L*log2(L) fuer die Positionen. Bei difficulty > 8 ist das Alphabet
    // 0-9a-zA-Z (62 Zeichen) und L = 3 + difficulty/3, also z. B.
    //     difficulty 30: 62 + 13*4 = rund 114 Sonden
    //     difficulty  6: 10 +  5*3 = rund  25 Sonden
    // 85 ist der Mittelwert ueber die ueblichen Schwierigkeiten. Die Zahl
    // ist kein Limit, sondern geht in die Reihenfolge ein.
    "ZeroLogon": 1, "OrdoXenos": 1, "110100100": 1, "RateMyPix.Auth": 85,
    "PrimeTime 2": 1, "BellaCuore": 1, "OctantVoxel": 1, "MathML": 1,
    "CloudBlare(tm)": 1, "DeskMemo_3.1": 1,
    // v4.3: 20 war die geschaetzte Zahl blinder Anordnungsversuche. Der
    // Loeser braucht jetzt eine Grundmessung plus eine Sonde je Stelle,
    // bei hoechstens 9 Stellen also 10 — plus den einen echten Versuch.
    "PHP 5.4": 12,
    "FreshInstall_1.0": 4, "Laika4": 4, "EuroZone Free": 26, "TopPass": 93,
    "AccountsManager_4.2": 30, "2G_cellular": 40, "NIL": 12,
    "Pr0verFl0": 3, "Factori-Os": 80, "DeepGreen": 60, "BigMo%od": 12,
        // v4.2: 150 war die Schaetzung fuer das reine Raster. Gemessen gegen eine
    // exakte Nachbildung der Engine-Kurve (800 Faelle, Laenge 2-5,
    // Schwierigkeit 4-40) braucht der neue Loeser im Schnitt 31 Sonden, bei
    // einem einzelnen Berg 7. 40 ist der Mittelwert mit Luft nach oben.
    // Die Zahl ist KEINE Obergrenze, sondern geht in die Reihenfolge ein:
    // mit 150 wurde KingOfTheHill fuenfmal teurer eingeschaetzt als er ist
    // und deshalb hinter schlechtere Ziele gestellt.
    "KingOfTheHill": 40, "OpenWebAccessPoint": 60,
};

/**
 * Laeuft fuer dieses Ziel schon ein Knack-Op?
 *
 * v4.0 (Korrektur aus dem Mock-Harness): Es wird KEINE zielspezifische Kopie der
 * Payload-Datei mehr angelegt. ns.exec unterscheidet Prozesse nach Datei UND
 * Argumenten — zwei Aufrufe mit verschiedenen Zielen sind verschiedene Prozesse,
 * ohne dass man N Kopien derselben Datei braucht. Die frueher hier erzeugte
 * Kopie haing zusaetzlich an ns.read(CRACK_FILE); lieferte das leer (Datei per
 * scp gekommen, Inhalt aber nicht lesbar), scheiterte der Start STILL. Genau das
 * hat der Harness gezeigt. Das Ziel steht jetzt in args[0].
 */
function crackRunning(ns, host) {
    try {
        return ns.ps(ns.getHostname()).some((p) =>
            (p.filename === CRACK_FILE || p.filename === "/" + CRACK_FILE)
            && String((p.args || [])[0]) === String(host));
    } catch (e) { return false; }
}
function crackOpsRunning(ns, self) {
    try {
        return ns.ps(self).filter((p) => p.filename === CRACK_FILE
            || p.filename === "/" + CRACK_FILE).length;
    } catch (e) { return 0; }
}

/**
 * KNACK-OP STARTEN. Ein Prozess je Ziel; die Threadzahl beschleunigt jede
 * Authentifizierung (threadsFactor, siehe Kopf von schwarm-crack.js).
 *
 * REIHENFOLGE DER MITTEL: erst BREITE (ein Op je offenes Ziel), dann TIEFE
 * (Threads). Begruendung: threadsFactor bringt bei 2 Threads nur 1,2-fach, ein
 * zweiter Op auf einem anderen Ziel dagegen den vollen doppelten Durchsatz.
 * Threads lohnen erst, wenn keine weiteren Ziele offen sind — oder auf tiefen
 * Servern, die laut getMaxRam 128 GB und mehr haben.
 *
 * Der Op-Datei wird je Ziel ein eigener Name gegeben: ns.exec unterscheidet
 * Prozesse nach Datei UND Argumenten, aber ein eigener Name macht ns.ps-Abfragen
 * eindeutig und verhindert, dass preventDuplicates zwei Ziele gegeneinander
 * ausschliesst (genau dieser Fehler hat bis v3.7 die Cache-Ops gedrosselt).
 */
function startCrackOp(ns, host, d, threads) {
    const self = ns.getHostname();
    if (!ns.fileExists(CRACK_FILE, self)) return "crack fehlt";
    let want = Math.max(1, Math.floor(threads || 1));
    const free = freeRam(ns, self);
    if (free < CRACK_RAM) {
        // Platz schaffen: Phishing ist der erste Kandidat (es ist nur Ertrag).
        killPhishing(ns, self);
        if (freeRam(ns, self) < CRACK_RAM) return "RAM " + free.toFixed(1) + " GB";
    }
    want = Math.min(want, Math.max(1, Math.floor(freeRam(ns, self) / CRACK_RAM)));
    let pid = 0;
    try { pid = ns.exec(CRACK_FILE, self, want, host); } catch (e) { pid = 0; }
    if (pid > 0) {
        CRACK_STARTED.set(host, ROUND);
        tell(ns, ["CRACKOP", host, String(want),
            d ? String(d.requiredCharismaSkill === undefined ? "?" : d.requiredCharismaSkill) : "?",
            d ? String(d.modelId || "?") : "?"]);
        return "";
    }
    return "exec=0";
}


/**
 * Labyrinth-Nachbar behandeln.
 * Geknackt -> Roamer drauf (der Server hat 128 GB und traegt nach dem Durchlauf
 * einen "the_great_work"-Cache, den nur ein Roamer oeffnen kann).
 * Noch nicht geknackt -> Laeufer starten, sofern DIESER Roamer das Mandat hat.
 */
function handleLab(ns, host, d, roamer) {
    labNeighbor = host;                 // v3.14: dieser Server liegt am Labyrinth
    if (safeRoot(ns, host)) {
        labFocus = false;               // geloest -> Vorrang wieder aufheben
        // v4.1 — GELOESTES LABYRINTH MIT OFFENEM CACHE: LAEUFER STARTEN.
        // Im Livelauf lag auf cru3l_l4byr1nth dauerhaft ein Cache, den niemand
        // oeffnen konnte: harvestRemote und spread brauchen eine Session, und das
        // Lab-Passwort kannte nur der Laeufer, der es damals geloest hat — es war
        // mit seinem Prozess verloren. Der Laeufer kann sich aber BEIDES neu holen:
        // auf einem bereits geloesten Lab gibt handleLabyrinthPassword bei einem
        // beliebigen Zug sofort Success zurueck, samt Passwort in data
        // (labyrinth.ts:267-273), und addSessionToServer bindet die Session an
        // SEINE PID. Er ist damit der einzige Prozess, der den Cache ernten kann.
        // Genau dafuer hat schwarm-lab.js seit v3.13 den probe-Zweig im Kopf.
        if (!ensureSession(ns, host, d) && labCacheOpen(ns, host)) {
            ensureLabRunner(ns, host, d);
            return false;
        }
        // v3.10: ZUERST den Cache ernten, dann erst den Roamer ansiedeln.
        // In "the_great_work_XYZ.cache" steckt die Augmentierung, und ohne sie
        // schaltet getCurrentLabName() das naechste Lab nicht frei. Das darf
        // nicht davon abhaengen, ob gerade ein Roamer Platz findet.
        confirmRemote(ns, host);
        harvestRemote(ns, host, roamer);
        if (isOccupied(ns, host, roamer)) return true;
        if (spread(ns, host, roamer)) { tell(ns, ["LABDONE", host]); return true; }
        return false;   // Cache laeuft trotzdem — naechste Runde erneut
    }
    const self = ns.getHostname();
    tell(ns, ["LABFOUND", host, self]);
    if (!hasLabMandate(ns, self)) { labFocus = false; return false; }
    // v3.14 — LAB-VORRANG. Hat DIESER Roamer das Mandat und ist das Labyrinth noch
    // ungeloest, tritt alles andere zurueck: kein neues Phishing, keine Cache-Ops,
    // der Platz des Laeufers bleibt frei. Das Labyrinth ist der einzige Pfad zur
    // naechsten Augmentierung und damit zum naechsten Lab — Ertrag laesst sich
    // jederzeit nachholen, ein abgebrochener Maze-Lauf nicht (die Position haengt
    // an der PID des Laeufers und ist mit ihm verloren).
    labFocus = true;
    ensureLabRunner(ns, host, d);
    return false;
}

/**
 * Darf DIESER Roamer den Labyrinth-Laeufer starten?
 *
 * v3.8 — GRUND FUER DAS OST/WEST-PENDELN. Das Labyrinth haengt laut
 * NetworkGenerator an JEDEM Server der Tiefe getNetDepth()-1. Seit v3.7 sitzt
 * auf jedem davon ein Roamer, und jeder startete seinen eigenen Laeufer.
 * Jeder Prozess hat eine eigene PID und damit eine eigene Position im selben
 * Maze (DarknetState.labLocations[pid]) — im Log sah das aus wie ein einzelner
 * Laeufer, der ziellos hin- und herspringt.
 *
 * Das Mandat vergibt der DAEMON, der als einziger die Gesamtsicht hat: er
 * schreibt "labrunner=<host>" in den Statusblock auf Port 20 (peek, 0 GB).
 * Bekommen wir gar keine Antwort (Daemon tot oder noch nicht so weit), starten
 * wir nach LAB_CLAIM_GRACE Runden trotzdem — ein Laeufer zu viel ist besser als
 * gar keiner.
 */
function hasLabMandate(ns, self) {
    let txt = "";
    try { txt = String(readDnetOut(ns).status || ""); } catch (e) { txt = ""; }
    const m = txt.match(/labrunner=([^|]*)/);
    if (m) {
        const who = m[1].trim();
        if (who === self) { labWaited = 0; return true; }
        if (who && who !== "-") { labWaited = 0; return false; }
    }
    labWaited++;
    return labWaited >= LAB_CLAIM_GRACE;
}

/** Startet schwarm-lab.js lokal, falls er nicht schon laeuft. */
function ensureLabRunner(ns, labHost, d) {
    if (!LAB_ON) return;
    const self = ns.getHostname();
    if (labRunning(ns, self)) return;
    if (!ns.fileExists(LAB_FILE, self)) { tell(ns, ["LABERR", labHost, "schwarm-lab.js fehlt auf " + self]); return; }
    let pid = ns.exec(LAB_FILE, self, 1, labHost);
    if (pid === 0) {
        // Der Dauer-Phisher belegt allen freien RAM. Er weicht kurz; ensurePhishing
        // zieht ihn danach mit dem Rest wieder hoch.
        killPhishing(ns, self);
        pid = ns.exec(LAB_FILE, self, 1, labHost);
    }
    if (pid === 0) { killCacheOps(ns, self); pid = ns.exec(LAB_FILE, self, 1, labHost); }
    if (pid > 0) {
        tell(ns, ["LABRUN", labHost, self, String(d && d.requiredCharismaSkill !== undefined ? d.requiredCharismaSkill : "?")]);
    } else {
        tell(ns, ["LABERR", labHost, "Laeufer nicht startbar auf " + self + " (~" + LAB_RAM_GUESS + " GB noetig)"]);
    }
}

/** Liegt auf dem Labyrinth noch ein Cache? ns.ls braucht keine Session. */
function labCacheOpen(ns, host) {
    try {
        for (const f of (ns.ls(host) || [])) if (String(f).endsWith(".cache")) return true;
    } catch (e) { /* Server weg */ }
    return false;
}

function labRunning(ns, self) {
    try { return ns.ps(self).some((p) => p.filename === LAB_FILE || p.filename === "/" + LAB_FILE); }
    catch (e) { return false; }
}

function assembleCandidates(res, host, clues, manual) {
    const cands = [];
    const add = (p) => { if (p != null && !cands.includes(p)) cands.push(p); };
    add(manual.byHost[host]);
    add(clues.byHost[host]);
    for (const p of res.candidates) add(p);
    for (const p of manual.loose) add(p);
    for (const p of clues.loose) add(p);
    return cands;
}

// v4.8 — HIER STANDEN tryAuth() UND scrapeLogs(). BEIDE WAREN TOT.
//
// Sie wurden nirgends gerufen — und kosteten trotzdem RAM. In Bitburner
// zaehlt der BLOSSE BEZEICHNER einer ns-Funktion in die Skript-Kosten,
// nicht der Aufruf. Die beiden brachten dem Roamer damit dauerhaft mit:
//     ns.dnet.authenticate   0,4 GB   (RamCostGenerator.ts:238)
//     ns.dnet.heartbleed     0,6 GB   (RamCostGenerator.ts:241)
// zusammen 1,0 GB auf JEDEM Darknet-Rechner, auf dem ein Roamer laeuft.
//
// Beide APIs kamen im gesamten Roamer NUR in diesen beiden Funktionen vor;
// die Arbeit macht seit v4.0 der eigene Knack-Prozess (schwarm-crack.js).
// Der Kommentar an CRACK_RAM sagt das sogar schon: "Basis 1,6 + auth 0,4
// + heartbleed 0,6" — dort gehoeren sie hin, hier nicht.
//
// Weniger RAM je Roamer heisst mehr Hosts, auf die er ueberhaupt passt
// (spread prueft den freien Speicher gegen roamerNeed).
function onCracked(ns, host, pw, d, roamer, via) {
    rememberPassword(ns, host, pw);
    tell(ns, ["PW", host, pw, via]);
    tell(ns, ["MAP", host, String(d.depth === undefined ? "?" : d.depth), d.modelId === undefined ? "?" : d.modelId]);
    spread(ns, host, roamer);
}

/**
 * Roamer auf einen geknackten Nachbarn setzen.
 *
 * Ein frisch geknackter Darknet-Server haelt fast seinen gesamten Speicher als
 * blockedRam beim Vorbesitzer (ramblock.ts) — es ist kein Platz fuer den Roamer,
 * exec liefert 0. memoryReallocation(host) nimmt aber ein ZIEL und verlangt nur
 * requireDirectConnection + requireAdminRights: der Block laesst sich von hier
 * aus raeumen.
 *
 * v3.7 BUGFIX: Dafuer braucht es LOKAL freien RAM — und den hat ein fertiger
 * Server nicht, weil ensurePhishing ihn komplett belegt und der Phish-Op seit v2
 * endlos laeuft. Deshalb weicht das Phishing hier zuerst; die Threadzahl wird
 * erst DANACH bestimmt.
 *
 * @returns {boolean} true, wenn der Roamer laeuft
 */
function spread(ns, host, roamer) {
    try {
        const files = [roamer];
        const self = ns.getHostname();
        // v3.13 — OHNE SESSION KEIN scp UND KEIN exec. Beweis in
        // NetscriptFunctions.ts: exec (Zeile 636) prueft requireAdminRights +
        // requireSession + requireDirectConnection, scp (Zeile 761)
        // requireAdminRights + requireSession. Sessions haengen an der PID
        // (authentication.ts:206) — wer den Server nicht SELBST geknackt hat,
        // braucht connectToSession mit dem Passwort. Genau das stand im Log als
        // "exec fehlgeschlagen trotz freiem RAM".
        // v4.0: Rueckgabewert AUSWERTEN. Vorher wurde ensureSession blind gerufen
        // und danach trotzdem gescp't — bei fehlendem Passwort lehnt die Engine ab
        // (NetscriptFunctions.ts:761) und wir haben nur eine nutzlose Ausnahme
        // erzeugt, deren Grund im Log als "Ausnahme: ..." landete statt als Klartext.
        if (!ensureSession(ns, host, null)) {
            PENDING_SPREAD.add(host);
            if (!SESSION_WARNED.has(host)) {
                SESSION_WARNED.add(host);
                tell(ns, ["NOSESSION", host, PWDB.has(host) ? "connectToSession abgelehnt" : "Passwort unbekannt"]);
            }
            return false;
        }
        // v4.0: Der SOLVER wandert NICHT mehr mit. Er kostet 22 GB und laeuft seit
        // v3.8 ausschliesslich auf home (codingcontract.* nehmen einen host-Parameter);
        // auf einem 16-GB-Darknet-Server ist er toter Ballast, der bei jedem spread
        // mitkopiert wurde.
        if (ns.fileExists(LAB_FILE, self)) files.push(LAB_FILE);
        // v4.0: der Knacker MUSS mit. Ohne ihn kann der neue Roamer kein Raetsel
        // loesen — er koennte nur ernten und roden und die Kette bricht ab.
        if (ns.fileExists(CRACK_FILE, self)) files.push(CRACK_FILE);
        ns.scp(files, host);
        // v4.1: KEINE Passwortliste mehr mitgeben. Der neue Roamer braucht sein
        // EIGENES Passwort nicht (fuer den eigenen Server ist man automatisch
        // authentifiziert, offlineServerHandling.ts:99), und die Passwoerter seiner
        // Nachbarn erarbeitet sein Knack-Op vor Ort. Die Spielerliste MANUAL wandert
        // weiter mit, weil handgeschriebene Eintraege netzweit gelten.
        try { if (ns.fileExists(MANUAL, self)) ns.scp(MANUAL, host); } catch (e) { /* optional */ }

        if (ns.exec(roamer, host, 1) > 0) {
            PENDING_SPREAD.delete(host);
            tell(ns, ["SPREAD", host, "ok"]);
            return true;
        }
        // v4.0.2 — REIHENFOLGE KORRIGIERT (Regression aus v4.0.1).
        // Die RAM-Diagnose stand hier VOR der Block-Behandlung und kehrte mit
        // return false zurueck. Ein frisch geknackter Darknet-Server haelt aber
        // fast seinen gesamten Speicher als blockedRam beim Vorbesitzer
        // (ramblock.ts, getRamBlock) — die Pruefung griff also IMMER, und der
        // RODE-Op, der genau diesen Block raeumt, wurde nie mehr gestartet.
        // Im Livelauf sichtbar als wachsende Aussaat-Spalte (3 -> 14) und
        // Fremdblock 148 -> 228 GB. Deshalb: erst roden, DANN ueber zu wenig
        // Platz klagen.
        let block = 0;
        try { block = ns.dnet.getBlockedRam(host); } catch (e) { block = 0; }
        PENDING_SPREAD.add(host);
        if (block <= 0) {
            // Kein Block, aber exec ging trotzdem nicht: jetzt ist die RAM-Frage
            // die richtige. Der Wert wird gemessen, nicht behauptet.
            const tgtFree = freeRam(ns, host);
            const need = roamerNeed(ns, roamer);
            if (tgtFree < need) {
                tell(ns, ["SPREAD", host, "Ziel voll: " + tgtFree.toFixed(1) + " von " +
                    safeMaxRam(ns, host) + " GB frei, " + need.toFixed(1) + " GB noetig (fremde Ops?)"]);
                return false;
            }
            if (!ns.fileExists(roamer, host)) {
                tell(ns, ["SPREAD", host, "scp hat den Roamer nicht abgelegt (Session/Rechte)"]);
                return false;
            }
        }
        if (block > 0) {
            // v4.0.2: Ausdrueckliche Duplikatpruefung. runDnetOp setzt zwar
            // preventDuplicates, das greift aber nur bei IDENTISCHEN Argumenten —
            // und die Iterationszahl wird an anderer Stelle dynamisch berechnet
            // (rodeIters). Ohne diese Pruefung koennen sich mehrere Ops auf
            // dasselbe Ziel stapeln und den Server belegen.
            if (opRunning(ns, self, DNET_OPS.RODE, host)) {
                tell(ns, ["SPREAD", host, "Roden laeuft bereits"]);
                return false;
            }
            if (freeRam(ns, self) < opRamCost(DNET_OPS.RODE)) killPhishing(ns, self);
            // v3.9: Cache-Ops sind kurzlebig und werden neu gestartet — die
            // Ausbreitung hat Vorrang.
            if (freeRam(ns, self) < opRamCost(DNET_OPS.RODE)) killCacheOps(ns, self);
            // v4.0.2: Threadzahl DECKELN und Reserve lassen. Vorher nahm dieser Op
            // mit maxThreads allen freien RAM — genau der Fehler, der in
            // manageBlock schon behoben war. Folge: fuer den Fremdblock des
            // ZWEITEN Nachbarn war nie Platz ("Roden nicht startbar: RAM knapp"),
            // und mit mehreren geknackten Nachbarn blieb die Ausbreitung stehen.
            // Der Abtrag pro Aufruf skaliert linear mit den Threads (ramblock.ts),
            // ein Monopol bringt aber nichts, wenn dafuer nichts anderes laeuft.
            const rodeT = Math.min(SPREAD_RODE_THREADS,
                maxThreads(ns, self, DNET_OPS.RODE, rodeReserve()));
            if (rodeT < 1) {
                tell(ns, ["SPREAD", host, "Roden vertagt: kein RAM frei (" +
                    freeRam(ns, self).toFixed(1) + " GB)"]);
                return false;
            }
            const op = runDnetOp(ns, DNET_OPS.RODE, {
                arg: host,
                iterations: RODE_MAX_ITERS,
                threads: rodeT,
            });
            tell(ns, ["SPREAD", host, op.ok
                ? "raeume " + Math.round(block) + " GB Fremdblock"
                : "Roden nicht startbar: " + (op.reason || "?")]);
            return false;
        }
        // v4.1: ECHTE DIAGNOSE. Die alte Meldung riet anhand der eigenen Liste.
        // ns.exec prueft fuer Darknet-Ziele drei Dinge (NetscriptFunctions.ts:636):
        // Adminrechte, PID-Session und DIREKTVERBINDUNG. Letztere fehlte in der
        // Diagnose voellig — und genau sie faellt bei Mutation weg
        // (NetworkMovement.ts trennt mit p=0,5 alle Verbindungen eines Servers),
        // waehrend Session und RAM unveraendert aussehen. Jetzt wird jede der drei
        // Bedingungen einzeln aus getServerDetails gelesen und benannt.
        let det = null;
        try { det = ns.dnet.getServerDetails(host); } catch (e) { det = null; }
        const why = !det ? "Server nicht lesbar"
            : det.isOnline === false ? "Server offline (Mutation?)"
            : det.isConnectedToCurrentServer === false ? "keine Direktverbindung mehr (Mutation)"
            : det.hasSession === false ? (PWDB.has(host) ? "Session abgelehnt trotz Passwort"
                                                        : "keine Session (Passwort unbekannt)")
            : "exec=0 bei erfuellten Bedingungen — Ziel evtl. gerade voll";
        tell(ns, ["SPREAD", host, why]);
        return false;
    } catch (e) {
        // v3.12: frueher nur ns.print — im Daemon-Log war davon nichts zu sehen.
        tell(ns, ["SPREAD", host, "Ausnahme: " + String(e && e.message ? e.message : e)]);
        return false;
    }
}

// =============================================================================
// Aktuellen Server: roden, looten, phishen
// =============================================================================

/**
 * RAM-Block roden: kleine sofort; grosse erst per Stasis sichern, dann roden.
 *
 * v3.8:
 *   - Die Iterationszahl kommt aus dem tatsaechlichen Abtrag je Aufruf
 *     (ramblock.ts: getRamBlockRemoved) statt aus einer festen 200. Bei einem
 *     tiefen Server mit grossem Block reichte die feste Zahl nicht, der Op
 *     endete auf halber Strecke.
 *   - RODED wird beim BIGBLOCK-Abbruch NICHT mehr gesetzt. Vorher hiess
 *     "Stasis-Limit gerade erreicht" faelschlich "dieser Server wird nie wieder
 *     gerodet" — auch wenn zehn Minuten spaeter ein Stasis-Platz frei wurde.
 *     Stattdessen Pause und neuer Anlauf.
 */
function manageBlock(ns, self) {
    if (!RODE_ON) { RODED = true; return; }
    if (!lootCleared()) return;
    let block = 0;
    try { block = ns.dnet.getBlockedRam(self); } catch (e) { /* */ }
    if (block <= 0) { RODED = true; rodeRecheck = ROUND + RODE_RECHECK; return; }
    // v4.0: Im Kahlschlag wird die Stasis-Pause ignoriert — sie soll den
    // Normalbetrieb entlasten, nicht eine ausdrueckliche Raeumung blockieren.
    if (ROUND < bigBlockUntil && !sweepActive()) return;     // Stasis-Pause laeuft
    if (opRunning(ns, self, DNET_OPS.RODE, self)) return;    // laeuft schon fuer diesen Server

    // v4.0 — RAM FUER DIE KNACK-OPS FREILASSEN.
    // Der RODE-Op lief bisher mit maxThreads, also mit ALLEM freien RAM. Danach
    // fand kein Knack-Op mehr Platz (3 GB je Thread) — genau derselbe Fehler wie
    // beim Phishing, nur eine Stufe frueher. Im Mock-Harness belegte das Roden
    // 54,6 von 64 GB und die Erschliessung stand still, obwohl vier Ziele offen
    // waren. Sind keine Ziele offen, darf das Roden weiterhin alles nehmen.
    const threads = maxThreads(ns, self, DNET_OPS.RODE, rodeReserve());
    if (threads < 1) return;
    const iters = rodeIters(ns, self, block, threads);

    if (block <= RODE_MAX_BLOCK) {
        runDnetOp(ns, DNET_OPS.RODE, { arg: self, iterations: iters, threads: threads });
        return;
    }

    if (!STASIS_ON) { tell(ns, ["BIGBLOCK", self, String(Math.round(block))]); RODED = true; return; }
    const linked = safeStasisList(ns);
    if (linked.includes(self)) {
        runDnetOp(ns, DNET_OPS.RODE, { arg: self, iterations: Math.max(iters, BIG_RODE_ITERS), threads: threads });
    } else if (linked.length < safeStasisLimit(ns)) {
        runDnetOp(ns, DNET_OPS.STASIS, {});
    } else if (sweepActive()) {
        // v4.0: Alle Stasis-Plaetze belegt, aber ein Kahlschlag laeuft. Stasis
        // beschleunigt das Roden nur (ramblock.ts), es ist keine Voraussetzung —
        // also ohne Stasis roden statt die Arbeit liegen zu lassen.
        runDnetOp(ns, DNET_OPS.RODE, { arg: self, iterations: Math.max(iters, BIG_RODE_ITERS), threads: threads });
    } else {
        // Stasis-Plaetze belegt: spaeter erneut, NICHT dauerhaft aufgeben.
        tell(ns, ["BIGBLOCK", self, String(Math.round(block))]);
        bigBlockUntil = ROUND + BIGBLOCK_RETRY;
    }
}

/**
 * Wie viele memoryReallocation-Aufrufe braucht dieser Block?
 * ramblock.ts: entfernt = 0,02 * 2*0,92^(difficulty+1) * threads * (1 + cha/100),
 * gedeckelt auf den Restblock. Ohne Kenntnis von difficulty/Charisma wird
 * konservativ mit dem ungeguenstigsten Fall gerechnet und 20 % Reserve
 * aufgeschlagen; nach oben deckelt RODE_ITERS_MAX.
 */
function rodeIters(ns, self, block, threads) {
    let diff = 30;
    try {
        const d = ns.dnet.getServerDetails(self);
        if (d && Number.isFinite(Number(d.difficulty))) diff = Number(d.difficulty);
    } catch (e) { /* */ }
    const perCall = 0.02 * 2 * Math.pow(0.92, diff + 1) * Math.max(1, threads);
    if (!(perCall > 0)) return RODE_ITERS_MAX;
    return Math.max(RODE_MAX_ITERS, Math.min(RODE_ITERS_MAX, Math.ceil((block / perCall) * 1.2)));
}

/**
 * Caches oeffnen.
 *
 * v3.8 BUGFIX — HIER WURDEN CACHES ALS ERLEDIGT ABGEHAKT, DIE NIE AUFGINGEN.
 * Vorher stand da __SCHWARM_BT__if (op.ok) OPENED.add(f)__SCHWARM_BT__. op.ok heisst aber nur "Prozess
 * gestartet". openCache WIRFT bei ungueltigem oder unbekanntem Pfad
 * (Darknet.ts: helpers.errorMessage), der Op faengt das ab und meldet
 * "CACHE:ERR" — der Roamer hatte die Datei da laengst in OPENED und fasste sie
 * nie wieder an.
 * Jetzt wird der WELTZUSTAND geprueft: openCache entfernt den Eintrag aus
 * server.caches, die Datei verschwindet also aus ns.ls. Ist sie in der naechsten
 * Runde weg, hat es geklappt. Ist sie noch da und der Op laeuft nicht mehr,
 * war es ein Fehlschlag — nach CACHE_MAX_TRIES wird sie aufgegeben und gemeldet,
 * statt still den Server zu blockieren.
 */
function harvestServer(ns, self) {
    const files = safeLs(ns, self);
    const present = new Set(files);

    // Ergebnis der letzten Runde auswerten.
    for (const [f, tries] of [...CACHE_TRIES.entries()]) {
        if (f.indexOf("/") >= 0) continue;            // Fern-Schluessel (host/datei)
        if (!present.has(f)) {                       // aus ns.ls verschwunden = geoeffnet
            CACHE_TRIES.delete(f);
            OPENED.set(f, Infinity);                  // wirklich weg: nie wieder
            tell(ns, ["LOOT", self, "cache:" + f]);
            continue;
        }
        if (opRunning(ns, self, DNET_OPS.CACHE, f)) continue;   // laeuft noch
        if (tries >= CACHE_MAX_TRIES) {
            CACHE_TRIES.delete(f);
            // v4.0: NICHT MEHR ENDGUELTIG AUFGEBEN. Vorher landete die Datei in
            // OPENED und wurde bis zum Prozessende nie wieder angefasst — obwohl
            // der Fehlschlag meist an fehlendem RAM lag (der Op startete gar nicht)
            // und nicht am Cache. So sind die Halden entstanden.
            OPENED.set(f, ROUND + RETRY_AFTER);
            tell(ns, ["CACHEFAIL", self, f + " (neuer Anlauf in " + RETRY_AFTER + " Runden)"]);
        }
    }

    const caches = files.filter((f) => f.endsWith(".cache") && cacheDue(f));
    if (caches.length) {
        // v3.9: Deckel. Phishing legt bei JEDEM Treffer einen ".d.cache" an
        // (cacheFiles.ts) — ohne Begrenzung starten beliebig viele Cache-Ops zu je
        // 3,6 GB und fuellen den Server. killPhishing hilft dann nicht mehr, weil
        // die Blocker keine Phish-Ops sind. Der Rest wartet auf die naechste Runde.
        let started = cacheOpsRunning(ns, self);
        const limit = cacheOpsLimit();
        for (const f of caches) {
            if (labFocus && freeRam(ns, self) < LAB_RAM_GUESS + opRamCost(DNET_OPS.CACHE)) break;
            if (started >= limit) break;
            if (opRunning(ns, self, DNET_OPS.CACHE, f)) continue;
            if (freeRam(ns, self) < opRamCost(DNET_OPS.CACHE)) killPhishing(ns, self);
            // Platz fuer einen Ausbreitungs-Op freilassen — im Kahlschlag nicht,
            // dort ist das Abraeumen die einzige Aufgabe.
            const keep = sweepActive() ? 0 : opRamCost(DNET_OPS.RODE);
            if (freeRam(ns, self) < opRamCost(DNET_OPS.CACHE) + keep) break;
            const tries = CACHE_TRIES.get(f) || 0;
            // v4.0 BUGFIX — DER ZWEITE ANLAUF WAR SCHAEDLICH, NICHT NUR NUTZLOS.
            // Er reichte den Pfad mit vorangestelltem "/" ein. openCache
            // (Darknet.ts:321-331) prueft mit dem AUFGELOESTEN Pfad
            // (resolveCacheFilePath -> resolveFilePath streift ein fuehrendes "/"
            // ab, FilePath.ts:60-63), LOESCHT aber mit dem ROHEN String:
            //   server.caches = server.caches.filter(c => c !== fileName)
            // Bei "/x.cache" passt die Pruefung also, das Loeschen greift nicht —
            // getRewardFromCache laeuft trotzdem. Ergebnis: Belohnung kassiert,
            // Datei bleibt fuer immer liegen, unsere Weltzustands-Pruefung meldet
            // "Fehlschlag", nach drei Anlaeufen war sie dauerhaft abgeschrieben.
            // Genau das ist die Cache-Halde. Jetzt IMMER exakt der ns.ls-String.
            const op = runDnetOp(ns, DNET_OPS.CACHE, { arg: f, name: f });
            if (op.ok) { CACHE_TRIES.set(f, tries + 1); started++; }
        }
    }
    if (!stormReported && files.includes(STORM_SEED_FILE)) { tell(ns, ["STORM", self]); stormReported = true; }
}

/**
 * Dauer-Phishing mit allem freien RAM. Laeuft es mit weniger Threads als moeglich
 * (z.B. nachdem ein Op RAM freigegeben hat), wird es neu aufgezogen.
 */
function ensurePhishing(ns, self) {
    if (!PHISH_ON) return;
    // v3.14: Im Lab-Vorrang wird KEIN neues Phishing aufgezogen. Der Laeufer muss
    // jederzeit neu starten koennen, falls er stirbt — und dafuer braucht es Platz,
    // nicht die letzten 3,6 GB Ertrag.
    if (labFocus) return;
    // v4.0: Im Kahlschlag ruht Phishing ganz. Es ist die QUELLE neuer Caches
    // (cacheFiles.ts legt bei jedem Treffer eine ".d.cache" an) — waehrend einer
    // Raeumung wuerde es gegen die eigene Abarbeitung anschreiben.
    if (sweepActive()) return;
    // Ein laufender Labyrinth-Laeufer ist bereits in getServerUsedRam enthalten,
    // sein Platz wird hier also nicht mit verplant.
    const per = opRamCost(DNET_OPS.PHISH);
    const procs = phishProcs(ns, self);
    const running = procs.reduce((s, p) => s + p.threads, 0);
    // v3.9: RESERVE. Vorher wurde JEDES freie GB verphisht. Danach kann kein
    // RODE-Op mehr starten, um den Fremdblock eines frisch geknackten Nachbarn zu
    // raeumen — die Ausbreitung erstickt am eigenen Ertrag. killPhishing in
    // spread() faengt das zwar ab, aber nur fuer Phish-Ops; laeuft daneben noch
    // ein Cache-Op, reicht es trotzdem nicht. Also von vornherein Platz lassen.
    const reserve = opRamCost(DNET_OPS.RODE) + opRamCost(DNET_OPS.CACHE);
    const want = Math.floor((freeRam(ns, self) + running * per - reserve) / per);
    if (want < 1 || running >= want) return;
    // v4.0: Nur bei nennenswertem Zugewinn neu aufziehen. Vorher wurde der ganze
    // Phisher fuer einen einzigen Thread mehr abgeschossen und neu gestartet —
    // bei jeder Runde, in der ein Cache-Op gerade RAM freigab. Jeder Neustart
    // verwirft den laufenden phishingAttack (die Wartezeit war umsonst).
    if (running > 0 && want - running < Math.max(2, running * 0.25)) return;
    for (const p of procs) { try { ns.kill(p.pid); } catch (e) { /* */ } }
    runDnetOp(ns, DNET_OPS.PHISH, { iterations: PHISH_ITERS, threads: want });
}

/**
 * CACHES AUF EINEM NACHBARN OEFFNEN, OHNE DASS DORT EIN ROAMER LAEUFT.
 *
 * v3.10 — DAS WAR DIE SACKGASSE AM LABYRINTH. Der entscheidende Satz steht in
 * Darknet.ts: openCache ruft expectRunningOnDarknetServer(ctx) — verlangt also
 * nur, dass das SKRIPT auf dem Zielserver laeuft. Ein kompletter Roamer ist
 * dafuer nicht noetig, genau wie bei phishingAttack.
 *
 * Warum das am Labyrinth entscheidend ist (labyrinth.ts:308-315): Beim Erreichen
 * des Endpunkts setzt die Engine hasAdminRights und legt "the_great_work_XYZ.cache"
 * auf den Lab-Server (beim BonusLab gleich dreimal). In DIESEM Cache steckt die
 * Augmentierung — cacheFiles.ts getLabReward() ruft Player.queueAugmentation().
 * Ohne geoeffneten Cache gibt es die Aug nicht, ohne die Aug schaltet
 * getCurrentLabName() das naechste Lab nicht frei: der Fortschritt steht still.
 * Bis v3.9 haing das daran, dass erst ein Roamer auf dem Lab landen musste.
 * Jetzt genuegt ein 3,6-GB-Wegwerf-Op, den wir von hier aus hinueberschieben.
 *
 * Der Op besetzt den Server NICHT dauerhaft (er endet nach dem Oeffnen) und
 * blockiert die spaetere Ansiedlung nicht, weil isOccupied seit v3.7 nur noch
 * auf den Roamer prueft.
 */
function harvestRemote(ns, host, roamer, d) {
    if (!REMOTE_HARVEST) return;
    if (!safeRoot(ns, host)) return;            // ohne Admin-Rechte kein Zugriff
    if (isOccupied(ns, host, roamer)) return;   // dort erntet der eigene Roamer
    // v3.13: ohne Session lehnt die Engine scp und exec ab (NetscriptFunctions.ts).
    if (!ensureSession(ns, host, d)) {
        if (!SESSION_WARNED.has(host)) {
            SESSION_WARNED.add(host);
            tell(ns, ["NOSESSION", host, PWDB.has(host) ? "connectToSession abgelehnt" : "Passwort unbekannt"]);
        }
        return;
    }

    let files = [];
    try { files = ns.ls(host) || []; } catch (e) { return; }
    const caches = files.filter((f) => f.endsWith(".cache") && cacheDue(host + "/" + f));
    if (caches.length === 0) return;

    let free = 0, running = 0;
    try {
        free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        running = ns.ps(host).filter((p) => p.filename.indexOf("dnet-op-cache") >= 0).length;
    } catch (e) { return; }

    const per = opRamCost(DNET_OPS.CACHE);
    let started = running;
    const limit = cacheOpsLimit();
    for (const f of caches) {
        if (started >= limit) break;
        if (free < per) break;
        const key = host + "/" + f;
        const tries = CACHE_TRIES.get(key) || 0;
        if (tries >= CACHE_MAX_TRIES) {
            CACHE_TRIES.delete(key);
            OPENED.set(key, ROUND + RETRY_AFTER);     // v4.0: Frist statt Endstation
            tell(ns, ["CACHEFAIL", host, f + " (fern, neuer Anlauf spaeter)"]);
            continue;
        }
        const file = opFileName(DNET_OPS.CACHE, f);
        try {
            if (ns.ps(host).some((p) => p.filename === file || p.filename === file.replace(/^\\//, ""))) continue;
            ns.write(file, buildOpScript(DNET_OPS.CACHE), "w");
            ns.scp(file, host);
            // v4.0: exakt der ns.ls-String, siehe Begruendung in harvestServer —
            // ein vorangestelltes "/" laesst openCache die Belohnung zahlen, ohne
            // den Cache zu entfernen.
            const pid = ns.exec(file, host, 1, f, 1);
            if (pid > 0) {
                CACHE_TRIES.set(key, tries + 1);
                started++; free -= per;
                tell(ns, ["RLOOT", host, f]);
            } else {
                tell(ns, ["CACHEFAIL", host, f + " (exec=0, frei " + free.toFixed(1) + " GB)"]);
            }
        } catch (e) { tell(ns, ["CACHEFAIL", host, f + ": " + String(e && e.message ? e.message : e)]); }
    }
}

/**
 * SESSION FUER EINEN FREMDEN DARKNET-SERVER BESORGEN.
 *
 * v3.12 — der fehlende Baustein. Sessions haengen an der PID des Skripts
 * (authentication.ts:206: serverState.authenticatedPIDs.includes(pid)). Wer einen
 * Server knackt, authentifiziert damit nur SICH SELBST. Ein per ns.exec dort
 * gestarteter Roamer hat eine neue PID und ist NICHT authentifiziert — jeder
 * dnet-Call mit requireSession scheitert dann mit AuthFailure und der Meldung
 * "requires a session to do that. Use ns.dnet.connectToSession() first".
 *
 * Fuer den EIGENEN Server ist man automatisch authentifiziert
 * (offlineServerHandling.ts:99: "We always are authed to ourselves and DarkWeb"),
 * fuer NACHBARN nicht. connectToSession(host, passwort) kostet 0,05 GB und
 * verlangt nur das Passwort — das kennen wir vom Knacken bzw. beim Labyrinth aus
 * der Erfolgsantwort (labyrinth.ts:273).
 */
function ensureSession(ns, host, d) {
    try { if (host === ns.getHostname()) return true; } catch (e) { /* */ }
    if (host === "darkweb") return true;                 // Sonderfall der Engine

    // v4.1 — DIE ENGINE FRAGEN, NICHT DIE EIGENE LISTE GLAUBEN.
    // getServerDetails liefert hasSession direkt (Darknet.ts:419-423):
    //   isAuthenticated(targetServer, ctx.workerScript.pid)
    // Bis v4.0.2 entschied stattdessen die Modulvariable SESSIONS. Die wird beim
    // Knacken gesetzt und danach nie geprueft — sie kann also behaupten, eine
    // Session zu haben, die es nicht mehr gibt. Genau daher die Log-Meldung
    // "exec abgelehnt trotz Session und freiem RAM": authenticatedPIDs liegen in
    // DarknetState.serverState, und das wird bei Mutation und bei jedem Prestige
    // geleert (DarknetState.ts:100, prestigeDarknetState). Gemessener Zustand
    // schlaegt gefuehrten Zustand.
    let det = d;
    if (!det) { try { det = ns.dnet.getServerDetails(host); } catch (e) { det = null; } }
    if (det && det.hasSession === true) { SESSIONS.add(host); return true; }
    if (det && det.hasSession === false) SESSIONS.delete(host);   // Liste korrigieren

    const pw = PWDB.get(host);
    if (pw === undefined) return false;
    try {
        const r = ns.dnet.connectToSession(host, String(pw));
        if (r && r.success) { SESSIONS.add(host); return true; }
    } catch (e) { /* naechste Runde */ }
    return false;
}

/** Passwort merken und an die Nachbarn weiterreichen (ueber die Manual-Datei). */
function rememberPassword(ns, host, pw) {
    if (pw === undefined || pw === null) return;
    PWDB.set(host, String(pw));
    SESSIONS.add(host);        // wer gerade geknackt hat, IST authentifiziert
}

/** Verschwundene Fern-Caches als geoeffnet vermerken (Weltzustand als Beleg). */
function confirmRemote(ns, host) {
    let files = [];
    try { files = ns.ls(host) || []; } catch (e) { return; }
    const present = new Set(files);
    for (const key of [...CACHE_TRIES.keys()]) {
        if (key.indexOf(host + "/") !== 0) continue;
        const f = key.slice(host.length + 1);
        if (!present.has(f)) {
            CACHE_TRIES.delete(key);
            OPENED.set(key, Infinity);   // bestaetigt geoeffnet (aus ns.ls verschwunden)
            tell(ns, ["LOOT", host, "cache:" + f]);
        }
    }
}

/**
 * Ist dieser Cache jetzt (wieder) dran? Ersetzt das frueher endgueltige
 * OPENED.has(). Infinity = bestaetigt geoeffnet (aus ns.ls verschwunden), eine
 * Zahl = Sperrfrist bis zu dieser Runde.
 */
function cacheDue(key) {
    const until = OPENED.get(key);
    if (until === undefined) return true;
    if (until === Infinity) return false;
    if (ROUND >= until) { OPENED.delete(key); return true; }
    return false;
}

function cacheOpsRunning(ns, self) {
    try { return ns.ps(self).filter((p) => p.filename.indexOf("dnet-op-cache") >= 0).length; }
    catch (e) { return 0; }
}

function killCacheOps(ns, self) {
    try {
        for (const p of ns.ps(self).filter((x) => x.filename.indexOf("dnet-op-cache") >= 0)) {
            try { ns.kill(p.pid); } catch (e) { /* */ }
        }
    } catch (e) { /* */ }
}

function safeMaxRam(ns, host) {
    try { return ns.getServerMaxRam(host) || 0; } catch (e) { return 0; }
}

function killPhishing(ns, self) {
    for (const p of phishProcs(ns, self)) { try { ns.kill(p.pid); } catch (e) { /* */ } }
}

// =============================================================================
// Contract-Solver (Payload) + Promote (Trader-gesteuert)
// =============================================================================

/**
 * Contracts MELDEN statt loesen.
 *
 * v3.8: Der Solver braucht 22,0 GB (Basis 1,6 + attempt 10 + getContractType 5
 * + getData 5 + scan/ls 0,4). Darknet-Server haben laut getMaxRam bis Tiefe 5
 * genau 16 GB, davon belegt der Roamer 8,85 — lokal loesen konnte also nie
 * klappen, es kam nur "CCT toobig". codingcontract.attempt/getContractType/
 * getData nehmen alle einen host-Parameter: der Daemon startet den Solver auf
 * home und arbeitet die gemeldeten Hosts von dort ab.
 */
function reportContracts(ns, self) {
    if (!SOLVE_ON) return;
    const ccts = safeLs(ns, self).filter((f) => f.endsWith(".cct"));
    for (const f of ccts) {
        // v4.0: CCT_SEEN speichert jetzt die RUNDE der letzten Meldung statt nur
        // "schon gemeldet". Vorher wurde ein Contract genau EINMAL gemeldet; ging
        // die Meldung verloren (Port 19 ist ein FIFO mit Kapazitaetsgrenze, der
        // Daemon liest hoechstens 500 Nachrichten je Runde) oder konnte der Solver
        // ihn nicht loesen, blieb er fuer immer liegen, weil der Daemon ihn beim
        // Solver-START aus seiner Liste nahm. Jetzt wird periodisch erinnert.
        const last = CCT_SEEN.get(f);
        if (last !== undefined && ROUND - last < RETRY_AFTER) continue;
        CCT_SEEN.set(f, ROUND);
        tell(ns, ["CCTFOUND", self, f]);
    }
    // Verschwundene .cct wieder freigeben, damit ein spaeter neu erzeugter
    // Contract gleichen Namens erneut gemeldet wird.
    for (const f of [...CCT_SEEN.keys()]) if (!ccts.includes(f)) CCT_SEEN.delete(f);
}

/**
 * Darf gerodet werden?
 *
 * v3.8 — DIE CACHE-SPERRE IST RAUS, SIE WAR DIE URSACHE FUER STEHENGEBLIEBENE
 * RAM-BLOECKE. Die alte Regel "erst alle Caches oeffnen, dann roden" ging davon
 * aus, dass die Cache-Menge endlich ist. Sie ist es nicht: jeder erfolgreiche
 * phishingAttack legt einen neuen ".d.cache" an (cacheFiles.ts), und Roden
 * erzeugt am Ende SELBST einen Cache (ramblock.ts: handleRamBlockClearedRewards).
 * Auf einem Server mit Dauerphishing entstehen sie also schneller, als ein
 * einzelner Cache-Op sie oeffnen kann — lootCleared() lieferte damit dauerhaft
 * false und manageBlock() wurde nie wieder aufgerufen.
 * Cache-Ernte und Roden laufen jetzt nebeneinander; sie behindern sich nicht,
 * beide weichen bei Platzmangel dem Phishing.
 */
function lootCleared() {
    return true;
}

/**
 * Promotet die vom Trader angeforderten Symbole (v4.2).
 *
 * VORHER: EIN Symbol (split(",")[0]), EINE Op je Server, 20 Iterationen. Der
 * Trader meldet aber bis zu PROMOTE_TOP_N Symbole, und die Ladungen zerfallen
 * je Marktzyklus um 60 % — ein einzelner 26-Sekunden-Schub je Runde kam gegen
 * den Zerfall nicht an.
 *
 * JETZT: bis zu PROMOTE_MAX_PARALLEL Symbole gleichzeitig, je 120 Iterationen.
 * Der Op-Dateiname traegt das Symbol, opRunning unterscheidet also je Symbol.
 */
/**
 * Wie viele Promote-Ops darf dieser Server gleichzeitig fahren? (v4.3)
 *
 * Solange noch Ziele offen sind, ist ERSCHLIESSUNG wertvoller als Volatilitaet:
 * ein zusaetzlicher geknackter Nachbar bringt einen weiteren Roamer UND dessen
 * RAM ins Netz, ein zweiter Promoter nur mehr Ladungen auf demselben Symbol.
 * Deshalb hoechstens EINE Op, solange die Karte nicht erschlossen ist — und
 * auch die nur, wenn nach dem Knack-Vorbehalt noch Platz bleibt.
 */
function promoteSlots(ns, self) {
    const frei = freeRam(ns, self) - rodeReserve();
    if (frei < opRamCost(DNET_OPS.PROMOTE)) return 0;
    if (openTargets > 0 || crackOpsRunning(ns, self) > 0) return 1;
    return PROMOTE_MAX_PARALLEL;
}

function maybePromote(ns, self) {
    if (!PROMOTE_ON) return;
    const syms = readPromoteRequest(ns);
    if (syms.length === 0) return;
    const slots = promoteSlots(ns, self);
    if (slots <= 0) return;
    const need = opRamCost(DNET_OPS.PROMOTE);
    let started = 0;
    for (const sym of syms) {
        if (started >= slots) break;
        if (opRunning(ns, self, DNET_OPS.PROMOTE, sym)) continue;
        // v4.3: Phishing darf weichen (es ist die nachrangigste Verwertung),
        // die Knack-Reserve NICHT — sie ist der Grund, warum der Roamer
        // ueberhaupt weiterkommt.
        if (freeRam(ns, self) - rodeReserve() < need) killPhishing(ns, self);
        if (freeRam(ns, self) - rodeReserve() < need) return;
        const op = runDnetOp(ns, DNET_OPS.PROMOTE, { arg: sym, iterations: PROMOTE_ITERS });
        if (!op.ok) return;
        started++;
        tell(ns, ["PROMOTE", self, sym]);
    }
}

/** Promote-Wuensche des Traders (peek, nicht-konsumierend). Immer ein Array. */
function readPromoteRequest(ns) {
    try {
        const v = readTraderOut(ns).promote;
        if (typeof v !== "string" || v === "NULL PORT DATA" || v === "NONE" || !v.trim()) return [];
        return v.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    } catch (e) { return []; }
}

// --- Prozess-/RAM-Helfer -----------------------------------------------------
function opRunning(ns, self, op, arg) {
    const n = arg === undefined ? "dnet-op-" + op
        : opFileName(op, arg).replace(/^\\//, "");
    try {
        return ns.ps(self).some((p) => (arg === undefined
            ? p.filename.indexOf(n) >= 0
            : (p.filename === n || p.filename === "/" + n)));
    } catch (e) { return false; }
}
function promoteRunning(ns, self) { return opRunning(ns, self, DNET_OPS.PROMOTE); }
function phishRam(ns, self) {
    return phishProcs(ns, self).reduce((s, p) => s + p.threads, 0) * opRamCost(DNET_OPS.PHISH);
}

function phishProcs(ns, self) {
    try { return ns.ps(self).filter((p) => p.filename.indexOf("dnet-op-phish") >= 0); }
    catch (e) { return []; }
}

function freeRam(ns, host) {
    try { return ns.getServerMaxRam(host) - ns.getServerUsedRam(host); } catch (e) { return 0; }
}

function maxThreads(ns, host, op, reserveGb) {
    const keep = Number(reserveGb) || 0;
    return Math.max(0, Math.floor((freeRam(ns, host) - keep) / opRamCost(op)));
}

/**
 * Wie viel RAM muss beim Roden fuer Knack-Ops frei bleiben?
 * Sind keine Ziele offen, nichts — dann ist Roden die sinnvollste Verwendung.
 * Ist die Lage noch unbekannt (erste Runde), wird von zwei Zielen ausgegangen.
 */
function rodeReserve() {
    if (openTargets === 0) return 0;
    // Unbekannte Lage (erste Runde) -> vom MAXIMUM ausgehen. Mit einer kleineren
    // Annahme belegte der RODE-Op in Runde 1 den Rest, lief weiter und blockierte
    // die Erschliessung fuer seine ganze Laufzeit — im Harness genau so gesehen.
    const n = openTargets < 0 ? CRACK_OPS_MAX : Math.min(CRACK_OPS_MAX, openTargets);
    return CRACK_RAM * n;
}

// =============================================================================
// Eingaben lesen: Clue-Dateien + manuelle Passwoerter
// =============================================================================

function readClues(ns, self) {
    const out = { byHost: {}, loose: [] };
    try {
        for (const f of safeLs(ns, self)) {
            if (!f.endsWith(".data.txt")) continue;
            let txt = "";
            try { txt = ns.read(f); } catch (e) { continue; }
            const m1 = txt.match(/Server:\\s*(\\S+)\\s*Password:\\s*"([^"]*)"/i);
            if (m1) out.byHost[m1[1]] = m1[2];
            const m2 = txt.match(/Remember this password:\\s*(.+)/i);
            if (m2) out.loose.push(m2[1].trim());
        }
    } catch (e) { /* */ }
    return out;
}

/**
 * LOKALE Passwortdatei lesen (dort schreibt der Knack-Op). Reines ns.read = 0 GB.
 * Format wie MANUAL: "<host>=<passwort>" je Zeile, "#" ist Kommentar.
 */
function readLocalPw(ns) {
    const out = { byHost: {}, loose: [] };
    try {
        for (const line of String(ns.read(PW_FILE) || "").split("\\n")) {
            const t = line.trim();
            if (!t || t.startsWith("#")) continue;
            const i = t.indexOf("=");
            if (i > 0) out.byHost[t.slice(0, i).trim()] = t.slice(i + 1);
        }
    } catch (e) { /* */ }
    return out;
}

// ENTFERNT in v4.1: writeManual — der Rumpf stand seither ohne Aufrufer hier
// herum und wurde am 14.09.2026 geloescht. Die Begruendung steht bei PW_FILE:
// der Knack-Op schreibt seine Funde LOKAL, nicht in die Spielerliste.
// schwarm-dnet-manual.txt bleibt als Handkanal bestehen (nur lesen) — sie
// kostet nichts, und ohne sie gaebe es keinen Weg, ein Passwort von Hand
// beizusteuern.

function readManual(ns) {
    const out = { byHost: {}, loose: [] };
    try {
        for (const line of String(ns.read(MANUAL) || "").split("\\n")) {
            const s = line.trim();
            if (!s || s.startsWith("#")) continue;
            const i = s.indexOf("=");
            if (i > 0) out.byHost[s.slice(0, i).trim()] = s.slice(i + 1);
            else out.loose.push(s);
        }
    } catch (e) { /* */ }
    return out;
}

/** Meldet neue lokale .txt-Passwortfunde an den Daemon (dedupliziert). */
function reportFindings(ns, self) {
    for (const f of safeLs(ns, self)) {
        if (!f.endsWith(".data.txt")) continue;
        let txt = "";
        try { txt = ns.read(f); } catch (e) { continue; }
        const m = txt.match(/Server:\\s*(\\S+)\\s*Password:\\s*"([^"]*)"/i);
        if (m) {
            const key = m[1] + "=" + m[2];
            if (!reportedPws.has(key)) { reportedPws.add(key); tell(ns, ["PW", m[1], m[2], "txt"]); }
        }
    }
}

// =============================================================================
// Kleinkram
// =============================================================================

function reportSelf(ns, self) {
    try {
        const d = ns.dnet.getServerDetails(self);
        const neighbors = safeProbe(ns).join(",");
        tell(ns, ["MAP", self, String(d && d.depth != null ? d.depth : "?"),
            (d && d.modelId) || "self", neighbors]);
    } catch (e) { /* */ }
}

/**
 * Besetzt = dort laeuft ein ROAMER.
 *
 * v3.7 RUECKBAU: v2 hatte hier zusaetzlich __SCHWARM_BT__p.filename.includes("dnet-op-")__SCHWARM_BT__
 * eingebaut, damit ein vom Roamer verlassener Server nicht sofort wieder einen
 * bekommt. Seit der Ruhestand abgeschaltet ist, bewirkt das nur noch Schaden:
 * jeder Server, auf dem irgendein Op laeuft (z.B. ein Phisher), galt als
 * versorgt und bekam NIE einen Roamer — damit endete die Erschliessung.
 */
function isOccupied(ns, host, roamer) {
    try {
        return ns.ps(host).some((p) => p.filename === roamer || p.filename === "/" + roamer);
    } catch (e) { return false; }
}

function safeRoot(ns, host) { try { return ns.hasRootAccess(host); } catch (e) { return false; } }
function safeStasisList(ns) { try { return ns.dnet.getStasisLinkedServers() || []; } catch (e) { return []; } }
function safeStasisLimit(ns) { try { return ns.dnet.getStasisLinkLimit() || 1; } catch (e) { return 1; } }
function safeProbe(ns) { try { return ns.dnet.probe() || []; } catch (e) { return []; } }
function safeLs(ns, host) { try { return ns.ls(host) || []; } catch (e) { return []; } }

/**
 * v3.13 — TRENNZEICHEN. Darknet-Hostnamen duerfen Sonderzeichen enthalten
 * (im Log gesichtet: "ech0:c0m", "hyper&ce11-corp", "gr4nny-5^5y573m5",
 * "neo@networks: solutions"). Ein Semikolon im Namen hat das bisherige Format
 * parts.join(";") zerlegt: der Daemon las verschobene Felder, legte Karteneintraege
 * unter Bruchstuecken an ("..." als Hostname) und kam so auf 13492 "gemappte"
 * Server. Unit Separator (0x1f) kommt in keinem Hostnamen vor.
 */
function tell(ns, parts) { pushTelemetry(ns, parts.join("\\u001f")); }

// Reine Funktionen nach aussen — kostet kein RAM, erlaubt aber Unit-Tests im
// Mock-Harness und spaeteres Nachschauen aus SCHWARM-DIAG heraus.
// Reine Funktionen nach aussen — kostet kein RAM, erlaubt aber Unit-Tests im
// Mock-Harness und spaeteres Nachschauen aus SCHWARM-DIAG heraus.
// v4.0: crack/solveFeedback/die Mathe-Helfer sind nach schwarm-crack.js gewandert
// und werden dort exportiert.
export { buildOpScript, opFileName, opRamCost, handleServer, isOccupied, spread,
    ensureLabRunner, harvestServer, manageBlock, reportContracts, hasLabMandate,
    ensurePhishing, lootCleared, harvestRemote, confirmRemote, ensureSession,
    rememberPassword, readLocalPw, PWDB, SESSIONS, readOrders, sweepActive, cacheDue,
    serveKnownNeighbors, backlogOpen, neighborsOpen, OPENED, CACHE_TRIES, ORDERS,
    targetCost, startCrackOp, crackRunning, crackOpsRunning, MODEL_EFFORT,
    CRACK_RAM, CRACK_OPS_MAX, CRACK_COST_SOFT, rodeReserve, maxThreads,
    solvableNow, FEEDBACK_MODELS, CHA_BLOCKED, playerCha, labCacheOpen, roamerNeed };

export function autocomplete() { return ["--tail"]; }
`;

const SRC_LAB = `/**
 * schwarm-lab.js — Labyrinth-Laeufer (SELF-CONTAINED Payload, v3.7).
 *
 * WARUM EIN EIGENER PROZESS?
 *   Die Position im Labyrinth haengt an der PID des aufrufenden Skripts
 *   (labyrinth.ts: DarknetState.labLocations[pid], getPositionInLab). Ein neuer
 *   Prozess faengt wieder am Anfang an. Bis v3.6 lief der Loeser deshalb IM
 *   Roamer — und blockierte dessen Schleife hunderte Zuege lang, waehrend
 *   nebenan die Erschliessung stillstand. Jetzt laeuft er daneben, ~2 GB.
 *
 * WAS SICH GEGENUEBER v3.6 MECHANISCH AENDERT (alles aus der Engine belegt):
 *   1. authenticate liefert bei Labyrinth-Servern message + data DIREKT zurueck
 *      (Darknet.ts: __SCHWARM_BT__if (isLabyrinthServer(...)) return {..., message, data}__SCHWARM_BT__).
 *      message nennt die neue Position ("You have moved to X,Y."), data ist der
 *      3x3-Ausschnitt um sie herum. Ein Zug liefert die Karte also gratis mit —
 *      das labreport() vor jedem Zug war eine komplette Auth-Wartezeit umsonst.
 *      labreport wird nur noch zum Synchronisieren gebraucht.
 *   2. labradar() kostet 0 GB und liefert 7x7 MIT Zielmarkierung "X"
 *      (getSurroundingsVisualized(..., 3, true, true)). Die Zug-Antworten haben
 *      showEnd=false — das Ziel ist also NUR ueber das Radar sichtbar.
 *   3. Das Maze ist NICHT perfekt: generateMaze naeht ab Breite 5 vier Teil-Mazes
 *      zusammen und schlaegt vier zusaetzliche Loecher in die Trennwaende. Es gibt
 *      also Schleifen. Statt DFS mit Rueckweg-Stapel wird eine Karte gefuehrt und
 *      per Breitensuche navigiert (unbekannte Waende optimistisch als frei).
 *   4. authenticate kann durch Netzinstabilitaet mit Code 408 abbrechen. Dann hat
 *      sich NICHTS bewegt. v3.6 hat das nicht unterschieden und die angenommene
 *      Position stillschweigend falsch fortgeschrieben.
 *   5. Maze-Groessen laut labData bis 60x40 (nicht 41x29): bis ~600 Zellen.
 *
 * Aufruf: ns.run("schwarm-lab.js", 1, "<labhost>")
 * Laeuft auf einem Server, der DIREKT mit dem Labyrinth verbunden ist —
 * labreport/labradar pruefen ctx.workerScript.hostname, nicht das Ziel.
 */

// Portnummer kommt von aussen — injectPorts() ersetzt die Marke beim
// Materialisieren durch die zentrale Tabelle (SCHWARM-HELPERS.js).
// Frueher stand hier eine gespiegelte 19; genau solche Spiegel haben zweimal
// eine Port-Kollision erzeugt (19 und 34).
/*__PORTS__*/
const TELEMETRY = SCHWARM_PORTS.DNET_IN;

const WALL = "\\u2588";      // █
const GOAL = "X";
// v4.1: Das Lab-Passwort gehoert zusaetzlich in die LOKALE Passwortdatei. Der
// Roamer auf demselben Server kann damit selbst eine Session zum Lab aufbauen
// (connectToSession) und den "the_great_work"-Cache fern ernten, ohne auf diesen
// Prozess zu warten. NIE ueber das Netz verteilen: nur direkte Nachbarn des Labs
// koennen dort ueberhaupt etwas starten (NetscriptFunctions.ts:636/761).
const PW_FILE = "dnet-pw.txt";
const ME = "@";

const RADAR_EVERY = 6;      // Radar-Aufruf alle n Zuege (kostet eine Auth-Wartezeit)
const MAX_MOVES = 6000;     // 60x40 -> ~600 Zellen, mit Umwegen reichlich bemessen
const CHA_SLEEP = 60000;    // Charisma zu niedrig -> so lange warten, dann neu
const STUCK_RESYNC = 4;     // so oft Position unklar -> labreport zum Abgleich
const REPORT_EVERY = 25;    // Fortschrittsmeldung alle n Zuege
const RAW_MOVES = 12;       // Diagnose: so viele Zuege lang die ROHEN Engine-Antworten
                            // melden (message + data zeilenweise). Damit laesst sich
                            // eine falsche Modellannahme sofort erkennen, statt sie aus
                            // dem Bewegungsmuster zu erraten. 0 = aus.
const MAX_COORD = 200;      // Sicherheitsgrenze (ausserhalb des Maze meldet die
                            // Engine PATH, siehe getSurroundingsVisualized)

const DIRS = [
    { name: "north", dx: 0, dy: -1 },
    { name: "east", dx: 1, dy: 0 },
    { name: "south", dx: 0, dy: 1 },
    { name: "west", dx: -1, dy: 0 },
];

/** Bekannte Felder: "x,y" -> true (frei) / false (Wand). Zellen UND Zwischenwaende. */
const grid = new Map();
let goal = null;            // [x,y], sobald das Radar ein "X" gezeigt hat
let pos = null;             // [x,y] aktuelle Position
let moves = 0;
let unclear = 0;

function key(x, y) { return x + "," + y; }
function setCell(x, y, free) {
    if (x < 0 || y < 0 || x > MAX_COORD || y > MAX_COORD) return;
    grid.set(key(x, y), free);
}
/** null = unbekannt, true = frei, false = Wand. */
function getCell(x, y) {
    const v = grid.get(key(x, y));
    return v === undefined ? null : v;
}

function tell(ns, parts) {
    // v3.13: Unit Separator statt ";" — Darknet-Hostnamen koennen Semikola
    // enthalten und haben das Feldformat des Daemons zerlegt.
    try { ns.getPortHandle(TELEMETRY).tryWrite(parts.join("\\u001f")); } catch (e) { /* */ }
}

/** Lab-Passwort lokal sichern (v4.1). ns.read/ns.write kosten 0 GB. */
function savePwLocal(ns, host, pw) {
    if (!pw) return;
    try {
        const lines = [];
        let found = false;
        for (const line of String(ns.read(PW_FILE) || "").split("\\n")) {
            const t = line.trim();
            if (!t) continue;
            const k = t.indexOf("=");
            if (k > 0 && !t.startsWith("#") && t.slice(0, k).trim() === host) {
                lines.push(host + "=" + pw); found = true;
            } else lines.push(line);
        }
        if (!found) lines.push(host + "=" + pw);
        ns.write(PW_FILE, lines.join("\\n"), "w");
    } catch (e) { /* Telemetrie ist der zweite Weg */ }
}

/**
 * Einen visualisierten Ausschnitt in die Karte uebernehmen.
 * Zeilen laufen von cy-range bis cy+range, Spalten von cx-range bis cx+range
 * (getSurroundingsVisualized). "@" = wir selbst, "X" = Ziel, beides begehbar.
 */
function absorb(text, cx, cy, range) {
    const lines = String(text === undefined || text === null ? "" : text).split("\\n");
    for (let i = 0; i < lines.length && i <= 2 * range; i++) {
        const row = lines[i];
        for (let j = 0; j < row.length && j <= 2 * range; j++) {
            const c = row[j];
            const x = cx - range + j;
            const y = cy - range + i;
            if (c === GOAL) { goal = [x, y]; setCell(x, y, true); continue; }
            if (c === ME) { setCell(x, y, true); continue; }
            setCell(x, y, c !== WALL);
        }
    }
}

/**
 * Breitensuche ueber Zellen (Schrittweite 2). Eine Kante gilt als begehbar, wenn
 * das Wandfeld dazwischen NICHT als Wand bekannt ist — unbekannt wird optimistisch
 * als frei behandelt. Stimmt das nicht, meldet der Zug es und die Karte korrigiert
 * sich; das kostet einen Zug, spart aber das systematische Abtasten.
 * @param {(x:number,y:number)=>boolean} isTarget
 * @returns {string[]|null} Richtungsnamen vom Start bis zum Ziel
 */
function bfs(isTarget) {
    if (!pos) return null;
    const start = key(pos[0], pos[1]);
    const prev = new Map();
    prev.set(start, null);
    let frontier = [[pos[0], pos[1]]];
    if (isTarget(pos[0], pos[1])) return [];
    let guard = 0;
    while (frontier.length > 0 && guard++ < 20000) {
        const next = [];
        for (const node of frontier) {
            const x = node[0], y = node[1];
            for (const d of DIRS) {
                if (getCell(x + d.dx, y + d.dy) === false) continue;   // bekannte Wand
                const nx = x + d.dx * 2, ny = y + d.dy * 2;
                if (nx < 0 || ny < 0 || nx > MAX_COORD || ny > MAX_COORD) continue;
                if (getCell(nx, ny) === false) continue;               // Zelle ist Wand
                const k = key(nx, ny);
                if (prev.has(k)) continue;
                prev.set(k, { from: key(x, y), dir: d.name });
                if (isTarget(nx, ny)) {
                    const path = [];
                    let cur = k;
                    while (true) {
                        const step = prev.get(cur);
                        if (!step) break;
                        path.unshift(step.dir);
                        cur = step.from;
                    }
                    return path;
                }
                next.push([nx, ny]);
            }
        }
        frontier = next;
    }
    return null;
}

/** Hat diese Zelle mindestens eine Kante, deren Wandstatus wir nicht kennen? */
function isFrontier(x, y) {
    for (const d of DIRS) {
        if (getCell(x + d.dx, y + d.dy) === null) return true;
        if (getCell(x + d.dx, y + d.dy) === true && getCell(x + d.dx * 2, y + d.dy * 2) === null) return true;
    }
    return false;
}

function planPath() {
    if (goal) {
        const p = bfs((x, y) => x === goal[0] && y === goal[1]);
        if (p && p.length > 0) return p;
    }
    return bfs((x, y) => !(x === pos[0] && y === pos[1]) && isFrontier(x, y));
}

function coordsFrom(msg) {
    const m = String(msg === undefined || msg === null ? "" : msg).match(/(\\d+)\\s*,\\s*(\\d+)/);
    return m ? [Number(m[1]), Number(m[2])] : null;
}

function isCharismaFail(r) {
    if (!r) return false;
    if (r.code === 451) return true;
    const m = String(r.message || "").toLowerCase();
    return m.indexOf("charismatic") >= 0 || m.indexOf("moxie") >= 0
        || m.indexOf("charming") >= 0 || m.indexOf("more charisma") >= 0;
}

/** Startposition und Umgebung holen. @returns {Promise<boolean>} */
async function sync(ns, labHost) {
    let rep = null;
    try { rep = await ns.dnet.labreport(); }
    catch (e) {
        tell(ns, ["LABERR", labHost, "labreport wirft: " + String(e && e.message ? e.message : e)]);
        return false;
    }
    if (!rep || rep.success !== true || !rep.coords) {
        // "You feel lost..."         -> in diesem BitNode gibt es kein Labyrinth
        // "You feel disconnected..." -> dieser Server ist NICHT direkt mit dem
        //                               Labyrinth verbunden (labreport prueft
        //                               ctx.workerScript.hostname, nicht das Ziel)
        tell(ns, ["LABERR", labHost, String((rep && rep.message) || "labreport ohne Ergebnis")]);
        return false;
    }
    pos = [Number(rep.coords[0]), Number(rep.coords[1])];
    setCell(pos[0], pos[1], true);
    for (const d of DIRS) {
        if (rep[d.name] === true) setCell(pos[0] + d.dx, pos[1] + d.dy, true);
        else if (rep[d.name] === false) setCell(pos[0] + d.dx, pos[1] + d.dy, false);
    }
    unclear = 0;
    return true;
}

async function radar(ns) {
    try {
        const r = await ns.dnet.labradar();
        if (r && r.success === true && pos) { absorb(r.message, pos[0], pos[1], 3); return true; }
    } catch (e) { /* naechste Runde */ }
    return false;
}

/** Rohe Engine-Antwort in die Telemetrie spiegeln (nur die ersten RAW_MOVES Zuege). */
function raw(ns, labHost, tag, r) {
    if (moves > RAW_MOVES) return;
    const msg = String((r && r.message) || "").replace(/;/g, ",");
    const dat = String((r && r.data) !== undefined ? r.data : "").split("\\n").join(" / ").replace(/;/g, ",");
    tell(ns, ["LABRAW", labHost, tag, "code=" + String(r && r.code), "msg=" + msg, "data=" + dat]);
}

/**
 * DEN CACHE AUF DEM LABYRINTH OEFFNEN.
 *
 * v3.13 — NUR DIESER PROZESS KANN DAS. ns.exec prueft fuer Darknet-Ziele
 * (NetscriptFunctions.ts:636) requireAdminRights + requireSession +
 * requireDirectConnection, ns.scp (Zeile 761) Adminrechte + Session.
 *   - Direktverbindung: der Laeufer sitzt auf einem direkten Nachbarn des Labs
 *     (labreport verlangt das ohnehin, sonst "You feel disconnected...").
 *   - Session: addSessionToServer(labServer, pid) beim Loesen — mit UNSERER PID.
 *     Sessions haengen an der PID (authentication.ts:206), kein anderer Prozess
 *     hat sie, und ein zweiter Prozess kaeme nur mit dem Passwort daran.
 * Der Daemon auf home kann es nicht (keine Direktverbindung), ein Roamer auf dem
 * Nachbarn nur mit dem Passwort — wir haben beides bereits.
 *
 * In "the_great_work_XYZ.cache" steckt die Augmentierung (labyrinth.ts:313,
 * cacheFiles.ts ruft Player.queueAugmentation). Ohne sie schaltet
 * getCurrentLabName() das naechste Lab nicht frei.
 */
async function harvestLab(ns, labHost) {
    let files = [];
    try { files = ns.ls(labHost) || []; } catch (e) { tell(ns, ["LABERR", labHost, "ls: " + e]); return; }
    const caches = files.filter((f) => String(f).endsWith(".cache"));
    if (caches.length === 0) { tell(ns, ["LABCACHE", labHost, "kein Cache vorhanden"]); return; }

    const OP = "/dnet-op-cache-lab.js";
    const body = "/** SCHWARM Lab-Cache-Op (auto-generiert). */\\n"
        + "export async function main(ns){\\n"
        + "  const f = String(ns.args[0]);\\n"
        + "  const tell = (m) => { try { ns.getPortHandle(" + TELEMETRY + ").tryWrite(ns.getHostname() + \\"\\\\u001f\\" + m); } catch(e){} };\\n"
        + "  try { const r = ns.dnet.openCache(f, true); tell(\\"CACHE:\\" + (r && r.success ? \\"OK\\" : \\"FAIL\\") + \\":\\" + f); }\\n"
        + "  catch(e){ tell(\\"CACHE:ERR:\\" + f + \\":\\" + e); }\\n"
        + "}\\n";
    try { ns.write(OP, body, "w"); } catch (e) { tell(ns, ["LABERR", labHost, "write: " + e]); return; }

    for (const f of caches) {
        let ok = false;
        try { ok = ns.scp(OP, labHost); } catch (e) { ok = false; }
        if (!ok) { tell(ns, ["LABCACHE", labHost, "scp abgelehnt (Session/Rechte) — " + f]); continue; }
        let pid = 0;
        try { pid = ns.exec(OP, labHost, 1, f); } catch (e) { pid = 0; }
        if (pid > 0) {
            tell(ns, ["LABCACHE", labHost, "oeffne " + f]);
            // Kurz warten und am Weltzustand pruefen: openCache entfernt den
            // Eintrag aus server.caches, die Datei verschwindet also aus ns.ls.
            for (let i = 0; i < 20; i++) {
                await ns.sleep(250);
                let still = true;
                try { still = (ns.ls(labHost) || []).includes(f); } catch (e) { still = false; }
                if (!still) { tell(ns, ["LABCACHEOK", labHost, f]); break; }
            }
        } else {
            tell(ns, ["LABCACHE", labHost, "exec abgelehnt (Session/Direktverbindung) — " + f]);
        }
    }
}

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const labHost = String(ns.args[0] || "");
    if (!labHost) { tell(ns, ["LABERR", "?", "kein Zielhost uebergeben"]); return; }

    tell(ns, ["LABSTART", labHost, ns.getHostname()]);
    // v3.13: Ist das Lab schon geloest, liegt der Cache evtl. noch da. Ein
    // beliebiger Zug liefert dann Success UND (labyrinth.ts:267) eine Session
    // fuer unsere PID — damit koennen wir sofort ernten.
    try {
        const probe = await ns.dnet.authenticate(labHost, "go north");
        if (probe && probe.success === true) {
            const pw = String(probe.data === undefined ? "" : probe.data);
            if (pw) { savePwLocal(ns, labHost, pw); tell(ns, ["LABPW", labHost, pw]); }
            tell(ns, ["LABOK", labHost, "0"]);
            await harvestLab(ns, labHost);
            return;
        }
    } catch (e) { /* normaler Fall: noch nicht geloest */ }
    if (!(await sync(ns, labHost))) return;
    await radar(ns);
    if (RAW_MOVES > 0) {
        tell(ns, ["LABRAW", labHost, "start", "pos=" + pos[0] + "," + pos[1],
            "felder=" + grid.size, "ziel=" + (goal ? goal[0] + "," + goal[1] : "-")]);
    }

    while (moves < MAX_MOVES) {
        const path = planPath();
        if (path === null || path.length === 0) {
            // Nichts mehr zu erkunden und kein Ziel in Sicht: einmal radarn, dann
            // aufgeben. Ein vollstaendig abgesuchtes Maze ohne Ziel bedeutet, dass
            // unsere Position nicht mehr stimmt.
            if (!(await radar(ns))) {
                tell(ns, ["LABERR", labHost, "kein Weg mehr planbar bei " + pos[0] + "," + pos[1]]);
                return;
            }
            if (planPath() === null) {
                if (!(await sync(ns, labHost))) return;
                if (planPath() === null) {
                    tell(ns, ["LABERR", labHost, "Maze abgesucht, kein Ziel gefunden"]);
                    return;
                }
            }
            continue;
        }

        const dirName = path[0];
        const d = DIRS.find((x) => x.name === dirName);
        let r = null;
        try { r = await ns.dnet.authenticate(labHost, "go " + dirName); }
        catch (e) {
            tell(ns, ["LABERR", labHost, "authenticate wirft: " + String(e && e.message ? e.message : e)]);
            return;
        }
        moves++;
        raw(ns, labHost, "go " + dirName, r);

        if (r && r.success === true) {
            // Deckt beide Erfolgswege ab: das Ziel erreicht ODER der Server hatte
            // bereits Admin-Rechte (handleLabyrinthPassword gibt dann sofort
            // Success zurueck).
            //
            // v3.12 — DAS PASSWORT MITNEHMEN. labyrinth.ts:273 gibt bei Erfolg
            // "data: labServer.password" zurueck. Ohne dieses Passwort kommt kein
            // ANDERER Prozess je an den Server heran: Sessions haengen an der PID
            // (authentication.ts:206), und addSessionToServer bekommt beim Loesen
            // nur die PID DIESES Laeufers. Jeder spaeter gestartete Roamer oder
            // Cache-Op braucht ns.dnet.connectToSession(host, passwort) — und
            // dafuer das Passwort. Bis v3.11 haben wir es weggeworfen; deshalb
            // blieb das geloeste Labyrinth fuer den Rest des Schwarms unerreichbar.
            const pw = String(r.data === undefined ? "" : r.data);
            if (pw) { savePwLocal(ns, labHost, pw); tell(ns, ["LABPW", labHost, pw]); }
            tell(ns, ["LABOK", labHost, String(moves)]);
            await harvestLab(ns, labHost);
            return;
        }
        if (r && r.code === 408) { continue; }            // Timeout: nichts bewegt
        if (isCharismaFail(r)) {
            tell(ns, ["LABCHA", labHost, String(r.message || "Charisma zu niedrig")]);
            await ns.sleep(CHA_SLEEP);
            continue;
        }

        const before = pos;
        const got = coordsFrom(r && r.message);
        if (got) {
            const moved = got[0] !== before[0] || got[1] !== before[1];
            pos = got;
            setCell(pos[0], pos[1], true);
            if (!moved && d) {
                // "You cannot go that way. You are still at X,Y." -> dort ist Wand.
                setCell(before[0] + d.dx, before[1] + d.dy, false);
            } else if (moved && d) {
                setCell(before[0] + d.dx, before[1] + d.dy, true);
            }
            if (r && r.data !== undefined) absorb(r.data, pos[0], pos[1], 1);
            unclear = 0;
        } else {
            unclear++;
            if (unclear >= STUCK_RESYNC) {
                if (!(await sync(ns, labHost))) return;
            }
        }

        if (moves % RADAR_EVERY === 0 && !goal) await radar(ns);
        if (moves % REPORT_EVERY === 0) {
            tell(ns, ["LAB", labHost, pos[0] + "," + pos[1], String(grid.size),
                String(moves), goal ? goal[0] + "," + goal[1] : "-"]);
        }
    }
    tell(ns, ["LABERR", labHost, "Zugbudget " + MAX_MOVES + " erschoepft"]);
}

export function autocomplete() { return ["--tail"]; }
`;

const SRC_CRACK = `/**
 * schwarm-crack.js — Darknet-Passwortknacker (SELF-CONTAINED Payload, v4.1).
 *
 * EIN ZIEL, EIN PROZESS, DANN ENDE. Wird vom Roamer gestartet:
 *   ns.exec("schwarm-crack.js", self, threads, zielhost)
 *
 * WARUM DAS AUS DEM ROAMER HERAUSGEZOGEN WURDE (drei Engine-Belege):
 *
 *   1. PARALLEL GEHT NUR MIT EIGENEN PROZESSEN. netscriptDelay
 *      (NetscriptHelpers.tsx:466-479) legt den laufenden Timer in EIN Feld je
 *      WorkerScript (ws.delay / ws.delayReject). Zwei gleichzeitige Auth-Aufrufe
 *      im selben Prozess ueberschreiben sich gegenseitig. Der Roamer konnte
 *      Nachbarn also nur STRENG NACHEINANDER knacken — und weil jeder Versuch
 *      echte Spielzeit kostet, blockierte ein einziges schweres Ziel die ganze
 *      Runde (Caches, Contracts, Roden, Aussaat kamen nicht dran).
 *
 *   2. THREADS BESCHLEUNIGEN DIE AUTHENTIFIZIERUNG. authenticate liest die
 *      Threadzahl des AUFRUFENDEN Skripts (Darknet.ts:125) und rechnet
 *      threadsFactor = 1 / (1 + 0,2 * (threads - 1)) in die Wartezeit
 *      (effects.ts:74). 5 Threads = 1,8-fach schneller, 10 Threads = 2,8-fach.
 *      Der Roamer lief immer mit 1 Thread; dieser Hebel lag brach. Tiefe
 *      Darknet-Server haben laut getMaxRam (DarknetServerOptions.ts:206)
 *      16 * 2^floor(difficulty/6) GB, also 128 bis 1024 GB — genau dort, wo die
 *      Raetsel teuer werden, ist massenhaft RAM frei.
 *
 *   3. EINE QUELLE. Der Cracker steht NUR hier, nicht zusaetzlich im Roamer.
 *      Eine zweite Kopie waere beim ersten neuen Modell auseinandergelaufen.
 *
 * PASSWORT-WEITERGABE (v4.1): bei Erfolg schreibt dieser Prozess das Passwort in
 * die LOKALE dnet-pw.txt (ns.write, 0 GB). Der Roamer auf demselben Server liest
 * sie jede Runde und hat es damit unmittelbar. Sie wird NIE ueber das Netz
 * verteilt: ein Passwort braucht nur, wer connectToSession fuer diesen Nachbarn
 * aufruft, und das ist immer ein Prozess von hier. Die Telemetriemeldung an den
 * Daemon (Port 19) bleibt — sie dient der ANZEIGE, nicht der Verteilung.
 *
 * KEINE SESSION NOETIG: authenticate prueft nur requireDirectConnection
 * (Darknet.ts:113-115). Dieser Prozess laeuft auf demselben Server wie der
 * Roamer, ist also direkt mit dem Ziel verbunden.
 *
 * RAM: Basis 1,6 + authenticate 0,4 + heartbleed 0,6 + getServerDetails 0,1
 *      + ls 0,2 = 2,9 GB je Thread.
 */

// Portnummer kommt von aussen — injectPorts() ersetzt die Marke beim
// Materialisieren durch die zentrale Tabelle (SCHWARM-HELPERS.js).
// Frueher stand hier eine gespiegelte 19; genau solche Spiegel haben zweimal
// eine Port-Kollision erzeugt (19 und 34).
/*__PORTS__*/
const TELEMETRY = SCHWARM_PORTS.DNET_IN;
// v4.1: Das gefundene Passwort geht in eine LOKALE Datei, nicht in die netzweit
// verteilte Spielerliste. Es braucht nur der Roamer auf DIESEM Server (er ruft
// connectToSession fuer den Nachbarn; Sessions haengen an der PID,
// authentication.ts:206). Netzweites Verteilen hatte keinen Nutzen und sammelte
// nach jedem Aug-Install eine Ladung wertloser Eintraege — prestigeDarknetState
// (DarknetState.ts:84-101) baut das ganze Netz neu auf.
const PW_FILE = "dnet-pw.txt";            // lokal, wird NIE gescp't
const MANUAL = "schwarm-dnet-manual.txt"; // global, NUR LESEN (Spielereingaben)
const LOG_LINES_MAX = 200;    // MAX_LOG_LINES der Engine (packetSniffing.ts)
const PACKET_CANDS = 40;
const SCRAPE_MAX_CANDS = 30;
// Zeitdeckel je Lauf. Der Prozess endet danach von selbst; der Roamer startet in
// einer spaeteren Runde einen neuen, sofern das Ziel noch offen ist. So haengt
// kein Prozess dauerhaft an einem unloesbaren Raetsel.
const RUN_MS = 120000;
const ATTEMPT_BUDGET = 400;   // Versuche je Lauf (die Wanduhr bremst ohnehin)
// v4.1 — Rueckmelde-Raetsel brauchen viele Versuche; bei frischem Charisma
// kostet jeder 3-5 s (heartbleed 1,5x). 120 s reichten dafuer oft nicht.
const RUN_MS_FB = 600000;

// v4.1.1 — BEIM AUSLAGERN VERGESSEN. scrapeLogs ist aus dem Roamer hierher
// gewandert, die beiden Diagnose-Variablen drumherum nicht: der Aufruf warf
// "ReferenceError: DEBUG_DUMP is not defined". Die reine Syntaxpruefung
// (node --check) findet das nicht, weil freie Identifier erst zur LAUFZEIT
// auffallen — deshalb prueft der Testlauf jetzt per AST gegen alle Bindungen.
const DEBUG_DUMP = true;   // einmal die rohen heartbleed-Logs ins Skriptlog spiegeln
let dumpedLogs = false;

/** ns.ls ohne Wurf. Wird von readClues gebraucht (.data.txt-Funde vor Ort). */
function safeLs(ns, host) { try { return ns.ls(host) || []; } catch (e) { return []; } }

const DNET_CODE = {
    SUCCESS: 200,
    DIRECT_CONNECTION_REQUIRED: 351,
    AUTH_FAILURE: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    REQUEST_TIMEOUT: 408,
    NOT_ENOUGH_CHARISMA: 451,
    STASIS_LINK_LIMIT: 453,
    NO_BLOCK_RAM: 454,
    PHISHING_FAILED: 455,
    SERVICE_UNAVAILABLE: 503,
};

const DNET_MODELS = {
    EchoVuln: "DeskMemo_3.1",
    SortedEchoVuln: "PHP 5.4",
    NoPassword: "ZeroLogon",
    Captcha: "CloudBlare(tm)",
    DefaultPassword: "FreshInstall_1.0",
    BufferOverflow: "Pr0verFl0",
    MastermindHint: "DeepGreen",
    TimingAttack: "2G_cellular",
    LargestPrimeFactor: "PrimeTime 2",
    RomanNumeral: "BellaCuore",
    DogNames: "Laika4",
    GuessNumber: "AccountsManager_4.2",
    CommonPasswordDictionary: "TopPass",
    EUCountryDictionary: "EuroZone Free",
    Yesn_t: "NIL",
    BinaryEncodedFeedback: "110100100",
    SpiceLevel: "RateMyPix.Auth",
    ConvertToBase10: "OctantVoxel",
    parsedExpression: "MathML",
    divisibilityTest: "Factori-Os",
    tripleModulo: "BigMo%od",
    globalMaxima: "KingOfTheHill",
    packetSniffer: "OpenWebAccessPoint",
    encryptedPassword: "OrdoXenos",
    labyrinth: "(The Labyrinth)",
};

// =============================================================================
// 2. WOERTERBUECHER (aus dictionaryData.ts, vollstaendig)
// =============================================================================

const DEFAULT_PW = ["admin", "password", "0000", "12345"];
const DOG_NAMES = ["fido", "spot", "rover", "max"];
const EU_COUNTRIES = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Republic of Cyprus", "Czech Republic",
    "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland",
    "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal",
    "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
];
// v3.7: vollstaendig (93 Eintraege). Vorher fehlten die letzten 21 — "TopPass"
// scheiterte damit an jedem Passwort aus dem hinteren Teil der Liste.
const COMMON_PW = [
    "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111",
    "1234567", "dragon", "123123", "baseball", "abc123", "football", "monkey", "letmein",
    "696969", "shadow", "master", "666666", "qwertyuiop", "123321", "mustang", "1234567890",
    "michael", "654321", "superman", "1qaz2wsx", "7777777", "121212", "0", "qazwsx", "123qwe",
    "trustno1", "jordan", "jennifer", "zxcvbnm", "asdfgh", "hunter", "buster", "soccer",
    "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou", "2000", "charlie", "robert",
    "thomas", "hockey", "ranger", "daniel", "starwars", "112233", "george", "computer",
    "michelle", "jessica", "pepper", "1111", "zxcvbn", "555555", "11111111", "131313", "freedom",
    "777777", "pass", "maggie", "159753", "aaaaaa", "ginger", "princess", "joshua", "cheese",
    "amanda", "summer", "love", "ashley", "6969", "nicole", "chelsea", "biteme", "matthew",
    "access", "yankees", "987654321", "dallas", "austin", "thunder", "taylor", "matrix",
];

const FILLER_SET = new Set("/[]╬╸.-()*~:;><#\\\\".split(""));

// =============================================================================
// 3. REINE MATHE-HELFER (0 GB)
// =============================================================================

/** Roemische Zahl -> Integer. "nulla" => 0. */
function romanToInt(input) {
    if (!input) return NaN;
    const s = String(input).trim().toUpperCase();
    if (s === "NULLA") return 0;
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0, prev = 0;
    for (let i = s.length - 1; i >= 0; i--) {
        const v = map[s[i]] || 0;
        total += v < prev ? -v : v;
        prev = v;
    }
    return total;
}

/** Groesster Primfaktor von n (Trial Division). */
function largestPrimeFactor(n) {
    let x = Number(n), largest = -1;
    if (!Number.isFinite(x) || x < 2) return x;
    while (x % 2 === 0) { largest = 2; x /= 2; }
    for (let f = 3; f * f <= x; f += 2) {
        while (x % f === 0) { largest = f; x /= f; }
    }
    if (x > 1) largest = x;
    return largest;
}

/** "01001000 01101001" -> dekodierte Zeichenkette. */
function binaryDecode(hintData) {
    return String(hintData).trim().split(/\\s+/)
        .map((b) => String.fromCharCode(parseInt(b, 2)))
        .join("");
}

/** XOR-entschluesseln. Format: "<verschluesselt>;<maske1> <maske2> …" (8-Bit-Masken). */
function xorDecode(hintData) {
    const parts = String(hintData).split(";");
    const enc = parts[0];
    const masks = (parts[1] || "").trim().split(/\\s+/);
    let out = "";
    for (let i = 0; i < enc.length; i++) {
        out += String.fromCharCode(enc.charCodeAt(i) ^ (parseInt(masks[i], 2) || 0));
    }
    return out;
}

/** Captcha-Hint saeubern: alle Fuellzeichen entfernen. */
function stripFiller(hintData) {
    return String(hintData).split("").filter((c) => !FILLER_SET.has(c)).join("");
}

/** Zahl-String der Basis base (auch gebrochene Basis) -> Dezimalzahl. */
function parseBaseN(str, base) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = 0, i = 0;
    let digit = String(str).split(".")[0].length - 1;
    while (i < str.length) {
        const c = str[i];
        if (c === ".") { i++; continue; }
        const idx = chars.indexOf(c);
        if (idx >= 0) result += idx * base ** digit;
        i++; digit--;
    }
    return result;
}

/** Eindeutige Permutationen der Ziffern, ohne fuehrende Null, gedeckelt. */
function permutations(str, cap) {
    const limit = cap === undefined ? 120 : cap;
    const out = new Set();
    const recurse = (prefix, rest) => {
        if (out.size >= limit) return;
        if (rest.length === 0) {
            if (!(prefix.length > 1 && prefix[0] === "0")) out.add(prefix);
            return;
        }
        const seen = new Set();
        for (let k = 0; k < rest.length && out.size < limit; k++) {
            if (seen.has(rest[k])) continue;
            seen.add(rest[k]);
            recurse(prefix + rest[k], rest.slice(0, k).concat(rest.slice(k + 1)));
        }
    };
    recurse("", String(str).split(""));
    return [...out];
}

/**
 * Wertet einen Arithmetik-Ausdruck SICHER aus — wird NIE ge-eval-t!
 * (parsedExpression schmuggelt absichtlich Code wie ns.exit() ein.)
 *
 * =========================================================================
 * v4.3 — DER LOESER LAG BEI 1 PROZENT
 * =========================================================================
 * Live gemessen: MathML 9 von 895 Laeufen geloest. Die eigene Rechnung war
 * naeherungsweise richtig gedacht und in DREI Punkten falsch. Alle drei sind
 * gegen den Engine-Generator nachgestellt worden:
 *
 *   1. GERUNDET. Die Aufrufstelle gab String(Math.round(v)) ab. Einer von vier
 *      Operatoren ist aber die Division, das Passwort also meist KEINE ganze
 *      Zahl. Die Engine prueft mit
 *          |Differenz| < 0.01  ODER  relativ < 0.005
 *      (authentication.ts, isCloseToCorrectPassword) — 47/65 ergibt 0.7230…,
 *      wir schickten 1. Kostete rund 20 Prozentpunkte auf jeder Stufe.
 *
 *   2. INJEKTION NICHT ABGESCHNITTEN. Ab Schwierigkeit 16 haengt die Engine
 *      in rund einem Drittel der Faelle Schadcode an den Ausdruck. Sie selbst
 *      wirft ihn weg mit  .replaceAll("ns.exit(),","")  und dann
 *      .split(",")[0]  — alles ab dem ersten Komma ist Muell. Wir haben
 *      stattdessen die Buchstaben herausgefiltert und die uebrigen Ziffern und
 *      Klammern MITGERECHNET. Ab Stufe 18 betraf das jede zweite Aufgabe.
 *
 *   3. LEERZEICHEN ENTFERNT — der eigentliche Killer. Die Engine-Regexe
 *      lauten  (-?\\d*\\.?\\d+) *([*\\/]) *(-?\\d*\\.?\\d+)  : zwischen Operator
 *      und Zahl darf ein Leerzeichen stehen, zwischen Minuszeichen und Ziffern
 *      NICHT. Genau daran erkennt sie, ob ein Minus ein Operator oder ein
 *      Vorzeichen ist. Wir haben die Leerzeichen weggeworfen — damit wurde aus
 *          16 - 74 * ( 47 - 48 ) - 6          Soll 84
 *      erst  16-74*-1-6, dann wurde "-74" als Operand gelesen, das Minus
 *      verschwand, "16" klebte an "74":  1674 - 6 = 1668.
 *      Bei Schwierigkeit 45 wichen die Parser in 43 % der Faelle ab, bei 60 in
 *      zwei Dritteln.
 *
 * DESHALB JETZT: Zeichen fuer Zeichen der Nachbau von
 * ServerGenerator.cleanArithmeticExpression + parseSimpleArithmeticExpression.
 * Jede Abweichung davon ist per Definition ein Fehler — es gibt keinen Grund,
 * hier eigene Wege zu gehen. Gegen den Engine-Generator geprueft: 100 % auf
 * allen Stufen von 4 bis 60, vorher 78 % bis 29 %.
 * Weiterhin ohne eval; der Komma-Schnitt macht es sogar SICHERER als vorher,
 * weil der Schadcode ganz wegfaellt statt teilweise mitgerechnet zu werden.
 */
function cleanArithmetic(expression) {
    return String(expression)
        .split("ҳ").join("*").split("÷").join("/").split("➕").join("+").split("➖").join("-")
        .split("ns.exit(),").join("")
        .split(",")[0];
}

function safeArithmetic(expr, tiefe) {
    // Die Engine kennt keine Rekursionsbremse — wir brauchen eine, damit ein
    // verstuemmelter Ausdruck nicht den Spiel-Thread festhaelt.
    if ((tiefe || 0) > 40) return NaN;
    const tokens = cleanArithmetic(expr).split("");

    // Klammern: Tiefe je Zeichen, dann die erste Gruppe auf Tiefe 1 aufloesen.
    let cur = 0;
    const depth = tokens.map((t) => {
        if (t === "(") cur += 1;
        else if (t === ")") { cur -= 1; return cur + 1; }
        return cur;
    });
    const d1s = depth.indexOf(1);
    const fz = depth.indexOf(0, d1s);
    const d1e = fz === -1 ? depth.length - 1 : fz - 1;
    if (d1s !== -1) {
        const sub = tokens.slice(d1s + 1, d1e).join("");
        const r = safeArithmetic(sub, (tiefe || 0) + 1);
        tokens.splice(d1s, d1e - d1s + 1, String(r));
        return safeArithmetic(tokens.join(""), (tiefe || 0) + 1);
    }

    let rem = tokens.join("");
    let guard = 0;
    // Punkt vor Strich. Das " *" (Leerzeichen, kein \\s) ist ABSICHT und
    // exakt die Engine-Regel — siehe Punkt 3 oben.
    const mdRe = /(-?\\d*\\.?\\d+) *([*/]) *(-?\\d*\\.?\\d+)/;
    let m = rem.match(mdRe);
    while (m && guard++ < 500) {
        const res = m[2] === "*" ? parseFloat(m[1]) * parseFloat(m[3]) : parseFloat(m[1]) / parseFloat(m[3]);
        rem = rem.replace(m[0], Math.abs(res) < 0.000001 ? res.toFixed(20) : res.toString());
        m = rem.match(mdRe);
    }
    const asRe = /(-?\\d*\\.?\\d+) *([+-]) *(-?\\d*\\.?\\d+)/;
    m = rem.match(asRe); guard = 0;
    while (m && guard++ < 500) {
        const res = m[2] === "+" ? parseFloat(m[1]) + parseFloat(m[3]) : parseFloat(m[1]) - parseFloat(m[3]);
        rem = rem.replace(m[0], res.toString());
        m = rem.match(asRe);
    }
    const mm = rem.match(/(-?\\d*\\.?\\d+)/);
    return parseFloat(mm ? mm[1] : "");
}

// =============================================================================
// 4. CRACKER-REGISTRY (0 GB)
// =============================================================================

const okCands = (arr) => ({ candidates: arr, feedback: false });
const needFeedback = (extra) => Object.assign({ candidates: [], feedback: true }, extra || {});
const todoModel = (note) => ({ candidates: [], feedback: false, todo: true, note });

/** Passwort-Kandidaten (oder Feedback-Bedarf) fuer einen Darknet-Server. */
function crack(details) {
    try {
        const M = DNET_MODELS;
        const model = details && (details.modelId !== undefined ? details.modelId : details.model);
        const data = details ? String(details.data !== undefined ? details.data
            : (details.passwordHintData !== undefined ? details.passwordHintData
                : (details.hintData !== undefined ? details.hintData : ""))) : "";
        const hint = details ? String(details.passwordHint !== undefined ? details.passwordHint
            : (details.staticPasswordHint !== undefined ? details.staticPasswordHint : "")) : "";

        switch (model) {
            // --- Woerterbuch-Modelle ---
            case M.NoPassword: return okCands([""]);
            case M.DefaultPassword: return okCands(DEFAULT_PW);
            case M.DogNames: return okCands(DOG_NAMES);
            case M.EUCountryDictionary: return okCands(EU_COUNTRIES);
            case M.CommonPasswordDictionary: return okCands(COMMON_PW);

            // --- Deterministische Modelle: aus dem Hint berechnen ---
            case M.RomanNumeral: {
                let d = data;
                if (!d) { const m = hint.match(/number '([^']+)'/i); if (m) d = m[1]; }
                if (!d) return todoModel("RomanNumeral: kein Hint-Data lesbar");
                if (d.includes(",")) {
                    const ab = d.split(",");
                    return needFeedback({ low: romanToInt(ab[0]), high: romanToInt(ab[1]), kind: "updown" });
                }
                return okCands([String(romanToInt(d))]);
            }
            case M.LargestPrimeFactor: {
                let t = data;
                if (!t) { const m = hint.match(/factor of (\\d+)/i); if (m) t = m[1]; }
                if (!t) return todoModel("LargestPrimeFactor: keine Zielzahl lesbar");
                return okCands([String(largestPrimeFactor(t))]);
            }
            case M.BinaryEncodedFeedback:
                if (!data) return todoModel("Binary: braucht passwordHintData");
                return okCands([binaryDecode(data)]);
            case M.encryptedPassword:
                if (!data.includes(";")) return todoModel("XOR: braucht passwordHintData");
                return okCands([xorDecode(data)]);
            case M.Captcha:
                if (!data) return todoModel("Captcha: braucht passwordHintData");
                return okCands([stripFiller(data)]);

            // --- Feedback-Modelle ---
            case M.GuessNumber: {
                let max = 1e9; const m = hint.match(/between 0 and (\\d+)/i); if (m) max = Number(m[1]);
                return needFeedback({ low: 0, high: max, kind: "updown" });
            }
            case M.MastermindHint: return needFeedback({ kind: "mastermind" });
            case M.Yesn_t: return needFeedback({ kind: "yesnt" });
            case M.SpiceLevel: return needFeedback({ kind: "spice" });
            case M.TimingAttack: return needFeedback({ kind: "timing" });
            case M.packetSniffer: return needFeedback({ kind: "packet" });
            case M.divisibilityTest: return needFeedback({ kind: "divisibility" });
            case M.tripleModulo: return needFeedback({ kind: "modulo" });
            case M.globalMaxima: return needFeedback({ kind: "maxima" });
            case M.BufferOverflow: return needFeedback({ kind: "overflow" });

            // --- Aus dem ServerGenerator-Quellcode implementiert ---
            case M.EchoVuln: {
                const tok = hint.trim().split(/\\s+/).pop();
                return tok ? okCands([tok]) : todoModel("EchoVuln: Hint leer");
            }
            case M.SortedEchoVuln: {
                const sorted = data || hint.trim().split(/\\s+/).pop() || "";
                if (!sorted) return todoModel("SortedEcho: keine Daten");
                // v4.3: AB 5 STELLEN wird gerechnet statt geraten. Die Engine
                // liefert dort zu jedem Fehlversuch die RMS-Abweichung, aus der
                // sich jede Ziffer einzeln ergibt — Begruendung und Formel bei
                // solveSortedEcho. Darunter gibt sie keine Abweichung heraus;
                // dann bleibt es beim Durchprobieren, was bei hoechstens
                // 4! = 24 Anordnungen billig ist.
                if (sorted.length >= 5) return needFeedback({ kind: "sortedecho", sorted });
                return okCands(permutations(sorted));
            }
            case M.ConvertToBase10: {
                if (!data.includes(",")) return todoModel("Base10: braucht passwordHintData");
                const parts = data.split(",");
                return okCands([String(Math.round(parseBaseN(parts[1], Number(parts[0]))))]);
            }
            case M.parsedExpression: {
                if (!data) return todoModel("Ausdruck: braucht passwordHintData");
                // NICHT runden: die Engine vergleicht mit parseFloat und einer
                // Toleranz von 0.01 absolut bzw. 0.5 % relativ. Ein Viertel aller
                // Ausdruecke enthaelt eine Division, das Ergebnis ist dann keine
                // ganze Zahl — Runden warf genau diese Faelle weg.
                const v = safeArithmetic(data, 0);
                return Number.isFinite(v) ? okCands([String(v)]) : todoModel("Ausdruck nicht lesbar");
            }

            // v3.7: Das Labyrinth wird NICHT mehr hier geloest, sondern von
            // schwarm-lab.js in einem eigenen Prozess (PID-gebundene Position).
            // handleServer faengt es vor dem Cracker ab; dieser Zweig ist nur der
            // Rueckfall, falls die Modell-ID doch hier ankommt.
            case M.labyrinth: return needFeedback({ kind: "labyrinth" });

            default:
                return todoModel("Unbekanntes Modell: " + String(model));
        }
    } catch (e) {
        return { candidates: [], feedback: false, error: String(e) };
    }
}

// =============================================================================
// 4b. FEEDBACK-LOESER
// -----------------------------------------------------------------------------
// ns.dnet.authenticate liefert bei NORMALEN Servern nur { success, code, message }
// mit generischer Meldung. Die Rueckmeldung landet als PasswordResponse-Objekt im
// Serverlog (packetSniffing.ts: logPasswordAttempt) und kommt per heartbleed als
// JSON heraus. Jeder Loeser laeuft deshalb ueber Versuch(e) -> heartbleed -> JSON.
// heartbleed dauert 1,5x Auth-Zeit und verlangt charisma >= requiredCharismaSkill;
// UNABHAENGIGE Versuche werden deshalb gebuendelt (das Log fasst 200 Zeilen).
// =============================================================================

const NUMERIC_SET = "0123456789";
const LETTER_SET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
// v4.4: Der alte Kommentar hier lautete "kommt in KEINEM generierten
// Passwort vor". Das stimmt NICHT allgemein: das Fuellzeichen-Alphabet der
// Engine enthaelt die Tilde (dictionaryData.ts:10, filler =
// "/[]~:;><#..."). Sicher ist es nur fuer die beiden Modelle, die
// solveExactCount benutzt: SpiceLevel und MastermindHint ziehen ihre
// Passwoerter aus getPassword und bestehen damit ausschliesslich aus
// Ziffern bzw. Ziffern und Buchstaben (ServerGenerator.ts:564-579).
// Wer das Fuellzeichen anderswo einsetzt, muss das neu pruefen.
const FILLER_CHAR = "~";

/** Zeichensatz aus details.passwordFormat (Rueckfall: numerisch). */
function charsetOf(d) {
    const f = String((d && d.passwordFormat) || "numeric");
    if (f === "numeric") return NUMERIC_SET;
    if (f === "alphabetic") return LETTER_SET;
    return NUMERIC_SET + LETTER_SET;
}

/**
 * Ein Versuch. Zaehlt aufs Budget UND auf die Wanduhr.
 *
 * v4.0: Die Frist (ctx.until) ist der Kern des Verhungerungs-Fixes. Ein
 * Auth-Versuch blockiert echte Spielzeit — calculateAuthenticationTime
 * (effects.ts:60-90) rechnet 850 ms * (5*chaRequired + (difficulty+1)*100) /
 * (charisma + 150), bei unterlevelten Stats mindestens 1,5-fach. Ohne Frist
 * konnte ein einziger Nachbar die komplette Roamer-Runde auffressen; Caches,
 * Contracts und Roden kamen dann nie dran.
 */
/** v4.1: ersten Abbruchgrund festhalten (erscheint in der FEEDBACK-Meldung). */
function warum(ctx, grund) { if (ctx && !ctx.seWarum) ctx.seWarum = grund; }

async function authOnce(ns, host, pw, ctx) {
    if (ctx.weg) return { ok: false, out: true };
    if (ctx.left <= 0) { warum(ctx, "Versuchsbudget"); return { ok: false, out: true }; }
    if (ctx.until && Date.now() >= ctx.until) { warum(ctx, "Frist"); return { ok: false, out: true }; }
    ctx.left--;
    try {
        let r = await ns.dnet.authenticate(host, String(pw));
        // v4.1: 408 = die Engine hat nach der Wartezeit abgebrochen; der Versuch
        // wurde nicht gewertet und hinterliess KEINEN Log-Eintrag (trifft auch ein
        // richtiges Passwort). Genau einmal wiederholen, sofern die Frist reicht.
        if (r && r.code === DNET_CODE.REQUEST_TIMEOUT && !(ctx.until && Date.now() >= ctx.until)) {
            r = await ns.dnet.authenticate(host, String(pw));
        }
        // v4.1: Ziel getrennt, umgezogen oder geloescht (in BN15 haeufig). Jeder
        // weitere Versuch endet nach 100 ms ohne Wirkung - Lauf beenden, Grund
        // melden. ctx.left bleibt ehrlich, damit die Versuchszahl stimmt.
        if (r && (r.code === DNET_CODE.DIRECT_CONNECTION_REQUIRED
                || r.code === DNET_CODE.NOT_FOUND || r.code === DNET_CODE.SERVICE_UNAVAILABLE)) {
            ctx.weg = true;
            warum(ctx, "Ziel weg (" + r.code + ")");
            return { ok: false, out: true, code: r.code };
        }
        return { ok: !!(r && r.success), code: r ? r.code : 0, message: r ? r.message : "", data: r ? r.data : undefined };
    } catch (e) { return { ok: false }; }
}

/** Serverlogs lesen und die PasswordResponse-Objekte herausparsen. */
async function readLogs(ns, host, lines) {
    try {
        const n = Math.max(1, Math.min(LOG_LINES_MAX, Math.floor(lines)));
        const hb = await ns.dnet.heartbleed(host, { peek: true, logsToCapture: n });
        if (hb && hb.code === DNET_CODE.NOT_ENOUGH_CHARISMA) return { cha: false, entries: [], raw: [] };
        const raw = [].concat((hb && hb.logs) || []).map((x) => String(x));
        const entries = [];
        for (const line of raw) {
            if (line.charAt(0) !== "{") continue;
            try {
                const o = JSON.parse(line);
                if (o && typeof o === "object" && o.code !== undefined) entries.push(o);
            } catch (e) { /* Rauschzeile */ }
        }
        return { cha: true, entries: entries, raw: raw };
    } catch (e) { return { cha: true, entries: [], raw: [] }; }
}

/** Antwort-Objekt zu genau EINEM Versuch holen. */
async function probeOne(ns, host, pw, ctx) {
    const a = await authOnce(ns, host, pw, ctx);
    if (a.ok) return { ok: true };
    if (a.out) return { ok: false, out: true };
    const lg = await readLogs(ns, host, 12);
    if (!lg.cha) return { ok: false, cha: false };
    for (const e of lg.entries) {
        if (String(e.passwordAttempted) === String(pw)) return { ok: false, entry: e };
    }
    // v4.1: KEIN fremder Eintrag mehr. Bisher kam hier lg.entries[0] zurueck -
    // der Eintrag eines ANDEREN Versuchs; die Binaersuche lief dann in die
    // falsche Richtung. Ohne passenden Eintrag gibt es keine Aussage.
    warum(ctx, "kein Log-Eintrag");
    return { ok: false, entry: null };
}

/** Mehrere UNABHAENGIGE Versuche buendeln: erst alles schicken, dann EINMAL lesen. */
async function probeMany(ns, host, pws, ctx) {
    let out = false;
    for (const pw of pws) {
        const a = await authOnce(ns, host, pw, ctx);
        if (a.ok) return { hit: String(pw), map: new Map(), cha: true, out: false };
        if (a.out) { out = true; break; }
    }
    // v4.1: nach Fristende oder ohne Ziel keine Log-Abfrage mehr (heartbleed
    // kostet 1,5 Auth-Zeiten); eine Teilkarte hilft keinem Loeser.
    if (out) return { hit: null, map: new Map(), cha: true, out: true };
    const lg = await readLogs(ns, host, pws.length * 3 + 10);
    const map = new Map();
    for (const e of lg.entries) {
        if (e.passwordAttempted !== undefined && !map.has(String(e.passwordAttempted))) {
            map.set(String(e.passwordAttempted), e);
        }
    }
    return { hit: null, map: map, cha: lg.cha, out: out };
}

/**
 * BufferOverflow (Pr0verFl0) — KEIN heartbleed, KEIN Charisma noetig.
 * buffer = "_"*L + mask*L; overwritten = versuch + buffer.slice(versuch.length);
 * received = overwritten[0..L), expected = overwritten[L..2L). Ein Versuch aus
 * 2L gleichen Zeichen macht beide Haelften gleich -> Treffer.
 */
async function solveOverflow(ns, host, d, ctx) {
    const L = Math.floor(Number(d && d.passwordLength) || 0);
    if (L > 0) {
        const pw = "0".repeat(2 * L);
        const a = await authOnce(ns, host, pw, ctx);
        if (a.ok) return pw;
        if (a.out) return null;
    }
    // Rueckfall: die Laenge steht im Log als passwordExpected.
    await authOnce(ns, host, "1", ctx);
    const lg = await readLogs(ns, host, 12);
    for (const e of lg.entries) {
        const exp = e.passwordExpected;
        if (typeof exp === "string" && exp.length > 0) {
            const pw = "0".repeat(2 * exp.length);
            const a = await authOnce(ns, host, pw, ctx);
            return a.ok ? pw : null;
        }
    }
    return null;
}

/**
 * divisibilityTest (Factori-Os) — Orakel "Passwort % n == 0?".
 * Alle Primfaktoren stammen aus smallPrimes (<=97) bzw. largePrimes (1069..9859).
 * WICHTIG: niemals 0 einreichen — "password % 0" ist NaN und meldet faelschlich
 * "teilbar".
 */
const SMALL_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const LARGE_PRIMES = [1069, 1409, 1471, 1567, 1597, 1601, 1697, 1747, 1801, 1889, 1979, 1999, 2063, 2207, 2371, 2503,
    2539, 2693, 2741, 2753, 2801, 2819, 2837, 2909, 2939, 3169, 3389, 3571, 3761, 3881, 4217, 4289, 4547, 4729, 4789,
    4877, 4943, 4951, 4957, 5393, 5417, 5419, 5441, 5519, 5527, 5647, 5779, 5881, 6007, 6089, 6133, 6389, 6451, 6469,
    6547, 6661, 6719, 6841, 7103, 7549, 7559, 7573, 7691, 7753, 7867, 8053, 8081, 8221, 8329, 8599, 8677, 8761, 8839,
    8963, 9103, 9199, 9343, 9467, 9551, 9601, 9739, 9749, 9859];

function isDivisible(map, n) {
    const e = map.get(String(n));
    if (!e) return false;
    if (String(e.data) === "true") return true;
    if (String(e.data) === "false") return false;
    return String(e.message || "").indexOf("IS divisible") >= 0;
}

/**
 * =============================================================================
 * SortedEchoVuln ("PHP 5.4") — GEZIELT statt geraten                    [v4.3]
 * =============================================================================
 * VORHER: okCands(permutations(sorted)). Der Hinweis nennt die Ziffern des
 * Passworts in sortierter Reihenfolge, also wurde jede Anordnung durchprobiert.
 * Das Passwort ist bis zu 9 Stellen lang (ServerGenerator.ts:114,
 * getPassword(min(2 + difficulty/7, 9))) — 362.880 Anordnungen. Der Kandidaten-
 * deckel schnitt die Liste ab, und der Rest war Gluecksspiel. Livebeleg ueber
 * vier Lagebilder: 6 von 42 Laeufen geloest, 36 ECHTE Fehlschlaege.
 *
 * DIE ENGINE VERRAET DIE LOESUNG. authentication.ts:127-142 antwortet auf jeden
 * Fehlversuch (ab Passwortlaenge 5 und bei passender Versuchslaenge) mit
 *     squaredError = Summe ueber alle Stellen (versucht_i - echt_i)^2
 *     rmsd         = Wurzel(squaredError / Laenge)
 *     data         = "<sortiert>; RMS Deviation:<rmsd auf 3 Nachkommastellen>"
 * Das ist kein Ja/Nein, sondern ein MASS — und damit ist jede Ziffer einzeln
 * bestimmbar, ohne eine einzige Anordnung zu raten:
 *
 *   Grundmessung mit lauter Nullen:      S0 = Summe p_i^2
 *   Sonde mit einer 1 an Stelle j:       Sj = S0 + 1 - 2*p_j
 *   also                                 p_j = (S0 + 1 - Sj) / 2
 *
 * EINE Grundmessung plus EINE Sonde je Stelle. Bei 9 Stellen sind das 10
 * Versuche statt 362.880 Anordnungen.
 *
 * RUNDUNGSFEHLER SIND UNKRITISCH. Die Engine liefert rmsd auf drei
 * Nachkommastellen, wir rechnen S = rmsd^2 * L zurueck. Der Fehler in S ist
 * hoechstens 2*rmsd*L*0,0005, bei rmsd<=9 und L<=9 also unter 0,09 — und p_j
 * ist ganzzahlig. Die Rundung auf die naechste ganze Zahl ist damit immer
 * eindeutig (nachgerechnet an 12345, 907183, 5550123, 98765432, 102938475).
 *
 * WARUM DIE NULL-SONDE ERLAUBT IST. Die Engine prueft nur die LAENGE
 * (attemptedPassword.length !== server.password.length), nicht den Wertebereich.
 * "000000" ist ein gueltiger Versuch, obwohl kein erzeugtes Passwort mit einer
 * Null beginnt (getPassword: Number(password).toString()).
 *
 * UNTER 5 STELLEN gibt die Engine KEINE Abweichung heraus (erste Zeile des
 * case-Blocks). Dort bleibt es beim Durchprobieren — bei hoechstens 4! = 24
 * Anordnungen ist das billig und sicher.
 *
 * @param {NS} ns @param {string} host @param {Object} d @param {Object} ctx
 * @returns {Promise<string|null>}
 */
async function solveSortedEcho(ns, host, d, ctx, sortedAusCrack) {
    // =========================================================================
    // v4.4 BUGFIX — DER LOESER FAND DEN HINWEIS NICHT UND GAB AUF
    // =========================================================================
    // v4.3 las hier ausschliesslich d.passwordHintData. crack() leitet den
    // sortierten Hinweis aber aus DREI Quellen ab (details.data, dann
    // passwordHintData, dann hintData) und faellt notfalls auf das LETZTE WORT
    // des Hinweistextes zurueck ("I accidentally sorted the password: 13457").
    // Steht die Zahl nur im Hinweistext, war d.passwordHintData leer, L wurde 0,
    // die Laengenpruefung schlug zu — und der Loeser kehrte zurueck, ohne auch
    // nur einen Versuch zu machen.
    //
    // Livebeleg ueber vier Zyklen, nachdem v4.3 eingespielt war:
    //     Zyklus 2   53 von 190 geloest, 137 OHNE VERSUCH, 0 Fehlschlaege
    //     Zyklus 3   53 von 374 geloest, 321 OHNE VERSUCH
    //     Zyklus 4   54 von 517 geloest, 463 OHNE VERSUCH
    // Die Zahl der Treffer stand still, waehrend die Laeufe explodierten — das
    // Bild eines Loesers, der sofort zurueckkehrt. (Und genau das hat die neue
    // DIAG-Unterscheidung "gibt auf" gegen "antwortet falsch" sichtbar gemacht.)
    //
    // JETZT kommt der Hinweis von crack() mit, das ihn ohnehin schon ermittelt
    // hat. Der eigene Lesepfad bleibt als Rueckfall.
    // =========================================================================
    // v4.5 — MESSEN STATT RATEN
    // =========================================================================
    // v4.4 hat den Hinweis durchgereicht, und die Laeufe wandern seitdem von
    // "todo" nach "feedback" — der Loeser LAEUFT also, sondiert (Ø 6 Versuche
    // bei fuenfstelligen Passwoertern, das sind genau Basis + 5 Sonden) und
    // steigt danach aus. Aus dem Quelltext allein ist nicht zu sehen, an
    // WELCHER der fuenf Ruecksprungstellen; jede von ihnen liefert dasselbe
    // stille null.
    //
    // Also nicht weiter raten: jede Ruecksprungstelle traegt jetzt einen Grund
    // ein (ctx.seWarum). Der Roamer haengt ihn an die FEEDBACK-Meldung, DIAG
    // zeigt ihn. EIN Lagebild entscheidet dann, statt einer weiteren Vermutung.
    const raus = (grund) => { try { ctx.seWarum = grund; } catch (e) { /* egal */ } return null; };

    const sortiert = String(sortedAusCrack || (d && d.passwordHintData) || "").trim();
    const L = Math.floor(Number(d && d.passwordLength) || sortiert.length || 0);
    // Unter 5 Stellen antwortet die Engine ohne Abweichung — dann traegt dieser
    // Weg nichts, und der berechnende Zweig hat die Anordnungen schon geliefert.
    if (L < 5 || L > 15) return raus("Laenge " + L + " (Hinweis " + sortiert.length + " Zeichen)");

    const basis = "0".repeat(L);
    const proben = [basis];
    for (let j = 0; j < L; j++) proben.push("0".repeat(j) + "1" + "0".repeat(L - j - 1));

    const r = await probeMany(ns, host, proben, ctx);
    if (r.hit) return r.hit;          // unwahrscheinlich, aber geschenkt
    if (!r.cha) return raus("heartbleed verweigert (Charisma)");

    // Fehlerquadratsumme aus der Rueckmeldung zurueckrechnen.
    // Der Grund wird hier MITGESCHRIEBEN, weil "keine Antwort im Log" und
    // "Antwort ohne RMS-Wert" voellig verschiedene Ursachen haben: das eine
    // heisst, der Versuch steht gar nicht im Protokoll, das andere, dass die
    // Engine eine LAENGEN-Absage geschickt hat (dann fehlt die Abweichung).
    //
    // v4.6, ACHTUNG BEIM AENDERN: Diese Funktion steht in einem Template-
    // Literal. Backslashes im Muster MUESSEN doppelt geschrieben werden, denn
    // das Auswerten frisst genau eine Ebene. Einfach geschriebene Backslashes
    // verschwinden spurlos und ergeben ein Muster, das nie trifft. Genau das
    // war v4.5: aus dem Wortzeichen wurde ein blosses s im Muster.
    let letzterGrund = "";
    const sse = (pw) => {
        const e = r.map.get(pw);
        if (!e) { letzterGrund = "Sonde " + pw + " steht nicht im Protokoll (" + r.map.size + " Eintraege)"; return null; }
        const roh = String(e.data === undefined ? "" : e.data);
        const m = roh.match(/RMS\\s*Deviation\\s*:\\s*([0-9]*\\.?[0-9]+)/i);
        if (!m) { letzterGrund = "keine RMS-Abweichung in der Antwort: " + roh.slice(0, 60); return null; }
        const v = Number(m[1]);
        if (!isFinite(v)) { letzterGrund = "RMS-Wert unlesbar: " + m[1]; return null; }
        return v * v * L;
    };

    const s0 = sse(basis);
    if (s0 === null) return raus("Grundmessung: " + letzterGrund);

    let pw = "";
    for (let j = 0; j < L; j++) {
        const sj = sse(proben[j + 1]);
        if (sj === null) return raus("Sonde " + (j + 1) + ": " + letzterGrund);
        const z = Math.round((s0 + 1 - sj) / 2);
        if (!(z >= 0 && z <= 9)) return raus("Ziffer " + (j + 1) + " ausserhalb 0..9: " + z);
        pw += String(z);
    }

    // GEGENPROBE vor dem Einreichen: die gefundenen Ziffern MUESSEN dieselbe
    // Multimenge sein wie der sortierte Hinweis. Stimmt das nicht, haben wir die
    // Rueckmeldung falsch gelesen — dann lieber aufgeben als einen Fehlversuch
    // verbrennen (Fehlversuche sind das, was dieses Modell bisher ruiniert hat).
    if (sortiert && sortiert.length === L) {
        const a = pw.split("").sort().join("");
        const b = sortiert.split("").sort().join("");
        if (a !== b) return raus("Ziffern passen nicht zum Hinweis: " + a + " statt " + b);
    }

    const auth = await authOnce(ns, host, pw, ctx);
    if (auth.ok) return pw;
    return raus("Passwort " + pw + " abgelehnt (Hinweis " + sortiert + ")");
}

/**
 * =============================================================================
 * divisibilityTest ("Factori-Os") — DREI DEFEKTE                        [v4.3]
 * =============================================================================
 * Livebeleg ueber vier Lagebilder: 5 von 28 Laeufen geloest, NULL Fehlschlaege.
 * Null Fehlschlaege heisst: der Loeser reicht gar nichts ein, er gibt auf. Die
 * Ursache liegt nicht in einer falschen Formel, sondern im Budget.
 *
 * SO BAUT DIE ENGINE DAS PASSWORT (ServerGenerator.ts:685-707):
 *     start = Zufallszahl 1 .. 5*(scale+1)          // BELIEBIG, nicht prim
 *     scale/3 mal:  *= Zufall 1..5  ODER  *= kleine Primzahl
 *     difficulty > 12:  *= grosse Primzahl
 *     difficulty > 24:  *= zweite grosse Primzahl
 * Alle Faktoren stammen also aus smallPrimes (<=97) plus hoechstens ZWEI
 * grossen Primzahlen — und wie viele grosse es sind, sagt die Schwierigkeit.
 *
 * DEFEKT 1 — DIE VIELFACHHEITEN FIELEN BEI KNAPPEM BUDGET KOMPLETT AUS.
 *   Der alte Code baute erst ALLE Potenzen p^2..p^6 jeder gefundenen Primzahl
 *   in eine Liste (fuenf Sonden je Primzahl, bei acht Primzahlen also 40) und
 *   sondierte sie nur, wenn "ctx.left > powers.length". Reichte das Budget
 *   nicht, blieb mult[p] = 1 fuer alle — und damit war "known" garantiert
 *   falsch, der Rest des Loesers lief ins Leere.
 *   JETZT wird rundenweise geklettert: Runde 1 fragt p^2 fuer alle Kandidaten,
 *   Runde 2 nur noch p^3 fuer die, die p^2 bestanden haben, und so weiter. Fuer
 *   eine Primzahl mit Vielfachheit 1 kostet das EINE Sonde statt fuenf.
 *
 * DEFEKT 2 — DER EXPONENT WAR BEI 6 GEDECKELT.
 *   Der Startwert kann 80 sein (2^4 * 5), und jeder der bis zu fuenf
 *   Multiplikatoren kann noch eine 2 oder 4 beitragen. Der Exponent von 2 kann
 *   also ueber 6 liegen; dann war "known" zu klein. Jetzt begrenzt nur noch der
 *   Zahlenbereich (9e15), nicht ein geratener Festwert.
 *
 * DEFEKT 3 — DIE PAAR-SCHLEIFE VERBRANNTE JEDES BUDGET.
 *   Am Ende lief eine Doppelschleife ueber alle 85 grossen Primzahlen, also bis
 *   zu 3655 Kombinationen, jede mit einem echten Auth-Versuch. Das kann kein
 *   Budget ueberleben — und noetig ist sie nur, wenn die Schwierigkeit ueber 24
 *   liegt. Darunter gibt es hoechstens EINE grosse Primzahl, bei <= 12 gar
 *   keine. Die Schwierigkeit steht in d.difficulty und wird jetzt benutzt.
 *
 * @param {NS} ns @param {string} host @param {Object} d @param {Object} ctx
 * @returns {Promise<string|null>}
 */
async function solveDivisibility(ns, host, d, ctx) {
    let r = await probeMany(ns, host, SMALL_PRIMES, ctx);
    if (r.hit) return r.hit;
    if (!r.cha || r.out) return null;   // v4.1: halbe Liste taugt nicht
    const found = SMALL_PRIMES.filter((p) => isDivisible(r.map, p));

    // ---- DEFEKT 1+2: Vielfachheiten rundenweise und ohne Festdeckel ----------
    // Offen sind zunaechst alle gefundenen Primzahlen mit Exponent 1. Je Runde
    // wird fuer die noch offenen die naechste Potenz gefragt; wer durchfaellt,
    // scheidet aus. Das kostet je Primzahl (Vielfachheit) Sonden statt immer
    // fuenf, und es endet erst am Zahlenbereich.
    const mult = {};
    for (const p of found) mult[p] = 1;
    let offen = found.slice();
    for (let k = 2; offen.length > 0 && ctx.left > offen.length; k++) {
        const sonden = [], zu = [];
        for (const p of offen) {
            const v = Math.pow(p, k);
            if (v > 9e15) continue;
            sonden.push(v); zu.push(p);
        }
        if (sonden.length === 0) break;
        r = await probeMany(ns, host, sonden, ctx);
        if (r.hit) return r.hit;
        if (!r.cha || r.out) break;   // v4.1
        const weiter = [];
        for (let i = 0; i < zu.length; i++) {
            if (isDivisible(r.map, sonden[i])) { mult[zu[i]] = k; weiter.push(zu[i]); }
        }
        offen = weiter;
    }

    let known = 1;
    for (const p of found) known = known * Math.pow(p, mult[p]);

    const L = Math.floor(Number(d && d.passwordLength) || 0);
    const tryNum = async (n) => {
        if (!isFinite(n) || n < 1 || n > 9e15) return null;
        const str = String(n);
        if (L > 0 && str.length !== L) return null;
        const a = await authOnce(ns, host, str, ctx);
        return a.ok ? str : null;
    };
    let hit = await tryNum(known);
    if (hit) return hit;

    // ---- DEFEKT 3: nur so viele grosse Primzahlen suchen, wie es geben KANN --
    // ServerGenerator.ts:698/701 — eine grosse Primzahl ab difficulty > 12,
    // eine zweite ab > 24. Ist die Schwierigkeit unbekannt, wird konservativ
    // beides zugelassen; ist sie bekannt und klein, entfaellt die Suche ganz.
    const diff = Number(d && d.difficulty);
    const diffBekannt = isFinite(diff) && diff > 0;
    const maxGross = !diffBekannt ? 2 : (diff > 24 ? 2 : (diff > 12 ? 1 : 0));
    if (maxGross === 0 || L <= 0) return null;

    const lo = Math.pow(10, L - 1) / known;
    const hi = Math.pow(10, L) / known;
    for (const q of LARGE_PRIMES) {
        if (ctx.left <= 0) return null;
        if (q < lo || q >= hi) continue;
        hit = await tryNum(known * q);
        if (hit) return hit;
    }
    if (maxGross < 2) return null;
    for (let i = 0; i < LARGE_PRIMES.length && ctx.left > 0; i++) {
        for (let j = i; j < LARGE_PRIMES.length && ctx.left > 0; j++) {
            const v = LARGE_PRIMES[i] * LARGE_PRIMES[j];
            if (v < lo || v >= hi) continue;
            hit = await tryNum(known * v);
            if (hit) return hit;
        }
    }
    return null;
}

/**
 * Exakt-Treffer-Orakel (SpiceLevel + MastermindHint).
 * FILLER_CHAR liefert garantiert 0 Treffer -> erst Zeichenhaeufigkeit (ein
 * Buendel), dann Positionen per Teilmengen-Halbierung: ~L*log2(L) Abfragen.
 */
function exactCountOf(entry, kind) {
    if (!entry) return -1;
    const data = String(entry.data === undefined ? "" : entry.data);
    if (kind === "spice") {
        const head = data.split("/")[0];
        if (head === "0" || head === "") return 0;
        return [...head].filter((c) => c === "\\u{1F336}").length;
    }
    const n = Number(data.split(",")[0]);
    return isFinite(n) ? n : -1;
}

async function solveExactCount(ns, host, d, ctx, kind) {
    const L = Math.floor(Number(d && d.passwordLength) || 0);
    if (L <= 0) return null;
    const set = charsetOf(d);
    const pad = (assign) => {
        let out = "";
        for (let i = 0; i < L; i++) out += assign[i] || FILLER_CHAR;
        return out;
    };

    const probes = [];
    for (const c of set) probes.push(c.repeat(L));
    let r = await probeMany(ns, host, probes, ctx);
    if (r.hit) return r.hit;
    if (!r.cha) return null;

    const counts = [];
    let total = 0;
    for (const c of set) {
        const n = exactCountOf(r.map.get(c.repeat(L)), kind);
        if (n > 0) { counts.push({ c: c, n: n }); total += n; }
    }
    if (total !== L) return null;   // Orakel nicht verstanden -> nicht weiter raten

    const assign = new Array(L).fill(null);
    let open = [];
    for (let i = 0; i < L; i++) open.push(i);

    for (const item of counts) {
        if (item.n >= open.length) { for (const i of open) assign[i] = item.c; open = []; break; }
        const stack = [{ pos: open.slice(), k: item.n }];
        const mine = [];
        while (stack.length > 0 && ctx.left > 0) {
            const job = stack.pop();
            if (job.k <= 0) continue;
            if (job.k >= job.pos.length) { for (const i of job.pos) mine.push(i); continue; }
            const half = Math.ceil(job.pos.length / 2);
            const a = job.pos.slice(0, half), b = job.pos.slice(half);
            const test = new Array(L).fill(null);
            for (const i of a) test[i] = item.c;
            const res = await probeOne(ns, host, pad(test), ctx);
            if (res.ok) return pad(test);
            if (res.out || res.cha === false) return null;
            const got = exactCountOf(res.entry, kind);
            if (got < 0) return null;
            stack.push({ pos: a, k: got });
            stack.push({ pos: b, k: job.k - got });
        }
        for (const i of mine) assign[i] = item.c;
        open = open.filter((i) => assign[i] === null);
        if (open.length === 0) break;
    }
    if (open.length > 0) return null;

    const pw = assign.join("");
    const a = await authOnce(ns, host, pw, ctx);
    return a.ok ? pw : null;
}

/**
 * Yesn_t (NIL) — data ist ein Positions-Orakel ("yes,yesn't,…", ein Eintrag je
 * Position). Ein Buendel ueber den Zeichensatz genuegt.
 */
async function solveYesnt(ns, host, d, ctx) {
    const L = Math.floor(Number(d && d.passwordLength) || 0);
    if (L <= 0) return null;
    const set = charsetOf(d);
    const probes = [];
    for (const c of set) probes.push(c.repeat(L));
    const r = await probeMany(ns, host, probes, ctx);
    if (r.hit) return r.hit;
    if (!r.cha) return null;

    const assign = new Array(L).fill(null);
    for (const c of set) {
        const e = r.map.get(c.repeat(L));
        if (!e) continue;
        const parts = String(e.data === undefined ? "" : e.data).split(",");
        for (let i = 0; i < L && i < parts.length; i++) {
            if (parts[i].trim() === "yes") assign[i] = c;
        }
    }
    if (assign.some((x) => x === null)) return null;
    const pw = assign.join("");
    const a = await authOnce(ns, host, pw, ctx);
    return a.ok ? pw : null;
}

/**
 * TimingAttack (2G_cellular) — die Meldung nennt den Index des ersten
 * Unterschieds -> praefixweiser Aufbau.
 */
async function solveTiming(ns, host, d, ctx) {
    const L = Math.floor(Number(d && d.passwordLength) || 0);
    if (L <= 0) return null;
    const set = charsetOf(d);
    let prefix = "";
    for (let i = 0; i < L; i++) {
        const probes = [];
        for (const c of set) probes.push(prefix + c + FILLER_CHAR.repeat(L - i - 1));
        const r = await probeMany(ns, host, probes, ctx);
        if (r.hit) return r.hit;
        if (!r.cha || r.out) return null;
        let next = null;
        for (const c of set) {
            const e = r.map.get(prefix + c + FILLER_CHAR.repeat(L - i - 1));
            if (!e) continue;
            const m = String(e.message || "").match(/[(]([-0-9]+)[)]/);
            const idx = m ? Number(m[1]) : NaN;
            if (idx === -1 || idx > i) { next = c; break; }
        }
        if (next === null) return null;
        prefix += next;
    }
    const a = await authOnce(ns, host, prefix, ctx);
    return a.ok ? prefix : null;
}

/**
 * tripleModulo (BigMo%od) — Antwort ist (P % n) % (((n-1) % 32) + 1).
 * Fuer n <= 32 ist das schlicht P % n -> chinesischer Restsatz.
 */
async function solveModulo(ns, host, d, ctx) {
    const L = Math.floor(Number(d && d.passwordLength) || 0);
    const MODS = [32, 27, 25, 7, 11, 13, 17, 19, 23, 29, 31];
    const need = L > 0 ? Math.pow(10, L) : 1e15;
    const use = [];
    let prod = 1;
    for (const m of MODS) { use.push(m); prod = prod * m; if (prod > need) break; }
    const r = await probeMany(ns, host, use, ctx);
    if (r.hit) return r.hit;
    if (!r.cha) return null;

    let x = 0n, M = 1n;
    for (const m of use) {
        const e = r.map.get(String(m));
        if (!e) return null;
        const v = Number(String(e.data === undefined ? "" : e.data));
        if (!isFinite(v)) return null;
        const mi = BigInt(m), vi = BigInt(Math.round(v));
        let k = 0n;
        while (((x + M * k) % mi + mi) % mi !== ((vi % mi) + mi) % mi) {
            k++;
            if (k > mi) return null;
        }
        x = x + M * k;
        M = M * mi;
    }
    const pw = x.toString();
    if (L > 0 && pw.length !== L) return null;
    const a = await authOnce(ns, host, pw, ctx);
    return a.ok ? pw : null;
}

// ===========================================================================
// KingOfTheHill (globalMaxima) — REINE SUCHE, OHNE BEZUG ZUM SPIEL   [v4.6]
//
// Die Engine (DarkNet/effects/authentication.ts:216-244) baut eine Landschaft
// aus Gauss-Huegeln:
//     h(x) = SUMME  H_i * exp(-((x - loc_i)^2 / w^2))
//     w        = 10^max(L-2,0) + 1                       (L = Passwortlaenge)
//     Anzahl   = min(floor(difficulty/8), 4) * 2 + 1      -> 1, 3, 5, 7 oder 9
//     Hauptberg  H = 10000, loc = Passwort
//     Nebenberge H = 10000 - |k|*2600*(0.95..1.05)
//                loc = Passwort + k*3w*(0.9..1.1),  k = Abstand in Bergen
// Innerhalb von 3 % um das Passwort liefert die Engine bewusst NUR den
// Hauptberg — dort ist die Kurve exakt eine einzelne Gauss-Glocke.
//
// DER HEBEL: ln(h) ist ueber einem einzelnen Berg EXAKT eine Parabel:
//     ln h(x) = ln(H) - (x - loc)^2 / w^2
// Drei Messpunkte legen eine Parabel eindeutig fest, und aus ihr fallen BEIDE
// Unbekannten heraus: der Scheitel ist loc, der Scheitelwert ist ln(H). Die
// HOEHE verraet damit, ob man auf dem Hauptberg steht (H ~ 10000) oder wie
// viele Berge man danebenliegt (k ~ (10000 - H) / 2600).
//
// Gemessen gegen eine exakte Nachbildung der Engine, 800 Faelle ueber
// Passwortlaengen 2-5 und Schwierigkeiten 4-40:
//     bisher   im Schnitt 76,8 Sonden      neu   im Schnitt 30,9 Sonden
//     beide loesen 800 von 800.
// Bei einem einzelnen Berg (difficulty < 8) sind es 7 statt 95.
//
// WARUM DAS ALTE RASTER TROTZDEM ALS RUECKFALL BLEIBT:
// Seine Schrittweite w ist nicht zu fein, sondern genau richtig. Bei Schritt w
// liegt jede Messung hoechstens w/2 von einem Berg entfernt, liefert also
// mindestens exp(-0.25) = 78 % seiner Hoehe. Der Hauptberg misst damit im
// schlechtesten Fall 7800 und schlaegt jeden Nebenberg (hoechstens 7530) auch
// in dessen bestem Fall. Mit Schritt 2w waere das falsch: 37 % vom Hauptberg
// sind 3700, ein mittig getroffener Nebenberg liefert 7400 — die Rangfolge
// waere umgekehrt. Am Raster wird deshalb NICHT gespart; es wird nur seltener
// gebraucht.
//
// WARUM DIE SUCHE HIER OHNE ns STEHT:
// Sie bekommt eine einzige Rueckruffunktion und laeuft damit im Spiel und in
// der Pruefleiste WORTGLEICH. Eine Suche, die man nur im Spiel testen kann,
// ist eine Suche, die man nicht testet.
// ===========================================================================

const KOTH_HOEHE   = 10000;   // Hoehe des Hauptbergs
const KOTH_STUFE   = 2600;    // Hoehenverlust je Bergabstand
const KOTH_ABSTAND = 3;       // Bergabstand in Vielfachen von w

/** Gauss-Breite aus der Passwortlaenge (Engine: authentication.ts:222). */
function kothBreite(L) { return Math.pow(10, Math.max(L - 2, 0)) + 1; }

/** Kleinste und groesste Zahl mit genau L Stellen. */
function kothBereich(L) {
    return { lo: L === 1 ? 0 : Math.pow(10, L - 1), hi: Math.pow(10, L) };
}

/**
 * Parabel durch drei Messpunkte legen und Scheitel bestimmen.
 *
 * Erwartet [{x, alt}, ...] mit alt > 0 und rechnet auf ln(alt), weil die Kurve
 * dort exakt quadratisch ist. Liefert { mitte, hoehe } oder null.
 *
 * Die Punkte duerfen beliebig liegen — es wird echt quadratisch interpoliert,
 * kein Drei-Punkte-Schema mit fester Schrittweite. Genau daran krankte die
 * alte Feinsuche: sie verlangte gleiche Abstaende und musste deshalb bei jedem
 * Durchgang alle drei Punkte neu messen, auch den schon bekannten.
 */
function kothScheitel(punkte) {
    const p = (punkte || []).filter((q) => q && isFinite(q.x) && isFinite(q.alt) && q.alt > 0);
    if (p.length < 3) return null;
    // Moeglichst weit auseinanderliegende Punkte: enge Punkte verstaerken den
    // Rundungsfehler in den geteilten Nennern.
    p.sort((a, b) => a.x - b.x);
    const A = p[0], B = p[Math.floor(p.length / 2)], C = p[p.length - 1];
    if (A.x === B.x || B.x === C.x || A.x === C.x) return null;
    const ya = Math.log(A.alt), yb = Math.log(B.alt), yc = Math.log(C.alt);
    const d1 = (A.x - B.x) * (A.x - C.x);
    const d2 = (B.x - A.x) * (B.x - C.x);
    const d3 = (C.x - A.x) * (C.x - B.x);
    if (d1 === 0 || d2 === 0 || d3 === 0) return null;
    const a = ya / d1 + yb / d2 + yc / d3;
    const b = -(ya * (B.x + C.x)) / d1 - (yb * (A.x + C.x)) / d2 - (yc * (A.x + B.x)) / d3;
    const c = (ya * B.x * C.x) / d1 + (yb * A.x * C.x) / d2 + (yc * A.x * B.x) / d3;
    if (!isFinite(a) || a >= 0) return null;          // nach oben offen -> kein Berg
    const mitte = -b / (2 * a);
    if (!isFinite(mitte)) return null;
    const hoehe = Math.exp(a * mitte * mitte + b * mitte + c);
    if (!isFinite(hoehe) || hoehe <= 0) return null;
    return { mitte: mitte, hoehe: hoehe };
}

/**
 * Wie viele Berge liegt dieser Gipfel neben dem Hauptberg? Nebenberge
 * verlieren je Schritt 2600 * (0.95..1.05); bei 10000 ist es der Hauptberg.
 */
function kothVersatz(hoehe) {
    const fehlt = KOTH_HOEHE - hoehe;
    if (fehlt < KOTH_STUFE * 0.5) return 0;
    return Math.max(1, Math.round(fehlt / KOTH_STUFE));
}

/**
 * Startsonden: moeglichst wenige Punkte, die garantiert irgendwo eine Hoehe
 * ueber null liefern.
 *
 * exp() unterlaeuft im Double erst bei (x-loc)/w > 27. Ein Raster mit
 * Schrittweite 20w laesst also keine Luecke, in der ALLE Berge auf exakt 0
 * gerundet werden. Der Zahlenbereich ist rund 90w breit — das sind fuenf
 * Punkte statt neunzig.
 */
function kothStart(L) {
    const w = kothBreite(L);
    const b = kothBereich(L);
    const schritt = 20 * w;
    const out = [];
    for (let x = b.lo + schritt / 2; x < b.hi && out.length < 12; x += schritt) out.push(Math.round(x));
    if (!out.length) out.push(Math.round((b.lo + b.hi) / 2));
    return out;
}

/** Volles Raster mit Schrittweite w — der Rueckfall. Begruendung im Kopf. */
function kothRaster(L, deckel) {
    const w = kothBreite(L);
    const b = kothBereich(L);
    const out = [];
    for (let x = b.lo; x < b.hi && out.length < (deckel || 130); x += w) out.push(Math.round(x));
    return out;
}

/**
 * Die Suche.
 *
 * Der Rueckruf "messen(xs)" bekommt eine LISTE von Kandidaten und liefert
 *   { hit: "<passwort>" }              einer davon war richtig,
 *   { werte: Map<string, number> }     Hoehe je Kandidat,
 *   null                               keine Versuche mehr / Abbruch.
 * Gebuendelt, weil die Hoehe im Spiel nur ueber heartbleed lesbar ist
 * (ns.dnet.authenticate liefert data NUR bei Labyrinth-Servern) — ein
 * Log-Abruf je Sonde waere Zeitverschwendung.
 *
 * @param {number} L Passwortlaenge
 * @param {(xs:number[])=>Promise<any>} messen
 * @returns {Promise<string|null>} Passwort oder null
 */
async function kothSuchen(L, messen) {
    const w = kothBreite(L);
    const passt = (x) => x >= 1 && String(Math.round(x)).length === L;
    const hole = (r, x) => {
        const v = r && r.werte ? r.werte.get(String(Math.round(x))) : undefined;
        return typeof v === "number" && isFinite(v) ? v : -1;
    };

    // ---- 1. Startsonden --------------------------------------------------
    const start = kothStart(L);
    let r = await messen(start);
    if (!r) return null;
    if (r.hit) return r.hit;

    const punkte = [];
    for (const x of start) {
        const a = hole(r, x);
        if (a > 0) punkte.push({ x: Math.round(x), alt: a });
    }

    if (punkte.length) {
        punkte.sort((a, b) => b.alt - a.alt);
        let anker = punkte[0];
        // Hoechstens vier Bergwechsel: bei neun Bergen liegt der Hauptberg nie
        // weiter als vier Berge entfernt.
        for (let runde = 0; runde < 4; runde++) {
            const nachbarn = [anker.x - w, anker.x + w].filter((x) => x >= 1);
            r = await messen(nachbarn);
            if (!r) return null;
            if (r.hit) return r.hit;
            const drei = [anker];
            for (const x of nachbarn) {
                const a = hole(r, x);
                if (a > 0) drei.push({ x: Math.round(x), alt: a });
            }
            const s = kothScheitel(drei);
            if (!s) break;

            if (kothVersatz(s.hoehe) === 0) {
                // Hauptberg: der Scheitel IST das Passwort. Die Probe ist
                // Beweis und Rateversuch in einem; die Nachbarn fangen den
                // Rundungsfall ab.
                const m = Math.round(s.mitte);
                const kand = [m, m - 1, m + 1].filter(passt);
                if (!kand.length) break;
                r = await messen(kand);
                if (!r) return null;
                if (r.hit) return r.hit;
                break;
            }

            // Danebenliegend: der Hauptberg steht k Berge weiter, je 3w.
            // Beide Richtungen anmessen, die hoehere weiterverfolgen.
            const sprung = kothVersatz(s.hoehe) * KOTH_ABSTAND * w;
            const ziele = [s.mitte - sprung, s.mitte + sprung].map(Math.round).filter((x) => x >= 1);
            if (!ziele.length) break;
            r = await messen(ziele);
            if (!r) return null;
            if (r.hit) return r.hit;
            let bester = null;
            for (const z of ziele) {
                const a = hole(r, z);
                if (a > 0 && (!bester || a > bester.alt)) bester = { x: z, alt: a };
            }
            if (!bester) break;
            anker = bester;
        }
    }

    // ---- 2. Rueckfall: das bewaehrte Raster ------------------------------
    const raster = kothRaster(L);
    r = await messen(raster);
    if (!r) return null;
    if (r.hit) return r.hit;
    let best = null, bestA = -1;
    for (const x of raster) {
        const a = hole(r, x);
        if (a > bestA) { bestA = a; best = Math.round(x); }
    }
    if (best === null || bestA <= 0) return null;

    for (let pass = 0; pass < 6; pass++) {
        const step = Math.max(1, Math.round(w / 4));
        const pts = [best - step, best, best + step].filter((x) => x >= 1);
        r = await messen(pts);
        if (!r) return null;
        if (r.hit) return r.hit;
        const y = pts.map((x) => hole(r, x));
        if (y.length < 3 || y.some((v) => v <= 0)) break;
        const l = y.map((v) => Math.log(v));
        const denom = l[0] - 2 * l[1] + l[2];
        if (denom === 0) break;
        const next = Math.round(best + (step * (l[0] - l[2])) / (2 * denom));
        if (!isFinite(next) || next < 1 || next === best) break;
        best = next;
    }
    const kand = [best, best - 1, best + 1, best - 2, best + 2].filter(passt);
    if (!kand.length) return null;
    r = await messen(kand);
    if (!r) return null;
    return r.hit ? r.hit : null;
}

/**
 * globalMaxima (KingOfTheHill) — Bruecke zwischen der reinen Suche oben und
 * dem Spiel. Buendelt Sonden ueber probeMany und reicht die Hoehen als Map
 * zurueck; die Hoehe steht im Logeintrag (e.data), weil
 * ns.dnet.authenticate sie nur bei Labyrinth-Servern direkt mitgibt
 * (NetscriptFunctions/Darknet.ts:163-176).
 */
async function solveMaxima(ns, host, d, ctx) {
    const L = Math.floor(Number(d && d.passwordLength) || 0);
    if (L <= 0) return null;
    const messen = async (xs) => {
        if (ctx.left <= 0) return null;
        const liste = xs.map((x) => String(Math.round(x)));
        if (!liste.length) return { werte: new Map() };
        const r = await probeMany(ns, host, liste, ctx);
        if (r.hit) return { hit: r.hit };
        if (!r.cha || r.out) return null;
        const werte = new Map();
        for (const pw of liste) {
            const e = r.map.get(pw);
            const v = e ? Number(String(e.data === undefined ? "" : e.data)) : NaN;
            if (isFinite(v)) werte.set(pw, v);
        }
        return { werte: werte };
    };
    return await kothSuchen(L, messen);
}

/**
 * packetSniffer (OpenWebAccessPoint) — bis difficulty 16 steht "<host>:<pw>"
 * woertlich im Mitschnitt; darueber Schnittmenge mehrerer Mitschnitte.
 */
function commonSubstrings(blobs, minLen, maxLen, cap) {
    if (blobs.length === 0) return [];
    const first = blobs[0];
    const out = [];
    const seen = new Set();
    for (let len = maxLen; len >= minLen && out.length < cap; len--) {
        for (let i = 0; i + len <= first.length && out.length < cap; i++) {
            const sub = first.substr(i, len);
            if (seen.has(sub)) continue;
            seen.add(sub);
            if (sub.indexOf(" ") >= 0) continue;
            let all = true;
            for (let k = 1; k < blobs.length; k++) {
                if (blobs[k].indexOf(sub) < 0) { all = false; break; }
            }
            if (all) out.push(sub);
        }
    }
    return out;
}

async function solvePacket(ns, host, d, ctx) {
    const L = Math.floor(Number(d && d.passwordLength) || 0);
    const blobs = [];
    const direct = [];
    for (let round = 0; round < 4 && ctx.left > 2; round++) {
        const a = await authOnce(ns, host, String(round + 1), ctx);
        if (a.ok) return String(round + 1);
        if (a.out) break;
        const lg = await readLogs(ns, host, 25);
        if (!lg.cha) return null;
        for (const e of lg.entries) {
            const blob = String(e.data === undefined ? "" : e.data);
            if (blob.length > 40) blobs.push(blob);
        }
        const hay = lg.raw.join(" ") + " " + blobs.join(" ");
        let idx = 0;
        while ((idx = hay.indexOf(host + ":", idx)) >= 0) {
            const rest = hay.slice(idx + host.length + 1);
            const tok = rest.split(/[ .,]/)[0];
            if (tok && direct.indexOf(tok) < 0) direct.push(tok);
            idx += host.length + 1;
        }
        const marker = "passcode: ";
        idx = 0;
        while ((idx = hay.indexOf(marker, idx)) >= 0) {
            const tok = hay.slice(idx + marker.length).split(/[ .,]/)[0];
            if (tok && direct.indexOf(tok) < 0) direct.push(tok);
            idx += marker.length;
        }
        if (direct.length > 0) break;
    }
    for (const pw of direct) {
        if (ctx.left <= 0) return null;
        const a = await authOnce(ns, host, pw, ctx);
        if (a.ok) return pw;
    }
    if (blobs.length >= 2) {
        const minL = L > 0 ? L : 3;
        const maxL = L > 0 ? L : 9;
        for (const pw of commonSubstrings(blobs, minL, maxL, PACKET_CANDS)) {
            if (ctx.left <= 0) return null;
            const a = await authOnce(ns, host, pw, ctx);
            if (a.ok) return pw;
        }
    }
    return null;
}

/** "Hoeher/Tiefer" (GuessNumber, RomanNumeral-Bereich) — Binaersuche. */
async function solveUpDown(ns, host, low, high, ctx) {
    let lo = Math.floor(low), hi = Math.floor(high);
    while (lo <= hi && ctx.left > 0) {
        const guess = Math.floor((lo + hi) / 2);
        const res = await probeOne(ns, host, guess, ctx);
        if (res.ok) return String(guess);
        if (res.out || res.cha === false) return null;
        const txt = (String((res.entry && res.entry.data) || "") + " "
            + String((res.entry && res.entry.message) || "")).toUpperCase();
        if (txt.indexOf("HIGHER") >= 0 || txt.indexOf("PARUM") >= 0 || txt.indexOf("BREVIS") >= 0) lo = guess + 1;
        else if (txt.indexOf("LOWER") >= 0 || txt.indexOf("ALTUS") >= 0 || txt.indexOf("NIMIS") >= 0) hi = guess - 1;
        else return null;
    }
    return null;
}

/** Verteiler: waehlt den Loeser zum erkannten Rueckmeldungstyp. */
async function solveFeedback(ns, host, res, d, ctx) {
    switch (res.kind) {
        case "updown": return await solveUpDown(ns, host, res.low === undefined ? 0 : res.low,
            res.high === undefined ? 1e9 : res.high, ctx);
        case "overflow": return await solveOverflow(ns, host, d, ctx);
        case "divisibility": return await solveDivisibility(ns, host, d, ctx);
        // v4.4: res.sorted MUSS mit. Begruendung bei solveSortedEcho.
        case "sortedecho": return await solveSortedEcho(ns, host, d, ctx, res.sorted);
        case "spice": return await solveExactCount(ns, host, d, ctx, "spice");
        case "mastermind": return await solveExactCount(ns, host, d, ctx, "mastermind");
        case "yesnt": return await solveYesnt(ns, host, d, ctx);
        case "timing": return await solveTiming(ns, host, d, ctx);
        case "modulo": return await solveModulo(ns, host, d, ctx);
        case "maxima": return await solveMaxima(ns, host, d, ctx);
        case "packet": return await solvePacket(ns, host, d, ctx);
        // "labyrinth" hat hier bewusst KEINEN Zweig mehr — das laeuft in
        // schwarm-lab.js, weil die Position an der PID haengt.
        default: return null;
    }
}


function assembleCandidates(res, host, clues, manual) {
    const cands = [];
    const add = (p) => { if (p != null && !cands.includes(p)) cands.push(p); };
    add(manual.byHost[host]);
    add(clues.byHost[host]);
    for (const p of res.candidates) add(p);
    for (const p of manual.loose) add(p);
    for (const p of clues.loose) add(p);
    return cands;
}

async function tryAuth(ns, host, pw) {
    try { const r = await ns.dnet.authenticate(host, String(pw)); return !!(r && r.success); }
    catch (e) { return false; }
}

async function scrapeLogs(ns, host, d) {
    let logs = [];
    try {
        const hb = await ns.dnet.heartbleed(host, { peek: true });
        if (hb && hb.code === DNET_CODE.NOT_ENOUGH_CHARISMA) return { cands: [], charisma: true };
        logs = hb && hb.logs ? [].concat(hb.logs) : [];
    } catch (e) { return { cands: [] }; }

    const text = logs.map((l) => (typeof l === "string" ? l : JSON.stringify(l))).join("  ");
    if (DEBUG_DUMP && !dumpedLogs) { dumpedLogs = true; ns.print("LOGS " + host + ": " + text.slice(0, 600)); }

    const specific = [];
    const profiled = [];
    const push = (arr, v) => { if (v && !arr.includes(v) && !specific.includes(v)) arr.push(v); };
    for (const m of text.matchAll(/--(.+?)--/g)) push(specific, m[1]);
    for (const m of text.matchAll(/passcode:\\s*([^\\s.]+)/gi)) push(specific, m[1]);
    for (const m of text.matchAll(/with password\\s*'([^']*)'/gi)) push(specific, m[1]);
    for (const m of text.matchAll(/:([^\\s:.]+)\\s*\\.\\.\\./g)) push(specific, m[1]);

    const len = Number(d.passwordLength) || 0;
    if (len > 0) {
        const cls = d.passwordFormat === "numeric" ? "0-9"
            : d.passwordFormat === "alphabetic" ? "A-Za-z" : "A-Za-z0-9";
        try { for (const m of text.matchAll(new RegExp("\\\\b[" + cls + "]{" + len + "}\\\\b", "g"))) push(profiled, m[0]); }
        catch (e) { /* */ }
    }
    return { cands: [...specific, ...profiled].slice(0, SCRAPE_MAX_CANDS) };
}

function readClues(ns, self) {
    const out = { byHost: {}, loose: [] };
    try {
        for (const f of safeLs(ns, self)) {
            if (!f.endsWith(".data.txt")) continue;
            let txt = "";
            try { txt = ns.read(f); } catch (e) { continue; }
            const m1 = txt.match(/Server:\\s*(\\S+)\\s*Password:\\s*"([^"]*)"/i);
            if (m1) out.byHost[m1[1]] = m1[2];
            const m2 = txt.match(/Remember this password:\\s*(.+)/i);
            if (m2) out.loose.push(m2[1].trim());
        }
    } catch (e) { /* */ }
    return out;
}

function readManual(ns) {
    const out = { byHost: {}, loose: [] };
    try {
        for (const line of String(ns.read(MANUAL) || "").split("\\n")) {
            const s = line.trim();
            if (!s || s.startsWith("#")) continue;
            const i = s.indexOf("=");
            if (i > 0) out.byHost[s.slice(0, i).trim()] = s.slice(i + 1);
            else out.loose.push(s);
        }
    } catch (e) { /* */ }
    return out;
}

// =============================================================================
// HAUPT — ein Ziel, ein Lauf.
// =============================================================================

function tell(ns, parts) {
    // Unit Separator als Feldtrenner: Darknet-Hostnamen duerfen Semikola und
    // Doppelpunkte enthalten (gesichtet: "ech0:c0m", "neo@networks: solutions").
    try { ns.getPortHandle(TELEMETRY).tryWrite(parts.join("\\u001f")); } catch (e) { /* */ }
}

/**
 * Passwort sofort lokal sichern. Der Roamer liest MANUAL jede Runde (readManual)
 * und kann damit unmittelbar connectToSession aufrufen — Sessions haengen an der
 * PID (authentication.ts:206), sein Prozess braucht also sein eigenes Passwort.
 */
/**
 * WOERTERBUCH-FORTSCHRITT JE ZIEL  [v4.3]
 *
 * Ein Knack-Lauf hat zwei Minuten (RUN_MS) und 400 Versuche. Bei teuren
 * Zielen reicht die ZEIT nicht fuer das ganze Woerterbuch: die Auth-Dauer ist
 * 850 ms * (5*chaRequired + (difficulty+1)*100) / (charisma + 150), also
 * schnell ein bis zwei Sekunden je Versuch. Live gemessen an "TopPass"
 * (93 Woerter): im Schnitt 66 Versuche, dann war die Frist um.
 *
 * Bisher begann der naechste Lauf wieder bei Wort 1. Damit wurden immer
 * dieselben ersten zwei Dritteln probiert und das letzte Drittel NIE — vier
 * von elf Zielen geknackt, sieben aufgegeben. Kein Zufall, sondern Bauart.
 *
 * Jetzt merkt sich der Lauf, wo er aufgehoert hat, und der naechste faengt
 * dort an. Wichtig ist das UMLAUFEN: es wird nicht "ab Position N bis Ende"
 * probiert, sondern die ganze Liste einmal rund. Damit ist jedes Wort in
 * jedem Lauf erreichbar, und ein veralteter Stand (der Server wurde neu
 * gewuerfelt) kostet nichts — er verschiebt nur den Startpunkt.
 *
 * Die Datei ist streng lokal, wie PW_FILE: ein Schreiber, ein Leser, kein scp.
 */
const POS_FILE = "dnet-pos.txt";

/** Gemerkte Startposition fuer dieses Ziel (0, wenn nichts bekannt). */
function ladePos(ns, host) {
    try {
        for (const line of String(ns.read(POS_FILE) || "").split("\\n")) {
            const t = line.trim();
            if (!t || t.charAt(0) === "#") continue;
            const i = t.indexOf("=");
            if (i > 0 && t.slice(0, i).trim() === host) {
                const n = Number(t.slice(i + 1).trim());
                return isFinite(n) && n >= 0 ? Math.floor(n) : 0;
            }
        }
    } catch (e) { /* keine Datei -> von vorn */ }
    return 0;
}

/** Position merken. n <= 0 loescht den Eintrag (Ziel ist durch). */
function merkePos(ns, host, n) {
    try {
        const lines = [];
        let gesetzt = false;
        for (const line of String(ns.read(POS_FILE) || "").split("\\n")) {
            const t = line.trim();
            if (!t) continue;
            const i = t.indexOf("=");
            if (i > 0 && t.slice(0, i).trim() === host) {
                if (n > 0) { lines.push(host + "=" + n); gesetzt = true; }
                // n <= 0: Zeile faellt weg
            } else lines.push(line);
        }
        if (!gesetzt && n > 0) lines.push(host + "=" + n);
        ns.write(POS_FILE, lines.join("\\n"), "w");
    } catch (e) { /* Merken ist Kuer, nicht Pflicht */ }
}

function saveLocal(ns, host, pw) {
    try {
        const lines = [];
        let found = false;
        for (const line of String(ns.read(PW_FILE) || "").split("\\n")) {
            const t = line.trim();
            if (!t) continue;
            const i = t.indexOf("=");
            if (i > 0 && !t.startsWith("#") && t.slice(0, i).trim() === host) {
                lines.push(host + "=" + pw);
                found = true;
            } else lines.push(line);
        }
        if (!found) lines.push(host + "=" + pw);
        ns.write(PW_FILE, lines.join("\\n"), "w");
    } catch (e) { /* Telemetrie ist der zweite Weg */ }
}

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    const host = String(ns.args[0] || "");
    const self = ns.getHostname();
    if (!host) { tell(ns, ["CRACKERR", self, "kein Zielhost uebergeben"]); return; }

    let d;
    try { d = ns.dnet.getServerDetails(host); }
    catch (e) { tell(ns, ["CRACKERR", host, "getServerDetails: " + String(e && e.message ? e.message : e)]); return; }
    if (!d || d.isOnline === false) { tell(ns, ["CRACKGONE", host, "offline"]); return; }
    if (d.isConnectedToCurrentServer === false) { tell(ns, ["CRACKGONE", host, "nicht verbunden"]); return; }

    // v4.1.2 — BEI ROOT NICHT MEHR ABBRECHEN.
    // Frueher endete der Lauf hier ("war bereits offen"). Das war richtig, solange
    // die Passwoerter netzweit verteilt wurden: wer Root sah, hatte das Passwort
    // ohnehin aus der globalen Liste. Seit v4.1 sind sie lokal — ein Roamer, der
    // nach killall oder Mutation neu startet, kennt das Passwort seines laengst
    // gerooteten Nachbarn NICHT und kommt ohne Session weder per scp noch per exec
    // an ihn heran (NetscriptFunctions.ts:636/761). Der Server war damit
    // unerreichbar, und weil der Roamer ihn als "erledigt" zaehlte, versuchte es
    // auch niemand mehr.
    // checkPassword (authentication.ts:19-31) vergleicht NUR das Passwort und
    // schert sich nicht um Root — der Server laesst sich also neu authentifizieren,
    // und handleSuccessfulAuth bindet die Session an DIESE PID. Genau das ist der
    // Zweck dieses Laufs. Hat der Roamer bereits eine Session, ist nichts zu tun.
    if (d.hasSession === true) { tell(ns, ["CRACKDONE", host, "Session bereits vorhanden"]); return; }
    let alreadyRooted = false;
    try { alreadyRooted = !!ns.hasRootAccess(host); } catch (e) { alreadyRooted = false; }

    const clues = readClues(ns, self);
    const manual = readManual(ns);
    const res = crack(d);
    const ctx = { left: ATTEMPT_BUDGET, until: Date.now() + (res.feedback ? RUN_MS_FB : RUN_MS) };   // v4.1

    const win = (pw, via) => {
        saveLocal(ns, host, String(pw));
        // Bei einem schon gerooteten Server ging es nur um Passwort und Session —
        // das getrennt melden, damit die Bilanz im Daemon deutbar bleibt.
        tell(ns, ["PW", host, String(pw), alreadyRooted ? via + ":resession" : via]);
        tell(ns, ["MAP", host, String(d.depth === undefined ? "?" : d.depth),
            d.modelId === undefined ? "?" : d.modelId]);
        // v4.2 MODELL-STATISTIK. Die Raetselerkennung selbst ist exakt — crack()
        // schaltet auf d.modelId aus getServerDetails, es wird nichts geraten.
        // Unbekannt ist nur, WELCHE Modelle in der Praxis teuer sind: die
        // Rueckmelde-Raetsel (needFeedback) und die Faelle, in denen der Hint
        // nicht geparst werden konnte (todoModel). Ohne Zahlen waere jede
        // Optimierung am Loeser geraten. Deshalb: je Modell mitzaehlen, was
        // herauskam und wie viele Versuche es gekostet hat.
        tell(ns, ["MODEL", d.modelId === undefined ? "?" : String(d.modelId),
            "ok", String(ATTEMPT_BUDGET - ctx.left)]);
        tell(ns, ["CRACKDONE", host, via]);
    };

    // 1) Berechnete / Woerterbuch- / manuelle / Clue-Kandidaten.
    //    v4.3: MIT UMLAUF. Der Lauf beginnt dort, wo der letzte aufhoerte, und
    //    geht die Liste einmal rund. Begruendung siehe ladePos() weiter oben.
    {
        const alle = assembleCandidates(res, host, clues, manual);
        const start = alle.length ? (ladePos(ns, host) % alle.length) : 0;
        let getan = 0;
        for (; getan < alle.length; getan++) {
            const idx = (start + getan) % alle.length;
            const a = await authOnce(ns, host, alle[idx], ctx);
            if (a.ok) { merkePos(ns, host, 0); win(alle[idx], "candidate"); return; }
            if (a.out) { merkePos(ns, host, (idx + 1) % alle.length); break; }
        }
        // Liste einmal ganz durch und nichts dabei: der Startpunkt hat sich
        // erledigt, sonst wuerde er kuenftige Laeufe grundlos verschieben.
        if (getan >= alle.length) merkePos(ns, host, 0);
    }

    // 2) Feedback-Raetsel (Orakel ueber heartbleed-Logs).
    if (res.feedback && ctx.left > 0 && Date.now() < ctx.until) {
        const pw = await solveFeedback(ns, host, res, d, ctx);
        if (pw !== null) { win(pw, "feedback:" + String(res.kind)); return; }
    }

    // 3) Rueckfall: Passwortkandidaten aus den Serverlogs fischen.
    if (Date.now() < ctx.until && ctx.left > 0) {
        const worthScraping = res.todo || (res.feedback && res.kind !== "updown")
            || d.modelId === DNET_MODELS.packetSniffer;
        if (worthScraping) {
            const sc = await scrapeLogs(ns, host, d);
            if (sc.charisma) {
                tell(ns, ["CHARISMA", host, String(d.requiredCharismaSkill === undefined ? "?" : d.requiredCharismaSkill)]);
                return;
            }
            for (const pw of sc.cands) {
                if (Date.now() >= ctx.until || ctx.left <= 0) break;
                const a = await authOnce(ns, host, pw, ctx);
                if (a.ok) { win(pw, "logscrape"); return; }
            }
        }
    }

    // 4) Nichts hat geklappt — Grund melden, damit der Daemon es einordnen kann.
    // v4.5: Grund mitgeben, wenn der Rueckmelde-Loeser einen hinterlassen hat
    // (ctx.seWarum, siehe solveSortedEcho). Ohne den Grund sieht jedes
    // Scheitern gleich aus, und die Ursache bleibt Ratesache.
    if (res.feedback) tell(ns, ["FEEDBACK", host,
        (res.kind || "?") + (ctx.seWarum ? " | " + String(ctx.seWarum) : "")]);
    else if (res.todo) tell(ns, ["TODO", host, d.modelId === undefined ? "?" : d.modelId]);
    // v4.2: dieselbe Modell-Statistik wie im Erfolgsfall, nur mit dem Ausgang.
    // "feedback" = Rueckmelde-Raetsel (Raten mit Rueckmeldung, teuer),
    // "todo"     = Hint liess sich nicht parsen (Loeser-Luecke, gezielt fixbar),
    // "fail"     = Modell bekannt, Kandidaten erschoepft oder Zeitdeckel.
    tell(ns, ["MODEL", d.modelId === undefined ? "?" : String(d.modelId),
        res.feedback ? "feedback" : (res.todo ? "todo" : "fail"),
        String(ATTEMPT_BUDGET - ctx.left)]);
    tell(ns, ["CRACKFAIL", host, String(ATTEMPT_BUDGET - ctx.left) + " Versuche",
        ctx.weg ? "Ziel weg" : (Date.now() >= ctx.until ? "Zeitdeckel" : "erschoepft")]);   // v4.1
}

export function autocomplete() { return ["--tail"]; }
`;

// ---- Zustand ----------------------------------------------------------------
const map = {};                     // host -> { depth, model, neighbors }
const joined = new Set();           // Roamer, die sich gemeldet haben
const needpw = new Set();           // offene Server ohne Passwort
const storm = new Set();            // Server mit STORM_SEED (in Ruhe lassen)
const gated = new Map();            // host -> benoetigtes Charisma
const todo = new Map();             // host -> Modell, das der Cracker nicht kann
const feedback = new Map();         // host -> Feedback-Raetselart
const bigblock = new Map();         // host -> GB (grosser Block)
const pending = new Map();          // host -> letzter SPREAD-Grund (geknackt, kein Roamer)
// ---- v4.0: Fern-Inventur + Kartenpflege ------------------------------------
const inv = new Map();              // host -> { caches, ccts, block, root, ts }
const goneCount = new Map();        // host -> wie oft leer gesehen (Mutation)
let invTotals = { caches: 0, ccts: 0, blockGb: 0, hosts: 0, backlog: 0 };
let sweepUntil = 0;                 // laeuft gerade ein Kahlschlag?
let sweepCooldown = 0;              // frühester naechster Auto-Kahlschlag
let sweepReason = "";
let sweepsDone = 0;
let purged = 0;                     // aus der Karte geworfene Geisterhosts
let orderLine = "";                 // letzter veroeffentlichter Auftrag (Anzeige)
let cacheCount = 0;
let crackedCount = 0;
let seedFailLogged = false;
const aliveRoamers = new Set();     // Hosts mit laufendem ROAMER (letzter Scan)
const aliveOps = new Set();         // Hosts mit laufendem dnet-Op (nur Anzeige)
let lostHosts = [];
let lastTrigger = "-";
// NEU v3.7 — Labyrinth-Lage:
const lab = { host: "-", runner: "-", cha: "?", pos: "-", known: 0, moves: 0, goal: "-",
    state: "-", note: "", solved: 0 };
const labCandidates = new Map();    // labhost -> Set(Server, die daneben stehen)  [v3.8]
const cctHosts = new Map();         // host -> Set(.cct-Dateien)                    [v3.8]
let cctSolved = 0, cctFailed = 0, cctRunning = false;
let remoteOpened = 0;               // fernoeffnete Caches (v3.10)
// v4.2 MODELL-STATISTIK: modelId -> {ok, fail, todo, feedback, tries, n}
// Beantwortet die Frage, die man vor jeder Optimierung am Raetselloeser stellen
// muss: WELCHE Modelle kosten tatsaechlich Zeit? Die Erkennung ist exakt
// (crack() schaltet auf d.modelId), also liegt die Bremse entweder bei den
// Rueckmelde-Raetseln oder bei ungeparsten Hints — und das unterscheidet sich
// je BitNode und Charisma-Stand. Wird im Status veroeffentlicht, DIAG rendert es.
const modelStats = new Map();
let coverage = { withRoamer: 0, known: 0 };   // Roamer-Abdeckung (v3.14)
const labSeen = new Map();          // labhost -> { root, caches }                [v3.11]
const labDone = new Set();          // angestossene Lab-Caches (host/datei)       [v3.11]
let labOpened = 0, labHarvested = 0;
const labPasswords = new Map();     // labhost -> Passwort (v3.12)
const noSession = new Map();        // host -> Grund fehlender Session (v3.13)
const scans = new Map();            // host -> Lagebericht des dortigen Roamers   [v3.9]
const orderAck = new Map();         // host -> bestaetigte Auftragslage           [v4.0]
const crackOps = new Map();         // host -> laufender Knack-Op                 [v4.0]
const crackFails = new Map();       // host -> letzter Fehlschlag-Grund           [v4.0]
let crackStarted = 0, crackWon = 0, crackLost = 0, crackZombies = 0;
const errors = [];                  // Schrittfehler aus den Roamern              [v3.9]
const labRaw = [];                  // rohe Engine-Antworten des Laeufers (Diagnose)  [v3.8]
let cacheFails = 0;

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.atExit(() => {
        try { publishStatus(ns, "DARKNET|status=offline"); } catch (e) { /* */ }
        // v4.0: Auftragsport leeren. Die Auftraege tragen ohnehin eine Frist
        // (Totmannschalter), aber so fallen die Roamer SOFORT in den Normalbetrieb
        // zurueck und phishen weiter, statt bis zu ORDER_TTL_MS zu warten.
        try { publishOrders(ns, ""); } catch (e) { /* */ }
    });

    materializePayloads(ns);
    loadState(ns);
    if (REDEPLOY_ON_START) { try { ns.kill(ROAMER, FIRST_HOP); } catch (e) { /* */ } }

    // v4.0: --sweep erzwingt einen Kahlschlag beim Start (der frueher geplante
    // Einzel-Sweeper ist damit ueberfluessig — der Daemon macht es selbst).
    let forceSweep = ns.args.map(String).includes("--sweep");

    let round = 0;
    while (true) {
        // v4.0 — JEDER SCHRITT MIT EIGENEM catch. Vorher lag die ganze Runde in
        // EINEM try: ein einziger Wurf (etwa der ReferenceError in parseMsg, siehe
        // LABCACHEOK) liess ALLE folgenden Schritte ausfallen — Aussaat,
        // Gesundheitsscan, Lab-Mandat, Contract-Solver, Status und Log. Genau so
        // konnte der Daemon "laufen" und trotzdem nichts bewegen.
        const step = (name, fn) => {
            try { fn(); } catch (e) {
                ns.print(`Schritt ${name} fehlgeschlagen: ${e && e.message ? e.message : e}`);
            }
        };
        if (!hasAccess(ns)) {
            publishStatus(ns, "DARKNET|status=waiting_for_navigator");
            if (round % SUMMARY_EVERY === 0) ns.print(`Warte auf ${NAVIGATOR} (Darknet-Zugang)…`);
        } else {
            step("telemetrie", () => drainTelemetry(ns));            // erst Karte aktualisieren
            // v3.7: wieder JEDE Runde. Der Aufruf kostet ein ns.ps auf darkweb
            // und startet nur, wenn dort KEIN Roamer laeuft.
            step("aussaat", () => seedIfNeeded(ns, "watchdog"));
            if (round % HEALTH_EVERY === 0) step("gesundheit", () => healthScan(ns));
            // Fern-Inventur: erst sie macht die naechsten drei Schritte moeglich.
            if (round % INVENTORY_EVERY === 0) {
                step("inventur", () => takeInventory(ns));
                step("kahlschlag", () => { manageSweep(ns, forceSweep); forceSweep = false; });
                step("auftraege", () => publishWork(ns));
                step("nachsaat", () => seedOrphans(ns));
            }
            step("labmandat", () => assignLabRunner(ns));            // v3.8: genau EIN Laeufer
            if (round % LAB_HARVEST_EVERY === 0) step("labs", () => watchLabs(ns));
            if (round % CCT_EVERY === 0) step("contracts", () => solveContractsOnHome(ns));
            if (round % MANUAL_EVERY === 0) step("manual", () => distributeManual(ns));
            step("status", () => pubStatus(ns));
            if (round % SUMMARY_EVERY === 0) step("log", () => logSummary(ns));
        }
        round++;
        await ns.sleep(LOOP_MS);
    }
}

// =============================================================================
// Zugang & Aussaat
// =============================================================================

function hasAccess(ns) {
    try { return ns.fileExists(NAVIGATOR, "home"); } catch (e) { return false; }
}

/** Payloads aus den eingebetteten Strings auf home schreiben (nur bei Abweichung).
 *  v4.0: injectPorts() setzt die Marke __PORTS__ durch die zentrale Port-Tabelle.
 *  Roamer, Lab und Cracker spiegeln damit keine Portnummern mehr — genau daraus
 *  war die Kollision auf 34 entstanden. */
function materializePayloads(ns) {
    let ok = true;
    for (const pair of [[ROAMER, SRC_ROAMER], [LAB, SRC_LAB], [CRACK, SRC_CRACK]]) {
        try {
            const code = injectPorts(decodePayload(pair[1]));
            if (ns.read(pair[0]) !== code) ns.write(pair[0], code, "w");
        } catch (e) { ok = false; ns.print(`Payload ${pair[0]} materialisieren: ${e}`); }
    }
    return ok;
}

/**
 * Stellt sicher, dass auf darkweb ein ROAMER laeuft (mit aktuellem Code + Solver
 * + Lab-Laeufer). Meldet Fehlschlaege laut, prueft den RAM und raeumt fremde
 * Skripte weg, die den Start blockieren.
 */
function seedIfNeeded(ns, reason) {
    try {
        const running = ns.ps(FIRST_HOP).some((p) => p.filename === ROAMER || p.filename === "/" + ROAMER);
        if (running) { seedFailLogged = false; return true; }

        materializePayloads(ns);
        // v4.0: Der SOLVER bleibt auf home. Er kostet 22 GB und laeuft seit v3.8
        // ausschliesslich dort (codingcontract.getContractType/getData/attempt
        // nehmen alle einen host-Parameter); auf darkweb war er nur Ballast, der
        // Platz fuer den Roamer wegnahm.
        try { materialize(ns, "SOLVER"); } catch (e) { /* PAYLOADS evtl. nicht da */ }
        const files = [ROAMER];
        if (ns.fileExists(LAB, "home")) files.push(LAB);
        // v4.0: der Knacker MUSS mit — ohne ihn kann der Roamer kein Raetsel loesen.
        if (ns.fileExists(CRACK, "home")) files.push(CRACK);
        ns.scp(files, FIRST_HOP);
        try { if (ns.fileExists(MANUAL, "home")) ns.scp(MANUAL, FIRST_HOP); } catch (e) { /* */ }

        let max = 0, used = 0, need = 0;
        try { max = ns.getServerMaxRam(FIRST_HOP); used = ns.getServerUsedRam(FIRST_HOP); } catch (e) { /* */ }
        try { need = ns.getScriptRam(ROAMER, "home"); } catch (e) { /* */ }
        let free = max - used;

        // Platz schaffen — ZWEISTUFIG. Der eigene Dauer-Phisher ist der Ertrag des
        // Servers und weicht nur, wenn es ohne ihn nicht reicht. Der Lab-Laeufer
        // wird NIE abgeschossen: seine Position im Labyrinth haengt an der PID und
        // waere danach verloren.
        if (need > 0 && free < need) {
            const procs = ns.ps(FIRST_HOP);
            const isOwn = (f) => f === ROAMER || f === "/" + ROAMER || f === LAB
                || f === "/" + LAB || f === CRACK || f === "/" + CRACK
                || f.includes("dnet-op-");
            const foreign = procs.filter((p) => !isOwn(p.filename));
            if (foreign.length) {
                for (const p of foreign) { try { ns.kill(p.pid); } catch (e) { /* */ } }
                ns.print(`darkweb war voll (${foreign.length} fremde Skripte) — geräumt.`);
                try { free = ns.getServerMaxRam(FIRST_HOP) - ns.getServerUsedRam(FIRST_HOP); } catch (e) { /* */ }
            }
            if (free < need) {
                const own = procs.filter((p) => p.filename.includes("dnet-op-phish"));
                for (const p of own) { try { ns.kill(p.pid); } catch (e) { /* */ } }
                if (own.length) {
                    ns.print(`darkweb: Phishing weicht kurz (${own.length} Prozesse) — Roamer braucht Platz.`);
                    try { free = ns.getServerMaxRam(FIRST_HOP) - ns.getServerUsedRam(FIRST_HOP); } catch (e) { /* */ }
                }
            }
        }
        if (need > 0 && free < need) {
            if (!seedFailLogged) {
                ns.print(`FEHLER: darkweb hat zu wenig RAM für den Roamer ` +
                    `(frei ${free.toFixed(1)} GB, nötig ${need.toFixed(1)} GB, max ${max} GB).`);
                seedFailLogged = true;
            }
            return false;
        }

        const pid = ns.exec(ROAMER, FIRST_HOP, 1);
        if (pid > 0) {
            lastTrigger = reason;
            ns.print(`Welle gestartet auf ${FIRST_HOP} (Auslöser: ${reason}), pid ${pid} (${need.toFixed(1)} GB).`);
            seedFailLogged = false;
            return true;
        }
        if (!seedFailLogged) {
            ns.print(`FEHLER: ns.exec(${ROAMER}, ${FIRST_HOP}) hat 0 geliefert. ` +
                `RAM frei ${free.toFixed(1)}/${max} GB, nötig ${need.toFixed(1)} GB. ` +
                `Datei da: ${ns.fileExists(ROAMER, FIRST_HOP)}.`);
            seedFailLogged = true;
        }
        return false;
    } catch (e) { ns.print(`Seed-Fehler: ${e}`); return false; }
}

/**
 * Lebenszeichen-Scan ueber die gemappten Darknet-Server.
 *
 * v3.7 BUGFIX: Bis v3.6 galt JEDER SCHWARM-Prozess als Lebenszeichen — auch ein
 * blosser Phish-Op. Da der seit v2 endlos laeuft, wurde ein toter Roamer neben
 * einem lebenden Phisher NIE als Verlust erkannt, und die Aussaat lief nur noch
 * ueber das 5-Minuten-Sicherheitsnetz. Verlust wird jetzt an ROAMERN gemessen.
 * ns.ps kostet einmalig 0,2 GB, unabhaengig von der Zahl der Aufrufe.
 * @returns {number} Zahl der Server, die ihren Roamer verloren haben
 */
function healthScan(ns) {
    const nowRoamer = new Set();
    const nowOps = new Set();
    for (const host of Object.keys(map)) {
        let procs;
        try { procs = ns.ps(host); } catch (e) { continue; }   // Server weg -> verstummt
        if (procs.some((p) => p.filename === ROAMER || p.filename === "/" + ROAMER)) nowRoamer.add(host);
        if (procs.some((p) => p.filename.includes("dnet-op-") || p.filename === LAB
            || p.filename === "/" + LAB)) nowOps.add(host);
    }
    coverage = { withRoamer: nowRoamer.size, known: Object.keys(map).length };
    lostHosts = [...aliveRoamers].filter((h) => !nowRoamer.has(h));
    aliveRoamers.clear();
    for (const h of nowRoamer) aliveRoamers.add(h);
    aliveOps.clear();
    for (const h of nowOps) aliveOps.add(h);
    if (lostHosts.length) {
        // Kein eigener Neustart noetig: die benachbarten Roamer sehen den freien
        // Server ueber isOccupied und saeen selbst nach. Gemeldet wird es trotzdem,
        // weil ein verstummter Server auf eine Darknet-Mutation hindeutet.
        ns.print(`Roamer verstummt auf: ${lostHosts.slice(0, 5).join(", ")}`);
        lastTrigger = "lost:" + lostHosts.slice(0, 3).join(",");
    }
    return lostHosts.length;
}

/**
 * Vergibt das Labyrinth-Mandat an GENAU EINEN Roamer.
 *
 * Das Lab haengt an jedem Server der Tiefe getNetDepth()-1 (NetworkGenerator).
 * Ohne Absprache startet dort jeder Roamer einen eigenen Laeufer, und weil die
 * Position an der PID haengt (DarknetState.labLocations[pid]), laufen sie
 * unabhaengig voneinander durch dasselbe Maze. Der Daemon ist die einzige Stelle
 * mit Gesamtsicht, also entscheidet er. Die Roamer lesen das Ergebnis per peek
 * aus dem Statusblock (Port 20, 0 GB).
 */
function assignLabRunner(ns) {
    if (labCandidates.size === 0) return;
    // Aktives Lab: das zuletzt gemeldete.
    const target = lab.host !== "-" && labCandidates.has(lab.host)
        ? lab.host : [...labCandidates.keys()][0];
    const cands = [...labCandidates.get(target)].sort();
    if (cands.length === 0) return;

    // Laeuft der bisherige Mandatstraeger noch? Wenn ja, nichts aendern —
    // ein Wechsel wuerde den Fortschritt (PID-gebunden) wegwerfen.
    if (lab.runner !== "-" && cands.includes(lab.runner) && runnerAlive(ns, lab.runner)) return;
    if (lab.runner !== "-" && cands.includes(lab.runner) && lab.state === "gestartet") return;

    const next = cands.find((h) => runnerAlive(ns, h)) || cands[0];
    if (next !== lab.runner) {
        lab.runner = next;
        lab.host = target;
        ns.print(`Labyrinth-Mandat an ${next} (${cands.length} Nachbarn am Lab ${target}).`);
    }
}

function runnerAlive(ns, host) {
    try { return ns.ps(host).some((p) => p.filename === LAB || p.filename === "/" + LAB); }
    catch (e) { return false; }
}

/**
 * Loest die von den Roamern gemeldeten .cct — auf HOME, nicht im Darknet.
 *
 * Der Solver aus SCHWARM-PAYLOADS.js kostet 22,0 GB und passt damit nicht auf
 * die flachen Darknet-Server (16 GB laut getMaxRam, davon 8,85 fuer den Roamer).
 * Er muss dort aber auch gar nicht laufen: codingcontract.getContractType,
 * getData und attempt nehmen alle einen host-Parameter.
 * Aufruf: args[0]="hosts", args[1]=Telemetrie-Port, args[2]=Kommaliste.
 * Der "hosts"-Modus ist die einzige noetige Ergaenzung in SRC_SOLVER; ohne sie
 * faellt der Solver auf den netzweiten Scan zurueck und findet die Darknet-Server
 * nicht.
 */
function solveContractsOnHome(ns) {
    if (cctHosts.size === 0) return;
    if (cctRunning && ns.ps("home").some((p) => p.filename === SOLVER || p.filename === "/" + SOLVER)) return;
    cctRunning = false;

    const hosts = [...cctHosts.keys()].slice(0, CCT_BATCH);
    try { materialize(ns, "SOLVER"); } catch (e) { /* PAYLOADS evtl. nicht da */ }
    if (!ns.fileExists(SOLVER, "home")) { ns.print("Contracts: schwarm-solver.js fehlt auf home."); return; }

    let need = 0;
    try { need = ns.getScriptRam(SOLVER, "home"); } catch (e) { need = 22; }
    const free = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
    if (free < need) {
        ns.print(`Contracts: home hat ${free.toFixed(1)} GB frei, der Solver braucht ` +
            `${need.toFixed(1)} GB — naechste Runde erneut (${hosts.length} Hosts warten).`);
        return;
    }
    const pid = ns.exec(SOLVER, "home", 1, "hosts", String(SCHWARM_PORTS.DNET_IN), hosts.join(","));
    if (pid > 0) {
        cctRunning = true;
        // v4.0 BUGFIX — HIER STAND `for (const h of hosts) cctHosts.delete(h);`.
        // Die Hosts wurden beim START des Solvers gestrichen, nicht nach Erfolg.
        // Ein Contract, dessen Typ der Solver nicht kennt ("kein Solver fuer Typ
        // …" im Payload), war damit fuer immer aus der Warteliste — und weil der
        // Roamer ihn nur EINMAL meldete (CCT_SEEN, jetzt ebenfalls entriegelt),
        // kam er nie wieder. Jetzt raeumt die Fern-Inventur die Liste auf: sie
        // sieht per ns.ls, ob die .cct-Datei wirklich verschwunden ist.
        ns.print(`Contracts: Solver auf home gestartet für ${hosts.length} Darknet-Server ` +
            `(Warteliste bleibt, bis die .cct wirklich weg sind).`);
    } else {
        ns.print(`Contracts: ns.exec auf home hat 0 geliefert (frei ${free.toFixed(1)} GB).`);
    }
}

/*
 * v3.13 — ENTFERNT: harvestLabs() (Lab-Caches von home aus oeffnen).
 *
 * Der Ansatz KANN nicht funktionieren, und der Beweis steht in
 * NetscriptFunctions.ts:636: ns.exec prueft fuer Darknet-Ziele
 *   { requireAdminRights: true, requireSession: true,
 *     requireDirectConnection: true, backdoorBypasses: true }
 * home ist mit keinem Darknet-Server direkt verbunden — die Bedingung ist von
 * dort aus prinzipiell unerfuellbar. Genau deshalb stand im Log
 * "Lab-Caches angestoßen: 0", obwohl Root und Cache vorhanden waren.
 * Dasselbe gilt fuer ns.scp (Zeile 761: requireAdminRights + requireSession).
 *
 * Den Cache erntet jetzt der LAB-LAEUFER: er laeuft auf einem direkten Nachbarn
 * des Labs (labreport verlangt das ohnehin) und hat als einziger Prozess eine
 * Session (addSessionToServer bekommt seine PID). Damit erfuellt er beide
 * Bedingungen, die sonst niemand erfuellt.
 */

/**
 * Labyrinth-Server BEOBACHTEN (nicht anfassen). ns.ls braucht keine Session und
 * keine Direktverbindung, ns.exec/ns.scp dagegen schon — deshalb wird hier nur
 * gemeldet, was Sache ist. Geerntet wird vor Ort durch den Lab-Laeufer.
 */
function watchLabs(ns) {
    labSeen.clear();
    for (const host of LAB_HOSTS) {
        let files = null, root = false;
        try { files = ns.ls(host); } catch (e) { continue; }   // Lab existiert hier nicht
        if (files === null || files === undefined) continue;
        try { root = ns.hasRootAccess(host); } catch (e) { root = false; }
        const caches = [].concat(files).filter((f) => String(f).endsWith(".cache"));
        labSeen.set(host, { root: root, caches: caches.length });
    }
}

// =============================================================================
// v4.0 — FERN-INVENTUR, KARTENPFLEGE, AUFTRAGSVERGABE
// =============================================================================

/**
 * DAS GANZE DARKNET VON HOME AUS INVENTARISIEREN — kostenlos.
 *
 * WARUM DAS GEHT (und bis v3.14 ungenutzt blieb):
 *   ns.ls prueft nur, ob der Server existiert (NetscriptFunctions.ts:839-846) —
 *   keine Adminrechte, keine Session, keine Direktverbindung. Fuer Darknet-Server
 *   liefert es Caches (".cache", ".d.cache") und Contracts (".cct") genauso wie
 *   fuer normale Server. ns.dnet.getBlockedRam kostet laut RamCostGenerator 0 GB
 *   und prueft ebenfalls nichts.
 *   Der Daemon weiss damit GENAU, wo was liegt. Anfassen kann er es nicht
 *   (openCache verlangt einen Prozess auf dem Server, Darknet.ts:313; exec/scp
 *   verlangen Session + Direktverbindung, NetscriptFunctions.ts:636/761) — aber
 *   planen kann er, und genau das fehlte: bis v3.14 erfuhr er von einem Contract
 *   ausschliesslich durch eine Roamer-Meldung, obwohl Contracts ueberhaupt keinen
 *   Roamer brauchen (codingcontract.* nehmen alle einen host-Parameter).
 *
 * NEBENEFFEKT KARTENPFLEGE: Mutation loescht Server (NetworkMovement.ts:45-190,
 * bis zu 4 je Tick), verschiebt sie und trennt alle Verbindungen. Geloeschte
 * Server landen in offlineServers — ns.ls liefert dann eine LEERE Liste statt zu
 * werfen. Wer GONE_LIMIT-mal leer und ohne Block gesehen wird, fliegt aus der
 * Karte. Vorher blieben Geisterhosts fuer immer stehen: "mapped" und "coverage"
 * waren aufgeblaeht, und healthScan pingte in jeder Runde ins Leere.
 */
function takeInventory(ns) {
    let caches = 0, ccts = 0, blockGb = 0, live = 0;
    const drop = [];
    // Labyrinth-Hostnamen sind fest (SpecialServers.ts:13-20) und stehen nicht
    // zwingend in der Karte — mit aufnehmen, aber NIE als Geist verwerfen.
    const hosts = new Set(Object.keys(map));
    for (const h of LAB_HOSTS) hosts.add(h);
    hosts.add(FIRST_HOP);

    for (const host of hosts) {
        let files = null;
        try { files = ns.ls(host); } catch (e) { files = null; }
        let block = 0;
        try { block = Number(ns.dnet.getBlockedRam(host)) || 0; } catch (e) { block = 0; }
        let root = false;
        try { root = ns.hasRootAccess(host); } catch (e) { root = false; }

        if (files === null || files === undefined) {
            // Server ganz weg (ns.ls wirft nur bei unbekanntem Host).
            if (!LAB_HOSTS.includes(host) && host !== FIRST_HOP) drop.push(host);
            inv.delete(host);
            continue;
        }
        const list = [].concat(files);
        let c = 0, x = 0;
        for (const f of list) {
            const s = String(f);
            if (s.endsWith(".cache")) c++;
            else if (s.endsWith(".cct")) x++;
        }
        // Leer UND ohne Block UND ohne Dateien: Verdacht auf geloescht/offline.
        if (list.length === 0 && block <= 0 && !root) {
            const n = (goneCount.get(host) || 0) + 1;
            goneCount.set(host, n);
            if (n >= GONE_LIMIT && !LAB_HOSTS.includes(host) && host !== FIRST_HOP) drop.push(host);
        } else {
            goneCount.delete(host);
        }
        live++;
        caches += c; ccts += x; blockGb += block;
        inv.set(host, { caches: c, ccts: x, block: block, root: root, ts: Date.now() });

        // Contracts SELBST erkennen — ohne auf eine Roamer-Meldung zu warten.
        if (x > 0) {
            if (!cctHosts.has(host)) cctHosts.set(host, new Set());
            for (const f of list) if (String(f).endsWith(".cct")) cctHosts.get(host).add(String(f));
        } else {
            cctHosts.delete(host);   // nichts mehr offen -> aus der Warteliste
        }
    }

    for (const host of drop) {
        delete map[host];
        goneCount.delete(host);
        inv.delete(host);
        aliveRoamers.delete(host);
        pending.delete(host);
        needpw.delete(host);
        purged++;
    }
    if (drop.length) {
        ns.print(`Karte bereinigt: ${drop.length} verschwundene Server entfernt ` +
            `(${drop.slice(0, 4).join(", ")}${drop.length > 4 ? " …" : ""}). ` +
            `Darknet-Mutation loescht und verschiebt Server laufend.`);
        persistState(ns);
    }

    invTotals = { caches, ccts, blockGb, hosts: live,
        backlog: caches + ccts + Math.ceil(blockGb / 64) };

    // v4.0.2 — VERALTETE STATUSMELDUNGEN AUSKEHREN.
    // pending ("geknackt, aber kein Roamer drauf") und noSession wurden NUR durch
    // eine Gegenmeldung des Roamers geleert. Laeuft dort inzwischen ein Roamer,
    // versucht niemand mehr ein spread — die Meldung blieb also fuer immer stehen
    // und zeigte im Log einen Zustand, den es nicht mehr gab (u1tr4.o4sis stand
    // gleichzeitig als Roamer-Host UND als "kein Roamer drauf" im Bericht).
    // Der Daemon hat mit aliveRoamers und inv die verlaessliche Sicht.
    for (const h of [...pending.keys()]) {
        if (aliveRoamers.has(h) || !inv.has(h)) pending.delete(h);
    }
    for (const h of [...noSession.keys()]) {
        if (aliveRoamers.has(h) || !inv.has(h)) noSession.delete(h);
    }

    // v4.0.1 — ZOMBIE-EINTRAEGE AUSKEHREN. crackOps wurde nur durch eine
    // Abschlussmeldung geleert (CRACKDONE/FAIL/GONE/ERR). Stirbt ein Knack-Op ohne
    // Meldung — killall, Mutation toetet die Prozesse des Servers
    // (NetworkMovement.ts), Ausnahme vor dem ersten tell —, blieb der Eintrag fuer
    // immer stehen. Im Livelauf zeigte der Daemon deshalb 8 "laufende" Ops, deren
    // Liste sich ueber 31 s nicht bewegte, obwohl bei 38k Charisma ein ZeroLogon in
    // Millisekunden faellt. ns.ps ist die verlaessliche Quelle und kostet nichts
    // zusaetzlich (0,2 GB, einmalig gezaehlt).
    for (const [h, o] of [...crackOps.entries()]) {
        let alive = false;
        // Der Op laeuft auf einem NACHBARN des Ziels, nicht auf dem Ziel selbst.
        // Deshalb ueber alle bekannten Roamer-Hosts suchen.
        for (const w of aliveRoamers) {
            try {
                if (ns.ps(w).some((pr) => (pr.filename === CRACK
                    || pr.filename === "/" + CRACK) && String((pr.args || [])[0]) === h)) {
                    alive = true; break;
                }
            } catch (e) { /* Host weg */ }
        }
        if (!alive && Date.now() - (o.t || 0) > 20000) {
            crackOps.delete(h);
            crackZombies++;
        }
    }
    return invTotals;
}

/**
 * AUFTRAEGE VERGEBEN. Der Daemon kennt Inventar und Topologie, die Roamer nur
 * ihre Nachbarn — also sagt er, wo zuerst angefasst wird. Reihenfolge:
 *   1. Labyrinth (einziger Pfad zur naechsten Augmentierung -> Red Pill)
 *   2. Fremdbloecke (blockieren die Besiedlung, ohne sie waechst nichts)
 *   3. Caches (der Ertrag)
 * Ein Roamer ohne Eintrag arbeitet weiter nach eigenem Ermessen — der Auftrag
 * setzt Prioritaeten, er ersetzt die Selbststaendigkeit nicht (sonst stuende bei
 * einem Daemon-Ausfall alles still).
 */
function publishWork(ns) {
    // Charisma mitschicken: der Roamer braucht es fuer die Zielsortierung, ns.getPlayer
    // kostet dort aber 0,5 GB (ein halber Knack-Op-Thread auf einem 16-GB-Server).
    // Hier auf home ist es billig.
    let cha = 0;
    try { cha = Number(ns.getPlayer().skills.charisma) || 0; } catch (e) { cha = 0; }
    const parts = ["ORDERS", "until=" + (Date.now() + ORDER_TTL_MS),
        "sweep=" + (sweepUntil > Date.now() ? sweepUntil : 0), "cha=" + cha,
        // v4.2: PHISHING-VORRANG. Bringt Phishing in dieser BitNode kein Geld
        // (DarknetMoneyMultiplier 0, z.B. BN8), bleibt als Ertrag nur Charisma-XP
        // uebrig — und Charisma multipliziert jede andere Darknet-Op:
        // Reallocation 1+cha/100, Promote (500+cha)/500, Phish- und Knack-Tempo.
        // Dann ist Phishing keine Restverwertung mehr, sondern die Investition,
        // die alles andere beschleunigt. Der Roamer kann das nicht selbst
        // entscheiden (er kennt die BitNode-Multiplikatoren nicht), also sagt es
        // ihm der Daemon hier.
        "phish=" + (phishPriority(ns) ? "1" : "0")];

    // Wer kann wen erreichen? Die Nachbarschaft steht in der Karte (aus MAP-Meldungen).
    // Erreichbarkeit SYMMETRISCH auswerten: Darknet-Verbindungen sind bidirektional
    // (ns.dnet.probe liefert serversOnNetwork, das in beide Richtungen gepflegt wird),
    // die Karte kennt aber nur die Nachbarlisten der Server, von denen bereits eine
    // MAP-Meldung kam. Ohne die Umkehrung bliebe ein Ziel unversorgt, obwohl daneben
    // ein Roamer sitzt — nur weil dessen eigene Nachbarliste noch fehlt.
    const reach = new Map();          // Ziel-host -> Set(Nachbarn mit lebendem Roamer)
    const link = (target, worker) => {
        if (!reach.has(target)) reach.set(target, new Set());
        if (aliveRoamers.has(worker)) reach.get(target).add(worker);
    };
    for (const [h, m] of Object.entries(map)) {
        for (const nb of String(m.neighbors || "").split(",")) {
            const t = nb.trim();
            if (!t) continue;
            link(t, h);      // h nennt t als Nachbarn -> h kann t bedienen
            link(h, t);      // und umgekehrt (Verbindung ist symmetrisch)
        }
    }
    const flags = new Map();          // Roamer-Host -> Flags-String je Ziel
    const addFlag = (worker, target, flag) => {
        const key = worker + "\u0001" + target;
        flags.set(key, (flags.get(key) || "") + flag);
    };

    // Ziele nach Wichtigkeit sortieren.
    const targets = [];
    for (const [host, s] of inv.entries()) {
        if (!s) continue;
        const isLab = LAB_HOSTS.includes(host);
        const weight = (isLab ? 1000 : 0) + Math.min(500, s.block) + s.caches * 10;
        if (weight <= 0) continue;
        targets.push({ host, s, weight, isLab });
    }
    targets.sort((a, b) => b.weight - a.weight);

    for (const t of targets) {
        // Ein Roamer AUF dem Ziel erledigt es selbst.
        if (aliveRoamers.has(t.host)) {
            if (t.s.caches > 0) addFlag(t.host, t.host, "h");
            if (t.s.block > 0) addFlag(t.host, t.host, "r");
            continue;
        }
        // Sonst: ein Nachbar mit Roamer macht es fern (harvestRemote / RODE-Op).
        const helpers = reach.get(t.host);
        if (!helpers || helpers.size === 0) continue;
        const worker = [...helpers][0];
        if (t.s.caches > 0) addFlag(worker, t.host, "h");
        if (t.s.block > 0) addFlag(worker, t.host, "r");
        if (t.s.root) addFlag(worker, t.host, "s");
    }

    // Zusammenfassen: je Ziel eine Angabe. Die Roamer lesen ihre eigenen Zeilen
    // (der Schluessel ist der ZIEL-Host, nicht der Arbeiter — jeder Roamer nimmt
    // nur Ziele an, die er ueberhaupt erreichen kann).
    const seenT = new Set();
    for (const [key, fl] of flags.entries()) {
        const target = key.split("\u0001")[1];
        if (seenT.has(target)) continue;
        seenT.add(target);
        parts.push(target + "=" + fl);
        if (parts.length > 60) break;   // Portlaenge im Rahmen halten
    }
    orderLine = parts.join("|");
    publishOrders(ns, orderLine);
    return seenT.size;
}

/**
 * KAHLSCHLAG-STEUERUNG. Staut sich Arbeit auf, hebt der Daemon fuer eine
 * begrenzte Zeit alle Quoten auf: Phishing ruht (es ist die Quelle neuer Caches,
 * cacheFiles.ts), der Cache-Deckel steigt, grosse Bloecke werden auch ohne
 * freien Stasis-Platz gerodet. Danach Normalbetrieb — dauerhaft waere es
 * schaedlich, weil Phishing der eigentliche Dauerertrag ist.
 * Der Kahlschlag laeuft von selbst aus (Auftrag traegt eine Frist).
 */
function manageSweep(ns, force) {
    const now = Date.now();
    if (sweepUntil > now) {
        if (invTotals.backlog === 0) {       // vorzeitig fertig
            sweepUntil = 0;
            ns.print(`Kahlschlag beendet: nichts mehr offen (${sweepsDone} Laeufe bisher).`);
        }
        return;
    }
    if (force) {
        sweepUntil = now + SWEEP_MINUTES * 60000;
        sweepCooldown = sweepUntil + SWEEP_COOLDOWN_MS;
        sweepReason = "Handstart";
        sweepsDone++;
        ns.print(`Kahlschlag GESTARTET (Handstart, ${SWEEP_MINUTES} min): ` +
            `${invTotals.caches} Caches, ${invTotals.ccts} Contracts, ` +
            `${Math.round(invTotals.blockGb)} GB Block.`);
        return;
    }
    if (now < sweepCooldown) return;
    if (invTotals.backlog < SWEEP_BACKLOG) return;
    sweepUntil = now + SWEEP_MINUTES * 60000;
    sweepCooldown = sweepUntil + SWEEP_COOLDOWN_MS;
    sweepReason = "Rueckstau " + invTotals.backlog;
    sweepsDone++;
    ns.print(`Kahlschlag GESTARTET (Rueckstau ${invTotals.backlog} Posten, ${SWEEP_MINUTES} min): ` +
        `${invTotals.caches} Caches, ${invTotals.ccts} Contracts, ${Math.round(invTotals.blockGb)} GB Block. ` +
        `Phishing ruht solange.`);
}

/**
 * NACHSAAT AUCH ABSEITS VON DARKWEB.
 *
 * v3.14 saete nur auf darkweb nach und verliess sich darauf, dass die
 * Roamer-Kette den Rest erschliesst. Die Kette zerfaellt aber schneller, als ein
 * (bis v4.0 verhungerter) Roamer sie aufbaut: Mutation trennt mit p=0,5 ALLE
 * Verbindungen eines Servers und toetet dort die Skripte.
 * Der Daemon kann selbst nur Server bedienen, die er per exec erreicht — dafuer
 * braucht es Adminrechte, Session und Direktverbindung
 * (NetscriptFunctions.ts:636). Von home aus ist das ausschliesslich darkweb …
 * ausser bei BACKDOOR: das Flag backdoorBypasses hebt die Verbindungspruefung
 * auf. Deshalb wird hier zusaetzlich versucht, verwaiste Server mit Backdoor
 * direkt zu besetzen — das ist der einzige zweite Pfad, den die Engine kennt.
 * Alles andere bleibt Aufgabe der Nachbar-Roamer (dafuer die Auftraege).
 */
function seedOrphans(ns) {
    let done = 0;
    for (const [host, s] of inv.entries()) {
        if (done >= SEED_FANOUT) break;
        if (host === FIRST_HOP) continue;
        if (!s || !s.root) continue;                 // ohne Adminrechte kein exec
        if (aliveRoamers.has(host)) continue;
        try {
            if (ns.ps(host).some((p) => p.filename === ROAMER || p.filename === "/" + ROAMER)) continue;
        } catch (e) { continue; }
        let need = 0;
        try { need = ns.getScriptRam(ROAMER, "home"); } catch (e) { need = 9; }
        let free = 0;
        try { free = ns.getServerMaxRam(host) - ns.getServerUsedRam(host); } catch (e) { free = 0; }
        if (free < need) continue;                   // Fremdblock -> Auftrag "r" erledigt das
        try {
            if (!ns.scp([ROAMER], host, "home")) continue;
            if (ns.fileExists(LAB, "home")) ns.scp(LAB, host, "home");
            if (ns.fileExists(CRACK, "home")) ns.scp(CRACK, host, "home");
            if (ns.fileExists(MANUAL, "home")) ns.scp(MANUAL, host, "home");
            const pid = ns.exec(ROAMER, host, 1);
            if (pid > 0) {
                done++;
                lastTrigger = "seed:" + host;
                ns.print(`Roamer direkt ausgesaet auf ${host} (Backdoor-Pfad, ${need.toFixed(1)} GB).`);
            }
        } catch (e) { /* keine Session/Verbindung -> Nachbar-Roamer uebernimmt */ }
    }
    return done;
}

/** Manuelle Passwortliste nach darkweb spiegeln (Roamer reichen sie weiter). */
function distributeManual(ns) {
    try { if (ns.fileExists(MANUAL, "home")) ns.scp(MANUAL, FIRST_HOP); } catch (e) { /* */ }
}

// =============================================================================
// Telemetrie sammeln
// =============================================================================

function drainTelemetry(ns) {
    let changed = false, n = 0;
    while (n < 500) {
        const msg = readTelemetry(ns);
        if (msg === null) break;
        n++;
        if (parseMsg(msg)) changed = true;
    }
    if (changed) persistState(ns);
}

/** @returns {boolean} true, wenn die Karte geaendert wurde (-> persistieren). */
function parseMsg(msg) {
    // v3.13: Unit Separator ist das Feldtrennzeichen. Aeltere Wegwerf-Ops, die
    // noch mit ";" melden, werden weiterhin verstanden — aber nur, wenn kein US
    // vorkommt. Andernfalls wuerde ein Semikolon IM Hostnamen die Felder wieder
    // verschieben (Ursache der 13492 Phantom-Server in der Karte).
    const raw = String(msg);
    const p = raw.indexOf("\u001f") >= 0 ? raw.split("\u001f") : raw.split(";");
    switch (p[0]) {
        case "JOIN": if (p[1]) joined.add(p[1]); return false;
        case "PW": if (p[1]) { crackedCount++; needpw.delete(p[1]); } return false;
        case "MAP":
            if (p[1]) { map[p[1]] = { depth: p[2], model: p[3], neighbors: p[4] || "" }; return true; }
            return false;
        case "STORM": if (p[1]) storm.add(p[1]); return false;
        case "CHARISMA": if (p[1]) gated.set(p[1], p[2]); return false;
        case "OPEN_NEEDPW": if (p[1]) needpw.add(p[1]); return false;
        case "TODO": if (p[1]) todo.set(p[1], p[2]); return false;
        case "FEEDBACK": if (p[1]) feedback.set(p[1], p[2]); return false;
        // v4.2 MODELL-STATISTIK: ["MODEL", modelId, ausgang, versuche]
        case "MODEL": {
            const id = p[1] || "?";
            const out = p[2] || "fail";
            const tries = Number(p[3]) || 0;
            let s = modelStats.get(id);
            if (!s) { s = { ok: 0, fail: 0, todo: 0, feedback: 0, tries: 0, n: 0 }; modelStats.set(id, s); }
            if (s[out] !== undefined) s[out]++; else s.fail++;
            s.tries += tries; s.n++;
            return false;
        }
        case "BUDGET": if (p[1]) feedback.set(p[1], (p[2] || "?") + " (Budget leer)"); return false;
        case "BIGBLOCK": if (p[1]) bigblock.set(p[1], p[2]); return false;
        case "LOOT": cacheCount++; return false;
        case "SPREAD":
            if (!p[1]) return false;
            if (p[2] === "ok") pending.delete(p[1]); else pending.set(p[1], p[2] || "?");
            return false;
        case "CCTFOUND":
            if (p[1]) {
                if (!cctHosts.has(p[1])) cctHosts.set(p[1], new Set());
                if (p[2]) cctHosts.get(p[1]).add(p[2]);
            }
            return false;
        case "CACHEFAIL": if (p[1]) cacheFails++; return false;
        // --- v4.0: Knack-Ops (schwarm-crack.js) -------------------------------
        case "CRACKOP":
            // host, threads, chaBedarf, modell
            if (p[1]) {
                crackOps.set(p[1], { threads: p[2] || "1", cha: p[3] || "?",
                    model: p[4] || "?", t: Date.now() });
                crackStarted++;
            }
            return false;
        case "CRACKDONE":
            if (p[1]) { crackOps.delete(p[1]); crackWon++; needpw.delete(p[1]);
                todo.delete(p[1]); feedback.delete(p[1]); }
            return false;
        case "CRACKFAIL":
            if (p[1]) { crackOps.delete(p[1]); crackLost++;
                crackFails.set(p[1], (p[2] || "?") + ", " + (p[3] || "?")); }
            return false;
        case "CRACKGONE":
            if (p[1]) { crackOps.delete(p[1]); }
            return false;
        case "CRACKERR":
            if (p[1]) { crackOps.delete(p[1]);
                errors.push("crack " + p[1] + ": " + (p[2] || "?"));
                if (errors.length > 20) errors.shift(); }
            return false;
        case "RLOOT": remoteOpened++; return false;   // Fern-Cache angestossen (v3.10)
        case "SCAN":
            // v4.0: zwei Felder mehr — uebersprungene Nachbarn (Zeitdeckel des
            // Crackers) und der Betriebsmodus. Ohne "skipped" war von aussen nicht
            // zu sehen, ob CRACK_MS zu knapp bemessen ist.
            if (p[1]) scans.set(p[1], { seen: p[2], owned: p[3], open: p[4], ram: p[5],
                pending: p[6], skipped: p[7] || "0", mode: p[8] || "?", t: Date.now() });
            return false;
        case "ORDER":
            if (p[1]) orderAck.set(p[1], { mode: p[2] || "?", h: p[3] || "", r: p[4] || "",
                s: p[5] || "", t: Date.now() });
            return false;
        case "ERR":
            if (p[1]) { errors.push(p[1] + ": " + (p[2] || "?")); if (errors.length > 20) errors.shift(); }
            return false;
        case "LABFOUND":
            if (p[1] && p[2]) {
                if (!labCandidates.has(p[1])) labCandidates.set(p[1], new Set());
                labCandidates.get(p[1]).add(p[2]);
                if (lab.host === "-") lab.host = p[1];
            }
            return false;
        case "CCT": return false;   // Alt-Meldung aus v3.7 (nur informativ)
        // --- Labyrinth (v3.7) ---
        case "LABSTART": lab.host = p[1] || lab.host; lab.runner = p[2] || "?";
            lab.state = "läuft"; lab.note = ""; return false;
        case "LABRUN": lab.host = p[1] || lab.host; lab.runner = p[2] || "?";
            lab.cha = p[3] || "?"; lab.state = "gestartet"; return false;
        case "LAB":
            lab.host = p[1] || lab.host; lab.pos = p[2] || "-";
            lab.known = Number(p[3]) || 0; lab.moves = Number(p[4]) || 0;
            lab.goal = p[5] || "-"; lab.state = "läuft"; return false;
        case "LABOK": lab.host = p[1] || lab.host; lab.moves = Number(p[2]) || lab.moves;
            lab.state = "GELÖST"; lab.solved++; return false;
        // v3.12: Das Lab-Passwort aus der Erfolgsantwort (labyrinth.ts:273). Ohne
        // es kommt KEIN anderer Prozess an den Server: Sessions haengen an der PID,
        // und beim Loesen bekommt nur der Laeufer eine. Wird sofort dauerhaft in
        // die Manual-Datei geschrieben und wandert von dort zu allen Roamern.
        case "LABPW":
            if (p[1] && p[2] !== undefined) { labPasswords.set(p[1], p[2]); return true; }
            return false;
        case "LABDONE": lab.state = "geerntet"; return false;
        case "LABCHA": lab.host = p[1] || lab.host; lab.state = "Charisma fehlt";
            lab.note = p[2] || ""; if (p[1]) gated.set(p[1], "Labyrinth"); return false;
        case "LABERR": lab.host = p[1] || lab.host; lab.state = "Fehler";
            lab.note = p[2] || ""; return false;
        case "LABRAW": labRaw.push(p.slice(1).join(" | ")); if (labRaw.length > 30) labRaw.shift(); return false;
        case "LABCACHE": lab.note = (p[2] || "") + " (" + (p[1] || "?") + ")"; return false;
        // v4.0 BUGFIX — HIER STAND `ns.print && 0;`. parseMsg hat KEIN ns im
        // Scope (das ist der Parameter von main): jede LABCACHEOK-Meldung warf
        // einen ReferenceError, der aus drainTelemetry ins Runden-catch flog und
        // dort als "Daemon-Fehler" landete. Folge: in DIESER Runde entfielen
        // seedIfNeeded, healthScan, assignLabRunner, watchLabs,
        // solveContractsOnHome, distributeManual, pubStatus UND logSummary
        // vollstaendig — der Daemon setzte also genau dann aus, wenn das
        // Labyrinth (der wichtigste Fortschrittspfad) etwas geerntet hatte.
        case "LABCACHEOK": labHarvested++; lab.state = "geerntet"; return false;
        case "NOSESSION":
            if (p[1]) { noSession.set(p[1], p[2] || "?"); }
            return false;
        default: {
            // Op-Meldungen haben die Form "<host>;<OP>:<...>" — hier interessiert
            // nur die Solver-Bilanz.
            const i = raw.indexOf("SOLVE:DONE:");
            if (i >= 0) {
                const q = raw.slice(i + 11).split("/");
                cctSolved += Number(q[0]) || 0;
                cctFailed += Math.max(0, (Number(q[1]) || 0) - (Number(q[0]) || 0));
                cctRunning = false;
            }
            return false;
        }
    }
}

// =============================================================================
// Persistenz (home, killall-fest) — nur die Karte
// =============================================================================

/**
 * v4.1 — KARTE NACH EINEM RESET VERWERFEN.
 *
 * prestigeDarknetState (DarknetState.ts:84-101) wird bei JEDEM Prestige gerufen
 * (Prestige.ts:76, also auch beim Aug-Install) und setzt DarknetState.Network,
 * serverState (alle Sessions), offlineServers, labyrinth und labLocations
 * zurueck — das Darknet wird komplett neu generiert. Die Kartendatei ist eine
 * Textdatei und ueberlebt den Reset (ServerHelpers.ts:224 leert textFiles nicht):
 * ohne diese Pruefung liest der Daemon also 40+ Hostnamen ein, die es nicht mehr
 * gibt. Bis die Fern-Inventur sie nach GONE_LIMIT Runden ausgekehrt hat, sind
 * "gemappt", "Abdeckung", Auftragsvergabe und Nachsaat alle falsch.
 * getResetInfo kostet 1 GB (flach, kein SF4 noetig).
 */
function resetStamp(ns) {
    try { return Number(ns.getResetInfo().lastAugReset) || 0; } catch (e) { return 0; }
}

function loadState(ns) {
    try {
        const stampNow = resetStamp(ns);
        const stampOld = Number(ns.read(STAMP_FILE) || 0);
        if (stampNow > 0 && stampOld > 0 && stampNow !== stampOld) {
            ns.print("Reset erkannt — Karte und gesammelte Passwoerter werden verworfen. " +
                "prestigeDarknetState baut das Darknet komplett neu auf, alte Hostnamen " +
                "und Passwoerter sind wertlos.");
            try { ns.write(MAP_FILE, "", "w"); } catch (e2) { /* */ }
            try { ns.write(STAMP_FILE, String(stampNow), "w"); } catch (e2) { /* */ }
            return;
        }
        if (stampNow > 0 && stampOld !== stampNow) {
            try { ns.write(STAMP_FILE, String(stampNow), "w"); } catch (e2) { /* */ }
        }
        const raw = String(ns.read(MAP_FILE) || "");
        if (!raw) return;
        // v3.13: Das alte Format trennte mit ";" — bei Hostnamen, die selbst ein
        // Semikolon enthalten, entstanden Phantom-Eintraege (im Log: 13492
        // "gemappte" Server). Eine Datei ohne Unit Separator stammt aus dieser
        // Zeit und wird verworfen statt weitergeschleppt.
        if (raw.indexOf("\u001f") < 0) {
            ns.print("Kartendatei im Altformat gefunden — wird verworfen (Trennzeichen-Fehler).");
            try { ns.write(MAP_FILE, "", "w"); } catch (e2) { /* */ }
            return;
        }
        for (const line of raw.split("\n")) {
            const p = line.split("\u001f");
            if (p[0]) map[p[0]] = { depth: p[1], model: p[2], neighbors: p[3] || "" };
        }
    } catch (e) { /* */ }
}

function persistState(ns) {
    // v4.1 — ENTFERNT: das Zurueckschreiben der Lab-Passwoerter in MANUAL.
    //
    // Es war ein Umweg ohne Nutzen und mit Nebenwirkung. Nutzen keiner: das
    // Lab-Passwort braucht ausschliesslich ein Prozess, der auf einem DIREKTEN
    // Nachbarn des Labs laeuft (scp/exec verlangen Direktverbindung,
    // NetscriptFunctions.ts:636/761) — und der Lab-Laeufer holt es sich bei einem
    // beliebigen Zug selbst zurueck, weil ein geloestes Labyrinth sofort Success
    // samt Passwort liefert (labyrinth.ts:267-273). Nebenwirkung: MANUAL ist die
    // Datei, in die DU deine Funde eintraegst. Schrieben Skripte hinein, wuchs sie
    // mit jedem BitNode um Eintraege, die nach dem naechsten Aug-Install wertlos
    // sind (prestigeDarknetState baut das Netz neu auf) und dann nur noch
    // Fehlversuche erzeugen. MANUAL ist ab v4.1 fuer Skripte NUR LESBAR.
    // labPasswords bleibt als Anzeige im Statusblock erhalten.
    try {
        const lines = Object.entries(map)
            .map(([h, m]) => [h, m.depth, m.model, m.neighbors].join("\u001f")).join("\n");
        ns.write(MAP_FILE, lines, "w");
    } catch (e) { ns.print(`Persist-Fehler: ${e}`); }
}

// =============================================================================
// Sicht: Status-Port + Log
// =============================================================================

function pubStatus(ns) {
    publishStatus(ns, [
        "DARKNET",
        `roamers=${joined.size}`,
        `cracked=${crackedCount}`,
        `mapped=${Object.keys(map).length}`,
        `gated=${gated.size}`,
        `needpw=${needpw.size}`,
        `todo=${todo.size}`,
        `bigblock=${bigblock.size}`,
        `storm=${storm.size}`,
        `caches=${cacheCount}`,
        // v4.2 MODELL-STATISTIK, kompakt: id:ok/fail/todo/feedback/ØVersuche,
        // absteigend nach Gesamtzahl. Nur die zehn haeufigsten — der Port ist ein
        // peek-Kanal, keine Datenbank. DIAG rendert das lesbar auf.
        `models=${modelDigest()}`,
        // v4.5: der ZULETZT gemeldete Rueckmelde-Grund. Ein Modell, das
        // scheitert, sagt jetzt WARUM (siehe solveSortedEcho) — ohne diese Zeile
        // steht der Grund nur im Roamer-Log auf irgendeinem Server und ist
        // praktisch unauffindbar. Nur der letzte, das genuegt zur Diagnose.
        // v4.5: JE RUECKMELDEART der zuletzt gemeldete Grund, nicht nur EINER
        // insgesamt. Vorher stand hier der letzte Eintrag ueber alle Modelle —
        // und weil mehrere Arten gleichzeitig scheitern, war der Grund des
        // interessanten Modells praktisch nie zu sehen. Live: "PHP 5.4" lag bei
        // 1 % Erfolg und 666 Abbruechen, und in KEINEM Lagebild stand sein
        // Grund; gezeigt wurde immer "updown", "spice" oder "maxima".
        // Der Wert ist mit ";;" getrennt, weil "|" das Portformat zerlegt.
        `fbwhy=${(() => {
            const proArt = new Map();
            for (const v of feedback.values()) {
                const s = String(v);
                const art = (s.split("|")[0] || "?").trim() || "?";
                proArt.set(art, s.slice(0, 80).replace(/\|/g, "/").replace(/;;/g, ","));
            }
            return [...proArt.values()].slice(-5).join(";;");
        })()}`,
        `phishprio=${phishPriority(ns) ? 1 : 0}`,
        `alive=${aliveRoamers.size}`,       // Server mit laufendem ROAMER
        `coverage=${coverage.withRoamer}/${coverage.known}`,
        `ops=${aliveOps.size}`,             // Server mit laufendem Op/Lab-Laeufer
        `pending=${pending.size}`,          // geknackt, aber noch kein Roamer drauf
        `lab=${lab.host}`,
        `labrunner=${lab.runner}`,   // v3.8: Mandat — nur dieser Roamer startet den Laeufer
        `labstate=${lab.state}`,
        `labpos=${lab.pos}`,
        `labknown=${lab.known}`,
        `labmoves=${lab.moves}`,
        `labsolved=${lab.solved}`,
        `cct=${cctSolved}/${cctSolved + cctFailed}`,
        `cctopen=${cctHosts.size}`,
        `cachefail=${cacheFails}`,
        `remotecache=${remoteOpened}`,
        `labcache=${labHarvested}/${labOpened}`,
        `errors=${errors.length}`,
        `nosession=${noSession.size}`,
        // ---- v4.0: Fern-Inventur, Knack-Ops, Kahlschlag, Kartenpflege --------
        // Diese Felder sind zugleich die Datenquelle fuer SCHWARM-DIAG (Abschnitt
        // 4d). Sie stehen NUR hier — ohne sie liesse sich von aussen nicht
        // unterscheiden, ob das Darknet arbeitet oder nur laeuft.
        `invcaches=${invTotals.caches}`,
        `invccts=${invTotals.ccts}`,
        `invblock=${Math.round(invTotals.blockGb)}`,
        `invhosts=${invTotals.hosts}`,
        `backlog=${invTotals.backlog}`,
        `blockper=${invTotals.hosts > 0 ? (invTotals.blockGb / invTotals.hosts).toFixed(1) : 0}`,
        `crackops=${crackOps.size}`,
        `crackstat=${crackWon}/${crackStarted}`,
        `crackfail=${crackLost}`,
        `crackzomb=${crackZombies}`,
        `sweep=${sweepUntil > Date.now() ? Math.round((sweepUntil - Date.now()) / 1000) : 0}`,
        `sweeps=${sweepsDone}`,
        `sweepwhy=${sweepReason || "-"}`,
        `purged=${purged}`,
        `orders=${orderLine ? orderLine.split("|").length - 3 : 0}`,
        `trigger=${lastTrigger}`,
    ].join("|"));
}

function logSummary(ns) {
    ns.print("─────── DARKNET ───────");
    ns.print(`Roamer gesehen: ${joined.size}  |  geknackt: ${crackedCount}  |  gemappt: ${Object.keys(map).length}`);
    const pct = coverage.known > 0 ? ((coverage.withRoamer / coverage.known) * 100).toFixed(0) : "?";
    ns.print(`Abdeckung: ${coverage.withRoamer}/${coverage.known} bekannte Server mit Roamer (${pct} %)`);
    ns.print(`Lebende Roamer: ${aliveRoamers.size}  |  Ops/Läufer: ${aliveOps.size}  |  Charisma-gesperrt: ${gated.size}  |  Caches: ${cacheCount}`);
    ns.print(`Contracts gelöst: ${cctSolved}/${cctSolved + cctFailed}  |  offene Server: ${cctHosts.size}` +
        (cacheFails ? `  |  Caches vertagt: ${cacheFails}` : ""));
    // v4.0 — RUECKSTAU. Die entscheidende Zahl: sinkt sie ueber die Laeufe, arbeitet
    // das Darknet ab; bleibt sie stehen, liegt etwas fest. Sie kommt aus der
    // Fern-Inventur (ns.ls + getBlockedRam, beide ohne Session/Verbindung nutzbar).
    // v4.1: GB JE SERVER mit ausgeben. Die Gesamtsumme allein ist nicht deutbar —
    // sie waechst auch dann, wenn alles gut laeuft, weil jeder neu erschlossene
    // Server seinen eigenen Fremdblock mitbringt (ramblock.ts, getRamBlock). Erst
    // der Quotient zeigt, ob wirklich etwas liegen bleibt.
    const perHost = invTotals.hosts > 0 ? (invTotals.blockGb / invTotals.hosts) : 0;
    ns.print(`Rückstau: ${invTotals.caches} Caches, ${invTotals.ccts} Contracts, ` +
        `${Math.round(invTotals.blockGb)} GB Fremdblock auf ${invTotals.hosts} Servern ` +
        `(${perHost.toFixed(1)} GB/Server, Summe ${invTotals.backlog})` +
        (purged ? `  |  Karte bereinigt: ${purged}` : ""));
    if (sweepUntil > Date.now()) {
        ns.print(`KAHLSCHLAG aktiv (${sweepReason}): noch ` +
            `${Math.round((sweepUntil - Date.now()) / 1000)} s — Phishing ruht, Deckel aufgehoben.`);
    }
    ns.print(`Knack-Ops: ${crackOps.size} laufen  |  Bilanz ${crackWon} geknackt / ` +
        `${crackStarted} gestartet, ${crackLost} erschöpft` +
        (crackZombies ? `, ${crackZombies} ohne Abschlussmeldung verschwunden` : ""));
    if (crackOps.size) {
        const rows = [...crackOps.entries()].slice(0, 5)
            .map(([h, o]) => `${h} (${o.threads}T, cha ${o.cha}, ${o.model})`);
        ns.print("   " + rows.join("  |  "));
    }
    if (crackFails.size) {
        const rows = [...crackFails.entries()].slice(0, 4).map(([h, r]) => `${h}: ${r}`);
        ns.print("Knacken erschöpft (nächster Anlauf automatisch): " + rows.join("  |  "));
    }
    if (invTotals.backlog > 0) {
        const rest = [...inv.entries()]
            .filter(([, v]) => v && (v.caches > 0 || v.ccts > 0 || v.block > 0))
            .sort((a, b) => (b[1].caches + b[1].ccts) - (a[1].caches + a[1].ccts))
            .slice(0, REPORT_REST)
            .map(([h, v]) => `${h} (${v.caches}c/${v.ccts}x/${Math.round(v.block)}GB)`);
        if (rest.length) ns.print("Offen: " + rest.join(", "));
    }
    if (labSeen.size) {
        const rows = [...labSeen.entries()].map(([h, v]) =>
            `${h}${v.root ? "" : " (kein Root)"}: ${v.caches} Cache(s)`);
        ns.print("Labyrinth-Server: " + rows.join("  |  "));
        ns.print(`Lab-Caches angestoßen: ${labOpened}, bestätigt geöffnet: ${labHarvested}`);
    }
    if (lab.host !== "-") {
        ns.print(`Labyrinth ${lab.host} [${lab.state}] auf ${lab.runner}  cha ${lab.cha}  ` +
            `Position ${lab.pos}  Ziel ${lab.goal}  ${lab.moves} Züge, ${lab.known} Felder` +
            (lab.note ? `  — ${lab.note}` : ""));
    }
    if (scans.size) {
        ns.print("Roamer-Lage (Nachbarn / erledigt / offen / RAM / Aussaat / Knack-Ops / Modus):");
        for (const [h, s2] of [...scans.entries()].slice(-6)) {
            ns.print(`   ${h}: ${s2.seen} / ${s2.owned} / ${s2.open} / ${s2.ram} / ` +
                `${s2.pending} / ${s2.skipped || "0"} / ${s2.mode || "?"}`);
        }
    }
    if (errors.length) {
        ns.print("Schrittfehler in Roamern (letzte 4):");
        for (const e of errors.slice(-4)) ns.print("   " + e);
    }
    if (labRaw.length) {
        ns.print("Labyrinth-Rohdaten (Diagnose, letzte 6):");
        for (const l of labRaw.slice(-6)) ns.print("   " + l);
    }
    if (noSession.size) {
        const list = [...noSession.entries()].slice(0, 5).map(([h, r]) => `${h} (${r})`).join(", ");
        ns.print(`Ohne Session (scp/exec werden abgelehnt): ${list}${noSession.size > 5 ? " …" : ""}`);
    }
    if (pending.size) {
        const list = [...pending.entries()].slice(0, 4).map(([h, r]) => `${h} (${r})`).join(", ");
        ns.print(`Geknackt, aber kein Roamer drauf: ${list}${pending.size > 4 ? " …" : ""}`);
    }
    if (storm.size) ns.print(`! STORM_SEED auf: ${[...storm].join(", ")}  (nicht anfassen)`);
    if (needpw.size) {
        const list = [...needpw].slice(0, 8).join(", ");
        ns.print(`Brauchen Passwort von dir (in ${MANUAL}): ${list}${needpw.size > 8 ? " …" : ""}`);
    }
    if (bigblock.size) ns.print(`Große Blöcke (Stasis/roden): ${[...bigblock.keys()].slice(0, 5).join(", ")}`);
}

export function autocomplete() { return ["--tail"]; }