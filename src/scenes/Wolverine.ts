
import Phaser from 'phaser';

export default class Wolverine extends Phaser.GameObjects.Sprite {
  public hurtBox: Phaser.Geom.Rectangle;
  private isAttacking = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'wolverine', 'idle');

    this.setOrigin(0.5, 0.5);
    this.setScale(2);
    scene.add.existing(this);

    this.hurtBox = new Phaser.Geom.Rectangle(this.x - 24, this.y - 40, 48, 80);
    this.play('idle');
  }

  update() {
    this.hurtBox.setTo(this.x - 24, this.y - 40, 48, 80);
  }

  getAttackArea(direction: 'left' | 'right'): Phaser.Geom.Rectangle {
    const offsetX = direction === 'left' ? -100 : 0;
    return new Phaser.Geom.Rectangle(this.x + offsetX, this.y - 48, 100, 96);
  }

  faceDirection(direction: 'left' | 'right') {
    this.setFlipX(direction === 'left');
  }

  attack(scene: Phaser.Scene, anim: string, direction?: 'left' | 'right', callback?: () => void) {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.setFlipX(false);
    this.play(anim);

    this.once('animationcomplete', () => {
      if (direction) this.faceDirection(direction);
      this.play('idle');
      this.isAttacking = false;
      if (callback) callback();
    });
  }

  receiveHit(fromDirection: 'left' | 'right') {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.faceDirection(fromDirection);
    this.play('hit');

    this.once('animationcomplete', () => {
      this.play('idle');
      this.isAttacking = false;
    });
  }

  canAttack() {
    return !this.isAttacking;
  }
}
