import { gameState, resetGameState } from '../state.js';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Title
        this.add.text(centerX, centerY - 160, 'Survival Shooter', {
            fontSize: '48px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Info
        this.add.text(centerX, centerY - 80, `Level: ${gameState.level}   Money: $${gameState.money}`, {
            fontSize: '20px', fill: '#aaa'
        }).setOrigin(0.5);

        // New Game Button
        const newGameBtn = this.add.rectangle(centerX, centerY - 10, 260, 60, 0xaa6600)
            .setInteractive({ useHandCursor: true });
        this.add.text(centerX, centerY - 10, 'New Game', {
            fontSize: '28px', fill: '#fff'
        }).setOrigin(0.5);

        newGameBtn.on('pointerover', () => newGameBtn.setFillStyle(0xcc8800));
        newGameBtn.on('pointerout', () => newGameBtn.setFillStyle(0xaa6600));
        newGameBtn.on('pointerdown', () => {
            resetGameState();
            this.scene.start('GameScene');
        });

        // Continue Battle Button
        const battleBtn = this.add.rectangle(centerX, centerY + 70, 260, 60, 0x00aa00)
            .setInteractive({ useHandCursor: true });
        this.add.text(centerX, centerY + 70, 'Continue Battle', {
            fontSize: '28px', fill: '#fff'
        }).setOrigin(0.5);

        battleBtn.on('pointerover', () => battleBtn.setFillStyle(0x00cc00));
        battleBtn.on('pointerout', () => battleBtn.setFillStyle(0x00aa00));
        battleBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Upgrades Button
        const upgradeBtn = this.add.rectangle(centerX, centerY + 150, 260, 60, 0x0088ff)
            .setInteractive({ useHandCursor: true });
        this.add.text(centerX, centerY + 150, 'Upgrades', {
            fontSize: '28px', fill: '#fff'
        }).setOrigin(0.5);

        upgradeBtn.on('pointerover', () => upgradeBtn.setFillStyle(0x00aaff));
        upgradeBtn.on('pointerout', () => upgradeBtn.setFillStyle(0x0088ff));
        upgradeBtn.on('pointerdown', () => {
            this.scene.start('StoreScene');
        });
    }
}
