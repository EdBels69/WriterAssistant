import SwiftUI

extension Color {
    struct RooCode {
        static let background = Color(hex: "#FAFAFA")
        static let surface = Color(hex: "#FFFFFF")
        static let text = Color(hex: "#1A1A1A")
        static let textSecondary = Color(hex: "#6B7280")
        static let primary = Color(hex: "#2563EB")
        static let primaryHover = Color(hex: "#1D4ED8")
        static let success = Color(hex: "#10B981")
        static let warning = Color(hex: "#F59E0B")
        static let error = Color(hex: "#EF4444")
        static let border = Color(hex: "#E5E7EB")
        static let borderHover = Color(hex: "#D1D5DB")
        static let shadow = Color(hex: "#000000").opacity(0.08)
    }
    
    struct RooCodeDark {
        static let background = Color(hex: "#1A1A1A")
        static let surface = Color(hex: "#2D2D2D")
        static let text = Color(hex: "#FAFAFA")
        static let textSecondary = Color(hex: "#9CA3AF")
        static let border = Color(hex: "#374151")
        static let shadow = Color(hex: "#FFFFFF").opacity(0.05)
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

extension View {
    @ViewBuilder
    func themeBackground() -> some View {
        self.background(
            Group {
                if NSAppearance.current.isDark {
                    Color.RooCodeDark.background
                } else {
                    Color.RooCode.background
                }
            }
        )
    }
    
    @ViewBuilder
    func themeSurface() -> some View {
        self.background(
            Group {
                if NSAppearance.current.isDark {
                    Color.RooCodeDark.surface
                } else {
                    Color.RooCode.surface
                }
        )
    }
}

extension NSAppearance {
    var isDark: Bool {
        name == .darkAqua
    }
}