import { WorldConfig } from '../world/WorldConfig.js';

/**
 * InteractPopup - Shows object information when player interacts with E key
 */
export class InteractPopup {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.currentObject = null;

    this._createPopup();
  }

  _createPopup() {
    // Create DOM element for popup
    this.popupEl = document.createElement('div');
    this.popupEl.className = 'interact-popup';
    this.popupEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: rgba(15, 15, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 24px;
      min-width: 280px;
      max-width: 360px;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    `;

    // Header with object type
    this.headerEl = document.createElement('div');
    this.headerEl.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #F1C40F;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    this.popupEl.appendChild(this.headerEl);

    // Info container
    this.infoEl = document.createElement('div');
    this.infoEl.style.cssText = `
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.6;
      margin-bottom: 20px;
    `;
    this.popupEl.appendChild(this.infoEl);

    // Close button
    this.closeBtn = document.createElement('button');
    this.closeBtn.innerHTML = 'Close <span style="opacity: 0.5; margin-left: 8px;">[E]</span>';
    this.closeBtn.style.cssText = `
      width: 100%;
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s ease;
    `;
    this.closeBtn.onmouseenter = () => {
      this.closeBtn.style.background = 'rgba(255, 255, 255, 0.15)';
    };
    this.closeBtn.onmouseleave = () => {
      this.closeBtn.style.background = 'rgba(255, 255, 255, 0.08)';
    };
    this.closeBtn.onclick = () => this.close();
    this.popupEl.appendChild(this.closeBtn);

    document.body.appendChild(this.popupEl);
  }

  _getObjectName(type) {
    const names = {
      [WorldConfig.OBJECTS.TREE]: 'Tree',
      [WorldConfig.OBJECTS.ROCK_SMALL]: 'Small Rock',
      [WorldConfig.OBJECTS.ROCK_MEDIUM]: 'Medium Rock',
      [WorldConfig.OBJECTS.ROCK_LARGE]: 'Large Rock',
      [WorldConfig.OBJECTS.FLOWER]: 'Flower',
      [WorldConfig.OBJECTS.BUSH_SAND]: 'Sand Bush',
      [WorldConfig.OBJECTS.BUSH_GRASS]: 'Grass Bush',
      [WorldConfig.OBJECTS.BUSH_DIRT]: 'Dirt Bush',
    };
    return names[type] || 'Unknown Object';
  }

  _getObjectIcon(type) {
    const icons = {
      [WorldConfig.OBJECTS.TREE]: '🌳',
      [WorldConfig.OBJECTS.ROCK_SMALL]: '🪨',
      [WorldConfig.OBJECTS.ROCK_MEDIUM]: '🪨',
      [WorldConfig.OBJECTS.ROCK_LARGE]: '🪨',
      [WorldConfig.OBJECTS.FLOWER]: '🌸',
      [WorldConfig.OBJECTS.BUSH_SAND]: '🌿',
      [WorldConfig.OBJECTS.BUSH_GRASS]: '🌿',
      [WorldConfig.OBJECTS.BUSH_DIRT]: '🌿',
    };
    return icons[type] || '❓';
  }

  _getObjectDescription(type) {
    const descriptions = {
      [WorldConfig.OBJECTS.TREE]: 'A tall tree. Can be chopped for wood.',
      [WorldConfig.OBJECTS.ROCK_SMALL]: 'A small rock. Can be picked up.',
      [WorldConfig.OBJECTS.ROCK_MEDIUM]: 'A medium-sized rock. Can be mined for stone.',
      [WorldConfig.OBJECTS.ROCK_LARGE]: 'A large rock formation. Requires a pickaxe.',
      [WorldConfig.OBJECTS.FLOWER]: 'A colorful flower. Can be gathered.',
      [WorldConfig.OBJECTS.BUSH_SAND]: 'A hardy bush growing in sandy soil.',
      [WorldConfig.OBJECTS.BUSH_GRASS]: 'A leafy bush found in grassy areas.',
      [WorldConfig.OBJECTS.BUSH_DIRT]: 'A sturdy bush growing in rich soil.',
    };
    return descriptions[type] || 'An unknown object.';
  }

  /**
   * Open popup with object information
   * @param {Object} obj - The object to display info for
   */
  open(obj) {
    if (!obj) return;

    this.isOpen = true;
    this.currentObject = obj;

    const name = this._getObjectName(obj.type);
    const icon = this._getObjectIcon(obj.type);
    const desc = this._getObjectDescription(obj.type);

    this.headerEl.innerHTML = `<span>${icon}</span> ${name}`;

    this.infoEl.innerHTML = `
      <div style="margin-bottom: 12px;">${desc}</div>
      <div style="padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Position</span>
          <span style="color: #fff;">${Math.round(obj.x)}, ${Math.round(obj.y)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Type ID</span>
          <span style="color: #fff;">${obj.type}</span>
        </div>
      </div>
    `;

    // Show with animation
    this.popupEl.style.visibility = 'visible';
    this.popupEl.style.opacity = '1';
    this.popupEl.style.transform = 'translate(-50%, -50%) scale(1)';
  }

  /**
   * Close the popup
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.currentObject = null;

    this.popupEl.style.opacity = '0';
    this.popupEl.style.transform = 'translate(-50%, -50%) scale(0.9)';

    // Hide after animation
    setTimeout(() => {
      if (!this.isOpen) {
        this.popupEl.style.visibility = 'hidden';
      }
    }, 200);
  }

  /**
   * Toggle popup state
   * @param {Object} obj - Object to show when opening
   * @returns {boolean} - True if popup is now open
   */
  toggle(obj) {
    if (this.isOpen) {
      this.close();
      return false;
    } else {
      this.open(obj);
      return true;
    }
  }

  destroy() {
    if (this.popupEl && this.popupEl.parentNode) {
      this.popupEl.parentNode.removeChild(this.popupEl);
    }
  }
}
