// Chapter 3: inside the nacelle. A big turbine's rotor turns slowly (about 5-15 rpm). A gearbox of roughly 1:100 lifts
// that to the 1000-1800 rpm a conventional generator wants, or a direct-drive turbine skips the gearbox and uses a
// wide generator with many poles. The generator is stylised: magnets on the rotor sweep past coils on the stator,
// the changing magnetic field pushes current round each coil (Faraday), and three sets of coils give three phases.
// Electrical frequency f = pole pairs x rpm / 60.
import { THREE, M, COL, box, rod, sphere, latheX, clamp, lerp, rpmOf, TURB, fmtW, curveP } from '../turbine.js';
import { canvasTexture, exploder } from '../kit.js';

const PARTS = {
  all: { n: 'Whole nacelle', d: 'Everything between the blades and the tower sits in a housing the size of a bus. Click a part below to light it up.' },
  pitch: { n: 'Pitch system', d: 'Motors in the hub turn each blade about its own axis. That sets how much wind the blade catches, and turning them edge-on is the main brake.' },
  shaft: { n: 'Low-speed shaft', d: 'Carries the rotor’s turning force into the nacelle at rotor speed, supported by a big main bearing. Slow but enormously strong.' },
  gear: { n: 'Gearbox', d: 'Steps the slow turning up by about a hundred times. Some turbines leave it out (direct drive) and use a wide generator instead.' },
  brake: { n: 'Brake', d: 'A disc and caliper on the fast shaft. It parks the rotor and holds it for service. Everyday stopping is done by feathering the blades.' },
  gen: { n: 'Generator', d: 'Turns rotation into electricity. Magnets passing coils make a changing field, and that drives current round the coils.' },
  xfmr: { n: 'Transformer', d: 'Raises the voltage from the generator’s few hundred volts to a medium voltage for the cables. It sits in the nacelle or at the foot of the tower.' },
  yaw: { n: 'Yaw drive', d: 'Electric motors and a big toothed bearing turn the whole nacelle to face the wind, steered by the wind vane on the roof.' },
};
const Y = { x: new THREE.Vector3(1, 0, 0) };
const VIEWS = { nacelle: { pos: [-3, 5, 20], target: [1, -0.4, 0] }, gen: { pos: [20, 0.5, 8], target: [10.5, -2.6, 0] } };
let ST = null;

export default {
  id: 'nacelle',
  short: 'Inside the nacelle',
  title: 'Inside the nacelle',
  subtitle: 'Slow shaft, gearbox, generator: how turning becomes electricity.',
  view: VIEWS.nacelle,
  learn: `<p>The <b>nacelle</b> is the housing on top of the tower. The rotor turns its <b>low-speed shaft</b> at only about 5 to 15 turns a minute. A <b>gearbox</b> raises that roughly a hundredfold, to the 1,000 to 1,800 rpm a standard generator likes. A brake disc on the fast shaft parks the rotor. A <b>pitch system</b> in the hub turns the blades, a <b>yaw drive</b> turns the whole nacelle into the wind, and a <b>transformer</b> raises the voltage for the cables.</p>
    <p>The <b>generator</b> works by induction. Magnets on a spinning rotor sweep past coils of wire. The changing magnetic field pushes current around each coil. With three sets of coils spaced evenly, the three outputs peak one after another: <b>three-phase</b> power. Faster spinning gives a higher voltage and a higher frequency: <b>frequency = pole pairs × rpm ÷ 60</b>.</p>
    <p>Many turbines use <b>induction</b> generators (often “doubly-fed”). Others use <b>synchronous</b> ones with permanent magnets. <b>Direct-drive</b> turbines have no gearbox: the generator is very wide with many poles, and a converter turns its variable output into steady grid frequency.</p>
    <p class="tip"><b>Try it:</b> open the <b>Cutaway</b>, press <b>Explode</b>, pick each part, then switch <b>Look at</b> to the generator close-up and change the wind.</p>
    <p class="note">The generator is a stylised drawing: far fewer poles than a real one, and slowed down so you can see it.</p>`,
  terms: [
    { t: 'Nacelle', d: 'The housing at the top of the tower that holds the drivetrain and controls.' },
    { t: 'Yaw', d: 'Turning the nacelle about the tower so the rotor faces the wind.' },
    { t: 'Induction', d: 'A changing magnetic field makes a voltage in a coil of wire (Faraday’s law).' },
    { t: 'Direct drive', d: 'A turbine with no gearbox: the rotor turns a large, many-poled generator directly.' },
    { t: 'Three-phase', d: 'Three alternating currents, one third of a cycle apart, which carry power smoothly.' },
  ],
  defaults: { v: 9, cut: 0.8, ex: 0, part: 'all', drive: 'geared', focus: 'nacelle' },
  controls: [
    { key: 'v', type: 'range', label: 'Wind speed', min: 3, max: 14, step: 0.1, fmt: (v) => `${v.toFixed(1)} m/s` },
    { key: 'cut', type: 'range', label: 'Cutaway', min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.15 ? 'closed' : v > 0.85 ? 'see-through' : 'fading') },
    { key: 'ex', type: 'range', label: 'Explode', min: 0, max: 1, step: 0.01, fmt: (v) => `${(v * 100).toFixed(0)}%` },
    { key: 'part', type: 'seg', label: 'Light up a part', options: Object.entries(PARTS).map(([v, p]) => ({ v, label: p.n })) },
    { key: 'drive', type: 'seg', label: 'Drivetrain', options: [{ v: 'geared', label: 'Gearbox' }, { v: 'direct', label: 'Direct drive' }] },
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'nacelle', label: 'Nacelle' }, { v: 'gen', label: 'Generator close-up' }] },
  ],
  onChange(s, key) { if (key === 'focus' && ST) ST.setView(VIEWS[s.focus].pos, VIEWS[s.focus].target, 1.1); },
  quiz: [
    { q: 'Why does a geared turbine need a gearbox?', options: ['The rotor turns far slower than a generator wants', 'To make the blades longer', 'To slow the wind', 'To store power'], answer: 0, why: 'The rotor turns at about 5 to 15 rpm; a standard generator wants 1,000 to 1,800 rpm.' },
    { q: 'How does a generator make electricity?', options: ['Burning fuel inside', 'Magnets moving past coils make a changing field that drives current', 'Static from the blades', 'Heat from friction'], answer: 1, why: 'Faraday’s law: a changing magnetic field through a coil induces a voltage.' },
    { q: 'What does the yaw drive do?', options: ['Turns the blades', 'Turns the nacelle to face the wind', 'Cools the generator', 'Brakes the shaft'], answer: 1, why: 'The pitch system turns the blades. The yaw drive turns the whole nacelle on the tower.' },
  ],
  reel: [
    { ms: 5400, caption: 'Inside the nacelle, a slow shaft meets a gearbox that speeds it up a hundredfold.', set: { v: 9, cut: 1, ex: 0, part: 'all', drive: 'geared', focus: 'nacelle' }, anim: { ex: [0, 0.8] }, view: { pos: [-3, 5, 20], target: [1, -0.4, 0] }, spin: 0 },
    { ms: 5400, caption: 'Magnets sweep past coils. The changing field pushes current: three-phase power.', set: { v: 10, focus: 'gen', drive: 'geared', ex: 0 }, view: { pos: [20, 0.5, 8], target: [10.5, -2.6, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.setShift(0, document.body.classList.contains('gb-reel') ? 0 : -0.17);
    ST = stage; stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const white = M.plastic(0xe9edf3), grey = M.metal(0x9aa3b2), dark = M.metal(0x5a6272), hl = (c) => M.plastic(c, { roughness: 0.4, emissive: c, emissiveIntensity: 0.05 });
    const grp = {}, mats = {};
    const part = (id, list) => { const g = new THREE.Group(); list.forEach((o) => g.add(o)); root.add(g); grp[id] = g; mats[id] = []; g.traverse((o) => { if (o.material?.emissive) mats[id].push(o.material); }); return g; };
    // shell
    const shellMat = M.ghost(0xcfe3ff, 0.4);
    const shell = box(8.2, 2.3, 2.5, shellMat); shell.position.set(1.5, 0, 0); shell.castShadow = false; root.add(shell);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry), new THREE.LineBasicMaterial({ color: 0xcfe3ff, transparent: true, opacity: 0.6 })); edges.position.copy(shell.position); root.add(edges);
    // rotor and pitch
    const hubG = new THREE.Group(); hubG.position.x = -3.3;
    const spin = latheX([[-1.3, 0], [-1.0, 0.55], [-0.4, 0.95], [0.4, 0.95]], M.ghost(0xcfe3ff, 0.25)); spin.castShadow = false;
    const hubC = hl(0xc9ced8); const hub = sphere(0.55, hubC, 20); hubG.add(spin, hub);
    for (let k = 0; k < 3; k++) {
      const h = new THREE.Group(); h.rotation.x = (k * 2 * Math.PI) / 3;
      const root_ = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.5, 20), hl(0xf1f3f7)); root_.position.y = 1.05;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 10, 24), hl(COL.cyan)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.72;
      const motor = box(0.3, 0.3, 0.3, hl(COL.cyan)); motor.position.set(0.4, 0.6, 0);
      h.add(root_, ring, motor); hubG.add(h);
    }
    part('pitch', [hubG]);
    // low-speed shaft + main bearing
    const lss = rod(-2.7, -0.3, 0.22, 0.22, hl(0xb9bec8)); const stripe = box(0.5, 0.06, 0.06, hl(COL.amber)); stripe.position.set(-2.0, 0.22, 0);
    const bearing = rod(-1.7, -1.1, 0.5, 0.5, hl(0x6f7788)); part('shaft', [lss, stripe, bearing]);
    // gearbox
    const gb = box(1.9, 1.35, 1.25, hl(0x7b8aa6)); gb.position.set(0.6, 0, 0);
    const gbs = rod(0.9, 1.1, 0.28, 0.28, hl(0xb9bec8)); gbs.position.set(0.2, 0.85, 0);
    part('gear', [gb, gbs]);
    // fast shaft + brake
    const hss = rod(1.55, 2.5, 0.1, 0.1, hl(0xb9bec8)); const mark = box(0.15, 0.04, 0.04, hl(COL.amber)); mark.position.set(2.0, 0.1, 0);
    const disc = rod(1.85, 1.92, 0.5, 0.5, hl(0xd8dde6)); const cal = box(0.3, 0.3, 0.35, hl(COL.coral)); cal.position.set(1.88, 0.55, 0);
    part('brake', [hss, mark, disc, cal]);
    // generator
    const gen = rod(2.5, 4.4, 0.7, 0.7, hl(0x4d7cff)); const fins = [];
    for (let i = 0; i < 6; i++) { const f = rod(2.8 + i * 0.28, 2.88 + i * 0.28, 0.74, 0.74, hl(0x3a63d6)); fins.push(f); }
    part('gen', [gen, ...fins]);
    // transformer
    const tx = box(1.4, 1.4, 1.2, hl(0x44d19a)); tx.position.set(5.2, -0.1, 0); const cool = box(0.15, 1.1, 1.0, hl(0x2fa874)); cool.position.set(5.99, -0.1, 0);
    part('xfmr', [tx, cool]);
    // yaw drive + tower
    const yring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.12, 12, 40), hl(COL.violet)); yring.rotation.x = Math.PI / 2; yring.position.set(1.1, -1.25, 0);
    const ym = []; for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.55, 12), hl(COL.violet)); m.position.set(1.1 + Math.cos(a) * 0.75, -0.95, Math.sin(a) * 0.75); ym.push(m); }
    part('yaw', [yring, ...ym]);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 3.6, 28), M.plastic(0xc9ced8)); tower.position.set(1.1, -3.1, 0); root.add(tower);
    // roof sensors
    const sens = new THREE.Group(); sens.position.set(4.8, 1.15, 0.3);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), grey); mast.position.y = 0.25; sens.add(mast);
    const cups = new THREE.Group(); cups.position.y = 0.55; for (let k = 0; k < 3; k++) { const c = sphere(0.07, M.plastic(COL.coral), 8); const a = (k * 2 * Math.PI) / 3; c.position.set(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2); cups.add(c); } sens.add(cups); root.add(sens);
    stage.label('Wind sensors', [4.8, 2.0, 0.3], root);
    const lbls = [['Hub and pitch motors', [-3.3, 1.7, 0]], ['Low-speed shaft', [-1.7, -1.0, 0.9]], ['Gearbox', [0.6, 1.2, 0]], ['Brake', [1.9, 1.1, 0.5]], ['Generator', [3.5, 1.2, 0]], ['Transformer', [5.2, 1.0, 0]], ['Yaw drive', [1.1, -2.2, 1.4]]];
    lbls.forEach(([t, p]) => stage.label(t, p, root));
    // explode
    const ex = exploder([{ obj: grp.pitch, off: [-1.6, 0, 0] }, { obj: grp.shaft, off: [-0.8, 1.3, 0] }, { obj: grp.gear, off: [0, 2.2, 0] }, { obj: grp.brake, off: [0, 3.0, 0] }, { obj: grp.gen, off: [1.0, 1.6, 0] }, { obj: grp.xfmr, off: [1.8, 0.6, 0] }, { obj: grp.yaw, off: [0, -1.8, 0] }]);
    // --- generator close-up
    const GX = 10.5, genRoot = new THREE.Group(); genRoot.position.set(GX, -0.9, 0); root.add(genRoot);
    const stator = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.14, 10, 60), M.metal(0x7b8aa6)); stator.rotation.y = Math.PI / 2; genRoot.add(stator);
    const back = rod(-0.5, 0.5, 2.0, 2.0, M.ghost(0x7b8aa6, 0.08), 48, true); genRoot.add(back);
    const sc = canvasTexture(900, 450, () => {}); const scope = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.3), new THREE.MeshBasicMaterial({ map: sc.tex, transparent: true, toneMapped: false }));
    scope.position.set(0, -4.1, 0); scope.rotation.y = Math.PI / 2; genRoot.add(scope);
    stage.label('Stator coils', [0, 2.35, 0], genRoot); stage.label('Rotor magnets (N and S)', [0, -1.45, 0], genRoot); stage.label('Voltage from each phase', [0, -5.5, 0], genRoot, 'hot');
    let rotorG = null, coilMats = [], coilsG = null, curP = 0, gKey = '', ang = 0, tr = [[], [], []];
    const PC = [COL.coral, COL.amber, COL.cyan];
    const buildGen = (P) => {
      if (rotorG) { genRoot.remove(rotorG); genRoot.remove(coilsG); }
      rotorG = new THREE.Group(); coilsG = new THREE.Group(); coilMats = [];
      rotorG.add(rod(-0.4, 0.4, 1.0, 1.0, M.metal(0x59627a)));
      for (let k = 0; k < 2 * P; k++) { const g = new THREE.Group(); g.rotation.x = (k / (2 * P)) * Math.PI * 2; const m = box(0.8, 0.4, Math.min(0.9, 6.28 * 1.15 / (2 * P) * 0.8), M.plastic(k % 2 ? 0x5b8cff : COL.coral, { roughness: 0.4 })); m.position.y = 1.2; g.add(m); rotorG.add(g); }
      const nC = 6 * P;
      for (let k = 0; k < nC; k++) {
        const g = new THREE.Group(); g.rotation.x = (k / nC) * Math.PI * 2; const mat = M.plastic(PC[k % 3], { roughness: 0.5, emissive: PC[k % 3], emissiveIntensity: 0.1 });
        const c = box(0.8, 0.45, Math.min(0.5, 6.28 * 1.75 / nC * 0.8), mat); c.position.y = 1.65; g.add(c); coilsG.add(g); coilMats.push(mat);
      }
      genRoot.add(rotorG, coilsG); curP = P;
    };
    buildGen(2);
    const drawScope = () => {
      const w = 900, h = 450; sc.redraw = sc.redraw;
    };
    let scopeT = 0;
    const scopeDraw = (g, W, H) => {
      g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(13,15,22,.9)'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      [COL.coral, COL.amber, COL.cyan].forEach((c, p) => { g.strokeStyle = '#' + c.toString(16).padStart(6, '0'); g.lineWidth = 4; g.beginPath(); tr[p].forEach((y, i) => { const x = (i / 199) * W; i ? g.lineTo(x, H / 2 - y * H * 0.4) : g.moveTo(x, H / 2 - y * H * 0.4); }); g.stroke(); });
      g.fillStyle = '#a8aebf'; g.font = '500 26px Geist, system-ui, sans-serif'; g.fillText('three phases, a third of a cycle apart', 20, 36);
    };
    const realRpm = (st) => rpmOf(clamp(st.v, 3, 25));
    return {
      update(dt, st, time) {
        const rpm = realRpm(st), w = (rpm * 2 * Math.PI) / 60;
        hubG.rotation.x += w * dt;
        const gearRatio = st.drive === 'geared' ? 6 : 1;
        lss.rotation.x += w * dt; stripe.position.y = 0.22 * Math.cos(hubG.rotation.x); stripe.position.z = 0.22 * Math.sin(hubG.rotation.x);
        const wh = w * gearRatio * (st.drive === 'geared' ? 1 : 0);
        hss.rotation.x += wh * dt; disc.rotation.x += wh * dt; mark.position.y = 0.1 * Math.cos(time * w * 6); mark.position.z = 0.1 * Math.sin(time * w * 6);
        cups.rotation.y += (0.5 + st.v * 0.4) * dt;
        const k = clamp(st.cut, 0, 1);
        shellMat.opacity = lerp(0.5, 0.03, k); edges.material.opacity = lerp(0.7, 0.25, k);
        ex(st.ex);
        grp.gear.visible = st.drive === 'geared'; grp.brake.visible = true;
        lbls.forEach(() => {});
        // highlight
        for (const id of Object.keys(mats)) {
          const on = st.part === id; mats[id].forEach((m) => { m.emissiveIntensity = on ? 0.75 : 0.05; if (on) m.emissive.setHex(0xffb547); });
        }
        // generator close-up
        const P = st.drive === 'geared' ? 2 : 10;
        if (P !== curP) buildGen(P);
        ang += (0.5 + (rpm / 13) * 3.5) * dt;
        rotorG.rotation.x = ang / P * 2;
        const phase = ang * 2;
        for (let i = 0; i < coilMats.length; i++) { const p = i % 3, vv = Math.sin(phase - (p * 2 * Math.PI) / 3); coilMats[i].emissiveIntensity = 0.1 + 0.9 * Math.abs(vv); }
        scopeT += dt;
        if (scopeT > 0.02) { scopeT = 0; for (let p = 0; p < 3; p++) { tr[p] = Array.from({ length: 200 }, (_, i) => Math.sin(phase - i * 0.07 * (st.drive === 'geared' ? 1 : 0.9) - (p * 2 * Math.PI) / 3)); } sc.redraw = null; scopeDraw(sc.canvas.getContext('2d'), 900, 450); sc.tex.needsUpdate = true; }
      },
      readout(st) {
        const p = PARTS[st.part], rpm = realRpm(st), gen = rpm * 100;
        const extra = st.drive === 'geared'
          ? `<div class="row"><span>Rotor speed</span><b>${rpm.toFixed(1)} rpm</b></div><div class="row"><span>Generator speed (÷ about 1:100)</span><b>${gen.toFixed(0)} rpm</b></div><div class="row"><span>Frequency, 2 pole pairs</span><b>${((2 * gen) / 60).toFixed(0)} Hz</b></div>`
          : `<div class="row"><span>Rotor and generator speed</span><b>${rpm.toFixed(1)} rpm</b></div><div class="row"><span>Pole pairs for 50 Hz directly</span><b>${((50 * 60) / rpm).toFixed(0)}</b></div><p class="note">So direct-drive machines use many poles and a converter that sets the grid frequency.</p>`;
        return `<div class="big">${p.n}</div><p class="r-say">${p.d}</p>${extra}`;
      },
    };
  },
};
