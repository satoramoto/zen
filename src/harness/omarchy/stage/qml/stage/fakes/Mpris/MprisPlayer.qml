import QtQuick
import qs.stage

// Stands in for Quickshell.Services.Mpris's MprisPlayer: one player of the
// fixture's. Read-only properties are the fixture's; what Quickshell lets a
// plugin write (position, volume, playbackState, isPlaying, loopState, rate,
// shuffle, fullscreen) shows at once and is reported, as are the methods, for
// the fixture to apply and push back.
QtObject {
  id: player

  readonly property bool canControl: _d.canControl !== false
  readonly property bool canPlay: _d.canPlay !== undefined ? !!_d.canPlay : canControl
  readonly property bool canPause: _d.canPause !== undefined ? !!_d.canPause : canControl
  readonly property bool canTogglePlaying: _d.canTogglePlaying !== undefined ? !!_d.canTogglePlaying : (canPlay || canPause)
  readonly property bool canSeek: !!_d.canSeek
  readonly property bool canGoNext: !!_d.canGoNext
  readonly property bool canGoPrevious: !!_d.canGoPrevious
  readonly property bool canQuit: !!_d.canQuit
  readonly property bool canRaise: !!_d.canRaise
  readonly property bool canSetFullscreen: !!_d.canSetFullscreen
  readonly property string identity: String(_d.identity || "")
  readonly property string desktopEntry: String(_d.desktopEntry || "")
  readonly property string dbusName: _key

  property real position: 0
  readonly property bool positionSupported: _d.positionSupported !== undefined ? !!_d.positionSupported : _d.position !== undefined
  readonly property real length: Number(_d.length || 0)
  readonly property bool lengthSupported: _d.length !== undefined
  property real volume: 1
  readonly property bool volumeSupported: _d.volume !== undefined
  readonly property var metadata: _d.metadata || ({})
  readonly property int uniqueId: Number(_d.uniqueId || 0)
  readonly property string trackTitle: String(_d.trackTitle || "")
  readonly property string trackArtist: String(_d.trackArtist || "")
  readonly property string trackArtists: trackArtist
  readonly property string trackAlbum: String(_d.trackAlbum || "")
  readonly property string trackAlbumArtist: String(_d.trackAlbumArtist || "")
  readonly property string trackArtUrl: String(_d.trackArtUrl || "")
  // MprisPlaybackState: Stopped 0, Playing 1, Paused 2.
  property int playbackState: 0
  property bool isPlaying: false
  // MprisLoopState: None 0, Track 1, Playlist 2.
  property int loopState: 0
  readonly property bool loopSupported: _d.loopState !== undefined
  property real rate: 1
  readonly property real minRate: Number(_d.minRate === undefined ? 1 : _d.minRate)
  readonly property real maxRate: Number(_d.maxRate === undefined ? 1 : _d.maxRate)
  property bool shuffle: false
  readonly property bool shuffleSupported: _d.shuffle !== undefined
  property bool fullscreen: false
  readonly property var supportedUriSchemes: _d.supportedUriSchemes || []
  readonly property var supportedMimeTypes: _d.supportedMimeTypes || []

  signal trackChanged()
  signal postTrackChanged()
  signal ready()

  property string _key: ""
  property var _d: ({})
  property bool _syncing: false
  // Writes count only once the fixture has filled the player in.
  property bool _live: false

  readonly property var _states: ({ Stopped: 0, Playing: 1, Paused: 2 })
  readonly property var _loops: ({ None: 0, Track: 1, Playlist: 2 })

  function _call(method, args) { Stage.serviceCall("mpris", method, [player._key].concat(args || [])) }

  onPositionChanged: if (_live && !_syncing) _call("setPosition", [position])
  onVolumeChanged: if (_live && !_syncing) _call("setVolume", [volume])
  onPlaybackStateChanged: if (_live && !_syncing) {
    _syncing = true
    isPlaying = playbackState === 1
    _syncing = false
    _call("setPlaybackState", [playbackState])
  }
  onIsPlayingChanged: if (_live && !_syncing) {
    _syncing = true
    playbackState = isPlaying ? 1 : 2
    _syncing = false
    _call("setIsPlaying", [isPlaying])
  }
  onLoopStateChanged: if (_live && !_syncing) _call("setLoopState", [loopState])
  onRateChanged: if (_live && !_syncing) _call("setRate", [rate])
  onShuffleChanged: if (_live && !_syncing) _call("setShuffle", [shuffle])
  onFullscreenChanged: if (_live && !_syncing) _call("setFullscreen", [fullscreen])

  function raise() { _call("raise") }
  function quit() { _call("quit") }
  function openUri(uri) { _call("openUri", [String(uri)]) }
  function next() { _call("next") }
  function previous() { _call("previous") }
  function seek(offset) { _call("seek", [Number(offset)]) }
  function play() { _call("play") }
  function pause() { _call("pause") }
  function stop() { _call("stop") }
  function togglePlaying() { _call("togglePlaying") }

  function _apply(d, key) {
    var track = String(d.trackTitle || "") + "\n" + String(d.trackArtist || "") + "\n" + String(d.trackAlbum || "")
    var before = String(_d.trackTitle || "") + "\n" + String(_d.trackArtist || "") + "\n" + String(_d.trackAlbum || "")
    var first = _key === "" || Object.keys(_d).length === 0
    _syncing = true
    _key = key
    _d = d
    var stateName = d.playbackState !== undefined ? d.playbackState : (d.isPlaying ? "Playing" : "Stopped")
    playbackState = typeof stateName === "number" ? stateName : (_states[String(stateName)] || 0)
    isPlaying = playbackState === 1
    loopState = typeof d.loopState === "number" ? d.loopState : (_loops[String(d.loopState || "None")] || 0)
    position = Number(d.position || 0)
    volume = d.volume === undefined ? 1 : Number(d.volume)
    rate = d.rate === undefined ? 1 : Number(d.rate)
    shuffle = !!d.shuffle
    fullscreen = !!d.fullscreen
    _syncing = false
    _live = true
    if (first) ready()
    else if (track !== before) { trackChanged(); postTrackChanged() }
  }
}
