import { gameState, resetGameState } from '../state.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.add.text(centerX, centerY - 100, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(centerX, centerY, `Final Score: ${gameState.score}`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(centerX, centerY + 50, `Level Reached: ${gameState.level}`, { fontSize: '24px', fill: '#aaa' }).setOrigin(0.5);

        // Restart Button
        const restartBtn = this.add.rectangle(centerX, centerY + 150, 200, 60, 0xffffff)
            .setInteractive({ useHandCursor: true });
        this.add.text(centerX, centerY + 150, 'Restart', { fontSize: '24px', fill: '#000' }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => {
            resetGameState();
            this.scene.start('MainMenuScene');
        });

        restartBtn.on('pointerover', () => restartBtn.setFillStyle(0xcccccc));
        restartBtn.on('pointerout', () => restartBtn.setFillStyle(0xffffff));
    }
}
