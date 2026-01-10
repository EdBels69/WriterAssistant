import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'

class Database {
  constructor() {
    this.db = null
    this.SQL = null
    this.dbPath = path.join(process.cwd(), 'data', 'writer-assistant.db')
    this.initialized = false
  }

  async init() {
    if (this.initialized) return

    try {
      this.SQL = await initSqlJs()

      const dataDir = path.dirname(this.dbPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath)
        this.db = new this.SQL.Database(buffer)
      } else {
        this.db = new this.SQL.Database()
        this.initTables()
        this.save()
      }

      this.initialized = true
      console.log('Database initialized successfully')
    } catch (error) {
      console.error('Error initializing database:', error)
      throw error
    }
  }

  initTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        settings TEXT
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        genre TEXT,
        description TEXT,
        target_words INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        title TEXT NOT NULL,
        content TEXT,
        order_index INTEGER DEFAULT 0,
        word_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER,
        title TEXT,
        content TEXT,
        order_index INTEGER DEFAULT 0,
        word_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        role TEXT,
        traits TEXT,
        background TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS writing_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        duration_seconds INTEGER DEFAULT 0,
        words_written INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        type TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        current_value INTEGER DEFAULT 0,
        deadline DATETIME,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS ai_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        request_type TEXT NOT NULL,
        input_data TEXT,
        output_data TEXT,
        tokens_used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS exports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        format TEXT NOT NULL,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        chapter_id INTEGER,
        user_id INTEGER,
        content TEXT NOT NULL,
        position TEXT,
        is_resolved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (chapter_id) REFERENCES chapters(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `)
  }

  save() {
    if (!this.db) return

    try {
      const data = this.db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(this.dbPath, buffer)
    } catch (error) {
      console.error('Error saving database:', error)
      throw error
    }
  }

  query(sql, params = []) {
    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    const result = []
    while (stmt.step()) {
      result.push(stmt.getAsObject())
    }
    stmt.free()
    return result
  }

  run(sql, params = []) {
    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    stmt.run()
    stmt.free()
    return this.db.getRowsModified()
  }

  get(sql, params = []) {
    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    const row = stmt.step() ? stmt.getAsObject() : null
    stmt.free()
    return row
  }

  all(sql, params = []) {
    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    const result = []
    while (stmt.step()) {
      result.push(stmt.getAsObject())
    }
    stmt.free()
    return result
  }

  createProject(userId, name, genre, description, targetWords) {
    this.run(
      `INSERT INTO projects (user_id, name, genre, description, target_words) VALUES (?, ?, ?, ?, ?)`,
      [userId, name, genre, description, targetWords]
    )
    this.save()
    return this.get('SELECT * FROM projects WHERE id = last_insert_rowid()')
  }

  getProjectsByUserId(userId) {
    return this.all('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', [userId])
  }

  getProjectById(id) {
    return this.get('SELECT * FROM projects WHERE id = ?', [id])
  }

  updateProject(id, updates) {
    const fields = []
    const values = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    
    if (fields.length > 0) {
      values.push(id)
      this.run(`UPDATE projects SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values)
      this.save()
    }
    
    return this.getProjectById(id)
  }

  deleteProject(id) {
    this.run('DELETE FROM projects WHERE id = ?', [id])
    this.save()
  }

  createChapter(projectId, title, content) {
    const wordCount = content ? content.split(/\s+/).length : 0
    this.run(
      `INSERT INTO chapters (project_id, title, content, word_count) VALUES (?, ?, ?, ?)`,
      [projectId, title, content, wordCount]
    )
    this.save()
    return this.get('SELECT * FROM chapters WHERE id = last_insert_rowid()')
  }

  getChaptersByProjectId(projectId) {
    return this.all('SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index', [projectId])
  }

  createCharacter(projectId, name, description, role, traits, background) {
    this.run(
      `INSERT INTO characters (project_id, name, description, role, traits, background) VALUES (?, ?, ?, ?, ?, ?)`,
      [projectId, name, description, role, traits, background]
    )
    this.save()
    return this.get('SELECT * FROM characters WHERE id = last_insert_rowid()')
  }

  getCharactersByProjectId(projectId) {
    return this.all('SELECT * FROM characters WHERE project_id = ?', [projectId])
  }

  createWritingSession(userId, projectId) {
    this.run(
      `INSERT INTO writing_sessions (user_id, project_id, started_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [userId, projectId]
    )
    this.save()
    return this.get('SELECT * FROM writing_sessions WHERE id = last_insert_rowid()')
  }

  updateWritingSession(id, updates) {
    const fields = []
    const values = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    
    if (fields.length > 0) {
      values.push(id)
      this.run(`UPDATE writing_sessions SET ${fields.join(', ')} WHERE id = ?`, values)
      this.save()
    }
    
    return this.get('SELECT * FROM writing_sessions WHERE id = ?', [id])
  }

  getWritingSessionsByUserId(userId, limit = 50) {
    return this.all(
      `SELECT * FROM writing_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?`,
      [userId, limit]
    )
  }

  createGoal(userId, projectId, type, targetValue, deadline) {
    this.run(
      `INSERT INTO goals (user_id, project_id, type, target_value, deadline) VALUES (?, ?, ?, ?, ?)`,
      [userId, projectId, type, targetValue, deadline]
    )
    this.save()
    return this.get('SELECT * FROM goals WHERE id = last_insert_rowid()')
  }

  getGoalsByUserId(userId) {
    return this.all('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', [userId])
  }

  updateGoal(id, updates) {
    const fields = []
    const values = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    
    if (fields.length > 0) {
      values.push(id)
      this.run(`UPDATE goals SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values)
      this.save()
    }
    
    return this.get('SELECT * FROM goals WHERE id = ?', [id])
  }

  saveChatMessage(userId, projectId, sessionId, role, content) {
    this.run(
      `INSERT INTO chat_history (user_id, project_id, session_id, role, content) VALUES (?, ?, ?, ?, ?)`,
      [userId, projectId, sessionId, role, content]
    )
    this.save()
    return this.get('SELECT * FROM chat_history WHERE id = last_insert_rowid()')
  }

  getChatHistoryBySession(sessionId) {
    return this.all('SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at', [sessionId])
  }

  saveAIRequest(userId, projectId, requestType, inputData, outputData, tokensUsed) {
    this.run(
      `INSERT INTO ai_requests (user_id, project_id, request_type, input_data, output_data, tokens_used) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, projectId, requestType, inputData, outputData, tokensUsed]
    )
    this.save()
  }

  getUserStatistics(userId) {
    const projectCount = this.get('SELECT COUNT(*) as count FROM projects WHERE user_id = ?', [userId])?.count || 0
    
    const totalWords = this.get(`
      SELECT SUM(word_count) as total FROM chapters
      WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)
    `, [userId])?.total || 0
    
    const totalSessions = this.get('SELECT COUNT(*) as count FROM writing_sessions WHERE user_id = ?', [userId])?.count || 0
    
    const totalTime = this.get('SELECT SUM(duration_seconds) as total FROM writing_sessions WHERE user_id = ?', [userId])?.total || 0
    
    return {
      projectCount,
      totalWords,
      totalSessions,
      totalTime
    }
  }
}

export default Database