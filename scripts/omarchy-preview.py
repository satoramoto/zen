"""Run the exact portable view modules in standalone Quickshell; never installs a plugin."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--plugin', type=Path, help='Plugin repo containing preview/plugin.mjs and fixtures.mjs; defaults to lab')
parser.add_argument('--tab', default='quick', choices=['quick', 'levels', 'routing', 'alsa'])
parser.add_argument('--smoke', action='store_true', help='Render offscreen, exercise fixture states and exit')
parser.add_argument('--screenshot', type=Path)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='omarchy-framework-', dir='/tmp/opencode') as directory:
    stage = Path(directory)
    shutil.copytree(repo / 'src/harness/omarchy/kit', stage / 'kit')
    imports = 'import "kit/lab.mjs" as Plugin\n'
    init = 'Plugin.initial()'
    reducer = 'Plugin.reduce(host.state, action, payload, value)'
    smoke_step = '''
        if (stage === 1) {
            findControl(nativeTree, "increment").clicked()
            if (host.state.count !== 1) throw new Error("button dispatch failed")
        } else if (stage === 2) {
            host.lastInput = findControl(nativeTree, "input")
            host.lastInput.forceActiveFocus()
            host.lastInput.text = "native input"
            host.lastInput.textEdited()
            if (host.state.input !== "native input") throw new Error("input dispatch failed")
        } else if (stage === 3) {
            if (findControl(nativeTree, "input") !== host.lastInput || !host.lastInput.activeFocus)
                throw new Error("input identity/focus lost on redraw")
            var toggle = findControl(nativeTree, "checked")
            toggle.checked = true
            toggle.toggled()
            if (!host.state.checked) throw new Error("toggle dispatch failed")
        } else if (stage === 4) {
            var select = findControl(nativeTree, "choice")
            select.currentIndex = 2
            select.activated(2)
            if (host.state.choice !== "headphones") throw new Error("select dispatch failed")
        } else if (stage === 5) {
            var slider = findControl(nativeTree, "value")
            slider.value = 80
            slider.moved()
            if (host.state.value !== 80) throw new Error("slider dispatch failed")
        }
    '''
    if args.plugin:
        plugin = args.plugin.resolve() / 'preview'
        for name in ('plugin.mjs', 'fixtures.mjs'):
            source = (plugin / name).read_text().replace('@omarchy/kit/', './kit/')
            (stage / name).write_text(source)
        imports = 'import "plugin.mjs" as Plugin\nimport "fixtures.mjs" as Fixtures\n'
        init = 'Plugin.initial(Fixtures.fixture(), ' + json.dumps(args.tab) + ')'
        reducer = 'Plugin.simulate(host.state, action, payload, value)'
        smoke_step = '''
        var tabs = ["quick", "levels", "routing", "alsa"]
        host.state = Plugin.simulate(host.state, "tab", tabs[(stage - 1) % tabs.length], null)
        if (host.state.tab !== tabs[(stage - 1) % tabs.length]) throw new Error("native tab mismatch")
        '''
    screenshot = ''
    if args.screenshot:
        screenshot = 'canvas.grabToImage(function(result) { result.saveToFile(' + json.dumps(str(args.screenshot.resolve())) + '); Qt.quit() })'
    finish = screenshot or 'Qt.quit()'
    smoke = '''
    property int stage: 0
    Timer {
        interval: 350; running: true; repeat: true
        onTriggered: {
            try {
                ++host.stage
                var stage = host.stage
                if (stage > 5) { console.log("OMARCHY_NATIVE_SMOKE_PASS"); %s; stop(); return }
                %s
                console.log("Native render stage " + stage + ": " + JSON.stringify(Plugin.view(host.state)).length + " bytes")
            } catch (error) { console.error(error); Qt.exit(1) }
        }
    }
    ''' % (finish, smoke_step) if args.smoke else ''
    (stage / 'shell.qml').write_text('''
import QtQuick
import QtQuick.Controls as QQC
import Quickshell
import "kit" as Kit
''' + imports + '''
Scope {
    id: host
    property var lastInput: null
    function findControl(item, name) {
        if (item.objectName === name) return item
        var children = item.children || []
        for (var i = 0; i < children.length; i++) {
            var found = findControl(children[i], name)
            if (found) return found
        }
        return null
    }
    property var state: ''' + init + '''
    FloatingWindow {
        visible: true
        implicitWidth: 850; implicitHeight: 850
        title: "Omarchy / portable plugin preview (fixtures only)"
        color: "#1a1b26"
        QQC.ScrollView {
            id: canvas
            anchors.fill: parent
            anchors.margins: 20
            contentWidth: availableWidth
            Kit.Tree {
                id: nativeTree
                width: canvas.availableWidth
                node: Plugin.view(host.state)
                onDispatched: function(action, payload, value) { host.state = ''' + reducer + ''' }
            }
        }
    }
''' + smoke + '\n}\n')
    env = dict(os.environ)
    if args.smoke:
        env.update(QT_QPA_PLATFORM='offscreen', QT_QUICK_BACKEND='software')
    try:
        result = subprocess.run(['quickshell', '-p', str(stage / 'shell.qml')], env=env, timeout=25 if args.smoke else None)
        raise SystemExit(result.returncode)
    except subprocess.TimeoutExpired:
        raise SystemExit('Native smoke timed out')
