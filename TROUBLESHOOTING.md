# Troubleshooting - Applicatie niet in browser

## Mogelijke problemen en oplossingen

### 1. Server draait niet
**Probleem:** De development server is niet gestart.

**Oplossing:**
```bash
npm run dev
```

Je zou moeten zien:
```
▲ Next.js 16.0.10
- Local:        http://localhost:3000
```

### 2. Poort 3000 is al in gebruik
**Probleem:** Er draait al een andere applicatie op poort 3000.

**Oplossing A - Stop het andere proces:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID [PROCESS_ID]

# Of gebruik een andere poort:
npm run dev -- -p 3001
```

**Oplossing B - Gebruik een andere poort:**
```bash
npm run dev -- -p 3001
```
Dan open: `http://localhost:3001`

### 3. Environment variables ontbreken
**Probleem:** `.env.local` bestand ontbreekt of is niet correct ingesteld.

**Oplossing:**
1. Maak een `.env.local` bestand in de root directory
2. Voeg toe:
```
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
```

### 4. Browser kan niet verbinden
**Probleem:** Browser geeft "Kan niet verbinden" of "This site can't be reached"

**Oplossingen:**
- Controleer of de server draait (zie terminal output)
- Probeer `http://127.0.0.1:3000` in plaats van `http://localhost:3000`
- Controleer firewall instellingen
- Probeer een andere browser
- Clear browser cache (Ctrl+Shift+Delete)

### 5. Build errors
**Probleem:** Er zijn TypeScript of build errors.

**Oplossing:**
```bash
npm run lint
```

Kijk naar errors in de terminal en fix ze.

### 6. Dependencies niet geïnstalleerd
**Probleem:** `node_modules` ontbreekt.

**Oplossing:**
```bash
npm install
```

### 7. Cache problemen
**Probleem:** Oude cache veroorzaakt problemen.

**Oplossing:**
```bash
# Verwijder .next folder
rm -rf .next
# Of op Windows:
rmdir /s /q .next

# Herstart server
npm run dev
```

## Stap-voor-stap debug proces

1. **Check of server draait:**
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Check terminal output:**
   - Kijk naar errors in de terminal waar `npm run dev` draait
   - Zoek naar rode error messages

3. **Check browser console:**
   - Open Developer Tools (F12)
   - Kijk naar errors in de Console tab
   - Kijk naar errors in de Network tab

4. **Test directe verbinding:**
   - Probeer `http://127.0.0.1:3000`
   - Probeer `http://localhost:3000`

5. **Check logs:**
   - Kijk naar de terminal output voor specifieke error messages
   - Deel de error message voor hulp

## Veel voorkomende errors

### "Port 3000 is already in use"
```bash
# Stop het proces
taskkill /F /PID [PROCESS_ID]
# Of gebruik andere poort
npm run dev -- -p 3001
```

### "Cannot find module"
```bash
npm install
```

### "Environment variables not found"
- Controleer `.env.local` bestand
- Zorg dat variabelen beginnen met `NEXT_PUBLIC_`

### "Hydration error"
- Dit is meestal een warning, niet een blocker
- Check browser console voor details

## Hulp nodig?

Als niets werkt, deel dan:
1. De volledige error message uit de terminal
2. De error uit de browser console (F12)
3. Welke URL je probeert te openen
4. Welke browser je gebruikt
