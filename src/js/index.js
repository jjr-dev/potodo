let stopwatch, configs, stages, stage, timer, todos;

document.addEventListener("DOMContentLoaded", () => {
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
            paused: true
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

    todos.reverse();
    todos.map((todo) => {
        addToDo(todo);
    })

    if(!configs.paused) {
        startTimer(parseInt(timer.minutes) * 60 + parseInt(timer.seconds));
        togglePaused();
    }

    setPomodoroTheme();
    save();
});

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
    });

    e.target.querySelector('input[name="name"]').value = "";
    document.querySelector('form#todo-add button[type="submit"]').disabled = true;

    saveToDo();
})

document.querySelector('form#todo-add input[name="name"]').onkeyup = function() {
    document.querySelector('form#todo-add button[type="submit"]').disabled = this.value.length == 0;
}

document.querySelector('.pomodoro-actions .pomodoro-action-play').onclick = function() {
    configs.paused = false;
    togglePaused();

    startTimer(parseInt(timer.minutes) * 60 + parseInt(timer.seconds));
}

document.querySelector('.pomodoro-actions .pomodoro-action-pause').onclick = function() {
    configs.paused = true;
    togglePaused();
    
    pauseTimer();
}

document.querySelector('.pomodoro-actions .pomodoro-action-reset').onclick = function() {
    resetTimer(stages[stage].minutes * 60);
}

document.querySelector('.pomodoro-actions .pomodoro-action-previous').onclick = function() {
    stage = stage > 0 ? stage - 1 : stages.length - 1;

    timer = {
        minutes: stages[stage].minutes,
        seconds: 0
    }
    
    resetTimer(timer.minutes * 60);
    setPomodoroTheme();

    pauseTimer();

    save();
}

document.querySelector('.pomodoro-actions .pomodoro-action-next').onclick = function() {
    stage = stage < stages.length - 1 ? stage + 1 : 0;

    timer = {
        minutes: stages[stage].minutes,
        seconds: 0
    }

    resetTimer(timer.minutes * 60);
    setPomodoroTheme();

    pauseTimer();

    save();
}

function saveToDo() {
    todos = [];

    document.querySelectorAll('.todo-list .todo-item').forEach((todo) => {
        todos.push({
            id: todo.querySelector('.todo-check').id,
            name: todo.querySelector('.todo-name').textContent,
            checked: todo.querySelector('.todo-check').checked
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

function addToDo(task) {
    const template = document.querySelector("#todo-item-template").cloneNode(true);
    
    template.id = "";
    template.querySelector(".todo-name span").textContent = task.name

    if(task.id) {
        template.querySelector(".todo-name").setAttribute('for', task.id);

        template.querySelector(".todo-check").id   = task.id;
        template.querySelector(".todo-check").name = task.id;
    }
    
    if(task.checked)
        template.querySelector('.todo-check').checked = true;

    template.querySelector('.todo-name').onclick = function(e) {
        e.preventDefault();

        // Informações sobre a tarefa em breve
        console.log(this);
    }

    template.querySelector(".todo-btn.todo-trash").addEventListener("click", () => {
        if(confirm("Excluir tarefa?")) {
            template.remove();
            saveToDo();
        }
    })

    template.querySelector('.todo-check').onchange = () => {
        saveToDo()
    };
    
    document.querySelector(".todo-list ul").prepend(template);
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

            resetTimer(stages[stage].minutes * 60);

            if(!ended && configs.auto)
                startTimer(stages[stage].minutes * 60);

            if(ended && configs.reset)
                startTimer(stages[stage].minutes * 60);

            setPomodoroTheme();
        } else {
            timer = {
                minutes: `${minutes < 10 ? `0${minutes}` : minutes}`,
                seconds: `${seconds < 10 ? `0${seconds}` : seconds}`
            };
    
            setPomodoroTimer();
    
            const type = stages[stage].type;
            setTitle(`${type[0].toUpperCase() + type.substring(1)} - ${timer.minutes}:${timer.seconds}`)
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

    document.querySelector('.pomodoro-stage span').textContent = stages[stage].type == 'focus' ? 'Foco' : 'Pausa';
}

function togglePaused() {
    document.querySelector('.pomodoro-actions .pomodoro-action-pause').style.display = configs.paused ? 'none' : 'block';
    document.querySelector('.pomodoro-actions .pomodoro-action-play').style.display  = configs.paused ? 'block' : 'none';

    save();
}

function setPomodoroTimer() {
    document.querySelector('.pomodoro-timer-minutes').textContent = timer.minutes;
    document.querySelector('.pomodoro-timer-seconds').textContent = timer.seconds;
}

function save() {
    localStorage.setItem('potodo-configs', JSON.stringify(configs));
    localStorage.setItem('potodo-stages', JSON.stringify(stages));
    localStorage.setItem('potodo-timer', JSON.stringify(timer));
    localStorage.setItem('potodo-todos', JSON.stringify(todos));
    localStorage.setItem('potodo-stage', stage);
}