# JARVIS MOBILE

Telecomanda de telefon pentru sistemul tău de trading — o aplicație web progresivă (PWA)
în stil Iron Man, instalabilă pe Android direct din Chrome. Funcționează și offline.

> **MOD DEMO** — aplicația pornește cu date simulate (paper trading).
> Nu execută ordine reale; doar afișează semnale și trimite confirmări către server.

## Structura proiectului

```
jarvis-mobile/
├── index.html          — scheletul aplicației (4 ecrane + tab bar)
├── css/style.css       — stilul Jarvis (cyan/auriu/verde/roșu pe #04080f)
├── js/data.js          — SINGURA sursă de date; aici conectezi serverul mai târziu
├── js/app.js           — logica de interfață (taburi, randare, grafic, vibrații)
├── manifest.json       — manifestul PWA (nume, iconițe, standalone, portrait)
├── service-worker.js   — cache offline pentru toate fișierele
└── icons/              — iconițele 192px și 512px (reactorul cyan)
```

## Ecranele

| Tab | Ce conține |
|---|---|
| **◈ NUCLEU** | Reactorul animat, replica lui Jarvis scrisă literă cu literă, ultimul semnal activ, butoanele mari ✓ CONFIRMĂ / ✕ ANULEAZĂ (cu vibrație) |
| **⚡ SEMNALE** | Lista semnalelor primite: direcție LONG/SHORT, intensitate, credibilitate, motivul în română; cele puternice au margine aurie |
| **▤ POZIȚII** | Carduri de poziții cu P&L colorat + statistici: winrate, P&L total, risc/recompensă |
| **∿ GRAFIC** | Linia prețului cu marcaj de știre ⚡ și liniile Entry / TP / SL |

## Cum îl urci pe Netlify (drag & drop)

1. Intră pe [app.netlify.com/drop](https://app.netlify.com/drop) (cont gratuit).
2. Trage folderul **`jarvis-mobile`** întreg în pagină.
3. În câteva secunde primești un link de forma `https://ceva-random.netlify.app`.
   Poți schimba numele din *Site settings → Change site name*.
4. Gata — linkul e HTTPS, exact ce are nevoie PWA-ul ca să fie instalabil.

> Alternativ, pentru test local rapid: `npx serve jarvis-mobile` sau
> `python3 -m http.server` din folderul `jarvis-mobile`, apoi deschide
> `http://localhost:8000` (service worker-ul merge și pe localhost).

## Cum îl instalezi pe Android (Chrome)

1. Deschide linkul de Netlify în **Chrome** pe telefon.
2. Apasă meniul **⋮** (dreapta sus) → **„Adaugă pe ecranul principal"**
   (sau „Instalează aplicația" — Chrome poate afișa și un banner automat).
3. Confirmă. Iconița JARVIS (reactorul cyan) apare pe ecranul principal.
4. Deschisă de acolo, aplicația rulează **fullscreen, fără bara de browser**,
   în modul portret, și **funcționează și fără internet** (datele demo sunt în aplicație).

## Cum conectezi serverul tău (n8n / PC) mai târziu

Toate datele trec printr-un singur modul: **`js/data.js`**. Ecranele doar citesc de acolo.

1. Deschide `js/data.js` și caută funcția `connect(url)` — zona marcată cu
   `--- ÎNLOCUIEȘTE DE AICI ---`.
2. Înlocuiește simularea cu un WebSocket real:
   ```js
   function connect(url){
     const ws = new WebSocket(url);            // ex. 'ws://192.168.1.10:8080'
     ws.onmessage = (ev) => addSignal(JSON.parse(ev.data));
     ...
   }
   ```
3. Formatul JSON așteptat pentru un semnal (exact ce trimite serverul tău):
   ```json
   {
     "asset": "Ethereum", "symbol": "ETH", "direction": "long",
     "intensity": 8, "credibility": 9,
     "reasoning": "SEC a retras procesul...",
     "price": "3412.50", "priceChangePercent": "4.21"
   }
   ```
4. În `confirm()` / `reject()` din același fișier adaugi trimiterea deciziei
   către server (`ws.send(...)` sau `fetch(...)`) — butoanele deja apelează
   aceste funcții.
5. În `js/app.js`, ultima linie: schimbă `JarvisData.connect('demo://local')`
   cu adresa reală.

> **Important:** dacă site-ul e pe HTTPS (Netlify), browserul cere WebSocket
> securizat (`wss://`), nu `ws://`. Pentru teste în rețeaua locală poți rula
> aplicația pe `http://` local, sau pui un tunel (ex. ngrok) peste serverul n8n.

## După orice modificare de fișiere

Crește versiunea din `service-worker.js` (`jarvis-mobile-v1` → `v2`) ca telefoanele
care au aplicația instalată să primească varianta nouă, apoi urcă din nou pe Netlify.

## Reguli de siguranță

- Zero librării externe (doar fonturile Google).
- Nicio execuție reală de ordine — serverul e pe **Binance Testnet**, paper trading.
