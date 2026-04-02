import { Text, TextStyle } from 'pixi.js';

export class UIManager {
    static style = new TextStyle({
        fill: '#ffd700',
        fontSize: 28,
        fontWeight: 'bold',
        stroke: { color: '#000000', width: 4 },
        dropShadow: { alpha: 0.5, blur: 4, distance: 2 }
    });

    static spawnPopUp(amount, x, y, parent, ticker) {
        const popUp = new Text({
            text: `+${amount} 🪙`,
            style: this.style
        });

        popUp.anchor.set(0.5);
        popUp.x = x;
        popUp.y = y;
        parent.addChild(popUp);

        const animate = (time) => {
            const dt = time.deltaTime;
            popUp.y -= 2 * dt;
            popUp.alpha -= 0.015 * dt;

            if (popUp.alpha <= 0) {
                ticker.remove(animate);
                if (popUp.parent) popUp.parent.removeChild(popUp);
                popUp.destroy();
            }
        };

        ticker.add(animate);
    }

    static updateItemLabel(labelObj, itemName) {
        labelObj.text = itemName || "Пусто";
    }
}