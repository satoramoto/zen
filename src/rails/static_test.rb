# frozen_string_literal: true

# Holds zen_static.rb to the parts it writes: every golden in goldens.json (each fixture of Track,
# Sparkline, BarList, FigureStrip and Panel, as the DOM renderer draws it) is written by the Ruby
# helper with the same props, read back, and compared in the same canonical text (`serialize` in
# src/library/foundation/view/domText.ts). Run with `ruby src/rails/static_test.rb`; CI does. It
# needs nothing beyond Ruby's own json and rexml, so it runs wherever Ruby does.
require "json"
require "rexml/document"
require_relative "zen_static"

class ZenStaticTest
  include ZenStatic

  GOLDENS = JSON.parse(File.read(File.join(__dir__, "goldens.json")))

  # The canonical text of a node's children: one line per element (tag, attributes sorted, class
  # tokens and style declarations sorted), one per run of text, JSON-quoted; comments skipped.
  def canonical(node, depth = 0)
    pad = "  " * depth
    lines = []
    text = +""
    flush = lambda do
      lines << "#{pad}#{JSON.generate(text)}" unless text.empty?
      text = +""
    end
    node.children.each do |child|
      case child
      when REXML::Text then text << child.value
      when REXML::Element
        flush.call
        attrs = child.attributes.each_attribute.map do |a|
          value = a.value
          value = value.split(/\s+/).reject(&:empty?).sort.join(" ") if a.expanded_name == "class"
          value = value.split(";").map(&:strip).reject(&:empty?).sort.join("; ") if a.expanded_name == "style"
          %(#{a.expanded_name}="#{value}")
        end.sort
        lines << "#{pad}<#{child.name}#{attrs.empty? ? '' : " #{attrs.join(' ')}"}>"
        inner = canonical(child, depth + 1)
        lines << inner unless inner.empty?
      end
    end
    flush.call
    lines.join("\n")
  end

  def written(part, props)
    p = props.transform_keys(&:to_sym)
    case part
    when "Track" then zen_track(p[:value], label: p[:label], mode: p[:mode] || :ratio, range: p[:range] || 4, mark: p.key?(:mark) ? p[:mark] : 1, fill: p[:fill], tone: p[:tone], display: p[:display], close: p[:close] || 0.9, fluid: p[:fluid] || false)
    when "Sparkline" then zen_sparkline(p[:values], label: p[:label], direction: p[:direction], area: p[:area] || false, dot: p.key?(:dot) ? p[:dot] : true)
    when "BarList" then zen_bar_list(p[:items], label: p[:label])
    when "FigureStrip" then zen_figure_strip(p[:figures], lead: p[:lead] || false, label: p[:label])
    when "Panel"
      body = p[:children] && -> { CGI.escapeHTML(p[:children]) }
      zen_panel(p[:title], href: p[:href], level: p[:level] || 2, title_size: p[:titleSize], aside: p[:aside], empty: p[:empty], class_name: p[:className], &body)
    else raise "no static helper for #{part}"
    end
  end

  def run
    failures = []
    GOLDENS.each do |golden|
      html = written(golden["part"], golden["props"])
      got = canonical(REXML::Document.new("<root>#{html}</root>").root)
      failures << "#{golden['part']} / #{golden['story']}: the static form differs from the drawn part\n--- drawn\n#{golden['dom']}\n--- written\n#{got}" unless got == golden["dom"]
    end
    parts = GOLDENS.map { |g| g["part"] }.uniq.sort
    failures << "goldens hold #{parts.inspect}" unless parts == %w[BarList FigureStrip Panel Sparkline Track]
    puts failures.join("\n\n") unless failures.empty?
    puts "#{GOLDENS.length - failures.length} of #{GOLDENS.length} static forms match their parts"
    failures.empty?
  end
end

exit(ZenStaticTest.new.run ? 0 : 1)
