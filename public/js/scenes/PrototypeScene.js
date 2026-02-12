class PrototypeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PrototypeScene' });
  }

  create() {
    this.W = this.cameras.main.width;
    this.H = this.cameras.main.height;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Extensible prototype registry
    this.prototypes = [
      {
        key: 'ProtoBaseScene',
        label: 'Proto Base',
        desc: 'Full game systems in a 2000x2000 world',
        color: 0x10b981
      },
      {
        key: 'ProtoMinimalScene',
        label: 'Proto Minimal',
        desc: '2000x2000 grass-only ground, no terrain gen',
        color: 0x60a5fa
      }
    ];

    this.selectedIndex = 0;
    this.joystickCooldown = 0;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x080e1a, 0x080e1a, 0x0d0d0d, 0x0d0d0d, 1);
    bg.fillRect(0, 0, this.W, this.H);

    // Particles
    for (let i = 0; i < 15; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(0, this.W), Phaser.Math.Between(0, this.H),
        Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.02, 0.06)
      );
      this.tweens.add({
        targets: dot, y: dot.y - Phaser.Math.Between(15, 40), alpha: 0,
        duration: Phaser.Math.Between(4000, 8000), repeat: -1, yoyo: true
      });
    }

    // Title
    const cx = this.W / 2;
    this.add.text(cx, 60, 'PROTOTYPES', {
      fontSize: '28px', fontFamily: '"Rubik", sans-serif', color: '#ffffff', fontStyle: '700'
    }).setOrigin(0.5);

    this.add.text(cx, 88, 'Select a prototype to test', {
      fontSize: '11px', fontFamily: '"Inter", sans-serif', color: 'rgba(255,255,255,0.4)'
    }).setOrigin(0.5);

    // Draw cards
    this.cardItems = [];
    this._drawCards();

    // Indicator
    this.indicator = this.add.text(0, 0, '>', {
      fontSize: '18px', fontFamily: '"Inter", sans-serif', color: '#ffd700', fontStyle: '700'
    }).setOrigin(1, 0.5);

    this._updateSelection();

    // ESC hint
    this.add.text(cx, this.H - 24, '[ESC] Back to Menu', {
      fontSize: '9px', fontFamily: '"JetBrains Mono", monospace',
      color: 'rgba(255,255,255,0.3)'
    }).setOrigin(0.5);

    // Keyboard
    this.input.keyboard.on('keydown-ESC', () => this._goBack());
    this.input.keyboard.on('keydown-UP', () => this._navigate(-1));
    this.input.keyboard.on('keydown-DOWN', () => this._navigate(1));
    this.input.keyboard.on('keydown-W', () => this._navigate(-1));
    this.input.keyboard.on('keydown-S', () => this._navigate(1));
    this.input.keyboard.on('keydown-ENTER', () => this._selectCurrent());
    this.input.keyboard.on('keydown-SPACE', () => this._selectCurrent());
  }

  _drawCards() {
    const cx = this.W / 2;
    const cardW = this.W - 60;
    const cardH = 70;
    const startY = 130;
    const gap = 12;

    this.prototypes.forEach((proto, i) => {
      const y = startY + i * (cardH + gap);

      // Card background
      const card = this.add.graphics();
      card.fillStyle(0xffffff, 0.04);
      card.fillRoundedRect(cx - cardW / 2, y, cardW, cardH, 12);
      card.lineStyle(1, 0xffffff, 0.06);
      card.strokeRoundedRect(cx - cardW / 2, y, cardW, cardH, 12);

      // Color accent line
      const accent = this.add.graphics();
      accent.fillStyle(proto.color, 0.8);
      accent.fillRoundedRect(cx - cardW / 2, y, 4, cardH, { tl: 12, bl: 12, tr: 0, br: 0 });

      // Label
      const label = this.add.text(cx - cardW / 2 + 20, y + 20, proto.label, {
        fontSize: '16px', fontFamily: '"Inter", sans-serif', color: '#ffffff', fontStyle: '600'
      });

      // Description
      const desc = this.add.text(cx - cardW / 2 + 20, y + 44, proto.desc, {
        fontSize: '9px', fontFamily: '"Inter", sans-serif', color: 'rgba(255,255,255,0.4)'
      });

      // Click zone
      const zone = this.add.zone(cx, y + cardH / 2, cardW, cardH)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.selectedIndex = i;
        this._updateSelection();
        this._selectCurrent();
      });
      zone.on('pointerover', () => {
        this.selectedIndex = i;
        this._updateSelection();
      });

      this.cardItems.push({ card, accent, label, desc, zone, y, cardH });
    });
  }

  _navigate(dir) {
    this.selectedIndex = (this.selectedIndex + dir + this.prototypes.length) % this.prototypes.length;
    this._updateSelection();
  }

  _updateSelection() {
    const cx = this.W / 2;
    const cardW = this.W - 60;

    this.cardItems.forEach((item, i) => {
      const selected = i === this.selectedIndex;
      const proto = this.prototypes[i];

      item.card.clear();
      if (selected) {
        item.card.fillStyle(proto.color, 0.08);
        item.card.fillRoundedRect(cx - cardW / 2, item.y, cardW, item.cardH, 12);
        item.card.lineStyle(1, proto.color, 0.3);
        item.card.strokeRoundedRect(cx - cardW / 2, item.y, cardW, item.cardH, 12);
      } else {
        item.card.fillStyle(0xffffff, 0.04);
        item.card.fillRoundedRect(cx - cardW / 2, item.y, cardW, item.cardH, 12);
        item.card.lineStyle(1, 0xffffff, 0.06);
        item.card.strokeRoundedRect(cx - cardW / 2, item.y, cardW, item.cardH, 12);
      }

      item.label.setColor(selected ? '#ffd700' : '#ffffff');
      item.label.setScale(selected ? 1.05 : 1);
    });

    // Position indicator
    const sel = this.cardItems[this.selectedIndex];
    this.indicator.setPosition(
      cx - (cardW / 2) + 10,
      sel.y + sel.cardH / 2
    );
    this.indicator.setVisible(true);
  }

  _selectCurrent() {
    const proto = this.prototypes[this.selectedIndex];
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(proto.key);
    });
  }

  _goBack() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  update(time, delta) {
    // Joystick navigation
    if (this.joystickCooldown > 0) {
      this.joystickCooldown -= delta;
    } else if (window.virtualInput) {
      if (window.virtualInput.joystickY < -0.5) {
        this._navigate(-1);
        this.joystickCooldown = 200;
      } else if (window.virtualInput.joystickY > 0.5) {
        this._navigate(1);
        this.joystickCooldown = 200;
      }

      if (window.virtualInput.buttonA && this.joystickCooldown <= 0) {
        this._selectCurrent();
        this.joystickCooldown = 300;
      }
    }
  }
}

window.PrototypeScene = PrototypeScene;
