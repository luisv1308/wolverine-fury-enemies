// Wolverine.ts
import Phaser from "phaser";
import HealthBar from "./HealthBar";

type WolverineState = 'idle' | 'charging' | 'attacking' | 'vulnerable' | 'stunned' | 'dead';

export default class Wolverine extends Phaser.GameObjects.Sprite {
  public hp: number = 100;
  public maxHp: number = 100;
  public speed: number = 100;
  public isBerserk: boolean = false;

  public hurtBox: Phaser.Geom.Rectangle;
  public hurtZone: Phaser.Geom.Rectangle;

  private state: WolverineState = 'idle';
  private currentTarget: Phaser.GameObjects.Sprite | null = null;
  private healthBar: HealthBar;

  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;

  private currentScene!: Phaser.Scene;
  private attackCallback?: (target: Phaser.GameObjects.Sprite | null) => void;
  private failCallback?: (direction: "left" | "right") => void;

  private attackZoneWidth = 240;
  public attackZoneLeft!: Phaser.Geom.Rectangle;
  public attackZoneRight!: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "wolverine_idle_right", "wolverine_idle_right_0");
    this.currentScene = scene;

    this.setOrigin(0.5, 0.5);
    this.setScale(2);
    scene.add.existing(this);

    this.hurtBox = new Phaser.Geom.Rectangle(this.x - 24, this.y - 40, 48, 80);
    this.hurtZone = new Phaser.Geom.Rectangle(this.x - 24, this.y, 48, 32);
    this.healthBar = new HealthBar(scene, this, -40, -60);

    this.keyLeft = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    this.updateAttackZones();
  }

  private setState(newState: WolverineState, anim?: string) {
    this.state = newState;
    if (anim) this.play(anim);
  }

  setAttackHandlers(
    onAttack: (target: Phaser.GameObjects.Sprite | null) => void,
    onFail: (direction: "left" | "right") => void
  ) {
    this.attackCallback = onAttack;
    this.failCallback = onFail;
  }

  updateAttackZones() {
    const z = this.attackZoneWidth;
    const footY = this.y + this.displayHeight / 2 - 4;

    this.attackZoneLeft = new Phaser.Geom.Rectangle(this.x - z - 20, footY, z, 4);
    this.attackZoneRight = new Phaser.Geom.Rectangle(this.x + 20, footY, z, 4);

    this.hurtZone.setTo(this.x - 24, footY - 16, 48, 32);
  }

  update(isEnemyInSafeZone: (direction: "left" | "right") => boolean) {
    this.hurtBox.setTo(this.x - 24, this.y - 40, 48, 80);
    this.healthBar.update(this.hp, this.maxHp);
    this.updateAttackZones();

    if (this.state === 'idle') {
      if (Phaser.Input.Keyboard.JustDown(this.keyLeft)) {
        this.handleAttack("left", isEnemyInSafeZone);
      } else if (Phaser.Input.Keyboard.JustDown(this.keyRight)) {
        this.handleAttack("right", isEnemyInSafeZone);
      }
    }
  }

  private handleAttack(direction: "left" | "right", checkZone: (dir: "left" | "right") => boolean) {
    this.setFlipX(direction === "left");

    if (checkZone(direction)) {
      const zone = this.getAttackArea(direction);
      const enemies = this.currentScene.children.list.filter(
        (e) =>
          e.getData("enemy") &&
          Phaser.Geom.Intersects.RectangleToRectangle(zone, e.getData("hitArea"))
      );

      if (enemies.length === 0) {
        this.resetToIdle();
        return;
      }

      const sorted = enemies.sort(
        (a: any, b: any) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x)
      );

      const target = sorted[0] as Phaser.GameObjects.Sprite;
      this.currentTarget = target;

      this.setState('charging', 'run');

      const stopOffset = 96;
      const rawOffset = direction === "left" ? stopOffset : -stopOffset;
      const distanceToEnemy = Math.abs(this.x - target.x);
      let destinationX = direction === "left" ? target.x + stopOffset : target.x - stopOffset;

      if (distanceToEnemy < stopOffset) destinationX = this.x;

      this.currentScene.tweens.add({
        targets: this,
        x: destinationX,
        duration: 220,
        onComplete: () => {
          this.currentScene.time.delayedCall(50, () => {
            this.setFlipX(direction === "left");
            this.setState('attacking', 'attack1');

            this.once("animationcomplete-attack1", () => {
              this.setState('idle', 'idle');

              if (this.attackCallback && this.currentTarget === target) {
                this.attackCallback(target);
              }

              this.currentTarget = null;
            });
          });
        },
      });
    } else {
      this.setState('attacking', 'attack1');

      this.once("animationcomplete-attack1", () => {
        this.setState('vulnerable', 'idle');
        this.currentScene.time.delayedCall(200, () => {
          this.setState('idle', 'idle');
          if (this.failCallback) this.failCallback(direction);
        });
      });
    }
  }

  getAttackArea(direction: "left" | "right"): Phaser.Geom.Rectangle {
    return direction === "left" ? this.attackZoneLeft : this.attackZoneRight;
  }

  receiveHit(fromDirection: "left" | "right") {
    if (this.state === 'charging' || this.state === 'stunned' || this.state === 'attacking') return;

    this.setState('stunned');
    this.setFlipX(fromDirection === "left");

    this.anims.stop();
    this.setTexture("wolverine", "hit");
    this.setTint(0xff0000);
    this.takeDamage(10);
    this.currentScene.cameras.main.shake(150, 0.02);

    const flash = this.currentScene.add
      .rectangle(this.x, this.y, 96, 96, 0xff0000, 0.5)
      .setOrigin(0.5)
      .setDepth(1000);

    this.currentScene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    const pushDistance = 30;
    const direction = fromDirection === "left" ? 1 : -1;

    this.currentScene.tweens.add({
      targets: this,
      x: this.x + direction * pushDistance,
      duration: 150,
      ease: "Power2",
    });

    this.currentScene.time.delayedCall(600, () => {
      this.clearTint();
      this.setTexture("wolverine_idle_right", "wolverine_idle_right_0");
      this.setState('idle', 'idle');
    });
  }

  takeDamage(amount: number) {
    this.hp = Math.max(this.hp - amount, 0);
  }

  heal(amount: number) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }

  canAttack() {
    return this.state === 'idle';
  }

  private resetToIdle() {
    this.setState('idle', 'idle');
  }

  setAttackZoneWidth(newWidth: number) {
    this.attackZoneWidth = newWidth;
  }
}
