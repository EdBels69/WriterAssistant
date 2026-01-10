import Foundation
import CoreData
import SwiftUI

@objc(Settings)
public class Settings: NSManagedObject, Identifiable {
    @NSManaged public var id: UUID
    @NSManaged public var theme: String
    @NSManaged public var fontSize: Int16
    @NSManaged public var autoSave: Bool
    @NSManaged public var logLevel: String
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
}

extension Settings {
    enum Theme: String, CaseIterable {
        case light = "light"
        case dark = "dark"
        case system = "system"
        
        var displayName: String {
            switch self {
            case .light: return "Светлая"
            case .dark: return "Тёмная"
            case .system: return "Системная"
            }
        }
    }
    
    enum LogLevel: String, CaseIterable {
        case debug = "debug"
        case info = "info"
        case warning = "warning"
        case error = "error"
        
        var displayName: String {
            switch self {
            case .debug: return "Debug"
            case .info: return "Info"
            case .warning: return "Warning"
            case .error: return "Error"
            }
        }
    }
    
    static let defaultSettings: [String: Any] = [
        "theme": Theme.system.rawValue,
        "fontSize": 17,
        "autoSave": true,
        "logLevel": LogLevel.info.rawValue
    ]
}

extension Settings {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Settings> {
        return NSFetchRequest<Settings>(entityName: "Settings")
    }
    
    static func create(in context: NSManagedObjectContext) -> Settings {
        let settings = Settings(context: context)
        settings.id = UUID()
        settings.theme = Settings.defaultSettings["theme"] as! String
        settings.fontSize = Settings.defaultSettings["fontSize"] as! Int16
        settings.autoSave = Settings.defaultSettings["autoSave"] as! Bool
        settings.logLevel = Settings.defaultSettings["logLevel"] as! String
        settings.createdAt = Date()
        settings.updatedAt = Date()
        return settings
    }
}

class SettingsManager: ObservableObject {
    @Published var theme: Settings.Theme = .system
    @Published var fontSize: Int = 17
    @Published var autoSave: Bool = true
    @Published var logLevel: Settings.LogLevel = .info
    
    private let context: NSManagedObjectContext
    
    init(context: NSManagedObjectContext = PersistenceController.shared.container.viewContext) {
        self.context = context
        loadSettings()
    }
    
    func loadSettings() {
        let request: NSFetchRequest<Settings> = Settings.fetchRequest()
        request.fetchLimit = 1
        
        do {
            let settings = try context.fetch(request).first
            if let settings = settings {
                self.theme = Settings.Theme(rawValue: settings.theme) ?? .system
                self.fontSize = Int(settings.fontSize)
                self.autoSave = settings.autoSave
                self.logLevel = Settings.LogLevel(rawValue: settings.logLevel) ?? .info
            } else {
                createDefaultSettings()
            }
        } catch {
            Logger.shared.log("Failed to load settings: \(error)", level: .error)
            createDefaultSettings()
        }
    }
    
    private func createDefaultSettings() {
        let settings = Settings.create(in: context)
        theme = Settings.Theme(rawValue: settings.theme) ?? .system
        fontSize = Int(settings.fontSize)
        autoSave = settings.autoSave
        logLevel = Settings.LogLevel(rawValue: settings.logLevel) ?? .info
        
        try? context.save()
    }
    
    func save() {
        let request: NSFetchRequest<Settings> = Settings.fetchRequest()
        request.fetchLimit = 1
        
        do {
            let settings = try context.fetch(request).first ?? Settings.create(in: context)
            settings.theme = theme.rawValue
            settings.fontSize = Int16(fontSize)
            settings.autoSave = autoSave
            settings.logLevel = logLevel.rawValue
            settings.updatedAt = Date()
            
            try context.save()
            Logger.shared.log("Settings saved", level: .info)
        } catch {
            Logger.shared.log("Failed to save settings: \(error)", level: .error)
        }
    }
    
    func resetToDefaults() {
        theme = .system
        fontSize = 17
        autoSave = true
        logLevel = .info
        save()
    }
}