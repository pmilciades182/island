import { WorldConfig } from '../world/WorldConfig.js';
import * as Objects from '../objects/index.js';

export class DebugPanel {
  constructor(scene) {
    this.scene = scene;
    this._debugFrameTimes = [];
    this._debugLogsEl = document.getElementById('debug-logs');
    this._debugSearchEl = document.getElementById('debug-search');
    this._debugContentEls = new Map();

    const logSections = [
      'PERFORMANCE', 'CAMERA', 'PLAYER', 'GPU INFO', 'RENDER', 'PROXIMITY', 'INDICATOR'
    ];

    if (this._debugLogsEl) {
      this._debugLogsEl.innerHTML = '';
      logSections.forEach(title => {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = title;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'log-content';
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'log-actions';
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(contentDiv.textContent);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 1000);
        };
        actionsDiv.appendChild(copyBtn);

        if (title === 'PROXIMITY') {
          const toggleBtn = document.createElement('button');
          toggleBtn.textContent = '⭕ Hide';
          toggleBtn.onclick = () => {
            const visible = this.scene.proximityManager.togglePerimeter();
            toggleBtn.textContent = visible ? '⭕ Hide' : '○ Show';
          };
          actionsDiv.appendChild(toggleBtn);
        }

        details.appendChild(summary);
        details.appendChild(contentDiv);
        details.appendChild(actionsDiv);
        this._debugLogsEl.appendChild(details);
        this._debugContentEls.set(title, contentDiv);
      });
    }

    if (this._debugSearchEl && this._debugLogsEl) {
      this._debugSearchEl.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        this._debugLogsEl.querySelectorAll('details').forEach(log => {
          const summaryText = log.querySelector('summary').textContent.toLowerCase();
          const contentText = log.querySelector('.log-content').textContent.toLowerCase();
          log.style.display = (summaryText.includes(searchTerm) || contentText.includes(searchTerm)) ? '' : 'none';
        });
      });
    }

    try {
      const gl = this.scene.sys.game.renderer.gl;
      if (gl) {
        const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
        const gpuVendor = debugExt ? gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL) : 'N/A';
        const gpuRenderer = debugExt ? gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) : 'N/A';
        this._debugGpuInfo = `GPU: ${gpuRenderer}\nVendor: ${gpuVendor}\nMaxTexSize: ${maxTex}`;
      } else {
        this._debugGpuInfo = 'Canvas2D (no GL)';
      }
    } catch (e) {
      this._debugGpuInfo = `Error: ${e.message}`;
    }
  }

  update(time, delta, moveState, lastPayload, closest, minDistanceSq) {
    if (!this._debugContentEls.size) return;

    this._debugFrameTimes.push(delta);
    if (this._debugFrameTimes.length > 60) this._debugFrameTimes.shift();
    const avgDelta = this._debugFrameTimes.reduce((a, b) => a + b, 0) / this._debugFrameTimes.length;
    const fps = Math.round(1000 / avgDelta);
    this._debugContentEls.get('PERFORMANCE').textContent = `FPS: ${fps} | Delta: ${delta.toFixed(2)}ms`;

    const cam = this.scene.cameras.main;
    this._debugContentEls.get('CAMERA').textContent = `Scroll: ${cam.scrollX.toFixed(2)}, ${cam.scrollY.toFixed(2)}`;

    const pc = this.scene.playerController.playerContainer;
    this._debugContentEls.get('PLAYER').textContent = `Pos: ${pc.x.toFixed(2)}, ${pc.y.toFixed(2)}`;

    this._debugContentEls.get('GPU INFO').textContent = this._debugGpuInfo;
    this._debugContentEls.get('RENDER').textContent = `Renderer: ${this.scene.sys.game.renderer.type === 2 ? 'WebGL' : 'Canvas'}`;

    if (lastPayload) {
      const nearbyVeg = lastPayload.vegetation || [];
      const nearbyTerrain = lastPayload.terrain || [];

      const vegCounts = {};
      nearbyVeg.forEach(v => { vegCounts[v.type] = (vegCounts[v.type] || 0) + 1; });

      let mostAbundant = { type: 'N/A', count: 0 };
      if (Object.keys(vegCounts).length > 0) {
        for (const type in vegCounts) {
          if (vegCounts[type] > mostAbundant.count) mostAbundant = { type, count: vegCounts[type] };
        }
      }

      const vegNames = Object.fromEntries(Object.entries(Objects.IDS).map(([k, v]) => [v, k]));
      const terrainNames = Object.fromEntries(Object.entries(WorldConfig.TERRAIN).map(([k, v]) => [v, k]));

      const closestName = closest ? (vegNames[closest.type] || terrainNames[closest.type] || 'Unknown') : 'None';

      let proximityText = `Radius: ${this.scene.proximityManager.radius}\n`;
      proximityText += `Nearby Veg: ${nearbyVeg.length}\n`;
      proximityText += `Nearby Terrain: ${nearbyTerrain.length}\n\n`;
      proximityText += `Closest: ${closestName} (${Math.sqrt(minDistanceSq).toFixed(1)}px)\n\n`;
      proximityText += `Most Abundant: ${vegNames[mostAbundant.type] || 'N/A'} (${mostAbundant.count}x)\n`;

      this._debugContentEls.get('PROXIMITY').textContent = proximityText;
    }

    const indInfo = this.scene.interactIndicator.getDebugInfo();
    let indText = `Visible: ${indInfo.visible} | Alpha: ${indInfo.alpha}\n`;
    indText += `Pos: ${indInfo.pos}\n`;
    indText += `Target: ${indInfo.target}\n`;
    indText += `Events: ${indInfo.events || 'None'}`;
    this._debugContentEls.get('INDICATOR').textContent = indText;
  }
}
