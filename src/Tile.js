import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';
import { spinSlots } from './Casino';

export class Tile extends Container {
    constructor(type, gridX, gridY, tileSize, player, goldText, slotText, mapLayout, entityLayer, updateInvUI, debugConsole) {
        super();
        this.type = type; // 0: трава, 1: сектор, 2: забор, 3: сервер
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = tileSize;
        this.player = player;
        this.goldText = goldText;
        this.slotText = slotText;
        this.updateInvUI = updateInvUI;
        this.debugConsole = debugConsole;
        this.isSolid = (type === 2);
        this.isFertilized = false;
        this.fertilizerPoints = [];

        this.x = gridX * tileSize;
        this.y = gridY * tileSize;

        this.isGrowing = false;
        this.isWatered = false;
        this.plantedType = null;
        this.popUps = [];
        this.baseGrowthSpeed = 0.0003;

        this.bg = new Graphics();
        this.drawBackground();
        this.addChild(this.bg);

        this.plant = new Graphics().rect(4, 4, 32, 32).fill(0xffffff);
        this.plant.visible = false;
        this.plant.scale.set(0.1);
        this.plant.pivot.set(10, 12);
        this.plant.x = 16;
        this.plant.y = 16;
        this.addChild(this.plant);

        if (this.type === 2 && entityLayer) {
            this.fenceVisual = new Graphics();
            this.drawSmartFence(this.fenceVisual, mapLayout);
            this.fenceVisual.x = this.x;
            this.fenceVisual.y = this.y;
            entityLayer.addChild(this.fenceVisual);
        }

        this.eventMode = 'static';
        this.on('pointerdown', () => this.handleClick());
    }

    drawBackground() {
        this.bg.clear();
        const showingAsWatered = this.isWatered || (gameState.currentWeather === 'rainy');

        let color = 0x3a7d32;
        if (this.type === 1) {
            color = showingAsWatered ? 0x3d2b1f : 0x6b4226;
        } else if (this.type === 3) {
            color = 0x1a1a1a; // Цвет корпуса сервера
        }
        if (this.type === 4) {
            color = 0x555555;
        }

        this.bg.rect(0, 0, this.tileSize, this.tileSize).fill(color);

        if (this.type === 4) {
            this.bg.rect(8, 4, this.tileSize - 16, this.tileSize - 8).fill(0x1a1a1a);
            this.bg.rect(12, 8, this.tileSize - 24, 10).fill(0x00ff00, 0.3); // Экранчик пугала мерцает зеленым
        }

        if (this.type === 1 && this.isFertilized) {
            this.fertilizerPoints.forEach(p => {
                this.bg.rect(p.x, p.y, 2, 2).fill(0x00aaff); // Точки удобрения теперь неоново-синие
            });
        }

        if (this.type === 3) {
            this.bg.rect(10, 10, this.tileSize - 20, this.tileSize - 20).fill(0x00aaff, 0.5); // Синее свечение сервера
        }

        if (this.type === 1) {
            const strokeColor = showingAsWatered ? 0x00ff00 : 0x553311; // Зеленый неон если полито
            this.bg.stroke({ color: strokeColor, width: showingAsWatered ? 2 : 1, alignment: 1 });
        }
    }

    drawSmartFence(g, map) {
        const mid = this.tileSize / 2;
        g.rect(mid - 6, mid - 6, 12, 12).fill(0x222222); // Металлический забор
        const isF = (x, y) => map[y] && map[y][x] === 2;
        if (isF(this.gridX, this.gridY - 1)) g.rect(mid - 4, 0, 8, mid).fill(0x333333);
        if (isF(this.gridX, this.gridY + 1)) g.rect(mid - 4, mid, 8, mid).fill(0x333333);
        if (isF(this.gridX - 1, this.gridY)) g.rect(0, mid - 4, mid, 8).fill(0x333333);
        if (isF(this.gridX + 1, this.gridY)) g.rect(mid, mid - 4, mid, 8).fill(0x333333);
    }

    async handleClick() {
        if (this.isSolid || this.type === 4 || gameState.isSpinning) return;

        const dx = (this.x + this.tileSize / 2) - this.player.x;
        const dy = (this.y + this.tileSize / 2) - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) > this.tileSize * 2) return;

        const item = gameState.inventory[gameState.selectedSlot];

        // ЛОГИКА RTP BOOSTER (Удобрение)
        if (this.type === 1 && item && item.type === 'fertilizer') {
            if (!this.isFertilized) {
                this.isFertilized = true;
                this.fertilizerPoints = [];
                for (let i = 0; i < 5; i++) {
                    this.fertilizerPoints.push({
                        x: Math.random() * (this.tileSize - 4),
                        y: Math.random() * (this.tileSize - 4)
                    });
                }
                item.count--;
                if (item.count <= 0) gameState.inventory[gameState.selectedSlot] = null;

                this.drawBackground();
                this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage("RTP BOOSTER АКТИВИРОВАН (+50% к заносу)", "#00ff00", "⚡");
            }
            return;
        }

        // ЛОГИКА DEEP-FLUID SERVER (Колодец)
        if (this.type === 3) {
            if (item && item.toolType === 'bucket') {
                item.count = 5;
                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage("Ёмкость заполнена Liquid Luck", "#00ffff", "💧");
            } else {
                if (this.debugConsole) this.debugConsole.addMessage("Требуется пустой контейнер", "#cccccc");
            }
            return;
        }

        // ЛОГИКА BIO-SLOT PREPARATOR (Тяпка)
        if (this.type === 0) {
            if (item && item.toolType === 'hoe' && item.count > 0) {
                this.type = 1;
                item.count--;
                if (item.count <= 0) gameState.inventory[gameState.selectedSlot] = null;
                this.drawBackground();
                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage("Сектор активен. Принимаются ставки.", "#8bc34a");
            }
            return;
        }

        // ЛОГИКА LIQUID LUCK (Полив)
        if (this.type === 1 && item && (item.toolType === 'can' || item.toolType === 'bucket')) {
            if (!this.isWatered && item.count > 0) {
                this.isWatered = true;
                item.count--;

                if (item.count <= 0) {
                    if (item.toolType === 'can') {
                        gameState.inventory[gameState.selectedSlot] = null;
                        if (this.debugConsole) this.debugConsole.addMessage("Распылитель перегорел!", "#ff4444");
                    } else {
                        this.debugConsole?.addMessage("Запас Liquid Luck исчерпан!", "#ff4444");
                    }
                }

                this.drawBackground();
                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage("Цикл ускорен. Анализ вероятностей: Оптимально.", "#00aaff");
            } else if (item.count <= 0) {
                if (this.debugConsole) this.debugConsole.addMessage("Нужна доза Liquid Luck!", "#ff4444");
            }
            return;
        }

        // ЛОГИКА СТАВКИ (Посадка семян)
        if (this.type === 1 && !this.isGrowing) {
            if (item && item.type && item.type !== 'tool' && item.count > 0) {
                item.count--;
                this.plantedType = { ...item };
                if (item.count <= 0) gameState.inventory[gameState.selectedSlot] = null;

                this.isGrowing = true;
                this.plant.tint = item.color;
                this.plant.visible = true;

                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage(`Ставка принята: ${item.name}`, "#ffd700", "🎰");
            }
            return;
        }

        // ЛОГИКА ПОДТВЕРЖДЕНИЯ СПИНА (Сбор урожая)
        if (this.isGrowing && this.plant.scale.x >= 1) {
            const res = await spinSlots(this.slotText, {
                bonus: this.plantedType.bonus,
                isFertilized: this.isFertilized
            });

            if (res.rewardGold > 0) {
                gameState.gold += res.rewardGold;
                this.goldText.text = `CREDITS: ${gameState.gold}`;
                this.spawnCoinText(res.rewardGold);
            }

            this.isGrowing = false;
            this.isWatered = false;
            this.isFertilized = false;
            this.plant.visible = false;
            this.plant.scale.set(0.1);
            this.drawBackground();
            if (this.updateInvUI) this.updateInvUI();
        }
    }

    spawnCoinText(amount) {
        const style = new TextStyle({
            fill: '#00ff00', fontSize: 24, fontWeight: 'bold', stroke: { color: '#000000', width: 3 }
        });
        const txt = new Text({ text: `+${amount} CR`, style }); // Изменил 🪙 на CR
        txt.anchor.set(0.5);
        txt.x = this.tileSize / 2;
        txt.y = 0;
        this.addChild(txt);
        this.popUps.push(txt);
    }

    update(dt) {
        if (this.isGrowing && this.plant.scale.x < 1) {
            const effectivelyWatered = this.isWatered || (gameState.currentWeather === 'rainy');
            const multiplier = effectivelyWatered ? 2 : 1;
            this.plant.scale.x += this.baseGrowthSpeed * multiplier * dt;
            this.plant.scale.y += this.baseGrowthSpeed * multiplier * dt;
        }

        if (this.type === 1) {
            const shouldShowWatered = this.isWatered || (gameState.currentWeather === 'rainy');
            if (this.lastWaterState !== shouldShowWatered) {
                this.lastWaterState = shouldShowWatered;
                this.drawBackground();
            }
        }

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