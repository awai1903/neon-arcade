/**
 * Cyber Invaders — Commercial-Grade Tactical Space Defense Arcade SHMUP
 * AwaisGames Studio Handcrafted Edition
 * Dynamic 4-tier alien fleet, authentic accelerating pulse tempo synth,
 * destructible tactical energy bunkers, mystery UFO sweeps, and instant restart loop.
 */

class InvaderSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.tempoStep = 0;
  }

  ensure() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(m) {
    this.muted = m;
  }

  playLaser() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playAlienLaser() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.16);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playExplosion() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playFleetStep() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [105, 98, 92, 87];
    const freq = freqs[this.tempoStep % freqs.length];
    this.tempoStep++;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playUfoSweep() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(560, now + 0.2);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export function createGame(container, options = {}) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'w-full h-full block';
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const audio = new InvaderSoundEngine();
  audio.setMuted(Boolean(options.isMuted));

  let animFrameId = null;
  let isDestroyed = false;
  let isPaused = false;

  let width = 800;
  let height = 520;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(rect.width || 800, 320);
    height = Math.max(rect.height || 520, 320);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  const HS_KEY = 'awaisgames_hs_cyber-invaders';
  let highScore = parseInt(
    localStorage.getItem(HS_KEY) || localStorage.getItem('neon_arcade_hs_invaders') || '0',
    10
  );

  const logoImg = new Image();
  if (typeof options.getAssetUrl === 'function') {
    logoImg.src = options.getAssetUrl('assets/branding/cyber-invaders-logo.svg');
  }

  let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'
  let score = 0;
  let wave = 1;
  let lives = 3;
  let playerX = width / 2;
  const playerSpeed = 380;
  let playerLaser = null; // { x, y, vy }
  let alienLasers = [];   // [{ x, y, vy }]
  let particles = [];
  let floatingTexts = [];

  // Invader Fleet
  const invaderRows = 4;
  const invaderCols = 9;
  let invaders = [];
  let fleetDirection = 1;
  let fleetStepTimer = 0;
  let fleetStepInterval = 0.8; // Accelerates as fleet shrinks

  // Destructible Bunkers
  let bunkers = [];

  // UFO Sweep
  let ufo = null; // { x, y, speed, points }
  let ufoSpawnTimer = 15;

  // Starfield
  const stars = [];
  for (let i = 0; i < 70; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 15 + Math.random() * 45,
      size: Math.random() < 0.2 ? 2 : 1,
      alpha: 0.3 + Math.random() * 0.7,
    });
  }

  function initBunkers() {
    bunkers = [];
    const count = 4;
    const bunkerW = 54;
    const bunkerH = 34;
    const spacing = width / (count + 1);
    const bunkerY = height - 120;

    for (let b = 0; b < count; b++) {
      const bx = spacing * (b + 1) - bunkerW / 2;
      // Grid of 4x3 blocks inside each bunker
      const parts = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          // Leave open door in center of bottom row
          if (r === 2 && (c === 1 || c === 2)) continue;
          parts.push({
            x: bx + c * (bunkerW / 4),
            y: bunkerY + r * (bunkerH / 3),
            w: bunkerW / 4 - 2,
            h: bunkerH / 3 - 2,
            hp: 3, // 3 hits before destruction
          });
        }
      }
      bunkers.push(parts);
    }
  }

  function spawnWave(w) {
    wave = w;
    invaders = [];
    const spacingX = Math.min(54, (width - 120) / invaderCols);
    const spacingY = 38;
    const startX = (width - (invaderCols - 1) * spacingX) / 2;
    const startY = 70;

    for (let r = 0; r < invaderRows; r++) {
      for (let c = 0; c < invaderCols; c++) {
        let type = 'squid'; // 30 pts
        let points = 30;
        let color = '#ec4899';
        if (r >= 1 && r <= 2) {
          type = 'crab'; // 20 pts
          points = 20;
          color = '#06b6d4';
        } else if (r === 3) {
          type = 'octopus'; // 10 pts
          points = 10;
          color = '#84cc16';
        }

        invaders.push({
          r,
          c,
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          type,
          points,
          color,
          alive: true,
          animFrame: 0,
        });
      }
    }

    fleetDirection = 1;
    fleetStepInterval = Math.max(0.2, 0.75 - (wave - 1) * 0.08);
    fleetStepTimer = fleetStepInterval;
    alienLasers = [];
    playerLaser = null;
  }

  function startNewGame() {
    score = 0;
    lives = 3;
    playerX = width / 2;
    initBunkers();
    spawnWave(1);
    gameState = 'PLAYING';
    if (options.onStateChange) options.onStateChange('PLAYING');
    if (options.onScoreUpdate) options.onScoreUpdate(0);
  }

  // Key controls
  const keys = {};
  const handleKeyDown = (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyP') {
      isPaused = !isPaused;
      if (options.onStateChange) options.onStateChange(isPaused ? 'PAUSED' : 'RUNNING');
    }
    if (e.code === 'Space') {
      if (gameState === 'START' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
        startNewGame();
      } else if (gameState === 'PLAYING') {
        shootPlayerLaser();
      }
    }
  };

  const handleKeyUp = (e) => {
    keys[e.code] = false;
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Pointer touch controls
  let pointerActive = false;
  let pointerTargetX = width / 2;

  const handlePointerDown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (width / rect.width);
    if (gameState === 'START' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
      startNewGame();
      return;
    }
    pointerActive = true;
    pointerTargetX = px;
    shootPlayerLaser();
  };

  const handlePointerMove = (e) => {
    if (!pointerActive) return;
    const rect = canvas.getBoundingClientRect();
    pointerTargetX = (e.clientX - rect.left) * (width / rect.width);
  };

  const handlePointerUp = () => {
    pointerActive = false;
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);

  function shootPlayerLaser() {
    if (playerLaser !== null || gameState !== 'PLAYING') return;
    playerLaser = {
      x: playerX,
      y: height - 55,
      vy: -680,
    };
    audio.playLaser();
  }

  // Main Loop
  let lastTime = performance.now();

  function tick(now) {
    if (isDestroyed) return;
    const dt = Math.min((now - lastTime) / 1000, 0.08);
    lastTime = now;

    if (!isPaused) {
      update(dt);
    }
    render();

    animFrameId = requestAnimationFrame(tick);
  }

  function update(dt) {
    // Starfield animation
    stars.forEach((s) => {
      s.y += s.speed * dt;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });

    if (gameState !== 'PLAYING') return;

    // Player Movement
    let dir = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) dir -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) dir += 1;

    if (pointerActive) {
      const diff = pointerTargetX - playerX;
      if (Math.abs(diff) > 4) {
        playerX += Math.sign(diff) * Math.min(Math.abs(diff), playerSpeed * dt);
      }
    } else {
      playerX += dir * playerSpeed * dt;
    }

    playerX = Math.max(30, Math.min(width - 30, playerX));

    // Player Laser Update
    if (playerLaser) {
      playerLaser.y += playerLaser.vy * dt;

      // Laser collision with Invaders
      for (let i = 0; i < invaders.length; i++) {
        const inv = invaders[i];
        if (!inv.alive) continue;
        if (
          Math.abs(playerLaser.x - inv.x) < 18 &&
          Math.abs(playerLaser.y - inv.y) < 14
        ) {
          inv.alive = false;
          audio.playExplosion();
          score += inv.points;
          addExplosion(inv.x, inv.y, inv.color);
          addFloatingText(`+${inv.points}`, inv.x, inv.y - 12, inv.color);
          playerLaser = null;

          if (score > highScore) {
            highScore = score;
            localStorage.setItem(HS_KEY, highScore.toString());
          }
          if (options.onScoreUpdate) options.onScoreUpdate(score);
          break;
        }
      }

      // Laser collision with Bunkers
      if (playerLaser) {
        bunkers.forEach((parts) => {
          parts.forEach((p) => {
            if (p.hp > 0 && playerLaser) {
              if (
                playerLaser.x >= p.x &&
                playerLaser.x <= p.x + p.w &&
                playerLaser.y >= p.y &&
                playerLaser.y <= p.y + p.h
              ) {
                p.hp -= 1;
                addExplosion(playerLaser.x, playerLaser.y, '#38bdf8', 4);
                playerLaser = null;
              }
            }
          });
        });
      }

      // Laser collision with UFO
      if (playerLaser && ufo) {
        if (Math.abs(playerLaser.x - ufo.x) < 24 && Math.abs(playerLaser.y - ufo.y) < 14) {
          audio.playExplosion();
          score += ufo.points;
          addExplosion(ufo.x, ufo.y, '#ec4899', 24);
          addFloatingText(`+${ufo.points} UFO!`, ufo.x, ufo.y - 14, '#f59e0b');
          playerLaser = null;
          ufo = null;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem(HS_KEY, highScore.toString());
          }
          if (options.onScoreUpdate) options.onScoreUpdate(score);
        }
      }

      // Out of bounds
      if (playerLaser && playerLaser.y < 30) {
        playerLaser = null;
      }
    }

    // Alien Lasers
    for (let i = alienLasers.length - 1; i >= 0; i--) {
      const al = alienLasers[i];
      al.y += al.vy * dt;

      // Hit Player
      if (Math.abs(al.x - playerX) < 18 && Math.abs(al.y - (height - 45)) < 16) {
        alienLasers.splice(i, 1);
        audio.playExplosion();
        addExplosion(playerX, height - 45, '#ec4899', 20);
        lives -= 1;

        if (lives <= 0) {
          gameState = 'GAMEOVER';
          if (options.onGameOver) options.onGameOver(score);
          if (options.onStateChange) options.onStateChange('GAMEOVER');
        }
        continue;
      }

      // Hit Bunker
      let hitBunker = false;
      bunkers.forEach((parts) => {
        parts.forEach((p) => {
          if (p.hp > 0 && !hitBunker) {
            if (al.x >= p.x && al.x <= p.x + p.w && al.y >= p.y && al.y <= p.y + p.h) {
              p.hp -= 1;
              hitBunker = true;
              addExplosion(al.x, al.y, '#ec4899', 4);
            }
          }
        });
      });
      if (hitBunker) {
        alienLasers.splice(i, 1);
        continue;
      }

      // Out of bounds
      if (al.y > height + 20) {
        alienLasers.splice(i, 1);
      }
    }

    // UFO Movement & Spawn
    ufoSpawnTimer -= dt;
    if (ufoSpawnTimer <= 0 && !ufo) {
      ufo = {
        x: -40,
        y: 45,
        speed: 130 + Math.random() * 40,
        points: [100, 150, 200, 300][Math.floor(Math.random() * 4)],
      };
      ufoSpawnTimer = 22 + Math.random() * 15;
    }

    if (ufo) {
      ufo.x += ufo.speed * dt;
      if (Math.random() < 0.05) audio.playUfoSweep();
      if (ufo.x > width + 50) {
        ufo = null;
      }
    }

    // Invader Fleet Step
    const aliveInvaders = invaders.filter((inv) => inv.alive);
    if (aliveInvaders.length === 0) {
      score += 500;
      addFloatingText('WAVE CLEARED! +500', width / 2, height / 2, '#00f0ff');
      spawnWave(wave + 1);
      return;
    }

    fleetStepTimer -= dt;
    if (fleetStepTimer <= 0) {
      // Dynamic tempo: shrinks interval as alive count drops
      const ratio = aliveInvaders.length / invaders.length;
      fleetStepInterval = Math.max(0.12, ratio * 0.75);
      fleetStepTimer = fleetStepInterval;
      audio.playFleetStep();

      // Check boundary breach
      let hitEdge = false;
      aliveInvaders.forEach((inv) => {
        inv.animFrame = 1 - inv.animFrame;
        if (
          (fleetDirection > 0 && inv.x > width - 45) ||
          (fleetDirection < 0 && inv.x < 45)
        ) {
          hitEdge = true;
        }
      });

      if (hitEdge) {
        fleetDirection *= -1;
        aliveInvaders.forEach((inv) => {
          inv.y += 18;
          if (inv.y > height - 100) {
            gameState = 'GAMEOVER';
            if (options.onGameOver) options.onGameOver(score);
          }
        });
      } else {
        aliveInvaders.forEach((inv) => {
          inv.x += fleetDirection * 14;
        });
      }

      // Random alien shoots
      if (Math.random() < 0.65 && alienLasers.length < 4) {
        const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        alienLasers.push({
          x: shooter.x,
          y: shooter.y + 12,
          vy: 280 + wave * 25,
        });
        audio.playAlienLaser();
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 2.2;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update floating text
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= dt * 30;
      ft.life -= dt * 1.2;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  function addExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.8,
        color,
      });
    }
  }

  function addFloatingText(text, x, y, color) {
    floatingTexts.push({ text, x, y, life: 1, color });
  }

  function render() {
    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep space background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Starfield
    stars.forEach((s) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Top HUD
    renderHUD();

    // Draw Destructible Bunkers
    bunkers.forEach((parts) => {
      parts.forEach((p) => {
        if (p.hp > 0) {
          const alpha = p.hp === 3 ? 0.95 : p.hp === 2 ? 0.65 : 0.35;
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.fillRect(p.x, p.y, p.w, p.h);
        }
      });
    });

    // Draw Mystery UFO
    if (ufo) {
      ctx.save();
      ctx.translate(ufo.x, ufo.y);
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Invaders
    invaders.forEach((inv) => {
      if (!inv.alive) return;
      drawInvader(inv.x, inv.y, inv.type, inv.color, inv.animFrame);
    });

    // Draw Player Ship
    drawPlayerShip(playerX, height - 45);

    // Draw Player Laser
    if (playerLaser) {
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(playerLaser.x - 2, playerLaser.y - 12, 4, 14);
    }

    // Draw Alien Lasers
    alienLasers.forEach((al) => {
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 8;
      ctx.fillRect(al.x - 1.5, al.y, 3, 10);
    });

    // Draw Particles
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Draw Floating Text
    floatingTexts.forEach((ft) => {
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = 'bold 15px "Outfit", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1;

    // Overlays
    if (gameState === 'START') {
      renderStartOverlay();
    } else if (gameState === 'GAMEOVER') {
      renderGameOverOverlay();
    }

    ctx.restore();
  }

  function drawPlayerShip(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Shield glow
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 14;

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(16, 12);
    ctx.lineTo(6, 8);
    ctx.lineTo(0, 12);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-16, 12);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawInvader(x, y, type, color, frame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    if (type === 'squid') {
      // 30 pt alien
      ctx.fillRect(-10, -8, 20, 8);
      ctx.fillRect(-6, -12, 12, 4);
      if (frame === 0) {
        ctx.fillRect(-12, 0, 4, 8);
        ctx.fillRect(-4, 0, 8, 6);
        ctx.fillRect(8, 0, 4, 8);
      } else {
        ctx.fillRect(-8, 0, 4, 8);
        ctx.fillRect(-2, 0, 4, 6);
        ctx.fillRect(4, 0, 4, 8);
      }
      // Eyes
      ctx.fillStyle = '#030712';
      ctx.fillRect(-6, -6, 3, 4);
      ctx.fillRect(3, -6, 3, 4);
    } else if (type === 'crab') {
      // 20 pt alien
      ctx.fillRect(-12, -8, 24, 10);
      ctx.fillRect(-8, -12, 16, 4);
      if (frame === 0) {
        ctx.fillRect(-14, 2, 4, 8);
        ctx.fillRect(10, 2, 4, 8);
      } else {
        ctx.fillRect(-10, 2, 4, 8);
        ctx.fillRect(6, 2, 4, 8);
      }
      // Eyes
      ctx.fillStyle = '#030712';
      ctx.fillRect(-7, -5, 4, 4);
      ctx.fillRect(3, -5, 4, 4);
    } else {
      // 10 pt alien (octopus)
      ctx.fillRect(-14, -8, 28, 10);
      if (frame === 0) {
        ctx.fillRect(-12, 2, 4, 6);
        ctx.fillRect(-4, 2, 8, 4);
        ctx.fillRect(8, 2, 4, 6);
      } else {
        ctx.fillRect(-16, 0, 4, 8);
        ctx.fillRect(12, 0, 4, 8);
      }
      // Eyes
      ctx.fillStyle = '#030712';
      ctx.fillRect(-8, -5, 4, 4);
      ctx.fillRect(4, -5, 4, 4);
    }

    ctx.restore();
  }

  function renderHUD() {
    ctx.fillStyle = 'rgba(5, 8, 19, 0.85)';
    ctx.fillRect(0, 0, width, 40);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(width, 40);
    ctx.stroke();

    ctx.font = 'bold 14px "Outfit", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 25);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`WAVE: ${wave}`, 170, 25);

    // Shields (Lives)
    ctx.fillStyle = '#ec4899';
    let shieldsStr = '';
    for (let i = 0; i < lives; i++) shieldsStr += '♥ ';
    ctx.fillText(`SHIELDS: ${shieldsStr}`, 270, 25);

    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'right';
    ctx.fillText(`BEST: ${highScore}`, width - 20, 25);
  }

  function renderStartOverlay() {
    ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const logoW = Math.min(width * 0.75, 400);
      const logoH = logoW * (140 / 540);
      ctx.drawImage(logoImg, width / 2 - logoW / 2, height / 2 - logoH - 15, logoW, logoH);
    } else {
      ctx.font = 'bold 36px "Outfit", sans-serif';
      ctx.fillStyle = '#84cc16';
      ctx.shadowColor = '#84cc16';
      ctx.shadowBlur = 14;
      ctx.fillText('CYBER INVADERS', width / 2, height / 2 - 40);
    }

    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 0;
    ctx.fillText('TAP OR PRESS SPACE TO ENGAGE', width / 2, height / 2 + 25);

    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('A & D / Arrows / Drag to Maneuver · Space to Fire Plasma Cannon', width / 2, height / 2 + 58);
  }

  function renderGameOverOverlay() {
    ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.font = 'bold 34px "Outfit", sans-serif';
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 16;
    ctx.fillText('PERIMETER BREACHED', width / 2, height / 2 - 45);

    ctx.font = 'bold 20px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(`FINAL SCORE: ${score}`, width / 2, height / 2 - 10);

    const isRecord = score >= highScore && score > 0;
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isRecord ? '#00f0ff' : '#64748b';
    ctx.fillText(isRecord ? '★ NEW ALL-TIME RECORD! ★' : `Personal Best: ${highScore}`, width / 2, height / 2 + 20);

    // Instant retry button
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 90, height / 2 + 48, 180, 42, 8);
    ctx.fill();

    ctx.font = 'bold 14px "Outfit", sans-serif';
    ctx.fillStyle = '#050b14';
    ctx.fillText('ENGAGE AGAIN', width / 2, height / 2 + 74);
  }

  // Start ticking
  animFrameId = requestAnimationFrame(tick);

  return {
    gameInstance: canvas,
    pause: () => { isPaused = true; },
    resume: () => { isPaused = false; },
    restart: () => { startNewGame(); },
    setMuted: (m) => { audio.setMuted(m); },
    destroy: () => {
      isDestroyed = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    },
  };
}
