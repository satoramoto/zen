pragma Singleton
import QtQuick
import Quickshell

// Stands in for Quickshell.Services.UPower's UPowerDeviceType: the same
// values in the same order as the real enum.
Singleton {
  enum Enum {
    Unknown, LinePower, Battery, Ups, Monitor, Mouse, Keyboard, Pda, Phone, MediaPlayer, Tablet, Computer,
    GamingInput, Pen, Touchpad, Modem, Network, Headset, Speakers, Headphones, Video, OtherAudio, RemoteControl,
    Printer, Scanner, Camera, Wearable, Toy, BluetoothGeneric
  }

  // The enum's names, by value: a fixture names a type ("Battery").
  readonly property var names: ["Unknown", "LinePower", "Battery", "Ups", "Monitor", "Mouse", "Keyboard", "Pda", "Phone",
    "MediaPlayer", "Tablet", "Computer", "GamingInput", "Pen", "Touchpad", "Modem", "Network", "Headset", "Speakers",
    "Headphones", "Video", "OtherAudio", "RemoteControl", "Printer", "Scanner", "Camera", "Wearable", "Toy", "BluetoothGeneric"]
  readonly property var _labels: ["Unknown", "Line Power", "Battery", "Ups", "Monitor", "Mouse", "Keyboard", "Pda", "Phone",
    "Media Player", "Tablet", "Computer", "Gaming Input", "Pen", "Touchpad", "Modem", "Network", "Headset", "Speakers",
    "Headphones", "Video", "Other Audio", "Remote Control", "Printer", "Scanner", "Camera", "Wearable", "Toy", "Bluetooth Generic"]

  function toString(type) {
    var i = Number(type)
    return i >= 0 && i < _labels.length ? _labels[i] : "Invalid Type"
  }
}
