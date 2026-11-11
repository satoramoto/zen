import QtQuick
import Quickshell

// A PopupWindow's `anchor` group.
QtObject {
  property var window: null
  property Item item: null
  property StageRect rect: StageRect {}
  property int edges: Edges.Top | Edges.Left
  property int gravity: Edges.Bottom | Edges.Right
  property int adjustment: PopupAdjustment.None
  signal anchoring()
}
