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
        // Фон: глубокий черный с неоновой синей рамкой (в цвет телефона)
        this.bg = new Graphics()
            .roundRect(0, 0, this.w, this.h, 10)
            .fill({ color: 0x000000, alpha: 0.9 })
            .stroke({ color: 0x00aaff, width: 2 });
        this.addChild(this.bg);

        const titleStyle = new TextStyle({
            fill: '#00aaff',
            fontSize: 12,
            fontWeight: '900',
            letterSpacing: 2
        });
        this.title = new Text({ text: '█ SYSTEM MONITOR v.1.04', style: titleStyle });
        this.title.x = 10;
        this.title.y = 5;
        this.addChild(this.title);

        this.line = new Graphics().rect(0, 25, this.w, 1).fill(0x333333);
        this.addChild(this.line);

        this.messagesContainer = new Container();
        this.addChild(this.messagesContainer);

        this.maskGraphics = new Graphics()
            .rect(0, 30, this.w, this.h - 40)
            .fill(0xffffff);
        this.addChild(this.maskGraphics);
        this.messagesContainer.mask = this.maskGraphics;

        // Кнопка очистки теперь называется "PURGE"
        this.clearBtn = new Graphics()
            .roundRect(this.w - 75, 5, 65, 18, 4)
            .fill(0x330000)
            .stroke({ color: 0xff4444, width: 1 });
        this.clearBtn.eventMode = 'static';
        this.clearBtn.cursor = 'pointer';
        this.clearBtn.on('pointerdown', (e) => {
            e.stopPropagation();
            this.clear();
        });

        const clearText = new Text({
            text: 'PURGE LOG',
            style: { fill: 0xff4444, fontSize: 9, fontWeight: 'bold' }
        });
        clearText.x = this.w - 70;
        clearText.y = 8;
        this.addChild(this.clearBtn, clearText);

        this.addMessage('CORE: Подключение к сети установлено...', '#00ff00', '🔗');
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

    addMessage(text, color = '#cccccc', icon = '>>') {
        const timestamp = new Date().toLocaleTimeString('ru-RU', { hour12: false });
        const msg = { text: `[${timestamp}] ${icon} ${text}`, color };

        this.messages.unshift(msg);
        if (this.messages.length > this.maxMessages) this.messages.pop();

        this.refreshMessages();
    }

    refreshMessages() {
        this.messagesContainer.removeChildren();
        let currentY = 30;

        this.messages.forEach((msg) => {
            const txt = new Text({
                text: msg.text,
                style: {
                    fill: msg.color,
                    fontSize: 11,
                    fontFamily: 'monospace', // Важно для стиля терминала
                    wordWrap: true,
                    wordWrapWidth: this.w - 20
                }
            });
            txt.x = 10;
            txt.y = currentY;
            this.messagesContainer.addChild(txt);
            currentY += txt.height + 2;
        });
    }

    clear() {
        this.messages = [];
        this.refreshMessages();
        this.addMessage('LOG: Данные стерты по запросу пользователя', '#ff4444', '🧹');
    }

    // Переписанные методы под лор казино
    logSpin(combination, result, rewardGold) {
        let color = rewardGold > 0 ? '#00ff00' : '#888888';
        let msg = `SPIN: [${combination}] >> ${result}`;
        if (rewardGold > 0) msg += ` (+${rewardGold} CR)`;
        this.addMessage(msg, color, '🎰');
    }

    logPlant(plantType) {
        this.addMessage(`СТАВКА: Активирован протокол ${plantType}`, '#00aaff', '💾');
    }

    logHarvest(gold, mult) {
        this.addMessage(`ВЫПЛАТА: +${gold} CR (Множитель x${mult})`, '#00ff00', '💎');
    }

    logSeedChange(amount, type) {
        this.addMessage(`ИНВЕНТАРЬ: ${amount > 0 ? 'Загружено' : 'Списано'} ${Math.abs(amount)} ед. ${type}`, '#ffd700', '📦');
    }
}