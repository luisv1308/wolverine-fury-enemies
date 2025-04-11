import Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Sprite {
  direction: 'left' | 'right';
  speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: 'left' | 'right') {
    super(scene, x, y, 'wolverine', 'hit'); // podés cambiar el frame por otro si querés
    this.direction = direction;
    this.speed = 100;

    this.setScale(2);
    this.setOrigin(0.5, 0.5);
    scene.add.existing(this);
  }

  update(time: number, delta: number) {
    if (this.direction === 'left') {
      this.x += (this.speed * delta) / 1000;
    } else {
      this.x -= (this.speed * delta) / 1000;
    }
  }  
}
