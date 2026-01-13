import SmartRouter from '../SmartRouter.js'
import { describe, test, expect, beforeEach } from 'vitest'

describe('SmartRouter', () => {
  let router

  beforeEach(() => {
    router = new SmartRouter('test-primary-key', 'test-secondary-key')
  })

  describe('getTaskType', () => {
    describe('Hypothesis task type detection', () => {
      test('should detect hypothesis from "hypothesis"', () => {
        expect(router.getTaskType('hypothesis generation')).toBe('hypothesis')
      })

      test('should detect hypothesis from "гипотеза"', () => {
        expect(router.getTaskType('создание гипотезы')).toBe('hypothesis')
      })

      test('should detect hypothesis from "research"', () => {
        expect(router.getTaskType('research design')).toBe('hypothesis')
      })

      test('should detect hypothesis from "исследование"', () => {
        expect(router.getTaskType('план исследования')).toBe('hypothesis')
      })
    })

    describe('Structure task type detection', () => {
      test('should detect structure from "structure"', () => {
        expect(router.getTaskType('structure my ideas')).toBe('structure')
      })

      test('should detect structure from "структура"', () => {
        expect(router.getTaskType('организуй структуру')).toBe('structure')
      })

      test('should detect structure from "ideas"', () => {
        expect(router.getTaskType('brainstorm ideas')).toBe('structure')
      })

      test('should detect structure from "идеи"', () => {
        expect(router.getTaskType('развивай идеи')).toBe('structure')
      })
    })

    describe('Literature task type detection', () => {
      test('should detect literature from "literature"', () => {
        expect(router.getTaskType('literature review')).toBe('literature')
      })

      test('should detect literature from "литература"', () => {
        expect(router.getTaskType('обзор литературы')).toBe('literature')
      })

      test('should detect literature from "review"', () => {
        expect(router.getTaskType('write a review')).toBe('literature')
      })

      test('should detect literature from "обзор"', () => {
        expect(router.getTaskType('сделай обзор')).toBe('literature')
      })
    })

    describe('Methodology task type detection', () => {
      test('should detect methodology from "methodology"', () => {
        expect(router.getTaskType('design methodology')).toBe('methodology')
      })

      test('should detect methodology from "методология"', () => {
        expect(router.getTaskType('разработай методологию')).toBe('methodology')
      })

      test('should detect methodology from "method"', () => {
        expect(router.getTaskType('choose research method')).toBe('methodology')
      })

      test('should detect methodology from "метод"', () => {
        expect(router.getTaskType('выбери метод')).toBe('methodology')
      })
    })

    describe('Analysis task type detection', () => {
      test('should detect analysis from "analysis"', () => {
        expect(router.getTaskType('perform analysis')).toBe('analysis')
      })

      test('should detect analysis from "анализ"', () => {
        expect(router.getTaskType('сделай анализ')).toBe('analysis')
      })

      test('should detect analysis from "statistical"', () => {
        expect(router.getTaskType('statistical analysis')).toBe('analysis')
      })

      test('should detect analysis from "статистика"', () => {
        expect(router.getTaskType('проведи статистику')).toBe('analysis')
      })
    })

    describe('Code task type detection', () => {
      test('should detect code from "code"', () => {
        expect(router.getTaskType('generate code')).toBe('code')
      })

      test('should detect code from "код"', () => {
        expect(router.getTaskType('напиши код')).toBe('code')
      })

      test('should detect code from "generate"', () => {
        expect(router.getTaskType('generate content')).toBe('code')
      })

      test('should detect code from "генерация"', () => {
        expect(router.getTaskType('генерация текста')).toBe('code')
      })

      test('should detect code from "debug"', () => {
        expect(router.getTaskType('debug my code')).toBe('code')
      })

      test('should detect code from "refactor"', () => {
        expect(router.getTaskType('refactor code')).toBe('code')
      })

      test('should detect code from "рефакторинг"', () => {
        expect(router.getTaskType('рефакторинг кода')).toBe('code')
      })
    })

    describe('Style task type detection', () => {
      test('should detect style from "style"', () => {
        expect(router.getTaskType('improve style')).toBe('style')
      })

      test('should detect style from "стиль"', () => {
        expect(router.getTaskType('улучшить стиль')).toBe('style')
      })

      test('should detect style from "academic"', () => {
        expect(router.getTaskType('academic writing')).toBe('style')
      })

      test('should detect style from "академический"', () => {
        expect(router.getTaskType('академический текст')).toBe('style')
      })

      test('should detect style from "edit"', () => {
        expect(router.getTaskType('edit my text')).toBe('style')
      })

      test('should detect style from "редактирование"', () => {
        expect(router.getTaskType('редактирование текста')).toBe('style')
      })
    })

    describe('General task type fallback', () => {
      test('should return general for unrecognized tasks', () => {
        expect(router.getTaskType('some random task')).toBe('general')
      })

      test('should return general for empty string', () => {
        expect(router.getTaskType('')).toBe('general')
      })

      test('should return general for numeric input', () => {
        expect(router.getTaskType('12345')).toBe('general')
      })

      test('should return general for special characters only', () => {
        expect(router.getTaskType('!@#$%')).toBe('general')
      })
    })

    describe('Case sensitivity', () => {
      test('should be case insensitive for English', () => {
        expect(router.getTaskType('HYPOTHESIS')).toBe('hypothesis')
        expect(router.getTaskType('Hypothesis')).toBe('hypothesis')
      })

      test('should be case insensitive for Russian', () => {
        expect(router.getTaskType('ГИПОТЕЗА')).toBe('hypothesis')
        expect(router.getTaskType('Гипотеза')).toBe('hypothesis')
      })
    })

    describe('Mixed language detection', () => {
      test('should detect task type in mixed language input', () => {
        expect(router.getTaskType('generate hypothesis generation')).toBe('hypothesis')
        expect(router.getTaskType('research literature review')).toBe('hypothesis')
        expect(router.getTaskType('structure methodology design')).toBe('structure')
      })
    })
  })

  describe('makeRoutingDecision', () => {
    describe('Force provider option', () => {
      test('should use forced provider regardless of other options', () => {
        const result = router.makeRoutingDecision('hypothesis', true, true, { forceProvider: 'qwen' })
        expect(result.provider).toBe('qwen')
      })

      test('should use forced glm-primary provider', () => {
        const result = router.makeRoutingDecision('code', false, false, { forceProvider: 'glm-primary' })
        expect(result.provider).toBe('glm-primary')
      })

      test('should use forced deepseek provider', () => {
        const result = router.makeRoutingDecision('style', false, true, { forceProvider: 'deepseek' })
        expect(result.provider).toBe('deepseek')
      })
    })

    describe('High priority routing', () => {
      test('should prefer glm-primary for hypothesis with high priority', () => {
        const result = router.makeRoutingDecision('hypothesis', false, false, { priority: 'high' })
        expect(result.provider).toBe('glm-primary')
      })

      test('should prefer deepseek for hypothesis if available with high priority', () => {
        const result = router.makeRoutingDecision('hypothesis', true, false, { priority: 'high' })
        expect(result.provider).toBe('deepseek')
      })

      test('should prefer glm-secondary if only option with high priority', () => {
        const result = router.makeRoutingDecision('literature', false, false, { priority: 'high' })
        expect(result.provider).toBe('glm-primary')
      })

      test('should route style task to glm-primary first with high priority', () => {
        const result = router.makeRoutingDecision('style', false, false, { priority: 'high' })
        expect(result.provider).toBe('glm-primary')
      })

      test('should route style task to qwen if available with high priority', () => {
        const result = router.makeRoutingDecision('style', false, true, { priority: 'high' })
        expect(result.provider).toBe('qwen')
      })
    })

    describe('Balanced priority routing (default)', () => {
      test('should use glm-primary for all task types by default', () => {
        const result1 = router.makeRoutingDecision('hypothesis', false, false)
        const result2 = router.makeRoutingDecision('structure', false, false)
        const result3 = router.makeRoutingDecision('literature', false, false)
        
        expect(result1.provider).toBe('glm-primary')
        expect(result2.provider).toBe('glm-primary')
        expect(result3.provider).toBe('glm-primary')
      })

      test('should use deepseek for research tasks if available with balanced priority', () => {
        const result = router.makeRoutingDecision('hypothesis', true, false, { priority: 'balanced' })
        expect(result.provider).toBe('deepseek')
      })

      test('should use qwen for style tasks if available with balanced priority', () => {
        const result = router.makeRoutingDecision('style', false, true, { priority: 'balanced' })
        expect(result.provider).toBe('qwen')
      })

      test('should fallback to glm-secondary if other providers unavailable', () => {
        const result = router.makeRoutingDecision('analysis', false, false, { priority: 'balanced' })
        expect(result.provider).toBe('glm-primary')
      })
    })

    describe('Cost priority routing', () => {
      test('should prefer qwen for style tasks with cost priority', () => {
        const result = router.makeRoutingDecision('style', false, true, { priority: 'cost' })
        expect(result.provider).toBe('qwen')
      })

      test('should use glm-primary for research tasks with cost priority', () => {
        const result = router.makeRoutingDecision('methodology', false, false, { priority: 'cost' })
        expect(result.provider).toBe('glm-primary')
      })

      test('should fallback to glm-primary if qwen unavailable with cost priority', () => {
        const result = router.makeRoutingDecision('style', false, false, { priority: 'cost' })
        expect(result.provider).toBe('glm-primary')
      })
    })

    describe('Provider availability handling', () => {
      test('should use glm-primary when deepseek and qwen unavailable', () => {
        const result = router.makeRoutingDecision('hypothesis', false, false)
        expect(result.provider).toBe('glm-primary')
      })

      test('should use deepseek when only deepseek available', () => {
        const result = router.makeRoutingDecision('analysis', true, false)
        expect(result.provider).toBe('deepseek')
      })

      test('should use qwen when only qwen available for style task', () => {
        const result = router.makeRoutingDecision('style', false, true)
        expect(result.provider).toBe('qwen')
      })

      test('should use glm-primary when both deepseek and qwen available for research', () => {
        const result = router.makeRoutingDecision('hypothesis', true, true)
        expect(result.provider).toBe('deepseek')
      })
    })

    describe('Task type specific routing', () => {
      test('should route hypothesis tasks correctly', () => {
        const result1 = router.makeRoutingDecision('hypothesis', true, false)
        const result2 = router.makeRoutingDecision('hypothesis', false, true)
        
        expect(result1.provider).toBe('deepseek')
        expect(result2.provider).toBe('glm-primary')
      })

      test('should route structure tasks correctly', () => {
        const result1 = router.makeRoutingDecision('structure', true, false)
        const result2 = router.makeRoutingDecision('structure', false, true)
        
        expect(result1.provider).toBe('deepseek')
        expect(result2.provider).toBe('glm-primary')
      })

      test('should route literature tasks correctly', () => {
        const result1 = router.makeRoutingDecision('literature', true, false)
        const result2 = router.makeRoutingDecision('literature', false, false)
        
        expect(result1.provider).toBe('deepseek')
        expect(result2.provider).toBe('glm-primary')
      })

      test('should route methodology tasks correctly', () => {
        const result = router.makeRoutingDecision('methodology', true, false)
        expect(result.provider).toBe('deepseek')
      })

      test('should route analysis tasks correctly', () => {
        const result = router.makeRoutingDecision('analysis', true, false)
        expect(result.provider).toBe('deepseek')
      })

      test('should route code tasks correctly', () => {
        const result = router.makeRoutingDecision('code', true, false)
        expect(result.provider).toBe('deepseek')
      })

      test('should route style tasks correctly', () => {
        const result1 = router.makeRoutingDecision('style', false, true)
        const result2 = router.makeRoutingDecision('style', true, true)
        
        expect(result1.provider).toBe('qwen')
        expect(result2.provider).toBe('qwen')
      })

      test('should route general tasks correctly', () => {
        const result = router.makeRoutingDecision('general', true, false)
        expect(result.provider).toBe('deepseek')
      })
    })

    describe('Unknown task type handling', () => {
      test('should use default routing for unknown task types', () => {
        const result = router.makeRoutingDecision('unknown', true, false)
        expect(result.provider).toBe('deepseek')
      })

      test('should fallback to glm-primary for unknown task when providers unavailable', () => {
        const result = router.makeRoutingDecision('unknown', false, false)
        expect(result.provider).toBe('glm-primary')
      })
    })

    describe('Edge cases', () => {
      test('should handle missing options parameter', () => {
        const result = router.makeRoutingDecision('hypothesis', true, true)
        expect(result.provider).toBe('deepseek')
      })

      test('should handle empty options object', () => {
        const result = router.makeRoutingDecision('style', true, true, {})
        expect(result.provider).toBe('qwen')
      })

      test('should handle invalid priority (defaults to balanced)', () => {
        const result = router.makeRoutingDecision('hypothesis', true, false, { priority: 'invalid' })
        expect(result.provider).toBe('deepseek')
      })

      test('should handle boolean priority (defaults to balanced)', () => {
        const result = router.makeRoutingDecision('structure', true, false, { priority: true })
        expect(result.provider).toBe('deepseek')
      })
    })

    describe('Routing consistency', () => {
      test('should return consistent results for same inputs', () => {
        const result1 = router.makeRoutingDecision('hypothesis', true, false, { priority: 'high' })
        const result2 = router.makeRoutingDecision('hypothesis', true, false, { priority: 'high' })
        
        expect(result1.provider).toBe(result2.provider)
      })

      test('should maintain priority order across task types', () => {
        const deepseekAvailable = true
        const qwenAvailable = true
        
        const hypothesisResult = router.makeRoutingDecision('hypothesis', deepseekAvailable, qwenAvailable)
        const styleResult = router.makeRoutingDecision('style', deepseekAvailable, qwenAvailable)
        
        expect(hypothesisResult.provider).toBe('deepseek')
        expect(styleResult.provider).toBe('qwen')
      })
    })
  })
})
