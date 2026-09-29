/**
 * SCHWARM-BANK.js — v5.18
 *
 * v5.18 — DIE CORP IN SCHWACHEN NODES (Punkt 24, Entscheidung des Spielers).
 *   a) corpPossible(): unter Softcap 0,75 gruenden, sobald die $150b in
 *      hoechstens CORP_SCHNELL_SEK (60 s) hereinkommen (incomeRate, Median).
 *      "Multiplikatoren unbekannt" heisst jetzt null = nicht gruenden (vorher
 *      true: nach jedem Neuladen einige Sekunden lang eine offene Tuer).
 *      corpErledigt() wartet bei null, statt die Stufe abzuhaken.
 *   b) START:CORP nur noch beim UEBERGANG "keine Corp -> Corp", nicht bei
 *      jedem eigenen Start. Vorher galt ein Schalter 0 nach jedem Laden und
 *      jedem Deploy rund eine Minute lang nicht (so entstand Chemical).
 *   c) Hash-Nachfuellung der Corp-Fonds hoechstens EINMAL je CORP-Meldung
 *      (vorher je Takt: $0,4b -> $183b bei einer Schwelle von $40b).
 *   d) Rueckkauf und Verkauf von Corp-Aktien nur auf frischem CORP_OUT
 *      (<= 120 s). Ohne laufendes CORP stand dort ein eingefrorener Kurs.
 *   e) Ins Handlungsbuch: Corp-Gruendung, Rueckkauf (topf corporation),
 *      Aktienverkauf (erloes) und der Hash-Zufluss in die Corp-Fonds.
 *   Nachtrag 1 (Gegenpruefung, 26 Agenten): 60-s-Regel erst mit vollem
 *   Einkommens-Puffer; Gruendung/Rueckkauf ohne RPC-Antwort = "unklar";
 *   gemessener Rueckkaufbetrag gilt als Schaetzung; Rangliste und
 *   Verkaufskapazitaet nur auf frischem CORP_OUT.
 *
 * v5.17 — MEHRERE FREIGABEN JE TAKT, UND JEDER KAUF MIT BETRAG IM BUCH.
 *   a) Geld-Antraege werden der Reihe nach bedient (prio absteigend, bei
 *      Gleichstand billigster zuerst). Passt einer nicht, wird er
 *      UEBERSPRUNGEN - bis v5.16 blockierte der oberste alle dahinter.
 *      Reihenfolge laut Spieler: Gang-Augs 300, Spende 200, Ausruestung 100.
 *   b) Spenden bekommen hoechstens min(Spenden-Topf, Haelfte des Rests).
 *   c) DOPPELZAEHLUNG behoben: gerechnet wird gegen money - Sockel - HOLD,
 *      nicht gegen cashAvail(), das die eigenen Freigaben schon abzieht.
 *   d) Bestandsschutz: eine Freigabe bleibt, solange ihr Antrag offen ist.
 *   e) TTL-Ablauf wird nicht mehr als Verbrauch gebucht.
 *   f) Handlungsbuch mit exaktem Betrag und Topf (HELPERS v5.16): Freigaben
 *      (erteilt/entzogen/gebucht/verfallen), pserv, home, Hacknet, Graft.
 *   Nachtrag (Testspiel + Gegenpruefung): ungenutzt zurueckgezogene Antraege
 *   werden nicht gebucht; Spenden unter 1 Mio. werden weder vergeben noch
 *   geschuetzt (sonst fror eine gekuerzte Kleinspende fest); pserv- und
 *   Hacknet-Sammelzeilen tragen jeden Einzelkauf mit ms (teile).
 *   Nachtrag 3 (Gegenpruefung, 19 Agenten): ein SCHON LAUFENDER Graft ist
 *   kein Kauf (vorher Phantom-Zahlungen im Buch); home "fehlgeschlagen"
 *   traegt betrag 0.
 *
 * v5.16 — DER ENABLER WUCHS IN DER BREITE. Fehlte der pserv >= 256 GB fuer
 *   INFO, wurde trotzdem der KLEINSTE verdoppelt - bis der erste 256 erreichte,
 *   standen alle 25 auf 128 GB (Pruefstand: $243 Mio statt $14 Mio). Jetzt
 *   steigt der GROESSTE durch; steht der Enabler, gilt wieder kleinster zuerst.
 *
 * v5.15 — DER RUECKKAUF AUS DEM ZIEL LIEF NIE. Es fragte INFO nach
 *   "buyBackShares"; INFO kennt den Befehl als "corpBuyback" -> "unbekannt" ->
 *   null, lautlos (gefunden von der neuen PRUEFER-Regel, Abschnitt 7). Dazu
 *   melden alle drei evalNs-Rueckfaelle fuer Rueckkauf/Verkauf jetzt true:
 *   die Engine-Funktionen sind void, und null hiess hier "gescheitert".
 *
 * v5.14 — IN BN15 KEINE RED PILL BEI DAEDALUS. Die Engine nimmt sie dort
 *   aus der Daedalus-Liste (FactionHelpers.tsx:204); sie liegt im
 *   Darknet-Labyrinth (4. Labor). Mit Freigabe WEG: weltdaemon bestellte BANK
 *   sie trotzdem - endlos abgelehnt, und der Zweig verdraengte jeden normalen
 *   Aug-Kauf. Jetzt: einmal melden (Log + Handlungsbuch), normal weiterkaufen.
 *
 * v5.13 — BEFUNDE DES REVIEWS ZU v5.12 (24.09.2026, je Befund gegengeprueft).
 *   a) DER HALT SPERRTE SEINEN EIGENEN POSTEN. Die Rangliste haelt Geld fuer
 *      den naechsten grossen Posten zurueck (rank.hold, oft home-RAM), und
 *      infraCash() zieht es ab. infraStep bezahlte aber aus infraCash() -
 *      home-RAM kam erst bei etwa doppeltem Geld. Im echten Spiel sichtbar:
 *      "wartet ... Budget $4.45t" vor dem Kauf fuer $99.82t. Ist der Halt ein
 *      INFRA-Posten, nimmt infraStep sein Geld jetzt fuer den GUENSTIGSTEN
 *      INFRA-Schritt (infraBudget) - ausser ein Aug hat gerade Vorfahrt.
 *      Die pserv-Sperre der Rangliste prueft gegen das Geld OHNE Halt, denn
 *      nur das kennt rank.jetzt.
 *   b) Handlungsbuch: Drossel je Art UND Ausgang (ein Kauf verschluckte den
 *      naechsten Fehlschlag), pserv-Kaeufe zusammengefasst (1 Zeile/min),
 *      Fehlschlag der Preisabfrage nicht mehr still.
 *   c) restrictHomePCUpgrade kommt mit der Preisabfrage (getResetInfo).
 *   d) Nach einem Kauf zeigt infraNaechster nicht mehr den gekauften Schritt.
 *   BEKANNT, NICHT HIER: das Handlungsbuch liegt auf dem Rechner, auf dem
 *   BANK laeuft, DIAG liest nur home (SCHWARM-VEREINFACHUNGEN.md Punkt 10).
 *
 * v5.12 — INFRA KAUFT DEN GUENSTIGSTEN SCHRITT.
 *   Vorschlag des Spielers: "das was am guenstigsten ist wird gekauft (so
 *   kommt auch home an sein ram/kerne) ohne komplizierte rechnungen".
 *   serverStep, homeRamStep und homeCoresStep sind jetzt EIN Schritt
 *   (infraStep): naechster pserv (neu oder Verdopplung des kleinsten),
 *   naechste home-RAM-Stufe, naechster home-Kern. Der billigste wird
 *   gekauft, sobald er ins Budget (infraCash) passt. Hacknet bleibt getrennt.
 *   ENTFALLEN: der Bonusfaktor home gegen pserv samt Reset-Zaehler (zaehlte
 *   falsch, siehe v5.11), die 35-%-Grenze und der Flotte-voll-Zweig (v5.11).
 *   BLEIBT, nur fuer pservs: resetPhase, Enabler, INFRA-Bremse, Rangliste.
 *   home kauft auch in der resetPhase — es ueberlebt den Install.
 *   ENGINE: die home-Preise sind am Maximum NICHT unendlich
 *   (PlayerObjectServerMethods.ts:30/42). Die Grenzen 2^30 GB
 *   (Server/data/Constants.ts:6) und 8 Kerne (Singularity.ts upgradeHomeCores)
 *   stehen deshalb selbst im Code.
 *
 * v5.11 — HOME WIRD AUSGEBAUT, WENN DIE PSERV-FLOTTE VOLL IST.
 *   home stand in BN14 tagelang bei 128 GB / 1 Kern, bei $20t Bargeld.
 *   Die Preisregel verglich home mit pservs (home je GB hoechstens bias-mal
 *   so teuer; BN14: 14x > 10 -> nie). Die Flotte war aber voll, 25 x 1 PB -
 *   die Alternative gab es gar nicht mehr. Jetzt: stehen alle pservs auf dem
 *   RAM-Maximum, entfaellt der Vergleich; es gilt nur noch hoechstens
 *   HOME_FLOTTE_VOLL_FRAC (5 %) des Bargelds je Kauf, RAM vor Kernen.
 *   Dazu: Kaeufe, Ablehnungen und Fehlschlaege gehen ins Handlungsbuch
 *   (gedrosselt, 10 min je Art) - der Stillstand war bisher voellig stumm.
 *   Der Kernkauf scheiterte zusaetzlich an INFO (Befehl fehlte, INFO v2.5).
 *   NOCH OFFEN: der Reset-Zaehler liegt auf BANKs eigenem Host und wird bei
 *   jedem Reset geloescht (bias bleibt 10). Wirkt nur bei NICHT voller Flotte.
 *
 * v5.10 — RUECKKAUF NUR IM FENSTER.
 *   CORP v0.41 drueckt die Bewertung vor dem Rueckkauf auf die Engine-
 *   Untergrenze von $10 Mrd und meldet das als `fenster.offen` auf Port 31.
 *   BANK kauft ab jetzt NUR dort. Der Unterschied am 20.09.2026: dieselben
 *   50,5 % kosteten ausserhalb $1,16 BILLIONEN und darin rund $5,4 Mrd.
 *   Ohne die Sperre kauft BANK, sobald sie zufaellig Geld hat — also fast
 *   sicher zum Hoechstkurs. Fehlt der Fenster-Block, bleibt der Rueckkauf aus:
 *   lieber nicht kaufen als teuer kaufen.
 *
 * v5.9 — DER AKTIENRUECKKAUF WAR GEBAUT, ABER UNERREICHBAR.
 *   Seit v1.9 stand "Corp-Aktien N zurueck" in der Rangliste, CORP v0.40
 *   publiziert den Wunsch samt Paketgroesse und floorOwnFrac — nur gekauft
 *   wurde nie. Zwei Gruende, beide hier behoben:
 *
 *   a) KEIN KAUFPFAD. "corp-aktien" kam im ganzen Skript genau zweimal vor:
 *      als Rangkandidat und in einem Doku-Kommentar. Es gab keine Stelle, die
 *      ns.corporation.buyBackShares() je aufgerufen haette. Jetzt als Ziel
 *      (rueckkaufZiel) — damit erbt es Ansparen, Liquidation, ETA und Anzeige,
 *      genau wie Corp-Gruendung, 4S-API und Craft.
 *
 *   b) RENDITE IMMER 0. perH rechnete mit cc.dividendRate, und die steht auf 0,
 *      solange CORP waechst. Der Posten verlor damit gegen jeden anderen — ein
 *      Henne-Ei-Problem, denn die Ausschuettung schaltet erst frei, wenn das
 *      Wachstum fertig ist. Bewertet wird jetzt gegen RUECKKAUF_PLAN_DIVIDENDE.
 *
 *   DIE KOSTEN WURDEN AUSSERDEM ZU NIEDRIG GESCHAETZT. Die Engine bietet keine
 *   Abfrage an (ein getBuybackSharesCost() existiert nicht), und
 *   `chunk * sharePrice * 1.10` unterstellt einen festen Kurs. Der Kurs haengt
 *   aber am eigenen Anteil (getTargetSharePrice: 0.5 + sqrt(Anteil)) und steigt
 *   WAEHREND des Kaufs. rueckkaufKosten() baut calculateShareSale schrittweise
 *   nach. Gegengerechnet mit SCHWARM-werkzeug/corp-rueckkauf.py.
 *
 *   PAKETWEISE, nicht auf einmal: der Nutzen ist linear (Dividende streng nach
 *   numShares/totalShares), die Kosten steigen mit dem Anteil. Live am
 *   19.09.2026: 1 % kostet $6,69 Mrd, 50,5 % dagegen $632 Mrd.
 *
 * v5.8 — ZWEI FEHLER IN DER HOME-MESSUNG AUS v5.5, BEIDE MEINE.
 *   a) homeBias() stand HINTER der Bezahlbarkeitspruefung — war home-RAM zu
 *      teuer, lief der Zaehler gar nicht. Er mass die Zeiten nicht, in denen
 *      er gebraucht wird. Jetzt zuerst zaehlen, dann rechnen.
 *   b) Der Zaehler fing in jeder neuen BitNode bei null an und fiel damit auf
 *      HOME_BIAS_MIN = 1.5 zurueck — genau die geratene Zahl, die v5.5
 *      ersetzen sollte, und ausgerechnet dort, wo home am wertvollsten ist.
 *      Die vorige Node gilt jetzt als Erwartung, bis die neue sie ueberholt.
 *
 * v5.7 — DIE 4S-API BLOCKIERTE ALLES, SEIT WIR SF8 HABEN. Prestige.ts:161
 *   schenkt mit SF8 WSE und TIX dauerhaft — die 4S-API aber nicht. Damit war
 *   das erste Glied der Ziel-Kette (c.TIX && !c.API) permanent wahr. In BN3:
 *   Ziel 4S-API fuer $25 Mrd, Finanzierung in 53 Tagen, waehrend daneben eine
 *   GRATIS-Corp stand. Ein Gratis-Ziel wartet jetzt nicht mehr.
 *
 * v5.6 — SAATGELD GALT NOCH NICHT FUER DIE ANZEIGE. v5.4 baute es in
 *   currentGoal() und die Rangliste ein, die veroeffentlichte corpGoal-Zahl
 *   blieb aber hart auf $150b. In BN3 meldete der Bericht damit ein Sparziel,
 *   das es gar nicht gibt.
 *
 * v5.5 — HOME WURDE SYSTEMATISCH UNTERINVESTIERT.
 *   Zwei Befunde des Spielers, beide belegt:
 *     a) HOME_BIAS stand auf 1.5 — ein geratener Wert. Prestige.ts:136 loescht
 *        mit prestigeAllServers() ALLE Server (pserv UND Hacknet); home
 *        ueberlebt mit RAM und Kernen. Bei 111 Aug-Resets in diesem Lauf hat
 *        der Schwarm die Flotte 111 Mal gekauft und verloren, waehrend home bei
 *        128 GB stand. Der Faktor wird jetzt GEMESSEN (Reset-Zaehler in einer
 *        Datei auf home) statt geraten, gedeckelt bei 40.
 *     b) upgradeHomeCores kam im GANZEN Schwarm nicht vor — Kerne wurden nie
 *        gekauft. Neue Stufe homeCoresStep, bewusst hinter dem RAM: der
 *        Kern-Zugewinn ist homeRam/16, lebt also von der Groesse, die der RAM
 *        erst schafft.
 *
 * v5.4 — In BN3 ist die Corp-Gruendung gratis; BANK sparte trotzdem $150 Mrd.
 *   Corporation/helpers.ts:71 laesst selfFund=false genau in BN3 zu — dort
 *   zahlen Investoren das Saatgeld. BANK rief createCorporation() fest mit
 *   selfFund=true auf und fuehrte die $150 Mrd als Grossziel mit Prioritaet
 *   1000. Ausgerechnet in der einen BitNode, in der die Corp der Geldtreiber
 *   ist, haette der Schwarm also stundenlang fuer etwas gespart, das gratis
 *   danebenliegt. Rangliste und Grossziel fragen jetzt `corpSaatgeld()`.
 *
 * v5.3 — Corp-Gruendung: "erlaubt" reicht als Begruendung nicht.
 *   corpPossible() fragte bisher nur, ob die Engine die Gruendung durchlaesst
 *   (CorporationSoftcap >= 0.15). In BN13 und BN15 ist sie erlaubt, aber der
 *   Softcap 0.40 ergibt einen Auszahlungs-EXPONENTEN von 0.40: aus $1 Mrd
 *   Dividende werden $3.981. BANK haette dort $150 Mrd mit Prioritaet 1000 —
 *   vor AUGS und INFRA — fuer eine Corp gespart, aus der kein Geld
 *   herauskommt. Neue Schwelle: Softcap >= 0.75. Volle Herleitung mit
 *   Engine-Zeilen steht bei CORP_SOFTCAP_LOHNT.
 *
 * v5.2 — "The Red Pill" auf Anweisung, nicht nach Rendite.
 *   Sie ist der Schluessel zum Weltdaemon (erst installiert wird w0r1d_d43m0n
 *   sichtbar) und taucht in BANKs normaler Auswahl NIE auf: `moneyCost: 0` und
 *   `stats: ""` (Augmentations.ts:1953). Eine Liste, die nach Preis und Nutzen
 *   sortiert, hat nichts, woran sie sie einordnen koennte — das ist kein
 *   Fehler, sondern die Grenze zwischen Taktik und Strategie. "Diesen
 *   Durchlauf beenden" ist keine Ertragsfrage.
 *
 *   Der Auftrag kommt deshalb von oben: schwarm-plan.txt -> QUEEN -> Port
 *   PLAN_OUT, gelesen mit planFreigabe(ns, "weltdaemon").
 *
 *   ZWEITE BEDINGUNG GEGEN EINEN DEADLOCK: gekauft wird erst, wenn wir schon
 *   Mitglied bei Daedalus sind. Die Faktion verlangt 30 Augmentierungen (in
 *   BN6 sogar 35, DaedalusAugsRequirement). Griffe der Zweig vor dem Beitritt,
 *   blockierte er genau die Kaeufe, die den Beitritt erst moeglich machen.
 *
 *   Die STANEK-Sperre bleibt vorgelagert — auch ein endender Lauf uebergeht
 *   keine bewusste Schutzentscheidung; STANEK meldet von sich aus "fertig".
 *
 * v5.1 — SPENDEN WURDEN GEGEN DIE FALSCHE GROESSE GEKUERZT.
 *   Der Spenden-Deckel verglich nur mit dem Topf, nicht mit dem verfuegbaren
 *   Geld. Da der Topf unbegrenzt aus dem Zufluss waechst, stand im Bericht vom
 *   11.09.: "[nicht freigegeben: $21.30b noetig, $2.18b frei]" — und so hing
 *   der Antrag seit dem 07.09. fest, ueber 81 Berichte hinweg.
 *   Gekuerzt wird jetzt auf min(Topf, cashAvail()).
 *
 * v5.0 — SPENDEN: GELD IN FAKTIONS-RUF, MIT ZWEI BREMSEN.
 *   Die BANK kann jetzt Spenden-Antraege von WORK bedienen. Neu sind ein
 *   eigener Topf und ein Deckel; die Spende selbst fuehrt WORK aus, weil dort
 *   die Ruf-Ziele liegen.
 *
 *   WARUM UEBERHAUPT: repFromDonation = Betrag/1e6 * mults.faction_rep *
 *   FactionWorkRepGain (Faction/formulas/donation.ts:8-10). In BN8 ist
 *   FavorToDonateToFaction 0, also favorNeededToDonate() = floor(150*0) = 0 —
 *   spenden geht dort ab Favor 0. Ruf ist in dieser BitNode der Engpass, Geld
 *   kommt aus der Boerse.
 *
 *   WARUM GEDECKELT: Eine grosse Rufluecke lockt zu einer Ueberweisung, die den
 *   Betrieb aushungert. Ein Aug-Kauf braucht NEBEN dem Ruf auch den Kaufpreis;
 *   wer alles in Ruf steckt, steht mit vollem Ruf und leerem Konto da.
 *     1. SPENDE_RATE = 5 %% des Brutto-ZUFLUSSES je Tick fliessen in einen
 *        eigenen Topf. Er ist die harte Obergrenze jeder Spende — unabhaengig
 *        davon, wieviel Geld herumliegt.
 *     2. v5.17: WORK beantragt mit Prio 200 - nach den Gang-Augs (300), vor
 *        der Gang-Ausruestung (100) - und bekommt hoechstens die Haelfte des
 *        Geldes, das nach den Antraegen davor noch frei ist.
 *   Zwei unabhaengige Bremsen, absichtlich.
 *
 *   BESONDERHEIT: Spenden-Antraege werden GEKUERZT statt abgelehnt — eine halbe
 *   Spende bringt anteilig Ruf. Bei einem Server oder einer Augmentierung waere
 *   das sinnlos (bezahlt oder nicht), deshalb gilt das Kuerzen nur hier.
 *
 * v4.9 — ZWEI BREMSEN, DIE IN BN8 GENAU DAS ABWUERGTEN, WAS GELD VERDIENT.
 *   Beobachtet: "RAM gesamt 3.9T, davon hacknet-* 1G". Der Nutzer musste
 *   Hacknet-Server von Hand kaufen, BANK kaufte keinen einzigen. Im selben
 *   Dauerauftrag hatte BN14 zuvor 112 TB Hacknet-RAM.
 *
 *   BREMSE 1 — hacknetStep stieg bei hashesWorthless sofort aus. Die Begruendung
 *   ("Rate-Kaeufe verbrennen dort Geld") stimmt fuer LEVEL-Kaeufe, die nur
 *   Hash-Produktion bringen. Sie stimmt nicht fuer RAM und KERNE: mit SF9 sind
 *   Hacknet-Server echte Rechner im Netz, bis 8192 GB und bis 128 Kerne
 *   (Hacknet/data/Constants.ts:48-50). Der Dispatcher nimmt sie ausdruecklich
 *   VOLLSTAENDIG in den Pool, sobald Hashes wertlos sind (v12.3:
 *   hnReserveFrac = hashesWorthless ? 0 : ...). Er gab also alles her, was BANK
 *   gar nicht erst kaufte.
 *
 *   BREMSE 2 — workerRamPays() las ScriptHackMoneyGain = 0 als "Worker-RAM
 *   bringt hier nichts" und begrenzte pservs auf den Daemon-Bedarf. Das ist ein
 *   Fehlschluss: hack() und grow() bewegen weiterhin KURSE, und zwar in voller
 *   Staerke, denn influenceStockThroughServerHack bekommt moneyDrained, NICHT
 *   moneyGained (NetscriptHelpers.tsx:662). Die Trefferchance ist
 *   moneyDrained / server.moneyMax (PlayerInfluencing.ts:34) — mehr Threads
 *   heisst groessere Bissen heisst mehr Kurswirkung. In BN8, wo die Boerse die
 *   einzige Geldquelle ist, bremste BANK also den Apparat aus, der das Geld
 *   verdient, waehrend der Dispatcher die Beeinflussung mit 70 % des Pools fuhr.
 *
 *   NEU:
 *     - workerRamPays() faellt nur noch auf false, wenn ScriptHackMoneyGain = 0
 *       UND kein Boersenzugang besteht. Ohne Boerse bleibt das alte Urteil.
 *     - Sind Hashes wertlos, aber Hacknet-Server verfuegbar und Worker-RAM
 *       lohnend, laeuft hacknetStep im INFRASTRUKTUR-MODUS: gekauft werden
 *       Server, RAM und Kerne — keine Level. Bewertet wird in WIRKSAMEN GB,
 *       also ram * coreBonus mit coreBonus = 1 + (cores-1)/16
 *       (ServerHelpers.ts:288). Dieser Bonus wirkt auf grow und weaken — genau
 *       die beiden Aufrufe, mit denen der Schwarm hier Kurse schiebt. Damit
 *       haben alle drei Kaufarten eine gemeinsame, ehrliche Einheit.
 *
 * v4.8 — DIE CRAFT-PHASE HING HINTER EINER TUER, DIE IN BN8 NIE AUFGEHT.
 *   Einen Tag nach v4.7 wechselte der Lauf nach BN8, und der neue
 *   BitNode-Steckbrief (DIAG v3.3) legte es sofort offen:
 *       CorporationSoftcap = 0
 *   Corporation/helpers.ts:74 sperrt die Gruendung unterhalb von 0.15 hart ab —
 *   createCorporation WIRFT dort sogar, statt false zu liefern. In BN8 kann es
 *   also niemals eine Corp geben.
 *
 *   Die Congruity-Stufe stand an drei Stellen hinter `corpExists`. Gemeint war
 *   eine REIHENFOLGE ("die Corp hat Geld-Vorrang, beide kosten aehnlich viel"),
 *   gelesen wurde sie als VORAUSSETZUNG. Folge in BN8: corpExists bleibt fuer
 *   immer false -> Congruity wird nie gegraftet -> die ganze Craft-Phase aus
 *   v4.7 laeuft nie an. Und das ausgerechnet dort, wo Grafting verfuegbar ist
 *   (SF10) und der normale Weg ueber Kauf-und-Install besonders zaeh waere.
 *
 *   Jetzt entscheidet corpErledigt(): die Stufe ist abgehakt, wenn die Corp
 *   steht ODER wenn sie in dieser BitNode unmoeglich ist. Der Geld-Vorrang
 *   bleibt ueberall erhalten, wo es ihn geben kann.
 *
 *   DAS IST DASSELBE MUSTER WIE SCHON DREIMAL: ein Zustand, der etwas
 *   zurueckhaelt, muss pruefen, ob sein Ausgang ueberhaupt erreichbar IST.
 *   Vorher getroffen bei resetPhase (v3.4), bei der PRE_RESET-Pause der Queen
 *   (v7.1) und beim CORP-Stadtvorhalt (v0.33). Wer im Schwarm eine neue
 *   Bedingung einbaut, die etwas anhaelt, sollte diese Frage mitschreiben.
 *
 * v4.7 — NACH CONGRUITY WIRD GECRAFTET STATT INSTALLIERT.
 *   Bisher endete der Congruity-Pfad mit dem Aug selbst; der Kommentar sagte
 *   ausdruecklich "hier aber nicht weiter genutzt". Genau da setzt v4.7 an.
 *
 *   WARUM CRAFTEN AB DANN BESSER IST — drei Engine-Tatsachen:
 *     1. GraftingWork.finish ruft applyAugmentation DIREKT auf
 *        (AugmentationHelpers.ts:39). Ein gecrafteter Aug wirkt SOFORT.
 *        Kein Install, kein Reset, nichts wird beendet.
 *     2. Ohne Congruity kostet jeder Graft einen Entropiepunkt
 *        (GraftingWork.tsx:61, EntropyEffect 0.98 auf ALLE Multiplikatoren).
 *        MIT Congruity faellt dieser Malus komplett weg — deshalb ist genau
 *        dieser Aug die Schwelle.
 *     3. Der Craft-Preis eskaliert nicht: GraftableAugmentation.cost ist
 *        baseCost * 3, und baseCost ist eingefroren (Augmentation.ts:215).
 *        Der KAUFpreis dagegen steigt mit 1.9^N je Aug der laufenden Runde.
 *        Ab dem dritten Aug einer Runde ist Craften also auch billiger.
 *
 *   WAS SICH AENDERT:
 *     - Craften ist das vierte Grossziel (nach 4S-API, Corp, Congruity). Als
 *       Ziel erbt es Ansparen, Liquidation, ETA-Pruefung und Anzeige, statt
 *       einen zweiten Pfad danebenzustellen. Waehrend ein Graft LAEUFT gibt
 *       es bewusst kein Ziel — sonst haelt BANK stundenlang Geld zurueck und
 *       drosselt INFRA, obwohl nichts zu bezahlen ist.
 *     - RESET wird zurueckgehalten, solange noch etwas craftbar UND bezahlbar
 *       ist. Ein Install waere der schlechtere Tausch: er beendet den ganzen
 *       Schwarm fuer denselben Zugewinn, den das Craften nebenbei liefert.
 *     - Was craftbar ist, wird NICHT mehr gekauft. NeuroFlux bleibt kaufbar
 *       und ist damit der einzige verbleibende Kaufposten — NFG laesst sich
 *       nicht sinnvoll craften (ein Graft gaebe nur Stufe 1 fuer baseCost*3,
 *       der Kauf bringt die NAECHSTE Stufe).
 *     - Reihenfolge: SCHNELLSTE zuerst. Weil der Craft-Preis nicht eskaliert,
 *       sind die Gesamtkosten in jeder Reihenfolge gleich — knapp ist allein
 *       die Zeit.
 *
 *   AUSGAENGE (ein Zustand, der den Betrieb anhaelt, muss pruefen, ob sein
 *   Ausgang erreichbar ist — dieselbe Regel wie bei resetPhase und PRE_RESET):
 *     1. nichts mehr craftbar            -> craftFertig
 *     2. naechstes Stueck seit 45 min unbezahlbar (CRAFT_MAX_WAIT_MS)
 *     3. Grafting im BitNode nicht verfuegbar
 *   In allen drei Faellen laeuft der alte Kauf-und-Install-Zyklus wieder an.
 *   Kauf-Sperre und Reset-Sperre haengen an DERSELBEN Bedingung
 *   (craftSperrtReset), damit kein Zustand entstehen kann, in dem weder
 *   gekauft noch gecraftet wird.
 *
 *   ZUR ZEITGRENZE, ehrlich: CRAFT_MAX_TIME_MS steht auf 4 h und greift heute
 *   NIRGENDS. Die Craft-Dauer ist (1h * log2(Summe der Multiplikatoren != 1)
 *   + 30min) / 2, geteilt durch den Intelligenz-Bonus. Ueber alle 136 Augs
 *   nachgerechnet ist das langsamste CRAFTBARE Stueck "Xanipher" mit 2,16 h
 *   bei Intelligenz 0; die beiden langsameren (BigD's Big Brain, Stanek's
 *   Gift) sind isSpecial und gar nicht craftbar. Die Grenze ist also ein Netz
 *   fuer kuenftige Augs, kein Filter. Beendet wird die Phase vom GELD.
 *
 * v4.6 — DER TRADER WURDE EINE STUNDE ZU FRUEH ABGESCHALTET.
 *   resetPhase heisst nur: die Aug-Runde ist abgearbeitet. Bis der Install
 *   wirklich laeuft, koennen 60 Minuten vergehen — checkResetReady verlangt
 *   zusaetzlich RESET_MIN_PLAY_MS seit dem letzten Reset und ein Ruhefenster.
 *   Trotzdem loeste schon das Rundenende die Schluss-Liquidation samt
 *   DROP:TRADER aus. Ergebnis: eine Stunde ohne Handel, ohne dass etwas
 *   bevorstand. Der Nutzer hat es am 05.09.2026 gemeldet, und er hatte recht.
 *
 *   Der Abbau haengt jetzt an der TATSAECHLICHEN Reset-Meldung an die Queen
 *   (installGemeldet). INFRA bleibt weiter schon ab Rundenende angehalten —
 *   gekaufte Server ueberleben den Install nicht, und ein Zuviel an Vorsicht
 *   kostet dort nur Zinsen, keine offene Position.
 *
 *   Siehe SCHWARM-QUEEN.js v7.1: dort steckte der zweite, groessere Teil
 *   desselben Problems — die PRE_RESET-Pause konnte gar nicht mehr enden.
 *
 * v4.5 — DIE RESET-PHASE BRAUCHT EINEN ERREICHBAREN AUSGANG.
 *   resetPhase friert den halben Schwarm ein: keine Server, kein Hacknet,
 *   TRADER per DROP aus. Richtig, solange der Install gleich kommt — der
 *   Install loescht ohnehin alle gekauften Server (Prestige.ts).
 *   Steht der RESET-Schalter aber auf AUS, kommt der Install nie, und der
 *   Zustand wird dauerhaft. Live am 05.09.2026: 5 Augs gekauft, Ruf nach
 *   dem Install ueberall auf Null, also target leer -> resetPhase an, RESET
 *   aus. Folge: TRADER blieb gelb (BANK schickte im Sekundentakt
 *   DROP:TRADER) und der Pool kam von 3249 TB nicht ueber 4.9 TB hinaus.
 *   Der Schalter gehoert deshalb in die Bedingung. Aus heisst: der Spieler
 *   will diese Runde weiterspielen — dann wird auch weiter investiert.
 *   Siehe SCHWARM-DASHBOARD.js v5.5, warum niemand den Schalterstand sah.
 *
 * v4.4 — BILLIGSTES AUG ZUERST, NFG ALS LUECKENFUELLER.
 *
 *   Bis v4.3 sortierte planAugRound absteigend, mit der Begruendung
 *   "kostenminimale Reihenfolge". Die Rechnung stimmt: der N-te in DERSELBEN
 *   Runde gekaufte Aug kostet Grundpreis x 1.9^(N-1)
 *   (AugmentationHelpers.ts:32). Wer teuer zuerst kauft, zahlt den
 *   Multiplikator auf die billigen statt umgekehrt.
 *
 *   Nur ist Geld hier nicht die knappe Groesse. Der Multiplikator wird beim
 *   Install ZURUECKGESETZT (queuedAugmentations ist danach leer) — was zaehlt,
 *   ist also nicht der Stueckpreis, sondern wie schnell die Runde voll wird.
 *   Absteigend hiess: bis zu AUG_FALLBACK_MS auf das teuerste ansparen, bevor
 *   ueberhaupt etwas passiert. Aufsteigend heisst: sofort kaufen, Runde
 *   fuellen, installieren. AUG_ROUND_MAX begrenzt die Zahl ohnehin auf 5 —
 *   es aendert sich also WELCHE fuenf und WIE LANGE, nicht wie viele.
 *
 *   NeuroFlux Governor war bisher komplett ausgeschlossen. Er ist jetzt der
 *   letzte Posten: faellig, wenn nichts anderes mehr rufbar ist, oder wenn
 *   NFG_STALL_MS (30 min) lang gar nichts gekauft wurde. Beides heisst, dass
 *   der RUF blockiert und nicht das Geld — und dagegen hilft Warten nicht.
 *   Er zaehlt bewusst nicht gegen AUG_ROUND_MAX.
 *
 * SCHWARM-BANK.js — v4.3
 *
 * v3.4 — "WERT 0" HEISST NICHT "DEPOT LEER". In der Reset-Phase entschied
 *   managePayloads nach dem Depotwert, ob der TRADER noch gebraucht wird. Sobald
 *   eine Short-Position unter Wasser steht, wird dieser Wert NEGATIV
 *   (StockMarketHelpers.ts:55-59) und der TRADER klemmt ihn auf 0, damit BANK
 *   nicht mit negativem Vermoegen rechnet. BANK las 0, hielt das Depot fuer leer
 *   und schickte DROP:TRADER — womit die einzige Instanz starb, die die Position
 *   haette schliessen koennen. Sie blieb offen bis in den Aug-Install hinein.
 *   Im Lagebild sah man das als "TRADER !! FEHLT - nie gesehen" bei gleichzeitig
 *   laufenden Trader-Warnungen im Terminal.
 *   JETZT entscheidet die ANZAHL offener Positionen (readPortfolioHeld), die der
 *   TRADER seit v1.3 getrennt vom Wert meldet. Bei Wert <= 0 und offenen
 *   Positionen geht eine unerfuellbare Forderung raus (LIQ_ALLES) — das ist die
 *   Formulierung fuer "schliess alles", weil runLiquidation abbricht, sobald
 *   "raised >= request".
 *
 * v3.3 (BitNode-Realitaet: Corp-Gate + Infra-Bremse)
 *
 * ===========================================================================
 * v3.3 — ZWEI SPARLINIEN, DIE IN BN8 INS LEERE LAUFEN
 * ===========================================================================
 *
 * C1 CORP-GRUENDUNG IST IN BN8 ENGINE-SEITIG UNMOEGLICH.
 *    BitNode.tsx:780-782 fuer BN8: CorporationValuation 0, CorporationSoftcap 0,
 *    CorporationDivisions 0. Und die API-Doku zu createCorporation
 *    (NetscriptDefinitions:10408) nennt als Fehlerfall ausdruecklich: "Be in a
 *    BitNode that has CorporationSoftcap (a BitNode modifier) less than 0.15."
 *    Bei 0 wirft der Aufruf also IMMER.
 *    Trotzdem fuehrte BANK "Corp $150b" als Grossziel und als Rangkandidaten.
 *    URSACHE: bitNodeFeatures().corporation prueft nur has(3) && !disableCorporation
 *    — den Softcap kennt es nicht. Das Gate ist unvollstaendig.
 *    FIX HIER LOKAL (corpPossible): zusaetzlich CorporationSoftcap >= 0.15 aus
 *    dem INFO-bn-Block. Fehlen die Mults (kein SF5), bleibt es beim alten
 *    Verhalten — lieber ein vertagtes Ziel als ein faelschlich gesperrtes.
 *    RICHTIGER waere der Fix in HELPERS.bitNodeFeatures (eine Quelle fuer alle);
 *    das beruehrt aber Queen und Dashboard und gehoert in eine eigene Runde.
 *
 * C2 INFRASTRUKTUR-BREMSE, WENN WORKER-RAM KEIN GELD ERZEUGT.
 *    BN8 setzt ScriptHackMoneyGain auf 0: gehackte Server verlieren zwar Geld
 *    (ScriptHackMoney 0.3, wichtig fuer die Kursbeeinflussung), der SPIELER
 *    bekommt aber keinen Dollar. Zusaetzliche pservs erhoehen damit kein
 *    Einkommen — sie sind reine Ausgabe.
 *    LIVE BELEGT: Vermoegen 197,61m -> 13,96m -> 22,58m -> 2,04m in 45 min,
 *    waehrend der Trader mangels Kapital stillstand. Das Geld floss in RAM,
 *    der in dieser BitNode nichts erzeugt.
 *    FIX: ist ScriptHackMoneyGain 0, werden pservs nur noch bis zum DAEMON-
 *    BEDARF gebaut. Der Bedarf wird nicht geraten, sondern aus der Registry
 *    summiert (minRam + burst aller Daemons mit host "pserv") und mit einem
 *    Sicherheitsfaktor versehen. Der INFO-Enabler (erster Host >= 256 GB)
 *    bleibt ausgenommen — ohne INFO wird der ganze Schwarm teurer.
 *    Hacknet ist bereits gestoppt (hashesWorthless-Gate in hacknetStep).
 *    SOBALD DIE KURSBEEINFLUSSUNG LAEUFT, ist zusaetzlicher Worker-RAM wieder
 *    wertvoll — dann aber als Manipulations-, nicht als Ertragswerkzeug. Die
 *    Bremse ist deshalb bewusst an ScriptHackMoneyGain gehaengt und nicht an
 *    einen Schalter, den man vergisst.
 *
 * ---------------------------------------------------------------------------
 * v3.2 (TRADER entkoppelt)
 *
 * ===========================================================================
 * v3.2 — DER TRADER IST KEIN LIQUIDITAETSSPEICHER MEHR
 * ===========================================================================
 *
 * BEFUND (Livelauf, Trader-Log): ein Liquidations-Kauf-Karussell.
 *     LIQUIDATION (BANK): FLCM S aufgeloest (~$33.46m)
 *     GEKAUFT (Short): 382,000x FLCM fuer $13.62m
 *     GEKAUFT (Short): 309,000x FLCM fuer $10.92m
 *     LIQUIDATION (BANK): FLCM S aufgeloest (~$39.49m)
 * BANK forderte $4,51 Mrd von einem Depot, das auf Port 26 selbst $68m meldete.
 * Die Forderung war unerfuellbar, wurde also jeden Tick neu gestellt; der Trader
 * liquidierte, leerte den Port und kaufte mit dem Erloes sofort nach. Vier
 * Transaktionen je Runde x $100k Kommission bei praktisch unveraendertem Kurs.
 * Im DIAG-Verlauf: Geld $61,61m -> $53,9k innerhalb eines Zyklus.
 *
 * URSACHE, und sie liegt auf BEIDEN Seiten:
 *   - TRADER: machte den Liquidationserloes im selben Durchlauf wieder
 *     verfuegbar und leerte Port 27 selbst (behoben in TRADER v1.1).
 *   - BANK (hier): vier Eigentuemer durften liquidieren (reset/goal/aug/infra),
 *     und `liquid()` zaehlte das volle Portfolio als eigene Liquiditaet. Damit
 *     plante BANK dauerhaft mit Geld, das dem Trader gehoert, und forderte es
 *     in Betraegen an, die das Depot nie hergeben konnte.
 *
 * AENDERUNGEN:
 *
 * B1 NUR NOCH EIN LIQUIDATIONS-EIGENTUEMER: "reset".
 *    Begruendung ist mechanisch, nicht stilistisch: Prestige.ts:167-169 ruft beim
 *    Aug-Install initStockMarket() — das Depot wird zurueckgesetzt, offene
 *    Positionen sind ersatzlos weg. VOR dem Install MUSS also liquidiert werden.
 *    Fuer alles andere gilt: der Trader schuettet selbst aus (TRADER v1.1 haelt
 *    hoechstens seinen Einsatzdeckel und baut alles darueber ab), BANK braucht
 *    also nichts anzufordern. goal/aug/infra entfallen ersatzlos.
 *
 * B2 liquid() ZAEHLT DAS PORTFOLIO NICHT MEHR MIT.
 *    Sonst plant BANK mit Geld, das sie nicht mehr anfordern darf: die
 *    ETA-Pruefung haette Ziele fuer erreichbar gehalten, deren Deckung im Depot
 *    des Traders steckt, und haette ewig auf Cash gewartet, das nie kommt.
 *    Was der Trader ausschuettet, erscheint ohnehin als Cash und damit in
 *    cashAvail() — nur eben dann, wenn es wirklich da ist.
 *
 * B3 accrueSavings deckelt savings jetzt auf money() statt money()+Portfolio.
 *    Gleiche Begruendung wie B2. (savings ist seit v3.0 reine Anzeige, der
 *    Deckel bleibt aber der Ehrlichkeit halber korrekt.)
 *
 * NICHT GEAENDERT: der reset-Zweig in managePayloads. Er liquidiert weiterhin
 * das ganze Portfolio und stoppt den TRADER erst, wenn es leer ist — das ist
 * genau der Fall, fuer den Port 27 bleibt.
 *
 * ---------------------------------------------------------------------------
 * v3.1 (HOLD-Reserve gedeckelt)
 *
 * v3.1 — BUGFIX zu v3.0: die HOLD-Reserve band den GESAMTEN Kontostand. Live
 *   "RESERVE $10.25b (Sockel $10.00m + HOLD $10.24b)" bei $18,53m Cash und in
 *   der Folge "Frei: $0 fuer Investitionen" — BANK kaufte nichts mehr. Aus der
 *   Priorisierung war eine Totalsperre geworden, und sie traf ausgerechnet die
 *   billigen Renditebringer, die die Finanzierungszeit des grossen Postens senken
 *   sollen. Die Reserve ist jetzt auf HOLD_MAX_FRAC (50 %) des verfuegbaren
 *   Kontostands gedeckelt; naeher am Ziel greift der Deckel von selbst nicht mehr.
 *
 *
 * ===========================================================================
 * v3.0 — DER SPARTOPF WAR EINE BUCHHALTUNG OHNE DECKUNG
 * ===========================================================================
 *
 * BEFUND aus mehreren Livelaeufen: das Geld sank, waehrend Pool, Level und
 * Threads wuchsen. Im Logbuch stand im Sekundentakt
 *     PORTFOLIO $3.08b -> $0        (Liquidation fuers Sparziel)
 *     PORTFOLIO $0 -> $2.54b        (zwei Sekunden spaeter wieder gekauft)
 * Bei $100k Gebuehr je Transaktion und dem Spread zwischen Ask und Bid kostet
 * jede Runde echtes Geld — und das Ziel (Congruity-Graft, $150t) war bei den
 * gemessenen Einnahmen nie erreichbar. In BN12 dasselbe Bild mit dem 4S-API-Ziel:
 *     LIQUID Anforderung $0 -> $265.20m -> $0     innerhalb von zwei Sekunden
 *
 * URSACHEN, drei Stueck, und sie verstaerken sich gegenseitig:
 *
 *   1. DER SPARTOPF KONNTE NIE WACHSEN. accrueSavings() deckelt ihn je Tick auf
 *      `money + portfolio`. Er ist damit per Konstruktion nie groesser als die
 *      liquide Masse — ein Ziel oberhalb des Kontostands ist unerreichbar,
 *      unabhaengig von der Sparrate. Live sichtbar am Oszillieren:
 *      $15,20m -> $16,73m -> $15,01m -> $23,10m, dem Kontostand folgend.
 *
 *   2. KEINE ERREICHBARKEITSPRUEFUNG. currentGoal() nahm das erste Ziel der
 *      Kette, egal ob es in Stunden oder in Jahren finanziert waere. Ein
 *      unerreichbares Ziel blockiert dann dauerhaft: goalState.active sperrte
 *      den Aktienrueckkauf, sperrte Sleeve-Augs ab 90 % Deckung und drosselte
 *      INFRA auf 70 %.
 *      Der 4S-API-Fall war ein echter Deadlock: das Ziel verlangte
 *      `Portfolio >= Preis/2`, waehrend die Liquidation dasselbe Portfolio
 *      staendig leerte. Es konnte sich nie aufbauen.
 *
 *   3. DIE RANGLISTE RECHNETE, ENTSCHIED ABER NICHTS. buildBuyList/rankStep
 *      standen seit v2.0 als DIAGNOSE im Code ("KAUFT NICHTS"); gekauft wurde
 *      weiter nach dem alten Zins-Gate ("ist das besser als der Trader?") statt
 *      nach der Rangfolge ("was ist von allem das Beste?").
 *
 * A) RESERVE ERSETZT DEN SPARTOPF. Es wird nicht mehr "gespart", sondern nicht
 *    ausgegeben:
 *        RESERVE = Betriebssockel (10m) + Kosten des HOLD-Postens
 *    Der Betriebssockel deckt Reisen ($200k je Fahrt), Klinik und Kleinkram; die
 *    Kaufziel-Reserve liegt darueber und wird nur fuer ihr Ziel angetastet.
 *    Investitionsbudget ist damit `Cash - RESERVE - offene Freigaben`. Der
 *    Zaehler `savings` bleibt als ANZEIGE erhalten (Port 14, DIAG), entscheidet
 *    aber nichts mehr.
 *
 * B) ERREICHBARKEIT ENTSCHEIDET, OB EIN ZIEL LAEUFT. goalEta() rechnet
 *    (Kosten - liquide Masse) / Einkommen. Ueber GOAL_MAX_ETA_MS wird das Ziel
 *    VERTAGT statt aktiviert — kein goalState.active, keine Sperren, keine
 *    Liquidation. Es bleibt sichtbar (Port 14) und wird von selbst aktiv, sobald
 *    das Einkommen reicht. Damit entfaellt die Portfolio-Vorbedingung des
 *    4S-Ziels ersatzlos: die ETA sagt dasselbe, ohne sich selbst zu blockieren.
 *
 * C) DIE ALTEN SPERREN SIND WEG. Aktienrueckkauf und Sleeve-Augs pruefen nicht
 *    mehr auf ein aktives Grossziel, und infraCash() drosselt nicht mehr. Ihre
 *    Aufgabe uebernimmt die RESERVE aus A: was fuer das Ziel gebraucht wird,
 *    steht dort und ist fuer alle anderen unsichtbar. ZWEI Mechanismen fuer
 *    dieselbe Sache waren schon zweimal die Ursache eines Deadlocks (der
 *    OWNER-Deadlock bei nextRepGoal und der 4S-API-Deadlock).
 *
 * D) DIE RANGLISTE IST SCHARF. Sie ersetzt das Trader-Zins-Gate in hacknetStep
 *    und serverStep: gekauft wird, wenn die Option in der Rangfolge oben steht,
 *    nicht wenn sie den Trader schlaegt. Der Trader-Zins bleibt als
 *    Vergleichswert in der Liste (er IST eine Option), verliert aber sein
 *    Veto-Recht. Der Sockel-Kauf (1x je Minute) entfaellt damit — er war die
 *    Notbremse gegen genau dieses Veto.
 *
 * E) HASH-UNTERGRENZE. Der Hacknet-Zweig verkaufte Hashes ohne jede Untergrenze
 *    bis zum Bedarf, waehrend der freie Verkauf `keepFloor` respektiert. Live
 *    standen deshalb 7 Hashes im Bestand, wo ein Zielboost 50 und ein Contract
 *    25 kostet — beide Leitern waren strukturell unerreichbar. Jetzt gilt
 *    keepFloor fuer BEIDE Zweige.
 *
 * ===========================================================================
 * v2.1 (Aug-Fokus, Rundenende, Reset-Phase)
 * ===========================================================================
 *
 * v2.1 — AUG-FOKUS, RUNDENENDE UND RESET-PHASE.
 *
 *   1) KAUFREIHENFOLGE UMGEDREHT. AugmentationHelpers.getAugCost:
 *          moneyCost = baseCost * B^k
 *      mit B = CONSTANTS.MultipleAugMultiplier (1.9, per SF11 bis 0.93) und
 *      k = Zahl der bereits gekauften Nicht-SoA-Augs dieser Runde. Der
 *      Multiplikator haengt NUR an der Anzahl. Die Gesamtkosten einer festen
 *      Menge, Summe(base_i * B^Pos_i), werden also minimal, wenn das TEUERSTE
 *      Aug den KLEINSTEN Exponenten bekommt. pickCheapestAug() machte exakt das
 *      Gegenteil — die teuerstmoegliche Reihenfolge. Beispiel mit Basispreisen
 *      7.5/12/28/62/250 Mio. und B = 1.9: 3815 Mio. gegen 649 Mio., Faktor 5.9
 *      fuer dasselbe Ergebnis. Ersetzt durch planAugRound(): Zielmenge bilden,
 *      absteigend nach Preis abarbeiten, dafuer ansparen statt auszuweichen.
 *      Die Luecke wird ueber das Portfolio geschlossen (Liquidationsgrund "aug").
 *
 *   2) OBERGRENZE JE RUNDE (AUG_ROUND_MAX = 5). Bei B = 1.9 kostet das sechste
 *      Aug das 25-fache seines Basispreises; ab da ist der Install billiger als
 *      der Nachkauf, weil k danach wieder bei 0 anfaengt.
 *
 *   3) RUNDENENDE STATT STUECKZAHL. checkResetReady() fragte "mindestens 5 Augs
 *      gekauft + 10 min Ruhe". Jetzt: "kein unbesessenes Aug haengt noch am Ruf
 *      UND die Zielmenge ist abgearbeitet". Zweiter Ausgang: alles freigeschaltet,
 *      aber das naechste Aug seit AUG_WAIT_MAX_MS unbezahlbar -> Install ist der
 *      bessere Weg. Das Ruhe-Fenster bleibt als Rueckfall.
 *
 *   4) RESET-PHASE. Sobald die Runde durch ist: keine Infrastruktur mehr
 *      (Prestige.ts loescht beim Install ALLE gekauften Server und setzt Hacknet
 *      zurueck; home-RAM/-Cores ueberleben und bleiben erlaubt), Portfolio
 *      komplett liquidieren (Grund "reset", hoechster Vorrang), und erst wenn das
 *      Portfolio leer ist, wird der TRADER gestoppt. Vorrang der
 *      Liquidationsgruende: reset > goal > aug > infra.
 *
 * ---------------------------------------------------------------------------
 * v2.0-diag
 *
 * v2.0-diag — KAUF-RANGLISTE, zunaechst NUR ALS DIAGNOSE. Kauft nichts; alle
 *   bestehenden Schritte laufen unveraendert weiter. Zweck: einen Zyklus lang
 *   pruefbar machen, WAS BANK kaufen wuerde und in welcher Reihenfolge, bevor die
 *   Liste ueber Geld entscheidet.
 *
 *   BEFUND, der dazu fuehrte: BANK rechnet die richtigen Zahlen laengst aus —
 *   Hacknet (gain x $/Hash x 3600)/cost, pserv (gainGb x emaHackGb x 0.5)/cost,
 *   Trader traderRatePerH() — benutzt sie aber als SPERRE ("ist das besser als der
 *   Trader?") statt als RANGLISTE ("was ist von allem das Beste?"). Daneben lief
 *   eine parallele Ziel-Schicht mit stillen Vorbedingungen: der 4S-API-Deadlock
 *   (Portfolio >= Preis/2 bei dauerhaft 0 Portfolio) und goalState.active, das den
 *   Aktienrueckkauf nie zuliess.
 *
 *   MODELL: eine Liste aller Posten mit Kosten und — wo messbar — Rendite/h.
 *   Bezahlbares nach Rendite sortiert; Unbezahlbares nach FINANZIERUNGSZEIT
 *   ((Kosten - frei)/Einkommen). Nur Posten im Fenster 1-15 min werden zum HOLD und
 *   blockieren; weiter entfernte werden ignoriert, damit erst die billigen
 *   Renditebringer das Einkommen heben und ihre Finanzierungszeit senken. Damit
 *   entfaellt jede geratene Prioritaetentabelle und jeder willkuerliche Anteil.
 *
 *   NEUBERECHNUNG NUR BEI BEDARF (Kauf | Level-Anstieg | gang-/blade-Aenderung |
 *   60-s-Netz). Zwischen Kaeufen ist die Rangfolge konstant; nur die Bezahlbarkeit
 *   waechst laufend, und das ist ein Vergleich. Heute laeuft buildRateOptions() an
 *   drei Stellen, eine in einer while-Schleife: bei 16 Knoten 65 API-Aufrufe je
 *   Durchlauf, mehrfach pro Takt, meist ohne Kaufergebnis.
 *
 *   Gang und Bladeburner muessen NICHTS melden — INFO veroeffentlicht ihre
 *   Kennzahlen, BANK schaut hin (Grundwahrheit statt Meldepflicht).
 *
 * v1.9 — AKTIENRUECKKAUF entsperrt
 *
 * v1.9 — AKTIENRUECKKAUF entsperrt. sellCooldown sperrte den Rueckkauf mit, obwohl
 *   der Cooldown zu sellShares gehoert — die API-Doku zu buyBackShares nennt keinen
 *   (NetscriptDefinitions:10631-10639). Live stand er dauerhaft bei 90-100k ms, weil
 *   zuvor verkauft wurde; der Rueckkauf war damit praktisch nie moeglich.
 *   OFFEN BLEIBT die zweite Sperre: `if (goalState.active) return;`. Solange ein
 *   Sparziel laeuft (im Nachtlauf durchgehend FOURS_API), wird nie zurueckgekauft.
 *   Das loest sich mit dem Ersatz der Ziel-Schicht durch RESERVE + HOLD, nicht hier.
 *
 * v1.8 — REP-WAHL ABGEGEBEN
 *
 * v1.8 — REP-WAHL ABGEGEBEN. nextRepGoal und publishRepTarget sind ENTFERNT; die
 *   Wahl liegt vollstaendig bei WORK (v3.5). Begruendung: BANK kannte weder
 *   CANNOT_WORK noch die Gang-Faktion noch die Mitgliedschaften und schlug deshalb
 *   zweimal Faktionen vor, fuer die WORK nicht arbeiten kann. Die beiden Filter, die
 *   ich dafuer in v1.6 und v1.8 nachgeruestet hatte (gangFac, joinedFacs), waren
 *   Pflaster an der falschen Stelle und fallen mit weg — WORK besitzt den Work-Slot,
 *   also gehoert die Entscheidung dorthin. BANK bleibt zustaendig fuer Geld, Hashes,
 *   Hacknet, Infrastruktur, den Aug-KAUF (Port 18) und die Reset-Bereitschaft
 *   (Port 19). Dass BANK den Aug-Katalog liest, machte sie nicht zum Besitzer der
 *   Rep-Entscheidung — das war der Denkfehler bei der AUGS-Entkernung.
 *
 * v1.7 — RESET-BEREITSCHAFT
 *
 * v1.7 — RESET-BEREITSCHAFT (checkResetReady, Port 19). BANK entscheidet, wann ein
 *   Aug-Install faellig ist; ausgefuehrt wird er von der Queen ueber den RESET-
 *   One-Shot. Gezaehlt wird aus dem INFO-augs-Block: owned minus installed = die
 *   Warteschlange (braucht INFO >= v1.3; ohne `installed` meldet BANK bewusst
 *   nichts statt zu raten). Bedingungen: >= 5 Spieler-Augs (NeuroFlux zaehlt NICHT,
 *   sonst loest Nachkauf den Reset dauernd aus), 10 min ohne Neuzugang (sonst
 *   resettet man mitten in einer Kaufserie), 60 min seit dem letzten Aug-Reset
 *   (schuetzt vor einer Reset-Schleife), kein Grafting (ein Install verwirft die
 *   Arbeit). Der Port wird JEDES Mal geschrieben — auch mit null, damit die Meldung
 *   von selbst verschwindet, sobald eine Bedingung wegfaellt. Dafuer liest
 *   io.refresh jetzt auch den work-Block.
 *
 * v1.6 — nextRepGoal schließt die GANG-Faktion aus. Für sie lehnt die Engine
 *   workForFaction grundsätzlich ab (Singularity.ts: "you are managing a gang for
 *   it"), WORK verbrennt daraufhin alle drei Arbeitsarten und fällt in den
 *   Firmenzweig. Live nachgewiesen mit "Slum Snakes": Rep-Ziel gesetzt, drei RPC-
 *   Antworten {ok:true,res:false}, danach 594 Zyklen Firmenarbeit bei FoodNStuff.
 *   Die Augs der Gang-Faktion bleiben kaufbar — ihr Rep wächst über die Gang.
 *   Dafür liest io.refresh jetzt auch den gang-Block.
 * Ökonomie-Hauptdaemon: ALLES, was Geld oder Hashes ausgibt.
 *
 * ===========================================================================
 * v1.4 — AUG-KÄUFER VEREINHEITLICHT. BANK wählt selbst das zu kaufende Aug
 *   (billigstes rep-erreichbares, aus INFO-augs/rep-Block) und legt es auf
 *   Port 18 (AUG_BUY); der AUGS-One-Shot kauft nur noch, was dort steht, und
 *   beendet sich. Kein blindes AUGS-WANT — nur bei bezahlbarem Ziel. BANK meldet
 *   WORK zusätzlich das nächste Rep-Ziel (nextRepGoal -> Port 17). rep-Block zu
 *   io.refresh ergänzt. KEIN Großziel-Block (späte Augs teurer als Corp/Trader).
 *   NFG läuft als normales Ziel mit, zählt separat (nicht zur Reset-Schwelle).
 *
 * v1.3 — HACKNET-KOSTEN-BUGFIX (Engine-APIs statt nachgebauter Formeln).
 *   Die selbst gerechneten Kosten ignorierten die vier Kosten-Multiplikatoren
 *   (mults.hacknet_node_*_cost). Messung: +111 % (RAM/Core) bis +176 % (Server)
 *   über den echten Kosten -> Zins-Gate hielt Hacknet für 2-3x unrentabler,
 *   kaufte zu wenig (neue Server am stärksten benachteiligt). FIX: buildRate-
 *   Options + cacheStep nutzen getLevelUpgradeCost / getRamUpgradeCost /
 *   getCoreUpgradeCost / getCacheUpgradeCost / getPurchaseNodeCost (echte Kosten
 *   inkl. Mults, Infinity am Maximum). RAM-neutral. hnRate unverändert korrekt.
 *
 * v1.2 — HACKNET-PRIORITÄT (Livetest-Befund: "Hash-Produktion liegt brach")
 * ===========================================================================
 *   1) CACHE = PRODUKTIONSPUFFER: Kapazität wird zins-frei auf mindestens
 *      Produktion×600s gehalten (zusätzlich zur Port-9-Ziel-Regel). Volle
 *      Kappe = Totalverlust jedes weiteren Hashes — die alte, rein ziel-
 *      getriebene Regel kaufte ohne gemeldetes teures Ziel NIE Cache.
 *   2) RATE-DECKEL 50%/h: Die Trader-MOMENTANrate ist kein Dauerzins
 *      (Positionslimits sättigen) — ein heißer 4S-Lauf konnte vorher den
 *      gesamten Hacknet-Ausbau einfrieren.
 *   3) SOCKEL: blockt das Gate alles, kauft die BANK trotzdem 1× je Minute
 *      die beste leistbare Option (stetiger Grundausbau).
 *   4) HASH_BONUS 1.5 -> 2.0 (SP/Rank-Exchange Richtung Daedalus, Corp-
 *      Research: Zweitnutzen > reiner Verkaufskurs).
 *   5) Tail-Diagnose "[HN] Prod | Kap (Füllstand) | Gate vs beste Option".
 *
 * ===========================================================================
 * v1.1 — CORP-AKTIEN: RÜCKKAUF + sellShares ALS DRITTE LIQUIDITÄTSQUELLE
 * ===========================================================================
 *   CORP (v0.18) meldet Aktien-Zustand + Absichten auf Port 31; die Aktien
 *   gehören finanziell der BANK (CORP baut, BANK finanziert):
 *   - corpBuybackStep(): kauft Corp-Aktien vom Markt zurück, sobald der
 *     Rückkauf sich gegen den Trader-Zins lohnt — Vergleichsgröße ist die
 *     Dividendenrendite je Aktie (dividendRate × Profit/s ÷ Marktwert der
 *     Aktien). Kauf aus infraCash(), NIE bei aktivem Großziel, gedrosselt in
 *     Tranchen (Preis steigt beim Kauf). Cooldown-bewusst.
 *   - sellShares als GROSSZIEL-LIQUIDITÄT: reicht Cash+Portfolio für ein
 *     Großziel nicht, verkauft die BANK Corp-Aktien (wie kurzfristiges
 *     Aktien-Liquidieren) — ABER nur bis zur Eigentums-Untergrenze (>= 2/3
 *     bleiben beim Spieler, floorOwnFrac aus der CORP_INFO), cooldown-bewusst,
 *     und Rückkauf pausiert, solange ein Großziel läuft. Reihenfolge der
 *     Deckung: Cash -> Portfolio (Port 27) -> Corp-Aktien.
 *
 * ===========================================================================
 * v1.0 — MARKT-LEITER, GROSSZIELE (REALWERTE), ALLOKATIONS-ZINS, SLEEVE-AUGS
 * ===========================================================================
 *
 * 1) IO-SCHICHT (Muster aus WORK v2): Reads zuerst aus dem INFO-Snapshot
 *    (Port 28, 0 GB), Aktionen als RPC über Port 29/30; ohne frischen
 *    Snapshot voller evalNs-Fallback. Eine Wahrheit je Tick.
 *
 * 2) MARKT-ZUGANGS-LEITER (kaufte bisher NIEMAND im Schwarm):
 *    WSE (200m) -> TIX (5b) -> 4S-Data (1b×Mult) direkt aus freiem Cash,
 *    VOR den INFRA-Käufen im Tick. 4S-API (25b×Mult) läuft als GROSSZIEL.
 *    Preise der 4S-Stufen: exakt aus INFO-bn.mults (SF5), sonst adaptive
 *    Schätzung (Start Basispreis; lehnt purchase* trotz Deckung ab -> ×1.5).
 *
 * 3) GROSSZIEL-KETTE MIT REALWERTEN — behebt den v0.x-Konstruktionsfehler:
 *    Der Spartopf (savings) war reine BUCHHALTUNG; das Geld dahinter gaben
 *    TRADER und INFRA längst aus. "savings >= 150b" konnte wahr sein,
 *    während real 10b Cash da waren -> createCorporation lehnte ab,
 *    tryLiquidateFor forderte die falsche Lücke an. JETZT zählt die LIQUIDE
 *    MASSE: liquid = (Cash - Float) + Portfolio (Port 26). Kette (genau EIN
 *    aktives Ziel): 4S-API (erst wenn Portfolio >= Preis/2 — Forecasts ohne
 *    Kapital nützen nichts) -> Corp 150b -> Congruity. Ablauf: liquid >=
 *    Preis×1.05 -> Lücke liquidieren (Port 27) -> Cash da -> Kauf (RPC) ->
 *    savings um den Preis abbuchen. 4S-API VOR Corp: die Forecast-Daten
 *    compoundieren das Corp-Sparen, umgekehrt nicht. Corp-Autogründung
 *    bestätigt (Doktrin-Entscheid) — der alte "manuell"-Kommentar ist raus.
 *    Sparquote dynamisch: 5 % ohne, 30 % mit aktivem Großziel; real
 *    umgesetzt als INFRA-Bremse (infraCash = cashAvail × 0.7 bei Ziel).
 *    savings wird je Tick auf (Cash+Portfolio) GEDECKELT — nie wieder
 *    Phantom-Deckung.
 *
 * 4) ALLOKATIONS-ZINS Hacknet/pserv <-> Trader (statt Wer-zuerst-kommt):
 *    BANK misst die reale Trader-Stundenrendite (EMA über realisierte
 *    Aktien-Gewinne aus getMoneySources ÷ Portfolio) und das Hacking-
 *    Einkommen je Pool-GB. Eine INFRA-Option wird nur gekauft, wenn ihre
 *    Rendite/h >= Trader-Zins (Floor 10 %/h ab TIX; ohne valide Messung
 *    kauft INFRA frei wie bisher — keine Frühspiel-Blockade). Hacknet-Gain
 *    ×1.5, solange Bladeburner/Corp Hashes verbrauchen (Strategiewert).
 *    RÜCKRICHTUNG: schlägt die beste INFRA-Option den Zins um >=1.5×
 *    (Hysterese) und Cash fehlt, fordert BANK die Lücke über Port 27 an —
 *    aber NIE, solange ein Großziel aktiv ist (ein Liquidations-Port, ein
 *    Eigentümer: setLiquidation() mit Vorrang goal > infra). pserv-Enabler:
 *    der erste Host >= 256 GB (INFO-Daemon!) wird ohne Zins-Gate gebaut.
 *    Feste $-Schwellen gibt es bewusst NICHT: die Stufenkosten wachsen
 *    exponentiell, der Ertrag nicht — der ROI-Vergleich kippt von selbst
 *    und stimmt in jeder BitNode. NEU außerdem: hashesWorthless (BN-Gate)
 *    stoppt Hacknet-Rate-Käufe komplett (kaufte bisher blind weiter).
 *
 * 5) SLEEVE-AUGS (kaufte bisher niemand; WORK v2 liefert Shock=0):
 *    Quelle sleeves-Block (shop je Sleeve). Regel: shock===0, billigste
 *    zuerst, Einzelpreis <= 2 % der liquiden Masse, max 3 Käufe je Runde
 *    (60-s-Drossel), gesperrt wenn ein Großziel >= 90 % Deckung erreicht
 *    hat (kurz vor Auslösung nichts anknabbern). Kauf via RPC.
 *
 * 6) HOME-RAM: Kostenquelle jetzt INFO-market-Block (0 GB) statt eigenem
 *    evalNs; Kauf via RPC. Entscheidungsregel (Bias vs. pserv) unverändert
 *    und BEWUSST ohne Zins-Gate: Home-RAM ist Daemon-Infrastruktur (RAM),
 *    keine Geldanlage.
 *
 * ===========================================================================
 * ÄNDERUNGEN in v0.3
 * ===========================================================================
 * - KEIN EIGEN-DEPLOY MEHR. BANK startete TRADER und AUGS selbst und rief dafür
 *   alle 6 s zweimal findDaemon() — je ein NETZWEITER ps()-Scan, nur zur
 *   Buchführung. Schlimmer: sie umging die Reservierung der Queen. Die Queen hielt
 *   RAM auf Host A frei, BANK startete via pickHost auf Host B -> exec konnte an
 *   PID 0 scheitern oder laufende Worker verdrängen.
 *   JETZT: sendSpawnWant/sendSpawnDrop auf Port 22. Die Queen deployt. Null Scans.
 *
 * - HOME-RAM ÜBERNOMMEN (von ARSENAL). Der Ausbau war ein EINMALIGER Bootstrap-
 *   Schritt mit dem Casino-Geld — danach schaute nie wieder jemand hin. Home-RAM
 *   konkurriert aber mit pserv und Hacknet um denselben Geldbeutel; drei getrennte
 *   Käufer ohne gemeinsame Sicht können nicht priorisieren.
 *   JETZT: laufender $/GB-Vergleich home vs. pserv (homeRamStep, alle 30 s).
 *   ARSENAL baut nur noch das MINDESTMASS aus, damit die Queen überhaupt passt
 *   (sonst Henne-Ei: keine Queen -> keine BANK -> kein Ausbau).
 *
 * - markTopoDirty() nach pserv-Kauf/-Upgrade und Home-RAM-Ausbau: der
 *   Topologie-Cache (HELPERS) muss wissen, dass sich maxRam geändert hat.
 *
 * - BANK bleibt EINZIGER Hash-Ausgeber. WORK rief bis v0.7 selbst spendHashes für
 *   "Improve Gym Training" — behoben: WORK meldet jetzt nur noch { doing: "GYM" }
 *   auf Port 8, die BANK entscheidet und kauft.
 *
 * ===========================================================================
 * (Fortsetzung des ursprünglichen Kopfes)
 *
 * SCHWARM-BANK.js — v0.2 (zentraler Ökonomie-Daemon)
 *
 * GEAENDERT ggü. v0.1 (PAYLOAD-UMBAU):
 *   - INFRA GEMERGT: SCHWARM-INFRA.js (pserv-Kauf via ns.cloud.* + effizienz-
 *     getriebener Hacknet-Kauf/Cache) läuft jetzt in BANK. Der frühere Port-8/9-
 *     Handshake INFRA<->BANK wird zu INTERNEN Aufrufen: BANK kennt die Hacknet-
 *     Geld-Lücke (hacknetShortfall) und den Cache-Bedarf (cacheNeed) direkt. Ein
 *     Prozess und eine Datei weniger. SCHWARM-INFRA.js entfällt.
 *   - STRUKTUR: INFRA-Käufe + der Geld-Block laufen jetzt JEDEN Tick, unabhängig
 *     von Hash-Servern (pservs/Hacknet/Sparen/Corp brauchen keine Hashes). Nur die
 *     Hash-AUSGABE-Leiter bleibt hash-server-gated (idle, wenn keine existieren).
 *   - PAYLOADS: BANK startet jetzt seine owner-Daemons TRADER (persistent) und
 *     AUGS (event-getrieben, im Intervall) selbst — materialize() aus PAYLOADS +
 *     deployDaemon(), gesteuert über isDaemonEnabled (Dashboard-Schalter bleiben
 *     wirksam) + Capability. Vorher führte die Queen sie.
 *   - ANTRAGS-TTL: Fund-Anträge, die STALE_REQ_MS nicht erneuert wurden, verfallen
 *     automatisch. Robust gegen abgestürzte Consumer UND gegen den geplanten AUGS-
 *     One-Shot (der seinen activeReq-Zustand zwischen Läufen nicht behält).
 *
 * ================================ HASH-BLOCK ================================
 * Einziger spendHashes-Aufrufer im Schwarm. Prioritätenleiter (Überlauf-Schutz ->
 * Hacknet-Wachstum -> Corp-Fonds -> Bladeburner -> Corp-Forschung -> WORK-Support
 * -> freier Verkauf). Schläft, wenn keine Hash-Server existieren.
 *
 * ================================ GELD-BLOCK ================================
 * SPAREN 5% des Brutto-Zuflusses; Anträge/Freigabe (Port 12/13); Corp-Autogründung
 * "ALPHA" bei $150b. Details siehe Kommentare an den jeweiligen Blöcken.
 *
 * RAM: Hacknet-/cloud-Calls direkt. createCorporation über evalNs (Wegwerf-Skript)
 *   -> burstDaemon-Headroom. host home (pinHost: BANK baut die pservs -> Henne-Ei).
 * On/Off: registry-getrieben über die Queen (START:BANK / STOP:BANK).
 *
 * @param {NS} ns
 */
// Eine Quelle fuer Kopf und Laufzeitmeldung. Bis zum Health-Check am
// 04.09.2026 waren das getrennte Freitexte und liefen auseinander: der
// Kopf sagte eine Version, die Startmeldung im Log eine andere. Beim
// Nachstellen eines Fehlers behauptet das Log damit etwas Falsches.
const VERSION = "5.18";

import {
    drainBankInbox, hasCapability, CAPS, formatNumber, formatMoney,
    publishFundGrants, publishBankInfo, evalNs, sendCmd,
    isDaemonEnabled, readManagedState, scanNetwork, DAEMONS,
    sendSpawnWant, sendSpawnDrop, markTopoDirty,
    bitNodeFeatures, readPortfolioValue, readPortfolioHeld, requestLiquidation,
    readInfoBlock, requestInfoAction, readInfoActionResult,
    readCorpInfo, publishAugBuy, publishResetReady, publishHashInfo,
    readOut, SCHWARM_PORTS,
    planFreigabe,            // v5.2: Freigabe zum Beenden des Durchlaufs
    chronik,                 // v5.11: Handlungsbuch (HELPERS v5.12)
} from "SCHWARM-HELPERS.js";

// v5.2: Der Schluessel zum Weltdaemon. Engine: Augmentations.ts:1953 —
// repCost 2.5e6 bei Daedalus, moneyCost 0, stats "". Der fehlende Nutzen ist
// der Grund, warum BANKs normale Auswahl sie nie vorschlaegt.
const REDPILL_AUG = "The Red Pill";

export async function main(ns) {
    ns.disableLog("ALL");

    // ===================== KONFIGURATION =====================
    const SLEEP            = 2000;     // Basistakt (INFRA-Käufe + Hash + Geld)
    const STALE_MS         = 30_000;   // Bedarfs-Meldungen älter als das = kein Bedarf
    const OVERFLOW_FRAC    = 0.90;     // ab 90% Cap: Zwangsverkauf (Prio 1)
    const SPARE_FRAC       = 0.50;     // unter 50% Cap: kein freier Verkauf (Prio 7)
    const CORP_FUNDS_MIN   = 40e9;     // Corp-Fonds via Hash auffüllen, wenn darunter
    const MAX_LEVEL_BUYS   = 5;        // levelnde Upgrades: max Käufe je Kategorie/Takt
    // ENTFERNT (v0.4): BLADE_MAX_MIN / RESEARCH_MAX_MIN / WORK_MAX_MIN gehörten zur
    // Funktion buyLeveled(), die seit v0.3 durch buyIfWorth() ersetzt und nie mehr
    // aufgerufen wurde. Toter Code.

    // --- NEU (v0.4): Ziel-Boost-Grenzen, am Engine-Quellcode verifiziert ---
    // Server.changeMinimumSecurity(): minDifficulty = Math.max(1, ...) -> HARTER BODEN
    //   bei 1. Jeder weitere "Reduce Minimum Security"-Kauf auf einem Ziel mit minSec 1
    //   verbrennt Hashes ohne jede Wirkung. Bisher wurde das NICHT geprüft.
    // Server.changeMaximumMoney(): Softcap bei 10e12 — darüber wird der +2%-Effekt
    //   massiv gedämpft (n = 1 + (n-1)/ln(aboveCap)/ln(8)). Kaufen lohnt dann kaum noch.
    const MINSEC_FLOOR     = 1.0;      // Engine-Boden: darunter geht minSec nie
    const MAXMONEY_SOFTCAP = 10e12;    // Engine-Softcap für "Increase Maximum Money"
    const BOOST_MAX_BUYS   = 3;        // Ziel-Boost: max Käufe je Kategorie/Takt

    // ===================== INFRA-BLOCK: KONFIGURATION (gemergt) =====================
    // "Schliess alles": eine Forderung, die kein Depot erfuellen kann. runLiquidation
    // bricht ab, sobald "raised >= request" — bei negativem Depotwert braucht es
    // deshalb eine unerfuellbare Zahl, damit wirklich JEDE Position geschlossen wird.
    const LIQ_ALLES      = 1e300;
    const RESERVE_CASH   = 10_000_000;   // 10m Cash-Boden (wie TRADER) — nie für Käufe angefasst
    const MAX_BUYS       = 200;          // Hacknet-Käufe pro Durchlauf (bestes Gewinn/$ zuerst)
    const maxServers     = ns.cloud.getServerLimit();
    // v3.3: Merker, damit "alle auf Maximum" EINMAL im Log steht und nicht in
    // jeder Runde. Wird zurueckgesetzt, sobald wieder etwas aufruestbar ist.
    let pservMaxGemeldet = false;
    // =========================================================================
    // v3.3 BUGFIX — DAS PSERV-LIMIT IST BITNODE-ABHAENGIG, NICHT FEST
    // =========================================================================
    // Hier stand fest 2^20 (1 PB). Die Engine rechnet aber
    //     getCloudServerMaxRam() = CloudServerMaxRam * currentNodeMults.CloudServerMaxRam
    // (Server/ServerPurchases.ts:96, Konstante 1048576 in Server/data/Constants.ts:13),
    // und der BitNode-Faktor ist selten 1 — in BitNode 10 steht er auf 0.5
    // (BitNode.tsx, case 10). Das echte Limit ist dort also 512 TB, nicht 1 PB.
    //
    // WAS DAS ANRICHTETE: die Aufruestung sucht den kleinsten Server und
    // verdoppelt ihn. Stehen alle auf 512 TB, ist das der kleinste, denn
    // 524288 < 1048576 — der Server galt als "noch nicht am Maximum". Als
    // Zielgroesse kam 1 PB heraus, die Engine lehnt das ab, die Kosten kommen
    // als Unendlich oder NaN zurueck, und "budget > upgradeCost" ist falsch.
    // Ergebnis: BANK versucht es in JEDER Runde erneut, es passiert nichts, und
    // es wird auch nichts gemeldet. Von aussen sieht das aus wie "BANK baut
    // trotz riesiger Geldmengen nicht weiter aus".
    //
    // Gemeldeter Stand: 15 Server (das Limit in BN10: 25 * CloudServerLimit 0.6)
    // zu je 524288 GB — beide Grenzen erreicht, aber niemand sagte es.
    //
    // JETZT wird das Limit gefragt, nicht geraten. Der Festwert bleibt nur als
    // Rueckfall, falls die API fehlt.
    const PSERV_MAX_RAM = (() => {
        try {
            const r = ns.cloud.getRamLimit();
            return (typeof r === "number" && r > 0) ? r : Math.pow(2, 20);
        } catch (e) { return Math.pow(2, 20); }
    })();
    const PSERV_MIN_RAM  = 2;               // günstigster Start-Server
    const CACHE_BUFFER   = 1.25;         // Kapazität muss Ziel*Faktor fassen, sonst Cache-Upgrade
    // Hacknet-Server-Konstanten (Bitburner v3.0.1, verifiziert)
    // Hacknet-Konstanten. v1.3: Kosten-Formel-Konstanten entfallen (Kosten aus
    // Engine-APIs, s. buildRateOptions). Es bleiben nur die zwei Werte ohne
    // Kosten-API-Äquivalent: HashesPerLevel (Rate-Schätzung hnRate) und MaxCache
    // (Schleifen-Guard in cacheStep).
    const HS = {
        HashesPerLevel: 0.001,
        MaxCache: 15,
    };

    // ===================== PAYLOAD-BLOCK: KONFIGURATION =====================
    // BANK führt seine owner-Daemons selbst (siehe Kopf). Verwaltung gedrosselt,
    // weil findDaemon() das Netz scannt.
    const PAYLOAD_MS  = 6000;            // Payload-Verwaltung höchstens alle 6s
    const AUGS_MS     = 30_000;          // AUGS-Intervall (event-getrieben, One-Shot-tauglich)
    const STALE_REQ_MS = 90_000;         // Fund-Anträge ohne Erneuerung verfallen danach

    // ===================== v1.0: MARKT-LEITER / GROSSZIELE / ALLOKATION =====================
    const WSE_COST         = 200e6;      // Engine-Fixpreise (StockMarketCosts.ts)
    const TIX_COST         = 5e9;
    const FOURS_DATA_BASE  = 1e9;        // × BN-Mult FourSigmaMarketDataCost
    const FOURS_API_BASE   = 25e9;       // × BN-Mult FourSigmaMarketDataApiCost
    const MARKET_MS        = 20_000;     // Kaufversuchs-Drossel der Zugangs-Leiter
    const GOAL_SAVINGS_RATE = 0.30;      // Sparquote bei aktivem Großziel (sonst SAVINGS_RATE)
    const GOAL_BUY_MARGIN  = 1.05;       // liquid >= Preis×1.05 -> auslösen
    // v3.0: GOAL_NEAR_FRAC entfaellt — die Sleeve-Aug-Sperre bei Zielnaehe ist weg
    // (die RESERVE haelt das Zielgeld ohnehin zurueck, siehe Kopf C).
    // ERREICHBARKEIT: ein Grossziel wird nur AKTIV, wenn es in dieser Zeit
    // finanzierbar ist. Darueber wird es VERTAGT — sichtbar, aber ohne Sperren und
    // ohne Liquidation. 60 min ist bewusst grosszuegig: es geht nicht um "bald",
    // sondern um "ueberhaupt". Live lag Congruity ($150t bei ~$27m/h) bei rund
    // 5,5 Millionen Stunden und blockierte trotzdem alles.
    const GOAL_MAX_ETA_MS  = 60 * 60_000;
    // v4.1: Ersatzmass, wenn KEIN Einkommen messbar ist (dann ist jede ETA
    // unendlich und die Zeitschranke waere eine Dauersperre). Ein Ziel bis zum
    // Fuenffachen der liquiden Masse gilt als erreichbar — das schuetzt weiter
    // vor Anspar-Marathons, blockiert aber nicht die Anschaffung, die das
    // Einkommen ueberhaupt erst ermoeglicht.
    const GOAL_REACH_FACTOR = 5;
    const RATE_FLOOR_PER_H = 0.10;       // Trader-Zins-Floor ab TIX (10%/h)
    // =========================================================================
    // v3.4 — PREISGRENZE FUER HASH-KAEUFE
    // =========================================================================
    // Fast alle Hash-Upgrades werden mit jedem Kauf teurer. Die Engine rechnet
    // (Hacknet/HashUpgrade.ts:72-82) den Preis fuer "count" Kaeufe als
    //     costPerLevel * 0.5 * count * (count + 2*currentLevel + 1)
    // — also linear steigend mit dem bisherigen Stand. "Reduce Minimum Security"
    // kostet 50, dann 100, dann 150 ... "Exchange for Corporation Research" 200,
    // 400, 600 ... Es gibt keine Obergrenze; ohne Schranke kauft BANK immer
    // weiter, solange Hashes im Topf liegen.
    //
    // Die EINZIGE Ausnahme ist "Sell for Money": dort steht "cost: 4" als feste
    // Zahl, nicht als costPerLevel — der Preis steigt NIE. Vier Hashes bringen
    // dauerhaft $1e6, also 250.000 $ je Hash. Das ist der Bodenwert jedes Hashes.
    //
    // Damit ist die Frage "ab wann ist ein Upgrade zu teuer?" beantwortbar: ab
    // dem Punkt, an dem der Verkaufswert der Hashes den Nutzen uebersteigt. Bei
    // 3000 Hashes gibt man 750.000 $ Gegenwert fuer EINEN Schritt aus (z. B.
    // +2 % Maximalgeld auf EINEM Server). Das lohnt frueh und wird spaeter absurd.
    const HASH_MAX_COST    = 3000;       // teurer wird nichts mehr gekauft
    const HASH_BONUS       = 2.0;        // v1.2: 1.5 -> 2.0 — Hash-Zweitnutzen (SP/Rank-
                                         // Exchange Richtung Daedalus, Corp-Research) ist
                                         // strategisch mehr wert als der reine Verkaufskurs.
    const RATE_CAP_PER_H   = 0.50;       // v1.2: Allokations-Deckel — die Trader-MOMENTAN-
                                         // rate ist kein Dauerzins (Positionslimits sättigen);
                                         // mehr als 50%/h friert INFRA nicht mehr ein.
    const CACHE_PROD_BUFFER_SEC = 600;   // v1.2: Kapazität >= Produktion×600s (10-min-Puffer,
                                         // Überlauf = Totalverlust -> Cache-ROI trivial positiv)
    const CACHE_MAX_BUYS_ROUND  = 8;     // v1.2: Cache-Käufe je Runde deckeln (Tick-Schutz)
    const PSERV_DAMP       = 0.5;        // pserv-Ertragsschätzung konservativ dämpfen
    const RATE_MS          = 60_000;     // Messtakt der Einkommensraten
    const RATE_MIN_SAMPLES = 5;          // EMA erst ab so vielen Messungen gültig
    const INFO_PSERV_MIN   = 256;        // Enabler: erster pserv >= 256 GB ohne Zins-Gate
    const SLEEVE_AUG_FRAC  = 0.02;       // Einzelpreis <= 2% der liquiden Masse
    const SLEEVE_AUG_MS    = 60_000;
    const SLEEVE_AUG_MAX   = 3;          // Käufe je Runde (RPC-Zeit begrenzen)
    // ---- Sleeve KAUFEN (v3.4, nur BitNode 10) ----
    // Preise laut Engine (SleeveCovenantPurchases.tsx): 10^n * 10e12, also
    //   1. Sleeve 10 Bio.  2. 100 Bio.  3. 1 Brd.  4. 10 Brd.  5. 100 Brd.
    // Hoechstens fuenf Stueck (MaxSleevesFromCovenant). Der Sprung ist jedesmal
    // Faktor zehn — in der Praxis sind das ein bis zwei Kaeufe je Durchlauf.
    const SLEEVE_BUY_MS    = 60_000;
    // Anteil des verfuegbaren Geldes, den EIN Sleeve kosten darf. Ein Sleeve ist
    // dauerhaft und ueberlebt jeden Reset, rechtfertigt also einen grossen
    // Batzen — aber nicht das ganze Konto, sonst steht der Rest des Schwarms.
    const SLEEVE_BUY_FRAC  = 0.50;
    const RPC_TIMEOUT_MS   = 12_000;
    const RPC_POLL_MS      = 250;
    const CORP_BUYBACK_MS  = 30_000;     // Rückkauf-Takt
    const CORP_PRICE_PREMIUM = 1.10;     // Kurs steigt beim Kauf -> 10 % Aufschlag einkalkulieren
    // v5.9 — RUECKKAUF. Die Engine bietet KEINE Kostenabfrage an: eine Funktion
    // getBuybackSharesCost() gibt es nicht (geprueft in
    // NetscriptFunctions/Corporation.ts). Der Preis muss nachgerechnet werden,
    // siehe rueckkaufKosten().
    //
    // PLANUNGS-DIVIDENDE. Die Rendite eines Rueckkaufs ist die KUENFTIGE
    // Ausschuettung, nicht die heutige. Solange CORP waechst, steht
    // dividendRate auf 0 — mit der heutigen Rate bewertet waere jeder Rueckkauf
    // wertlos. Genau diese Null war der Grund, warum der Posten seit v1.9 in der
    // Rangliste stand und trotzdem nie gekauft wurde: perH war immer 0, der
    // Posten verlor gegen alles. 0.5 ist eine ANNAHME, keine Messung — die
    // Haelfte des Gewinns ausgeschuettet, die andere reinvestiert.
    const RUECKKAUF_PLAN_DIVIDENDE = 0.50;
    // Sicherheitszuschlag auf die errechneten Kosten. Der Kurs laeuft zwischen
    // Berechnung und Kauf weiter (updateSharePrice bewegt ihn je Marktzyklus um
    // bis zu 1 %), und ein zu knapp angespartes Ziel scheitert in
    // buybackSharesFailureReason an "You cannot afford that many shares".
    const RUECKKAUF_PUFFER = 1.05;
    const J = (v) => JSON.stringify(v);

    // ---------- IO-Schicht (Muster WORK v2, abgespeckt) ----------
    const io = {
        mode: "EVAL", seq: 0, b: {},
        refresh() {
            this.b = {
                bn:      readInfoBlock(ns, "bn", Infinity),
                player:  readInfoBlock(ns, "player", 30_000),
                caps:    readInfoBlock(ns, "caps", 45_000),
                market:  readInfoBlock(ns, "market", 300_000),
                corp:    readInfoBlock(ns, "corp", 60_000),
                sleeves: readInfoBlock(ns, "sleeves", 90_000),
                augs:    readInfoBlock(ns, "augs", 300_000),
                rep:     readInfoBlock(ns, "rep", 120_000),
                gang:    readInfoBlock(ns, "gang", 120_000),
                // v4.3: blade FEHLTE. Zeile 998 liest io.b.blade fuer die
                // Rangliste, geladen wurde der Block aber nie — b war also
                // konstant {}, und die Rangliste hat Bladeburner-Aenderungen
                // nie gesehen. Der Kommentar bei RANK_TTL_MS (Zeile 923)
                // versprach ausdruecklich das Gegenteil: "gang- oder
                // blade-Block hat sich geaendert" als Ausloeser fuer die
                // Neuberechnung. INFO veroeffentlicht den Block ohnehin
                // (DIAG-Log: "frisch: player,sleeves,blade,hacknet") — BANK
                // hat ihn nur nicht abgeholt. Dieselbe Frist wie gang.
                blade:   readInfoBlock(ns, "blade", 120_000),
                work:    readInfoBlock(ns, "work", 60_000),
            };
            this.corp = readCorpInfo(ns);      // Port 31 (CORP v0.18) — {} wenn keine Corp
            this.mode = (this.b.bn && this.b.player) ? "INFO" : "EVAL";
        },
        /** Aktion: INFO -> RPC (Port 29/30), sonst evalNs. null = fehlgeschlagen. */
        async act(cmd, args, evalCode) {
            if (this.mode !== "INFO") return await evalNs(ns, evalCode);
            const id = "B" + (++this.seq) + "-" + (Date.now() % 100000);
            if (!requestInfoAction(ns, "BANK", id, cmd, args)) return await evalNs(ns, evalCode);
            const until = Date.now() + RPC_TIMEOUT_MS;
            while (Date.now() < until) {
                const r = readInfoActionResult(ns, "BANK", id);
                if (r) return r.ok ? (r.res === undefined ? null : r.res) : null;
                await ns.sleep(RPC_POLL_MS);
            }
            return null;
        },
    };

    // ---------- Float & liquide Masse ----------
    /** Summe der aktuell publizierten Freigaben (Grants) — gehört den Consumern. */
    const grantSum = (g) => {
        let sum = 0;
        for (const c of Object.keys(g || {})) for (const id of Object.keys(g[c])) sum += g[c][id] || 0;
        return sum;
    };
    /**
     * RESERVE (v3.0) — ersetzt den Spartopf.
     *
     * Es wird nicht mehr GESPART, sondern NICHT AUSGEGEBEN. Zwei Schichten:
     *   1. Betriebssockel RESERVE_CASH (10m): deckt Reisen ($200k je Fahrt, WORK
     *      braucht sie fuer Stadt-Faktionen und Gyms), Klinik, Kleinkram. Darf von
     *      Betriebsausgaben angetastet werden, nie von Investitionen.
     *   2. Kaufziel-Reserve: die Kosten des HOLD-Postens aus der Rangliste. Sie
     *      liegt OBEN DRAUF und wird nur fuer ihr Ziel angetastet.
     * Offene Freigaben zaehlen weiter dazu — sie gehoeren den Consumern.
     *
     * WARUM DAS DEN ALTEN SPARTOPF ERSETZT: accrueSavings() deckelte ihn je Tick
     * auf `money + portfolio`, er konnte also nie ueber den Kontostand wachsen.
     * Ein Ziel darueber war unerreichbar, egal welche Sparrate. Die RESERVE
     * dagegen ist keine Ansammlung, sondern eine Sperre auf vorhandenes Geld —
     * sie kann nicht "leerlaufen".
     */
    // v3.1 BUGFIX: DIE HOLD-RESERVE DARF NICHT ALLES BINDEN.
    //
    // v3.0 reservierte den VOLLEN Preis des HOLD-Postens. Live: Kontostand $18,53m,
    // HOLD $10,24b -> RESERVE $10,25b -> "Frei: $0 fuer Investitionen". BANK kaufte
    // gar nichts mehr: keine Hacknet-Upgrades, keine pservs, keine Augs, solange
    // gespart wurde. Das widerspricht der Begruendung, die im Rangliste-Kommentar
    // selbst steht — "erst die billigen Renditebringer, die das Einkommen heben und
    // damit seine Finanzierungszeit senken". Genau die waren blockiert. Aus einer
    // Priorisierung war eine Totalsperre geworden.
    //
    // Jetzt gedeckelt auf HOLD_MAX_FRAC des Kontostands. Der grosse Posten wird
    // geschuetzt, sobald er in Reichweite ist (dann greift der Deckel ohnehin nicht
    // mehr), und darunter bleibt immer Luft fuer die kleinen Renditebringer.
    const HOLD_MAX_FRAC = 0.50;
    // try/catch gegen die Temporal Dead Zone: `rank` wird weiter unten deklariert.
    // Zur Laufzeit (Hauptschleife) ist es da; ein Aufruf davor liefert 0 statt zu werfen.
    const holdCostRaw = () => { try { return (rank.hold && rank.hold.kosten > 0) ? rank.hold.kosten : 0; } catch (e) { return 0; } };
    const holdCost = () => {
        const raw = holdCostRaw();
        if (raw <= 0) return 0;
        const cap = Math.max(0, (money() - RESERVE_CASH)) * HOLD_MAX_FRAC;
        return Math.min(raw, cap);
    };
    const reserveTotal = () => RESERVE_CASH + holdCost() + grantSum(grantedLast);
    /** Betriebs-Float: Sockel + offene Freigaben (OHNE Kaufziel-Reserve). */
    const floatCash = () => RESERVE_CASH + grantSum(grantedLast);
    /** Frei fuer INVESTITIONEN: alles oberhalb der vollen RESERVE. */
    const cashAvail = () => Math.max(0, money() - reserveTotal());
    /** Frei fuer BETRIEBSAUSGABEN (Reisen/Klinik): nur der Sockel bleibt stehen. */
    const opCash = () => Math.max(0, money() - floatCash());
    /**
     * v3.0: KEINE Grossziel-Bremse mehr. Sie war der zweite Mechanismus fuer
     * dieselbe Sache — die RESERVE haelt das Zielgeld bereits zurueck, und zwei
     * Bremsen uebereinander haben schon zweimal einen Deadlock erzeugt. INFRA
     * kauft jetzt aus demselben Budget wie alle anderen.
     */
    const infraCash = () => cashAvail();

    // ---------- v3.3: BitNode-Realitaet ----------
    /** BitNode-Multiplikatoren aus dem INFO-bn-Block (nur mit SF5 vorhanden). */
    const bnMults = () => {
        try { const b = io.b.bn; return (b && b.mults) ? b.mults : null; } catch (e) { return null; }
    };
    /**
     * Ist eine Corp-Gruendung ueberhaupt moeglich? bitNodeFeatures() prueft nur
     * SF3; die Engine lehnt createCorporation aber zusaetzlich ab, wenn
     * CorporationSoftcap < 0.15 (NetscriptDefinitions:10408). In BN8 ist der
     * Wert 0 (BitNode.tsx:781) — dort ist die Gruendung ausgeschlossen.
     * Ohne SF5 (keine Mults lesbar) bleibt es beim alten Verhalten.
     */
    const CORP_SOFTCAP_MIN = 0.15;
    // =====================================================================
    // v5.3 — VON "ERLAUBT" AUF "LOHNT SICH"
    // =====================================================================
    // CORP_SOFTCAP_MIN beantwortet nur, ob die Engine die Gruendung ueberhaupt
    // durchlaesst (Corporation/helpers.ts:74). Das ist die falsche Frage.
    // Gruenden kostet $150.000.000.000 HARTES Bargeld und laeuft mit
    // Prioritaet 1000 vor AUGS (800) und INFRA (400) — es ist die teuerste
    // Einzelentscheidung, die BANK ueberhaupt trifft. "Erlaubt" reicht dafuer
    // nicht.
    //
    // WAS DER SOFTCAP WIRKLICH TUT (Corporation.ts:54 und :195):
    //     tributeModifier = 1 - CorporationSoftcap + 0.15
    //     Auszahlung      = Math.pow(dividends, 1 - tributeModifier)
    // Er ist ein EXPONENT auf die Auszahlung, kein Faktor. Die beiden Unlocks
    // ShadyAccounting (-0.05) und GovernmentPartnership (-0.10) senken
    // tributeModifier um zusammen 0.15 (Corporation.ts:394-398).
    //
    //   Softcap  tribute  Exponent (mit beiden Unlocks)  BitNodes
    //     1.00     0.15        1.00                      1,3,4,5
    //     0.90     0.25        0.90                      2,6,7,10,11,14
    //     0.80     0.35        0.80                      12
    //     0.75     0.40        0.75                      9
    //     0.40     0.75        0.40                      13,15
    //     0.00      —      Gruendung gesperrt            8
    //   (Quelle: BitNode.tsx, switch(n) — je case ein CorporationSoftcap.)
    //
    // Was Exponent 0.40 in Geld heisst: aus $1.000.000.000 Dividende je
    // Zyklus werden 1e9^0.4 = $3.981. Aus einer Milliarde werden viertausend
    // Dollar. Der zweite Weg aus der Corp heraus — an die Boerse gehen und
    // Anteile verkaufen — ist in BN15 zusaetzlich mit CorporationValuation
    // 0.20 belegt (Corporation.ts:223): fuer $150b aus Anteilen braeuchte es
    // eine Bewertung von $750b.
    //
    // In BN13 und BN15 ist die Corp damit keine Geldquelle, sondern ein
    // Geldgrab mit Vorfahrt. Die Schwelle steht bei 0.75 — dem niedrigsten
    // Wert, bei dem von einer Milliarde noch eine Groessenordnung uebrig
    // bleibt (1e9^0.75 = $5.6m).
    //
    // WAS DAS NICHT SAGT: dass eine Corp dort sinnlos waere. Sie ist dort nur
    // kein Weg zu Bargeld.
    //
    // v5.18 (Entscheidung des Spielers, 26.09.2026): auch dort gruenden,
    // sobald es praktisch nichts kostet - wenn die $150b in hoechstens
    // CORP_SCHNELL_SEK hereinkommen. Eine BESTEHENDE Corp wird ohnehin
    // gesteuert (HELPERS v5.17 daemonBereit), auch eine von Hand gegruendete.
    //
    // NEBENWIRKUNG, GEWOLLT: corpErledigt() haengt an corpPossible(). Wo die
    // Gruendung sich nicht lohnt, gilt die Corp-Stufe als abgehakt und die
    // Congruity-/Craft-Phase (v4.7/v4.8) laeuft an, statt ewig zu warten.
    const CORP_SOFTCAP_LOHNT = 0.75;
    const CORP_SCHNELL_SEK   = 60;     // v5.18: schwache Node -> gruenden, wenn $150b in 60 s kommen
    /** true = gruenden, false = nicht (sicher), null = unbekannt (nicht gruenden, nicht abhaken). */
    const corpPossible = () => {
        if (!bitNodeFeatures(ns).corporation) return false;
        const m = bnMults();
        // v5.18: unbekannt heisst NICHT erlaubt. Nach jedem Neuladen fehlt der
        // bn-Block einige Sekunden (Ports leer, INFO noch nicht da) - mit true
        // haette BANK dann in BN13/BN15 gegruendet.
        if (!m || typeof m.CorporationSoftcap !== "number") return null;
        if (m.CorporationSoftcap < CORP_SOFTCAP_MIN) return false;         // Engine sperrt hart
        if (m.CorporationSoftcap >= CORP_SOFTCAP_LOHNT) return true;       // v5.3: lohnt sich
        // v5.18: schwache Node - nur, wenn die Gruendung praktisch nichts kostet.
        // Nachtrag 1: erst mit VOLLEM Median-Puffer (INCOME_SAMPLES, ~70 s).
        // Bei ein oder zwei Messungen ist der "Median" das Maximum - ein
        // einzelner Aktienverkauf haette sonst $150b ausgeloest.
        const rate = incomeRate();
        if (rank.incBuf.length < INCOME_SAMPLES) return null;
        return rate * CORP_SCHNELL_SEK >= CORP_FOUNDING_COST;
    };
    /** v5.18: CORP_OUT ist nur frisch, solange CORP laeuft (Runde ~35 s). */
    const CORP_OUT_FRISCH_MS = 120_000;
    const corpFrisch = (c) => !!(c && c.ts && (Date.now() - c.ts) <= CORP_OUT_FRISCH_MS);
    // =====================================================================
    // v5.4 — IN BN3 IST DIE GRUENDUNG UMSONST
    // =====================================================================
    // Corporation/helpers.ts:71:
    //     if (Player.bitNodeN !== 3 && !selfFund) -> UseSeedMoneyOutsideBN3
    // Umgekehrt gelesen: in BN3 — und NUR dort — darf selfFund=false stehen.
    // Dann zahlt nicht der Spieler, sondern Investoren zahlen Saatgeld ein;
    // costOfCreatingCorporation greift gar nicht erst.
    //
    // BANK rief createCorporation() fest mit selfFund=true auf und fuehrte die
    // $150 Mrd unverhandelt als Grossziel. Das ist ausgerechnet in BN3 falsch —
    // der einen BitNode, in der die Corp der Geldtreiber IST. Dort haette BANK
    // 150 Milliarden angespart, um etwas zu kaufen, das gratis danebenliegt,
    // und die Corp erst Stunden spaeter gegruendet als noetig.
    //
    // Beide Stellen (Rangliste und Grossziel) fragen ab jetzt hier nach.
    const corpSaatgeld = () => (((io.b.bn && io.b.bn.bitNode) || 0) === 3);
    /**
     * v4.8 — "Die Corp-Stufe ist ABGEHAKT" statt "es gibt eine Corp".
     *
     * Die Congruity-Stufe stand hinter corpExists, mit der Begruendung: die Corp
     * hat Geld-Vorrang, beide kosten eine aehnliche Groessenordnung. Das ist eine
     * REIHENFOLGE, keine Voraussetzung — und als Voraussetzung gelesen wird sie
     * in jeder BitNode, in der es gar keine Corp geben KANN, zur Sackgasse:
     * corpExists bleibt fuer immer false, Congruity wird nie gegraftet, und die
     * ganze Craft-Phase (v4.7) laeuft nie an.
     *
     * Live nachweisbar in BN8: CorporationSoftcap = 0, und
     * Corporation/helpers.ts:74 sperrt die Gruendung unterhalb von 0.15 hart ab
     * (createCorporation WIRFT dort sogar, statt false zu liefern). Gleichzeitig
     * ist Grafting in BN8 verfuegbar — es waere also alles da ausser der
     * Erlaubnis, die Stufe zu ueberspringen.
     *
     * Deshalb: erledigt ist die Stufe, wenn die Corp steht ODER wenn sie in
     * dieser BitNode unmoeglich ist. Der Geld-Vorrang bleibt ueberall dort
     * erhalten, wo es ihn ueberhaupt geben kann.
     */
    // v5.18: nur ein SICHERES Nein hakt ab. null (unbekannt) wartet.
    const corpErledigt = () => corpExists || corpPossible() === false;

    /**
     * Erzeugt zusaetzlicher Worker-RAM in dieser BitNode ueberhaupt Geld?
     * ScriptHackMoneyGain 0 (BN8) heisst: der Spieler bekommt aus hack() nichts.
     * Dann ist jeder weitere pserv reine Ausgabe. Ohne SF5 konservativ true.
     */
    const workerRamPays = () => {
        const m = bnMults();
        if (!m || typeof m.ScriptHackMoneyGain !== "number") return true;
        if (m.ScriptHackMoneyGain > 0) return true;
        // =====================================================================
        // v4.9 — "HACKEN ZAHLT NICHT" IST NICHT DASSELBE WIE "RAM ZAHLT NICHT"
        // =====================================================================
        // ScriptHackMoneyGain = 0 heisst: aus hack() kommt kein Dollar. Es heisst
        // NICHT, dass Worker-RAM wertlos ist — denn hack() und grow() bewegen
        // weiterhin KURSE, und zwar in voller Staerke:
        //   NetscriptHelpers.tsx:662  influenceStockThroughServerHack(server, moneyDrained)
        // Uebergeben wird moneyDrained, NICHT moneyGained. Der Multiplikator
        // nimmt einem also die Beute, nicht die Wirkung. Und die Trefferchance
        // ist moneyDrained / server.moneyMax (PlayerInfluencing.ts:34) — mehr
        // Threads bedeuten groessere Bissen und damit mehr Kurswirkung.
        //
        // In BN8 ist die Boerse die einzige Geldquelle. Dort war diese Bremse
        // also genau verkehrt herum: sie stoppte den Ausbau des Apparats, der
        // das Geld verdient. Der Dispatcher fuhr die Beeinflussung laengst mit
        // 70 % des Pools (hackPays=false), waehrend BANK den Pool nicht mehr
        // wachsen liess.
        //
        // Ohne Boersenzugang bleibt es beim alten Urteil: dann bringt hack()
        // wirklich nichts, weder Beute noch verwertbare Kursbewegung.
        return hasCapability(ns, CAPS.TIX);
    };
    /**
     * RAM-Bedarf der pserv-Daemons aus der REGISTRY summieren statt zu raten.
     * PSERV_NEED_FACTOR gibt Luft fuer Fragmentierung (ein Daemon braucht seinen
     * Platz auf EINEM Host) und kuenftige Eintraege.
     */
    const PSERV_NEED_FACTOR = 1.5;
    const pservNeedGb = () => {
        let sum = 0;
        try {
            for (const k of Object.keys(DAEMONS)) {
                const d = DAEMONS[k];
                if (!d || d.virtual || !d.file) continue;
                if ((d.host || "") !== "pserv" || d.pinHost) continue;
                sum += (d.minRam || 0) + (d.burst || 0);
            }
        } catch (e) { sum = 0; }
        return Math.ceil(sum * PSERV_NEED_FACTOR);
    };
    // v3.2: OHNE Portfolio. Frueher: cashAvail() + readPortfolioValue(ns).
    // Das Depot gehoert seit TRADER v1.1 dem Trader und wird nicht mehr
    // angefordert (ausser vor dem Aug-Install, siehe setLiquidation). Zaehlte
    // BANK es weiter mit, haette die ETA-Pruefung Ziele fuer erreichbar
    // gehalten, deren Deckung nie als Cash ankommt — das Ziel haette ewig
    // "spart" gemeldet. Was der Trader ausschuettet, ist Cash und damit ohnehin
    // in cashAvail() enthalten.
    const liquid    = () => cashAvail();

    // ---------- Liquidations-Port: EIN Eigentümer (goal > infra) ----------
    const liq = { owner: null, amount: 0 };
    /**
     * v3.2: NUR NOCH EIN EIGENTUEMER — "reset".
     *
     * Frueher durften vier anfordern (reset > goal > aug > infra). Das erzeugte
     * live ein Kauf-Verkauf-Karussell: eine unerfuellbare Forderung wurde jeden
     * Tick neu gestellt, der Trader liquidierte und kaufte mit dem Erloes sofort
     * nach — vier Kommissionen je Runde ohne Kursbewegung.
     *
     * WARUM "reset" BLEIBT: Prestige.ts:167-169 ruft beim Aug-Install
     * initStockMarket(); das Depot wird zurueckgesetzt und offene Positionen
     * sind ersatzlos weg. Das ist der einzige Fall, in dem eine Anforderung
     * mechanisch noetig ist.
     *
     * WARUM DER REST ENTFAELLT: TRADER v1.1 haelt hoechstens seinen
     * Einsatzdeckel (Einlage + Anteil am eigenen Gewinn) und baut alles darueber
     * von selbst ab. Was BANK braucht, kommt also als Cash an, ohne dass sie es
     * anfordern muss.
     *
     * Ein fremder Eigentuemer wird still ignoriert (return false), damit ein
     * uebersehener Aufrufer nicht das Karussell zurueckholt.
     */
    const setLiquidation = (owner, amount) => {
        if (owner !== "reset") return false;
        if (amount <= 0) {
            if (liq.owner) { liq.owner = null; liq.amount = 0; requestLiquidation(ns, 0); }
            return true;
        }
        liq.owner = owner; liq.amount = amount;
        requestLiquidation(ns, Math.ceil(amount));
        return true;
    };

    // ---------- Einkommensraten (EMA): Trader-Zins + Hacking je Pool-GB ----------
    const hnDiag = { prod: 0, cap: 0, num: 0, gate: 0, bestRate: 0, infra: false };
    const rates = {
        lastTs: 0, lastStock: null, lastHack: null,
        emaStock: 0, stockSamples: 0,       // Anteil/h (z.B. 0.25 = 25%/h)
        emaHackGb: 0, hackSamples: 0,       // $/h je Pool-GB
        poolGb: 0, poolTs: 0,
    };
    const measureRates = () => {
        const now = Date.now();
        if (now - rates.lastTs < RATE_MS) return;
        const dtH = rates.lastTs ? (now - rates.lastTs) / 3_600_000 : 0;
        rates.lastTs = now;
        let src = null;
        try { src = ns.getMoneySources().sinceInstall || {}; } catch (e) { return; }
        // Pool-GB (30s-Drossel reicht nicht — hier im 60s-Takt mitgeführt)
        try {
            let gb = 0;
            for (const h of scanNetwork(ns)) { try { if (ns.hasRootAccess(h)) gb += ns.getServerMaxRam(h); } catch (e2) {} }
            rates.poolGb = Math.max(1, gb);
        } catch (e) { /* alten Wert behalten */ }
        // Index-Zugriff statt .stock/.hacking: Namespace-Namen könnten von der
        // statischen RAM-Analyse gematcht werden (Doktrin: im Zweifel Index).
        const stockNow = Number(src["stock"]) || 0;
        const hackNow  = Number(src["hacking"]) || 0;
        if (dtH > 0 && rates.lastStock !== null) {
            const port = Math.max(1e6, readPortfolioValue(ns));
            const dStock = stockNow - rates.lastStock;
            if (readPortfolioValue(ns) > 1e6) {
                const inst = Math.max(0, dStock) / port / dtH;      // realisierte Rendite/h
                rates.emaStock = rates.stockSamples ? rates.emaStock * 0.9 + inst * 0.1 : inst;
                rates.stockSamples++;
            }
            const dHack = Math.max(0, hackNow - rates.lastHack);
            const instGb = dHack / rates.poolGb / dtH;               // $/h je GB
            rates.emaHackGb = rates.hackSamples ? rates.emaHackGb * 0.9 + instGb * 0.1 : instGb;
            rates.hackSamples++;
        }
        rates.lastStock = stockNow; rates.lastHack = hackNow;
    };
    /** Opportunitätszins des Traders (Anteil/h). 0 = kein Gate (INFRA frei). */
    const traderRatePerH = () => {
        const caps = io.b.caps || {};
        const hasTix = caps.TIX === true || hasCapability(ns, CAPS.TIX);
        if (!hasTix) return 0;
        const measured = rates.stockSamples >= RATE_MIN_SAMPLES ? rates.emaStock : 0;
        // v1.2: nach oben GEDECKELT — Allokationszins, keine Renditeprognose.
        return Math.min(RATE_CAP_PER_H, Math.max(RATE_FLOOR_PER_H, measured));
    };

    // =====================================================================
    // KAUF-RANGLISTE (v2.0, zunaechst NUR DIAGNOSE — kauft nichts)
    // =====================================================================
    //
    // WARUM. BANK rechnet die richtigen Zahlen laengst aus, benutzt sie aber als
    // SPERRE statt als RANGLISTE:
    //     Hacknet:  (gain x $/Hash x 3600) / cost   -> Rendite/h
    //     pserv:    (gainGb x emaHackGb x 0.5) / cost
    //     Trader:   traderRatePerH()
    // und fragt dann jeweils nur "ist das besser als der Trader?". Die richtige
    // Frage ist "was ist von ALLEM das Beste?". Dazu kam eine parallele Ziel-Schicht
    // (currentGoal/goalStep) mit stillen Vorbedingungen — der 4S-API-Deadlock
    // (Portfolio >= Preis/2, Portfolio aber dauerhaft 0) und die Sperre
    // goalState.active, die den Aktienrueckkauf nie zuliess.
    //
    // NEUES MODELL (mit dir abgestimmt):
    //   1. Alles, was Geld kostet, kommt in EINE Liste mit Kosten und — wo messbar —
    //      Rendite/h. Strategische Posten (Marktzugaenge, Corp, Congruity, Augs,
    //      Home-RAM) haben keine Rendite; sie brauchen auch keine.
    //   2. Bezahlbares wird nach Rendite/h sortiert; das Beste gewinnt.
    //   3. Unbezahlbares wird ueber die FINANZIERUNGSZEIT eingeordnet:
    //      (Kosten - frei) / Einkommen_pro_s. Liegt sie unter HOLD_ETA_MS, wird der
    //      Posten zum HOLD und blockiert weitere Kaeufe — er ist ja gleich da.
    //      Liegt sie darueber, wird er IGNORIERT: erst die billigen Renditebringer,
    //      die das Einkommen heben und damit seine Finanzierungszeit senken.
    //      Damit blockiert kein Grossposten mehr, und es braucht keine geratene
    //      Prioritaetentabelle (CONSUMER_PRIO) und keinen willkuerlichen Anteil.
    //
    // NEUBERECHNUNG NUR BEI BEDARF. Die Reihenfolge aendert sich nicht dauernd:
    // Kosten steigen nach einem KAUF (exponentiell), Ertraege ebenfalls. Zwischen
    // zwei Kaeufen ist die Rangfolge konstant — nur die BEZAHLBARKEIT waechst
    // laufend, und das ist ein einziger Vergleich. Heute laeuft buildRateOptions()
    // an drei Stellen, eine davon in einer while-Schleife: bei 16 Knoten sind das
    // 65 API-Aufrufe je Durchlauf, mehrfach pro 2-s-Takt, meist ohne Kaufergebnis.
    //
    // Ausloeser fuer Neuberechnung: Kauf | Hacking-Level gestiegen (schaltet Ziele
    // frei und hebt das Einkommen OHNE Kauf) | gang- oder blade-Block hat sich
    // geaendert | Sicherheitsnetz RANK_TTL_MS. Gang und Bladeburner muessen dafuer
    // NICHTS melden — INFO veroeffentlicht ihre Kennzahlen ohnehin, BANK schaut
    // einfach hin. Dieselbe Doktrin wie beim Dispatcher: Grundwahrheit statt
    // Meldepflicht.
    const RANK_TTL_MS     = 60_000;        // Sicherheitsnetz
    const RANK_INCOME_MS  = 10_000;        // Messfenster der Einkommensrate
    // HOLD-FENSTER. Reserviert wird nur, was tatsaechlich Schutz braucht:
    //   unter HOLD_ETA_MIN_MS -> kommt von selbst, eine Reservierung schuetzt nichts
    //                            (im Test wurde sonst ein 2,1-Mio-Upgrade "in 0 min"
    //                             zum HOLD und haette Kaeufe blockiert — sinnlos)
    //   ueber HOLD_ETA_MAX_MS -> zu weit weg; erst die billigen Renditebringer, die
    //                            das Einkommen heben und die Zeit damit senken
    const HOLD_ETA_MIN_MS = 60_000;
    const HOLD_ETA_MAX_MS = 15 * 60_000;
    const rank = {
        list: null, at: 0, hold: null,
        jetzt: null,           // v3.0: bezahlbare Posten nach Rendite (rankAllows)
        // v3.4: incBuf haelt die letzten INCOME_SAMPLES Momentanwerte; die Rate
        // ist ihr Median (Begruendung an incomeRate()).
        incPerSec: 0, incLast: null, incAt: 0, incBuf: [],
        lastLevel: 0, lastSig: "",
    };

    // v3.4: so viele Messungen gehen in den Median. Sieben bei RANK_INCOME_MS =
    // 10 s decken 70 s ab. Ungerade, damit der Median ein echter Messwert ist.
    const INCOME_SAMPLES = 7;

    /** Gesamt-Einkommen in $/s — Median der letzten Messungen, nicht Mittelwert. */
    const incomeRate = () => {
        const now = Date.now();
        if (now - rank.incAt >= RANK_INCOME_MS) {
            const inc = grossIncome();
            if (rank.incLast !== null && rank.incAt > 0) {
                const dt = (now - rank.incAt) / 1000;
                const d = Math.max(0, inc - rank.incLast);
                const inst = d / Math.max(1, dt);
                // =========================================================
                // v3.4 — MEDIAN STATT MITTELWERT
                // =========================================================
                // Hier stand ein gleitender Mittelwert (0,7 alt + 0,3 neu).
                // Der glaettet einen einzelnen Hack-Treffer, aber NICHT einen
                // Kapitalzufluss: INCOME_KEYS enthaelt "stock" und
                // "corporation", und das Messfenster ist 10 s.
                //
                // Live nachweisbar: ein einmaliger Aktienverkauf ueber $1,68t
                // ergibt inst = 168 Mrd/s. Der Mittelwert uebernimmt davon
                // 30 %, also rund 50 Mrd/s — und mit dieser Rate rechnet BANK
                // dann JEDE Finanzierungszeit. Der Congruity-Graft ($150t)
                // erschien damit rund 50 Minuten entfernt, also unter
                // GOAL_MAX_ETA_MS, und wurde zum aktiven Sparziel. Zwei
                // Messungen spaeter war der Mittelwert abgeklungen und das
                // Ziel wieder weg. Genau dieses Flackern stand im Livelog:
                //     15:57:39  Sparziel CONGRUITY/spart ($838.75b/$150.00t)
                //     15:57:41  Sparziel ... -> —
                // Solange es stand, band die HOLD-Reserve die Haelfte des
                // Kontos ($837.68b = 50 % von $1,68t).
                //
                // Der Median von sieben Messungen (70 s) kann von EINEM
                // Ausreisser nicht bewegt werden — dafuer muessten vier der
                // sieben hoch sein, und das ist dann kein Ausreisser mehr,
                // sondern echtes Einkommen. Eine dauerhafte Aenderung kommt
                // nach vier Messungen an, ein Einmaleffekt gar nicht.
                rank.incBuf.push(inst);
                if (rank.incBuf.length > INCOME_SAMPLES) rank.incBuf.shift();
                const sortiert = rank.incBuf.slice().sort((a, b) => a - b);
                rank.incPerSec = sortiert[Math.floor(sortiert.length / 2)];
            }
            rank.incLast = inc; rank.incAt = now;
        }
        return rank.incPerSec;
    };

    /** Signatur der beobachteten INFO-Bloecke — aendert sie sich, neu rechnen. */
    const rankSignature = () => {
        const g = io.b.gang || {}, b = io.b.blade || {};
        return [g.member, g.power, g.respect, g.territory, b.rank, b.skillPoints].join("|");
    };

    /**
     * Kandidatenliste bauen. perH = Rendite/h als Anteil (0.25 = 25 %/h) oder null
     * fuer strategische Posten ohne messbaren Ertrag.
     * @returns {Array<{was:string, kosten:number, perH:number|null, art:string}>}
     */
    const buildBuyList = () => {
        const out = [];
        const c = capsNow();

        // --- Hacknet: exakt berechenbar (hnRate ist eine Formel, keine Schaetzung) ---
        if (!bitNodeFeatures(ns).hashesWorthless) {
            const dph = hashDollarPerHash() * hashBonus();
            for (const o of buildRateOptions()) {
                if (!isFinite(o.cost) || o.cost <= 0) continue;
                out.push({
                    was: o.kind === "node" ? "Hacknet-Server (neu)" : `Hacknet ${o.kind} #${o.node}`,
                    kosten: o.cost, perH: (o.gain * dph * 3600) / o.cost, art: "hacknet",
                });
            }
        }

        // --- pserv: gemessen ueber emaHackGb, konservativ gedaempft ---
        try {
            const servers = ns.cloud.getServerNames();
            const haveRate = rates.hackSamples >= RATE_MIN_SAMPLES;
            if (servers.length < maxServers) {
                const cost0 = ns.cloud.getServerCost(PSERV_MIN_RAM);
                if (isFinite(cost0) && cost0 > 0) {
                    out.push({ was: `pserv neu (${PSERV_MIN_RAM} GB)`, kosten: cost0,
                        perH: haveRate ? (PSERV_MIN_RAM * rates.emaHackGb * PSERV_DAMP) / cost0 : null, art: "pserv" });
                }
            } else {
                let low = PSERV_MAX_RAM, tgt = null;
                for (const sv of servers) { const r = ns.getServerMaxRam(sv); if (r < low) { low = r; tgt = sv; } }
                if (tgt) {
                    const next = low * 2;
                    const uc = (typeof ns.cloud.getServerUpgradeCost === "function")
                        ? ns.cloud.getServerUpgradeCost(tgt, next) : ns.cloud.getServerCost(next);
                    if (isFinite(uc) && uc > 0) {
                        out.push({ was: `pserv ${tgt} ${low}->${next} GB`, kosten: uc,
                            perH: haveRate ? ((next - low) * rates.emaHackGb * PSERV_DAMP) / uc : null, art: "pserv" });
                    }
                }
            }
        } catch (e) { /* kein cloud-Zugriff */ }

        // --- Corp-Aktien-Rueckkauf: Rendite = Dividende je Aktie ---
        // v5.9 ZWEI KORREKTUREN, beide an derselben Stelle:
        //
        // 1. perH WAR IMMER 0. Gerechnet wurde mit cc.dividendRate — und die
        //    steht auf 0, solange CORP waechst (die Ausschuettung schaltet erst
        //    frei, wenn nichts mehr zu bauen ist). Damit hatte der Posten nie
        //    eine Rendite, verlor gegen jeden anderen und wurde nie gekauft.
        //    Der Nutzen eines Rueckkaufs ist aber die KUENFTIGE Ausschuettung.
        //    Deshalb: die heutige Rate, falls es eine gibt, sonst die Annahme
        //    RUECKKAUF_PLAN_DIVIDENDE.
        // 2. DIE KOSTEN WAREN ZU NIEDRIG. `chunk * sharePrice * 1.10` nimmt den
        //    heutigen Kurs fuer das ganze Paket. Der Kurs steigt aber mit dem
        //    eigenen Anteil (0.5 + sqrt(Anteil)) WAEHREND des Kaufs. Jetzt
        //    dieselbe Rechnung wie im Ziel — sonst steht in der Rangliste ein
        //    anderer Preis als der, der dann tatsaechlich abgebucht wird.
        const cc = io.corp;
        // Nachtrag 1: nur auf frischem CORP_OUT - sonst kann ein Posten zum
        // eingefrorenen Kurs zum HOLD werden und Geld binden.
        if (corpFrisch(cc) && cc.public && (cc.issuedShares || 0) > 0 && (cc.sharePrice || 0) > 0) {
            const total = cc.totalShares || 1;
            const rate = (cc.dividendRate || 0) > 0 ? cc.dividendRate : RUECKKAUF_PLAN_DIVIDENDE;
            const chunk = Math.floor(Math.min(cc.issuedShares, cc.buyback && cc.buyback.chunk ? cc.buyback.chunk : 10e6));
            const kosten = rueckkaufKosten(cc, chunk);
            // Ertrag des PAKETS: sein Anteil an der Ausschuettung, je Stunde.
            const ertragProH = (chunk / total) * rate * Math.max(0, cc.profitPerSec || 0) * 3600;
            const perH = kosten > 0 && isFinite(kosten) ? ertragProH / kosten : 0;
            if (kosten > 0 && isFinite(kosten)) {
                out.push({ was: `Corp-Aktien ${formatNumber(chunk)} zurueck`, kosten, perH, art: "corp-aktien" });
            }
        }

        // --- Strategische Posten: keine Rendite, nur Finanzierungszeit ---
        if (!c.WSE)  out.push({ was: "WSE-Zugang",  kosten: WSE_COST, perH: null, art: "markt" });
        else if (!c.TIX)  out.push({ was: "TIX-API", kosten: TIX_COST, perH: null, art: "markt" });
        else if (!c.DATA) out.push({ was: "4S-Data", kosten: market.est4SData, perH: null, art: "markt" });
        else if (!c.API)  out.push({ was: "4S-API",  kosten: market.est4SApi,  perH: null, art: "markt" });

        if (!corpExists && corpPossible()) {
            const seed = corpSaatgeld();
            out.push({ was: `Corp "${CORP_NAME}"${seed ? " (Saatgeld)" : ""}`,
                       kosten: seed ? 0 : CORP_FOUNDING_COST, perH: null, art: "corp" });
        }
        if (corpErledigt() && !congruityDone && goalState.congruityPrice > 0) {
            out.push({ was: "Congruity-Graft", kosten: goalState.congruityPrice, perH: null, art: "graft" });
        }

        // Home-RAM: Daemon-Infrastruktur, bewusst ohne Renditewert.
        if (io.b.market && typeof io.b.market.homeRamCost === "number" && isFinite(io.b.market.homeRamCost)) {
            out.push({ was: `Home-RAM verdoppeln`, kosten: io.b.market.homeRamCost, perH: null, art: "home-ram" });
        }

        // Naechstes Aug der Runde (v1.9: das TEUERSTE der Zielmenge, nicht mehr
        // das billigste — siehe planAugRound).
        try {
            const pl = planAugRound();
            const pick = pl ? pl.next : null;
            if (pick) out.push({ was: `Aug ${pick.aug}`, kosten: pick.price, perH: null, art: "aug" });
        } catch (e) { /* ohne augs-Block kein Kandidat */ }

        return out;
    };

    /**
     * Rangliste bauen/auffrischen, HOLD bestimmen, ins Log und in den
     * Port-14-Snapshot schreiben.
     *
     * ACHTUNG: das ist KEINE reine Diagnose mehr. Die Rangliste ENTSCHEIDET
     * ueber Geld — hacknetStep() und infraStep() (pserv-Teil) fragen rankAllows(), und
     * ein Nein dort verhindert den Kauf. Der Satz "KAUFT NICHTS" stammt aus
     * der Einfuehrungsphase (v2.0), in der die Reihenfolge einen Zyklus lang
     * nur mitlief, um sie gegen das tatsaechliche Verhalten zu pruefen.
     */
    // v3.4: die einzigen beiden Posten, die ein Softreset vernichtet
    // (Prestige.ts: prestigeAllServers + hacknetNodes.length = 0). Alles andere —
    // Corp, 4S-Zugang, Gang, Bladeburner, home-RAM, die Augs selbst — ueberlebt
    // ihn; die Resets dafuer stehen in prestigeSourceFile, also erst beim
    // BitNode-Wechsel. Nur diese beiden fragen auch rankAllows().
    const RESET_VERLIERT = new Set(["pserv", "hacknet"]);
    // So lange darf ein bezahlbares Aug der Infrastruktur die Vorfahrt nehmen.
    // Fuenf Minuten reichen fuer den 30-s-Takt des AUGS-One-Shots um ein
    // Vielfaches und begrenzen zugleich den Schaden, falls der Kauf klemmt.
    const AUG_YIELD_MAX_MS = 5 * 60_000;
    let augYieldSince = 0;

    const rankStep = () => {
        const now = Date.now();
        let lvl = 0;
        try { lvl = (io.b.player && io.b.player.skills) ? (io.b.player.skills.hacking || 0) : 0; } catch (e) { /* 0 */ }
        const sig = rankSignature();
        const stale = !rank.list
            || (now - rank.at >= RANK_TTL_MS)
            || (lvl !== rank.lastLevel)
            || (sig !== rank.lastSig);
        if (stale) {
            rank.list = buildBuyList();
            rank.at = now; rank.lastLevel = lvl; rank.lastSig = sig;
        }
        const frei = cashAvail();
        const inc  = incomeRate();

        // =================================================================
        // v3.4 — AMORTISATION GEGEN DEN RESET-HORIZONT
        // =================================================================
        // Bis hierher entschied allein die Rendite/h, und Augs tragen perH = null.
        // Sie landeten damit IMMER hinten, hinter jedem Hacknet- und pserv-Upgrade
        // mit messbarem Ertrag — und weil rankAllows() nur von hacknetStep() und
        // serverStep() gefragt wird, konnte ein Aug die beiden nie verdraengen.
        // Live: $1,65 Billionen in 31 Minuten in Server, das offene Aug-Ziel kostete
        // $51 Mrd. Und der Install eine halbe Stunde spaeter hat diese Server
        // wieder geloescht (Prestige.ts, prestigeAllServers).
        //
        // Genau das ist der Punkt: pserv und Hacknet sind die EINZIGEN Posten, die
        // ein Softreset vernichtet. Corp, 4S-Zugang, Gang, Bladeburner, home-RAM
        // und die Augs selbst ueberleben ihn (die Resets dafuer stehen in
        // prestigeSourceFile, also erst beim BitNode-Wechsel).
        //
        // DIE LOESUNG IST VORFAHRT, KEIN DECKEL. Ein bezahlbares Aug nimmt pserv
        // und Hacknet fuer die Dauer des Kaufs die Rangliste weg — mehr nicht.
        // Danach ist es aus der Liste (es ist ja gekauft) und die Infrastruktur
        // laeuft sofort weiter.
        //
        // Warum kein Amortisations-Deckel, obwohl er auf dem Papier eleganter
        // waere: er wuerde greifen, SOBALD das erste billige Aug freigeschaltet
        // ist, und in dem Moment ist der Horizont noch winzig, waehrend sich ein
        // Server erst in Stunden bezahlt macht. Er wuerde also genau den Anlauf
        // abwuergen, um den es hier geht. Die Verschwendung kurz VOR dem Install
        // faengt inzwischen resetPhase ab (infraStep laesst pservs dort aus).
        //
        // BEGRENZT, und das ist wichtig: laesst sich das Aug aus irgendeinem Grund
        // nicht kaufen (Ruf fehlt trotz Katalog, Kauf schlaegt fehl, AUGS startet
        // nicht), stuende die Infrastruktur sonst fuer immer still. Nach
        // AUG_YIELD_MAX_MS endet die Vorfahrt, und pserv/Hacknet duerfen wieder —
        // das Aug bleibt Ziel, blockiert aber nichts mehr.
        const augOffen = rank.list.find(x => x.art === "aug" && x.kosten <= frei) || null;
        if (augOffen) { if (!augYieldSince) augYieldSince = now; }
        else { augYieldSince = 0; }
        const augVorfahrt = !!augOffen && (now - augYieldSince) <= AUG_YIELD_MAX_MS;
        const jetzt = rank.list.filter(x => x.kosten <= frei)
            .filter(x => !(augVorfahrt && RESET_VERLIERT.has(x.art)))
            .sort((a, b) => (b.perH ?? -1) - (a.perH ?? -1));
        // Unbezahlbares nach Finanzierungszeit.
        const spaeter = rank.list.filter(x => x.kosten > frei)
            .map(x => ({ ...x, etaMs: inc > 0 ? ((x.kosten - frei) / inc) * 1000 : Infinity }))
            .sort((a, b) => a.etaMs - b.etaMs);

        // HOLD: der naechstliegende Grossposten, wenn er in Reichweite ist.
        // Nur Posten IM Fenster koennen HOLD werden; der naechstliegende gewinnt.
        rank.hold = spaeter.find(x => x.etaMs >= HOLD_ETA_MIN_MS && x.etaMs <= HOLD_ETA_MAX_MS) || null;
        rank.jetzt = jetzt;
        rank.augVorfahrt = augVorfahrt;   // v5.13: infraBudget gibt den Halt dann nicht frei
        return { jetzt, spaeter, frei, inc, augVorfahrt, augOffen };
    };

    /**
     * DARF DIESE ART JETZT KAUFEN? (v3.0 — die Rangliste wird scharf)
     *
     * Ersetzt das alte Zins-Gate ("ist diese Option besser als der Trader?") durch
     * die Rangfolge ("ist sie das Beste, was ich mir gerade leisten kann?").
     *
     * WARUM DER UNTERSCHIED ZAEHLT: das Zins-Gate war ein VETO. Es verglich jede
     * Option einzeln mit einem Schwellwert und liess sie durch oder nicht — dabei
     * konnte eine Option abgelehnt werden, obwohl es nichts Besseres gab (dann lag
     * das Geld brach), und eine andere durchgehen, obwohl daneben etwas Besseres
     * wartete. Deshalb brauchte v1.2 den "Sockel-Kauf" als Notbremse: 1x je Minute
     * durfte trotzdem gekauft werden, weil das Gate sonst alles blockierte.
     *
     * Jetzt: die besten RANK_TOP_N bezahlbaren Posten sind dran. Mehr als einer,
     * weil die Kaufausfuehrung in getrennten Schritten liegt (hacknetStep,
     * serverStep) — waere nur der Beste erlaubt, wuerde ein Schritt den anderen
     * dauerhaft aushungern, sobald dessen Rendite knapp darunter liegt.
     *
     * Ohne gueltige Rangliste (frueh, keine Messung) wird NICHT gebremst: eine
     * unbekannte Rangfolge darf kein Kaufverbot bedeuten.
     *
     * @param {string} art  "hacknet" | "pserv" | "corp-aktien" | ...
     * @returns {boolean}
     */
    const RANK_TOP_N = 3;
    const rankAllows = (art) => {
        if (!rank.list || !Array.isArray(rank.jetzt) || rank.jetzt.length === 0) return true;
        return rank.jetzt.slice(0, RANK_TOP_N).some(x => x.art === art);
    };

    // ---------- Markt-Zugangs-Leiter (WSE -> TIX -> 4S-Data) ----------
    const market = { est4SData: FOURS_DATA_BASE, est4SApi: FOURS_API_BASE, multsApplied: false, lastTry: 0 };
    const applyMults = () => {
        if (market.multsApplied) return;
        const m = io.b.bn && io.b.bn.mults;
        if (m && typeof m.FourSigmaMarketDataCost === "number") {
            market.est4SData = FOURS_DATA_BASE * m.FourSigmaMarketDataCost;
            market.est4SApi  = FOURS_API_BASE  * m.FourSigmaMarketDataApiCost;
            market.multsApplied = true;
            ns.print(`MARKT: 4S-Preise exakt (SF5): Data ${formatMoney(market.est4SData)}, API ${formatMoney(market.est4SApi)}.`);
        }
    };
    const capsNow = () => {
        const c = io.b.caps || {};
        return {
            WSE:  c.WSE  === true || hasCapability(ns, CAPS.WSE),
            TIX:  c.TIX  === true || hasCapability(ns, CAPS.TIX),
            DATA: c.FOURSUI === true,
            API:  c.FOURS === true || hasCapability(ns, CAPS.FOURS),
        };
    };
    const marketAccessStep = async () => {
        const now = Date.now();
        if (now - market.lastTry < MARKET_MS) return;
        market.lastTry = now;
        applyMults();
        const c = capsNow();
        const avail = cashAvail();
        if (!c.WSE) {
            if (avail >= WSE_COST) {
                const ok = await io.act("buyWse", [], "ns.stock.purchaseWseAccount()");
                if (ok === true) ns.print(`MARKT: WSE-Account gekauft (${formatMoney(WSE_COST)}).`);
            }
            return;                                    // Leiter: eine Stufe je Runde
        }
        if (!c.TIX) {
            if (avail >= TIX_COST) {
                const ok = await io.act("buyTix", [], "ns.stock.purchaseTixApi()");
                if (ok === true) ns.print(`MARKT: TIX-API gekauft (${formatMoney(TIX_COST)}).`);
            }
            return;
        }
        if (!c.DATA) {
            if (avail >= market.est4SData) {
                const ok = await io.act("buy4SData", [], "ns.stock.purchase4SMarketData()");
                if (ok === true) ns.print(`MARKT: 4S-Data gekauft (~${formatMoney(market.est4SData)}).`);
                else if (ok === false && !market.multsApplied) {
                    market.est4SData *= 1.5;
                    ns.print(`MARKT: 4S-Data teurer als gedacht -> Schätzung ${formatMoney(market.est4SData)}.`);
                }
            }
        }
        // 4S-API läuft als GROSSZIEL (goalStep) — nicht hier.
    };

    // ---------- Großziel-Kette (Realwerte) ----------
    const goalState = { active: null, waiting: "", congruityPriceAt: 0, congruityPrice: 0, etaMs: undefined };
    /** Aktives Großziel bestimmen: 4S-API -> Corp -> Congruity. null = keins. */
    // =====================================================================
    // v5.7 — EIN GRATIS-ZIEL WARTET NICHT HINTER EINEM FUER $25 MILLIARDEN
    // =====================================================================
    // Die Kette begann mit 4S-API. Das war richtig, solange TIX etwas kostete
    // und frueh im Lauf erledigt war. Mit SF8 stimmt die Annahme nicht mehr:
    //
    //   Prestige.ts:161 — if (canAccessBitNodeFeature(8)) {
    //                       Player.hasWseAccount = true;
    //                       Player.hasTixApiAccess = true; }
    //
    // SF8 schenkt WSE und TIX DAUERHAFT, in jeder BitNode, nach jedem
    // Prestige. Die 4S-API schenkt es nicht. Damit ist `c.TIX && !c.API`
    // permanent wahr, und das erste Glied der Kette gibt nie wieder frei.
    //
    // Live am 19.09.2026 in BN3: $135m Bargeld, Ziel 4S-API fuer ~$25 Mrd,
    // Finanzierung in 77.234 Minuten — 53 Tage. Daneben stand eine Corp, die
    // dort GRATIS zu haben ist (Saatgeld), und kam nie zur Sprache. Genau
    // dafuer waren wir in die Node gewechselt.
    //
    // DIE REGEL, DIE DARAUS FOLGT, ist allgemeiner als dieser Fall: was nichts
    // kostet, darf nicht hinter etwas warten, das noch nicht bezahlbar ist.
    // Ein Gratis-Ziel zu nehmen kann nie die falsche Reihenfolge sein — es
    // verbraucht nichts, was das andere Ziel brauchen wuerde.
    //
    // BEWUSST ENG GEFASST: nur das Corp-Ziel und nur, wenn es 0 kostet. Die
    // Kette im Uebrigen bleibt, wie sie ist. Eine allgemeine Umsortierung nach
    // Bezahlbarkeit waere die groessere Loesung — und die groessere Entscheidung.
    /**
     * v5.9 — Was kostet es, `anzahl` Aktien zurueckzukaufen?
     *
     * NACHBAU VON Corporation.calculateShareSale(-anzahl), weil die Engine
     * keine Abfrage anbietet. Drei Dinge muessen dabei stimmen, sonst ist das
     * Ergebnis zu niedrig und der Kauf scheitert still:
     *
     *  1. DER KURS HAENGT AM EIGENEN ANTEIL (getTargetSharePrice):
     *         ceoConfidence = 0.5 + sqrt(Anteil);  Kurs = Bewertung * conf / total
     *     Bei 0 % ist der Marktwert das 0,5-fache der Bewertung, bei 100 % das
     *     1,5-fache. Wer zurueckkauft, treibt seinen EIGENEN Einkaufspreis —
     *     eine Rechnung mit dem heutigen Kurs faellt deshalb zu guenstig aus.
     *  2. Der Kurs bewegt sich je sharesPerPriceUpdate (1e6) Aktien um 0,5 % in
     *     Richtung Zielkurs, nicht auf ihn. Deshalb wird iteriert.
     *  3. calculateShareBuyback schlaegt 10 % auf: cost = -1.1 * profit.
     *
     * Ohne `valuation` (CORP_INFO liefert sie seit CORP v0.40 mit) wird sie aus
     * dem Kurs zurueckgerechnet — dann ist das Ergebnis eine Naeherung.
     */
    const rueckkaufKosten = (cc, anzahl) => {
        const total = Number(cc && cc.totalShares) || 0;
        const eigen = Number(cc && cc.numShares) || 0;
        let kurs = Number(cc && cc.sharePrice) || 0;
        if (!(total > 0) || !(kurs > 0) || !(anzahl > 0)) return Infinity;

        let bewertung = Number(cc && cc.valuation) || 0;
        if (!(bewertung > 0)) {
            // Rueckwaerts aus dem Kurs: Kurs = Bew * (0.5 + sqrt(anteil)) / total
            const conf = 0.5 + Math.sqrt(Math.max(0, eigen / total));
            bewertung = kurs * total / conf;
        }

        const SCHRITT = 1e6;              // corpConstants.sharesPerPriceUpdate
        let gekauft = 0, roh = 0, offen = anzahl;
        // Obergrenze gegen Endlosschleifen bei absurden Eingaben.
        for (let i = 0; offen > 0 && i < 20000; i++) {
            const los = Math.min(SCHRITT, offen);
            roh += kurs * los;
            gekauft += los;
            offen -= los;
            const anteil = Math.min(1, (eigen + gekauft) / total);
            const ziel = bewertung * (0.5 + Math.sqrt(Math.max(0, anteil))) / total;
            kurs = kurs * (kurs <= ziel ? 1.005 : 0.995);
        }
        return roh * 1.1 * RUECKKAUF_PUFFER;
    };

    /**
     * v5.9 — Das Rueckkauf-Ziel. Ein PAKET je Runde, nicht der ganze Anteil.
     *
     * WARUM PAKETWEISE: der Nutzen ist linear (getCycleDividends verteilt streng
     * nach numShares/totalShares), die Kosten steigen aber mit dem eigenen
     * Anteil. Die ersten Prozentpunkte sind also die billigsten, und ein Paket
     * ist frueh bezahlbar, waehrend "alles auf einmal" nie erreicht wird.
     * Gerechnet am Live-Stand vom 19.09.2026: 1 % kostet $6,69 Mrd, 50,5 %
     * dagegen $632 Mrd.
     *
     * WARUM ALS ZIEL UND NICHT ALS EIGENER PFAD: als Ziel erbt der Rueckkauf
     * das Ansparen, die Liquidation, die ETA-Pruefung und die Anzeige — genauso
     * wie Corp-Gruendung, 4S-API und Craft.
     */
    const rueckkaufZiel = () => {
        const cc = io.corp;
        if (!cc || cc.public !== true) return null;

        // v5.10 — NUR IM FENSTER KAUFEN.
        //
        // CORP v0.41 drueckt die Bewertung vor dem Rueckkauf gezielt auf die
        // Engine-Untergrenze von $10 Mrd: bei voller Dividende faellt der
        // Gewinnterm in determineCycleValuation weg, und liegen die Fonds
        // darunter, greift `if (val < 10e9) val = 10e9`. CORP meldet das als
        // `fenster.offen`.
        //
        // Der Unterschied ist nicht klein: am 20.09.2026 kostete derselbe Anteil
        // von 50,5 % ausserhalb des Fensters $1,16 BILLIONEN und darin rund
        // $5,4 Mrd — Faktor 216. Ohne diese Sperre wuerde BANK kaufen, sobald
        // sie zufaellig genug Geld hat, also fast sicher zum Hoechstkurs.
        // Ein gesperrtes Ziel ist hier richtig, kein Stillstand.
        //
        // RUECKFALL: meldet CORP kein Fenster (aeltere Version, Block fehlt),
        // bleibt der Rueckkauf aus. Lieber nicht kaufen als teuer kaufen.
        // v5.18: nur auf frischem CORP_OUT - sonst kauft BANK zu einem
        // eingefrorenen Kurs aus einem laengst geschlossenen Fenster.
        if (!corpFrisch(cc)) return null;
        const fw = cc.fenster;
        if (!fw || fw.offen !== 1) return null;

        const total = Number(cc.totalShares) || 0;
        const eigen = Number(cc.numShares) || 0;
        const frei  = Number(cc.issuedShares) || 0;
        if (!(total > 0) || !(frei > 0)) return null;

        // Untergrenze: so viel willst DU mindestens halten. CORP publiziert sie
        // (FLOOR_OWN_FRAC, v0.40); ohne Angabe die dort gesetzten 50,5 %.
        const ziel = Number(cc.floorOwnFrac) > 0 ? Number(cc.floorOwnFrac) : 0.505;
        const fehlt = Math.floor(total * ziel - eigen);
        if (fehlt <= 0) return null;                    // Anteil steht — fertig.

        // Paketgroesse: der Vorschlag aus CORP (BUYBACK_CHUNK, 10 Mio), begrenzt
        // auf das, was noch fehlt und was ueberhaupt am Markt ist. buyBackShares
        // verlangt eine positive GANZE Zahl (isPositiveInteger).
        const chunkWunsch = Number(cc.buyback && cc.buyback.chunk) > 0
            ? Number(cc.buyback.chunk) : 10e6;
        const anzahl = Math.floor(Math.min(chunkWunsch, fehlt, frei));
        if (anzahl < 1) return null;

        const kosten = rueckkaufKosten(cc, anzahl);
        if (!isFinite(kosten) || kosten <= 0) return null;

        const anteilJetzt = 100 * eigen / total;
        return {
            key: "CORP_RUECKKAUF",
            label: `Corp-Aktien: ${formatNumber(anzahl)} zurueck (${anteilJetzt.toFixed(1)}% -> ${(100 * (eigen + anzahl) / total).toFixed(1)}%)`,
            cost: kosten, ready: true,
            buy: async () => {
                const geldVor = money();
                const ok = await io.act("corpBuyback", [anzahl],   // v5.15: so heisst der Befehl in INFO
                    `(() => { try { ns.corporation.buyBackShares(${anzahl}); return true; } catch (e) { return false; } })()`);
                rueckkaufBuchen(ok, anzahl, geldVor, kosten, "Ziel");
                if (ok === true) {
                    ns.print(`[Corp] ${formatNumber(anzahl)} Aktien zurueckgekauft `
                        + `(${anteilJetzt.toFixed(2)}% -> ${(100 * (eigen + anzahl) / total).toFixed(2)}%, `
                        + `${formatMoney(kosten)}).`);
                }
                return ok === true;
            },
        };
    };

    const corpZiel = () => ({
        key: "CORP",
        label: `Corp "${CORP_NAME}"${corpSaatgeld() ? " (Saatgeld)" : ""}`,
        cost: corpSaatgeld() ? 0 : CORP_FOUNDING_COST, ready: true,
        buy: async () => {
            // selbst finanzieren ueberall — ausser in BN3, wo Saatgeld geht.
            const selbst = !corpSaatgeld();
            const ok = await io.act("createCorp", [CORP_NAME, selbst],
                `(() => { try { return ns.corporation.createCorporation(${J(CORP_NAME)}, ${selbst ? "true" : "false"}); } catch (e) { return false; } })()`);
            if (ok === true) {
                corpExists = true;
                if (!corpStartSent) { sendCmd(ns, "START:CORP"); corpStartSent = true; }
            }
            // v5.18: ins Handlungsbuch. Der Preis ist fest (Corporation/helpers.ts:80-85).
            // Nachtrag 1: null = keine Antwort in 12 s - INFO kann den Auftrag
            // spaeter noch ausfuehren. Wie home-RAM (v5.17): "unklar" mit Preis.
            try {
                const unklar = ok === null || ok === undefined;
                chronik(ns, "BANK", "corp", CORP_NAME,
                    ok === true ? "gegruendet" : (unklar ? "unklar" : "abgelehnt"),
                    selbst ? formatMoney(CORP_FOUNDING_COST) : "Saatgeld",
                    { betrag: (ok === true || unklar) && selbst ? CORP_FOUNDING_COST : 0,
                      topf: "corporation", ...(unklar ? { unklar: true } : {}) });
            } catch (e) { /* Beiwerk */ }
            return ok === true;
        },
    });

    const currentGoal = () => {
        const c = capsNow();
        // v5.7: gratis geht vor. Siehe Begruendung ueber corpZiel().
        if (!corpExists && corpPossible() && corpSaatgeld()) return corpZiel();
        if (c.TIX && !c.API) {
            return {
                key: "FOURS_API", label: "4S-API",
                cost: market.est4SApi,
                // v3.0: ready/readyWhy entfallen — siehe goalStep. Die Bedingung
                // "Portfolio >= Preis/2" konnte nie erfuellt werden, weil die
                // Liquidation fuer dasselbe Ziel das Portfolio leerte.
                ready: true,
                buy: async () => {
                    const ok = await io.act("buy4SApi", [], "ns.stock.purchase4SMarketDataTixApi()");
                    if (ok === false && !market.multsApplied) { market.est4SApi *= 1.5; return false; }
                    return ok === true;
                },
            };
        }
        if (!corpExists && corpPossible()) return corpZiel();
        if (corpErledigt() && !congruityDone && !graftLaeuft() && bitNodeFeatures(ns).grafting && goalState.congruityPrice > 0) {
            return {
                key: "CONGRUITY", label: "Congruity-Graft", cost: goalState.congruityPrice, ready: true,
                buy: async () => {
                    const ok = await io.act("eval", [CONGRUITY_CODE], CONGRUITY_CODE);
                    if (ok === "LAEUFT") {
                        // Nachtrag 3: es lief schon ein Graft - nichts bezahlt, nichts buchen.
                        congruityDone = true;
                        graftGesehenBis = Date.now() + 60_000;
                        return false;
                    }
                    if (ok === true) {
                        congruityDone = true;
                        graftGesehenBis = Date.now() + 60_000;
                        // v5.17: Der Graft kostet beim START (GraftingWork.tsx:33),
                        // Topf augmentations. Die Reise nach New Tokyo bucht die
                        // Engine getrennt unter other.
                        try { chronik(ns, "BANK", "graft", CONGRUITY_AUG, "gestartet",
                            formatMoney(goalState.congruityPrice),
                            { betrag: goalState.congruityPrice, topf: "augmentations" }); } catch (e) { }
                    }
                    return ok === true;
                },
            };
        }
        // --- v4.7: CRAFT-PHASE als viertes Grossziel --------------------------
        // Bewusst KEIN zweiter Pfad neben goalStep: als Ziel erbt der Graft das
        // Ansparen, die Liquidation, die ETA-Pruefung und die Anzeige. Ein
        // laufender Graft liefert KEIN Ziel — sonst haelt BANK stundenlang Geld
        // zurueck und drosselt INFRA, waehrend gar nichts zu bezahlen ist.
        if (congruityDone && !craftFertig && !graftLaeuft() && craftListe.length) {
            const c = craftListe[0];
            return {
                key: "CRAFT", label: `Craft: ${c.name}`, cost: c.preis, ready: true,
                buy: async () => {
                    const code = craftCode(c.name);
                    const ok = await io.act("eval", [code], code);
                    if (ok === "LAEUFT") {
                        // Nachtrag 3: es lief schon ein Graft - nichts bezahlt, nichts buchen.
                        graftGesehenBis = Date.now() + 60_000;
                        return false;
                    }
                    if (ok === true) {
                        graftGesehenBis = Date.now() + 60_000;
                        // v5.17: ins Handlungsbuch. Das Ziel entsteht nur ohne
                        // laufenden Graft (!graftLaeuft() oben), ok heisst hier
                        // also wirklich "gestartet und bezahlt".
                        try { chronik(ns, "BANK", "graft", c.name, "gestartet", formatMoney(c.preis),
                            { betrag: c.preis, topf: "augmentations" }); } catch (e) { }
                        craftWartetSeit = 0; craftWartetAuf = "";
                        craftListeAt = 0;              // Liste beim naechsten Takt neu holen
                        ns.print(`CRAFT gestartet: ${c.name} (${formatMoney(c.preis)}, `
                            + `${(c.zeitMs / 3600000).toFixed(2)} h). RESET bleibt aus.`);
                    }
                    return ok === true;
                },
            };
        }

        // v5.9 — RUECKKAUF GANZ ZUM SCHLUSS, und das mit Absicht.
        //
        // Er ist das einzige Ziel, das sich WIEDERHOLT: es laeuft, bis der
        // Anteil bei floorOwnFrac steht — beim Live-Stand vom 19.09.2026 waeren
        // das rund 75 Pakete zu je 10 Mio Aktien. Weiter vorn eingehaengt wuerde
        // er Congruity und Craft stundenlang blockieren, und das sind Einmalziele,
        // die den Ausgang aus der BitNode vorbereiten. Hinten verbraucht er nur
        // Geld, das sonst ohnehin herumlaege.
        //
        // Aggressiver ginge auch: diesen Block vor den CONGRUITY-Zweig ziehen.
        // Das ist bewusst NICHT die Vorgabe — es waere eine Entscheidung ueber
        // die Reihenfolge der Grossziele, nicht nur eine Einstellung.
        const rk = rueckkaufZiel();
        if (rk) return rk;

        return null;
    };
    // v1.5 BUGFIX: Der Aug heißt "violet Congruity Implant" (Enums.ts:93) — mit
    // kleinem v, worüber der Infotext des Augs selbst witzelt. Vorher stand hier
    // UND in CONGRUITY_AUG der Enum-SCHLÜSSEL "CongruityImplant". Folge:
    // getAugmentationGraftPrice wirft bei unbekanntem Namen, der catch liefert 0,
    // und `if (price > 0)` verwirft das Ergebnis -> congruityPrice blieb 0, das
    // Ziel entstand nie, graftAugmentation lief nie. Der ganze Congruity-Pfad war
    // stille Totlast. Beide Konstanten stehen jetzt VOR CONGRUITY_CODE und werden
    // dort eingesetzt, damit es nur noch eine Quelle für den Namen gibt.
    const CONGRUITY_AUG   = "violet Congruity Implant";
    const CONGRUITY_CITY  = "New Tokyo";        // graftAugmentation verlangt diese Stadt
    const CONGRUITY_CODE = `(() => { try {
        const w = ns.singularity.getCurrentWork();
        if (w && w.type === "GRAFTING") return "LAEUFT";   // Nachtrag 3: kein Kauf
        const p = ns.getPlayer();
        if (p.city !== ${J(CONGRUITY_CITY)}) { if (!ns.singularity.travelToCity(${J(CONGRUITY_CITY)})) return false; }
        return ns.grafting.graftAugmentation(${J(CONGRUITY_AUG)}, false);
    } catch (e) { return false; } })()`;

    /** Congruity-Vorbedingungen pflegen (Besitz, Preis) — gedrosselt, INFO zuerst. */
    const refreshCongruity = async () => {
        if (congruityDone || !corpErledigt()) return;
        if (!bitNodeFeatures(ns).grafting) { congruityDone = true; return; }
        const owned = io.b.augs && Array.isArray(io.b.augs.owned) ? io.b.augs.owned : null;
        if (owned && owned.includes(CONGRUITY_AUG)) { congruityDone = true; return; }
        const now = Date.now();
        if (now - goalState.congruityPriceAt < 30_000) return;
        goalState.congruityPriceAt = now;
        if (!owned) {
            const has = await evalNs(ns, `(() => { try { return ns.singularity.getOwnedAugmentations(true).includes(${J(CONGRUITY_AUG)}); } catch (e) { return false; } })()`);
            if (has === true) { congruityDone = true; return; }
        }
        const price = await evalNs(ns, `(() => { try { return ns.grafting.getAugmentationGraftPrice(${J(CONGRUITY_AUG)}); } catch (e) { return 0; } })()`);
        if (typeof price === "number" && price > 0) goalState.congruityPrice = price;
    };

    // ================= CRAFT-PHASE (v4.7) =================================
    /** Laeuft gerade ein Graft? Quelle ist der work-Block, nicht ein Schnappschuss. */
    // Nachtrag 3: nach einem Start (oder "LAEUFT") 60 s als laufend werten.
    // INFO frischt den work-Block nur alle 15 s auf und laesst ihn in Takten
    // mit RPC aus - bis dahin hielt BANK den Graft fuer nicht gestartet, bot
    // ihn erneut an und buchte beim zweiten "ok" eine Phantom-Zahlung.
    let graftGesehenBis = 0;
    const graftLaeuft = () => {
        if (Date.now() < graftGesehenBis) return true;
        try {
            const w = io.b.work && io.b.work.currentWork ? io.b.work.currentWork : null;
            return !!(w && w.type === "GRAFTING");
        } catch (e) { return false; }
    };

    // Craftbare Augs samt Preis und Dauer holen.
    //
    // getGraftableAugmentations() filtert NUR isSpecial und Besitz
    // (GraftingHelpers.ts:8-22) — NICHT die Vorbedingungen. graftAugmentation
    // prueft hasAugmentationPrereqs aber sehr wohl und liefert dann false.
    // Deshalb wird hier selbst gefiltert, sonst haengt die Phase an einem Aug,
    // das nie startbar ist.
    //
    // NeuroFlux wird HART ausgeschlossen. Er ist zwar isSpecial und faellt
    // dadurch normalerweise heraus — aber Bladeburner-Mitglieder duerfen
    // Bladeburner-Specials craften, und NFGs factions-Liste enthaelt
    // Bladeburners. Ein Craft gaebe nur Stufe 1 fuer baseCost*3, waehrend der
    // Kauf die NAECHSTE Stufe bringt. NFG bleibt also Sache des Kaufpfads —
    // genau die Arbeitsteilung, die hier gewollt ist.
    const CRAFT_LIST_CODE = `(() => { try {
        const owned = new Set(ns.singularity.getOwnedAugmentations(true));
        const alle = [], fertig = [];
        for (const n of ns.grafting.getGraftableAugmentations()) {
            if (n === ${J("NeuroFlux Governor")}) continue;
            if (owned.has(n)) continue;
            alle.push(n);
            let pre = [];
            try { pre = ns.singularity.getAugmentationPrereq(n) || []; } catch (e) { pre = []; }
            let offen = false;
            for (const p of pre) { if (!owned.has(p)) { offen = true; break; } }
            if (offen) continue;
            let preis = 0, zeit = 0;
            try {
                preis = ns.grafting.getAugmentationGraftPrice(n);
                zeit  = ns.grafting.getAugmentationGraftTime(n);
            } catch (e) { continue; }
            if (!(preis > 0) || !(zeit > 0)) continue;
            fertig.push({ name: n, preis: preis, zeitMs: zeit });
        }
        fertig.sort((a, b) => a.zeitMs - b.zeitMs);
        return { alle: alle, fertig: fertig };
    } catch (e) { return null; } })()`;

    /** Craft-Liste pflegen — gedrosselt, und nur wenn die Phase ueberhaupt zaehlt. */
    const refreshCraft = async () => {
        if (!congruityDone || craftFertig) return;
        if (!bitNodeFeatures(ns).grafting) { craftFertig = true; return; }
        const now = Date.now();
        if (now - craftListeAt < CRAFT_LIST_MS) return;
        craftListeAt = now;
        const r = await evalNs(ns, CRAFT_LIST_CODE);
        if (!r || !Array.isArray(r.fertig)) return;    // Fehlschlag: alten Stand behalten
        craftAlle  = Array.isArray(r.alle) ? r.alle : [];
        // Die Zeitgrenze ist heute wirkungslos (langsamstes craftbares Aug: 2,16 h).
        // Sie steht als Netz da und wird deshalb HIER angewandt, nicht im Spiel-Code.
        craftListe = r.fertig.filter((x) => x && x.zeitMs > 0 && x.zeitMs <= CRAFT_MAX_TIME_MS);
        if (craftListe.length === 0 && craftAlle.length === 0) {
            craftFertig = true;
            ns.print("CRAFT: nichts mehr craftbar — RESET ist wieder frei.");
        }
    };

    /** Startbefehl fuer EINEN Graft. Reist vorher nach New Tokyo (Grafting.ts:61). */
    const craftCode = (aug) => `(() => { try {
        const w = ns.singularity.getCurrentWork();
        if (w && w.type === "GRAFTING") return "LAEUFT";   // Nachtrag 3: kein Kauf
        const p = ns.getPlayer();
        if (p.city !== ${J(CONGRUITY_CITY)}) { if (!ns.singularity.travelToCity(${J(CONGRUITY_CITY)})) return false; }
        return ns.grafting.graftAugmentation(${J("__AUG__")}, false);
    } catch (e) { return false; } })()`.replace("__AUG__", aug);

    /**
     * Sperrt die Craft-Phase gerade den Reset?
     *
     * Nach demselben Muster wie die anderen Haltezustaende im Schwarm: ein
     * Zustand, der den Betrieb anhaelt, MUSS pruefen, ob sein Ausgang
     * erreichbar ist. Es gibt hier drei Ausgaenge, und jeder ist erreichbar:
     *   1. craftFertig  — nichts mehr craftbar
     *   2. Zeitablauf   — das naechste Stueck ist seit CRAFT_MAX_WAIT_MS unbezahlbar
     *   3. Grafting deaktiviert / kein Congruity — Phase existiert gar nicht
     */
    const craftSperrtReset = () => {
        if (!congruityDone || craftFertig) return false;
        if (graftLaeuft()) return true;                 // laeuft gerade -> auf keinen Fall Install
        if (!craftListe.length) return false;
        if (craftWartetSeit > 0 && (Date.now() - craftWartetSeit) > CRAFT_MAX_WAIT_MS) return false;
        return true;
    };

    /** Corp-Existenz pflegen: INFO-corp-Block zuerst, sonst evalNs (30s). */
    const refreshCorpExists = async () => {
        if (io.b.corp) {
            const ex = io.b.corp.exists === true;
            if (ex && !corpExists) corpExists = true;
            if (io.b.corp.exists === false) corpOhneGesehen = true;
        } else {
            const nowT = Date.now();
            if (!corpExists && nowT - corpCheckAt >= 30_000) {
                corpCheckAt = nowT;
                const r = await evalNs(ns, "ns.corporation.hasCorporation()");
                corpExists = r === true;
                if (r === false) corpOhneGesehen = true;
            }
        }
        // v5.18: NUR beim Uebergang "keine Corp -> Corp" einschalten (etwa eine
        // von Hand gegruendete). Stand die Corp schon beim Start dieses Prozesses,
        // gilt der Schalter, wie er steht - vorher hebelte jedes Laden und jeder
        // Deploy einen Schalter 0 fuer rund eine Minute aus.
        if (corpExists && corpOhneGesehen && !corpStartSent) {
            sendCmd(ns, "START:CORP"); corpStartSent = true;
            ns.print("Neue Corp -> START:CORP.");
        }
    };

    /** Großziel fahren: ansparen -> Lücke liquidieren -> kaufen -> ausbuchen. */
    const goalStep = async () => {
        await refreshCongruity();
        await refreshCraft();

        // v4.7 — WARTEUHR DER CRAFT-PHASE.
        // Sie laeuft NUR, wenn gerade NICHT gecraftet wird. Waehrend eines
        // Grafts (bis zu gut zwei Stunden) wartet niemand auf Geld, und eine
        // mitlaufende Uhr wuerde die Phase mitten im Craften fuer beendet
        // erklaeren. Der Wechsel des Ziel-Augs setzt die Uhr ebenfalls zurueck:
        // gewartet wird immer auf EIN bestimmtes Stueck, nicht "allgemein".
        if (congruityDone && !craftFertig && !graftLaeuft() && craftListe.length) {
            const naechst = craftListe[0].name;
            if (craftWartetAuf !== naechst) { craftWartetAuf = naechst; craftWartetSeit = Date.now(); }
        } else {
            craftWartetSeit = 0; craftWartetAuf = "";
        }

        const g = currentGoal();
        // v3.0 ERREICHBARKEITSPRUEFUNG. Vorher wurde jedes Ziel der Kette aktiv,
        // egal ob in Stunden oder in Jahren finanzierbar — und ein aktives Ziel
        // sperrte Rueckkauf, Sleeve-Augs und drosselte INFRA. Jetzt entscheidet die
        // Finanzierungszeit: (Kosten - liquide Masse) / Einkommen.
        if (g) {
            const gap = Math.max(0, g.cost - liquid());
            const inc = incomeRate();
            const etaMs = gap <= 0 ? 0 : (inc > 0 ? (gap / inc) * 1000 : Infinity);
            goalState.etaMs = etaMs;

            // =================================================================
            // BUGFIX v4.1 — DIE ETA-SPERRE WAR EIN SELBSTHALTENDER DEADLOCK
            // =================================================================
            // Die Sperre setzt ein MESSBARES Einkommen voraus. In manchen
            // BitNodes gibt es dieses Einkommen aber erst, WENN das Ziel gekauft
            // ist. BN8 ist der Extremfall:
            //
            //   ScriptHackMoneyGain 0, CompanyWorkMoney 0, CrimeMoney 0,
            //   HacknetNodeMoney 0, InfiltrationMoney 0, CodingContractMoney 0
            //   -> die Boerse ist die EINZIGE Geldquelle (BitNode.tsx:764-790)
            //
            // Ohne die 4S-API handelt der Trader ohne Forecast, macht netto
            // Verlust, `stock` in getMoneySources sinkt, incomeRate() faellt auf
            // 0 — und genau deshalb vertagte diese Pruefung das Ziel, das den
            // Verlust beendet haette. Live nachweisbar: "Sparziel: keines",
            // "Finanzierung in ~12.739.818 min", "Trader-Rate $0/h".
            //
            // Zweiter Schaden: ohne aktives Ziel ist holdCost() = 0, also
            // cashAvail() = alles. INFRA kaufte munter pservs — fuer Hacking,
            // das in BN8 nichts einbringt. Das Geld lief aus dem einzigen Topf,
            // aus dem die 4S-API haette bezahlt werden koennen.
            //
            // JETZT: Ohne messbares Einkommen ist die ETA-Rechnung bedeutungslos
            // (alles ist "unendlich weit"). Dann entscheidet, ob das Ziel
            // ueberhaupt in Reichweite der liquiden Masse liegt. Die
            // urspruengliche Schutzwirkung — kein Anspar-Marathon auf ein
            // absurdes Ziel — bleibt ueber GOAL_REACH_FACTOR erhalten.
            const kannMessen = inc > 0;
            const inReichweite = g.cost <= liquid() * GOAL_REACH_FACTOR;
            const vertagen = kannMessen ? (etaMs > GOAL_MAX_ETA_MS) : !inReichweite;
            if (vertagen) {
                goalState.active = null;
                goalState.waiting = kannMessen
                    ? `vertagt: ${Math.round(etaMs / 60000)} min bis ${formatMoney(g.cost)} (liquid ${formatMoney(liquid())})`
                    : `vertagt: kein messbares Einkommen und ${formatMoney(g.cost)} liegt ueber dem `
                      + `${GOAL_REACH_FACTOR}-fachen der liquiden Masse (${formatMoney(liquid())})`;
                return;
            }
        }
        goalState.active = g;
        if (!g) { goalState.waiting = ""; return; }
        // v3.0: die alte ready-Vorbedingung des 4S-Ziels (Portfolio >= Preis/2) ist
        // ERSATZLOS raus. Sie war ein Deadlock: das Ziel verlangte ein Portfolio,
        // dessen Aufbau es selbst durch die Liquidation verhinderte. Die ETA-Pruefung
        // oben sagt dasselbe, ohne sich selbst zu blockieren.
        const lq = liquid();
        // v1.1: reicht Cash+Portfolio nicht, sind aber Corp-Aktien verkaufbar
        // (Cooldown 0, Mehrheit bleibt), zählt deren Erlös zur liquiden Masse
        // fürs Sparziel — verkauft wird erst, wenn Portfolio die Lücke nicht deckt.
        const sellCap = corpSellCapacity();
        if (lq + sellCap < g.cost * GOAL_BUY_MARGIN) {
            // v3.2: keine Anforderung mehr. Der Trader schuettet von selbst aus,
            // sobald sein Depot ueber dem Einsatzdeckel liegt.
            goalState.waiting = `spart (${formatMoney(lq)}${sellCap > 0 ? " +Aktien " + formatMoney(sellCap) : ""}/${formatMoney(g.cost)})`;
            return;
        }
        const ca = cashAvail();
        if (ca < g.cost * 1.02) {
            // v3.2: Die Luecke wird NICHT mehr aus dem Trader-Depot geholt.
            // Verbleibende Quelle sind Corp-Aktien (bis zur Eigentums-
            // Untergrenze); alles andere kommt ueber die Ausschuettung des
            // Traders von selbst als Cash an.
            const gap = (g.cost * 1.02 - ca) * 1.05;
            const got = await corpSellForCash(gap);
            goalState.waiting = got > 0
                ? `verkauft Aktien ${formatMoney(got)} (Luecke ${formatMoney(gap)})`
                : `wartet auf Cash (Luecke ${formatMoney(gap)})`;
            return;
        }
        goalState.waiting = "kauft";
        const ok = await g.buy();
        if (ok) {
            savings = Math.max(0, savings - g.cost);
            ns.print(`GROSSZIEL erreicht: ${g.label} (${formatMoney(g.cost)}).`);
        } else {
            ns.print(`GROSSZIEL: ${g.label} — Kauf abgelehnt (Preis höher? API?). Schätzung ggf. angehoben.`);
        }
    };

    // ---------- Sleeve-Augs (Quelle: sleeves-Block; Kauf via RPC) ----------
    let lastSleeveAug = 0;
    const sleeveAugStep = async () => {
        const now = Date.now();
        if (now - lastSleeveAug < SLEEVE_AUG_MS) return;
        lastSleeveAug = now;
        const sb = io.b.sleeves;
        if (!sb || !sb.shop || !Array.isArray(sb.list) || sb.list.length === 0) return;
        // v3.0: Grossziel-Naehe-Sperre ENTFERNT. Das Zielgeld steckt jetzt in der
        // RESERVE und ist fuer cashAvail() ohnehin unsichtbar — eine zweite Sperre
        // haette nur denselben Betrag doppelt geschuetzt und Sleeve-Augs dauerhaft
        // blockiert, solange ein (womoeglich unerreichbares) Ziel lief.
        const lq = liquid();
        const capPrice = lq * SLEEVE_AUG_FRAC;
        const cand = [];
        for (const sl of sb.list) {
            if ((sl.shock || 0) !== 0) continue;       // Engine: purchaseSleeveAug verlangt shock===0
            for (const a of sb.shop[sl.i] || []) {
                if (a && typeof a.cost === "number" && a.cost <= capPrice) cand.push({ i: sl.i, name: a.name, cost: a.cost });
            }
        }
        cand.sort((a, b) => a.cost - b.cost);
        let bought = 0;
        for (const c of cand) {
            if (bought >= SLEEVE_AUG_MAX) break;
            if (c.cost > cashAvail()) break;
            const ok = await io.act("sleeveBuyAug", [c.i, c.name],
                `(() => { try { return ns.sleeve.purchaseSleeveAug(${c.i}, ${J(c.name)}); } catch (e) { return false; } })()`);
            if (ok === true) { bought++; ns.print(`SLEEVE-AUG: #${c.i} ${c.name} (${formatMoney(c.cost)}).`); }
        }
    };

    // ---------- Sleeve KAUFEN (v3.4) — die Covenant-Kampagne aus BitNode 10 ----
    //
    // Im Fraktionsmenue heisst das "Special Campaign -> Purchase & Upgrade
    // Duplicate Sleeves". Dahinter steckt genau eine Handlung, und die hat eine
    // NS-Entsprechung: ns.sleeve.purchaseSleeve(). Bisher kaufte BANK nur
    // Sleeve-AUGMENTIERUNGEN, die Sleeves selbst gar nicht.
    //
    // Die Engine setzt vier Bedingungen (SleeveCovenantPurchases.tsx,
    // canPurchaseSleeve):
    //   1. BitNode 10 — ausserhalb WIRFT purchaseSleeve, deshalb das harte Gate
    //      unten. getSleeveCost ist dagegen ueberall abfragbar.
    //   2. Mitglied bei The Covenant.
    //   3. Hoechstens fuenf Stueck (MaxSleevesFromCovenant). Danach liefert
    //      getSleeveCost Infinity — daran erkennen wir das Ende, ohne den
    //      Zaehler selbst mitfuehren zu muessen.
    //   4. Genug Geld.
    // Punkte 2 bis 4 pruefen wir NICHT selbst nach: die Engine tut es ohnehin
    // und liefert im Result eine Begruendung. Doppelt geprueft hiesse nur, zwei
    // Regelwerke synchron halten zu muessen.
    //
    // Ein gekaufter Sleeve ist dauerhaft: recalculateNumberOfOwnedSleeves zaehlt
    // sleevesFromCovenant zur Grundzahl aus SF10 hinzu, und der Kommentar dort
    // sagt ausdruecklich, dass das ein bleibender Vorteil sein soll. Das ist der
    // teuerste, aber auch haltbarste Posten, den BANK kennt.
    let lastSleeveBuy = 0;
    let sleeveBuyDone = false;      // Maximum erreicht -> nicht weiter fragen
    const sleeveBuyStep = async () => {
        if (sleeveBuyDone) return;
        // BitNode-Nummer bevorzugt aus INFO, sonst direkt. getResetInfo kostet
        // 0 GB — und ohne diesen Rueckfall haette der ganze Schritt still
        // ausgesetzt, sobald INFO mal nicht laeuft.
        let bnNr = (io.b.bn && io.b.bn.bitNode) || 0;
        if (!bnNr) { try { bnNr = ns.getResetInfo().currentNode || 0; } catch (e) { bnNr = 0; } }
        if (bnNr !== 10) return;                   // ausserhalb BN10 wirft die Engine
        const now = Date.now();
        if (now - lastSleeveBuy < SLEEVE_BUY_MS) return;
        lastSleeveBuy = now;

        const cost = await io.act("sleeveCost", [],
            "(() => { try { return ns.sleeve.getSleeveCost(); } catch (e) { return null; } })()");
        if (typeof cost !== "number") return;      // kein Zugriff / RPC fehlgeschlagen
        if (!isFinite(cost)) {
            // getSleeveCost liefert Infinity, sobald alle fuenf gekauft sind.
            sleeveBuyDone = true;
            ns.print("SLEEVE-KAUF: alle fuenf Sleeves vom Covenant gekauft — nichts mehr zu holen.");
            return;
        }
        if (cost <= 0) return;

        const frei = cashAvail();
        if (cost > frei * SLEEVE_BUY_FRAC) {
            // Kein Log je Takt — das waere bei Preisen ab 10 Bio. Dauerrauschen.
            return;
        }
        const r = await io.act("sleeveBuy", [],
            "(() => { try { return ns.sleeve.purchaseSleeve(); } catch (e) { return null; } })()");
        // purchaseSleeve liefert {success, message}, KEIN Boolean.
        if (r && r.success === true) {
            ns.tprint(`INFO  [BANK] Sleeve gekauft (${formatMoney(cost)}). Der naechste kostet das Zehnfache.`);
        } else if (r && r.message) {
            ns.print("SLEEVE-KAUF abgelehnt: " + r.message);
        }
    };

    // ---------- Corp-Aktien (v1.1): Rückkauf + Verkauf als Liquiditätsquelle ----------
    // Datenquelle: io.corp (Port 31, CORP v0.18). Alle Beträge in $.
    let lastCorpBuyback = 0;
    let infraBrakeLogged = false;   // v3.3: Bremsen-Meldung nur einmal
    let hnInfraLogged   = false;   // v4.9: Hinweis auf den Infrastruktur-Modus nur einmal
    /** Wie viel $ ließe sich JETZT über Aktienverkauf beschaffen, ohne die
     *  Mehrheit (>= floorOwnFrac) zu unterschreiten? 0 bei Cooldown/keine Corp. */
    const corpSellCapacity = () => {
        const c = io.corp;
        if (!corpFrisch(c)) return 0;                        // Nachtrag 1: nicht auf altem Kurs planen
        if (!c || !c.public || (c.sellCooldown || 0) > 0) return 0;
        const total = c.totalShares || 0, own = c.numShares || 0, price = c.sharePrice || 0;
        if (total <= 0 || price <= 0) return 0;
        const floor = Math.ceil(total * (c.floorOwnFrac || (2 / 3)));
        const sellable = Math.max(0, own - floor);
        // Verkauf drückt den Kurs -> konservativ mit Abschlag rechnen.
        return sellable * price / CORP_PRICE_PREMIUM;
    };
    // v5.18: Rueckkauf ins Buch. Nachtrag 1 (Gegenpruefung): drei Ausgaenge
    // wie beim home-RAM (v5.17). null = keine Antwort in 12 s, INFO fuehrt den
    // Auftrag aber spaeter noch aus -> "unklar" mit der Schaetzung.
    // Der gemessene Betrag gilt IMMER als Schaetzung: zwischen den beiden
    // Geldstaenden liegt ein RPC, und in der Zeit fliessen Dividende (derselbe
    // Topf!) und Einkommen. Liegt die Differenz ausserhalb von (0, 3x Formel],
    // gilt die Formel.
    const rueckkaufBuchen = (ok, anzahl, geldVor, schaetzung, wo) => {
        const gekauft = ok === true, unklar = ok === null || ok === undefined;
        const delta = geldVor - money();
        const plausibel = gekauft && delta > 0 && (!(schaetzung > 0) || delta <= 3 * schaetzung);
        const betrag = gekauft ? (plausibel ? delta : (schaetzung > 0 ? schaetzung : 0))
                     : (unklar && schaetzung > 0 ? schaetzung : 0);
        try {
            chronik(ns, "BANK", "aktien", "Corp-Rueckkauf",
                gekauft ? "gekauft" : (unklar ? "unklar" : "abgelehnt"),
                `${formatNumber(anzahl)} Aktien, ${formatMoney(betrag)} (${wo})`,
                { betrag, topf: "corporation", n: anzahl,
                  ...(gekauft ? { geschaetzt: 1, quelle: plausibel ? "differenz" : "formel" } : {}),
                  ...(unklar ? { unklar: true } : {}) });
        } catch (e) { /* Beiwerk */ }
    };
    /** Aktien für ~need $ verkaufen (bis Untergrenze). Gibt den Erlös (>0) zurück. */
    const corpSellForCash = async (need) => {
        const c = io.corp;
        if (!corpFrisch(c)) return 0;                        // v5.18: kein Verkauf auf altem Kurs
        if (!c || !c.public || (c.sellCooldown || 0) > 0 || need <= 0) return 0;
        const total = c.totalShares || 0, own = c.numShares || 0, price = c.sharePrice || 0;
        if (total <= 0 || price <= 0) return 0;
        const floor = Math.ceil(total * (c.floorOwnFrac || (2 / 3)));
        const sellable = Math.max(0, own - floor);
        if (sellable < 1) return 0;
        const want = Math.min(sellable, Math.ceil((need * CORP_PRICE_PREMIUM) / price));
        if (want < 1) return 0;
        const r = await io.act("corpSellShares", [want],
            `(() => { try { ns.corporation.sellShares(${want}); return true; } catch (e) { return null; } })()`);   // v5.15: void -> true
        if (r === null || r === false) return 0;
        // sellShares liefert in dieser Engine keinen $-Wert -> Erlös schätzen.
        const est = want * price / CORP_PRICE_PREMIUM;
        // v5.18: Zufluss, kein Kauf - daher erloes statt betrag.
        try {
            chronik(ns, "BANK", "aktien", "Corp-Verkauf", "verkauft",
                `${formatNumber(want)} Aktien, ~${formatMoney(est)} fuer ein Grossziel`,
                { erloes: est, topf: "corporation", n: want, geschaetzt: 1 });
        } catch (e) { /* Beiwerk */ }
        ns.print(`CORP-AKTIEN: ${want} verkauft (~${formatMoney(est)}) für Großziel — Mehrheit bleibt (>= ${((c.floorOwnFrac || 2/3) * 100).toFixed(0)}%).`);
        return est;
    };
    /** Rückkauf: lohnt sich, wenn die Dividendenrendite je Aktie den Trader-Zins
     *  schlägt. Aus infraCash(), nie bei aktivem Großziel, in Tranchen. */
    const corpBuybackStep = async () => {
        const now = Date.now();
        if (now - lastCorpBuyback < CORP_BUYBACK_MS) return;
        lastCorpBuyback = now;
        const c = io.corp;
        if (!corpFrisch(c)) return;                          // v5.18: nur auf frischem Stand
        if (!c || !c.public || !c.buyback || c.buyback.want !== 1) return;
        // v3.0: kein `if (goalState.active) return;` mehr. Diese Zeile war die im
        // v1.9-Kopf als "OFFEN BLEIBT" vermerkte zweite Sperre — sie verhinderte den
        // Rueckkauf, solange irgendein Grossziel lief (im Nachtlauf durchgehend).
        // Das Zielgeld liegt in der RESERVE; der Rueckkauf kauft aus dem Rest.
        // v1.9: sellCooldown sperrt den RUECKKAUF nicht mehr. Der Cooldown gehoert zu
        // sellShares; die API-Doku zu buyBackShares nennt keinen (NetscriptDefinitions
        // :10631-10639). Live stand er dauerhaft bei 90-100k ms, weil zuvor verkauft
        // wurde — der Rueckkauf war damit praktisch nie moeglich. Der Aufruf laeuft
        // ohnehin in einem try/catch: lehnt die Engine wider Erwarten ab, ist das
        // folgenlos. Nicht aus dem Quelltext verifizierbar (die Corporation-
        // Implementierung liegt nicht im Projekt-Abzug), deshalb bewusst abgesichert.
        const issued = c.issuedShares || 0, price = c.sharePrice || 0;
        if (issued < 1 || price <= 0) return;
        // Rendite je zurückgekaufter Aktie/h: (dividendRate × Profit/s × 3600) / Marktwert aller Aktien.
        const total = c.totalShares || 1;
        const marketCap = total * price;
        const divYieldPerH = marketCap > 0
            ? ((c.dividendRate || 0) * Math.max(0, c.profitPerSec || 0) * 3600) / marketCap : 0;
        const gate = traderRatePerH();
        if (gate > 0 && divYieldPerH < gate) return;        // Trader wirft mehr ab -> nicht zurückkaufen
        const budget = infraCash();
        const chunk = c.buyback.chunk || 10e6;
        const affordable = Math.floor(budget / (price * CORP_PRICE_PREMIUM));
        const count = Math.min(issued, chunk, affordable);
        if (count < 1) return;
        const geldVor = money();
        const ok = await io.act("corpBuyback", [count],
            `(() => { try { ns.corporation.buyBackShares(${count}); return true; } catch (e) { return false; } })()`);   // v5.15: void -> true
        rueckkaufBuchen(ok, count, geldVor, count * price * CORP_PRICE_PREMIUM, "Rendite");
        if (ok === true) ns.print(`CORP-AKTIEN: ${count} zurückgekauft (~${formatMoney(count * price)}), Rendite ${(divYieldPerH * 100).toFixed(0)}%/h >= Zins ${(gate * 100).toFixed(0)}%/h.`);
    };

    // ===================== GELD-BLOCK: KONFIGURATION =====================
    const SAVINGS_RATE       = 0.05;      // 5% des Brutto-Zuflusses je Tick sparen
    // ===========================================================================
    // SPENDEN-DECKEL (v5.0)
    // ===========================================================================
    // Spenden wandeln Geld in Faktions-Ruf:
    //     repFromDonation = Betrag/1e6 * mults.faction_rep * FactionWorkRepGain
    //     (Faction/formulas/donation.ts:8-10, DonateMoneyToRepDivisor = 1e6)
    // Das ist verlockend und deshalb gefaehrlich: eine grosse Rufluecke lockt zu
    // einer Ueberweisung, die den ganzen Betrieb aushungert. Ein Aug-Kauf braucht
    // NEBEN dem Ruf auch noch den Kaufpreis - wer alles in Ruf steckt, steht
    // danach mit vollem Ruf und leerem Konto da.
    //
    // Deshalb ein eigener Topf, der genau wie der Spartopf aus dem ZUFLUSS
    // gespeist wird, nicht aus dem Bestand: 5 % je Tick. Mehr als das kann eine
    // Spende nie kosten, egal wie gross die Rufluecke ist oder wieviel Geld
    // herumliegt. v5.17: Die zweite Bremse ist nicht mehr die Prioritaet (WORK
    // hat jetzt 200, vor der Gang-Ausruestung), sondern SPENDE_FREI_FRAC: eine
    // Spende bekommt hoechstens die Haelfte dessen, was nach den Antraegen
    // davor noch frei ist. Sonst naehme ein voller Topf alles, und die
    // Ausruestung dahinter bekaeme nie etwas (Einwand des Spielers).
    // Zwei unabhaengige Bremsen, absichtlich.
    const SPENDE_RATE  = 0.05;            // 5% des Brutto-Zuflusses je Tick
    const SPENDE_ID_PRAEFIX = "donate:";  // so heissen die Antraege von WORK
    const SPENDE_FREI_FRAC  = 0.5;        // v5.17: hoechstens die Haelfte des Rests
    const SPENDE_MIN_BANK   = 1e6;        // v5.17 Nachtrag: darunter spendet WORK nicht
    const CORP_FOUNDING_COST = 150e9;     // Self-funded Corp-Gründung (BN9-Pflicht)
    const CORP_NAME          = "ALPHA";   // Name der automatisch gegründeten Corp
    const DEFAULT_PRIO       = 100;       // Antrags-Prio, wenn ein Consumer keine meldet
    // Prioritäts-Gewicht je Consumer (höher = wird zuerst bedient). Ein Antrag mit
    // eigener prio übersteuert das. v5.17: nur noch die zwei Antragsteller, die es
    // wirklich gibt - CORP, AUGS, INFRA und BLADEBURNER stellten nie einen Antrag
    // (BANK kauft dort selbst), CORP_REQ_ID war unbenutzt. GANG schickt 300 (Augs)
    // bzw. 100 (Ausruestung) und WORK 200 selbst mit; die Tabelle ist der
    // Rueckfall fuer aeltere Fassungen ohne prio.
    const CONSUMER_PRIO = { GANGS: 300, WORK: 200 };

    // --- Congruity-Grafting (v-next) ---
    // CongruityImplant ist NUR über Grafting erhältlich (repCost=Infinity, factions=[])
    // und hebt den Entropy-Malus des Graftings auf. Strategie: NUR diese eine Aug graften,
    // und zwar ERST NACH der Corp-Gründung (corpExists) — Corp hat Geld-Vorrang, obwohl
    // beide ~150 Mrd/Bio kosten. Danach ist Grafting malusfrei nutzbar (hier aber nicht
    // weiter genutzt — es geht nur um diese eine Aug).
    let   congruityDone   = false;              // true = besessen ODER nicht nötig -> Pfad aus
    let   congruityCheckAt = 0;                 // Drossel für den evalNs-Besitzcheck

    // --- CRAFT-PHASE (v4.7) -----------------------------------------------
    // Sobald Congruity sitzt, ist Grafting malusfrei (GraftingWork.tsx:61 zaehlt
    // die Entropie nur hoch, wenn der Aug NICHT installiert ist). Ab dann ist
    // Craften dem Kauf-und-Install-Zyklus ueberlegen:
    //
    //   - Ein gecrafteter Aug wirkt SOFORT. applyAugmentation wird direkt in
    //     GraftingWork.finish aufgerufen (AugmentationHelpers.ts:39) — kein
    //     Reset, nichts wird beendet, der Schwarm laeuft durch.
    //   - Der Craft-Preis eskaliert NICHT. GraftableAugmentation.cost ist
    //     baseCost * 3, und baseCost ist der eingefrorene Grundpreis
    //     (Augmentation.ts:215). Der Kaufpreis dagegen steigt je gekauftem Aug
    //     der Runde mit 1.9^N. Beim Craften ist die Reihenfolge also egal, und
    //     eine "Runde" gibt es nicht mehr.
    //
    // Deshalb: RESET bleibt aus, solange noch etwas zu craften ist. Zurueck an
    // die Queen gemeldet wird erst wieder, wenn nichts mehr craftbar ist ODER
    // das naechste Stueck ueber CRAFT_MAX_WAIT_MS unbezahlbar bleibt.
    //
    // ZEITGRENZE — ehrlich beschriftet: Die Craft-Dauer ist
    //     (1h * log2(Summe der Multiplikatoren != 1) + 30min) / 2   / Int-Bonus
    // (GraftableAugmentation.ts + GraftingHelpers.ts). Ueber ALLE 136 Augs
    // durchgerechnet ist das langsamste CRAFTBARE Stueck "Xanipher" mit 2,16 h
    // bei Intelligenz 0 — mit Intelligenz weniger. Die 4 h greifen heute also
    // nirgends; sie stehen als Netz fuer den Fall, dass ein Update ein
    // langsameres Aug bringt. Was die Phase wirklich beendet, ist das GELD.
    const CRAFT_MAX_TIME_MS = 4 * 3600_000;    // Netz, kein Filter (siehe oben)
    const CRAFT_MAX_WAIT_MS = 45 * 60_000;     // so lange wird fuer EINEN Graft gespart
    const CRAFT_LIST_MS     = 60_000;          // Liste hoechstens jede Minute neu holen
    let   craftListe     = [];   // [{name, preis, zeitMs}] aufsteigend nach Zeit
    let   craftAlle      = [];   // alle craftbaren Namen (auch ohne erfuellte Vorbedingung)
    let   craftListeAt   = 0;    // Drossel
    let   craftWartetSeit = 0;   // seit wann wird fuer craftListe[0] angespart?
    let   craftWartetAuf  = "";  // fuer welchen Aug
    let   craftFertig     = false; // nichts mehr craftbar -> Reset wieder frei
    let   craftGemeldet   = "";  // letzte Logzeile, nur bei Wechsel schreiben

    // Summe der positiven Einnahmequellen aus getMoneySources (ohne *_expenses,
    // ohne hospitalization/servers = das sind Ausgaben). Feldnamen aus der Engine
    // (MoneySourceTracker) verifiziert.
    const INCOME_KEYS = ["bladeburner", "casino", "class", "codingcontract", "corporation",
        "crime", "darknet", "gang", "hacking", "hacknet", "infiltration", "sleeves",
        "stock", "work", "augmentations", "other"];
    const grossIncome = () => {
        try {
            const src = ns.getMoneySources().sinceInstall || {};
            let sum = 0;
            for (const k of INCOME_KEYS) { const v = src[k]; if (typeof v === "number" && v > 0) sum += v; }
            return sum;
        } catch (e) { return 0; }
    };

    // ===================== HILFEN =====================
    /** Upgrade-Namen zur Laufzeit auflösen (robust gegen Custom-Build-Schreibweisen). */
    function resolveUpgrades() {
        let ups = [];
        try { ups = ns.hacknet.getHashUpgrades(); } catch (e) { ups = []; }
        if (!Array.isArray(ups) || ups.length === 0) return null;
        const find = (s) => ups.find(u => u.includes(s)) || null;
        return {
            sellMoney:        find("Sell for Money"),
            corpFunds:        find("Corporation Funds"),
            corpResearch:     find("Corporation Research"),
            bladeRank:        find("Bladeburner Rank"),
            bladeSP:          find("Bladeburner S"),
            companyFavor:     find("Company Favor"),
            study:            find("Studying"),
            gym:              find("Gym"),
            // NEU v0.3: Ziel-Boost + Contracts
            reduceMinSec:     find("Reduce Minimum Security"),
            increaseMaxMoney: find("Increase Maximum Money"),
            genContract:      find("Generate Coding Contract"),
        };
    }

    /** Aktuelle Hash-Produktion (Hashes/s) über alle Hash-Server summieren. */
    function hashProduction() {
        let sum = 0;
        try {
            const n = ns.hacknet.numNodes();
            for (let i = 0; i < n; i++) {
                const st = ns.hacknet.getNodeStats(i);
                if (st && st.hashCapacity > 0) sum += st.production || 0;
            }
        } catch (e) { /* 0 lassen */ }
        return sum;
    }

    const num = () => { try { return ns.hacknet.numHashes(); } catch (e) { return 0; } };
    const cap = () => { try { return ns.hacknet.hashCapacity(); } catch (e) { return 0; } };
    const cost = (upg) => {
        try { const c = ns.hacknet.hashCost(upg); return (typeof c === "number" && isFinite(c)) ? c : null; }
        catch (e) { return null; }
    };
    /**
     * KUMULIERTER HASH-VERBRAUCH (v4.0).
     *
     * Fuer Hashes gibt es keine getMoneySources-Entsprechung. Die naheliegende
     * Schaetzung "Produktion minus Bestandsaenderung" wird falsch, sobald der
     * Pool am Cap steht: dort VERPUFFEN Hashes, statt ausgegeben zu werden, und
     * wuerden faelschlich als Ausgabe erscheinen. Deshalb zaehlt BANK selbst mit —
     * sie ist der einzige spendHashes-Aufrufer im Schwarm.
     *
     * Frueher tat das SCHWARM-HASHNET und meldete auf Port 33. Dieser Daemon ist
     * lange tot; der Port hatte seitdem KEINEN Schreiber mehr und die
     * Dashboard-Anzeige blieb dauerhaft leer. Jetzt liegt der Wert als Feld
     * `hash` im Ausgang der BANK, also bei ihrem tatsaechlichen Besitzer.
     */
    let hashSpentTotal = 0;
    const spend = (upg, target = "", count = 1) => {
        try {
            // Kosten VOR dem Kauf holen — danach ist der Preis schon gestiegen.
            const c = cost(upg);
            const ok = ns.hacknet.spendHashes(upg, target, count) === true;
            if (ok && typeof c === "number" && isFinite(c)) hashSpentTotal += c * Math.max(1, count);
            return ok;
        } catch (e) { return false; }
    };

    /** Frische Bedarfs-Meldung eines Produzenten holen (oder null, wenn veraltet/fehlt). */
    function fresh(needs, producer) {
        const e = needs[producer];
        if (!e || (Date.now() - e.ts) > STALE_MS) return null;
        return e.fields;
    }

    // ENTFERNT (v0.4): buyLeveled() — seit v0.3 durch buyIfWorth() ersetzt und nie
    // mehr aufgerufen. Toter Code.

    // ===================== INFRA-BLOCK: ZUSTAND & LOGIK (gemergt aus SCHWARM-INFRA) =====================
    let prodMult = 1;                 // Hacknet-Produktions-Mult (BitNode+Augs), je Tick aktualisiert
    let cacheNeed = 0;                // teuerstes gewünschtes Hash-Ziel (früher Port 9 BANK->INFRA)
    let hacknetShortfall = 0;         // $-Lücke für den nächsten Hacknet-Kauf (früher Port 8 INFRA->BANK)
    let lastWantedCost = 0;           // NEU (v0.4): teuerstes gewünschtes Hash-Ziel vom letzten Tick
                                      // (Untergrenze für den freien Verkauf -> Ansparen wird möglich)
    const money = () => ns.getServerMoneyAvailable("home");
    const log2  = (x) => Math.log(x) / Math.log(2);

    /** Hashrate eines (hypothetischen) Servers bei gegebenen Werten (ramUsed=0). */
    const hnRate = (level, ramV, cores) =>
        HS.HashesPerLevel * level * Math.pow(1.07, log2(ramV)) * (1 + (cores - 1) / 5) * prodMult;

    // v1.3 BUGFIX: Kosten kommen jetzt DIREKT aus den Engine-APIs statt aus
    // nachgebauten Formeln. Die alten Formeln ignorierten die vier Kosten-
    // Multiplikatoren (mults.hacknet_node_purchase_/_level_/_ram_/_core_cost);
    // live gemessen: +111 % (RAM/Core) bis +176 % (Server) über den echten
    // Kosten -> der Zins-Gate-Vergleich hielt Hacknet für 2-3x unrentabler als
    // real. Die APIs liefern echte Kosten inkl. aller Mults und geben am Maximum
    // Infinity zurück. RAM-neutral (alle hacknet.* teilen 0.5 GB, via getNodeStats
    // ohnehin geladen; KEINE Singularity).
    const H = ns.hacknet;
    const apiCost = (fn, ...a) => { try { const c = fn.call(H, ...a); return (typeof c === "number") ? c : Infinity; } catch (e) { return Infinity; } };
    const levelCost   = (i) => apiCost(H.getLevelUpgradeCost, i, 1);
    const hnRamCost   = (i) => apiCost(H.getRamUpgradeCost, i, 1);
    const coreCost    = (i) => apiCost(H.getCoreUpgradeCost, i, 1);
    const hnCacheCost = (i) => apiCost(H.getCacheUpgradeCost, i, 1);
    const serverCost  = () => apiCost(H.getPurchaseNodeCost);

    /** Alle rate-erhöhenden Hacknet-Optionen mit Gewinn/$ bewerten (Cache bringt keine Rate). */
    const buildRateOptions = () => {
        const opts = []; const n = ns.hacknet.numNodes();
        const sCost = serverCost();
        if (isFinite(sCost)) { const gain = hnRate(1, 1, 1); opts.push({ kind: "node", node: -1, cost: sCost, gain, ratio: gain / sCost }); }
        for (let i = 0; i < n; i++) {
            const st = ns.hacknet.getNodeStats(i); if (!st) continue;
            const lvl = st.level, ram = st.ram, cores = st.cores; const base = hnRate(lvl, ram, cores);
            const lC = levelCost(i);   if (isFinite(lC)) { const g = hnRate(lvl + 1, ram, cores) - base; opts.push({ kind: "level", node: i, cost: lC, gain: g, ratio: g / lC }); }
            const rC = hnRamCost(i);   if (isFinite(rC)) { const g = hnRate(lvl, ram * 2, cores) - base; opts.push({ kind: "ram",   node: i, cost: rC, gain: g, ratio: g / rC }); }
            const cC = coreCost(i);    if (isFinite(cC)) { const g = hnRate(lvl, ram, cores + 1) - base; opts.push({ kind: "core",  node: i, cost: cC, gain: g, ratio: g / cC }); }
        }
        opts.sort((a, b) => b.ratio - a.ratio); return opts;
    };
    const buyRate = (kind, node) => {
        try {
            if (kind === "node")  return ns.hacknet.purchaseNode() >= 0;
            if (kind === "level") return ns.hacknet.upgradeLevel(node, 1);
            if (kind === "ram")   return ns.hacknet.upgradeRam(node, 1);
            if (kind === "core")  return ns.hacknet.upgradeCore(node, 1);
        } catch (e) { return false; }
        return false;
    };
    /** CACHE separat: passt cacheNeed(+Buffer) nicht in die kleinste Kapazität, Cache nachziehen. */
    /** v1.2: Cache-Ziel = max(gemeldetes Hash-Ziel×Puffer, Produktion×600s).
     *  Die zweite Komponente ist der PRODUKTIONSPUFFER: läuft die Kapazität
     *  voll, verfällt jeder weitere Hash zu 100 % — deshalb zins-frei und mit
     *  Vorfahrt vor den Rate-Käufen (läuft als erstes im hacknetStep). */
    const cacheStep = (budgetRef) => {
        let prod = 0;
        const n = ns.hacknet.numNodes();
        for (let i = 0; i < n; i++) {
            const st = ns.hacknet.getNodeStats(i);
            if (st && st.hashCapacity) prod += st.production || 0;
        }
        hnDiag.prod = prod;
        const target = Math.max(cacheNeed * CACHE_BUFFER, prod * CACHE_PROD_BUFFER_SEC);
        if (target <= 0) return 0;
        let buys = 0;
        for (let guard = 0; guard < n * HS.MaxCache && buys < CACHE_MAX_BUYS_ROUND; guard++) {
            let totalCap = 0, minCap = Infinity, minIdx = -1;
            for (let i = 0; i < n; i++) {
                const st = ns.hacknet.getNodeStats(i); if (!st || !st.hashCapacity) continue;
                totalCap += st.hashCapacity;
                if (st.hashCapacity < minCap) { minCap = st.hashCapacity; minIdx = i; }
            }
            if (totalCap >= target) break;
            if (minIdx < 0) break;
            const cC = hnCacheCost(minIdx);
            if (!isFinite(cC) || cC > budgetRef.v) break;
            if (!ns.hacknet.upgradeCache(minIdx, 1)) break;
            budgetRef.v -= cC; buys++;
        }
        return buys;
    };
    /** $-Wert eines Hash/s (bei Hash-Servern; klassische Nodes: Näherung, s.u.). */
    const hashDollarPerHash = () => {
        try { const c = ns.hacknet.hashCost("Sell for Money"); if (isFinite(c) && c > 0) return 1e6 / c; } catch (e) {}
        return 250e3;                                   // 4 Hashes -> $1m (Engine-Default)
    };
    /** Strategiebonus: Hashes sind mehr wert, solange Blade/Corp sie verbrauchen. */
    const hashBonus = () => (!bitNodeFeatures(ns).hashesWorthless &&
        (corpExists || hasCapability(ns, CAPS.BLADE))) ? HASH_BONUS : 1;

    /**
     * Hacknet (v1.0): Zins-Gate statt Blindkauf.
     *   - hashesWorthless (BN-Gate) -> KEINE Rate-Käufe mehr (verbrannte bisher Geld).
     *   - Option kaufen nur, wenn Rendite/h >= Trader-Zins. Ohne validen Zins (früh,
     *     kein TIX): frei wie bisher.
     *   - Rückrichtung: beste Option >= Zins×1.5, Cash fehlt, KEIN Großziel aktiv
     *     -> Lücke über Port 27 anfordern (setLiquidation "infra").
     *   Bekannte Grenze: bei klassischen Hacknet-NODES (kein Hash-Server) misst
     *   hnRate() formal Hashes/s — der Zins-Vergleich ist dort nur eine Näherung.
     */
    // =========================================================================
    // v4.9 — HACKNET-SERVER SIND AUCH DANN ETWAS WERT, WENN HASHES ES NICHT SIND
    // =========================================================================
    // hacknetStep stieg bei hashesWorthless sofort aus, mit der richtigen
    // Begruendung "Rate-Kaeufe verbrennen dort Geld". Uebersehen wurde: mit SF9
    // sind Hacknet-SERVER echte Rechner im Netz. Sie tragen RAM (bis 8192 GB)
    // und KERNE (bis 128, Hacknet/data/Constants.ts:48-50) — und der Dispatcher
    // nimmt sie ausdruecklich in den Pool, sobald Hashes wertlos sind
    // (v12.3: hnReserveFrac = hashesWorthless ? 0 : ...). Der Dispatcher gab
    // also alles her, was BANK gar nicht erst kaufte.
    //
    // Live in BN8: "RAM gesamt 3.9T, davon hacknet-* 1G". Der Nutzer musste
    // Server von Hand kaufen. Zum Vergleich BN14 im selben Dauerauftrag:
    // 112 TB Hacknet-RAM.
    //
    // DIE MASSEINHEIT. Hashes taugen hier nicht — sie sind ja wertlos. Was der
    // Schwarm von einem Host hat, ist RAM mal Kernbonus:
    //     getCoreBonus(cores) = 1 + (cores - 1) / 16     (ServerHelpers.ts:288)
    // Der Bonus wirkt auf grow und weaken (grow.ts:25, ServerHelpers.ts:293) —
    // also genau auf die beiden Aufrufe, mit denen der Schwarm in BN8 Kurse
    // schiebt. "Wirksame GB" = ram * coreBonus ist damit eine ehrliche
    // gemeinsame Einheit fuer alle drei Kaufarten.
    //
    // LEVEL WIRD NICHT GEKAUFT. Die Stufe erhoeht ausschliesslich die
    // Hash-Produktion und bringt weder RAM noch Kerne. Wo Hashes wertlos sind,
    // ist ein Level-Kauf verbranntes Geld — das war an der alten Sperre das
    // Richtige und bleibt erhalten.
    const hacknetInfraOptions = () => {
        const kern = (c) => 1 + (Math.max(1, c) - 1) / 16;
        const opts = [];
        const n = ns.hacknet.numNodes();
        const sCost = serverCost();
        if (isFinite(sCost) && sCost > 0) {
            // Ein frischer Server: die Startwerte holt sich die Rechnung nicht
            // aus einer Annahme, sondern aus einem vorhandenen Knoten; gibt es
            // keinen, ist es der erste und der Gewinn ist sein Grundausbau.
            let gb = 1, co = 1;
            try { const s0 = ns.hacknet.getNodeStats(0); if (s0) { gb = s0.ram; co = s0.cores; } } catch (e) { /* erster Knoten */ }
            opts.push({ kind: "node", node: -1, cost: sCost, gain: gb * kern(co) });
        }
        for (let i = 0; i < n; i++) {
            const st = ns.hacknet.getNodeStats(i);
            if (!st) continue;
            const basis = st.ram * kern(st.cores);
            const rC = hnRamCost(i);
            if (isFinite(rC) && rC > 0) opts.push({ kind: "ram", node: i, cost: rC, gain: st.ram * 2 * kern(st.cores) - basis });
            const cC = coreCost(i);
            if (isFinite(cC) && cC > 0) opts.push({ kind: "core", node: i, cost: cC, gain: st.ram * kern(st.cores + 1) - basis });
        }
        for (const o of opts) o.ratio = o.gain > 0 ? o.gain / o.cost : 0;
        opts.sort((a, b) => b.ratio - a.ratio);
        return opts.filter(o => o.ratio > 0);
    };

    /** Hacknet als reine Infrastruktur ausbauen (Hashes wertlos, RAM/Kerne nicht). */
    const hacknetInfraStep = () => {
        let buys = 0;
        const budgetRef = { v: infraCash() };
        const opts0 = hacknetInfraOptions();
        hnDiag.gate = 0;
        hnDiag.bestRate = 0;
        hnDiag.infra = true;
        hacknetShortfall = opts0.length ? Math.max(0, opts0[0].cost - infraCash()) : 0;
        while (buys < MAX_BUYS) {
            const opts = hacknetInfraOptions();
            let chosen = null;
            for (const o of opts) { if (o.cost <= budgetRef.v) { chosen = o; break; } }
            if (!chosen) break;
            if (!buyRate(chosen.kind, chosen.node)) break;
            buys++;
            budgetRef.v -= chosen.cost;
            if (!hnInfraLogged) {
                hnInfraLogged = true;
                ns.print("HACKNET als INFRASTRUKTUR: Hashes sind hier wertlos, RAM und Kerne "
                    + "nicht. Gekauft wird nach wirksamen GB (RAM x Kernbonus), keine Level.");
            }
        }
        return buys;
    };

    const hacknetStep = () => {
        // v1.9: In der Reset-Phase nichts mehr investieren. Prestige.ts loescht
        // beim Aug-Install alle gekauften Server und setzt Hacknet zurueck.
        if (resetPhase) { hacknetShortfall = 0; return 0; }
        const featHn = bitNodeFeatures(ns);
        if (featHn.hashesWorthless) {
            // v4.9: Hashes wertlos — aber mit SF9 sind es echte Rechner. Lohnt
            // Worker-RAM in dieser BitNode ueberhaupt (in BN8 ueber die Boerse,
            // siehe workerRamPays), werden sie als Infrastruktur ausgebaut.
            if (featHn.hacknetServer && workerRamPays()) return hacknetInfraStep();
            hacknetShortfall = 0; return 0;
        }
        let buys = 0;
        const budgetRef = { v: infraCash() };
        cacheStep(budgetRef);
        const gate = traderRatePerH();
        const dph = hashDollarPerHash() * hashBonus();
        const optRate = (o) => (o.gain * dph * 3600) / o.cost;   // Rendite-Anteil/h
        // v3.0: DIE RANGLISTE ENTSCHEIDET, nicht mehr der Zins-Schwellwert. Steht
        // Hacknet nicht unter den besten bezahlbaren Posten, wird nichts gekauft —
        // das Geld bleibt fuer den besseren Posten stehen, statt an einem Veto zu
        // scheitern und brachzuliegen.
        const allowed = rankAllows("hacknet");
        while (allowed && buys < MAX_BUYS) {
            const opts = buildRateOptions();
            let chosen = null;
            for (const o of opts) {
                if (o.cost <= budgetRef.v) { chosen = o; break; }   // sortiert nach Gewinn/$
            }
            if (!chosen) break;
            if (buyRate(chosen.kind, chosen.node)) { buys++; budgetRef.v -= chosen.cost; } else break;
        }
        // v1.2 SOCKEL: hat das Gate alles geblockt, darf 1× je Minute trotzdem die
        // beste leistbare Option gekauft werden — "zukünftige Hash-Produktion
        // liegt brach" ist damit strukturell beendet, ohne den Trader zu kannibalisieren.
        // v3.0: DER SOCKEL-KAUF IST ENTFALLEN. Er war die Notbremse gegen das
        // Zins-Veto (v1.2: "hat das Gate alles geblockt, darf 1x je Minute trotzdem
        // gekauft werden"). Ohne Veto braucht es keine Notbremse — steht Hacknet
        // oben in der Rangliste, wird gekauft; steht es nicht dort, ist etwas
        // Besseres dran und ein Trotzdem-Kauf waere die schlechtere Wahl.
        // $-Lücke fürs Hash-Verkaufen (bestehende Leiter) + Rückrichtung (Portfolio -> INFRA).
        try {
            const opts = buildRateOptions();
            const best = opts.length ? opts[0] : null;
            hnDiag.gate = gate;
            hnDiag.bestRate = best ? optRate(best) : 0;
            try { hnDiag.cap = ns.hacknet.hashCapacity(); hnDiag.num = ns.hacknet.numHashes(); } catch (e2) {}
            hacknetShortfall = best ? Math.max(0, best.cost - infraCash()) : 0;
            // v3.2: KEINE Liquidations-Anforderung mehr. Fehlt Cash, wird
            // gewartet — der Trader schuettet aus, sobald er Gewinn hat.
            // hacknetShortfall bleibt als Kennzahl (Hash-Verkaufs-Leiter).
        } catch (e) { hacknetShortfall = 0; }
        return buys;
    };
    // v5.12: serverStep ist in infraStep aufgegangen (beim home-Block weiter
    // unten). pserv und home sind EIN Schritt: der guenstigste zuerst.

    // ===================== PAYLOAD-BLOCK: TRADER + AUGS starten =====================
    let lastAugsAt = 0, lastPayloadAt = 0;
    let bestBoostTarget = null, bestBoostAt = 0;   // bestes Hack-Ziel für Sec/Money-Hash-Boost

    // --- Aug-Kauf-Steuerung (v1.3: BANK wählt, AUGS-One-Shot kauft) -----------
    // Regeln (mit dir final abgestimmt):
    //   * TEUERSTES rep-erreichbares, unbesessenes Aug zuerst — kein Scoring.
    //     Klingt falsch herum, ist aber die kostenminimale Reihenfolge: jeder
    //     Kauf hebt den Preis-Multiplikator fuer die folgenden. Wer teuer
    //     zuerst kauft, zahlt ihn auf die billigen, nicht umgekehrt.
    //     (Sortierung unten: b.price - a.price. Die Sleeve-Augs weiter oben
    //     sortieren dagegen aufsteigend - anderer Mechanismus, eigener Deckel.)
    //   * EIN Ziel je AUGS-Lauf; die Auswahl liegt hier (BANK kennt Geld+Katalog).
    //   * KEIN Großziel-Block: späte Augs sind so teuer, dass Corp/Trader-Upgrades
    //     dagegen Kleingeld sind — ein Block würde nur bremsen.
    //   * Ruf reicht bei mind. einer anbietenden Faktion (Rep-Grind macht WORK).
    //   * NeuroFlux Governor läuft als GANZ NORMALES Ziel mit (nicht als Sonderfall),
    //     wird aber separat behandelt: er ist immer "erreichbar" (nur Mitglieds-Ruf),
    //     zählt aber NICHT als regulärer Aug (sonst löst NFG-Spam später den Reset aus).
    const AUG_CASH_FLOOR = 10e6;     // persönliches Geld nie unter diese Grenze für Augs
    const NFG_AUG        = "NeuroFlux Governor";

    // ---------- AUG-RUNDE (v1.9) ------------------------------------------
    //
    // WARUM DIE REIHENFOLGE ALLES ENTSCHEIDET (AugmentationHelpers.getAugCost):
    //     moneyCost = baseCost * B^k
    //     B = CONSTANTS.MultipleAugMultiplier (1.9, mit SF11 bis 0.93 gedaempft)
    //     k = Zahl der bereits GEKAUFTEN Nicht-SoA-Augs dieser Runde
    // Der Multiplikator haengt NUR an der ANZAHL, nicht daran, welches Aug man
    // kauft. Die Gesamtkosten einer festen Menge sind also Summe(base_i * B^Pos_i)
    // — und die sind minimal, wenn das TEUERSTE Aug den KLEINSTEN Exponenten
    // bekommt (Umordnungsungleichung). Bis v1.8 wurde ueber pickCheapestAug()
    // genau umgekehrt vorgegangen, also in der teuerstmoeglichen Reihenfolge.
    // Rechenbeispiel mit Basispreisen 7.5/12/28/62/250 Mio. und B = 1.9:
    //     billigstes zuerst : 3815 Mio.
    //     teuerstes zuerst  :  649 Mio.   -> Faktor 5.9 fuer dasselbe Ergebnis.
    //
    // WARUM EINE OBERGRENZE JE RUNDE: bei B = 1.9 kostet das sechste Aug bereits
    // das 25-fache seines Basispreises. Ab einem Punkt ist "Install und naechste
    // Runde" billiger als "noch eins kaufen" — nach dem Install faengt k wieder
    // bei 0 an. AUG_ROUND_MAX ist diese Grenze.
    //
    // PREISE AUS DEM SNAPSHOT enthalten B^k bereits (INFO liest
    // getAugmentationPrice). Fuer die Rangfolge ist das egal: alle Kandidaten
    // tragen denselben Faktor, die Sortierung nach Preis ist also identisch mit
    // der nach Basispreis.
    const AUG_ROUND_MAX   = 5;              // Augs je Runde, danach Install
    const AUG_WAIT_MAX_MS = 45 * 60_000;    // so lange wird fuer EIN Aug angespart
    // v3.4: so lange behaelt das TEUERSTE Ziel den Vorrang. Danach darf die Runde
    // auf das teuerste BEZAHLBARE ausweichen, statt weiter gar nichts zu kaufen.
    // Deutlich kuerzer als AUG_WAIT_MAX_MS (45 min): erst ausweichen, und nur wenn
    // auch das nichts bringt, installieren.
    const AUG_FALLBACK_MS = 10 * 60_000;
    // v4.4: Nach so langer Kaufpause gilt NFG als faellig. Begruendung an
    // planAugRound() — kurz: bei aufsteigender Sortierung ist der naechste
    // Posten der billigste ueberhaupt; klemmt DER eine halbe Stunde, liegt es
    // am Ruf und nicht am Geld, und dagegen hilft Warten nicht.
    const NFG_STALL_MS    = 30 * 60_000;

    /**
     * Zustand der laufenden Aug-Runde.
     * @returns {{unlocked:Array, locked:number, target:Array, next:object|null,
     *            allUnlocked:boolean, boughtThisRound:number}|null}
     */
    const planAugRound = () => {
        const A = io.b.augs, R = io.b.rep;
        if (!A || !A.catalog || !R) return null;
        // v4.7: EINE Bedingung, zwei Wirkungen. Solange die Craft-Phase den
        // Reset zurueckhaelt, wird auch nicht gekauft — und in derselben
        // Sekunde, in der sie loslaesst (nichts mehr craftbar oder das naechste
        // Stueck seit 45 min unbezahlbar), laeuft der alte Kauf-und-Install-
        // Zyklus wieder an. Zwei getrennte Bedingungen koennten auseinander-
        // laufen und einen Zustand erzeugen, in dem weder gekauft noch
        // gecraftet wird.
        const craftAktiv = craftSperrtReset();
        const owned = new Set(Array.isArray(A.owned) ? A.owned : []);
        const inst  = new Set(Array.isArray(A.installed) ? A.installed : []);
        const repOf = (f) => (R[f] && typeof R[f].rep === "number") ? R[f].rep : 0;

        // Ein Aug kann von mehreren Faktionen angeboten werden — je Aug die
        // Faktion nehmen, bei der der Ruf schon reicht.
        const unlocked = new Map();   // name -> {aug, faction, price}
        let locked = 0;
        const seenLocked = new Set();
        // v4.4: NFG wird weiterhin aus der normalen Liste herausgehalten, aber
        // nicht mehr weggeworfen. Er ist wiederholbar (AugmentationHelpers.ts:56
        // hebt nur den Level an, statt einen zweiten Eintrag anzulegen) und
        // wuerde die Runde sonst endlos fuellen. Als LETZTER Posten ist er
        // dagegen genau richtig: wenn nichts anderes mehr rufbar ist, waere das
        // Geld sonst untaetig.
        let nfgOffer = null;
        for (const fac of Object.keys(A.catalog)) {
            for (const item of (A.catalog[fac] || [])) {
                const name = item.name;
                if (!name) continue;
                if (name === NFG_AUG) {
                    const p = (typeof item.price === "number" && item.price > 0) ? item.price : Infinity;
                    const r = (typeof item.repReq === "number") ? item.repReq : Infinity;
                    // NFG darf man besitzen UND erneut kaufen — deshalb hier
                    // KEINE owned-Pruefung, anders als bei allen anderen.
                    if (isFinite(p) && repOf(fac) >= r && (!nfgOffer || p < nfgOffer.price)) {
                        nfgOffer = { aug: name, faction: fac, price: p };
                    }
                    continue;
                }
                if (owned.has(name)) continue;
                // v4.7 — WAS GECRAFTET WERDEN KANN, WIRD NICHT GEKAUFT.
                // Kaufen heisst: bezahlen, in die Warteschlange legen, und den
                // ganzen Schwarm fuer den Install beenden. Craften heisst:
                // bezahlen und sofort haben. Bei gleichem Zugewinn ist der Kauf
                // also der teurere Weg — und er zieht ausserdem den Preis-
                // Exponenten 1.9^N fuer alle weiteren Augs der Runde hoch.
                // Geprueft wird gegen craftAlle (alles Craftbare), nicht gegen
                // craftListe (nur das sofort Startbare): ein Aug, dessen
                // Vorbedingung noch fehlt, laesst sich auch nicht kaufen.
                // NFG steht in keiner der beiden Listen und bleibt kaufbar —
                // genau das ist die gewollte Arbeitsteilung.
                if (craftAktiv && craftAlle.indexOf(name) >= 0) continue;
                const price = (typeof item.price === "number" && item.price > 0) ? item.price : Infinity;
                const repReq = (typeof item.repReq === "number") ? item.repReq : Infinity;
                if (!isFinite(price)) continue;
                if (repOf(fac) >= repReq) {
                    const cur = unlocked.get(name);
                    if (!cur || price < cur.price) unlocked.set(name, { aug: name, faction: fac, price });
                } else if (!unlocked.has(name)) {
                    seenLocked.add(name);
                }
            }
        }
        for (const n of seenLocked) if (!unlocked.has(n)) locked++;

        // =================================================================
        // v4.4 — BILLIGSTES ZUERST. DURCHSATZ SCHLAEGT STUECKPREIS.
        // =================================================================
        // Bis v4.3 stand hier absteigend, mit der Begruendung "kostenminimale
        // Reihenfolge". Die Rechnung stimmt auch: der N-te in DERSELBEN Runde
        // gekaufte Aug kostet Grundpreis x 1.9^(N-1)
        // (AugmentationHelpers.ts:32, getGenericAugmentationPriceMultiplier),
        // also zahlt man am wenigsten, wenn das teuerste den kleinsten
        // Exponenten bekommt.
        //
        // Nur ist Geld hier nicht die knappe Groesse, sondern ZEIT. Der
        // Multiplikator wird beim Install zurueckgesetzt — queuedAugmentations
        // ist danach leer. Was zaehlt, ist also nicht der Preis je Aug,
        // sondern wie schnell eine Runde voll wird und der naechste Install
        // kommt. Absteigend hiess: auf das teuerste ansparen und bis zu
        // AUG_FALLBACK_MS warten, bevor ueberhaupt etwas gekauft wird.
        // Aufsteigend heisst: sofort kaufen, Runde fuellen, installieren.
        //
        // Die Zahl der Augs je Runde aendert sich dadurch nicht — dafuer
        // sorgt AUG_ROUND_MAX. Es aendert sich, WELCHE fuenf es werden und
        // wie lange es dauert.
        const list = [...unlocked.values()].sort((a, b) => a.price - b.price);
        const boughtThisRound = Array.isArray(A.owned) && Array.isArray(A.installed)
            ? A.owned.filter(n => n !== NFG_AUG && !inst.has(n)).length
            : 0;

        const slots = Math.max(0, AUG_ROUND_MAX - boughtThisRound);
        const target = list.slice(0, slots);

        // v4.4 — NFG ALS LUECKENFUELLER, NICHT ALS DAUERPOSTEN.
        //
        // Zwei Faelle, in denen NFG dran ist:
        //   1. Es ist NICHTS anderes mehr rufbar. Dann liegt das Geld sonst
        //      untaetig herum, bis WORK genug Ruf erarbeitet hat — und das
        //      dauert Stunden, nicht Minuten.
        //   2. Seit NFG_STALL_MS wurde nichts gekauft, obwohl die Runde noch
        //      Plaetze hat. Bei aufsteigender Sortierung heisst das: das
        //      billigste rufbare Aug ist trotzdem unbezahlbar, oder es haengt
        //      am Ruf. Beides loest sich nicht von selbst in Minuten.
        //
        // 30 Minuten, nicht 60: bei aufsteigender Sortierung ist der naechste
        // Posten der BILLIGSTE ueberhaupt. Ist der nach einer halben Stunde
        // nicht bezahlbar, blockiert nicht das Geld, sondern der Ruf — und
        // dagegen hilft Warten nicht.
        //
        // NFG faellt bewusst NICHT unter AUG_ROUND_MAX: er zaehlt nicht als
        // Rundenfortschritt (boughtThisRound filtert ihn heraus), sondern ist
        // das, was man kauft, wenn die Runde sonst stillstuende.
        const nfgFaellig = !!nfgOffer && (
            target.length === 0 ||
            (augLetzterKauf > 0 && (Date.now() - augLetzterKauf) > NFG_STALL_MS)
        );

        return {
            unlocked: list,
            locked,
            target,
            next: target.length ? target[0] : (nfgFaellig ? nfgOffer : null),
            nfg: nfgOffer,
            nfgFaellig,
            allUnlocked: locked === 0,
            boughtThisRound,
        };
    };

    // --- RESET-BEREITSCHAFT (v1.7) ----------------------------------------
    // Der Aug-Install ist der einzige Weg, gekaufte Augs wirksam zu machen — und
    // gleichzeitig die folgenreichste Aktion im Schwarm (alles wird beendet). BANK
    // entscheidet, WANN er faellig ist; ausgefuehrt wird er von der Queen ueber den
    // RESET-One-Shot. Bedingungen, alle mit dir abgestimmt:
    //
    //   1. GRAFTING hat absoluten Vorrang. Ein Install verwirft laufende Graft-Arbeit.
    //   2. Mindestens RESET_MIN_AUGS Spieler-Augs gekauft. NeuroFlux zaehlt NICHT —
    //      sonst wuerde NFG-Nachkauf den Reset dauernd ausloesen.
    //   3. RUHE-FENSTER: die Zahl darf RESET_IDLE_MS nicht mehr gestiegen sein. Sonst
    //      resettet man mitten in einer Kaufserie und verschenkt die naechsten Augs.
    //   4. MINDESTSPIELZEIT seit dem letzten Aug-Reset (RESET_MIN_PLAY_MS). Schuetzt
    //      vor einer Reset-Schleife direkt nach dem Hochlauf.
    //
    // Gezaehlt wird aus dem INFO-augs-Block: owned (getOwnedAugmentations(true),
    // inkl. gekaufter) MINUS installed (nur installierte) = Warteschlange. Deshalb
    // braucht es INFO >= v1.3; aeltere Snapshots liefern kein `installed`, dann
    // meldet BANK bewusst NICHTS statt zu raten.
    const RESET_MIN_AUGS     = 1;             // v1.9: mind. 1 Aug, sonst lohnt der Install nicht
    const RESET_IDLE_MS      = 10 * 60_000;   // 10 min keine Neuzugaenge (Rueckfall)
    const RESET_MIN_PLAY_MS  = 60 * 60_000;   // 60 min seit letztem Aug-Reset
    let resetSeenCount = -1, resetSeenAt = 0;
    let resetAnnounced = false;   // Meldung nur beim Zustandswechsel ins Log
    let resetPhase = false;       // v1.9: Runde ist durch -> nichts mehr investieren
    // v4.6: Zuletzt an die Queen gemeldete Reset-Bereitschaft (checkResetReady).
    // resetPhase heisst nur "die Aug-Runde ist durch"; DAS hier heisst "der
    // Install kommt jetzt wirklich". Zwischen beidem liegt bis zu eine Stunde
    // (RESET_MIN_PLAY_MS) — siehe managePayloads.
    let installGemeldet = null;
    let augWaitSince = 0;         // v1.9: seit wann wird fuer dasselbe Aug angespart?
    let augWaitFor = "";
    let redPillBn15Gemeldet = false;   // v5.14: Hinweis nur einmal
    let augLetzterKauf = 0;       // v4.4: wann wurde zuletzt ein Aug gekauft?

    /**
     * v1.9: Die Runde ist zu Ende, wenn NICHTS MEHR ZU HOLEN IST — nicht, wenn
     * eine Stueckzahl erreicht ist. "Nichts mehr zu holen" heisst:
     *   - kein unbesessenes Aug haengt noch am Ruf (allUnlocked), UND
     *   - die Zielmenge der Runde ist gekauft (AUG_ROUND_MAX erreicht) oder es
     *     ist ueberhaupt kein freigeschaltetes Aug mehr uebrig.
     * Damit beschreibt die Bedingung das tatsaechliche Ende der Runde statt
     * einer geratenen Stueckzahl. Das Ruhe-Fenster bleibt als Rueckfall fuer
     * den Fall, dass der Katalog unvollstaendig ist.
     * @returns {{count:number,augs:string[],why:string}|null}
     */
    const checkResetReady = () => {
        const A = io.b.augs;
        if (!A || !Array.isArray(A.owned) || !Array.isArray(A.installed)) return null;

        const inst = new Set(A.installed);
        const queued = A.owned.filter(n => n !== NFG_AUG && !inst.has(n));
        const count = queued.length;

        // Ruhe-Fenster mitfuehren: jede Aenderung setzt die Uhr zurueck.
        const now = Date.now();
        if (count !== resetSeenCount) { resetSeenCount = count; resetSeenAt = now; }
        if (count < RESET_MIN_AUGS) return null;

        // --- v1.9: Rundenende ueber den Katalog bestimmen ---
        const plan = planAugRound();
        let roundDone = false, why = "";
        if (plan) {
            // =================================================================
            // v3.4 — plan.allUnlocked WAR DER RIEGEL VOR BEIDEN AUSGAENGEN
            // =================================================================
            // Beide Zweige verlangten frueher zusaetzlich plan.allUnlocked, also
            // locked === 0: KEIN einziges Aug im gesamten Katalog darf noch
            // rufgesperrt sein. Der Katalog umfasst alle beigetretenen UND
            // eingeladenen Faktionen (SCHWARM-INFO.js, sweepAugs) — in der
            // BOOT-Phase ist dort immer irgendetwas gesperrt. Die Bedingung war
            // damit praktisch nie wahr, und sie hielt gleich zwei Tueren zu:
            //
            //   1. hier: die Runde konnte nie "fertig" werden, also meldete BANK
            //      nie Reset-Bereitschaft ueber diesen Weg;
            //   2. resetPhase (siehe managePayloads): dieselbe Bedingung. Ohne
            //      resetPhase gibt es keine Schluss-Liquidation ("der Erloes
            //      finanziert die letzten Augs") und INFRA kauft bis zur letzten
            //      Sekunde Server, die der Install anschliessend loescht.
            //
            // Live: der Nutzer musste die Augs von Hand kaufen, damit ueberhaupt
            // ein Reset zustande kam.
            //
            // Richtig ist die Frage "ist in DIESER Runde noch etwas zu holen?",
            // nicht "ist irgendwo im Katalog noch etwas gesperrt?". Genau das
            // beantworten target.length und die Warteuhr bereits allein.
            // allUnlocked bleibt als Information im Plan, entscheidet aber nicht
            // mehr mit.
            const nothingLeft = plan.target.length === 0;              // Zielmenge abgearbeitet
            if (nothingLeft) {
                roundDone = true;
                why = `${count} Augs gekauft, nichts Erreichbares mehr offen`
                    + (plan.locked > 0 ? ` (${plan.locked} noch rufgesperrt)` : "");
            } else if (augWaitSince > 0 && (now - augWaitSince) > AUG_WAIT_MAX_MS) {
                // Das naechste Aug ist auf absehbare Zeit unbezahlbar -> Install
                // ist der bessere Weg (der Preis-Exponent faellt auf 0 zurueck).
                roundDone = true;
                why = `${count} Augs gekauft, naechstes Ziel seit ${Math.round((now - augWaitSince) / 60000)} min unbezahlbar`;
            }
        }
        if (!roundDone && now - resetSeenAt < RESET_IDLE_MS) return null;
        if (!roundDone) why = `${count} Augs gekauft, seit ${Math.round((now - resetSeenAt) / 60000)} min keine Neuzugaenge`;

        // Grafting laeuft? -> nicht anfassen.
        try {
            const w = io.b.work && io.b.work.currentWork ? io.b.work.currentWork : null;
            if (w && w.type === "GRAFTING") return null;
        } catch (e) { /* kein work-Block -> weiter, RESET prueft selbst nochmal */ }

        // v4.7 — CRAFT-PHASE HAELT DEN INSTALL ZURUECK.
        // Ein gecrafteter Aug wirkt sofort und ohne Reset. Solange noch etwas
        // craftbar UND bezahlbar ist, waere ein Install der schlechtere Tausch:
        // er beendet den ganzen Schwarm fuer denselben Zugewinn, den das
        // Craften nebenbei liefert. craftSperrtReset() nennt die Ausgaenge.
        if (craftSperrtReset()) {
            const grund = graftLaeuft()
                ? `Craft laeuft (${craftListe.length} weitere offen)`
                : `Craft-Phase: ${craftListe.length} Augs craftbar, naechstes ${craftWartetAuf || "?"}`;
            if (craftGemeldet !== grund) { craftGemeldet = grund; ns.print("RESET zurueckgestellt — " + grund + "."); }
            return null;
        }
        if (craftGemeldet) { craftGemeldet = ""; ns.print("Craft-Phase beendet — RESET wieder freigegeben."); }

        // Spielzeit seit dem letzten Aug-Reset (getResetInfo = 1 GB, flach).
        try {
            const ri = ns.getResetInfo();
            if (ri && typeof ri.lastAugReset === "number" && (now - ri.lastAugReset) < RESET_MIN_PLAY_MS) return null;
        } catch (e) { /* nicht ermittelbar -> Bedingung als erfuellt behandeln */ }

        return { count, augs: queued.slice(0, 12), why };
    };

    const managePayloads = (state) => {
        // TRADER: dauerhaft, solange Dashboard-Schalter + TIX-API da sind.
        // v1.9 RESET-PHASE: erst das GESAMTE Portfolio liquidieren (der Erlös
        // finanziert die letzten Augs), dann den TRADER stoppen — sonst kauft er
        // sofort neu und der Install vernichtet die Position.
        try {
            const tradeOk = isDaemonEnabled(ns, "TRADER", state) && hasCapability(ns, CAPS.TIX);
            // =================================================================
            // v4.6 — RESET-PHASE IST NICHT DASSELBE WIE "INSTALL KOMMT JETZT"
            // =================================================================
            // resetPhase heisst nur: die Aug-Runde ist abgearbeitet. Bis der
            // Install wirklich laeuft, koennen 60 Minuten vergehen —
            // checkResetReady() verlangt zusaetzlich RESET_MIN_PLAY_MS seit dem
            // letzten Reset und ein Ruhefenster. Die Liquidation samt DROP
            // schon beim Rundenende auszuloesen hiess: eine Stunde ohne Handel,
            // ohne dass irgendetwas bevorstand.
            //
            // Der Abbau haengt jetzt an der TATSAECHLICHEN Meldung an die Queen.
            // Solange die nicht steht, laeuft der TRADER weiter; INFRA bleibt
            // trotzdem angehalten (serverStep/hacknetStep fragen weiter
            // resetPhase), denn gekaufte Server ueberleben den Install nicht und
            // ein Zuviel an Vorsicht kostet dort nur Zinsen, keine Position.
            //
            // installGemeldet ist beim allerersten Takt noch null — das ist die
            // sichere Richtung: dann wird NICHT abgebaut.
            const installNah = !!installGemeldet;
            if (!tradeOk) { sendSpawnDrop(ns, "TRADER"); }
            else if (resetPhase && installNah) {
                // =============================================================
                // v3.4 BUGFIX — "WERT 0" HEISST NICHT "DEPOT LEER"
                // =============================================================
                // Hier stand die Bedingung "pv > 0". Sie ist falsch, sobald eine
                // Short-Position unter Wasser steht: der Depotwert wird dann
                // NEGATIV (Short-Erloes = origCost + profit, StockMarketHelpers
                // .ts:55-59), und der TRADER klemmt ihn auf 0, damit die BANK
                // nicht mit negativem Vermoegen rechnet.
                //
                // Folge war ein Deadlock, live belegt:
                //   1. Short unter Wasser  -> Depotwert negativ
                //   2. TRADER meldet 0     -> "WARN Portfolio-Wert ist NEGATIV"
                //   3. BANK liest 0        -> haelt das Depot fuer leer
                //   4. BANK sendet DROP    -> TRADER stirbt
                //   5. die Position bleibt offen und geht in den Install hinein
                // Im Lagebild sah man das als "TRADER !! FEHLT - nie gesehen"
                // bei gleichzeitig laufenden Trader-Warnungen im Terminal.
                //
                // Entschieden wird jetzt nach der ANZAHL offener Positionen.
                // Die kennt nur der TRADER, deshalb meldet er sie seit v1.3
                // getrennt vom Wert (readPortfolioHeld).
                const pv   = Math.max(0, readPortfolioValue(ns));
                const held = readPortfolioHeld(ns);
                if (held > 0) {
                    // Bei negativem oder null Wert reicht keine wertbasierte
                    // Forderung, um ALLES zu schliessen: runLiquidation bricht
                    // ab, sobald "raised >= request". Deshalb in diesem Fall
                    // eine Forderung, die nicht erfuellbar ist — das ist hier
                    // die Formulierung fuer "schliess alles".
                    setLiquidation("reset", pv > 0 ? pv : LIQ_ALLES);
                    sendSpawnWant(ns, "TRADER");        // muss dafuer noch laufen
                } else {
                    setLiquidation("reset", 0);
                    sendSpawnDrop(ns, "TRADER");        // wirklich leer -> abschalten
                }
            } else sendSpawnWant(ns, "TRADER");
        } catch (e) { ns.print("TRADER-Meldung: " + e); }

        // AUGS: One-Shot. NEU (v1.3): BANK WÄHLT das Aug (billigstes rep-erreichbares
        // aus dem INFO-Snapshot), legt es auf Port 18 und lässt AUGS es kaufen. Kein
        // blindes WANT mehr — nur wenn es ein bezahlbares Ziel gibt. Zusätzlich wird
        // WORK das nächste Rep-Ziel gemeldet (gezielter Grind statt blind).
        try {
            const now2 = Date.now();
            if (isDaemonEnabled(ns, "AUGS", state) && hasCapability(ns, CAPS.SING) && now2 - lastAugsAt >= AUGS_MS) {
                lastAugsAt = now2;

                // v1.7: Install-Bereitschaft an die Queen melden. Der Port wird JEDES
                // Mal geschrieben — auch mit null. So verschwindet die Meldung von
                // selbst, sobald eine Bedingung wieder wegfaellt (z. B. Grafting
                // startet), ohne dass jemand aufraeumen muss.
                try {
                    const rr = checkResetReady();
                    publishResetReady(ns, rr);
                    installGemeldet = rr;        // v4.6: siehe managePayloads
                    if (rr && !resetAnnounced) {
                        resetAnnounced = true;
                        ns.print(`RESET-BEREIT: ${rr.why}.`);
                    } else if (!rr) resetAnnounced = false;
                } catch (e) { ns.print("Reset-Pruefung: " + e); }

                // v1.8: KEIN Rep-Ziel mehr. Die Wahl liegt jetzt vollständig bei WORK
                // (computeAugGoals + workable-Filter). BANK kannte weder CANNOT_WORK
                // noch die Gang-Faktion noch die Mitgliedschaften und schlug deshalb
                // zweimal Faktionen vor, für die WORK nicht arbeiten kann.
                // v1.9: TEUERSTES ZUERST und dafuer ANSPAREN, statt opportunistisch
                // das Billigste mitzunehmen. Begruendung an planAugRound().
                const plan = planAugRound();
                const pick = plan ? plan.next : null;

                if (pick) {
                    // Warteuhr je Ziel fuehren — sie entscheidet spaeter, ob sich
                    // weiteres Ansparen noch lohnt oder der Install besser ist.
                    if (augWaitFor !== pick.aug) { augWaitFor = pick.aug; augWaitSince = now2; }
                } else {
                    augWaitFor = ""; augWaitSince = 0;
                }

                // =============================================================
                // v3.4 — DIE RUNDE GEHT JETZT DIE LISTE HINUNTER
                // =============================================================
                // planAugRound() sortiert absteigend nach Preis und liefert eine
                // ZIELMENGE (target, bis zu AUG_ROUND_MAX Stueck). Gelesen wurde
                // davon aber immer nur Position 0 (plan.next). War die
                // unbezahlbar, kaufte BANK GAR NICHTS — auch dann nicht, wenn
                // target[1..4] sofort bezahlbar gewesen waeren. Aus einer
                // Reihenfolge war ein Riegel geworden.
                //
                // Die urspruengliche Begruendung ist trotzdem richtig: jedes in
                // DERSELBEN Runde gekaufte Aug verteuert die folgenden um den
                // Faktor aus getAugmentationPrice. Teuerstes zuerst ist die
                // kostenminimale Reihenfolge — SOLANGE die Runde ueberhaupt
                // zustande kommt.
                //
                // Also beides: das teuerste behaelt AUG_FALLBACK_MS lang Vorrang.
                // Klemmt es laenger, wird das teuerste BEZAHLBARE genommen. Die
                // Warteuhr fuer das eigentliche Ziel laeuft dabei weiter, damit
                // die 45-Minuten-Notbremse in checkResetReady() unberuehrt bleibt.
                // v5.2: Freigabe zum Beenden des Durchlaufs (schwarm-plan.txt ->
                // QUEEN -> Port PLAN_OUT). planFreigabe prueft den Weg UND die
                // Frische — eine tote QUEEN laesst so keine alte Freigabe stehen.
                const endeWeltdaemon = planFreigabe(ns, "weltdaemon") === "weltdaemon";
                const inDaedalus = !!(io.b.player && Array.isArray(io.b.player.factions)
                    && io.b.player.factions.indexOf("Daedalus") >= 0);
                // v5.14 — In BN15 fuehrt Daedalus die Red Pill NICHT
                // (FactionHelpers.tsx:204); sie liegt dort im Darknet-Labyrinth.
                // Ohne diese Pruefung bestellte BANK sie endlos, die Engine lehnte
                // ab, und der Zweig verdraengte jeden normalen Aug-Kauf.
                let bnJetzt = (io.b.bn && io.b.bn.bitNode) || 0;
                if (!bnJetzt) { try { bnJetzt = ns.getResetInfo().currentNode || 0; } catch (e) { bnJetzt = 0; } }
                const redPillBeiDaedalus = bnJetzt !== 15;
                if (endeWeltdaemon && inDaedalus && !redPillBeiDaedalus && !redPillBn15Gemeldet) {
                    redPillBn15Gemeldet = true;
                    ns.print(`ENDE: Plan gibt "weltdaemon" frei, aber in BN15 fuehrt Daedalus "${REDPILL_AUG}" nicht —`
                        + ` sie liegt im Darknet-Labyrinth (4. Labor). BANK bestellt sie nicht; normale Kaeufe laufen weiter.`);
                    try { chronik(ns, "BANK", "redpill", "Daedalus", "nicht moeglich", "BN15: Red Pill nur im Darknet-Labyrinth"); } catch (e) { /* Beiwerk */ }
                }

                let kauf = null;
                if (pick && (cashAvail() - pick.price) >= AUG_CASH_FLOOR) {
                    kauf = pick;
                } else if (pick && augWaitSince > 0 && (now2 - augWaitSince) > AUG_FALLBACK_MS) {
                    // v4.4: target ist jetzt AUFSTEIGEND sortiert -> der erste
                    // Treffer ist das billigste bezahlbare. Dieser Zweig greift
                    // damit fast nie mehr, weil schon pick der billigste Posten
                    // ist; er bleibt als Netz, falls selbst der unbezahlbar ist.
                    kauf = plan.target.find(x => (cashAvail() - x.price) >= AUG_CASH_FLOOR) || null;
                }

                // Zielmenge abgearbeitet und alles freigeschaltet -> Reset-Phase.
                // Ab hier wird nicht mehr in Infrastruktur investiert: Prestige.ts
                // loescht beim Install ALLE gekauften Server ("Delete all servers
                // except home computer") und setzt Hacknet zurueck. Jeder Dollar
                // dorthin waere verloren. home-RAM/-Cores ueberleben und bleiben
                // deshalb erlaubt.
                // v3.4: plan.allUnlocked entfaellt auch hier — Begruendung steht
                // ausfuehrlich in checkResetReady(). Kurz: die Bedingung verlangte,
                // dass NIRGENDWO im Katalog noch ein Aug rufgesperrt ist, und war
                // damit praktisch nie wahr. Ohne resetPhase gab es nie die
                // Schluss-Liquidation, deren Erloes laut Kommentar oben "die
                // letzten Augs finanziert" — und INFRA kaufte bis zuletzt Server,
                // die der Install anschliessend loescht.
                //
                // ABER: target.length === 0 allein reicht NICHT. Direkt nach einem
                // Install ist der Ruf ueberall zurueckgesetzt, also ist NICHTS
                // freigeschaltet, also ist target leer — und resetPhase waere sofort
                // wieder wahr. Folge waere ein Schwarm, der nie wieder Server oder
                // Hacknet kauft und sein Depot dauerhaft liquidiert haelt.
                // Deshalb zusaetzlich: es muss auch wirklich etwas zu installieren
                // geben. boughtThisRound zaehlt gekaufte, noch nicht installierte
                // Augs (ohne NeuroFlux) — bei 0 gibt es nichts zu installieren und
                // damit keinen Grund, die Infrastruktur einzustellen.
                // =========================================================
                // v4.5 — DIE RESET-PHASE BRAUCHT EINEN ERREICHBAREN AUSGANG
                // =========================================================
                // Sie friert den halben Schwarm ein: keine Server (serverStep
                // steigt bei resetPhase sofort aus), kein Hacknet, TRADER wird
                // per DROP abgeschaltet. Das ist richtig, SOLANGE der Install
                // gleich kommt — jeder Dollar in Infrastruktur waere sonst weg,
                // weil Prestige.ts beim Install alle gekauften Server loescht.
                //
                // Steht der RESET-Schalter aber auf AUS, kommt der Install NIE.
                // Dann friert der Schwarm dauerhaft ein, ohne dass irgendetwas
                // darauf hinweist. Live beobachtet am 05.09.2026:
                //   5 Augs gekauft, Ruf nach dem letzten Install ueberall auf
                //   Null -> target leer -> resetPhase an. RESET stand auf aus.
                //   Folge: TRADER blieb gelb (BANK schickte im Sekundentakt
                //   DROP:TRADER), und der Pool kam von 3249 TB nicht ueber
                //   4.9 TB hinaus, weil BANK keine Server mehr kaufte.
                //
                // Der Schalter gehoert also in die Bedingung. Steht er auf aus,
                // hat der Spieler entschieden, diese Runde weiterzuspielen — und
                // dann soll der Schwarm ganz normal weiter investieren.
                const wasResetPhase = resetPhase;
                const resetErlaubt = isDaemonEnabled(ns, "RESET", state);
                resetPhase = !!(plan && plan.target.length === 0 && plan.boughtThisRound > 0 && resetErlaubt);
                if (resetPhase !== wasResetPhase) {
                    ns.print(resetPhase
                        ? "RESET-PHASE: nichts Erreichbares mehr offen — keine Infrastruktur mehr, Portfolio wird liquidiert."
                        : "RESET-PHASE beendet — normaler Betrieb.");
                }

                // =========================================================
                // v4.2 STANEK-SPERRE — die teuerste Reihenfolge im Spiel
                // =========================================================
                // Engine (CotMG/Helper.tsx, canAcceptStaneksGift): JEDE
                // Augmentierung ausser NeuroFlux sperrt Staneks Geschenk fuer
                // den GESAMTEN Durchlauf — nicht bis zum naechsten Reset,
                // sondern endgueltig. Ein einziger vorschneller Kauf kostet
                // damit den kompletten Stanek-Nutzen dieses Laufs; in BitNodes
                // mit hohem StaneksGiftPowerMultiplier (BN13: 2,0) ist das der
                // groesste Einzelverlust, den die BANK verursachen kann.
                //
                // Solange STANEK also laeuft oder noch nicht entschieden ist,
                // wird kein Aug gekauft. Meldet er "fertig" oder "gesperrt"
                // (z.B. weil kein SF13 vorhanden ist), laeuft alles normal.
                const stk = readOut(ns, SCHWARM_PORTS.STANEK_OUT);
                const stkState = stk && typeof stk.state === "string" ? stk.state : null;
                const stanekBlockt = stkState !== null && stkState !== "fertig" && stkState !== "gesperrt";
                if (stanekBlockt) {
                    publishAugBuy(ns, null);
                    sendSpawnDrop(ns, "AUGS");
                    if (augWaitFor !== "__stanek__") {
                        augWaitFor = "__stanek__";
                        ns.print(`AUGS gesperrt: STANEK laeuft noch (${stkState}). Jede Aug ausser NeuroFlux `
                            + `wuerde Staneks Geschenk fuer diesen ganzen Durchlauf verschliessen.`);
                    }
                } else if (endeWeltdaemon && inDaedalus && redPillBeiDaedalus) {
                    // =====================================================
                    // v5.2 — "The Red Pill", WENN DER PLAN DAS ENDE FREIGIBT
                    // =====================================================
                    // Sie ist der Schluessel zum Weltdaemon: erst installiert,
                    // wird w0r1d_d43m0n ueberhaupt sichtbar. Und sie taucht in
                    // BANKs normaler Auswahl NIE auf — `moneyCost: 0` und
                    // `stats: ""` (Augmentations.ts:1953). Eine Liste, die nach
                    // Preis und Nutzen sortiert, hat schlicht nichts, woran sie
                    // sie einordnen koennte. Das ist kein Fehler: "diesen
                    // Durchlauf beenden" ist keine Ertragsfrage. Der Auftrag
                    // kommt deshalb von oben — aus schwarm-plan.txt ueber die
                    // QUEEN, Port PLAN_OUT.
                    //
                    // ZWEI BEDINGUNGEN, und die zweite verhindert einen echten
                    // Deadlock:
                    //   endeWeltdaemon  Freigabe gilt fuer GENAU diese Node
                    //   inDaedalus      wir sind bereits Mitglied
                    // Daedalus verlangt 30 Augmentierungen (in BN6 sogar 35,
                    // DaedalusAugsRequirement). Griffe dieser Zweig schon VOR
                    // dem Beitritt, blockierte er genau die Kaeufe, die den
                    // Beitritt erst moeglich machen — das Ende waere nie
                    // erreichbar. Vor dem Beitritt laeuft deshalb alles normal.
                    //
                    // Die STANEK-Sperre bleibt bewusst VORGELAGERT: sie ist eine
                    // Schutzentscheidung, und STANEK meldet von sich aus
                    // "fertig" oder "gesperrt" — eine Verzoegerung, keine
                    // Sackgasse.
                    publishAugBuy(ns, { faction: "Daedalus", aug: REDPILL_AUG });
                    sendSpawnWant(ns, "AUGS");
                    if (augWaitFor !== "__redpill__") {
                        augWaitFor = "__redpill__";
                        ns.print(`ENDE: Plan gibt "weltdaemon" frei — AUGS holt jetzt "${REDPILL_AUG}" `
                            + `bei Daedalus (kostet kein Geld, nur Ruf). Nach dem Install wird `
                            + `w0r1d_d43m0n sichtbar.`);
                    }
                } else if (kauf) {
                    const ausweich = kauf !== pick;
                    const istNfg = kauf.aug === NFG_AUG;
                    publishAugBuy(ns, { faction: kauf.faction, aug: kauf.aug });
                    sendSpawnWant(ns, "AUGS");
                    // v4.4: Uhr fuer die NFG-Faelligkeit. Jeder Kauf setzt sie
                    // zurueck — NFG wird erst dann zum Thema, wenn eine halbe
                    // Stunde lang gar nichts ging.
                    augLetzterKauf = now2;
                    ns.print(`AUGS-Ziel: ${kauf.aug} @ ${kauf.faction} (${formatMoney(kauf.price)}) `
                        + `— ${plan.target.length} von max ${AUG_ROUND_MAX} offen, `
                        + (istNfg
                            ? "NeuroFlux (nichts anderes rufbar oder seit 30 min nichts gekauft)."
                            : ausweich
                            ? `Ausweichkauf: ${pick.aug} (${formatMoney(pick.price)}) klemmt seit `
                              + `${Math.round((now2 - augWaitSince) / 60000)} min.`
                            : "billigstes zuerst."));
                } else if (pick) {
                    // Bis AUG_FALLBACK_MS wird NICHT auf ein billigeres ausgewichen:
                    // das verschenkt den kleinen Exponenten an das kleine Aug.
                    // Danach schon — siehe die Begruendung an AUG_FALLBACK_MS.
                    const gap = Math.ceil(pick.price + AUG_CASH_FLOOR - cashAvail());
                    // v3.2: keine Liquidations-Anforderung mehr (siehe Kopf B1).
                    publishAugBuy(ns, null);
                    sendSpawnDrop(ns, "AUGS");
                    ns.print(`AUGS: spare fuer ${pick.aug} (${formatMoney(pick.price)}), `
                        + `Luecke ${formatMoney(gap)} — seit ${Math.round((now2 - augWaitSince) / 60000)} min`
                        + `, nichts Billigeres bezahlbar.`);
                } else {
                    publishAugBuy(ns, null);
                    sendSpawnDrop(ns, "AUGS");
                }
            }
        } catch (e) { ns.print("AUGS-Meldung: " + e); }
    };

    // =====================================================================
    // v5.12 - INFRA: DER GUENSTIGSTE SCHRITT WIRD GEKAUFT
    // =====================================================================
    // Vorschlag des Spielers (24.09.2026): "das was am guenstigsten ist wird
    // gekauft (so kommt auch home an sein ram/kerne) ohne komplizierte
    // rechnungen". Ersetzt serverStep, homeRamStep und homeCoresStep.
    //
    // Kandidaten, jeweils der NAECHSTE Schritt:
    //   pserv neu      solange ein Platz frei ist
    //   pserv-Ausbau   der kleinste pserv wird verdoppelt
    //   home-RAM       naechste Verdopplung
    //   home-Kern      naechster Kern
    // Gekauft wird der mit dem kleinsten Preis, sobald er ins Budget passt
    // (infraCash: Bargeld minus Reserve und Grossziel-Halt). Passt er nicht,
    // wird gewartet - die teureren passen dann erst recht nicht.
    //
    // ENTFALLEN: der Bonusfaktor home gegen pserv, der Reset-Zaehler dahinter
    // (lag auf wechselnden Fremdrechnern und stand deshalb immer bei 1), die
    // 35-%-Grenze und der Flotte-voll-Zweig aus v5.11.
    //
    // WAS BLEIBT, NUR FUER PSERVS:
    //   resetPhase    die Runde ist durch, pservs sterben beim Install. home
    //                 ueberlebt ihn und darf deshalb weiter kaufen.
    //   Enabler       solange kein pserv >= INFO_PSERV_MIN steht, gibt es nur
    //                 den Neukauf in dieser Groesse (oder den kleinsten, wenn
    //                 sie noch nicht bezahlbar ist) - INFO braucht den Host.
    //   INFRA-BREMSE  Worker-RAM bringt in dieser BitNode nichts (v3.3/v4.9).
    //   Rangliste     sperrt den Ausbau, wenn er bezahlbar ist, aber etwas
    //                 Besseres dran ist (v3.0). Unbezahlbares kennt sie gar
    //                 nicht (rank.jetzt) - das bleibt Kandidat, damit die
    //                 Anzeige den wirklich billigsten Schritt nennt.
    //
    // Hacknet bleibt ausdruecklich getrennt (hacknetStep), auch neue Server.

    // Handlungsbuch: Kauf, Warten, Fehlschlag. Alles ausser "gekauft" hoechstens
    // alle 10 min je Art UND Ausgang (v5.13: vorher nur je Art - ein Kauf
    // verschluckte dann den naechsten Fehlschlag derselben Art). pserv-Kaeufe
    // kommen zusammengefasst (pservMelden unten).
    const infraLetzteMeldung = {};
    const infraMelde = (art, woran, ausgang, grund, daten) => {
        const jetzt = Date.now();
        const schluessel = art + "|" + ausgang;
        if (ausgang !== "gekauft" && jetzt - (infraLetzteMeldung[schluessel] || 0) < 600_000) return;
        infraLetzteMeldung[schluessel] = jetzt;
        try { chronik(ns, "BANK", art, woran, ausgang, grund, daten); } catch (e) { /* darf nie stoeren */ }
    };

    const gueltig = (p) => typeof p === "number" && isFinite(p) && p > 0;

    /** pserv-Kandidaten, samt den Sperren, die nur fuer pservs gelten. */
    const pservKandidaten = (budget, frei) => {
        const out = [];
        if (resetPhase) return out;   // v1.9: Server ueberleben den Install nicht
        let servers = [];
        try { servers = ns.cloud.getServerNames(); } catch (e) { return out; }
        const enablerMissing = !servers.some(sv => { try { return ns.getServerMaxRam(sv) >= INFO_PSERV_MIN; } catch (e) { return false; } });

        // v3.3 INFRA-BREMSE: erzeugt Worker-RAM in dieser BitNode kein Geld
        // (ScriptHackMoneyGain 0, z. B. BN8) und gibt es keinen Boersenzugang,
        // wird nur bis zum Bedarf der pserv-Daemons gebaut. Enabler ausgenommen.
        if (!enablerMissing && !workerRamPays()) {
            let haveGb = 0;
            for (const sv of servers) { try { haveGb += ns.getServerMaxRam(sv); } catch (e) { /* skip */ } }
            const needGb = pservNeedGb();
            if (haveGb >= needGb) {
                if (!infraBrakeLogged) {
                    infraBrakeLogged = true;
                    ns.print(`INFRA-BREMSE: ScriptHackMoneyGain = 0 und kein Boersenzugang - `
                        + `zusaetzlicher Worker-RAM erzeugt hier weder Beute noch verwertbare `
                        + `Kursbewegung. pservs decken mit ${formatNumber(haveGb, 0)} GB den `
                        + `Daemon-Bedarf (${formatNumber(needGb, 0)} GB); kein weiterer Ausbau.`);
                }
                return out;
            }
        }

        const preisNeu = (ram) => { try { const c = ns.cloud.getServerCost(ram); return gueltig(c) ? c : Infinity; } catch (e) { return Infinity; } };
        if (servers.length < maxServers) {
            let ram = enablerMissing ? INFO_PSERV_MIN : PSERV_MIN_RAM;
            let preis = preisNeu(ram);
            // Enabler noch zu teuer -> kleinsten Start-Server, spaeter hochziehen.
            if (enablerMissing && preis > budget) { ram = PSERV_MIN_RAM; preis = preisNeu(ram); }
            if (isFinite(preis)) out.push({ art: "pserv-neu", was: `pserv neu (${ram} GB)`, preis, ram });
            if (enablerMissing) return out;   // erst der Host fuer INFO, kein Ausbau daneben
        }

        // v5.16: Fehlt der Enabler, steigt EIN Server durch - der GROESSTE, der
        // noch wachsen kann. Vorher der kleinste: bis der erste 256 GB hatte,
        // standen alle 25 auf 128 (Vereinfachungs-Liste Punkt 9).
        let low = PSERV_MAX_RAM, ziel = null;
        if (enablerMissing) {
            let hoch = 0;
            for (const sv of servers) { try { const r = ns.getServerMaxRam(sv); if (r < PSERV_MAX_RAM && r > hoch) { hoch = r; ziel = sv; } } catch (e) { /* skip */ } }
            if (ziel !== null) low = hoch;
        } else {
            for (const sv of servers) { try { const r = ns.getServerMaxRam(sv); if (r < low) { low = r; ziel = sv; } } catch (e) { /* skip */ } }
        }
        if (ziel === null) {
            // v3.3: "alle auf Maximum" einmal je Zustandswechsel melden - sonst
            // sieht ein erreichtes Limit aus wie ein defekter Einkauf.
            if (servers.length >= maxServers && !pservMaxGemeldet) {
                pservMaxGemeldet = true;
                ns.print(`pserv: alle ${servers.length}/${maxServers} Server auf dem Maximum `
                    + `(${PSERV_MAX_RAM} GB je Server, BitNode-Grenze). Kein Ausbau mehr moeglich.`);
            }
            return out;
        }
        pservMaxGemeldet = false;
        // Nie ueber die Grenze zielen: die Engine lehnt das ab (Kosten unendlich).
        const next = Math.min(low * 2, PSERV_MAX_RAM);
        if (next <= low) return out;
        let preis = Infinity;
        try {
            preis = (typeof ns.cloud.getServerUpgradeCost === "function")
                ? ns.cloud.getServerUpgradeCost(ziel, next) : ns.cloud.getServerCost(next);
        } catch (e) { preis = Infinity; }
        if (!gueltig(preis)) return out;
        // v5.13: gegen das Geld OHNE Halt - nur das kennt rank.jetzt. Wird der
        // Ausbau erst mit dem Halt-Geld bezahlbar, hat die Rangliste keine
        // Meinung zu ihm; der Halt selbst ist dann ein INFRA-Posten.
        if (preis <= frei && !enablerMissing && !rankAllows("pserv")) return out;   // etwas Besseres ist dran
        out.push({ art: "pserv-ausbau", was: `${ziel} ${low} -> ${next} GB`, preis, ziel, ram: next });
        return out;
    };

    // home-Preise: EIN Wegwerf-Skript fuer beide (Singularity kostet in BANK
    // selbst zu viel RAM). 30 s zwischengespeichert; vor jedem Kauf wird frisch
    // gefragt, und nach jedem home-Kauf verfaellt der Speicher.
    const HOME_RAM_MAX   = 1073741824;   // 2^30 GB, Server/data/Constants.ts:6
    const HOME_KERNE_MAX = 8;            // Singularity.ts upgradeHomeCores
    const HOME_PREIS_MS  = 30_000;
    let homePreise = null, homePreiseAt = 0;
    const homeGesperrtBis = {};          // nach einem Fehlschlag 10 min Ruhe je Art
    const holeHomePreise = async (frisch) => {
        if (!hasCapability(ns, CAPS.SING)) return null;      // ohne SF4 nicht kaufbar
        if (!frisch && Date.now() - homePreiseAt < HOME_PREIS_MS) return homePreise;
        homePreiseAt = Date.now();       // auch nach einem Fehlschlag erst in 30 s wieder
        let d = null;
        try {
            d = await evalNs(ns, "(() => { try { return {"
                + " r: ns.singularity.getUpgradeHomeRamCost(),"
                + " c: ns.singularity.getUpgradeHomeCoresCost(),"
                + " k: ns.getServer('home').cpuCores,"
                // v5.13: BitNode-Option restrictHomePCUpgrade. Die Preise bleiben
                // dann endlich, die Engine lehnt aber ab (Singularity.ts:573/604).
                + " x: (() => { try { return !!ns.getResetInfo().bitNodeOptions.restrictHomePCUpgrade; }"
                + " catch (e) { return false; } })()"
                + " }; } catch (e) { return null; } })()");
        } catch (e) { d = null; }
        homePreise = (d && typeof d === "object") ? d : null;
        if (!homePreise) infraMelde("home-preise", "home", "fehlgeschlagen",
            "Preisabfrage (evalNs) lieferte nichts - ohne Preis keine home-Kandidaten");
        return homePreise;
    };

    // Naechster Schritt fuer Anzeige und Bericht (Port 14).
    let infraNaechster = null;
    // Mehrere Kaeufe je Takt: nach einem Reset steht die Flotte sonst eine
    // Viertelstunde lang nur halb, obwohl das Geld laengst da ist.
    const INFRA_KAEUFE_JE_TAKT = 10;

    // v5.13 - DER HALT GEHOERT INFRA, NICHT GEGEN INFRA.
    // rankStep haelt Geld fuer den naechsten grossen Posten zurueck, wenn er in
    // 1-15 min finanziert ist (rank.hold) - oft home-RAM oder ein pserv.
    // infraCash() zieht dieses Geld ab. Bezahlte infraStep aus infraCash(),
    // sperrte der Posten sich selbst und kam erst bei etwa doppeltem Geld.
    // Ist der Halt ein INFRA-Posten, darf infraStep sein Geld nehmen - fuer den
    // GUENSTIGSTEN INFRA-Schritt, wie der Spieler es wollte. Hacknet und alle
    // anderen bleiben ausgesperrt; dafuer ist der Halt da.
    // AUSNAHME Aug-Vorfahrt: steht ein bezahlbares Aug an, bleibt der Halt zu -
    // sonst fraesse ein home- oder pserv-Kauf das Geld fuer das Aug.
    const infraBudget = () => {
        let b = infraCash();
        try {
            const h = rank.hold;
            if (h && (h.art === "home-ram" || h.art === "pserv") && !rank.augVorfahrt) b += holdCost();
        } catch (e) { /* ohne Halt nichts zurueckrechnen */ }
        return b;
    };

    // v5.13 - pserv-Kaeufe ZUSAMMENGEFASST ins Handlungsbuch, hoechstens eine
    // Zeile je Minute (nach einem Reset sind es Dutzende). Ganz ohne Zeile
    // schreibt DIAG ein Fenster ohne Eintrag dem Spieler zu.
    const pservSammel = { n: 0, summe: 0, seit: 0, teile: [] };
    const pservGekauft = (preis) => {
        if (pservSammel.n === 0) pservSammel.seit = Date.now();
        pservSammel.n++;
        pservSammel.summe += preis;
        pservSammel.teile.push([Date.now(), preis]);   // Nachtrag: je Kauf mit ms
        markTopoDirty(ns, "pserv");   // maxRam geaendert -> Topologie-Cache invalidieren
    };
    const pservMelden = (sofort) => {
        if (pservSammel.n === 0 || (!sofort && Date.now() - pservSammel.seit < 60_000)) return;
        let anzahl = 0, low = 0;
        try {
            const s = ns.cloud.getServerNames();
            anzahl = s.length;
            low = s.length ? Math.min(...s.map(x => ns.getServerMaxRam(x))) : 0;
        } catch (e) { /* nur Zusatzangabe */ }
        // v5.17: betrag EXAKT (Geldstand vor/nach jedem Kauf), topf wie in
        // getMoneySources - so rechnet kassen-pruefer.py gegen die Engine.
        infraMelde("pserv", "flotte", "gekauft", `${pservSammel.n} Kaeufe fuer ${formatMoney(pservSammel.summe)}, `
            + `jetzt ${anzahl}/${maxServers}, kleinster ${low} GB`,
            { betrag: pservSammel.summe, topf: "servers", n: pservSammel.n, teile: pservSammel.teile });
        pservSammel.n = 0;
        pservSammel.summe = 0;
        pservSammel.seit = 0;
        pservSammel.teile = [];
    };

    // v5.17 - Hacknet-Kaeufe ins Handlungsbuch, zusammengefasst wie pserv.
    // Gemessen wird der Geldstand direkt vor und nach hacknetStep(): der
    // Schritt ist synchron und kauft nur Hacknet, die Differenz ist also exakt
    // das, was die Engine in hacknet_expenses bucht. n zaehlt die Takte mit
    // Kauf, nicht die Einzelkaeufe.
    const hnSammel = { n: 0, summe: 0, seit: 0, teile: [] };
    const hnGekauft = (betrag) => {
        if (!(betrag > 0)) return;
        if (hnSammel.n === 0) hnSammel.seit = Date.now();
        hnSammel.n++;
        hnSammel.summe += betrag;
        // Nachtrag: je Takt mit ms - die Zeile kommt bis zu 60 s spaeter, und
        // ohne die Zeit rechnete der Kassenpruefer Kaeufe dem falschen Fenster zu.
        hnSammel.teile.push([Date.now(), betrag]);
    };
    const hnMelden = (sofort) => {
        if (hnSammel.n === 0 || (!sofort && Date.now() - hnSammel.seit < 60_000)) return;
        try {
            chronik(ns, "BANK", "hacknet", "flotte", "gekauft",
                `${hnSammel.n} Takte mit Kauf, ${formatMoney(hnSammel.summe)}`,
                { betrag: hnSammel.summe, topf: "hacknet_expenses", n: hnSammel.n, teile: hnSammel.teile });
        } catch (e) { /* darf nie stoeren */ }
        hnSammel.n = 0;
        hnSammel.summe = 0;
        hnSammel.seit = 0;
        hnSammel.teile = [];
    };

    const infraStep = async () => {
        pservMelden();
        for (let n = 0; n < INFRA_KAEUFE_JE_TAKT; n++) {
            const frei = infraCash();
            const budget = infraBudget();
            const kandidaten = pservKandidaten(budget, frei);
            const hp = await holeHomePreise(false);
            if (hp) {
                const jetzt = Date.now();
                // v5.13: restrictHomePCUpgrade - home-RAM hoechstens 128 GB, keine Kerne.
                const ramMax = hp.x === true ? 128 : HOME_RAM_MAX;
                const kerneMax = hp.x === true ? 0 : HOME_KERNE_MAX;
                let r0 = 0;
                try { r0 = ns.getServerMaxRam("home"); } catch (e) { r0 = 0; }
                if (r0 > 0 && r0 < ramMax && gueltig(hp.r) && jetzt >= (homeGesperrtBis["home-ram"] || 0)) {
                    kandidaten.push({ art: "home-ram", was: `home-RAM ${r0} -> ${r0 * 2} GB`, preis: hp.r });
                }
                if (typeof hp.k === "number" && hp.k < kerneMax && gueltig(hp.c) && jetzt >= (homeGesperrtBis["home-kern"] || 0)) {
                    kandidaten.push({ art: "home-kern", was: `home-Kern ${hp.k} -> ${hp.k + 1}`, preis: hp.c });
                }
            }
            if (kandidaten.length === 0) { infraNaechster = null; return; }

            // sort ist stabil: bei gleichem Preis gewinnt die Reihenfolge oben
            // (pserv neu vor Ausbau vor home).
            kandidaten.sort((a, b) => a.preis - b.preis);
            const k = kandidaten[0];
            infraNaechster = { was: k.was, preis: k.preis, budget };
            if (k.preis > budget) {
                if (n === 0) infraMelde("infra", k.art, "wartet", `${k.was} ${formatMoney(k.preis)} > Budget ${formatMoney(budget)}`);
                return;
            }

            if (k.art === "pserv-neu" || k.art === "pserv-ausbau") {
                let ok = false;
                const geldVor = money();   // v5.17: exakter Betrag statt erwartetem Preis
                if (k.art === "pserv-neu") {
                    let anzahl = 0;
                    try { anzahl = ns.cloud.getServerNames().length; } catch (e) { return; }
                    ok = !!ns.cloud.purchaseServer("pserv-" + anzahl, k.ram);
                } else if (typeof ns.cloud.upgradeServer === "function") {
                    ok = ns.cloud.upgradeServer(k.ziel, k.ram);
                } else {
                    ns.killall(k.ziel); ns.cloud.deleteServer(k.ziel); ok = !!ns.cloud.purchaseServer(k.ziel, k.ram);
                }
                infraNaechster = null;       // v5.13: nicht den gerade erledigten Schritt anzeigen
                if (!ok) {
                    ns.print(`INFRA: ${k.was} fuer ${formatMoney(k.preis)} abgelehnt.`);
                    infraMelde(k.art, k.was, "abgelehnt", `${formatMoney(k.preis)}, Budget ${formatMoney(budget)}`);
                    return;
                }
                const kosten = geldVor - money();
                pservGekauft(kosten > 0 ? kosten : k.preis);
                continue;
            }

            // home: vor dem Kauf frisch fragen - der Speicher darf 30 s alt sein.
            // War er veraltet (Preis gestiegen), entscheidet der naechste Takt neu.
            const frisch = await holeHomePreise(true);
            const preis = frisch ? (k.art === "home-ram" ? frisch.r : frisch.c) : null;
            if (!gueltig(preis) || preis > k.preis * 1.001 || preis > infraBudget()) return;
            const cmd = k.art === "home-ram" ? "upgradeHomeRam" : "upgradeHomeCores";
            const ok = await io.act(cmd, [], "ns.singularity." + cmd + "()");
            homePreiseAt = 0;                // der naechste Preis ist ein anderer
            infraNaechster = null;           // v5.13: s. oben
            if (ok === true) {
                ns.print(`INFRA: ${k.was} fuer ${formatMoney(preis)} (guenstigster Schritt)`);
                markTopoDirty(ns, k.art === "home-ram" ? "home-ram" : "home-cores");
                infraMelde(k.art, "home", "gekauft", `${k.was} fuer ${formatMoney(preis)}`,
                    { betrag: preis, topf: "servers" });
            } else {
                homeGesperrtBis[k.art] = Date.now() + 600_000;
                ns.print(`INFRA: ${k.was} fehlgeschlagen (io.act lieferte ${ok}) - 10 min Pause fuer diesen Posten.`);
                // v5.17: null heisst ZEITUEBERSCHREITUNG, nicht Fehlschlag - INFO
                // fuehrt den Auftrag spaeter trotzdem aus (runRpc prueft das Alter
                // nicht). Der Kauf kann also durchgegangen sein.
                infraMelde(k.art, "home", ok === null ? "unklar" : "fehlgeschlagen",
                    `io.act lieferte ${ok} - 10 min Pause fuer diesen Posten`,
                    // Nachtrag 3: fehlgeschlagen = nichts bezahlt -> betrag 0; nur
                    // "unklar" (RPC ohne Antwort) traegt den Preis als moeglichen Kauf.
                    { betrag: ok === null ? preis : 0, topf: "servers", unklar: ok === null });
            }
            return;                          // ein home-Kauf je Takt
        }
    };

    /** Verwaiste Fund-Anträge (nicht innerhalb STALE_REQ_MS erneuert) verfallen lassen.
     *  Robust gegen abgestürzte Consumer UND den AUGS-One-Shot (kein activeReq-Gedächtnis). */
    const expireStaleRequests = (store) => {
        // v5.17: liefert die verfallenen "CONSUMER/id" zurueck - Schritt 6 darf
        // einen Ablauf nicht als Verbrauch buchen.
        const weg = new Set();
        const nowT = Date.now();
        for (const consumer of Object.keys(store)) {
            for (const id of Object.keys(store[consumer])) {
                const r = store[consumer][id];
                if (r && r.ts && (nowT - r.ts) > STALE_REQ_MS) {
                    delete store[consumer][id];
                    weg.add(consumer + "/" + id);
                    ns.print(`  [Bank] Antrag verfallen (stale): ${consumer}/${id}.`);
                }
            }
        }
        return weg;
    };

    // ===================== GELD-BLOCK: ZUSTAND & LOGIK =====================
    let savings      = 0;          // reservierter Spartopf (nicht frei verfügbar)
    // v5.0: Spenden-Topf. Waechst um SPENDE_RATE des Zuflusses je Tick und ist
    // die HARTE Obergrenze fuer jede Spenden-Freigabe. Er ueberlebt einen
    // BANK-Neustart nicht — das ist gewollt: nach einem Neustart faengt der
    // Deckel wieder bei 0 an und fuellt sich aus dem laufenden Einkommen.
    let spendeTopf   = 0;
    let lastIncome   = null;       // grossIncome() vom letzten Tick (für Delta)
    const fundReqs   = {};         // CONSUMER -> { id: {cur,cost,prio,ts} }  (drainFundRequests)
    let lastGrantBlock = "";       // v4.1: warum der Top-Antrag nicht freigegeben wurde
    let corpExists   = false;
    let corpStartSent= false;      // START:CORP nur einmal senden
    let corpOhneGesehen = false;   // v5.18: in DIESEM Prozess schon "keine Corp" gesehen?
    let grantedLast  = {};         // Freigabe-Schnappschuss vom letzten Tick (Verbrauchserkennung)
    let zurueckTakt  = new Set();  // v5.17 Nachtrag: ungenutzt zurueckgezogen (nicht buchen)

    let corpCheckAt  = 0;          // Zeitpunkt des letzten hasCorporation()-Checks (Drossel)

    /** Anteil des Brutto-Zuflusses sparen: 5% normal, 30% bei aktivem Großziel.
     *  v1.0: savings wird zusätzlich je Tick auf die REALE Masse (Cash+Portfolio)
     *  gedeckelt — der v0.x-Zähler konnte Deckung vortäuschen, die es nie gab. */
    const accrueSavings = () => {
        const inc = grossIncome();
        if (lastIncome === null) { lastIncome = inc; return 0; }
        const delta = inc - lastIncome;      // Zufluss seit letztem Tick (nur Einnahmen)
        lastIncome = inc;
        let save = 0;
        if (delta > 0) {
            save = delta * (goalState.active ? GOAL_SAVINGS_RATE : SAVINGS_RATE);
            savings += save;
            // v5.0: derselbe Zufluss speist den Spenden-Topf. Bewusst aus dem
            // ZUFLUSS und nicht aus dem Bestand - so waechst er mit dem, was der
            // Schwarm verdient, und kann niemals einen vorhandenen Vorrat
            // abraeumen. Kein Deckel auf den Kontostand noetig: die Freigabe
            // laeuft ohnehin ueber cashAvail(), das Sockel, Grossziel und schon
            // erteilte Freigaben abzieht.
            spendeTopf += delta * SPENDE_RATE;
        }
        // v3.0: DER DECKEL BLEIBT — aber er ist jetzt harmlos, weil `savings` nichts
        // mehr entscheidet. Er ist reine Anzeige (Port 14, DIAG). Genau dieser Deckel
        // war der Grund, warum der Spartopf nie ueber den Kontostand wachsen konnte
        // und jedes Ziel darueber unerreichbar blieb; die Deckung kommt jetzt aus
        // reserveTotal() und der liquiden Masse.
        // v3.2: OHNE Portfolio (siehe Kopf B2/B3). savings ist reine Anzeige,
        // der Deckel soll aber nicht mit fremdem Kapital rechnen.
        savings = Math.min(savings, money());
        return save;
    };

    /** Effektive Priorität eines Antrags (eigene prio schlägt Consumer-Default). */
    const reqPrio = (consumer, r) =>
        (r.prio != null && isFinite(r.prio)) ? r.prio : (CONSUMER_PRIO[consumer] ?? DEFAULT_PRIO);

    /**
     * v5.17 — GELD-ANTRAEGE: MEHRERE FREIGABEN JE TAKT, IN PRIORITAETSFOLGE.
     *
     * Bis v5.16 gab es je Takt genau EINE Freigabe, die des obersten Antrags,
     * und passte der nicht, bekam niemand etwas. Diese Kopf-Blockade wurde
     * zweimal beim Antragsteller umgangen (GANG v0.5 schnitt zu, Spenden wurden
     * gekuerzt) statt einmal hier geloest. Jetzt der Reihe nach, prio absteigend,
     * bei Gleichstand der billigste zuerst: passt ein Antrag in den REST, wird er
     * freigegeben und abgezogen; passt er nicht, wird er uebersprungen.
     *
     * DER REST beginnt bei money - Sockel - HOLD, NICHT bei cashAvail(). cashAvail
     * zieht grantSum(grantedLast) ab - genau die Freigaben, die hier neu vergeben
     * werden. Bis v5.16 brauchte eine Freigabe deshalb das DOPPELTE an freiem Geld
     * und schaltete von Takt zu Takt an und aus (Testbericht 1665).
     *
     * BESTANDSSCHUTZ zuerst: Eine Freigabe aus dem letzten Takt, deren Antrag noch
     * offen ist, bleibt stehen (hoechstens mit dem aktuellen Antragsbetrag). WORK
     * liest die Freigabe und spendet dann per RPC - bis zu 12 s spaeter. Waere sie
     * dazwischen verschwunden, waere dasselbe Geld zweimal versprochen und die
     * Spende nie gebucht worden.
     *
     * SPENDEN (id "donate:...") bekommen hoechstens min(Spenden-Topf, Haelfte des
     * Rests an dieser Stelle) - gekuerzt, nicht abgelehnt.
     *
     * @returns {{grants:object, top:object|null, erteilt:object[], blockiert:object[], rest:number, restStart:number}}
     */
    const processMoneyGrants = () => {
        const grants = {};
        const erteilt = [], blockiert = [];
        const offen = [];
        for (const consumer of Object.keys(fundReqs)) {
            for (const id of Object.keys(fundReqs[consumer])) {
                const r = fundReqs[consumer][id];
                if (!r || r.cur !== "money") continue;   // Hash-Antraege laufen ueber den Hash-Block
                offen.push({ consumer, id, cost: r.cost, prio: reqPrio(consumer, r) });
            }
        }
        offen.sort((a, b) => (b.prio - a.prio) || (a.cost - b.cost));
        const restStart = Math.max(0, money() - RESERVE_CASH - holdCost());
        let rest = restStart;
        const hat = (a) => !!(grants[a.consumer] && grants[a.consumer][a.id] !== undefined);
        const vergib = (a, betrag, extra) => {
            if (!grants[a.consumer]) grants[a.consumer] = {};
            grants[a.consumer][a.id] = betrag;
            erteilt.push(Object.assign({ consumer: a.consumer, id: a.id, betrag, prio: a.prio,
                antrag: a.cost, restVor: rest, restNach: rest - betrag }, extra));
            rest -= betrag;
        };
        lastGrantBlock = "";
        // 1. Bestandsschutz
        for (const a of offen) {
            const alt = grantedLast[a.consumer] ? grantedLast[a.consumer][a.id] : undefined;
            if (!(typeof alt === "number" && alt > 0)) continue;
            const betrag = Math.min(alt, a.cost);
            // Nachtrag: eine Spende unter 1 Mio. nicht schuetzen - WORK spendet
            // sie nicht, und geschuetzt wuerde sie nie wieder wachsen.
            if (String(a.id).startsWith(SPENDE_ID_PRAEFIX) && betrag < SPENDE_MIN_BANK) continue;
            // Passt sie nicht mehr (Geld ist von aussen weg), faellt sie in die
            // Prioritaetsfolge zurueck und wird dort neu bewertet.
            if (betrag > 0 && betrag <= rest) vergib(a, betrag, { bestand: true, gekuerzt: betrag < a.cost });
        }
        // 2. Prioritaetsfolge
        for (const a of offen) {
            if (hat(a)) continue;
            const req = `${a.consumer}/${a.id}`;
            let betrag = a.cost, gekuerzt = false, deckel = null;
            if (String(a.id).startsWith(SPENDE_ID_PRAEFIX)) {
                deckel = Math.floor(Math.min(spendeTopf, rest * SPENDE_FREI_FRAC));
                if (deckel <= 0) {
                    blockiert.push({ req, grund: `Spende: nichts frei (Topf ${formatMoney(spendeTopf)}, Rest ${formatMoney(rest)})` });
                    continue;
                }
                if (betrag > deckel) { betrag = deckel; gekuerzt = true; }
                if (betrag < SPENDE_MIN_BANK) {
                    blockiert.push({ req, grund: `Spende unter ${formatMoney(SPENDE_MIN_BANK)} (Deckel ${formatMoney(deckel)})` });
                    continue;
                }
            }
            if (betrag > rest) {
                blockiert.push({ req, grund: `${formatMoney(betrag)} noetig, ${formatMoney(rest)} frei` });
                continue;
            }
            vergib(a, betrag, deckel === null ? { bestand: false, gekuerzt }
                : { bestand: false, gekuerzt, deckel, spendeTopf });
        }
        lastGrantBlock = blockiert.map((b) => `${b.req}: ${b.grund}`).join("; ");
        return { grants, top: offen.length ? offen[0] : null, erteilt, blockiert, rest, restStart };
    };

    // v1.0: tryLiquidateFor / ensureCorpFounding / ensureCongruityGrafting sind
    // durch die Großziel-Kette (currentGoal/goalStep, oben) ersetzt — Realwert-
    // Prüfung, ein Liquidations-Eigentümer, Corp-Autogründung als Ziel G2.

    // v5.17: Beim Beenden (Deploy, Neustart, Aug-Reset) die noch gesammelten
    // pserv-/Hacknet-Kaeufe melden - sonst fehlen bis zu 60 s Kaeufe im
    // Handlungsbuch, und der Kassenpruefer meldet sie als nicht protokolliert.
    ns.atExit(() => { try { pservMelden(true); hnMelden(true); } catch (e) { } });

    // ===================== HAUPTSCHLEIFE =====================
    const needs = {};            // PRODUZENT -> { ts, fields }  (drainHashNeeds füllt)
    let corpFondsTs = 0;         // v5.18: je CORP-Meldung hoechstens EINE Nachfuellung
    let U = null;                // aufgelöste Upgrade-Namen (Cache)

    ns.print(" // SCHWARM-BANK // v" + VERSION + " (INFRA gemergt)");

    while (true) {
        try {
            const state = readManagedState(ns);   // Dashboard-Schalter für die Payloads

            // --- v1.0: Tick-Wahrheit + Raten + Marktzugänge + Großziel ZUERST ---
            io.refresh();
            measureRates();
            try { await marketAccessStep(); } catch (e) { ns.print("MARKT: " + e); }
            try { await refreshCorpExists(); } catch (e) { ns.print("CORP-Check: " + e); }
            try { await goalStep(); } catch (e) { ns.print("GROSSZIEL: " + e); }
            try { await sleeveAugStep(); } catch (e) { ns.print("SLEEVE-AUG: " + e); }
            // Nach den Augs: ein zusaetzlicher Sleeve ist teurer als alles
            // andere hier, soll den laufenden Betrieb also nicht verdraengen.
            try { await sleeveBuyStep(); } catch (e) { ns.print("SLEEVE-KAUF: " + e); }
            try { await corpBuybackStep(); } catch (e) { ns.print("CORP-AKTIEN: " + e); }
            // DIAGNOSE (v2.0): Rangliste rechnen und melden — kauft nichts.
            let rankView = null;
            try { rankView = rankStep(); } catch (e) { ns.print("RANGLISTE: " + e); }

            // --- INFRA (immer, unabhängig von Hash-Servern): Hacknet + pservs ---
            // v1.0: beide Schritte kaufen nur noch aus infraCash() (Float + Groß-
            // ziel-Bremse) und gegen den Trader-Zins (Details an den Funktionen).
            try { prodMult = ns.getPlayer().mults.hacknet_node_money || 1; } catch (e) {}
            // v5.12: pserv + home EIN Schritt, der guenstigste zuerst. Hacknet getrennt.
            try { await infraStep(); } catch (e) { ns.print("INFRA: " + e); }
            const hnGeldVor = money();   // v5.17: exakte Hacknet-Ausgabe (Schritt ist synchron)
            try { hacknetStep(); } catch (e) { ns.print("INFRA hacknet: " + e); }
            hnGekauft(hnGeldVor - money());
            hnMelden(false);

            // --- Owner-Payloads führen (gedrosselt, weil findDaemon das Netz scannt) ---
            if (Date.now() - lastPayloadAt >= PAYLOAD_MS) { lastPayloadAt = Date.now(); managePayloads(state); }

            // --- Hash-Block: ohne Hash-Server ist U = {} und alle Schritte werden zu
            //     No-Ops (cap()/num()=0, U.x=undefined). Kein separater Idle-Zweig mehr,
            //     damit INFRA + Geld-Block IMMER laufen (siehe Kopf-Changelog).
            // v4.0: EIN Durchgang durch den eigenen Eingang (Port 6). Er traegt
            // beide Sorten — Geld-Antraege (REQ|) und Hash-Bedarf (HASH|). Zwei
            // getrennte Leser auf derselben FIFO wuerden sich gegenseitig
            // Nachrichten wegnehmen; die Regel lautet "ein Eingang, ein Leser".
            // Der Aufruf steht HIER, weil der Hash-Block ihn zuerst braucht; der
            // Geld-Block weiter unten arbeitet auf demselben Ergebnis.
            zurueckTakt = new Set();
            drainBankInbox(ns, fundReqs, needs, zurueckTakt);
            if (!U || !U.sellMoney) U = resolveUpgrades() || {};   // GEAENDERT: null-sicher, re-resolve bis Hash-Server da
            const hashServers = !!U.sellMoney;

            // Bestes Hack-Ziel für Sec/Money-Boost selbst ermitteln (score: maxMoney/minSec).
            // Nur gerootete Nicht-Home/pserv-Server; max 1x pro 30s neu bestimmen.
            if (!bestBoostTarget || Date.now() - bestBoostAt > 30_000) {
                bestBoostAt = Date.now();
                try {
                    let best = null, bestScore = -1;
                    for (const h of scanNetwork(ns)) {
                        if (!ns.hasRootAccess(h)) continue;
                        if (h.startsWith("pserv-") || h === "home") continue;
                        const s = ns.getServer(h);
                        if (!s || !s.hackDifficulty) continue;
                        const score = (s.moneyMax || 0) / (s.minDifficulty || 1);
                        if (score > bestScore) { bestScore = score; best = h; }
                    }
                    bestBoostTarget = best;
                } catch (e) { bestBoostTarget = null; }
            }

            const prod   = hashProduction();
            const sellC  = cost(U.sellMoney) || 4;   // Hashes je Geld-Verkauf ($1m/4 Hashes = Referenz)
            const action = [];
            // v3.4: welche Leitern hat die Preisgrenze gestoppt? Sichtbar machen —
            // sonst sieht "kauft nichts mehr" aus wie ein Defekt, obwohl es die
            // richtige Entscheidung ist.
            const teuerUebersprungen = new Set();

            // WERT-BASIERTE HASH-AUSGABE (v0.3 — ersetzt die starre Prioritätsleiter).
            // Doktrin: Hashes haben einen natürlichen Kurs (sellMoney = 4 Hashes -> $1m).
            // Ein Upgrade lohnt, wenn sein Nutzen/Hash ≥ diesem Kurs ist.
            // Sobald es nicht mehr lohnt, direkt verkaufen.
            // Das verhindert, dass Stufe 2 ("Hacknet-Wachstum") immer alles auffrisst.

            // ÜBERLAUF-SCHUTZ: immer zuerst, unabhängig vom Kurs.
            if (cap() > 0 && num() >= cap() * OVERFLOW_FRAC) {
                const excess = num() - cap() * SPARE_FRAC;
                const count  = Math.max(1, Math.floor(excess / sellC));
                if (spend(U.sellMoney, "", count)) action.push(`Überlauf: ${count}x Geld`);
            }

            // Alle genutzten Upgrades mit Wert/Hash bewerten.
            // sellMoney = 4h/$1m → Kurs = $250k/Hash. Besser = benutzen, schlechter = verkaufen.
            const SELL_RATE = 1e6 / sellC;   // $ je Hash bei Geld-Verkauf

            // ENTFERNT (v0.4): evalUpgrade() war toter UND kaputter Code — sie wurde nie
            // aufgerufen, und ihr Rückgabewert (c * 0.3) / c ist algebraisch KONSTANT 0.3,
            // unabhängig von Upgrade, Kosten und Kontext. Eine Bewertung fand also nie statt.

            // Geordnete Kauf-Kandidaten (teure/nützliche zuerst, unter Kurs → kein Kauf).
            const buyIfWorth = (upgKey, targetArg, contextOk, label, maxBuys = MAX_LEVEL_BUYS) => {
                if (!contextOk || !U[upgKey]) return 0;
                let bought = 0;
                for (let i = 0; i < maxBuys; i++) {
                    const c = cost(U[upgKey]);
                    if (c === null) break;
                    // Kauf lohnt wenn Kosten <= num() UND Upgrade-Kurs >= Verkaufskurs.
                    // Approximation: jedes Hacknet/Blade/Studium-Upgrade "produziert" dauerhaft
                    // mehr als es kostet — bei Hacknet ist das fast immer true. Bei Favor/Corp
                    // konservativer. Wir limitieren hier per prod-Relation.
                    if (c > num()) break;
                    // v3.4: Preisgrenze — Begruendung bei HASH_MAX_COST.
                    if (c > HASH_MAX_COST) { teuerUebersprungen.add(label); break; }
                    const hashRate = prod > 0 ? c / prod : Infinity;  // Amortisations-Zeit in Sekunden
                    if (hashRate > 3600 * 8) break;                   // Amortisation > 8h → kein Kauf
                    if (!spend(U[upgKey], targetArg)) break;
                    bought++;
                }
                if (bought > 0) action.push(`${label}: ${bought}x`);
                return bought;
            };

            // ZIEL-SERVER-BOOST via Hashes (lohnendstes Hack-Ziel).
            // GEAENDERT (v0.4) — BUGFIX mit direktem Hash-Verlust:
            // Bisher wurde bedingungslos gekauft, sobald Hashes da waren. Am Engine-Code
            // verifiziert ist das in zwei Fällen ein REINER VERLUST:
            //   1. Server.changeMinimumSecurity() klemmt minDifficulty auf Math.max(1, …).
            //      Steht das Ziel schon auf minSec 1, bewirkt jeder weitere Kauf NICHTS —
            //      die Hashes sind weg. Da "Reduce Minimum Security" 50 Hashes/Level kostet
            //      und linear teurer wird (50, 100, 150 …), verbrennt das im Endgame laufend
            //      Hashes, die als Geld-Verkauf $250k/Hash gebracht hätten.
            //   2. changeMaximumMoney() dämpft über dem Softcap (10e12) den +2%-Effekt stark.
            // Jetzt: nur kaufen, solange der Boost tatsächlich Wirkung hat.
            const hackTarget = bestBoostTarget || "";
            let tMinSec = 0, tMaxMoney = 0;   // aktueller Ziel-Zustand (auch unten im consider-Block gebraucht)
            if (hackTarget) {
                try {
                    const s = ns.getServer(hackTarget);
                    tMinSec = s.minDifficulty || 0;
                    tMaxMoney = s.moneyMax || 0;
                } catch (e) { tMinSec = 0; tMaxMoney = 0; }

                // MinSec senken — NUR solange der Boden (1.0) nicht erreicht ist.
                if (U.reduceMinSec && tMinSec > MINSEC_FLOOR) {
                    let b = 0;
                    for (let i = 0; i < BOOST_MAX_BUYS; i++) {
                        if (tMinSec <= MINSEC_FLOOR) break;          // Boden erreicht -> Stopp
                        const c = cost(U.reduceMinSec);
                        if (c === null || c > num()) break;
                        if (c > HASH_MAX_COST) { teuerUebersprungen.add("MinSec"); break; }
                        if (!spend(U.reduceMinSec, hackTarget)) break;
                        tMinSec *= 0.98;                             // Engine: value 0.98 je Kauf
                        b++;
                    }
                    if (b > 0) action.push(`MinSec↓ ${hackTarget} (${b}x, jetzt ${tMinSec.toFixed(1)})`);
                }

                // MaxMoney heben — NUR unterhalb des Softcaps (darüber verpufft der Effekt).
                if (U.increaseMaxMoney && tMaxMoney > 0 && tMaxMoney < MAXMONEY_SOFTCAP) {
                    let b = 0;
                    for (let i = 0; i < BOOST_MAX_BUYS; i++) {
                        if (tMaxMoney >= MAXMONEY_SOFTCAP) break;
                        const c = cost(U.increaseMaxMoney);
                        if (c === null || c > num()) break;
                        if (c > HASH_MAX_COST) { teuerUebersprungen.add("MaxMoney"); break; }
                        if (!spend(U.increaseMaxMoney, hackTarget)) break;
                        tMaxMoney *= 1.02;                           // Engine: value 1.02 je Kauf
                        b++;
                    }
                    if (b > 0) action.push(`MaxMoney↑ ${hackTarget} (${b}x, jetzt ${formatMoney(tMaxMoney)})`);
                }
            }

            // NEU v0.3: Contracts via Hashes kaufen (25h pro Contract, dann Dispatcher löst).
            if (U.genContract) {
                const c = cost(U.genContract);
                if (c !== null && c > HASH_MAX_COST) teuerUebersprungen.add("Contract");
                else                 if (c !== null && c <= num() && num() > c * 2) {   // nur kaufen wenn Vorrat > 2x Preis
                    if (spend(U.genContract)) action.push("Contract generiert");
                }
            }

            // Hacknet-Wachstum: NUR wenn der Shortfall-Kurs besser als Verkauf ist.
            // Statt stur alle Hashes für Hacknet-Geld zu verkaufen, prüfen wir ob der
            // nächste Hacknet-Kauf sich lohnt. Er lohnt fast immer früh im Spiel, aber
            // nicht mehr wenn das Hacknet bereits maxed ist.
            // v3.0 UNTERGRENZE. Dieser Zweig verkaufte ohne jede Schranke bis zum
            // Hacknet-Bedarf, waehrend der freie Verkauf unten `keepFloor` respektiert.
            // Live standen deshalb 7 Hashes im Bestand — ein Zielboost kostet 50, ein
            // Contract 25, beide Leitern waren strukturell unerreichbar. Der Vorrat
            // fuer das teuerste GEWUENSCHTE Ziel bleibt jetzt auch hier stehen.
            const hashKeep = Math.max(cap() * SPARE_FRAC, lastWantedCost);
            if (hacknetShortfall > 0 && U.sellMoney && num() > hashKeep) {
                // Approximation: Hacknet-Upgrade amortisiert sich durch erhöhte Hash-Rate.
                // Kauf lohnt wenn ROI-Zeit < 4h (14400s). hacknetStep hat den nächsten Kauf
                // bereits berechnet; hier nur noch die Hashes dafür zur Verfügung stellen.
                const nextHacknetCost = hacknetShortfall;
                const hacknetRoi = prod > 0 ? nextHacknetCost / (prod * SELL_RATE) : Infinity;
                if (hacknetRoi < 14400) {
                    const sells  = Math.ceil(nextHacknetCost / 1e6);
                    // Nur den Ueberschuss ueber der Untergrenze verkaufen.
                    const afford = Math.floor(Math.max(0, num() - hashKeep) / sellC);
                    const count  = Math.min(sells, afford);
                    if (count > 0 && spend(U.sellMoney, "", count)) action.push(`Hacknet: ${count}x Geld`);
                }
            }

            // Corp-Fonds (nur wenn nötig und Kurs stimmt).
            const corp = fresh(needs, "CORP");
            // v5.18: die Meldung traegt den Fondsstand ihrer Runde. Wer je Takt
            // (2 s) erneut nachfuellt, rechnet mit einem Stand, den er selbst
            // laengst ueberholt hat - live $0,4b -> $183b bei Schwelle $40b.
            const corpMeldung = needs["CORP"];
            if (corp && U.corpFunds && corpMeldung && corpMeldung.ts !== corpFondsTs) {
                const funds = Number(corp.funds);
                if (isFinite(funds) && funds < CORP_FUNDS_MIN) {
                    corpFondsTs = corpMeldung.ts;
                    const wanted = Math.ceil((CORP_FUNDS_MIN - funds) / 1e9);
                    let buys = 0;
                    while (buys < wanted) {
                        const c = cost(U.corpFunds);
                        if (c === null || c > num()) break;
                        if (!spend(U.corpFunds)) break;
                        buys++;
                    }
                    if (buys > 0) {
                        action.push(`Corp-Fonds: ${buys}x $1b`);
                        // v5.18: kein Spielergeld, deshalb ohne topf/betrag.
                        try {
                            chronik(ns, "BANK", "hash", "Corp-Fonds", "gekauft",
                                `${buys}x $1b (Fonds vorher ${formatMoney(funds)})`,
                                { n: buys, fonds: buys * 1e9 });
                        } catch (e) { /* Beiwerk */ }
                    }
                }
            }

            // Bladeburner Rank/SP (hoher dauerhafter Nutzen → fast immer sinnvoll).
            if (hasCapability(ns, CAPS.BLADE)) {
                buyIfWorth("bladeRank", "", true, "Blade-Rank");
                buyIfWorth("bladeSP",   "", true, "Blade-SP");
            }

            // Corp-Forschung.
            if (corp && U.corpResearch && String(corp.researchWant) === "1" && corp.researchDiv) {
                buyIfWorth("corpResearch", String(corp.researchDiv), true, `Corp-Forschung(${corp.researchDiv})`);
            }

            // NEU v0.3: Studium/Sport pauschal kaufen wenn WORK aktiv (schnellere Stats).
            const work = fresh(needs, "WORK");
            if (work) {
                if (work.doing === "STUDY" || work.doing === "GYM" || work.doing === "COMPANY" || work.doing === "CRIME") {
                    if (U.study) buyIfWorth("study", "", true, "Studium-Boost", 3);
                    if (U.gym)   buyIfWorth("gym",   "", true, "Gym-Boost",     3);
                }
                if (work.doing === "COMPANY" && work.company && U.companyFavor) {
                    buyIfWorth("companyFavor", work.company, true, `Favor(${work.company})`, 2);
                }
            }

            // FREIER VERKAUF: alles oberhalb des Sparvorrats.
            // GEAENDERT (v0.4): Der Verkauf hielt starr nur cap*SPARE_FRAC (50%) zurück.
            // Kostete ein GEWÜNSCHTES Upgrade mehr als das (z.B. 70% der Kapazität), wurde
            // der Vorrat jedes Mal unter die Zielmarke verkauft — das Ziel war NIE
            // ansparbar (Dauer-Blockade). Jetzt ist die Untergrenze das Maximum aus
            // Spar-Anteil und dem teuersten gewünschten Ziel (Wert vom letzten Tick,
            // 2s Lag ist unkritisch).
            const keepFloor = Math.max(cap() * SPARE_FRAC, lastWantedCost);
            if (cap() > 0 && num() > keepFloor) {
                const excess = num() - keepFloor;
                const count  = Math.floor(excess / sellC);
                if (count > 0 && spend(U.sellMoney, "", count)) action.push(`Frei: ${count}x Geld`);
            }

            // --- CACHE-KOPPLUNG: teuerstes GEWÜNSCHTES Ziel an INFRA melden ---
            // Wenn ein levelndes Ziel, das wir kaufen WOLLEN, mehr Hashes kostet
            // als die Kapazität fasst, können wir es nie ansparen -> INFRA soll
            // den Cache vergrößern. Nur aktuell gewünschte Ziele zählen (sonst
            // würde INFRA sinnlos Cache für nie genutzte Upgrades kaufen).
            let maxWantedCost = 0;
            const consider = (upg, wanted) => {
                if (!wanted || !upg) return;
                const c = cost(upg);
                if (c !== null && c > maxWantedCost) maxWantedCost = c;
            };
            consider(U.bladeRank,        hasCapability(ns, CAPS.BLADE));
            consider(U.bladeSP,          hasCapability(ns, CAPS.BLADE));
            consider(U.corpResearch,     corp && String(corp.researchWant) === "1");
            // GEAENDERT (v0.4): nur zählen, wenn der Boost überhaupt noch WIRKT — sonst
            // hätte die BANK Cache für Upgrades vergrößert, die sie (korrekt) nicht kauft.
            consider(U.reduceMinSec,     !!hackTarget && tMinSec > MINSEC_FLOOR);
            consider(U.increaseMaxMoney, !!hackTarget && tMaxMoney > 0 && tMaxMoney < MAXMONEY_SOFTCAP);
            consider(U.genContract,      true);
            if (work) {
                consider(U.companyFavor, work.doing === "COMPANY" && !!work.company);
                consider(U.study,        true);
                consider(U.gym,          true);
            }
            // GEAENDERT (v0.2): intern setzen statt an INFRA melden (INFRA ist gemergt).
            // v4.0: Hash-Kennzahlen fuers Dashboard (Feld `hash` in BANK_OUT).
            // Frueher Port 33 und SCHWARM-HASHNETs Aufgabe — der Daemon ist tot,
            // der Port hatte seitdem keinen Schreiber, die Anzeige blieb leer.
            try {
                publishHashInfo(ns, {
                    num: num(), cap: cap(), prodPerSec: hashProduction(),
                    spentTotal: hashSpentTotal, ts: Date.now(),
                });
            } catch (e) { /* Anzeige darf den Takt nie stoppen */ }

            // hacknetStep() liest cacheNeed im nächsten Tick für cacheStep().
            cacheNeed = maxWantedCost > cap() ? maxWantedCost : 0;
            // NEU (v0.4): Sparziel für den freien Verkauf im nächsten Tick merken.
            lastWantedCost = maxWantedCost;

            // ===================== GELD-BLOCK =====================
            // 1) Anträge sind oben schon eingesammelt (drainBankInbox, EIN Leser
            //    fuer den ganzen Eingang). Hier nur noch die verwaisten verfallen
            //    lassen.
            const verfallen = expireStaleRequests(fundReqs);   // v5.17: Set der verfallenen, s. Schritt 6

            // 2) 5% des Brutto-Zuflusses seit letztem Tick sparen
            const saved = accrueSavings();

            // 3) Großziele (4S-API/Corp/Congruity) laufen bereits am Tickanfang
            //    über goalStep() — hier nur noch die Consumer-Anträge.

            // 4) Geld-Anträge der Consumer bewerten + ggf. Freigabe erteilen
            const { grants, top, erteilt, blockiert, rest: restNachFreigaben } = processMoneyGrants();

            // 5) Freigaben veröffentlichen
            const allGrants = grants;
            publishFundGrants(ns, allGrants);

            // 6) Verbrauchte Freigaben ausbuchen: Consumer meldet gekaufte Ziele per
            //    cost<=0 ab (drainFundRequests entfernt sie dann). Sinkt der Antrag
            //    weg, war der Kauf erfolgt -> Betrag aus dem Spartopf nehmen.
            //    (Wir erkennen das am Verschwinden zwischen den Ticks.)
            // v5.17: drei Faelle statt einem - noch offen (entzogen?), verfallen
            // (NICHT buchen), abgemeldet (buchen). Jeder landet mit exaktem
            // Betrag im Handlungsbuch; kassen-pruefer.py gleicht ihn mit dem
            // Verbrauch ab, den GANG/WORK selbst melden.
            for (const consumer of Object.keys(grantedLast)) {
                for (const id of Object.keys(grantedLast[consumer])) {
                    const stillOpen = fundReqs[consumer] && fundReqs[consumer][id];
                    const req = `${consumer}/${id}`;
                    if (stillOpen) {
                        if (!(grants[consumer] && grants[consumer][id] !== undefined)) {
                            try { chronik(ns, "BANK", "freigabe", req, "entzogen",
                                `${formatMoney(grantedLast[consumer][id])} - Antrag offen, passt nicht mehr`,
                                { id: req, betrag: grantedLast[consumer][id] }); } catch (e) { }
                        }
                        continue;
                    }
                    if (zurueckTakt.has(req)) {
                        try { chronik(ns, "BANK", "freigabe", req, "zurueckgezogen",
                            `${formatMoney(grantedLast[consumer][id])} - ungenutzt abgemeldet, nicht gebucht`,
                            { id: req, betrag: grantedLast[consumer][id] }); } catch (e) { }
                        continue;
                    }
                    if (verfallen.has(req)) {
                        ns.print(`  [Bank] Freigabe ${req} verfallen - NICHT gebucht.`);
                        try { chronik(ns, "BANK", "freigabe", req, "verfallen",
                            `${formatMoney(grantedLast[consumer][id])} - Antrag nicht erneuert, nicht gebucht`,
                            { id: req, betrag: grantedLast[consumer][id] }); } catch (e) { }
                        continue;
                    }
                    {
                        const betrag = grantedLast[consumer][id];
                        try { chronik(ns, "BANK", "freigabe", req, "gebucht", formatMoney(betrag),
                            { id: req, betrag }); } catch (e) { }
                        savings = Math.max(0, savings - betrag);
                        // v5.0: Eine verbrauchte SPENDE geht zusaetzlich vom
                        // Spenden-Topf ab. Ohne diese Zeile waere der Deckel
                        // wirkungslos — der Topf waere nur gewachsen und haette
                        // ab dem zweiten Mal jede beliebige Summe gedeckt.
                        if (String(id).startsWith(SPENDE_ID_PRAEFIX)) {
                            spendeTopf = Math.max(0, spendeTopf - betrag);
                            ns.print(`  [Bank] Spende verbraucht: ${id} (${formatMoney(betrag)})`
                                + ` -> Spenden-Topf ${formatMoney(spendeTopf)}.`);
                        }
                        ns.print(`  [Bank] Freigabe verbraucht: ${consumer}/${id} (${formatMoney(betrag)}) -> Spartopf ${formatMoney(savings)}.`);
                    }
                }
            }
            // v5.17: neu erteilte (oder im Betrag geaenderte) Freigaben ins
            // Handlungsbuch - nur dann, sonst stuende alle 2 s dieselbe Zeile da.
            for (const e of erteilt) {
                const alt = grantedLast[e.consumer] ? grantedLast[e.consumer][e.id] : undefined;
                if (alt === e.betrag) continue;
                const d = { id: `${e.consumer}/${e.id}`, betrag: e.betrag, prio: e.prio, antrag: e.antrag,
                            restVor: e.restVor, restNach: e.restNach, bestand: !!e.bestand, gekuerzt: !!e.gekuerzt };
                if (e.deckel !== undefined) { d.deckel = e.deckel; d.spendeTopf = e.spendeTopf; d.freiFrac = SPENDE_FREI_FRAC; }
                try { chronik(ns, "BANK", "freigabe", d.id, "erteilt",
                    `${formatMoney(e.betrag)} (Prio ${e.prio}${e.gekuerzt ? ", gekuerzt" : ""})`, d); } catch (err) { }
            }
            grantedLast = JSON.parse(JSON.stringify(allGrants)); // Schnappschuss für nächsten Tick

            // 7) Kennzahlen veröffentlichen (Dashboard/Consumer)
            const openMoney = Object.values(fundReqs).reduce((a, c) => a + Object.values(c).filter(r => r.cur === "money").length, 0);
            const g = goalState.active;
            publishBankInfo(ns, {
                savings, corpExists,
                // v5.0: Der Spenden-Topf gehoert ins Lagebild. WORK liest die
                // Obergrenze hier ab und beantragt gar nicht erst mehr — sonst
                // stuende im Report dauerhaft ein Antrag, der jedes Mal gekuerzt
                // wird, und das saehe wie ein Fehler aus.
                spende: { topf: spendeTopf, rate: SPENDE_RATE },
                // v3.0: die RESERVE ist jetzt die entscheidende Groesse, nicht der
                // Spartopf. Ohne diese Felder waere im Report nicht zu sehen, warum
                // Geld liegen bleibt.
                reserve: { sockel: RESERVE_CASH, hold: holdCost(), holdRoh: holdCostRaw(),
                           grants: grantSum(grantedLast), gesamt: reserveTotal() },
                frei: cashAvail(), betriebsfrei: opCash(),
                goalEtaMin: (goalState.etaMs === undefined || !isFinite(goalState.etaMs))
                    ? null : Math.round(goalState.etaMs / 60000),
                savingsRate: g ? GOAL_SAVINGS_RATE : SAVINGS_RATE,
                // v5.6: Saatgeld gilt auch fuer die ANZEIGE. v5.4 hat es in
                // currentGoal() und die Rangliste eingebaut, diese Zeile aber
                // vergessen — der Bericht meldete in BN3 weiter "Corp-Ziel
                // $150.00b", obwohl die Gruendung dort gratis ist. Eine Anzeige,
                // die der Entscheidung widerspricht, kostet genau das, was sie
                // sparen soll: Vertrauen in die eigenen Zahlen.
                corpGoal: corpExists ? 0 : (corpSaatgeld() ? 0 : CORP_FOUNDING_COST),
                goal: g ? { key: g.key, label: g.label, cost: g.cost, liquid: liquid(),
                            portfolio: readPortfolioValue(ns), status: goalState.waiting } : null,
                // v4.7: Craft-Phase sichtbar machen. Ohne diese Felder waere im
                // Report nicht zu erklaeren, warum RESET nicht mehr meldet.
                craft: congruityDone ? {
                    aktiv: craftSperrtReset(),
                    laeuft: graftLaeuft(),
                    fertig: craftFertig,
                    offen: craftListe.length,
                    naechst: craftListe.length ? craftListe[0].name : null,
                    preis: craftListe.length ? craftListe[0].preis : 0,
                    wartetMin: craftWartetSeit > 0
                        ? Math.round((Date.now() - craftWartetSeit) / 60000) : 0,
                } : null,
                ratePerH: traderRatePerH(),
                hackPerGbH: rates.hackSamples >= RATE_MIN_SAMPLES ? rates.emaHackGb : 0,
                market: capsNow(),
                topTarget: top ? `${top.consumer}/${top.id}` : (g ? g.label : "—"),
                // v4.1: Grund, falls der Top-Antrag nicht freigegeben wurde.
                // v5.17: alle Gruende, je Antrag ("CONSUMER/id: ...; ...").
                topBlocked: lastGrantBlock || null,
                openMoneyReqs: openMoney,
                // v5.17: was in diesem Takt freigegeben bzw. uebersprungen wurde.
                freigaben: erteilt.map((e) => ({ req: `${e.consumer}/${e.id}`, betrag: e.betrag,
                    prio: e.prio, gekuerzt: !!e.gekuerzt, bestand: !!e.bestand })),
                blockiert: blockiert.slice(0, 6),
                unbedient: blockiert.length,
                restNachFreigaben,
                // v5.12: naechster INFRA-Schritt (pserv/home, der guenstigste)
                // samt dem Budget, gegen das er gerade steht.
                infra: infraNaechster,
                // v2.0 DIAGNOSE: was BANK kaufen WUERDE, wenn die Rangliste scharf
                // waere. Bewusst kurz gehalten (Port 14 ist ein peek-Port, ein Wert).
                rank: rankView ? {
                    frei: rankView.frei,
                    incPerSec: rankView.inc,
                    hold: rank.hold ? { was: rank.hold.was, kosten: rank.hold.kosten, etaMin: Math.round(rank.hold.etaMs / 60000) } : null,
                    jetzt: rankView.jetzt.slice(0, 3).map(x => ({ was: x.was, kosten: x.kosten, perH: x.perH })),
                    spaeter: rankView.spaeter.slice(0, 3).map(x => ({ was: x.was, kosten: x.kosten, etaMin: isFinite(x.etaMs) ? Math.round(x.etaMs / 60000) : null })),
                } : null,
            });

            // --- STATUS ---
            // GEAENDERT (v0.2): INFRA ist gemergt -> kein Port-Produzent mehr; stattdessen
            // interner Hacknet/pserv-Stand. CORP/WORK bleiben externe Produzenten.
            const staleInfo = ["CORP", "WORK"]
                .map(p => `${p}:${fresh(needs, p) ? "frisch" : "—"}`).join(" ");
            let hnN = 0, psN = 0;
            try { hnN = ns.hacknet.numNodes(); } catch (e) {}
            try { psN = ns.cloud.getServerNames().length; } catch (e) {}
            const hashInfo = hashServers ? `Hashes ${formatNumber(num(), 0)}/${formatNumber(cap(), 0)} | Prod ${prod.toFixed(2)}/s` : "keine Hash-Server";
            ns.print(`${hashInfo} | Hacknet ${hnN} | pservs ${psN}/${maxServers} | ${staleInfo}`);
            if (infraNaechster) {
                ns.print(`  [INFRA] naechster Schritt: ${infraNaechster.was} fuer ${formatMoney(infraNaechster.preis)}`
                    + (infraNaechster.preis > infraNaechster.budget
                        ? ` - wartet (Budget ${formatMoney(infraNaechster.budget)})` : ""));
            }
            ns.print(action.length ? `  -> ${action.join(" | ")}` : "  -> keine Hash-Ausgabe nötig");
            if (teuerUebersprungen.size) {
                ns.print(`  -> Preisgrenze (${HASH_MAX_COST} Hashes) erreicht bei: `
                    + `${[...teuerUebersprungen].join(", ")}. Diese Hashes gehen jetzt in den `
                    + `Verkauf ($${(1e6 / 4 / 1000).toFixed(0)}k je Hash) statt in ein Upgrade.`);
            }
            const gg = goalState.active;
            const goalTxt = gg ? `Ziel ${gg.label}: ${goalState.waiting || "spart"}` : (corpExists ? "Corp ✓" : "kein Großziel");
            ns.print(`  [Bank] RESERVE ${formatMoney(reserveTotal())} `
                + `(Sockel ${formatMoney(RESERVE_CASH)}`
                + (holdCost() > 0 ? ` + HOLD ${formatMoney(holdCost())}` : "")
                + (grantSum(grantedLast) > 0 ? ` + Freigaben ${formatMoney(grantSum(grantedLast))}` : "")
                + `) | frei ${formatMoney(cashAvail())} | ${goalTxt}`
                + ` | Zins ${(traderRatePerH() * 100).toFixed(0)}%/h | Anträge: ${openMoney}`);
            ns.print(`  [Bank] Spartopf ${formatMoney(savings)} (+${formatMoney(saved)}/Tick) — reine ANZEIGE seit v3.0`);
            // DIAGNOSE-Ausgabe der Rangliste (vergleiche mit dem, was BANK oben
            // tatsaechlich gekauft hat — deshalb steht sie direkt daneben).
            if (rankView) {
                const pct = (v) => v === null || v === undefined ? "  —  " : (v * 100).toFixed(0) + "%/h";
                const j = rankView.jetzt.slice(0, 3)
                    .map(x => `${x.was} ${formatMoney(x.kosten)} ${pct(x.perH)}`).join("  |  ");
                ns.print(`  [RANG] frei ${formatMoney(rankView.frei)} | Einkommen ${formatMoney(rankView.inc)}/s`);
                ns.print(`  [RANG] jetzt: ${j || "nichts bezahlbar"}`);
                // v3.4: sichtbar machen, warum INFRA gerade stillhaelt.
                if (rankView.augVorfahrt && rankView.augOffen) {
                    ns.print(`  [RANG] AUG-VORFAHRT: ${rankView.augOffen.was} `
                        + `${formatMoney(rankView.augOffen.kosten)} — pserv/Hacknet warten (max `
                        + `${Math.round(AUG_YIELD_MAX_MS / 60000)} min).`);
                } else if (rankView.augOffen) {
                    ns.print(`  [RANG] AUG-VORFAHRT abgelaufen: ${rankView.augOffen.was} ist bezahlbar, `
                        + `wird aber nicht gekauft — INFRA laeuft wieder. Ruf oder AUGS-Start pruefen.`);
                }
                if (rank.hold) {
                    ns.print(`  [RANG] HOLD: ${rank.hold.was} ${formatMoney(rank.hold.kosten)} in ~${Math.round(rank.hold.etaMs / 60000)} min`);
                } else if (rankView.spaeter.length) {
                    const sp = rankView.spaeter.find(x => x.etaMs > HOLD_ETA_MAX_MS) || rankView.spaeter[0];
                    const eta = isFinite(sp.etaMs) ? `~${Math.round(sp.etaMs / 60000)} min` : "nie (kein Einkommen)";
                    ns.print(`  [RANG] kein HOLD | naechster grosser: ${sp.was} ${formatMoney(sp.kosten)} — ${eta}`);
                }
            }
            if (hnDiag.prod > 0 || hnDiag.cap > 0) {
                const fillPct = hnDiag.cap > 0 ? (hnDiag.num / hnDiag.cap * 100) : 0;
                ns.print(`  [HN]   Prod ${hnDiag.prod.toFixed(2)}/s | Kap ${Math.floor(hnDiag.num)}/${Math.floor(hnDiag.cap)} (${fillPct.toFixed(0)}%) | Gate ${(hnDiag.gate * 100).toFixed(0)}%/h vs beste ${(hnDiag.bestRate * 100).toFixed(0)}%/h`);
            }

        } catch (e) {
            ns.print(`FEHLER: ${String(e)}`);
        }
        await ns.sleep(SLEEP);
    }
}