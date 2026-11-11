import { describe, expect, it } from 'vitest';
import { FAKE_MODULES, transformBinaries, transformQml } from './transform.mjs';

describe('the stage rewrites only the window and service seams', () => {
  it('turns layer-shell windows into the stage stand-ins and imports them', () => {
    const { text } = transformQml(`import QtQuick
import Quickshell
import Quickshell.Wayland

PanelWindow {
  WlrLayershell.layer: WlrLayer.Overlay
  WlrLayershell.namespace: "x"
  readonly property var w: anchorItem.QsWindow.window
  FloatingWindow { }
  PopupWindow { }
}
`);
    expect(text).toContain('import qs.stage\n');
    expect(text).toMatch(/^StagePanelWindow \{/m);
    expect(text).toContain('wlr_layer: WlrLayer.Overlay');
    expect(text).toContain('wlr_namespace: "x"');
    expect(text).toContain('Stage.windowOf(anchorItem)');
    expect(text).toContain('StageFloatingWindow { }');
    expect(text).toContain('StagePopupWindow { }');
  });

  it('leaves names that only contain a window type alone', () => {
    const { text, changes } = transformQml('import QtQuick\nKeyboardPanel { }\n// a PanelWindow { in a comment is a mention\nMyPanelWindow { }\n');
    expect(text).toContain('KeyboardPanel { }');
    expect(text).toContain('MyPanelWindow { }');
    expect(changes.filter((c) => c.startsWith('PanelWindow'))).toHaveLength(1);
  });

  it('swaps service modules for fakes, keeping a qualifier', () => {
    const { text } = transformQml('import Quickshell.Services.UPower\nimport Quickshell.Services.Pipewire as PW\nimport Quickshell.Io\nItem {}\n', { fakes: FAKE_MODULES });
    expect(text).toContain('import qs.stage.fakes.UPower\n');
    expect(text).toContain('import qs.stage.fakes.Pipewire as PW\n');
    expect(text).toContain('import Quickshell.Io\n');
  });

  it('keeps a service module that has no fake', () => {
    const { text } = transformQml('import Quickshell.Services.UPower\nItem {}\n', { fakes: {} });
    expect(text).toContain('import Quickshell.Services.UPower\n');
  });

  it('points absolute binaries at their fake, but not the shell', () => {
    const { text } = transformBinaries('command: ["/usr/bin/wpctl", "status"]\nexec /bin/sh -c "/usr/local/bin/foo"\n#!/usr/bin/env python3\n');
    expect(text).toContain('["wpctl", "status"]');
    expect(text).toContain('"foo"');
    expect(text).toContain('/usr/bin/env python3');
  });
});
