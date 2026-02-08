export class HUD {
  constructor(scene, saveData, callbacks) {
    this.scene = scene;
    this.callbacks = callbacks; // { onExit, onToggleCycle }
    this.sidebarWidth = 300;
    this.uiVisible = false;
    this.isToggling = false;

    this._createHUD(saveData);
  }

  _createHUD(saveData) {
    const scene = this.scene;
    const H = scene.cameras.main.height;
    const W = scene.cameras.main.width;

    // Sidebar Container — starts off-screen (closed)
    this.hudContainer = scene.add.container(-this.sidebarWidth, 0).setScrollFactor(0).setDepth(500000);

    // Background
    this.hudPanel = scene.add.graphics();
    this.hudPanel.fillStyle(0x18181b, 1);
    this.hudPanel.fillRect(0, 0, this.sidebarWidth, H);
    this.hudPanel.lineStyle(1, 0x3f3f46, 1);
    this.hudPanel.lineBetween(this.sidebarWidth, 0, this.sidebarWidth, H);
    this.hudContainer.add(this.hudPanel);

    // Toggle Button (Close Sidebar)
    const closeBtn = scene.add.container(this.sidebarWidth - 40, 20);
    this.hudContainer.add(closeBtn);

    const cBg = scene.add.graphics();
    cBg.fillStyle(0x27272a, 1);
    cBg.fillRoundedRect(0, 0, 32, 32, 6);
    closeBtn.add(cBg);

    const cTxt = scene.add.text(16, 16, '<', {
      fontFamily: '"JetBrains Mono", monospace', fontSize: '18px', color: '#fff', fontStyle: '700'
    }).setOrigin(0.5);
    closeBtn.add(cTxt);

    const cZone = scene.add.zone(16, 16, 32, 32).setInteractive({ useHandCursor: true });
    cZone.on('pointerdown', () => this.toggle());
    closeBtn.add(cZone);

    // Header Info - Player Name
    this.hudName = scene.add.text(32, 60, saveData.name.toUpperCase(), {
      fontSize: '20px',
      fontFamily: '"Rubik", sans-serif',
      color: '#ffffff',
      fontStyle: '700'
    });
    this.hudContainer.add(this.hudName);

    // Time (Digital Clock style)
    this.timeText = scene.add.text(this.sidebarWidth - 32, 64, '12:00', {
      fontSize: '16px',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#10b981',
      fontStyle: '500'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.timeText);

    // Pause Cycle Button
    const pauseBtn = scene.add.text(this.sidebarWidth - 90, 64, '\u23F8', {
      fontSize: '16px', color: '#a1a1aa'
    }).setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => {
      if (this.callbacks.onToggleCycle) {
        const paused = this.callbacks.onToggleCycle();
        pauseBtn.setColor(paused ? '#fcd34d' : '#a1a1aa');
        pauseBtn.setText(paused ? '\u25B6' : '\u23F8');
      }
    });
    this.hudContainer.add(pauseBtn);

    // Divider
    const div1 = scene.add.graphics();
    div1.lineStyle(1, 0x3f3f46, 1);
    div1.lineBetween(32, 96, this.sidebarWidth - 32, 96);
    this.hudContainer.add(div1);

    // Stats Section
    let y = 120;

    // HP Bar label
    this.hudContainer.add(scene.add.text(32, y, 'VITALS', {
      fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', color: '#9ca3af', fontStyle: '700'
    }));
    y += 20;

    // Health
    this.healthBarBg = scene.add.graphics();
    this.healthBar = scene.add.graphics();
    this.hudContainer.add(this.healthBarBg);
    this.hudContainer.add(this.healthBar);

    this.healthText = scene.add.text(this.sidebarWidth - 32, y - 2, '', {
      fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', color: '#f87171'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.healthText);

    y += 36;

    // Stamina
    this.staminaBarBg = scene.add.graphics();
    this.staminaBar = scene.add.graphics();
    this.hudContainer.add(this.staminaBarBg);
    this.hudContainer.add(this.staminaBar);

    this.staminaText = scene.add.text(this.sidebarWidth - 32, y - 2, '', {
      fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', color: '#60a5fa'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.staminaText);

    y += 48;

    // Attributes Panel
    const attrBg = scene.add.graphics();
    attrBg.fillStyle(0x27272a, 1);
    attrBg.fillRoundedRect(32, y, this.sidebarWidth - 64, 90, 8);
    this.hudContainer.add(attrBg);

    this.attrText = scene.add.text(44, y + 12, '', {
      fontSize: '12px',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#d4d4d8',
      lineSpacing: 8
    });
    this.hudContainer.add(this.attrText);

    y += 110;

    // Inventory Section
    this.hudContainer.add(scene.add.text(32, y, 'INVENTORY', {
      fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', color: '#9ca3af', fontStyle: '700'
    }));
    y += 24;

    this.invText = scene.add.text(32, y, '', {
      fontSize: '13px',
      fontFamily: '"Rubik", sans-serif',
      color: '#f4f4f5',
      lineSpacing: 6,
      wordWrap: { width: this.sidebarWidth - 64 }
    });
    this.hudContainer.add(this.invText);

    // Exit Button
    this._createExitButton(32, H - 80);

    // Floating Toggle Button (Visible when Sidebar hidden) — starts visible
    this.toggleBtnContainer = scene.add.container(20, 20).setScrollFactor(0).setDepth(500000).setVisible(true);

    const tBg = scene.add.graphics();
    tBg.fillStyle(0x18181b, 0.85);
    tBg.lineStyle(1, 0x3f3f46, 1);
    tBg.fillRoundedRect(0, 0, 56, 36, 8);
    tBg.strokeRoundedRect(0, 0, 56, 36, 8);
    this.toggleBtnContainer.add(tBg);

    const tLabel = scene.add.text(28, 11, 'MENU', {
      fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: '700'
    }).setOrigin(0.5);
    this.toggleBtnContainer.add(tLabel);

    const tKey = scene.add.text(28, 26, '[M]', {
      fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', color: '#71717a'
    }).setOrigin(0.5);
    this.toggleBtnContainer.add(tKey);

    const tZone = scene.add.zone(28, 18, 56, 36).setInteractive({ useHandCursor: true });
    tZone.on('pointerdown', () => this.toggle());
    this.toggleBtnContainer.add(tZone);

    // ── Floating HP / Stamina bars (always visible) ──
    this._createFloatingBars(scene);
  }

  _createFloatingBars(scene) {
    const W = scene.cameras.main.width;
    const H = scene.cameras.main.height;

    this.floatingBarsContainer = scene.add.container(0, 0).setScrollFactor(0).setDepth(500001);

    // ── Diablo-style bottom panel ──
    const panelW = 320;
    const panelH = 58;
    const panelX = (W - panelW) / 2;
    const panelY = H - panelH - 6;
    const orbR = 24; // orb radius

    // Dark panel background
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(0x0e0e10, 0.85);
    panelBg.lineStyle(1, 0x3f3f46, 0.6);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.floatingBarsContainer.add(panelBg);

    // Orb positions
    const hpOrbX = panelX + 38;
    const stOrbX = panelX + panelW - 38;
    const orbCY = panelY + panelH / 2;

    // ── HP Orb (left) ──
    this._hpOrbBg = scene.add.graphics();
    this._hpOrbFill = scene.add.graphics();
    this._hpOrbRing = scene.add.graphics();
    this.floatingBarsContainer.add(this._hpOrbBg);

    // Geometry mask for HP orb fill
    const hpMaskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    hpMaskShape.fillCircle(hpOrbX, orbCY, orbR - 2);
    this._hpOrbFill.setMask(hpMaskShape.createGeometryMask());
    this.floatingBarsContainer.add(this._hpOrbFill);
    this.floatingBarsContainer.add(this._hpOrbRing);

    this._hpText = scene.add.text(hpOrbX, orbCY, '', {
      fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#ffffff', fontStyle: '700'
    }).setOrigin(0.5);
    this.floatingBarsContainer.add(this._hpText);

    const hpLabel = scene.add.text(hpOrbX, panelY - 6, 'HP', {
      fontFamily: '"JetBrains Mono", monospace', fontSize: '8px', color: '#f87171', fontStyle: '700'
    }).setOrigin(0.5);
    this.floatingBarsContainer.add(hpLabel);

    // ── Stamina Orb (right) ──
    this._stOrbBg = scene.add.graphics();
    this._stOrbFill = scene.add.graphics();
    this._stOrbRing = scene.add.graphics();
    this.floatingBarsContainer.add(this._stOrbBg);

    // Geometry mask for stamina orb fill
    const stMaskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    stMaskShape.fillCircle(stOrbX, orbCY, orbR - 2);
    this._stOrbFill.setMask(stMaskShape.createGeometryMask());
    this.floatingBarsContainer.add(this._stOrbFill);
    this.floatingBarsContainer.add(this._stOrbRing);

    this._stText = scene.add.text(stOrbX, orbCY, '', {
      fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#ffffff', fontStyle: '700'
    }).setOrigin(0.5);
    this.floatingBarsContainer.add(this._stText);

    const stLabel = scene.add.text(stOrbX, panelY - 6, 'ST', {
      fontFamily: '"JetBrains Mono", monospace', fontSize: '8px', color: '#60a5fa', fontStyle: '700'
    }).setOrigin(0.5);
    this.floatingBarsContainer.add(stLabel);

    // ── Center decoration ──
    const centerX = W / 2;
    const divL = scene.add.graphics();
    divL.lineStyle(1, 0x3f3f46, 0.4);
    divL.lineBetween(hpOrbX + orbR + 10, orbCY, centerX - 8, orbCY);
    this.floatingBarsContainer.add(divL);

    const divR = scene.add.graphics();
    divR.lineStyle(1, 0x3f3f46, 0.4);
    divR.lineBetween(centerX + 8, orbCY, stOrbX - orbR - 10, orbCY);
    this.floatingBarsContainer.add(divR);

    // Cooldown text (hidden by default)
    this._cooldownText = scene.add.text(centerX, orbCY, '', {
      fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', color: '#fbbf24', fontStyle: '700'
    }).setOrigin(0.5).setAlpha(0);
    this.floatingBarsContainer.add(this._cooldownText);

    // Store layout
    this._floatBarLayout = { hpOrbX, stOrbX, orbCY, orbR };
  }

  _createExitButton(x, y) {
    const scene = this.scene;
    const btnW = this.sidebarWidth - 64;
    const btnH = 40;

    const container = scene.add.container(x, y);
    this.hudContainer.add(container);

    const bg = scene.add.graphics();
    bg.fillStyle(0x7f1d1d, 1);
    bg.fillRoundedRect(0, 0, btnW, btnH, 6);
    bg.lineStyle(1, 0xef4444, 0.5);
    bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
    container.add(bg);

    const txt = scene.add.text(btnW / 2, btnH / 2, 'EXIT WORLD [ESC]', {
      fontSize: '13px', fontFamily: '"Rubik", sans-serif', color: '#fecaca', fontStyle: '600', letterSpacing: 1
    }).setOrigin(0.5);
    container.add(txt);

    const zone = scene.add.zone(btnW / 2, btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
    container.add(zone);

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x991b1b, 1);
      bg.fillRoundedRect(0, 0, btnW, btnH, 6);
      bg.lineStyle(1, 0xffffff, 0.8);
      bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
      txt.setColor('#ffffff');
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x7f1d1d, 1);
      bg.fillRoundedRect(0, 0, btnW, btnH, 6);
      bg.lineStyle(1, 0xef4444, 0.5);
      bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
      txt.setColor('#fecaca');
    });

    zone.on('pointerdown', () => {
      if (this.callbacks.onExit) this.callbacks.onExit();
    });
  }

  toggle() {
    if (this.isToggling) return;
    this.isToggling = true;
    this.uiVisible = !this.uiVisible;

    const targetX = this.uiVisible ? 0 : -this.sidebarWidth;

    if (this.uiVisible) {
      this.toggleBtnContainer.setVisible(false);
      this.hudContainer.setVisible(true);
    }

    this.scene.tweens.add({
      targets: this.hudContainer,
      x: targetX,
      duration: 300,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.isToggling = false;
        if (!this.uiVisible) {
          this.toggleBtnContainer.setVisible(true);
        }
      }
    });
  }

  setTimeText(timeStr) {
    if (this.timeText) this.timeText.setText(timeStr);
  }

  update(playerState) {
    const { health, maxHealth, stamina, maxStamina, attributes, inventory } = playerState;
    const startX = 32;
    const barW = this.sidebarWidth - 64;
    const barH = 8;

    // HP - Y=140
    let hpY = 140;

    this.healthText.setOrigin(1, 1);
    this.healthText.setPosition(startX + barW, hpY - 4);
    this.healthText.setText(`${Math.round(health)}/${maxHealth}`);

    const hpRatio = Math.max(0, health / maxHealth);

    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x3f3f46, 1);
    this.healthBarBg.fillRoundedRect(startX, hpY, barW, barH, 4);

    this.healthBar.clear();
    if (hpRatio > 0) {
      this.healthBar.fillStyle(0xf87171, 1);
      this.healthBar.fillRoundedRect(startX, hpY, Math.max(barW * hpRatio, barH), barH, 4);
    }

    // Stamina
    const stY = hpY + 36;

    this.staminaText.setOrigin(1, 1);
    this.staminaText.setPosition(startX + barW, stY - 4);
    this.staminaText.setText(`${Math.round(stamina)}/${maxStamina}`);

    const stRatio = Math.max(0, stamina / maxStamina);

    this.staminaBarBg.clear();
    this.staminaBarBg.fillStyle(0x3f3f46, 1);
    this.staminaBarBg.fillRoundedRect(startX, stY, barW, barH, 4);

    this.staminaBar.clear();
    if (stRatio > 0) {
      this.staminaBar.fillStyle(0x60a5fa, 1);
      this.staminaBar.fillRoundedRect(startX, stY, Math.max(barW * stRatio, barH), barH, 4);
    }

    const a = attributes;
    this.attrText.setText(`STR  ${a.strength}  INT  ${a.intelligence}\nAGI  ${a.agility}  END  ${a.endurance}`);

    if (inventory.length === 0) {
      this.invText.setText('// EMPTY');
    } else {
      this.invText.setText(inventory.map(it => `[${it.quantity}] ${it.name}`).join('\n'));
    }

    // ── Floating orbs (always visible) ──
    const fl = this._floatBarLayout;
    if (!fl) return;

    const { hpOrbX, stOrbX, orbCY, orbR } = fl;
    const staminaCooldown = playerState.staminaCooldown || false;

    // HP orb
    const hpRatioOrb = Math.max(0, health / maxHealth);
    this._hpOrbBg.clear();
    this._hpOrbBg.fillStyle(0x1a0505, 1);
    this._hpOrbBg.fillCircle(hpOrbX, orbCY, orbR - 2);

    this._hpOrbFill.clear();
    if (hpRatioOrb > 0) {
      const fillH = (orbR * 2) * hpRatioOrb;
      const fillY = orbCY + orbR - fillH;
      this._hpOrbFill.fillStyle(0xdc2626, 0.85);
      this._hpOrbFill.fillRect(hpOrbX - orbR, fillY, orbR * 2, fillH);
      // Highlight on top of liquid
      this._hpOrbFill.fillStyle(0xf87171, 0.3);
      this._hpOrbFill.fillRect(hpOrbX - orbR, fillY, orbR * 2, 3);
    }

    this._hpOrbRing.clear();
    this._hpOrbRing.lineStyle(2, 0x7f1d1d, 1);
    this._hpOrbRing.strokeCircle(hpOrbX, orbCY, orbR);
    // Inner shine
    this._hpOrbRing.lineStyle(1, 0xfca5a5, 0.15);
    this._hpOrbRing.strokeCircle(hpOrbX, orbCY, orbR - 3);

    this._hpText.setText(`${Math.round(health)}`);

    // Stamina orb
    const stRatioOrb = Math.max(0, stamina / maxStamina);
    const stCooldown = staminaCooldown;

    this._stOrbBg.clear();
    this._stOrbBg.fillStyle(stCooldown ? 0x1a1005 : 0x050e1a, 1);
    this._stOrbBg.fillCircle(stOrbX, orbCY, orbR - 2);

    this._stOrbFill.clear();
    if (stRatioOrb > 0) {
      const fillH = (orbR * 2) * stRatioOrb;
      const fillY = orbCY + orbR - fillH;
      const fillColor = stCooldown ? 0xb45309 : 0x2563eb;
      this._stOrbFill.fillStyle(fillColor, 0.85);
      this._stOrbFill.fillRect(stOrbX - orbR, fillY, orbR * 2, fillH);
      const hlColor = stCooldown ? 0xfbbf24 : 0x60a5fa;
      this._stOrbFill.fillStyle(hlColor, 0.3);
      this._stOrbFill.fillRect(stOrbX - orbR, fillY, orbR * 2, 3);
    }

    this._stOrbRing.clear();
    const ringColor = stCooldown ? 0x78350f : 0x1e3a5f;
    this._stOrbRing.lineStyle(2, ringColor, 1);
    this._stOrbRing.strokeCircle(stOrbX, orbCY, orbR);
    const shineColor = stCooldown ? 0xfbbf24 : 0x93c5fd;
    this._stOrbRing.lineStyle(1, shineColor, 0.15);
    this._stOrbRing.strokeCircle(stOrbX, orbCY, orbR - 3);

    this._stText.setText(`${Math.round(stamina)}`);
    this._stText.setColor(stCooldown ? '#fbbf24' : '#ffffff');

    // Cooldown indicator
    if (stCooldown) {
      this._cooldownText.setText('COOLDOWN');
      this._cooldownText.setAlpha(0.6 + Math.sin(this.scene.time.now / 200) * 0.4);
    } else {
      this._cooldownText.setAlpha(0);
    }
  }
}
