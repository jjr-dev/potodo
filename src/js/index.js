document.addEventListener("DOMContentLoaded", () => {
    let todos = localStorage.getItem('todo-list');

    todos = JSON.parse(todos);
    todos.reverse();

    todos.map((todo) => {
        addToDo(todo);
    })
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

    saveToDo();
})

function saveToDo() {
    const todos = [];

    document.querySelectorAll('.todo-list .todo-item').forEach((todo) => {
        todos.push({
            id: todo.querySelector('.todo-check').id,
            name: todo.querySelector('.todo-name').textContent,
            checked: todo.querySelector('.todo-check').checked
        })
    });
    
    localStorage.setItem('todo-list', JSON.stringify(todos));
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

    template.querySelector(".todo-btn.todo-trash").addEventListener("click", () => {
        if(confirm("Excluir tarefa?")) {
            template.remove();
            saveToDo();
        }
    })
    
    document.querySelector(".todo-list ul").prepend(template);
}