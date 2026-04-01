import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';
import { spinSlots } from './Casino';

export class Tile extends Container {
    constructor(type, gridX, gridY, tileSize, player, goldText, slotText, mapLayout, entityLayer, updateInvUI, debugConsole) {
        super();
        this.type = type; // 0: трава, 1: грядка, 2: забор, 3: колодец
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = tileSize;
        this.player = player;
        this.goldText = goldText;
        this.slotText = slotText;
        this.updateInvUI = updateInvUI;
        this.debugConsole = debugConsole;
        this.isSolid = (type === 2); // Забор непроходим
        this.isFertilized = false;
        this.fertilizerPoints = []; // Здесь будем хранить фиксированные позиции точек

        this.x = gridX * tileSize;
        this.y = gridY * tileSize;

        // СОСТОЯНИЯ
        this.isGrowing = false;
        this.isWatered = false;
        this.plantedType = null;
        this.popUps = [];
        this.baseGrowthSpeed = 0.0003;

        // Основной слой графики плитки
        this.bg = new Graphics();
        this.drawBackground();
        this.addChild(this.bg);

        // Графика растения
        this.plant = new Graphics().rect(4, 4, 32, 32).fill(0xffffff);
        this.plant.visible = false;
        this.plant.scale.set(0.1);
        this.plant.pivot.set(10, 12);
        this.plant.x = 16;
        this.plant.y = 16;
        this.addChild(this.plant);

        // Отрисовка "умного" забора, если тип 2
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

        // ПРОВЕРКА: Считается ли плитка политой сейчас?
        // Она полита, если: её полили вручную ИЛИ на улице идет дождь
        const showingAsWatered = this.isWatered || (gameState.currentWeather === 'rainy');

        let color = 0x3a7d32; // Трава
        if (this.type === 1) {
            // Используем наше новое условие для выбора цвета
            color = showingAsWatered ? 0x3d2b1f : 0x6b4226;
        } else if (this.type === 3) {
            color = 0x808080; // Камень колодца
        }
        if (this.type === 4) {
            color = 0x555555; // Темно-серый цвет для "руин" пугала
        }
        if (this.type === 4) {
            this.bg.rect(8, 4, this.tileSize - 16, this.tileSize - 8).fill(0x1a1a1a); // Тело автомата
            this.bg.rect(12, 8, this.tileSize - 24, 10).fill(0x333333); // Экранчик
        }

        this.bg.rect(0, 0, this.tileSize, this.tileSize).fill(color);

        // ЭФФЕКТ УДОБРЕНИЯ: Рисуем маленькие белые точки поверх земли
        if (this.type === 1 && this.isFertilized) {
            this.fertilizerPoints.forEach(p => {
                this.bg.rect(p.x, p.y, 2, 2).fill(0xffffff);
            });
        }

        // Рисуем воду, если это колодец
        if (this.type === 3) {
            this.bg.rect(10, 10, this.tileSize - 20, this.tileSize - 20).fill(0x00aaff);
        }

        if (this.type === 1) {
            // Тоже используем showingAsWatered для цвета обводки
            const strokeColor = showingAsWatered ? 0x00aaff : 0x553311;
            this.bg.stroke({ color: strokeColor, width: showingAsWatered ? 2 : 1, alignment: 1 });
        }
    }

    drawSmartFence(g, map) {
        const mid = this.tileSize / 2;
        // Центральный столбик забора
        g.rect(mid - 6, mid - 6, 12, 12).fill(0x5d3a1a);

        const isF = (x, y) => map[y] && map[y][x] === 2;

        // Рисуем перекладины к соседним заборам
        if (isF(this.gridX, this.gridY - 1)) g.rect(mid - 4, 0, 8, mid).fill(0x4a2c16);
        if (isF(this.gridX, this.gridY + 1)) g.rect(mid - 4, mid, 8, mid).fill(0x4a2c16);
        if (isF(this.gridX - 1, this.gridY)) g.rect(0, mid - 4, mid, 8).fill(0x4a2c16);
        if (isF(this.gridX + 1, this.gridY)) g.rect(mid, mid - 4, mid, 8).fill(0x4a2c16);
    }

    async handleClick() {
        // Если забор или идет анимация слотов - игнорируем
        if (this.isSolid || this.type === 4 || gameState.isSpinning) return;

        // Проверка дистанции от игрока до плитки
        const dx = (this.x + this.tileSize / 2) - this.player.x;
        const dy = (this.y + this.tileSize / 2) - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) > this.tileSize * 2) return;

        const item = gameState.inventory[gameState.selectedSlot];

        if (this.type === 1 && item && item.type === 'fertilizer') {
            if (!this.isFertilized) {
                this.isFertilized = true;
                // Генерируем позиции ОДИН РАЗ
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
                if (this.debugConsole) this.debugConsole.addMessage("Земля удобрена! (+50% прибыли)", "#ffffff", "✨");
            }
            return;
        }

        // 1. ЛОГИКА КОЛОДЦА (Набор воды)
        if (this.type === 3) {
            if (item && item.toolType === 'bucket') {
                item.count = 5;
                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage("Ведро наполнено!", "#00ffff", "💧");
            } else {
                if (this.debugConsole) this.debugConsole.addMessage("Нужно ведро", "#ffffff");
            }
            return;
        }

        // 2. ЛОГИКА ТЯПКИ (Вспахивание травы)
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

        // 3. ЛОГИКА ПОЛИВА (Лейка или Ведро)
        if (this.type === 1 && item && (item.toolType === 'can' || item.toolType === 'bucket')) {
            if (!this.isWatered && item.count > 0) {
                this.isWatered = true;
                item.count--;

                // Лейка удаляется при 0, ведро — остается пустым
                if (item.count <= 0) {
                    if (item.toolType === 'can') {
                        gameState.inventory[gameState.selectedSlot] = null; // Лейка удаляется
                        if (this.debugConsole) this.debugConsole.addMessage("Лейка сломалась!", "#ff4444");
                    } else {
                        // Для ведра НИЧЕГО не делаем, оно просто остается с count = 0
                        this.debugConsole?.addMessage("Ведро пустое!", "#ff4444");
                    }
                }

                this.drawBackground();
                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage("Цикл ускорен. Вероятность заноса: Оптимальная.", "#00aaff");
            } else if (item.count <= 0) {
                if (this.debugConsole) this.debugConsole.addMessage("Вода кончилась!", "#ff4444");
            }
            return;
        }

        // 4. ЛОГИКА ПОСАДКИ СЕМЯН
        if (this.type === 1 && !this.isGrowing) {
            if (item && item.type && item.type !== 'tool' && item.count > 0) {
                item.count--;
                this.plantedType = { ...item };
                if (item.count <= 0) gameState.inventory[gameState.selectedSlot] = null;

                this.isGrowing = true;
                this.plant.tint = item.color;
                this.plant.visible = true;

                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.logPlant(item.name);
            }
            return;
        }

        // Tile.js (внутри handleClick, блок 5)

// 5. ЛОГИКА СБОРА УРОЖАЯ
        if (this.isGrowing && this.plant.scale.x >= 1) {
            // Передаем бонус семян и статус удобрения прямо в казино
            const res = await spinSlots(this.slotText, {
                bonus: this.plantedType.bonus,
                isFertilized: this.isFertilized
            });

            if (res.rewardGold > 0) {
                gameState.gold += res.rewardGold;
                this.goldText.text = `Золото: ${gameState.gold}`;
                this.spawnCoinText(res.rewardGold);
            }

            // Сбрасываем всё после сбора
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
            fill: '#ffd700', fontSize: 24, fontWeight: 'bold', stroke: { color: '#000000', width: 3 }
        });
        const txt = new Text({ text: `+${amount} 🪙`, style });
        txt.anchor.set(0.5);
        txt.x = this.tileSize / 2;
        txt.y = 0;
        this.addChild(txt);
        this.popUps.push(txt);
    }

    update(dt) {
        // 1. ЛОГИКА РОСТА
        if (this.isGrowing && this.plant.scale.x < 1) {
            // Растение растет быстрее, если: полито вручную ИЛИ идет дождь
            const effectivelyWatered = this.isWatered || (gameState.currentWeather === 'rainy');
            const multiplier = effectivelyWatered ? 2 : 1;

            this.plant.scale.x += this.baseGrowthSpeed * multiplier * dt;
            this.plant.scale.y += this.baseGrowthSpeed * multiplier * dt;
        }

        // 2. ВИЗУАЛЬНОЕ ОБНОВЛЕНИЕ ПРИ СМЕНЕ ПОГОДЫ
        // Чтобы не перерисовывать каждый кадр (это нагрузка), проверяем только грядки
        if (this.type === 1) {
            const currentlyShowingWatered = (this.color === 0x3d2b1f); // Проверка текущего цвета
            const shouldShowWatered = this.isWatered || (gameState.currentWeather === 'rainy');

            // Если визуальное состояние не соответствует погоде — перерисовываем
            if (currentlyShowingWatered !== shouldShowWatered) {
                this.drawBackground();
            }
        }

        // 3. Анимация всплывающих цифр (твой старый код)
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