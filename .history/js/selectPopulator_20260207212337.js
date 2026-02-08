// Примечание: mockTeachers и mockClassrooms импортируются и используются в main.js
// Здесь только функция populateSelect
export function populateSelect(selectId, data) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    // Очищаем текущие опции, кроме первой (placeholder)
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        selectElement.appendChild(option);
    });
}
