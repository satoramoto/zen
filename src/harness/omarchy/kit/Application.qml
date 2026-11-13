import QtQuick
import QtQuick.Controls
import "application.mjs" as Presentation

FocusScope {
    id: root
    required property var tree
    Theme { id: palette }
    property var theme: Object.assign({},palette.snapshot,{font:'sans-serif'})
    signal dispatched(string action, var payload, var value)
    implicitWidth: tree.width || 460
    implicitHeight: toolbar.height + content.contentHeight
    onTreeChanged: { if (previousScreen !== tree.screen) { content.contentY=0; previousScreen=tree.screen } }
    property string previousScreen: ''
    ApplicationTree {
        id:toolbar; width:parent.width; node:root.tree.children[0]; theme:root.theme
        onDispatched:function(action,payload,value) { root.dispatched(action,payload,value) }
    }
    Flickable {
        id:content; anchors.top:toolbar.bottom; anchors.bottom:parent.bottom; width:parent.width
        clip:true; contentWidth:width; contentHeight:body.height+40; boundsBehavior:Flickable.StopAtBounds
        ScrollBar.vertical:ScrollBar {}
        ApplicationTree {
            id:body; x:20; y:20; width:parent.width-40; node:root.tree.children[1]; theme:root.theme
            onDispatched:function(action,payload,value) { root.dispatched(action,payload,value) }
        }
    }
}
