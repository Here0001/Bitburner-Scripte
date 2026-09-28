/**
 * SCHWARM-QUEEN.js — v7.17
 *
 * v7.17 — CORP LAEUFT NUR, WENN ES EINE CORP GIBT. Nach dem Wechsel nach
 *   BN11 (Testspiel 27.09.2026) stand der Schalter an, home war auf 128 GB
 *   zurueckgesetzt, und die Queen hielt fuer ein CORP, das nur wartet, 5 GB
 *   frei - bis BANK die $150b beisammen hat, koennen Stunden vergehen.
 *   Muster wie BITNODE (v7.6): der Schalter ist die Absicht, die bestehende
 *   Corp der Ausloeser (HELPERS corpBesteht). Kein Umschalten, also kein
 *   Wettlauf mit BANKs START:CORP. Abschnitt 4c2 beendet ein schon laufendes
 *   CORP, wenn sicher keine Corp besteht (Uebergang von v7.16, Handstart).
 *
 * v7.16 — NACH DER SELBST-ERNEUERUNG LIEF ALTER CODE WEITER.
 *   Jede Aenderung an PAYLOADS loest die Selbst-Erneuerung aus. Die neue
 *   Queen uebernahm die PIDs, trug als Startstempel aber den des NEUEN Codes
 *   ein - die Drift-Pruefung konnte den alten Prozess danach nie erkennen.
 *   Am 24.09.2026: PAYLOADS 0.24 eingespielt, BLADEBURNER lief weiter v0.5
 *   (ohne den Grafting-Schutz, um den es ging). Jetzt: (1) die alte Queen
 *   UEBERGIBT die Start-Stempel direkt vor dem spawn, die neue uebernimmt
 *   sie; (2) ohne Uebergabe wird bei Nutzlasten die materialisierte Datei
 *   auf home gegen den aktuellen Code verglichen.
 *
 * v7.15 — DIE SELBST-ERNEUERUNG SAH PAYLOADS NICHT. Dieselbe Falle wie in
 *   v7.10 (HELPERS), dritte Datei: die Queen materialisiert jeden Payload
 *   aus ihrer SPEICHERKOPIE von SCHWARM-PAYLOADS.js. Am 19.09. war der
 *   flume-Zweig eingespielt, die Quittung bestaetigte gleiche Hashes, und
 *   die materialisierte SCHWARM-BITNODE.js auf home enthielt b1tflum3
 *   trotzdem NULL Mal. Regel: in den Stempel gehoert jede Datei, deren
 *   INHALT das Verhalten der Queen bestimmt.
 *
 * v7.14 — WELCHE FASSUNG LAEUFT? DIAG liest alle Versionen aus den DATEIEN
 *   und beantwortet damit "was liegt da?", nicht "was laeuft?". Am 19.09.
 *   stand ueberall 7.13, ein Pruefstand gegen Datei UND Plan lieferte sauber
 *   "flume" — und PLAN_OUT meldete trotzdem weg:null, weil noch die alte
 *   QUEEN lief. Nichts im Schwarm konnte das sagen. QUEEN_OUT traegt jetzt
 *   ver und seit des LAUFENDEN Prozesses.
 *
 * v7.13 — DRITTER WEG AUS EINER BITNODE: "flume". Bisher galten nur
 *   "daedalus" und "weltdaemon" — beides Siege. ns.singularity.b1tflum3
 *   (Singularity.ts:1139) verlaesst eine Node dagegen seitlich, ohne
 *   Weltdaemon und ohne Source-File (RedPill.tsx:66). Als PRUEFPLATZ ist das
 *   wertvoll: in BN3 ist die Corp-Gruendung gratis und der Softcap 1.0.
 *   Bewusst durch dieselbe Tuer wie die anderen beiden — GILT-FUER-NODE ist
 *   die Sicherung, und eine zweite Tuer haette sie umgangen.
 *
 * v7.12 — ABSCHALTEN IST EINE TATSACHE, EINSCHALTEN EINE ENTSCHEIDUNG.
 *   Die Selbstverwaltung kannte nur `cap` — "gibt es die Mechanik in dieser
 *   BitNode?" — und schaltete danach alles an. Ob der Spieler sie BENUTZEN
 *   kann, stand nirgends: zwischen "Gangs gibt es hier" und "ich darf eine
 *   gruenden" liegen 54.000 Karma. Jetzt entscheidet daemonBereit()
 *   (HELPERS v5.9) mit, und zwar asymmetrisch: was nachweislich nicht laufen
 *   kann, geht SOFORT aus (ohne die 2-h-Bremse, es nimmt ja niemandem etwas);
 *   eingeschaltet wird weiterhin erst nach 2 h ohne Eingabe und nur bei
 *   nachgewiesener Reife. Ohne das haette die Regel heute Abend CORP in BN15
 *   wieder angeschaltet — dort, wo der Softcap die Auszahlung erdrueckt.
 *
 * v7.11 — DIE PLAN-ABWEICHUNG LEUCHTETE IM NORMALBETRIEB.
 *   Verglichen wurde ZIEL-NODE ("wohin als naechstes") mit der LAUFENDEN Node —
 *   ein Reiseziel gegen den Standort. Nach jeder Ankunft stand "Abweichung" im
 *   Log, bis jemand den Plan nachzog, und ein bewusster Handgriff des Spielers
 *   sah aus wie ein Fehler. Jetzt traegt SOLL-NODE, wo der Lauf stattfinden
 *   soll, und nur das wird verglichen; ZIEL-NODE ist reine Doku. Fehlt
 *   SOLL-NODE, gilt ZIEL-NODE wie bisher.
 *
 * v7.10 — DIE SELBST-ERNEUERUNG SAH HELPERS NICHT.
 *   v7.8 pruefte nur die EIGENE Datei. Die Registry (DAEMONS) und alle
 *   geteilten Funktionen stehen aber in SCHWARM-HELPERS.js — eine Aenderung
 *   dort aendert das Verhalten der Queen genauso. Am 14.09.2026 wurde ein
 *   pinHost entfernt und eingespielt, und nichts geschah: die laufende Queen
 *   hielt die alte Tabelle im Speicher. Erst ein Neustart von Hand half —
 *   also genau der Aufwand, den v7.8 abschaffen sollte.
 *   Der Stempel deckt jetzt beide Dateien ab.
 *
 * v7.9 — SELBSTVERWALTUNG NACH ZWEI STUNDEN RUHE (Abschnitt 4b2).
 *   Hat zwei Stunden lang niemand etwas getan, schaltet die Queen ein, was
 *   laufen kann, und die reine Anzeige (OVERVIEW/LOGVIEW) aus. Den Zeitstempel
 *   liefert das DASHBOARD auf Port AKTIV_OUT — EIN Lauscher am Dokument
 *   erfasst Terminal-Eingaben, Schalterdrucke und Kaeufe von Hand auf einmal,
 *   weil sie alle dieselbe Voraussetzung haben: eine Eingabe im Spielfenster.
 *
 *   DIE RUHEZEIT IST DER SCHUTZ DES SPIELERS, nicht Zierde. Ohne sie waere
 *   jedes bewusste Ausschalten binnen Sekunden rueckgaengig gemacht.
 *
 *   Ausgenommen: Einmallaeufer (setzen ihren eigenen Schalter waehrend der
 *   Arbeit auf 0), BITNODE (beendet den Durchlauf) und AUTO selbst. Ohne
 *   Zeitstempel wird NICHTS getan — kein Dashboard heisst kein Wissen, und
 *   raten waere hier eine Handlung.
 *
 * v7.8 — DIE QUEEN ERNEUERT SICH SELBST.
 *   Daemons haben checkPayloadDrift(), die Queen hatte NICHTS: ein
 *   eingespieltes SCHWARM-QUEEN.js lag im Spiel und wirkte erst beim naechsten
 *   Start. In der Nacht zum 14.09.2026 hat das zweimal einen ganzen
 *   killall-Zyklus gekostet, nur damit eine Codeaenderung greift.
 *
 *   Sie merkt sich beim Start einen djb2-Stempel ihrer eigenen Datei und
 *   vergleicht alle 20 s. ZWEI SICHTUNGEN, DANN ERST: waehrend rfa-push
 *   schreibt, kann ein Lesen einen halben Quelltext liefern — ein Neustart
 *   darauf startete auf unfertigem Code. spawnDelay 0 heisst, dass die Engine
 *   alt killt und neu startet, ohne Luecke; die Daemons laufen durch und
 *   werden von resyncPids() wieder adoptiert.
 *
 *   IM BETRIEB BEWIESEN (14.09.2026, 02:30). Pruef-Fassung 7.9.1 eingespielt,
 *   danach NICHTS angefasst — kein killall, kein Reset, nur ein pushFile. Der
 *   Bericht 02:32 zeigte 7.9.1 als laufend. Dass kein Reset dazwischenlag,
 *   belegt das Hacking-Level: es wuchs im selben Fenster durchgehend von 1 auf
 *   417. Danach zurueck auf 7.9, ebenfalls von selbst.
 *
 *   Kostet 2 GB (ns.spawn). Nicht vor einem Reset: auf der BitVerse-Seite
 *   verwirft die Engine einen Spawn kommentarlos, die Queen waere dann weg.
 *
 * v7.7 — DAEMONS ZIEHEN VON home WEG, WENN PLATZ FREI WIRD.
 *   pickHost() waehlt "pserv -> fremd -> home", aber nur BEIM START. Wer beim
 *   Hochfahren auf home landete, weil sonst nichts gerootet war, blieb dort
 *   fuer immer. Live: BANK braucht 30 GB, bekam sie beim Bootstrap nur auf
 *   home und sass Stunden spaeter noch da, obwohl Fremdserver frei waren.
 *   home ist aber der teuerste Platz im Schwarm — nur dort wirken die Kerne
 *   auf weaken/grow.
 *
 *   KEIN ZWEITER VERSCHIEBE-PFAD, und das ist der Kern. Der Kommentar zu
 *   relocateFromHome() (v4.0 entfernt) warnt ausdruecklich davor; in v6 haben
 *   drei parallele Deploy-Wege schon einmal gegeneinander gearbeitet. 4d
 *   STOPPT deshalb nur — den Neustart macht die normale Planung im selben
 *   Takt mit frischem pickHost(). Genau der Weg, den der alte Kommentar
 *   selbst vorschlaegt.
 *
 *   Bremsen: hoechstens EINER je Durchgang, alle 5 Minuten, nur mit 30 %
 *   Luft am Ziel, nie bei pinHost/Einmallaeufern/PRE_RESET und nicht
 *   innerhalb der Anlaufzeit.
 *
 * v7.6 — EIN AUSGESCHALTETER DAEMON LIEF WEITER.
 *   a) AUTO-STOPP (Abschnitt 4c). stop() kannte nur drei Anlaesse: geaenderter
 *      Quelltext, STOP-Befehl vom Dashboard-Knopf, DROP vom Owner. Der
 *      Schalter selbst stoppte nichts, er verhinderte nur das Starten. Jeder
 *      Weg am Knopf vorbei — schalter.py, Hand am Spielstand, wiederhergestellte
 *      Sicherung — hinterliess also einen laufenden Daemon. Einmallaeufer sind
 *      ausgenommen: SCAN und STANEK setzen ihren eigenen Schalter als ERSTE
 *      Aktion auf 0 und arbeiten weiter; ein blinder Stopp killte sie mitten
 *      im Lauf.
 *   b) BITNODE-AUSLOESER. Der Schalter ist die ABSICHT des Spielers und
 *      ueberlebt BitNode-Wechsel; laufen soll der Daemon aber nur, wenn eine
 *      frische Freigabe vorliegt. Vorher belegte er wartend 20 von 128 GB.
 *
 * v7.5 — DIE FREIGABE WIRKT: gespiegelt auf Port PLAN_OUT (28), damit auch
 *   Daemons auf pserv sie sehen (ns.read liest nur lokal). Gespiegelt in JEDEM
 *   Takt und ganz vorne, vor checkPrestige — nach einem Node-Wechsel muss die
 *   alte Freigabe im selben Takt verschwinden. Ins Log nur bei echter
 *   Aenderung, sonst waere es Grundrauschen.
 *
 * v7.4 — DIE STRATEGIE ZIEHT AUS DEM CODE IN EINE DATEI.
 *   Neu: `schwarm-plan.txt` auf home. Sie traegt das Ziel, die Regeln, die die
 *   Engine nicht kennt, und als EINZIGE Stelle im Schwarm die Freigabe, einen
 *   Durchlauf zu beenden. Die QUEEN liest sie und schreibt nie hinein — der
 *   Plan ist Eingabe des Spielers, kein Zustand des Schwarms. Deshalb liegt er
 *   auch nicht in schwarm-queen-state.txt, wo ein Fehler ihn eines Tages
 *   ueberschreiben wuerde.
 *
 *   KEIN ZUSTAND IN DER DATEI. Welche Source-Files vorhanden sind, weiss die
 *   Engine selbst und immer richtig. Die QUEEN vergleicht Plan gegen
 *   Wirklichkeit, statt eine zweite Wahrheit zu pflegen, die driftet.
 *
 *   GESICHERT UEBER GILT-FUER-NODE: die Freigabe wirkt nur in genau der Node,
 *   fuer die sie geschrieben wurde. Nach einem Wechsel ist sie von selbst
 *   wirkungslos — kein Aufraeumen noetig, und eine alte Freigabe aus einer
 *   Sicherungskopie kann keinen frischen Durchlauf beenden.
 *
 *   DIESE FASSUNG MELDET NUR. Sie liest den Plan, vergleicht ihn mit der
 *   laufenden Node und schreibt das ins Log — die drei Sperren (Daedalus,
 *   w0r1d_d43m0n, The Red Pill) bleiben scharf. Eine Aenderung, die einen
 *   Durchlauf beenden kann, wird nicht in einem Zug scharf gemacht.
 *
 * v7.3 — DEN SCHALTER-ZUSTAND SPIEGELN, DAMIT DAEMONS HOME VERLASSEN KOENNEN.
 *   Die Queen legt den Schalter-Zustand jeden Takt zusaetzlich auf Port
 *   STATE_OUT (27). Grund: ns.read hat keinen Server-Parameter
 *   (NetscriptFunctions.ts:1114), die Datei schwarm-queen-state.txt liegt auf
 *   home, und ein Daemon auf einem anderen Host wuerde seinen An/Aus-Knopf
 *   deshalb stillschweigend ignorieren.
 *
 *   Gespiegelt wird der Zustand NACH autostartDependencies, also der, den die
 *   Queen selbst zugrunde legt — nicht der rohe Dateiinhalt. Sonst saehen
 *   fremde Hosts einen anderen Zustand als die Queen, und es gaebe zwei
 *   Wahrheiten fuer dieselbe Frage.
 *
 *   Kostet 0 GB (clearPort/writePort) und ist in try/catch: faellt der Port
 *   aus, bleibt es beim alten Verhalten.
 *
 * v7.2.3 — ZWEI QUELLEN FUER DIESELBE ZAHL, UND EIN NEUSTART-KARUSSELL.
 *   launch() schrieb payloadStamp(...) auf, checkPayloadDrift verglich mit
 *   daemonStamp(...) — und das umhuellt den Payload-Stempel seit v7.2.2 mit
 *   stampText() und haengt die deps an. Zwei verschiedene Zeichenketten fuer
 *   dieselbe Sache: der Vergleich schlug IMMER an. Jeder laufende
 *   Payload-Daemon wurde damit alle DRIFT_MS (20 s) beendet und neu gestartet.
 *
 *   Live im Bericht 100 sichtbar: GO und TRADER mit PID-Wechseln um 06:55:58
 *   und 06:56:18 — exakt 20 Sekunden. Betroffen waren genau die beiden, weil
 *   alle anderen Payload-Daemons in BN8 aus sind oder One-Shots (ausgenommen).
 *
 *   Es gibt jetzt nur noch EINE Funktion, die einen Stempel bildet. Das ist
 *   dieselbe Lehre wie bei den gespiegelten Portnummern: eine Zahl, die an
 *   zwei Orten gepflegt wird, laeuft auseinander.
 *
 *   Nebenbei behoben: fuer DATEI-Daemons wurde beim Start gar kein Stempel
 *   aufgeschrieben — sie liefen bis zum ersten Nachtragen ungeprueft.
 *
 * v7.2.2 — DER WAECHTER SAH DIE BIBLIOTHEK NICHT.
 *   v7.2.1 stempelte nur die eigene Datei eines Daemons. Ein Skript hat seine
 *   Importe aber fest einkompiliert; Script.invalidateModule() verwirft das
 *   Modul nur fuer KUENFTIGE Starts. Dreizehn Daemons fuehren
 *   deps: ["SCHWARM-HELPERS.js"] — eine Aenderung dort loeste keinen Neustart
 *   aus, und die neue Fassung lag wirkungslos auf der Platte.
 *
 *   Live aufgefallen, vom Nutzer gemeldet: BANK kaufte in BN8 weiter Level-
 *   und Cache-Ausbau am Hacknet, obwohl HELPERS v4.6 die BN8-Erkennung schon
 *   enthielt. Der laufende BANK-Prozess hatte einfach die alte HELPERS.
 *
 *   Jetzt fliessen alle deps in den Stempel. Aendert sich eine gemeinsame
 *   Bibliothek, starten alle Daemons neu, die sie benutzen — genau einmal.
 *
 * v7.2.1 — DASSELBE GILT FUER DIE DATEI-DAEMONS.
 *   Der Waechter aus v7.2 sah nur Payload-Daemons an. BANK, WORK, DISPATCHER,
 *   INFO und die uebrigen liegen als gewoehnliche Dateien auf home — fuer sie
 *   gilt exakt dieselbe Traegheit. Aufgefallen unmittelbar danach beim
 *   Einspielen von BANK v4.9: Datei geschrieben, Prozess unbeeindruckt.
 *   Der Stempel kommt fuer sie aus ns.read(d.file) auf home, also aus der
 *   Quelle, die deployDaemon beim naechsten Start kopiert.
 *
 * v7.2 — EINGESPIELTER CODE LIEF NICHT, ER LAG NUR HERUM.
 *   Bitburner uebersetzt ein Skript beim Start. Wird die Datei danach neu
 *   geschrieben, laeuft der bereits gestartete Prozess UNVERAENDERT weiter:
 *   Script.ts:52 (invalidateModule) wirft nur das uebersetzte Modul fuer
 *   KUENFTIGE Starts weg. Ein Push aendert also die Datei — und sonst nichts.
 *
 *   Aufgefallen ist das an TRADER v1.6: eingespielt, zurueckgelesen, RAM von der
 *   Engine bestaetigt — und der Daemon handelte trotzdem weiter nach v1.5, bis
 *   er von Hand aus- und wieder eingeschaltet wurde. Das betrifft JEDE kuenftige
 *   Nutzlast-Aenderung und ist die unangenehmste Sorte Fehler: es sieht aus, als
 *   waere die neue Fassung aktiv.
 *
 *   Die Queen ist der einzige Deployer und weiss deshalb als Einzige, mit
 *   welchem Code ein Prozess gestartet wurde. Sie haelt beim Start einen
 *   Stempel der Nutzlast fest (PAYLOADS.payloadStamp: Laenge plus djb2-Summe
 *   ueber den FERTIGEN Code, also nach decodePayload und injectPorts — eine
 *   geaenderte Portnummer soll genauso zaehlen wie geaenderter Code) und
 *   vergleicht ihn alle DRIFT_MS. Weicht er ab, wird der Daemon beendet; der
 *   normale Weg startet ihn im SELBEN Takt neu.
 *
 *   Die Pruefung steht deshalb VOR planDeployments: der Plan entsteht aus dem
 *   Ist-Zustand, und ein erst danach beendeter Daemon stuende einen ganzen Takt
 *   still.
 *
 *   DREI BEWUSSTE EINSCHRAENKUNGEN:
 *     1. One-Shots (AUGS, RESET, SCAN, STANEK) sind ausgenommen. Sie tun genau
 *        eine Sache und beenden sich; ein Neustart wuerde sie wiederholen — bei
 *        RESET waere das ein zweiter Augmentation-Install.
 *     2. Fehlt der Stempel (Queen frisch gestartet, laufenden Daemon
 *        uebernommen), wird er stillschweigend nachgetragen statt neu zu
 *        starten. Ein Neustart-Sturm beim Hochlauf waere schlimmer als ein
 *        verpasster Neustart — und nach einem Aug-Reset startet ohnehin alles.
 *     3. Waehrend S.paused (PRE_RESET) passiert nichts. Kurz vor einem Install
 *        wird nichts mehr angefasst.
 *
 *   Die Funktion kann nichts STARTEN, was sonst nicht starten wuerde: sie
 *   beendet nur. Ob der Daemon zurueckkommt, entscheiden weiterhin Schalterstand
 *   und WANT.
 *
 *   NICHT geloest ist damit die zweite Haelfte desselben Problems: Nutzlasten
 *   auf FREMDEN Rechnern (schwarm-crack.js der Darknet-Roamer) werden nur beim
 *   Besiedeln kopiert. Dort haelt bislang nur der Aug-Reset sauber.
 *
 * v7.1 — DIE PRE_RESET-PAUSE KONNTE NIE ENDEN.
 *   PRE_RESET setzt S.paused, und damit startet die Queen nichts mehr ausser
 *   dem RESET-One-Shot (:500). Steht der RESET-Schalter aber auf AUS, laesst
 *   shouldRun() genau diesen einen nie durch — der Schwarm friert stumm ein.
 *
 *   Live am 05.09.2026: BANK meldete Reset-Bereitschaft, die Queen pausierte,
 *   RESET war aus. Folge: TRADER und INFIL blieben gelb ("an, aber kein
 *   Prozess"), STANEK meldete Fehler, und im Dashboard stand dauerhaft
 *   "PRE_RESET — Install steht bevor". Nichts davon sah nach einer Pause aus.
 *
 *   Der Schalter auf AUS heisst: der Spieler will diese Runde weiterspielen.
 *   Dann wird nicht pausiert, und eine laufende Pause faellt.
 *   Dieselbe Luecke steckte in SCHWARM-BANK.js (v4.5): ein Zustand, der den
 *   Betrieb einfriert, braucht immer die Pruefung, ob sein Ausgang offen ist.
 *
 *   Zweiter Fehler derselben Stelle: die Phase blieb auf PRE_RESET stehen,
 *   auch wenn die Pause laengst gefallen war (der Rueckzugspfad hob nur
 *   S.paused auf). Das Dashboard meldete dann "Install steht bevor", obwohl
 *   nichts bevorstand. Die Phase vor der Pause wird jetzt gemerkt und
 *   zurueckgesetzt.
 *
 * v7.0 — DIE NACHLADUNG FEUERTE NIE. checkStanekRecharge mass den FREIEN
 *   Speicher je Host. Der Dispatcher haelt den Pool aber dauerhaft bei rund
 *   90 % Auslastung, also hat kein einzelner Host jemals das Dreifache der
 *   laufenden Ladung frei — die Schwelle war unerreichbar.
 *
 *   Belegt am 04.09.: STANEK stand mit 295 Threads auf home, waehrend 35 TB
 *   Pool bereitstanden. In vier Diagnosezyklen erschien kein einziges
 *   "Nachladung angefordert".
 *
 *   Jetzt dieselbe Grundlage wie in STANEKs pickHost (Payload v2.5): auf jedem
 *   Host ausser home zaehlt maxRam statt free, und exklusiv ist jeder Fremd-
 *   host — nicht nur hacknet-*, denn der Dispatcher raeumt sie alle (v11.8).
 *   home bleibt auf free, dort wird nicht geraeumt.
 *
 * v6.9 — Hacknet-Server in die Stanek-Schaetzung, mit denselben exklusiven
 *   Grenzen wie im Payload (8 GB Reserve, 98 % Anteil). Sonst waere derselbe
 *   Fehler wie in v6.8 zurueckgekehrt: zwei Seiten, zwei Rechnungen.
 *
 * v6.8 — QUEEN UND STANEK REDETEN ANEINANDER VORBEI. checkStanekRecharge
 *   summierte den GANZEN Pool ("Faktor 25.2, Nachladung angefordert"), STANEK
 *   braucht den Platz aber auf EINEM Host: die Ladestaerke ist die Threadzahl
 *   eines Skripts (Stanek.ts:53). Die Queen forderte also stundenlang etwas an,
 *   das drueben abgelehnt wurde. Jetzt dieselbe Rechnung ueber dieselbe
 *   Hostmenge; STANEKs Konstanten stehen als Spiegel in CFG.
 *   Ausserdem: der Waechter meldete SLEEVES und OVERVIEW als "laeuft nicht" —
 *   die sind virtuell (HELPERS:775/802) und haben nie einen Prozess.
 *
 * v6.7
 *
 * v6.7 — WAECHTER FUER BLOCKIERTE DAEMONS, UND STANEK SAGT WARUM NICHT.
 *
 *   ANLASS 1. Im Lagebild stand ueber vier Zyklen "TRADER !! FEHLT — nie
 *   gesehen", ohne dass es jemand bemerkte: die Queen blieb still, weil
 *   shouldRun() schlicht nein sagte — und ein Nein wird nirgends begruendet.
 *   Die Ursache lag zwei Daemons weiter (BANK schickte DROP:TRADER, weil ein
 *   negativer Depotwert wie ein leeres Depot aussah). Sichtbar war davon nichts.
 *   noteBlocked() deckte nur den RAM-Fall ab und kannte keine ZEIT: zwei
 *   Sekunden warten ist normal, zwanzig Minuten ist ein Defekt, im Log sah
 *   beides gleich aus.
 *   JETZT: watchBlocked() beobachtet jeden Daemon, der EINGESCHALTET ist, dessen
 *   Capability vorliegt und der trotzdem nicht laeuft. Nach BLOCK_WARN_MS
 *   (5 min, danach hoechstens alle 30 min) geht eine WARN-Zeile mit Grund und
 *   Dauer heraus — ueber ns.tprint, damit die Fehler-Chronik in SCHWARM-INFO sie
 *   aufsammelt und sie den Lauf ueberlebt.
 *   Er GREIFT NICHT EIN. Kein Kill, kein Zwangsstart. Ein Waechter, der selbst
 *   handelt, verdeckt genau die Ursache, die er sichtbar machen soll — und der
 *   naechstliegende Eingriff ("Platz schaffen") waere hier die falsche Faehrte
 *   gewesen: im Lagebild waren 4,2 bis 5,7 TB frei.
 *
 *   ANLASS 2. checkStanekRecharge (v6.6) loeste nicht aus, obwohl der Faktor
 *   klar ueber der Schwelle lag — 1946 freie Threads gegen 480 geladene ist
 *   Faktor 4, die Schwelle ist 3. Aus dem Quelltext war nicht zu sehen, welche
 *   Stelle greift: die Funktion hatte ACHT stumme Ruecksprungstellen, jede mit
 *   demselben Schweigen. Dasselbe Muster wie beim PHP-5.4-Loeser.
 *   JETZT: jeder Ausstieg traegt einen Grund (S.stanekGrund) und meldet ihn bei
 *   AENDERUNG einmal ins Log — nicht jede Minute, sonst flutet es.
 *   Gemessen wird, nicht geraten.
 *
 * v6.6 — STANEK NACHLADEN, WENN DER POOL GEWACHSEN IST. STANEK ist ein
 *   Einmal-Lauf und schaltet sich selbst ab; die Ladungsstaerke haengt linear an
 *   der Threadzahl des Ladeprozesses. Wer direkt nach dem Prestige im engen Pool
 *   laedt, bleibt fuer den Rest des Laufs schwach — und nach einem killall holt
 *   ihn niemand zurueck. Der Effekt haengt am Logarithmus der Threadzahl
 *   (CotMG/formulas/effect.ts), Faktor 3 bringt rund ein Sechstel mehr auf JEDES
 *   Fragment. Genau deshalb ist die Schwelle 3 und nicht 1,2.
 *
 * v6.5 — POSTFACH-MODELL. Dashboard-Kommandos und WANT/DROP der Owner teilen
 *   sich Port 2. Zwei Leser auf einer FIFO nehmen sich gegenseitig Nachrichten
 *   weg; drainQueenInbox() leert den Eingang deshalb EINMAL und sortiert.
 *
 * v6.4 — SELBSTHEILENDE SCHALTERDATEI. Symptom: beim Abbruch einer Infiltration
 *   beendete sich BANK "gleich mit", danach fing alles von vorn an.
 *   Ursache: schwarm-queen-state.txt ist eine simple Textdatei, die jeder
 *   Prozess ueberschreiben kann. INFIL fasste sie bis v1.11 als
 *   Read-Modify-Write an (setOwnSwitch). Erwischte dieser Lesevorgang einen
 *   leeren oder halben Wert, wurden die Eintraege ALLER anderen Daemons
 *   mitgeloescht. Und weil BANK, WORK, CORP, DARKNET, GO, DIAG und INFIL alle
 *   "defaultOff" sind, gelten sie ohne Eintrag sofort als AUS — die Queen
 *   beendete sie im naechsten Takt reihenweise, ohne dass jemand etwas geklickt
 *   hatte. Uebrig blieben nur die Daemons ohne defaultOff (DASHBOARD, HACKING,
 *   INFO).
 *   JETZT: readStateHealed() haelt einen Spiegel des letzten Takts. Verschwinden
 *   Schluessel, die vorher da waren, werden sie zurueckgeschrieben und die Sache
 *   landet als STATE-WIEDERHERSTELLUNG im Log. Ein bewusstes Ausschalten laeuft
 *   ueber setDaemonEnabled und aktualisiert den Spiegel mit — echte Aenderungen
 *   werden also nicht "geheilt".
 *   (INFIL v1.12 schreibt die Datei ohnehin nicht mehr an; diese Absicherung
 *   gilt jedem kuenftigen Schreiber.)
 *
 * v6.3
 *
 * v6.3 — RESERVIERUNGS-DEADLOCK BEHOBEN. Ein Daemon, der bei VOLLEM Pool neu
 *   eingeschaltet wurde, startete nie und blieb im Dashboard dauerhaft gelb
 *   ("startet…"). Ursache in planDeployments:
 *
 *       const host = pickHost(ns, key, ramMap);
 *       if (!host) continue;          // "reservieren waere sinnlos"
 *       reservations[host] = ...
 *
 *   pickHost() verlangt "r.free >= need", also JETZT schon freien Platz. Der
 *   Dispatcher fuellt den Pool aber bewusst bis an den Rand. Also: kein Platz ->
 *   keine Reservierung -> der Dispatcher bekommt nie den Auftrag zu raeumen ->
 *   im naechsten Takt wieder kein Platz. Die Reservierung ist der EINZIGE Hebel
 *   der Queen auf den Dispatcher, und ausgerechnet dann wurde er nicht betaetigt.
 *
 *   Das erklaert drei gemeldete Symptome auf einmal:
 *     - BLADEBURNER liess sich per Dashboard-Knopf nicht starten.
 *     - INFIL kam nach einem Ende nicht von selbst wieder.
 *     - BANK und INFIL schienen "gekoppelt": beide haengen an pinHost home und
 *       konkurrieren um dieselben GB. Wurde eines beendet, griff der Dispatcher
 *       die Luecke im naechsten Takt fuer Worker ab, bevor die Queen sie nutzen
 *       konnte — mal blieb das eine gelb, mal das andere.
 *
 *   JETZT: findet pickHost keinen Platz, waehlt reserveTarget() den Host, auf
 *   dem der Daemon nach dem Raeumen laufen KANN (r.max statt r.free), und die
 *   Queen reserviert dort — startet aber NICHT. Der Dispatcher zieht die
 *   Reservierung passiv ab; da seine Worker seit v10 One-Shots sind, laeuft der
 *   Platz innerhalb einer Worker-Laufzeit von selbst leer. Im naechsten Takt
 *   greift der normale Pfad.
 *
 *   BUDGET je Host: nie mehr als (max - bereits reserviert), bei home zusaetzlich
 *   abzueglich homeReserve. Die Summe der Reservierungen kann einen Host also
 *   nicht ueberzeichnen. Weil planDeployments die Registry SEQUENZIELL abarbeitet,
 *   bedient dieses Budget automatisch die Registry-Reihenfolge: wer weiter oben
 *   steht, bekommt seinen Platz zuerst. INFIL steht als LETZTER Eintrag und wird
 *   damit erst bedient, wenn alle Dauerdaemons versorgt sind — ohne eine einzige
 *   Zeile Sonderlogik.
 *
 *   FRIST: bleibt eine Reservierung RESERVE_DEADLINE_MS (90 s) erfolglos, wird
 *   sie verworfen, damit ein unmoeglicher Daemon nicht dauerhaft RAM blockiert.
 *
 *   DIAGNOSE: neue Zeile "WARTET <KEY>: <Grund>" — einmalig je Grundwechsel,
 *   damit der Takt das Log nicht flutet.
 *
 * v6.2
 *
 * v6.2 — RESET-ZYKLUS geschlossen. Bisher setzte PRE_RESET nur die Pause; den
 *   Aug-Install loeste NIEMAND aus, der Kreis war offen. Jetzt:
 *   BANK meldet auf Port 19 (RESET_READY), handleResetCycle pausiert, setzt Phase
 *   PRE_RESET und fordert den RESET-One-Shot an. Der ruft installAugmentations
 *   ("SCHWARM-GENESIS.js") — die Engine beendet alles und startet GENESIS neu.
 *   Die Queen fuehrt den Aufruf NICHT selbst aus: installAugmentations toetet das
 *   aufrufende Skript (Singularity.ts:208).
 *   Zwei Sicherungen, beide noetig:
 *     - shouldRun verlangt fuer RESET ein ausdrueckliches WANT. Ohne die Zeile
 *       haette der Zweig `owner === "QUEEN" -> true` ihn jeden Takt gestartet,
 *       also einen Install ohne Anlass ausgeloest.
 *     - Die Pause nimmt RESET aus, sonst blockiert sie die Aktion, die sie
 *       ausgeloest hat.
 *   Zieht BANK die Meldung zurueck (z. B. weil Grafting anlief), hebt die Queen
 *   die Pause wieder auf — der Schwarm friert nicht stumm ein.
 * Aufsicht des Schwarms. ALLEINIGER DEPLOYER.
 *
 * ===========================================================================
 * WAS DIE QUEEN IST — UND WAS NICHT
 * ===========================================================================
 * IST:    Der einzige Prozess im Schwarm, der Daemons startet und beendet.
 *         Sie entscheidet WO ein Daemon läuft, sagt dem Dispatcher, wieviel RAM
 *         er dort FREIMACHEN soll, materialisiert den Payload und startet ihn.
 *
 * NICHT:  Sie entscheidet NICHT, WANN ein Payload-Daemon fachlich gebraucht wird.
 *         Das weiß nur der Owner (BANK weiß, wann sich der TRADER lohnt; WORK
 *         weiß, wann Bladeburner Sinn ergibt). Der Owner MELDET das (Port 2, QUEEN_IN).
 *
 * MELDEWEG (v6):
 *     Owner --WANT:KEY--> [Port 2] --> QUEEN --RESERVE--> [Port 19] --> DISPATCHER
 *                                          |
 *                                          +--> materialize() + exec()
 *
 * EINZIGE AUSNAHME: Daemons mit owner "HACKING" (aktuell nur BACKDOOR) führt der
 * DISPATCHER selbst. Begründung: Er IST der RAM-Eigentümer — er kann sich selbst
 * nichts wegschnappen und braucht deshalb keine Reservierung. Die Queen fasst
 * diese Daemons nicht an.
 *
 * ===========================================================================
 * ÄNDERUNGEN ggü. v5
 * ===========================================================================
 * BUGFIX (schwer): RESERVIERUNGS-HOST != DEPLOY-HOST.
 *     v5 hatte eine eigene Host-PROGNOSE (predictHost) für Port 6, während der
 *     Deploy pickHost() nutzte. Die zwei Algorithmen wichen ab (predictHost kannte
 *     keine Fremdhosts, filterte nicht auf `free >= need`). Die Queen hielt also
 *     pserv-3 frei, der Daemon landete auf pserv-1 -> exec lieferte PID 0 oder
 *     verdrängte laufende Worker. -> predictHost ERSATZLOS GESTRICHEN. Es gibt
 *     nur noch pickHost(ns, key, ramMap): EIN Host, reserviert UND bedient.
 *
 * BUGFIX: Drei parallele Deploy-Pfade (Queen + BANK + WORK riefen alle
 *     deployDaemon()). Jetzt genau einer.
 *
 * BUGFIX: Owner-Lücke. Lief der Owner selbst nicht (z.B. WORK ohne SF4 in BN7),
 *     startete NIEMAND seine Payloads — BLADEBURNER/GANGS blieben tot. Die Queen
 *     erzeugt jetzt einen ERSATZ-WANT aus der Registry, wenn der Owner-Daemon
 *     nicht läuft, aber die Capability des Payloads erfüllt ist.
 *
 * LATENZ: v5 machte pro 2-s-Takt ZWEI volle Netz-BFS (indexProcesses +
 *     ensureDispatcher) plus buildRamMap doppelt — bei ~80 Hosts sind das mehrere
 *     hundert ns-Calls pro Takt im Haupt-Thread. Jetzt:
 *       - Topologie kommt aus dem Cache (HELPERS.getTopology, Ereignis-getrieben)
 *       - EIN buildRamMapFast() pro Takt, aus dem alles abgeleitet wird
 *       - PID-Prüfung per ns.isRunning(pid) (O(1)) statt ns.ps() über alle Hosts
 *       - Voller ps()-Abgleich nur alle RESYNC_MS (60 s) oder nach Prestige
 *
 * BUGFIX (v6.1): DASHBOARD-SCHALTER OHNE WIRKUNG.
 *     Der Dashboard-Button sendete nur sendCmd("STOP:WORK") auf Port 1. Die Queen
 *     killte den Prozess — und startete ihn im nächsten Takt sofort wieder, weil
 *     isDaemonEnabled() die State-Datei las, dort nichts fand und den Registry-
 *     Default "an" nahm. Es gab in der GESAMTEN Codebasis keinen Schreiber für
 *     STATE_FILE. Jetzt schreibt die Queen den Schalter bei STOP/START/FORCE
 *     (HELPERS.setDaemonEnabled). state=0 gewinnt gegen alles, auch gegen ein WANT.
 *
 * ENTFERNT: die komplette BACKDOOR-Trigger-Logik (Ports 10/11). Der Dispatcher
 *     macht das jetzt selbst — siehe HELPERS-Kopf für den Engine-Beweis, dass
 *     installBackdoor() keinen Spieler-Slot belegt.
 *
 * @param {NS} ns
 */
// Eine Quelle fuer Kopf und Laufzeitmeldung. Bis zum Health-Check am
// 04.09.2026 waren das getrennte Freitexte und liefen auseinander: der
// Kopf sagte eine Version, die Startmeldung im Log eine andere. Beim
// Nachstellen eines Fehlers behauptet das Log damit etwas Falsches.
const VERSION = "7.17";

import {
    DAEMONS, PHASE,
    STATE_FILE, readManagedState, isDaemonEnabled, setDaemonEnabled, planFreigabe,
    writeOutField,
    daemonBereit, bereitSpielerInfo, corpBesteht,
    publishManagedState,
    PSERV_PREFIX,
    setPhase, getPhase, publishCapabilities, detectCapabilities,
    publishTreasury, DEFAULT_TREASURY, syncReserveFile,
    pickHost, deployDaemon, buildRamMapFast, getTopology, markTopoDirty,
    refreshCrackers, nukeIncremental, homeReserve,
    publishReservations, drainQueenInbox, expireSpawnWants,
    ensureSingleInstance, announce, formatRam,
    readResetReady,
    // v12.0 ERNTE: die Queen ist der EINZIGE Toeter von XP-Dauerlaeufern. Der
    // Dispatcher meldet nur (REAP auf Port 2); zusaetzlich erntet sie selbst,
    // wenn eine eigene Reservierung nicht frei wird. Begruendung in HELPERS.
    reapXpLong, XP_LONG_WORKER,
    // v6.6: fuer die STANEK-Nachladepruefung (Port 25 lesen).
    SCHWARM_PORTS,
} from "SCHWARM-HELPERS.js";
import { materialize, payloadStamp } from "SCHWARM-PAYLOADS.js";

const CFG = {
    TICK_MS: 2000,        // Haupttakt
    SENSE_MS: 16000,      // Capabilities/Treasury/Rooting (teuer, selten)
    RESYNC_MS: 60000,     // Voller ps()-Abgleich (Selbstheilung nach Fremdkills)
    GRACE_MS: 12000,      // Nach dem Start: Daemon nicht sofort für tot erklären
    RESERVE_HOLD_MS: 30000, // So lange bleibt eine Reservierung stehen, wenn ein
                            // Deploy scheitert (RAM noch nicht frei) — danach neu bewertet.
    // v12.0: So lange bekommt eine Reservierung Zeit, sich PASSIV zu erfuellen,
    // bevor die Queen XP-Dauerlaeufer erntet. Drei Dispatcher-Takte (2 s) — genug,
    // damit er die Reservierung gelesen und aufgehoert hat, den Host nachzufuellen.
    // Kuerzer waere ein Wettlauf: die Queen erntet, der Dispatcher fuellt im selben
    // Moment nach, und beide arbeiten gegeneinander.
    REAP_GRACE_MS: 6000,
    // v7.7 — UMZUG. Wie oft geprueft wird, ob ein Daemon home verlassen kann.
    // 5 Minuten ist absichtlich traege: jeder Umzug kostet den Speicherzustand
    // des Daemons (EMA, Zaehler, Wartelisten), und home fuellt sich nicht im
    // Sekundentakt. Lieber spaet umziehen als staendig.
    UMZUG_MS: 300000,
    // Der Zielhost muss SPUERBAR mehr Platz haben als noetig, sonst zieht der
    // Daemon um und wird gleich wieder verdraengt. 1.3 = 30 % Luft.
    UMZUG_PUFFER: 1.3,
    // v7.8 — SELBST-ERNEUERUNG. Wie oft die Queen prueft, ob ihre EIGENE Datei
    // sich geaendert hat. 20 s wie bei der Nutzlast-Drift: eingespielt wird
    // beim Deploy, nicht im Betrieb.
    SELF_MS: 20000,
    // v7.9 — SELBSTVERWALTUNG. Nach dieser Ruhezeit ohne menschliche Eingabe
    // richtet sich der Schwarm selbst ein. Zwei Stunden sind bewusst lang: sie
    // sollen "der Spieler ist weg" bedeuten, nicht "der Spieler denkt nach".
    AUTO_RUHE_MS: 2 * 60 * 60 * 1000,
    AUTO_PRUEF_MS: 60000,        // so oft wird nachgesehen (nicht jede Sekunde)
    // v7.2: Wie oft geprueft wird, ob ein laufender Daemon veralteten Code
    // faehrt. 20 s ist bewusst traege: eine Nutzlast aendert sich beim
    // Einspielen, nicht im Betrieb, und payloadStamp dekodiert dabei den
    // ganzen Quelltext. Haeufiger waere reine Rechenlast ohne Nutzen.
    DRIFT_MS: 20000,
    // =========================================================================
    // v6.6 — STANEK NACHLADEN, WENN DER POOL GEWACHSEN IST
    // =========================================================================
    // STANEK ist ein Einmal-Lauf: er laedt die Fragmente einmal auf und schaltet
    // sich selbst ab (defaultOff + oneshotDaemon). Die Ladungsstaerke haengt
    // LINEAR an der Threadzahl des Ladeprozesses — wer direkt nach dem Prestige
    // im engen Pool laedt, bleibt fuer den Rest des Laufs schwach.
    //
    // Der Payload ruestet zwar selbst nach, aber nur solange er LEBT. Nach einem
    // killall oder einem Absturz steht er auf "aus (gewollt)", und niemand holt
    // ihn zurueck. Livebeleg ueber mehrere Berichte: Threadstaerke 17.507,
    // waehrend der Pool rund 95.000 Threads hergegeben haette — und die Zeile
    // "STANEK laedt mit Threadstaerke 17507" stand Bericht fuer Bericht da,
    // ohne dass etwas passierte.
    //
    // Der Effekt haengt am Logarithmus der Threadzahl (CotMG/formulas/effect.ts),
    // ein Faktor 3 bringt also rund ein Sechstel mehr auf JEDES Fragment. Genau
    // deshalb ist die Schwelle 3 und nicht 1,2: darunter lohnt der Neustart die
    // Stoerung nicht.
    STANEK_RECHARGE_FACTOR: 3,
    STANEK_CHECK_MS: 60_000,     // hoechstens einmal je Minute pruefen

    // v6.8: SPIEGEL VON STANEKS EIGENEN KONSTANTEN (SCHWARM-PAYLOADS, CFG des
    // STANEK-Payloads). Sie stehen hier, damit die Queen mit DENSELBEN Zahlen
    // rechnet, mit denen der Payload entscheidet — sonst fordert sie wieder
    // etwas an, das drueben abgelehnt wird. Aendert sich drueben eine Zahl,
    // muss sie hier mit.
    STANEK_RAM_RESERVE: 64,      // geteilter Host
    STANEK_RAM_RESERVE_EXKL: 8,  // exklusiv = JEDER Host ausser home
    STANEK_CHARGE_RAM: 2.0,      // GB je Ladethread
    STANEK_MAX_FRAC: 0.75,       // geteilter Host
    STANEK_MAX_FRAC_EXKL: 0.98,  // exklusiv = JEDER Host ausser home
    STANEK_MIN_THREADS: 8,
    STANEK_MAX_THREADS: 32768,

    // v6.7 — WAECHTER. Ab wann ein eingeschalteter, nicht laufender Daemon
    // gemeldet wird. 5 min ist bewusst traege: Anlauf, Reservierung und ein
    // Dispatcher-Raeumlauf duerfen niemals eine Warnung ausloesen.
    BLOCK_WARN_MS: 300_000,
    BLOCK_WARN_REPEAT_MS: 1_800_000,
};

/** Laufzeit-Zustand der Queen (nur im Speicher, überlebt keinen Neustart). */
// v6.3: so lange darf eine Reservierung erfolglos stehen, bevor sie fallen
// gelassen wird. Zu kurz -> der Dispatcher schafft das Raeumen nicht; zu lang ->
// ein unmoeglicher Daemon blockiert RAM des ganzen Schwarms.
const RESERVE_DEADLINE_MS = 90_000;

const S = {
    pids: {},          // KEY -> { pid, host, started }
    wants: {},         // KEY -> Zeitstempel des letzten WANT (Port 2, QUEEN_IN)
    reserveSince: {},  // KEY -> seit wann reserviert (für RESERVE_HOLD_MS)
    reapSince: {},     // HOST -> seit wann reserviert UND zu wenig frei (v12.0)
    lastStanekCheck: 0,// v6.6: Zeitpunkt der letzten Nachlade-Pruefung
    blockedWhy: {},    // v6.3: KEY -> zuletzt gemeldeter Grund fuers Nicht-Starten
    blockSeit: {},     // v6.7: KEY -> seit wann eingeschaltet aber nicht laufend
    blockWarn: {},     // v6.7: KEY -> wann zuletzt darueber gewarnt wurde
    stanekGrund: "",   // v6.7: zuletzt gemeldeter Grund der Stanek-Nachladung
    stateMirror: null, // v6.4: letzter bekannter Schalterstand (Selbstheilung)
    lastSense: 0,
    lastResync: 0,
    lastReset: 0,
    paused: false,     // PRE_RESET: nichts mehr starten
    resetPending: false, // RESET-One-Shot ist angefordert/unterwegs
    phaseVorReset: "",   // Phase vor PRE_RESET, fuer den Rueckweg [v7.1]
    crackers: { list: [], count: 0 },
    // v7.2: KEY -> Nutzlast-Stempel zum Zeitpunkt des Starts. Weicht der
    // aktuelle Stempel davon ab, laeuft dort alter Code (siehe checkPayloadDrift).
    payloadStamp: {},
    lastDriftCheck: 0,
};

/** Daemon läuft? O(1) über die PID — kein Netz-Scan. */
/**
 * v7.8 — FINGERABDRUCK DER EIGENEN DATEI.
 *
 * WOZU. Daemons bekommen checkPayloadDrift(), die Queen bekam NICHTS: ein
 * eingespieltes SCHWARM-QUEEN.js lag im Spiel und wirkte erst beim naechsten
 * Start. In der Nacht zum 14.09.2026 hat das zweimal einen kompletten
 * killall-Zyklus gekostet, nur damit eine Codeaenderung greift.
 *
 * djb2 ueber den Quelltext, plus die Laenge. ns.read ist 0 GB, die Datei liegt
 * auf demselben Host — der Test kostet also nichts ausser einem Durchlauf.
 *
 * @returns {string|null} Stempel, oder null wenn die Datei nicht lesbar ist
 *          (dann wird NICHT erneuert — lieber alt weiterlaufen als blind).
 */
function selbstStempel(ns) {
    try {
        // v7.10: HELPERS GEHOERT DAZU. Die Registry (DAEMONS) und alle geteilten
        // Funktionen stehen dort — eine Aenderung daran aendert das Verhalten der
        // Queen genauso wie eine an ihrer eigenen Datei. Am 14.09.2026 fiel das
        // auf: pinHost fuer DASHBOARD entfernt, eingespielt, und nichts geschah,
        // weil die laufende Queen die alte Tabelle im Speicher hielt. Erst ein
        // Neustart von Hand half — genau das, was v7.8 abschaffen sollte.
        // v7.15: UND PAYLOADS GEHOERT AUCH DAZU — dieselbe Falle, dritte Datei.
        // Die Queen materialisiert JEDEN Payload aus ihrer SPEICHERKOPIE von
        // SCHWARM-PAYLOADS.js (materialize() liest p.src, nicht die Datei).
        // Aendert sich diese Datei, merkt die laufende Queen davon nichts, und
        // materialize() schreibt weiter die ALTE Quelle nach home — auch wenn
        // der Daemon neu gestartet wird.
        //
        // Live am 19.09.2026 und es hat eine Stunde gekostet: der flume-Zweig
        // war in PAYLOADS 0.22 eingespielt, die Deploy-Quittung bestaetigte
        // gleiche Hashes, PLAN_OUT meldete korrekt weg:"flume" — und die
        // materialisierte SCHWARM-BITNODE.js auf home enthielt das Wort
        // b1tflum3 NULL Mal. Ein Schalter-Aus/An half nicht: die Queen schrieb
        // brav neu, nur eben aus dem alten Speicher.
        //
        // Die Regel dahinter ist einfach und haette zweimal gereicht: in den
        // Stempel gehoert JEDE Datei, deren INHALT das Verhalten der Queen
        // bestimmt — nicht nur die, die sie ausfuehrt.
        let txt = "";
        for (const datei of [ns.getScriptName(), "SCHWARM-HELPERS.js", "SCHWARM-PAYLOADS.js"]) {
            const t = ns.read(datei);
            if (typeof t !== "string" || t.length === 0) return null;
            txt += t;
        }
        let h = 5381;
        for (let i = 0; i < txt.length; i++) h = ((h << 5) + h + txt.charCodeAt(i)) >>> 0;
        return txt.length + ":" + h.toString(36);
    } catch (e) { return null; }
}

/**
 * v7.8 — Hat sich die eigene Datei geaendert? Dann neu starten.
 *
 * ZWEI SICHTUNGEN, DANN ERST. Waehrend rfa-push schreibt, kann ein Lesen einen
 * HALBEN Quelltext liefern — der Stempel waere anders, die Datei aber unfertig.
 * Ein Neustart darauf waere im besten Fall ueberfluessig und im schlimmsten ein
 * Start auf halbem Code. Deshalb muss derselbe NEUE Stempel zweimal in Folge
 * erscheinen.
 *
 * spawnDelay 0: die Engine killt das alte Skript und startet das neue im selben
 * Zug (NetscriptFunctions.ts:675) — keine Luecke, in der niemand die Daemons
 * fuehrt. Die laufenden Daemons ueberleben den Wechsel; resyncPids() adoptiert
 * sie in der neuen Instanz ueber ns.ps() wieder.
 *
 * NICHT VOR EINEM RESET. In PRE_RESET wird ohnehin gleich alles beendet, und
 * ein Spawn auf der BitVerse-Seite wird von der Engine kommentarlos verworfen
 * (NetscriptFunctions.ts:655) — die Queen waere dann einfach weg.
 */
function selbstErneuern(ns) {
    if (getPhase(ns) === PHASE.PRE_RESET) return;
    const jetzt = selbstStempel(ns);
    if (!jetzt || !S.selfStamp || jetzt === S.selfStamp) { S.selfKandidat = null; return; }
    if (S.selfKandidat !== jetzt) {
        S.selfKandidat = jetzt;
        ns.print(`SELBST: neue Fassung gesehen (${S.selfStamp} -> ${jetzt}), bestaetige im naechsten Durchgang.`);
        return;
    }
    ns.tprint(`INFO  [QUEEN] Neue Fassung eingespielt — starte mich selbst neu (${jetzt}).`);
    announce(ns, "start", "Selbst-Erneuerung: neue Fassung uebernommen");
    uebergabeSchreiben(ns);   // v7.16: Start-Stempel fuer die naechste Queen
    ns.spawn(ns.getScriptName(), { spawnDelay: 0, threads: 1 }, ...ns.args);
}

/**
 * v7.9 — SELBSTVERWALTUNG NACH ZWEI STUNDEN RUHE.
 *
 * ZWECK. Unbeobachtetes Spielen. Wer ausgeschaltet hat, hatte einen Grund —
 * aber wenn zwei Stunden lang niemand etwas getan hat, ist der Grund
 * wahrscheinlich vorbei und der Spieler nicht da. Dann soll laufen, was laufen
 * kann, und die reine Anzeige soll schweigen.
 *
 * DIE RUHEZEIT IST DER SCHUTZ DES SPIELERS. Ohne sie waere jedes bewusste
 * Ausschalten binnen Sekunden rueckgaengig gemacht — genau die Fehlerklasse,
 * die am 05.09. den RESET-Schaden verursacht hat, nur andersherum. Zwei
 * Stunden sind lang genug, dass niemand sie im Spiel aus Versehen erreicht.
 *
 * AUSNAHMEN, jede mit eigenem Grund:
 *   Einmallaeufer (SCAN/STANEK/RESET/AUGS) — sie setzen ihren EIGENEN Schalter
 *     waehrend der Arbeit auf 0. Ein Auto-An startete sie im 2-s-Takt endlos.
 *   BITNODE — beendet den Durchlauf. Rein benutzergesteuert, immer.
 *   AUTO selbst — ein Schalter, der sich selbst einschaltet, waere kein Schalter.
 *   OVERVIEW/LOGVIEW — reine Anzeige; sie gehen AUS statt an.
 *
 * "Voraussetzungen erfuellt" heisst hier: die Capability aus der Registry ist
 * da. Mehr kann diese Stelle ehrlich nicht pruefen — ob ein Daemon inhaltlich
 * sinnvoll arbeiten kann (Bladeburner braucht 100 Kampfwerte und das
 * Simulacrum), weiss nur er selbst. Der Schalter ist die ERLAUBNIS, nicht die
 * Behauptung, dass es klappt.
 */
function selbstverwaltung(ns, caps, state) {
    if (!isDaemonEnabled(ns, "AUTO", state)) return;

    // =====================================================================
    // v7.12 — ABSCHALTEN SOFORT, EINSCHALTEN ERST NACH RUHE
    // =====================================================================
    // Die 2-Stunden-Regel gibt es, damit der Schwarm dem Menschen nicht in die
    // Hand faellt. Fuer das ABSCHALTEN ist sie aber die falsche Bremse: einen
    // Daemon stillzulegen, dessen Voraussetzung nachweislich fehlt, nimmt
    // niemandem etwas weg — er kann ohnehin nichts tun. Deshalb:
    //
    //   "kann nicht laufen"  ist eine TATSACHE     -> sofort, ohne Wartezeit
    //   "kann jetzt laufen"  ist eine ENTSCHEIDUNG -> erst nach 2 h Ruhe
    //
    // Ohne diese Trennung stuende nach einem BitNode-Wechsel zwei Stunden lang
    // ein GANGS-Schalter auf "an", waehrend das Karma bei 0 neu anfaengt —
    // und die Queen wuerde in jedem Takt versuchen, ihn zu bedienen.
    // ARSENAL macht dasselbe einmalig beim Reset (v4.2); hier ist die
    // laufende Absicherung fuer alles, was sich WAEHREND des Durchlaufs
    // aendert (etwa eine Corp, die es nicht mehr gibt).
    const sp = bereitSpielerInfo(ns);
    const unreif = [];
    for (const [key, d] of Object.entries(DAEMONS)) {
        if (!d || d.oneshotDaemon || key === "BITNODE" || key === "AUTO") continue;
        if (!isDaemonEnabled(ns, key, state)) continue;         // steht schon aus
        let b;
        try { b = daemonBereit(ns, key, sp); } catch (e) { continue; }
        if (b !== false) continue;                              // true/null -> in Ruhe lassen
        try {
            setDaemonEnabled(ns, key, 0);
            state[key] = 0;
            unreif.push(key);
        } catch (e) { /* naechster Durchgang */ }
    }
    if (unreif.length) {
        const satz = `SELBSTVERWALTUNG: Voraussetzung fehlt, abgeschaltet: ${unreif.join(", ")}`;
        ns.print(satz);
        try { announce(ns, "aktion", satz); } catch (e) { /* Beiwerk */ }
    }

    let stempel = 0;
    try { stempel = Number(ns.peek(SCHWARM_PORTS.AKTIV_OUT)) || 0; } catch (e) { stempel = 0; }
    // Kein Stempel = das Dashboard laeuft nicht, also wissen wir NICHTS. Dann
    // lieber nichts tun: raten waere hier eine Handlung, kein Zustand.
    if (!stempel) return;
    if (Date.now() - stempel < CFG.AUTO_RUHE_MS) return;

    const AUS = ["OVERVIEW", "LOGVIEW"];
    const geaendert = [];
    for (const [key, d] of Object.entries(DAEMONS)) {
        if (!d || d.oneshotDaemon || key === "BITNODE" || key === "AUTO") continue;
        const soll = AUS.indexOf(key) >= 0 ? 0 : ((!d.cap || caps[d.cap]) ? 1 : null);
        if (soll === null) continue;                       // Mechanik fehlt (cap) -> in Ruhe lassen
        // v7.12: `cap` sagt nur, ob es die Mechanik GIBT. Einschalten darf die
        // Queen erst, wenn die fachliche Bedingung NACHWEISLICH erfuellt ist —
        // bei "unbekannt" (null) wird nicht geraten.
        if (soll === 1) {
            let b;
            try { b = daemonBereit(ns, key, sp); } catch (e) { b = null; }
            if (b !== true) continue;
        }
        const ist = isDaemonEnabled(ns, key, state) ? 1 : 0;
        if (ist === soll) continue;
        try {
            setDaemonEnabled(ns, key, soll);
            state[key] = soll;
            geaendert.push(`${key}:${soll ? "an" : "aus"}`);
        } catch (e) { /* naechster Durchgang */ }
    }
    if (geaendert.length) {
        const satz = `SELBSTVERWALTUNG (2 h ohne Eingabe): ${geaendert.join(", ")}`;
        ns.print(satz);
        try { announce(ns, "aktion", satz); } catch (e) { /* Meldung ist Beiwerk */ }
    }
}

/** v7.7: wann zuletzt ein Umzug geprueft wurde (0 = nie). */
function umzugFaellig(now) {
    if (now - (S.lastUmzug || 0) < CFG.UMZUG_MS) return false;
    S.lastUmzug = now;
    return true;
}

function alive(ns, key) {
    const e = S.pids[key];
    if (!e || !e.pid) return false;
    try { return ns.isRunning(e.pid); } catch (err) { return false; }
}

/** Wurde gerade erst gestartet? Dann nicht als "tot" behandeln. */
function inGrace(key) {
    const e = S.pids[key];
    return !!e && (Date.now() - e.started) < CFG.GRACE_MS;
}

/**
 * SELBSTHEILUNG: Voller ps()-Abgleich. Findet Daemons, die von außen gekillt
 * wurden ODER die schon liefen, als die Queen startete (Neustart der Queen).
 * Teuer — deshalb nur alle RESYNC_MS und beim Kaltstart.
 */
function resyncPids(ns) {
    const byFile = {};
    for (const [key, d] of Object.entries(DAEMONS)) byFile[d.file] = key;

    const found = {};
    for (const host of Object.keys(buildRamMapFast(ns, true))) {
        let procs = [];
        try { procs = ns.ps(host); } catch (e) { continue; }
        for (const p of procs) {
            const key = byFile[p.filename];
            if (!key) continue;
            // Doppelläufer: den jüngeren killen (kann nach Fremdstart passieren)
            if (found[key]) { try { ns.kill(p.pid); } catch (e) { /* egal */ } continue; }
            found[key] = { pid: p.pid, host, started: S.pids[key]?.started || Date.now() };
        }
    }
    S.pids = found;
    S.lastResync = Date.now();
}

/**
 * Soll dieser Daemon laufen? Drei Hürden, in dieser Reihenfolge:
 *   1. Dashboard-Schalter (STATE_FILE) — schlägt ALLES. state=0 gewinnt immer.
 *   2. Capability (SF/BN-Voraussetzung).
 *   3. Fachlicher Wunsch:
 *        owner "QUEEN"   -> immer (die Queen ist selbst der Owner)
 *        owner "HACKING" -> NIE von der Queen (der Dispatcher führt ihn)
 *        sonst           -> nur bei aktivem WANT auf Port 2 (QUEEN_IN)
 *                           ODER Ersatz-WANT, wenn der Owner-Daemon nicht läuft
 */
function shouldRun(ns, key, caps, state) {
    const d = DAEMONS[key];
    if (!d) return false;
    if (d.owner === "HACKING") return false;       // gehört dem Dispatcher

    // 1. Dashboard-Schalter. 0 = AUS gewinnt gegen ALLES (auch gegen ein WANT).
    if (!isDaemonEnabled(ns, key, state)) return false;

    // 2. Capability.
    if (d.cap && !caps[d.cap]) return false;

    // 3. FORCIERT (state 2): Override — startet auch ohne WANT des Owners.
    if (state[key] === 2) return true;

    if (d.triggered) return false;                 // startet nur auf Auslöser

    // v6.2 RESET braucht IMMER eine ausdrueckliche Anforderung. Ohne diese Zeile
    // wuerde der naechste Zweig (owner === "QUEEN" -> true) ihn jeden Takt starten,
    // sobald der Schalter an ist — also einen Aug-Install ohne Anlass ausloesen.
    // Die Anforderung setzt allein handleResetCycle, nachdem BANK auf Port 19
    // gemeldet hat. Der Dashboard-Schalter bleibt zusaetzlich ein Not-Aus.
    if (key === "RESET") return !!S.wants.RESET;

    // v7.6 — BITNODE LAEUFT NUR, WENN ES ETWAS ZU TUN GIBT.
    // Der Schalter ist der WILLE des Spielers und ueberlebt BitNode-Wechsel;
    // der Daemon selbst soll aber nicht stundenlang wartend RAM belegen. Am
    // 13.09. tat er genau das: eingeschaltet, Freigabe laengst abgelaufen,
    // 20 von 128 GB auf home fuer eine Schleife, die nur schlaeft.
    // Jetzt ist der Schalter die Absicht und die frische Freigabe der Ausloeser.
    // Faellt die Freigabe weg (Node gewechselt, Plan zurueckgesetzt, QUEEN tot),
    // beendet ihn Abschnitt 4c im selben Takt.
    if (key === "BITNODE") return !!planFreigabe(ns);

    // v7.17 — CORP LAEUFT NUR, WENN ES EINE CORP GIBT (Spieler 27.09.2026:
    // "corp auf on kostet ram?"). Dasselbe Muster wie BITNODE: der Schalter
    // ist die Absicht, die bestehende Corp der Ausloeser. Gruenden ist BANKs
    // Aufgabe; sobald die Corp steht, startet CORP im naechsten Takt. Ein schon
    // laufendes CORP ohne Corp beendet Abschnitt 4c2. FORCIERT (2) greift
    // weiter oben und startet trotzdem.
    if (key === "CORP" && corpBesteht(ns) !== true) return false;

    if (d.owner === "QUEEN") return true;

    if (S.wants[key]) return true;                 // Owner hat WANT gemeldet

    // ERSATZ-WANT: Der Owner-Daemon läuft nicht (Capability fehlt ihm, oder er ist
    // abgestürzt), aber DIESER Payload wäre lauffähig. Ohne das blieben in BN7 ohne
    // SF4 BLADEBURNER und GANGS für immer tot, weil WORK (cap SING) nie startet.
    const ownerKey = d.owner;
    if (ownerKey && DAEMONS[ownerKey]) {
        const ownerCap = DAEMONS[ownerKey].cap;
        const ownerBlocked = ownerCap && !caps[ownerCap];
        if (ownerBlocked && !d.oneshotDaemon) return true;
    }
    return false;
}

/**
 * ABHÄNGIGKEITS-AUTOSTART (v6.2).
 *
 * Kontrollzentrum-Modus: die meisten Daemons sind defaultOff, der Spieler schaltet
 * gezielt zu. Problem: Schaltet er einen ABHÄNGIGEN Daemon ein (z.B. AUGS), dessen
 * Owner (BANK) aber aus ist, käme nie ein WANT -> AUGS startet nie. Diese Funktion
 * aktiviert den Owner automatisch mit.
 *
 * ABHÄNGIGKEIT: explizit über d.dependsOn, sonst implizit über d.owner (BANK/WORK).
 *   TRADER/AUGS -> BANK; BLADEBURNER/GANGS -> WORK; CORP -> BANK (dependsOn).
 *
 * DREI SCHUTZREGELN (vom Nutzer verlangt):
 *   1. Nur mitstarten, wenn die CAPABILITY des abhängigen Daemons in DIESER BitNode
 *      erfüllt ist (caps[d.cap]). Sonst würde z.B. das Einschalten von GANGS in einer
 *      Gang-losen BitNode BANK/WORK sinnlos hochziehen. (Fall: "gar nicht erlaubt".)
 *   2. CORP: BANK-Mitstart ist nur FALLBACK. Existiert die Corp schon, läuft sie
 *      eigenständig — BANK erkennt das selbst (hasCorporation) und tut nichts Böses,
 *      der Mitstart ist also harmlos, falls Corp schon da ist. (Fall: "schon gegründet".)
 *   3. Noch-nicht-freigeschaltet (GANG/BLADE: Karma/Stats fehlen) ist unkritisch —
 *      WORK arbeitet ohnehin darauf hin; der Payload selbst startet erst, wenn die
 *      Bedingung erfüllt ist. Der Owner-Mitstart schadet nicht.
 *
 * Der Owner wird nur aktiviert, wenn der Spieler ihn nicht EXPLIZIT auf 0 (AUS)
 * gestellt hat — ein bewusstes Owner-AUS gewinnt (der Spieler will es dann nicht).
 *
 * @param {NS} ns
 * @param {Object} caps  aktuelle Capabilities
 * @param {Object} state  Dashboard-Schalter (wird bei Bedarf mutiert + persistiert)
 */
function autostartDependencies(ns, caps, state) {
    for (const key of Object.keys(DAEMONS)) {
        const d = DAEMONS[key];
        // WICHTIG: nur bei EXPLIZITEM Einschalten durch den Spieler reagieren, NICHT
        // beim bloßen Default-"enabled". AUGS/TRADER/GANGS/BLADEBURNER haben kein
        // defaultOff -> isDaemonEnabled() gäbe per Default true, obwohl der Spieler
        // sie nie eingeschaltet hat (sie laufen nur auf Owner-WANT). Würde man darauf
        // reagieren, zöge die Queen BANK/WORK schon beim Boot hoch -> Kontrollzentrum
        // wäre ausgehebelt. Also: nur wenn der Schalter EXPLIZIT auf an (>=1) steht.
        if (!(key in state) || state[key] < 1) continue;
        // Regel 1: nur wenn die Capability des Daemons in dieser BitNode erfüllt ist.
        if (d.cap && !caps[d.cap]) continue;

        // Aktivierungs-Owner bestimmen: explizit (dependsOn) oder implizit (owner).
        const dep = d.dependsOn || ((d.owner === "BANK" || d.owner === "WORK") ? d.owner : null);
        if (!dep || !DAEMONS[dep]) continue;
        if (dep === key) continue;

        // Owner schon (explizit oder per Default) an? Dann nichts zu tun.
        if (isDaemonEnabled(ns, dep, state)) continue;
        // Regel: explizites AUS (state 0) des Owners gewinnt — Spieler will ihn nicht.
        if (state[dep] === 0) continue;

        // Owner mitstarten (state 1 = an). setDaemonEnabled persistiert; state-Objekt
        // lokal nachziehen, damit shouldRun im selben Takt schon greift.
        setDaemonEnabled(ns, dep, 1);
        state[dep] = 1;
        ns.print(`AUTOSTART: ${key} ist an -> Owner ${dep} mitgestartet (Abhängigkeit).`);
    }
}

/**
 * Reservierungen berechnen UND Hosts festlegen — in EINEM Durchgang.
 * Das ist der Kern des Bugfixes: derselbe pickHost-Aufruf liefert den Host, der
 * reserviert wird, und den Host, auf dem gleich deployt wird.
 *
 * @returns {{reservations:Object<string,number>, plan:Array<{key:string, host:string, need:number}>}}
 */
function planDeployments(ns, caps, state, ramMap) {
    const reservations = {};
    const plan = [];

    for (const key of Object.keys(DAEMONS)) {
        const d = DAEMONS[key];

        // Laufende Daemons: ihren RAM weiter reservieren, damit der Dispatcher
        // beim Neustart des Hosts nicht draufballert.
        if (alive(ns, key)) {
            const e = S.pids[key];
            const need = (d.minRam || 2) + (d.burst || 0);
            reservations[e.host] = (reservations[e.host] || 0) + need;
            delete S.reserveSince[key];
            continue;
        }
        if (inGrace(key)) continue;
        // v6.2: RESET ist von der Pause AUSGENOMMEN. PRE_RESET setzt S.paused, damit
        // nichts Neues mehr anlaeuft — genau dann muss aber der RESET-One-Shot noch
        // deployt werden koennen, sonst blockiert die Pause die Aktion, die sie
        // ausgeloest hat. Alles andere bleibt gesperrt.
        if (S.paused && key !== "RESET") continue;
        if (!shouldRun(ns, key, caps, state)) { delete S.reserveSince[key]; continue; }

        const need = (d.minRam || 2) + (d.burst || 0);
        const host = pickHost(ns, key, ramMap);
        if (!host) {
            // ====================================================================
            // BUGFIX v6.3 — RESERVIERUNGS-DEADLOCK
            // ====================================================================
            // Bisher stand hier ein blankes "continue" mit der Begruendung, eine
            // Reservierung ohne Zielhost sei sinnlos. Das war der Denkfehler:
            // pickHost() verlangt "r.free >= need", also JETZT schon freien Platz.
            // Der Dispatcher fuellt den Pool aber bewusst bis an den Rand. Ein
            // Daemon, der bei vollem Pool NEU eingeschaltet wird, findet damit nie
            // Platz — und weil nichts reserviert wurde, bekommt der Dispatcher auch
            // nie den Auftrag zu raeumen. Endlosschleife: der Daemon blieb im
            // Dashboard dauerhaft gelb ("startet…").
            //
            // Betroffen war ausschliesslich der Neustart bei vollem Pool; laufende
            // Daemons halten ihre Reservierung ueber den Zweig ganz oben.
            //
            // JETZT: Zielhost fuer eine ABSICHTSERKLAERUNG waehlen (reserveTarget)
            // und dort reservieren, den Daemon aber NICHT starten. Der Dispatcher
            // zieht die Reservierung passiv vom Pool ab (v10, keine Kills mehr) und
            // da seine Worker seit v10 One-Shots sind, laeuft der reservierte Platz
            // innerhalb einer Worker-Laufzeit von selbst leer. Im naechsten Takt
            // findet pickHost regulaer Platz und der Start laeuft normal.
            const target = reserveTarget(ns, key, ramMap, reservations);
            if (!target) {
                // Kein Host der Welt ist gross genug (max < need) -> nichts zu holen.
                delete S.reserveSince[key];
                noteBlocked(ns, key, "kein Host mit genug Gesamt-RAM (" + need + " GB)");
                continue;
            }
            if (!S.reserveSince[key]) S.reserveSince[key] = Date.now();
            if (Date.now() - S.reserveSince[key] > RESERVE_DEADLINE_MS) {
                // Frist abgelaufen: die Reservierung fallen lassen, damit ein
                // unmoeglicher Daemon nicht dauerhaft RAM des Schwarms blockiert.
                delete S.reserveSince[key];
                noteBlocked(ns, key, "Reservierung auf " + target + " blieb "
                    + Math.round(RESERVE_DEADLINE_MS / 1000) + " s erfolglos — verworfen");
                continue;
            }
            reservations[target] = (reservations[target] || 0) + need;
            noteBlocked(ns, key, "wartet auf RAM @ " + target + " (" + need + " GB reserviert)");
            continue;
        }
        reservations[host] = (reservations[host] || 0) + need;
        if (!S.reserveSince[key]) S.reserveSince[key] = Date.now();
        plan.push({ key, host, need });
    }
    return { reservations, plan };
}

/**
 * Zielhost fuer eine Reservierung, wenn AKTUELL nirgends Platz ist.
 *
 * Unterschied zu pickHost(): dort zaehlt r.free (jetzt frei), hier r.max
 * (ueberhaupt gross genug). Gesucht wird der Host, auf dem der Daemin nach dem
 * Raeumen durch den Dispatcher laufen KANN.
 *
 * BUDGET je Host: es wird nie mehr reserviert als (max - bereits reserviert),
 * bei home zusaetzlich abzueglich homeReserve. Damit kann die Summe der
 * Reservierungen den Host nicht ueberzeichnen — der Dispatcher wuerde sonst
 * einen Host komplett stilllegen.
 *
 * Weil planDeployments die Registry SEQUENZIELL abarbeitet, bedient dieses
 * Budget automatisch die Reihenfolge der Registry: wer weiter oben steht,
 * bekommt seinen Platz zuerst. INFIL steht bewusst als LETZTER Eintrag und
 * wird deshalb erst bedient, wenn alle Dauerdaemons versorgt sind.
 *
 * @returns {string|null}
 */
function reserveTarget(ns, key, ramMap, reservations) {
    const d = DAEMONS[key];
    if (!d) return null;
    const need = (d.minRam || 2) + (d.burst || 0);
    const budget = (h) => {
        const r = ramMap[h];
        if (!r) return -1;
        const base = h === "home" ? r.max - homeReserve(ns) : r.max;
        return base - (reservations[h] || 0);
    };

    if (d.pinHost) return budget(d.pinHost) >= need ? d.pinHost : null;

    const fits = (list) => list.filter((h) => budget(h) >= need)
        .sort((a, b) => budget(b) - budget(a));

    const all = Object.keys(ramMap);
    const pservs = fits(all.filter((h) => h.startsWith(PSERV_PREFIX)));
    if (pservs.length) return pservs[0];
    const others = fits(all.filter((h) => h !== "home" && !h.startsWith(PSERV_PREFIX)));
    if (others.length) return others[0];
    return budget("home") >= need ? "home" : null;
}

/**
 * Einmalige Begruendung ins Log, warum ein Daemon nicht startet. Wiederholt sich
 * die Begruendung, bleibt es still — sonst flutet der Takt das Log.
 */
function noteBlocked(ns, key, why) {
    if (S.blockedWhy[key] === why) return;
    S.blockedWhy[key] = why;
    ns.print(`WARTET ${key}: ${why}.`);
}

/**
 * Schalterstand lesen UND heilen (v6.4).
 *
 * Die State-Datei ist die einzige Wahrheit ueber An/Aus — und sie ist eine
 * einfache Textdatei, die jeder Prozess ueberschreiben kann. Ein fremder
 * Schreiber, der sie als Read-Modify-Write anfasst und dabei einen leeren oder
 * halben Lesewert erwischt, loescht die Eintraege ALLER anderen Daemons.
 *
 * Das ist nicht theoretisch: BANK, WORK, CORP, DARKNET, GO, DIAG und INFIL sind
 * alle "defaultOff". Fehlt ihr Eintrag, gelten sie sofort als AUS, und die Queen
 * beendet sie im naechsten Takt — reihenweise, ohne dass jemand etwas geklickt
 * hat. Genau so sah es aus, als sich BANK "zusammen mit INFIL" beendete.
 *
 * Diese Funktion vergleicht deshalb den frischen Lesewert mit dem Spiegel des
 * letzten Takts. Sind Schluessel verschwunden, die vorher da waren, werden sie
 * zurueckgeschrieben und die Sache landet laut im Log. Ein bewusstes Ausschalten
 * geht immer ueber setDaemonEnabled und aktualisiert den Spiegel mit — echte
 * Aenderungen werden also nicht "geheilt".
 *
 * @returns {object} Schalterstand
 */
function readStateHealed(ns) {
    let cur = {};
    try { cur = readManagedState(ns) || {}; } catch (e) { cur = {}; }

    const mirror = S.stateMirror;
    if (mirror) {
        const lost = Object.keys(mirror).filter((k) => !(k in cur));
        if (lost.length > 0) {
            for (const k of lost) {
                cur[k] = mirror[k];
                try { setDaemonEnabled(ns, k, mirror[k]); } catch (e) { /* naechster Takt */ }
            }
            ns.print(`STATE-WIEDERHERSTELLUNG: ${lost.join(", ")} waren aus der Schalterdatei `
                + `verschwunden und wurden zurueckgeschrieben. Fremder Schreiber?`);
        }
    }
    S.stateMirror = Object.assign({}, cur);
    return cur;
}

/** Payload materialisieren (falls nötig) und starten. */
function launch(ns, key, host) {
    const d = DAEMONS[key];
    try {
        if (d.payload) {
            // Payload-Daemon: Quelle liegt kodiert in SCHWARM-PAYLOADS.js.
            // materialize() schreibt sie auf den LAUF-HOST der Queen; deployDaemon
            // scp't sie von dort zum Ziel (host-agnostisch seit HELPERS v3.0).
            if (!materialize(ns, d.payload)) {
                ns.print(`START ${key}: materialize(${d.payload}) fehlgeschlagen.`);
                return 0;
            }
        }
        const pid = deployDaemon(ns, key, host);
        if (pid > 0) {
            // v7.2: Stempel des Codes festhalten, mit dem dieser Prozess startet.
            // Ab hier ist er unveraenderlich — ein laufendes Skript behaelt
            // seinen Code, auch wenn die Datei darunter neu geschrieben wird.
            // v7.2.3 — DERSELBE STEMPEL BEIM START WIE BEIM VERGLEICH.
            //
            // Hier stand payloadStamp(...), verglichen wurde aber mit
            // daemonStamp(...) — und das umhuellt den Payload-Stempel seit
            // v7.2.2 mit stampText() und haengt die deps an. Zwei verschiedene
            // Zeichenketten fuer dieselbe Sache: der Vergleich schlug IMMER an,
            // und jeder laufende Payload-Daemon wurde alle DRIFT_MS beendet und
            // neu gestartet. Live sichtbar an GO und TRADER, PID-Wechsel im
            // 20-Sekunden-Takt.
            //
            // Es gibt jetzt nur noch EINE Funktion, die einen Stempel bildet.
            // Nebenbei behoben: fuer Datei-Daemons wurde beim Start gar nichts
            // aufgeschrieben — sie liefen bis zum ersten Nachtragen ungeprueft.
            {
                const st = daemonStamp(ns, d);
                if (st) S.payloadStamp[key] = st; else delete S.payloadStamp[key];
            }
            S.pids[key] = { pid, host, started: Date.now() };
            delete S.reserveSince[key];
            delete S.blockedWhy[key];   // v6.3: Grund ist erledigt
            // One-Shot (AUGS): WANT verbrauchen, sonst startet die Queen den Daemon
            // nach jedem Selbst-Ende sofort neu, bis der TTL abläuft.
            if (d.oneshotDaemon) delete S.wants[key];
            ns.print(`START ${key} -> ${host} (PID ${pid})`);
        }
        return pid;
    } catch (e) {
        ns.print(`START ${key}: Ausnahme: ${e}`);
        return 0;
    }
}

/** DROP / Dashboard-STOP: laufenden Daemon beenden. */
function stop(ns, key, why) {
    const e = S.pids[key];
    if (e && e.pid) { try { ns.kill(e.pid); } catch (err) { /* schon tot */ } }
    delete S.pids[key];
    delete S.reserveSince[key];
    delete S.payloadStamp[key];   // v7.2: Stempel gehoert zum Prozess, nicht zum Daemon
    ns.print(`STOP ${key} (${why})`);
}

// ===========================================================================
// v7.2 — EIN LAUFENDER DAEMON MERKT NICHT, DASS SEIN CODE SICH GEAENDERT HAT
// ===========================================================================
// Bitburner uebersetzt ein Skript beim Start. Wird die Datei danach neu
// geschrieben, laeuft der bereits gestartete Prozess UNVERAENDERT weiter —
// Script.ts:52 (invalidateModule) wirft nur das uebersetzte Modul fuer KUENFTIGE
// Starts weg. Ein Push aendert also die Datei und sonst nichts.
//
// Live aufgefallen: nach dem Einspielen von TRADER v1.6 handelte der Daemon
// weiter nach v1.5, bis er von Hand aus- und wieder eingeschaltet wurde. Das
// betrifft JEDE kuenftige Nutzlast-Aenderung und ist genau die Art Fehler, die
// niemand bemerkt: es sieht so aus, als waere die neue Fassung aktiv.
//
// Die Queen ist der einzige Deployer und weiss deshalb als Einzige, mit welchem
// Code ein Prozess gestartet wurde. Sie haelt den Stempel fest und vergleicht.
//
// AUSDRUECKLICH AUSGENOMMEN sind One-Shots (AUGS, RESET, SCAN, STANEK). Sie tun
// genau eine Sache und beenden sich; ein Neustart wuerde diese Sache ein zweites
// Mal ausloesen — bei RESET waere das ein zweiter Augmentation-Install.
//
// Fehlt ein Stempel (Queen frisch gestartet, Daemon uebernommen), wird er
// stillschweigend nachgetragen statt einen Neustart auszuloesen. Der Fall ist
// harmlos: nach einem Aug-Reset startet ohnehin alles neu, und ein
// Neustart-Sturm beim Hochlauf der Queen waere schlimmer als ein verpasster.
/** Stempel ueber beliebigen Text — dieselbe Rechnung wie PAYLOADS.payloadStamp. */
function stampText(s) {
    if (typeof s !== "string" || s.length === 0) return null;
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
    return s.length + ":" + h.toString(36);
}

// ===========================================================================
// v7.16 — UEBERGABE DER START-STEMPEL AN DIE NAECHSTE QUEEN
// ===========================================================================
// Die Stempel gehoeren zum PROZESS und lebten nur im Speicher dieser Queen.
// Nach der Selbst-Erneuerung wusste die neue Queen nicht, mit welchem Code
// die uebernommenen Prozesse laufen, und trug den aktuellen ein - genau der
// Wechsel, der die Erneuerung ausgeloest hatte, galt damit als erledigt.
// Die alte Queen schreibt ihre Stempel deshalb direkt vor dem spawn in eine
// Datei; die neue liest sie beim Kaltstart genau einmal. Nur frisch (2 min)
// und nur bei gleicher PID - nach einem Neuladen des Spiels beginnen die
// PIDs von vorn, eine alte Datei darf dort nichts behaupten.
const UEBERGABE_DATEI = "schwarm-queen-uebergabe.txt";
const UEBERGABE_MAX_MS = 120000;

function uebergabeSchreiben(ns) {
    try {
        const pids = {};
        for (const [k, e] of Object.entries(S.pids)) if (e && e.pid) pids[k] = e.pid;
        ns.write(UEBERGABE_DATEI, JSON.stringify({ ts: Date.now(), stempel: S.payloadStamp, pids }), "w");
    } catch (e) { /* ohne Uebergabe greift der Rueckfall in checkPayloadDrift */ }
}

/** @returns {number} Zahl der uebernommenen Stempel */
function uebergabeLesen(ns) {
    let n = 0;
    try {
        const roh = ns.read(UEBERGABE_DATEI) || "";
        if (!roh) return 0;
        ns.write(UEBERGABE_DATEI, "", "w");        // Einmalgebrauch (ns.rm kostet RAM)
        const u = JSON.parse(roh);
        if (!u || Date.now() - Number(u.ts || 0) > UEBERGABE_MAX_MS) return 0;
        const stempel = u.stempel || {};
        for (const [k, pid] of Object.entries(u.pids || {})) {
            const e = S.pids[k];
            const st = stempel[k];
            if (e && e.pid === pid && typeof st === "string" && st) { S.payloadStamp[k] = st; n++; }
        }
    } catch (e) { /* kaputte Uebergabe -> wie ohne */ }
    return n;
}

/**
 * Stempel der Quelle, aus der ein Daemon startet.
 *
 * v7.2.1: Nicht nur Payload-Daemons. BANK, WORK, DISPATCHER, INFO und die
 * uebrigen liegen als GEWOEHNLICHE Dateien auf home und werden per scp verteilt
 * — fuer sie gilt dieselbe Traegheit: ein Push aendert die Datei, der laufende
 * Prozess behaelt seinen Code. Genau das ist beim Einspielen von BANK v4.9
 * aufgefallen, unmittelbar nachdem der Waechter fuer Payloads fertig war.
 *
 * Gelesen wird die Datei auf home, also dort, wo die Queen laeuft und von wo
 * aus deployDaemon sie kopiert. Das ist die Quelle, die beim naechsten Start
 * wirksam wird.
 */
function daemonStamp(ns, d) {
    // =====================================================================
    // v7.2.2 — DIE ABHAENGIGKEITEN GEHOEREN IN DEN STEMPEL
    // =====================================================================
    // v7.2.1 stempelte nur die EIGENE Datei des Daemons. Ein Skript hat seine
    // Importe aber fest einkompiliert: Script.invalidateModule() verwirft das
    // uebersetzte Modul nur fuer KUENFTIGE Starts, der laufende Prozess behaelt
    // seinen Stand — samt der alten Fassung von SCHWARM-HELPERS.js.
    //
    // Dreizehn Daemons fuehren deps: ["SCHWARM-HELPERS.js"]. Eine Aenderung
    // dort loeste deshalb KEINEN Neustart aus, und die neue Fassung lag
    // wirkungslos auf der Platte.
    //
    // Live aufgefallen: BANK kaufte in BN8 weiter Level- und Cache-Ausbau,
    // obwohl HELPERS v4.6 die BN8-Erkennung (computeHashesWorthless) laengst
    // enthielt. Der laufende BANK-Prozess hatte schlicht die alte HELPERS.
    //
    // Jetzt fliessen alle deps in den Stempel ein. Aendert sich eine gemeinsame
    // Bibliothek, starten alle Daemons neu, die sie benutzen — genau einmal,
    // weil der Stempel danach wieder stimmt.
    let text = "";
    if (d.payload) {
        const p = payloadStamp(ns, d.payload);
        if (!p) return null;
        text = p;
    } else {
        try { text = ns.read(d.file) || ""; } catch (e) { return null; }
        if (!text) return null;
    }
    for (const dep of (Array.isArray(d.deps) ? d.deps : [])) {
        try { text += "|" + dep + "|" + (ns.read(dep) || ""); } catch (e) { /* fehlt -> zaehlt als leer */ }
    }
    return stampText(text);
}

function checkPayloadDrift(ns) {
    if (S.paused) return;                       // vor einem Reset nichts anfassen
    const now = Date.now();
    if (now - S.lastDriftCheck < CFG.DRIFT_MS) return;
    S.lastDriftCheck = now;

    for (const key of Object.keys(DAEMONS)) {
        const d = DAEMONS[key];
        if (!d || d.oneshotDaemon) continue;
        if (!d.payload && !d.file) continue;
        // alive() stuetzt sich auf S.pids — also auf das, was DIESE Queen
        // gestartet hat. Fremdgestartete Prozesse werden dadurch gar nicht
        // erst angefasst; die Queen beendet nichts, was ihr nicht gehoert.
        if (!alive(ns, key)) continue;

        const jetzt = daemonStamp(ns, d);
        if (!jetzt) continue;                   // nicht ermittelbar -> nichts behaupten
        const beimStart = S.payloadStamp[key];
        if (!beimStart) {
            // v7.16 — RUECKFALL OHNE UEBERGABE, NUR FUER NUTZLASTEN.
            // materialize() schreibt die Datei auf home vor JEDEM Start; sie ist
            // also der Code des laufenden Prozesses. Weicht sie vom aktuellen
            // Code ab, laeuft dort alter - dann EINMAL neu starten, statt den
            // neuen Stempel blind nachzutragen. Datei-Daemons lassen sich so
            // nicht pruefen (die Datei ist schon neu); fuer sie gibt es die
            // Uebergabe.
            if (d.payload && d.file) {
                let datei = "";
                try { datei = ns.read(d.file) || ""; } catch (e) { datei = ""; }
                const aufPlatte = stampText(datei);
                const soll = payloadStamp(ns, d.payload);
                if (aufPlatte && soll && aufPlatte !== soll) {
                    ns.print(`NEUSTART ${key}: uebernommen mit ALTER Nutzlast (${d.file} auf home weicht vom Code ab).`);
                    announce(ns, "info", `${key} neu gestartet — lief nach der Uebernahme mit alter Nutzlast.`);
                    stop(ns, key, "alte Nutzlast nach Uebernahme");
                    continue;
                }
            }
            S.payloadStamp[key] = jetzt;   // nachtragen
            continue;
        }
        if (beimStart === jetzt) continue;

        // Ab hier steht fest: der laufende Prozess hat alten Code.
        // Die Datei wird beim naechsten launch() ohnehin neu materialisiert;
        // hier nur beenden. Den Neustart macht der normale Weg im selben oder
        // naechsten Takt — Schalterstand und WANT entscheiden weiter darueber,
        // OB er laufen soll. Damit kann diese Funktion nichts starten, was
        // sonst nicht starten wuerde.
        ns.print(`NEUSTART ${key}: Quelle geaendert (${beimStart} -> ${jetzt}).`);
        announce(ns, "info", `${key} neu gestartet — ${d.payload ? "Nutzlast " + d.payload : d.file} hat sich geaendert.`);
        stop(ns, key, "Quelle geaendert");
    }
}

/**
 * RESET-ZYKLUS (v6.2). BANK meldet auf Port 19, dass ein Aug-Install faellig ist
 * (>= 5 gekaufte Spieler-Augs, Ruhe-Fenster abgelaufen, kein Grafting). Die Queen
 * fuehrt ihn NICHT selbst aus: installAugmentations toetet das aufrufende Skript
 * (Singularity.ts:208) — sie wuerde ihr eigenes Grab schaufeln. Stattdessen:
 *
 *   1. PAUSE (S.paused = true) — es wird nichts Neues mehr gestartet. Der laufende
 *      Betrieb bleibt an; der Install beendet ohnehin gleich alles.
 *   2. Ein WANT fuer den RESET-One-Shot setzen. Der laeuft ueber den NORMALEN
 *      Deploy-Pfad (Reservierung -> Dispatcher macht Platz -> exec auf home) und
 *      ruft installAugmentations("SCHWARM-GENESIS.js").
 *
 * Der One-Shot prueft selbst nochmal alles (Grafting, Callback vorhanden, RAM auf
 * home, Warteschlange nicht leer) und bricht lieber ab, als einen Reset ohne
 * Neustart auszuloesen. Zwischen BANKs Meldung und dem Start liegen Sekunden —
 * diese zweite Pruefung ist absichtlich redundant.
 *
 * WICHTIG: S.paused verhindert normale Starts. Der RESET-One-Shot ist davon
 * ausgenommen, sonst koennte die Pause ihn selbst blockieren.
 */
function handleResetCycle(ns) {
    if (!DAEMONS.RESET) return;                  // Registry-Eintrag fehlt -> Funktion aus

    // v7.1: Pause aufheben UND die Phase zurueckdrehen. Bis v7.0 blieb die
    // Phase auf PRE_RESET stehen, auch wenn die Pause laengst gefallen war —
    // das Dashboard meldete dann dauerhaft "Install steht bevor", obwohl
    // nichts bevorstand.
    const pauseLoesen = (grund) => {
        S.resetPending = false;
        S.paused = false;
        delete S.wants.RESET;
        try {
            if (getPhase(ns) === PHASE.PRE_RESET) setPhase(ns, S.phaseVorReset || PHASE.SWARM);
        } catch (e) { /* Anzeige, nicht kritisch */ }
        announce(ns, "info", grund);
    };

    // =====================================================================
    // v7.1 — DIE PAUSE BRAUCHT EINEN ERREICHBAREN AUSGANG.
    // =====================================================================
    // PRE_RESET haelt JEDEN Start an ausser RESET (siehe :500). Steht der
    // RESET-Schalter aber auf AUS, laesst shouldRun() ihn nie durch — und die
    // Pause endet nie. Der Schwarm friert stumm ein.
    //
    // Live beobachtet am 05.09.2026: TRADER und INFIL blieben gelb ("an, aber
    // kein Prozess"), STANEK meldete Fehler, und im Dashboard stand dauerhaft
    // "PRE_RESET — Install steht bevor". BANK hatte Reset-Bereitschaft
    // gemeldet, die Queen hatte pausiert, und RESET war aus.
    //
    // Der Schalter auf AUS heisst: der Spieler will diese Runde weiterspielen.
    // Dann darf die Queen gar nicht erst pausieren, und eine schon laufende
    // Pause muss fallen. Dieselbe Luecke gab es in SCHWARM-BANK.js (v4.5) —
    // ein Zustand, der den Betrieb einfriert, braucht immer die Pruefung, ob
    // sein Ausgang ueberhaupt offen ist.
    if (!isDaemonEnabled(ns, "RESET")) {
        if (S.resetPending) pauseLoesen("RESET steht auf aus — Pause aufgehoben, Betrieb laeuft weiter.");
        return;
    }

    const order = readResetReady(ns);
    if (!order) {
        // Meldung zurueckgezogen (z. B. Grafting startete): Pause aufheben, damit der
        // Schwarm nicht stumm eingefroren bleibt.
        if (S.resetPending) pauseLoesen("Reset-Meldung zurueckgezogen — Betrieb laeuft weiter.");
        return;
    }
    if (S.resetPending) return;                  // laeuft schon
    S.resetPending = true;
    S.paused = true;
    S.phaseVorReset = getPhase(ns) || PHASE.SWARM;   // fuer den Rueckweg merken
    setPhase(ns, PHASE.PRE_RESET);
    announce(ns, "stop", `PRE_RESET — Aug-Install faellig (${order.count} Augs). Starte RESET-One-Shot.`);
    S.wants.RESET = Date.now();                  // wird im normalen Takt deployt
}

/**
 * Dashboard-Befehle abarbeiten.
 *
 * v6.5: Die Befehle kommen NICHT mehr aus einem eigenen Leser. Seit dem
 * Postfach-Modell teilen sich Kommandos (Dashboard) und WANT/DROP (Owner)
 * denselben Eingang — Port 2, QUEEN_IN. Zwei Leser auf einer FIFO wuerden sich
 * gegenseitig Nachrichten wegnehmen, je nachdem wer im Takt zuerst drankommt.
 * Deshalb leert drainQueenInbox() den Eingang EINMAL und sortiert; diese
 * Funktion bekommt nur noch die fertig aussortierten Kommandos.
 *
 * @param {NS} ns
 * @param {Array<{verb:string, arg:string}>} cmds  aus drainQueenInbox().
 */
function handleCommands(ns, cmds) {
    // v12.0: Ernte-Meldungen werden je Host GESAMMELT, nicht einzeln abgearbeitet.
    // Der Dispatcher kann in einem Takt mehrere Gruende fuer denselben Host haben
    // (veraltetes Ziel UND Polster-Mangel); getrennt ausgefuehrt wuerde der zweite
    // Aufruf auf einen bereits geernteten Host treffen und zuviel toeten.
    const reap = new Map();
    for (const { verb, arg } of cmds) {
        if (verb === "REAP") {
            // v12.2: "REAP:<host>|<threads>|<ziel>". Das dritte Feld sagt, WELCHE
            // Dauerlaeufer gemeint sind — ohne es hat die Queen die falschen
            // getoetet (Begruendung und Livebeleg bei reapXpLong in HELPERS).
            // Eine Meldung ohne drittes Feld stammt aus einer aelteren
            // Dispatcher-Instanz und gilt als "egal welches".
            const teile = arg.split("|");
            if (teile.length < 2) continue;
            const host = teile[0];
            const thr = Number(teile[1]);
            const ziel = teile.length >= 3 && teile[2] ? teile[2] : "*";
            if (!host || !Number.isFinite(thr) || thr <= 0) continue;
            // Je (Host, Ziel) EIN Eintrag. Zwei Meldungen fuer denselben Host,
            // aber verschiedene Ziele, sind zwei verschiedene Auftraege und
            // duerfen sich nicht gegenseitig ueberschreiben.
            const key = host + " " + ziel;
            reap.set(key, Math.max(reap.get(key) || 0, thr));
            continue;
        }
        if (verb === "PRE_RESET") {
            S.paused = true;
            announce(ns, "stop", "PRE_RESET — starte nichts Neues mehr.");
        } else if (verb === "RESUME") {
            S.paused = false;
            S.wants = {};                       // Owner melden sich neu
            markTopoDirty(ns, "resume");
            ns.print("RESUME — Betrieb wieder aufgenommen.");
        } else if (verb === "STOP" && arg && DAEMONS[arg]) {
            // BUGFIX (v6.1): DER SCHALTER MUSS PERSISTIERT WERDEN.
            //   Vorher wurde nur der Prozess gekillt. Im nächsten Takt fragte
            //   shouldRun() -> isDaemonEnabled() -> las die State-Datei, fand dort
            //   NICHTS (es gab in der ganzen Codebasis keinen Schreiber!) und nahm
            //   den Registry-Default "an". Der Daemon startete sofort wieder.
            //   Aus-Schalten war schlicht unmöglich.
            setDaemonEnabled(ns, arg, 0);
            delete S.wants[arg];
            stop(ns, arg, "Dashboard-STOP");

        } else if (verb === "START" && arg && DAEMONS[arg]) {
            // Wieder freigeben. Gestartet wird im normalen Takt (mit Reservierung),
            // bzw. sofort, wenn der Owner ein WANT anliegen hat.
            setDaemonEnabled(ns, arg, 1);
            ns.print(`START ${arg} freigegeben (Dashboard).`);

        } else if (verb === "FORCE" && arg && DAEMONS[arg]) {
            // Sofortstart erzwingen: Schalter auf 2 (Override — startet auch ohne WANT).
            setDaemonEnabled(ns, arg, 2);
            if (!alive(ns, arg)) {
                const host = pickHost(ns, arg, buildRamMapFast(ns, true));
                if (host) launch(ns, arg, host);
                else ns.print(`FORCE ${arg}: kein Host mit Platz — starte im nächsten Takt.`);
            }
        }
    }

    // ---- v12.0: die gesammelten Ernten ausfuehren ----
    // Getoetet wird ausschliesslich schwarm-wl.js (reapXpLong filtert danach) —
    // nie ein One-Shot, nie ein Daemon, nie CORE-Arbeit. Der Dispatcher fuellt im
    // naechsten Takt nach, sofern der Platz dann noch frei ist.
    if (reap.size) {
        let auftraege = 0, thr = 0;
        for (const [key, want] of reap) {
            const [host, ziel] = key.split(" ");
            const r = reapXpLong(ns, host, want, ziel);
            if (r.threads > 0) { auftraege++; thr += r.threads; }
            else ns.print(`ERNTE ${host}: ${want} thr fuer Ziel "${ziel}" angefordert, `
                + `aber nichts gefunden — laeuft dort wirklich schwarm-wl.js mit diesem Ziel?`);
        }
        if (thr > 0) ns.print(`ERNTE: ${thr} XP-Threads aus ${auftraege} Auftrag/Auftraegen (Meldung vom Dispatcher).`);
    }
}


/**
 * v12.0 — ERNTE FUER EIGENE RESERVIERUNGEN.
 *
 * WARUM ES DIESE FUNKTION GEBEN MUSS. Der Dispatcher behandelt eine
 * Queen-Reservierung PASSIV: er zieht den Platz vom Pool ab und fuellt ihn nicht
 * nach (v10, "SPERRLISTE statt KILLS"). Das genuegte, solange jeder Worker ein
 * One-Shot war — der reservierte Platz lief innerhalb einer Worker-Laufzeit von
 * selbst leer. Der XP-Dauerlaeufer (schwarm-wl.js) laeuft nicht aus. Ohne diese
 * Funktion wartet die Queen RESERVE_HOLD_MS, verwirft die Reservierung, plant
 * neu — und trifft denselben Zustand. Der Daemon startet nie.
 *
 * WARUM DIE QUEEN UND NICHT DER DISPATCHER. Es gibt zwei Bewerber um dasselbe
 * RAM: der Dispatcher (h/w/g) und die Queen (Daemons). Wuerde der Dispatcher
 * selbst ernten, erntete er nur fuer den eigenen Bedarf; die Queen saehe den
 * Platz nie. Ein Toeter, zwei Melder — die zweite Meldung ist der REAP-Befehl
 * des Dispatchers (siehe handleCommands).
 *
 * KARENZ. Geerntet wird erst, wenn die Reservierung REAP_GRACE_MS lang stand,
 * ohne dass der Platz frei wurde. Sofortiges Ernten waere ein Wettlauf: der
 * Dispatcher hat die Reservierung im ersten Takt noch nicht gelesen und fuellt
 * den Host im selben Moment wieder auf.
 *
 * @param {NS} ns
 * @param {Object<string, number>} reservations  Host -> reservierte GB (dieser Takt)
 * @param {Object<string, {max:number, used:number, free:number}>} ramMap
 */
function reapForReservations(ns, reservations, ramMap) {
    const now = Date.now();
    // Hosts ohne Reservierung vergessen — sonst zaehlt eine alte Frist weiter.
    for (const h of Object.keys(S.reapSince)) if (!reservations[h]) delete S.reapSince[h];

    for (const host of Object.keys(reservations)) {
        const need = reservations[host];
        const r = ramMap[host];
        if (!r || !(need > 0)) continue;
        // Dieselbe Quelle wie im Deploy-Zweig: home traegt zusaetzlich das
        // Eigenbedarfs-Polster, das nie verplant werden darf.
        const frei = host === "home" ? r.free - homeReserve(ns) : r.free;
        if (frei >= need) { delete S.reapSince[host]; continue; }
        if (!S.reapSince[host]) { S.reapSince[host] = now; continue; }
        if (now - S.reapSince[host] < CFG.REAP_GRACE_MS) continue;

        // RAM je Thread auf DIESEM Host messen. Der Wert kann sich je Host
        // unterscheiden, wenn dort eine aeltere Kopie der Datei liegt.
        let per = 0;
        try { per = ns.getScriptRam(XP_LONG_WORKER, host); } catch (e) { per = 0; }
        if (!(per > 0)) continue;          // keine Dauerlaeufer-Datei -> nichts zu holen

        const fehlt = need - frei;
        const res = reapXpLong(ns, host, Math.ceil(fehlt / per));
        if (res.threads > 0) {
            // Frist neu setzen: der naechste Takt misst, ob es gereicht hat.
            S.reapSince[host] = now;
            ns.print(`ERNTE ${host}: ${res.threads} XP-Threads (${res.killed} Prozesse) `
                + `fuer ${formatRam(fehlt)} Reservierung.`);
        }
    }
}

/**
 * v6.6 — STANEK NACHLADEN, WENN DER POOL GEWACHSEN IST.
 *
 * Warum die Queen und nicht STANEK selbst: der Payload kann sich nur
 * nachruesten, solange sein Prozess laeuft. Er schaltet sich nach der Ladung
 * aber ab (oneshotDaemon), und nach einem killall ist er endgueltig weg. Wer
 * ihn zurueckholt, muss von aussen kommen — und das ist die Queen, der er
 * gehoert (DAEMONS.STANEK.owner === "QUEEN").
 *
 * Gerechnet wird je EINZELHOST, nicht ueber die Poolsumme — die Ladestaerke
 * ist die Threadzahl EINES Skripts auf EINEM Host (Stanek.ts:53). Dieselben
 * Konstanten wie in STANEKs pickHost (Spiegel oben in CFG): home ueber
 * free x 0.75 mit 64 GB Reserve, jeder Fremdhost ueber maxRam x 0.98 mit
 * 8 GB Reserve. Fremdhosts duerfen mit maxRam rechnen, weil der Dispatcher
 * sie fuer die Ladung freiraeumt.
 *
 * @param {NS} ns
 * @param {Object<string, {max:number, used:number, free:number}>} ramMap
 */
function checkStanekRecharge(ns, ramMap) {
    const now = Date.now();
    if (now - S.lastStanekCheck < CFG.STANEK_CHECK_MS) return;
    S.lastStanekCheck = now;

    // v6.7: JEDER Ausstieg traegt einen Grund.
    //
    // Bis v6.6 sprangen hier SECHS Stellen still zurueck. Im Lagebild stand
    // Bericht fuer Bericht "STANEK laedt mit Threadstaerke 480, im Pool waeren
    // 1946 frei" — also Faktor 4 ueber der Schwelle 3 — und trotzdem passierte
    // nichts. Aus dem Quelltext allein ist nicht zu sehen, WELCHE der sechs
    // Stellen greift; jede liefert dasselbe Schweigen. Also nicht weiter raten:
    // der Grund wird vermerkt und bei AENDERUNG einmal gemeldet (nicht jede
    // Minute, sonst flutet es das Log).
    const raus = (grund) => {
        if (S.stanekGrund !== grund) {
            S.stanekGrund = grund;
            ns.print("STANEK-Nachladung: " + grund + ".");
        }
    };

    try {
        if (!DAEMONS.STANEK) return raus("Daemon STANEK ist nicht registriert");
        if (alive(ns, "STANEK")) return raus("laeuft gerade — nichts zu tun");

        const raw = ns.peek(SCHWARM_PORTS.STANEK_OUT);
        if (!raw || raw === "NULL PORT DATA") {
            return raus("keine Meldung auf Port " + SCHWARM_PORTS.STANEK_OUT
                + " — STANEK lief in diesem Lauf noch nie");
        }
        let st = null;
        try { st = JSON.parse(String(raw)); } catch (e) { return raus("Meldung unlesbar: " + e); }
        if (!st) return raus("Meldung leer");
        if (st.state !== "fertig") return raus('Zustand "' + st.state + '" statt "fertig"');

        const hs = Number(st.threadStaerke);
        if (!isFinite(hs) || hs <= 0) return raus("Threadstaerke unbrauchbar: " + st.threadStaerke);

        // =================================================================
        // v6.8 — DIE QUEEN RECHNET JETZT SO WIE STANEK ENTSCHEIDET
        // =================================================================
        // Hier stand die Summe des GANZEN Pools:
        //     moeglich = floor(freiGb * 0.75 / 2)
        // Live ergab das "der Pool gibt rund 154899 her (Faktor 25.2)" — und
        // STANEK beendete sich danach in Millisekunden, ohne ein Wort.
        //
        // Der Grund liegt in der Engine: die Ladestaerke ist die Threadzahl
        // EINES Skripts (Stanek.ts:53, scriptRef.threads * coreBonus), und die
        // Threads eines Skripts liegen immer auf EINEM Host. Der Pool als Ganzes
        // ist also die falsche Bezugsgroesse. STANEKs pickHost rechnet je Host
        //     budget  = min(frei - 64, maxRam * 0.75)
        //     threads = min(32768, budget / 2)
        // ueber home und die gekauften Server. Bei 413 TB Pool, aber keinem
        // EINZELNEN Host mit 36,9 TB frei, hat die Queen also stundenlang etwas
        // angefordert, das STANEK gar nicht ausfuehren konnte.
        //
        // Jetzt dieselbe Rechnung ueber dieselbe Hostmenge. Was die Queen
        // verspricht, kann STANEK auch einloesen.
        const kandidaten = ["home"];
        try {
            const ps = ns.cloud.getServerNames();
            for (let i = 0; i < ps.length; i++) kandidaten.push(ps[i]);
        } catch (e) { /* ohne Cloud-Zugriff bleibt home */ }
        // v6.9: Hacknet-Server mitnehmen — dort liegen die Kerne (bis 128,
        // Kernbonus bis 8,94), und der Dispatcher raeumt STANEKs Ladehost seit
        // v11.8 ganz frei. Dieselbe Namenskonvention wie im Payload
        // (HacknetHelpers.tsx:75), damit beide dieselbe Menge betrachten.
        for (let i = 0; i < 64; i++) {
            const hn = "hacknet-server-" + i;
            if (!ramMap[hn]) break;
            kandidaten.push(hn);
        }

        let moeglich = 0, besterHost = "";
        for (const h of kandidaten) {
            const r = ramMap[h];
            if (!r) continue;
            // v7.0 — DIESELBE GRUNDLAGE WIE PAYLOAD v2.5.
            //
            // Zwei Angleichungen, beide notwendig, damit die Queen nicht wieder
            // etwas anderes rechnet als STANEK entscheidet:
            //
            //   exkl: JEDER Host ausser home, nicht nur hacknet-*. Der
            //     Dispatcher raeumt seit v11.8 jeden gemeldeten Fremdhost.
            //   basis: auf Fremdhosts maxRam statt free. Ein Host, der geraeumt
            //     WIRD, ist nicht an seinem aktuellen Fuellstand zu messen.
            //
            // Ohne die zweite Angleichung feuerte die Nachladung praktisch nie:
            // der Dispatcher haelt den Pool bei rund 90 % Auslastung, also hat
            // kein einzelner Host je das Dreifache der laufenden Ladung FREI.
            // Im Bericht vom 04.09. stand STANEK mit 295 Threads auf home,
            // waehrend 35 TB Pool bereitstanden — und die Queen meldete in
            // vier Zyklen kein einziges Mal eine Nachladung.
            const exkl = h !== "home";
            const res = exkl ? CFG.STANEK_RAM_RESERVE_EXKL : CFG.STANEK_RAM_RESERVE;
            const frc = exkl ? CFG.STANEK_MAX_FRAC_EXKL : CFG.STANEK_MAX_FRAC;
            const basis = exkl ? r.max : Math.max(0, r.free - homeReserve(ns));
            const budget = Math.min(basis - res, r.max * frc);
            const thr = Math.min(CFG.STANEK_MAX_THREADS,
                Math.floor(Math.max(0, budget) / CFG.STANEK_CHARGE_RAM));
            if (thr < CFG.STANEK_MIN_THREADS) continue;
            let cores = 1;
            try { cores = ns.getServer(h).cpuCores || 1; } catch (e) { cores = 1; }
            const eff = Math.floor(thr * (1 + (cores - 1) / 16));
            if (eff > moeglich) { moeglich = eff; besterHost = h; }
        }

        if (moeglich < hs * CFG.STANEK_RECHARGE_FACTOR) {
            return raus("bester Einzelhost " + (besterHost || "keiner")
                + " gibt " + moeglich + " Threads her, geladen ist mit " + Math.round(hs)
                + " — Faktor " + (moeglich / hs).toFixed(2)
                + " unter der Schwelle " + CFG.STANEK_RECHARGE_FACTOR
                + " (Pool-Summe ist hier NICHT die Bezugsgroesse: Stanek.ts:53)");
        }

        // Wieder freigeben und anfordern. Der Payload setzt den Schalter als
        // ERSTE Aktion selbst wieder auf 0 — wir erzeugen also keinen Dauerlauf,
        // sondern genau einen zusaetzlichen Durchgang.
        setDaemonEnabled(ns, "STANEK", 1);
        S.wants["STANEK"] = now;
        S.stanekGrund = "angefordert";
        ns.tprint("WARN  [QUEEN] STANEK: Ladung " + Math.round(hs) + " Threads, der Pool gibt jetzt rund "
            + moeglich + " her (Faktor " + (moeglich / hs).toFixed(1) + ") — Nachladung angefordert.");
    } catch (e) { raus("Ausnahme: " + e); }
}

/**
 * WAECHTER FUER BLOCKIERTE DAEMONS (v6.7).
 *
 * ANLASS. Im Lagebild stand ueber vier Zyklen "TRADER !! FEHLT - nie gesehen",
 * und niemand hat es bemerkt, weil die Queen still blieb: shouldRun() sagte
 * schlicht nein, und ein Nein wird nirgends begruendet. Die Ursache lag zwei
 * Daemons weiter (BANK schickte DROP, weil ein negativer Depotwert wie ein
 * leeres Depot aussah) — sichtbar war davon nichts.
 *
 * noteBlocked() deckt nur den RAM-Fall ab und kennt keine ZEIT. Zwei Sekunden
 * warten ist normal, zwanzig Minuten ist ein Defekt; im Log sah beides gleich
 * aus. Dieser Waechter ergaenzt genau das:
 *
 *   1. Er beobachtet Daemons, die EINGESCHALTET sind, deren Capability da ist,
 *      die aber nicht laufen — unabhaengig davon, ob shouldRun schon nein sagt.
 *   2. Er meldet erst nach BLOCK_WARN_MS, also nie bei normalem Anlauf.
 *   3. Er schreibt mit ns.tprint und dem Wort WARN, damit die Fehler-Chronik
 *      (SCHWARM-INFO) die Zeile aufsammelt und sie den Lauf ueberlebt.
 *
 * Er GREIFT NICHT EIN. Kein Kill, kein Zwangsstart. Ein Waechter, der selbst
 * handelt, verdeckt genau die Ursache, die er sichtbar machen soll — und der
 * naechstliegende Eingriff ("Platz schaffen") war hier ohnehin die falsche
 * Faehrte: im Lagebild waren 4,2 bis 5,7 TB frei.
 *
 * @param {NS} ns
 * @param {Object} caps
 * @param {Object<string,number>} state  Schalterstand
 */
function watchBlocked(ns, caps, state) {
    const now = Date.now();
    for (const key of Object.keys(DAEMONS)) {
        const d = DAEMONS[key];
        if (!d || d.owner === "HACKING") continue;      // gehoert dem Dispatcher
        // v6.8: VIRTUELLE Daemons haben per Definition keinen Prozess — SLEEVES
        // steckt in WORK, OVERVIEW in DASHBOARD (HELPERS:775 und :802, file:null,
        // virtual:true). Der Waechter hat sie in der ersten Fassung gemeldet:
        // "SLEEVES ist eingeschaltet, laeuft aber seit 2101 s nicht" — richtig
        // beobachtet, aber kein Fehler. Ein Waechter, der Erwartbares meldet,
        // wird ueberlesen; dann geht die eine echte Meldung mit unter.
        if (d.virtual || d.file === null) continue;
        if (d.oneshotDaemon || d.triggered) continue;   // laufen absichtlich selten
        if (key === "RESET") continue;                  // braucht immer einen Anlass

        // Nur was der Spieler EINGESCHALTET hat und was laufen KOENNTE.
        const an  = isDaemonEnabled(ns, key, state);
        const cap = !d.cap || !!caps[d.cap];
        if (!an || !cap || alive(ns, key) || inGrace(key) || S.paused) {
            delete S.blockSeit[key];
            delete S.blockWarn[key];
            continue;
        }

        if (!S.blockSeit[key]) { S.blockSeit[key] = now; continue; }
        const dauer = now - S.blockSeit[key];
        if (dauer < CFG.BLOCK_WARN_MS) continue;
        if (now - (S.blockWarn[key] || 0) < CFG.BLOCK_WARN_REPEAT_MS) continue;
        S.blockWarn[key] = now;

        // Grund so genau wie moeglich. Die RAM-Faelle kennt noteBlocked bereits;
        // bleibt der Fall, den bisher niemand ausgesprochen hat: der Owner
        // fordert den Daemon nicht an.
        let grund = S.blockedWhy[key];
        if (!grund) {
            const owner = d.owner;
            if (state[key] === 2) grund = "forciert, aber kein Start — Log der Queen pruefen";
            else if (!S.wants[key] && owner && owner !== "QUEEN") {
                grund = "kein WANT von " + owner + " — der Owner fordert ihn nicht an"
                    + (alive(ns, owner) ? " (Owner laeuft)" : " (Owner laeuft NICHT)");
            } else grund = "shouldRun() sagt nein, Grund nicht naeher bestimmbar";
        }
        ns.tprint("WARN  [QUEEN] " + key + " ist eingeschaltet, laeuft aber seit "
            + Math.round(dauer / 1000) + " s nicht: " + grund + ".");
    }
}

/** Prestige erkennen -> alles verwerfen und neu aufbauen. */
function checkPrestige(ns) {
    try {
        const ri = ns.getResetInfo();
        const t = ri && ri.lastAugReset ? ri.lastAugReset : 0;
        if (S.lastReset === 0) { S.lastReset = t; return false; }
        if (t !== S.lastReset) {
            S.lastReset = t;
            S.pids = {}; S.wants = {}; S.reserveSince = {}; S.reapSince = {};
            S.paused = false;
            markTopoDirty(ns, "prestige");
            announce(ns, "start", "Prestige erkannt — Schwarm baut neu auf.");
            return true;
        }
    } catch (e) { /* getResetInfo fehlt in alten Versionen */ }
    return false;
}

/** @param {NS} ns */
// ===========================================================================
// v7.4 — DER PLAN KOMMT AUS EINER DATEI, NICHT AUS DEM CODE
// ===========================================================================
// `schwarm-plan.txt` auf home traegt die Strategie: wohin als naechstes, welche
// Regeln gelten, und — als einzige Stelle im ganzen Schwarm — die Freigabe,
// einen Durchlauf zu BEENDEN.
//
// WARUM EINE DATEI UND NICHT HIER IM CODE:
//   1. Sie ueberlebt das Umschreiben der QUEEN. Dieser Code steht bei v7.4 und
//      wandert staendig; eine Datendatei wandert nicht mit.
//   2. Sie ueberlebt den Prestige (prestigeHomeComputer loescht Programme und
//      Nachrichten, nicht die Textdateien).
//   3. Sie ist von aussen lesbar, ohne dass etwas laufen muss.
//   4. Eine Strategie, die man im Quelltext aendern muss, aendert irgendwer
//      versehentlich beim naechsten Umbau mit.
//
// DIE QUEEN SCHREIBT NIE HINEIN. Nur lesen. Deshalb liegt der Plan auch NICHT
// in schwarm-queen-state.txt — dort verwaltet sie ihren eigenen Zustand, und
// ein Fehler dort wuerde sonst eines Tages den Plan ueberschreiben.
//
// ZUSTAND STEHT NICHT DRIN. Welche Source-Files vorhanden sind, weiss die
// Engine selbst und immer richtig. Die QUEEN vergleicht Plan gegen
// Wirklichkeit, statt eine zweite Wahrheit zu pflegen.
const PLAN_FILE = "schwarm-plan.txt";

/** Plan lesen. Fehlt die Datei, ist das KEIN Fehler — dann laeuft der Schwarm
 *  wie bisher weiter. Unbekannte Schluessel werden ignoriert, damit die Datei
 *  mehr sagen darf, als diese Fassung versteht. */
function readPlan(ns) {
    let text = "";
    try { text = ns.read(PLAN_FILE) || ""; } catch (e) { return null; }
    if (!text) return null;
    const plan = {};
    for (const roh of text.split("\n")) {
        const zeile = roh.split("#")[0].trim();
        if (!zeile) continue;
        const i = zeile.indexOf(":");
        if (i <= 0) continue;
        plan[zeile.slice(0, i).trim().toUpperCase()] = zeile.slice(i + 1).trim();
    }
    return Object.keys(plan).length ? plan : null;
}

/**
 * Darf dieser Durchlauf beendet werden, und wie?  -> "daedalus" | "weltdaemon" | null
 *
 * DREI HUERDEN, alle drei muessen fallen:
 *   BEENDEN: ja
 *   GILT-FUER-NODE: <Nummer der LAUFENDEN BitNode>
 *   WEG: daedalus | weltdaemon
 *
 * GILT-FUER-NODE ist die eigentliche Sicherung. Die Freigabe wirkt nur in
 * genau der Node, fuer die sie geschrieben wurde — nach einem Wechsel ist sie
 * von selbst wirkungslos. Kein Aufraeumen, kein Vergessen, und eine alte
 * Freigabe aus einer Sicherungskopie kann keinen frischen Durchlauf beenden.
 */
function endeFreigegeben(ns, plan, bitNode) {
    if (!plan) return null;
    if (String(plan["BEENDEN"] || "").toLowerCase() !== "ja") return null;
    const gilt = String(plan["GILT-FUER-NODE"] || "").trim();
    if (!/^\d+$/.test(gilt) || Number(gilt) !== Number(bitNode)) return null;
    const weg = String(plan["WEG"] || "").trim().toLowerCase();
    // v7.13: dritter Weg "flume". Er beendet den Durchlauf NICHT durch einen
    // Sieg, sondern verlaesst ihn seitlich (ns.singularity.b1tflum3) — ohne
    // Source-File (RedPill.tsx:66). Gedacht als PRUEFPLATZ: in BN3 ist die
    // Corp-Gruendung gratis, dort laesst sich CORP.js gegen eine echte Corp
    // entwickeln und danach wieder heraus.
    //
    // Er laeuft bewusst durch DIESELBE Tuer wie die anderen beiden: BEENDEN +
    // GILT-FUER-NODE + ZIEL-NODE. Ein eigenes Werkzeug haette eine zweite,
    // ungesicherte Tuer aufgemacht — und GILT-FUER-NODE ist genau die
    // Sicherung, die eine vergessene Freigabe nach dem Wechsel von selbst
    // entschaerft.
    return (weg === "daedalus" || weg === "weltdaemon" || weg === "flume") ? weg : null;
}

export async function main(ns) {
    ns.disableLog("ALL");
    if (!ensureSingleInstance(ns)) { ns.tprint("WARN  [QUEEN] läuft bereits — beende diese Instanz."); return; }
    announce(ns, "start", "v" + VERSION + " — alleiniger Deployer");

    // =====================================================================
    // v7.14 — WELCHE FASSUNG LAEUFT EIGENTLICH?
    // =====================================================================
    // DIAG liest alle Versionsnummern aus den DATEIEN. Das beantwortet
    // "was liegt da?", nicht "was laeuft?" — und die beiden koennen weit
    // auseinanderlaufen: ein Daemon behaelt seinen Code, bis er neu startet.
    //
    // Genau das hat am 19.09. eine halbe Stunde gekostet. Die Datei war
    // QUEEN 7.13 (die "flume" kennt), der Bericht zeigte 7.13, die Nutzlast
    // war korrekt, die Plan-Datei im Spiel stimmte, ein Pruefstand gegen
    // beides lieferte sauber "flume" — und PLAN_OUT meldete trotzdem
    // weg:null. Es lief noch die alte QUEEN. Nichts im ganzen Schwarm konnte
    // das sagen.
    //
    // DAS IST DIESELBE FALLE WIE BEI DER DEPLOY-QUITTUNG, eine Ebene hoeher:
    // dort war es "gleiche Version, anderer Inhalt", hier ist es "gleiche
    // Datei, anderer Prozess". Beide Male hilft nur, die Wirklichkeit selbst
    // sagen zu lassen statt sie aus der Quelle zu erschliessen.
    //
    // Deshalb traegt QUEEN_OUT jetzt die Fassung des LAUFENDEN Prozesses und
    // den Zeitpunkt seines Starts. Kostet ein Feld; DIAG kann daraus
    // "Datei 7.14 / laeuft 7.13" machen und das als Befund melden.
    try {
        writeOutField(ns, SCHWARM_PORTS.QUEEN_OUT, "ver", VERSION);
        writeOutField(ns, SCHWARM_PORTS.QUEEN_OUT, "seit", String(Date.now()));
    } catch (e) { /* Anzeige ist Beiwerk, nie den Start riskieren */ }

    // v7.5: Plan lesen UND die Freigabe auf Port PLAN_OUT spiegeln.
    // Ein Port und keine Datei, weil ns.read nur LOKAL liest — der
    // BACKDOOR-Werker laeuft auf pserv und kaeme an eine Datei auf home nicht
    // heran. Gespiegelt wird in JEDEM Takt, damit ein Zuruecknehmen der
    // Freigabe genauso schnell wirkt wie das Erteilen.
    let planLetzteMeldung = "";
    const planSpiegeln = () => {
        let bn = null;
        try { bn = ns.getResetInfo().currentNode; } catch (e) { bn = null; }
        const plan = readPlan(ns);
        const weg = endeFreigegeben(ns, plan, bn);
        // Immer schreiben, auch null: so raeumt ein Zuruecknehmen den Port auf.
        try {
            const h = ns.getPortHandle(SCHWARM_PORTS.PLAN_OUT);
            h.clear();
            h.tryWrite(JSON.stringify({ weg: weg, node: bn, ts: Date.now() }));
        } catch (e) { /* Port weg -> Verbraucher sehen nichts, Sperren bleiben */ }

        // Nur bei ECHTER Aenderung ins Log. Eine Zeile je Takt waere genau das
        // Grundrauschen, das anderswo in diesem Projekt schon zweimal die
        // echten Befunde unsichtbar gemacht hat.
        // =================================================================
        // v7.11 — SOLL-NODE UND ZIEL-NODE SIND NICHT DASSELBE
        // =================================================================
        // Bisher wurde ZIEL-NODE ("wohin als naechstes") gegen die LAUFENDE
        // Node gehalten. Das vergleicht ein Reiseziel mit dem Standort: nach
        // jeder Ankunft steht die Meldung "Abweichung" im Log, bis jemand den
        // Plan von Hand nachzieht — und wer den Plan bewusst verlaesst, bekommt
        // sie dauerhaft. Eine Warnung, die im Normalbetrieb leuchtet, ist keine
        // Warnung mehr; genau daran sind in diesem Projekt schon zweimal echte
        // Befunde untergegangen.
        //
        // Getrennt wird deshalb in zwei Schluessel:
        //   SOLL-NODE   in welcher Node dieser Lauf stattfinden SOLL. Das ist
        //               weiterhin ABSICHT, kein Zustand — wer von Hand woanders
        //               hingeht, traegt es hier ein und die Meldung verstummt.
        //   ZIEL-NODE   wohin als naechstes. Reine Doku, wird NICHT verglichen.
        //
        // Wofuer die Meldung dann noch da ist, und das ist der eigentliche
        // Zweck: SCHWARM-BITNODE uebergibt destroyW0r1dD43m0n() eine Nummer.
        // Landet der Lauf woanders als dort vorgesehen, ist diese Zeile das
        // Einzige, was es sagt. Dafuer muss sie stumm bleiben, solange alles
        // stimmt.
        //
        // RUECKWAERTSKOMPATIBEL: fehlt SOLL-NODE, gilt wie bisher ZIEL-NODE.
        const soll = plan ? (plan["SOLL-NODE"] || plan["ZIEL-NODE"] || "—") : "—";
        const ziel = plan ? (plan["ZIEL-NODE"] || "—") : "—";
        const meldung = `${plan ? "da" : "fehlt"}|${soll}|${ziel}|${bn}|${weg}`;
        if (meldung !== planLetzteMeldung) {
            planLetzteMeldung = meldung;
            if (!plan) {
                ns.print(`PLAN: ${PLAN_FILE} nicht gefunden — Schwarm laeuft unveraendert weiter.`);
            } else {
                ns.print(`PLAN: laufend ${bn === null ? "?" : bn}`
                    + `, Soll ${soll}, naechstes Ziel ${ziel}`);
                if (bn !== null && soll !== "—" && String(soll) !== String(bn)) {
                    ns.print(`PLAN: ABWEICHUNG — dieser Lauf sollte in Node ${soll} stattfinden,`
                        + ` wir sind in ${bn}. Ist das gewollt, SOLL-NODE in ${PLAN_FILE} auf`
                        + ` ${bn} setzen; sonst ist der Uebergang woanders gelandet.`);
                }
                if (weg) {
                    ns.print(`PLAN: ENDE FREIGEGEBEN fuer Node ${bn} ueber "${weg}". Die Sperre`
                        + " fuer genau diesen Weg ist ab jetzt offen.");
                } else if (String((plan || {})["BEENDEN"] || "").toLowerCase() === "ja") {
                    ns.print("PLAN: BEENDEN steht auf ja, aber GILT-FUER-NODE oder WEG passt nicht"
                        + " — Freigabe wirkt NICHT. Das ist die Sicherung, kein Fehler.");
                }
            }
        }
    };
    planSpiegeln();

    // Kaltstart: Topologie einmal bauen, Bestand aufnehmen.
    getTopology(ns, true);
    S.crackers = refreshCrackers(ns);
    resyncPids(ns);
    // v7.16: Start-Stempel der Vorgaengerin uebernehmen (Selbst-Erneuerung).
    {
        const n = uebergabeLesen(ns);
        if (n > 0) ns.print(`UEBERGABE: ${n} Start-Stempel der vorigen Queen uebernommen.`);
    }
    // v7.8: eigenen Fingerabdruck merken, bevor irgendetwas laeuft.
    S.selfStamp = selbstStempel(ns);
    S.selfKandidat = null;
    checkPrestige(ns);

    let caps = await detectCapabilities(ns);
    publishCapabilities(ns, caps);
    if (getPhase(ns) === null) setPhase(ns, PHASE.BOOT);

    while (true) {
        try {
            // ---------- 0. Plan spiegeln (v7.5) ---------------------------------
            // GANZ VORNE, und zwar vor checkPrestige: nach einem BitNode-Wechsel
            // muss die alte Freigabe im selben Takt verschwinden, in dem der
            // Wechsel bemerkt wird — nicht einen Takt spaeter.
            planSpiegeln();

            // ---------- 1. Prestige / Eingang / Meldungen ------------------------
            if (checkPrestige(ns)) { caps = await detectCapabilities(ns); publishCapabilities(ns, caps); }

            // EIN Durchgang durch den eigenen Eingang (Port 2). Er traegt beides:
            // Dashboard-Kommandos und WANT/DROP der Owner. Frueher lagen die auf
            // zwei Ports mit zwei Lesern; seit dem Postfach-Modell gilt "ein
            // Eingang, ein Leser" — sonst nehmen sich die beiden Leser
            // gegenseitig Nachrichten weg.
            const inbox = drainQueenInbox(ns, S.wants);
            handleCommands(ns, inbox.cmds);
            handleResetCycle(ns);

            // VORRANG-REGEL: Ein FORCIERTER Daemon (Dashboard-Schalter = 2) wird von
            // einem DROP des Owners NICHT gekillt. Sonst gäbe es einen Ringkampf:
            // WORK sendet DROP:BLADEBURNER, solange es der Division nicht beigetreten
            // ist — der Benutzer könnte den Daemon also nie von Hand erzwingen, die
            // Queen würde ihn im selben Takt wieder beenden.
            const drops = inbox.drops;
            const stateNow = readStateHealed(ns);   // v6.4
            for (const key of drops) {
                if (stateNow[key] === 2) continue;          // forciert -> Benutzer gewinnt
                if (alive(ns, key)) stop(ns, key, "DROP vom Owner");
            }
            expireSpawnWants(ns, S.wants);   // toter Owner -> keine Geisterstarts

            // ---------- 2. SENSE-Takt (teuer, alle 16 s) -------------------------
            const now = Date.now();
            if (now - S.lastSense >= CFG.SENSE_MS) {
                S.lastSense = now;
                caps = await detectCapabilities(ns);
                publishCapabilities(ns, caps);
                publishTreasury(ns, DEFAULT_TREASURY);
                syncReserveFile(ns, DEFAULT_TREASURY);

                // Rooting: früh und billig. Neue Cracker -> Topologie ist dirty.
                const before = S.crackers.count;
                S.crackers = refreshCrackers(ns);
                if (S.crackers.count !== before) markTopoDirty(ns, "cracker");
                const rooted = nukeIncremental(ns, S.crackers);
                if (rooted > 0) ns.print(`ROOT: ${rooted} neue Server.`);
            }

            // ---------- 3. Selbstheilung (alle 60 s) -----------------------------
            if (now - S.lastResync >= CFG.RESYNC_MS) resyncPids(ns);

            // ---------- 3b. Eigene Fassung veraltet? Dann neu starten (v7.8) ------
            if (now - (S.lastSelf || 0) >= CFG.SELF_MS) {
                S.lastSelf = now;
                selbstErneuern(ns);   // kehrt bei einem Spawn nie zurueck
            }

            // ---------- 4. DER EINE SCAN -----------------------------------------
            // Eine RAM-Karte pro Takt. Daraus: Host-Wahl, Reservierung, Deploy.
            const state = readStateHealed(ns);   // v6.4: liest UND heilt
            // Abhängigkeits-Autostart: schaltet den Owner mit ein, wenn ein abhängiger
            // Daemon aktiv ist, aber sein Owner (BANK/WORK) noch aus. Mutiert state.
            autostartDependencies(ns, caps, state);

            // v7.3: DEN SCHALTER-ZUSTAND SPIEGELN.
            // Die Queen laeuft auf home und ist damit die einzige, die die Datei
            // schwarm-queen-state.txt zuverlaessig lesen kann: ns.read hat keinen
            // Server-Parameter (NetscriptFunctions.ts:1114). Ein Daemon auf einem
            // anderen Host findet dort nichts, faellt auf die Registry-Vorgaben
            // zurueck und ignoriert seinen An/Aus-Knopf STILLSCHWEIGEND.
            //
            // Deshalb hier, NACH autostartDependencies: gespiegelt wird der
            // Zustand, den die Queen selbst zugrunde legt, nicht der rohe
            // Dateiinhalt. Sonst saehen fremde Hosts einen anderen Zustand als
            // die Queen — zwei Wahrheiten fuer dieselbe Frage.
            //
            // Kostet 0 GB (clearPort/writePort, RamCostGenerator.ts:634-638) und
            // darf den Takt nie reissen: faellt der Port aus, bleibt es beim
            // bisherigen Verhalten (Datei auf home, Vorgaben anderswo).
            try { publishManagedState(ns, state); } catch (e) { /* nie den Takt reissen */ }

            // ---------- 4b2. Selbstverwaltung nach Ruhezeit (v7.9) ---------------
            // MUSS VOR 4c stehen: erst darf die Selbstverwaltung Schalter
            // umlegen, dann raeumt 4c auf, was danach nicht mehr laufen soll.
            // Andersherum wuerde ein Daemon eine Runde lang weiterlaufen,
            // obwohl er gerade ausgeschaltet wurde.
            if (now - (S.lastAuto || 0) >= CFG.AUTO_PRUEF_MS) {
                S.lastAuto = now;
                try { selbstverwaltung(ns, caps, state); } catch (e) { ns.print("SELBSTVERWALTUNG: " + e); }
            }

            // ---------- 4c. SCHALTER AUS, PROZESS LAEUFT -> BEENDEN --------------
            // LUECKE, gefunden am 14.09.2026. stop() wurde nur aus drei Anlaessen
            // gerufen: geaenderter Quelltext, ausdruecklicher STOP-Befehl vom
            // Dashboard-Knopf, DROP vom Owner. Ein Schalter auf 0 verhinderte
            // dagegen bloss das STARTEN. Wer den Schalter ANDERS als ueber den
            // Knopf umlegt — schalter.py von aussen, Hand am Spielstand, eine
            // wiederhergestellte Sicherung — hinterliess einen Daemon, der
            // weiterlief. Live belegte BITNODE so 20 von 128 GB auf home, und
            // DIAG meldete es brav ("AUS, laeuft aber"): gesehen, nie gehandelt.
            //
            // EINMALLAEUFER SIND AUSGENOMMEN, und das ist kein Schoenheitsfehler.
            // SCAN und STANEK setzen ihren EIGENEN Schalter als erste Aktion auf
            // 0 und arbeiten danach weiter — sonst wuerde die Queen sie im
            // 2-Sekunden-Takt endlos neu starten. Ein blinder Auto-Stopp killte
            // genau sie mitten im Lauf.
            //
            // Geprueft wird NUR der Schalter, nicht shouldRun() insgesamt: eine
            // fehlende Capability oder ein abgelaufenes WANT sind andere Faelle
            // mit eigenen Wegen (DROP, expireSpawnWants). Eng bleiben.
            for (const key of Object.keys(S.pids)) {
                const d = DAEMONS[key];
                if (!d || d.oneshotDaemon) continue;
                if (isDaemonEnabled(ns, key, state)) continue;
                stop(ns, key, "Schalter aus");
            }

            // ---------- 4c2. CORP OHNE CORP -> BEENDEN (v7.17) ---------------------
            // shouldRun startet CORP nur noch, wenn eine Corp besteht. Ein schon
            // LAUFENDES CORP ohne Corp bliebe aber stehen: der Uebergang von v7.16
            // (im Testspiel am 28.09. genau so gesehen) oder ein von Hand
            // gestartetes. Nur bei SICHEREM Nein (false, nicht null - direkt nach
            // dem Laden sind die Ports leer) und nie gegen ein forciertes CORP (2).
            if (S.pids.CORP && state.CORP !== 2 && corpBesteht(ns) === false) {
                stop(ns, "CORP", "keine Corp");
            }

            // ---------- 4b. Veraltete Nutzlast? Dann beenden ---------------------
            // MUSS VOR planDeployments stehen. Der Plan wird aus dem Ist-Zustand
            // gebildet: ein Daemon, der erst danach beendet wird, taucht darin
            // nicht auf und stuende einen ganzen Takt still. So sieht die Planung
            // ihn bereits als beendet, reserviert Platz und startet ihn in
            // Abschnitt 6 desselben Takts neu.
            try { checkPayloadDrift(ns); } catch (e) { /* nie den Takt reissen */ }

            const ramMap = buildRamMapFast(ns, true);

            // ---------- 4d. UMZUG VON home (v7.7) --------------------------------
            // WOZU. home ist der einzige Host, auf dem Kerne auf weaken/grow
            // wirken. Jedes GB, das dort ein Daemon belegt, fehlt den Workern
            // doppelt. pickHost() waehlt zwar schon "pserv -> fremd -> home",
            // aber NUR BEIM START: wer beim Hochfahren auf home landete, weil
            // sonst nichts gerootet war, blieb dort fuer immer. Live am
            // 14.09.2026: BANK braucht 30 GB, bekam sie beim Bootstrap nur auf
            // home — und sass dort noch Stunden spaeter, obwohl laengst
            // Fremdserver frei waren.
            //
            // KEIN ZWEITER VERSCHIEBE-PFAD. Genau davor warnt der Kommentar zu
            // relocateFromHome() (in v4.0 entfernt): zwei nebenherlaufende
            // Deploy-Wege haben in v6 schon einmal gegeneinander gearbeitet.
            // Deshalb wird hier NUR gestoppt. Den Neustart macht die normale
            // Planung unten im selben Takt, mit frischem pickHost() — also
            // exakt der Weg, den der alte Kommentar selbst vorschlaegt.
            //
            // HOECHSTENS EINER JE DURCHGANG. Ein Schwung gleichzeitiger
            // Neustarts waere ein selbstgemachter Ausfall; so wandert der
            // Schwarm schrittweise und jede Bewegung steht einzeln im Log.
            if (umzugFaellig(now) && getPhase(ns) !== PHASE.PRE_RESET) {
                for (const key of Object.keys(S.pids)) {
                    const d = DAEMONS[key];
                    const e = S.pids[key];
                    if (!d || !e || e.host !== "home") continue;
                    if (d.pinHost || d.oneshotDaemon) continue;   // gehoeren dorthin bzw. verwalten sich selbst
                    if (inGrace(key)) continue;                   // gerade erst gestartet
                    const ziel = pickHost(ns, key, ramMap);
                    if (!ziel || ziel === "home") continue;       // nichts Besseres frei
                    const need = (d.minRam || 2) + (d.burst || 0);
                    const frei = ramMap[ziel] ? ramMap[ziel].free : 0;
                    if (frei < need * CFG.UMZUG_PUFFER) continue; // zu knapp -> waere gleich wieder weg
                    ns.print(`UMZUG ${key}: home -> ${ziel} (${frei.toFixed(0)} GB frei, ${need} noetig)`);
                    stop(ns, key, `Umzug nach ${ziel}`);
                    break;                                        // nur einer je Durchgang
                }
            }

            const { reservations, plan } = planDeployments(ns, caps, state, ramMap);

            // ---------- 5. Dispatcher anweisen ------------------------------------
            // Port 6 sagt dem Dispatcher, wieviel RAM er wo FREIMACHEN soll.
            // Er tut das AUSSCHLIESSLICH passiv: der reservierte Platz wird vom
            // freien RAM abgezogen, mehr nicht. Einen Reservierungs-Kill gibt es
            // nicht — der Dispatcher hat genau ein ns.kill, und das raeumt
            // STANEKs Ladehost frei. Frei wird der Platz durch auslaufende
            // One-Shots oder durch die Ernte der Queen (Abschnitt 5b).
            publishReservations(ns, reservations);

            // ---------- 5b. Ernte, wenn der Platz passiv nicht frei wird ----------
            // Nur noetig, seit die XP-Stufe Dauerlaeufer faehrt (v12.0). Alle
            // anderen Worker sind One-Shots und raeumen den reservierten Platz von
            // selbst; fuer sie tut diese Zeile nichts.
            reapForReservations(ns, reservations, ramMap);

            // ---------- 5c. STANEK nachladen, wenn der Pool gewachsen ist ------
            checkStanekRecharge(ns, ramMap);

            // ---------- 5d. Waechter: eingeschaltet, aber laeuft nicht ----------
            // Meldet erst nach 5 min und hoechstens alle 30 min. Greift NICHT ein.
            try { watchBlocked(ns, caps, state); } catch (e) { /* nie den Takt reissen */ }


            // ---------- 6. Starten, was startbar ist -------------------------------
            // WICHTIG: Reservierung und Deploy zeigen auf denselben Host (plan.host).
            // Der RAM ist evtl. noch nicht frei — dann scheitert exec still, die
            // Reservierung bleibt stehen und der nächste Takt versucht es erneut.
            for (const item of plan) {
                const r = ramMap[item.host];
                const free = r ? (item.host === "home" ? r.free - homeReserve(ns) : r.free) : 0;
                if (free >= item.need) {
                    launch(ns, item.key, item.host);
                } else {
                    const waiting = now - (S.reserveSince[item.key] || now);
                    if (waiting > CFG.RESERVE_HOLD_MS) {
                        // Der Dispatcher bekommt den Platz nicht frei (z.B. lauter
                        // langlaufende weaken-Worker). Nicht ewig blockieren:
                        // Reservierung verfallen lassen, im nächsten Takt neu planen
                        // (evtl. anderer Host, evtl. inzwischen ein neuer pserv).
                        delete S.reserveSince[item.key];
                        ns.print(`WARTE ${item.key}: ${item.host} gibt ${formatRam(item.need)} nicht frei — plane neu.`);
                    }
                }
            }
        } catch (e) {
            announce(ns, "error", `Takt-Ausnahme: ${e}`);
        }
        await ns.sleep(CFG.TICK_MS);
    }
}