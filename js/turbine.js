// Shared parts for WindTurbineClear: physics helpers, an airfoil blade with twist, a whole turbine, and wind streaks.
import { THREE, M, latheX, rod, box, sphere, clamp, lerp, smooth, swarm } from './kit.js';

export { THREE, M, latheX, rod, box, sphere, clamp, lerp, smooth, swarm };
export const COL = { cyan: 0x8ef0ff, amber: 0xffb547, coral: 0xff7a59, lime: 0xa3e635, violet: 0xc49bff, white: 0xf1f3f7 };
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const RHO = 1.225;
export const BETZ = 16 / 27;
export const D2R = Math.PI / 180;

export const windPower = (v, D) => 0.5 * RHO * Math.PI * (D / 2) ** 2 * v ** 3;
export const cpOfA = (a) => 4 * a * (1 - a) * (1 - a);
export function fmtW(w) {
  if (w >= 1e9) return (w / 1e9).toFixed(2) + ' GW';
  if (w >= 1e6) return (w / 1e6).toFixed(w >= 1e7 ? 1 : 2) + ' MW';
  if (w >= 1e3) return (w / 1e3).toFixed(w >= 1e5 ? 0 : 1) + ' kW';
  return w.toFixed(0) + ' W';
}

// A generic 3.6 MW onshore turbine with a 120 m rotor. Numbers are typical, not one product.
export const TURB = { P: 3.6e6, D: 120, vin: 3, vr: 12, vout: 25 };
export const cpEff = (v) => (v <= 8 ? 0.45 : v >= 12 ? 0.3 : lerp(0.45, 0.3, (v - 8) / 4));
export const curveP = (v, T = TURB) => (v < T.vin || v > T.vout ? 0 : Math.min(T.P, windPower(v, T.D) * cpEff(v)));
export const pitchOf = (v, T = TURB) => (v < T.vin ? 70 : v > T.vout ? 90 : v <= T.vr ? 0 : 22 * Math.pow((v - T.vr) / (T.vout - T.vr), 0.75));
export const rpmOf = (v, T = TURB) => (v < T.vin ? 1.5 : v > T.vout ? 0.5 : clamp(1.27 * v, 5, 13));

// ---------------------------------------------------------------- the blade
export const chordAt = (rr) => (rr < 0.2 ? lerp(0.055, 0.098, (rr - 0.04) / 0.16) : lerp(0.098, 0.022, Math.pow((rr - 0.2) / 0.8, 0.75)));
export const thickAt = (rr) => Math.max(0.13, 0.13 + 0.37 * Math.pow(Math.max(0, 1 - (rr - 0.04) / 0.26), 2));
// Design twist: the angle the chord makes with the rotor plane so the angle of attack stays about aD all along the span.
export const twistAt = (rr, lamD = 7, aD = 7) => Math.atan(0.667 / (lamD * Math.max(0.15, rr))) / D2R - aD;

// Outline of an airfoil: leading edge, over the top to the trailing edge, back along the bottom. x 0..1, y thickness.
export function airfoil(t = 0.14, m = 0.04, n = 22) {
  const up = [], lo = [], p = 0.4;
  for (let i = 0; i <= n; i++) {
    const x = (1 - Math.cos((Math.PI * i) / n)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const yc = x < p ? (m / (p * p)) * (2 * p * x - x * x) : (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x * x);
    up.push([x, yc + yt]); lo.push([x, yc - yt]);
  }
  return [...up, ...lo.slice(1, -1).reverse()];
}

// Blade along +Y from 4 % of R to R. Chord runs along Z (leading edge toward +Z, the way the tip moves),
// the suction side bulges toward +X (downwind).
export function bladeGeometry(R, { lamD = 7, aD = 7, stations = 24 } = {}) {
  const pos = [], idx = [];
  let N = 0;
  for (let j = 0; j < stations; j++) {
    const rr = 0.04 + 0.96 * (j / (stations - 1)), c = chordAt(rr) * R, b = twistAt(rr, lamD, aD) * D2R;
    const ring = airfoil(thickAt(rr), 0.04 * smooth((rr - 0.04) / 0.25));
    N = ring.length;
    for (const [x, y] of ring) {
      const ch = (x - 0.3) * c, ny = y * c;
      pos.push(ch * Math.sin(b) + ny * Math.cos(b), rr * R, -ch * Math.cos(b) + ny * Math.sin(b));
    }
  }
  for (let j = 0; j < stations - 1; j++) for (let i = 0; i < N; i++) {
    const a = j * N + i, b = j * N + ((i + 1) % N);
    idx.push(a, b, a + N, b, b + N, a + N);
  }
  const last = (stations - 1) * N, cen = stations * N;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < N; i++) { cx += pos[(last + i) * 3]; cy += pos[(last + i) * 3 + 1]; cz += pos[(last + i) * 3 + 2]; }
  pos.push(cx / N, cy / N, cz / N);
  for (let i = 0; i < N; i++) idx.push(last + i, last + ((i + 1) % N), cen);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- the turbine
// Rotor axis along X, wind blows toward +X. Rotor spins about X (rotor.rotation.x); setPitch turns the blades.
export function makeTurbine({ R = 3, shadow = true, lamD = 7 } = {}) {
  const g = new THREE.Group(), white = M.plastic(COL.white, { roughness: 0.38 }), grey = M.plastic(0xc9ced8, { roughness: 0.5 });
  const hubY = 1.5 * R;
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * R, 0.036 * R, hubY, 24), grey);
  tower.position.y = hubY / 2; tower.castShadow = shadow; g.add(tower);
  const yaw = new THREE.Group(); yaw.position.y = hubY; g.add(yaw);
  const nac = box(0.3 * R, 0.1 * R, 0.1 * R, white); nac.position.x = 0.05 * R; nac.castShadow = shadow; yaw.add(nac);
  const rotor = new THREE.Group(); rotor.position.x = -0.12 * R; yaw.add(rotor);
  const r = R * 0.001 * 1000;
  const spin = latheX([[-0.08 * r, 0], [-0.06 * r, 0.03 * r], [-0.02 * r, 0.05 * r], [0.03 * r, 0.05 * r]], white); spin.castShadow = shadow; rotor.add(spin);
  const geo = bladeGeometry(R, { lamD }), bmat = M.plastic(COL.white, { roughness: 0.35, side: THREE.DoubleSide });
  const holders = [], pitchGs = [];
  for (let k = 0; k < 3; k++) {
    const h = new THREE.Group(); h.rotation.x = (k * 2 * Math.PI) / 3;
    const pg = new THREE.Group(), m = new THREE.Mesh(geo, bmat); m.castShadow = shadow;
    pg.add(m); h.add(pg); rotor.add(h); holders.push(h); pitchGs.push(pg);
  }
  const setPitch = (deg) => pitchGs.forEach((p) => { p.rotation.y = -deg * D2R; });
  return { group: g, yaw, rotor, holders, pitchGs, setPitch, R, hubY, xh: -0.12 * R };
}

// ---------------------------------------------------------------- wind streaks
const mb = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function makeWind(n, { x0 = -16, x1 = 18, y0 = 0.4, y1 = 9, z = 7, seed = 3, opacity = 0.5 } = {}) {
  const rnd = mb(seed);
  const mesh = swarm(n, new THREE.BoxGeometry(1, 0.02, 0.02), M.glow(0xbfe6ff, { transparent: true, opacity }));
  mesh.castShadow = false; mesh.frustumCulled = false;
  const P = Array.from({ length: n }, () => ({ x: lerp(x0, x1, rnd()), y: lerp(y0, y1, rnd()), z: (rnd() * 2 - 1) * z, l: 0.4 + rnd() * 0.5 }));
  const draw = () => { P.forEach((p, i) => mesh.place(i, [p.x, p.y, p.z], null, p.l)); mesh.done(); };
  draw();
  // speed: world units per second; factor(x,y,z) scales it locally.
  mesh.step = (dt, speed, factor) => {
    for (const p of P) { p.x += speed * (factor ? factor(p.x, p.y, p.z) : 1) * dt; if (p.x > x1) p.x = x0; }
    draw();
  };
  return mesh;
}

// Canvas helpers shared by the chart panels.
export const FONT = (w, px) => `${w} ${px}px Geist, system-ui, sans-serif`;
