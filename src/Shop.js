import { Container, Graphics, Text } from 'pixi.js';
import { gameState } from './GameState';

export class Shop extends Container {
    constructor(app, updateInvUI, debugConsole, goldText, allTiles) {
        super();
        this.app = app;
        this.updateInvUI = updateInvUI;
        this.debugConsole = debugConsole;
        this.goldText = goldText;
        this.allTiles = allTiles;

        this.x = window.innerWidth - 80;
        this.y = 20;

        // Иконка корзины (терминала покупок)
        this.icon = new Graphics()
            .roundRect(0, 0, 60, 60, 10)
            .fill(0xffcc00)
            .stroke({ color: 0xffffff, width: 2 });

        const label = new Text({ text: "💰", style: { fontSize: 32 } }); // Сменил на мешок с деньгами/чип
        label.anchor.set(0.5);
        label.x = 30; label.y = 30;
        this.addChild(this.icon, label);

        this.shopWindow = new Container();
        this.shopWindow.visible = false;
        this.shopWindow.eventMode = 'none';
        this.addChild(this.shopWindow);

        this.shopHeight = 400;

        this.iconCont = new Container();
        this.iconCont.addChild(this.icon, label);
        this.addChild(this.iconCont);

        this.iconCont.eventMode = 'static';
        this.iconCont.cursor = 'pointer';
        this.iconCont.on('pointerdown', (e) => {
            e.stopPropagation();
            this.toggleShop();
        });

        this.eventMode = 'static';
        this.on('wheel', (e) => {
            if (!this.shopWindow.visible) return;
            const scrollSpeed = 20;
            this.catalogList.y -= e.deltaY > 0 ? scrollSpeed : -scrollSpeed;

            const minBtn = 0;
            const maxScroll = Math.min(0, this.shopHeight - this.catalogList.height - 20);
            if (this.catalogList.y > minBtn) this.catalogList.y = minBtn;
            if (this.catalogList.y < maxScroll) this.catalogList.y = maxScroll;
        });

        this.createShopWindow();
    }

    createShopWindow() {
        this.shopWindow.removeChildren();

        const bg = new Graphics()
            .roundRect(-220, 70, 280, 450, 15)
            .fill({ color: 0x000000, alpha: 0.9 })
            .stroke({ color: 0x00aaff, width: 2 }); // Сменил на синий неон
        this.shopWindow.addChild(bg);

        const mask = new Graphics()
            .roundRect(-215, 80, 270, this.shopHeight, 10)
            .fill(0xffffff);
        this.shopWindow.addChild(mask);

        this.scrollArea = new Container();
        this.scrollArea.x = -210;
        this.scrollArea.y = 85;
        this.scrollArea.mask = mask;
        this.shopWindow.addChild(this.scrollArea);

        this.catalogList = new Container();
        this.scrollArea.addChild(this.catalogList);

        this.renderCatalog();
        this.addChild(this.shopWindow);
    }

    renderCatalog() {
        this.catalogList.removeChildren();

        const catalog = [
            { name: 'Bio-Slot Preparator', toolType: 'hoe', price: 50, count: 5, color: 0xaaaaaa, type: 'tool' },
            { name: 'Liquid Luck Dispenser', toolType: 'can', price: 40, count: 5, color: 0x00aaff, type: 'tool' },
            { name: 'Deep-Fluid Server', toolType: 'well', price: 500, count: 1, color: 0x555555, type: 'building' },
            { name: 'Slot-Lime [LV]', type: 'green', bonus: 10, price: 25, count: 5, color: 0x32cd32 },
            { name: 'Roulette-Cherry [HS]', type: 'red', bonus: 25, price: 60, count: 5, color: 0xff4500 },
            { name: 'RTP Booster (+50%)', type: 'fertilizer', price: 30, count: 5, color: 0xeeeeee }
        ];

        if (gameState.quests.blueSeeds && gameState.quests.blueSeeds.unlocked) {
            catalog.push({ name: 'JACKPOT NEON', type: 'blue', bonus: 50, price: 150, count: 5, color: 0x00aaff });
        }

        catalog.forEach((item, i) => {
            const row = new Container();
            row.y = i * 70;

            const btn = new Graphics().roundRect(0, 0, 240, 60, 5).fill(0x1a1a1a).stroke({color: 0x333333, width: 1});
            btn.eventMode = 'static';
            btn.cursor = 'pointer';

            const txt = new Text({
                text: `${item.name}\nCOST: ${item.price} CR`, // Изменил 💰 на CR (Credits)
                style: { fill: '#00aaff', fontSize: 13, fontWeight: 'bold' }
            });
            txt.x = 10; txt.y = 12;

            btn.on('pointerdown', () => this.buyItem(item));
            row.addChild(btn, txt);
            this.catalogList.addChild(row);
        });
    }

    buyItem(conf) {
        if (gameState.gold < conf.price) {
            this.debugConsole?.addMessage("[ОШИБКА]: Баланс ниже минимальной ставки!", "#ff4444");
            return;
        }
        if (conf.toolType === 'well') {
            if (gameState.hasWell) {
                this.debugConsole?.addMessage("[ОТКАЗ]: Сервер уже активен!", "#ffaa00");
                return;
            }
            const grassTiles = this.allTiles.filter(t => t.type === 0);
            if (grassTiles.length > 0) {
                gameState.gold -= conf.price;
                this.goldText.text = `CREDITS: ${gameState.gold}`;
                gameState.hasWell = true;
                const randomTile = grassTiles[Math.floor(Math.random() * grassTiles.length)];
                randomTile.type = 3;
                randomTile.updateVisual();
                this.debugConsole?.addMessage("Deep-Fluid Server онлайн!", "#00ffff", "📡");
                this.updateInvUI();
            } else {
                this.debugConsole?.addMessage("[ОШИБКА]: Нет свободного сектора!", "#ff4444");
            }
            return;
        }

        let slot = gameState.inventory.findIndex(s => s && s.type === conf.type && conf.type !== 'tool');
        if (slot === -1) slot = gameState.inventory.findIndex(s => s === null);

        if (slot !== -1) {
            gameState.gold -= conf.price;
            this.goldText.text = `CREDITS: ${gameState.gold}`;
            if (gameState.inventory[slot]) {
                gameState.inventory[slot].count += conf.count;
            } else {
                gameState.inventory[slot] = { ...conf };
            }
            this.updateInvUI();
            this.debugConsole?.addMessage(`ПОДТВЕРЖДЕНО: Получен ${conf.name}`, "#4caf50");
        } else {
            this.debugConsole?.addMessage("[ОТКАЗ]: Слот-хранилище перегружено.", "#ff4444");
        }
    }

    toggleShop() {
        this.shopWindow.visible = !this.shopWindow.visible;
        this.shopWindow.eventMode = this.shopWindow.visible ? 'static' : 'none';

        if (this.shopWindow.visible) {
            this.renderCatalog();
        }
    }

    resize() {
        this.x = window.innerWidth - 80;
    }
}