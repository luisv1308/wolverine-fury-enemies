import Phaser from "phaser";
import Enemy from "./Enemy";

export default class GameScene extends Phaser.Scene {
  private wolverine!: Phaser.GameObjects.Sprite;
  private enemies!: Phaser.GameObjects.Group;

  private isAttacking = false;
  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.atlas(
      "wolverine",
      "/wolverine_spritesheet.png",
      "/wolverine_spritesheet.json"
    );
  }

  create() {
    this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    this.wolverine = this.add
      .sprite(400, 300, "wolverine", "idle")
      .setOrigin(0.5, 0.5)
      .setScale(2);

    this.enemies = this.add.group();

    this.anims.create({
      key: "idle",
      frames: [{ key: "wolverine", frame: "idle" }],
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "attack_left",
      frames: [{ key: "wolverine", frame: "attack_left" }],
      frameRate: 10,
    });
    this.anims.create({
      key: "attack_right",
      frames: [{ key: "wolverine", frame: "attack_right" }],
      frameRate: 10,
    });
    this.anims.create({
      key: "hit",
      frames: [{ key: "wolverine", frame: "hit" }],
      frameRate: 10,
    });

    this.wolverine.play("idle");

    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.spawnEnemy(),
    });
  }

  private attack(anim: string, direction?: 'left' | 'right') {
    this.isAttacking = true;
    this.wolverine.play(anim);

    if (direction) this.checkHit(direction);

    this.wolverine.once("animationcomplete", () => {
      this.wolverine.play("idle");
      this.isAttacking = false;
    });
  }

  spawnEnemy() {
    const direction = Math.random() > 0.5 ? "left" : "right";
    const x = direction === "left" ? 0 : 800;
    const y = 300;
    const enemy = new Enemy(this, x, y, direction);
    this.enemies.add(enemy);
  }

  checkHit(direction: "left" | "right") {
    this.enemies.getChildren().forEach((enemy: Phaser.GameObjects.GameObject) => {
      const e = enemy as any;
      if (direction === "left" && e.x < 400 && e.x > 300) {
        e.destroy();
      } else if (direction === "right" && e.x > 400 && e.x < 500) {
        e.destroy();
      }
    });
  }

  update(time: number, delta: number) {
    (this.enemies.getChildren() as Enemy[]).forEach((enemy) => {
      enemy.update(time, delta);
    });
  
    if (!this.isAttacking) {
      if (Phaser.Input.Keyboard.JustDown(this.keyLeft)) {
        this.attack("attack_left", "left");
      } else if (Phaser.Input.Keyboard.JustDown(this.keyRight)) {
        this.attack("attack_right", "right");
      } else if (Phaser.Input.Keyboard.JustDown(this.keyDown)) {
        this.attack("hit");
      }
    }
  }
}
