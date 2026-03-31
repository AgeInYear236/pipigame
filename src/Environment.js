import { Container, Graphics, BlurFilter } from 'pixi.js';

export class Environment extends Container {
    constructor(app, timeSystem) {
        super();
        this.app = app;
        this.timeSystem = timeSystem;
        this.fireflies = [];
        this.count = 25; // Количество светлячков

        this.initFireflies();
    }

    initFireflies() {
        for (let i = 0; i < this.count; i++) {
            const container = new Container();

            // Основная яркая точка
            const core = new Graphics()
                .circle(0, 0, 2)
                .fill({ color: 0xadff2f, alpha: 1 });

            // Мягкое свечение вокруг (ореол)
            const glow = new Graphics()
                .circle(0, 0, 6)
                .fill({ color: 0xadff2f, alpha: 0.4 });

            // Добавляем блюр для мягкости
            glow.filters = [new BlurFilter(4)];

            container.addChild(glow, core);

            // Начальные случайные параметры
            const firefly = {
                view: container,
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                angle: Math.random() * Math.PI * 2,
                speed: 0.2 + Math.random() * 0.5,
                phase: Math.random() * 10, // Для мерцания
                freq: 0.02 + Math.random() * 0.05
            };

            container.x = firefly.x;
            container.y = firefly.y;
            container.alpha = 0; // Изначально невидимы

            container.blendMode = 'add';

            this.addChild(container);
            this.fireflies.push(firefly);

        }

    }

    update(dt) {
        const hour = this.timeSystem.hour;

        // Определяем целевую прозрачность (ночью 1, днем 0)
        // Светлячки появляются после 20:00 и исчезают после 05:00
        let targetAlpha = 0;
        if (hour >= 20 || hour < 4) {
            targetAlpha = 0.8;
        }

        this.fireflies.forEach(f => {
            // 1. Плавное появление/исчезновение в зависимости от времени
            f.view.alpha += (targetAlpha - f.view.alpha) * 0.01 * dt;

            if (f.view.alpha > 0.01) {
                // 2. Движение по плавной траектории (броуновское подобие)
                f.angle += (Math.random() - 0.5) * 0.1 * dt;
                f.x += Math.cos(f.angle) * f.speed * dt;
                f.y += Math.sin(f.angle) * f.speed * dt;

                // 3. Мерцание (пульсация яркости)
                f.phase += f.freq * dt;
                f.view.scale.set(1 + Math.sin(f.phase) * 0.3);

                // 4. Проверка границ экрана (чтобы не улетали насовсем)
                const padding = 50;
                if (f.x < -padding) f.x = window.innerWidth + padding;
                if (f.x > window.innerWidth + padding) f.x = -padding;
                if (f.y < -padding) f.y = window.innerHeight + padding;
                if (f.y > window.innerHeight + padding) f.y = -padding;

                f.view.x = f.x;
                f.view.y = f.y;
            }
        });
    }
}