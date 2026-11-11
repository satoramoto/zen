pragma Singleton
import QtQuick
import Quickshell

// The stage's one shared object. Window stand-ins put their surface on the
// screen through it, Omarchy code that asks for an item's window
// (`item.QsWindow.window`, rewritten to `Stage.windowOf(item)`) gets the
// stand-in that holds it, and the fakes read their state from `services`.
Singleton {
  id: stage

  // Set by shell.qml once the screen exists.
  property Item screen: null
  property var layers: []
  property var config: ({})

  // State the fixture gives the fake services, by service name. A fake binds
  // to it (`Stage.services.upower`) and calls `Stage.serviceCall` for what it
  // is asked to do, so the fixture hears of it.
  property var services: ({})

  // Every GlobalShortcut a plugin declared, for `stage.shortcut(appid, name)`.
  property var shortcuts: []

  // Every event a fake or the host reports. shell.qml sends them to the
  // server, which logs them beside the commands the plugin ran.
  signal reported(var event)

  function report(kind, data) {
    reported({ kind: kind, data: data === undefined ? null : data })
  }

  function service(name) {
    var all = services || {}
    return all[name] || {}
  }

  function serviceCall(name, method, args) {
    report("service", { service: name, method: method, args: args === undefined ? [] : args })
  }

  // The window stand-in whose surface holds `item`, or null.
  function windowOf(item) {
    var p = item
    while (p) {
      if (p.stageWindow) return p.stageWindow
      p = p.parent
    }
    return null
  }

  // Layer-shell layers, back to front: Background, Bottom, Top, Overlay.
  function layer(index) {
    var i = Math.max(0, Math.min(layers.length - 1, Number(index) || 0))
    return layers.length ? layers[i] : screen
  }

  // Edges other windows reserve (a bar's exclusive zone), so a window that
  // doesn't ignore them is placed inside what's left, as layer-shell does.
  property var reserved: ({ top: 0, bottom: 0, left: 0, right: 0 })
  property var _zones: []

  function reserve(win, edge, size) {
    var next = []
    for (var i = 0; i < _zones.length; i++) if (_zones[i].win !== win) next.push(_zones[i])
    if (edge && size > 0) next.push({ win: win, edge: edge, size: size })
    _zones = next
    var r = { top: 0, bottom: 0, left: 0, right: 0 }
    for (var j = 0; j < next.length; j++) r[next[j].edge] += next[j].size
    reserved = r
  }
}
