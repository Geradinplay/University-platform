// Этот файл определяет структуру для Task (задачи) и Break (перерыва).
// В реальном приложении это может быть класс или интерфейс.

class Card {
    constructor(id, content, type = 'task') {
        this.id = id;
        this.content = content;
        this.type = type; // 'task' или 'break'
    }

    static createBreakCard(id) {
        return new Card(id, 'Перерыв', 'break');
    }

    static createTaskCard(id, content) {
        return new Card(id, content, 'task');
    }
}

export default Card;
