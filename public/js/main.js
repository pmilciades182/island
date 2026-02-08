const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  backgroundColor: '#0d0d0d',
  pixelArt: false,
  roundPixels: false,
  antialias: false,
  antialiasGL: false,
  parent: document.body,
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
});
