import Foundation
import os.log

class ResourceManager {
    static let shared = ResourceManager()
    
    private let logger = OSLog(subsystem: "com.ultrahink.app", category: "ResourceManager")
    
    private init() {}
    
    static func validateLocalResources() -> Bool {
        let resources = [
            "Ultrahink.xcdatamodeld",
            "Assets.xcassets"
        ]
        
        var allValid = true
        
        for resource in resources {
            if Bundle.main.path(forResource: resource, ofType: nil) == nil {
                os_log("Missing resource: %{public}@", log: shared.logger, type: .error, resource)
                allValid = false
            }
        }
        
        if allValid {
            Logger.shared.log("All local resources validated successfully", level: .info)
        }
        
        return allValid
    }
    
    func getAppSupportDirectory() -> URL {
        let paths = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
        let appSupportPath = paths[0].appendingPathComponent("Ultrahink")
        
        if !FileManager.default.fileExists(atPath: appSupportPath.path) {
            try? FileManager.default.createDirectory(at: appSupportPath, withIntermediateDirectories: true)
            Logger.shared.log("Created application support directory", level: .info)
        }
        
        return appSupportPath
    }
    
    func getCachesDirectory() -> URL {
        let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
        let cachesPath = paths[0].appendingPathComponent("Ultrahink")
        
        if !FileManager.default.fileExists(atPath: cachesPath.path) {
            try? FileManager.default.createDirectory(at: cachesPath, withIntermediateDirectories: true)
        }
        
        return cachesPath
    }
    
    func cleanupCache(maxAge: TimeInterval = 7 * 24 * 60 * 60) {
        let cachesDir = getCachesDirectory()
        let cutoffDate = Date(timeIntervalSinceNow: -maxAge)
        
        guard let enumerator = FileManager.default.enumerator(at: cachesDir, includingPropertiesForKeys: [.contentModificationDateKey]) else {
            return
        }
        
        var cleanedCount = 0
        
        for case let fileURL as URL in enumerator {
            guard let resourceValues = try? fileURL.resourceValues(forKeys: [.contentModificationDateKey]),
                  let modificationDate = resourceValues.contentModificationDate,
                  modificationDate < cutoffDate else {
                continue
            }
            
            try? FileManager.default.removeItem(at: fileURL)
            cleanedCount += 1
        }
        
        if cleanedCount > 0 {
            Logger.shared.log("Cleaned \(cleanedCount) cache files", level: .info)
        }
    }
    
    func getDiskUsage() -> (total: Int64, used: Int64, free: Int64) {
        var totalSpace: Int64 = 0
        var freeSpace: Int64 = 0
        
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        if let attributes = try? FileManager.default.attributesOfFileSystem(forPath: paths[0].path) {
            totalSpace = attributes[.systemSize] as? Int64 ?? 0
            freeSpace = attributes[.systemFreeSize] as? Int64 ?? 0
        }
        
        let usedSpace = totalSpace - freeSpace
        return (totalSpace, usedSpace, freeSpace)
    }
    
    func getAppSize() -> Int64 {
        var totalSize: Int64 = 0
        
        if let appBundleURL = Bundle.main.bundleURL {
            if let enumerator = FileManager.default.enumerator(at: appBundleURL, includingPropertiesForKeys: [.fileSizeKey]) {
                for case let fileURL as URL in enumerator {
                    if let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
                       let fileSize = resourceValues.fileSize {
                        totalSize += Int64(fileSize)
                    }
                }
            }
        }
        
        return totalSize
    }
    
    func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useBytes, .useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}

class SecureStorage {
    static let shared = SecureStorage()
    
    private init() {}
    
    func save(key: String, value: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: value.data(using: .utf8)!,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        
        if status != errSecSuccess {
            Logger.shared.log("Failed to save to secure storage: \(status)", level: .error)
        }
    }
    
    func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        if status == errSecSuccess, let data = result as? Data {
            return String(data: data, encoding: .utf8)
        }
        
        return nil
    }
    
    func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}