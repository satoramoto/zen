import QtQuick

// Stands in for Quickshell.Services.Pipewire's PwNodeLinkTracker. The fake
// graph has no links yet, so a tracked node has no link groups.
QtObject {
  property var node: null
  readonly property var linkGroups: []
}
