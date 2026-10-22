import Phaser from 'phaser';

class InvaderAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
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

  playLaser() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playExplosion() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

class InvadersScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InvadersScene' });
  }

  init(data) {
    this.options = data.options || {};
    this.audio = new InvaderAudio();
    this.audio.setMuted(this.options.isMuted || false);

    this.gameState = 'START';
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.lastFired = 0;
    this.invaderSpeed = 70;
    this.invaderDirection = 1;
    this.highScore = parseInt(localStorage.getItem('neon_arcade_hs_invaders') || '0', 10);
  }

  preload() {
    const assets = this.options.assets || {};
    if (assets['assets/player.png']) {
      this.load.image('ship-player', assets['assets/player.png']);
    }
    if (assets['assets/invader.png']) {
      this.load.image('alien-invader', assets['assets/invader.png']);
    }
    if (assets['assets/background.webp']) {
      this.load.image('space-bg', assets['assets/background.webp']);
    }
  }

  create() {
    const { width, height } = this.scale;

    // Background
    if (this.textures.exists('space-bg')) {
      this.bg = this.add.tileSprite(0, 0, width, height, 'space-bg')
        .setOrigin(0, 0)
        .setDisplaySize(width, height)
        .setAlpha(0.7);
    } else {
      this.bg = this.add.rectangle(0, 0, width, height, 0x050813).setOrigin(0, 0);
    }

    // Stars particle effect
    const starGfx = this.make.graphics();
    starGfx.fillStyle(0xffffff, 0.9);
    starGfx.fillCircle(2, 2, 2);
    starGfx.generateTexture('star-dot', 4, 4);
    starGfx.destroy();

    this.add.particles(0, 0, 'star-dot', {
      x: { min: 0, max: width },
      y: 0,
      lifespan: 3000,
      speedY: { min: 30, max: 90 },
      scale: { start: 0.6, end: 0.1 },
      quantity: 1,
      frequency: 100,
    });

    // Groups
    this.lasers = this.physics.add.group();
    this.alienLasers = this.physics.add.group();
    this.invaders = this.physics.add.group();

    // Player
    if (this.textures.exists('ship-player')) {
      this.player = this.physics.add.sprite(width / 2, height - 55, 'ship-player');
      this.player.setDisplaySize(44, 34);
    } else {
      this.player = this.physics.add.sprite(width / 2, height - 55, null);
      const gfx = this.make.graphics();
      gfx.fillStyle(0x06b6d4, 1);
      gfx.fillTriangle(0, 32, 20, 0, 40, 32);
      gfx.generateTexture('ship-fallback', 40, 32);
      gfx.destroy();
      this.player.setTexture('ship-fallback');
    }
    this.player.setCollideWorldBounds(true);

    // Collisions
    this.physics.add.overlap(this.lasers, this.invaders, this.handleHitAlien, null, this);
    this.physics.add.overlap(this.alienLasers, this.player, this.handleHitPlayer, null, this);
    this.physics.add.overlap(this.invaders, this.player, this.handleInvaderBreach, null, this);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // Mobile touch
    this.input.on('pointerdown', (p) => {
      if (this.gameState === 'START') this.startGame();
      else if (this.gameState === 'GAMEOVER') this.restartGame();
    });

    this.createHUD();
    this.createStartScreen();
  }

  createHUD() {
    const { width } = this.scale;
    this.hud = this.add.container(0, 0);
    const hudBar = this.add.rectangle(0, 0, width, 48, 0x050813, 0.8).setOrigin(0, 0);

    this.scoreText = this.add.text(20, 14, 'SCORE: 0', {
      fontSize: '16px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#06b6d4',
    });

    this.waveText = this.add.text(200, 14, 'WAVE: 1', {
      fontSize: '15px',
      fontFamily: 'Outfit, sans-serif',
      color: '#94a3b8',
    });

    this.livesText = this.add.text(320, 14, 'SHIELDS: ♥ ♥ ♥', {
      fontSize: '15px',
      fontFamily: 'Outfit, sans-serif',
      color: '#ec4899',
    });

    this.highScoreText = this.add.text(width - 140, 14, `BEST: ${this.highScore}`, {
      fontSize: '15px',
      fontFamily: 'Outfit, sans-serif',
      color: '#a855f7',
    });

    this.hud.add([hudBar, this.scoreText, this.waveText, this.livesText, this.highScoreText]);
  }

  createStartScreen() {
    const { width, height } = this.scale;
    this.startContainer = this.add.container(0, 0);
    const scrim = this.add.rectangle(0, 0, width, height, 0x050813, 0.82).setOrigin(0, 0);

    const title = this.add.text(width / 2, height / 2 - 60, 'CYBER INVADERS', {
      fontSize: '40px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 10, 'TAP OR PRESS SPACE TO ENGAGE', {
      fontSize: '18px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: '#06b6d4',
    }).setOrigin(0.5);

    const info = this.add.text(
      width / 2,
      height / 2 + 45,
      'Arrow Keys / A & D = Move · Space = Fire Laser · P = Pause',
      {
        fontSize: '14px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        color: '#94a3b8',
      }
    ).setOrigin(0.5);

    this.startContainer.add([scrim, title, subtitle, info]);
  }

  spawnInvaderWave() {
    this.invaders.clear(true, true);
    const { width } = this.scale;
    const cols = 8;
    const rows = 3;
    const startX = 120;
    const startY = 90;
    const spacingX = 75;
    const spacingY = 46;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacingX;
        const y = startY + r * spacingY;
        let alien;
        if (this.textures.exists('alien-invader')) {
          alien = this.invaders.create(x, y, 'alien-invader');
          alien.setDisplaySize(34, 26);
        } else {
          alien = this.invaders.create(x, y, null);
          const gfx = this.make.graphics();
          gfx.fillStyle(0xa855f7, 1);
          gfx.fillRoundedRect(0, 0, 30, 24, 4);
          gfx.generateTexture('alien-fallback', 30, 24);
          gfx.destroy();
          alien.setTexture('alien-fallback');
        }
        alien.body.setAllowGravity(false);
      }
    }

    this.invaderSpeed = 70 + (this.wave - 1) * 20;
    this.invaderDirection = 1;
    this.waveText.setText(`WAVE: ${this.wave}`);
  }

  startGame() {
    this.gameState = 'PLAYING';
    if (this.startContainer) this.startContainer.destroy();
    this.spawnInvaderWave();
    if (this.options.onStateChange) this.options.onStateChange('PLAYING');
  }

  fireLaser() {
    const laser = this.lasers.create(this.player.x, this.player.y - 18, null);
    const gfx = this.make.graphics();
    gfx.fillStyle(0x06b6d4, 1);
    gfx.fillRect(0, 0, 4, 14);
    gfx.generateTexture('laser-beam', 4, 14);
    gfx.destroy();

    laser.setTexture('laser-beam');
    laser.body.setAllowGravity(false);
    laser.setVelocityY(-550);
    this.audio.playLaser();
  }

  handleHitAlien(laser, alien) {
    laser.destroy();
    alien.destroy();
    this.score += 100;
    this.audio.playExplosion();

    this.scoreText.setText(`SCORE: ${this.score}`);
    if (this.options.onScoreUpdate) this.options.onScoreUpdate(this.score);

    // If wave cleared, advance wave
    if (this.invaders.countActive() === 0) {
      this.wave += 1;
      this.score += 500;
      this.time.delayedCall(700, () => {
        this.spawnInvaderWave();
      });
    }
  }

  handleHitPlayer(player, laser) {
    laser.destroy();
    this.lives -= 1;
    this.audio.playExplosion();
    this.cameras.main.shake(200, 0.02);

    let hearts = '';
    for (let i = 0; i < this.lives; i++) hearts += '♥ ';
    this.livesText.setText(`SHIELDS: ${hearts || 'DEPLETED'}`);

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  handleInvaderBreach() {
    this.lives = 0;
    this.livesText.setText('SHIELDS: BREACHED');
    this.gameOver();
  }

  gameOver() {
    this.gameState = 'GAMEOVER';
    this.audio.playExplosion();
    const { width, height } = this.scale;

    this.gameOverContainer = this.add.container(0, 0);
    const scrim = this.add.rectangle(0, 0, width, height, 0x050813, 0.85).setOrigin(0, 0);

    const title = this.add.text(width / 2, height / 2 - 60, 'MISSION FAILED', {
      fontSize: '38px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#ec4899',
    }).setOrigin(0.5);

    const finalScore = this.add.text(width / 2, height / 2 - 10, `FINAL SCORE: ${this.score}`, {
      fontSize: '22px',
      fontFamily: 'Outfit, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neon_arcade_hs_invaders', this.highScore.toString());
      this.highScoreText.setText(`BEST: ${this.highScore}`);
    }

    const btn = this.add.rectangle(width / 2, height / 2 + 65, 180, 44, 0x06b6d4)
      .setInteractive({ useHandCursor: true });
    
    const btnText = this.add.text(width / 2, height / 2 + 65, 'ENGAGE AGAIN', {
      fontSize: '15px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#070b14',
    }).setOrigin(0.5);

    btn.on('pointerdown', () => this.restartGame());

    this.gameOverContainer.add([scrim, title, finalScore, btn, btnText]);

    if (this.options.onGameOver) this.options.onGameOver(this.score);
    if (this.options.onStateChange) this.options.onStateChange('GAMEOVER');
  }

  restartGame() {
    if (this.gameOverContainer) this.gameOverContainer.destroy();
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.scoreText.setText('SCORE: 0');
    this.livesText.setText('SHIELDS: ♥ ♥ ♥');
    this.lasers.clear(true, true);
    this.alienLasers.clear(true, true);
    this.spawnInvaderWave();
    this.gameState = 'PLAYING';
    if (this.options.onStateChange) this.options.onStateChange('PLAYING');
    if (this.options.onScoreUpdate) this.options.onScoreUpdate(0);
  }

  update(time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
      if (this.gameState === 'PLAYING') {
        this.gameState = 'PAUSED';
      } else if (this.gameState === 'PAUSED') {
        this.gameState = 'PLAYING';
      }
    }

    if (this.gameState !== 'PLAYING') return;

    // Movement
    const speed = 320;
    let moveX = 0;
    if (this.cursors.left.isDown || this.keyA.isDown) moveX = -1;
    else if (this.cursors.right.isDown || this.keyD.isDown) moveX = 1;

    // Pointer touch controls (left half of screen = left, right half = right)
    if (this.input.activePointer.isDown) {
      const px = this.input.activePointer.x;
      if (px < this.player.x - 20) moveX = -1;
      else if (px > this.player.x + 20) moveX = 1;
    }

    this.player.setVelocityX(moveX * speed);

    // Laser fire rate
    if ((this.keySpace.isDown || this.input.activePointer.isDown) && time > this.lastFired + 250) {
      this.fireLaser();
      this.lastFired = time;
    }

    // Invader Fleet Movement
    const { width, height } = this.scale;
    let switchDir = false;
    this.invaders.getChildren().forEach((alien) => {
      alien.x += this.invaderDirection * this.invaderSpeed * (delta / 1000);
      if (alien.x > width - 40 || alien.x < 40) {
        switchDir = true;
      }
      if (alien.y > height - 100) {
        this.handleInvaderBreach();
      }
    });

    if (switchDir) {
      this.invaderDirection *= -1;
      this.invaders.getChildren().forEach((alien) => {
        alien.y += 18;
      });
    }

    // Invader Laser Fire
    if (Math.random() < 0.02 && this.invaders.getChildren().length > 0) {
      const aliens = this.invaders.getChildren();
      const shooter = aliens[Math.floor(Math.random() * aliens.length)];
      if (shooter) {
        const alienLaser = this.alienLasers.create(shooter.x, shooter.y + 16, null);
        const gfx = this.make.graphics();
        gfx.fillStyle(0xec4899, 1);
        gfx.fillRect(0, 0, 4, 12);
        gfx.generateTexture('alien-laser-beam', 4, 12);
        gfx.destroy();
        alienLaser.setTexture('alien-laser-beam');
        alienLaser.body.setAllowGravity(false);
        alienLaser.setVelocityY(280);
      }
    }

    // Clean lasers
    this.lasers.getChildren().forEach((l) => {
      if (l.y < -20) l.destroy();
    });
    this.alienLasers.getChildren().forEach((al) => {
      if (al.y > height + 20) al.destroy();
    });
  }
}

export function createGame(container, options = {}) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: 800,
    height: 480,
    backgroundColor: '#050813',
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
    scene: [InvadersScene],
  };

  const game = new Phaser.Game(config);
  game.scene.start('InvadersScene', { options });

  return {
    gameInstance: game,
    destroy: (removeCanvas = true) => {
      try {
        game.destroy(removeCanvas);
      } catch (e) {
        console.warn('Game cleanup:', e);
      }
    },
  };
}
