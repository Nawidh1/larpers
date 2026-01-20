# Performance Optimalisaties voor Zwakke Verbindingen

## Overzicht
Deze applicatie is geoptimaliseerd voor gebruik in afgelegen gebieden met zwakke internetverbindingen, zoals Belize. Alle optimalisaties zijn gericht op snelle laadtijden en offline functionaliteit.

## Geïmplementeerde Optimalisaties

### 1. Image Optimization
- **WebP en AVIF formaten**: Automatische conversie naar moderne, gecomprimeerde beeldformaten
- **Responsive images**: Verschillende beeldgroottes voor verschillende schermen
- **Lazy loading**: Afbeeldingen worden alleen geladen wanneer ze zichtbaar zijn
- **Cache TTL**: 7 dagen caching voor afbeeldingen

### 2. Service Worker & Offline Support
- **Cache First strategie**: Statische assets worden eerst uit cache geladen
- **Network First voor API**: API calls proberen eerst netwerk, daarna cache
- **Offline fallback**: Basis offline pagina wanneer geen verbinding beschikbaar is
- **Automatische updates**: Service worker controleert periodiek op updates

### 3. Code Splitting & Lazy Loading
- **Dynamic imports**: Zware componenten (charts, maps) worden alleen geladen wanneer nodig
- **Chart components**: Alle chart componenten zijn lazy-loaded
- **Map component**: Leaflet map wordt alleen geladen op de map pagina
- **SSR disabled**: Client-side only rendering voor zware componenten

### 4. Network-Aware Loading
- **Connection detection**: Detecteert trage verbindingen (2G, slow-2G)
- **Data saver mode**: Respecteert browser data saver instellingen
- **Adaptive loading**: Past laadgedrag aan op basis van netwerksnelheid
- **Conservative fallback**: Bij onbekende verbinding wordt uitgegaan van trage verbinding

### 5. Font Optimization
- **Display swap**: Toont fallback font direct, wisselt wanneer geladen
- **Subset loading**: Alleen Latijnse karakters geladen
- **Preload**: Kritieke fonts worden vooraf geladen
- **Fallback fonts**: System fonts als snelle fallback

### 6. Resource Hints
- **DNS prefetch**: Voorbereiden van DNS lookups
- **Preconnect**: Vroege verbinding met externe servers
- **Preload**: Kritieke assets vooraf laden

### 7. Bundle Optimization
- **Tree shaking**: Ongebruikte code wordt verwijderd
- **Package imports**: Alleen gebruikte delen van packages worden geïmporteerd
- **Compression**: Gzip/Brotli compressie voor alle assets
- **Minification**: JavaScript en CSS worden geminificeerd

## Technische Details

### Service Worker Caching Strategieën

1. **Static Assets (Cache First)**
   - HTML, CSS, JavaScript
   - Icons en images
   - Manifest files
   - Cache blijft 7+ dagen

2. **API Calls (Network First)**
   - Supabase API calls
   - Dynamische data
   - Cache blijft korter (voor verse data)

3. **Images (Cache First)**
   - Aparte image cache
   - Lange cache TTL
   - Offline beschikbaar

### Network Detection Criteria

Een verbinding wordt als "langzaam" beschouwd wanneer:
- `effectiveType` is "2g" of "slow-2g"
- `downlink` is minder dan 1.5 Mbps
- `rtt` (round-trip time) is groter dan 500ms
- Data saver mode is ingeschakeld

### Lazy Loaded Components

- `CropGrowthChart` - Alleen op dashboard
- `IncomeChart` - Alleen op dashboard  
- `TemperatureChart` - Alleen op climate pagina
- `RainfallChart` - Alleen op climate pagina
- `ClimateTimelineChart` - Alleen op climate pagina
- `FieldsMap` - Alleen op map pagina

## Gebruik

### Network Context
```tsx
import { useNetwork } from "@/components/network-aware"

function MyComponent() {
  const { isSlowConnection, effectiveType, saveData } = useNetwork()
  
  if (isSlowConnection) {
    // Toon vereenvoudigde versie
  }
}
```

### Lazy Load Wrapper
```tsx
import { LazyLoadWrapper } from "@/components/lazy-load-wrapper"

<LazyLoadWrapper fallback={<LoadingSpinner />}>
  <HeavyComponent />
</LazyLoadWrapper>
```

## Performance Metrics

### Doelstellingen voor Trage Verbindingen (2G)
- **First Contentful Paint**: < 3 seconden
- **Time to Interactive**: < 10 seconden
- **Total Bundle Size**: < 500KB (gecomprimeerd)
- **Offline Functionaliteit**: Basis functionaliteit beschikbaar

### Monitoring
- Service Worker registratie wordt gelogd in console
- Network status wordt gedetecteerd en gelogd
- Cache hits/misses kunnen worden gemonitord via DevTools

## Best Practices voor Verdere Optimalisatie

1. **Beperk externe dependencies**: Gebruik alleen wat nodig is
2. **Comprimeer assets**: Zorg dat alle assets gecomprimeerd zijn
3. **Cache agressief**: Cache zoveel mogelijk statische content
4. **Lazy load alles**: Laad alleen wat zichtbaar is
5. **Monitor bundle size**: Houd JavaScript bundle onder 500KB
6. **Test op trage verbindingen**: Gebruik Chrome DevTools throttling

## Troubleshooting

### Service Worker werkt niet
- Controleer of HTTPS gebruikt wordt (vereist voor service workers)
- Controleer browser console voor errors
- Verwijder oude service workers via DevTools > Application > Service Workers

### Images laden langzaam
- Controleer of WebP/AVIF formaten worden gebruikt
- Verifieer image optimization in next.config.mjs
- Controleer cache headers

### Charts laden niet
- Controleer network tab voor failed requests
- Verifieer dat dynamic imports correct zijn
- Controleer console voor JavaScript errors

## Toekomstige Verbeteringen

- [ ] Implementeer Progressive Web App (PWA) installatie prompt
- [ ] Voeg background sync toe voor offline data synchronisatie
- [ ] Implementeer IndexedDB voor lokale data opslag
- [ ] Voeg compressie toe voor API responses
- [ ] Implementeer request queuing voor trage verbindingen
- [ ] Voeg offline indicator toe in UI
