import express from 'express'
import { asyncHandler, NotFoundError, ExternalServiceError } from '../middleware/errorHandler.js'
import { validateBody, projectValidationSchema, updateProjectValidationSchema, chapterValidationSchema, characterValidationSchema, generateIdeasValidationSchema, generateOutlineValidationSchema, expandTextValidationSchema } from '../middleware/validation.js'

class ProjectController {
  constructor(db, glmService) {
    this.db = db
    this.glmService = glmService
    this.router = express.Router()
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get('/', asyncHandler(this.getAllProjects.bind(this)))
    this.router.get('/:id', asyncHandler(this.getProject.bind(this)))
    this.router.post('/', validateBody(projectValidationSchema), asyncHandler(this.createProject.bind(this)))
    this.router.put('/:id', validateBody(updateProjectValidationSchema), asyncHandler(this.updateProject.bind(this)))
    this.router.delete('/:id', asyncHandler(this.deleteProject.bind(this)))
    this.router.get('/:id/chapters', asyncHandler(this.getChapters.bind(this)))
    this.router.post('/:id/chapters', validateBody(chapterValidationSchema), asyncHandler(this.createChapter.bind(this)))
    this.router.get('/:id/characters', asyncHandler(this.getCharacters.bind(this)))
    this.router.post('/:id/characters', validateBody(characterValidationSchema), asyncHandler(this.createCharacter.bind(this)))
    this.router.post('/:id/ideas', validateBody(generateIdeasValidationSchema), asyncHandler(this.generateIdeas.bind(this)))
    this.router.post('/:id/outline', validateBody(generateOutlineValidationSchema), asyncHandler(this.generateOutline.bind(this)))
    this.router.post('/:id/expand', validateBody(expandTextValidationSchema), asyncHandler(this.expandText.bind(this)))
  }

  async getAllProjects(req, res) {
    const { userId } = req.query
    if (!userId) {
      throw new NotFoundError('userId is required')
    }
    const projects = this.db.getProjectsByUserId(userId)
    res.json(projects)
  }

  async getProject(req, res) {
    const project = this.db.getProjectById(req.params.id)
    if (!project) {
      throw new NotFoundError('Project not found')
    }
    const chapters = this.db.getChaptersByProjectId(project.id)
    const characters = this.db.getCharactersByProjectId(project.id)
    res.json({ ...project, chapters, characters })
  }

  async createProject(req, res) {
    const { userId, name, genre, description, targetWords, pipelineType } = req.body
    const project = this.db.createProject(userId, name, genre, description, targetWords, pipelineType)
    res.status(201).json(project)
  }

  async updateProject(req, res) {
    const updates = {}
    if (req.body.name !== undefined) updates.name = req.body.name
    if (req.body.genre !== undefined) updates.genre = req.body.genre
    if (req.body.description !== undefined) updates.description = req.body.description
    if (req.body.targetWords !== undefined) updates.targetWords = req.body.targetWords

    const project = this.db.updateProject(req.params.id, updates)
    if (!project) {
      throw new NotFoundError('Project not found')
    }
    res.json(project)
  }

  async deleteProject(req, res) {
    this.db.deleteProject(req.params.id)
    res.status(204).send()
  }

  async getChapters(req, res) {
    const chapters = this.db.getChaptersByProjectId(req.params.id)
    res.json(chapters)
  }

  async createChapter(req, res) {
    const { title, content, orderIndex } = req.body
    const chapter = this.db.createChapter(req.params.id, title, content || '', orderIndex)
    res.status(201).json(chapter)
  }

  async getCharacters(req, res) {
    const characters = this.db.getCharactersByProjectId(req.params.id)
    res.json(characters)
  }

  async createCharacter(req, res) {
    const { name, role, description, traits, backstory } = req.body
    const character = this.db.createCharacter(
      req.params.id,
      name,
      role,
      description,
      traits,
      backstory
    )
    res.status(201).json(character)
  }

  async generateIdeas(req, res) {
    const { genre, theme, count } = req.body
    const result = await this.glmService.generateIdeas(genre, theme, count)
    if (!result.success) {
      throw new ExternalServiceError(result.error)
    }
    this.db.saveAIRequest(
      req.query.userId,
      req.params.id,
      'generate_ideas',
      `${genre}, ${theme}`,
      result.content,
      result.usage?.total_tokens
    )
    res.json({ ideas: result.content, usage: result.usage })
  }

  async generateOutline(req, res) {
    const { storyIdea, chapters } = req.body
    const result = await this.glmService.generatePlotOutline(storyIdea, chapters)
    if (!result.success) {
      throw new ExternalServiceError(result.error)
    }
    this.db.saveAIRequest(
      req.query.userId,
      req.params.id,
      'generate_outline',
      storyIdea,
      result.content,
      result.usage?.total_tokens
    )
    res.json({ outline: result.content, usage: result.usage })
  }

  async expandText(req, res) {
    const { text, context } = req.body
    const result = await this.glmService.expandText(text, context)
    if (!result.success) {
      throw new ExternalServiceError(result.error)
    }
    this.db.saveAIRequest(
      req.query.userId,
      req.params.id,
      'expand_text',
      text,
      result.content,
      result.usage?.total_tokens
    )
    res.json({ expandedText: result.content, usage: result.usage })
  }
}

export default ProjectController