export function populateSelect(selectId, data, displayProperty = 'name') {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    // Очищаем текущие опции, кроме первой (placeholder)
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    data.forEach(item => {
        const option = document.createElement('option');
        // Используем name как value, если нет id
        option.value = item.id !== undefined ? item.id : item.name;
        option.textContent = item[displayProperty];
        selectElement.appendChild(option);
    });
}
