// Tiny DOM helpers shared by the screens. No framework (ch. 2: no runtime deps).

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

export function button(label: string, onClick: () => void, cls = 'btn'): HTMLButtonElement {
  const b = el('button', cls, label)
  b.type = 'button'
  b.addEventListener('click', onClick)
  return b
}

/** A labelled text input row for the classic forms (ch. 15). System keyboard is fine here. */
export function fieldRow(
  label: string,
  value: string,
  opts: { placeholder?: string } = {},
): { row: HTMLElement; input: HTMLInputElement } {
  const row = el('label', 'field')
  row.append(el('span', 'field-label', label))
  const input = el('input', 'field-input')
  input.type = 'text'
  input.value = value
  input.autocomplete = 'off'
  input.autocapitalize = 'characters'
  input.spellcheck = false
  if (opts.placeholder) input.placeholder = opts.placeholder
  row.append(input)
  return { row, input }
}

/** A labelled <select> row for the classic forms (e.g. band, mode, profile). */
export function selectRow(
  label: string,
  options: ReadonlyArray<readonly [value: string, text: string]>,
  selected: string,
): { row: HTMLElement; select: HTMLSelectElement } {
  const row = el('label', 'field')
  row.append(el('span', 'field-label', label))
  const select = el('select', 'field-input')
  for (const [value, text] of options) {
    const o = el('option', undefined, text)
    o.value = value
    if (value === selected) o.selected = true
    select.append(o)
  }
  row.append(select)
  return { row, select }
}
