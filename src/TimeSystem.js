// TimeSystem.js
export class TimeSystem {
    constructor() {
        this.hour = 12;
        this.minute = 0;
        this.day = 1;
        this.gameTimeScale = 2;
        this.timer = 0;

        // Шанс дождя
        this.rainChance = 0.17;

        // Инициализируем погоду при старте
        this.isRaining = Math.random() < this.rainChance;
        this.nextDayIsRaining = Math.random() < this.rainChance;

        // Инициализируем температуру
        this.currentTemp = this.generateTemp(this.isRaining);
        this.nextDayTemp = this.generateTemp(this.nextDayIsRaining);
    }

    // Вспомогательный метод для генерации температуры
    generateTemp(isRainy) {
        if (isRainy) {
            return Math.floor(Math.random() * 5) + 14; // 14-18°C
        } else {
            return Math.floor(Math.random() * 8) + 20; // 20-27°C
        }
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

            // Дождь заканчивается вечером
            if (this.isRaining && this.hour >= 18) {
                this.isRaining = false;
                if (debugConsole) debugConsole.addMessage("Дождь закончился", "#00ffff", "☀️");
            }
        }

        if (this.hour >= 24) {
            this.hour = 0;
            this.day++;
            this.handleNewDay(debugConsole);
        }
    }

    handleNewDay(debugConsole) {
        // 1. Погода "на завтра" становится текущей
        this.isRaining = this.nextDayIsRaining;
        this.currentTemp = this.nextDayTemp;

        // 2. Генерируем новый прогноз на следующее "завтра"
        this.nextDayIsRaining = Math.random() < this.rainChance;
        this.nextDayTemp = this.generateTemp(this.nextDayIsRaining);

        if (debugConsole) {
            debugConsole.addMessage(`--- ДЕНЬ ${this.day} ---`, "#ffffff", "📅");
            if (this.isRaining) {
                debugConsole.addMessage("Начался дождь!", "#00aaff", "🌧️");
            } else {
                debugConsole.addMessage("Сегодня солнечно", "#ffcc00", "☀️");
            }
        }
        return this.day >= 2;
    }

    getTimeString() {
        return `${this.hour.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}`;
    }

    // Данные для телефона
    getWeatherForecast() {
        return {
            todayIcon: this.isRaining ? '🌧️' : '☀️',
            todayTemp: this.currentTemp,
            tomorrowIcon: this.nextDayIsRaining ? '🌧️' : '☀️',
            tomorrowTemp: this.nextDayTemp,
            tomorrowIsRainy: this.nextDayIsRaining
        };
    }

    getNightIntensity() {
        const totalMinutes = this.hour * 60 + this.minute;
        const diffFromNoon = Math.abs(totalMinutes - 720);
        let intensity = diffFromNoon / 720;

        if (this.isRaining && (this.hour > 6 && this.hour < 18)) {
            intensity += 0.2;
        }

        return {
            alpha: Math.min(intensity * 0.7, 0.8),
            color: this.isRaining ? 0x2c3e50 : 0x1a1a40
        };
    }
}