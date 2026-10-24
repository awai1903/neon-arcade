/**
 * Lane Hopper — Crossy Road arcade game
 * Canvas: 450 x 750
 */

export function createGame(container, options = {}) {
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = 450;
  canvas.height = 750;
  canvas.className = 'lane-hopper-canvas';
  canvas.tabIndex = 0;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Audio Context (lazily created)
  let audioCtx = null;
  let isMuted = !!options.isMuted;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function playSound(type) {
    if (isMuted || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      if (type === 'hop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'coin') {
        [659, 880, 1318].forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0.2, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.12);
        });
      } else if (type === 'warn') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'train') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.3);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'death') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio fallback silent
    }
  }

  // Storage
  const STORAGE_KEY = 'awaisgames_lane_hopper_hs';
  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch (e) {}

  // Game Constants
  const COLS = 9;
  const TILE = 50; // 9 * 50 = 450
  const PLAYER_SIZE = 34;

  // States
  let state = 'READY'; // READY | PLAYING | PAUSED | GAMEOVER
  let score = 0;
  let shakeTime = 0;
  let animId = null;
  let lastTime = performance.now();

  // Player Object
  const player = {
    col: 4,
    row: 0,
    visualX: 4 * TILE + TILE / 2,
    visualY: 0,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    hopProgress: 1,
    hopDuration: 0.12, // 120ms
    furthestRow: 0,
    idleTimer: 0,
    alive: true,
    deathType: null, // 'squash' | 'splash' | 'hawk'
    deathAnim: 0,
  };

  // World Lanes
  let lanes = [];
  let nextLaneRow = 0;
  let cameraRow = 0;
  let particles = [];
  let popups = [];

  function spawnLane(row) {
    let type = 'GRASS';
    if (row <= 2) {
      type = 'GRASS';
    } else {
      const prev1 = lanes.find((l) => l.row === row - 1)?.type;
      const prev2 = lanes.find((l) => l.row === row - 2)?.type;
      const prev3 = lanes.find((l) => l.row === row - 3)?.type;

      // Ensure grass at least every 4-5 lanes
      if (prev1 !== 'GRASS' && prev2 !== 'GRASS' && prev3 !== 'GRASS') {
        type = 'GRASS';
      } else {
        const pool = ['ROAD', 'ROAD', 'RIVER', 'RAIL', 'GRASS'];
        type = pool[Math.floor(Math.random() * pool.length)];
        // Do not stack identical hard lanes more than twice
        if (type === prev1 && type === prev2 && type !== 'GRASS') {
          type = 'GRASS';
        }
      }
    }

    const diffFactor = Math.min(1, score / 80);
    const lane = {
      row,
      type,
      obstacles: [],
      cars: [],
      logs: [],
      coins: [],
      speed: 0,
      dir: Math.random() < 0.5 ? 1 : -1,
      railTimer: Math.random() * 3,
      trainActive: false,
      trainX: 0,
      warnBlink: false,
    };

    if (type === 'GRASS') {
      if (row > 0) {
        // Place 1-3 trees/rocks, ensuring at least 3 walkable gaps
        const count = 1 + Math.floor(Math.random() * 2);
        const freeCols = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        for (let i = 0; i < count; i++) {
          if (freeCols.length > 3) {
            const idx = Math.floor(Math.random() * freeCols.length);
            const col = freeCols.splice(idx, 1)[0];
            lane.obstacles.push({ col, kind: Math.random() < 0.6 ? 'tree' : 'rock' });
          }
        }
        // Coin chance 1 in 6 grass lanes
        if (Math.random() < 0.22 && freeCols.length > 0) {
          const coinCol = freeCols[Math.floor(Math.random() * freeCols.length)];
          lane.coins.push({ col: coinCol, collected: false });
        }
      }
    } else if (type === 'ROAD') {
      const speed = (90 + Math.random() * 110 + diffFactor * 70) * lane.dir;
      lane.speed = speed;
      const carCount = 1 + (Math.random() < 0.4 + diffFactor * 0.4 ? 1 : 0);
      const spacing = 450 / carCount;
      for (let i = 0; i < carCount; i++) {
        const length = Math.random() < 0.3 ? 85 : 55;
        const color = ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7'][Math.floor(Math.random() * 4)];
        lane.cars.push({
          x: i * spacing + Math.random() * 40,
          w: length,
          h: 30,
          color,
        });
      }
    } else if (type === 'RIVER') {
      const speed = (65 + Math.random() * 80 + diffFactor * 40) * lane.dir;
      lane.speed = speed;
      const logCount = 2;
      const spacing = 240;
      for (let i = 0; i < logCount; i++) {
        lane.logs.push({
          x: i * spacing + Math.random() * 30,
          w: 95 + Math.random() * 35,
          h: 32,
        });
      }
    } else if (type === 'RAIL') {
      lane.railTimer = 0;
      lane.trainActive = false;
      lane.trainDir = Math.random() < 0.5 ? 1 : -1;
      lane.trainSpeed = 750 * lane.trainDir;
    }

    lanes.push(lane);
  }

  function resetGame() {
    lanes = [];
    nextLaneRow = 0;
    cameraRow = 0;
    score = 0;
    particles = [];
    popups = [];
    shakeTime = 0;

    player.col = 4;
    player.row = 0;
    player.visualX = 4 * TILE + TILE / 2;
    player.visualY = 0;
    player.fromX = player.visualX;
    player.fromY = player.visualY;
    player.toX = player.visualX;
    player.toY = player.visualY;
    player.hopProgress = 1;
    player.furthestRow = 0;
    player.idleTimer = 0;
    player.alive = true;
    player.deathType = null;
    player.deathAnim = 0;

    for (let r = -2; r <= 18; r++) {
      spawnLane(r);
    }
    nextLaneRow = 19;

    if (options.onScoreUpdate) options.onScoreUpdate(0);
  }

  function canMoveTo(targetCol, targetRow) {
    if (targetCol < 0 || targetCol >= COLS) return false;
    // Cannot move backwards more than 2 tiles behind furthest
    if (targetRow < player.furthestRow - 2) return false;

    const lane = lanes.find((l) => l.row === targetRow);
    if (!lane) return true;
    if (lane.type === 'GRASS') {
      const blocked = lane.obstacles.some((o) => o.col === targetCol);
      if (blocked) return false;
    }
    return true;
  }

  function hop(dCol, dRow) {
    if (state === 'READY') {
      state = 'PLAYING';
      if (options.onStateChange) options.onStateChange('PLAYING');
    }
    if (state !== 'PLAYING' || !player.alive) return;
    if (player.hopProgress < 0.8) return; // Prevent double hops

    initAudio();
    const targetCol = player.col + dCol;
    const targetRow = player.row + dRow;

    if (!canMoveTo(targetCol, targetRow)) return;

    player.fromX = player.visualX;
    player.fromY = player.visualY;
    player.col = targetCol;
    player.row = targetRow;
    player.toX = targetCol * TILE + TILE / 2;
    player.toY = targetRow * TILE;
    player.hopProgress = 0;
    player.idleTimer = 0;

    playSound('hop');

    // Particle dust
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: player.visualX,
        y: getScreenY(player.visualY) + 12,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 40,
        color: '#94a3b8',
        life: 0.25,
        maxLife: 0.25,
        size: 3,
      });
    }

    if (player.row > player.furthestRow) {
      const diff = player.row - player.furthestRow;
      player.furthestRow = player.row;
      score += diff;
      if (options.onScoreUpdate) options.onScoreUpdate(score);
      if (score > bestScore) {
        bestScore = score;
        try {
          localStorage.setItem(STORAGE_KEY, bestScore.toString());
        } catch (e) {}
      }
    }

    // Check grass coin
    const currentLane = lanes.find((l) => l.row === player.row);
    if (currentLane && currentLane.type === 'GRASS') {
      const coin = currentLane.coins.find((c) => c.col === player.col && !c.collected);
      if (coin) {
        coin.collected = true;
        score += 3;
        playSound('coin');
        popups.push({
          text: '+3',
          x: player.toX,
          y: getScreenY(player.toY) - 15,
          life: 0.6,
          maxLife: 0.6,
          color: '#fbbf24',
        });
        if (options.onScoreUpdate) options.onScoreUpdate(score);
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: player.toX,
            y: getScreenY(player.toY),
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            color: '#fbbf24',
            life: 0.4,
            maxLife: 0.4,
            size: 4,
          });
        }
      }
    }
  }

  function triggerDeath(type) {
    if (!player.alive) return;
    player.alive = false;
    player.deathType = type;
    player.deathAnim = 0;
    shakeTime = 0.35;
    playSound('death');

    if (type === 'splash') {
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: player.visualX,
          y: getScreenY(player.visualY),
          vx: (Math.random() - 0.5) * 160,
          vy: -Math.random() * 120,
          color: '#38bdf8',
          life: 0.6,
          maxLife: 0.6,
          size: 4,
        });
      }
    } else if (type === 'squash') {
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: player.visualX,
          y: getScreenY(player.visualY),
          vx: (Math.random() - 0.5) * 180,
          vy: (Math.random() - 0.5) * 180,
          color: '#f43f5e',
          life: 0.45,
          maxLife: 0.45,
          size: 3.5,
        });
      }
    }

    setTimeout(() => {
      state = 'GAMEOVER';
      if (options.onGameOver) options.onGameOver(score);
      if (options.onStateChange) options.onStateChange('GAMEOVER');
    }, 700);
  }

  function getScreenY(worldY) {
    const cameraWorldY = cameraRow * TILE;
    // 70% screen height = 750 * 0.7 = 525
    return 525 - (worldY - cameraWorldY);
  }

  // Update Game Logic
  function update(dt) {
    if (shakeTime > 0) shakeTime -= dt;

    if (state === 'PLAYING' || state === 'READY') {
      // Spawn new forward lanes
      while (nextLaneRow < player.row + 15) {
        spawnLane(nextLaneRow);
        nextLaneRow++;
      }
      // Remove far behind lanes
      lanes = lanes.filter((l) => l.row >= player.row - 6);

      // Camera smooth follow
      const targetCam = player.row;
      cameraRow += (targetCam - cameraRow) * Math.min(1, dt * 6);

      // Update lanes & obstacles
      for (const lane of lanes) {
        if (lane.type === 'ROAD') {
          for (const car of lane.cars) {
            car.x += lane.speed * dt;
            if (lane.dir > 0 && car.x > 450 + car.w) car.x = -car.w - 20;
            if (lane.dir < 0 && car.x < -car.w - 20) car.x = 450 + car.w;
          }
        } else if (lane.type === 'RIVER') {
          for (const log of lane.logs) {
            log.x += lane.speed * dt;
            if (lane.dir > 0 && log.x > 450 + log.w) log.x = -log.w - 30;
            if (lane.dir < 0 && log.x < -log.w - 30) log.x = 450 + log.w;
          }
        } else if (lane.type === 'RAIL') {
          lane.railTimer += dt;
          if (lane.railTimer >= 4.0 && !lane.trainActive) {
            lane.trainActive = true;
            lane.trainX = lane.trainDir > 0 ? -400 : 850;
            playSound('train');
          }
          if (lane.trainActive) {
            lane.trainX += lane.trainSpeed * dt;
            if (lane.trainDir > 0 && lane.trainX > 900) {
              lane.trainActive = false;
              lane.railTimer = 0;
            } else if (lane.trainDir < 0 && lane.trainX < -500) {
              lane.trainActive = false;
              lane.railTimer = 0;
            }
          }
        }
      }

      // Player update
      if (player.alive) {
        player.idleTimer += dt;

        // Hawk arrival at 5s idle warning, 7s kill
        if (player.idleTimer >= 7.0) {
          triggerDeath('hawk');
        }

        // Hop animation interpolation
        if (player.hopProgress < 1) {
          player.hopProgress = Math.min(1, player.hopProgress + dt / player.hopDuration);
          const t = player.hopProgress;
          player.visualX = player.fromX + (player.toX - player.fromX) * t;
          player.visualY = player.fromY + (player.toY - player.fromY) * t;
        } else {
          player.visualX = player.toX;
          player.visualY = player.toY;
        }

        // Check river log standing or water death
        const currentLane = lanes.find((l) => l.row === player.row);
        if (currentLane) {
          if (currentLane.type === 'RIVER' && player.hopProgress >= 0.7) {
            let onLog = false;
            for (const log of currentLane.logs) {
              if (
                player.visualX >= log.x - 10 &&
                player.visualX <= log.x + log.w + 10
              ) {
                onLog = true;
                player.visualX += currentLane.speed * dt;
                player.toX = player.visualX;
                player.fromX = player.visualX;
                break;
              }
            }
            if (!onLog) {
              triggerDeath('splash');
            } else if (player.visualX < 0 || player.visualX > 450) {
              triggerDeath('splash');
            }
          } else if (currentLane.type === 'ROAD') {
            for (const car of currentLane.cars) {
              const carLeft = car.x;
              const carRight = car.x + car.w;
              if (
                player.visualX + PLAYER_SIZE / 2.5 > carLeft &&
                player.visualX - PLAYER_SIZE / 2.5 < carRight &&
                player.hopProgress > 0.4
              ) {
                triggerDeath('squash');
                break;
              }
            }
          } else if (currentLane.type === 'RAIL') {
            if (currentLane.trainActive) {
              const tLeft = currentLane.trainX;
              const tRight = currentLane.trainX + 380;
              if (player.visualX > tLeft && player.visualX < tRight) {
                triggerDeath('squash');
              }
            }
          }
        }
      } else {
        player.deathAnim += dt;
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

    // Update popups
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

    // Screen Shake
    if (shakeTime > 0) {
      const mag = (shakeTime / 0.35) * 8;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // Background Clear
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, 450, 750);

    // Draw Lanes
    for (const lane of lanes) {
      const sy = getScreenY(lane.row * TILE) - TILE / 2;
      if (sy < -TILE || sy > 750 + TILE) continue;

      if (lane.type === 'GRASS') {
        ctx.fillStyle = lane.row % 2 === 0 ? '#064e3b' : '#047857';
        ctx.fillRect(0, sy, 450, TILE);

        // Obstacles (Trees / Rocks)
        for (const obs of lane.obstacles) {
          const ox = obs.col * TILE + TILE / 2;
          const oy = sy + TILE / 2;
          if (obs.kind === 'tree') {
            // Pine Tree
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(ox - 3, oy + 4, 6, 12);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.moveTo(ox, oy - 16);
            ctx.lineTo(ox - 15, oy + 6);
            ctx.lineTo(ox + 15, oy + 6);
            ctx.closePath();
            ctx.fill();
            // Tree highlight
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.moveTo(ox, oy - 16);
            ctx.lineTo(ox, oy + 6);
            ctx.lineTo(ox + 15, oy + 6);
            ctx.closePath();
            ctx.fill();
          } else {
            // Rock
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(ox, oy + 2, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(ox - 3, oy - 2, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Coins
        for (const coin of lane.coins) {
          if (!coin.collected) {
            const cx = coin.col * TILE + TILE / 2;
            const cy = sy + TILE / 2;
            ctx.save();
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(cx, cy, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(cx - 2, cy - 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      } else if (lane.type === 'ROAD') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, sy, 450, TILE);

        // Dashed centre road markings
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.setLineDash([16, 14]);
        ctx.beginPath();
        ctx.moveTo(0, sy + TILE / 2);
        ctx.lineTo(450, sy + TILE / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cars
        for (const car of lane.cars) {
          ctx.save();
          ctx.shadowColor = car.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = car.color;
          ctx.beginPath();
          ctx.roundRect(car.x, sy + 8, car.w, car.h, 6);
          ctx.fill();

          // Windshield
          ctx.fillStyle = '#0f172a';
          const wsW = car.w * 0.35;
          const wsX = lane.dir > 0 ? car.x + car.w * 0.45 : car.x + car.w * 0.2;
          ctx.fillRect(wsX, sy + 11, wsW, car.h - 6);

          // Headlights
          ctx.fillStyle = '#fef08a';
          if (lane.dir > 0) {
            ctx.fillRect(car.x + car.w - 3, sy + 11, 3, 5);
            ctx.fillRect(car.x + car.w - 3, sy + car.h - 2, 3, 5);
          } else {
            ctx.fillRect(car.x, sy + 11, 3, 5);
            ctx.fillRect(car.x, sy + car.h - 2, 3, 5);
          }
          ctx.restore();
        }
      } else if (lane.type === 'RIVER') {
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(0, sy, 450, TILE);

        // Water currents
        ctx.fillStyle = '#38bdf8';
        ctx.globalAlpha = 0.25;
        const offset = ((Date.now() / 30) * lane.dir) % 50;
        for (let x = -50; x < 500; x += 60) {
          ctx.fillRect(x + offset, sy + 12, 24, 2);
          ctx.fillRect(x - offset, sy + 32, 18, 2);
        }
        ctx.globalAlpha = 1.0;

        // Logs
        for (const log of lane.logs) {
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.roundRect(log.x, sy + 9, log.w, log.h, 8);
          ctx.fill();
          ctx.fillStyle = '#92400e';
          ctx.fillRect(log.x + 8, sy + 13, log.w - 16, 4);
          ctx.fillRect(log.x + 12, sy + 25, log.w - 24, 3);
        }
      } else if (lane.type === 'RAIL') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, sy, 450, TILE);

        // Rail ties
        ctx.fillStyle = '#1e293b';
        for (let x = 10; x < 450; x += 22) {
          ctx.fillRect(x, sy + 4, 10, TILE - 8);
        }
        // Steel tracks
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, sy + 12, 450, 4);
        ctx.fillRect(0, sy + TILE - 16, 450, 4);

        // Warning light
        if (lane.railTimer >= 3.0 && lane.railTimer < 4.0) {
          const blink = Math.floor(lane.railTimer * 8) % 2 === 0;
          if (blink) {
            ctx.save();
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(25, sy + TILE / 2, 8, 0, Math.PI * 2);
            ctx.arc(425, sy + TILE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Fast Train
        if (lane.trainActive) {
          ctx.save();
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 16;
          ctx.fillStyle = '#d97706';
          ctx.fillRect(lane.trainX, sy + 5, 380, TILE - 10);
          ctx.fillStyle = '#fef3c7';
          for (let tx = lane.trainX + 20; tx < lane.trainX + 360; tx += 45) {
            ctx.fillRect(tx, sy + 12, 28, TILE - 24);
          }
          ctx.restore();
        }
      }
    }

    // Draw Idle Hawk Shadow
    if (player.alive && player.idleTimer > 4.5) {
      const hawkAlpha = Math.min(0.8, (player.idleTimer - 4.5) / 2.0);
      const hawkSize = Math.max(30, 90 - (player.idleTimer - 4.5) * 25);
      const px = player.visualX;
      const py = getScreenY(player.visualY);
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${hawkAlpha})`;
      ctx.beginPath();
      ctx.ellipse(px, py + 10, hawkSize, hawkSize * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Player
    if (player.alive || player.deathType === 'squash') {
      const px = player.visualX;
      let py = getScreenY(player.visualY);
      const arc = Math.sin(player.hopProgress * Math.PI) * 16;
      py -= arc;

      ctx.save();
      ctx.translate(px, py);

      // Death squash animation
      if (!player.alive && player.deathType === 'squash') {
        const squash = Math.max(0.15, 1 - player.deathAnim * 4);
        ctx.scale(1.4, squash);
      }

      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 14 + arc * 0.5, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cube Body (Neon Green)
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE, 8);
      ctx.fill();

      // Top Highlight
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.roundRect(-PLAYER_SIZE / 2 + 3, -PLAYER_SIZE / 2 + 3, PLAYER_SIZE - 6, 10, 4);
      ctx.fill();

      // Cute Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-7, -4, 4.5, 0, Math.PI * 2);
      ctx.arc(7, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(-6, -4, 2.2, 0, Math.PI * 2);
      ctx.arc(8, -4, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Draw Hawk Swoop in death
    if (!player.alive && player.deathType === 'hawk') {
      const hx = player.visualX;
      const hy = getScreenY(player.visualY) - (player.deathAnim * 300 - 80);
      ctx.save();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - 35, hy - 25);
      ctx.lineTo(hx - 15, hy + 5);
      ctx.lineTo(hx, hy + 20);
      ctx.lineTo(hx + 15, hy + 5);
      ctx.lineTo(hx + 35, hy - 25);
      ctx.closePath();
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
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }

    // Top HUD Bar
    ctx.save();
    ctx.fillStyle = 'rgba(11, 17, 32, 0.75)';
    ctx.fillRect(0, 0, 450, 60);

    // Score
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${score}`, 20, 40);

    // Best Score
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`BEST ${bestScore}`, 430, 38);
    ctx.restore();

    // Overlay States
    if (state === 'READY') {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 10, 20, 0.75)';
      ctx.fillRect(0, 0, 450, 750);

      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 18;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.textAlign = 'center';
      ctx.fillText('LANE HOPPER', 225, 260);

      ctx.shadowBlur = 0;
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Cross lanes • Catch logs • Watch for trains', 225, 310);

      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Move quickly — idling lures the predator hawk!', 225, 340);

      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('W / Up / Space / Tap to Hop', 225, 410);
      ctx.fillText('A / D / Swipe to move sideways', 225, 435);

      // Start Button prompt
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(125, 480, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('TAP OR HOP TO START', 225, 511);
      ctx.restore();
    } else if (state === 'PAUSED') {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 10, 20, 0.75)';
      ctx.fillRect(0, 0, 450, 750);
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', 225, 340);
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Press P or tap to resume', 225, 390);
      ctx.restore();
    } else if (state === 'GAMEOVER') {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 10, 20, 0.85)';
      ctx.fillRect(0, 0, 450, 750);

      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 18;
      ctx.font = '900 36px system-ui, sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', 225, 260);

      ctx.shadowBlur = 0;
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Lanes Reached`, 225, 310);

      ctx.font = 'bold 52px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${score}`, 225, 370);

      if (score >= bestScore && score > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText('★ NEW HIGH SCORE! ★', 225, 410);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '15px system-ui, sans-serif';
        ctx.fillText(`Best: ${bestScore}`, 225, 410);
      }

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(125, 460, 200, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.fillText('PLAY AGAIN', 225, 491);

      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Press Space / Enter / Tap to restart', 225, 540);
      ctx.restore();
    }

    ctx.restore();
  }

  // Input Handling
  function onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyP'].includes(e.code)) {
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

    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      hop(0, 1);
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      hop(0, -1);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      hop(-1, 0);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      hop(1, 0);
    }
  }

  // Pointer & Touch Gestures
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerStartTime = 0;

  function onPointerDown(e) {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    pointerStartX = e.clientX - rect.left;
    pointerStartY = e.clientY - rect.top;
    pointerStartTime = performance.now();
  }

  function onPointerUp(e) {
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const dt = performance.now() - pointerStartTime;
    const dx = endX - pointerStartX;
    const dy = endY - pointerStartY;
    const dist = Math.hypot(dx, dy);

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
      hop(0, 1);
      return;
    }

    // Swipe vs Tap
    if (dist > 30 && dt < 450) {
      if (Math.abs(dx) > Math.abs(dy)) {
        hop(dx > 0 ? 1 : -1, 0);
      } else {
        hop(0, dy > 0 ? -1 : 1);
      }
    } else {
      // Tap is forward
      hop(0, 1);
    }
  }

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  // Main Loop
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
      canvas.removeEventListener('pointerup', onPointerUp);
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch (e) {}
      }
      container.innerHTML = '';
    },
  };
}
