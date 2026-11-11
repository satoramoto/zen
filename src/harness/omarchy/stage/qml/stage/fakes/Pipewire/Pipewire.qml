pragma Singleton
import QtQuick
import Quickshell
import qs.stage

// Stands in for Quickshell.Services.Pipewire's singleton. There is no PipeWire
// on the stage: the graph is the fixture's, in `Stage.service("pipewire")`:
//
//   {
//     ready: true,
//     nodes: [{ id, name, description, nickname, type: "AudioSink" | "AudioSource"
//               | "AudioOutStream" | "AudioInStream" | "VideoSource" | … | <flags>,
//               isSink, isStream,            // from type unless given
//               properties: { … },           // node.name, node.description, media.class filled in
//               audio: { volume, muted, channels, volumes } | null,
//               ready, peak }],              // peak: what a PwNodePeakMonitor reads, 0..1
//     defaultSink, defaultSource,            // a node's name (or id): Pipewire.defaultAudioSink/Source
//     configuredSink, configuredSource,      // the same for preferredDefaultAudioSink/Source
//   }
//
// Each node id keeps one PwNode for as long as the fixture lists it, updated
// in place, as Quickshell keeps a node's object until PipeWire removes it; a
// node the fixture drops is destroyed. What the plugin asks of PipeWire is
// reported as a service call for the fixture to apply and push back:
//   setVolume [id, volume], setVolumes [id, volumes], setMuted [id, muted],
//   setPreferredDefaultAudioSink [id, name], setPreferredDefaultAudioSource [id, name].
Singleton {
  id: root

  readonly property var _state: Stage.service("pipewire")
  on_StateChanged: _sync()
  Component.onCompleted: _sync()

  property var _pool: ({})
  property bool _syncing: false
  property var _defaultSink: null
  property var _defaultSource: null
  property bool _ready: false

  readonly property QtObject nodes: QtObject { property var values: [] }
  readonly property QtObject links: QtObject { readonly property var values: [] }
  readonly property QtObject linkGroups: QtObject { readonly property var values: [] }

  readonly property var defaultAudioSink: _defaultSink
  readonly property var defaultAudioSource: _defaultSource
  property var preferredDefaultAudioSink: null
  property var preferredDefaultAudioSource: null
  readonly property bool ready: _ready

  onPreferredDefaultAudioSinkChanged: if (!_syncing)
    Stage.serviceCall("pipewire", "setPreferredDefaultAudioSink", _ref(preferredDefaultAudioSink))
  onPreferredDefaultAudioSourceChanged: if (!_syncing)
    Stage.serviceCall("pipewire", "setPreferredDefaultAudioSource", _ref(preferredDefaultAudioSource))

  property Component _nodeComponent: Component { PwNode {} }

  function _ref(node) {
    return node ? [node.id, String(node.name)] : [null, null]
  }

  // A node by id (a number) or name (a string).
  function _find(key) {
    if (key === undefined || key === null || key === "") return null
    for (var id in _pool) {
      var node = _pool[id]
      if (typeof key === "number" ? node.id === key : node.name === String(key)) return node
    }
    return null
  }

  function _sync() {
    var s = _state || {}
    var list = s.nodes || []
    var seen = {}
    var order = []
    var changed = false
    _syncing = true
    for (var i = 0; i < list.length; i++) {
      var d = list[i] || {}
      var id = Number(d.id)
      if (seen[id]) continue
      seen[id] = true
      var node = _pool[id]
      if (!node) {
        node = _nodeComponent.createObject(root, { id: id })
        _pool[id] = node
        changed = true
      }
      node._apply(d)
      order.push(node)
    }
    var gone = []
    for (var k in _pool) {
      if (!seen[k]) {
        gone.push(_pool[k])
        delete _pool[k]
        changed = true
      }
    }
    var current = nodes.values
    if (!changed && current.length !== order.length) changed = true
    for (var j = 0; !changed && j < order.length; j++) if (current[j] !== order[j]) changed = true
    if (changed) nodes.values = order

    _defaultSink = _find(s.defaultSink)
    _defaultSource = _find(s.defaultSource)
    if ("configuredSink" in s) preferredDefaultAudioSink = _find(s.configuredSink)
    else if (preferredDefaultAudioSink && gone.indexOf(preferredDefaultAudioSink) >= 0) preferredDefaultAudioSink = null
    if ("configuredSource" in s) preferredDefaultAudioSource = _find(s.configuredSource)
    else if (preferredDefaultAudioSource && gone.indexOf(preferredDefaultAudioSource) >= 0) preferredDefaultAudioSource = null
    _ready = s.ready !== false
    _syncing = false

    for (var g = 0; g < gone.length; g++) gone[g].destroy()
  }
}
