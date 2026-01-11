import axios from 'axios'

class GLMService {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseURL = 'https://api.z.ai/api/paas/v4'
    this.codingURL = 'https://api.z.ai/api/coding/paas/v4'
    this.model = 'glm-4.7'
  }

  async generateCompletion(prompt, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = null,
      context = [],
      thinking = 'disabled'
    } = options

    const messages = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push(...context)
    messages.push({ role: 'user', content: prompt })

    const requestBody = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens
    }

    if (thinking !== 'disabled') {
      requestBody.thinking = { type: thinking }
    }

    const url = `${this.codingURL}/chat/completions`

    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000
      })

      return {
        success: true,
        content: response.data.choices[0].message.content,
        thinking: response.data.choices[0].message.reasoning_content,
        usage: response.data.usage
      }
    } catch (error) {
      console.error('GLM API Error:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      }
    }
  }

  async generateIdeas(genre, theme, count = 5, text = '') {
    const systemPrompt = `Ты - профессиональный писатель и консультант по сюжетам. Создавай уникальные и интересные идеи для литературных произведений.`

    let prompt = ''
    if (text && text.trim()) {
      prompt = `Проанализируй следующий текст и создай ${count} идей для ${genre} на основе этого текста:

Текст для анализа:
${text}

Жанр: ${genre === 'Автоматическое определение из текста' ? 'Определи на основе текста' : genre}
Тема: ${theme === 'Автоматическое определение из текста' ? 'Определи на основе текста' : theme}

Для каждой идеи укажи:
1. Заголовок/название
2. Краткое описание (2-3 предложения)
3. Главный конфликт
4. Интересный поворот

Формат: нумерованный список с четкой структурой.`
    } else {
      prompt = `Создай ${count} идей для ${genre} на тему "${theme}". 
Для каждой идеи укажи:
1. Заголовок/название
2. Краткое описание (2-3 предложения)
3. Главный конфликт
4. Интересный поворот

Формат: нумерованный список с четкой структурой.`
    }

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.8,
      maxTokens: 1500
    })
  }

  async expandText(text, context = '') {
    const systemPrompt = `Ты - талантливый писатель-соавтор. Расширяй и дополняй текст, сохраняя стиль и тон оригинала. Добавляй детали, эмоции и атмосферу.`

    const prompt = `Расширь следующий текст, сохранив его стиль и продолжив сюжет:

Текст:
${text}

${context ? `Контекст: ${context}` : ''}

Расширенный текст:`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1000
    })
  }

  async editStyle(text, targetStyle) {
    const systemPrompt = `Ты - мастер стилистических редактирования. Меняй стиль текста в соответствии с запросом, сохраняя смысл и основные идеи.`

    const prompt = `Перепиши следующий текст в стиле: "${targetStyle}"

Исходный текст:
${text}`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 1000
    })
  }

  async generateCharacter(name, role, genre) {
    const systemPrompt = `Ты - эксперт по созданию персонажей для литературных произведений. Создавай глубоких, реалистичных и интересных персонажей.`

    const prompt = `Создай детальный профиль персонажа для ${genre}:
Имя: ${name}
Роль: ${role}

Включи:
1. Внешность (детали)
2. Характер и черты личности
3. Предыстория
4. Мотивации и цели
5. Внутренние конфликты
6. Уникальные особенности или привычки`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.75,
      maxTokens: 1200
    })
  }

  async generatePlotOutline(storyIdea, chapters = 10) {
    const systemPrompt = `Ты - мастер построения сюжетов. Создавай структурированные и логичные планы для литературных произведений.`

    const prompt = `Создай детальный план на ${chapters} глав для истории:
${storyIdea}

Для каждой главы укажи:
1. Основные события
2. Ключевые сцены
3. Развитие сюжета
4. Кульминационные моменты (если есть)`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 2000
    })
  }

  async generateDialogue(character1, character2, situation, tone) {
    const systemPrompt = `Ты - эксперт по написанию диалогов. Создавай естественные, характерные и продвигающие сюжет диалоги.`

    const prompt = `Напиши диалог между:
${character1} и ${character2}

Ситуация: ${situation}
Тон: ${tone}

Диалог должен быть естественным, характерным для персонажей и продвигать сюжет.`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 800
    })
  }

  async improveWriting(text, focusArea = 'general') {
    const focusAreas = {
      general: 'улучшения общего качества текста',
      grammar: 'исправления грамматики и орфографии',
      flow: 'улучшения плавности и связности текста',
      vocabulary: 'обогащения словарного запаса',
      clarity: 'улучшения ясности и понятности',
      pacing: 'оптимизации темпа и ритма'
    }

    const systemPrompt = `Ты - профессиональный редактор. Улучшай текст, сохраняя голос и стиль автора.`

    const prompt = `Улучши этот текст с фокусом на ${focusAreas[focusArea] || focusArea}:

${text}

Верни улучшенную версию с краткими комментариями о внесенных изменениях.`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 1500
    })
  }

  async generateDescription(scene, type = 'visual') {
    const systemPrompt = `Ты - мастер описательной литературы. Создавай яркие, атмосферные и эмоциональные описания.`

    const prompt = `Напиши детальное описание (${type}) сцены:
${scene}

Описание должно быть:
1. Ярким и образным
2. Атмосферным
3. Эмоционально насыщенным
4. Сенсорным (зрение, слух, запах и т.д.)`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.8,
      maxTokens: 800
    })
  }

  async analyzeText(text, analysisType = 'general') {
    const systemPrompt = `Ты - литературный критик и аналитик. Проводи глубокий и объективный анализ текстов.`

    const prompt = `Проведи ${analysisType} анализ следующего текста:
${text}

Включи:
1. Общее впечатление
2. Сильные стороны
3. Области для улучшения
4. Конкретные рекомендации`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 1500
    })
  }

  async brainstorm(topic, category = 'ideas') {
    const systemPrompt = `Ты - креативный генератор идей. Генерируй оригинальные и разнообразные идеи.`

    const prompt = `Сгенерируй 10 идей для категории "${category}" по теме "${topic}". 
Каждая идея должна быть уникальной, интересной и применимой.`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.9,
      maxTokens: 1200
    })
  }

  async generateHypothesis(researchArea, researchQuestion) {
    const systemPrompt = `Ты - опытный научный исследователь и методолог. Создавай научно обоснованные и проверяемые гипотезы для исследований.`

    const prompt = `Сформулируй исследовательские гипотезы для:
Область исследования: ${researchArea}
Исследовательский вопрос: ${researchQuestion}

Включи:
1. Основную гипотезу (H1)
2. Нулевую гипотезу (H0)
3. Альтернативные гипотезы (если применимо)
4. Обоснование каждой гипотезы
5. Переменные (независимые, зависимые, контрольные)
6. Предполагаемые направления проверки`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1500,
      thinking: 'enabled'
    })
  }

  async structureIdeas(sources, researchGoal) {
    const systemPrompt = `Ты - эксперт по анализу литературы и синтезу научных идей. Структурируй и систематизируй информацию из источников.`

    const prompt = `Проанализируй и структурируй основные идеи из следующих источников:
${sources}

Цель исследования: ${researchGoal}

Включи:
1. Ключевые темы и концепции
2. Сходства и различия между источниками
3. Группировка идей по тематическим блокам
4. Выявленные пробелы в исследованиях
5. Направления для дальнейшего исследования
6. Визуальная схема структуры (текстовое описание)`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 2000,
      thinking: 'enabled'
    })
  }

  async structureMethodology(researchDesign, variables) {
    const systemPrompt = `Ты - эксперт по исследовательским методологиям. Создавай детальные и валидные планы исследований.`

    const prompt = `Разработай детальную методологию для исследования:
Дизайн исследования: ${researchDesign}
Переменные: ${variables}

Включи:
1. Тип исследования (экспериментальное, корреляционное, качественное и т.д.)
2. Выборка и критерии включения/исключения
3. Методы сбора данных
4. Инструменты и оборудование
5. Процедура исследования (пошагово)
6. План анализа данных
7. Этические соображения
8. Ограничения и способы их минимизации`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 2000,
      thinking: 'enabled'
    })
  }

  async literatureReview(topic, reviewType = 'narrative', text = '') {
    const reviewTypes = {
      narrative: 'нарративного обзора литературы',
      systematic: 'систематического обзора литературы',
      'meta-analysis': 'мета-анализа'
    }

    const systemPrompt = `Ты - эксперт по проведению обзоров литературы. Создавай структурированные и критические обзоры научной литературы.`

    let prompt = ''
    if (text && text.trim()) {
      prompt = `Проанализируй следующий текст и разработай структуру для ${reviewTypes[reviewType] || reviewType}:

Текст для анализа:
${text}

Тема: ${topic === 'Автоматическое определение из текста' ? 'Определи на основе текста' : topic}

Включи:
1. Формулировку исследовательского вопроса(ов)
2. Критерии включения и исключения исследований
3. Источники и базы данных для поиска
4. Ключевые слова и стратегии поиска
5. Процесс отбора исследований
6. Критерии оценки качества
7. Методы синтеза данных
8. Структура обзора (разделы и подразделы)
9. Потенциальные ограничения обзора`
    } else {
      prompt = `Разработай структуру для ${reviewTypes[reviewType] || reviewType} по теме:
${topic}

Включи:
1. Формулировку исследовательского вопроса(ов)
2. Критерии включения и исключения исследований
3. Источники и базы данных для поиска
4. Ключевые слова и стратегии поиска
5. Процесс отбора исследований
6. Критерии оценки качества
7. Методы синтеза данных
8. Структура обзора (разделы и подразделы)
9. Потенциальные ограничения обзора`
    }

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 2000,
      thinking: 'enabled'
    })
  }

  async statisticalAnalysis(dataDescription, analysisGoal) {
    const analysisGoals = {
      описательная: 'описательной статистики',
      сравнительная: 'сравнительного анализа',
      корреляционная: 'корреляционного анализа',
      регрессионная: 'регрессионного анализа'
    }

    const systemPrompt = `Ты - статистик и аналитик данных. Разрабатывай корректные планы статистического анализа.`

    const prompt = `Разработай план ${analysisGoals[analysisGoal] || analysisGoal} для:
${dataDescription}

Включи:
1. Типы данных (номинальные, порядковые, интервальные, отношения)
2. Проверка предположений (нормальность, гомоскедастичность и т.д.)
3. Выбор статистических тестов с обоснованием
4. Программное обеспечение для анализа
5. Представление результатов (таблицы, графики, визуализации)
6. Интерпретация возможных результатов
7. Размер выборки и статистическая мощность
8. Обработка пропущенных данных и выбросов`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 2000,
      thinking: 'enabled'
    })
  }

  async editText(text, context = null) {
    const systemPrompt = `Ты - профессиональный редактор научных и учебных текстов. Редактируй текст, сохраняя смысл и стиль.`

    let prompt = `Отредактируй следующий текст:

${text}`

    if (context && context.context) {
      prompt += `\n\nКонтекст предыдущего фрагмента:\n${context.context.substring(-500)}`
    }

    prompt += `\n\nВерни отредактированную версию с краткими комментариями об изменениях.`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 1500
    })
  }

  async summarizeText(text) {
    const systemPrompt = `Ты - эксперт по суммированию текстов. Создавай краткие, информативные и точные резюме.`

    const prompt = `Создай краткое и информативное резюме следующего текста:

${text}

Резюме должно:
1. Включать основные идеи и ключевые моменты
2. Быть сжатым и понятным
3. Сохранять важную информацию
4. Быть структурированным (списки, абзацы)`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 1000
    })
  }

  async generateResearchDesign(researchQuestion, researchType) {
    const systemPrompt = `Ты - эксперт по исследовательским методологиям. Создавай детальные и валидные дизайны исследований.`

    const prompt = `Разработай детальный дизайн исследования:
Исследовательский вопрос: ${researchQuestion}
Тип исследования: ${researchType}

Включи:
1. Гипотезы исследования
2. Дизайн исследования (детальное описание)
3. Выборка (размер, критерии включения/исключения)
4. Методы сбора данных
5. Инструменты и оборудование
6. Процедура исследования (пошагово)
7. Переменные (независимые, зависимые, контрольные)
8. План анализа данных
9. Этические соображения
10. Ограничения и способы их минимизации`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 2500
    })
  }

  async analyzeResults(results, context = '') {
    const systemPrompt = `Ты - эксперт по анализу данных и интерпретации результатов исследований. Анализируй результаты объективно и критически.`

    let prompt = `Проанализируй следующие результаты исследования:

${results}`

    if (context) {
      prompt += `\n\nКонтекст исследования:\n${context}`
    }

    prompt += `\n\nВключи:
1. Статистическую значимость результатов
2. Практическую значимость
3. Сопоставление с гипотезами
4. Ограничения интерпретации
5. Альтернативные объяснения
6. Рекомендации для дальнейшего анализа`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 2000,
      thinking: 'enabled'
    })
  }

  async generateDiscussion(results, context = '') {
    const systemPrompt = `Ты - эксперт по написанию научных статей. Создавай убедительные и хорошо структурированные разделы обсуждения.`

    let prompt = `Напиши раздел обсуждения для исследования:

Результаты:
${results}`

    if (context) {
      prompt += `\n\nКонтекст:\n${context}`
    }

    prompt += `\n\nОбсуждение должно включать:
1. Интерпретацию результатов
2. Сопоставление с предыдущими исследованиями
3. Объяснение неожиданных результатов
4. Теоретические и практические implications
5. Ограничения исследования
6. Направления для будущих исследований`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 2000,
      thinking: 'enabled'
    })
  }

  async generateConclusion(results, discussion = '') {
    const systemPrompt = `Ты - эксперт по написанию научных статей. Создавай убедительные и точные заключения.`

    let prompt = `Напиши заключение для исследования:

Результаты:
${results}`

    if (discussion) {
      prompt += `\n\nОсновные выводы из обсуждения:\n${discussion}`
    }

    prompt += `\n\nЗаключение должно включать:
1. Краткое резюме основных выводов
2. Ответ на исследовательский вопрос
3. Теоретическое значение
4. Практическое значение
5. Краткие рекомендации
6. Конкретное заключительное утверждение`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 1500
    })
  }

  async improveAcademicStyle(text, focusArea = 'clarity') {
    const focusAreas = {
      clarity: 'улучшения ясности и понятности',
      flow: 'улучшения плавности и связности текста',
      vocabulary: 'использования академической терминологии',
      conciseness: 'повышения лаконичности и устранения избыточности',
      formal: 'повышения формальности и академического тона'
    }

    const systemPrompt = `Ты - профессиональный редактор научных текстов. Улучшай текст, сохраняя смысл и научную точность.`

    const prompt = `Улучши академический стиль следующего текста с фокусом на ${focusAreas[focusArea] || focusArea}:

${text}

Верни улучшенную версию с краткими комментариями о внесенных изменениях. Учитывай:
- Академическую терминологию
- Формальный тон
- Точность и ясность
- Научную конвенцию стиля`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 1500
    })
  }

  async analyzeUploadedFile(fileContent, fileName, analysisType = 'comprehensive') {
    const analysisTypes = {
      comprehensive: 'комплексного анализа',
      summary: 'резюме',
      keyPoints: 'выделения ключевых идей',
      structure: 'анализа структуры',
      methodology: 'анализа методологии',
      references: 'анализа библиографии'
    }

    const systemPrompt = `Ты - эксперт по анализу научных и учебных текстов. Проводи глубокий и структурированный анализ загруженных файлов.`

    const prompt = `Проведи ${analysisTypes[analysisType] || analysisType} загруженного файла:
Название файла: ${fileName}

Содержимое:
${fileContent}

Включи:
1. Краткое резюме содержания
2. Основные идеи и концепции
3. Структура документа
4. Ключевые методы (если применимо)
5. Основные выводы
6. Потенциальные использования для исследования
7. Качество и достоверность информации
8. Рекомендации по интеграции в научную работу`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 2000
    })
  }

  async editUploadedFile(fileContent, fileName, editType = 'academic', instructions = '') {
    const editTypes = {
      academic: 'академического редактирования',
      simplify: 'упрощения текста',
      expand: 'расширения и детализации',
      correct: 'корректуры и исправления ошибок',
      restructure: 'реструктурирования',
      paraphrase: 'перефразирования'
    }

    const systemPrompt = `Ты - профессиональный редактор научных и учебных текстов. Выполняй качественное редактирование, сохраняя смысл и улучшая качество.`

    let prompt = `Выполни ${editTypes[editType] || editType} загруженного файла:
Название файла: ${fileName}

Содержимое:
${fileContent}`

    if (instructions) {
      prompt += `\n\nДополнительные инструкции:\n${instructions}`
    }

    prompt += `\n\nВерни:
1. Отредактированную версию текста
2. Краткое описание внесенных изменений
3. Комментарии о сохраненном смысле и улучшениях`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 2500
    })
  }

  async extractReferencesFromUpload(fileContent, fileName) {
    const systemPrompt = `Ты - эксперт по библиографии и научным ссылкам. Извлекай и структурируй ссылки из текстовых файлов.`

    const prompt = `Извлеки все библиографические ссылки и цитаты из загруженного файла:
Название файла: ${fileName}

Содержимое:
${fileContent}

Верни:
1. Список всех найденных ссылок в стандартизированном формате (APA/MLA/Chicago)
2. Информацию о количестве и типах источников
3. Выявленные дубликаты или несоответствия
4. Рекомендации по улучшению библиографии`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 1500
    })
  }

  async synthesizeMultipleUploads(uploadedFiles, researchGoal) {
    const systemPrompt = `Ты - эксперт по синтезу информации из множественных источников. Создавай связные и структурированные обзоры на основе загруженных файлов.`

    let prompt = `Синтезируй информацию из следующих загруженных файлов:
Цель исследования: ${researchGoal}

Файлы:
`

    uploadedFiles.forEach((file, index) => {
      prompt += `\n--- Файл ${index + 1}: ${file.fileName} ---\n${file.content.substring(0, 2000)}...\n`
    })

    prompt += `\n\nВерни:
1. Общее резюме всех файлов
2. Общие темы и концепции
3. Сходства и различия между источниками
4. Группировка информации по темам
5. Выявленные пробелы и противоречия
6. Интегрированные выводы
7. Рекомендации для исследования`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.6,
      maxTokens: 3000
    })
  }

  async generateCode(task, language, context = '') {
    const systemPrompt = `Ты - экспертный программист. Пиши чистый, эффективный и хорошо документированный код. Следуй лучшим практикам и стандартам выбранного языка.`

    let prompt = `Напиши код для задачи:
${task}\n\nЯзык программирования: ${language}`

    if (context) {
      prompt += `\n\nКонтекст:\n${context}`
    }

    prompt += `\n\nВключи:
1. Полный рабочий код
2. Комментарии к сложным частям
3. Объяснение подхода
4. Примеры использования (если применимо)`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 3000,
      thinking: 'enabled',
      useCodingAPI: true
    })
  }

  async reviewCode(code, language, focus = 'all') {
    const focusAreas = {
      all: 'общего качества кода',
      bugs: 'поиска ошибок и багов',
      performance: 'оптимизации производительности',
      security: 'анализа безопасности',
      style: 'стиля и читаемости',
      bestPractices: 'соответствия лучшим практикам'
    }

    const systemPrompt = `Ты - экспертный ревьюер кода. Проводи детальный и конструктивный анализ кода.`

    const prompt = `Проведи ревью кода с фокусом на ${focusAreas[focus] || focus}:
\nКод (${language}):
\`\`\`${language}\n${code}\n\`\`\`\n\nВключи:
1. Найденные проблемы (ошибки, баги, уязвимости)
2. Рекомендации по улучшению
3. Лучшие практики, которые можно применить
4. Конкретные примеры улучшенного кода (если применимо)`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 2500,
      thinking: 'enabled',
      useCodingAPI: true
    })
  }

  async debugCode(code, language, error = '') {
    const systemPrompt = `Ты - эксперт по отладке кода. Находи и исправляй ошибки эффективно и систематически.`

    let prompt = `Отладь следующий код (${language}):
\n\`\`\`${language}\n${code}\n\`\`\``

    if (error) {
      prompt += `\n\nОшибка/проблема:\n${error}`
    }

    prompt += `\n\nВключи:
1. Диагностику проблемы
2. Причину ошибки
3. Испленный код
4. Объяснение исправления
5. Рекомендации по предотвращению подобных ошибок`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
      thinking: 'enabled',
      useCodingAPI: true
    })
  }

  async optimizeCode(code, language, goal = 'performance') {
    const goals = {
      performance: 'оптимизации производительности',
      memory: 'оптимизации использования памяти',
      readability: 'улучшения читаемости',
      maintainability: 'улучшения поддерживаемости'
    }

    const systemPrompt = `Ты - эксперт по оптимизации кода. Создавай эффективные, чистые и поддерживаемые решения.`

    const prompt = `Оптимизируй код с целью ${goals[goal] || goal}:
\nКод (${language}):
\`\`\`${language}\n${code}\n\`\`\`\n\nВключи:
1. Оптимизированный код
2. Объяснение изменений
3. Сравнение производительности (если применимо)
4. Компромиссы и trade-offs
5. Дополнительные рекомендации по оптимизации`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 2500,
      thinking: 'enabled',
      useCodingAPI: true
    })
  }

  async explainCode(code, language, detail = 'high') {
    const detailLevels = {
      high: 'подробного объяснения',
      medium: 'среднего уровня детализации',
      low: 'краткого обзора'
    }

    const systemPrompt = `Ты - эксперт по объяснению кода. Объясняй код ясно, систематически и адаптивно.`

    const prompt = `Объясни код с уровнем детализации: ${detailLevels[detail] || detail}:
\nКод (${language}):
\`\`\`${language}\n${code}\n\`\`\`\n\nВключи:
1. Общее назначение кода
2. Разбор ключевых компонентов
3. Логику потока выполнения
4. Используемые алгоритмы и паттерны
5. Потенциальные проблемы или улучшения`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 2000,
      thinking: 'enabled',
      useCodingAPI: true
    })
  }

  async refactorCode(code, language, pattern = '') {
    const systemPrompt = `Ты - эксперт по рефакторингу. Преобразуй код в более чистый, модульный и поддерживаемый вид.`

    let prompt = `Рефакторинг кода (${language}):
\nИсходный код:
\`\`\`${language}\n${code}\n\`\`\``

    if (pattern) {
      prompt += `\n\nПрименить паттерн/подход: ${pattern}`
    }

    prompt += `\n\nВключи:
1. Рефакторенный код
2. Объяснение изменений
3. Примененные принципы (SOLID, DRY, KISS и т.д.)
4. Улучшения в структуре и архитектуре
5. Рекомендации по дальнейшему рефакторингу`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 2500,
      thinking: 'enabled',
      useCodingAPI: true
    })
  }

  async generateTests(code, language, framework = '') {
    const systemPrompt = `Ты - эксперт по тестированию кода. Пиши полные, надежные и поддерживаемые тесты.`

    let prompt = `Сгенерируй тесты для кода (${language}):
\nИсходный код:
\`\`\`${language}\n${code}\n\`\`\``

    if (framework) {
      prompt += `\n\nТестовый фреймворк: ${framework}`
    }

    prompt += `\n\nВключи:
1. Unit тесты для основных функций
2. Edge cases и граничные условия
3. Интеграционные тесты (если применимо)
4. Mock тесты (если применимо)
5. Описание покрытия тестами`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 3000,
      thinking: 'enabled',
      useCodingAPI: true
    })
  }

  async generateDocumentation(code, language, docType = 'api') {
    const docTypes = {
      api: 'API документации',
      user: 'пользовательской документации',
      technical: 'технической документации',
      inline: 'inline комментариев'
    }

    const systemPrompt = `Ты - эксперт по документированию кода. Создавай четкую, полную и полезную документацию.`

    const prompt = `Сгенерируй ${docTypes[docType] || docType} для кода (${language}):
\nКод:
\`\`\`${language}\n${code}\n\`\`\`\n\nВключи:
1. Общее описание
2. Параметры и возвращаемые значения
3. Примеры использования
4. Возможные ошибки и исключения
5. Зависимости и требования`

    return this.generateCompletion(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
      thinking: 'enabled',
      useCodingAPI: true
    })
  }
}

export default GLMService