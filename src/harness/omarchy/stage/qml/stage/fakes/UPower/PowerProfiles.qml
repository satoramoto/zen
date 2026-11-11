pragma Singleton
import QtQuick
import Quickshell
import qs.stage

// Stands in for Quickshell.Services.UPower's PowerProfiles singleton, read
// from the fixture's `upower.powerProfiles` state:
//
//   powerProfiles: {
//     profile: 'Balanced',               // a PowerProfile name, or its number
//     hasPerformanceProfile: true,
//     degradationReason: 'None',         // a PerformanceDegradationReason name
//     holds: [ { profile: 'Performance', applicationId: 'org.gnome.Builder', reason: 'Compiling' } ],
//   }
//
// Setting `profile` asks power-profiles-daemon to switch. The fake reports it
// (`setProfile` with the profile's name) for the fixture to answer, keeps the
// new profile as the daemon would, and takes whatever profile the fixture
// pushes next as the truth.
Singleton {
  id: root

  property int profile: PowerProfile.Balanced
  readonly property bool hasPerformanceProfile: root._hasPerformanceProfile
  readonly property int degradationReason: root._degradationReason
  readonly property var holds: root._holds

  property bool _hasPerformanceProfile: true
  property int _degradationReason: PerformanceDegradationReason.None
  property var _holds: []
  property bool _applying: false

  function _enumValue(names, value, fallback) {
    if (value === undefined || value === null || value === "") return fallback
    if (typeof value === "number") return value
    var i = names.indexOf(String(value))
    return i >= 0 ? i : fallback
  }

  function apply() {
    var state = Stage.service("upower").powerProfiles || ({})
    root._applying = true
    root.profile = root._enumValue(PowerProfile.names, state.profile, PowerProfile.Balanced)
    root._applying = false
    root._hasPerformanceProfile = state.hasPerformanceProfile === undefined ? true : !!state.hasPerformanceProfile
    root._degradationReason = root._enumValue(PerformanceDegradationReason.names, state.degradationReason, PerformanceDegradationReason.None)
    var holds = Array.isArray(state.holds) ? state.holds : []
    root._holds = holds.map(function(h) {
      return {
        profile: root._enumValue(PowerProfile.names, h.profile, PowerProfile.Balanced),
        applicationId: String(h.applicationId || ""),
        reason: String(h.reason || "")
      }
    })
  }

  onProfileChanged: {
    if (root._applying) return
    Stage.serviceCall("upower", "setProfile", [PowerProfile.toString(root.profile)])
  }

  Connections {
    target: Stage
    function onServicesChanged() { root.apply() }
  }

  Component.onCompleted: apply()
}
