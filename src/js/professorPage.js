import { getSchedules, getLessonsByScheduleId } from '../../api/api.js';
import { getSubjects, getClassrooms, createLesson } from '../../api/api.js';
import { getFaculties } from '../../api/api.js';

function parseTimeToMinutes(t) { const [h,m] = String(t).split(':').map(Number); return h*60+m; }
function overlaps(aStart, aEnd, bStart, bEnd) { return !(aEnd <= bStart || aStart >= bEnd); }

async function populateProfessorForm() {
  try {
    const typeSelect = document.getElementById('prof-exam-select');
    const isExamFilter = typeSelect ? (typeSelect.value === 'true') : false;
    const facultySel = document.getElementById('prof-faculty-select');
    const scheduleSel = document.getElementById('prof-schedule-select');
    const subjectSel = document.getElementById('prof-subject-select');
    const classroomSel = document.getElementById('prof-classroom-select');
    if (!scheduleSel || !subjectSel || !classroomSel || !facultySel) return;

    // Факультеты
    const faculties = await getFaculties?.();
    facultySel.innerHTML = '<option value="">-- Выберите факультет --</option>';
    (faculties || []).forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      facultySel.appendChild(opt);
    });
    // Восстановим выбор, если был сохранён
    const savedFaculty = localStorage.getItem('profFacultyId');
    if (savedFaculty) facultySel.value = savedFaculty;

    // Расписания по типу и факультету — только если факультет выбран
    scheduleSel.innerHTML = '<option value="">-- Выберите расписание --</option>';
    if (facultySel.value) {
      const schedules = await getSchedules();
      const filtered = (schedules || []).filter(s => Boolean(s.isExam) === isExamFilter && String(s.facultyId) === String(facultySel.value));
      filtered.forEach(s => { const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; scheduleSel.appendChild(opt); });
    }

    // Предметы
    const subjects = await getSubjects();
    subjectSel.innerHTML = '<option value="">-- Выберите предмет --</option>';
    (subjects || []).forEach(sub => { const opt = document.createElement('option'); opt.value = sub.id; opt.textContent = sub.name; subjectSel.appendChild(opt); });

    // Аудитории
    const rooms = await getClassrooms();
    classroomSel.innerHTML = '<option value="">-- Выберите аудиторию --</option>';
    (rooms || []).forEach(r => { const opt = document.createElement('option'); opt.value = r.id; opt.textContent = r.number; classroomSel.appendChild(opt); });

    // Обработчик смены факультета
    if (!facultySel._bound) {
      facultySel.addEventListener('change', async () => {
        localStorage.setItem('profFacultyId', facultySel.value || '');
        scheduleSel.innerHTML = '<option value="">-- Выберите расписание --</option>';
        if (facultySel.value) {
          const schedules2 = await getSchedules();
          const filtered2 = (schedules2 || []).filter(s => Boolean(document.getElementById('prof-exam-select')?.value === 'true') === Boolean(s.isExam) && String(s.facultyId) === String(facultySel.value));
          filtered2.forEach(s => { const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; scheduleSel.appendChild(opt); });
        }
      });
      facultySel._bound = true;
    }
  } catch (e) { console.warn('populateProfessorForm() error', e); }
}

function getDayName(day) {
  const map = {1:'Понедельник',2:'Вторник',3:'Среда',4:'Четверг',5:'Пятница'};
  return map[day] || String(day);
}

function setProfView(view) {
  localStorage.setItem('professorView', view);
  const btnSchedule = document.getElementById('prof-view-schedule-btn');
  const btnRooms = document.getElementById('prof-view-rooms-btn');
  if (btnSchedule && btnRooms) {
    btnSchedule.classList.toggle('active', view === 'schedule');
    btnRooms.classList.toggle('active', view === 'rooms');
  }
}

async function renderCurrentView() {
  const view = localStorage.getItem('professorView') || 'schedule';
  await loadProfessorWeeklySchedule(view);
}

async function renderProfessorRoomsWeekly(byDay) {
  const grid = document.getElementById('schedule-grid');
  if (!grid) return;
  const title = document.createElement('div');
  title.style.margin = '16px 0 8px';
  title.style.color = '#334e68';
  title.style.fontWeight = '600';
  title.textContent = 'Занятые аудитории (по всем расписаниям)';
  grid.appendChild(title);

  // Собираем список всех комнат, встречающихся в данных
  const roomSet = new Set();
  for (let d = 1; d <= 5; d++) {
    (byDay.get(d) || []).forEach(it => {
      if (it.room) roomSet.add(String(it.room));
    });
  }
  const rooms = Array.from(roomSet);
  // Сортируем комнаты по номеру (числовая сортировка, если возможно)
  rooms.sort((a,b) => {
    const na = Number(a); const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'ru', { numeric: true });
  });

  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  const table = document.createElement('table');

  // Заголовок: первый столбец «Аудитория», далее дни
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const thRoom = document.createElement('th'); thRoom.textContent = 'Аудитория'; headRow.appendChild(thRoom);
  [1,2,3,4,5].forEach(d => { const th = document.createElement('th'); th.textContent = getDayName(d); headRow.appendChild(th); });
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');

  const softRedStyle = 'background:#ffe9e9; border-left:4px solid #dc3545; padding:6px 8px; border-radius:6px; margin-bottom:6px;';

  if (rooms.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 6; td.style.textAlign = 'center'; td.style.color = '#6a829a';
    td.textContent = 'Нет данных по занятым аудиториям'; tr.appendChild(td); tbody.appendChild(tr);
  } else {
    rooms.forEach(roomNum => {
      const tr = document.createElement('tr');
      const tdRoom = document.createElement('td'); tdRoom.style.fontWeight = '600'; tdRoom.textContent = `Каб. ${roomNum}`; tr.appendChild(tdRoom);
      for (let d = 1; d <= 5; d++) {
        const td = document.createElement('td'); td.style.verticalAlign = 'top'; td.style.padding = '8px';
        const items = (byDay.get(d) || []).filter(it => String(it.room) === String(roomNum));
        if (items.length === 0) {
          td.innerHTML = '<div style="color:#9aa9b5; font-size:12px;">Свободно</div>';
        } else {
          // Сортируем по времени внутри ячейки
          const parseMin = (t) => { const [h,m] = String(t).split(':').map(Number); return h*60+m; };
          items.sort((a,b) => parseMin(a.start) - parseMin(b.start));
          items.forEach(it => {
            const div = document.createElement('div');
            div.className = 'occupancy-item';
            div.style.cssText = softRedStyle;
            const profLabel = it.prof ? `<span class=\"prof\">${it.prof}</span>` : '';
            div.innerHTML = `<div class=\"time\"><strong>${it.start}-${it.end}</strong></div>
                             <div class=\"meta\">${it.subject || ''}${profLabel ? `, ${profLabel}` : ''}</div>`;
            td.appendChild(div);
          });
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  grid.appendChild(tableContainer);
}

async function loadProfessorWeeklySchedule(view = 'schedule') {
  try {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) { console.warn('Нет userId в localStorage'); return; }
    const typeSelect = document.getElementById('prof-exam-select');
    const isExamFilter = typeSelect ? (typeSelect.value === 'true') : false;
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Загружаем справочник факультетов для названий
    let facultyMap = new Map();
    try {
      const faculties = await getFaculties?.();
      (faculties || []).forEach(f => facultyMap.set(String(f.id), f.name));
    } catch (e) { /* опционально */ }

    const allSchedules = await getSchedules();
    const schedules = (allSchedules || []).filter(s => Boolean(s.isExam) === isExamFilter);

    // Данные для таблицы преподавателя
    const lessonsByDayForProfessor = new Map(); for (let d = 1; d <= 5; d++) lessonsByDayForProfessor.set(d, []);
    // Данные для таблицы занятых аудиторий (все занятия)
    const roomsByDay = new Map(); for (let d = 1; d <= 5; d++) roomsByDay.set(d, []);

    for (const sch of schedules) {
      try {
        const schLessons = await getLessonsByScheduleId(sch.id);
        for (const l of schLessons) {
          const professorObj = l.user || l.professor;
          const day = Number(l.day); if (day < 1 || day > 5) continue;
          const semesterName = sch.semesterName || sch.semester || sch.term || '-';
          const semesterNum = sch.semesterNumber ?? sch.semesterIndex ?? (isNaN(Number(sch.semester)) ? undefined : Number(sch.semester));
          const entryCommon = {
            start: l.startTime,
            end: l.endTime,
            subject: l.subject?.name || '',
            room: l.classroom?.number || '',
            scheduleName: sch.name,
            facultyName: facultyMap.get(String(sch.facultyId)) || sch.faculty?.name || '-',
            semesterName: semesterName,
            semesterNum: semesterNum ?? '-',
            isExam: Boolean(sch.isExam),
            prof: professorObj?.name || professorObj?.username || '',
          };
          if (professorObj && String(professorObj.id) === String(userId)) {
            lessonsByDayForProfessor.get(day).push(entryCommon);
          }
          roomsByDay.get(day).push(entryCommon);
        }
      } catch (e) { /* игнор */ }
    }

    const parseMin = (t) => { const [h,m] = String(t).split(':').map(Number); return h*60+m; };
    for (let d = 1; d <= 5; d++) {
      lessonsByDayForProfessor.get(d).sort((a,b) => parseMin(a.start) - parseMin(b.start));
      roomsByDay.get(d).sort((a,b) => parseMin(a.start) - parseMin(b.start));
    }

    if (view === 'schedule') {
      // Рендер таблицы недели (пары преподавателя)
      const tableContainer = document.createElement('div'); tableContainer.className = 'table-container';
      const table = document.createElement('table');
      const thead = document.createElement('thead'); const headRow = document.createElement('tr');
      [1,2,3,4,5].forEach(d => { const th = document.createElement('th'); th.textContent = getDayName(d); headRow.appendChild(th); });
      thead.appendChild(headRow);
      const tbody = document.createElement('tbody'); const bodyRow = document.createElement('tr');
      for (let d = 1; d <= 5; d++) {
        const td = document.createElement('td'); td.style.verticalAlign = 'top'; td.style.padding = '8px';
        const items = lessonsByDayForProfessor.get(d);
        if (items.length === 0) {
          td.innerHTML = '<div style="color:#9aa9b5; font-size:12px;">Нет занятий</div>';
        } else {
          items.forEach(l => {
            const div = document.createElement('div'); div.className = 'occupancy-item lesson-card'; div.style.marginBottom = '8px';
            const roomLabel = l.room ? `, каб. ${l.room}` : '';
            const extra = !l.isExam
              ? `<div class=\"meta meta-extra\">${l.facultyName}</div>
                 <div class=\"meta meta-extra\">${l.semesterName}</div>
                 <div class=\"meta meta-extra\">семестр ${l.semesterNum}</div>`
              : `<div class=\"meta meta-extra\">${l.scheduleName}</div>`;
            div.innerHTML = `<div class=\"time\"><strong>${l.start}-${l.end}</strong></div>
                             <div class=\"meta meta-main\">${l.subject}${roomLabel}</div>
                             ${extra}`;
            td.appendChild(div);
          });
        }
        bodyRow.appendChild(td);
      }
      tbody.appendChild(bodyRow);
      table.appendChild(thead); table.appendChild(tbody); tableContainer.appendChild(table);
      const caption = document.createElement('div'); caption.style.margin = '8px 0'; caption.style.color = '#334e68'; caption.style.fontWeight = '600';
      caption.textContent = isExamFilter ? 'Экзамены' : 'Учебные занятия';
      grid.appendChild(caption); grid.appendChild(tableContainer);
    } else {
      // Рендер таблицы «занятые аудитории» (двумерная)
      await renderProfessorRoomsWeekly(roomsByDay);
    }
  } catch (e) {
    console.error('Ошибка загрузки недельного расписания профессора:', e);
  }
}

function showProfConflictModal(messages, onConfirm, onCancel) {
  const overlay = document.getElementById('prof-conflict-modal');
  const details = document.getElementById('prof-conflict-details');
  const btnOk = document.getElementById('prof-conflict-confirm');
  const btnCancel = document.getElementById('prof-conflict-cancel');
  if (!overlay || !details || !btnOk || !btnCancel) { alert(messages.join('\n')); return; }
  details.innerHTML = messages.map(m => `<div>${m}</div>`).join('');
  overlay.classList.add('active');
  const close = () => overlay.classList.remove('active');
  btnCancel.onclick = () => { close(); onCancel && onCancel(); };
  btnOk.onclick = () => { close(); onConfirm && onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) { close(); onCancel && onCancel(); } };
}

window.addProfessorLesson = async function() {
  try {
    const scheduleId = document.getElementById('prof-schedule-select').value;
    const day = Number(document.getElementById('prof-day-select').value);
    const subjectId = Number(document.getElementById('prof-subject-select').value);
    const classroomId = Number(document.getElementById('prof-classroom-select').value);
    const time = document.getElementById('prof-time-input').value.trim();
    const allowCollision = document.getElementById('prof-allow-collision').checked;
    const checkClassroom = document.getElementById('prof-check-classroom').checked;
    const checkProfessor = document.getElementById('prof-check-professor').checked;
    const userId = Number(localStorage.getItem('userId'));

    if (!scheduleId || !day || !subjectId || !classroomId || !time) {
      alert('Заполните все поля формы'); return;
    }
    const timeRegex = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
    if (!timeRegex.test(time)) { alert('Время должно быть в формате ЧЧ:ММ-ЧЧ:ММ'); return; }
    const [startStr, endStr] = time.split('-');
    const startMin = parseTimeToMinutes(startStr); const endMin = parseTimeToMinutes(endStr);
    if (endMin <= startMin) { alert('Конец должен быть позже начала'); return; }

    // Загружаем существующие занятия выбранного расписания
    const lessons = await getLessonsByScheduleId(scheduleId);
    const sameDayLessons = (lessons || []).filter(l => Number(l.day) === day);
    const messages = [];

    // Базовая проверка времени
    if (sameDayLessons.some(l => overlaps(startMin, endMin, parseTimeToMinutes(l.startTime), parseTimeToMinutes(l.endTime)))) {
      if (!allowCollision) {
        messages.push(`Пересечение по времени в ${getDayName(day)}.`);
      } else {
        messages.push(`Внимание: в ${getDayName(day)} есть пересечение по времени.`);
      }
    }

    // Проверка аудиторий
    if (checkClassroom) {
      sameDayLessons.forEach(l => {
        const hasTime = overlaps(startMin, endMin, parseTimeToMinutes(l.startTime), parseTimeToMinutes(l.endTime));
        const otherRoomId = String(l.classroom?.id || l.classroomId);
        if (hasTime && String(classroomId) === otherRoomId) {
          messages.push(`Кабинет ${l.classroom?.number || ''} уже занят (${l.startTime}-${l.endTime}).`);
        }
      });
    }

    // Проверка преподавателя
    if (checkProfessor) {
      sameDayLessons.forEach(l => {
        const hasTime = overlaps(startMin, endMin, parseTimeToMinutes(l.startTime), parseTimeToMinutes(l.endTime));
        const otherUserId = String(l.user?.id || l.professor?.id);
        if (hasTime && String(userId) === otherUserId) {
          messages.push(`Преподаватель уже имеет занятие (${l.startTime}-${l.endTime}).`);
        }
      });
    }

    if (messages.length > 0) {
      if (!allowCollision && (checkClassroom || checkProfessor)) {
        // Жесткая блокировка при выключенном разрешении пересечений
        showProfConflictModal(messages, null, () => {});
        return;
      } else {
        // Разрешение по подтверждению
        showProfConflictModal(messages, async () => {
          await createLesson({
            startTime: startStr,
            endTime: endStr,
            day,
            subjectId,
            userId,
            classroomId,
            scheduleId: Number(scheduleId)
          });
          await renderCurrentView();
          alert('Занятие добавлено (с пересечением по подтверждению)');
        }, () => {});
        return;
      }
    }

    // Без конфликтов — создаем сразу
    await createLesson({
      startTime: startStr,
      endTime: endStr,
      day,
      subjectId,
      userId,
      classroomId,
      scheduleId: Number(scheduleId)
    });
    await renderCurrentView();
    alert('Занятие добавлено');
  } catch (e) {
    console.error('Ошибка добавления занятия:', e);
    alert('Ошибка: ' + e.message);
  }
}

// Инициализация формы при старте и при смене типа расписания
document.addEventListener('DOMContentLoaded', () => {
  populateProfessorForm();
  const typeSelect = document.getElementById('prof-exam-select');
  if (typeSelect && !typeSelect._formBound) {
    typeSelect.addEventListener('change', populateProfessorForm);
    typeSelect._formBound = true;
  }
});

function getLessonTypeBadge() {
  const sel = document.getElementById('prof-exam-select');
  const badge = document.getElementById('lesson-type-badge');
  if (!sel || !badge) return;
  const isExam = sel.value === 'true';
  badge.textContent = isExam ? 'Экзамены' : 'Учебные';
  badge.classList.toggle('exam', isExam);
  badge.classList.toggle('study', !isExam);
}

function initFloatingLessonPanel() {
  const panel = document.getElementById('floating-lesson-panel');
  const handle = document.getElementById('floating-lesson-handle');
  const btnOpen = document.getElementById('open-floating-lesson');
  const btnClose = document.getElementById('floating-lesson-close');
  if (!panel || !handle || !btnOpen || !btnClose) return;

  const show = () => { panel.style.display = 'block'; populateProfessorForm(); getLessonTypeBadge(); };
  const hide = () => { panel.style.display = 'none'; };

  btnOpen.addEventListener('click', show);
  btnClose.addEventListener('click', hide);

  // Dragging
  let dragging = false; let startX = 0; let startY = 0; let origLeft = 0; let origTop = 0;
  const onMouseDown = (e) => {
    dragging = true;
    const rect = panel.getBoundingClientRect();
    startX = e.clientX; startY = e.clientY; origLeft = rect.left; origTop = rect.top;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX; const dy = e.clientY - startY;
    let newLeft = origLeft + dx; let newTop = origTop + dy;
    // Ограничения по окну
    const maxLeft = window.innerWidth - panel.offsetWidth - 8; const maxTop = window.innerHeight - panel.offsetHeight - 8;
    newLeft = Math.max(8, Math.min(maxLeft, newLeft));
    newTop = Math.max(8, Math.min(maxTop, newTop));
    panel.style.left = `${newLeft}px`; panel.style.top = `${newTop}px`;
    panel.style.right = 'auto'; // при перетаскивании используем left
  };
  const onMouseUp = () => {
    dragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  handle.addEventListener('mousedown', onMouseDown);
}

// Инициализация страницы
export function initProfessorPage() {
  const typeSelect = document.getElementById('prof-exam-select');
  const btnSchedule = document.getElementById('prof-view-schedule-btn');
  const btnRooms = document.getElementById('prof-view-rooms-btn');
  if (typeSelect && !typeSelect._bound) {
    typeSelect.addEventListener('change', () => { getLessonTypeBadge(); renderCurrentView(); });
    typeSelect._bound = true;
  }
  if (btnSchedule && !btnSchedule._bound) {
    btnSchedule.addEventListener('click', async () => { setProfView('schedule'); await renderCurrentView(); });
    btnSchedule._bound = true;
  }
  if (btnRooms && !btnRooms._bound) {
    btnRooms.addEventListener('click', async () => { setProfView('rooms'); await renderCurrentView(); });
    btnRooms._bound = true;
  }
  // Стартовое состояние
  if (!localStorage.getItem('professorView')) setProfView('schedule'); else setProfView(localStorage.getItem('professorView'));
  renderCurrentView();
  initFloatingLessonPanel();
  getLessonTypeBadge();
}

window.initProfessorPage = initProfessorPage;
