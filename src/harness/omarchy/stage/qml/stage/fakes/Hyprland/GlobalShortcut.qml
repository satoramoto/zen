import QtQuick
import qs.stage

// Stands in for Quickshell.Hyprland's GlobalShortcut. A play can press one
// with `stage.shortcut(appid, name)`.
QtObject {
  id: shortcut
  property string appid: "quickshell"
  property string name: ""
  property string description: ""
  property string triggerDescription: ""
  signal pressed()
  signal released()
  Component.onCompleted: Stage.shortcuts = Stage.shortcuts.concat([shortcut])
}
