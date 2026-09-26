/**
 * SCHWARM-CORP.js — v0.48
 *
 * v0.48 — FRUEHER BOERSENGANG STATT HENNE-EI-FALLE.
 *   Beobachtet: 1 Division, 4/6 Staedte, privat, Runde 0/2, $774 Mio.
 *   Die Kette: `base = cities >= 6 && profit > 0` war falsch -> Runde 1
 *   wartete -> kein IPO -> kein Kapital -> weiterhin 4/6 Staedte. Und die
 *   Karenzzeit half nicht: sie startet erst, WENN base wahr ist. Eine
 *   Stadt kostet ~$4 Mrd. bei $774 Mio. Fonds — die Corp konnte sich die
 *   Bedingung nicht erarbeiten, die ihr das Geld dafuer gegeben haette.
 *   JETZT: BOERSE_SOFORT geht direkt an die Boerse und verkauft dabei
 *   BOERSE_SOFORT_ANTEIL der Aktien — goPublic(n) zahlt n * Kurs aus
 *   (Actions.ts:159). Bisher lief goPublic(0): null Aktien, null Geld.
 *   PREIS: nach dem IPO gibt es keine Investment-Runden mehr. Deren 3x/2x
 *   waere eigentlich der bessere Hebel — aber nur fuer eine Corp, die
 *   nicht feststeckt. Deshalb EINSTELLBAR, nicht fest verdrahtet.
 *
 * v0.47 — CORP SCHREIBT SEINE HANDLUNGEN MIT.
 *   Erster Nutzer des Handlungsbuchs (HELPERS v5.12). Eingetragen werden
 *   Lager, Buero, Upgrades und die Reihum-Zuteilung — und zwar in JEDEM
 *   Zweig, nicht nur im Erfolgsfall. Der Ausgang ist ein FELD.
 *   Wichtigster Eintrag ist "lager / zu teuer": genau dieser stumme
 *   Fehlschlag hat den Lager-Fehler (v0.43) monatelang verborgen.
 *
 * v0.46 — SMART SUPPLY KENNT DIE IMPORTE, FORSCHUNG WIRD BREITER.
 *   a) setSmartSupplyOption kam hier GAR NICHT vor; die Engine-Vorgabe ist
 *      "leftovers" (Warehouse.ts:39). Fuer Material, das per Export
 *      hereinkommt, ist "imports" richtig (Division.ts:535-544).
 *      MASS HALTEN: Importe landen im Lager, "leftovers" erfasst sie also
 *      auch — nur einen Marktzyklus spaeter. Der Gewinn ist ein
 *      Zeitvorteil, kein halbierter Einkauf.
 *   b) RESEARCH_PRIORITY kannte 5 von 19 Forschungen. Die Produktions- und
 *      Kapazitaetshebel fehlten vollstaendig.
 *      NICHT dabei: HRBuddy-Recruitment. Es stellt automatisch ein — aber
 *      die Bueros sind IMMER voll besetzt (1068/1068, 51/51 gemessen), es
 *      fehlen PLAETZE, nicht Leute.
 *
 * v0.45 — REIHUM STATT GIESSKANNE (Idee des Nutzers).
 *   Das Rundenbudget wurde VOLL ausgegeben ($1,27 Bio. von $1,27 Bio.) —
 *   Geld war nie das Problem, die VERTEILUNG war es. growWithBudget lief
 *   `for (const div of divNames)` gegen EIN gemeinsames Budget: wer zuerst
 *   drankam, wurde satt. Gemessen: Agriculture 1068 Plaetze, Chemical 891,
 *   Restaurant 51, Fishing 36. Die hinteren kamen NIE an die Reihe.
 *   WARUM KONZENTRATION HILFT: fast alles hat Schwellenpreise. Ein
 *   Bueroausbau kostet $4,36 Mrd. am Stueck (1.09^Groesse). $4 Mrd. auf
 *   vier Divisionen verteilt kauft GAR NICHTS.
 *   JETZT: die schwaechste Division bekommt die VOLLE Runde (Wachstum,
 *   Boost, AdVert). Rangfolge nacheinander verglichen, nicht verrechnet:
 *   Staedte -> Plaetze je Stadt -> Lager. Was sie nicht ausgeben kann,
 *   steht den Corp-Upgrades zur Verfuegung.
 *
 * v0.44 — DIE CORP-UPGRADES WAREN UNSICHTBAR.
 *   In 60 Berichten stand keine Zeile zu Upgrade-Stufen. Ob Project
 *   Insight, Smart Storage oder Wilson Analytics je gekauft wurden, war
 *   von aussen nicht feststellbar.
 *   DAS WIEGT SCHWER, weil Project Insight der einzige Forschungshebel
 *   ist, der LINEAR durchschlaegt: Division.ts:457 nimmt die R&D-Leistung
 *   mit ^0.5, den Corp-Multiplikator (Corporation.ts:476 = Project
 *   Insight) aber voll. Die Mitarbeiter-Implantate wirken nur ueber die
 *   Produktion, also ebenfalls gedaempft durch die Wurzel.
 *   Verdacht: nie gekauft. corpUpgradeStep ist der LETZTE Posten des
 *   Rundenbudgets (zuletzt $1.33 Mrd Rest), Project Insight kostet schon
 *   auf Stufe 0 $5 Mrd.
 *   Diese Fassung aendert NICHTS am Kaufverhalten — sie macht die Zahlen
 *   nur sichtbar, damit die naechste Entscheidung auf Messung beruht.
 *
 * v0.43 — DAS LAGER WURDE STILL UEBERSPRUNGEN (derselbe Fehler wie v0.39).
 *   growWithBudget kaufte eine Lagerstufe nur, wenn sie ins Rundenbudget
 *   passte - und tat sonst NICHTS: kein else, keine Logzeile, kein Ansparen.
 *   Genau das stand in v0.39 beim Buero eine Zeile tiefer und wurde dort mit
 *   einem eigenen Topf geloest.
 *   BELEG: ueber zwoelf Berichte wurden immer ~75 % des Rundenbudgets
 *   ausgegeben (4.94/6.58, 4.30/5.73, 2.21/2.94 ...) - also exakt
 *   BOOST_ROUND_FRAC. Lager, AdVert und Upgrades gingen leer aus, obwohl das
 *   Lager VOR dem Boost drankommt. Dazu der Dauerbefund "Agriculture hat ihre
 *   Lager zu 96 % gefuellt": >= WH_FULL_AT war jede Runde wahr, der Kauf
 *   scheiterte jede Runde stumm.
 *   JETZT teilt sich das Lager den Grossposten-Topf mit dem Buero (Lager
 *   zuerst), und ein nicht bezahlbarer Kauf sagt es - `lagerHungrig`.
 *
 * v0.42 — DER FENSTER-AUTOMAT STAND STILL, WENN ER ERNTEN SOLLTE (mein Fehler).
 *   fensterPhase lebte nur im Speicher und fiel bei jedem CORP-Neustart auf
 *   "aus" zurueck; dort blockierte dann die Emissions-Abklingzeit (nach einer
 *   Emission rund 6 h) — obwohl die den RUECKKAUF gar nicht betrifft.
 *   Live am 20.09.2026: Fonds auf $4,60 Mrd gefallen (Schwelle ~$7,3 Mrd),
 *   Anteil ~0 %, Dividende 0 %. Das Fenster haette offen sein muessen.
 *   JETZT wird die Phase aus der LAGE abgeleitet statt erinnert, und die
 *   Dividende haengt am ZUSTAND "offen" statt am Uebergang dorthin — ein
 *   Uebergang geht bei jedem Neustart verloren, ein Zustand nicht.
 *
 * v0.41 — DAS RUECKKAUF-FENSTER: TEUER AUSGEBEN, BILLIG ZURUECKKAUFEN.
 *   Ausgangslage am 20.09.2026: der Spieler hielt 1 Aktie von 1,5 Mrd, und
 *   50,5 % zurueckzukaufen haette $1,16 BILLIONEN gekostet — steigend, weil
 *   die Bewertung `funds + Gewinn/s * 85e3` mit der Corp mitwaechst.
 *
 *   DER HEBEL steht in determineCycleValuation: bei voller Dividende faellt
 *   `assetDelta` weg, uebrig bleiben nur die Fonds — und liegen die unter der
 *   Schwelle, greift `if (val < 10e9) val = 10e9`. Der Kurs faellt von $719
 *   auf $3,33, der Rueckkauf von $1,16 Bio auf rund $5,4 Mrd. Faktor 216.
 *
 *   ABLAUF (fensterStep): emission -> ausgeben -> offen.
 *   Die mittlere Stufe ist die, die man vergisst: mit frisch emittiertem
 *   Kapital in der Kasse IST die Bewertung gleich den Fonds. Mit $198 Mrd
 *   darin laege der Kurs bei $61 statt $3,33. Erst ausgeben, dann ernten.
 *
 *   NUR EMISSION FINANZIERT DIE CORP. sellShares zahlt an den SPIELER
 *   (Player.gainMoney), nicht an die Corp — der naheliegende Kreislauf
 *   "verkaufen, ausbauen, zurueckkaufen" traegt deshalb nicht.
 *
 *   Der investorShares-Schutz aus stockStep gilt im Fenster bewusst NICHT:
 *   je Emission waechst der Investoranteil um hoechstens (Menge/2)*Quote
 *   (~50 Mio), totalShares aber um 300 Mio. Sein ANTEIL faellt damit von
 *   33,3 % auf 30,6 % — die Obergrenze des erreichbaren Eigenbesitzes STEIGT.
 *
 *   PREIS, ehrlich: rund drei Stunden ohne Wachstum, in denen der Gewinn an
 *   fremde Anteilseigner geht (bei $23m/s ca. $248 Mrd). Gegen $1,15 Bio
 *   Ersparnis ein klarer Gewinn, aber eine bewusste Pause.
 *
 * v0.40 — REIFETOR, ERNTEREIFE UND EIGENTUMSGRENZE.
 *   a) Die naechste Industrie verlangt jetzt ALLE Staedte der Vorstufe und
 *      entweder $50m/s Gewinn ($500m je Marktzyklus) oder Fonds ueber dem
 *      Dreifachen der Startkosten — der Notausgang, damit das Tor nicht
 *      zusperrt, wenn Agriculture allein bei ~30m/s haengenbleibt.
 *   b) Dividenden setzen aus, solange ein Bueroausbau angespart wird.
 *   c) FLOOR_OWN_FRAC 2/3 -> 0.505. Die Engine kennt keine Mehrheitsregel.
 *
 * v0.39 — BUEROPLAETZE PASSTEN NIE INS RUNDENBUDGET.
 *   Die Engine nimmt fuer die ersten drei Zusatzplaetze $4.36 Mrd
 *   (officeInitialCost = 4e9), das Rundenbudget lag bei $1.76 Mrd. Der Kauf
 *   wurde damit JEDE Runde still uebersprungen — ueber drei Berichte belegt:
 *   Lager waechst, Personal unveraendert 12/12 bei vier Staedten.
 *   Ein Posten, der grundsaetzlich groesser ist als das Budget, gehoert nicht
 *   ins Budget: Bueros ziehen jetzt aus einem eigenen Topf, und solange einer
 *   aussteht, wird nicht gleichzeitig fuer die naechste Industrie gespart.
 *
 * v0.38 — DIE BUEROKOSTEN WERDEN MITGEMELDET. Ueber drei Berichte wuchs das
 *   Lager, das Personal aber nicht: 12/12 bei vier Staedten, also 3 Plaetze
 *   je Stadt — der Startwert. Geldmangel, Gesundheitsschwelle und API-Namen
 *   sind ausgeschlossen; bleibt ein stiller Fehlschlag von
 *   officeUpgradeCost() (Rueckgabe -1 -> growWithBudget ueberspringt ohne
 *   jede Meldung). Die Zahl steht jetzt im Bericht, statt geraten zu werden.
 *
 * v0.37 — DIE DIVISIONEN MELDEN IHRE ZAHLEN. Nach aussen stand bisher nur
 *   "1 Division(en), 4 Bueros". Ob diese Bueros zwei Mitarbeiter haben oder
 *   neunzig und ob die Lager voll oder leer sind, war nicht zu sehen — und
 *   genau das entscheidet, ob eine Stufe reif fuer die naechste ist.
 *   runDivisionCity() gibt jetzt Mitarbeiter, Lager, Moral und Energie
 *   zurueck, die Runde summiert je Division, publishCorpInfo traegt es mit.
 *   Kosten: ein getWarehouse je Stadt und Runde, sonst nichts Neues.
 *
 * v0.36 — DAS FENSTER KAM TROTZDEM WIEDER.
 *   v0.35 hat nur das Oeffnen weggelassen — zu wenig. Bitburner stellt offene
 *   Tail-Fenster je Skript beim Neustart WIEDER HER; ein einmal von Hand
 *   geoeffnetes kam also nach jedem Deploy zurueck. Ohne --tail wird es jetzt
 *   ausdruecklich geschlossen. Aufgefallen an WORK, das gar keinen openTail
 *   besitzt und trotzdem eins offen hatte.
 *
 * v0.35 — TAIL-FENSTER AUS, VERSIONSZEILE EHRLICH.
 *   a) ns.ui.openTail() lief bei jedem Start. CORP ist ein Dauerdienst, das
 *      Fenster blitzte also staendig auf. Jetzt nur mit --tail.
 *   b) Die Startzeile druckte fest "v0.21", der Kopf sagte 0.34. CORP war die
 *      einzige Datei ohne VERSION-Konstante und entkam damit der Pruefung des
 *      PRUEFERs. Jetzt gibt es die Konstante, und die Zeile liest sie.
 *
 * v0.34 — ES WURDE GEGEN DIE WAND EXPORTIERT.
 *   exportStep lief ueber ALLE sechs Staedte, ohne zu pruefen, ob die
 *   beteiligten Divisionen dort ein Lagerhaus haben. Fehlt eines, wirft die
 *   Engine — und der naechste Takt versuchte dasselbe wieder.
 *
 *   GEMESSEN (Fehlerchronik BN6, 13.09.2026):
 *       213.681 gescheiterte Versuche an EINEM Tag
 *       440 von 505 Chronik-Eintraegen aus dieser einen Sache (87 %)
 *   Betroffen: Chemical -> Volhaven/Chongqing/Ishima/New Tokyo,
 *   Agriculture -> Volhaven.
 *
 *   Der Aufwand lag nicht in der Engine, sondern in evalNs: jeder Versuch legt
 *   ein Wegwerf-Skript unter /Temp/ an, und weil Stadt und Division im
 *   BEFEHLSTEXT stehen, ist jede Kombination ein eigener Cache-Eintrag. Das
 *   ist die Quelle des Sammlers, den HELPERS v5.0 deckeln musste.
 *
 *   Der eigentliche Schaden war die Chronik selbst: sie ist DER Fehlerlog des
 *   Schwarms und bestand zu 87 % aus dieser Meldung. Jeder andere Befund
 *   ertrank darin — dieselbe Lehre wie in DIAG v3.6.
 *
 *   JETZT: eine Abfrage fuer alle Divisionen und Staedte (hasWarehouse), dann
 *   nur die Paare anfassen, bei denen Quelle UND Ziel ein Lagerhaus haben. Der
 *   Rest wird als "uebersprungen" gezaehlt, nicht als Fehler gemeldet — ein
 *   fehlendes Lagerhaus ist kein Fehler, sondern eine offene Bauaufgabe.
 *   Faellt die Auskunft aus, setzt der Takt aus, statt blind zu versuchen.
 *
 * v0.33 — BREITE VOR TIEFE. Der Staedte-Ausbau laeuft zwar zuerst, kauft aber
 *   hoechstens EINE Stadt je Runde und bricht ganz ab, wenn eine bestehende
 *   Stadt nicht einsatzbereit ist. Das uebrige Budget floss danach trotzdem in
 *   Werbung und Upgrades — die Firma verbesserte also, was sie hatte, bevor die
 *   erste Division ueberhaupt in allen Staedten stand.
 *   Jetzt wird der Bedarf der fehlenden Staedte vor Werbung und Upgrades
 *   ZURUECKGEHALTEN (nicht reserviert: reserviert fehlte er auch dem
 *   Staedtekauf, der aus demselben Budget zahlt). Gedeckelt auf
 *   CITY_HOLD_MAX_FRAC, damit eine dauerhaft kranke Stadt nicht alles sperrt.
 *
 * v0.32 — DIE ERNTE LIEF AB DER ERSTEN MINUTE.
 *   DIVIDEND_ERNTE_AKTIV heisst "die Corp ist gesaettigt, Geld darf raus".
 *   Der Schalter ueberlebt den Soft-Reset — die Corp nicht. Nach einer
 *   Neugruendung stand er also weiter auf "gesaettigt", bei einer Firma mit
 *   einer einzigen Division.
 *
 *   Live am 05.09.2026 beobachtet: 1 Division, 292k/s Gewinn, 5 % Dividende.
 *   Mit den Engine-Formeln gerechnet (Corporation.ts:162-169 und :189-196)
 *   gibt die Corp dafuer rund 14.600 $/s Wachstumskapital auf, beim Spieler
 *   ankommen je nach CorporationSoftcap 1.480 / 478 / 88 $/s. Dazu ein
 *   zweiter, unsichtbarer Preis: assetDelta *= (1 - dividendRate) druckt die
 *   BEWERTUNG (Corporation.ts:198-215) — und die traegt Aktienkurs und die
 *   Bribe-Schwelle von 100 Billionen.
 *
 *   Eine kleine Rate ist dabei kein schonender Mittelweg: die Auszahlung ist
 *   konkav, eine kleine Rate zahlt wenig aus und kostet trotzdem das volle
 *   Wachstumskapital.
 *
 *   NEU ist ein REIFETOR vor dem Schalter, nicht statt seiner: geerntet wird
 *   erst, wenn ueber ERNTE_REIF_RUNDEN Durchlaeufe am Stueck keine
 *   Blaupausen-Stufe mehr offen ist (nextStageCost() == 0). Ist etwas offen
 *   oder unklar, faellt der Zaehler auf null — im Zweifel wird nicht geerntet.
 *   Faellt das Tor zu, laeuft die Rate ueber den Wirkungsgrad-Zweig von selbst
 *   in 1-%-Schritten auf 0 zurueck. Die Engine kennt dafuer weder Sperrfrist
 *   noch Strafe (Actions.ts:137-143).
 *
 *   NICHT geaendert: die Dividendenformel selbst. Sie ist Zeichen fuer
 *   Zeichen aus der Engine uebernommen und stimmt, inklusive Zyklusdauer,
 *   Eigenanteil und Steuer-Unlocks. Der Fehler lag in der Entscheidung, nicht
 *   in der Rechnung.
 *
 * v0.31 — 230 GB WEGEN DER FUNKTIONSNAMEN.
 *
 *   Gemessen am 04.09. mit calculateRam, also vom Spiel selbst:
 *       SCHWARM-CORP.js   235,60 GB
 *   Eingetragen war in der Registry minRam 8 + burst 24, also 32 GB.
 *
 *   Die Ursache ist bitter, weil sie ausgerechnet den RAM-Trick aushebelt,
 *   um den herum diese Datei gebaut ist. CORP schleust JEDEN Corp-Aufruf
 *   durch evalNs, damit die teure API nicht im statischen RAM landet - und
 *   verlor die Ersparnis trotzdem, allein durch die NAMEN der Huellfunktionen.
 *
 *   Bitburners RAM-Rechner fuegt Referenzen pessimistisch hinzu
 *   (Script/RamCalculations.ts:342):
 *
 *       s.add(name); // For builtins like hack.
 *
 *   Der nackte Bezeichner zaehlt. Eine EIGENE Funktion namens buyTea kostet
 *   deshalb die vollen 20 GB von ns.corporation.buyTea, obwohl sie die API
 *   nie direkt anfasst. Vierzehn solcher Namen lagen hier:
 *
 *       je 20 GB: bulkPurchase buyTea expandCity hireAdVert purchaseUnlock
 *                 purchaseWarehouse setSmartSupply throwParty upgradeWarehouse
 *       je 10 GB: getMaterial getWarehouse hasResearched hasUnlock hasWarehouse
 *
 *   Zusammen 230,00 GB. Alle tragen jetzt ein "c" davor (cBuyTea, cThrowParty,
 *   ...) und kollidieren mit nichts mehr.
 *
 *   WICHTIG FUER SPAETERE AENDERUNGEN: die Namen INNERHALB der
 *   evalNs-Zeichenketten sind unveraendert geblieben und muessen es bleiben -
 *   dort steht der Befehl fuer das Wegwerfskript, und der heisst weiterhin
 *   "ns.corporation.buyTea(...)". Umbenannt wurde nur der echte Code.
 *
 * SCHWARM-CORP.js — v0.30
 *
 * v0.30 — BRIBE-DOSIS AUS DEM GEWINN STATT AUS DEM VERMOEGEN. Ein Anteil der
 *   FONDS (Bestand) kann die Kasse leerraeumen, ein fester Deckel ist bei
 *   kleiner Corp zu viel und bei grosser bedeutungslos. Jetzt ein Anteil des
 *   RUNDENGEWINNS (Fluss): skaliert von selbst, greift den Bestand nie an und
 *   versiegt, sobald kein Gewinn mehr da ist. Zwei Tore davor:
 *   BRIBE_MIN_PROFIT (100 Mrd/s) und der Aktiv-Schalter ueber BRIBE_FACTION.
 *   Bei 0,5 % und 1 Bio/s Gewinn sind das 100 Mrd je Runde = 18.000 Rep/h.
 *
 * v0.29 — ERNTE-MODUS + DOSIERTE BRIBES. Die Wirkungsgrad-Sperre ist fuer eine
 *   WACHSENDE Corp gedacht und kann bei einer gesaettigten nie wieder oeffnen:
 *   der Spieler bekommt (rate x Gewinn x 10 x Anteil)^(1-Tribute), bei BN10 also
 *   die 0,75-te Potenz (Corporation.ts:195). Aus 1e12 aufgegeben werden 1e9
 *   ausgezahlt — 0,1 %. DIVIDEND_ERNTE_AKTIV uebergeht die Sperre und faehrt auf
 *   DIVIDEND_ERNTE_RATE (25 %) hoch, aber erst wenn BEIDE Steuer-Unlocks stehen;
 *   davor nur DIVIDEND_ERNTE_RATE_VOR_STEUER (5 %). Grund: die Unlocks heben den
 *   Exponenten von 0.75 auf 0.90 und damit die Auszahlung um Faktor 242 — jeder
 *   vorher ausgezahlte Dollar ist also 242-mal weniger wert.
 *   Bribes: BRIBE_FRACTION 0.5 haette bei 105 Bio Fonds 52 Bio JE RUNDE (20 s)
 *   ausgegeben. Jetzt gilt der kleinere von Anteil (2 %) und absolutem Deckel
 *   (BRIBE_MAX_PER_ROUND, 100 Mrd) — der Deckel haelt die Dosis konstant, egal
 *   wie reich die Corp wird. Abgelehnte Bribes werden nicht mehr verschluckt.
 *
 * v0.28 — DREI BRANCHENNAMEN WAREN BEZEICHNER STATT WERTE. IndustryType ist eine
 *   String-Aufzaehlung, bei der genau drei Eintraege abweichen: Water =
 *   "Water Utilities", Computers = "Computer Hardware", RealEstate =
 *   "Real Estate". Die Blaupause trug die Bezeichner; getIndustryData warf,
 *   evalNs schluckte es, und die Kette waere DAUERHAFT bei Stufe 7 stehen
 *   geblieben. Zusaetzlich: Startpruefung aller Branchennamen beim Hochfahren
 *   und eine laute Meldung statt eines stillen Abbruchs.
 *
 * v0.27 — exportMaterial hatte FUENF statt SECHS Argumente; der Materialname
 *   landete auf targetCity, die Engine warf, das try/catch schluckte es. Es
 *   wurde NIE eine Exportroute angelegt. Fehler werden jetzt gezaehlt und
 *   gemeldet statt verschluckt.
 *
 * v0.26 — Personalverteilung aus den Engine-Formeln gerechnet statt geraten.
 *
 * v0.21 (Phasen-Gates, ein Rundenbudget, Investment-Runden)
 *
 * NEU in v0.21 — SCHADENSBEGRENZUNG. Die Corp verbrannte Fonds, bevor sie
 * ueberhaupt produzieren konnte, und ging sofort an die Boerse. Sieben Punkte,
 * alle am Engine-Quellcode bzw. an der Projekt-Doku belegt:
 *
 *   1. AUSGABE-GATES. corpUpgradeStep / buyBoost / growWithBudget / AdVert
 *      liefen bedingungslos jede Runde — auch mit NULL Divisionen. Jetzt gibt es
 *      ein Gate: es wird erst gekauft, wenn mindestens eine Division existiert,
 *      dort ein Lager steht und das Buero besetzt ist. Ohne Produktion gibt es
 *      keinen Nutzen, der ein Upgrade rechtfertigt.
 *
 *   2. RESERVE UMFASST JETZT DEN ECHTEN KAPITALBEDARF. Bisher wurde nur der
 *      naechste Unlock zurueckgehalten. Neu dazu:
 *        - Startkosten der naechsten fehlenden Blaupausen-Stufe (x1.15),
 *          Engine: IndustryData.startingCost (Agriculture 40b, Chemical 70b,
 *          Tobacco 20b). Fehlte diese Reserve, wurde das Geld fuer die Stufe
 *          in Upgrades gesteckt und die Kette entstand nie.
 *        - BETRIEBSKAPITAL = expenses x WORKING_CAPITAL_SEC. Ohne Fonds kauft
 *          Smart Supply keine Eingangsmaterialien -> Produktion steht.
 *          revenue/expenses sind PRO SEKUNDE (Doku financial-statement.md:99:
 *          TotalDividends = Rate x (Revenue - Expenses) x 10 je 10-s-Cycle).
 *
 *   3. EIN RUNDENBUDGET STATT DREI PROZENTSAETZEN. Boost (20 %), Wachstum
 *      (20 %) und Upgrades (15 %) rechneten alle gegen DENSELBEN Fonds-Stand,
 *      also faktisch 55 % je Durchlauf, alle 20 s. Jetzt gibt es EIN Budget
 *      (SPEND_FRACTION der freien Fonds) und eine feste Reihenfolge nach
 *      Wirkung: Lager -> Buero -> Boost -> AdVert -> Corp-Upgrades.
 *
 *   4. UPGRADE-WHITELIST NACH RUNDE (general-advice.md). Runde 1: nur Smart
 *      Storage. Runde 2: + Smart Factories. Ab Runde 3: alles, Wilson aber nur
 *      mit Produktdivision (Wilson multipliziert AdVert-Wirkung — ohne Produkt
 *      gibt es nichts zu bewerben). Vorher wurden ab der ersten Sekunde alle
 *      zehn Upgrades gewichtet gekauft.
 *
 *   5. INVESTMENT-RUNDEN 1 UND 2 WERDEN ANGENOMMEN (Spieler-Vorgabe).
 *      financial-statement.md:67: FundingRoundShares [0.1, 0.35, 0.25, 0.2],
 *      Multiplier [3, 2, 2, 1.5] -> nach Runde 2 bleiben 55 % beim Spieler.
 *      Runde 3+ wird NICHT genommen. Annahme haengt an Fortschritt, nicht an
 *      Dollar-Schwellen: alle 6 Staedte, Boost-Ziel erreicht, Profit > 0, und
 *      fuer Runde 2 zusaetzlich Chemical + RP-Ziele (700 Agro / 390 Chem).
 *
 *   6. IPO-BUG. GO_PUBLIC_MIN_VALUATION stand auf 10e9 — genau der ENGINE-
 *      MINDESTWERT der Bewertung (financial-statement.md: "Minimum value of
 *      valuation is 10^10"). Die Bedingung war damit IMMER wahr: die Corp ging
 *      beim ersten Durchlauf an die Boerse und verlor damit JEDE Investment-
 *      Runde (nach dem IPO gibt es keine Angebote mehr). Jetzt: IPO erst, wenn
 *      alle erlaubten Runden genommen sind.
 *
 *   7. DIVIDENDEN NACH NETTO-ERTRAG statt nach fester Dollar-Schwelle.
 *      Doku: Dividend = (OwnedShares x TotalDividends / TotalShares)^(1 - T)
 *      mit T = 1.15 - CorporationSoftcap (BN10: 0.9 -> T = 0.25), gesenkt um
 *      0.05 (Shady Accounting) bzw. 0.1 (Government Partnership). Der Exponent
 *      macht grosse Auszahlungen brutal ineffizient: bei T = 0.25 werden aus
 *      5.5e9 nur 7.2e6, Faktor 760. Eine feste "5 % ab 200k/s"-Regel verbrennt
 *      damit Reinvestitionskapital fuer fast nichts. Jetzt wird der Netto-
 *      Ertrag gegen den entgangenen Reinvest gerechnet und nur ausgeschuettet,
 *      wenn er DIVIDEND_MIN_EFFICIENCY erreicht. CorporationSoftcap kommt
 *      RAM-frei aus dem INFO-Snapshot (Port 28, bn-Block).
 *
 *   Ausserdem: alle absoluten Dollar-Schwellen sind raus oder in Verhaeltnisse
 *   umgerechnet — der Daemon laeuft damit in JEDER BitNode gleich richtig, ohne
 *   Kalibriertabelle. Preise werden ausnahmslos abgefragt, nie geschaetzt.
 *
 * AUS v0.20 — ZWEI FELDER MEHR IN DER CORP_INFO (Port 31):
 *   - funds: der Fonds-Stand. Bisher stand er NUR im Log. Das Dashboard rief
 *     deshalb selbst ns.corporation.getCorporation() auf — ein Aufruf, der 10 GB
 *     statisches RAM kostet und damit 44 % des gesamten Dashboard-Bedarfs
 *     ausmachte, nur um EINE Zahl anzuzeigen. Auf home, wo BANK, WORK, INFIL und
 *     der Dispatcher um denselben Platz konkurrieren, ist das nicht zu
 *     rechtfertigen. CORP liest den Wert ohnehin je Durchlauf (corpSnapshot);
 *     ihn mitzusenden kostet nichts.
 *   - ts: Zeitstempel der Meldung. Port 31 ist ein peek-Port — der letzte Wert
 *     bleibt stehen, auch wenn CORP laengst tot ist. Ohne Zeitstempel kann ein
 *     Leser eine Leiche nicht von einem aktuellen Stand unterscheiden und zeigt
 *     dauerhaft veraltete Zahlen. Alle anderen Info-Ports des Schwarms (32 GANG,
 *     33 HASH, 14 BANK) fuehren ts bereits; 31 war die Luecke.
 *
 * NEU in v0.19 — PRODUKT-ENGINE + VOLLE KETTE (der Profit-Motor ab Runde 3):
 *   - Blaupause fest AGRO_CHEM_TABAK (kein Würfeln mehr): Agriculture-Basis ->
 *     Chemical (Qualitäts-Loop) -> Tobacco (Produkte). Laufende Corps mit alten
 *     Blaupausen migrieren verlustfrei (gleiche Divisionsnamen; fehlende Stufen
 *     werden nachgelegt, sobald die Vorstufe >= 3 Städte hat und Fonds reichen).
 *     BISHER wurde nur stage0 gebaut — Chemical/Tobacco entstanden NIE.
 *   - productStep(): kontinuierliche Produktentwicklung (immer nur 1 gleich-
 *     zeitig, Engine-Limit), fertige Produkte auf MAX/MP (alle Städte) + TA.II,
 *     bei vollen Slots das schwächste (min. Rating) discontinuen; Design/
 *     Marketing je 1 % funds; Advert-Leiter bis >= 20 % funds. Reads gebündelt
 *     (ein eval je Division: getDivision + getProduct je Produkt).
 *   - researchStep(): gezielt "Hi-Tech R&D Laboratory" (ab 10k RP), dann für
 *     Produktdivisionen Market-TA.I -> Market-TA.II (ab 140k RP, 2× Puffer) —
 *     der größte Optimierungsschritt ab Runde 3. autoResearch bleibt aktiv.
 *   - exportStep(): Qualitäts-Loop per Export, FIFO-korrekt: Agro->Tobacco
 *     (Plants) ZUERST, dann Agro->Chemical (Plants), dann Chemical->Agro
 *     (Chemicals). Idempotent (Duplikat-Fehler werden geschluckt).
 *   Divisions-TAUSCH (schwache gegen profitablere) folgt in P3.
 *
 * v0.18 — FINANZDOKTRIN (Spieler-Vorgabe) + TRENNUNG CORP/BANK:
 *   - DIVIDENDEN dynamisch: 0 %, bis die Corp NACHHALTIG Profit >= 100m/s macht
 *     (revenue-expenses). Darüber wird die Rate in kleinen Schritten bis
 *     max. 5 % angehoben, darunter wieder gesenkt. Hysterese 80/120m gegen
 *     Zappeln. (Bis dahin bleiben Funds komplett in der Corp — sie sind
 *     zuerst Betriebskapital.)   Steuer-Unlocks (Shady/Government) unverändert.
 *   - AKTIEN gehören ab jetzt der BANK, nicht mehr der CORP:
 *       * buyBackShares: CORP fasst eigene Aktien NICHT mehr selbst an. Sie
 *         MELDET nur Kurs/Menge/Cooldown auf Port 31 (CORP_INFO); die BANK
 *         kauft aus ihrem Budget zurück (Zinsvergleich Dividendenrendite vs.
 *         Trader) — die alte Buyback-aus-Spieler-Cash-Schleife (lief am
 *         BANK-Float VORBEI, kollidierte mit BANK v1.0) ist RAUS.
 *       * sellShares ist eine BANK-LIQUIDITÄTSQUELLE (wie kurzfristiges
 *         Aktien-Liquidieren) für große Spieler-Käufe (Augs/Server/4S...).
 *         CORP verkauft NICHT selbst; sie meldet nur, was verfügbar wäre.
 *         Eigentums-UNTERGRENZE: die Mehrheit (>= 2/3) bleibt immer bei dir
 *         (floorOwnFrac); die BANK hält das ein.
 *       * issueNewShares bleibt CORP-intern an die 100%-Regel gebunden
 *         (nur ohne Investor-Anteile, nur bei echtem Kapitalbedarf).
 *   - Port 31 (CORP_INFO): profitPerSec, dividendRate, valuation, public,
 *     sharePrice, share-Zahlen, sellCooldown, buyback-Wunsch, floorOwnFrac.
 *     Dashboard bekommt daraus ein kleines Corp-Panel.
 *   HINWEIS: Produkt-Engine (der eigentliche Profit-Motor ab Runde 3) und der
 *   dynamische Divisions-Tausch kommen in P2/P3 — v0.18 ist reine Finanz-
 *   und Anbindungsschicht, damit CORP sauber ins Schwarm-Budget passt.
 *
 * NEU in v0.17 (Bribes — Corp-Geld -> Faction-Rep):
 *   - Ab $100t Corp-Valuation: bribe() wandelt Corp-Fonds in Faction-Rep um
 *     ($1b = 1 Rep). Ziel-Faction per BRIBE_FACTION (leer = aus), Spieler muss
 *     Mitglied sein. BRIBE_KEEP_FUNDS bleibt immer liegen.
 *
 * NEU in v0.16 (Börse — 100%-Eigentums-Strategie):
 *   - goPublic(0): IPO OHNE Abgabe eigener Aktien, sobald Valuation-Schwelle
 *     erreicht -> 100% bleiben beim Spieler, Dividenden fließen komplett.
 *   - Dividenden: feste Rate (DIVIDEND_RATE), wird gesetzt sobald public.
 *   - issueNewShares NUR wenn investorShares == 0 (sonst leakt die Engine
 *     einen Zufallsanteil dauerhaft an Private!) UND Corp-Fonds unter
 *     Kapitalbedarfs-Schwelle. Alles landet dann am Markt = 100% rückkaufbar.
 *   - buyBackShares: Spieler kauft Markt-Aktien automatisch zurück, sobald
 *     PERSÖNLICHES Geld über dem Boden (BUYBACK_CASH_FLOOR) liegt -> Anteil
 *     kehrt zu 100% zurück. In Tranchen (Preis steigt beim Kauf).
 *   - Steuer-Unlocks: "Shady Accounting" / "Government Partnership" werden
 *     gekauft sobald public + leistbar (senken den Dividenden-Abzug).
 *   - WICHTIG: Investment-Runden werden NICHT angenommen — Investor-Anteile
 *     sind laut Engine NIE rückkaufbar. Der Daemon fasst sie nicht an.
 *
 * NEU in v0.15 (Corp-weite Upgrades — fehlten komplett):
 *   - Gewichteter Kauf der 10 levelbaren Corp-Upgrades (Wilson Analytics,
 *     Smart Factories/Storage, Mitarbeiter-Implantate, SalesBots, Insight,
 *     DreamSense) aus festem Anteil der FREIEN Fonds. Auswahl nach
 *     Gewicht/Kosten-Verhältnis — bester Nutzen pro Dollar zuerst.
 *
 * NEU in v0.14 (Hash-Entkopplung — HASHNET ist einziger Hash-Ausgeber):
 *   - SÄMTLICHER eigener Hash-Kauf raus (Fonds-Auffüllen, Forschungs-Zukauf).
 *   - CORP meldet stattdessen je Durchlauf über BANK_IN (Port 6) mit publishHashNeed:
 *     funds=<Stand> (HASHNET füllt unter $40b auf), researchWant/researchDiv
 *     (HASHNET kauft "Exchange for Corporation Research" für die Division).
 *   - autoResearch forscht weiterhin selbst, sobald Punkte reichen — nur der
 *     ZUKAUF der Punkte liegt jetzt bei HASHNET.
 *
 * NEU in v0.13 (Schritt 1):
 *   - API-/UNLOCK-MANAGER: erkennt per hasUnlock, welche Corp-APIs schon frei
 *     sind (egal ob gekauft oder durch BitNode geschenkt), und schaltet die
 *     fehlenden SELBST frei — STRIKT nach Priorität: Office API -> Warehouse API
 *     -> Smart Supply -> Export. Office API gated alle Büro-Calls; das fehlte
 *     bisher und lief nur, weil sie irgendwann manuell freigeschaltet war.
 *   - GELDMÄSSIG VORARBEITEN: ist der nächste Priorität-Unlock noch zu teuer,
 *     wird seine Kostenhöhe als RESERVE zurückgehalten. Boost, Wachstum und
 *     Städte-Ausbau nutzen dann nur noch die Fonds OBERHALB der Reserve ->
 *     die Corp steuert gezielt auf den nächsten Unlock zu, statt alles zu
 *     verbrennen. Sobald leistbar, wird er gekauft und die Reserve rückt weiter.
 *   - R&D-PERSONAL: Material-Divisionen bekommen jetzt ebenfalls R&D (~17%) und
 *     etwas Management. Forschungspunkte entstehen damit ORGANISCH und nicht nur
 *     per Hash-Zukauf. (Anteil oben als SPLIT_MATERIAL einstellbar.)
 *   Hinweis: Forschung wird WEITERHIN zusätzlich per Hash beschleunigt (autoResearch).
 *
 * Baustein-Stand:
 *   1. Wartet, bis DU die Corporation gegründet hast (Polling, harmlos).
 *   2. Würfelt EINMAL eine bitnode-gewichtete Blaupause, gemerkt in Datei.
 *   3. Legt die ERSTE Division an (Büro + Lager Sector-12 automatisch).
 *   4. Büro Sector-12 füllen + sinnvolle Produktiv-Verteilung (idempotent).
 *   5. NEU — damit die Division wirklich Geld macht:
 *      a) Nötige APIs/Unlocks sicherstellen (Office API, Warehouse API, Smart
 *         Supply, Export) — strikt nach Priorität, selbst gekauft wenn bezahlbar.
 *      b) Smart Supply einschalten -> Eingangsmaterialien werden automatisch
 *         gekauft -> Produktion läuft an.
 *      c) Produzierte Materialien zum Marktpreis verkaufen (Menge MAX, Preis "MP").
 *      d) Sobald Market-TA.II erforscht ist, automatisch darauf umschalten
 *         (optimaler Verkaufspreis). Solange nicht erforscht: MP-Verkauf bleibt.
 *   6. NEU — nachhaltiges Wachstum, finanziert per FESTEM ANTEIL der Fonds
 *      pro Durchlauf (Standard 20%%, Rest bleibt als Polster liegen). Ausgaben
 *      streng nach Wirkung: erst LAGER (nur wenn fast voll, damit Produktion
 *      nicht am Platz erstickt) -> dann BÜRO (mehr Mitarbeiter) -> dann ADVERT
 *      (mehr Verkäufe). Nie mehr als das Budget; nichts wird erzwungen.
 *   7. NEU — Wohlbefinden des Personals: Produktion = Moral x Energie (je
 *      max 100). Sinkt eines, bricht die Produktivität ein. Der Manager kauft
 *      automatisch TEE (hebt Energie) und wirft PARTYS (hebt Moral), sobald die
 *      Werte unter die Schwelle fallen. Zusätzlich: solange Moral/Energie noch
 *      ungesund niedrig sind, wird das BÜRO NICHT weiter vergrößert und KEIN
 *      AdVert gekauft (erst stabilisieren, dann wachsen) — Lager bleibt erlaubt.
 *   8. NEU — INTERNS als Moral-/Energie-Werkzeug: Ab 9 Mitarbeitern steuert der
 *      Intern-Anteil, ob Moral/Energie steigen oder fallen. Break-even ~1/9,
 *      maximaler Erhol-Effekt ~2/9. Der Manager reserviert daher dynamisch
 *      Interns: ~22%% bei niedriger Stimmung (schnelle Erholung), ~11%% wenn
 *      gesund (Halte-Baseline), Rest produktiv. (Interns geben zudem 10x Erf.)
 *   9. NEU — sparsame Tee/Party-Politik: Interns sind das Haupt-Werkzeug für
 *      Moral/Energie. Tee/Party werden NUR als Notfall gekauft, wenn die Werte
 *      WIRKLICH tief sind (unter Notfall-Schwelle) — nicht jede Runde im
 *      Mittelfeld (das kostet mehr als es bringt). Ist AutoBrew (Tee) bzw.
 *      AutoPartyManager (Party) erforscht, übernimmt das Spiel das gratis
 *      automatisch -> der Manager kauft dann gar nicht mehr manuell.
 *  10. NEU — HASHNET-Anbindung (nur wenn Hacknet-Server/Hashes vorhanden):
 *      a) AUTO-FORSCHUNG via Hashes: kauft "Exchange for Corporation Research"
 *         (je ~1000 Punkte, wird mit jedem Kauf teurer) und erforscht damit
 *         schrittweise die Prioritätsliste — Lab zuerst (Pflicht-Wurzel), dann
 *         AutoBrew, AutoPartyManager, Market-TA.I, Market-TA.II. Spart das
 *         Abstellen von R&D-Mitarbeitern.
 *         [SEIT v0.14 ERSETZT: der Hash-ZUKAUF liegt bei SCHWARM-HASHNET.js;
 *          CORP forscht nur noch selbst und meldet fehlende Punkte.]
 *      b) FONDS via Hashes: [SEIT v0.14 ERSETZT: liegt bei SCHWARM-HASHNET.js,
 *         Deckel $40b dort; CORP meldet nur den Fonds-Stand über BANK_IN (Port 6).]
 *  11. NEU — MEHR STÄDTE: jede Division wird schrittweise in alle 6 Städte
 *      ausgebaut (expandCity = Büro, purchaseWarehouse = Lager). Pro Runde max.
 *      EINE neue Stadt, und nur wenn die Basis (Sector-12) gesund ist + Geld
 *      reicht (nachhaltig). Jede Stadt wird dann besetzt, gepflegt, produziert
 *      und verkauft. -> großer Produktionssprung.
 *  12. NEU — Deprecation-Fix: getDivision wird nur noch feldgenau abgefragt
 *      (.researchPoints / .cities), damit das veraltete .type nicht berührt wird.
 *  13. NEU — Nachhaltigkeit beim Städte-Ausbau: eine NEUE Stadt wird erst
 *      eröffnet, wenn ALLE bereits bestehenden Städte der Division gesund
 *      (Moral/Energie >= Schwelle) UND voll besetzt sind. Eine frisch gegründete,
 *      noch "rote" Stadt blockiert damit automatisch die nächste Expansion, bis
 *      sie eingependelt ist -> nie mehrere neue Städte gleichzeitig im Minus.
 *  14. NEU — BOOST-MATERIAL: kauft die Produktions-Multiplikator-Materialien
 *      (Real Estate, Hardware, AI Cores, Robots) BRANCHENGEWICHTET zu. Wirkung:
 *      (0.002*Bestand+1)^Faktor je Material; Faktoren kommen je Branche aus
 *      getIndustryData. GEDECKELT auf max. BOOST_WAREHOUSE_FRACTION des Lagers
 *      (Rest bleibt für Rohstoff-Durchlauf + Output frei -> nie verstopft).
 *      Skaliert mit der Lagergröße mit. Käufe pro Runde via Fonds-Cap begrenzt.
 *      Boost-Material wird NIE verkauft (Dauerbestand). Smart-Supply-Inputs
 *      werden NICHT angefasst (nur Materialien ausserhalb der Pflicht-Inputs).
 *  15. Loggt den Stand und ruht.
 *
 * NOCH NICHT enthalten (spätere Bausteine):
 *   - Büro vergrößern, eigene Forschungs-Käufe forcieren, weitere Städte,
 *     Export-Lieferketten, AdVert, Upgrades, Produkte (für Produkt-Branchen).
 *
 * DOKTRIN:
 *   - RAM-Dodge via evalNs für ALLE Corp-Calls (Action 20 GB / Info 10 GB).
 *   - Du regelst: Gründung, Investoren-Angebote, Börsengang, Dividenden.
 *   - Selbstfinanziert. Nachhaltig: nie etwas erzwingen, das einen Fehler wirft;
 *     Käufe nur, wenn das Geld reicht.
 *
 * START:    run SCHWARM-CORP.js          (läuft auf 'home')
 * Optional: run SCHWARM-CORP.js --reroll (verwirft gemerkte Blaupause)
 *
 * @param {NS} ns
 */

import { evalNs, formatMoney, publishHashNeed, publishCorpInfo, readBankInfo, readInfoBlock, chronik } from "SCHWARM-HELPERS.js";

// ===================== KONFIGURATION =====================

// v0.35: EINE Quelle fuer die Fassung. Die Startzeile behauptete "v0.21",
// waehrend der Kopf laengst auf 0.34 stand — genau die Drift, die der
// PRUEFER bei allen anderen Dateien abfaengt (Kopf gegen Konstante). CORP
// hatte als einzige gar keine Konstante und fiel deshalb durch das Raster.
const VERSION = "0.48";
const STATE_FILE = "schwarm-corp-state.txt";
const LOOP_MS = 5000;
const WAIT_CORP_MS = 30_000;   // v0.21: Takt der Warteschleife, solange keine Corp existiert
const JOBS = ["Operations", "Engineer", "Business", "Management", "Research & Development"];

/**
 * Personal-Verteilung je Job (relative Gewichte). Produkt-Branchen brauchen alle
 * fünf Rollen. Material-Branchen produzieren/verkaufen Rohstoffe — bekommen jetzt
 * EBENFALLS R&D (und etwas Management), damit Forschungspunkte ORGANISCH entstehen
 * und nicht nur per Hash zugekauft werden müssen. R&D-Anteil Material hier
 * einstellbar (Standard ~17%). Mehr R&D = mehr Forschung, etwas weniger Output.
 */
// =============================================================================
// v0.26 — DIE VERTEILUNG WAR GERATEN. JETZT IST SIE GERECHNET.
// =============================================================================
// SPLIT_PRODUCT stand auf 1/1/1/1/1, also glatt 20 % je Rolle. Das ist kein
// Optimum, sondern ein Platzhalter — und SPLIT_MATERIAL gab Management nur
// 11 %, was die Engine-Formel klar bestraft.
//
// DIE FORMELN (Division.ts:968-992):
//     total      = op + eng + mgmt
//     mgmtFactor = 1 + mgmt / (1.2 * total)          -> hoechstens x1.833
//     prod       = (op^0.4 + eng^0.3) * mgmtFactor
// Operations und Engineering saettigen also HART (Exponent 0.4 bzw. 0.3),
// waehrend Management als Multiplikator viel laenger traegt. Numerisch
// durchsucht ergibt das ueber jede Buerogroesse hinweg rund
//     45 % Operations / 14 % Engineering / 41 % Management
// fuer den reinen Produktionsblock. Viele Manager sind also RICHTIG — das war
// die Ueberraschung an dieser Rechnung.
//
// BUSINESS steht ueberhaupt nicht in der Produktion (Division.ts:995-998), nur
// im Verkauf, und dort ueber eine Saettigungskurve mit Exponent 0.26: der erste
// Mitarbeiter bringt +0.32, jeder ab dem neunten noch 0.03.
//
// WARUM TROTZDEM ZWEI TABELLEN. Mit Market-TA.II setzt die Engine den Preis so,
// dass alles verkauft wird (Division.ts:376):
//     sCost  = markupLimit / sqrt(sellAmt / S) + marketPrice
//     Erloes = markupLimit * sqrt(S * prod) + marketPrice * prod
// S enthaelt den businessFactor. Bei PRODUKTEN dominiert der markupLimit-Term,
// und dort steht Business gleichberechtigt neben der Produktion — die Suche
// gibt ihm dort 5 von 16 freien Plaetzen. Bei ROHSTOFFEN dominiert der
// Marktpreis-Term, und Business faellt auf nahezu null.
// Eine einzige Tabelle waere fuer eine der beiden Seiten immer falsch.
//
// R&D ist bewusst NICHT mitoptimiert, sondern auf rund 20 % gesetzt. Sein
// Nutzen laeuft ueber die Forschungspunkte in die Qualitaet (Division.ts:662)
// und in das Produkt-Rating (Product.ts:146) — und weil Punkte nur beim KAUF
// abgezogen werden (Actions.ts:505), wachsen sie nach der letzten Forschung
// ungestoert weiter. Ein Forscher ist dann WERTVOLLER als vorher. Das gegen
// Produktion aufzurechnen waere Scheingenauigkeit; 20 % ist eine begruendete
// Setzung, keine Optimierung.
const SPLIT_PRODUCT  = { "Operations": 4, "Engineer": 2, "Business": 5, "Management": 5, "Research & Development": 4 };
const SPLIT_MATERIAL = { "Operations": 7, "Engineer": 3, "Business": 1, "Management": 6, "Research & Development": 3 };

/** Alle 6 Corp-Städte. Sector-12 ist die Basis (kommt mit der Division automatisch). */
const CITIES = ["Sector-12", "Aevum", "Chongqing", "New Tokyo", "Ishima", "Volhaven"];

// --- Boost-Material (Produktions-Multiplikatoren) ---
const BOOST_MATS = ["Real Estate", "Hardware", "Robots", "AI Cores"];
const BOOST_SIZE = { "Real Estate": 0.005, "Hardware": 0.06, "Robots": 0.5, "AI Cores": 0.1 }; // Lagerplatz/Einheit
// =============================================================================
// v0.23 — 0.5 WAR WEIT ZU VORSICHTIG
// =============================================================================
// Die Haelfte des Lagers blieb fuer "Durchlauf/Output" gesperrt. Die Engine
// verlangt aber viel weniger, und zwar nachrechenbar (Division.ts:587-591):
//
//     if (totalMatSize > 0) {
//       const maxAmt = Math.floor((warehouse.size - warehouse.sizeUsed) / totalMatSize);
//       prod = Math.min(maxAmt, prod);
//     }
//
// Entscheidend ist das NETTO: kurz davor (Z. 585) werden die Eingangsmaterialien
// abgezogen, weil sie beim Produzieren verbraucht werden und Platz FREIGEBEN.
// Ist das Netto <= 0, gibt es ueberhaupt keine Platzgrenze.
//
// Agriculture, 0.5 Water + 0.2 Chemicals -> 1 Plants + 1 Food, Groessen aus
// MaterialInfo.ts (Water 0.05, Chemicals 0.05, Plants 0.05, Food 0.03):
//     netto = (0.05 + 0.03) - (0.5*0.05 + 0.2*0.05) = 0.045 je Einheit
// Bei Materialproduktion 37.128 und 10 s je Marktzyklus sind das rund 16.700
// Lagerplatz je Zyklus. Bei einem 450.000er Lager also 3,7 Prozent — gesperrt
// waren 50 Prozent, das Dreizehnfache.
//
// Die Folge im Livespiel (vom Nutzer gemessen): der Produktionsmultiplikator lag
// bei rund 14 Prozent und stieg auf ueber 50, nachdem er das Lager von Hand
// gefuellt hatte. Und die Strafe fuer zu wenig Kopffreiheit ist milde — die
// Engine DROSSELT die Produktion (Math.min), sie verwirft sie nicht.
//
// WIEVIEL KOPFFREIHEIT WIRKLICH NOETIG IST. Die sichere obere Schranke ueber alle
// fuenf Engine-Zustaende ist H = p * (inSize + outSize), nicht p * netto: nach
// PURCHASE liegen die Vormaterialien im Lager UND die Produktion prueft danach.
//     Agriculture: inSize 0.035, outSize 0.08 -> 0.115 je Einheit
//     p = 37.128 Materialproduktion * 10 s = 371.280 Einheiten je Zyklus
//     H = 371.280 * 0.115 = rund 42.700
// Bei einem 450.000er Lager sind das 9,5 Prozent.
//
// 0.75 laesst 112.500 frei — Sicherheitsfaktor 2,6 gegenueber dem gerechneten
// Bedarf. 0.90 waere mit 45.000 auf Kante genaeht gewesen, und das ist gefaehrlich,
// weil mehr Boost MEHR Produktion bedeutet und damit MEHR Kopffreiheit braucht:
// eine zu enge Ruecklage begrenzt sich selbst. Die Engine drosselt dann linear
// (prod = free/netto, Division.ts:589), der Schaden faellt also nicht als Fehler
// auf, sondern nur als fehlender Umsatz.
//
// EIN FESTER ANTEIL BLEIBT DAS FALSCHE WERKZEUG — er erzeugt eine harte
// Produktionsdecke p_max = (1-B) * Lagergroesse / outSize, in der weder
// Mitarbeiter noch Buerogroesse noch Forschung vorkommen. Richtig waere, den
// Boost-Platz aus der gemessenen Produktion zu rechnen. Dafuer fehlt die Groesse
// aber an der guenstigen Stelle: ns.corporation.getWarehouse() liefert nur
// { level, city, size, sizeUsed, smartSupplyEnabled } — smartSupplyStore, das die
// Engine intern als Produktion je Sekunde fuehrt (Division.ts:598), ist NICHT
// exponiert. Bis das ueber den beobachteten Fuellstand nachgebaut ist, bleibt der
// Anteil, aber auf einem Wert mit belegtem Sicherheitsabstand.
const BOOST_WAREHOUSE_FRACTION = 0.75;
// v0.33: Hoechstanteil des Rundenbudgets, der zurueckgehalten wird, solange
// einer Division noch Staedte fehlen (siehe Abschnitt 4b2 im Rundenablauf).
// Der Deckel ist die Notbremse: bliebe eine Stadt dauerhaft nicht
// einsatzbereit, wuerde ein ungedeckelter Rueckhalt jeden weiteren Kauf fuer
// immer sperren. Ein Viertel des Budgets fliesst deshalb immer weiter.
const CITY_HOLD_MAX_FRAC = 0.75;
// v0.23: Anteil des Rundenbudgets, der an Boost-Material geht. Die Produktions-
// kosten sind da bereits abgezogen — sie stecken als Betriebskapital
// (expenses * WORKING_CAPITAL_SEC) in der Reserve, aus der das Rundenbudget erst
// entsteht. Die verbleibenden 25 % gehoeren AdVert, Upgrades und Produkten, die
// im Rundenablauf spaeter kommen und aus demselben Topf zahlen.
const BOOST_ROUND_FRAC = 0.75;
// v0.21: BOOST_SPEND_FRACTION ENTFERNT. Boost zieht jetzt aus dem GEMEINSAMEN
// Rundenbudget (SPEND_FRACTION, s. u.) — vorher rechneten Boost, Wachstum und
// Upgrades unabhängig voneinander gegen denselben Fonds-Stand.

/**
 * Unlocks/APIs, die der Manager SELBST freischaltet — in PRIORITÄTS-Reihenfolge.
 *   Office API    -> gated Büro-Calls (Mitarbeiter/Jobs/Büro vergrößern)
 *   Warehouse API -> gated Lager-Calls (Lager, Material, Verkauf, Smart Supply)
 *   Smart Supply  -> Auto-Einkauf der Eingangsmaterialien
 *   Export        -> Lieferketten zwischen eigenen Divisionen (für Schritt 2)
 * Best-effort: gekauft wird nur, wenn bezahlbar. Ein unbekannter Name schadet
 * nicht (evalNs gibt null -> wird als "nicht vorhanden / nicht bepreisbar"
 * behandelt: kein Kauf, kein Loop-Abbruch). STRIKT der Reihe nach — für den
 * ersten noch nicht leistbaren Unlock wird gespart (Reserve, s. u.).
 */
const UNLOCK_PRIORITY = ["Office API", "Warehouse API", "Smart Supply", "Export"];
/**
 * Optionale Info-Unlocks (machen Nachfrage/Konkurrenz sichtbar). Standard LEER —
 * der Manager nutzt sie noch nicht für Entscheidungen, also kein Fonds-Verbrennen.
 * Bei Bedarf z.B.: ["Market Research - Demand", "Market Data - Competition"].
 */
const OPTIONAL_UNLOCKS = [];

// --- Wachstum (v0.21: EIN Rundenbudget für ALLE Käufe) ---
// Reihenfolge nach Wirkung: Lager -> Büro -> Boost -> AdVert -> Corp-Upgrades.
// Jeder Schritt zieht vom gemeinsamen Budget ab; nie mehr als das Budget.
const SPEND_FRACTION = 0.50;   // Anteil der FREIEN Fonds (nach Reserve), der je Durchlauf ausgegeben wird
const WH_FULL_AT = 0.80;       // Lager erst vergrößern, wenn so voll (Anteil)
const OFFICE_STEP = 3;         // Mitarbeiterplätze pro Büro-Vergrößerung

// --- Kapitalbedarfs-Reserve (v0.21) ---
// Fonds oberhalb der Reserve sind "frei". Die Reserve deckt in dieser Reihenfolge:
//   1. den nächsten Priorität-Unlock (ensureUnlocks liefert ihn),
//   2. die Startkosten der nächsten fehlenden Blaupausen-Stufe (x MARGIN),
//   3. BETRIEBSKAPITAL: expenses/s x WORKING_CAPITAL_SEC. Ohne Fonds kauft
//      Smart Supply keine Eingangsmaterialien und die Produktion steht still.
//      (revenue/expenses sind pro Sekunde — Doku financial-statement.md:99.)
const STAGE_COST_MARGIN   = 1.15;
// =============================================================================
// v0.40 — DAS REIFETOR: WANN DARF DIE NAECHSTE INDUSTRIE KOMMEN?
// =============================================================================
// Bisher war die einzige Bedingung "prevCities.length < 3" — drei Staedte, sonst
// nichts. Kein Gewinn, keine Lagergroesse, keine Personalstaerke. Live hatte
// Agriculture damit vier von sechs Staedten, zwoelf Mitarbeiter und $3.5 Mrd
// fuer die zweite Industrie zurueckgelegt, bevor die erste ueberhaupt stand.
//
// Neu sind zwei Bedingungen. Die erste ist die Absicht des Spielers: erst die
// bestehende Division VOLL ausbauen, dann verbreitern.
//
// Die zweite ist eine Gewinnschwelle — mit einem Notausgang, und der ist
// wichtig: Agriculture allein bleibt ohne massives Real Estate, Personal und
// Lager bei rund 30m/s stehen. Die naechste Stufe ist zugleich der Hebel, der
// darueber hinaus hilft (Chemicals speisen Agros Qualitaets-Schleife). Ein Tor,
// das man nur durchschreiten kann, indem man tut, was es verbietet, waere eine
// Sackgasse. Deshalb: Gewinnschwelle ODER das Geld liegt ohnehin ungenutzt
// herum — dann ist Verbreitern die bessere Verwendung als Horten.
//
// $500m je Marktzyklus sind bei 10 s/Zyklus (Constants.ts: 50 gameCycles x
// 200 ms) genau $50m/s. Vom Spieler so gewaehlt.
const STAGE_MIN_PROFIT_SEC  = 50e6;   // $500m je Marktzyklus (10 s)
const STAGE_IDLE_FUNDS_MULT = 3;      // Notausgang: Fonds >= 3x Startkosten

// v0.40: setzt growWithBudget, wenn ein Bueroausbau ansteht, aber der Topf ihn
// nicht traegt. Die Dividende liest es: wer noch fuer Personal spart, erntet
// nicht. Modulweit, weil beide Seiten in verschiedenen Funktionen sitzen.
let bueroHungrig = false;
// v0.43: dasselbe fuers LAGER. Dass es fehlte, war der Grund, warum der Mangel
// unsichtbar blieb - ein uebersprungener Lagerkauf hinterliess keine Spur.
let lagerHungrig = false;
const WORKING_CAPITAL_SEC = 120;
// v0.22: Hoechstanteil der freien Fonds, der fuer die naechste Blaupausen-Stufe
// zurueckgelegt werden darf. Ohne diesen Deckel legt CORP die volle Startsumme
// der naechsten Industrie zurueck — und wenn die ueber den Fonds liegt, ist das
// Rundenbudget dauerhaft 0 und die Corp hoert auf zu wachsen (Begruendung
// ausfuehrlich an der Rechenstelle). 0.50 spiegelt HOLD_MAX_FRAC in BANK, wo
// dieselbe Falle mit demselben Mittel entschaerft wurde.
const STAGE_RESERVE_MAX_FRAC = 0.50;

// =============================================================================
// v0.24 — WER GRUENDET DIE NAECHSTE DIVISION?
// =============================================================================
// Das Ansparen und das Gruenden sind ZWEI Entscheidungen, und nur die erste
// gehoert dem Daemon. Angespart wird immer: nextStageCost meldet die Kosten der
// naechsten fehlenden Stufe, die (auf 50 % der freien Fonds gedeckelte)
// Stufen-Reserve legt sie zurueck, und der laufende Betrieb geht weiter — die
// Deckelung ist genau die Sicherung, die verhindert, dass eine Ruecklage den
// Betrieb erstickt, aus dem sie bezahlt wird.
//
// Ob dann der Daemon zugreift oder der Spieler, ist Geschmackssache und keine
// technische Frage. Deshalb ein Schalter statt einer Annahme:
//     false (Vorgabe) — die Corp spart bis zum Ziel und MELDET nur, dass das
//                       Geld bereitsteht. Der Spieler gruendet, was er moechte;
//                       eine so gegruendete Division wird ueber die runList
//                       ("adopted") ohnehin vollstaendig mitbetrieben.
//     true            — die Corp gruendet die naechste Blaupausen-Stufe selbst,
//                       sobald das Geld reicht (Verhalten bis v0.23).
// v0.25: auf true gestellt. Die Kette ist jetzt vollstaendig und in
// Versorgungsreihenfolge (siehe AGRO_CHEM_TABAK) — es gibt nichts mehr zu
// waehlen, also auch keinen Grund, den Spieler zu fragen. Auf false gestellt
// spart die Corp weiter an und meldet nur "Kriegskasse BEREIT".
const AUTO_NEUE_STUFE = true;

// --- Wohlbefinden (Moral/Energie, je max 100) ---
const ENERGY_MIN = 95;          // unter diesem Wert: Tee kaufen (Energie)
const MORALE_MIN = 95;          // unter diesem Wert: Party werfen (Moral)
const GROWTH_HEALTH_MIN = 90;   // Büro/AdVert nur wachsen, wenn Moral & Energie >= diesem Wert
// v0.23: eigene, deutlich mildere Schwellen fuer den STAEDTE-Ausbau. Begruendung
// ausfuehrlich in ensureCities(): eine weitere Stadt ist eine Breiten-, keine
// Feinjustierungs-Entscheidung, und der Ertrag skaliert mit der Stadtzahl. Mit den
// alten Werten (Moral/Energie >= 90 UND jeder Arbeitsplatz besetzt) kam der Ausbau
// im Livespiel nie zustande — der Nutzer musste alle Staedte von Hand kaufen.
const EXPAND_HEALTH_MIN = 50;   // Staedte-Ausbau: nur "nicht ausgebrannt"
const EXPAND_STAFF_MIN  = 1;    // mindestens ein Mitarbeiter je bestehender Stadt
const PARTY_COST_PER_EMP = 500000; // Party-Kosten je Mitarbeiter ($0,5m) -> deutlicher Moral-Schub
const TEA_RESCUE = 50;          // Tee nur kaufen, wenn Energie UNTER diesem Notfall-Wert
const PARTY_RESCUE = 50;        // Party nur werfen, wenn Moral UNTER diesem Notfall-Wert
const RES_AUTOBREW = "AutoBrew";          // erforscht -> Energie automatisch (kein Tee-Kauf nötig)
const RES_AUTOPARTY = "AutoPartyManager"; // erforscht -> Moral automatisch (keine Party nötig)

// --- HASHNET-Anbindung (v0.14: CORP kauft NICHT mehr selbst!) ---
// CORP meldet nur noch Bedarf über Port 8 (publishHashNeed "CORP"):
//   funds=<Stand>            -> HASHNET füllt via "Sell for Corporation Funds" auf (Deckel $40b dort)
//   researchWant/researchDiv -> HASHNET kauft "Exchange for Corporation Research" für die Division

// --- CORP-WEITE UPGRADES (v0.15, Whitelist v0.21) ---
// v0.21: UPGRADE_SPEND_FRACTION ENTFERNT — Upgrades sind der LETZTE Posten des
// gemeinsamen Rundenbudgets (SPEND_FRACTION), nicht ein eigener Anteil.
const MAX_UPGRADE_BUYS = 10;         // max. Upgrade-Käufe je Durchlauf
// Gewichte = relativer Nutzen. Auswahl nach (Gewicht / Kosten) — bester Nutzen/$ zuerst.
const UPGRADE_WEIGHTS = {
    "Wilson Analytics": 10,          // multipliziert AdVert-Wirkung — stärkster Hebel
    "Smart Factories": 8,            // +Produktion corp-weit
    "Smart Storage": 6,              // +Lager corp-weit
    "Project Insight": 4,            // +Forschungspunkte
    "ABC SalesBots": 4,              // +Verkauf
    "Neural Accelerators": 3,        // Mitarbeiter-Stats (4x Implantate: günstige Basis)
    "FocusWires": 3,
    "Speech Processor Implants": 3,
    "Nuoptimal Nootropic Injector Implants": 3,
    "DreamSense": 1,                 // schwach — nur wenn sonst nichts lohnt
};

/**
 * v0.21 — WELCHE Upgrades in dieser Phase überhaupt erlaubt sind (general-advice.md).
 * Vorher wurden ab dem ersten Durchlauf alle zehn gewichtet gekauft; in Runde 1
 * ist jeder Dollar dort verlorenes Lager-/Boost-Kapital.
 *   Runde 1 (0x investiert): nur Smart Storage (Lagerkapazität = Boost-Kapazität).
 *   Runde 2 (1x investiert): + Smart Factories (Produktion).
 *   ab Runde 3:              alles. Wilson Analytics aber NUR mit Produktdivision —
 *                            es multipliziert die AdVert-Wirkung, und ohne Produkt
 *                            gibt es nichts zu bewerben.
 * @param {number} timesInvested @param {boolean} hasProductDiv
 * @returns {string[]}
 */
function allowedUpgrades(timesInvested, hasProductDiv) {
    if (timesInvested <= 0) return ["Smart Storage"];
    if (timesInvested === 1) return ["Smart Storage", "Smart Factories"];
    const all = Object.keys(UPGRADE_WEIGHTS);
    return hasProductDiv ? all : all.filter(u => u !== "Wilson Analytics");
}

// --- INVESTMENT-RUNDEN (v0.21, Spieler-Vorgabe: maximal 2) ---
// financial-statement.md:67 — FundingRoundShares [0.1, 0.35, 0.25, 0.2],
// Multiplier [3, 2, 2, 1.5]. Nach Runde 2 bleiben 55 % der Anteile beim Spieler.
// Runde 3+ (weitere 25 Punkte) wird NICHT genommen; darüber entscheidet der
// Spieler bzw. die BANK.
const MAX_INVEST_ROUNDS = 2;
// Fortschritts-Gates statt Dollar-Schwellen (general-advice.md):
//   Runde 1: alle 6 Städte, Boost-Ziel erreicht, Profit > 0.
//   Runde 2: zusätzlich Chemical vorhanden + RP-Ziele erreicht.
const INVEST_RP_MAIN = 700;   // Agriculture/Basis-Division
const INVEST_RP_SUPP = 390;   // Chemical/Support-Division

// --- BÖRSE (v0.21: Investment-Runden erlaubt, IPO erst danach) ---
// v0.21 BUGFIX: GO_PUBLIC_MIN_VALUATION (10e9) war der ENGINE-MINDESTWERT der
// Bewertung ("Minimum value of valuation is 10^10", financial-statement.md) —
// die Bedingung war damit IMMER wahr, die Corp ging beim ersten Durchlauf an die
// Börse und verlor jede Investment-Runde. Die Schwelle ist ERSETZT durch die
// Fortschrittsbedingung "alle erlaubten Runden genommen" (s. stockStep).
// =============================================================================
// v0.48 — FRUEH AN DIE BOERSE
// =============================================================================
// true  = so frueh wie moeglich an die Boerse, dabei Aktien verkaufen.
//         Das Geld geht sofort in den Ausbau (die Reihum-Verteilung aus
//         v0.45 verteilt es an die schwaechste Division).
// false = alte Reihenfolge: erst alle Investment-Runden, dann IPO.
//
// WANN WELCHES. Die Investment-Runden sind eigentlich das bessere Geschaeft
// (Vielfaches 3x bzw. 2x auf eine noch niedrige Bewertung). Sie setzen aber
// alle sechs Staedte voraus — und wenn die Corp sich die nicht leisten kann,
// wartet sie ewig auf eine Bedingung, die ihr Geld erst ermoeglichen wuerde.
// Fuer genau diesen Fall ist der fruehe Boersengang gedacht.
const BOERSE_SOFORT = true;

// Anteil der eigenen Aktien, der beim IPO verkauft wird.
// Der Kurs haengt am Eigenanteil (Corporation.ts: getTargetSharePrice =
// valuation * (0.5 + sqrt(ownership)) / totalShares). Wer mehr verkauft,
// bekommt je Aktie WENIGER — 10 % ist ein Kompromiss zwischen Erloes und
// Kurspflege. Der Eigenanteil bleibt damit bei 90 %, weit ueber der
// Untergrenze FLOOR_OWN_FRAC (50,5 %), die die BANK einhaelt.
// 0.80, weil das das rechnerische Maximum ist. Der Erloes ist
//     f * Bewertung * (0.5 + sqrt(1-f))
// und der laeuft ueber ein Maximum: 10 % bringen 0.145 Bewertungen, 50 %
// bringen 0.604, 80 % bringen 0.758 — und 99 % nur noch 0.594. Wer zu viel
// verkauft, drueckt den Kurs schneller, als die Menge zulegt.
const BOERSE_SOFORT_ANTEIL = 0.80;

const ISSUE_FRACTION_OF_TOTAL = 0.10; // je Emission max. 10% von totalShares (Engine-Limit: 20%), auf 10m gerundet
const BUYBACK_CHUNK = 10e6;           // (v0.18: nur noch als Vorschlags-Chunk in der CORP_INFO an die BANK)
// v0.40: 2/3 -> 0.505. In der Engine haengt an der Mehrheit NICHTS — kein
// Takeover, kein Kontrollverlust; der ganze Corporation-Code kennt keine
// Mehrheitsregel. Die 2/3 waren selbstgesetzte Vorsicht, kein Zwang, und sie
// haben Anteile gebunden, die als Liquiditaet nuetzlicher sind.
// Nicht 0.500001, sondern 0.505: zwischen Verkauf und Rueckkauf laeuft der
// Kurs, und eine Grenze auf sechs Nachkommastellen wird staendig knapp
// unterschritten — ein halbes Prozent Luft kostet nichts und macht es ruhig.
// v0.48: WAEHREND DES AUFBAUS AUF 0.05 — der Rueckkauf ist damit faktisch aus.
// Grund: BOERSE_SOFORT verkauft 80 % der Aktien, um die Corp ueberhaupt in
// Gang zu bringen. Stuende die Grenze weiter bei 0.505, wuerde die BANK
// sofort mit dem Geld des SPIELERS zurueckkaufen und damit gegen die eigene
// Corp arbeiten — zum 1.1-fachen Preis obendrein.
// Die Aktien kommen zurueck, aber SPAETER: wenn die Corp steht, wird diese
// Zahl wieder hochgesetzt, und das Rueckkauf-Fenster aus v0.41 sorgt dafuer,
// dass zum guenstigen Kurs gekauft wird statt zum Hoechststand.
// In der Engine haengt an der Mehrheit NICHTS — kein Takeover, kein
// Kontrollverlust. Ein niedriger Eigenanteil kostet nur Dividende, und die
// steht ohnehin auf 0 %.
const FLOOR_OWN_FRAC = 0.05;         // Eigentums-Untergrenze: so viel behältst DU mindestens (BANK hält es ein)

// =========================================================================
// v0.41 — DAS RUECKKAUF-FENSTER
// =========================================================================
// DAS PROBLEM. Am 20.09.2026 hielt der Spieler 1 Aktie von 1,5 Mrd. Der
// Rueckkauf auf 50,5 % haette zum damaligen Kurs $1,16 BILLIONEN gekostet —
// und er verteuert sich, waehrend die Corp waechst: binnen einer Stunde ging
// der Gewinn von $11,45m/s auf $23,31m/s und der Preis fuer 50,5 % von
// $632 Mrd auf $1,16 Bio.
//
// DER HEBEL STEHT IN determineCycleValuation (Corporation.ts):
//     if (this.dividendRate > 0) assetDelta *= 1 - this.dividendRate;
//     val = this.funds + assetDelta * 85e3;
//     val *= Math.pow(1.0079741404289038, numberOfOfficesAndWarehouses);
//     if (val < 10e9) val = 10e9;
// Bei VOLLER Ausschuettung faellt der Gewinnterm komplett weg. Uebrig bleiben
// nur die FONDS — und liegen die unter der Untergrenze, faellt die Bewertung
// auf $10 Mrd. Der Kurs faellt damit von $719 auf $3,33, und 50,5 % kosten
// statt $1,16 Bio nur noch rund $5,4 Mrd. Faktor 216.
//
// DESHALB DIE REIHENFOLGE emission -> ausgeben -> offen:
//   emission  Neue Aktien zum HOHEN Kurs. Das Geld geht an die CORP
//             (gainFunds "public equity"), nicht an den Spieler — nur dieser
//             Weg finanziert die Corp ueberhaupt. sellShares zahlt an den
//             Spieler (Player.gainMoney) und bringt der Corp nichts.
//   ausgeben  ENTSCHEIDEND: die Fonds muessen wieder UNTER die Grenze. Sonst
//             ist die Bewertung gleich den Fonds — mit $198 Mrd frisch in der
//             Kasse laege der Kurs bei $61 statt $3,33 und der Rueckkauf
//             kostete das Zwanzigfache. Erst ausgeben, dann ernten.
//   offen     Dividende auf 100 %, Bewertung faellt, BANK kauft paketweise.
//
// WAS ES KOSTET, ehrlich: in diesen rund drei Stunden waechst die Corp nicht
// und schuettet ihren Gewinn an fremde Anteilseigner aus (bei $23m/s rund
// $248 Mrd). Gegen $1,15 Bio Ersparnis ist das ein klarer Gewinn — aber es
// ist eine Pause, keine Nebenwirkung.
const FENSTER_AKTIV         = true;   // Hauptschalter; false = altes Verhalten
const FENSTER_DIVIDENDE     = 1.00;   // volle Ausschuettung; darunter greift die Untergrenze nicht
const FENSTER_BEWERTUNG_MIN = 10e9;   // Corporation.ts: if (val < 10e9) val = 10e9
const FENSTER_OFFICE_BASIS  = 1.0079741404289038;  // Math.pow(1.1, 1/12)
// Sicherheitsabstand unter die errechnete Fondsgrenze. Die Bewertung ist ein
// gleitendes Mittel ueber valuationLength = 10 Zyklen; knapp an der Grenze
// wuerde sie staendig darueber und darunter pendeln.
const FENSTER_FONDS_PUFFER  = 0.90;
// Zwischenstufen bringen nichts: bei 90 % Dividende laege die Bewertung noch
// bei ~$203 Mrd und der Kurs bei $68 statt $3,33. Es muss nahe 100 % sein.
let fensterPhase = "aus";             // aus | emission | ausgeben | offen
let fensterSeit  = 0;
const TAX_UNLOCKS = ["Shady Accounting", "Government Partnership"]; // senken den Dividenden-Exponenten; Kauf sobald public + leistbar
// Dividenden: Netto-Ertrag statt fester Schwelle (Rechenweg in stockStep).
const DIVIDEND_MAX            = 0.10; // Deckel der Rate im WACHSTUMS-Modus
const DIVIDEND_STEP           = 0.01; // Schrittweite je Durchlauf (beide Modi)
const DIVIDEND_MIN_EFFICIENCY = 0.50; // Ausschütten nur, wenn netto >= 50% des entgangenen Reinvests

// =========================================================================
// v0.29 — ERNTE-MODUS
// =========================================================================
// Der Wirkungsgrad-Test oben ist fuer eine WACHSENDE Corp gedacht: solange
// jeder einbehaltene Dollar mehr Gewinn erzeugt, ist Ausschuetten Verschwendung.
//
// Bei einer GESAETTIGTEN Corp stimmt diese Rechnung nicht mehr. Der Grund ist
// der Exponent in Corporation.ts:195 — der Spieler bekommt
//     ausgezahlt = (rate x Gewinn x 10 x eigenerAnteil) ^ (1 - Tribute)
// waehrend die Corp den vollen Betrag verliert (Corporation.ts:167-169).
// Bei BN10 ist Tribute = 1 - 0.9 + 0.15 = 0.25, der Exponent also 0.75.
// Beispiel: die Corp gibt 1e12 auf, beim Spieler kommen 1e12^0.75 = 1e9 an.
// Das sind 0,1 Prozent. Der Wirkungsgrad kann DIVIDEND_MIN_EFFICIENCY in
// dieser Groessenordnung NIE erreichen — die Sperre oeffnet nie wieder.
//
// Das ist kein Fehler in der Sperre. Es ist die richtige Antwort auf die
// falsche Frage. Die richtige Frage bei einer gesaettigten Corp lautet nicht
// "kommt genug an?", sondern "wofuer soll das Geld sonst gut sein?".
//
// ERNTE_AKTIV beantwortet das, und zwar bewusst als SCHALTER statt als
// Automatik: ob die Corp gesaettigt ist, weiss nur der Spieler. Steht er auf
// true, wird die Wirkungsgrad-Sperre uebergangen und stattdessen auf
// DIVIDEND_ERNTE_RATE hochgefahren — in DIVIDEND_STEP-Schritten, damit man
// die Wirkung Runde fuer Runde im Log sieht und jederzeit zurueckdrehen kann.
//
// WARUM 0.25 UND NICHT MEHR: der Exponent macht hoehere Raten unattraktiv.
// Von 0.25 auf 1.00 (vierfache Rate) waechst die Auszahlung nur um den
// Faktor 4^0.75 = 2,83 — aber die Corp behaelt dann NICHTS mehr zum Wachsen.
// Dazu kommt eine zweite Bremse: Corporation.ts:204-207 rechnet
//     assetDelta *= 1 - dividendRate
// in die BEWERTUNG. Eine hohe Rate drueckt also die Valuation, und die muss
// fuer Bribes ueber $100t bleiben (bribeThreshold). Bei 0.25 bleiben 75 %
// des Ertragswachstums in der Bewertung stehen.
// =========================================================================
// v0.32 - DER ERNTE-SCHALTER HATTE KEIN REIFETOR.
// =========================================================================
// Der Schalter sagt "die Corp ist gesaettigt, Geld darf raus". Das ist eine
// Spielerentscheidung und bleibt eine. ABER: er ueberlebt den Soft-Reset,
// waehrend die Corp ihn NICHT ueberlebt. Nach einer Neugruendung stand er
// also weiter auf "gesaettigt" - bei einer Firma mit einer Division.
//
// Live am 05.09.2026: frisch gegruendete Corp, 1 Division, 292k/s Gewinn,
// und trotzdem 5 % Dividende. Was das kostet, mit der Engine gerechnet
// (Corporation.ts:162-169 und :189-196):
//     aufgegebenes Wachstumskapital   rund 14.600 $/s
//     beim Spieler angekommen         rund 1.480 $/s (Softcap 1)
//                                     rund   478 $/s (Softcap 0,9)
//                                     rund    88 $/s (BN9, Softcap 0,75)
// Dazu ein zweiter, unsichtbarer Preis: Corporation.ts:198-215 rechnet
// assetDelta *= (1 - dividendRate) in die BEWERTUNG. 5 % Dividende druecken
// also auch den Kurs - und der ist die Grundlage fuer Aktienverkaeufe und die
// Bribe-Schwelle von 100 Billionen.
//
// Eine kleine Rate ist dabei KEIN schonender Mittelweg: die Auszahlung ist
// konkav (Exponent), eine kleine Rate zahlt einfach wenig aus und kostet
// trotzdem das volle Wachstumskapital.
//
// DAS REIFETOR nimmt dem Schalter nichts weg, es stellt nur eine Bedingung
// davor, die eine junge Corp nicht erfuellen kann: es darf keine
// Blaupausen-Stufe mehr offen sein (nextStageCost() liefert dann 0), und das
// ueber mehrere Durchlaeufe am Stueck. Ist etwas offen, faellt der Zaehler
// zurueck auf null.
//
// Beruhigend zu wissen: die Rate ist jederzeit folgenlos rueckstellbar. Die
// Engine kennt weder Sperrfrist noch Strafe (Actions.ts:137-143) - sie setzt
// nur einen Wert. Faellt das Tor zu, laeuft die Rate ueber den normalen
// Wirkungsgrad-Zweig in 1-%-Schritten wieder auf 0.
const DIVIDEND_ERNTE_AKTIV = true;  // true = gesaettigte Corp, Geld darf raus
const ERNTE_REIF_RUNDEN    = 12;    // so viele Durchlaeufe am Stueck ohne offene Stufe
let   ernteReifZaehler     = 0;     // Laufzeitzaehler dazu, siehe stockStep
const DIVIDEND_ERNTE_RATE  = 0.25;  // Zielrate MIT beiden Steuer-Unlocks
const DIVIDEND_ERNTE_RATE_VOR_STEUER = 0.05; // kleine Flamme, solange sie fehlen
const TRIBUTE_SHADY      = 0.05;      // "Shady Accounting" senkt TributeModifier
const TRIBUTE_GOVERNMENT = 0.10;      // "Government Partnership" senkt TributeModifier

// --- BRIBES (v0.17) ---
const BRIBE_FACTION = "";             // Ziel-Faction (leer = AUS). Spieler muss Mitglied sein. Ab $100t Valuation; $1b = 1 Rep.
const BRIBE_THRESHOLD = 100e12;       // ENGINE-Schwelle (bribeThreshold), keine geratene Zahl
// =========================================================================
// v0.29 — DOSIERUNG. EIN ANTEIL ALLEIN WAR DAS FALSCHE WERKZEUG.
// =========================================================================
// BRIBE_FRACTION war 0.5. Bei Fonds von 105 Billionen und einer Reserve von
// rund 43 Milliarden waeren das 52 Billionen — JE DURCHLAUF. Ein Durchlauf
// dauert LOOP_MS * 4 = 20 Sekunden. Die Corp waere in einer Minute leer und
// der Rep-Zuwachs absurd.
//
// Ein reiner ANTEIL skaliert mit dem Vermoegen und wird damit umso brutaler,
// je besser die Corp laeuft — genau verkehrt herum. Deshalb gilt jetzt der
// KLEINERE von beiden: ein kleiner Anteil UND ein absoluter Deckel. Der
// Deckel ist das, was die Dosis wirklich haelt; der Anteil bremst zusaetzlich,
// solange die Corp noch klein ist.
//
// $1b = 1 Rep (Actions.ts:646, linear, ohne Exponent). Bei 100e9 je Durchlauf
// sind das 100 Rep alle 20 s = 300 Rep/Minute = 18.000 Rep/Stunde, und es
// kostet 0,1 Prozent der Fonds. Das ist die "moderat bis wenig"-Dosis.
// v0.30: Dosis aus dem GEWINN statt aus den Fonds. Begruendung in bribeStep.
//
// 0.5 % vom Rundengewinn ist die Mitte des vom Spieler gesetzten Rahmens
// (0,1 bis 1 %). Was dabei herauskommt, haengt allein am Gewinn:
//     Gewinn/s    Runde (20 s)    Dosis 0,5 %     Rep/Stunde
//       100 Mrd         2 Bio          10 Mrd          1.800
//         1 Bio        20 Bio         100 Mrd         18.000
//        10 Bio       200 Bio           1 Bio        180.000
// Die Dosis waechst also mit der Corp, ohne je den Bestand anzugreifen.
const BRIBE_PROFIT_FRACTION = 0.005;  // Anteil des RUNDENGEWINNS (0.001 .. 0.01)
const BRIBE_MIN_PROFIT      = 100e9;  // erst ab diesem Gewinn je Sekunde ueberhaupt

// v0.31: "alle Corp-Augs vorhanden" heisst: alle acht UNLOCKS aus dem
// Hauptbildschirm sind gekauft (Smart Supply, Export, die beiden Steuer-Unlocks
// und so weiter). Das ist im Gegensatz zu den Spieler-Augmentierungen eine
// saubere, abzaehlbare Menge — deshalb laesst es sich hier automatisieren.
//
// ACHTUNG, DIESELBE FALLE WIE BEI IndustryType: CorpUnlockName (Enums.ts:30-39)
// ist eine String-Aufzaehlung, in der nur "Export" mit seinem Bezeichner
// uebereinstimmt. Alle uebrigen sieben weichen ab. hasUnlock prueft ueber
// getEnumHelper gegen die WERTE (Corporation.ts:743) — hier stehen deshalb die
// WERTE, nicht die Bezeichner.
const CORP_UNLOCKS = [
    "Export",
    "Smart Supply",
    "Market Research - Demand",
    "Market Data - Competition",
    "Shady Accounting",
    "Government Partnership",
    "Warehouse API",
    "Office API",
];
// Merker, damit die Wartemeldung EINMAL kommt und nicht jede Runde.
let bribeArmGemeldet = false;
// v0.21: BRIBE_KEEP_FUNDS (fest 100e9) entfernt — geschont wird jetzt die
// berechnete Kapitalbedarfs-Reserve (Unlock + nächste Stufe + Betriebskapital).

// Forschungs-Prioritätsliste (Lab ZUERST = Pflicht-Wurzel des Forschungsbaums)
// v0.46: von 5 auf 12 Posten. Reihenfolge ist billig-zuerst, damit die
// Forschungspunkte nicht monatelang auf einen teuren Posten warten:
//   Lab ist die Pflichtwurzel des Baums (5k),
//   AutoBrew/AutoPartyManager braucht die Buero-Pflege ohnehin (12k/15k),
//   Market-TA.I/II sind der groesste Einzelhebel beim Verkauf (20k/50k),
//   danach die Produktions- und Kapazitaetshebel nach Preis.
// NICHT dabei: HRBuddy-Recruitment (15k). Es stellt automatisch ein, aber
// die Bueros sind IMMER voll besetzt — es fehlen PLAETZE, nicht Leute.
const RESEARCH_PRIORITY = [
    "Hi-Tech R&D Laboratory",       // 5k   Pflichtwurzel
    "AutoBrew",                     // 12k  Tee automatisch
    "AutoPartyManager",             // 15k  Moral automatisch
    "Market-TA.I",                  // 20k  Preisfindung
    "Market-TA.II",                 // 50k  optimale Preisfindung
    "Drones",                       // 5k   Wurzel fuer die beiden naechsten
    "Drones - Assembly",            // 25k  +Produktion
    "Self-Correcting Assemblers",   // 25k  +Produktion
    "uPgrade: Fulcrum",             // 10k  nur Produktdivisionen
    "uPgrade: Capacity.I",          // 20k  ein Produkt mehr
    "uPgrade: Capacity.II",         // 30k  noch eines
    "Drones - Transport",           // 30k  +Lagerkapazitaet
];
const INTERN_MIN_EMPLOYEES = 9;    // ab so vielen MA wirkt der Intern-Anteil auf Moral/Energie
const INTERN_TARGET = 95;          // unter diesem Moral/Energie-Wert: mehr Interns (Erholung)
const INTERN_FRAC_RECOVER = 2 / 9; // Intern-Anteil bei Erholung (~22%, maximaler Effekt)
const INTERN_FRAC_HOLD = 1 / 9;    // Intern-Anteil wenn gesund (~11%, hält Moral/Energie stabil)

const BLUEPRINTS = {
    // v0.19 STANDARD (Doku-Meta, P2): Agro -> Chem (Qualitäts-Loop) -> Tabak (Produkte).
    // Namen "Agro"/"Chem"/"Tabak" sind mit den Alt-Blaupausen identisch -> laufende
    // Corps migrieren verlustfrei (fehlende Stufen werden nachgelegt).
    // =========================================================================
    // v0.24 — VIERTE STUFE: PHARMACEUTICAL
    // =========================================================================
    // Die Kette endete bisher nach drei Gliedern. Danach fand die Bau-Schleife
    // jede Branche besetzt, nextStageCost lieferte 0, es wurde nichts mehr
    // zurueckgelegt und nichts mehr gebaut — im Livebericht ueber Stunden
    // "3 Divisionen" bei $3,14b unverbrauchtem Rundenbudget.
    //
    // Pharmaceutical ist nicht irgendeine vierte Branche, sondern die einzige,
    // die an die BESTEHENDE Kette anschliesst. Aus IndustryData.ts:
    //     Agriculture   -> Plants, Food      (haben wir)
    //     Chemical      -> Chemicals         (haben wir)
    //     Pharmaceutical: requiredMaterials { Chemicals: 2, Water: 0.5 }
    // Ausser Agriculture selbst (Chemicals 0.2, der bestehende Qualitaets-Loop)
    // verlangt KEINE andere Branche im Spiel Chemicals. Die Chemie-Division
    // produziert also bereits genau den Rohstoff, den Pharma am staerksten
    // braucht — Faktor 2 je Einheit, der hoechste Chemicals-Bedarf ueberhaupt.
    //
    // Dazu die beiden Zahlen, die Pharma zur Geldmaschine machen:
    //     makesProducts: true     — Produktdivision, wie Tobacco
    //     scienceFactor: 0.8      — der HOECHSTE Wert aller Branchen
    // (Tobacco 0.75, Chemical 0.75, Software 0.62, Restaurant 0.12.)
    //
    // Startkosten 200e9. Die naechstguenstigen Produktbranchen ohne Anschluss an
    // unsere Kette waeren Computers (500e9, braucht Metal) und Real Estate
    // (600e9, braucht Metal/Hardware) — beides erst nach einer Refinery/Mining-
    // Kette, also deutlich teurer als der eine Schritt hierher.
    //
    // Spaeter denkbar: Healthcare (750e9) verlangt { Robots 10, AI Cores 5,
    // Drugs 5, Food 5 } — Drugs kommen aus Pharma, Food aus Agriculture. Die
    // Kette traegt also noch ein Glied, wenn dieses steht.
    // =========================================================================
    // v0.25 — DIE VOLLE KETTE: JEDE BRANCHE EINMAL, IN VERSORGUNGS-REIHENFOLGE
    // =========================================================================
    // PASST DAS UEBERHAUPT? Ja, mit Luft. Corporation.ts:38:
    //     maxDivisions = 20 * currentNodeMults.CorporationDivisions
    // und BitNode.tsx:868 (case 10) setzt CorporationDivisions = 0.9.
    // In dieser BitNode sind also 18 Divisionen erlaubt, das Spiel kennt 14
    // Branchen (IndustryData.ts). Ein vollstaendiger Satz passt, vier Plaetze
    // bleiben frei. In anderen BitNodes kann der Faktor kleiner sein (BN12
    // 0.4 -> 8 Divisionen, BN8 sogar 0) — deshalb ist die Liste eine
    // REIHENFOLGE, kein Versprechen: was nicht mehr passt, wird nie erreicht,
    // und createDivision faengt den Fehler ohnehin ab.
    //
    // WARUM DIESE REIHENFOLGE. Jede Branche verlangt Eingangsmaterial. Wird es
    // nicht von einer eigenen Division geliefert, muss es am Markt gekauft
    // werden — das kostet Geld und liefert nur Qualitaet 1. Liefert eine
    // eigene Division, greift zusaetzlich der Qualitaets-Kreislauf ueber die
    // Exportrouten (siehe exportStep). Deshalb steht jeder ERZEUGER vor seinem
    // VERBRAUCHER, und innerhalb derselben Stufe das Billigere zuerst.
    //
    // Aus IndustryData.ts, vollstaendig:
    //   Branche          Kosten  braucht                         liefert
    //   Agriculture        40b   Water, Chemicals                Plants, Food
    //   Chemical           70b   Plants, Water                   Chemicals
    //   Tobacco            20b   Plants                          (Produkte)
    //   Pharmaceutical    200b   Chemicals, Water                Drugs
    //   Restaurant         10b   Food, Water                     (Produkte)
    //   Fishing            80b   Plants                          Food
    //   Water             150b   Hardware                        Water
    //   Software           25b   Hardware                        AI Cores
    //   Mining            300b   Hardware                        Ore, Minerals
    //   Refinery           50b   Ore                             Metal
    //   Computers         500b   Metal                           Hardware
    //   RealEstate        600b   Metal, Plants, Water, Hardware  Real Estate
    //   Robotics         1000b   Hardware, AI Cores              Robots
    //   Healthcare        750b   Robots, AI Cores, Drugs, Food   (Produkte)
    //
    // Damit ist der Kreis am Ende GESCHLOSSEN: jedes Eingangsmaterial im Spiel
    // wird dann von einer eigenen Division erzeugt. Water ist der groesste
    // Einzelhebel (vier Branchen brauchen es), Computers der zweite (Hardware
    // geht an Water, Software, Mining, Robotics, RealEstate) — beide stehen
    // deshalb frueher, als ihr Preis allein rechtfertigen wuerde.
    //
    // Drei Stellen, an denen die Reihenfolge bewusst von "billig zuerst"
    // abweicht:
    //   - Water (150b) VOR Software (25b): Water beliefert vier Branchen,
    //     Software nur Robotics.
    //   - Mining (300b) VOR Refinery (50b): Refinery braucht Ore, das nur
    //     Mining liefert. Andersherum stuende Refinery leer.
    //   - Robotics (1000b) VOR Healthcare (750b): Healthcare braucht Robots.
    //
    // v0.28 BUGFIX
    // =========================================================================
    // ACHTUNG — DREI BRANCHENNAMEN HEISSEN ANDERS, ALS SIE AUSSEHEN
    // =========================================================================
    // IndustryType (Corporation/Enums.ts:3-17) ist eine String-Aufzaehlung, und
    // bei GENAU DREI der vierzehn Eintraege weicht der Wert vom Bezeichner ab:
    //     Water       = "Water Utilities"
    //     Computers   = "Computer Hardware"
    //     RealEstate  = "Real Estate"
    // Die uebrigen elf sind identisch. Die Engine prueft ueber
    // getEnumHelper("IndustryType").nsGetMember gegen die WERTE, ohne
    // Fuzzy-Option — ein Bezeichner wie "Water" wird also abgelehnt.
    //
    // v0.26 stand hier "Water" / "Computers" / "RealEstate". Folge: bei der
    // Wasser-Stufe warf getIndustryData, evalNs schluckte den Fehler und lieferte
    // null, und die Stufen-Schleife brach still ab. Die Kette waere DAUERHAFT bei
    // Stufe 7 stehen geblieben — Computers, Real Estate, Robotics und Healthcare
    // haette sie nie erreicht. Erschwerend: branchenKarte schluesselt nach dem
    // echten Engine-Wert, "Water Utilities"; branchen.has("Water") waere also
    // auch dann falsch geblieben, wenn der Spieler die Division von Hand anlegt.
    //
    // Derselbe Fehlertyp wie beim Export: ein falsches Argument, ein Wurf der
    // Engine, ein schluckender Wrapper. Deshalb meldet die Stufen-Schleife jetzt,
    // wenn industryData null liefert, statt kommentarlos abzubrechen.
    //
    // ENTFALLEN: die Felder importMat/from. Sie beschrieben die Exportroute je
    // Stufe und wurden seit v0.24 nirgends mehr gelesen — die Routen leitet
    // exportStep aus den Branchendaten der Engine ab. Eine Angabe, die niemand
    // liest, ist keine Dokumentation, sondern eine Falle fuer den Naechsten.
    AGRO_CHEM_TABAK: { w_bn3: 9, w_other: 9, stages: [
        // --- Grundstock: Rohstoffe und die zwei starken Produktbranchen ---
        { ind: "Agriculture",    name: "Agro" },        //  40b  Plants, Food
        { ind: "Chemical",       name: "Chem" },        //  70b  Chemicals
        { ind: "Tobacco",        name: "Tabak" },       //  20b  Produkte (science 0.75)
        { ind: "Pharmaceutical", name: "Pharma" },      // 200b  Produkte (science 0.80)
        // --- Nahrungsseite schliessen ---
        { ind: "Restaurant",     name: "Restaurant" },  //  10b  Produkte, isst Food+Water
        { ind: "Fishing",        name: "Fishing" },     //  80b  Food (zweite Quelle)
        // --- Wasser: vier Branchen haengen daran ---
        { ind: "Water Utilities",   name: "Water Utilities" },   // 150b  Water
        // --- Elektronikseite aufbauen ---
        { ind: "Software",       name: "Software" },    //  25b  AI Cores
        { ind: "Mining",         name: "Mining" },      // 300b  Ore, Minerals
        { ind: "Refinery",       name: "Refinery" },    //  50b  Metal (braucht Ore)
        { ind: "Computer Hardware", name: "Computer Hardware" }, // 500b  Hardware (braucht Metal)
        // --- die teuren Endverbraucher, jetzt vollversorgt ---
        { ind: "Real Estate",       name: "Real Estate" },       // 600b  Real Estate
        { ind: "Robotics",       name: "Robotics" },    //1000b  Robots
        { ind: "Healthcare",     name: "Healthcare" },  // 750b  Produkte
    ] },
    AGRO_PUR:   { w_bn3: 1, w_other: 4, stages: [{ ind: "Agriculture", name: "Agro" }] },
    AGRO_CHEM:  { w_bn3: 2, w_other: 4, stages: [{ ind: "Agriculture", name: "Agro" }, { ind: "Chemical", name: "Chem", importMat: "Plants", from: 0 }] },
    AGRO_TABAK: { w_bn3: 5, w_other: 2, stages: [{ ind: "Agriculture", name: "Agro" }, { ind: "Tobacco", name: "Tabak", importMat: "Plants", from: 0 }] },
    SOFTWARE:   { w_bn3: 4, w_other: 2, stages: [{ ind: "Software", name: "Soft" }] },
    AGRO_FOOD:  { w_bn3: 3, w_other: 2, stages: [{ ind: "Agriculture", name: "Agro" }, { ind: "Restaurant", name: "Food", importMat: "Food", from: 0 }] },
};

// ===================== STATE-DATEI =====================

function readState(ns) {
    try {
        const raw = ns.read(STATE_FILE);
        if (!raw || !raw.includes(":")) return { bp: null, bn: 0 };
        let bp = null, bn = 0;
        for (const part of raw.split("|")) {
            const [k, v] = part.split(":");
            if (k === "BP") bp = v;
            else if (k === "BN") bn = Number(v) || 0;
        }
        return { bp, bn };
    } catch (e) { return { bp: null, bn: 0 }; }
}

function writeState(ns, bp, bn) {
    try { ns.write(STATE_FILE, `BP:${bp}|BN:${bn}`, "w"); } catch (e) { /* egal */ }
}

// ===================== CORP-ABFRAGEN (RAM-Dodge) =====================

async function hasCorp(ns) {
    const r = await evalNs(ns, "ns.corporation.hasCorporation()");
    return r === true;
}

async function currentBitNode(ns) {
    const ri = await evalNs(ns, "ns.getResetInfo()");
    return (ri && typeof ri.currentNode === "number") ? ri.currentNode : 0;
}

async function corpSnapshot(ns) {
    const c = await evalNs(ns, "ns.corporation.getCorporation()");
    if (!c) return null;
    return {
        funds: typeof c.funds === "number" ? c.funds : 0,
        divisions: Array.isArray(c.divisions) ? c.divisions : [],
        public: c.public === true,
        totalShares: typeof c.totalShares === "number" ? c.totalShares : 0,
        numShares: typeof c.numShares === "number" ? c.numShares : 0,
        issuedShares: typeof c.issuedShares === "number" ? c.issuedShares : 0,
        investorShares: typeof c.investorShares === "number" ? c.investorShares : 0,
        sharePrice: typeof c.sharePrice === "number" ? c.sharePrice : 0,
        issueCooldown: typeof c.issueNewSharesCooldown === "number" ? c.issueNewSharesCooldown : 0,
        valuation: typeof c.valuation === "number" ? c.valuation : 0,
        revenue: typeof c.revenue === "number" ? c.revenue : 0,
        expenses: typeof c.expenses === "number" ? c.expenses : 0,
        dividendRate: typeof c.dividendRate === "number" ? c.dividendRate : 0,
    };
}

/** @returns {Promise<{startingCost:number, makesProducts:boolean, produced:string[], required:string[]}|null>} */
async function industryData(ns, ind) {
    const d = await evalNs(ns, `ns.corporation.getIndustryData(${JSON.stringify(ind)})`);
    if (!d) return null;
    const required = (d.requiredMaterials && typeof d.requiredMaterials === "object")
        ? Object.keys(d.requiredMaterials) : [];
    return {
        startingCost: typeof d.startingCost === "number" ? d.startingCost : -1,
        makesProducts: d.makesProducts === true,
        produced: Array.isArray(d.producedMaterials) ? d.producedMaterials : [],
        required,
        realEstateFactor: typeof d.realEstateFactor === "number" ? d.realEstateFactor : 0,
        hardwareFactor: typeof d.hardwareFactor === "number" ? d.hardwareFactor : 0,
        robotFactor: typeof d.robotFactor === "number" ? d.robotFactor : 0,
        aiCoreFactor: typeof d.aiCoreFactor === "number" ? d.aiCoreFactor : 0,
    };
}

async function createDivision(ns, ind, name) {
    // =========================================================================
    // v0.22 NOTBREMSE — NIE ZWEIMAL DIESELBE BRANCHE
    // =========================================================================
    // expandIndustry legt kommentarlos eine zweite Division derselben Branche an;
    // die Engine erlaubt das. Je nach Industrie sind das 20 bis 200 Mrd. fuer
    // nichts. Alle Aufrufer pruefen die Branche inzwischen selbst ueber
    // branchenKarte — diese Pruefung faengt kuenftige Aufrufer ab, die es
    // vergessen, und den Fall, dass sich der Stand zwischen Pruefung und Kauf
    // geaendert hat.
    const vorher = await corpSnapshot(ns);
    const karte = await branchenKarte(ns, vorher || { divisions: [] });
    if (karte.has(ind)) {
        ns.print(`Branche "${ind}" ist bereits durch Division "${karte.get(ind)}" besetzt — lege nichts an.`);
        return true;   // Das Ziel ist erreicht: die Branche existiert.
    }
    await evalNs(ns, `ns.corporation.expandIndustry(${JSON.stringify(ind)}, ${JSON.stringify(name)})`);
    const snap = await corpSnapshot(ns);
    const ok = !!(snap && snap.divisions.includes(name));
    // Die neue Division sofort in den Cache, damit die naechste Landkarte sie
    // kennt, ohne ein weiteres eval zu brauchen.
    if (ok) industrieCache.set(name, ind);
    return ok;
}

async function officeInfo(ns, div, city) {
    const o = await evalNs(ns, `ns.corporation.getOffice(${JSON.stringify(div)}, ${JSON.stringify(city)})`);
    if (!o) return null;
    return {
        size: typeof o.size === "number" ? o.size : 0,
        numEmployees: typeof o.numEmployees === "number" ? o.numEmployees : 0,
        employeeJobs: o.employeeJobs || {},
        avgEnergy: typeof o.avgEnergy === "number" ? o.avgEnergy : 100,
        avgMorale: typeof o.avgMorale === "number" ? o.avgMorale : 100,
    };
}

/** Tee kaufen (hebt Energie). @returns {Promise<boolean>} */
async function cBuyTea(ns, div, city) {
    const r = await evalNs(ns, `ns.corporation.buyTea(${JSON.stringify(div)}, ${JSON.stringify(city)})`);
    return r === true;
}
/** Party werfen (hebt Moral). @returns {Promise<number>} neue Moral oder 0. */
async function cThrowParty(ns, div, city, costPerEmp) {
    const r = await evalNs(ns, `ns.corporation.throwParty(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${costPerEmp})`);
    return typeof r === "number" ? r : 0;
}

async function hireOne(ns, div, city) {
    const r = await evalNs(ns, `ns.corporation.hireEmployee(${JSON.stringify(div)}, ${JSON.stringify(city)})`);
    return r === true;
}

async function setJob(ns, div, city, job, amount) {
    const r = await evalNs(ns,
        `ns.corporation.setJobAssignment(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${JSON.stringify(job)}, ${amount})`);
    return r === true;
}

// --- Unlocks ---
async function cHasUnlock(ns, name) {
    const r = await evalNs(ns, `ns.corporation.hasUnlock(${JSON.stringify(name)})`);
    return r === true;
}
async function unlockCost(ns, name) {
    const r = await evalNs(ns, `ns.corporation.getUnlockCost(${JSON.stringify(name)})`);
    return typeof r === "number" ? r : -1;
}
async function cPurchaseUnlock(ns, name) {
    await evalNs(ns, `ns.corporation.purchaseUnlock(${JSON.stringify(name)})`);
    return await cHasUnlock(ns, name);
}

// --- Warehouse / Verkauf ---
async function cSetSmartSupply(ns, div, city, on) {
    await evalNs(ns, `ns.corporation.setSmartSupply(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${on ? "true" : "false"})`);
}
async function sellMaterialMP(ns, div, city, mat) {
    await evalNs(ns, `ns.corporation.sellMaterial(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${JSON.stringify(mat)}, "MAX", "MP")`);
}
async function cGetMaterial(ns, div, city, mat) {
    const m = await evalNs(ns, `ns.corporation.getMaterial(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${JSON.stringify(mat)})`);
    if (!m) return null;
    return {
        stored: typeof m.stored === "number" ? m.stored : 0,
        price: typeof m.marketPrice === "number" ? m.marketPrice : 0,
    };
}
async function cBulkPurchase(ns, div, city, mat, amt) {
    await evalNs(ns, `ns.corporation.bulkPurchase(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${JSON.stringify(mat)}, ${amt})`);
}

/** Kompakte Mengen-Ausgabe (12.3k / 4.5M). */
function fmtNum(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(Math.floor(n));
}

// --- Forschung / Market-TA ---
async function cHasResearched(ns, div, name) {
    const r = await evalNs(ns, `ns.corporation.hasResearched(${JSON.stringify(div)}, ${JSON.stringify(name)})`);
    return r === true;
}
async function setMaterialTA2(ns, div, city, mat, on) {
    await evalNs(ns, `ns.corporation.setMaterialMarketTA2(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${JSON.stringify(mat)}, ${on ? "true" : "false"})`);
}


// --- Wachstum: Kosten & Aktionen ---
async function cGetWarehouse(ns, div, city) {
    const w = await evalNs(ns, `ns.corporation.getWarehouse(${JSON.stringify(div)}, ${JSON.stringify(city)})`);
    if (!w) return null;
    return { size: typeof w.size === "number" ? w.size : 0, sizeUsed: typeof w.sizeUsed === "number" ? w.sizeUsed : 0 };
}
async function warehouseUpgradeCost(ns, div, city, amt) {
    const r = await evalNs(ns, `ns.corporation.getUpgradeWarehouseCost(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${amt})`);
    return typeof r === "number" ? r : -1;
}
async function cUpgradeWarehouse(ns, div, city, amt) {
    await evalNs(ns, `ns.corporation.upgradeWarehouse(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${amt})`);
}
async function officeUpgradeCost(ns, div, city, inc) {
    const r = await evalNs(ns, `ns.corporation.getOfficeSizeUpgradeCost(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${inc})`);
    return typeof r === "number" ? r : -1;
}
async function upgradeOffice(ns, div, city, inc) {
    await evalNs(ns, `ns.corporation.upgradeOfficeSize(${JSON.stringify(div)}, ${JSON.stringify(city)}, ${inc})`);
}
async function adVertCost(ns, div) {
    const r = await evalNs(ns, `ns.corporation.getHireAdVertCost(${JSON.stringify(div)})`);
    return typeof r === "number" ? r : -1;
}
async function cHireAdVert(ns, div) {
    await evalNs(ns, `ns.corporation.hireAdVert(${JSON.stringify(div)})`);
}

// --- Städte-Ausbau ---
async function cHasWarehouse(ns, div, city) {
    const r = await evalNs(ns, `ns.corporation.hasWarehouse(${JSON.stringify(div)}, ${JSON.stringify(city)})`);
    return r === true;
}
async function cExpandCity(ns, div, city) {
    await evalNs(ns, `ns.corporation.expandCity(${JSON.stringify(div)}, ${JSON.stringify(city)})`);
}
async function cPurchaseWarehouse(ns, div, city) {
    await evalNs(ns, `ns.corporation.purchaseWarehouse(${JSON.stringify(div)}, ${JSON.stringify(city)})`);
}
async function corpConstants(ns) {
    const c = await evalNs(ns, "ns.corporation.getConstants()");
    return {
        officeInitialCost: (c && typeof c.officeInitialCost === "number") ? c.officeInitialCost : 4e9,
        warehouseInitialCost: (c && typeof c.warehouseInitialCost === "number") ? c.warehouseInitialCost : 5e9,
    };
}

// ===================== INVESTMENT / RESERVE / TRIBUTE (v0.21) =====================

/** Aktuelles Investoren-Angebot. round ist 1-basiert und meint die NÄCHSTE Runde. */
async function investmentOffer(ns) {
    const o = await evalNs(ns, "(() => { try { return ns.corporation.getInvestmentOffer(); } catch (e) { return null; } })()");
    if (!o || typeof o !== "object") return null;
    return {
        round: typeof o.round === "number" ? o.round : 0,
        funds: typeof o.funds === "number" ? o.funds : 0,
        shares: typeof o.shares === "number" ? o.shares : 0,
    };
}

/** Angebot annehmen. Die Engine liefert hier true/false (kein Throw). */
async function acceptInvestment(ns) {
    const r = await evalNs(ns, "(() => { try { return ns.corporation.acceptInvestmentOffer(); } catch (e) { return false; } })()");
    return r === true;
}

/**
 * Wie viele Runden sind schon genommen? Primärquelle ist offer.round (1-basiert
 * für die nächste Runde). Die Anteilszahlen sind als Quelle UNGEEIGNET, sobald die
 * BANK Aktien kauft/verkauft — deshalb nur als grober Rückfall.
 * @param {{round:number}|null} offer @param {object} snap
 */
function investedRounds(offer, snap) {
    if (offer && offer.round > 0) return offer.round - 1;
    if (snap && snap.public) return MAX_INVEST_ROUNDS;      // nach dem IPO gibt es keine Runden mehr
    if (snap && (snap.investorShares || 0) > 0) return 1;
    return 0;
}

/**
 * Startkosten der nächsten FEHLENDEN Blaupausen-Stufe (x STAGE_COST_MARGIN).
 * Diese Summe wird reserviert, damit die Kette nicht in Upgrades verschwindet.
 * @returns {Promise<number>} 0 = keine Stufe offen / nicht ermittelbar
 */
async function nextStageCost(ns, state, snap, karte) {
    if (!state || !state.bp || state.bp === "ADOPT" || !BLUEPRINTS[state.bp]) return 0;
    // v0.22: ueber die BRANCHE, nirgends mehr ueber den Namen (Begruendung an
    // branchenKarte). Fehlt die Karte, wird sie hier gebaut — KEIN Rueckfall auf
    // den Namensvergleich: der war der Fehler, und ein stiller Rueckfall haette
    // ihn beim naechsten vergessenen Argument wieder eingeschleppt.
    const k = karte || await branchenKarte(ns, snap);
    for (const st of BLUEPRINTS[state.bp].stages) {
        if (k.has(st.ind)) continue;
        const d = await industryData(ns, st.ind);
        return (d && d.startingCost >= 0) ? Math.ceil(d.startingCost * STAGE_COST_MARGIN) : 0;
    }
    return 0;
}

/**
 * CorporationSoftcap dieser BitNode — RAM-FREI aus dem INFO-Snapshot (Port 28,
 * bn-Block, nur mit SF5 gefüllt). Ohne Snapshot konservativ 1 (= BN3-Verhalten).
 * Der Wert geht NUR in die Dividenden-Rechnung ein, nie in eine Kaufentscheidung.
 */
function corpSoftcap(ns) {
    try {
        const bn = readInfoBlock(ns, "bn", Infinity);
        const m = bn && bn.mults;
        if (m && typeof m.CorporationSoftcap === "number" && isFinite(m.CorporationSoftcap)) return m.CorporationSoftcap;
    } catch (e) { /* Fallback */ }
    return 1;
}

/**
 * TributeModifier der Dividenden-Formel (financial-statement.md):
 *   TributeModifier = 1.15 - CorporationSoftcap, minus 0.05 (Shady Accounting),
 *   minus 0.1 (Government Partnership).
 *   Dividend = (OwnedShares x TotalDividends / TotalShares) ^ (1 - TributeModifier)
 * Der Exponent ist der Grund, warum grosse Ausschüttungen fast nichts abwerfen.
 * @param {number} softcap @param {boolean} shady @param {boolean} gov
 */
function tributeModifier(softcap, shady, gov) {
    let t = 1.15 - softcap;
    if (shady) t -= TRIBUTE_SHADY;
    if (gov) t -= TRIBUTE_GOVERNMENT;
    return Math.max(0, t);
}

/**
 * Netto-Wirkungsgrad einer Dividenden-Rate: was beim Spieler ankommt, geteilt
 * durch das, was der Corp dafür an Reinvestition verloren geht.
 *   entgangen  = rate x (revenue - expenses) x 10   (je 10-s-Cycle)
 *   ausgezahlt = (eigenerAnteil x entgangen) ^ (1 - Tribute)
 * @returns {number} 0..>1 (1 = jeder verlorene Dollar kommt als Dollar an)
 */
function dividendEfficiency(snap, rate, tribute) {
    const profit = (snap.revenue || 0) - (snap.expenses || 0);
    if (profit <= 0 || rate <= 0) return 0;
    const total = snap.totalShares || 0;
    if (total <= 0) return 0;
    const forgone = rate * profit * 10;
    if (forgone <= 0) return 0;
    const gross = (snap.numShares || 0) / total * forgone;
    if (gross <= 0) return 0;
    const net = Math.pow(gross, 1 - tribute);
    return net / forgone;
}

// ===================== BLAUPAUSEN-WAHL =====================

function rollBlueprint(bn) {
    // v0.19: NICHT mehr würfeln — die Doku-Kette ist in jeder BitNode die beste
    // bekannte Route (Agri-Basis, Chemical-Qualitätsloop, Tobacco-Produkte).
    return "AGRO_CHEM_TABAK";
}

// ===================== PRODUKTIV-VERTEILUNG =====================

function computeSplit(makesProducts, total) {
    const out = {};
    for (const j of JOBS) out[j] = 0;
    if (total <= 0) return out;

    const w = makesProducts ? SPLIT_PRODUCT : SPLIT_MATERIAL;

    const sumW = JOBS.reduce((a, j) => a + w[j], 0);
    if (sumW <= 0) { out["Operations"] = total; return out; }

    const rema = [];
    let assigned = 0;
    for (const j of JOBS) {
        const anteil = total * (w[j] / sumW);
        const base = Math.floor(anteil);
        out[j] = base;
        assigned += base;
        rema.push({ j, r: anteil - base, w: w[j] });
    }
    let left = total - assigned;
    rema.sort((a, b) => (b.r - a.r) || (JOBS.indexOf(a.j) - JOBS.indexOf(b.j)));
    for (const e of rema) {
        if (left <= 0) break;
        if (e.w <= 0) continue;
        out[e.j] += 1;
        left -= 1;
    }
    if (left > 0) out["Operations"] += left;
    return out;
}

async function staffOffice(ns, div, makesProducts, city = "Sector-12") {
    const info = await officeInfo(ns, div, city);
    if (!info || info.size <= 0) return;

    let hired = 0;
    while (info.numEmployees + hired < info.size) {
        const ok = await hireOne(ns, div, city);
        if (!ok) break;
        hired++;
    }
    if (hired > 0) ns.print(`  [${div}/${city}] +${hired} Mitarbeiter (${info.numEmployees + hired}/${info.size}).`);

    // Intern-Reserve aus Moral/Energie ableiten (Interns heben Moral & Energie ab >=9 MA).
    // =========================================================================
    // v0.23 — PRAKTIKANTEN WERDEN UEBERFLUESSIG, UND ZWAR HART
    // =========================================================================
    // ENGINE (OfficeSpace.ts:90-99):
    //     if (this.autoTea)   { this.avgEnergy = this.maxEnergy; }
    //     else                { ... perfMult mit dem Intern-Anteil ... }
    //     if (this.autoParty) { this.avgMorale = this.maxMorale; }
    //     else                { ... perfMult ... }
    // autoTea kommt von der Forschung "AutoBrew", autoParty von
    // "AutoPartyManager" (OfficeSpace.ts:72-73). Sind BEIDE erforscht, werden
    // Energie und Moral jeden Zyklus direkt auf ihr Maximum gesetzt — der
    // Intern-Anteil geht dann in keine Formel mehr ein. Jeder Praktikant ist ab
    // da reine Totlast: er belegt einen Platz, kostet Gehalt und produziert nichts.
    //
    // Vorher stand hier ausserdem Math.max(1, ...): MINDESTENS ein Praktikant,
    // immer, auch bei Moral und Energie am Anschlag. Bei 18 Plaetzen und
    // INTERN_FRAC_HOLD = 1/9 waren das zwei — genau die zwei, die im Livespiel in
    // jeder Division standen, waehrend die Anzeige 100.000/100.000 meldete.
    let interns = 0;
    const autoPflege = await cHasResearched(ns, div, RES_AUTOBREW)
                    && await cHasResearched(ns, div, RES_AUTOPARTY);
    if (!autoPflege && info.size >= INTERN_MIN_EMPLOYEES) {
        const recovering = info.avgMorale < INTERN_TARGET || info.avgEnergy < INTERN_TARGET;
        const frac = recovering ? INTERN_FRAC_RECOVER : INTERN_FRAC_HOLD;
        interns = Math.max(1, Math.floor(info.size * frac));
        interns = Math.min(interns, Math.floor(info.size / 2)); // Interns nie Mehrheit
    }
    const productive = info.size - interns;
    const split = computeSplit(makesProducts, productive);

    // Erst alles leeren (inkl. Intern), dann Zielwerte setzen -> idempotent.
    const ASSIGN = [...JOBS, "Intern"];
    for (const j of ASSIGN) { try { await setJob(ns, div, city, j, 0); } catch (e) {} }
    const parts = [];
    for (const j of JOBS) {
        const amt = split[j] || 0;
        if (amt > 0) { await setJob(ns, div, city, j, amt); parts.push(`${j}:${amt}`); }
    }
    if (interns > 0) { await setJob(ns, div, city, "Intern", interns); }
    // (Verteilung wird nicht mehr je Stadt/Runde geloggt -> sonst Log-Flut bei 6 Städten)
}

// ===================== UNLOCKS SICHERSTELLEN =====================

/**
 * Stellt Unlocks/APIs STRIKT nach Priorität sicher (kauft nur, wenn bezahlbar).
 * Corp-weit. Liefert zusätzlich eine RESERVE: die Kosten des ersten noch NICHT
 * leistbaren Priorität-Unlocks. Diese Reserve drosselt später Boost & Wachstum,
 * damit Fonds gezielt auf den nächsten Unlock zusteuern ("geldmässig vorarbeiten").
 * Robust: jeder Spiel-Call ist gekapselt -> ein unbekannter Name kann den Loop
 * nicht abwürgen (gilt dann als "nicht vorhanden / nicht bepreisbar").
 * @param {NS} ns @param {number} funds
 * @returns {Promise<{status:Object<string,boolean>, reserve:number}>}
 */
async function ensureUnlocks(ns, funds) {
    const status = {};
    let reserve = 0;
    let stopBuying = false; // ab dem ersten unbezahlbaren Priorität-Unlock nicht weiter kaufen (Priorität halten)

    for (const u of UNLOCK_PRIORITY) {
        let have = false;
        try { have = await cHasUnlock(ns, u); } catch (e) { have = false; }
        if (!have && !stopBuying) {
            let cost = -1;
            try { cost = await unlockCost(ns, u); } catch (e) { cost = -1; }
            if (cost >= 0 && funds >= cost) {
                ns.print(`  Kaufe API/Unlock "${u}" (${formatMoney(cost)}) ...`);
                try { have = await cPurchaseUnlock(ns, u); } catch (e) { have = false; }
                ns.print(have ? `    OK.` : `    fehlgeschlagen.`);
            } else if (cost >= 0) {
                // erster unbezahlbarer Priorität-Unlock: dafür sparen, danach nichts mehr kaufen
                reserve = cost;
                stopBuying = true;
                ns.print(`  API/Unlock "${u}" noch zu teuer (${formatMoney(cost)}) — spare darauf (Reserve).`);
            }
            // cost < 0 (unbekannt/nicht bepreisbar): überspringen, keine Reserve, kein Abbruch
        }
        status[u] = have;
    }

    // Optionale Info-Unlocks NUR, wenn alle Priorität-Unlocks vorhanden sind (niedrigste Prio, keine Reserve)
    if (UNLOCK_PRIORITY.every(u => status[u] === true)) {
        for (const u of OPTIONAL_UNLOCKS) {
            let have = false;
            try { have = await cHasUnlock(ns, u); } catch (e) { have = false; }
            if (!have) {
                let cost = -1;
                try { cost = await unlockCost(ns, u); } catch (e) { cost = -1; }
                if (cost >= 0 && funds >= cost) {
                    try { have = await cPurchaseUnlock(ns, u); } catch (e) { have = false; }
                    if (have) ns.print(`  Optionaler Unlock "${u}" gekauft (${formatMoney(cost)}).`);
                }
            }
            status[u] = have;
        }
    }

    return { status, reserve };
}

// ===================== DIVISION BETREIBEN =====================

/**
 * Eine Division produktiv machen: Mitarbeiter, Smart Supply, Verkauf, Market-TA.
 * @param {NS} ns @param {string} div @param {string} ind
 * @param {Object<string,boolean>} unlocks @param {string} [city="Sector-12"]
 */
/**
 * Eine EINZELNE Stadt einer Division betreiben: Mitarbeiter, Wohlbefinden,
 * Smart Supply, Verkauf, Market-TA. Bewusst ruhig (kein Spam bei 6 Städten).
 * @param {NS} ns @param {string} div @param {Object} data Branchen-Daten
 * @param {Object<string,boolean>} unlocks @param {number} funds @param {string} city
 * @param {boolean} ta2 Market-TA.II erforscht?
 */
async function runDivisionCity(ns, div, data, unlocks, funds, city, ta2) {
    // 1. Mitarbeiter + Verteilung
    await staffOffice(ns, div, data.makesProducts, city);

    // 1b. Wohlbefinden (Moral/Energie)
    const office = await officeInfo(ns, div, city);
    if (office) await upkeepWellbeing(ns, div, city, office, funds);

    const warehouseReady = unlocks["Warehouse API"] === true && await cHasWarehouse(ns, div, city);

    // 2. Smart Supply -> Eingangsmaterial automatisch -> Produktion läuft
    if (unlocks["Smart Supply"] === true && warehouseReady) {
        await cSetSmartSupply(ns, div, city, true);
    }

    // 3. Verkauf produzierter Materialien (MAX/MP), 4. Market-TA.II falls erforscht
    if (warehouseReady && data.produced.length > 0) {
        for (const mat of data.produced) {
            await sellMaterialMP(ns, div, city, mat);
            if (ta2) await setMaterialTA2(ns, div, city, mat, true);
        }
    }

    // v0.21: Rückmeldung fürs Ausgabe-Gate. Eine Stadt ist produktionsbereit, wenn
    // sie ein Lager hat UND wenigstens einen Mitarbeiter. Erst wenn das irgendwo
    // zutrifft, gibt es überhaupt einen Nutzen, der ein Upgrade rechtfertigt.
    // =====================================================================
    // v0.37 — DIE STADT MELDET IHRE ZAHLEN, NICHT NUR EIN JA/NEIN
    // =====================================================================
    // Bisher kam von hier genau ein Bit zurueck: "produktionsbereit". Damit
    // liess sich das Ausgabe-Gate bedienen, aber keine einzige Frage
    // beantworten, die beim Haerten wirklich zaehlt — steht die Division gut
    // da? Sind die Bueros besetzt? Sind die Lager voll oder leer?
    //
    // Im Bericht stand deshalb nur "1 Division(en), 4 Bueros". Ob diese vier
    // Bueros zwei Mitarbeiter haben oder neunzig, ob die Lager bei 100 oder
    // 10.000 stehen, war von aussen nicht zu sehen. Genau das braucht man aber,
    // um zu entscheiden, ob die erste Stufe reif fuer die zweite ist.
    //
    // DIE ZAHLEN KOSTEN FAST NICHTS: office liegt oben ohnehin schon vor. Nur
    // das Lager kommt dazu — ein Aufruf je Stadt und Runde, und auch der nur,
    // wenn es ueberhaupt ein Lager gibt.
    let wh = null;
    if (warehouseReady) {
        try { wh = await cGetWarehouse(ns, div, city); } catch (e) { wh = null; }
    }
    // v0.38 — WARUM WAECHST DAS BUERO NICHT?
    // Belegt ueber drei Berichte am 19.09.2026: Lager 4.7k -> 5.3k -> 5.6k,
    // Personal unveraendert 12/12 bei vier Staedten — also 3 Plaetze je Stadt,
    // der Startwert (corpConstants.officeInitialSize = 3). Beide Schritte stehen
    // in growWithBudget direkt hintereinander und teilen dasselbe Budget; der
    // eine feuert, der andere nie.
    //
    // Ausgeschlossen sind bereits: Geldmangel (growWithBudget laeuft ZUERST mit
    // dem vollen Rundenbudget von $1.76b), die Gesundheitsschwelle
    // (GROWTH_HEALTH_MIN = 90 gegen 100/100) und falsche API-Namen
    // (getOfficeSizeUpgradeCost/upgradeOfficeSize stimmen mit der Engine ueberein).
    //
    // Bleibt der Rueckgabewert selbst: officeUpgradeCost() liefert -1, wenn
    // evalNs nichts Brauchbares zurueckgibt, und dann ueberspringt
    // growWithBudget den Kauf STILL — kein Log, keine Meldung, nichts. Genau
    // diese Sorte stummer Fehlschlag hat in diesem Projekt schon zweimal
    // Stunden gekostet. Deshalb wird die Zahl jetzt mitveroeffentlicht.
    let oCost = null;
    try { oCost = await officeUpgradeCost(ns, div, city, OFFICE_STEP); } catch (e) { oCost = null; }
    return {
        oCost: (typeof oCost === "number") ? oCost : null,
        ready: !!(warehouseReady && office && office.numEmployees > 0),
        emp:    office ? (office.numEmployees || 0) : 0,
        empMax: office ? (office.size || 0) : 0,
        moral:  office ? (office.avgMorale || 0) : 0,
        energie: office ? (office.avgEnergy || 0) : 0,
        whSize: wh ? (wh.size || 0) : 0,
        whUsed: wh ? (wh.sizeUsed || 0) : 0,
    };
}

/**
 * Boost-Material branchengewichtet zukaufen, gedeckelt auf BOOST_WAREHOUSE_FRACTION
 * des Lagers. Kauft nur den Bedarf bis zum Ziel; nie verkaufen. Budget pro Runde
 * via budget.remaining begrenzt (v0.21: das GEMEINSAME Rundenbudget).
 * @param {NS} ns @param {string} div @param {Object} data Branchen-Daten (inkl. Faktoren)
 * @param {string} city @param {{remaining:number}} budget
 * @returns {Promise<{satisfied:boolean}>} satisfied = in dieser Stadt ist keine
 *   Boost-Lücke mehr offen (Signal für das Investment-Gate, s. investStep)
 */
async function buyBoost(ns, div, data, city, budget, kappe) {
    if (budget.remaining <= 0) return { satisfied: false };
    const wh = await cGetWarehouse(ns, div, city);
    if (!wh || wh.size <= 0) return { satisfied: false };

    const factors = {
        "Real Estate": data.realEstateFactor, "Hardware": data.hardwareFactor,
        "Robots": data.robotFactor, "AI Cores": data.aiCoreFactor,
    };
    // nur Materialien mit Faktor > 0 UND die NICHT Pflicht-Input sind (die macht Smart Supply)
    const mats = BOOST_MATS.filter(m => (factors[m] || 0) > 0 && !data.required.includes(m));
    if (mats.length === 0) return { satisfied: true };

    const sumF = mats.reduce((a, m) => a + factors[m], 0);
    const boostSpace = wh.size * BOOST_WAREHOUSE_FRACTION;
    let free = Math.max(0, wh.size - wh.sizeUsed);
    // =========================================================================
    // v0.23 — KAUFREIHENFOLGE NACH GRENZNUTZEN JE DOLLAR
    // =========================================================================
    // Hier lief eine Schleife ueber BOOST_MATS in LISTENREIHENFOLGE, und jedes
    // Material durfte so viel vom Budget nehmen, wie es wollte. Real Estate steht
    // an Position 1 — und ist mit weitem Abstand das teuerste je Lagereinheit
    // (Basispreise MaterialInfo.ts:78/111/122/130, Groessen ebenda):
    //     Real Estate   80.000 $ / 0.005 = 16.000.000 $ je Lagereinheit
    //     Hardware       8.000 $ / 0.06  =    133.333 $
    //     Robots        75.000 $ / 0.5   =    150.000 $
    //     AI Cores      15.000 $ / 0.1   =    150.000 $
    // Rund 110-mal teurer als Hardware — und es raeumte das Rundenbudget leer,
    // bevor die anderen drei ueberhaupt drankamen.
    //
    // Der bindende Engpass ist im laufenden Spiel naemlich NICHT der Lagerplatz,
    // sondern das GELD: Platz fuer Millionen Einheiten Real Estate ist da, bezahlt
    // werden koennen sie nicht.
    //
    // Der Grenznutzen folgt direkt aus der Engine-Formel (Division.ts:126-131,
    // cityMult = produkt (0.002*q_m + 1)^f_m). Im Logarithmus ist der Zuwachs je
    // zusaetzlicher Einheit m gleich f_m * 0.002 / (0.002*q_m + 1), je Dollar
    // entsprechend durch den Preis geteilt. Genau danach wird jetzt portionsweise
    // vergeben statt der Reihe nach.
    //
    // Der ZIEL-Bestand (die Platzaufteilung) bleibt proportional zum Branchen-
    // faktor. Das ist der asymptotisch exakte Grenzfall der Lagrange-Loesung
    //     q_i = (f_i/s_i) * (S + 500*sigma_s)/F - 500
    // die Korrektur betraegt hoechstens 500*sigma_s = 332,5 Lagereinheiten,
    // unabhaengig von der Lagergroesse — bei 450.000 Platz rechnerisch +0,0007 %.
    // Die Reihenfolge dagegen macht Groessenordnungen aus.
    const info = [];
    for (const m of mats) {
        const mat = await cGetMaterial(ns, div, city, m);
        info.push({
            m, size: BOOST_SIZE[m], f: factors[m],
            stored: mat ? mat.stored : 0,
            price: mat ? mat.price : 0,
            ziel: Math.floor((boostSpace * (factors[m] / sumF)) / BOOST_SIZE[m]),
            kauf: 0,
        });
    }
    // v0.21-Semantik erhalten: "Luecke offen" heisst, irgendein Material liegt
    // unter seinem Ziel — unabhaengig davon, ob gerade gekauft werden konnte.
    const gap = info.some(x => x.ziel > x.stored);

    // =========================================================================
    // v0.23 — IN RATEN, NICHT AUF EINEN SCHLAG
    // =========================================================================
    // `kappe` ist der Anteil des Rundenbudgets, der DIESEM Lager zusteht — der
    // Aufrufer bildet den Topf einmal fuer alle Lager (siehe dort). Ohne diese
    // Grenze nimmt sich das erste Lager alles, und die uebrigen sowie die
    // spaeteren Schritte (AdVert, Upgrades, Produkte) gehen leer aus.
    //
    // Was in dieser Runde nicht gekauft wird, holt die naechste nach: der
    // Ziel-Bestand je Material bleibt stehen, und die Runde laeuft alle 20 s.
    // Der Aufbau erfolgt damit ueber die Zeit statt auf einen Schlag.
    const kappeEff = (typeof kappe === "number" && kappe > 0)
        ? Math.min(kappe, budget.remaining) : budget.remaining;
    const boostBudget = Math.max(0, Math.floor(kappeEff));
    let boostRest = boostBudget;

    const GREEDY_SCHRITTE = 40;               // Portionen je Aufruf
    const startBudget = boostBudget;
    for (let i = 0; i < GREEDY_SCHRITTE && boostRest > 0 && free > 0; i++) {
        let best = null, bestNutzen = 0;
        for (const x of info) {
            if (x.stored + x.kauf >= x.ziel) continue;                 // am Ziel
            if (!(x.price > 0) || !(x.size > 0)) continue;
            if (x.price > boostRest || x.size > free) continue;         // nicht mal eine Einheit
            const q = x.stored + x.kauf;
            const nutzen = (x.f * 0.002) / ((0.002 * q + 1) * x.price);
            if (nutzen > bestNutzen) { bestNutzen = nutzen; best = x; }
        }
        if (!best) break;
        let qty = Math.floor((startBudget / GREEDY_SCHRITTE) / best.price);
        qty = Math.min(qty, best.ziel - best.stored - best.kauf);
        qty = Math.min(qty, Math.floor(free / best.size));
        qty = Math.min(qty, Math.floor(boostRest / best.price));
        // Eine Einheit ist nach den Pruefungen oben immer gedeckt; ohne diese
        // Untergrenze bliebe die Schleife bei Rundungsresten stehen.
        if (qty < 1) qty = 1;
        const kosten = Math.floor(qty * best.price);
        best.kauf += qty;
        free -= qty * best.size;
        boostRest -= kosten;            // Kappe dieses Lagers
        budget.remaining -= kosten;     // gemeinsames Rundenbudget
    }

    const bought = [];
    for (const x of info) {
        if (x.kauf <= 0) continue;
        await cBulkPurchase(ns, div, city, x.m, x.kauf);
        bought.push(`${x.m}+${fmtNum(x.kauf)}`);
    }
    if (bought.length) ns.print(`  [${div}/${city}] Boost: ${bought.join(", ")}.`);
    return { satisfied: !gap };
}

/**
 * Division schrittweise in alle 6 Städte ausbauen (max. EINE neue Stadt/Runde),
 * nur wenn alle bestehenden Städte gesund + voll besetzt sind (nachhaltig).
 * v0.21: bezahlt aus dem GEMEINSAMEN Rundenbudget. Vorher lief dieser Kauf
 * (Büro + Lager, je nach Engine-Konstanten rund $9b) am Budget vorbei.
 * Städte stehen bewusst VOR Lager/Büro/Boost: die Doku (general-advice.md) baut
 * in Runde 1 zuerst alle sechs Standorte.
 * @param {NS} ns @param {string} div @param {{remaining:number}} budget
 * @param {{officeInitialCost:number, warehouseInitialCost:number}} consts
 * @returns {Promise<string[]>} aktive Städte nach dem Schritt
 */
async function ensureCities(ns, div, budget, consts) {
    const have = await divisionCities(ns, div);

    // v0.21 BUGFIX — LAGER IN BESTEHENDEN STÄDTEN. expandIndustry legt in der
    // Hauptstadt ein BÜRO an, aber KEIN Lager (Doku general-advice.md:5: "Create
    // Agriculture division, expand to 6 cities and buy 6 warehouses" — sechs
    // Lager für sechs Städte, die Hauptstadt eingeschlossen). ensureCities kaufte
    // Lager bisher NUR für neu eröffnete Städte; in Sector-12 fehlte es deshalb
    // dauerhaft. Folge: hasWarehouse(Sector-12) blieb false, also kein Smart
    // Supply, kein Verkauf, kein Boost — die Hauptstadt lief für immer leer mit.
    for (const c of have) {
        if (await cHasWarehouse(ns, div, c)) continue;
        if (!budget || budget.remaining < consts.warehouseInitialCost) {
            ns.print(`  [${div}/${c}] Lager fehlt — warte auf Budget (${formatMoney(consts.warehouseInitialCost)}).`);
            continue;
        }
        await cPurchaseWarehouse(ns, div, c);
        const ok = await cHasWarehouse(ns, div, c);
        if (ok) {
            budget.remaining -= consts.warehouseInitialCost;
            ns.print(`  [${div}/${c}] Lager nachgekauft (${formatMoney(consts.warehouseInitialCost)}).`);
        }
    }

    const missing = CITIES.filter(c => !have.includes(c));
    if (missing.length === 0) return have;

    // =========================================================================
    // v0.23 BUGFIX — DER AUSBAU KAM NIE ZUSTANDE
    // =========================================================================
    // Hier stand:
    //     const full = o && o.numEmployees >= o.size;
    //     if (!healthy || !full) return have;
    // also: erweitere erst, wenn JEDE bestehende Stadt gesund UND LUECKENLOS
    // besetzt ist. Ein einziger unbesetzter Arbeitsplatz irgendwo blockierte den
    // gesamten Staedte-Ausbau — und Buero-Vergroesserungen erzeugen laufend neue
    // leere Plaetze (OFFICE_STEP = 3 je Ausbau). Die Bedingung konnte damit
    // dauerhaft unerfuellt bleiben.
    //
    // Der Nutzer musste alle Staedte von Hand kaufen; die Divisionsgruendung lief,
    // der Ausbau nie. Das deckt sich mit dem Code.
    //
    // Zusaetzlich war GROWTH_HEALTH_MIN (90) die falsche Schwelle: sie steuert, ob
    // ein Buero WACHSEN soll — eine Frage der Feinjustierung. Ob eine WEITERE Stadt
    // erschlossen wird, ist eine ganz andere: eine neue Stadt bringt eigene
    // Produktion und eigenen Umsatz, und der Ertrag skaliert mit der Stadtzahl.
    // Breite zuerst, Tiefe danach.
    //
    // Jetzt wird nur noch verlangt, dass die bestehenden Staedte nicht ausgebrannt
    // sind und ueberhaupt jemand dort arbeitet.
    for (const c of have) {
        const o = await officeInfo(ns, div, c);
        const healthy = o && o.avgMorale >= EXPAND_HEALTH_MIN && o.avgEnergy >= EXPAND_HEALTH_MIN;
        const besetzt = o && o.numEmployees >= EXPAND_STAFF_MIN;
        if (!healthy || !besetzt) {
            ns.print(`  [${div}] Städte-Ausbau wartet — ${c} nicht einsatzbereit (M ${o ? o.avgMorale.toFixed(0) : "?"} / E ${o ? o.avgEnergy.toFixed(0) : "?"} / MA ${o ? o.numEmployees : "?"}/${o ? o.size : "?"}).`);
            return have;
        }
    }

    const need = consts.officeInitialCost + consts.warehouseInitialCost;
    const city = missing[0];
    if (budget && budget.remaining >= need) {
        await cExpandCity(ns, div, city);
        await cPurchaseWarehouse(ns, div, city);
        const ok = await cHasWarehouse(ns, div, city);
        budget.remaining -= need;
        ns.print(`  [${div}] Neue Stadt: ${city} (Büro+Lager, ${formatMoney(need)}) ${ok ? "OK" : "(Lager prüfen)"} — noch ${missing.length - 1} offen.`);
        return await divisionCities(ns, div);
    }
    ns.print(`  [${div}] Warte auf Budget für Stadt ${city} (${formatMoney(need)}).`);
    return have;
}

// --- Forschung (Division) ---
async function divisionResearchPoints(ns, div) {
    // Nur das Feld abfragen -> berührt das veraltete .type nicht (keine Deprecation-Warnung).
    const r = await evalNs(ns, `ns.corporation.getDivision(${JSON.stringify(div)}).researchPoints`);
    return typeof r === "number" ? r : 0;
}

/** Städte einer Division (feldgenau -> keine Deprecation-Warnung). @returns {Promise<string[]>} */
async function divisionCities(ns, div) {
    const r = await evalNs(ns, `ns.corporation.getDivision(${JSON.stringify(div)}).cities`);
    return Array.isArray(r) ? r : [];
}

/**
 * v0.21 — Branche einer Division. Das Engine-Feld heisst "industry"
 * (NetscriptDefinitions:11107, Division.industry: CorpIndustryName); "type" ist
 * das VERALTETE Feld und wird hier bewusst nicht angefasst. Gebraucht wird das
 * im ADOPT-Modus: dort stammen die Divisionen nicht aus einer Blaupause, ihre
 * Branche ist also nur an der Division selbst ablesbar.
 * @returns {Promise<string|null>}
 */
async function divisionIndustry(ns, div) {
    const r = await evalNs(ns, `ns.corporation.getDivision(${JSON.stringify(div)}).industry`);
    return (typeof r === "string" && r.length > 0) ? r : null;
}

// =============================================================================
// v0.22 — STEUERUNG UEBER DIE BRANCHE, NICHT UEBER DEN NAMEN
// =============================================================================
// Bisher erkannte die Blaupausen-Steuerung eine Stufe als "vorhanden", wenn eine
// Division mit dem in der Blaupause hinterlegten NAMEN existierte
// (snap.divisions.includes(stage.name)). Das ist zerbrechlich: die Blaupause
// AGRO_CHEM_TABAK nennt die Tabak-Stufe "Tabak", im Livespielstand heisst die
// Division aber "Tabacco". Folge: die Stufe galt als fehlend, und sobald die
// Fonds gereicht haetten, waere eine ZWEITE Tobacco-Division angelegt worden —
// rund 20 Mrd. fuer nichts, denn createDivision ruft expandIndustry ohne jede
// Pruefung, ob die Branche schon besetzt ist.
//
// Die Branche ist das stabile Merkmal: sie steht als Engine-Feld an der Division
// (Division.industry) und ist unabhaengig davon, wie der Mensch oder eine
// aeltere Skriptfassung sie benannt hat.
//
// Die Landkarte bildet BRANCHE -> TATSAECHLICHER NAME ab, nicht nur eine Menge:
// divisionCities() und alle Division-Reads brauchen den echten Namen ("Tabacco"),
// waehrend die Blaupause nur die Branche kennt ("Tobacco").
//
// Gecacht, weil sich die Branche einer Division nie aendert — je Division genau
// ein eval fuer die gesamte Laufzeit.
const industrieCache = new Map();   // Divisionsname -> Branche

/**
 * @param {NS} ns @param {{divisions:string[]}} snap
 * @returns {Promise<Map<string,string>>} Branche -> Divisionsname
 */
async function branchenKarte(ns, snap) {
    const karte = new Map();
    for (const d of (snap && Array.isArray(snap.divisions) ? snap.divisions : [])) {
        let ind = industrieCache.get(d);
        if (ind === undefined) {
            ind = await divisionIndustry(ns, d);
            if (ind) industrieCache.set(d, ind);
        }
        if (ind && !karte.has(ind)) karte.set(ind, d);
    }
    return karte;
}
async function researchCost(ns, div, name) {
    const r = await evalNs(ns, `ns.corporation.getResearchCost(${JSON.stringify(div)}, ${JSON.stringify(name)})`);
    return typeof r === "number" ? r : -1;
}
async function doResearch(ns, div, name) {
    await evalNs(ns, `ns.corporation.research(${JSON.stringify(div)}, ${JSON.stringify(name)})`);
}

// ===================== FORSCHUNG (organisch; Punkte-Zukauf liegt bei HASHNET) =====================

/**
 * Auto-Forschung für eine Division: nächstes offenes Ziel der Prioritätsliste
 * erforschen, sobald die Punkte reichen. Fehlen Punkte -> Bedarf zurückmelden
 * (der Zukauf via "Exchange for Corporation Research" liegt bei HASHNET).
 * @param {NS} ns @param {string} div
 * @returns {Promise<boolean>} true = Punkte fehlen (HASHNET soll zukaufen)
 */
async function autoResearch(ns, div, rpKnown = null) {
    let target = null;
    for (const r of RESEARCH_PRIORITY) {
        if (!(await cHasResearched(ns, div, r))) { target = r; break; }
    }
    if (!target) return false; // Prioritätsliste komplett erforscht

    const cost = await researchCost(ns, div, target);
    if (cost < 0) return false;
    // v0.21: Punktestand wird vom Aufrufer durchgereicht (der Loop liest ihn
    // einmal je Division) — vorher las ihn jede Funktion selbst neu.
    const rp = (rpKnown === null) ? await divisionResearchPoints(ns, div) : rpKnown;
    ns.print(`  [${div}] Forschung-Ziel "${target}": Punkte ${rp.toFixed(0)}/${cost.toFixed(0)}${rp < cost ? " (HASHNET gemeldet)" : ""}.`);

    if (rp >= cost) {
        await doResearch(ns, div, target);
        ns.print(`  [${div}] Forschung gekauft: "${target}".`);
        return false;
    }
    return true;
}

// ===================== CORP-WEITE UPGRADES (v0.15) =====================

/**
 * Kauft levelbare Corp-Upgrades nach bestem Gewicht/Kosten-Verhältnis aus dem
 * übergebenen Budget. Nichts wird erzwungen; teure Upgrades warten von selbst.
 * @param {NS} ns @param {number} budget
 * @returns {Promise<number>} Anzahl Käufe
 */
// ===================== PRODUKT-ENGINE (v0.19, P2) =====================
//
// Doku-Meta (product.md, general-advice.md): Produktdivisionen (Tobacco) leben
// von KONTINUIERLICHER Produktentwicklung + Wilson/Advert. Kernregeln:
//   - Immer nur EIN Produkt gleichzeitig in Entwicklung (Engine-Limit).
//   - Slots voll (products.length >= maxProducts) und alle fertig -> das
//     schwächste (min. rating) discontinuen, dann Platz für ein besseres.
//   - Design-/Marketing-Invest je ~1 % funds (Exponent 0.1 -> mehr lohnt nicht).
//   - Fertige Produkte auf MAX/MP verkaufen (all cities); mit TA.II optimal.
//   - Wilson+Advert-Loop: Wilson kaufen wenn leistbar, dann >= 20 % funds in
//     Advert (stärkster Profithebel bei Produkten).
// Alle Division-Reads in EINEM eval-Bündel (spart Temps): getDivision +
// je Produkt getProduct(Sector-12). Rückgabe: div-Name, wenn RP-Zukauf lohnt.

const PRODUCT_CITY   = "Sector-12";   // Entwicklungs-Stadt (Haupt-Office)
const PROD_INVEST_FRAC = 0.01;        // Design/Marketing je 1 % funds
const PROD_MIN_INVEST = 1e9;          // Untergrenze je Invest-Seite
// v0.21: ADVERT_FUNDS_FRAC ENTFERNT. Die AdVert-Leiter läuft jetzt in advertStep
// aus dem gemeinsamen Rundenbudget — vorher gab es zwei Pfade (hier 20 % der
// Fonds, in growWithBudget ein Kauf je Division), die sich nicht kannten.
const ADVERT_MAX_PRODUCT = 8;         // Leiter-Deckel je Runde für Produktdivisionen

/** Ein Bündel-Read je Produktdivision: Kopf + alle Produkt-Fortschritte. */
async function productSnapshot(ns, div) {
    const code = `(() => {
        try {
            const d = ns.corporation.getDivision(${JSON.stringify(div)});
            const out = { products: d.products || [], maxProducts: d.maxProducts || 3,
                          rp: d.researchPoints || 0, awareness: d.awareness || 0,
                          popularity: d.popularity || 0, prod: [] };
            for (const name of out.products) {
                try {
                    const p = ns.corporation.getProduct(${JSON.stringify(div)}, ${JSON.stringify(PRODUCT_CITY)}, name);
                    out.prod.push({ name, dev: p.developmentProgress || 0, rating: p.rating || 0 });
                } catch (e) { out.prod.push({ name, dev: 0, rating: 0 }); }
            }
            return out;
        } catch (e) { return null; }
    })()`;
    return await evalNs(ns, code);
}

let productSeq = 0;   // fortlaufende Produkt-Nummerierung (P0, P1, ...)

/**
 * Produkt-Engine je Produktdivision. Gibt div zurück, wenn RP-Zukauf lohnt.
 * @param {NS} ns
 * @param {string} div
 * @param {number} funds  aktuelle Corp-Fonds
 * @param {string[]} cities  Städte der Division (Verkauf gilt für alle)
 * @param {boolean} ta2  Market-TA.II erforscht?
 */
async function productStep(ns, div, funds, cities, ta2) {
    const snap = await productSnapshot(ns, div);
    if (!snap) return null;

    // 1) Fertige Produkte verkaufen (idempotent, alle Städte) + TA.II falls da.
    for (const p of snap.prod) {
        if (p.dev >= 100) {
            try {
                await evalNs(ns, `(() => { try { ns.corporation.sellProduct(${JSON.stringify(div)}, ${JSON.stringify(PRODUCT_CITY)}, ${JSON.stringify(p.name)}, "MAX", "MP", true); return true; } catch (e) { return false; } })()`);
                if (ta2) await evalNs(ns, `(() => { try { ns.corporation.setProductMarketTA2(${JSON.stringify(div)}, ${JSON.stringify(p.name)}, true); return true; } catch (e) { return false; } })()`);
            } catch (e) { /* weiter */ }
        }
    }

    // 2) Wird gerade eins entwickelt? Dann NICHT parallel starten (Engine-Limit).
    const inDev = snap.prod.some(p => p.dev < 100);

    // 3) Entwicklung anstoßen: freier Slot + nichts in Arbeit + Budget reicht.
    const invest = Math.max(PROD_MIN_INVEST, Math.floor(funds * PROD_INVEST_FRAC));
    if (!inDev && snap.products.length < snap.maxProducts && funds >= invest * 2) {
        const name = "P" + (productSeq++);
        const ok = await evalNs(ns, `(() => { try { ns.corporation.makeProduct(${JSON.stringify(div)}, ${JSON.stringify(PRODUCT_CITY)}, ${JSON.stringify(name)}, ${invest}, ${invest}); return true; } catch (e) { return false; } })()`);
        if (ok === true) ns.print(`  [${div}] Neues Produkt "${name}" in Entwicklung (Invest ${formatMoney(invest)}×2).`);
    }
    // 4) Slots voll UND alle fertig -> schwächstes discontinuen (Rotation).
    else if (!inDev && snap.products.length >= snap.maxProducts) {
        let weakest = null;
        for (const p of snap.prod) if (!weakest || p.rating < weakest.rating) weakest = p;
        if (weakest) {
            const ok = await evalNs(ns, `(() => { try { ns.corporation.discontinueProduct(${JSON.stringify(div)}, ${JSON.stringify(weakest.name)}); return true; } catch (e) { return false; } })()`);
            if (ok === true) ns.print(`  [${div}] Produkt "${weakest.name}" (Rating ${fmtNum(weakest.rating)}) abgelöst -> Platz für Besseres.`);
        }
    }

    // 5) ADVERT läuft NICHT mehr hier, sondern in advertStep aus dem gemeinsamen
    //    Rundenbudget (v0.21). Wilson Analytics kauft corpUpgradeStep, sobald eine
    //    Produktdivision existiert (allowedUpgrades).

    // RP-Zukauf lohnt, solange TA.II noch fehlt oder ein Produkt in Arbeit ist.
    return (!ta2 || inDev) ? div : null;
}

// ===================== FORSCHUNGS-KÄUFE (v0.19, P2) =====================
//
// Gezielte Research-Käufe mit Reserve-Puffer (2× Kosten), streng nach Nutzen:
//   - "Hi-Tech R&D Laboratory" (RP-Boost) als Erstes, sobald ~10k RP da sind.
//   - Produktdivisionen: ab ~140k RP Market-TA.I, dann Market-TA.II — der mit
//     Abstand größte Optimierungsschritt ab Runde 3 (product.md).
// autoResearch (organische Restliste) bleibt zusätzlich aktiv.

const RES_LAB   = "Hi-Tech R&D Laboratory";
const RES_TA1   = "Market-TA.I";
const RES_TA2   = "Market-TA.II";
const RP_LAB_MIN = 10_000;
const RP_TA_MIN  = 140_000;   // TA.I(20k)+TA.II(50k) mit Sicherheitsabstand

async function researchStep(ns, div, isProduct, rpKnown = null) {
    const rp = (rpKnown === null) ? await divisionResearchPoints(ns, div) : rpKnown;
    // Lab zuerst (Multiplikator auf künftige RP).
    if (rp >= RP_LAB_MIN && !(await cHasResearched(ns, div, RES_LAB))) {
        const c = await researchCost(ns, div, RES_LAB);
        if (c >= 0 && rp >= c * 2) { await doResearch(ns, div, RES_LAB); ns.print(`  [${div}] Research "${RES_LAB}" gekauft.`); }
        return;
    }
    if (!isProduct) return;   // TA-Kette nur für Produktdivisionen
    if (rp >= RP_TA_MIN && !(await cHasResearched(ns, div, RES_TA1))) {
        const c = await researchCost(ns, div, RES_TA1);
        if (c >= 0 && rp >= c * 2) { await doResearch(ns, div, RES_TA1); ns.print(`  [${div}] Research "${RES_TA1}" gekauft.`); }
        return;
    }
    if (rp >= RP_TA_MIN && (await cHasResearched(ns, div, RES_TA1)) && !(await cHasResearched(ns, div, RES_TA2))) {
        const c = await researchCost(ns, div, RES_TA2);
        if (c >= 0 && rp >= c * 2) { await doResearch(ns, div, RES_TA2); ns.print(`  [${div}] Research "${RES_TA2}" (optimale Preise!) gekauft.`); }
    }
}

// ===================== EXPORT-ROUTEN (v0.24: generisch) =====================
//
// =========================================================================
// v0.24 BUGFIX — DER QUALITAETS-KREISLAUF WAR TOT
// =========================================================================
// Hier standen drei fest verdrahtete Routen, verglichen ueber DIVISIONSNAMEN:
//     if (has("Agro") && has("Tabak")) ...
//     if (has("Agro") && has("Chem"))  ...
//     if (has("Chem") && has("Agro"))  ...
// Genau der Fehler, den v0.22 ueberall sonst beseitigt hat (Steuerung ueber die
// BRANCHE statt ueber den Namen) — diese Stelle wurde uebersehen. Seit v0.22
// heissen neu angelegte Divisionen nach ihrer Branche ("Chemical", "Tobacco"),
// die Alt-Divisionen des Spielers heissen "Agro" und "Tabacco". Ergebnis:
//     has("Agro")  -> wahr
//     has("Tabak") -> FALSCH  ("Tabacco")
//     has("Chem")  -> FALSCH  ("Chemical")
// Keine einzige Bedingung war erfuellt, also wurde KEINE Route gesetzt. Der
// Qualitaets-Kreislauf — der eigentliche Zweck der Kette — lief nicht.
//
// JETZT: keine Namen, keine feste Liste. Die Routen werden aus den Branchen-
// daten der Engine abgeleitet, die ohnehin schon je Division vorliegen
// (dataByDiv, kein zusaetzlicher Aufruf):
//     wer Material M PRODUZIERT  ->  an jeden, der M als Eingang BRAUCHT.
// Damit entstehen fuer die aktuelle Kette automatisch:
//     Agriculture -> Tobacco        (Plants)
//     Agriculture -> Chemical       (Plants)
//     Chemical    -> Pharmaceutical (Chemicals)
//     Chemical    -> Agriculture    (Chemicals, schliesst den Kreis)
// und jede kuenftige Division verdrahtet sich selbst mit, auch eine, die der
// Spieler von Hand gruendet.
//
// REIHENFOLGE IST NICHT EGAL — und das ist jetzt belegt, nicht vermutet.
// Division.ts:710 arbeitet mat.exports in ANLAGEREIHENFOLGE ab und deckelt
// jede Route auf den noch vorhandenen Bestand (Division.ts:741 "if
// (mat.stored < amt) amt = mat.stored"). Wer zuerst in der Liste steht,
// bedient sich zuerst. Actions.ts:571 haengt neue Routen hinten an, und
// Actions.ts:539 lehnt Duplikate ab — die Reihenfolge wird also beim ERSTEN
// Anlegen festgelegt und laesst sich spaeter nicht mehr aendern.
// Deshalb: Produktdivisionen zuerst. Sie verwandeln das Material in Produkte
// mit Qualitaets- und Preisaufschlag, Materialdivisionen nur in Material.
// (Dass hier bisher gar nichts angelegt wurde, ist an dieser einen Stelle ein
// Gluecksfall: die Liste ist leer, die Reihenfolge damit noch frei.)
//
// Menge "-1" = so viel wie verfuegbar (Engine-Konvention: negativer Wert
// exportiert den Ueberschuss); wir nutzen die (IPROD+IINV/10)-Formel der Doku.
//
// @param {NS} ns
// @param {string[]} divNames  Divisionen dieser Runde
// @param {Object<string,{produced:string[], required:string[], makesProducts:boolean}>} dataByDiv
async function exportStep(ns, divNames, dataByDiv) {
    const routen = [];
    for (const src of divNames) {
        const sd = dataByDiv && dataByDiv[src];
        if (!sd || !Array.isArray(sd.produced) || sd.produced.length === 0) continue;
        for (const mat of sd.produced) {
            for (const dst of divNames) {
                if (dst === src) continue;
                const dd = dataByDiv && dataByDiv[dst];
                if (!dd || !Array.isArray(dd.required) || !dd.required.includes(mat)) continue;
                routen.push({ src, dst, mat, produkt: dd.makesProducts === true });
            }
        }
    }
    if (routen.length === 0) return;
    // Produktdivisionen zuerst (Begruendung oben). Bei Gleichstand bleibt die
    // Fundreihenfolge erhalten — sort ist in JS stabil (ES2019).
    routen.sort((a, b) => (b.produkt ? 1 : 0) - (a.produkt ? 1 : 0));

    // =========================================================================
    // v0.27 BUGFIX — DER AUFRUF HATTE EIN ARGUMENT ZU WENIG
    // =========================================================================
    // Hier standen FUENF Argumente. Die Engine erwartet SECHS
    // (NetscriptFunctions/Corporation.ts:399):
    //     exportMaterial(sourceDivision, sourceCity, targetDivision,
    //                    targetCity, materialName, amt)
    // Ohne targetCity rutschte alles eine Stelle nach vorn: der MATERIALNAME
    // landete auf targetCity, die Mengenformel auf materialName. Die Engine
    // prueft targetCity gegen die Staedte-Aufzaehlung, findet dort "Plants" und
    // wirft — und das umgebende try/catch gab stumm false zurueck.
    //
    // FOLGE: es wurde NIE eine einzige Exportroute angelegt. Nicht seit v0.19,
    // und auch der generische Umbau in v0.24 half nicht — der hat nur bestimmt,
    // WELCHE Routen entstehen sollen, nicht den Aufruf selbst. Die Zeile
    // "[Export] 4 Route(n)" zaehlte die GEPLANTEN Routen und sah deshalb die
    // ganze Zeit richtig aus.
    //
    // ZWEITE AENDERUNG, und sie ist die wichtigere: Fehler werden nicht mehr
    // verschluckt. Genau das hat den Defekt jahrelang unsichtbar gehalten. Ein
    // Duplikat ist erwartet (der Aufruf ist absichtlich idempotent) und wird
    // getrennt gezaehlt; alles andere kommt ins Log.
    const AMT = "(IPROD+IINV/10)*(-1)";   // Doku-Mengenformel (Ueberschuss exportieren)
    let gesetzt = 0, schonDa = 0, uebersprungen = 0;
    const fehler = new Map();

    // =========================================================================
    // v0.34 BUGFIX — ES WURDE GEGEN DIE WAND EXPORTIERT
    // =========================================================================
    // Die Schleife lief ueber ALLE sechs Staedte, ohne zu pruefen, ob die
    // beteiligten Divisionen dort ueberhaupt ein Lagerhaus haben. Fehlt eines,
    // wirft die Engine ("X does not have a warehouse in 'Y'") — und der naechste
    // Takt versuchte genau dasselbe wieder. Seit Tagen, ohne Aussicht.
    //
    // GEMESSEN am 13.09.2026 in der Fehlerchronik BN6:
    //     213.681 gescheiterte Versuche an EINEM Tag
    //     440 von 505 Chronik-Eintraegen stammten aus dieser einen Sache
    // Betroffen: Chemical -> Volhaven/Chongqing/Ishima/New Tokyo und
    // Agriculture -> Volhaven.
    //
    // DER TEURERE TEIL WAR NICHT DIE ENGINE. Jeder Versuch laeuft durch evalNs,
    // erzeugt also ein Wegwerf-Skript unter /Temp/ — und weil Stadt und Division
    // IM BEFEHLSTEXT stehen, ist jede Kombination ein eigener Cache-Eintrag.
    // Das ist derselbe Sammler, den HELPERS v5.0 deckeln musste; hier stand die
    // Quelle.
    //
    // DER SCHADEN WAR ABER DIE CHRONIK. Sie ist DER Fehlerlog des Schwarms, und
    // sie bestand zu 87 % aus dieser Meldung — jeder andere Befund ertrank
    // darin. Dieselbe Lehre steht in DIAG schon zweimal: ein Dauer-Fehlalarm
    // macht die echten Befunde unsichtbar.
    //
    // JETZT: einmal fragen, welche Division wo ein Lagerhaus hat (EIN Aufruf
    // fuer alles), und nur die Paare anfassen, bei denen Quelle UND Ziel eines
    // haben. Was uebrig bleibt, wird EINMAL als Hinweis gezaehlt, nicht als
    // Fehler gemeldet — es ist ja kein Fehler, sondern ein noch nicht gebautes
    // Lagerhaus.
    const divisionen = [...new Set(routen.flatMap(r => [r.src, r.dst]))];
    let lager = null;
    try {
        lager = await evalNs(ns, `(() => { const o = {};
            for (const d of ${JSON.stringify(divisionen)}) { o[d] = {};
                for (const c of ${JSON.stringify(CITIES)}) {
                    try { o[d][c] = ns.corporation.hasWarehouse(d, c) === true; }
                    catch (e) { o[d][c] = false; } } }
            return o; })()`);
    } catch (e) { lager = null; }
    // Faellt die Abfrage aus (kein WarehouseAPI-Unlock, Aufruf gescheitert),
    // wird NICHT blind weitergemacht: ohne die Auskunft waeren wir wieder beim
    // alten Verhalten. Dann lieber diesen Takt aussetzen.
    if (!lager || typeof lager !== "object") {
        ns.print("  [Export] Lagerhaus-Auskunft nicht verfuegbar — Export in diesem Takt uebersprungen.");
        return;
    }
    const hatLager = (div, city) => !!(lager[div] && lager[div][city]);

    for (const r of routen) {
        for (const city of CITIES) {
            if (!hatLager(r.src, city) || !hatLager(r.dst, city)) { uebersprungen++; continue; }
            // v0.46: Smart Supply der EMPFANGENDEN Division auf "imports" stellen.
            // Steht bewusst IM SELBEN Aufruf wie der Export: kostet damit keinen
            // zusaetzlichen Engine-Aufruf, und beides kann nicht auseinanderlaufen.
            // Der Aufruf ist idempotent; schlaegt er fehl (aeltere Fassung ohne
            // die Funktion), stoert das den Export nicht — deshalb eigenes try.
            const res = await evalNs(ns, `(() => { try {
                ns.corporation.exportMaterial(${JSON.stringify(r.src)}, ${JSON.stringify(city)}, ${JSON.stringify(r.dst)}, ${JSON.stringify(city)}, ${JSON.stringify(r.mat)}, ${JSON.stringify(AMT)});
                try { ns.corporation.setSmartSupplyOption(${JSON.stringify(r.dst)}, ${JSON.stringify(city)}, ${JSON.stringify(r.mat)}, "imports"); } catch (e2) { }
                return "ok";
            } catch (e) { return String((e && e.message) ? e.message : e); } })()`);
            const s = String(res);
            if (s === "ok") gesetzt++;
            else if (s.indexOf("duplicate warehouse") >= 0) schonDa++;
            else {
                // Erste Zeile genuegt: die Engine haengt bei Duplikaten mehrere
                // Zeilen an, und der Rest ist fuer die Diagnose ohne Wert.
                const kurz = s.split("\n")[0].slice(0, 90);
                fehler.set(kurz, (fehler.get(kurz) || 0) + 1);
            }
        }
    }
    ns.print(`  [Export] ${routen.length} Route(n) x ${CITIES.length} Staedte: `
        + `${gesetzt} neu gesetzt, ${schonDa} standen schon`
        + (uebersprungen ? `, ${uebersprungen} ohne Lagerhaus uebersprungen.` : "."));
    ns.print(`  [Export] ` + routen.map(r => `${r.src}->${r.dst}(${r.mat})${r.produkt ? "*" : ""}`).join(", ")
        + `   * = Produktdivision, wird zuerst bedient.`);
    for (const [msg, n] of fehler) ns.print(`  [Export] FEHLER ${n}x: ${msg}`);
}

/**
 * v0.44 — STUFE UND NAECHSTER PREIS JEDES CORP-UPGRADES.
 *
 * Rein lesend, veraendert nichts. Ergebnis geht in die CORP_INFO, damit im
 * Vollbericht sichtbar wird, was bisher gar nicht zu sehen war.
 *
 * ZU DEN KOSTEN: das sind zwanzig evalNs-Aufrufe je Runde. Entscheidend
 * ist, dass die Befehlstexte FEST sind — bei Division/Stadt steht der
 * Name IM Text, und jede Kombination wurde zu einem eigenen Cache-Eintrag
 * (die Quelle des Sammlers aus v0.34). Hier bleiben es genau zwanzig.
 *
 * @param {NS} ns
 * @returns {Promise<Object<string,{lvl:number,cost:number}>>}
 */
async function upgradeLage(ns) {
    const out = {};
    for (const name of Object.keys(UPGRADE_WEIGHTS)) {
        const lvl = await evalNs(ns, `ns.corporation.getUpgradeLevel(${JSON.stringify(name)})`);
        const cost = await evalNs(ns, `ns.corporation.getUpgradeLevelCost(${JSON.stringify(name)})`);
        // Kurze Schluessel: der Port soll nicht zum Sammelplatz werden.
        out[name] = {
            lvl: (typeof lvl === "number" && isFinite(lvl)) ? lvl : -1,
            cost: (typeof cost === "number" && isFinite(cost)) ? Math.round(cost) : -1,
        };
    }
    return out;
}

/**
 * Kauft levelbare Corp-Upgrades nach bestem Gewicht/Kosten-Verhältnis.
 * v0.21: zieht aus dem GEMEINSAMEN Rundenbudget (Objekt, letzter Posten) und
 * kauft nur aus der für die Phase ERLAUBTEN Liste (allowedUpgrades).
 * @param {NS} ns @param {{remaining:number}} budget @param {string[]} allowed
 * @returns {Promise<number>} Anzahl Käufe
 */
async function corpUpgradeStep(ns, budget, allowed, grossTopf) {
    // v0.45: zwei Quellen. Erst der Rest der Runde, dann der Grossposten-Topf.
    // Ohne den zweiten kaeme ein Upgrade, das teurer ist als eine Runde, nie
    // zustande — und genau dort liegen sie inzwischen alle.
    const toepfe = [budget, grossTopf].filter(t => t && t.remaining > 0);
    if (toepfe.length === 0) return 0;
    const names = Object.keys(UPGRADE_WEIGHTS).filter(n => allowed.includes(n));
    if (names.length === 0) return 0;
    let buys = 0;
    while (buys < MAX_UPGRADE_BUYS) {
        const frei = toepfe.reduce((a, t) => a + Math.max(0, t.remaining), 0);
        let best = null;
        for (const name of names) {
            const c = await evalNs(ns, `ns.corporation.getUpgradeLevelCost(${JSON.stringify(name)})`);
            if (typeof c !== "number" || !isFinite(c) || c <= 0) continue;
            if (c > frei) continue;
            const ratio = UPGRADE_WEIGHTS[name] / c;
            if (!best || ratio > best.ratio) best = { name, cost: c, ratio };
        }
        if (!best) break;
        const ok = await evalNs(ns, `(() => { try { ns.corporation.levelUpgrade(${JSON.stringify(best.name)}); return true; } catch (e) { return false; } })()`);
        if (ok !== true) break;
        // Vom Rundenrest zuerst, was darueber hinausgeht vom Grossposten-Topf.
        let offen = best.cost;
        for (const t of toepfe) {
            if (offen <= 0) break;
            const nimm = Math.min(offen, Math.max(0, t.remaining));
            t.remaining -= nimm; offen -= nimm;
        }
        buys++;
        ns.print(`  [Upgrade] ${best.name} +1 (${formatMoney(best.cost)}).`);
        chronik(ns, "CORP", "upgrade", best.name, "gekauft", `+1 fuer ${formatMoney(best.cost)}`);
    }
    return buys;
}

// ===================== BÖRSE (v0.16 — 100%-Eigentum) =====================

let warnedInvestors = false; // Hinweis zu nicht-rückkaufbaren Investor-Anteilen nur einmal

/**
 * IPO, Dividenden, Emission, Rückkauf, Steuer-Unlocks — alles auf das Ziel
 * "100% der Aktien beim Spieler" ausgerichtet. Nimmt NIE Investment-Runden an.
 * @param {NS} ns @param {object} snap  corpSnapshot()
 */
// ===================== INVESTMENT-RUNDEN (v0.21) =====================
//
// Spieler-Vorgabe: maximal ZWEI Runden annehmen. financial-statement.md:67 —
// FundingRoundShares [0.1, 0.35, 0.25, 0.2], Multiplier [3, 2, 2, 1.5]. Nach
// Runde 2 bleiben 55 % der Anteile beim Spieler; Runde 3 wuerde weitere 25
// Punkte kosten und wird deshalb NICHT genommen.
//
// ANGENOMMEN WIRD NACH FORTSCHRITT, NICHT NACH DOLLAR-SCHWELLEN. Das Angebot
// haengt an Bewertung, Anteilen und BitNode-Multiplikator (BN10 halbiert es per
// CorporationValuation) — eine feste Zielsumme waere in jeder BitNode falsch.
// Gate Runde 1: alle 6 Staedte besetzt, Boost-Ziel erreicht, Profit > 0.
// Gate Runde 2: zusaetzlich Support-Division vorhanden und RP-Ziele erreicht
//               (general-advice.md: 700 RP Basis / 390 RP Support).
// SICHERUNG: sind Staedte + Profit erfuellt, das Boost-Ziel aber seit
// INVEST_GRACE_MS nicht (z. B. weil Output das Lager verstopft), wird trotzdem
// angenommen — sonst koennte ein blockiertes Lager die Runde ewig aufhalten.
const INVEST_GRACE_MS = 10 * 60_000;
const investWait = { since: 0, round: -1 };

/**
 * Investoren-Angebot annehmen, wenn die Runde fortschrittsseitig "fertig" ist.
 * @param {NS} ns
 * @param {object} snap corpSnapshot()
 * @param {{round:number, funds:number, shares:number}|null} offer
 * @param {{cities:number, boostOk:boolean, rpMain:number, rpSupp:number, hasSupport:boolean}} prog
 * @returns {Promise<boolean>} true = angenommen
 */
async function investStep(ns, snap, offer, prog) {
    if (snap.public) return false;                       // nach dem IPO gibt es keine Runden
    // v0.48: bei fruehem Boersengang gibt es bewusst GAR KEINE Runden. Der
    // IPO beendet sie ohnehin — hier steht es aber als Absicht und nicht
    // als Nebenwirkung, und der Wartelauf faellt weg.
    if (BOERSE_SOFORT) return false;
    if (!offer || offer.round < 1) return false;
    const done = investedRounds(offer, snap);
    if (done >= MAX_INVEST_ROUNDS) return false;        // Vorgabe erreicht -> Rest gehoert dir

    const profit = (snap.revenue || 0) - (snap.expenses || 0);
    const base = prog.cities >= CITIES.length && profit > 0;

    // Warteuhr je Runde fuehren (Grundbedingungen erfuellt, aber noch nicht alles).
    if (investWait.round !== offer.round) { investWait.round = offer.round; investWait.since = 0; }
    if (base && investWait.since === 0) investWait.since = Date.now();
    const waited = investWait.since > 0 ? (Date.now() - investWait.since) : 0;

    let ready = false, why = "";
    if (!base) {
        why = `Staedte ${prog.cities}/${CITIES.length}, Profit/s ${formatMoney(profit)}`;
    } else if (offer.round === 1) {
        ready = prog.boostOk || waited > INVEST_GRACE_MS;
        why = ready ? (prog.boostOk ? "Basis komplett" : "Boost-Ziel haengt -> Karenz abgelaufen")
                    : "Boost-Ziel noch offen";
    } else {
        const rpOk = prog.rpMain >= INVEST_RP_MAIN && prog.rpSupp >= INVEST_RP_SUPP;
        ready = prog.hasSupport && (rpOk || waited > INVEST_GRACE_MS);
        why = ready ? (rpOk ? "Support-Division + RP-Ziele erreicht" : "RP-Ziele haengen -> Karenz abgelaufen")
                    : `Support ${prog.hasSupport ? "ok" : "fehlt"}, RP ${Math.round(prog.rpMain)}/${INVEST_RP_MAIN} + ${Math.round(prog.rpSupp)}/${INVEST_RP_SUPP}`;
    }

    if (!ready) {
        ns.print(`  [Invest] Runde ${offer.round} (Angebot ${formatMoney(offer.funds)}) wartet — ${why}.`);
        return false;
    }
    const ok = await acceptInvestment(ns);
    if (ok) {
        ns.print(`  [Invest] Runde ${offer.round} ANGENOMMEN: ${formatMoney(offer.funds)} ` +
            `fuer ${fmtNum(offer.shares)} Anteile (${why}). Noch ${MAX_INVEST_ROUNDS - done - 1} Runde(n) vorgesehen.`);
        investWait.since = 0;
    } else {
        ns.print(`  [Invest] Runde ${offer.round}: Annahme abgelehnt — naechster Durchlauf.`);
    }
    return ok;
}

// ===================== BÖRSE/DIVIDENDEN (v0.21) =====================
//
// Aktien-HANDEL (buyBack/sell) macht die BANK. CORP kuemmert sich nur um IPO,
// Dividenden-Rate, Steuer-Unlocks und — bei echtem Kapitalbedarf ohne
// Investor-Anteile — Emission. Der Aktien-Zustand geht ueber Port 31 an die BANK.
//
// IPO (v0.21): Die alte Bedingung "valuation >= 10e9" war IMMER wahr, weil 1e10
// der Engine-MINDESTWERT der Bewertung ist (financial-statement.md). Die Corp ging
// damit im ersten Durchlauf an die Boerse und verlor jede Investment-Runde. Jetzt:
// IPO erst, wenn alle vorgesehenen Runden genommen sind.
//
// DIVIDENDEN (v0.21): Doku-Formel
//     TotalDividends = Rate x (Revenue - Expenses) x 10        (je 10-s-Cycle)
//     Dividend       = (Eigenanteil x TotalDividends) ^ (1 - TributeModifier)
//     TributeModifier = 1.15 - CorporationSoftcap  (- 0.05 Shady, - 0.1 Government)
// Der EXPONENT ist entscheidend: bei TributeModifier 0.25 (BN10, Softcap 0.9)
// werden aus 5.5e9 nur 7.2e6 — Faktor 760. Eine feste Prozentregel verbrennt
// dann Reinvestitionskapital fuer fast nichts. Deshalb wird der Wirkungsgrad
// gerechnet (dividendEfficiency) und nur ausgeschuettet, wenn er
// DIVIDEND_MIN_EFFICIENCY erreicht. Die Steuer-Unlocks werden VORHER gekauft.
/**
 * v0.41 — Ab welchem Fondsstand faellt die Bewertung auf die Untergrenze?
 *
 * Bei voller Ausschuettung ist `val = funds * officeFaktor`, und erst wenn das
 * unter $10 Mrd liegt, greift `if (val < 10e9) val = 10e9`. Der officeFaktor
 * ist 1.0079741404289038^(Bueros + Lager) — bei 12 Bueros und 12 Lagern also
 * rund 1,21, die Grenze damit rund $8,26 Mrd.
 *
 * WARUM GERECHNET UND NICHT FEST: der Faktor waechst mit jeder neuen Stadt.
 * Eine feste Zahl waere nach der naechsten Expansion falsch — und zwar nach
 * oben, also in die teure Richtung.
 */
function fensterFondsGrenze(bueroUndLager) {
    const faktor = Math.pow(FENSTER_OFFICE_BASIS, Math.max(0, bueroUndLager || 0));
    return (FENSTER_BEWERTUNG_MIN / faktor) * FENSTER_FONDS_PUFFER;
}

/**
 * v0.41 — Der Zustandsautomat des Rueckkauf-Fensters.
 *
 * Er entscheidet NUR ueber Emission und Dividende. Gekauft wird nicht hier:
 * eigene Aktien fasst CORP grundsaetzlich nicht an, das macht die BANK ueber
 * Port 31 (siehe Punkt 5 in stockStep). Diese Trennung bleibt.
 *
 * @param {NS} ns
 * @param {object} snap   Corp-Schnappschuss
 * @param {number} bueroUndLager  Zahl der Bueros + Lager (fuer die Fondsgrenze)
 * @returns {Promise<object>} Zustand fuer die Veroeffentlichung auf Port 31
 */
async function fensterStep(ns, snap, bueroUndLager) {
    const grenze = fensterFondsGrenze(bueroUndLager);
    const anteil = snap.totalShares > 0 ? snap.numShares / snap.totalShares : 1;
    const setzePhase = (p) => { if (fensterPhase !== p) { fensterPhase = p; fensterSeit = Date.now(); } };

    if (!FENSTER_AKTIV || snap.public !== true) { setzePhase("aus"); return fensterStand(grenze, anteil); }

    // FERTIG: Anteil steht. Dividende wieder der normalen Logik ueberlassen —
    // stockStep regelt sie ab dem naechsten Durchlauf selbst.
    if (anteil >= FLOOR_OWN_FRAC) {
        if (fensterPhase !== "aus") {
            ns.print(`  [Fenster] Ziel erreicht: ${(anteil * 100).toFixed(2)}% >= `
                + `${(FLOOR_OWN_FRAC * 100).toFixed(1)}%. Fenster zu, Dividende zurueck an die Normallogik.`);
            setzePhase("aus");
        }
        return fensterStand(grenze, anteil);
    }

    // =====================================================================
    // v0.42 BUGFIX — DER ZUSTAND WIRD ABGELEITET, NICHT ERINNERT
    // =====================================================================
    // Hier stand: in Phase "aus" warten, bis `issueCooldown <= 0`, und erst
    // dann weiter. Das hatte zwei Fehler, die zusammen den Automaten lahmlegten:
    //
    //   1. fensterPhase lebt NUR IM SPEICHER. Jeder CORP-Neustart (Deploy,
    //      Schalter, Reset) setzt sie auf "aus" zurueck — der Automat vergisst,
    //      dass er schon emittiert und ausgegeben hat.
    //   2. In "aus" blockierte dann die Abklingzeit. Die betrifft aber NUR die
    //      Emission, nicht den Rueckkauf. Nach einer Emission sind das rund
    //      sechs Stunden.
    //
    // Zusammen hiess das: genau wenn geerntet werden muesste, steht er still.
    // Live am 20.09.2026 beobachtet: Fonds auf $4,60 Mrd gefallen (Schwelle
    // ~$7,3 Mrd), Anteil ~0 %, Dividende 0 % — das Fenster haette offen sein
    // muessen und war es nicht.
    //
    // JETZT wird die Phase aus der LAGE bestimmt. Das ueberlebt jeden Neustart
    // und kann nicht mehr auf einem alten Zwischenstand haengenbleiben:
    //     Fonds unter der Grenze          -> offen   (ernten)
    //     Abklingzeit frei                -> emission (Kapital holen)
    //     sonst                           -> ausgeben (warten, bis Fonds fallen)
    // Die Emission ist damit ein BESCHLEUNIGER, keine Voraussetzung.
    //
    // HYSTERESE beim Offenhalten: die Bewertung ist ein gleitendes Mittel ueber
    // zehn Zyklen. Ein einmal offenes Fenster bleibt deshalb offen, solange die
    // Fonds unter der ROHEN Kante liegen (ohne den 10-%-Puffer) — sonst klappt
    // es bei jedem kleinen Ausschlag zu und die Dividende pendelt.
    const kante = grenze / FENSTER_FONDS_PUFFER;
    const haltenOffen = fensterPhase === "offen" && snap.funds <= kante;

    if (snap.funds <= grenze || haltenOffen) {
        setzePhase("offen");
    } else if ((snap.issueCooldown || 0) <= 0) {
        setzePhase("emission");
    } else {
        setzePhase("ausgeben");
    }

    if (fensterPhase === "emission") {
        // ABSICHTLICH OHNE DEN investorShares-SCHUTZ AUS stockStep.
        // Dort gilt "nur emittieren, wenn investorShares === 0", weil jede
        // Emission einen Zufallsanteil dauerhaft an private Investoren abgibt
        // (issueNewShares: privateShares) und der NIE rueckkaufbar ist.
        // Nachgerechnet trifft der Einwand hier aber nicht: der Investoranteil
        // waechst je Emission um hoechstens (Menge/2) * Investorquote, also
        // ~50 Mio, waehrend totalShares um 300 Mio waechst. Sein ANTEIL faellt
        // dadurch von 33,3 % auf 30,6 % — die Obergrenze des erreichbaren
        // Eigenbesitzes STEIGT also (66,7 % -> 70,8 %), sie faellt nicht.
        const max = Math.floor((snap.totalShares * ISSUE_FRACTION_OF_TOTAL) / 10e6) * 10e6;
        if (max >= 10e6) {
            const r = await evalNs(ns, `(() => { try { return ns.corporation.issueNewShares(${max}); } catch (e) { return null; } })()`);
            if (typeof r === "number") {
                ns.print(`  [Fenster] Emission zum HOHEN Kurs: ${fmtNum(max)} Aktien -> `
                    + `${formatMoney(r)} Corp-Kapital. Jetzt ausgeben, bis die Fonds unter `
                    + `${formatMoney(grenze)} liegen.`);
                setzePhase("ausgeben");
            } else {
                // Emission abgelehnt (Abklingzeit, Vielfaches, Deckel) — zurueck
                // auf Anfang statt in einer halben Phase haengen zu bleiben.
                ns.print(`  [Fenster] Emission abgelehnt. Zurueck auf Warten.`);
                setzePhase("aus");
            }
        } else {
            setzePhase("aus");
        }
        return fensterStand(grenze, anteil);
    }

    if (fensterPhase === "ausgeben") {
        // Nichts erzwingen: der normale Ausbau gibt ohnehin aus. Hier nur
        // melden, damit im Bericht steht, worauf gewartet wird.
        ns.print(`  [Fenster] Ausgeben: Fonds ${formatMoney(snap.funds)} > `
            + `${formatMoney(grenze)}. Solange haengt die Bewertung an den Fonds `
            + `und der Rueckkauf waere teuer.`);
        return fensterStand(grenze, anteil);
    }

    // ---- "offen" ----------------------------------------------------------
    // v0.42: HIER wird die Dividende gesetzt, nicht mehr beim Uebergang.
    // Vorher hing das am Block "ausgeben" — mit dem abgeleiteten Zustand wird
    // der aber uebersprungen, sobald die Fonds unter der Grenze liegen, und die
    // Dividende waere nie gesetzt worden. Ein Zustandsautomat, dessen Wirkung
    // an einem UEBERGANG haengt, verliert sie bei jedem Neustart; sie gehoert
    // an den ZUSTAND.
    //
    // Deshalb jede Runde pruefen statt einmal setzen: steht die Rate schon,
    // kostet das nichts, und nach einem Neustart oder einem fremden Eingriff
    // stellt es sie von selbst wieder her.
    if ((snap.dividendRate || 0) < FENSTER_DIVIDENDE - 1e-9) {
        const ok = await evalNs(ns, `(() => { try { ns.corporation.issueDividends(${FENSTER_DIVIDENDE}); return true; } catch (e) { return false; } })()`);
        if (ok === true) {
            ns.print(`  [Fenster] OFFEN: Dividende auf ${(FENSTER_DIVIDENDE * 100).toFixed(0)}%, `
                + `Fonds ${formatMoney(snap.funds)} < ${formatMoney(grenze)}. Die Bewertung faellt `
                + `auf ${formatMoney(FENSTER_BEWERTUNG_MIN)} - BANK kauft dann paketweise zurueck.`);
        }
    }
    return fensterStand(grenze, anteil);
}

/** Der Fensterzustand, wie ihn Port 31 traegt (BANK liest `offen`). */
function fensterStand(grenze, anteil) {
    return {
        phase: fensterPhase,
        offen: fensterPhase === "offen" ? 1 : 0,
        grenze: Math.round(grenze),
        anteil: Number(anteil.toFixed(6)),
        ziel: FLOOR_OWN_FRAC,
        seit: fensterSeit,
    };
}

async function stockStep(ns, snap, offer, reserve, stufeOffen) {
    const done = investedRounds(offer, snap);

    // 1) STEUER-UNLOCKS ZUERST: sie senken den Dividenden-Exponenten und sind damit
    //    die Voraussetzung dafuer, dass Ausschuettung ueberhaupt lohnt. Kauf nur
    //    oberhalb der Kapitalbedarfs-Reserve, strikt der Reihe nach.
    for (const u of TAX_UNLOCKS) {
        if (await cHasUnlock(ns, u)) continue;
        const c = await unlockCost(ns, u);
        if (c >= 0 && (snap.funds - reserve) > c) {
            if (await cPurchaseUnlock(ns, u)) ns.print(`  [Boerse] Steuer-Unlock gekauft: "${u}" (${formatMoney(c)}).`);
        }
        break;
    }

    // 2) IPO — erst wenn alle vorgesehenen Investment-Runden genommen sind.
    //    Mit 0 abgegebenen Aktien: es wandert kein weiterer Anteil an Investoren.
    if (!snap.public) {
        // v0.48: BOERSE_SOFORT laesst den Wartelauf auf die Investment-Runden
        // aus. Gedacht fuer die Lage, in der die Runden an einer Bedingung
        // haengen, die ohne Geld nicht erfuellbar ist (Staedte).
        if (done >= MAX_INVEST_ROUNDS || BOERSE_SOFORT) {
            // Aktien MIT verkaufen — goPublic(0) waere null Geld (Actions.ts:159).
            const eigen = Number(snap.numShares) || 0;
            const verkauf = BOERSE_SOFORT
                ? Math.max(0, Math.floor(eigen * BOERSE_SOFORT_ANTEIL))
                : 0;
            const vorher = Number(snap.funds) || 0;
            const ok = await evalNs(ns, `(() => { try { ns.corporation.goPublic(${verkauf}); return true; } catch (e) { return false; } })()`);
            if (ok === true) {
                const nachher = await evalNs(ns, `ns.corporation.getCorporation().funds`);
                const erloes = (typeof nachher === "number") ? Math.max(0, nachher - vorher) : 0;
                ns.print(`  [Boerse] IPO durchgefuehrt: ${fmtNum(verkauf)} Aktien abgegeben, `
                    + `Erloes ${formatMoney(erloes)} (${done} Investment-Runde(n) genommen).`);
                chronik(ns, "CORP", "ipo", "Boersengang", "durchgefuehrt",
                    `${fmtNum(verkauf)} Aktien, ${formatMoney(erloes)}`);
            } else {
                ns.print(`  [Boerse] IPO fehlgeschlagen — naechster Versuch im naechsten Durchlauf.`);
                chronik(ns, "CORP", "ipo", "Boersengang", "fehlgeschlagen", "");
            }
        } else {
            ns.print(`  [Boerse] IPO wartet — erst ${done}/${MAX_INVEST_ROUNDS} Investment-Runden genommen.`);
        }
        return;
    }

    // 3) DIVIDENDEN nach WIRKUNGSGRAD (Rechenweg im Abschnittskopf).
    const softcap = corpSoftcap(ns);
    const shady = await cHasUnlock(ns, TAX_UNLOCKS[0]);
    const gov = await cHasUnlock(ns, TAX_UNLOCKS[1]);
    const tribute = tributeModifier(softcap, shady, gov);
    const rateNow = snap.dividendRate || 0;
    const effNow = dividendEfficiency(snap, Math.max(rateNow, DIVIDEND_STEP), tribute);
    const effNext = dividendEfficiency(snap, Math.min(DIVIDEND_MAX, rateNow + DIVIDEND_STEP), tribute);

    // v0.32: Reifetor. Solange eine Blaupausen-Stufe offen ist, ist die Corp
    // nicht gesaettigt - der Zaehler faellt zurueck. Ein unbekannter Zustand
    // (stufeOffen undefined) zaehlt als "offen": lieber nicht ernten.
    // v0.40: EIN HUNGRIGES BUERO IST OFFENES WACHSTUM.
    // Bisher zaehlte nur "keine Blaupausen-Stufe mehr offen". Der teuerste
    // Posten einer Corp ist aber Personal ($4.36 Mrd je drei Plaetze), und
    // solange dafuer angespart wird, ist die Corp nicht gesaettigt — jeder
    // ausgeschuettete Dollar fehlt dann doppelt: er kauft keine Plaetze UND
    // druckt ueber assetDelta *= (1 - dividendRate) die Bewertung.
    // v0.43: lagerHungrig zaehlt genauso. Ein volles Lager bremst die
    // Produktion unmittelbar - wer dafuer noch spart, ist nicht gesaettigt.
    const wachstumOffen = (stufeOffen !== false) || bueroHungrig || lagerHungrig;
    if (!wachstumOffen) {
        if (ernteReifZaehler < ERNTE_REIF_RUNDEN) ernteReifZaehler++;
    } else {
        ernteReifZaehler = 0;
    }
    const ernteFrei = DIVIDEND_ERNTE_AKTIV && ernteReifZaehler >= ERNTE_REIF_RUNDEN;

    let targetRate = rateNow;
    if (ernteFrei) {
        // ERNTE: Wirkungsgrad ist hier NICHT das Kriterium (Begruendung bei den
        // Konstanten). Schrittweise auf die Zielrate zu, nie darueber hinaus.
        //
        // DIE ZIELRATE HAENGT AN DEN STEUER-UNLOCKS, und der Unterschied ist
        // groesser als alles, was man an der Rate selbst drehen kann:
        //   Exponent 0.75 (ohne):   aus 2,5t Brutto werden  1,99b
        //   Exponent 0.90 (beide):  aus 2,5t Brutto werden  144b
        // Das ist Faktor 72. Solange die Unlocks fehlen, ist jeder ausgezahlte
        // Dollar also 72-mal weniger wert als derselbe Dollar danach — und die
        // Unlocks werden aus genau denselben Fonds bezahlt (Abschnitt 1 oben).
        // Deshalb laeuft die Ernte bis dahin auf kleiner Flamme: du siehst
        // sofort Geld, aber der Aufbau zur vollen Rate wird nicht ausgebremst.
        const zielRate = (shady && gov) ? DIVIDEND_ERNTE_RATE : DIVIDEND_ERNTE_RATE_VOR_STEUER;
        if (rateNow < zielRate - 1e-9) {
            targetRate = Math.min(zielRate, rateNow + DIVIDEND_STEP);
        } else if (rateNow > zielRate + 1e-9) {
            targetRate = Math.max(zielRate, rateNow - DIVIDEND_STEP);
        }
    } else if (effNext >= DIVIDEND_MIN_EFFICIENCY) {
        targetRate = Math.min(DIVIDEND_MAX, rateNow + DIVIDEND_STEP);   // naechste Stufe traegt noch
    } else if (rateNow > 0 && effNow < DIVIDEND_MIN_EFFICIENCY) {
        targetRate = Math.max(0, rateNow - DIVIDEND_STEP);              // aktuelle Stufe traegt nicht mehr
    }
    // v0.41 VORFAHRT FUERS FENSTER. Solange es offen steht, gehoert die
    // Dividende dem Rueckkauf — sie ist dort kein Ertrag, sondern das Werkzeug,
    // das die Bewertung drueckt. Ohne diese Sperre wuerden beide Stellen jede
    // Runde gegeneinander schreiben: fensterStep setzt 100 %, die Normallogik
    // zieht sie mit DIVIDEND_STEP wieder herunter, und die Bewertung fiele nie.
    if (fensterPhase === "offen") {
        if (Math.abs(targetRate - rateNow) > 1e-9) {
            ns.print(`  [Boerse] Dividende bleibt bei ${(rateNow * 100).toFixed(0)}% — `
                + `Rueckkauf-Fenster offen (Normallogik wollte ${(targetRate * 100).toFixed(1)}%).`);
        }
    } else if (Math.abs(targetRate - rateNow) > 1e-9) {
        const ok = await evalNs(ns, `(() => { try { ns.corporation.issueDividends(${targetRate}); return true; } catch (e) { return false; } })()`);
        if (ok === true) ns.print(`  [Boerse] Dividende ${(targetRate * 100).toFixed(1)}% ` +
            `(Wirkungsgrad ${(effNext * 100).toFixed(1)}% bei Tribute ${tribute.toFixed(2)}, Softcap ${softcap}).`);
    } else if (rateNow > 0) {
        // Steht die Zielrate schon, dann jede Runde melden WAS ANKOMMT — sonst
        // sieht man nur einen Prozentsatz und nie einen Betrag.
        const gewinn = (snap.revenue || 0) - (snap.expenses || 0);
        const proSek = dividendEfficiency(snap, rateNow, tribute) * rateNow * gewinn;
        const steuer = (shady && gov) ? "beide Steuer-Unlocks"
                     : shady ? "nur Shady — Government fehlt"
                     : gov ? "nur Government — Shady fehlt"
                     : "KEIN Steuer-Unlock, kleine Flamme";
        ns.print(`  [Boerse] Dividende steht bei ${(rateNow * 100).toFixed(1)}%` +
            (DIVIDEND_ERNTE_AKTIV ? " [ERNTE]" : "") +
            ` -> rund ${formatMoney(proSek)}/s an dich (Tribute ${tribute.toFixed(2)}, ${steuer}).`);
    } else if (rateNow === 0) {
        ns.print(`  [Boerse] Keine Dividende: Wirkungsgrad ${(effNext * 100).toFixed(1)}% < ${(DIVIDEND_MIN_EFFICIENCY * 100).toFixed(0)}% ` +
            `(Tribute ${tribute.toFixed(2)}${shady ? ", Shady" : ""}${gov ? ", Government" : ""}). Reinvestition ist mehr wert.`);
    }

    // 4) Emission NUR bei echtem Kapitalbedarf UND ohne Investor-Anteile (Leck-Schutz).
    //    v0.21: "echter Kapitalbedarf" = Fonds unter der berechneten Reserve
    //    (Unlock + naechste Stufe + Betriebskapital), keine feste Dollar-Grenze mehr.
    if (snap.investorShares > 0 && !warnedInvestors) {
        warnedInvestors = true;
        ns.print(`  [Boerse] HINWEIS: ${fmtNum(snap.investorShares)} Investor-Anteile — laut Engine NIE rueckkaufbar.`);
    }
    if (snap.investorShares === 0 && snap.funds < reserve && snap.issueCooldown <= 0) {
        let amount = Math.floor((snap.totalShares * ISSUE_FRACTION_OF_TOTAL) / 10e6) * 10e6;
        if (amount >= 10e6) {
            const r = await evalNs(ns, `(() => { try { return ns.corporation.issueNewShares(${amount}); } catch (e) { return null; } })()`);
            if (typeof r === "number") ns.print(`  [Boerse] Emission: ${fmtNum(amount)} Aktien -> ${formatMoney(r)} Corp-Kapital (alles rueckkaufbar).`);
        }
    }

    // 5) Aktien-HANDEL macht die BANK (Port 31). CORP fasst eigene Aktien nicht an.
}

// ===================== BRIBES (v0.17 — Corp-Geld -> Faction-Rep) =====================

/**
 * Wandelt Corp-Fonds OBERHALB der Kapitalbedarfs-Reserve in Faction-Rep um
 * ($1b = 1 Rep). Engine-Bedingungen: Valuation >= $100t, Spieler ist Mitglied.
 * v0.21: geschont wird die berechnete Reserve (Unlock + nächste Stufe +
 * Betriebskapital) statt einer festen Zahl.
 * @param {NS} ns @param {object} snap @param {number} reserve
 */
let bribeHinweisGezeigt = false;
async function bribeStep(ns, snap, reserve) {
    if (!BRIBE_FACTION) {
        // Der Mechanismus steht, nur das Ziel fehlt — und WELCHE Fraktion das
        // Geld bekommt, kann kein Skript entscheiden. Einmal je Start melden,
        // damit es nicht still ausbleibt und man es fuer kaputt haelt.
        if (!bribeHinweisGezeigt && snap.valuation >= BRIBE_THRESHOLD) {
            bribeHinweisGezeigt = true;
            ns.print(`  [Bribe] Bereit (Bewertung ${formatMoney(snap.valuation)} >= ${formatMoney(BRIBE_THRESHOLD)}), `
                + `aber BRIBE_FACTION ist leer — Fraktion bei den Konstanten eintragen.`);
        }
        return;
    }
    if (snap.valuation < BRIBE_THRESHOLD) return; // ENGINE-Schwelle (bribeThreshold)

    // =========================================================================
    // v0.30 — DOSIS AUS DEM GEWINN, NICHT AUS DEM VERMOEGEN
    // =========================================================================
    // Bis v0.29 war die Dosis ein Anteil der FONDS (ein Bestand) mit absolutem
    // Deckel. Beides ist ungeschickt: ein Bestandsanteil kann die Kasse
    // leerraeumen, und ein fester Deckel ist bei einer kleinen Corp zu viel und
    // bei einer grossen bedeutungslos.
    //
    // JETZT: ein Anteil des GEWINNS (ein Fluss). Das skaliert von selbst mit der
    // Ertragskraft, kann den Bestand nie angreifen, und die Dosis versiegt
    // automatisch, sobald die Corp keinen Gewinn mehr macht.
    //
    // ZWEI TORE davor, beide bewusst konservativ:
    //   1. BRIBE_MIN_PROFIT — unter diesem Gewinn je Sekunde bleibt jeder Dollar
    //      besser in der Corp. Eine junge Corp verzinst ihn deutlich hoeher, als
    //      1 Rep je Milliarde wert ist.
    //   2. CORP_UNLOCKS vollstaendig — solange auch nur ein Unlock fehlt, ist
    //      jeder Dollar dort besser aufgehoben als in Rufpunkten. Ein Unlock
    //      wirkt dauerhaft auf die ganze Corp, eine Bestechung einmalig.
    //      (Frueher stand hier ein Schalter BRIBE_AKTIV. Den gibt es nicht —
    //      der Name kam im ganzen Projekt nur in diesem Kommentar vor.)
    //
    // WARUM GEWINN UND NICHT FONDS: Bribe ist LINEAR ($1b = 1 Rep,
    // Actions.ts:646) und hat keinen Exponenten wie die Dividende. Ein Dollar
    // bringt hier also immer denselben Gegenwert — die Frage ist nur, ob er
    // woanders mehr braechte. Genau das entscheiden die zwei Tore.
    const gewinnProSek = Math.max(0, (snap.revenue || 0) - (snap.expenses || 0));
    if (gewinnProSek < BRIBE_MIN_PROFIT) {
        if (!bribeArmGemeldet) {
            bribeArmGemeldet = true;
            ns.print(`  [Bribe] wartet: Gewinn ${formatMoney(gewinnProSek)}/s unter der `
                + `Schwelle ${formatMoney(BRIBE_MIN_PROFIT)}/s — Geld bleibt vorerst in der Corp.`);
        }
        return;
    }
    // ZWEITES TOR: alle acht Corp-Unlocks gekauft. Solange einer fehlt, ist
    // jeder Dollar dort besser aufgehoben — die Steuer-Unlocks allein heben die
    // Dividende um Faktor 242 (siehe v0.29), und Smart Supply / die APIs
    // entscheiden ueber den Betrieb ueberhaupt. Rep kann warten, das hier nicht.
    const fehlend = [];
    for (const u of CORP_UNLOCKS) {
        if (!(await cHasUnlock(ns, u))) fehlend.push(u);
    }
    if (fehlend.length > 0) {
        if (!bribeArmGemeldet) {
            bribeArmGemeldet = true;
            ns.print(`  [Bribe] wartet: ${fehlend.length} von ${CORP_UNLOCKS.length} Unlocks fehlen `
                + `(${fehlend.slice(0, 3).join(", ")}${fehlend.length > 3 ? " ..." : ""}). `
                + `Die kaufen sich zuerst.`);
        }
        return;
    }

    bribeArmGemeldet = false;

    // Der Gewinn ist pro SEKUNDE, eine Runde dauert LOOP_MS*4 (20 s). Der Anteil
    // bezieht sich auf den Gewinn DIESER Runde, nicht auf eine Sekunde — sonst
    // haenge die Dosis unsichtbar an der Rundenlaenge.
    const rundenSek = (LOOP_MS * 4) / 1000;
    const ausGewinn = Math.floor(gewinnProSek * rundenSek * BRIBE_PROFIT_FRACTION);
    // Der Bestand bleibt trotzdem die harte Grenze: was nicht da ist, geht nicht.
    const spend = Math.max(0, Math.min(ausGewinn, Math.floor(snap.funds - reserve)));
    if (spend < 1e9) return; // unter $1b bringt keine ganze Rep

    const r = await evalNs(ns, `(() => { try { return ns.corporation.bribe(${JSON.stringify(BRIBE_FACTION)}, ${spend}); } catch (e) { return false; } })()`);
    if (r === true) {
        // Rep pro Stunde mitschreiben: der Rundenbetrag allein sagt nichts
        // darueber, ob die Dosis "moderat" ist oder nicht.
        const proStunde = (spend / 1e9) * (3600 / rundenSek);
        ns.print(`  [Bribe] ${formatMoney(spend)} (${(BRIBE_PROFIT_FRACTION * 100).toFixed(2)} % vom Rundengewinn) `
            + `-> ~${fmtNum(spend / 1e9)} Rep fuer "${BRIBE_FACTION}" (${fmtNum(proStunde)} Rep/h).`);
    } else {
        // Bis v0.28 war ein Fehlschlag hier unsichtbar. Die Engine lehnt aus
        // drei Gruenden ab: keine Mitgliedschaft, die Fraktion bietet keine
        // Arbeit an, oder die Bewertung liegt unter der Schwelle. Alle drei
        // sind behebbar — aber nur, wenn man davon erfaehrt.
        ns.print(`  [Bribe] ABGELEHNT für "${BRIBE_FACTION}" (${formatMoney(spend)}). `
            + `Mitglied? Bietet die Fraktion Arbeit an? Bewertung ${formatMoney(snap.valuation)}.`);
    }
}

// ===================== WOHLBEFINDEN (Moral/Energie) =====================

/**
 * Hält Energie (Tee) und Moral (Party) oben — beides treibt die Produktion.
 * Nur wenn Geld vorhanden ist; nichts wird erzwungen.
 * @param {NS} ns @param {string} div @param {string} city
 * @param {{avgEnergy:number, avgMorale:number}} office @param {number} funds
 */
async function upkeepWellbeing(ns, div, city, office, funds) {
    if (!office || funds <= 0) return;
    const acts = [];

    // Tee nur, wenn AutoBrew NICHT erforscht UND Energie im Notfall-Bereich.
    if (office.avgEnergy < TEA_RESCUE) {
        const teaAuto = await cHasResearched(ns, div, RES_AUTOBREW);
        if (!teaAuto && await cBuyTea(ns, div, city)) acts.push(`Tee (Energie ${office.avgEnergy.toFixed(0)})`);
    }
    // Party nur, wenn AutoPartyManager NICHT erforscht UND Moral im Notfall-Bereich.
    if (office.avgMorale < PARTY_RESCUE) {
        const partyAuto = await cHasResearched(ns, div, RES_AUTOPARTY);
        if (!partyAuto) {
            const m = await cThrowParty(ns, div, city, PARTY_COST_PER_EMP);
            if (m > 0) acts.push(`Party (Moral ${office.avgMorale.toFixed(0)})`);
        }
    }
    if (acts.length) ns.print(`  [${div}] Notfall-Wohlbefinden: ${acts.join(", ")}.`);
}

// ===================== WACHSTUM (gemeinsames Rundenbudget) =====================

/**
 * v0.45 — WER IST AM WENIGSTEN AUSGEBAUT?
 *
 * Gibt die Divisionen sortiert zurueck, die schwaechste zuerst. Verglichen
 * wird NACHEINANDER, nicht verrechnet — damit braucht es keine willkuerliche
 * Gewichtung, und das Ergebnis ist bei jedem Lauf dasselbe:
 *   1. wenigste Staedte           eine neue Stadt vervielfacht alles andere
 *   2. wenigste Plaetze je Stadt  das ist der Bueroausbau. Die Plaetze sind
 *                                 IMMER besetzt (1068/1068, 51/51 gemessen),
 *                                 Einstellen ist also nicht der Engpass.
 *   3. kleinstes Lager
 * Bei vollstaendigem Gleichstand entscheidet der Name, damit die Reihenfolge
 * nicht von der Aufzaehlungsreihenfolge des Objekts abhaengt.
 *
 * @param {string[]} divNames @param {Object} divSummen
 * @returns {string[]} schwaechste zuerst
 */
function rangfolge(divNames, divSummen) {
    const wert = (d) => {
        const z = divSummen[d] || {};
        const st = Number(z.staedte) || 0;
        const plaetze = st > 0 ? (Number(z.empMax) || 0) / st : 0;
        return { st, plaetze, wh: Number(z.wh) || 0 };
    };
    return divNames.slice().sort((a, b) => {
        const x = wert(a), y = wert(b);
        if (x.st !== y.st) return x.st - y.st;
        if (x.plaetze !== y.plaetze) return x.plaetze - y.plaetze;
        if (x.wh !== y.wh) return x.wh - y.wh;
        return a < b ? -1 : (a > b ? 1 : 0);
    });
}

/**
 * Lager und Büro aus dem GEMEINSAMEN Rundenbudget ausbauen — Reihenfolge nach
 * Wirkung: Lager (nur wenn fast voll) -> Büro (nur wenn Moral/Energie gesund).
 * v0.21: AdVert ist ausgelagert (advertStep), damit die Reihenfolge über ALLE
 * Posten hinweg gilt und nicht je Division neu beginnt.
 * @param {NS} ns @param {string[]} divNames Eigene, existierende Divisionen.
 * @param {Object<string,string[]>} citiesByDiv Division -> Städte.
 * @param {{remaining:number}} budget
 */
async function growWithBudget(ns, divNames, citiesByDiv, budget, grossTopf) {
    bueroHungrig = false;                    // v0.40: je Runde neu bewerten
    lagerHungrig = false;                    // v0.43: dito
    if (!budget || budget.remaining <= 0) return;

    for (const div of divNames) {
        const cities = citiesByDiv[div] || ["Sector-12"];

        // Pro Stadt: Lager (nur wenn fast voll) + Büro (nur wenn gesund)
        for (const city of cities) {
            if (budget.remaining <= 0) return;

            // 1) LAGER — nur wenn fast voll
            const wh = await cGetWarehouse(ns, div, city);
            if (wh && wh.size > 0 && (wh.sizeUsed / wh.size) >= WH_FULL_AT) {
                const cost = await warehouseUpgradeCost(ns, div, city, 1);
                // =========================================================
                // v0.43 - EIN LAGER, DAS NICHT INS BUDGET PASST, SPART AN
                // =========================================================
                // Hier stand nur `if (cost <= budget.remaining) { kaufen }`
                // und sonst NICHTS. Kein else, keine Logzeile. Die Kosten
                // einer Lagerstufe wachsen mit 1.07^Stufe (helpers.ts:
                // upgradeWarehouseCost = 1e9 * 1.07^(level+1)), das
                // Rundenbudget dagegen nur mit den freien Fonds - ab einer
                // gewissen Stufe passt es strukturell nie mehr hinein.
                //
                // Dass es scheiterte, war NICHT zu sehen: >= WH_FULL_AT war
                // jede Runde wahr, der Kauf scheiterte jede Runde stumm, und
                // im Bericht blieb nur die FOLGE stehen ("Lager zu 96 %
                // gefuellt") - nie die Ursache. Im Archiv sieht man es an
                // den Ausgaben: immer ~75 % des Rundenbudgets, also exakt
                // der Boost-Anteil, und nie ein Dollar mehr.
                //
                // Dieselbe Loesung wie v0.39 beim Buero: erst das laufende
                // Budget, dann der Grossposten-Topf, sonst ansparen und es
                // SAGEN. Das Lager kommt vor dem Buero, wie dokumentiert
                // ("Reihenfolge nach Wirkung: Lager -> Buero").
                if (cost >= 0 && cost <= budget.remaining) {
                    await cUpgradeWarehouse(ns, div, city, 1);
                    budget.remaining -= cost;
                    ns.print(`  [${div}/${city}] Lager +1 Stufe (${formatMoney(cost)}).`);
                    chronik(ns, "CORP", "lager", `${div}/${city}`, "gekauft", `+1 fuer ${formatMoney(cost)}`);
                } else if (cost >= 0 && grossTopf && cost <= grossTopf.remaining) {
                    await cUpgradeWarehouse(ns, div, city, 1);
                    grossTopf.remaining -= cost;
                    ns.print(`  [${div}/${city}] Lager +1 Stufe (${formatMoney(cost)}) aus dem Grossposten-Topf.`);
                    chronik(ns, "CORP", "lager", `${div}/${city}`, "gekauft", `+1 fuer ${formatMoney(cost)} aus dem Topf`);
                } else if (cost >= 0) {
                    lagerHungrig = true;
                    // DER WICHTIGSTE EINTRAG: dieser Zweig war bis v0.43 voellig
                    // stumm und hat den Fehler monatelang verborgen.
                    chronik(ns, "CORP", "lager", `${div}/${city}`, "zu teuer",
                        `${formatMoney(cost)}, Budget ${formatMoney(budget.remaining)}`);
                    ns.print(`  [${div}/${city}] Lager +1 Stufe kostet ${formatMoney(cost)}, `
                        + `Budget hat ${formatMoney(budget.remaining)}, Topf ${formatMoney(grossTopf ? grossTopf.remaining : 0)} - wird angespart.`);
                }
            }
            // 2) BÜRO — nur wenn Moral & Energie gesund
            // =========================================================
            // v0.39 — BUEROPLAETZE HABEN EINEN EIGENEN TOPF
            // =========================================================
            // Hier stand `oCost <= budget.remaining`. Das konnte nie wahr
            // werden: die Engine nimmt fuer die ersten drei Zusatzplaetze
            // (Corporation/helpers.ts:98, officeInitialCost = 4e9)
            //     (4e9 / 0.09) * 1.09^(size/3) * (1.09^(3/3) - 1)
            // also bei Startgroesse 3 genau $4.36 Mrd — waehrend das
            // Rundenbudget bei $1.76 Mrd lag. Der Kauf wurde damit JEDE
            // Runde still uebersprungen; live belegt ueber drei Berichte:
            // Lager 4.7k -> 5.3k -> 5.6k, Personal unveraendert 12/12.
            //
            // Ein Posten, der grundsaetzlich groesser ist als das Budget,
            // gehoert nicht ins Budget. BANK loest dasselbe Problem mit
            // ihren Grosszielen: ansparen statt hoffen, dass es hineinpasst.
            //
            // WARUM AUSGERECHNET BUEROS DEN VORRANG BEKOMMEN: ein volles
            // Lager ohne Personal produziert nichts. Mitarbeiter sind in
            // Agriculture der teuerste und zugleich wirksamste Hebel — der
            // Grund, warum eine Division sonst bei rund 30m/s klebt.
            const off = await officeInfo(ns, div, city);
            const healthy = off && off.avgMorale >= GROWTH_HEALTH_MIN && off.avgEnergy >= GROWTH_HEALTH_MIN;
            if (healthy && grossTopf && grossTopf.remaining > 0) {
                const oCost = await officeUpgradeCost(ns, div, city, OFFICE_STEP);
                if (oCost >= 0 && oCost <= grossTopf.remaining) {
                    await upgradeOffice(ns, div, city, OFFICE_STEP);
                    grossTopf.remaining -= oCost;
                    chronik(ns, "CORP", "buero", `${div}/${city}`, "gekauft",
                        `+${OFFICE_STEP} Plaetze fuer ${formatMoney(oCost)}`);
                    ns.print(`  [${div}/${city}] Büro +${OFFICE_STEP} Plätze (${formatMoney(oCost)} aus dem Buero-Topf).`);
                } else if (oCost >= 0) {
                    bueroHungrig = true;     // v0.40: die Dividende liest das
                    chronik(ns, "CORP", "buero", `${div}/${city}`, "zu teuer",
                        `${formatMoney(oCost)}, Topf ${formatMoney(grossTopf.remaining)}`);
                    ns.print(`  [${div}/${city}] Büro +${OFFICE_STEP} kostet ${formatMoney(oCost)}, `
                        + `Topf hat ${formatMoney(grossTopf.remaining)} — wird angespart.`);
                }
            }
        }
    }
}

/**
 * ADVERT aus dem gemeinsamen Budget — Bekanntheit/Popularität gelten division-weit.
 * v0.21: EIN Pfad für alle Divisionen. Vorher gab es zwei (growWithBudget: 1 Kauf
 * je Division; productStep: Leiter über 20 % der Fonds) — beide am jeweils anderen
 * Budget vorbei. Produktdivisionen bekommen die Leiter (general-advice.md nennt
 * AdVert dort den stärksten Profithebel), Materialdivisionen einen Kauf je Runde.
 * @param {NS} ns @param {string[]} divNames @param {Object<string,boolean>} isProduct
 * @param {{remaining:number}} budget
 */
async function advertStep(ns, divNames, isProduct, budget) {
    if (!budget || budget.remaining <= 0) return;
    for (const div of divNames) {
        const maxBuys = isProduct[div] ? ADVERT_MAX_PRODUCT : 1;
        let buys = 0, spent = 0;
        while (buys < maxBuys && budget.remaining > 0) {
            const aCost = await adVertCost(ns, div);
            if (aCost < 0 || aCost > budget.remaining) break;
            await cHireAdVert(ns, div);
            budget.remaining -= aCost; spent += aCost; buys++;
        }
        if (buys > 0) ns.print(`  [${div}] AdVert ×${buys} (${formatMoney(spent)}).`);
    }
}

// ===================== HAUPTPROGRAMM =====================

export async function main(ns) {
    ns.disableLog("ALL");
    // v0.36: TAIL-FENSTER NUR AUF ANSAGE — UND SONST AKTIV ZU.
    // v0.35 hat bloss das Oeffnen weggelassen. Das reichte nicht: Bitburner
    // merkt sich offene Tail-Fenster JE SKRIPT und stellt sie beim Neustart
    // wieder her. Ein einmal von Hand geoeffnetes Fenster kam also nach jedem
    // Deploy zurueck, ohne dass es jemand geoeffnet haette. Deshalb schliessen
    // wir es ausdruecklich, wenn es nicht angefordert wurde.
    if (ns.args.includes("--tail")) ns.ui.openTail();
    else { try { ns.ui.closeTail(); } catch (e) { /* kein Fenster da */ } }

    const reroll = ns.args.includes("--reroll");
    if (reroll) { try { ns.rm(STATE_FILE); } catch (e) {} }

    ns.print("=================================");
    ns.print(` // SCHWARM-CORP // v${VERSION}`);
    ns.print("=================================");

    // --- Phase 1: auf Corporation warten ---
    // Die Gründung macht die BANK (Großziel "CORP", createCorporation selbstfinanziert
    // $150b; Seed-Funding ist ausserhalb BN3 engine-seitig unmöglich) und schickt
    // danach START:CORP an die Queen. Dieser Daemon läuft also normalerweise erst,
    // wenn die Corp steht. Die Warteschleife bleibt als Rückfall für den manuellen
    // Start — mit langsamem Takt, damit sie nichts kostet.
    let announced = false;
    while (!(await hasCorp(ns))) {
        if (!announced) { ns.print("Keine Corporation. Warte — die Gründung macht die BANK ($150b, selbstfinanziert)."); announced = true; }
        await ns.sleep(WAIT_CORP_MS);
    }
    ns.print("Corporation erkannt. Übernehme Aufbau.");

    // --- Phase 2: Blaupause bestimmen ---
    const bn = await currentBitNode(ns);
    let state = readState(ns);

    if (!state.bp) {
        const snap = await corpSnapshot(ns);
        if (snap && snap.divisions.length > 0) {
            writeState(ns, "ADOPT", bn);
            state = { bp: "ADOPT", bn };
            ns.print(`Bestehende Division(en): ${snap.divisions.join(", ")}. Adoptiere, lege nichts Neues an.`);
        } else {
            const key = rollBlueprint(bn);
            writeState(ns, key, bn);
            state = { bp: key, bn };
            const chain = BLUEPRINTS[key].stages.map(s => `${s.name}(${s.ind})`).join(" -> ");
            ns.print(`Blaupause gewählt (BN${bn}): ${key}  =  ${chain}`);
        }
    } else {
        if (state.bp !== "ADOPT" && state.bp !== "AGRO_CHEM_TABAK" && BLUEPRINTS[state.bp]) {
            ns.print(`Migriere Blaupause ${state.bp} -> AGRO_CHEM_TABAK (P2; gleiche Namen, fehlende Stufen werden nachgelegt).`);
            state.bp = "AGRO_CHEM_TABAK";
            writeState(ns, state.bp, state.bn);
        }
        ns.print(`Gemerkte Blaupause: ${state.bp}` + (state.bp === "ADOPT" ? " (adoptiert)" : ""));
    }

    // --- Phase 3: erste Division anlegen ---
    if (state.bp && state.bp !== "ADOPT") {
        const stage0 = BLUEPRINTS[state.bp].stages[0];
        const snap = await corpSnapshot(ns);
        // v0.22: ueber die Branche pruefen, nicht ueber den Namen. Eine bestehende
        // Division "Tabacco" erfuellt die Stufe "Tobacco" — vorher galt sie als
        // fehlend, weil die Blaupause sie "Tabak" nennt.
        const bkarte = await branchenKarte(ns, snap || { divisions: [] });
        const exists = bkarte.has(stage0.ind);

        if (snap && snap.divisions.length > 0 && !exists) {
            ns.print(`Andere Division(en) vorhanden (${snap.divisions.join(", ")}). Lege nichts an.`);
        } else if (!exists) {
            const data = await industryData(ns, stage0.ind);
            const cost = data ? data.startingCost : -1;
            const funds = snap ? snap.funds : 0;
            if (cost >= 0 && funds >= cost) {
                ns.print(`Lege Division "${stage0.ind}" an — Kosten ${formatMoney(cost)} ...`);
                const ok = await createDivision(ns, stage0.ind, stage0.ind);
                ns.print(ok ? `  OK. Division "${stage0.ind}" steht.` : `  FEHLGESCHLAGEN. Prüfe später erneut.`);
            } else {
                ns.print(`Warte auf Geld für "${stage0.ind}": habe ${formatMoney(funds)}, brauche ${formatMoney(cost)}.`);
            }
        } else {
            ns.print(`Branche "${stage0.ind}" ist bereits besetzt (Division "${bkarte.get(stage0.ind)}").`);
        }
    }

    // --- Phase 4: Laufbetrieb ---
    //
    // AUSGABE-REIHENFOLGE (v0.21). Alles Folgende zahlt aus EINEM Rundenbudget;
    // vorher hatten Boost (20 %), Wachstum (20 %) und Upgrades (15 %) je einen
    // eigenen Anteil DESSELBEN Fonds-Stands — faktisch 55 % alle 20 s, unabhaengig
    // davon, ob die Corp ueberhaupt produzierte.
    //
    //   0. RESERVE abziehen: naechster Unlock + naechste Blaupausen-Stufe +
    //      Betriebskapital (expenses x WORKING_CAPITAL_SEC). Nur darueber wird
    //      ueberhaupt Geld ausgegeben.
    //   1. Kette bauen (stage0, dann weitere Stufen) — reservierter Vorrang.
    //   2. Unlocks/APIs nach Prioritaet.
    //   3. GATE: erst wenn irgendeine Stadt produktionsbereit ist (Lager + Personal),
    //      werden Wachstum, Boost, AdVert und Upgrades ueberhaupt angefasst.
    //   4. Staedte -> Lager -> Buero -> Boost -> AdVert -> Corp-Upgrades.
    //   5. Investment-Runde annehmen (Fortschritts-Gate), danach Boerse/Bribes.

    // --- Startpruefung: sind alle Branchennamen der Blaupause der Engine bekannt? ---
    // Ein einziger Tippfehler hat die Kette frueher DAUERHAFT stehen lassen, ohne
    // eine Zeile Log. Deshalb wird der Bauplan jetzt EINMAL beim Start gegen die
    // Engine gehalten. Das kostet ein paar Aufrufe und spart im Zweifel Stunden.
    if (state.bp && state.bp !== "ADOPT" && BLUEPRINTS[state.bp]) {
        const unbekannt = [];
        for (const st of BLUEPRINTS[state.bp].stages) {
            const d = await industryData(ns, st.ind);
            if (!d) unbekannt.push(st.ind);
        }
        if (unbekannt.length) {
            ns.print("  [Bauplan] FEHLER: Diese Branchennamen kennt die Engine nicht:");
            for (const u of unbekannt) ns.print("  [Bauplan]   -> \"" + u + "\"");
            ns.print("  [Bauplan] Die Kette bleibt beim ersten davon stehen. BLUEPRINTS pruefen.");
        } else {
            ns.print("  [Bauplan] " + BLUEPRINTS[state.bp].stages.length + " Stufen, alle Branchennamen gueltig.");
        }
    }

    while (true) {
        try {
            const snap = await corpSnapshot(ns);
            if (snap) {
                // Betriebskapital: ohne Fonds kauft Smart Supply keine Eingangs-
                // materialien -> Produktion steht. revenue/expenses sind pro Sekunde.
                const workCap = Math.max(0, snap.expenses || 0) * WORKING_CAPITAL_SEC;

                // v0.22: Branchen-Landkarte EINMAL je Runde. Alle Stufen-Vergleiche
                // unten laufen darueber statt ueber Divisionsnamen.
                const branchen = await branchenKarte(ns, snap);
                // v0.24: Stand der Kriegskasse fuer die naechste Division. Wird im
                // Stufen-Block gesetzt und unten im Snapshot veroeffentlicht, damit
                // DIAG sagen kann, wieviel noch fehlt — ohne das Corp-Log zu lesen.
                let kriegskasse = null;

                // --- 1a) stage0 nachholen (hoechster Vorrang: ohne Division gibt es nichts) ---
                if (state.bp && state.bp !== "ADOPT") {
                    const stage0 = BLUEPRINTS[state.bp].stages[0];
                    if (snap.divisions.length === 0 && !branchen.has(stage0.ind)) {
                        const data = await industryData(ns, stage0.ind);
                        if (data && data.startingCost >= 0 && snap.funds >= data.startingCost) {
                            const ok = await createDivision(ns, stage0.ind, stage0.ind);
                            if (ok) ns.print(`Nachgeholt: Division "${stage0.ind}" steht jetzt.`);
                        } else if (data) {
                            ns.print(`Warte auf Geld fuer "${stage0.ind}": ${formatMoney(snap.funds)} von ${formatMoney(data.startingCost)}.`);
                        }
                    }
                }

                // --- 2) Unlocks/APIs sicherstellen + Reserve bilden ---
                const ensured = await ensureUnlocks(ns, snap.funds);
                const unlocks = ensured.status;
                const unlockReserve = ensured.reserve;

                // --- 1b) NAECHSTE STUFE der Kette (Chem/Tabak). Bedingung: Vorstufe
                //     existiert mit >= 3 Staedten, und die Kosten sind OHNE Unlock-
                //     Reserve und OHNE Betriebskapital gedeckt.
                if (state.bp && state.bp !== "ADOPT") {
                    const stages = BLUEPRINTS[state.bp].stages;
                    for (let si = 1; si < stages.length; si++) {
                        const st = stages[si];
                        // v0.22: Branche entscheidet, nicht der Name. Eine bereits
                        // besetzte Branche wird uebersprungen, egal wie die Division
                        // heisst ("Tabacco" erfuellt die Stufe "Tabak").
                        if (branchen.has(st.ind)) continue;
                        const prev = stages[si - 1];
                        // Der ECHTE Name der Vorstufe — divisionCities braucht ihn.
                        const prevName = branchen.get(prev.ind);
                        if (!prevName) break;
                        const prevCities = [await divisionCities(ns, prevName)].flat();
                        const data = await industryData(ns, st.ind);
                        const need = data ? data.startingCost * STAGE_COST_MARGIN : Infinity;

                        // --- REIFETOR (v0.40), Begruendung bei STAGE_MIN_PROFIT_SEC ---
                        if (prevCities.length < CITIES.length) {
                            ns.print(`  [Stufe] "${st.ind}" wartet: ${prevName} steht in `
                                + `${prevCities.length}/${CITIES.length} Staedten.`);
                            break;
                        }
                        const gewinnSek = (snap.revenue || 0) - (snap.expenses || 0);
                        const profitOk = gewinnSek >= STAGE_MIN_PROFIT_SEC;
                        const geldStaut = isFinite(need) && snap.funds >= need * STAGE_IDLE_FUNDS_MULT;
                        if (!profitOk && !geldStaut) {
                            ns.print(`  [Stufe] "${st.ind}" wartet: Gewinn ${formatMoney(gewinnSek)}/s `
                                + `unter ${formatMoney(STAGE_MIN_PROFIT_SEC)}/s, und die Fonds `
                                + `(${formatMoney(snap.funds)}) liegen unter dem ${STAGE_IDLE_FUNDS_MULT}-fachen `
                                + `der Startkosten. Erst ${prevName} vertiefen.`);
                            break;
                        }
                        const habe = snap.funds - unlockReserve - workCap;
                        if (data && habe >= need) {
                            // v0.24: Geld ist da. Ob GEGRUENDET wird, entscheidet der
                            // Schalter — siehe AUTO_NEUE_STUFE. Ohne ihn wird nur
                            // gemeldet; die Ruecklage bleibt stehen, damit der
                            // Spieler frei waehlen kann, was er anlegt.
                            if (AUTO_NEUE_STUFE) {
                                // v0.22: NAME = BRANCHE. Damit heissen alle kuenftig
                                // angelegten Divisionen wie ihre Branche, und der
                                // Namensvergleich kann nie wieder auseinanderlaufen.
                                const ok = await createDivision(ns, st.ind, st.ind);
                                ns.print(ok ? `Stufe "${st.ind}" angelegt (${formatMoney(data.startingCost)}).`
                                            : `Stufe "${st.ind}" liess sich nicht anlegen — naechste Runde.`);
                            } else {
                                kriegskasse = { ind: st.ind, need, habe, bereit: true };
                                ns.print(`  [Kriegskasse] BEREIT: ${formatMoney(habe)} frei, `
                                    + `"${st.ind}" kostet ${formatMoney(data.startingCost)}. `
                                    + `Gruendung liegt bei dir (AUTO_NEUE_STUFE=false).`);
                            }
                        } else if (data) {
                            kriegskasse = { ind: st.ind, need, habe, bereit: false };
                        } else {
                            // data === null heisst: die Engine kennt diesen Branchennamen
                            // NICHT. Bis v0.26 brach die Schleife hier still ab, und die
                            // Kette stand dauerhaft — ohne eine einzige Zeile im Log. Genau
                            // so blieb der Schreibfehler "Water" unsichtbar.
                            ns.print("  [Stufe] FEHLER: Branche \"" + st.ind + "\" ist der Engine unbekannt.");
                            ns.print("  [Stufe] Die Kette steht hier. Schreibweise in BLUEPRINTS pruefen.");
                        }
                        break;   // hoechstens eine neue Stufe je Runde
                    }
                }

                // --- 0) RESERVE + EIN Rundenbudget ---
                // =========================================================
                // v0.22 BUGFIX — DIE STUFEN-RESERVE HAT DIE CORP ERSTICKT
                // =========================================================
                // Livebeleg, ueber Stunden in JEDER Runde identisch:
                //   [Reserve] $80.59b = Unlock $0 + naechste Stufe $80.50b
                //             + Betriebskapital $93.80m -> Budget dieser Runde $0.
                //   [Status]  Fonds $59.06b | Profit/s $1.84m | Divisionen: Agro, Tabacco
                //   [Tabacco] Verkauf: — @ TA.II
                //
                // Die fehlende Blaupausen-Stufe ist Chemical (IndustryData.ts:39,
                // startingCost 70e9) x STAGE_COST_MARGIN 1.15 = 80.5 Mrd. Die Fonds
                // standen bei 59 Mrd. Damit war availFunds dauerhaft 0, das
                // Rundenbudget 0 — und CORP kaufte NICHTS mehr: keine Lager, kein
                // Personal, keine Upgrades, keine Boost-Materialien und vor allem
                // KEINE PRODUKTE. Genau deshalb verkauft die Tabak-Division nichts:
                // Tobacco ist eine Produkt-Industrie, und makeProduct zieht aus
                // demselben Budget.
                //
                // Die Sperre haelt sich selbst: ohne Ausbau bleibt der Profit bei
                // 1.8 Mio/s, und bei dem Tempo braucht die Corp Stunden bis zu den
                // 80.5 Mrd. — in denen sie nicht waechst. Dieselbe Bauart wie die
                // HOLD-Reserve in BANK v3.0, die dort mit HOLD_MAX_FRAC = 0.50
                // entschaerft wurde: eine Ruecklage fuer einen Grossposten darf nie
                // den laufenden Betrieb stilllegen, aus dem sie bezahlt wird.
                //
                // Gedeckelt wird NUR die Stufen-Reserve. Unlock-Reserve und
                // Betriebskapital bleiben unangetastet: ohne Betriebskapital kauft
                // Smart Supply keine Eingangsmaterialien und die Produktion steht.
                const stageWunsch = await nextStageCost(ns, state, snap, branchen);
                const freiFuerStufe = Math.max(0, snap.funds - unlockReserve - workCap);
                // v0.39 — HIER STAND EIN FEHLER VON MIR, UND ZWAR EINER, DEN
                // node --check NICHT FINDET: an dieser Stelle wurde divSummen
                // abgefragt, das erst rund siebzig Zeilen SPAETER deklariert wird.
                // In JavaScript ist das kein Tippfehler, sondern ein
                // ReferenceError zur Laufzeit ("Cannot access before
                // initialization") — die Syntaxpruefung geht sauber durch, und
                // der Daemon stirbt beim ersten Durchlauf.
                //
                // Die Aenderung war ausserdem UNNOETIG: der Buero-Topf unten
                // rechnet mit funds - unlockReserve - workCap - budgetStart und
                // laesst die Stufen-Reserve dabei voellig aussen vor. Sie
                // verkleinert nur das RUNDENBUDGET — was dem Ansparen des Topfes
                // sogar hilft. Also bleibt sie, wie sie war.
                //
                // Ob ueberhaupt eine naechste Industrie gegruendet werden darf,
                // ist eine andere Frage und gehoert ins Reifetor (6 Staedte +
                // Gewinnschwelle), nicht in die Reservenrechnung.
                const stageReserve = Math.min(stageWunsch, freiFuerStufe * STAGE_RESERVE_MAX_FRAC);
                const stageGedeckelt = stageWunsch > stageReserve + 1;
                const reserve = unlockReserve + stageReserve + workCap;
                const availFunds = Math.max(0, snap.funds - reserve);
                const budgetStart = Math.floor(availFunds * SPEND_FRACTION);
                const budget = { remaining: budgetStart };
                if (reserve > 0) {
                    ns.print(`  [Reserve] ${formatMoney(reserve)} = Unlock ${formatMoney(unlockReserve)}` +
                        ` + naechste Stufe ${formatMoney(stageReserve)} + Betriebskapital ${formatMoney(workCap)}` +
                        ` -> Budget dieser Runde ${formatMoney(budget.remaining)}.`);
                    if (stageGedeckelt) {
                        ns.print(`  [Reserve] Stufen-Ruecklage gedeckelt: gewuenscht ${formatMoney(stageWunsch)}, `
                            + `zurueckgelegt ${formatMoney(stageReserve)} (${Math.round(STAGE_RESERVE_MAX_FRAC * 100)} % `
                            + `der freien Fonds). Der Rest finanziert den Ausbau — sonst waechst nichts, `
                            + `aus dem die Stufe je bezahlt werden koennte.`);
                    }
                }

                // --- Investoren-Angebot (nur solange Runden offen sind) ---
                const offer = snap.public ? null : await investmentOffer(ns);
                const invRounds = investedRounds(offer, snap);

                let researchWantDiv = null;
                const consts = await corpConstants(ns);

                // v0.21 BUGFIX — ADOPT. Bisher stand die GESAMTE Divisions-Schleife
                // unter `if (state.bp !== "ADOPT")`. Traf CORP beim ersten Lauf auf
                // eine bestehende Corp, wurde bp auf "ADOPT" gesetzt — und der Daemon
                // tat danach NICHTS mehr: kein Personal, kein Smart Supply, kein
                // Verkauf, kein Staedte-Ausbau. Der Upgrade-Kauf lag in v0.20 aber
                // AUSSERHALB dieses Gates. Ergebnis: die Corp kaufte Upgrades und
                // sonst nichts — genau das gemeldete Symptom.
                // Jetzt wird eine Arbeitsliste gebaut: Blaupausen-Stufen (Branche aus
                // der Stufe, kein Extra-Read) PLUS alle uebrigen Divisionen (Branche
                // aus dem Engine-Feld Division.industry). Fremde Divisionen werden
                // damit ebenfalls betrieben — eine Division, die nicht produziert,
                // ist reiner Kostenblock.
                const runList = [];
                const known = new Set();
                // v0.24: ueber die BRANCHE, nicht ueber stage.name. Dieselbe Stelle,
                // dieselbe Ursache wie beim Export-Bug: die Stufe heisst "Tabak",
                // die Division "Tabacco" — der Vergleich griff also nie, und jede
                // Blaupausen-Division fiel in den adopted-Zweig darunter. Das war
                // nicht kaputt (der Rueckfall liest die Branche korrekt), aber es
                // kostete je Runde und Division einen ueberfluessigen Engine-Aufruf
                // und liess den Namensvergleich stehen, der schon zweimal Fehler
                // erzeugt hat. branchen liegt aus dieser Runde bereits vor.
                if (state.bp && state.bp !== "ADOPT" && BLUEPRINTS[state.bp]) {
                    for (const stage of BLUEPRINTS[state.bp].stages) {
                        const echterName = branchen.get(stage.ind);
                        if (!echterName) continue;          // Stufe noch nicht gebaut
                        known.add(echterName);
                        runList.push({ div: echterName, ind: stage.ind });
                    }
                }
                for (const d of snap.divisions) {
                    if (known.has(d)) continue;
                    const ind = await divisionIndustry(ns, d);
                    if (ind) runList.push({ div: d, ind, adopted: true });
                    else ns.print(`  [${d}] Branche nicht lesbar — Division wird uebersprungen.`);
                }

                // --- 3/4) Divisionen betreiben; Staedte-Ausbau aus dem Budget ---
                const ownDivs = [];
                const citiesByDiv = {};
                const isProduct = {};
                const dataByDiv = {};
                let anyReady = false;          // Gate: irgendwo Lager + Personal?
                let boostOk = true;            // Boost-Ziel ueberall erreicht?
                let boostChecked = false;
                const rpByDiv = {};
                const divSummen = {};          // v0.37: je Division die Kennzahlen
                {
                    for (const item of runList) {
                        const div = item.div;
                        const data = await industryData(ns, item.ind);
                        if (!data) continue;

                        // Schrittweiser Staedte-Ausbau (max. 1 neue Stadt/Runde) — aus dem Budget
                        let cities = [await divisionCities(ns, div)].flat();
                        if (unlocks["Warehouse API"] === true) {
                            cities = await ensureCities(ns, div, budget, consts);
                        }

                        // Market-TA.II einmal je Division pruefen (gilt fuer alle Staedte)
                        const ta2 = await cHasResearched(ns, div, "Market-TA.II");
                        // Forschungspunkte EINMAL lesen und weitergeben (statt drei Reads)
                        const rp = await divisionResearchPoints(ns, div);
                        rpByDiv[div] = rp;

                        // v0.21 BUGFIX: hier stand "data.product" — dieses Feld liefert der
                        // Wrapper industryData() NICHT (er mappt makesProducts). Der Ausdruck
                        // war immer undefined: die Produkt-Engine aus v0.19 lief NIE, und
                        // researchStep bekam dauerhaft isProduct=false, hat also die
                        // Market-TA-Kette fuer Produktdivisionen nie gekauft.
                        const makesProducts = data.makesProducts === true;
                        isProduct[div] = makesProducts;
                        dataByDiv[div] = data;

                        try { await researchStep(ns, div, makesProducts, rp); }
                        catch (e) { ns.print(`  [${div}] Research: ` + e); }
                        if (makesProducts) {
                            try { researchWantDiv = (await productStep(ns, div, snap.funds, cities, ta2)) || researchWantDiv; }
                            catch (e) { ns.print(`  [${div}] Produkte: ` + e); }
                        }

                        // Jede Stadt betreiben (Personal, Smart Supply, Verkauf, TA.II)
                        // v0.37: je Division aufsummieren, was die Staedte melden.
                        const sum = { emp: 0, empMax: 0, wh: 0, whUsed: 0, moral: 0, energie: 0, n: 0, bereit: 0, oCost: null };
                        for (const city of cities) {
                            const r = await runDivisionCity(ns, div, data, unlocks, snap.funds, city, ta2);
                            if (r && r.ready) { anyReady = true; sum.bereit++; }
                            if (r) {
                                sum.emp += r.emp || 0;
                                sum.empMax += r.empMax || 0;
                                sum.wh += r.whSize || 0;
                                sum.whUsed += r.whUsed || 0;
                                sum.moral += r.moral || 0;
                                sum.energie += r.energie || 0;
                                // v0.39: der GUENSTIGSTE Ausbau ist der, auf den gespart wird.
                                if (typeof r.oCost === "number" && r.oCost >= 0
                                    && (sum.oCost === null || r.oCost < sum.oCost)) sum.oCost = r.oCost;
                                sum.n++;
                            }
                        }
                        divSummen[div] = {
                            ind: item.ind,
                            staedte: cities.length,
                            bereit: sum.bereit,
                            emp: sum.emp,
                            empMax: sum.empMax,
                            wh: Math.round(sum.wh),
                            whUsed: Math.round(sum.whUsed),
                            moral: sum.n ? Math.round(sum.moral / sum.n) : 0,
                            energie: sum.n ? Math.round(sum.energie / sum.n) : 0,
                            rp: Math.round(rp),
                            ta2: ta2 === true,
                            produkte: makesProducts,
                            oCost: sum.oCost,          // v0.38: -1 bedeutet "Abfrage fehlgeschlagen"
                        };
                        ns.print(`  [${div}] aktiv in ${cities.length} Stadt/Staedten | Verkauf: ${data.produced.join(", ") || "—"} @ ${ta2 ? "TA.II (optimal)" : "MP"} | RP ${Math.round(rp)}`);

                        // Auto-Forschung (organisch; Punkte-Zukauf meldet HASHNET)
                        if (await autoResearch(ns, div, rp)) researchWantDiv = div;

                        ownDivs.push(div);
                        citiesByDiv[div] = cities;
                    }
                }

                // --- 3) GATE. Ohne produktionsbereite Stadt wird NICHTS gekauft:
                //     ein Upgrade ohne Produktion hat keinen Nutzen, der es tragen
                //     koennte. Genau hier lief v0.20 ins Leere.
                if (!anyReady) {
                    ns.print(`  [Gate] Keine produktionsbereite Stadt (Lager + Personal) — Wachstum/Boost/AdVert/Upgrades ausgesetzt.`);
                } else if (unlocks["Warehouse API"] !== true) {
                    ns.print(`  [Gate] Warehouse API fehlt — Wachstum/Boost ausgesetzt, es wird darauf gespart.`);
                } else {
                    // 4a) Lager + Buero
                    // v0.39: der Buero-Topf ist alles, was nach Unlock-Reserve,
                    // Betriebskapital und dem Rundenbudget noch dasteht. So kann
                    // sich der grosse Posten aufbauen, ohne dass Lager, Boost und
                    // AdVert im selben Zug leer ausgehen.
                    // v0.43: heisst jetzt Grossposten-Topf, weil sich LAGER und
                    // Buero ihn teilen. Beide sind Posten, deren Preis mit 1.07^n
                    // bzw. 1.09^n waechst und die das Rundenbudget irgendwann
                    // strukturell uebersteigen - genau dafuer ist er da.
                    const grossTopf = { remaining: Math.max(0,
                        snap.funds - unlockReserve - workCap - budgetStart) };
                    const bueroOffen = Object.keys(divSummen).some(d =>
                        typeof divSummen[d].oCost === "number" && divSummen[d].oCost >= 0);
                    if (bueroOffen) {
                        ns.print(`  [Grossposten-Topf] ${formatMoney(grossTopf.remaining)} verfuegbar.`);
                    }
                    // =========================================================
                    // v0.45 — DIE VOLLE RUNDE AN EINE DIVISION
                    // =========================================================
                    // Hier stand `growWithBudget(ns, ownDivs, ...)` — alle
                    // Divisionen der Reihe nach gegen EIN Budget. Wer vorne
                    // stand, wurde satt; die hinteren fanden einen leeren Topf.
                    // Jetzt bekommt die SCHWAECHSTE alles, und naechste Runde
                    // die dann schwaechste. So kommt jede dran, und die
                    // Schwellenpreise (Buero $4,36 Mrd. am Stueck) sind
                    // ueberhaupt erst erreichbar.
                    const reihe = rangfolge(ownDivs, divSummen);
                    const dran = reihe.length ? [reihe[0]] : [];
                    if (dran.length) {
                        const z = divSummen[dran[0]] || {};
                        const pro = (z.staedte > 0) ? Math.round((z.empMax || 0) / z.staedte) : 0;
                        ns.print(`  [Reihum] ${dran[0]} ist dran `
                            + `(${z.staedte || 0} Staedte, ${pro} Plaetze je Stadt, `
                            + `Lager ${fmtNum(z.wh || 0)}) — bekommt ${formatMoney(budget.remaining)}.`);
                        chronik(ns, "CORP", "reihum", dran[0], "dran",
                            `${z.staedte || 0} Staedte, ${pro} Plaetze/Stadt, `
                            + `${formatMoney(budget.remaining)}`);
                        if (reihe.length > 1) {
                            ns.print(`  [Reihum] danach: ${reihe.slice(1, 4).join(", ")}`
                                + `${reihe.length > 4 ? " ..." : ""}`);
                        }
                    }
                    await growWithBudget(ns, dran, citiesByDiv, budget, grossTopf);

                    // 4b) Boost-Material (Produktions-Multiplikatoren)
                    // v0.23: EIN Topf fuer alle Lager, VOR der Schleife gebildet.
                    // Sonst nimmt sich das erste Lager alles: buyBoost wird je Stadt
                    // gerufen, und bei 18 Lagern gingen 17 leer aus. Die restlichen
                    // 25 % bleiben fuer AdVert, Upgrades und Produkte, die spaeter in
                    // derselben Runde aus demselben Budget zahlen. Die Produktions-
                    // kosten sind bereits vorher abgezogen — sie stecken als
                    // Betriebskapital (expenses * WORKING_CAPITAL_SEC) in der Reserve,
                    // aus der das Rundenbudget ueberhaupt erst entsteht.
                    // v0.45: nur die Lager der Division, die dran ist. Boost-Material
                    // bleibt liegen, wenn es einmal gekauft ist — eine Division
                    // verliert also nichts, wenn sie eine Runde aussetzt.
                    const lagerGesamt = dran.reduce((a, d) => a + ((citiesByDiv[d] || []).length), 0);
                    const boostTopf = Math.floor(Math.max(0, budget.remaining) * BOOST_ROUND_FRAC);
                    const boostProLager = lagerGesamt > 0 ? Math.floor(boostTopf / lagerGesamt) : 0;
                    if (boostProLager > 0) {
                        ns.print(`  [Boost] Topf ${formatMoney(boostTopf)} (${Math.round(BOOST_ROUND_FRAC * 100)} % des Budgets) `
                            + `auf ${lagerGesamt} Lager -> ${formatMoney(boostProLager)} je Lager.`);
                    }
                    for (const div of dran) {
                        const data = dataByDiv[div];
                        for (const city of (citiesByDiv[div] || [])) {
                            const r = await buyBoost(ns, div, data, city, budget, boostProLager);
                            boostChecked = true;
                            if (r && r.satisfied === false) boostOk = false;
                        }
                    }
                    if (!boostChecked) boostOk = false;

                    // =========================================================
                    // 4b2) v0.33 — BREITE VOR TIEFE. Solange einer Division
                    //      Staedte fehlen, bekommen Werbung und Upgrades nur
                    //      noch den Rest.
                    // =========================================================
                    // Der Staedte-Ausbau laeuft zwar zuerst (ensureCities oben),
                    // kauft aber hoechstens EINE Stadt je Runde und bricht ganz
                    // ab, wenn eine bestehende Stadt nicht einsatzbereit ist.
                    // Das uebrige Budget floss danach trotzdem in Werbung und
                    // Upgrades - genau das war zu sehen: die Firma kaufte
                    // Verbesserungen, bevor die erste Division ueberhaupt in
                    // allen Staedten stand. Eine neue Stadt bringt eigene
                    // Produktion und eigenen Umsatz; ein Upgrade verbessert nur,
                    // was schon da ist.
                    //
                    // Das Geld wird NICHT reserviert, sondern hier
                    // zurueckgehalten: reserviert wuerde es auch dem
                    // Staedtekauf fehlen, denn der zahlt aus demselben Budget.
                    // Zurueckgehalten bleibt es in den Fonds und steht in der
                    // naechsten Runde fuer die naechste Stadt bereit.
                    //
                    // MIT DECKEL: hoechstens CITY_HOLD_MAX_FRAC des Budgets.
                    // Bliebe eine Stadt dauerhaft nicht einsatzbereit (Moral,
                    // Personal), wuerde ein ungedeckelter Rueckhalt jeden
                    // weiteren Kauf fuer immer sperren - dieselbe Falle wie die
                    // Reset-Phase in BANK und die PRE_RESET-Pause der Queen.
                    const fehlendeStaedte = ownDivs.reduce(
                        (a, d) => a + Math.max(0, CITIES.length - ((citiesByDiv[d] || []).length)), 0);
                    if (fehlendeStaedte > 0 && budget.remaining > 0) {
                        const bedarf = fehlendeStaedte * (consts.officeInitialCost + consts.warehouseInitialCost);
                        const halten = Math.min(bedarf, budget.remaining * CITY_HOLD_MAX_FRAC);
                        budget.remaining = Math.max(0, budget.remaining - halten);
                        ns.print(`  [Ausbau] ${fehlendeStaedte} Stadt/Staedte offen — ${formatMoney(halten)} `
                            + `zurueckgehalten, ${formatMoney(budget.remaining)} bleiben fuer Werbung und Upgrades.`);
                    }

                    // 4c) AdVert (Leiter fuer Produktdivisionen, 1 Kauf fuer Material)
                    // v0.45: AdVert gehoert zur Runde der Division, die dran ist.
                    await advertStep(ns, dran, isProduct, budget);

                    // 4d) Corp-Upgrades — LETZTER Posten, und nur die fuer diese
                    //     Phase erlaubten (Runde 1: nur Smart Storage).
                    const allowed = allowedUpgrades(invRounds, ownDivs.some(d => isProduct[d]));
                    // v0.45: Was die Division nicht ausgeben konnte, steht den
                    // Corp-Upgrades zur Verfuegung — zusammen mit dem
                    // Grossposten-Topf. Sonst kaemen sie nie zum Zug: die Runde
                    // gehoert ja einer Division, und ihre Preise wachsen mit
                    // 1.06^n bis 1.07^n in dieselbe Schwellenfalle.
                    await corpUpgradeStep(ns, budget, allowed, grossTopf);
                }

                // --- 5) Investment-Runde annehmen (Fortschritts-Gate) ---
                // Bezugsdivisionen des Investment-Gates: im Blaupausen-Fall Stufe 0/1,
                // im ADOPT-Fall die erste/zweite betriebene Division.
                const bpOk = !!(state.bp && state.bp !== "ADOPT" && BLUEPRINTS[state.bp]);
                const stage0Name = bpOk ? BLUEPRINTS[state.bp].stages[0].name
                    : (runList[0] ? runList[0].div : null);
                const suppName = bpOk ? (BLUEPRINTS[state.bp].stages[1] ? BLUEPRINTS[state.bp].stages[1].name : null)
                    : (runList[1] ? runList[1].div : null);
                try {
                    await investStep(ns, snap, offer, {
                        cities: stage0Name ? ((citiesByDiv[stage0Name] || []).length) : 0,
                        boostOk: boostOk && boostChecked,
                        rpMain: stage0Name ? (rpByDiv[stage0Name] || 0) : 0,
                        rpSupp: suppName ? (rpByDiv[suppName] || 0) : 0,
                        hasSupport: !!(suppName && snap.divisions.includes(suppName)),
                    });
                } catch (e) { ns.print("  [Invest] " + e); }

                // --- Boerse + Bribes (frischer Snapshot — Fonds haben sich geaendert) ---
                const snap2 = (await corpSnapshot(ns)) || snap;
                const offer2 = snap2.public ? null : await investmentOffer(ns);
                // v0.32: Reifezustand mitgeben. nextStageCost liefert 0, wenn
                // keine Blaupausen-Stufe mehr offen ist - genau das ist das
                // Signal "strukturell fertig gebaut".
                let stufeOffen = true;
                try { stufeOffen = (await nextStageCost(ns, state, snap2, null)) > 0; }
                catch (e) { stufeOffen = true; }   // unklar -> nicht ernten
                // v0.41: VOR stockStep. Das Fenster entscheidet ueber Emission
                // und Dividende; stockStep muss seinen Zustand schon kennen,
                // sonst ueberschreibt es die Fenster-Dividende einmal pro Runde.
                // Bueros + Lager: je Division und Stadt eines von beidem, also
                // das Doppelte der Standortzahl — so rechnet die Engine in
                // numberOfOfficesAndWarehouses.
                const standorte = ownDivs.reduce((a, d) => a + ((citiesByDiv[d] || []).length), 0);
                let fenster;
                try { fenster = await fensterStep(ns, snap2, standorte * 2); }
                catch (e) { fenster = null; ns.print("  [Fenster] Fehler: " + e); }

                await stockStep(ns, snap2, offer2, reserve, stufeOffen);
                await bribeStep(ns, snap2, reserve);

                // EXPORT-Verkabelung (idempotent; Fehler "existiert" egal).
                // v0.24: ownDivs + dataByDiv statt snap.divisions. Die Routen werden
                // jetzt aus den Branchendaten abgeleitet (siehe exportStep), und
                // dataByDiv liegt aus dieser Runde bereits vor — kein Extra-Aufruf.
                try { await exportStep(ns, ownDivs, dataByDiv); } catch (e) { /* still */ }

                // Bedarf an HASHNET melden (Port 8) — Fonds-Stand + Forschungswunsch
                publishHashNeed(ns, "CORP", {
                    funds: snap2.funds,
                    researchWant: researchWantDiv ? 1 : 0,
                    researchDiv: researchWantDiv || "",
                });

                // Aktien-Zustand + Absichten an die BANK (Port 31).
                {
                    const profitPerSec = (snap2.revenue || 0) - (snap2.expenses || 0);
                    const cd = Math.max(snap2.issueCooldown || 0, 0);
                    // v0.44: darf den Takt nie reissen — es ist nur eine Anzeige.
                    let upLage = null;
                    try { upLage = await upgradeLage(ns); } catch (e) { upLage = null; }
                    publishCorpInfo(ns, {
                        funds: snap2.funds || 0,
                        ts: Date.now(),
                        public: snap2.public === true,
                        sharePrice: snap2.sharePrice || 0,
                        issuedShares: snap2.issuedShares || 0,
                        numShares: snap2.numShares || 0,
                        totalShares: snap2.totalShares || 0,
                        investorShares: snap2.investorShares || 0,
                        sellCooldown: cd,
                        profitPerSec,
                        dividendRate: snap2.dividendRate || 0,
                        valuation: snap2.valuation || 0,
                        floorOwnFrac: FLOOR_OWN_FRAC,
                        // v0.21: Phasen-Kennzahlen fuer BANK/DASHBOARD (und Schritt D:
                        // DIAG kann daraus einen CORP-Abschnitt bauen, ohne das Tail zu lesen).
                        investRound: investedRounds(offer2, snap2),
                        maxInvestRounds: MAX_INVEST_ROUNDS,
                        divisions: (snap2.divisions || []).length,
                        cities: ownDivs.reduce((a, d) => a + ((citiesByDiv[d] || []).length), 0),
                        reserve,
                        // v0.24: null = Kette vollstaendig (nichts mehr anzusparen).
                        kriegskasse,
                        autoStufe: AUTO_NEUE_STUFE,
                        // v0.44: Stufe und naechster Preis je Corp-Upgrade.
                        // Bis hierher war NICHT feststellbar, ob je eines gekauft
                        // wurde. Besonders wichtig fuer Project Insight: es ist der
                        // einzige Forschungshebel ohne Wurzel (Division.ts:457) und
                        // kostet ab $5 Mrd — mehr, als im Rundenbudget je uebrig war.
                        ups: upLage,
                        // v0.37: je Division eine Zeile Kennzahlen. Klein gehalten
                        // (kurze Schluessel, gerundete Zahlen) — der Port soll nicht
                        // derselbe Sammelplatz werden, den INFO gerade losgeworden ist.
                        divs: Object.keys(divSummen).map(d => ({ d, ...divSummen[d] })),
                        maxStaedte: CITIES.length,
                        // v0.22: die Reserve AUFGESCHLUESSELT. Als eine Zahl war nicht
                        // erkennbar, WARUM das Rundenbudget null ist — und genau das ist
                        // der Verdacht: liegt die naechste Blaupausen-Stufe (Startkosten
                        // einer Industrie, 20 bis 200 Mrd.) ueber den Fonds, wird
                        // availFunds null, das Budget null, und es wird gar nichts mehr
                        // gekauft — auch kein Lager, kein Personal, kein Upgrade. Dann
                        // waechst die Corp nicht mehr und erreicht die Reserve nie.
                        reserveParts: {
                            unlock: Math.round(unlockReserve || 0),
                            stage:  Math.round(stageReserve || 0),
                            workCap: Math.round(workCap || 0),
                        },
                        // v0.23: budget.remaining ist der REST nach allen Kaeufen —
                        // jeder Schritt zieht davon ab. Als einzige Zahl war das
                        // irrefuehrend: eine Corp, die ihr Budget vollstaendig
                        // ausgibt, meldete "Rundenbudget $7.4k" und sah damit aus
                        // wie eine, die stillsteht. Livebeleg: Fonds $4.25b, Reserve
                        // $494.89m -> Startbudget $1.88b, gemeldet wurden $7.4k.
                        // Jetzt beide Zahlen; die Stillstands-Pruefung in DIAG haengt
                        // am START, nicht am Rest.
                        budgetStart,
                        budget: budget.remaining,
                        ready: anyReady ? 1 : 0,
                        buyback: {
                            want: (snap2.issuedShares || 0) > 0 ? 1 : 0,
                            chunk: BUYBACK_CHUNK,
                        },
                        // v0.41: der Fensterzustand. BANK kauft NUR bei offen=1 —
                        // ausserhalb waere jeder Rueckkauf zum Hoechstkurs.
                        fenster,
                    });
                }

                const own = snap2.totalShares > 0 ? (snap2.numShares / snap2.totalShares * 100) : 100;
                const pps = (snap2.revenue || 0) - (snap2.expenses || 0);
                ns.print(`[Status] Fonds ${formatMoney(snap2.funds)} | Profit/s ${formatMoney(pps)} | Runde ${investedRounds(offer2, snap2)}/${MAX_INVEST_ROUNDS} | Divisionen: ${snap2.divisions.join(", ") || "—"} | ${snap2.public ? `BOERSE: ${own.toFixed(1)}% eigen, Div ${(snap2.dividendRate * 100).toFixed(1)}%` : "privat"} | Val ${formatMoney(snap2.valuation)}`);
            }
        } catch (e) {
            ns.print("[Fehler] " + e);
        }
        await ns.sleep(LOOP_MS * 4);
    }
}