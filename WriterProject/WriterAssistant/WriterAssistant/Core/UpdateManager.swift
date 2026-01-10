import Foundation
import os.log

class UpdateManager: ObservableObject {
    static let shared = UpdateManager()
    
    @Published var currentVersion: String
    @Published var latestVersion: String?
    @Published var updateAvailable: Bool = false
    @Published var isChecking: Bool = false
    @Published var updateStatus: String?
    
    private let logger = OSLog(subsystem: "com.writerassistant.app", category: "UpdateManager")
    private let gitExecutable = "/usr/bin/git"
    
    init() {
        self.currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        checkForUpdates()
    }
    
    func checkForUpdates() {
        guard isGitRepository() else {
            os_log("Not a git repository", log: logger, type: .info)
            return
        }
        
        isChecking = true
        updateStatus = "Проверка обновлений..."
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.fetchLatestVersion()
        }
    }
    
    private func fetchLatestVersion() {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: gitExecutable)
        task.arguments = ["fetch", "--tags"]
        
        do {
            try task.run()
            task.waitUntilExit()
            
            if task.terminationStatus == 0 {
                let version = getLatestVersionTag()
                DispatchQueue.main.async { [weak self] in
                    self?.handleVersionCheck(version)
                }
            } else {
                DispatchQueue.main.async { [weak self] in
                    self?.isChecking = false
                    self?.updateStatus = "Ошибка при проверке обновлений"
                }
            }
        } catch {
            os_log("Git fetch failed: %{public}@", log: logger, type: .error, error.localizedDescription)
            DispatchQueue.main.async { [weak self] in
                self?.isChecking = false
                self?.updateStatus = "Ошибка соединения с Git"
            }
        }
    }
    
    private func getLatestVersionTag() -> String? {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: gitExecutable)
        task.arguments = ["describe", "--tags", "--abbrev=0", "origin/main"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            if task.terminationStatus == 0,
               let data = try pipe.fileHandleForReading.readToEnd(),
               let version = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) {
                return version
            }
        } catch {
            os_log("Failed to get version tag: %{public}@", log: logger, type: .error, error.localizedDescription)
        }
        
        return nil
    }
    
    private func handleVersionCheck(_ version: String?) {
        latestVersion = version
        updateAvailable = compareVersions(current: currentVersion, latest: version ?? currentVersion) < 0
        isChecking = false
        updateStatus = updateAvailable ? "Доступно обновление до версии \(version ?? "")" : "Актуальная версия"
        
        Logger.shared.log("Version check: current=\(currentVersion), latest=\(version ?? "unknown"), available=\(updateAvailable)", level: .info)
    }
    
    func update() {
        guard updateAvailable, let version = latestVersion else { return }
        
        updateStatus = "Обновление до версии \(version)..."
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.performUpdate(version: version)
        }
    }
    
    private func performUpdate(version: String) {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: gitExecutable)
        task.arguments = ["checkout", "tags/\(version)"]
        
        do {
            try task.run()
            task.waitUntilExit()
            
            DispatchQueue.main.async { [weak self] in
                if task.terminationStatus == 0 {
                    self?.updateStatus = "Обновление завершено. Перезапустите приложение."
                    Logger.shared.log("Updated to version \(version)", level: .info)
                } else {
                    self?.updateStatus = "Ошибка при обновлении"
                    Logger.shared.log("Update failed with exit code \(task.terminationStatus)", level: .error)
                }
            }
        } catch {
            os_log("Update failed: %{public}@", log: logger, type: .error, error.localizedDescription)
            DispatchQueue.main.async { [weak self] in
                self?.updateStatus = "Ошибка при обновлении: \(error.localizedDescription)"
            }
        }
    }
    
    private func isGitRepository() -> Bool {
        guard let repoPath = Bundle.main.resourceURL?.deletingLastPathComponent().deletingLastPathComponent() else {
            return false
        }
        
        let gitPath = repoPath.appendingPathComponent(".git")
        return FileManager.default.fileExists(atPath: gitPath.path)
    }
    
    private func compareVersions(current: String, latest: String) -> ComparisonResult {
        let currentParts = current.components(separatedBy: ".").compactMap { Int($0) }
        let latestParts = latest.components(separatedBy: ".").compactMap { Int($0) }
        
        for i in 0..<max(currentParts.count, latestParts.count) {
            let currentPart = i < currentParts.count ? currentParts[i] : 0
            let latestPart = i < latestParts.count ? latestParts[i] : 0
            
            if currentPart < latestPart {
                return .orderedAscending
            } else if currentPart > latestPart {
                return .orderedDescending
            }
        }
        
        return .orderedSame
    }
    
    func getCommitHistory(limit: Int = 10) -> [(hash: String, message: String)] {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: gitExecutable)
        task.arguments = ["log", "-\(limit)", "--pretty=format:%H|%s"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        
        var commits: [(hash: String, message: String)] = []
        
        do {
            try task.run()
            task.waitUntilExit()
            
            if task.terminationStatus == 0,
               let data = try pipe.fileHandleForReading.readToEnd(),
               let output = String(data: data, encoding: .utf8) {
                commits = output.components(separatedBy: "\n")
                    .filter { !$0.isEmpty }
                    .compactMap { line in
                        let parts = line.components(separatedBy: "|")
                        if parts.count >= 2 {
                            return (hash: String(parts[0].prefix(7)), message: parts[1])
                        }
                        return nil
                    }
            }
        } catch {
            os_log("Failed to get commit history: %{public}@", log: logger, type: .error, error.localizedDescription)
        }
        
        return commits
    }
}