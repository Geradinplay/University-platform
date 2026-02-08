// Примечание: mockTeachers и mockClassrooms импортируются и используются в main.js
// Здесь только функция populateSelect
export function populateSelect(selectId, data, displayProperty = 'name') { // Добавили displayProperty с дефолтом 'name'
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    // Очищаем текущие опции, кроме первой (placeholder)
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item[displayProperty]; // Используем динамическое имя свойства
        selectElement.appendChild(option);
    });
}
