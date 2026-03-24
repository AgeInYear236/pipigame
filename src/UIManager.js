import { Text, TextStyle, Container } from 'pixi.js';

export class UIManager {
    static style = new TextStyle({
        fill: '#ffd700',
        fontSize: 28,
        fontWeight: 'bold',
        stroke: { color: '#000000', width: 4 },
        dropShadow: { alpha: 0.5, blur: 4, distance: 2 }
    });

    // Метод для создания всплывающего текста монет
    static spawnPopUp(amount, x, y, parent) {
        const popUp = new Text({
            text: `+${amount} 🪙`,
            style: this.style
        });

        popUp.anchor.set(0.5);
        popUp.x = x;
        popUp.y = y;
        parent.addChild(popUp);

        // Анимация: летим вверх и исчезаем
        let elapsed = 0;
        const animate = (time) => {
            const dt = time.deltaTime;
            elapsed += dt;

            popUp.y -= 1.5 * dt; // Скорость полета вверх
            popUp.alpha -= 0.02 * dt; // Скорость исчезновения

            if (popUp.alpha <= 0) {
                parent.removeChild(popUp);
                app.ticker.remove(animate);
                popUp.destroy();
            }
        };

        // Мы передаем app.ticker глобально или через импорт,
        // но проще добавить в существующий ticker в main.js через массив
        return animate;
    }

    // Метод для обновления текста над инвентарем
    static updateItemLabel(labelObj, itemName) {
        if (!itemName) {
            labelObj.text = "";
            return;
        }
        labelObj.text = `${itemName}`;
    }
}