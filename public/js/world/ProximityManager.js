export class ProximityManager {
  constructor(scene, player, vegetationManager, islandGenerator, taskDistributor, config) {
    this.scene = scene;
    this.player = player;
    this.vegetationManager = vegetationManager;
    this.islandGenerator = islandGenerator;
    this.taskDistributor = taskDistributor;
    this.radius = config.radius || 100; // Default radius
    this.debugGraphics = scene.add.graphics().setDepth(1000);
  }

  update() {
    const playerX = this.player.x;
    const playerY = this.player.y;

    // Find nearby objects
    const nearbyVegetation = this.vegetationManager.getVegetationInRadius(playerX, playerY, this.radius);

    // Find nearby terrain info
    const nearbyTerrain = this.islandGenerator.getTerrainInRadius(playerX, playerY, this.radius);

    // Dispatch tasks
    if (nearbyVegetation.length > 0 || nearbyTerrain.length > 0) {
      this.taskDistributor.dispatch({
        type: 'PROXIMITY_UPDATE',
        payload: {
          vegetation: nearbyVegetation,
          terrain: nearbyTerrain,
        }
      });
    }

    // Draw debug circle
    this.drawDebugPerimeter();
  }

  drawDebugPerimeter() {
    this.debugGraphics.clear();
    this.debugGraphics.lineStyle(1, 0x00ff00, 0.5);
    this.debugGraphics.strokeCircle(this.player.x, this.player.y, this.radius);
    }
}
