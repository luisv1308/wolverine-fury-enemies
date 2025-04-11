import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Sprite {
  direction: 'left' | 'right';
  speed: number;
  hitArea: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: 'left' | 'right') {
    super(scene, x, y, 'ninja', 'run_0');
    this.direction = direction;
    this.speed = 100;

    this.setOrigin(0.5);
    this.setScale(2);
    this.setFlipX(direction === 'right');

    // 🟥 Crear hitArea manual (por ejemplo más angosta y centrada)
    const offsetX = -20;
    const offsetY = -40;
    const width = 40;
    const height = 80;
    this.hitArea = new Phaser.Geom.Rectangle(this.x + offsetX, this.y + offsetY, width, height);

    scene.add.existing(this);
    this.play('ninja_run');
  }

  update(time: number, delta: number) {
    const velocity = (this.speed * delta) / 1000;
    this.x += this.direction === 'left' ? velocity : -velocity;

    // 🟥 Actualizar posición del hitArea con el sprite
    this.hitArea.x = this.x - 20;
    this.hitArea.y = this.y - 40;
  }
}
