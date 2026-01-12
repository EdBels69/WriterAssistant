class OutputValidator {
  constructor() {
    this.validationRules = {
      creative: {
        generateIdeas: this.validateIdeas.bind(this),
        expandText: this.validateExpandText.bind(this),
        editStyle: this.validateEditStyle.bind(this),
        generateCharacter: this.validateCharacter.bind(this),
        generatePlotOutline: this.validatePlotOutline.bind(this),
        generateDialogue: this.validateDialogue.bind(this),
        improveWriting: this.validateImproveWriting.bind(this),
        generateDescription: this.validateDescription.bind(this)
      },
      research: {
        generateHypothesis: this.validateHypothesis.bind(this),
        structureIdeas: this.validateStructureIdeas.bind(this),
        structureMethodology: this.validateMethodology.bind(this),
        literatureReview: this.validateLiteratureReview.bind(this),
        statisticalAnalysis: this.validateStatisticalAnalysis.bind(this),
        generateResearchDesign: this.validateResearchDesign.bind(this),
        analyzeResults: this.validateAnalyzeResults.bind(this),
        generateDiscussion: this.validateDiscussion.bind(this),
        generateConclusion: this.validateConclusion.bind(this),
        narrativeReview: this.validateNarrativeReview.bind(this),
        systematicReview: this.validateSystematicReview.bind(this),
        metaAnalysis: this.validateMetaAnalysis.bind(this),
        improveAcademicStyle: this.validateImproveAcademicStyle.bind(this)
      },
      code: {
        generateCode: this.validateGenerateCode.bind(this),
        reviewCode: this.validateReviewCode.bind(this),
        debugCode: this.validateDebugCode.bind(this),
        optimizeCode: this.validateOptimizeCode.bind(this),
        explainCode: this.validateExplainCode.bind(this),
        refactorCode: this.validateRefactorCode.bind(this),
        generateTests: this.validateGenerateTests.bind(this),
        generateDocumentation: this.validateGenerateDocumentation.bind(this)
      },
      multiagent: {
        hypothesisGeneration: this.validateMultiAgentPipeline.bind(this),
        structureIdeas: this.validateMultiAgentPipeline.bind(this),
        literatureReview: this.validateMultiAgentPipeline.bind(this),
        metaAnalysis: this.validateMultiAgentPipeline.bind(this)
      }
    }
  }

  validate(output, category, instrument) {
    const validators = this.validationRules[category]
    if (!validators) {
      return { valid: true, score: 0.5, message: 'Unknown category' }
    }

    const validator = validators[instrument]
    if (!validator) {
      return { valid: true, score: 0.5, message: 'Unknown instrument' }
    }

    return validator(output)
  }

  validateIdeas(output) {
    const checks = {
      hasMultipleIdeas: output.split(/\n\n+/).length >= 2,
      hasCreativity: /интересн|уникальн|новый|инновацион|creative|unique|innovative/i.test(output),
      hasCoherence: /\n/.test(output) && output.length > 100,
      hasRelevance: /иде[яй]|idea|concept|концепци/i.test(output),
      minLength: output.length > 200
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Ideas output needs more creativity and coherence' : 'Valid ideas output'
    }
  }

  validateExpandText(output, inputText = '') {
    const checks = {
      isExpanded: output.length > (inputText?.length || 100) * 1.5,
      hasFlow: /таким образом|следовательно|кроме того|moreover|therefore|furthermore/i.test(output),
      hasDetail: /например|так как|также|for example|also|because/i.test(output),
      isCoherent: output.split('.').filter(s => s.trim().length > 10).length >= 3
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Expanded text needs more detail and flow' : 'Valid expanded text'
    }
  }

  validateEditStyle(output) {
    const checks = {
      hasStylisticChange: /[А-Я][а-яё]+/i.test(output),
      isComplete: output.split('.').length >= 3,
      isReadable: output.length > 50 && output.length < 5000,
      hasPunctuation: /[.!?]/.test(output)
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Style edit needs improvement' : 'Valid style edit'
    }
  }

  validateCharacter(output) {
    const checks = {
      hasName: /имя|name|персонаж|character/i.test(output),
      hasDescription: /описани|описан|description|characteristic/i.test(output),
      hasBackground: /предыстори|background|history|past/i.test(output),
      hasTraits: /особенност|характерист|trait|feature/i.test(output),
      minLength: output.length > 150
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Character description needs more detail' : 'Valid character description'
    }
  }

  validatePlotOutline(output) {
    const checks = {
      hasStructure: /начало|середин|конец|завязк|кульминац|развязк|beginning|middle|end|climax/i.test(output),
      hasMultipleScenes: output.split(/\n\n+/).length >= 3,
      hasProgression: /затем|потом|далее|после этого|then|after|next/i.test(output),
      hasConflict: /конфликт|проблем|препятстви|conflict|obstacle|challenge/i.test(output),
      minLength: output.length > 200
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Plot outline needs better structure' : 'Valid plot outline'
    }
  }

  validateDialogue(output) {
    const checks = {
      hasQuotes: /["«»„"]/.test(output),
      hasSpeakers: output.split('\n').filter(line => /^[-—]\s*\w+/.test(line)).length >= 2,
      hasEmotion: /[!?]+/.test(output),
      isNatural: output.includes('...') || output.includes('—')
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Dialogue needs more natural flow' : 'Valid dialogue'
    }
  }

  validateImproveWriting(output) {
    const checks = {
      isBetterThanInput: output.length > 50,
      hasVariety: output.split(' ').length / new Set(output.split(' ')).size > 1.2,
      isGrammatical: /[.!?]\s+[А-ЯA-Z]/.test(output),
      hasFlow: /однако|кроме того|таким образом|however|furthermore|therefore/i.test(output)
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Writing improvement needs more work' : 'Valid writing improvement'
    }
  }

  validateDescription(output) {
    const checks = {
      hasSensoryDetails: /цвет|запах|звук|ощущени|вид|color|smell|sound|feeling|sight/i.test(output),
      hasImagery: /как|будто|словно|like|as if|as though/i.test(output),
      isDetailed: output.length > 100,
      isVivid: /яркий|интенсивн|ярко|vivid|intense|bright/i.test(output)
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Description needs more sensory details' : 'Valid description'
    }
  }

  validateHypothesis(output) {
    const checks = {
      hasHypothesisStatement: /гипотез[аы]|hypothesis/i.test(output),
      hasVariables: /переменн|variable|factor|фактор/i.test(output),
      hasTestability: /проверяем|измерим|testable|measurable|can be tested/i.test(output),
      hasRationale: /потому что|обоснован|поскольку|because|since|rationale/i.test(output),
      hasDirection: /более|менее|повысит|снизит|increase|decrease|affect|impact/i.test(output),
      minLength: output.length > 200
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Hypothesis needs clearer structure and testability' : 'Valid hypothesis'
    }
  }

  validateStructureIdeas(output) {
    const checks = {
      hasCategories: output.split(/\n\n+/).length >= 2,
      hasOrganization: /категори|групп|классификаци|category|group|classification/i.test(output),
      hasLogic: /логическ|последовательн|logical|sequential/i.test(output),
      hasClarity: output.split('.').filter(s => s.trim().length > 10).length >= 5,
      minLength: output.length > 150
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Structured ideas need better organization' : 'Valid structured ideas'
    }
  }

  validateMethodology(output) {
    const requiredSections = [
      /дизайн|design|тип исследовани/i,
      /участник|выборк|sample|participant|subject/i,
      /процедур|procedure|метод сбора/i,
      /инструмент|measure|instrument|шкал/i
    ]

    const foundSections = requiredSections.filter(regex => regex.test(output))
    const score = foundSections.length / requiredSections.length

    return {
      valid: score >= 0.5,
      score,
      checks: {
        hasDesign: requiredSections[0].test(output),
        hasParticipants: requiredSections[1].test(output),
        hasProcedures: requiredSections[2].test(output),
        hasInstruments: requiredSections[3].test(output)
      },
      missingSections: requiredSections.length - foundSections.length,
      message: score < 0.5 ? 'Methodology missing required sections' : 'Valid methodology'
    }
  }

  validateLiteratureReview(output) {
    const checks = {
      hasCitations: /\([^)]+,\s*\d{4}\)|\d{4}\)|\[.*?\d{4}.*?\]/.test(output),
      hasStructure: /введени|обзор|вывод|introduction|review|conclusion/i.test(output),
      hasSynthesis: /объедин|синтез|combine|synthesis|integrate/i.test(output),
      hasCriticalAnalysis: /критическ|критик|critical|critique/i.test(output),
      hasThemes: output.split(/\n\n+/).length >= 3,
      minLength: output.length > 300
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Literature review needs citations and structure' : 'Valid literature review'
    }
  }

  validateStatisticalAnalysis(output) {
    const checks = {
      hasStatisticalTerms: /статистическ|анализ|тест|значим|p\s*value|t-test|anova|regression|correlation/i.test(output),
      hasResults: /результат|result|finding|обнаруж/i.test(output),
      hasInterpretation: /интерпретаци|объясн|interpret|explain/i.test(output),
      hasMethod: /метод|method|подход|approach/i.test(output),
      minLength: output.length > 200
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Statistical analysis needs more technical detail' : 'Valid statistical analysis'
    }
  }

  validateResearchDesign(output) {
    const checks = {
      hasType: /эксперимент|корреляцион|кейс|эксплоратор|experimental|correlational|case|exploratory/i.test(output),
      hasVariables: /независим|зависим|independent|dependent|variable/i.test(output),
      hasProcedure: /процедур|процесс|procedure|process/i.test(output),
      hasControls: /контрол|control|random/i.test(output),
      minLength: output.length > 200
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Research design needs more detail on variables and procedure' : 'Valid research design'
    }
  }

  validateAnalyzeResults(output) {
    const checks = {
      hasFindings: /результат|finding|обнаруж/i.test(output),
      hasInterpretation: /интерпретаци|объясн|interpret|explain/i.test(output),
      hasComparison: /сравн|различи|difference|compare/i.test(output),
      hasImplications: /влияни|последств|implication|consequence/i.test(output),
      minLength: output.length > 200
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Results analysis needs more interpretation' : 'Valid results analysis'
    }
  }

  validateDiscussion(output) {
    const checks = {
      hasInterpretation: /интерпретаци|объясн|interpret|explain/i.test(output),
      hasContext: /контекст|context|предыдущ|previous/i.test(output),
      hasLimitations: /ограничен|limitation/i.test(output),
      hasImplications: /влияни|последств|implication/i.test(output),
      hasSuggestions: /рекомендац|предложени|recommendation|suggestion/i.test(output),
      minLength: output.length > 250
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Discussion needs more interpretation and context' : 'Valid discussion'
    }
  }

  validateConclusion(output) {
    const checks = {
      hasSummary: /заключен|вывод|итог|summary|conclusion/i.test(output),
      hasKeyFindings: /ключев|основн|main|key|finding/i.test(output),
      hasImplications: /влияни|последств|implication/i.test(output),
      hasFutureWork: /будущ|дальнейш|future|further/i.test(output),
      isConcise: output.length > 100 && output.length < 800
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Conclusion needs more structure and key findings' : 'Valid conclusion'
    }
  }

  validateNarrativeReview(output) {
    const checks = {
      hasNarrativeFlow: /рассказ|истори|narrative|story/i.test(output),
      hasCitations: /\([^)]+,\s*\d{4}\)|\d{4}\)/.test(output),
      hasThemes: output.split(/\n\n+/).length >= 3,
      hasCriticalAnalysis: /критическ|критик|critical/i.test(output),
      minLength: output.length > 300
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Narrative review needs more structure' : 'Valid narrative review'
    }
  }

  validateSystematicReview(output) {
    const checks = {
      hasPRISMAElements: /поиск|выбор|включен|исключен|search|selection|inclusion|exclusion/i.test(output),
      hasCriteria: /критери|criteria|standard/i.test(output),
      hasSynthesis: /синтез|объедин|synthesis|combine/i.test(output),
      hasQualityAssessment: /качеств|quality|risk|bias/i.test(output),
      minLength: output.length > 300
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Systematic review needs more PRISMA elements' : 'Valid systematic review'
    }
  }

  validateMetaAnalysis(output) {
    const checks = {
      hasStatisticalMethods: /мета-анализ|эффект|forest|pooled|meta-analysis|effect size|forest plot/i.test(output),
      hasHeterogeneity: /гетероген|heterogeneity|variability/i.test(output),
      hasResults: /результат|result|finding/i.test(output),
      hasInterpretation: /интерпретаци|interpret|explain/i.test(output),
      minLength: output.length > 250
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Meta-analysis needs more statistical detail' : 'Valid meta-analysis'
    }
  }

  validateImproveAcademicStyle(output) {
    const checks = {
      isFormal: !/(?:lol|omg|wow|awesome|cool)/i.test(output),
      hasAcademicTone: /[А-ЯA-Z][а-яa-z]+(?:\s+[А-ЯA-Z][а-яa-z]+)+\s+(?:был|явля|была|явл|was|were|is|are)/.test(output),
      hasStructure: output.split('.').filter(s => s.trim().length > 10).length >= 3,
      isGrammatical: /[.!?]\s+[А-ЯA-Z]/.test(output)
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Academic style needs more formality' : 'Valid academic style'
    }
  }

  validateGenerateCode(output) {
    const checks = {
      hasCodeBlock: /```|function|const|let|var|class|import|export/.test(output),
      isSyntacticallyValid: !/(?:for\s*\([^)]*\)\s*\{)|(?:while\s*\([^)]*\)\s*\{)/.test(output) || output.includes('{'),
      hasComments: /\/\/|\/\*|#/.test(output),
      isComplete: output.length > 50 && output.includes('\n')
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Code generation needs more structure' : 'Valid code generation'
    }
  }

  validateReviewCode(output) {
    const checks = {
      hasSuggestions: /рекомендац|предложени|улучшен|suggestion|improve|recommend/i.test(output),
      hasCritique: /проблем|ошибк|issue|problem|error/i.test(output),
      isConstructive: output.length > 100,
      hasSpecificFeedback: /строк|line|функци|function/i.test(output)
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Code review needs more specific feedback' : 'Valid code review'
    }
  }

  validateDebugCode(output) {
    const checks = {
      hasDiagnosis: /проблем|ошибк|diagnos|issue|error/i.test(output),
      hasSolution: /решени|фикс|solution|fix/i.test(output),
      hasExplanation: /объясн|почему|explain|why|because/i.test(output),
      isActionable: output.length > 100
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Debug code needs more actionable solutions' : 'Valid debug code'
    }
  }

  validateOptimizeCode(output) {
    const checks = {
      hasOptimizations: /оптимизаци|улучшен|optimization|improve|optimize/i.test(output),
      hasPerformance: /производител|performanc|speed|fast|slow/i.test(output),
      hasExplanation: /объясн|почему|explain|why/i.test(output),
      isSpecific: /вместо|заменить|replace|instead/i.test(output)
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Code optimization needs more specific suggestions' : 'Valid code optimization'
    }
  }

  validateExplainCode(output) {
    const checks = {
      hasExplanation: /объясн|поясн|explain|clarif/i.test(output),
      hasBreakdown: output.split('\n').length >= 3,
      hasPurpose: /цель|назначени|purpose|function/i.test(output),
      isUnderstandable: output.length > 100
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Code explanation needs more detail' : 'Valid code explanation'
    }
  }

  validateRefactorCode(output) {
    const checks = {
      hasRefactoring: /рефакторинг|refactor|restructure|reorganiz/i.test(output),
      hasImprovement: /улучшен|better|improve/i.test(output),
      hasCodeBlock: /```|function|const|let|var|class/.test(output),
      isActionable: output.length > 100
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Code refactoring needs more actionable suggestions' : 'Valid code refactoring'
    }
  }

  validateGenerateTests(output) {
    const checks = {
      hasTestCases: /test|case|тест/i.test(output),
      hasAssertions: /assert|expect|should/i.test(output),
      hasCoverage: output.split('\n').filter(line => /test|describe|it\(/.test(line)).length >= 2,
      isComprehensive: output.length > 150
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Test generation needs more test cases' : 'Valid test generation'
    }
  }

  validateGenerateDocumentation(output) {
    const checks = {
      hasDescription: /описани|description/i.test(output),
      hasParameters: /параметр|parameter|arg/i.test(output),
      hasReturnValue: /возвраща|return|вывод|output/i.test(output),
      hasExamples: /пример|example/i.test(output),
      isStructured: output.split('\n').length >= 3
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.5,
      score,
      checks,
      message: score < 0.5 ? 'Documentation needs more structure' : 'Valid documentation'
    }
  }

  validateMultiAgentPipeline(output) {
    const checks = {
      hasAgentContributions: /агент|agent|исследователь|critic|synthesizer/i.test(output),
      hasSynthesis: /синтез|объединен|synthesis|combine|integrate/i.test(output),
      hasProgression: output.split(/\n\n+/).length >= 2,
      hasFinalOutput: output.length > 200,
      isComplete: /итог|результат|final|result|conclusion/i.test(output)
    }

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length

    return {
      valid: score >= 0.6,
      score,
      checks,
      message: score < 0.6 ? 'Multi-agent pipeline needs more synthesis' : 'Valid multi-agent pipeline'
    }
  }

  getValidationReport(category, instrument, output) {
    const validation = this.validate(output, category, instrument)
    
    return {
      category,
      instrument,
      valid: validation.valid,
      score: validation.score,
      message: validation.message,
      checks: validation.checks,
      timestamp: new Date().toISOString()
    }
  }

  validateBatch(outputs) {
    return outputs.map(({ output, category, instrument }) => 
      this.getValidationReport(category, instrument, output)
    )
  }
}

export default OutputValidator
