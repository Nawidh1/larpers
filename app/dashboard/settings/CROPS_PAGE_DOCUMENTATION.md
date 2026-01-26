# Crops Page Documentatie

## Overzicht
Dit document legt uit hoe de `app/dashboard/crops/page.tsx` file werkt, regel voor regel.

## Bestand: `app/dashboard/crops/page.tsx`

### Wat doet deze pagina?
Deze pagina toont een overzicht van alle gewassen (crops) in het dashboard. Het is een simpele pagina met een header en een tabel met gewassen.

---

## Regel-voor-regel uitleg

### Regel 1: `import { Header } from "@/components/dashboard/header"`
**Wat het doet:** Haalt de "Header" component op uit de map met onderdelen.  
**In kindertaal:** "Geef me de bovenbalk die ik kan gebruiken."

### Regel 2: `import { CropTable } from "@/components/dashboard/crop-table"`
**Wat het doet:** Haalt de "CropTable" component op die de tabel met gewassen toont.  
**In kindertaal:** "Geef me de tabel waar alle gewassen in staan."

### Regel 3: `import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"`
**Wat het doet:** Haalt alle Card-onderdelen op (doosje met titel en tekst).  
**In kindertaal:** "Geef me alle onderdelen om een mooi doosje te maken."

### Regel 4: `import { Sprout } from "lucide-react"`
**Wat het doet:** Haalt het plantje-icoon op uit de icoon-bibliotheek.  
**In kindertaal:** "Geef me een plantje-icoon."

### Regel 5: (lege regel)
**Wat het doet:** Niets, gewoon een lege regel voor leesbaarheid.

### Regel 6: `export default function CropsPage() {`
**Wat het doet:** Maakt een nieuwe pagina component met de naam "CropsPage".  
**In kindertaal:** "Dit is het begin van de gewassen-pagina."

### Regel 7: `return (`
**Wat het doet:** Begint met het teruggeven (tonen) van de pagina-inhoud.  
**In kindertaal:** "Nu ga ik vertellen wat er op de pagina moet komen."

### Regel 8: `<div className="flex flex-col h-full" suppressHydrationWarning>`
**Wat het doet:** Maakt een grote container die de hele hoogte vult en alles verticaal stapelt.  
**In kindertaal:** "Maak een grote doos die de hele pagina vult."

### Regel 9: `<Header title="Crop Monitoring" />`
**Wat het doet:** Plaatst de header bovenaan met de tekst "Crop Monitoring".  
**In kindertaal:** "Zet de bovenbalk bovenaan met de tekst 'Crop Monitoring'."

### Regel 10: (lege regel)
**Wat het doet:** Niets, gewoon een lege regel voor leesbaarheid.

### Regel 11: `<div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto" suppressHydrationWarning>`
**Wat het doet:** Maakt een container die de rest van de ruimte vult, met padding en ruimte tussen elementen, en kan scrollen als nodig.  
**In kindertaal:** "Maak een doos die de rest van de ruimte vult, met ruimte eromheen, en die kan scrollen."

### Regel 12: `<Card>`
**Wat het doet:** Opent een Card component (een mooi doosje).  
**In kindertaal:** "Begin met een mooi doosje."

### Regel 13: `<CardHeader>`
**Wat het doet:** Opent het kopje van de card.  
**In kindertaal:** "Dit is het kopje van het doosje."

### Regel 14: `<CardTitle className="text-lg font-semibold flex items-center gap-2">`
**Wat het doet:** Maakt de titel van de card, groot en dikgedrukt, met items naast elkaar.  
**In kindertaal:** "Maak een grote, dikke titel waar dingen naast elkaar kunnen staan."

### Regel 15: `<Sprout className="h-5 w-5 text-agri-green" />`
**Wat het doet:** Plaatst een klein plantje-icoon, groen gekleurd.  
**In kindertaal:** "Zet een klein groen plantje-icoon neer."

### Regel 16: `Alle Gewassen`
**Wat het doet:** Toont de tekst "Alle Gewassen".  
**In kindertaal:** "Schrijf 'Alle Gewassen'."

### Regel 17: `</CardTitle>`
**Wat het doet:** Sluit de titel tag.  
**In kindertaal:** "Klaar met de titel."

### Regel 18: `<CardDescription>`
**Wat het doet:** Opent een beschrijvingstekst onder de titel.  
**In kindertaal:** "Begin met een beschrijvingstekst."

### Regel 19: `Beheer en monitor al je gewassen en percelen`
**Wat het doet:** Toont de beschrijvingstekst.  
**In kindertaal:** "Schrijf 'Beheer en monitor al je gewassen en percelen'."

### Regel 20: `</CardDescription>`
**Wat het doet:** Sluit de beschrijving tag.  
**In kindertaal:** "Klaar met de beschrijving."

### Regel 21: `</CardHeader>`
**Wat het doet:** Sluit het kopje van de card.  
**In kindertaal:** "Klaar met het kopje van het doosje."

### Regel 22: `<CardContent>`
**Wat het doet:** Opent de inhoud van de card.  
**In kindertaal:** "Dit is waar de echte inhoud komt."

### Regel 23: `<CropTable />`
**Wat het doet:** Plaatst de CropTable component die alle gewassen toont.  
**In kindertaal:** "Zet de tabel met alle gewassen hierin."

### Regel 24: `</CardContent>`
**Wat het doet:** Sluit de inhoud van de card.  
**In kindertaal:** "Klaar met de inhoud."

### Regel 25: `</Card>`
**Wat het doet:** Sluit de card component.  
**In kindertaal:** "Klaar met het doosje."

### Regel 26: `</div>`
**Wat het doet:** Sluit de container div.  
**In kindertaal:** "Klaar met de doos met ruimte eromheen."

### Regel 27: `</div>`
**Wat het doet:** Sluit de grote container div.  
**In kindertaal:** "Klaar met de grote doos."

### Regel 28: `)`
**Wat het doet:** Sluit de return statement.  
**In kindertaal:** "Klaar met vertellen wat er op de pagina moet komen."

### Regel 29: `}`
**Wat het doet:** Sluit de functie.  
**In kindertaal:** "Klaar met de pagina."

### Regel 30: (lege regel)
**Wat het doet:** Niets, gewoon een lege regel aan het einde van het bestand.

---

## Structuur Overzicht

```
CropsPage
├── Header (bovenbalk met titel)
└── Content Area (scrollbaar)
    └── Card (doosje)
        ├── CardHeader (kopje)
        │   ├── CardTitle (titel met icoon)
        │   └── CardDescription (beschrijving)
        └── CardContent (inhoud)
            └── CropTable (tabel met gewassen)
```

## Belangrijke Componenten

### Header Component
- Toont de titel "Crop Monitoring" bovenaan de pagina
- Bevat ook gebruikersmenu en notificaties

### CropTable Component
- Haalt alle gewassen op uit de database
- Toont ze in een tabel met kolommen: Naam, Locatie, Status, Acties
- Heeft knoppen om gewassen toe te voegen, te bewerken, te verwijderen, of te monitoren

### Card Componenten
- `Card`: De container (doosje)
- `CardHeader`: Het kopje met titel en beschrijving
- `CardTitle`: De titel tekst
- `CardDescription`: De beschrijving tekst
- `CardContent`: De inhoud waar de tabel in staat

## CSS Classes Uitleg

- `flex flex-col`: Zet alles verticaal onder elkaar
- `h-full`: Neemt de hele hoogte in beslag
- `flex-1`: Neemt de resterende ruimte in beslag
- `p-4 md:p-6`: Padding (ruimte rondom) - klein op mobiel, groter op desktop
- `space-y-4 md:space-y-6`: Ruimte tussen elementen verticaal
- `overflow-auto`: Kan scrollen als de inhoud te groot is
- `suppressHydrationWarning`: Voorkomt waarschuwingen over server/client verschillen

## Tips

1. **suppressHydrationWarning**: Dit wordt gebruikt omdat Next.js soms verschillen ziet tussen wat de server rendert en wat de client verwacht. Dit voorkomt onnodige waarschuwingen.

2. **Responsive Design**: De `md:` prefix betekent dat die styling alleen op medium schermen en groter wordt toegepast (tablets en desktops).

3. **Component Structuur**: De pagina gebruikt veel kleine componenten die samen een groter geheel vormen. Dit maakt de code makkelijker te onderhouden en te hergebruiken.
