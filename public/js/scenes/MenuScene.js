class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.W = this.cameras.main.width;
    this.H = this.cameras.main.height;
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.saveWidgets = [];
    this.modal = null;

    const pad = 20;
    this.contentW = this.W - pad * 2;
    this.padX = pad;

    // Fondo
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x080e1a, 0x080e1a, 0x0d0d0d, 0x0d0d0d, 1);
    bg.fillRect(0, 0, this.W, this.H);

    // Particulas
    for (let i = 0; i < 20; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(0, this.W), Phaser.Math.Between(0, this.H),
        Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.02, 0.08)
      );
      this.tweens.add({
        targets: dot, y: dot.y - Phaser.Math.Between(20, 60), alpha: 0,
        duration: Phaser.Math.Between(4000, 8000), repeat: -1, yoyo: true
      });
    }

    this.drawUI();
    this.loadSaves();
  }

  drawUI() {
    const cx = this.W / 2;

    // Logo icon
    this.add.text(cx, 22, '\u{1F3DD}', { fontSize: '28px' }).setOrigin(0.5);

    // Titulo
    this.add.text(cx, 52, 'ISLAND', {
      fontSize: '32px', fontFamily: 'Inter, sans-serif', color: '#ffffff', fontStyle: '700'
    }).setOrigin(0.5);
    this.add.text(cx, 80, 'S U R V I V A L', {
      fontSize: '11px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)', fontStyle: '400'
    }).setOrigin(0.5);

    // Separador
    const line = this.add.graphics();
    line.fillStyle(0xffffff, 0.05);
    line.fillRect(this.padX, 98, this.contentW, 1);

    // Boton New Game
    this.createMainButton(cx, 130, 180, 40, '\u{2795}  New Game', 0x2563eb, () => this.onNewGame());

    // Saved games header
    this.listLabel = this.add.text(this.padX, 166, '\u{1F4BE}  SAVED GAMES', {
      fontSize: '10px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)',
      fontStyle: '600'
    }).setOrigin(0, 0.5);

    this.listCountBadge = null;
    this.listY = 186;
  }

  // -- Main CTA button --
  createMainButton(x, y, w, h, label, color, callback) {
    const c = this.add.container(x, y);
    const r = h / 2;

    const shadow = this.add.graphics();
    shadow.fillStyle(color, 0.25);
    shadow.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, r);
    c.add(shadow);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    c.add(bg);

    const txt = this.add.text(0, 0, label, {
      fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#ffffff', fontStyle: '600'
    }).setOrigin(0.5);
    c.add(txt);

    const zone = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    c.add(zone);

    zone.on('pointerover', () => {
      this.tweens.add({ targets: c, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Back.easeOut' });
    });
    zone.on('pointerout', () => {
      this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 150, ease: 'Sine.easeOut' });
    });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: c, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true, ease: 'Sine.easeInOut' });
      callback();
    });
    return c;
  }

  // -- Icon button (circle) --
  createIconBtn(x, y, icon, bgColor, tooltip, callback) {
    const size = 28;
    const c = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 0.12);
    bg.fillCircle(0, 0, size / 2);
    c.add(bg);

    const ico = this.add.text(0, 0, icon, {
      fontSize: '12px'
    }).setOrigin(0.5);
    c.add(ico);

    const tip = this.add.text(0, -20, tooltip, {
      fontSize: '8px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.7)',
      fontStyle: '500', backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setAlpha(0);
    c.add(tip);

    const zone = this.add.zone(0, 0, size, size).setInteractive({ useHandCursor: true });
    c.add(zone);

    zone.on('pointerover', () => {
      this.tweens.add({ targets: c, scaleX: 1.15, scaleY: 1.15, duration: 120, ease: 'Back.easeOut' });
      this.tweens.add({ targets: tip, alpha: 1, duration: 150 });
      bg.clear(); bg.fillStyle(bgColor, 0.3); bg.fillCircle(0, 0, size / 2);
    });
    zone.on('pointerout', () => {
      this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: tip, alpha: 0, duration: 100 });
      bg.clear(); bg.fillStyle(bgColor, 0.12); bg.fillCircle(0, 0, size / 2);
    });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: c, scaleX: 0.85, scaleY: 0.85, duration: 60, yoyo: true });
      callback();
    });

    return c;
  }

  // -- Glass panel helper --
  drawGlass(gfx, x, y, w, h, r) {
    gfx.fillStyle(0xffffff, 0.035);
    gfx.fillRoundedRect(x, y, w, h, r);
    gfx.lineStyle(1, 0xffffff, 0.07);
    gfx.strokeRoundedRect(x, y, w, h, r);
  }

  clearSaveList() {
    this.saveWidgets.forEach(w => {
      w.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
    });
    this.saveWidgets = [];
    if (this.listCountBadge) { this.listCountBadge.destroy(); this.listCountBadge = null; }
  }

  async loadSaves() {
    const list = SaveManager.list();
    this.clearSaveList();
    const cx = this.W / 2;
    const cardW = this.contentW;
    const cardX = this.padX;

    if (list.length === 0) {
      const widgets = [];
      const emptyCard = this.add.graphics();
      this.drawGlass(emptyCard, cardX, this.listY, cardW, 70, 12);
      widgets.push(emptyCard);

      widgets.push(this.add.text(cx, this.listY + 24, '\u{1F30A}', { fontSize: '20px' }).setOrigin(0.5));
      widgets.push(this.add.text(cx, this.listY + 48, 'No saved games yet. Start a new adventure!', {
        fontSize: '10px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.35)', fontStyle: '400',
        wordWrap: { width: cardW - 40 }, align: 'center'
      }).setOrigin(0.5));
      this.saveWidgets.push(widgets);
      return;
    }

    // Badge count
    this.listCountBadge = this.add.text(this.listLabel.x + this.listLabel.width + 8, 166, `${list.length}`, {
      fontSize: '9px', fontFamily: 'Inter, sans-serif', color: '#ffffff', fontStyle: '600',
      backgroundColor: 'rgba(37,99,235,0.6)', padding: { x: 6, y: 2 }
    }).setOrigin(0, 0.5);

    list.forEach((save, i) => {
      const y = this.listY + i * 58;
      const cardH = 48;
      const widgets = [];

      // Card
      const card = this.add.graphics();
      this.drawGlass(card, cardX, y, cardW, cardH, 10);
      widgets.push(card);

      // Hover zone for card
      const cardZone = this.add.zone(cx, y + cardH / 2, cardW, cardH).setInteractive({ useHandCursor: true });
      cardZone.on('pointerover', () => {
        card.clear();
        card.fillStyle(0xffffff, 0.06);
        card.fillRoundedRect(cardX, y, cardW, cardH, 10);
        card.lineStyle(1, 0xffffff, 0.1);
        card.strokeRoundedRect(cardX, y, cardW, cardH, 10);
      });
      cardZone.on('pointerout', () => {
        card.clear();
        this.drawGlass(card, cardX, y, cardW, cardH, 10);
      });
      cardZone.on('pointerdown', () => this.onLoad(save.id));
      widgets.push(cardZone);

      // Play icon
      widgets.push(this.add.text(cardX + 14, y + cardH / 2, '\u{25B6}', {
        fontSize: '14px', color: 'rgba(52,211,153,0.8)'
      }).setOrigin(0, 0.5));

      // Nombre
      widgets.push(this.add.text(cardX + 36, y + 14, save.name, {
        fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#ffffff', fontStyle: '600'
      }).setOrigin(0, 0.5));

      // Fecha con icono reloj
      const timeAgo = this.getTimeAgo(save.updatedAt);
      widgets.push(this.add.text(cardX + 36, y + 32, `\u{1F551}  ${timeAgo}`, {
        fontSize: '9px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)', fontStyle: '400'
      }).setOrigin(0, 0.5));

      // Action buttons (derecha)
      const btnY = y + cardH / 2;
      const rightEdge = cardX + cardW - 14;
      widgets.push(this.createIconBtn(rightEdge, btnY, '\u{1F5D1}', 0xf87171, 'Delete', () => this.onDelete(save.id)));
      widgets.push(this.createIconBtn(rightEdge - 34, btnY, '\u{270F}', 0xfbbf24, 'Rename', () => this.onRename(save.id, save.name)));
      widgets.push(this.createIconBtn(rightEdge - 68, btnY, '\u{1F4CB}', 0x60a5fa, 'Clone', () => this.onClone(save.id)));

      this.saveWidgets.push(widgets);
    });
  }

  getTimeAgo(ts) {
    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return new Date(ts).toLocaleDateString();
  }

  // ══════════════════════════════════════
  //  MODAL SYSTEM
  // ══════════════════════════════════════

  showModal(config) {
    if (this.modal) this.destroyModal();

    const cx = this.W / 2;
    const cy = this.H / 2;
    const mW = Math.min(config.width || 320, this.W - 40);
    const mH = Math.min(config.height || 200, this.H - 40);
    const items = [];

    // Overlay
    const overlay = this.add.graphics().setDepth(200);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, this.W, this.H);
    const overlayZone = this.add.zone(cx, cy, this.W, this.H).setInteractive().setDepth(200);
    items.push(overlay, overlayZone);

    // Modal container
    const container = this.add.container(cx, cy).setDepth(201).setScale(0.9).setAlpha(0);
    items.push(container);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x161b26, 1);
    panel.fillRoundedRect(-mW / 2, -mH / 2, mW, mH, 16);
    panel.lineStyle(1, 0xffffff, 0.08);
    panel.strokeRoundedRect(-mW / 2, -mH / 2, mW, mH, 16);
    container.add(panel);

    // Icon
    if (config.icon) {
      container.add(this.add.text(0, -mH / 2 + 26, config.icon, { fontSize: '22px' }).setOrigin(0.5));
    }

    // Title
    container.add(this.add.text(0, -mH / 2 + 52, config.title, {
      fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#ffffff', fontStyle: '700'
    }).setOrigin(0.5));

    // Subtitle
    if (config.subtitle) {
      container.add(this.add.text(0, -mH / 2 + 72, config.subtitle, {
        fontSize: '10px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.4)', fontStyle: '400',
        wordWrap: { width: mW - 40 }, align: 'center'
      }).setOrigin(0.5));
    }

    // Input field (for rename)
    let inputValue = config.inputDefault || '';
    let inputText = null;
    let cursor = null;

    if (config.input) {
      const inputW = mW - 60;
      const inputBg = this.add.graphics();
      inputBg.fillStyle(0x000000, 0.4);
      inputBg.fillRoundedRect(-inputW / 2, -10, inputW, 32, 8);
      inputBg.lineStyle(1, 0x2563eb, 0.5);
      inputBg.strokeRoundedRect(-inputW / 2, -10, inputW, 32, 8);
      container.add(inputBg);

      inputText = this.add.text(-inputW / 2 + 10, 6, inputValue, {
        fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#ffffff', fontStyle: '500'
      }).setOrigin(0, 0.5);
      container.add(inputText);

      cursor = this.add.text(inputText.x + inputText.width + 1, 6, '|', {
        fontSize: '12px', fontFamily: 'Inter, sans-serif', color: 'rgba(37,99,235,0.8)'
      }).setOrigin(0, 0.5);
      container.add(cursor);
      this.tweens.add({ targets: cursor, alpha: 0, duration: 500, repeat: -1, yoyo: true });

      this.input.keyboard.on('keydown', (e) => {
        if (!this.modal) return;
        if (e.key === 'Backspace') {
          inputValue = inputValue.slice(0, -1);
        } else if (e.key === 'Enter') {
          if (config.onConfirm && inputValue.trim()) config.onConfirm(inputValue.trim());
          this.destroyModal();
          return;
        } else if (e.key === 'Escape') {
          this.destroyModal();
          return;
        } else if (e.key.length === 1 && inputValue.length < 20) {
          inputValue += e.key;
        }
        inputText.setText(inputValue);
        cursor.x = inputText.x + inputText.width + 1;
      });
    }

    // Buttons
    const btnY = mH / 2 - 36;
    const btnGap = 8;

    if (config.buttons) {
      const totalBtns = config.buttons.length;
      const btnW = totalBtns === 1 ? 140 : 110;
      const totalW = totalBtns * btnW + (totalBtns - 1) * btnGap;
      let startX = -totalW / 2 + btnW / 2;

      config.buttons.forEach((btn, i) => {
        const bx = startX + i * (btnW + btnGap);
        const bh = 34;
        const r = bh / 2;

        const btnBg = this.add.graphics();
        if (btn.primary) {
          btnBg.fillStyle(btn.color || 0x2563eb, 1);
        } else {
          btnBg.fillStyle(0xffffff, 0.06);
          btnBg.lineStyle(1, 0xffffff, 0.1);
        }
        btnBg.fillRoundedRect(-btnW / 2, -bh / 2, btnW, bh, r);
        if (!btn.primary) btnBg.strokeRoundedRect(-btnW / 2, -bh / 2, btnW, bh, r);

        const btnContainer = this.add.container(bx, btnY);
        btnContainer.add(btnBg);

        const textColor = btn.primary ? '#ffffff' : 'rgba(255,255,255,0.7)';
        const btnLabel = this.add.text(0, 0, btn.label, {
          fontSize: '11px', fontFamily: 'Inter, sans-serif', color: textColor, fontStyle: '600'
        }).setOrigin(0.5);
        btnContainer.add(btnLabel);

        const btnZone = this.add.zone(0, 0, btnW, bh).setInteractive({ useHandCursor: true });
        btnContainer.add(btnZone);

        btnZone.on('pointerover', () => {
          this.tweens.add({ targets: btnContainer, scaleX: 1.06, scaleY: 1.06, duration: 100, ease: 'Sine.easeOut' });
        });
        btnZone.on('pointerout', () => {
          this.tweens.add({ targets: btnContainer, scaleX: 1, scaleY: 1, duration: 100, ease: 'Sine.easeOut' });
        });
        btnZone.on('pointerdown', () => {
          this.tweens.add({ targets: btnContainer, scaleX: 0.92, scaleY: 0.92, duration: 60, yoyo: true });
          if (btn.action === 'confirm') {
            if (config.input) {
              if (config.onConfirm && inputValue.trim()) config.onConfirm(inputValue.trim());
            } else {
              if (config.onConfirm) config.onConfirm();
            }
          }
          this.destroyModal();
        });

        container.add(btnContainer);
      });
    }

    // Animate in
    this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, alpha: 1, duration: 250, ease: 'Back.easeOut' });

    this.modal = { items, container };
  }

  destroyModal() {
    if (!this.modal) return;
    this.input.keyboard.removeAllListeners('keydown');
    this.modal.items.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
    if (this.modal.container) this.modal.container.destroy();
    this.modal = null;
  }

  // ══════════════════════════════════════
  //  ACTIONS
  // ══════════════════════════════════════

  onNewGame() {
    const save = SaveManager.create();
    this.startGame(save.id);
  }

  onLoad(id) { this.startGame(id); }

  async onClone(id) {
    this.showModal({
      icon: '\u{1F4CB}',
      title: 'Clone Save',
      subtitle: 'Create an exact copy of this save game?',
      width: 300,
      height: 180,
      buttons: [
        { label: 'Cancel', primary: false, action: 'cancel' },
        { label: 'Clone', primary: true, color: 0x2563eb, action: 'confirm' }
      ],
      onConfirm: () => {
        SaveManager.clone(id);
        this.loadSaves();
      }
    });
  }

  onRename(id, currentName) {
    this.showModal({
      icon: '\u{270F}',
      title: 'Rename Save',
      subtitle: 'Enter a new name for this save:',
      input: true,
      inputDefault: currentName,
      width: 320,
      height: 210,
      buttons: [
        { label: 'Cancel', primary: false, action: 'cancel' },
        { label: 'Rename', primary: true, color: 0xd97706, action: 'confirm' }
      ],
      onConfirm: (newName) => {
        if (newName === currentName) return;
        SaveManager.rename(id, newName);
        this.loadSaves();
      }
    });
  }

  onDelete(id) {
    this.showModal({
      icon: '\u{26A0}',
      title: 'Delete Save',
      subtitle: 'This action cannot be undone. Are you sure?',
      width: 320,
      height: 190,
      buttons: [
        { label: 'Cancel', primary: false, action: 'cancel' },
        { label: 'Delete', primary: true, color: 0xdc2626, action: 'confirm' }
      ],
      onConfirm: () => {
        SaveManager.delete(id);
        this.loadSaves();
      }
    });
  }

  startGame(saveId) {
    if (this.modal) return;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { saveId });
    });
  }
}
