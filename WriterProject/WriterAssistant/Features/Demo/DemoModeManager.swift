import Foundation
import Combine

class DemoModeManager: ObservableObject {
    static let shared = DemoModeManager()
    
    @Published var isDemoMode: Bool = true
    @Published var demoSessionDuration: TimeInterval = 0
    @Published var featureUsageCount: [String: Int] = [:]
    @Published var hasSeenOnboarding: Bool = false
    
    private let maxDemoFeatures: Int = 10
    private let maxDemoDuration: TimeInterval = 1800
    private let userDefaultsKey = "writerAssistant.demoData"
    
    private var sessionStartTime: Date?
    private var timer: Timer?
    
    private init() {
        loadDemoData()
        startSession()
    }
    
    func startSession() {
        sessionStartTime = Date()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.updateSessionDuration()
        }
    }
    
    private func updateSessionDuration() {
        guard let startTime = sessionStartTime else { return }
        demoSessionDuration = Date().timeIntervalSince(startTime)
        
        if demoSessionDuration >= maxDemoDuration {
            endDemoSession()
        }
    }
    
    func trackFeatureUsage(_ feature: String) {
        featureUsageCount[feature, default: 0] += 1
        
        let totalUsage = featureUsageCount.values.reduce(0, +)
        if totalUsage >= maxDemoFeatures {
            showLimitReachedAlert()
        }
    }
    
    func isFeatureAvailable(_ feature: String) -> Bool {
        guard isDemoMode else { return true }
        
        switch feature {
        case "advanced_settings", "export_logs", "custom_themes":
            return false
        default:
            let totalUsage = featureUsageCount.values.reduce(0, +)
            return totalUsage < maxDemoFeatures
        }
    }
    
    func showLimitReachedAlert() {
        Logger.shared.log("Demo limit reached", level: .warning)
    }
    
    func endDemoSession() {
        timer?.invalidate()
        timer = nil
        
        if isDemoMode {
            Logger.shared.log("Demo session ended", level: .info)
        }
    }
    
    func activateFullVersion(licenseKey: String) -> Bool {
        guard validateLicenseKey(licenseKey) else {
            Logger.shared.log("Invalid license key", level: .error)
            return false
        }
        
        isDemoMode = false
        saveDemoData()
        Logger.shared.log("Full version activated", level: .info)
        return true
    }
    
    private func validateLicenseKey(_ key: String) -> Bool {
        return key.count == 32 && key.allSatisfy { $0.isNumber || $0.isLetter }
    }
    
    func resetDemoData() {
        isDemoMode = true
        demoSessionDuration = 0
        featureUsageCount = [:]
        hasSeenOnboarding = false
        saveDemoData()
        startSession()
        Logger.shared.log("Demo data reset", level: .info)
    }
    
    private func saveDemoData() {
        let data = [
            "isDemoMode": isDemoMode,
            "hasSeenOnboarding": hasSeenOnboarding,
            "featureUsageCount": featureUsageCount
        ] as [String : Any]
        
        UserDefaults.standard.set(data, forKey: userDefaultsKey)
    }
    
    private func loadDemoData() {
        guard let data = UserDefaults.standard.dictionary(forKey: userDefaultsKey) else {
            return
        }
        
        isDemoMode = data["isDemoMode"] as? Bool ?? true
        hasSeenOnboarding = data["hasSeenOnboarding"] as? Bool ?? false
        
        if let usage = data["featureUsageCount"] as? [String: Int] {
            featureUsageCount = usage
        }
    }
    
    func getRemainingFeatures() -> Int {
        let totalUsage = featureUsageCount.values.reduce(0, +)
        return max(0, maxDemoFeatures - totalUsage)
    }
    
    func getRemainingTime() -> TimeInterval {
        return max(0, maxDemoDuration - demoSessionDuration)
    }
}