const config = {
  type: Phaser.CANVAS, // TEST: force Canvas2D to rule out WebGL/ANGLE issue
  width: 960,
  height: 640,
  backgroundColor: '#0d0d0d',
  pixelArt: false,
  roundPixels: false,
  antialias: false,
  antialiasGL: false,
  parent: document.body,
  input: {
    gamepad: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [MenuScene] // GameScene will be added dynamically or logic changed
};

// Wait for modules to load and define window.GameScene
window.addEventListener('load', () => {
  config.scene = [MenuScene, window.GameScene];
  const game = new Phaser.Game(config);

  // Set NEAREST filtering for all textures by default (same as pixelArt)
  // but without forcing roundPixels=true which causes jitter
  game.textures.on('addtexture', (key) => {
    const tex = game.textures.get(key);
    if (tex && key !== 'worldmap') {
      tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  });

  // Fix sub-pixel canvas positioning that causes terrain shimmer.
  // Flex centering can place the canvas at fractional pixels (e.g. 272.5).
  // The browser then interpolates the entire canvas output, and scrolling
  // content inside causes visible shimmer/shaking.
  const fixCanvasPosition = () => {
    const c = game.canvas;
    const r = c.getBoundingClientRect();
    const fracX = r.x - Math.round(r.x);
    const fracY = r.y - Math.round(r.y);
    if (fracX !== 0 || fracY !== 0) {
      c.style.transform = `translate(${-fracX}px, ${-fracY}px)`;
    } else {
      c.style.transform = '';
    }
  };
  requestAnimationFrame(fixCanvasPosition);
  window.addEventListener('resize', () => requestAnimationFrame(fixCanvasPosition));
});
