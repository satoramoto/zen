// The only edits the stage makes to Omarchy's kit and a plugin, in its staged
// copy: the window types headless Qt can't create become the stage's
// stand-ins, Quickshell's system services become fixture-driven fakes, and an
// absolute path to a real binary becomes the command's name, so it resolves to
// a fake. Every other line is drawn as written.

/** Quickshell modules the stage replaces with a fake of the same API. */
export const FAKE_MODULES = {
  'Quickshell.Hyprland': 'qs.stage.fakes.Hyprland',
  'Quickshell.Services.UPower': 'qs.stage.fakes.UPower',
  'Quickshell.Services.Pipewire': 'qs.stage.fakes.Pipewire',
  'Quickshell.Services.Mpris': 'qs.stage.fakes.Mpris',
  'Quickshell.Services.Polkit': 'qs.stage.fakes.Polkit',
};

const WINDOWS = { PanelWindow: 'StagePanelWindow', FloatingWindow: 'StageFloatingWindow', PopupWindow: 'StagePopupWindow' };

/**
 * Rewrites one QML file's text. Returns the new text and what changed, for
 * the session's log.
 * @param {string} text
 * @param {{ fakes?: Record<string, string> }} [options]
 */
export function transformQml(text, options = {}) {
  const fakes = options.fakes ?? FAKE_MODULES;
  const changes = [];
  let out = text;

  out = out.replace(/^(\s*import\s+)([A-Za-z][\w.]*)(\s+[\d.]+)?(\s+as\s+\w+)?\s*$/gm, (line, lead, uri, version, alias) => {
    const fake = fakes[uri];
    if (!fake) return line;
    changes.push(`import ${uri} → ${fake}`);
    return `${lead}${fake}${alias ?? ''}`;
  });

  let windows = false;
  for (const [type, stand] of Object.entries(WINDOWS)) {
    // A declaration (`PanelWindow {`), not a mention in a comment or a name
    // like KeyboardPanelWindow.
    const re = new RegExp(`(^|[^\\w.])${type}(\\s*\\{)`, 'gm');
    out = out.replace(re, (all, before, brace) => {
      windows = true;
      changes.push(`${type} → ${stand}`);
      return `${before}${stand}${brace}`;
    });
  }
  out = out.replace(/\bWlrLayershell\.(\w+)(\s*:)/g, (all, prop, colon) => {
    windows = true;
    changes.push(`WlrLayershell.${prop} → wlr_${prop}`);
    return `wlr_${prop}${colon}`;
  });
  out = out.replace(/([A-Za-z_][\w.]*)\.QsWindow\.window\b/g, (all, item) => {
    windows = true;
    changes.push(`${item}.QsWindow.window → Stage.windowOf(${item})`);
    return `Stage.windowOf(${item})`;
  });
  if (windows && !/^\s*import\s+qs\.stage\s*$/m.test(out)) out = addImport(out, 'qs.stage');

  const bins = transformBinaries(out);
  out = bins.text;
  changes.push(...bins.changes);
  return { text: out, changes };
}

/** Rewrites `/usr/bin/x` and `/usr/local/bin/x` to `x`, in QML, JS and shell alike. */
export function transformBinaries(text) {
  const changes = [];
  const out = text.replace(/(["'\s=(:])\/usr\/(?:local\/)?s?bin\/([A-Za-z0-9_][\w.+-]*)/g, (all, before, name) => {
    if (name === 'env' || name === 'sh' || name === 'bash') return all;
    changes.push(`/usr/bin/${name} → ${name}`);
    return `${before}${name}`;
  });
  return { text: out, changes };
}

function addImport(text, uri) {
  const lines = text.split('\n');
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) last = i;
    else if (last >= 0 && lines[i].trim() && !/^\s*(\/\/|pragma)/.test(lines[i])) break;
  }
  lines.splice(last + 1, 0, `import ${uri}`);
  return lines.join('\n');
}
