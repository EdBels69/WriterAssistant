import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'writer-assistant.db')

async function checkDatabase() {
  try {
    const SQL = await initSqlJs()
    let db

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath)
      db = new SQL.Database(buffer)
    } else {
      console.log('❌ Database file does not exist!')
      return
    }

    console.log('✅ Database file exists\n')

    const tables = ['users', 'projects', 'chapters', 'scenes', 'characters', 'writing_sessions', 'goals', 'chat_history', 'ai_requests', 'exports', 'comments']

    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`)
        const count = result[0]?.values[0][0] || 0
        console.log(`${table.padEnd(20)}: ${count} records`)
      } catch (error) {
        console.log(`${table.padEnd(20)}: ❌ Error - ${error.message}`)
      }
    }

    console.log('\n📊 Projects:')
    const projects = db.exec(`SELECT id, name, genre, created_at FROM projects`)
    if (projects.length > 0) {
      projects[0].values.forEach(row => {
        console.log(`  ID: ${row[0]}, Name: ${row[1]}, Genre: ${row[2]}, Created: ${row[3]}`)
      })
    } else {
      console.log('  No projects found')
    }

    console.log('\n💬 Chat History Sessions:')
    const sessions = db.exec(`SELECT DISTINCT session_id, COUNT(*) as message_count FROM chat_history GROUP BY session_id`)
    if (sessions.length > 0) {
      sessions[0].values.forEach(row => {
        console.log(`  Session: ${row[0]}, Messages: ${row[1]}`)
      })
    } else {
      console.log('  No chat sessions found')
    }

    console.log('\n📖 Chapters:')
    const chapters = db.exec(`SELECT id, title, word_count, project_id FROM chapters`)
    if (chapters.length > 0) {
      chapters[0].values.forEach(row => {
        console.log(`  ID: ${row[0]}, Title: ${row[1]}, Words: ${row[2]}, Project ID: ${row[3]}`)
      })
    } else {
      console.log('  No chapters found')
    }

    console.log('\n👥 Characters:')
    const characters = db.exec(`SELECT id, name, role, project_id FROM characters`)
    if (characters.length > 0) {
      characters[0].values.forEach(row => {
        console.log(`  ID: ${row[0]}, Name: ${row[1]}, Role: ${row[2]}, Project ID: ${row[3]}`)
      })
    } else {
      console.log('  No characters found')
    }

  } catch (error) {
    console.error('Error checking database:', error)
  }
}

checkDatabase()