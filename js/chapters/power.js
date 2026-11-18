// Chapter 1: the wind's power. P = 1/2 rho A v^3 (rho 1.225 kg/m3 at sea level, 15 C). Betz: a = axial induction,
// Cp = 4a(1-a)^2, maximum 16/27 = 59.3 % at a = 1/3 (Betz 1920). The stream tube follows 1D momentum theory:
// A1 = A(1-a) far upstream, A3 = A(1-a)/(1-2a) far downstream.
import { THREE, M, COL, makeTurbine, makeWind, latheX, windPower, cpOfA, BETZ, fmtW, clamp, lerp } from '../turbine.js';

export default {
  id: 'power',
  short: 'The wind’s power',
  title: 'How much power is in the wind?',
  subtitle: 'Double the wind speed and you get eight times the power.',
  view: { pos: [-12, 6.5, 14], target: [3, 4.2, 0] },
  learn: `<p>Wind is moving air, and moving air carries <b>kinetic energy</b>. The power in the wind passing through a rotor is <b>P = ½ × ρ × A × v³</b>: air density (about 1.2 kg/m³ at sea level), times the swept area, times the wind speed <b>cubed</b>.</p>
    <p>Two things follow. Area grows with the <b>square</b> of the rotor diameter, so a rotor twice as wide catches four times the wind. And speed counts three times over: more air arrives each second, and each kilogram carries more energy. <b>Double the wind speed and the power goes up eight times.</b></p>
    <p>A rotor cannot take it all. If it stopped the air completely, the air would pile up and nothing could flow through. If it took nothing, it would make nothing. In 1919–1920 Albert Betz showed that the best a rotor can do is <b>16/27, about 59.3 %</b>, of the power in the wind. Real turbines reach roughly 45 % in the blades, then lose a little more in the gears and generator.</p>
    <p class="tip"><b>Try it:</b> drag <b>Wind speed</b> and watch the power. Then slide <b>Braking</b>: too little and the air sails through, too much and it backs up. The peak sits at one third.</p>`,
  terms: [
    { t: 'Swept area', d: 'The circle the blades sweep out, A = π × (diameter ÷ 2)².' },
    { t: 'Betz limit', d: 'The most any open rotor can take from the wind: 16/27, about 59.3 %.' },
    { t: 'Power coefficient (Cp)', d: 'The share of the wind’s power the rotor actually captures.' },
    { t: 'Axial induction (a)', d: 'How much the rotor slows the wind at the rotor plane: the wind there is (1 − a) times the free wind.' },
  ],
  defaults: { v: 8, D: 120, a: 1 / 3 },
  controls: [
    { key: 'v', type: 'range', label: 'Wind speed', min: 2, max: 20, step: 0.1, fmt: (v) => `${v.toFixed(1)} m/s · ${(v * 3.6).toFixed(0)} km/h` },
    { key: 'D', type: 'range', label: 'Rotor diameter', min: 40, max: 200, step: 1, fmt: (v) => `${v.toFixed(0)} m` },
    { key: 'a', type: 'range', label: 'Braking: how hard the rotor slows the wind', min: 0.02, max: 0.45, step: 0.005, fmt: (v) => `a = ${v.toFixed(2)} · Cp ${(cpOfA(v) * 100).toFixed(0)} %`, hint: 'The peak, 59.3 %, is at a = 0.33.' },
    { key: 'btn', type: 'buttons', label: 'Shortcuts', items: [{ label: 'Betz optimum', act: (s) => { s.a = 1 / 3; } }, { label: 'Double the wind', act: (s) => { s.v = Math.min(20, s.v * 2); } }] },
  ],
  quiz: [
    { q: 'The wind speed doubles. What happens to the power in the wind?', options: ['It doubles', 'It goes up four times', 'It goes up eight times', 'It stays the same'], answer: 2, why: 'Power goes with the cube of the speed, and 2³ = 8.' },
    { q: 'You make the rotor twice as wide. How much more wind does it catch?', options: ['Twice', 'Four times', 'Eight times', 'The same'], answer: 1, why: 'Swept area goes with the square of the diameter, so 2² = 4.' },
    { q: 'What does the Betz limit say?', options: ['Wind turbines must stop above 25 m/s', 'No open rotor can take more than about 59 % of the wind’s power', 'Blades should have three blades', 'Air weighs 1.2 kg per cubic metre'], answer: 1, why: 'Betz showed the best case is 16/27 of the power in the wind, because the air has to keep moving to get out of the way.' },
  ],
  reel: [
    { ms: 5200, caption: 'Double the wind and you get eight times the power.', set: { v: 5, D: 120, a: 1 / 3 }, anim: { v: [5, 10] }, view: { pos: [-12, 6, 15], target: [1, 4.5, 0] }, spin: 0 },
    { ms: 5400, caption: 'No rotor can take it all. Betz’s limit is 59.3 %.', set: { v: 9, D: 120, a: 0.08 }, anim: { a: [0.08, 0.33] }, view: { pos: [-8, 12, 22], target: [4, 4, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.setShift(0, document.body.classList.contains('gb-reel') ? 0 : -0.17);
    const BASE = 3;
    const T = makeTurbine({ R: BASE }); stage.root.add(T.group);
    const wind = makeWind(260, { x0: -16, x1: 22, y0: 0.4, y1: 10, z: 8 }); stage.root.add(wind);
    // air that reaches the rotor in 10 seconds
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 40, 1, true), M.ghost(COL.cyan, 0.1));
    col.rotation.z = Math.PI / 2; const colG = new THREE.Group(); colG.add(col); stage.root.add(colG);
    let tube = null, key = '';
    const areaAt = (x, R0, a) => (x < 0 ? (1 - a) + a * Math.exp(x / (1.2 * R0)) : 1 + ((1 - a) / (1 - 2 * a) - 1) * (1 - Math.exp(-x / (1.5 * R0))));
    stage.label('Rotor', [0, BASE * 1.5 + 1.8, 0], T.group);
    const lblCol = stage.label('Air that arrives in 10 seconds', [-4, 1.2, 0]);
    return {
      update(dt, st) {
        const sc = st.D / 120, R0 = BASE * sc, hub = T.hubY * sc, xh = T.xh * sc;
        T.group.scale.setScalar(sc);
        T.rotor.rotation.x += Math.min(3, (7 * st.v) / (st.D / 2)) * dt;
        const L = st.v * 0.5;
        colG.position.set(xh - L / 2, hub, 0); col.scale.set(L, R0, R0); col.rotation.z = Math.PI / 2;
        col.scale.set(R0, L, R0);
        lblCol.position.set(xh - L / 2, hub + R0 + 0.5, 0);
        const k = `${st.D}|${st.a.toFixed(3)}`;
        if (k !== key) {
          key = k;
          if (tube) { stage.root.remove(tube); tube.geometry.dispose(); }
          const prof = [];
          for (let i = 0; i <= 60; i++) { const x = -8 + (24 * i) / 60; prof.push([xh + x, R0 * Math.sqrt(areaAt(x, R0, st.a))]); }
          tube = latheX(prof, M.ghost(COL.amber, 0.12), { seg: 40 }); tube.castShadow = false; tube.position.y = hub;
          stage.root.add(tube);
        }
        wind.step(dt, st.v * 0.35, (x, y, z) => {
          const dx = x - xh;
          const rr = Math.hypot(y - hub, z), A = areaAt(clamp(dx, -8, 16), R0, st.a);
          return rr < R0 * Math.sqrt(A) ? (1 - st.a) / A : 1;
        });
      },
      readout(st) {
        const Pw = windPower(st.v, st.D), A = Math.PI * (st.D / 2) ** 2, cp = cpOfA(st.a), m10 = 1.225 * A * st.v * 10;
        return `<div class="big">${fmtW(Pw)} in the wind</div>
          <p class="r-say">That is the power of the air crossing the rotor circle, before any turbine takes its share.</p>
          <div class="row"><span>Swept area</span><b>${A.toFixed(0)} m²</b></div>
          <div class="row"><span>Air in 10 s</span><b>${(m10 / 1000).toFixed(0)} tonnes</b></div>
          <div class="row"><span>Rotor takes (Cp ${(cp * 100).toFixed(1)} %)</span><b>${fmtW(Pw * cp)}</b></div>
          <div class="row"><span>Betz limit (59.3 %)</span><b>${fmtW(Pw * BETZ)}</b></div>
          <div class="row"><span>Wind behind the rotor</span><b>${((1 - 2 * st.a) * 100).toFixed(0)} % of free wind</b></div>
          <div class="row"><span>With twice the wind</span><b>${fmtW(Pw * 8)} (×8)</b></div>
          <p class="note">A real turbine also stops at its rated power, which chapter 4 shows.</p>`;
      },
    };
  },
};
