// Chapter 6: variable power on the grid. A made-up four-day series, not a real site: a smooth pseudo-random wind
// output (capacity factor around 35 %) against a daily demand curve (mean 1). Storage fills when wind beats demand
// and empties when it falls short, ignoring losses. Everything else, other power stations, imports or demand
// response, fills what is left.
import { THREE, M, COL, makeTurbine, fmtW, clamp, lerp, FONT } from '../turbine.js';
import { canvasTexture } from '../kit.js';

const F = (w, px) => FONT(w, Math.round(px * 1.3));
const HRS = 96, DT = 0.5, NS = HRS / DT, W = 1400, H = 760, X0 = 100, X1 = 1350, YB = 650, YT = 80, YMAX = 2.4;
const wind01 = (t) => clamp(0.34 + 0.28 * Math.sin((2 * Math.PI * t) / 70 + 1) + 0.2 * Math.sin((2 * Math.PI * t) / 17 + 2) + 0.1 * Math.sin((2 * Math.PI * t) / 6.3), 0, 1);
const dem = (t) => 1 + 0.25 * Math.sin((2 * Math.PI * (t - 14)) / 24) + 0.08 * Math.sin((2 * Math.PI * (t - 7)) / 12);
const X = (t) => X0 + (t / HRS) * (X1 - X0), Y = (v) => YB - (v / YMAX) * (YB - YT);
let cache = { k: '', sim: null };
function simulate(cap, store) {
  const k = `${cap}|${store}`; if (cache.k === k) return cache.sim;
  let e = store * 0.5; const rows = [];
  let wind = 0, direct = 0, fromStore = 0, other = 0, curtail = 0, total = 0;
  for (let i = 0; i < NS; i++) {
    const t = i * DT, w = cap * wind01(t), d = dem(t);
    const dir = Math.min(w, d); let sur = w - dir, gap = d - dir, ch = 0, dis = 0, cur = 0;
    if (sur > 0) { ch = Math.min(sur, (store - e) / DT, store / 4); e += ch * DT; cur = sur - ch; }
    if (gap > 0) { dis = Math.min(gap, e / DT, store / 4); e -= dis * DT; }
    rows.push({ w, d, dir, dis, e, oth: gap - dis, cur });
    wind += w * DT; direct += dir * DT; fromStore += dis * DT; other += (gap - dis) * DT; curtail += cur * DT; total += d * DT;
  }
  cache = { k, sim: { rows, wind, direct, fromStore, other, curtail, total } };
  return cache.sim;
}

export default {
  id: 'grid',
  short: 'The grid and neighbours',
  title: 'Variable power on the grid',
  subtitle: 'The wind comes and goes. Storage, other plants and good siting fill the gaps.',
  view: { pos: [0, 4.5, 18], target: [0, 3.6, 0] },
  learn: `<p>The grid must match supply to demand every second. Wind output follows the weather, not the clock, so it <b>varies</b>: smoothly over seconds and minutes across a farm, and by large amounts over hours and days. Spreading turbines over wide areas smooths it, and forecasts let operators plan. The rest is made up with <b>other power stations, storage, imports and flexible demand</b>.</p>
    <p>The chart is an invented four-day example. White is demand. Cyan is the wind farm’s output. Lime is what <b>storage</b> adds back. Amber is what other sources must still supply. When wind beats demand and the store is full, the spare power is <b>curtailed</b>: wasted.</p>
    <p><b>Neighbours.</b> Turbines are quiet from a distance: noise is typically a few tens of decibels at a few hundred metres, mostly a swish from the blades, and rules set minimum distances. Birds and bats can collide with blades; careful siting matters, and trials of painting one blade black have cut bird deaths. Blades are mostly glass- or carbon-fibre composites that are hard to recycle, so reuse and new recyclable resins are active areas.</p>
    <p class="tip"><b>Try it:</b> raise <b>Wind capacity</b> to see more wind than demand at windy hours, then add <b>Storage</b> to carry the surplus into the calm.</p>
    <p class="note">Made-up numbers to show the idea, not a real grid. Storage is shown without losses.</p>`,
  terms: [
    { t: 'Intermittency', d: 'Wind output varies with the weather, so other sources and storage must fill the gaps.' },
    { t: 'Curtailment', d: 'Wind power that is switched off or wasted because the grid cannot use it.' },
    { t: 'Storage', d: 'Batteries, pumped water and other ways to hold energy until it is needed.' },
    { t: 'Capacity (installed)', d: 'The most a plant can deliver. Wind rarely gives its full capacity.' },
  ],
  defaults: { cap: 1.8, store: 6 },
  controls: [
    { key: 'cap', type: 'range', label: 'Wind capacity (against average demand)', min: 0.3, max: 2.4, step: 0.05, fmt: (v) => `${(v * 100).toFixed(0)} %` },
    { key: 'store', type: 'range', label: 'Storage', min: 0, max: 24, step: 0.5, fmt: (v) => (v ? `${v.toFixed(1)} hours of average demand` : 'none') },
  ],
  quiz: [
    { q: 'What is curtailment?', options: ['Cutting blades short', 'Wasting wind power the grid cannot use', 'A grid fault', 'Turning off at 25 m/s'], answer: 1, why: 'When wind output exceeds demand and storage is full, the spare power is switched off.' },
    { q: 'What helps smooth the variable output of wind?', options: ['Putting all turbines in one valley', 'Spreading farms over wide areas, plus storage and flexible demand', 'Faster blades', 'Taller towers only'], answer: 1, why: 'Weather differs from place to place, and storage and other plants cover what is left.' },
    { q: 'What happens to wind blades at end of life?', options: ['They are always recycled', 'They are mostly hard-to-recycle composites, and new reuse and recycling routes are being developed', 'They melt', 'They are used as towers'], answer: 1, why: 'Glass- and carbon-fibre composites are difficult to separate, so the industry is working on new resins and uses.' },
  ],
  reel: [
    { ms: 5600, caption: 'Wind comes and goes. The grid fills the gaps with storage and other plants.', set: { cap: 1.8, store: 0 }, anim: { store: [0, 14] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.setShift(0, document.body.classList.contains('gb-reel') ? 0 : -0.17);
    stage.floor.visible = false;
    const turbs = [-9.0, -7.3, -5.6].map((x, i) => { const T = makeTurbine({ R: 1.5, shadow: false }); T.group.position.set(x, 0, i * -0.8 + 0.4); stage.root.add(T.group); return T; });
    const chart = canvasTexture(W, H, () => {});
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(12.6, 12.6 * H / W), new THREE.MeshBasicMaterial({ map: chart.tex, transparent: true, toneMapped: false }));
    plane.position.set(2.9, 3.8, 0); stage.root.add(plane);
    const bat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 0.8), M.ghost(0xcfe3ff, 0.2)); bat.position.set(-7.3, 6.2, 1.5);
    const fill = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 0.6), M.glow(COL.lime)); fill.position.copy(bat.position); stage.root.add(bat, fill);
    stage.label('Store', [-7.3, 8.1, 1.5], stage.root, 'hot');
    let key = '', t = 0;
    const draw = (st, tt) => {
      const g = chart.canvas.getContext('2d'), sim = simulate(st.cap, st.store);
      g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(13,15,22,.92)'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
      g.font = F(400, 26); g.fillStyle = '#737a8e'; g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
      for (let d = 0; d <= 4; d++) { g.beginPath(); g.moveTo(X(d * 24), YT); g.lineTo(X(d * 24), YB); g.stroke(); g.fillText(d ? `day ${d + 1}` : 'day 1', X(d * 24) + 8, YB + 38); }
      for (const v of [0, 1, 2]) { g.beginPath(); g.moveTo(X0, Y(v)); g.lineTo(X1, Y(v)); g.stroke(); g.fillText(`${v}×`, 36, Y(v) + 9); }
      g.fillStyle = '#a8aebf'; g.font = F(500, 28); g.fillText('Power against average demand (made-up four days)', 100, 50);
      const area = (lo, hi, col) => { g.fillStyle = col; g.beginPath(); sim.rows.forEach((r, i) => { const x = X(i * DT), y = Y(hi(r)); i ? g.lineTo(x, y) : g.moveTo(x, y); }); for (let i = NS - 1; i >= 0; i--) g.lineTo(X(i * DT), Y(lo(sim.rows[i]))); g.closePath(); g.fill(); };
      area((r) => r.dir + r.dis, (r) => r.d, 'rgba(255,181,71,.55)');
      area((r) => 0, (r) => r.dir, 'rgba(142,240,255,.55)');
      area((r) => r.dir, (r) => r.dir + r.dis, 'rgba(163,230,53,.65)');
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); sim.rows.forEach((r, i) => { const x = X(i * DT), y = Y(r.w); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); sim.rows.forEach((r, i) => { const x = X(i * DT), y = Y(r.d); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
      const lg = [['#fff', 'Demand'], ['#8ef0ff', 'Wind (dashed: all it makes)'], ['#a3e635', 'From storage'], ['#ffb547', 'Other sources']];
      g.font = F(500, 26); let lx = 100; lg.forEach(([c, tx]) => { g.fillStyle = c; g.fillRect(lx, YB + 70, 22, 22); g.fillStyle = '#a8aebf'; g.fillText(tx, lx + 32, YB + 90); lx += 60 + g.measureText(tx).width + 30; });
      const i = clamp(Math.floor(tt / DT), 0, NS - 1), x = X(tt);
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, YT); g.lineTo(x, YB); g.stroke();
      g.fillStyle = '#ffb547'; g.beginPath(); g.arc(x, Y(sim.rows[i].w), 12, 0, 7); g.fill();
      chart.tex.needsUpdate = true;
    };
    return {
      update(dt, st) {
        t = (t + dt * 5) % HRS;
        const sim = simulate(st.cap, st.store), r = sim.rows[clamp(Math.floor(t / DT), 0, NS - 1)];
        draw(st, t);
        const rpm = clamp((r.w / Math.max(0.3, st.cap)) * 14, 0, 14);
        turbs.forEach((T, i) => { T.rotor.rotation.x += ((rpm * 2 * Math.PI) / 60) * 1.8 * dt; T.setPitch(rpm < 1 ? 70 : 0); });
        const f = st.store > 0 ? clamp(r.e / st.store, 0, 1) : 0;
        fill.scale.y = Math.max(0.001, f * 3.0); fill.position.y = bat.position.y - 1.6 + (f * 3.0) / 2; bat.visible = st.store > 0; fill.visible = st.store > 0 && f > 0.01;
      },
      readout(st) {
        const sim = simulate(st.cap, st.store), n = sim.total;
        const pc = (x) => ((x / n) * 100).toFixed(0) + ' %';
        return `<div class="big">${pc(sim.direct + sim.fromStore)} of demand from wind</div><p class="r-say">Over the four days: ${pc(sim.direct)} straight from the turbines, ${pc(sim.fromStore)} via storage, and ${pc(sim.other)} from other sources.</p>
          <div class="row"><span>Wind made, in all</span><b>${pc(sim.wind)} of demand</b></div>
          <div class="row"><span>Curtailed (wasted)</span><b>${pc(sim.curtail)} of demand</b></div>
          <div class="row"><span>Average output ÷ capacity</span><b>${((sim.wind / (st.cap * HRS)) * 100).toFixed(0)} %</b></div>`;
      },
    };
  },
};
