let stopwatch, configs, stages, stage, timer, todos, history;

document.addEventListener("DOMContentLoaded", () => {
    history = localStorage.getItem('potodo-history');
    history = !history ? {} : JSON.parse(history);

    configs = localStorage.getItem('potodo-configs');
    if(!configs) {
        configs = {
            focus: 25,
            break: {
                short: 5,
                long: 15,
            },
            length: 4,
            auto: true,
            reset: true,
            paused: true,
            sound: true,
            history: {
                view: 10,
                register: true
            }
        };
    } else {
        configs = JSON.parse(configs);
    }

    stages = localStorage.getItem('potodo-stages');
    if(!stages) {
        stages = [];
        for(let i = 1; i <= configs.length; i++) {
            let array = [];
    
            array.push({
                type: 'focus',
                minutes: configs.focus,
            });
    
            array.push({
                type: 'break',
                minutes: i != configs.length ? configs.break.short : configs.break.long,
            })
    
            stages = stages.concat(array)
        }
    } else {
        stages = JSON.parse(stages);
    }

    stage = localStorage.getItem('potodo-stage')
    stage = !stage ? 0 : parseInt(stage);

    timer = localStorage.getItem('potodo-timer');
    if(!timer) {
        timer = {
            minutes: stages[0].minutes < 10 ? `0${stages[0].minutes}` : stages[0].minutes,
            seconds: "00"
        }
    } else {
        timer = JSON.parse(timer);
    }

    setPomodoroTimer();

    todos = localStorage.getItem('potodo-todos');
    todos = todos ? JSON.parse(todos) : [];

    todos.map((todo) => {
        addToDo(todo);
    })

    setToDoDragAndDrop();
    setPomodoroHistory();
    setPomodoroTheme();
    updateToDoProgress(false);
    save();

    verifyNotification();
});

document.querySelector('.todo .todo-header .dropmenu .todo-view-archived').addEventListener('click', (e) => {
    const list = document.querySelector('.todo .todo-list ul');

    if(list.getAttribute('archiveds') === 'true') {
        e.target.textContent = 'Exibir tarefas arquivadas';
        list.setAttribute('archiveds', 'false');
    } else {
        e.target.textContent = 'Ocultar tarefas arquivadas';
        list.setAttribute('archiveds', 'true');
    }
})

document.querySelector('.todo .todo-header .btn-todo-toggle-archiveds').addEventListener('click', () => {
    const submenu = document.querySelector('.todo .todo-header .btn-todo-toggle-archiveds .dropmenu');

    if(submenu.classList.contains('dropmenu-opened'))
        submenu.classList.remove('dropmenu-opened')
    else
        submenu.classList.add('dropmenu-opened')
})

document.querySelector('form#todo-add').addEventListener('submit', (e) => {
    e.preventDefault();

    const form = getFormData(e.target);
    
    if(!form.name || form.name == '') {
        alert("Informe um nome");
        return;
    }

    addToDo({
        id: Math.floor((1 + Math.random()) * 0x10000),
        name: form.name
    }, false);

    e.target.querySelector('input[name="name"]').value = "";
    document.querySelector('form#todo-add button[type="submit"]').disabled = true;

    saveToDo();
    updateToDoProgress(false);
})

document.querySelector('form#todo-add input[name="name"]').onkeyup = function() {
    document.querySelector('form#todo-add button[type="submit"]').disabled = this.value.length == 0;
}

document.querySelector('.pomodoro-actions .pomodoro-action-play').addEventListener("click", () => {
    configs.paused = false;
    togglePaused();

    startTimer(parseInt(timer.minutes) * 60 + parseInt(timer.seconds));

    if(configs.sound)
        startSound('bell');
})

document.querySelector('.pomodoro-actions .pomodoro-action-pause').addEventListener("click", () => {
    configs.paused = true;
    togglePaused();
    
    pauseTimer();
})

document.querySelector('.pomodoro-actions .pomodoro-action-reset').addEventListener("click", () => {
    resetTimer(stages[stage].minutes * 60);
})

document.querySelector('.pomodoro-actions .pomodoro-action-previous').addEventListener("click", () => {
    stage = stage > 0 ? stage - 1 : stages.length - 1;

    timer = {
        minutes: stages[stage].minutes,
        seconds: 0
    }
    
    resetTimer(timer.minutes * 60);
    setPomodoroTheme();

    pauseTimer();

    save();
})

document.querySelector('.pomodoro-actions .pomodoro-action-next').addEventListener("click", () => {
    stage = stage < stages.length - 1 ? stage + 1 : 0;

    timer = {
        minutes: stages[stage].minutes,
        seconds: 0
    }

    resetTimer(timer.minutes * 60);
    setPomodoroTheme();

    pauseTimer();

    save();
})

function saveToDo() {
    todos = [];

    document.querySelectorAll('.todo-list .todo-item').forEach((todo) => {
        todos.push({
            id: todo.querySelector('.todo-check').id,
            name: todo.querySelector('.todo-name').textContent,
            checked: todo.querySelector('.todo-check').checked,
            archived: todo.getAttribute('archived')
        })
    });

    save();
}

function getFormData(form) {
    const formData = new FormData(form);

    const values = {};
    for(let pair of formData.entries()) {
        values[pair[0]] = pair[1];
    }

    return values;
}

function addToDo(task, append = true) {
    const template = document.querySelector("#todo-item-template").cloneNode(true);
    
    template.id = "";
    template.querySelector(".todo-name").textContent = task.name

    if(task.id) {
        template.querySelector(".todo-name").setAttribute('for', task.id);

        template.querySelector(".todo-check").id   = task.id;
        template.querySelector(".todo-check").name = task.id;
    }
    
    if(task.checked)
        template.querySelector('.todo-check').checked = true;

    if(task.archived) {
        const archived = task.archived === 'true';
        template.setAttribute('archived', archived);

        template.querySelector('.todo-archive').title = archived ? "Desarquivar tarefa" : "Arquivar tarefa";
    }

    template.querySelector('.todo-name').addEventListener("click", (e) => {
        e.preventDefault();

        // Informações sobre a tarefa em breve
        console.log(this);
    })

    template.querySelector(".todo-btn.todo-trash").addEventListener("click", () => {
        if(confirm("Excluir tarefa?")) {
            template.remove();
            saveToDo();
            updateToDoProgress(false);
        }
    })

    template.querySelector(".todo-btn.todo-archive").addEventListener("click", () => {
        const archived = template.getAttribute('archived') === 'true';

        if(archived) {
            if(confirm("Desarquivar tarefa?")) {
                template.removeAttribute('archived');
                saveToDo();
            }
        } else {
            if(confirm("Arquivar tarefa?")) {
                template.setAttribute('archived', true);
                saveToDo();
            }
        }

        template.querySelector('.todo-archive').title = archived ? "Arquivar tarefa" : "Desarquivar tarefa";
    })

    template.querySelector('.todo-check').onchange = () => {
        saveToDo();
        updateToDoProgress();
    };

    template.addEventListener("dragstart", (e) => {
        const element = e.target

        element.classList.add('dragging');
        
        const parent = element.parentNode;
        parent.classList.add('dragging-list');
    })

    template.addEventListener("dragend", (e) => {
        const element = e.target

        element.classList.remove('dragging');

        const parent = element.parentNode;
        parent.classList.remove('dragging-list');

        saveToDo();
    })

    const list = document.querySelector(".todo-list ul");
    
    if(append) 
        list.append(template);
    else
        list.prepend(template);
}

function startTimer(seconds) {
    if(stopwatch)
        return;

    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    stopwatch = setInterval(() => {
        seconds --;

        if(seconds <= 0) {
            seconds = 59;
            minutes --;
        }

        if(minutes < 0) {
            pauseTimer();
            minutes = 0;
            seconds = 0;

            let ended = false;
            if(stage == stages.length - 1) {
                ended = true;
                
                setTitle("PoToDo");
            }

            stage = stage < stages.length - 1 ? stage + 1 : 0;

            const min = parseInt(stages[stage].minutes);

            resetTimer(min * 60);

            if(!ended && configs.auto) {
                startTimer(min * 60);
                configs.paused = false;
            }

            if(ended && configs.reset)
                startTimer(min * 60);

            if(configs.sound)
                startSound('clock');

            setPomodoroTheme();
            togglePaused();

            let notify;
            if(stages[stage].type == 'focus') {
                notify = {
                    title: 'Foco!',
                    body: `Dê tudo de si por ${min} ${min > 1 ? 'minutos' : 'minuto'}!`,
                    image: `./src/img/notify-focus.png`,
                }
            } else {
                notify = {
                    title: 'Intervalo!',
                    body: `Relaxe e se distraia por ${min} ${min > 1 ? 'minutos' : 'minuto'}!`,
                    image: `./src/img/notify-break.png`,
                }
            }

            newNotification(notify.title, notify);
        } else {
            timer = {
                minutes: `${minutes < 10 ? `0${minutes}` : minutes}`,
                seconds: `${seconds < 10 ? `0${seconds}` : seconds}`
            };
    
            setPomodoroTimer();
    
            if(configs.history.register) {
                registerPomodoroHistory();
                updatePomodoroHistory();
            }

            setTitle(`${stages[stage].type == 'focus' ? "Foco" : "Intervalo"} - ${timer.minutes}:${timer.seconds}`)
        }

        save();
    }, 10)
}

function pauseTimer() {
    configs.paused = true;
    togglePaused();

    clearInterval(stopwatch);
    stopwatch = null;
}

function resetTimer(seconds) {
    pauseTimer();
    
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    timer = {
        minutes: `${minutes < 10 ? `0${minutes}` : minutes}`,
        seconds: `${seconds < 10 ? `0${seconds}` : seconds}`
    };

    setPomodoroTimer();
}

function setTitle(title) {
    // document.querySelector('title').textContent = title;
}

function setPomodoroTheme() {
    const body =  document.querySelector('body');
    body.removeAttribute('class');
    body.classList.add(`theme-${stages[stage].type}`)

    document.querySelector('.pomodoro-stage span').textContent = stages[stage].type == 'focus' ? 'Foco' : 'Intervalo';
}

function togglePaused() {
    document.querySelector('.pomodoro-actions .pomodoro-action-pause').style.display = configs.paused ? 'none' : 'flex';
    document.querySelector('.pomodoro-actions .pomodoro-action-play').style.display  = configs.paused ? 'flex' : 'none';

    save();
}

function setPomodoroTimer() {
    document.querySelector('.pomodoro-timer-minutes').textContent = timer.minutes;
    document.querySelector('.pomodoro-timer-seconds').textContent = timer.seconds;
}

function startSound(type) {
    const sound = document.querySelector(`audio.potodo-sound[data-sound-type="${type}"]`);
    sound.currentTime = 0;
    sound.play();
}

function save() {
    localStorage.setItem('potodo-configs', JSON.stringify(configs));
    localStorage.setItem('potodo-stages', JSON.stringify(stages));
    localStorage.setItem('potodo-timer', JSON.stringify(timer));
    localStorage.setItem('potodo-todos', JSON.stringify(todos));
    localStorage.setItem('potodo-history', JSON.stringify(history));
    localStorage.setItem('potodo-stage', stage);
}

function verifyNotification() {
    if(Notification) {
        Notification.requestPermission().then((response) => {
            configs.notify = response === 'granted';
            save();
        });
    } else {
        configs.notify = false;
        save();
    }
}

function newNotification(title, options) {
    if(configs.notify) {
        if(Notification.permission !== 'granted') {
            verifyNotification();
            return;
        }

        new Notification(title, options);
    }
}

function getCurrentDate() {
    const date = new Date();
    const year  = date.getFullYear();
    const month = date.getMonth() + 1;
    const day   = date.getDate();

    return `${year}-${month < 10 ? `0${month}` : month}-${day}`;
}

function registerPomodoroHistory() {
    const date = getCurrentDate();

    const type = stages[stage].type;

    if(!history[date])
        history[date] = {};

    if(!history[date][type])
        history[date][type] = 0;
    
    history[date][type] ++;

    save();
}

function organizePomodoroHistory() {
    const h = [];

    for(let date in history) {
        h.push({
            date,
            ...history[date]
        })
    }

    h.sort((a, b) => {
        return new Date(`${b.date}`) - new Date(`${a.date}`);
    })

    return h;
}

function setPomodoroHistory() {
    organizePomodoroHistory().forEach((item) => {
        document.querySelector(".pomodoro-history").append(makePomodoroHistoryItem(item));
    })
}

function updatePomodoroHistory() {
    const date  = getCurrentDate();
    const items = organizePomodoroHistory();

    if(items.length > 0) {
        const item = items[0];

        const template = document.querySelector(`.pomodoro-history-item[data-history-date="${date}"]`);

        let make = false;

        if(template) {
            const templateFocus = template.querySelector('.pomodoro-history-timer-focus').textContent
            const templateBreak = template.querySelector('.pomodoro-history-timer-break').textContent

            if(templateFocus != Math.floor((item.focus || 0) / 60) || templateBreak != Math.floor((item.break || 0) / 60)) {
                make = true;
                template.remove();
            }
        } else {
            make = true;
        }

        if(make)
            document.querySelector(".pomodoro-history").prepend(makePomodoroHistoryItem(item));
    }
}

function makePomodoroHistoryItem(item) {
    const template = document.querySelector("#pomodoro-history-item-template").cloneNode(true);
        
    template.id = "";

    template.setAttribute('data-history-date', item.date);
    template.querySelector('.pomodoro-history-date').textContent = item.date.split('-').reverse().join('/');

    template.querySelector('.pomodoro-history-timer-focus').textContent = Math.floor((item.focus || 0) / 60)
    template.querySelector('.pomodoro-history-timer-break').textContent = Math.floor((item.break || 0) / 60)

    return template;
}

function updateToDoProgress(animate = true) {
    let checked = 0;
    let total   = 0;

    todos.map((todo) => {
        if(!todo.archived) {
            total ++;

            if(todo.checked)
                checked ++;
        }
    })

    const progress = document.querySelector('.todo .todo-progress');
    progress.style.display = total == 0 ? 'none' : 'flex';

    const percentage = Math.floor(100 / total * checked);
    const str = `${percentage}%`;


    progress.querySelector('.todo-progress-bar span').style.width = str;
    progress.querySelector('.todo-progress-percentage').textContent = str;

    if(animate) {
        if(percentage === 100) {
            const items = document.querySelectorAll('.todo .todo-list .todo-item');
            items.forEach((item) => {
                item.classList.add('animated');

                setTimeout(() => {
                    item.classList.remove('animated');
                }, 1250)
            })

            if(configs.sound)
                startSound('success');
        }
    }
}

function delay(s) {
    return new Promise(resolve => setTimeout(resolve, s));
}

function setToDoDragAndDrop() {
    const list = document.querySelector(".todo-list ul");

    list.addEventListener("dragover", (e) => {
        const dragging = document.querySelector(".dragging");
        const all      = list.querySelectorAll(".todo-item");

        const items = [];
        all.forEach((item) => {
            if(window.getComputedStyle(item).display !== 'none')
                items.push(item);
        })

        let before;
        items.forEach((item) => {
            const box = item.getBoundingClientRect();

            if(e.clientY >= box.y + box.height / 2) before = item;
        });
        
        if(before)
            before.insertAdjacentElement("afterend", dragging);
        else
            list.prepend(dragging);
    })
}