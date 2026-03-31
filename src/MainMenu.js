import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class MainMenu extends Container {
    constructor(app, onStart) {
        super();
        this.app = app;
        this.onStart = onStart;
        this.time = 0; // Таймер для анимаций

        // 1. ФОН
        this.bg = new Graphics()
            .rect(0, 0, window.innerWidth, window.innerHeight)
            .fill(0x050505); // Глубокий черный
        this.addChild(this.bg);

        // 2. КОНТЕЙНЕР ЗАГОЛОВКА
        this.titleCont = new Container();
        this.addChild(this.titleCont);

        const baseStyle = {
            fontSize: 80,
            fontWeight: '900',
            fontFamily: 'Arial Black, Gadget, sans-serif',
            letterSpacing: 4
        };

        // Буквы FA
        this.textFA = new Text({
            text: "FA",
            style: { ...baseStyle, fill: '#ffffff', dropShadow: { color: '#00aaff', blur: 15, distance: 0 } }
        });
        this.textFA.anchor.set(0.5);

        // Счастливые [777]
        // Счастливые [777]
        // Счастливые [777] для PixiJS v8
        this.text777 = new Text({
            text: "[777]",
            style: {
                fontSize: 90,
                fontWeight: '900',
                fontFamily: 'Arial Black, Gadget, sans-serif',
                fill: { color: '#ffe700'},
                stroke: { color: '#664400', width: 2 },
                // Настройка градиента (теперь это объект)
                fillGradientType: 0, // 0 - вертикальный (сверху вниз)
                dropShadow: {
                    alpha: 1,
                    color: '#ffcc00',
                    blur: 20,
                    distance: 0
                }
            }
        });

// Если ошибка сохраняется, значит версия PixiJS требует передачи массива в свойство fill:
// fill: ['#ffe700', '#ffaa00'],
        this.text777.anchor.set(0.5);

        // Буквы RM
        this.textRM = new Text({
            text: "RM",
            style: { ...baseStyle, fill: '#ffffff', dropShadow: { color: '#00aaff', blur: 15, distance: 0 } }
        });
        this.textRM.anchor.set(0.5);

        // Позиционирование внутри контейнера
        this.textFA.x = -160;
        this.text777.x = 0;
        this.textRM.x = 160;

        this.titleCont.addChild(this.textFA, this.text777, this.textRM);
        this.titleCont.x = window.innerWidth / 2;
        this.titleCont.y = window.innerHeight / 3;

        // 3. КНОПКА START
        this.btn = new Container();
        this.btn.x = window.innerWidth / 2;
        this.btn.y = window.innerHeight * 0.65;
        this.addChild(this.btn);

        // Графика кнопки (Золотая обводка)
        this.btnBg = new Graphics();
        this.drawButton(0x1a1a1a, 0xffd700); // Изначально: темный фон, золотая обводка

        this.btnText = new Text({
            text: "ENTER THE FARM",
            style: { fill: '#ffd700', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 }
        });
        this.btnText.anchor.set(0.5);

        this.btn.addChild(this.btnBg, this.btnText);
        this.btn.eventMode = 'static';
        this.btn.cursor = 'pointer';

        // Эффекты наведения
        this.btn.on('pointerover', () => {
            this.drawButton(0xffd700, 0xffffff); // Золотой фон, белая обводка
            this.btnText.style.fill = '#000000';
        });

        this.btn.on('pointerout', () => {
            this.drawButton(0x1a1a1a, 0xffd700);
            this.btnText.style.fill = '#ffd700';
        });

        this.btn.on('pointerdown', () => {
            if (this.onStart) this.onStart();
            this.destroy();
        });
    }

    drawButton(bgColor, strokeColor) {
        this.btnBg.clear()
            .roundRect(-130, -35, 260, 70, 10)
            .fill(bgColor)
            .stroke({ color: strokeColor, width: 3 });
    }

    update(dt) {
        this.time += 0.05 * dt;

        // Анимация FA и RM (плавание)
        this.textFA.y = Math.sin(this.time) * 8;
        this.textRM.y = Math.cos(this.time) * 8;

        // Анимация [777] (Центральный элемент)
        this.text777.y = Math.sin(this.time * 1.5) * 12;

        // Пульсация золота (размер и прозрачность)
        const pulse = 1 + Math.sin(this.time * 2) * 0.05;
        this.text777.scale.set(pulse);
        this.text777.alpha = 0.9 + Math.sin(this.time * 3) * 0.1;

        // Легкое покачивание всего заголовка
        this.titleCont.rotation = Math.sin(this.time * 0.5) * 0.02;
    }
}