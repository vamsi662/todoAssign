const express = require('express')
const app = express()

const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

//import {format} from 'date-fns'
const {format} = require('date-fns')
const isValid = require('date-fns/isValid')

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

app.use(express.json())

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running Successfully...')
    })
  } catch (e) {
    console.log(`Db Error : ${e.message}`)
    process.exit(1)
  }
}

intializeDBAndServer()

app.get('/todos/', async (request, response) => {
  const {
    priority = '',
    status = '',
    category = '',
    search_q = '',
  } = request.query

  const statusArray = ['TO DO', 'IN PROGRESS', 'DONE', '']
  const priorityArray = ['HIGH', 'MEDIUM', 'LOW', '']
  const categoryArray = ['WORK', 'HOME', 'LEARNING', '']

  switch (true) {
    case !statusArray.includes(status):
      response.status = 400
      response.send('Invalid Todo Status')
      break
    case !priorityArray.includes(priority):
      response.status = 400
      response.send('Invalid Todo Priority')
      break
    case !categoryArray.includes(category):
      response.status = 400
      response.send('Invalid Todo Category')
      break
  }

  const todoQuery = `SELECT
                  id,todo,priority,status,category,due_date AS dueDate
                FROM
                  todo
                WHERE status LIKE '%${status}%' AND priority LIKE '%${priority}%' AND category LIKE '%${category}%' AND todo LIKE '%${search_q}%'`
  const todoArray = await db.all(todoQuery)
  response.send(todoArray)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `SELECT * FROM todo WHERE id = ${todoId}`
  const todoquery = await db.get(query)
  const todoDetail = {
    id: todoquery.id,
    todo: todoquery.todo,
    status: todoquery.status,
    priority: todoquery.priority,
    category: todoquery.category,
    dueDate: todoquery.due_date,
  }
  response.send(todoDetail)
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const chgDateFormat = format(new Date(date), 'yyyy-MM-dd')

  const agendaquery = `SELECT
                        id,todo,status,priority,category,due_date AS dueDate
                      FROM
                        todo
                      WHERE due_date = '${chgDateFormat}'`
  const agendaDetail = await db.all(agendaquery)
  response.send(agendaDetail)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
  const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
  const categoryArray = ['WORK', 'HOME', 'LEARNING']
  switch (true) {
    case !(status in statusArray):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case !(priority in priorityArray):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case !(category in categoryArray):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case !isValid(new Date(dueDate)):
      response.status(400)
      response.send('Invalid Due Date')
      break
  }

  const query = `INSERT INTO
                  todo (id,todo,priority,status,category,due_date)
                VALUES ( ${id},'${todo}','${priority}','${status}','${category}','${dueDate}' )`
  await db.run(query)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const todoQuery = `SELECT * FROM todo WHERE id = ${todoId}`
  const todoDetails = await db.get(todoQuery)
  const {
    status = todoDetails.status,
    priority = todoDetails.priority,
    category = todoDetails.category,
    todo = todoDetails.todo,
    dueDate = todoDetails.due_date,
  } = request.body

  const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
  const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
  const categoryArray = ['WORK', 'HOME', 'LEARNING']

  switch (true) {
    case !(status in statusArray):
      response.status(400)
      response.send('Invalid Todo Status')
      break
    case !(priority in priorityArray):
      response.status(400)
      response.send('Invalid Todo Priority')
      break
    case !(category in categoryArray):
      response.status(400)
      response.send('Invalid Todo Category')
      break
    case !isValid(new Date(dueDate)):
      response.status(400)
      response.send('Invalid Due Date')
      break
  }

  const updateQuery = `UPDATE
                        todo
                      SET status = '${status}',priority = '${priority}',category = '${category}',todo = '${todo}',due_date = '${dueDate}'
                      WHERE id = ${todoId}`

  await db.run(updateQuery)

  switch (true) {
    case status !== todoDetails.status:
      updateColumn = 'Status'
      break
    case priority !== todoDetails.priority:
      updateColumn = 'Priority'
      break
    case category !== todoDetails.category:
      updateColumn = 'Category'
      break
    case todo !== todoDetails.todo:
      updateColumn = 'Todo'
      break
    case dueDate !== todoDetails.due_date:
      updateColumn = 'Due Date'
      break
  }
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId}`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
