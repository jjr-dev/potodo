let timer;

document.addEventListener("DOMContentLoaded", () => {
    let todos = localStorage.getItem('potodo-todo-list');
    todos = todos ? JSON.parse(todos) : [];

    todos.reverse();
    todos.map((todo) => {
        addToDo(todo);
    })

    let stages = localStorage.getItem('potodo-pomodoro-stages');
    stages = stages ? JSON.parse(stages) : configPomodoroStages();

    let stage = localStorage.getItem('potodo-pomodoro-stage')
    if(!stage)
        localStorage.setItem('potodo-pomodoro-stage', 0);

    let t = localStorage.getItem('potodo-pomodoro-timer');
    if(!t) {
        t = {
            minutes: stages[0].minutes < 10 ? `0${stages[0].minutes}` : stages[0].minutes,
            seconds: "00"
        }
    } else {
        t = JSON.parse(t);
    }

    document.querySelector('.pomodoro-timer-minutes').textContent = t.minutes;
    document.querySelector('.pomodoro-timer-seconds').textContent = t.seconds;
});

document.querySelector('form#todo-add').addEventListener('submit', (e) => {
    e.preventDefault();

    const form = getFormData(e.target);
    
    if(!form.name || form.name == '') {
        alert("Informe um nome");
        return;
    }

    addToDo({
        id: `task-${Math.random()}`,
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
    let t = localStorage.getItem('potodo-pomodoro-timer');
    const stages = JSON.parse(localStorage.getItem('potodo-pomodoro-stages'));

    t = !t ? { minutes: stages[0].minutes, seconds: 0 } : JSON.parse(t);
    
    startTimer(parseInt(t.minutes) * 60 + parseInt(t.seconds));
}

document.querySelector('.pomodoro-actions .pomodoro-action-pause').onclick = function() {
    pauseTimer();
}

document.querySelector('.pomodoro-actions .pomodoro-action-reset').onclick = function() {
    let   stage  = parseInt(localStorage.getItem('potodo-pomodoro-stage'));
    const stages = JSON.parse(localStorage.getItem('potodo-pomodoro-stages'));

    resetTimer(stages[stage].minutes * 60);
}

document.querySelector('.pomodoro-actions .pomodoro-action-previous').onclick = function() {
    let stage = parseInt(localStorage.getItem('potodo-pomodoro-stage'));
    const stages = JSON.parse(localStorage.getItem('potodo-pomodoro-stages'));

    if(stage > 0)
        stage --;
    
    localStorage.setItem('potodo-pomodoro-stage', stage);
    
    resetTimer(stages[stage].minutes * 60);

    const body =  document.querySelector('body');
    body.removeAttribute('class');
    body.classList.add(`theme-${stages[stage].type}`)
}

document.querySelector('.pomodoro-actions .pomodoro-action-next').onclick = function() {
    let   stage  = parseInt(localStorage.getItem('potodo-pomodoro-stage'));
    const stages = JSON.parse(localStorage.getItem('potodo-pomodoro-stages'));

    if(stage < stages.length - 1)
        stage ++;
    
    localStorage.setItem('potodo-pomodoro-stage', stage);

    resetTimer(stages[stage].minutes * 60);

    const body =  document.querySelector('body');
    body.removeAttribute('class');
    body.classList.add(`theme-${stages[stage].type}`)
}

function configPomodoroStages() {
    let configs = localStorage.getItem('potodo-pomodoro-configs');

    if(configs) {
        configs = JSON.parse(configs);
    } else {
        configs = {
            focus: 25,
            break: {
                short: 5,
                long: 15,
            },
            length: 4,
            auto: true,
            reset: true
        };

        localStorage.setItem('potodo-pomodoro-configs', JSON.stringify(configs));
    }

    let stages = [];
    for(let i = 1; i <= configs.length; i++) {
        let stage = [];

        stage.push({
            type: 'focus',
            minutes: configs.focus,
        });

        stage.push({
            type: 'break',
            minutes: i != configs.length ? configs.break.short : configs.break.long,
        })

        stages = stages.concat(stage)
    }

    localStorage.setItem('potodo-pomodoro-stages', JSON.stringify(stages))

    return stages;
}

function saveToDo() {
    const todos = [];

    document.querySelectorAll('.todo-list .todo-item').forEach((todo) => {
        todos.push({
            id: todo.querySelector('.todo-check').id,
            name: todo.querySelector('.todo-name').textContent,
            checked: todo.querySelector('.todo-check').checked
        })
    });
    
    localStorage.setItem('potodo-todo-list', JSON.stringify(todos));
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
    if(timer)
        return;

    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    let   stage  = parseInt(localStorage.getItem('potodo-pomodoro-stage'));
    const stages = JSON.parse(localStorage.getItem('potodo-pomodoro-stages'));

    timer = setInterval(() => {
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

            let s = stages[stage];
            resetTimer(s.minutes * 60);

            localStorage.setItem('potodo-pomodoro-stage', stage);

            const configs = JSON.parse(localStorage.getItem('potodo-pomodoro-configs'));

            if(!ended && configs.auto)
                startTimer(s.minutes * 60);

            if(ended && configs.reset)
                startTimer(s.minutes * 60);

            const body =  document.querySelector('body');
            body.removeAttribute('class');
            body.classList.add(`theme-${s.type}`)

            document.querySelector('.pomodoro-stage-focus').style.display = 'none';
            document.querySelector('.pomodoro-stage-break').style.display = 'none';
            document.querySelector(`.pomodoro-stage-${s.type}`).style.display = 'block';
        } else {
            const str = {
                minutes: `${minutes < 10 ? `0${minutes}` : minutes}`,
                seconds: `${seconds < 10 ? `0${seconds}` : seconds}`
            };
    
            document.querySelector('.pomodoro-timer-minutes').textContent = str.minutes;
            document.querySelector('.pomodoro-timer-seconds').textContent = str.seconds;
    
            localStorage.setItem('potodo-pomodoro-timer', JSON.stringify(str))

            const type = stages[stage].type;
            setTitle(`${type[0].toUpperCase() + type.substring(1)} - ${str.minutes}:${str.seconds}`)
        }
    }, 1000)
}

function pauseTimer() {
    clearInterval(timer);
    timer = null;
}

function resetTimer(seconds) {
    pauseTimer();
    
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    const str = {
        minutes: `${minutes < 10 ? `0${minutes}` : minutes}`,
        seconds: `${seconds < 10 ? `0${seconds}` : seconds}`
    };

    document.querySelector('.pomodoro-timer-minutes').textContent = str.minutes;
    document.querySelector('.pomodoro-timer-seconds').textContent = str.seconds;

    localStorage.setItem('potodo-pomodoro-timer', JSON.stringify(str))
}

function setTitle(title) {
    document.querySelector('title').textContent = title;
}