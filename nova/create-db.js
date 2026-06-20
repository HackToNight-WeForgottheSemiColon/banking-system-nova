const { Client } = require('pg')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') })

async function createDb() {
  const dbUrl =
    process.env.DATABASE_URL || 'postgresql://postgres:2007@localhost:5432/Nova'

  let dbName = 'Nova'
  let connectionString = 'postgresql://postgres:2007@localhost:5432/postgres'

  try {
    const parsedUrl = new URL(dbUrl)
    dbName = parsedUrl.pathname.replace('/', '').split('?')[0] || 'Nova'

    // Connect to the default 'postgres' database to perform the creation
    parsedUrl.pathname = '/postgres'
    parsedUrl.search = ''
    connectionString = parsedUrl.toString()
  } catch (e) {
    console.log(
      'Using default fallback connection settings to check/create database.'
    )
  }

  console.log(
    `Connecting to Postgres default system database to verify/create database: "${dbName}"...`
  )
  const client = new Client({ connectionString })

  try {
    await client.connect()

    // Check if the database exists
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    )

    if (res.rowCount === 0) {
      console.log(
        `Database "${dbName}" not found. Creating database "${dbName}"...`
      )
      // CREATE DATABASE query cannot be parameterized, using interpolation securely (since it's developer controlled env)
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`)
      console.log(`Database "${dbName}" created successfully!`)
    } else {
      console.log(`Database "${dbName}" already exists.`)
    }
  } catch (err) {
    console.error('Error during database creation:', err.message)
  } finally {
    try {
      await client.end()
    } catch (e) {}
  }
}

createDb()
