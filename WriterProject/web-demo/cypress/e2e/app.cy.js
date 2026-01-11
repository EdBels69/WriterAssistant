describe('WriterAssistant E2E Tests', () => {
  const baseUrl = 'http://localhost:3002'

  beforeEach(() => {
    cy.visit(baseUrl)
    cy.wait(3000)
  })

  it('загружает главную страницу с основным интерфейсом', () => {
    cy.contains('WriterAssistant').should('exist')
    cy.contains('Обзор').should('exist')
    cy.contains('Проекты').should('exist')
    cy.contains('Инструменты анализа').should('exist')
  })

  it('проверяет видимые фокус-индикаторы при клавиатурной навигации', () => {
    cy.contains('Обзор').focus()
    cy.focused().should('have.css', 'outline-color').and('not.equal', 'rgba(0, 0, 0, 0)')
  })

  it('открывает чат через кнопку ИИ-помощник', () => {
    cy.contains('ИИ-помощник').click()
    cy.get('input[placeholder="Напишите сообщение..."]').should('exist')
  })

  it('отправляет сообщение в чат и получает ответ', () => {
    cy.contains('ИИ-помощник').click()
    cy.wait(1000)

    cy.get('input[placeholder="Напишите сообщение..."]').type('Привет, как дела?')
    cy.get('input[placeholder="Напишите сообщение..."]').parent().find('button').click()

    cy.wait(3000)

    cy.get('.bg-primary-600').should('contain', 'Привет, как дела?')

    cy.wait(8000)

    cy.get('.bg-gray-100').should('exist')
  })

  it('проверяет навигацию между вкладками', () => {
    cy.contains('Проекты').click()
    cy.wait(1000)
    cy.contains('Проекты').should('exist')

    cy.contains('Обзор').click()
    cy.wait(1000)
    cy.contains('Обзор').should('exist')
  })

  it('проверяет открытие меню инструментов анализа', () => {
    cy.contains('Инструменты анализа').click()
    cy.wait(500)
    cy.contains('Анализ данных').should('exist')
  })
})
