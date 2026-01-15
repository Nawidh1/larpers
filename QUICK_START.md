# Quick Start Guide - Agritech Dashboard

## Stap 1: Installeer dependencies
```bash
npm install
```

## Stap 2: Configureer Supabase

### Optie A: Met Supabase (Aanbevolen)
1. Maak een account op [supabase.com](https://supabase.com)
2. Maak een nieuw project
3. Ga naar Project Settings > API
4. Kopieer je **Project URL** en **anon public key**
5. Maak een `.env.local` bestand in de root directory:
```
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key-hier
```
6. Ga naar SQL Editor in Supabase
7. Kopieer en run het complete SQL script: `scripts/complete-setup.sql`

### Optie B: Demo Mode (Zonder Supabase)
- Je kunt de applicatie gebruiken zonder Supabase configuratie
- Klik op "Continue with Demo Mode" op de login pagina
- Data wordt niet opgeslagen (alleen lokaal)

## Stap 3: Start de applicatie
```bash
npm run dev
```

## Stap 4: Open in browser
Ga naar: `http://localhost:3000`

## Stap 5: Maak een account
1. Klik op "Don't have an account? Sign Up"
2. Vul je email en wachtwoord in (minimaal 6 tekens)
3. Klik op "Sign Up"
4. Als email confirmation is uitgeschakeld in Supabase, word je automatisch ingelogd
5. Als email confirmation aan staat, check je email voor de bevestigingslink

## Problemen oplossen

### "Invalid login credentials"
- **Oplossing:** Maak eerst een account aan via "Sign Up"
- Of gebruik "Demo Mode" om de applicatie te testen zonder account

### "Supabase not configured"
- **Oplossing:** Maak een `.env.local` bestand met je Supabase credentials
- Of gebruik "Demo Mode"

### Server start niet
- **Oplossing:** 
  ```bash
  # Stop alle Node processen
  taskkill /F /IM node.exe
  
  # Verwijder .next folder
  rmdir /s /q .next
  
  # Start opnieuw
  npm run dev
  ```

### Poort 3000 is bezet
- **Oplossing:** 
  ```bash
  npm run dev -- -p 3001
  ```
  Dan open: `http://localhost:3001`

## Eerste keer gebruik

Na het aanmaken van een account:
1. Je wordt automatisch doorgestuurd naar het dashboard
2. Het dashboard is leeg (geen data)
3. Ga naar **Settings** > **Test Data Beheer**
4. Klik op **"Voeg Sample Data Toe"** om de applicatie te vullen met voorbeelddata
5. Nu kun je alle features testen!

## Belangrijke URLs

- **Login:** `http://localhost:3000/login`
- **Dashboard:** `http://localhost:3000/dashboard`
- **Settings:** `http://localhost:3000/dashboard/settings`

## Support

Als je problemen hebt:
1. Check de terminal output voor errors
2. Check de browser console (F12) voor errors
3. Controleer of `.env.local` correct is ingesteld
4. Controleer of het SQL script is gerund in Supabase
