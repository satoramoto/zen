import QtQuick
import Quickshell
import Quickshell.Wayland

// Stands in for Quickshell's PanelWindow (a layer-shell surface), which
// headless Qt can't create. The stage rewrites `PanelWindow {` to this, and
// `WlrLayershell.<x>:` to `wlr_<x>:`. It keeps PanelWindow's API and puts its
// contents on the stage's screen, in its layer, where layer-shell would place
// them. What it holds is drawn by Qt exactly as in the bar.
QtObject {
  id: win

  property StageEdges anchors: StageEdges {}
  property StageMargins margins: StageMargins {}
  property var screen: Quickshell.screens.length > 0 ? Quickshell.screens[0] : null
  property color color: "white"
  property bool visible: true
  property real implicitWidth: 0
  property real implicitHeight: 0
  property int exclusiveZone: 0
  property int exclusionMode: ExclusionMode.Normal
  property bool focusable: false
  property bool aboveWindows: true
  property var mask: null
  property var surfaceFormat: null
  property string title: ""

  property string wlr_namespace: ""
  property int wlr_layer: WlrLayer.Top
  property int wlr_keyboardFocus: WlrKeyboardFocus.None

  readonly property bool backingWindowVisible: visible && surfaceItem.parent !== null
  readonly property real devicePixelRatio: 1
  readonly property Item contentItem: surfaceItem
  readonly property alias width: surfaceItem.width
  readonly property alias height: surfaceItem.height
  readonly property var windowTransform: null

  default property alias data: surfaceItem.data

  function itemPosition(item) { return item.mapToItem(surfaceItem, 0, 0) }
  function itemRect(item) {
    var p = item.mapToItem(surfaceItem, 0, 0)
    return Qt.rect(p.x, p.y, item.width, item.height)
  }
  function mapFromItem(item, x, y) { return surfaceItem.mapFromItem(item, x, y) }

  readonly property real _screenW: Stage.screen ? Stage.screen.width : 0
  readonly property real _screenH: Stage.screen ? Stage.screen.height : 0
  readonly property var _area: {
    var r = Stage.reserved
    if (win.exclusionMode === ExclusionMode.Ignore || win.exclusiveZone > 0) return { x: 0, y: 0, w: _screenW, h: _screenH }
    return { x: r.left, y: r.top, w: _screenW - r.left - r.right, h: _screenH - r.top - r.bottom }
  }

  // The edge an exclusive zone reserves: the one it's anchored to alone.
  readonly property string _zoneEdge: {
    var a = anchors
    if (a.top && !a.bottom) return "top"
    if (a.bottom && !a.top) return "bottom"
    if (a.left && !a.right) return "left"
    if (a.right && !a.left) return "right"
    return ""
  }
  onExclusiveZoneChanged: Stage.reserve(win, _zoneEdge, visible ? exclusiveZone : 0)
  on_ZoneEdgeChanged: Stage.reserve(win, _zoneEdge, visible ? exclusiveZone : 0)
  onVisibleChanged: Stage.reserve(win, _zoneEdge, visible ? exclusiveZone : 0)

  property Item _surface: Item {
    id: surfaceItem
    readonly property var stageWindow: win
    parent: Stage.layer(win.wlr_layer)
    visible: win.visible
    clip: true

    x: {
      var a = win.anchors, m = win.margins, area = win._area
      if (a.left) return area.x + m.left
      if (a.right) return area.x + area.w - width - m.right
      return area.x + (area.w - width) / 2
    }
    y: {
      var a = win.anchors, m = win.margins, area = win._area
      if (a.top) return area.y + m.top
      if (a.bottom) return area.y + area.h - height - m.bottom
      return area.y + (area.h - height) / 2
    }
    width: {
      var a = win.anchors, m = win.margins
      if (a.left && a.right) return Math.max(0, win._area.w - m.left - m.right)
      return win.implicitWidth
    }
    height: {
      var a = win.anchors, m = win.margins
      if (a.top && a.bottom) return Math.max(0, win._area.h - m.top - m.bottom)
      return win.implicitHeight
    }

    Rectangle {
      anchors.fill: parent
      z: -1000000
      color: win.color
    }
  }

  Component.onCompleted: Stage.reserve(win, _zoneEdge, visible ? exclusiveZone : 0)
  Component.onDestruction: Stage.reserve(win, "", 0)
}
