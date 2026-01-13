import express from 'express'
import TextChunkingService from '../services/TextChunkingService.js'
import MultiAgentService from '../services/MultiAgentService.js'
import SmartRouter from '../services/SmartRouter.js'
import AIRequestHandler from '../services/AIRequestHandler.js'
import OutputValidator from '../services/OutputValidator.js'
import MetricsCollector from '../services/MetricsCollector.js'
import { validateBody, textValidationSchema, styleValidationSchema, generateContentValidationSchema } from '../middleware/validation.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import prompts from '../prompts/index.js'

class AIController {
  constructor(glmService, smartRouter = null) {
    this.router = express.Router()
    this.glmService = glmService
    this.smartRouter = smartRouter || new SmartRouter(
      process.env.GLM_API_KEY,
      process.env.GLM_SECONDARY_API_KEY
    )
    this.aiHandler = new AIRequestHandler(this.smartRouter)
    this.chunkingService = new TextChunkingService()
    this.multiAgentService = new MultiAgentService()
    this.outputValidator = new OutputValidator()
    this.metricsCollector = new MetricsCollector()
    this.routes()
  }

  getResultText(result) {
    return result?.content || result?.output || ''
  }

  validateOutput(result, ...validatorArgs) {
    return this.outputValidator.validate(this.getResultText(result), ...validatorArgs)
  }

  recordSuccessMetric(startTime, category, action, result, validation) {
    const output = this.getResultText(result)
    const responseTime = Date.now() - startTime

    this.metricsCollector.recordMetric(category, action, {
      responseTime,
      success: !result?.error,
      outputLength: output.length,
      qualityScore: validation.score,
      error: result?.error || null
    })

    return { responseTime, output }
  }

  recordFailureMetric(startTime, category, action, errorMessage) {
    const responseTime = Date.now() - startTime

    this.metricsCollector.recordMetric(category, action, {
      responseTime,
      success: false,
      outputLength: 0,
      qualityScore: 0,
      error: errorMessage
    })
  }

  routes() {
    this.router.post('/ideas', validateBody({ genre: { type: 'string', required: true }, theme: { type: 'string', required: true } }), asyncHandler(this.generateIdeas.bind(this)))
    this.router.post('/expand', validateBody(textValidationSchema), asyncHandler(this.expandText.bind(this)))
    this.router.post('/style', validateBody(styleValidationSchema), asyncHandler(this.editStyle.bind(this)))
    this.router.post('/style-editing', validateBody(styleValidationSchema), asyncHandler(this.styleEditing.bind(this)))
    this.router.post('/character', validateBody(generateContentValidationSchema), asyncHandler(this.generateCharacter.bind(this)))
    this.router.post('/plot', validateBody(generateContentValidationSchema), asyncHandler(this.generatePlotOutline.bind(this)))
    this.router.post('/dialogue', validateBody(generateContentValidationSchema), asyncHandler(this.generateDialogue.bind(this)))
    this.router.post('/improve', validateBody(textValidationSchema), asyncHandler(this.improveWriting.bind(this)))
    this.router.post('/description', validateBody(generateContentValidationSchema), asyncHandler(this.generateDescription.bind(this)))
    this.router.post('/analyze', validateBody(textValidationSchema), asyncHandler(this.analyzeText.bind(this)))
    this.router.post('/brainstorm', validateBody({ topic: { type: 'string', required: true, minLength: 1, maxLength: 1000 }, category: { type: 'string', required: false }, context: { type: 'string', required: false } }), asyncHandler(this.brainstorm.bind(this)))
    this.router.post('/hypothesis', validateBody({ researchArea: { type: 'string', required: true, minLength: 1, maxLength: 500 }, researchQuestion: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, context: { type: 'string', required: false } }), asyncHandler(this.generateHypothesis.bind(this)))
    this.router.post('/structure-ideas', validateBody({ sources: { type: 'string', required: true, minLength: 1, maxLength: 200000 }, researchGoal: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, context: { type: 'string', required: false } }), asyncHandler(this.structureIdeas.bind(this)))
    this.router.post('/structure-methodology', validateBody({ researchArea: { type: 'string', required: true, minLength: 1, maxLength: 500 }, researchQuestion: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, context: { type: 'string', required: false } }), asyncHandler(this.structureMethodology.bind(this)))
    this.router.post('/literature-review', validateBody({ topic: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, reviewType: { type: 'string', required: false, enum: ['narrative', 'systematic', 'meta-analysis'] }, context: { type: 'string', required: false }, text: { type: 'string', required: false } }), asyncHandler(this.literatureReview.bind(this)))
    this.router.post('/statistical-analysis', validateBody({ researchQuestion: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, dataDescription: { type: 'string', required: true, minLength: 3, maxLength: 200000 }, analysisGoal: { type: 'string', required: false }, context: { type: 'string', required: false }, text: { type: 'string', required: false } }), asyncHandler(this.statisticalAnalysis.bind(this)))
    this.router.post('/process-large-text', validateBody({ text: { type: 'string', required: true, minLength: 1, maxLength: 200000 }, task: { type: 'string', required: true, enum: ['edit', 'improve', 'summarize', 'analyze'] }, options: { type: 'object', required: false } }), asyncHandler(this.processLargeText.bind(this)))
    this.router.post('/research-design', validateBody({ researchQuestion: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, researchType: { type: 'string', required: false }, text: { type: 'string', required: false } }), asyncHandler(this.generateResearchDesign.bind(this)))
    this.router.post('/analyze-results', validateBody({ results: { type: 'string', required: true, minLength: 3, maxLength: 200000 }, researchQuestion: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, context: { type: 'string', required: false }, text: { type: 'string', required: false } }), asyncHandler(this.analyzeResults.bind(this)))
    this.router.post('/generate-discussion', validateBody({ results: { type: 'string', required: true, minLength: 3, maxLength: 200000 }, limitations: { type: 'string', required: false }, implications: { type: 'string', required: false }, context: { type: 'string', required: false }, text: { type: 'string', required: false } }), asyncHandler(this.generateDiscussion.bind(this)))
    this.router.post('/generate-conclusion', validateBody({ results: { type: 'string', required: true, minLength: 3, maxLength: 200000 }, implications: { type: 'string', required: false }, context: { type: 'string', required: false }, text: { type: 'string', required: false } }), asyncHandler(this.generateConclusion.bind(this)))
    this.router.post('/improve-academic-style', validateBody({ text: { type: 'string', required: true, minLength: 1, maxLength: 200000 }, targetAudience: { type: 'string', required: false } }), asyncHandler(this.improveAcademicStyle.bind(this)))
    this.router.post('/analyze-upload', validateBody({ fileContent: { type: 'string', required: true, minLength: 1, maxLength: 5000000 }, fileName: { type: 'string', required: true, minLength: 1, maxLength: 500 }, analysisType: { type: 'string', required: false } }), asyncHandler(this.analyzeUpload.bind(this)))
    this.router.post('/edit-upload', validateBody({ fileContent: { type: 'string', required: true, minLength: 1, maxLength: 5000000 }, fileName: { type: 'string', required: true, minLength: 1, maxLength: 500 }, editType: { type: 'string', required: false }, instructions: { type: 'string', required: false } }), asyncHandler(this.editUpload.bind(this)))
    this.router.post('/extract-references', validateBody({ fileContent: { type: 'string', required: true, minLength: 1, maxLength: 5000000 }, fileName: { type: 'string', required: true, minLength: 1, maxLength: 500 } }), asyncHandler(this.extractReferences.bind(this)))
    this.router.post('/synthesize-uploads', validateBody({ uploadedFiles: { type: 'array', required: true }, researchGoal: { type: 'string', required: true, minLength: 3, maxLength: 2000 } }), asyncHandler(this.synthesizeUploads.bind(this)))
    this.router.post('/chat', validateBody({ message: { type: 'string', required: true, minLength: 1 } }), asyncHandler(this.chat.bind(this)))
    this.router.post('/multiagent', validateBody({ task: { type: 'object', required: true }, agents: { type: 'array', required: true }, apiKeys: { type: 'object', required: false } }), asyncHandler(this.executeMultiAgent.bind(this)))
    this.router.post('/multiagent/pipelines', asyncHandler(this.getPipelines.bind(this)))
    this.router.post('/multiagent/hypothesis', validateBody({ researchArea: { type: 'string', required: true, minLength: 1, maxLength: 500 }, researchQuestion: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, context: { type: 'string', required: false }, apiKeys: { type: 'object', required: false } }), asyncHandler(this.multiAgentHypothesis.bind(this)))
    this.router.post('/multiagent/structure-ideas', validateBody({ sources: { type: 'string', required: true, minLength: 1, maxLength: 200000 }, researchGoal: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, context: { type: 'string', required: false }, apiKeys: { type: 'object', required: false } }), asyncHandler(this.multiAgentStructureIdeas.bind(this)))
    this.router.post('/multiagent/literature-review', validateBody({ topic: { type: 'string', required: true, minLength: 3, maxLength: 2000 }, reviewType: { type: 'string', required: false, enum: ['narrative', 'systematic', 'meta-analysis'] }, context: { type: 'string', required: false }, apiKeys: { type: 'object', required: false } }), asyncHandler(this.multiAgentLiteratureReview.bind(this)))
    this.router.post('/multiagent/meta-analysis', validateBody({ studies: { type: 'array', required: true }, effectMeasures: { type: 'array', required: false }, context: { type: 'string', required: false }, apiKeys: { type: 'object', required: false } }), asyncHandler(this.multiAgentMetaAnalysis.bind(this)))
    this.router.post('/code/generate', validateBody({ prompt: { type: 'string', required: true, minLength: 1 }, language: { type: 'string', required: true } }), asyncHandler(this.generateCode.bind(this)))
    this.router.post('/code/review', validateBody({ code: { type: 'string', required: true, minLength: 1 }, language: { type: 'string', required: true } }), asyncHandler(this.reviewCode.bind(this)))
    this.router.post('/code/debug', validateBody({ code: { type: 'string', required: true, minLength: 1 }, language: { type: 'string', required: true }, error: { type: 'string', required: true } }), asyncHandler(this.debugCode.bind(this)))
    this.router.post('/code/optimize', validateBody({ code: { type: 'string', required: true, minLength: 1 }, language: { type: 'string', required: true } }), asyncHandler(this.optimizeCode.bind(this)))
    this.router.post('/code/explain', validateBody({ code: { type: 'string', required: true, minLength: 1 }, language: { type: 'string', required: true } }), asyncHandler(this.explainCode.bind(this)))
    this.router.post('/code/refactor', validateBody({ code: { type: 'string', required: true, minLength: 1 }, language: { type: 'string', required: true } }), asyncHandler(this.refactorCode.bind(this)))
    this.router.post('/code/tests', validateBody({ code: { type: 'string', required: true, minLength: 1 }, language: { type: 'string', required: true } }), asyncHandler(this.generateTests.bind(this)))
    this.router.post('/code/documentation', validateBody({ code: { type: 'string', required: true, minLength: 1 }, language: { type: 'string', required: true } }), asyncHandler(this.generateDocumentation.bind(this)))
  }

  async generateIdeas(req, res) {
    const startTime = Date.now()
    const { genre, theme, count = 5, text, provider, openRouterKey } = req.body
    
    try {
      const result = provider 
        ? await this.aiHandler.routeRequest('idea generation', prompts.creativeWriting.generateIdeas.user(count, genre, theme, text), {
            systemPrompt: prompts.creativeWriting.generateIdeas.system,
            temperature: 0.8,
            maxTokens: 2048,
            priority: 'balanced',
            forceProvider: provider,
            openRouterKey
          })
        : await this.glmService.generateIdeas(genre, theme, count, text)

      const validation = this.validateOutput(result, 'creative', 'generateIdeas')
      this.recordSuccessMetric(startTime, 'creative', 'generateIdeas', result, validation)

      res.json({
        ...result,
        qualityScore: validation.score,
        validationPassed: validation.valid
      })
    } catch (error) {
      this.recordFailureMetric(startTime, 'creative', 'generateIdeas', error.message)
      throw error
    }
  }

  async expandText(req, res) {
    const startTime = Date.now()
    const { text, context } = req.body
    
    try {
      const result = await this.glmService.expandText(text, context)

      const validation = this.validateOutput(result, 'creative', 'expandText')
      this.recordSuccessMetric(startTime, 'creative', 'expandText', result, validation)

      res.json({
        ...result,
        qualityScore: validation.score,
        validationPassed: validation.valid
      })
    } catch (error) {
      this.recordFailureMetric(startTime, 'creative', 'expandText', error.message)
      throw error
    }
  }

  async editStyle(req, res) {
    const startTime = Date.now()
    const { text, targetStyle, provider, useChunking = false } = req.body
    
    try {
      const systemPrompt = prompts.creativeWriting.editStyle.system(targetStyle)
      const userPrompt = prompts.creativeWriting.editStyle.user(text, targetStyle)
      
      let result
      
      if (useChunking || text.length > 8000) {
        result = await this.aiHandler.routeRequestWithChunking('style editing', text, {
          systemPrompt,
          provider: provider || 'qwen',
          onProgress: () => {}
        })
      } else {
        result = await this.aiHandler.routeRequest('style editing', userPrompt, {
          systemPrompt,
          temperature: 0.7,
          maxTokens: 2048,
          priority: 'balanced',
          forceProvider: provider
        })
      }

      const validation = this.validateOutput(result, 'creative', 'editStyle')
      this.recordSuccessMetric(startTime, 'creative', 'editStyle', result, validation)

      res.json({
        ...result,
        qualityScore: validation.score,
        validationPassed: validation.valid
      })
    } catch (error) {
      this.recordFailureMetric(startTime, 'creative', 'editStyle', error.message)
      throw error
    }
  }

  async styleEditing(req, res) {
    const { text, targetStyle, provider, openRouterKey } = req.body

    const systemPrompt = prompts.creativeWriting.styleEditing.system(targetStyle)

    const selectedProvider = provider || 'qwen'

    const result = await this.aiHandler.routeRequestWithChunking('style editing', text, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
      priority: 'balanced',
      forceProvider: selectedProvider,
      provider: selectedProvider,
      openRouterKey
    })

    res.json({
      success: true,
      content: result.content,
      provider: result.provider,
      usage: result.usage
    })
  }

  async generateCharacter(req, res) {
    const { name, role, genre } = req.body
    const result = await this.glmService.generateCharacter(name, role, genre)
    res.json(result)
  }

  async generatePlotOutline(req, res) {
    const { storyIdea, chapters = 10 } = req.body
    const result = await this.glmService.generatePlotOutline(storyIdea, chapters)
    res.json(result)
  }

  async generateDialogue(req, res) {
    const { character1, character2, situation, tone } = req.body
    const result = await this.glmService.generateDialogue(character1, character2, situation, tone)
    res.json(result)
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
    const { scene, type = 'visual' } = req.body
    const result = await this.glmService.generateDescription(scene, type)
    res.json(result)
  }

  async analyzeText(req, res) {
    const { text, analysisType = 'general' } = req.body
    const result = await this.glmService.analyzeText(text, analysisType)
    res.json(result)
  }

  async brainstorm(req, res) {
    const { topic, context = '' } = req.body
    const result = await this.smartRouter.brainstorm(topic, context)
    res.json(result)
  }

  async chat(req, res) {
    const { message, context = {} } = req.body

    const contextSummary = context.lastTools 
      ? `\n\nРекомендуемые инструменты для продолжения диалога: ${context.lastTools.join(', ')}` 
      : ''

    const prompt = `${prompts.academic.chat.system}

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
  }

  extractSuggestedTools(text) {
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
    const startTime = Date.now()
    const { researchArea, researchQuestion, context = '' } = req.body
    
    try {
      const result = await this.smartRouter.generateHypothesis(researchArea, researchQuestion, context)

      const validation = this.validateOutput(result, 'research', 'generateHypothesis')
      this.recordSuccessMetric(startTime, 'research', 'hypothesis', result, validation)

      res.json({
        ...result,
        qualityScore: validation.score,
        validationPassed: validation.valid
      })
    } catch (error) {
      this.recordFailureMetric(startTime, 'research', 'hypothesis', error.message)
      throw error
    }
  }

  async structureIdeas(req, res) {
    const startTime = Date.now()
    const { sources, researchGoal, context = '', provider, openRouterKey } = req.body
    
    try {
      const result = provider 
        ? await this.aiHandler.routeRequest('structure ideas', prompts.academic.structureIdeas.user(researchGoal, context), {
            systemPrompt: prompts.academic.structureIdeas.system,
            temperature: 0.7,
            maxTokens: 4096,
            priority: 'balanced',
            forceProvider: provider,
            openRouterKey
          })
        : await this.smartRouter.structureIdeas(sources, researchGoal, context)

      const validation = this.validateOutput(result, 'research', 'structureIdeas')
      this.recordSuccessMetric(startTime, 'research', 'structureIdeas', result, validation)

      res.json({
        ...result,
        qualityScore: validation.score,
        validationPassed: validation.valid
      })
    } catch (error) {
      this.recordFailureMetric(startTime, 'research', 'structureIdeas', error.message)
      throw error
    }
  }

  async structureMethodology(req, res) {
    const { researchArea, researchQuestion, context = '' } = req.body
    const result = await this.smartRouter.structureMethodology(researchArea, researchQuestion, context)
    res.json(result)
  }

  async literatureReview(req, res) {
    const { topic, reviewType = 'narrative', context = '', provider, openRouterKey, text } = req.body
    const result = provider 
      ? await this.aiHandler.routeRequest('literature review', prompts.academic.literatureReview.user(reviewType, topic, context, text), {
          systemPrompt: prompts.academic.literatureReview.system(reviewType),
          temperature: 0.7,
          maxTokens: 4096,
          priority: 'balanced',
          forceProvider: provider,
          openRouterKey
        })
      : await this.smartRouter.literatureReview(topic, reviewType, context)
    res.json(result)
  }

  async statisticalAnalysis(req, res) {
    const { researchQuestion, dataDescription, context = '', provider, openRouterKey, analysisGoal, text } = req.body
    const result = provider 
      ? await this.aiHandler.routeRequest('statistical analysis', prompts.academic.statisticalAnalysis.user(`${researchQuestion}\n\nData: ${dataDescription}${analysisGoal ? `\n\nGoal: ${analysisGoal}` : ''}${context ? `\n\nContext: ${context}` : ''}${text ? `\n\nText: ${text}` : ''}`), {
          systemPrompt: prompts.academic.statisticalAnalysis.system,
          temperature: 0.7,
          maxTokens: 4096,
          priority: 'balanced',
          forceProvider: provider,
          openRouterKey
        })
      : await this.smartRouter.statisticalAnalysis(researchQuestion, dataDescription, context)
    res.json(result)
  }

  async processLargeText(req, res) {
    const { text, task, options = {} } = req.body

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
  }

  async generateResearchDesign(req, res) {
    const { researchQuestion, researchType, provider, openRouterKey, text } = req.body
    const result = provider 
      ? await this.aiHandler.routeRequest('research design', prompts.academic.generateResearchDesign.user(researchType, researchQuestion, '', text), {
          systemPrompt: prompts.academic.generateResearchDesign.system,
          temperature: 0.7,
          maxTokens: 4096,
          priority: 'balanced',
          forceProvider: provider,
          openRouterKey
        })
      : await this.glmService.generateResearchDesign(researchQuestion, researchType)
    res.json(result)
  }

  async analyzeResults(req, res) {
    const { results, researchQuestion, provider, openRouterKey, context, text } = req.body
    const result = provider 
      ? await this.aiHandler.routeRequest('analyze results', prompts.academic.analyzeResults.user(researchQuestion, results, context, text), {
          systemPrompt: prompts.academic.analyzeResults.system,
          temperature: 0.7,
          maxTokens: 4096,
          priority: 'balanced',
          forceProvider: provider,
          openRouterKey
        })
      : await this.glmService.analyzeResults(results, researchQuestion)
    res.json(result)
  }

  async generateDiscussion(req, res) {
    const { results, limitations, implications, context = '', provider, openRouterKey, text } = req.body
    const result = provider 
      ? await this.aiHandler.routeRequest('generate discussion', prompts.academic.generateDiscussion.user(results, limitations, implications, context, text), {
          systemPrompt: prompts.academic.generateDiscussion.system,
          temperature: 0.7,
          maxTokens: 4096,
          priority: 'balanced',
          forceProvider: provider,
          openRouterKey
        })
      : await this.smartRouter.generateDiscussion(results, limitations || '', implications || '', context)
    res.json(result)
  }

  async generateConclusion(req, res) {
    const { mainFindings, implications, futureDirections, context = '', provider, openRouterKey, text } = req.body
    const result = provider 
      ? await this.aiHandler.routeRequest('generate conclusion', prompts.academic.generateConclusion.user(mainFindings, implications, futureDirections, context, text), {
          systemPrompt: prompts.academic.generateConclusion.system,
          temperature: 0.7,
          maxTokens: 4096,
          priority: 'balanced',
          forceProvider: provider,
          openRouterKey
        })
      : await this.smartRouter.generateConclusion(mainFindings, implications || '', futureDirections || '', context)
    res.json(result)
  }

  async improveAcademicStyle(req, res) {
    const { text, targetAudience = 'academic' } = req.body
    
    const systemPrompt = `You are an expert academic editor specializing in ${targetAudience} writing. Improve the text's clarity, grammar, academic tone, and coherence while preserving the original meaning. Ensure the text meets high academic standards.`
    
    const userPrompt = `Improve the academic style of the following text for a ${targetAudience} audience:\n\n${text}\n\nProvide the improved version with specific changes explained.`
    
    const result = await this.aiHandler.routeRequest('style improvement', userPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 2048,
      priority: 'balanced'
    })
    
    res.json(result)
  }

  async analyzeUpload(req, res) {
    const { fileContent, fileName, analysisType = 'comprehensive' } = req.body
    const result = await this.glmService.analyzeUploadedFile(fileContent, fileName, analysisType)
    res.json(result)
  }

  async editUpload(req, res) {
    const { fileContent, fileName, editType = 'academic', instructions = '' } = req.body
    const result = await this.glmService.editUploadedFile(fileContent, fileName, editType, instructions)
    res.json(result)
  }

  async extractReferences(req, res) {
    const { fileContent, fileName } = req.body
    const result = await this.glmService.extractReferencesFromUpload(fileContent, fileName)
    res.json(result)
  }

  async synthesizeUploads(req, res) {
    const { uploadedFiles, researchGoal } = req.body
    const result = await this.glmService.synthesizeMultipleUploads(uploadedFiles, researchGoal)
    res.json(result)
  }

  async executeMultiAgent(req, res) {
    const { task, agents, apiKeys } = req.body

    if (apiKeys) {
      this.multiAgentService.updateAPIKeys(apiKeys)
    }

    const result = await this.multiAgentService.executeABMCTS(task, agents)
    res.json(result)
  }

  async getPipelines(_req, res) {
    const pipelines = this.multiAgentService.getPipelines()
    res.json(pipelines)
  }

  async multiAgentHypothesis(req, res) {
    const { researchArea, researchQuestion, context, apiKeys } = req.body

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
  }

  async multiAgentStructureIdeas(req, res) {
    const { sources, researchGoal, context, apiKeys } = req.body

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
  }

  async multiAgentLiteratureReview(req, res) {
    const { topic, reviewType = 'narrative', context, apiKeys } = req.body

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
  }

  async multiAgentMetaAnalysis(req, res) {
    const { studies, effectMeasures, context, apiKeys } = req.body

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
  }

  async generateCode(req, res) {
    const startTime = Date.now()
    const { task, language, context = '' } = req.body
    
    try {
      const result = await this.glmService.generateCode(task, language, context)

      const validation = this.validateOutput(result, 'code', 'generateCode', language)
      this.recordSuccessMetric(startTime, 'code', 'generate', result, validation)

      res.json({
        ...result,
        qualityScore: validation.score,
        validationPassed: validation.valid
      })
    } catch (error) {
      this.recordFailureMetric(startTime, 'code', 'generate', error.message)
      throw error
    }
  }

  async reviewCode(req, res) {
    const { code, language, focus = 'all' } = req.body
    const result = await this.glmService.reviewCode(code, language, focus)
    res.json(result)
  }

  async debugCode(req, res) {
    const { code, language, error = '' } = req.body
    const result = await this.glmService.debugCode(code, language, error)
    res.json(result)
  }

  async optimizeCode(req, res) {
    const { code, language, goal = 'performance' } = req.body
    const result = await this.glmService.optimizeCode(code, language, goal)
    res.json(result)
  }

  async explainCode(req, res) {
    const { code, language, detail = 'high' } = req.body
    const result = await this.glmService.explainCode(code, language, detail)
    res.json(result)
  }

  async refactorCode(req, res) {
    const { code, language, pattern = '' } = req.body
    const result = await this.glmService.refactorCode(code, language, pattern)
    res.json(result)
  }

  async generateTests(req, res) {
    const { code, language, framework = '' } = req.body
    const result = await this.glmService.generateTests(code, language, framework)
    res.json(result)
  }

  async generateDocumentation(req, res) {
    const { code, language, docType = 'api' } = req.body
    const result = await this.glmService.generateDocumentation(code, language, docType)
    res.json(result)
  }
}

export default AIController
