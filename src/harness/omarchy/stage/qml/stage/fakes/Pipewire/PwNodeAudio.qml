import QtQuick
import qs.stage

// Stands in for Quickshell.Services.Pipewire's PwNodeAudio. Its values are the
// fixture's. When the plugin sets `volume`, `volumes` or `muted`, the new value
// shows at once, as Quickshell's does, and the fixture hears it as a service
// call (setVolume, setVolumes, setMuted) to apply and push back; a fixture
// that refuses pushes the old value back.
QtObject {
  id: audio

  property bool muted: false
  property real volume: 0
  // PwAudioChannel values, as numbers (FrontLeft 4, FrontRight 5, Mono 2).
  property var channels: [4, 5]
  property var volumes: [0, 0]

  property int _nodeId: 0
  property bool _syncing: false
  // Writes count only once the fixture has filled the object in: making it is not the plugin asking.
  property bool _live: false

  onMutedChanged: if (_live && !_syncing) Stage.serviceCall("pipewire", "setMuted", [_nodeId, muted])
  onVolumeChanged: if (_live && !_syncing) {
    _syncing = true
    volumes = channels.map(function() { return audio.volume })
    _syncing = false
    Stage.serviceCall("pipewire", "setVolume", [_nodeId, volume])
  }
  onVolumesChanged: if (_live && !_syncing) {
    var list = volumes || []
    var sum = 0
    for (var i = 0; i < list.length; i++) sum += Number(list[i])
    _syncing = true
    volume = list.length ? sum / list.length : 0
    _syncing = false
    Stage.serviceCall("pipewire", "setVolumes", [_nodeId, list])
  }

  function _apply(d) {
    _syncing = true
    var ch = d.channels || [4, 5]
    channels = ch
    var v = Number(d.volume || 0)
    volumes = d.volumes || ch.map(function() { return v })
    volume = d.volumes ? volumes.reduce(function(a, b) { return a + Number(b) }, 0) / Math.max(1, volumes.length) : v
    muted = !!d.muted
    _syncing = false
    _live = true
  }
}
