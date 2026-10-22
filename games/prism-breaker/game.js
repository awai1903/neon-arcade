/**
 * Prism Breaker 2077 — High-Retention Synthwave Physics Block-Breaker
 * Inspired by Brick Breaker & 99 Balls.
 * Fluid particle explosions, dynamic combo color-shifting, trajectory beam,
 * responsive canvas scaling, and zero-latency instant restart loop.
 */

class PrismAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
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

  playBounce(combo = 1) {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const baseFreq = Math.min(1200, 260 + combo * 35);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playShatter() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playLaunch() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export function createGame(container, options = {}) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'w-full h-full block';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: false });
  const audio = new PrismAudio();
  audio.setMuted(options.isMuted || false);

  let isDestroyed = false;
  let animId = null;
  let lastTime = performance.now();

  let width = 600;
  let height = 750;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(rect.width || 600, 320);
    height = Math.max(rect.height || 750, 420);
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  const HS_KEY = 'awaisgames_hs_prism-breaker';
  let highScore = parseInt(localStorage.getItem(HS_KEY) || '0', 10);

  // Bespoke SVG brand identity asset
  const logoImg = new Image();
  if (typeof options.getAssetUrl === 'function') {
    logoImg.src = options.getAssetUrl('assets/branding/prism-breaker-logo.svg');
  }

  // Game state
  let state = 'TITLE'; // 'TITLE' | 'AIMING' | 'SHOOTING' | 'GAMEOVER' | 'PAUSED'
  let score = 0;
  let round = 1;
  let combo = 0;
  let maxCombo = 0;

  // Launcher state
  let launcherX = width / 2;
  const launcherY = () => height - 35;
  let ballCount = 18;
  let ballsInPlay = [];
  let ballsToLaunch = 0;
  let launchTimer = 0;
  let launchAngle = -Math.PI / 2;
  let firstReturnedX = null;

  // Aiming touch state
  let isDragging = false;
  let aimX = width / 2;
  let aimY = height / 2;

  // Blocks & Pickups grid
  const cols = 7;
  const blockPadding = 8;
  const getBlockW = () => (width - 40 - (cols - 1) * blockPadding) / cols;
  const blockH = 34;
  let blocks = [];
  let particles = [];
  let powerups = [];

  // Combo color palette (Cyan -> Violet -> Pink -> Amber Gold)
  const comboColors = ['#00d4ff', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  function getComboColor(currentCombo) {
    const idx = Math.min(Math.floor(currentCombo / 8), comboColors.length - 1);
    return comboColors[idx];
  }

  function spawnRow() {
    const bW = getBlockW();
    const startX = 20;
    const startY = 70;

    // Shift existing blocks down
    let breached = false;
    blocks.forEach((b) => {
      b.row += 1;
      b.y = startY + b.row * (blockH + blockPadding);
      if (b.y + blockH >= launcherY() - 10) {
        breached = true;
      }
    });

    powerups.forEach((p) => {
      p.row += 1;
      p.y = startY + p.row * (blockH + blockPadding) + blockH / 2;
    });

    if (breached) {
      handleGameOver();
      return;
    }

    // Generate new top row
    const blockHp = Math.round(round * 1.5);
    for (let c = 0; c < cols; c++) {
      const rand = Math.random();
      const x = startX + c * (bW + blockPadding);
      const y = startY;

      if (rand < 0.52) {
        // Prism Block
        blocks.push({
          x,
          y,
          w: bW,
          h: blockH,
          hp: blockHp + Math.floor(Math.random() * round),
          maxHp: blockHp,
          col: c,
          row: 0,
        });
      } else if (rand > 0.88) {
        // +1 Ball Powerup
        powerups.push({
          x: x + bW / 2,
          y: y + blockH / 2,
          col: c,
          row: 0,
          collected: false,
        });
      }
    }
  }

  function createShatterEffect(x, y, w, h, color) {
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 220;
      particles.push({
        x: x + w / 2,
        y: y + h / 2,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.45,
        maxLife: 0.45,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  function startGame() {
    state = 'AIMING';
    score = 0;
    round = 1;
    combo = 0;
    maxCombo = 0;
    ballCount = 18;
    launcherX = width / 2;
    firstReturnedX = null;
    blocks = [];
    powerups = [];
    particles = [];
    spawnRow();
    spawnRow();
    if (options.onStateChange) options.onStateChange('PLAYING');
  }

  function handleGameOver() {
    state = 'GAMEOVER';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HS_KEY, highScore.toString());
    }
    if (options.onGameOver) options.onGameOver(score);
    if (options.onStateChange) options.onStateChange('GAMEOVER');
  }

  function fireOrbs() {
    if (state !== 'AIMING') return;

    state = 'SHOOTING';
    ballsToLaunch = ballCount;
    launchTimer = 0;
    combo = 0;
    firstReturnedX = null;
    audio.playLaunch();
  }

  // Pointer input
  function onPointerDown(e) {
    e.preventDefault();
    canvas.setPointerCapture?.(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (state === 'TITLE') {
      startGame();
      return;
    }
    if (state === 'GAMEOVER') {
      startGame();
      return;
    }

    if (state === 'AIMING') {
      isDragging = true;
      aimX = px;
      aimY = py;
    }
  }

  function onPointerMove(e) {
    if (!isDragging || state !== 'AIMING') return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    aimX = e.clientX - rect.left;
    aimY = e.clientY - rect.top;

    // Angle from launcher to aim point
    const dx = aimX - launcherX;
    const dy = aimY - launcherY();
    // Only allow firing upwards
    if (dy < -20) {
      launchAngle = Math.atan2(dy, dx);
    }
  }

  function onPointerUp(e) {
    if (isDragging && state === 'AIMING') {
      isDragging = false;
      const dy = aimY - launcherY();
      if (dy < -20) {
        fireOrbs();
      }
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // Keyboard Space to fast forward or fire
  function onKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state === 'TITLE' || state === 'GAMEOVER') {
        startGame();
      } else if (state === 'AIMING') {
        fireOrbs();
      } else if (state === 'SHOOTING') {
        // Fast-forward orbs
        ballsInPlay.forEach((b) => {
          b.vx *= 1.6;
          b.vy *= 1.6;
        });
      }
    }
    if (e.code === 'KeyP') {
      if (state === 'SHOOTING' || state === 'AIMING') state = 'PAUSED';
      else if (state === 'PAUSED') state = 'AIMING';
    }
  }

  window.addEventListener('keydown', onKeyDown);

  // Main Loop
  function tick(now) {
    if (isDestroyed) return;

    const dt = Math.min((now - lastTime) / 1000, 0.04);
    lastTime = now;

    // Firing queue
    if (state === 'SHOOTING') {
      launchTimer += dt;
      if (ballsToLaunch > 0 && launchTimer >= 0.045) {
        launchTimer = 0;
        ballsToLaunch--;
        const ballSpeed = 580;
        ballsInPlay.push({
          x: launcherX,
          y: launcherY(),
          vx: Math.cos(launchAngle) * ballSpeed,
          vy: Math.sin(launchAngle) * ballSpeed,
          r: 5,
        });
      }

      // Update balls in play
      for (let i = ballsInPlay.length - 1; i >= 0; i--) {
        const b = ballsInPlay[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Bounce left / right walls
        if (b.x - b.r < 15) {
          b.x = 15 + b.r;
          b.vx = Math.abs(b.vx);
        } else if (b.x + b.r > width - 15) {
          b.x = width - 15 - b.r;
          b.vx = -Math.abs(b.vx);
        }

        // Bounce ceiling
        if (b.y - b.r < 50) {
          b.y = 50 + b.r;
          b.vy = Math.abs(b.vy);
        }

        // Block collisions
        for (let j = blocks.length - 1; j >= 0; j--) {
          const blk = blocks[j];
          if (
            b.x + b.r > blk.x &&
            b.x - b.r < blk.x + blk.w &&
            b.y + b.r > blk.y &&
            b.y - b.r < blk.y + blk.h
          ) {
            // Hit!
            blk.hp -= 1;
            combo += 1;
            maxCombo = Math.max(maxCombo, combo);
            score += 10 * Math.min(10, Math.floor(combo / 4) + 1);

            audio.playBounce(combo);

            // Determine collision edge to bounce realistically
            const overlapL = Math.abs(b.x + b.r - blk.x);
            const overlapR = Math.abs(blk.x + blk.w - (b.x - b.r));
            const overlapT = Math.abs(b.y + b.r - blk.y);
            const overlapB = Math.abs(blk.y + blk.h - (b.y - b.r));
            const minO = Math.min(overlapL, overlapR, overlapT, overlapB);

            if (minO === overlapT || minO === overlapB) {
              b.vy *= -1;
            } else {
              b.vx *= -1;
            }

            if (blk.hp <= 0) {
              createShatterEffect(blk.x, blk.y, blk.w, blk.h, getComboColor(combo));
              audio.playShatter();
              blocks.splice(j, 1);
            }
            break;
          }
        }

        // Powerup collisions
        for (let k = powerups.length - 1; k >= 0; k--) {
          const p = powerups[k];
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < b.r + 12) {
            p.collected = true;
            ballCount += 1;
            powerups.splice(k, 1);
            createShatterEffect(p.x - 8, p.y - 8, 16, 16, '#00ffcc');
          }
        }

        // Hit floor (return ball)
        if (b.y >= launcherY()) {
          if (firstReturnedX === null) {
            firstReturnedX = Math.max(30, Math.min(width - 30, b.x));
          }
          ballsInPlay.splice(i, 1);
        }
      }

      // If all balls returned, finish round
      if (ballsInPlay.length === 0 && ballsToLaunch === 0) {
        if (firstReturnedX !== null) {
          launcherX = firstReturnedX;
        }
        round += 1;
        state = 'AIMING';
        spawnRow();
        if (options.onScoreUpdate) options.onScoreUpdate(score);
      }
    }

    // Particle update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // DRAWING
    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep synth background
    ctx.fillStyle = '#040714';
    ctx.fillRect(0, 0, width, height);

    // Subtle arena bounds
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 50, width - 30, launcherY() - 50);

    // Bottom floor return zone line
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, launcherY());
    ctx.lineTo(width - 15, launcherY());
    ctx.stroke();

    // Draw Blocks
    const activeColor = getComboColor(combo);
    blocks.forEach((b) => {
      const hpRatio = b.hp / b.maxHp;
      ctx.save();
      ctx.fillStyle = '#0a0f20';
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Glowing border matching combo state
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 8;
      ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);

      // Inner fill bar
      ctx.fillStyle = activeColor;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(b.x + 2, b.y + 2, (b.w - 4) * Math.min(1, hpRatio), b.h - 4);
      ctx.globalAlpha = 1.0;

      // Text counter
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.hp.toString(), b.x + b.w / 2, b.y + b.h / 2);
      ctx.restore();
    });

    // Draw Powerups (+1 Orbs)
    powerups.forEach((p) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.fillStyle = '#040714';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', p.x, p.y);
      ctx.restore();
    });

    // Draw Trajectory Aiming Beam
    if (state === 'AIMING' && isDragging) {
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(launcherX, launcherY());

      // Simple Raycast endpoint
      const rayLen = 320;
      const endX = launcherX + Math.cos(launchAngle) * rayLen;
      const endY = launcherY() + Math.sin(launchAngle) * rayLen;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Laser reticle
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5ff';
      ctx.fill();
      ctx.restore();
    }

    // Draw Balls in Flight
    ballsInPlay.forEach((b) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = activeColor;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    });

    // Draw Particles
    particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    });

    // Draw Launcher Base
    ctx.save();
    ctx.beginPath();
    ctx.arc(launcherX, launcherY(), 14, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 14;
    ctx.fill();

    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.fillStyle = '#040714';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`x${ballCount}`, launcherX, launcherY());
    ctx.restore();

    // TOP HUD
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 32);

    ctx.font = '13px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`WAVE ${round}`, 150, 32);

    if (combo > 1) {
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.fillStyle = activeColor;
      ctx.fillText(`${combo}x COMBO`, 230, 32);
    }

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`BEST: ${highScore}`, width - 110, 32);

    // TITLE SCREEN
    if (state === 'TITLE') {
      ctx.fillStyle = 'rgba(4, 7, 20, 0.88)';
      ctx.fillRect(0, 0, width, height);

      ctx.textAlign = 'center';
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoW = Math.min(width * 0.8, 420);
        const logoH = logoW * (140 / 540);
        ctx.drawImage(logoImg, width / 2 - logoW / 2, height / 2 - logoH - 10, logoW, logoH);
      } else {
        ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRISM BREAKER 2077', width / 2, height / 2 - 30);
      }

      ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.fillText('DRAG DOWN & RELEASE TO AIM', width / 2, height / 2 + 25);

      ctx.font = '12px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Shatter descending blocks before they breach the perimeter', width / 2, height / 2 + 58);
      ctx.textAlign = 'left';
    }

    // GAMEOVER SCREEN (Instant sub-300ms transition)
    if (state === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(4, 7, 20, 0.88)';
      ctx.fillRect(0, 0, width, height);

      ctx.textAlign = 'center';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.fillText('PERIMETER BREACHED', width / 2, height / 2 - 50);

      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`FINAL SCORE: ${score}`, width / 2, height / 2 - 10);

      ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = score >= highScore && score > 0 ? '#00d4ff' : '#64748b';
      ctx.fillText(`Highest Combo: ${maxCombo}x · Record: ${highScore}`, width / 2, height / 2 + 20);

      // Instant "One-More-Try" button
      ctx.fillStyle = '#00d4ff';
      const btnW = 180;
      const btnH = 42;
      ctx.beginPath();
      ctx.roundRect(width / 2 - btnW / 2, height / 2 + 50, btnW, btnH, 8);
      ctx.fill();

      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.fillStyle = '#040714';
      ctx.fillText('ONE MORE TRY', width / 2, height / 2 + 76);

      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Tap Screen or Press Space to Retry', width / 2, height / 2 + 115);
      ctx.textAlign = 'left';
    }

    ctx.restore();
    animId = requestAnimationFrame(tick);
  }

  animId = requestAnimationFrame(tick);

  return {
    gameInstance: canvas,
    pause: () => {
      if (state === 'SHOOTING' || state === 'AIMING') state = 'PAUSED';
    },
    resume: () => {
      if (state === 'PAUSED') state = 'AIMING';
    },
    restart: () => {
      startGame();
    },
    setMuted: (m) => {
      audio.setMuted(m);
    },
    destroy: () => {
      isDestroyed = true;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
