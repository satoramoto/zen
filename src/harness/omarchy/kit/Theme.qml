import QtQuick
import qs.Commons as Commons
import "theme.mjs" as Themes

// Snapshot the actual Omarchy style roles once for either renderer. No copies of
// the native controls or writes to the user's theme are involved.
QtObject {
    property bool followPalette: false
    function css(c) { return c.a===1 ? c.toString() : "rgba("+Math.round(c.r*255)+","+Math.round(c.g*255)+","+Math.round(c.b*255)+","+c.a+")" }
    function color(value) {
        var m=String(value||"").match(/^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/)
        return m ? Qt.rgba(Number(m[1])/255,Number(m[2])/255,Number(m[3])/255,Number(m[4])) : value
    }
    readonly property var snapshot: {
        var t=Object.assign({},Themes.dark)
        t.radius=Commons.Style.cornerRadius
        if(followPalette) {
            t.background=css(Commons.Color.background); t.foreground=css(Commons.Color.foreground)
            t.muted=css(Commons.Color.muted); t.accent=css(Commons.Color.accent); t.urgent=css(Commons.Color.urgent)
            t.font=Commons.Style.font.family; t.size=Commons.Style.font.body; t.small=Commons.Style.font.caption
            t.line=Math.ceil(t.size*1.5); t.smallLine=Math.ceil(t.small*1.5); t.radius=Commons.Style.cornerRadius
        }
        var fg=Qt.color(t.foreground),accent=Qt.color(t.accent)
        t.selected=css(Commons.Style.selectedStateColor(fg,accent))
        t.normalFill=css(Commons.Style.normalFillFor(fg,accent)); t.selectedFill=css(Commons.Style.selectedFillFor(fg,accent))
        t.hoverFill=css(Commons.Style.hoverFillFor(fg,accent)); t.normalBorder=css(Commons.Style.normalBorderFor(fg,accent))
        t.hoverBorder=css(Commons.Style.hoverBorderFor(fg,accent))
        t.selectSize=Commons.Style.font.body; t.selectInset=Commons.Style.spacing.controlPaddingX
        t.popupRow=Commons.Style.spacing.popupRowHeight;t.popupGap=Commons.Style.spacing.xxs
        t.optionGap=Commons.Style.spacing.labelGap;t.popupPad=Commons.Style.spacing.hairline+1
        t.popupBorder=css(Commons.Color.popups.border);t.hoverText=css(Commons.Style.hoverStateColor(fg,accent))
        t.selectionFill=css(Commons.Style.selectionFillFor(fg,accent))
        return t
    }
}
