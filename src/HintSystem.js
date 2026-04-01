import { Container, Graphics, Text } from 'pixi.js';

export class HintSystem extends Container {
    constructor() {
        super();
        this.visible = false;

        // Фон подсказки
        this.bg = new Graphics()
            .roundRect(0, 0, 250, 120, 10)
            .fill({ color: 0x000000, alpha: 0.9 }) // Чуть прозрачнее
            .stroke({ color: 0x00aaff, width: 2 });

        this.title = new Text({
            text: "",
            style: { fill: '#00aaff', fontSize: 18, fontWeight: 'bold' }
        });
        this.title.x = 15; this.title.y = 15;

        this.description = new Text({
            text: "",
            style: { fill: '#ffffff', fontSize: 14, wordWrap: true, wordWrapWidth: 220 }
        });
        this.description.x = 15; this.description.y = 45;

        this.addChild(this.bg, this.title, this.description);

        // Центрируем по экрану (можно менять)
        this.x = 20;
        this.y = window.innerHeight - 140;
    }

    show(item) {
        if (!item) return;

        this.title.text = item.name.toUpperCase();

        // Динамическое описание на основе типа предмета
        let desc = "";
        if (item.toolType === 'can') {
            desc = `Лейка. Используется для полива. Осталось использований: ${item.count}`;
        } else if (item.toolType === 'hoe') {
            desc = `Тяпка. Девайс для активации секторов. Без подготовки стола ставка не будет принята. Осталось использований: ${item.count}`;
        } else if (item.type === 'fertilizer') {
            desc = `Удобрение. Увеличивает доход с грядки на 50%.`;
        } else if (item.type === 'blue') {
            desc = `Редкий сорт Indigo Pulse. Дает огромный бонус x50 в казино!`;
        } else if (item.type === 'red') {
            desc = `Абсолютно обычные семена томатов. Абсолтно томатная прибыль`;
        } else if (item.type === 'green') {
            desc = `Абсолютно обычные семена арбуза. Абсолютно арбузная прибыль.`;
        } else if (item.toolType === 'bucket') {
            desc = `Ведро. Используется для полива, можно набрать в Колодце!`;
        }

        this.description.text = desc;
        this.visible = true;

        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => { this.visible = false; }, 2000);
    }
}