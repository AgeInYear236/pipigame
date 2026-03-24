import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';
import { spinSlots } from './Casino';

export class Tile extends Container {
    constructor(type, gridX, gridY, tileSize, player, goldText, slotText, mapLayout, entityLayer) {
        super();
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = tileSize;
        this.player = player;
        this.goldText = goldText; // Сохраняем ссылку на текст золота
        this.isSolid = (type === 2);

        this.x = gridX * tileSize;
        this.y = gridY * tileSize;

        // 1. Земля
        const bg = new Graphics()
            .rect(0, 0, tileSize, tileSize)
            .fill(type === 1 ? 0x6b4226 : 0x3a7d32);
        this.addChild(bg);

        // 2. Растение
        this.plant = new Graphics().rect(16, 16, 32, 32).fill(0xffffff);
        this.plant.visible = false;
        this.plant.scale.set(0.1);
        this.addChild(this.plant);

        // 3. Визуал забора
        if (type === 2 && entityLayer) {
            this.fenceVisual = new Graphics();
            this.drawSmartFence(this.fenceVisual, mapLayout);
            this.fenceVisual.x = this.x;
            this.fenceVisual.y = this.y;
            entityLayer.addChild(this.fenceVisual);
        }

        this.isGrowing = false;
        this.plantedType = null;
        this.popUps = []; // Список активных текстов +50

        this.eventMode = 'static';
        this.on('pointerdown', () => this.handleClick(slotText));
    }

    drawSmartFence(g, map) {
        const mid = this.tileSize / 2;
        g.rect(mid - 6, mid - 6, 12, 12).fill(0x5d3a1a);
        const isF = (x, y) => map[y] && map[y][x] === 2;
        if (isF(this.gridX, this.gridY - 1)) g.rect(mid - 4, 0, 8, mid).fill(0x4a2c16);
        if (isF(this.gridX, this.gridY + 1)) g.rect(mid - 4, mid, 8, mid).fill(0x4a2c16);
        if (isF(this.gridX - 1, this.gridY)) g.rect(0, mid - 4, mid, 8).fill(0x4a2c16);
        if (isF(this.gridX + 1, this.gridY)) g.rect(mid, mid - 4, mid, 8).fill(0x4a2c16);
    }

    async handleClick(slotText) {
        if (this.type !== 1 || gameState.isSpinning) return;

        const dx = (this.x + this.tileSize/2) - this.player.x;
        const dy = (this.y + this.tileSize/2) - this.player.y;
        if (Math.sqrt(dx*dx + dy*dy) > this.tileSize * 1.8) return;

        if (!this.isGrowing) {
            const item = gameState.inventory[gameState.selectedSlot];
            if (item && item.type) {
                this.isGrowing = true;
                this.plantedType = item;
                this.plant.tint = item.color;
                this.plant.visible = true;
            }
        } else if (this.plant.scale.x >= 1) {
            // ЛОГИКА СБОРА
            const rewardMult = await spinSlots(slotText);
            const finalReward = this.plantedType.bonus * rewardMult;

            if (finalReward > 0) {
                gameState.gold += finalReward;
                this.goldText.text = `Золото: ${gameState.gold}`;
                this.spawnCoinText(finalReward); // Показываем +50
            }

            // Сброс грядки
            this.isGrowing = false;
            this.plant.visible = false;
            this.plant.scale.set(0.1);

            // Очистка текста рулетки через время
            setTimeout(() => { if(!gameState.isSpinning) slotText.text = ''; }, 1500);
        }
    }

    // Внутренний метод для всплывающего текста
    spawnCoinText(amount) {
        const style = new TextStyle({
            fill: '#ffd700',
            fontSize: 24,
            fontWeight: 'bold',
            stroke: { color: '#000000', width: 3 }
        });
        const txt = new Text({ text: `+${amount} 🪙`, style });
        txt.anchor.set(0.5);
        txt.x = this.tileSize / 2;
        txt.y = 0;
        this.addChild(txt);
        this.popUps.push(txt);
    }

    update(dt) {
        // Логика роста
        if (this.isGrowing && this.plant.scale.x < 1) {
            this.plant.scale.x += 0.005 * dt;
            this.plant.scale.y += 0.005 * dt;
        }

        // Анимация всплывающих текстов
        for (let i = this.popUps.length - 1; i >= 0; i--) {
            const txt = this.popUps[i];
            txt.y -= 1 * dt;
            txt.alpha -= 0.02 * dt;
            if (txt.alpha <= 0) {
                this.removeChild(txt);
                txt.destroy();
                this.popUps.splice(i, 1);
            }
        }
    }
}