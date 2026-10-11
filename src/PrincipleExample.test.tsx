import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { books, examples, type ExampleId } from "./catalog";
import {
  PrincipleExample,
  type PrincipleExampleProps,
} from "./PrincipleExample";
import * as typeStories from "./stories/ThinkingWithType.stories";
import * as gridStories from "./stories/GridSystems.stories";
import * as colorStories from "./stories/InteractionOfColor.stories";
import * as uiStories from "./stories/RefactoringUI.stories";
import * as webStories from "./stories/OnWebTypography.stories";
import * as detailStories from "./stories/PracticalTypography.stories";
const ids = Object.keys(examples) as ExampleId[];
const comparisons = ids.filter(
  (id) => !["C1", "C2", "C3", "T2", "W1"].includes(id),
);
describe("field guide", () => {
  it("covers six books with three sourced task-led examples each", () => {
    expect(books.flatMap((b) => b.examples)).toEqual(ids);
    expect(ids).toHaveLength(18);
    for (const book of books) {
      expect(book.examples).toHaveLength(3);
      expect(book.reference.url).toMatch(/^https:/);
    }
    for (const e of Object.values(examples)) {
      expect(e.task.length).toBeGreaterThan(40);
      expect(e.takeaway.length).toBeGreaterThan(80);
    }
  });
  it("preserves a comparison while navigating books", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Studio-led" }));
    const navigation = screen.getByRole("navigation", {
      name: "Choose a book",
    });
    for (const book of books) {
      fireEvent.click(
        within(navigation).getByRole("button", {
          name: new RegExp(book.subject),
        }),
      );
      expect(screen.getByRole("region", { name: book.title })).toBeVisible();
      expect(screen.getAllByRole("article")).toHaveLength(3);
    }
    fireEvent.click(
      within(navigation).getByRole("button", { name: /01 Typography/ }),
    );
    expect(screen.getByRole("button", { name: "Studio-led" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
describe("comparisons use actual specimen changes", () => {
  for (const id of comparisons)
    it(`${id} changes the specimen and retains its reading task`, () => {
      const { container } = render(
        <PrincipleExample id={id} applied={false} />,
      );
      const task = screen.getByText(examples[id].task);
      const specimen = container.querySelector(".specimen-stage")!;
      const before = specimen.innerHTML;
      const buttons = within(
        screen.getByRole("group", { name: "Compare compositions" }),
      ).getAllByRole("button");
      fireEvent.click(buttons[1]);
      expect(specimen.innerHTML).not.toBe(before);
      expect(task).toBeVisible();
      expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(buttons[0]);
      expect(specimen.innerHTML).toBe(before);
    });
  for (const id of ["C1", "C2", "C3"] as ExampleId[])
    it(`${id} removes context without changing either target's geometry or color`, () => {
      const { container } = render(
        <PrincipleExample id={id} applied={false} />,
      );
      const targets = [...container.querySelectorAll(".target-swatch")];
      expect(targets).toHaveLength(2);
      expect(targets[0].getAttribute("style")).toBe(
        targets[1].getAttribute("style"),
      );
      const snapshots = targets.map((el) => el.outerHTML);
      fireEvent.click(
        screen.getByRole("checkbox", { name: "Remove the context" }),
      );
      expect(container.querySelector(".context-pair")).toHaveClass("revealed");
      expect(targets.map((el) => el.outerHTML)).toEqual(snapshots);
      fireEvent.click(screen.getByRole("checkbox"));
      expect(container.querySelector(".context-pair")).not.toHaveClass(
        "revealed",
      );
    });
  it("T2 varies a plausible measure while holding the paragraph fixed", () => {
    const { container } = render(<PrincipleExample id="T2" />);
    const text = container.querySelector(".reading")!;
    const content = text.textContent;
    fireEvent.change(screen.getByRole("slider"), { target: { value: 44 } });
    expect((text as HTMLElement).style.maxWidth).toBe("44ch");
    fireEvent.change(screen.getByRole("slider"), { target: { value: 76 } });
    expect((text as HTMLElement).style.maxWidth).toBe("76ch");
    expect(text.textContent).toBe(content);
  });
  it("C3 rotates both surround hues while preserving target colors and reveal", () => {
    const { container } = render(<PrincipleExample id="C3" applied={false} />);
    const fields = [...container.querySelectorAll(".perception-field")];
    const originals = fields.map((el) => el.getAttribute("style"));
    fireEvent.change(screen.getByRole("slider"), { target: { value: 210 } });
    expect(fields.map((el) => el.getAttribute("style"))).not.toEqual(originals);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(fields[0].getAttribute("style")).toBe(
      fields[1].getAttribute("style"),
    );
    for (const target of container.querySelectorAll(".target-swatch"))
      expect(target).toHaveStyle({ backgroundColor: "#9892a6" });
  });
  it("W1 changes title family while preserving wording and surrounding poster", () => {
    const { container } = render(<PrincipleExample id="W1" />);
    const title = container.querySelector(".voice-title")!;
    const text = title.textContent;
    const art = container.querySelector(".voice-art")!.outerHTML;
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "technical" },
    });
    expect(title).toHaveStyle({ fontFamily: "ui-monospace, monospace" });
    expect(title.textContent).toBe(text);
    expect(container.querySelector(".voice-art")!.outerHTML).toBe(art);
  });
  it("W3 compares two policies at the same requested width", () => {
    const { container } = render(<PrincipleExample id="W3" />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: 280 } });
    const shell = container.querySelector(".responsive-shell")!;
    expect(shell).toHaveStyle({ width: "280px", maxWidth: "100%" });
    fireEvent.click(screen.getByRole("button", { name: "Fixed composition" }));
    expect(shell).toHaveStyle({ width: "280px" });
    expect(container.querySelector(".adaptive-paper")).not.toHaveClass(
      "adaptive",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adaptive composition" }),
    );
    expect(shell).toHaveStyle({ width: "280px" });
  });
  it("R1 leaves the focal block untouched", () => {
    const { container } = render(<PrincipleExample id="R1" />);
    const before = container.querySelector(".booking-focus")!.outerHTML;
    fireEvent.click(screen.getByRole("button", { name: "Even contrast" }));
    expect(container.querySelector(".booking-focus")!.outerHTML).toBe(before);
  });
  it("B1 only changes leading between two readable settings", () => {
    const { container } = render(<PrincipleExample id="B1" />);
    const paragraph = container.querySelector(".leading-text")!;
    const text = paragraph.innerHTML;
    expect(paragraph).toHaveStyle({ fontSize: "16px", lineHeight: "1.55" });
    fireEvent.click(screen.getByRole("button", { name: "Compact · 135%" }));
    expect(paragraph).toHaveStyle({ fontSize: "16px", lineHeight: "1.35" });
    expect(paragraph.innerHTML).toBe(text);
  });
  it("B2 keeps the required action bold in both alternatives", () => {
    const { container } = render(<PrincipleExample id="B2" />);
    const strong = container.querySelector("strong")!.outerHTML;
    fireEvent.click(screen.getByRole("button", { name: "Several highlights" }));
    expect(container.querySelector("strong")!.outerHTML).toBe(strong);
    expect(container.querySelectorAll(".optional-emphasis")).toHaveLength(3);
  });
  it("B3 refines marks and preserves the compound hyphen", () => {
    const { container } = render(<PrincipleExample id="B3" />);
    expect(container.querySelector(".editorial-invite")).toHaveTextContent(
      "repair—it’s",
    );
    expect(container.querySelector(".invite-time")).toHaveTextContent("2–4 pm");
    fireEvent.click(screen.getByRole("button", { name: "CMS defaults" }));
    expect(container.querySelector(".invite-time")).toHaveTextContent("2-4 pm");
    expect(container.querySelector(".editorial-invite")).toHaveTextContent(
      "well-loved",
    );
  });
});
describe("Storybook contracts", () => {
  const groups = [
    typeStories,
    gridStories,
    colorStories,
    uiStories,
    webStories,
    detailStories,
  ];
  const stories = groups.flatMap((group) =>
    Object.entries(group)
      .filter(([name]) => name !== "default")
      .map(([, story]) => story),
  );
  it("provides eighteen stories with teaching tasks and source descriptions", () => {
    expect(stories).toHaveLength(18);
    for (const story of stories) {
      expect(story).toHaveProperty("args.id");
      expect(story).toHaveProperty("parameters.docs.description.story");
    }
  });
  for (const story of stories) {
    if (!("args" in story)) continue;
    const args = story.args as PrincipleExampleProps;
    it(`${args.id} follows external args`, () => {
      const { container, rerender } = render(<PrincipleExample {...args} />);
      if (args.id === "T2") {
        rerender(<PrincipleExample {...args} measure={44} />);
        expect(
          container.querySelector<HTMLElement>(".reading")!.style.maxWidth,
        ).toBe("44ch");
      } else if (args.id === "W1") {
        rerender(<PrincipleExample {...args} voice="technical" />);
        expect(screen.getByRole("combobox")).toHaveValue("technical");
      } else {
        rerender(<PrincipleExample {...args} applied={false} />);
        expect(container.querySelector("article")).toHaveAttribute(
          "data-applied",
          "false",
        );
        rerender(<PrincipleExample {...args} applied={true} />);
        expect(container.querySelector("article")).toHaveAttribute(
          "data-applied",
          "true",
        );
      }
    });
  }
});
