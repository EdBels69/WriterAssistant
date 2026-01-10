import GLMService from './GLMService.js'

class MultiAgentService {
  constructor(apiKeys = {}) {
    this.primaryAPIKey = apiKeys.primary || process.env.GLM_API_KEY
    this.secondaryAPIKey = apiKeys.secondary || process.env.GLM_SECONDARY_API_KEY
    this.primaryGLM = new GLMService(this.primaryAPIKey)
    this.secondaryGLM = new GLMService(this.secondaryAPIKey || this.primaryAPIKey)
    this.agents = this.initializeAgents()
    this.ABMCTSIterations = 3
    this.maxAgentsPerTask = 3
  }

  initializeAgents() {
    return {
      researcher: {
        role: 'Исследователь',
        description: 'Анализирует источники, ищет паттерны и выдвигает гипотезы',
        apiKey: this.primaryAPIKey,
        systemPrompt: `Ты - эксперт-исследователь в научной области. Твоя задача:
1. Глубоко анализировать предоставленный контекст
2. Выявлять ключевые паттерны и связи
3. Выдвигать обоснованные научные гипотезы
4. Фокусироваться на эмпирических данных и логических выводах
5. Использовать строгий научный метод

Твой ответ должен быть структурирован с указанием обоснований.`
      },
      critic: {
        role: 'Критик',
        description: 'Оценивает качество гипотез, выявляет логические ошибки',
        apiKey: this.secondaryAPIKey || this.primaryAPIKey,
        systemPrompt: `Ты - эксперт-критик в научной методологии. Твоя задача:
1. Критически оценивать предложенные гипотезы
2. Выявлять логические противоречия
3. Проверять обоснованность утверждений
4. Указывать на возможные когнитивные искажения
5. Предлагать улучшения и альтернативные интерпретации

Твой ответ должен быть конструктивной критикой с конкретными предложениями.`
      },
      synthesizer: {
        role: 'Синтезатор',
        description: 'Интегрирует результаты и формулирует итоговый вывод',
        apiKey: this.primaryAPIKey,
        systemPrompt: `Ты - эксперт-синтезатор в научной коммуникации. Твоя задача:
1. Интегрировать результаты от других агентов
2. Синтезировать общие выводы
3. Формулировать четкие научные заключения
4. Выделять ключевые инсайты
5. Структурировать информацию для дальнейшего анализа

Твой ответ должен быть четким, лаконичным и научно обоснованным.`
      },
      methodologist: {
        role: 'Методолог',
        description: 'Проверяет соответствие методологическим стандартам',
        apiKey: this.secondaryAPIKey || this.primaryAPIKey,
        systemPrompt: `Ты - эксперт-методолог в научных исследованиях. Твоя задача:
1. Проверять соответствие методологическим стандартам
2. Оценивать надежность и валидность подходов
3. Выявлять угрозы валидности
4. Предлагать улучшения методологии
5. Проверять соответствие стандартам научной этики

Твой ответ должен быть сфокусирован на методологических аспектах.`
      },
      statistician: {
        role: 'Статистик',
        description: 'Оценивает статистическую значимость и корректность',
        apiKey: this.primaryAPIKey,
        systemPrompt: `Ты - эксперт-статистик в научных исследованиях. Твоя задача:
1. Оценивать статистическую значимость результатов
2. Проверять корректность статистических методов
3. Выявлять статистические ошибки и искажения
4. Предлагать оптимальные статистические подходы
5. Интерпретировать статистические результаты

Твой ответ должен быть сфокусирован на статистических аспектах.`
      }
    }
  }

  async executeABMCTS(task, agents = ['researcher', 'critic', 'synthesizer']) {
    const results = []
    const evaluations = []

    for (let iteration = 0; iteration < this.ABMCTSIterations; iteration++) {
      const context = iteration > 0 ? {
        previousResults: results.filter(r => r.iteration === iteration),
        iteration: iteration + 1
      } : null

      const agentPromises = agents.map(agentName => 
        this.executeAgent(agentName, task, context)
      )

      const agentResults = await Promise.all(agentPromises)

      const iterationResults = agentResults.map((result, index) => ({
        agent: agents[index],
        result,
        timestamp: new Date().toISOString()
      }))

      const evaluation = await this.evaluateResults(iterationResults)
      evaluations.push({
        iteration: iteration + 1,
        results: iterationResults,
        evaluation
      })

      results.push(...iterationResults.map(r => ({ ...r, iteration: iteration + 1 })))
    }

    const bestResult = await this.selectBestResult(evaluations)
    return {
      success: true,
      results,
      evaluations,
      bestResult,
      totalIterations: this.ABMCTSIterations
    }
  }

  async executeAgent(agentName, task, context = null) {
    const agent = this.agents[agentName]
    const glmService = agent.apiKey === this.primaryAPIKey ? this.primaryGLM : this.secondaryGLM

    const prompt = this.buildAgentPrompt(agent, task, context)

    try {
      const response = await glmService.generateCompletion(prompt, {
        systemPrompt: agent.systemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
        thinking: 'enabled'
      })

      return {
        agent: agentName,
        content: response.content,
        thinking: response.thinking,
        model: 'glm-4.7',
        tokensUsed: response.usage ? response.usage.total_tokens : 0
      }
    } catch (error) {
      console.error(`Error executing agent ${agentName}:`, error)
      throw error
    }
  }

  buildAgentPrompt(agent, task, context) {
    let prompt = `Задача: ${task.type}\n`
    prompt += `Описание: ${task.description}\n`

    if (task.context) {
      prompt += `Контекст: ${task.context}\n`
    }

    if (task.data) {
      prompt += `Данные: ${JSON.stringify(task.data, null, 2)}\n`
    }

    if (context && context.previousResults) {
      prompt += `\n--- Результаты предыдущих агентов ---\n`
      context.previousResults.forEach(prevResult => {
        prompt += `[${prevResult.agent}]: ${prevResult.result.content.substring(0, 500)}...\n`
      })
    }

    prompt += `\n--- Твоя роль: ${agent.role} ---\n`
    prompt += `Описание: ${agent.description}\n`
    prompt += `Итерация: ${context ? context.iteration : 1}\n`

    return prompt
  }

  async evaluateResults(results) {
    const evaluationAgent = this.agents.synthesizer
    const glmService = evaluationAgent.apiKey === this.primaryAPIKey ? this.primaryGLM : this.secondaryGLM

    const prompt = `Оцени следующие результаты работы агентов:\n\n${results.map(r => 
      `[${r.agent}]: ${r.result.content}`
    ).join('\n\n')}\n\n

Предоставь оценку в формате JSON:
{
  "bestAgent": "имя лучшего агента",
  "qualityScore": 0-10,
  "reasoning": "обоснование выбора",
  "suggestions": ["список улучшений"]
}`

    try {
      const response = await glmService.generateCompletion(prompt, {
        systemPrompt: evaluationAgent.systemPrompt,
        temperature: 0.3,
        maxTokens: 1000,
        thinking: 'disabled'
      })

      const content = response.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      return jsonMatch 
        ? JSON.parse(jsonMatch[0])
        : { bestAgent: 'synthesizer', qualityScore: 7, reasoning: content }
    } catch (error) {
      console.error('Error evaluating results:', error)
      return { bestAgent: 'synthesizer', qualityScore: 5, reasoning: 'Ошибка оценки' }
    }
  }

  async selectBestResult(evaluations) {
    let bestEvaluation = null
    let bestScore = -1

    for (const evaluation of evaluations) {
      if (evaluation.evaluation.qualityScore > bestScore) {
        bestScore = evaluation.evaluation.qualityScore
        bestEvaluation = evaluation
      }
    }

    const bestAgentName = bestEvaluation.evaluation.bestAgent
    const bestResult = bestEvaluation.results.find(r => r.agent === bestAgentName)

    return {
      result: bestResult,
      evaluation: bestEvaluation.evaluation,
      iteration: bestEvaluation.iteration
    }
  }

  async executePipeline(task, pipeline) {
    const results = []

    for (const stage of pipeline) {
      const stageAgents = stage.agents || ['researcher', 'critic']
      const stageTask = {
        ...task,
        type: stage.type,
        description: stage.description
      }

      const stageResult = await this.executeABMCTS(stageTask, stageAgents)
      
      results.push({
        stage: stage.name,
        result: stageResult,
        completedAt: new Date().toISOString()
      })

      task.context = `${task.context || ''}\n\nРезультат этапа "${stage.name}": ${stageResult.bestResult.result.content}`
    }

    return {
      success: true,
      pipelineResults: results,
      finalResult: results[results.length - 1].result.bestResult
    }
  }

  getPipelines() {
    return {
      hypothesisGeneration: [
        {
          name: 'Анализ литературы',
          type: 'literature_analysis',
          description: 'Анализ существующих исследований и выявление пробелов',
          agents: ['researcher', 'critic']
        },
        {
          name: 'Генерация гипотез',
          type: 'hypothesis_generation',
          description: 'Формулирование проверяемых научных гипотез',
          agents: ['researcher', 'methodologist']
        },
        {
          name: 'Критический анализ',
          type: 'critical_analysis',
          description: 'Оценка качества и обоснованности гипотез',
          agents: ['critic', 'statistician']
        },
        {
          name: 'Синтез и финализация',
          type: 'synthesis',
          description: 'Формулирование итоговой гипотезы',
          agents: ['synthesizer', 'methodologist']
        }
      ],
      structureIdeas: [
        {
          name: 'Экстракция идей',
          type: 'idea_extraction',
          description: 'Извлечение ключевых идей из источников',
          agents: ['researcher']
        },
        {
          name: 'Кластеризация',
          type: 'clustering',
          description: 'Группировка идей по темам',
          agents: ['researcher', 'synthesizer']
        },
        {
          name: 'Структурирование',
          type: 'structuring',
          description: 'Создание логической структуры',
          agents: ['synthesizer', 'methodologist']
        }
      ],
      literatureReview: [
        {
          name: 'Анализ источников',
          type: 'source_analysis',
          description: 'Анализ научных источников',
          agents: ['researcher', 'critic']
        },
        {
          name: 'Идентификация тем',
          type: 'theme_identification',
          description: 'Выявление основных тем',
          agents: ['researcher', 'synthesizer']
        },
        {
          name: 'Синтез',
          type: 'review_synthesis',
          description: 'Синтез обзора литературы',
          agents: ['synthesizer', 'methodologist']
        }
      ],
      metaAnalysis: [
        {
          name: 'Сбор данных',
          type: 'data_collection',
          description: 'Сбор статистических данных из исследований',
          agents: ['researcher', 'statistician']
        },
        {
          name: 'Статистический анализ',
          type: 'statistical_analysis',
          description: 'Мета-аналитический расчет эффектов',
          agents: ['statistician']
        },
        {
          name: 'Интерпретация',
          type: 'interpretation',
          description: 'Интерпретация результатов',
          agents: ['synthesizer', 'methodologist']
        }
      ]
    }
  }

  updateAPIKeys(apiKeys) {
    if (apiKeys.primary) {
      this.primaryAPIKey = apiKeys.primary
      this.agents.researcher.apiKey = apiKeys.primary
      this.agents.synthesizer.apiKey = apiKeys.primary
      this.agents.statistician.apiKey = apiKeys.primary
    }

    if (apiKeys.secondary) {
      this.secondaryAPIKey = apiKeys.secondary
      this.agents.critic.apiKey = apiKeys.secondary
      this.agents.methodologist.apiKey = apiKeys.secondary
    }
  }
}

class GLMClient {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseURL = 'https://open.bigmodel.cn/api/paas/v4'
    this.chat = {
      completions: {
        create: async (params) => {
          const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(params)
          })

          if (!response.ok) {
            const error = await response.text()
            throw new Error(`GLM API Error: ${response.status} - ${error}`)
          }

          return response.json()
        }
      }
    }
  }
}

export default MultiAgentService
