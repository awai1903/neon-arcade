/**
 * Neon Runner: Overdrive — Commercial-Grade 2D Cyberpunk Parkour Runner
 * AwaisGames Studio Handcrafted Edition
 * Double-jump acrobatic flips, slide crouches under laser drones,
 * multi-tier parallax neon skyline, procedural synth arpeggio, and instant restart loop.
 */

class RunnerSoundEngine {
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

  playJump(isDouble = false) {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isDouble ? 'sine' : 'triangle';
    const startFreq = isDouble ? 340 : 200;
    const endFreq = isDouble ? 720 : 480;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playSlide() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playCoin() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [880, 1174.66].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  playCrash() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
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
  const audio = new RunnerSoundEngine();
  audio.setMuted(Boolean(options.isMuted));

  let animFrameId = null;
  let isDestroyed = false;
  let isPaused = false;

  let width = 800;
  let height = 480;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(rect.width || 800, 320);
    height = Math.max(rect.height || 480, 320);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  const HS_KEY = 'awaisgames_hs_endless-runner';
  let highScore = parseInt(
    localStorage.getItem(HS_KEY) || localStorage.getItem('neon_arcade_hs_runner') || '0',
    10
  );

  const logoImg = new Image();
  if (typeof options.getAssetUrl === 'function') {
    logoImg.src = options.getAssetUrl('assets/branding/neon-runner-logo.svg');
  }

  let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
  let score = 0;
  let distance = 0;
  let coins = 0;
  let speed = 400;
  const baseSpeed = 400;
  const maxSpeed = 950;

  const groundY = () => height - 85;

  // Player state
  const player = {
    x: 100,
    y: 0,
    vy: 0,
    w: 32,
    h: 52,
    isGrounded: false,
    jumpsLeft: 2,
    isSliding: false,
    slideTimer: 0,
    runAnim: 0,
  };

  // Parallax Skyline Buildings
  const buildingsLayer1 = [];
  const buildingsLayer2 = [];
  function initSkyline() {
    buildingsLayer1.length = 0;
    buildingsLayer2.length = 0;
    for (let x = 0; x < width + 200; x += 60) {
      buildingsLayer1.push({
        x,
        w: 50 + Math.random() * 40,
        h: 120 + Math.random() * 160,
        color: '#130d2a',
      });
    }
    for (let x = 0; x < width + 200; x += 90) {
      buildingsLayer2.push({
        x,
        w: 70 + Math.random() * 50,
        h: 60 + Math.random() * 90,
        color: '#241444',
      });
    }
  }
  initSkyline();

  // Obstacles & Collectibles
  let obstacles = []; // { x, y, w, h, type: 'ground_laser' | 'hover_drone' }
  let energyTokens = []; // { x, y, r }
  let particles = [];
  let floatingTexts = [];

  let spawnTimer = 1.2;

  function resetGame() {
    score = 0;
    distance = 0;
    coins = 0;
    speed = baseSpeed;
    player.y = groundY() - player.h;
    player.vy = 0;
    player.isGrounded = true;
    player.jumpsLeft = 2;
    player.isSliding = false;
    obstacles = [];
    energyTokens = [];
    particles = [];
    floatingTexts = [];
    spawnTimer = 1.2;
    gameState = 'PLAYING';
    if (options.onStateChange) options.onStateChange('PLAYING');
    if (options.onScoreUpdate) options.onScoreUpdate(0);
  }

  function handleJump() {
    if (gameState === 'START' || gameState === 'GAMEOVER') {
      resetGame();
      return;
    }
    if (player.isSliding) {
      player.isSliding = false;
    }
    if (player.jumpsLeft > 0) {
      const isDouble = player.jumpsLeft === 1;
      player.vy = -640;
      player.isGrounded = false;
      player.jumpsLeft -= 1;
      audio.playJump(isDouble);

      // Jet burst particles on double-jump
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h,
          vx: (Math.random() - 0.5) * 4,
          vy: 2 + Math.random() * 4,
          life: 0.5,
          color: isDouble ? '#00f0ff' : '#f97316',
        });
      }
    }
  }

  function handleSlide() {
    if (gameState !== 'PLAYING') return;
    if (player.isGrounded) {
      player.isSliding = true;
      player.slideTimer = 0.55;
      audio.playSlide();

      // Slide sparks
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: player.x + 10,
          y: groundY() - 2,
          vx: -3 - Math.random() * 5,
          vy: -1 - Math.random() * 3,
          life: 0.4,
          color: '#f59e0b',
        });
      }
    } else {
      // Fast fall
      player.vy = 750;
    }
  }

  // Keyboard controls
  const handleKeyDown = (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
      handleJump();
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      handleSlide();
    } else if (e.code === 'KeyP') {
      isPaused = !isPaused;
      if (options.onStateChange) options.onStateChange(isPaused ? 'PAUSED' : 'RUNNING');
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  // Touch Controls (Swipe up = Jump, Swipe down = Slide, Tap = Jump)
  let touchStartY = 0;
  let touchStartX = 0;

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  });

  canvas.addEventListener('touchend', (e) => {
    if (gameState === 'START' || gameState === 'GAMEOVER') {
      resetGame();
      return;
    }
    if (e.changedTouches.length > 0) {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if (deltaY < -30) {
        handleJump();
      } else if (deltaY > 30) {
        handleSlide();
      } else {
        handleJump();
      }
    }
  });

  canvas.addEventListener('mousedown', () => {
    if (gameState === 'START' || gameState === 'GAMEOVER') {
      resetGame();
    } else {
      handleJump();
    }
  });

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
    if (gameState !== 'PLAYING') return;

    distance += speed * dt * 0.1;
    speed = Math.min(maxSpeed, baseSpeed + distance * 0.35);
    score = Math.floor(distance) + coins * 50;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HS_KEY, highScore.toString());
    }
    if (options.onScoreUpdate) options.onScoreUpdate(score);

    // Parallax Skyline
    buildingsLayer1.forEach((b) => {
      b.x -= speed * 0.15 * dt;
      if (b.x + b.w < 0) {
        b.x = width + Math.random() * 50;
      }
    });
    buildingsLayer2.forEach((b) => {
      b.x -= speed * 0.35 * dt;
      if (b.x + b.w < 0) {
        b.x = width + Math.random() * 60;
      }
    });

    // Player Physics
    player.runAnim += dt * (speed / 30);
    if (!player.isGrounded) {
      player.vy += 1550 * dt; // gravity
      player.y += player.vy * dt;
    }

    const currentHeight = player.isSliding ? 28 : 52;
    const floorLimit = groundY() - currentHeight;

    if (player.y >= floorLimit) {
      player.y = floorLimit;
      player.vy = 0;
      player.isGrounded = true;
      player.jumpsLeft = 2;
    }

    if (player.isSliding) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0) {
        player.isSliding = false;
      }
    }

    // Footstep run particles
    if (player.isGrounded && Math.random() < 0.3) {
      particles.push({
        x: player.x + 8,
        y: groundY() - 2,
        vx: -2 - Math.random() * 4,
        vy: -0.5 - Math.random() * 2,
        life: 0.35,
        color: '#f97316',
      });
    }

    // Spawn Obstacles & Coins
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 1.1 + Math.random() * 0.9 - Math.min(0.5, distance * 0.0005);

      const isHighDrone = Math.random() < 0.42;
      if (isHighDrone) {
        // High Hover Drone: must slide under!
        obstacles.push({
          x: width + 40,
          y: groundY() - 74,
          w: 36,
          h: 28,
          type: 'hover_drone',
        });
      } else {
        // Ground Laser Barrier: must jump over!
        obstacles.push({
          x: width + 40,
          y: groundY() - 40,
          w: 24,
          h: 40,
          type: 'ground_laser',
        });
      }

      // Add a line of 3 coins
      for (let i = 0; i < 3; i++) {
        energyTokens.push({
          x: width + 100 + i * 45,
          y: isHighDrone ? groundY() - 22 : groundY() - 85,
          r: 9,
          alive: true,
        });
      }
    }

    // Move Obstacles
    const pBox = {
      x: player.x + 4,
      y: player.y + 4,
      w: player.w - 8,
      h: currentHeight - 6,
    };

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= speed * dt;

      // Collision check
      if (
        pBox.x < obs.x + obs.w &&
        pBox.x + pBox.w > obs.x &&
        pBox.y < obs.y + obs.h &&
        pBox.y + pBox.h > obs.y
      ) {
        gameState = 'GAMEOVER';
        audio.playCrash();
        for (let p = 0; p < 25; p++) {
          particles.push({
            x: player.x + player.w / 2,
            y: player.y + player.h / 2,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.5) * 9,
            life: 0.9,
            color: '#ec4899',
          });
        }
        if (options.onGameOver) options.onGameOver(score);
        if (options.onStateChange) options.onStateChange('GAMEOVER');
        break;
      }

      if (obs.x < -60) obstacles.splice(i, 1);
    }

    // Move Energy Coins
    for (let i = energyTokens.length - 1; i >= 0; i--) {
      const c = energyTokens[i];
      c.x -= speed * dt;

      // Pickup
      if (
        c.alive &&
        Math.abs(pBox.x + pBox.w / 2 - c.x) < 22 &&
        Math.abs(pBox.y + pBox.h / 2 - c.y) < 26
      ) {
        c.alive = false;
        coins += 1;
        audio.playCoin();
        addFloatingText('+50', c.x, c.y - 12, '#fef08a');
        energyTokens.splice(i, 1);
        continue;
      }

      if (c.x < -40) energyTokens.splice(i, 1);
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 2;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update Floating Text
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= dt * 32;
      ft.life -= dt * 1.2;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  function addFloatingText(text, x, y, color) {
    floatingTexts.push({ text, x, y, life: 1, color });
  }

  function render() {
    ctx.save();
    ctx.scale(dpr, dpr);

    // Night sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0c071d');
    skyGrad.addColorStop(0.65, '#1e0c38');
    skyGrad.addColorStop(1, '#080512');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Distant Neon Grid Horizon
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.2)';
    ctx.lineWidth = 1;
    for (let y = groundY() - 100; y < groundY(); y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Parallax Buildings
    buildingsLayer1.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, groundY() - b.h, b.w, b.h);
      // Windows
      ctx.fillStyle = 'rgba(253, 224, 71, 0.15)';
      for (let wy = groundY() - b.h + 10; wy < groundY() - 20; wy += 22) {
        ctx.fillRect(b.x + 8, wy, 8, 8);
      }
    });

    buildingsLayer2.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, groundY() - b.h, b.w, b.h);
      // Neon roof antenna
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(b.x + b.w / 2 - 1, groundY() - b.h - 14, 2, 14);
    });

    // Ground Roadway
    ctx.fillStyle = '#0a0817';
    ctx.fillRect(0, groundY(), width, height - groundY());

    // Neon Curbs & Grid lines
    ctx.strokeStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY());
    ctx.lineTo(width, groundY());
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Road dashes
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 24]);
    ctx.beginPath();
    ctx.moveTo(0, groundY() + 25);
    ctx.lineTo(width, groundY() + 25);
    ctx.stroke();
    ctx.setLineDash([]);

    // Obstacles
    obstacles.forEach((obs) => {
      ctx.save();
      if (obs.type === 'hover_drone') {
        // High drone
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.w, obs.h, 6);
        ctx.fill();
        // Red sensor eye
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x + 10, obs.y + 10, 8, 8);
        // Warning laser beam downwards
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.w / 2, obs.y + obs.h);
        ctx.lineTo(obs.x + obs.w / 2, groundY());
        ctx.stroke();
      } else {
        // Ground barrier
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        // Laser hazard stripes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x + 4, obs.y + 4, obs.w - 8, 4);
        ctx.fillRect(obs.x + 4, obs.y + 16, obs.w - 8, 4);
      }
      ctx.restore();
    });

    // Energy Tokens (Coins)
    energyTokens.forEach((c) => {
      if (!c.alive) return;
      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Player
    drawPlayer();

    // Particles
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Floating text
    floatingTexts.forEach((ft) => {
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = 'bold 15px "Outfit", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1;

    // HUD
    renderHUD();

    // Overlays
    if (gameState === 'START') {
      renderStartOverlay();
    } else if (gameState === 'GAMEOVER') {
      renderGameOverOverlay();
    }

    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.isSliding) {
      // Sliding crouch pose
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(0, 10, player.w + 14, 20, 6);
      ctx.fill();
      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(player.w + 6, 18, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Running / Jumping upright pose
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;

      // Torso
      ctx.fillRect(8, 14, 18, 22);

      // Head with cyber visor
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(17, 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(16, 6, 8, 4);

      // Running legs
      const legPhase = Math.sin(player.runAnim);
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      if (player.isGrounded) {
        ctx.beginPath();
        ctx.moveTo(12, 36);
        ctx.lineTo(12 - legPhase * 10, 50);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(22, 36);
        ctx.lineTo(22 + legPhase * 10, 50);
        ctx.stroke();
      } else {
        // Airborne jump tuck
        ctx.beginPath();
        ctx.moveTo(12, 36);
        ctx.lineTo(6, 46);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(22, 36);
        ctx.lineTo(28, 44);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function renderHUD() {
    ctx.fillStyle = 'rgba(7, 4, 18, 0.85)';
    ctx.fillRect(0, 0, width, 40);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(width, 40);
    ctx.stroke();

    ctx.font = 'bold 15px "Outfit", sans-serif';
    ctx.fillStyle = '#f97316';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 20, 25);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`DIST: ${Math.floor(distance)}m`, 170, 25);

    ctx.fillStyle = '#fef08a';
    ctx.fillText(`COINS: ${coins}`, 310, 25);

    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'right';
    ctx.fillText(`BEST: ${highScore}`, width - 20, 25);
  }

  function renderStartOverlay() {
    ctx.fillStyle = 'rgba(8, 4, 18, 0.88)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const logoW = Math.min(width * 0.75, 420);
      const logoH = logoW * (140 / 540);
      ctx.drawImage(logoImg, width / 2 - logoW / 2, height / 2 - logoH - 15, logoW, logoH);
    } else {
      ctx.font = 'bold 36px "Outfit", sans-serif';
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 14;
      ctx.fillText('NEON RUNNER: OVERDRIVE', width / 2, height / 2 - 40);
    }

    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 0;
    ctx.fillText('TAP OR PRESS SPACE TO SPRINT', width / 2, height / 2 + 25);

    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('W / Up / Space = Jump (Double Tap for Flip) · S / Down = Slide Under Drones', width / 2, height / 2 + 58);
  }

  function renderGameOverOverlay() {
    ctx.fillStyle = 'rgba(8, 4, 18, 0.9)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.font = 'bold 34px "Outfit", sans-serif';
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 16;
    ctx.fillText('RUN CRASHED', width / 2, height / 2 - 45);

    ctx.font = 'bold 20px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(`FINAL SCORE: ${score} · DISTANCE: ${Math.floor(distance)}m`, width / 2, height / 2 - 10);

    const isRecord = score >= highScore && score > 0;
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isRecord ? '#00f0ff' : '#64748b';
    ctx.fillText(isRecord ? '★ NEW ALL-TIME RECORD! ★' : `Personal Best: ${highScore}`, width / 2, height / 2 + 20);

    // Instant retry
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 90, height / 2 + 48, 180, 42, 8);
    ctx.fill();

    ctx.font = 'bold 14px "Outfit", sans-serif';
    ctx.fillStyle = '#080412';
    ctx.fillText('ONE MORE RUN', width / 2, height / 2 + 74);
  }

  // Start ticking
  animFrameId = requestAnimationFrame(tick);

  return {
    gameInstance: canvas,
    pause: () => { isPaused = true; },
    resume: () => { isPaused = false; },
    restart: () => { resetGame(); },
    setMuted: (m) => { audio.setMuted(m); },
    destroy: () => {
      isDestroyed = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    },
  };
}
