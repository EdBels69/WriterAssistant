import SwiftUI

struct DemoInstructionsView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var demoManager = DemoModeManager.shared
    
    @State private var selectedSection = 0
    
    private let sections = ["Обзор", "Функции", "FAQ"]
    
    var body: some View {
        VStack(spacing: 0) {
            headerView
            
            HStack(spacing: 0) {
                sidebarView
                    .frame(width: 200)
                
                Divider()
                
                contentView
            }
        }
        .frame(width: 700, height: 500)
        .background(Color.nsWindowBackground)
    }
    
    private var headerView: some View {
        HStack {
            Text("Инструкции по использованию")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.primary)
            
            Spacer()
            
            Button(action: { dismiss() }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(16)
        .background(Color(nsColor: .controlBackgroundColor))
    }
    
    private var sidebarView: some View {
        VStack(spacing: 0) {
            ForEach(0..<sections.count, id: \.self) { index in
                Button(action: {
                    withAnimation {
                        selectedSection = index
                    }
                }) {
                    HStack {
                        Text(sections[index])
                            .font(.system(size: 14, weight: index == selectedSection ? .medium : .regular))
                            .foregroundColor(index == selectedSection ? .primary : .secondary)
                        
                        Spacer()
                        
                        if index == selectedSection {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color.accentColor)
                                .frame(width: 3, height: 3)
                        }
                    }
                    .padding(.vertical, 12)
                    .padding(.horizontal, 16)
                    .background(index == selectedSection ? Color.accentColor.opacity(0.1) : Color.clear)
                }
                .buttonStyle(.plain)
            }
            
            Spacer()
            
            VStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Ваш прогресс")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                    
                    ProgressView(value: Double(demoManager.getRemainingFeatures()), total: 10)
                        .tint(.orange)
                    
                    Text("\(demoManager.getRemainingFeatures()) из 10 действий")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Время")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                    
                    Text("\(Int(demoManager.getRemainingTime() / 60)) минут")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.primary)
                }
            }
            .padding(16)
            .background(Color.orange.opacity(0.05))
            .cornerRadius(8)
            .padding(12)
        }
    }
    
    @ViewBuilder
    private var contentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                switch selectedSection {
                case 0:
                    overviewContent
                case 1:
                    featuresContent
                case 2:
                    faqContent
                default:
                    EmptyView()
                }
            }
            .padding(24)
        }
    }
    
    private var overviewContent: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Добро пожаловать в WriterAssistant!")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Это демо-версия приложения, которая позволяет ознакомиться с основными возможностями WriterAssistant.")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 16) {
                infoSection(
                    title: "Что такое демо-режим?",
                    description: "Демо-режим предоставляет ограниченный доступ к функциям приложения для ознакомления. Вы можете попробовать базовые возможности и принять решение о покупке полной версии."
                )
                
                infoSection(
                    title: "Ограничения демо-версии",
                    description: "• Время использования: 30 минут\n• Количество действий: 10\n• Ограниченный доступ к функциям экспорта\n• Без облачной синхронизации"
                )
                
                infoSection(
                    title: "Как начать?",
                    description: "Нажимайте на различные элементы интерфейса, чтобы познакомиться с функциями. Следите за индикатором оставшихся действий и времени в боковой панели."
                )
            }
        }
    }
    
    private var featuresContent: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Доступные функции")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
            }
            
            VStack(spacing: 12) {
                featureRow(
                    icon: "chart.bar.fill",
                    title: "Статистика и аналитика",
                    description: "Просмотр продуктивности и метрик",
                    isAvailable: true
                )
                
                featureRow(
                    icon: "folder.fill",
                    title: "Управление проектами",
                    description: "Создание и организация проектов",
                    isAvailable: true
                )
                
                featureRow(
                    icon: "square.and.arrow.up",
                    title: "Экспорт документов",
                    description: "Экспорт в PDF, DOCX и другие форматы",
                    isAvailable: false
                )
                
                featureRow(
                    icon: "icloud.fill",
                    title: "Облачная синхронизация",
                    description: "Синхронизация между устройствами",
                    isAvailable: false
                )
                
                featureRow(
                    icon: "paintpalette.fill",
                    title: "Персонализация",
                    description: "Настройка тем и интерфейса",
                    isAvailable: false
                )
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Полная версия включает:")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("✓ Безлимитное использование всех функций")
                    Text("✓ Экспорт в любые форматы")
                    Text("✓ Облачная синхронизация")
                    Text("✓ Пользовательские темы")
                    Text("✓ Приоритетная техподдержка")
                }
                .font(.system(size: 14))
                .foregroundColor(.secondary)
            }
        }
    }
    
    private var faqContent: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 12) {
                Text("Часто задаваемые вопросы")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.primary)
            }
            
            VStack(spacing: 16) {
                faqItem(
                    question: "Как продлить демо-период?",
                    answer: "Демо-период нельзя продлить. После истечения времени или исчерпания лимита действий необходимо приобрести полную версию."
                )
                
                faqItem(
                    question: "Сохранятся ли мои данные?",
                    answer: "Да, все данные, созданные в демо-режиме, сохранятся после активации полной версии. Данные хранятся локально на вашем устройстве."
                )
                
                faqItem(
                    question: "Как купить полную версию?",
                    answer: "Нажмите кнопку 'Активировать' в заголовке приложения и введите лицензионный ключ. Вы также можете приобрести ключ на нашем сайте."
                )
                
                faqItem(
                    question: "Что делать, если время истекло?",
                    answer: "Когда время истекло или достигнут лимит действий, приложение покажет окно активации. Введите лицензионный ключ, чтобы продолжить работу."
                )
            }
        }
    }
    
    private func infoSection(title: String, description: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.primary)
            
            Text(description)
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .lineSpacing(4)
        }
    }
    
    private func featureRow(icon: String, title: String, description: String, isAvailable: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(isAvailable ? .green : .gray)
                .frame(width: 40, height: 40)
                .background((isAvailable ? Color.green : Color.gray).opacity(0.1))
                .cornerRadius(8)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(title)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.primary)
                    
                    if !isAvailable {
                        Image(systemName: "lock.fill")
                            .font(.caption2)
                            .foregroundColor(.orange)
                    }
                }
                
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding(12)
        .background(Color(nsColor: .controlBackgroundColor))
        .cornerRadius(8)
    }
    
    private func faqItem(question: String, answer: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "questionmark.circle.fill")
                    .foregroundColor(.accentColor)
                Text(question)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
            }
            
            Text(answer)
                .font(.system(size: 13))
                .foregroundColor(.secondary)
                .padding(.leading, 24)
        }
    }
}

struct DemoInstructionsView_Previews: PreviewProvider {
    static var previews: some View {
        DemoInstructionsView()
    }
}