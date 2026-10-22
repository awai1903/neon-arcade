/**
 * Neon Vector Drift — High-Performance 60+ FPS Tunnel Runner
 * Handcrafted vanilla canvas engine with sub-pixel lerp tracking,
 * Pointer Events API, tactile Neon Shield Pulse, and zero-latency instant restart.
 */

class SynthSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
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

  setMuted(m) {
    this.muted = m;
  }

  playShieldPulse() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playShard() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + i * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  playCrash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playDrift() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export function createGame(container, options = {}) {
  // Clear any existing children
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'w-full h-full block';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: false });
  const audio = new SynthSoundEngine();
  audio.setMuted(options.isMuted || false);

  let isDestroyed = false;
  let animFrameId = null;
  let lastTime = performance.now();

  // Screen sizing
  let width = 800;
  let height = 500;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(rect.width || 800, 320);
    height = Math.max(rect.height || 500, 320);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  resize();

  window.addEventListener('resize', resize);

  // High score tracking
  const HS_KEY = 'awaisgames_hs_neon-vector-drift';
  let highScore = parseInt(localStorage.getItem(HS_KEY) || '0', 10);

  // Game state
  let state = 'TITLE'; // 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
  let score = 0;
  let distance = 0;
  let shards = 0;
  let speed = 480;
  const baseSpeed = 480;
  const maxSpeed = 1100;

  // Ship position around tunnel (angle in radians: 0 to 2*PI)
  let playerAngle = Math.PI / 2;
  let targetAngle = Math.PI / 2;
  const tunnelRadius = 140;

  // Neon Shield Pulse state
  let shieldCharge = 1.0; // 0.0 to 1.0
  const shieldCooldownTime = 5.0; // seconds
  let shieldActiveTimer = 0;
  let clutchSaves = 0;

  // Tunnel rings
  const ringCount = 14;
  const rings = [];
  for (let i = 0; i < ringCount; i++) {
    rings.push({ z: (i / ringCount) * 1000, angleOffset: i * 0.1 });
  }

  // Obstacles and Shards
  let obstacles = [];
  let pickups = [];
  let particles = [];
  let spawnDistanceAcc = 0;

  // Touch tracking with Pointer Events API
  let activePointerId = null;
  let touchStartX = 0;
  let touchStartAngle = 0;
  let lastTapTime = 0;

  // Double-tap pulse handler
  function triggerShieldPulse() {
    if (shieldCharge < 0.99 || state !== 'PLAYING') return;

    shieldCharge = 0;
    shieldActiveTimer = 0.55; // active shield duration
    audio.playShieldPulse();

    // Vaporize close obstacles and award clutch bonus
    let saved = false;
    obstacles = obstacles.filter((obs) => {
      if (obs.z < 350) {
        saved = true;
        // Spawn explosion particles
        createExplosion(obs.angle, obs.z, '#00d4ff');
        return false;
      }
      return true;
    });

    if (saved) {
      clutchSaves++;
      score += 250;
      if (options.onScoreUpdate) options.onScoreUpdate(score);
    }

    // Shockwave particles
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      particles.push({
        x: Math.cos(a) * 30,
        y: Math.sin(a) * 30,
        vx: Math.cos(a) * 380,
        vy: Math.sin(a) * 380,
        life: 0.45,
        maxLife: 0.45,
        color: '#00e5ff',
      });
    }
  }

  function createExplosion(angle, z, color = '#ff007f') {
    const scale = 500 / Math.max(z, 50);
    const cx = width / 2;
    const cy = height / 2;
    const px = cx + Math.cos(angle) * tunnelRadius * scale;
    const py = cy + Math.sin(angle) * tunnelRadius * scale;

    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 200;
      particles.push({
        x: px - cx,
        y: py - cy,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.4,
        maxLife: 0.4,
        color,
      });
    }
  }

  // Pointer event listeners on canvas
  function onPointerDown(e) {
    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);
    activePointerId = e.pointerId;
    touchStartX = e.clientX;
    touchStartAngle = targetAngle;

    const now = performance.now();
    if (now - lastTapTime < 280) {
      // Double tap detected!
      triggerShieldPulse();
    }
    lastTapTime = now;

    if (state === 'TITLE') {
      startGame();
    } else if (state === 'GAMEOVER') {
      restartGame();
    }
  }

  function onPointerMove(e) {
    if (activePointerId !== e.pointerId) return;
    e.preventDefault();

    const dx = e.clientX - touchStartX;
    // Ultra-fluid sensitivity: 1px drag = ~0.012 radians
    targetAngle = touchStartAngle + dx * 0.014;
  }

  function onPointerUp(e) {
    if (activePointerId === e.pointerId) {
      activePointerId = null;
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // Keyboard controls
  const keys = {};
  function onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    keys[e.code] = true;

    if (e.code === 'Space') {
      if (state === 'TITLE') startGame();
      else if (state === 'GAMEOVER') restartGame();
      else if (state === 'PLAYING') triggerShieldPulse();
    }

    if (e.code === 'KeyP') {
      togglePause();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function startGame() {
    state = 'PLAYING';
    score = 0;
    distance = 0;
    shards = 0;
    speed = baseSpeed;
    shieldCharge = 1.0;
    obstacles = [];
    pickups = [];
    playerAngle = Math.PI / 2;
    targetAngle = Math.PI / 2;
    if (options.onStateChange) options.onStateChange('PLAYING');
    audio.playDrift();
  }

  function restartGame() {
    startGame();
  }

  function togglePause() {
    if (state === 'PLAYING') {
      state = 'PAUSED';
      if (options.onStateChange) options.onStateChange('PAUSED');
    } else if (state === 'PAUSED') {
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
    }
  }

  function spawnObstacle() {
    const angle = Math.random() * Math.PI * 2;
    // Obstacle arc width in radians
    const arcSpan = 0.9 + Math.random() * 0.7;
    const type = Math.random() > 0.4 ? 'barrier' : 'gate';

    obstacles.push({
      z: 1000,
      angle,
      arcSpan,
      type,
      color: type === 'barrier' ? '#ff0055' : '#a855f7',
    });

    // Spawn bonus shard nearby in the safe zone
    if (Math.random() > 0.35) {
      const safeAngle = angle + Math.PI + (Math.random() - 0.5) * 0.8;
      pickups.push({
        z: 1000,
        angle: safeAngle,
        collected: false,
      });
    }
  }

  function handleGameOver() {
    state = 'GAMEOVER';
    audio.playCrash();

    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HS_KEY, highScore.toString());
    }

    if (options.onGameOver) options.onGameOver(score);
    if (options.onStateChange) options.onStateChange('GAMEOVER');
  }

  // Main 60+ FPS Render & Update Loop
  function tick(now) {
    if (isDestroyed) return;

    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Logic update
    if (state === 'PLAYING') {
      // Keyboard steering
      if (keys['ArrowLeft'] || keys['KeyA']) {
        targetAngle -= 3.2 * dt;
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        targetAngle += 3.2 * dt;
      }

      // Smooth Linear Interpolation (lerp) with zero touch-drag lag
      const diff = targetAngle - playerAngle;
      playerAngle += diff * Math.min(1, 18 * dt);

      // Distance and speed progression
      distance += speed * dt;
      score += Math.round(dt * 20);
      speed = Math.min(maxSpeed, baseSpeed + distance * 0.06);

      // Shield charge regeneration
      if (shieldCharge < 1.0) {
        shieldCharge = Math.min(1.0, shieldCharge + dt / shieldCooldownTime);
      }
      if (shieldActiveTimer > 0) {
        shieldActiveTimer -= dt;
      }

      // Spawning
      spawnDistanceAcc += speed * dt;
      const spawnInterval = Math.max(220, 480 - distance * 0.05);
      if (spawnDistanceAcc > spawnInterval) {
        spawnDistanceAcc = 0;
        spawnObstacle();
      }

      // Update tunnel rings
      rings.forEach((r) => {
        r.z -= speed * dt;
        if (r.z < 20) {
          r.z += 1000;
        }
      });

      // Update Obstacles & Collision Check
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.z -= speed * dt;

        // Collision zone check at player Z depth (~100 to 160)
        if (obs.z >= 70 && obs.z <= 160) {
          // Normalize angles to -PI .. PI
          let angleDiff = Math.abs((playerAngle % (Math.PI * 2)) - (obs.angle % (Math.PI * 2)));
          if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

          if (angleDiff < obs.arcSpan / 2) {
            if (shieldActiveTimer > 0) {
              // Shield absorbed!
              obstacles.splice(i, 1);
              createExplosion(obs.angle, obs.z, '#00e5ff');
              clutchSaves++;
              score += 150;
              continue;
            } else {
              // Fatal collision
              handleGameOver();
              break;
            }
          }
        }

        if (obs.z < 20) {
          obstacles.splice(i, 1);
        }
      }

      // Update Pickups
      for (let i = pickups.length - 1; i >= 0; i--) {
        const pick = pickups[i];
        pick.z -= speed * dt;

        if (pick.z >= 70 && pick.z <= 180 && !pick.collected) {
          let aDiff = Math.abs((playerAngle % (Math.PI * 2)) - (pick.angle % (Math.PI * 2)));
          if (aDiff > Math.PI) aDiff = Math.PI * 2 - aDiff;

          if (aDiff < 0.35) {
            pick.collected = true;
            shards++;
            score += 100;
            audio.playShard();
            createExplosion(pick.angle, pick.z, '#00ffcc');
            if (options.onScoreUpdate) options.onScoreUpdate(score);
          }
        }

        if (pick.z < 20 || pick.collected) {
          pickups.splice(i, 1);
        }
      }

      if (options.onScoreUpdate && Math.floor(now) % 15 === 0) {
        options.onScoreUpdate(score);
      }
    }

    // Particle update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // DRAWING
    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep synthwave background
    ctx.fillStyle = '#030611';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Draw tunnel wireframe rings
    rings.forEach((r) => {
      const scale = 500 / Math.max(r.z, 40);
      const radius = tunnelRadius * scale;
      const alpha = Math.min(1, (1000 - r.z) / 600);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 212, 255, ${alpha * 0.35})`;
      ctx.lineWidth = Math.max(1, 2.5 * scale);
      ctx.stroke();

      // Perspective spoke lines connecting outer rings
      if (r.z < 700) {
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * Math.PI * 2 + r.angleOffset;
          const px = cx + Math.cos(a) * radius;
          const py = cy + Math.sin(a) * radius;
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha * 0.4})`;
          ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
        }
      }
    });

    // Draw Pickups (Hyper-Shards)
    pickups.forEach((pick) => {
      const scale = 500 / Math.max(pick.z, 40);
      const radius = tunnelRadius * scale;
      const px = cx + Math.cos(pick.angle) * radius;
      const py = cy + Math.sin(pick.angle) * radius;
      const size = Math.max(4, 14 * scale);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(now * 0.005);
      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 10;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    });

    // Draw Obstacles (Rotating Neon Barriers)
    obstacles.forEach((obs) => {
      const scale = 500 / Math.max(obs.z, 40);
      const radius = tunnelRadius * scale;
      const startA = obs.angle - obs.arcSpan / 2;
      const endA = obs.angle + obs.arcSpan / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startA, endA);
      ctx.strokeStyle = obs.color;
      ctx.lineWidth = Math.max(4, 14 * scale);
      ctx.lineCap = 'round';
      ctx.shadowColor = obs.color;
      ctx.shadowBlur = Math.min(18, 12 * scale);
      ctx.stroke();
      ctx.restore();
    });

    // Draw Particles
    particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(cx + p.x - 2, cy + p.y - 2, 4, 4);
      ctx.globalAlpha = 1.0;
    });

    // Draw Player Ship (First-person HUD / Cockpit / Drift Ship)
    const shipR = tunnelRadius * (500 / 120); // fixed player depth ~120
    const shipX = cx + Math.cos(playerAngle) * tunnelRadius * 1.05;
    const shipY = cy + Math.sin(playerAngle) * tunnelRadius * 1.05;

    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(playerAngle + Math.PI / 2);

    // Shield aura if active
    if (shieldActiveTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 20;
      ctx.stroke();
    }

    // Ship body
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(14, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-14, 14);
    ctx.closePath();
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Thruster flame
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.lineTo(0, 22 + Math.random() * 6);
    ctx.lineTo(6, 10);
    ctx.closePath();
    ctx.fillStyle = '#ec4899';
    ctx.fill();

    ctx.restore();

    // HUD OVERLAY (Always Crisp & Unboxed)
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText(`SCORE: ${score}`, 20, 32);

    ctx.font = '13px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`DIST: ${Math.floor(distance)}m`, 150, 32);

    ctx.fillStyle = '#a855f7';
    ctx.fillText(`SHARDS: ${shards}`, 270, 32);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`BEST: ${highScore}`, width - 110, 32);

    // Neon Shield Pulse Meter (Bottom Left)
    const meterX = 20;
    const meterY = height - 28;
    const meterW = 140;
    const meterH = 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(meterX, meterY, meterW, meterH);

    const isReady = shieldCharge >= 0.99;
    ctx.fillStyle = isReady ? '#00e5ff' : '#64748b';
    ctx.fillRect(meterX, meterY, meterW * shieldCharge, meterH);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(meterX, meterY, meterW, meterH);

    ctx.font = '10px Outfit, sans-serif';
    ctx.fillStyle = isReady ? '#00e5ff' : '#94a3b8';
    ctx.fillText(
      isReady ? 'SHIELD PULSE READY [DOUBLE TAP / SPACE]' : `SHIELD CHARGING ${Math.floor(shieldCharge * 100)}%`,
      meterX,
      meterY - 5
    );

    // TITLE SCREEN
    if (state === 'TITLE') {
      ctx.fillStyle = 'rgba(3, 6, 17, 0.82)';
      ctx.fillRect(0, 0, width, height);

      ctx.textAlign = 'center';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('NEON VECTOR DRIFT', cx, cy - 40);

      ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.fillText('TAP OR PRESS SPACE TO LAUNCH', cx, cy + 8);

      ctx.font = '12px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Drag / Arrow Keys to Steer · Double-Tap / Space for Emergency Shield Pulse', cx, cy + 46);
      ctx.textAlign = 'left';
    }

    // GAMEOVER SCREEN (Instant sub-300ms transition)
    if (state === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(3, 6, 17, 0.86)';
      ctx.fillRect(0, 0, width, height);

      ctx.textAlign = 'center';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.fillText('DRIFT TERMINATED', cx, cy - 50);

      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`FINAL SCORE: ${score}`, cx, cy - 10);

      const isRecord = score >= highScore && score > 0;
      ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = isRecord ? '#00e5ff' : '#64748b';
      ctx.fillText(isRecord ? '★ NEW ALL-TIME RECORD! ★' : `Personal Best: ${highScore}`, cx, cy + 22);

      // Instant "One-More-Try" button
      ctx.fillStyle = '#00d4ff';
      const btnW = 180;
      const btnH = 42;
      ctx.beginPath();
      ctx.roundRect(cx - btnW / 2, cy + 50, btnW, btnH, 8);
      ctx.fill();

      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.fillStyle = '#030611';
      ctx.fillText('ONE MORE TRY', cx, cy + 76);

      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Press Space or Tap Screen to Retry', cx, cy + 115);
      ctx.textAlign = 'left';
    }

    // PAUSED SCREEN
    if (state === 'PAUSED') {
      ctx.fillStyle = 'rgba(3, 6, 17, 0.75)';
      ctx.fillRect(0, 0, width, height);

      ctx.textAlign = 'center';
      ctx.font = 'bold 30px Outfit, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.fillText('PAUSED', cx, cy - 10);

      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Press P or Tap to Resume', cx, cy + 25);
      ctx.textAlign = 'left';
    }

    ctx.restore();

    animFrameId = requestAnimationFrame(tick);
  }

  animFrameId = requestAnimationFrame(tick);

  return {
    gameInstance: canvas,
    pause: () => {
      if (state === 'PLAYING') state = 'PAUSED';
    },
    resume: () => {
      if (state === 'PAUSED') state = 'PLAYING';
    },
    restart: () => {
      restartGame();
    },
    setMuted: (m) => {
      audio.setMuted(m);
    },
    destroy: () => {
      isDestroyed = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
