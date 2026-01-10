import SwiftUI

struct LicenseActivationView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var demoManager = DemoModeManager.shared
    
    @State private var licenseKey: String = ""
    @State private var isValidating: Bool = false
    @State private var activationSuccess: Bool = false
    @State private var errorMessage: String?
    @State private var showPurchaseLink: Bool = false
    
    private let maxLicenseLength = 32
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                headerView
                
                if activationSuccess {
                    successView
                } else {
                    activationFormView
                }
                
                Spacer()
            }
            .frame(width: 500, height: 400)
            .background(Color.nsWindowBackground)
        }
        .alert(isPresented: Binding<Bool>(
            get: { errorMessage != nil },
            set: { _ in errorMessage = nil }
        )) {
            Alert(
                title: Text("Ошибка активации"),
                message: Text(errorMessage ?? ""),
                dismissButton: .default(Text("OK"))
            )
        }
        .sheet(isPresented: $showPurchaseLink) {
            PurchaseLinkView()
        }
    }
    
    private var headerView: some View {
        VStack(spacing: 12) {
            Image(systemName: activationSuccess ? "checkmark.circle.fill" : "key.fill")
                .font(.system(size: 48))
                .foregroundColor(activationSuccess ? .green : .accentColor)
            
            Text(activationSuccess ? "Активация успешна!" : "Активация полной версии")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.primary)
        }
        .padding(.top, 40)
        .padding(.bottom, 30)
    }
    
    private var successView: some View {
        VStack(spacing: 20) {
            Text("Ваша копия WriterAssistant успешно активирована!")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            VStack(alignment: .leading, spacing: 8) {
                featureCheckmark("Безлимитное использование всех функций")
                featureCheckmark("Экспорт в PDF и другие форматы")
                featureCheckmark("Облачная синхронизация")
                featureCheckmark("Пользовательские темы")
                featureCheckmark("Приоритетная техподдержка")
            }
            .padding(.horizontal, 40)
            
            Button(action: {
                dismiss()
            }) {
                Text("Начать работу")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color.accentColor)
                    .cornerRadius(8)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 40)
        }
        .padding(.top, 20)
    }
    
    private var activationFormView: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Лицензионный ключ")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
                
                TextField("Введите лицензионный ключ", text: $licenseKey)
                    .textFieldStyle(.plain)
                    .font(.system(size: 14))
                    .padding(12)
                    .background(Color(nsColor: .textBackgroundColor))
                    .cornerRadius(8)
                    .onChange(of: licenseKey) { newValue in
                        licenseKey = String(newValue.prefix(maxLicenseLength)).uppercased()
                    }
                
                if !licenseKey.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(0..<min(licenseKey.count, maxLicenseLength), id: \.self) { index in
                            Circle()
                                .fill(index < licenseKey.count ? Color.green : Color.gray.opacity(0.3))
                                .frame(width: 4, height: 4)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(.horizontal, 40)
            
            VStack(spacing: 8) {
                Text("Что включено в полную версию:")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.secondary)
                
                HStack(alignment: .top, spacing: 30) {
                    VStack(alignment: .leading, spacing: 6) {
                        featureRow("Безлимитное использование")
                        featureRow("Экспорт в PDF")
                        featureRow("Облачная синхронизация")
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        featureRow("Пользовательские темы")
                        featureRow("Приоритетная поддержка")
                        featureRow("Обновления")
                    }
                }
                .font(.system(size: 12))
            }
            .padding(.horizontal, 40)
            
            VStack(spacing: 12) {
                Button(action: activateLicense) {
                    HStack {
                        if isValidating {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        }
                        Text(isValidating ? "Проверка..." : "Активировать")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(licenseKey.count == maxLicenseLength ? Color.accentColor : Color.gray)
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .disabled(licenseKey.count != maxLicenseLength || isValidating)
                
                Button(action: {
                    showPurchaseLink = true
                }) {
                    Text("Получить лицензионный ключ")
                        .font(.system(size: 14))
                        .foregroundColor(.accentColor)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 40)
        }
    }
    
    private func featureCheckmark(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
            Text(text)
                .font(.system(size: 14))
                .foregroundColor(.primary)
        }
    }
    
    private func featureRow(_ text: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "checkmark")
                .font(.system(size: 10))
                .foregroundColor(.green)
            Text(text)
                .foregroundColor(.primary)
        }
    }
    
    private func activateLicense() {
        guard licenseKey.count == maxLicenseLength else { return }
        
        isValidating = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isValidating = false
            
            if demoManager.activateFullVersion(licenseKey: licenseKey) {
                activationSuccess = true
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    dismiss()
                }
            } else {
                errorMessage = "Неверный лицензионный ключ. Проверьте введённые данные и попробуйте снова."
            }
        }
    }
}

struct PurchaseLinkView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 20) {
            VStack(spacing: 12) {
                Image(systemName: "cart.fill")
                    .font(.system(size: 48))
                    .foregroundColor(.accentColor)
                
                Text("Приобретение лицензии")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.primary)
                
                Text("Выберите подходящий вам план подписки")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .padding(.top, 20)
            
            VStack(spacing: 12) {
                purchasePlan(
                    title: "Базовый",
                    price: "$19.99",
                    period: "разово",
                    features: ["Все основные функции", "Пожизненная лицензия"]
                )
                
                purchasePlan(
                    title: "Профессиональный",
                    price: "$49.99",
                    period: "разово",
                    features: ["Все функции", "Приоритетная поддержка", "Обновления в течение 1 года"],
                    isHighlighted: true
                )
                
                purchasePlan(
                    title: "Командный",
                    price: "$99.99",
                    period: "разово",
                    features: ["Все функции", "Поддержка до 5 пользователей", "Облачная синхронизация"]
                )
            }
            .padding(.horizontal, 40)
            
            Button(action: {
                dismiss()
            }) {
                Text("Закрыть")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .frame(width: 500, height: 500)
        .background(Color.nsWindowBackground)
    }
    
    private func purchasePlan(title: String, price: String, period: String, features: [String], isHighlighted: Bool = false) -> some View {
        VStack(spacing: 12) {
            HStack {
                Text(title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.primary)
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(price)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.accentColor)
                    Text(period)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            VStack(alignment: .leading, spacing: 4) {
                ForEach(features, id: \.self) { feature in
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10))
                            .foregroundColor(.green)
                        Text(feature)
                            .font(.system(size: 12))
                            .foregroundColor(.primary)
                    }
                }
            }
            
            Button(action: {
                
            }) {
                Text("Выбрать")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(isHighlighted ? .white : .accentColor)
                    .frame(maxWidth: .infinity)
                    .frame(height: 36)
                    .background(isHighlighted ? Color.accentColor : Color.accentColor.opacity(0.1))
                    .cornerRadius(6)
            }
            .buttonStyle(.plain)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isHighlighted ? Color.accentColor.opacity(0.1) : Color(nsColor: .controlBackgroundColor))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(isHighlighted ? Color.accentColor : Color.clear, lineWidth: 2)
                )
        )
    }
}

struct LicenseActivationView_Previews: PreviewProvider {
    static var previews: some View {
        LicenseActivationView()
    }
}