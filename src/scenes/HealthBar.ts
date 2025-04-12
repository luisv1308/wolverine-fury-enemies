
import Phaser from 'phaser';

export default class HealthBar {
  private bar: Phaser.GameObjects.Graphics;
  private xOffset: number;
  private yOffset: number;
  private parent: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Sprite, offsetX: number = 0, offsetY: number = -60) {
    this.parent = parent;
    this.xOffset = offsetX;
    this.yOffset = offsetY;

    this.bar = scene.add.graphics();
    this.bar.setDepth(1000); // Encima de todo
  }

  update(current: number, max: number) {
    const x = this.parent.x + this.xOffset;
    const y = this.parent.y + this.yOffset;
    const width = 80;
    const height = 10;
    const pct = Phaser.Math.Clamp(current / max, 0, 1);

    this.bar.clear();

    // Fondo
    this.bar.fillStyle(0x000000, 0.5);
    this.bar.fillRect(x, y, width, height);

    // Barra de vida
    this.bar.fillStyle(0xff3333, 1);
    this.bar.fillRect(x, y, width * pct, height);

    // Borde
    this.bar.lineStyle(1, 0xffffff);
    this.bar.strokeRect(x, y, width, height);
  }

  destroy() {
    this.bar.destroy();
  }
}
