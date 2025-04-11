
import Phaser from "phaser";
import Enemy from "./Enemy";
import Wolverine from "./Wolverine";

export default class GameScene extends Phaser.Scene {
  private wolverine!: Wolverine;
  private enemies!: Phaser.GameObjects.Group;

  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.atlas("wolverine", "/wolverine_spritesheet.png", "/wolverine_spritesheet.json");
    this.load.atlas("ninja", "/ninja_running.png", "/ninja_running.json");
    this.load.image("impact_flash", "/hit_particle.png");
    this.load.audio("hit_sound", "/SFX_hit&damage1.wav");
  }

  create() {
    this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    this.wolverine = new Wolverine(this, 400, 300);
    this.enemies = this.add.group();

    this.anims.create({ key: "idle", frames: [{ key: "wolverine", frame: "idle" }], frameRate: 10, repeat: -1 });
    this.anims.create({ key: "attack_left", frames: [{ key: "wolverine", frame: "attack_left" }], frameRate: 10 });
    this.anims.create({ key: "attack_right", frames: [{ key: "wolverine", frame: "attack_right" }], frameRate: 10 });
    this.anims.create({ key: "hit", frames: [{ key: "wolverine", frame: "hit" }], frameRate: 10 });

    this.anims.create({
      key: "ninja_run",
      frames: this.anims.generateFrameNames("ninja", { start: 0, end: 5, prefix: "run_" }),
      frameRate: 10,
      repeat: -1
    });

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnEnemy(),
    });
  }

  spawnEnemy() {
    const direction = Math.random() > 0.5 ? "left" : "right";
    const x = direction === "left" ? 0 : 800;
    const y = 300;
    const enemy = new Enemy(this, x, y, direction);
    enemy.setFlipX(direction === "right");
    this.enemies.add(enemy);

    const debugHitbox = this.drawHitbox(enemy);
    enemy.setData("debugHitbox", debugHitbox);
  }

  private checkHit(direction: "left" | "right") {
    const attackArea = this.wolverine.getAttackArea(direction);

    this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
      const e = enemy as any;
      const hitbox = e.hitArea;

      if (Phaser.Geom.Intersects.RectangleToRectangle(attackArea, hitbox)) {
        this.cameras.main.shake(100, 0.01);
        this.sound.play("hit_sound");

        const flash = this.add.image(e.x, e.y, "impact_flash")
          .setScale(0.8)
          .setAlpha(1)
          .setDepth(10);

        this.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 1.5,
          duration: 200,
          ease: "Power2",
          onComplete: () => flash.destroy(),
        });

        this.removeEnemy(e);
      }
    });
  }

  private drawAttackBox(direction: 'left' | 'right') {
    const attackArea = this.wolverine.getAttackArea(direction);
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffff00, 1);
    graphics.strokeRectShape(attackArea);
    this.time.delayedCall(150, () => graphics.destroy());
  }

  private enemyHitPlayer(enemy: Enemy) {
    enemy.setData("damaged", true);
    this.cameras.main.shake(150, 0.02);

    this.tweens.add({
      targets: enemy,
      x: enemy.direction === "left" ? enemy.x - 50 : enemy.x + 50,
      alpha: 0,
      duration: 200,
      onComplete: () => this.removeEnemy(enemy)
    });

    this.wolverine.receiveHit(enemy.direction);
  }

  private removeEnemy(enemy: Enemy) {
    enemy.setData("damaged", true); // Para evitar doble eliminación
  
    const hitbox = enemy.getData("debugHitbox") as Phaser.GameObjects.Graphics;
    if (hitbox) hitbox.destroy();
  
    // 🔁 Rebote y desvanecimiento hacia su dirección original
    const offset = enemy.direction === "left" ? -50 : 50;
  
    this.tweens.add({
      targets: enemy,
      x: enemy.x + offset,
      y: enemy.y - 20,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => enemy.destroy()
    });
  }  

  private drawHitbox(obj: Phaser.GameObjects.GameObject, color = 0xff0000): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, color, 1);
    const enemy = obj as any;
    if (enemy.hitArea) {
      graphics.strokeRectShape(enemy.hitArea);
    } else {
      const bounds = (obj as Phaser.GameObjects.Sprite).getBounds();
      graphics.strokeRectShape(bounds);
    }
    return graphics;
  }

  update(time: number, delta: number) {
    this.wolverine.update();

    (this.enemies.getChildren() as Enemy[]).forEach((enemy) => {
      if (!enemy.active) return;

      enemy.update(time, delta);

      const hitbox = enemy.getData("debugHitbox") as Phaser.GameObjects.Graphics;
      if (hitbox) {
        hitbox.clear();
        hitbox.lineStyle(1, 0xff0000, 1);
        hitbox.strokeRectShape(enemy.hitArea);
      }

      if (
        !enemy.getData("damaged") &&
        Phaser.Geom.Intersects.RectangleToRectangle(enemy.hitArea, this.wolverine.hurtBox)
      ) {
        this.enemyHitPlayer(enemy);
      }
    });

    if (this.wolverine.canAttack()) {
      if (Phaser.Input.Keyboard.JustDown(this.keyLeft)) {
        this.wolverine.attack(this, "attack_left", "left", () => this.checkHit("left"));
        this.drawAttackBox("left");
      } else if (Phaser.Input.Keyboard.JustDown(this.keyRight)) {
        this.wolverine.attack(this, "attack_right", "right", () => this.checkHit("right"));
        this.drawAttackBox("right");
      } else if (Phaser.Input.Keyboard.JustDown(this.keyDown)) {
        this.wolverine.attack(this, "hit");
      }
    }
  }
}
