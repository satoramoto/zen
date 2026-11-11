pragma Singleton
import QtQuick
import Quickshell
import qs.stage

// Stands in for Quickshell.Services.Mpris's singleton. There is no session bus
// with players on the stage: the players are the fixture's, in
// `Stage.service("mpris")`:
//
//   { players: [{ dbusName, identity, desktopEntry,
//                 playbackState: "Playing" | "Paused" | "Stopped",
//                 canPlay, canPause, canGoNext, canGoPrevious, canSeek, canControl, …,
//                 trackTitle, trackArtist, trackAlbum, trackArtUrl, length, position,
//                 volume, shuffle, loopState: "None" | "Track" | "Playlist", rate, metadata }] }
//
// Each player (by dbusName) keeps one MprisPlayer while the fixture lists it,
// updated in place. What the plugin asks a player to do is reported as a
// service call, `{ service: "mpris", method, args: [dbusName, …] }`: play,
// pause, togglePlaying, stop, next, previous, seek, openUri, raise, quit, and
// setPosition, setVolume, setPlaybackState, setIsPlaying, setLoopState,
// setRate, setShuffle, setFullscreen for what it writes.
Singleton {
  id: root

  readonly property var _state: Stage.service("mpris")
  on_StateChanged: _sync()
  Component.onCompleted: _sync()

  property var _pool: ({})
  readonly property QtObject players: QtObject { property var values: [] }

  property Component _playerComponent: Component { MprisPlayer {} }

  function _sync() {
    var list = (_state && _state.players) || []
    var seen = {}
    var order = []
    var changed = false
    for (var i = 0; i < list.length; i++) {
      var d = list[i] || {}
      var key = String(d.dbusName || ("org.mpris.MediaPlayer2." + String(d.identity || i).toLowerCase()))
      if (seen[key]) continue
      seen[key] = true
      var player = _pool[key]
      if (!player) {
        player = _playerComponent.createObject(root, { _key: key })
        _pool[key] = player
        changed = true
      }
      player._apply(d, key)
      order.push(player)
    }
    var gone = []
    for (var k in _pool) {
      if (!seen[k]) {
        gone.push(_pool[k])
        delete _pool[k]
        changed = true
      }
    }
    var current = players.values
    if (!changed && current.length !== order.length) changed = true
    for (var j = 0; !changed && j < order.length; j++) if (current[j] !== order[j]) changed = true
    if (changed) players.values = order
    for (var g = 0; g < gone.length; g++) gone[g].destroy()
  }
}
