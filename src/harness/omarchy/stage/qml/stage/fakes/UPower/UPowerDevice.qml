import QtQuick

// Stands in for Quickshell.Services.UPower's UPowerDevice: the same
// read-only properties, read from one device as the fixture describes it
// (`source`, set by the UPower fake). A fixture names `type` and `state` by
// their enum names ("Battery", "Charging") or gives the number; `percentage`
// runs from 0 to 1, as Quickshell gives it.
QtObject {
  id: device

  property var source: ({})

  readonly property int type: _enumValue(UPowerDeviceType.names, source.type, UPowerDeviceType.Battery)
  readonly property bool powerSupply: source.powerSupply === undefined ? true : !!source.powerSupply
  readonly property real energy: _number(source.energy)
  readonly property real energyCapacity: _number(source.energyCapacity)
  readonly property real changeRate: _number(source.changeRate)
  // Seconds, as Quickshell gives them.
  readonly property real timeToEmpty: _number(source.timeToEmpty)
  readonly property real timeToFull: _number(source.timeToFull)
  readonly property real percentage: _number(source.percentage)
  readonly property bool isPresent: !!source.isPresent
  readonly property int state: _enumValue(UPowerDeviceState.names, source.state, UPowerDeviceState.Unknown)
  readonly property real healthPercentage: _number(source.healthPercentage)
  readonly property bool healthSupported: source.healthSupported === undefined ? healthPercentage > 0 : !!source.healthSupported
  readonly property string iconName: source.iconName === undefined ? "" : String(source.iconName)
  // As Quickshell works it out: a battery that powers the machine.
  readonly property bool isLaptopBattery: type === UPowerDeviceType.Battery && powerSupply
  readonly property string nativePath: source.nativePath === undefined ? "" : String(source.nativePath)
  readonly property string model: source.model === undefined ? "" : String(source.model)
  readonly property bool ready: source.ready === undefined ? true : !!source.ready

  function _number(value) {
    var n = Number(value)
    return isFinite(n) ? n : 0
  }

  function _enumValue(names, value, fallback) {
    if (value === undefined || value === null || value === "") return fallback
    if (typeof value === "number") return value
    var i = names.indexOf(String(value))
    return i >= 0 ? i : fallback
  }
}
