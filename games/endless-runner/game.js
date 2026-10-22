import Phaser from 'phaser';

/**
 * Audio Synthesizer for Retro Arcade Effects using Web Audio API
 */
class ArcadeAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(val) {
    this.muted = val;
  }

  playJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }

  playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playStart() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [330, 440, 554, 659].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }
}

/**
 * Endless Runner Main Phaser Scene
 */
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  init(data) {
    this.options = data.options || {};
    this.audio = new ArcadeAudio();
    this.audio.setMuted(this.options.isMuted || false);

    this.gameState = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.speed = 360;
    this.baseSpeed = 360;
    this.maxSpeed = 820;
    this.jumpsLeft = 2;
    this.highScore = parseInt(localStorage.getItem('neon_arcade_hs_runner') || '0', 10);
  }

  preload() {
    const assets = this.options.assets || {};
    // Load player, background, obstacle, and coin from resolved Vite URLs
    if (assets['assets/player.png']) {
      this.load.image('runner-player', assets['assets/player.png']);
    }
    if (assets['assets/background.webp']) {
      this.load.image('runner-bg', assets['assets/background.webp']);
    }
    if (assets['assets/obstacle.png']) {
      this.load.image('runner-obstacle', assets['assets/obstacle.png']);
    }
    if (assets['assets/coin.png']) {
      this.load.image('runner-coin', assets['assets/coin.png']);
    }
  }

  create() {
    const { width, height } = this.scale;
    this.groundY = height - 90;

    // 1. Background (TileSprite or Image)
    if (this.textures.exists('runner-bg')) {
      this.bg = this.add.tileSprite(0, 0, width, height, 'runner-bg')
        .setOrigin(0, 0)
        .setDisplaySize(width, height);
    } else {
      // Fallback procedural background
      this.bg = this.add.rectangle(0, 0, width, height, 0x070b14).setOrigin(0, 0);
    }

    // 2. City Grid floor
    this.ground = this.add.rectangle(0, this.groundY, width, height - this.groundY, 0x090f20).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    // Neon floor line
    this.floorGlow = this.add.line(0, 0, 0, this.groundY, width, this.groundY, 0x06b6d4, 1)
      .setOrigin(0, 0)
      .setLineWidth(3);

    // 3. Groups for Obstacles and Coins
    this.obstacles = this.physics.add.group();
    this.coinsGroup = this.physics.add.group();

    // 4. Player Sprite
    if (this.textures.exists('runner-player')) {
      this.player = this.physics.add.sprite(120, this.groundY - 32, 'runner-player');
      this.player.setDisplaySize(48, 48);
    } else {
      // Fallback rectangle player
      this.player = this.physics.add.sprite(120, this.groundY - 32, null);
      const gfx = this.make.graphics();
      gfx.fillStyle(0x06b6d4, 1);
      gfx.fillRoundedRect(0, 0, 40, 48, 6);
      gfx.generateTexture('runner-player-fallback', 40, 48);
      gfx.destroy();
      this.player.setTexture('runner-player-fallback');
    }

    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(1400);
    this.player.body.setSize(34, 44);
    this.player.body.setOffset(7, 4);

    // Physics Colliders
    this.physics.add.collider(this.player, this.ground, () => {
      if (this.player.body.touching.down) {
        this.jumpsLeft = 2;
      }
    });

    this.physics.add.overlap(this.player, this.obstacles, this.handleHitObstacle, null, this);
    this.physics.add.overlap(this.player, this.coinsGroup, this.handleCollectCoin, null, this);

    // 5. Controls (Keyboard & Pointer)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    this.input.on('pointerdown', (pointer) => {
      // Ignore if clicking UI buttons (top right pause)
      if (pointer.y < 60 && pointer.x > width - 100) return;
      this.handleAction();
    });

    // 6. Particle Trail for Player
    this.createPlayerTrail();

    // 7. HUD Elements
    this.createHUD();

    // 8. Start Screen
    this.createStartScreen();

    // 9. Timers for Spawning
    this.spawnTimer = 0;
    this.coinTimer = 0;
  }

  createPlayerTrail() {
    this.trailEmitter = null;
    const particleGfx = this.make.graphics();
    particleGfx.fillStyle(0x06b6d4, 0.8);
    particleGfx.fillCircle(4, 4, 4);
    particleGfx.generateTexture('player-particle', 8, 8);
    particleGfx.destroy();

    const particles = this.add.particles(0, 0, 'player-particle', {
      speed: { min: -40, max: -120 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 350,
      frequency: 40,
    });
    particles.startFollow(this.player, -15, 12);
    this.trailParticles = particles;
  }

  createHUD() {
    const { width } = this.scale;
    // Score & Distance Display
    this.hudContainer = this.add.container(0, 0);

    const hudBg = this.add.rectangle(0, 0, width, 54, 0x070b14, 0.65).setOrigin(0, 0);

    this.scoreText = this.add.text(24, 16, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#06b6d4',
    });

    this.distanceText = this.add.text(180, 16, 'DIST: 0m', {
      fontSize: '16px',
      fontFamily: 'Outfit, sans-serif',
      color: '#94a3b8',
    });

    this.coinsText = this.add.text(320, 16, 'TOKENS: 0', {
      fontSize: '16px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#a855f7',
    });

    this.highScoreText = this.add.text(width - 140, 16, `BEST: ${this.highScore}`, {
      fontSize: '16px',
      fontFamily: 'Outfit, sans-serif',
      color: '#ec4899',
    });

    this.hudContainer.add([hudBg, this.scoreText, this.distanceText, this.coinsText, this.highScoreText]);
  }

  createStartScreen() {
    const { width, height } = this.scale;
    this.startContainer = this.add.container(0, 0);

    const scrim = this.add.rectangle(0, 0, width, height, 0x050813, 0.78).setOrigin(0, 0);

    const title = this.add.text(width / 2, height / 2 - 70, 'NEON RUNNER', {
      fontSize: '44px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 16, 'TAP OR PRESS SPACE TO START', {
      fontSize: '18px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: '#06b6d4',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: subtitle,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const instructions = this.add.text(
      width / 2,
      height / 2 + 40,
      'Space / Tap = Jump · Double Jump Supported · P = Pause',
      {
        fontSize: '14px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        color: '#94a3b8',
      }
    ).setOrigin(0.5);

    this.startContainer.add([scrim, title, subtitle, instructions]);
  }

  createGameOverScreen() {
    const { width, height } = this.scale;
    this.gameOverContainer = this.add.container(0, 0);

    const scrim = this.add.rectangle(0, 0, width, height, 0x050813, 0.85).setOrigin(0, 0);

    const title = this.add.text(width / 2, height / 2 - 80, 'RUN TERMINATED', {
      fontSize: '40px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#ec4899',
    }).setOrigin(0.5);

    const finalScore = this.add.text(width / 2, height / 2 - 24, `FINAL SCORE: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      localStorage.setItem('neon_arcade_hs_runner', this.highScore.toString());
      this.highScoreText.setText(`BEST: ${this.highScore}`);
    }

    const hsNotice = this.add.text(
      width / 2,
      height / 2 + 18,
      isNewHigh ? '★ NEW ALL-TIME RECORD! ★' : `All-Time Record: ${this.highScore}`,
      {
        fontSize: '16px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontStyle: 'bold',
        color: isNewHigh ? '#38bdf8' : '#64748b',
      }
    ).setOrigin(0.5);

    const restartBtn = this.add.rectangle(width / 2, height / 2 + 75, 200, 48, 0x06b6d4)
      .setInteractive({ useHandCursor: true });
    
    const restartText = this.add.text(width / 2, height / 2 + 75, 'PLAY AGAIN', {
      fontSize: '16px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#070b14',
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => this.restartGame());

    const tapNotice = this.add.text(width / 2, height / 2 + 125, 'Press Space to Restart', {
      fontSize: '13px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: '#64748b',
    }).setOrigin(0.5);

    this.gameOverContainer.add([scrim, title, finalScore, hsNotice, restartBtn, restartText, tapNotice]);
  }

  createPauseScreen() {
    const { width, height } = this.scale;
    this.pauseContainer = this.add.container(0, 0);

    const scrim = this.add.rectangle(0, 0, width, height, 0x050813, 0.75).setOrigin(0, 0);

    const title = this.add.text(width / 2, height / 2 - 30, 'PAUSED', {
      fontSize: '36px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#06b6d4',
    }).setOrigin(0.5);

    const resumeNotice = this.add.text(width / 2, height / 2 + 20, 'Press P or Tap to Resume', {
      fontSize: '16px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    this.pauseContainer.add([scrim, title, resumeNotice]);
  }

  handleAction() {
    if (this.gameState === 'START') {
      this.startGame();
    } else if (this.gameState === 'PLAYING') {
      this.jump();
    } else if (this.gameState === 'GAMEOVER') {
      this.restartGame();
    } else if (this.gameState === 'PAUSED') {
      this.resumeGame();
    }
  }

  startGame() {
    this.gameState = 'PLAYING';
    if (this.startContainer) {
      this.startContainer.destroy();
    }
    this.audio.playStart();
    if (this.options.onStateChange) {
      this.options.onStateChange('PLAYING');
    }
  }

  jump() {
    if (this.jumpsLeft > 0) {
      this.player.setVelocityY(this.jumpsLeft === 2 ? -580 : -500);
      this.jumpsLeft--;
      this.audio.playJump();

      // Jump spin / squash effect
      this.tweens.add({
        targets: this.player,
        scaleY: 1.15,
        scaleX: 0.85,
        duration: 100,
        yoyo: true,
      });
    }
  }

  togglePause() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      this.physics.pause();
      this.createPauseScreen();
      if (this.options.onStateChange) this.options.onStateChange('PAUSED');
    } else if (this.gameState === 'PAUSED') {
      this.resumeGame();
    }
  }

  resumeGame() {
    if (this.gameState !== 'PAUSED') return;
    this.gameState = 'PLAYING';
    this.physics.resume();
    if (this.pauseContainer) {
      this.pauseContainer.destroy();
    }
    if (this.options.onStateChange) this.options.onStateChange('PLAYING');
  }

  spawnObstacle() {
    const { width } = this.scale;
    let obstacle;
    if (this.textures.exists('runner-obstacle')) {
      obstacle = this.obstacles.create(width + 40, this.groundY - 24, 'runner-obstacle');
      obstacle.setDisplaySize(38, 48);
    } else {
      obstacle = this.obstacles.create(width + 40, this.groundY - 24, null);
      const gfx = this.make.graphics();
      gfx.fillStyle(0xec4899, 1);
      gfx.fillTriangle(0, 48, 19, 0, 38, 48);
      gfx.generateTexture('runner-obs-fallback', 38, 48);
      gfx.destroy();
      obstacle.setTexture('runner-obs-fallback');
    }

    obstacle.body.setAllowGravity(false);
    obstacle.setVelocityX(-this.speed);
    obstacle.setImmovable(true);
    obstacle.body.setSize(26, 40);
  }

  spawnCoin() {
    const { width } = this.scale;
    const yOffsets = [this.groundY - 35, this.groundY - 90, this.groundY - 140];
    const targetY = yOffsets[Math.floor(Math.random() * yOffsets.length)];

    let coin;
    if (this.textures.exists('runner-coin')) {
      coin = this.coinsGroup.create(width + 40, targetY, 'runner-coin');
      coin.setDisplaySize(28, 28);
    } else {
      coin = this.coinsGroup.create(width + 40, targetY, null);
      const gfx = this.make.graphics();
      gfx.fillStyle(0x06b6d4, 1);
      gfx.fillCircle(14, 14, 14);
      gfx.generateTexture('runner-coin-fallback', 28, 28);
      gfx.destroy();
      coin.setTexture('runner-coin-fallback');
    }

    coin.body.setAllowGravity(false);
    coin.setVelocityX(-this.speed);
  }

  handleHitObstacle() {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'GAMEOVER';
    this.physics.pause();
    this.audio.playHit();

    // Camera shake
    this.cameras.main.shake(300, 0.025);

    // Flash player
    this.tweens.add({
      targets: this.player,
      tint: 0xff0055,
      alpha: 0.4,
      duration: 80,
      yoyo: true,
      repeat: 3,
    });

    this.createGameOverScreen();

    if (this.options.onGameOver) {
      this.options.onGameOver(this.score);
    }
    if (this.options.onStateChange) {
      this.options.onStateChange('GAMEOVER');
    }
  }

  handleCollectCoin(player, coin) {
    coin.destroy();
    this.coins += 1;
    this.score += 50;
    this.audio.playCoin();

    // Visual score float effect
    const floatText = this.add.text(player.x, player.y - 20, '+50', {
      fontSize: '14px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#06b6d4',
    });

    this.tweens.add({
      targets: floatText,
      y: player.y - 50,
      alpha: 0,
      duration: 600,
      onComplete: () => floatText.destroy(),
    });

    this.scoreText.setText(`SCORE: ${this.score}`);
    this.coinsText.setText(`TOKENS: ${this.coins}`);
    if (this.options.onScoreUpdate) {
      this.options.onScoreUpdate(this.score);
    }
  }

  restartGame() {
    if (this.gameOverContainer) {
      this.gameOverContainer.destroy();
    }
    this.obstacles.clear(true, true);
    this.coinsGroup.clear(true, true);

    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.speed = this.baseSpeed;
    this.jumpsLeft = 2;
    this.player.setPosition(120, this.groundY - 32);
    this.player.setVelocity(0, 0);
    this.player.clearTint();
    this.player.alpha = 1;

    this.physics.resume();
    this.gameState = 'PLAYING';
    this.audio.playStart();

    this.scoreText.setText('SCORE: 0');
    this.distanceText.setText('DIST: 0m');
    this.coinsText.setText('TOKENS: 0');

    if (this.options.onStateChange) {
      this.options.onStateChange('PLAYING');
    }
    if (this.options.onScoreUpdate) {
      this.options.onScoreUpdate(0);
    }
  }

  update(time, delta) {
    // Keyboard triggers
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.handleAction();
    }
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause();
    }

    if (this.gameState !== 'PLAYING') return;

    // Scroll background
    if (this.bg && this.bg.tilePositionX !== undefined) {
      this.bg.tilePositionX += (this.speed * delta) / 4000;
    }

    // Distance & Progression
    this.distance += (this.speed * delta) / 1000;
    this.score += Math.round(delta * 0.05);

    // Increase speed gradually over distance
    if (this.speed < this.maxSpeed) {
      this.speed = Math.min(this.maxSpeed, this.baseSpeed + this.distance * 0.04);
    }

    this.scoreText.setText(`SCORE: ${this.score}`);
    this.distanceText.setText(`DIST: ${Math.floor(this.distance)}m`);

    // Spawning obstacles
    this.spawnTimer += delta;
    const spawnThreshold = Math.max(1100, 2600 - this.distance * 0.4);
    if (this.spawnTimer > spawnThreshold) {
      this.spawnTimer = 0;
      this.spawnObstacle();
    }

    // Spawning coins
    this.coinTimer += delta;
    if (this.coinTimer > 2100) {
      this.coinTimer = 0;
      this.spawnCoin();
    }

    // Clean up out of bounds objects
    this.obstacles.getChildren().forEach((obs) => {
      if (obs.x < -60) {
        obs.destroy();
      }
    });

    this.coinsGroup.getChildren().forEach((c) => {
      if (c.x < -60) {
        c.destroy();
      }
    });

    if (this.options.onScoreUpdate && Math.floor(time) % 10 === 0) {
      this.options.onScoreUpdate(this.score);
    }
  }
}

/**
 * Game Factory Contract:
 * export function createGame(container, options)
 */
export function createGame(container, options = {}) {
  // Clear any previous child nodes in container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: 800,
    height: 480,
    backgroundColor: '#070b14',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0, x: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MainScene],
  };

  const game = new Phaser.Game(config);

  // Pass options to scene when boot finishes
  game.scene.start('MainScene', { options });

  // Expose clean wrapper interface
  return {
    gameInstance: game,
    pause: () => {
      const scene = game.scene.getScene('MainScene');
      if (scene && scene.togglePause) scene.togglePause();
    },
    resume: () => {
      const scene = game.scene.getScene('MainScene');
      if (scene && scene.resumeGame) scene.resumeGame();
    },
    restart: () => {
      const scene = game.scene.getScene('MainScene');
      if (scene && scene.restartGame) scene.restartGame();
    },
    destroy: (removeCanvas = true) => {
      try {
        game.destroy(removeCanvas);
      } catch (e) {
        console.warn('Game cleanup:', e);
      }
    },
  };
}
