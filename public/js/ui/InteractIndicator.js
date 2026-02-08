/**
 * InteractIndicator - Firefly-like indicator for interactive objects
 * Shows a pulsing yellow light above the closest interactable object
 */
export class InteractIndicator {
  constructor(scene) {
    this.scene = scene;
    this._currentInteractiveObject = null;
    this._eventLog = []; // Last 3 events
    this._maxEvents = 3;

    this._createIndicator();
    this._createPulseTween();
  }

  _logEvent(eventType, data) {
    const event = { eventType, data, time: Date.now() };
    this._eventLog.push(event);
    if (this._eventLog.length > this._maxEvents) {
      this._eventLog.shift();
    }
  }

  getDebugInfo() {
    const current = this._currentInteractiveObject;
    return {
      visible: this.container.visible,
      alpha: this.container.alpha.toFixed(2),
      pos: `${this.container.x.toFixed(0)}, ${this.container.y.toFixed(0)}`,
      target: current ? `Type:${current.type} @${current.x.toFixed(0)},${current.y.toFixed(0)}` : 'None',
      events: this._eventLog.map(e => e.eventType).join(' → ')
    };
  }

  _createIndicator() {
    const indicatorColor = 0xF1C40F; // Sunny Yellow

    this.container = this.scene.add.container(0, 0)
      .setDepth(400000)
      .setVisible(false)
      .setAlpha(0);

    // Outer soft glow (largest)
    const outerGlow = this.scene.add.graphics();
    outerGlow.fillStyle(indicatorColor, 0.15);
    outerGlow.fillCircle(0, 0, 24);

    // Middle glow
    const midGlow = this.scene.add.graphics();
    midGlow.fillStyle(indicatorColor, 0.3);
    midGlow.fillCircle(0, 0, 16);

    // Inner glow
    const innerGlow = this.scene.add.graphics();
    innerGlow.fillStyle(indicatorColor, 0.5);
    innerGlow.fillCircle(0, 0, 10);

    // Bright core
    const core = this.scene.add.graphics();
    core.fillStyle(0xFFFFFF, 0.9);
    core.fillCircle(0, 0, 5);

    this.container.add([outerGlow, midGlow, innerGlow, core]);
  }

  _createPulseTween() {
    this.scene.tweens.add({
      targets: this.container,
      scale: 1.2,
      duration: 800,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Update indicator position based on closest interactable object
   * @param {Object|null} closestInteractable - The closest object or null
   */
  update(closestInteractable) {
    if (closestInteractable) {
      this._showIndicator(closestInteractable);
    } else {
      this._hideIndicator();
    }
  }

  _showIndicator(target) {
    const targetX = target.x;
    const targetY = target.y - 48; // Offset above object

    const isNewTarget = !this._currentInteractiveObject ||
      this._currentInteractiveObject.gridIndex !== target.gridIndex;

    if (isNewTarget) {
      this._logEvent('SHOW', { type: target.type, x: target.x, y: target.y });
      this._currentInteractiveObject = target; // Set immediately
      this.scene.tweens.killTweensOf(this.container, null, ['alpha', 'x', 'y']);

      this.container.setVisible(true);
      this.container.setPosition(targetX, targetY);
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 200,
        ease: 'Power1'
      });
    } else {
      // Same target - update position
      this.container.setPosition(targetX, targetY);
      if (this.container.alpha < 1) {
        this.scene.tweens.killTweensOf(this.container, null, ['alpha']);
        this.container.setAlpha(1);
      }
    }
  }

  _hideIndicator() {
    // Si ya está oculto, no hacer nada
    if (!this.container.visible) return;

    this._logEvent('HIDE', {});
    this._currentInteractiveObject = null; // Clear immediately
    this.scene.tweens.killTweensOf(this.container, null, ['alpha']);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      ease: 'Power1',
      onComplete: () => {
        this.container.setVisible(false);
      }
    });
  }

  /**
   * Get current tracked object (for debugging)
   */
  get currentObject() {
    return this._currentInteractiveObject;
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.container);
    this.container.destroy();
  }
}
