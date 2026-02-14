const config = {
  type: Phaser.CANVAS,
  width: 480,
  height: 480,
  backgroundColor: '#0d0d0d',
  pixelArt: false,
  roundPixels: false,
  antialias: false,
  antialiasGL: false,
  parent: 'gb-screen',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
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
  scene: [MenuScene]
};

window.addEventListener('load', () => {
  config.scene = [MenuScene, window.GameScene, window.ProtoBaseScene, window.ProtoMinimalScene, window.FireScene, window.GeometricScene, window.RiverScene];
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
