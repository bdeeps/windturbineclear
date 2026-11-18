// Chapter 2: the blade is a wing. At one station along the blade the air arrives as the vector sum of the wind
// (slowed to about 2/3 at the rotor, chapter 1) and the blade's own motion, omega*r. The angle between that
// relative wind and the chord is the angle of attack. Lift is perpendicular to the relative wind and drag is
// along it. The lift and drag curves are stylised: a straight rise of about 0.1 per degree, stall near 14 degrees.
import { THREE, M, COL, V3, bladeGeometry, airfoil, twistAt, chordAt, D2R, clamp, lerp, smooth } from '../turbine.js';
import { arrow } from '../kit.js';

const R = 7, S = 3.0, STALL = 14;
export function aero(a) {
  const pre = 0.1 * (clamp(a, -10, 40) + 2), cdPre = 0.011 + 0.0045 * pre * pre;
  const ar = a * D2R, post = 1.05 * Math.sin(2 * ar), cdPost = 1.3 * Math.sin(ar) ** 2 + 0.03;
  const w = smooth((a - STALL) / 6);
  return { cl: lerp(pre, post, w), cd: lerp(cdPre, cdPost, w) };
}

export default {
  id: 'blade',
  short: 'The blade is a wing',
  title: 'The blade is a wing',
  subtitle: 'Lift, not push, turns the rotor. The twist keeps every part at the right angle.',
  view: { pos: [4, 3, 21], target: [-1.5, 0, 3.5] },
  learn: `<p>A wind turbine blade is not a paddle that the wind pushes. It is a <b>wing</b>. The air hits it at a slant, and the curved shape makes <b>lift</b>, a force at right angles to the air flowing past. Tilted forward, that lift pulls the blade round. A little <b>drag</b> along the flow slows it.</p>
    <p>What the blade feels is the <b>relative wind</b>: the real wind plus the wind made by the blade’s own motion. Near the hub the blade moves slowly. At the tip it moves much faster: the <b>tip-speed ratio</b> is tip speed divided by wind speed, around 6 to 9 for big turbines, so a tip can travel at several times the wind speed, often 70 to 90 m/s.</p>
    <p>So the relative wind comes in at a different angle at each spot. That is why a blade is <b>twisted</b>: at the root the chord tilts a lot, at the tip hardly at all, so every slice meets the air at a good <b>angle of attack</b>, a few degrees. Too steep, and the flow separates from the top surface: it <b>stalls</b>. Too shallow, and there is no lift. The pitch system turns the whole blade to adjust this.</p>
    <p class="tip"><b>Try it:</b> lower <b>Tip-speed ratio</b> and watch the angle of attack grow until the flow breaks away. Then raise <b>Pitch</b> toward 90° to feather the blade and watch the lift vanish.</p>
    <p class="note">The lift and drag curves are simplified drawings. Real ones depend on the airfoil and on the Reynolds number. The section is enlarged and drag is drawn ten times too big so you can see it.</p>`,
  terms: [
    { t: 'Angle of attack', d: 'The angle between the relative wind and the chord line of the airfoil.' },
    { t: 'Tip-speed ratio', d: 'Blade tip speed divided by wind speed.' },
    { t: 'Stall', d: 'When the angle is too steep, the air separates from the top surface, lift drops and drag jumps.' },
    { t: 'Pitch', d: 'Turning the whole blade about its long axis. 90° is “feathered”: edge-on to the wind.' },
    { t: 'Twist', d: 'The change of blade angle along its length, so each slice meets the air well.' },
  ],
  defaults: { v: 10, lam: 7, st: 0.7, pitch: 0 },
  controls: [
    { key: 'v', type: 'range', label: 'Wind speed', min: 3, max: 25, step: 0.1, fmt: (v) => `${v.toFixed(1)} m/s` },
    { key: 'lam', type: 'range', label: 'Tip-speed ratio', min: 2, max: 12, step: 0.1, fmt: (v) => v.toFixed(1), hint: 'How fast the tip goes compared with the wind.' },
    { key: 'st', type: 'range', label: 'Where along the blade', min: 0.25, max: 0.98, step: 0.01, fmt: (v) => `${(v * 60).toFixed(0)} m from the hub (of 60 m)` },
    { key: 'pitch', type: 'range', label: 'Pitch', min: -5, max: 90, step: 0.5, fmt: (v) => `${v.toFixed(1)}°`, hint: '90° is feathered.' },
  ],
  quiz: [
    { q: 'What turns a wind turbine rotor?', options: ['The wind pushing flat blades', 'Lift on the blades, like a wing', 'Heat from the sun', 'The generator spinning it'], answer: 1, why: 'The blade is an airfoil. Lift, tilted forward, pulls it round.' },
    { q: 'Why is a blade twisted?', options: ['It looks nicer', 'The tip moves faster than the root, so the air arrives at a different angle along the blade', 'To make noise', 'To fit on a lorry'], answer: 1, why: 'Each slice moves at a different speed, so the chord must tilt differently to keep a good angle of attack.' },
    { q: 'What happens if the angle of attack gets too large?', options: ['Lift keeps rising forever', 'The flow separates and the blade stalls', 'The wind stops', 'Nothing'], answer: 1, why: 'Past about 12 to 15 degrees the flow breaks away from the top surface. Lift falls and drag jumps.' },
  ],
  reel: [
    { ms: 5400, caption: 'A blade is a wing. Lift, not push, turns it.', set: { v: 10, lam: 7, st: 0.7, pitch: 0 }, anim: { st: [0.4, 0.95] }, view: { pos: [2.5, 2, 13], target: [-0.5, 0, 4] }, spin: 0 },
    { ms: 5400, caption: 'Slow the rotor too much and the angle gets steep. The wing stalls.', set: { v: 10, lam: 9, st: 0.7, pitch: 0 }, anim: { lam: [9, 3] }, view: { pos: [2, 1.6, 12], target: [-0.3, 0, 4.5] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.setShift(0, document.body.classList.contains('gb-reel') ? 0 : -0.17);
    stage.floor.visible = false;
    // rig: blade-local (wind X, span Y, chord Z) -> scene (down, toward the camera, to the left)
    const rig = new THREE.Group(); rig.matrixAutoUpdate = false;
    rig.matrix.makeBasis(V3(0, -1, 0), V3(0, 0, 1), V3(-1, 0, 0)); rig.matrix.setPosition(-4.6, 0, 0);
    const pg = new THREE.Group(); rig.add(pg);
    const bm = new THREE.Mesh(bladeGeometry(R, { lamD: 7, aD: 7 }), M.plastic(0xdfe5ee, { roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    bm.castShadow = false; pg.add(bm); stage.root.add(rig);
    stage.label('Blade seen from the tip', [-4.6, 1.0, R + 0.3]);
    stage.label('Root', [-4.6, 0.8, 0.2]);
    const slabG = new THREE.Group(); stage.root.add(slabG);
    const link = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(-4.6, 0, 0), V3(-1.6, 0, 0)]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })); stage.root.add(link);
    let slab = null, key = '';
    const mk = (col, head = 0.16, r = 0.03) => { const a = arrow(col, 1, head, r); stage.root.add(a); return a; };
    const aWind = mk(COL.cyan), aBlade = mk(COL.amber), aRel = mk(0xffffff), aLift = mk(COL.lime, 0.2, 0.04), aDrag = mk(COL.coral, 0.12, 0.035), aFwd = mk(COL.amber, 0.14, 0.03), aThr = mk(COL.coral, 0.14, 0.03);
    const put = (a, o, vx, vy) => { const L = Math.hypot(vx, vy); if (L < 1e-4) { a.set(0); return; } a.position.copy(o); a.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(vx / L, vy / L, 0)); a.set(L); };
    const L = { wind: stage.label('Wind at the rotor', [0, 0, 0], stage.root, 'hot'), blade: stage.label('Blade moves this way', [0, 0, 0]), rel: stage.label('Relative wind', [0, 0, 0]), lift: stage.label('Lift', [0, 0, 0], stage.root, 'hot'), drag: stage.label('Drag ×10', [0, 0, 0]), stall: stage.label('Stalled: flow separates', [0, 0, 0], stage.root, 'hot') };
    const dots = Array.from({ length: 10 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M.glow(0xffffff)); stage.root.add(m); return m; });
    let phase = 0;
    const calc = (st) => {
      const vax = (2 / 3) * st.v, u = st.lam * st.v * st.st, phi = Math.atan2(vax, u) / D2R;
      const beta = twistAt(st.st, 7, 7), alpha = phi - beta - st.pitch, ae = aero(alpha);
      return { vax, u, phi, beta, alpha, W: Math.hypot(vax, u), ...ae };
    };
    return {
      update(dt, st, time) {
        const c = calc(st), zs = st.st * R;
        pg.rotation.y = -st.pitch * D2R; rig.updateMatrixWorld(true);
        const B = (c.beta + st.pitch) * D2R, d = [Math.cos(B), -Math.sin(B)], n = [-Math.sin(B), -Math.cos(B)];
        const k = `${st.st.toFixed(3)}|${st.pitch.toFixed(1)}`;
        if (k !== key) {
          key = k;
          if (slab) { slabG.remove(slab); slab.geometry.dispose(); }
          const pts = airfoil(0.16, 0.04).map(([x, y]) => new THREE.Vector2((x - 0.3) * S * d[0] + y * S * n[0], (x - 0.3) * S * d[1] + y * S * n[1]));
          slab = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.3, bevelEnabled: false }), M.plastic(COL.white, { roughness: 0.3, emissive: 0x334455, emissiveIntensity: 0.4 }));
          slab.position.z = -0.15; slabG.add(slab);
        }
        slabG.position.set(0, 0, zs);
        link.geometry.setFromPoints([V3(-4.6, 0, zs), V3(-1.2, 0, zs)]);
        const O = V3(0, 0, zs), kk = 0.06, LE = V3(-0.3 * S * d[0], -0.3 * S * d[1], zs);
        const wx = c.u * kk, wy = -c.vax * kk, Wl = Math.hypot(wx, wy) || 1;
        put(aWind, V3(2.3, 2.2, zs), 0, -Math.max(0.15, c.vax * kk * 2.2));
        put(aBlade, V3(2.4, 1.7, zs), -Math.max(0.2, c.u * kk), 0);
        put(aRel, V3(LE.x - wx * 1.0, LE.y - wy * 1.0, zs), wx, wy);
        const ux = wx / Wl, uy = wy / Wl, lx = -uy * -1, ly = ux; // unit relative wind, lift = rotate to (-sin, -cos) form
        const Lx = -Math.abs(uy), Ly = -Math.abs(ux), q = 1.3;
        const ld = [Lx, Ly], sgn = c.cl >= 0 ? 1 : -1;
        put(aLift, O, ld[0] * sgn * Math.abs(c.cl) * q, ld[1] * sgn * Math.abs(c.cl) * q);
        put(aDrag, LE.clone().lerp(O, 1.6), ux * c.cd * q * 10, uy * c.cd * q * 10);
        const ph = c.phi * D2R, ft = c.cl * Math.sin(ph) - c.cd * Math.cos(ph), th = c.cl * Math.cos(ph) + c.cd * Math.sin(ph);
        put(aFwd, V3(0.9, 1.0, zs), -ft * q, 0);
        put(aThr, V3(1.5, -1.2, zs), 0, -Math.max(0, th) * q);
        L.wind.position.set(2.3, 2.5, zs); L.blade.position.set(2.4, 2.0, zs);
        L.rel.position.set(LE.x - wx * 0.9, LE.y - wy * 0.9 + 0.3, zs);
        L.lift.position.set(O.x + ld[0] * Math.abs(c.cl) * q, O.y + ld[1] * Math.abs(c.cl) * q - 0.3, zs);
        L.drag.position.set(LE.x + ux * 1.2, LE.y + uy * 1.2 + 0.5, zs);
        L.lift.element.style.opacity = Math.abs(c.cl) > 0.05 ? 1 : 0.35;
        const stalled = c.alpha > STALL;
        L.stall.element.hidden = !stalled; L.stall.position.set(0.8, -1.7, zs);
        phase += dt * 20;
        dots.forEach((m, i) => { m.visible = stalled; if (!stalled) return; const a = i / 10; m.position.set(S * (0.1 + 0.8 * a) * d[0] + n[0] * (0.35 + 0.25 * Math.sin(phase + i * 2)) - 0.3 * S * d[0] * 0.8, S * (0.1 + 0.8 * a) * d[1] + n[1] * (0.35 + 0.25 * Math.sin(phase + i * 2)) - 0.3 * S * d[1] * 0.8, zs + 0.3 * Math.cos(phase * 1.3 + i)); });
      },
      readout(st) {
        const c = calc(st), state = c.alpha > STALL ? 'Stalled: the flow has separated, lift falls and drag jumps.' : c.alpha < 0 ? 'Negative angle: the blade makes little or backward lift.' : st.pitch > 60 ? 'Feathered: edge-on to the wind, almost no force.' : 'Attached flow: lift is large and drag is small.';
        return `<div class="big">Angle of attack ${c.alpha.toFixed(1)}°</div><p class="r-say">${state}</p>
          <div class="row"><span>Relative wind</span><b>${c.W.toFixed(0)} m/s · ${(c.W * 3.6).toFixed(0)} km/h</b></div>
          <div class="row"><span>Blade speed here</span><b>${c.u.toFixed(0)} m/s</b></div>
          <div class="row"><span>Flow angle · blade angle</span><b>${c.phi.toFixed(1)}° · ${(c.beta + st.pitch).toFixed(1)}°</b></div>
          <div class="row"><span>Lift · drag coefficient</span><b>${c.cl.toFixed(2)} · ${c.cd.toFixed(3)}</b></div>
          <div class="row"><span>Lift ÷ drag</span><b>${c.cd > 0 ? (c.cl / c.cd).toFixed(0) : '–'}</b></div>
          <div class="row"><span>Tip speed at this wind</span><b>${(st.lam * st.v).toFixed(0)} m/s · ${(st.lam * st.v * 3.6).toFixed(0)} km/h</b></div>`;
      },
    };
  },
};
