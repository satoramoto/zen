pragma Singleton
import QtQuick
import Quickshell

// Stands in for Quickshell.Services.Mpris's MprisPlaybackState.
Singleton {
  enum Enum { Stopped = 0, Playing = 1, Paused = 2 }

  function toString(status) {
    if (status === undefined) return "MprisPlaybackState"
    return ["Stopped", "Playing", "Paused"][status] || "Unknown"
  }
}
