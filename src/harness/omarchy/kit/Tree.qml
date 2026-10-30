import QtQuick
import qs.Ui as Ui
import "layout.mjs" as Layout
import "theme.mjs" as Themes

// The native binding uses Omarchy's real controls. Layout is the very same
// bounded algorithm as the browser binding; no independent flexbox emulation.
Loader {
    id: root
    objectName: "om-node"
    required property var node
    Theme { id: runtimeTheme }
    property var theme: runtimeTheme.snapshot
    property var box: null
    readonly property var metrics: box || Layout.arrange(node, width, theme)
    height: metrics.height
    signal dispatched(string action, var payload, var value)
    signal popupChanged(bool opened)
    signal cursorRequested(string key)
    property var pointerGate: localGate
    Ui.PointerMoveGate { id:localGate; referenceItem:root }
    Ui.CursorSurface { z:-1;anchors.fill:parent;visible:!!root.node.cursor;hasCursor:!!root.node.cursor;foreground:root.theme.foreground;accent:root.theme.accent }
    function resetPointer() { pointerGate.reset() }
    function findControl(action,payload) {
        function find(item) {
            if(item.objectName === action && (payload === undefined || JSON.stringify(item.omPayload) === JSON.stringify(payload))) return item
            var kids=item.children || []
            for(var i=0;i<kids.length;i++) { var found=find(kids[i]); if(found) return found }
            return null
        }
        return find(root)
    }
    function focusControl(action,payload) {
        var control=findControl(action,payload)
        if(control) { control.forceActiveFocus(); if(control.selectAll) control.selectAll(); if(control.open) control.open() }
    }
    function emit(value) { if (node.action && !node.disabled) dispatched(node.action, node.payload, value) }
    sourceComponent: {
        switch (node.kind) {
        case "column": case "section": case "row": return groupView
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
        id: groupView
        Item {
            id:group
            implicitHeight: root.metrics.height
            function keyOf(node,index){return node.key || "index:"+index}
            function reconcile(){
                var children=root.node.children || []
                for(var i=0;i<children.length;i++){
                    var key=keyOf(children[i],i)
                    if(i<identities.count && identities.get(i).itemKey===key)continue
                    var found=-1
                    for(var j=i+1;j<identities.count;j++)if(identities.get(j).itemKey===key){found=j;break}
                    if(found>=0)identities.move(found,i,1)
                    else identities.insert(i,{itemKey:key})
                }
                if(identities.count>children.length)identities.remove(children.length,identities.count-children.length)
            }
            ListModel {id:identities}
            Component.onCompleted:reconcile()
            Connections {target:root;function onNodeChanged(){group.reconcile()}}
            HoverHandler { onPointChanged: { if(root.node.focusKey && root.pointerGate.moved(parent,point.position)) root.cursorRequested(root.node.focusKey) } }
            Rectangle { visible: root.node.kind === "section"; width: parent.width; height: 1; color: root.theme.foreground; opacity: 0.18 }
            Text {
                visible: root.node.kind === "section"
                y: 16; width: parent.width
                text: (root.node.label || "").toUpperCase()
                color: root.theme.muted; font.family: root.theme.font; font.pixelSize: root.theme.small
                lineHeightMode: Text.FixedHeight; lineHeight: root.theme.smallLine
                textFormat: Text.PlainText; renderType: Text.NativeRendering
            }
            Repeater {
                model:identities
                delegate: Loader {
                    id: child
                    required property string itemKey
                    readonly property int dataIndex:(root.node.children || []).findIndex((node,index)=>group.keyOf(node,index)===itemKey)
                    readonly property var modelData: dataIndex<0 ? ({kind:"column",children:[]}) : root.node.children[dataIndex]
                    readonly property var bounds: root.metrics.children[dataIndex] || ({x:0,y:0,width:0,height:0,children:[]})
                    x: bounds ? bounds.x : 0; y: bounds ? bounds.y : 0
                    width: bounds ? bounds.width : 0; height: bounds ? bounds.height : 0
                    Component.onCompleted: setSource(Qt.resolvedUrl("Tree.qml"), {node:Qt.binding(()=>modelData), box:Qt.binding(()=>bounds), theme:Qt.binding(()=>root.theme),pointerGate:root.pointerGate})
                    onLoaded: { item.dispatched.connect(root.dispatched); item.popupChanged.connect(root.popupChanged); item.cursorRequested.connect(root.cursorRequested) }
                }
            }
        }
    }
    Component {
        id: textView
        Item {
            implicitHeight: root.metrics.height
            Text {
                y:1
                width: parent.width
                text: (root.metrics.lines || []).join("\n")
                textFormat: Text.PlainText; renderType: Text.NativeRendering
                color: root.node.tone === "danger" ? root.theme.urgent : root.node.tone === "muted" ? root.theme.muted : root.theme.foreground
                font.family: root.theme.font; font.pixelSize: root.theme.size
                lineHeightMode: Text.FixedHeight; lineHeight: root.theme.line
            }
            Text {
                y: (root.metrics.lines || []).length * root.theme.line + 4
                width: parent.width
                text: (root.metrics.detailLines || []).join("\n")
                textFormat: Text.PlainText; renderType: Text.NativeRendering
                color: root.theme.muted; font.family: root.theme.font; font.pixelSize: root.theme.small
                lineHeightMode: Text.FixedHeight; lineHeight: root.theme.smallLine
            }
        }
    }
    Component {
        id: buttonView
        Ui.Button {
            objectName: root.node.action || ""
            property var omPayload:root.node.payload
            text: root.node.label || ""; selected: !!root.node.selected
            enabled: !root.node.disabled; opacity: enabled ? 1 : 0.45
            bordered: true; focusable: true
            foreground: root.theme.foreground; accent: root.theme.accent
            fontFamily: root.theme.font; fontSize: root.theme.size
            horizontalPadding: 10; verticalPadding: 6
            onClicked: root.emit(undefined)
        }
    }
    Component {
        id: toggleView
        Item {
            implicitHeight: root.metrics.height
            Text {
                anchors.verticalCenter: parent.verticalCenter
                width: parent.width - 62
                text: (root.metrics.labelLines || []).join("\n")
                color: root.theme.foreground; font.family: root.theme.font; font.pixelSize: root.theme.size
                textFormat: Text.PlainText; renderType: Text.NativeRendering
                lineHeightMode: Text.FixedHeight; lineHeight: root.theme.line
            }
            Ui.ToggleSwitch {
                objectName: root.node.action || ""
                property var omPayload:root.node.payload
                anchors.right: parent.right; anchors.verticalCenter: parent.verticalCenter
                checked: !!root.node.value; busy: !!root.node.disabled
                foreground: root.theme.foreground; accent: root.theme.accent
                cursorRing: false; rounded: root.theme.radius > 0
                trackHeight: 22
                onToggled: root.emit(!checked)
            }
        }
    }
    Component {
        id: sliderView
        Item {
            implicitHeight: root.metrics.height
            Text { y:2; text:(root.metrics.labelLines || []).join("\n"); color:root.theme.muted; font.family:root.theme.font; font.pixelSize:root.theme.small; lineHeightMode:Text.FixedHeight; lineHeight:root.theme.smallLine; textFormat:Text.PlainText; renderType:Text.NativeRendering }
            QtObject { id: sliderPalette; property color foreground:root.theme.foreground; property color background:root.theme.background }
            Ui.PanelSlider {
                id:slider
                objectName: root.node.action || ""
                property var omPayload:root.node.payload
                y: root.metrics.controlY || 0; width: parent.width - 48; height: root.theme.control
                bar: sliderPalette
                minimum: root.node.min === undefined ? 0 : root.node.min
                maximum: root.node.max === undefined ? 100 : root.node.max
                step: root.node.step || 1; integer: true
                value: Number(root.node.value); enabled: !root.node.disabled
                trackHeight:4; knobSize:14
                onReleased: function(value) { root.emit(value) }
            }
            Text { anchors.right:parent.right; y:root.metrics.controlY+8; text:Math.round(slider.liveValue)+"%"; color:root.theme.foreground; font.family:root.theme.font; font.pixelSize:root.theme.size; lineHeightMode:Text.FixedHeight; lineHeight:root.theme.line; renderType:Text.NativeRendering }
        }
    }
    Component {
        id: selectView
        Item {
            implicitHeight: root.metrics.height
            Text { y:2; text:(root.metrics.labelLines || []).join("\n"); color:root.theme.muted; font.family:root.theme.font; font.pixelSize:root.theme.small; lineHeightMode:Text.FixedHeight; lineHeight:root.theme.smallLine; textFormat:Text.PlainText; renderType:Text.NativeRendering }
            Ui.Dropdown {
                objectName: root.node.action || ""
                property var omPayload:root.node.payload
                y: root.metrics.controlY || 0; width: parent.width; height: root.theme.control
                showLabel:false; options:(root.node.allowEmpty===false?[]:[{label:"Choose…",value:""}]).concat(root.node.options || []); value:String(root.node.value || "")
                enabled:!root.node.disabled; rowHeight:root.theme.control
                foreground:root.theme.foreground; background:root.theme.background; accent:root.theme.accent; fontFamily:root.theme.font
                onChanged:function(value) { root.emit(value) }
                onPopupOpenChanged:root.popupChanged(popupOpen)
            }
        }
    }
    Component {
        id: inputView
        Item {
            implicitHeight: root.metrics.height
            Text { y:2; text:(root.metrics.labelLines || []).join("\n"); color:root.theme.muted; font.family:root.theme.font; font.pixelSize:root.theme.small; lineHeightMode:Text.FixedHeight; lineHeight:root.theme.smallLine; textFormat:Text.PlainText; renderType:Text.NativeRendering }
            Ui.TextField {
                objectName:root.node.action || ""
                property var omPayload:root.node.payload
                y:root.metrics.controlY || 0; width:parent.width; height:root.theme.control
                text:String(root.node.value || ""); enabled:!root.node.disabled
                foreground:root.theme.foreground; accent:root.theme.accent
                font.family:root.theme.font; font.pixelSize:root.theme.size
                onTextEdited:root.emit(text)
            }
        }
    }
}
