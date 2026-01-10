import Cocoa
import SwiftUI

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        Logger.shared.log("Application launched", level: .info)
        
        EnergyManager.optimizeForM1()
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        Logger.shared.log("Application terminating", level: .info)
        LogManager.shared.saveLogs()
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }
    
    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        true
    }
}

class EnergyManager {
    static func optimizeForM1() {
        ProcessInfo.processInfo.performExpiringActivity(withReason: "Optimize for M1") { expired in
            if !expired {
                DispatchQueue.global(qos: .utility).async {
                    let app = NSApp
                    app.applicationPolicy = .regular
                }
            }
        }
    }
    
    static func reduceEnergyImpact() {
        ProcessInfo.processInfo.performExpiringActivity(withReason: "Reduce energy") { expired in
            if !expired {
                NSActivityOptions(rawValue: 0)
            }
        }
    }
}