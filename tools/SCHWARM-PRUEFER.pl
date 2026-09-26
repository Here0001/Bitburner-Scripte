use strict; use warnings; use utf8;
binmode(STDOUT, ":encoding(UTF-8)");

# =============================================================================
# SCHWARM-PRUEFER.pl — v1.1
#
# v1.1 (25.09.2026): Abschnitt 7 RPC-BEFEHLE (io.act gegen RPC_CMDS in INFO);
#   Abschnitt 5b meldete mit einer Stufe, die das Ergebnis nicht zaehlte.
# =============================================================================
#
# Der deterministische Vorpruefer. Sammelt die Fallen, in die dieses Projekt
# schon einmal getreten ist, und beantwortet sie EXAKT — keine Schaetzung,
# keine Vermutung, kein Sprachmodell. Jede Meldung ist entweder ein Fehler
# oder sie erscheint nicht.
#
# AUFRUF
#   perl SCHWARM-PRUEFER.pl <Ordner mit den SCHWARM-*.js>   (im Repo: perl tools/SCHWARM-PRUEFER.pl scripts)
#   perl SCHWARM-PRUEFER.pl <ordner> -kurz     nur die Befunde, keine Tabellen
#
# RUECKGABE
#   0 = nichts gefunden      1 = Befunde vorhanden      2 = Aufruffehler
#   (damit laesst er sich vor einem Push in eine Kette haengen)
#
# WAS ER NICHT PRUEFT, UND WARUM
#   SYNTAX. Dafuer gibt es zwei Instanzen, die exakt sind, weil sie einen
#   echten JavaScript-Parser benutzen:
#     - der Pruefstand (_pNN.html, Punkt 1 "uebersetzt fehlerfrei") —
#       window.onerror faengt den Fehler samt Zeilennummer
#     - SCHWARM-BRUECKE.ps1 -Push: "OK - Engine rechnet 5,85 GB". Den
#       RAM-Bedarf kann die Engine nur ausrechnen, wenn sie die Datei
#       fehlerfrei uebersetzt hat. Die Zahl IST der Parse-Beweis.
#   Eine Klammerzaehlung in Perl waere schlechter als beide: Template-Literale,
#   regulaere Ausdruecke und Zeichenketten muesste sie selbst zerlegen, und ein
#   Fehlalarm auf "Klammer fehlt" kostet mehr Zeit, als er spart.
#
# =============================================================================
# DIE SECHS PRUEFUNGEN
# =============================================================================
#
# 1 DATEI-GESUNDHEIT
#     NUL-Bytes, BOM, gueltiges UTF-8, leere Datei.
#     ANLASS: eine Bearbeitung hat einmal zwei NUL-Bytes in SCHWARM-QUEEN.js
#     geschrieben (aus Leerzeichen wurden NULs). Aufgefallen ist es nur, weil
#     grep "Binary file" meldete. Im Spiel haette das Skript still versagt.
#
# 2 VERSIONEN
#     Kopfzeile gegen const VERSION gegen obersten Aenderungseintrag —
#     auch in den Nutzlasten (SRC_*), die eigene Koepfe tragen.
#     ANLASS: HELPERS stand auf Kopf v4.4 und Konstante "4.3"; der DIAG-Bericht
#     meldete damit eine andere Fassung, als der Kopf behauptete.
#
# 3 NUTZLAST-FALLEN
#     Vier Stueck, alle mindestens einmal live zugeschlagen:
#       a) EINFACHER BACKSLASH — beim Auswerten frisst JavaScript eine Ebene.
#          Aus "\\s" wird "\s", aus "\s" wird "s". Ein Muster mit einfachen
#          Backslashes trifft im Spiel nie. (PHP 5.4, DARKNET v4.6)
#       b) ROHER BACKTICK — beendet das Template-Literal mitten im Payload.
#          Richtig ist der Marker __SCHWARM_BT__.
#       c) ROHES ${ — wird beim Materialisieren interpoliert statt uebernommen.
#          Richtig ist __SCHWARM_DC__.
#       d) SCHWARM_PORTS OHNE MARKE — der Payload benutzt die Porttabelle,
#          traegt aber kein /*__PORTS__*/. injectPorts ist dann wirkungslos und
#          jeder Portzugriff wirft zur Laufzeit.
#
# 4 PORTKARTE
#     Doppelt vergebene Nummern, und jeder im Code benutzte Portname muss in
#     der Tabelle stehen. Beides ist eindeutig — ein Tippfehler bei
#     SCHWARM_PORTS.X wirft zur Laufzeit, und zwar erst dann.
#     BEWUSST NICHT geprueft: Portnummern, die in Kommentaren stehen. Die
#     Tabelle dokumentiert ihre eigene Geschichte ("[war 33]"), eine
#     Pruefung darauf waere reiner Fehlalarm.
#
# 5 REGISTRY
#     Jede Datei aus DAEMONS muss es geben (ausser Nutzlasten, die erst
#     erzeugt werden), jede deps-Angabe muss es geben, und jede vorhandene
#     SCHWARM-Datei sollte in der Registry stehen.
#     ANLASS: SCHWARM-EXPORTCHECk.js (kleines k) lag als Dublette im Spiel.
#
# 6 GRENZFAELLE DER ZEICHENSAETZE
#     Nicht-ASCII ausserhalb von Kommentaren und Zeichenketten. Der Gedankenstrich
#     im Versionskopf ist gewollt; ein unsichtbares geschuetztes Leerzeichen
#     mitten im Code ist es nie.
#
# =============================================================================

my $dir  = shift @ARGV;
my $kurz = grep { $_ eq "-kurz" } @ARGV;

unless (defined $dir && -d $dir) {
    print "Aufruf: perl SCHWARM-PRUEFER.pl <SCHWARM-Ordner> [-kurz]\n";
    exit 2;
}

opendir(my $d, $dir) or do { print "Ordner nicht lesbar: $dir\n"; exit 2; };
my @files = sort grep { /^SCHWARM-.*\.js$/ } readdir($d);
closedir $d;

unless (@files) { print "Keine SCHWARM-*.js in $dir gefunden.\n"; exit 2; }

my $BT = chr(96);          # Backtick, nie roh im Quelltext dieses Skripts
my @befunde;               # { stufe, wo, text }
my %roh;                   # Datei -> Rohbytes
my %txt;                   # Datei -> Text (UTF-8 dekodiert)

sub melde { push @befunde, { stufe => $_[0], wo => $_[1], text => $_[2] }; }
sub kopf  { print "\n", "=" x 78, "\n", $_[0], "\n", "=" x 78, "\n" unless $kurz; }

# -----------------------------------------------------------------------------
# 1 DATEI-GESUNDHEIT
# -----------------------------------------------------------------------------
kopf("1  DATEI-GESUNDHEIT");
printf("%-26s %9s  %s\n", "Datei", "Bytes", "Befund") unless $kurz;

for my $f (@files) {
    open(my $h, '<:raw', "$dir/$f") or do { melde("FEHLER", $f, "nicht lesbar: $!"); next; };
    local $/; my $b = <$h>; close $h;
    $b = "" unless defined $b;
    $roh{$f} = $b;

    my @s;
    my $nul = () = $b =~ /\x00/g;
    push @s, "$nul NUL-Byte(s)" if $nul;
    push @s, "BOM am Dateianfang" if substr($b, 0, 3) eq "\xEF\xBB\xBF";
    push @s, "leer" unless length $b;

    # UTF-8-Gueltigkeit: Dekodieren ohne Ersatzzeichen erzwingen.
    #
    # ACHTUNG, in der ersten Fassung falsch gemacht: Encode::decode mit einem
    # CHECK ungleich FB_DEFAULT LEERT die Quellzeichenkette (es entfernt den
    # umgewandelten Teil). Uebergab man $b direkt, war $b danach leer — die
    # Groessenspalte zeigte fuer jede Datei 0 Bytes. Deshalb eine Kopie.
    my $kopie = $b;
    my $t;
    my $utf8ok = eval { require Encode; $t = Encode::decode("UTF-8", $kopie, Encode::FB_CROAK()); 1; };
    push @s, "kein gueltiges UTF-8" unless $utf8ok;
    $txt{$f} = $utf8ok ? $t : $b;

    melde("FEHLER", $f, $_) for @s;
    printf("%-26s %9d  %s\n", $f, length($b), @s ? join("; ", @s) : "ok") unless $kurz;
}

# -----------------------------------------------------------------------------
# Nutzlast-Bloecke einmal zentral zerlegen (2, 3 und 4 brauchen sie)
# -----------------------------------------------------------------------------
# WICHTIG: Nutzlasten enden auf  `;  ODER auf  }`;  — mit dem frueheren Muster
# ^`; blieb der Zerleger im Payload haengen und meldete die SCHLIESSENDEN
# Backticks der folgenden Nutzlasten als "roher Backtick": fuenf Fehlalarme,
# und die Grenzen aller Auswertungen waren verschoben. Deshalb `;\s*$ .
my %payloads;              # Datei -> [ { name, von, bis, zeilen } ]
for my $f (@files) {
    my @z = split(/\n/, $txt{$f} // "", -1);
    my ($name, $von, @block);
    for my $i (0 .. $#z) {
        my $l = $z[$i];
        if (!defined $name && $l =~ /^const (SRC_\w+)\s*=\s*\Q$BT\E/) {
            $name = $1; $von = $i + 1; @block = (); next;
        }
        if (defined $name && $l =~ /\Q$BT\E;\s*$/) {
            push @{ $payloads{$f} }, { name => $name, von => $von, bis => $i + 1,
                                       zeilen => [@block] };
            $name = undef; next;
        }
        push @block, { n => $i + 1, t => $l } if defined $name;
    }
    melde("FEHLER", "$f / $name", "Nutzlast wird nie geschlossen (ab Zeile $von)")
        if defined $name;
}

# -----------------------------------------------------------------------------
# 2 VERSIONEN
# -----------------------------------------------------------------------------
kopf("2  VERSIONEN");
printf("%-44s %-9s %-11s %-9s %s\n", "Datei / Nutzlast", "Kopf", "Konstante", "Eintrag", "Befund")
    unless $kurz;

sub versionZeile {
    my ($etikett, $dateiname, $zeilen, $mitKonst) = @_;
    my ($k, $e, $c);
    my $max = $#$zeilen < 400 ? $#$zeilen : 400;
    for my $i (0 .. $max) {
        my $l = $zeilen->[$i];
        if (!defined $k && $l =~ /^\s*\*\s*\Q$dateiname\E\s*[\x{2014}\x{2013}-]+\s*v?([\d.]+)/) { $k = $1; next; }
        # Zwei Schreibweisen sind im Umlauf, beide gueltig:
        #     * v4.9 — TEXT        (die meisten Dateien)
        #     * v1.8 (TEXT)        (INFO, CORP)
        # Die erste Fassung kannte nur den Gedankenstrich und uebersprang
        # deshalb den obersten Eintrag von INFO — sie meldete "Kopf 1.8 !=
        # Eintrag 1.7", obwohl der v1.8-Eintrag direkt darunter stand.
        if (!defined $e && defined $k && $l =~ /^\s*\*\s*v([\d.]+)\s*(?:[\x{2014}\x{2013}-]|\()/) { $e = $1; }
    }
    if ($mitKonst) {
        # JEDE Konstante mit VERSION im Namen, nicht nur "const VERSION".
        #
        # ANLASS (11.09.): SCHWARM-DIAG.js fuehrt seine Fassung in
        # `const DIAG_VERSION` und setzt daraus die Kopfzeile des Berichts. Die
        # stand auf "3.4", waehrend der Dateikopf laengst v3.5 sagte — im
        # Bericht also oben "SCHWARM-DIAGNOSE v3.4" und zwei Zeilen darunter
        # "DIAG 3.5". Der Pruefer sah nur `const VERSION`, fand keine, meldete
        # brav "(keine)" und liess den Widerspruch durch.
        #
        # Bitter daran: genau vor dieser Falle warnt SCHWARM-DIAG.js an zwei
        # Stellen im eigenen Kopf. Ein Pruefwerkzeug, das die dokumentierte
        # Hausfalle nicht kennt, prueft am Problem vorbei.
        for my $l (@$zeilen) {
            if ($l =~ /^const\s+\w*VERSION\w*\s*=\s*["']([\d.]+)["']/) { $c = $1; last; }
        }
    }
    my @f;
    push @f, "Kopfzeile fehlt oder Dateiname passt nicht" unless defined $k;
    push @f, "Kopf $k != Konstante $c"          if defined $k && defined $c && $k ne $c;
    push @f, "Kopf $k != oberster Eintrag $e"   if defined $k && defined $e && $k ne $e;
    melde("FEHLER", $etikett, $_) for @f;
    printf("%-44s %-9s %-11s %-9s %s\n", $etikett, $k // "-", $c // "(keine)", $e // "-",
           @f ? join("; ", @f) : "") unless $kurz;
}

for my $f (@files) {
    my @z = split(/\n/, $txt{$f} // "", -1);
    versionZeile($f, $f, \@z, 1);
    for my $p (@{ $payloads{$f} || [] }) {
        my @pz = map { $_->{t} } @{ $p->{zeilen} };
        # Der Kopf der Nutzlast nennt ihren EIGENEN Dateinamen.
        my $pn;
        for my $l (@pz[0 .. ($#pz < 200 ? $#pz : 200)]) {
            if ($l =~ /^\s*\*\s*(SCHWARM-[\w-]+\.js)\s*[\x{2014}\x{2013}-]+\s*v?[\d.]/) { $pn = $1; last; }
        }
        next unless defined $pn;                       # Nutzlast ohne Kopf: erlaubt
        versionZeile("  $f / $p->{name} ($pn)", $pn, \@pz, 0);
    }
}

# -----------------------------------------------------------------------------
# 3 NUTZLAST-FALLEN
# -----------------------------------------------------------------------------
kopf("3  NUTZLAST-FALLEN");
my $fallen = 0;
for my $f (@files) {
    for my $p (@{ $payloads{$f} || [] }) {
        my $wo = "$f / $p->{name}";
        my $ganz = join("\n", map { $_->{t} } @{ $p->{zeilen} });

        # d) Porttabelle benutzt, aber keine Marke gesetzt
        if ($ganz =~ /SCHWARM_PORTS\./ && $ganz !~ m{/\*__PORTS__\*/}) {
            melde("FEHLER", $wo, "benutzt SCHWARM_PORTS, traegt aber kein /*__PORTS__*/ "
                . "-> injectPorts wirkungslos, jeder Portzugriff wirft");
            $fallen++;
        }

        for my $z (@{ $p->{zeilen} }) {
            my ($n, $l) = ($z->{n}, $z->{t});

            # b) roher Backtick
            if (index($l, $BT) >= 0) {
                melde("FEHLER", "$wo Z$n", "roher Backtick -> beendet das Literal "
                    . "(richtig: __SCHWARM_BT__)");
                $fallen++;
            }
            # c) rohes ${
            if ($l =~ /\$\{/) {
                melde("FEHLER", "$wo Z$n", "rohes \${ -> wird interpoliert "
                    . "(richtig: __SCHWARM_DC__)");
                $fallen++;
            }
            # a) ungerade Backslash-Laeufe. \n, \t, \r, \uXXXX in einer
            #    Zeichenkette koennen gewollt sein (echter Zeilenumbruch im
            #    erzeugten Code) -> getrennte, mildere Stufe.
            my @laeufe = ($l =~ /(\\+)/g);
            for my $r (@laeufe) {
                next unless length($r) % 2;
                my $gewollt = ($l =~ /\\[ntru]/) ? 1 : 0;
                my $t = $l; $t =~ s/^\s+|\s+$//g;
                $t = substr($t, 0, 70) . "..." if length($t) > 70;
                if ($gewollt) {
                    melde("HINWEIS", "$wo Z$n", "einfacher Backslash, sieht nach \\n/\\t aus: $t");
                } else {
                    melde("FEHLER", "$wo Z$n", "einfacher Backslash -> verschwindet beim "
                        . "Auswerten: $t");
                    $fallen++;
                }
                last;
            }
        }
    }
}
my $anzP = 0; $anzP += scalar @{ $payloads{$_} || [] } for @files;
print "$anzP Nutzlast(en) geprueft, $fallen Falle(n).\n" unless $kurz;

# -----------------------------------------------------------------------------
# 4 PORTKARTE
# -----------------------------------------------------------------------------
kopf("4  PORTKARTE");
my (%portNr, %nrName);
my $quelle;
for my $f (@files) {
    my $t = $txt{$f} // "";
    next unless $t =~ /export const SCHWARM_PORTS\s*=\s*\{(.*?)\n\};/s;
    $quelle = $f;
    my $block = $1;
    while ($block =~ /^\s*([A-Z][A-Z0-9_]*)\s*:\s*(\d+)\s*,/gm) {
        my ($name, $nr) = ($1, $2);
        if (exists $portNr{$name}) { melde("FEHLER", $f, "Portname $name doppelt vergeben"); }
        $portNr{$name} = $nr;
        push @{ $nrName{$nr} }, $name;
    }
    last;
}
if (!$quelle) {
    melde("FEHLER", "-", "SCHWARM_PORTS nicht gefunden - Portpruefung entfaellt");
} else {
    for my $nr (sort { $a <=> $b } keys %nrName) {
        my @n = @{ $nrName{$nr} };
        melde("FEHLER", $quelle, "Port $nr doppelt belegt: " . join(", ", @n)) if @n > 1;
    }
    printf("Tabelle in %s: %d Namen auf %d Nummern (%d bis %d).\n",
           $quelle, scalar(keys %portNr), scalar(keys %nrName),
           (sort { $a <=> $b } keys %nrName)[0], (sort { $b <=> $a } keys %nrName)[0])
        unless $kurz;

    # Jeder benutzte Name muss in der Tabelle stehen.
    my %unbekannt;
    for my $f (@files) {
        my @z = split(/\n/, $txt{$f} // "", -1);
        for my $i (0 .. $#z) {
            # KOMMENTARZEILEN AUSLASSEN. Die erste Fassung tat das nicht und
            # meldete HELPERS Z1189 — dort steht im Fliesstext, der die
            # /*__PORTS__*/-Marke erklaert, das Beispiel "SCHWARM_PORTS.XYZ".
            # Ein Prueferwerkzeug, das seine eigene Dokumentation anmeckert,
            # ist wertlos: man gewoehnt sich an rote Zeilen und uebersieht die
            # echten. Zeilenkommentare und Block-Fliesstext (" * ") raus.
            next if $z[$i] =~ m{^\s*(?://|\*|/\*)};
            while ($z[$i] =~ /SCHWARM_PORTS\.([A-Za-z_][A-Za-z0-9_]*)/g) {
                my $n = $1;
                next if exists $portNr{$n};
                $unbekannt{"$f Z" . ($i + 1)} = $n;
            }
        }
    }
    for my $wo (sort keys %unbekannt) {
        melde("FEHLER", $wo, "SCHWARM_PORTS.$unbekannt{$wo} steht nicht in der Tabelle "
            . "-> wirft zur Laufzeit");
    }
    print "Alle benutzten Portnamen sind in der Tabelle.\n"
        if !$kurz && !%unbekannt;
}

# -----------------------------------------------------------------------------
# 5 REGISTRY
# -----------------------------------------------------------------------------
kopf("5  REGISTRY");
my (%regFile, %regPayload, %regDeps);
my $regQuelle;
for my $f (@files) {
    my $t = $txt{$f} // "";
    next unless $t =~ /export const DAEMONS\s*=\s*\{/;
    $regQuelle = $f;
    while ($t =~ /^\s*([A-Z][A-Z0-9_]*)\s*:\s*\{([^\n]*)\}/gm) {
        my ($key, $rest) = ($1, $2);
        next unless $rest =~ /file:\s*"([^"]+)"/;
        my $datei = $1;
        $regFile{$key} = $datei;
        $regPayload{$key} = 1 if $rest =~ /payload:\s*"/;
        my @deps;
        if ($rest =~ /deps:\s*\[([^\]]*)\]/) { @deps = ($1 =~ /"([^"]+)"/g); }
        $regDeps{$key} = \@deps;
    }
    last;
}
if (!$regQuelle) {
    melde("FEHLER", "-", "DAEMONS nicht gefunden - Registrypruefung entfaellt");
} else {
    my %vorhanden = map { $_ => 1 } @files;
    my %inRegistry;
    for my $key (sort keys %regFile) {
        my $datei = $regFile{$key};
        $inRegistry{$datei} = 1;
        if (!$vorhanden{$datei} && !$regPayload{$key}) {
            melde("FEHLER", $regQuelle, "$key verweist auf $datei - Datei fehlt "
                . "und es ist keine Nutzlast");
        }
        for my $dep (@{ $regDeps{$key} }) {
            $inRegistry{$dep} = 1;
            melde("FEHLER", $regQuelle, "$key haengt von $dep ab - Datei fehlt")
                unless $vorhanden{$dep};
        }
    }
    printf("%d Registry-Eintraege, davon %d Nutzlasten.\n",
           scalar(keys %regFile), scalar(keys %regPayload)) unless $kurz;

    # Dateien auf der Platte, die in keinem Registry-Eintrag stehen.
    #
    # Das allein ist KEIN Befund: ARSENAL, CLEAN, EXPORTCHECK und GENESIS sind
    # Handwerkzeuge, die man von Hand startet, nicht von der Queen gefuehrte
    # Daemonen. Die erste Fassung meldete sie und war damit sofort
    # unbrauchbar — vier Zeilen Rauschen bei jedem Lauf.
    #
    # Verdaechtig ist erst, wenn eine Datei ausserdem von KEINER anderen
    # SCHWARM-Datei erwaehnt wird. Genau so sah die Dublette
    # SCHWARM-EXPORTCHECk.js (kleines k) aus: im Ordner, aber nirgends genannt.
    my @werkzeug;
    for my $f (@files) {
        next if $inRegistry{$f};
        my $genannt = 0;
        for my $g (@files) {
            next if $g eq $f;
            if (index($txt{$g} // "", $f) >= 0) { $genannt = 1; last; }
        }
        if ($genannt) { push @werkzeug, $f; }
        else {
            melde("HINWEIS", $f, "steht in keinem Registry-Eintrag UND wird von keiner "
                . "anderen SCHWARM-Datei erwaehnt - Dublette oder Altlast?");
        }
    }
    print "Handwerkzeuge (nicht in der Registry, aber referenziert): "
        . join(", ", @werkzeug) . "\n" if !$kurz && @werkzeug;
}

# -----------------------------------------------------------------------------
# 5b GETEILTE SCHWELLEN
# -----------------------------------------------------------------------------
# Zwei Dateien, dieselbe Frage, zwei Zahlen — das ist die Fehlerklasse, die in
# diesem Projekt am oeftesten zugeschlagen hat. Am 14.09.2026 stand DIAGs
# BLACKOP_MIN_CHANCE auf 0.80, waehrend der BLADEBURNER-Payload
# CFG.SUCCESS_MIN = 0.95 verlangt. DIAG meldete daraufhin bei 93,3 % einen
# Befund, obwohl der Daemon voellig korrekt wartete. Solche Paare kann man
# nicht durch Disziplin zusammenhalten, nur durch Vergleichen.
# -----------------------------------------------------------------------------
kopf("5b GETEILTE SCHWELLEN");
{
    my $diagT = $txt{"SCHWARM-DIAG.js"} // "";
    my $payT  = $txt{"SCHWARM-PAYLOADS.js"} // "";
    my ($a) = $diagT =~ /const\s+BLACKOP_MIN_CHANCE\s*=\s*([0-9.]+)/;
    my ($b) = $payT  =~ /SUCCESS_MIN:\s*([0-9.]+)/;
    if (defined $a && defined $b) {
        if ($a + 0 != $b + 0) {
            melde("FEHLER", "SCHWARM-DIAG.js",   # v1.1: "BEFUND" wurde nie gezaehlt
                "BLACKOP_MIN_CHANCE $a != SUCCESS_MIN $b in SCHWARM-PAYLOADS.js "
                . "- DIAG beurteilt BlackOps nach einer anderen Schwelle als der Daemon");
        } else {
            print "BlackOp-Schwelle: DIAG $a == Payload $b
" unless $kurz;
        }
    } else {
        print "BlackOp-Schwelle: nicht beide Werte gefunden - uebersprungen
" unless $kurz;
    }
}

# -----------------------------------------------------------------------------
# 6 UNSICHTBARE ZEICHEN
# -----------------------------------------------------------------------------
kopf("6  UNSICHTBARE ZEICHEN");
# Geschuetztes Leerzeichen (U+00A0), Null-Breite-Zeichen und Steuerzeichen
# ausser Tab/CR/LF. Die sehen im Editor aus wie nichts und brechen Code.
my $unsichtbar = 0;
for my $f (@files) {
    my @z = split(/\n/, $txt{$f} // "", -1);
    for my $i (0 .. $#z) {
        my $l = $z[$i];
        my @treffer;
        push @treffer, "geschuetztes Leerzeichen U+00A0" if $l =~ /\x{00A0}/;
        push @treffer, "Null-Breite-Zeichen U+200B/200C/200D/FEFF" if $l =~ /[\x{200B}\x{200C}\x{200D}\x{FEFF}]/;
        push @treffer, "Steuerzeichen" if $l =~ /[\x{0000}-\x{0008}\x{000B}\x{000C}\x{000E}-\x{001F}]/;
        for my $t (@treffer) { melde("FEHLER", "$f Z" . ($i + 1), $t); $unsichtbar++; }
    }
}
print $unsichtbar ? "$unsichtbar Fund(e).\n" : "Keine.\n" unless $kurz;

# -----------------------------------------------------------------------------
# 7 RPC-BEFEHLE (v1.1, 25.09.2026)
# -----------------------------------------------------------------------------
# io.act("X", ...) geht im INFO-Modus als RPC an SCHWARM-INFO. Kennt INFO den
# Befehl nicht (RPC_CMDS), kommt "unbekannt" zurueck, act() liefert null - und
# der Aufruf scheitert LAUTLOS. So fehlte upgradeHomeCores (home bekam nie einen
# Kern), und BANK fragte "buyBackShares" statt "corpBuyback" an (der
# Aktienrueckkauf aus dem Ziel lief nie). Geprueft werden nur woertliche Namen;
# io.act(variable, ...) laesst sich statisch nicht aufloesen.
kopf("7  RPC-BEFEHLE");
my %rpc;
if (defined $txt{"SCHWARM-INFO.js"} && $txt{"SCHWARM-INFO.js"} =~ /const RPC_CMDS = \{(.*?)\n\};/s) {
    my $blk = $1;
    while ($blk =~ /^\s{4}([A-Za-z]+)\s*:/mg) { $rpc{$1} = 1; }
}
if (!%rpc) {
    melde("FEHLER", "SCHWARM-INFO.js", "RPC_CMDS nicht gefunden - RPC-Pruefung entfaellt");
} else {
    my $aufrufe = 0;
    for my $f (@files) {
        my $t = $txt{$f} // "";
        while ($t =~ /io\.act\(\s*"([A-Za-z]+)"/g) {
            my $cmd = $1;
            $aufrufe++;
            next if $rpc{$cmd};
            my $vor = substr($t, 0, pos($t));
            my $zeile = 1 + ($vor =~ tr/\n//);
            melde("FEHLER", "$f Z$zeile", "io.act(\"$cmd\") - INFO kennt den Befehl nicht (RPC_CMDS), der Aufruf scheitert still");
        }
    }
    printf("%d RPC-Befehle in INFO, %d io.act-Aufrufe geprueft.\n", scalar keys %rpc, $aufrufe) unless $kurz;
}

# -----------------------------------------------------------------------------
# ERGEBNIS
# -----------------------------------------------------------------------------
my @fehler  = grep { $_->{stufe} eq "FEHLER"  } @befunde;
my @hinweis = grep { $_->{stufe} eq "HINWEIS" } @befunde;

print "\n", "=" x 78, "\n";
if (@fehler) {
    printf("BEFUNDE (%d)\n", scalar @fehler);
    print "=" x 78, "\n";
    my $i = 0;
    for my $b (@fehler) { printf("%3d. %-34s %s\n", ++$i, $b->{wo}, $b->{text}); }
} else {
    print "KEINE BEFUNDE.\n";
    print "=" x 78, "\n";
}

if (@hinweis) {
    printf("\nHINWEISE (%d) - kein Fehler, nur anschauen:\n", scalar @hinweis);
    my $i = 0;
    for my $b (@hinweis) { printf("%3d. %-34s %s\n", ++$i, $b->{wo}, $b->{text}); }
}

printf("\n%d Datei(en), %d Nutzlast(en) geprueft.\n", scalar @files, $anzP);
print "Syntax ist NICHT dabei - dafuer der Pruefstand (_pNN.html, Punkt 1)\n"
    . "und SCHWARM-BRUECKE.ps1 -Push (\"Engine rechnet ... GB\").\n";

exit(@fehler ? 1 : 0);
