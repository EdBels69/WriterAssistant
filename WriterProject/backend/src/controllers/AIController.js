import express from 'express'
import TextChunkingService from '../services/TextChunkingService.js'
import MultiAgentService from '../services/MultiAgentService.js'
import SmartRouter from '../services/SmartRouter.js'

class AIController {
  constructor(glmService, smartRouter = null) {
    this.router = express.Router()
    this.glmService = glmService
    this.smartRouter = smartRouter || new SmartRouter(
      process.env.GLM_API_KEY,
      process.env.GLM_SECONDARY_API_KEY
    )
    this.chunkingService = new TextChunkingService()
    this.multiAgentService = new MultiAgentService()
    this.routes()
  }

  routes() {
    this.router.post('/ideas', this.generateIdeas.bind(this))
    this.router.post('/expand', this.expandText.bind(this))
    this.router.post('/style', this.editStyle.bind(this))
    this.router.post('/style-editing', this.styleEditing.bind(this))
    this.router.post('/character', this.generateCharacter.bind(this))
    this.router.post('/plot', this.generatePlotOutline.bind(this))
    this.router.post('/dialogue', this.generateDialogue.bind(this))
    this.router.post('/improve', this.improveWriting.bind(this))
    this.router.post('/description', this.generateDescription.bind(this))
    this.router.post('/analyze', this.analyzeText.bind(this))
    this.router.post('/brainstorm', this.brainstorm.bind(this))
    this.router.post('/hypothesis', this.generateHypothesis.bind(this))
    this.router.post('/structure-ideas', this.structureIdeas.bind(this))
    this.router.post('/structure-methodology', this.structureMethodology.bind(this))
    this.router.post('/literature-review', this.literatureReview.bind(this))
    this.router.post('/statistical-analysis', this.statisticalAnalysis.bind(this))
    this.router.post('/process-large-text', this.processLargeText.bind(this))
    this.router.post('/research-design', this.generateResearchDesign.bind(this))
    this.router.post('/analyze-results', this.analyzeResults.bind(this))
    this.router.post('/generate-discussion', this.generateDiscussion.bind(this))
    this.router.post('/generate-conclusion', this.generateConclusion.bind(this))
    this.router.post('/improve-academic-style', this.improveAcademicStyle.bind(this))
    this.router.post('/analyze-upload', this.analyzeUpload.bind(this))
    this.router.post('/edit-upload', this.editUpload.bind(this))
    this.router.post('/extract-references', this.extractReferences.bind(this))
    this.router.post('/synthesize-uploads', this.synthesizeUploads.bind(this))
    this.router.post('/chat', this.chat.bind(this))
    this.router.post('/multiagent', this.executeMultiAgent.bind(this))
    this.router.post('/multiagent/pipelines', this.getPipelines.bind(this))
    this.router.post('/multiagent/hypothesis', this.multiAgentHypothesis.bind(this))
    this.router.post('/multiagent/structure-ideas', this.multiAgentStructureIdeas.bind(this))
    this.router.post('/multiagent/literature-review', this.multiAgentLiteratureReview.bind(this))
    this.router.post('/multiagent/meta-analysis', this.multiAgentMetaAnalysis.bind(this))
    this.router.post('/code/generate', this.generateCode.bind(this))
    this.router.post('/code/review', this.reviewCode.bind(this))
    this.router.post('/code/debug', this.debugCode.bind(this))
    this.router.post('/code/optimize', this.optimizeCode.bind(this))
    this.router.post('/code/explain', this.explainCode.bind(this))
    this.router.post('/code/refactor', this.refactorCode.bind(this))
    this.router.post('/code/tests', this.generateTests.bind(this))
    this.router.post('/code/documentation', this.generateDocumentation.bind(this))
  }

  async generateIdeas(req, res) {
    try {
      const { genre, theme, count = 5, text, provider, openRouterKey } = req.body
      if (!genre || !theme) {
        return res.status(400).json({ error: 'genre and theme are required' })
      }
      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }
      const result = provider 
        ? await this.smartRouter.routeRequest('idea generation', `Generate ${count} ideas for ${genre} with theme: ${theme}${text ? `. Context: ${text}` : ''}`, {
            systemPrompt: 'You are a creative writing assistant specialized in generating unique and engaging story ideas.',
            temperature: 0.8,
            maxTokens: 2048,
            priority: 'balanced',
            forceProvider: provider
          })
        : await this.glmService.generateIdeas(genre, theme, count, text)
      res.json(result)
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
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async editStyle(req, res) {
    try {
      const { text, targetStyle, provider, useChunking = false } = req.body
      if (!text || !targetStyle) {
        return res.status(400).json({ error: 'text and targetStyle are required' })
      }
      
      const systemPrompt = `You are an expert academic editor. Edit the following text to achieve ${targetStyle} style while maintaining academic rigor and clarity. Improve grammar, flow, and coherence.`
      
      const userPrompt = `Edit the following text to achieve a ${targetStyle} style:\n\n${text}\n\nProvide the edited version with clear improvements to grammar, vocabulary, and flow.`
      
      let result
      
      if (useChunking || text.length > 8000) {
        console.log(`[AIController] Using chunked processing for text editing (${text.length} chars)`)
        result = await this.smartRouter.routeRequestWithChunking('style editing', text, {
          systemPrompt,
          provider: provider || 'qwen',
          onProgress: (progress) => {
            console.log(`[AIController] Style editing progress: ${progress.percentage}%`)
          }
        })
      } else {
        result = await this.smartRouter.routeRequest('style editing', userPrompt, {
          systemPrompt,
          temperature: 0.7,
          maxTokens: 2048,
          priority: 'balanced',
          forceProvider: provider
        })
      }
      
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async styleEditing(req, res) {
    try {
      const { text, targetStyle, provider, openRouterKey, useChunking = false } = req.body
      if (!text || !targetStyle) {
        return res.status(400).json({ error: 'text and targetStyle are required' })
      }

      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }

      const systemPrompt = `You are an expert academic editor specializing in ${targetStyle} style. Improve clarity, grammar, academic tone, and coherence while preserving the original meaning and scientific accuracy.`

      const selectedProvider = provider || 'qwen'
      console.log(`[AIController] Style editing using provider: ${selectedProvider}, chunking: ${useChunking}`)

      const result = await this.smartRouter.routeRequestWithChunking('style editing', text, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 4096,
        priority: 'balanced',
        forceProvider: selectedProvider,
        provider: selectedProvider
      })

      res.json({
        success: true,
        content: result.content,
        provider: result.provider,
        usage: result.usage
      })
    } catch (error) {
      console.error('[AIController] Style editing error:', error.message)
      res.status(500).json({ error: error.message })
    }
  }

  async generateCharacter(req, res) {
    try {
      const { name, role, genre } = req.body
      if (!name || !role || !genre) {
        return res.status(400).json({ error: 'name, role, and genre are required' })
      }
      const result = await this.glmService.generateCharacter(name, role, genre)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generatePlotOutline(req, res) {
    try {
      const { storyIdea, chapters = 10 } = req.body
      if (!storyIdea) {
        return res.status(400).json({ error: 'storyIdea is required' })
      }
      const result = await this.glmService.generatePlotOutline(storyIdea, chapters)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateDialogue(req, res) {
    try {
      const { character1, character2, situation, tone } = req.body
      if (!character1 || !character2 || !situation) {
        return res.status(400).json({ error: 'character1, character2, and situation are required' })
      }
      const result = await this.glmService.generateDialogue(character1, character2, situation, tone)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async improveWriting(req, res) {
    try {
      const { text, focusArea = 'general' } = req.body
      if (!text) {
        return res.status(400).json({ error: 'text is required' })
      }
      const result = await this.glmService.improveWriting(text, focusArea)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateDescription(req, res) {
    try {
      const { scene, type = 'visual' } = req.body
      if (!scene) {
        return res.status(400).json({ error: 'scene is required' })
      }
      const result = await this.glmService.generateDescription(scene, type)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async analyzeText(req, res) {
    try {
      const { text, analysisType = 'general' } = req.body
      if (!text) {
        return res.status(400).json({ error: 'text is required' })
      }
      const result = await this.glmService.analyzeText(text, analysisType)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async brainstorm(req, res) {
    try {
      const { topic, category = 'ideas', context = '' } = req.body
      if (!topic) {
        return res.status(400).json({ error: 'topic is required' })
      }
      const result = await this.smartRouter.brainstorm(topic, context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async chat(req, res) {
    try {
      const { message, context = {} } = req.body
      if (!message) {
        return res.status(400).json({ error: 'message is required' })
      }

      const contextSummary = context.lastTools 
        ? `\n\nРекомендуемые инструменты для продолжения диалога: ${context.lastTools.join(', ')}` 
        : ''

      const prompt = `Вы ИИ-ассистент для научных исследований. Отвечайте на вопросы пользователя, помогайте генерировать идеи, структурировать мысли и давать рекомендации по научной работе.

Пользователь: ${message}${contextSummary}

Отвечайте в профессиональном академическом стиле. При возможности предлагайте конкретные инструменты для продолжения работы.`

      const result = await this.glmService.generateCompletion(prompt, { maxTokens: 2000 })

      const content = result.content || ''
      const suggestedTools = this.extractSuggestedTools(content)

      res.json({
        response: content,
        metadata: {
          suggestedTools
        }
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  extractSuggestedTools(text) {
    const tools = [
      'Структурирование идей',
      'Извлечение ссылок',
      'Генерация гипотез',
      'Методология',
      'Нарративный обзор',
      'Систематический обзор',
      'Мета-анализ',
      'Академический стиль'
    ]

    const suggested = []
    const lowerText = text.toLowerCase()

    if (lowerText.includes('идеи') || lowerText.includes('структур') || lowerText.includes('концепту')) {
      suggested.push('Структурирование идей')
    }
    if (lowerText.includes('ссылк') || lowerText.includes('библиограф') || lowerText.includes('источник')) {
      suggested.push('Извлечение ссылок')
    }
    if (lowerText.includes('гипотез') || lowerText.includes('исследовательский вопрос')) {
      suggested.push('Генерация гипотез')
    }
    if (lowerText.includes('метод') || lowerText.includes('дизайн') || lowerText.includes('план')) {
      suggested.push('Методология')
    }
    if (lowerText.includes('обзор') && lowerText.includes('литератур')) {
      suggested.push('Нарративный обзор')
    }
    if (lowerText.includes('систематическ')) {
      suggested.push('Систематический обзор')
    }
    if (lowerText.includes('мета-анализ') || lowerText.includes('метаанализ')) {
      suggested.push('Мета-анализ')
    }
    if (lowerText.includes('стил') || lowerText.includes('редактирован')) {
      suggested.push('Академический стиль')
    }

    return suggested
  }

  async generateHypothesis(req, res) {
    try {
      const { researchArea, researchQuestion, context = '' } = req.body
      if (!researchArea || !researchQuestion) {
        return res.status(400).json({ error: 'researchArea and researchQuestion are required' })
      }
      const result = await this.smartRouter.generateHypothesis(researchArea, researchQuestion, context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async structureIdeas(req, res) {
    try {
      const { sources, researchGoal, context = '', provider, openRouterKey } = req.body
      if (!sources || !researchGoal) {
        return res.status(400).json({ error: 'sources and researchGoal are required' })
      }
      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }
      const result = provider 
        ? await this.smartRouter.routeRequest('structure ideas', `Structure the following sources with research goal: ${researchGoal}\n\nSources: ${sources}`, {
            systemPrompt: 'You are an expert academic assistant specializing in structuring and organizing research ideas and sources.',
            temperature: 0.7,
            maxTokens: 4096,
            priority: 'balanced',
            forceProvider: provider
          })
        : await this.smartRouter.structureIdeas(sources, researchGoal, context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async structureMethodology(req, res) {
    try {
      const { researchArea, researchQuestion, context = '' } = req.body
      if (!researchArea || !researchQuestion) {
        return res.status(400).json({ error: 'researchArea and researchQuestion are required' })
      }
      const result = await this.smartRouter.structureMethodology(researchArea, researchQuestion, context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async literatureReview(req, res) {
    try {
      const { topic, reviewType = 'narrative', context = '', provider, openRouterKey, text } = req.body
      if (!topic) {
        return res.status(400).json({ error: 'topic is required' })
      }
      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }
      const result = provider 
        ? await this.smartRouter.routeRequest('literature review', `Generate a ${reviewType} literature review on: ${topic}${context ? `\n\nContext: ${context}` : ''}${text ? `\n\nText: ${text}` : ''}`, {
            systemPrompt: `You are an expert academic researcher specializing in ${reviewType} literature reviews. Provide comprehensive, well-structured reviews with proper citations.`,
            temperature: 0.7,
            maxTokens: 4096,
            priority: 'balanced',
            forceProvider: provider
          })
        : await this.smartRouter.literatureReview(topic, reviewType, context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async statisticalAnalysis(req, res) {
    try {
      const { researchQuestion, dataDescription, context = '', provider, openRouterKey, analysisGoal, text } = req.body
      if (!researchQuestion || !dataDescription) {
        return res.status(400).json({ error: 'researchQuestion and dataDescription are required' })
      }
      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }
      const result = provider 
        ? await this.smartRouter.routeRequest('statistical analysis', `Statistical analysis for research: ${researchQuestion}\n\nData: ${dataDescription}${analysisGoal ? `\n\nGoal: ${analysisGoal}` : ''}${context ? `\n\nContext: ${context}` : ''}${text ? `\n\nText: ${text}` : ''}`, {
            systemPrompt: 'You are an expert statistician providing detailed statistical analysis and recommendations.',
            temperature: 0.7,
            maxTokens: 4096,
            priority: 'balanced',
            forceProvider: provider
          })
        : await this.smartRouter.statisticalAnalysis(researchQuestion, dataDescription, context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async processLargeText(req, res) {
    try {
      const { text, task, options = {} } = req.body
      if (!text || !task) {
        return res.status(400).json({ error: 'text and task are required' })
      }

      const processFunction = async (chunk, context) => {
        switch (task) {
          case 'edit':
            return await this.glmService.editText(chunk, context)
          case 'improve':
            return await this.glmService.improveWriting(chunk)
          case 'summarize':
            return await this.glmService.summarizeText(chunk)
          case 'analyze':
            return await this.glmService.analyzeText(chunk)
          default:
            throw new Error(`Unknown task: ${task}`)
        }
      }

      const result = await this.chunkingService.processLargeText(text, processFunction, {
        onProgress: options.onProgress,
        maxRetries: options.maxRetries || 3,
        delay: options.delay || 1000
      })

      const mergedContent = await this.chunkingService.mergeProcessedChunks(
        result.chunks,
        options.mergeStrategy || 'sequential'
      )

      res.json({
        success: true,
        content: mergedContent,
        metadata: {
          totalChunks: result.totalChunks,
          errors: result.errors
        }
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateResearchDesign(req, res) {
    try {
      const { researchQuestion, researchType, provider, openRouterKey, text } = req.body
      if (!researchQuestion || !researchType) {
        return res.status(400).json({ error: 'researchQuestion and researchType are required' })
      }
      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }
      const result = provider 
        ? await this.smartRouter.routeRequest('research design', `Generate a ${researchType} research design for: ${researchQuestion}${text ? `\n\nText: ${text}` : ''}`, {
            systemPrompt: 'You are an expert research methodology consultant. Design rigorous and feasible research studies.',
            temperature: 0.7,
            maxTokens: 4096,
            priority: 'balanced',
            forceProvider: provider
          })
        : await this.glmService.generateResearchDesign(researchQuestion, researchType)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async analyzeResults(req, res) {
    try {
      const { results, researchQuestion, provider, openRouterKey, context, text } = req.body
      if (!results || !researchQuestion) {
        return res.status(400).json({ error: 'results and researchQuestion are required' })
      }
      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }
      const result = provider 
        ? await this.smartRouter.routeRequest('analyze results', `Analyze research results for: ${researchQuestion}\n\nResults: ${results}${context ? `\n\nContext: ${context}` : ''}${text ? `\n\nText: ${text}` : ''}`, {
            systemPrompt: 'You are an expert research analyst providing detailed interpretation of research results.',
            temperature: 0.7,
            maxTokens: 4096,
            priority: 'balanced',
            forceProvider: provider
          })
        : await this.glmService.analyzeResults(results, researchQuestion)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateDiscussion(req, res) {
    try {
      const { results, limitations, implications, context = '', provider, openRouterKey, text } = req.body
      if (!results) {
        return res.status(400).json({ error: 'results is required' })
      }
      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }
      const result = provider 
        ? await this.smartRouter.routeRequest('generate discussion', `Generate a discussion section for research with results: ${results}${limitations ? `\n\nLimitations: ${limitations}` : ''}${implications ? `\n\nImplications: ${implications}` : ''}${context ? `\n\nContext: ${context}` : ''}${text ? `\n\nText: ${text}` : ''}`, {
            systemPrompt: 'You are an expert academic writer creating discussion sections that interpret results, acknowledge limitations, and discuss implications.',
            temperature: 0.7,
            maxTokens: 4096,
            priority: 'balanced',
            forceProvider: provider
          })
        : await this.smartRouter.generateDiscussion(results, limitations || '', implications || '', context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateConclusion(req, res) {
    try {
      const { mainFindings, implications, futureDirections, context = '', provider, openRouterKey, text } = req.body
      if (!mainFindings) {
        return res.status(400).json({ error: 'mainFindings is required' })
      }
      if (openRouterKey) {
        this.smartRouter.openRouterApiKey = openRouterKey
        console.log('[AIController] OpenRouter API key updated from request')
      }
      const result = provider 
        ? await this.smartRouter.routeRequest('generate conclusion', `Generate a conclusion section for research with main findings: ${mainFindings}${implications ? `\n\nImplications: ${implications}` : ''}${futureDirections ? `\n\nFuture directions: ${futureDirections}` : ''}${context ? `\n\nContext: ${context}` : ''}${text ? `\n\nText: ${text}` : ''}`, {
            systemPrompt: 'You are an expert academic writer creating conclusion sections that summarize key findings, discuss implications, and suggest future directions.',
            temperature: 0.7,
            maxTokens: 4096,
            priority: 'balanced',
            forceProvider: provider
          })
        : await this.smartRouter.generateConclusion(mainFindings, implications || '', futureDirections || '', context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async improveAcademicStyle(req, res) {
    try {
      const { text, targetAudience = 'academic' } = req.body
      if (!text) {
        return res.status(400).json({ error: 'text is required' })
      }
      
      const systemPrompt = `You are an expert academic editor specializing in ${targetAudience} writing. Improve the text's clarity, grammar, academic tone, and coherence while preserving the original meaning. Ensure the text meets high academic standards.`
      
      const userPrompt = `Improve the academic style of the following text for a ${targetAudience} audience:\n\n${text}\n\nProvide the improved version with specific changes explained.`
      
      const result = await this.smartRouter.routeRequest('style improvement', userPrompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2048,
        priority: 'balanced'
      })
      
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async analyzeUpload(req, res) {
    try {
      const { fileContent, fileName, analysisType = 'comprehensive' } = req.body
      if (!fileContent || !fileName) {
        return res.status(400).json({ error: 'fileContent and fileName are required' })
      }
      const result = await this.glmService.analyzeUploadedFile(fileContent, fileName, analysisType)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async editUpload(req, res) {
    try {
      const { fileContent, fileName, editType = 'academic', instructions = '' } = req.body
      if (!fileContent || !fileName) {
        return res.status(400).json({ error: 'fileContent and fileName are required' })
      }
      const result = await this.glmService.editUploadedFile(fileContent, fileName, editType, instructions)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async extractReferences(req, res) {
    try {
      const { fileContent, fileName } = req.body
      if (!fileContent || !fileName) {
        return res.status(400).json({ error: 'fileContent and fileName are required' })
      }
      const result = await this.glmService.extractReferencesFromUpload(fileContent, fileName)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async synthesizeUploads(req, res) {
    try {
      const { uploadedFiles, researchGoal } = req.body
      if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
        return res.status(400).json({ error: 'uploadedFiles is required and must be a non-empty array' })
      }
      if (!researchGoal) {
        return res.status(400).json({ error: 'researchGoal is required' })
      }
      const result = await this.glmService.synthesizeMultipleUploads(uploadedFiles, researchGoal)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async executeMultiAgent(req, res) {
    try {
      const { task, agents, apiKeys } = req.body
      if (!task) {
        return res.status(400).json({ error: 'task is required' })
      }

      if (apiKeys) {
        this.multiAgentService.updateAPIKeys(apiKeys)
      }

      const result = await this.multiAgentService.executeABMCTS(task, agents)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async getPipelines(req, res) {
    try {
      const pipelines = this.multiAgentService.getPipelines()
      res.json(pipelines)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async multiAgentHypothesis(req, res) {
    try {
      const { researchArea, researchQuestion, context, data, apiKeys } = req.body
      if (!researchArea || !researchQuestion) {
        return res.status(400).json({ error: 'researchArea and researchQuestion are required' })
      }

      if (apiKeys) {
        this.multiAgentService.updateAPIKeys(apiKeys)
      }

      const pipeline = this.multiAgentService.getPipelines().hypothesisGeneration
      const task = {
        type: 'hypothesis_generation',
        description: `Генерация научной гипотезы для исследования в области "${researchArea}"`,
        context: context || '',
        data: {
          researchArea,
          researchQuestion
        }
      }

      const result = await this.multiAgentService.executePipeline(task, pipeline)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async multiAgentStructureIdeas(req, res) {
    try {
      const { sources, researchGoal, context, data, apiKeys } = req.body
      if (!sources || !researchGoal) {
        return res.status(400).json({ error: 'sources and researchGoal are required' })
      }

      if (apiKeys) {
        this.multiAgentService.updateAPIKeys(apiKeys)
      }

      const pipeline = this.multiAgentService.getPipelines().structureIdeas
      const task = {
        type: 'idea_structuring',
        description: `Структурирование идей из источников для достижения цели: ${researchGoal}`,
        context: context || '',
        data: {
          sources,
          researchGoal
        }
      }

      const result = await this.multiAgentService.executePipeline(task, pipeline)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async multiAgentLiteratureReview(req, res) {
    try {
      const { topic, reviewType = 'narrative', context, data, apiKeys } = req.body
      if (!topic) {
        return res.status(400).json({ error: 'topic is required' })
      }

      if (apiKeys) {
        this.multiAgentService.updateAPIKeys(apiKeys)
      }

      const pipeline = this.multiAgentService.getPipelines().literatureReview
      const task = {
        type: 'literature_review',
        description: `Подготовка ${reviewType} обзора литературы по теме: ${topic}`,
        context: context || '',
        data: {
          topic,
          reviewType
        }
      }

      const result = await this.multiAgentService.executePipeline(task, pipeline)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async multiAgentMetaAnalysis(req, res) {
    try {
      const { studies, effectMeasures, context, data, apiKeys } = req.body
      if (!studies || !effectMeasures) {
        return res.status(400).json({ error: 'studies and effectMeasures are required' })
      }

      if (apiKeys) {
        this.multiAgentService.updateAPIKeys(apiKeys)
      }

      const pipeline = this.multiAgentService.getPipelines().metaAnalysis
      const task = {
        type: 'meta_analysis',
        description: 'Проведение мета-анализа по предоставленным исследованиям',
        context: context || '',
        data: {
          studies,
          effectMeasures
        }
      }

      const result = await this.multiAgentService.executePipeline(task, pipeline)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateCode(req, res) {
    try {
      const { task, language, context = '' } = req.body
      if (!task || !language) {
        return res.status(400).json({ error: 'task and language are required' })
      }
      const result = await this.glmService.generateCode(task, language, context)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async reviewCode(req, res) {
    try {
      const { code, language, focus = 'all' } = req.body
      if (!code || !language) {
        return res.status(400).json({ error: 'code and language are required' })
      }
      const result = await this.glmService.reviewCode(code, language, focus)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async debugCode(req, res) {
    try {
      const { code, language, error = '' } = req.body
      if (!code || !language) {
        return res.status(400).json({ error: 'code and language are required' })
      }
      const result = await this.glmService.debugCode(code, language, error)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async optimizeCode(req, res) {
    try {
      const { code, language, goal = 'performance' } = req.body
      if (!code || !language) {
        return res.status(400).json({ error: 'code and language are required' })
      }
      const result = await this.glmService.optimizeCode(code, language, goal)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async explainCode(req, res) {
    try {
      const { code, language, detail = 'high' } = req.body
      if (!code || !language) {
        return res.status(400).json({ error: 'code and language are required' })
      }
      const result = await this.glmService.explainCode(code, language, detail)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async refactorCode(req, res) {
    try {
      const { code, language, pattern = '' } = req.body
      if (!code || !language) {
        return res.status(400).json({ error: 'code and language are required' })
      }
      const result = await this.glmService.refactorCode(code, language, pattern)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateTests(req, res) {
    try {
      const { code, language, framework = '' } = req.body
      if (!code || !language) {
        return res.status(400).json({ error: 'code and language are required' })
      }
      const result = await this.glmService.generateTests(code, language, framework)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async generateDocumentation(req, res) {
    try {
      const { code, language, docType = 'api' } = req.body
      if (!code || !language) {
        return res.status(400).json({ error: 'code and language are required' })
      }
      const result = await this.glmService.generateDocumentation(code, language, docType)
      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

export default AIController
