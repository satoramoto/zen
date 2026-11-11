pragma Singleton
import QtQuick
import Quickshell

// Stands in for Quickshell.Services.UPower's PowerProfile: the same values
// in the same order as the real enum.
Singleton {
  enum Enum { PowerSaver, Balanced, Performance }

  readonly property var names: ["PowerSaver", "Balanced", "Performance"]

  function toString(profile) {
    var i = Number(profile)
    return i >= 0 && i < names.length ? names[i] : "Invalid PowerProfile"
  }
}
