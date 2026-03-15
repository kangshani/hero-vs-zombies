import { gameState } from '../state.js';

export default class StoreScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoreScene' });
    }

    create() {
        const centerX = this.cameras.main.centerX;

        this.add.text(centerX, 50, 'Upgrades', { fontSize: '32px', fill: '#0f0', fontStyle: 'bold' }).setOrigin(0.5);
        this.moneyText = this.add.text(centerX, 100, `Money Available: $${gameState.money}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        // Upgrades
        let y = 160;

        this.createUpgradeRow(centerX, y, 'Fire Rate', 'fireInterval', 100, (val) => Math.max(50, val - 30));
        y += 80;
        this.createUpgradeRow(centerX, y, 'Movement Speed', 'moveSpeed', 100, (val) => val + 20);
        y += 80;
        this.createUpgradeRow(centerX, y, 'Bullet Speed', 'bulletSpeed', 80, (val) => val + 50);
        y += 80;
        this.createUpgradeRow(centerX, y, 'Spread Gun', 'bulletCount', 150, (val) => Math.min(5, val + 1));
        y += 80;

        // Motorcycle upgrade
        this.createMotorcycleUpgrade(centerX, y);

        // Back to Main Menu Button
        const backBtn = this.add.rectangle(centerX, 580, 260, 60, 0x666666)
            .setInteractive({ useHandCursor: true });
        this.add.text(centerX, 580, 'Back to Main Menu', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });

        backBtn.on('pointerover', () => backBtn.setFillStyle(0x888888));
        backBtn.on('pointerout', () => backBtn.setFillStyle(0x666666));
    }

    createUpgradeRow(x, y, label, statKey, cost, modifierFn, maxValue = null) {
        let currentVal = gameState[statKey];

        const labelText = this.add.text(x - 200, y, `${label}: ${currentVal}`, { fontSize: '20px', fill: '#aaa' }).setOrigin(0, 0.5);

        const btn = this.add.rectangle(x + 150, y, 140, 40, 0x444444).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(x + 150, y, `Buy ($${cost})`, { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);

        const updateBtn = () => {
            const isMaxed = maxValue !== null && gameState[statKey] >= maxValue;

            if (isMaxed) {
                btn.setFillStyle(0x555555);
                btnText.setText('MAXED');
                btnText.setColor('#ffff00');
                btn.disableInteractive();
            } else if (gameState.money >= cost) {
                btn.setFillStyle(0x0088ff);
                btnText.setText(`Buy ($${cost})`);
                btnText.setColor('#ffffff');
                btn.setInteractive({ useHandCursor: true });
            } else {
                btn.setFillStyle(0x333333);
                btnText.setColor('#888888');
                btn.setInteractive({ useHandCursor: true });
            }
            labelText.setText(`${label}: ${gameState[statKey]}`);
        };

        btn.on('pointerdown', () => {
            const isMaxed = maxValue !== null && gameState[statKey] >= maxValue;

            if (!isMaxed && gameState.money >= cost) {
                gameState.money -= cost;
                gameState[statKey] = modifierFn(gameState[statKey]);
                this.tweens.add({
                    targets: btn,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 50,
                    yoyo: true
                });
                updateBtn();
                this.moneyText.setText(`Money Available: $${gameState.money}`);
            }
        });

        updateBtn();
    }

    createMotorcycleUpgrade(x, y) {
        const cost = 400;
        const label = 'Motorcycle';

        const statusText = gameState.hasMotorcycle ? 'OWNED' : 'Not Owned';
        const labelText = this.add.text(x - 200, y, `${label}: ${statusText}`, { fontSize: '20px', fill: '#aaa' }).setOrigin(0, 0.5);

        const btn = this.add.rectangle(x + 150, y, 140, 40, 0x444444).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(x + 150, y, `Buy ($${cost})`, { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);

        const updateBtn = () => {
            if (gameState.hasMotorcycle) {
                btn.setFillStyle(0x555555);
                btnText.setText('OWNED');
                btnText.setColor('#00ff00');
                btn.disableInteractive();
                labelText.setText(`${label}: OWNED`);
            } else if (gameState.money >= cost) {
                btn.setFillStyle(0x0088ff);
                btnText.setText(`Buy ($${cost})`);
                btnText.setColor('#ffffff');
                btn.setInteractive({ useHandCursor: true });
            } else {
                btn.setFillStyle(0x333333);
                btnText.setColor('#888888');
                btn.setInteractive({ useHandCursor: true });
            }
        };

        btn.on('pointerdown', () => {
            if (!gameState.hasMotorcycle && gameState.money >= cost) {
                gameState.money -= cost;
                gameState.hasMotorcycle = true;

                gameState.moveSpeed *= 2;
                gameState.maxHealth += 5;
                gameState.currentHealth += 5;

                this.tweens.add({
                    targets: btn,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 50,
                    yoyo: true
                });

                updateBtn();
                this.moneyText.setText(`Money Available: $${gameState.money}`);
            }
        });

        updateBtn();
    }
}
