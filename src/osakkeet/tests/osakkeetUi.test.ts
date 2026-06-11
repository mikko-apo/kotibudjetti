import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  CompressionStream as NodeCompressionStream,
  DecompressionStream as NodeDecompressionStream,
} from 'node:stream/web'
import { setCreateElementContext } from '../../../../ki-frame/src/domBuilder'
import { buildFullShareUrl, buildMergeShareUrl } from '../osakkeetPersistence'
import { createId } from '../osakkeetUiBootstrap'
import { osakkeetIpoCalculatorPage } from '../osakkeetUi'

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

function mainSectionTitles() {
  return [...document.querySelectorAll('.osakkeet-main-section > div > div > h2')].map(
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

function tableHeaderRowTexts(sectionTitle: string, rowIndex: number) {
  const headerRow = findSectionCard(sectionTitle).querySelectorAll('thead tr')[rowIndex]
  if (!headerRow) throw new Error(`Header row not found: ${sectionTitle} #${rowIndex}`)
  return [...headerRow.querySelectorAll('th')].map((node) => {
    const clone = node.cloneNode(true) as HTMLElement
    clone.querySelectorAll('*').forEach((element) => {
      if (element.children.length === 0 && element.textContent?.trim() === 'i') {
        element.remove()
      }
    })
    return clone.textContent?.replace(/\s+/g, ' ').trim() || ''
  })
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
    expect(findButton('Kopioi yrityksen tiedot merge URL:iin')).toBeDefined()
    expect(findButton('Kopioi kaikki tiedot URL:iin')).toBeDefined()
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

  it('loads full shared URL data including subscriptions and sells', async () => {
    const sharedUrl = await buildFullShareUrl(
      {
        subscriptions: [
          {
            id: 'sub-1',
            date: '04.02.2025',
            vestingEndsOn: '',
            amount: '10',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 'sub-2',
            date: '05.02.2025',
            vestingEndsOn: '',
            amount: '20',
            pricePerShare: '2',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [
          {
            id: 'sell-1',
            date: '06.02.2025',
            shareCount: '5',
            pricePerShare: '3',
            otherTotalSellCosts: '',
          },
        ],
        cashDistributions: [],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '123',
          otherAnnualCapitalGainsOrLosses: '',
        },
        lastModifiedCompanyData: '',
        lastModifiedUserData: '',
      },
      createId
    )

    setOsakkeetDom(sharedUrl)

    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')

    expect(tableColumnTexts('Osakemerkinnät', 2)).toEqual(['04.02.2025', '05.02.2025'])
    expect(firstColumnTexts('Osakkeiden myynnit')).toEqual(['06.02.2025'])
  })

  it('merges company URL data into existing browser state and keeps user-specific rows', async () => {
    setOsakkeetDom()
    const mergeUrl = await buildMergeShareUrl(
      {
        subscriptions: [],
        sells: [],
        cashDistributions: [
          {
            id: 'distribution-merge-1',
            type: 'dividend',
            date: '07.02.2025',
            amountPerShare: '3',
            shareCount: '30',
          },
        ],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        company: {
          listingStatus: 'listed',
          becameListedDate: '06.02.2025',
        },
        ipo: {
          totalShareCount: '1000',
          totalIpoCost: '100000',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
        lastModifiedCompanyData: '',
        lastModifiedUserData: '',
      },
      createId
    )

    setOsakkeetDom(mergeUrl)
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        subscriptions: [
          {
            id: 'sub-1',
            date: '04.02.2025',
            vestingEndsOn: '',
            amount: '10',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 'sub-2',
            date: '05.02.2025',
            vestingEndsOn: '',
            amount: '20',
            pricePerShare: '2',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [
          {
            id: 'sell-1',
            date: '06.02.2025',
            shareCount: '5',
            pricePerShare: '3',
            otherTotalSellCosts: '',
          },
        ],
        cashDistributions: [
          {
            id: 'distribution-old-1',
            type: 'dividend',
            date: '01.02.2025',
            amountPerShare: '1',
            shareCount: '10',
          },
        ],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '321',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')
    toggleMainSection('distributionsAndCorporateActions')

    expect(tableColumnTexts('Osakemerkinnät', 2)).toEqual(['04.02.2025', '05.02.2025'])
    expect(firstColumnTexts('Osakkeiden myynnit')).toEqual(['06.02.2025'])
    expect(
      firstColumnTexts(
        'Yrityksen osingot ja pääomanpalautukset. Maksut osakkeenomistajalle ja verottajalle ja pääomanpalautus/osinko erottelu'
      )
    ).toEqual(['07.02.2025'])
    expect(normalizedText()).toContain('Listattu')
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

  it('does not show capital-repayment columns in the subscriptions table', async () => {
    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')

    const sectionText = findSectionCard('Osakemerkinnät').textContent?.replace(/\s+/g, ' ').trim() || ''
    expect(sectionText).not.toContain('Pääomanpalautus / osake')
    expect(sectionText).not.toContain('Pääomanpalautukset yhteensä')
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

  it('shows dividend events in subscription history log', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        subscriptions: [
          {
            id: 'sub-1',
            date: '01.01.2024',
            vestingEndsOn: '',
            amount: '10',
            pricePerShare: '2',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [],
        cashDistributions: [{ id: 'dist-1', type: 'dividend', date: '01.02.2025', amountPerShare: '1.5' }],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')

    clickButton('Tapahtumat')

    const sectionText = findSectionCard('Osakemerkinnät').textContent?.replace(/\s+/g, ' ').trim() || ''
    expect(sectionText).toContain('Osinko')
    expect(sectionText).toContain('01.02.2025')
    expect(sectionText).toContain('Osinko 1.50 € / osake x 10.00 osaketta = 15.00 €.')
  })

  it('renders four collapsible main sections with summaries', async () => {
    await renderOsakkeetPage()
    expect(normalizedText()).toContain(
      '1. Yrityksen tiedot: Varojenjako, jakautuminen ja splitit. Maksut osakkeiden perusteella ja yhteenveto verotuksen näkökulmasta'
    )
    expect(normalizedText()).toContain('2. Osakemerkinnät ja myynnit')
    expect(normalizedText()).toContain('3. Veroilmoitukset')
    expect(normalizedText()).toContain('4. IPO-laskuri')
    expect(mainSectionTitles()).toEqual([
      '1. Yrityksen tiedot: Varojenjako, jakautuminen ja splitit. Maksut osakkeiden perusteella ja yhteenveto verotuksen näkökulmasta',
      '2. Osakemerkinnät ja myynnit',
      '3. Veroilmoitukset',
      '4. IPO-laskuri',
    ])
    expect(findSectionCard('Yrityksen tiedot')).toBeDefined()
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

  it('shows mathematical share values under company details instead of tax returns', async () => {
    await renderOsakkeetPage()
    toggleMainSection('distributionsAndCorporateActions')
    toggleMainSection('taxReturns')

    const companySectionText = findSectionCard('Yrityksen tiedot').textContent?.replace(/\s+/g, ' ').trim() || ''
    const taxSectionText =
      findSectionCard('Yhteenveto veroilmoituksista').textContent?.replace(/\s+/g, ' ').trim() || ''

    expect(companySectionText).toContain('Matemaattinen arvo / osake tunnetuille vuosille')
    expect(taxSectionText).not.toContain('Matemaattinen arvo / osake tunnetuille vuosille')
  })

  it('hides the ipo calculator for listed companies', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        company: {
          listingStatus: 'listed',
          becameListedDate: '01.01.2025',
        },
        subscriptions: [],
        sells: [],
        cashDistributions: [],
        shareSplits: [{ id: 'split-1', date: '01.01.2026', multiplier: '2' }],
        demergers: [],
        mathematicalShareValues: [],
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()

    expect(findMainSection('ipoCalculator').style.display).toBe('none')
  })

  it('hides the ipo calculator after the became-listed date has passed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-03T12:00:00Z'))

    try {
      sessionStorage.setItem(
        'osakkeet-ipo-laskuri-window',
        JSON.stringify({
          company: {
            listingStatus: 'unlisted',
            becameListedDate: '2026-04-01',
          },
          subscriptions: [],
          sells: [],
          cashDistributions: [],
          shareSplits: [],
          demergers: [],
          mathematicalShareValues: [],
          ipo: {
            totalShareCount: '',
            totalIpoCost: '',
            currentShareValue: '',
            estimatedPreIpoValue: '',
            estimatedSecondaryShareSellPercentage: '',
          },
          ipoSell: {
            amount: '',
            otherAnnualCapitalGainsOrLosses: '',
          },
        })
      )

      await renderOsakkeetPage()

      expect(findMainSection('ipoCalculator').style.display).toBe('none')
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows sellable IPO shares before the sell inputs and displays the sellable-share percentage', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '17.06.2026',
        },
        subscriptions: [
          {
            id: 'sub-1',
            date: '01.01.2024',
            vestingEndsOn: '',
            amount: '100',
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
          totalShareCount: '100',
          totalIpoCost: '10',
          currentShareValue: '12',
          estimatedPreIpoValue: '1000',
          estimatedSecondaryShareSellPercentage: '20',
        },
        ipoSell: {
          amount: '25',
          pricePerShare: '10',
          costPerShare: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('ipoCalculator')

    const sectionText = findSectionCard('IPO-myynnin tiedot').textContent?.replace(/\s+/g, ' ').trim() || ''
    expect(sectionText.indexOf('Myytävissä IPOssa (17.06.2026)')).toBeLessThan(
      sectionText.indexOf('Myytävien osakkeiden määrä')
    )
    expect(sectionText).toContain('25.00 % myytävissä IPOssa')
  })

  it('hides sale allocation by lot when IPO sell values cannot be calculated', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '17.06.2026',
        },
        subscriptions: [
          {
            id: 'sub-1',
            date: '01.01.2024',
            vestingEndsOn: '',
            amount: '100',
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
          totalShareCount: '100',
          totalIpoCost: '10',
          currentShareValue: '12',
          estimatedPreIpoValue: '1000',
          estimatedSecondaryShareSellPercentage: '20',
        },
        ipoSell: {
          amount: '25',
          pricePerShare: '',
          costPerShare: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('ipoCalculator')

    const sectionText = findSectionCard('IPO-myynnin tiedot').textContent?.replace(/\s+/g, ' ').trim() || ''
    expect(sectionText).toContain('IPO-hinta / osake pitää syöttää ennen kuin IPO-myynnin arvot voidaan laskea.')
    expect(sectionText).not.toContain('Myynnin kohdistus merkintäerille')
    expect(sectionText).not.toContain('Osakkeiden myyntihinta ja kulut')
    expect(sectionText).not.toContain('Luovutusvoiton laskeminen ja verottaminen vuositasolla')
    expect(sectionText).not.toContain('Tilille jäävä raha ja veroihin varattava osuus')
    expect(sectionText).not.toContain('Merkintäkulut ja nettotulos')
    expect(sectionText).not.toContain('IPO-kulujen vaikutus')
    const annualAdjustmentSection = [...findSectionCard('IPO-myynnin tiedot').querySelectorAll('h3')].find(
      (node) => node.textContent?.trim() === 'Muiden luovutusvoittojen tai -tappioiden vaikutus vuositasolla'
    )?.parentElement as HTMLElement | undefined
    expect(annualAdjustmentSection?.style.display).toBe('none')
  })

  it('shows remaining unsold share breakdown and compares net result against original acquisition cost', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '17.06.2026',
        },
        subscriptions: [
          {
            id: 'sub-1',
            date: '01.01.2024',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 'sub-2',
            date: '01.01.2025',
            vestingEndsOn: '31.12.2026',
            amount: '50',
            pricePerShare: '2',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [],
        cashDistributions: [{ id: 'dist-1', type: 'capital_return', date: '02.01.2025', amountPerShare: '0.5' }],
        shareSplits: [{ id: 'split-1', date: '01.01.2026', multiplier: '2' }],
        demergers: [],
        mathematicalShareValues: [],
        ipo: {
          totalShareCount: '150',
          totalIpoCost: '0',
          currentShareValue: '12',
          estimatedPreIpoValue: '1500',
          estimatedSecondaryShareSellPercentage: '50',
        },
        ipoSell: {
          amount: '75',
          pricePerShare: '10',
          costPerShare: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('ipoCalculator')

    const sectionText = findSectionCard('IPO-myynnin tiedot').textContent?.replace(/\s+/g, ' ').trim() || ''
    expect(sectionText).toContain('Myymättä jäävät osakkeet')
    expect(sectionText).toContain('Yhteensä: 225.00 osaketta, arvo 2250.00 €')
    expect(sectionText).toContain('Myytävissä nyt: 125.00 osaketta, arvo 1250.00 €')
    expect(sectionText).toContain(
      'Ansaintajakson piirissä: 100.00 osaketta, arvo IPO-hinnalla 1000.00 €, alkuperäinen hankintameno 100.00 €'
    )
    expect(sectionText).toContain('Alkuperäinen hankintameno 37.50 €')
    expect(sectionText).not.toContain('jälkeen pääomanpalautusten')
  })

  it('keeps focus in other annual capital gains or losses input while typing', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '17.06.2026',
        },
        subscriptions: [
          {
            id: 'sub-1',
            date: '01.01.2024',
            vestingEndsOn: '',
            amount: '100',
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
          totalShareCount: '100',
          totalIpoCost: '0',
          currentShareValue: '12',
          estimatedPreIpoValue: '1000',
          estimatedSecondaryShareSellPercentage: '20',
        },
        ipoSell: {
          amount: '25',
          pricePerShare: '10',
          costPerShare: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('ipoCalculator')

    const sectionCard = findSectionCard('IPO-myynnin tiedot')
    const inputs = [...sectionCard.querySelectorAll('input')] as HTMLInputElement[]
    const otherAnnualCapitalInput = inputs[inputs.length - 1]
    otherAnnualCapitalInput.focus()
    otherAnnualCapitalInput.value = '1'
    otherAnnualCapitalInput.dispatchEvent(new window.Event('input', { bubbles: true }))

    expect(document.activeElement).toBe(otherAnnualCapitalInput)
  })

  it('shows renamed annual-capital text and negative tax effect for losses', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '01.06.2026',
        },
        subscriptions: [
          {
            id: 'sub-1',
            date: '01.01.2013',
            vestingEndsOn: '',
            amount: '100',
            pricePerShare: '1',
            otherTotalAcquisitionCosts: '',
          },
          {
            id: 'sub-2',
            date: '01.01.2022',
            vestingEndsOn: '',
            amount: '50',
            pricePerShare: '4',
            otherTotalAcquisitionCosts: '',
          },
        ],
        sells: [],
        cashDistributions: [{ id: 'r1', type: 'capital_return', date: '2024-01-01', amountPerShare: '2' }],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        ipo: {
          totalShareCount: '150',
          totalIpoCost: '30',
          currentShareValue: '12',
          estimatedPreIpoValue: '1500',
          estimatedSecondaryShareSellPercentage: '20',
        },
        ipoSell: {
          amount: '120',
          pricePerShare: '10',
          costPerShare: '',
          otherAnnualCapitalGainsOrLosses: '-200',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('ipoCalculator')

    const sectionText = findSectionCard('IPO-myynnin tiedot').textContent?.replace(/\s+/g, ' ').trim() || ''
    expect(sectionText).toContain('Syötä kenttään muut mahdolliset luovutusvoitot ja tappiot ja niiden yhteisarvo')
    expect(sectionText).toContain('Muiden luovutusvoittojen tai -tappioiden vaikutus veron määrään')
    expect(sectionText).toContain('-60.00 €')
    expect(sectionText).not.toContain(
      'Anna tähän vuoden muiden luovutusvoittojen tai luovutustappioiden yhteisvaikutus.'
    )
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
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')
    toggleMainSection('distributionsAndCorporateActions')

    expect(tableColumnTexts('Osakemerkinnät', 2)).toEqual(['04.02.2025', '05.02.2025'])
    expect(firstColumnTexts('Osakkeiden myynnit')).toEqual(['06.02.2025', '07.02.2025'])
    expect(
      firstColumnTexts(
        'Yrityksen osingot ja pääomanpalautukset. Maksut osakkeenomistajalle ja verottajalle ja pääomanpalautus/osinko erottelu'
      )
    ).toEqual(['04.02.2025', '05.02.2025'])
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
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('distributionsAndCorporateActions')

    expect(
      tableColumnTexts(
        'Yrityksen osingot ja pääomanpalautukset. Maksut osakkeenomistajalle ja verottajalle ja pääomanpalautus/osinko erottelu',
        3
      )
    ).toEqual(['25.00'])
  })

  it('shows lot-level events for cash distributions', async () => {
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
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('distributionsAndCorporateActions')

    const sectionTitle =
      'Yrityksen osingot ja pääomanpalautukset. Maksut osakkeenomistajalle ja verottajalle ja pääomanpalautus/osinko erottelu'

    expect(findSectionCard(sectionTitle).textContent).not.toContain('Merkintäerittäin')

    clickRowButton(sectionTitle, 0, 'Eräkohtaiset tapahtumat')

    const sectionText = findSectionCard(sectionTitle).textContent?.replace(/\s+/g, ' ').trim() || ''
    expect(sectionText).toContain('Merkintäerittäin')
    expect(sectionText).toContain('01.01.2013')
    expect(sectionText).toContain('01.01.2020')
    expect(sectionText).toContain('Hankintameno')
    expect(sectionText).toContain('Hankintameno / osake')
    expect(sectionText).toContain('Vaikutus')
    expect(sectionText).not.toContain('Pääomanpalautus 0.50 € / osake * 15.00 osaketta = 7.50 €.')
    expect(sectionText).toContain('Osinkona 0.50 € / osake = 5.00 € (merkinnästä on yli 10 vuotta).')
    expect(sectionText).toContain('7.50')
    expect(sectionText).toContain('5.00')
  })

  it('shows grouped header rows in cash distributions', async () => {
    await renderOsakkeetPage()
    toggleMainSection('distributionsAndCorporateActions')

    const sectionTitle =
      'Yrityksen osingot ja pääomanpalautukset. Maksut osakkeenomistajalle ja verottajalle ja pääomanpalautus/osinko erottelu'

    expect(tableHeaderRowTexts(sectionTitle, 0)).toEqual([
      '',
      'Osinko tai pääomanpalautus:',
      'Maksun jakautuminen:',
      'Verotuksessa:',
      '',
    ])
    expect(tableHeaderRowTexts(sectionTitle, 1)).toEqual([
      'Päivä',
      'Tyyppi',
      'Osakkeita yhteensä',
      '€/osake',
      'Yhteensä',
      'Maksettu käteisenä',
      'Ennakko verottajalle',
      'Pääomanpalautus',
      'Osinko',
      '',
    ])
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
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('taxReturns')

    expect(normalizedText()).toContain('Pääomanpalautus / Osinko')
    expect(normalizedText()).toContain('Yhteensä: 25.00')
    expect(normalizedText()).toContain('Pääomanpalautus: 15.00')
    expect(normalizedText()).toContain('Osinko: 10.00')
  })

  it('shows historical sells in the yearly tax-return summary', async () => {
    sessionStorage.setItem(
      'osakkeet-ipo-laskuri-window',
      JSON.stringify({
        subscriptions: [{ id: 'sub-1', date: '01.01.2024', amount: '10', pricePerShare: '1' }],
        sells: [{ id: 'sell-1', date: '06.02.2025', shareCount: '5', pricePerShare: '10', otherTotalSellCosts: '2' }],
        cashDistributions: [],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('taxReturns')

    expect(normalizedText()).toContain('Luovutusvoitot ja -tappiot')
    expect(normalizedText()).toContain('06.02.2025')
    expect(normalizedText()).toContain('50.00')
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
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
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

  it('keeps only the newest added row in edit mode', async () => {
    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')

    const sectionCard = findSectionCard('Osakkeiden myynnit')
    clickButton('Lisää myynti')
    expect(sectionCard.querySelectorAll('tbody input')).toHaveLength(4)

    clickButton('Lisää myynti')
    expect(sectionCard.querySelectorAll('tbody input')).toHaveLength(4)
    expect(firstColumnTexts('Osakkeiden myynnit')).toEqual(['-', ''])
  })

  it('keeps focus in an edited row input while typing', async () => {
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
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')
    doubleClickRow('Osakkeiden myynnit', 0)

    const firstInput = findSectionCard('Osakkeiden myynnit').querySelector('tbody input') as HTMLInputElement
    firstInput.focus()
    firstInput.value = '07.02.2025'
    firstInput.dispatchEvent(new window.Event('input', { bubbles: true }))

    expect(document.activeElement).toBe(firstInput)
  })

  it('keeps the focused row node in place and moves other rows around it when sorting changes', async () => {
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
          {
            id: 'sell-2',
            date: '07.02.2025',
            shareCount: '3',
            sellPrice: '30',
            pricePerShare: '10',
          },
        ],
        cashDistributions: [],
        shareSplits: [],
        demergers: [],
        mathematicalShareValues: [],
        company: {
          listingStatus: 'unlisted',
          becameListedDate: '',
        },
        ipo: {
          totalShareCount: '',
          totalIpoCost: '',
          currentShareValue: '',
          estimatedPreIpoValue: '',
          estimatedSecondaryShareSellPercentage: '',
        },
        ipoSell: {
          amount: '',
          otherAnnualCapitalGainsOrLosses: '',
        },
      })
    )

    await renderOsakkeetPage()
    toggleMainSection('subscriptionsAndSales')
    doubleClickRow('Osakkeiden myynnit', 1)

    const editedRow = mainTableRows('Osakkeiden myynnit')[1]
    const dateInput = editedRow.querySelector('input') as HTMLInputElement
    dateInput.focus()
    dateInput.value = '05.02.2025'
    dateInput.dispatchEvent(new window.Event('input', { bubbles: true }))

    expect(mainTableRows('Osakkeiden myynnit')[0]).toBe(dateInput.closest('tr'))
    expect(firstColumnTexts('Osakkeiden myynnit')[1]).toBe('06.02.2025')
    expect(dateInput.isConnected).toBe(true)
    expect(dateInput.value).toBe('05.02.2025')
    expect(document.activeElement).toBe(dateInput)
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

  it('uses current date in subscription vesting summary and became-listed date in ipo summary', async () => {
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
              vestingEndsOn: '10.06.2026',
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
          company: {
            listingStatus: 'unlisted',
            becameListedDate: '2026-06-05',
          },
          ipo: {
            totalShareCount: '100',
            totalIpoCost: '10',
            currentShareValue: '2',
            estimatedPreIpoValue: '100',
            estimatedSecondaryShareSellPercentage: '10',
          },
          ipoSell: {
            amount: '',
            otherAnnualCapitalGainsOrLosses: '',
          },
        })
      )

      await renderOsakkeetPage()
      toggleMainSection('subscriptionsAndSales')
      toggleMainSection('ipoCalculator')

      const textContent = normalizedText()
      expect(textContent).toContain('Ansaintajakson päättäneet osakkeet (03.06.2026)0.00 (0.00 %)')
      expect(textContent).toContain('Ansaintajakson piirissä olevat osakkeet (03.06.2026)10.00 (100.00 %)')
      expect(textContent).toContain('Myytävissä IPOssa (2026-06-05)0.00 (0.00 %)')
      expect(textContent).toContain('Ei myytävissä IPOssa (2026-06-05)10.00 (100.00 %)')
    } finally {
      vi.useRealTimers()
    }
  })
})
