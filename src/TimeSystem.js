// TimeSystem.js
export class TimeSystem {
    constructor() {
        this.hour = 6;
        this.minute = 0;
        this.day = 1;
        this.gameTimeScale = 2;
        this.timer = 0;

        // Вероятность запуска протокола "Осадки"
        this.rainChance = 0.17;

        // Инициализируем системный статус при загрузке
        this.isRaining = Math.random() < this.rainChance;
        this.nextDayIsRaining = Math.random() < this.rainChance;

        // Температурный режим (CPU Load)
        this.currentTemp = this.generateTemp(this.isRaining);
        this.nextDayTemp = this.generateTemp(this.nextDayIsRaining);
    }

    generateTemp(isRainy) {
        if (isRainy) {
            return Math.floor(Math.random() * 5) + 14; // 14-18°C - Охлаждение активно
        } else {
            return Math.floor(Math.random() * 8) + 20; // 20-27°C - Стандартная нагрузка
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

            // Завершение фазы "Liquid Luck Rain"
            if (this.isRaining && this.hour >= 18) {
                this.isRaining = false;
                if (debugConsole) debugConsole.addMessage("Протокол 'Осадки' завершен", "#00ffff", "☀️");
            }
        }

        if (this.hour >= 24) {
            this.hour = 0;
            this.day++;
            this.handleNewDay(debugConsole);
        }
    }

    handleNewDay(debugConsole) {
        // 1. Обновление текущих системных параметров
        this.isRaining = this.nextDayIsRaining;
        this.currentTemp = this.nextDayTemp;

        // 2. Расчет следующего спина вероятностей
        this.nextDayIsRaining = Math.random() < this.rainChance;
        this.nextDayTemp = this.generateTemp(this.nextDayIsRaining);

        if (debugConsole) {
            debugConsole.addMessage(`--- ЦИКЛ ${this.day} АКТИВИРОВАН ---`, "#ffffff", "📅");
            if (this.isRaining) {
                debugConsole.addMessage("БОНУС: Авто-гидратация секторов!", "#00aaff", "🌧️");
            } else {
                debugConsole.addMessage("Режим: Стандартные вероятности", "#ffcc00", "☀️");
            }
        }
        return this.day >= 2;
    }

    getTimeString() {
        // Выглядит как системное время терминала
        return `${this.hour.toString().padStart(2, '0')}:${this.minute.toString().padStart(2, '0')}`;
    }

    // Данные для Phone UI (Probability Report)
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
            intensity += 0.2; // Затемнение при дожде
        }

        return {
            alpha: Math.min(intensity * 0.7, 0.8),
            // Цвета стали холоднее и технологичнее
            color: this.isRaining ? 0x1a2639 : 0x0a0a20
        };
    }
}