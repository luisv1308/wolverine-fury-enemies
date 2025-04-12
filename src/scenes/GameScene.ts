// ✅ GameScene.ts con fondo que hace scroll y se repite (tileSprite)
import Phaser from "phaser";
import Enemy from "./Enemy";
import Wolverine from "./Wolverine";

export default class GameScene extends Phaser.Scene {
  private wolverine!: Wolverine;
  private enemies!: Phaser.GameObjects.Group;
  private zoneGraphics!: Phaser.GameObjects.Graphics;
  private background!: Phaser.GameObjects.TileSprite;

  constructor() {
    super("GameScene");
  }

  preload() {
    const sheets = [
      "wolverine_idle_right",
      "wolverine_run_right",
      "wolverine_attack1_right",
      "wolverine_attack2_right",
      "wolverine_attack_strong1_right",
      "ninja_running"
    ];

    for (const sheet of sheets) {
      this.load.atlas(sheet, `/${sheet}.png`, `/${sheet}.json`);
    }

    this.load.atlas("wolverine", "/wolverine_spritesheet.png", "/wolverine_spritesheet.json");
    this.load.image("background", "bg2.png");
    this.load.image("impact_flash", "hit_particle.png");
    this.load.audio("hit_sound", "SFX_hit&damage1.wav");
  }

  create() {
    this.createAnimations();

    // Fondo que se repite horizontalmente y sigue a la cámara
    this.background = this.add.tileSprite(0, 600, this.cameras.main.width, 600, "background")
      .setOrigin(0, 1)
      .setScrollFactor(1);

    this.wolverine = new Wolverine(this, 1600, 480);
    this.wolverine.play("idle");
    this.wolverine.setAttackHandlers(
      (enemy) => this.handleSuccessfulHit(enemy),
      (dir) => this.failAttack(dir)
    );

    this.cameras.main.setBounds(0, 0, 3200, 600);
    this.physics.world.setBounds(0, 0, 3200, 600);
    this.cameras.main.startFollow(this.wolverine, true, 0.1, 0.1);

    this.enemies = this.add.group();
    this.zoneGraphics = this.add.graphics().setDepth(999);

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.spawnEnemy(),
    });
  }

  private createAnimations() {
    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNames("wolverine_idle_right", {
        start: 0,
        end: 9,
        prefix: "wolverine_idle_right_"
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNames("wolverine_run_right", {
        start: 0,
        end: 4,
        prefix: "wolverine_run_right_"
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "attack1",
      frames: this.anims.generateFrameNames("wolverine_attack1_right", {
        start: 0,
        end: 6,
        prefix: "wolverine_attack1_right_"
      }),
      frameRate: 30,
      repeat: 0
    });

    this.anims.create({
      key: "attack2",
      frames: this.anims.generateFrameNames("wolverine_attack2_right", {
        start: 0,
        end: 4,
        prefix: "wolverine_attack2_right_"
      }),
      frameRate: 12,
      repeat: 0
    });

    this.anims.create({
      key: "strong1",
      frames: this.anims.generateFrameNames("wolverine_attack_strong1_right", {
        start: 0,
        end: 3,
        prefix: "wolverine_attack_strong1_right_"
      }),
      frameRate: 12,
      repeat: 0
    });

    this.anims.create({
      key: "ninja_run",
      frames: this.anims.generateFrameNames("ninja_running", {
        start: 0,
        end: 5,
        prefix: "run_"
      }),
      frameRate: 15,
      repeat: -1
    });

    this.anims.create({
      key: "hit",
      frames: [{ key: "wolverine", frame: "hit" }],
      frameRate: 10
    });
  }

  private drawSafeZones() {
    this.zoneGraphics.clear();
    this.zoneGraphics.fillStyle(0x0000ff, 0.3);
    this.zoneGraphics.fillRectShape(this.wolverine.attackZoneLeft);
    this.zoneGraphics.fillStyle(0xff0000, 0.3);
    this.zoneGraphics.fillRectShape(this.wolverine.attackZoneRight);
  }

  private isEnemyInSafeZone(direction: "left" | "right"): boolean {
    const zone = this.wolverine.getAttackArea(direction);
    return this.enemies.getChildren().some((enemy: any) => {
      return Phaser.Geom.Intersects.RectangleToRectangle(zone, enemy.hitArea);
    });
  }

  private failAttack(direction: "left" | "right") {
    this.wolverine.setFlipX(direction === "left");
  }

  private spawnEnemy() {
    const direction = Math.random() > 0.5 ? "left" : "right";
    const offset = 400;
    const x = direction === "left"
      ? this.wolverine.x - offset
      : this.wolverine.x + offset;
    const y = 480;
    const enemy = new Enemy(this, x, y, direction);
    enemy.setFlipX(direction === "right");
    enemy.setData("enemy", true);
    enemy.setData("hitArea", enemy.hitArea);
    this.enemies.add(enemy);
  }

  private handleSuccessfulHit(enemy: Phaser.GameObjects.Sprite | null) {
    if (!enemy) return;

    this.cameras.main.shake(100, 0.01);
    this.sound.play("hit_sound");

    const flash = this.add.image(enemy.x, enemy.y, "impact_flash")
      .setScale(0.8)
      .setAlpha(1)
      .setDepth(10);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      ease: "Power2",
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: enemy,
      y: enemy.y - 20,
      alpha: 0,
      duration: 250,
      onComplete: () => enemy.destroy()
    });
  }

  private enemyHitPlayer(enemy: Enemy) {
    if (enemy.getData("damaged")) return;

    enemy.setData("damaged", true);
    this.wolverine.receiveHit(enemy.direction);

    this.tweens.add({
      targets: enemy,
      x: enemy.direction === "left" ? enemy.x - 50 : enemy.x + 50,
      alpha: 0,
      duration: 200,
      onComplete: () => enemy.destroy()
    });
  }

  update(time: number, delta: number) {
    this.wolverine.update(this.isEnemyInSafeZone.bind(this));
    this.drawSafeZones();

    this.enemies.getChildren().forEach((enemy: any) => {
      enemy.update(time, delta);
      if (
        !enemy.getData("damaged") &&
        Phaser.Geom.Intersects.RectangleToRectangle(
          enemy.hitArea,
          this.wolverine.hurtZone
        )
      ) {
        this.enemyHitPlayer(enemy);
      }
    });
  }
}
