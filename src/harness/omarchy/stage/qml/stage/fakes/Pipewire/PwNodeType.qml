pragma Singleton
import QtQuick
import Quickshell

// Stands in for Quickshell.Services.Pipewire's PwNodeType: the same flags, so
// `PwNodeType.AudioSink` and a node's `type` agree.
Singleton {
  enum Flag {
    Untracked = 0,
    Audio = 1,
    Video = 2,
    Stream = 4,
    Source = 8,
    Sink = 16,
    AudioSource = 9,
    AudioSink = 17,
    AudioDuplex = 25,
    AudioOutStream = 21,
    AudioInStream = 13,
    VideoSource = 10,
    VideoSink = 18
  }

  function toString(type) {
    var names = { 0: "Untracked", 9: "AudioSource", 17: "AudioSink", 25: "AudioDuplex", 21: "AudioOutStream",
      13: "AudioInStream", 10: "VideoSource", 18: "VideoSink", 1: "Audio", 2: "Video" }
    if (type === undefined) return "PwNodeType"
    return names[type] || ("PwNodeType(" + type + ")")
  }
}
