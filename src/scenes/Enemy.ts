import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Sprite {
  public direction: 'left' | 'right';
  public hitArea: Phaser.Geom.Rectangle;
  private vx: number;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: 'left' | 'right') {
    super(scene, x, y, 'ninja_running', 'run_0');
    this.direction = direction;

    this.setOrigin(0.5, 0.5);
    this.setScale(2);
    scene.add.existing(this);
    this.play('ninja_run');

    // Velocidad constante (ajustá valores si querés que vayan más rápido)
    const speed = 160; // píxeles por segundo
    this.vx = direction === 'left' ? speed : -speed;

    const baseY = this.y + (this.displayHeight / 2) - 16;
    this.hitArea = new Phaser.Geom.Rectangle(this.x - 24, baseY, 48, 32);
  }

  update(time: number, delta: number) {
    // Mover basado en el deltaTime real
    this.x += this.vx * (delta / 1000);

    const baseY = this.y + (this.displayHeight / 2) - 16;
    this.hitArea.setTo(this.x - 24, baseY, 48, 32);
  }
}
