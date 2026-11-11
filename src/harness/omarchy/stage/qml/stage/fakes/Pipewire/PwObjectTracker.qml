import QtQuick

// Stands in for Quickshell.Services.Pipewire's PwObjectTracker. The fake's
// nodes are bound already (their `ready` is the fixture's), so tracking them
// only keeps the list.
QtObject {
  property var objects: []
  signal objectDestroyed(QtObject object)
}
