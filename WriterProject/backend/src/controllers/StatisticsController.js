import express from 'express'
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js'
import { validateBody, goalValidationSchema as createGoalValidationSchema, updateGoalValidationSchema } from '../middleware/validation.js'

class StatisticsController {
  constructor(db) {
    this.db = db
    this.router = express.Router()
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get('/overview/:userId', asyncHandler(this.getOverview.bind(this)))
    this.router.get('/productivity/:userId', asyncHandler(this.getProductivity.bind(this)))
    this.router.get('/sessions/:userId', asyncHandler(this.getSessions.bind(this)))
    this.router.get('/goals/:userId', asyncHandler(this.getGoals.bind(this)))
    this.router.post('/goals', validateBody(createGoalValidationSchema), asyncHandler(this.createGoal.bind(this)))
    this.router.put('/goals/:id', validateBody(updateGoalValidationSchema), asyncHandler(this.updateGoal.bind(this)))
    this.router.delete('/goals/:id', asyncHandler(this.deleteGoal.bind(this)))
  }

  async getOverview(req, res) {
    const userId = req.params.userId
    const stats = this.db.getUserStatistics(userId)

    const projects = this.db.getProjectsByUserId(userId)
    const totalChapters = projects.reduce((acc, project) => {
      return acc + this.db.getChaptersByProjectId(project.id).length
    }, 0)

    const recentSessions = this.db.getWritingSessionsByUserId(userId, 5)

    const averageSessionTime = recentSessions.length > 0
      ? Math.round(recentSessions.reduce((acc, session) => acc + session.duration_seconds, 0) / recentSessions.length / 60)
      : 0

    const averageWordsPerSession = recentSessions.length > 0
      ? Math.round(recentSessions.reduce((acc, session) => acc + session.words_written, 0) / recentSessions.length)
      : 0

    const totalGoals = this.db.getGoalsByUserId(userId)
    const activeGoals = totalGoals.filter(g => g.status === 'active')
    const completedGoals = totalGoals.filter(g => g.status === 'completed')

    res.json({
      projectCount: stats.projectCount,
      totalWords: stats.totalWords,
      totalChapters,
      totalSessions: stats.totalSessions,
      totalTime: Math.round(stats.totalTime / 60),
      averageSessionTime,
      averageWordsPerSession,
      totalGoals: totalGoals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      recentSessions: recentSessions.map(s => ({
        ...s,
        duration: Math.round(s.duration_seconds / 60)
      }))
    })
  }

  async getProductivity(req, res) {
    const userId = req.params.userId
    const { days = 30 } = req.query

    const stmt = this.db.db.prepare(`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as sessions,
        SUM(words_written) as words,
        SUM(duration_seconds) as duration
      FROM writing_sessions
      WHERE user_id = ? 
        AND started_at >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(started_at)
      ORDER BY date DESC
    `)
    const dailyData = stmt.all(userId, days)

    const projects = this.db.getProjectsByUserId(userId)
    const projectProductivity = projects.map(project => {
      const chapters = this.db.getChaptersByProjectId(project.id)
      const totalWords = chapters.reduce((acc, chapter) => acc + (chapter.word_count || 0), 0)
      return {
        id: project.id,
        name: project.name,
        totalWords,
        chaptersCount: chapters.length,
        progress: project.target_words > 0 ? Math.round((totalWords / project.target_words) * 100) : 0
      }
    })

    res.json({
      daily: dailyData,
      byProject: projectProductivity
    })
  }

  async getSessions(req, res) {
    const userId = req.params.userId
    const { limit = 50, projectId } = req.query

    let stmt
    if (projectId) {
      stmt = this.db.db.prepare(`
        SELECT * FROM writing_sessions
        WHERE user_id = ? AND project_id = ?
        ORDER BY started_at DESC
        LIMIT ?
      `)
      const sessions = stmt.all(userId, projectId, limit)
      res.json(sessions.map(s => ({
        ...s,
        duration: Math.round(s.duration_seconds / 60)
      })))
    } else {
      const sessions = this.db.getWritingSessionsByUserId(userId, limit)
      res.json(sessions.map(s => ({
        ...s,
        duration: Math.round(s.duration_seconds / 60)
      })))
    }
  }

  async getGoals(req, res) {
    const userId = req.params.userId
    const { status } = req.query

    let goals = this.db.getGoalsByUserId(userId)

    if (status) {
      goals = goals.filter(g => g.status === status)
    }

    goals = goals.map(goal => ({
      ...goal,
      progress: Math.round((goal.current_value / goal.target_value) * 100)
    }))

    res.json(goals)
  }

  async createGoal(req, res) {
    const { userId, projectId, type, targetValue, deadline } = req.body
    const goal = this.db.createGoal(userId, projectId, type, targetValue, deadline)
    res.status(201).json(goal)
  }

  async updateGoal(req, res) {
    const { currentValue, status } = req.body
    const updates = {}
    if (currentValue !== undefined) updates.current_value = currentValue
    if (status !== undefined) updates.status = status

    const goal = this.db.updateGoal(req.params.id, updates)
    if (!goal) {
      throw new NotFoundError('Goal not found')
    }
    res.json(goal)
  }

  async deleteGoal(req, res) {
    const stmt = this.db.db.prepare('DELETE FROM goals WHERE id = ?')
    stmt.run(req.params.id)
    res.status(204).send()
  }
}

export default StatisticsController