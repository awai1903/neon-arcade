/**
 * NEON RUSH: CITY ESCAPE
 * Handcrafted 3D Endless Runner built with Three.js & Web Audio API
 * 
 * Features:
 * - 3-Lane High-Velocity Running with smooth banking lerp
 * - Jump, Slide, and Lane Switching physics
 * - Procedural Infinite Cyber Highway with illuminated skyscrapers
 * - Fair procedural obstacle generator (Hurdles, Overhead Gates, Energy Pylons)
 * - Collectible Neon Energy Cores
 * - Composite 10-part procedural Cyber Runner character with full kinematics
 * - 100% Original procedural Synthwave Audio & Sound FX Engine (zero external audio files)
 * - Cinematic Video Banner Menu with SVG Branding & HUD
 * - Full Keyboard & Mobile Touch Swipe Controls
 */

import * as THREE from 'three';

// --- Procedural Synthwave Sound Engine ---
class NeonAudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmTimer = null;
    this.step = 0;
    this.isPlayingBgm = false;
  }

  ensureContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.ctx) {
      if (this.isPlayingBgm) {
        this.stopBGM();
      }
    } else if (!muted && !this.isPlayingBgm) {
      this.startBGM();
    }
  }

  startBGM() {
    if (this.isMuted || this.isPlayingBgm) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.isPlayingBgm = true;
    this.step = 0;
    const tempo = 128;
    const stepTime = 60 / tempo / 4; // 16th note

    const bassNotes = [110, 110, 130.8, 110, 146.8, 110, 130.8, 110]; // A2, C3, D3 pattern
    const arpNotes = [220, 261.6, 329.6, 440, 329.6, 261.6, 392, 329.6];

    const schedule = () => {
      if (!this.isPlayingBgm || !this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Synth Kick on beats 0, 4, 8, 12
      if (this.step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(150, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(t);
        kickOsc.stop(t + 0.13);
      }

      // 2. Hi-hat on offbeats
      if (this.step % 2 === 1) {
        const hatBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
        const data = hatBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
        }
        const hatSource = this.ctx.createBufferSource();
        hatSource.buffer = hatBuffer;
        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, t);
        const hatGain = this.ctx.createGain();
        hatGain.gain.setValueAtTime(0.12, t);
        hatSource.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.ctx.destination);
        hatSource.start(t);
      }

      // 3. Rolling Cyber Bassline
      const bassFreq = bassNotes[this.step % bassNotes.length];
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, t);
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450, t);
      bassGain.gain.setValueAtTime(0.18, t);
      bassGain.gain.exponentialRampToValueAtTime(0.01, t + stepTime * 0.9);
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(t);
      bassOsc.stop(t + stepTime);

      // 4. Synth Arp Melody
      if (this.step % 2 === 0) {
        const arpFreq = arpNotes[(this.step / 2) % arpNotes.length];
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(arpFreq, t);
        arpGain.gain.setValueAtTime(0.08, t);
        arpGain.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 1.5);
        arpOsc.connect(arpGain);
        arpGain.connect(this.ctx.destination);
        arpOsc.start(t);
        arpOsc.stop(t + stepTime * 1.6);
      }

      this.step = (this.step + 1) % 16;
      this.bgmTimer = setTimeout(schedule, stepTime * 1000);
    };

    schedule();
  }

  stopBGM() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playCoinSound() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, t); // D5
    osc1.frequency.setValueAtTime(880, t + 0.06); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, t); // D6
    osc2.frequency.setValueAtTime(1760, t + 0.06);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.19);
    osc2.stop(t + 0.19);
  }

  playJumpSound() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  playSlideSound() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Filtered white noise burst for cyber friction glide
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.22);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  playLandSound() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playCollisionSound() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  playClick() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  destroy() {
    this.stopBGM();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

/**
 * Creates the complete Neon Rush: City Escape game instance
 */
export function createGame(container, options = {}) {
  // Clear any existing children
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const audio = new NeonAudioSystem();
  audio.setMuted(options.isMuted || false);

  // Setup DOM Architecture
  const root = document.createElement('div');
  root.className = 'neon-rush-container';
  container.appendChild(root);

  // 1. Three.js Canvas container
  const canvas = document.createElement('canvas');
  canvas.className = 'neon-rush-canvas';
  root.appendChild(canvas);

  // Resolve bundled asset URLs
  const logoUrl = options.getAssetUrl ? options.getAssetUrl('assets/branding/neon-rush-logo.svg') : './assets/branding/neon-rush-logo.svg';
  const bannerVideoUrl = options.getAssetUrl ? options.getAssetUrl('assets/video/neon-rush-banner.webm') : './assets/video/neon-rush-banner.webm';
  const bannerMp4Url = options.getAssetUrl ? options.getAssetUrl('assets/video/neon-rush-banner.mp4') : './assets/video/neon-rush-banner.mp4';
  const posterUrl = options.getAssetUrl ? options.getAssetUrl('assets/video/neon-rush-poster.webp') : './assets/video/neon-rush-poster.webp';

  // 2. Cinematic Video Banner Menu Overlay
  const bannerScreen = document.createElement('div');
  bannerScreen.className = 'neon-rush-banner-screen';
  bannerScreen.innerHTML = `
    <div class="neon-rush-video-wrap">
      <video
        class="neon-rush-video"
        autoplay
        loop
        muted
        playsinline
        poster="${posterUrl}"
      >
        <source src="${bannerVideoUrl}" type="video/webm">
        <source src="${bannerMp4Url}" type="video/mp4">
      </video>
      <div class="neon-rush-video-scrim"></div>
      <div class="neon-rush-video-vignette"></div>
    </div>

    <div class="neon-rush-banner-top">
      <div class="neon-rush-badge">
        <span>⚡ 3-LANE HYPER RUNNER</span>
      </div>
      <button class="neon-rush-ctrl-btn" id="nr-banner-mute-btn" title="Toggle Sound">
        <svg id="nr-mute-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      </button>
    </div>

    <div class="neon-rush-banner-content">
      <img src="${logoUrl}" alt="NEON RUSH: CITY ESCAPE" class="neon-rush-logo-img" />
      <p class="neon-rush-tagline">
        Dash across 3 cybernetic highway lanes, leap over laser hurdles, slide under neon gates, and escape the grid.
      </p>

      <button class="neon-rush-btn-play" id="nr-play-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>PLAY NOW</span>
      </button>

      <div style="margin-top: 1.25rem; display: flex; align-items: center; gap: 1rem;">
        <button id="nr-how-to-play-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 0.8rem; font-weight: 600; cursor: pointer; text-decoration: underline; text-underline-offset: 4px;">
          How to Play
        </button>
        <span id="nr-banner-hs" style="font-size: 0.8rem; font-family: monospace; color: #94a3b8;"></span>
      </div>
    </div>

    <div class="neon-rush-swipe-hints" style="position: relative; bottom: 0.75rem; margin: 0 auto;">
      <span>SWIPE OR ARROWS TO MOVE · UP/W: JUMP · DOWN/S: SLIDE</span>
    </div>
  `;
  root.appendChild(bannerScreen);

  // 3. In-Game HUD Overlay
  const hud = document.createElement('div');
  hud.className = 'neon-rush-hud';
  hud.style.display = 'none';
  hud.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
      <div style="display: flex; gap: 0.75rem;">
        <div class="neon-rush-stat-box">
          <span class="neon-rush-stat-label">Distance</span>
          <span class="neon-rush-stat-val" id="hud-dist">0m</span>
        </div>
        <div class="neon-rush-stat-box">
          <span class="neon-rush-stat-label">Energy Cores</span>
          <span class="neon-rush-stat-val" id="hud-coins" style="color: #00f0ff;">0</span>
        </div>
        <div class="neon-rush-stat-box">
          <span class="neon-rush-stat-label">Score</span>
          <span class="neon-rush-stat-val" id="hud-score" style="color: #ec4899;">0</span>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem;" class="neon-rush-hud-interactive">
        <button class="neon-rush-ctrl-btn" id="hud-mute-btn" title="Toggle Audio">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
        <button class="neon-rush-ctrl-btn" id="hud-pause-btn" title="Pause Game">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile swipe guide prompt -->
    <div class="neon-rush-swipe-hints" id="hud-touch-hint">
      <span>SWIPE TO DODGE · SWIPE UP TO LEAP</span>
    </div>
  `;
  root.appendChild(hud);

  // 4. Game Over Modal Overlay
  const gameOverScreen = document.createElement('div');
  gameOverScreen.className = 'neon-rush-gameover-screen';
  gameOverScreen.style.display = 'none';
  gameOverScreen.innerHTML = `
    <div class="neon-rush-card">
      <div class="neon-rush-gameover-title">GRID BREACHED</div>
      <p style="color: #94a3b8; font-size: 0.85rem; margin-top: -0.5rem;">Cyborg runner intercepted by defense grid</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 0.5rem 0;">
        <div class="neon-rush-stat-box" style="align-items: center;">
          <span class="neon-rush-stat-label">Final Distance</span>
          <span class="neon-rush-stat-val" id="go-dist">0m</span>
        </div>
        <div class="neon-rush-stat-box" style="align-items: center;">
          <span class="neon-rush-stat-label">Cores Collected</span>
          <span class="neon-rush-stat-val" id="go-coins" style="color: #00f0ff;">0</span>
        </div>
      </div>

      <div class="neon-rush-stat-box" style="align-items: center;">
        <span class="neon-rush-stat-label">Total Score</span>
        <span class="neon-rush-stat-val" id="go-score" style="font-size: 1.75rem; color: #ec4899;">0</span>
        <span id="go-new-best" style="display: none; color: #22c55e; font-size: 0.75rem; font-weight: 700; margin-top: 0.25rem;">NEW PERSONAL BEST!</span>
      </div>

      <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
        <button class="neon-rush-btn-play" id="go-retry-btn" style="flex: 1; justify-content: center; padding: 0.75rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span>RETRY</span>
        </button>
      </div>
    </div>
  `;
  root.appendChild(gameOverScreen);

  // Update best score label on banner
  const hsKey = 'awaisgames_hs_neon-rush';
  const getStoredBest = () => parseInt(localStorage.getItem(hsKey) || '0', 10);
  const bannerHsEl = document.getElementById('nr-banner-hs');
  if (bannerHsEl) {
    const curBest = getStoredBest();
    if (curBest > 0) {
      bannerHsEl.textContent = `BEST: ${curBest.toLocaleString()} PTS`;
    }
  }

  // --- THREE.JS SCENE SETUP ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060913);
  scene.fog = new THREE.FogExp2(0x060913, 0.012);

  const camera = new THREE.PerspectiveCamera(65, container.clientWidth / (container.clientHeight || 1), 0.1, 450);
  camera.position.set(0, 4.2, 8.5);
  camera.lookAt(0, 1.8, -10);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setSize(container.clientWidth, container.clientHeight || 500);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // --- LIGHTING RIG ---
  const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.85);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.4);
  dirLight.position.set(15, 30, 20);
  scene.add(dirLight);

  const backLight = new THREE.DirectionalLight(0xa855f7, 0.9);
  backLight.position.set(-15, 20, -30);
  scene.add(backLight);

  // --- GAME CONSTANTS & LANES ---
  const LANES = [-3.0, 0, 3.0];
  let currentLane = 1; // Middle
  let targetLane = 1;

  // Jump & Slide Physics
  let isJumping = false;
  let jumpTime = 0;
  const JUMP_DURATION = 0.65;
  const JUMP_HEIGHT = 2.6;

  let isSliding = false;
  let slideTime = 0;
  const SLIDE_DURATION = 0.6;

  // Running mechanics
  let gameState = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
  let speed = 26; // meters per second
  const BASE_SPEED = 26;
  const MAX_SPEED = 48;
  let distance = 0;
  let coins = 0;
  let score = 0;
  let runAnimCycle = 0;

  // --- PROCEDURAL CYBER RUNNER MODEL (10 Distinct Parts) ---
  const playerGroup = new THREE.Group();
  playerGroup.position.set(0, 0, 0);
  scene.add(playerGroup);

  // Materials
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.8,
  });

  const neonCyanMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  });

  const neonVioletMat = new THREE.MeshBasicMaterial({
    color: 0xc084fc,
  });

  const visorMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
  });

  // 1. Torso
  const torsoGeo = new THREE.BoxGeometry(0.75, 0.95, 0.45);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.45;
  playerGroup.add(torso);

  // Chest Core Reactor
  const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.48, 8);
  coreGeo.rotateX(Math.PI / 2);
  const chestCore = new THREE.Mesh(coreGeo, neonCyanMat);
  chestCore.position.set(0, 1.55, 0.05);
  playerGroup.add(chestCore);

  // 2. Head & Visor
  const headGeo = new THREE.BoxGeometry(0.48, 0.52, 0.52);
  const head = new THREE.Mesh(headGeo, armorMat);
  head.position.set(0, 2.2, 0);
  playerGroup.add(head);

  // Glowing Visor Strip
  const visorGeo = new THREE.BoxGeometry(0.42, 0.12, 0.15);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 2.2, 0.23);
  playerGroup.add(visor);

  // Aerodynamic Helmet Crest
  const crestGeo = new THREE.BoxGeometry(0.1, 0.18, 0.45);
  const crest = new THREE.Mesh(crestGeo, neonVioletMat);
  crest.position.set(0, 2.5, -0.05);
  playerGroup.add(crest);

  // 3. Cyber Jetpack Thrusters
  const jetpackGeo = new THREE.BoxGeometry(0.55, 0.65, 0.22);
  const jetpack = new THREE.Mesh(jetpackGeo, armorMat);
  jetpack.position.set(0, 1.5, -0.32);
  playerGroup.add(jetpack);

  const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8), neonCyanMat);
  thrusterL.position.set(-0.18, 1.25, -0.32);
  playerGroup.add(thrusterL);

  const thrusterR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8), neonCyanMat);
  thrusterR.position.set(0.18, 1.25, -0.32);
  playerGroup.add(thrusterR);

  // 4. Arms
  const armGeo = new THREE.BoxGeometry(0.2, 0.75, 0.22);

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.55, 1.8, 0);
  const leftArm = new THREE.Mesh(armGeo, armorMat);
  leftArm.position.y = -0.35;
  leftArmGroup.add(leftArm);
  playerGroup.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.55, 1.8, 0);
  const rightArm = new THREE.Mesh(armGeo, armorMat);
  rightArm.position.y = -0.35;
  rightArmGroup.add(rightArm);
  playerGroup.add(rightArmGroup);

  // 5. Legs
  const legGeo = new THREE.BoxGeometry(0.25, 0.95, 0.26);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.24, 0.95, 0);
  const leftLeg = new THREE.Mesh(legGeo, armorMat);
  leftLeg.position.y = -0.45;
  leftLegGroup.add(leftLeg);
  playerGroup.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.24, 0.95, 0);
  const rightLeg = new THREE.Mesh(legGeo, armorMat);
  rightLeg.position.y = -0.45;
  rightLegGroup.add(rightLeg);
  playerGroup.add(rightLegGroup);

  // Runner Point Light (Grounded Neon Trail on Floor)
  const runnerGlow = new THREE.PointLight(0x00f0ff, 2.2, 8);
  runnerGlow.position.set(0, 0.8, 0);
  playerGroup.add(runnerGlow);

  // --- PROCEDURAL INFINITE HIGHWAY & CITY TRACK SYSTEM ---
  const CHUNK_LENGTH = 50;
  const TOTAL_CHUNKS = 8;
  const highwayChunks = [];

  // Track materials
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x050814,
    roughness: 0.25,
    metalness: 0.75,
  });

  const railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const railVioletMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
  const laneStripeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x070c1e,
    roughness: 0.4,
    metalness: 0.6,
  });

  // Reusable window texture generator
  const createWindowTexture = () => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, 128, 256);

    for (let y = 10; y < 250; y += 14) {
      for (let x = 8; x < 120; x += 16) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = Math.random() > 0.3 ? '#00f0ff' : '#c084fc';
          ctx.fillRect(x, y, 9, 7);
        }
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    return tex;
  };
  const windowTexture = createWindowTexture();
  const skyscraperMat = new THREE.MeshStandardMaterial({
    color: 0x0a1026,
    roughness: 0.3,
    metalness: 0.7,
    map: windowTexture,
    emissiveMap: windowTexture,
    emissive: new THREE.Color(0x00f0ff),
    emissiveIntensity: 0.4,
  });

  function createTrackChunk(zPos) {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    // Highway Road Surface (Width 11m, Length CHUNK_LENGTH)
    const roadGeo = new THREE.BoxGeometry(11, 0.4, CHUNK_LENGTH);
    const road = new THREE.Mesh(roadGeo, asphaltMat);
    road.position.y = -0.2;
    chunk.add(road);

    // Glowing Lane Dividers
    [-1.5, 1.5].forEach((x) => {
      const stripeGeo = new THREE.BoxGeometry(0.12, 0.04, CHUNK_LENGTH);
      const stripe = new THREE.Mesh(stripeGeo, laneStripeMat);
      stripe.position.set(x, 0.02, 0);
      chunk.add(stripe);
    });

    // Guard Rails Left and Right
    [-5.4, 5.4].forEach((x, idx) => {
      const railGeo = new THREE.BoxGeometry(0.2, 0.8, CHUNK_LENGTH);
      const rail = new THREE.Mesh(railGeo, idx === 0 ? railMat : railVioletMat);
      rail.position.set(x, 0.4, 0);
      chunk.add(rail);
    });

    // Roadside Cyber City Skyscrapers
    const buildingCount = 6;
    for (let i = 0; i < buildingCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const bWidth = 8 + Math.random() * 6;
      const bHeight = 35 + Math.random() * 65;
      const bDepth = 10 + Math.random() * 12;

      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMesh = new THREE.Mesh(bGeo, skyscraperMat);
      const xOffset = side * (12 + bWidth / 2 + Math.random() * 8);
      const zOffset = -CHUNK_LENGTH / 2 + (i / buildingCount) * CHUNK_LENGTH;
      bMesh.position.set(xOffset, bHeight / 2 - 2, zOffset);
      chunk.add(bMesh);

      // Rooftop Beacon Light
      const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), neonCyanMat);
      beacon.position.set(xOffset, bHeight - 1.5, zOffset);
      chunk.add(beacon);
    }

    // Overhead Flyover Arch
    if (Math.random() > 0.5) {
      const arch = new THREE.Group();
      arch.position.set(0, 0, 0);
      const archTop = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 1.2), railMat);
      archTop.position.set(0, 6.5, 0);
      arch.add(archTop);

      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 0.6), buildingMat);
      postL.position.set(-6, 3.5, 0);
      arch.add(postL);

      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 0.6), buildingMat);
      postR.position.set(6, 3.5, 0);
      arch.add(postR);

      chunk.add(arch);
    }

    scene.add(chunk);
    return chunk;
  }

  // Initialize pool of chunks
  for (let i = 0; i < TOTAL_CHUNKS; i++) {
    highwayChunks.push(createTrackChunk(-i * CHUNK_LENGTH));
  }

  // --- OBSTACLES & COLLECTIBLES MANAGEMENT ---
  const activeObstacles = [];
  const activeCoins = [];

  // Obstacle Geometries & Materials
  const hurdleGeo = new THREE.BoxGeometry(2.4, 0.8, 0.4);
  const hurdleMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xf43f5e,
    emissiveIntensity: 0.8,
  });

  const gateGeo = new THREE.BoxGeometry(2.4, 1.2, 0.5);
  const gateMat = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    emissive: 0xec4899,
    emissiveIntensity: 0.9,
  });

  const pylonGeo = new THREE.BoxGeometry(1.6, 3.5, 1.6);
  const pylonMat = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    emissive: 0x8b5cf6,
    emissiveIntensity: 0.7,
  });

  // Coin Geometry (Hexagonal rotating energy core)
  const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.12, 6);
  coinGeo.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  function spawnObstacleCluster(zPos) {
    // FAIRNESS PROTOCOL: Never block all 3 lanes!
    // Pick 1 or 2 lanes to spawn an obstacle or hurdle.
    const laneIndices = [0, 1, 2].sort(() => Math.random() - 0.5);
    const numObstacles = Math.random() > 0.45 ? 2 : 1;

    for (let i = 0; i < numObstacles; i++) {
      const laneIdx = laneIndices[i];
      const laneX = LANES[laneIdx];
      const randType = Math.random();

      let obsMesh;
      let obsType; // 'HURDLE' | 'GATE' | 'PYLON'
      let bounds = { minX: laneX - 1.0, maxX: laneX + 1.0, minY: 0, maxY: 1.0 };

      if (randType < 0.4) {
        // Low Hurdle: Player must JUMP over or switch lane
        obsMesh = new THREE.Mesh(hurdleGeo, hurdleMat);
        obsMesh.position.set(laneX, 0.4, zPos);
        obsType = 'HURDLE';
        bounds = { minX: laneX - 1.1, maxX: laneX + 1.1, minY: 0, maxY: 1.2 };
      } else if (randType < 0.75) {
        // High Overhead Gate: Player must SLIDE under or switch lane
        obsMesh = new THREE.Mesh(gateGeo, gateMat);
        obsMesh.position.set(laneX, 2.2, zPos);
        obsType = 'GATE';
        bounds = { minX: laneX - 1.1, maxX: laneX + 1.1, minY: 1.2, maxY: 3.5 };
      } else {
        // Full Pylon: Player must change lane
        obsMesh = new THREE.Mesh(pylonGeo, pylonMat);
        obsMesh.position.set(laneX, 1.75, zPos);
        obsType = 'PYLON';
        bounds = { minX: laneX - 0.8, maxX: laneX + 0.8, minY: 0, maxY: 4.0 };
      }

      scene.add(obsMesh);
      activeObstacles.push({
        mesh: obsMesh,
        type: obsType,
        lane: laneIdx,
        z: zPos,
        bounds,
      });
    }

    // Spawn Coins in open lane or above hurdles
    const openLane = laneIndices[numObstacles];
    const coinZBase = zPos - 12;
    for (let c = 0; c < 4; c++) {
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      const coinZ = coinZBase + c * 3;
      coinMesh.position.set(LANES[openLane], 1.1, coinZ);
      scene.add(coinMesh);
      activeCoins.push({
        mesh: coinMesh,
        lane: openLane,
        z: coinZ,
        collected: false,
      });
    }
  }

  // Initial obstacle spawn ahead of player
  for (let z = -60; z > -300; z -= 35) {
    spawnObstacleCluster(z);
  }

  // --- CONTROLS: KEYBOARD & MOBILE TOUCH SWIPE ---
  function changeLane(direction) {
    if (gameState !== 'PLAYING') return;
    const nextLane = THREE.MathUtils.clamp(targetLane + direction, 0, 2);
    if (nextLane !== targetLane) {
      targetLane = nextLane;
      audio.playClick();
    }
  }

  function triggerJump() {
    if (gameState !== 'PLAYING') return;
    if (!isJumping) {
      isJumping = true;
      jumpTime = 0;
      isSliding = false; // Cancel slide on jump
      audio.playJumpSound();
    }
  }

  function triggerSlide() {
    if (gameState !== 'PLAYING') return;
    if (!isSliding) {
      isSliding = true;
      slideTime = 0;
      audio.playSlideSound();
    }
  }

  // Keyboard handler
  const onKeyDown = (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'KeyP') {
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
      return;
    }

    if (gameState === 'MENU' && e.code === 'Space') {
      startGame();
      return;
    }

    if (gameState === 'GAMEOVER' && e.code === 'Space') {
      restartGame();
      return;
    }

    if (gameState === 'PLAYING') {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeLane(-1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') changeLane(1);
      else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') triggerJump();
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') triggerSlide();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  // Mobile Pointer / Touch Swipe Detector
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  const onPointerDown = (e) => {
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    touchStartTime = performance.now();
  };

  const onPointerUp = (e) => {
    const dx = e.clientX - touchStartX;
    const dy = e.clientY - touchStartY;
    const dt = performance.now() - touchStartTime;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (gameState === 'PLAYING') {
      if (absDx > 30 || absDy > 30) {
        if (absDx > absDy) {
          // Horizontal swipe
          if (dx > 0) changeLane(1);
          else changeLane(-1);
        } else {
          // Vertical swipe
          if (dy < 0) triggerJump();
          else triggerSlide();
        }
      }
    }
  };

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointerup', onPointerUp);

  // --- GAME STATE TRANSITIONS ---
  function startGame() {
    audio.ensureContext();
    audio.startBGM();
    gameState = 'PLAYING';
    bannerScreen.style.opacity = '0';
    setTimeout(() => {
      bannerScreen.style.display = 'none';
      hud.style.display = 'flex';
    }, 280);
  }

  function pauseGame() {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      audio.stopBGM();
      if (options.onStateChange) options.onStateChange('PAUSED');
    }
  }

  function resumeGame() {
    if (gameState === 'PAUSED') {
      gameState = 'PLAYING';
      audio.startBGM();
      if (options.onStateChange) options.onStateChange('PLAYING');
    }
  }

  function triggerGameOver() {
    gameState = 'GAMEOVER';
    audio.stopBGM();
    audio.playCollisionSound();

    const finalScore = Math.floor(score);
    const storedHs = getStoredBest();
    const isNewBest = finalScore > storedHs;

    if (isNewBest) {
      localStorage.setItem(hsKey, finalScore.toString());
    }

    document.getElementById('go-dist').textContent = `${Math.floor(distance)}m`;
    document.getElementById('go-coins').textContent = `${coins}`;
    document.getElementById('go-score').textContent = `${finalScore.toLocaleString()}`;
    const newBestEl = document.getElementById('go-new-best');
    if (newBestEl) newBestEl.style.display = isNewBest ? 'block' : 'none';

    gameOverScreen.style.display = 'flex';

    if (options.onGameOver) options.onGameOver(finalScore);
  }

  function restartGame() {
    // Reset parameters
    distance = 0;
    coins = 0;
    score = 0;
    speed = BASE_SPEED;
    targetLane = 1;
    currentLane = 1;
    isJumping = false;
    isSliding = false;
    playerGroup.position.set(0, 0, 0);

    // Clear active obstacles & coins
    for (const obs of activeObstacles) scene.remove(obs.mesh);
    activeObstacles.length = 0;

    for (const c of activeCoins) scene.remove(c.mesh);
    activeCoins.length = 0;

    // Respawn initial obstacle stretch
    for (let z = -60; z > -300; z -= 35) {
      spawnObstacleCluster(z);
    }

    gameOverScreen.style.display = 'none';
    gameState = 'PLAYING';
    audio.startBGM();
  }

  // Wire UI Buttons
  document.getElementById('nr-play-btn')?.addEventListener('click', startGame);
  document.getElementById('go-retry-btn')?.addEventListener('click', restartGame);

  const toggleMute = () => {
    const isMuted = !audio.isMuted;
    audio.setMuted(isMuted);
    const muteSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${isMuted
          ? '<line x1="1" y1="1" x2="23" y2="23"></line><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>'
          : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
        }
      </svg>
    `;
    const bMute = document.getElementById('nr-banner-mute-btn');
    const hMute = document.getElementById('hud-mute-btn');
    if (bMute) bMute.innerHTML = muteSvg;
    if (hMute) hMute.innerHTML = muteSvg;
  };

  document.getElementById('nr-banner-mute-btn')?.addEventListener('click', toggleMute);
  document.getElementById('hud-mute-btn')?.addEventListener('click', toggleMute);

  document.getElementById('hud-pause-btn')?.addEventListener('click', () => {
    if (gameState === 'PLAYING') pauseGame();
    else if (gameState === 'PAUSED') resumeGame();
  });

  document.getElementById('nr-how-to-play-btn')?.addEventListener('click', () => {
    alert("NEON RUSH CONTROLS:\n\n• Left / Right Arrows (or Swipe Left / Right) = Switch Lanes\n• Up Arrow / W / Space (or Swipe Up) = Jump over Hurdles\n• Down Arrow / S (or Swipe Down) = Slide under Overhead Gates\n• P = Pause Game");
  });

  // --- RESIZE HANDLER ---
  const onResize = () => {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener('resize', onResize);

  // --- ANIMATION & PHYSICS GAME LOOP ---
  let lastTime = performance.now();
  let animId = null;
  let isDestroyed = false;

  function tick() {
    if (isDestroyed) return;

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;

    if (gameState === 'PLAYING') {
      // Speed progression
      speed = Math.min(speed + dt * 0.35, MAX_SPEED);
      const deltaZ = speed * dt;
      distance += deltaZ;
      score += deltaZ * 1.5;

      // Update HUD
      const distEl = document.getElementById('hud-dist');
      const coinsEl = document.getElementById('hud-coins');
      const scoreEl = document.getElementById('hud-score');
      if (distEl) distEl.textContent = `${Math.floor(distance)}m`;
      if (coinsEl) coinsEl.textContent = `${coins}`;
      if (scoreEl) scoreEl.textContent = `${Math.floor(score)}`;
      if (options.onScoreUpdate) options.onScoreUpdate(Math.floor(score));

      // Player X interpolation (Smooth banking lane switch)
      const targetX = LANES[targetLane];
      playerGroup.position.x = THREE.MathUtils.damp(playerGroup.position.x, targetX, 16, dt);
      playerGroup.rotation.z = THREE.MathUtils.damp(playerGroup.rotation.z, (targetX - playerGroup.position.x) * -0.16, 14, dt);

      // Jump Physics
      if (isJumping) {
        jumpTime += dt;
        const progress = jumpTime / JUMP_DURATION;
        if (progress >= 1.0) {
          isJumping = false;
          playerGroup.position.y = 0;
          audio.playLandSound();
        } else {
          // Parabolic jump arc
          playerGroup.position.y = Math.sin(progress * Math.PI) * JUMP_HEIGHT;
        }
      } else {
        playerGroup.position.y = 0;
      }

      // Slide Physics
      if (isSliding) {
        slideTime += dt;
        if (slideTime >= SLIDE_DURATION) {
          isSliding = false;
          playerGroup.scale.set(1, 1, 1);
        } else {
          // Flatten runner for sliding
          playerGroup.scale.set(1, 0.45, 1.2);
        }
      } else {
        playerGroup.scale.set(1, 1, 1);
      }

      // Runner limb kinematics animation
      runAnimCycle += dt * (speed * 0.85);
      const limbAngle = Math.sin(runAnimCycle) * 0.75;

      if (!isJumping && !isSliding) {
        leftLegGroup.rotation.x = limbAngle;
        rightLegGroup.rotation.x = -limbAngle;
        leftArmGroup.rotation.x = -limbAngle * 0.8;
        rightArmGroup.rotation.x = limbAngle * 0.8;
        torso.position.y = 1.45 + Math.abs(Math.sin(runAnimCycle * 2)) * 0.08;
      } else if (isJumping) {
        // Jumping pose: legs curled up slightly, arms swept back
        leftLegGroup.rotation.x = 0.6;
        rightLegGroup.rotation.x = 0.6;
        leftArmGroup.rotation.x = -0.8;
        rightArmGroup.rotation.x = -0.8;
      }

      // Move Infinite Track Chunks
      for (const chunk of highwayChunks) {
        chunk.position.z += deltaZ;
        if (chunk.position.z > CHUNK_LENGTH) {
          // Find furthest chunk and reposition behind it
          let minZ = 0;
          for (const c of highwayChunks) {
            if (c.position.z < minZ) minZ = c.position.z;
          }
          chunk.position.z = minZ - CHUNK_LENGTH;
        }
      }

      // Move & Check Obstacles
      for (let i = activeObstacles.length - 1; i >= 0; i--) {
        const obs = activeObstacles[i];
        obs.mesh.position.z += deltaZ;
        obs.z = obs.mesh.position.z;

        // Collision Check with Player
        // Player occupies z approx 0.0 (depth 0.8)
        if (obs.z > -1.2 && obs.z < 1.2) {
          const playerX = playerGroup.position.x;
          const playerY = playerGroup.position.y;
          const b = obs.bounds;

          if (playerX >= b.minX && playerX <= b.maxX) {
            // Check Y overlap
            if (obs.type === 'HURDLE') {
              // Can only pass if jumping above hurdle height
              if (playerY < 1.3) {
                triggerGameOver();
                break;
              }
            } else if (obs.type === 'GATE') {
              // Can only pass if sliding under gate
              if (!isSliding) {
                triggerGameOver();
                break;
              }
            } else if (obs.type === 'PYLON') {
              // Cannot jump or slide through pylon
              triggerGameOver();
              break;
            }
          }
        }

        // Recycle passed obstacles
        if (obs.z > 20) {
          scene.remove(obs.mesh);
          activeObstacles.splice(i, 1);
        }
      }

      // Spawn new obstacles ahead if needed
      let furthestObsZ = 0;
      for (const o of activeObstacles) {
        if (o.z < furthestObsZ) furthestObsZ = o.z;
      }
      if (furthestObsZ > -250) {
        spawnObstacleCluster(furthestObsZ - 36);
      }

      // Move & Collect Coins
      for (let i = activeCoins.length - 1; i >= 0; i--) {
        const c = activeCoins[i];
        c.mesh.position.z += deltaZ;
        c.mesh.rotation.z += dt * 3.5;
        c.z = c.mesh.position.z;

        // Check collection
        if (!c.collected && c.z > -1.2 && c.z < 1.2) {
          const dx = Math.abs(playerGroup.position.x - c.mesh.position.x);
          const dy = Math.abs(playerGroup.position.y - (c.mesh.position.y - 1.0));
          if (dx < 1.1 && dy < 1.4) {
            c.collected = true;
            coins++;
            score += 100;
            audio.playCoinSound();
            scene.remove(c.mesh);
          }
        }

        if (c.z > 20 || c.collected) {
          if (!c.collected) scene.remove(c.mesh);
          activeCoins.splice(i, 1);
        }
      }

      // Dynamic Camera follow & banking
      camera.position.x = THREE.MathUtils.damp(camera.position.x, playerGroup.position.x * 0.45, 10, dt);
      camera.position.y = 4.2 + (isJumping ? playerGroup.position.y * 0.3 : 0);
      camera.lookAt(playerGroup.position.x * 0.2, 1.8, -10);
    } else if (gameState === 'MENU') {
      // Gentle idle ambient camera drift
      const t = now * 0.001;
      camera.position.x = Math.sin(t * 0.5) * 1.2;
      camera.lookAt(0, 1.5, -8);
    }

    renderer.render(scene, camera);
    animId = requestAnimationFrame(tick);
  }

  animId = requestAnimationFrame(tick);

  return {
    gameInstance: root,
    pause: () => pauseGame(),
    resume: () => resumeGame(),
    restart: () => restartGame(),
    setMuted: (m) => audio.setMuted(m),
    destroy: () => {
      isDestroyed = true;
      if (animId) cancelAnimationFrame(animId);
      audio.destroy();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointerup', onPointerUp);

      // Clean up Three.js resources
      renderer.dispose();
      asphaltMat.dispose();
      skyscraperMat.dispose();
      windowTexture.dispose();
    },
  };
}
