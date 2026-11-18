// Chapter 5: farms and wakes. Jensen (Park) wake model: the speed deficit behind a turbine is
// (1 - sqrt(1 - Ct)) / (1 + 2 k x / D)^2, with wake decay k about 0.075 onshore and about 0.04 offshore (smoother
// air, so wakes last longer). Several wakes combine as the root of the sum of squares. Ct (thrust) is about 0.8 below
// rated and falls above it. Capacity factor ranges are typical: roughly 25-45 % onshore, 35-55 % offshore.
import { THREE, M, COL, makeTurbine, rod, curveP, rpmOf, TURB, fmtW, clamp } from '../turbine.js';
import { box } from '../kit.js';

const N = 4, COLS = 3, DS = 2.0, SITES = { onshore: { k: 0.075, cf: 'about 25–45 %', n: 'Onshore' }, offshore: { k: 0.04, cf: 'about 35–55 %', n: 'Offshore' } };
const ct = (u) => (u < TURB.vin || u > TURB.vout ? 0.1 : u <= TURB.vr ? 0.8 : 0.8 * (TURB.vr / u) ** 2);
export function farmSpeeds(v, spacing, k) {
  const u = [];
  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) { const x = (i - j) * spacing; const d = (1 - Math.sqrt(1 - ct(u[j]))) / (1 + 2 * k * x) ** 2; sum += d * d; }
    u.push(v * (1 - Math.sqrt(sum)));
  }
  return u;
}

export default {
  id: 'farm',
  short: 'Farms and wakes',
  title: 'Wind farms and wakes',
  subtitle: 'Each turbine leaves slow, choppy air for the next. Spacing is the compromise.',
  view: { pos: [0, 17, 33], target: [0, 1.5, 0] },
  learn: `<p>Turbines are grouped into <b>wind farms</b> because cables, roads and grid connections are shared. But a turbine takes energy from the air, so behind it is a <b>wake</b>: slower, more turbulent air. A turbine in that wake makes less power and feels more wear.</p>
    <p>The remedy is room. Engineers space turbines in units of <b>rotor diameters</b>, often several diameters apart across the wind and more along the prevailing wind. Wakes spread and mix with fresh air as they travel, and they do so faster over rough land than over calm sea, so offshore farms feel their wakes for longer. Wake losses for a whole farm are often a few to ten percent of energy, but they can be much higher in a tightly packed farm.</p>
    <p>A turbine’s <b>capacity factor</b> is its real annual energy divided by what it would make running at full rated power all year. It is far below 100 % because the wind rarely blows at rated speed. Onshore farms are typically around 25 to 45 %, offshore farms around 35 to 55 %, helped by stronger, steadier wind and larger machines.</p>
    <p class="tip"><b>Try it:</b> shrink the <b>Spacing</b> and watch the last row slow down and its power fall. Then flip between <b>Onshore</b> and <b>Offshore</b>.</p>
    <p class="note">A simple wake model with four turbines in a line and the wind blowing exactly along the line, the worst case. Real farms lose less on average because the wind direction changes. Good for the idea, not for planning a real farm.</p>`,
  terms: [
    { t: 'Wake', d: 'The slower, more turbulent air behind a turbine that has taken energy from the wind.' },
    { t: 'Rotor diameter (D)', d: 'The unit for spacing turbines: spacing is quoted as a number of rotor diameters.' },
    { t: 'Capacity factor', d: 'Actual energy over a year divided by the energy at full rated power all year.' },
    { t: 'Wake loss', d: 'The energy lost because turbines sit in the wakes of others.' },
  ],
  defaults: { v: 9, sp: 5, site: 'onshore' },
  controls: [
    { key: 'v', type: 'range', label: 'Wind speed', min: 5, max: 20, step: 0.1, fmt: (v) => `${v.toFixed(1)} m/s` },
    { key: 'sp', type: 'range', label: 'Spacing along the wind', min: 3, max: 8, step: 0.1, fmt: (v) => `${v.toFixed(1)} rotor diameters (${(v * 0.12).toFixed(2)} km)` },
    { key: 'site', type: 'seg', label: 'Site', options: [{ v: 'onshore', label: 'Onshore' }, { v: 'offshore', label: 'Offshore' }] },
  ],
  quiz: [
    { q: 'Why does a turbine in the middle of a farm make less power?', options: ['It is older', 'It sits in the wake of turbines upwind', 'The generator is smaller', 'It is higher'], answer: 1, why: 'Upwind turbines take energy and leave slower, more turbulent air.' },
    { q: 'What is capacity factor?', options: ['The tower height', 'Actual yearly energy divided by the energy at rated power all year', 'The wind speed', 'The number of blades'], answer: 1, why: 'It says how much of its full-power potential a turbine really delivers over time.' },
    { q: 'Why can wakes last longer at sea?', options: ['More birds', 'The air is smoother, so wakes mix with fresh air more slowly', 'Water is warmer', 'The turbines are shorter'], answer: 1, why: 'Calm sea air has less turbulence to mix a wake away.' },
  ],
  reel: [
    { ms: 5600, caption: 'Every turbine leaves a wake. The next one downwind makes less power.', set: { v: 9, sp: 4, site: 'offshore' }, view: { pos: [0, 14, 27], target: [0, 1.5, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.setShift(0, document.body.classList.contains('gb-reel') ? 0 : -0.17);
    const turbs = [], bars = [], cones = [];
    const bm = M.glow(COL.lime);
    for (let c = 0; c < COLS; c++) for (let i = 0; i < N; i++) {
      const T = makeTurbine({ R: DS / 2, shadow: false }); T.group.userData = { i, c }; stage.root.add(T.group); turbs.push(T);
      const b = box(0.22, 1, 0.22, bm); b.castShadow = false; b.userData = { i, c }; stage.root.add(b); bars.push(b);
    }
    const wind = new THREE.Group(); stage.root.add(wind);
    let key = '', coneMat = M.ghost(COL.cyan, 0.07);
    const arrowG = new THREE.Group(); const sh = new THREE.Mesh(new THREE.BoxGeometry(5, 0.06, 0.12), M.glow(COL.cyan)); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 14), M.glow(COL.cyan)); tip.rotation.z = -Math.PI / 2; tip.position.x = 2.7; arrowG.add(sh, tip); arrowG.position.set(-24, 0.4, 0); stage.root.add(arrowG);
    stage.label('Wind', [-24, 1.3, 0]);
    let lblEnd = stage.label('', [0, 0, 0]);
    const place = (st) => {
      const sp = st.sp * DS, z = 3 * DS;
      turbs.forEach((T) => { const { i, c } = T.group.userData; T.group.position.set((i - (N - 1) / 2) * sp, 0, (c - 1) * z * 1.0); });
      bars.forEach((b) => { const { i, c } = b.userData; b.position.set((i - (N - 1) / 2) * sp, 0, (c - 1) * z + 1.0); });
    };
    return {
      update(dt, st) {
        const k = `${st.sp.toFixed(2)}|${st.site}`;
        if (k !== key) {
          key = k; place(st);
          cones.forEach((c) => { wind.remove(c); c.geometry.dispose(); }); cones.length = 0;
          const kk = SITES[st.site].k;
          turbs.forEach((T) => {
            const { i } = T.group.userData, L = (N - 1 - i) * st.sp * DS + 2.5, r0 = DS / 2 * 1.0, g = new THREE.Group();
            const cone = rod(0, L, r0, r0 + kk * L, coneMat, 24, true); cone.castShadow = false; cone.position.x = L / 2; g.add(cone);
            g.position.set(T.group.position.x + T.xh, T.hubY, T.group.position.z); wind.add(g); cones.push(g);
          });
          lblEnd.element.textContent = 'Wake';
        }
        const u = farmSpeeds(st.v, st.sp, SITES[st.site].k);
        turbs.forEach((T) => { const { i } = T.group.userData; T.rotor.rotation.x += ((rpmOf(u[i]) * 2 * Math.PI) / 60) * 1.6 * dt; });
        bars.forEach((b) => { const { i } = b.userData, p = curveP(u[i]) / TURB.P; b.scale.y = Math.max(0.01, p * 2.2); b.position.y = b.scale.y / 2; });
        lblEnd.position.set(turbs[N - 1].group.position.x + 3.5, 2.0, 0);
      },
      readout(st) {
        const u = farmSpeeds(st.v, st.sp, SITES[st.site].k), P = u.map((x) => curveP(x)), tot = P.reduce((a, b) => a + b, 0), free = N * curveP(st.v);
        const loss = free > 0 ? (1 - tot / free) * 100 : 0;
        return `<div class="big">${loss.toFixed(1)} % lost to wakes</div><p class="r-say">One column of ${N} turbines in a ${SITES[st.site].n.toLowerCase()} wind, ${st.sp.toFixed(1)} diameters apart. Bars show each turbine’s share of rated power.</p>
          ${u.map((x, i) => `<div class="row"><span>Turbine ${i + 1}</span><b>${x.toFixed(1)} m/s · ${fmtW(P[i])}</b></div>`).join('')}
          <div class="row"><span>Column output</span><b>${fmtW(tot)}</b></div>
          <div class="row"><span>If none were in a wake</span><b>${fmtW(free)}</b></div>
          <div class="row"><span>${SITES[st.site].n} capacity factor</span><b>${SITES[st.site].cf}</b></div>`;
      },
    };
  },
};
