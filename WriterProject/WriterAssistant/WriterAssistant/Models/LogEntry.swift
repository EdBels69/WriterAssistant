import Foundation
import CoreData

@objc(LogEntry)
public class LogEntry: NSManagedObject, Identifiable {
    @NSManaged public var id: UUID
    @NSManaged public var timestamp: Date
    @NSManaged public var level: String
    @NSManaged public var message: String
    @NSManaged public var category: String?
}

extension LogEntry {
    enum Level: String, CaseIterable {
        case debug = "debug"
        case info = "info"
        case warning = "warning"
        case error = "error"
        
        var displayName: String {
            switch self {
            case .debug: return "DEBUG"
            case .info: return "INFO"
            case .warning: return "WARNING"
            case .error: return "ERROR"
            }
        }
        
        var color: String {
            switch self {
            case .debug: return "#6B7280"
            case .info: return "#2563EB"
            case .warning: return "#F59E0B"
            case .error: return "#EF4444"
            }
        }
    }
    
    static let maxLogs = 10000
    static let cleanupThreshold = 8000
}

extension LogEntry {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<LogEntry> {
        return NSFetchRequest<LogEntry>(entityName: "LogEntry")
    }
    
    static func create(in context: NSManagedObjectContext, message: String, level: Level, category: String? = nil) -> LogEntry {
        let log = LogEntry(context: context)
        log.id = UUID()
        log.timestamp = Date()
        log.level = level.rawValue
        log.message = message
        log.category = category
        return log
    }
}

class Logger: ObservableObject {
    static let shared = Logger()
    
    @Published var logs: [LogEntry] = []
    
    private let context: NSManagedObjectContext
    private let maxLogs = LogEntry.maxLogs
    
    private init(context: NSManagedObjectContext = PersistenceController.shared.container.viewContext) {
        self.context = context
        loadRecentLogs()
    }
    
    func log(_ message: String, level: LogEntry.Level = .info, category: String? = nil) {
        let logEntry = LogEntry.create(in: context, message: message, level: level, category: category)
        
        DispatchQueue.main.async {
            self.logs.insert(logEntry, at: 0)
            if self.logs.count > 100 {
                self.logs = Array(self.logs.prefix(100))
            }
        }
        
        try? context.save()
        
        print("[\(level.displayName)] \(message)")
        
        cleanupOldLogs()
    }
    
    private func loadRecentLogs() {
        let request: NSFetchRequest<LogEntry> = LogEntry.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \LogEntry.timestamp, ascending: false)]
        request.fetchLimit = 100
        
        do {
            logs = try context.fetch(request)
        } catch {
            log("Failed to load logs: \(error)", level: .error)
        }
    }
    
    private func cleanupOldLogs() {
        let request: NSFetchRequest<LogEntry> = LogEntry.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \LogEntry.timestamp, ascending: true)]
        
        do {
            let allLogs = try context.fetch(request)
            if allLogs.count > maxLogs {
                let logsToDelete = Array(allLogs.prefix(allLogs.count - maxLogs))
                for log in logsToDelete {
                    context.delete(log)
                }
                try context.save()
            }
        } catch {
            print("Failed to cleanup logs: \(error)")
        }
    }
    
    func clearLogs() {
        let request: NSFetchRequest<NSFetchRequestResult> = LogEntry.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)
        
        do {
            try context.execute(deleteRequest)
            logs.removeAll()
            log("Logs cleared", level: .info)
        } catch {
            log("Failed to clear logs: \(error)", level: .error)
        }
    }
    
    func exportLogs() -> String {
        logs.sorted { $0.timestamp > $1.timestamp }
            .map { "[\($0.timestamp)] [\($0.level.uppercased())] \($0.message)" }
            .joined(separator: "\n")
    }
}

class LogManager: ObservableObject {
    static let shared = LogManager()
    
    @Published var isEnabled = true
    @Published var logDirectory: URL
    
    private init() {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        self.logDirectory = paths[0].appendingPathComponent("Ultrahink/Logs")
        
        createLogDirectoryIfNeeded()
    }
    
    private func createLogDirectoryIfNeeded() {
        try? FileManager.default.createDirectory(at: logDirectory, withIntermediateDirectories: true)
    }
    
    func saveLogs() {
        guard isEnabled else { return }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let filename = "ultrahink_\(dateFormatter.string(from: Date())).log"
        let fileURL = logDirectory.appendingPathComponent(filename)
        
        do {
            try Logger.shared.exportLogs().write(to: fileURL, atomically: true, encoding: .utf8)
            Logger.shared.log("Logs saved to \(fileURL.path)", level: .info)
        } catch {
            Logger.shared.log("Failed to save logs: \(error)", level: .error)
        }
    }
    
    func loadLogs(from url: URL) -> String? {
        do {
            return try String(contentsOf: url, encoding: .utf8)
        } catch {
            Logger.shared.log("Failed to load logs from \(url.path): \(error)", level: .error)
            return nil
        }
    }
    
    func listLogFiles() -> [URL] {
        guard let files = try? FileManager.default.contentsOfDirectory(at: logDirectory, includingPropertiesForKeys: nil) else {
            return []
        }
        return files.filter { $0.pathExtension == "log" }.sorted { $0.lastPathComponent > $1.lastPathComponent }
    }
    
    func deleteOldLogs(days: Int = 30) {
        let cutoffDate = Calendar.current.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        
        let files = listLogFiles()
        for file in files {
            if let attributes = try? FileManager.default.attributesOfItem(atPath: file.path),
               let modificationDate = attributes[.modificationDate] as? Date,
               modificationDate < cutoffDate {
                try? FileManager.default.removeItem(at: file)
                Logger.shared.log("Deleted old log file: \(file.lastPathComponent)", level: .info)
            }
        }
    }
}