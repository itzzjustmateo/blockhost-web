import fs from "node:fs";

const todosPath = "./mcp-todos.json";

const todos = fs.existsSync(todosPath)
  ? JSON.parse(fs.readFileSync(todosPath, "utf8"))
  : [
      {
        id: 1,
        title: "Buy groceries",
      },
    ];

let subscribers: ((todos: Todo[]) => void)[] = [];

export interface Todo {
  id: number;
  title: string;
}

export function getTodos(): Todo[] {
  return todos;
}

export function addTodo(title: string) {
  todos.push({ id: todos.length + 1, title });
  fs.writeFileSync(todosPath, JSON.stringify(todos, null, 2));
  notifySubscribers();
}

export function subscribeToTodos(callback: (todos: Todo[]) => void) {
  subscribers.push(callback);
  callback(todos);
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
  };
}

function notifySubscribers() {
  for (const cb of subscribers) {
    try {
      cb(todos);
    } catch {
      // ignore subscriber errors
    }
  }
}
