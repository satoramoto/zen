import QtQuick
import QtQuick.Controls as QQC
import QtQuick.Layouts

// Small, explicit native binding. No process, filesystem, or desktop services.
// Theme is injected by the host; an installed host supplies Commons.Color/Style.
Loader {
    id: root
    objectName: "om-node"
    required property var node
    property var theme: ({background: "#1a1b26", foreground: "#c0caf5", muted: "#8993b5", accent: "#7aa2f7", urgent: "#f7768e", font: "JetBrains Mono", size: 13})
    signal dispatched(string action, var payload, var value)
    function emit(value) {
        if (node.action && !node.disabled) dispatched(node.action, node.payload, value)
    }
    sourceComponent: {
        switch (node.kind) {
        case "column": case "section": return columnView
        case "row": return rowView
        case "text": return textView
        case "button": return buttonView
        case "slider": return sliderView
        case "toggle": return toggleView
        case "select": return selectView
        case "input": return inputView
        default: console.error("Unsupported Omarchy element: " + node.kind); return null
        }
    }
    Component {
        id: columnView
        ColumnLayout {
            spacing: 12
            QQC.Label {
                visible: root.node.kind === "section"
                Layout.fillWidth: true
                text: (root.node.label || "").toUpperCase()
                color: root.theme.muted
                font.family: root.theme.font
                font.pixelSize: 11
                topPadding: 12
                textFormat: Text.PlainText
            }
            Repeater {
                model: (root.node.children || []).length
                delegate: Loader {
                    required property int index
                    readonly property var modelData: root.node.children[index]
                    Layout.fillWidth: true
                    Component.onCompleted: setSource(Qt.resolvedUrl("Tree.qml"), {node: Qt.binding(() => modelData), theme: Qt.binding(() => root.theme)})
                    onLoaded: {
                        item.dispatched.connect(root.dispatched)
                    }
                }
            }
        }
    }
    Component {
        id: rowView
        RowLayout {
            spacing: 8
            Repeater {
                model: (root.node.children || []).length
                delegate: Loader {
                    required property int index
                    readonly property var modelData: root.node.children[index]
                    Layout.fillWidth: !!modelData.grow
                    Component.onCompleted: setSource(Qt.resolvedUrl("Tree.qml"), {node: Qt.binding(() => modelData), theme: Qt.binding(() => root.theme)})
                    onLoaded: {
                        item.dispatched.connect(root.dispatched)
                    }
                }
            }
        }
    }
    Component {
        id: textView
        ColumnLayout {
            spacing: 2
            QQC.Label {
                Layout.fillWidth: true
                text: root.node.label || ""
                textFormat: Text.PlainText
                wrapMode: Text.WordWrap
                color: root.node.tone === "danger" ? root.theme.urgent : root.node.tone === "muted" ? root.theme.muted : root.theme.foreground
                font.family: root.theme.font
                font.pixelSize: root.theme.size
            }
            QQC.Label {
                visible: !!root.node.detail
                Layout.fillWidth: true
                text: root.node.detail || ""
                textFormat: Text.PlainText
                wrapMode: Text.WordWrap
                color: root.theme.muted
                font.family: root.theme.font
                font.pixelSize: 11
            }
        }
    }
    Component {
        id: buttonView
        QQC.Button {
            objectName: root.node.action || ""
            text: root.node.label || ""
            enabled: !root.node.disabled
            highlighted: !!root.node.selected
            font.family: root.theme.font
            font.pixelSize: root.theme.size
            onClicked: root.emit(undefined)
        }
    }
    Component {
        id: toggleView
        QQC.CheckBox {
            objectName: root.node.action || ""
            text: root.node.label || ""
            checked: !!root.node.value
            enabled: !root.node.disabled
            font.family: root.theme.font
            font.pixelSize: root.theme.size
            onToggled: root.emit(checked)
        }
    }
    Component {
        id: sliderView
        RowLayout {
            QQC.Label { text: root.node.label || ""; color: root.theme.foreground; font.family: root.theme.font; font.pixelSize: root.theme.size }
            QQC.Slider {
                objectName: root.node.action || ""
                Layout.fillWidth: true
                from: root.node.min === undefined ? 0 : root.node.min
                to: root.node.max === undefined ? 100 : root.node.max
                stepSize: root.node.step || 1
                value: Number(root.node.value)
                enabled: !root.node.disabled
                onMoved: root.emit(value)
            }
            QQC.Label { text: root.node.value + "%"; color: root.theme.foreground; font.family: root.theme.font; font.pixelSize: root.theme.size }
        }
    }
    Component {
        id: selectView
        ColumnLayout {
            QQC.Label { text: root.node.label || ""; color: root.theme.muted; font.family: root.theme.font; font.pixelSize: 11 }
            QQC.ComboBox {
                objectName: root.node.action || ""
                Layout.fillWidth: true
                model: [{label: "Choose…", value: ""}].concat(root.node.options || [])
                textRole: "label"
                valueRole: "value"
                currentIndex: model.findIndex(o => o.value === root.node.value)
                enabled: !root.node.disabled
                onActivated: root.emit(currentValue)
            }
        }
    }
    Component {
        id: inputView
        ColumnLayout {
            QQC.Label { text: root.node.label || ""; color: root.theme.muted; font.family: root.theme.font; font.pixelSize: 11 }
            QQC.TextField {
                objectName: root.node.action || ""
                Layout.fillWidth: true
                text: String(root.node.value || "")
                enabled: !root.node.disabled
                onTextEdited: root.emit(text)
            }
        }
    }
}
