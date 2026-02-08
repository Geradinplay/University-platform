let draggedElement = null;

export function allowDrop(ev) {
  ev.preventDefault();
}

export function drag(ev) {
  draggedElement = this;
  ev.dataTransfer.effectAllowed = "move";
}

export function drop(ev) {
  ev.preventDefault();
  
  if (draggedElement && draggedElement !== this) {
    const scheduleContainer = document.getElementById("schedule");
    const allLessons = Array.from(scheduleContainer.children);
    
    const draggedIndex = allLessons.indexOf(draggedElement);
    const targetIndex = allLessons.indexOf(this);
    
    if (draggedIndex < targetIndex) {
      this.parentNode.insertBefore(draggedElement, this.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedElement, this);
    }
  }
  
  draggedElement = null;
  return false;
}
