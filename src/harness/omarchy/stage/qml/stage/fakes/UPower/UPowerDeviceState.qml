pragma Singleton
import QtQuick
import Quickshell

// Stands in for Quickshell.Services.UPower's UPowerDeviceState: the same
// values in the same order, so `UPowerDeviceState.Charging` is the number
// the real module gives, and `toString` says what the real one says.
Singleton {
  enum Enum { Unknown, Charging, Discharging, Empty, FullyCharged, PendingCharge, PendingDischarge }

  // The enum's names, by value: a fixture names a state ("Charging").
  readonly property var names: ["Unknown", "Charging", "Discharging", "Empty", "FullyCharged", "PendingCharge", "PendingDischarge"]
  readonly property var _labels: ["Unknown", "Charging", "Discharging", "Empty", "Fully Charged", "Pending Charge", "Pending Discharge"]

  function toString(status) {
    var i = Number(status)
    return i >= 0 && i < _labels.length ? _labels[i] : "Invalid Status"
  }
}
