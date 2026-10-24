/**
 * Neon Rush: Gravity Switch
 * Instant 60 FPS Cyberpunk Gravity Inversion Runner
 */

export function createGame(container, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 480;
  container.innerHTML = '';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let animationId = null;
  let isRunning = true;
  let isPaused = false;
  let isMuted = Boolean(options.isMuted);

  // Audio Synth via Web Audio API
  let audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (isMuted) return;
    try {
      const actx = getAudio();
      if (!actx) return;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);

      const now = actx.currentTime;
      if (type === 'switch') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'shard') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio fallback silent
    }
  }

  // Game Physics State
  const floorY = 410;
  const ceilingY = 70;
  const playerSize = 28;

  let player = {
    x: 120,
    y: floorY - playerSize,
    vy: 0,
    gravityDir: 1, // 1 = down (floor), -1 = up (ceiling)
    isGrounded: true,
    trail: [],
  };

  let speed = 6;
  let score = 0;
  let distance = 0;
  let obstacles = [];
  let shards = [];
  let particles = [];
  let gameOver = false;
  let lastObstacleSpawn = 0;

  function resetGame() {
    player = {
      x: 120,
      y: floorY - playerSize,
      vy: 0,
      gravityDir: 1,
      isGrounded: true,
      trail: [],
    };
    speed = 6;
    score = 0;
    distance = 0;
    obstacles = [];
    shards = [];
    particles = [];
    gameOver = false;
    lastObstacleSpawn = 0;
    if (options.onScoreUpdate) options.onScoreUpdate(0);
  }

  function switchGravity() {
    if (gameOver) {
      resetGame();
      return;
    }
    player.gravityDir *= -1;
    player.vy = player.gravityDir * 4;
    player.isGrounded = false;
    playSound('switch');

    // Burst particles on switch
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: player.x + playerSize / 2,
        y: player.y + playerSize / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: '#00d4ff',
        alpha: 1,
        life: 25,
      });
    }
  }

  // Event Listeners
  function handleKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      switchGravity();
    } else if (e.code === 'KeyP') {
      isPaused = !isPaused;
      if (options.onStateChange) options.onStateChange(isPaused ? 'PAUSED' : 'PLAYING');
    }
  }

  function handlePointerDown(e) {
    e.preventDefault();
    switchGravity();
  }

  window.addEventListener('keydown', handleKeyDown);
  canvas.addEventListener('pointerdown', handlePointerDown);

  // Game Loop
  let lastTime = performance.now();

  function loop(currentTime) {
    if (!isRunning) return;
    animationId = requestAnimationFrame(loop);

    if (isPaused) {
      drawPauseScreen();
      return;
    }

    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (!gameOver) {
      update(dt);
    }
    render();
  }

  function update() {
    distance += speed * 0.1;
    speed = 6 + Math.min(8, distance * 0.005); // Gradual overdrive

    // Physics
    const gravityAccel = 26;
    player.vy += player.gravityDir * gravityAccel * 0.6;
    player.y += player.vy;

    // Floor collision
    if (player.gravityDir === 1 && player.y >= floorY - playerSize) {
      player.y = floorY - playerSize;
      player.vy = 0;
      player.isGrounded = true;
    }
    // Ceiling collision
    if (player.gravityDir === -1 && player.y <= ceilingY) {
      player.y = ceilingY;
      player.vy = 0;
      player.isGrounded = true;
    }

    // Trail
    player.trail.push({ x: player.x, y: player.y, alpha: 0.8 });
    if (player.trail.length > 8) player.trail.shift();

    // Spawn Obstacles
    lastObstacleSpawn += speed;
    if (lastObstacleSpawn > 320 + Math.random() * 200) {
      lastObstacleSpawn = 0;
      const isFloor = Math.random() > 0.5;
      const h = 45 + Math.random() * 40;
      const w = 32;
      const y = isFloor ? floorY - h : ceilingY;
      obstacles.push({ x: canvas.width + 50, y, w, h, isFloor });

      // Spawn Shards in the opposite lane
      if (Math.random() > 0.3) {
        const shardY = isFloor ? ceilingY + 30 : floorY - 30;
        shards.push({ x: canvas.width + 120, y: shardY, collected: false });
      }
    }

    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed;

      // Collision detection with player AABB
      const pad = 4;
      if (
        player.x + pad < obs.x + obs.w &&
        player.x + playerSize - pad > obs.x &&
        player.y + pad < obs.y + obs.h &&
        player.y + playerSize - pad > obs.y
      ) {
        triggerGameOver();
      }

      if (obs.x < -100) obstacles.splice(i, 1);
    }

    // Update Shards
    for (let i = shards.length - 1; i >= 0; i--) {
      const shard = shards[i];
      shard.x -= speed;

      // Check pickup
      const dx = (player.x + playerSize / 2) - shard.x;
      const dy = (player.y + playerSize / 2) - shard.y;
      if (Math.hypot(dx, dy) < 26) {
        shard.collected = true;
        score += 250;
        playSound('shard');
        if (options.onScoreUpdate) options.onScoreUpdate(score);

        for (let p = 0; p < 10; p++) {
          particles.push({
            x: shard.x,
            y: shard.y,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            color: '#facc15',
            alpha: 1,
            life: 20,
          });
        }
        shards.splice(i, 1);
        continue;
      }

      if (shard.x < -50) shards.splice(i, 1);
    }

    // Passive Distance Score
    score += Math.round(speed * 0.15);
    if (options.onScoreUpdate) options.onScoreUpdate(score);

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 1 / p.life;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  }

  function triggerGameOver() {
    gameOver = true;
    playSound('crash');
    if (options.onGameOver) options.onGameOver(score);

    // Explosion
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: player.x + playerSize / 2,
        y: player.y + playerSize / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        color: i % 2 === 0 ? '#00d4ff' : '#ec4899',
        alpha: 1,
        life: 35,
      });
    }
  }

  function render() {
    // Clear & Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background Cyber Grid Lines
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
    ctx.lineWidth = 1;
    const offset = (distance * 10) % 40;
    for (let x = -offset; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, ceilingY);
      ctx.lineTo(x, floorY);
      ctx.stroke();
    }

    // Floor and Ceiling Rails
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(0, ceilingY);
    ctx.lineTo(canvas.width, ceilingY);
    ctx.stroke();

    ctx.strokeStyle = '#8b5cf6';
    ctx.shadowColor = '#8b5cf6';
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(canvas.width, floorY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Obstacles
    for (const obs of obstacles) {
      ctx.fillStyle = obs.isFloor ? '#ec4899' : '#00d4ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Warning hazard stripes inside
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let s = 6; s < obs.h; s += 14) {
        ctx.fillRect(obs.x, obs.y + s, obs.w, 4);
      }
    }
    ctx.shadowBlur = 0;

    // Quantum Shards
    for (const shard of shards) {
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(performance.now() * 0.004);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0;

    // Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(p.x, p.y, 4, 4);
    }
    ctx.globalAlpha = 1;

    // Player Trail
    for (let i = 0; i < player.trail.length; i++) {
      const t = player.trail[i];
      const ratio = (i + 1) / player.trail.length;
      ctx.fillStyle = `rgba(0, 212, 255, ${ratio * 0.25})`;
      ctx.fillRect(t.x - (player.trail.length - i) * 2, t.y, playerSize, playerSize);
    }

    // Player Cube
    if (!gameOver) {
      ctx.save();
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#00d4ff';
      ctx.fillRect(player.x, player.y, playerSize, playerSize);

      // Inner Core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(player.x + 6, player.y + 6, playerSize - 12, playerSize - 12);
      ctx.restore();
    }

    // In-game HUD overlay
    ctx.font = '700 16px "Outfit", sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 24, 38);

    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText(`${speed.toFixed(1)}x SPEED`, canvas.width - 120, 38);

    // Game Over Overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(6, 9, 19, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '900 36px "Outfit", sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 16;
      ctx.fillText('CRASHED!', canvas.width / 2, canvas.height / 2 - 20);
      ctx.shadowBlur = 0;

      ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(`FINAL SCORE: ${score.toLocaleString()}`, canvas.width / 2, canvas.height / 2 + 18);

      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00d4ff';
      ctx.fillText('PRESS SPACEBAR OR TAP TO RESTART', canvas.width / 2, canvas.height / 2 + 56);
      ctx.textAlign = 'left';
    }
  }

  function drawPauseScreen() {
    ctx.fillStyle = 'rgba(6, 9, 19, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '800 32px "Outfit", sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Press P to Resume', canvas.width / 2, canvas.height / 2 + 35);
    ctx.textAlign = 'left';
  }

  // Kickstart loop
  animationId = requestAnimationFrame(loop);

  return {
    gameInstance: null,
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
    },
    restart: () => {
      resetGame();
    },
    setMuted: (muted) => {
      isMuted = Boolean(muted);
    },
    destroy: () => {
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      if (audioCtx && typeof audioCtx.close === 'function') {
        audioCtx.close().catch(() => {});
      }
      container.innerHTML = '';
    },
  };
}
