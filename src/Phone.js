import { Container, Graphics, Text } from 'pixi.js';
import { gameState } from "./GameState.js";

export class Phone extends Container {
    constructor(app, debugConsole, timeSystem) {
        super();
        this.app = app;
        this.debugConsole = debugConsole;
        this.timeSystem = timeSystem;

        this.isOpen = false;
        this.messages = [];
        this.currentOpenedMessage = null;

        this.phoneWidth = 240;
        this.phoneHeight = 420;

        // Корпус
        this.bg = new Graphics()
            .roundRect(0, 0, this.phoneWidth, this.phoneHeight, 25)
            .fill(0x1a1a1a)
            .stroke({ color: 0x333333, width: 4 });
        this.addChild(this.bg);

        // --- ЭКРАН СООБЩЕНИЙ ---
        this.listContainer = new Container();
        this.addChild(this.listContainer);

        this.screenBg = new Graphics()
            .roundRect(8, 35, this.phoneWidth - 16, this.phoneHeight - 80, 12)
            .fill(0x0a0a0a);
        this.listContainer.addChild(this.screenBg);

        this.header = new Text({
            text: "INCOMING PROTOCOLS", // Заменили MESSAGES
            style: { fill: '#00aaff', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
        });
        this.header.x = this.phoneWidth / 2;
        this.header.y = 18;
        this.header.anchor.set(0.5, 0);
        this.listContainer.addChild(this.header);

        // СКРОЛЛ И МАСКА
        this.scrollContainer = new Container();
        this.listContainer.addChild(this.scrollContainer);

        const mask = new Graphics()
            .roundRect(8, 35, this.phoneWidth - 16, this.phoneHeight - 80, 12)
            .fill(0xffffff);
        this.listContainer.addChild(mask);
        this.scrollContainer.mask = mask;

        this.msgList = new Container();
        this.msgList.x = 12;
        this.msgList.y = 45;
        this.scrollContainer.addChild(this.msgList);

        // --- ЭКРАН ДЕТАЛЕЙ ---
        this.detailContainer = new Container();
        this.detailContainer.visible = false;
        this.addChild(this.detailContainer);

        const detBg = new Graphics()
            .roundRect(8, 35, this.phoneWidth - 16, this.phoneHeight - 80, 12)
            .fill(0x111111);
        this.detailContainer.addChild(detBg);

        this.backBtn = new Text({ text: "<< RETURN", style: { fill: '#00aaff', fontSize: 10, fontWeight: 'bold' } }); // Заменили Back
        this.backBtn.x = 15; this.backBtn.y = 18;
        this.backBtn.eventMode = 'static';
        this.backBtn.cursor = 'pointer';
        this.backBtn.on('pointerdown', () => this.closeMessageDetail());
        this.detailContainer.addChild(this.backBtn);

        this.detailSenderTxt = new Text({ text: "", style: { fill: '#ffffff', fontSize: 12, fontWeight: 'bold' } });
        this.detailSenderTxt.x = this.phoneWidth / 2 + 15; this.detailSenderTxt.y = 18;
        this.detailSenderTxt.anchor.set(0.5, 0);
        this.detailContainer.addChild(this.detailSenderTxt);

        this.detailBodyTxt = new Text({
            text: "",
            style: { fill: '#cccccc', fontSize: 12, wordWrap: true, wordWrapWidth: this.phoneWidth - 30 }
        });
        this.detailBodyTxt.x = 15; this.detailBodyTxt.y = 50;
        this.detailContainer.addChild(this.detailBodyTxt);

        // --- ЭКРАН ПОГОДЫ ---
        this.weatherContainer = new Container();
        this.weatherContainer.visible = false;
        this.addChild(this.weatherContainer);
        this.initWeatherScreen();

        // КНОПКА HOME И ТАБЫ
        this.initTabs();
        this.homeBtn = new Graphics().circle(this.phoneWidth/2, this.phoneHeight-25, 12).fill(0x333333);
        this.homeBtn.eventMode = 'static';
        this.homeBtn.cursor = 'pointer';
        this.homeBtn.on('pointerdown', () => this.handleHomeClick());
        this.addChild(this.homeBtn);

        // СКРОЛЛ МЫШЬЮ
        this.eventMode = 'static';
        this.on('wheel', (e) => {
            if (!this.isOpen || this.currentOpenedMessage || this.weatherContainer.visible) return;
            const scrollSpeed = 20;
            this.msgList.y -= e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
            const minBtn = 45;
            const maxScroll = Math.min(45, (this.phoneHeight - 120) - this.msgList.height);
            if (this.msgList.y > minBtn) this.msgList.y = minBtn;
            if (this.msgList.y < maxScroll) this.msgList.y = maxScroll;
        });

        this.visible = false;
        this.resize();
    }

    initWeatherScreen() {
        const bg = new Graphics().roundRect(8, 35, this.phoneWidth - 16, this.phoneHeight - 80, 12).fill(0x0a0a0a);
        this.weatherContainer.addChild(bg);

        const title = new Text({ text: "PROBABILITY REPORT", style: { fill: '#00aaff', fontSize: 14, fontWeight: '900' } });
        title.x = this.phoneWidth / 2; title.y = 18; title.anchor.set(0.5, 0);
        this.weatherContainer.addChild(title);

        this.todayTxt = new Text({ text: "", style: { fill: '#ffffff', fontSize: 16 } });
        this.todayTxt.x = 20; this.todayTxt.y = 60;
        this.weatherContainer.addChild(this.todayTxt);

        this.tomorrowTxt = new Text({ text: "", style: { fill: '#00aaff', fontSize: 18, fontWeight: 'bold' } });
        this.tomorrowTxt.x = 20; this.tomorrowTxt.y = 140;
        this.weatherContainer.addChild(this.tomorrowTxt);
    }

    initTabs() {
        const tabY = this.phoneHeight - 65;
        const tabBarHeight = 45;

        this.tabBarBg = new Graphics()
            .rect(8, tabY-20, this.phoneWidth - 16, tabBarHeight)
            .fill(0x1a1a1a)
            .stroke({ color: 0x333333, width: 2, alignment: 0 });

        this.addChild(this.tabBarBg);

        this.msgTab = new Text({ text: "💬", style: { fontSize: 20 } });
        this.msgTab.x = 60;
        this.msgTab.y = tabY;
        this.msgTab.eventMode = 'static';
        this.msgTab.cursor = 'pointer';
        this.msgTab.on('pointerdown', () => this.switchTab('messages'));

        this.weatherTab = new Text({ text: "🎰", style: { fontSize: 20 } }); // Заменили иконку облака на казино
        this.weatherTab.x = 140;
        this.weatherTab.y = tabY;
        this.weatherTab.eventMode = 'static';
        this.weatherTab.cursor = 'pointer';
        this.weatherTab.on('pointerdown', () => this.switchTab('weather'));

        this.addChild(this.msgTab, this.weatherTab);
    }

    switchTab(tab) {
        this.currentOpenedMessage = null;
        if (tab === 'messages') {
            this.listContainer.visible = true;
            this.weatherContainer.visible = false;
            this.detailContainer.visible = false;
            this.renderMessages();
        } else {
            this.listContainer.visible = false;
            this.weatherContainer.visible = true;
            this.detailContainer.visible = false;
            this.updateWeatherUI();
        }
    }

    updateWeatherUI() {
        if (!this.timeSystem) return;
        const forecast = this.timeSystem.getWeatherForecast();

        this.todayTxt.text = `Current Cycle:\n${forecast.todayTemp}°C ${forecast.todayIcon}`;
        this.tomorrowTxt.text = `Next Cycle:\n${forecast.tomorrowTemp}°C ${forecast.tomorrowIcon}`;
        this.tomorrowTxt.style.fill = forecast.tomorrowIsRainy ? '#44aaff' : '#ffd700'; // Золотой цвет для солнечной погоды (Jackpot)
    }

    addIncomingMessage(sender, text) {
        const msg = { id: Date.now(), sender, text, isRead: false };
        this.messages.unshift(msg);
        if (this.isOpen && this.listContainer.visible) this.renderMessages();
        if (!this.isOpen && this.debugConsole) this.debugConsole.addMessage(`ТЕРМИНАЛ: Новое СМС!`, "#00aaff"); // Тематический текст
    }

    renderMessages() {
        this.msgList.removeChildren();
        this.messages.forEach((msg, i) => {
            const card = new Container();
            card.y = i * 75;
            card.eventMode = 'static';
            card.cursor = 'pointer';
            card.on('pointerdown', () => this.openMessageDetail(msg.id));

            const bg = new Graphics().roundRect(0, 0, 196, 65, 8).fill(msg.isRead ? 0x111111 : 0x1e2a35);
            card.addChild(bg);

            const senderTxt = new Text({ text: msg.sender, style: { fill: '#00aaff', fontSize: 12, fontWeight: 'bold' } });
            senderTxt.x = 8; senderTxt.y = 6;
            card.addChild(senderTxt);

            const preview = msg.text.length > 25 ? msg.text.substring(0, 25) + "..." : msg.text;
            const bodyTxt = new Text({ text: preview, style: { fill: '#cccccc', fontSize: 11 } });
            bodyTxt.x = 8; bodyTxt.y = 24;
            card.addChild(bodyTxt);

            this.msgList.addChild(card);
        });
    }

    openMessageDetail(messageId) {
        const msg = this.messages.find(m => m.id === messageId);
        if (!msg) return;
        msg.isRead = true;
        this.currentOpenedMessage = msg;
        this.detailSenderTxt.text = msg.sender;
        this.detailBodyTxt.text = msg.text;
        this.listContainer.visible = false;
        this.detailContainer.visible = true;
    }

    closeMessageDetail() {
        this.currentOpenedMessage = null;
        this.detailContainer.visible = false;
        this.listContainer.visible = true;
        this.renderMessages();
    }

    handleHomeClick() {
        if (this.currentOpenedMessage) this.closeMessageDetail();
        else this.toggle();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.visible = this.isOpen;
        if (this.isOpen) {
            this.switchTab('messages');
        }
    }

    resize() {
        this.x = window.innerWidth - 270;
        this.y = 100;
    }
}