export const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = []
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field]
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`)
        continue
      }
      
      if (value !== undefined && value !== null) {
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`${field} must be a string`)
        }
        
        if (rules.type === 'number' && typeof value !== 'number') {
          errors.push(`${field} must be a number`)
        }
        
        if (rules.type === 'array' && !Array.isArray(value)) {
          errors.push(`${field} must be an array`)
        }
        
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`)
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters`)
        }
        
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`)
        }
        
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be no more than ${rules.max}`)
        }
        
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`)
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }
    
    next()
  }
}

export const textValidationSchema = {
  text: { type: 'string', required: true, minLength: 1, maxLength: 100000 }
}

export const styleValidationSchema = {
  text: { type: 'string', required: true, minLength: 1, maxLength: 100000 },
  targetStyle: { type: 'string', required: true, enum: ['academic', 'formal', 'casual', 'creative'] }
}

export const generateContentValidationSchema = {
  prompt: { type: 'string', required: true, minLength: 10, maxLength: 5000 },
  genre: { type: 'string', required: false },
  tone: { type: 'string', required: false }
}

export const researchValidationSchema = {
  query: { type: 'string', required: true, minLength: 3, maxLength: 1000 },
  sources: { type: 'array', required: false }
}

export const projectValidationSchema = {
  userId: { type: 'string', required: true },
  name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  genre: { type: 'string', required: false },
  description: { type: 'string', required: false, maxLength: 1000 },
  targetWords: { type: 'number', required: false, min: 0 },
  pipelineType: { type: 'string', required: false }
}

export const updateProjectValidationSchema = {
  name: { type: 'string', required: false, minLength: 1, maxLength: 200 },
  genre: { type: 'string', required: false },
  description: { type: 'string', required: false, maxLength: 1000 },
  targetWords: { type: 'number', required: false, min: 0 }
}

export const chapterValidationSchema = {
  title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
  content: { type: 'string', required: false },
  orderIndex: { type: 'number', required: false, min: 0 }
}

export const characterValidationSchema = {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  role: { type: 'string', required: false },
  description: { type: 'string', required: false, maxLength: 500 },
  traits: { type: 'array', required: false },
  backstory: { type: 'string', required: false, maxLength: 1000 }
}

export const generateIdeasValidationSchema = {
  genre: { type: 'string', required: true },
  theme: { type: 'string', required: true },
  count: { type: 'number', required: false, min: 1, max: 20 },
  text: { type: 'string', required: false }
}

export const generateOutlineValidationSchema = {
  storyIdea: { type: 'string', required: true },
  chapters: { type: 'number', required: false, min: 1, max: 50 }
}

export const expandTextValidationSchema = {
  text: { type: 'string', required: true },
  context: { type: 'string', required: false }
}

export const chatValidationSchema = {
  userId: { type: 'string', required: true },
  projectId: { type: 'string', required: false },
  sessionId: { type: 'string', required: false },
  message: { type: 'string', required: true, minLength: 1 },
  mode: { type: 'string', required: false, enum: ['creative', 'editor', 'analyst'] },
  settings: { type: 'object', required: false }
}

export const commentValidationSchema = {
  projectId: { type: 'number', required: false },
  chapterId: { type: 'number', required: false },
  userId: { type: 'number', required: true },
  content: { type: 'string', required: true, minLength: 1 },
  position: { type: 'number', required: false }
}

export const updateCommentValidationSchema = {
  content: { type: 'string', required: false, minLength: 1 },
  isResolved: { type: 'boolean', required: false }
}

export const exportTextValidationSchema = {
  text: { type: 'string', required: true },
  title: { type: 'string', required: false }
}

export const exportProjectValidationSchema = {
  project: { type: 'object', required: true }
}

export const goalValidationSchema = {
  userId: { type: 'string', required: true },
  projectId: { type: 'string', required: false },
  type: { type: 'string', required: true },
  targetValue: { type: 'number', required: true, min: 1 },
  deadline: { type: 'string', required: false }
}

export const updateGoalValidationSchema = {
  currentValue: { type: 'number', required: false, min: 0 },
  status: { type: 'string', required: false, enum: ['active', 'completed', 'paused'] }
}

export const createGoalValidationSchema = {
  userId: { type: 'string', required: true },
  projectId: { type: 'string', required: false },
  type: { type: 'string', required: true },
  targetValue: { type: 'number', required: true, min: 1 },
  deadline: { type: 'string', required: false }
}

export const documentUploadValidationSchema = {
  userId: { type: 'string', required: true },
  projectId: { type: 'string', required: false },
  documentType: { type: 'string', required: false }
}

export const documentStatusValidationSchema = {
  status: { type: 'string', required: true }
}
