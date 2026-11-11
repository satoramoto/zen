pragma Singleton
import QtQuick
import Quickshell

// Stands in for Quickshell.Services.Mpris's MprisLoopState.
Singleton {
  enum Enum { None = 0, Track = 1, Playlist = 2 }

  function toString(status) {
    if (status === undefined) return "MprisLoopState"
    return ["None", "Track", "Playlist"][status] || "Unknown"
  }
}
