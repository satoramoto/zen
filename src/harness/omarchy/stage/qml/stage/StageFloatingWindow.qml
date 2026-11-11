import QtQuick
import Quickshell
import Quickshell.Wayland

// Stands in for Quickshell's FloatingWindow (an ordinary toplevel). It sits
// centred in the screen's free area, above the bar's layer, at its implicit
// size bounded by its minimum and maximum.
StagePanelWindow {
  id: win

  property size minimumSize: Qt.size(0, 0)
  property size maximumSize: Qt.size(0, 0)
  property var parentWindow: null

  wlr_layer: WlrLayer.Top

  function _bound(value, min, max) {
    var v = Math.max(value, min || 0)
    return max > 0 ? Math.min(v, max) : v
  }
  readonly property real _w: _bound(implicitWidth, minimumSize.width, maximumSize.width)
  readonly property real _h: _bound(implicitHeight, minimumSize.height, maximumSize.height)

  // Through the base's geometry: no anchors means centred.
  Component.onCompleted: {
    win.implicitWidth = Qt.binding(function() { return win._w })
    win.implicitHeight = Qt.binding(function() { return win._h })
  }
}
