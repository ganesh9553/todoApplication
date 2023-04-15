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
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

///api1
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getQuery = `
            SELECT *
            FROM todo
            WHERE 
            todo LIKE '%${search_q}' 
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;
    case hasPriority(request.query):
      getQuery = `
            SELECT *
            FROM todo
            WHERE 
            todo LIKE '%${search_q}' 
            AND priority = '${priority}';`;
      break;
    case hasStatus(request.query):
      getQuery = `
            SELECT *
            FROM todo
            WHERE 
            todo LIKE '%${search_q}' 
            AND status = '${status}';`;
      break;
    default:
      getQuery = `
            SELECT *
            FROM todo
            WHERE 
            todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getQuery);
  response.send(data);
});
///api2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const query = await db.get(getQuery);
  response.send(query);
});
///api3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const getQuery = `
    INSERT INTO todo(id,todo,priority,status)
    VALUES(${id},'${todo}','${priority}','${status}');`;
  const query = await db.run(getQuery);
  response.send("Todo Successfully Added");
});

///api5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  const query = await db.run(deleteQuery);
  response.send("Todo Deleted");
});

///api4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const previousQuery = `
  SELECT *
  FROM todo
  WHERE id = ${todoId};`;
  const result = await db.get(previousQuery);
  const {
    todo = result.todo,
    priority = result.priority,
    status = result.status,
  } = request.body;
  const getQuery = `
    UPDATE todo
    SET 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE id = ${todoId};`;
  await db.run(getQuery);
  response.send(`${updatedColumn} Updated`);
});

module.exports = app;
