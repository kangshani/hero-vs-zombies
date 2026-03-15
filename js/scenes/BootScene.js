export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.image('hero', 'hero.png');
        this.load.svg('motorcycle', 'motorcycle.svg', { width: 64, height: 64 });
        this.load.svg('zombie', 'zombie.svg', { width: 64, height: 64 });
        this.load.svg('pig', 'pig.svg', { width: 64, height: 64 });
        this.load.svg('female', 'female.svg', { width: 64, height: 64 });
        this.load.svg('boss', 'boss.svg', { width: 128, height: 128 });
        this.load.svg('road', 'road.svg', { width: 300, height: 300 });
    }

    create() {
        this.scene.start('MainMenuScene');
    }
}
