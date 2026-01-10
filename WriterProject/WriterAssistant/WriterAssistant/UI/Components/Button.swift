import SwiftUI

struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    @State private var isHovered = false
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.RooCode.bodyEmphasized)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(
                    Group {
                        if isHovered {
                            Color.RooCode.primaryHover
                        } else {
                            Color.RooCode.primary
                        }
                    }
                )
                .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                isHovered = hovering
            }
        }
        .accessibilityLabel(title)
        .accessibilityHint("Нажмите для выполнения действия")
    }
}

struct SecondaryButton: View {
    let title: String
    let action: () -> Void
    @State private var isHovered = false
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.RooCode.bodyEmphasized)
                .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(
                    Group {
                        if isHovered {
                            (NSAppearance.current.isDark ? Color.RooCodeDark.border : Color.RooCode.borderHover)
                        } else {
                            (NSAppearance.current.isDark ? Color.RooCodeDark.border : Color.RooCode.border)
                        }
                    }
                )
                .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                isHovered = hovering
            }
        }
        .accessibilityLabel(title)
        .accessibilityHint("Нажмите для выполнения действия")
    }
}

struct IconButton: View {
    let systemImage: String
    let action: () -> Void
    @State private var isHovered = false
    
    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
                .frame(width: 32, height: 32)
                .background(
                    Group {
                        if isHovered {
                            (NSAppearance.current.isDark ? Color.RooCodeDark.border : Color.RooCode.borderHover)
                        } else {
                            Color.clear
                        }
                    }
                )
                .cornerRadius(6)
        }
        .buttonStyle(PlainButtonStyle())
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                isHovered = hovering
            }
        }
        .accessibilityLabel(systemImage)
        .accessibilityAddTraits(.isButton)
    }
}