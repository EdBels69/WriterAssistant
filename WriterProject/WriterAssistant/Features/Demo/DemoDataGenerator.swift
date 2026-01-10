import Foundation
import CoreData

class DemoDataGenerator {
    static let shared = DemoDataGenerator()
    
    private init() {}
    
    func generateDemoLogs(context: NSManagedObjectContext) {
        let sampleLogs = [
            (level: "info", message: "Приложение WriterAssistant запущено", category: "system"),
            (level: "info", message: "Загружены пользовательские настройки", category: "settings"),
            (level: "debug", message: "Инициализация Core Data выполнена успешно", category: "database"),
            (level: "info", message: "Проверка обновлений завершена", category: "updates"),
            (level: "warning", message: "Лимит демо-режима скоро будет достигнут", category: "demo"),
            (level: "info", message: "Синхронизация данных выполнена", category: "sync"),
            (level: "debug", message: "Кэш очищен", category: "performance"),
            (level: "info", message: "Настройки темы применены", category: "ui"),
            (level: "error", message: "Не удалось подключиться к серверу", category: "network"),
            (level: "info", message: "Пользовательская сессия начата", category: "user"),
            (level: "debug", message: "Загружен профиль пользователя", category: "user"),
            (level: "info", message: "Создан новый проект", category: "project"),
            (level: "warning", message: "Автосохранение проекта выполнено", category: "project"),
            (level: "info", message: "Экспорт данных завершён", category: "export"),
            (level: "debug", message: "Оптимизация базы данных выполнена", category: "database")
        ]
        
        for (index, log) in sampleLogs.enumerated() {
            let logEntry = LogEntry(context: context)
            logEntry.id = UUID()
            logEntry.level = log.level
            logEntry.message = log.message
            logEntry.category = log.category
            logEntry.timestamp = Date().addingTimeInterval(-Double((15 - index) * 300))
        }
        
        do {
            try context.save()
            Logger.shared.log("Demo logs generated: \(sampleLogs.count)", level: .info)
        } catch {
            Logger.shared.log("Failed to generate demo logs: \(error)", level: .error)
        }
    }
    
    func generateDemoSettings(context: NSManagedObjectContext) {
        let request: NSFetchRequest<Settings> = Settings.fetchRequest()
        
        do {
            let existingSettings = try context.fetch(request)
            if !existingSettings.isEmpty {
                return
            }
        } catch {
            Logger.shared.log("Failed to fetch settings: \(error)", level: .error)
        }
        
        let settings = Settings(context: context)
        settings.id = UUID()
        settings.theme = "system"
        settings.fontSize = 17
        settings.autoSave = true
        settings.logLevel = "debug"
        settings.createdAt = Date()
        settings.updatedAt = Date()
        
        do {
            try context.save()
            Logger.shared.log("Demo settings generated", level: .info)
        } catch {
            Logger.shared.log("Failed to generate demo settings: \(error)", level: .error)
        }
    }
    
    func generateAllDemoData(context: NSManagedObjectContext) {
        generateDemoSettings(context: context)
        generateDemoLogs(context: context)
        Logger.shared.log("All demo data generated successfully", level: .info)
    }
    
    func clearDemoData(context: NSManagedObjectContext) {
        let logRequest: NSFetchRequest<NSFetchRequestResult> = LogEntry.fetchRequest()
        let settingsRequest: NSFetchRequest<NSFetchRequestResult> = Settings.fetchRequest()
        
        let deleteLogsRequest = NSBatchDeleteRequest(fetchRequest: logRequest)
        let deleteSettingsRequest = NSBatchDeleteRequest(fetchRequest: settingsRequest)
        
        do {
            try context.execute(deleteLogsRequest)
            try context.execute(deleteSettingsRequest)
            try context.save()
            Logger.shared.log("Demo data cleared", level: .info)
        } catch {
            Logger.shared.log("Failed to clear demo data: \(error)", level: .error)
        }
    }
    
    struct DemoProject {
        let id: UUID
        let name: String
        let description: String
        let createdAt: Date
        let modifiedAt: Date
        let wordCount: Int
        let status: String
    }
    
    func getDemoProjects() -> [DemoProject] {
        return [
            DemoProject(
                id: UUID(),
                name: "Техническая документация",
                description: "Полное руководство по использованию API с примерами кода и диаграммами",
                createdAt: Date().addingTimeInterval(-86400 * 5),
                modifiedAt: Date().addingTimeInterval(-3600),
                wordCount: 15420,
                status: "active"
            ),
            DemoProject(
                id: UUID(),
                name: "Блог о разработке",
                description: "Серия статей о лучших практиках в разработке программного обеспечения",
                createdAt: Date().addingTimeInterval(-86400 * 3),
                modifiedAt: Date().addingTimeInterval(-7200),
                wordCount: 8930,
                status: "active"
            ),
            DemoProject(
                id: UUID(),
                name: "Маркетинговая стратегия",
                description: "План маркетинга для запуска нового продукта на рынке",
                createdAt: Date().addingTimeInterval(-86400 * 7),
                modifiedAt: Date().addingTimeInterval(-86400),
                wordCount: 5600,
                status: "completed"
            ),
            DemoProject(
                id: UUID(),
                name: "Роман 'Цифровой горизонт'",
                description: "Художественное произведение в жанре научной фантастики",
                createdAt: Date().addingTimeInterval(-86400 * 14),
                modifiedAt: Date().addingTimeInterval(-1800),
                wordCount: 45230,
                status: "active"
            ),
            DemoProject(
                id: UUID(),
                name: "Учебник по Swift",
                description: "Комплексное руководство по программированию на языке Swift",
                createdAt: Date().addingTimeInterval(-86400 * 10),
                modifiedAt: Date().addingTimeInterval(-10800),
                wordCount: 28750,
                status: "active"
            )
        ]
    }
    
    struct DemoFeature {
        let name: String
        let description: String
        let icon: String
        let availableInDemo: Bool
        let usageCount: Int
    }
    
    func getDemoFeatures() -> [DemoFeature] {
        return [
            DemoFeature(
                name: "Редактор текста",
                description: "Мощный редактор с поддержкой Markdown и форматирования",
                icon: "doc.text",
                availableInDemo: true,
                usageCount: 5
            ),
            DemoFeature(
                name: "Управление проектами",
                description: "Организация и отслеживание всех ваших писательских проектов",
                icon: "folder",
                availableInDemo: true,
                usageCount: 3
            ),
            DemoFeature(
                name: "Статистика",
                description: "Детальная аналитика вашей продуктивности",
                icon: "chart.bar",
                availableInDemo: true,
                usageCount: 2
            ),
            DemoFeature(
                name: "Экспорт в PDF",
                description: "Экспорт документов в формате высокого качества",
                icon: "doc.richtext",
                availableInDemo: false,
                usageCount: 0
            ),
            DemoFeature(
                name: "Облачная синхронизация",
                description: "Автоматическое сохранение в облако",
                icon: "icloud",
                availableInDemo: false,
                usageCount: 0
            ),
            DemoFeature(
                name: "Пользовательские темы",
                description: "Создание собственных цветовых схем",
                icon: "paintpalette",
                availableInDemo: false,
                usageCount: 0
            )
        ]
    }
}