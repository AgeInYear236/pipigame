// TimeSystem.js
export class TimeSystem {
    constructor() {
        this.hour = 12;
        this.minute = 0;
        this.day = 1;
        this.gameTimeScale = 2;
        this.timer = 0;

        this.isRaining = false;
        this.rainChance = 0.17; // 30% вероятность дождя каждый новый день
    }

    update(dt, debugConsole) {
        this.timer += dt * this.gameTimeScale;

        if (this.timer >= 60) {
            this.minute++;
            this.timer = 0;
        }

        if (this.minute >= 60) {
            this.hour++;
            this.minute = 0;

            // Если идет дождь, он может закончиться через несколько часов (например, в 18:00)
            if (this.isRaining && this.hour >= 18) {
                this.isRaining = false;
                if (debugConsole) debugConsole.addMessage("Дождь закончился", "#00ffff", "☀️");
            }
        }

        if (this.hour >= 24) {
            this.hour = 0;
            this.day++;
            this.checkForRain(debugConsole);
        }
    }

    checkForRain(debugConsole) {
        // Проверка на дождь в начале каждого дня
        this.isRaining = Math.random() < this.rainChance;

        if (debugConsole) {
            debugConsole.addMessage(`--- ДЕНЬ ${this.day} ---`, "#ffffff", "📅");
            if (this.isRaining) {
                debugConsole.addMessage("Сегодня обещают дождь!", "#00aaff", "🌧️");
            }
        }
    }

    getTimeString() {
        return `${this.hour.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}`;
    }

    getNightIntensity() {
        const totalMinutes = this.hour * 60 + this.minute;
        const diffFromNoon = Math.abs(totalMinutes - 720);
        let intensity = diffFromNoon / 720;

        // Во время дождя днем делаем небо чуть мрачнее
        if (this.isRaining && (this.hour > 6 && this.hour < 18)) {
            intensity += 0.2;
        }

        return {
            alpha: Math.min(intensity * 0.7, 0.8),
            color: this.isRaining ? 0x2c3e50 : 0x1a1a40
        };
    }
}