// The little of Turbo 8 the Hotwire stories use: it ships no types of its own.
declare module '@hotwired/turbo' {
  export const session: { drive: boolean };
  export function renderStreamMessage(message: string): void;
  export function morphChildren(currentElement: Element, newElement: Element, options?: object): void;
}
