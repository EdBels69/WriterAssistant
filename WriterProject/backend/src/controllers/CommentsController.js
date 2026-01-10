import express from 'express'

class CommentsController {
  constructor(db) {
    this.router = express.Router()
    this.db = db
    this.routes()
  }

  routes() {
    this.router.get('/project/:projectId', this.getCommentsByProject.bind(this))
    this.router.get('/chapter/:chapterId', this.getCommentsByChapter.bind(this))
    this.router.post('/', this.createComment.bind(this))
    this.router.put('/:id', this.updateComment.bind(this))
    this.router.delete('/:id', this.deleteComment.bind(this))
  }

  getCommentsByProject(req, res) {
    try {
      const { projectId } = req.params
      const comments = this.db.all(`
        SELECT c.*, u.username as author_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.project_id = ?
        ORDER BY c.created_at DESC
      `, [projectId])
      
      res.json({ success: true, comments })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  getCommentsByChapter(req, res) {
    try {
      const { chapterId } = req.params
      const comments = this.db.all(`
        SELECT c.*, u.username as author_name
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.chapter_id = ?
        ORDER BY c.created_at DESC
      `, [chapterId])
      
      res.json({ success: true, comments })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  createComment(req, res) {
    try {
      const { projectId, chapterId, userId, content, position } = req.body

      if (!content || !userId) {
        return res.status(400).json({ success: false, error: 'content and userId are required' })
      }

      const result = this.db.run(`
        INSERT INTO comments (project_id, chapter_id, user_id, content, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [projectId, chapterId, userId, content, position])

      const comment = this.db.get('SELECT * FROM comments WHERE id = ?', [result.lastID])

      res.json({ success: true, comment })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  updateComment(req, res) {
    try {
      const { id } = req.params
      const { content, isResolved } = req.body

      const existing = this.db.get('SELECT * FROM comments WHERE id = ?', [id])
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Comment not found' })
      }

      this.db.run(`
        UPDATE comments 
        SET content = COALESCE(?, content),
            is_resolved = COALESCE(?, is_resolved),
            updated_at = datetime('now')
        WHERE id = ?
      `, [content, isResolved !== undefined ? (isResolved ? 1 : 0) : null, id])

      const comment = this.db.get('SELECT * FROM comments WHERE id = ?', [id])

      res.json({ success: true, comment })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }

  deleteComment(req, res) {
    try {
      const { id } = req.params

      const existing = this.db.get('SELECT * FROM comments WHERE id = ?', [id])
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Comment not found' })
      }

      this.db.run('DELETE FROM comments WHERE id = ?', [id])

      res.json({ success: true, message: 'Comment deleted successfully' })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  }
}

export default CommentsController
