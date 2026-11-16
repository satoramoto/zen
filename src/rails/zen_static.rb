# frozen_string_literal: true

# zen's dashboard parts in their static form: the markup a server writes and zen.css styles, with
# no controller, for pages that draw many of them and redraw them often (a table of rows, each with
# a track). Each helper writes the same DOM as the part's model draws (`src/library/components/<Name>/`,
# `src/library/layouts/Panel/`), held to it by `src/rails/goldens.json` and `static_test.rb`.
#
# Copy this file into a Rails app (script/zen-vendor does) and include it in a helper:
#
#   module ApplicationHelper
#     include ZenStatic
#   end
#
#   <%= zen_track(2.4, label: "Our multiplier against what KRX needs", display: "2.4×") %>
#   <%= zen_panel("Coins in reach", href: board_path, aside: "most headroom first") do %> … <% end %>
#
# Props are the parts' own, in snake_case. No method here needs Rails: it writes strings, escaping
# every value, and returns them html_safe when ActiveSupport is loaded.
require "cgi"

module ZenStatic
  # A Track: a value on a rail. `mode` :ratio (a log scale around `mark`, a quarter to `range`
  # times) or :share (0 to 1); `tone` :good, :close, :short, :bad or :none overrides the ratio's;
  # `close` is where close starts (0.9 of the mark); `fluid` fills the box (a table cell).
  def zen_track(value, label:, mode: :ratio, range: 4, mark: 1, fill: nil, tone: nil, display: nil, close: 0.9, fluid: false)
    mode = mode.to_sym
    fill = mode == :ratio if fill.nil?
    at, from, to, mid = ZenStatic.track_position(value, mode, range, mark)
    tone = (tone || ZenStatic.track_tone(value, mode, mark, close)).to_s
    rail = []
    rail << ZenStatic.el("span", { "class" => "lib-track__mark", "data-part" => "mark", "style" => "left: #{ZenStatic.pct(mid)}" }) if mode == :ratio && mark != false
    rail << ZenStatic.el("span", { "class" => "lib-track__fill", "data-part" => "fill", "style" => "left: #{ZenStatic.pct(from)}; width: #{ZenStatic.pct(to - from)}" }) if fill && to > from
    rail << ZenStatic.el("span", { "class" => "lib-track__dot", "data-part" => "dot", "style" => "left: #{ZenStatic.pct(at)}" })
    inner = [ZenStatic.el("span", { "class" => "lib-track__rail", "data-part" => "rail", "role" => "img", "aria-label" => display ? "#{label}: #{display}" : label }, rail.join)]
    inner << ZenStatic.text(display, size: "label", tabular: true, class_name: "lib-track__value", attrs: { "data-part" => "value", "aria-hidden" => "true" }) unless display.nil?
    ZenStatic.safe(ZenStatic.el("span", { "class" => "lib-track", "data-part" => "root", "data-tone" => tone, "data-mode" => mode.to_s, "data-fluid" => fluid ? "true" : nil }, inner.join))
  end

  # A Sparkline: values as a small line, toned by its direction (:up, :down, :flat).
  def zen_sparkline(values, label:, direction: nil, area: false, dot: true)
    points = ZenStatic.spark_points(values)
    way = (direction || ZenStatic.spark_direction(values)).to_s
    line = points.each_with_index.map { |(x, y), i| "#{i.zero? ? 'M' : 'L'}#{ZenStatic.num(x)} #{ZenStatic.num(y)}" }.join(" ")
    paths = []
    paths << ZenStatic.el("path", { "class" => "lib-spark__area", "d" => "#{line} L100 24 L0 24 Z" }) if area && points.length > 1
    paths << ZenStatic.el("path", { "class" => "lib-spark__line", "d" => line }) if points.length > 1
    inner = [ZenStatic.el("svg", { "class" => "lib-spark__svg", "viewBox" => "0 0 100 24", "preserveAspectRatio" => "none", "aria-hidden" => "true" }, paths.join)]
    if dot && (last = points.last)
      inner << ZenStatic.el("span", { "class" => "lib-spark__dot", "data-part" => "dot", "style" => "left: #{ZenStatic.num(last[0])}%; top: #{ZenStatic.num((last[1] / 24.0 * 100).round(2))}%" })
    end
    ZenStatic.safe(ZenStatic.el("span", { "class" => "lib-spark", "data-part" => "root", "data-direction" => way, "role" => "img", "aria-label" => "#{label}, #{way}" }, inner.join))
  end

  # A BarList: `items` of { name:, value:, display:, note:, href: }, each bar against the largest.
  def zen_bar_list(items, label: nil)
    items = items.map { |i| ZenStatic.sym(i) }
    widths = ZenStatic.bar_widths(items.map { |i| i[:value] })
    rows = items.each_with_index.map do |item, i|
      name = if item[:href]
        ZenStatic.el("a", { "class" => "lib-bars__name", "href" => item[:href] }, ZenStatic.text(item[:name], size: "label"))
      else
        ZenStatic.text(item[:name], size: "label", class_name: "lib-bars__name")
      end
      cells = [
        name,
        ZenStatic.el("span", { "class" => "lib-bars__rail", "aria-hidden" => "true" }, ZenStatic.el("i", { "class" => "lib-bars__bar", "style" => "width: #{ZenStatic.num(widths[i])}%" })),
        ZenStatic.text(item[:display] || ZenStatic.num(item[:value]), size: "label", weight: "strong", tabular: true, class_name: "lib-bars__value"),
      ]
      cells << ZenStatic.text(item[:note], size: "caption", tone: "muted", class_name: "lib-bars__note") unless item[:note].nil?
      ZenStatic.el("li", { "class" => "lib-bars__item", "data-part" => "item" }, cells.join)
    end
    ZenStatic.safe(ZenStatic.el("ul", { "class" => "lib-bars", "data-part" => "root", "aria-label" => label }, rows.join))
  end

  # A FigureStrip: `figures` of { label:, value:, note:, direction: (:up/:down), href: }; `lead` the first.
  def zen_figure_strip(figures, lead: false, label: nil)
    rows = figures.map { |f| ZenStatic.sym(f) }.each_with_index.map do |f, i|
      leads = lead && i.zero?
      tone = { "up" => "success", "down" => "danger" }[f[:direction].to_s]
      value = ZenStatic.text(f[:value], role: "numeral", size: leads ? "display" : "heading", tabular: true, tone: tone, class_name: "lib-strip__value")
      body = [f[:href] ? ZenStatic.el("a", { "class" => "lib-strip__link", "href" => f[:href] }, value) : value]
      body << ZenStatic.text(f[:note], size: "caption", tone: "muted", class_name: "lib-strip__note") unless f[:note].nil?
      ZenStatic.el("div", { "class" => "lib-strip__figure", "data-part" => "figure", "data-lead" => leads ? "true" : nil },
        ZenStatic.el("dt", { "class" => "lib-strip__label" }, ZenStatic.text(f[:label], size: "caption", tone: "muted")) +
        ZenStatic.el("dd", { "class" => "lib-strip__body" }, body.join))
    end
    ZenStatic.safe(ZenStatic.el("dl", { "class" => "lib-strip", "data-part" => "root", "aria-label" => label }, rows.join))
  end

  # A Panel: a titled card. The block is its body (server markup, as is); `actions` is markup for
  # the end of its heading row; `aside` words beside the title; `empty` what it says with no body.
  # `title_size` :heading (default), :body or :label (set strong), for a dense dashboard.
  def zen_panel(title, href: nil, level: 2, title_size: nil, aside: nil, actions: nil, empty: nil, class_name: nil, &body)
    dense = title_size && title_size.to_s != "heading"
    heading = ZenStatic.text(title, role: "heading", size: dense ? title_size.to_s : nil, weight: dense ? "strong" : nil, class_name: "lib-panel__title")
    head = [ZenStatic.el("h#{level}", { "class" => "lib-panel__heading" }, href ? ZenStatic.el("a", { "class" => "lib-panel__link", "href" => href }, heading) : heading)]
    head << ZenStatic.text(aside, size: "caption", tone: "muted", class_name: "lib-panel__aside", attrs: { "data-part" => "aside" }) unless aside.nil?
    head << ZenStatic.el("div", { "class" => "lib-panel__actions", "data-part" => "actions" }, actions.to_s) unless actions.nil?
    content = body ? ZenStatic.captured(self, &body) : nil
    parts = [ZenStatic.el("header", { "class" => "lib-panel__head", "data-part" => "head" }, head.join)]
    if content
      parts << ZenStatic.el("div", { "class" => "lib-panel__body", "data-part" => "body" }, content.to_s)
    elsif empty
      parts << ZenStatic.text(empty, size: "label", tone: "muted", tag: "p", class_name: "lib-panel__empty", attrs: { "data-part" => "empty" })
    end
    classes = ["lib-panel", class_name, "lib-surface"].compact.join(" ")
    ZenStatic.safe(ZenStatic.el("section", { "class" => classes, "data-layer" => "raised", "data-radius" => "card", "data-border" => "true", "data-part" => "root" }, parts.join))
  end

  class << self
    # An element, its attributes escaped (nil ones dropped) and its content as given.
    def el(tag, attrs, content = "")
      written = attrs.filter_map { |name, value| value.nil? ? nil : %( #{name}="#{CGI.escapeHTML(value.to_s)}") }.join
      "<#{tag}#{written}>#{content}</#{tag}>"
    end

    # zen's Text: `lib-text lib-tone` and the data attributes its CSS reads, the words escaped.
    def text(words, role: "body", size: "label", tone: nil, tabular: nil, weight: nil, class_name: nil, tag: "span", attrs: {})
      el(tag, {
        "class" => ["lib-text", "lib-tone", class_name].compact.join(" "),
        "data-role" => role,
        "data-tone" => tone,
        "data-tabular" => tabular.nil? ? nil : (tabular ? "" : "false"),
        "data-text-size" => size,
        "data-text-weight" => weight,
      }.merge(attrs), CGI.escapeHTML(words.to_s))
    end

    def track_position(value, mode, range, mark)
      if mode == :share
        at = value.to_f.clamp(0, 1) * 100
        return [at, 0, at, 0]
      end
      base = mark == false ? 1 : mark.to_f
      reach = value.to_f.positive? && base.positive? ? Math.log(value.to_f / base) / Math.log([range.to_f, 1.0001].max) : -1
      at = 50 + reach.clamp(-1, 1) * 50
      [at, [50, at].min, [50, at].max, 50]
    end

    def track_tone(value, mode, mark, close = 0.9)
      return :none if mode == :share
      base = mark == false ? 1 : mark.to_f
      value >= base ? :good : (value >= close.to_f * base ? :close : :short)
    end

    def spark_points(values)
      return [] if values.empty?
      low, high = values.min.to_f, values.max.to_f
      spread = high - low
      spread = 1 if spread.zero?
      step = values.length > 1 ? 100.0 / (values.length - 1) : 0
      values.each_with_index.map do |v, i|
        y = 2 + (1 - (high == low ? 0.5 : (v - low) / spread)) * 20
        [(i * step).round(2), y.round(2)]
      end
    end

    def spark_direction(values)
      return :flat if values.length < 2
      values.last > values.first ? :up : (values.last < values.first ? :down : :flat)
    end

    def bar_widths(values)
      most = [0, *values].max.to_f
      values.map { |v| most.positive? ? [([v.to_f, 0].max / most * 100).round(1), 0.5].max : 0.5 }
    end

    # A number as JavaScript writes it: no trailing `.0`.
    def num(x)
      x = x.to_f
      x == x.to_i ? x.to_i.to_s : x.to_s
    end

    def pct(x) = "#{num(x.round(2))}%"

    def sym(hash) = hash.to_h.transform_keys(&:to_sym)

    def safe(html) = html.respond_to?(:html_safe) ? html.html_safe : html

    def captured(view, &block)
      view.respond_to?(:capture) ? view.capture(&block) : block.call
    end
  end
end
