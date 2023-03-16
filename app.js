const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
       SELECT
       *
      FROM
       todo 
      WHERE
        todo LIKE '%${search_q}%'
       AND status = '${status}'
       AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
       SELECT
        *
       FROM
       todo 
       WHERE
       todo LIKE '%${search_q}%'
       AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
       SELECT
       *
      FROM
      todo 
      WHERE
      todo LIKE '%${search_q}%'
      AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
       *
      FROM
      todo 
      WHERE
      todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});
//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
    SELECT *
    FROM todo 
    WHERE 
    id=${todoId};`;
  const getDetails = await db.get(getTodo);
  response.send(getDetails);
});
//API 3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addTodoDetails = `
    INSERT INTO 
    todo(id,todo,priority,status)
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
        );`;
  await db.run(addTodoDetails);
  response.send("Todo Successfully Added");
});
//API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const todoDetails = request.body;
  switch (true) {
    case todoDetails.status !== undefined:
      updateColumn = "Status";
      break;
    case todoDetails.priority !== undefined:
      updateColumn = "Priority";
      break;
    case todoDetails.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
  SELECT * 
  FROM todo 
  WHERE 
  id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateStatus = `
  UPDATE 
  todo 
  SET 
  todo='${todo}',
  priority='${priority}',
  status='${status}';`;
  await db.run(updateStatus);
  response.send(`${updateColumn} Updated`);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
   DELETE FROM 
   todo 
   WHERE 
    id=${todoId};`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});
module.exports = app;
