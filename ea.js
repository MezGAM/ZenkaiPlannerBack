let currentDate = new Date();
let timeLeft;
let timerId = null;
let isPaused = true;
let totalTime;
let selectedDay = null;
let tasks = {};

function renderCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const calendarBody = document.getElementById('calendarBody');
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthDisplay.textContent = meses[month];

    const firstDay = new Date(year, month, 1).getDay();
    const startingDay = (firstDay === 0) ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarBody.innerHTML = '';
    let date = 1;

    for (let i = 0; i < 6; i++) {
        let row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            let cell = document.createElement('td');
            if (i === 0 && j < startingDay) {
                cell.innerHTML = '<div class="empty-dot"></div>';
            } else if (date > daysInMonth) {
                cell.innerHTML = '<div class="empty-dot"></div>';
            } else {
                const dayNumber = date;
                cell.innerHTML = `<span class="day-num">${dayNumber}</span>`;
                
                cell.onclick = () => {
                    selectedDay = `${year}-${month + 1}-${dayNumber}`;
                    showDayTasks(selectedDay);
                    document.querySelectorAll('td').forEach(td => td.style.background = "transparent");
                    cell.style.background = "rgba(255, 179, 0, 0.3)";
                    cell.style.borderRadius = "50%";
                };
                date++;
            }
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);
        if (date > daysInMonth) break;
    }
}

function openTaskModal() {
    if (!selectedDay) {
        alert("¡Selecciona primero un día en el calendario!");
        return;
    }
    document.getElementById("selectedDate").textContent = "Día seleccionado: " + selectedDay;
    document.getElementById("taskModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("taskModal").style.display = "none";
}

async function saveTask() {
    const title = document.getElementById("taskTitle").value;
    const time = document.getElementById("taskTime").value;
    const username = localStorage.getItem("usuarioLogueado");

    if (!title || !time || !selectedDay) return alert("Faltan datos");

    const response = await fetch('http://localhost:5000/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: username, 
            fecha: selectedDay, 
            titulo: title, 
            hora: time 
        })
    });

    if (response.ok) {
        document.getElementById("taskTitle").value = "";
        closeModal();
        showDayTasks(selectedDay);
    }
}

async function showDayTasks(date) {
    selectedDay = date;
    const username = localStorage.getItem("usuarioLogueado");
    const dayTasksContainer = document.getElementById("dayTasks");
    
    dayTasksContainer.innerHTML = `<h4>Tareas para: ${date}</h4>`;

    try {
        const response = await fetch(`http://localhost:5000/api/tareas/${username}`);
        const todasLasTareas = await response.json();
        const tareasDelDia = todasLasTareas.filter(t => t.fecha === date);

        if (tareasDelDia.length > 0) {
            tareasDelDia.forEach((t) => {
                const taskDiv = document.createElement("div");
                taskDiv.className = "day-task";
                taskDiv.innerHTML = `
                    <span><strong>${t.hora}</strong> - ${t.titulo}</span>
                    <button onclick="eliminarTareaBD(${t.id}, '${date}')">X</button>
                `;
                dayTasksContainer.appendChild(taskDiv);
            });
        } else {
            dayTasksContainer.innerHTML += "<p>No hay tareas registradas.</p>";
        }
    } catch (error) {
        console.error("Error cargando tareas:", error);
    }
}
async function toggleCheckTarea(id, checked, elementoInput) {
    const textoSpan = elementoInput.nextElementSibling;
    if (checked) {
        textoSpan.style.textDecoration = "line-through";
        textoSpan.style.opacity = "0.5";
    } else {
        textoSpan.style.textDecoration = "none";
        textoSpan.style.opacity = "1";
    }

    try {
        await fetch(`http://localhost:5000/api/tareas/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completada: checked })
        });
    } catch (error) {
        elementoInput.checked = !checked;
        alert("Error al conectar con el servidor");
    }
}

async function eliminarTareaBD(id, date) {
    await fetch(`http://localhost:5000/api/tareas/${id}`, { method: 'DELETE' });
    showDayTasks(date);
}

async function cargarMetas() {
    const username = localStorage.getItem("usuarioLogueado");
    const container = document.getElementById("goalsContainer");
    if (!container) return;

    const response = await fetch(`http://localhost:5000/api/metas/${username}`);
    const metas = await response.json();

    container.innerHTML = "";
    metas.forEach(meta => {
        renderizarMeta(meta.id, meta.texto);
    });
}

function renderizarMeta(id, texto) {
    const container = document.getElementById("goalsContainer");
    const newItem = document.createElement('div');
    newItem.className = 'list-item';
    newItem.innerHTML = `
        <div class="line">${texto}</div>
        <button onclick="eliminarMetaBD(${id})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">✕</button>
    `;
    container.appendChild(newItem);
}

async function toggleCheckMeta(id, estado) {
    await fetch(`http://localhost:5000/api/metas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completada: estado })
    });
    cargarMetas();
}

async function addItem(containerId) {
    const texto = prompt("Escribe tu nueva meta del mes:");
    if (!texto) return;

    const username = localStorage.getItem("usuarioLogueado");

    const response = await fetch('http://localhost:5000/api/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, texto })
    });

    if (response.ok) {
        const data = await response.json();
        renderizarMeta(data.id, texto);
    }
}

async function eliminarMetaBD(id) {
    const response = await fetch(`http://localhost:5000/api/metas/${id}`, {
        method: 'DELETE'
    });
    if (response.ok) {
        cargarMetas();
    }
}

function showSection(section) {
    document.getElementById('home-section').style.display = section === 'home' ? 'grid' : 'none';
    document.getElementById('timer-section').style.display = section === 'timer' ? 'flex' : 'none';
    
    const tabs = document.querySelectorAll('.nav-item');
    tabs[0].classList.toggle('active', section === 'home');
    tabs[1].classList.toggle('active', section === 'timer');
}

function cargarConfiguracionUsuario() {
    const mascota = localStorage.getItem("mascotaElegida") || "gato";
    const plannerRoot = document.getElementById("planner-root");
    const imgAvatar = document.getElementById("main-avatar");
    const imgWalking = document.getElementById("walking-avatar");

    if (mascota === "cupcake") {
        plannerRoot.classList.add("cupcake-theme");
        imgAvatar.src = "IMG_0003.gif";
        imgWalking.src = "IMG_0003.gif";
    } else {
        plannerRoot.classList.remove("cupcake-theme");
        imgAvatar.src = "gateteRespirando2.gif";
        imgWalking.src = "gateteRespirando2.gif";
    }
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    isPaused = true;
    const minutes = parseInt(document.getElementById('timerType').value);
    timeLeft = minutes * 60;
    totalTime = timeLeft;
    document.getElementById('startPauseBtn').textContent = "PLAY";
    updateDisplay();
}

function updateDisplay() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.getElementById('time').textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    const percentage = ((totalTime - timeLeft) / totalTime) * 100;
    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('walking-avatar').style.left = `${percentage}%`;
}

function toggleTimer() {
    if (isPaused) {
        isPaused = false;
        document.getElementById('startPauseBtn').textContent = "PAUSE";
        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerId);
                alert("¡Tiempo terminado!");
                resetTimer();
            }
        }, 1000);
    } else {
        isPaused = true;
        document.getElementById('startPauseBtn').textContent = "PLAY";
        clearInterval(timerId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem("usuarioLogueado");
    if (!usuario) {
        alert("Por favor, inicia sesión primero.");
        window.location.href = 'avanceproyecto.html';
        return;
    }
    cargarConfiguracionUsuario();
    renderCalendar();
    resetTimer();
    cargarMetas();

    document.getElementById('prevMonth').onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
    document.getElementById('nextMonth').onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };

});
