import GLMService from './GLMService.js'
import TextChunkingService from './TextChunkingService.js'
import axios from 'axios'
import { ResearchPrompts } from './ResearchPrompts.js'

class SmartRouter {
  constructor(primaryApiKey, secondaryApiKey) {
    this.primaryGLM = new GLMService(primaryApiKey)
    this.secondaryGLM = new GLMService(secondaryApiKey)
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY
    this.deepseekModel = 'deepseek/deepseek-r1-0528:free'
    this.qwenModel = 'qwen/qwen-2.5-coder-7b-instruct:free'
    this.chunkingService = new TextChunkingService()
    this.availabilityCache = {
      deepseek: { value: null, lastCheck: 0 },
      qwen: { value: null, lastCheck: 0 }
    }
    this.balanceCache = {
      glm: null,
      lastCheck: 0
    }
  }

  isTestMode() {
    return process.env.NODE_ENV === 'test' || !!process.env.VITEST || this.openRouterApiKey === 'test-key'
  }

  async checkGLMBalance() {
    const cacheTimeout = 60000
    if (this.balanceCache.glm && Date.now() - this.balanceCache.lastCheck < cacheTimeout) {
      return this.balanceCache.glm
    }

    try {
      const response = await fetch('https://api.z.ai/api/paas/v4/models', {
        headers: {
          'Authorization': `Bearer ${this.primaryGLM.apiKey}`
        }
      })
      
      if (response.ok) {
        this.balanceCache.glm = true
        this.balanceCache.lastCheck = Date.now()
        return true
      } else {
        const error = await response.json()
        if (error.error?.code === '1113') {
          this.balanceCache.glm = false
          this.balanceCache.lastCheck = Date.now()
          return false
        }
        return true
      }
    } catch (error) {
      console.error('Balance check failed:', error)
      return false
    }
  }

  async checkDeepSeekAvailability() {
    if (this.isTestMode()) return true
    if (!this.openRouterApiKey) return false

    const cacheTimeout = 60000
    const cached = this.availabilityCache.deepseek
    if (cached.value !== null && Date.now() - cached.lastCheck < cacheTimeout) {
      return cached.value
    }
    
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`
        }
      })

      const available = response.status === 200
      this.availabilityCache.deepseek = { value: available, lastCheck: Date.now() }
      return available
    } catch (error) {
      console.error('DeepSeek availability check failed:', error)
      this.availabilityCache.deepseek = { value: false, lastCheck: Date.now() }
      return false
    }
  }

  async checkQwenAvailability() {
    if (this.isTestMode()) return true
    if (!this.openRouterApiKey) return false

    const cacheTimeout = 60000
    const cached = this.availabilityCache.qwen
    if (cached.value !== null && Date.now() - cached.lastCheck < cacheTimeout) {
      return cached.value
    }
    
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`
        }
      })

      const available = response.status === 200
      this.availabilityCache.qwen = { value: available, lastCheck: Date.now() }
      return available
    } catch (error) {
      console.error('Qwen availability check failed:', error)
      this.availabilityCache.qwen = { value: false, lastCheck: Date.now() }
      return false
    }
  }

  getTaskType(task) {
    const taskPatterns = [
      { type: 'structure', patterns: ['structure', 'структур', 'ideas', 'идеи'] },
      { type: 'methodology', patterns: ['methodology', 'методол', 'method', 'метод'] },
      { type: 'hypothesis', patterns: ['hypothesis', 'гипотез', 'research', 'исследован'] },
      { type: 'literature', patterns: ['literature', 'литератур', 'review', 'обзор'] },
      { type: 'analysis', patterns: ['analysis', 'анализ', 'statistical', 'статистик'] },
      { type: 'code', patterns: ['code', 'код', 'generate', 'генерац', 'debug', 'refactor', 'рефактор'] },
      { type: 'style', patterns: ['style', 'стил', 'academic', 'академ', 'edit', 'редактир'] }
    ]

    const taskLower = task.toLowerCase()
    for (const entry of taskPatterns) {
      if (entry.patterns.some(pattern => taskLower.includes(pattern))) {
        return entry.type
      }
    }

    return 'general'
  }

  async routeRequest(task, prompt, options = {}) {
    const taskType = this.getTaskType(task)
    const [deepseekAvailable, qwenAvailable] = await Promise.all([
      this.checkDeepSeekAvailability(),
      this.checkQwenAvailability()
    ])
    
    const routingDecision = this.makeRoutingDecision(taskType, deepseekAvailable, qwenAvailable, options)
    
    switch (routingDecision.provider) {
      case 'glm-primary':
        return await this.executeGLMRequest(prompt, options, false)
      
      case 'glm-secondary':
        return await this.executeGLMRequest(prompt, options, true)
      
      case 'deepseek':
        return await this.executeDeepSeekRequest(prompt, options)
      
      case 'qwen':
        return await this.executeQwenRequest(prompt, options)
      
      case 'coding-api':
        return await this.executeCodingAPIRequest(prompt, options)
      
      default:
        throw new Error('No available provider for this request')
    }
  }

  makeRoutingDecision(taskType, deepseekAvailable, qwenAvailable, options = {}) {
    const { forceProvider, priority } = options
    const normalizedPriority =
      typeof priority === 'string' && ['high', 'balanced', 'cost'].includes(priority)
        ? priority
        : 'balanced'
    
    if (forceProvider) {
      if (forceProvider === 'openrouter') {
        return { provider: taskType === 'style' ? 'qwen' : 'deepseek' }
      }
      return { provider: forceProvider }
    }

    const priorities = {
      high: {
        'hypothesis': ['deepseek', 'glm-primary', 'glm-secondary'],
        'structure': ['deepseek', 'glm-primary', 'glm-secondary'],
        'literature': ['deepseek', 'glm-primary', 'glm-secondary'],
        'methodology': ['deepseek', 'glm-primary', 'glm-secondary'],
        'analysis': ['deepseek', 'glm-primary', 'glm-secondary'],
        'code': ['deepseek', 'glm-primary', 'glm-secondary'],
        'style': ['qwen', 'glm-primary', 'deepseek', 'glm-secondary'],
        'general': ['deepseek', 'glm-primary', 'glm-secondary']
      },
      balanced: {
        'hypothesis': ['deepseek', 'glm-primary', 'glm-secondary'],
        'structure': ['deepseek', 'glm-primary', 'glm-secondary'],
        'literature': ['deepseek', 'glm-primary', 'glm-secondary'],
        'methodology': ['deepseek', 'glm-primary', 'glm-secondary'],
        'analysis': ['deepseek', 'glm-primary', 'glm-secondary'],
        'code': ['deepseek', 'glm-primary', 'glm-secondary'],
        'style': ['qwen', 'deepseek', 'glm-primary', 'glm-secondary'],
        'general': ['deepseek', 'glm-primary', 'glm-secondary']
      },
      cost: {
        'hypothesis': ['glm-primary', 'deepseek', 'glm-secondary'],
        'structure': ['glm-primary', 'deepseek', 'glm-secondary'],
        'literature': ['glm-primary', 'deepseek', 'glm-secondary'],
        'methodology': ['glm-primary', 'deepseek', 'glm-secondary'],
        'analysis': ['glm-primary', 'deepseek', 'glm-secondary'],
        'code': ['glm-primary', 'deepseek', 'glm-secondary'],
        'style': ['qwen', 'glm-primary', 'deepseek', 'glm-secondary'],
        'general': ['glm-primary', 'deepseek', 'glm-secondary']
      }
    }

    const resolvedTaskType = priorities[normalizedPriority][taskType] ? taskType : 'general'
    const providerOrder = priorities[normalizedPriority][resolvedTaskType]
    
    for (const provider of providerOrder) {
      if (provider === 'glm-primary') {
        return { provider }
      }
      if (provider === 'glm-secondary') {
        return { provider }
      }
      if (provider === 'deepseek' && deepseekAvailable) {
        return { provider }
      }
      if (provider === 'qwen' && qwenAvailable) {
        return { provider }
      }
    }

    return { provider: 'glm-primary' }
  }

  async executeGLMRequest(prompt, options, useSecondary = false) {
    const service = useSecondary ? this.secondaryGLM : this.primaryGLM
    return await service.generateCompletion(prompt, options)
  }

  async executeDeepSeekRequest(prompt, options) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt } = options

    if (this.isTestMode()) {
      const content = `TEST: ${prompt}`.slice(0, Math.max(120, Math.min(2000, maxTokens)))
      return {
        success: true,
        content,
        provider: 'deepseek',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      }
    }
    
    try {
      const messages = []
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
      } else {
        messages.push({ role: 'system', content: 'You are an expert academic researcher and scientist. Provide detailed, well-structured, and scientifically accurate responses.' })
      }
      
      messages.push({ role: 'user', content: prompt })

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.deepseekModel,
          messages,
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
            'X-Title': 'ScientificWriter AI'
          }
        }
      )

      return {
        success: true,
        content: response.data.choices[0].message.content,
        provider: 'deepseek',
        usage: response.data.usage
      }
    } catch (error) {
      console.error('DeepSeek request failed:', error.response?.data || error.message)
      throw new Error(`DeepSeek API error: ${error.message}`)
    }
  }

  async executeQwenRequest(prompt, options) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt } = options

    if (this.isTestMode()) {
      const content = `TEST: ${prompt}`.slice(0, Math.max(120, Math.min(2000, maxTokens)))
      return {
        success: true,
        content,
        provider: 'qwen',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      }
    }
    
    try {
      const messages = []
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
      } else {
        messages.push({ role: 'system', content: 'You are an expert academic editor specializing in scientific writing. Improve clarity, grammar, academic tone, and coherence while preserving the original meaning.' })
      }
      
      messages.push({ role: 'user', content: prompt })

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.qwenModel,
          messages,
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
            'X-Title': 'ScientificWriter AI'
          }
        }
      )

      return {
        success: true,
        content: response.data.choices[0].message.content,
        provider: 'qwen',
        usage: response.data.usage
      }
    } catch (error) {
      console.error('Qwen request failed:', error.response?.data || error.message)
      throw new Error(`Qwen API error: ${error.message}`)
    }
  }

  async executeCodingAPIRequest(prompt, options) {
    const { temperature = 0.7, maxTokens = 4096, systemPrompt } = options
    
    try {
      let finalPrompt = prompt
      let finalSystemPrompt = systemPrompt

      if (!finalSystemPrompt) {
        finalSystemPrompt = this.enhancePromptForScientificContext('')
      }

      const response = await this.primaryGLM.generateCompletion(finalPrompt, {
        systemPrompt: finalSystemPrompt,
        useCodingAPI: true,
        temperature,
        maxTokens: maxTokens
      })

      return {
        success: true,
        content: response.content,
        provider: 'coding-api',
        usage: response.usage
      }
    } catch (error) {
      console.error('Coding API request failed:', error.message)
      throw new Error(`Coding API error: ${error.message}`)
    }
  }

  enhancePromptForScientificContext(prompt) {
    const scientificContext = `
[CRITICAL CONTEXT: SCIENTIFIC RESEARCH MODE]

You are operating in SCIENTIFIC RESEARCH mode, NOT coding mode. Follow these instructions:

1. STYLE GUIDELINES:
   - Use ACADEMIC language, NOT programming terminology
   - Write in formal scientific style (APA/Chicago standards)
   - Avoid technical j unrelated to research
   - Use proper academic structure: Introduction → Methods → Results → Discussion

2. TASK INTERPRETATION:
   - "Generate" → Create research hypotheses, methodology, analysis plans
   - "Structure" → Organize ideas using research frameworks
   - "Analyze" → Conduct scientific analysis with proper methodology
   - "Review" → Provide academic critique with evidence-based reasoning

3. OUTPUT FORMAT:
   - Use paragraphs with proper academic flow
   - Include citations in standard format (Author, Year)
   - Structure with clear headings (Introduction, Methods, Results, Discussion)
   - DO NOT format as code blocks unless specifically requested

4. DOMAIN KNOWLEDGE:
   - Apply research methodology principles
   - Use appropriate statistical terminology
   - Reference established theories and frameworks
   - Maintain scientific objectivity and rigor

[USER REQUEST STARTS HERE]
${prompt}
[USER REQUEST ENDS HERE]
`

    return scientificContext
  }

  async generateHypothesis(researchArea, researchQuestion, context = '') {
    const prompt = ResearchPrompts.generateHypothesis.userPrompt(researchArea, researchQuestion, context)
    return await this.routeRequest('hypothesis generation', prompt, { 
      priority: 'high',
      systemPrompt: ResearchPrompts.generateHypothesis.systemPrompt
    })
  }

  async structureIdeas(sources, researchGoal, context = '') {
    const prompt = ResearchPrompts.structureIdeas.userPrompt(sources, researchGoal, context)
    return await this.routeRequest('idea structuring', prompt, { 
      priority: 'balanced',
      systemPrompt: ResearchPrompts.structureIdeas.systemPrompt
    })
  }

  async literatureReview(topic, reviewType = 'narrative', context = '') {
    const prompt = ResearchPrompts.literatureReview.userPrompt(topic, reviewType, context)
    return await this.routeRequest('literature review', prompt, { 
      priority: 'high',
      systemPrompt: ResearchPrompts.literatureReview.systemPrompt
    })
  }

  async structureMethodology(researchArea, researchQuestion, context = '') {
    const prompt = ResearchPrompts.structureMethodology.userPrompt(researchArea, researchQuestion, context)
    return await this.routeRequest('methodology structuring', prompt, { 
      priority: 'high',
      systemPrompt: ResearchPrompts.structureMethodology.systemPrompt
    })
  }

  async statisticalAnalysis(researchQuestion, dataDescription, context = '') {
    const prompt = ResearchPrompts.statisticalAnalysis.userPrompt(researchQuestion, dataDescription, context)
    return await this.routeRequest('statistical analysis', prompt, { 
      priority: 'balanced',
      systemPrompt: ResearchPrompts.statisticalAnalysis.systemPrompt
    })
  }

  async improveAcademicStyle(text, targetStyle = 'formal', context = '') {
    const prompt = ResearchPrompts.improveAcademicStyle.userPrompt(text, targetStyle, context)
    return await this.routeRequest('academic style improvement', prompt, { 
      priority: 'balanced',
      systemPrompt: ResearchPrompts.improveAcademicStyle.systemPrompt
    })
  }

  async generateDiscussion(results, limitations, implications, context = '') {
    const prompt = ResearchPrompts.generateDiscussion.userPrompt(results, limitations, implications, context)
    return await this.routeRequest('discussion generation', prompt, { 
      priority: 'high',
      systemPrompt: ResearchPrompts.generateDiscussion.systemPrompt
    })
  }

  async generateConclusion(mainFindings, implications, futureDirections, context = '') {
    const prompt = ResearchPrompts.generateConclusion.userPrompt(mainFindings, implications, futureDirections, context)
    return await this.routeRequest('conclusion generation', prompt, { 
      priority: 'balanced',
      systemPrompt: ResearchPrompts.generateConclusion.systemPrompt
    })
  }

  async brainstorm(topic, context = '') {
    const prompt = ResearchPrompts.brainstorm.userPrompt(topic, context)
    return await this.routeRequest('brainstorming', prompt, { 
      priority: 'balanced',
      systemPrompt: ResearchPrompts.brainstorm.systemPrompt
    })
  }

  async routeRequestWithChunking(task, text, options = {}) {
    const { provider, onProgress } = options
    const taskType = this.getTaskType(task)
    const maxTokens = this.estimateMaxTokens(taskType)
    const forcedProvider = options.forceProvider || provider
    
    const estimatedTokens = this.estimateTokens(text)
    
    if (estimatedTokens <= maxTokens) {
      return await this.routeRequest(task, text, options)
    }
    
    const processFunction = async (chunk, meta) => {
      const baseSystemPrompt = options.systemPrompt || ''
      let systemPrompt = baseSystemPrompt

      if (meta.chunkIndex > 0) {
        const previousContext =
          typeof meta.context === 'string'
            ? meta.context
            : (meta.context?.content || meta.context?.output || '')

        systemPrompt = `${baseSystemPrompt}\n\n[PREVIOUS CONTEXT]\n${String(previousContext).substring(0, 500) || ''}...\n[/PREVIOUS CONTEXT]`
      }
      
      return await this.routeRequest(task, chunk, {
        ...options,
        systemPrompt: systemPrompt || undefined,
        forceProvider: forcedProvider
      })
    }
    
    const processingResult = await this.chunkingService.processLargeText(
      text,
      processFunction,
      {
        maxTokens,
        onProgress: (progress) => {
          if (onProgress) onProgress(progress)
        }
      }
    )

    const chunkResults = Array.isArray(processingResult)
      ? processingResult
      : (processingResult?.chunks || [])
    
    const combinedContent = this.combineResults(chunkResults, taskType)
    
    return {
      success: true,
      content: combinedContent,
      provider: provider || 'chunked',
      usage: {
        totalChunks: chunkResults.length,
        totalTokens: estimatedTokens
      },
      chunks: chunkResults
    }
  }

  estimateMaxTokens(taskType) {
    const limits = {
      hypothesis: 8000,
      structure: 8000,
      literature: 6000,
      methodology: 8000,
      analysis: 8000,
      code: 12000,
      style: 6000,
      general: 8000
    }
    return limits[taskType] || 8000
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4)
  }

  combineResults(results, taskType) {
    const separator = taskType === 'style' || taskType === 'code' ? ' ' : '\n\n'
    return results.map(r => r.content || r.output || '').join(separator)
  }
}

export default SmartRouter
