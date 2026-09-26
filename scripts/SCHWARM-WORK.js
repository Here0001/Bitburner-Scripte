/**
 * SCHWARM-WORK.js — v5.8
 *
 * v5.8 — SPENDEN FUER BANK v5.17. Antrag mit prio 200 (nach den Gang-
 *   Augs, vor der Gang-Ausruestung), gedeckelt nur noch auf den Spenden-Topf -
 *   die Haelfte des freien Geldes zieht BANK selbst ab. Die Freigabe wird
 *   ZUERST gelesen: bis v5.7 zog WORK einen bewilligten Antrag zurueck, wenn
 *   das gemeldete "frei" (nach Abzug eben dieser Freigabe) unter 1 Mio. fiel.
 *   Jede Spende steht mit exaktem Betrag im Handlungsbuch (Topf other).
 *   Nachtrag (Gegenpruefung): Zielwechsel und abgelehnte Spende melden den
 *   Antrag UNGENUTZT ab (BANK bucht nicht); aus derselben Veroeffentlichung
 *   der BANK wird nie zweimal gespendet (stand BANK, spendete WORK sonst alle
 *   20 s erneut aus der alten Freigabe).
 *   Nachtrag 3: eine NEUE id je Spende (donate:<Faktion>#<lauf>-<n>). Mit
 *   derselben id verschmolzen Abmeldung und Neuantrag im selben BANK-
 *   Durchgang, und eine verlorene Abmeldung liess dieselbe Freigabe stehen.
 *
 * v5.7 — WAEHREND EINES GRAFTINGS NUR DEN ARBEITSPLATZ SCHONEN.
 *   Frage des Spielers: "stellt work die komplette arbeit ein wenn gecraftet
 *   wird? so kommen ja keine jobs rein". Genau so war es: der Schutz sprang
 *   mit continue ueber ALLES hinweg - auch Bewerbungen, Einladungen,
 *   Stadt-Fraktionen, Export-Bonus, Bladeburner-Beitritt, Gang-Gruendung.
 *   Keins davon beruehrt den Arbeitsplatz. Jetzt steigt WORK erst VOR
 *   Phase 0 aus; dort laufen nur noch der reine Beitritt und die reine
 *   Gruendung (ohne Training bzw. Verbrechen), alle 5 min.
 *   ENGINE: finishWork rufen in der Singularity-API nur purchaseProgram,
 *   stopAction, createProgram, commitCrime. Reisen bricht einen Graft nicht
 *   ab (Person.ts travel) - vom Spieler am 24.09.2026 selbst getestet.
 *
 * v5.6 — KEINE ANFORDERUNGEN MEHR FUER BLADEBURNER UND GANGS.
 *   Auf Wunsch des Spielers. Beide gehoeren jetzt der QUEEN (HELPERS v5.13).
 *   WORK tritt nur noch der Bladeburner-Division bei und gruendet die Gang —
 *   beides Freischaltungen, die nichts starten.
 *   WARUM: am 24.09.2026 lagen beide stundenlang still. (1) Jeder WORK-Start
 *   beginnt mit bladeJoined=false, der Anforderungsblock lief VOR der
 *   Beitrittspruefung und schickte DROP:BLADEBURNER - die QUEEN beendete ihn.
 *   (2) Waehrend eines Graftings endet jeder Durchlauf im Grafting-Schutz mit
 *   continue, VOR dem Anforderungsblock - es kam nie wieder ein WANT. BANK
 *   haengt Grafts aneinander, also blieb das so.
 *
 * v5.5 — FREISCHALTEN IST NICHT BETREIBEN. Zwei Stellen banden eine einmalige,
 *   kostenlose Freischaltung an den DAEMON-SCHALTER:
 *     a) Der Bladeburner-Beitritt hing an isDaemonEnabled("BLADEBURNER").
 *     b) Die Gang-Gruendung stand in der GANGS-Nutzlast, die ohne Schalter gar
 *        nicht laeuft. WORK farmte also in jedem Durchlauf die 54.000 Karma
 *        und gruendete dann nichts — die Arbeit getan, die Tuer zu.
 *   Der Schalter heisst "steuere das nicht", nicht "lass mich draussen".
 *   Beide Freischaltungen laufen jetzt unabhaengig; ueber sendSpawnWant
 *   entscheidet der Schalter unveraendert, ob der Daemon danach arbeitet.
 *
 * v5.4 — TAIL-FENSTER AKTIV SCHLIESSEN, VERSIONSZEILE EHRLICH.
 *   a) Der Kopf sagt seit jeher "Kein Auto-Tail", und das stimmt — WORK ruft
 *      nirgends openTail. Trotzdem stand ein WORK-Fenster offen: Bitburner
 *      stellt offene Tail-Fenster je Skript beim Neustart WIEDER HER. Gegen ein
 *      schon offenes Fenster hilft nur Schliessen, nicht Nicht-Oeffnen.
 *   b) announce() meldete fest "v2.0.2", waehrend der Kopf bei 5.3 stand. WORK
 *      hatte wie CORP gar keine VERSION-Konstante und entkam damit der Pruefung
 *      des PRUEFERs (Kopf gegen Konstante). Jetzt gibt es sie.
 *
 * v5.3 — FOKUS STANDARDMAESSIG AUS (weniger Rendern, kuehlerer Pi).
 *   Der Pi laeuft headless im Dauerbetrieb; niemand schaut der Arbeit zu.
 *   CFG.FOCUS=true zwang die Anzeige aber bei JEDER Arbeitsvergabe auf die
 *   schwere, staendig animierte Work-Seite (Singularity.ts: focus=true ruft
 *   Player.startFocusing() UND Router.toPage(Page.Work)). Das war der groesste
 *   skriptbare Render-Posten auf dem unbeaufsichtigten Pi.
 *
 *   Jetzt CFG.FOCUS=false. Der einzige Preis waere der Fokus-Malus (Arbeit zu
 *   80 % Ertrag) — der faellt hier weg, weil das Neuroreceptor Management
 *   Implant vorhanden ist (focusPenalty()=1, im Save geprueft). Also gratis.
 *
 *   GRENZE: Bitburner kennt sein Wirts-System nicht, ein Skript kann "Pi" und
 *   "GPD" nicht selbst unterscheiden. Echtes pro-Maschine-Schalten kommt mit
 *   der Handoff-Bruecke (Punkt 3), die beim Uebergeben den Fokus passend setzt.
 *   Bis dahin ist false der Standard fuer beide; wer am GPD zuschauen will,
 *   setzt CFG.FOCUS wieder auf true.
 *
 * v5.2 — DER SPENDEN-ANTRAG WAR NIE ERFUELLBAR.
 *   Gedeckelt wurde nur gegen den Spenden-Topf der BANK. Der waechst aus dem
 *   Zufluss und kennt keine Obergrenze — nach ein paar Tagen in BN13 war er
 *   groesser als der gesamte freie Kontostand. Beantragt wurden dann
 *   $21,30 Mrd. bei $2,18 Mrd. frei.
 *
 *   Der Antrag blieb vom 07.09. bis 11.09. stehen, erschien in 81 Berichten
 *   als Befund "BANK hatte 1+ offene Geldantraege — werden nicht bedient",
 *   und gespendet wurde in diesen vier Tagen KEIN EINZIGES MAL. Der Deckel
 *   war da, er deckelte nur die falsche Groesse.
 *
 *   Jetzt gegen Topf UND bank.frei (= cashAvail der BANK, dort sind Sockel,
 *   Grossziel-HOLD und erteilte Freigaben schon abgezogen). Faellt der Betrag
 *   unter die Mindestspende, wird ein alter Antrag aktiv zurueckgezogen —
 *   sonst haengt der zu grosse von gestern weiter im Eingang.
 *
 *   LEHRE: Ein Antrag, der nicht erfuellbar ist, ist kein Antrag, sondern
 *   Rauschen. Und Rauschen im Bericht macht die echten Befunde unsichtbar.
 *
 * v5.1 — SPENDEN: DER ZWEITE WEG ZU FAKTIONS-RUF.
 *   Bisher gab es genau einen: arbeiten. Geld liess sich nicht in Ruf
 *   verwandeln, obwohl die Engine das anbietet und es gerade in BN8 der
 *   naheliegende Tausch ist — dort ist Ruf der Engpass, Geld kommt aus der
 *   Boerse.
 *
 *   Gespendet wird IMMER an die Faktion, die WORK ohnehin farmt (target).
 *   Zwei Wege auf dasselbe Ziel statt zweier konkurrierender Ziele.
 *
 *   ENGINE (nachgelesen, Herleitung bei spendeStep):
 *     repFromDonation = Betrag/1e6 * mults.faction_rep * FactionWorkRepGain
 *     favorNeededToDonate() = floor(150 * FavorToDonateToFaction) — in BN8 = 0
 *     donateToFaction WIRFT NICHT, es gibt bei jedem Verstoss false zurueck
 *
 *   ZWEI BREMSEN, beide bei der BANK (v5.0):
 *     1. Ein eigener Topf mit 5 % des Brutto-ZUFLUSSES je Tick. Er ist die
 *        harte Obergrenze — unabhaengig davon, wieviel Geld herumliegt.
 *     2. WORK hat keine eigene Prioritaet und faellt auf DEFAULT_PRIO (100),
 *        also unter CORP, AUGS, INFRA, GANGS und BLADEBURNER.
 *   Laeuft die BANK noch vor v5.0, wird GAR NICHT gespendet: ohne Deckel waere
 *   eine Rufluecke von 400k bei Multiplikator 1,5 rund 267 Mio. Ueberweisung.
 *
 * v5.0 — SLEEVES: SHOPLIFT WAR EIN RECHENFEHLER, UND CRIME WAR DIE FALSCHE FRAGE.
 *
 * ANLASS (Betrieb, BN8): acht Sleeves auf Shoplift. Gang gegruendet, Karma bei
 * -61.000 also verbraucht, Bladeburner-Rang wertlos, Crime-Geld null. Shoplift
 * bringt fast keine Stats — es war die schlechteste erreichbare Wahl.
 *
 * A) DIE TABELLE WAR FALSCH. SLEEVE_CRIME_STATS gab Shoplift cexp 10. Crimes.ts
 *    kennt fuer Shoplift NUR dexterity_exp 2 und agility_exp 2, also cexp 4.
 *    Mit 10/2 s = 5,0 Exp/s war Shoplift rechnerisch der beste Kampftrainer im
 *    ganzen Feld — bei JEDEM Statstand, weil seine Chance schon bei Stats um 25
 *    auf 1,0 steht. Mit den echten 4/2 s = 2,0 Exp/s ist es das zweitschlechteste.
 *    Ausserdem falsch: Rob Store 96->90, Larceny 160->120, Bond Forgery 210->150,
 *    fast alle Erfolgsgewichte erfunden (Mug hatte cha 3 und hack 0,5, die Engine
 *    kennt dort nur str/def/dex/agi), und zwei Verbrechen fehlten ganz
 *    (Deal Drugs, Traffick Arms). Alles neu abgelesen, Zeile fuer Zeile.
 *    Richtige Wahl fuer Kampf-Exp ist ab jetzt MUG (3,0 Exp/s, Chance 1,0 schon
 *    bei 49 je Kampfstat); Assassination (4,0) ueberholt erst bei rund 1300.
 *
 * B) EIN FEHLVERSUCH IST NICHT UMSONST — bei SLEEVES. SleeveCrimeWork.ts:52
 *    ruft applySleeveGains(..., success ? 1 : 0.25): ein gescheitertes
 *    Verbrechen zahlt 25 % der Exp. Der wirksame Faktor ist damit
 *    0,25 + 0,75 x Chance, nicht die Chance. Fuer Geld gilt das nicht
 *    (gains.money wird auf 0 gesetzt, :50).
 *
 * C) DIE EIGENTLICHE ANTWORT: FIRMENARBEIT. ns.sleeve.setToCompanyWork gab es
 *    immer, der SCHWARM hat es nie benutzt — vermutlich wegen der naheliegenden
 *    Annahme "zahlt in BN8 ja auch nichts". Die ist falsch:
 *    calculateCompanyWorkStats hat zwei getrennte Zeilen. Der Lohn haengt an
 *    CompanyWorkMoney (BN8: 0), der RUF an CompanyWorkRepGain (in BN8 nicht
 *    gesetzt, also 1). SleeveCompanyWork.ts:46 schreibt den Ruf direkt auf das
 *    Spielerkonto der Firma. 400.000 Firmen-Ruf schalten eine Konzern-Faktion
 *    frei (Constants.ts:25); zehn davon gibt es, und jede ist danach ein NEUER
 *    Rep-Platz fuer einen Sleeve. Die Sleeves bauen sich also ihre eigenen
 *    kuenftigen Arbeitsplaetze, statt den Engpass zu verwalten.
 *    Dazu: influenceStockThroughCompanyWork schiebt die Firmenaktie nach oben —
 *    in einer Boersen-BitNode arbeitet der Sleeve damit dem TRADER zu.
 *    Bedingung ist eine Stelle des SPIELERS bei der Firma (Sleeve.ts:410-412);
 *    im Betrieb standen 26 gehaltene Jobs, davon alle zehn Konzerne.
 *
 * D) WAS SCHON LAEUFT, WIRD ZUERST EINGETRAGEN. `taken` fuellte sich bisher erst
 *    waehrend der Schleife, also griff Sleeve #0 nach Faktionen, auf denen #3
 *    laengst arbeitete. Jetzt werden Faktionen UND Firmen aus den laufenden
 *    Aufgaben vorbelegt; dafuer musste in drei Schleifen die Pruefung "laeuft er
 *    schon darauf?" VOR die Pruefung "ist der Platz vergeben?" ruecken.
 *
 * E) KEIN GELD-ZWECK OHNE GELD. Der Crime-Rueckfall waehlte oberhalb
 *    SLEEVE_TRAIN_CAP den Zweck "money" — in BN8 also das Verbrechen mit dem
 *    besten erwarteten Ertrag von null. Ist crimePaysIn false, gilt jetzt immer
 *    "combat"; unbekannt (null) laesst wie ueberall das alte Verhalten stehen.
 *
 * NICHT GEBAUT, mit Begruendung: Universitaet fuer Sleeves. ZB Institute /
 * Algorithms gaebe 16 Hacking-Exp/s je Sleeve fuer 1.600 $/s. Der Schwarm macht
 * laut Bericht rund 9.938 Hacking-XP/s aus den Worker-Skripten — acht Sleeves
 * brachten 1,3 % mehr. Gym Powerhouse (10 Exp/s in EINEM Stat, 2.400 $/s) bleibt
 * im Trainingsslot und wird keine Dauerrolle.
 *
 * v4.9 — HEALTHCHECK 12: ZWEI UHREN AUF EINER RESSOURCE.
 *   ortFaktionStep (v4.7) und cityFactionStep aendern BEIDE die Stadt des
 *   Spielers. Ziehen sie in verschiedene Richtungen — Stadt-Gruppe Sector-12,
 *   Tian Di Hui in Chongqing — ueberschreibt der zweite die Fahrt des ersten,
 *   und zwar im SELBEN Takt, also womoeglich bevor die Engine ihre
 *   Einladungspruefung faehrt. Zwei Fahrten zu je 200k, und beide Male wird die
 *   laufende Arbeit unterbrochen.
 *
 *   Genau die Fehlerform, die bei der Jobwahl schon zugeschlagen hat (Sweep
 *   30 s gegen Recheck 2 min): zwei Takte auf derselben Sache.
 *
 *   Jetzt reist hoechstens EINER je Takt. Vorrang hat die Ortsfaktion, aus
 *   einem sachlichen Grund: ihr Beitritt bannt niemanden, ist also nie ein
 *   Fehler. Die Stadt-Gruppen sind unumkehrbar und koennen einen Takt warten.
 *
 * v4.8 — HEALTHCHECK 5: EINE GANZE PHASE FUER EINE ABSAGE, DIE FESTSTAND.
 *   Phase 0 (BLADE-UNLOCK) trainiert die Kampfstats auf 100 und versucht dann
 *   BLADE_JOIN_TRIES-mal den Beitritt. Erst danach setzte sie bladeBlocked und
 *   ging weiter. Das Tor selbst war richtig gebaut — der Ausgang war erreichbar
 *   — aber der Weg dorthin fuehrte durch eine komplette Trainingsphase.
 *
 *   Dabei steht die Absage von der ersten Sekunde an fest und ist ablesbar:
 *     NetscriptFunctions/Bladeburner.ts:341
 *       if (currentNodeMults.BladeburnerRank === 0) return false;
 *   Denselben Wert liest bladeRankPaysIn() aus dem bn-Block. Ist er 0, wird
 *   Phase 0 sofort uebersprungen. Ist er unbekannt (kein SF5), bleibt es beim
 *   alten Verhalten mit den Fehlversuchen — kein Raten.
 *
 *   Die Kampfstats bleiben trotzdem nuetzlich (Tetrads 75, The Dark Army 300);
 *   sie werden nur nicht mehr FUER BLADEBURNER erarbeitet.
 *
 * v4.7 — TIAN DI HUI STAND IN KEINER LISTE.
 *   Gemeldet: "die Gang Tian Di Hui wird durch Reisen nach Ishima/New Tokyo
 *   nicht freigeschaltet". Der Grund war schlicht, dass der Schwarm NUR fuer
 *   die sechs verfeindeten Stadt-Faktionen reiste (CITY_FACTIONS). Lag die
 *   gewaehlte Gruppe woanders, kam der Spieler nie in eine der drei Staedte —
 *   und ohne Aufenthalt dort gibt es keine Einladung.
 *
 *   Tian Di Hui ist dabei eine von VIER Faktionen, deren EINLADUNG einen
 *   Aufenthaltsort verlangt (Faction/FactionInfo.tsx):
 *     Tian Di Hui    Chongqing/NewTokyo/Ishima   Hacking 50, 1 Mio.
 *     Tetrads        Chongqing/NewTokyo/Ishima   Kampf 75, Karma -18
 *     The Dark Army  nur Chongqing               Hacking 300, Kampf 300, Karma -45
 *     The Syndicate  Aevum/Sector-12             10 Mio., Hacking 200, Kampf 200, Karma -90
 *   KEINE von ihnen hat `enemies` — ein Beitritt bannt also niemanden und ist
 *   immer ein Gewinn, anders als bei den sechs Stadt-Faktionen, wo jede Wahl
 *   vier andere ausschliesst. Deshalb steht der neue Schritt auch VOR ihnen und
 *   ohne deren Phase-0-Sperre.
 *
 *   Angesteuert wird die Stadt mit der groessten Ausbeute; Chongqing oeffnet
 *   drei der vier. Gereist wird NUR, wenn mindestens eine Faktion alles ausser
 *   dem Ort erfuellt — dieselbe Regel wie bei cityFactionStep, weil Reisen die
 *   Arbeit unterbricht. Steht der Spieler schon richtig, passiert nichts: die
 *   Engine prueft Einladungen alle 10 Zyklen = 2 Sekunden (engine.tsx:147).
 *   Eine Sperre von 5 Minuten verhindert eine Reiseschleife, falls die
 *   Einladung wider Erwarten ausbleibt.
 *
 *   Das ANNEHMEN passiert unveraendert im normalen Einladungs-Zweig; der
 *   ueberspringt nur CITY_FACTIONS, und keine der vier steht dort.
 *
 * v4.6 — SLEEVES: TRAINING UEBER FAKTIONSARBEIT, UND EIN SLOT WAR UMSONST GESPERRT.
 *   Zwei Aenderungen an der Sleeve-Steuerung, beide am Quelltext nachgerechnet.
 *
 *   1. TRAINING. Je Kampfstat und Sekunde, beide Wege mit shockBonus skaliert:
 *        Bladeburner-Training  30 Exp / 30 s          = 1,0 Exp/s
 *                              (Bladeburner.ts:1096, GeneralActions.ts:8)
 *        Faction FIELD         Basis 1,0, 5 Zyklen/s  = 1,0 Exp/s
 *        Faction SECURITY      Basis 1,5              = 1,5 Exp/s
 *                              (Work/Formulas.ts:41-55, MilliPerCycle 200)
 *      Security trainiert also die HAELFTE SCHNELLER als Bladeburner-Training
 *      und bringt zusaetzlich Ruf; Field liegt gleichauf und bringt Ruf sowie
 *      Hack- und Charisma-Exp. Bladeburner-Training hat genau einen Vorteil:
 *      AUSDAUER. Die braucht man nur, wenn Bladeburner-Operationen etwas
 *      einbringen — in BN8 ist BladeburnerRank 0, dort also nie.
 *      Deshalb: Training laeuft ueber Faktionsarbeit, ausser der Rang zaehlt
 *      in dieser BitNode. Unbekannte Regel (kein SF5) -> altes Verhalten.
 *
 *   2. EIN SLOT WAR UMSONST GESPERRT. Die Faktion, fuer die der SPIELER
 *      arbeitet, war fuer alle Sleeves blockiert. Die Engine verlangt das
 *      nicht: setToFactionWork prueft nur die anderen SLEEVES
 *      (NetscriptFunctions/Sleeve.ts:152-164) und die Gang-Faktion (:166) —
 *      der Spieler kommt in keiner Pruefung vor. Da laut eigener Diagnose
 *      gerade die Faktionen die Grenze sind ("Grenze sind die FAKTIONEN, nicht
 *      der Deckel"), war das ein verschenkter Sleeve. Ruf sammelt sich additiv;
 *      es geht nichts verloren. Die Gang-Faktion bleibt gesperrt, dort wirft
 *      die Engine wirklich.
 *
 *   Zur oft gestellten Frage, ob Sleeve-Augs einen Aug-Install ueberleben: JA.
 *   prestigeAugmentation fasst die Sleeves nicht an; sleeve.prestige() (das die
 *   Augs leert) wird ausschliesslich aus prestigeSourceFile gerufen, also beim
 *   BITNODE-Wechsel. Innerhalb einer BitNode bleiben sie erhalten.
 *
 * v4.5 — DIE BREITE BEWERBUNG HAT DIE BESTE STELLE WIEDER ZERSTOERT.
 *   bestCompanyPlan waehlt fuer den aktuellen Arbeitgeber sorgfaeltig das Feld
 *   mit der hoechsten RUF-Rate (formulas.work.companyGains, Gleichstand ueber
 *   Geld und XP entschieden). Der Sweep bewarb sich 30 Sekunden spaeter bei
 *   ALLEN Leiter-Firmen auf Software und IT — auch bei genau dieser Firma.
 *
 *   Im Kopf stand dazu, Bewerbungen fassten "den Arbeitsslot NICHT an,
 *   applyToCompany setzt nur this.jobs". Das stimmt fuer den Arbeitsslot und
 *   ist trotzdem der Fehler: this.jobs[Firma] IST die Stelle, es gibt genau
 *   EINE je Firma, und die Engine ueberschreibt sie bedingungslos
 *   (PlayerObjectGeneralMethods.ts:344). Eine Bewerbung auf Software ersetzt
 *   also eine laufende Business- oder Security-Stelle.
 *
 *   Korrigiert wurde das erst beim naechsten Recheck — COMPANY_RECHECK_MS sind
 *   zwei Minuten, der Sweep laeuft alle 30 Sekunden. Der Schwarm arbeitete
 *   dadurch einen erheblichen Teil der Zeit in der falschen Position. Fuer
 *   einen kampf- oder charismalastigen Spieler (Bladeburner-Betrieb) ist
 *   Software selten die beste Ruf-Stelle.
 *
 *   Der aktuelle Arbeitgeber bleibt jetzt aussen vor. Ihm entgeht nichts: um
 *   SEINE Befoerderungen kuemmert sich der Recheck-Pfad, und der bewirbt sich
 *   mit dem richtigen Feld. Im Bladeburner-Zweig wird ausdruecklich null
 *   uebergeben ("es laeuft keine Firmenarbeit"), damit dort kein zusaetzlicher
 *   Abfrage-Aufruf entsteht.
 *
 *   BESONDERS RELEVANT IN BN8: CompanyWorkMoney ist dort 0. Arbeit lohnt
 *   ausschliesslich fuer Ruf — die falsche Stelle kostet also alles, was die
 *   Arbeit ueberhaupt einbringt.
 *
 * v4.4 — DER GRAFTING-SCHUTZ LAS DEN SCHNAPPSCHUSS, NICHT DIE WIRKLICHKEIT.
 *   Der Schutz gab es seit v1.2, und er sah richtig aus:
 *       const cw = await io.currentWork();
 *       if (cw && cw.type === "GRAFTING") { ... nicht anfassen ... }
 *   io.currentWork() liefert im INFO-Modus aber den work-Block aus dem
 *   INFO-Schnappschuss (Zeile 686), nicht das Ergebnis einer eigenen Abfrage.
 *   Der Block wird nur alle paar Sekunden erneuert. Startet BANK dazwischen
 *   einen Graft, sieht der Schutz noch "keine Arbeit" — und WORK greift sich
 *   den Slot. Der Graft ist weg, und mit ihm Stunden.
 *
 *   Der Nutzer hat genau das gemeldet: der Schutz in INFIL greift (der fragt
 *   live), der in WORK nicht.
 *
 *   Jetzt wird an dieser einen Stelle live gefragt. Das kostet ein
 *   Wegwerf-Skript je Schleifendurchlauf, und die Schleife laeuft alle 20 s.
 *   IM ZWEIFEL WIRD PAUSIERT: liefert die Live-Abfrage nichts, wird
 *   zusaetzlich der Schnappschuss angesehen. Faelschlich pausieren kostet
 *   einen Takt, faelschlich zugreifen einen ganzen Graft.
 *
 *   NICHT geaendert: der RESET-Payload prueft ohnehin selbst und live, bevor
 *   er installiert (SRC_RESET, Abschnitt 2) — der Aug-Install kann einen
 *   Graft also nicht verwerfen. Die Pruefung in BANKs checkResetReady bleibt
 *   ebenfalls schnappschuss-basiert: sie ist nur die Vorstufe, und eine
 *   Umstellung auf async waere dort Aufwand fuer ein Fenster von Sekunden.
 *
 * v4.3 — BEITRETEN BRAUCHT KEINE REISE. cityFactionStep reiste IMMER erst und
 *   trat danach bei. Eine Bedingung zu viel: joinFaction prueft laut Engine nur
 *   zwei Dinge (Singularity.ts:783-791) — schon Mitglied, und liegt eine
 *   Einladung vor. Ein Ortsvergleich kommt dort NICHT vor; die Stadt steht
 *   allein in den EINLADUNGS-Bedingungen (FactionInfo.tsx:541). Lag die
 *   Einladung also schon vor, war die Fahrt reine Verschwendung: 200k, und sie
 *   unterbricht die laufende Arbeit, was INFIL jedes Mal aus dem Tritt bringt.
 *   Im Lagebild standen ueber Stunden drei offene Einladungen (Aevum, Volhaven,
 *   Sector-12) unbeantwortet daneben.
 *   Zweiter Fehler derselben Stelle: die Geldpruefung stand VOR dem Beitritt,
 *   obwohl sie die Schwelle fuer die EINLADUNG meint — eine vorliegende
 *   Einladung blieb liegen, sobald das Geld inzwischen ausgegeben war.
 *   JETZT: erst beitreten, wenn eine Einladung offen ist (kostenlos, ohne
 *   Ortswechsel). Gereist wird nur noch, um eine Einladung zu ERARBEITEN — und
 *   nur, wenn nach den 200k Fahrt die Einladungsschwelle noch steht.
 *
 * v4.2 (Sleeve-Rollen: Diagnose)
 *
 * ===========================================================================
 * v4.2 — DIE SLEEVE-ZEILE SAGT JETZT, WARUM
 * ===========================================================================
 * ANLASS: nach v4.1 machten die Sleeves weiter Crime, und aus dem Log liess
 * sich nicht entscheiden, WORAN es lag. Die Zeile zeigte die Rollen, nie die
 * Gruende — dieselbe Luecke wie beim TRADER vor dessen Statuszeile.
 *
 * Es gibt genau vier moegliche Ursachen, und die Zeile trennt sie jetzt:
 *   1. ALTER CODE LAEUFT. Bitburner kompiliert beim exec; eine ueberschriebene
 *      Datei wirkt erst nach einem Neustart des Prozesses. Deshalb steht die
 *      VERSION in der Zeile — steht dort nicht v4.2, laeuft die alte Fassung.
 *   2. ZU WENIG FAKTIONEN. Die Engine laesst zwei Sleeves nie auf dieselbe
 *      Faktion (Sleeve.ts); repRank.length ist damit die harte Obergrenze.
 *      Zusaetzlich filtert gapOpenS Faktionen heraus, deren Rep das teuerste
 *      fehlende Aug bereits deckt.
 *   3. crimePays NICHT ERMITTELBAR (kein SF5 / bn-Block ohne mults) -> der
 *      Deckel von 2 bleibt bewusst stehen.
 *   4. FALSCHER MODUS (UNLOCK statt REP) -> gar keine Rep-Rollen.
 *
 * Reine Anzeige, kein Verhaltenswechsel.
 *
 * ===========================================================================
 * v4.1 (Sleeves: Rep statt wertlosem Crime)
 *
 * ===========================================================================
 * v4.1 — SLEEVES FARMTEN CRIME, DAS NICHTS EINBRINGT
 * ===========================================================================
 *
 * BEFUND (BN8, 8 Sleeves): 2 auf Faktions-Rep, 6 auf Crime — fuer exakt $0.
 *
 * URSACHE, zwei Teile:
 *   1. buildSleeveRoles vergibt Infiltrate/Diplomacy/Contracts nur bei
 *      bladeReady. In BN8 ist BladeburnerRank 0 (BitNode.tsx:784), die Division
 *      also wertlos und meist gar nicht betreten -> der else-Zweig schiebt alles
 *      auf "crime". Und CrimeMoney ist dort ebenfalls 0 (BitNode.tsx:769).
 *   2. CFG.SLEEVE_REP_MAX deckelt Rep auf 2, unabhaengig davon, wie viele
 *      Faktionen offen sind. Der Deckel stammt aus der Zeit, als Bladeburner die
 *      Alternativrollen stellte.
 *   FIX: repSlotCap() — der Deckel gilt nur, wenn es eine lohnende Alternative
 *   GIBT. Ohne nutzbaren Bladeburner und ohne zahlendes Crime gehoert jeder
 *   Sleeve auf Rep, begrenzt allein durch die Zahl offener Faktionen (die Engine
 *   laesst zwei Sleeves nie auf dieselbe Faktion).
 *   Ist CrimeMoney nicht lesbar (kein SF5), bleibt es beim alten Verhalten —
 *   eine unbekannte Regel darf nie zu einer Verhaltensaenderung fuehren.
 *
 * BUGFIX dazu: repRank filterte die GANG-FAKTION nicht. Sleeve.ts:166-169 wirft
 *   dort ausdruecklich ("cannot work for faction ... because you have started a
 *   gang with them"). doReputation filtert sie fuer den SPIELER laengst
 *   (gangFac); bei den Sleeves fehlte es — der Sleeve verlor seinen Rep-Slot an
 *   eine unmoegliche Faktion und fiel auf Crime zurueck.
 *
 * ===========================================================================
 * v4.0 — DREI FEHLER, EINE URSACHE
 * ===========================================================================
 *
 * BEFUND: WORK lief 303 Zyklen Homicide, hielt NULL Jobs, meldete kein
 * Rep-Ziel, und fuenf Faktions-Einladungen lagen unbeantwortet.
 *
 * URSACHE: PHASE 1 (Karma) endet mit `continue`. Einladungen, breite Bewerbung
 * und Rep-Arbeit standen ALLE in PHASE 2 und waren damit unerreichbar, solange
 * keine Gang existiert und -54.000 Karma nicht erreicht sind.
 *
 * A) NEUER BLOCK "EINMAL-AKTIONEN" VOR PHASE 0. Drei Dinge, die den
 *    Arbeitsslot NICHT anfassen: applySweep (breite Bewerbung — die Funktion
 *    gab es schon, wurde aber NUR im Bladeburner-Slot-Zweig gerufen, lief mit
 *    installiertem Simulacrum also nie), Einladungen annehmen, Stadt-Faktionen.
 * B) STADT-FAKTIONEN ALS GRUPPEN (cityFactionStep + pickCityGroup). Die sechs
 *    sind ueber `enemies` verzahnt; daraus ergeben sich DREI vertraegliche
 *    Gruppen. Umkehrbar: Faction.prestigeAugmentation() setzt isBanned zurueck
 *    (Faction.ts:77-85) — die Wahl gilt pro Durchlauf, nicht pro BitNode.
 * C) WORK REIST (ensureCity). travelToCity kam bis v3.11 NICHT EIN EINZIGES
 *    MAL vor — der Spieler blieb, wo GENESIS ihn gelassen hatte.
 * D) SLEEVE-GYM WAR STILL TOT. setToGymWorkout verlangt, dass der SLEEVE in der
 *    Stadt des Gyms steht; der Rueckgabewert wurde nie geprueft.
 *
 * ---------------------------------------------------------------------------
 * v3.11
 *
 * v3.11 — INFIL-KOPPLUNG ZURUECKGEBAUT (auf Wunsch von Here). updateFocus()
 *   fragte seit v3.9 isDaemonEnabled("INFIL") ab und arbeitete unfokussiert,
 *   solange INFIL lief. WORK und INFIL haben damit jetzt KEINE Verbindung mehr —
 *   WORK richtet sich allein nach CFG.FOCUS.
 *   BEWUSSTE FOLGE: fokussierte Arbeit ruft Router.toPage(Page.Work) und reisst
 *   die Seite an sich. Vergibt WORK waehrend einer Infiltration NEUE Arbeit, ist
 *   der Schirm weg und der Lauf verloren. Wegen der "laeuft schon"-Abkuerzung
 *   passiert das nur beim WECHSEL der Arbeit, nicht in jedem Zyklus; INFIL
 *   verliert also gelegentlich einen Lauf und faengt neu an (seit INFIL v1.13
 *   ein weicher Fehlschlag ohne Folgen). Wer das ganz vermeiden will, setzt
 *   CFG.FOCUS auf false.
 *
 * v3.10
 *
 * v3.10 — SLEEVE-VORBEREITUNG: ERST SYNCHRONISATION, DANN SHOCK.
 *   Die Kette lief bisher Shock -> Sync -> produktive Rolle. Gedreht auf
 *   Sync -> Shock -> produktive Rolle. Engine-Begründung:
 *     - SleeveSynchroWork.process wendet KEIN shockBonus() an:
 *         sync += calculateIntelligenceBonus(Player.int, 0.5) * 0.0002 * cycles
 *       Ein Sleeve mit Shock 100 synchronisiert also exakt so schnell wie einer
 *       mit Shock 0. Umgekehrt ist SleeveRecoveryWork von sync unabhängig.
 *     - Shock sinkt zusätzlich PASSIV (sleeves.md: "Sleeve shock slowly decreases
 *       over time"; die Shock-Recovery-Aufgabe erhöht nur die Rate). Für sync
 *       gibt es keine passive Komponente.
 *   Daraus: Shock-zuerst kostet "T_shock + T_sync"; Sync-zuerst kostet
 *   "T_sync + T_shock_rest", wobei der Rest um den passiven Abbau während der
 *   gesamten Sync-Phase kleiner ist. Sync-zuerst ist nie langsamer.
 *   PREIS, bewusst in Kauf genommen: purchaseSleeveAug (BANK) verlangt
 *   shock === 0 und ist damit bis zum Ende der Sync-Phase blockiert. Augs
 *   können später gekauft werden; ein Sleeve unter 100 % Sync liefert dem
 *   Spieler ohnehin nur A*X*Y (sleeves.md).
 *   UNVERÄNDERT: ein Sleeve wird erst produktiv eingesetzt, wenn BEIDE Ziele
 *   erreicht sind (shock <= SLEEVE_SHOCK_OK = 0 UND sync >= SLEEVE_SYNC_OK = 100)
 *   — beide Zweige brechen mit `continue` ab, bevor Karma, Training, Rep,
 *   Firma, Bladeburner oder Contracts vergeben werden.
 *
 * v3.9 — FOKUS FOLGT INFIL. Läuft SCHWARM-INFIL (Dashboard-Schalter), arbeitet
 *   WORK unfokussiert weiter, statt die Infiltration zu verdrängen. Details in
 *   der FOKUS-STEUERUNG unter dem CFG-Block. FLANKE: WORK vergibt laufende
 *   Arbeit normalerweise nicht neu ("läuft"-Abkürzung); beim Fokuswechsel wird
 *   die Abkürzung im Wechselzyklus einmalig übersprungen — Gym, Crime, Faktion
 *   und Firma gleichermaßen.
 *
 * v3.8 — *
 * v3.8 — WORK BLIEB NACH DEM BLADEBURNER-BEITRITT STEHEN. Live: nach dem Beitritt
 *   lief 30 min lang gar keine Arbeit (DIAG-Zyklus 2: currentWork null), erst ein
 *   manueller Neustart loeste es.
 *
 *   URSACHE — ein Kreis: `ownedAugs` wurde EINMAL beim Start geladen und danach nur
 *   im AUG_REFRESH_MS-Takt aufgefrischt. Die Auffrischung stand aber HINTER dem
 *   Block "Slot-Abgabe an Bladeburner", und der endet mit `continue`. Solange WORK
 *   den Slot abgab, wurde die Auffrischung also NIE erreicht — WORK konnte nicht
 *   erfahren, dass es das Simulacrum inzwischen besitzt, und blieb dauerhaft haengen.
 *   Nur ein Neustart half, weil die Startzeile dann neu lief.
 *   FIX: die Auffrischung steht jetzt VOR dem Block.
 *
 *   ZWEITENS: "Slot frei lassen" hiess bisher "gar nichts tun". Der Slot gehoert in
 *   dieser Phase zu Recht dem Bladeburner-Daemon (Bladeburner.process() bricht jede
 *   Aktion ab, sobald Player.currentWork gesetzt ist, geprueft mit ignoreQueued=true
 *   — nur ein INSTALLIERTES Simulacrum schuetzt). Aber applyForJob fasst currentWork
 *   NICHT an: es setzt nur this.jobs[...] (PlayerObjectGeneralMethods). Bewerbungen
 *   sind also erlaubt und laufen jetzt weiter (applySweep), waehrend Bladeburner den
 *   Slot haelt.
 *
 *   GRENZE des Sweeps: er laeuft ueber COMPANY_LADDER, nicht ueber alle 38 Firmen.
 *   Die vollstaendige Namensliste liess sich aus dem Projektabzug nicht sicher
 *   aufloesen (CompanyName-Enum fehlt), und geratene Namen haben schon einmal einen
 *   stillen Totalausfall verursacht (Congruity, BANK v1.5). Bleibt offen.
 *
 * v3.7 — SLEEVE-CRIME
 *
 * v3.7 — SLEEVE-CRIME folgt jetzt derselben Doktrin wie der Spieler. Vorher stand in
 *   pickSleeveCrime fest "Homicide, sonst Mug" — die Sleeves blieben also bei der
 *   Karma-Wahl, auch wenn Karma laengst verbraucht war (Gang gegruendet, alle
 *   karma-gated Faktionen beigetreten). Genau so beobachtet.
 *   A) SLEEVE_CRIME_STATS von 2 auf 10 Verbrechen erweitert, alle Werte aus
 *      Crimes.ts abgelesen: Erfolgsgewichte, Schwierigkeit, Dauer, Geld, Kampf-Exp.
 *   B) sleeveCrimeChance beachtet jetzt auch cha und hack — bei Mug und Rob Store
 *      (cha 3) wurde die Chance vorher deutlich zu niedrig geschaetzt.
 *   C) pickSleeveCrime kennt drei Zwecke: karma / combat / money. Der Leerlauf-Fall
 *      waehlt "combat", solange der Sleeve unter dem Trainingsziel liegt, danach
 *      "money".
 *   ANMERKUNG zur Sorgfalt: erst hatte ich cexp als EINE Zahl je Verbrechen mit der
 *   Annahme angesetzt, die vier Kampf-Exp-Werte seien gleich gross. Das stimmt fast
 *   nirgends (Shoplift 3/3/2/2, Larceny 20/20/60/60, Bond Forgery 20/20/150/20) und
 *   liess Shoplift den Kampf-Modus zu Unrecht gewinnen. cexp ist jetzt die echte
 *   Summe der vier Werte. Der SPIELER-Pfad war nie betroffen — doCrime liest die
 *   Exp-Felder direkt aus dem Stats-Objekt der Engine.
 *
 * v3.6 — KAMPF-MODUS fuer den Crime-Fallback
 *
 * v3.6 — KAMPF-MODUS fuer den Crime-Fallback. In der BLADE-UNLOCK-Phase (Kampfstats
 *   auf 100 fuer joinBladeburnerDivision) waehlte WORK das Verbrechen nach GELD.
 *   Engine-Werte (Crimes.ts): Heist gibt 450 Exp in allen vier Kampfstats, Homicide
 *   nur 2 — aber Heist dauert 600 s und Homicide 3 s. Pro Sekunde ist Mug/Homicide
 *   damit rund 3,2x besser (2,85 gegen 0,90 Exp/s). Mein v3.4-Kommentar behauptete,
 *   Kampf-Exp falle "bei beiden Modi an, deshalb automatisch" — sie faellt an, aber
 *   dreifach langsamer. Live-Folge: nach 8 Stunden Heist standen die Kampfstats bei
 *   rund 83 von 100, die Division blieb zu, BLADEBURNER wurde nie angefordert.
 *   JETZT: doCrime kennt den Modus "combat" und maximiert die Summe der vier
 *   Kampf-Exp mal Chance durch Dauer. Erwartete Zeit bis Stat 100 faellt damit von
 *   ~13,9 auf ~4,4 Stunden. Die Gang-Phase erzwingt weiter "karma", der normale
 *   Fallback entscheidet Karma gegen Geld wie in v3.4.
 *
 * v3.5 — REP-WAHL LIEGT JETZT HIER
 *
 * v3.5 — REP-WAHL LIEGT JETZT HIER, wo sie hingehoert. Vorher schickte BANK ein
 *   Rep-Ziel auf Port 17 und ueberstimmte damit die eigene Rangliste dieses Skripts
 *   — zwei Ranglisten nach verschiedenen Kriterien, von denen die aeussere die
 *   noetigen Filter nicht hatte. Live zweimal in eine Sackgasse gelaufen: BANK
 *   schlug "Slum Snakes" vor (Gang-Faktion, fuer die die Engine workForFaction
 *   grundsaetzlich ablehnt) und danach "Aevum" (Einladung nie angenommen, weil
 *   Stadt-Faktionen sich gegenseitig ausschliessen). Beides Wissen, das WORK
 *   ohnehin hat: CANNOT_WORK, Gang-Faktion und `workable` (= beigetreten).
 *   A) Kein readRepTarget mehr — die interne Rangliste ist die einzige Quelle.
 *   B) computeAugGoals rankt nach PREIS (billigstes fehlendes Aug) statt nach
 *      scoreAugStats. Damit ziehen Rep-Grind und Aug-Kauf am gleichen Strang;
 *      vorher farmte WORK Ruf bei der Faktion mit den WERTVOLLSTEN Augs, waehrend
 *      BANK das BILLIGSTE ganz woanders kaufte. Gilt fuer INFO- und EVAL-Pfad.
 *   C) Port 17 dient jetzt der DIAGNOSE: WORK MELDET sein gewaehltes Ziel, niemand
 *      handelt darauf. Die Richtung ist damit gedreht — der Entscheider veroeffentlicht.
 *
 * v3.4 — CRIME-FALLBACK bekommt einen ZWECK
 *
 * v3.4 — CRIME-FALLBACK bekommt einen ZWECK. Bisher maximierte doCrime immer die
 *   Karma-Rate und nahm Homicide, sobald die Chance reichte. Karma ist aber eine
 *   Währung mit Verfallsdatum: sie schaltet nur Faktionen frei (Slum Snakes -9,
 *   Tetrads -18, Silhouette -22, Speakers/Dark Army -45, Syndicate -90) und die
 *   Gang-Gründung. Sind die beigetreten und die Gang steht, bringt Homicide nur
 *   noch Kampf-Exp. Live beobachtet: Gang vorhanden, Syndicate und Tetrads
 *   beigetreten, Karma weit unter -90 — und WORK farmte weiter Homicide.
 *   JETZT: KARMA_GATES prüft, ob überhaupt noch ein Tor offen ist. Wenn nein,
 *   schaltet der Fallback auf GELD und wählt nach money * chance / Zeit über alle
 *   zwölf Verbrechen (Heist zahlt am meisten, hat aber die schlechteste Chance —
 *   das Produkt entscheidet). Die Gang-Gründungsphase erzwingt weiter Karma
 *   (forceKarma), weil deren Schwelle -54000 lange nach den Faktions-Toren liegt.
 *   Silhouette ist in KARMA_GATES dokumentiert: dort ist nicht das Karma der
 *   Engpass, sondern die Führungsposition (executiveEmployee) plus $15m.
 *
 * v3.3 — FIRMENWAHL und GANG-FAKTION
 *
 * v3.3 — FIRMENWAHL und GANG-FAKTION. Zusammenhängende Kette, live nachgewiesen:
 *   BANK setzte "Slum Snakes" als Rep-Ziel; das ist die Gang-Faktion, für die
 *   Singularity.ts workForFaction grundsätzlich ablehnt ("you are managing a gang
 *   for it"). WORK verbrauchte alle drei Arbeitsarten (INFO_RPC_RES: dreimal
 *   {ok:true,res:false}), fiel in den Firmenzweig und landete bei FoodNStuff —
 *   dem ERSTEN Eintrag der Leiter — für 594 Zyklen, obwohl Stellen bei ECorp,
 *   MegaCorp, KuaiGong, Blade Industries und Clarke gehalten wurden.
 *   A) NEVER_COMPANY = FoodNStuff, Joe's Guns, Noodle Bar. Aus der Leiter entfernt
 *      und zusätzlich als Sperre wirksam, wenn dort schon Arbeit LÄUFT (sonst
 *      klebt ein Alt-Job aus GENESIS' Frühphase dauerhaft im Slot).
 *   B) Leiter wird best-first durchlaufen: Firmen MIT angehängter Faktion zuerst,
 *      denn sie schalten Megacorp-Faktionen frei (400k Firmen-Rep, Constants.ts:25) und zahlen
 *      besser. sort() ist stabil, die gelistete Folge bleibt je Gruppe erhalten.
 *   C) Die Gang-Faktion fliegt aus `workable`. Für AUGS bleibt sie interessant —
 *      ihr Rep wächst über die Gang selbst, nur Arbeiten ist dort unmöglich.
 *
 * v3.2 — ZWEI BUGFIXES an der Rep-Beschaffung
 *
 * v3.2 — ZWEI BUGFIXES an der Rep-Beschaffung, die sich gegenseitig verstärkten:
 *   A) SHARE-FLAG war eine Sperre. Port 23 trägt einen Zeitstempel mit 90-s-Verfall
 *      (SHARE_MAX_AGE_MS); `if (!sharing)` schrieb ihn genau EINMAL und frischte ihn
 *      nie auf. Der Grind war nach 90 s tot, WORK hielt ihn für aktiv. Live: Flag
 *      1476 s alt, Share-Bonus 1.000000, share-Klasse 0 GB. Unsichtbar war das nur,
 *      weil schwarm-s.js endlos läuft und niemand die Worker abräumte — Dispatcher
 *      v9.1 tut das jetzt und hat den Fehler damit offengelegt.
 *   B) ARBEITSART war fest ["field","hacking","security"], erste Annahme gewann.
 *      Field ist aber genau die Art, in der der Share-Bonus verwässert wird: bei
 *      Hacking-Aufträgen multipliziert er das Gesamtergebnis, bei Field/Security nur
 *      einen Term innerhalb einer Summe mit Kampfstats und Charisma (reputation.ts).
 *      Gemessen mit den Live-Stats: Hacking-Aufträge bringen 23 % mehr Rep ohne
 *      Share und 48 % mehr mit Share. factionWorkOrder() rechnet die drei Formeln
 *      jetzt aus und sortiert; gemeinsame Faktoren kürzen sich, es braucht weder
 *      MaxSkillLevel noch Favor. Gilt auch für Sleeves — mit deren eigenen Stats,
 *      weshalb ein Kampf-Sleeve korrekt "security" und ein Charisma-Sleeve "field"
 *      bekommt.
 * Kinetik-Hauptdaemon: alles, was den SPIELER-AKTIONS-SLOT belegt — plus
 * Sleeve-Steuerung. Führt (fachlich) die Payloads BLADEBURNER und GANGS.
 *
 * ===========================================================================
 * v2.0 — INFO-MODUS, SLEEVE-ROLLEN, FIRMEN-FELDWAHL
 * ===========================================================================
 *
 * 1) INFO-MODUS ("eine Quelle, alle lesen"; Gegenstück: SCHWARM-INFO v1.0.1):
 *    Am TICK-ANFANG entscheidet io.refresh() GENAU EINMAL, woher dieser Takt
 *    seine Wahrheit bezieht:
 *      - "INFO": Port-28-Snapshot ist frisch (bn-Block da, player-Block jung)
 *        -> ALLE Reads aus den Blöcken (0 GB), ALLE Aktionen als RPC über
 *        Port 29/30 (requestInfoAction -> Poll auf readInfoActionResult).
 *      - "EVAL": kein/alter Snapshot -> komplettes v1-Verhalten (evalNs auf
 *        dem eigenen Host, burst 24 auf home bleibt dafür reserviert).
 *    BEWUSST kein Mischbetrieb pro Aufruf: eine Wahrheit je Tick verhindert
 *    Ping-Pong zwischen Snapshot-Stand und Live-Stand.
 *    computeAugGoals liest den Aug-Katalog aus dem INFO-augs-Block — die
 *    zweite Singularity-Katalog-Kette des Schwarms (neben AUGS) entfällt.
 *
 * 2) SLEEVE-ROLLENMODELL (ersetzt den v1.4-TODO-Block; Community-Standard):
 *    Kette je Sleeve: Shock-Recovery (bis 0! Voraussetzung für spätere
 *    Sleeve-Aug-Käufe der BANK: purchaseSleeveAug verlangt shock===0)
 *    -> Synchronize (bis 100) -> Karma-Grind (Homicide, solange Gang-Feature
 *    da, keine Gang, Karma über Ziel) -> Training/Rolle im 15-MIN-SLOT:
 *      - Zeit statt hartem Stat-Gate: slot = floor(now/15min). Training nur
 *        in GERADEN Slots (und nur solange ein Stat unter Ziel + Schnitt
 *        unter Cap); in ungeraden Slots ist JEDER Sleeve produktiv. Effekt:
 *        4 sichtbare Wechsel pro Stunde, nichts "stagniert" mehr optisch,
 *        und das beobachtete Dauer-Training ist strukturell beendet.
 *      - Produktive Rollen nach Anzahl n (rotieren um slot%n durch):
 *          n=1: offenes Rep-Ziel (Port 17 / Aug-Ranking) -> FactionWork;
 *               sonst Division betreten -> "Infiltrate Synthoids" (erzeugt
 *               Contracts/Ops und füttert den BLADEBURNER-Daemon);
 *               sonst Crime nach Chance.
 *          n>=2: bis min(2, n-1) Sleeves Rep (solange Ziele da); 1x
 *               "Diplomacy" NUR bei Chaos > 50; 1x "Take on contracts"
 *               (rotierend über Typen mit Restzahl > 0; je Typ max. EIN
 *               Sleeve — Engine wirft sonst); Rest "Infiltrate Synthoids".
 *               Ohne Bladeburner: Rest Crime.
 *      - Kein blindes Umsteuern mehr: der Ist-Task wird verglichen (INFO-
 *        Block bzw. getTask im Bündel); identische Aufgabe -> nicht anfassen
 *        (v1 setzte Crimes alle 20 s neu und verwarf angebrochene Zyklen).
 *
 * 3) FIRMEN-FELDWAHL (dein Wunsch): Bei gleicher Rep-Rate entscheidet die
 *    bessere Stelle. bestCompanyPlan() bewertet die Firma per RPC-eval:
 *    getCompanyPositions + PositionInfo je Position + (falls Formulas.exe)
 *    formulas.work.companyGains für die jeweils beste QUALIFIZIERTE Position
 *    je Feld. Wahl: max Rep/s; bei Gleichstand (±2 %) max Geld; dann
 *    Summe der XP-Raten. Ohne Formulas: Feld-Heuristik + salary-Vergleich.
 *    Beworben wird NUR noch das gewählte Feld (v1.2 bewarb Software UND IT
 *    nacheinander — der letzte Erfolg gewann zufällig). Läuft nur im
 *    INFO-Modus (das Bündel sprengt bei SF4 L1 den 24-GB-Eval-Puffer);
 *    im EVAL-Modus gilt die v1-Feldreihenfolge.
 *
 * ===========================================================================
 * ZUSTÄNDIGKEIT / PHASEN (unverändert aus v1)
 * ===========================================================================
 * WORK ist der EINZIGE Daemon, der Player.currentWork anfasst (Gym/Crime/
 * Faktion/Firma). Grafting (BANK) pausiert WORK. Phasen:
 *   0. BLADE-UNLOCK  Kampfstats -> 100, joinBladeburnerDivision SELBST,
 *                    erst DANACH WANT:BLADEBURNER (Deadlock-Sperre, s. v1).
 *   1. KARMA         Homicide/Mug bis Gang-Schwelle (außer BN2).
 *   2. REP           AUGS-Ziel (Port 17) zuerst, sonst Aug-Wert-Ranking;
 *                    Firmen als Füller; Crime als letzter Fallback.
 * WANT/DROP über Port 22 (Queen deployt), SHARE-Flag Port 23, Hash-Bedarf
 * Port 8. Kein Auto-Tail.
 *
 * ===========================================================================
 * PATCH-HISTORIE
 * ===========================================================================
 * v2.0.2 BUGFIX (Livetest: "farmt fast nur Tian Di Hui, dort 1m+ Rep"):
 *       doReputation und der Sleeve-repRank prüfen jetzt die REP-LÜCKE:
 *       Faktionen, deren aktuelle Rep das goal (max repReq der fehlenden
 *       Augs) bereits deckt, fliegen aus dem Ranking; ein AUGS-Port-Ziel
 *       mit erreichtem need wird übersprungen (stale-Port-Schutz). Ursache
 *       war das TDH-Priority-Aug Neuroreceptor (repReq 75k, Bonus +1e6):
 *       ungekauft dominierte es das Ranking, obwohl die Rep längst reichte
 *       — "wertvollste fehlende Augs" ist eben NICHT "braucht noch Rep".
 *       Einmal-Meldung je Faktion+goal macht den Filter im Tail sichtbar.
 *       Quelle INFO-rep-Block; im EVAL-Modus bewusst Altverhalten (Kosten).
 * v2.0.1 Livetest-Nachzieher: driveSleeves meldet jeden stummen Rückweg
 *       einmalig mit Grund (Schalter aus / Anzahl unbekannt / 0 Sleeves /
 *       Zustände nicht lesbar inkl. Quelle) — die drei Start-Ticks ohne
 *       SLEEVES-Zeile im Livetest waren sonst nicht diagnostizierbar.
 *       Log-Label "Slot A(Train)/B(Werk)" -> "Slot A/B" (+" (Training)" nur,
 *       wenn wirklich trainiert wird): die alte Beschriftung zeigte die
 *       Slot-PARITÄT, nicht die Tätigkeit, und war irreführend.
 * v2.0  INFO-Modus (Reads aus Port 28, Aktionen als RPC 29/30, EVAL-Fallback
 *       unverändert); Sleeve-Rollenmodell mit 15-min-Slots (Training nur in
 *       geraden Slots; Rollen n=1/n>=2 wie oben; Task-Vergleich statt blindem
 *       Umsteuern; SLEEVE_SHOCK_OK 5 -> 0 wegen purchaseSleeveAug); Firmen-
 *       Feldwahl nach Rep/Geld/XP (nur INFO-Modus); v1.4-TODO-Block durch
 *       Implementierung ersetzt; factionWorkOrder für Sleeves entfällt
 *       (Typen werden direkt durchprobiert — ein Fehlversuch ist billiger
 *       als ein getFactionWorkTypes-Aufruf je Faktion).
 * v1.3  Sleeve-Training (Blade-Turbo/Gym) + Crime-Chance-Näherung; Karma-
 *       Grind-Priorität; TRAIN_CAP.   v1.2  Grafting-Schutz; Firmen-Promotion-
 *       Recheck; bladeBlocked-Gate; Sleeve-Grundsteuerung; SLEEVES-Schalter.
 * v1.1  Firmen-Leiter statt MegaCorp-Endlosrotation; null-Diagnose; Crime-
 *       Fallback.   v1.0  Neubau (Meldeweg Port 22, kein Eigen-Deploy).
 *
 * @param {NS} ns
 */
import {
    CAPS, SPAWN_WANT_REFRESH_MS,
    evalNs, hasCapability, readManagedState, isDaemonEnabled,
    sendSpawnWant, sendSpawnDrop, publishShareWanted, publishHashNeed,
    ensureSingleInstance, announce, formatNumber, formatMoney,
    bitNodeFeatures, publishRepTarget,
    // v4.4: Export-Bonus-Stand in den eigenen Ausgang schreiben, damit DIAG ihn
    // zeigen kann, ohne das WORK-Log lesen zu muessen.
    writeOutField, SCHWARM_PORTS,
    readInfoBlock, requestInfoAction, readInfoActionResult,
    // v5.1: Spenden laufen ueber den vorhandenen Geldkanal der BANK.
    // Kein neuer Port, kein neues Protokoll - derselbe Weg, den GANGS und
    // BLADEBURNER fuer ihre Anschaffungen benutzen.
    requestFunds, readFundGrant, readBankInfo,
    chronik,                 // v5.8: Spenden ins Handlungsbuch (Kassenpruefung)
    requestFundsZurueck, readFundGrantStempel,   // v5.8 Nachtrag
} from "SCHWARM-HELPERS.js";

// =============================================================================
// v4.4 — EXPORT-BONUS (+1 Favor auf JEDE Mitgliedsfaktion, alle 24 h)
// =============================================================================
// Der "Backup Save"-Knopf im Augmentations-Fenster gibt einen Bonus, den fast
// niemand regelmaessig abholt. Engine (ExportBonus.tsx):
//     const bonusTimer = 24*60*60*1000;
//     for (const facName of Player.factions)
//         Factions[facName].setFavor(Factions[facName].favor + 1);
// Favor ueberlebt den Aug-Reset und schaltet ab 150 das Spenden frei — ein
// taeglicher Punkt auf JEDER Mitgliedsfaktion summiert sich ueber einen Lauf.
//
// WARUM DAS SKRIPTBAR IST, OHNE AM UI ZU KLEBEN: es gibt zwei Singularity-
// Funktionen dafuer, exportGameBonus() (Ist er faellig?) und exportGame()
// (Backup ausloesen). Kein DOM-Griff noetig.
//
// UND WARUM DER SPEICHER-DIALOG EGAL IST: SaveObject.ts:239-241 bucht den Bonus
// VOR dem Download —
//     export async function exportGame() {
//       giveExportBonus();                        // zuerst
//       ... downloadContentAsFile(saveData, ...)  // danach
//     }
// Selbst ein abgebrochener Download aendert am Favor nichts mehr.
//
// PREIS, EHRLICH: jeder Aufruf legt eine Datei im Download-Ordner ab
// (bitburnerSave_<zeitstempel>_BN<n>.json.gz). Der Name kommt aus
// getSaveFileName() und traegt einen Zeitstempel — er laesst sich weder
// vorgeben noch ueberschreiben, und ein Browser-Download kann keine Datei
// loeschen oder den Ordner lesen. Eine Rotation ("hoechstens 7 Staende") ist
// von innen also NICHT machbar; das ist keine Grenze des Schwarms, sondern der
// Sandbox. Was bleibt: hoechstens EIN Aufruf je 24 h — und genau das ist die
// Untergrenze, weil der Bonus ohnehin nicht oefter faellt.
//
// Deshalb ein Schalter. Er schreibt auf die Platte des Spielers; das gehoert
// nicht stillschweigend eingeschaltet, sondern sichtbar an eine Stelle.
// v5.4: EINE Quelle fuer die Fassung. announce() druckte "v2.0.2", der Kopf
// sagte 5.3 — dieselbe Drift wie in SCHWARM-CORP.js v0.35.
const VERSION = "5.8";

const EXPORT_BONUS_AKTIV = true;
const EXPORT_CHECK_MS = 30 * 60_000;   // hoechstens alle 30 min nachfragen

const CFG = {
    LOOP_MS: 20_000,            // Hauptloop (Phasen 1/2 sind träge)
    UNLOCK_LOOP_MS: 10_000,     // Phase 0 ist reaktiver (Stats steigen schnell)
    ROTATE_MS: 60_000,          // Wechsel unter gleichrangigen Rep-Zielen (Spieler)
    AUG_REFRESH_MS: 120_000,
    FOCUS: false,               // v5.3: aus — spart Rendern (headless Pi), dank Neuroreceptor-Aug gratis

    KARMA_GOAL: -54_000,        // Gang-Freischaltung (außerhalb BN2)
    BLADE_STAT_GOAL: 100,       // joinBladeburnerDivision verlangt 100 in allen 4
    GYM_UNTIL: 30,              // darunter lohnt Gym mehr als Crime
    HOMICIDE_MIN_CHANCE: 0.5,   // darunter lieber Mug

    TIER_FRAC: 0.5,
    TIER_MAX: 10,

    COMPANY_RECHECK_MS: 120_000,// laufenden Firmen-Job neu bewerten/bewerben
    COMPANY_BLOCK_MS: 600_000,  // abgelehnte Firma so lange nicht erneut versuchen
    COMPANY_REP_TIE: 0.02,      // Rep-Raten innerhalb ±2 % gelten als "gleich"
    BLADE_JOIN_TRIES: 4,

    // ---- INFO-Anbindung (v2.0) ----
    INFO_FRESH_MS: 30_000,      // player/work-Block jünger als das -> INFO-Modus
    INFO_REP_AGE_MS: 90_000,    // rep-Block-Höchstalter
    INFO_AUGS_AGE_MS: 300_000,  // augs-Block-Höchstalter (Katalog ändert sich langsam)
    INFO_CRIME_AGE_MS: 900_000, // crime-Block-Höchstalter
    RPC_TIMEOUT_MS: 12_000,     // Warten auf ein RPC-Ergebnis
    RPC_POLL_MS: 250,

    // ---- Sleeves (v2.0) ----
    SLEEVE_LOOP_MS: 20_000,
    SLEEVE_SHOCK_OK: 0,         // v2.0: 0 statt 5 — purchaseSleeveAug (BANK) verlangt shock===0
    // v3.11: Ab hier abwaerts arbeitet der Sleeve und erholt sich NEBENBEI
    // (Grundabbau 0.0001/Cycle bei jeder Aufgabe, Recovery gibt 0.0002 obendrauf).
    // 40 heisst: bis 40 % Ertragsverlust wird erholt, darunter gearbeitet.
    SLEEVE_SHOCK_RECOVER_ABOVE: 40,
    SLEEVE_SYNC_OK: 100,
    SLEEVE_ROTATE_MS: 900_000,  // 15-min-Slots: 4 sichtbare Wechsel pro Stunde
    SLEEVE_TRAIN_STR: 100, SLEEVE_TRAIN_DEF: 100,
    SLEEVE_TRAIN_DEX: 75,  SLEEVE_TRAIN_AGI: 75,
    SLEEVE_TRAIN_CAP: 200,      // über diesem Kampfstat-Schnitt nie mehr trainieren
    SLEEVE_HOMICIDE_CHANCE: 0.5,
    SLEEVE_GYM: "Powerhouse Gym",
    SLEEVE_REP_MAX: 2,          // höchstens so viele Sleeves auf Faction-Rep (n>=2)
    CHAOS_LIMIT: 50,            // darüber ein Sleeve auf Diplomacy
};

// ── FOKUS-STEUERUNG (v3.11) ─────────────────────────────────────────────────
// WORK richtet sich allein nach CFG.FOCUS. Die Abfrage von SCHWARM-INFIL aus
// v3.9 ist zurückgebaut — die beiden Skripte haben keine Verbindung mehr.
//
// Zum Nachschlagen, warum der Schalter überhaupt zählt (Singularity.ts,
// workForFaction/workForCompany/commitCrime/gymWorkout):
//     if (focus)            { Player.startFocusing(); Router.toPage(Page.Work); }
//     else if (wasFocusing) { Router.toPage(Page.Terminal); }
// Fokussierte Arbeit reißt die Seite an sich. Unfokussiert läuft die Arbeit voll
// weiter — engine.tsx:91 ruft Player.processWork im globalen Tick,
// seitenunabhängig — sie kostet nur den focusPenalty (CONSTANTS.BaseFocusBonus;
// entfällt mit dem Neuroreceptor Management Implant).
let _focusPrev = null;    // zuletzt benutzter Fokuswert
let _focusOn = CFG.FOCUS; // Fokuswert des laufenden Zyklus
let _focusFlank = false;  // Wert hat sich geändert -> Arbeit neu vergeben

/**
 * Einmal pro Zyklus aufrufen: bestimmt den Fokuswert und erkennt den Wechsel.
 *
 * v3.11 ZURUECKGEBAUT: die INFIL-Kopplung aus v3.9 ist raus. WORK fragt nicht
 * mehr isDaemonEnabled("INFIL") ab, sondern richtet sich allein nach CFG.FOCUS.
 * WORK und INFIL haben damit keinerlei Verbindung mehr.
 *
 * WAS DAS KOSTET, damit die Entscheidung bewusst bleibt: fokussierte Arbeit ruft
 * Router.toPage(Page.Work) und reisst die Seite an sich. Vergibt WORK waehrend
 * einer laufenden Infiltration NEUE Arbeit, ist der Infiltrationsschirm weg und
 * der Lauf verloren. Dank der "laeuft schon"-Abkuerzung passiert das nur beim
 * WECHSEL der Arbeit (andere Faktion, anderer Auftrag), nicht in jedem Zyklus —
 * INFIL verliert also gelegentlich einen Lauf und faengt danach neu an
 * (seit INFIL v1.13 ein weicher Fehlschlag ohne Folgen).
 * Wer das ganz vermeiden will, setzt CFG.FOCUS auf false. Der Fokus-Malus
 * entfaellt ohnehin mit dem Neuroreceptor Management Implant (focusPenalty()).
 */
function updateFocus(ns, state) {
    void state;   // v3.11: kein Schalterstand mehr noetig
    const on = CFG.FOCUS;
    if (_focusPrev !== null && _focusPrev !== on) {
        _focusFlank = true;
        ns.print(`FOKUS: ${_focusPrev ? "an" : "aus"} -> ${on ? "an" : "aus"} — laufende Arbeit wird neu vergeben.`);
    }
    _focusPrev = on;
    _focusOn = on;
    return on;
}

/** Fokuswert für die Singularity-Aufrufe dieses Zyklus. */
function FOCUS() {
    return _focusOn;
}

/**
 * Wurde der Fokus gerade umgeschaltet? Dann darf die "läuft schon"-Abkürzung
 * NICHT greifen: eine bereits laufende Arbeit behält ihren Fokus, Player.focus
 * bliebe auf dem alten Stand und Singularity.ts würde die Seite weiter an sich
 * reißen. Gilt für den GANZEN Zyklus (mehrere Zweige möglich) und wird am
 * Schleifenende quittiert.
 */
function focusFlank() {
    return _focusFlank;
}

function clearFocusFlank() {
    _focusFlank = false;
}

const SIMULACRUM = "The Blade's Simulacrum";
const KARMA_CRIMES = ["Homicide", "Mug", "Shoplift"];
// Gang-Faktionen nach Staerke. Identisch zu GANGS_BY_POWER in der
// GANGS-Nutzlast — bewusst doppelt: WORK gruendet (v5.5), die Nutzlast steuert.
// Wer eine Seite aendert, aendert die andere mit.
const GANG_FAKTIONEN = [
    "Speakers for the Dead", "The Dark Army", "The Syndicate", "Tetrads",
    "Slum Snakes", "The Black Hand",
];
// v3.4: alle Verbrechen — Namen identisch zu SCHWARM-INFOs CRIMES-Liste, damit der
// crime-Block direkt nutzbar ist ("Traffick Arms", nicht "Traffick Illegal Arms").
const ALL_CRIMES = [
    "Shoplift", "Rob Store", "Mug", "Larceny", "Deal Drugs", "Bond Forgery",
    "Traffick Arms", "Homicide", "Grand Theft Auto", "Kidnap",
    "Assassination", "Heist",
];
// Karma-Tore der Faktionen (FactionInfo.tsx). Ist eine davon NICHT beigetreten und
// das Karma noch oberhalb ihrer Schwelle, lohnt Karma-Farmen weiter; sonst ist Karma
// verbraucht und der Crime-Fallback schaltet auf GELD um.
// Silhouette braucht zusätzlich eine Führungsposition (executiveEmployee: CTO/CFO/CEO)
// und $15m — dort ist nicht das Karma der Engpass, sondern der Firmen-Rang.
const KARMA_GATES = [
    ["Slum Snakes", -9], ["Tetrads", -18], ["Silhouette", -22],
    ["Speakers for the Dead", -45], ["The Dark Army", -45], ["The Syndicate", -90],
];
const BLADE_CONTRACTS = ["Tracking", "Bounty Hunter", "Retirement"];

const CITY_GYMS = {
    "Sector-12": "Powerhouse Gym",
    "Aevum": "Crush Fitness Gym",
    "Volhaven": "Millenium Fitness Gym",
};
// Stadt, in der CFG.SLEEVE_GYM steht — ABGELEITET aus CITY_GYMS, damit ein
// geaenderter Gym-Name nicht stillschweigend in die falsche Stadt zeigt.
const SLEEVE_GYM_CITY = (() => {
    for (const [city, gym] of Object.entries(CITY_GYMS)) if (gym === CFG.SLEEVE_GYM) return city;
    return null;   // Gym nicht in der Tabelle -> nicht reisen, nur versuchen
})();
const COMBAT_STATS = [
    { key: "str", skill: "strength" },
    { key: "def", skill: "defense" },
    { key: "dex", skill: "dexterity" },
    { key: "agi", skill: "agility" },
];

const COMPANY_FIELDS = ["Software", "IT"];   // EVAL-Fallback-Reihenfolge
const CANNOT_WORK = ["Church of the Machine God", "Bladeburners", "Shadows of Anarchy"];
const CITY_FACTIONS = ["Aevum", "Chongqing", "Ishima", "New Tokyo", "Sector-12", "Volhaven"];

// ===========================================================================
// ORTSGEBUNDENE FAKTIONEN (v4.7) — die vergessene Gruppe
// ===========================================================================
//
// Der Nutzer meldete, Tian Di Hui werde durch Reisen nach Ishima/New Tokyo
// nicht freigeschaltet. Der Grund: Tian Di Hui stand in KEINER Liste. Der
// Schwarm reiste ausschliesslich fuer die sechs verfeindeten STADT-Faktionen
// (CITY_FACTIONS). Lag die gewaehlte Gruppe woanders, kam der Spieler nie in
// eine der drei Staedte — und ohne Aufenthalt dort gibt es keine Einladung.
//
// Tian Di Hui ist dabei nur eine von VIER Faktionen, deren EINLADUNG einen
// Aufenthaltsort verlangt (Faction/FactionInfo.tsx). Keine von ihnen hat
// `enemies`, ein Beitritt bannt also niemanden und ist immer ein Gewinn — im
// Gegensatz zu den sechs Stadt-Faktionen, wo jede Wahl vier andere ausschliesst.
//
// WICHTIG, und im Kopf von cityFactionStep schon festgehalten: die Stadt steht
// in den INVITE-Bedingungen, nicht im Beitritt. Man muss also nur zum Zeitpunkt
// der Pruefung dort SEIN. Die Engine prueft alle 10 Zyklen = 2 Sekunden
// (engine.tsx:147), Hinreisen und Weiterarbeiten genuegt also.
//
// CHONGQING IST DIE BESTE STADT: sie schaltet drei der vier frei.
//
// Karma ist als Obergrenze zu lesen (haveKarma(-18) heisst "Karma <= -18").
const ORT_FAKTIONEN = [
    { name: "Tian Di Hui",   staedte: ["Chongqing", "New Tokyo", "Ishima"], hack: 50,  kampf: 0,   geld: 1e6,  karma: 0 },
    { name: "Tetrads",       staedte: ["Chongqing", "New Tokyo", "Ishima"], hack: 0,   kampf: 75,  geld: 0,    karma: -18 },
    { name: "The Dark Army", staedte: ["Chongqing"],                        hack: 300, kampf: 300, geld: 0,    karma: -45 },
    { name: "The Syndicate", staedte: ["Aevum", "Sector-12"],               hack: 200, kampf: 200, geld: 10e6, karma: -90 },
];

// ===========================================================================
// STADT-FAKTIONEN (v4.0) — Gruppen statt Einzelentscheidungen
// ===========================================================================
//
// Die sechs Stadt-Faktionen sind ueber `enemies` verzahnt (FactionInfo.tsx), und
// joinFaction bannt die Feinde SOFORT und dauerhaft (FactionHelpers.tsx:45).
//   Aevum      -> Feind von Chongqing, NewTokyo, Ishima, Volhaven
//   Sector-12  -> Feind von Chongqing, NewTokyo, Ishima, Volhaven
//   Chongqing / New Tokyo / Ishima -> Feind von Sector-12, Aevum, Volhaven
//   Volhaven   -> Feind von ALLEN anderen fuenf
// Aevum und Sector-12 sind sich NICHT feind, lassen sich also BEIDE beitreten;
// Chongqing + New Tokyo + Ishima sogar zu dritt. Daraus genau drei Gruppen.
// Wer eine anfaengt, hat die anderen verloren — bis zum naechsten Aug-Install
// (Faction.prestigeAugmentation setzt isBanned zurueck, Faction.ts:77-85).
//
// GELDSCHWELLE IST KEINE AUSGABE: inviteReqs ist [locatedInCity(x),
// haveMoney(n)] — das Geld muss VORHANDEN sein und wird nicht abgebucht.
const CITY_GROUPS = [
    { name: "West",  members: [["Sector-12", 15e6], ["Aevum", 40e6]] },
    { name: "Ost",   members: [["Chongqing", 20e6], ["New Tokyo", 20e6], ["Ishima", 30e6]] },
    { name: "Volhaven", members: [["Volhaven", 50e6]] },
];
/** Stadt der Faktion (gleichnamig, ausser dass die Faktion die Stadt IST). */
const CITY_OF_FACTION = (f) => f;

// Reisekosten (CONSTANTS.TravelCost). Reisen unterbricht die laufende Arbeit,
// deshalb nur zweckgebunden und nie im Takt.
const TRAVEL_COST = 200e3;
// Drossel der Stadt-Faktions-Pruefung: sie liest den Aug-Katalog und kann reisen.
const CITY_TRY_MS = 60_000;
// Betriebssockel: so viel bleibt fuer Reisen/Klinik immer verfuegbar. Deckt sich
// bewusst mit der Reserve in TRADER/BANK — eine Untergrenze im System, nicht drei.
const OPERATING_FLOOR = 10e6;
// FIRMEN-LEITER — Einstieg zuerst, MegaCorps danach (Begründung: v1.1-Historie).
// v3.3: Firmen, bei denen NIE gearbeitet wird. FoodNStuff und Joe's Guns standen
// als "Einstieg" ganz vorn in der Leiter und gewannen damit immer (die Schleife
// nimmt den ersten Treffer) — live lief WORK 594 Zyklen bei FoodNStuff, obwohl es
// Stellen bei ECorp, MegaCorp, KuaiGong, Blade und Clarke hielt. Noodle Bar steht
// nicht in der Leiter, der Job stammt aus GENESIS' Frühphase; die Sperre verhindert,
// dass eine laufende Arbeit dort einfach weiterbehalten wird.
const NEVER_COMPANY = ["FoodNStuff", "Joe's Guns", "Noodle Bar"];
const COMPANY_LADDER = [
    { company: "CompuTek" },
    { company: "NetLink Technologies" }, { company: "Rho Construction" },
    { company: "Alpha Enterprises" }, { company: "Aevum Police Headquarters" },
    { company: "Galactic Cybersystems" }, { company: "Omnia Cybersystems" },
    { company: "Solaris Space Systems" }, { company: "DeltaOne" },
    { company: "Icarus Microsystems" }, { company: "Universal Energy" },
    { company: "Storm Technologies" }, { company: "Helios Labs" }, { company: "VitaLife" },
    { company: "Global Pharmaceuticals" }, { company: "Nova Medical" },
    { company: "Bachman & Associates", faction: "Bachman & Associates" },
    { company: "ECorp", faction: "ECorp" },
    { company: "Clarke Incorporated", faction: "Clarke Incorporated" },
    { company: "OmniTek Incorporated", faction: "OmniTek Incorporated" },
    { company: "NWO", faction: "NWO" },
    { company: "Blade Industries", faction: "Blade Industries" },
    { company: "MegaCorp", faction: "MegaCorp" },
    { company: "KuaiGong International", faction: "KuaiGong International" },
    { company: "Fulcrum Technologies", faction: "Fulcrum Secret Technologies" },
    { company: "Four Sigma", faction: "Four Sigma" },
];

// =============================================================================
// IO-SCHICHT (v2.0) — eine Wahrheit je Tick: INFO-Snapshot ODER evalNs
// =============================================================================
//
// io.refresh() liest die Blöcke EINMAL je Tick und legt den Modus fest.
// Reads liefern null, wenn die jeweilige Quelle nichts hergibt (Aufrufer
// behandeln null wie bisher als "unbekannt", NIE als "nein").
// io.act(cmd, args, evalCode) führt Aktionen aus:
//   INFO -> requestInfoAction("WORK", id, cmd, args) + Poll auf Port 30.
//   EVAL -> evalNs(evalCode).
// cmd-Namen = Whitelist in SCHWARM-INFO (RPC_CMDS); "eval" ist der Notausgang
// für Aufrufe ohne eigenen Whitelist-Eintrag (joinBladeburnerDivision u.a.).

function makeIo(ns) {
    const io = {
        mode: "EVAL", seq: 0,
        b: {},                                  // Tick-Cache der Blöcke
        sing: (cmd) => evalNs(ns, cmd),         // RAM-Dodge (v1-Pfad)

        refresh() {
            this.b = {
                bn: readInfoBlock(ns, "bn", Infinity),
                player: readInfoBlock(ns, "player", CFG.INFO_FRESH_MS),
                work: readInfoBlock(ns, "work", CFG.INFO_FRESH_MS),
                rep: readInfoBlock(ns, "rep", CFG.INFO_REP_AGE_MS),
                augs: readInfoBlock(ns, "augs", CFG.INFO_AUGS_AGE_MS),
                crime: readInfoBlock(ns, "crime", CFG.INFO_CRIME_AGE_MS),
                sleeves: readInfoBlock(ns, "sleeves", CFG.INFO_FRESH_MS),
                blade: readInfoBlock(ns, "blade", CFG.INFO_FRESH_MS),
                gang: readInfoBlock(ns, "gang", CFG.INFO_FRESH_MS),
            };
            this.mode = (this.b.bn && this.b.player) ? "INFO" : "EVAL";
            return this.mode;
        },

        // ---------- Reads (null = unbekannt) ----------
        async player()      { return this.mode === "INFO" ? this.b.player : await this.sing("ns.getPlayer()"); },
        async karma()       {
            if (this.mode === "INFO" && typeof this.b.player?.karma === "number") return this.b.player.karma;
            const k = await this.sing("(() => { try { return ns.heart.break(); } catch(e){ return null; } })()");
            return typeof k === "number" ? k : null;
        },
        async currentWork() { return this.mode === "INFO" ? (this.b.work ? this.b.work.currentWork : null) : await this.sing("ns.singularity.getCurrentWork()"); },
        async invitations() {
            if (this.mode === "INFO") return this.b.work ? (this.b.work.invitations || []) : null;
            return await this.sing("ns.singularity.checkFactionInvitations()");
        },
        async ownedAugs()   {
            if (this.mode === "INFO" && this.b.augs && Array.isArray(this.b.augs.owned)) return this.b.augs.owned;
            const o = await this.sing("ns.singularity.getOwnedAugmentations(true)");
            return Array.isArray(o) ? o : null;
        },
        async gangIn()      {
            if (this.mode === "INFO" && this.b.gang) return this.b.gang.member === true;
            const r = await this.sing("(() => { try { return ns.gang.inGang(); } catch(e){ return false; } })()");
            return (r === true || r === false) ? r : null;   // null = unbekannt (RAM)
        },
        async bladeIn()     {
            if (this.mode === "INFO" && this.b.blade) return this.b.blade.inDivision === true;
            const r = await this.sing("(() => { try { return ns.bladeburner.inBladeburner(); } catch(e){ return false; } })()");
            return r === true;
        },

        // ---------- Aktionen ----------
        async act(cmd, args, evalCode) {
            if (this.mode !== "INFO") return await this.sing(evalCode);
            const id = "W" + (++this.seq) + "-" + (Date.now() % 100000);
            if (!requestInfoAction(ns, "WORK", id, cmd, args)) return await this.sing(evalCode);
            const until = Date.now() + CFG.RPC_TIMEOUT_MS;
            while (Date.now() < until) {
                const r = readInfoActionResult(ns, "WORK", id);
                if (r) return r.ok ? (r.res === undefined ? null : r.res) : null;
                await ns.sleep(CFG.RPC_POLL_MS);
            }
            return null;   // Timeout — wie ein gescheiterter evalNs behandeln
        },
        async evalBig(code) { return await this.act("eval", [code], code); },
    };
    return io;
}

const J = (v) => JSON.stringify(v);

// =============================================================================

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    if (!ensureSingleInstance(ns)) { ns.tprint("WARN  [WORK] läuft bereits — beende diese Instanz."); return; }
    // v5.4: "Kein Auto-Tail" stand seit jeher im Kopf — und stimmte auch, WORK
    // ruft nirgends openTail. Trotzdem stand am 14.09. ein WORK-Fenster offen:
    // Bitburner stellt offene Tail-Fenster JE SKRIPT beim Neustart wieder her.
    // Nicht-Oeffnen genuegt dagegen nicht, nur Schliessen. Kostet 0 GB
    // (RamCostGenerator: openTail/closeTail stehen beide auf 0).
    if (ns.args.includes("--tail")) ns.ui.openTail();
    else { try { ns.ui.closeTail(); } catch (e) { /* kein Fenster da */ } }
    announce(ns, "start", `v${VERSION} — INFO-Modus + Sleeve-Rollen (15-min-Slots) + Firmen-Feldwahl`);

    const io = makeIo(ns);
    io.refresh();

    // ---------- SELBSTTEST ----------
    if (io.mode === "INFO") {
        ns.print("Selbsttest: INFO-Snapshot vorhanden — Reads über Port 28, Aktionen als RPC.");
    } else {
        const probeFak = await io.sing("ns.getPlayer().factions");
        if (probeFak === null) {
            announce(ns, "error", "Kein INFO-Snapshot UND evalNs liefert null (RAM/SF4) — WORK kann nichts tun.");
        } else {
            ns.print(`Selbsttest OK (EVAL-Modus) — ${Array.isArray(probeFak) ? probeFak.length : 0} Faktion(en).`);
        }
    }

    // ---------- Basis-Erkennung ----------
    let ownedAugs = (await io.ownedAugs()) || [];
    let isBN2 = false;
    if (io.b.bn) isBN2 = io.b.bn.bitNode === 2;
    else {
        try { const ri = await io.sing("ns.getResetInfo()"); if (ri && typeof ri.currentNode === "number") isBN2 = ri.currentNode === 2; }
        catch (e) { /* egal */ }
    }
    let gangsPossible = bitNodeFeatures(ns).gang;

    // ---------- Laufzeit-Zustand ----------
    let augGoals = {};
    let lastCityTry = 0;          // v4.0: Drossel der Stadt-Faktions-Pruefung
    let lastAugCalc = 0, lastWant = 0, lastRotate = 0, rotIdx = 0;
    let phase = "?";
    let bladeJoined = false, bladeBlocked = false, bladeJoinTries = 0;
    let sharing = false;
    const blockedCompanies = {};
    const timers = { lastCompanyRecheck: 0 };
    const companyPlans = {};        // Firma -> {ts, field, why} (Feldwahl-Cache)
    let lastSleeve = 0;
    let sleeveCount = -1;           // -1 = unbekannt; 0 = BitNode ohne Sleeves
    // v4.4: Export-Bonus. lastExportCheck bremst die Abfrage, die beiden anderen
    // sind nur fuer die Meldung im Log und im Bericht.
    let lastExportCheck = 0, lastExportAt = 0, exportBonusCount = 0;

    // v5.7 — SLOTFREIE TEILE VON PHASE 0 UND 1 WAEHREND EINES GRAFTINGS.
    // Beitritt und Gruendung beruehren den Arbeitsplatz nicht; das Training
    // davor bzw. das Karma-Farmen per Verbrechen schon (commitCrime ruft
    // finishWork) - die bleiben aus. Gedrosselt, weil jeder Versuch ein
    // Wegwerf-Skript startet.
    let lastSlotfrei = 0;
    const slotfreiWaehrendGrafting = async () => {
        if (Date.now() - lastSlotfrei < 300_000) return;
        lastSlotfrei = Date.now();
        // Bladeburner: beitreten, wenn die Kampfwerte schon reichen. Ohne
        // Training, und OHNE die Fehlversuche zu zaehlen - die Werte koennen
        // schlicht noch fehlen; das Zaehlen macht Phase 0 ausserhalb des Graftings.
        try {
            if (hasCapability(ns, CAPS.BLADE) && !bladeJoined && !bladeBlocked) {
                if ((await io.bladeIn()) === true) {
                    bladeJoined = true;
                } else {
                    const ok = await io.act("eval",
                        ["ns.bladeburner.joinBladeburnerDivision()"],
                        "ns.bladeburner.joinBladeburnerDivision()");
                    if (ok === true) {
                        bladeJoined = true;
                        ns.tprint("INFO  [WORK] Bladeburner-Division betreten (waehrend eines Graftings) — der BLADEBURNER-Daemon uebernimmt von selbst.");
                    }
                }
            }
        } catch (e) { ns.print("GRAFTING/BLADE: " + e); }
        // Gang: gruenden, wenn das Karma schon reicht - kein Verbrechen.
        try {
            if (gangsPossible && !isBN2 && (await io.gangIn()) === false) {
                const karma = await io.karma();
                if (typeof karma === "number" && karma <= CFG.KARMA_GOAL) {
                    for (const f of GANG_FAKTIONEN) {
                        let ok = false;
                        try {
                            ok = await io.act("eval", [`ns.gang.createGang(${JSON.stringify(f)})`],
                                `(() => { try { return ns.gang.createGang(${JSON.stringify(f)}); }`
                                + ` catch (e) { return false; } })()`);
                        } catch (e) { ok = false; }
                        if (ok === true) {
                            ns.tprint(`INFO  [WORK] Gang gegruendet: ${f} (waehrend eines Graftings).`);
                            break;
                        }
                    }
                }
            }
        } catch (e) { ns.print("GRAFTING/GANG: " + e); }
    };

    while (true) {
        let loopMs = CFG.LOOP_MS;
        try {
            const state = readManagedState(ns);
            updateFocus(ns, state);   // v3.11: nur noch CFG.FOCUS, keine INFIL-Kopplung
            io.refresh();

            let graftingJetzt = false;   // v5.7: gesetzt im Grafting-Schutz, ausgewertet vor Phase 0
            // ================= GRAFTING-SCHUTZ ===============================
            // v4.5 — DER SCHUTZ LAS DEN SCHNAPPSCHUSS, NICHT DIE WIRKLICHKEIT.
            //
            // io.currentWork() liefert im INFO-Modus den work-Block aus dem
            // INFO-Schnappschuss (Zeile 686), nicht das Ergebnis einer eigenen
            // Abfrage. Der Block wird nur alle paar Sekunden erneuert. Startet
            // BANK in der Zwischenzeit einen Graft, sieht dieser Schutz noch
            // "keine Arbeit" — und WORK greift sich den Slot. Der Graft ist weg,
            // und mit ihm Stunden.
            //
            // Der Wert kostet nichts (Wegwerf-Skript ueber sing), und die
            // Schleife laeuft alle 20 s. Einmal live fragen ist hier also
            // billig — und es ist die einzige Stelle, an der Genauigkeit
            // wirklich zaehlt.
            //
            // IM ZWEIFEL PAUSIEREN: liefert die Live-Abfrage nichts (Fehler,
            // oder gerade keine Arbeit), wird zusaetzlich der Schnappschuss
            // angesehen. Faelschlich pausieren kostet einen Takt von 20 s;
            // faelschlich zugreifen kostet einen ganzen Graft. Die Kosten sind
            // so ungleich, dass die Richtung eindeutig ist.
            {
                let cw = null;
                try { cw = await io.sing("ns.singularity.getCurrentWork()"); }
                catch (e) { cw = null; }
                if (!cw) {
                    try { cw = await io.currentWork(); } catch (e) { cw = null; }
                }
                if (cw && cw.type === "GRAFTING") {
                    // v5.7: NICHT mehr sofort weg. Hier nur die Sleeves; danach laufen
                    // Export-Bonus und Einmal-Aktionen normal weiter (beruehren den
                    // Arbeitsplatz nicht). Ausgestiegen wird erst VOR Phase 0.
                    ns.print("GRAFTING läuft (BANK) — Arbeitsplatz bleibt unberührt, slotfreie Aufgaben laufen weiter.");
                    const r = await driveSleeves(ns, io, state, {
                        mode: "REP", augGoals, sleeveCount, lastSleeve,
                    });
                    sleeveCount = r.count; lastSleeve = r.ts;
                    graftingJetzt = true;
                }
            }

            // ================= EXPORT-BONUS (v4.4) ============================
            // Steht VOR den Payload-Wuenschen, aber nach dem Grafting-Schutz:
            // waehrend eines Grafts wird der Slot ohnehin nicht angefasst, und
            // ein Backup dort auszuloesen waere unnoetiger Laerm.
            // Die Abfrage kostet 0,5 GB und laeuft hoechstens halbstuendlich;
            // der Bonus selbst faellt nur alle 24 h an.
            if (EXPORT_BONUS_AKTIV && Date.now() - lastExportCheck >= EXPORT_CHECK_MS) {
                lastExportCheck = Date.now();
                try {
                    const faellig = await io.sing("(()=>{try{return ns.singularity.exportGameBonus();}catch(e){return false;}})()");
                    if (faellig === true) {
                        // exportGame ist async und bucht den Favor als ERSTES.
                        await io.sing("(async()=>{try{await ns.singularity.exportGame();return true;}catch(e){return false;}})()");
                        exportBonusCount++;
                        lastExportAt = Date.now();
                        try {
                            writeOutField(ns, SCHWARM_PORTS.WORK_OUT, "exportBonus",
                                { at: lastExportAt, n: exportBonusCount });
                        } catch (e) { /* Anzeige ist Komfort, kein Muss */ }
                        ns.print(`EXPORT-BONUS geholt (+1 Favor auf jede Mitgliedsfaktion). `
                            + `Insgesamt ${exportBonusCount}x in diesem Lauf. `
                            + `Eine Save-Datei liegt jetzt im Download-Ordner.`);
                    }
                } catch (e) { /* kein SF4 oder API weg — nie den Takt reissen */ }
            }

            // ================= PAYLOAD-WÜNSCHE (Port 22) ======================
            const now = Date.now();
            // v5.6: HIER STANDEN WANT/DROP FUER GANGS UND BLADEBURNER. Entfernt —
            // beide gehoeren seit HELPERS v5.13 der QUEEN. Siehe Kopf.
            // `now` bleibt stehen, falls weiter unten jemand es liest.
            void now;

            // ================= EINMAL-AKTIONEN (v4.0) ========================
            //
            // WARUM HIER UND NICHT IN PHASE 2: PHASE 1 (Karma) endet mit
            // `continue`. Alles, was in PHASE 2 stand — Einladungen annehmen,
            // breite Bewerbung, Stadt-Faktionen — war damit unerreichbar,
            // solange keine Gang existiert und das Karma-Ziel nicht erreicht
            // ist. Live: fuenf offene Einladungen, null Jobs, 303 Zyklen
            // Homicide.
            //
            // Alle drei Aktionen sind Sekundensachen und fassen den Arbeitsslot
            // NICHT an (applyToCompany setzt nur this.jobs, joinFaction nur die
            // Faktions-Flags). Reisen unterbricht die Arbeit — es steht deshalb
            // unter einer eigenen Bedingung und laeuft nur, wenn es tatsaechlich
            // einen Beitritt ermoeglicht.
            try {
                // (1) BREITE BEWERBUNG. applySweep gab es schon, wurde aber NUR
                // im Bladeburner-Slot-Zweig gerufen (also nur ohne installiertes
                // Simulacrum). Mit Simulacrum lief es nie.
                await applySweep(ns, io);

                // (2) EINLADUNGEN. Stadt-Faktionen bleiben ausgenommen, sie
                // laufen ueber (3) — ein Beitritt dort bannt Konkurrenten.
                const inv = await io.invitations();
                if (Array.isArray(inv)) {
                    for (const f of inv) {
                        if (CITY_FACTIONS.includes(f)) continue;
                        const ok = await io.act("joinFaction", [f], `ns.singularity.joinFaction(${J(f)})`);
                        if (ok === true) ns.print(`BEITRITT: ${f}`);
                    }
                }

                // (2b) ORTSGEBUNDENE FAKTIONEN (v4.7). Steht VOR den
                // Stadt-Faktionen und ohne deren Phase-0-Sperre: diese vier
                // bannen niemanden (keine `enemies`), die Entscheidung ist also
                // nicht irreversibel und darf jederzeit fallen. Gereist wird
                // ohnehin nur, wenn dadurch wirklich eine Einladung moeglich
                // wird — die Funktion prueft das selbst.
                let ortGereist = null;
                try {
                    let dabei = [];
                    try {
                        const pl = await io.player();
                        if (pl && Array.isArray(pl.factions)) dabei = pl.factions;
                    } catch (e2) { dabei = []; }
                    const km = await io.karma();
                    ortGereist = await ortFaktionStep(ns, io, dabei, typeof km === "number" ? km : 0);
                } catch (e2) { ns.print("ORTSFAKTION: " + e2); }

                // (3) STADT-FAKTIONEN. Erst wenn PHASE 0 durch ist: solange die
                // Kampfstats trainiert werden, soll keine irreversible
                // Gruppenwahl fallen (Gyms gibt es nur in Sector-12, Aevum und
                // Volhaven — LocationsMetadata.ts).
                // v4.9 — NUR EIN REISENDER JE TAKT.
                //
                // Beide Schritte aendern DIESELBE Sache: die Stadt des Spielers.
                // cityFactionStep reist ueber ensureCity zur Stadt seiner
                // Gruppe, ortFaktionStep zur ertragreichsten Ortsfaktion. Ziehen
                // sie in verschiedene Richtungen (Gruppe Sector-12, Tian Di Hui
                // in Chongqing), ueberschreibt der zweite die Fahrt des ersten —
                // im SELBEN Takt, also womoeglich bevor die Engine ueberhaupt
                // ihre Einladungspruefung faehrt. Zwei Fahrten zu je 200k, und
                // beide Male wird die laufende Arbeit unterbrochen.
                //
                // Dieselbe Fehlerform wie bei der Jobwahl (Sweep 30 s gegen
                // Recheck 2 min): zwei Uhren auf einer Ressource.
                //
                // Vorrang hat die ORTSFAKTION, aus einem sachlichen Grund: ihr
                // Beitritt bannt niemanden, ist also nie ein Fehler. Die
                // Stadt-Gruppen sind unumkehrbar und koennen einen Takt warten.
                const phase0Done = !hasCapability(ns, CAPS.BLADE) || bladeJoined || bladeBlocked;
                if (ortGereist) {
                    ns.print(`STADT-FAKTION: diesen Takt uebersprungen — die Ortsfaktion `
                        + `reist gerade nach ${ortGereist}.`);
                } else if (phase0Done && now - lastCityTry >= CITY_TRY_MS) {
                    lastCityTry = now;
                    await cityFactionStep(ns, io, ownedAugs);
                }
            } catch (e) { ns.print("EINMAL-AKTIONEN: " + e); }

            // ================= v5.7: AUSSTIEG WAEHREND EINES GRAFTINGS ========
            // Alles AB HIER beruehrt den Arbeitsplatz (Training, Verbrechen,
            // Fraktions- und Firmenarbeit) und wuerde den Graft abbrechen.
            // Vorher nur noch die slotfreien Teile von Phase 0 und 1.
            if (graftingJetzt) {
                await slotfreiWaehrendGrafting();
                clearFocusFlank();
                await ns.sleep(loopMs);
                continue;
            }

            // ================= PHASE 0: BLADE-UNLOCK =========================
            // =============================================================
            // v4.8 — DIE ABSAGE STEHT VON ANFANG AN FEST, MAN MUSS SIE NUR LESEN
            // =============================================================
            // Der Beitritt scheiterte bisher erst NACH BLADE_JOIN_TRIES
            // Versuchen — und jeder Versuch setzt voraus, dass die Kampfstats
            // vorher auf 100 hochtrainiert sind (bladeUnlockStep). In einer
            // BitNode ohne Bladeburner-Rang ist das eine ganze Phase Arbeit fuer
            // eine Absage, die von der ersten Sekunde an feststeht:
            //
            //   NetscriptFunctions/Bladeburner.ts:341
            //     if (currentNodeMults.BladeburnerRank === 0) return false;
            //         "Bladeburner is disabled in this BitNode."
            //
            // Genau diesen Wert kann der Schwarm selbst lesen. bladeRankPaysIn
            // liefert null, wenn er unbekannt ist (kein SF5) — dann bleibt es
            // beim alten Verhalten mit den Fehlversuchen. Kein Raten.
            //
            // Die Kampfstats sind trotzdem nicht umsonst: Tetrads verlangt 75,
            // The Dark Army 300. Sie werden nur nicht mehr FUER BLADEBURNER
            // erarbeitet, und WORK haengt nicht in Phase 0 fest.
            if (!bladeBlocked && bladeRankPaysIn(io) === false) {
                bladeBlocked = true;
                announce(ns, "start", "Bladeburner ist in dieser BitNode abgeschaltet "
                    + "(BladeburnerRank = 0) — Phase 0 wird uebersprungen, direkt zu Rep.");
            }

            // =============================================================
            // v5.5 — FREISCHALTEN IST NICHT DASSELBE WIE BETREIBEN
            // =============================================================
            // Hier stand zusaetzlich isDaemonEnabled(ns, "BLADEBURNER", state).
            // Damit blockierte ein von Hand abgeschalteter DAEMON auch den
            // BEITRITT zur Division — zwei voellig verschiedene Dinge:
            //
            //   Beitritt  einmalig, kostenlos, unumkehrbar-in-die-richtige-
            //             Richtung. Er nimmt nichts weg und macht nichts an.
            //   Daemon    die laufende Steuerung. DIE gehoert dem Schalter.
            //
            // Wer den Daemon ausschaltet, sagt "steuere das nicht" — nicht
            // "lass mich draussen". Und wer spaeter einschaltet, musste bisher
            // erst noch den ganzen Beitritt abwarten, obwohl die Kampfwerte
            // seit Stunden reichten.
            //
            // Ob BLADEBURNER als Daemon laeuft, entscheidet seit v5.6 allein
            // die QUEEN ueber den Schalter — WORK fordert nichts mehr an.
            if (hasCapability(ns, CAPS.BLADE) && !bladeJoined && !bladeBlocked) {
                const inDiv = await io.bladeIn();
                if (inDiv === true) {
                    bladeJoined = true;
                    announce(ns, "start", "Bladeburner-Division bereits betreten.");
                } else {
                    const done = await bladeUnlockStep(ns, io);
                    if (done) {
                        const ok = await io.act("eval",
                            ["ns.bladeburner.joinBladeburnerDivision()"],
                            "ns.bladeburner.joinBladeburnerDivision()");
                        if (ok === true) {
                            bladeJoined = true;
                            ns.tprint("INFO  [WORK] Bladeburner-Division betreten — der BLADEBURNER-Daemon uebernimmt von selbst.");
                        } else {
                            bladeJoinTries++;
                            if (bladeJoinTries >= CFG.BLADE_JOIN_TRIES) {
                                bladeBlocked = true;
                                announce(ns, "start",
                                    "Bladeburner in dieser BitNode nicht beitretbar (Rank=0) — überspringe Phase, gehe zu Rep.");
                            } else {
                                ns.print(`BLADE-UNLOCK: Stats>=100, Beitritt abgelehnt (${bladeJoinTries}/${CFG.BLADE_JOIN_TRIES}).`);
                            }
                        }
                    }
                    if (!bladeBlocked) {
                        phase = "BLADE-UNLOCK";
                        if (sharing) { publishShareWanted(ns, false); sharing = false; }
                        loopMs = CFG.UNLOCK_LOOP_MS;
                        const r = await driveSleeves(ns, io, state, {
                            mode: "UNLOCK", augGoals: null, sleeveCount, lastSleeve,
                        });
                        sleeveCount = r.count; lastSleeve = r.ts;
                        clearFocusFlank();
                        await ns.sleep(loopMs);
                        continue;
                    }
                }
            }

            // ================= SLOT-ABGABE AN BLADEBURNER ====================
            // v3.8 BUGFIX: ownedAugs HIER auffrischen, nicht erst weiter unten.
            //
            // Der Kreis: ownedAugs wurde einmal beim Start geladen (Z. 435) und erst
            // nach diesem Block wieder (im AUG_REFRESH_MS-Takt). Der Block endet aber
            // mit `continue` — die Auffrischung wurde also NIE erreicht, solange WORK
            // den Slot abgegeben hatte. Damit erfuhr WORK nie, dass es das Simulacrum
            // inzwischen besitzt, und blieb dauerhaft in der Slot-Abgabe haengen.
            // Live: nach dem Bladeburner-Beitritt lief 30 min lang gar keine Arbeit
            // (currentWork null), erst ein manueller Neustart loeste es — weil Z. 435
            // beim Start neu ausgefuehrt wird. Das war der einzige Ausweg.
            if (now - lastAugCalc >= CFG.AUG_REFRESH_MS) {
                lastAugCalc = now;
                const o0 = await io.ownedAugs();
                if (Array.isArray(o0)) ownedAugs = o0;
                augGoals = await computeAugGoals(ns, io, ownedAugs);
            }
            const simHave = ownedAugs.includes(SIMULACRUM);
            if (bladeJoined && !simHave) {
                // Der Slot gehoert dem Bladeburner-Daemon: Bladeburner.process()
                // bricht JEDE Aktion ab, sobald Player.currentWork gesetzt ist
                // (geprueft mit ignoreQueued=true, es zaehlt also nur ein
                // INSTALLIERTES Simulacrum). WORK darf hier nichts in den Slot legen.
                //
                // v3.8: "Slot frei lassen" heisst aber nicht "gar nichts tun".
                // applyForJob setzt nur this.jobs[...] und fasst currentWork NICHT an
                // (PlayerObjectGeneralMethods) — Bewerbungen sind also erlaubt und
                // bauen weiter Firmen-Zugang auf, waehrend Bladeburner den Slot hat.
                phase = "BLADE (Slot an Bladeburner, kein Simulacrum)";
                if (sharing) { publishShareWanted(ns, false); sharing = false; }
                // v4.5: null = "keine Firmenarbeit" — Bladeburner haelt hier den Slot,
                // es gibt also keine Stelle zu schuetzen und keinen Aufruf zu bezahlen.
                try { await applySweep(ns, io, null); } catch (e) { ns.print("Bewerbungen: " + e); }
                const r = await driveSleeves(ns, io, state, {
                    mode: "REP", augGoals, sleeveCount, lastSleeve,
                });
                sleeveCount = r.count; lastSleeve = r.ts;
                await ns.sleep(CFG.LOOP_MS);
                continue;
            }

            // ================= PHASE 1: KARMA ================================
            if (gangsPossible && !isBN2) {
                const inGang = await io.gangIn();
                if (inGang === false) {
                    const karma = await io.karma();
                    if (typeof karma === "number" && karma > CFG.KARMA_GOAL) {
                        // forceKarma: hier wird auf die GANG-Gründung gefarmt
                        // (-54000). Die Faktions-Tore sind längst passiert, würden
                        // also fälschlich auf Geld umschalten.
                        await doCrime(ns, io, karma, null, "karma");
                        phase = "KARMA";
                        if (sharing) { publishShareWanted(ns, false); sharing = false; }
                        const r = await driveSleeves(ns, io, state, {
                            mode: "REP", augGoals, sleeveCount, lastSleeve,
                        });
                        sleeveCount = r.count; lastSleeve = r.ts;
                        await ns.sleep(CFG.LOOP_MS);
                        continue;
                    }

                    // =====================================================
                    // v5.5 — DIE GRUENDUNG GEHOERT HIERHER, NICHT IN DIE NUTZLAST
                    // =====================================================
                    // Bisher stand createGang() in SCHWARM-GANG.js (der
                    // GANGS-Nutzlast). Die laeuft aber nur, wenn der Schalter an
                    // ist — und der Schalter ueberlebt den Prestige. Wer GANGS
                    // irgendwann von Hand abgeschaltet hatte, farmte danach in
                    // JEDEM weiteren Durchlauf brav die 54.000 Karma und
                    // gruendete dann nichts. Die Arbeit war getan, die Tuer
                    // blieb zu.
                    //
                    // Gruenden ist wie der Bladeburner-Beitritt eine
                    // FREISCHALTUNG: einmalig, kostenlos, und sie startet
                    // nichts. Deshalb macht es WORK, das immer laeuft.
                    // Ob die Gang danach GESTEUERT wird, entscheidet weiterhin
                    // allein der Schalter ueber sendSpawnWant.
                    //
                    // Reihenfolge nach Staerke: die erste Faktion, die
                    // createGang annimmt, gewinnt. Ausserhalb von BN2 lehnt die
                    // Engine ab, solange das Karma nicht reicht — deshalb steht
                    // dieser Zweig hinter der Karma-Pruefung und nicht davor.
                    for (const f of GANG_FAKTIONEN) {
                        let ok = false;
                        try {
                            ok = await io.act("eval", [`ns.gang.createGang(${JSON.stringify(f)})`],
                                `(() => { try { return ns.gang.createGang(${JSON.stringify(f)}); }`
                                + ` catch (e) { return false; } })()`);
                        } catch (e) { ok = false; }
                        if (ok === true) {
                            ns.tprint(`INFO  [WORK] Gang gegruendet: ${f}. `
                                + `(Ob sie gesteuert wird, entscheidet der GANGS-Schalter.)`);
                            try { announce(ns, "start", `Gang gegruendet: ${f}`); } catch (e) { /* Beiwerk */ }
                            break;
                        }
                    }
                }
            }

            // ================= PHASE 2: REP ==================================
                phase = "REP";
            // v3.2 BUGFIX: KEINE Sperre mehr. Port 23 trägt einen ZEITSTEMPEL, der
            // nach SHARE_MAX_AGE_MS (90 s) verfällt — readShareWanted liefert danach
            // false. Mit `if (!sharing)` schrieb WORK ihn genau EINMAL und frischte
            // ihn nie wieder auf: der Grind war nach 90 s tot, während WORK dachte,
            // er laufe. Live gemessen: Zeitstempel 1476 s alt, Share-Bonus 1.000000.
            // Vorher fiel das nicht auf, weil schwarm-s.js eine Endlosschleife ist
            // und niemand die Worker tötete; Dispatcher v9.1 räumt jetzt auf und hat
            // den Fehler damit sichtbar gemacht. Port-Schreiben kostet 0 GB.
            publishShareWanted(ns, true); sharing = true;

            // (Einladungen werden seit v4.0 im Block EINMAL-AKTIONEN oben
            //  angenommen — PHASE 2 war fuer sie unerreichbar, solange PHASE 1
            //  mit `continue` endet.)

            if (now - lastAugCalc >= CFG.AUG_REFRESH_MS) {
                lastAugCalc = now;
                const o = await io.ownedAugs();
                if (Array.isArray(o)) ownedAugs = o;
                augGoals = await computeAugGoals(ns, io, ownedAugs);
            }

            const repRes = await doReputation(ns, io, augGoals, () => {
                if (now - lastRotate >= CFG.ROTATE_MS) { lastRotate = now; rotIdx++; }
                return rotIdx;
            }, blockedCompanies, timers, companyPlans);

            const r = await driveSleeves(ns, io, state, {
                mode: "REP", augGoals, sleeveCount, lastSleeve,
                // Frisch gesetzte Player-Faktion durchreichen: der work-Block im
                // Snapshot hinkt bis zu INFO_FRESH_MS hinterher — ohne Override
                // würde ein Sleeve dieselbe Faktion greifen (Engine wirft).
                workFacOverride: repRes && repRes.faction ? repRes.faction : null,
            });
            sleeveCount = r.count; lastSleeve = r.ts;

        } catch (e) {
            ns.print("FEHLER: " + e);
        }
        ns.print(`Phase: ${phase} [${io.mode}]`);
        clearFocusFlank();
        await ns.sleep(loopMs);
    }
}

// =============================================================================
// PHASE 0 — BLADE-UNLOCK
// =============================================================================

/** Einen Schritt Richtung 100/100/100/100. true = alle Kampfstats am Ziel. */
async function bladeUnlockStep(ns, io) {
    const p = await io.player();
    if (!p || !p.skills) return false;
    const sk = p.skills;

    let weakest = COMBAT_STATS[0], min = Infinity;
    for (const s of COMBAT_STATS) {
        const v = sk[s.skill] || 0;
        if (v < min) { min = v; weakest = s; }
    }
    if (min >= CFG.BLADE_STAT_GOAL) return true;

    publishHashNeed(ns, "WORK", { doing: min < CFG.GYM_UNTIL ? "GYM" : "CRIME" });

    if (min < CFG.GYM_UNTIL) {
        const gym = CITY_GYMS[p.city];
        if (gym) {
            const cur = await io.currentWork();
            const busyRight = cur && cur.type === "CLASS" && cur.classType &&
                String(cur.classType).toLowerCase().includes(weakest.key);
            if (!busyRight || focusFlank()) {
                await io.act("gymWorkout", [gym, weakest.key, FOCUS()],
                    `ns.singularity.gymWorkout(${J(gym)}, ${J(weakest.key)}, ${FOCUS()})`);
            }
            ns.print(`BLADE-UNLOCK: Gym ${weakest.key} ${min}/${CFG.BLADE_STAT_GOAL} (@${gym})`);
            return false;
        }
    }

    const karma = await io.karma();
    // v3.6: Kampf-Exp je Sekunde maximieren — NICHT Geld. Siehe doCrime.
    await doCrime(ns, io, typeof karma === "number" ? karma : 0, null, "combat");
    ns.print(`BLADE-UNLOCK: Crime. Schwächster: ${weakest.key} ${min}/${CFG.BLADE_STAT_GOAL}`);
    return false;
}

// =============================================================================
// CRIME (Phase 0 Trainingsweg + Phase 1 Karma)
// =============================================================================

/** Bestes Verbrechen wählen und begehen. Homicide, sobald die Chance reicht. */
/**
 * BEWERBUNGS-SWEEP (v3.8) — bewirbt sich der Reihe nach bei allen Firmen der
 * Leiter, ohne den Work-Slot anzufassen.
 *
 * ENGINE (PlayerObjectGeneralMethods, applyForJob): die Funktion setzt genau
 * `this.jobs[company.name] = pos.name` und fasst `currentWork` NICHT an. Bewerben
 * unterbricht also weder Faktionsarbeit noch eine Bladeburner-Aktion. Zusaetzlich
 * klettert applyForJob intern selbst zur hoechsten Position, fuer die man dort
 * qualifiziert ist — WORK muss keine Leiter ablaufen und nichts nachrechnen.
 *
 * DROSSELUNG: SWEEP_PER_RUN Firmen je Aufruf, rotierend. 38 Firmen mal alle Felder
 * auf einmal waeren mehrere hundert Singularity-Aufrufe in einem Takt; die Engine
 * ist single-threaded und wuerde ruckeln.
 *
 * BEWUSSTE GRENZE: der Sweep laeuft nur ueber COMPANY_LADDER, nicht ueber alle 38
 * Firmen des Spiels. Die vollstaendige Namensliste liess sich aus dem Projektabzug
 * nicht sicher aufloesen (das CompanyName-Enum fehlt dort), und geratene Namen
 * haben schon einmal einen stillen Totalausfall verursacht (Congruity, BANK v1.5).
 * Die Leiter enthaelt verifizierte Namen; eine Erweiterung braucht die echte Liste.
 */
/**
 * STADT-FAKTIONEN (v4.0). Ein Schritt je Aufruf, gedrosselt ueber CITY_TRY_MS.
 *   1. Gruppe bestimmen (pickCityGroup). Ist eine angebrochen, gewinnt sie.
 *   2. Innerhalb der Gruppe die naechste Faktion, der wir nicht angehoeren und
 *      deren Geldschwelle der Kontostand deckt.
 *   3. In deren Stadt reisen (nur wenn noetig) und beitreten.
 *
 * ZUR SCHWELLE: inviteReqs = [locatedInCity(x), haveMoney(n)]. Das Geld wird
 * NICHT abgebucht, es muss nur da sein — geprueft gegen den Kontostand OHNE den
 * Betriebssockel.
 * ZUR EINLADUNG: nach dem Reisen dauert es bis zum naechsten Engine-Tick, bis
 * sie erscheint. Hier wird nicht gewartet; der naechste Durchlauf nimmt sie auf.
 */
/**
 * Erfuellt der Spieler alles ausser dem Aufenthaltsort? (v4.7)
 * @returns {boolean}
 */
function ortFaktionReif(f, p, karma) {
    const sk = (p && p.skills) || {};
    const kampf = Math.min(sk.strength || 0, sk.defense || 0, sk.dexterity || 0, sk.agility || 0);
    if ((sk.hacking || 0) < f.hack) return false;
    if (kampf < f.kampf) return false;
    if ((p && p.money !== undefined ? p.money : 0) < f.geld) return false;
    // haveKarma(-18) heisst "Karma <= -18". Bei karma-Anforderung 0 ist nichts zu pruefen.
    if (f.karma < 0 && !(typeof karma === "number" && karma <= f.karma)) return false;
    return true;
}

// Wann wurde zuletzt fuer eine Ortsfaktion gereist? Schuetzt vor einer
// Reiseschleife, falls die Einladung wider Erwarten ausbleibt (z. B. weil sich
// das Karma zwischendurch wieder verbessert hat).
let ortReiseAt = 0;
const ORT_REISE_MS = 300_000;   // hoechstens alle 5 Minuten

/**
 * v4.7 — Fuer ortsgebundene Faktionen in die richtige Stadt reisen.
 *
 * Gereist wird NUR, wenn dadurch tatsaechlich eine Einladung moeglich wird:
 * mindestens eine Faktion muss alle Bedingungen ausser dem Ort erfuellen. Das
 * ist dieselbe Regel, unter der auch cityFactionStep reist — Reisen
 * unterbricht die Arbeit und bringt INFIL aus dem Tritt.
 *
 * Angesteuert wird die Stadt, die die MEISTEN offenen Faktionen freischaltet;
 * bei Gleichstand die erste. Chongqing gewinnt damit in der Regel, weil dort
 * drei der vier zu holen sind.
 *
 * Das Annehmen der Einladung passiert nicht hier, sondern im normalen
 * Einladungs-Zweig — der ueberspringt nur CITY_FACTIONS, und keine dieser vier
 * steht dort drin.
 *
 * @returns {Promise<string|null>} angesteuerte Stadt oder null
 */
async function ortFaktionStep(ns, io, joined, karma) {
    const now = Date.now();
    if (now - ortReiseAt < ORT_REISE_MS) return null;

    let p = null;
    try { p = await io.player(); } catch (e) { return null; }
    if (!p) return null;
    const dabei = Array.isArray(joined) ? joined : (Array.isArray(p.factions) ? p.factions : []);

    // Offene Kandidaten: nicht Mitglied, alles ausser dem Ort erfuellt.
    const offen = ORT_FAKTIONEN.filter(f => !dabei.includes(f.name) && ortFaktionReif(f, p, karma));
    if (offen.length === 0) return null;

    // Bin ich schon in einer passenden Stadt? Dann ist nichts zu tun — die
    // Einladung kommt binnen zwei Sekunden von selbst.
    const hier = offen.filter(f => f.staedte.includes(p.city));
    if (hier.length > 0) {
        ns.print(`ORTSFAKTION: warte in ${p.city} auf Einladung (${hier.map(f => f.name).join(", ")}).`);
        return null;
    }

    // Stadt mit der groessten Ausbeute waehlen.
    const zaehler = new Map();
    for (const f of offen) for (const s of f.staedte) zaehler.set(s, (zaehler.get(s) || 0) + 1);
    let ziel = null, bestN = 0;
    for (const [s, n] of zaehler) if (n > bestN) { bestN = n; ziel = s; }
    if (!ziel) return null;

    let cash = 0;
    try { cash = ns.getServerMoneyAvailable("home"); } catch (e) { cash = 0; }
    if (cash - OPERATING_FLOOR < TRAVEL_COST) {
        ns.print(`ORTSFAKTION: ${ziel} wuerde ${offen.filter(f => f.staedte.includes(ziel)).length} Faktion(en) `
            + `oeffnen, aber die Reise ist ueber dem Betriebssockel nicht bezahlbar.`);
        return null;
    }

    const ok = await io.act("travelToCity", [ziel],
        `(() => { try { return ns.singularity.travelToCity(${J(ziel)}); } catch (e) { return false; } })()`);
    if (ok !== true) return null;
    ortReiseAt = now;
    const namen = offen.filter(f => f.staedte.includes(ziel)).map(f => f.name).join(", ");
    ns.print(`ORTSFAKTION: nach ${ziel} gereist — oeffnet ${namen}.`);
    return ziel;
}

async function cityFactionStep(ns, io, ownedAugs) {
    // Der Aug-Katalog kommt aus dem INFO-augs-Block (dieselbe Quelle wie
    // computeAugGoals). Ohne ihn gibt es keine begruendbare Wahl — und eine
    // irreversible Entscheidung auf Verdacht ist schlechter als keine.
    const catalog = (io.b && io.b.augs && io.b.augs.catalog) ? io.b.augs.catalog : null;
    if (!catalog) {
        ns.print("STADT-FAKTION: kein Aug-Katalog (INFO-Block fehlt) — Wahl verschoben.");
        return;
    }
    let joined = [];
    try {
        const p = await io.player();
        if (p && Array.isArray(p.factions)) joined = p.factions;
    } catch (e) { return; }

    const pick = pickCityGroup(catalog, ownedAugs, joined);
    if (!pick || !pick.group) return;
    const g = pick.group;
    const open = g.members.filter(([f]) => !joined.includes(f));
    if (open.length === 0) return;             // Gruppe vollstaendig
    let cash = 0;
    try { cash = ns.getServerMoneyAvailable("home"); } catch (e) { cash = 0; }
    const usable = cash - OPERATING_FLOOR;

    // =========================================================================
    // v4.1 BUGFIX — BEITRETEN BRAUCHT KEINE REISE
    // =========================================================================
    // Hier wurde bisher IMMER erst gereist und danach beigetreten. Das ist eine
    // Bedingung zu viel: die Engine prueft bei joinFaction genau zwei Dinge
    // (NetscriptFunctions/Singularity.ts:783-791) — bin ich schon Mitglied, und
    // liegt eine Einladung vor. Ein Ortsvergleich kommt dort NICHT vor.
    //
    // Die Stadt steht allein in den EINLADUNGS-Bedingungen
    // (Faction/FactionInfo.tsx:541): inviteReqs = [locatedInCity(...),
    // haveMoney(...)]. Sie gilt also fuers BEKOMMEN der Einladung, nicht fuers
    // Annehmen. Liegt die Einladung schon vor, ist die Fahrt reine Verschwendung
    // — 200k, und sie unterbricht die laufende Arbeit, was INFIL jedes Mal aus
    // dem Tritt bringt. Im Lagebild standen ueber Stunden drei offene
    // Einladungen (Aevum, Volhaven, Sector-12) unbeantwortet daneben.
    //
    // ZWEITER FEHLER derselben Zeile: die Geldpruefung "usable < need" stand VOR
    // dem Beitritt. "need" ist aber die Schwelle fuer die EINLADUNG. Lag sie
    // schon vor und war das Geld inzwischen ausgegeben, blieb sie liegen,
    // obwohl der Beitritt nichts kostet.
    let offeneEinladungen = [];
    try {
        const inv = await io.invitations();
        if (Array.isArray(inv)) offeneEinladungen = inv;
    } catch (e) { /* ohne Liste faellt der Zweig unten einfach durch */ }

    // Liegt fuer IRGENDEINE offene Faktion der Gruppe eine Einladung vor, wird
    // die zuerst angenommen — kostenlos und ohne Ortswechsel.
    const sofort = open.find(function (m) { return offeneEinladungen.indexOf(m[0]) >= 0; });
    if (sofort) {
        const facS = sofort[0];
        const erstS = !g.members.some(function (m) { return joined.indexOf(m[0]) >= 0; });
        if (erstS) {
            const andere = CITY_GROUPS.filter(function (x) { return x !== g; })
                .map(function (x) { return x.name; }).join(" / ");
            ns.tprint(`INFO  [WORK] Stadt-Gruppe "${g.name}" gewaehlt (${pick.why}). `
                + `Damit sind ${andere} bis zum naechsten Aug-Install gesperrt.`);
        }
        const okS = await io.act("joinFaction", [facS], `ns.singularity.joinFaction(${J(facS)})`);
        ns.print(okS === true
            ? `BEITRITT: ${facS} (Gruppe ${g.name}) — Einladung lag vor, keine Reise noetig.`
            : `STADT-FAKTION ${facS}: Beitritt abgelehnt, obwohl eine Einladung gemeldet war.`);
        return;
    }

    // Ab hier: keine Einladung vorhanden. Nur JETZT hilft die Stadt — und auch
    // nur mit dem noetigen Geld, sonst waere die Fahrt umsonst.
    // Guenstigste offene Faktion zuerst: am schnellsten erreichbar, und jede
    // weitere der Gruppe bleibt danach ohnehin moeglich.
    open.sort(function (a, b) { return a[1] - b[1]; });
    const [fac, need] = open[0];
    if (usable < need) {
        ns.print(`STADT-FAKTION ${fac} (${g.name}): ${formatMoney(usable)} von `
            + `${formatMoney(need)} verfuegbar — wartet. ${pick.why}.`);
        return;
    }
    // Die Reise lohnt nur, wenn nach der Fahrt noch die Einladungsschwelle
    // steht. Ohne diese Zeile faehrt WORK fuer 200k hin und steht dann mit zu
    // wenig Geld da.
    if (usable - TRAVEL_COST < need) {
        ns.print(`STADT-FAKTION ${fac}: Reise verschoben — nach ${formatMoney(TRAVEL_COST)} `
            + `Fahrt blieben ${formatMoney(usable - TRAVEL_COST)}, noetig sind ${formatMoney(need)}.`);
        return;
    }

    // Erste Wahl der Gruppe laut ins Terminal: sie sperrt die anderen Gruppen
    // bis zum naechsten Aug-Install (isBanned, Faction.ts:77-85).
    const firstOfGroup = !g.members.some(([f]) => joined.includes(f));
    if (firstOfGroup) {
        const others = CITY_GROUPS.filter(x => x !== g).map(x => x.name).join(" / ");
        ns.tprint(`INFO  [WORK] Stadt-Gruppe "${g.name}" gewaehlt (${pick.why}). `
            + `Damit sind ${others} bis zum naechsten Aug-Install gesperrt.`);
    }

    if (!(await ensureCity(ns, io, CITY_OF_FACTION(fac), `Einladung ${fac} erarbeiten`))) return;
    // In der Stadt und mit genug Geld vergibt die Engine die Einladung im
    // naechsten Takt (checkForFactionInvitations). Angenommen wird sie oben im
    // naechsten Durchlauf — ohne weitere Reise.
    const ok = await io.act("joinFaction", [fac], `ns.singularity.joinFaction(${J(fac)})`);
    if (ok === true) ns.print(`BEITRITT: ${fac} (Gruppe ${g.name})`);
    else ns.print(`STADT-FAKTION ${fac}: in ${fac} angekommen, Einladung folgt im naechsten Takt.`);
}
/**
 * REISEN (v4.0). WORK reiste bisher NIE — travelToCity kam in dieser Datei
 * nicht ein einziges Mal vor. Der Spieler blieb, wo GENESIS ihn gelassen hatte,
 * und alle stadtgebundenen Aktionen waren unerreichbar.
 * Zweckgebunden: nur bei anderer Zielstadt UND wenn der Sockel die Fahrt traegt.
 * @returns {Promise<boolean>} true, wenn wir (jetzt) in der Zielstadt sind.
 */
async function ensureCity(ns, io, city, why) {
    try {
        const p = await io.player();
        if (!p) return false;
        if (p.city === city) return true;
        let cash = 0;
        try { cash = ns.getServerMoneyAvailable("home"); } catch (e) { cash = 0; }
        if (cash < TRAVEL_COST) {
            ns.print(`REISE nach ${city} (${why}) verschoben: nur ${formatMoney(cash)} da.`);
            return false;
        }
        const ok = await io.act("travelToCity", [city],
            `(() => { try { return ns.singularity.travelToCity(${J(city)}); } catch (e) { return false; } })()`);
        if (ok === true) { ns.print(`REISE: ${p.city} -> ${city} (${why})`); return true; }
        ns.print(`REISE nach ${city} (${why}) fehlgeschlagen.`);
        return false;
    } catch (e) { ns.print("REISE: " + e); return false; }
}

/**
 * STADT-GRUPPE BEWERTEN (v4.0). Bewertet je Gruppe die Zahl der Augs, die nur
 * ueber ihre Faktionen erreichbar sind und noch fehlen. Ist eine Gruppe schon
 * angebrochen, gewinnt sie automatisch — die Entscheidung ist dann gefallen.
 * @returns {{group:object, score:number, why:string}|null}
 */
function pickCityGroup(catalog, owned, joined) {
    if (!catalog) return null;
    const have = new Set(Array.isArray(owned) ? owned : []);
    const inFac = new Set(Array.isArray(joined) ? joined : []);
    for (const g of CITY_GROUPS) {
        if (g.members.some(([f]) => inFac.has(f))) {
            return { group: g, score: -1, why: "Gruppe bereits angebrochen" };
        }
    }
    let best = null;
    for (const g of CITY_GROUPS) {
        const names = new Set();
        for (const [f] of g.members) {
            for (const a of (catalog[f] || [])) {
                if (a && a.name && !have.has(a.name)) names.add(a.name);
            }
        }
        const score = names.size;
        // Einstiegsschwelle der guenstigsten Faktion — der TIE-BREAK. Ohne ihn
        // entschied bei Gleichstand die Reihenfolge in CITY_GROUPS, also der
        // Zufall der Definition.
        const entry = Math.min(...g.members.map(([, n]) => n));
        if (!best || score > best.score || (score === best.score && entry < best.entry)) {
            best = { group: g, score, entry,
                why: `${score} fehlende Augs ueber ${g.members.length} Faktion(en), `
                    + `Einstieg ab ${formatMoney(entry)}` };
        }
    }
    return best;
}

let sweepIdx = 0, lastSweepAt = 0;
const SWEEP_PER_RUN = 4;
const SWEEP_MS = 30_000;
// =============================================================================
// v4.5 — DER SWEEP HAT DIE SORGFAELTIG GEWAEHLTE STELLE WIEDER ZERSTOERT
// =============================================================================
// Der Sweep bewirbt sich breit, damit ueberall ein Job entsteht (Voraussetzung
// fuer die Firmen-Faktionen). Im Kopf steht dazu, er fasse "den Arbeitsslot
// NICHT an, applyToCompany setzt nur this.jobs". Genau darin liegt der Fehler:
// this.jobs[Firma] IST die Stelle, und die Engine ueberschreibt sie
// bedingungslos (PlayerObjectGeneralMethods.ts:344). Es gibt genau EINE
// Position je Firma.
//
// Folge: bestCompanyPlan waehlt fuer den aktuellen Arbeitgeber das Feld mit der
// besten RUF-Rate — und der Sweep bewarb sich 30 Sekunden spaeter bei derselben
// Firma auf Software und IT und setzte die Stelle zurueck. Korrigiert wurde das
// erst beim naechsten Recheck, also bis zu zwei Minuten spaeter. Fuer einen
// kampf- oder charismalastigen Spieler (Bladeburner-Betrieb) ist Software
// selten die beste Ruf-Stelle; der Schwarm arbeitete also einen Grossteil der
// Zeit in der falschen Position.
//
// Der aktuelle Arbeitgeber bleibt deshalb aussen vor. Ihm fehlt dadurch nichts:
// um SEINE Befoerderungen kuemmert sich der Recheck-Pfad, und zwar mit dem
// richtigen Feld.
async function applySweep(ns, io, aktuelleFirma) {
    const now = Date.now();
    if (now - lastSweepAt < SWEEP_MS) return 0;
    lastSweepAt = now;
    // Drei Faelle, bewusst unterschieden:
    //   undefined -> unbekannt, einmal erfragen (lieber ein Aufruf je 30 s als
    //                eine zerstoerte Stelle)
    //   null / "" -> bekannt: es laeuft KEINE Firmenarbeit, nichts zu schuetzen
    //   Name      -> bekannt: diese Firma auslassen
    let schutz = aktuelleFirma === undefined ? null : (aktuelleFirma || null);
    if (aktuelleFirma === undefined) {
        try {
            const cur = await io.currentWork();
            if (cur && cur.type === "COMPANY" && cur.companyName) schutz = cur.companyName;
        } catch (e) { schutz = null; }
    }
    const list = COMPANY_LADDER.filter(c => !NEVER_COMPANY.includes(c.company)
        && c.company !== schutz);
    if (list.length === 0) return 0;
    let tried = 0;
    for (let n = 0; n < SWEEP_PER_RUN; n++) {
        const c = list[sweepIdx % list.length];
        sweepIdx++;
        for (const field of COMPANY_FIELDS) {
            try {
                await io.act("applyToCompany", [c.company, field],
                    `(() => { try { return ns.singularity.applyToCompany(${J(c.company)}, ${J(field)}); } catch (e) { return false; } })()`);
            } catch (e) { /* eine Firma darf den Sweep nicht stoppen */ }
        }
        tried++;
    }
    return tried;
}

async function doCrime(ns, io, karma, joined, mode) {
    // v3.4: Zweck bestimmen. Karma lohnt nur, solange ein Karma-Tor offen ist —
    // also eine gated Faktion fehlt UND das Karma noch über ihrer Schwelle liegt.
    // Live-Anlass: Gang, Syndicate und Tetrads waren beigetreten, Karma längst
    // unter -90, und WORK farmte trotzdem Homicide.
    const memberOf = Array.isArray(joined) ? joined : [];
    // v3.6: drei Zwecke statt zwei. "combat" ist neu — in der BLADE-UNLOCK-Phase
    // zaehlt KAMPF-EXP pro Sekunde, und die unterscheidet sich drastisch vom
    // Geldertrag: Heist gibt 450 Exp in allen vier Kampfstats, Homicide nur 2 —
    // aber Homicide dauert 3 s und Heist 600 s. Pro Sekunde ist Homicide damit
    // rund 3x besser (0,633 gegen 0,225 Exp/s). In v3.4 stand hier der Automatik-
    // Modus mit der Begruendung "Kampf-Exp faellt bei beiden an"; das war zu
    // laessig — sie faellt an, aber dreifach langsamer. Live-Folge: nach 8 h Heist
    // standen die Kampfstats bei ~83 von 100, die Bladeburner-Division blieb zu.
    const karmaMode = mode === "karma" ||
        (mode !== "combat" && KARMA_GATES.some(([fac, need]) => !memberOf.includes(fac) && karma > need));
    const combatMode = mode === "combat";
    const candidates = karmaMode ? KARMA_CRIMES : ALL_CRIMES;
    // Daten: INFO-crime-Block (chance je Crime, stats.karma/.time) oder eval-Bündel.
    let stats = null;
    if (io.mode === "INFO" && io.b.crime) {
        stats = candidates
            .map(c => {
                const e = io.b.crime[c];
                if (!e || typeof e.chance !== "number" || !e.stats) return null;
                return { c, k: e.stats.karma, t: e.stats.time, m: e.stats.money, ch: e.chance, st: e.stats };
            })
            .filter(Boolean);
    }
    if (!Array.isArray(stats) || stats.length === 0) {
        // Per-Eintrag abgesichert: ein unbekannter Name darf nicht das ganze Bündel
        // werfen (getCrimeStats wirft bei ungültigem Verbrechen).
        stats = await io.sing(
            `(${J(candidates)}).map(c => { try { const s = ns.singularity.getCrimeStats(c); ` +
            `return { c, k: s.karma, t: s.time, m: s.money, ch: ns.singularity.getCrimeChance(c), st: s }; } ` +
            `catch (e) { return null; } }).filter(Boolean)`
        );
    }
    if (!Array.isArray(stats) || stats.length === 0) return;

    let best;
    if (combatMode) {
        // Kampf-Exp je Sekunde: Summe der vier Kampfstats mal Chance durch Dauer.
        best = stats
            .map(s2 => {
                const st = s2.st || {};
                const cexp = (Number(st["strength_exp"]) || 0) + (Number(st["defense_exp"]) || 0)
                           + (Number(st["dexterity_exp"]) || 0) + (Number(st["agility_exp"]) || 0);
                return { ...s2, rate: (cexp * s2.ch) / Math.max(0.001, s2.t / 1000) };
            })
            .filter(s2 => s2.rate > 0)
            .sort((a, b) => b.rate - a.rate)[0];
        if (!best) best = stats.find(s2 => s2.c === "Mug") || stats[0];
    } else if (karmaMode) {
        // KARMA-MODUS (unverändert): Homicide bevorzugt, sonst beste Karma-Rate.
        const homicide = stats.find(s => s.c === "Homicide");
        if (homicide && homicide.ch >= CFG.HOMICIDE_MIN_CHANCE) best = homicide;
        else {
            best = stats
                .map(s => ({ ...s, rate: (Math.abs(s.k) * s.ch) / Math.max(0.001, s.t / 1000) }))
                .sort((a, b) => b.rate - a.rate)[0];
        }
    } else {
        // GELD-MODUS (v3.4): Karma ist verbraucht — dann bringt Homicide nur noch
        // Kampf-Exp. Statt dessen das Verbrechen mit dem besten ERWARTETEN Geldfluss:
        // money * chance / Zeit. Heist zahlt am meisten, hat aber die schlechteste
        // Chance; das Produkt entscheidet, nicht der Nennwert.
        best = stats
            .filter(s => typeof s.m === "number" && s.m > 0)
            .map(s => ({ ...s, rate: (s.m * s.ch) / Math.max(0.001, s.t / 1000) }))
            .sort((a, b) => b.rate - a.rate)[0];
        // Kein Geldwert lesbar -> nicht untätig bleiben, Karma-Logik als Rückfall.
        if (!best) best = stats.map(s => ({ ...s, rate: (Math.abs(s.k) * s.ch) / Math.max(0.001, s.t / 1000) }))
                               .sort((a, b) => b.rate - a.rate)[0];
    }
    if (!best) return;

    const cur = await io.currentWork();
    const already = cur && cur.type === "CRIME" && cur.crimeType &&
        String(cur.crimeType).toLowerCase() === String(best.c).toLowerCase();
    if (!already || focusFlank()) {
        await io.act("commitCrime", [best.c, FOCUS()],
            `ns.singularity.commitCrime(${J(best.c)}, ${FOCUS()})`);
    }
    ns.print(`CRIME[${combatMode ? "Kampf" : karmaMode ? "Karma" : "Geld"}]: ${best.c} (Chance ${(best.ch * 100).toFixed(0)}%` +
        (karmaMode ? `) | Karma ${formatNumber(karma)} -> ${formatNumber(CFG.KARMA_GOAL)}`
                   : `, ~${formatMoney(((best.m || 0) * best.ch) / Math.max(0.001, best.t / 1000))}/s)`));
}

// =============================================================================
// PHASE 2 — REPUTATION
// =============================================================================

/** Aug-Ziele je Faktion bewerten. INFO-Katalog zuerst, sonst evalNs (v1-Weg). */
async function computeAugGoals(ns, io, ownedAugs) {
    const goals = {};
    // ---- INFO-Pfad: fertiger Katalog aus Port 28 --------------------------
    if (io.mode === "INFO" && io.b.augs && io.b.augs.catalog) {
        const owned = new Set(Array.isArray(io.b.augs.owned) ? io.b.augs.owned : ownedAugs);
        for (const [faction, augs] of Object.entries(io.b.augs.catalog)) {
            if (CANNOT_WORK.includes(faction)) continue;
            // v3.5: Rangfolge nach PREIS statt nach Stat-Wert.
            //
            // Grund: BANK kauft nach der Doktrin "billigstes zuerst". Rankte WORK
            // weiter nach scoreAugStats, farmten Rep-Arbeit und Kauf in
            // VERSCHIEDENE Richtungen — WORK sammelte Ruf bei der Faktion mit den
            // wertvollsten Augs, BANK kaufte das billigste ganz woanders. Jetzt
            // zieht beides am gleichen Strang, und es entspricht dem Phasenmodell:
            // erst die Faktionen mit den guenstigen Augs.
            //
            // `value` bleibt "hoeher ist besser" (die Rangliste unten sortiert
            // absteigend), ist aber der KEHRWERT des billigsten fehlenden Augs.
            // `goal` bleibt der hoechste Rep-Bedarf der fehlenden Augs — daran
            // erkennt der Luecken-Filter, wann eine Faktion fertig gefarmt ist.
            let goal = 0, cheapest = Infinity, missing = 0;
            for (const a of augs || []) {
                if (!a || owned.has(a.name)) continue;
                missing++;
                const price = (typeof a.price === "number" && a.price > 0) ? a.price : Infinity;
                if (price < cheapest) cheapest = price;
                if ((a.repReq || 0) > goal) goal = a.repReq || 0;
            }
            if (missing === 0) continue;                       // nichts mehr zu holen
            // Kehrwert skaliert, damit auch sehr teure Augs noch einen Wert > 0 haben.
            const value = isFinite(cheapest) ? (1e12 / cheapest) : 1e-6;
            goals[faction] = { goal, value, cheapest, missing };
        }
        return goals;
    }
    // ---- EVAL-Pfad (v1, unverändert) --------------------------------------
    try {
        const joined = await io.sing("ns.getPlayer().factions");
        if (!Array.isArray(joined) || joined.length === 0) return goals;
        const relevant = joined.filter(f => !CANNOT_WORK.includes(f));
        if (relevant.length === 0) return goals;

        const byFaction = await io.sing(
            `Object.fromEntries((${J(relevant)}).map(f => [f, ns.singularity.getAugmentationsFromFaction(f)]))`
        );
        if (!byFaction) {
            ns.print("WARNUNG: getAugmentationsFromFaction lieferte null — Aug-Bewertung übersprungen.");
            return goals;
        }
        const augList = [...new Set(Object.values(byFaction).flat())].filter(a => !ownedAugs.includes(a));
        if (augList.length === 0) return goals;

        // v3.5: PREISE statt Stats — derselbe Maßstab wie im INFO-Pfad, damit der
        // Fallback nicht plötzlich nach einem anderen Kriterium farmt.
        // getAugmentationPrice ersetzt getAugmentationStats; ein Aufruf weniger je
        // Aug wäre nicht möglich, die Kosten bleiben also gleich.
        const reqByAug = await io.sing(`Object.fromEntries((${J(augList)}).map(a => [a, ns.singularity.getAugmentationRepReq(a)]))`) || {};
        const priceByAug = await io.sing(`Object.fromEntries((${J(augList)}).map(a => [a, ns.singularity.getAugmentationPrice(a)]))`) || {};

        for (const [faction, augs] of Object.entries(byFaction)) {
            let goal = 0, cheapest = Infinity, missing = 0;
            for (const a of augs || []) {
                if (ownedAugs.includes(a)) continue;
                missing++;
                const price = (typeof priceByAug[a] === "number" && priceByAug[a] > 0) ? priceByAug[a] : Infinity;
                if (price < cheapest) cheapest = price;
                if ((reqByAug[a] || 0) > goal) goal = reqByAug[a] || 0;
            }
            if (missing === 0) continue;
            goals[faction] = { goal, value: isFinite(cheapest) ? (1e12 / cheapest) : 1e-6, cheapest, missing };
        }
    } catch (e) {
        ns.print("Aug-Bewertung: " + e);
    }
    return goals;
}

/**
 * FIRMEN-FELDWAHL (v2.0): beste Bewerbung für eine Firma bestimmen.
 * Nur im INFO-Modus (RPC-eval; das Bündel ist für den 24-GB-Puffer zu groß).
 * Bewertet je Feld die beste QUALIFIZIERTE Position:
 *   Rep-Rate (formulas.work.companyGains) -> bei Gleichstand (±COMPANY_REP_TIE)
 *   Geld -> dann XP-Summe. Ohne Formulas.exe: Feld-Heuristik + salary.
 * @returns {Promise<{field:string, why:string}|null>}
 */
async function bestCompanyPlan(ns, io, company, plans) {
    const cached = plans[company];
    if (cached && Date.now() - cached.ts < CFG.COMPANY_RECHECK_MS * 5) return cached;
    if (io.mode !== "INFO") return null;

    const code =
        `(()=>{const C=${J(company)};const p=ns.getPlayer();` +
        `let favor=0,rep=0;try{favor=ns.singularity.getCompanyFavor(C);}catch(e){}` +
        `try{rep=ns.singularity.getCompanyRep(C);}catch(e){}` +
        `let out=[];try{for(const pos of ns.singularity.getCompanyPositions(C)){` +
        `try{const i=ns.singularity.getCompanyPositionInfo(C,pos);let g=null;` +
        `try{g=ns.formulas.work.companyGains(p,C,pos,favor);}catch(e){}` +
        `out.push({pos,field:i.field,salary:i.salary,reqRep:i.requiredReputation,req:i.requiredSkills,g});}` +
        `catch(e){}}}catch(e){return null;}` +
        `return {rep,skills:p.skills,list:out};})()`;
    const data = await io.evalBig(code);
    if (!data || !Array.isArray(data.list) || data.list.length === 0) return null;

    const qualifies = (e) => {
        if ((e.reqRep || 0) > (data.rep || 0)) return false;
        for (const [k, v] of Object.entries(e.req || {})) {
            if ((data.skills?.[k] || 0) < v) return false;
        }
        return true;
    };
    // je Feld: die höchste qualifizierte Position (Engine vergibt genau die)
    const byField = {};
    for (const e of data.list) {
        if (!qualifies(e)) continue;
        const cur = byField[e.field];
        if (!cur || (e.reqRep || 0) > (cur.reqRep || 0)) byField[e.field] = e;
    }
    const cands = Object.values(byField);
    if (cands.length === 0) return null;

    const repRate = (e) => e.g ? (e.g.reputation || 0) : -1;   // -1 = kein Formulas
    const moneyOf = (e) => e.g ? (e.g.money || 0) : (e.salary || 0);
    const expOf = (e) => e.g
        ? (e.g.hackExp || 0) + (e.g.strExp || 0) + (e.g.defExp || 0) + (e.g.dexExp || 0) + (e.g.agiExp || 0) + (e.g.chaExp || 0)
        : 0;

    let best = null, why = "";
    if (cands.every(e => repRate(e) < 0)) {
        // Ohne Formulas: bekannte Feld-Präferenz, dann salary.
        const prefer = (f) => COMPANY_FIELDS.indexOf(f) >= 0 ? COMPANY_FIELDS.indexOf(f) : 99;
        cands.sort((a, b) => prefer(a.field) - prefer(b.field) || moneyOf(b) - moneyOf(a));
        best = cands[0]; why = "Heuristik (kein Formulas): Feldpräferenz+Gehalt";
    } else {
        cands.sort((a, b) => repRate(b) - repRate(a));
        const top = repRate(cands[0]);
        const tie = cands.filter(e => repRate(e) >= top * (1 - CFG.COMPANY_REP_TIE));
        if (tie.length === 1) { best = tie[0]; why = "beste Rep-Rate"; }
        else {
            tie.sort((a, b) => moneyOf(b) - moneyOf(a) || expOf(b) - expOf(a));
            best = tie[0]; why = "Rep gleich -> mehr Geld/XP";
        }
    }
    const plan = { ts: Date.now(), field: best.field, pos: best.pos, why };
    plans[company] = plan;
    return plan;
}

const _repDone = new Map();          // fac -> goal, für das schon gemeldet wurde
function announceRepDone(ns, fac, goal, repNow, why) {
    if (_repDone.get(fac) === goal) return;
    _repDone.set(fac, goal);
    ns.print(`REP: ${fac} Ziel erreicht (${formatNumber(repNow || 0)} >= ${formatNumber(goal || 0)}) — ${why}.`);
}

/** Für die wertvollste Faktion arbeiten; Firmen als Leerlauf-Füller.
 * @returns {Promise<{faction:string|null}>} tatsächlich gesetzte Player-Faktion. */
/**
 * Beste Faktions-Arbeitsart für ein Stat-Profil (v3.2).
 *
 * WARUM GERECHNET STATT FEST: vorher stand hier ["field","hacking","security"]
 * mit der Begründung "field skaliert mit allen Stats". Das ist nur halb richtig —
 * entscheidend ist, WO der Share-Bonus einhakt (Engine: reputation.ts):
 *
 *   hacking:  ((hack + int/3 + darknetCha(0.1)) / MaxSkill) * ... * shareBonus
 *             -> shareBonus multipliziert das GESAMTERGEBNIS
 *   field:    0.9 * (str+def+dex+agi+cha + (hack+int+darknetCha(0.3))*shareBonus) / MaxSkill / 5.5
 *   security: 0.9 * (str+def+dex+agi+darknetCha(0.3) + (hack+int)*shareBonus) / MaxSkill / 4.5
 *             -> bei beiden steht shareBonus NUR an einem Term INNERHALB einer
 *                Summe und wird durch Kampfstats/Charisma verwässert
 *
 * Live gemessen (Hack 484, Cha 810, Kampf 302/465/396/205, Int 144): Hacking-
 * Aufträge bringen 23 % mehr Rep als Field OHNE Share und 48 % mehr MIT Share.
 * Field wurde also systematisch die schlechteste Wahl bevorzugt.
 *
 * Die gemeinsamen Faktoren (1/MaxSkillLevel, faction_rep-Mult, Favor-Mult,
 * Intelligence-Bonus) sind bei allen drei Arten identisch und kürzen sich beim
 * Vergleich heraus — deshalb braucht es hier weder MaxSkillLevel noch Favor.
 *
 * Eigenschaftszugriffe stehen absichtlich in Klammern mit String-Literal:
 * RamCalculations.ts läuft bei MemberExpression object UND property ab und ruft
 * addRef() auf jeden Identifier; "hacking" existiert als Namespace-Name in der
 * Kostentabelle. Ein Literal-Knoten erzeugt keine Referenz.
 *
 * @param {object} skills   skills-Objekt (Spieler oder Sleeve)
 * @param {number} sf15Lvl  Source-File-15-Level (darknetCha erst ab 3)
 * @param {number} sharePow aktueller Share-Bonus (>= 1)
 * @returns {string[]} Arbeitsarten, beste zuerst
 */
function factionWorkOrder(skills, sf15Lvl, sharePow) {
    const sk = skills || {};
    const n = (v) => Number(v) || 0;
    const hk  = n(sk["hacking"]),   itl = n(sk["intelligence"]);
    const str = n(sk["strength"]),  def = n(sk["defense"]);
    const dex = n(sk["dexterity"]), agi = n(sk["agility"]), cha = n(sk["charisma"]);
    const sb  = (typeof sharePow === "number" && sharePow >= 1) ? sharePow : 1;
    // getDarknetCharismaBonus greift erst ab SF15 Level 3.
    const dch = (scalar) => (Number(sf15Lvl) >= 3 ? cha * scalar : 0);
    const combat = str + def + dex + agi;
    const scored = [
        ["hacking",  (hk + itl / 3 + dch(0.1)) * sb],
        ["field",    0.9 * (combat + cha + (hk + itl + dch(0.3)) * sb) / 5.5],
        ["security", 0.9 * (combat + dch(0.3) + (hk + itl) * sb) / 4.5],
    ];
    scored.sort((a, b) => b[1] - a[1]);
    return scored.map((x) => x[0]);
}

/** SF15-Level aus dem bn-Block (0, wenn unbekannt). */
function sf15Of(io) {
    try { const b = io && io.b ? io.b.bn : null; return (b && b.sf) ? (Number(b.sf["15"]) || 0) : 0; }
    catch (e) { return 0; }
}

// Share-Bonus gedrosselt abfragen (getSharePower = 0.2 GB, Wert ändert sich träge).
let _shrPow = 1, _shrPowTs = 0;
function sharePower(ns) {
    const now = Date.now();
    if (now - _shrPowTs > 10_000) {
        try { _shrPow = ns.getSharePower(); } catch (e) { _shrPow = 1; }
        _shrPowTs = now;
    }
    return _shrPow;
}

// =============================================================================
// SPENDEN (v5.1) — GELD IN FAKTIONS-RUF
// =============================================================================
// ENGINE, alles nachgelesen:
//
//   repFromDonation(amt) = amt / DonateMoneyToRepDivisor
//                          * mults.faction_rep * FactionWorkRepGain
//        Faction/formulas/donation.ts:8-10; DonateMoneyToRepDivisor = 1e6
//        (Constants.ts:33). Also: 1 Mio. Geld = 1 Ruf, mal beide Faktoren.
//
//   favorNeededToDonate() = floor(BaseFavorToDonate * FavorToDonateToFaction)
//        donation.ts:16-18; BaseFavorToDonate = 150 (Constants.ts:31).
//        In BN8 ist der Multiplikator 0 -> Schwelle 0 -> spenden ab Favor 0.
//
//   donateToFaction WIRFT NICHT. Es gibt bei JEDEM Verstoss false zurueck
//        (Singularity.ts:925-963): kein Mitglied, Gang-Faktion, Faktion bietet
//        keine Arbeit an (offersWork(), FactionInfo.tsx:110), Betrag <= 0,
//        zu wenig Geld, zu wenig Favor. Ein stilles false saehe genauso aus wie
//        eine geglueckte Spende - der Rueckgabewert wird deshalb geprueft.
//
// WOHER DAS GELD KOMMT: ueber den normalen Antragsweg der BANK
// (requestFunds -> readFundGrant), denselben, den GANGS benutzt. Die BANK
// deckelt Spenden auf den Spenden-Topf (5 % des Zuflusses) und ab v5.17 auf
// die Haelfte des Geldes, das nach den Antraegen davor noch frei ist - sie
// KUERZT, statt abzulehnen; eine halbe Spende bringt anteilig Ruf.
// Reihenfolge (v5.8, mit dem Spieler abgestimmt): Gang-Augs 300, Spende
// 200, Gang-Ausruestung 100.
const SPENDE_PRIO = 200;
//
// LAEUFT DIE BANK NOCH NICHT IN v5.0, wird NICHT gespendet. Ohne den Deckel
// gaebe es keine Obergrenze, und eine Rufluecke von 400k waere bei einem
// Multiplikator von 1,5 eine Ueberweisung von rund 267 Mio. Lieber gar nicht
// spenden als ungedeckelt.
const SPENDE_MIN = 1e6;          // unter 1 Mio. bringt weniger als 1 Ruf - nicht der Muehe wert
// Nachtrag 3: der offene Antrag mit eigener id { fac, id } - statt nur der
// Faktion. Jede Spende bekommt eine neue id, <lauf> trennt Neustarts.
let spendeAntrag = null;
const spendeLauf = Date.now().toString(36);
let spendeSeq = 0;
// v5.8 Nachtrag: aus welcher BANK-Veroeffentlichung (__ts) je id schon
// gespendet wurde. Steht BANK, bleibt dieselbe Freigabe im Port stehen.
const spendeAusStempel = {};

async function spendeStep(ns, io, target, augGoals, repMap) {
    // --- 0. Alten Antrag zurueckziehen, wenn das Ziel gewechselt hat ----------
    const facNeu = target ? target.name : null;
    if (spendeAntrag && spendeAntrag.fac !== facNeu) {
        // Nachtrag: UNGENUTZT - sonst buchte BANK die Freigabe als verbraucht.
        try { requestFundsZurueck(ns, "WORK", spendeAntrag.id); } catch (e) { }
        spendeAntrag = null;
    }
    if (!facNeu) return null;
    const fac = facNeu;

    // --- 1. Darf hier ueberhaupt gespendet werden? ---------------------------
    // doReputation hat die Gang-Faktion und CANNOT_WORK bereits aus `workable`
    // gefiltert, und target stammt daraus. Die Engine-Bedingungen "Mitglied",
    // "nicht Gang", "bietet Arbeit an" sind damit erfuellt.
    const mults = (io.b && io.b.bn) ? io.b.bn.mults : null;
    if (!mults || typeof mults.FavorToDonateToFaction !== "number") {
        return null;   // Regel unbekannt -> altes Verhalten, also nicht spenden
    }
    const favorNoetig = Math.floor(150 * mults.FavorToDonateToFaction);
    const favorIst = (repMap && repMap[fac] && typeof repMap[fac].favor === "number")
        ? repMap[fac].favor : null;
    if (favorIst === null) return null;
    if (favorIst < favorNoetig) {
        ns.print(`SPENDE: ${fac} braucht Favor ${favorNoetig}, hat ${favorIst} — noch nicht.`);
        return null;
    }

    // --- 2. Wieviel Ruf fehlt, und was kostet der? --------------------------
    const ziel = augGoals[fac] || {};
    const rufIst = (repMap && repMap[fac] && typeof repMap[fac].rep === "number") ? repMap[fac].rep : null;
    if (rufIst === null || !(ziel.goal > 0)) return null;
    const luecke = ziel.goal - rufIst;
    if (luecke <= 0) return null;

    // Beide Faktoren aus der Formel. Fehlt der Spieler-Multiplikator (alte INFO,
    // EVAL-Modus), wird mit 1 gerechnet: das ueberschaetzt den noetigen Betrag,
    // und mehr als der Deckel wird ohnehin nie freigegeben.
    const repMult = (io.b && io.b.player && typeof io.b.player.factionRepMult === "number")
        ? io.b.player.factionRepMult : 1;
    const bnMult = (typeof mults.FactionWorkRepGain === "number") ? mults.FactionWorkRepGain : 1;
    const proMio = repMult * bnMult;                  // Ruf je 1 Mio. Geld
    if (!(proMio > 0)) return null;                   // in einer BitNode mit 0 waere jede Spende wertlos
    const geldNoetig = (luecke * 1e6) / proMio;

    // --- 3. Der Deckel der BANK -------------------------------------------
    const bank = readBankInfo(ns);
    const topf = (bank && bank.spende && typeof bank.spende.topf === "number") ? bank.spende.topf : null;
    if (topf === null) {
        // BANK kennt den Spenden-Topf nicht -> laeuft noch vor v5.0.
        return null;
    }

    // --- 4. ERST die Freigabe, dann entscheiden (v5.8) ---------------------
    // Bis v5.7 stand hier zuerst "betrag < 1 Mio. -> zurueckziehen", und
    // betrag war auf BANKs "frei" gedeckelt. Das meldet BANK aber NACH Abzug
    // genau dieser Freigabe: nahm sie fast alles Freie, zog WORK den
    // bewilligten Antrag zurueck, ohne zu spenden - und BANK buchte ihn
    // trotzdem vom Spenden-Topf ab.
    const id = (spendeAntrag && spendeAntrag.fac === fac) ? spendeAntrag.id : null;
    const freigabe = id ? readFundGrant(ns, "WORK", id) : 0;
    const stempel = readFundGrantStempel(ns);
    const schonGespendet = stempel !== null && spendeAusStempel[id] === stempel;
    if (freigabe >= SPENDE_MIN && !schonGespendet) {
        spendeAusStempel[id] = stempel;
        const summe = Math.floor(Math.min(freigabe, geldNoetig));
        const ok = await io.act("donateToFaction", [fac, summe],
            `ns.singularity.donateToFaction(${J(fac)},${summe})`);
        // Antrag in JEDEM Fall abmelden: bei Erfolg ist er verbraucht, bei
        // Misserfolg soll er nicht als Zombie stehen bleiben und die Freigabe
        // der BANK binden. Der naechste Takt stellt ihn neu, falls noetig.
        // Nachtrag: abgelehnt = nichts ausgegeben -> ungenutzt abmelden.
        try {
            if (ok === false) requestFundsZurueck(ns, "WORK", id);
            else requestFunds(ns, "WORK", id, "money", 0);
        } catch (e) { }
        spendeAntrag = null;   // Nachtrag 3: der naechste Antrag bekommt eine neue id
        // v5.8: ins Handlungsbuch, Topf other (donation.ts:31). null heisst: der
        // RPC kam nicht zurueck - INFO fuehrt den Auftrag womoeglich trotzdem aus.
        const ausgang = ok === true ? "gespendet" : ((ok === null || ok === undefined) ? "unklar" : "abgelehnt");
        try {
            chronik(ns, "WORK", "spende", fac, ausgang, `${formatMoney(summe)} (Freigabe ${formatMoney(freigabe)})`,
                { id: "WORK/" + id, betrag: ok === true ? summe : 0, versucht: summe, freigabe, topf: "other" });
        } catch (e) { /* darf nie stoeren */ }
        if (ok === true) {
            const rufDafuer = (summe / 1e6) * proMio;
            ns.print(`SPENDE: ${formatMoney(summe)} an ${fac} -> +${formatNumber(rufDafuer)} Ruf `
                + `(Luecke war ${formatNumber(luecke)}).`);
            return { fac, summe, ruf: rufDafuer };
        }
        if (ausgang === "unklar") {
            ns.print(`SPENDE: ${fac} ${formatMoney(summe)} - keine Antwort vom RPC, Ausgang unklar.`);
        } else {
            // false = die Engine hat abgelehnt. Grund steht in ihrem Log; hier
            // zaehlt, dass es NICHT als Erfolg durchgeht.
            ns.print(`SPENDE: ${fac} hat ${formatMoney(summe)} ABGELEHNT (donateToFaction = false).`);
        }
        return null;
    }

    // --- 5. Antrag stellen bzw. auffrischen --------------------------------
    // v5.8: nur noch auf den Topf gedeckelt. Die Haelfte des freien Geldes
    // zieht BANK v5.17 selbst ab (sie kuerzt), und ein zu grosser Antrag
    // blockiert dort niemanden mehr - bis v5.16 hielt der oberste Antrag alle
    // dahinter auf (81 Berichte ohne eine Spende, Anlass von v5.2).
    const betrag = Math.floor(Math.min(geldNoetig, topf));
    if (betrag < SPENDE_MIN) {
        // Alten Antrag zurueckziehen, sonst haengt er weiter im Eingang der BANK.
        if (spendeAntrag && spendeAntrag.fac === fac) {
            try { requestFundsZurueck(ns, "WORK", spendeAntrag.id); } catch (e) { }
            spendeAntrag = null;
        }
        return null;
    }
    if (!spendeAntrag) spendeAntrag = { fac, id: "donate:" + fac + "#" + spendeLauf + "-" + (++spendeSeq) };
    requestFunds(ns, "WORK", spendeAntrag.id, "money", betrag, SPENDE_PRIO);
    ns.print(`SPENDE: ${formatMoney(betrag)} fuer ${fac} beantragt `
        + `(Luecke ${formatNumber(luecke)} Ruf, ${proMio.toFixed(2)} Ruf je Mio., Topf ${formatMoney(topf)}).`);
    return null;
}

async function doReputation(ns, io, augGoals, rotation, blocked, timers, plans) {
    let lastCompanyRecheck = timers.lastCompanyRecheck || 0;

    const p = await io.player();
    const joined = p ? p.factions : null;
    if (joined === null || joined === undefined) {
        ns.print("FEHLER: Faktionsliste nicht ermittelbar (Quelle liefert null).");
        return { faction: null };
    }
    // v3.3: Die GANG-Faktion ist nicht bearbeitbar. Singularity.ts:
    //   if (Player.gang && faction.name === Player.getGangFaction().name) return false;
    // Live-Kette: BANK schlug "Slum Snakes" als Rep-Ziel vor -> WORK probierte alle
    // drei Arbeitsarten -> INFO_RPC_RES zeigte dreimal {ok:true,res:false} -> Durchfall
    // in den Firmenzweig -> FoodNStuff. Die Faktion bleibt für AUGS interessant (Rep
    // wächst über die Gang selbst), nur ARBEITEN geht dort nicht.
    const gangFac = (io.b && io.b.gang && io.b.gang.member) ? io.b.gang.faction : null;
    const workable = (joined || []).filter(f => !CANNOT_WORK.includes(f) && f !== gangFac);

    // v2.0.2: Rep-Lücken-Filter. "Wertvollste fehlende Augs" hieß bisher NICHT
    // "braucht noch Rep-Arbeit": Tian Di Hui klebte mit >1m Rep am Ranking,
    // weil das PRIORITY-Aug Neuroreceptor (repReq nur 75k, Bonus +1e6) noch
    // ungekauft war. Faktionen, deren Rep das goal (max repReq fehlender Augs)
    // bereits deckt, sind FERTIG gefarmt — kaufen ist Sache von AUGS/BANK.
    // Quelle: INFO-rep-Block; ohne ihn (EVAL-Modus) Altverhalten (kein Filter,
    // getFactionRep je Faktion sprengt bei SF4 L1 den 24-GB-Eval-Puffer).
    const repMap = (io.mode === "INFO" && io.b.rep) ? io.b.rep : null;
    const repOf = (f) => (repMap && repMap[f]) ? (repMap[f].rep || 0) : null;
    const gapOpen = (f) => {
        const g = augGoals[f], rn = repOf(f);
        if (rn === null || !g || !(g.goal > 0)) return true;   // keine Daten -> nicht filtern
        return rn < g.goal;
    };

    // v3.5: KEIN fremdes Rep-Ziel mehr. Vorher publizierte BANK eines auf Port 17
    // und ueberstimmte damit die Rangliste hier — mit zwei Ranglisten nach
    // verschiedenen Kriterien, von denen die aeussere die noetigen Filter nicht
    // hatte. Live fuehrte das zweimal in eine Sackgasse: BANK schlug "Slum Snakes"
    // vor (Gang-Faktion, fuer die die Engine workForFaction grundsaetzlich ablehnt)
    // und danach "Aevum" (Einladung nie angenommen, weil Stadt-Faktionen sich
    // gegenseitig ausschliessen). Beides Wissen, das WORK ohnehin hat: CANNOT_WORK,
    // gangFac und workable (= beigetreten) stehen hier oben. Die Entscheidung
    // gehoert dorthin, wo der Work-Slot liegt.
    let target = null;
    {
        const ranked = workable
            .map(f => ({ name: f, value: (augGoals[f] || {}).value || 0 }))
            .filter(f => f.value > 0)
            .filter(f => {
                if (gapOpen(f.name)) return true;
                announceRepDone(ns, f.name, (augGoals[f.name] || {}).goal || 0, repOf(f.name), "aus Ranking genommen");
                return false;
            })
            .sort((a, b) => b.value - a.value);
        if (ranked.length > 0) {
            const top = ranked[0].value;
            const tier = ranked.filter(f => f.value >= top * CFG.TIER_FRAC).slice(0, CFG.TIER_MAX);
            target = tier[rotation() % tier.length];
            target.why = "billigstes fehlendes Aug";
        }
    }

    // v3.5: Gewaehltes Ziel MELDEN (Port 17, informativ). Niemand handelt darauf —
    // es macht in der Diagnose nachvollziehbar, WAS WORK farmt und wie weit.
    // null, wenn kein Ziel gefunden wurde, damit ein altes nicht stehen bleibt.
    try {
        const g = target ? (augGoals[target.name] || {}) : null;
        publishRepTarget(ns, target ? {
            fac: target.name,
            aug: isFinite(g.cheapest) ? `billigstes @ ${formatMoney(g.cheapest)}` : "—",
            need: g.goal || 0,
            have: repOf(target.name) || 0,
            why: target.why || "",
        } : null);
    } catch (e) { /* Diagnose-Port darf nichts stoppen */ }

    // v5.1: SPENDEN. Erst hier, weil target feststeht - gespendet wird immer an
    // die Faktion, die WORK ohnehin farmt. Zwei Wege auf dasselbe Ziel, statt
    // zweier Ziele.
    try { await spendeStep(ns, io, target, augGoals, repMap); }
    catch (e) { ns.print("SPENDE: " + e); }

    if (target) {
        publishHashNeed(ns, "WORK", { doing: "STUDY" });
        const cur = await io.currentWork();
        if (cur && cur.type === "FACTION" && cur.factionName === target.name && !focusFlank()) {
            ns.print(`REP: ${target.name} (läuft)`);
            return { faction: target.name };
        }
        // Arbeitstyp v3.2: berechnet statt fest (s. factionWorkOrder). Vorher stand
        // field an erster Stelle und gewann damit praktisch immer — die Art, in der
        // der Share-Bonus am stärksten verwässert wird.
        const wOrder = factionWorkOrder(io.b.player ? io.b.player.skills : null, sf15Of(io), sharePower(ns));
        for (const t of wOrder) {
            const ok = await io.act("workForFaction", [target.name, t, FOCUS()],
                `ns.singularity.workForFaction(${J(target.name)}, ${J(t)}, ${FOCUS()})`);
            if (ok === true) { ns.print(`REP: ${target.name} (${t}) — ${target.why}`); return { faction: target.name }; }
        }
        ns.print(`REP: ${target.name} nimmt keine der Arbeitsarten an — weiter zur Firma.`);
    } else {
        ns.print(`REP: kein Faktionsziel (${workable.length} Faktionen) — Firma.`);
    }

    // ---- 2. FIRMA ---------------------------------------------------------
    const now = Date.now();
    const cur = await io.currentWork();
    // v3.3: gesperrte Firma NICHT weiterlaufen lassen — sonst klebt ein Alt-Job aus
    // der Frühphase dauerhaft im Slot. Kein return: unten wird eine bessere gewählt.
    const stuckJunk = cur && cur.type === "COMPANY" && NEVER_COMPANY.includes(cur.companyName);
    if (stuckJunk) ns.print(`FIRMA: ${cur.companyName} ist gesperrt — wechsle.`);
    if (cur && cur.type === "COMPANY" && !stuckJunk) {
        if (now - lastCompanyRecheck >= CFG.COMPANY_RECHECK_MS) {
            lastCompanyRecheck = now;
            timers.lastCompanyRecheck = now;
            // v2.0: NUR das beste Feld bewerben (Promotion abholen, ohne durch
            // eine zweite Bewerbung zufällig das Feld zu wechseln).
            const plan = await bestCompanyPlan(ns, io, cur.companyName, plans);
            const fields = plan ? [plan.field] : COMPANY_FIELDS;
            for (const field of fields) {
                await io.act("applyToCompany", [cur.companyName, field],
                    `ns.singularity.applyToCompany(${J(cur.companyName)}, ${J(field)})`);
            }
            if (plan) ns.print(`FIRMA: ${cur.companyName} — Feld ${plan.field} (${plan.why}).`);
        }
        // Fokuswechsel: die laufende Firmenarbeit behält sonst ihren alten Fokus.
        // Einmal neu vergeben — dieselbe Firma, nur mit neuem Fokuswert.
        if (focusFlank()) {
            await io.act("workForCompany", [cur.companyName, FOCUS()],
                `ns.singularity.workForCompany(${J(cur.companyName)}, ${FOCUS()})`);
            ns.print(`FIRMA: ${cur.companyName} — neu vergeben (Fokus ${FOCUS() ? "an" : "aus"}).`);
        } else {
            ns.print(`FIRMA: ${cur.companyName} (läuft)`);
        }
        publishHashNeed(ns, "WORK", { doing: "COMPANY", company: cur.companyName });
        return { faction: null };
    }

    // v3.3: Firmen MIT angehängter Faktion zuerst. Sie schalten Megacorp-Faktionen
    // frei (400k Firmen-Rep, Constants.ts:25) und zahlen deutlich besser; die Leiter-Reihenfolge
    // "Einstieg zuerst" führte dazu, dass immer die schwächste Firma gewann.
    // Array.prototype.sort ist stabil, die gelistete Reihenfolge bleibt je Gruppe.
    const open = COMPANY_LADDER
        .filter(c => !(blocked[c.company] > now) && !NEVER_COMPANY.includes(c.company))
        .sort((a, b) => (b.faction ? 1 : 0) - (a.faction ? 1 : 0));
    for (const entry of open) {
        const company = entry.company;
        const plan = await bestCompanyPlan(ns, io, company, plans);
        const fields = plan ? [plan.field, ...COMPANY_FIELDS.filter(f => f !== plan.field)] : COMPANY_FIELDS;
        let hired = false;
        for (const field of fields) {
            const r = await io.act("applyToCompany", [company, field],
                `ns.singularity.applyToCompany(${J(company)}, ${J(field)})`);
            if (r) { hired = true; break; }
        }
        if (!hired) { blocked[company] = now + CFG.COMPANY_BLOCK_MS; continue; }
        const ok = await io.act("workForCompany", [company, FOCUS()],
            `ns.singularity.workForCompany(${J(company)}, ${FOCUS()})`);
        if (ok === true) {
            publishHashNeed(ns, "WORK", { doing: "COMPANY", company });
            ns.print(`FIRMA: ${company} — eingestellt${plan ? ` (Feld ${plan.field}, ${plan.why})` : ""}.`);
            return { faction: null };
        }
        blocked[company] = now + CFG.COMPANY_BLOCK_MS;
    }

    // ---- 3. FALLBACK: CRIME (Slot darf nie leerlaufen) ---------------------
    const karma = await io.karma();
    // joined mitgeben: entscheidet Karma- gegen Geld-Modus.
    await doCrime(ns, io, typeof karma === "number" ? karma : 0, joined);
    ns.print(`FALLBACK: keine Faktion, keine Firma offen — Crime.`);
    return { faction: null };
}

// =============================================================================
// SLEEVES (v2.0) — Rollenmodell mit 15-Minuten-Slots
// =============================================================================
//
// Engine-Constraints (Sleeve.ts): zwei Sleeves nie auf DIESELBE Faktion; je
// Contract-Typ ("Take on contracts") nur EIN Sleeve; General-Actions
// (Diplomacy/Infiltrate/Field) beliebig oft. setTo* wirft bei Unzulässigem —
// evalNs/RPC fangen das (Ergebnis null/false -> nächste Option).

/**
 * @param {NS} ns
 * @param {*} io
 * @param {Object} state
 * @param {{mode:"UNLOCK"|"REP", augGoals:Object|null, sleeveCount:number, lastSleeve:number}} c
 * @returns {Promise<{count:number, ts:number}>}
 */
let _slvWhy = "";                 // v2.0.1: letzter Skip-Grund (nur Änderungen printen)
function slvSkip(ns, why) {
    if (why !== _slvWhy) { _slvWhy = why; if (why) ns.print("SLEEVES: " + why); }
}

async function driveSleeves(ns, io, state, c) {
    const now = Date.now();
    if (now - c.lastSleeve < CFG.SLEEVE_LOOP_MS) return { count: c.sleeveCount, ts: c.lastSleeve };
    if (!isDaemonEnabled(ns, "SLEEVES", state)) {
        slvSkip(ns, "per Dashboard-Schalter AUS — Steuerung pausiert.");
        return { count: c.sleeveCount, ts: now };
    }

    // ---------- Zustände holen (INFO-Block oder eval-Bündel) ----------------
    let list = null;
    if (io.mode === "INFO" && io.b.sleeves) {
        list = io.b.sleeves.list || [];
        if (c.sleeveCount < 0) c.sleeveCount = io.b.sleeves.n || 0;
    } else {
        if (c.sleeveCount < 0) {
            let r = null;
            try { r = await io.sing("ns.sleeve.getNumSleeves()"); } catch (e) { r = null; }
            if (typeof r !== "number") {
                slvSkip(ns, "Anzahl nicht ermittelbar (evalNs null, RAM?) — Versuch später erneut.");
                return { count: -1, ts: now };            // NICHT cachen
            }
            c.sleeveCount = r;
        }
        if (c.sleeveCount > 0) {
            list = await io.sing(
                `Array.from({length:${c.sleeveCount}},(_,i)=>{const s=ns.sleeve.getSleeve(i);` +
                `let t=null;try{t=ns.sleeve.getTask(i);}catch(e){}` +
                `return {i,shock:s.shock,sync:s.sync,city:s.city,skills:s.skills,` +
                `task:t?{type:t.type,factionName:t.factionName,crimeType:t.crimeType,actionType:t.actionType,actionName:t.actionName}:null};})`
            );
        }
    }
    if (c.sleeveCount === 0) {
        slvSkip(ns, "0 Sleeves in dieser BitNode — Steuerung dauerhaft aus.");
        return { count: 0, ts: now };
    }
    if (!Array.isArray(list) || list.length === 0) {
        slvSkip(ns, `Zustände nicht lesbar (Quelle ${io.mode === "INFO" && io.b.sleeves ? "INFO-Block leer" : "evalNs null"}) — übersprungen.`);
        return { count: c.sleeveCount, ts: now };
    }
    slvSkip(ns, "");                                       // Grund zurücksetzen
    const n = list.length;

    // ---------- Kontext -----------------------------------------------------
    const feat = bitNodeFeatures(ns);
    let karmaGrind = false;
    if (feat.gang) {
        const inGang = await io.gangIn();
        if (inGang === false) {                            // null = unbekannt -> KEIN Grind
            const karma = await io.karma();
            if (typeof karma === "number" && karma > CFG.KARMA_GOAL) karmaGrind = true;
        }
    }
    let bladeReady = false, chaos = 0, contractsAvail = [];
    if (feat.bladeburner) {
        bladeReady = (await io.bladeIn()) === true;
        if (bladeReady) {
            if (io.mode === "INFO" && io.b.blade) {
                chaos = io.b.blade.chaos || 0;
                const ct = io.b.blade.contracts || {};
                contractsAvail = BLADE_CONTRACTS.filter(x => (ct[x] || 0) > 0);
            } else {
                const r = await io.sing(
                    "(()=>{try{const c=ns.bladeburner.getCity();" +
                    "return {chaos:ns.bladeburner.getCityChaos(c)," +
                    "ct:Object.fromEntries(ns.bladeburner.getContractNames().map(x=>[x,ns.bladeburner.getActionCountRemaining('Contracts',x)]))};}" +
                    "catch(e){return null;}})()");
                if (r) { chaos = r.chaos || 0; contractsAvail = BLADE_CONTRACTS.filter(x => (r.ct?.[x] || 0) > 0); }
            }
        }
    }
    let workFaction = c.workFacOverride || null;
    if (!workFaction) {
        const cw = await io.currentWork();
        if (cw && cw.type === "FACTION") workFaction = cw.factionName;
    }

    // Rep-Rangliste (nur REP-Modus): AUGS-Ziel zuerst, dann Aug-Wert-Ranking.
    // v2.0.2: gleicher Rep-Lücken-Filter wie beim Player (s. doReputation) —
    // Sleeves grinden keine Faktion mehr, deren goal die Rep schon deckt.
    // v5.0: der Spielerstand wird jetzt EINMAL geholt und von zwei Stellen
    // benutzt (Rep-Rangliste und Firmenliste). Vorher steckte er im REP-Zweig
    // fest, und die Firmenliste haette ihn ein zweites Mal ziehen muessen.
    const pS = await io.player();
    const joinedS = pS && Array.isArray(pS.factions) ? pS.factions : [];

    let repRank = [];
    if (c.mode === "REP" && c.augGoals) {
        const joined = joinedS;
        const repMapS = (io.mode === "INFO" && io.b.rep) ? io.b.rep : null;
        const gapOpenS = (f) => {
            const g = c.augGoals[f];
            if (!repMapS || !repMapS[f] || !g || !(g.goal > 0)) return true;
            return (repMapS[f].rep || 0) < g.goal;
        };
        // v4.1 BUGFIX: Gang-Faktion ausschliessen. Sleeve.ts:166-169 wirft dort
        // ausdruecklich ("cannot work for faction ... because you have started a
        // gang with them"). doReputation filtert sie fuer den SPIELER laengst
        // (gangFac); bei den Sleeves fehlte es — der Sleeve verlor seinen
        // Rep-Slot an eine unmoegliche Faktion und fiel auf Crime zurueck.
        const gangFacS = (io.b && io.b.gang && io.b.gang.member) ? io.b.gang.faction : null;
        repRank = joined
            .filter(f => !CANNOT_WORK.includes(f) && f !== gangFacS)
            .map(f => ({ f, v: (c.augGoals[f] || {}).value || 0 }))
            .filter(x => x.v > 0 && gapOpenS(x.f))
            .sort((a, b) => b.v - a.v)
            .map(x => x.f);
        // v3.5: kein Port-17-Vorrang mehr — die Rangliste oben ist die einzige
        // Quelle, und Sleeves folgen derselben Ordnung wie der Spieler.
    }

    // =========================================================================
    // v4.3 — HAT BLADEBURNER SEIN ZIEL ERREICHT?
    // =========================================================================
    // Die Sleeves unterstuetzen Bladeburner (Diplomacy, Aufklaerung, Contracts),
    // solange RANG noch etwas kauft — also solange BlackOps offen sind. Ist nur
    // noch die finale "Operation Daedalus" uebrig und die sicher, kauft weiterer
    // Rang nichts mehr: der Daemon stellt dann selbst auf Geld um, und die
    // Sleeves gehoeren zurueck auf Faktions-Feldarbeit.
    //
    // Das Signal wird hier SELBST hergeleitet und nicht vom Bladeburner-Payload
    // gemeldet. INFO veroeffentlicht ohnehin blade.nextBlackOp mit {name, rank,
    // chance:[unten, oben]} (SCHWARM-INFO.js:486-499) — daraus ergibt sich
    // dieselbe Bedingung ohne einen neuen Kanal und ohne dass zwei Daemons ihre
    // Innereien austauschen muessen.
    //
    // OBERE Grenze, nicht untere: bei BlackOps sind Bevoelkerung und Chaos fest
    // auf Faktor 1 (Actions/BlackOperation.ts, getPopulationSuccessFactor /
    // getChaosSuccessFactor). Die Spanne ist reines Schaetzrauschen der
    // Bevoelkerungsschaetzung; die obere Zahl ist die wahre Chance. Live stand
    // dort "42.4 % ~ 100.0 %" — wer die untere liest, schaltet nie um.
    let bladeEndgame = false;
    try {
        const nb = io.b && io.b.blade && io.b.blade.nextBlackOp;
        if (nb && nb.name === "Operation Daedalus" && Array.isArray(nb.chance)) {
            bladeEndgame = Number(nb.chance[1]) >= 0.999;
        }
    } catch (e) { /* kein blade-Block -> kein Endspiel */ }

    // ---------- Firmenplaetze (v5.0) ----------------------------------------
    // Die Liste steht VOR dem Rollenplan, weil sie dessen Obergrenze ist.
    const companyOpen = sleeveCompanyTargets(io, joinedS);

    // ---------- 15-min-Slot & Rollenplan ------------------------------------
    const slot = Math.floor(now / CFG.SLEEVE_ROTATE_MS);
    const trainSlot = (slot % 2 === 0);                    // gerade Slots: Training erlaubt
    const roles = buildSleeveRoles(n, {
        mode: c.mode, repRank, workFaction, bladeReady,
        chaos, contractsAvail, slot,
        crimePays: crimePaysIn(io),   // v4.1
        bladeEndgame,                 // v4.3
        companyOpen,                  // v5.0
    });

    // ---------- Sleeves steuern ---------------------------------------------
    // v4.6 — DIE SPIELER-FAKTION WAR UNNOETIG GESPERRT.
    // Hier stand `new Set(workFaction ? [workFaction] : [])`, die Faktion des
    // Spielers war also fuer alle Sleeves blockiert. Die Engine verlangt das
    // nicht: setToFactionWork prueft ausschliesslich die ANDEREN SLEEVES
    // (NetscriptFunctions/Sleeve.ts:152-164, Schleife ueber Player.sleeves) und
    // zusaetzlich die Gang-Faktion (:166). Der Spieler kommt in keiner der
    // beiden Pruefungen vor.
    //
    // Das kostete einen Slot — und laut der Diagnose unten sind gerade die
    // FAKTIONEN die Grenze, nicht der Deckel. Spieler und Sleeve sammeln Ruf
    // fuer dieselbe Faktion additiv; es geht nichts verloren.
    //
    // Die Gang-Faktion bleibt aussen vor: dort wirft die Engine wirklich.
    const taken = new Set();
    try {
        const gangFac = (io && io.b && io.b.gang) ? io.b.gang.faction : null;
        if (gangFac) taken.add(gangFac);
    } catch (e) { /* kein gang-Block -> nichts zu sperren */ }

    // v5.0 — WAS SCHON LAEUFT, WIRD ZUERST EINGETRAGEN.
    // Bisher fuellte sich `taken` erst waehrend der Schleife. Sleeve #0 griff
    // deshalb nach einer Faktion, auf der #3 laengst arbeitete; die Engine wies
    // das zwar ab (setToFactionWork wirft), aber erst nach einem RPC — und in
    // der Zwischenzeit konnte #0 eine Faktion belegen, die #3 danach fehlte.
    // Sichtbar wurde das als Rollen-Wackeln von Takt zu Takt. Bei den FIRMEN
    // waere derselbe Effekt teurer, weil dort jeder Fehlversuch eine
    // angefangene Ruf-Abrechnung abbricht. Also: erst lesen, dann verteilen.
    const takenComp = new Set();
    for (const sX of list) {
        const tX = sX && sX.task;
        if (!tX) continue;
        if (tX.type === "FACTION" && tX.factionName) taken.add(tX.factionName);
        if (tX.type === "COMPANY" && tX.companyName) takenComp.add(tX.companyName);
    }

    let acted = 0, log = [];
    for (let k = 0; k < n; k++) {
        const sl = list[k];
        const t = sl.task || null;

        // 1) Sync -> 100.  REIHENFOLGE GEDREHT in v3.10 (vorher Shock zuerst).
        //    Begründung aus der Engine:
        //      - SleeveSynchroWork.process kennt KEIN shockBonus() — ein Sleeve mit
        //        Shock 100 synchronisiert exakt so schnell wie einer mit Shock 0.
        //      - Shock sinkt zusätzlich PASSIV (sleeves.md: "Sleeve shock slowly
        //        decreases over time"; Shock Recovery erhöht nur die Rate).
        //        Für Sync gibt es keine passive Komponente.
        //    Daraus folgt: die Sync-Phase kostet Shock nichts, die Shock-Phase
        //    kostet Sync alles. Sync zuerst ist damit nie langsamer und praktisch
        //    immer schneller bis "Sleeve voll nutzbar".
        //    PREIS: purchaseSleeveAug (BANK) verlangt shock === 0 und ist deshalb
        //    bis zum Ende der Sync-Phase blockiert. Bewusst in Kauf genommen —
        //    ein Sleeve unter 100 % Sync liefert ohnehin nur A*X*Y an den Spieler.
        if ((sl.sync || 0) < CFG.SLEEVE_SYNC_OK) {
            if (!(t && t.type === "SYNCHRO")) {
                await io.act("sleeveSynchronize", [sl.i], `ns.sleeve.setToSynchronize(${sl.i})`);
            }
            log.push(`#${sl.i}:Sync`);
            continue;
        }
        // 2) Shock — v3.11: SCHWELLE STATT VOLLER GRIND.
        //
        //    Die alte Regel war "Recovery, bis shock === 0", weil
        //    purchaseSleeveAug (BANK) genau das verlangt. Der Preis: der Sleeve
        //    tut bis dahin NICHTS anderes.
        //
        //    Am Quellcode nachgemessen (Sleeve.ts / SleeveRecoveryWork.ts) —
        //    der alte Kommentar berief sich hier nur auf sleeves.md:
        //        Sleeve.process():          shock -= 0.0001 * intBonus * cycles
        //        SleeveRecoveryWork:        shock -= 0.0002 * intBonus * cycles
        //    Der Grundabbau steht VOR dem Aufruf der eigentlichen Arbeit und
        //    verlangt nur, dass der Sleeve ueberhaupt beschaeftigt ist. Shock
        //    sinkt also bei JEDER Aufgabe; Recovery ist dreimal so schnell,
        //    nicht der einzige Weg.
        //
        //    Damit ist "Recovery bis 0" nur oben sinnvoll: shockBonus ist
        //    (100 - shock)/100, ein Sleeve bei Shock 90 verdient also 10 %.
        //    Dort lohnt das Dreifache. Bei Shock 30 verdient er 70 % — dann ist
        //    Arbeiten mit passivem Abbau eintraeglicher als Stillstand.
        //
        //    FOLGE fuer die Sleeve-Augs: shock === 0 kommt spaeter, aber ohne
        //    dass der Sleeve dafuer stillsteht. Das ist der bewusste Tausch.
        if ((sl.shock || 0) > CFG.SLEEVE_SHOCK_RECOVER_ABOVE) {
            if (!(t && t.type === "RECOVERY")) {
                await io.act("sleeveShockRecovery", [sl.i], `ns.sleeve.setToShockRecovery(${sl.i})`);
            }
            log.push(`#${sl.i}:Shock`);
            continue;
        }
        // 3) Karma-Grind: blind Homicide (Fehlschlag > erfolgreicher Mug).
        if (karmaGrind) {
            if (!(t && t.type === "CRIME" && t.crimeType === "Homicide")) {
                await io.act("sleeveCrime", [sl.i, "Homicide"], `ns.sleeve.setToCommitCrime(${sl.i}, "Homicide")`);
            }
            acted++; log.push(`#${sl.i}:Karma`);
            continue;
        }
        // 4) Training — NUR in geraden 15-min-Slots, solange nötig & rentabel.
        const sk = sl.skills || {};
        const combatAvg = ((sk.strength || 0) + (sk.defense || 0) + (sk.dexterity || 0) + (sk.agility || 0)) / 4;
        const gymStat = sleeveGymStat(sk);
        if (trainSlot && gymStat && combatAvg < CFG.SLEEVE_TRAIN_CAP) {
            let done = false;
            // v4.6: ZUERST Faktionsarbeit versuchen. Security trainiert 1,5 Exp/s
            // je Kampfstat gegen 1,0 beim Bladeburner-Training und bringt
            // zusaetzlich Ruf; die Rechnung steht bei trainViaFaction.
            //
            // Ausnahme: zaehlt der Bladeburner-Rang in dieser BitNode, bleibt es
            // beim Bladeburner-Training — dort baut es die AUSDAUER auf, die man
            // fuer Operationen braucht. Ist der Rang wertlos (BN8:
            // BladeburnerRank 0), gibt es keine Operationen, fuer die sich das
            // lohnen wuerde. Unbekannte Regel (kein SF5) -> null -> altes
            // Verhalten, wie bei crimePaysIn.
            const rangZaehlt = bladeRankPaysIn(io);
            if (!(bladeReady && rangZaehlt !== false)) {
                const viaFac = await trainViaFaction(ns, io, sl, repRank, taken);
                if (viaFac) {
                    acted++; log.push(`#${sl.i}:Train(${viaFac.art.slice(0, 3)}/${viaFac.fac})`);
                    continue;
                }
            }
            if (bladeReady) {
                if (t && t.type === "BLADEBURNER" && t.actionName === "Training") done = true;
                else {
                    const ok = await io.act("sleeveBladeAction", [sl.i, "Training"],
                        `(() => { try { return ns.sleeve.setToBladeburnerAction(${sl.i}, "Training"); } catch(e){ return false; } })()`);
                    done = ok === true;
                }
            }
            if (!done) {
                if (!(t && t.type === "CLASS")) {
                    // v4.0 BUGFIX: setToGymWorkout verlangt, dass der SLEEVE in
                    // der Stadt des Gyms steht. CFG.SLEEVE_GYM ist "Powerhouse
                    // Gym", und Gyms gibt es laut LocationsMetadata.ts nur in
                    // Sector-12, Aevum und Volhaven. Stand ein Sleeve woanders,
                    // schlug der Aufruf STILL fehl — der Rueckgabewert wurde nie
                    // geprueft, also trainierte der Sleeve schlicht nicht.
                    // Sleeve-Staedte sind unabhaengig von der Spielerstadt.
                    // ns.sleeve.travel kostet wie eine Spielerreise, deshalb nur
                    // oberhalb des Betriebssockels; die Stadt bleibt danach.
                    let cashS = 0;
                    try { cashS = ns.getServerMoneyAvailable("home"); } catch (e) { cashS = 0; }
                    if (SLEEVE_GYM_CITY && sl.city !== SLEEVE_GYM_CITY && cashS > OPERATING_FLOOR + TRAVEL_COST) {
                        const moved = await io.act("sleeveTravel", [sl.i, SLEEVE_GYM_CITY],
                            `(() => { try { return ns.sleeve.travel(${sl.i}, ${J(SLEEVE_GYM_CITY)}); } catch (e) { return false; } })()`);
                        if (moved === true) ns.print(`SLEEVE #${sl.i}: nach ${SLEEVE_GYM_CITY} (Gym)`);
                    }
                    const okGym = await io.act("sleeveGym", [sl.i, CFG.SLEEVE_GYM, gymStat],
                        `ns.sleeve.setToGymWorkout(${sl.i}, ${J(CFG.SLEEVE_GYM)}, ${J(gymStat)})`);
                    // Fehlschlag nicht mehr verschlucken: er war zwei Versionen
                    // lang unsichtbar und hat das Sleeve-Training lahmgelegt.
                    if (okGym !== true) ns.print(`SLEEVE #${sl.i}: Gym-Training abgelehnt (Stadt ${sl.city || "?"}).`);
                }
            }
            acted++; log.push(`#${sl.i}:Train`);
            continue;
        }
        // 5) Produktive Rolle laut Plan (rotiert je Slot).
        const role = roles[k];
        const r = await applySleeveRole(ns, io, sl, t, role, {
            taken, repRank, contractsAvail, companyOpen, takenComp,   // v5.0
        });
        if (r) { acted++; log.push(`#${sl.i}:${r}`); }
        else {
            // v5.0 ZWEITE CHANCE, BEVOR ES CRIME WIRD.
            // War die geplante Rolle nicht anwendbar (Faktion vergeben, Blade-
            // Aktion abgelehnt), stand hier sofort Crime. Eine freie FIRMA ist
            // aber in jedem Fall besser als jedes Verbrechen in BN8 — sie zahlt
            // Konzern-Ruf, Exp und einen Kursschub statt nichts. Also erst das,
            // und Crime nur, wenn auch das leer ausgeht.
            let ersatz = null;
            if (!role || role.kind !== "company") {
                ersatz = await applySleeveRole(ns, io, sl, t, { kind: "company" }, {
                    taken, repRank, contractsAvail, companyOpen, takenComp,
                });
            }
            if (ersatz) { acted++; log.push(`#${sl.i}:${ersatz}`); continue; }

            // Rolle nicht anwendbar -> Crime nach ZWECK (nie leerlaufen).
            // v3.7: Kampf-Exp, solange der Sleeve unter dem Trainingsziel liegt —
            // dann zahlt sich der Leerlauf wenigstens in Stats aus. Danach Geld.
            // Der Karma-Fall wird oben in Zweig 3 abgefangen und kommt hier nie an.
            //
            // v5.0: In einer BitNode ohne Crime-Geld gibt es keinen Geld-Zweck.
            // crimePaysIn liefert false (BN8: CrimeMoney 0) -> immer "combat",
            // sonst waehlte der Sleeve oberhalb SLEEVE_TRAIN_CAP das Verbrechen
            // mit dem besten erwarteten Ertrag von NULL. Unbekannt (null) laesst
            // wie ueberall das alte Verhalten stehen.
            const geldZaehlt = crimePaysIn(io) !== false;
            const purpose = (!geldZaehlt || combatAvg < CFG.SLEEVE_TRAIN_CAP) ? "combat" : "money";
            const crime = pickSleeveCrime(sk, purpose);
            if (!(t && t.type === "CRIME" && t.crimeType === crime)) {
                await io.act("sleeveCrime", [sl.i, crime], `ns.sleeve.setToCommitCrime(${sl.i}, ${J(crime)})`);
            }
            acted++; log.push(`#${sl.i}:Crime`);
        }
    }

    const trained = log.some(x => x.endsWith(":Train"));
    ns.print(`SLEEVES[${io.mode}] v5.0 Slot ${slot % 2 === 0 ? "A" : "B"}${trained ? " (Training)" : ""}: ${log.join(" ")} (${acted}/${n} aktiv)`);
    // v4.2 DIAGNOSE: die Entscheidungsgroessen der Rollenvergabe. Ohne sie war
    // aus dem Log nicht zu erkennen, ob zu wenige Faktionen offen sind, der
    // Deckel greift oder schlicht noch die alte Codefassung laeuft.
    {
        const repRoles = roles.filter(r => r && r.kind === "rep").length;
        const compRoles = roles.filter(r => r && r.kind === "company").length;
        const crimeRoles = roles.filter(r => r && r.kind === "crime").length;
        const cp = crimePaysIn(io);
        const cpTxt = cp === null ? "unbekannt (kein SF5?)" : (cp ? "ja" : "nein");
        const cap = repSlotCap(n, { bladeReady, crimePays: cp });
        ns.print(`  Rollen: rep ${repRoles}/${n} | Firma ${compRoles} | Crime ${crimeRoles}`
            + ` | Faktionen offen ${repRank.length} | Firmen offen ${companyOpen.length}`
            + ` | Deckel ${cap} | Crime zahlt: ${cpTxt}`
            + ` | Bladeburner ${bladeReady ? "ja" : "nein"} | Modus ${c.mode}`);
        if (repRoles < n && repRank.length <= repRoles && c.mode === "REP") {
            ns.print(`  -> Grenze sind die FAKTIONEN (${repRank.length}), nicht der Deckel.`
                + ` Die Engine laesst zwei Sleeves nie auf dieselbe Faktion.`);
        } else if (repRoles < n && cap < n && cp !== false) {
            ns.print(`  -> Der Deckel greift (${cap}). Crime zahlt hier `
                + `${cpTxt} — ohne "nein" bleibt SLEEVE_REP_MAX stehen.`);
        }
        // v5.0: Der Crime-Rueckfall ist ab jetzt ein BEFUND, kein Normalzustand.
        // Wer hier landet, hat weder Faktion noch Firma — und in einer BitNode
        // ohne Crime-Geld ist das verschenkte Zeit, die man sehen soll.
        if (crimeRoles > 0 && cp === false) {
            ns.print(`  -> ${crimeRoles} Sleeve(s) auf CRIME, obwohl Crime hier kein Geld bringt.`
                + (companyOpen.length === 0
                    ? ` Keine Firma offen — hat der Spieler ueberhaupt Jobs? (applySweep)`
                    : ` Firmenliste hat ${companyOpen.length} Eintraege, aber alle belegt.`));
        }
    }
    return { count: c.sleeveCount, ts: now };
}

/**
 * Rollenplan für n Sleeves bauen und um slot%n rotieren (sichtbarer Wechsel
 * alle 15 min, auch wenn sich sonst nichts ändert).
 * Rollen: {kind:"rep"} | {kind:"diplomacy"} | {kind:"contracts", name} |
 *         {kind:"infiltrate"} | {kind:"crime"}
 */
/**
 * Bringt Crime in dieser BitNode ueberhaupt Geld? (v4.1)
 * null = nicht ermittelbar (kein SF5, Mults fehlen im bn-Block) -> Aufrufer
 * behalten das alte Verhalten. Eine unbekannte Regel darf nie zu einer
 * Verhaltensaenderung fuehren.
 */
function crimePaysIn(io) {
    try {
        const m = (io && io.b && io.b.bn) ? io.b.bn.mults : null;
        if (!m || typeof m.CrimeMoney !== "number") return null;
        return m.CrimeMoney > 0;
    } catch (e) { return null; }
}

/**
 * Bringt Bladeburner-RANG in dieser BitNode ueberhaupt etwas? (v4.6)
 * Gleiche Bauart wie crimePaysIn: unbekannt -> null -> altes Verhalten.
 * In BN8 ist BladeburnerRank 0; jede Bladeburner-Handlung ist dort fuer den
 * Rang wertlos. Fuer das TRAINING zaehlt das trotzdem nicht direkt — Training
 * gibt Exp und Ausdauer, keinen Rang. Wohl aber fuer die Frage, ob die
 * Ausdauer ueberhaupt gebraucht wird: ohne Rangfortschritt gibt es keine
 * Operationen, fuer die man sie braeuchte.
 */
function bladeRankPaysIn(io) {
    try {
        const m = (io && io.b && io.b.bn) ? io.b.bn.mults : null;
        if (!m || typeof m.BladeburnerRank !== "number") return null;
        return m.BladeburnerRank > 0;
    } catch (e) { return null; }
}

// =============================================================================
// v4.6 — TRAINING UEBER FAKTIONSARBEIT STATT UEBER GYM/BLADEBURNER
// =============================================================================
// Am Quelltext nachgerechnet, je KAMPFSTAT und Sekunde. Beide Wege sind mit
// sleeve.shockBonus() skaliert, also direkt vergleichbar:
//
//   Bladeburner-Training   30 Exp je Aktion, Aktionsdauer 30 s
//                          (Bladeburner.ts:1096-1099, GeneralActions.ts:8)
//                          -> 1,0 Exp/s   + Ausdauer, KEIN Ruf
//   Faction FIELD          Basis 1,0, Rate = Basis * mults * 1/gameCPS,
//                          5 Zyklen/s (Constants MilliPerCycle 200)
//                          -> 1,0 Exp/s   + Hack- und Charisma-Exp, + RUF
//   Faction SECURITY       Basis 1,5  (Work/Formulas.ts:49-55)
//                          -> 1,5 Exp/s   + Hack-Exp, + RUF
//
// Security trainiert also die Hälfte schneller als Bladeburner-Training UND
// wirft Ruf ab. Der einzige Vorteil des Bladeburner-Trainings ist die
// Ausdauer — die man nur braucht, wenn Bladeburner-Operationen ueberhaupt
// etwas bringen. Deshalb bleibt es dort, wo der Rang zaehlt, und weicht sonst.
//
// GRENZE, aus der Engine: setToFactionWork wirft, wenn ein ANDERER Sleeve
// schon fuer diese Faktion arbeitet (NetscriptFunctions/Sleeve.ts:152-164).
// Die Zahl der beigetretenen Faktionen ist damit die harte Obergrenze. Der
// Spieler zaehlt NICHT mit — die Pruefung laeuft nur ueber Player.sleeves.
// workForFaction liefert ausserdem false statt zu werfen, wenn die Faktion die
// Arbeitsart gar nicht anbietet (Sleeve.ts:418-432); deshalb wird der
// Rueckgabewert geprueft und der Reihe nach security -> field versucht.
async function trainViaFaction(ns, io, sl, repRank, taken) {
    if (!Array.isArray(repRank)) return null;
    const t = sl && sl.task;
    for (const eintrag of repRank) {
        const fac = typeof eintrag === "string" ? eintrag : (eintrag && eintrag.faction);
        if (!fac) continue;
        // v5.0: Steht er schon auf dieser Faktion und trainiert dort bereits
        // (security/field), bleibt er stehen. Ohne diese Zeile zog ihn die aus
        // den laufenden Aufgaben vorbelegte `taken`-Menge von seinem eigenen
        // Platz weg — jeder Takt ein Wechsel, und der Ruf-Fortschritt der
        // angefangenen Abrechnung ging jedes Mal verloren.
        if (t && t.type === "FACTION" && t.factionName === fac
            && (t.factionWorkType === "security" || t.factionWorkType === "field")) {
            taken.add(fac);
            return { fac, art: String(t.factionWorkType) };
        }
        if (taken.has(fac)) continue;
        for (const art of ["security", "field"]) {
            const ok = await io.act("sleeveFactionWork", [sl.i, fac, art],
                `(() => { try { return ns.sleeve.setToFactionWork(${sl.i}, ${J(fac)}, ${J(art)}); } catch (e) { return false; } })()`);
            if (ok === true) { taken.add(fac); return { fac, art }; }
        }
    }
    return null;
}

/**
 * Wie viele Sleeves duerfen auf Faktions-Rep? (v4.1)
 *
 * CFG.SLEEVE_REP_MAX stammt aus der Zeit, als Bladeburner die Alternativrollen
 * stellte (Infiltrate / Diplomacy / Contracts). Ohne nutzbaren Bladeburner
 * bleibt nur Crime — und bringt Crime in dieser BitNode kein Geld
 * (BN8: CrimeMoney 0, BitNode.tsx:769), ist jeder Sleeve auf Crime ein
 * verschenkter Sleeve. In BN8 kommt hinzu, dass auch BladeburnerRank 0 ist:
 * selbst ein Beitritt wuerde dort nichts einbringen.
 *
 * Die Zahl der Faktionen begrenzt das ohnehin (Engine: zwei Sleeves nie auf
 * dieselbe Faktion) — das passiert beim Aufrufer ueber repRank.length.
 */
function repSlotCap(n, ctx) {
    // v4.3: Im Bladeburner-Endspiel faellt der Deckel. Der Deckel existiert
    // NUR, um Plaetze fuer die Bladeburner-Unterstuetzung freizuhalten — und
    // die ist wertlos, sobald weiterer Rang nichts mehr kauft (Begruendung
    // beim Signal bladeEndgame in der Sleeve-Steuerung). Dann gehoert jeder
    // Sleeve auf Faktionsarbeit, solange Faktionen offen sind.
    if (ctx.bladeEndgame) return n;
    if (ctx.bladeReady) return Math.min(CFG.SLEEVE_REP_MAX, n - 1);
    if (ctx.crimePays === false) return n;
    return Math.min(CFG.SLEEVE_REP_MAX, n - 1);
}

// =============================================================================
// v5.0 — FIRMENARBEIT FUER SLEEVES: DIE FEHLENDE ROLLE
// =============================================================================
// DAS PROBLEM, wie es der Betrieb zeigte: acht Sleeves, Gang gegruendet,
// Karma laengst verbraucht, Bladeburner-Rang wertlos, Crime-Geld null. Sobald
// mehr Sleeves da sind als offene Faktionen, fielen die uebrigen auf Crime —
// und Crime bringt in BN8 exakt nichts ausser ein paar Kampf-Exp.
//
// DIE ENGINE BIETET EINEN AUSWEG, DEN DER SCHWARM NIE BENUTZT HAT:
// ns.sleeve.setToCompanyWork. Nachgelesen, weil "bringt doch auch kein Geld"
// die naheliegende Annahme war — und sie ist falsch:
//
//   calculateCompanyWorkStats (Work/Formulas.ts:137/156) hat ZWEI getrennte
//   Zeilen. Das Gehalt haengt an currentNodeMults.CompanyWorkMoney, und das
//   ist in BN8 null. Der RUF haengt an currentNodeMults.CompanyWorkRepGain —
//   den setzt BN8 nirgends, er steht also auf 1.
//   => Firmen-Ruf laeuft in BN8 mit VOLLER Geschwindigkeit. Tot ist nur der Lohn.
//
//   SleeveCompanyWork.process (PersonObjects/Sleeve/Work/SleeveCompanyWork.ts:46)
//   schreibt den Ruf direkt auf das Spielerkonto der Firma:
//       company.playerReputation += gains.reputation * cycles;
//   Der Sleeve arbeitet also fuer DEN SPIELER, nicht fuer sich.
//
// WOFUER DAS GUT IST: 400.000 Firmen-Ruf schalten die Konzern-Faktion frei
// (Constants.ts:25, CorpFactionRepRequirement). Zehn solche Faktionen gibt es.
// Jede neue Faktion ist danach ein neuer Rep-Platz FUER EINEN SLEEVE und ein
// neuer Aug-Katalog. Die Sleeves bauen sich also ihre eigenen kuenftigen
// Arbeitsplaetze — das ist der einzige Weg, der aus dem Engpass herausfuehrt,
// statt ihn zu verwalten.
//
// DREI BEDINGUNGEN, alle aus der Engine:
//   1. Der SPIELER muss dort einen Job haben. Sleeve.workForCompany:66
//      "const companyPositionName = Player.jobs[companyName]; if (!...) return false;"
//      Das ist erfuellt: applySweep bewirbt sich im 30-s-Takt auf die ganze
//      Leiter, im Betrieb standen 26 gehaltene Jobs im Bericht.
//   2. Kein ZWEITER Sleeve auf derselben Firma (NetscriptFunctions/Sleeve.ts:126-137,
//      wirft). Ein Sleeve je Firma, wie bei den Faktionen.
//   3. Der Spieler selbst blockiert NICHT — die Pruefung laeuft nur ueber
//      Player.sleeves. Spieler und acht Sleeves koennen also neun Firmen
//      gleichzeitig hochziehen.
//
// NEBENEFFEKT, in BN8 nicht klein: influenceStockThroughCompanyWork
// (StockMarket/PlayerInfluencing.ts:82-88) schiebt bei jeder Abrechnung mit
// Wahrscheinlichkeit 0,002 x Zyklen die Zweitprognose der FIRMENAKTIE nach
// OBEN. In einer BitNode, deren Geld aus der Boerse kommt, arbeitet ein Sleeve
// damit dem TRADER zu, statt daneben zu stehen.
//
// WAS NICHT GEBAUT WIRD, und warum: Universitaet (ns.sleeve.setToUniversityCourse).
// ZB Institute, Algorithms gaebe 4 Exp x expMult 4 = 16 Hacking-Exp/s je Sleeve
// (Work/ClassWork.tsx:41, LocationsMetadata expMult 4). Der Schwarm erzeugt
// laut Bericht aber rund 9.938 Hacking-XP/s aus den Worker-Skripten — acht
// Sleeves brachten 128/s, also 1,3 %, und kosteten 320 x costMult 5 = 1.600 $/s
// je Sleeve. Das lohnt nicht. Gym Powerhouse (1 Exp x expMult 10 = 10 Exp/s in
// EINEM Stat) ist der schnellste Kampftrainer, kostet aber 2.400 $/s je Sleeve;
// es bleibt deshalb dort, wo es steht — im Trainingsslot, nicht als Dauerrolle.
//
/**
 * Firmen, auf die ein Sleeve gesetzt werden darf — beste zuerst.
 * Reihenfolge: Firmen mit noch NICHT beigetretener Konzern-Faktion zuerst
 * (dort kauft der Ruf etwas), danach der Rest (dort bleibt Exp + Kursschub).
 *
 * @param {object} io        IO-Schicht (fuer io.b.player.jobs)
 * @param {string[]} joined  beigetretene Faktionen
 * @returns {string[]} Firmennamen
 */
function sleeveCompanyTargets(io, joined) {
    let jobs = null;
    try { jobs = (io && io.b && io.b.player) ? io.b.player.jobs : null; } catch (e) { jobs = null; }
    // Kein player-Block -> Jobs unbekannt. Eine unbekannte Regel darf nie zu
    // einer Verhaltensaenderung fuehren: dann gibt es keine Firmenrolle, und
    // der alte Rueckfall greift. Ein Fehlversuch je Sleeve und Takt waere
    // sonst der Preis fuer eine Vermutung.
    if (!jobs || typeof jobs !== "object") return [];
    const dabei = Array.isArray(joined) ? joined : [];
    const mitFaktion = [], ohne = [];
    for (const eintrag of COMPANY_LADDER) {
        const firma = eintrag.company;
        if (NEVER_COMPANY.includes(firma)) continue;
        if (!jobs[firma]) continue;                       // Spieler hat dort keine Stelle
        if (eintrag.faction && !dabei.includes(eintrag.faction)) mitFaktion.push(firma);
        else ohne.push(firma);
    }
    return mitFaktion.concat(ohne);
}

function buildSleeveRoles(n, ctx) {
    const roles = [];
    const repWanted = ctx.repRank.length > 0;

    // v4.3: Im Endspiel zaehlt Bladeburner-Rang nicht mehr — die
    // Unterstuetzungsrollen entfallen komplett.
    const bladeHilft = ctx.bladeReady && !ctx.bladeEndgame;

    // v5.0: Wie viele Firmenplaetze stehen bereit? Ein Sleeve je Firma
    // (Engine wirft sonst), also ist die Liste selbst die Obergrenze.
    const firmen = Array.isArray(ctx.companyOpen) ? ctx.companyOpen.length : 0;
    let firmenFrei = firmen;

    if (n === 1) {
        if (ctx.mode === "REP" && repWanted) roles.push({ kind: "rep" });
        else if (bladeHilft) roles.push({ kind: "infiltrate" });
        else if (firmenFrei > 0) roles.push({ kind: "company" });
        else roles.push({ kind: "crime" });
        return roles;
    }

    // n >= 2
    // v4.1: Der Deckel gilt nur, wenn es eine lohnende Alternative gibt
    // (siehe repSlotCap). Sonst gehoert jeder Sleeve auf Rep, solange
    // Faktionen offen sind.
    const repSlots = (ctx.mode === "REP")
        ? Math.min(repSlotCap(n, ctx), ctx.repRank.length) : 0;
    for (let i = 0; i < repSlots; i++) roles.push({ kind: "rep" });
    if (bladeHilft) {
        if (ctx.chaos > CFG.CHAOS_LIMIT && roles.length < n) roles.push({ kind: "diplomacy" });
        // v4.3 AUFKLAERUNG. "Field Analysis" ist die zweite echte Unterstuetzung:
        // sie verengt die Bevoelkerungsschaetzung der Stadt, und aus DER Spanne
        // entsteht die Unsicherheit, die den Bladeburner-Daemon Operationen
        // verwerfen laesst (er verlangt SUCCESS_MIN auf der UNTEREN Grenze).
        // Livebeleg: "Erfolgschance 42.4 % ~ 100.0 %, Schaetzung um Faktor 2.36
        // daneben" — ein Sleeve auf Aufklaerung raeumt genau das ab. Kostet
        // keine Stamina des Spielers und verbraucht keine Auftraege.
        if (roles.length < n) roles.push({ kind: "fieldanalysis" });
        if (ctx.contractsAvail.length > 0 && roles.length < n) {
            const name = ctx.contractsAvail[ctx.slot % ctx.contractsAvail.length];
            roles.push({ kind: "contracts", name });
        }
        while (roles.length < n) roles.push({ kind: "infiltrate" });
    } else {
        // v5.0: Erst Firmenarbeit (Konzern-Ruf, Exp, Kursschub — alles echt),
        // Crime nur noch, wenn wirklich nichts mehr uebrig ist. Frueher stand
        // hier ausschliesslich "crime", und das war in BN8 verschenkte Zeit.
        while (firmenFrei > 0 && roles.length < n) { roles.push({ kind: "company" }); firmenFrei--; }
        while (roles.length < n) roles.push({ kind: "crime" });
    }
    // Rotation: Rollen wandern alle 15 min einen Sleeve weiter.
    const off = ctx.slot % n;
    return roles.slice(off).concat(roles.slice(0, off));
}

/** Eine Rolle auf einen Sleeve anwenden. Rückgabe: Kurzlabel oder null. */
async function applySleeveRole(ns, io, sl, t, role, ctx) {
    if (!role) return null;
    if (role.kind === "rep") {
        for (const fac of ctx.repRank) {
            // v5.0 REIHENFOLGE GEDREHT. "Laeuft er schon darauf?" muss VOR
            // "ist sie vergeben?" stehen, seit `taken` aus den laufenden
            // Aufgaben vorbelegt wird — sonst faende der Sleeve seine EIGENE
            // Faktion als vergeben vor und wuerde von ihr weggezogen.
            if (t && t.type === "FACTION" && t.factionName === fac) { ctx.taken.add(fac); return "Rep(" + fac + ")"; }
            if (ctx.taken.has(fac)) continue;
            // v3.2: Sleeves haben eigene Stats -> eigene Reihenfolge. Der Share-
            // Bonus ist global (calculateCurrentShareBonus kennt keine Person),
            // wirkt also auch hier, und die Verwässerung gilt genauso.
            for (const type of factionWorkOrder(sl.skills, sf15Of(io), sharePower(ns))) {
                const ok = await io.act("sleeveFactionWork", [sl.i, fac, type],
                    `(() => { try { return ns.sleeve.setToFactionWork(${sl.i}, ${J(fac)}, ${J(type)}); } catch(e){ return false; } })()`);
                if (ok === true) { ctx.taken.add(fac); return "Rep(" + fac + ")"; }
            }
        }
        return null;   // keine freie Faktion -> Aufrufer fällt auf Crime zurück
    }
    if (role.kind === "company") {
        // v5.0. Zwei Engine-Regeln bestimmen den Ablauf:
        //   - setToCompanyWork WIRFT, wenn ein anderer Sleeve dort arbeitet
        //     (NetscriptFunctions/Sleeve.ts:126-137) -> try/catch + takenComp.
        //   - workForCompany gibt FALSE zurueck (wirft nicht), wenn der Spieler
        //     dort keine Stelle hat (Sleeve.ts:410-412) -> Rueckgabe pruefen.
        for (const firma of (ctx.companyOpen || [])) {
            // Laeuft er schon dort? -> nicht anfassen. Diese Pruefung steht aus
            // demselben Grund wie bei "rep" VOR der takenComp-Pruefung: die
            // Menge ist aus den laufenden Aufgaben vorbelegt, der Sleeve fände
            // sonst seinen eigenen Platz als besetzt vor.
            if (t && t.type === "COMPANY" && t.companyName === firma) {
                ctx.takenComp.add(firma); return "Firma(" + firma + ")";
            }
            if (ctx.takenComp.has(firma)) continue;
            const ok = await io.act("sleeveCompanyWork", [sl.i, firma],
                `(() => { try { return ns.sleeve.setToCompanyWork(${sl.i}, ${J(firma)}); } catch (e) { return false; } })()`);
            if (ok === true) { ctx.takenComp.add(firma); return "Firma(" + firma + ")"; }
        }
        return null;   // keine freie Firma -> Aufrufer fällt auf Crime zurück
    }
    if (role.kind === "diplomacy") {
        if (t && t.type === "BLADEBURNER" && t.actionName === "Diplomacy") return "Diplo";
        const ok = await io.act("sleeveBladeAction", [sl.i, "Diplomacy"],
            `(() => { try { return ns.sleeve.setToBladeburnerAction(${sl.i}, "Diplomacy"); } catch(e){ return false; } })()`);
        return ok === true ? "Diplo" : null;
    }
    if (role.kind === "fieldanalysis") {
        // v4.3: dieselbe Bauart wie "diplomacy" — laeuft er schon, nicht anfassen.
        if (t && t.type === "BLADEBURNER" && t.actionName === "Field Analysis") return "Aufkl";
        const ok = await io.act("sleeveBladeAction", [sl.i, "Field Analysis"],
            `(() => { try { return ns.sleeve.setToBladeburnerAction(${sl.i}, "Field Analysis"); } catch(e){ return false; } })()`);
        return ok === true ? "Aufkl" : null;
    }
    if (role.kind === "contracts") {
        // ACHTUNG Engine-Format (SleeveBladeburnerWork.APICopy): Bei "Take on
        // contracts" ist task.actionName der CONTRACT-NAME ("Tracking" usw.),
        // task.actionType === "Contracts" — NICHT "Take on contracts".
        if (t && t.type === "BLADEBURNER" && BLADE_CONTRACTS.includes(t.actionName)) {
            // Läuft schon auf einem Contract. Belassen, solange der noch
            // Restzahl hat (kein Fortschritts-Reset durch Rotation).
            if (ctx.contractsAvail.includes(t.actionName)) return "Contract(" + t.actionName + ")";
        }
        const ok = await io.act("sleeveBladeAction", [sl.i, "Take on contracts", role.name],
            `(() => { try { return ns.sleeve.setToBladeburnerAction(${sl.i}, "Take on contracts", ${J(role.name)}); } catch(e){ return false; } })()`);
        return ok === true ? "Contract(" + role.name + ")" : null;
    }
    if (role.kind === "infiltrate") {
        if (t && t.type === "BLADEBURNER" && t.actionName === "Infiltrate Synthoids") return "Infiltrate";
        const ok = await io.act("sleeveBladeAction", [sl.i, "Infiltrate Synthoids"],
            `(() => { try { return ns.sleeve.setToBladeburnerAction(${sl.i}, "Infiltrate Synthoids"); } catch(e){ return false; } })()`);
        return ok === true ? "Infiltrate" : null;
    }
    return null;   // "crime" wird vom Aufrufer erledigt (braucht skills)
}

// =============================================================================
// SLEEVE-CRIME-CHANCE (Näherung, SF4-frei — unverändert aus v1.3)
// =============================================================================
// =============================================================================
// v5.0 — DIE TABELLE WAR FALSCH, UND ZWAR GENAU DA, WO SIE ENTSCHEIDET
// =============================================================================
// ANLASS: Beobachtung im Betrieb — die Sleeves begingen Shoplift, obwohl
// Shoplift kaum Stats bringt. Die Ursache lag nicht in der Auswahl-LOGIK,
// sondern in den ZAHLEN, mit denen sie rechnet. Neu abgelesen, Eintrag fuer
// Eintrag, aus Crime/Crimes.ts (Konstruktor-Reihenfolge in Crime/Crime.ts:70-78:
// workName, tooltip, type, ZEIT, GELD, SCHWIERIGKEIT, KARMA, params).
//
//   FALSCH WAR (alt -> richtig):
//     Shoplift      cexp 10 -> 4     Crimes.ts:18-19 kennt NUR dexterity_exp 2
//                                    und agility_exp 2. Kein str, kein def.
//     Rob Store     cexp 96 -> 90    Crimes.ts:32-34 (dex 45, agi 45)
//     Larceny       cexp 160 -> 120  Crimes.ts:74-76 (dex 60, agi 60)
//     Bond Forgery  cexp 210 -> 150  Crimes.ts:105-107 (nur dexterity_exp 150)
//   Und fast jede Erfolgsgewichtung war erfunden: Mug hatte cha 3 und hack 0.5
//   (Crimes.ts:59-62 kennt nur str 1.5, def 0.5, dex 1.5, agi 0.5), Shoplift
//   hatte str/def/hack (Crimes.ts:15-16 kennt nur dex 1, agi 1), Assassination
//   hatte def und cha (Crimes.ts:220-222 kennt nur str 1, dex 2, agi 1).
//   Es fehlten ausserdem zwei Verbrechen ganz: Deal Drugs und Traffick Arms.
//
//   FOLGE DER FALSCHEN ZAHLEN: Shoplift kam auf 10 Exp / 2 s = 5,0 Exp/s und
//   war damit rechnerisch der beste Kampf-Trainer im ganzen Feld — bei JEDEM
//   Statstand, weil es seine Chance 1,0 schon bei Stats um 25 erreicht. Mit den
//   echten 4 Exp / 2 s = 2,0 Exp/s ist Shoplift das ZWEITSCHLECHTESTE
//   Kampfverbrechen der Liste.
//
//   MERKSATZ (dritte Wiederholung in diesem Projekt): ein Rechenweg wird nicht
//   dadurch richtig, dass man ihn repariert — v3.11 hat die FORMEL korrigiert
//   (Summe statt einer Zahl) und ihr weiter falsche DATEN gegeben. Zahlen aus
//   der Engine gehoeren Zeile fuer Zeile abgelesen, nicht aus dem Gedaechtnis.
//
// KAMPF-EXP JE SEKUNDE bei Chance 1,0 (cexp / Zeit) — die wahre Rangfolge:
//   Assassination 4,00 | Mug 3,00 | Heist 3,00 | Homicide 2,67 | Kidnap 2,67
//   Shoplift 2,00 | Traffick Arms 2,00 | GTA 1,75 | Rob Store 1,50
//   Larceny 1,33 | Deal Drugs 1,00 | Bond Forgery 0,50
// Chance 1,0 erreicht Mug schon bei 49 in jedem Kampfstat, Assassination erst
// bei rund 1950. Fuer den ganzen realistischen Bereich gewinnt also MUG.
const SLEEVE_CRIME_STATS = {
    // cexp = str+def+dex+agi-Exp. str/def/dex/agi/cha/hack = Erfolgsgewichte.
    Shoplift:           { difficulty: 0.05,  time: 2e3,   money: 15e3,  cexp: 4,    str: 0,   def: 0,   dex: 1,    agi: 1,   cha: 0, hack: 0 },
    Mug:                { difficulty: 0.2,   time: 4e3,   money: 36e3,  cexp: 12,   str: 1.5, def: 0.5, dex: 1.5,  agi: 0.5, cha: 0, hack: 0 },
    Homicide:           { difficulty: 1,     time: 3e3,   money: 45e3,  cexp: 8,    str: 2,   def: 2,   dex: 0.5,  agi: 0.5, cha: 0, hack: 0 },
    "Deal Drugs":       { difficulty: 1,     time: 10e3,  money: 120e3, cexp: 10,   str: 0,   def: 0,   dex: 2,    agi: 1,   cha: 3, hack: 0 },
    "Traffick Arms":    { difficulty: 2,     time: 40e3,  money: 600e3, cexp: 80,   str: 1,   def: 1,   dex: 1,    agi: 1,   cha: 1, hack: 0 },
    "Rob Store":        { difficulty: 0.2,   time: 60e3,  money: 400e3, cexp: 90,   str: 0,   def: 0,   dex: 2,    agi: 1,   cha: 0, hack: 0.5 },
    Larceny:            { difficulty: 1 / 3, time: 90e3,  money: 800e3, cexp: 120,  str: 0,   def: 0,   dex: 1,    agi: 1,   cha: 0, hack: 0.5 },
    "Grand Theft Auto": { difficulty: 8,     time: 80e3,  money: 1.6e6, cexp: 140,  str: 1,   def: 0,   dex: 4,    agi: 2,   cha: 2, hack: 1 },
    Kidnap:             { difficulty: 5,     time: 120e3, money: 3.6e6, cexp: 320,  str: 1,   def: 0,   dex: 1,    agi: 1,   cha: 1, hack: 0 },
    "Bond Forgery":     { difficulty: 0.5,   time: 300e3, money: 4.5e6, cexp: 150,  str: 0,   def: 0,   dex: 1.25, agi: 0,   cha: 0, hack: 0.05 },
    Assassination:      { difficulty: 8,     time: 300e3, money: 12e6,  cexp: 1200, str: 1,   def: 0,   dex: 2,    agi: 1,   cha: 0, hack: 0 },
    Heist:              { difficulty: 18,    time: 600e3, money: 120e6, cexp: 1800, str: 1,   def: 1,   dex: 1,    agi: 1,   cha: 1, hack: 1 },
};

function sleeveCrimeChance(skills, crime) {
    const cc = SLEEVE_CRIME_STATS[crime];
    if (!cc || !skills) return 0;
    // Crime.successRate (Crime/Crime.ts:120-136): Summe aus Gewicht x Stat,
    // geteilt durch MaxSkillLevel 975 und durch die Schwierigkeit, gedeckelt
    // auf 1. Der Intelligenz-Term und die Aug-Multiplikatoren fehlen hier
    // bewusst — sie heben JEDE Chance an, verschieben die Rangfolge also nicht.
    let chance =
        cc.str * (skills.strength || 0) + cc.def * (skills.defense || 0) +
        cc.dex * (skills.dexterity || 0) + cc.agi * (skills.agility || 0) +
        (cc.cha || 0) * (skills.charisma || 0) + (cc["hack"] || 0) * (skills.hacking || 0);
    chance /= 975;
    chance /= cc.difficulty;
    return Math.min(chance, 1);
}

/**
 * Verbrechen fuer einen Sleeve nach ZWECK (v3.7).
 *
 * Vorher stand hier fest "Homicide, sonst Mug" — die Sleeves folgten also weiter
 * der Karma-Doktrin, auch wenn Karma laengst verbraucht war. Genau das war zu
 * beobachten: Gang gegruendet, alle karma-gated Faktionen beigetreten, und die
 * Sleeves begingen weiter Homicide.
 *
 * Jetzt derselbe Dreiklang wie beim Spieler (doCrime):
 *   karma  -> Homicide, blind (ein Fehlschlag bringt mehr Karma als ein Mug-Erfolg)
 *   combat -> Kampf-Exp je Sekunde maximieren
 *   money  -> erwarteter Geldfluss (money * chance / Zeit)
 *
 * v5.0: EIN FEHLVERSUCH IST NICHT UMSONST. SleeveCrimeWork.process ruft
 *   applySleeveGains(sleeve, gains, success ? 1 : 0.25)
 * (PersonObjects/Sleeve/Work/SleeveCrimeWork.ts:52). Ein gescheitertes
 * Verbrechen zahlt dem Sleeve also 25 % der Exp — beim Spieler nicht, dort
 * faellt der Versuch ganz aus. Der wirksame Faktor ist damit
 *     0,25 + 0,75 x Chance
 * und nicht die Chance selbst. Das aendert die Rangfolge wirklich: ein
 * schwieriges Verbrechen mit 20 % Chance liefert nicht 20 %, sondern 40 %
 * seines Ertrags. Fuer GELD gilt das NICHT — dort setzt die Engine
 * gains.money ausdruecklich auf 0 (SleeveCrimeWork.ts:50), also bleibt es
 * beim reinen Chance-Faktor.
 *
 * @param {object} skills  Sleeve-Skills
 * @param {"karma"|"combat"|"money"} purpose
 */
function pickSleeveCrime(skills, purpose) {
    if (purpose === "karma") return "Homicide";
    const rank = Object.entries(SLEEVE_CRIME_STATS)
        .map(([name, cc]) => {
            const ch = sleeveCrimeChance(skills, name);
            const perSec = Math.max(0.001, cc.time / 1000);
            const val = (purpose === "combat")
                ? (cc.cexp * (0.25 + 0.75 * ch)) / perSec   // Fehlversuch zahlt 25 %
                : (cc.money * ch) / perSec;                 // Geld: 0 bei Fehlschlag
            return { name, val };
        })
        .filter(x => x.val > 0)
        .sort((a, b) => b.val - a.val);
    // Nichts bewertbar (Skills fehlen) -> Mug: kurz, billig, trainiert Kampf.
    return rank.length ? rank[0].name : "Mug";
}

function sleeveGymStat(skills) {
    if (!skills) return null;
    const gaps = [
        ["str", (skills.strength  || 0) - CFG.SLEEVE_TRAIN_STR],
        ["def", (skills.defense   || 0) - CFG.SLEEVE_TRAIN_DEF],
        ["dex", (skills.dexterity || 0) - CFG.SLEEVE_TRAIN_DEX],
        ["agi", (skills.agility   || 0) - CFG.SLEEVE_TRAIN_AGI],
    ].filter(([, gap]) => gap < 0);
    if (gaps.length === 0) return null;
    gaps.sort((a, b) => a[1] - b[1]);
    return gaps[0][0];
}