import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { setCreateElementContext } from '../../../ki-frame/src/domBuilder'
import { osakkeetIpoCalculatorPage } from './osakkeetUi'

function setOsakkeetDom(url = 'https://example.test/') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url })
  const { window } = dom

  setCreateElementContext(window.document, (value): value is Node => value instanceof window.Node)

  Object.defineProperty(globalThis, 'window', { value: window, configurable: true })
  Object.defineProperty(globalThis, 'document', { value: window.document, configurable: true })
  Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: window.localStorage, configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: window.sessionStorage, configurable: true })
  Object.defineProperty(globalThis, 'Node', { value: window.Node, configurable: true })
  Object.defineProperty(globalThis, 'Text', { value: window.Text, configurable: true })
  Object.defineProperty(globalThis, 'HTMLElement', { value: window.HTMLElement, configurable: true })
  Object.defineProperty(globalThis, 'HTMLInputElement', { value: window.HTMLInputElement, configurable: true })
  Object.defineProperty(globalThis, 'HTMLButtonElement', { value: window.HTMLButtonElement, configurable: true })
  Object.defineProperty(globalThis, 'HTMLSelectElement', { value: window.HTMLSelectElement, configurable: true })
  Object.defineProperty(globalThis, 'HTMLTextAreaElement', { value: window.HTMLTextAreaElement, configurable: true })
  Object.defineProperty(globalThis, 'Blob', { value: window.Blob, configurable: true })
  Object.defineProperty(globalThis, 'FileReader', { value: window.FileReader, configurable: true })
  Object.defineProperty(globalThis, 'URL', { value: window.URL, configurable: true })
  Object.defineProperty(globalThis, 'atob', { value: window.atob.bind(window), configurable: true })
  Object.defineProperty(globalThis, 'btoa', { value: window.btoa.bind(window), configurable: true })

  Object.defineProperty(window.document, 'execCommand', {
    value: vi.fn(() => true),
    configurable: true,
  })
}

function findButton(label: string) {
  const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === label)
  if (!button) throw new Error(`Button not found: ${label}`)
  return button as HTMLButtonElement
}

function clickButton(label: string) {
  const button = findButton(label)
  button.click()
  return button
}

function dispatchInput(node: HTMLInputElement, nextValue: string) {
  node.value = nextValue
  node.dispatchEvent(new window.Event('input', { bubbles: true }))
}

function normalizedText() {
  return document.body.textContent?.replace(/\s+/g, ' ').trim() || ''
}

describe('osakkeet UI', () => {
  beforeEach(() => {
    setOsakkeetDom()
  })

  it('disables browser load without saved data and marks browser save after edits', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    const saveButton = findButton('Tallenna selaimeen pysyvästi')
    const loadButton = findButton('Lataa selaimesta')
    expect(loadButton.disabled).toBe(true)

    saveButton.click()
    expect(saveButton.style.backgroundColor).not.toContain('134, 239, 172')

    const firstInput = document.querySelector('input[type="text"]') as HTMLInputElement
    dispatchInput(firstInput, `${firstInput.value}1`)
    expect(saveButton.style.backgroundColor).toContain('134, 239, 172')
  })

  it('loads the large example and renders both listed and unlisted 2026 tax reporting', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    clickButton('Large, 16v')

    const textContent = normalizedText()
    expect(textContent).toContain('2026')
    expect(textContent).toContain('Listaamaton yhtiö')
    expect(textContent).toContain('Listattu yhtiö')
  })

  it('updates the share split section counter when a row is added', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    expect(normalizedText()).toContain('Osakesplitit1 riviä')
    clickButton('Lisää split')
    expect(normalizedText()).toContain('Osakesplitit2 riviä')
  })
})
