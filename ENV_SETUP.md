# Supabase Environment Setup

## Quick Setup

Om Supabase te configureren, maak een `.env.local` bestand aan in de root directory met de volgende inhoud:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Stap-voor-stap instructies:

### 1. Maak een Supabase account
- Ga naar https://supabase.com/dashboard
- Maak een account of log in

### 2. Maak een nieuw project
- Klik op "New Project"
- Vul project details in
- Wacht tot het project klaar is (2-3 minuten)

### 3. Haal je credentials op
- Ga naar **Settings** → **API** in je Supabase dashboard
- Kopieer de **Project URL** (bijv. `https://abcdefghijklmnop.supabase.co`)
- Kopieer de **anon public** key (een lange string die begint met `eyJ...`)

### 4. Maak .env.local bestand
Maak een nieuw bestand genaamd `.env.local` in de root directory (naast `package.json`) met:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key-hier
```

**BELANGRIJK:** Vervang de placeholder waarden met je echte Supabase credentials!

### 5. Setup database
- Ga naar **SQL Editor** in je Supabase dashboard
- Open het bestand `scripts/complete-setup.sql` uit dit project
- Kopieer de hele inhoud
- Plak het in de SQL Editor
- Klik op **Run** om de database tabellen aan te maken

### 6. Herstart de server
Stop de huidige server (Ctrl+C) en start opnieuw:
```bash
npm run dev
```

### 7. Test het
- Open http://localhost:3000
- Je zou nu moeten kunnen inloggen en accounts aanmaken
- De melding "Supabase is not configured" zou moeten verdwijnen

## Demo Mode (Zonder Supabase)

Als je Supabase niet wilt configureren, kun je gewoon:
- Klik op **"Continue with Demo Mode"** op de login pagina
- De applicatie werkt dan met sample data (geen database opslag)

## Troubleshooting

**"Supabase is not configured" blijft verschijnen:**
- Controleer dat `.env.local` in de root directory staat (niet in een subfolder)
- Controleer dat de variabele namen exact zijn: `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Herstart de development server na het maken/wijzigen van `.env.local`

**Database errors:**
- Zorg dat je het `complete-setup.sql` script hebt uitgevoerd in Supabase SQL Editor
- Controleer in Supabase Dashboard → Table Editor dat alle tabellen zijn aangemaakt

**Authentication niet werkt:**
- Ga naar Supabase Dashboard → Authentication → URL Configuration
- Zet **Site URL** op: `http://localhost:3000`
- Voeg toe aan **Redirect URLs**: `http://localhost:3000/auth/callback`
- Klik **Save**
