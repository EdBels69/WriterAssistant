import express from 'express'

class ProjectController {
  constructor(db, glmService) {
    this.db = db
    this.glmService = glmService
    this.router = express.Router()
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get('/', this.getAllProjects.bind(this))
    this.router.get('/:id', this.getProject.bind(this))
    this.router.post('/', this.createProject.bind(this))
    this.router.put('/:id', this.updateProject.bind(this))
    this.router.delete('/:id', this.deleteProject.bind(this))
    this.router.get('/:id/chapters', this.getChapters.bind(this))
    this.router.post('/:id/chapters', this.createChapter.bind(this))
    this.router.get('/:id/characters', this.getCharacters.bind(this))
    this.router.post('/:id/characters', this.createCharacter.bind(this))
    this.router.post('/:id/ideas', this.generateIdeas.bind(this))
    this.router.post('/:id/outline', this.generateOutline.bind(this))
    this.router.post('/:id/expand', this.expandText.bind(this))
  }

  async getAllProjects(req, res) {
    try {
      const { userId } = req.query
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
      }
      const projects = this.db.getProjectsByUserId(userId)
      res.json(projects)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async getProject(req, res) {
    try {
      const project = this.db.getProjectById(req.params.id)
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }
      const chapters = this.db.getChaptersByProjectId(project.id)
      const characters = this.db.getCharactersByProjectId(project.id)
      res.json({ ...project, chapters, characters })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async createProject(req, res) {
    try {
      const { userId, name, genre, description, targetWords } = req.body
      if (!userId || !name) {
        return res.status(400).json({ error: 'userId and name are required' })
      }
      const project = this.db.createProject(userId, name, genre, description, targetWords)
      res.status(201).json(project)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async updateProject(req, res) {
    try {
      const updates = {}
      if (req.body.name !== undefined) updates.name = req.body.name
      if (req.body.genre !== undefined) updates.genre = req.body.genre
      if (req.body.description !== undefined) updates.description = req.body.description
      if (req.body.targetWords !== undefined) updates.targetWords = req.body.targetWords

      const project = this.db.updateProject(req.params.id, updates)
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }
      res.json(project)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async deleteProject(req, res) {
    try {
      this.db.deleteProject(req.params.id)
      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async getChapters(req, res) {
    try {
      const chapters = this.db.getChaptersByProjectId(req.params.id)
      res.json(chapters)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async createChapter(req, res) {
    try {
      const { title, orderIndex } = req.body
      if (!title) {
        return res.status(400).json({ error: 'title is required' })
      }
      const chapter = this.db.createChapter(req.params.id, title, orderIndex)
      res.status(201).json(chapter)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async getCharacters(req, res) {
    try {
      const characters = this.db.getCharactersByProjectId(req.params.id)
      res.json(characters)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async createCharacter(req, res) {
    try {
      const { name, role, description, traits, backstory } = req.body
      if (!name) {
        return res.status(400).json({ error: 'name is required' })
      }
      const character = this.db.createCharacter(
        req.params.id,
        name,
        role,
        description,
        traits,
        backstory
      )
      res.status(201).json(character)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateIdeas(req, res) {
    try {
      const { genre, theme, count } = req.body
      if (!genre || !theme) {
        return res.status(400).json({ error: 'genre and theme are required' })
      }
      const result = await this.glmService.generateIdeas(genre, theme, count)
      if (result.success) {
        this.db.saveAIRequest(
          req.query.userId,
          req.params.id,
          'generate_ideas',
          `${genre}, ${theme}`,
          result.content,
          result.usage?.total_tokens
        )
        res.json({ ideas: result.content, usage: result.usage })
      } else {
        res.status(500).json({ error: result.error })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateOutline(req, res) {
    try {
      const { storyIdea, chapters } = req.body
      if (!storyIdea) {
        return res.status(400).json({ error: 'storyIdea is required' })
      }
      const result = await this.glmService.generatePlotOutline(storyIdea, chapters)
      if (result.success) {
        this.db.saveAIRequest(
          req.query.userId,
          req.params.id,
          'generate_outline',
          storyIdea,
          result.content,
          result.usage?.total_tokens
        )
        res.json({ outline: result.content, usage: result.usage })
      } else {
        res.status(500).json({ error: result.error })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async expandText(req, res) {
    try {
      const { text, context } = req.body
      if (!text) {
        return res.status(400).json({ error: 'text is required' })
      }
      const result = await this.glmService.expandText(text, context)
      if (result.success) {
        this.db.saveAIRequest(
          req.query.userId,
          req.params.id,
          'expand_text',
          text,
          result.content,
          result.usage?.total_tokens
        )
        res.json({ expandedText: result.content, usage: result.usage })
      } else {
        res.status(500).json({ error: result.error })
      }
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

export default ProjectController