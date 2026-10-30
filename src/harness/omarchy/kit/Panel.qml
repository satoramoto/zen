import QtQuick
import QtQuick.Controls as QQC
import Quickshell

// Standard plugin window: lifecycle, theme, scrolling, popup/key ownership and
// cursor visibility. A plugin supplies a view and a controller, not window glue.
Item {
    id:root
    required property var tree
    Theme { id:liveTheme; followPalette:true }
    property var theme:liveTheme.snapshot
    property bool opened:false
    property bool textEditing:false
    property bool popupOpen:false
    property string title:"Omarchy plugin"
    property int panelWidth:850
    property int panelHeight:850
    property var handleKey:function(key) { return false }
    readonly property alias renderer:renderer
    readonly property alias canvas:frame
    signal dispatched(string action,var payload,var value)
    signal cursorRequested(string key)
    signal closeRequested()
    function open() { opened=true; Qt.callLater(()=>focusScope.forceActiveFocus()) }
    function close() { opened=false }
    function focusPanel() { focusScope.forceActiveFocus() }
    function capture(callback) { return frame.capture(callback) }
    function popupGeometry() { return frame.popupGeometry() }
    function normalize(event) {
        var map={}
        map[Qt.Key_Escape]="Escape"; map[Qt.Key_Return]="Enter"; map[Qt.Key_Enter]="Enter"; map[Qt.Key_Space]="Enter"
        map[Qt.Key_Up]="Up";map[Qt.Key_Down]="Down";map[Qt.Key_Left]="Left";map[Qt.Key_Right]="Right"
        map[Qt.Key_Tab]="Tab";map[Qt.Key_Backtab]="Backtab";map[Qt.Key_PageUp]="PageUp";map[Qt.Key_PageDown]="PageDown"
        return map[event.key] || event.text
    }
    function revealCursor() {
        function find(item) {
            if(item.objectName==="om-node" && item.node.cursor) return item
            var kids=item.children || []
            for(var i=0;i<kids.length;i++){var f=find(kids[i]);if(f)return f}
            return null
        }
        var target=find(renderer)
        if(target && scroll.contentItem) {
            var p=target.mapToItem(renderer,0,0),flick=scroll.contentItem
            if(p.y<flick.contentY)flick.contentY=p.y
            else if(p.y+target.height>flick.contentY+scroll.availableHeight)flick.contentY=Math.max(0,p.y+target.height-scroll.availableHeight)
        }
    }
    FloatingWindow {
        id:window
        title:root.title
        visible:root.opened
        implicitWidth:root.panelWidth;implicitHeight:root.panelHeight
        minimumSize:Qt.size(390,400)
        color:root.theme.background
        onVisibleChanged:if(!visible && root.opened){root.opened=false;root.closeRequested()}
        Rectangle {
            id:frame;anchors.fill:parent;color:root.theme.background
            // Quickshell's C++ window content item has no QML engine and cannot
            // grabToImage. Temporarily include its real Qt popup overlay under
            // this same-sized QML surface, capture, then restore the owner.
            function capture(callback) {
                var overlay=QQC.Overlay.overlay,owner=overlay?overlay.parent:null
                if(overlay)overlay.parent=frame
                var started=frame.grabToImage(function(image){if(overlay)overlay.parent=owner;callback(image)})
                if(!started && overlay)overlay.parent=owner
                return started
            }
            function popupGeometry() {
                var overlay=QQC.Overlay.overlay,result=[]
                var kids=overlay?overlay.children:[]
                for(var i=0;i<kids.length;i++)if(kids[i].visible&&kids[i].width>0&&kids[i].height>0){var p=kids[i].mapToItem(frame,0,0);result.push({x:p.x,y:p.y,width:kids[i].width,height:kids[i].height})}
                return result
            }
            border.width:1;border.color:liveTheme.color(root.theme.normalBorder || "#777777")
            radius:root.theme.radius
            FocusScope {
                id:focusScope;anchors.fill:parent;focus:true
                Keys.priority:Keys.BeforeItem
                Keys.onPressed:function(event) {
                    if(root.popupOpen)return
                    var key=root.normalize(event)
                    if(root.textEditing && key!=="Escape" && key!=="Enter")return
                    if(root.handleKey(key)){event.accepted=true;renderer.resetPointer();Qt.callLater(root.revealCursor)}
                }
                QQC.ScrollView {
                    id:scroll;anchors.fill:parent;anchors.margins:root.theme.padding+1
                    contentWidth:availableWidth
                    Tree {
                        id:renderer;width:scroll.availableWidth;node:root.tree;theme:root.theme
                        onDispatched:function(a,p,v){root.dispatched(a,p,v)}
                        onCursorRequested:function(key){root.cursorRequested(key)}
                        onPopupChanged:function(opened){root.popupOpen=opened}
                    }
                }
            }
        }
    }
}
