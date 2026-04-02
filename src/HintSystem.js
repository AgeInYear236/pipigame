import { Container, Graphics, Text } from 'pixi.js';

export class HintSystem extends Container {
    constructor() {
        super();
        this.visible = false;

        // Корпус модуля подсказок в стиле кибер-девайса
        this.bg = new Graphics()
            .roundRect(0, 0, 380, 130, 12)
            .fill({ color: 0x050505, alpha: 0.95 })
            .stroke({ color: 0x00aaff, width: 2, alpha: 0.8 });

        this.title = new Text({
            text: "",
            style: {
                fill: '#00ff00',
                fontSize: 16,
                fontWeight: '900',
                letterSpacing: 1,
                fontFamily: 'monospace'
            }
        });
        this.title.x = 15; this.title.y = 12;

        this.description = new Text({
            text: "",
            style: {
                fill: '#cccccc',
                fontSize: 12,
                wordWrap: true,
                wordWrapWidth: 230,
                lineHeight: 16,
                fontFamily: 'monospace'
            }
        });
        this.description.x = 15; this.description.y = 40;

        this.addChild(this.bg, this.title, this.description);

        // Позиционирование в нижнем левом углу над инвентарем
        this.x = 20;
        this.updatePosition();
    }

    updatePosition() {
        this.y = window.innerHeight - 150;
    }

    show(item) {
        if (!item) return;

        // Заголовок с префиксом анализа
        this.title.text = `ID: ${item.name.toUpperCase()}`;

        let desc = "";

        // Мапинг описаний под лор казино-фермы
        if (item.toolType === 'can') {
            desc = `[LIQUID LUCK DISPENSER]\nПортативный распылитель. Ускоряет цикл роста. Заряд: ${item.count} ед.`;
        } else if (item.toolType === 'hoe') {
            desc = `[SECTOR PREPARATOR]\nДевайс для активации слотов. Без подготовки почвы ставка не будет принята. Ресурс: ${item.count} ед.`;
        } else if (item.type === 'fertilizer') {
            desc = `[RTP BOOSTER +50%]\nВзламывает алгоритм плитки. Увеличивает финальный занос на 50%. Одноразовый инжектор.`;
        } else if (item.type === 'blue') {
            desc = `[INDIGO PULSE]\nКвантовый сорт. Множитель джекпота: x50. Внимание: Высокая волатильность!`;
        } else if (item.type === 'red') {
            desc = `[ROULETTE-CHERRY]\nКлассический слот. Высокие ставки, агрессивный рост. Прибыль: 10 CR.`;
        } else if (item.type === 'green') {
            desc = `[SLOT-LIME]\nНизкая волатильность. Стабильные выплаты для новичков. Прибыль: 3 CR.`;
        } else if (item.toolType === 'bucket') {
            desc = `[FLUID CONTAINER]\nЕмкость для переноса Liquid Luck. Можно перезаправить на Deep-Fluid сервере.`;
        }

        this.description.text = desc;
        this.visible = true;

        // Авто-скрытие после анализа
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => { this.visible = false; }, 3000);
    }
}