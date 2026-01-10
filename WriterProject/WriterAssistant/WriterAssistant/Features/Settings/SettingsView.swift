import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var settingsManager: SettingsManager
    @Environment(\.dismiss) var dismiss
    @Binding var isPresented: Bool
    
    @State private var showingResetAlert = false
    
    var body: some View {
        VStack(spacing: 0) {
            header
            
            Divider()
                .background(NSAppearance.current.isDark ? Color.RooCodeDark.border : Color.RooCode.border)
            
            ScrollView {
                VStack(spacing: 24) {
                    themeSection
                    fontSizeSection
                    generalSection
                    dangerSection
                }
                .padding(24)
            }
            
            Divider()
                .background(NSAppearance.current.isDark ? Color.RooCodeDark.border : Color.RooCode.border)
            
            footer
        }
        .frame(width: 600, height: 500)
        .themeSurface()
        .alert("Сброс настроек", isPresented: $showingResetAlert) {
            Button("Отмена", role: .cancel) { }
            Button("Сбросить", role: .destructive) {
                settingsManager.resetToDefaults()
            }
        } message: {
            Text("Все настройки будут сброшены к значениям по умолчанию.")
        }
    }
    
    private var header: some View {
        HStack {
            Text("Настройки")
                .font(.RooCode.title3)
                .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
            
            Spacer()
            
            Button(action: { isPresented = false }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.textSecondary : Color.RooCode.textSecondary)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 20)
    }
    
    private var themeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Тема оформления")
                .font(.RooCode.headline)
                .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
            
            HStack(spacing: 12) {
                ForEach(Settings.Theme.allCases, id: \.self) { theme in
                    ThemeButton(
                        title: theme.displayName,
                        isSelected: settingsManager.theme == theme,
                        action: { settingsManager.theme = theme }
                    )
                }
            }
        }
    }
    
    private var fontSizeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Размер шрифта")
                .font(.RooCode.headline)
                .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
            
            HStack(spacing: 16) {
                Button(action: { settingsManager.fontSize = max(12, settingsManager.fontSize - 1) }) {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.RooCode.primary)
                }
                .buttonStyle(PlainButtonStyle())
                
                Text("\(settingsManager.fontSize) pt")
                    .font(.RooCode.body)
                    .frame(width: 60)
                    .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
                
                Button(action: { settingsManager.fontSize = min(24, settingsManager.fontSize + 1) }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.RooCode.primary)
                }
                .buttonStyle(PlainButtonStyle())
                
                Spacer()
                
                Text("Предпросмотр")
                    .font(.system(size: CGFloat(settingsManager.fontSize)))
                    .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.textSecondary : Color.RooCode.textSecondary)
            }
        }
    }
    
    private var generalSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Общие")
                .font(.RooCode.headline)
                .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
            
            Toggle("Автосохранение", isOn: $settingsManager.autoSave)
                .font(.RooCode.body)
                .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
        }
    }
    
    private var dangerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Опасные действия")
                .font(.RooCode.headline)
                .foregroundColor(.RooCode.error)
            
            Button(action: { showingResetAlert = true }) {
                HStack {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Сбросить настройки")
                }
                .font(.RooCode.bodyEmphasized)
                .foregroundColor(.RooCode.error)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.RooCode.error.opacity(0.1))
                .cornerRadius(8)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
    
    private var footer: some View {
        HStack {
            Spacer()
            
            SecondaryButton(title: "Отмена") {
                isPresented = false
            }
            
            Button(action: {
                settingsManager.save()
                isPresented = false
            }) {
                Text("Сохранить")
                    .font(.RooCode.bodyEmphasized)
                    .foregroundColor(.white)
                    .frame(width: 100, height: 36)
                    .background(Color.RooCode.primary)
                    .cornerRadius(6)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 16)
    }
}

struct ThemeButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    @State private var isHovered = false
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.RooCode.body)
                .foregroundColor(isSelected ? .white : (NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text))
                .frame(maxWidth: .infinity)
                .frame(height: 36)
                .background(
                    Group {
                        if isSelected {
                            Color.RooCode.primary
                        } else if isHovered {
                            (NSAppearance.current.isDark ? Color.RooCodeDark.border : Color.RooCode.borderHover)
                        } else {
                            (NSAppearance.current.isDark ? Color.RooCodeDark.border : Color.RooCode.border)
                        }
                    }
                )
                .cornerRadius(6)
        }
        .buttonStyle(PlainButtonStyle())
        .onHover { hovering in
            isHovered = hovering
        }
    }
}

#Preview {
    SettingsView(isPresented: .constant(true))
        .environmentObject(SettingsManager())
}