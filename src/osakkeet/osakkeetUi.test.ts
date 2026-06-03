import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  CompressionStream as NodeCompressionStream,
  DecompressionStream as NodeDecompressionStream,
} from 'node:stream/web'
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
  Object.defineProperty(globalThis, 'CompressionStream', {
    value: NodeCompressionStream,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'DecompressionStream', {
    value: NodeDecompressionStream,
    configurable: true,
  })

  Object.defineProperty(window.document, 'execCommand', {
    value: vi.fn(() => true),
    configurable: true,
  })
}

async function renderOsakkeetPage() {
  const root = await osakkeetIpoCalculatorPage()
  document.body.append(root)
  return root
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

function findMainSection(key: string) {
  const section = document.querySelector(`.osakkeet-main-section--${key}`)
  if (!section) throw new Error(`Main section not found: ${key}`)
  return section as HTMLElement
}

function findMainSectionContent(key: string) {
  const content = document.querySelector(`.osakkeet-main-section-content--${key}`)
  if (!content) throw new Error(`Main section content not found: ${key}`)
  return content as HTMLElement
}

function toggleMainSection(key: string) {
  const section = findMainSection(key)
  const button = [...section.querySelectorAll('button')].find((node) =>
    ['Avaa osio', 'Sulje osio'].includes(node.textContent?.trim() || '')
  )
  if (!button) throw new Error(`Main section toggle not found: ${key}`)
  ;(button as HTMLButtonElement).click()
  return button as HTMLButtonElement
}

function mainSectionMetricTexts(key: string) {
  return [...findMainSection(key).querySelectorAll('.osakkeet-main-section-metric')].map(
    (node) => node.textContent?.replace(/\s+/g, ' ').trim() || ''
  )
}

function findSectionCard(sectionTitle: string) {
  const sectionCard = [...document.querySelectorAll('section.card')].find(
    (node) => node.querySelector('h2')?.textContent?.trim() === sectionTitle
  )
  if (!sectionCard) throw new Error(`Section card not found: ${sectionTitle}`)
  return sectionCard as HTMLElement
}

function mainTableRows(sectionTitle: string) {
  return [...findSectionCard(sectionTitle).querySelectorAll('tbody > tr')].filter(
    (node) => node instanceof HTMLElement && node.tagName === 'TR' && node.children.length > 1
  ) as HTMLTableRowElement[]
}

function firstColumnTexts(sectionTitle: string) {
  return mainTableRows(sectionTitle).map(
    (row) => row.querySelector('td')?.textContent?.replace(/\s+/g, ' ').trim() || ''
  )
}

function clickRowButton(sectionTitle: string, rowIndex: number, label: string) {
  const row = mainTableRows(sectionTitle)[rowIndex]
  if (!row) throw new Error(`Row not found: ${sectionTitle} #${rowIndex}`)
  const button = [...row.querySelectorAll('button')].find((node) => node.textContent?.trim() === label)
  if (!button) throw new Error(`Row button not found: ${sectionTitle} #${rowIndex} ${label}`)
  ;(button as HTMLButtonElement).click()
  return button as HTMLButtonElement
}

function doubleClickRow(sectionTitle: string, rowIndex: number) {
  const row = mainTableRows(sectionTitle)[rowIndex]
  if (!row) throw new Error(`Row not found: ${sectionTitle} #${rowIndex}`)
  row.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }))
}

function tableColumnTexts(sectionTitle: string, columnIndex: number) {
  return [...findSectionCard(sectionTitle).querySelectorAll(`tbody tr td:nth-child(${columnIndex})`)].map(
    (node) => node.textContent?.replace(/\s+/g, ' ').trim() || ''
  )
}

describe('osakkeet UI', () => {
  beforeEach(() => {
    setOsakkeetDom()
  })

  it('shows file storage actions and no browser storage actions', async () => {
    await renderOsakkeetPage()
    expect(normalizedText()).toContain('Tallennus')
    expect(findButton('Tallenna tiedosto')).toBeDefined()
    expect(findButton('Tallenna yrityksen tiedot tiedostoon')).toBeDefined()
    expect(findButton('Lataa tiedosto')).toBeDefined()
    expect(findButton('Tyhjennä')).toBeDefined()
    expect(findButton('Kopioi yrityksen tiedot URL:iin')).toBeDefined()
    expect(normalizedText()).toContain('Yrityksen tiedot päivitetty')
    expect(normalizedText()).toContain('Käyttäjän tiedot päivitetty')
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

  it('loads the large example and renders both listed and unlisted 2026 tax reporting', async () => {
    await renderOsakkeetPage()
    clickButton('Large, 16v')
    toggleMainSection('taxReturns')

    const textContent = normalizedText()
    expect(textContent).toContain('2026')
    expect(textContent).toContain('Omaisuus')
    expect(textContent).toContain('Listaamaton yhtiö')
    expect(textContent).toContain('Listattu yhtiö')
    expect(textContent).toContain('Luovutusvoitot ja -tappiot')
    expect(textContent).toContain('Hankintapäivä')
  })

  it('updates the share split section counter when a row is added', async () => {
    await renderOsakkeetPage()
    toggleMainSection('distributionsAndCorporateActions')
    expect(normalizedText()).toContain('Osakesplitit1 riviä')
    clickButton('Lisää split')
    expect(normalizedText()).toContain('Osakesplitit2 riviä')
  })

  it('updates the sell section counter when a row is added', async () => {
    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')
    expect(normalizedText()).toContain('Osakkeiden myynnit0 riviä')
    clickButton('Lisää myynti')
    expect(normalizedText()).toContain('Osakkeiden myynnit1 riviä')
  })

  it('shows tax-return reimbursement details by subscription lot when toggled open', async () => {
    await renderOsakkeetPage()
    clickButton('Medium, 8v')
    toggleMainSection('taxReturns')
    clickButton('Näytä pääomapalautukset merkintäerittäin')

    const textContent = normalizedText()
    expect(textContent).toContain('PäiväTyyppiOsakkeitaMaksettu käteisenäEnnakko verottajalle')
    expect(textContent).toContain('Varojenjako merkintäerittäin')
    expect(textContent).toContain('MerkintäpäiväOsakkeitaVarojenjako yhteensäPääomanpalautusOsinko')
    expect(textContent).toContain('Jäljellä / osake jälkeen')
    expect(textContent).not.toContain('Merkintäerittäin yhteenveto')
  })

  it('opens and closes subscription history log', async () => {
    await renderOsakkeetPage()
    clickButton('Medium, 8v')
    toggleMainSection('subscriptionsAndSales')

    expect(normalizedText()).not.toContain('TapahtumaVaikutus')
    const [firstShowHistoryButton] = findButtons('Tapahtumat')
    expect(firstShowHistoryButton).toBeDefined()
    expect(firstShowHistoryButton.title).toContain(
      'Päivä | Tapahtuma | Osakkeita | Hankintameno | Hankintameno / osake | Vaikutus'
    )
    expect(firstShowHistoryButton.title).toContain('Merkintä')
    firstShowHistoryButton.click()
    const openedSubscriptionRow = findButtons('Sulje tapahtumat')[0]?.closest('tr')
    expect(openedSubscriptionRow?.nextElementSibling?.textContent).toContain('Tapahtuma')
    expect(normalizedText()).toContain('Tapahtuma')
    expect(normalizedText()).toContain('Vaikutus')
    expect(normalizedText()).toContain('OsakkeitaHankintamenoHankintameno / osake')
    expect(normalizedText()).toContain('Split')
    expect(normalizedText()).toContain('Pääomanpalautus')
    expect(findButtons('Sulje tapahtumat')).toHaveLength(1)
    const [firstHideHistoryButton, secondShowHistoryButton] = [
      findButtons('Sulje tapahtumat')[0],
      findButtons('Tapahtumat')[0],
    ]
    secondShowHistoryButton.click()
    expect(findButtons('Sulje tapahtumat')).toHaveLength(2)
    firstHideHistoryButton.click()
    expect(findButtons('Sulje tapahtumat')).toHaveLength(1)
    clickButton('Sulje tapahtumat')
    expect(findButtons('Sulje tapahtumat')).toHaveLength(0)
  })

  it('renders four collapsible main sections with summaries', async () => {
    await renderOsakkeetPage()
    expect(normalizedText()).toContain('1. Osakemerkinnät ja myynnit')
    expect(normalizedText()).toContain('2. Varojenjako, jakautuminen ja splitit')
    expect(normalizedText()).toContain('3. Veroilmoitukset')
    expect(normalizedText()).toContain('4. IPO-laskuri')
    expect(normalizedText()).not.toContain('Sisältää:')
    expect(mainSectionMetricTexts('subscriptionsAndSales').some((text) => text.includes('Osakemerkinnät'))).toBe(true)
    expect(mainSectionMetricTexts('subscriptionsAndSales').some((text) => text.includes('osaketta'))).toBe(true)
    expect(
      mainSectionMetricTexts('distributionsAndCorporateActions').some(
        (text) => text.includes('Pääomanpalautus') && text.includes('/ osake')
      )
    ).toBe(true)
    expect(
      mainSectionMetricTexts('distributionsAndCorporateActions').some(
        (text) => text.includes('Osinko') && text.includes('/ osake')
      )
    ).toBe(true)
    expect(mainSectionMetricTexts('taxReturns')[0]).toContain('verovuotta')
    expect(mainSectionMetricTexts('ipoCalculator').some((text) => text.includes('IPO-myynnin tiedot'))).toBe(true)

    const subscriptionsAndSalesContent = findMainSectionContent('subscriptionsAndSales')
    expect(subscriptionsAndSalesContent.style.display).toBe('none')

    const toggleButton = toggleMainSection('subscriptionsAndSales')
    expect(subscriptionsAndSalesContent.style.display).toBe('')
    expect(toggleButton.textContent?.trim()).toBe('Sulje osio')

    toggleMainSection('subscriptionsAndSales')
    expect(subscriptionsAndSalesContent.style.display).toBe('none')
  })

  it('orders all dated collections by ascending date in view mode', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        subscriptions: [
          {
            id: 'sub-2',
            date: '05.02.2025',
            vestingEndsOn: '',
            amount: '10',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 'sub-1',
            date: '04.02.2025',
            vestingEndsOn: '',
            amount: '10',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [
          {
            id: 'sell-2',
            date: '07.02.2025',
            shareCount: '5',
            sellPrice: '50',
            pricePerShare: '10',
          },
          {
            id: 'sell-1',
            date: '06.02.2025',
            shareCount: '5',
            sellPrice: '50',
            pricePerShare: '10',
          },
        ],
        cashDistributions: [
          {
            id: 'distribution-2',
            type: 'dividend',
            date: '05.02.2025',
            amountPerShare: '2',
            shareCount: '10',
          },
          {
            id: 'distribution-1',
            type: 'capital_return',
            date: '04.02.2025',
            amountPerShare: '1',
            shareCount: '10',
          },
        ],
        shareSplits: [
          {
            id: 'split-2',
            date: '09.02.2025',
            multiplier: '2',
          },
          {
            id: 'split-1',
            date: '08.02.2025',
            multiplier: '2',
          },
        ],
        demergers: [
          {
            id: 'demerger-2',
            date: '11.02.2025',
            oldCompanyRatio: '0.7',
          },
          {
            id: 'demerger-1',
            date: '10.02.2025',
            oldCompanyRatio: '0.7',
          },
        ],
        mathematicalShareValues: [],
        ipo: {
          ipoDate: '',
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        sell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')
    toggleMainSection('distributionsAndCorporateActions')

    expect(firstColumnTexts('Osakemerkinnät')).toEqual(['04.02.2025', '05.02.2025'])
    expect(firstColumnTexts('Osakkeiden myynnit')).toEqual(['06.02.2025', '07.02.2025'])
    expect(firstColumnTexts('Osingot ja pääomanpalautukset')).toEqual(['04.02.2025', '05.02.2025'])
    expect(firstColumnTexts('Osakesplitit')).toEqual(['08.02.2025', '09.02.2025'])
    expect(firstColumnTexts('Yrityksen jakautuminen hankintamenon mukaan')).toEqual(['10.02.2025', '11.02.2025'])
  })

  it('shows calculated share count in cash distributions', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        subscriptions: [
          {
            id: 'sub-1',
            date: '01.02.2025',
            vestingEndsOn: '',
            amount: '10',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 'sub-2',
            date: '02.02.2025',
            vestingEndsOn: '',
            amount: '15',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [],
        cashDistributions: [
          {
            id: 'distribution-1',
            type: 'dividend',
            date: '03.02.2025',
            amountPerShare: '2',
            shareCount: '999',
          },
        ],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        ipo: {
          ipoDate: '',
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        sell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('distributionsAndCorporateActions')

    expect(tableColumnTexts('Osingot ja pääomanpalautukset', 3)).toEqual(['25.00'])
  })

  it('shows capital-repayment and dividend share counts in tax-return share column when a row splits by eligibility', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        subscriptions: [
          {
            id: 'sub-old',
            date: '01.01.2013',
            vestingEndsOn: '',
            amount: '10',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 'sub-new',
            date: '01.01.2020',
            vestingEndsOn: '',
            amount: '15',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [],
        cashDistributions: [
          {
            id: 'distribution-1',
            type: 'capital_return',
            date: '01.02.2025',
            amountPerShare: '0.5',
            shareCount: '',
          },
        ],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        ipo: {
          ipoDate: '',
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        sell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('taxReturns')

    expect(normalizedText()).toContain('Yhteensä: 25.00')
    expect(normalizedText()).toContain('Pääomanpalautus: 15.00')
    expect(normalizedText()).toContain('Osinko: 10.00')
  })

  it('shows inputs only while a row is being edited', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        subscriptions: [],
        sells: [
          {
            id: 'sell-1',
            date: '06.02.2025',
            shareCount: '5',
            sellPrice: '50',
            pricePerShare: '10',
          },
        ],
        cashDistributions: [],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        ipo: {
          ipoDate: '',
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        sell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')

    const sectionCard = findSectionCard('Osakkeiden myynnit')
    expect(sectionCard.querySelectorAll('tbody input')).toHaveLength(0)
    expect(firstColumnTexts('Osakkeiden myynnit')).toEqual(['06.02.2025'])

    doubleClickRow('Osakkeiden myynnit', 0)
    expect(sectionCard.querySelectorAll('tbody input')).toHaveLength(4)

    clickRowButton('Osakkeiden myynnit', 0, 'Valmis')
    expect(sectionCard.querySelectorAll('tbody input')).toHaveLength(0)
  })

  it('toggles subscription history on double click instead of editing the row', async () => {
    await renderOsakkeetPage()
    clickButton('Medium, 8v')
    toggleMainSection('subscriptionsAndSales')

    const sectionCard = findSectionCard('Osakemerkinnät')
    expect(sectionCard.querySelectorAll('tbody input')).toHaveLength(0)
    expect(normalizedText()).not.toContain('TapahtumaVaikutus')

    doubleClickRow('Osakemerkinnät', 0)

    expect(normalizedText()).toContain('Tapahtuma')
    expect(normalizedText()).toContain('Vaikutus')
    expect(sectionCard.querySelectorAll('tbody input')).toHaveLength(0)

    doubleClickRow('Osakemerkinnät', 0)

    expect(normalizedText()).not.toContain('TapahtumaVaikutus')
    expect(sectionCard.querySelectorAll('tbody input')).toHaveLength(0)
  })

  it('uses current date in subscription vesting summary and ipo date in ipo summary', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-03T12:00:00Z'))

    try {
      sessionStorage.setItem(
        'osakkeet-ipo-laskuri-window',
        JSON.stringify({
          subscriptions: [
            {
              id: 'sub-1',
              date: '01.01.2026',
              vestingEndsOn: '01.05.2026',
              amount: '10',
              pricePerShare: '1',
              otherTotalAcquisitionCosts: '',
            },
          ],
          sells: [],
          cashDistributions: [],
          shareSplits: [],
          demergers: [],
          mathematicalShareValues: [],
          ipo: {
            ipoDate: '2026-04-01',
            totalShareCount: '100',
            totalIpoCost: '10',
            currentShareValue: '2',
            estimatedPreIpoValue: '100',
            estimatedSecondaryShareSellPercentage: '10',
          },
          sell: {
            amount: '',
            otherAnnualCapitalGainsOrLosses: '',
          },
        })
      )

      await renderOsakkeetPage()
      toggleMainSection('subscriptionsAndSales')
      toggleMainSection('ipoCalculator')

      const textContent = normalizedText()
      expect(textContent).toContain('Ansaintajakson päättäneet osakkeet (03.06.2026)10.00 (100.00 %)')
      expect(textContent).toContain('Ansaintajakson piirissä olevat osakkeet (03.06.2026)0.00 (0.00 %)')
      expect(textContent).toContain('Myytävissä IPOssa (2026-04-01)0.00 (0.00 %)')
      expect(textContent).toContain('Ei myytävissä IPOssa (2026-04-01)10.00 (100.00 %)')
    } finally {
      vi.useRealTimers()
    }
  })
})
