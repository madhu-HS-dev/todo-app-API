const express = require("express");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log("DB Error: ${e.message}");
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return;
  requestQuery.priority !== undefined && requestQuery.status !== undefined;
};

//API 1

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let getTodoQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
              todo LIKE "%${search_q}%"
              AND status = "${status}";`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
              todo LIKE "%${search_q}%"
              AND priority = "${priority}";`;
      break;
    case hasPriorityAndStatusProperty(request.query):
      getTodoQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
              todo LIKE "%${search_q}%"
              AND status = "${status}"
              AND priority = "${priority}";`;
      break;
    default:
      getTodoQuery = `
            SELECT
              *
            FROM
              todo
            WHERE
              todo LIKE "%${search_q}%";`;
  }

  const data = await db.all(getTodoQuery);
  response.send(data);
});

//Returns a specific todo based on the todo ID API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getSpecificTodoQuey = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;

  const getSpecificTodoResponse = await db.get(getSpecificTodoQuey);
  response.send(getSpecificTodoResponse);
});

//Create a todo in the todo table API 3

app.post("/todos/", (request, response) => {
  const { id, todo, priority, status } = request.body;

  const createTodoQuery = `
    INSERT INTO
      todo(id, todo, priority, status)
    VALUES
      (
          ${id},
          "${todo}",
          "${priority}",
          "${status}"
      );`;

  db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//Deletes a todo from the todo table based on the todo ID API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
