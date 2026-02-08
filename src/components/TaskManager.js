import React, { useState } from 'react';
import Card from '../models/Card'; // Предполагаем, что Card.js находится в ../models

function TaskManager() {
    const [cards, setCards] = useState([]);
    const [nextCardId, setNextCardId] = useState(1);

    // Функция для симуляции добавления карточки из буфера
    const addCardFromBuffer = (bufferContent) => {
        const newCard = Card.createTaskCard(nextCardId, bufferContent);
        const newBreak = Card.createBreakCard(nextCardId + 1);

        setCards((prevCards) => [...prevCards, newCard, newBreak]);
        setNextCardId((prevId) => prevId + 2); // Увеличиваем ID на 2, так как добавили 2 карточки
    };

    // Функция для добавления обычной карточки (если нужно)
    const addRegularCard = (content) => {
        const newCard = Card.createTaskCard(nextCardId, content);
        setCards((prevCards) => [...prevCards, newCard]);
        setNextCardId((prevId) => prevId + 1);
    };

    return (
        <div>
            <h1>Менеджер Задач</h1>
            <button onClick={() => addCardFromBuffer(`Задача из буфера ${nextCardId}`)}>
                Добавить карточку из буфера
            </button>
            <button onClick={() => addRegularCard(`Обычная задача ${nextCardId}`)}>
                Добавить обычную карточку
            </button>

            <h2>Список Карточек:</h2>
            <ul>
                {cards.map((card) => (
                    <li key={card.id} style={{
                        backgroundColor: card.type === 'break' ? '#ffe0b2' : '#e0f2f7',
                        margin: '5px 0',
                        padding: '8px',
                        borderRadius: '4px'
                    }}>
                        {card.id}. {card.content} ({card.type === 'break' ? 'Перерыв' : 'Задача'})
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TaskManager;
