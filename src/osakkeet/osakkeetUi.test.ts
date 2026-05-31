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

function findButtons(label: string) {
  return [...document.querySelectorAll('button')].filter(
    (node) => node.textContent?.trim() === label
  ) as HTMLButtonElement[]
}

function clickButton(label: string) {
  const button = findButton(label)
  button.click()
  return button
}

function normalizedText() {
  return document.body.textContent?.replace(/\s+/g, ' ').trim() || ''
}

describe('osakkeet UI', () => {
  beforeEach(() => {
    setOsakkeetDom()
  })

  it('shows file storage actions and no browser storage actions', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    expect(normalizedText()).toContain('Tallennus')
    expect(findButton('Tallenna tiedosto')).toBeDefined()
    expect(findButton('Lataa tiedosto')).toBeDefined()
    expect(findButton('Tyhjennä')).toBeDefined()
    expect(findButton('Kopioi yrityksen tiedot URL:iin')).toBeDefined()
    expect(
      [...document.querySelectorAll('button')].some(
        (node) => node.textContent?.trim() === 'Tallenna selaimeen pysyvästi'
      )
    ).toBe(false)
    expect(
      [...document.querySelectorAll('button')].some((node) => node.textContent?.trim() === 'Lataa selaimesta')
    ).toBe(false)
    expect(
      [...document.querySelectorAll('button')].some((node) => node.textContent?.trim() === 'Poista selaimesta')
    ).toBe(false)
  })

  it('loads the large example and renders both listed and unlisted 2026 tax reporting', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    clickButton('Large, 16v')

    const textContent = normalizedText()
    expect(textContent).toContain('2026')
    expect(textContent).toContain('Omaisuus')
    expect(textContent).toContain('Listaamaton yhtiö')
    expect(textContent).toContain('Listattu yhtiö')
    expect(textContent).toContain('Luovutusvoitot ja -tappiot')
    expect(textContent).toContain('Hankintapäivä')
  })

  it('updates the share split section counter when a row is added', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    expect(normalizedText()).toContain('Osakesplitit1 riviä')
    clickButton('Lisää split')
    expect(normalizedText()).toContain('Osakesplitit2 riviä')
  })

  it('updates the sell section counter when a row is added', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    expect(normalizedText()).toContain('Osakkeiden myynnit0 riviä')
    clickButton('Lisää myynti')
    expect(normalizedText()).toContain('Osakkeiden myynnit1 riviä')
  })

  it('shows tax-return reimbursement details by subscription lot when toggled open', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    clickButton('Medium, 8v')
    clickButton('Näytä merkintäerittäin')

    const textContent = normalizedText()
    expect(textContent).toContain('Merkintäerittäin yhteenveto')
    expect(textContent).toContain('Varojenjako merkintäerittäin')
    expect(textContent).toContain('MerkintäpäiväVarojenjakojaVarojenjako yhteensäPääomanpalautusOsinko')
    expect(textContent).toContain('Jäljellä / osake jälkeen')
  })

  it('opens and closes subscription history log', () => {
    const root = osakkeetIpoCalculatorPage()
    document.body.append(root)

    clickButton('Medium, 8v')

    expect(normalizedText()).not.toContain('TapahtumaVaikutus')
    const [firstShowHistoryButton] = findButtons('Näytä historia')
    expect(firstShowHistoryButton).toBeDefined()
    expect(firstShowHistoryButton.title).toContain(
      'Päivä | Tapahtuma | Osakkeita | Hankintameno | Hankintameno / osake | Vaikutus'
    )
    expect(firstShowHistoryButton.title).toContain('Merkintä')
    firstShowHistoryButton.click()
    const openedSubscriptionRow = findButtons('Sulje historia')[0]?.closest('tr')
    expect(openedSubscriptionRow?.nextElementSibling?.textContent).toContain('Tapahtuma')
    expect(normalizedText()).toContain('Tapahtuma')
    expect(normalizedText()).toContain('Vaikutus')
    expect(normalizedText()).toContain('OsakkeitaHankintamenoHankintameno / osake')
    expect(normalizedText()).toContain('Split')
    expect(normalizedText()).toContain('Pääomanpalautus')
    expect(findButtons('Sulje historia')).toHaveLength(1)
    const [firstHideHistoryButton, secondShowHistoryButton] = [
      findButtons('Sulje historia')[0],
      findButtons('Näytä historia')[0],
    ]
    secondShowHistoryButton.click()
    expect(findButtons('Sulje historia')).toHaveLength(2)
    firstHideHistoryButton.click()
    expect(findButtons('Sulje historia')).toHaveLength(1)
    clickButton('Sulje historia')
    expect(findButtons('Sulje historia')).toHaveLength(0)
  })
})
