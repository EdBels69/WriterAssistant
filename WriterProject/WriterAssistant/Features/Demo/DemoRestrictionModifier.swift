import SwiftUI

struct DemoRestrictionModifier: ViewModifier {
    let feature: String
    let isRestricted: Bool
    
    @ObservedObject private var demoManager = DemoModeManager.shared
    @State private var showUpgradeAlert = false
    
    func body(content: Content) -> some View {
        if demoManager.isDemoMode && isRestricted {
            content
                .overlay(
                    ZStack {
                        Color.black.opacity(0.3)
                        
                        VStack(spacing: 12) {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 32))
                                .foregroundColor(.white)
                            
                            Text("Доступно в полной версии")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white)
                            
                            Button(action: {
                                showUpgradeAlert = true
                            }) {
                                Text("Разблокировать")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(Color.accentColor)
                                    .cornerRadius(6)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .cornerRadius(8)
                )
                .onTapGesture {
                    demoManager.trackFeatureUsage(feature)
                }
        } else {
            content
                .onTapGesture {
                    if demoManager.isDemoMode {
                        demoManager.trackFeatureUsage(feature)
                    }
                }
        }
    }
}

extension View {
    func demoRestricted(feature: String, isRestricted: Bool = true) -> some View {
        self.modifier(DemoRestrictionModifier(feature: feature, isRestricted: isRestricted))
    }
}

struct DemoBannerView: View {
    @ObservedObject var demoManager = DemoModeManager.shared
    let onActivateTap: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Демо-режим")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.orange)
                
                Text("Осталось \(Int(demoManager.getRemainingTime() / 60)) минут • \(demoManager.getRemainingFeatures()) действий")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: onActivateTap) {
                Text("Разблокировать")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.accentColor)
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)
        }
        .padding(16)
        .background(Color.orange.opacity(0.1))
        .cornerRadius(10)
    }
}

struct DemoFeatureCard: View {
    let icon: String
    let title: String
    let description: String
    let isAvailable: Bool
    let onTap: () -> Void
    
    @State private var isHovering = false
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 32))
                .foregroundColor(isAvailable ? .accentColor : .gray)
                .frame(width: 50, height: 50)
                .background((isAvailable ? Color.accentColor : Color.gray).opacity(0.1))
                .cornerRadius(10)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(title)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    if !isAvailable {
                        Image(systemName: "lock.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
                
                Text(description)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(Color(nsColor: .controlBackgroundColor))
        .cornerRadius(12)
        .scaleEffect(isHovering ? 1.02 : 1.0)
        .animation(.spring(response: 0.3), value: isHovering)
        .onHover { hovering in
            isHovering = hovering
        }
        .onTapGesture {
            if isAvailable {
                onTap()
            }
        }
    }
}