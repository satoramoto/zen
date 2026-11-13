import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "application.mjs" as Presentation

// Generic application vocabulary. No application data or actions live here.
Loader {
    id: root
    required property var node
    required property var theme
    signal dispatched(string action, var payload, var value)
    function emit(value) { if (node.action && !node.disabled) dispatched(node.action, node.payload, value) }
    readonly property color ink: theme.foreground
    readonly property color muted: theme.muted
    readonly property color accent: theme.accent
    readonly property color fill: Qt.rgba(ink.r, ink.g, ink.b, 0.055)
    readonly property color edge: Qt.rgba(ink.r, ink.g, ink.b, 0.12)
    readonly property int gap: Presentation.metrics.gap
    sourceComponent: {
        switch(node.kind) {
        case 'surface': return surface
        case 'column': case 'section': return column
        case 'row': return row
        case 'button': return button
        case 'hero': return hero
        case 'tabs': return tabs
        case 'reading': return reading
        case 'meter': return meter
        case 'stacked-meter': return stacked
        case 'input': return input
        case 'select': return select
        case 'code': return code
        case 'text': return text
        default: console.error('Unsupported application element: ' + node.kind); return null
        }
    }
    component Label: Text {
        color: root.ink; font.family: root.theme.font; font.pixelSize: Presentation.metrics.size
        textFormat: Text.PlainText; wrapMode: Text.Wrap
    }
    component Child: Loader {
        property var childNode
        Component.onCompleted: setSource(Qt.resolvedUrl('ApplicationTree.qml'), {node: Qt.binding(()=>childNode), theme: Qt.binding(()=>root.theme)})
        onLoaded: item.dispatched.connect(root.dispatched)
    }
    component Children: Column {
        spacing: root.gap
        Repeater {
            model: (root.node.children || []).length
            Child { required property int index; width: parent.width; childNode: root.node.children[index] }
        }
    }
    Component { id: column
        Column {
            spacing: root.gap
            Label { visible: root.node.kind==='section' && !!root.node.label; text: root.node.label || ''; font.bold:true; width:parent.width }
            Children { width: parent.width }
        }
    }
    Component { id: row
        RowLayout {
            spacing: 8
            Repeater {
                model: root.node.children.length
                Child {
                    required property int index
                    childNode: root.node.children[index]
                    Layout.fillWidth: !!childNode.grow
                    Layout.preferredWidth: childNode.grow ? 0 : childNode.kind==='button' ? Math.max(60, (childNode.label || '').length*7+24) : 100
                    Layout.minimumWidth: 0
                }
            }
        }
    }
    Component { id: surface
        Rectangle {
            implicitHeight: body.implicitHeight + 32
            radius: root.node.layer==='float' ? 0 : Presentation.metrics.radius
            color: root.fill; border.color: root.edge
            Column {
                id: body; x:16; y:16; width:parent.width-32; spacing:root.gap
                RowLayout {
                    visible: !!root.node.label; width:parent.width
                    Label { text:root.node.label || ''; font.bold:true; Layout.fillWidth:true }
                    Label { text:root.node.aside || ''; color:root.muted; font.pixelSize:11 }
                }
                Children { width:parent.width }
            }
        }
    }
    Component { id: text
        Column {
            spacing:4
            Label { width:parent.width; text:root.node.label || ''; color:root.node.tone==='danger'?root.theme.urgent:root.node.tone==='muted'?root.muted:root.ink; font.bold:!!root.node.strong; font.pixelSize:root.node.tone==='muted'?11:13 }
            Label { visible:!!root.node.detail; width:parent.width; text:root.node.detail || ''; color:root.muted; font.pixelSize:11 }
        }
    }
    Component { id: button
        Button {
            id: control
            objectName:root.node.action || ''; enabled:!root.node.disabled
            implicitHeight:34; text:root.node.label || ''; focusPolicy:Qt.StrongFocus
            opacity: enabled?1:0.45
            Accessible.name:text
            background:Rectangle { radius:6; color:control.down?root.accent:root.node.variant==='primary'?root.accent:control.hovered?root.edge:root.node.variant==='quiet'?'transparent':root.fill; border.color:control.activeFocus?root.accent:root.node.variant==='quiet'?'transparent':root.edge }
            contentItem:RowLayout {
                spacing:5
                Image { visible:!!source.toString(); source:Presentation.iconSvg(root.node.icon,root.node.variant==='primary'?root.theme.background:root.ink.toString()); Layout.preferredWidth:14; Layout.preferredHeight:14 }
                Label { text:control.text; horizontalAlignment:Text.AlignHCenter; Layout.fillWidth:true; elide:Text.ElideRight; wrapMode:Text.NoWrap; color:root.node.variant==='primary'?root.theme.background:root.node.tone==='danger'?root.theme.urgent:root.ink }
            }
            onClicked:root.emit(undefined)
            Component.onCompleted:if(root.node.autoFocus) Qt.callLater(()=>forceActiveFocus())
            ToolTip.visible:hovered && !!root.node.title
            ToolTip.text:root.node.title || ''
        }
    }
    Component { id: hero
        RowLayout {
            spacing:12
            Image { source:Presentation.iconSvg(root.node.icon,root.node.active?root.accent.toString():root.ink.toString()); Layout.preferredWidth:26; Layout.preferredHeight:26 }
            ColumnLayout {
                Layout.fillWidth:true; spacing:0
                RowLayout {
                    Layout.fillWidth:true
                    Label { text:root.node.label; font.pixelSize:16; font.bold:true; Layout.fillWidth:true }
                    Label { text:root.node.detail || ''; color:root.muted; font.pixelSize:11; elide:Text.ElideRight; wrapMode:Text.NoWrap; Layout.maximumWidth:160 }
                }
                Label { text:(root.node.meta || '').toUpperCase(); font.pixelSize:11; color:root.muted; elide:Text.ElideRight; wrapMode:Text.NoWrap; Layout.fillWidth:true }
            }
        }
    }
    Component { id: tabs
        TabBar {
            id: tabbar; implicitHeight:34; implicitWidth:200
            currentIndex:(root.node.options || []).findIndex(o=>o.value===root.node.value)
            background:Rectangle { radius:6; color:root.fill; border.color:root.edge }
            Repeater {
                model:(root.node.options || []).length
                TabButton {
                    required property int index
                    readonly property var option:root.node.options[index]
                    text:option.label; width:tabbar.width/root.node.options.length; height:34
                    background:Rectangle { radius:6; color:parent.checked?root.accent:'transparent' }
                    contentItem:Label { text:parent.text; horizontalAlignment:Text.AlignHCenter; verticalAlignment:Text.AlignVCenter; color:parent.checked?root.theme.background:root.ink }
                    onClicked:root.emit(option.value)
                }
            }
        }
    }
    Component { id: reading
        RowLayout {
            Label { text:root.node.label; color:root.muted }
            Label { text:String(root.node.value); Layout.fillWidth:true; horizontalAlignment:Text.AlignRight; elide:Text.ElideLeft; wrapMode:Text.NoWrap }
        }
    }
    Component { id: meter
        Column {
            spacing:4
            RowLayout { width:parent.width
                Label { text:root.node.label; color:root.muted }
                Label { text:String(root.node.value); Layout.fillWidth:true; horizontalAlignment:Text.AlignRight }
            }
            Rectangle { width:parent.width; height:6; radius:3; color:root.edge
                Rectangle { width:parent.width*Math.max(0,Math.min(1,root.node.fraction || 0)); height:6; radius:3; color:root.node.tone==='danger'?root.theme.urgent:root.node.tone==='accent'?root.accent:root.ink }
            }
        }
    }
    Component { id: stacked
        Column {
            spacing:8
            readonly property var colors:[root.accent, Qt.rgba(root.accent.r,root.accent.g,root.accent.b,.55),Qt.rgba(root.ink.r,root.ink.g,root.ink.b,.75),Qt.rgba(root.ink.r,root.ink.g,root.ink.b,.3)]
            Item { width:parent.width; height:8
                Rectangle { anchors.fill:parent; color:root.edge; radius:4 }
                Row { width:parent.width; height:8; clip:true
                    Repeater { model:root.node.segments || []
                        Rectangle { required property var modelData; required property int index; width:root.node.total?parent.width*Math.max(0,Math.min(1,modelData.value/root.node.total)):0; height:8; color:root.item.colors[index%4] }
                    }
                }
                Rectangle { visible:root.node.marker>0 && root.node.marker<1; x:parent.width*(root.node.marker || 0); y:-3; width:2; height:14; color:root.accent }
            }
            Flow { width:parent.width; spacing:10
                Repeater { model:root.node.segments || []
                    Label { required property var modelData; required property int index; text:'■ '+modelData.label+' '+modelData.value.toFixed(1); font.pixelSize:11; color:root.item.colors[index%4] }
                }
                Label { visible:!!root.node.marker; text:root.node.markerLabel || ''; color:root.muted; font.pixelSize:11 }
            }
        }
    }
    Component { id: input
        TextField {
            implicitHeight:34; text:String(root.node.value || ''); placeholderText:root.node.placeholder || ''
            enabled:!root.node.disabled; color:root.ink; font.family:root.theme.font; font.pixelSize:13
            Accessible.name:root.node.label || ''; selectByMouse:true
            background:Rectangle { color:root.fill; radius:6; border.color:parent.activeFocus?root.accent:root.edge }
            onTextEdited:root.emit(text)
            onAccepted:if(root.node.submit && !root.node.disabled) root.dispatched(root.node.submit,undefined,undefined)
        }
    }
    Component { id: select
        Column {
            spacing:4
            Label { text:root.node.label || ''; color:root.muted; font.pixelSize:11 }
            ComboBox {
                width:parent.width; implicitHeight:34; model:root.node.options || []; textRole:'label'; valueRole:'value'
                currentIndex:(root.node.options || []).findIndex(o=>o.value===root.node.value); enabled:!root.node.disabled
                onActivated:root.emit(currentValue)
            }
        }
    }
    Component { id: code
        TextArea {
            text:String(root.node.value || ''); readOnly:true; selectByMouse:true; wrapMode:TextEdit.WrapAnywhere
            color:root.ink; font.family:'monospace'; font.pixelSize:11; padding:12
            Accessible.name:root.node.label || ''
            background:Rectangle { color:root.fill; radius:6 }
        }
    }
}
