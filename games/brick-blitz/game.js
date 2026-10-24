/**
 * Brick Blitz — Neon Breakout Arcade
 * Canvas: 480 x 720
 */

export function createGame(container, options = {}) {
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 720;
  canvas.className = 'brick-blitz-canvas';
  canvas.tabIndex = 0;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Web Audio API
  let audioCtx = null;
  let isMuted = !!options.isMuted;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function playSound(type, param = 1) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      if (type === 'paddle') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'brick') {
        const base = 440 + Math.min(800, param * 70);
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.07);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'powerup') {
        [523, 659, 784, 1046].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.04);
          gain.gain.setValueAtTime(0.18, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.1);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.1);
        });
      } else if (type === 'level') {
        [440, 554, 659, 880].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + i * 0.08);
          gain.gain.setValueAtTime(0.22, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.2);
        });
      } else if (type === 'lose') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  }

  // Storage
  const STORAGE_KEY = 'awaisgames_brick_blitz_hs';
  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch (e) {}

  // Game States
  let state = 'READY'; // READY | PLAYING | PAUSED | GAMEOVER
  let score = 0;
  let level = 1;
  let lives = 3;
  let consecutiveHits = 0;
  let combo = 1;
  let animId = null;
  let lastTime = performance.now();
  let shakeTime = 0;
  let levelClearBannerTime = 0;

  // Paddle
  const BASE_PADDLE_WIDTH = 90;
  const paddle = {
    x: 240,
    y: 660,
    w: BASE_PADDLE_WIDTH,
    h: 14,
    vx: 0,
    targetX: 240,
    wideTimer: 0,
  };

  // Ball
  const BALL_RADIUS = 8;
  const BASE_SPEED = 380;
  let speedMultiplier = 1.0;
  let slowTimer = 0;
  let balls = [];

  // Bricks & Powerups
  let bricks = [];
  let powerups = [];
  let particles = [];
  let popups = [];

  // Input keys
  const keys = { left: false, right: false };

  function getBaseBallSpeed() {
    const lvlSpeed = BASE_SPEED * Math.pow(1.04, level - 1);
    const speed = Math.min(700, lvlSpeed);
    return slowTimer > 0 ? speed * 0.7 : speed;
  }

  function createBall(onPaddle = false) {
    const spd = getBaseBallSpeed();
    return {
      x: paddle.x,
      y: paddle.y - BALL_RADIUS - 1,
      vx: (Math.random() - 0.5) * 120,
      vy: -spd,
      r: BALL_RADIUS,
      onPaddle,
      trail: [],
    };
  }

  // Brick Layout Patterns
  function loadLevel(lvl) {
    bricks = [];
    const patternIdx = (lvl - 1) % 5;
    const rows = 6;
    const cols = 8;
    const bW = 52;
    const bH = 20;
    const gap = 4;
    const startX = (480 - (cols * bW + (cols - 1) * gap)) / 2;
    const startY = 85;

    const rowColors = ['#f43f5e', '#ec4899', '#a855f7', '#3b82f6', '#00d4ff', '#10b981'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let include = true;
        let hp = 1;

        if (patternIdx === 1) {
          // Checkerboard
          include = (r + c) % 2 === 0;
        } else if (patternIdx === 2) {
          // Pyramid
          const margin = r;
          include = c >= margin && c < cols - margin;
        } else if (patternIdx === 3) {
          // Columns
          include = c % 2 === 0;
        } else if (patternIdx === 4) {
          // Diamond
          const dist = Math.abs(3.5 - c) + Math.abs(2.5 - r);
          include = dist <= 3.8;
        }

        if (!include) continue;

        // Brick toughness based on row and level
        if (lvl >= 3 && r === 0 && Math.random() < 0.4) {
          hp = 3; // Steel
        } else if (r <= 1 || (lvl >= 2 && Math.random() < 0.35)) {
          hp = 2; // Tough
        }

        const color = rowColors[r % rowColors.length];
        bricks.push({
          x: startX + c * (bW + gap),
          y: startY + r * (bH + gap),
          w: bW,
          h: bH,
          hp,
          maxHp: hp,
          color,
          rowBonus: rows - r,
        });
      }
    }

    balls = [createBall(true)];
    powerups = [];
    levelClearBannerTime = 1.6;
    playSound('level');
  }

  function resetGame() {
    score = 0;
    level = 1;
    lives = 3;
    combo = 1;
    consecutiveHits = 0;
    slowTimer = 0;
    paddle.w = BASE_PADDLE_WIDTH;
    paddle.wideTimer = 0;
    paddle.x = 240;
    paddle.targetX = 240;
    particles = [];
    popups = [];
    powerups = [];
    loadLevel(1);
    if (options.onScoreUpdate) options.onScoreUpdate(0);
  }

  function launchBall() {
    initAudio();
    if (state === 'READY') {
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
    }
    const stickyBall = balls.find((b) => b.onPaddle);
    if (stickyBall) {
      stickyBall.onPaddle = false;
      const spd = getBaseBallSpeed();
      const angle = (Math.random() - 0.5) * 0.5; // slight tilt
      stickyBall.vx = spd * Math.sin(angle);
      stickyBall.vy = -spd * Math.cos(angle);
      playSound('paddle');
    }
  }

  function dropPowerup(x, y) {
    if (Math.random() > 0.2) return;
    const types = ['W', 'M', 'S', 'L'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerups.push({
      x,
      y,
      vy: 140,
      type,
      w: 24,
      h: 24,
    });
  }

  function applyPowerup(type) {
    playSound('powerup');
    if (type === 'W') {
      paddle.w = BASE_PADDLE_WIDTH * 1.4;
      paddle.wideTimer = 10;
      popups.push({ text: 'WIDE PADDLE', x: paddle.x, y: paddle.y - 25, life: 0.8, maxLife: 0.8, color: '#38bdf8' });
    } else if (type === 'M') {
      const newBalls = [];
      balls.forEach((b) => {
        if (!b.onPaddle) {
          const spd = Math.hypot(b.vx, b.vy);
          [-0.4, 0.4].forEach((da) => {
            const currentAngle = Math.atan2(b.vy, b.vx);
            const a = currentAngle + da;
            newBalls.push({
              x: b.x,
              y: b.y,
              vx: spd * Math.cos(a),
              vy: spd * Math.sin(a),
              r: BALL_RADIUS,
              onPaddle: false,
              trail: [],
            });
          });
        }
      });
      balls.push(...newBalls);
      popups.push({ text: 'MULTI-BALL!', x: paddle.x, y: paddle.y - 25, life: 0.8, maxLife: 0.8, color: '#ec4899' });
    } else if (type === 'S') {
      slowTimer = 8;
      popups.push({ text: 'SLOW BALL', x: paddle.x, y: paddle.y - 25, life: 0.8, maxLife: 0.8, color: '#a855f7' });
    } else if (type === 'L') {
      if (lives < 5) lives++;
      popups.push({ text: '+1 EXTRA LIFE', x: paddle.x, y: paddle.y - 25, life: 0.8, maxLife: 0.8, color: '#10b981' });
    }
  }

  function update(dt) {
    if (shakeTime > 0) shakeTime -= dt;
    if (levelClearBannerTime > 0) levelClearBannerTime -= dt;

    if (state !== 'PLAYING' && state !== 'READY') return;

    // Paddle Powerup Timers
    if (paddle.wideTimer > 0) {
      paddle.wideTimer -= dt;
      if (paddle.wideTimer <= 0) paddle.w = BASE_PADDLE_WIDTH;
    }
    if (slowTimer > 0) {
      slowTimer -= dt;
    }

    // Keyboard paddle movement
    const paddleSpeed = 500;
    if (keys.left) paddle.targetX -= paddleSpeed * dt;
    if (keys.right) paddle.targetX += paddleSpeed * dt;

    // Paddle bounds
    paddle.targetX = Math.max(paddle.w / 2, Math.min(480 - paddle.w / 2, paddle.targetX));
    paddle.x += (paddle.targetX - paddle.x) * Math.min(1, dt * 25);

    // Update Balls
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (b.onPaddle) {
        b.x = paddle.x;
        b.y = paddle.y - b.r - 2;
        continue;
      }

      // Ball Trails
      b.trail.unshift({ x: b.x, y: b.y, life: 0.15 });
      if (b.trail.length > 5) b.trail.pop();

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Enforce minimum vertical speed
      if (Math.abs(b.vy) < 120) {
        b.vy = Math.sign(b.vy || -1) * 120;
      }

      // Wall reflections
      if (b.x - b.r <= 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx);
        playSound('paddle');
      } else if (b.x + b.r >= 480) {
        b.x = 480 - b.r;
        b.vx = -Math.abs(b.vx);
        playSound('paddle');
      }

      if (b.y - b.r <= 0) {
        b.y = b.r;
        b.vy = Math.abs(b.vy);
        playSound('paddle');
      }

      // Paddle collision
      if (
        b.vy > 0 &&
        b.y + b.r >= paddle.y - paddle.h / 2 &&
        b.y - b.r <= paddle.y + paddle.h / 2 &&
        b.x >= paddle.x - paddle.w / 2 - 4 &&
        b.x <= paddle.x + paddle.w / 2 + 4
      ) {
        consecutiveHits = 0;
        combo = 1;
        const hitPos = (b.x - paddle.x) / (paddle.w / 2);
        const clampedHit = Math.max(-1, Math.min(1, hitPos));
        const maxAngle = Math.PI / 3; // 60 degrees
        const angle = clampedHit * maxAngle;
        const spd = Math.max(getBaseBallSpeed(), Math.hypot(b.vx, b.vy));

        b.vx = spd * Math.sin(angle);
        b.vy = -spd * Math.cos(angle);
        b.y = paddle.y - paddle.h / 2 - b.r;
        playSound('paddle');
      }

      // Brick collisions
      for (let j = bricks.length - 1; j >= 0; j--) {
        const br = bricks[j];
        if (
          b.x + b.r >= br.x &&
          b.x - b.r <= br.x + br.w &&
          b.y + b.r >= br.y &&
          b.y - b.r <= br.y + br.h
        ) {
          // Calculate shallowest penetration for reflection
          const overlapX = b.r + br.w / 2 - Math.abs(b.x - (br.x + br.w / 2));
          const overlapY = b.r + br.h / 2 - Math.abs(b.y - (br.y + br.h / 2));

          if (overlapX < overlapY) {
            b.vx = -b.vx;
          } else {
            b.vy = -b.vy;
          }

          br.hp--;
          consecutiveHits++;
          combo = Math.min(4, 1 + Math.floor(consecutiveHits / 5));

          const hitScore = (10 + br.rowBonus * 5) * combo;
          score += hitScore;
          if (options.onScoreUpdate) options.onScoreUpdate(score);
          if (score > bestScore) {
            bestScore = score;
            try {
              localStorage.setItem(STORAGE_KEY, bestScore.toString());
            } catch (e) {}
          }

          playSound('brick', combo);

          // Particles
          for (let p = 0; p < 8; p++) {
            particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 160,
              color: br.color,
              life: 0.35,
              maxLife: 0.35,
              size: 3,
            });
          }

          if (br.hp <= 0) {
            dropPowerup(br.x + br.w / 2, br.y + br.h / 2);
            bricks.splice(j, 1);
          }
          break;
        }
      }

      // Ball fell off screen
      if (b.y - b.r > 720) {
        balls.splice(i, 1);
      }
    }

    // Check if all balls lost
    if (balls.length === 0) {
      lives--;
      shakeTime = 0.3;
      playSound('lose');
      if (lives <= 0) {
        state = 'GAMEOVER';
        if (options.onGameOver) options.onGameOver(score);
        if (options.onStateChange) options.onStateChange('GAMEOVER');
      } else {
        balls = [createBall(true)];
        paddle.wideTimer = 0;
        paddle.w = BASE_PADDLE_WIDTH;
        consecutiveHits = 0;
        combo = 1;
      }
    }

    // Level Clear check
    if (bricks.length === 0) {
      level++;
      loadLevel(level);
    }

    // Update Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.y += p.vy * dt;

      // Caught by paddle
      if (
        p.y + p.h / 2 >= paddle.y - paddle.h / 2 &&
        p.y - p.h / 2 <= paddle.y + paddle.h / 2 &&
        p.x >= paddle.x - paddle.w / 2 &&
        p.x <= paddle.x + paddle.w / 2
      ) {
        applyPowerup(p.type);
        powerups.splice(i, 1);
      } else if (p.y > 720) {
        powerups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update Popups
    for (let i = popups.length - 1; i >= 0; i--) {
      const pop = popups[i];
      pop.y -= 25 * dt;
      pop.life -= dt;
      if (pop.life <= 0) popups.splice(i, 1);
    }
  }

  // Draw Function
  function draw() {
    ctx.save();

    if (shakeTime > 0) {
      const mag = (shakeTime / 0.3) * 6;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // Clear
    ctx.fillStyle = '#080b18';
    ctx.fillRect(0, 0, 480, 720);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 30; x < 480; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }

    // Draw Bricks
    for (const b of bricks) {
      ctx.save();
      ctx.fillStyle = b.color;
      if (b.hp === 3) {
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
      }
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();
      if (b.hp === 3) ctx.stroke();

      // Cracks for damaged tough brick
      if (b.hp === 1 && b.maxHp > 1) {
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x + 8, b.y + 4);
        ctx.lineTo(b.x + 24, b.y + 14);
        ctx.lineTo(b.x + 44, b.y + 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Powerups
    for (const p of powerups) {
      ctx.save();
      const pColor =
        p.type === 'W' ? '#38bdf8' : p.type === 'M' ? '#ec4899' : p.type === 'S' ? '#a855f7' : '#10b981';
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillStyle = pColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type, p.x, p.y);
      ctx.restore();
    }

    // Draw Paddle
    ctx.save();
    ctx.shadowColor = paddle.wideTimer > 0 ? '#ec4899' : '#00d4ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = paddle.wideTimer > 0 ? '#ec4899' : '#00d4ff';
    ctx.beginPath();
    ctx.roundRect(paddle.x - paddle.w / 2, paddle.y - paddle.h / 2, paddle.w, paddle.h, 7);
    ctx.fill();
    // Inner glow core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(paddle.x - paddle.w / 4, paddle.y - 2, paddle.w / 2, 4, 2);
    ctx.fill();
    ctx.restore();

    // Draw Balls
    for (const b of balls) {
      ctx.save();
      // Draw trails
      for (const t of b.trail) {
        ctx.fillStyle = `rgba(0, 212, 255, ${t.life * 2})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, b.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Particles
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Popups
    for (const pop of popups) {
      ctx.save();
      ctx.globalAlpha = pop.life / pop.maxLife;
      ctx.fillStyle = pop.color;
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }

    // Top HUD
    ctx.save();
    ctx.fillStyle = 'rgba(8, 11, 24, 0.85)';
    ctx.fillRect(0, 0, 480, 55);

    // Score & Combo
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${score}`, 18, 36);

    if (combo > 1) {
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`x${combo}`, 90, 35);
    }

    // Level
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level}`, 240, 35);

    // Lives as glowing circles
    ctx.textAlign = 'right';
    for (let l = 0; l < 5; l++) {
      const lx = 460 - l * 18;
      ctx.beginPath();
      ctx.arc(lx, 32, 6, 0, Math.PI * 2);
      if (l < lives) {
        ctx.fillStyle = '#f43f5e';
        ctx.fill();
      } else {
        ctx.strokeStyle = '#334155';
        ctx.stroke();
      }
    }
    ctx.restore();

    // Level Clear Banner
    if (levelClearBannerTime > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
      ctx.fillRect(0, 320, 480, 70);
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 15;
      ctx.fillText(`LEVEL ${level}`, 240, 365);
      ctx.restore();
    }

    // States Overlays
    if (state === 'READY') {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 9, 20, 0.78)';
      ctx.fillRect(0, 0, 480, 720);

      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.textAlign = 'center';
      ctx.fillText('BRICK BLITZ', 240, 260);

      ctx.shadowBlur = 0;
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Smash all bricks • Catch powerup capsules', 240, 310);
      ctx.fillText('Chain consecutive hits for up to x4 multiplier', 240, 335);

      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.roundRect(140, 420, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#060914';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('TAP OR SPACE TO LAUNCH', 240, 450);
      ctx.restore();
    } else if (state === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 9, 20, 0.78)';
      ctx.fillRect(0, 0, 480, 720);
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', 240, 340);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Press P or tap to resume', 240, 380);
      ctx.restore();
    } else if (state === 'GAMEOVER') {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 9, 20, 0.88)';
      ctx.fillRect(0, 0, 480, 720);

      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 18;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', 240, 250);

      ctx.shadowBlur = 0;
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Final Score', 240, 300);

      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${score}`, 240, 355);

      if (score >= bestScore && score > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText('★ NEW HIGH SCORE! ★', 240, 395);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '15px system-ui, sans-serif';
        ctx.fillText(`Best: ${bestScore}`, 240, 395);
      }

      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.roundRect(140, 440, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#060914';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('PLAY AGAIN', 240, 470);
      ctx.restore();
    }

    ctx.restore();
  }

  // Input Handlers
  function onKeyDown(e) {
    if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyP'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'KeyP') {
      if (state === 'PLAYING') {
        state = 'PAUSED';
        if (options.onStateChange) options.onStateChange('PAUSED');
      } else if (state === 'PAUSED') {
        state = 'PLAYING';
        if (options.onStateChange) options.onStateChange('PLAYING');
      }
      return;
    }

    if (state === 'GAMEOVER') {
      if (e.code === 'Space' || e.code === 'Enter') {
        resetGame();
        state = 'PLAYING';
        if (options.onStateChange) options.onStateChange('PLAYING');
      }
      return;
    }

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;

    if (e.code === 'Space') {
      launchBall();
    }
  }

  function onKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scale = 480 / rect.width;
    const clientX = (e.clientX - rect.left) * scale;
    paddle.targetX = clientX;
  }

  function onPointerDown(e) {
    initAudio();
    if (state === 'GAMEOVER') {
      resetGame();
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
      return;
    }
    if (state === 'PAUSED') {
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
      return;
    }
    onPointerMove(e);
    launchBall();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (state !== 'PAUSED') {
      update(dt);
    }
    draw();

    animId = requestAnimationFrame(loop);
  }

  resetGame();
  animId = requestAnimationFrame(loop);

  return {
    pause() {
      if (state === 'PLAYING') {
        state = 'PAUSED';
        if (options.onStateChange) options.onStateChange('PAUSED');
      }
    },
    resume() {
      if (state === 'PAUSED') {
        state = 'PLAYING';
        if (options.onStateChange) options.onStateChange('PLAYING');
      }
    },
    restart() {
      resetGame();
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
    },
    setMuted(mute) {
      isMuted = !!mute;
    },
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch (e) {}
      }
      container.innerHTML = '';
    },
  };
}
