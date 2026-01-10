import SwiftUI

struct Card<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            content
        }
        .themeSurface()
        .cornerRadius(12)
        .shadow(color: Color.RooCode.shadow, radius: 8, x: 0, y: 2)
    }
}

struct InfoCard: View {
    let title: String
    let description: String
    let icon: String?
    
    init(title: String, description: String, icon: String? = nil) {
        self.title = title
        self.description = description
        self.icon = icon
    }
    
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                if let icon = icon {
                    HStack {
                        Image(systemName: icon)
                            .font(.system(size: 20))
                            .foregroundColor(.RooCode.primary)
                        Text(title)
                            .font(.RooCode.title3)
                            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
                        Spacer()
                    }
                } else {
                    Text(title)
                        .font(.RooCode.title3)
                        .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
                }
                
                Text(description)
                    .font(.RooCode.body)
                    .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.textSecondary : Color.RooCode.textSecondary)
                    .lineLimit(3)
            }
            .padding(20)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title), \(description)")
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let change: String?
    let icon: String
    
    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: 24))
                        .foregroundColor(.RooCode.primary)
                    Spacer()
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(value)
                        .font(.RooCode.title1)
                        .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
                    
                    if let change = change {
                        Text(change)
                            .font(.RooCode.caption)
                            .foregroundColor(change.hasPrefix("+") ? .RooCode.success : .RooCode.error)
                    }
                    
                    Text(title)
                        .font(.RooCode.subheadline)
                        .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.textSecondary : Color.RooCode.textSecondary)
                }
            }
            .padding(20)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(value)")
    }
}

struct StatusCard: View {
    let title: String
    let status: Status
    let message: String
    
    enum Status {
        case success
        case warning
        case error
        case info
        
        var color: Color {
            switch self {
            case .success: return .RooCode.success
            case .warning: return .RooCode.warning
            case .error: return .RooCode.error
            case .info: return .RooCode.primary
            }
        }
        
        var icon: String {
            switch self {
            case .success: return "checkmark.circle.fill"
            case .warning: return "exclamationmark.triangle.fill"
            case .error: return "xmark.circle.fill"
            case .info: return "info.circle.fill"
            }
        }
    }
    
    var body: some View {
        Card {
            HStack(alignment: .top, spacing: 16) {
                Image(systemName: status.icon)
                    .font(.system(size: 24))
                    .foregroundColor(status.color)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.RooCode.headline)
                        .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
                    
                    Text(message)
                        .font(.RooCode.body)
                        .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.textSecondary : Color.RooCode.textSecondary)
                }
                
                Spacer()
            }
            .padding(20)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(message)")
    }
}