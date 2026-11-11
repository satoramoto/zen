import QtQuick

// Stands in for Quickshell.Services.Pipewire's PwNodePeakMonitor: the level
// it reads is the node's `peak` in the fixture's state, while enabled.
QtObject {
  property var node: null
  property bool enabled: true
  readonly property real peak: enabled && node ? node._stagePeak : 0
  readonly property var channels: node && node.audio ? node.audio.channels : []
  readonly property var peaks: enabled && node ? channels.map(function() { return peak }) : []
}
