import QtQuick
import Quickshell.Io
import qs.Commons
import qs.Ui
import "zen" as Zen
import "zen/lab.mjs" as Lab

// The stage's sample plugin. The bar button opens Omarchy's KeyboardPanel
// with zen's Lab view, drawn by zen's native Tree with Omarchy's controls,
// and two buttons: one runs a command a fixture answers, the other one that
// nothing fakes. The stage copies zen's kit into zen/ when it stages it.
Panel {
  id: root

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  property var state: Lab.initial()
  property string answer: ""

  readonly property color foreground: bar ? bar.foreground : Color.foreground
  readonly property string fontFamily: bar ? bar.fontFamily : Style.font.family

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: "Lab"
    onPressed: root.toggle()
  }

  Process {
    id: probe
    stdout: StdioCollector { id: probeOut }
    stderr: StdioCollector { id: probeErr }
    onExited: function(code) {
      var out = probeOut.text.trim() || probeErr.text.trim()
      root.answer = code === 0 ? out : "exit " + code + (out ? ": " + out : "")
    }
  }

  function ask(command) {
    root.answer = "…"
    probe.command = command
    probe.running = true
  }

  KeyboardPanel {
    id: panel
    anchorItem: button
    owner: root
    bar: root.bar
    open: root.opened
    focusTarget: askButton
    contentWidth: panel.fittedContentWidth(Style.space(560))
    contentHeight: panel.fittedContentHeight(column.implicitHeight, Style.space(760))

    Column {
      id: column
      width: parent.width
      spacing: Style.space(10)

      Zen.Tree {
        id: tree
        width: parent.width
        node: Lab.view(root.state)
        onDispatched: function(action, payload, value) { root.state = Lab.reduce(root.state, action, payload, value) }
      }

      Row {
        spacing: Style.space(8)
        Button {
          id: askButton
          objectName: "ask"
          text: "Ask the fixture"
          foreground: root.foreground
          fontFamily: root.fontFamily
          bordered: true
          focusable: true
          onClicked: root.ask(["stage-sample", "hello"])
        }
        Button {
          objectName: "unfaked"
          text: "Run wpctl"
          foreground: root.foreground
          fontFamily: root.fontFamily
          bordered: true
          focusable: true
          onClicked: root.ask(["wpctl", "status"])
        }
      }

      // Probes of the sandbox: a write outside the session (the fixture names
      // the place), and a look for the person's own runtime folders.
      Row {
        spacing: Style.space(8)
        Button {
          objectName: "writeOutside"
          text: "Write outside"
          foreground: root.foreground
          fontFamily: root.fontFamily
          bordered: true
          focusable: true
          onClicked: root.ask(["sh", "-c", "p=$(stage-sample where); if echo probe > \"$p\" 2>/dev/null; then echo \"wrote $p\"; else echo \"refused $p\"; fi"])
        }
        Button {
          objectName: "lookAround"
          text: "Look around"
          foreground: root.foreground
          fontFamily: root.fontFamily
          bordered: true
          focusable: true
          onClicked: root.ask(["sh", "-c", "echo \"$(ls -A /run/user | wc -l) runtime folders, system bus $(test -e /run/dbus/system_bus_socket && echo present || echo absent)\""])
        }
      }

      Text {
        objectName: "answer"
        visible: root.answer !== ""
        text: root.answer
        color: root.foreground
        font.family: root.fontFamily
        font.pixelSize: Style.font.body
      }
    }
  }
}
