pragma Singleton
import QtQuick
import Quickshell

// Stands in for Quickshell.Services.UPower's PerformanceDegradationReason:
// the same values in the same order as the real enum.
Singleton {
  enum Enum { None, LapDetected, HighTemperature }

  readonly property var names: ["None", "LapDetected", "HighTemperature"]

  function toString(reason) {
    var i = Number(reason)
    return i >= 0 && i < names.length ? names[i] : "Invalid PerformanceDegradationReason"
  }
}
