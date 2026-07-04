/* ============================================================
   JARVIS MOBILE — app.js
   Toată logica de interfață. Datele vin EXCLUSIV din JarvisData
   (js/data.js) — aici doar randăm și trimitem acțiunile userului.
   ============================================================ */

/* ---------- utilitare ---------- */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// vibrație scurtă la interacțiuni (Android/Chrome)
function vibrate(pattern){ if (navigator.vibrate) navigator.vibrate(pattern); }

// format numeric românesc: 3 412,50
function fmt(v, dec = 2){
  return Number(v).toLocaleString('ro-RO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// eticheta de direcție (chip LONG/SHORT/zgomot)
function dirChip(sig){
  if (sig.direction === 'long')  return `<span class="chip long">▲ LONG ${sig.symbol}</span>`;
  if (sig.direction === 'short') return `<span class="chip short">▼ SHORT ${sig.symbol}</span>`;
  return `<span class="chip none">— ZGOMOT</span>`;
}

/* ---------- ceas ---------- */

setInterval(() => {
  $('#clock').textContent = new Date().toLocaleTimeString('ro-RO');
}, 1000);

/* ---------- navigare prin taburi ---------- */

$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    vibrate(10);
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.screen').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    tab.classList.remove('has-new');
    $('#' + tab.dataset.screen).classList.add('active');
    // graficul se desenează doar când ecranul lui devine vizibil
    if (tab.dataset.screen === 'screen-chart') drawChart();
  });
});

/* ---------- ECRAN NUCLEU: typing + semnal activ + butoane ---------- */

// scrie replica lui Jarvis literă cu literă, apoi trece la următoarea
const speechEl = $('#speech');
let typeTimer = null;
function typeSpeech(text, restart = false){
  clearTimeout(typeTimer);
  let i = 0;
  (function step(){
    if (i < text.length){
      speechEl.textContent = text.slice(0, ++i);
      typeTimer = setTimeout(step, 26);
    } else {
      // pauză, apoi replica următoare din coadă
      typeTimer = setTimeout(() => typeSpeech(JarvisData.nextSpeech()), 4200);
    }
  })();
}

function renderActiveSignal(){
  const s = JarvisData.getActiveSignal();
  const el = $('#activeSignal');
  if (!s){ el.innerHTML = '<div class="reason">Niciun semnal activ.</div>'; return; }
  const chg = parseFloat(s.priceChangePercent);
  const statusTxt = { pending:'ÎN AȘTEPTARE', confirmed:'CONFIRMAT ✓', rejected:'ANULAT ✕', seen:'VIZUALIZAT' }[s.status] || '';
  el.innerHTML = `
    <div class="row1">
      <span class="asset">${s.asset} · ${s.symbol}</span>
      <span class="price-line ${chg >= 0 ? 'pnl-p' : 'pnl-n'}">${fmt(s.price)} (${chg >= 0 ? '▲ +' : '▼ '}${fmt(chg)}%)</span>
    </div>
    <div class="scores">
      ${dirChip(s)}
      <span class="chip i">INT ${s.intensity}/10</span>
      <span class="chip c">CRED ${s.credibility}/10</span>
      <span class="chip ${s.status === 'confirmed' ? 'long' : s.status === 'rejected' ? 'short' : 'c'}">${statusTxt}</span>
    </div>
    <div class="reason">${s.reasoning}</div>
    <div class="bar"><i style="transform:scaleX(${s.intensity / 10})"></i></div>`;
}

// Confirmă / Anulează → doar apelează modulul de date + vibrație
$('#btnConfirm').addEventListener('click', () => { vibrate([20, 40, 20]); JarvisData.confirm(); });
$('#btnReject').addEventListener('click',  () => { vibrate(60);           JarvisData.reject();  });

/* ---------- ECRAN SEMNALE ---------- */

function renderSignals(){
  $('#feed').innerHTML = JarvisData.getSignals().map(s => `
    <div class="news ${s.intensity >= 7 ? 'hot' : ''}">
      <div class="top"><span class="src">${s.source || 'SERVER'}</span><span class="time">${s.time || ''}</span></div>
      <div class="title">${s.asset} · ${fmt(s.price)} USDT</div>
      <div class="reason">${s.reasoning}</div>
      <div class="scores">
        ${dirChip(s)}
        <span class="chip i">INT ${s.intensity}/10</span>
        <span class="chip c">CRED ${s.credibility}/10</span>
      </div>
      <div class="bar"><i style="transform:scaleX(${s.intensity / 10})"></i></div>
    </div>`).join('');
}

/* ---------- ECRAN POZIȚII (carduri) ---------- */

function renderPositions(){
  $('#posList').innerHTML = JarvisData.getPositions().map(p => {
    // P&L procentual, cu semn inversat pentru short
    let pnl = (p.current - p.entry) / p.entry * 100;
    if (p.direction === 'short') pnl = -pnl;
    const stateTxt = { 'active':'ACTIVĂ', 'closed-win':'ÎNCHISĂ ✓', 'closed-loss':'STOP ✕' }[p.status];
    const dec = p.entry < 10 ? 4 : 2;
    return `
    <div class="pos-card panel">
      <div class="row1">
        <span class="sym">${p.symbol}</span>
        <span class="${p.direction === 'long' ? 'dir-l' : 'dir-s'}">${p.direction === 'long' ? '▲ LONG' : '▼ SHORT'}</span>
      </div>
      <div class="grid2">
        <span><span class="lbl">INTRARE</span>${fmt(p.entry, dec)}</span>
        <span><span class="lbl">ACUM</span>${fmt(p.current, dec)}</span>
        <span><span class="lbl">P&L</span><span class="pnl ${pnl >= 0 ? 'pnl-p' : 'pnl-n'}">${pnl >= 0 ? '+' : ''}${fmt(pnl)}%</span></span>
        <span><span class="lbl">STOP</span>${p.stop}</span>
      </div>
      <div class="grid2" style="margin-top:6px">
        <span><span class="lbl">STARE</span><span class="${p.status === 'active' ? 'st-active' : 'st-closed'}">${stateTxt}</span></span>
      </div>
    </div>`;
  }).join('');

  const st = JarvisData.getStats();
  $('#stats').innerHTML = `
    <div class="stat"><div class="n g">${st.winrate}</div><div class="l">Winrate (30z)</div></div>
    <div class="stat"><div class="n g">${st.pnlTotal}</div><div class="l">P&L Total</div></div>
    <div class="stat"><div class="n">${st.rr}</div><div class="l">Risc/Recomp</div></div>
    <div class="stat"><div class="n">${st.trades}</div><div class="l">Tranzacții</div></div>
    <div class="stat"><div class="n g">${st.active}</div><div class="l">Active acum</div></div>
    <div class="stat"><div class="n">DEMO</div><div class="l">Paper</div></div>`;
}

/* ---------- ECRAN GRAFIC (canvas, orientat pe lățimea telefonului) ---------- */

const cv = $('#chart');
// seria de preț se generează o singură dată ca să nu „sară" la fiecare redesenare
const chartPts = (() => {
  const pts = []; let p = 3290;
  for (let i = 0; i < 90; i++){
    const drift = i > 62 ? 2.6 : 0.4;              // breakout după știre
    p += Math.sin(i * .7) * 6 + (Math.random() - 0.42) * 10 + drift;
    pts.push(p);
  }
  return pts;
})();

function drawChart(){
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth, H = 300;
  if (!W) return;                                   // ecran încă ascuns
  cv.width = W * dpr; cv.height = H * dpr;
  const x = cv.getContext('2d'); x.scale(dpr, dpr);
  x.clearRect(0, 0, W, H);

  const padL = 6, padR = 52, padT = 18, padB = 20;
  const cw = W - padL - padR, ch = H - padT - padB;
  const pts = chartPts, n = pts.length;
  const lv = JarvisData.getLevels();
  const mn = Math.min(...pts, lv.sl) - 15, mx = Math.max(...pts, lv.tp) + 15;
  const X = i => padL + cw * i / (n - 1);
  const Y = v => padT + ch * (1 - (v - mn) / (mx - mn));

  // grilă orizontală + etichete de preț
  x.strokeStyle = 'rgba(0,229,255,.08)'; x.lineWidth = 1;
  for (let g = 0; g <= 4; g++){
    const y = padT + ch * g / 4;
    x.beginPath(); x.moveTo(padL, y); x.lineTo(W - padR, y); x.stroke();
    x.fillStyle = 'rgba(93,130,150,.9)'; x.font = '9px JetBrains Mono';
    x.fillText((mx - (mx - mn) * g / 4).toFixed(0), W - padR + 6, y + 3);
  }

  // linii Entry / TP / SL
  const line = (v, color, label) => {
    const y = Y(v);
    x.setLineDash([6, 5]); x.strokeStyle = color; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(padL, y); x.lineTo(W - padR, y); x.stroke(); x.setLineDash([]);
    x.fillStyle = color; x.font = 'bold 9px JetBrains Mono'; x.fillText(label, padL + 4, y - 4);
  };
  line(lv.tp,    '#27f5a3', 'TP '    + lv.tp);
  line(lv.entry, '#00e5ff', 'ENTRY ' + lv.entry);
  line(lv.sl,    '#ff4d6d', 'SL '    + lv.sl);

  // umplere sub linie
  const grad = x.createLinearGradient(0, padT, 0, H);
  grad.addColorStop(0, 'rgba(0,229,255,.28)'); grad.addColorStop(1, 'rgba(0,229,255,0)');
  x.beginPath(); x.moveTo(X(0), Y(pts[0]));
  pts.forEach((v, i) => x.lineTo(X(i), Y(v)));
  x.lineTo(X(n - 1), H - padB); x.lineTo(X(0), H - padB); x.closePath();
  x.fillStyle = grad; x.fill();

  // linia prețului
  x.beginPath(); x.moveTo(X(0), Y(pts[0]));
  pts.forEach((v, i) => x.lineTo(X(i), Y(v)));
  x.strokeStyle = '#00e5ff'; x.lineWidth = 2;
  x.shadowColor = 'rgba(0,229,255,.8)'; x.shadowBlur = 8; x.stroke(); x.shadowBlur = 0;

  // marcaj ⚡ știre (momentul catalizatorului)
  const ni = 63;
  x.fillStyle = '#ffc857'; x.shadowColor = '#ffc857'; x.shadowBlur = 12;
  x.beginPath(); x.arc(X(ni), Y(pts[ni]), 4.5, 0, 7); x.fill(); x.shadowBlur = 0;
  x.font = 'bold 9px JetBrains Mono'; x.fillText('⚡ ȘTIRE', X(ni) - 22, Y(pts[ni]) - 12);

  // săgeată de intrare Jarvis
  const ei = 66, exx = X(ei), ey = Y(pts[ei]);
  x.fillStyle = '#27f5a3'; x.shadowColor = '#27f5a3'; x.shadowBlur = 10;
  x.beginPath(); x.moveTo(exx, ey + 22); x.lineTo(exx - 6, ey + 34); x.lineTo(exx + 6, ey + 34);
  x.closePath(); x.fill(); x.shadowBlur = 0;
  x.fillText('◈ ENTRY', exx - 20, ey + 46);

  // punctul live
  x.fillStyle = '#eafcff'; x.shadowColor = '#00e5ff'; x.shadowBlur = 14;
  x.beginPath(); x.arc(X(n - 1), Y(pts[n - 1]), 4, 0, 7); x.fill(); x.shadowBlur = 0;
}
window.addEventListener('resize', drawChart);

// niveluri sub grafic
function renderLevels(){
  const lv = JarvisData.getLevels();
  $('#levels').innerHTML = `
    <span class="lv entry">◈ INTRARE ${fmt(lv.entry)}</span>
    <span class="lv tp">▲ TP ${fmt(lv.tp)} (+5.0%)</span>
    <span class="lv sl">▼ SL ${fmt(lv.sl)} (−2.0%)</span>
    <span class="lv">RISC: ${lv.risk}</span>`;
}

// prețul live din antetul graficului
function renderPrice(){
  const s = JarvisData.getActiveSignal();
  if (!s) return;
  $('#px').textContent = fmt(s.price);
  const chg = parseFloat(s.priceChangePercent);
  const chgEl = $('#chg');
  chgEl.textContent = (chg >= 0 ? '▲ +' : '▼ ') + fmt(chg) + '% (24h)';
  chgEl.style.color = chg >= 0 ? 'var(--green)' : 'var(--red)';
  $('#chartPair').textContent = s.symbol + ' / USDT';
}

/* ---------- legăm totul de modulul de date ---------- */

JarvisData.onUpdate((event) => {
  switch (event){
    case 'signals':    renderSignals(); renderActiveSignal(); break;
    case 'positions':  renderPositions(); break;
    case 'price':      renderPrice(); renderPositions(); renderActiveSignal(); break;
    case 'speech':     typeSpeech(JarvisData.nextSpeech()); break;
    case 'new-signal':
      // semnal nou: vibrație lungă + punct auriu pe tabul SEMNALE
      vibrate([80, 60, 80]);
      const tab = document.querySelector('[data-screen="screen-signals"]');
      if (!tab.classList.contains('active')) tab.classList.add('has-new');
      break;
  }
});

/* ---------- pornire ---------- */
// AZI: mock. MÂINE: JarvisData.connect('ws://IP-ul-PC-ului:port')
JarvisData.connect('demo://local');
renderPrice();
renderLevels();
drawChart();
