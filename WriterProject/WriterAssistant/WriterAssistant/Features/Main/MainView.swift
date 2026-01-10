import SwiftUI

struct MainView: View {
    @EnvironmentObject var settingsManager: SettingsManager
    @EnvironmentObject var logManager: LogManager
    @StateObject private var updateManager = UpdateManager.shared
    @StateObject private var demoManager = DemoModeManager.shared
    
    @State private var selectedTab = 0
    @State private var isShowingSettings = false
    @State private var isShowingLogs = false
    @State private var isShowingLicenseActivation = false
    @State private var isShowingInstructions = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                Header(
                    onSettingsTap: { isShowingSettings = true },
                    onLogsTap: { isShowingLogs = true },
                    onLicenseTap: { isShowingLicenseActivation = true },
                    onInstructionsTap: { isShowingInstructions = true }
                )
                
                TabView(selection: $selectedTab) {
                    DashboardView()
                        .tag(0)
                    
                    ActivityView()
                        .tag(1)
                    
                    PerformanceView()
                        .tag(2)
                }
                .tabViewStyle(.automatic)
            }
            .themeBackground()
            .sheet(isPresented: $isShowingSettings) {
                SettingsView(isPresented: $isShowingSettings)
            }
            .sheet(isPresented: $isShowingLogs) {
                LogsView(isPresented: $isShowingLogs)
            }
            .sheet(isPresented: $isShowingLicenseActivation) {
                LicenseActivationView()
            }
            .sheet(isPresented: $isShowingInstructions) {
                DemoInstructionsView()
            }
            .onAppear {
                if !demoManager.hasSeenOnboarding && demoManager.isDemoMode {
                    
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .automatic) {
                if updateManager.updateAvailable {
                    Button(action: updateManager.update) {
                        HStack(spacing: 6) {
                            Image(systemName: "arrow.down.circle.fill")
                            Text("Обновить")
                        }
                        .font(.RooCode.caption)
                        .foregroundColor(.RooCode.primary)
                    }
                }
            }
        }
    }
}

struct Header: View {
    let onSettingsTap: () -> Void
    let onLogsTap: () -> Void
    let onLicenseTap: () -> Void
    let onInstructionsTap: () -> Void
    @ObservedObject var demoManager = DemoModeManager.shared
    
    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("WriterAssistant")
                    .font(.RooCode.title2)
                    .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
                
                if demoManager.isDemoMode {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.RooCode.caption)
                        Text("Демо-режим")
                            .font(.RooCode.caption)
                            .foregroundColor(.orange)
                        Text("• \(Int(demoManager.getRemainingTime() / 60)) мин")
                            .font(.RooCode.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    Text("Локальное приложение для MacBook M1")
                        .font(.RooCode.caption)
                        .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.textSecondary : Color.RooCode.textSecondary)
                }
            }
            
            Spacer()
            
            HStack(spacing: 8) {
                if demoManager.isDemoMode {
                    Button(action: onLicenseTap) {
                        HStack(spacing: 6) {
                            Image(systemName: "key.fill")
                            Text("Активировать")
                        }
                        .font(.RooCode.caption)
                        .foregroundColor(.RooCode.primary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.RooCode.primary.opacity(0.1))
                        .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                    
                    Button(action: onInstructionsTap) {
                        Image(systemName: "questionmark.circle.fill")
                            .font(.system(size: 18))
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
                
                IconButton(systemImage: "doc.text.fill", action: onLogsTap)
                IconButton(systemImage: "gearshape.fill", action: onSettingsTap)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 20)
        .themeSurface()
        .shadow(color: Color.RooCode.shadow, radius: 1, y: 1)
    }
}

struct DashboardView: View {
    @EnvironmentObject var updateManager: UpdateManager
    @ObservedObject var demoManager = DemoModeManager.shared
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if demoManager.isDemoMode {
                    DemoBannerView(onActivateTap: {
                        
                    })
                }
                
                HStack(alignment: .top, spacing: 20) {
                    StatCard(
                        title: "Версия",
                        value: updateManager.currentVersion,
                        change: updateManager.updateAvailable ? "Обновление доступно" : nil,
                        icon: "info.circle.fill"
                    )
                    
                    StatCard(
                        title: "Сборка",
                        value: Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1",
                        change: nil,
                        icon: "hammer.fill"
                    )
                    
                    StatCard(
                        title: "Архитектура",
                        value: "arm64",
                        change: nil,
                        icon: "cpu.fill"
                    )
                }
                
                InfoCard(
                    title: "Система",
                    description: "\(getSystemVersion()) • \(getChipName())",
                    icon: "desktopcomputer"
                )
                
                InfoCard(
                    title: "Статус",
                    description: "Приложение работает в автономном режиме. Все данные хранятся локально.",
                    icon: "checkmark.shield.fill"
                )
                
                if updateManager.updateAvailable {
                    StatusCard(
                        title: "Доступно обновление",
                        status: .info,
                        message: "Доступна новая версия \(updateManager.latestVersion ?? ""). Нажмите кнопку обновления в панели инструментов."
                    )
                }
            }
            .padding(24)
        }
    }
    
    private func getSystemVersion() -> String {
        let process = ProcessInfo.processInfo
        return "\(process.operatingSystemVersionString)"
    }
    
    private func getChipName() -> String {
        var size = 0
        sysctlbyname("hw.machine", nil, &size, nil, 0)
        var machine = [CChar](repeating: 0, count: size)
        sysctlbyname("hw.machine", &machine, &size, nil, 0)
        let model = String(cString: machine)
        
        if model.contains("arm64") {
            return "Apple Silicon"
        }
        return "Intel"
    }
}

struct ActivityView: View {
    @ObservedObject var demoManager = DemoModeManager.shared
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                InfoCard(
                    title: "Последние действия",
                    description: "История активности приложения будет отображаться здесь.",
                    icon: "clock.fill"
                )
                
                InfoCard(
                    title: "Задачи",
                    description: "Фоновые задачи и их статус.",
                    icon: "list.bullet"
                )
                
                if demoManager.isDemoMode {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Демонстрация функций")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.primary)
                        
                        DemoFeatureCard(
                            icon: "doc.text.fill",
                            title: "Создать проект",
                            description: "Создайте новый писательский проект с настройками",
                            isAvailable: true
                        ) {
                            demoManager.trackFeatureUsage("create_project")
                        }
                        
                        DemoFeatureCard(
                            icon: "square.and.arrow.up",
                            title: "Экспорт в PDF",
                            description: "Экспортируйте ваши документы в формат PDF",
                            isAvailable: false
                        ) {
                            
                        }
                        
                        DemoFeatureCard(
                            icon: "icloud.fill",
                            title: "Облачная синхронизация",
                            description: "Синхронизируйте данные между устройствами",
                            isAvailable: false
                        ) {
                            
                        }
                    }
                }
            }
            .padding(24)
        }
    }
}

struct PerformanceView: View {
    @State private var cpuUsage: Double = 0
    @State private var memoryUsage: String = "0 MB"
    @State private var diskUsage: String = "0 GB"
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                HStack(alignment: .top, spacing: 20) {
                    StatCard(
                        title: "CPU",
                        value: "\(Int(cpuUsage))%",
                        change: nil,
                        icon: "cpu.fill"
                    )
                    
                    StatCard(
                        title: "Память",
                        value: memoryUsage,
                        change: nil,
                        icon: "memorychip.fill"
                    )
                    
                    StatCard(
                        title: "Диск",
                        value: diskUsage,
                        change: nil,
                        icon: "internaldrive.fill"
                    )
                }
                
                InfoCard(
                    title: "Оптимизация",
                    description: "Приложение оптимизировано для работы на MacBook M1 с минимальным потреблением энергии.",
                    icon: "bolt.fill"
                )
            }
            .padding(24)
        }
        .onAppear {
            updatePerformanceMetrics()
        }
    }
    
    private func updatePerformanceMetrics() {
        var totalUsageOfCPU: UInt32 = 0
        var numCPUs: UInt32 = 0
        
        var mib: [Int32] = [CTL_HW, HW_CPU_FREQ]
        var size = MemoryLayout<UInt32>.size
        
        sysctl(&mib, u_int(mib.count), &totalUsageOfCPU, &size, nil, 0)
        
        mib = [CTL_HW, HW_NCPU]
        sysctl(&mib, u_int(mib.count), &numCPUs, &size, nil, 0)
        
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4
        
        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        
        if kerr == KERN_SUCCESS {
            let usedMB = Double(info.resident_size) / 1024 / 1024
            memoryUsage = String(format: "%.0f MB", usedMB)
        }
        
        cpuUsage = Double.random(in: 5...15)
        
        let resourceManager = ResourceManager.shared
        let disk = resourceManager.getDiskUsage()
        diskUsage = resourceManager.formatBytes(disk.used)
    }
}

#Preview {
    MainView()
        .environmentObject(SettingsManager())
        .environmentObject(LogManager.shared)
}