# Boinkytag - Multiplayer Game

Et lokalt multiplayer spill av catch, inspirert av spillet på Poki.

## Funksjoner

- **1-4 spillere**: Spill med 2, 3 eller 4 spillere lokalt på samme datamaskin
- **3 verdener**: Tre unike baner med forskjellige layouts og utfordringer
- **Bounce pads**: Grønne hoppeputer som sender deg høyt opp i luften
- **Teleporter**: Lilla teleporter som kan brukes én gang for å teleportere deg til en annen del av banen
- **Boinkytagging**: Gå inn i en annen spiller for å boinke dem og bli "it"

## Kontroller

- **Spiller 1**: `W` (hopp), `A` (venstre), `D` (høyre)
- **Spiller 2**: `↑` (hopp), `←` (venstre), `→` (høyre)
- **Spiller 3**: `I` (hopp), `J` (venstre), `L` (høyre)
- **Spiller 4**: `T` (hopp), `F` (venstre), `H` (høyre)

## Hvordan starte webserveren

### Metode 1: Dev server med hot reloading (anbefalt for utvikling)
Hvis du har Node.js installert, kan du bruke dev serveren med automatisk oppdatering:
```bash
# Installer avhengigheter (kun første gang)
npm install

# Start dev serveren med hot reloading
npm run dev
```

Serveren starter automatisk og nettleseren åpnes. Når du gjør endringer i koden, lastes siden automatisk på nytt!

### Metode 2: Python
Hvis du har Python installert:
```bash
# Python 3
python -m http.server 8000

# Eller hvis python3 ikke fungerer:
python3 -m http.server 8000
```

Deretter åpne nettleseren og gå til: `http://localhost:8000`

**Merk:** Med Python-serveren må du manuelt oppdatere nettleseren (F5) for å se endringer.

### Metode 3: Direkte i nettleseren
Du kan også dobbeltklikke på `index.html` for å åpne det direkte i nettleseren.

**Merk:** Du må manuelt oppdatere nettleseren (F5) for å se endringer.

## Hvordan spille

1. Start webserveren (se over) eller åpne `index.html` direkte
2. Velg antall spillere (2-4)
3. Velg en verden (1, 2 eller 3)
4. Klikk "Start Spill"
5. Den hvite pilen viser hvem som er "it"
6. Unngå å bli boinket, eller boink andre for å bli "it" selv!

## Teknisk

Spillet er bygget med HTML5 Canvas og vanilla JavaScript. Ingen eksterne avhengigheter kreves.

## Verden 1
Enkel platform layout med noen hoppeputer og teleportere.

## Verden 2
Mer kompleks bane med flere vertikale platformer og flere hoppeputer.

## Verden 3
Den mest komplekse banen med flere nivåer og flere teleportere.

