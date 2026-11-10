import QtQuick

// Stands in for Quickshell.Hyprland's HyprlandFocusGrab: there is no
// compositor to grab from, so it only keeps its properties.
QtObject {
  property bool active: false
  property var windows: []
  signal cleared()
}
