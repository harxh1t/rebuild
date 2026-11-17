export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text = "",
  className = "",
) {
  const el = document.createElement(tag);
  el.textContent = text;
  el.className = className;
  return el;
}
export function button(text: string, action: () => void, className = "") {
  const el = element("button", text, className);
  el.type = "button";
  el.onclick = action;
  return el;
}
