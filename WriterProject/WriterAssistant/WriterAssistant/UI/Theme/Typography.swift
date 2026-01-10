import SwiftUI

extension Font {
    struct RooCode {
        static let largeTitle = Font.system(size: 34, weight: .bold)
        static let title1 = Font.system(size: 28, weight: .bold)
        static let title2 = Font.system(size: 22, weight: .semibold)
        static let title3 = Font.system(size: 20, weight: .semibold)
        static let headline = Font.system(size: 17, weight: .semibold)
        static let body = Font.system(size: 17, weight: .regular)
        static let bodyEmphasized = Font.system(size: 17, weight: .medium)
        static let subheadline = Font.system(size: 15, weight: .regular)
        static let callout = Font.system(size: 16, weight: .regular)
        static let footnote = Font.system(size: 13, weight: .regular)
        static let caption1 = Font.system(size: 12, weight: .regular)
        static let caption2 = Font.system(size: 11, weight: .regular)
        
        static let code = Font.system(size: 14, design: .monospaced)
        static let codeSmall = Font.system(size: 12, design: .monospaced)
        static let codeLarge = Font.system(size: 16, design: .monospaced)
    }
}

extension Text {
    @ViewBuilder
    func largeTitle() -> some View {
        self.font(.RooCode.largeTitle)
            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
    }
    
    @ViewBuilder
    func title1() -> some View {
        self.font(.RooCode.title1)
            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
    }
    
    @ViewBuilder
    func title2() -> some View {
        self.font(.RooCode.title2)
            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
    }
    
    @ViewBuilder
    func headline() -> some View {
        self.font(.RooCode.headline)
            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
    }
    
    @ViewBuilder
    func bodyText() -> some View {
        self.font(.RooCode.body)
            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
    }
    
    @ViewBuilder
    func secondary() -> some View {
        self.font(.RooCode.body)
            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.textSecondary : Color.RooCode.textSecondary)
    }
    
    @ViewBuilder
    func codeText() -> some View {
        self.font(.RooCode.code)
            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.text : Color.RooCode.text)
    }
    
    @ViewBuilder
    func caption() -> some View {
        self.font(.RooCode.caption1)
            .foregroundColor(NSAppearance.current.isDark ? Color.RooCodeDark.textSecondary : Color.RooCode.textSecondary)
    }
}