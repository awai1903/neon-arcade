/**
 * Pulse Circuit: Overclock — Commercial-Grade Electromagnetic Logic Puzzle
 * AwaisGames Studio Handcrafted Edition
 * Real-time topological graph tracing, procedural Web Audio harmonics,
 * multi-sector progression, tactile particle sparks, and instant restart loop.
 */

class CircuitAudioEngine {
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

  playClick() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playConnect() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playSectorClear() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + i * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.28);
    });
  }

  playOverload() {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

export function createGame(container, options = {}) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'pulse-circuit-canvas';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.background = '#030712';
  canvas.style.userSelect = 'none';
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const audio = new CircuitAudioEngine();
  audio.setMuted(Boolean(options.isMuted));

  let animFrameId = null;
  let isDestroyed = false;
  let isPaused = false;

  let gameState = 'START'; // START, PLAYING, LEVEL_CLEAR, GAME_OVER
  let sector = 1;
  let score = 0;
  let timeLeft = 45;
  let maxTime = 45;
  let combo = 0;
  let particles = [];
  let floatingTexts = [];
  let pulsePhase = 0;

  // Grid definition
  // Connections bitmask: 1 = UP, 2 = RIGHT, 4 = DOWN, 8 = LEFT
  const DIR_UP = 1;
  const DIR_RIGHT = 2;
  const DIR_DOWN = 4;
  const DIR_LEFT = 8;

  let gridCols = 4;
  let gridRows = 4;
  let grid = []; // 2D array of nodes

  function rotateMask(mask) {
    // 90 deg clockwise: UP->RIGHT, RIGHT->DOWN, DOWN->LEFT, LEFT->UP
    let next = 0;
    if (mask & DIR_UP) next |= DIR_RIGHT;
    if (mask & DIR_RIGHT) next |= DIR_DOWN;
    if (mask & DIR_DOWN) next |= DIR_LEFT;
    if (mask & DIR_LEFT) next |= DIR_UP;
    return next;
  }

  function getOppositeDir(dir) {
    if (dir === DIR_UP) return DIR_DOWN;
    if (dir === DIR_RIGHT) return DIR_LEFT;
    if (dir === DIR_DOWN) return DIR_UP;
    if (dir === DIR_LEFT) return DIR_LEFT;
    return 0;
  }

  function initSector(s) {
    sector = s;
    if (s <= 2) {
      gridCols = 3;
      gridRows = 3;
      maxTime = 40;
    } else if (s <= 5) {
      gridCols = 4;
      gridRows = 3;
      maxTime = 45;
    } else if (s <= 8) {
      gridCols = 4;
      gridRows = 4;
      maxTime = 50;
    } else {
      gridCols = 5;
      gridRows = 4;
      maxTime = 55;
    }
    timeLeft = maxTime;

    // Generate puzzle: create a spanning tree from Core to Terminals
    grid = [];
    for (let r = 0; r < gridRows; r++) {
      grid[r] = [];
      for (let c = 0; c < gridCols; c++) {
        grid[r][c] = {
          r,
          c,
          type: 'wire', // 'core', 'terminal', 'wire'
          connections: 0,
          currentRotation: 0, // 0, 90, 180, 270
          targetRotation: 0,
          isPowered: false,
          isTermComplete: false,
        };
      }
    }

    // Set Core at (0, 0) or left edge
    const coreR = Math.floor(gridRows / 2);
    const coreC = 0;
    grid[coreR][coreC].type = 'core';

    // Terminals at opposite edge
    const termCount = Math.min(3, 1 + Math.floor(s / 3));
    const termRows = [];
    while (termRows.length < termCount) {
      const candidateR = Math.floor(Math.random() * gridRows);
      if (!termRows.includes(candidateR)) termRows.push(candidateR);
    }
    termRows.forEach((tr) => {
      grid[tr][gridCols - 1].type = 'terminal';
    });

    // Generate valid random paths from core to each terminal using randomized Prim's / DFS
    const visited = new Set();
    const stack = [[coreR, coreC]];
    visited.add(`${coreR},${coreC}`);

    while (stack.length > 0) {
      const [currR, currC] = stack[stack.length - 1];
      const neighbors = [];
      const deltas = [
        [-1, 0, DIR_UP, DIR_DOWN],
        [1, 0, DIR_DOWN, DIR_UP],
        [0, -1, DIR_LEFT, DIR_RIGHT],
        [0, 1, DIR_RIGHT, DIR_LEFT],
      ];

      deltas.forEach(([dr, dc, outDir, inDir]) => {
        const nr = currR + dr;
        const nc = currC + dc;
        if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols && !visited.has(`${nr},${nc}`)) {
          neighbors.push({ nr, nc, outDir, inDir });
        }
      });

      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[currR][currC].connections |= chosen.outDir;
        grid[chosen.nr][chosen.nc].connections |= chosen.inDir;
        visited.add(`${chosen.nr},${chosen.nc}`);
        stack.push([chosen.nr, chosen.nc]);
      } else {
        stack.pop();
      }
    }

    // Scramble non-core tiles by rotating 1-3 times
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const node = grid[r][c];
        if (node.type !== 'core') {
          const scrambleTimes = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < scrambleTimes; i++) {
            node.connections = rotateMask(node.connections);
          }
        }
      }
    }

    recomputePower();
  }

  function recomputePower() {
    // Reset power state
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        grid[r][c].isPowered = false;
        grid[r][c].isTermComplete = false;
      }
    }

    // BFS from Core
    const queue = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (grid[r][c].type === 'core') {
          grid[r][c].isPowered = true;
          queue.push(grid[r][c]);
        }
      }
    }

    let allTerminalsPowered = true;
    let terminalCount = 0;
    let poweredTerminals = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      const { r, c, connections } = current;

      // Check all 4 neighbor directions
      const checks = [
        [-1, 0, DIR_UP, DIR_DOWN],
        [0, 1, DIR_RIGHT, DIR_LEFT],
        [1, 0, DIR_DOWN, DIR_UP],
        [0, -1, DIR_LEFT, DIR_RIGHT],
      ];

      checks.forEach(([dr, dc, outDir, inDir]) => {
        if (connections & outDir) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols) {
            const neighbor = grid[nr][nc];
            // Connection is valid if neighbor accepts it
            if ((neighbor.connections & inDir) && !neighbor.isPowered) {
              neighbor.isPowered = true;
              queue.push(neighbor);
              // Spawn faint energy spark
              if (Math.random() < 0.2) {
                addSpark(c, r, nc, nr);
              }
            }
          }
        }
      });
    }

    // Check Terminals
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (grid[r][c].type === 'terminal') {
          terminalCount++;
          if (grid[r][c].isPowered) {
            grid[r][c].isTermComplete = true;
            poweredTerminals++;
          } else {
            allTerminalsPowered = false;
          }
        }
      }
    }

    // Victory check for current sector
    if (allTerminalsPowered && terminalCount > 0 && gameState === 'PLAYING') {
      audio.playSectorClear();
      const timeBonus = Math.floor(timeLeft * 25);
      const sectorScore = 500 + timeBonus;
      score += sectorScore;
      combo++;

      addFloatingText(`SECTOR COMPLETE! +${sectorScore}`, canvas.width / 2, canvas.height / 2 - 20, '#00f0ff');
      if (options.onScoreUpdate) options.onScoreUpdate(score);

      // Trigger win burst particles
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 200,
          y: canvas.height / 2 + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 1,
          color: ['#00f0ff', '#8b5cf6', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)],
        });
      }

      gameState = 'LEVEL_CLEAR';
      setTimeout(() => {
        if (gameState === 'LEVEL_CLEAR' && !isDestroyed) {
          gameState = 'PLAYING';
          initSector(sector + 1);
        }
      }, 1200);
    }
  }

  function addSpark(c1, r1, c2, r2) {
    const sz = getTileLayout();
    const x = sz.offsetX + (c1 + c2) * 0.5 * sz.tileSize + sz.tileSize / 2;
    const y = sz.offsetY + (r1 + r2) * 0.5 * sz.tileSize + sz.tileSize / 2;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 0.6,
      color: '#38bdf8',
    });
  }

  function addFloatingText(text, x, y, color = '#ffffff') {
    floatingTexts.push({ text, x, y, life: 1, color });
  }

  function getTileLayout() {
    const w = canvas.width;
    const h = canvas.height;
    const topBarHeight = 70;
    const availW = w * 0.92;
    const availH = (h - topBarHeight) * 0.88;

    const tileSize = Math.min(availW / gridCols, availH / gridRows, 95);
    const offsetX = (w - gridCols * tileSize) / 2;
    const offsetY = topBarHeight + ((h - topBarHeight) - gridRows * tileSize) / 2;

    return { tileSize, offsetX, offsetY };
  }

  // Pointer Interaction
  function handlePointer(clientX, clientY) {
    if (gameState === 'START') {
      audio.ensure();
      audio.playConnect();
      gameState = 'PLAYING';
      score = 0;
      initSector(1);
      return;
    }

    if (gameState === 'GAME_OVER') {
      audio.ensure();
      audio.playConnect();
      gameState = 'PLAYING';
      score = 0;
      initSector(1);
      return;
    }

    if (gameState !== 'PLAYING') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;

    const { tileSize, offsetX, offsetY } = getTileLayout();
    const col = Math.floor((px - offsetX) / tileSize);
    const row = Math.floor((py - offsetY) / tileSize);

    if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
      const node = grid[row][col];
      // Don't rotate power core
      if (node.type === 'core') return;

      audio.playClick();
      node.connections = rotateMask(node.connections);
      node.targetRotation += Math.PI / 2;

      // Small click particle burst
      const cx = offsetX + col * tileSize + tileSize / 2;
      const cy = offsetY + row * tileSize + tileSize / 2;
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 0.5,
          color: node.isPowered ? '#00f0ff' : '#64748b',
        });
      }

      recomputePower();
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    handlePointer(e.clientX, e.clientY);
  });

  // Resize canvas to match container crispness
  function handleResize() {
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = (rect.width || 800) * dpr;
    canvas.height = (rect.height || 540) * dpr;
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  // Keyboard controls
  const handleKeyDown = (e) => {
    if (e.code === 'KeyP') {
      isPaused = !isPaused;
      if (options.onStateChange) {
        options.onStateChange(isPaused ? 'PAUSED' : 'RUNNING');
      }
    }
    if (e.code === 'Space') {
      if (gameState === 'START' || gameState === 'GAME_OVER') {
        gameState = 'PLAYING';
        score = 0;
        initSector(1);
      }
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  // Main Game Loop
  let lastTime = performance.now();

  function loop(now) {
    if (isDestroyed) return;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!isPaused) {
      update(dt);
    }
    render();

    animFrameId = requestAnimationFrame(loop);
  }

  function update(dt) {
    pulsePhase += dt * 3.5;

    if (gameState === 'PLAYING') {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        gameState = 'GAME_OVER';
        audio.playOverload();
        if (options.onGameOver) options.onGameOver(score);
      }
    }

    // Update node smooth rotations
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const node = grid[r][c];
        if (node.currentRotation < node.targetRotation) {
          node.currentRotation += (node.targetRotation - node.currentRotation) * 0.25;
        }
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 1.8;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= dt * 35;
      ft.life -= dt * 0.9;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  function render() {
    const w = canvas.width;
    const h = canvas.height;

    // Background gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7);
    bgGrad.addColorStop(0, '#060d1e');
    bgGrad.addColorStop(1, '#02050e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Microchip grid background pattern
    ctx.strokeStyle = '#0e1830';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top HUD
    renderHUD(w, h);

    // Render Circuit Grid
    renderGrid();

    // Render Particles
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Render Floating Text
    floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.font = 'bold 22px "Outfit", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // Overlays (Start / Game Over / Level Clear)
    if (gameState === 'START') {
      renderStartOverlay(w, h);
    } else if (gameState === 'GAME_OVER') {
      renderGameOverOverlay(w, h);
    }
  }

  function renderHUD(w, h) {
    ctx.save();
    // Top bar background
    ctx.fillStyle = '#050a18';
    ctx.fillRect(0, 0, w, 56);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 56);
    ctx.lineTo(w, 56);
    ctx.stroke();

    // Sector
    ctx.font = 'bold 15px "Outfit", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`SECTOR 0${sector}`, 24, 34);

    // Score
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`ENERGY: ${score}`, w / 2, 34);

    // Countdown Timer Bar
    ctx.textAlign = 'right';
    const timerColor = timeLeft < 10 ? '#ef4444' : '#00f0ff';
    ctx.fillStyle = timerColor;
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(`MELTDOWN: ${timeLeft.toFixed(1)}s`, w - 24, 34);

    // Sub-bar for timer
    const barWidth = 140;
    const barX = w - 24 - barWidth;
    const barY = 40;
    const pct = Math.max(0, Math.min(1, timeLeft / maxTime));
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barWidth, 4);
    ctx.fillStyle = timerColor;
    ctx.fillRect(barX, barY, barWidth * pct, 4);

    ctx.restore();
  }

  function renderGrid() {
    const { tileSize, offsetX, offsetY } = getTileLayout();

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const node = grid[r][c];
        const x = offsetX + c * tileSize;
        const y = offsetY + r * tileSize;
        const cx = x + tileSize / 2;
        const cy = y + tileSize / 2;

        ctx.save();

        // Node Tile Box
        ctx.fillStyle = node.isPowered ? '#07162c' : '#090f1e';
        ctx.strokeStyle = node.isPowered ? '#0284c7' : '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, tileSize - 8, tileSize - 8, 8);
        ctx.fill();
        ctx.stroke();

        // Rotate canvas around center of node
        ctx.translate(cx, cy);
        ctx.rotate(node.currentRotation);

        // Draw traces based on connections
        const traceColor = node.isPowered ? '#00f0ff' : '#334155';
        const glowBlur = node.isPowered ? 12 : 0;
        ctx.strokeStyle = traceColor;
        ctx.shadowColor = traceColor;
        ctx.shadowBlur = glowBlur;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        const half = tileSize / 2 - 4;

        if (node.connections & DIR_UP) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -half);
          ctx.stroke();
        }
        if (node.connections & DIR_RIGHT) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(half, 0);
          ctx.stroke();
        }
        if (node.connections & DIR_DOWN) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, half);
          ctx.stroke();
        }
        if (node.connections & DIR_LEFT) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-half, 0);
          ctx.stroke();
        }

        // Center junction node
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = node.isPowered ? '#ffffff' : '#475569';
        ctx.fill();

        ctx.restore();

        // Node specific decorations (Core or Terminal)
        if (node.type === 'core') {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, 11 + Math.sin(pulsePhase) * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = 'bold 9px "Outfit", sans-serif';
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('CORE', 0, 0);
          ctx.restore();
        } else if (node.type === 'terminal') {
          ctx.save();
          ctx.translate(cx, cy);
          const termColor = node.isTermComplete ? '#10b981' : '#ec4899';
          ctx.fillStyle = termColor;
          ctx.shadowColor = termColor;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = 'bold 9px "Outfit", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.isTermComplete ? 'SYNC' : 'LOAD', 0, 0);
          ctx.restore();
        }
      }
    }
  }

  function renderStartOverlay(w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
    ctx.fillRect(0, 0, w, h);

    // Title & Brand
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 16;
    ctx.fillText('PULSE CIRCUIT: OVERCLOCK', w / 2, h / 2 - 60);

    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText('ELECTROMAGNETIC HARMONIC LOGIC PUZZLE', w / 2, h / 2 - 25);

    // Instructions
    ctx.font = '13px "Outfit", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Rotate circuit tiles to connect the Quantum Core to all Terminals.', w / 2, h / 2 + 15);
    ctx.fillText('Solve each sector before the Meltdown countdown trips!', w / 2, h / 2 + 35);

    // Call to action button
    const pulseScale = 1 + Math.sin(pulsePhase * 1.5) * 0.04;
    ctx.save();
    ctx.translate(w / 2, h / 2 + 90);
    ctx.scale(pulseScale, pulseScale);
    ctx.fillStyle = '#0284c7';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(-110, -22, 220, 44, 10);
    ctx.fill();
    ctx.font = 'bold 15px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('INITIALIZE GRID', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  function renderGameOverOverlay(w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.fillText('SYSTEM MELTDOWN', w / 2, h / 2 - 50);

    ctx.font = 'bold 18px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(`Final Energy Harvest: ${score}`, w / 2, h / 2 - 10);
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Sectors Synchronized: ${sector - 1}`, w / 2, h / 2 + 18);

    // Instant retry
    ctx.save();
    ctx.translate(w / 2, h / 2 + 75);
    ctx.fillStyle = '#0284c7';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(-100, -20, 200, 40, 8);
    ctx.fill();
    ctx.font = 'bold 14px "Outfit", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText('RETRY SECTOR 01', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // Kick off initial setup
  initSector(1);
  animFrameId = requestAnimationFrame(loop);

  return {
    gameInstance: { canvas },
    pause: () => { isPaused = true; },
    resume: () => { isPaused = false; },
    restart: () => {
      gameState = 'PLAYING';
      score = 0;
      initSector(1);
    },
    setMuted: (m) => {
      audio.setMuted(m);
    },
    destroy: () => {
      isDestroyed = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    },
  };
}
