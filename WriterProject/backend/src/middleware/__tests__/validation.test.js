import { validateBody, textValidationSchema, styleValidationSchema, generateContentValidationSchema } from '../validation.js'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('validateBody', () => {
  let mockReq, mockRes, mockNext

  beforeEach(() => {
    mockReq = { body: {} }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    mockNext = vi.fn()
  })

  describe('Required field validation', () => {
    it('should pass with valid required field', () => {
      mockReq.body = { text: 'Valid text' }
      const middleware = validateBody({ text: { type: 'string', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('should fail when required field is missing', () => {
      mockReq.body = {}
      const middleware = validateBody({ text: { type: 'string', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['text is required']
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail when required field is null', () => {
      mockReq.body = { text: null }
      const middleware = validateBody({ text: { type: 'string', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['text is required']
      })
    })

    it('should fail when required field is empty string', () => {
      mockReq.body = { text: '' }
      const middleware = validateBody({ text: { type: 'string', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['text is required']
      })
    })

    it('should pass when optional field is missing', () => {
      mockReq.body = { text: 'Valid' }
      const middleware = validateBody({ 
        text: { type: 'string', required: true },
        optionalField: { type: 'string', required: false }
      })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Type validation', () => {
    it('should pass with correct string type', () => {
      mockReq.body = { text: 'Hello World' }
      const middleware = validateBody({ text: { type: 'string', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail with wrong string type (number)', () => {
      mockReq.body = { text: 123 }
      const middleware = validateBody({ text: { type: 'string', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['text must be a string']
      })
    })

    it('should pass with correct number type', () => {
      mockReq.body = { count: 42 }
      const middleware = validateBody({ count: { type: 'number', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail with wrong number type (string)', () => {
      mockReq.body = { count: '42' }
      const middleware = validateBody({ count: { type: 'number', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['count must be a number']
      })
    })

    it('should pass with correct array type', () => {
      mockReq.body = { items: [1, 2, 3] }
      const middleware = validateBody({ items: { type: 'array', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail with wrong array type', () => {
      mockReq.body = { items: 'not an array' }
      const middleware = validateBody({ items: { type: 'array', required: true } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['items must be an array']
      })
    })
  })

  describe('Length validation', () => {
    it('should pass with valid minLength', () => {
      mockReq.body = { text: 'Hello' }
      const middleware = validateBody({ text: { type: 'string', required: true, minLength: 3 } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail with string shorter than minLength', () => {
      mockReq.body = { text: 'Hi' }
      const middleware = validateBody({ text: { type: 'string', required: true, minLength: 5 } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['text must be at least 5 characters']
      })
    })

    it('should pass with valid maxLength', () => {
      mockReq.body = { text: 'Hello' }
      const middleware = validateBody({ text: { type: 'string', required: true, maxLength: 10 } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail with string longer than maxLength', () => {
      mockReq.body = { text: 'This is a very long string' }
      const middleware = validateBody({ text: { type: 'string', required: true, maxLength: 10 } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['text must be no more than 10 characters']
      })
    })
  })

  describe('Range validation', () => {
    it('should pass with valid min value', () => {
      mockReq.body = { count: 10 }
      const middleware = validateBody({ count: { type: 'number', required: true, min: 5 } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail with value below min', () => {
      mockReq.body = { count: 3 }
      const middleware = validateBody({ count: { type: 'number', required: true, min: 5 } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['count must be at least 5']
      })
    })

    it('should pass with valid max value', () => {
      mockReq.body = { count: 10 }
      const middleware = validateBody({ count: { type: 'number', required: true, max: 20 } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail with value above max', () => {
      mockReq.body = { count: 25 }
      const middleware = validateBody({ count: { type: 'number', required: true, max: 20 } })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['count must be no more than 20']
      })
    })
  })

  describe('Enum validation', () => {
    it('should pass with valid enum value', () => {
      mockReq.body = { style: 'academic' }
      const middleware = validateBody({ 
        style: { type: 'string', required: true, enum: ['academic', 'formal', 'casual'] }
      })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail with invalid enum value', () => {
      mockReq.body = { style: 'invalid' }
      const middleware = validateBody({ 
        style: { type: 'string', required: true, enum: ['academic', 'formal', 'casual'] }
      })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['style must be one of: academic, formal, casual']
      })
    })
  })

  describe('Multiple errors', () => {
    it('should collect all validation errors', () => {
      mockReq.body = { text: '', count: 'not a number', style: 'invalid' }
      const middleware = validateBody({
        text: { type: 'string', required: true, minLength: 5 },
        count: { type: 'number', required: true },
        style: { type: 'string', required: true, enum: ['academic', 'formal'] }
      })
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      const details = mockRes.json.mock.calls[0][0].details
      expect(details).toContain('text is required')
      expect(details).toContain('count must be a number')
      expect(details).toContain('style must be one of: academic, formal')
    })
  })

  describe('Predefined schema validation', () => {
    it('should validate textValidationSchema correctly', () => {
      mockReq.body = { text: 'Valid text content' }
      const middleware = validateBody(textValidationSchema)
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should validate styleValidationSchema correctly', () => {
      mockReq.body = { 
        text: 'Valid text content', 
        targetStyle: 'academic' 
      }
      const middleware = validateBody(styleValidationSchema)
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('should validate generateContentValidationSchema correctly', () => {
      mockReq.body = { 
        prompt: 'This is a valid prompt with enough characters', 
        genre: 'fiction' 
      }
      const middleware = validateBody(generateContentValidationSchema)
      
      middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
