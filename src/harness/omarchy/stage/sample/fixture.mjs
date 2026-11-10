// The sample plugin's fixture: it answers `stage-sample` and nothing else.
export default function fixture(state) {
  let asked = 0;
  return {
    commands: {
      'stage-sample'(call) {
        asked++;
        return { stdout: `${state.greeting ?? 'Hello from the fixture'} (${call.argv.join(' ')}, #${asked})\n` };
      },
    },
    ops: {
      asked: () => asked,
    },
  };
}
