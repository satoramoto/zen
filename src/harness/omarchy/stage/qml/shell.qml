import QtQuick
import QtQuick.Window
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import QtTest
import qs.Commons
import qs.Commons as Commons
import qs.Ui as Ui
import qs.stage
import "stage/config.js" as StageConfig

// The stage: one plugin, headless, on a screen-sized window that Qt draws
// exactly as it would draw the bar. The bar strip and every window the
// plugin opens are stand-ins on this one window; their contents are the
// plugin's QML and Omarchy's kit. The server drives it over a Unix socket:
// it asks for frames, sends pointer and keys through QtTest (real Qt input
// events), and reads back what is on screen.
ShellRoot {
  id: host

  readonly property var config: StageConfig.config
  readonly property var plugin: config.plugin || {}
  property var instances: ({})
  property var errors: []
  property var client: null
  property var activePopout: null
  property var lastCard: null
  property var widget: null
  property bool loaded: false
  property var readyWaiters: []

  // ------------------------------------------------------------ the screen

  Window {
    id: screenWindow
    width: host.config.screen.width
    height: host.config.screen.height
    visible: true
    color: host.config.desktop || Commons.Color.background
    title: "Omarchy stage"

    Item {
      id: screenItem
      anchors.fill: parent

      // Opaque, so a frame is what the screen shows, not the window's alpha.
      Rectangle { anchors.fill: parent; color: screenWindow.color }

      Item { id: layerBackground; anchors.fill: parent }
      Item { id: layerBottom; anchors.fill: parent }
      Item { id: layerTop; anchors.fill: parent }
      Item { id: layerOverlay; anchors.fill: parent }
    }

    TestCase {
      id: input
      name: "stage"
      when: false
      visible: false
    }

    onFrameSwapped: host.frameSwapped()
  }

  Component.onCompleted: {
    Stage.screen = screenItem
    Stage.layers = [layerBackground, layerBottom, layerTop, layerOverlay]
    Stage.config = host.config
    Stage.services = host.config.services || {}
    Qt.callLater(host.loadEntries)
  }

  Connections {
    target: Stage
    function onReported(event) { host.send({ event: "report", report: event }) }
  }

  // --------------------------------------------------------------- the bar

  StagePanelWindow {
    id: barWindow
    anchors { top: true; left: true; right: true }
    implicitHeight: Style.bar.sizeHorizontal
    exclusiveZone: implicitHeight
    color: Commons.Color.bar.background
    wlr_layer: WlrLayer.Top
    wlr_namespace: "omarchy-bar"
    visible: (host.plugin.entries || []).some(function(e) { return e.role === "barWidget" })

    Item {
      id: widgetSlot
      objectName: "stage-bar-slot"
      readonly property string section: host.plugin.section || "left"
      readonly property real inset: Style.space(12)
      height: parent.height
      width: host.widget ? host.widget.implicitWidth : 0
      x: section === "right" ? parent.width - width - inset
        : section === "center" ? (parent.width - width) / 2 : inset
    }
  }

  Ui.PluginBarApi {
    id: barApi
    pluginId: "bar-entry:" + (host.plugin.id || "")
    moduleName: host.plugin.id || ""
    shell: shellApi
    foreground: Commons.Color.bar.text
    barForeground: Commons.Color.bar.text
    background: Commons.Color.bar.background
    urgent: Commons.Color.bar.active
    fontFamily: Style.font.family
    position: "top"
    vertical: false
    barSize: Style.bar.sizeHorizontal
    _showTooltip: function(target, text) { Stage.report("tooltip", { text: String(text) }) }
    _hideTooltip: function(target) {}
    _registerClickTarget: function(target) { barApi.clickTargets = barApi.clickTargets.concat([target]) }
    _unregisterClickTarget: function(target) { barApi.clickTargets = barApi.clickTargets.filter(function(t) { return t !== target }) }
    _requestPopout: function(owner) { barApi.activePopout = owner }
    _releasePopout: function(owner) { if (barApi.activePopout === owner) barApi.activePopout = null }
    _notePopoutCard: function(card) { host.lastCard = card }
    _popoutCardFor: function(owner) { return host.lastCard }
    _switchPanelFrom: function(owner, direction) { return false }
    _targetBelongsToWindow: function(target, window) { return Stage.windowOf(target) === window }
    _moduleWidgets: function(id) { return host.widget ? [host.widget] : [] }
    _run: function(command) {
      Stage.report("bar-run", { command: String(command) })
      Quickshell.execDetached(["sh", "-c", String(command)])
    }
    _setCenterHoverRevealSuppressed: function(value) {}
  }

  // Omarchy's own shell API for plugins, with the host's hooks reported to
  // the story instead of opening other plugins.
  property var shellApi: null
  Component {
    id: shellApiComponent
    QtObject {
      property string pluginId: host.plugin.id || ""
      property var bar: barApi
      property var barConfig: ({})
      property var idleConfig: ({})
      property var appLibrary: null
      function serviceFor(id) { return host.instances[String(id)] || null }
      function firstPartyServiceFor(id) { return null }
      function pluginShellForBarEntry(ownerId, moduleName) { return this }
      function summon(id, payloadJson) { Stage.report("shell", { summon: String(id), payload: payloadJson || null }); return true }
      function hide(id) { Stage.report("shell", { hide: String(id) }); return true }
      function toggle(id, payloadJson) { Stage.report("shell", { toggle: String(id), payload: payloadJson || null }); return true }
      function isPluginOpen(id) { return false }
      function updateEntryInline(id, settings) { Stage.report("shell", { updateEntryInline: String(id), settings: settings }); return true }
      function mutateShellConfig(mutator) { Stage.report("shell", { mutateShellConfig: true }); return false }
    }
  }

  // ------------------------------------------------------------ the plugin

  function inject(item, role) {
    if (!item) return
    if ("omarchyPath" in item) item.omarchyPath = host.config.omarchyPath
    if ("shell" in item) item.shell = host.shellApi
    if ("manifest" in item) item.manifest = host.plugin.manifest || null
    if ("fixedEdge" in item) item.fixedEdge = widgetSlot.section
    if ("bar" in item && role === "barWidget") item.bar = barApi
    if ("moduleName" in item) item.moduleName = host.plugin.id || ""
    if ("settings" in item) item.settings = host.plugin.settings || ({})
  }

  function create(role, url, parent) {
    var component = Qt.createComponent(url, Component.PreferSynchronous)
    if (component.status !== Component.Ready) {
      host.errors = host.errors.concat([role + ": " + component.errorString()])
      return null
    }
    var item = component.createObject(parent)
    if (!item) {
      host.errors = host.errors.concat([role + ": " + url + " could not be created"])
      return null
    }
    host.inject(item, role)
    Qt.callLater(function() { host.inject(item, role) })
    var next = Object.assign({}, host.instances)
    next[role] = item
    host.instances = next
    return item
  }

  function loadEntries() {
    host.shellApi = shellApiComponent.createObject(host)
    var entries = host.plugin.entries || []
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i]
      if (e.role === "barWidget") {
        host.widget = host.create("barWidget", e.url, widgetSlot)
        if (host.widget) {
          host.widget.height = Qt.binding(function() { return widgetSlot.height })
          host.widget.width = Qt.binding(function() { return widgetSlot.width })
        }
      } else {
        // Services, menus and panels open their own windows: no visual parent.
        host.create(e.role, e.url, null)
      }
    }
    screenWindow.requestActivate()
    host.loaded = true
    var waiters = host.readyWaiters
    host.readyWaiters = []
    for (var w = 0; w < waiters.length; w++) waiters[w]()
  }

  // ---------------------------------------------------------------- frames

  property int frameNo: 0
  property bool grabbing: false
  property bool grabWanted: false
  property var grabWaiters: []

  function frameSwapped() {
    if (host.grabbing) return
    if (!grabTimer.running) grabTimer.start()
  }

  Timer {
    id: grabTimer
    interval: 16
    onTriggered: host.grab()
  }

  function grab(waiter) {
    if (waiter) host.grabWaiters = host.grabWaiters.concat([waiter])
    if (host.grabbing) { host.grabWanted = true; return }
    host.grabbing = true
    var n = ++host.frameNo
    var path = host.config.frames + "/" + n + ".png"
    var started = screenWindow.contentItem.grabToImage(function(result) {
      var saved = result.saveToFile(path)
      host.grabbing = false
      host.send({ event: "frame", n: n, path: path, saved: saved })
      var waiters = host.grabWaiters
      host.grabWaiters = []
      for (var i = 0; i < waiters.length; i++) waiters[i](n)
      if (host.grabWanted) { host.grabWanted = false; grabTimer.start() }
    })
    if (!started) {
      host.grabbing = false
      host.send({ event: "frame", n: n, path: path, saved: false })
    }
  }

  // ------------------------------------------------------- finding things

  function effectivelyShown(item) {
    if (!item || !item.visible) return false
    for (var p = item; p; p = p.parent) {
      if (p.opacity !== undefined && p.opacity <= 0.01) return false
    }
    var r = host.rectOf(item)
    if (r.width <= 0 || r.height <= 0) return false
    // Outside the screen, or scrolled out of a clipping ancestor.
    var clip = { x: 0, y: 0, width: screenWindow.width, height: screenWindow.height }
    for (var q = item.parent; q; q = q.parent) {
      if (q.clip) {
        var c = host.rectOf(q)
        clip = host.intersect(clip, c)
      }
    }
    var shown = host.intersect(clip, r)
    return shown.width > 0 && shown.height > 0
  }

  function rectOf(item) {
    var p = item.mapToItem(screenWindow.contentItem, 0, 0)
    return { x: p.x, y: p.y, width: item.width, height: item.height }
  }

  function intersect(a, b) {
    var x = Math.max(a.x, b.x), y = Math.max(a.y, b.y)
    var r = Math.min(a.x + a.width, b.x + b.width), bt = Math.min(a.y + a.height, b.y + b.height)
    return { x: x, y: y, width: Math.max(0, r - x), height: Math.max(0, bt - y) }
  }

  function walk(item, fn) {
    if (!item) return
    fn(item)
    var kids = item.children
    for (var i = 0; kids && i < kids.length; i++) host.walk(kids[i], fn)
  }

  function isAncestor(a, b) {
    for (var p = b.parent; p; p = p.parent) if (p === a) return true
    return false
  }

  function textOf(item) {
    return typeof item.text === "string" ? item.text : ""
  }

  function isTextItem(item) {
    return typeof item.text === "string" && (item.elide !== undefined || item.cursorPosition !== undefined)
  }

  // An item's QML type, as Qt names it: "Canvas" matches QQuickCanvasItem, "Sparkline" a Sparkline.qml.
  function typeOf(item) {
    return String(item).split("(")[0].replace(/_QMLTYPE_\d+$/, "").replace(/^QQuick/, "").replace(/Item$/, "")
  }

  function matches(item, spec) {
    if (spec.type !== undefined && host.typeOf(item) !== spec.type) return false
    if (spec.type !== undefined && spec.name === undefined && spec.text === undefined && spec.textContains === undefined && spec.placeholder === undefined) return true
    if (spec.name !== undefined) return item.objectName === spec.name
    if (spec.placeholder !== undefined) return item.placeholderText === spec.placeholder
    if (spec.text !== undefined) return host.textOf(item) === spec.text
    if (spec.textContains !== undefined) return host.textOf(item).indexOf(spec.textContains) !== -1
    return false
  }

  // Every shown item matching spec, outermost kept where one holds another
  // (a button and the label inside it are one control).
  function findAll(spec, root) {
    var found = []
    host.walk(root || screenWindow.contentItem, function(item) {
      if (item !== screenWindow.contentItem && host.matches(item, spec) && host.effectivelyShown(item)) found.push(item)
    })
    var outer = found.filter(function(item) {
      for (var i = 0; i < found.length; i++) if (found[i] !== item && host.isAncestor(found[i], item)) return false
      return true
    })
    outer.sort(function(a, b) {
      var ra = host.rectOf(a), rb = host.rectOf(b)
      return Math.abs(ra.y - rb.y) > 2 ? ra.y - rb.y : ra.x - rb.x
    })
    return outer
  }

  function describe(item) {
    var r = host.rectOf(item)
    return {
      name: item.objectName || "",
      type: host.typeOf(item),
      text: host.textOf(item),
      x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height),
      enabled: item.enabled !== false,
      checked: item.checked === undefined ? null : !!item.checked,
      focused: !!item.activeFocus,
      value: item.value === undefined ? null : item.value,
    }
  }

  // Every shown match, looking only inside `within` when the spec gives one.
  function scoped(spec) {
    var scope = null
    if (spec.within) {
      var scopes = host.scoped(spec.within)
      if (!scopes.length) throw new Error("nothing shown matches " + JSON.stringify(spec.within))
      scope = scopes[spec.within.index || 0]
    }
    return host.findAll(spec, scope)
  }

  function find(spec) {
    var all = host.scoped(spec)
    var label = JSON.stringify(spec)
    if (!all.length) throw new Error("nothing shown matches " + label)
    if (spec.index !== undefined) {
      if (spec.index >= all.length) throw new Error(label + ": only " + all.length + " shown")
      return all[spec.index]
    }
    if (all.length > 1) {
      throw new Error(label + " matches " + all.length + " things on screen: "
        + all.map(function(i) { var d = host.describe(i); return "(" + d.x + "," + d.y + ")" }).join(", ")
        + "; give an index or a within")
    }
    return all[0]
  }

  function enabledChain(item) {
    for (var p = item; p; p = p.parent) if (p.enabled === false) return false
    return true
  }

  // -------------------------------------------------------------- input

  readonly property var keys: ({
    Escape: Qt.Key_Escape, Enter: Qt.Key_Return, Return: Qt.Key_Return, Tab: Qt.Key_Tab,
    Backtab: Qt.Key_Backtab, Space: Qt.Key_Space, " ": Qt.Key_Space, Backspace: Qt.Key_Backspace,
    Delete: Qt.Key_Delete, Up: Qt.Key_Up, Down: Qt.Key_Down, Left: Qt.Key_Left, Right: Qt.Key_Right,
    ArrowUp: Qt.Key_Up, ArrowDown: Qt.Key_Down, ArrowLeft: Qt.Key_Left, ArrowRight: Qt.Key_Right,
    Home: Qt.Key_Home, End: Qt.Key_End, PageUp: Qt.Key_PageUp, PageDown: Qt.Key_PageDown,
    F1: Qt.Key_F1, F2: Qt.Key_F2, F3: Qt.Key_F3, F4: Qt.Key_F4, F5: Qt.Key_F5, F6: Qt.Key_F6,
    F7: Qt.Key_F7, F8: Qt.Key_F8, F9: Qt.Key_F9, F10: Qt.Key_F10, F11: Qt.Key_F11, F12: Qt.Key_F12,
    Control: Qt.Key_Control, Shift: Qt.Key_Shift, Alt: Qt.Key_Alt, Meta: Qt.Key_Meta, Super: Qt.Key_Super_L
  })

  function modifiers(list) {
    var m = Qt.NoModifier
    var names = list || []
    for (var i = 0; i < names.length; i++) {
      var n = String(names[i]).toLowerCase()
      if (n === "ctrl" || n === "control") m |= Qt.ControlModifier
      else if (n === "shift") m |= Qt.ShiftModifier
      else if (n === "alt") m |= Qt.AltModifier
      else if (n === "meta" || n === "super") m |= Qt.MetaModifier
    }
    return m
  }

  function button(name) {
    return name === "right" ? Qt.RightButton : name === "middle" ? Qt.MiddleButton : Qt.LeftButton
  }

  function printable(ch) {
    var c = ch.charCodeAt(0)
    return ch.length === 1 && c >= 0x20 && c <= 0x7e
  }

  // One key, a name from `keys` or a single character. QtTest aborts on a
  // character outside ASCII, so those go into the focused field directly.
  function keyAction(kind, key, mods) {
    screenWindow.requestActivate()
    var m = host.modifiers(mods)
    var code = host.keys[key]
    if (code !== undefined) {
      if (kind === "press") input.keyPress(code, m)
      else if (kind === "release") input.keyRelease(code, m)
      else input.keyClick(code, m)
      return
    }
    var ch = String(key)
    if (host.printable(ch)) {
      if (kind === "press") input.keyPress(ch, m)
      else if (kind === "release") input.keyRelease(ch, m)
      else input.keyClick(ch, m)
      return
    }
    if (kind === "release") return
    var f = screenWindow.activeFocusItem
    if (f && typeof f.insert === "function") f.insert(f.cursorPosition, ch)
    else throw new Error("no focused field to put " + JSON.stringify(ch) + " in")
  }

  function center(item, at) {
    var r = host.rectOf(item)
    if (at) return { x: r.x + at.x, y: r.y + at.y }
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }

  function clickAt(p, btn, mods, double) {
    var target = screenWindow.contentItem
    input.mouseMove(target, p.x, p.y)
    if (double) input.mouseDoubleClickSequence(target, p.x, p.y, host.button(btn), host.modifiers(mods))
    else input.mouseClick(target, p.x, p.y, host.button(btn), host.modifiers(mods))
  }

  // ------------------------------------------------------------ requests

  function send(message) {
    if (!host.client) return
    host.client.write(JSON.stringify(message) + "\n")
    host.client.flush()
  }

  function reply(id, result) { host.send({ id: id, ok: true, result: result === undefined ? null : result }) }
  function fail(id, error) { host.send({ id: id, ok: false, error: String(error && error.message ? error.message : error) }) }

  function handle(line) {
    var req
    try { req = JSON.parse(line) } catch (e) { return }
    var id = req.id
    try {
      switch (req.op) {
      case "ready": {
        var answer = function() { host.reply(id, { errors: host.errors }) }
        if (host.loaded) answer()
        else host.readyWaiters = host.readyWaiters.concat([answer])
        return
      }
      case "frame":
        return host.grab(function(n) { host.reply(id, { n: n }) })
      case "find": {
        var found
        try { found = host.scoped(req.target) } catch (e) { found = [] }
        return host.reply(id, found.map(host.describe))
      }
      case "click": {
        var item = host.find(req.target)
        if (!host.enabledChain(item)) throw new Error(JSON.stringify(req.target) + " is disabled")
        host.clickAt(host.center(item, req.at), req.button, req.modifiers, req.double)
        return host.reply(id, host.describe(item))
      }
      case "hover": {
        var h = host.find(req.target)
        var hp = host.center(h, req.at)
        input.mouseMove(screenWindow.contentItem, hp.x, hp.y)
        return host.reply(id, host.describe(h))
      }
      case "type": {
        var field = host.find(req.target)
        if (!host.enabledChain(field)) throw new Error(JSON.stringify(req.target) + " is disabled")
        host.clickAt(host.center(field), "left", [])
        if (!req.append) input.keyClick(Qt.Key_A, Qt.ControlModifier)
        var text = String(req.text)
        if (!req.append && text === "") input.keyClick(Qt.Key_Backspace)
        for (var i = 0; i < text.length; i++) host.keyAction("click", text[i], [])
        return host.reply(id, host.describe(field))
      }
      case "key":
        host.keyAction(req.kind || "click", req.key, req.modifiers)
        return host.reply(id, null)
      case "pointer": {
        var t = screenWindow.contentItem
        var b = host.button(req.button)
        var mm = host.modifiers(req.modifiers)
        if (req.kind === "move") input.mouseMove(t, req.x, req.y, -1, req.buttons ? b : Qt.NoButton)
        else if (req.kind === "press") input.mousePress(t, req.x, req.y, b, mm)
        else if (req.kind === "release") input.mouseRelease(t, req.x, req.y, b, mm)
        else if (req.kind === "wheel") input.mouseWheel(t, req.x, req.y, req.dx || 0, req.dy || 0, Qt.NoButton, mm)
        else if (req.kind === "double") input.mouseDoubleClickSequence(t, req.x, req.y, b, mm)
        return host.reply(id, null)
      }
      case "texts": {
        var out = []
        host.walk(screenWindow.contentItem, function(item) {
          if (host.isTextItem(item) && item.text !== "" && host.effectivelyShown(item)) {
            var d = host.describe(item)
            out.push({ text: item.text, x: d.x, y: d.y, width: d.width, height: d.height, name: d.name })
          }
        })
        out.sort(function(a, b) { return Math.abs(a.y - b.y) > 2 ? a.y - b.y : a.x - b.x })
        return host.reply(id, out)
      }
      case "inspect": {
        var it = host.find(req.target)
        var props = req.props || []
        var values = host.describe(it)
        for (var k = 0; k < props.length; k++) {
          var v = it[props[k]]
          values[props[k]] = (v !== null && typeof v === "object") ? String(v) : v
        }
        return host.reply(id, values)
      }
      case "focused": {
        var f = screenWindow.activeFocusItem
        return host.reply(id, f ? host.describe(f) : null)
      }
      case "services": {
        var next = Object.assign({}, Stage.services)
        var state = req.state || {}
        for (var s in state) next[s] = state[s]
        Stage.services = next
        return host.reply(id, null)
      }
      case "shortcut": {
        var hit = Stage.shortcuts.filter(function(sc) { return sc.name === req.name && (!req.appid || sc.appid === req.appid) })
        if (!hit.length) throw new Error("no GlobalShortcut named " + req.name)
        hit[0].pressed()
        hit[0].released()
        return host.reply(id, null)
      }
      default:
        throw new Error("unknown op " + req.op)
      }
    } catch (error) {
      host.fail(id, error)
    }
  }

  SocketServer {
    active: true
    path: host.config.socket
    handler: Socket {
      id: socket
      onConnectedChanged: if (connected) host.client = socket
      parser: SplitParser {
        onRead: line => host.handle(line)
      }
    }
  }
}
