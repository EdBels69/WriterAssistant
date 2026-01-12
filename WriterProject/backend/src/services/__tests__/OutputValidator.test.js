import OutputValidator from '../OutputValidator.js'

describe('OutputValidator', () => {
  let validator

  beforeEach(() => {
    validator = new OutputValidator()
  })

  describe('validateHypothesis', () => {
    it('should pass valid hypothesis with all required sections', () => {
      const output = `
        ## Гипотеза
        Увеличение времени сна улучшит когнитивные функции.
        
        ## Переменные
        - Независимая: время сна
        - Зависимая: когнитивные функции
        
        ## Обоснование
        Потому что сон восстанавливает нейронные связи.
        
        ## Тестируемость
        Можно измерить через стандартизированные тесты.
      `
      const result = validator.validateHypothesis(output)
      expect(result.valid).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0.8)
      expect(result.checks.hypothesis_section).toBe(true)
      expect(result.checks.variables_present).toBe(true)
    })

    it('should fail hypothesis without required sections', () => {
      const output = 'Просто текст без структуры'
      const result = validator.validateHypothesis(output)
      expect(result.valid).toBe(false)
      expect(result.score).toBeLessThan(0.6)
    })

    it('should detect independent and dependent variables', () => {
      const output = `
        ## Гипотеза
        Test hypothesis.
        
        ## Переменные
        Independent variable: temperature
        Dependent variable: reaction time
        
        ## Обоснование
        Based on previous studies.
        
        ## Тестируемость
        Measurable through experiments.
      `
      const result = validator.validateHypothesis(output)
      expect(result.checks.independent_variable).toBe(true)
      expect(result.checks.dependent_variable).toBe(true)
    })
  })

  describe('validateLiteratureReview', () => {
    it('should pass valid literature review with proper structure', () => {
      const output = `
        # Systematic Review of Sleep and Memory
        
        ## Introduction
        This review examines the relationship between sleep and memory consolidation.
        
        ## Methodology
        We searched PubMed, Scopus, and Web of Science for relevant studies.
        
        ## Results
        25 studies were included in the final analysis.
        
        ## Discussion
        Sleep quality correlates positively with memory performance.
        
        ## Conclusion
        Adequate sleep is essential for optimal cognitive function.
      `
      const result = validator.validateLiteratureReview(output)
      expect(result.valid).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0.7)
    })

    it('should fail literature review without required sections', () => {
      const output = 'Some text about literature'
      const result = validator.validateLiteratureReview(output)
      expect(result.valid).toBe(false)
    })

    it('should detect methodology section', () => {
      const output = `
        # Review
        
        ## Methodology
        We used systematic approach with predefined criteria.
        
        ## Results
        Results section.
      `
      const result = validator.validateLiteratureReview(output)
      expect(result.checks.methodology_section).toBe(true)
    })
  })

  describe('validateCode', () => {
    it('should pass valid code with proper documentation', () => {
      const output = `
        \`\`\`python
        def calculate_average(numbers):
            """
            Calculate the average of a list of numbers.
            
            Args:
                numbers: List of numeric values
                
            Returns:
                float: The average value
            """
            if not numbers:
                return 0
            return sum(numbers) / len(numbers)
        \`\`\`
      `
      const result = validator.validateCode(output)
      expect(result.valid).toBe(true)
      expect(result.checks.code_present).toBe(true)
    })

    it('should detect docstring in code', () => {
      const output = `
        \`\`\`python
        def process_data(data):
            """Process input data and return results."""
            return data.upper()
        \`\`\`
      `
      const result = validator.validateCode(output)
      expect(result.checks.documentation_present).toBe(true)
    })

    it('should fail code without proper structure', () => {
      const output = 'Just some text about code'
      const result = validator.validateCode(output)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateMethodology', () => {
    it('should pass valid methodology description', () => {
      const output = `
        # Research Methodology
        
        ## Study Design
        Randomized controlled trial with parallel groups.
        
        ## Participants
        100 participants aged 18-65.
        
        ## Data Collection
        Surveys administered at baseline and follow-up.
        
        ## Analysis
        Statistical analysis using ANOVA.
      `
      const result = validator.validateMethodology(output)
      expect(result.valid).toBe(true)
    })

    it('should detect study design section', () => {
      const output = `
        # Methodology
        
        ## Study Design
        Experimental design with control group.
      `
      const result = validator.validateMethodology(output)
      expect(result.checks.study_design_present).toBe(true)
    })

    it('should fail methodology without structure', () => {
      const output = 'We will do some research'
      const result = validator.validateMethodology(output)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateStructureIdeas', () => {
    it('should pass valid structure ideas output', () => {
      const output = `
        # Structured Ideas
        
        ## Core Concepts
        - Main idea 1
        - Main idea 2
        
        ## Supporting Arguments
        1. Argument for idea 1
        2. Argument for idea 2
        
        ## Logical Flow
        The ideas progress from introduction to conclusion.
      `
      const result = validator.validateStructureIdeas(output)
      expect(result.valid).toBe(true)
    })

    it('should detect core concepts section', () => {
      const output = `
        # Ideas
        
        ## Core Concepts
        - Concept A
        - Concept B
      `
      const result = validator.validateStructureIdeas(output)
      expect(result.checks.core_concepts_present).toBe(true)
    })

    it('should fail structure ideas without organization', () => {
      const output = 'Random ideas here and there'
      const result = validator.validateStructureIdeas(output)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateBatch', () => {
    it('should validate multiple outputs', () => {
      const outputs = [
        { output: '## Гипотеза\nTest hypothesis.\n## Переменные\nInd: X\nDep: Y\n## Обоснование\nBased on theory.\n## Тестируемость\nMeasurable.', category: 'hypothesis', instrument: 'default' },
        { output: 'Just text', category: 'hypothesis', instrument: 'default' }
      ]
      const results = validator.validateBatch(outputs)
      expect(results).toHaveLength(2)
      expect(results[0].valid).toBe(true)
      expect(results[1].valid).toBe(false)
    })

    it('should handle empty batch', () => {
      const results = validator.validateBatch([])
      expect(results).toEqual([])
    })

    it('should return proper validation reports', () => {
      const outputs = [
        { output: '## Гипотеза\nTest.\n## Переменные\nX, Y\n## Обоснование\nReason.\n## Тестируемость\nYes.', category: 'hypothesis', instrument: 'default' }
      ]
      const results = validator.validateBatch(outputs)
      expect(results[0]).toHaveProperty('valid')
      expect(results[0]).toHaveProperty('score')
      expect(results[0]).toHaveProperty('checks')
    })
  })

  describe('getValidationReport', () => {
    it('should return validation report for valid hypothesis', () => {
      const output = `
        ## Гипотеза
        Test hypothesis.
        
        ## Переменные
        - Independent: X
        - Dependent: Y
        
        ## Обоснование
        Based on theory.
        
        ## Тестируемость
        Measurable through tests.
      `
      const report = validator.getValidationReport('hypothesis', 'default', output)
      expect(report).toHaveProperty('valid')
      expect(report).toHaveProperty('score')
      expect(report).toHaveProperty('checks')
      expect(report).toHaveProperty('category')
      expect(report.category).toBe('hypothesis')
    })

    it('should return validation report for invalid output', () => {
      const output = 'Invalid output without structure'
      const report = validator.getValidationReport('hypothesis', 'default', output)
      expect(report.valid).toBe(false)
      expect(report.score).toBeLessThan(0.5)
    })

    it('should handle unknown category gracefully', () => {
      const output = 'Some output'
      const report = validator.getValidationReport('unknown', 'default', output)
      expect(report).toHaveProperty('valid')
      expect(report).toHaveProperty('score')
    })
  })
})
