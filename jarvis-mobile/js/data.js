/* ============================================================
   JARVIS MOBILE — data.js
   SINGURA sursă de date a aplicației. Toate ecranele citesc
   de aici prin JarvisData; nu-și țin datele proprii.

   AZI:   connect(url) pornește modul demo (date simulate).
   MÂINE: în connect(url) se înlocuiește simularea cu un
          WebSocket real către serverul de pe PC (n8n):

            const ws = new WebSocket(url);
            ws.onmessage = (ev) => addSignal(JSON.parse(ev.data));

          Formatul JSON al unui semnal rămâne cel de mai jos.
   ============================================================ */
const JarvisData = (() => {

  /* ---------- STARE ---------- */

  // Semnalele primite (cel mai nou primul). Format identic cu
  // ce va trimite serverul:
  // { asset, symbol, direction, intensity, credibility,
  //   reasoning, price, priceChangePercent }
  const signals = [
    {
      asset: "Ethereum", symbol: "ETH", direction: "long",
      intensity: 8, credibility: 9,
      reasoning: "SEC a retras procesul contra unui exchange major — confirmat de 3 surse. Volumul pe ETH a crescut cu 41% și prețul a rupt rezistența de la 3 400.",
      price: "3412.50", priceChangePercent: "4.21",
      source: "COINDESK", time: "acum 2 min", status: "pending"
    },
    {
      asset: "Ethereum", symbol: "ETH", direction: "long",
      intensity: 6, credibility: 8,
      reasoning: "Whale alert: 40 000 ETH mutați de pe exchange în cold storage — presiune de vânzare redusă.",
      price: "3405.10", priceChangePercent: "3.90",
      source: "TREE OF ALPHA", time: "acum 9 min", status: "seen"
    },
    {
      asset: "Solana", symbol: "SOL", direction: "short",
      intensity: 7, credibility: 9,
      reasoning: "Rețeaua Solana a avut o pană scurtă, validatorii repornesc — risc de scădere pe termen scurt.",
      price: "144.85", priceChangePercent: "-2.26",
      source: "COINTELEGRAPH", time: "acum 14 min", status: "seen"
    },
    {
      asset: "Arbitrum", symbol: "ARB", direction: "long",
      intensity: 5, credibility: 7,
      reasoning: "CZ menționează un proiect de infrastructură layer-2 — interes speculativ moderat.",
      price: "0.8420", priceChangePercent: "1.10",
      source: "X · @cz_binance", time: "acum 21 min", status: "seen"
    },
    {
      asset: "Bitcoin", symbol: "BTC", direction: "none",
      intensity: 2, credibility: 4,
      reasoning: "Predicție de analist fără catalizator concret — zgomot, nu acționăm.",
      price: "67250", priceChangePercent: "0.80",
      source: "COINDESK", time: "acum 30 min", status: "seen"
    },
  ];

  // Pozițiile demo — aceleași ca în HUD-ul desktop
  const positions = [
    { symbol: "ETHUSDT", direction: "long",  entry: 3398.00, current: 3412.50, stop: "3 398.00 (BE)", status: "active" },
    { symbol: "SOLUSDT", direction: "short", entry: 148.20,  current: 144.85,  stop: "146.70",        status: "active" },
    { symbol: "BTCUSDT", direction: "long",  entry: 66120,   current: 67250,   stop: "—",             status: "closed-win" },
    { symbol: "XRPUSDT", direction: "long",  entry: 0.6120,  current: 0.5995,  stop: "—",             status: "closed-loss" },
  ];

  // Statistici de performanță
  const stats = {
    winrate: "64%", pnlTotal: "+11.8%", rr: "2.4 : 1",
    trades: 17, active: 2,
  };

  // Nivelurile semnalului activ, pentru grafic
  const chartLevels = { entry: 3398, tp: 3570, sl: 3330, risk: "1.5% cont" };

  // Replicile lui Jarvis (cea din față se scrie prima)
  const speechQueue = [
    "Șefu', am detectat un catalizator. SEC a retras procesul contra unui exchange major — confirmat de 3 surse acum 4 minute. Intensitate 8, credibilitate 9.",
    "Propun LONG pe ETH: 1.5% din cont, stop-loss la −2%, take-profit la +5%. Aștept confirmarea ta.",
    "Poziția SOL e pe +2.26%. Am coborât stop-ul — de acum trade-ul nu mai poate pierde.",
  ];

  /* ---------- ABONAȚI (ecranele UI) ---------- */

  const listeners = [];
  // Ecranele se abonează aici; evenimente: 'signals','positions','speech','price','new-signal'
  function onUpdate(cb){ listeners.push(cb); }
  function notify(event){ listeners.forEach(cb => cb(event)); }

  /* ---------- CONECTARE ---------- */

  let demoTimer = null;

  // AZI: pornește simularea locală. MÂINE: aici se deschide WebSocket-ul.
  function connect(url){
    // --- ÎNLOCUIEȘTE DE AICI când ai serverul ---
    // Simulare: prețul ETH pâlpâie la fiecare 1.8s, ca pe desktop
    demoTimer = setInterval(() => {
      const base = 3412.5;
      const v = base + (Math.random() - 0.5) * 7;
      const eth = positions.find(p => p.symbol === "ETHUSDT");
      if (eth) eth.current = v;
      signals[0].price = v.toFixed(2);
      notify('price');
    }, 1800);
    // --- PÂNĂ AICI ---
    notify('signals'); notify('positions'); notify('speech');
    return true;
  }

  // Punct de intrare pentru un semnal nou (îl va apela WebSocket-ul)
  function addSignal(sig){
    sig.status = "pending";
    sig.time = sig.time || "acum";
    signals.unshift(sig);
    speechQueue.unshift(
      `Semnal nou pe ${sig.asset}: ${sig.direction === 'long' ? 'LONG' : sig.direction === 'short' ? 'SHORT' : 'zgomot'}, ` +
      `intensitate ${sig.intensity}, credibilitate ${sig.credibility}. ${sig.reasoning}`
    );
    notify('new-signal'); notify('signals'); notify('speech');
  }

  /* ---------- ACȚIUNI (butoanele Confirmă / Anulează) ---------- */

  // AZI: doar actualizează UI-ul local + replica lui Jarvis.
  // MÂINE: aici se trimite confirmarea către server (ws.send / fetch).
  function confirm(){
    const sig = signals.find(s => s.status === "pending");
    if (sig) sig.status = "confirmed";
    speechQueue.unshift(
      "Confirmat. Execut ordinul pe Testnet… Ordin plasat. Desenez nivelurile pe grafic și monitorizez."
    );
    notify('speech'); notify('signals');
  }

  function reject(){
    const sig = signals.find(s => s.status === "pending");
    if (sig) sig.status = "rejected";
    speechQueue.unshift(
      "Am înțeles, anulez propunerea. Continui să monitorizez piața și știrile."
    );
    notify('speech'); notify('signals');
  }

  /* ---------- API PUBLIC ---------- */

  return {
    connect, onUpdate, addSignal, confirm, reject,
    getSignals:   () => signals,
    // semnalul activ = cel mai nou care așteaptă decizie (sau cel mai nou, ca fallback)
    getActiveSignal: () => signals.find(s => s.status === "pending") || signals[0],
    getPositions: () => positions,
    getStats:     () => stats,
    getLevels:    () => chartLevels,
    nextSpeech:   () => { const s = speechQueue.shift(); if (s) speechQueue.push(s); return s; },
  };
})();
