import { Container, Graphics, Text } from 'pixi.js';
import { gameState } from './GameState';

export class Shop extends Container {
    constructor(app, updateInvUI, debugConsole, goldText, allTiles) {
        super();
        this.app = app;
        this.updateInvUI = updateInvUI;
        this.debugConsole = debugConsole;
        this.goldText = goldText;
        this.allTiles = allTiles; // Массив всех Tile объектов из main.js

        this.x = window.innerWidth - 80;
        this.y = 20;

        // Иконка корзины
        this.icon = new Graphics()
            .roundRect(0, 0, 60, 60, 10)
            .fill(0xffcc00)
            .stroke({ color: 0xffffff, width: 2 });

        const label = new Text({ text: "🛒", style: { fontSize: 32 } });
        label.anchor.set(0.5);
        label.x = 30; label.y = 30;
        this.addChild(this.icon, label);

        this.shopWindow = new Container();
        this.shopWindow.visible = false;
        this.createShopWindow();

        this.icon.eventMode = 'static';
        this.icon.cursor = 'pointer';
        this.icon.on('pointerdown', () => {
            this.shopWindow.visible = !this.shopWindow.visible;
        });
    }

    createShopWindow() {
        const bg = new Graphics()
            .roundRect(-220, 70, 280, 450, 15)
            .fill({ color: 0x000000, alpha: 0.9 })
            .stroke({ color: 0xffcc00, width: 2 });
        this.shopWindow.addChild(bg);

        const catalog = [
            { name: 'Тяпка', toolType: 'hoe', price: 50, count: 5, color: 0xaaaaaa, type: 'tool' },
            { name: 'Лейка', toolType: 'can', price: 40, count: 5, color: 0x00aaff, type: 'tool' },
            { name: 'Колодец', toolType: 'well', price: 500, count: 1, color: 0x555555, type: 'building' },
            { name: 'Зеленое Семя', type: 'green', bonus: 10, price: 20, count: 5, color: 0x32cd32 },
            { name: 'Красное Семя', type: 'red', bonus: 25, price: 50, count: 5, color: 0xff4500 },
            { name: 'Удобрение', type: 'fertilizer', price: 30, count: 5, color: 0xeeeeee }
        ];

        catalog.forEach((item, i) => {
            const row = new Container();
            row.y = 90 + (i * 70);
            row.x = -200;

            const btn = new Graphics().roundRect(0, 0, 240, 60, 5).fill(0x333333);
            btn.eventMode = 'static';
            btn.cursor = 'pointer';

            const txt = new Text({
                text: `${item.name} - ${item.price}💰`,
                style: { fill: 0xffffff, fontSize: 14 }
            });
            txt.x = 10; txt.y = 20;

            btn.on('pointerdown', () => this.buyItem(item));
            row.addChild(btn, txt);
            this.shopWindow.addChild(row);
        });

        this.addChild(this.shopWindow);
    }

    buyItem(conf) {
        if (gameState.gold < conf.price) {
            this.debugConsole?.addMessage("Недостаточно золота!", "#ff4444");
            return;
        }

        // Логика для постройки колодца
        if (conf.toolType === 'well') {
            if (gameState.hasWell) {
                this.debugConsole?.addMessage("Колодец уже построен!", "#ffaa00");
                return;
            }

            // Ищем все тайлы травы (type 0)
            const grassTiles = this.allTiles.filter(t => t.type === 0);

            if (grassTiles.length > 0) {
                gameState.gold -= conf.price;
                this.goldText.text = `Золото: ${gameState.gold}`;
                gameState.hasWell = true;

                // Выбираем случайный тайл травы и превращаем в колодец
                const randomTile = grassTiles[Math.floor(Math.random() * grassTiles.length)];
                randomTile.type = 3;
                randomTile.drawBackground(); // Перерисовываем его

                this.debugConsole?.addMessage("Колодец построен!", "#00ffff", "🏗️");
                this.updateInvUI();
            } else {
                this.debugConsole?.addMessage("Нет места для колодца!", "#ff4444");
            }
            return; // Выходим, чтобы не добавлять колодец в инвентарь
        }

        // Логика для обычных предметов
        let slot = gameState.inventory.findIndex(s => s && s.type === conf.type && conf.type !== 'tool');
        if (slot === -1) slot = gameState.inventory.findIndex(s => s === null);

        if (slot !== -1) {
            gameState.gold -= conf.price;
            this.goldText.text = `Золото: ${gameState.gold}`;

            if (gameState.inventory[slot]) {
                gameState.inventory[slot].count += conf.count;
            } else {
                gameState.inventory[slot] = { ...conf };
            }

            this.updateInvUI();
            this.debugConsole?.addMessage(`Куплено: ${conf.name}`, "#4caf50");
        } else {
            this.debugConsole?.addMessage("Инвентарь полон!", "#ff4444");
        }
    }

    resize() {
        this.x = window.innerWidth - 80;
    }
}