# zen in a Rails app

A Rails 8 app with Turbo, Stimulus, importmap and Propshaft can use zen's core parts without React,
a bundler or Node at run time. The parts are drawn in the browser by the DOM renderer
(`src/library/foundation/view/Tree.dom.ts`), the third renderer of zen's view trees beside React's
and Svelte's, and held to the same DOM over every fixture. The server writes a placeholder; the
`zen` Stimulus controller draws the part into it (`src/library/hotwire.ts`, `@satoramoto/zen/hotwire`).
Market (`ryangavin/xmrz`, `first-mover/market`) is the first app built this way.

What it draws: every converted control in `src/library/components/` and the primitives and layers
they draw (the list is `src/library/foundation/view/domComponents.ts`). Music, Yahaha, the
assembled and workspace layouts and the React-only theme editor are not drawn yet; naming one fails
with an error that says so.

## 1. Vendor the build

zen ships its Hotwire build in `lib/hotwire/` (`npm run build:lib`):

| File | What | Size |
|---|---|---|
| `zen.js` | the controllers, the DOM renderer and the core parts, one ES module; its only import is `@hotwired/stimulus` (`check:lib` holds it to that) | 251 kB, 70 kB gzipped |
| `zen.css` | the theme scope's rules and every part's stylesheet | 80 kB, 12 kB gzipped |
| `themes/<pack>.css` | one pack's custom properties, light and dark | about 21 kB |

Charts need one more file. TimeChart draws with Lightweight Charts (Apache-2.0), which `zen.js`
imports only the first time a chart mounts, as `lightweight-charts`, so a page with no chart
never loads it. Copy `node_modules/lightweight-charts/dist/lightweight-charts.standalone.production.mjs`
(the standalone build: no imports of its own, about 63 kB gzipped) to
`vendor/javascript/lightweight-charts.js` and pin it. Without the pin a chart's plot stays empty
(`data-chart="unavailable"`) and the console names the pin; its legend and summary still read.

Copy them in with a script in the app. Market's, `script/zen-vendor <zen checkout> [pack]`, builds
the checkout and copies:

```
lib/hotwire/zen.js (and .map)   -> vendor/javascript/zen.js
lib/hotwire/zen.css             -> app/assets/stylesheets/zen/zen.css
lib/hotwire/themes/<pack>.css   -> app/assets/stylesheets/zen/<pack>.css
```

Only one pack's stylesheet goes in, because `stylesheet_link_tag :app` loads every stylesheet
under `app/assets/stylesheets/`. The commit and pack are written to `vendor/javascript/zen.version`.
Node is needed on the machine that vendors, never by the app.

## 2. Pin and register

```ruby
# config/importmap.rb
pin "zen", to: "zen.js"
pin "lightweight-charts", to: "lightweight-charts.js", preload: false   # fetched only when a chart mounts
```

```js
// app/javascript/controllers/index.js
import { registerZen } from "zen"
registerZen(application)   // the `zen` and `zen-theme` controllers
```

## 3. The helper

Copy this into `app/helpers/zen_helper.rb` (Market's has tests in `test/helpers/zen_helper_test.rb`):

```ruby
module ZenHelper
  def zen(part, field: nil, values: nil, html: {}, **props, &slots)
    html = html.dup
    extra = (html.delete(:data) || {}).dup
    controller = [ "zen", extra.delete(:controller) ].compact.join(" ")
    data = { controller: controller, zen_part_value: part.to_s, zen_props_value: props.to_json }
    data[:zen_field_value] = field.to_s if field
    data[:zen_values_value] = values.to_json if values
    tag.div(**html, data: extra.merge(data)) { capture(&slots) if slots }
  end

  def zen_slot(name, &block)
    tag.template(data: { zen_slot: name.to_s }) { capture(&block) }
  end

  def zen_select(field, choices, selected:, label: nil, **props)
    pairs = choices.map { |choice| choice.is_a?(Array) ? [ choice.first.to_s, choice.last.to_s ] : [ choice.to_s, choice.to_s ] }
    values = pairs.map(&:last)
    zen(:Select, field: field, values: values, items: pairs.map(&:first), index: values.index(selected.to_s) || 0, name: label, **props)
  end
end
```

- `zen(:Part, **props)` writes the placeholder. Props are the part's own (its model's props, as in
  its stories), sent as JSON.
- `html:` puts the app's own attributes on the placeholder, including its controllers and actions.
- `zen_slot(:icon) { … }` fills a slot with server markup, cloned each time the part draws it.
- `zen_select(:basis, [["Best published", "top"], …], selected: "top", label: "Figure to beat")`
  maps Rails-style choices onto Select's `items` and `index`. The values become its field's.

## 3a. Static parts, for many rows

Track, Sparkline, BarList, FigureStrip and Panel also have a static form: markup the server
writes and zen.css styles, with no controller, for pages that draw hundreds of them and redraw
them often (a table where every row has a track, swapped while a slider moves).
`src/rails/zen_static.rb` holds the helpers; copy it into `app/helpers/` and include it:

```ruby
module ApplicationHelper
  include ZenStatic
end
```

```erb
<%= zen_track(row.headroom, label: "Our multiplier against what #{row.coin.tag} needs", display: Numbers.multiplier(row.headroom)) %>
<%= zen_track(0.97, tone: :good, label: "Margin against the target", display: "+12%") %>
<%= zen_track(share, mode: :share, label: "Share of the network") %>
<%= zen_sparkline(values, label: "#{coin.tag} yield, 7 days") %>
<%= zen_bar_list(algorithms.map { |a| { name: a.name, value: a.ceiling, display: Numbers.usd(a.ceiling), note: "#{a.in_reach} of #{a.coins} in reach", href: board_path(group: "algo") } }, label: "On the table by algorithm") %>
<%= zen_figure_strip([{ label: "Coins in reach", value: counts["reach"], note: "of #{counts['ranked']} ranked", href: board_path }, …], lead: true) %>
<%= zen_panel("Coins in reach", href: board_path, aside: "most headroom first", empty: "No coin has a figure yet.") do %>
  <table>…</table>
<% end %>
```

Each helper writes exactly the DOM the part draws: zen's CI renders every fixture with the Ruby
and compares it with the part (`ruby src/rails/static_test.rb` against `src/rails/goldens.json`).
A part that changes in zen changes its helper in the same commit.

## 3b. TimeChart

```erb
<%= zen :TimeChart, label: "#{@coin.tag} yield per hash",
      series: [{ name: @coin.tag, kind: "area", points: points }],
      format: { unit: "USD / H/s / day", digits: 2 },
      lines: [{ value: break_even, label: "Break-even at #{Numbers.multiplier(what_if)}", tone: "good" }],
      markers: events.map { |e| { time: e.occurred_at.to_i * 1000, label: e.kind.humanize, tone: "accent" } } %>
```

- `series`: `{ name, kind: line | area | baseline | histogram, points: [[epoch ms, value], …], base, href, marks }`.
  A baseline is success above `base` and danger below; `marks` draws each reading (sparse runs).
- `rebase: true` draws every series as its change from its first reading in the span.
- `spans` (default 1D, 1W, 1M, All; `false` for none) window the points sent once and rebase to the
  span's first point. `onSpan` is the `zen:span` event.
- `format`: `{ style: number | percent | currency, digits, scale, unit }`. `height`, `label`,
  `empty`, `legend: false`.

## 4. Theme scope

zen's parts read the contract's custom properties, so they draw inside a scope:

```erb
<div data-controller="zen-theme" data-zen-theme-pack-value="linear" data-zen-theme-mode-value="system">
```

- `mode` is `light`, `dark` or `system` (the default), which follows the system's setting live.
- `bleed` (`data-zen-theme-bleed-value="true"`) drops the scope's padding.
- The scope sets `lib-scope`, `data-mode`, `data-zen-pack` and the pack's variables inline.
- `.lib-scope` also brings a background, text colour, font and `min-height: 100vh`, as a
  `ThemeScope` does. On `<body>` that is the whole page. Around a single form, override those in
  the app's CSS.

## 5. What the controller does

- **Turbo.** A placeholder is drawn whenever it enters the page: on first load, a visit, a frame
  (lazy ones too) or a stream. It is destroyed, with anything it placed elsewhere such as an open
  menu, when it leaves.
- **New props.** Changing `data-zen-props-value` updates the part in place, and focus stays where
  it was.
- **Morph** (`turbo-refresh-method: morph`). The drawn part is kept and takes the incoming
  placeholder's props. Idiomorph never touches what it drew.
- **Cache.** On `turbo:before-cache` the part is taken down, so the snapshot holds the bare
  placeholder and the page drawn on Back is fresh.
- **Events.** Each callback is a bubbling event on the placeholder: `onChange` becomes
  `zen:change` and `onPress` becomes `zen:press`, with the arguments in `event.detail`. Listen with
  `data-action="zen:change->filters#pick"`.
- **Form fields.** A part with a value (Select, Segmented, Toggle, Slider, NumberField, …) holds a
  new value itself, with no round trip.
  - With `field`, it keeps a hidden `<input name>` in the placeholder in step with that value, and
    fires native bubbling `input` and `change` from it.
  - `form_with`, Turbo form submissions and existing `change->…` actions see it as a native field.
  - With `values`, the field carries the value at the chosen index rather than the index.
- **Labels.** Don't wrap a zen control in a `<label>`: a click on the label would press its
  trigger again. Name it with the part's own prop instead (Select's `name`, a Button's `label`).
- **Before the script runs.** An empty placeholder holds a control's height. Put native fallbacks
  in `<noscript>` for pages that must work without JavaScript.

## Checks in zen

- `npx vitest run src/library/foundation/view`: the DOM renderer against React and Svelte over
  every fixture (`dom.parity.test.tsx`), and over a tree that uses every feature
  (`Tree.parity.test.tsx`).
- `node src/harness/stories/cli.mjs Core --renderer dom`: the Core plays drawn by the DOM
  renderer.
- `node src/harness/stories/cli.mjs Core/Screens/Hotwire`: the Hotwire lifecycle against real Turbo
  and Stimulus. These stories are tagged `browser`.
- `npm run build:lib && npm run check:lib`: the bundle, and its one import.
