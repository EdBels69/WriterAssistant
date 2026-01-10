import SwiftUI
import CoreData

@main
struct WriterAssistantApp: App {
    let persistenceController = PersistenceController.shared
    
    @StateObject private var settingsManager = SettingsManager()
    @StateObject private var logManager = LogManager.shared
    
    var body: some Scene {
        WindowGroup {
            MainView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(settingsManager)
                .environmentObject(logManager)
                .onAppear {
                    setupApp()
                }
        }
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 1200, height: 800)
    }
    
    private func setupApp() {
        Logger.shared.log("WriterAssistant started", level: .info)
        ResourceManager.validateLocalResources()
    }
}

class PersistenceController {
    static let shared = PersistenceController()
    
    let container: NSPersistentContainer
    
    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "WriterAssistant")
        
        if inMemory {
            container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
        }
        
        container.loadPersistentStores { (storeDescription, error) in
            if let error = error as NSError? {
                Logger.shared.log("Core Data error: \(error)", level: .error)
                fatalError("Unresolved Core Data error \(error), \(error.userInfo)")
            }
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
}