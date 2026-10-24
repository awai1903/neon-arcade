/**
 * Color Gate Dash — One-Tap Chromatic Jumper
 * Canvas: 450 x 750
 */

export function createGame(container, options = {}) {
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = 450;
  canvas.height = 750;
  canvas.className = 'color-gate-dash-canvas';
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

  function playSound(type) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      if (type === 'jump') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'color') {
        [523, 784, 1046].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + i * 0.04);
          gain.gain.setValueAtTime(0.2, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.12);
        });
      } else if (type === 'gate') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'star') {
        [880, 1174, 1760].forEach((f, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.05);
          gain.gain.setValueAtTime(0.2, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.15);
        });
      } else if (type === 'death') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {}
  }

  // Storage
  const STORAGE_KEY = 'awaisgames_color_gate_dash_hs';
  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch (e) {}

  // 4 Neon Colors
  const COLORS = ['#00e5ff', '#ff2bd6', '#ffd400', '#18ff6d'];

  // Game States
  let state = 'READY'; // READY | PLAYING | PAUSED | GAMEOVER
  let score = 0;
  let animId = null;
  let lastTime = performance.now();
  let shakeTime = 0;
  let slowMoTimer = 0;

  // Player
  const player = {
    x: 225,
    y: 500,
    vy: 0,
    r: 12,
    color: COLORS[0],
    alive: true,
  };

  // Camera & Gates
  let cameraY = 500;
  let gates = [];
  let changers = [];
  let stars = [];
  let nextGateIndex = 0;
  const GATE_SPACING = 330;

  // Visual Effects
  let particles = [];
  let popups = [];
  let bgDots = [];

  for (let i = 0; i < 35; i++) {
    bgDots.push({
      x: Math.random() * 450,
      y: Math.random() * 750,
      r: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
    });
  }

  function spawnGate(idx) {
    const y = 500 - (idx + 1) * GATE_SPACING;
    const type = idx % 2 === 0 ? 'RING' : 'BAR';
    const diff = Math.min(2.5, Math.pow(1.03, idx));

    const gateColors = [...COLORS].sort(() => Math.random() - 0.5);

    const gate = {
      index: idx,
      y,
      type,
      passed: false,
      colors: gateColors,
      // Bar properties
      offset: Math.random() * 450,
      speed: (75 + Math.random() * 25) * diff * (Math.random() < 0.5 ? 1 : -1),
      // Ring properties
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (1.2 + Math.random() * 0.3) * diff * (Math.random() < 0.5 ? 1 : -1),
      radius: 75,
    };

    gates.push(gate);

    // Color changer between gates
    const changerY = y + GATE_SPACING / 2;
    changers.push({
      x: 225,
      y: changerY,
      r: 14,
      collected: false,
      rot: 0,
    });

    // Star bonus (50% chance between gates)
    if (Math.random() < 0.6) {
      stars.push({
        x: 225,
        y: type === 'RING' ? y : y - 60,
        r: 10,
        collected: false,
      });
    }
  }

  function resetGame() {
    score = 0;
    cameraY = 500;
    shakeTime = 0;
    slowMoTimer = 0;
    particles = [];
    popups = [];
    gates = [];
    changers = [];
    stars = [];

    player.x = 225;
    player.y = 500;
    player.vy = 0;
    player.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    player.alive = true;

    for (let i = 0; i < 5; i++) {
      spawnGate(i);
    }
    nextGateIndex = 5;

    if (options.onScoreUpdate) options.onScoreUpdate(0);
  }

  function jump() {
    initAudio();
    if (state === 'READY') {
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
    }
    if (state !== 'PLAYING' || !player.alive) return;

    player.vy = -380;
    playSound('jump');

    // Small thrust particles
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: player.x,
        y: getScreenY(player.y) + player.r,
        vx: (Math.random() - 0.5) * 80,
        vy: Math.random() * 90 + 30,
        color: player.color,
        life: 0.25,
        maxLife: 0.25,
        size: 3,
      });
    }
  }

  function triggerDeath() {
    if (!player.alive) return;
    player.alive = false;
    shakeTime = 0.4;
    slowMoTimer = 0.6;
    playSound('death');

    // Particle explosion
    for (let i = 0; i < 28; i++) {
      particles.push({
        x: player.x,
        y: getScreenY(player.y),
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.5) * 260,
        color: player.color,
        life: 0.6,
        maxLife: 0.6,
        size: 4.5,
      });
    }

    setTimeout(() => {
      state = 'GAMEOVER';
      if (options.onGameOver) options.onGameOver(score);
      if (options.onStateChange) options.onStateChange('GAMEOVER');
    }, 700);
  }

  function getScreenY(worldY) {
    // 65% of 750 = 488px
    return 488 - (worldY - cameraY);
  }

  function update(dt) {
    if (shakeTime > 0) shakeTime -= dt;

    if (slowMoTimer > 0) {
      slowMoTimer -= dt;
      dt *= 0.3; // Slow-motion dramatic effect
    }

    if (state !== 'PLAYING') return;

    // Spawn more gates ahead
    while (gates.length < 5 || gates[gates.length - 1].y > player.y - 1200) {
      spawnGate(nextGateIndex++);
    }
    // Clean old gates far behind
    gates = gates.filter((g) => g.y < player.y + 700);
    changers = changers.filter((c) => c.y < player.y + 700);
    stars = stars.filter((s) => s.y < player.y + 700);

    if (player.alive) {
      // Physics
      player.vy += 1100 * dt;
      player.y += player.vy * dt;

      // Smooth camera follows player upward
      if (player.y < cameraY) {
        cameraY = player.y;
      }

      // Check fall below screen bottom
      const pScreenY = getScreenY(player.y);
      if (pScreenY > 750 + player.r) {
        triggerDeath();
      }

      // Check Gate collisions and passing
      for (const gate of gates) {
        // Passed gate
        if (!gate.passed && player.y < gate.y - 30) {
          gate.passed = true;
          score += 1;
          playSound('gate');
          if (options.onScoreUpdate) options.onScoreUpdate(score);
          if (score > bestScore) {
            bestScore = score;
            try {
              localStorage.setItem(STORAGE_KEY, bestScore.toString());
            } catch (e) {}
          }
        }

        // Collision detection
        if (gate.type === 'BAR') {
          // Bar at gate.y, thickness 20
          if (player.y + player.r >= gate.y - 10 && player.y - player.r <= gate.y + 10) {
            const segW = 450 / 4; // 112.5
            const relX = ((player.x - gate.offset) % 450 + 450) % 450;
            const segIdx = Math.floor(relX / segW) % 4;
            const segColor = gate.colors[segIdx];
            if (segColor !== player.color) {
              triggerDeath();
            }
          }
        } else if (gate.type === 'RING') {
          // Ring center is (225, gate.y), radius 75, thickness 14
          const dy = player.y - gate.y;
          const dist = Math.abs(dy); // Player x is fixed at center 225

          if (Math.abs(dist - gate.radius) <= player.r + 6) {
            // Player is touching the rim at top or bottom
            const crossingAngle = dy > 0 ? Math.PI / 2 : -Math.PI / 2;
            const relAngle = ((crossingAngle - gate.rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const arcIdx = Math.floor(relAngle / (Math.PI / 2)) % 4;
            const arcColor = gate.colors[arcIdx];

            if (arcColor !== player.color) {
              triggerDeath();
            }
          }
        }
      }

      // Check Color Changer collision
      for (const changer of changers) {
        if (!changer.collected) {
          const dist = Math.hypot(player.x - changer.x, player.y - changer.y);
          if (dist < player.r + changer.r) {
            changer.collected = true;
            // Pick a different color
            const remaining = COLORS.filter((c) => c !== player.color);
            player.color = remaining[Math.floor(Math.random() * remaining.length)];
            playSound('color');

            // Burst particles of the new color
            for (let i = 0; i < 16; i++) {
              particles.push({
                x: changer.x,
                y: getScreenY(changer.y),
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                color: player.color,
                life: 0.45,
                maxLife: 0.45,
                size: 4,
              });
            }
          }
        }
      }

      // Check Star collision
      for (const star of stars) {
        if (!star.collected) {
          const dist = Math.hypot(player.x - star.x, player.y - star.y);
          if (dist < player.r + star.r) {
            star.collected = true;
            score += 5;
            playSound('star');
            popups.push({
              text: '+5 STAR',
              x: star.x,
              y: getScreenY(star.y) - 20,
              life: 0.7,
              maxLife: 0.7,
              color: '#ffd400',
            });
            if (options.onScoreUpdate) options.onScoreUpdate(score);
            if (score > bestScore) {
              bestScore = score;
              try {
                localStorage.setItem(STORAGE_KEY, bestScore.toString());
              } catch (e) {}
            }
          }
        }
      }
    }

    // Update Gate rotations & slide offsets
    for (const gate of gates) {
      if (gate.type === 'BAR') {
        gate.offset = (gate.offset + gate.speed * dt) % 450;
      } else if (gate.type === 'RING') {
        gate.rot = (gate.rot + gate.rotSpeed * dt) % (Math.PI * 2);
      }
    }

    // Update Changers rotation
    for (const changer of changers) {
      changer.rot += 2.5 * dt;
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
      const mag = (shakeTime / 0.4) * 8;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // Background
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, 450, 750);

    // Drifting faint dots
    ctx.fillStyle = '#ffffff';
    for (const d of bgDots) {
      const dy = (d.y - cameraY * 0.2) % 750;
      const finalY = dy < 0 ? dy + 750 : dy;
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.arc(d.x, finalY, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Gates
    for (const gate of gates) {
      const sy = getScreenY(gate.y);
      if (sy < -120 || sy > 750 + 120) continue;

      if (gate.type === 'BAR') {
        // 4 Sliding Segments
        const segW = 450 / 4;
        const barH = 20;

        for (let s = -1; s <= 4; s++) {
          const segIdx = ((s % 4) + 4) % 4;
          const segColor = gate.colors[segIdx];
          const segX = s * segW + gate.offset;

          ctx.save();
          ctx.fillStyle = segColor;
          ctx.shadowColor = segColor;
          ctx.shadowBlur = 10;
          ctx.fillRect(segX, sy - barH / 2, segW, barH);
          ctx.restore();
        }
      } else if (gate.type === 'RING') {
        // Rotating 4-arc Ring
        const R = gate.radius;
        const arcLen = Math.PI / 2;

        for (let a = 0; a < 4; a++) {
          const arcColor = gate.colors[a];
          const startAngle = gate.rot + a * arcLen;
          const endAngle = startAngle + arcLen - 0.08; // small clean gap

          ctx.save();
          ctx.strokeStyle = arcColor;
          ctx.shadowColor = arcColor;
          ctx.shadowBlur = 12;
          ctx.lineWidth = 14;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(225, sy, R, startAngle, endAngle);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Draw Color Changers
    for (const changer of changers) {
      if (changer.collected) continue;
      const csy = getScreenY(changer.y);
      if (csy < -30 || csy > 780) continue;

      ctx.save();
      ctx.translate(changer.x, csy);
      ctx.rotate(changer.rot);

      // 4 colored segments
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = COLORS[i];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, changer.r, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
        ctx.closePath();
        ctx.fill();
      }
      // Inner dot
      ctx.fillStyle = '#050814';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Draw Stars
    for (const star of stars) {
      if (star.collected) continue;
      const ssy = getScreenY(star.y);
      if (ssy < -30 || ssy > 780) continue;

      ctx.save();
      ctx.fillStyle = '#ffd400';
      ctx.shadowColor = '#ffd400';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let p = 0; p < 5; p++) {
        const outerA = (p * Math.PI * 2) / 5 - Math.PI / 2;
        const innerA = outerA + Math.PI / 5;
        const ox = star.x + Math.cos(outerA) * star.r;
        const oy = ssy + Math.sin(outerA) * star.r;
        const ix = star.x + Math.cos(innerA) * (star.r * 0.45);
        const iy = ssy + Math.sin(innerA) * (star.r * 0.45);
        if (p === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw Player Ball
    if (player.alive) {
      const psy = getScreenY(player.y);
      ctx.save();
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(player.x, psy, player.r, 0, Math.PI * 2);
      ctx.fill();

      // Core Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(player.x - 3, psy - 3, 4, 0, Math.PI * 2);
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
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }

    // Top HUD
    ctx.save();
    ctx.fillStyle = 'rgba(5, 8, 20, 0.8)';
    ctx.fillRect(0, 0, 450, 60);

    // Score
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${score}`, 20, 40);

    // Best
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`BEST ${bestScore}`, 430, 38);
    ctx.restore();

    // Overlays
    if (state === 'READY') {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 20, 0.82)';
      ctx.fillRect(0, 0, 450, 750);

      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 18;
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'center';
      ctx.fillText('COLOR GATE DASH', 225, 260);

      ctx.shadowBlur = 0;
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Jump through gates matching your ball color', 225, 310);
      ctx.fillText('Passing through a wrong color is INSTANT DEATH', 225, 335);
      ctx.fillText('Touch 4-color orbs to switch your active hue', 225, 360);

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.roundRect(125, 430, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#050814';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('TAP OR SPACE TO JUMP', 225, 460);
      ctx.restore();
    } else if (state === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 20, 0.82)';
      ctx.fillRect(0, 0, 450, 750);
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', 225, 340);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Press P or tap to resume', 225, 380);
      ctx.restore();
    } else if (state === 'GAMEOVER') {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 20, 0.88)';
      ctx.fillRect(0, 0, 450, 750);

      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 18;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'center';
      ctx.fillText('CRUSHED', 225, 250);

      ctx.shadowBlur = 0;
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Gates Passed', 225, 300);

      ctx.font = 'bold 50px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${score}`, 225, 355);

      if (score >= bestScore && score > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('★ NEW HIGH SCORE! ★', 225, 395);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Best: ${bestScore}`, 225, 395);
      }

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.roundRect(125, 450, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#050814';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('PLAY AGAIN', 225, 480);
      ctx.restore();
    }

    ctx.restore();
  }

  // Input Handling
  function onKeyDown(e) {
    if (['Space', 'ArrowUp', 'KeyW', 'KeyP'].includes(e.code)) {
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

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      jump();
    }
  }

  function onPointerDown() {
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
    jump();
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
