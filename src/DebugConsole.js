import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class DebugConsole extends Container {
    constructor(width, height) {
        super();
        this.w = width;
        this.h = height;
        this.messages = [];
        this.maxMessages = 50;

        this.createUI();
        this.setupDrag();
    }

    createUI() {
        this.bg = new Graphics()
            .roundRect(0, 0, this.w, this.h, 10)
            .fill({ color: 0x000000, alpha: 0.85 })
            .stroke({ color: 0xffd700, width: 2 });
        this.addChild(this.bg);

        const titleStyle = new TextStyle({ fill: '#ffd700', fontSize: 14, fontWeight: 'bold' });
        this.title = new Text({ text: '📜 ЛОГ СОБЫТИЙ 📜', style: titleStyle });
        this.title.x = 10;
        this.title.y = 5;
        this.addChild(this.title);

        this.line = new Graphics().rect(0, 25, this.w, 2).fill(0xffd700);
        this.addChild(this.line);

        this.messagesContainer = new Container();
        this.addChild(this.messagesContainer);

        // МАСКА: Теперь строго привязана к области под заголовком
        this.maskGraphics = new Graphics()
            .rect(0, 30, this.w, this.h - 40)
            .fill(0xffffff);
        this.addChild(this.maskGraphics);
        this.messagesContainer.mask = this.maskGraphics;

        this.clearBtn = new Graphics()
            .roundRect(this.w - 70, 5, 60, 20, 5)
            .fill(0x8f4a4a)
            .stroke({ color: 0xffffff, width: 1 });
        this.clearBtn.eventMode = 'static';
        this.clearBtn.cursor = 'pointer';
        this.clearBtn.on('pointerdown', (e) => {
            e.stopPropagation();
            this.clear();
        });

        const clearText = new Text({
            text: 'Очистить',
            style: { fill: 0xffffff, fontSize: 10, fontWeight: 'bold' }
        });
        clearText.x = this.w - 62;
        clearText.y = 8;
        this.addChild(this.clearBtn, clearText);

        this.addMessage('🎮 Игра запущена', '#4caf50');
    }

    setupDrag() {
        this.eventMode = 'static';
        this.cursor = 'grab';
        let dragging = false;
        let dragData = { x: 0, y: 0 };

        this.on('pointerdown', (e) => {
            dragging = true;
            dragData = e.getLocalPosition(this.parent);
            dragData.x -= this.x;
            dragData.y -= this.y;
        });

        this.on('globalpointermove', (e) => {
            if (dragging) {
                const newPos = e.getLocalPosition(this.parent);
                this.x = newPos.x - dragData.x;
                this.y = newPos.y - dragData.y;
            }
        });

        const end = () => dragging = false;
        this.on('pointerup', end);
        this.on('pointerupoutside', end);
    }

    addMessage(text, color = '#ffffff', icon = '📌') {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        const msg = { text: `${timestamp} ${icon} ${text}`, color };

        this.messages.unshift(msg); // Новые сообщения в начало
        if (this.messages.length > this.maxMessages) this.messages.pop();

        this.refreshMessages();
    }

    refreshMessages() {
        this.messagesContainer.removeChildren();
        let currentY = 30; // Начальная точка отрисовки под линией

        this.messages.forEach((msg) => {
            const txt = new Text({
                text: msg.text,
                style: {
                    fill: msg.color,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    wordWrap: true,
                    wordWrapWidth: this.w - 20
                }
            });
            txt.x = 10;
            txt.y = currentY;
            this.messagesContainer.addChild(txt);
            currentY += txt.height + 4;
        });
    }

    clear() {
        this.messages = [];
        this.refreshMessages();
        this.addMessage('🧹 Лог очищен', '#ffd700');
    }

    logSpin(combination, result, rewardGold, seedChange) {
        let color = rewardGold > 0 ? '#4caf50' : (seedChange < 0 ? '#f44336' : '#ffffff');
        let msg = `${combination} → ${result}`;
        if (rewardGold > 0) msg += ` (+${rewardGold} золота)`;
        this.addMessage(msg, color, '🎰');
    }

    logPlant(plantType) { this.addMessage(`Посажено: ${plantType}`, '#8bc34a', '🌱'); }
    logHarvest(gold, mult) { this.addMessage(`Сбор: +${gold} (x${mult})`, '#4caf50', '💚'); }
    logSeedChange(amount, type) { this.addMessage(`${amount > 0 ? '+' : ''}${amount} семян ${type}`, '#ffd700', '🎁'); }
}