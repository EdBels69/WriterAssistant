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
    this.balanceCache = {
      glm: null,
      lastCheck: 0,
      deepseek: null,
      qwen: null
    }
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
    if (!this.openRouterApiKey) return false
    
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`
        }
      })
      return response.status === 200
    } catch (error) {
      console.error('DeepSeek availability check failed:', error)
      return false
    }
  }

  async checkQwenAvailability() {
    if (!this.openRouterApiKey) return false
    
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`
        }
      })
      return response.status === 200
    } catch (error) {
      console.error('Qwen availability check failed:', error)
      return false
    }
  }

  getTaskType(task) {
    const taskPatterns = {
      hypothesis: ['hypothesis', 'гипотеза', 'research', 'исследование'],
      structure: ['structure', 'структура', 'ideas', 'идеи'],
      literature: ['literature', 'литература', 'review', 'обзор'],
      methodology: ['methodology', 'методология', 'method', 'метод'],
      analysis: ['analysis', 'анализ', 'statistical', 'статистика'],
      code: ['code', 'код', 'generate', 'генерация', 'debug', 'debug', 'refactor', 'рефакторинг'],
      style: ['style', 'стиль', 'academic', 'академический', 'edit', 'редактирование']
    }

    const taskLower = task.toLowerCase()
    for (const [type, patterns] of Object.entries(taskPatterns)) {
      if (patterns.some(pattern => taskLower.includes(pattern))) {
        return type
      }
    }
    return 'general'
  }

  async routeRequest(task, prompt, options = {}) {
    const taskType = this.getTaskType(task)
    const deepseekAvailable = await this.checkDeepSeekAvailability()
    const qwenAvailable = await this.checkQwenAvailability()
    
    const routingDecision = this.makeRoutingDecision(taskType, deepseekAvailable, qwenAvailable, options)
    
    console.log(`[SmartRouter] Routing task "${task}" to:`, routingDecision.provider)
    console.log(`[SmartRouter] Task type: ${taskType}, DeepSeek available: ${deepseekAvailable}, Qwen available: ${qwenAvailable}`)
    
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

  makeRoutingDecision(taskType, deepseekAvailable, qwenAvailable, options) {
    const { forceProvider, priority = 'balanced' } = options
    
    if (forceProvider) {
      return { provider: forceProvider }
    }

    const priorities = {
      high: {
        'hypothesis': ['glm-primary', 'deepseek', 'glm-secondary'],
        'structure': ['glm-primary', 'deepseek', 'glm-secondary'],
        'literature': ['glm-primary', 'deepseek', 'glm-secondary'],
        'methodology': ['glm-primary', 'deepseek', 'glm-secondary'],
        'analysis': ['glm-primary', 'deepseek', 'glm-secondary'],
        'code': ['glm-primary', 'deepseek', 'glm-secondary'],
        'style': ['glm-primary', 'qwen', 'deepseek', 'glm-secondary'],
        'general': ['glm-primary', 'deepseek', 'glm-secondary']
      },
      balanced: {
        'hypothesis': ['glm-primary', 'deepseek', 'glm-secondary'],
        'structure': ['glm-primary', 'deepseek', 'glm-secondary'],
        'literature': ['glm-primary', 'deepseek', 'glm-secondary'],
        'methodology': ['glm-primary', 'deepseek', 'glm-secondary'],
        'analysis': ['glm-primary', 'deepseek', 'glm-secondary'],
        'code': ['glm-primary', 'deepseek', 'glm-secondary'],
        'style': ['glm-primary', 'qwen', 'deepseek', 'glm-secondary'],
        'general': ['glm-primary', 'deepseek', 'glm-secondary']
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

    const providerOrder = priorities[priority][taskType] || priorities.balanced[taskType]
    
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
    
    const estimatedTokens = this.estimateTokens(text)
    
    if (estimatedTokens <= maxTokens) {
      console.log(`[SmartRouter] Text fits in single request (${estimatedTokens} tokens)`)
      return await this.routeRequest(task, text, options)
    }
    
    console.log(`[SmartRouter] Text too large (${estimatedTokens} tokens), using chunking`)
    
    const processFunction = async (chunk, meta) => {
      let systemPrompt = options.systemPrompt
      
      if (!systemPrompt && meta.chunkIndex > 0) {
        systemPrompt = `${options.systemPrompt || ''}\n\n[PREVIOUS CONTEXT]\n${meta.context?.substring(0, 500) || ''}...\n[/PREVIOUS CONTEXT]`
      }
      
      return await this.routeRequest(task, chunk, {
        ...options,
        systemPrompt,
        forceProvider: provider
      })
    }
    
    const results = await this.chunkingService.processLargeText(
      text,
      processFunction,
      {
        maxTokens,
        onProgress: (progress) => {
          console.log(`[SmartRouter] Processing chunk ${progress.current}/${progress.total} (${progress.percentage}%)`)
          if (onProgress) onProgress(progress)
        }
      }
    )
    
    const combinedContent = this.combineResults(results, taskType)
    
    return {
      success: true,
      content: combinedContent,
      provider: provider || 'chunked',
      usage: {
        totalChunks: results.length,
        totalTokens: estimatedTokens
      },
      chunks: results
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
    return results.map(r => r.content).join(separator)
  }
}

export default SmartRouter
