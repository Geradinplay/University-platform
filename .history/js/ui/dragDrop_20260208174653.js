let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragEnd(e) {
  draggedElement = null;
  this.classList.remove("dragging");
  document.querySelectorAll(".lesson").forEach(el => {
    el.classList.remove("drag-over");
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  
  if (this !== draggedElement) {
    this.classList.add("drag-over");
  }
  return false;
}

function handleDragLeave(e) {
  this.classList.remove("drag-over");
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
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
  
  this.classList.remove("drag-over");
  return false;
}

function attachDragListeners(element) {
  element.addEventListener("dragstart", handleDragStart);
  element.addEventListener("dragend", handleDragEnd);
  element.addEventListener("dragover", handleDragOver);
  element.addEventListener("drop", handleDrop);
  element.addEventListener("dragleave", handleDragLeave);
}
