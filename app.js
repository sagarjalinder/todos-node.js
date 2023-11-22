const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPreorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undifined && requestQuery.status !== undifined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTosodQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPreorityAndStatusProperties(request.query):
      getTosodQuery = `
                SELECT *
                FROM todo
                WHERE 
                  todo LIKE '%${search_q}%'
                  AND status = '${status}'
                  AND priority = '${priority}';
            `;
      break;
    case hasPriorityProperty(request.query):
      getTosodQuery = `
                SELECT *
                FROM todo
                WHERE 
                  todo LIKE '%${search_q}%'
                  AND priority = '${priority}';
            `;
      break;
    case hasStatusProperty(request.query):
      getTosodQuery = `
                SELECT *
                FROM todo
                WHERE 
                  todo LIKE '%${search_q}%'
                  AND status = '${status}';
            `;
      break;
    default:
      getTosodQuery = `
                SELECT *
                FROM todo
                WHERE 
                  todo LIKE '%${search_q}%';
            `;
  }
  data = await database.all(getTosodQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  getTosodQuery = `
        SELECT *
        FROM todo
        WHERE 
          id = '${todoId}';
        `;
  const todo = await database.get(getTosodQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodosQuery = `
        INSERT INTO
            todo (id, todo, priority, status)
        VALUES 
            (${id}, '${todo}', '${priority}', '${status}');
    `;
  await database.run(postTodosQuery);
  response.send("Todo Successfully Added");
});

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
          id = ${todoId};
    `;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `
        UPDATE todo
        SET
          todo = '${todo}',
          priority = '${priority}',
          status = '${status}'
        WHERE
          id = ${todoId};
    `;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const previousTodoQuery = `
        DELETE
        FROM
          todo
        WHERE
          id = ${todoId};
    `;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
