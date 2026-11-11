pragma Singleton
import QtQuick
import Quickshell
import qs.stage

// Stands in for Quickshell.Services.UPower's UPower singleton. There is no
// UPower daemon on the stage: the devices and the power source are the
// fixture's `upower` service state, and change when it pushes new state.
//
//   upower: {
//     onBattery: true,
//     displayDevice: { isPresent: true, percentage: 0.8, state: 'Discharging', changeRate: 13.1, ... },
//     devices: [ { type: 'LinePower', ... }, { type: 'Battery', nativePath: 'BAT0', ... } ],
//     powerProfiles: { profile: 'Balanced', hasPerformanceProfile: true, ... },   // see PowerProfiles.qml
//   }
//
// With no state the machine is a desktop: a display device with nothing
// present, on mains power. A new state updates the devices first and the
// power source last, so a plugin that hears onBattery change reads the
// devices as they now are.
Singleton {
  id: root

  readonly property UPowerDevice displayDevice: UPowerDevice {}
  // An UntypedObjectModel in Quickshell; scripts read its `values`.
  readonly property QtObject devices: QtObject {
    readonly property var values: root._devices
    readonly property int count: root._devices.length
  }
  readonly property bool onBattery: root._onBattery

  property bool _onBattery: false
  property var _devices: []
  property Component _deviceComponent: Component { UPowerDevice {} }

  function apply() {
    var state = Stage.service("upower")
    root.displayDevice.source = state.displayDevice || ({})

    var wanted = Array.isArray(state.devices) ? state.devices : []
    var next = []
    for (var i = 0; i < wanted.length; i++) {
      var device = i < root._devices.length ? root._devices[i] : root._deviceComponent.createObject(root)
      device.source = wanted[i] || ({})
      next.push(device)
    }
    for (var j = wanted.length; j < root._devices.length; j++) root._devices[j].destroy()
    if (next.length !== root._devices.length) root._devices = next

    root._onBattery = !!state.onBattery
  }

  Connections {
    target: Stage
    function onServicesChanged() { root.apply() }
  }

  Component.onCompleted: apply()
}
