const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  backgroundColor: '#0d0d0d',
  pixelArt: true,
  roundPixels: true,
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
});
