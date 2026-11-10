pragma Singleton
import QtQuick
import Quickshell
import qs.stage

// Stands in for Quickshell.Hyprland's singleton. There is no compositor on
// the stage: one monitor matches the stage's screen, and dispatches are
// reported to the story's log instead of reaching Hyprland.
Singleton {
  id: root

  readonly property var _screen: Quickshell.screens.length > 0 ? Quickshell.screens[0] : null
  readonly property var _state: Stage.service("hyprland")

  readonly property QtObject focusedMonitor: QtObject {
    readonly property string name: root._screen ? root._screen.name : "STAGE-1"
    readonly property real scale: 1
    readonly property int id: 0
    readonly property bool focused: true
    readonly property QtObject activeWorkspace: root.focusedWorkspace
    readonly property var lastIpcObject: ({ name: name, scale: 1 })
  }
  readonly property QtObject focusedWorkspace: QtObject {
    readonly property int id: root._state.workspace || 1
    readonly property string name: String(id)
    readonly property bool focused: true
    readonly property bool active: true
    readonly property QtObject monitor: root.focusedMonitor
  }
  readonly property QtObject monitors: QtObject { readonly property var values: [root.focusedMonitor] }
  readonly property QtObject workspaces: QtObject { readonly property var values: [root.focusedWorkspace] }
  readonly property QtObject toplevels: QtObject { readonly property var values: root._state.toplevels || [] }
  readonly property var activeToplevel: root._state.activeToplevel || null
  readonly property string requestSocketPath: ""
  readonly property string eventSocketPath: ""

  signal rawEvent(var event)

  function dispatch(request) { Stage.report("hyprland", { dispatch: String(request) }) }
  function refreshMonitors() {}
  function refreshWorkspaces() {}
  function refreshToplevels() {}
  function monitorFor(screen) { return root.focusedMonitor }
}
