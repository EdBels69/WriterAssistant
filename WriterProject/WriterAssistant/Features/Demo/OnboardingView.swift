import SwiftUI

struct OnboardingView: View {
    @StateObject private var demoManager = DemoModeManager.shared
    @State private var currentPage = 0
    @State private var isAnimating = false
    
    private let pages: [OnboardingPage] = [
        OnboardingPage(
            icon: "doc.text.fill",
            title: "Добро пожаловать в WriterAssistant",
            description: "Ваш интеллектуальный помощник для писателей. Создавайте, редактируйте и организуйте свои тексты с лёгкостью.",
            color: Color.blue
        ),
        OnboardingPage(
            icon: "chart.bar.fill",
            title: "Отслеживайте прогресс",
            description: "Анализируйте свою продуктивность с детальной статистикой и наглядными графиками.",
            color: Color.green
        ),
        OnboardingPage(
            icon: "folder.fill",
            title: "Управляйте проектами",
            description: "Организуйте все свои писательские проекты в одном месте с удобной системой тегов и категорий.",
            color: Color.orange
        ),
        OnboardingPage(
            icon: "star.fill",
            title: "Демо-режим",
            description: "Ознакомьтесь с основными возможностями WriterAssistant. В демо-версии доступно ограниченное количество функций.",
            color: Color.purple
        )
    ]
    
    var body: some View {
        ZStack {
            Color.nsWindowBackground
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                headerView
                
                Spacer()
                
                pageContentView
                    .frame(maxWidth: 600)
                
                Spacer()
                
                pageIndicatorView
                    .padding(.bottom, 40)
                
                actionButtonsView
                    .padding(.bottom, 40)
                    .padding(.horizontal, 40)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.8)) {
                isAnimating = true
            }
        }
    }
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("WriterAssistant")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.primary)
                
                if demoManager.isDemoMode {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                        Text("Демо-режим")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
            }
            
            Spacer()
            
            Button(action: {
                completeOnboarding()
            }) {
                Text("Пропустить")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 40)
        .padding(.top, 20)
    }
    
    private var pageContentView: some View {
        VStack(spacing: 30) {
            Image(systemName: pages[currentPage].icon)
                .font(.system(size: 80))
                .foregroundColor(pages[currentPage].color)
                .scaleEffect(isAnimating ? 1.0 : 0.8)
                .animation(.spring(response: 0.6, dampingFraction: 0.7), value: currentPage)
            
            VStack(spacing: 16) {
                Text(pages[currentPage].title)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                
                Text(pages[currentPage].description)
                    .font(.system(size: 16))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(6)
            }
            
            if currentPage == pages.count - 1 {
                demoLimitView
            }
        }
        .padding(.horizontal, 40)
        .transition(.asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        ))
    }
    
    private var demoLimitView: some View {
        VStack(spacing: 12) {
            HStack(spacing: 20) {
                limitItem(
                    icon: "clock.fill",
                    title: "Время сессии",
                    value: "\(Int(demoManager.getRemainingTime() / 60)) мин"
                )
                
                Divider()
                    .frame(height: 40)
                
                limitItem(
                    icon: "hand.tap.fill",
                    title: "Осталось действий",
                    value: "\(demoManager.getRemainingFeatures()) из 10"
                )
            }
            .padding(16)
            .background(Color(nsColor: .controlBackgroundColor))
            .cornerRadius(12)
            
            Text("Получите полный доступ ко всем функциям")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.primary)
        }
    }
    
    private func limitItem(icon: String, title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.orange)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.primary)
        }
    }
    
    private var pageIndicatorView: some View {
        HStack(spacing: 8) {
            ForEach(0..<pages.count, id: \.self) { index in
                Circle()
                    .fill(index == currentPage ? Color.accentColor : Color.gray.opacity(0.3))
                    .frame(width: index == currentPage ? 8 : 6, height: index == currentPage ? 8 : 6)
                    .animation(.spring(response: 0.3), value: currentPage)
            }
        }
    }
    
    private var actionButtonsView: some View {
        HStack(spacing: 16) {
            if currentPage > 0 {
                Button(action: {
                    withAnimation {
                        currentPage -= 1
                    }
                }) {
                    Text("Назад")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.primary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(Color(nsColor: .controlBackgroundColor))
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
            
            Button(action: {
                if currentPage < pages.count - 1 {
                    withAnimation {
                        currentPage += 1
                    }
                } else {
                    completeOnboarding()
                }
            }) {
                Text(currentPage < pages.count - 1 ? "Далее" : "Начать")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color.accentColor)
                    .cornerRadius(8)
            }
            .buttonStyle(.plain)
        }
    }
    
    private func completeOnboarding() {
        demoManager.hasSeenOnboarding = true
        NSApp.sendAction(#selector(NSWindow.close), to: nil, from: nil)
    }
}

struct OnboardingPage {
    let icon: String
    let title: String
    let description: String
    let color: Color
}

struct OnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        OnboardingView()
            .frame(width: 800, height: 600)
    }
}