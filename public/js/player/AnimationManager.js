export class AnimationManager {
  constructor(scene) {
    this.scene = scene;
    this._createAnimations();
  }

  _createAnimations() {
    const dirs = [
      { name: 'up', row: 0 },
      { name: 'left', row: 1 },
      { name: 'down', row: 2 },
      { name: 'right', row: 3 }
    ];

    // Walk layers
    const walkLayers = ['body_walk', 'legs_walk', 'feet_walk', 'torso_walk', 'head_walk'];
    const walkCols = 9;

    dirs.forEach(dir => {
      walkLayers.forEach(layer => {
        const key = `${layer}_${dir.name}`;
        if (!this.scene.anims.exists(key)) {
          this.scene.anims.create({
            key,
            frames: this.scene.anims.generateFrameNumbers(layer, {
              start: dir.row * walkCols + 1,
              end: dir.row * walkCols + 8
            }),
            frameRate: 10,
            repeat: -1
          });
        }
      });
    });

    // Slash layers
    const slashLayers = ['body_slash', 'legs_slash', 'feet_slash', 'torso_slash', 'head_slash'];
    const slashCols = 6;

    dirs.forEach(dir => {
      slashLayers.forEach(layer => {
        const key = `${layer}_${dir.name}`;
        if (!this.scene.anims.exists(key)) {
          this.scene.anims.create({
            key,
            frames: this.scene.anims.generateFrameNumbers(layer, {
              start: dir.row * slashCols,
              end: dir.row * slashCols + 5
            }),
            frameRate: 12,
            repeat: 0
          });
        }
      });
    });
  }

  setIdle(dir, sprites) {
    const dirMap = { up: 0, left: 1, down: 2, right: 3 };
    const row = dirMap[dir];
    const frame = row * 9;

    const walkKeys = ['body_walk', 'feet_walk', 'legs_walk', 'torso_walk', 'head_walk'];

    sprites.forEach((s, i) => {
      s.stop();
      s.setTexture(walkKeys[i], frame);
    });
  }

  playWalk(dir, sprites) {
    const walkKeys = ['body_walk', 'feet_walk', 'legs_walk', 'torso_walk', 'head_walk'];

    sprites.forEach((s, i) => {
      const animKey = `${walkKeys[i]}_${dir}`;
      if (s.anims.currentAnim?.key !== animKey) {
        s.play(animKey);
      }
    });
  }
}
