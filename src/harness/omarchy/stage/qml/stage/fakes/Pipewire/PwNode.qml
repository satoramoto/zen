import QtQuick
import qs.stage

// Stands in for Quickshell.Services.Pipewire's PwNode: one node of the
// fixture's graph. The Pipewire fake makes one per node id and fills it from
// the fixture's state; as in Quickshell, everything here is read-only to the
// plugin except through `audio`.
QtObject {
  id: node

  // Set once by the Pipewire fake when it makes the node.
  property int id: 0
  readonly property string name: _name
  readonly property string description: _description
  readonly property string nickname: _nickname
  readonly property bool isSink: _isSink
  readonly property bool isStream: _isStream
  // PwNodeType flags, as a number.
  readonly property int type: _type
  readonly property var properties: _properties
  readonly property var audio: _audio
  readonly property bool ready: _ready

  // What a PwNodePeakMonitor on this node reads.
  property real _stagePeak: 0

  property string _name: ""
  property string _description: ""
  property string _nickname: ""
  property bool _isSink: false
  property bool _isStream: false
  property int _type: 0
  property var _properties: ({})
  property var _audio: null
  property bool _ready: true

  readonly property var _flags: ({
    Untracked: 0, Audio: 1, Video: 2, Stream: 4, Source: 8, Sink: 16,
    AudioSource: 9, AudioSink: 17, AudioDuplex: 25, AudioOutStream: 21, AudioInStream: 13,
    VideoSource: 10, VideoSink: 18
  })
  readonly property var _mediaClass: ({
    "9": "Audio/Source", "17": "Audio/Sink", "25": "Audio/Duplex",
    "21": "Stream/Output/Audio", "13": "Stream/Input/Audio",
    "10": "Video/Source", "18": "Video/Sink"
  })

  property Component _audioComponent: Component { PwNodeAudio {} }

  function _apply(d) {
    var type = typeof d.type === "number" ? d.type : (_flags[String(d.type || "Untracked")] || 0)
    _name = String(d.name || "")
    _description = String(d.description || "")
    _nickname = String(d.nickname || "")
    _type = type
    _isSink = d.isSink !== undefined ? !!d.isSink : (type & 16) !== 0
    _isStream = d.isStream !== undefined ? !!d.isStream : (type & 4) !== 0
    _ready = d.ready !== false
    _stagePeak = Number(d.peak || 0)

    var props = Object.assign({}, d.properties || {})
    if (props["node.name"] === undefined && _name) props["node.name"] = _name
    if (props["node.description"] === undefined && _description) props["node.description"] = _description
    if (props["node.nick"] === undefined && _nickname) props["node.nick"] = _nickname
    if (props["media.class"] === undefined && _mediaClass[String(type)]) props["media.class"] = _mediaClass[String(type)]
    _properties = props

    // Quickshell gives audio controls to audio nodes; `audio: null` is a node
    // it can't type (a virtual source), which has none.
    var wantsAudio = d.audio === null ? false : (d.audio !== undefined || (type & 1) !== 0)
    if (!wantsAudio) {
      if (_audio) { var old = _audio; _audio = null; old.destroy() }
      return
    }
    if (!_audio) _audio = _audioComponent.createObject(node, { _nodeId: node.id })
    _audio._apply(d.audio || {})
  }
}
