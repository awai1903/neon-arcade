import Phaser from 'phaser';

class PulseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PulseScene' });
  }

  init(data) {
    this.options = data.options || {};
    this.score = 0;
    this.nodes = [];
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x060913).setOrigin(0, 0);

    const title = this.add.text(width / 2, 40, 'PULSE CIRCUIT', {
      fontSize: '28px',
      fontFamily: 'Outfit, sans-serif',
      fontStyle: 'bold',
      color: '#06b6d4',
    }).setOrigin(0.5);

    this.scoreText = this.add.text(width / 2, 75, 'ENERGY: 0', {
      fontSize: '18px',
      fontFamily: 'Outfit, sans-serif',
      color: '#ec4899',
    }).setOrigin(0.5);

    // Grid of pulsing interactive nodes
    const colors = [0x06b6d4, 0xa855f7, 0xec4899, 0x10b981];
    const cols = 4;
    const rows = 3;
    const startX = width / 2 - ((cols - 1) * 90) / 2;
    const startY = 150;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * 90;
        const y = startY + r * 90;
        const color = colors[(r + c) % colors.length];

        const circle = this.add.circle(x, y, 26, color, 0.8)
          .setInteractive({ useHandCursor: true });

        this.tweens.add({
          targets: circle,
          scale: 1.15,
          alpha: 1,
          duration: 400 + Math.random() * 300,
          yoyo: true,
          repeat: -1,
        });

        circle.on('pointerdown', () => {
          this.score += 25;
          this.scoreText.setText(`ENERGY: ${this.score}`);
          if (this.options.onScoreUpdate) {
            this.options.onScoreUpdate(this.score);
          }

          this.tweens.add({
            targets: circle,
            scale: 1.6,
            duration: 100,
            yoyo: true,
          });
        });

        this.nodes.push(circle);
      }
    }
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
    backgroundColor: '#060913',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PulseScene],
  };

  const game = new Phaser.Game(config);
  game.scene.start('PulseScene', { options });

  return {
    gameInstance: game,
    destroy: (removeCanvas = true) => {
      try {
        game.destroy(removeCanvas);
      } catch (e) {
        console.warn(e);
      }
    },
  };
}
