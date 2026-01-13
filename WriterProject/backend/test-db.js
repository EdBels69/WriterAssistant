import Database from './src/database/Database.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const db = new Database(join(__dirname, 'data/writer-assistant.db'))

try {
  await db.init()
  console.log('Database initialized')
  
  const projects = db.getProjectsByUserId('demo-user')
  console.log('Projects for demo-user:', projects)
  
  const allProjects = db.all('SELECT * FROM projects')
  console.log('All projects in database:', allProjects)
} catch (error) {
  console.error('Error:', error)
}
