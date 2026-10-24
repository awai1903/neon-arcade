/**
 * Mole Madness — 60-Second Whack-a-Mole Arcade
 * Canvas: 480 x 720
 */

export function createGame(container, options = {}) {
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 720;
  canvas.className = 'mole-madness-canvas';
  canvas.tabIndex = 0;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Web Audio
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
      if (type === 'whack') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 * param, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'gold') {
        [659, 880, 1175, 1568].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.05);
          gain.gain.setValueAtTime(0.2, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.12);
        });
      } else if (type === 'bomb') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'freeze') {
        [1046, 1318, 1567].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.04);
          gain.gain.setValueAtTime(0.18, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.15);
        });
      } else if (type === 'miss') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {}
  }

  // Storage
  const STORAGE_KEY = 'awaisgames_mole_madness_hs';
  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch (e) {}

  // 12 Holes (3 cols x 4 rows)
  const HOLES = [];
  const colXs = [85, 240, 395];
  const rowYs = [180, 300, 420, 540];
  const KEY_LABELS = ['Q', 'W', 'E', 'A', 'S', 'D', 'Z', 'X', 'C', '1', '2', '3'];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      HOLES.push({
        id: idx,
        x: colXs[c],
        y: rowYs[r],
        key: KEY_LABELS[idx],
        critter: null, // null | { type, timeVisible, maxTime, state: 'rising'|'stay'|'hiding'|'whacked', popProgress: 0..1 }
      });
    }
  }

  // Game States
  let state = 'READY'; // READY | PLAYING | PAUSED | GAMEOVER
  let score = 0;
  let timeLeft = 60;
  let freezeTimer = 0;
  let combo = 1;
  let totalSwings = 0;
  let hitsCount = 0;
  let spawnTimer = 0;
  let shakeTime = 0;
  let redFlashTime = 0;

  let animId = null;
  let lastTime = performance.now();

  // Hammer visual state
  const hammer = {
    x: 240,
    y: 360,
    swingProgress: 1, // 0..1
    targetX: 240,
    targetY: 360,
  };

  let particles = [];
  let popups = [];

  function resetGame() {
    score = 0;
    timeLeft = 60;
    freezeTimer = 0;
    combo = 1;
    totalSwings = 0;
    hitsCount = 0;
    spawnTimer = 0;
    shakeTime = 0;
    redFlashTime = 0;
    particles = [];
    popups = [];
    HOLES.forEach((h) => (h.critter = null));
    if (options.onScoreUpdate) options.onScoreUpdate(0);
  }

  function spawnCritter() {
    const activeCount = HOLES.filter((h) => h.critter !== null).length;
    if (activeCount >= 3) return;

    const emptyHoles = HOLES.filter((h) => h.critter === null);
    if (emptyHoles.length === 0) return;

    const hole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];

    // Critter type distribution
    const roll = Math.random();
    let type = 'MOLE';
    if (roll < 0.7) type = 'MOLE';
    else if (roll < 0.78) type = 'GOLDEN';
    else if (roll < 0.93) type = 'BOMB';
    else type = 'FREEZE';

    // Speed scaling
    const progress = Math.max(0, (60 - timeLeft) / 60);
    const maxTime = 1.1 - progress * 0.5; // 1.1s down to 0.6s

    hole.critter = {
      type,
      timeVisible: 0,
      maxTime,
      state: 'rising',
      popProgress: 0,
    };
  }

  function whackHole(hole) {
    initAudio();
    if (state === 'READY') {
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
    }
    if (state !== 'PLAYING') return;

    totalSwings++;
    hammer.targetX = hole.x;
    hammer.targetY = hole.y - 10;
    hammer.swingProgress = 0;

    const critter = hole.critter;
    if (critter && critter.state !== 'whacked' && critter.popProgress > 0.25) {
      hitsCount++;
      critter.state = 'whacked';

      if (critter.type === 'MOLE') {
        const pts = 10 * combo;
        score += pts;
        combo = Math.min(5, combo + 1);
        playSound('whack', 1 + combo * 0.1);
        popups.push({
          text: `+${pts}${combo > 1 ? ` (x${combo})` : ''}`,
          x: hole.x,
          y: hole.y - 45,
          life: 0.6,
          maxLife: 0.6,
          color: '#fbbf24',
        });

        // Dirt particles
        for (let i = 0; i < 12; i++) {
          particles.push({
            x: hole.x,
            y: hole.y - 15,
            vx: (Math.random() - 0.5) * 160,
            vy: -Math.random() * 140,
            color: '#78350f',
            life: 0.4,
            maxLife: 0.4,
            size: 3.5,
          });
        }
      } else if (critter.type === 'GOLDEN') {
        const pts = 30 * combo;
        score += pts;
        timeLeft = Math.min(60, timeLeft + 2);
        combo = Math.min(5, combo + 1);
        playSound('gold');
        popups.push({
          text: `+${pts} +2s!`,
          x: hole.x,
          y: hole.y - 45,
          life: 0.8,
          maxLife: 0.8,
          color: '#fef08a',
        });

        // Golden stars
        for (let i = 0; i < 18; i++) {
          particles.push({
            x: hole.x,
            y: hole.y - 15,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 180,
            color: '#fde047',
            life: 0.5,
            maxLife: 0.5,
            size: 4,
          });
        }
      } else if (critter.type === 'BOMB') {
        score = Math.max(0, score - 15);
        timeLeft = Math.max(0, timeLeft - 3);
        combo = 1;
        shakeTime = 0.4;
        redFlashTime = 0.35;
        playSound('bomb');
        popups.push({
          text: '-15 pts -3s!',
          x: hole.x,
          y: hole.y - 45,
          life: 0.8,
          maxLife: 0.8,
          color: '#ef4444',
        });

        // Smoke & fire particles
        for (let i = 0; i < 22; i++) {
          particles.push({
            x: hole.x,
            y: hole.y - 15,
            vx: (Math.random() - 0.5) * 240,
            vy: (Math.random() - 0.5) * 240,
            color: Math.random() < 0.5 ? '#f97316' : '#ef4444',
            life: 0.5,
            maxLife: 0.5,
            size: 5,
          });
        }
      } else if (critter.type === 'FREEZE') {
        freezeTimer = 3.0;
        score += 15;
        playSound('freeze');
        popups.push({
          text: 'BLIZZARD FREEZE!',
          x: hole.x,
          y: hole.y - 45,
          life: 0.9,
          maxLife: 0.9,
          color: '#38bdf8',
        });

        // Frost particles
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: hole.x,
            y: hole.y - 15,
            vx: (Math.random() - 0.5) * 220,
            vy: (Math.random() - 0.5) * 220,
            color: '#bae6fd',
            life: 0.6,
            maxLife: 0.6,
            size: 3.5,
          });
        }
      }

      if (options.onScoreUpdate) options.onScoreUpdate(score);
      if (score > bestScore) {
        bestScore = score;
        try {
          localStorage.setItem(STORAGE_KEY, bestScore.toString());
        } catch (e) {}
      }
    } else {
      // Missed hit!
      combo = 1;
      playSound('miss');
    }
  }

  function update(dt) {
    if (shakeTime > 0) shakeTime -= dt;
    if (redFlashTime > 0) redFlashTime -= dt;

    if (state !== 'PLAYING') return;

    // Timer countdown
    timeLeft = Math.max(0, timeLeft - dt);
    if (timeLeft <= 0) {
      state = 'GAMEOVER';
      if (options.onGameOver) options.onGameOver(score);
      if (options.onStateChange) options.onStateChange('GAMEOVER');
      return;
    }

    if (freezeTimer > 0) {
      freezeTimer -= dt;
    }

    // Spawn logic
    if (freezeTimer <= 0) {
      const progress = Math.max(0, (60 - timeLeft) / 60);
      const spawnInterval = 0.9 - progress * 0.55; // 0.9s down to 0.35s
      spawnTimer += dt;
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnCritter();
      }
    }

    // Update critters in holes
    for (const hole of HOLES) {
      const c = hole.critter;
      if (!c) continue;

      if (c.state === 'whacked') {
        c.popProgress -= dt * 4;
        if (c.popProgress <= 0) hole.critter = null;
        continue;
      }

      // If freeze active, freeze progress
      if (freezeTimer > 0) continue;

      if (c.state === 'rising') {
        c.popProgress = Math.min(1, c.popProgress + dt * 4);
        if (c.popProgress >= 1) c.state = 'stay';
      } else if (c.state === 'stay') {
        c.timeVisible += dt;
        if (c.timeVisible >= c.maxTime) {
          c.state = 'hiding';
        }
      } else if (c.state === 'hiding') {
        c.popProgress = Math.max(0, c.popProgress - dt * 3.5);
        if (c.popProgress <= 0) hole.critter = null;
      }
    }

    // Hammer animation
    if (hammer.swingProgress < 1) {
      hammer.swingProgress = Math.min(1, hammer.swingProgress + dt / 0.12);
    }
    hammer.x += (hammer.targetX - hammer.x) * Math.min(1, dt * 25);
    hammer.y += (hammer.targetY - hammer.y) * Math.min(1, dt * 25);

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Popups
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
      const mag = (shakeTime / 0.4) * 8;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // Background
    ctx.fillStyle = '#0a101f';
    ctx.fillRect(0, 0, 480, 720);

    // Blizzard Freeze Tint
    if (freezeTimer > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(0, 0, 480, 720);
    }

    // Red Flash on Bomb
    if (redFlashTime > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${redFlashTime * 1.5})`;
      ctx.fillRect(0, 0, 480, 720);
    }

    // Draw Holes and Critters
    for (const hole of HOLES) {
      // 1. Back Rim of Hole
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(hole.x, hole.y, 48, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Hole Pit Interior
      ctx.fillStyle = '#050811';
      ctx.beginPath();
      ctx.ellipse(hole.x, hole.y + 4, 42, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Critter rising out of pit (clipped to upper half)
      const c = hole.critter;
      if (c && c.popProgress > 0) {
        ctx.save();
        ctx.beginPath();
        // Clip region above hole base
        ctx.rect(hole.x - 45, hole.y - 75, 90, 80);
        ctx.clip();

        const popY = hole.y + 10 - c.popProgress * 48;

        if (c.type === 'MOLE' || c.type === 'GOLDEN') {
          const isGold = c.type === 'GOLDEN';
          ctx.save();
          if (isGold) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 15;
          }

          // Mole Body
          ctx.fillStyle = isGold ? '#f59e0b' : '#854d0e';
          ctx.beginPath();
          ctx.roundRect(hole.x - 26, popY - 32, 52, 60, 24);
          ctx.fill();

          // Cheeks / Snout
          ctx.fillStyle = isGold ? '#fef08a' : '#fed7aa';
          ctx.beginPath();
          ctx.ellipse(hole.x, popY - 8, 14, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Nose
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.ellipse(hole.x, popY - 12, 5, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(hole.x - 9, popY - 20, 4.5, 0, Math.PI * 2);
          ctx.arc(hole.x + 9, popY - 20, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(hole.x - 8, popY - 20, 2, 0, Math.PI * 2);
          ctx.arc(hole.x + 10, popY - 20, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } else if (c.type === 'BOMB') {
          // Black bomb
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(hole.x, popY - 10, 22, 0, Math.PI * 2);
          ctx.fill();

          // Fuse
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(hole.x, popY - 32);
          ctx.quadraticCurveTo(hole.x + 8, popY - 42, hole.x + 14, popY - 38);
          ctx.stroke();

          // Spark
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(hole.x + 14, popY - 38, 4, 0, Math.PI * 2);
          ctx.fill();

          // TNT Text
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'center';
          ctx.fillText('TNT', hole.x, popY - 6);
        } else if (c.type === 'FREEZE') {
          // Snowflake Orb
          ctx.save();
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(hole.x, popY - 10, 20, 0, Math.PI * 2);
          ctx.fill();

          // Snowflake lines
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          for (let a = 0; a < 3; a++) {
            ctx.beginPath();
            const angle = (a * Math.PI) / 3;
            ctx.moveTo(hole.x + Math.cos(angle) * 14, popY - 10 + Math.sin(angle) * 14);
            ctx.lineTo(hole.x - Math.cos(angle) * 14, popY - 10 - Math.sin(angle) * 14);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.restore();
      }

      // 4. Front Dirt Lip
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(hole.x, hole.y + 4, 46, 12, 0, 0, Math.PI);
      ctx.fill();

      // Key binding label
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(hole.key, hole.x, hole.y + 32);
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
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }

    // Draw Animated Hammer
    ctx.save();
    const swingAngle = Math.sin(hammer.swingProgress * Math.PI) * -0.7; // Swing arc
    ctx.translate(hammer.x, hammer.y);
    ctx.rotate(swingAngle);

    // Handle
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-5, 0, 10, 52);
    // Head
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(-22, -18, 44, 22);
    ctx.restore();

    // Top HUD
    ctx.save();
    ctx.fillStyle = 'rgba(10, 16, 31, 0.85)';
    ctx.fillRect(0, 0, 480, 75);

    // Score & Combo
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${score}`, 20, 40);

    if (combo > 1) {
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`x${combo}`, 105, 38);
    }

    // Time Seconds
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillStyle = timeLeft < 10 ? '#ef4444' : '#38bdf8';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(timeLeft)}s`, 460, 40);

    // Timer Progress Bar
    const barWidth = 440;
    const barProgress = Math.max(0, timeLeft / 60);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 58, barWidth, 6);
    ctx.fillStyle = timeLeft < 10 ? '#ef4444' : '#10b981';
    ctx.fillRect(20, 58, barWidth * barProgress, 6);
    ctx.restore();

    // Overlays
    if (state === 'READY') {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 16, 31, 0.82)';
      ctx.fillRect(0, 0, 480, 720);

      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText('MOLE MADNESS', 240, 240);

      ctx.shadowBlur = 0;
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Whack moles for +10 pts and chain combos', 240, 290);
      ctx.fillText('★ Golden moles give +30 pts and +2 seconds!', 240, 315);
      ctx.fillText('❄ Freeze slows everything for 3s', 240, 340);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('⚠ DO NOT HIT TNT BOMBS (-15 pts, -3s)', 240, 365);

      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Click/tap holes or use keys:', 240, 415);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Q W E  /  A S D  /  Z X C  /  1 2 3', 240, 440);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(140, 480, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#451a03';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('START GAME', 240, 510);
      ctx.restore();
    } else if (state === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 16, 31, 0.82)';
      ctx.fillRect(0, 0, 480, 720);
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', 240, 340);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Press P or tap to resume', 240, 380);
      ctx.restore();
    } else if (state === 'GAMEOVER') {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 16, 31, 0.88)';
      ctx.fillRect(0, 0, 480, 720);

      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText('TIME UP!', 240, 230);

      ctx.shadowBlur = 0;
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Final Score', 240, 280);

      ctx.font = 'bold 50px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${score}`, 240, 335);

      const acc = totalSwings > 0 ? Math.round((hitsCount / totalSwings) * 100) : 0;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Accuracy: ${acc}%  (${hitsCount}/${totalSwings} hits)`, 240, 375);

      if (score >= bestScore && score > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('★ NEW HIGH SCORE! ★', 240, 410);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Best: ${bestScore}`, 240, 410);
      }

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(140, 460, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#451a03';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('PLAY AGAIN', 240, 490);
      ctx.restore();
    }

    ctx.restore();
  }

  // Keyboard shortcut mapping
  const KEY_MAP = {
    KeyQ: 0,
    KeyW: 1,
    KeyE: 2,
    KeyA: 3,
    KeyS: 4,
    KeyD: 5,
    KeyZ: 6,
    KeyX: 7,
    KeyC: 8,
    Digit1: 9,
    Digit2: 10,
    Digit3: 11,
  };

  function onKeyDown(e) {
    if (['Space', 'KeyP', ...Object.keys(KEY_MAP)].includes(e.code)) {
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

    if (KEY_MAP[e.code] !== undefined) {
      const idx = KEY_MAP[e.code];
      const hole = HOLES[idx];
      if (hole) whackHole(hole);
    }
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
    if (state === 'READY') {
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = 480 / rect.width;
    const scaleY = 720 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked hole
    let clickedHole = null;
    let minDist = 55;
    for (const hole of HOLES) {
      const dist = Math.hypot(clickX - hole.x, clickY - hole.y);
      if (dist < minDist) {
        minDist = dist;
        clickedHole = hole;
      }
    }

    if (clickedHole) {
      whackHole(clickedHole);
    } else {
      // Whacked empty dirt
      totalSwings++;
      combo = 1;
      hammer.targetX = clickX;
      hammer.targetY = clickY;
      hammer.swingProgress = 0;
      playSound('miss');
    }
  }

  window.addEventListener('keydown', onKeyDown);
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
