class VirtualControls {
  constructor() {
    window.virtualInput = {
      joystickX: 0,
      joystickY: 0,
      joystickActive: false,
      buttonA: false,
      buttonB: false,
      buttonX: false,
      buttonY: false
    };

    this._joystickRadius = 0;
    this._joystickActive = false;
    this._joystickTouchId = null;
    this._centerX = 0;
    this._centerY = 0;

    this._setupJoystick();
    this._setupButtons();
  }

  _setupJoystick() {
    const area = document.getElementById('virtual-joystick');
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    if (!area || !base || !thumb) return;

    const getCenter = () => {
      const rect = base.getBoundingClientRect();
      this._centerX = rect.left + rect.width / 2;
      this._centerY = rect.top + rect.height / 2;
      this._joystickRadius = rect.width / 2;
    };

    const handleMove = (clientX, clientY) => {
      const dx = clientX - this._centerX;
      const dy = clientY - this._centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = this._joystickRadius;

      let clampedX = dx, clampedY = dy;
      if (dist > maxDist) {
        clampedX = (dx / dist) * maxDist;
        clampedY = (dy / dist) * maxDist;
      }

      window.virtualInput.joystickX = clampedX / maxDist;
      window.virtualInput.joystickY = clampedY / maxDist;
      window.virtualInput.joystickActive = true;

      thumb.style.transform = 'translate(' + clampedX + 'px, ' + clampedY + 'px)';
    };

    const handleEnd = () => {
      this._joystickActive = false;
      this._joystickTouchId = null;
      window.virtualInput.joystickX = 0;
      window.virtualInput.joystickY = 0;
      window.virtualInput.joystickActive = false;
      thumb.style.transform = 'translate(0, 0)';
    };

    // Touch events
    area.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this._joystickActive) return;
      this._joystickActive = true;
      this._joystickTouchId = e.changedTouches[0].identifier;
      getCenter();
      handleMove(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }, { passive: false });

    area.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this._joystickActive) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this._joystickTouchId) {
          handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: false });

    area.addEventListener('touchend', (e) => {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this._joystickTouchId) {
          handleEnd();
          break;
        }
      }
    }, { passive: false });

    area.addEventListener('touchcancel', () => { handleEnd(); }, { passive: false });

    // Mouse fallback for desktop testing
    var mouseActive = false;
    area.addEventListener('mousedown', (e) => {
      mouseActive = true;
      getCenter();
      handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (!mouseActive) return;
      handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (mouseActive) {
        mouseActive = false;
        handleEnd();
      }
    });
  }

  _setupButtons() {
    this._setupButton('btn-a', 'buttonA');
    this._setupButton('btn-b', 'buttonB');
    this._setupButton('btn-x', 'buttonX');
    this._setupButton('btn-y', 'buttonY');
  }

  _setupButton(elementId, inputKey) {
    var el = document.getElementById(elementId);
    if (!el) return;

    var touchId = null;

    el.addEventListener('touchstart', (e) => {
      // e.preventDefault(); // Removed to allow default touch behaviors
      touchId = e.changedTouches[0].identifier;
      window.virtualInput[inputKey] = true;
      if (navigator.vibrate) {
        navigator.vibrate(50); // Vibrate for 50ms
      }
    }, { passive: true }); // Changed to passive: true

    el.addEventListener('touchend', (e) => {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          window.virtualInput[inputKey] = false;
          touchId = null;
          break;
        }
      }
    }, { passive: true }); // Changed to passive: true

    el.addEventListener('touchcancel', () => {
      window.virtualInput[inputKey] = false;
      touchId = null;
    }, { passive: true }); // Changed to passive: true

    // Mouse fallback
    el.addEventListener('mousedown', () => { window.virtualInput[inputKey] = true; });
    el.addEventListener('mouseup', () => { window.virtualInput[inputKey] = false; });
    el.addEventListener('mouseleave', () => { window.virtualInput[inputKey] = false; });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.virtualControls = new VirtualControls();
});
