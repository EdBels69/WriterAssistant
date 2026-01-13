class AIRequestHandler {
  constructor(smartRouter) {
    this.smartRouter = smartRouter
  }

  setApiKey(apiKey) {
    if (apiKey) {
      this.smartRouter.openRouterApiKey = apiKey
    }
  }

  async routeRequest(taskType, userPrompt, options = {}) {
    const {
      systemPrompt,
      temperature = 0.7,
      maxTokens = 2048,
      priority = 'balanced',
      forceProvider,
      openRouterKey,
      onProgress
    } = options

    this.setApiKey(openRouterKey)

    const requestOptions = {
      systemPrompt,
      temperature,
      maxTokens,
      priority,
      forceProvider,
      onProgress
    }

    return await this.smartRouter.routeRequest(taskType, userPrompt, requestOptions)
  }

  async routeRequestWithChunking(taskType, text, options = {}) {
    const {
      systemPrompt,
      temperature = 0.7,
      maxTokens = 4096,
      priority = 'balanced',
      forceProvider,
      openRouterKey,
      provider,
      onProgress
    } = options

    this.setApiKey(openRouterKey)

    const requestOptions = {
      systemPrompt,
      temperature,
      maxTokens,
      priority,
      forceProvider,
      provider,
      onProgress
    }

    return await this.smartRouter.routeRequestWithChunking(taskType, text, requestOptions)
  }

  async makeRequest(req, res, taskType, promptFn, defaultOptions = {}) {
    try {
      const { provider, openRouterKey, ...body } = req.body
      const userPrompt = typeof promptFn === 'function' ? promptFn(body) : promptFn

      const options = {
        ...defaultOptions,
        forceProvider: provider || defaultOptions.forceProvider,
        openRouterKey
      }

      const result = provider 
        ? await this.routeRequest(taskType, userPrompt, options)
        : await this.routeRequestWithChunking(taskType, body.text || userPrompt, options)

      res.json(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

export default AIRequestHandler
