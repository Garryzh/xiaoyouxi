/**
 * OrbitLive — global satellite realtime tracker
 * CelesTrak TLE (cached ~2h) + satellite.js SGP4 local propagation
 * Three.js Earth · constellation points · ISS orbit & footprint
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as satellite from 'satellite.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371.0;
const SCENE_EARTH_R = 1.0;
const KM_TO_SCENE = SCENE_EARTH_R / EARTH_RADIUS_KM;
const CACHE_KEY = 'orbitlive-tle-v2';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const LOCAL_TLE = './data/catalog.tle';
// CelesTrak blocks some huge GROUP downloads (e.g. active/starlink) with 403.
// Use smaller groups + supplemental Starlink feed instead.
const TLE_SOURCES = [
  'https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-NEXT&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle',
];

const GROUPS = [
  { id: 'starlink', label: '星链', en: 'Starlink', color: '#5ee7ff' },
  { id: 'oneweb', label: '一网', en: 'OneWeb', color: '#7aa2ff' },
  { id: 'stations', label: '空间站', en: 'Stations', color: '#ff7a6b' },
  { id: 'gps', label: 'GPS', en: 'GPS', color: '#8dffb0' },
  { id: 'beidou', label: '北斗', en: 'BeiDou', color: '#ffd166' },
  { id: 'glonass', label: '格洛纳斯', en: 'GLONASS', color: '#c3a6ff' },
  { id: 'galileo', label: '伽利略', en: 'Galileo', color: '#ff9ed1' },
  { id: 'iridium', label: '铱星', en: 'Iridium', color: '#9ef0d0' },
  { id: 'weather', label: '气象', en: 'Weather', color: '#9ec9ff' },
  { id: 'others', label: '其他', en: 'Others', color: '#6b7c93' },
];

const GROUP_COLOR = Object.fromEntries(GROUPS.map((g) => [g.id, new THREE.Color(g.color)]));

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);
const loader = $('loader');
const loaderStatus = $('loader-status');
const metaEl = $('meta');
const groupsEl = $('groups');
const visibleCountEl = $('visible-count');
const clockEl = $('clock');
const fpsEl = $('fps');
const focusChip = $('focus-chip');
const focusName = $('focus-name');

function setStatus(text, { error = false } = {}) {
  loaderStatus.textContent = text;
  loader.classList.toggle('error', error);
}

function revealUI() {
  loader.classList.add('done');
  document.body.classList.add('ready');
}

// ---------------------------------------------------------------------------
// TLE fetch + cache
// ---------------------------------------------------------------------------

function parseTleText(text) {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  const records = [];
  const seen = new Set();
  for (let i = 0; i < lines.length;) {
    let name = 'UNKNOWN';
    let l1;
    let l2;
    if (lines[i].startsWith('1 ') && lines[i + 1]?.startsWith('2 ')) {
      l1 = lines[i];
      l2 = lines[i + 1];
      i += 2;
    } else if (lines[i + 1]?.startsWith('1 ') && lines[i + 2]?.startsWith('2 ')) {
      name = lines[i].replace(/^0\s+/, '');
      l1 = lines[i + 1];
      l2 = lines[i + 2];
      i += 3;
    } else {
      i += 1;
      continue;
    }
    try {
      const satrec = satellite.twoline2satrec(l1, l2);
      if (satrec.error) continue;
      const id = String(satrec.satnum || `${l1}|${l2}`);
      if (seen.has(id)) continue;
      seen.add(id);
      records.push({
        name,
        satrec,
        group: classifyName(name),
        norad: satrec.satnum,
      });
    } catch {
      // skip malformed
    }
  }
  return records;
}

function classifyName(name) {
  const n = name.toUpperCase();
  if (n.includes('STARLINK')) return 'starlink';
  if (n.includes('ONEWEB')) return 'oneweb';
  if (
    n.includes('ISS') ||
    n.includes('ZARYA') ||
    n.includes('CSS') ||
    n.includes('TIANHE') ||
    n.includes('WENTIAN') ||
    n.includes('MENGTIAN') ||
    n.includes('NAUKA') ||
    n.includes('PROGRESS') ||
    n.includes('SOYUZ') ||
    /\bCREW[- ]?\d/.test(n) ||
    n.includes('DRAGON') ||
    n.includes('CYGNUS') ||
    n.includes('TIANZHOU')
  ) return 'stations';
  if (n.includes('NAVSTAR') || n.includes('GPS BII') || n.includes('GPS BIII') || /\bGPS\b/.test(n)) return 'gps';
  if (n.includes('BEIDOU') || n.includes('BEIDOU')) return 'beidou';
  if (n.includes('GLONASS')) return 'glonass';
  if (n.includes('GALILEO')) return 'galileo';
  if (n.includes('IRIDIUM')) return 'iridium';
  if (
    n.includes('NOAA') ||
    n.includes('GOES') ||
    n.includes('METOP') ||
    n.includes('FENGYUN') ||
    n.includes('METEOR') ||
    n.includes('HIMAWARI') ||
    n.includes('SUOMI')
  ) return 'weather';
  // many GLONASS are labeled COSMOS ####
  if (/^COSMOS\s+\d+/.test(n) && !n.includes('DEB')) {
    // leave as others unless GLONASS tagged — too ambiguous
  }
  return 'others';
}

async function fetchText(url) {
  const attempts = [
    url,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];
  let lastErr;
  for (const u of attempts) {
    try {
      const res = await fetch(u, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text || text.length < 200 || /<!doctype html|<html/i.test(text)) {
        throw new Error('Unexpected response body');
      }
      return text;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Failed to fetch TLE');
}

async function fetchLiveCatalog(onProgress) {
  const chunks = [];
  let ok = 0;
  for (let i = 0; i < TLE_SOURCES.length; i++) {
    const url = TLE_SOURCES[i];
    onProgress?.(`在线刷新 ${i + 1}/${TLE_SOURCES.length}…`);
    try {
      const text = await fetchText(url);
      chunks.push(text);
      ok += 1;
    } catch {
      // continue with other groups
    }
  }
  if (!ok) throw new Error('所有在线 TLE 源均失败');
  return chunks.join('\n');
}

async function loadTleCatalog(onProgress) {
  // 1) memory/localStorage cache
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached?.text && cached?.fetchedAt && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        onProgress?.('读取本地 TLE 缓存…');
        return {
          text: cached.text,
          fetchedAt: cached.fetchedAt,
          fromCache: true,
          source: 'cache',
        };
      }
    }
  } catch {
    // ignore
  }

  // 2) bundled snapshot (works offline / without CORS)
  try {
    onProgress?.('加载内置 TLE 快照…');
    const res = await fetch(LOCAL_TLE, { cache: 'force-cache' });
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 500 && text.includes('\n1 ')) {
        const fetchedAt = Date.now();
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ text, fetchedAt, source: 'bundle' }));
        } catch {
          // quota — ignore
        }
        return { text, fetchedAt, fromCache: false, source: 'bundle' };
      }
    }
  } catch {
    // fall through to live
  }

  // 3) live multi-group CelesTrak
  onProgress?.('正在从 CelesTrak 分组拉取 TLE…');
  const text = await fetchLiveCatalog(onProgress);
  const fetchedAt = Date.now();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ text, fetchedAt, source: 'live' }));
  } catch {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt, truncated: true }));
    } catch {
      // ignore
    }
  }
  return { text, fetchedAt, fromCache: false, source: 'live' };
}

function formatAge(fetchedAt) {
  const mins = Math.max(0, Math.round((Date.now() - fetchedAt) / 60000));
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} 小时前`;
  return `${Math.round(hrs / 24)} 天前`;
}

// ---------------------------------------------------------------------------
// Math / coordinates
// ---------------------------------------------------------------------------

function eciToScene(positionEci, gmst) {
  // ECI → ECF (Earth-fixed), then to Three.js Y-up
  const ecf = satellite.eciToEcf(positionEci, gmst);
  return new THREE.Vector3(
    ecf.x * KM_TO_SCENE,
    ecf.z * KM_TO_SCENE,
    -ecf.y * KM_TO_SCENE,
  );
}

function geodeticToScene(latRad, lonRad, altKm) {
  const r = SCENE_EARTH_R * (1 + altKm / EARTH_RADIUS_KM);
  const lat = latRad;
  const lon = lonRad;
  const cosLat = Math.cos(lat);
  return new THREE.Vector3(
    r * cosLat * Math.cos(lon),
    r * Math.sin(lat),
    -r * cosLat * Math.sin(lon),
  );
}

function propagateOne(satrec, date) {
  const pv = satellite.propagate(satrec, date);
  if (!pv.position || pv.position === false) return null;
  const gmst = satellite.gstime(date);
  const gd = satellite.eciToGeodetic(pv.position, gmst);
  const pos = eciToScene(pv.position, gmst);
  return {
    pos,
    lat: gd.latitude,
    lon: gd.longitude,
    alt: gd.height,
  };
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

let renderer, scene, camera, controls;
let points;
let positions;
let colors;
let sats = [];
let enabledGroups = new Set(GROUPS.map((g) => g.id));
let simTime = Date.now();
let paused = false;
let timeScale = 1;
let lastFrame = performance.now();
let issIndex = -1;
let orbitLine;
let footprintLine;
let earth;
let clouds;
let sunLight;

function createStarfield() {
  const count = 4000;
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 40 + Math.random() * 60;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.cos(phi);
    arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xb8d4ff,
    size: 0.035,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

let earthSunDir = new THREE.Vector3(-0.85, 0.15, 0.5).normalize();
let earthMat = null;

function createEarth() {
  const group = new THREE.Group();
  const loaderTex = new THREE.TextureLoader();

  const dayMap = loaderTex.load('./assets/earth-day.jpg');
  dayMap.colorSpace = THREE.SRGBColorSpace;
  dayMap.anisotropy = 8;

  // Night lights map: luminance ≈ urban density
  const nightMap = loaderTex.load(
    './assets/earth-night.jpg',
    () => { console.info('[orbitlive] night map loaded', nightMap.image?.width, nightMap.image?.height); },
    undefined,
    (err) => { console.error('[orbitlive] night map failed', err); },
  );
  // Keep linear for emissive-like city lights (avoid crushing dim pixels)
  nightMap.colorSpace = THREE.NoColorSpace;
  nightMap.anisotropy = 8;

  earthMat = new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      sunDirection: { value: earthSunDir.clone() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalW;
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dayMap;
      uniform sampler2D nightMap;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vNormalW;

      void main() {
        vec3 n = normalize(vNormalW);
        float ndl = dot(n, normalize(sunDirection));

        // Soft day / night blend
        float dayFactor = smoothstep(-0.15, 0.25, ndl);
        float nightFactor = 1.0 - smoothstep(-0.08, 0.22, ndl);

        vec3 day = texture2D(dayMap, vUv).rgb;
        vec3 lights = texture2D(nightMap, vUv).rgb;

        // Urban density ≈ night-map luminance (cities / metro clusters)
        float density = max(lights.r, max(lights.g, lights.b));
        density = pow(clamp(density, 0.0, 1.0), 0.75);

        // Warm city glow — brighter where density is higher
        vec3 city = lights * vec3(2.0, 1.35, 0.7) * (0.55 + density * 6.5);

        vec3 litDay = day * (0.38 + 0.62 * clamp(ndl, 0.0, 1.0));
        vec3 nightSide = day * 0.025 + city;

        vec3 color = mix(nightSide, litDay, dayFactor);
        color += city * nightFactor * 0.4;
        color = max(color, city * nightFactor * 0.85);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  earth = new THREE.Mesh(new THREE.SphereGeometry(SCENE_EARTH_R, 128, 96), earthMat);
  group.add(earth);

  // Thin cyan atmosphere rim only (keep intensity low — additive can white-out)
  const atmosMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      glowColor: { value: new THREE.Color(0x4ab8ff) },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.5);
        float intensity = fresnel * 0.45;
        gl_FragColor = vec4(glowColor * intensity, intensity);
      }
    `,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(SCENE_EARTH_R * 1.045, 64, 48), atmosMat));

  clouds = null;
  return group;
}

function buildSatellitePoints(catalog) {
  sats = catalog;
  const n = sats.length;
  positions = new Float32Array(n * 3);
  colors = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  for (let i = 0; i < n; i++) {
    const c = GROUP_COLOR[sats[i].group] || GROUP_COLOR.others;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    if (issIndex < 0 && /ISS\(ZARYA\)|ISS \(ZARYA\)/i.test(sats[i].name)) {
      issIndex = i;
    }
  }
  if (issIndex < 0) {
    issIndex = sats.findIndex((s) => s.group === 'stations' && /ISS/i.test(s.name));
  }

  const mat = new THREE.PointsMaterial({
    size: 0.018,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

function buildOrbitLine() {
  const maxPts = 180;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPts * 3), 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xff8a75,
    transparent: true,
    opacity: 0.85,
  });
  orbitLine = new THREE.LineLoop(geo, mat);
  orbitLine.frustumCulled = false;
  orbitLine.visible = false;
  return orbitLine;
}

function buildFootprint() {
  const segs = 96;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segs + 1) * 3), 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xffb09f,
    transparent: true,
    opacity: 0.7,
  });
  footprintLine = new THREE.LineLoop(geo, mat);
  footprintLine.frustumCulled = false;
  footprintLine.visible = false;
  return footprintLine;
}

function updateFootprint(lat, lon, altKm) {
  if (!footprintLine || altKm <= 0) {
    if (footprintLine) footprintLine.visible = false;
    return;
  }
  const ratio = EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altKm);
  if (ratio >= 1) {
    footprintLine.visible = false;
    return;
  }
  const gamma = Math.acos(ratio);
  const segs = 96;
  const arr = footprintLine.geometry.attributes.position.array;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinG = Math.sin(gamma);
  const cosG = Math.cos(gamma);

  for (let i = 0; i <= segs; i++) {
    const bearing = (i / segs) * Math.PI * 2;
    const sinB = Math.sin(bearing);
    const cosB = Math.cos(bearing);
    const lat2 = Math.asin(sinLat * cosG + cosLat * sinG * cosB);
    const lon2 = lon + Math.atan2(sinB * sinG * cosLat, cosG - sinLat * Math.sin(lat2));
    const p = geodeticToScene(lat2, lon2, 0.015);
    arr[i * 3] = p.x;
    arr[i * 3 + 1] = p.y;
    arr[i * 3 + 2] = p.z;
  }
  footprintLine.geometry.attributes.position.needsUpdate = true;
  footprintLine.visible = true;
}

function updateOrbitTrail(satrec, date) {
  if (!orbitLine || !satrec) {
    if (orbitLine) orbitLine.visible = false;
    return;
  }
  // Mean motion (rad/min) → period minutes
  const no = satrec.no; // rad/min
  const periodMin = (Math.PI * 2) / Math.max(no, 1e-6);
  const samples = 180;
  const arr = orbitLine.geometry.attributes.position.array;
  let valid = 0;
  for (let i = 0; i < samples; i++) {
    const t = new Date(date.getTime() + ((i / samples) * periodMin) * 60000);
    const pv = satellite.propagate(satrec, t);
    if (!pv.position) continue;
    const gmst = satellite.gstime(t);
    const p = eciToScene(pv.position, gmst);
    arr[valid * 3] = p.x;
    arr[valid * 3 + 1] = p.y;
    arr[valid * 3 + 2] = p.z;
    valid += 1;
  }
  orbitLine.geometry.setDrawRange(0, valid);
  orbitLine.geometry.attributes.position.needsUpdate = true;
  orbitLine.visible = valid > 8;
}

// ---------------------------------------------------------------------------
// UI groups / time
// ---------------------------------------------------------------------------

function renderGroupButtons(counts) {
  groupsEl.innerHTML = '';
  for (const g of GROUPS) {
    const count = counts[g.id] || 0;
    if (!count && g.id !== 'others') continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group' + (enabledGroups.has(g.id) ? ' active' : '');
    btn.dataset.id = g.id;
    btn.innerHTML = `
      <span class="dot" style="color:${g.color};background:${g.color}"></span>
      <span class="name">${g.label}<small>${g.en}</small></span>
      <span class="count">${count.toLocaleString()}</span>
    `;
    btn.addEventListener('click', () => {
      if (enabledGroups.has(g.id)) enabledGroups.delete(g.id);
      else enabledGroups.add(g.id);
      // keep at least one
      if (enabledGroups.size === 0) enabledGroups.add(g.id);
      btn.classList.toggle('active', enabledGroups.has(g.id));
      updateVisibilityMask();
    });
    groupsEl.appendChild(btn);
  }
}

function updateVisibilityMask() {
  // Colors alpha via size: hide by pushing far away + zeroing contribution
  // We recolor disabled groups to transparent black and shrink — handled in update loop via skip
  let visible = 0;
  for (const s of sats) if (enabledGroups.has(s.group)) visible += 1;
  visibleCountEl.textContent = `${visible.toLocaleString()} 可见`;
}

function setupTimeControls() {
  const pauseBtn = $('btn-pause');
  const nowBtn = $('btn-now');
  const speedBtns = [...document.querySelectorAll('.speed')];

  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶' : '❚❚';
    pauseBtn.classList.toggle('active', !paused);
    pauseBtn.setAttribute('aria-pressed', String(paused));
  });

  nowBtn.addEventListener('click', () => {
    simTime = Date.now();
  });

  for (const btn of speedBtns) {
    btn.addEventListener('click', () => {
      timeScale = Number(btn.dataset.speed) || 1;
      speedBtns.forEach((b) => b.classList.toggle('active', b === btn));
      if (paused) {
        paused = false;
        pauseBtn.textContent = '❚❚';
        pauseBtn.classList.add('active');
      }
    });
  }
}

function formatClock(ms) {
  const d = new Date(ms);
  const iso = d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  return iso;
}

// ---------------------------------------------------------------------------
// Update loop
// ---------------------------------------------------------------------------

function updateSatellites(date) {
  const n = sats.length;
  let visible = 0;
  let issState = null;

  for (let i = 0; i < n; i++) {
    const s = sats[i];
    const enabled = enabledGroups.has(s.group);
    if (!enabled) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      continue;
    }

    const state = propagateOne(s.satrec, date);
    if (!state || state.alt < -50 || state.alt > 200000) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      continue;
    }

    positions[i * 3] = state.pos.x;
    positions[i * 3 + 1] = state.pos.y;
    positions[i * 3 + 2] = state.pos.z;
    visible += 1;

    if (i === issIndex) issState = { ...state, sat: s };
  }

  points.geometry.attributes.position.needsUpdate = true;
  visibleCountEl.textContent = `${visible.toLocaleString()} 可见`;

  if (issState && enabledGroups.has('stations')) {
    updateOrbitTrail(issState.sat.satrec, date);
    updateFootprint(issState.lat, issState.lon, issState.alt);
    focusChip.hidden = false;
    focusName.textContent = issState.sat.name.slice(0, 28);
  } else {
    if (orbitLine) orbitLine.visible = false;
    if (footprintLine) footprintLine.visible = false;
    focusChip.hidden = true;
  }
}

function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02060c);
  scene.fog = new THREE.FogExp2(0x02060c, 0.006);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 200);
  camera.position.set(0.55, 0.85, 2.35);

  const ambient = new THREE.AmbientLight(0x6a7f99, 0.45);
  scene.add(ambient);
  sunLight = new THREE.DirectionalLight(0xfff1dd, 1.85);
  sunLight.position.copy(earthSunDir).multiplyScalar(8);
  scene.add(sunLight);
  const fill = new THREE.DirectionalLight(0x3a6aaa, 0.3);
  fill.position.set(-4, -0.5, -2.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x88ccff, 0.22);
  rim.position.set(-2, 3, -4);
  scene.add(rim);

  scene.add(createStarfield());
  scene.add(createEarth());

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1.35;
  controls.maxDistance = 12;
  controls.enablePan = false;
  controls.target.set(0, 0, 0);
  controls.update();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastFrame = performance.now();
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init() {
  setStatus('初始化三维场景…');
  setupRenderer();
  setupTimeControls();

  let catalog;
  let fetchedAt;
  let sourceLabel = '内置快照';

  try {
    const pack = await loadTleCatalog(setStatus);
    fetchedAt = pack.fetchedAt;
    sourceLabel = pack.fromCache
      ? '缓存'
      : pack.source === 'live'
        ? '在线'
        : '内置快照';
    setStatus(`解析 TLE（${sourceLabel}）…`);
    catalog = parseTleText(pack.text);
    if (!catalog.length) throw new Error('TLE 解析结果为空');
  } catch (err) {
    console.error(err);
    setStatus('TLE 加载失败', { error: true });
    loader.querySelector('.loader-note').textContent =
      `${err?.message || err} — 请确认 data/catalog.tle 存在，或检查网络后刷新。`;
    return;
  }

  setStatus(`构建 ${catalog.length.toLocaleString()} 颗卫星…`);
  scene.add(buildSatellitePoints(catalog));
  scene.add(buildOrbitLine());
  scene.add(buildFootprint());

  const counts = Object.fromEntries(GROUPS.map((g) => [g.id, 0]));
  for (const s of catalog) counts[s.group] = (counts[s.group] || 0) + 1;
  renderGroupButtons(counts);
  updateVisibilityMask();

  metaEl.innerHTML = `<strong>${catalog.length.toLocaleString()}</strong> / ${catalog.length.toLocaleString()} 颗在轨目标 · TLE ${sourceLabel} · <strong>${formatAge(fetchedAt)}</strong>`;

  // Initial propagate
  updateSatellites(new Date(simTime));
  revealUI();

  let frames = 0;
  let fpsAcc = 0;
  let orbitRefresh = 0;

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    if (!paused) {
      simTime += dt * 1000 * timeScale;
    }

    const date = new Date(simTime);
    updateSatellites(date);

    // Orbit trail refresh at lower rate when sped up
    orbitRefresh += dt;
    if (orbitRefresh > 0.5 && issIndex >= 0 && enabledGroups.has('stations')) {
      orbitRefresh = 0;
      updateOrbitTrail(sats[issIndex].satrec, date);
    }

    if (clouds) clouds.rotation.y += dt * 0.003;

    // Slow sun drift so night-side city density lights sweep into view
    if (!paused && earthMat?.uniforms?.sunDirection) {
      const ang = dt * 0.04 * Math.min(timeScale, 60);
      earthSunDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
      earthMat.uniforms.sunDirection.value.copy(earthSunDir);
      if (sunLight) sunLight.position.copy(earthSunDir).multiplyScalar(8);
    }

    controls.update();
    renderer.render(scene, camera);

    clockEl.textContent = formatClock(simTime);

    frames += 1;
    fpsAcc += dt;
    if (fpsAcc >= 0.5) {
      fpsEl.textContent = String(Math.round(frames / fpsAcc));
      frames = 0;
      fpsAcc = 0;
    }
  });

  // Background refresh when cache ages out (live multi-group)
  setInterval(async () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const cached = raw ? JSON.parse(raw) : null;
      if (cached?.fetchedAt && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return;
      const text = await fetchLiveCatalog();
      const pack = { text, fetchedAt: Date.now(), source: 'live' };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(pack));
      } catch {
        // ignore quota
      }
      const next = parseTleText(pack.text);
      if (next.length > 500) {
        scene.remove(points);
        points.geometry.dispose();
        points.material.dispose();
        issIndex = -1;
        scene.add(buildSatellitePoints(next));
        const c2 = Object.fromEntries(GROUPS.map((g) => [g.id, 0]));
        for (const s of next) c2[s.group] = (c2[s.group] || 0) + 1;
        renderGroupButtons(c2);
        metaEl.innerHTML = `<strong>${next.length.toLocaleString()}</strong> / ${next.length.toLocaleString()} 颗在轨目标 · TLE 在线 · <strong>${formatAge(pack.fetchedAt)}</strong>`;
      }
    } catch (e) {
      console.warn('[orbitlive] background refresh failed', e);
    }
  }, 15 * 60 * 1000);
}

init().catch((err) => {
  console.error(err);
  setStatus('启动失败', { error: true });
  loader.querySelector('.loader-note').textContent = String(err?.message || err);
});
