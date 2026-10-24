/**
 * Tower Stack — Precision Timing & Stacking Game
 * Canvas: 450 x 750
 */

export function createGame(container, options = {}) {
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = 450;
  canvas.height = 750;
  canvas.className = 'tower-stack-canvas';
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

  function playSound(type, streak = 0) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      if (type === 'drop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'perfect') {
        const baseFreq = 440 * Math.pow(1.12, Math.min(12, streak));
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'gameover') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
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
  const STORAGE_KEY = 'awaisgames_tower_stack_hs';
  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch (e) {}

  // Constants
  const BLOCK_HEIGHT = 30;
  const BASE_WIDTH = 200;
  const BASE_Y = 620;

  // Game States
  let state = 'READY'; // READY | PLAYING | PAUSED | GAMEOVER
  let score = 0;
  let perfectCount = 0;
  let perfectStreak = 0;
  let animId = null;
  let lastTime = performance.now();
  let shakeTime = 0;

  // Stacking world
  let stack = [];
  let currentBlock = null;
  let currentHue = 200;
  let cameraY = BASE_Y;
  let targetCameraY = BASE_Y;

  // Visual effects
  let fallingChunks = [];
  let rings = [];
  let popups = [];
  let stars = [];

  // Generate subtle background stars
  for (let i = 0; i < 40; i++) {
    stars.push({
      x: Math.random() * 450,
      y: Math.random() * 750,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
    });
  }

  function getSlideSpeed() {
    return Math.min(520, 200 + stack.length * 6);
  }

  function spawnMovingBlock() {
    const top = stack[stack.length - 1];
    const y = top.y - BLOCK_HEIGHT;
    const w = top.w;
    currentHue = (currentHue + 12) % 360;

    // Alternate slide direction
    const fromLeft = stack.length % 2 === 0;
    const dir = fromLeft ? 1 : -1;
    const startX = fromLeft ? -w : 450;

    currentBlock = {
      x: startX,
      y,
      w,
      h: BLOCK_HEIGHT,
      dir,
      speed: getSlideSpeed(),
      hue: currentHue,
    };
  }

  function resetGame() {
    score = 0;
    perfectCount = 0;
    perfectStreak = 0;
    currentHue = 200;
    cameraY = BASE_Y;
    targetCameraY = BASE_Y;
    fallingChunks = [];
    rings = [];
    popups = [];
    shakeTime = 0;

    // Initial base block
    stack = [
      {
        x: (450 - BASE_WIDTH) / 2,
        y: BASE_Y,
        w: BASE_WIDTH,
        h: BLOCK_HEIGHT,
        hue: currentHue,
      },
    ];

    spawnMovingBlock();
    if (options.onScoreUpdate) options.onScoreUpdate(0);
  }

  function dropBlock() {
    initAudio();
    if (state === 'READY') {
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
      return;
    }
    if (state !== 'PLAYING' || !currentBlock) return;

    const top = stack[stack.length - 1];
    const offset = currentBlock.x - top.x;
    const absOffset = Math.abs(offset);

    // 1. Perfect Placement check (<= 4px)
    if (absOffset <= 4) {
      currentBlock.x = top.x; // Snap
      perfectStreak++;
      perfectCount++;

      // Width bonus after 3 consecutive perfects
      if (perfectStreak >= 3 && currentBlock.w < BASE_WIDTH) {
        currentBlock.w = Math.min(BASE_WIDTH, currentBlock.w + 10);
        currentBlock.x = top.x - 5;
      }

      stack.push({
        x: currentBlock.x,
        y: currentBlock.y,
        w: currentBlock.w,
        h: currentBlock.h,
        hue: currentBlock.hue,
      });

      // Perfect visual ring
      rings.push({
        x: currentBlock.x + currentBlock.w / 2,
        y: currentBlock.y + currentBlock.h / 2,
        r: currentBlock.w / 2,
        alpha: 1.0,
      });

      popups.push({
        text: `+3 PERFECT!${perfectStreak > 1 ? ` (x${perfectStreak})` : ''}`,
        x: currentBlock.x + currentBlock.w / 2,
        y: currentBlock.y - 15,
        life: 0.7,
        maxLife: 0.7,
        color: '#fef08a',
      });

      score += 3;
      playSound('perfect', perfectStreak);
    } else {
      perfectStreak = 0;
      let newWidth = 0;
      let newX = 0;
      let cutX = 0;
      let cutWidth = 0;

      if (offset > 0) {
        // Shifted to the right
        newWidth = top.w - offset;
        newX = currentBlock.x;
        cutWidth = offset;
        cutX = currentBlock.x + newWidth;
      } else {
        // Shifted to the left
        newWidth = top.w + offset;
        newX = top.x;
        cutWidth = -offset;
        cutX = currentBlock.x;
      }

      // Check if complete miss
      if (newWidth <= 0) {
        // Complete miss! Game over
        fallingChunks.push({
          x: currentBlock.x,
          y: currentBlock.y,
          w: currentBlock.w,
          h: currentBlock.h,
          vx: currentBlock.dir * 120,
          vy: 80,
          rot: 0,
          rotSpeed: currentBlock.dir * 4,
          hue: currentBlock.hue,
        });

        currentBlock = null;
        shakeTime = 0.35;
        playSound('gameover');

        setTimeout(() => {
          state = 'GAMEOVER';
          if (options.onGameOver) options.onGameOver(score);
          if (options.onStateChange) options.onStateChange('GAMEOVER');
        }, 600);
        return;
      }

      // Add Falling Cutoff Chunk
      fallingChunks.push({
        x: cutX,
        y: currentBlock.y,
        w: cutWidth,
        h: currentBlock.h,
        vx: offset > 0 ? 80 : -80,
        vy: 40,
        rot: 0,
        rotSpeed: offset > 0 ? 3 : -3,
        hue: currentBlock.hue,
      });

      // Add stacked block
      stack.push({
        x: newX,
        y: currentBlock.y,
        w: newWidth,
        h: currentBlock.h,
        hue: currentBlock.hue,
      });

      score += 1;
      playSound('drop');
    }

    if (options.onScoreUpdate) options.onScoreUpdate(score);
    if (score > bestScore) {
      bestScore = score;
      try {
        localStorage.setItem(STORAGE_KEY, bestScore.toString());
      } catch (e) {}
    }

    // Update Target Camera to keep top block at ~35% screen height
    targetCameraY = stack[stack.length - 1].y;

    spawnMovingBlock();
  }

  function update(dt) {
    if (shakeTime > 0) shakeTime -= dt;

    // Smooth camera scroll
    cameraY += (targetCameraY - cameraY) * Math.min(1, dt * 5);

    // Update Current Moving Block
    if (currentBlock && state === 'PLAYING') {
      currentBlock.x += currentBlock.dir * currentBlock.speed * dt;
      if (currentBlock.dir > 0 && currentBlock.x > 450 - currentBlock.w * 0.4) {
        currentBlock.dir = -1;
      } else if (currentBlock.dir < 0 && currentBlock.x < -currentBlock.w * 0.6) {
        currentBlock.dir = 1;
      }
    }

    // Update Falling Chunks
    for (let i = fallingChunks.length - 1; i >= 0; i--) {
      const c = fallingChunks[i];
      c.vy += 900 * dt; // gravity
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.rotSpeed * dt;
      if (c.y - cameraY > 800) {
        fallingChunks.splice(i, 1);
      }
    }

    // Update Rings
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r += 140 * dt;
      r.alpha -= 2.2 * dt;
      if (r.alpha <= 0) rings.splice(i, 1);
    }

    // Update Popups
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.y -= 30 * dt;
      p.life -= dt;
      if (p.life <= 0) popups.splice(i, 1);
    }
  }

  function getScreenY(worldY) {
    // Top block kept around 35% of 750 = 262px
    return worldY - cameraY + 262;
  }

  // Draw Function
  function draw() {
    ctx.save();

    if (shakeTime > 0) {
      const mag = (shakeTime / 0.35) * 8;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // Shifting dynamic background gradient
    const heightProgress = Math.min(1, stack.length / 50);
    const grad = ctx.createLinearGradient(0, 0, 0, 750);
    if (heightProgress < 0.4) {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#090d16');
    } else if (heightProgress < 0.75) {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
    } else {
      grad.addColorStop(0, '#042f2e');
      grad.addColorStop(1, '#0b1329');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 450, 750);

    // Parallax stars
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      const sy = (s.y - cameraY * 0.15) % 750;
      const finalY = sy < 0 ? sy + 750 : sy;
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, finalY, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Placed Stack Blocks
    for (let i = 0; i < stack.length; i++) {
      const b = stack[i];
      const sy = getScreenY(b.y);
      if (sy < -BLOCK_HEIGHT || sy > 750 + BLOCK_HEIGHT) continue;

      ctx.save();
      const color = `hsl(${b.hue}, 80%, 55%)`;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(b.x, sy, b.w, b.h, 4);
      ctx.fill();

      // Top edge highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(b.x + 3, sy + 2, b.w - 6, 3);
      ctx.restore();
    }

    // Draw Current Moving Block
    if (currentBlock) {
      const csy = getScreenY(currentBlock.y);
      ctx.save();
      const color = `hsl(${currentBlock.hue}, 85%, 60%)`;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(currentBlock.x, csy, currentBlock.w, currentBlock.h, 4);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(currentBlock.x + 3, csy + 2, currentBlock.w - 6, 3);
      ctx.restore();
    }

    // Draw Falling Cutoff Chunks
    for (const c of fallingChunks) {
      const cy = getScreenY(c.y);
      ctx.save();
      ctx.translate(c.x + c.w / 2, cy + c.h / 2);
      ctx.rotate(c.rot);
      ctx.fillStyle = `hsl(${c.hue}, 70%, 45%)`;
      ctx.beginPath();
      ctx.roundRect(-c.w / 2, -c.h / 2, c.w, c.h, 3);
      ctx.fill();
      ctx.restore();
    }

    // Draw Perfect Rings
    for (const r of rings) {
      const ry = getScreenY(r.y);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, ry, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Popups
    for (const pop of popups) {
      const py = getScreenY(pop.y);
      ctx.save();
      ctx.globalAlpha = pop.life / pop.maxLife;
      ctx.fillStyle = pop.color;
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, py);
      ctx.restore();
    }

    // Top HUD
    ctx.save();
    ctx.fillStyle = 'rgba(11, 16, 30, 0.75)';
    ctx.fillRect(0, 0, 450, 60);

    // Height / Score
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${score}`, 20, 40);

    if (perfectStreak > 0) {
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`★ ${perfectStreak} STREAK`, 90, 38);
    }

    // Best
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`BEST ${bestScore}`, 430, 38);
    ctx.restore();

    // Overlays
    if (state === 'READY') {
      ctx.save();
      ctx.fillStyle = 'rgba(11, 16, 30, 0.78)';
      ctx.fillRect(0, 0, 450, 750);

      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 18;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#a855f7';
      ctx.textAlign = 'center';
      ctx.fillText('TOWER STACK', 225, 260);

      ctx.shadowBlur = 0;
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Stack oscillating blocks as high as you can', 225, 310);
      ctx.fillText('Align within 4px for a PERFECT snap (+3 pts)', 225, 335);
      ctx.fillText('3 consecutive perfects expands block width!', 225, 360);

      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.roundRect(125, 430, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('TAP OR SPACE TO PLAY', 225, 460);
      ctx.restore();
    } else if (state === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = 'rgba(11, 16, 30, 0.78)';
      ctx.fillRect(0, 0, 450, 750);
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', 225, 340);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Press P or tap to resume', 225, 380);
      ctx.restore();
    } else if (state === 'GAMEOVER') {
      ctx.save();
      ctx.fillStyle = 'rgba(11, 16, 30, 0.88)';
      ctx.fillRect(0, 0, 450, 750);

      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 18;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'center';
      ctx.fillText('TOWER TOPPLED', 225, 240);

      ctx.shadowBlur = 0;
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Tower Height', 225, 290);

      ctx.font = 'bold 50px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${stack.length}`, 225, 345);

      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`Perfect Snaps: ${perfectCount}`, 225, 385);

      if (score >= bestScore && score > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('★ NEW HIGH SCORE! ★', 225, 415);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Best: ${bestScore}`, 225, 415);
      }

      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.roundRect(125, 460, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('PLAY AGAIN', 225, 490);
      ctx.restore();
    }

    ctx.restore();
  }

  // Input Handling
  function onKeyDown(e) {
    if (['Space', 'Enter', 'KeyP'].includes(e.code)) {
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

    if (e.code === 'Space' || e.code === 'Enter') {
      dropBlock();
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
    dropBlock();
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
