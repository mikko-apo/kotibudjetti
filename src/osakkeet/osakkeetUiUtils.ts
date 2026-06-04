import { b, button, div, inputs, span } from '../../../ki-frame/src/domBuilder'
import { events } from '../../../ki-frame/src/domBuilderEvents'
import { setStyle, type StylesObject } from '../../../ki-frame/src/domBuilderStyles'


export function numberInput(
  inputStyle: StylesObject,
  value: string,
  onInput: (value: string) => void = () => {},
  numeric: boolean = true
) {
  return inputs.text(
    {
      value,
      ...(numeric ? { inputMode: 'decimal' as const } : {}),
    },
    inputStyle,
    events({
      input({ node }) {
        onInput(node.value)
      },
    })
  )
}

export function finnishDateInput(inputStyle: StylesObject, value: string, onInput: (value: string) => void = () => {}) {
  return inputs.text(
    {
      value,
      placeholder: 'pp.kk.vvvv',
      inputMode: 'numeric',
    },
    inputStyle,
    events({
      input({ node }) {
        onInput(node.value)
      },
    })
  )
}

export function infoCard(
  summaryItemStyle: StylesObject,
  mutedTextStyle: StylesObject,
  title: string,
  value: string,
  help?: string
) {
  return div(
    summaryItemStyle,
    span({ class: 'muted' }, mutedTextStyle, title),
    ...(value ? [b(value)] : []),
    help && span({ class: 'muted' }, mutedTextStyle, help)
  )
}

export function withHoverInfo(
  hoverInfoStyle: StylesObject,
  hoverInfoIconStyle: StylesObject,
  content: string | Text | Node,
  tooltip: string
) {
  return span({ title: tooltip }, hoverInfoStyle, content, span(hoverInfoIconStyle, 'i'))
}

export function hoverValue(
  hoverInfoStyle: StylesObject,
  hoverInfoIconStyle: StylesObject,
  value: string,
  tooltip: string,
  emphasized = false
) {
  const node = withHoverInfo(hoverInfoStyle, hoverInfoIconStyle, value, tooltip)
  return emphasized ? b(node) : node
}

export function setInputValue(node: HTMLInputElement, value: string) {
  if (node.value !== value) {
    node.value = value
  }
}

function applyButtonStyle(node: HTMLButtonElement, style: StylesObject, className = '') {
  node.removeAttribute('style')
  node.className = className
  setStyle(node, style.styles)
}

export function setButtonVariant(node: HTMLButtonElement, smallButtonStyle: StylesObject, primary: boolean) {
  if (primary) {
    node.removeAttribute('style')
    node.className = 'blueButton'
    return
  }
  applyButtonStyle(node, smallButtonStyle)
}

export function setButtonAttention(
  node: HTMLButtonElement,
  smallButtonStyle: StylesObject,
  attentionButtonStyle: StylesObject,
  disabledButtonStyle: StylesObject,
  needsAttention: boolean
) {
  if (node.disabled) {
    applyButtonStyle(node, disabledButtonStyle)
    return
  }
  if (needsAttention) {
    applyButtonStyle(node, attentionButtonStyle)
    return
  }
  applyButtonStyle(node, smallButtonStyle)
}

export function createRemoveButton(smallButtonStyle: StylesObject, labelNode: Text, remove: () => void) {
  return button(
    labelNode,
    smallButtonStyle,
    events({
      click() {
        remove()
      },
    })
  )
}

export function createActionButton(
  smallButtonStyle: StylesObject,
  labelNode: Text,
  variant: 'primary' | 'secondary',
  onClick: () => void
) {
  return button(
    labelNode,
    variant === 'primary' ? { class: 'blueButton' } : smallButtonStyle,
    events({
      click() {
        onClick()
      },
    })
  )
}
