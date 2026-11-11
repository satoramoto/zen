import QtQuick
import Quickshell
import Quickshell.Wayland

// Stands in for Quickshell's PopupWindow (an xdg-popup). It is placed where
// its anchor says, relative to the window (or item) it's anchored to, on the
// overlay layer, and slid back on screen as PopupAdjustment.Slide would.
QtObject {
  id: win

  property StagePopupAnchor anchor: StagePopupAnchor {}
  property var screen: Quickshell.screens.length > 0 ? Quickshell.screens[0] : null
  property color color: "white"
  property bool visible: false
  property real implicitWidth: 0
  property real implicitHeight: 0
  property var mask: null
  property var surfaceFormat: null

  readonly property bool backingWindowVisible: visible
  readonly property real devicePixelRatio: 1
  readonly property Item contentItem: surfaceItem
  readonly property alias width: surfaceItem.width
  readonly property alias height: surfaceItem.height

  default property alias data: surfaceItem.data

  function itemPosition(item) { return item.mapToItem(surfaceItem, 0, 0) }
  function mapFromItem(item, x, y) { return surfaceItem.mapFromItem(item, x, y) }

  property point _origin: Qt.point(0, 0)

  function _place() {
    anchor.anchoring()
    var base = anchor.item ? anchor.item : (anchor.window ? anchor.window.contentItem : null)
    var o = base && Stage.screen ? base.mapToItem(Stage.screen, 0, 0) : Qt.point(0, 0)
    var x = o.x + anchor.rect.x
    var y = o.y + anchor.rect.y
    if (anchor.edges & Edges.Bottom) y += anchor.rect.height
    if (anchor.edges & Edges.Right) x += anchor.rect.width
    if (anchor.gravity & Edges.Top) y -= implicitHeight
    if (anchor.gravity & Edges.Left) x -= implicitWidth
    var sw = Stage.screen ? Stage.screen.width : 0
    var sh = Stage.screen ? Stage.screen.height : 0
    x = Math.max(0, Math.min(x, sw - implicitWidth))
    y = Math.max(0, Math.min(y, sh - implicitHeight))
    _origin = Qt.point(x, y)
  }

  onVisibleChanged: if (visible) _place()
  onImplicitWidthChanged: if (visible) _place()
  onImplicitHeightChanged: if (visible) _place()

  property Item _surface: Item {
    id: surfaceItem
    readonly property var stageWindow: win
    parent: Stage.layer(3)
    visible: win.visible
    // A hidden window takes no input and holds no keyboard focus, as an
    // unmapped surface doesn't on a compositor.
    enabled: win.visible
    x: win._origin.x
    y: win._origin.y
    width: win.implicitWidth
    height: win.implicitHeight
    z: 1000

    Rectangle {
      anchors.fill: parent
      z: -1000000
      color: win.color
    }
  }
}
