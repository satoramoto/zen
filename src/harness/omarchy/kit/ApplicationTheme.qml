import QtQuick
import "application-themes.mjs" as Tokens

QtObject {
    property string name: "omarchy"
    property Theme nativeTheme: Theme { followPalette:true }
    readonly property string mode: Qt.color(nativeTheme.snapshot.background).hslLightness > 0.5 ? "light" : "dark"
    readonly property var snapshot: name === "visuals" ? Tokens.visuals[mode]
        : Object.assign({},nativeTheme.snapshot,{style:"omarchy",surfaceFill:"transparent",toolbarFill:"transparent",surfaceBorder:"transparent",controlRadius:nativeTheme.snapshot.radius})
}
