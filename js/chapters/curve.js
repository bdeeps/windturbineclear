// Chapter 4: the power curve of a generic 3.6 MW turbine with a 120 m rotor. Cut-in about 3 m/s (real machines:
// roughly 3-4), rated about 12 m/s (roughly 11-13), cut-out 25 m/s (about 25). Between cut-in and rated the
// blades are fully in the wind and the turbine tracks about 45 % of the wind's power, falling a little near rated.
// Above rated the blades pitch to spill extra wind and hold the power flat. In a storm they feather and stop.
import { THREE, M, COL, makeTurbine, makeWind, windPower, curveP, pitchOf, rpmOf, cpEff, TURB, fmtW, FONT } from '../turbine.js';
import { canvasTexture } from '../kit.js';

const F = (w, px) => FONT(w, Math.round(px * 1.3));
const W = 1400, H = 900, X0 = 120, X1 = 1330, YB = 790, YT = 120, VMAX = 30, PMAX = 4.2;
const X = (v) => X0 + (v / VMAX) * (X1 - X0), Y = (mw) => YB - (mw / PMAX) * (YB - YT);

export default {
  id: 'curve',
  short: 'The power curve',
  title: 'The power curve',
  subtitle: 'Cut-in, rated power, cut-out: what a turbine does at each wind speed.',
  view: { pos: [-1.5, 4, 17], target: [-1.5, 3.2, 0] },
  learn: `<p>A turbine’s <b>power curve</b> shows its output at each wind speed. It has four zones. Below the <b>cut-in</b> speed, about 3 to 4 m/s, there is too little energy and the turbine idles. From cut-in up to the <b>rated</b> speed, about 11 to 13 m/s, output climbs steeply, close to the cube law from chapter 1.</p>
    <p>Above rated speed the generator and gears can take no more. The pitch system <b>turns the blades</b> a little out of the wind, spilling the extra, and the output stays flat at <b>rated power</b>. At about <b>25 m/s</b>, the <b>cut-out</b> speed, the blades <b>feather</b> edge-on, the rotor slows and the turbine parks to protect itself.</p>
    <p>The dashed line shows what the wind could give at 45 %. Above rated, a turbine deliberately lets most of it go. Because the curve is so steep in the middle, a site’s average wind speed hides a lot: a few windy hours make most of the energy.</p>
    <p class="tip"><b>Try it:</b> sweep <b>Wind speed</b> from 0 to 30 m/s. Watch the dot, the rotor speed and the blade pitch at each zone.</p>
    <p class="note">This is a generic 3.6 MW machine with a 120 m rotor. Real cut-in, rated and cut-out speeds differ by model and are usually given as ranges.</p>`,
  terms: [
    { t: 'Cut-in speed', d: 'The lowest wind speed at which the turbine starts making power, around 3–4 m/s.' },
    { t: 'Rated power', d: 'The most the generator is designed to deliver, reached at the rated wind speed, around 11–13 m/s.' },
    { t: 'Cut-out speed', d: 'The wind speed, around 25 m/s, above which the turbine shuts down to protect itself.' },
    { t: 'Feathering', d: 'Turning the blades edge-on to the wind so they make almost no force.' },
  ],
  defaults: { v: 7 },
  controls: [
    { key: 'v', type: 'range', label: 'Wind speed', min: 0, max: 30, step: 0.1, fmt: (v) => `${v.toFixed(1)} m/s · ${(v * 3.6).toFixed(0)} km/h` },
    { key: 'btn', type: 'buttons', label: 'Jump to', items: [{ label: 'Cut-in', act: (s) => { s.v = 3.2; } }, { label: 'Rated', act: (s) => { s.v = 12; } }, { label: 'Storm', act: (s) => { s.v = 27; } }] },
  ],
  quiz: [
    { q: 'Above rated wind speed, what does the turbine do?', options: ['Makes more power', 'Pitches the blades to hold power at its rated value', 'Stops at once', 'Turns round'], answer: 1, why: 'Extra wind would overload the machine, so the blades pitch to spill it.' },
    { q: 'Why does a turbine cut out at around 25 m/s?', options: ['Too little wind', 'To protect itself from loads in storms', 'The grid asks it to', 'The sun sets'], answer: 1, why: 'At very high winds the blades feather and the rotor parks so that loads stay safe.' },
    { q: 'Between cut-in and rated speed, power rises roughly with…', options: ['The wind speed', 'The square of speed', 'The cube of speed', 'It stays flat'], answer: 2, why: 'The wind’s power goes with v³, and the rotor tracks it until rated.' },
  ],
  reel: [
    { ms: 6400, caption: 'Power climbs with the cube of the wind, levels at rated power, and a storm stops it.', set: { v: 2 }, anim: { v: [2, 29] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.setShift(0, document.body.classList.contains('gb-reel') ? 0 : -0.17);
    stage.floor.visible = false;
    const T = makeTurbine({ R: 2.6 }); T.group.position.set(-9.6, 0, 0); stage.root.add(T.group);
    const wind = makeWind(90, { x0: -14, x1: -6.5, y0: 0.4, y1: 8, z: 3, seed: 8 }); stage.root.add(wind);
    stage.label('Blade pitch', [-9.6 + T.xh, T.hubY + 3.3, 0], stage.root, 'hot');
    let key = '';
    const chart = canvasTexture(W, H, () => {});
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(12.6, 12.6 * H / W), new THREE.MeshBasicMaterial({ map: chart.tex, transparent: true, toneMapped: false }));
    plane.position.set(1.4, 3.9, 0); stage.root.add(plane);
    const draw = (v) => {
      const g = chart.canvas.getContext('2d');
      g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(13,15,22,.92)'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
      const zones = [[0, 3, 'rgba(255,255,255,.03)', 'Idle'], [3, 12, 'rgba(142,240,255,.08)', 'Blades in the wind'], [12, 25, 'rgba(163,230,53,.08)', 'Pitching: rated'], [25, 30, 'rgba(255,107,107,.10)', 'Storm stop']];
      zones.forEach(([a, b, c, t]) => { g.fillStyle = c; g.fillRect(X(a), YT, X(b) - X(a), YB - YT); g.fillStyle = '#a8aebf'; g.font = F(500, 28); g.save(); g.translate((X(a) + X(b)) / 2 + 9, YT + 20); if (b - a > 6) g.fillText(t, -g.measureText(t).width / 2, 14); else { g.rotate(Math.PI / 2); g.fillText(t, 0, 0); } g.restore(); });
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; g.fillStyle = '#737a8e'; g.font = F(400, 28);
      for (let m = 0; m <= 4; m++) { g.beginPath(); g.moveTo(X0, Y(m)); g.lineTo(X1, Y(m)); g.stroke(); g.fillText(String(m), 70, Y(m) + 10); }
      for (let w = 0; w <= 30; w += 5) { g.fillText(String(w), X(w) - 12, YB + 42); }
      g.fillStyle = '#a8aebf'; g.font = F(500, 30); g.fillText('Power (MW)', 20, 70); g.fillText('Wind speed (m/s)', X1 - 290, YB + 86);
      // the wind at 45 %
      g.setLineDash([12, 10]); g.strokeStyle = 'rgba(255,181,71,.7)'; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 200; i++) { const vv = (i / 200) * 18, p = Math.min(PMAX, (windPower(vv, TURB.D) * 0.45) / 1e6); i ? g.lineTo(X(vv), Y(p)) : g.moveTo(X(vv), Y(p)); } g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ffb547'; g.font = F(500, 26); g.fillText('wind at 45 %', X(3.4), Y(3.1));
      // the turbine
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 6; g.beginPath(); g.moveTo(X(0), YB); g.lineTo(X(TURB.vin), YB);
      for (let i = 0; i <= 200; i++) { const vv = TURB.vin + (i / 200) * (TURB.vout - TURB.vin); g.lineTo(X(vv), Y(curveP(vv) / 1e6)); }
      g.lineTo(X(TURB.vout), YB); g.lineTo(X(30), YB); g.stroke();
      // marks
      g.font = F(500, 26);
      [[TURB.vin, 'cut-in ≈ 3–4', '#8ef0ff'], [TURB.vr, 'rated ≈ 11–13', '#a3e635'], [TURB.vout, 'cut-out ≈ 25', '#ff6b6b']].forEach(([vv, t, c]) => { g.strokeStyle = c; g.setLineDash([6, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(vv), YB); g.lineTo(X(vv), YT + 60); g.stroke(); g.setLineDash([]); g.fillStyle = c; g.fillText(t, X(vv) - (vv < 5 ? 10 : 80), YB - 14 - (vv === TURB.vin ? 0 : 0)); });
      g.fillStyle = '#a3e635'; g.fillText('3.6 MW rated power', X(15), Y(3.6) + 40);
      const p = curveP(v) / 1e6, x = X(v), y = Y(p);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 17, 0, 7); g.fill(); g.fillStyle = '#ffb547'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
      chart.tex.needsUpdate = true;
    };
    return {
      update(dt, st) {
        const v = st.v, rpm = rpmOf(v);
        T.rotor.rotation.x += ((rpm * 2 * Math.PI) / 60) * 1.4 * dt; T.setPitch(pitchOf(v));
        wind.step(dt, v * 0.3);
        const k = v.toFixed(2); if (k !== key) { key = k; draw(v); }
      },
      readout(st) {
        const v = st.v, p = curveP(v), zone = v < TURB.vin ? 'Too little wind: the turbine idles.' : v < TURB.vr ? 'Blades fully in the wind: power rises steeply.' : v <= TURB.vout ? 'Rated power: blades pitch to spill the extra wind.' : 'Storm: blades feathered, turbine parked.';
        const frac = (p / windPower(Math.max(v, 0.1), TURB.D)) || 0;
        return `<div class="big">${fmtW(p)}</div><p class="r-say">${zone}</p>
          <div class="row"><span>Rotor speed</span><b>${rpmOf(v).toFixed(1)} rpm</b></div>
          <div class="row"><span>Blade pitch</span><b>${pitchOf(v).toFixed(0)}°${v > TURB.vout ? ' (feathered)' : ''}</b></div>
          <div class="row"><span>Wind’s power through the rotor</span><b>${fmtW(windPower(v, TURB.D))}</b></div>
          <div class="row"><span>Share captured</span><b>${(frac * 100).toFixed(0)} %</b></div>
          <div class="row"><span>Share of rated power</span><b>${((p / TURB.P) * 100).toFixed(0)} %</b></div>`;
      },
    };
  },
};
